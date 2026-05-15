/**
 * LeaseGovThemeContext — V4 Theme System context.
 *
 * NEW IN V4. Distinct from the template's ThemeContext.
 *
 * Provides:
 * - themeKey: current ThemeKey (structured_authority | modern_violet | gradient_pro | executive_slate)
 * - resolvedMode: 'light' | 'dark' (never 'system')
 * - rawMode: ColorMode (may be 'system')
 * - setMode: (mode: ColorMode) => void
 * - canToggle: boolean (false if tenant disables toggle)
 *
 * This context is populated by LeaseGovThemeProvider.tsx.
 */
import { createContext } from 'react'
import type { ThemeKey, ColorMode } from '../types/shared/ThemeMode'

export interface LeaseGovThemeContextValue {
  themeKey: ThemeKey
  resolvedMode: 'light' | 'dark'
  rawMode: ColorMode
  setMode: (mode: ColorMode) => void
  canToggle: boolean
}

export const LeaseGovThemeContext = createContext<LeaseGovThemeContextValue | null>(null)
