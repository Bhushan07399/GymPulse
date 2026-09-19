/**
 * obo Mobile Theme — Border Radius
 * Direct React Native adaptation of Owner Web border radius tokens.
 */

export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,       // Small chips, table rows
  lg: 12,      // Inputs, primary action buttons, icon boxes
  xl: 16,      // Standard cards, KPI tiles, alert boxes
  '2xl': 24,   // Modal panels, bottom sheet top corners, banners
  full: 9999,  // Status badges, avatar circles, round action buttons
} as const;

export type RadiusToken = keyof typeof Radius;
