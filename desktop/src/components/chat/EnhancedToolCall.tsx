import { useState } from 'react';
import type { ToolCall, ToolCallResult } from '../../types';
import { escapeHtml } from '../../lib/utils';

interface EnhancedToolCallProps {
  toolCall: ToolCall | ToolCallResult;
  isResult?: boolean;
}

export function EnhancedToolCall({ toolCall, isResult = false }: EnhancedToolCallProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toolResult = isResult ? (toolCall as ToolCallResult) : null;
  const simpleToolCall = !isResult ? (toolCall as ToolCall) : null;

  const toolName = toolResult?.tool || simpleToolCall?.name || 'unknown';
  const status = toolResult?.status || simpleToolCall?.status || 'ok';
  const args = toolResult?.args || (simpleToolCall?.payload ? JSON.parse(simpleToolCall.payload) : null);
  const result = toolResult?.result;
  const error = toolResult?.error;
  const executionTime = toolResult?.executionTime;

  const getStatusConfig = () => {
    switch (status) {
      case 'queued':
        return {
          icon: '⏱',
          label: 'Queued',
          className: 'toolCallCard--queued',
        };
      case 'running':
        return {
          icon: '⟳',
          label: 'Running',
          className: 'toolCallCard--running',
        };
      case 'success':
        return {
          icon: '✓',
          label: 'Success',
          className: 'toolCallCard--success',
        };
      case 'error':
        return {
          icon: '✕',
          label: 'Error',
          className: 'toolCallCard--error',
        };
      default:
        return {
          icon: '🛠',
          label: status,
          className: 'toolCallCard--default',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`toolCallCard ${statusConfig.className}`}>
      <div
        className="toolCallCard__header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="toolCallCard__headerLeft">
          <span className="toolCallCard__icon">{statusConfig.icon}</span>
          <span className="toolCallCard__name">{escapeHtml(toolName)}</span>
          <span className={`toolCallCard__status toolCallCard__status--${status}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="toolCallCard__headerRight">
          {executionTime && (
            <span className="toolCallCard__time">{executionTime}ms</span>
          )}
          <span className="toolCallCard__toggle">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="toolCallCard__body">
          {args && (
            <div className="toolCallCard__section">
              <div className="toolCallCard__sectionTitle">Arguments</div>
              <pre className="toolCallCard__code">
                {escapeHtml(JSON.stringify(args, null, 2))}
              </pre>
            </div>
          )}

          {result && (
            <div className="toolCallCard__section">
              <div className="toolCallCard__sectionTitle">Result</div>
              {typeof result === 'object' ? (
                <pre className="toolCallCard__code">
                  {escapeHtml(JSON.stringify(result, null, 2))}
                </pre>
              ) : (
                <div className="toolCallCard__text">{escapeHtml(String(result))}</div>
              )}
            </div>
          )}

          {error && (
            <div className="toolCallCard__section toolCallCard__section--error">
              <div className="toolCallCard__sectionTitle">Error</div>
              <div className="toolCallCard__error">{escapeHtml(error)}</div>
            </div>
          )}

          {simpleToolCall?.payload && !args && (
            <div className="toolCallCard__section">
              <div className="toolCallCard__sectionTitle">Payload</div>
              <pre className="toolCallCard__code">{escapeHtml(simpleToolCall.payload)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
