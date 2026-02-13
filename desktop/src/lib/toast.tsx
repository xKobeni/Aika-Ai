import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

let toastRoot: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function ToastEl({ text }: { text: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        padding: '10px 12px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,.14)',
        background: 'rgba(0,0,0,.45)',
        color: 'rgba(242,243,255,.92)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 60px rgba(0,0,0,.40)',
        zIndex: 80,
        opacity: visible ? 1 : 0,
        transition: 'opacity .15s ease',
        fontWeight: 650,
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}

export function toast(text: string) {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    toastRoot = createRoot(container);
  }
  if (!toastRoot || !container) return;
  toastRoot.render(<ToastEl text={text} />);
}
