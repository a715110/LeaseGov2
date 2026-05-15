/**
 * Entity not found or does not belong to current organization.
 */
import type { ServiceError } from './ServiceError'

export interface NotFoundError extends ServiceError {
  errorType: 'not_found'
  entityType: string
  entityId: string
}
