'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeLanguage } from '@/src/lib/i18n';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@i18n';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as SupportedLanguage;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Globe className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = currentLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={`Switch language to ${lang.label}`}
            >
              {variant === 'compact' ? lang.nativeLabel : `${lang.nativeLabel} (${lang.label})`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
