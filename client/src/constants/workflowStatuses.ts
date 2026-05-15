/**
 * Workflow status constants and display metadata.
 */
export const WORKFLOW_STATUSES = [
  'not_started',
  'active',
  'paused',
  'awaiting_human',
  'completed',
  'failed',
  'cancelled',
] as const

export type WorkflowStatusConst = typeof WORKFLOW_STATUSES[number]

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatusConst, string> = {
  not_started:    'Not Started',
  active:         'Active',
  paused:         'Paused',
  awaiting_human: 'Awaiting Human',
  completed:      'Completed',
  failed:         'Failed',
  cancelled:      'Cancelled',
}

export const WORKFLOW_STATUS_BADGE_VARIANTS: Record<WorkflowStatusConst, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  not_started:    'outline',
  active:         'default',
  paused:         'secondary',
  awaiting_human: 'secondary',
  completed:      'default',
  failed:         'destructive',
  cancelled:      'outline',
}
