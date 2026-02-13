/**
 * Chat API integration - replaces simulateAssistant
 * Handles real backend API calls with streaming support
 */

import { chatMessage, chatMessageStream, analyzeImage, type ChatRequest, type VisionRequest } from './api';
import type { Message, ToolLogEntry } from '../types';
import { nowTime } from './utils';

export interface ChatApiParams {
  message: string;
  sessionId: string | null;
  attachments: Array<{ name: string; size: number; type?: string }>;
  streamEnabled: boolean;
  onAddAssistantMessage: (text: string, options?: Partial<Pick<Message, 'badges' | 'toolCalls'>>) => void;
  onPushToolLog: (entry: ToolLogEntry) => void;
  onUpdateSessionId: (sessionId: string) => void;
  onError: (error: Error) => void;
  onStreamingStart?: () => void;
  onStreamingUpdate?: (text: string) => void;
  onStreamingEnd?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Send a chat message and handle the response
 */
export async function sendChatMessage(params: ChatApiParams): Promise<void> {
  const {
    message,
    sessionId,
    streamEnabled,
    onAddAssistantMessage,
    onPushToolLog,
    onUpdateSessionId,
    onError,
    onStreamingStart,
    onStreamingUpdate,
    onStreamingEnd,
    onLoadingChange,
  } = params;

  try {
    onLoadingChange?.(true);
    const request: ChatRequest = {
      message,
      session_id: sessionId || undefined,
    };

    if (streamEnabled) {
      // Use streaming API
      onStreamingStart?.();
      await handleStreamingResponse(request, {
        onAddAssistantMessage,
        onPushToolLog,
        onUpdateSessionId,
        onError,
        onStreamingUpdate,
        onStreamingEnd,
      });
    } else {
      // Use regular API
      const response = await chatMessage(request);
      
      // Update session ID
      if (response.session_id) {
        onUpdateSessionId(response.session_id);
      }

      // Handle tool usage
      const toolCalls: Message['toolCalls'] = [];
      if (response.tool_used && response.tool_result) {
        toolCalls.push({
          name: response.tool_used.tool,
          status: 'ok',
          payload: JSON.stringify({
            args: response.tool_used.args,
            result: response.tool_result,
          }, null, 2),
        });

        onPushToolLog({
          name: response.tool_used.tool,
          payload: JSON.stringify({
            args: response.tool_used.args,
            result: response.tool_result,
          }, null, 2),
          time: nowTime(),
        });
      }

      // Handle learned facts
      const badges: Message['badges'] = [{ text: 'Local', kind: 'good' }];
      if (response.learned_facts && response.learned_facts.length > 0) {
        badges.push({ text: `Learned ${response.learned_facts.length} fact(s)`, kind: 'neutral' });
      }

      onAddAssistantMessage(response.reply, {
        badges,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  } finally {
    onLoadingChange?.(false);
  }
}

/**
 * Handle streaming response from Server-Sent Events
 */
async function handleStreamingResponse(
  request: ChatRequest,
  callbacks: {
    onAddAssistantMessage: (text: string, options?: Partial<Pick<Message, 'badges' | 'toolCalls'>>) => void;
    onPushToolLog: (entry: ToolLogEntry) => void;
    onUpdateSessionId: (sessionId: string) => void;
    onError: (error: Error) => void;
    onStreamingUpdate?: (text: string) => void;
    onStreamingEnd?: () => void;
  }
): Promise<void> {
  const {
    onAddAssistantMessage,
    onPushToolLog,
    onUpdateSessionId,
    onError,
    onStreamingUpdate,
    onStreamingEnd,
  } = callbacks;
  
  let accumulatedText = '';
  let sessionId: string | null = null;
  let toolUsed: any = null;
  let toolResult: any = null;
  let learnedFacts: string[] = [];
  let messageCreated = false;

  try {
    for await (const event of chatMessageStream(request)) {
      if (event.type === 'chunk') {
        // Accumulate streaming text
        accumulatedText += event.text || '';
        // Update message in real-time
        onStreamingUpdate?.(accumulatedText);
      } else if (event.type === 'done') {
        // Final response
        if (event.session_id) {
          sessionId = event.session_id;
          onUpdateSessionId(sessionId);
        }

        const finalText = event.reply || accumulatedText;
        toolUsed = event.tool_used;
        toolResult = event.tool_result;
        learnedFacts = event.learned_facts || [];

        // Handle tool usage
        const toolCalls: Message['toolCalls'] = [];
        if (toolUsed && toolResult) {
          toolCalls.push({
            name: toolUsed.tool,
            status: 'ok',
            payload: JSON.stringify({
              args: toolUsed.args,
              result: toolResult,
            }, null, 2),
          });

          onPushToolLog({
            name: toolUsed.tool,
            payload: JSON.stringify({
              args: toolUsed.args,
              result: toolResult,
            }, null, 2),
            time: nowTime(),
          });
        }

        // Handle learned facts
        const badges: Message['badges'] = [{ text: 'Local', kind: 'good' }];
        if (learnedFacts.length > 0) {
          badges.push({ text: `Learned ${learnedFacts.length} fact(s)`, kind: 'neutral' });
        }

        onAddAssistantMessage(finalText, {
          badges,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        });
        messageCreated = true;
        onStreamingEnd?.();
        break;
      } else if (event.type === 'error') {
        throw new Error(event.message || 'Unknown error from stream');
      }
    }
  } catch (error) {
    // If we were streaming but didn't create a message, create an error message
    if (!messageCreated && accumulatedText) {
      onAddAssistantMessage(accumulatedText, {
        badges: [{ text: 'Incomplete', kind: 'neutral' }],
      });
    }
    onStreamingEnd?.();
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Send vision/image analysis request
 */
export async function sendVisionMessage(
  message: string,
  imageFile: File,
  onAddAssistantMessage: (text: string, options?: Partial<Pick<Message, 'badges' | 'toolCalls'>>) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const request: VisionRequest = {
      message,
      image: imageFile,
    };

    const response = await analyzeImage(request);

    const badges: Message['badges'] = [
      { text: 'Vision', kind: 'good' },
      { text: response.model, kind: 'neutral' },
    ];

    const toolCalls: Message['toolCalls'] = [];
    if (response.tool_used && response.tool_result) {
      toolCalls.push({
        name: response.tool_used.tool,
        status: 'ok',
        payload: JSON.stringify({
          args: response.tool_used.args,
          result: response.tool_result,
        }, null, 2),
      });
    }

    onAddAssistantMessage(response.reply, {
      badges,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
