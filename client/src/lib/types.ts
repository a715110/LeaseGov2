/**
 * LeaseGov — Shared lib types
 *
 * This file provides the UserRole union, ROLE_LABELS, ROLE_COLORS, DemoEvent,
 * and DemoEventType definitions consumed by:
 *   - RoleContext.tsx
 *   - DemoModeContext.tsx
 *   - eventBus.ts
 *
 * Role values use SCREAMING_SNAKE_CASE to match the demo context files.
 * The authoritative platform UserRole type (lowercase) lives in
 * types/shared/UserRole.ts — this file is the demo-layer alias.
 */

// ─── User Roles ──────────────────────────────────────────────────────────────

export type UserRole =
  | 'DOCUMENT_SUBMITTER'
  | 'PREPARER'
  | 'REVIEWER'
  | 'APPROVER'
  | 'ACCOUNTANT'
  | 'CONTROLLER'
  | 'BUSINESS_SUBMITTER'
  | 'AUDITOR'
  | 'LEASE_ADMIN'
  | 'SUPERADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  DOCUMENT_SUBMITTER: 'Document Submitter',
  PREPARER:           'Preparer',
  REVIEWER:           'Reviewer',
  APPROVER:           'Approver',
  ACCOUNTANT:         'Accountant',
  CONTROLLER:         'Controller',
  BUSINESS_SUBMITTER: 'Business Submitter',
  AUDITOR:            'Auditor',
  LEASE_ADMIN:        'Lease Admin',
  SUPERADMIN:         'SuperAdmin',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  DOCUMENT_SUBMITTER: '#64748b',
  PREPARER:           '#2563eb',
  REVIEWER:           '#7c3aed',
  APPROVER:           '#d97706',
  ACCOUNTANT:         '#059669',
  CONTROLLER:         '#dc2626',
  BUSINESS_SUBMITTER: '#ec4899',
  AUDITOR:            '#6b7280',
  LEASE_ADMIN:        '#1F3864',
  SUPERADMIN:         '#0f172a',
};

// ─── Demo Event Bus Types ─────────────────────────────────────────────────────

export type DemoEventType =
  | 'BATCH_SUBMITTED'
  | 'EXTRACTION_COMPLETE'
  | 'SUBMIT_FOR_REVIEW'
  | 'APPROVE_FOR_FINAL'
  | 'RECORD_APPROVED'
  | 'DEMO_RESET';

export interface DemoEvent {
  type: DemoEventType;
  payload: Record<string, unknown>;
  sourceRole: UserRole;
  timestamp: string;
}
