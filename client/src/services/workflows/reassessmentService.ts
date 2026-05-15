/**
 * Reassessment Service — reassessment lifecycle management.
 *
 * // TODO: Backend integration required
 */
import { REASSESSMENT_URL } from '../../constants/apiConfig'
import type { ServiceError } from '../../types/shared/errors/ServiceError'
import type { PropertyLeaseReassessment } from '../../types/contracts/propertyLease/PropertyLeaseReassessment'

export interface GetReassessmentInput {
  reassessmentId: string
  organizationId: string
}
export interface GetReassessmentResult {
  success: true
  reassessment: PropertyLeaseReassessment
}

export interface ListReassessmentsInput {
  organizationId: string
  leaseId?: string
  status?: string
}
export interface ListReassessmentsResult {
  success: true
  reassessments: PropertyLeaseReassessment[]
  total: number
}

/**
 * Retrieves a reassessment record by ID.
 *
 * // TODO: Backend integration required
 * // GET ${REASSESSMENT_URL}/:reassessmentId
 */
export async function getReassessment(
  input: GetReassessmentInput
): Promise<GetReassessmentResult | ServiceError> {
  void REASSESSMENT_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Lists reassessments for an organization, optionally filtered by lease.
 *
 * // TODO: Backend integration required
 * // GET ${REASSESSMENT_URL}
 */
export async function listReassessments(
  input: ListReassessmentsInput
): Promise<ListReassessmentsResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
