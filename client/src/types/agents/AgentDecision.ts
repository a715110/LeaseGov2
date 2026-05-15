/**
 * A decision made by an agent during task execution.
 */
export interface AgentDecision {
  id: string
  agentTaskId: string
  organizationId: string
  contractId: string
  contractType: string
  decisionType: string
  reasoning: string
  dataUsed: Record<string, unknown>
  confidence: number            // 0.0 – 1.0
  recommendedAction: string
  requiresHumanApproval: boolean
  humanDecision: 'approved' | 'modified' | 'rejected' | null
  humanRationale: string | null
  timestamp: Date
}
