import { Card, Button } from '../ui';
import { escapeHtml } from '../../lib/utils';

interface MemorySectionProps {
  memory: string[];
  onAdd: () => void;
  onClear: () => void;
  onRemove: (index: number) => void;
}

export function MemorySection({
  memory,
  onAdd,
  onClear,
  onRemove,
}: MemorySectionProps) {
  return (
    <Card title="Memory">
      <div className="muted">Saved facts the assistant can reuse (local only).</div>
      <div className="memoryControls">
        <Button variant="ghost" onClick={onAdd}>
          ＋ Add
        </Button>
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="memoryList">
        {memory.length === 0 ? (
          <div className="muted">No saved memory.</div>
        ) : (
          memory.map((m, idx) => (
            <div key={idx} className="memoryItem">
              <div className="memoryItem__text">{escapeHtml(m)}</div>
              <div className="itemActions">
                <button
                  type="button"
                  className="iconMini"
                  title="Remove"
                  onClick={() => onRemove(idx)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
