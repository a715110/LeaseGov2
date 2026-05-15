/**
 * Field-level validation failure error.
 */
import type { ServiceError } from './ServiceError'

export interface InvalidField {
  fieldName: string
  receivedValue: unknown
  expectedFormat: string
  rule: string
}

export interface ValidationError extends ServiceError {
  errorType: 'validation_error'
  invalidFields: InvalidField[]
}
