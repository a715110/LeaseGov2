/**
 * Property lease workflow type — extends BaseContractWorkflow.
 */
import type { BaseContractWorkflow } from '../base/BaseContractWorkflow'

export type PropertyLeaseWorkflowType =
  | 'onboarding'
  | 'reassessment'
  | 'renewal'
  | 'termination'
  | 'rent_review'

export interface PropertyLeaseWorkflow extends BaseContractWorkflow {
  contractType: 'PROPERTY_LEASE'
  workflowType: PropertyLeaseWorkflowType
  propertyId: string
  currentRent: number | null
  proposedRent: number | null
}
