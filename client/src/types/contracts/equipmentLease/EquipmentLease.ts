/**
 * EquipmentLease — Equipment Lease Prompt 1 of 5
 * Types, labels, and display maps for equipment lease contracts.
 * Route: /records/equipment/:id
 * Screen key: equipment-lease-record
 */

export type EquipmentCategory =
  | 'it_hardware'
  | 'manufacturing'
  | 'medical_devices'
  | 'vehicles'
  | 'laboratory'
  | 'office_equipment'
  | 'telecom'
  | 'other'

export type LeaseClassification =
  | 'operating'
  | 'finance'
  | 'undetermined'

export type MaintenanceResponsibility =
  | 'lessee'
  | 'lessor'
  | 'shared'

export interface EquipmentLease {
  id: string
  contractNumber: string
  contract_type: 'equipment_lease'
  status: string
  lock_status?: string
  workspace: string

  // Asset identification
  equipment_type: string
  equipment_category: EquipmentCategory
  manufacturer: string
  model: string
  serial_number: string
  asset_tag?: string
  quantity: number
  installation_location: string

  // Financial terms
  counterparty: string
  commencement_date: string
  expiration_date: string
  base_lease_term_months: number
  monthly_payment: number
  payment_frequency: 'monthly' | 'quarterly' | 'annual'
  fair_value_at_commencement: number
  residual_value_guarantee: number | null
  purchase_option_price: number | null
  purchase_option_exercise_date: string | null
  purchase_option_reasonably_certain: boolean | null

  // Equipment conditions
  condition_at_commencement: string
  return_conditions: string
  maintenance_responsibility: MaintenanceResponsibility
  permitted_modifications: string | null

  // Usage terms
  usage_limits?: string | null
  variable_payment_rate?: number | null
  excess_usage_rate?: number | null

  // Classification indicators
  useful_life_months: number
  lessee_useful_life_coverage_pct: number
  ownership_transfer_at_end: boolean
  specialized_nature: boolean

  // Classification result
  lease_classification: LeaseClassification
  classification_rationale?: string

  // Computed financial fields
  discount_rate: number
  present_value_of_payments: number
  pv_as_pct_of_fair_value: number
  rou_asset_balance?: number
  lease_liability_balance?: number
}

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  it_hardware: 'IT Hardware',
  manufacturing: 'Manufacturing Equipment',
  medical_devices: 'Medical Devices',
  vehicles: 'Vehicles & Fleet',
  laboratory: 'Laboratory Equipment',
  office_equipment: 'Office Equipment',
  telecom: 'Telecommunications',
  other: 'Other Equipment',
}

export const LEASE_CLASSIFICATION_LABELS: Record<LeaseClassification, string> = {
  operating: 'Operating Lease',
  finance: 'Finance Lease',
  undetermined: 'Undetermined',
}

export const MAINTENANCE_RESPONSIBILITY_LABELS: Record<MaintenanceResponsibility, string> = {
  lessee: 'Lessee',
  lessor: 'Lessor',
  shared: 'Shared',
}
