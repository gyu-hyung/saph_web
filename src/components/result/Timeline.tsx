import { useRef } from 'react';
import type { SubtitleEntry } from '../../utils/srtParser';
import { formatTimeShort } from '../../utils/formatTime';

interface Props {
  entries: SubtitleEntry[];
  durationMs: number;
  currentTimeMs: number;
  onSeek: (ms: number) => void;
}

const RULER_H = 28;
const TRACK_H = 40;
const TOTAL_H = RULER_H + TRACK_H + 12; // 12px padding

function getTickInterval(durationMs: number): number {
  const durationSec = durationMs / 1000;
  if (durationSec <= 30) return 5000;
  if (durationSec <= 120) return 10000;
  if (durationSec <= 300) return 30000;
  return 60000;
}

export default function Timeline({ entries, durationMs, currentTimeMs, onSeek }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (durationMs <= 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(Math.max(0, Math.min(durationMs, Math.round(ratio * durationMs))));
  };

  const tickInterval = getTickInterval(durationMs);
  const ticks: number[] = [];
  for (let t = 0; t <= durationMs; t += tickInterval) {
    ticks.push(t);
  }

  const pct = (ms: number) => `${(ms / durationMs) * 100}%`;
  const playheadPct = (currentTimeMs / durationMs) * 100;

  return (
    <div
      style={{
        height: `${TOTAL_H}px`,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        padding: '6px 0',
      }}
    >
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          height: `${RULER_H + TRACK_H}px`,
          margin: '0 16px',
          cursor: 'crosshair',
        }}
      >
        {/* Ruler ticks */}
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: pct(t),
              top: 0,
              height: `${RULER_H}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTimeShort(t)}
            </span>
            <div
              style={{
                width: '1px',
                flex: 1,
                background: 'var(--border)',
              }}
            />
          </div>
        ))}

        {/* Subtitle track */}
        <div
          style={{
            position: 'absolute',
            top: `${RULER_H}px`,
            left: 0,
            right: 0,
            height: `${TRACK_H}px`,
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {entries.map((entry) => {
            const isActive = currentTimeMs >= entry.startMs && currentTimeMs <= entry.endMs;
            return (
              <div
                key={entry.index}
                style={{
                  position: 'absolute',
                  left: pct(entry.startMs),
                  width: pct(entry.endMs - entry.startMs),
                  top: '6px',
                  height: `${TRACK_H - 12}px`,
                  background: isActive ? 'var(--accent)' : 'rgba(99, 102, 241, 0.35)',
                  borderRadius: '3px',
                  transition: 'background 0.1s',
                }}
              />
            );
          })}
        </div>

        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            left: `${playheadPct}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: '#ffffff',
            pointerEvents: 'none',
            zIndex: 2,
            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </div>
  );
}
