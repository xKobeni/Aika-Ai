import type { Agent } from '../../types';
import { Card, Button, Pill } from '../ui';

interface AgentSectionProps {
  agent: Agent;
  modelName: string;
  latency: string;
  onSwitchAgent: () => void;
  onEditPersonality?: () => void;
}

export function AgentSection({
  agent,
  modelName,
  latency,
  onSwitchAgent,
  onEditPersonality,
}: AgentSectionProps) {
  return (
    <>
      <Card title="Active Agent">
        <div className="agentCard">
          <div className="agentAvatar">{agent.icon}</div>
          <div className="agentMeta">
            <div className="agentName">{agent.name}</div>
            <div className="agentDesc">{agent.desc}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onEditPersonality && (
              <Button variant="ghost" onClick={onEditPersonality}>
                ✦ Personality
              </Button>
            )}
            <Button variant="ghost" onClick={onSwitchAgent}>
              Switch
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Agent Skills">
        <div className="pillRow">
          {agent.skills.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      </Card>

      <Card title="System">
        <div className="kv">
          <div className="kv__row">
            <span>Model</span>
            <span>{modelName}</span>
          </div>
          <div className="kv__row">
            <span>Latency</span>
            <span>{latency}</span>
          </div>
          <div className="kv__row">
            <span>Mode</span>
            <span className="pill pill--green">Local</span>
          </div>
        </div>
      </Card>
    </>
  );
}
