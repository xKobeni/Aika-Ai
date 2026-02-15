import { useRef, useState } from 'react';
import { useAikaUI } from '../contexts/AikaUIContext';
import { useSystemStats } from '../hooks/useSystemStats';
import type { ConnectionStatus as ConnStatus } from '../types';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
}

interface SidebarProps {
  connectionStatus?: ConnStatus;
  chatSessions?: ChatSession[];
  activeSessionId?: string | null;
  onNewChat: () => void;
  onSelectSession?: (id: string) => void;
  onExport?: () => void;
  onClear?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function Sidebar({
  connectionStatus = 'disconnected',
  chatSessions = [],
  activeSessionId,
  onNewChat,
  onSelectSession,
  onExport,
  onClear,
  onRename,
  onDelete,
}: SidebarProps) {
  const ui = useAikaUI();
  const [search, setSearch] = useState('');
  const syslogRef = useRef<HTMLDivElement>(null);
  const systemStats = useSystemStats(1500);

  const statusText =
    connectionStatus === 'connected'
      ? 'Online'
      : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
        ? 'Connecting…'
        : 'Disconnected';
  const dotClass =
    connectionStatus === 'connected' ? '' : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'white' : 'red';

  const barsOn = ui.eyesState === 'thinking' || ui.eyesState === 'speaking' || ui.eyesState === 'listening';

  const filtered = search.trim()
    ? chatSessions.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.preview.toLowerCase().includes(search.toLowerCase())
      )
    : chatSessions;

  const collapsed = ui.settings.sidebarCollapsed;
  const toggleCollapse = () => ui.updateSettings({ sidebarCollapsed: !collapsed });

  return (
    <aside className={`sidebar ${ui.sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-inner">
        <div className="brand">
          <div className="brandMain">
            <h1>Aika AI</h1>
            <div className="tag">CHAT / SESSIONS</div>
          </div>
          <button
            type="button"
            className="sidebarCollapseBtn"
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-collapsed={collapsed ? 'true' : 'false'}
          >
            <span className="sidebarCollapseIcon" aria-hidden>{collapsed ? '▶' : '◀'}</span>
          </button>
        </div>

        <div className="statusStrip">
          <div className="statusTop">
            <div className="hint">AI STATUS</div>
            <div className="pill" id="statusPill">
              <span className={`dot ${dotClass}`} id="statusDot" />
              <span id="statusText">{statusText}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="hint">activity</div>
            <div
              className="bars"
              id="activityBars"
              aria-hidden
              style={{ opacity: barsOn ? 1 : 0.45, filter: barsOn ? 'none' : 'grayscale(1)' }}
            >
              <div className="bar" />
              <div className="bar" />
              <div className="bar" />
              <div className="bar" />
              <div className="bar" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="hint">voice</div>
            <div className="hint" id="voiceHint">
              {ui.settings.voice ? 'on' : 'off'}
            </div>
          </div>
        </div>

        {systemStats && (
          <div className="systemStats" aria-label="System usage">
            <div className="systemStatsTitle hint">SYSTEM</div>
            <div className="systemStatRow">
              <span className="systemStatLabel">RAM</span>
              <div className="systemStatBarWrap">
                <div
                  className="systemStatBar"
                  style={{ width: `${Math.min(100, systemStats.ramPercent)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(systemStats.ramPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="systemStatVal">
                {systemStats.ramUsedMb} / {systemStats.ramTotalMb} MB
              </span>
            </div>
            <div className="systemStatRow">
              <span className="systemStatLabel">CPU</span>
              <div className="systemStatBarWrap">
                <div
                  className="systemStatBar systemStatBarCpu"
                  style={{ width: `${Math.min(100, systemStats.cpu)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(systemStats.cpu)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="systemStatVal">{Math.round(systemStats.cpu)}%</span>
            </div>
            <div className="systemStatRow">
              <span className="systemStatLabel">GPU</span>
              <div className="systemStatBarWrap">
                <div
                  className="systemStatBar systemStatBarGpu"
                  style={{ width: systemStats.gpu != null ? `${Math.min(100, systemStats.gpu)}%` : '0%' }}
                  role="progressbar"
                  aria-valuenow={systemStats.gpu != null ? Math.round(systemStats.gpu) : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="systemStatVal">
                {systemStats.gpu != null ? `${Math.round(systemStats.gpu)}%` : '—'}
              </span>
            </div>
          </div>
        )}

        <div className="sidebarTopActions">
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onNewChat} title="New Chat">
            New Chat
          </button>
          <button type="button" className="btn icon" title="Rename" onClick={onRename} data-icon="✎">
            ✎
          </button>
          <button type="button" className="btn icon danger" title="Delete" onClick={onDelete} data-icon="×">
            🗑
          </button>
        </div>

        <input
          className="search"
          id="chatSearch"
          placeholder="Search chats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="sectionTitle">
          <div>Chat History</div>
          <small id="chatCountHint">{chatSessions.length}</small>
        </div>

        <div className="chatListWrap">
          <div className="chatList" id="chatList">
            {filtered.map((chat) => (
              <div
                key={chat.id}
                className={`chatItem ${chat.id === activeSessionId ? 'active' : ''}`}
                onClick={() => onSelectSession?.(chat.id)}
              >
                <div className="chatItemTop">
                  <div className="chatItemTitle" title={chat.title}>
                    {chat.title}
                  </div>
                  <div className="chatItemMeta">{chat.updatedAt}</div>
                </div>
                <div className="chatItemPreview">{chat.preview}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebarBottomActions">
          <button type="button" className="btn" onClick={onExport}>
            Export
          </button>
          <button type="button" className="btn danger" onClick={onClear}>
            Clear
          </button>
        </div>

        <div className="syslog" id="syslog" ref={syslogRef}>
          <div>
            <strong>SYSLOG</strong> :: {connectionStatus === 'connected' ? 'online ✔️' : 'offline'}
          </div>
          <div>voice: settings → Voice Mode</div>
          <div>tip: double click eyes = focus</div>
        </div>

        <div className="hint brandHint sidebarVersionBottom" id="buildHintBottom">
          v2.1
        </div>
      </div>
    </aside>
  );
}
