/**
 * Contract status constants and display metadata.
 */
export const CONTRACT_STATUSES = [
  'draft',
  'under_review',
  'pending_approval',
  'approved',
  'archived',
] as const

export type ContractStatusConst = typeof CONTRACT_STATUSES[number]

export const CONTRACT_STATUS_LABELS: Record<ContractStatusConst, string> = {
  draft:            'Draft',
  under_review:     'Under Review',
  pending_approval: 'Pending Approval',
  approved:         'Approved',
  archived:         'Archived',
}

export const CONTRACT_STATUS_BADGE_VARIANTS: Record<ContractStatusConst, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft:            'outline',
  under_review:     'secondary',
  pending_approval: 'secondary',
  approved:         'default',
  archived:         'outline',
}
