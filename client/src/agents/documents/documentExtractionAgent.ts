/**
 * Document Extraction Agent — frontend representation.
 *
 * Handles OCR initiation, field extraction, and confidence scoring display.
 *
 * // TODO: Backend integration required
 */
import type { ExtractionField } from '../../types/documents/ExtractionField'

export const DOCUMENT_EXTRACTION_AGENT_NAME = 'DocumentExtractionAgent'
export const DOCUMENT_EXTRACTION_AGENT_LABEL = 'Document Extraction Agent'

export const CONFIDENCE_THRESHOLDS = {
  HIGH:   0.85,
  MEDIUM: 0.65,
  LOW:    0.0,
} as const

export type ConfidenceTier = 'high' | 'medium' | 'low'

/**
 * Classifies a confidence score into a display tier.
 */
export function classifyConfidence(score: number): ConfidenceTier {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH)   return 'high'
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Returns the fields that require human review.
 */
export function getFieldsRequiringReview(fields: ExtractionField[]): ExtractionField[] {
  return fields.filter(f => f.requiresReview || (f.confidence !== null && f.confidence < CONFIDENCE_THRESHOLDS.MEDIUM))
}

/**
 * Computes the overall extraction confidence from field-level scores.
 */
export function computeOverallConfidence(fields: ExtractionField[]): number {
  if (fields.length === 0) return 0
  const sum = fields.reduce((acc, f) => acc + f.confidence, 0)
  return sum / fields.length
}
