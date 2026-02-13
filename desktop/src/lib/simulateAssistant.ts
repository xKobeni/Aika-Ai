import type { Message } from '../types';
import { nowTime } from './utils';

export interface SimulateAssistantParams {
  userText: string;
  lastMessageAttachments: AttachmentLike[];
  enabledToolIds: string[];
  memoryEnabled: boolean;
  activeAgentName: string;
  onAddMemory: (fact: string) => void;
  onPushToolLog: (entry: { name: string; payload: string; time: string }) => void;
  onAddAssistantMessage: (text: string, options?: Partial<Pick<Message, 'badges' | 'toolCalls'>>) => void;
}

interface AttachmentLike {
  name: string;
  size?: number;
}

export function simulateAssistant({
  userText,
  lastMessageAttachments,
  enabledToolIds,
  memoryEnabled,
  activeAgentName,
  onAddMemory,
  onPushToolLog,
  onAddAssistantMessage,
}: SimulateAssistantParams): void {
  const toolCalls: Message['toolCalls'] = [];

  if (enabledToolIds.includes('memory') && memoryEnabled && /remember|save this/i.test(userText)) {
    const fact = userText.replace(/remember|save this/i, '').trim() || 'User provided a preference.';
    onAddMemory(fact);
    toolCalls.push({
      name: 'memory.store',
      status: 'saved',
      payload: JSON.stringify({ fact }, null, 2),
    });
    onPushToolLog({
      name: 'memory.store',
      payload: JSON.stringify({ fact }, null, 2),
      time: nowTime(),
    });
  }

  if (enabledToolIds.includes('files') && lastMessageAttachments.length > 0) {
    const names = lastMessageAttachments.map((a) => a.name);
    toolCalls.push({
      name: 'files.inspect',
      status: 'ok',
      payload: JSON.stringify({ files: names }, null, 2),
    });
    onPushToolLog({
      name: 'files.inspect',
      payload: JSON.stringify({ files: names }, null, 2),
      time: nowTime(),
    });
  }

  const reply = `I'm ready. Here's what I can do in your Aika UI:

• Use an agent (${activeAgentName}) with badges in the bubble
• Show tool calls as expandable cards (like you see below)
• Keep local memory ${memoryEnabled ? 'enabled' : 'disabled'}
• Display attached files as chips and in the Files panel

Want the chat to look more "assistant-like" (Markdown code blocks, tables, inline buttons), or more minimal?`;

  onAddAssistantMessage(reply, { toolCalls });
}
