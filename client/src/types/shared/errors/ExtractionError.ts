/**
 * OCR and extraction failure error.
 */
import type { ServiceError } from './ServiceError'

export interface LowConfidenceField {
  fieldName: string
  confidenceScore: number
}

export interface ExtractionError extends ServiceError {
  errorType: 'extraction_error'
  documentId: string
  failedFields: string[]
  lowConfidenceFields: LowConfidenceField[]
  ocrQuality: 'high' | 'medium' | 'low' | null
}
