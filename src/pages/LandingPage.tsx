import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { LANGUAGES } from '../i18n/languages';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' },
  }),
};

const STEP_ICONS = [
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M8.46 8.46a5 5 0 0 0 0 7.07" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
];

const STEP_NUMBERS = ['01', '02', '03'];

const FEATURE_EMOJIS = ['⚡', '🎯', '📄', '💳', '🎬', '📂'];

const BASE_PRICING_PLANS = [
  { label: '10 MIN', minutes: 10, price: 5.99 },
  { label: '30 MIN', minutes: 30, price: 14.99 },
  { label: '1 HOUR', minutes: 60, price: 27.99, popular: true },
  { label: '3 HOURS', minutes: 180, price: 79.99 },
  { label: '10 HOURS', minutes: 600, price: 249.99 },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    try { localStorage.setItem('ui-lang', lang); } catch {}
    setLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const stepsData = t('landing.steps', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const featureItems = t('landing.featureItems', { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const faqItems = t('landing.faqItems', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const planFeatures = t('landing.pricing.planFeatures', { returnObjects: true }) as string[][];

  const steps = STEP_ICONS.map((icon, i) => ({
    icon,
    step: STEP_NUMBERS[i],
    title: stepsData[i]?.title ?? '',
    desc: stepsData[i]?.desc ?? '',
  }));

  const features = FEATURE_EMOJIS.map((emoji, i) => ({
    emoji,
    title: featureItems[i]?.title ?? '',
    desc: featureItems[i]?.desc ?? '',
  }));

  const pricingPlans = BASE_PRICING_PLANS.map((plan, i) => ({
    ...plan,
    features: planFeatures[i] ?? [],
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Background orbs */}
      <motion.div
        animate={{ x: [0, -120, -30, -160, 0], y: [0, -100, -20, -140, 0] }}
        transition={{ duration: 180, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed', top: '10%', left: '5%',
          width: '640px', height: '640px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      <motion.div
        animate={{ x: [0, 140, 50, 180, 0], y: [0, 120, 40, 160, 0] }}
        transition={{ duration: 150, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed', top: '40%', right: '5%',
          width: '560px', height: '560px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: '64px',
          background: 'var(--navbar-bg)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-sm.svg" alt="Bako icon" style={{ height: '34px' }} />
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Bako</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* UI Language Dropdown */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '6px',
                border: `1px solid ${langOpen ? 'var(--accent)' : 'var(--border)'}`,
                background: langOpen ? 'var(--accent-light)' : 'transparent',
                color: langOpen ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{currentLang.flag}</span>
              <span>{currentLang.label}</span>
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transition: 'transform 0.15s', transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {langOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '8px',
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px',
                  width: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 200,
                }}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => switchLang(lang.code)}
                    title={lang.nativeName}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                      padding: '8px 4px', borderRadius: '7px',
                      border: `1px solid ${i18n.language === lang.code ? 'var(--accent)' : 'transparent'}`,
                      background: i18n.language === lang.code ? 'var(--accent-light)' : 'transparent',
                      color: i18n.language === lang.code ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '10px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (i18n.language !== lang.code) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i18n.language !== lang.code) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            title={isDark ? t('theme.toLight') : t('theme.toDark')}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to="/login"
            style={{
              padding: '8px 18px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent', border: '1px solid var(--border)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {t('landing.nav.signin')}
          </Link>
          <Link
            to="/signup"
            style={{
              padding: '8px 20px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600,
              color: '#fff', background: 'var(--accent)', border: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {t('landing.nav.getStarted')}
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '120px 24px 100px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '760px' }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            style={{
              display: 'inline-block',
              padding: '6px 16px', borderRadius: '999px',
              background: 'var(--accent-light)', border: '1px solid var(--border-accent)',
              fontSize: '13px', fontWeight: 500, color: 'var(--accent)',
              marginBottom: '28px',
            }}
          >
            {t('landing.hero.badge')}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            {t('landing.hero.title')}<br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {t('landing.hero.titleAccent')}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            style={{
              fontSize: '18px', color: 'var(--text-secondary)',
              lineHeight: 1.7, marginBottom: '44px',
              maxWidth: '560px', margin: '0 auto 44px',
            }}
          >
            {t('landing.hero.desc')}
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link
              to="/signup"
              style={{
                padding: '14px 32px', borderRadius: '10px',
                fontSize: '16px', fontWeight: 700, color: '#fff',
                background: 'var(--accent)',
                boxShadow: '0 0 32px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {t('landing.hero.cta')}
            </Link>
            <Link
              to="/login"
              style={{
                padding: '14px 32px', borderRadius: '10px',
                fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {t('landing.hero.login')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero mock card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: '72px', width: '100%', maxWidth: '680px',
            background: 'var(--bg-hero-card)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)', borderRadius: '20px',
            padding: '28px', position: 'relative', zIndex: 2,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Fake upload zone */}
          <div style={{
            border: '2px dashed var(--border-accent)', borderRadius: '12px',
            padding: '36px', textAlign: 'center', background: 'var(--accent-light)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>☁️</div>
            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{t('landing.hero.mockDrag')}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('landing.hero.mockHint')}</p>
          </div>

          {/* Fake progress steps */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: t('landing.hero.mockStep1'), badge: t('landing.hero.mockDone'), badgeColor: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
              { label: t('landing.hero.mockStep2'), badge: t('landing.hero.mockDone'), badgeColor: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
              { label: t('landing.hero.mockStep3'), badge: t('landing.hero.mockProcessing'), badgeColor: 'var(--info)', bg: 'rgba(59,130,246,0.12)' },
              { label: t('landing.hero.mockStep4'), badge: t('landing.hero.mockPending'), badgeColor: 'var(--text-muted)', bg: 'var(--bg-card-subtle)' },
            ].map((s) => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '10px',
                background: s.bg, border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.label}</span>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: s.badgeColor,
                  padding: '3px 10px', borderRadius: '999px',
                  background: `${s.badgeColor}22`,
                }}>
                  {s.badge}
                </span>
              </div>
            ))}
          </div>

          {/* Glowing dot */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)',
              boxShadow: '0 0 8px var(--success)',
            }}
          />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('landing.howItWorks.label')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {t('landing.howItWorks.title')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  padding: '32px', borderRadius: '16px',
                  background: 'var(--bg-card-subtle)', border: '1px solid var(--border)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  fontSize: '48px', fontWeight: 800, color: 'var(--text-ghost)',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {s.step}
                </div>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'var(--accent-light)', border: '1px solid var(--border-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', marginBottom: '20px',
                }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', background: 'var(--bg-section-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('landing.features.label')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {t('landing.features.title')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.5}
                whileHover={{ y: -3, borderColor: 'var(--border-accent)' }}
                style={{
                  padding: '28px', borderRadius: '14px',
                  background: 'var(--bg-card-subtle)', border: '1px solid var(--border)',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.emoji}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('landing.pricing.label')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              {t('landing.pricing.title')}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              {t('landing.pricing.desc')}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}
          >
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.label}
                variants={fadeUp}
                custom={i * 0.4}
                style={{
                  padding: plan.popular ? '36px 24px' : '28px 20px',
                  borderRadius: '16px',
                  background: plan.popular
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(59,130,246,0.08) 100%)'
                    : 'var(--bg-card-subtle)',
                  border: plan.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#fff',
                    fontSize: '10px', fontWeight: 700, padding: '3px 14px',
                    borderRadius: '0 0 8px 8px', letterSpacing: '0.08em',
                  }}>
                    {t('landing.pricing.popular')}
                  </div>
                )}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {plan.minutes}{t('landing.pricing.creditUnit')}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>{plan.label}</p>
                <p style={{ fontSize: '30px', fontWeight: 800, marginBottom: '20px' }}>
                  ${plan.price.toFixed(2)}
                </p>
                <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  style={{
                    display: 'block', padding: '11px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600, textAlign: 'center',
                    color: plan.popular ? '#fff' : 'var(--text-primary)',
                    background: plan.popular ? 'var(--accent)' : 'var(--bg-button-ghost)',
                    border: plan.popular ? 'none' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) e.currentTarget.style.background = 'var(--accent-hover)';
                    else e.currentTarget.style.background = 'var(--bg-button-ghost-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) e.currentTarget.style.background = 'var(--accent)';
                    else e.currentTarget.style.background = 'var(--bg-button-ghost)';
                  }}
                >
                  {t('landing.pricing.buy')}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', background: 'var(--bg-section-alt)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('landing.faq.label')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {t('landing.faq.title')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.5}
                style={{
                  borderRadius: '12px', overflow: 'hidden',
                  border: `1px solid ${openFaq === i ? 'var(--border-accent)' : 'var(--border)'}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 20px',
                    background: 'var(--bg-card-subtle)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left', color: 'var(--text-primary)',
                    fontSize: '15px', fontWeight: 600,
                  }}
                >
                  {faq.q}
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ fontSize: '20px', color: 'var(--accent)', flexShrink: 0, marginLeft: '12px' }}
                  >
                    +
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{
                    padding: '0 20px 18px',
                    fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8,
                    background: 'var(--bg-faq-answer)',
                  }}>
                    {faq.a}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 24px', textAlign: 'center' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '20px' }}
          >
            {t('landing.cta.title')}<br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {t('landing.cta.titleAccent')}
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            style={{ fontSize: '17px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.7 }}
          >
            {t('landing.cta.desc')}
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link
              to="/signup"
              style={{
                display: 'inline-block', padding: '16px 40px',
                borderRadius: '12px', fontSize: '17px', fontWeight: 700, color: '#fff',
                background: 'var(--accent)',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.45)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 56px rgba(124,58,237,0.55)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.45)'; }}
            >
              {t('landing.cta.button')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)', padding: '40px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-sm.svg" alt="Bako icon" style={{ height: '26px' }} />
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-secondary)', letterSpacing: '-0.2px' }}>Bako</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('landing.footer.tagline')}</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            {t('landing.footer.signin')}
          </Link>
          <Link to="/signup" style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            {t('landing.footer.signup')}
          </Link>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('landing.footer.copyright')}</span>
        </div>
      </footer>
    </div>
  );
}
