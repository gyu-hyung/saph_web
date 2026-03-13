import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoApi } from '../api/client';
import type { SSEEvent } from '../types';

type StepStatus = 'pending' | 'processing' | 'done' | 'failed';

interface ProcessingStep {
  id: string;
  label: string;
  sublabel: string;
  status: StepStatus;
  percent: number;
}

const initialSteps: ProcessingStep[] = [
  { id: 'AUDIO_EXTRACT', label: 'Audio Extraction', sublabel: 'FFmpeg', status: 'pending', percent: 0 },
  { id: 'STT', label: 'STT (Whisper)', sublabel: 'faster-whisper', status: 'pending', percent: 0 },
  { id: 'TRANSLATE', label: 'Translation (Gemma 3)', sublabel: 'Ollama', status: 'pending', percent: 0 },
  { id: 'SRT_BUILD', label: 'SRT Generation', sublabel: 'Build output', status: 'pending', percent: 0 },
];

const statusColors: Record<StepStatus, string> = {
  pending: 'var(--text-muted)',
  processing: 'var(--info)',
  done: 'var(--success)',
  failed: 'var(--error)',
};

const statusBadgeBg: Record<StepStatus, string> = {
  pending: 'rgba(255,255,255,0.05)',
  processing: 'rgba(59, 130, 246, 0.15)',
  done: 'rgba(16, 185, 129, 0.15)',
  failed: 'rgba(239, 68, 68, 0.15)',
};

function formatWaitTime(sec: number): string {
  if (sec < 60) return `약 ${sec}초`;
  return `약 ${Math.ceil(sec / 60)}분`;
}

export default function ProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'queued' | 'processing' | 'completed' | 'failed' | 'loading'>('loading');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [overallPercent, setOverallPercent] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);

  const eventSourceRef = useRef<EventSource | null>(null);

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  const mapStepId = (step: string): string => {
    const map: Record<string, string> = {
      audio_extract: 'AUDIO_EXTRACT',
      audio: 'AUDIO_EXTRACT',
      stt: 'STT',
      transcribe: 'STT',
      translate: 'TRANSLATE',
      translation: 'TRANSLATE',
      srt: 'SRT_BUILD',
      srt_build: 'SRT_BUILD',
      build: 'SRT_BUILD',
    };
    return map[step.toLowerCase()] || step.toUpperCase();
  };

  useEffect(() => {
    if (!jobId) return;

    // First, check job status to handle reconnection
    videoApi
      .getJobs()
      .then((res) => {
        const jobs = res.data.data;
        const job = jobs.find((j) => j.jobId === Number(jobId));
        if (job) {
          if (job.status === 'COMPLETED') {
            navigate(`/result/${jobId}`, { replace: true });
            return;
          }
          if (job.status === 'FAILED') {
            setStatus('failed');
            setErrorMessage(job.errorMessage || '처리 중 오류가 발생했습니다.');
            return;
          }
        }
        // Connect SSE
        connectSSE();
      })
      .catch(() => {
        // If jobs fetch fails, still try SSE
        connectSSE();
      });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectSSE = () => {
    if (!jobId) return;
    const url = videoApi.getStatusUrl(jobId);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('queued', (e: MessageEvent) => {
      const data: SSEEvent = JSON.parse(e.data);
      setStatus('queued');
      setQueuePosition(data.queuePosition ?? null);
      setEstimatedWait(data.estimatedWaitSec ?? null);
    });

    es.addEventListener('progress', (e: MessageEvent) => {
      const data: SSEEvent = JSON.parse(e.data);
      setStatus('processing');
      setOverallPercent(data.percent);
      if (data.message) setCurrentMessage(data.message);

      const stepId = mapStepId(data.step);
      updateStep(stepId, { status: 'processing', percent: data.percent });

      // Mark all previous steps as done
      setSteps((prev) => {
        const stepIndex = prev.findIndex((s) => s.id === stepId);
        return prev.map((s, i) => {
          if (i < stepIndex && s.status !== 'failed') return { ...s, status: 'done', percent: 100 };
          if (i === stepIndex) return { ...s, status: 'processing', percent: data.percent };
          return s;
        });
      });
    });

    es.addEventListener('completed', (e: MessageEvent) => {
      JSON.parse(e.data) as SSEEvent;
      setStatus('completed');
      setOverallPercent(100);
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'done', percent: 100 })));
      es.close();
      setTimeout(() => navigate(`/result/${jobId}`), 1000);
    });

    es.addEventListener('failed', (e: MessageEvent) => {
      const data: SSEEvent = JSON.parse(e.data);
      setStatus('failed');
      setErrorMessage(data.error || '처리 중 오류가 발생했습니다.');
      es.close();
    });

    es.onerror = () => {
      // SSE connection error — retry is handled by EventSource automatically
      console.warn('SSE connection error, retrying...');
    };
  };

  // Warn before closing
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'queued' || status === 'processing') {
        e.preventDefault();
        e.returnValue = '처리가 진행 중입니다. 창을 닫으면 진행 상황을 잃을 수 있습니다.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Processing</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Job #{jobId}
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Main Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            gap: '32px',
          }}
        >
          {status === 'loading' && (
            <div
              style={{
                width: '64px',
                height: '64px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}

          {status === 'queued' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '12px',
                  }}
                >
                  WAITING IN QUEUE...
                </p>
                {queuePosition !== null && (
                  <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Queue Position:{' '}
                    <span style={{ fontWeight: 700, color: 'var(--warning)' }}>#{queuePosition}</span>
                  </p>
                )}
                {estimatedWait !== null && (
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    예상 대기 시간: {formatWaitTime(estimatedWait)}
                  </p>
                )}
              </div>

              {/* Spinner */}
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '12px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--info)',
                    borderRadius: '50%',
                    animation: 'spin 1.5s linear infinite reverse',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--warning)' }}>⚠</span>
                창을 닫으시면 대기 순번을 잃을 수 있습니다.
              </div>
            </>
          )}

          {status === 'processing' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  처리 중...
                </p>
                {currentMessage && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {currentMessage}
                  </p>
                )}
              </div>

              <div style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>전체 진행률</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{overallPercent}%</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    background: 'var(--border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${overallPercent}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--info))',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ color: 'var(--warning)' }}>⚠</span>
                처리가 완료될 때까지 창을 닫지 마세요.
              </div>
            </>
          )}

          {status === 'completed' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '32px',
                }}
              >
                ✓
              </div>
              <p style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: 'var(--success)' }}>
                완료!
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                결과 화면으로 이동합니다...
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '32px',
                  color: 'var(--error)',
                }}
              >
                ✕
              </div>
              <p style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--error)' }}>
                처리 실패
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {errorMessage}
              </p>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 32px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                대시보드로 돌아가기
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: '280px',
            borderLeft: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Processing Progress
          </h3>

          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                padding: '14px',
                background: 'var(--bg-card)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>{step.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {step.sublabel}
                  </p>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: statusColors[step.status],
                    background: statusBadgeBg[step.status],
                  }}
                >
                  {step.status}
                </span>
              </div>
              {step.status === 'processing' && (
                <div
                  style={{
                    height: '3px',
                    background: 'var(--border)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '8px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${step.percent}%`,
                      background: 'var(--info)',
                      borderRadius: '2px',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Progress</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{overallPercent}%</span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'var(--border)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${overallPercent}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--info))',
                  borderRadius: '3px',
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {status === 'queued' ? 'Waiting in queue' : 'Analysis and Transcription'}
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
