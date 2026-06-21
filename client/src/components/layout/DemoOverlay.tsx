/**
 * DemoOverlay — floating guided demo tour panel.
 *
 * Design philosophy: Structured Authority
 * - Anchored bottom-right, 320px wide
 * - Deep navy accent matching sidebar palette
 * - Animated entrance: scale(0.95) + opacity 0 → scale(1) + opacity 1 (200ms ease-out)
 * - Dismissible via Close (X) button; re-opens cleanly when startDemo() is called again
 * - Step-list drawer: toggle via "All Steps" button in header; shows checkmarks + jump-to-step
 * - Shows: role badge, step counter, title, description, instruction, Back/Next/Reset
 *
 * Reads from DemoModeContext — minimal local state (animation + drawer only).
 * Navigation (Back/Next) is role-scoped; does not cross role boundaries.
 * The "Start Demo" trigger button lives in AppShell sidebar, not here.
 */
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import {
  X, ChevronLeft, ChevronRight, RotateCcw,
  List, CheckCircle2, Circle, Play,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDemoMode, globalIndexForRole, DEMO_STEPS } from '../../contexts/DemoModeContext'
import { useRole } from '../../contexts/RoleContext'
import { ROLE_LABELS, ROLE_COLORS } from '../../lib/types'
import type { UserRole } from '../../lib/types'

// ─── Role colour helper ───────────────────────────────────────────────────────
function RolePill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff' }}
    >
      {label}
    </span>
  )
}

// ─── Step progress bar ────────────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${pct}%`, background: 'var(--color-lg-blue)' }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DemoOverlay() {
  const {
    isActive,
    currentStep,
    totalSteps,
    roleSteps,
    roleLocalIndex,
    nextStep,
    prevStep,
    resetDemo,
    endDemo,
    goToStep,
    progress,
  } = useDemoMode()

  const [, navigate] = useLocation()
  const { setActiveRole } = useRole()

  // ── Animation state ──────────────────────────────────────────────────────
  const [shown, setShown] = useState(false)
  const [visible, setVisible] = useState(false)

  // `userDismissed` resets when isActive flips false → true (new startDemo call)
  const [userDismissed, setUserDismissed] = useState(false)
  const prevIsActive = useRef(false)

  // ── Drawer state ─────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const wasActive = prevIsActive.current
    prevIsActive.current = isActive

    if (isActive && !wasActive) {
      setUserDismissed(false)
      setDrawerOpen(false)
    }
  }, [isActive])

  // Mount / unmount the panel with animation
  useEffect(() => {
    const shouldShow = isActive && !userDismissed

    if (shouldShow) {
      setShown(true)
      const t = setTimeout(() => setVisible(true), 20)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setShown(false), 220)
      return () => clearTimeout(t)
    }
  }, [isActive, userDismissed])

  // Navigate to the current step's route whenever the step changes
  useEffect(() => {
    if (isActive && currentStep?.route) {
      navigate(currentStep.route)
    }
  }, [isActive, currentStep?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null

  const isFirstStep = roleLocalIndex === 0
  const isLastStep = roleLocalIndex === totalSteps - 1
  const activeRole = currentStep?.role

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Demo tour"
      className={cn(
        'fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl',
        'flex flex-col transition-all duration-200',
        visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}
      style={{ transformOrigin: 'bottom right', maxHeight: 'calc(100vh - 3rem)' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--sidebar)', borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#ffffff' }}
          >
            Demo Tour
          </span>
          {currentStep && (
            <RolePill label={currentStep.roleLabel} color={currentStep.roleColor} />
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* All Steps toggle */}
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded transition-colors',
              drawerOpen ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            style={{ color: '#ffffff', opacity: 1 }}
            aria-label={drawerOpen ? 'Hide step list' : 'Show all steps'}
            title={drawerOpen ? 'Hide step list' : 'View all steps'}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          {/* Close */}
          <button
            onClick={() => {
              setUserDismissed(true)
              endDemo()
            }}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/10"
            style={{ color: '#ffffff', opacity: 1 }}
            aria-label="Close demo tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Step counter + progress */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            Step {roleLocalIndex + 1} of {totalSteps}
          </span>
          {currentStep?.screenNumber && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              #{currentStep.screenNumber}
            </span>
          )}
        </div>
        <StepProgress current={roleLocalIndex} total={totalSteps} />
      </div>

      {/* Step-list drawer — replaces content when open */}
      {drawerOpen ? (
        <div className="flex flex-col flex-1 overflow-hidden">
        {/* Role switcher row */}
        <div className="flex-shrink-0 flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-border bg-muted/30">
          {(Object.keys(ROLE_LABELS) as UserRole[]).filter(r => DEMO_STEPS.some(s => s.role === r)).map(r => {
            const isActive = r === activeRole
            return (
              <button
                key={r}
                onClick={() => {
                  setActiveRole(r)
                  const firstGlobal = globalIndexForRole(r, 0)
                  if (firstGlobal >= 0) goToStep(firstGlobal)
                }}
                className={cn(
                  'flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-150',
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground bg-transparent hover:bg-accent'
                )}
                style={isActive ? { background: ROLE_COLORS[r] } : {}}
              >
                {ROLE_LABELS[r]}
              </button>
            )
          })}
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-border">
          {roleSteps.map((step, i) => {
            const isCompleted = i < roleLocalIndex
            const isCurrent = i === roleLocalIndex
            const globalIdx = activeRole ? globalIndexForRole(activeRole, i) : -1

            return (
              <li key={step.id}>
                <button
                  onClick={() => {
                    if (globalIdx >= 0) {
                      goToStep(globalIdx)
                      setDrawerOpen(false)
                    }
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors',
                    isCurrent
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  )}
                >
                  {/* Status icon */}
                  <span className="mt-0.5 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--color-lg-success, #059669)' }}
                      />
                    ) : isCurrent ? (
                      <Play
                        className="h-3.5 w-3.5 fill-current"
                        style={{ color: step.roleColor }}
                      />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                  </span>

                  {/* Step label */}
                  <span className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'block text-[11px] font-medium leading-snug truncate',
                        isCompleted
                          ? 'text-muted-foreground line-through'
                          : isCurrent
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    {step.screenNumber && (
                      <span className="text-[10px] font-mono text-muted-foreground/50">
                        #{step.screenNumber}
                      </span>
                    )}
                  </span>

                  {/* Step number */}
                  <span className="flex-shrink-0 text-[10px] text-muted-foreground/40 tabular-nums">
                    {i + 1}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        </div>
      ) : (
        /* Content — scrollable so footer is always visible */
        currentStep && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>

            {/* Instruction callout */}
            <div
              className="rounded-md border-l-2 px-3 py-2 text-xs leading-relaxed"
              style={{
                borderColor: currentStep.roleColor,
                background: `${currentStep.roleColor}11`,
                color: 'var(--foreground)',
              }}
            >
              <span className="font-semibold" style={{ color: currentStep.roleColor }}>
                Action:{' '}
              </span>
              {currentStep.instruction}
            </div>

            {/* Handoff notice */}
            {currentStep.isHandoff && currentStep.handoffLabel && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
                <span className="font-semibold">Handoff: </span>
                {currentStep.handoffLabel}
              </div>
            )}

            {/* Tab hint */}
            {currentStep.tabHint && (
              <p className="text-[10px] text-muted-foreground/60 italic">
                {currentStep.tabHint}
              </p>
            )}
          </div>
        )
      )}

      {/* Footer actions — always pinned to bottom */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        {/* Reset */}
        <button
          onClick={resetDemo}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Reset demo"
          title="Reset demo to beginning"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>

        {/* Back / Next */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95',
              isFirstStep
                ? 'cursor-not-allowed text-muted-foreground/40'
                : 'text-foreground hover:bg-accent'
            )}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            onClick={isLastStep ? endDemo : nextStep}
            className={cn(
              'flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95',
              isLastStep
                ? 'bg-[var(--color-lg-success,#059669)] text-white hover:brightness-110'
                : 'bg-[var(--color-lg-blue)] text-white hover:brightness-110'
            )}
            aria-label={isLastStep ? 'End demo tour' : 'Next step'}
          >
            {isLastStep ? 'Done ✓' : 'Next'}
            {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Overall progress bar (full width, bottom edge) */}
      <div className="flex-shrink-0 h-0.5 w-full bg-border">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%`, background: 'var(--color-lg-blue)' }}
        />
      </div>
    </div>
  )
}
