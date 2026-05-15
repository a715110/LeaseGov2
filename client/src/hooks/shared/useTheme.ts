/**
 * useTheme — returns the current ThemeTokens object.
 *
 * NEW IN V4.
 *
 * Reads the current theme key and resolved color mode from ThemeContext
 * and returns the corresponding ThemeTokens object.
 *
 * Usage:
 *   const tokens = useTheme()
 *   // tokens.primary, tokens.sidebarBackground, etc.
 */
import { useContext } from 'react'
import { LeaseGovThemeContext } from '../../contexts/LeaseGovThemeContext'
import { THEMES, DEFAULT_THEME, DEFAULT_COLOR_MODE } from '../../constants/themes'
import type { ThemeTokens } from '../../constants/themes'

export function useTheme(): ThemeTokens {
  const ctx = useContext(LeaseGovThemeContext)
  const themeKey = ctx?.themeKey ?? DEFAULT_THEME
  const resolvedMode = ctx?.resolvedMode ?? DEFAULT_COLOR_MODE

  const mode = resolvedMode === 'system' ? 'light' : resolvedMode
  return THEMES[themeKey][mode as 'light' | 'dark']
}
