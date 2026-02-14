import { useEffect } from 'react';
import { BgDrift, StatePulse, GlitchSweep, Particles } from '../components/background';
import { AppLayout } from '../layout';
import { SettingsDrawer, Terminal } from '../components/overlays';
import { ThemeApplicer } from '../components/ThemeApplicer';
import { useAikaUI } from '../contexts/AikaUIContext';
import { useWakeWord } from '../hooks/useWakeWord';

interface ChatPageProps {
  messages: Array<{ role: string; text: string; time: string }>;
  prompt: string;
  onPromptChange: (v: string) => void;
  onSend: () => void;
  connectionStatus?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  onNewChat: () => void;
  onExport?: () => void;
  onClear?: () => void;
}

export function ChatPage({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus,
  isLoading,
  isStreaming,
  onNewChat,
  onExport,
  onClear,
}: ChatPageProps) {
  const ui = useAikaUI();

  // Wake word: when voice + wakeWordMode, listen for "Aika" and set wakeWordHeard
  const voiceOn = ui.settings.voice;
  const wakeWordActive = voiceOn && ui.settings.wakeWordMode;
  useWakeWord(wakeWordActive, () => ui.setWakeWordHeard(true));

  // Sync eyes state: thinking (loading), speaking (streaming), listening (voice on + wake word if needed), standby (waiting for "Aika"), idle
  const effectivelyListening =
    voiceOn && (!ui.settings.wakeWordMode || ui.wakeWordHeard);
  const waitingForWakeWord = voiceOn && ui.settings.wakeWordMode && !ui.wakeWordHeard;
  useEffect(() => {
    if (isLoading) ui.setEyesState('thinking');
    else if (isStreaming) ui.setEyesState('speaking');
    else if (effectivelyListening) ui.setEyesState('listening');
    else if (waitingForWakeWord) ui.setEyesState('standby');
    else ui.setEyesState('idle');
  }, [isLoading, isStreaming, effectivelyListening, waitingForWakeWord, ui.setEyesState]);

  // Keyboard: ` for terminal, F for focus, Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '`' || e.key === '~') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        ui.setTerminalOpen(!ui.terminalOpen);
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        ui.setFocusMode(!ui.focusMode);
      }
      if (e.key === 'Escape') {
        if (ui.terminalOpen) ui.setTerminalOpen(false);
        else if (ui.settingsOpen) ui.setSettingsOpen(false);
        else if (ui.sidebarOpen) ui.setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ui]);

  const chatSessions = [{ id: 'current', title: 'Current Chat', preview: messages[messages.length - 1]?.text?.slice(0, 60) || 'No messages yet.', updatedAt: new Date().toLocaleDateString([], { month: 'short', day: '2-digit' }) }];

  return (
    <>
      <BgDrift />
      <StatePulse />
      <GlitchSweep />
      <Particles
        count={ui.settings.particleCount}
        opacity={ui.settings.particleOpacity}
        eyesState={ui.eyesState}
      />
      <ThemeApplicer />

      <SettingsDrawer />
      <Terminal />

      <div className="topBar">
        <button
          type="button"
          className="hamburger"
          id="btnHamburger"
          aria-label="Open chat history"
          onClick={() => ui.setSidebarOpen(!ui.sidebarOpen)}
        >
          <span />
        </button>
      </div>
      <div
        className={`drawerBackdrop ${ui.sidebarOpen ? 'show' : ''}`}
        id="drawerBackdrop"
        aria-hidden={!ui.sidebarOpen}
        onClick={() => ui.setSidebarOpen(false)}
      />

      <AppLayout
        messages={messages}
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSend={onSend}
        connectionStatus={connectionStatus}
        isLoading={isLoading}
        chatSessions={chatSessions}
        activeSessionId="current"
        onNewChat={onNewChat}
        onExport={onExport}
        onClear={onClear}
        onRename={() => {}}
        onDelete={() => {}}
      />
    </>
  );
}
