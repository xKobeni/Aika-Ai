import { useState, useEffect, useRef } from 'react';
import './VoiceOrb.css';

interface VoiceOrbProps {
  onActivate: () => void;
  onDeactivate: () => void;
  isActive?: boolean;
}

export function VoiceOrb({ onActivate, onDeactivate, isActive = false }: VoiceOrbProps) {
  const [isListening, setIsListening] = useState(false);
  const haloRef = useRef<HTMLCanvasElement | null>(null);

  // Simple energy-driven halo animation (adapted from your template)
  useEffect(() => {
    if (!isListening) return;
    const canvas = haloRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let energy = 0.6;
    let target = 0.6;
    const BARS = 120;
    const phases = Array.from({ length: BARS }, () => Math.random() * Math.PI * 2);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawHalo = (e: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      const minR = Math.min(w, h) / 2;
      const orbR = (Math.min(w, h) * 0.5 * 0.6); // a bit bigger than orb
      const safeOuter = minR - 10;
      const ringBase = Math.min(orbR + 18, safeOuter - 26);

      const glow = ctx.createRadialGradient(cx, cy, ringBase, cx, cy, safeOuter);
      glow.addColorStop(0, `rgba(182,124,255,${0.08 + e * 0.14})`);
      glow.addColorStop(0.45, `rgba(77,224,255,${0.05 + e * 0.11})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, safeOuter, 0, Math.PI * 2);
      ctx.fill();

      const t = performance.now() * 0.001;
      const spin = 0.85;
      const rot = t * spin;

      const grad = ctx.createLinearGradient(cx - ringBase, cy, cx + ringBase, cy);
      grad.addColorStop(0, 'rgba(182,124,255,.90)');
      grad.addColorStop(0.55, 'rgba(77,224,255,.82)');
      grad.addColorStop(1, 'rgba(255,99,211,.78)');

      const ribbonAmp = 10 + e * 14;
      const steps = 220;

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.62;

      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const a = (i / steps) * Math.PI * 2 + rot;
        const wob =
          Math.sin(a * 3 + t * 2.2) * 0.45 +
          Math.sin(a * 5 + t * 1.4) * 0.25 +
          Math.sin(a * 9 + t * 0.9) * 0.12;
        const r = ringBase + wob * ribbonAmp;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const maxLen = 24 + e * 22;
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = 0.4;

      for (let i = 0; i < BARS; i += 1) {
        const a = (i / BARS) * Math.PI * 2 + rot;
        const p = phases[i];

        const wob =
          Math.abs(Math.sin(t * 3.4 + p)) * 0.55 +
          Math.abs(Math.sin(t * 2.0 + p * 1.7)) * 0.3 +
          Math.abs(Math.sin(t * 4.2 + p * 0.6)) * 0.15;

        const base = 0.25;
        const amp = clamp(base + wob * 0.9 + e * 0.55, 0, 1);
        const len = 4 + amp * maxLen;

        const depth = 0.55 + 0.45 * (Math.sin(a) * 0.5 + 0.5);
        ctx.globalAlpha = 0.38 * depth + e * 0.1;

        const r0 = ringBase - 2;
        const r1 = ringBase + len;

        const x0 = cx + Math.cos(a) * r0;
        const y0 = cy + Math.sin(a) * r0;
        const x1 = cx + Math.cos(a) * r1;
        const y1 = cy + Math.sin(a) * r1;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    const tick = () => {
      // Slightly wiggle target to keep halo alive
      const t = performance.now();
      const a = Math.abs(Math.sin(t * 0.012)) * 0.55;
      const b = Math.abs(Math.sin(t * 0.021 + 1.4)) * 0.35;
      const c = Math.abs(Math.sin(t * 0.033 + 0.8)) * 0.18;
      target = clamp(0.22 + a + b + c, 0.1, 1);

      energy += (target - energy) * 0.1;
      drawHalo(energy);

      animationFrame = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isListening]);

  useEffect(() => {
    setIsListening(isActive);
  }, [isActive]);

  const handleClick = () => {
    if (isListening) {
      setIsListening(false);
      onDeactivate();
    } else {
      setIsListening(true);
      onActivate();
    }
  };

  if (isListening) {
    return (
      <div className="voiceOrbContainer" onClick={handleClick}>
        <div className="voiceOrbWrap voiceOrbWrap--speaking">
          <div className="voiceOrbStage">
            <canvas ref={haloRef} className="voiceOrbHalo" />
            <div className="voiceOrbAura" />
            <div className="voiceOrbRipple" />

            <div className="voiceOrbOrb">
              <div className="voiceOrbCore" />
              <div className="voiceOrbRefract" />
              <div className="voiceOrbSheen" />
              <div className="voiceOrbStatic" />
              <div className="voiceOrbVignette" />
            </div>
          </div>

          <div className="voiceOrbReadout">
            <span className="voiceOrbPill">Listening… tap to stop</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="voiceOrbButton"
      onClick={handleClick}
      title="Start voice input"
      aria-label="Start voice input"
    >
      <span className="voiceOrbButton__icon">🎙️</span>
      <span className="voiceOrbButton__text">Voice</span>
    </button>
  );
}
