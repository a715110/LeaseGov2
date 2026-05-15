/**
 * Property Service — property record management.
 *
 * // TODO: Backend integration required
 */
import { PROPERTY_URL } from '../../constants/apiConfig'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface Property {
  id: string
  organizationId: string
  address: string
  suburb: string
  state: string
  postcode: string
  country: string
  propertyType: string
  floorArea: number | null
  created_at: Date
  updated_at: Date
}

export interface GetPropertyInput { propertyId: string; organizationId: string }
export interface GetPropertyResult { success: true; property: Property }

/**
 * Retrieves a property record by ID.
 *
 * // TODO: Backend integration required
 * // GET ${PROPERTY_URL}/:propertyId
 */
export async function getProperty(
  input: GetPropertyInput
): Promise<GetPropertyResult | ServiceError> {
  void PROPERTY_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
