import { useRef, useEffect } from 'react';
import { useAikaUI } from '../../contexts/AikaUIContext';
import type { EyesState as EyesStateType } from '../../contexts/AikaUIContext';
import type { Expression } from '../../contexts/AikaUIContext';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const EXPRESSIONS: Expression[] = [
  'neutral',
  'curious',
  'happy',
  'sleepy',
  'focused',
  'sad',
  'bored',
  'excited',
  'surprised',
  'suspicious',
  'angry',
];
const EXPR_WEIGHTS = [22, 18, 14, 12, 10, 8, 6, 5, 3, 2, 1];

function pickRandomExpression(): Expression {
  const total = EXPR_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < EXPRESSIONS.length; i++) {
    r -= EXPR_WEIGHTS[i];
    if (r <= 0) return EXPRESSIONS[i];
  }
  return EXPRESSIONS[0];
}

interface EyesProps {
  state: EyesStateType;
  cyanAccents?: boolean;
  onBlink?: () => void;
  onFocusToggle?: () => void;
}

function computeExpression(
  eyesState: EyesStateType,
  exprOverride: Expression | null,
  mouseNear: number
): Expression {
  if (exprOverride) return exprOverride;
  if (eyesState === 'error') return 'angry';
  if (eyesState === 'standby') return 'sleepy';
  if (eyesState === 'listening' && mouseNear > 0.2) return 'curious';
  if (eyesState === 'thinking') return 'neutral';
  if (eyesState === 'speaking') return 'curious';
  return 'neutral';
}

function autonomousGazeParams(expr: Expression): {
  range: number;
  moveSpeed: number;
  intervalMin: number;
  intervalMax: number;
  centerChance: number;
  idleDrift: number;
  glanceChance: number;
  yBias: number;
  speedVary: number;
} {
  switch (expr) {
    case 'sleepy':
      return {
        range: 0.5,
        moveSpeed: 5,
        intervalMin: 3.5,
        intervalMax: 6,
        centerChance: 0.55,
        idleDrift: 0.02,
        glanceChance: 0,
        yBias: 0.08,
        speedVary: 0.12,
      };
    case 'bored':
      return {
        range: 0.6,
        moveSpeed: 5.5,
        intervalMin: 3,
        intervalMax: 5.5,
        centerChance: 0.5,
        idleDrift: 0.025,
        glanceChance: 0.05,
        yBias: 0.06,
        speedVary: 0.14,
      };
    case 'sad':
      return {
        range: 0.75,
        moveSpeed: 6,
        intervalMin: 2.5,
        intervalMax: 4.5,
        centerChance: 0.35,
        idleDrift: 0.03,
        glanceChance: 0.08,
        yBias: 0.2,
        speedVary: 0.15,
      };
    case 'curious':
      return {
        range: 1.0,
        moveSpeed: 7.5,
        intervalMin: 0.5,
        intervalMax: 1.8,
        centerChance: 0.08,
        idleDrift: 0.06,
        glanceChance: 0.28,
        yBias: 0,
        speedVary: 0.18,
      };
    case 'excited':
      return {
        range: 1.0,
        moveSpeed: 8,
        intervalMin: 0.4,
        intervalMax: 1.4,
        centerChance: 0.05,
        idleDrift: 0.08,
        glanceChance: 0.35,
        yBias: -0.05,
        speedVary: 0.2,
      };
    case 'surprised':
      return {
        range: 1.0,
        moveSpeed: 7.8,
        intervalMin: 0.45,
        intervalMax: 1.5,
        centerChance: 0.1,
        idleDrift: 0.07,
        glanceChance: 0.3,
        yBias: 0,
        speedVary: 0.2,
      };
    case 'angry':
      return {
        range: 0.9,
        moveSpeed: 7,
        intervalMin: 1.2,
        intervalMax: 2.8,
        centerChance: 0.2,
        idleDrift: 0.04,
        glanceChance: 0.15,
        yBias: -0.1,
        speedVary: 0.18,
      };
    case 'focused':
      return {
        range: 0.65,
        moveSpeed: 6,
        intervalMin: 2.2,
        intervalMax: 4.2,
        centerChance: 0.4,
        idleDrift: 0.018,
        glanceChance: 0.06,
        yBias: 0,
        speedVary: 0.12,
      };
    case 'suspicious':
      return {
        range: 0.85,
        moveSpeed: 6.5,
        intervalMin: 1.8,
        intervalMax: 3.5,
        centerChance: 0.3,
        idleDrift: 0.035,
        glanceChance: 0.18,
        yBias: 0.02,
        speedVary: 0.15,
      };
    case 'happy':
      return {
        range: 0.95,
        moveSpeed: 7.2,
        intervalMin: 0.9,
        intervalMax: 2.4,
        centerChance: 0.15,
        idleDrift: 0.055,
        glanceChance: 0.22,
        yBias: -0.06,
        speedVary: 0.18,
      };
    default:
      return {
        range: 0.95,
        moveSpeed: 7,
        intervalMin: 1,
        intervalMax: 2.8,
        centerChance: 0.16,
        idleDrift: 0.045,
        glanceChance: 0.2,
        yBias: 0,
        speedVary: 0.18,
      };
  }
}

function lidCutoffAtX(expr: Expression, xNorm: number, side: 'L' | 'R'): number {
  const baseOpen: Record<Expression, number> = {
    neutral: 0.96,
    curious: 1.0,
    angry: 0.58,
    surprised: 1.12,
    sleepy: 0.48,
    focused: 0.78,
    sad: 0.60,
    happy: 0.75,
    suspicious: 0.8,
    bored: 0.5,
    excited: 1.1,
  };
  let base = baseOpen[expr] ?? 0.96;
  let tilt = 0;
  if (expr === 'angry') {
    const dir = side === 'L' ? 1 : -1;
    tilt = 0.22 * dir * xNorm;
  }
  if (expr === 'sad') {
    tilt = -0.18 * (1 - Math.abs(xNorm));
  }
  let centerLift = 0;
  if (expr === 'curious') centerLift = 0.08 * (1 - Math.abs(xNorm));
  if (expr === 'happy') centerLift = -0.06 * (1 - Math.abs(xNorm));
  if (expr === 'excited') centerLift = 0.1 * (1 - Math.abs(xNorm));
  return clamp(base + tilt + centerLift, 0.18, 1.2);
}

function drawEyebrow(
  g: CanvasRenderingContext2D,
  expr: Expression,
  side: 'L' | 'R',
  tint: { r: number; g: number; b: number },
  alpha: number
) {
  if (expr !== 'angry') return;
  const y = 6;
  const startX = side === 'L' ? 9 : 12;
  const len = 10;
  for (let i = 0; i < len; i++) {
    const xx = startX + i;
    const yy = y + (side === 'L' ? Math.floor(i / 4) : Math.floor((len - 1 - i) / 4));
    g.fillStyle = `rgba(${tint.r | 0},${tint.g | 0},${tint.b | 0},${alpha})`;
    g.fillRect(xx, yy, 1, 1);
  }
}

function drawLidEdge(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  expr: Expression,
  side: 'L' | 'R',
  phase: number,
  tint: { r: number; g: number; b: number }
) {
  if (expr !== 'angry' && expr !== 'sleepy' && expr !== 'bored') return;
  const R = 12;
  const cx = W / 2;
  const cy = H / 2;
  const edgeA = expr === 'angry' ? 0.12 : expr === 'bored' ? 0.08 : 0.1;
  for (let x = 0; x < W; x++) {
    const xNorm = (x + 0.5 - cx) / R;
    const cutoff = lidCutoffAtX(expr, clamp(xNorm, -1, 1), side);
    const yTop = cy + -cutoff * R;
    const yPix = Math.round(yTop);
    const dx = x + 0.5 - cx;
    const dy = yPix + 0.5 - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= R + 0.5) {
      const pulse = 0.85 + 0.15 * Math.sin(phase * 1.2);
      g.fillStyle = `rgba(${tint.r | 0},${tint.g | 0},${tint.b | 0},${(edgeA * pulse).toFixed(3)})`;
      g.fillRect(x, yPix, 1, 1);
    }
  }
}

function triggerBlinkRef(
  blinkVelRef: React.MutableRefObject<number>,
  nextBlinkAtRef: React.MutableRefObject<number>,
  strength: number
) {
  blinkVelRef.current = Math.max(blinkVelRef.current, 0.14 * strength);
  nextBlinkAtRef.current = performance.now() + 1100 + Math.random() * 1800;
}

export function Eyes({ state, cyanAccents = true, onBlink, onFocusToggle }: EyesProps) {
  const ui = useAikaUI();
  const { exprOverride, blinkTrigger, setBlinkTrigger, setEyesState, setExprOverride, setFocusMode, settings, lookAt, triggerGlitch } = ui;
  const eyesFollowCursor = settings.eyesFollowCursor ?? true;
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const blinkRef = useRef(0);
  const blinkVelRef = useRef(0);
  const nextBlinkAtRef = useRef(performance.now() + 900 + Math.random() * 1400);
  const doubleBlinkPendingRef = useRef(0);
  const blinkStyleRef = useRef<'normal' | 'slow' | 'double'>('normal');
  const gazeXRef = useRef(0);
  const gazeYRef = useRef(0);
  const gazeXSmRef = useRef(0);
  const gazeYSmRef = useRef(0);
  const mouseNearRef = useRef(0);
  const errorFlashRef = useRef(0);
  const hurtFlashRef = useRef(0);
  const scanPhaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const gazeTargetXRef = useRef(0);
  const gazeTargetYRef = useRef(0);
  const nextGazeTargetAtRef = useRef(0);
  const lastResponseGlitchAtRef = useRef(0);
  const lastResponseBlinkAtRef = useRef(0);
  const randomExprRef = useRef<{ expr: Expression; expiresAt: number } | null>(null);
  const lastRandomExprAtRef = useRef(0);
  const effectiveExprOverrideRef = useRef<Expression | null>(null);
  const eyeClickCountRef = useRef(0);
  const lastEyeClickAtRef = useRef(0);

  useEffect(() => {
    if (!eyesFollowCursor) {
      gazeXRef.current = 0;
      gazeYRef.current = 0;
      gazeXSmRef.current = 0;
      gazeYSmRef.current = 0;
      mouseNearRef.current = 0;
    }
    const W = 32;
    const H = 32;
    const R = 12;
    const cx = W / 2;
    const cy = H / 2;

    function draw(
      g: CanvasRenderingContext2D,
      phase: number,
      side: 'L' | 'R',
      eyesState: EyesStateType,
      cyan: boolean,
      scanPhase: number
    ) {
      g.clearRect(0, 0, W, H);
      if (eyesState !== 'error') errorFlashRef.current = 0;

      const follow = 0.1;
      gazeXSmRef.current += (gazeXRef.current - gazeXSmRef.current) * follow;
      gazeYSmRef.current += (gazeYRef.current - gazeYSmRef.current) * follow;

      const expr = computeExpression(eyesState, effectiveExprOverrideRef.current, mouseNearRef.current);

      let glow = 0.55;
      let flicker = 0;
      let shimmer = 0;
      let vib = 0;
      let tint = { r: 235, g: 245, b: 255 };
      let pupilR = 3.1;

      const blink = clamp(blinkRef.current, 0, 1);
      const lidOpen = 1 - blink;

      switch (eyesState) {
        case 'idle':
          glow = 0.48 + 0.08 * Math.sin(phase * 1.1);
          pupilR = 3 + 0.12 * Math.sin(phase * 0.7 + (side === 'L' ? 0 : 0.4));
          break;
        case 'listening':
          glow = 0.52 + 0.12 * Math.sin(phase * 1.7);
          flicker = 0.12 + 0.12 * Math.random();
          pupilR = 3;
          if (cyan) tint = { r: 80, g: 240, b: 255 };
          break;
        case 'thinking':
          glow = 0.52 + 0.08 * Math.sin(phase * 0.6);
          shimmer = 0.6 + 0.4 * Math.sin(phase * 0.9);
          pupilR = 2.85;
          break;
        case 'speaking':
          glow = 0.58 + 0.22 * Math.sin(phase * 2.6);
          vib = 0.85;
          pupilR = 3.2 + 0.2 * Math.sin(phase * 2.2 + (side === 'L' ? 0 : 0.35));
          break;
        case 'error':
          glow = 0.72;
          pupilR = 3;
          tint = { r: 255, g: 70, b: 70 };
          errorFlashRef.current = Math.max(errorFlashRef.current, 1);
          break;
        case 'standby':
          glow = 0.38 + 0.05 * Math.sin(phase * 0.6);
          pupilR = 2.9;
          break;
      }

      const err = errorFlashRef.current;

      let jx = 0;
      let jy = 0;
      if (vib > 0) {
        jx = (Math.random() - 0.5) * vib;
        jy = (Math.random() - 0.5) * vib;
      }
      if (eyesState === 'thinking') {
        jx += (Math.random() - 0.5) * 0.35;
        jy += (Math.random() - 0.5) * 0.35;
      }
      if ((eyesState === 'thinking' || eyesState === 'speaking') && Math.random() < 0.028) {
        jx += (Math.random() - 0.5) * 2.5;
        jy += (Math.random() - 0.5) * 2.5;
      }
      const hurt = hurtFlashRef.current;
      if (hurt > 0.3) {
        jx += (Math.random() - 0.5) * 2.2;
        jy += (Math.random() - 0.5) * 2.2;
      }

      const maxMove = 2.6;
      const convergence = side === 'L' ? 0.22 : -0.22;
      const pupilOffsetX = gazeXSmRef.current * maxMove + convergence;
      const pupilOffsetY = gazeYSmRef.current * maxMove * (1 - 0.75 * blink);
      const microX = 0.35 * Math.sin(phase * 0.8 + (side === 'L' ? 0 : 0.5));
      const microY = 0.28 * Math.sin(phase * 0.65 + (side === 'L' ? 0.2 : 0.55));
      const px = cx + pupilOffsetX + microX + jx;
      const py = cy + pupilOffsetY + microY + jy;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = x + 0.5 - (cx + jx);
          const dy = y + 0.5 - (cy + jy);
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > R) continue;

          const xNorm = clamp((x + 0.5 - cx) / R, -1, 1);
          const yNorm = (y + 0.5 - cy) / R;

          let cutoff = lidCutoffAtX(expr, xNorm, side);
          cutoff *= 0.18 + 0.82 * lidOpen;
          cutoff = clamp(cutoff, 0.1, 1.2);
          if (Math.abs(yNorm) > cutoff) continue;

          const edge = clamp((R - d) / 3, 0, 1);
          let a = (0.14 + 0.58 * edge) * glow;
          a *= 1 - flicker * 0.4;

          if (shimmer) {
            const sheen = (x + y) / (W + H);
            a *= 0.78 + 0.28 * Math.sin((sheen * 6 + phase * 0.7) * Math.PI * 2) * shimmer;
          }

          let rr = tint.r;
          let gg = tint.g;
          let bb = tint.b;

          if (cyan && eyesState !== 'error') {
            const accent = clamp((1 - x / (W * 0.9)) * (1 - y / (H * 0.9)), 0, 1);
            rr = rr * (1 - 0.1 * accent) + 80 * (0.1 * accent);
            gg = gg * (1 - 0.1 * accent) + 240 * (0.1 * accent);
            bb = bb * (1 - 0.1 * accent) + 255 * (0.1 * accent);
          }

          if (err > 0.001) {
            rr = rr * (1 - err) + 255 * err;
            gg = gg * (1 - err) + 70 * err;
            bb = bb * (1 - err) + 70 * err;
            a = Math.min(1, a * (1 + err * 0.35));
          }
          if (hurt > 0.001) {
            rr = rr * (1 - hurt) + 255 * hurt;
            gg = gg * (1 - hurt) + 70 * hurt;
            bb = bb * (1 - hurt) + 70 * hurt;
            a = Math.min(1, a * (1 + hurt * 0.28));
          }

          g.fillStyle = `rgba(${rr | 0},${gg | 0},${bb | 0},${a.toFixed(3)})`;
          g.fillRect(x, y, 1, 1);
        }
      }

      const pupilHide = expr === 'sleepy' ? 0.7 : 0.85;
      const pupilVisible = blink < pupilHide;

      if (pupilVisible) {
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const dx = x + 0.5 - px;
            const dy = y + 0.5 - py;
            const d = Math.sqrt(dx * dx + dy * dy);

            const xNorm = clamp((x + 0.5 - cx) / R, -1, 1);
            const yNorm = (y + 0.5 - cy) / R;
            let cutoff = lidCutoffAtX(expr, xNorm, side);
            cutoff *= 0.18 + 0.82 * lidOpen;
            cutoff = clamp(cutoff, 0.1, 1.2);
            if (Math.abs(yNorm) > cutoff) continue;

            if (d <= pupilR) {
              let a = 0.86;
              if (eyesState === 'speaking') a = 0.92;
              if (eyesState === 'listening') a *= 0.88 + Math.random() * 0.08;

              let rr = 8;
              let gg = 10;
              let bb = 16;
              if (eyesState === 'error' || err > 0.001) {
                rr = 30;
                gg = 6;
                bb = 10;
              }

              g.fillStyle = `rgba(${rr},${gg},${bb},${a})`;
              g.fillRect(x, y, 1, 1);
            }
          }
        }

        if (blink < 0.75) {
          const hx = Math.round(px - 1.6);
          const hy = Math.round(py - 1.8);
          const highlightAlpha = eyesState === 'thinking' ? 0.58 : 0.46;
          g.fillStyle = `rgba(255,255,255,${highlightAlpha})`;
          g.fillRect(hx, hy, 1, 1);
          g.fillRect(hx + 1, hy, 1, 1);
        }
      }

      drawEyebrow(g, expr, side, tint, 0.18);
      drawLidEdge(g, W, H, expr, side, phase, tint);

      if (eyesState === 'listening' && blink < 0.9) {
        const scanT = scanPhase % 1;
        const yCenter = (scanT * (H + 12)) - 6;
        const band = [0.06, 0.12, 0.2, 0.22, 0.2, 0.12, 0.06];
        for (let i = 0; i < band.length; i++) {
          const yy = Math.floor(yCenter + i - band.length / 2);
          if (yy < 0 || yy >= H) continue;
          g.fillStyle = `rgba(80,240,255,${band[i].toFixed(2)})`;
          g.fillRect(0, yy, W, 1);
        }
      }
    }

    function updateBlink(dt: number) {
      const t = performance.now();
      const expr = computeExpression(state, effectiveExprOverrideRef.current, mouseNearRef.current);

      if (expr === 'sleepy') blinkStyleRef.current = 'slow';
      else if (expr === 'surprised') blinkStyleRef.current = 'double';
      else blinkStyleRef.current = 'normal';

      if (t >= nextBlinkAtRef.current && blinkRef.current <= 0.02) {
        if (blinkStyleRef.current === 'double') {
          if (doubleBlinkPendingRef.current <= 0 && Math.random() < 0.35) {
            doubleBlinkPendingRef.current = 2;
          }
        }

        if (doubleBlinkPendingRef.current > 0) {
          blinkVelRef.current += 0.2 + Math.random() * 0.05;
          doubleBlinkPendingRef.current--;
          nextBlinkAtRef.current =
            t + (doubleBlinkPendingRef.current > 0 ? 120 : 1400 + Math.random() * 2200);
        } else {
          const impulse =
            blinkStyleRef.current === 'slow'
              ? 0.16 + Math.random() * 0.06
              : 0.22 + Math.random() * 0.08;
          blinkVelRef.current += impulse;
          const next =
            blinkStyleRef.current === 'slow'
              ? 2000 + Math.random() * 3200
              : 1800 + Math.random() * 2800;
          nextBlinkAtRef.current = t + next;
        }
      }

      blinkRef.current += blinkVelRef.current;
      blinkVelRef.current *= 0.78;
      const openForce = blinkStyleRef.current === 'slow' ? 0.075 : 0.1;
      blinkRef.current -= (openForce + blinkRef.current * 0.06) * dt * 60;
      blinkRef.current = clamp(blinkRef.current, 0, 1);
    }

    const SCAN_SPEED = 0.70;
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      tRef.current += dt;
      if (state === 'listening') scanPhaseRef.current += dt * SCAN_SPEED;

      if (!exprOverride) {
        const r = randomExprRef.current;
        if (!r || now > r.expiresAt) {
          if (now - lastRandomExprAtRef.current > 6000 && Math.random() < 0.20) {
            randomExprRef.current = {
              expr: pickRandomExpression(),
              expiresAt: now + 1800 + Math.random() * 3500,
            };
            lastRandomExprAtRef.current = now;
          }
        }
      } else {
        randomExprRef.current = null;
      }
      effectiveExprOverrideRef.current =
        exprOverride ??
        (randomExprRef.current && now < randomExprRef.current.expiresAt
          ? randomExprRef.current.expr
          : null);

      const wrap = leftRef.current?.parentElement?.getBoundingClientRect();
      const lookAtActive = lookAt && now < lookAt.expiresAt;
      if (lookAtActive && wrap) {
        const cx = wrap.left + wrap.width / 2;
        const cy = wrap.top + wrap.height / 2;
        const halfW = wrap.width / 2;
        const halfH = wrap.height / 2;
        const dx = halfW !== 0 ? (lookAt.clientX - cx) / halfW : 0;
        const dy = halfH !== 0 ? (lookAt.clientY - cy) / halfH : 0;
        gazeXRef.current = clamp(dx, -1, 1);
        gazeYRef.current = clamp(dy, -1, 1);
        mouseNearRef.current = 0;
      } else if (!eyesFollowCursor) {
        const expr = computeExpression(state, effectiveExprOverrideRef.current, mouseNearRef.current);
        const params = autonomousGazeParams(expr);
        if (now >= nextGazeTargetAtRef.current) {
          const isGlance = params.glanceChance > 0 && Math.random() < params.glanceChance;
          const r = isGlance ? params.range * 0.4 : params.range;
          if (Math.random() < params.centerChance && !isGlance) {
            gazeTargetXRef.current = 0;
            gazeTargetYRef.current = 0;
          } else {
            gazeTargetXRef.current = clamp((Math.random() * 2 - 1) * r, -1, 1);
            gazeTargetYRef.current = clamp(
              (Math.random() * 2 - 1) * r + params.yBias,
              -1,
              1
            );
          }
          const intervalMin = isGlance ? 0.2 : params.intervalMin;
          const intervalMax = isGlance ? 0.6 : params.intervalMax;
          const interval =
            intervalMin + Math.random() * (intervalMax - intervalMin);
          nextGazeTargetAtRef.current = now + interval * 1000;
        }
        const speedMult = 1 + (Math.random() - 0.5) * params.speedVary;
        const step = Math.min(1, params.moveSpeed * speedMult * dt);
        gazeXRef.current += (gazeTargetXRef.current - gazeXRef.current) * step;
        gazeYRef.current += (gazeTargetYRef.current - gazeYRef.current) * step;
        gazeXRef.current += (Math.random() - 0.5) * params.idleDrift;
        gazeYRef.current += (Math.random() - 0.5) * params.idleDrift;
        gazeXRef.current = clamp(gazeXRef.current, -1, 1);
        gazeYRef.current = clamp(gazeYRef.current, -1, 1);
        mouseNearRef.current = 0;
      }

      if (state !== 'error') errorFlashRef.current = 0;

      const isResponding = state === 'thinking' || state === 'speaking';
      if (isResponding) {
        if (now - lastResponseGlitchAtRef.current > 2200 && Math.random() < 0.18) {
          triggerGlitch();
          lastResponseGlitchAtRef.current = now;
        }
        if (now - lastResponseBlinkAtRef.current > 700 && Math.random() < 0.22 && blinkRef.current <= 0.02) {
          triggerBlinkRef(blinkVelRef, nextBlinkAtRef, 0.9);
          lastResponseBlinkAtRef.current = now;
        }
      }

      if (blinkTrigger) {
        triggerBlinkRef(blinkVelRef, nextBlinkAtRef, blinkTrigger.strength);
        setBlinkTrigger(null);
      }

      updateBlink(dt);

      const gl = leftRef.current?.getContext('2d', { alpha: true });
      const gr = rightRef.current?.getContext('2d', { alpha: true });
      const scanPhase = scanPhaseRef.current;
      if (gl) draw(gl, tRef.current, 'L', state, cyanAccents, scanPhase);
      if (gr) draw(gr, tRef.current, 'R', state, cyanAccents, scanPhase);

      if (hurtFlashRef.current > 0.001) hurtFlashRef.current *= 0.85;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      if (lookAt && performance.now() < lookAt.expiresAt) return;
      if (!eyesFollowCursor) {
        gazeXRef.current = 0;
        gazeYRef.current = 0;
        mouseNearRef.current = 0;
        return;
      }
      const wrap = leftRef.current?.parentElement?.getBoundingClientRect();
      if (!wrap) return;
      const centerX = wrap.left + wrap.width / 2;
      const centerY = wrap.top + wrap.height / 2;
      const dx = (e.clientX - centerX) / (wrap.width / 2);
      const dy = (e.clientY - centerY) / (wrap.height / 2);
      gazeXRef.current = clamp(dx, -1, 1);
      gazeYRef.current = clamp(dy, -1, 1);

      const inside =
        e.clientX >= wrap.left &&
        e.clientX <= wrap.right &&
        e.clientY >= wrap.top &&
        e.clientY <= wrap.bottom;
      const dist = Math.hypot(dx, dy);
      mouseNearRef.current = inside ? clamp(1.25 - dist, 0, 1) : 0;
    };
    const onMouseLeave = () => {
      gazeXRef.current = 0;
      gazeYRef.current = 0;
      mouseNearRef.current = 0;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [state, cyanAccents, exprOverride, blinkTrigger, setBlinkTrigger, eyesFollowCursor, lookAt, triggerGlitch]);

  const triggerHurt = () => {
    hurtFlashRef.current = 0.95;
    triggerGlitch();
  };
  const handleWrapClick = () => {
    const now = performance.now();
    if (now - lastEyeClickAtRef.current > 2000) eyeClickCountRef.current = 0;
    lastEyeClickAtRef.current = now;
    eyeClickCountRef.current += 1;

    if (eyeClickCountRef.current >= 5) {
      eyeClickCountRef.current = 0;
      setEyesState('error');
      setExprOverride('angry');
      setBlinkTrigger({ strength: 1.2 });
      triggerGlitch();
      document.body.classList.add('eyesShake');
      setTimeout(() => document.body.classList.remove('eyesShake'), 600);
      setTimeout(() => {
        setEyesState('idle');
        setExprOverride(null);
      }, 2500);
      return;
    }

    triggerHurt();
    triggerBlinkRef(blinkVelRef, nextBlinkAtRef, 1);
    onBlink?.();
  };
  const handleWrapDoubleClick = () => setFocusMode(false);
  const handleEyePointerDown = () => {
    triggerHurt();
    triggerBlinkRef(blinkVelRef, nextBlinkAtRef, 1.25);
  };

  return (
    <div
      className="eyesWrap"
      id="eyesWrap"
      role="button"
      tabIndex={0}
      onClick={handleWrapClick}
      onDoubleClick={handleWrapDoubleClick}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) return;
        triggerHurt();
      }}
    >
      <div className="eyesGlow" />
      <div className="hud" />
      <div className="crtMask" />
      <canvas
        ref={leftRef}
        className="eye"
        id="eyeL"
        width={32}
        height={32}
        onPointerDown={handleEyePointerDown}
      />
      <canvas
        ref={rightRef}
        className="eye"
        id="eyeR"
        width={32}
        height={32}
        onPointerDown={handleEyePointerDown}
      />
    </div>
  );
}
