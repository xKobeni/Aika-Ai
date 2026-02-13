import type { Message } from '../../types';
import { formatRichText, fmtBytes } from '../../lib/utils';
import { Pill } from '../ui';
import { EnhancedToolCall } from './EnhancedToolCall';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const avatar = isUser ? '🧑' : (message.agentIcon ?? '✦');
  const name = isUser ? 'You' : (message.agentName ?? 'Aika');

  return (
    <div className={`msg ${isUser ? 'msg--user' : ''}`}>
      <div className="msg__avatar">{avatar}</div>
      <div className="msg__body">
        <div className="msg__meta">
          <div className="msg__who">
            <div className="name">{name}</div>
            <div className="time">{message.time}</div>
          </div>
          <div className="badges">
            {(message.badges ?? []).map((b, i) => (
              <Pill key={i} variant={b.kind === 'good' ? 'green' : 'default'}>
                {b.text}
              </Pill>
            ))}
          </div>
        </div>

        <div className="bubble">
          <p dangerouslySetInnerHTML={{ __html: formatRichText(message.text) }} />

          {message.attachments && message.attachments.length > 0 && (
            <div className="attachRow">
              {message.attachments.map((f) => {
                // Check if it's an image attachment
                if (f.type?.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                  return (
                    <div key={f.id} className="fileChip fileChip--image">
                      <img
                        src={(f as any).url || URL.createObjectURL(new Blob())}
                        alt={f.name}
                        className="fileChip__image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span>{f.name}</span>
                      <span className="fileChip__meta">{fmtBytes(f.size)}</span>
                    </div>
                  );
                }
                return (
                  <div key={f.id} className="fileChip">
                    📎 <span>{f.name}</span>{' '}
                    <span className="fileChip__meta">{fmtBytes(f.size)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {message.toolCalls && message.toolCalls.length > 0 &&
            message.toolCalls.map((tc, i) => (
              <EnhancedToolCall key={i} toolCall={tc} />
            ))}
        </div>
      </div>
    </div>
  );
}
