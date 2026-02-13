import { useState, useCallback, useRef, useEffect } from 'react';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { SidebarPage } from './pages/SidebarPage';
import { MainPage } from './pages/MainPage';
import { PanelPage } from './pages/PanelPage';
import { Composer, type ComposerHandle } from './components/chat/Composer';
import { Settings } from './components/Settings';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PersonalityModal } from './components/PersonalityModal';
import { Modal, Button } from './components/ui';
import { useAppState } from './hooks/useAppState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { sendChatMessage, sendVisionMessage } from './lib/chatApi';
import { getGreeting } from './lib/api';
import { nowTime } from './lib/utils';
import { toast } from './lib/toast';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import type { ImageAttachment } from './types';

export default function App() {
  console.log('App component rendering...');
  const state = useAppState();
  const composerRef = useRef<ComposerHandle>(null);
  const connectionStatus = useConnectionStatus();
  console.log('App state initialized, connectionStatus:', connectionStatus.status);
  
  // Load greeting message on mount
  useEffect(() => {
    if (state.showHero && state.messages.length === 0) {
      getGreeting()
        .then((greeting) => {
          // Optionally show greeting in hero or first message
          // For now, we'll just log it - you can customize this
          console.log('Greeting:', greeting.message);
        })
        .catch((error) => {
          console.warn('Failed to load greeting:', error);
        });
    }
  }, [state.showHero, state.messages.length]);

  const [modal, setModal] = useState<{
    type: 'voice' | 'image' | 'agent' | 'memory' | 'settings' | 'shortcuts' | 'personality';
    data?: string;
  } | null>(null);
  const [memoryInput, setMemoryInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');

  const openRightPanel = useCallback(() => {
    state.setRightPanelOpen(true);
  }, [state]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFocusComposer: () => composerRef.current?.focus(),
    onShowShortcuts: () => setModal({ type: 'shortcuts' }),
    onNewChat: state.newChat,
    onCloseModals: () => setModal(null),
    onTogglePanel: () => state.setRightPanelOpen(!state.rightPanelOpen),
  });

  const handleSend = useCallback(async () => {
    const text = state.prompt.trim();
    if (!text && state.attachments.length === 0) return;
    state.showChat();
    const snapshotAttachments = state.attachments.map((a) => ({ name: a.name, size: a.size }));
    state.addUserMessage(text || '(sent attachments)');
    state.setPrompt('');
    
    // Handle image attachments with vision API
    const imageAttachments = state.attachments.filter((a) => a.type?.startsWith('image/'));
    if (imageAttachments.length > 0 && imageAttachments[0]) {
      // For now, handle first image attachment
      // In a real implementation, you'd need to convert Attachment to File
      toast('Image analysis requires file upload - using text chat instead');
    }

    // Send chat message to backend
    await sendChatMessage({
      message: text || '',
      sessionId: state.sessionId,
      attachments: snapshotAttachments,
      streamEnabled: state.streamEnabled,
      onAddAssistantMessage: state.addAssistantMessage,
      onPushToolLog: state.pushToolLog,
      onUpdateSessionId: state.setSessionId,
      onLoadingChange: state.setIsLoading,
      onStreamingStart: () => {
        state.setIsStreaming(true);
      },
      onStreamingUpdate: (text) => {
        // Real-time streaming updates - could update last message here
        // For now, we'll accumulate and show at the end
      },
      onStreamingEnd: () => {
        state.setIsStreaming(false);
      },
      onError: (error) => {
        console.error('Chat API error:', error);
        state.setIsStreaming(false);
        state.setIsLoading(false);
        toast(`Error: ${error.message}`);
        // Fallback: show error message
        state.addAssistantMessage(
          `Sorry, I encountered an error: ${error.message}. Please try again.`,
          { badges: [{ text: 'Error', kind: 'neutral' }] }
        );
      },
    });
  }, [state]);

  const handleQuickAction = useCallback(
    (action: 'image' | 'brainstorm' | 'plan' | 'agent') => {
      state.showChat();
      if (action === 'image') setModal({ type: 'image' });
      if (action === 'brainstorm') state.setPrompt('Brainstorm 10 ideas for…');
      if (action === 'plan') state.setPrompt('Make a step-by-step plan for…');
      if (action === 'agent') setModal({ type: 'agent' });
    },
    [state]
  );

  const handleExport = useCallback(() => {
    const exportObj = {
      app: 'Aika AI UI',
      exportedAt: new Date().toISOString(),
      agent: state.activeAgentId,
      tools: state.tools,
      memory: state.memory,
      messages: state.messages,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aika-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [state]);

  const handleAddMemoryFromModal = useCallback(() => {
    const v = memoryInput.trim();
    if (v) {
      state.addMemory(v);
      setModal(null);
      setMemoryInput('');
      toast('🧠 Saved to memory');
    }
  }, [memoryInput, state]);

  const handleImageGenerate = useCallback(() => {
    const prompt = imagePrompt.trim() || 'Abstract glass orb';
    state.pushToolLog({
      name: 'image.generate',
      payload: JSON.stringify({ prompt }, null, 2),
      time: nowTime(),
    });
    state.addAssistantMessage(
      `Image generation queued: "${prompt}"\n\n(When you wire your local generator, show the resulting image as an attachment card.)`,
      {
        badges: [
          { text: 'Image Gen', kind: 'neutral' },
          { text: 'Local', kind: 'good' },
        ],
        toolCalls: [
          {
            name: 'image.generate',
            status: 'queued',
            payload: JSON.stringify({ prompt }, null, 2),
          },
        ],
      }
    );
    setModal(null);
    setImagePrompt('');
  }, [imagePrompt, state]);

  const handleSwitchAgent = useCallback(
    (id: string) => {
      const agent = state.agents.find((a) => a.id === id);
      state.setActiveAgentId(id);
      state.addAssistantMessage(`Switched agent to **${agent?.name}**. What are we working on?`, {
        badges: [{ text: 'Agent switched', kind: 'good' }],
      });
      setModal(null);
    },
    [state]
  );

  const [imageAttachments, setImageAttachments] = useState<ImageAttachment[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleVoiceStart = useCallback(() => {
    setIsVoiceActive(true);
    // TODO: Initialize voice recognition/recording here
    console.log('Voice input started');
  }, []);

  const handleVoiceStop = useCallback(() => {
    setIsVoiceActive(false);
    // TODO: Stop voice recognition/recording here
    console.log('Voice input stopped');
  }, []);

  const composer = (
    <Composer
      ref={composerRef}
      prompt={state.prompt}
      onPromptChange={state.setPrompt}
      onSend={handleSend}
      streamEnabled={state.streamEnabled}
      onStreamToggle={state.setStreamEnabled}
      safeEnabled={state.safeEnabled}
      onSafeToggle={state.setSafeEnabled}
      activeAgentName={state.activeAgent.name}
      toolsCount={state.enabledToolsCount}
      memoryState={state.memoryStateLabel}
      onAgentClick={() => setModal({ type: 'agent' })}
      onToolsClick={() => {
        state.setPanelTab('tools');
        openRightPanel();
      }}
      onMemoryClick={() => {
        state.setPanelTab('memory');
        openRightPanel();
      }}
      attachments={state.attachments}
      onAttach={state.addAttachments}
      onRemoveAttachment={state.removeAttachment}
      imageAttachments={imageAttachments}
      onAddImages={(images) => setImageAttachments((prev) => [...prev, ...images])}
      onRemoveImage={(id) => setImageAttachments((prev) => prev.filter((img) => img.id !== id))}
      onImageGen={() => setModal({ type: 'image' })}
      onVoice={() => {
        // Toggle voice modal if not using orb
        if (!isVoiceActive) {
          setModal({ type: 'voice' });
        }
      }}
      onVoiceStart={handleVoiceStart}
      onVoiceStop={handleVoiceStop}
      isVoiceActive={isVoiceActive}
      onClear={() => {
        state.clearChat();
        setImageAttachments([]);
        toast('Chat cleared');
      }}
      isLoading={state.isLoading}
    />
  );

  // Determine layout classes based on sidebar and panel state
  const getLayoutClasses = () => {
    const classes = [];
    if (!state.sidebarOpen) classes.push('sidebar-closed');
    if (!state.rightPanelOpen) classes.push('panel-closed');
    return classes.join(' ');
  };

  return (
    <>
      <AmbientBackground />
      <div className={`app ${getLayoutClasses()}`}>
        <SidebarPage
          sidebarOpen={state.sidebarOpen}
          onNewChat={state.newChat}
          onNavView={state.navView}
          activeView={state.view}
          activeWorkspace={state.activeWorkspace}
          onWorkspaceChange={state.setActiveWorkspace}
          onToggleSidebar={() => state.setSidebarOpen(!state.sidebarOpen)}
          onSettings={() => setModal({ type: 'settings' })}
          chatSessions={[]}
          activeSessionId={undefined}
          onSelectSession={(id) => {
            // TODO: Load session when backend is connected
            console.log('Select session:', id);
          }}
          onDeleteSession={(id) => {
            // TODO: Delete session when backend is connected
            console.log('Delete session:', id);
          }}
        />

        <MainPage
          modelName="local-llm"
          showHero={state.showHero}
          messages={state.messages}
          composer={composer}
          onMobileSidebar={() => state.setSidebarOpen(!state.sidebarOpen)}
          onExport={handleExport}
          onTogglePanel={() => state.setRightPanelOpen(!state.rightPanelOpen)}
          onQuickAction={handleQuickAction}
          connectionStatus={connectionStatus.status}
          backendUrl="http://localhost:8000"
          onReconnect={connectionStatus.reconnect}
          isStreaming={state.isStreaming}
          isLoading={state.isLoading}
          activeAgentName={state.activeAgent.name}
        />

        <PanelPage
          panelOpen={state.rightPanelOpen}
          activeTab={state.panelTab}
          onTabChange={state.setPanelTab}
          onClose={() => state.setRightPanelOpen(false)}
          activeAgent={state.activeAgent}
          modelName="local-llm"
          latency="~120ms"
          onSwitchAgent={() => setModal({ type: 'agent' })}
          onEditPersonality={() => setModal({ type: 'personality' })}
          tools={state.tools}
          toolLog={state.toolLog}
          onToggleTool={state.toggleTool}
          memory={state.memory}
          onAddMemory={() => setModal({ type: 'memory' })}
          onClearMemory={() => {
            state.clearMemory();
            toast('Memory cleared');
          }}
          onRemoveMemory={state.removeMemory}
          attachments={state.attachments}
          onRemoveFile={state.removeAttachment}
          onOpenImageGen={() => {
            state.showChat();
            setModal({ type: 'image' });
          }}
        />
      </div>

      {/* Modals */}
      <Modal
        open={modal?.type === 'voice'}
        title="Voice Input"
        onClose={() => setModal(null)}
        footer={
          <Button variant="ghost" onClick={() => setModal(null)}>
            Close
          </Button>
        }
      >
        <div className="muted" style={{ marginBottom: 10 }}>
          This is a UI stub. Wire this to Web Speech API (browser) or a local Whisper endpoint.
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => toast('🎙️ Recording… (demo)')}
          >
            Start
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              state.setPrompt(
                'Draft a clean UI spec for Aika AI with agents, tools, memory, and files.'
              );
              setModal(null);
            }}
          >
            Insert sample transcript
          </Button>
        </div>
      </Modal>

      <Modal
        open={modal?.type === 'image'}
        title="Image Generation"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImageGenerate}>
              Generate
            </Button>
          </>
        }
      >
        <div className="muted" style={{ marginBottom: 10 }}>
          UI stub for image generation. Replace the “Generate” handler with your pipeline.
        </div>
        <label className="muted">Prompt</label>
        <div style={{ height: 8 }} />
        <textarea
          id="imgPrompt"
          rows={3}
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="e.g., Neon glass orb icon for Aika AI"
          style={{
            width: '100%',
            resize: 'none',
            outline: 'none',
            border: '1px solid rgba(255,255,255,.10)',
            borderRadius: 14,
            padding: 10,
            background: 'rgba(255,255,255,.03)',
            color: 'rgba(242,243,255,.92)',
            fontFamily: 'Inter, system-ui',
          }}
        />
        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            onClick={() =>
              setImagePrompt(
                'Glassy neon orb logo icon, purple/cyan highlights, dark background'
              )
            }
          >
            Orb logo
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setImagePrompt(
                'Abstract gradient glass wallpaper, purple and cyan, subtle noise, soft orbs'
              )
            }
          >
            Chat wallpaper
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setImagePrompt(
                'Cute minimal agent avatar icons set, glass style, purple/cyan accents'
              )
            }
          >
            Agent avatar set
          </Button>
        </div>
      </Modal>

      <Modal
        open={modal?.type === 'agent'}
        title="Switch Agent"
        onClose={() => setModal(null)}
        footer={
          <Button variant="ghost" onClick={() => setModal(null)}>
            Close
          </Button>
        }
      >
        <div className="muted" style={{ marginBottom: 10 }}>
          Choose an agent. The active agent appears in bubble badges and the right panel.
        </div>
        {state.agents.map((a) => (
          <button
            key={a.id}
            type="button"
            className="agentPick"
            onClick={() => handleSwitchAgent(a.id)}
          >
            <div className="agentPick__icon">{a.icon}</div>
            <div className="agentPick__meta">
              <div className="agentPick__name">{a.name}</div>
              <div className="agentPick__desc">{a.desc}</div>
              <div className="agentPick__skills">
                {a.skills.map((s) => (
                  <span key={s} className="pill">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </Modal>

      <Modal
        open={modal?.type === 'memory'}
        title="Add Memory"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMemoryFromModal}>
              Save
            </Button>
          </>
        }
      >
        <div className="muted" style={{ marginBottom: 10 }}>
          Store a local fact that Aika can reuse.
        </div>
        <input
          value={memoryInput}
          onChange={(e) => setMemoryInput(e.target.value)}
          placeholder="e.g., My favorite editor is VS Code"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,.10)',
            background: 'rgba(255,255,255,.03)',
            color: 'rgba(242,243,255,.92)',
            outline: 'none',
          }}
        />
          </Modal>

      {/* Settings Modal */}
      <Settings
        open={modal?.type === 'settings'}
        onClose={() => setModal(null)}
        streamEnabled={state.streamEnabled}
        onStreamToggle={state.setStreamEnabled}
        safeEnabled={state.safeEnabled}
        onSafeToggle={state.setSafeEnabled}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        open={modal?.type === 'shortcuts'}
        onClose={() => setModal(null)}
      />

      {/* Personality Modal */}
      <PersonalityModal
        open={modal?.type === 'personality'}
        onClose={() => setModal(null)}
      />
    </>
  );
}
