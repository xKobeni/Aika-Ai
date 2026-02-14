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
  isLoading?: boolean;
  chatSessions?: ChatSession[];
  activeSessionId?: string | null;
  onNewChat: () => void;
  onSelectSession?: (id: string) => void;
  onExport?: () => void;
  onClear?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function AppLayout({
  messages,
  prompt,
  onPromptChange,
  onSend,
  connectionStatus,
  isLoading,
  chatSessions = [],
  activeSessionId,
  onNewChat,
  onSelectSession,
  onExport,
  onClear,
  onRename,
  onDelete,
}: AppLayoutProps) {
  return (
    <div className="app">
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
        isLoading={isLoading}
      />
    </div>
  );
}
