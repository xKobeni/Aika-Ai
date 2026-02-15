import { useAikaUI } from '../../contexts/AikaUIContext';
import type { ConnectionStatus as ConnStatus } from '../../types';

interface HeaderBadgesProps {
  connectionStatus?: ConnStatus;
  activeAgentName?: string;
  onFocusClick: () => void;
  onSettingsClick: () => void;
}

export function HeaderBadges({
  connectionStatus = 'disconnected',
  activeAgentName,
  onFocusClick,
  onSettingsClick,
}: HeaderBadgesProps) {
  const ui = useAikaUI();

  const lookAtAnd = (clientX: number, clientY: number, fn: () => void, durationMs = 1500) => {
    ui.setLookAt({ clientX, clientY }, durationMs);
    fn();
  };
  const connText =
    connectionStatus === 'connected'
      ? 'CONNECTED :: LOCALHOST'
      : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
        ? 'CONNECTING…'
        : 'DISCONNECTED';

  return (
    <div className="headerBadges">
      <div className="badgeRow">
        <div className="badge" id="connBadge">
          {connText}
        </div>
        {activeAgentName && (
          <div className="badge" id="agentBadge" title="Active model">
            MODEL :: {activeAgentName.toUpperCase().slice(0, 16)}
          </div>
        )}
      </div>
      <div className="badgeRow">
        <button
          type="button"
          className="headerBtn"
          id="btnFocus"
          title="Toggle focus (F)"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            lookAtAnd(r.left + r.width / 2, r.top + r.height / 2, onFocusClick);
          }}
        >
          F
        </button>
        <button
          type="button"
          className="headerBtn"
          id="btnSettingsOpen"
          title="Settings"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            lookAtAnd(r.left + r.width / 2, r.top + r.height / 2, onSettingsClick);
          }}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
