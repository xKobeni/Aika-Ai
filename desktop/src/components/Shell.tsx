import type { Message, ConnectionStatus as ConnectionStatusType } from '../types';

interface ShellProps {
  messages: Message[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  connectionStatus?: ConnectionStatusType;
  onReconnect?: () => void;
  isLoading?: boolean;
}

export function Shell({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus = 'disconnected',
  onReconnect,
  isLoading,
}: ShellProps) {
  const statusColor =
    connectionStatus === 'connected'
      ? 'var(--green)'
      : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
        ? 'var(--amber)'
        : 'var(--pink)';

  return (
    <div className="shell">
      <header className="shell__header">
        <h1 className="shell__title">Aika AI</h1>
        <div className="shell__status" style={{ color: statusColor }}>
          <span className="shell__status-dot" style={{ background: statusColor }} />
          {connectionStatus}
        </div>
        {connectionStatus === 'disconnected' && onReconnect && (
          <button type="button" className="shell__reconnect" onClick={onReconnect}>
            Reconnect
          </button>
        )}
      </header>

      <main className="shell__main">
        {messages.length === 0 && (
          <div className="shell__welcome">
            <p>Start a new conversation. Your UI starts here.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`shell__msg shell__msg--${m.role}`}>
            <span className="shell__msg-role">{m.role}</span>
            <div className="shell__msg-text">{m.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="shell__msg shell__msg--assistant">
            <span className="shell__msg-role">assistant</span>
            <div className="shell__msg-text shell__msg-text--loading">Thinking…</div>
          </div>
        )}
      </main>

      <footer className="shell__footer">
        <textarea
          className="shell__input"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="button"
          className="shell__send"
          onClick={onSend}
          disabled={isLoading || !prompt.trim()}
        >
          Send
        </button>
      </footer>
    </div>
  );
}
