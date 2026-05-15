/**
 * A single step definition within a workflow sequence.
 */
export type AutomationLevel = 'all' | 'collaborative | manual' | 'manual'

export interface WorkflowStep {
  stepId: string
  label: string
  operation: string
  inputSource: string | null
  automationLevel: AutomationLevel
  retryable: boolean
  maxRetries: number | null
  pollingInterval: number | null
  successCondition: string | null
  checkpointType: string | null
  humanActionRequired: boolean
  timeoutHours: number | null
}

export interface WorkflowSequence {
  id: string
  steps: WorkflowStep[]
  onStepFailure: 'pause_and_notify' | 'retry' | 'skip' | 'abort'
}
