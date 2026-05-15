/**
 * Workflow Orchestrator — frontend representation of the orchestrator agent.
 *
 * The orchestrator coordinates all specialized agents across a workflow sequence.
 * This file provides display utilities and step-to-agent mapping for the UI.
 *
 * // TODO: Backend integration required
 */
export const ORCHESTRATOR_AGENT_NAME = 'WorkflowOrchestrator'
export const ORCHESTRATOR_AGENT_LABEL = 'Workflow Orchestrator'

/**
 * Maps workflow step IDs to the responsible agent name.
 * Used by WorkflowHistoryPanel to display the correct agent label.
 */
export const STEP_TO_AGENT_MAP: Record<string, string> = {
  step_01_document_upload:    'human',
  step_02_ocr_processing:     'DocumentExtractionAgent',
  step_03_field_extraction:   'DocumentExtractionAgent',
  step_04_extraction_review:  'human',
  step_05_data_validation:    'PropertyLeaseAgent',
  step_06_survey_dispatch:    'NotificationAgent',
  step_07_survey_completion:  'human',
  step_08_reassessment_analysis: 'ReassessmentAgent',
  step_09_reassessment_review:   'human',
  step_10_contract_preparation:  'PropertyLeaseAgent',
  step_11_approval:              'human',
  step_12_archival:              'PropertyLeaseAgent',
}

/**
 * Returns the agent label for a given workflow step.
 */
export function getAgentForStep(stepId: string): string {
  return STEP_TO_AGENT_MAP[stepId] ?? 'WorkflowOrchestrator'
}
