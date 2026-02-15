import { useRef, useEffect, useState } from 'react';
import { useAikaUI } from '../../contexts/AikaUIContext';
import { toast } from '../../lib/toast';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onAttachFiles?: (files: File[]) => void;
  attachmentCount?: number;
}

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  onAttachFiles,
  attachmentCount = 0,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const ui = useAikaUI();

  useEffect(() => {
    if (!addMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      const el = addMenuRef.current;
      if (el && !el.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [addMenuOpen]);

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

  const openAddMenu = () => {
    if (disabled || !onAttachFiles) return;
    setAddMenuOpen((v) => !v);
  };

  const handleAddPhotosAndFiles = () => {
    setAddMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleComingSoon = (label: string) => {
    setAddMenuOpen(false);
    toast(`${label} — coming soon`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length && onAttachFiles) {
      onAttachFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const toggleVoice = () => {
    ui.updateSettings({ voice: !ui.settings.voice });
  };

  const hasVoice =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="composer">
      <div className="composer-bar">
        {onAttachFiles && (
          <div className="composer-addWrap" ref={addMenuRef}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="composer-file-input"
              aria-hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={`composer-iconBtn ${addMenuOpen ? 'composer-iconBtn--active' : ''}`}
              onClick={openAddMenu}
              disabled={disabled}
              title="Add"
              aria-label="Add"
              aria-expanded={addMenuOpen}
              aria-haspopup="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {attachmentCount > 0 && (
                <span className="composer-attachBadge">{attachmentCount}</span>
              )}
            </button>
            {addMenuOpen && (
              <div className="composer-addMenu" role="menu">
                <button
                  type="button"
                  className="composer-addItem"
                  role="menuitem"
                  onClick={handleAddPhotosAndFiles}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </span>
                  Add photos & files
                </button>
                <div className="composer-addSeparator" aria-hidden />
                <button
                  type="button"
                  className="composer-addItem"
                  role="menuitem"
                  onClick={() => handleComingSoon('Create image')}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  Create image
                </button>
                <button
                  type="button"
                  className="composer-addItem"
                  role="menuitem"
                  onClick={() => handleComingSoon('Agent mode')}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </span>
                  Agent mode
                </button>
                <button
                  type="button"
                  className="composer-addItem"
                  role="menuitem"
                  onClick={() => handleComingSoon('Add sources')}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  Add sources
                </button>
                <button
                  type="button"
                  className="composer-addItem"
                  role="menuitem"
                  onClick={() => handleComingSoon('Study and learn')}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <line x1="8" y1="7" x2="16" y2="7" />
                      <line x1="8" y1="11" x2="16" y2="11" />
                    </svg>
                  </span>
                  Study and learn
                </button>
                <button
                  type="button"
                  className="composer-addItem composer-addItem--more"
                  role="menuitem"
                  onClick={() => handleComingSoon('More')}
                >
                  <span className="composer-addIcon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </span>
                  More
                  <svg className="composer-addChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
        <div className="composer-inputWrap">
          <textarea
            ref={textareaRef}
            className="composer-input"
            id="input"
            rows={1}
            placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
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
        </div>
        <div className="composer-actions">
          {hasVoice && (
            <button
              type="button"
              className={`composer-iconBtn ${ui.settings.voice ? 'composer-iconBtn--active' : ''}`}
              onClick={toggleVoice}
              title={ui.settings.voice ? 'Voice on (click to turn off)' : 'Voice off (click to turn on)'}
              aria-label={ui.settings.voice ? 'Voice input on' : 'Voice input off'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="composer-send"
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
            title="Send"
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
