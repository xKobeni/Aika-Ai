import { Modal, Button } from './ui';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Cmd', 'K'], action: 'Focus composer' },
  { keys: ['Cmd', 'N'], action: 'New chat' },
  { keys: ['Cmd', 'B'], action: 'Toggle right panel' },
  { keys: ['Cmd', '/'], action: 'Show shortcuts' },
  { keys: ['Esc'], action: 'Close modals/panels' },
  { keys: ['Enter'], action: 'Send message' },
  { keys: ['Shift', 'Enter'], action: 'New line in composer' },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  return (
    <Modal
      open={open}
      title="Keyboard Shortcuts"
      onClose={onClose}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="shortcuts">
        {SHORTCUTS.map((shortcut, i) => (
          <div key={i} className="shortcutRow">
            <div className="shortcutRow__keys">
              {shortcut.keys.map((key, j) => (
                <span key={j} className="kbd">
                  {key === 'Cmd' ? modKey : key}
                </span>
              ))}
            </div>
            <div className="shortcutRow__action">{shortcut.action}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
