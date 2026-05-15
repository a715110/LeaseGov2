/**
 * Permissions Service — fetches and evaluates user permissions.
 *
 * // TODO: Backend integration required
 */
import { PERMISSIONS_URL } from '../../constants/apiConfig'
import type { UserPermissions } from '../../types/shared/Permission'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface GetPermissionsInput {
  userId: string
  organizationId: string
}
export interface GetPermissionsResult {
  success: true
  permissions: UserPermissions
}

/**
 * Fetches the current user's permissions from the JWT or backend.
 *
 * // TODO: Backend integration required
 * // GET ${PERMISSIONS_URL}
 */
export async function getPermissions(
  input: GetPermissionsInput
): Promise<GetPermissionsResult | ServiceError> {
  void PERMISSIONS_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
