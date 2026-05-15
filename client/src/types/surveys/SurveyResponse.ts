/**
 * A tenant's response to a survey campaign.
 */
export interface SurveyResponse {
  id: string
  surveyId: string
  organizationId: string
  contractId: string
  respondentUserId: string
  status: 'in_progress' | 'submitted'
  submittedAt: Date | null
  created_at: Date
  updated_at: Date
}
