import type { ReactNode } from 'react';
import { IconButton } from '../ui';
import { ConnectionStatus } from '../chat/ConnectionStatus';
import type { ConnectionStatus as ConnectionStatusType } from '../../types';

interface MainProps {
  modelName?: string;
  onMobileSidebar?: () => void;
  onExport?: () => void;
  onTogglePanel?: () => void;
  connectionStatus?: ConnectionStatusType;
  backendUrl?: string;
  onReconnect?: () => void;
  children: ReactNode;
}

export function Main({
  modelName = 'local-llm',
  onMobileSidebar,
  onExport,
  onTogglePanel,
  connectionStatus = 'connected',
  backendUrl,
  onReconnect,
  children,
}: MainProps) {
  return (
    <main className="main" aria-label="Main">
      <header className="topbar">
        <div className="topbar__left">
          <IconButton
            iconOnly
            onClick={onMobileSidebar}
            aria-label="Toggle sidebar"
            className="mobileSidebarBtn"
          >
            ☰
          </IconButton>
          <div className="modelPill">
            <span className="dot dot--purple" />
            <span className="modelPill__text">Aika Model</span>
            <span className="modelPill__muted">{modelName}</span>
          </div>
          <ConnectionStatus
            status={connectionStatus}
            backendUrl={backendUrl}
            onReconnect={onReconnect}
          />
        </div>

        <div className="topbar__right">
          <IconButton onClick={onExport} title="Export chat">
            ⬇ <span>Export</span>
          </IconButton>
          <IconButton onClick={onTogglePanel} title="Toggle panel">
            🧩 <span>Panel</span>
          </IconButton>
        </div>
      </header>

      {children}
    </main>
  );
}
