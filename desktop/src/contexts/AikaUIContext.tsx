import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type EyesState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error' | 'standby';
export type Expression =
  | 'neutral'
  | 'curious'
  | 'angry'
  | 'surprised'
  | 'sleepy'
  | 'focused'
  | 'sad'
  | 'happy'
  | 'suspicious'
  | 'bored'
  | 'excited'
  | 'scared'
  | 'crying'
  | 'dead';
export type ThemeKey = 'void' | 'cyan' | 'red' | 'violet' | 'emerald';

interface AikaUISettings {
  listening: boolean;
  voice: boolean;
  wakeWordMode: boolean;
  sound: boolean;
  cyanAccents: boolean;
  eyesFollowCursor: boolean;
  theme: ThemeKey;
  crt: number;
  hud: number;
  pulse: number;
  particleCount: number;
  particleOpacity: number;
  /** Left sidebar collapsed to icon strip */
  sidebarCollapsed: boolean;
}

const DEFAULT_SETTINGS: AikaUISettings = {
  listening: false,
  voice: false,
  wakeWordMode: false,
  sound: false,
  cyanAccents: true,
  eyesFollowCursor: true,
  theme: 'void',
  crt: 28,
  hud: 12,
  pulse: 10,
  particleCount: 90,
  particleOpacity: 55,
  sidebarCollapsed: false,
};

interface AikaUIContextValue {
  eyesState: EyesState;
  setEyesState: (s: EyesState) => void;
  exprOverride: Expression | null;
  setExprOverride: (e: Expression | null) => void;
  /** Trigger a blink from outside (e.g. Test Error). Strength 1 = normal, 1.2 = stronger. */
  blinkTrigger: { strength: number } | null;
  setBlinkTrigger: (v: { strength: number } | null) => void;
  /** Make eyes look at a screen position (e.g. focused input, clicked button). Takes precedence over cursor/autonomous. */
  lookAt: { clientX: number; clientY: number; expiresAt: number } | null;
  setLookAt: (pos: { clientX: number; clientY: number } | null, durationMs?: number) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  terminalOpen: boolean;
  setTerminalOpen: (v: boolean) => void;
  settings: AikaUISettings;
  updateSettings: (patch: Partial<AikaUISettings>) => void;
  /** When wake word mode is on: true after user said "Aika", reset when voice off. */
  wakeWordHeard: boolean;
  setWakeWordHeard: (v: boolean) => void;
  triggerGlitch: () => void;
}

const AikaUIContext = createContext<AikaUIContextValue | null>(null);

const STORAGE_KEY = 'aika_ai_ui_settings';

function loadSettings(): AikaUISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AikaUISettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export function AikaUIProvider({ children }: { children: ReactNode }) {
  const [eyesState, setEyesState] = useState<EyesState>('idle');
  const [exprOverride, setExprOverride] = useState<Expression | null>(null);
  const [blinkTrigger, setBlinkTrigger] = useState<{ strength: number } | null>(null);
  const [lookAt, setLookAtState] = useState<{
    clientX: number;
    clientY: number;
    expiresAt: number;
  } | null>(null);
  const setLookAt = useCallback(
    (pos: { clientX: number; clientY: number } | null, durationMs = 2000) => {
      if (!pos) {
        setLookAtState(null);
        return;
      }
      setLookAtState({
        clientX: pos.clientX,
        clientY: pos.clientY,
        expiresAt: typeof performance !== 'undefined' ? performance.now() + durationMs : 0,
      });
    },
    []
  );
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [settings, setSettingsState] = useState<AikaUISettings>(loadSettings);
  const [wakeWordHeard, setWakeWordHeard] = useState(false);

  const updateSettings = useCallback((patch: Partial<AikaUISettings>) => {
    if (patch.voice === false) setWakeWordHeard(false);
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const triggerGlitch = useCallback(() => {
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), 800);
  }, []);

  const value: AikaUIContextValue = {
    eyesState,
    setEyesState,
    exprOverride,
    setExprOverride,
    blinkTrigger,
    setBlinkTrigger,
    lookAt,
    setLookAt,
    focusMode,
    setFocusMode,
    sidebarOpen,
    setSidebarOpen,
    settingsOpen,
    setSettingsOpen,
    terminalOpen,
    setTerminalOpen,
    settings,
    updateSettings,
    wakeWordHeard,
    setWakeWordHeard,
    triggerGlitch,
  };

  return <AikaUIContext.Provider value={value}>{children}</AikaUIContext.Provider>;
}

export function useAikaUI() {
  const ctx = useContext(AikaUIContext);
  if (!ctx) throw new Error('useAikaUI must be used within AikaUIProvider');
  return ctx;
}
