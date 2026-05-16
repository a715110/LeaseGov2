/**
 * ScreenGate — two-layer access control gate for every screen.
 *
 * Layer 1: Is the screen enabled in the registry? (screenRegistryService)
 * Layer 2: Does the user have the required role? (permissionsService)
 *
 * If either check fails, renders the appropriate fallback:
 * - Layer 1 failure: ScreenDisabledFallback (screen not available for this tenant)
 * - Layer 2 failure: AccessDeniedFallback (user lacks required role)
 * - Loading: ScreenGateLoader (skeleton)
 *
 * Usage:
 *   <ScreenGate screenKey={SCREEN_KEYS.PROPERTY_LEASE_LIST}>
 *     <PropertyLeaseListPage />
 *   </ScreenGate>
 *
 * ARCHITECTURE NOTE: ScreenGate is the single enforcement point for
 * screen-level access control. Never bypass it by rendering pages directly.
 */
import React from 'react'
import { isScreenEnabled, getRequiredRoles } from '../../services/screenRegistryService'
import { useRegistry } from '../../contexts/RegistryContext'
import type { ScreenKey } from '../../constants/screenKeys'

interface ScreenGateProps {
  screenKey: ScreenKey
  userRoles?: string[]
  /**
   * @deprecated Pass isRegistryLoaded via RegistryProvider instead.
   * This prop is kept for backward compatibility and overrides the context
   * value when explicitly provided.
   */
  isRegistryLoaded?: boolean
  children: React.ReactNode
  /** Rendered when screen is inactive in the registry (Layer 1 failure). Default: <ScreenDisabledFallback /> */
  fallback?: React.ReactNode
  /** Rendered while registry is loading. Default: <ScreenGateLoader /> */
  loadingFallback?: React.ReactNode
}

function ScreenGateLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading screen…</p>
      </div>
    </div>
  )
}

function ScreenDisabledFallback({ screenKey }: { screenKey: ScreenKey }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">Screen Not Available</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This screen is not enabled for your organisation.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">Screen: {screenKey}</p>
      </div>
    </div>
  )
}

function AccessDeniedFallback({ screenKey }: { screenKey: ScreenKey }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">Access Denied</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have the required permissions to access this screen.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">Screen: {screenKey}</p>
      </div>
    </div>
  )
}

export function ScreenGate({
  screenKey,
  userRoles = [],
  isRegistryLoaded: isRegistryLoadedProp,
  children,
  fallback,
  loadingFallback,
}: ScreenGateProps) {
  // Read from context; prop override takes precedence if explicitly provided
  const { isRegistryLoaded: isRegistryLoadedCtx } = useRegistry()
  const isRegistryLoaded = isRegistryLoadedProp ?? isRegistryLoadedCtx

  // Show loader while registry is being fetched
  if (!isRegistryLoaded) {
    return <>{loadingFallback ?? <ScreenGateLoader />}</>
  }

  // Layer 1: Registry check
  if (!isScreenEnabled(screenKey)) {
    return <>{fallback ?? <ScreenDisabledFallback screenKey={screenKey} />}</>
  }

  // Layer 2: Role check
  const requiredRoles = getRequiredRoles(screenKey)
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some(role => userRoles.includes(role))
    if (!hasRole) {
      return <AccessDeniedFallback screenKey={screenKey} />
    }
  }

  return <>{children}</>
}
