/**
 * obo Mobile Theme — Typography
 * Direct React Native adaptation of Owner Web typography scales.
 * Source font: Inter (Web) / System Default (Mobile)
 */

import { Colors } from './colors';

export const FontFamilies = {
  // Mobile uses native System sans-serif (SF Pro on iOS, Roboto on Android)
  // aligning with Owner Web's clean Inter sans-serif appearance
  sans: 'System',
  mono: 'Courier',
} as const;

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export interface MobileTextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
  color?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontFamily?: string;
}

export const Typography = {
  // Display & Hero
  display: {
    fontFamily: FontFamilies.sans,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  pageTitle: {
    fontFamily: FontFamilies.sans,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },

  // Section & Card Titles
  sectionTitle: {
    fontFamily: FontFamilies.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontFamily: FontFamilies.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.textPrimary,
  },

  // KPI Numbers
  kpiNumber: {
    fontFamily: FontFamilies.sans,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },

  // Body Copy
  bodyLarge: {
    fontFamily: FontFamilies.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  body: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  bodyMedium: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  bodyBold: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  smallBody: {
    fontFamily: FontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  // Field Labels & Controls
  label: {
    fontFamily: FontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: FontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: Colors.textMuted,
  },

  // Status Badges & Category Tags
  badge: {
    fontFamily: FontFamilies.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  trackingTag: {
    fontFamily: FontFamilies.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.textMuted,
  },

  // Monospace (Member IDs, Transaction References)
  mono: {
    fontFamily: FontFamilies.mono,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
} as const;

export type TypographyToken = keyof typeof Typography;
