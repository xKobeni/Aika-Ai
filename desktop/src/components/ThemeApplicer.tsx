import { useEffect } from 'react';
import { useAikaUI } from '../contexts/AikaUIContext';

const THEMES: Record<string, Record<string, string>> = {
  void: {
    bg0: '#05060a',
    bg1: '#070913',
    bg2: '#03040a',
    accent: 'rgba(235,245,255,.55)',
    accent2: 'rgba(80,240,255,.60)',
    danger: 'rgba(255,70,70,.75)',
    panelA: 'rgba(18,22,36,.60)',
    panelB: 'rgba(10,12,22,.46)',
    orb1: 'rgba(120,140,255,0.06)',
    orb2: 'rgba(80,240,255,0.05)',
    orb3: 'rgba(255,80,120,0.04)',
  },
  cyan: {
    bg0: '#03070b',
    bg1: '#04121a',
    bg2: '#02040a',
    accent: 'rgba(120,255,255,.50)',
    accent2: 'rgba(80,240,255,.70)',
    danger: 'rgba(255,70,70,.75)',
    panelA: 'rgba(10,24,30,.60)',
    panelB: 'rgba(6,14,18,.48)',
    orb1: 'rgba(80,220,255,0.07)',
    orb2: 'rgba(60,255,255,0.06)',
    orb3: 'rgba(100,200,255,0.04)',
  },
  red: {
    bg0: '#090307',
    bg1: '#12030a',
    bg2: '#040107',
    accent: 'rgba(255,120,140,.40)',
    accent2: 'rgba(255,70,70,.60)',
    danger: 'rgba(255,70,70,.85)',
    panelA: 'rgba(28,12,18,.60)',
    panelB: 'rgba(16,6,10,.48)',
    orb1: 'rgba(255,80,100,0.07)',
    orb2: 'rgba(255,60,80,0.05)',
    orb3: 'rgba(200,40,80,0.04)',
  },
  violet: {
    bg0: '#070312',
    bg1: '#0f0630',
    bg2: '#03010a',
    accent: 'rgba(200,160,255,.38)',
    accent2: 'rgba(140,120,255,.60)',
    danger: 'rgba(255,70,70,.75)',
    panelA: 'rgba(18,12,34,.60)',
    panelB: 'rgba(10,8,22,.48)',
    orb1: 'rgba(140,100,255,0.07)',
    orb2: 'rgba(180,120,255,0.05)',
    orb3: 'rgba(100,80,200,0.04)',
  },
  emerald: {
    bg0: '#030a07',
    bg1: '#062018',
    bg2: '#02040a',
    accent: 'rgba(120,255,200,.34)',
    accent2: 'rgba(120,255,200,.55)',
    danger: 'rgba(255,70,70,.75)',
    panelA: 'rgba(10,26,20,.60)',
    panelB: 'rgba(6,14,12,.48)',
    orb1: 'rgba(80,255,180,0.06)',
    orb2: 'rgba(120,255,200,0.05)',
    orb3: 'rgba(60,220,160,0.04)',
  },
};

export function ThemeApplicer() {
  const { settings, focusMode } = useAikaUI();

  useEffect(() => {
    const root = document.documentElement;
    const themeKey = settings.theme || 'void';
    const t = THEMES[themeKey] || THEMES.void;
    root.setAttribute('data-theme', themeKey);
    root.style.setProperty('--bg0', t.bg0);
    root.style.setProperty('--bg1', t.bg1);
    root.style.setProperty('--bg2', t.bg2);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent2', t.accent2);
    root.style.setProperty('--danger', t.danger);
    root.style.setProperty('--panelA', t.panelA);
    root.style.setProperty('--panelB', t.panelB);
    root.style.setProperty('--orb1', t.orb1 ?? 'rgba(120,140,255,0.06)');
    root.style.setProperty('--orb2', t.orb2 ?? 'rgba(80,240,255,0.05)');
    root.style.setProperty('--orb3', t.orb3 ?? 'rgba(255,80,120,0.04)');
    root.style.setProperty('--crtOpacity', String(settings.crt / 100));
    root.style.setProperty('--hudOpacity', String(settings.hud / 100));
    root.style.setProperty('--bgPulse', String(settings.pulse / 100));
    root.style.setProperty('--particleOpacity', String(settings.particleOpacity / 100));
    root.style.setProperty('--particleCount', String(settings.particleCount));
    root.style.setProperty('--focusScale', focusMode ? '1.06' : '1');
  }, [settings, focusMode]);

  useEffect(() => {
    document.body.classList.toggle('focusMode', focusMode);
  }, [focusMode]);

  return null;
}
