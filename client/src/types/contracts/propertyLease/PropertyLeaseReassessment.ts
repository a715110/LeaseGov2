/**
 * Property lease reassessment record.
 * Tracks the full lifecycle of one reassessment event.
 */
export type ReassessmentType = 'routine' | 'triggered' | 'regulatory'
export type ReassessmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export interface ComparableProperty {
  address: string
  monthlyRent: number
  currency: string
  leaseArea: number | null
  distance: number | null
  source: string
  recordedAt: Date
}

export interface PropertyLeaseReassessment {
  id: string
  organizationId: string
  leaseId: string
  workflowId: string
  reassessmentType: ReassessmentType
  status: ReassessmentStatus
  scheduledDate: Date
  completedDate: Date | null
  assignedUserId: string
  currentAssessedValue: number
  proposedAssessedValue: number | null
  methodology: string | null
  comparables: ComparableProperty[]
  agentRecommendation: string | null
  agentConfidence: number | null
  humanDecision: 'approved' | 'modified' | 'rejected' | null
  humanRationale: string | null
  finalValue: number | null
  created_at: Date
  updated_at: Date
}
