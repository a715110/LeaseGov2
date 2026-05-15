/**
 * ContractType — union of all contract type identifiers.
 * Active: PROPERTY_LEASE
 * Future: EQUIPMENT_LEASE, SERVICE_CONTRACT
 */
export type ContractType = 'PROPERTY_LEASE' | 'EQUIPMENT_LEASE' | 'SERVICE_CONTRACT'

export type ContractStatus =
  | 'draft'
  | 'under_review'
  | 'pending_approval'
  | 'approved'
  | 'archived'
