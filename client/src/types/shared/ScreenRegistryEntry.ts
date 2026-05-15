/**
 * A single entry in the screen registry.
 * The registry is fetched from the backend and cached in memory.
 */
import type { ScreenKey } from '../../constants/screenKeys'

export interface ScreenRegistryEntry {
  screenKey: ScreenKey
  isEnabled: boolean
  requiredRoles: string[]
  requiredFeatureFlags: string[]
  phase: 'mvp' | 'phase_2'
  description: string
}

export interface ScreenRegistry {
  organizationId: string
  entries: ScreenRegistryEntry[]
  generatedAt: Date
}
