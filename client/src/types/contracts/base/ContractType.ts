/**
 * ContractType — union of all contract type identifiers.
 * Active: PROPERTY_LEASE, EQUIPMENT_LEASE
 * Future: SERVICE_CONTRACT
 *
 * Uppercase variants used by legacy FC-1/FC-2 screens.
 * Lowercase variants used by EquipmentLease and future contract types.
 */
export type ContractType = 'PROPERTY_LEASE' | 'EQUIPMENT_LEASE' | 'SERVICE_CONTRACT'

/** Lowercase contract type — used by EquipmentLease and future contract types */
export type ContractTypeLower =
  | 'property_lease'
  | 'equipment_lease'
  | 'service_contract'

export const CONTRACT_TYPE_LABELS: Record<ContractTypeLower, string> = {
  property_lease: 'Property Lease',
  equipment_lease: 'Equipment Lease',
  service_contract: 'Service Contract',
}

export type ContractStatus =
  | 'draft'
  | 'under_review'
  | 'pending_approval'
  | 'approved'
  | 'archived'
