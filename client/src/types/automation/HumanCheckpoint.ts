/**
 * A human-in-the-loop approval checkpoint in a collaborative workflow.
 */
export type CheckpointStatus = 'pending' | 'approved' | 'modified' | 'rejected' | 'expired'

export interface HumanCheckpoint {
  id: string
  workflowId: string
  organizationId: string
  contractId: string
  contractType: string
  checkpointType: string
  stepId: string
  stepLabel: string
  agentPreparedData: Record<string, unknown>
  agentRecommendation: string
  agentReasoning: string
  agentConfidence: number
  agentFlags: string[]
  status: CheckpointStatus
  deadlineAt: Date | null
  assignedUserId: string | null
  created_at: Date
  updated_at: Date
}
