/**
 * Structured representation of a property lease term extracted from a document.
 */
export interface PropertyLeaseTerm {
  id: string
  leaseId: string
  organizationId: string
  fieldName: string
  fieldLabel: string
  extractedValue: string | null
  confirmedValue: string | null
  isConfirmed: boolean
  confidence: number | null
  requiresReview: boolean
  sourceDocumentId: string | null
  sourcePageNumber: number | null
  extractedAt: Date | null
  confirmedAt: Date | null
  confirmedByUserId: string | null
}
