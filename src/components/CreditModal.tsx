import { useState, useEffect } from 'react';
import { creditApi } from '../api/client';
import type { CreditPackage } from '../types';

interface CreditModalProps {
  currentBalance: number;
  requiredCredits: number;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export default function CreditModal({
  currentBalance,
  requiredCredits,
  onClose,
  onPurchaseComplete,
}: CreditModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    creditApi
      .getPackages()
      .then((res) => {
        setPackages(res.data.data);
        // Auto-select the smallest package that covers the deficit
        const deficit = requiredCredits - currentBalance;
        const suitable = res.data.data.find((p) => p.creditMin >= deficit);
        if (suitable) setSelectedPackage(suitable.type);
        else if (res.data.data.length > 0) setSelectedPackage(res.data.data[0].type);
      })
      .catch(() => {
        // Fallback packages if API fails
        const fallback: CreditPackage[] = [
          { type: 'MIN_10', creditMin: 10, price: 5.99, label: '10 MIN' },
          { type: 'MIN_30', creditMin: 30, price: 14.99, label: '30 MIN' },
          { type: 'HOUR_1', creditMin: 60, price: 27.99, label: '1H' },
          { type: 'HOUR_3', creditMin: 180, price: 79.99, label: '3H' },
          { type: 'HOUR_10', creditMin: 600, price: 249.99, label: '10H' },
        ];
        setPackages(fallback);
      })
      .finally(() => setIsLoading(false));
  }, [currentBalance, requiredCredits]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setError('');
    setIsPurchasing(true);
    try {
      await creditApi.purchase(selectedPackage);
      // MVP stub: Toss Payments integration pending
      window.alert(
        '토스페이먼츠 연동 준비 중입니다.\n\n실제 서비스에서는 여기서 결제창이 열립니다.'
      );
      onPurchaseComplete();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || '구매에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          크레딧 충전이 필요합니다
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              현재 잔액
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning)' }}>
              {currentBalance}분
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              필요 크레딧
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--error)' }}>
              {requiredCredits}분
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              부족한 크레딧
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--error)' }}>
              {Math.max(0, requiredCredits - currentBalance)}분
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            패키지 불러오는 중...
          </div>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              패키지를 선택하세요:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.type;
                const covers = pkg.creditMin >= requiredCredits - currentBalance;
                return (
                  <button
                    key={pkg.type}
                    onClick={() => setSelectedPackage(pkg.type)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '10px',
                      border: isSelected
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    {covers && !isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--success)',
                        }}
                      />
                    )}
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                      {pkg.label || `${pkg.creditMin}분`}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {pkg.creditMin}분 크레딧
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                      ${pkg.price.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(124, 58, 237, 0.08)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
              }}
            >
              토스페이먼츠 결제창을 통해 안전하게 결제됩니다. MVP 단계에서는 실제 결제가 이루어지지 않습니다.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || isPurchasing}
                style={{
                  flex: 2,
                  padding: '12px',
                  background:
                    !selectedPackage || isPurchasing
                      ? 'rgba(124, 58, 237, 0.4)'
                      : 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: !selectedPackage || isPurchasing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {isPurchasing ? '처리 중...' : '결제하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
