import { useEffect, useRef } from 'react';
import type { SubtitleEntry } from '../../utils/srtParser';
import { formatTimestamp, calcCps } from '../../utils/formatTime';

interface Props {
  originalEntries: SubtitleEntry[];
  translatedEntries: SubtitleEntry[];
  currentTimeMs: number;
  onSeek: (ms: number) => void;
  onTranslatedTextChange: (entryIndex: number, newText: string) => void;
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

export default function SubtitleList({
  originalEntries,
  translatedEntries,
  currentTimeMs,
  onSeek,
  onTranslatedTextChange,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const lastActiveIndex = useRef<number>(-1);

  const activeIndex = originalEntries.findIndex(
    (e) => currentTimeMs >= e.startMs && currentTimeMs <= e.endMs,
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

  if (originalEntries.length === 0) {
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
      {originalEntries.map((origEntry, i) => {
        const isActive = i === activeIndex;
        const transEntry = translatedEntries[i];
        const cps = calcCps(origEntry.text, origEntry.startMs, origEntry.endMs);

        return (
          <div
            key={origEntry.index}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSeek(origEntry.startMs)}
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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                #{origEntry.index}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {formatTimestamp(origEntry.startMs)}
              </span>
              <CpsBadge cps={cps} />
            </div>

            {/* Original text (read-only) */}
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '4px' }}>
              {origEntry.text}
            </div>

            {/* Translated text (editable) */}
            {transEntry && (
              <textarea
                value={transEntry.text}
                onChange={(e) => onTranslatedTextChange(transEntry.index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={1}
                style={{
                  width: '100%',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  outline: 'none',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
