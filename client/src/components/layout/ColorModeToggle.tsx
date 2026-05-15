/**
 * ColorModeToggle — three-state toggle: Light / System / Dark.
 *
 * NEW IN V4.
 *
 * Renders nothing if the tenant has disabled the user mode toggle
 * (canToggle === false from LeaseGovThemeContext).
 *
 * Design: compact segmented control with icon+label for each state.
 * Follows the Structured Authority design philosophy — minimal, precise.
 */
import React, { useContext } from 'react'
import { Sun, Monitor, Moon } from 'lucide-react'
import { LeaseGovThemeContext } from '../../contexts/LeaseGovThemeContext'
import type { ColorMode } from '../../types/shared/ThemeMode'

const MODES: Array<{ value: ColorMode; icon: React.ElementType; label: string }> = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
]

export function ColorModeToggle() {
  const ctx = useContext(LeaseGovThemeContext)

  // Render nothing if tenant disables toggle or context is not available
  if (!ctx || !ctx.canToggle) return null

  const { rawMode, setMode } = ctx

  return (
    <div
      role="group"
      aria-label="Color mode"
      className="inline-flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5"
    >
      {MODES.map(({ value, icon: Icon, label }) => {
        const isActive = rawMode === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${label} mode`}
            onClick={() => setMode(value)}
            className={[
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all duration-150',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
