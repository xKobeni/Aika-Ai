import { useState } from 'react';
import type { ChatSession } from '../../types';
import { escapeHtml } from '../../lib/utils';

interface ChatHistoryListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  searchQuery?: string;
}

export function ChatHistoryList({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  searchQuery = '',
}: ChatHistoryListProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const filteredSessions = sessions.filter((session) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.preview?.toLowerCase().includes(query)
    );
  });

  const groupedSessions = groupSessionsByDate(filteredSessions);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chatHistory">
      <div className="chatHistory__search">
        <input
          type="text"
          placeholder="🔍 Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="chatHistory__searchInput"
        />
      </div>

      <div className="chatHistory__list">
        {filteredSessions.length === 0 ? (
          <div className="chatHistory__empty">
            <div className="muted">No chat history yet.</div>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([groupLabel, groupSessions]) => (
            <div key={groupLabel} className="chatHistory__group">
              <div className="chatHistory__groupLabel">{groupLabel}</div>
              {groupSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  isHovered={hoveredSession === session.id}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  onClick={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                  onRename={onRenameSession}
                  formatTime={formatTime}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: ChatSession;
  isActive: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onDelete: () => void;
  onRename?: (sessionId: string, newTitle: string) => void;
  formatTime: (dateString: string) => string;
}

function SessionCard({
  session,
  isActive,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDelete,
  formatTime,
}: SessionCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`sessionCard ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => {
        onMouseEnter();
        setShowDelete(true);
      }}
      onMouseLeave={() => {
        onMouseLeave();
        setShowDelete(false);
      }}
      onClick={onClick}
    >
      <div className="sessionCard__content">
        <div className="sessionCard__title">{escapeHtml(session.title)}</div>
        {session.preview && (
          <div className="sessionCard__preview">{escapeHtml(session.preview)}</div>
        )}
        <div className="sessionCard__meta">
          <span className="sessionCard__time">{formatTime(session.lastActivityAt)}</span>
          <span className="sessionCard__count">{session.messageCount} msgs</span>
        </div>
      </div>
      {showDelete && (
        <button
          type="button"
          className="sessionCard__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete session"
          aria-label="Delete session"
        >
          🗑
        </button>
      )}
    </div>
  );
}

function groupSessionsByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  sessions.forEach((session) => {
    const sessionDate = new Date(session.lastActivityAt);
    let groupLabel: string;

    if (sessionDate >= today) {
      groupLabel = '📅 Today';
    } else if (sessionDate >= yesterday) {
      groupLabel = '📅 Yesterday';
    } else if (sessionDate >= weekAgo) {
      groupLabel = '📅 This Week';
    } else {
      groupLabel = '📅 Older';
    }

    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(session);
  });

  return groups;
}
