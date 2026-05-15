/**
 * Document Service — file upload, storage, retrieval.
 * Contract-type agnostic. Works for all contract types.
 *
 * // TODO: Backend integration required
 */
import { DOCUMENT_UPLOAD_URL, DOCUMENT_URL } from '../../constants/apiConfig'
import type {
  UploadDocumentInput, UploadDocumentResult,
  GetDocumentInput, GetDocumentResult,
} from '../../types/serviceOperations/documents/documentOperations'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

/**
 * Uploads a document file and creates a Document record.
 * Triggers OCR processing automatically after upload.
 *
 * @param input - organizationId, optional contractId/contractType, file
 * @returns Created Document record | ServiceError on failure
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'uploadDocument'.
 *
 * // TODO: Backend integration required
 * // POST ${DOCUMENT_UPLOAD_URL}
 */
export async function uploadDocument(
  input: UploadDocumentInput
): Promise<UploadDocumentResult | ServiceError> {
  void DOCUMENT_UPLOAD_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Retrieves a single document record by ID.
 *
 * @param input - documentId and organizationId
 * @returns Document record | ServiceError on failure
 *
 * // TODO: Backend integration required
 * // GET ${DOCUMENT_URL}/:documentId
 */
export async function getDocument(
  input: GetDocumentInput
): Promise<GetDocumentResult | ServiceError> {
  void DOCUMENT_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
