/**
 * RegistryContext.tsx
 * contexts/
 *
 * Provides the screen registry loaded state to the entire application tree.
 * ScreenGate reads from this context instead of requiring isRegistryLoaded
 * to be passed as a prop on every route.
 *
 * Scaffold mode: registry is immediately marked as loaded because
 * isScreenEnabled() in screenRegistryService already fail-opens (returns true)
 * when no registry is cached. Once the backend is wired, replace the
 * immediate flag with a real fetch inside RegistryProvider.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface RegistryContextValue {
  /** True once the screen registry has been loaded (or scaffold-mode bypassed). */
  isRegistryLoaded: boolean
}

const RegistryContext = createContext<RegistryContextValue>({
  isRegistryLoaded: false,
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RegistryProviderProps {
  children: React.ReactNode
  /**
   * When true (default in development), the registry is immediately marked
   * as loaded without waiting for a backend fetch. Set to false when the
   * real registry endpoint is available and you want to enforce the loading
   * state until the fetch resolves.
   */
  scaffoldMode?: boolean
}

export function RegistryProvider({
  children,
  scaffoldMode = true,
}: RegistryProviderProps) {
  const [isRegistryLoaded, setIsRegistryLoaded] = useState(scaffoldMode)

  useEffect(() => {
    if (scaffoldMode) {
      // Scaffold mode: mark loaded immediately — isScreenEnabled() fail-opens.
      setIsRegistryLoaded(true)
      return
    }

    // Production mode: attempt to fetch the registry.
    // TODO: replace with real fetch once backend endpoint is available.
    // import { fetchScreenRegistry } from '../services/screenRegistryService'
    // fetchScreenRegistry(organizationId)
    //   .then(() => setIsRegistryLoaded(true))
    //   .catch(() => setIsRegistryLoaded(true)) // fail-open: show screens even if fetch fails
    setIsRegistryLoaded(true)
  }, [scaffoldMode])

  return (
    <RegistryContext.Provider value={{ isRegistryLoaded }}>
      {children}
    </RegistryContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRegistry(): RegistryContextValue {
  return useContext(RegistryContext)
}
