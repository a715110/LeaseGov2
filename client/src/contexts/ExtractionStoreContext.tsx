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
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  category: 'Financial' | 'Legal' | 'Party' | 'Date' | 'Property' | 'Other'
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

/** 5 canonical mock templates used by S5a and S5b */
export const MOCK_EXTRACTION_TEMPLATES: ExtractionTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Standard Commercial Lease',
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
]
