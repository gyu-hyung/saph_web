export interface Language {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ko', label: 'KO', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'en', label: 'EN', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳', nativeName: '中文(简体)' },
  { code: 'es', label: 'ES', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'DE', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'pt', label: 'PT', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ar', label: 'AR', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'da', label: 'DA', flag: '🇩🇰', nativeName: 'Dansk' },
  { code: 'fi', label: 'FI', flag: '🇫🇮', nativeName: 'Suomi' },
  { code: 'it', label: 'IT', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'nl', label: 'NL', flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'pl', label: 'PL', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'sv', label: 'SV', flag: '🇸🇪', nativeName: 'Svenska' },
  { code: 'tr', label: 'TR', flag: '🇹🇷', nativeName: 'Türkçe' },
];

export const SUPPORTED_TARGET_LANGUAGES: Language[] = LANGUAGES;
