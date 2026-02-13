export function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtBytes(bytes: number): string {
  if (bytes === undefined && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function escapeHtml(str: string | null | undefined): string {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Very light rich formatting: **bold** and `code` */
export function formatRichText(str: string): string {
  let s = escapeHtml(str);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(
    /`(.+?)`/g,
    "<code style='padding:2px 6px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(0,0,0,.25)'>$1</code>"
  );
  s = s.replace(/\n/g, '<br/>');
  return s;
}
