/**
 * Format milliseconds as "H:MM:SS.mmm" for subtitle list display.
 * e.g. 83456 → "0:01:23.456"
 */
export function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const millis = ms % 1000;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/**
 * Format milliseconds as "M:SS" for timeline ticks.
 * e.g. 83000 → "1:23"
 */
export function formatTimeShort(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate characters per second for a subtitle entry.
 */
export function calcCps(text: string, startMs: number, endMs: number): number {
  const durationSec = (endMs - startMs) / 1000;
  if (durationSec <= 0) return 0;
  return text.length / durationSec;
}
