/**
 * Auth Service — login, logout, token refresh.
 *
 * // TODO: Backend integration required
 */
import { AUTH_LOGIN_URL, AUTH_LOGOUT_URL, AUTH_REFRESH_URL } from '../../constants/apiConfig'
import type { ServiceError } from '../../types/shared/errors/ServiceError'
import type { UserPermissions } from '../../types/shared/Permission'

export interface LoginInput {
  email: string
  password: string
  organizationId: string
}
export interface LoginResult {
  success: true
  accessToken: string
  refreshToken: string
  expiresAt: Date
  permissions: UserPermissions
}

/**
 * Authenticates a tenant user and returns JWT tokens.
 *
 * // TODO: Backend integration required
 * // POST ${AUTH_LOGIN_URL}
 */
export async function login(
  input: LoginInput
): Promise<LoginResult | ServiceError> {
  void AUTH_LOGIN_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Logs out the current user and invalidates the session.
 *
 * // TODO: Backend integration required
 * // POST ${AUTH_LOGOUT_URL}
 */
export async function logout(
  input: { organizationId: string }
): Promise<{ success: true } | ServiceError> {
  void AUTH_LOGOUT_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Refreshes the access token using a valid refresh token.
 *
 * // TODO: Backend integration required
 * // POST ${AUTH_REFRESH_URL}
 */
export async function refreshToken(
  input: { refreshToken: string; organizationId: string }
): Promise<{ success: true; accessToken: string; expiresAt: Date } | ServiceError> {
  void AUTH_REFRESH_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
