/**
 * useRoleLabel — role-aware label resolution hook
 *
 * Returns a function `getLabel(key)` that resolves the correct display label
 * for a given route path or section key based on the active demo role.
 *
 * The label map mirrors NAV_ITEM_ROLE_LABELS in AppShell and NAV_GROUPS
 * roleLabels in navigationConfig so that page titles, breadcrumbs, and nav
 * items are always consistent.
 */
import { useRole } from '@/contexts/RoleContext'

/** Map of route path or section key → role → label */
const ROLE_LABEL_MAP: Record<string, Partial<Record<string, string>>> = {
  // ── Approvals / Reviews ──────────────────────────────────────────────────
  '/approvals/queue': {
    reviewer: 'Review Queue',
    approver: 'Approval Queue',
    auditor:  'Audit Queue',
  },
  '/approvals': {
    reviewer: 'Reviews',
    approver: 'Approvals',
    auditor:  'Audit Reviews',
  },

  // ── Records ──────────────────────────────────────────────────────────────
  '/records': {
    accountant: 'Lease Ledger',
    controller: 'Financial Records',
    auditor:    'Audit Records',
  },
  '/records/dashboard': {
    accountant: 'Ledger Dashboard',
    controller: 'Portfolio Dashboard',
    auditor:    'Audit Dashboard',
  },

  // ── Packages ─────────────────────────────────────────────────────────────
  '/packages': {
    reviewer: 'Contract Packages',
    approver: 'Packages for Approval',
  },

  // ── Export ───────────────────────────────────────────────────────────────
  '/export/templates': {
    controller: 'Export & Reporting',
    auditor:    'Export & Audit',
  },
  '/export': {
    controller: 'Export & Reporting',
    auditor:    'Export & Audit',
  },

  // ── Reassessment ─────────────────────────────────────────────────────────
  '/reassessment': {
    accountant: 'Lease Reassessment',
    controller: 'Portfolio Review',
    auditor:    'Reassessment Audit',
  },
  '/reassessment/dashboard': {
    accountant: 'Reassessment Overview',
    controller: 'Portfolio Review',
    auditor:    'Audit Overview',
  },
  '/reassessment/cases': {
    accountant: 'Reassessment Cases',
    controller: 'Review Cases',
    auditor:    'Audit Cases',
  },
}

/**
 * Returns a `getLabel(key, fallback?)` function.
 *
 * @param key     - A route path (e.g. '/records') or section key
 * @param fallback - Returned when no role-specific override exists
 */
export function useRoleLabel() {
  const { activeRole } = useRole()

  function getLabel(key: string, fallback?: string): string {
    const override = ROLE_LABEL_MAP[key]?.[activeRole]
    if (override) return override
    return fallback ?? key
  }

  return { getLabel, activeRole }
}
