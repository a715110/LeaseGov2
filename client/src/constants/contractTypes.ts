/**
 * Contract type registry constants.
 *
 * ACTIVE_CONTRACT_TYPES — types available in the current MVP build.
 * FUTURE_CONTRACT_TYPES — types planned for Phase 2 / future releases.
 *
 * This is the domain expansion registry. When a new contract type is ready:
 * 1. Move it from FUTURE_CONTRACT_TYPES to ACTIVE_CONTRACT_TYPES
 * 2. Add the value to the ContractType union in types/contracts/base/ContractType.ts
 * 3. Create the corresponding service file in services/contracts/
 * 4. Create the corresponding type files in types/contracts/
 * 5. Add the screen keys to screenKeys.ts
 * 6. Add routes to App.tsx
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 10 (Constants)
 */
import type { ContractType } from '../types/contracts/base/ContractType'

/** Contract types available in the MVP build. */
export const ACTIVE_CONTRACT_TYPES: ContractType[] = [
  'PROPERTY_LEASE',
] as const

/** Contract types planned for Phase 2 (scaffolded but not yet active). */
export const PHASE_2_CONTRACT_TYPES: ContractType[] = [
  'EQUIPMENT_LEASE',
  'SERVICE_CONTRACT',
] as const

/** All contract types that have been scaffolded (active + phase 2). */
export const ALL_SCAFFOLDED_CONTRACT_TYPES: ContractType[] = [
  ...ACTIVE_CONTRACT_TYPES,
  ...PHASE_2_CONTRACT_TYPES,
]

/**
 * Future contract types — not yet in the ContractType union.
 * Add to ContractType union before using in typed contexts.
 */
export const FUTURE_CONTRACT_TYPE_NAMES = [
  'SOFTWARE_LICENSE',
  'MAINTENANCE_AGREEMENT',
  'FRANCHISE_AGREEMENT',
] as const

/** Human-readable labels for each contract type. */
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  PROPERTY_LEASE:   'Property Lease',
  EQUIPMENT_LEASE:  'Equipment Lease',
  SERVICE_CONTRACT: 'Service Contract',
}

/** Route path prefixes for each contract type. */
export const CONTRACT_TYPE_PATHS: Record<ContractType, string> = {
  PROPERTY_LEASE:   '/contracts/property-leases',
  EQUIPMENT_LEASE:  '/contracts/equipment-leases',
  SERVICE_CONTRACT: '/contracts/service-contracts',
}
