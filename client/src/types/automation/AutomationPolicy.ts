/**
 * Automation policy configuration for a contract or tenant.
 */
import type { AutomationLevelValue } from './AutomationLevel'

export interface AutomationPolicy {
  id: string
  organizationId: string
  name: string
  automationLevel: AutomationLevelValue
  appliesTo: 'all_contracts' | 'contract_type' | 'individual_contract'
  contractType: string | null
  contractId: string | null
  isDefault: boolean
  created_at: Date
  updated_at: Date
}
