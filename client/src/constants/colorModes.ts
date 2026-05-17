/**
 * Color mode constants.
 *
 * Simplified to Light / Dark only — System mode removed.
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 10 (Constants)
 */
import type { ColorMode } from '../types/shared/ThemeMode'

export const COLOR_MODES = {
  LIGHT: 'light',
  DARK:  'dark',
} as const satisfies Record<string, ColorMode>

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  light: 'Light',
  dark:  'Dark',
}

/** The key used to persist the user's color mode preference in localStorage. */
export const COLOR_MODE_STORAGE_KEY = 'leasegov_color_mode'

/** Default color mode when no preference is set and no tenant override exists. */
export const DEFAULT_COLOR_MODE: ColorMode = 'light'

/**
 * Returns the mode as-is — both values are already concrete ('light' | 'dark').
 * Kept for API compatibility with any callers that previously used resolveColorMode.
 */
export function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  return mode
}
