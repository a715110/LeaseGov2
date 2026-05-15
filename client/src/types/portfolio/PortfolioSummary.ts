/**
 * Aggregated portfolio-level summary for a tenant.
 */
export interface PortfolioSummary {
  organizationId: string
  totalContracts: number
  contractsByType: Record<string, number>
  contractsByStatus: Record<string, number>
  expiringWithin30Days: number
  expiringWithin60Days: number
  expiringWithin90Days: number
  activeWorkflows: number
  pendingCheckpoints: number
  openExceptions: number
  agentProcessingCount: number
  automationEfficiencyRate: number  // 0.0 – 1.0
  generatedAt: Date
}
