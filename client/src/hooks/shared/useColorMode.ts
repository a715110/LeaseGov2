/**
 * useColorMode — resolves the active color mode.
 *
 * NEW IN V4. Simplified to Light / Dark only (System removed).
 *
 * Priority chain (highest to lowest):
 * 1. Tenant override (allowUserToggle === false → forces tenantDefault)
 * 2. localStorage stored preference ('leasegov_color_mode')
 * 3. Tenant default (TenantConfiguration.color_mode_default)
 * 4. Platform default ('light')
 *
 * Returns resolvedMode as 'light' | 'dark' — always concrete, never ambiguous.
 */
import { useState, useCallback } from 'react'
import type { ColorMode } from '../../types/shared/ThemeMode'

const COLOR_MODE_STORAGE = 'leasegov_color_mode'

export interface UseColorModeOptions {
  tenantDefault: ColorMode
  allowUserToggle: boolean
  userPreference: ColorMode | null
}

export interface UseColorModeReturn {
  /** The resolved mode — always 'light' or 'dark' */
  resolvedMode: 'light' | 'dark'
  /** The raw user preference setting (same as resolvedMode — no 'system' anymore) */
  rawMode: ColorMode
  /** Set the user's color mode preference */
  setMode: (mode: ColorMode) => void
  /** Whether the user is allowed to toggle the mode */
  canToggle: boolean
}

export function useColorMode(options: UseColorModeOptions): UseColorModeReturn {
  const { tenantDefault, allowUserToggle, userPreference } = options

  const [rawMode, setRawMode] = useState<ColorMode>(() => {
    if (!allowUserToggle) return tenantDefault
    // localStorage takes priority over prop-passed userPreference
    const stored = localStorage.getItem(COLOR_MODE_STORAGE) as ColorMode | null
    if (stored === 'light' || stored === 'dark') return stored
    if (userPreference === 'light' || userPreference === 'dark') return userPreference
    return tenantDefault
  })

  const setMode = useCallback((mode: ColorMode) => {
    if (!allowUserToggle) return
    setRawMode(mode)
    localStorage.setItem(COLOR_MODE_STORAGE, mode)
  }, [allowUserToggle])

  const resolvedMode: 'light' | 'dark' = allowUserToggle ? rawMode : tenantDefault

  return {
    resolvedMode,
    rawMode,
    setMode,
    canToggle: allowUserToggle,
  }
}
