import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' },
  }),
};

const steps = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    step: '01',
    title: '영상 업로드',
    desc: 'MP4, MOV, AVI 파일을 드래그 앤 드롭하거나 클릭으로 업로드하세요.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    ),
    step: '02',
    title: 'AI 자동 처리',
    desc: '음성을 자동으로 인식하고 정확한 자막 텍스트로 변환합니다.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    step: '03',
    title: 'SRT 다운로드',
    desc: '완성된 자막 파일을 SRT 형식으로 즉시 다운로드하세요.',
  },
];

const features = [
  {
    emoji: '⚡',
    title: '빠른 처리 속도',
    desc: '업로드 즉시 자동 처리가 시작되어 짧은 시간 안에 결과물을 받아볼 수 있습니다.',
  },
  {
    emoji: '🎯',
    title: '높은 정확도',
    desc: '다양한 언어와 억양을 정확하게 인식하여 자연스러운 자막을 생성합니다.',
  },
  {
    emoji: '📄',
    title: '표준 SRT 포맷',
    desc: 'Premiere, DaVinci, Final Cut Pro 등 모든 영상 편집 툴과 완벽 호환됩니다.',
  },
  {
    emoji: '💳',
    title: '크레딧 기반 과금',
    desc: '사용한 영상 길이만큼만 차감됩니다. 구독이 아닌 사용량 기반으로 유연하게 이용하세요.',
  },
  {
    emoji: '🎬',
    title: '다양한 포맷 지원',
    desc: 'MP4, MOV, AVI 등 주요 영상 포맷을 지원합니다. 최대 100MB / 5분.',
  },
  {
    emoji: '📂',
    title: '작업 이력 관리',
    desc: '처리된 영상 목록과 SRT 파일을 언제든지 다시 다운로드할 수 있습니다.',
  },
];

const pricingPlans = [
  { label: '10 MIN', minutes: 10, price: 5.99, features: ['10분 크레딧', '모든 기본 기능', '원본 + 번역 자막'] },
  { label: '30 MIN', minutes: 30, price: 14.99, features: ['30분 크레딧', '모든 기능', '우선 처리'] },
  {
    label: '1 HOUR',
    minutes: 60,
    price: 27.99,
    popular: true,
    features: ['60분 크레딧', '모든 기능', '우선 처리', '빠른 처리'],
  },
  { label: '3 HOURS', minutes: 180, price: 79.99, features: ['180분 크레딧', '모든 기능', '최우선 처리', '대용량 파일'] },
  {
    label: '10 HOURS',
    minutes: 600,
    price: 249.99,
    features: ['600분 크레딧', '모든 기능 포함', '최우선 처리', '전용 지원'],
  },
];

const faqs = [
  { q: '어떤 언어를 지원하나요?', a: '현재 한국어, 영어, 일본어, 중국어 등 다양한 언어의 음성 인식을 지원합니다.' },
  { q: '파일 크기 제한이 있나요?', a: '최대 100MB, 영상 길이는 최대 5분까지 지원합니다. 더 큰 파일은 분할하여 업로드해주세요.' },
  { q: 'SRT 외 다른 자막 형식도 지원하나요?', a: '현재는 SRT 형식만 지원합니다. 향후 VTT, ASS 등 다양한 포맷을 추가할 예정입니다.' },
  { q: '크레딧은 어떻게 충전하나요?', a: '로그인 후 크레딧 페이지에서 원하는 패키지를 선택해 구매할 수 있습니다.' },
  { q: '번역 결과가 만족스럽지 않으면 어떻게 하나요?', a: '다운로드된 SRT 파일을 텍스트 편집기로 열어 직접 수정할 수 있습니다. 자막 파일은 일반 텍스트 형식입니다.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-sm.svg" alt="Bako icon" style={{ height: '34px' }} />
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#ffffff', letterSpacing: '-0.3px' }}>Bako</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/login"
            style={{
              padding: '8px 18px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'transparent', border: '1px solid var(--border)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign in
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
            Get Started
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
            ✦ AI 자막 자동 생성 서비스
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
            영상을 올리면,<br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              자막이 완성됩니다
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
            복잡한 작업 없이, 영상 파일만 업로드하면<br />고품질 SRT 자막 파일이 자동으로 생성됩니다.
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
              무료로 시작하기 →
            </Link>
            <Link
              to="/login"
              style={{
                padding: '14px 32px', borderRadius: '10px',
                fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              로그인
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
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)', borderRadius: '20px',
            padding: '28px', position: 'relative', zIndex: 2,
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Fake upload zone */}
          <div style={{
            border: '2px dashed var(--border-accent)', borderRadius: '12px',
            padding: '36px', textAlign: 'center', background: 'var(--accent-light)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>☁️</div>
            <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>영상 파일을 여기에 드래그</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>MP4 · MOV · AVI · 최대 100MB</p>
          </div>

          {/* Fake progress steps */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Audio Extraction', badge: 'done', badgeColor: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
              { label: 'Speech Recognition', badge: 'done', badgeColor: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
              { label: 'Translation', badge: 'processing', badgeColor: 'var(--info)', bg: 'rgba(59,130,246,0.12)' },
              { label: 'SRT Generation', badge: 'pending', badgeColor: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' },
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
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              3단계로 끝나는 자막 생성
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
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: '20px', right: '20px',
                  fontSize: '48px', fontWeight: 800, color: 'rgba(255,255,255,0.04)',
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
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Bako가 선택받는 이유
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
                key={f.title}
                variants={fadeUp}
                custom={i * 0.5}
                whileHover={{ y: -3, borderColor: 'var(--border-accent)' }}
                style={{
                  padding: '28px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
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
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
              사용한 만큼만 결제하세요
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
              구독 없이 크레딧을 충전하여 필요할 때 사용하세요
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
                    : 'rgba(255,255,255,0.03)',
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
                    POPULAR
                  </div>
                )}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{plan.minutes}분 크레딧</p>
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
                    color: '#fff',
                    background: plan.popular ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                    border: plan.popular ? 'none' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) e.currentTarget.style.background = 'var(--accent-hover)';
                    else e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) e.currentTarget.style.background = 'var(--accent)';
                    else e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }}
                >
                  시작하기
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
            <motion.p variants={fadeUp} custom={0} style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              FAQ
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              자주 묻는 질문
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {faqs.map((faq, i) => (
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
                    background: 'rgba(255,255,255,0.03)',
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
                    background: 'rgba(255,255,255,0.02)',
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
            지금 바로<br />
            <span style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              자막 자동화를 경험하세요
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            style={{ fontSize: '17px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.7 }}
          >
            영상만 있으면 됩니다.<br />나머지는 Bako가 처리합니다.
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
              무료로 시작하기 →
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
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI 자막 자동화 서비스</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            로그인
          </Link>
          <Link to="/signup" style={{ fontSize: '13px', color: 'var(--text-muted)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
            회원가입
          </Link>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>© 2026 Bako</span>
        </div>
      </footer>
    </div>
  );
}
