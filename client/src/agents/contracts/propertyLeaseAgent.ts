/**
 * Property Lease Agent — frontend representation of the property lease agent.
 *
 * This file defines the agent's identity, capabilities, and decision display logic.
 * It does NOT contain backend agent logic — that lives server-side.
 *
 * Used by:
 * - AgentStatusPanel component
 * - WorkflowHistoryPanel (actorLabel resolution)
 * - AgentDecisionCard component
 *
 * // TODO: Backend integration required — agent decisions come from API
 */
import type { AgentStatus } from '../../types/agents/AgentStatus'
import type { AgentDecision } from '../../types/agents/AgentDecision'
import type { AgentException } from '../../types/agents/AgentException'

export const PROPERTY_LEASE_AGENT_NAME = 'PropertyLeaseAgent'
export const PROPERTY_LEASE_AGENT_LABEL = 'Property Lease Agent'
export const PROPERTY_LEASE_AGENT_DESCRIPTION =
  'Handles property lease onboarding, reassessment analysis, and contract lifecycle management.'

export const PROPERTY_LEASE_AGENT_CAPABILITIES = [
  'Document extraction',
  'Lease term validation',
  'Reassessment analysis',
  'Comparable property research',
  'Contract preparation',
  'Workflow orchestration',
] as const

/**
 * Formats an agent decision for display in the UI.
 * Returns a human-readable summary of the decision.
 */
export function formatAgentDecision(decision: AgentDecision): string {
  return `${PROPERTY_LEASE_AGENT_LABEL} recommended: ${decision.recommendedAction} (confidence: ${Math.round(decision.confidence * 100)}%)`
}

/**
 * Returns the urgency label for an agent exception.
 */
export function getExceptionUrgencyLabel(exception: AgentException): string {
  const labels = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' }
  return labels[exception.urgency]
}

/**
 * Determines if the agent is currently blocking a workflow step.
 */
export function isAgentBlocking(status: AgentStatus): boolean {
  return status.status === 'awaiting_human' || status.status === 'exception'
}
