import { useRef, useState, useEffect } from 'react';
import { Button, Chip } from '../ui';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ChatHistoryList } from '../chat/ChatHistoryList';
import type { ChatSession } from '../../types';
import * as React from 'react';

const WORKSPACES = ['Personal', 'Dev', 'Study', 'Research'];

interface SidebarProps {
  sidebarOpen: boolean;
  onNewChat: () => void;
  onNavView: (view: string) => void;
  activeView: string;
  onWorkspaceChange?: (name: string) => void;
  activeWorkspace?: string;
  onToggleSidebar?: () => void;
  onSettings?: () => void;
  chatSessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function Sidebar({
  sidebarOpen,
  onNewChat,
  onNavView,
  activeView,
  activeWorkspace = 'Personal',
  onWorkspaceChange,
  onToggleSidebar,
  onSettings,
  chatSessions = [],
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 860px)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 860px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useClickOutside(
    () => {
      if (isMobile && sidebarOpen && onToggleSidebar) {
        onToggleSidebar();
      }
    },
    isMobile && sidebarOpen
  );
  const navItems = [
    { view: 'chat', icon: '💬', label: 'Chat' },
    { view: 'agents', icon: '🤖', label: 'Agents' },
    { view: 'memory', icon: '🧠', label: 'Memory' },
    { view: 'tools', icon: '🛠', label: 'Tools' },
    { view: 'files', icon: '📁', label: 'Files' },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}
      aria-label="Sidebar"
    >
      <div className="sidebar__top">
        <div className="brand">
          <div className="brand__mark">✦</div>
          <div className="brand__text">
            <div className="brand__name">Aika AI</div>
            <div className="brand__sub">local · private · fast</div>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onNewChat}>
          <span>＋</span> New Chat
        </Button>

        {chatSessions.length > 0 && activeView === 'chat' && (
          <div className="section">
            <div className="section__title">Chat History</div>
            <ChatHistoryList
              sessions={chatSessions}
              activeSessionId={activeSessionId}
              onSelectSession={onSelectSession || (() => {})}
              onDeleteSession={onDeleteSession || (() => {})}
            />
          </div>
        )}

        <div className="section">
          <div className="section__title">Features</div>
          <div className="nav">
            {navItems.map(({ view, icon, label }) => (
              <button
                key={view}
                type="button"
                className={`nav__item ${activeView === view ? 'is-active' : ''}`}
                data-view={view}
                onClick={() => onNavView(view)}
              >
                <span className="nav__icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__title">Workspaces</div>
          <div className="chips">
            {WORKSPACES.map((name) => (
              <Chip
                key={name}
                active={activeWorkspace === name}
                onClick={() => onWorkspaceChange?.(name)}
              >
                {name}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar__bottom">
        <div className="miniCard">
          <div className="miniCard__title">Local Mode</div>
          <div className="miniCard__desc">All processing stays on your machine.</div>
          <div className="miniCard__row">
            <span className="pill pill--green">Online UI</span>
            <span className="pill">No telemetry</span>
          </div>
        </div>

        <Button variant="ghost" fullWidth onClick={onSettings}>
          ⚙ Settings
        </Button>
      </div>
    </aside>
  );
}
