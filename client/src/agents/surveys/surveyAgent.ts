/**
 * surveyAgent.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:  Frontend representation of the Survey Agent.
 *                Handles survey delivery scheduling display, response tracking,
 *                completion status, reminder logic display, and survey result
 *                summary rendering.
 *
 * Responsibility boundary:
 *   - Survey lifecycle only: delivery, response collection, completion tracking.
 *   - Does NOT handle reassessment recommendations (→ reassessmentAgent.ts)
 *   - Survey Agent is triggered by the workflow orchestrator after a lease
 *     reaches a reassessment trigger point (e.g., 90 days before expiry).
 *
 * Survey types covered:
 *   - Tenant satisfaction survey (pre-reassessment)
 *   - Property condition survey (pre-reassessment)
 *   - Post-onboarding confirmation survey
 *
 * // TODO: Backend integration required
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Survey } from '../../types/surveys/Survey'
import type { SurveyResponse } from '../../types/surveys/SurveyResponse'

export const SURVEY_AGENT_NAME = 'SurveyAgent'
export const SURVEY_AGENT_LABEL = 'Survey Agent'

// ─── Completion thresholds ────────────────────────────────────────────────────

/** Minimum response rate (0–1) required to consider a survey actionable. */
export const SURVEY_MIN_RESPONSE_RATE = 0.5

/** Days after delivery before a reminder is sent if no response received. */
export const SURVEY_REMINDER_DAYS = 7

// ─── Status display helpers ───────────────────────────────────────────────────

/**
 * Returns a user-facing label for the survey status.
 */
export function getSurveyStatusLabel(survey: Survey): string {
  switch (survey.status) {
    case 'draft':    return 'Draft'
    case 'active':   return 'Active — awaiting responses'
    case 'closed':   return 'Closed'
    case 'archived': return 'Archived'
    default:         return 'Unknown'
  }
}

// ─── Response tracking helpers ────────────────────────────────────────────────

/**
 * Computes the response rate for a survey (0–1) given the total responses and recipient count.
 * Returns 0 if recipientCount is 0 or not provided.
 */
export function computeResponseRate(responseCount: number, recipientCount: number): number {
  if (recipientCount === 0) return 0
  return responseCount / recipientCount
}

/**
 * Returns true if the survey has enough responses to be considered actionable.
 */
export function isSurveyActionable(responseCount: number, recipientCount: number): boolean {
  return computeResponseRate(responseCount, recipientCount) >= SURVEY_MIN_RESPONSE_RATE
}

/**
 * Returns true if a reminder should be sent for a survey.
 * Condition: survey is active, no responses yet, and SURVEY_REMINDER_DAYS have passed since dueDate.
 */
export function shouldSendReminder(survey: Survey, responseCount: number): boolean {
  if (survey.status !== 'active') return false
  if (responseCount > 0) return false
  if (!survey.dueDate) return false
  const daysSinceDue = (Date.now() - new Date(survey.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceDue >= SURVEY_REMINDER_DAYS
}

// ─── Result summary helpers ───────────────────────────────────────────────────

/**
 * Returns a summary string for the survey for display in the workflow panel.
 */
export function formatSurveySummary(survey: Survey, responseCount: number, recipientCount: number): string {
  const rate = Math.round(computeResponseRate(responseCount, recipientCount) * 100)
  return `${responseCount} of ${recipientCount} responded (${rate}%) — ${getSurveyStatusLabel(survey)}`
}

/**
 * Returns the count of submitted responses.
 */
export function countSubmittedResponses(responses: SurveyResponse[]): number {
  return responses.filter(r => r.status === 'submitted').length
}
