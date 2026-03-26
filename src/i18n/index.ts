import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import tr from './locales/tr.json';

const savedLang = (() => {
  try { return localStorage.getItem('ui-lang') || 'ko'; } catch { return 'ko'; }
})();

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    ja: { translation: ja },
    zh: { translation: zh },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    pt: { translation: pt },
    ar: { translation: ar },
    da: { translation: da },
    fi: { translation: fi },
    it: { translation: it },
    nl: { translation: nl },
    pl: { translation: pl },
    sv: { translation: sv },
    tr: { translation: tr },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
