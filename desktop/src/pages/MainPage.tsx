import { Main } from '../components/layout/Main';
import { Hero } from '../components/chat/Hero';
import { ChatArea } from '../components/chat/ChatArea';
import type { Message, ConnectionStatus } from '../types';
import type { ReactNode } from 'react';

interface MainPageProps {
  modelName: string;
  showHero: boolean;
  messages: Message[];
  composer: ReactNode;
  onMobileSidebar: () => void;
  onExport: () => void;
  onTogglePanel: () => void;
  onQuickAction: (action: 'image' | 'brainstorm' | 'plan' | 'agent') => void;
  connectionStatus?: ConnectionStatus;
  backendUrl?: string;
  onReconnect?: () => void;
  isStreaming?: boolean;
  isLoading?: boolean;
  activeAgentName?: string;
}

export function MainPage({
  modelName,
  showHero,
  messages,
  composer,
  onMobileSidebar,
  onExport,
  onTogglePanel,
  onQuickAction,
  connectionStatus,
  backendUrl,
  onReconnect,
  isStreaming,
  isLoading,
  activeAgentName,
}: MainPageProps) {
  return (
    <Main
      modelName={modelName}
      onMobileSidebar={onMobileSidebar}
      onExport={onExport}
      onTogglePanel={onTogglePanel}
      connectionStatus={connectionStatus}
      backendUrl={backendUrl}
      onReconnect={onReconnect}
    >
      {showHero && messages.length === 0 && (
        <Hero onQuickAction={onQuickAction} />
      )}
      <ChatArea
        active={!showHero || messages.length > 0}
        messages={messages}
        composer={composer}
        isStreaming={isStreaming || isLoading}
        agentName={activeAgentName}
      />
    </Main>
  );
}
