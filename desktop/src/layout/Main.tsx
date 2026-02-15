import { HeaderBadges, Eyes, Messages, Composer, WaveformMeter } from '../components/main';
import { useAikaUI } from '../contexts/AikaUIContext';
import type { Message } from '../types';

interface MainProps {
  messages: Message[];
  prompt: string;
  onPromptChange: (v: string) => void;
  onSend: () => void;
  connectionStatus?: string;
  greeting?: string | null;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onAttachFiles?: (files: File[]) => void;
  attachmentCount?: number;
  activeAgentName?: string;
}

export function Main({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus,
  greeting,
  isLoading,
  isStreaming = false,
  streamingText,
  onAttachFiles,
  attachmentCount = 0,
  activeAgentName,
}: MainProps) {
  const ui = useAikaUI();

  const voiceOn = ui.settings.voice;
  const waitingForWakeWord =
    voiceOn && ui.settings.wakeWordMode && !ui.wakeWordHeard;

  const isNewChat = messages.length === 0;

  return (
    <main className={`main ${isNewChat ? 'main--newChat' : ''}`}>
      <section className="aiHeader">
        <HeaderBadges
          connectionStatus={connectionStatus as any}
          activeAgentName={activeAgentName}
          onFocusClick={() => ui.setFocusMode(!ui.focusMode)}
          onSettingsClick={() => ui.setSettingsOpen(true)}
        />
        <Eyes
          state={ui.eyesState}
          cyanAccents={ui.settings.cyanAccents}
          onFocusToggle={() => ui.setFocusMode(!ui.focusMode)}
        />
      </section>

      {isNewChat && (
        <p className="chatGreeting" aria-live="polite">
          {greeting ?? 'Where should we begin?'}
        </p>
      )}

      <section className="chat">
        <Messages messages={messages} isLoading={isLoading} isStreaming={isStreaming} streamingText={streamingText} />
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
          onAttachFiles={onAttachFiles}
          attachmentCount={attachmentCount}
        />
      </section>
    </main>
  );
}
