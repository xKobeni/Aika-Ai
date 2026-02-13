import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal__backdrop" onClick={onClose} aria-hidden />
      <div className={`modal__panel ${wide ? 'modal__panel--wide' : ''}`}>
        <div className="modal__header">
          <div className="modal__title" id="modalTitle">
            {title}
          </div>
          <button
            type="button"
            className="iconBtn iconBtn--only"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
