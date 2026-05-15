/**
 * Property Lease Reassessment Workflow — standalone reassessment sequence.
 *
 * Used when a reassessment is triggered independently of onboarding.
 * Steps: analysis → review → update → approval
 */
import type { WorkflowSequence } from '../../types/workflows/WorkflowStep'

export const PROPERTY_LEASE_REASSESSMENT_WORKFLOW_ID = 'property_lease_reassessment_v1'

export const propertyLeaseReassessmentWorkflow: WorkflowSequence = {
  id: PROPERTY_LEASE_REASSESSMENT_WORKFLOW_ID,
  onStepFailure: 'pause_and_notify',
  steps: [
    {
      stepId: 'ra_step_01_analysis',
      label: 'Reassessment Analysis',
      operation: 'analyzeReassessment',
      inputSource: 'trigger',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 2,
      pollingInterval: null,
      successCondition: 'reassessment.agentRecommendation !== null',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 4,
    },
    {
      stepId: 'ra_step_02_review',
      label: 'Reassessment Review',
      operation: 'reviewReassessment',
      inputSource: 'ra_step_01_analysis',
      automationLevel: 'collaborative | manual',
      retryable: false,
      maxRetries: null,
      pollingInterval: null,
      successCondition: 'reassessment.humanDecision !== null',
      checkpointType: 'reassessment_review',
      humanActionRequired: true,
      timeoutHours: 72,
    },
    {
      stepId: 'ra_step_03_update',
      label: 'Update Lease Record',
      operation: 'updatePropertyLease',
      inputSource: 'ra_step_02_review',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 2,
      pollingInterval: null,
      successCondition: 'lease.assessedValue === reassessment.finalValue',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 1,
    },
    {
      stepId: 'ra_step_04_approval',
      label: 'Final Approval',
      operation: 'approveReassessment',
      inputSource: 'ra_step_03_update',
      automationLevel: 'manual',
      retryable: false,
      maxRetries: null,
      pollingInterval: null,
      successCondition: 'reassessment.status === "approved"',
      checkpointType: 'final_approval',
      humanActionRequired: true,
      timeoutHours: 96,
    },
  ],
}
