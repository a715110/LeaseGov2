/**
 * The human decision recorded for a completed checkpoint.
 */
export interface CheckpointDecision {
  id: string
  checkpointId: string
  organizationId: string
  contractId: string
  contractType: string
  decision: 'approved' | 'modified' | 'rejected'
  modifiedValues: Record<string, unknown> | null
  rationale: string
  decidedByUserId: string
  decidedAt: Date
}
