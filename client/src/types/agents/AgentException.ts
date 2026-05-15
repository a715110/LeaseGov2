/**
 * An unresolvable issue raised by an agent requiring human intervention.
 */
export type ExceptionUrgency = 'high' | 'medium' | 'low'

export interface AgentException {
  id: string
  agentTaskId: string
  organizationId: string
  contractId: string
  contractType: string
  exceptionType: string
  description: string
  whatWasAttempted: string
  whyItFailed: string
  whatHumanMustProvide: string
  urgency: ExceptionUrgency
  isResolved: boolean
  resolvedByUserId: string | null
  resolvedAt: Date | null
  created_at: Date
}
