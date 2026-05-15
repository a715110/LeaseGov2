/**
 * Document Intake Workflow — composable sequence definition.
 *
 * Steps:
 * 1. upload    — User uploads document file
 * 2. validate  — Validate file type, size, and virus scan
 * 3. classify  — AI classifies document type (lease agreement, amendment, etc.)
 * 4. queue     — Queue document for extraction or manual review
 *
 * This workflow is triggered when a document is uploaded outside of the
 * onboarding workflow (e.g., adding a supporting document to an existing lease).
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 8 (Workflow Sequences)
 *
 * // TODO: Implement step handlers when backend is ready
 */
import type { WorkflowStep, WorkflowSequence } from '../../types/workflows/WorkflowStep'

export const DOCUMENT_INTAKE_WORKFLOW_ID = 'document_intake'

const steps: WorkflowStep[] = [
  {
    stepId:              'upload',
    label:               'Upload Document',
    operation:           'documentExtractionAgent.uploadDocument',
    inputSource:         null,
    automationLevel:     'manual',
    retryable:           true,
    maxRetries:          3,
    pollingInterval:     null,
    successCondition:    'document.status === "uploaded"',
    checkpointType:      null,
    humanActionRequired: true,
    timeoutHours:        null,
  },
  {
    stepId:              'validate',
    label:               'Validate Document',
    operation:           'documentExtractionAgent.validateDocument',
    inputSource:         'upload.documentId',
    automationLevel:     'all',
    retryable:           true,
    maxRetries:          2,
    pollingInterval:     null,
    successCondition:    'document.status === "validated"',
    checkpointType:      null,
    humanActionRequired: false,
    timeoutHours:        1,
  },
  {
    stepId:              'classify',
    label:               'Classify Document Type',
    operation:           'documentExtractionAgent.classifyDocument',
    inputSource:         'validate.documentId',
    automationLevel:     'all',
    retryable:           true,
    maxRetries:          2,
    pollingInterval:     null,
    successCondition:    'document.documentType !== null',
    checkpointType:      null,
    humanActionRequired: false,
    timeoutHours:        1,
  },
  {
    stepId:              'queue',
    label:               'Queue for Processing',
    operation:           'workflowOrchestrator.queueDocument',
    inputSource:         'classify.documentId',
    automationLevel:     'all',
    retryable:           false,
    maxRetries:          null,
    pollingInterval:     null,
    successCondition:    'document.status === "queued"',
    checkpointType:      null,
    humanActionRequired: false,
    timeoutHours:        null,
  },
]

export const documentIntakeWorkflow: WorkflowSequence = {
  id:            DOCUMENT_INTAKE_WORKFLOW_ID,
  steps,
  onStepFailure: 'pause_and_notify',
}
