/**
 * Workflow Service — workflow retrieval, history, checkpoint management, intervention.
 *
 * // TODO: Backend integration required
 */
import { WORKFLOW_URL } from '../../constants/apiConfig'
import type {
  GetWorkflowInput, GetWorkflowResult,
  GetWorkflowHistoryInput, GetWorkflowHistoryResult,
  GetPendingCheckpointsInput, GetPendingCheckpointsResult,
  SubmitCheckpointDecisionInput, SubmitCheckpointDecisionResult,
  TriggerInterventionInput, TriggerInterventionResult,
} from '../../types/serviceOperations/workflows/workflowOperations'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

/**
 * Retrieves a workflow record by ID.
 *
 * // TODO: Backend integration required
 * // GET ${WORKFLOW_URL}/:workflowId
 */
export async function getWorkflow(
  input: GetWorkflowInput
): Promise<GetWorkflowResult | ServiceError> {
  void WORKFLOW_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Retrieves the full audit history for a workflow.
 *
 * // TODO: Backend integration required
 * // GET ${WORKFLOW_URL}/:workflowId/history
 */
export async function getWorkflowHistory(
  input: GetWorkflowHistoryInput
): Promise<GetWorkflowHistoryResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Retrieves all pending human checkpoints for an organization.
 * Optionally filtered by contractId or assignedUserId.
 *
 * // TODO: Backend integration required
 * // GET ${WORKFLOW_URL}/checkpoints/pending
 */
export async function getPendingCheckpoints(
  input: GetPendingCheckpointsInput
): Promise<GetPendingCheckpointsResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Records a human decision on a pending checkpoint.
 * Resumes the workflow after the decision is recorded.
 *
 * // TODO: Backend integration required
 * // POST ${WORKFLOW_URL}/checkpoints/:checkpointId/decision
 */
export async function submitCheckpointDecision(
  input: SubmitCheckpointDecisionInput
): Promise<SubmitCheckpointDecisionResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Triggers a human intervention on an active autonomous workflow.
 * Pauses the workflow and notifies the assigned user.
 *
 * // TODO: Backend integration required
 * // POST ${WORKFLOW_URL}/:workflowId/intervene
 */
export async function triggerIntervention(
  input: TriggerInterventionInput
): Promise<TriggerInterventionResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
