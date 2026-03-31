import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { videoApi } from '../api/client';
import type { Job } from '../types';

const ACTIVE_STATUSES: Job['status'][] = ['CREATED', 'QUEUED', 'PROCESSING'];
const POLL_INTERVAL_MS = 5000;

type SortOption = 'newest' | 'oldest' | 'name';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusConfig: Record<Job['status'], { label: string; color: string; bg: string }> = {
  COMPLETED: { label: 'Completed', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.15)' },
  PROCESSING: { label: 'Processing', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.15)' },
  QUEUED: { label: 'Queued', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' },
  CREATED: { label: 'Created', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)' },
  FAILED: { label: 'Failed', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.15)' },
};

function VideoThumbnail() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    </div>
  );
}

export default function MyVideosPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [retryingJobIds, setRetryingJobIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    return videoApi
      .getJobs()
      .then((res) => {
        setJobs(res.data.data);
        return res.data.data;
      })
      .catch(() => setError('영상 목록을 불러오는 데 실패했습니다.'))
      .finally(() => { if (showLoading) setIsLoading(false); });
  };

  useEffect(() => {
    fetchJobs(true);
  }, []);

  // 처리 중인 job이 있으면 5초마다 폴링
  useEffect(() => {
    const hasActive = jobs.some((j) => ACTIVE_STATUSES.includes(j.status));

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (hasActive) {
      pollTimerRef.current = setTimeout(() => fetchJobs(false), POLL_INTERVAL_MS);
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [jobs]);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'name') return a.originalName.localeCompare(b.originalName);
    return 0;
  });

  const handleJobClick = (job: Job) => {
    if (job.status === 'COMPLETED') {
      navigate(`/result/${job.jobId}`);
    } else if (job.status === 'PROCESSING' || job.status === 'QUEUED' || job.status === 'CREATED') {
      navigate(`/processing/${job.jobId}`);
    }
  };

  const handleRetry = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (retryingJobIds.has(job.jobId)) return;

    setRetryingJobIds((prev) => new Set(prev).add(job.jobId));
    try {
      const res = await videoApi.retryJob(job.jobId);
      const newJobId = res.data.data.jobId;
      await fetchJobs(false);
      navigate(`/processing/${newJobId}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        '재시도에 실패했습니다. 잠시 후 다시 시도해주세요.';
      alert(msg);
    } finally {
      setRetryingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(job.jobId);
        return next;
      });
    }
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
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>My Videos</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Total: {jobs.length} Videos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name">Sort: Name</option>
          </select>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!isLoading && error && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: 'var(--error)',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && sortedJobs.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              gap: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'var(--bg-card)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                아직 번역한 영상이 없습니다
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                첫 번째 영상을 업로드하고 자막을 생성해보세요.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 28px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              첫 번째 영상 업로드하기
            </button>
          </div>
        )}

        {!isLoading && !error && sortedJobs.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {sortedJobs.map((job) => {
              const cfg = statusConfig[job.status];
              const isClickable = ['COMPLETED', 'PROCESSING', 'QUEUED', 'CREATED'].includes(job.status);
              return (
                <div
                  key={job.jobId}
                  onClick={() => isClickable && handleJobClick(job)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (isClickable) {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <VideoThumbnail />
                  <div style={{ padding: '14px' }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '8px',
                      }}
                      title={job.originalName}
                    >
                      {job.originalName}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: cfg.color,
                          background: cfg.bg,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {ACTIVE_STATUSES.includes(job.status) && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: cfg.color,
                              animation: 'pulse 1.4s ease-in-out infinite',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {cfg.label}
                      </span>
                      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDuration(job.durationSec)}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: job.status === 'FAILED' ? '10px' : '0' }}>
                      {formatDate(job.createdAt)}
                    </p>
                    {job.status === 'FAILED' && (
                      <>
                        {job.errorMessage && (
                          <p
                            style={{
                              fontSize: '11px',
                              color: 'var(--error)',
                              marginBottom: '10px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={job.errorMessage}
                          >
                            {job.errorMessage}
                          </p>
                        )}
                        <button
                          onClick={(e) => handleRetry(e, job)}
                          disabled={retryingJobIds.has(job.jobId)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: retryingJobIds.has(job.jobId) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            color: 'var(--error)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: retryingJobIds.has(job.jobId) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s',
                            opacity: retryingJobIds.has(job.jobId) ? 0.6 : 1,
                          }}
                        >
                          {retryingJobIds.has(job.jobId) ? (
                            <>
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  border: '2px solid rgba(239,68,68,0.4)',
                                  borderTopColor: 'var(--error)',
                                  borderRadius: '50%',
                                  animation: 'spin 0.8s linear infinite',
                                  flexShrink: 0,
                                }}
                              />
                              재시도 중...
                            </>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="1 4 1 10 7 10" />
                                <path d="M3.51 15a9 9 0 1 0 .49-3.74" />
                              </svg>
                              재시도
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
