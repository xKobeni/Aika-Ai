import { useRef, useEffect } from 'react';
import type { Message } from '../../types';

interface MessagesProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
}

export function Messages({ messages, isLoading, isStreaming = false, streamingText = '' }: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isStreaming) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, isLoading, isStreaming, streamingText]);

  const lastIsAssistantStreaming =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    isStreaming;

  return (
    <div ref={scrollRef} className="messages" id="messages" aria-live="polite">
      {messages.map((m, i) => {
        const isStreamingThis = lastIsAssistantStreaming && i === messages.length - 1;
        return (
          <div
            key={i}
            className={`bubbleRow ${m.role === 'user' ? 'userRow' : 'aiRow'}`}
          >
            <div className={`bubble ${m.role === 'user' ? 'userBubble' : 'aiBubble'}`}>
              <div className="meta">
                <span>{m.role === 'user' ? 'You' : 'Aika'}</span>
                <span>
                  {isStreamingThis ? (
                    <>
                      Typing…
                      <span className="typingDot" aria-hidden />
                    </>
                  ) : (
                    m.time
                  )}
                </span>
              </div>
              <div className="text">{m.text}</div>
            </div>
          </div>
        );
      })}
      {isStreaming && (
        <div className="bubbleRow aiRow">
          <div className="bubble aiBubble">
            <div className="meta">
              <span>Aika</span>
              <span>
                Typing…
                <span className="typingDot" aria-hidden />
              </span>
            </div>
            <div className="text streamingText">
              {streamingText || '…'}
              <span className="streamingCursor" aria-hidden />
            </div>
          </div>
        </div>
      )}
      {isLoading && !isStreaming && (
        <div className="bubbleRow aiRow">
          <div className="bubble aiBubble">
            <div className="meta">
              <span>Aika</span>
              <span>
                Thinking…
                <span className="typingDot" aria-hidden />
              </span>
            </div>
            <div className="text">Thinking…</div>
          </div>
        </div>
      )}
    </div>
  );
}
