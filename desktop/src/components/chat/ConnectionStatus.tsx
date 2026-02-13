import type { ConnectionStatus as ConnectionStatusType } from '../../types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  backendUrl?: string;
  lastPingTime?: number;
  onReconnect?: () => void;
  onClick?: () => void;
}

export function ConnectionStatus({
  status,
  backendUrl,
  lastPingTime,
  onReconnect,
  onClick,
}: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '●',
          text: 'Connected',
          className: 'connectionStatus--connected',
          color: 'var(--green)',
        };
      case 'connecting':
        return {
          icon: '⟳',
          text: 'Connecting...',
          className: 'connectionStatus--connecting',
          color: 'var(--amber)',
        };
      case 'reconnecting':
        return {
          icon: '⟳',
          text: 'Reconnecting...',
          className: 'connectionStatus--reconnecting',
          color: 'var(--amber)',
        };
      case 'disconnected':
        return {
          icon: '●',
          text: 'Disconnected',
          className: 'connectionStatus--disconnected',
          color: 'var(--pink)',
        };
      default:
        return {
          icon: '●',
          text: 'Unknown',
          className: 'connectionStatus--unknown',
          color: 'var(--muted)',
        };
    }
  };

  const config = getStatusConfig();
  const formatPingTime = () => {
    if (!lastPingTime) return null;
    const seconds = Math.floor((Date.now() - lastPingTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div
      className={`connectionStatus ${config.className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={backendUrl ? `Backend: ${backendUrl}` : undefined}
    >
      <span
        className="connectionStatus__dot"
        style={{
          color: config.color,
          boxShadow: `0 0 8px ${config.color}40`,
        }}
      >
        {config.icon}
      </span>
      <span className="connectionStatus__text">{config.text}</span>
      {lastPingTime && status === 'connected' && (
        <span className="connectionStatus__ping">{formatPingTime()}</span>
      )}
      {status === 'disconnected' && onReconnect && (
        <button
          type="button"
          className="connectionStatus__reconnect"
          onClick={(e) => {
            e.stopPropagation();
            onReconnect();
          }}
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
