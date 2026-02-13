import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import type { KeyboardEvent, ChangeEvent, DragEvent } from 'react';
import { Toggle } from '../ui';
import { fmtBytes, uid } from '../../lib/utils';
import type { Attachment, ImageAttachment } from '../../types';
import { ImageUploader } from './ImageUploader';
import { VoiceOrb } from './VoiceOrb';

interface ComposerProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  streamEnabled: boolean;
  onStreamToggle: (v: boolean) => void;
  safeEnabled: boolean;
  onSafeToggle: (v: boolean) => void;
  activeAgentName: string;
  toolsCount: number;
  memoryState: string;
  onAgentClick: () => void;
  onToolsClick: () => void;
  onMemoryClick: () => void;
  attachments: Attachment[];
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  imageAttachments?: ImageAttachment[];
  onAddImages?: (images: ImageAttachment[]) => void;
  onRemoveImage?: (id: string) => void;
  onImageGen: () => void;
  onVoice: () => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isVoiceActive?: boolean;
  onClear: () => void;
  isLoading?: boolean;
}

export interface ComposerHandle {
  focus: () => void;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(({
  prompt,
  onPromptChange,
  onSend,
  streamEnabled,
  onStreamToggle,
  safeEnabled,
  onSafeToggle,
  activeAgentName,
  toolsCount,
  memoryState,
  onAgentClick,
  onToolsClick,
  onMemoryClick,
  attachments,
  onAttach,
  onRemoveAttachment,
  imageAttachments = [],
  onAddImages,
  onRemoveImage,
  onImageGen,
  onVoice,
  onVoiceStart,
  onVoiceStop,
  isVoiceActive = false,
  onClear,
  isLoading = false,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [prompt]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onAttach(files);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onAttach(files);
    }
  };

  return (
    <div
      ref={composerRef}
      className={`composer ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top: input pill */}
      <div className="composerInputRow">
        <div
          className="composerInputWrap"
          onClick={() => textareaRef.current?.focus()}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask Aika anything… "
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Bottom: source/model + actions */}
      <div className="composerActionsRow">
        <div className="composerDropdown">
          <button
            type="button"
            className="composerPill"
            onClick={onAgentClick}
          >
            <span className="composerPillLabel">
              {activeAgentName ? `Model: ${activeAgentName}` : 'Select model'}
            </span>
            <span className="composerPillCaret">▾</span>
          </button>
        </div>

        <div className="composerRightActions">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="composerBtn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="composerBtnIcon">📎</span>
            <span className="composerBtnLabel">Attach</span>
          </button>
          <button
            type="button"
            className="composerBtn"
            onClick={onVoice}
          >
            <span className="composerBtnIcon">🎙</span>
            <span className="composerBtnLabel">Voice</span>
          </button>
          <button
            type="button"
            className="composerBtn composerBtnSend"
            onClick={onSend}
            disabled={isLoading}
            aria-label="Send"
          >
            <span className="composerBtnIcon">↑</span>
            <span className="composerBtnLabel">{isLoading ? 'Sending…' : 'Send'}</span>
          </button>
        </div>
      </div>

      {(attachments.length > 0 || imageAttachments.length > 0) && (
        <div className="composerChips">
          {attachments.map((f) => (
            <div key={f.id} className="composerChip">
              <span>📄 {f.name}</span>
              <small>({fmtBytes(f.size)})</small>
              <button
                type="button"
                title="Remove"
                aria-label="Remove attachment"
                onClick={() => onRemoveAttachment(f.id)}
              >
                ✕
              </button>
            </div>
          ))}
          {imageAttachments.map((img) => (
            <div key={img.id} className="composerChip">
              <span>🖼 {img.name}</span>
              <small>({fmtBytes(img.size)})</small>
              <button
                type="button"
                title="Remove"
                aria-label="Remove image"
                onClick={() => onRemoveImage?.(img.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

Composer.displayName = 'Composer';
