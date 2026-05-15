/**
 * A single extracted field from a document.
 */
export interface ExtractionField {
  fieldName: string
  fieldLabel: string
  extractedValue: string | null
  confidence: number            // 0.0 – 1.0
  sourcePageNumber: number | null
  sourceBoundingBox: BoundingBox | null
  requiresReview: boolean
  reviewReason: string | null
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
}
