/**
 * useBackPath — derives the "parent" navigation target from the current route,
 * using the same breadcrumb config as Breadcrumb.tsx.
 *
 * Returns null when the current route is a root/top-level page (no parent crumb),
 * or a string href when the current page has a logical parent to navigate back to.
 *
 * This is the single source of truth for the back arrow in AppShell and any
 * page-level back button — both always resolve to the same destination.
 */

import { useLocation } from 'wouter';

// ─── Parameterised route patterns (mirrors Breadcrumb.tsx) ───────────────────
// Each entry maps a dynamic route pattern to its parent href.
const PARAM_BACK_PATHS: Array<{ pattern: RegExp; parentHref: string }> = [
  // Packages sub-routes
  { pattern: /^\/packages\/[^/]+\/flags$/,       parentHref: '/packages' },
  { pattern: /^\/packages\/[^/]+\/reassembly$/,  parentHref: '/packages' },
  { pattern: /^\/packages\/[^/]+$/,              parentHref: '/packages' },
  // Approvals detail routes
  { pattern: /^\/approvals\/review\/[^/]+$/,     parentHref: '/approvals/queue' },
  { pattern: /^\/approvals\/final\/[^/]+$/,      parentHref: '/approvals/queue' },
  // Records detail routes
  { pattern: /^\/records\/[^/]+\/add-document$/, parentHref: '/records' },
  { pattern: /^\/records\/[^/]+\/correction$/,   parentHref: '/records' },
  { pattern: /^\/records\/[^/]+\/snapshots$/,    parentHref: '/records' },
  { pattern: /^\/records\/[^/]+\/deferred$/,     parentHref: '/records' },
  { pattern: /^\/records\/[^/]+$/,               parentHref: '/records' },
  // Reassessment case detail routes
  { pattern: /^\/reassessment\/cases\/[^/]+\/assessment$/,  parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+\/analysis$/,    parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+\/memo$/,        parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+\/package$/,     parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+\/remediation$/, parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+\/classify$/,    parentHref: '/reassessment/cases' },
  { pattern: /^\/reassessment\/cases\/[^/]+$/,              parentHref: '/reassessment/cases' },
];

// ─── Static sub-route back paths ─────────────────────────────────────────────
// Maps a static route prefix to its parent href.
// Ordered most-specific first.
const STATIC_BACK_PATHS: Array<{ prefix: string; parentHref: string }> = [
  // Pipeline sub-pages → Pipeline
  { prefix: '/pipeline/upload',           parentHref: '/pipeline' },
  { prefix: '/pipeline/review',           parentHref: '/pipeline' },
  { prefix: '/pipeline/validation',       parentHref: '/pipeline' },
  // Extraction sub-pages → Extraction
  { prefix: '/extraction/understanding',  parentHref: '/extraction' },
  { prefix: '/extraction/strategy',       parentHref: '/extraction' },
  { prefix: '/extraction/workspace',      parentHref: '/extraction' },
  { prefix: '/extraction/manual',         parentHref: '/extraction' },
  { prefix: '/extraction/verification',   parentHref: '/extraction' },
  { prefix: '/extraction/tracker',        parentHref: '/extraction' },
  { prefix: '/extraction/reprocessing',   parentHref: '/extraction' },
  // Records sub-pages → Records
  { prefix: '/records/dashboard',         parentHref: '/records' },
  { prefix: '/records/deferred',          parentHref: '/records' },
  { prefix: '/records/snapshots',         parentHref: '/records' },
  { prefix: '/records/correction',        parentHref: '/records' },
  // Approvals sub-pages → Approvals queue
  { prefix: '/approvals/checkpoints',     parentHref: '/approvals/queue' },
  { prefix: '/approvals/review',          parentHref: '/approvals/queue' },
  { prefix: '/approvals/final',           parentHref: '/approvals/queue' },
  { prefix: '/approvals/approver',        parentHref: '/approvals/queue' },
  { prefix: '/approvals/recall',          parentHref: '/approvals/queue' },
  { prefix: '/approvals/rework',          parentHref: '/approvals/queue' },
  { prefix: '/approvals/history',         parentHref: '/approvals/queue' },
  // Export sub-pages → Export templates
  { prefix: '/export/staging',            parentHref: '/export/templates' },
  { prefix: '/export/preflight',          parentHref: '/export/templates' },
  { prefix: '/export/tasks',              parentHref: '/export/templates' },
  // Reassessment sub-pages → Reassessment dashboard
  { prefix: '/reassessment/sweep',        parentHref: '/reassessment' },
  { prefix: '/reassessment/cases',        parentHref: '/reassessment' },
  { prefix: '/reassessment/watchlist',    parentHref: '/reassessment' },
  { prefix: '/reassessment/survey',       parentHref: '/reassessment' },
  { prefix: '/reassessment/projects',     parentHref: '/reassessment' },
  // Onboarding sub-pages → Onboarding start
  { prefix: '/onboarding/admin-user',     parentHref: '/onboarding/organization' },
  { prefix: '/onboarding/theme-automation', parentHref: '/onboarding/organization' },
  { prefix: '/onboarding/workflow-templates', parentHref: '/onboarding/organization' },
  { prefix: '/onboarding/complete',       parentHref: '/onboarding/organization' },
  // Agents sub-pages → Agents
  { prefix: '/agents/monitor',            parentHref: '/agents' },
  // Admin sub-pages → Admin
  { prefix: '/admin/templates',           parentHref: '/admin' },
  { prefix: '/admin/schema',              parentHref: '/admin' },
  { prefix: '/admin/users',               parentHref: '/admin' },
  { prefix: '/admin/automation',          parentHref: '/admin' },
  { prefix: '/admin/thresholds',          parentHref: '/admin' },
  { prefix: '/admin/audit',               parentHref: '/admin' },
  { prefix: '/admin/notifications',       parentHref: '/admin' },
];

/**
 * Returns the href of the logical parent page for the current route,
 * or null if the current page is a top-level root with no parent.
 */
export function useBackPath(): string | null {
  const [location] = useLocation();
  const pathname = location.split('?')[0];

  // 1. Check parameterised patterns first (dynamic :id segments)
  for (const { pattern, parentHref } of PARAM_BACK_PATHS) {
    if (pattern.test(pathname)) return parentHref;
  }

  // 2. Check static sub-route prefixes
  for (const { prefix, parentHref } of STATIC_BACK_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return parentHref;
    }
  }

  // 3. No parent — this is a root page
  return null;
}
