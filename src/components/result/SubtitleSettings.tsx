import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SubtitleSettingsState {
  fontSize: number;
  fontFamily: string;
  bgOpacity: number;
  textColor: string;
  offsetMs: number;
}

interface SubtitleSettingsProps {
  settings: SubtitleSettingsState;
  onSettingsChange: (settings: SubtitleSettingsState) => void;
}

const fontFamilies = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR"' },
  { label: 'Roboto', value: 'Roboto' },
];

const textColors = [
  { label: 'White', value: '#ffffff' },
  { label: 'Yellow', value: '#fffde7' },
  { label: 'Light Gray', value: '#e0e0e0' },
];

export default function SubtitleSettings({ settings, onSettingsChange }: SubtitleSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = <K extends keyof SubtitleSettingsState>(key: K, value: SubtitleSettingsState[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 40 }}>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
        }}
      >
        ⚙️
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              bottom: '64px',
              right: 0,
              width: '280px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              자막 설정
            </h4>

            {/* Font Size */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  폰트 크기
                </label>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--border)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Font Family */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                폰트
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {fontFamilies.map((font) => (
                  <option key={font.value} value={font.value} style={{ background: '#1a1a2e', color: '#fff' }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Background Opacity */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  배경 투명도
                </label>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{Math.round(settings.bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.bgOpacity}
                onChange={(e) => updateSetting('bgOpacity', Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--border)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Text Color */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                글자 색상
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {textColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting('textColor', color.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: color.value,
                      border: settings.textColor === color.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: color.value === '#ffffff' ? '#000' : color.value === '#fffde7' ? '#000' : '#fff',
                      fontWeight: 500,
                    }}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Offset */}
            <div style={{ marginBottom: '0px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  싱크 오프셋
                </label>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{settings.offsetMs > 0 ? '+' : ''}{settings.offsetMs}ms</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => updateSetting('offsetMs', settings.offsetMs - 100)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: '6px',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  -100ms
                </button>
                <button
                  onClick={() => updateSetting('offsetMs', settings.offsetMs + 100)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: '6px',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  +100ms
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
