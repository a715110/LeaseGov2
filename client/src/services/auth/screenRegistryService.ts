/**
 * Screen Registry Service — fetches, caches, and exposes registry query helpers.
 *
 * The screen registry is fetched once per session and cached in memory.
 * ScreenGate uses this service to perform the first layer of its two-layer check.
 *
 * Two-layer check (ScreenGate):
 * Layer 1: Is the screen enabled in the registry? (this service)
 * Layer 2: Does the user have the required role? (permissionsService)
 *
 * // TODO: Backend integration required
 */
import { SCREEN_REGISTRY_URL } from '../../constants/apiConfig'
import type { ScreenRegistry, ScreenRegistryEntry } from '../../types/shared/ScreenRegistryEntry'
import type { ScreenKey } from '../../constants/screenKeys'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

// ─── In-memory cache ──────────────────────────────────────────────────────────
let _cachedRegistry: ScreenRegistry | null = null
let _cacheOrganizationId: string | null = null

/**
 * Fetches the screen registry for an organization.
 * Caches the result in memory for the session.
 * Returns the cached registry if already fetched for the same organization.
 *
 * // TODO: Backend integration required
 * // GET ${SCREEN_REGISTRY_URL}?organizationId={organizationId}
 */
export async function fetchScreenRegistry(
  organizationId: string
): Promise<ScreenRegistry | ServiceError> {
  if (_cachedRegistry && _cacheOrganizationId === organizationId) {
    return _cachedRegistry
  }
  void SCREEN_REGISTRY_URL
  // TODO: Replace with real API call
  throw new Error('Not implemented — backend integration required')
}

/**
 * Clears the in-memory registry cache.
 * Call on logout or organization switch.
 */
export function clearRegistryCache(): void {
  _cachedRegistry = null
  _cacheOrganizationId = null
}

/**
 * Returns the registry entry for a given screen key.
 * Returns null if the registry has not been fetched or the key is not found.
 */
export function getRegistryEntry(screenKey: ScreenKey): ScreenRegistryEntry | null {
  if (!_cachedRegistry) return null
  return _cachedRegistry.entries.find(e => e.screenKey === screenKey) ?? null
}

/**
 * Returns true if the screen is enabled in the registry.
 * Returns false if the registry has not been fetched (fail-closed).
 */
export function isScreenEnabled(screenKey: ScreenKey): boolean {
  const entry = getRegistryEntry(screenKey)
  if (!entry) return false
  return entry.isEnabled
}

/**
 * Returns all enabled screen keys for an organization.
 */
export function getEnabledScreenKeys(): ScreenKey[] {
  if (!_cachedRegistry) return []
  return _cachedRegistry.entries
    .filter(e => e.isEnabled)
    .map(e => e.screenKey)
}

/**
 * Returns the required roles for a screen.
 * Returns an empty array if the registry has not been fetched.
 */
export function getRequiredRoles(screenKey: ScreenKey): string[] {
  const entry = getRegistryEntry(screenKey)
  return entry?.requiredRoles ?? []
}

/**
 * Hydrates the cache from a pre-fetched registry (e.g., from SSR or app init).
 * Used by the app bootstrap sequence to avoid a second fetch.
 */
export function hydrateRegistryCache(
  registry: ScreenRegistry,
  organizationId: string
): void {
  _cachedRegistry = registry
  _cacheOrganizationId = organizationId
}
