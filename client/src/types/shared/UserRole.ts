/**
 * User roles in the LeaseGov platform — single source of truth.
 *
 * CASING: lowercase snake_case — authoritative for all layers:
 *   services/, hooks/, ScreenGate, screenRegistryService, AuthorizationError,
 *   RoleContext, DemoModeContext, eventBus.
 *
 * lib/types.ts re-exports UserRole, ROLE_LABELS, and ROLE_COLORS from here
 * so that the demo layer shares the same definitions without duplication.
 */

export type UserRole =
  | 'document_submitter'
  | 'preparer'
  | 'reviewer'
  | 'approver'
  | 'accountant'
  | 'controller'
  | 'business_submitter'
  | 'auditor'
  | 'lease_admin';

/** Human-readable label for each role. */
export const ROLE_LABELS: Record<UserRole, string> = {
  document_submitter: 'Document Submitter',
  preparer:           'Preparer',
  reviewer:           'Reviewer',
  approver:           'Approver',
  accountant:         'Accountant',
  controller:         'Controller',
  business_submitter: 'Business Submitter',
  auditor:            'Auditor',
  lease_admin:        'Lease Admin',
};

/** Accent colour for each role — used by the demo role switcher and event bus. */
export const ROLE_COLORS: Record<UserRole, string> = {
  document_submitter: '#64748b',
  preparer:           '#2563eb',
  reviewer:           '#7c3aed',
  approver:           '#d97706',
  accountant:         '#059669',
  controller:         '#dc2626',
  business_submitter: '#ec4899',
  auditor:            '#6b7280',
  lease_admin:        '#1F3864',
};

/** @deprecated Use ROLE_LABELS instead. Kept for backward compatibility. */
export const USER_ROLE_LABELS = ROLE_LABELS;
