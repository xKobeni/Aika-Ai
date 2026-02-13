import { useRef, useEffect } from 'react';
import type { Message } from '../../types';
import type { ReactNode } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './StreamingIndicator';
import { IdleOrb } from './IdleOrb';

interface ChatAreaProps {
  active: boolean;
  messages: Message[];
  composer: ReactNode;
  isStreaming?: boolean;
  agentName?: string;
}

export function ChatArea({ active, messages, composer, isStreaming, agentName }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isStreaming]);

  return (
    <section className={`chat ${active ? 'is-active' : ''}`}>
      <div className="chat__ambient" aria-hidden="true" />
      <div
        className="chat__scroll"
        ref={scrollRef}
        aria-label="Conversation"
      >
        {!hasMessages && (
          <div className="chat__idleOrbWrap">
            <IdleOrb />
          </div>
        )}
        {!hasMessages && (
          <div className="chat__empty">
            <div className="chat__emptyTitle">
              {greeting}, I&apos;m Aika.
            </div>
            <div className="chat__emptySubtitle">
              Your local AI assistant for building, debugging, and exploring ideas. What would you like to work on
              today?
            </div>
            <div className="chat__emptyChips">
              <button type="button" className="chatChip">
                ✦ Review my project structure
              </button>
              <button type="button" className="chatChip">
                ✦ Help me plan a feature
              </button>
              <button type="button" className="chatChip">
                ✦ Explain a piece of code
              </button>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isStreaming && <TypingIndicator agentName={agentName} />}
      </div>
      {composer}
    </section>
  );
}
