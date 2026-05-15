/**
 * userPreferenceService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * What it does:  Manages per-user preferences, specifically color mode override.
 * Data it needs: userId, organizationId (from JWT context), ColorMode value.
 * API endpoints:
 *   GET  /users/me/preferences        → UserPreference
 *   PATCH /users/me/preferences       → UserPreference
 * Ref: Data Model V2.0 Part 4.13
 *
 * Persistence strategy:
 *   - Writes to localStorage immediately (optimistic update, zero latency).
 *   - Then persists to backend asynchronously.
 *   - On load, backend value takes precedence over localStorage if they differ.
 *
 * Contract level: User-scoped (not contract-level, not portfolio-level).
 * Contract types: N/A — applies to all users across all contract types.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { UserPreference } from '../types/shared/UserPreference'
import type { ColorMode } from '../types/shared/ThemeMode'
import type { ServiceError } from '../types/shared/errors/ServiceError'

// ─── Local storage key ────────────────────────────────────────────────────────

const LS_COLOR_MODE_KEY = 'leasegov_color_mode'

// ─── Input / Result types ─────────────────────────────────────────────────────

export interface GetUserPreferencesInput {
  organizationId: string
}

export type GetUserPreferencesResult =
  | { success: true; data: UserPreference }
  | { success: false; error: ServiceError }

export interface UpdateColorModePreferenceInput {
  organizationId: string
  colorMode: ColorMode | null  // null = revert to tenant default
}

export type UpdateColorModePreferenceResult =
  | { success: true; data: UserPreference }
  | { success: false; error: ServiceError }

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Fetches the current user's preferences from the backend.
 * Falls back to localStorage value if backend is unavailable.
 * TODO: Backend integration required — GET /users/me/preferences
 */
export async function getUserPreferences(
  _input: GetUserPreferencesInput
): Promise<GetUserPreferencesResult> {
  // TODO: Backend integration required
  // const response = await fetch(`${USER_PREFERENCE_SERVICE_URL}/users/me/preferences`, {
  //   headers: { Authorization: `Bearer ${getJwt()}` }
  // })

  // Scaffold: return localStorage value as optimistic preference
  const storedMode = localStorage.getItem(LS_COLOR_MODE_KEY) as ColorMode | null

  const preference: UserPreference = {
    userId: 'placeholder',
    organizationId: _input.organizationId,
    colorMode: storedMode,
    lastUpdatedAt: new Date(),
  }

  return { success: true, data: preference }
}

/**
 * Updates the user's color mode preference.
 * Writes to localStorage immediately for optimistic update, then persists to backend.
 * TODO: Backend integration required — PATCH /users/me/preferences
 */
export async function updateColorModePreference(
  input: UpdateColorModePreferenceInput
): Promise<UpdateColorModePreferenceResult> {
  // Optimistic localStorage write — instant, zero latency
  if (input.colorMode === null) {
    localStorage.removeItem(LS_COLOR_MODE_KEY)
  } else {
    localStorage.setItem(LS_COLOR_MODE_KEY, input.colorMode)
  }

  // TODO: Backend integration required
  // await fetch(`${USER_PREFERENCE_SERVICE_URL}/users/me/preferences`, {
  //   method: 'PATCH',
  //   headers: { Authorization: `Bearer ${getJwt()}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ colorMode: input.colorMode })
  // })

  const updated: UserPreference = {
    userId: 'placeholder',
    organizationId: input.organizationId,
    colorMode: input.colorMode,
    lastUpdatedAt: new Date(),
  }

  return { success: true, data: updated }
}

/**
 * Reads the color mode preference synchronously from localStorage.
 * Used by the flash-prevention script and ThemeProvider before async load completes.
 */
export function getStoredColorMode(): ColorMode | null {
  return localStorage.getItem(LS_COLOR_MODE_KEY) as ColorMode | null
}

/**
 * Clears the stored color mode preference from localStorage.
 * Equivalent to calling updateColorModePreference with colorMode: null but synchronous.
 */
export function clearStoredColorMode(): void {
  localStorage.removeItem(LS_COLOR_MODE_KEY)
}
