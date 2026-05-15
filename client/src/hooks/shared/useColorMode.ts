/**
 * useColorMode — resolves the active color mode.
 *
 * NEW IN V4.
 *
 * Priority chain (highest to lowest):
 * 1. Tenant override (allow_user_mode_toggle === false → forces tenant default)
 * 2. User preference (stored in UserPreference.colorMode)
 * 3. System preference (prefers-color-scheme media query)
 * 4. Tenant default (TenantConfiguration.color_mode_default)
 * 5. Platform default ('light')
 *
 * Returns the resolved mode as 'light' | 'dark' — never 'system'.
 *
 * // TODO: Backend integration required — user preference persistence
 */
import { useState, useEffect, useCallback } from 'react'
import type { ColorMode } from '../../types/shared/ThemeMode'

export interface UseColorModeOptions {
  tenantDefault: ColorMode
  allowUserToggle: boolean
  userPreference: ColorMode | null
}

export interface UseColorModeReturn {
  /** The resolved mode — always 'light' or 'dark', never 'system' */
  resolvedMode: 'light' | 'dark'
  /** The raw user preference setting (may be 'system') */
  rawMode: ColorMode
  /** Set the user's color mode preference */
  setMode: (mode: ColorMode) => void
  /** Whether the user is allowed to toggle the mode */
  canToggle: boolean
}

function resolveSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useColorMode(options: UseColorModeOptions): UseColorModeReturn {
  const { tenantDefault, allowUserToggle, userPreference } = options

  const [rawMode, setRawMode] = useState<ColorMode>(() => {
    if (!allowUserToggle) return tenantDefault
    return userPreference ?? tenantDefault
  })

  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(resolveSystemMode)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolvedMode: 'light' | 'dark' = (() => {
    if (!allowUserToggle) {
      // Tenant override: force tenant default, resolve 'system' to actual
      const mode = tenantDefault === 'system' ? systemMode : tenantDefault
      return mode as 'light' | 'dark'
    }
    if (rawMode === 'system') return systemMode
    return rawMode as 'light' | 'dark'
  })()

  const setMode = useCallback((mode: ColorMode) => {
    if (!allowUserToggle) return
    setRawMode(mode)
    // TODO: Persist to backend via userPreferenceService
  }, [allowUserToggle])

  return {
    resolvedMode,
    rawMode,
    setMode,
    canToggle: allowUserToggle,
  }
}
