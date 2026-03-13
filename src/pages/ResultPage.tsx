import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi } from '../api/client';
import { parseSrt, getCurrentSubtitle } from '../utils/srtParser';
import type { SubtitleEntry } from '../utils/srtParser';

type SubtitleMode = 'translated' | 'original' | 'dual';

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('translated');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [originalSubs, setOriginalSubs] = useState<SubtitleEntry[]>([]);
  const [translatedSubs, setTranslatedSubs] = useState<SubtitleEntry[]>([]);
  const [dualSubs, setDualSubs] = useState<SubtitleEntry[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    setIsLoadingSubs(true);

    Promise.allSettled([
      videoApi.fetchSrt(jobId, 'original'),
      videoApi.fetchSrt(jobId, 'translated'),
      videoApi.fetchSrt(jobId, 'dual'),
    ]).then(([origResult, transResult, dualResult]) => {
      if (origResult.status === 'fulfilled') {
        setOriginalSubs(parseSrt(origResult.value.data));
      }
      if (transResult.status === 'fulfilled') {
        setTranslatedSubs(parseSrt(transResult.value.data));
      }
      if (dualResult.status === 'fulfilled') {
        setDualSubs(parseSrt(dualResult.value.data));
      }
    }).finally(() => setIsLoadingSubs(false));
  }, [jobId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTimeMs(Math.floor(videoRef.current.currentTime * 1000));
    }
  };

  const getCurrentSubs = () => {
    switch (subtitleMode) {
      case 'original':
        return { main: getCurrentSubtitle(originalSubs, currentTimeMs), secondary: null };
      case 'translated':
        return { main: getCurrentSubtitle(translatedSubs, currentTimeMs), secondary: null };
      case 'dual': {
        const dualEntry = getCurrentSubtitle(dualSubs, currentTimeMs);
        if (dualEntry) {
          // Dual SRT: lines are typically separated by newline within one entry
          const lines = dualEntry.text.split('\n');
          if (lines.length >= 2) {
            return {
              main: { ...dualEntry, text: lines[0] },
              secondary: { ...dualEntry, text: lines.slice(1).join('\n') },
            };
          }
          return { main: dualEntry, secondary: null };
        }
        // Fallback: show both original and translated simultaneously
        return {
          main: getCurrentSubtitle(originalSubs, currentTimeMs),
          secondary: getCurrentSubtitle(translatedSubs, currentTimeMs),
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
  const streamUrl = jobId ? videoApi.getStreamUrl(jobId) : '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← 목록으로
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700 }}>결과 플레이어</h1>
        {isLoadingSubs && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>자막 로드 중...</span>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '10px 32px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {error}
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Video Player */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#000',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              style={{
                width: '100%',
                borderRadius: '8px',
                display: 'block',
              }}
            />

            {/* Subtitle Overlay */}
            {(mainSub || secondarySub) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '60px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  width: '90%',
                  maxWidth: '700px',
                }}
              >
                {mainSub && (
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'rgba(0,0,0,0.75)',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: '#ffffff',
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
                        background: 'rgba(0,0,0,0.75)',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: 400,
                        color: '#fffde7',
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

          {/* Subtitle Mode Toggle */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {(['translated', 'original', 'dual'] as SubtitleMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSubtitleMode(mode)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: subtitleMode === mode ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: subtitleMode === mode ? 'var(--accent-light)' : 'transparent',
                  color: subtitleMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: subtitleMode === mode ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'translated' ? '번역' : mode === 'original' ? '원본' : '동시'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: '240px',
            borderLeft: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            자막 다운로드
          </h3>

          {(['original', 'translated', 'dual'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleDownload(type)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <span>
                {type === 'original' ? '원본 자막' : type === 'translated' ? '번역 자막' : '이중 자막'}
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  .srt
                </span>
              </span>
              <DownloadIcon />
            </button>
          ))}

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
              자막 모드
            </p>
            {(['translated', 'original', 'dual'] as SubtitleMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSubtitleMode(mode)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: subtitleMode === mode ? 'var(--accent-light)' : 'transparent',
                  color: subtitleMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  fontWeight: subtitleMode === mode ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'translated' ? '번역 (한국어)' : mode === 'original' ? '원본 언어' : '동시 표시'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
