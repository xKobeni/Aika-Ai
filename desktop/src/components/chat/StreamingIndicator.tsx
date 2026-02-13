import type { ConnectionStatus } from '../../types';

interface StreamingIndicatorProps {
  isStreaming?: boolean;
  connectionStatus?: ConnectionStatus;
  message?: string;
}

export function StreamingIndicator({
  isStreaming = false,
  connectionStatus = 'connected',
  message,
}: StreamingIndicatorProps) {
  if (!isStreaming && connectionStatus === 'connected') {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: '●',
          text: isStreaming ? 'Streaming...' : 'Connected',
          className: 'streamingIndicator--connected',
        };
      case 'connecting':
        return {
          icon: '⟳',
          text: 'Connecting...',
          className: 'streamingIndicator--connecting',
        };
      case 'reconnecting':
        return {
          icon: '⟳',
          text: 'Reconnecting...',
          className: 'streamingIndicator--reconnecting',
        };
      case 'disconnected':
        return {
          icon: '●',
          text: 'Disconnected',
          className: 'streamingIndicator--disconnected',
        };
      default:
        return {
          icon: '●',
          text: 'Unknown',
          className: 'streamingIndicator--unknown',
        };
    }
  };

  const config = getStatusConfig();
  const displayText = message || config.text;

  return (
    <div className={`streamingIndicator ${config.className}`}>
      <span className="streamingIndicator__icon">{config.icon}</span>
      <span className="streamingIndicator__text">{displayText}</span>
      {isStreaming && (
        <span className="streamingIndicator__dots">
          <span className="streamingIndicator__dot">.</span>
          <span className="streamingIndicator__dot">.</span>
          <span className="streamingIndicator__dot">.</span>
        </span>
      )}
    </div>
  );
}

interface TypingIndicatorProps {
  agentName?: string;
}

export function TypingIndicator({ agentName = 'Aika' }: TypingIndicatorProps) {
  return (
    <div className="typingIndicator">
      <div className="typingIndicator__avatar">{agentName === 'Aika' ? '✦' : '🤖'}</div>
      <div className="typingIndicator__content">
        <div className="typingIndicator__name">{agentName}</div>
        <div className="typingIndicator__dots">
          <span className="typingIndicator__dot" />
          <span className="typingIndicator__dot" />
          <span className="typingIndicator__dot" />
        </div>
      </div>
    </div>
  );
}
