import { useEffect, useRef } from 'react';
import type { SubtitleEntry } from '../../utils/srtParser';
import { formatTimestamp, calcCps } from '../../utils/formatTime';

interface Props {
  entries: SubtitleEntry[];
  currentTimeMs: number;
  onSeek: (ms: number) => void;
}

function CpsBadge({ cps }: { cps: number }) {
  const rounded = Math.round(cps);
  let color = 'var(--text-muted)';
  if (rounded > 25) color = '#ef4444';
  else if (rounded > 18) color = '#f59e0b';

  return (
    <span
      style={{
        fontSize: '10px',
        color,
        border: `1px solid ${color}`,
        borderRadius: '3px',
        padding: '1px 4px',
        whiteSpace: 'nowrap',
      }}
    >
      {rounded} cps
    </span>
  );
}

export default function SubtitleList({ entries, currentTimeMs, onSeek }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const lastActiveIndex = useRef<number>(-1);

  const activeIndex = entries.findIndex(
    (e) => currentTimeMs >= e.startMs && currentTimeMs <= e.endMs
  );

  useEffect(() => {
    if (activeIndex !== lastActiveIndex.current && activeIndex >= 0 && activeRef.current && listRef.current) {
      const container = listRef.current;
      const el = activeRef.current;
      const top = el.offsetTop - container.offsetTop;
      const containerH = container.clientHeight;
      if (top < container.scrollTop || top + el.clientHeight > container.scrollTop + containerH) {
        container.scrollTo({ top: top - containerH / 3, behavior: 'smooth' });
      }
    }
    lastActiveIndex.current = activeIndex;
  }, [activeIndex]);

  if (entries.length === 0) {
    return (
      <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        자막 없음
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      style={{
        overflowY: 'auto',
        height: '100%',
        padding: '8px 0',
      }}
    >
      {entries.map((entry, i) => {
        const isActive = i === activeIndex;
        const cps = calcCps(entry.text, entry.startMs, entry.endMs);
        const lines = entry.text.split('\n');
        const isDual = lines.length >= 2;

        return (
          <div
            key={entry.index}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSeek(entry.startMs)}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                #{entry.index}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {formatTimestamp(entry.startMs)}
              </span>
              <CpsBadge cps={cps} />
            </div>
            {isDual ? (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {lines[0]}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {lines.slice(1).join('\n')}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {entry.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
