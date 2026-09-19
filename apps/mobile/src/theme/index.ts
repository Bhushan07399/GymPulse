/**
 * obo Mobile Theme
 * Single entry point for design tokens in the unified obo Mobile application.
 * Extracted from Owner Web visual system (Slate SaaS palette).
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radius';
export * from './shadows';

import { Colors } from './colors';
import { Typography, FontWeights, FontFamilies } from './typography';
import { Spacing } from './spacing';
import { Radius } from './radius';
import { Shadows } from './shadows';

export const Theme = {
  colors: Colors,
  typography: Typography,
  fontFamilies: FontFamilies,
  weights: FontWeights,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
} as const;

export type Theme = typeof Theme;
export default Theme;
