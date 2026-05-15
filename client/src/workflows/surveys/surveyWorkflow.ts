/**
 * Survey Workflow — dispatch and collection sequence.
 *
 * Steps: dispatch → await response → close survey
 */
import type { WorkflowSequence } from '../../types/workflows/WorkflowStep'

export const SURVEY_WORKFLOW_ID = 'survey_v1'

export const surveyWorkflow: WorkflowSequence = {
  id: SURVEY_WORKFLOW_ID,
  onStepFailure: 'pause_and_notify',
  steps: [
    {
      stepId: 'sv_step_01_dispatch',
      label: 'Dispatch Survey',
      operation: 'dispatchSurvey',
      inputSource: 'trigger',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 2,
      pollingInterval: null,
      successCondition: 'survey.status === "active"',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 1,
    },
    {
      stepId: 'sv_step_02_await',
      label: 'Await Response',
      operation: 'awaitSurveyResponse',
      inputSource: 'sv_step_01_dispatch',
      automationLevel: 'manual',
      retryable: false,
      maxRetries: null,
      pollingInterval: null,
      successCondition: 'surveyResponse.status === "submitted"',
      checkpointType: null,
      humanActionRequired: true,
      timeoutHours: 168,
    },
    {
      stepId: 'sv_step_03_close',
      label: 'Close Survey',
      operation: 'closeSurvey',
      inputSource: 'sv_step_02_await',
      automationLevel: 'all',
      retryable: true,
      maxRetries: 2,
      pollingInterval: null,
      successCondition: 'survey.status === "closed"',
      checkpointType: null,
      humanActionRequired: false,
      timeoutHours: 1,
    },
  ],
}
