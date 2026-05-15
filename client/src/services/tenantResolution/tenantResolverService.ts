/**
 * Tenant Resolver Service — resolves subdomain to tenant configuration.
 * Called on app load before any other component renders.
 *
 * // TODO: Backend integration required
 */
import { TENANT_RESOLVER_URL, TENANT_CONFIG_URL } from '../../constants/apiConfig'
import type { TenantConfiguration } from '../../types/shared/TenantConfiguration'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface ResolveTenantInput {
  subdomain: string
}
export interface ResolveTenantResult {
  success: true
  organizationId: string
  displayName: string
  logoUrl: string | null
  tenantConfig: TenantConfiguration
}

/**
 * Resolves a subdomain to a tenant's organizationId and configuration.
 * If subdomain is unknown, returns ServiceError (not_found).
 * The frontend shows an error page — not a login screen — to avoid confirming subdomain existence.
 *
 * // TODO: Backend integration required
 * // GET ${TENANT_RESOLVER_URL}?subdomain={subdomain}
 */
export async function resolveTenant(
  input: ResolveTenantInput
): Promise<ResolveTenantResult | ServiceError> {
  void TENANT_RESOLVER_URL
  void TENANT_CONFIG_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
