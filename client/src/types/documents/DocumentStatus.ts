/**
 * Document status constants and display metadata.
 */
export type DocumentStatus =
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

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  uploaded:               'Uploaded',
  ocr_pending:            'OCR Pending',
  ocr_processing:         'OCR Processing',
  ocr_completed:          'OCR Completed',
  extraction_pending:     'Extraction Pending',
  extraction_in_progress: 'Extraction In Progress',
  extraction_completed:   'Extraction Completed',
  extraction_failed:      'Extraction Failed',
  review_required:        'Review Required',
  confirmed:              'Confirmed',
  archived:               'Archived',
}
