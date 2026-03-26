import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const { loginWithEmail, loginWithGoogle, loginWithApple, member, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (member) {
      navigate('/dashboard', { replace: true });
    }
  }, [member, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
          break;
        case 'auth/user-disabled':
          setError('차단된 계정입니다.');
          break;
        case 'auth/too-many-requests':
          setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.');
          break;
        default:
          setError(firebaseError.message || '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSocialLoading('google');
    try {
      await loginWithGoogle();
      // navigation handled by useEffect when member is set
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        setError('Google 로그인에 실패했습니다.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setSocialLoading('apple');
    try {
      await loginWithApple();
      // navigation handled by useEffect when member is set
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        setError('Apple 로그인에 실패했습니다.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
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
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* 보라 오브: 카드 좌상단 기준으로 힐끗 */}
      <motion.div
        animate={{
          x: [0, -140, -40, -180, -20, -100, 0],
          y: [0, -120, -30, -160, 20, -80, 0],
        }}
        transition={{ duration: 160, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 'calc(50% - 350px)',
          left: 'calc(50% - 440px)',
          transform: 'translate(-50%, -50%)',
          width: '540px',
          height: '540px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* 파란 오브: 우하단 방향으로 힐끗 */}
      <motion.div
        animate={{
          x: [0, 160, 60, 200, 40, 140, 0],
          y: [0, 140, 50, 180, 20, 110, 0],
        }}
        transition={{ duration: 141, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 'calc(50% - 80px)',
          left: 'calc(50% - 100px)',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--accent)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              S
            </div>
            <span style={{ fontWeight: 700, fontSize: '22px' }}>Bako</span>
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '16px',
            }}
          >
            Sign in to Bako
          </h1>
        </div>

        {/* Social buttons */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={socialLoading !== null || isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#1a1a1a',
            fontSize: '14px',
            fontWeight: 500,
            cursor: socialLoading !== null ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: socialLoading !== null ? 0.7 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {socialLoading === 'google' ? '로그인 중...' : 'Continue with Google'}
        </button>

        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={socialLoading !== null || isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: '#1a1a1a',
            fontSize: '14px',
            fontWeight: 500,
            cursor: socialLoading !== null ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: socialLoading !== null ? 0.7 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          {socialLoading === 'apple' ? '로그인 중...' : 'Continue with Apple'}
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit}>
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

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || socialLoading !== null}
            style={{
              width: '100%',
              padding: '13px',
              background: isLoading ? 'rgba(124, 58, 237, 0.5)' : 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          New to Bako?{' '}
          <Link
            to="/signup"
            style={{ color: 'var(--accent)', fontWeight: 500 }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
