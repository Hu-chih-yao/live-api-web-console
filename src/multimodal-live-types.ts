import { Content, LiveClientToolResponse, LiveServerContent, LiveServerToolCall, LiveServerToolCallCancellation, Part } from "@google/genai";

export interface ClientContentMessage {
  clientContent: {
    turns: { parts: Part[] }[];
    turnComplete: boolean;
  };
}

export interface ServerContentMessage {
  serverContent: LiveServerContent;
}

export interface ToolCallMessage {
  toolCall: LiveServerToolCall;
}

export interface ToolCallCancellationMessage {
  toolCallCancellation: LiveServerToolCallCancellation;
}

export interface ToolResponseMessage {
  toolResponse: LiveClientToolResponse;
}

export interface StreamingLog {
  date: Date;
  type: string;
  count?: number;
  message: string | ClientContentMessage | ServerContentMessage | ToolCallMessage | ToolCallCancellationMessage | ToolResponseMessage;
}

export function isClientContentMessage(message: any): message is ClientContentMessage {
  return message && 'clientContent' in message;
}

export function isServerContentMessage(message: any): message is ServerContentMessage {
  return message && 'serverContent' in message;
}

export function isToolCallMessage(message: any): message is ToolCallMessage {
  return message && 'toolCall' in message;
}

export function isToolCallCancellationMessage(message: any): message is ToolCallCancellationMessage {
  return message && 'toolCallCancellation' in message;
}

export function isToolResponseMessage(message: any): message is ToolResponseMessage {
  return message && 'toolResponse' in message;
}

export function isModelTurn(content: LiveServerContent): content is LiveServerContent & { modelTurn: Content } {
  return content && 'modelTurn' in content;
}

export function isInterrupted(content: LiveServerContent): boolean {
  return content && 'interrupted' in content;
}

export function isTurnComplete(content: LiveServerContent): boolean {
  return content && 'turnComplete' in content;
}