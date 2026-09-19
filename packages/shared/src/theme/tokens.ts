/**
 * obo Design System — Shared Design Tokens
 * Source of Truth: apps/owner-web (Owner Web Dashboard)
 * 
 * Formal design token definitions extracted directly from the verified
 * Owner Web implementation. Used by both Owner Web and Unified Mobile.
 */

export const OBO_COLORS = {
  // Canvas & Surfaces
  canvas: '#F8FAFC',          // Page background (Slate 50)
  surface: '#FFFFFF',         // Card & modal background
  surfaceElevated: '#FFFFFF', // Elevated cards, popovers
  container: '#F1F5F9',       // Subtle container / icon box fill (Slate 100)
  containerSubtle: '#F8FAFC', // Secondary fill (Slate 50)
  backdrop: 'rgba(15, 23, 42, 0.60)', // Modal backdrop (Slate 900 at 60%)
  backdropDark: 'rgba(15, 23, 42, 0.75)', // Deep backdrop / Bottom sheet overlay

  // Text & Content
  textPrimary: '#0F172A',     // Primary headers, numbers, titles (Slate 900)
  textSecondary: '#334155',   // Field labels, sub-headers, table text (Slate 700)
  textMuted: '#64748B',       // Helper copy, descriptions, captions (Slate 500)
  textSubtle: '#94A3B8',      // Placeholders, minor notes, timestamps (Slate 400)
  textDisabled: '#CBD5E1',    // Disabled controls, inactive icons (Slate 300)
  textInverse: '#FFFFFF',     // Text on dark buttons & banners

  // Borders & Dividers
  border: '#E2E8F0',          // Standard cards, inputs, table borders (Slate 200)
  borderSubtle: '#F1F5F9',    // Light table row dividers (Slate 100)
  borderHover: '#CBD5E1',     // Input & button hover border (Slate 300)
  borderFocus: '#334155',     // Active input border (Slate 700)
  borderSelected: '#0F172A',  // Selected plan card border (Slate 900)

  // Slate Neutral Scale (Verified Owner Web Tailwind Slate Palette)
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  slate950: '#020617',

  // Primary Actions
  primary: '#0F172A',         // Primary CTA button, active navigation (Slate 900)
  primaryDark: '#020617',     // Slate 950
  primaryHover: '#1E293B',    // Button hover state (Slate 800)
  primaryActive: '#334155',   // Button active / pressed state (Slate 700)
  primaryFocusRing: '#E2E8F0',// Button focus outline ring (Slate 200)

  // Secondary & Neutral Actions
  secondaryBg: '#FFFFFF',
  secondaryHover: '#F8FAFC',
  secondaryBorder: '#E2E8F0',
  secondaryText: '#334155',

  // Status: Success (Active, Paid, Present)
  success: '#10B981',         // Emerald 500
  successBg: '#ECFDF5',       // Emerald 50
  successBorder: '#A7F3D0',   // Emerald 200
  successText: '#065F46',     // Emerald 800
  successDark: '#047857',     // Emerald 700

  // Status: Warning / Alert (Pending, Partial, Outstanding, Trial)
  warning: '#F59E0B',         // Amber 500
  warningBg: '#FEF3C7',       // Amber 100
  warningBgSubtle: '#FFFBEB', // Amber 50
  warningBorder: '#FDE68A',   // Amber 200
  warningText: '#92400E',     // Amber 800
  warningDark: '#B45309',     // Amber 700

  // Status: Danger / Destructive (Expired, Cancelled, Overdue, Delete)
  danger: '#EF4444',          // Red 500 (Tailwind Red - Owner Web danger semantic)
  dangerHover: '#DC2626',     // Red 600
  dangerBg: '#FEE2E2',        // Red 100
  dangerBgSubtle: '#FEF2F2',  // Red 50
  dangerBorder: '#FECACA',    // Red 200
  dangerText: '#991B1B',      // Red 800
  dangerDark: '#B91C1C',      // Red 700

  // Status: Info / Highlight (Live Session, Feature Tag)
  info: '#3B82F6',           // Blue 500
  infoBg: '#EFF6FF',         // Blue 50
  infoBorder: '#BFDBFE',     // Blue 200
  infoText: '#1E40AF',       // Blue 800
  infoDark: '#1D4ED8',       // Blue 700
} as const;

export const OBO_TYPOGRAPHY = {
  // Verified Font Family declarations from Owner Web (apps/owner-web/app/layout.tsx and app/globals.css)
  // Layout loads Google Inter with variable "--font-inter"
  // globals.css specifies: font-family: var(--font-inter), Arial, Helvetica, sans-serif;
  // @theme specifies: --font-sans: var(--font-inter);
  fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  fontFamilyVariable: 'var(--font-inter), Arial, Helvetica, sans-serif',
  fontFamilySans: 'var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontFamilyMobile: 'System',

  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } as const,

  // Hierarchy Scale
  scales: {
    display: {
      fontSize: 40,
      lineHeight: 44,
      fontWeight: '700' as const,
      letterSpacing: -1.2, // -0.055em
    },
    pageTitle: {
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '800' as const,
      letterSpacing: -0.8, // -0.04em
    },
    sectionTitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.4, // -0.02em
    },
    cardTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    kpiNumber: {
      fontSize: 32,
      lineHeight: 36,
      fontWeight: '800' as const,
      letterSpacing: -1.0, // -0.05em
    },
    bodyLarge: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    bodyMediumBold: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    smallBody: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    badge: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
    trackingTag: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '800' as const,
      letterSpacing: 1.2, // uppercase tracking-wider
    },
  },
} as const;

export const OBO_SPACING = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
} as const;

export const OBO_RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,       // rounded-lg: small action buttons, table inner elements
  lg: 12,      // rounded-xl: inputs, primary buttons, icon containers
  xl: 16,      // rounded-2xl: cards, KPI tiles, modal dialogues
  '2xl': 24,   // rounded-3xl: hero visual banners, bottom sheet top corners
  full: 9999,  // rounded-full: badges, pills, avatar circles
} as const;

export const OBO_SHADOWS = {
  none: 'none',
  xs: '0 1px 2px rgba(15, 23, 42, 0.02)',
  sm: '0 1px 3px rgba(15, 23, 42, 0.04)',
  card: '0 2px 5px rgba(15, 23, 42, 0.025)',
  cardHover: '0 12px 28px rgba(15, 23, 42, 0.08)',
  buttonPrimary: '0 10px 22px rgba(15, 23, 42, 0.18)',
  modal: '0 20px 40px rgba(15, 23, 42, 0.20)',
  bottomSheet: '0 -8px 24px rgba(15, 23, 42, 0.16)',
} as const;

export const OBO_CONTROLS = {
  button: {
    heightSm: 34,
    heightMd: 42,
    heightLg: 48,
    radius: OBO_RADIUS.lg,
    paddingX: OBO_SPACING.lg,
  },
  input: {
    heightSm: 36,
    heightMd: 44,
    radius: OBO_RADIUS.lg,
    borderWidth: 1,
    paddingX: OBO_SPACING.md,
  },
  card: {
    radius: OBO_RADIUS.xl,
    borderWidth: 1,
    padding: OBO_SPACING.xl,
  },
  badge: {
    radius: OBO_RADIUS.full,
    paddingX: OBO_SPACING.sm,
    paddingY: OBO_SPACING.xxs,
  },
  iconBox: {
    sizeSm: 32,
    sizeMd: 40,
    sizeLg: 48,
    radius: OBO_RADIUS.lg,
  },
} as const;
