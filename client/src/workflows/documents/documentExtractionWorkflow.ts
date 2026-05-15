/**
 * Document Extraction Workflow — 4-step sequence.
 *
 * This sub-workflow is reusable across all contract types.
 * It is embedded within the larger onboarding and reassessment workflows.
 *
 * Steps: upload → OCR → extraction → review/confirm
 */
import type { WorkflowSequence } from '../../types/workflows/WorkflowStep'

export const DOCUMENT_EXTRACTION_WORKFLOW_ID = 'document_extraction_v1'

export const documentExtractionWorkflow: WorkflowSequence = {
  id: DOCUMENT_EXTRACTION_WORKFLOW_ID,
  onStepFailure: 'pause_and_notify',
  steps: [
    {
      stepId: 'doc_step_01_upload',
      label: 'Upload Document',
      operation: 'uploadDocument',
      inputSource: 'user',
      automationLevel: 'manual',
      retryable: false,
      maxRetries: null,
      pollingInterval: null,
      successCondition: 'document.processingStatus === "uploaded"',
      checkpointType: null,
      humanActionRequired: true,
      timeoutHours: 72,
    },
    {
      stepId: 'doc_step_02_ocr',
      label: 'OCR Processing',
      operation: 'initiateOcr',
      inputSource: 'doc_step_01_upload',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 3,
      pollingInterval: 5000,
      successCondition: 'ocrResult.status === "completed"',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 2,
    },
    {
      stepId: 'doc_step_03_extraction',
      label: 'Field Extraction',
      operation: 'extractFields',
      inputSource: 'doc_step_02_ocr',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 2,
      pollingInterval: null,
      successCondition: 'extractionResult.status === "completed"',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 1,
    },
    {
      stepId: 'doc_step_04_review',
      label: 'Review & Confirm',
      operation: 'confirmExtraction',
      inputSource: 'doc_step_03_extraction',
      automationLevel: 'collaborative | manual',
      retryable: false,
      maxRetries: null,
      pollingInterval: null,
      successCondition: 'extractionResult.isConfirmed === true',
      checkpointType: 'extraction_review',
      humanActionRequired: true,
      timeoutHours: 48,
    },
  ],
}
