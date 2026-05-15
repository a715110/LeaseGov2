/**
 * Theme token definitions — V4 Theme System.
 *
 * Four named themes × two color modes (light / dark).
 * Sidebar background is STRUCTURALLY CONSTANT per theme — identical in light and dark.
 * This is a hard rule from MASTER_FRONTEND_ARCHITECTURE_V4.md.
 *
 * All color values are OKLCH strings for Tailwind 4 compatibility.
 * CSS custom properties are injected by ThemeProvider.tsx.
 *
 * NEW IN V4:
 * - Four themes: structured_authority, modern_violet, gradient_pro, executive_slate
 * - Two modes per theme: light, dark
 * - Sidebar constant rule enforced here
 * - ThemeTokens type exported for useTheme hook
 */
import type { ThemeKey, ColorMode } from '../types/shared/ThemeMode'

export interface ThemeTokens {
  // Core palette
  background:           string
  foreground:           string
  card:                 string
  cardForeground:       string
  popover:              string
  popoverForeground:    string
  primary:              string
  primaryForeground:    string
  secondary:            string
  secondaryForeground:  string
  muted:                string
  mutedForeground:      string
  accent:               string
  accentForeground:     string
  destructive:          string
  destructiveForeground:string
  border:               string
  input:                string
  ring:                 string

  // Sidebar — CONSTANT across light and dark for this theme
  sidebarBackground:    string
  sidebarForeground:    string
  sidebarPrimary:       string
  sidebarPrimaryForeground: string
  sidebarAccent:        string
  sidebarAccentForeground:  string
  sidebarBorder:        string

  // Charts
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string

  // Radius
  radius: string
}

// ─── Structured Authority ─────────────────────────────────────────────────────
// Design movement: Government/institutional authority, deep navy + slate
// Sidebar: constant deep navy regardless of mode

const STRUCTURED_AUTHORITY_SIDEBAR: Pick<
  ThemeTokens,
  'sidebarBackground' | 'sidebarForeground' | 'sidebarPrimary' | 'sidebarPrimaryForeground' | 'sidebarAccent' | 'sidebarAccentForeground' | 'sidebarBorder'
> = {
  sidebarBackground:          'oklch(0.18 0.03 240)',
  sidebarForeground:          'oklch(0.92 0.005 240)',
  sidebarPrimary:             'oklch(0.55 0.18 240)',
  sidebarPrimaryForeground:   'oklch(0.98 0 0)',
  sidebarAccent:              'oklch(0.25 0.04 240)',
  sidebarAccentForeground:    'oklch(0.92 0.005 240)',
  sidebarBorder:              'oklch(1 0 0 / 10%)',
}

const STRUCTURED_AUTHORITY_LIGHT: ThemeTokens = {
  background:           'oklch(0.98 0.002 240)',
  foreground:           'oklch(0.15 0.025 240)',
  card:                 'oklch(1 0 0)',
  cardForeground:       'oklch(0.15 0.025 240)',
  popover:              'oklch(1 0 0)',
  popoverForeground:    'oklch(0.15 0.025 240)',
  primary:              'oklch(0.38 0.14 240)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.94 0.005 240)',
  secondaryForeground:  'oklch(0.3 0.02 240)',
  muted:                'oklch(0.94 0.005 240)',
  mutedForeground:      'oklch(0.52 0.015 240)',
  accent:               'oklch(0.94 0.005 240)',
  accentForeground:     'oklch(0.15 0.025 240)',
  destructive:          'oklch(0.577 0.245 27.325)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(0.88 0.008 240)',
  input:                'oklch(0.88 0.008 240)',
  ring:                 'oklch(0.38 0.14 240)',
  chart1:               'oklch(0.38 0.14 240)',
  chart2:               'oklch(0.50 0.16 240)',
  chart3:               'oklch(0.62 0.14 240)',
  chart4:               'oklch(0.74 0.10 240)',
  chart5:               'oklch(0.82 0.06 240)',
  radius:               '0.5rem',
  ...STRUCTURED_AUTHORITY_SIDEBAR,
}

const STRUCTURED_AUTHORITY_DARK: ThemeTokens = {
  background:           'oklch(0.12 0.02 240)',
  foreground:           'oklch(0.90 0.005 240)',
  card:                 'oklch(0.17 0.025 240)',
  cardForeground:       'oklch(0.90 0.005 240)',
  popover:              'oklch(0.17 0.025 240)',
  popoverForeground:    'oklch(0.90 0.005 240)',
  primary:              'oklch(0.60 0.18 240)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.22 0.03 240)',
  secondaryForeground:  'oklch(0.75 0.01 240)',
  muted:                'oklch(0.22 0.03 240)',
  mutedForeground:      'oklch(0.60 0.015 240)',
  accent:               'oklch(0.22 0.03 240)',
  accentForeground:     'oklch(0.90 0.005 240)',
  destructive:          'oklch(0.704 0.191 22.216)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(1 0 0 / 10%)',
  input:                'oklch(1 0 0 / 15%)',
  ring:                 'oklch(0.60 0.18 240)',
  chart1:               'oklch(0.60 0.18 240)',
  chart2:               'oklch(0.70 0.16 240)',
  chart3:               'oklch(0.78 0.12 240)',
  chart4:               'oklch(0.84 0.08 240)',
  chart5:               'oklch(0.88 0.05 240)',
  radius:               '0.5rem',
  ...STRUCTURED_AUTHORITY_SIDEBAR,
}

// ─── Modern Violet ────────────────────────────────────────────────────────────
// Design movement: Modern SaaS, violet + indigo
// Sidebar: constant deep violet

const MODERN_VIOLET_SIDEBAR: Pick<
  ThemeTokens,
  'sidebarBackground' | 'sidebarForeground' | 'sidebarPrimary' | 'sidebarPrimaryForeground' | 'sidebarAccent' | 'sidebarAccentForeground' | 'sidebarBorder'
> = {
  sidebarBackground:          'oklch(0.20 0.06 290)',
  sidebarForeground:          'oklch(0.93 0.005 290)',
  sidebarPrimary:             'oklch(0.60 0.22 290)',
  sidebarPrimaryForeground:   'oklch(0.98 0 0)',
  sidebarAccent:              'oklch(0.27 0.07 290)',
  sidebarAccentForeground:    'oklch(0.93 0.005 290)',
  sidebarBorder:              'oklch(1 0 0 / 10%)',
}

const MODERN_VIOLET_LIGHT: ThemeTokens = {
  background:           'oklch(0.98 0.003 290)',
  foreground:           'oklch(0.14 0.03 290)',
  card:                 'oklch(1 0 0)',
  cardForeground:       'oklch(0.14 0.03 290)',
  popover:              'oklch(1 0 0)',
  popoverForeground:    'oklch(0.14 0.03 290)',
  primary:              'oklch(0.50 0.22 290)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.94 0.006 290)',
  secondaryForeground:  'oklch(0.30 0.025 290)',
  muted:                'oklch(0.94 0.006 290)',
  mutedForeground:      'oklch(0.52 0.018 290)',
  accent:               'oklch(0.94 0.006 290)',
  accentForeground:     'oklch(0.14 0.03 290)',
  destructive:          'oklch(0.577 0.245 27.325)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(0.88 0.010 290)',
  input:                'oklch(0.88 0.010 290)',
  ring:                 'oklch(0.50 0.22 290)',
  chart1:               'oklch(0.50 0.22 290)',
  chart2:               'oklch(0.62 0.20 290)',
  chart3:               'oklch(0.72 0.16 290)',
  chart4:               'oklch(0.80 0.12 290)',
  chart5:               'oklch(0.87 0.07 290)',
  radius:               '0.75rem',
  ...MODERN_VIOLET_SIDEBAR,
}

const MODERN_VIOLET_DARK: ThemeTokens = {
  background:           'oklch(0.13 0.025 290)',
  foreground:           'oklch(0.91 0.005 290)',
  card:                 'oklch(0.18 0.03 290)',
  cardForeground:       'oklch(0.91 0.005 290)',
  popover:              'oklch(0.18 0.03 290)',
  popoverForeground:    'oklch(0.91 0.005 290)',
  primary:              'oklch(0.65 0.22 290)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.23 0.04 290)',
  secondaryForeground:  'oklch(0.76 0.01 290)',
  muted:                'oklch(0.23 0.04 290)',
  mutedForeground:      'oklch(0.62 0.018 290)',
  accent:               'oklch(0.23 0.04 290)',
  accentForeground:     'oklch(0.91 0.005 290)',
  destructive:          'oklch(0.704 0.191 22.216)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(1 0 0 / 10%)',
  input:                'oklch(1 0 0 / 15%)',
  ring:                 'oklch(0.65 0.22 290)',
  chart1:               'oklch(0.65 0.22 290)',
  chart2:               'oklch(0.73 0.18 290)',
  chart3:               'oklch(0.79 0.14 290)',
  chart4:               'oklch(0.85 0.09 290)',
  chart5:               'oklch(0.90 0.05 290)',
  radius:               '0.75rem',
  ...MODERN_VIOLET_SIDEBAR,
}

// ─── Gradient Pro ─────────────────────────────────────────────────────────────
// Design movement: Premium SaaS, teal + cyan gradient accent
// Sidebar: constant deep teal

const GRADIENT_PRO_SIDEBAR: Pick<
  ThemeTokens,
  'sidebarBackground' | 'sidebarForeground' | 'sidebarPrimary' | 'sidebarPrimaryForeground' | 'sidebarAccent' | 'sidebarAccentForeground' | 'sidebarBorder'
> = {
  sidebarBackground:          'oklch(0.18 0.04 195)',
  sidebarForeground:          'oklch(0.92 0.005 195)',
  sidebarPrimary:             'oklch(0.58 0.18 195)',
  sidebarPrimaryForeground:   'oklch(0.98 0 0)',
  sidebarAccent:              'oklch(0.25 0.05 195)',
  sidebarAccentForeground:    'oklch(0.92 0.005 195)',
  sidebarBorder:              'oklch(1 0 0 / 10%)',
}

const GRADIENT_PRO_LIGHT: ThemeTokens = {
  background:           'oklch(0.98 0.003 195)',
  foreground:           'oklch(0.14 0.025 195)',
  card:                 'oklch(1 0 0)',
  cardForeground:       'oklch(0.14 0.025 195)',
  popover:              'oklch(1 0 0)',
  popoverForeground:    'oklch(0.14 0.025 195)',
  primary:              'oklch(0.48 0.18 195)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.94 0.006 195)',
  secondaryForeground:  'oklch(0.30 0.02 195)',
  muted:                'oklch(0.94 0.006 195)',
  mutedForeground:      'oklch(0.52 0.015 195)',
  accent:               'oklch(0.94 0.006 195)',
  accentForeground:     'oklch(0.14 0.025 195)',
  destructive:          'oklch(0.577 0.245 27.325)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(0.88 0.008 195)',
  input:                'oklch(0.88 0.008 195)',
  ring:                 'oklch(0.48 0.18 195)',
  chart1:               'oklch(0.48 0.18 195)',
  chart2:               'oklch(0.60 0.16 195)',
  chart3:               'oklch(0.70 0.13 195)',
  chart4:               'oklch(0.78 0.09 195)',
  chart5:               'oklch(0.85 0.05 195)',
  radius:               '0.65rem',
  ...GRADIENT_PRO_SIDEBAR,
}

const GRADIENT_PRO_DARK: ThemeTokens = {
  background:           'oklch(0.12 0.02 195)',
  foreground:           'oklch(0.90 0.005 195)',
  card:                 'oklch(0.17 0.025 195)',
  cardForeground:       'oklch(0.90 0.005 195)',
  popover:              'oklch(0.17 0.025 195)',
  popoverForeground:    'oklch(0.90 0.005 195)',
  primary:              'oklch(0.62 0.18 195)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.22 0.03 195)',
  secondaryForeground:  'oklch(0.75 0.01 195)',
  muted:                'oklch(0.22 0.03 195)',
  mutedForeground:      'oklch(0.60 0.015 195)',
  accent:               'oklch(0.22 0.03 195)',
  accentForeground:     'oklch(0.90 0.005 195)',
  destructive:          'oklch(0.704 0.191 22.216)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(1 0 0 / 10%)',
  input:                'oklch(1 0 0 / 15%)',
  ring:                 'oklch(0.62 0.18 195)',
  chart1:               'oklch(0.62 0.18 195)',
  chart2:               'oklch(0.70 0.15 195)',
  chart3:               'oklch(0.77 0.11 195)',
  chart4:               'oklch(0.83 0.07 195)',
  chart5:               'oklch(0.88 0.04 195)',
  radius:               '0.65rem',
  ...GRADIENT_PRO_SIDEBAR,
}

// ─── Executive Slate ──────────────────────────────────────────────────────────
// Design movement: Enterprise/executive, warm slate + amber accent
// Sidebar: constant charcoal slate

const EXECUTIVE_SLATE_SIDEBAR: Pick<
  ThemeTokens,
  'sidebarBackground' | 'sidebarForeground' | 'sidebarPrimary' | 'sidebarPrimaryForeground' | 'sidebarAccent' | 'sidebarAccentForeground' | 'sidebarBorder'
> = {
  sidebarBackground:          'oklch(0.19 0.01 60)',
  sidebarForeground:          'oklch(0.91 0.005 60)',
  sidebarPrimary:             'oklch(0.68 0.16 65)',
  sidebarPrimaryForeground:   'oklch(0.10 0.02 60)',
  sidebarAccent:              'oklch(0.26 0.015 60)',
  sidebarAccentForeground:    'oklch(0.91 0.005 60)',
  sidebarBorder:              'oklch(1 0 0 / 10%)',
}

const EXECUTIVE_SLATE_LIGHT: ThemeTokens = {
  background:           'oklch(0.97 0.003 60)',
  foreground:           'oklch(0.15 0.02 60)',
  card:                 'oklch(1 0 0)',
  cardForeground:       'oklch(0.15 0.02 60)',
  popover:              'oklch(1 0 0)',
  popoverForeground:    'oklch(0.15 0.02 60)',
  primary:              'oklch(0.55 0.16 65)',
  primaryForeground:    'oklch(0.98 0 0)',
  secondary:            'oklch(0.93 0.005 60)',
  secondaryForeground:  'oklch(0.30 0.015 60)',
  muted:                'oklch(0.93 0.005 60)',
  mutedForeground:      'oklch(0.52 0.012 60)',
  accent:               'oklch(0.93 0.005 60)',
  accentForeground:     'oklch(0.15 0.02 60)',
  destructive:          'oklch(0.577 0.245 27.325)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(0.87 0.007 60)',
  input:                'oklch(0.87 0.007 60)',
  ring:                 'oklch(0.55 0.16 65)',
  chart1:               'oklch(0.55 0.16 65)',
  chart2:               'oklch(0.65 0.14 65)',
  chart3:               'oklch(0.73 0.11 65)',
  chart4:               'oklch(0.80 0.08 65)',
  chart5:               'oklch(0.86 0.05 65)',
  radius:               '0.4rem',
  ...EXECUTIVE_SLATE_SIDEBAR,
}

const EXECUTIVE_SLATE_DARK: ThemeTokens = {
  background:           'oklch(0.13 0.01 60)',
  foreground:           'oklch(0.89 0.005 60)',
  card:                 'oklch(0.18 0.015 60)',
  cardForeground:       'oklch(0.89 0.005 60)',
  popover:              'oklch(0.18 0.015 60)',
  popoverForeground:    'oklch(0.89 0.005 60)',
  primary:              'oklch(0.68 0.16 65)',
  primaryForeground:    'oklch(0.10 0.02 60)',
  secondary:            'oklch(0.23 0.015 60)',
  secondaryForeground:  'oklch(0.74 0.01 60)',
  muted:                'oklch(0.23 0.015 60)',
  mutedForeground:      'oklch(0.60 0.012 60)',
  accent:               'oklch(0.23 0.015 60)',
  accentForeground:     'oklch(0.89 0.005 60)',
  destructive:          'oklch(0.704 0.191 22.216)',
  destructiveForeground:'oklch(0.985 0 0)',
  border:               'oklch(1 0 0 / 10%)',
  input:                'oklch(1 0 0 / 15%)',
  ring:                 'oklch(0.68 0.16 65)',
  chart1:               'oklch(0.68 0.16 65)',
  chart2:               'oklch(0.75 0.13 65)',
  chart3:               'oklch(0.80 0.10 65)',
  chart4:               'oklch(0.85 0.07 65)',
  chart5:               'oklch(0.89 0.04 65)',
  radius:               '0.4rem',
  ...EXECUTIVE_SLATE_SIDEBAR,
}

// ─── Theme Registry ───────────────────────────────────────────────────────────

export const THEMES: Record<ThemeKey, Record<Exclude<ColorMode, 'system'>, ThemeTokens>> = {
  structured_authority: {
    light: STRUCTURED_AUTHORITY_LIGHT,
    dark:  STRUCTURED_AUTHORITY_DARK,
  },
  modern_violet: {
    light: MODERN_VIOLET_LIGHT,
    dark:  MODERN_VIOLET_DARK,
  },
  gradient_pro: {
    light: GRADIENT_PRO_LIGHT,
    dark:  GRADIENT_PRO_DARK,
  },
  executive_slate: {
    light: EXECUTIVE_SLATE_LIGHT,
    dark:  EXECUTIVE_SLATE_DARK,
  },
}

export const DEFAULT_THEME: ThemeKey = 'structured_authority'
export const DEFAULT_COLOR_MODE: ColorMode = 'light'
