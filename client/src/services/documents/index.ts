/**
 * DOCUMENT SERVICE OPERATIONS REGISTRY
 *
 * MCP NOTE: This file is the source for future MCP manifest generation.
 * When generating /mcp/manifests/documents/extractionManifest.ts,
 * read from here.
 */

export {
  uploadDocument,
  getDocument,
} from './documentService'

export {
  initiateOcr,
  checkOcrStatus,
  extractFields,
  confirmExtraction,
} from './extractionService'

export type {
  UploadDocumentInput, UploadDocumentResult,
  GetDocumentInput, GetDocumentResult,
  InitiateOcrInput, InitiateOcrResult,
  CheckOcrStatusInput, CheckOcrStatusResult,
  ExtractFieldsInput, ExtractFieldsResult,
  ConfirmExtractionInput, ConfirmExtractionResult,
} from '../../types/serviceOperations/documents/documentOperations'
