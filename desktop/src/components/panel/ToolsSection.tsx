import type { Tool, ToolLogEntry } from '../../types';
import { Card } from '../ui';
import { escapeHtml } from '../../lib/utils';

interface ToolsSectionProps {
  tools: Tool[];
  toolLog: ToolLogEntry[];
  onToggleTool: (id: string) => void;
}

export function ToolsSection({ tools, toolLog, onToggleTool }: ToolsSectionProps) {
  return (
    <>
      <Card title="Enabled Tools">
        <div className="toolList">
          {tools.map((t) => (
            <div key={t.id} className="toolItem">
              <div className="toolItem__left">
                <div className="toolItem__name">{t.name}</div>
                <div className="toolItem__desc">{t.desc}</div>
              </div>
              <div className="toolItem__toggle">
                <div
                  className={`smallToggle ${t.enabled ? 'is-on' : ''}`}
                  role="switch"
                  aria-checked={t.enabled}
                  tabIndex={0}
                  onClick={() => onToggleTool(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleTool(t.id);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Tool Calls">
        <div className="muted">
          When the assistant uses tools, calls appear inside chat bubbles + here as a log.
        </div>
        <div className="toolLog">
          {toolLog.length === 0 ? (
            <div className="muted">No tool calls yet.</div>
          ) : (
            [...toolLog].reverse().map((item, i) => (
              <div key={i} className="logItem">
                <div className="logItem__top">
                  <div className="logItem__name">{escapeHtml(item.name)}</div>
                  <div className="logItem__time">{escapeHtml(item.time)}</div>
                </div>
                <div className="logItem__body">{escapeHtml(item.payload)}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
