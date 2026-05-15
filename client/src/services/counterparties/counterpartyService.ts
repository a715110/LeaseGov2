/**
 * Counterparty Service — counterparty (tenant/lessor) record management.
 *
 * // TODO: Backend integration required
 */
import { COUNTERPARTY_URL } from '../../constants/apiConfig'
import type { BaseContractParty } from '../../types/contracts/base/BaseContractParty'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface GetCounterpartyInput { counterpartyId: string; organizationId: string }
export interface GetCounterpartyResult { success: true; counterparty: BaseContractParty }

/**
 * Retrieves a counterparty record by ID.
 *
 * // TODO: Backend integration required
 * // GET ${COUNTERPARTY_URL}/:counterpartyId
 */
export async function getCounterparty(
  input: GetCounterpartyInput
): Promise<GetCounterpartyResult | ServiceError> {
  void COUNTERPARTY_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
