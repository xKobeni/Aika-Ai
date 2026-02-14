import { useState, useEffect } from 'react';

const BOOT_LINES = [
  'boot :: aika-ai console',
  'storage :: local sessions ✔️',
  'renderer :: canvas(pixel) + hud',
  'voice :: checking…',
  'status :: ready',
];

interface BootOverlayProps {
  onComplete: () => void;
  voiceSupported?: boolean;
}

export function BootOverlay({ onComplete, voiceSupported = false }: BootOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [text, setText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [rightLabel, setRightLabel] = useState('INIT');

  useEffect(() => {
    const lines = BOOT_LINES.map((l, i) =>
      i === 3 ? (voiceSupported ? 'voice :: supported ✔️' : 'voice :: unsupported ⚠') : l
    );

    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (lineIndex >= lines.length) {
        setRightLabel('ONLINE');
        timeout = setTimeout(() => {
          setVisible(false);
          timeout = setTimeout(onComplete, 360);
        }, 220);
        return;
      }

      const line = lines[lineIndex];
      if (charIndex < line.length) {
        setText((prev) => prev + line[charIndex]);
        setCharIndex((i) => i + 1);
        timeout = setTimeout(tick, 14 + Math.random() * 12);
      } else {
        setText((prev) => prev + '\n');
        setCharIndex(0);
        setLineIndex((i) => i + 1);
        timeout = setTimeout(tick, 120);
      }
    };

    timeout = setTimeout(tick, 50);
    return () => clearTimeout(timeout);
  }, [lineIndex, charIndex, onComplete, voiceSupported]);

  if (!visible) return null;

  return (
    <div className="boot" id="boot" style={{ opacity: visible ? 1 : 0, transition: 'opacity .35s ease' }}>
      <div className="bootBox">
        <div className="bootHeader">
          <div>AIKA AI :: VOID CONSOLE</div>
          <div id="bootRight">{rightLabel}</div>
        </div>
        <div className="bootBody">
          <div id="bootText">{text}</div>
          {lineIndex < BOOT_LINES.length && <span className="bootCursor" id="bootCursor" />}
        </div>
      </div>
    </div>
  );
}
