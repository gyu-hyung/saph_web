import { useRef } from 'react';
import type { SubtitleEntry } from '../../utils/srtParser';
import { formatTimeShort } from '../../utils/formatTime';

interface Props {
  entries: SubtitleEntry[];
  durationMs: number;
  currentTimeMs: number;
  onSeek: (ms: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const RULER_H = 20;
const TRACK_H = 44;
const TOTAL_H = RULER_H + TRACK_H + 12; // 76px
const PX_PER_SEC = 60;
const PX_PER_MS = PX_PER_SEC / 1000;

export default function Timeline({ entries, durationMs, currentTimeMs, onSeek, videoRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTimeMsRef = useRef(currentTimeMs);
  currentTimeMsRef.current = currentTimeMs;

  if (durationMs <= 0) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startTime = currentTimeMsRef.current;

    const video = videoRef.current;
    const wasPlaying = video ? !video.paused : false;
    if (wasPlaying) video?.pause();

    let hasDragged = false;

    const onMouseMove = (ev: MouseEvent) => {
      hasDragged = true;
      // drag right = forward in time
      const deltaX = ev.clientX - startX;
      const seekMs = startTime + deltaX / PX_PER_MS;
      onSeek(Math.max(0, Math.min(durationMs, Math.round(seekMs))));
    };

    const onMouseUp = (ev: MouseEvent) => {
      if (!hasDragged) {
        // click: seek to absolute position relative to fixed playhead
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const offsetPx = ev.clientX - rect.left - rect.width / 2;
          const seekMs = startTime + offsetPx / PX_PER_MS;
          onSeek(Math.max(0, Math.min(durationMs, Math.round(seekMs))));
        }
      }
      if (wasPlaying) video?.play();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // 1-second ticks
  const ticks: number[] = [];
  for (let t = 0; t <= durationMs; t += 1000) {
    ticks.push(t);
  }

  // Scrolling offset: currentTime position moves to center (50%)
  const contentOffsetPx = currentTimeMs * PX_PER_MS;
  const contentWidthPx = durationMs * PX_PER_MS + 600; // extra padding on both sides

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{
        height: `${TOTAL_H}px`,
        borderTop: '1px solid #1e1e1e',
        background: '#0d0d0d',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
    >
      {/* Scrolling content: moves so that currentTime sits at 50% */}
      <div
        style={{
          position: 'absolute',
          // 300px left padding so t=0 can appear left of center
          left: `calc(50% - ${contentOffsetPx + 300}px)`,
          top: 0,
          width: `${contentWidthPx}px`,
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Ruler */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 0,
            right: 0,
            height: `${RULER_H}px`,
          }}
        >
          {ticks.map((t) => (
            <div
              key={t}
              style={{
                position: 'absolute',
                left: `${t * PX_PER_MS + 300}px`,
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
                  color: '#555',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  fontFamily: 'monospace',
                }}
              >
                {formatTimeShort(t)}
              </span>
              <div style={{ width: '1px', height: '6px', background: '#2a2a2a', marginTop: '2px' }} />
            </div>
          ))}
        </div>

        {/* Track area */}
        <div
          style={{
            position: 'absolute',
            top: RULER_H + 4,
            left: 0,
            right: 0,
            height: `${TRACK_H}px`,
          }}
        >
          {entries.map((entry) => {
            const isActive = currentTimeMs >= entry.startMs && currentTimeMs <= entry.endMs;
            const blockWidth = Math.max((entry.endMs - entry.startMs) * PX_PER_MS, 2);
            const textPreview = entry.text.split('\n')[0];

            return (
              <div
                key={entry.index}
                style={{
                  position: 'absolute',
                  left: `${entry.startMs * PX_PER_MS + 300}px`,
                  width: `${blockWidth}px`,
                  top: '2px',
                  height: `${TRACK_H - 4}px`,
                  background: isActive ? '#2563eb' : '#1a3356',
                  border: `1px solid ${isActive ? '#3b82f6' : '#243e6a'}`,
                  borderRadius: '3px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '2px 4px',
                  boxSizing: 'border-box',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    color: isActive ? '#fff' : '#7aa8e0',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.index}
                </span>
                {blockWidth > 28 && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(122,168,224,0.7)',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {textPreview}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed red playhead at center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '2px',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 0 6px rgba(239,68,68,0.35)',
        }}
      >
        {/* Triangle handle at top */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '7px solid #ef4444',
          }}
        />
      </div>
    </div>
  );
}
