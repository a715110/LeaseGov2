/**
 * Full result of a document extraction operation.
 */
import type { ExtractionField } from './ExtractionField'

export interface ExtractionResult {
  id: string
  documentId: string
  organizationId: string
  contractType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'requires_review'
  extractedFields: ExtractionField[]
  overallConfidence: number
  lowConfidenceFields: string[]
  requiresHumanReview: boolean
  reviewedByUserId: string | null
  reviewedAt: Date | null
  isConfirmed: boolean
  confirmedAt: Date | null
  created_at: Date
  updated_at: Date
}
