/**
 * equipmentLeaseExtractionFields.ts
 * Equipment Lease Prompt 1 of 5 — Part 1C
 *
 * Extraction field schema for equipment lease contracts.
 * 41 fields across 6 categories.
 * All fields in financial_terms and classification_indicators are is_critical: true.
 *
 * Filter by is_equipment_lease: true to distinguish from property lease fields.
 * Compatible with the ExtractionField / ExtractionTemplate shape used in AdminSchema.tsx.
 */

export type EqFieldCategory =
  | 'asset_identification'
  | 'financial_terms'
  | 'equipment_conditions'
  | 'usage_terms'
  | 'classification_indicators'
  | 'legal_terms'

export type EqDataType =
  | 'string'
  | 'date'
  | 'decimal'
  | 'integer'
  | 'boolean'
  | 'currency'
  | 'percentage'
  | 'table'

export interface EquipmentExtractionField {
  id: string
  field_name: string
  display_label: string
  field_category: EqFieldCategory
  data_type: EqDataType
  is_critical: boolean
  is_required: boolean
  anchor_requirement: 'required' | 'optional' | 'none'
  validation_rule: string | null
  sort_order: number
  is_equipment_lease: true
}

export const EQUIPMENT_LEASE_EXTRACTION_FIELDS: EquipmentExtractionField[] = [
  // ── CATEGORY: asset_identification (8 fields) ──────────────────────────────
  {
    id: 'eq-f01', field_name: 'equipment_type',        display_label: 'Equipment Type',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 1, is_equipment_lease: true,
  },
  {
    id: 'eq-f02', field_name: 'equipment_category',    display_label: 'Equipment Category',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'One of: it_hardware, manufacturing, medical_devices, vehicles, laboratory, office_equipment, telecom, other',
    sort_order: 2, is_equipment_lease: true,
  },
  {
    id: 'eq-f03', field_name: 'manufacturer',          display_label: 'Manufacturer',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 3, is_equipment_lease: true,
  },
  {
    id: 'eq-f04', field_name: 'model',                 display_label: 'Model',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 4, is_equipment_lease: true,
  },
  {
    id: 'eq-f05', field_name: 'serial_number',         display_label: 'Serial Number',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 5, is_equipment_lease: true,
  },
  {
    id: 'eq-f06', field_name: 'asset_tag',             display_label: 'Asset Tag',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 6, is_equipment_lease: true,
  },
  {
    id: 'eq-f07', field_name: 'quantity',              display_label: 'Quantity',
    field_category: 'asset_identification', data_type: 'integer',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'Positive integer ≥ 1', sort_order: 7, is_equipment_lease: true,
  },
  {
    id: 'eq-f08', field_name: 'installation_location', display_label: 'Installation Location',
    field_category: 'asset_identification', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 8, is_equipment_lease: true,
  },

  // ── CATEGORY: financial_terms (10 fields — all critical) ──────────────────
  {
    id: 'eq-f09', field_name: 'commencement_date',          display_label: 'Commencement Date',
    field_category: 'financial_terms', data_type: 'date',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'ISO 8601 date', sort_order: 9, is_equipment_lease: true,
  },
  {
    id: 'eq-f10', field_name: 'expiration_date',            display_label: 'Expiration Date',
    field_category: 'financial_terms', data_type: 'date',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'Must be after commencement_date', sort_order: 10, is_equipment_lease: true,
  },
  {
    id: 'eq-f11', field_name: 'base_lease_term_months',     display_label: 'Base Lease Term (Months)',
    field_category: 'financial_terms', data_type: 'integer',
    is_critical: true, is_required: true,  anchor_requirement: 'optional',
    validation_rule: 'Computed from dates if blank', sort_order: 11, is_equipment_lease: true,
  },
  {
    id: 'eq-f12', field_name: 'monthly_payment',            display_label: 'Monthly Payment',
    field_category: 'financial_terms', data_type: 'currency',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'Positive value in USD', sort_order: 12, is_equipment_lease: true,
  },
  {
    id: 'eq-f13', field_name: 'payment_frequency',          display_label: 'Payment Frequency',
    field_category: 'financial_terms', data_type: 'string',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'One of: monthly, quarterly, annual', sort_order: 13, is_equipment_lease: true,
  },
  {
    id: 'eq-f14', field_name: 'fair_value_at_commencement', display_label: 'Fair Value at Commencement',
    field_category: 'financial_terms', data_type: 'currency',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'Positive value in USD', sort_order: 14, is_equipment_lease: true,
  },
  {
    id: 'eq-f15', field_name: 'residual_value_guarantee',   display_label: 'Residual Value Guarantee',
    field_category: 'financial_terms', data_type: 'currency',
    is_critical: true, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if not applicable', sort_order: 15, is_equipment_lease: true,
  },
  {
    id: 'eq-f16', field_name: 'purchase_option_price',      display_label: 'Purchase Option Price',
    field_category: 'financial_terms', data_type: 'currency',
    is_critical: true, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if no purchase option', sort_order: 16, is_equipment_lease: true,
  },
  {
    id: 'eq-f17', field_name: 'purchase_option_exercise_date', display_label: 'Purchase Option Exercise Date',
    field_category: 'financial_terms', data_type: 'date',
    is_critical: true, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if no purchase option', sort_order: 17, is_equipment_lease: true,
  },
  {
    id: 'eq-f18', field_name: 'discount_rate',              display_label: 'Discount Rate (IBR)',
    field_category: 'financial_terms', data_type: 'percentage',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: '0.00–1.00', sort_order: 18, is_equipment_lease: true,
  },

  // ── CATEGORY: equipment_conditions (6 fields) ─────────────────────────────
  {
    id: 'eq-f19', field_name: 'condition_at_commencement',    display_label: 'Condition at Commencement',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 19, is_equipment_lease: true,
  },
  {
    id: 'eq-f20', field_name: 'return_conditions',            display_label: 'Return Conditions',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 20, is_equipment_lease: true,
  },
  {
    id: 'eq-f21', field_name: 'maintenance_responsibility',   display_label: 'Maintenance Responsibility',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'One of: lessee, lessor, shared', sort_order: 21, is_equipment_lease: true,
  },
  {
    id: 'eq-f22', field_name: 'permitted_modifications',      display_label: 'Permitted Modifications',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if none permitted', sort_order: 22, is_equipment_lease: true,
  },
  {
    id: 'eq-f23', field_name: 'deinstallation_responsibility', display_label: 'Deinstallation Responsibility',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 23, is_equipment_lease: true,
  },
  {
    id: 'eq-f24', field_name: 'insurance_requirements',       display_label: 'Insurance Requirements',
    field_category: 'equipment_conditions', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 24, is_equipment_lease: true,
  },

  // ── CATEGORY: usage_terms (5 fields) ─────────────────────────────────────
  {
    id: 'eq-f25', field_name: 'usage_limits',             display_label: 'Usage Limits',
    field_category: 'usage_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 25, is_equipment_lease: true,
  },
  {
    id: 'eq-f26', field_name: 'variable_payment_rate',    display_label: 'Variable Payment Rate',
    field_category: 'usage_terms', data_type: 'decimal',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if no variable component', sort_order: 26, is_equipment_lease: true,
  },
  {
    id: 'eq-f27', field_name: 'usage_measurement_unit',   display_label: 'Usage Measurement Unit',
    field_category: 'usage_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'e.g. miles, hours, cycles', sort_order: 27, is_equipment_lease: true,
  },
  {
    id: 'eq-f28', field_name: 'maximum_usage_per_period', display_label: 'Maximum Usage Per Period',
    field_category: 'usage_terms', data_type: 'decimal',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 28, is_equipment_lease: true,
  },
  {
    id: 'eq-f29', field_name: 'excess_usage_rate',        display_label: 'Excess Usage Rate',
    field_category: 'usage_terms', data_type: 'decimal',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Cost per unit of excess usage', sort_order: 29, is_equipment_lease: true,
  },

  // ── CATEGORY: classification_indicators (6 fields — all critical) ─────────
  {
    id: 'eq-f30', field_name: 'useful_life_months',                display_label: 'Useful Life (Months)',
    field_category: 'classification_indicators', data_type: 'integer',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'Positive integer', sort_order: 30, is_equipment_lease: true,
  },
  {
    id: 'eq-f31', field_name: 'lessee_useful_life_coverage_pct',   display_label: 'Useful Life Coverage (%)',
    field_category: 'classification_indicators', data_type: 'percentage',
    is_critical: true, is_required: true,  anchor_requirement: 'none',
    validation_rule: 'Computed: base_lease_term_months / useful_life_months × 100', sort_order: 31, is_equipment_lease: true,
  },
  {
    id: 'eq-f32', field_name: 'ownership_transfer_at_end',         display_label: 'Ownership Transfer at End',
    field_category: 'classification_indicators', data_type: 'boolean',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: null, sort_order: 32, is_equipment_lease: true,
  },
  {
    id: 'eq-f33', field_name: 'purchase_option_reasonably_certain', display_label: 'Purchase Option Reasonably Certain',
    field_category: 'classification_indicators', data_type: 'boolean',
    is_critical: true, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if no purchase option exists', sort_order: 33, is_equipment_lease: true,
  },
  {
    id: 'eq-f34', field_name: 'specialized_nature',                display_label: 'Specialized Nature',
    field_category: 'classification_indicators', data_type: 'boolean',
    is_critical: true, is_required: true,  anchor_requirement: 'required',
    validation_rule: 'True if equipment has no alternative use to lessor', sort_order: 34, is_equipment_lease: true,
  },
  {
    id: 'eq-f35', field_name: 'pv_as_pct_of_fair_value',           display_label: 'PV as % of Fair Value',
    field_category: 'classification_indicators', data_type: 'percentage',
    is_critical: true, is_required: false, anchor_requirement: 'none',
    validation_rule: 'Computed: present_value_of_payments / fair_value_at_commencement × 100', sort_order: 35, is_equipment_lease: true,
  },

  // ── CATEGORY: legal_terms (6 fields) ─────────────────────────────────────
  {
    id: 'eq-f36', field_name: 'governing_law',              display_label: 'Governing Law',
    field_category: 'legal_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 36, is_equipment_lease: true,
  },
  {
    id: 'eq-f37', field_name: 'early_termination_clause',   display_label: 'Early Termination Clause',
    field_category: 'legal_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 37, is_equipment_lease: true,
  },
  {
    id: 'eq-f38', field_name: 'early_termination_penalty',  display_label: 'Early Termination Penalty',
    field_category: 'legal_terms', data_type: 'currency',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: 'Null if no penalty defined', sort_order: 38, is_equipment_lease: true,
  },
  {
    id: 'eq-f39', field_name: 'assignment_rights',          display_label: 'Assignment Rights',
    field_category: 'legal_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 39, is_equipment_lease: true,
  },
  {
    id: 'eq-f40', field_name: 'sublease_rights',            display_label: 'Sublease Rights',
    field_category: 'legal_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 40, is_equipment_lease: true,
  },
  {
    id: 'eq-f41', field_name: 'insurance_requirements_legal', display_label: 'Insurance Requirements (Legal)',
    field_category: 'legal_terms', data_type: 'string',
    is_critical: false, is_required: false, anchor_requirement: 'optional',
    validation_rule: null, sort_order: 41, is_equipment_lease: true,
  },
]

/** Fields grouped by category — for use in accordion-style schema views */
export const EQUIPMENT_FIELDS_BY_CATEGORY = EQUIPMENT_LEASE_EXTRACTION_FIELDS.reduce<
  Record<EqFieldCategory, EquipmentExtractionField[]>
>(
  (acc, field) => {
    acc[field.field_category].push(field)
    return acc
  },
  {
    asset_identification: [],
    financial_terms: [],
    equipment_conditions: [],
    usage_terms: [],
    classification_indicators: [],
    legal_terms: [],
  },
)

export const EQ_FIELD_CATEGORY_LABELS: Record<EqFieldCategory, string> = {
  asset_identification:      'Asset Identification',
  financial_terms:           'Financial Terms',
  equipment_conditions:      'Equipment Conditions',
  usage_terms:               'Usage Terms',
  classification_indicators: 'Classification Indicators',
  legal_terms:               'Legal Terms',
}
