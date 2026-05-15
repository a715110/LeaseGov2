/**
 * extractionAgent.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:  Frontend representation of the Extraction Agent.
 *                Handles structured field extraction display, per-field
 *                confidence scoring, review flag logic, and extraction
 *                result summary rendering.
 *
 * Responsibility boundary:
 *   - Structured field extraction only: maps OCR raw text → typed field values.
 *   - Does NOT handle document intake (→ documentIntakeAgent.ts)
 *   - Does NOT perform OCR (→ ocrAgent.ts)
 *
 * // TODO: Backend integration required
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ExtractionField } from '../../types/documents/ExtractionField'
import type { ExtractionResult } from '../../types/documents/ExtractionResult'

export const EXTRACTION_AGENT_NAME = 'ExtractionAgent'
export const EXTRACTION_AGENT_LABEL = 'Extraction Agent'

// ─── Confidence thresholds ────────────────────────────────────────────────────

export const EXTRACTION_CONFIDENCE_THRESHOLDS = {
  HIGH:   0.85,
  MEDIUM: 0.65,
  LOW:    0.0,
} as const

export type ExtractionConfidenceTier = 'high' | 'medium' | 'low'

// ─── Field-level helpers ──────────────────────────────────────────────────────

/**
 * Classifies a field's confidence score into a display tier.
 */
export function classifyFieldConfidence(score: number): ExtractionConfidenceTier {
  if (score >= EXTRACTION_CONFIDENCE_THRESHOLDS.HIGH)   return 'high'
  if (score >= EXTRACTION_CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Returns the fields that require human review.
 * A field requires review if explicitly flagged or confidence is below MEDIUM.
 */
export function getFieldsRequiringReview(fields: ExtractionField[]): ExtractionField[] {
  return fields.filter(
    f => f.requiresReview || f.confidence < EXTRACTION_CONFIDENCE_THRESHOLDS.MEDIUM
  )
}

/**
 * Returns the fields that are high-confidence and do not require review.
 */
export function getAutoApprovedFields(fields: ExtractionField[]): ExtractionField[] {
  return fields.filter(
    f => !f.requiresReview && f.confidence >= EXTRACTION_CONFIDENCE_THRESHOLDS.HIGH
  )
}

// ─── Result-level helpers ──────────────────────────────────────────────────────────────────────────────

/**
 * Computes the overall extraction confidence from field-level scores.
 * Returns 0 if no fields are present.
 */
export function computeOverallConfidence(fields: ExtractionField[]): number {
  if (fields.length === 0) return 0
  const sum = fields.reduce((acc, f) => acc + f.confidence, 0)
  return sum / fields.length
}

/**
 * Returns a summary string for the extraction result for display in the UI.
 */
export function formatExtractionSummary(result: ExtractionResult): string {
  const total = result.extractedFields.length
  const reviewCount = getFieldsRequiringReview(result.extractedFields).length
  const autoCount = getAutoApprovedFields(result.extractedFields).length
  const overallPct = Math.round(result.overallConfidence * 100)
  return `${total} fields extracted — ${autoCount} auto-approved, ${reviewCount} require review (${overallPct}% avg confidence)`
}

/**
 * Returns true if the extraction result is complete enough to advance the workflow.
 * Uses the ExtractionResult.requiresHumanReview flag as the authoritative signal.
 */
export function isExtractionReadyToAdvance(result: ExtractionResult): boolean {
  return result.isConfirmed || (!result.requiresHumanReview && result.status === 'completed')
}
