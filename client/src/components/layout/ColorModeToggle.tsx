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

interface ModeConfig {
  value: ColorMode
  icon: React.ElementType
  label: string
  activeClass: string
  activeIconClass: string
  activeStyle?: React.CSSProperties
}

const MODES: ModeConfig[] = [
  {
    value: 'light',
    icon: Sun,
    label: 'Light',
    activeClass: 'bg-white text-amber-600 shadow-sm border border-amber-200/60',
    activeIconClass: 'text-amber-500',
  },
  {
    value: 'system',
    icon: Monitor,
    label: 'System',
    activeClass: 'text-slate-600 shadow-sm border border-slate-300/50',
    activeIconClass: 'text-slate-500',
    activeStyle: { background: 'linear-gradient(135deg, #f8fafc 50%, #1e293b 50%)' },
  },
  {
    value: 'dark',
    icon: Moon,
    label: 'Dark',
    activeClass: 'bg-slate-800 text-indigo-300 shadow-sm border border-slate-600/60',
    activeIconClass: 'text-indigo-400',
  },
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
      {MODES.map(({ value, icon: Icon, label, activeClass, activeIconClass, activeStyle }) => {
        const isActive = rawMode === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${label} mode`}
            onClick={() => setMode(value)}
            style={isActive ? activeStyle : undefined}
            className={[
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-all duration-150',
              isActive
                ? activeClass
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon
              className={['h-3.5 w-3.5', isActive ? activeIconClass : ''].join(' ')}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
