/**
 * Runtime tenant context available throughout the application.
 */
import type { TenantConfiguration } from './TenantConfiguration'

export interface TenantContext {
  organizationId: string
  subdomain: string
  displayName: string
  logoUrl: string | null
  tenantConfig: TenantConfiguration
  isResolved: boolean
  isLoading: boolean
  error: string | null
}
