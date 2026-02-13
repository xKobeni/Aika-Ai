export interface Agent {
  id: string;
  name: string;
  desc: string;
  skills: string[];
  icon: string;
}

export interface Tool {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type?: string;
}

export interface ToolLogEntry {
  name: string;
  payload: string;
  time: string;
}

export interface MessageBadge {
  text: string;
  kind: 'good' | 'neutral';
}

export interface ToolCall {
  name: string;
  status?: string;
  payload?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  time: string;
  badges?: MessageBadge[];
  toolCalls?: ToolCall[];
  attachments?: Attachment[];
  agentName?: string;
  agentIcon?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  preview?: string;
  messageCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ImageAttachment extends Attachment {
  url?: string;
  width?: number;
  height?: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

export interface ToolCallResult {
  tool: string;
  args: Record<string, any>;
  result: Record<string, any>;
  status: 'queued' | 'running' | 'success' | 'error';
  executionTime?: number;
  error?: string;
}
