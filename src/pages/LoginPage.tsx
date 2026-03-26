import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { LANGUAGES } from '../i18n/languages';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [langPopupOpen, setLangPopupOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, right: 0 });
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const langPopupRef = useRef<HTMLDivElement>(null);
  const { loginWithEmail, loginWithGoogle, loginWithApple, member, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem('ui-lang', code); } catch {}
  };

  const openLangPopup = () => {
    if (langBtnRef.current) {
      const rect = langBtnRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setLangPopupOpen(true);
  };

  useEffect(() => {
    if (!langPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langPopupRef.current && !langPopupRef.current.contains(e.target as Node) &&
        langBtnRef.current && !langBtnRef.current.contains(e.target as Node)
      ) {
        setLangPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langPopupOpen]);

  useEffect(() => {
    if (member) navigate('/dashboard', { replace: true });
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
          setError(t('auth.errors.invalidCredential'));
          break;
        case 'auth/user-disabled':
          setError(t('auth.errors.blocked'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.errors.tooManyRequests'));
          break;
        default:
          setError(firebaseError.message || t('auth.errors.loginFailed'));
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
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        setError(t('auth.errors.googleFailed'));
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
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        setError(t('auth.errors.appleFailed'));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const langPopup = createPortal(
    <AnimatePresence>
      {langPopupOpen && (
        <motion.div
          ref={langPopupRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.13 }}
          style={{
            position: 'fixed',
            top: popupPos.top,
            right: popupPos.right,
            width: '220px',
            background: isDark ? 'rgba(20, 15, 35, 0.97)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(124,58,237,0.2)',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '6px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { switchLang(lang.code); setLangPopupOpen(false); }}
                title={lang.nativeName}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  padding: '8px 4px', borderRadius: '6px',
                  border: `1px solid ${currentLang.code === lang.code ? 'var(--accent)' : 'transparent'}`,
                  background: currentLang.code === lang.code ? 'rgba(124,58,237,0.15)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (currentLang.code !== lang.code) e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (currentLang.code !== lang.code) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{lang.flag}</span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: currentLang.code === lang.code ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)'
    : 'linear-gradient(135deg, #f5f4ff 0%, #ede9fd 50%, #e8f4ff 100%)';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(124, 58, 237, 0.15)';

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        minHeight: '100vh',
        background: bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Orbs */}
      <motion.div
        animate={{ x: [0, -140, -40, -180, -20, -100, 0], y: [0, -120, -30, -160, 20, -80, 0] }}
        transition={{ duration: 160, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', top: 'calc(50% - 350px)', left: 'calc(50% - 440px)', transform: 'translate(-50%, -50%)', width: '540px', height: '540px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }}
      />
      <motion.div
        animate={{ x: [0, 160, 60, 200, 40, 140, 0], y: [0, 140, 50, 180, 20, 110, 0] }}
        transition={{ duration: 141, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', top: 'calc(50% - 80px)', left: 'calc(50% - 100px)', transform: 'translate(-50%, -50%)', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }}
      />

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: cardBorder,
          padding: '40px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <img src="/logo-sm.svg" alt="Bako" style={{ height: '32px' }} />
            <span style={{ fontWeight: 700, fontSize: '22px', color: 'var(--text-primary)' }}>Bako</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '16px' }}>
            {t('auth.signInTitle')}
          </h1>
        </div>

        {/* Social buttons */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={socialLoading !== null || isLoading}
          style={{ width: '100%', padding: '12px', background: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#1a1a1a', fontSize: '14px', fontWeight: 500, cursor: socialLoading !== null ? 'not-allowed' : 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: socialLoading !== null ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {socialLoading === 'google' ? t('auth.processing') : t('auth.withGoogle')}
        </button>

        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={socialLoading !== null || isLoading}
          style={{ width: '100%', padding: '12px', background: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#1a1a1a', fontSize: '14px', fontWeight: 500, cursor: socialLoading !== null ? 'not-allowed' : 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: socialLoading !== null ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          {socialLoading === 'apple' ? t('auth.processing') : t('auth.withApple')}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || socialLoading !== null}
            style={{ width: '100%', padding: '13px', background: isLoading ? 'rgba(124, 58, 237, 0.5)' : 'var(--accent)', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '15px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {isLoading ? t('auth.signingIn') : t('auth.signInBtn')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {t('auth.newUser')}{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>
            {t('auth.createAccount')}
          </Link>
        </p>

        {/* Language selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => langPopupOpen ? setLangPopupOpen(false) : openLangPopup()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: langPopupOpen ? 'rgba(124,58,237,0.12)' : 'transparent',
              border: 'none',
              borderRadius: '20px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.1)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = langPopupOpen ? 'rgba(124,58,237,0.12)' : 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <svg
              width="10" height="10" viewBox="0 0 10 10"
              style={{ transform: langPopupOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', opacity: 0.5 }}
            >
              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>

    {langPopup}
  </>
  );
}
