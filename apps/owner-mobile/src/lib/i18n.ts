import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

import { en, hi, mr, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SupportedLanguage } from '../i18n';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

function getSavedLanguageSync(): SupportedLanguage {
  try {
    const saved = SecureStore.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) {
      return saved;
    }
  } catch (err) {
    // SecureStore fallback
  }
  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getSavedLanguageSync(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export async function changeLanguage(lang: SupportedLanguage) {
  try {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
  } catch (err) {
    // SecureStore fallback
  }
  await i18n.changeLanguage(lang);
}

export default i18n;
