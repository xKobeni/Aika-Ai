import { Modal, Button, Toggle, Card } from './ui';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  streamEnabled: boolean;
  onStreamToggle: (v: boolean) => void;
  safeEnabled: boolean;
  onSafeToggle: (v: boolean) => void;
}

export function Settings({
  open,
  onClose,
  streamEnabled,
  onStreamToggle,
  safeEnabled,
  onSafeToggle,
}: SettingsProps) {
  return (
    <Modal
      open={open}
      title="Settings"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="settings">
        <Card title="Chat">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle
              id="streamSetting"
              label="Stream responses"
              checked={streamEnabled}
              onChange={(e) => onStreamToggle(e.target.checked)}
            />
            <div className="muted" style={{ fontSize: 12, marginTop: -8 }}>
              Show responses as they're generated (character by character)
            </div>
          </div>
        </Card>

        <Card title="Safety">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle
              id="safeSetting"
              label="Safe mode"
              checked={safeEnabled}
              onChange={(e) => onSafeToggle(e.target.checked)}
            />
            <div className="muted" style={{ fontSize: 12, marginTop: -8 }}>
              Filter potentially harmful or inappropriate content
            </div>
          </div>
        </Card>

        <Card title="Model">
          <div className="kv">
            <div className="kv__row">
              <span>Current model</span>
              <span>local-llm</span>
            </div>
            <div className="kv__row">
              <span>Endpoint</span>
              <span className="muted">Local</span>
            </div>
            <div className="kv__row">
              <span>Latency</span>
              <span>~120ms</span>
            </div>
          </div>
        </Card>

        <Card title="Privacy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle id="telemetry" label="Send telemetry" checked={false} />
            <div className="muted" style={{ fontSize: 12, marginTop: -8 }}>
              Help improve Aika by sending anonymous usage data (disabled)
            </div>
            <Toggle id="localOnly" label="Local processing only" checked={true} />
            <div className="muted" style={{ fontSize: 12, marginTop: -8 }}>
              All processing happens on your machine. No data leaves your device.
            </div>
          </div>
        </Card>

        <Card title="Appearance">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Toggle id="animations" label="Enable animations" checked={true} />
            <div className="muted" style={{ fontSize: 12, marginTop: -8 }}>
              Smooth transitions and animations throughout the UI
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
