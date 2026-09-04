'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SupportedLanguage } from '@i18n';

const resources = {
  en: { translation: en },
};

function getSavedLanguage(): SupportedLanguage {
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
