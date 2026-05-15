/**
 * Extraction Service — OCR initiation, status check, field extraction, extraction confirmation.
 *
 * // TODO: Backend integration required
 */
import { OCR_URL, EXTRACTION_URL } from '../../constants/apiConfig'
import type {
  InitiateOcrInput, InitiateOcrResult,
  CheckOcrStatusInput, CheckOcrStatusResult,
  ExtractFieldsInput, ExtractFieldsResult,
  ConfirmExtractionInput, ConfirmExtractionResult,
} from '../../types/serviceOperations/documents/documentOperations'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

/**
 * Initiates OCR processing on an uploaded document.
 *
 * @param input - documentId and organizationId
 * @returns OCR job ID and estimated duration | ServiceError on failure
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'initiateOcr'.
 *
 * // TODO: Backend integration required
 * // POST ${OCR_URL}
 */
export async function initiateOcr(
  input: InitiateOcrInput
): Promise<InitiateOcrResult | ServiceError> {
  void OCR_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Checks the status of an in-progress OCR job.
 * Poll until status === 'completed' before calling extractFields.
 *
 * @param input - ocrJobId and organizationId
 * @returns OcrResult with current status | ServiceError on failure
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'checkOcrStatus'.
 *
 * // TODO: Backend integration required
 * // GET ${OCR_URL}/:ocrJobId
 */
export async function checkOcrStatus(
  input: CheckOcrStatusInput
): Promise<CheckOcrStatusResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Extracts structured fields from a completed OCR document.
 * Returns fields with confidence scores and review flags.
 *
 * @param input - documentId, organizationId, contractType, extractionMode
 * @returns ExtractionResult with field-level confidence | ServiceError on failure
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'extractFields'.
 *
 * // TODO: Backend integration required
 * // POST ${EXTRACTION_URL}
 */
export async function extractFields(
  input: ExtractFieldsInput
): Promise<ExtractFieldsResult | ServiceError> {
  void EXTRACTION_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Confirms a reviewed extraction result, locking the extracted values.
 * Called after human review in the Collaborative and Full Manual automation modes.
 *
 * @param input - extractionResultId, organizationId, confirmedFields, reviewedByUserId
 * @returns Confirmation timestamp | ServiceError on failure
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'confirmExtraction'.
 *
 * // TODO: Backend integration required
 * // POST ${EXTRACTION_URL}/:extractionResultId/confirm
 */
export async function confirmExtraction(
  input: ConfirmExtractionInput
): Promise<ConfirmExtractionResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
