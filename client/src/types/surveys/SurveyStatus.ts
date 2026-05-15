/**
 * Survey status constants and display metadata.
 */
export type SurveyStatusValue = 'draft' | 'active' | 'closed' | 'archived'

export const SURVEY_STATUS_LABELS: Record<SurveyStatusValue, string> = {
  draft:    'Draft',
  active:   'Active',
  closed:   'Closed',
  archived: 'Archived',
}
