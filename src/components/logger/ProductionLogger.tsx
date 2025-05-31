/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./production-logger.scss";

import { Part } from "@google/generative-ai";
import cn from "classnames";
import { ReactNode, useEffect, useState } from "react";
import { useLoggerStore } from "../../lib/store-logger";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FaSearch, FaNotesMedical, FaStethoscope } from "react-icons/fa"; // Import icons
import {
  ClientContentMessage,
  isClientContentMessage,
  isModelTurn,
  isServerContentMessage,
  isToolCallMessage,
  isToolResponseMessage,
  ServerContentMessage,
  StreamingLog,
  ToolCallMessage,
  ToolResponseMessage,
} from "../../multimodal-live-types";

// Create a type for our clean conversation entries
type ConversationEntry = {
  id: number;
  type: 'user' | 'ai' | 'tool' | 'tool-response';
  content: ReactNode;
  timestamp: Date;
  toolName?: string;
};

const formatTime = (d: Date) => d.toLocaleTimeString().slice(0, -3);

// Helper to create a patient-friendly message for tool calls
const getPatientFriendlyToolMessage = (toolName: string, args?: any): ReactNode => {
  if (toolName === "medvisor_search" || toolName === "googleSearch") {
    let searchQuery = "medical information";
    if (args && args.query) {
      searchQuery = args.query;
    }
    
    return (
      <div className="friendly-tool-message">
        <FaSearch className="tool-icon" />
        <span>Doctor is researching information about <strong>{searchQuery}</strong></span>
      </div>
    );
  } else if (toolName === "update_soap_note") {
    // Extract useful information from the args if available
    let noteMessage = "Doctor is updating your medical notes...";
    
    if (args) {
      if (args.chiefComplaint) {
        noteMessage = `Doctor has noted your chief complaint: "<strong>${args.chiefComplaint}</strong>"`;
      } else if (args.subjective) {
        const shortSubjective = args.subjective.length > 50 
          ? args.subjective.substring(0, 50) + "..." 
          : args.subjective;
        noteMessage = `Doctor has recorded your symptoms: "<strong>${shortSubjective}</strong>"`;
      } else if (args.assessment) {
        noteMessage = `Doctor is documenting assessment in your medical note`;
      } else if (args.plan) {
        noteMessage = `Doctor is adding treatment recommendations to your medical note`;
      } else if (args.icdCodes && Array.isArray(args.icdCodes) && args.icdCodes.length > 0) {
        noteMessage = `Doctor is adding medical codes to your documentation`;
      }
    }
    
    return (
      <div className="friendly-tool-message">
        <FaNotesMedical className="tool-icon" />
        <span dangerouslySetInnerHTML={{ __html: noteMessage }}></span>
      </div>
    );
  } else if (toolName === "dailymed_api") {
    let medicationName = "medication details";
    if (args && args.search_term) {
      medicationName = args.search_term;
    }
    
    return (
      <div className="friendly-tool-message">
        <FaStethoscope className="tool-icon" />
        <span>Doctor is looking up information about <strong>{medicationName}</strong></span>
      </div>
    );
  }
  
  // Default message for other tools
  return (
    <div className="friendly-tool-message">
      <FaStethoscope className="tool-icon" />
      <span>Doctor is consulting medical resources...</span>
    </div>
  );
};

// Hide code components and only show text
const RenderPart = ({ part }: { part: Part }) => {
  if (part.text && part.text.length) {
    // Ignore messages that appear to be code or technical info
    if (part.text.includes('print(') || part.text.startsWith('Code:') || 
        part.text.includes('Result:') || part.text.includes('OUTCOME_')) {
      return null;
    }
    return <p className="part part-text">{part.text}</p>;
  }
  
  // Don't show code or other components in simple mode
  return null;
};

export default function ProductionLogger() {
  const { logs } = useLoggerStore();
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [lastToolType, setLastToolType] = useState<string | null>(null);
  
  // Process logs to create a clean conversation
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const processedConversation: ConversationEntry[] = [];
    const uniqueKeys = new Set<string>();
    
    // Track "thinking" state
    let aiResponseInProgress = false;
    
    logs.forEach((log, index) => {
      // Generate a unique key for this message
      const logType = log.type;
      const message = log.message;
      const timestamp = log.date;
      
      if (isClientContentMessage(message)) {
        // Handle user messages
        const { clientContent } = message as ClientContentMessage;
        const { turns } = clientContent;
        
        // Skip empty messages
        if (!turns || turns.length === 0) return;
        
        const parts = turns.flatMap(turn => 
          turn.parts.filter(part => !(part.text && part.text.trim() === ""))
        );
        
        // If no meaningful parts, skip
        if (parts.length === 0) return;
        
        const userMessageContent = (
          <div className="user-message">
            {parts.map((part, j) => (
              <RenderPart part={part} key={`user-part-${j}`} />
            ))}
          </div>
        );
        
        const key = `user-${timestamp.getTime()}-${index}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          processedConversation.push({
            id: index,
            type: 'user',
            content: userMessageContent,
            timestamp
          });
          
          // When user message is sent, AI is thinking
          aiResponseInProgress = true;
          setIsThinking(true);
        }
      } 
      else if (isServerContentMessage(message)) {
        // AI responses
        const serverContent = (message as ServerContentMessage).serverContent;
        
        if (isModelTurn(serverContent)) {
          // This is an AI response
          const { modelTurn } = serverContent;
          const { parts } = modelTurn;
          
          // Ignore empty messages
          if (!parts || parts.length === 0) return;
          
          // Only keep parts that contain actual text content (not code)
          const filteredParts = parts.filter(part => {
            if (!part.text || part.text.trim() === "") return false;
            
            // Skip parts that look like code or technical information
            if (part.text.includes('print(') || 
                part.text.startsWith('Code:') || 
                part.text.includes('Result:') || 
                part.text.includes('OUTCOME_') ||
                part.text.includes('default_api')) {
              return false;
            }
            
            return true;
          });
          
          // If no visible parts remain after filtering, skip this message entirely
          if (filteredParts.length === 0) return;
          
          const aiMessageContent = (
            <div className="ai-message">
              {filteredParts.map((part, j) => (
                <RenderPart part={part} key={`ai-part-${j}`} />
              ))}
            </div>
          );
          
          // Skip adding empty AI messages that have no visible content
          const hasVisibleContent = filteredParts.some(part => 
            part.text && !part.text.includes('print(') && 
            !part.text.startsWith('Code:') && 
            !part.text.includes('Result:') && 
            !part.text.includes('OUTCOME_')
          );
          
          if (!hasVisibleContent) return;
          
          const key = `ai-${timestamp.getTime()}-${index}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            processedConversation.push({
              id: index,
              type: 'ai',
              content: aiMessageContent,
              timestamp
            });
            
            // AI has responded, no longer thinking
            aiResponseInProgress = false;
            setIsThinking(false);
            setLastToolType(null); // Reset tool type after AI responds
          }
        }
      }
      else if (isToolCallMessage(message)) {
        // Tool usage
        const { toolCall } = message as ToolCallMessage;
        
        if (!toolCall.functionCalls || toolCall.functionCalls.length === 0) return;
        
        const functionCall = toolCall.functionCalls[0]; // Get the first function call
        const toolName = functionCall.name;
        setLastToolType(toolName); // Save the tool type
        
        // Friendly version for patients with args for context
        const friendlyToolContent = getPatientFriendlyToolMessage(toolName, functionCall.args);
        
        const key = `tool-${timestamp.getTime()}-${index}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          processedConversation.push({
            id: index,
            type: 'tool',
            content: friendlyToolContent,
            timestamp,
            toolName
          });
        }
      }
      else if (isToolResponseMessage(message)) {
        // Tool response - hidden in simple mode, so we don't need to show it
        // Keep empty so Patient Mode doesn't see technical responses
      }
    });
    
    // Sort by timestamp
    processedConversation.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    setConversation(processedConversation);
    
    // Update thinking state based on the last log message
    const latestLog = logs[logs.length - 1];
    if (latestLog && isServerContentMessage(latestLog.message)) {
      // If we got a server message, we're no longer thinking
      setIsThinking(false);
    }
    
  }, [logs]);

  return (
    <div className="production-logger-container">
      {conversation.length === 0 && (
        <div className="empty-conversation">
          <div className="welcome-message">
            <h3>Welcome to your medical consultation</h3>
            <p>Your conversation with the doctor will appear here, and all important details will be captured in your Medical Note.</p>
          </div>
        </div>
      )}
      {conversation.map((entry) => (
        <div
          key={`entry-${entry.id}`}
          className={cn("conversation-entry", {
            "user-entry": entry.type === "user",
            "ai-entry": entry.type === "ai",
            "tool-entry": entry.type === "tool",
            "response-entry": entry.type === "tool-response",
          })}
        >
          <div className="entry-header">
            <span className="entry-role">
              {entry.type === "user" ? "You" : 
               entry.type === "ai" ? "Doctor" : 
               ""}
            </span>
            <span className="entry-time">{formatTime(entry.timestamp)}</span>
          </div>
          <div className="entry-content">{entry.content}</div>
        </div>
      ))}
      {isThinking && (
        <div className="thinking-indicator">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="typing-text">
            {lastToolType ? 
              getPatientFriendlyToolMessage(lastToolType) : 
              "Doctor is typing..."}
          </div>
        </div>
      )}
    </div>
  );
} 