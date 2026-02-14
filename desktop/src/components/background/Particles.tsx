import { useEffect, useRef } from 'react';

interface ParticlesProps {
  count?: number;
  opacity?: number;
  eyesState?: string;
}

export function Particles({ count = 90, opacity = 0.55, eyesState = 'idle' }: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 0.6 + Math.random() * 1.8,
      vx: -0.15 + Math.random() * 0.3,
      vy: -0.08 + Math.random() * 0.16,
      a: 0.05 + Math.random() * 0.1,
    });

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      while (particles.length < count) particles.push(spawn());
      while (particles.length > count) particles.pop();

      ctx.clearRect(0, 0, w, h);
      let mult = 1;
      if (eyesState === 'standby') mult = 0.55;
      if (eyesState === 'speaking' || eyesState === 'thinking') mult = 1.25;
      if (eyesState === 'error') mult = 1.35;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        ctx.fillStyle = `rgba(220, 240, 255, ${(p.a * mult * (opacity / 100)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, opacity, eyesState]);

  return (
    <canvas
      ref={canvasRef}
      className="particles"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        opacity: opacity / 100,
      }}
      aria-hidden
    />
  );
}
