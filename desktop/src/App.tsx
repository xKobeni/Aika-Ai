import { useState, useCallback, useEffect } from 'react';
import { AikaUIProvider } from './contexts/AikaUIContext';
import { ThemeApplicer } from './components/ThemeApplicer';
import { BootOverlay } from './components/overlays';
import { ChatPage } from './pages';
import { useAppState } from './hooks/useAppState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { sendChatMessage } from './lib/chatApi';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { getGreeting } from './lib/api';
import { toast } from './lib/toast';

function AppContent() {
  const [bootDone, setBootDone] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const state = useAppState();
  const connectionStatus = useConnectionStatus();

  // When backend is connected, fetch greeting and session list
  useEffect(() => {
    if (connectionStatus.status !== 'connected') return;
    getGreeting()
      .then((res) => setGreeting(res.message))
      .catch(() => setGreeting(null));
    state.loadSessions();
  }, [connectionStatus.status, state.loadSessions]);

  useKeyboardShortcuts({
    onFocusComposer: () => {},
    onShowShortcuts: () => {},
    onNewChat: state.newChat,
    onCloseModals: () => {},
    onTogglePanel: () => {},
  });

  // Dev: Ctrl+Shift+E = run thinking → typing demo (test eyes & chat labels)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        state.runThinkingTypingDemo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.runThinkingTypingDemo]);

  const handleSend = useCallback(async () => {
    const text = state.prompt.trim();
    if (!text) return;
    state.showChat();
    state.addUserMessage(text);
    state.setPrompt('');

    await sendChatMessage({
      message: text,
      sessionId: state.sessionId,
      attachments: state.attachments.map((a) => ({ name: a.name, size: a.size, type: a.type })),
      streamEnabled: state.streamEnabled,
      onAddAssistantMessage: state.addAssistantMessage,
      onPushToolLog: state.pushToolLog,
      onUpdateSessionId: (id) => {
        state.setSessionId(id);
        state.loadSessions();
      },
      onLoadingChange: state.setIsLoading,
      onStreamingStart: () => {
        state.setIsLoading(false);
        state.setIsStreaming(true);
        state.setStreamingText('');
      },
      onStreamingUpdate: (accumulated) => state.setStreamingText(accumulated),
      onStreamingEnd: () => {
        state.setStreamingText('');
        state.setIsStreaming(false);
      },
      onError: (error) => {
        state.setStreamingText('');
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
          greeting={greeting}
          isLoading={state.isLoading}
          isStreaming={state.isStreaming}
          streamingText={state.streamingText}
          sessionList={state.sessionList}
          sessionId={state.sessionId}
          onSelectSession={state.loadSession}
          onNewChat={state.newChat}
          onExport={handleExport}
          onClear={state.clearChat}
          onAttachFiles={state.addAttachments}
          attachmentCount={state.attachments.length}
          activeAgentName={state.activeAgent.name}
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
