/**
 * Notification Agent — frontend representation.
 *
 * Dispatches notifications for workflow events, deadlines, and exceptions.
 *
 * // TODO: Backend integration required
 */
export const NOTIFICATION_AGENT_NAME = 'NotificationAgent'
export const NOTIFICATION_AGENT_LABEL = 'Notification Agent'

export const NOTIFICATION_TRIGGER_TYPES = [
  'checkpoint_ready',
  'exception_raised',
  'deadline_approaching',
  'workflow_completed',
  'workflow_failed',
  'survey_dispatched',
  'approval_required',
] as const

export type NotificationTriggerType = typeof NOTIFICATION_TRIGGER_TYPES[number]

export const NOTIFICATION_TRIGGER_LABELS: Record<NotificationTriggerType, string> = {
  checkpoint_ready:    'Checkpoint Ready for Review',
  exception_raised:    'Agent Exception Raised',
  deadline_approaching:'Deadline Approaching',
  workflow_completed:  'Workflow Completed',
  workflow_failed:     'Workflow Failed',
  survey_dispatched:   'Survey Dispatched',
  approval_required:   'Approval Required',
}
