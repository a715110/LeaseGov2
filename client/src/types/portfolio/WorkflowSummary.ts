/**
 * Portfolio-level workflow summary grouped by contract type and status.
 */
export interface WorkflowSummary {
  organizationId: string
  byContractType: WorkflowTypeGroup[]
  totalActive: number
  totalCompleted: number
  totalFailed: number
  generatedAt: Date
}

export interface WorkflowTypeGroup {
  contractType: string
  active: number
  awaitingHuman: number
  completed: number
  failed: number
}
