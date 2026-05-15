/**
 * User roles in the LeaseGov platform.
 */
export type UserRole =
  | 'document_submitter'
  | 'preparer'
  | 'reviewer'
  | 'approver'
  | 'accountant'
  | 'controller'
  | 'business_submitter'
  | 'auditor'
  | 'lease_admin'
  | 'superadmin'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  document_submitter: 'Document Submitter',
  preparer:           'Preparer',
  reviewer:           'Reviewer',
  approver:           'Approver',
  accountant:         'Accountant',
  controller:         'Controller',
  business_submitter: 'Business Submitter',
  auditor:            'Auditor',
  lease_admin:        'Lease Admin',
  superadmin:         'SuperAdmin',
}
