import { useRef, useEffect } from 'react';
import { useAikaUI } from '../../contexts/AikaUIContext';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function Composer({ value, onChange, onSend, disabled }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ui = useAikaUI();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSend();
    }
  };

  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          ref={textareaRef}
          className="input"
          id="input"
          rows={1}
          placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const el = textareaRef.current;
            if (el) {
              const r = el.getBoundingClientRect();
              ui.setLookAt(
                { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 },
                10000
              );
            }
          }}
          onBlur={() => ui.setLookAt(null)}
          disabled={disabled}
        />
        <button
          type="button"
          className="send"
          id="btnSend"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            ui.setLookAt(
              { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 },
              1200
            );
            onSend();
          }}
          disabled={disabled || !value.trim()}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
