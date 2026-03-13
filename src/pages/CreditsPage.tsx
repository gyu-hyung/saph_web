import { useState, useEffect } from 'react';
import { creditApi } from '../api/client';
import type { CreditPackage } from '../types';

const defaultPackages: CreditPackage[] = [
  { type: 'MIN_10', creditMin: 10, price: 5.99, label: '10 MIN' },
  { type: 'MIN_30', creditMin: 30, price: 14.99, label: '30 MIN' },
  { type: 'HOUR_1', creditMin: 60, price: 27.99, label: '1H' },
  { type: 'HOUR_3', creditMin: 180, price: 79.99, label: '3H' },
  { type: 'HOUR_10', creditMin: 600, price: 249.99, label: '10H' },
];

const packageFeatures: Record<string, string[]> = {
  MIN_10: ['10분 크레딧', '기본 번역 기능', '원본 + 번역 자막'],
  MIN_30: ['30분 크레딧', '모든 번역 기능', '원본 + 번역 + 이중 자막', '우선 처리'],
  HOUR_1: ['60분 크레딧', '모든 번역 기능', '원본 + 번역 + 이중 자막', '우선 처리', '빠른 처리'],
  HOUR_3: ['180분 크레딧', '모든 번역 기능', '원본 + 번역 + 이중 자막', '최우선 처리', '빠른 처리', '대용량 파일'],
  HOUR_10: ['600분 크레딧', '모든 기능 포함', '최우선 처리', '빠른 처리', '대용량 파일', '전용 지원'],
};

export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>(defaultPackages);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      creditApi.getBalance(),
      creditApi.getPackages(),
    ]).then(([balResult, pkgResult]) => {
      if (balResult.status === 'fulfilled') {
        setBalance(balResult.value.data.data.creditBalance);
      }
      if (pkgResult.status === 'fulfilled') {
        setPackages(pkgResult.value.data.data);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const handlePurchase = async (pkg: CreditPackage) => {
    setError('');
    setSuccessMsg('');
    setIsPurchasing(pkg.type);
    try {
      await creditApi.purchase(pkg.type);
      // MVP stub: Toss Payments integration pending
      window.alert(
        `[${pkg.label}] 패키지 구매\n\n토스페이먼츠 연동 준비 중입니다.\n실제 서비스에서는 결제창이 열립니다.\n\n금액: $${pkg.price}`
      );
      setSuccessMsg(`${pkg.label} 패키지 구매 요청이 처리되었습니다. (MVP 스텁)`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '구매에 실패했습니다.');
    } finally {
      setIsPurchasing(null);
    }
  };

  const featuredIndex = 2; // HOUR_1 is featured

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
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Saph Credit Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            크레딧을 구매하여 영상 번역 서비스를 이용하세요
          </p>
        </div>
        {balance !== null && (
          <div
            style={{
              padding: '10px 20px',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-accent)',
              borderRadius: '10px',
              textAlign: 'right',
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Current Balance
            </p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
              {balance}m
            </p>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {/* Balance Hero */}
        {balance !== null && (
          <div
            style={{
              padding: '28px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '1px solid var(--border-accent)',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Your Account / Current Balance
              </p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {balance}
                <span style={{ fontSize: '20px', marginLeft: '4px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  minutes
                </span>
              </p>
            </div>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'var(--accent-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ⚡
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: 'var(--error)',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {error}
            <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: 'var(--success)',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {successMsg}
            <button onClick={() => setSuccessMsg('')} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {/* Package Cards */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
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
        ) : (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
              크레딧 패키지
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              {packages.map((pkg, index) => {
                const isFeatured = index === featuredIndex;
                const features = packageFeatures[pkg.type] || [`${pkg.creditMin}분 크레딧`];
                const isProcessing = isPurchasing === pkg.type;

                return (
                  <div
                    key={pkg.type}
                    style={{
                      background: isFeatured
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)'
                        : 'var(--bg-card)',
                      border: isFeatured ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative',
                    }}
                  >
                    {isFeatured && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-1px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--accent)',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 12px',
                          borderRadius: '0 0 8px 8px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        POPULAR
                      </div>
                    )}

                    <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Credit Package
                      </p>
                      <p style={{ fontSize: '22px', fontWeight: 800 }}>{pkg.label || `${pkg.creditMin}m`}</p>
                    </div>

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      {features.map((f) => (
                        <li
                          key={f}
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span style={{ color: 'var(--success)', fontSize: '14px' }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <p style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
                        ${pkg.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '11px',
                          background: isFeatured
                            ? isProcessing ? 'rgba(124, 58, 237, 0.4)' : 'var(--accent)'
                            : isProcessing ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)',
                          border: isFeatured ? 'none' : '1px solid var(--border)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isProcessing) {
                            if (isFeatured) e.currentTarget.style.background = 'var(--accent-hover)';
                            else e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isProcessing) {
                            if (isFeatured) e.currentTarget.style.background = 'var(--accent)';
                            else e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          }
                        }}
                      >
                        {isProcessing ? '처리 중...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Payment Methods */}
        <div
          style={{
            padding: '24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>결제 수단</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { name: 'Visa', color: '#1a1f71' },
              { name: 'Mastercard', color: '#eb001b' },
              { name: 'PayPal', color: '#003087' },
              { name: 'Toss', color: '#0064ff' },
            ].map((method) => (
              <div
                key={method.name}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: method.color,
                  }}
                />
                {method.name}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
            * MVP 단계에서는 실제 결제가 처리되지 않습니다. 토스페이먼츠 연동 준비 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
