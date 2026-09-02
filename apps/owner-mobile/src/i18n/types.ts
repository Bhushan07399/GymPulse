/**
 * GymPulse i18n — TypeScript types
 *
 * Auto-derived key union from en.json structure.
 * Use with useTranslation() for type-safe t() calls.
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'gympulse.language';

export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'nav'
  | 'dashboard'
  | 'members'
  | 'attendance'
  | 'classes'
  | 'qrPass'
  | 'payments'
  | 'plans'
  | 'staff'
  | 'settings'
  | 'reports'
  | 'analytics'
  | 'whatsapp'
  | 'gymQR'
  | 'reception'
  | 'subscription'
  | 'language'
  | 'errors';
