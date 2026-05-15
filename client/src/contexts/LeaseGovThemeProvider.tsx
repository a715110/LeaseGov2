/**
 * LeaseGovThemeProvider — V4 Theme System provider.
 *
 * NEW IN V4.
 *
 * Responsibilities:
 * 1. Reads themeKey and colorMode configuration from TenantContext
 * 2. Resolves the active color mode via useColorMode hook
 * 3. Injects CSS custom properties onto document.documentElement
 * 4. Applies .dark class to documentElement for Tailwind dark mode
 * 5. Provides LeaseGovThemeContext to all descendants
 *
 * SIDEBAR CONSTANT RULE:
 * Sidebar tokens are injected identically for both light and dark modes.
 * This is enforced by the THEMES registry in constants/themes.ts.
 *
 * FLASH PREVENTION:
 * A blocking script in index.html <head> reads the stored preference
 * and applies the correct class before React hydrates.
 * See: client/index.html — flash prevention script block.
 */
import React, { useEffect, useMemo } from 'react'
import { LeaseGovThemeContext } from './LeaseGovThemeContext'
import { useColorMode } from '../hooks/shared/useColorMode'
import { THEMES, DEFAULT_THEME, DEFAULT_COLOR_MODE } from '../constants/themes'
import type { ThemeTokens } from '../constants/themes'
import type { ThemeKey, ColorMode } from '../types/shared/ThemeMode'

interface LeaseGovThemeProviderProps {
  children: React.ReactNode
  themeKey?: ThemeKey
  tenantColorModeDefault?: ColorMode
  allowUserModeToggle?: boolean
  userColorModePreference?: ColorMode | null
}

function injectTokens(tokens: ThemeTokens): void {
  const el = document.documentElement
  el.style.setProperty('--background',              tokens.background)
  el.style.setProperty('--foreground',              tokens.foreground)
  el.style.setProperty('--card',                    tokens.card)
  el.style.setProperty('--card-foreground',         tokens.cardForeground)
  el.style.setProperty('--popover',                 tokens.popover)
  el.style.setProperty('--popover-foreground',      tokens.popoverForeground)
  el.style.setProperty('--primary',                 tokens.primary)
  el.style.setProperty('--primary-foreground',      tokens.primaryForeground)
  el.style.setProperty('--secondary',               tokens.secondary)
  el.style.setProperty('--secondary-foreground',    tokens.secondaryForeground)
  el.style.setProperty('--muted',                   tokens.muted)
  el.style.setProperty('--muted-foreground',        tokens.mutedForeground)
  el.style.setProperty('--accent',                  tokens.accent)
  el.style.setProperty('--accent-foreground',       tokens.accentForeground)
  el.style.setProperty('--destructive',             tokens.destructive)
  el.style.setProperty('--destructive-foreground',  tokens.destructiveForeground)
  el.style.setProperty('--border',                  tokens.border)
  el.style.setProperty('--input',                   tokens.input)
  el.style.setProperty('--ring',                    tokens.ring)
  el.style.setProperty('--radius',                  tokens.radius)
  el.style.setProperty('--chart-1',                 tokens.chart1)
  el.style.setProperty('--chart-2',                 tokens.chart2)
  el.style.setProperty('--chart-3',                 tokens.chart3)
  el.style.setProperty('--chart-4',                 tokens.chart4)
  el.style.setProperty('--chart-5',                 tokens.chart5)

  // Sidebar — injected identically for both modes (sidebar constant rule)
  el.style.setProperty('--sidebar',                       tokens.sidebarBackground)
  el.style.setProperty('--sidebar-foreground',            tokens.sidebarForeground)
  el.style.setProperty('--sidebar-primary',               tokens.sidebarPrimary)
  el.style.setProperty('--sidebar-primary-foreground',    tokens.sidebarPrimaryForeground)
  el.style.setProperty('--sidebar-accent',                tokens.sidebarAccent)
  el.style.setProperty('--sidebar-accent-foreground',     tokens.sidebarAccentForeground)
  el.style.setProperty('--sidebar-border',                tokens.sidebarBorder)
}

export function LeaseGovThemeProvider({
  children,
  themeKey = DEFAULT_THEME,
  tenantColorModeDefault = DEFAULT_COLOR_MODE,
  allowUserModeToggle = true,
  userColorModePreference = null,
}: LeaseGovThemeProviderProps) {
  const { resolvedMode, rawMode, setMode, canToggle } = useColorMode({
    tenantDefault:   tenantColorModeDefault,
    allowUserToggle: allowUserModeToggle,
    userPreference:  userColorModePreference,
  })

  const tokens = useMemo(() => {
    return THEMES[themeKey][resolvedMode]
  }, [themeKey, resolvedMode])

  // Inject CSS custom properties and .dark class on every token change
  useEffect(() => {
    injectTokens(tokens)
    if (resolvedMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [tokens, resolvedMode])

  const contextValue = useMemo(() => ({
    themeKey,
    resolvedMode,
    rawMode,
    setMode,
    canToggle,
  }), [themeKey, resolvedMode, rawMode, setMode, canToggle])

  return (
    <LeaseGovThemeContext.Provider value={contextValue}>
      {children}
    </LeaseGovThemeContext.Provider>
  )
}
