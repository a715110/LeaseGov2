/**
 * Document type constants.
 *
 * Used by document upload, extraction, and library screens.
 * Document types determine which extraction pipeline is used
 * and which fields are expected in the extraction result.
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 10 (Constants)
 */

export const DOCUMENT_TYPES = {
  // Lease documents
  LEASE_AGREEMENT:          'lease_agreement',
  LEASE_AMENDMENT:          'lease_amendment',
  LEASE_RENEWAL:            'lease_renewal',
  LEASE_TERMINATION:        'lease_termination',
  LEASE_ASSIGNMENT:         'lease_assignment',
  // Supporting documents
  PROPERTY_SURVEY:          'property_survey',
  FLOOR_PLAN:               'floor_plan',
  TITLE_DEED:               'title_deed',
  INSURANCE_CERTIFICATE:    'insurance_certificate',
  COMPLIANCE_CERTIFICATE:   'compliance_certificate',
  // Financial documents
  RENT_SCHEDULE:            'rent_schedule',
  INVOICE:                  'invoice',
  PAYMENT_RECEIPT:          'payment_receipt',
  // Correspondence
  NOTICE_LETTER:            'notice_letter',
  CORRESPONDENCE:           'correspondence',
  // Other
  OTHER:                    'other',
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

/** Human-readable labels for each document type. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  lease_agreement:        'Lease Agreement',
  lease_amendment:        'Lease Amendment',
  lease_renewal:          'Lease Renewal',
  lease_termination:      'Lease Termination',
  lease_assignment:       'Lease Assignment',
  property_survey:        'Property Survey',
  floor_plan:             'Floor Plan',
  title_deed:             'Title Deed',
  insurance_certificate:  'Insurance Certificate',
  compliance_certificate: 'Compliance Certificate',
  rent_schedule:          'Rent Schedule',
  invoice:                'Invoice',
  payment_receipt:        'Payment Receipt',
  notice_letter:          'Notice Letter',
  correspondence:         'Correspondence',
  other:                  'Other',
}

/** Document types that support AI extraction. */
export const EXTRACTABLE_DOCUMENT_TYPES: DocumentType[] = [
  DOCUMENT_TYPES.LEASE_AGREEMENT,
  DOCUMENT_TYPES.LEASE_AMENDMENT,
  DOCUMENT_TYPES.LEASE_RENEWAL,
  DOCUMENT_TYPES.LEASE_TERMINATION,
  DOCUMENT_TYPES.RENT_SCHEDULE,
]

/** Accepted MIME types for document upload. */
export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/tiff',
] as const

/** Maximum document file size in bytes (50 MB). */
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 50 * 1024 * 1024
