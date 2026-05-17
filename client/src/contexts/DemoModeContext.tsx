/**
 * DemoModeContext.tsx — React context + provider for the guided demo tour.
 *
 * Pure data (DemoStep type, DEMO_STEPS array, getStepsForRole, globalIndexForRole)
 * lives in ./demoSteps.ts so that Vite can fast-refresh this file without the
 * "incompatible export" HMR warning that occurs when a context file exports both
 * a React component and plain constants.
 *
 * Step coverage (v2 — updated to reflect current inline-dialog workflow):
 *   Document Submitter  : steps 1–4   (unchanged)
 *   Preparer           : steps 5–12  (expanded: Processing Workflow dialog, Extractions Table, Flag Panel)
 *   Reviewer           : steps 13–16 (updated: /approvals/queue + ReviewDialog421 inline)
 *   Approver           : steps 17–18 (updated routes)
 *   Accountant         : steps 19–20 (unchanged)
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { UserRole } from '@/lib/types';
import { clearEventHistory, publishEvent, subscribeToEvents } from '@/lib/eventBus';

// Re-export everything from demoSteps so callers can import from one place
export type { DemoStep } from './demoSteps';
export { DEMO_STEPS, getStepsForRole, globalIndexForRole } from './demoSteps';

import { DEMO_STEPS, getStepsForRole, globalIndexForRole } from './demoSteps';
import type { DemoStep } from './demoSteps';

interface DemoModeContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: DemoStep | null;
  /** Steps filtered to the active role in this tab */
  totalSteps: number;
  roleSteps: DemoStep[];
  /** Index within the role-scoped steps (for progress display) */
  roleLocalIndex: number;
  startDemo: () => void;
  endDemo: () => void;
  resetDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (globalIndex: number) => void;
  progress: number;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({
  children,
  activeRole: activeRoleProp,
}: {
  children: React.ReactNode;
  activeRole?: UserRole;
}) {
  // ── Persistence keys (tab-isolated via sessionStorage) ─────────────────
  const STEP_KEY = 'dodesk_demo_step';
  const ACTIVE_KEY = 'dodesk_demo_active';

  const [isActive, setIsActive] = useState<boolean>(() => {
    try { return sessionStorage.getItem(ACTIVE_KEY) === 'true'; } catch { return false; }
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem(STEP_KEY);
      const n = stored !== null ? parseInt(stored, 10) : NaN;
      return !isNaN(n) && n >= 0 && n < DEMO_STEPS.length ? n : 0;
    } catch { return 0; }
  });

  // Sync isActive to sessionStorage whenever it changes
  useEffect(() => {
    try { sessionStorage.setItem(ACTIVE_KEY, String(isActive)); } catch { /* ignore */ }
  }, [isActive]);

  // Sync currentStepIndex to sessionStorage whenever it changes
  useEffect(() => {
    try { sessionStorage.setItem(STEP_KEY, String(currentStepIndex)); } catch { /* ignore */ }
  }, [currentStepIndex]);

  // Prefer the prop (from RoleContext) over sessionStorage fallback.
  // sessionStorage fallback is kept for cases where DemoModeProvider is used
  // outside of a RoleProvider (e.g. tests).
  const getActiveRole = useCallback((): UserRole => {
    if (activeRoleProp) return activeRoleProp;
    try {
      const stored = sessionStorage.getItem('dodesk_active_role');
      return (stored as UserRole) || 'document_submitter';
    } catch {
      return 'document_submitter';
    }
  }, [activeRoleProp]);

  // Role steps depend only on the active role, not on isActive.
  // Recomputing on isActive change was causing step resets mid-session.
  const roleSteps = useMemo(() => getStepsForRole(getActiveRole()), [getActiveRole]);

  const startDemo = useCallback(() => {
    const role = getActiveRole();
    const firstGlobal = globalIndexForRole(role, 0);
    setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
    setIsActive(true);
  }, [getActiveRole]);

  const endDemo = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    // Clear persisted state so a closed demo doesn't re-open on next page load
    try {
      sessionStorage.removeItem(ACTIVE_KEY);
      sessionStorage.removeItem(STEP_KEY);
    } catch { /* ignore */ }
  }, [ACTIVE_KEY, STEP_KEY]);

  const resetDemo = useCallback(() => {
    // 1. Clear all cross-tab event history from localStorage
    clearEventHistory();
    // 2. Broadcast DEMO_RESET so every open tab resets to its role's starting screen
    publishEvent({ type: 'DEMO_RESET', payload: {}, sourceRole: getActiveRole() });
    // 3. Reset this tab's step to the first step for its role
    const role = getActiveRole();
    const firstGlobal = globalIndexForRole(role, 0);
    setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
  }, [getActiveRole]);

  // Listen for DEMO_RESET broadcast from other tabs
  useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
      if (event.type === 'DEMO_RESET') {
        const role = getActiveRole();
        const firstGlobal = globalIndexForRole(role, 0);
        setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
      }
    }, ['DEMO_RESET']);
    return unsubscribe;
  }, [getActiveRole]);

  const nextStep = useCallback(() => {
    const role = getActiveRole();
    const steps = getStepsForRole(role);
    const localIdx = steps.findIndex(s => s.id === DEMO_STEPS[currentStepIndex]?.id);
    const nextLocal = localIdx + 1;
    if (nextLocal < steps.length) {
      const nextGlobal = globalIndexForRole(role, nextLocal);
      if (nextGlobal >= 0) setCurrentStepIndex(nextGlobal);
    }
    // If already at last step for this role, do nothing (no cross-role navigation)
  }, [currentStepIndex, getActiveRole]);

  const prevStep = useCallback(() => {
    const role = getActiveRole();
    const steps = getStepsForRole(role);
    const localIdx = steps.findIndex(s => s.id === DEMO_STEPS[currentStepIndex]?.id);
    const prevLocal = localIdx - 1;
    if (prevLocal >= 0) {
      const prevGlobal = globalIndexForRole(role, prevLocal);
      if (prevGlobal >= 0) setCurrentStepIndex(prevGlobal);
    }
    // If already at first step for this role, do nothing (no cross-role navigation)
  }, [currentStepIndex, getActiveRole]);

  const goToStep = useCallback((idx: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(idx, DEMO_STEPS.length - 1)));
  }, []);

  const currentStep = isActive ? DEMO_STEPS[currentStepIndex] ?? null : null;

  const roleLocalIndex = useMemo(() => {
    if (!currentStep) return 0;
    const idx = roleSteps.findIndex(s => s.id === currentStep.id);
    return idx >= 0 ? idx : 0;
  }, [currentStep, roleSteps]);

  // Progress is scoped to this role's own steps only
  const progress = roleSteps.length > 0
    ? ((roleLocalIndex + 1) / roleSteps.length) * 100
    : 0;

  return (
    <DemoModeContext.Provider value={{
      isActive,
      currentStepIndex,
      currentStep,
      totalSteps: roleSteps.length,
      roleSteps,
      roleLocalIndex,
      startDemo,
      endDemo,
      resetDemo,
      nextStep,
      prevStep,
      goToStep,
      progress,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}
