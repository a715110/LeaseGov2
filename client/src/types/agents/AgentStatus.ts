/**
 * Current status of an agent for a given contract.
 */
export type AgentStatusValue =
  | 'idle'
  | 'processing'
  | 'awaiting_human'
  | 'exception'
  | 'completed'
  | 'degraded'

export interface AgentStatus {
  agentName: string
  contractId: string
  contractType: string
  organizationId: string
  status: AgentStatusValue
  currentStep: string | null
  lastAction: string | null
  lastActionAt: Date | null
  pendingItemsCount: number
}
