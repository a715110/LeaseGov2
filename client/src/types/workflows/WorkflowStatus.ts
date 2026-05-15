/**
 * Workflow status type and display metadata.
 */
export type WorkflowStatus =
  | 'not_started'
  | 'active'
  | 'paused'
  | 'awaiting_human'
  | 'completed'
  | 'failed'
  | 'cancelled'

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  not_started:    'Not Started',
  active:         'Active',
  paused:         'Paused',
  awaiting_human: 'Awaiting Human',
  completed:      'Completed',
  failed:         'Failed',
  cancelled:      'Cancelled',
}
