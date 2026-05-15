/**
 * Reassessment Agent — frontend representation.
 *
 * Handles comparable property research and reassessment recommendation display.
 *
 * // TODO: Backend integration required
 */
import type { PropertyLeaseReassessment } from '../../types/contracts/propertyLease/PropertyLeaseReassessment'

export const REASSESSMENT_AGENT_NAME = 'ReassessmentAgent'
export const REASSESSMENT_AGENT_LABEL = 'Reassessment Agent'

/**
 * Formats the agent's recommendation for display.
 */
export function formatReassessmentRecommendation(
  reassessment: PropertyLeaseReassessment
): string {
  if (!reassessment.agentRecommendation) return 'No recommendation yet'
  const confidence = reassessment.agentConfidence !== null
    ? ` (${Math.round(reassessment.agentConfidence * 100)}% confidence)`
    : ''
  return `${reassessment.agentRecommendation}${confidence}`
}

/**
 * Returns true if the reassessment requires human review.
 */
export function requiresHumanReview(reassessment: PropertyLeaseReassessment): boolean {
  return (
    reassessment.agentConfidence === null ||
    reassessment.agentConfidence < 0.75 ||
    reassessment.humanDecision === null
  )
}
