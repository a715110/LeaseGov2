/**
 * Per-user preference record.
 * NEW IN V4: colorMode preference per user.
 */
import type { ColorMode } from './ThemeMode'

export interface UserPreference {
  userId: string
  organizationId: string
  colorMode: ColorMode | null   // null = follow tenant default
  lastUpdatedAt: Date
}
