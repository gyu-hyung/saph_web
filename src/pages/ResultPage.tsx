import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { videoApi } from '../api/client';
import { parseSrt, getCurrentSubtitle, applyOffset } from '../utils/srtParser';
import type { SubtitleEntry } from '../utils/srtParser';
import type { SubtitleSettingsState } from '../components/result/SubtitleSettings';
import SubtitleList from '../components/result/SubtitleList';
import Timeline from '../components/result/Timeline';
import SubtitleSettings from '../components/result/SubtitleSettings';

type SubtitleMode = 'translated' | 'original' | 'dual';

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('translated');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [originalSubs, setOriginalSubs] = useState<SubtitleEntry[]>([]);
  const [translatedSubs, setTranslatedSubs] = useState<SubtitleEntry[]>([]);
  const [dualSubs, setDualSubs] = useState<SubtitleEntry[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [error, setError] = useState('');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettingsState>({
    fontSize: 18,
    fontFamily: 'Inter',
    bgOpacity: 0.75,
    textColor: '#ffffff',
    offsetMs: 0,
  });
  const [leftPct, setLeftPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopRaf();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setIsLoadingSubs(true);

    Promise.allSettled([
      videoApi.fetchSrt(jobId, 'original'),
      videoApi.fetchSrt(jobId, 'translated'),
      videoApi.fetchSrt(jobId, 'dual'),
    ]).then(([origResult, transResult, dualResult]) => {
      if (origResult.status === 'fulfilled') setOriginalSubs(parseSrt(origResult.value.data));
      if (transResult.status === 'fulfilled') setTranslatedSubs(parseSrt(transResult.value.data));
      if (dualResult.status === 'fulfilled') setDualSubs(parseSrt(dualResult.value.data));
    }).finally(() => setIsLoadingSubs(false));
  }, [jobId]);

  // Spacebar toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const video = videoRef.current;
      if (!video) return;

      if (e.code === 'Space') {
        e.preventDefault();
        video.paused ? video.play() : video.pause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        setCurrentTimeMs(Math.floor(video.currentTime * 1000));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        setCurrentTimeMs(Math.floor(video.currentTime * 1000));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        video.volume = Math.min(1, Math.round((video.volume + 0.1) * 10) / 10);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        video.volume = Math.max(0, Math.round((video.volume - 0.1) * 10) / 10);
      }
    };
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!downloadDropdownOpen) return;
    const handleClick = () => setDownloadDropdownOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [downloadDropdownOpen]);

  // Resizable panels
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const totalWidth = containerRef.current?.getBoundingClientRect().width ?? 0;

    const onMouseMove = (ev: MouseEvent) => {
      if (totalWidth === 0) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const pct = Math.max(20, Math.min(80, (x / rect.width) * 100));
      setLeftPct(pct);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTimeUpdate = () => {
    // onTimeUpdate는 ~4Hz로 발생하므로 rAF 루프로 부드럽게 보간
  };

  const startRaf = () => {
    const tick = () => {
      if (videoRef.current) {
        setCurrentTimeMs(Math.floor(videoRef.current.currentTime * 1000));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(Math.floor(videoRef.current.duration * 1000));
    }
  };

  const handleSeek = (ms: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = ms / 1000;
      setCurrentTimeMs(ms);
    }
  };

  const getActiveEntries = (): SubtitleEntry[] => {
    const entries = (() => {
      switch (subtitleMode) {
        case 'original': return originalSubs;
        case 'translated': return translatedSubs;
        case 'dual': return dualSubs;
      }
    })();
    return applyOffset(entries, subtitleSettings.offsetMs);
  };

  const getCurrentSubs = () => {
    const offsetSubs = (subs: SubtitleEntry[]) => applyOffset(subs, subtitleSettings.offsetMs);
    switch (subtitleMode) {
      case 'original':
        return { main: getCurrentSubtitle(offsetSubs(originalSubs), currentTimeMs), secondary: null };
      case 'translated':
        return { main: getCurrentSubtitle(offsetSubs(translatedSubs), currentTimeMs), secondary: null };
      case 'dual': {
        const dualEntry = getCurrentSubtitle(offsetSubs(dualSubs), currentTimeMs);
        if (dualEntry) {
          const lines = dualEntry.text.split('\n');
          if (lines.length >= 2) {
            return {
              main: { ...dualEntry, text: lines[0] },
              secondary: { ...dualEntry, text: lines.slice(1).join('\n') },
            };
          }
          return { main: dualEntry, secondary: null };
        }
        return {
          main: getCurrentSubtitle(offsetSubs(originalSubs), currentTimeMs),
          secondary: getCurrentSubtitle(offsetSubs(translatedSubs), currentTimeMs),
        };
      }
    }
  };

  const handleDownload = async (type: 'original' | 'translated' | 'dual') => {
    if (!jobId) return;
    try {
      const response = await videoApi.fetchSrt(jobId, type);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitle_${type}_${jobId}.srt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('SRT 다운로드에 실패했습니다.');
    }
  };

  const { main: mainSub, secondary: secondarySub } = getCurrentSubs();
  const activeEntries = getActiveEntries();
  const streamUrl = jobId ? videoApi.getStreamUrl(jobId) : '';

  const modeLabels: Record<SubtitleMode, string> = {
    translated: '번역',
    original: '원본',
    dual: '동시',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/my-videos')}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 12px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          ← 목록으로
        </button>

        <div style={{ flex: 1 }} />

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
          {(['translated', 'original', 'dual'] as SubtitleMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSubtitleMode(mode)}
              style={{
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                background: subtitleMode === mode ? 'var(--accent)' : 'transparent',
                color: subtitleMode === mode ? '#fff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: subtitleMode === mode ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>

        {isLoadingSubs && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>로드 중...</span>
        )}

        {/* Download Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDownloadDropdownOpen((v) => !v);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <DownloadIcon /> 다운로드 <ChevronDownIcon />
          </button>
          {downloadDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                zIndex: 50,
                minWidth: '160px',
                overflow: 'hidden',
              }}
            >
              {(['original', 'translated', 'dual'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDownload(type)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {type === 'original' ? '원본 자막' : type === 'translated' ? '번역 자막' : '이중 자막'}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>.srt</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {error}
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Main Content: Subtitle List + Video */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Subtitle List */}
        <div
          style={{
            width: `${leftPct}%`,
            borderRight: '1px solid var(--border)',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SubtitleList
            entries={activeEntries}
            currentTimeMs={currentTimeMs}
            onSeek={handleSeek}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            width: '4px',
            cursor: 'col-resize',
            background: 'transparent',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        />

        {/* Center: Video Player */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', padding: '16px' }}>
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={startRaf}
              onPause={stopRaf}
              onEnded={stopRaf}
              onFocus={(e) => e.currentTarget.blur()}
              style={{
                width: '100%',
                borderRadius: '8px',
                display: 'block',
                maxHeight: '70vh',
              }}
            />

            {/* Click overlay: 더블클릭 감지 대기 없이 즉시 재생/일시정지 */}
            <div
              onClick={() => {
                if (!videoRef.current) return;
                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
              }}
style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                bottom: '56px', // 컨트롤바 높이 제외
                cursor: 'pointer',
                zIndex: 1,
              }}
            />

            {/* Subtitle Overlay */}
            {(mainSub || secondarySub) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '76px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 2,
                  width: '85%',
                  maxWidth: '700px',
                }}
              >
                {mainSub && (
                  <div
                    style={{
                      display: 'inline-block',
                      background: `rgba(0,0,0,${subtitleSettings.bgOpacity})`,
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: `${subtitleSettings.fontSize}px`,
                      fontWeight: 500,
                      color: subtitleSettings.textColor,
                      fontFamily: subtitleSettings.fontFamily,
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      marginBottom: secondarySub ? '4px' : 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {mainSub.text}
                  </div>
                )}
                {secondarySub && (
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        background: `rgba(0,0,0,${subtitleSettings.bgOpacity})`,
                        padding: '6px 14px',
                        borderRadius: '4px',
                        fontSize: `${subtitleSettings.fontSize - 2}px`,
                        fontWeight: 400,
                        color: subtitleSettings.textColor,
                        fontFamily: subtitleSettings.fontFamily,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        lineHeight: 1.4,
                      }}
                    >
                      {secondarySub.text}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <Timeline
        entries={activeEntries}
        durationMs={videoDuration}
        currentTimeMs={currentTimeMs}
        onSeek={handleSeek}
        videoRef={videoRef}
      />

      {/* Subtitle Settings Panel */}
      <SubtitleSettings
        settings={subtitleSettings}
        onSettingsChange={setSubtitleSettings}
      />
    </motion.div>
  );
}
