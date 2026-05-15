/**
 * Valid token but insufficient permissions or SoD violation.
 */
import type { ServiceError } from './ServiceError'

export interface AuthorizationError extends ServiceError {
  errorType: 'authorization_error'
  requiredPermission: string
  userRoles: string[]
  sodViolation: boolean
}
