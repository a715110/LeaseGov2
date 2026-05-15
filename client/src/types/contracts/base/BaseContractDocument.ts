/**
 * Foundation type for every contract document type.
 * Domain-specific document types extend this.
 */
import type { ContractType } from './ContractType'

export interface BaseContractDocument {
  id: string
  organizationId: string
  contractId: string
  contractType: ContractType
  fileName: string
  fileSize: number
  mimeType: string
  storageKey: string
  uploadedAt: Date
  uploadedByUserId: string
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractionStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'requires_review'
  isConfirmed: boolean
  confirmedAt: Date | null
  confirmedByUserId: string | null
}
