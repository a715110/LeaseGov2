/**
 * useDocumentExtraction.ts
 * hooks/documents/
 *
 * V4 Architecture — hooks/documents/ layer
 * Manages document extraction state for a single document:
 *   - OCR result and quality assessment
 *   - Extracted field list with confidence scores
 *   - Extraction status lifecycle
 *   - Manual field override tracking
 *   - Review readiness check
 *
 * Used by: ExtractionAiWorkspace, ExtractionManualWorkspace,
 *          ExtractionVerification, ExtractionTracker
 */

import { useCallback, useEffect, useState } from 'react';
import * as extractionService from '../../services/documents/extractionService';
import type { ExtractionField } from '../../types/documents/ExtractionField';
import type { ExtractionResult } from '../../types/documents/ExtractionResult';
import type { OcrResult } from '../../types/documents/OcrResult';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExtractionPhase =
  | 'idle'
  | 'ocr_pending'
  | 'ocr_complete'
  | 'extraction_pending'
  | 'extraction_complete'
  | 'review_required'
  | 'verified'
  | 'error';

export interface UseDocumentExtractionState {
  /** Current phase of the extraction lifecycle */
  phase: ExtractionPhase;
  /** OCR result from the document scanner */
  ocrResult: OcrResult | null;
  /** Structured extraction result with all fields */
  extractionResult: ExtractionResult | null;
  /** Fields that have been manually overridden by a reviewer */
  overriddenFields: Record<string, ExtractionField>;
  /** Whether the extraction is ready for human review sign-off */
  isReadyForReview: boolean;
  /** Whether all required fields are verified (auto + manual) */
  isVerified: boolean;
  /** Number of fields below the confidence threshold */
  lowConfidenceCount: number;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if the last operation failed */
  error: string | null;
}

export interface UseDocumentExtractionActions {
  /** Trigger OCR for the given document */
  triggerOcr: (documentId: string) => Promise<void>;
  /** Trigger field extraction after OCR is complete */
  triggerExtraction: (documentId: string) => Promise<void>;
  /** Override a single extracted field value */
  overrideField: (fieldKey: string, value: string, reason?: string) => void;
  /** Clear a manual override and revert to the extracted value */
  clearOverride: (fieldKey: string) => void;
  /** Mark the extraction as verified by a human reviewer */
  markVerified: () => void;
  /** Reset all state back to idle */
  reset: () => void;
}

export type UseDocumentExtractionReturn = UseDocumentExtractionState &
  UseDocumentExtractionActions;

// ---------------------------------------------------------------------------
// Confidence threshold — fields below this value require human review
// ---------------------------------------------------------------------------

const LOW_CONFIDENCE_THRESHOLD = 0.75;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the full extraction lifecycle for a single document.
 *
 * @param documentId - Optional document ID to auto-load on mount.
 *                     If omitted, call triggerOcr() and triggerExtraction() manually.
 */
export function useDocumentExtraction(
  documentId?: string
): UseDocumentExtractionReturn {
  const [phase, setPhase] = useState<ExtractionPhase>('idle');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [overriddenFields, setOverriddenFields] = useState<
    Record<string, ExtractionField>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const lowConfidenceCount =
    extractionResult?.extractedFields?.filter(
      (f) => (f.confidence ?? 1) < LOW_CONFIDENCE_THRESHOLD
    ).length ?? 0;

  const isReadyForReview =
    phase === 'extraction_complete' || phase === 'review_required';

  const isVerified = phase === 'verified';

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const triggerOcr = useCallback(async (docId: string) => {
    setIsLoading(true);
    setError(null);
    setPhase('ocr_pending');
    try {
      // TODO: wire to extractionService.triggerOcr when backend is ready
      // const result = await extractionService.triggerOcr({ documentId: docId });
      // setOcrResult(result);
      void docId; // suppress unused-variable warning until wired
      setPhase('ocr_complete');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'OCR failed unexpectedly';
      setError(message);
      setPhase('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerExtraction = useCallback(async (docId: string) => {
    setIsLoading(true);
    setError(null);
    setPhase('extraction_pending');
    try {
      // TODO: wire to extractionService.extractFields when backend is ready
      // const result = await extractionService.extractFields({ documentId: docId });
      // setExtractionResult(result);
      void docId; // suppress unused-variable warning until wired
      setPhase('extraction_complete');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Extraction failed unexpectedly';
      setError(message);
      setPhase('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const overrideField = useCallback(
    (fieldKey: string, value: string, reason?: string) => {
      setOverriddenFields((prev) => ({
        ...prev,
        [fieldKey]: {
          fieldName: fieldKey,
          fieldLabel: fieldKey,
          extractedValue: value,
          confidence: 1.0, // manual override is treated as full confidence
          sourcePageNumber: null,
          sourceBoundingBox: null,
          requiresReview: false,
          reviewReason: reason ?? null,
        } satisfies ExtractionField,
      }));
      // Promote to review_required if still in extraction_complete
      setPhase((prev) =>
        prev === 'extraction_complete' ? 'review_required' : prev
      );
    },
    []
  );

  const clearOverride = useCallback((fieldKey: string) => {
    setOverriddenFields((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  }, []);

  const markVerified = useCallback(() => {
    setPhase('verified');
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setOcrResult(null);
    setExtractionResult(null);
    setOverriddenFields({});
    setIsLoading(false);
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-load when documentId is provided on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (documentId) {
      triggerOcr(documentId).then(() => triggerExtraction(documentId));
    }
    // Only run on mount or when documentId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return {
    phase,
    ocrResult,
    extractionResult,
    overriddenFields,
    isReadyForReview,
    isVerified,
    lowConfidenceCount,
    isLoading,
    error,
    triggerOcr,
    triggerExtraction,
    overrideField,
    clearOverride,
    markVerified,
    reset,
  };
}
