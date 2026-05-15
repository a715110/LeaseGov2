/**
 * Contract Registry Service — resolves which contract domains are active for an organization.
 *
 * The contract registry is the domain-expansion control point.
 * It determines which contract types (property lease, equipment lease, service contract)
 * are enabled for a given tenant, and which workflow sequences are available.
 *
 * This service is read at app bootstrap and consumed by:
 * - AppShell (sidebar navigation — shows/hides contract type nav groups)
 * - ScreenGate (layer 1 check — contract-type screens are gated by registry)
 * - Domain expansion pattern — new contract types are registered here first
 *
 * Architecture: MASTER_FRONTEND_ARCHITECTURE_V4 — Part 6 (Services)
 *
 * // TODO: Backend integration required
 */
import { SCREEN_REGISTRY_ADMIN_URL } from '../../constants/apiConfig'
import type { ContractType } from '../../types/contracts/base/ContractType'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractRegistryEntry {
  contractType: ContractType
  isEnabled: boolean
  displayLabel: string
  listPath: string
  workflowsEnabled: string[]
  phase: 'mvp' | 'phase_2' | 'future'
}

export interface ContractRegistry {
  organizationId: string
  entries: ContractRegistryEntry[]
  fetchedAt: Date
}

export interface GetContractRegistryInput {
  organizationId: string
}

export interface GetContractRegistryResult {
  registry: ContractRegistry
}

export interface UpdateContractRegistryEntryInput {
  organizationId: string
  contractType: ContractType
  isEnabled: boolean
}

export interface UpdateContractRegistryEntryResult {
  entry: ContractRegistryEntry
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

let _cachedContractRegistry: ContractRegistry | null = null
let _cacheOrganizationId: string | null = null

// ─── Service operations ───────────────────────────────────────────────────────

/**
 * Fetches the contract registry for an organization.
 * Cached in memory for the session.
 *
 * MCP NOTE: This operation will be exposed as MCP tool 'getContractRegistry'.
 *
 * // TODO: Backend integration required
 * // GET ${SCREEN_REGISTRY_ADMIN_URL}/contracts?organizationId={organizationId}
 */
export async function getContractRegistry(
  input: GetContractRegistryInput
): Promise<GetContractRegistryResult | ServiceError> {
  if (_cachedContractRegistry && _cacheOrganizationId === input.organizationId) {
    return { registry: _cachedContractRegistry }
  }
  void SCREEN_REGISTRY_ADMIN_URL
  // TODO: Replace with real API call
  throw new Error('Not implemented — backend integration required')
}

/**
 * Returns true if a given contract type is enabled for an organization.
 *
 * SCAFFOLD MODE: Returns true for property_lease (MVP) and false for Phase 2 types
 * when no registry has been loaded. Replace with fail-closed behaviour post-backend.
 */
export function isContractTypeEnabled(contractType: ContractType): boolean {
  if (!_cachedContractRegistry) {
    // Scaffold mode: MVP types enabled, Phase 2 types disabled
    const mvpTypes: ContractType[] = ['PROPERTY_LEASE']
    return mvpTypes.includes(contractType)
  }
  const entry = _cachedContractRegistry.entries.find(e => e.contractType === contractType)
  return entry?.isEnabled ?? false
}

/**
 * Returns all enabled contract types for the current organization.
 */
export function getEnabledContractTypes(): ContractType[] {
  if (!_cachedContractRegistry) {
    return ['PROPERTY_LEASE']
  }
  return _cachedContractRegistry.entries
    .filter(e => e.isEnabled)
    .map(e => e.contractType)
}

/**
 * Updates the enabled state of a contract type for an organization.
 * SuperAdmin operation only.
 *
 * // TODO: Backend integration required
 * // PATCH ${SCREEN_REGISTRY_ADMIN_URL}/contracts/:contractType
 */
export async function updateContractRegistryEntry(
  input: UpdateContractRegistryEntryInput
): Promise<UpdateContractRegistryEntryResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Clears the in-memory contract registry cache.
 * Call on logout or organization switch.
 */
export function clearContractRegistryCache(): void {
  _cachedContractRegistry = null
  _cacheOrganizationId = null
}
