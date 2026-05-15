/**
 * Service operation input/output types for document operations.
 *
 * MCP NOTE: Each Input type maps to an MCP tool's inputSchema.
 */
import type { Document } from '../../documents/Document'
import type { OcrResult } from '../../documents/OcrResult'
import type { ExtractionResult } from '../../documents/ExtractionResult'
import type { ExtractionField } from '../../documents/ExtractionField'

// ─── uploadDocument ──────────────────────────────────────────────────────────
export interface UploadDocumentInput {
  organizationId: string
  contractId: string | null
  contractType: string | null
  file: File
}
export interface UploadDocumentResult {
  success: true
  document: Document
}

// ─── initiateOcr ─────────────────────────────────────────────────────────────
export interface InitiateOcrInput {
  documentId: string
  organizationId: string
}
export interface InitiateOcrResult {
  success: true
  ocrJobId: string
  estimatedDurationMs: number
}

// ─── checkOcrStatus ──────────────────────────────────────────────────────────
export interface CheckOcrStatusInput {
  ocrJobId: string
  organizationId: string
}
export interface CheckOcrStatusResult {
  success: true
  ocrResult: OcrResult
}

// ─── extractFields ───────────────────────────────────────────────────────────
export interface ExtractFieldsInput {
  documentId: string
  organizationId: string
  contractType: string
  extractionMode?: 'standard' | 'detailed'
}
export interface ExtractFieldsResult {
  success: true
  extractionResult: ExtractionResult
}

// ─── confirmExtraction ───────────────────────────────────────────────────────
export interface ConfirmExtractionInput {
  extractionResultId: string
  organizationId: string
  confirmedFields: ExtractionField[]
  reviewedByUserId: string
}
export interface ConfirmExtractionResult {
  success: true
  extractionResultId: string
  confirmedAt: Date
}

// ─── getDocument ─────────────────────────────────────────────────────────────
export interface GetDocumentInput {
  documentId: string
  organizationId: string
}
export interface GetDocumentResult {
  success: true
  document: Document
}
