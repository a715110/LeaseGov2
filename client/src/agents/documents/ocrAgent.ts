/**
 * ocrAgent.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:  Frontend representation of the OCR Agent.
 *                Handles OCR job status display, raw text result rendering,
 *                page-level OCR confidence, and OCR retry logic display.
 *
 * Responsibility boundary:
 *   - OCR only: raw text extraction from document images/pages.
 *   - Does NOT handle document intake (→ documentIntakeAgent.ts)
 *   - Does NOT perform structured field extraction (→ extractionAgent.ts)
 *
 * // TODO: Backend integration required
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { OcrResult } from '../../types/documents/OcrResult'

export const OCR_AGENT_NAME = 'OcrAgent'
export const OCR_AGENT_LABEL = 'OCR Agent'

// ─── OCR quality thresholds ───────────────────────────────────────────────────

export const OCR_CONFIDENCE_THRESHOLDS = {
  HIGH:   0.90,
  MEDIUM: 0.70,
  LOW:    0.0,
} as const

export type OcrQualityTier = 'high' | 'medium' | 'low' | 'not_run'

// ─── Quality helpers ──────────────────────────────────────────────────────────

/**
 * Classifies the OcrResult's ocrQuality field into the display tier type.
 * Returns 'not_run' if ocrQuality is null (OCR not yet completed).
 */
export function classifyOcrQuality(ocrQuality: OcrResult['ocrQuality']): OcrQualityTier {
  if (ocrQuality === null) return 'not_run'
  return ocrQuality  // 'high' | 'medium' | 'low' already match OcrQualityTier
}

/**
 * Returns true if the OCR result quality is sufficient to proceed to extraction.
 * Low quality or null triggers human review of the raw OCR text.
 */
export function isOcrQualitySufficient(result: OcrResult): boolean {
  return result.ocrQuality === 'high' || result.ocrQuality === 'medium'
}

/**
 * Returns a user-facing label for the OCR quality tier.
 */
export function getOcrQualityLabel(tier: OcrQualityTier): string {
  switch (tier) {
    case 'high':    return 'High quality'
    case 'medium':  return 'Acceptable quality'
    case 'low':     return 'Low quality — review recommended'
    case 'not_run': return 'OCR not yet run'
  }
}

/**
 * Returns a summary of the OCR result for display in the document panel.
 */
export function formatOcrSummary(result: OcrResult): string {
  const pageCount = result.pageCount ?? 0
  const tier = classifyOcrQuality(result.ocrQuality)
  const qualityLabel = getOcrQualityLabel(tier)
  return `${pageCount} page${pageCount !== 1 ? 's' : ''} — ${qualityLabel}`
}
