import { useRef, useCallback } from 'react';
import type { SubtitleEntry } from '../../utils/srtParser';
import { formatTimeShort } from '../../utils/formatTime';

interface Props {
  entries: SubtitleEntry[];
  durationMs: number;
  currentTimeMs: number;
  onSeek: (ms: number) => void;
  onEntryUpdate: (entryIndex: number, field: 'startMs' | 'endMs', value: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const RULER_H = 28;
const TRACK_H = 56;
const TOTAL_H = RULER_H + TRACK_H + 12;

function getTickInterval(durationMs: number): number {
  const durationSec = durationMs / 1000;
  if (durationSec <= 30) return 5000;
  if (durationSec <= 120) return 10000;
  if (durationSec <= 300) return 30000;
  return 60000;
}

export default function Timeline({ entries, durationMs, currentTimeMs, onSeek, onEntryUpdate, videoRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isEdgeDragging = useRef(false);

  const msFromClientX = useCallback((clientX: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(durationMs, Math.round(ratio * durationMs)));
  }, [durationMs]);

  const seekFromClientX = useCallback((clientX: number) => {
    onSeek(msFromClientX(clientX));
  }, [msFromClientX, onSeek]);

  if (durationMs <= 0) return null;

  /* Track mousedown → continuous drag-to-seek (playhead follows mouse direction) */
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEdgeDragging.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-role="playhead"]')) return;
    if (target.closest('[data-role="edge"]')) return;

    e.preventDefault();
    isDragging.current = true;
    seekFromClientX(e.clientX);

    const video = videoRef.current;
    const wasPlaying = video ? !video.paused : false;
    if (wasPlaying) video?.pause();

    const onMouseMove = (ev: MouseEvent) => seekFromClientX(ev.clientX);
    const onMouseUp = () => {
      isDragging.current = false;
      if (wasPlaying) video?.play().catch((e) => { if (e.name !== 'AbortError') throw e; });

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  /* Playhead drag */
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;

    const video = videoRef.current;
    const wasPlaying = video ? !video.paused : false;
    if (wasPlaying) video?.pause();

    const onMouseMove = (ev: MouseEvent) => seekFromClientX(ev.clientX);
    const onMouseUp = () => {
      isDragging.current = false;
      if (wasPlaying) video?.play();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  /* Edge drag — resize subtitle block start/end */
  const handleEdgeMouseDown = (
    e: React.MouseEvent,
    entryIndex: number,
    field: 'startMs' | 'endMs',
    entry: SubtitleEntry,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    isEdgeDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      const ms = msFromClientX(ev.clientX);
      if (field === 'startMs') {
        onEntryUpdate(entryIndex, 'startMs', Math.max(0, Math.min(entry.endMs - 100, ms)));
      } else {
        onEntryUpdate(entryIndex, 'endMs', Math.min(durationMs, Math.max(entry.startMs + 100, ms)));
      }
    };

    const onMouseUp = () => {
      isEdgeDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const tickInterval = getTickInterval(durationMs);
  const ticks: number[] = [];
  for (let t = 0; t <= durationMs; t += tickInterval) ticks.push(t);

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
        onMouseDown={handleContainerMouseDown}
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
            <div style={{ width: '1px', flex: 1, background: 'var(--border)' }} />
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
            const startTime = formatTimeShort(entry.startMs);
            const endTime = formatTimeShort(entry.endMs);
            const textPreview = entry.text.split('\n')[0];
            return (
              <div
                key={entry.index}
                style={{
                  position: 'absolute',
                  left: pct(entry.startMs),
                  width: pct(entry.endMs - entry.startMs),
                  top: '4px',
                  height: `${TRACK_H - 8}px`,
                  background: isActive ? 'rgba(124, 58, 237, 0.6)' : 'rgba(99, 102, 241, 0.25)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  transition: 'background 0.1s',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '2px 4px',
                }}
              >
                {/* Left edge handle */}
                <div
                  data-role="edge"
                  onMouseDown={(e) => handleEdgeMouseDown(e, entry.index, 'startMs', entry)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'ew-resize',
                    zIndex: 1,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                />
                {/* Right edge handle */}
                <div
                  data-role="edge"
                  onMouseDown={(e) => handleEdgeMouseDown(e, entry.index, 'endMs', entry)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'ew-resize',
                    zIndex: 1,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124, 58, 237, 0.5)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: '3px',
                    fontSize: '9px',
                    color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{entry.index}</span>
                  <span>{startTime}</span>
                  <span>–</span>
                  <span>{endTime}</span>
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.6)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {textPreview}
                </div>
              </div>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          data-role="playhead"
          onMouseDown={handlePlayheadMouseDown}
          style={{
            position: 'absolute',
            left: `${playheadPct}%`,
            top: 0,
            bottom: 0,
            width: '16px',
            transform: 'translateX(-50%)',
            cursor: 'grab',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ffffff',
              transform: 'translateX(-50%)',
              left: '50%',
              boxShadow: '0 0 4px rgba(0,0,0,0.6)',
            }}
          />
          <div
            style={{
              width: '2px',
              height: '100%',
              background: '#ffffff',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
