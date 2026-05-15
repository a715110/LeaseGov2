/**
 * An agent task — a unit of work dispatched to a specialized agent.
 */
export type AgentTaskStatus =
  | 'queued'
  | 'in_progress'
  | 'awaiting_input'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface AgentTask {
  id: string
  organizationId: string
  contractId: string
  contractType: string
  agentName: string
  taskType: string
  status: AgentTaskStatus
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  errorMessage: string | null
  startedAt: Date | null
  completedAt: Date | null
  created_at: Date
}
