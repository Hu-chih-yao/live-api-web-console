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

import cn from "classnames";
import { useEffect, useRef, useState } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useSoapNote } from "../../contexts/SoapNoteContext";
import Logger, { LoggerFilterType } from "../logger/Logger";
import ProductionLogger from "../logger/ProductionLogger";
import SoapNote from "../soap-notes/SoapNote";
import "./side-panel.scss";

// Enum for the different panel tabs
enum PanelTab {
  CHAT = 'chat',
  SOAP_NOTE = 'medical_note'
}

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(false);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();
  const { updateSoapNote, hasChanges } = useSoapNote();
  const [devMode, setDevMode] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>(PanelTab.CHAT);
  const [notePulse, setNotePulse] = useState(false);

  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  //scroll the log to the bottom when new logs come in
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  // listen for log events and store them
  useEffect(() => {
    client.on("log", log);
    
    // Function to look for SOAP note updates in the logs
    const checkForSoapNoteUpdates = (logData: any) => {
      // Check if this log contains a SOAP note function call or response
      if (logData && logData.serverContent && logData.serverContent.modelTurn) {
        const { parts } = logData.serverContent.modelTurn;
        if (parts && Array.isArray(parts)) {
          // Look for function call or response parts
          parts.forEach(part => {
            // Check for function calls
            if (part.functionCall && part.functionCall.name === "update_soap_note") {
              const args = part.functionCall.args;
              if (args) {
                updateSoapNote(args);
                
                // Show a notification on the SOAP note tab if not active
                if (activeTab !== PanelTab.SOAP_NOTE) {
                  setNotePulse(true);
                  setTimeout(() => setNotePulse(false), 2000);
                }
              }
            }
            
            // Check for function responses
            if (part.functionResponse && part.functionResponse.name === "update_soap_note") {
              const response = part.functionResponse.response?.output;
              if (response && response.success && response.soapNoteData) {
                updateSoapNote(response.soapNoteData);
                
                // Show a notification on the SOAP note tab if not active
                if (activeTab !== PanelTab.SOAP_NOTE) {
                  setNotePulse(true);
                  setTimeout(() => setNotePulse(false), 2000);
                }
              }
            }
          });
        }
      }
      
      // Also try to extract information from user and AI messages to update the SOAP note
      // This is for when the AI doesn't explicitly call the function but we still want to track info
      if (logData) {
        // Extract from user messages
        if (logData.userMessage && typeof logData.userMessage.text === 'string') {
          const userText = logData.userMessage.text.trim();
          if (userText.length > 0) {
            // Remove message length requirement - update immediately with any text
            // Don't add technical code to the SOAP note
            if (!userText.includes('print(') && !userText.includes('code') && !userText.includes('function')) {
              updateSoapNote({
                subjective: userText
              });
              
              // Try to identify chief complaint if one doesn't exist yet
              if (!hasChanges) {
                updateSoapNote({
                  chiefComplaint: userText
                });
              }
            }
          }
        }
        
        // Extract from AI responses
        if (logData.serverContent && logData.serverContent.modelTurn && 
            logData.serverContent.modelTurn.parts) {
          const aiParts = logData.serverContent.modelTurn.parts;
          let aiText = '';
          
          aiParts.forEach((part: any) => {
            // Only include text parts, not code or other content
            if (part.text && !part.executableCode && !part.codeExecutionResult) {
              aiText += part.text + ' ';
            }
          });
          
          if (aiText.trim().length > 0) {
            // Simple heuristics to identify assessment and plan from AI responses
            if (aiText.includes('diagnos') || aiText.includes('condition') || 
                aiText.includes('assessment') || aiText.includes('likely')) {
              // This might be assessment information
              updateSoapNote({
                assessment: aiText
              });
            }
            
            if (aiText.includes('recommend') || aiText.includes('suggest') || 
                aiText.includes('should') || aiText.includes('treatment') || 
                aiText.includes('medication') || aiText.includes('prescription')) {
              // This might be plan information
              updateSoapNote({
                plan: aiText
              });
            }
          }
        }
      }
    };
    
    // Add our custom log handler
    client.on("log", checkForSoapNoteUpdates);
    
    return () => {
      client.off("log", log);
      client.off("log", checkForSoapNoteUpdates);
    };
  }, [client, log, updateSoapNote, activeTab, hasChanges]);

  const handleSubmit = () => {
    client.send([{ text: textInput }]);

    setTextInput("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  const toggleDevMode = () => {
    setDevMode(!devMode);
  };
  
  // Handle tab change
  const handleTabChange = (tab: PanelTab) => {
    setActiveTab(tab);
    // Clear notification when switching to the SOAP note tab
    if (tab === PanelTab.SOAP_NOTE) {
      setNotePulse(false);
    }
  };

  return (
    <div className={`side-panel ${open ? "open" : ""}`}>
      <header className="top">
        <h2>
          {open && (activeTab === PanelTab.CHAT ? 'Chat History' : 'Medical Note')}
        </h2>
        {open ? (
          <button className="opener" onClick={() => setOpen(false)}>
            <RiSidebarFoldLine color="var(--primary-purple)" />
          </button>
        ) : (
          <button className="opener" onClick={() => setOpen(true)}>
            <RiSidebarUnfoldLine color="var(--primary-purple)" />
          </button>
        )}
      </header>
      
      {open && (
        <>
          <section className="tab-selector">
            <button 
              className={`tab-button ${activeTab === PanelTab.CHAT ? 'active' : ''}`}
              onClick={() => handleTabChange(PanelTab.CHAT)}
            >
              Chat
            </button>
            <button 
              className={`tab-button ${activeTab === PanelTab.SOAP_NOTE ? 'active' : ''} ${notePulse ? 'pulse' : ''}`}
              onClick={() => handleTabChange(PanelTab.SOAP_NOTE)}
            >
              Medical Note
              {hasChanges && activeTab !== PanelTab.SOAP_NOTE && (
                <span className="notification-dot"></span>
              )}
            </button>
          </section>
          
          <section className="indicators">
            <div className="dev-mode-toggle">
              <button 
                className={`dev-toggle-btn ${devMode ? 'active' : ''}`} 
                onClick={toggleDevMode}
              >
                {devMode ? "Developer Mode" : "Simple Mode"}
              </button>
            </div>
            <div className={cn("streaming-indicator", { connected })}>
              {connected
                ? `🟢${open ? " Connected" : ""}`
                : `⚪${open ? " Disconnected" : ""}`}
            </div>
          </section>
        </>
      )}
      
      <div className="side-panel-container" ref={loggerRef}>
        {open && activeTab === PanelTab.CHAT ? (
          // Show chat interface
          devMode ? <Logger filter="none" /> : <ProductionLogger />
        ) : open && activeTab === PanelTab.SOAP_NOTE ? (
          // Show SOAP note interface
          <SoapNote isVisible={true} />
        ) : null}
      </div>
      
      {open && activeTab === PanelTab.CHAT && (
        <div className={cn("input-container", { disabled: !connected })}>
          <div className="input-content">
            <textarea
              className="input-area"
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
              onChange={(e) => setTextInput(e.target.value)}
              value={textInput}
              placeholder="Type something here..."
            ></textarea>

            <button
              className="send-button material-symbols-outlined filled"
              onClick={handleSubmit}
            >
              send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
