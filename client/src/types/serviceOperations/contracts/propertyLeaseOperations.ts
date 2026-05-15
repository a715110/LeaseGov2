/**
 * Service operation input/output types for property lease operations.
 *
 * MCP NOTE: Each Input type here maps directly to an MCP tool's inputSchema.
 * Each Result type maps to the tool's output schema.
 * When generating MCP manifests, read from this file — do not duplicate.
 */
import type { PropertyLease } from '../../contracts/propertyLease/PropertyLease'
import type { ExtractionField } from '../../documents/ExtractionField'
import type { Pagination, PaginationInput } from '../../shared/Pagination'
import type { ContractStatus } from '../../contracts/base/ContractType'

// ─── getPropertyLease ────────────────────────────────────────────────────────
export interface GetPropertyLeaseInput {
  leaseId: string
  organizationId: string
}
export interface GetPropertyLeaseResult {
  success: true
  lease: PropertyLease
}

// ─── listPropertyLeases ──────────────────────────────────────────────────────
export interface ListPropertyLeasesInput {
  organizationId: string
  filters?: {
    status?: ContractStatus[]
    expiringWithinDays?: number
    assignedUserId?: string
    counterpartyId?: string
  }
  pagination?: PaginationInput
  sortBy?: 'endDate' | 'status' | 'assessedValue' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}
export interface ListPropertyLeasesResult {
  success: true
  leases: PropertyLease[]
  total: number
  pagination: Pagination
}

// ─── createPropertyLease ─────────────────────────────────────────────────────
export interface CreatePropertyLeaseInput {
  organizationId: string
  leaseData: Omit<PropertyLease, 'id' | 'created_at' | 'updated_at'>
}
export interface CreatePropertyLeaseResult {
  success: true
  lease: PropertyLease
}

// ─── updatePropertyLease ─────────────────────────────────────────────────────
export interface UpdatePropertyLeaseInput {
  leaseId: string
  organizationId: string
  updates: Partial<PropertyLease>
}
export interface UpdatePropertyLeaseResult {
  success: true
  lease: PropertyLease
}

// ─── extractLeaseTerms ───────────────────────────────────────────────────────
export interface ExtractLeaseTermsInput {
  documentId: string
  contractType: 'PROPERTY_LEASE'
  organizationId: string
  extractionMode?: 'standard' | 'detailed'
}
export interface ExtractLeaseTermsResult {
  success: true
  extractedFields: ExtractionField[]
  overallConfidence: number
  lowConfidenceFields: string[]
  requiresHumanReview: boolean
}

// ─── validateLeaseData ───────────────────────────────────────────────────────
export interface ValidateLeaseDataInput {
  organizationId: string
  leaseData: Partial<PropertyLease>
  validationMode?: 'strict' | 'lenient'
}
export interface ValidateLeaseDataResult {
  success: true
  isValid: boolean
  validatedFields: string[]
  warnings: Array<{ field: string; message: string }>
}

// ─── scheduleReassessment ────────────────────────────────────────────────────
export interface ScheduleReassessmentInput {
  leaseId: string
  organizationId: string
  scheduledDate: Date
  assignedUserId: string
  reassessmentType: 'routine' | 'triggered' | 'regulatory'
}
export interface ScheduleReassessmentResult {
  success: true
  reassessmentId: string
  workflowId: string
  scheduledDate: Date
}

// ─── archivePropertyLease ────────────────────────────────────────────────────
export interface ArchivePropertyLeaseInput {
  leaseId: string
  organizationId: string
  reason: string
}
export interface ArchivePropertyLeaseResult {
  success: true
  leaseId: string
  archivedAt: Date
}

// ─── Future contract type slots ──────────────────────────────────────────────
// equipmentLeaseOperations.ts — FUTURE
// serviceContractOperations.ts — FUTURE
