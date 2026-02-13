import type { Attachment } from '../../types';
import { Card, Button } from '../ui';
import { escapeHtml, fmtBytes } from '../../lib/utils';

interface FilesSectionProps {
  attachments: Attachment[];
  onRemoveFile: (id: string) => void;
  onOpenImageGen: () => void;
}

export function FilesSection({
  attachments,
  onRemoveFile,
  onOpenImageGen,
}: FilesSectionProps) {
  return (
    <>
      <Card title="Files">
        <div className="muted">Attached files appear here for quick reference.</div>
        <div className="fileList">
          {attachments.length === 0 ? (
            <div className="muted">No files attached.</div>
          ) : (
            attachments.map((f) => (
              <div key={f.id} className="fileItem">
                <div>
                  <div style={{ fontWeight: 750 }}>{escapeHtml(f.name)}</div>
                  <div className="muted">
                    {escapeHtml(f.type ?? 'file')} · {escapeHtml(fmtBytes(f.size))}
                  </div>
                </div>
                <div className="itemActions">
                  <button
                    type="button"
                    className="iconMini"
                    title="Remove"
                    onClick={() => onRemoveFile(f.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Image Generation">
        <div className="muted">
          Show generated images as cards in chat and here.
        </div>
        <Button variant="primary" fullWidth onClick={onOpenImageGen}>
          Generate an image
        </Button>
      </Card>
    </>
  );
}
