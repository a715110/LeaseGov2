/**
 * LeaseGov — Demo-layer type re-exports
 *
 * UserRole, ROLE_LABELS, and ROLE_COLORS are defined once in
 * @/types/shared/UserRole and re-exported here so that the demo layer
 * (RoleContext, DemoModeContext, eventBus) can import from the familiar
 * @/lib/types path without duplicating definitions.
 *
 * DemoEvent and DemoEventType are defined here because they are
 * demo-layer-only constructs with no platform equivalent.
 */

export type { UserRole } from '@/types/shared/UserRole';
export { ROLE_LABELS, ROLE_COLORS } from '@/types/shared/UserRole';

// ─── Demo Event Bus Types ─────────────────────────────────────────────────────

export type DemoEventType =
  | 'BATCH_SUBMITTED'
  | 'PIPELINE_BATCH_CLEARED'
  | 'EXTRACTION_COMPLETE'
  | 'SUBMIT_FOR_REVIEW'
  | 'APPROVE_FOR_FINAL'
  | 'RECORD_APPROVED'
  | 'DECLINE_SUBMITTED'
  | 'UPLOAD_TASK_STARTED'
  | 'UPLOAD_TASK_COMPLETED'
  | 'DEMO_RESET';

import type { UserRole } from '@/types/shared/UserRole';

export interface DemoEvent {
  type: DemoEventType;
  payload: Record<string, unknown>;
  sourceRole: UserRole;
  timestamp: string;
}
