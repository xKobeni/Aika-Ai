import { useRef, useEffect, useState } from 'react';

const BAR_COUNT = 32;
const FFT_SIZE = 256;
const SMOOTHING = 0.75;

interface WaveformMeterProps {
  /** When true, request mic and show live waveform. */
  visible: boolean;
  /** Optional: called with 0–1 level each frame (e.g. for wake word threshold). */
  onLevel?: (level: number) => void;
  className?: string;
}

export function WaveformMeter({ visible, onLevel, className = '' }: WaveformMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      analyserRef.current = null;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      dataRef.current = null;
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        if (cancelled) {
          ctx.close();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctxRef.current = ctx;

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = SMOOTHING;
        src.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const data = new Uint8Array(bufferLength);
        dataRef.current = data;

        setError(null);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const draw = () => {
          if (!analyserRef.current || !dataRef.current || !canvasRef.current) return;
          const analyser = analyserRef.current;
          const data = dataRef.current;
          analyser.getByteFrequencyData(data);

          const canvas = canvasRef.current;
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = canvas.width;
          const h = canvas.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.clearRect(0, 0, w, h);

          const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
          let sum = 0;
          let max = 0;
          for (let i = 0; i < BAR_COUNT; i++) {
            const idx = Math.min(i * step, data.length - 1);
            const v = data[idx];
            sum += v;
            if (v > max) max = v;
          }
          const avg = sum / (BAR_COUNT * 256);
          if (onLevel) onLevel(Math.min(1, avg * 2));

          const barW = Math.max(1, (w / BAR_COUNT) - 2);
          const gap = 2;
          for (let i = 0; i < BAR_COUNT; i++) {
            const idx = Math.min(i * step, data.length - 1);
            const v = data[idx];
            const norm = v / 255;
            const barH = Math.max(2, norm * h * 0.85);
            const x = i * (barW + gap) + gap * 0.5;
            const y = h - barH;
            ctx.fillStyle = `rgba(80, 240, 255, ${0.4 + norm * 0.5})`;
            ctx.fillRect(x, y, barW, barH);
          }

          rafRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Microphone access failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, onLevel]);

  if (!visible) return null;

  return (
    <div className={`waveformMeter ${className}`.trim()} aria-label="Voice level">
      {error && <span className="waveformMeter-error">{error}</span>}
      <canvas
        ref={canvasRef}
        className="waveformMeter-canvas"
        width={320}
        height={48}
        aria-hidden
      />
    </div>
  );
}
