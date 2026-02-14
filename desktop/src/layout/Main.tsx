import { HeaderBadges, Eyes, Messages, Composer, WaveformMeter } from '../components/main';
import { useAikaUI } from '../contexts/AikaUIContext';
import type { Message } from '../types';

interface MainProps {
  messages: Message[];
  prompt: string;
  onPromptChange: (v: string) => void;
  onSend: () => void;
  connectionStatus?: string;
  isLoading?: boolean;
}

export function Main({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus,
  isLoading,
}: MainProps) {
  const ui = useAikaUI();
  const activeChatTitle = 'Current';

  const voiceOn = ui.settings.voice;
  const waitingForWakeWord =
    voiceOn && ui.settings.wakeWordMode && !ui.wakeWordHeard;

  const typingLabel = isLoading
    ? 'PROCESSING'
    : ui.eyesState === 'thinking'
      ? 'THINKING…'
      : waitingForWakeWord
        ? 'AIKA…'
        : ui.eyesState === 'listening'
          ? 'SCAN MODE'
          : ui.eyesState === 'standby'
            ? 'STANDBY'
            : 'READY';

  const isNewChat = messages.length === 0;

  return (
    <main className={`main ${isNewChat ? 'main--newChat' : ''}`}>
      <section className="aiHeader">
        <HeaderBadges
          connectionStatus={connectionStatus as any}
          typingLabel={typingLabel}
          activeChatTitle={activeChatTitle}
          onFocusClick={() => ui.setFocusMode(!ui.focusMode)}
          onSettingsClick={() => ui.setSettingsOpen(true)}
        />
        <Eyes
          state={ui.eyesState}
          cyanAccents={ui.settings.cyanAccents}
          onFocusToggle={() => ui.setFocusMode(!ui.focusMode)}
        />
      </section>

      <section className="chat">
        <Messages messages={messages} isLoading={isLoading} />
        {(voiceOn || waitingForWakeWord) && (
          <div className="voiceStrip">
            {voiceOn && (
              <WaveformMeter visible={voiceOn} className="voiceStrip-waveform" />
            )}
            {waitingForWakeWord && (
              <p className="wakeWordHint voiceStrip-hint" aria-live="polite">
                Say <strong>Aika</strong>… to activate
              </p>
            )}
          </div>
        )}
        <Composer
          value={prompt}
          onChange={onPromptChange}
          onSend={onSend}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}
