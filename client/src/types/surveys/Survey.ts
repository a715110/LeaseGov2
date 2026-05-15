/**
 * Survey campaign entity.
 */
export type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived'

export interface Survey {
  id: string
  organizationId: string
  title: string
  description: string | null
  status: SurveyStatus
  targetContractIds: string[]
  dueDate: Date | null
  createdByUserId: string
  created_at: Date
  updated_at: Date
}
