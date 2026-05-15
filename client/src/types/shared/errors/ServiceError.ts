/**
 * Base service error type. All service functions return this on failure.
 */
export interface ServiceError {
  success: false
  errorCode: string
  errorType:
    | 'validation_error'
    | 'not_found'
    | 'authorization_error'
    | 'extraction_error'
    | 'workflow_error'
    | 'network_error'
    | 'server_error'
  message: string
  timestamp: Date
  requestId: string
  organizationId: string
}
