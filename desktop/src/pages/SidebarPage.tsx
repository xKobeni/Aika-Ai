import { Sidebar } from '../components/layout/Sidebar';
import type { ChatSession } from '../types';

interface SidebarPageProps {
  sidebarOpen: boolean;
  onNewChat: () => void;
  onNavView: (view: string) => void;
  activeView: string;
  activeWorkspace: string;
  onWorkspaceChange: (name: string) => void;
  onToggleSidebar: () => void;
  onSettings: () => void;
  chatSessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function SidebarPage({
  sidebarOpen,
  onNewChat,
  onNavView,
  activeView,
  activeWorkspace,
  onWorkspaceChange,
  onToggleSidebar,
  onSettings,
  chatSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarPageProps) {
  return (
    <Sidebar
      sidebarOpen={sidebarOpen}
      onNewChat={onNewChat}
      onNavView={onNavView}
      activeView={activeView}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={onWorkspaceChange}
      onToggleSidebar={onToggleSidebar}
      onSettings={onSettings}
      chatSessions={chatSessions}
      activeSessionId={activeSessionId}
      onSelectSession={onSelectSession}
      onDeleteSession={onDeleteSession}
    />
  );
}
