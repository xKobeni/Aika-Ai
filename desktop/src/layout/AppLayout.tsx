import { useAikaUI } from '../contexts/AikaUIContext';
import { Sidebar } from './Sidebar';
import { Main } from './Main';
import type { Message } from '../types';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface AppLayoutProps {
  messages: Message[];
  prompt: string;
  onPromptChange: (v: string) => void;
  onSend: () => void;
  connectionStatus?: string;
  greeting?: string | null;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  chatSessions?: ChatSession[];
  activeSessionId?: string | null;
  onNewChat: () => void;
  onSelectSession?: (id: string) => void;
  onExport?: () => void;
  onClear?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onAttachFiles?: (files: File[]) => void;
  attachmentCount?: number;
  activeAgentName?: string;
}

export function AppLayout({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus,
  greeting,
  isLoading,
  isStreaming,
  streamingText,
  chatSessions = [],
  activeSessionId,
  onNewChat,
  onSelectSession,
  onExport,
  onClear,
  onRename,
  onDelete,
  onAttachFiles,
  attachmentCount = 0,
  activeAgentName,
}: AppLayoutProps) {
  const ui = useAikaUI();
  const collapsed = ui.settings.sidebarCollapsed;

  return (
    <div className={`app ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        connectionStatus={connectionStatus as any}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        onNewChat={onNewChat}
        onSelectSession={onSelectSession}
        onExport={onExport}
        onClear={onClear}
        onRename={onRename}
        onDelete={onDelete}
      />
      <Main
        messages={messages}
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSend={onSend}
        connectionStatus={connectionStatus}
        greeting={greeting}
        isLoading={isLoading}
        isStreaming={isStreaming}
        streamingText={streamingText}
        onAttachFiles={onAttachFiles}
        attachmentCount={attachmentCount}
        activeAgentName={activeAgentName}
      />
    </div>
  );
}
