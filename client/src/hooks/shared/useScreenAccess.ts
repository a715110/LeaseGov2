/**
 * useScreenAccess — programmatic screen access check.
 *
 * Used to conditionally render navigation items, action buttons,
 * and other UI elements that depend on screen access.
 *
 * Performs the same two-layer check as ScreenGate:
 * Layer 1: Registry enabled check
 * Layer 2: Role check
 *
 * Usage:
 *   const { canAccess } = useScreenAccess(SCREEN_KEYS.PROPERTY_LEASE_LIST)
 *   if (!canAccess) return null
 */
import { useMemo } from 'react'
import { isScreenEnabled, getRequiredRoles } from '../../services/screenRegistryService'
import type { ScreenKey } from '../../constants/screenKeys'

export interface UseScreenAccessReturn {
  canAccess: boolean
  isRegistryEnabled: boolean
  hasRequiredRole: boolean
}

export function useScreenAccess(
  screenKey: ScreenKey,
  userRoles: string[] = []
): UseScreenAccessReturn {
  return useMemo(() => {
    const isRegistryEnabled = isScreenEnabled(screenKey)
    if (!isRegistryEnabled) {
      return { canAccess: false, isRegistryEnabled: false, hasRequiredRole: false }
    }
    const requiredRoles = getRequiredRoles(screenKey)
    const hasRequiredRole =
      requiredRoles.length === 0 || requiredRoles.some(r => userRoles.includes(r))
    return {
      canAccess: hasRequiredRole,
      isRegistryEnabled: true,
      hasRequiredRole,
    }
  }, [screenKey, userRoles])
}
