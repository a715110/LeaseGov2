/**
 * DoDesk MVP — Role Context
 *
 * Manages the currently active user role for the multi-tab demo.
 * Each browser tab independently selects and stores its own role using
 * sessionStorage — which is scoped to the individual tab/session and
 * is NOT shared across tabs (unlike localStorage).
 *
 * This means:
 *  - Tab 1 can be Document Submitter
 *  - Tab 2 can be Preparer
 *  - Tab 3 can be Reviewer
 * ...all simultaneously without interfering with each other.
 *
 * The cross-tab event bus (eventBus.ts) still uses localStorage for
 * workflow events (BATCH_SUBMITTED, SUBMIT_FOR_REVIEW, etc.) so that
 * actions in one tab are visible to other tabs — that part is intentional.
 *
 * PRODUCTION UPGRADE PATH:
 * Replace sessionStorage role selection with JWT token decoding:
 *   const role = decodeJwt(token).role as UserRole;
 * The role-based visibility logic in components remains unchanged.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/types';

// sessionStorage is tab-isolated — each tab keeps its own role independently
const ROLE_STORAGE_KEY = 'dodesk_active_role';

interface RoleContextValue {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  roleLabel: string;
  roleColor: string;
  /** Check if the current role has access to a feature */
  hasAccess: (allowedRoles: UserRole[]) => boolean;
  /** Check if the current role has edit access (not read-only) */
  canEdit: (editRoles: UserRole[], readOnlyRoles?: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    // sessionStorage is scoped to this tab only — other tabs are unaffected
    const stored = sessionStorage.getItem(ROLE_STORAGE_KEY);
    return (stored as UserRole) || 'DOCUMENT_SUBMITTER';
  });

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    // Store in sessionStorage (tab-isolated) — NOT localStorage
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  // NOTE: No cross-tab storage sync for role — each tab manages its own role
  // independently. The workflow event bus (eventBus.ts) still uses localStorage
  // for cross-tab workflow events (batch submissions, review handoffs, etc.).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { /* intentionally empty — role is tab-local */ }, []);

  const hasAccess = (allowedRoles: UserRole[]) => allowedRoles.includes(activeRole);

  const canEdit = (editRoles: UserRole[], readOnlyRoles: UserRole[] = []) => {
    if (editRoles.includes(activeRole)) return true;
    if (readOnlyRoles.includes(activeRole)) return false;
    return false;
  };

  return (
    <RoleContext.Provider value={{
      activeRole,
      setActiveRole,
      roleLabel: ROLE_LABELS[activeRole],
      roleColor: ROLE_COLORS[activeRole],
      hasAccess,
      canEdit,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export { ROLE_LABELS, ROLE_COLORS };
