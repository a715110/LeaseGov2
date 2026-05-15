/**
 * Color mode constants.
 *
 * Used by useColorMode hook and ColorModeToggle component.
 * Tenant override priority chain:
 *   1. User explicit preference (stored in UserPreference)
 *   2. Tenant default (TenantConfiguration.color_mode_default)
 *   3. System OS preference (prefers-color-scheme)
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 10 (Constants)
 */
import type { ColorMode } from '../types/shared/ThemeMode'

export const COLOR_MODES = {
  LIGHT:  'light',
  DARK:   'dark',
  SYSTEM: 'system',
} as const satisfies Record<string, ColorMode>

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  light:  'Light',
  dark:   'Dark',
  system: 'System',
}

/** The key used to persist the user's color mode preference in localStorage. */
export const COLOR_MODE_STORAGE_KEY = 'leasegov:color-mode'

/** Default color mode when no preference is set and no tenant override exists. */
export const DEFAULT_COLOR_MODE: ColorMode = 'light'

/**
 * Resolves the effective color mode from a user/tenant preference.
 * 'system' is resolved to 'light' or 'dark' based on the OS preference.
 */
export function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode !== 'system') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
