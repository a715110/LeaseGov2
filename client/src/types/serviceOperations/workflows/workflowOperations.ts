/**
 * Service operation input/output types for workflow operations.
 *
 * MCP NOTE: Each Input type maps to an MCP tool's inputSchema.
 */
import type { BaseContractWorkflow } from '../../contracts/base/BaseContractWorkflow'
import type { WorkflowHistory } from '../../workflows/WorkflowHistory'
import type { HumanCheckpoint } from '../../automation/HumanCheckpoint'
import type { CheckpointDecision } from '../../automation/CheckpointDecision'

// ─── getWorkflow ──────────────────────────────────────────────────────────────
export interface GetWorkflowInput {
  workflowId: string
  organizationId: string
}
export interface GetWorkflowResult {
  success: true
  workflow: BaseContractWorkflow
}

// ─── getWorkflowHistory ───────────────────────────────────────────────────────
export interface GetWorkflowHistoryInput {
  workflowId: string
  organizationId: string
}
export interface GetWorkflowHistoryResult {
  success: true
  history: WorkflowHistory[]
}

// ─── getPendingCheckpoints ────────────────────────────────────────────────────
export interface GetPendingCheckpointsInput {
  organizationId: string
  contractId?: string
  assignedUserId?: string
}
export interface GetPendingCheckpointsResult {
  success: true
  checkpoints: HumanCheckpoint[]
  total: number
}

// ─── submitCheckpointDecision ─────────────────────────────────────────────────
export interface SubmitCheckpointDecisionInput {
  checkpointId: string
  organizationId: string
  decision: 'approved' | 'modified' | 'rejected'
  modifiedValues?: Record<string, unknown>
  rationale: string
  decidedByUserId: string
}
export interface SubmitCheckpointDecisionResult {
  success: true
  checkpointDecision: CheckpointDecision
}

// ─── triggerIntervention ──────────────────────────────────────────────────────
export interface TriggerInterventionInput {
  workflowId: string
  organizationId: string
  contractId: string
  reason: string
  requestedByUserId: string
}
export interface TriggerInterventionResult {
  success: true
  workflowId: string
  pausedAt: Date
}
