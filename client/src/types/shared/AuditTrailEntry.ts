/**
 * A single entry in the compliance-grade audit trail for a contract.
 */
export interface AuditTrailEntry {
  id: string
  organizationId: string
  contractId: string
  contractType: string
  actor: 'agent' | 'human'
  actorId: string
  actorLabel: string
  action: string
  actionCategory: 'data_change' | 'status_change' | 'document' | 'workflow' | 'decision' | 'access'
  description: string
  reasoning: string | null
  previousValue: unknown | null
  newValue: unknown | null
  ipAddress: string | null
  timestamp: Date
}
