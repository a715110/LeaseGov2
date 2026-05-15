/**
 * documentIntakeAgent.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:  Frontend representation of the Document Intake Agent.
 *                Handles document upload acceptance, file type validation,
 *                virus scan status display, and intake queue management.
 *
 * Responsibility boundary:
 *   - Intake only: file receipt, validation, and queuing for OCR.
 *   - Does NOT perform OCR (→ ocrAgent.ts)
 *   - Does NOT perform field extraction (→ extractionAgent.ts)
 *
 * // TODO: Backend integration required
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Document } from '../../types/documents/Document'

export const DOCUMENT_INTAKE_AGENT_NAME = 'DocumentIntakeAgent'
export const DOCUMENT_INTAKE_AGENT_LABEL = 'Document Intake Agent'

// ─── Accepted file types ──────────────────────────────────────────────────────

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
] as const

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number]

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the file's MIME type is accepted by the intake agent.
 */
export function isAcceptedFileType(mimeType: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Returns true if the file size is within the allowed limit.
 */
export function isWithinSizeLimit(fileSizeBytes: number): boolean {
  return fileSizeBytes <= MAX_FILE_SIZE_BYTES
}

/**
 * Returns a human-readable validation error for a file, or null if valid.
 */
export function getIntakeValidationError(file: File): string | null {
  if (!isAcceptedFileType(file.type)) {
    return `File type "${file.type}" is not accepted. Accepted types: PDF, JPEG, PNG, TIFF, DOCX.`
  }
  if (!isWithinSizeLimit(file.size)) {
    return `File size ${(file.size / (1024 * 1024)).toFixed(1)} MB exceeds the 50 MB limit.`
  }
  return null
}

// ─── Status display helpers ───────────────────────────────────────────────────

/**
 * Returns a display label for the intake phase of a document.
 * Maps DocumentProcessingStatus values to user-facing intake phase labels.
 */
export function getIntakeStatusLabel(document: Document): string {
  switch (document.processingStatus) {
    case 'uploaded':              return 'Received — queued for OCR'
    case 'ocr_pending':           return 'Awaiting OCR'
    case 'ocr_processing':        return 'OCR in progress'
    case 'ocr_completed':         return 'OCR complete'
    case 'extraction_pending':    return 'Queued for extraction'
    case 'extraction_in_progress': return 'Extraction in progress'
    case 'extraction_completed':  return 'Extraction complete'
    case 'extraction_failed':     return 'Extraction failed'
    case 'review_required':       return 'Review required'
    case 'confirmed':             return 'Confirmed'
    case 'archived':              return 'Archived'
    default:                      return 'Unknown'
  }
}
