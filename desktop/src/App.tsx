import { useState, useCallback } from 'react';
import { AikaUIProvider } from './contexts/AikaUIContext';
import { ThemeApplicer } from './components/ThemeApplicer';
import { BootOverlay } from './components/overlays';
import { ChatPage } from './pages';
import { useAppState } from './hooks/useAppState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { sendChatMessage } from './lib/chatApi';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { toast } from './lib/toast';

function AppContent() {
  const [bootDone, setBootDone] = useState(false);
  const state = useAppState();
  const connectionStatus = useConnectionStatus();

  useKeyboardShortcuts({
    onFocusComposer: () => {},
    onShowShortcuts: () => {},
    onNewChat: state.newChat,
    onCloseModals: () => {},
    onTogglePanel: () => {},
  });

  const handleSend = useCallback(async () => {
    const text = state.prompt.trim();
    if (!text) return;
    state.showChat();
    state.addUserMessage(text);
    state.setPrompt('');

    await sendChatMessage({
      message: text,
      sessionId: state.sessionId,
      attachments: [],
      streamEnabled: state.streamEnabled,
      onAddAssistantMessage: state.addAssistantMessage,
      onPushToolLog: state.pushToolLog,
      onUpdateSessionId: state.setSessionId,
      onLoadingChange: state.setIsLoading,
      onStreamingStart: () => state.setIsStreaming(true),
      onStreamingUpdate: () => {},
      onStreamingEnd: () => state.setIsStreaming(false),
      onError: (error) => {
        state.setIsStreaming(false);
        state.setIsLoading(false);
        toast(`Error: ${error.message}`);
        state.addAssistantMessage(
          `Sorry, I encountered an error: ${error.message}. Please try again.`,
          { badges: [{ text: 'Error', kind: 'neutral' }] }
        );
      },
    });
  }, [state]);

  const handleExport = useCallback(() => {
    const exportObj = {
      app: 'Aika AI UI',
      exportedAt: new Date().toISOString(),
      messages: state.messages,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aika-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Exported');
  }, [state.messages]);

  const hasVoice =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition) &&
    'speechSynthesis' in window;

  return (
    <>
      <ThemeApplicer />
      {!bootDone && (
        <BootOverlay
          onComplete={() => setBootDone(true)}
          voiceSupported={hasVoice}
        />
      )}
      {bootDone && (
        <ChatPage
          messages={state.messages}
          prompt={state.prompt}
          onPromptChange={state.setPrompt}
          onSend={handleSend}
          connectionStatus={connectionStatus.status}
          isLoading={state.isLoading}
          isStreaming={state.isStreaming}
          onNewChat={state.newChat}
          onExport={handleExport}
          onClear={state.clearChat}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AikaUIProvider>
      <AppContent />
    </AikaUIProvider>
  );
}
