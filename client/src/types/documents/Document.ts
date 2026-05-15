/**
 * Generic document entity — contract-type agnostic.
 */
export interface Document {
  id: string
  organizationId: string
  contractId: string | null
  fileName: string
  fileSize: number
  mimeType: string
  storageKey: string
  uploadedAt: Date
  uploadedByUserId: string
  processingStatus: DocumentProcessingStatus
}

export type DocumentProcessingStatus =
  | 'uploaded'
  | 'ocr_pending'
  | 'ocr_processing'
  | 'ocr_completed'
  | 'extraction_pending'
  | 'extraction_in_progress'
  | 'extraction_completed'
  | 'extraction_failed'
  | 'review_required'
  | 'confirmed'
  | 'archived'
