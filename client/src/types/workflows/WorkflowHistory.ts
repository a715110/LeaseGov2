/**
 * Immutable audit record of a workflow step execution.
 */
export interface WorkflowHistory {
  id: string
  workflowId: string
  organizationId: string
  contractId: string
  contractType: string
  stepId: string
  stepLabel: string
  actor: 'agent' | 'human'
  actorId: string               // agentName or userId
  actorLabel: string
  action: string
  reasoning: string | null
  outcome: 'success' | 'failure' | 'skipped' | 'overridden'
  inputSnapshot: Record<string, unknown> | null
  outputSnapshot: Record<string, unknown> | null
  durationMs: number | null
  timestamp: Date
}
