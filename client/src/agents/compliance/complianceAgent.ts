/**
 * Compliance Agent — frontend representation.
 *
 * Monitors contracts for compliance issues and generates audit trail entries.
 *
 * // TODO: Backend integration required
 */
export const COMPLIANCE_AGENT_NAME = 'ComplianceAgent'
export const COMPLIANCE_AGENT_LABEL = 'Compliance Agent'

export const COMPLIANCE_CHECK_TYPES = [
  'lease_expiry_warning',
  'reassessment_overdue',
  'missing_documents',
  'approval_deadline_breach',
  'segregation_of_duties_violation',
] as const

export type ComplianceCheckType = typeof COMPLIANCE_CHECK_TYPES[number]

export const COMPLIANCE_CHECK_LABELS: Record<ComplianceCheckType, string> = {
  lease_expiry_warning:            'Lease Expiry Warning',
  reassessment_overdue:            'Reassessment Overdue',
  missing_documents:               'Missing Documents',
  approval_deadline_breach:        'Approval Deadline Breach',
  segregation_of_duties_violation: 'Segregation of Duties Violation',
}
