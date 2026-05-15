/**
 * Property lease document type — extends BaseContractDocument.
 */
import type { BaseContractDocument } from '../base/BaseContractDocument'

export type PropertyLeaseDocumentCategory =
  | 'lease_agreement'
  | 'lease_variation'
  | 'rent_review_notice'
  | 'renewal_notice'
  | 'termination_notice'
  | 'inspection_report'
  | 'correspondence'
  | 'other'

export interface PropertyLeaseDocument extends BaseContractDocument {
  contractType: 'PROPERTY_LEASE'
  documentCategory: PropertyLeaseDocumentCategory
  effectiveDate: Date | null
  expiryDate: Date | null
}
