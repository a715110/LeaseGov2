/**
 * ExtractionStoreContext — A10 (ARCH-2)
 *
 * Shared extraction state that flows across:
 *   ExtractionQueue → ExtractionStrategy (Field Mapping) → ExtractionVerification
 *
 * Eliminates prop-drilling and URL-param hacks for template confirmation.
 *
 * Key state:
 *   activeJobId       — the DocumentJob currently being processed
 *   confirmedTemplate — the ExtractionTemplate confirmed in Field Mapping (S5d)
 *   classificationResult — document type + confidence from Classification (S4)
 *
 * PRODUCTION UPGRADE: Replace with a server-side job state machine.
 *   GET /api/v1/extraction/jobs/:jobId → returns full job state
 */
import React, { createContext, useContext, useState, useCallback } from 'react'

export interface ExtractionTemplate {
  id: string
  name: string
  version: string
  description: string
  fieldCount: number
  fields: ExtractionTemplateField[]
}

export interface ExtractionTemplateField {
  id: string
  canonicalName: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'decimal' | 'integer' | 'percentage'
  category: 'Financial' | 'Legal' | 'Party' | 'Date' | 'Property' | 'Other' | 'Asset' | 'Equipment' | 'Usage' | 'Classification'
  validationRule?: string
  isCritical: boolean
  isRequired: boolean
  status: 'Active' | 'Inactive' | 'Draft'
  aliases: string[]
}

export interface ClassificationResult {
  documentType: string
  confidence: number
  suggestedTemplate?: ExtractionTemplate
}

interface ExtractionStoreValue {
  activeJobId: string | null
  setActiveJobId: (id: string | null) => void
  confirmedTemplate: ExtractionTemplate | null
  setConfirmedTemplate: (t: ExtractionTemplate | null) => void
  classificationResult: ClassificationResult | null
  setClassificationResult: (r: ClassificationResult | null) => void
  /** Reset all state (called when starting a new job) */
  resetStore: () => void
}

const ExtractionStoreContext = createContext<ExtractionStoreValue | null>(null)

export function ExtractionStoreProvider({ children }: { children: React.ReactNode }) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [confirmedTemplate, setConfirmedTemplate] = useState<ExtractionTemplate | null>(null)
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null)

  const resetStore = useCallback(() => {
    setActiveJobId(null)
    setConfirmedTemplate(null)
    setClassificationResult(null)
  }, [])

  return (
    <ExtractionStoreContext.Provider
      value={{
        activeJobId,
        setActiveJobId,
        confirmedTemplate,
        setConfirmedTemplate,
        classificationResult,
        setClassificationResult,
        resetStore,
      }}
    >
      {children}
    </ExtractionStoreContext.Provider>
  )
}

export function useExtractionStore(): ExtractionStoreValue {
  const ctx = useContext(ExtractionStoreContext)
  if (!ctx) throw new Error('useExtractionStore must be used within ExtractionStoreProvider')
  return ctx
}

/** 6 canonical mock templates used by S5a and S5b — tpl-1 to tpl-5 Property Lease, tpl-6 Equipment Lease */
export const MOCK_EXTRACTION_TEMPLATES: ExtractionTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Property Lease v3.2',
    version: 'v3.2',
    description: 'Full commercial lease with rent schedule, CAM, and option terms.',
    fieldCount: 34,
    fields: [
      { id: 'f1',  canonicalName: 'lease_commencement_date', dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['start_date', 'commencement'] },
      { id: 'f2',  canonicalName: 'lease_expiration_date',   dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['end_date', 'expiry'] },
      { id: 'f3',  canonicalName: 'base_rent_monthly',       dataType: 'currency', category: 'Financial', isCritical: true,  isRequired: true,  status: 'Active', aliases: ['monthly_rent', 'base_rent'] },
      { id: 'f4',  canonicalName: 'tenant_name',             dataType: 'string',   category: 'Party',     isCritical: true,  isRequired: true,  status: 'Active', aliases: ['lessee', 'tenant'] },
      { id: 'f5',  canonicalName: 'landlord_name',           dataType: 'string',   category: 'Party',     isCritical: true,  isRequired: true,  status: 'Active', aliases: ['lessor', 'landlord'] },
      { id: 'f6',  canonicalName: 'premises_address',        dataType: 'string',   category: 'Property',  isCritical: false, isRequired: true,  status: 'Active', aliases: ['property_address'] },
      { id: 'f7',  canonicalName: 'rentable_area_sqft',      dataType: 'number',   category: 'Property',  isCritical: false, isRequired: false, status: 'Active', aliases: ['area', 'sqft'] },
      { id: 'f8',  canonicalName: 'security_deposit',        dataType: 'currency', category: 'Financial', isCritical: false, isRequired: false, status: 'Active', aliases: ['deposit'] },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Lease Amendment',
    version: 'v2.1',
    description: 'Amendment to an existing lease — captures changed terms only.',
    fieldCount: 18,
    fields: [
      { id: 'f9',  canonicalName: 'amendment_effective_date', dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['effective_date'] },
      { id: 'f10', canonicalName: 'original_lease_reference', dataType: 'string',   category: 'Legal',     isCritical: true,  isRequired: true,  status: 'Active', aliases: ['parent_lease_id'] },
      { id: 'f11', canonicalName: 'amended_rent_monthly',     dataType: 'currency', category: 'Financial', isCritical: true,  isRequired: false, status: 'Active', aliases: ['new_rent'] },
      { id: 'f12', canonicalName: 'amended_expiration_date',  dataType: 'date',     category: 'Date',      isCritical: false, isRequired: false, status: 'Active', aliases: ['new_end_date'] },
    ],
  },
  {
    id: 'tpl-3',
    name: 'Sublease Agreement',
    version: 'v1.4',
    description: 'Sublease between original tenant and subtenant.',
    fieldCount: 22,
    fields: [
      { id: 'f13', canonicalName: 'subtenant_name',           dataType: 'string',   category: 'Party',     isCritical: true,  isRequired: true,  status: 'Active', aliases: ['sublessee'] },
      { id: 'f14', canonicalName: 'sublease_commencement',    dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'f15', canonicalName: 'sublease_expiration',      dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'f16', canonicalName: 'sublease_rent_monthly',    dataType: 'currency', category: 'Financial', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
    ],
  },
  {
    id: 'tpl-4',
    name: 'Lease Renewal',
    version: 'v2.0',
    description: 'Renewal option exercise — captures new term and rent.',
    fieldCount: 14,
    fields: [
      { id: 'f17', canonicalName: 'renewal_effective_date',   dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'f18', canonicalName: 'renewal_expiration_date',  dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'f19', canonicalName: 'renewal_rent_monthly',     dataType: 'currency', category: 'Financial', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
    ],
  },
  {
    id: 'tpl-5',
    name: 'Termination Agreement',
    version: 'v1.1',
    description: 'Early termination — captures termination date and fee.',
    fieldCount: 10,
    fields: [
      { id: 'f20', canonicalName: 'termination_date',         dataType: 'date',     category: 'Date',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'f21', canonicalName: 'termination_fee',          dataType: 'currency', category: 'Financial', isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      { id: 'f22', canonicalName: 'termination_reason',       dataType: 'string',   category: 'Legal',     isCritical: false, isRequired: false, status: 'Active', aliases: [] },
    ],
  },
  // ── tpl-6: Equipment Lease v1.0 — 41 fields across 6 categories ──────────
  {
    id: 'tpl-6',
    name: 'Equipment Lease v1.0',
    version: 'v1.0',
    description: 'Equipment lease with IFRS 16 classification indicators, asset identification, and financial terms.',
    fieldCount: 41,
    fields: [
      // Asset Identification (8 fields)
      { id: 'eq-f01', canonicalName: 'equipment_type',                   dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f02', canonicalName: 'equipment_category',               dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f03', canonicalName: 'manufacturer',                     dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f04', canonicalName: 'model',                            dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f05', canonicalName: 'serial_number',                    dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f06', canonicalName: 'asset_tag',                        dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f07', canonicalName: 'quantity',                         dataType: 'integer',    category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f08', canonicalName: 'installation_location',            dataType: 'string',     category: 'Asset',          isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      // Financial Terms (10 fields — all critical)
      { id: 'eq-f09', canonicalName: 'commencement_date',                dataType: 'date',       category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['start_date'] },
      { id: 'eq-f10', canonicalName: 'expiration_date',                  dataType: 'date',       category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['end_date'] },
      { id: 'eq-f11', canonicalName: 'base_lease_term_months',           dataType: 'integer',    category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f12', canonicalName: 'monthly_payment',                  dataType: 'currency',   category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['lease_payment'] },
      { id: 'eq-f13', canonicalName: 'payment_frequency',                dataType: 'string',     category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f14', canonicalName: 'fair_value_at_commencement',       dataType: 'currency',   category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f15', canonicalName: 'residual_value_guarantee',         dataType: 'currency',   category: 'Financial',      isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f16', canonicalName: 'purchase_option_price',            dataType: 'currency',   category: 'Financial',      isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f17', canonicalName: 'purchase_option_exercise_date',    dataType: 'date',       category: 'Financial',      isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f18', canonicalName: 'discount_rate',                    dataType: 'percentage', category: 'Financial',      isCritical: true,  isRequired: true,  status: 'Active', aliases: ['ibr'] },
      // Equipment Conditions (6 fields)
      { id: 'eq-f19', canonicalName: 'condition_at_commencement',        dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f20', canonicalName: 'return_conditions',                dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f21', canonicalName: 'maintenance_responsibility',       dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f22', canonicalName: 'permitted_modifications',          dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f23', canonicalName: 'deinstallation_responsibility',    dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f24', canonicalName: 'insurance_requirements',           dataType: 'string',     category: 'Equipment',      isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      // Usage Terms (5 fields)
      { id: 'eq-f25', canonicalName: 'usage_limits',                     dataType: 'string',     category: 'Usage',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f26', canonicalName: 'variable_payment_rate',            dataType: 'decimal',    category: 'Usage',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f27', canonicalName: 'usage_measurement_unit',           dataType: 'string',     category: 'Usage',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f28', canonicalName: 'maximum_usage_per_period',         dataType: 'decimal',    category: 'Usage',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f29', canonicalName: 'excess_usage_rate',                dataType: 'decimal',    category: 'Usage',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      // Classification Indicators (6 fields — all critical)
      { id: 'eq-f30', canonicalName: 'useful_life_months',               dataType: 'integer',    category: 'Classification', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f31', canonicalName: 'lessee_useful_life_coverage_pct',  dataType: 'percentage', category: 'Classification', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f32', canonicalName: 'ownership_transfer_at_end',        dataType: 'boolean',    category: 'Classification', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f33', canonicalName: 'purchase_option_reasonably_certain', dataType: 'boolean',  category: 'Classification', isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f34', canonicalName: 'specialized_nature',               dataType: 'boolean',    category: 'Classification', isCritical: true,  isRequired: true,  status: 'Active', aliases: [] },
      { id: 'eq-f35', canonicalName: 'pv_as_pct_of_fair_value',          dataType: 'percentage', category: 'Classification', isCritical: true,  isRequired: false, status: 'Active', aliases: [] },
      // Legal Terms (6 fields)
      { id: 'eq-f36', canonicalName: 'governing_law',                    dataType: 'string',     category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f37', canonicalName: 'early_termination_clause',         dataType: 'string',     category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f38', canonicalName: 'early_termination_penalty',        dataType: 'currency',   category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f39', canonicalName: 'assignment_rights',                dataType: 'string',     category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f40', canonicalName: 'sublease_rights',                  dataType: 'string',     category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
      { id: 'eq-f41', canonicalName: 'insurance_requirements_legal',     dataType: 'string',     category: 'Legal',          isCritical: false, isRequired: false, status: 'Active', aliases: [] },
    ],
  },
]
