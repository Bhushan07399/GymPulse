'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en, hi, mr, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SupportedLanguage } from '@i18n';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

function getSavedLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
      return saved;
    }
  }
  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });
}

export function changeLanguage(lang: SupportedLanguage) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
  i18n.changeLanguage(lang);
}

export default i18n;
