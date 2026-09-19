/**
 * obo Mobile Theme — Colors
 * Direct React Native adaptation of Owner Web visual design tokens.
 * Single source of truth: Owner Web (Slate & Monochrome SaaS palette)
 */

export const Colors = {
  // Canvas & Backgrounds
  background: '#F8FAFC',          // Canvas / Screen background (Slate 50)
  surface: '#FFFFFF',             // Cards, modals, lists (Pure White)
  surfaceCard: '#FFFFFF',         // Card surface
  surfaceElevated: '#FFFFFF',     // Popovers, action sheets
  container: '#F1F5F9',           // Subtle container / icon box fill (Slate 100)
  containerSubtle: '#F8FAFC',     // Secondary fill (Slate 50)
  backdrop: 'rgba(15, 23, 42, 0.60)', // Modal backdrop (Slate 900 at 60%)
  backdropDark: 'rgba(15, 23, 42, 0.75)', // Deep backdrop / Bottom sheet overlay

  // Slate Scale (Verified Owner Web Tailwind Slate Palette)
  slate950: '#020617',
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',

  // Typography / Text
  textPrimary: '#0F172A',         // Primary titles, figures, bold headings (Slate 900)
  textSecondary: '#334155',       // Labels, subtitles, table values (Slate 700)
  textMuted: '#64748B',           // Helper descriptions, captions (Slate 500)
  textSubtle: '#94A3B8',          // Secondary placeholders, small notes (Slate 400)
  textPlaceholder: '#94A3B8',     // Input placeholder text
  textDisabled: '#CBD5E1',        // Disabled text & icons (Slate 300)
  textLight: '#FFFFFF',           // White text on dark buttons & banners
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',              // Standard card, input, item border (Slate 200)
  borderSubtle: '#F1F5F9',        // Inner item dividers (Slate 100)
  borderHover: '#CBD5E1',         // Pressed / focused border (Slate 300)
  borderFocus: '#334155',         // Active input focus border (Slate 700)
  borderSelected: '#0F172A',      // Selected plan or card border (Slate 900)

  // Primary Action (obo Slate SaaS Identity)
  primary: '#0F172A',             // Dark Slate 900 primary button & active tint
  primaryDark: '#020617',         // Dark Slate 950
  primaryLight: '#F1F5F9',
  primaryPressed: '#1E293B',

  // Secondary & Neutral Actions
  secondaryBg: '#FFFFFF',
  secondaryText: '#334155',
  secondaryBorder: '#E2E8F0',

  // Status: Success (Active membership, Paid fee, Present check-in)
  success: '#10B981',             // Emerald 500
  successBg: '#ECFDF5',           // Emerald 50
  successBorder: '#A7F3D0',       // Emerald 200
  successText: '#065F46',         // Emerald 800
  successLight: '#D1FAE5',

  // Status: Warning / Pending (Dues, Partial payment, Expiring soon, Trial)
  warning: '#F59E0B',             // Amber 500
  warningBg: '#FEF3C7',           // Amber 100
  warningBgSubtle: '#FFFBEB',     // Amber 50
  warningBorder: '#FDE68A',       // Amber 200
  warningText: '#92400E',         // Amber 800
  warningLight: '#FEF3C7',

  // Status: Danger / Destructive (Expired plan, Cancelled booking, Delete action)
  danger: '#EF4444',              // Red 500 (Tailwind Red)
  dangerBg: '#FEE2E2',            // Red 100
  dangerBgSubtle: '#FEF2F2',      // Red 50
  dangerBorder: '#FECACA',        // Red 200
  dangerText: '#991B1B',          // Red 800
  dangerLight: '#FEE2E2',

  // Status: Info / Highlight
  info: '#3B82F6',               // Blue 500
  infoBg: '#EFF6FF',             // Blue 50
  infoBorder: '#BFDBFE',         // Blue 200
  infoText: '#1E40AF',           // Blue 800
  infoLight: '#DBEAFE',
} as const;

export type ColorToken = keyof typeof Colors;
