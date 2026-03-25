export interface SubtitleEntry {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export function timeToMs(timeStr: string): number {
  // Supports "00:01:23,456" or "00:01:23.456"
  const normalized = timeStr.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secParts = parts[2].split('.');
  const seconds = parseInt(secParts[0], 10);
  const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + ms;
}

export function parseSrt(content: string): SubtitleEntry[] {
  if (!content || !content.trim()) return [];

  const entries: SubtitleEntry[] = [];
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0].trim(), 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1].trim();
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/
    );
    if (!timeMatch) continue;

    const startMs = timeToMs(timeMatch[1]);
    const endMs = timeToMs(timeMatch[2]);
    const text = lines.slice(2).join('\n').trim();

    entries.push({ index, startMs, endMs, text });
  }

  return entries;
}

export function getCurrentSubtitle(
  entries: SubtitleEntry[],
  currentMs: number
): SubtitleEntry | null {
  for (const entry of entries) {
    if (currentMs >= entry.startMs && currentMs <= entry.endMs) {
      return entry;
    }
  }
  return null;
}

export function applyOffset(entries: SubtitleEntry[], offsetMs: number): SubtitleEntry[] {
  if (offsetMs === 0) return entries;
  return entries.map((e) => ({
    ...e,
    startMs: Math.max(0, e.startMs + offsetMs),
    endMs: Math.max(0, e.endMs + offsetMs),
  }));
}
