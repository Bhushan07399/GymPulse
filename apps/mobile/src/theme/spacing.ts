/**
 * obo Mobile Theme — Spacing Rhythm
 * Direct React Native adaptation of Owner Web layout spacing.
 */

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,

  // Screen Padding
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,
  cardPadding: 16,
  modalPadding: 20,
} as const;

export type SpacingToken = keyof typeof Spacing;
