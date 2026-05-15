/**
 * Result of an OCR processing operation on a document.
 */
export interface OcrResult {
  id: string
  documentId: string
  organizationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  rawText: string | null
  pageCount: number | null
  ocrQuality: 'high' | 'medium' | 'low' | null
  processingDurationMs: number | null
  errorMessage: string | null
  completedAt: Date | null
  created_at: Date
}
