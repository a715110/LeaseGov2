/**
 * Foundation type for every contract workflow type.
 * Domain-specific workflow types extend this.
 */
import type { ContractType } from './ContractType'

export interface BaseContractWorkflow {
  id: string
  organizationId: string
  contractId: string
  contractType: ContractType
  currentStepId: string
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
  automationLevel: 'full_autonomous' | 'collaborative' | 'full_manual'
  startedAt: Date
  completedAt: Date | null
  assignedUserId: string
  steps: WorkflowStepSummary[]
}

export interface WorkflowStepSummary {
  stepId: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  completedAt: Date | null
  actor: 'agent' | 'human' | null
}
