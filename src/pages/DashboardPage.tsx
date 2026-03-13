import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoApi } from '../api/client';
import { useAuth } from '../store/authStore';
import CreditModal from '../components/CreditModal';
import type { UploadResult } from '../types';

type UploadState = 'idle' | 'uploading' | 'uploaded' | 'insufficient_credits' | 'translating';

type StepStatus = 'pending' | 'processing' | 'done' | 'failed';

interface ProcessingStep {
  id: string;
  label: string;
  sublabel: string;
  status: StepStatus;
}

const initialSteps: ProcessingStep[] = [
  { id: 'audio', label: 'Audio Extraction', sublabel: 'FFmpeg', status: 'pending' },
  { id: 'stt', label: 'STT (Whisper)', sublabel: 'faster-whisper', status: 'pending' },
  { id: 'translate', label: 'Translation (Gemma 3)', sublabel: 'Ollama', status: 'pending' },
  { id: 'srt', label: 'SRT Generation', sublabel: 'Build output', status: 'pending' },
];

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBytes(mb: number): string {
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

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

export default function DashboardPage() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { member, refreshMember } = useAuth();
  const navigate = useNavigate();

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo'];
    const allowedExts = ['.mp4', '.mov', '.avi'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      return 'MP4, MOV, AVI 형식의 파일만 지원합니다.';
    }

    const maxMB = 100;
    if (file.size > maxMB * 1024 * 1024) {
      return `파일 크기는 ${maxMB}MB를 초과할 수 없습니다.`;
    }

    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError('');
      setUploadState('uploading');
      setUploadProgress(0);

      try {
        const response = await videoApi.upload(file, (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        });

        const result = response.data.data;
        setUploadResult(result);

        const creditBalance = member?.creditBalance ?? 0;
        if (result.requiredCreditMin > creditBalance) {
          setUploadState('insufficient_credits');
        } else {
          setUploadState('uploaded');
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string; code?: string } } };
        const code = axiosError.response?.data?.code;
        if (code === 'FILE_TOO_LARGE') setError('파일이 100MB를 초과합니다.');
        else if (code === 'VIDEO_TOO_LONG') setError('영상이 5분을 초과합니다.');
        else if (code === 'UNSUPPORTED_FORMAT') setError('지원하지 않는 파일 형식입니다.');
        else setError(axiosError.response?.data?.message || '업로드에 실패했습니다.');
        setUploadState('idle');
      }
    },
    [member]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleTranslate = async () => {
    if (!uploadResult) return;
    setUploadState('translating');
    try {
      const response = await videoApi.translate(uploadResult.videoId);
      const { jobId } = response.data.data;
      navigate(`/processing/${jobId}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; code?: string } } };
      const code = axiosError.response?.data?.code;
      if (code === 'INSUFFICIENT_CREDITS') {
        setUploadState('insufficient_credits');
        setShowCreditModal(true);
      } else {
        setError(axiosError.response?.data?.message || '번역 요청에 실패했습니다.');
        setUploadState('uploaded');
      }
    }
  };

  const handlePurchaseComplete = async () => {
    setShowCreditModal(false);
    await refreshMember();
    setUploadState('uploaded');
  };

  const resetUpload = () => {
    setUploadState('idle');
    setUploadResult(null);
    setUploadProgress(0);
    setError('');
    setSteps(initialSteps);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Upload a video to generate subtitles automatically
          </p>
        </div>
        {member && (
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--accent-light)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--accent)',
              border: '1px solid var(--border-accent)',
            }}
          >
            Balance: {member.creditBalance} min
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>
        {/* Upload Zone */}
        <div
          style={{
            flex: 1,
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflow: 'auto',
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: 'var(--error)',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {error}
              <button
                onClick={() => setError('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>
          )}

          {uploadState === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                minHeight: '320px',
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isDragging ? 'var(--accent-light)' : 'var(--bg-card)',
                gap: '16px',
                padding: '40px',
              }}
            >
              <div style={{ color: isDragging ? 'var(--accent)' : 'var(--text-muted)' }}>
                <UploadIcon />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  Drag & Drop
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Upload video files containing MP4, MOV, AVI
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Max file size: 100MB · Max duration: 5 minutes
                </p>
              </div>
              <button
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/avi"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {uploadState === 'uploading' && (
            <div
              style={{
                flex: 1,
                minHeight: '320px',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-card)',
                gap: '24px',
                padding: '40px',
              }}
            >
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
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Uploading...
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {uploadProgress}%
                </p>
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: '6px',
                  background: 'var(--border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    background: 'var(--accent)',
                    borderRadius: '3px',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            </div>
          )}

          {(uploadState === 'uploaded' ||
            uploadState === 'insufficient_credits' ||
            uploadState === 'translating') &&
            uploadResult && (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                }}
              >
                {/* File Info */}
                <div
                  style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--accent-light)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: '15px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {uploadResult.originalName}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {formatBytes(uploadResult.fileSizeMB)} · {formatDuration(uploadResult.durationSec)}
                      </p>
                    </div>
                    <button
                      onClick={resetUpload}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      변경
                    </button>
                  </div>
                </div>

                {/* Credit Info */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        필요 크레딧
                      </p>
                      <p style={{ fontSize: '20px', fontWeight: 700 }}>
                        {uploadResult.requiredCreditMin}분
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        현재 잔액
                      </p>
                      <p
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color:
                            (member?.creditBalance ?? 0) >= uploadResult.requiredCreditMin
                              ? 'var(--success)'
                              : 'var(--error)',
                        }}
                      >
                        {member?.creditBalance ?? 0}분
                      </p>
                    </div>
                  </div>

                  {uploadState === 'insufficient_credits' ? (
                    <div>
                      <div
                        style={{
                          padding: '12px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontSize: '13px',
                          color: 'var(--error)',
                          marginBottom: '14px',
                        }}
                      >
                        크레딧이 부족합니다. {uploadResult.requiredCreditMin - (member?.creditBalance ?? 0)}분이 더 필요합니다.
                      </div>
                      <button
                        onClick={() => setShowCreditModal(true)}
                        style={{
                          width: '100%',
                          padding: '13px',
                          background: 'var(--accent)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        크레딧 충전하기
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleTranslate}
                      disabled={uploadState === 'translating'}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background:
                          uploadState === 'translating'
                            ? 'rgba(124, 58, 237, 0.5)'
                            : 'var(--accent)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: uploadState === 'translating' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      {uploadState === 'translating' ? (
                        <>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: '#fff',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                          번역 요청 중...
                        </>
                      ) : (
                        '번역 시작'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Panel: Processing Progress */}
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
            </div>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Progress</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {steps.filter((s) => s.status === 'done').length * 25}%
              </span>
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
                  width: `${steps.filter((s) => s.status === 'done').length * 25}%`,
                  background: 'var(--accent)',
                  borderRadius: '3px',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Analysis and Transcription
            </p>
          </div>
        </div>
      </div>

      {showCreditModal && uploadResult && (
        <CreditModal
          currentBalance={member?.creditBalance ?? 0}
          requiredCredits={uploadResult.requiredCreditMin}
          onClose={() => setShowCreditModal(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </div>
  );
}
