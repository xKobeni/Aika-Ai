import { useRef, useEffect } from 'react';
import type { Message } from '../../types';

interface MessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function Messages({ messages, isLoading }: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isLoading]);

  return (
    <div ref={scrollRef} className="messages" id="messages" aria-live="polite">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`bubbleRow ${m.role === 'user' ? 'userRow' : 'aiRow'}`}
        >
          <div className={`bubble ${m.role === 'user' ? 'userBubble' : 'aiBubble'}`}>
            <div className="meta">
              <span>{m.role === 'user' ? 'You' : 'Aika'}</span>
              <span>{m.time}</span>
            </div>
            <div className="text">{m.text}</div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="bubbleRow aiRow">
          <div className="bubble aiBubble">
            <div className="meta">
              <span>Aika</span>
              <span>…</span>
            </div>
            <div className="text">Thinking…</div>
          </div>
        </div>
      )}
    </div>
  );
}
