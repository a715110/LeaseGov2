/**
 * Permission definition for role-based access control.
 */
export interface Permission {
  action: string                // e.g. 'contracts:read', 'contracts:approve'
  resource: string              // e.g. 'property_lease', 'document', 'workflow'
  conditions: Record<string, unknown> | null
}

export interface UserPermissions {
  userId: string
  organizationId: string
  roles: string[]
  permissions: Permission[]
  isSuperAdmin: boolean
}
