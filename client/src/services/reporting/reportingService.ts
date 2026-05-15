/**
 * Reporting Service — portfolio analytics and automation efficiency reports.
 *
 * // TODO: Backend integration required
 */
import { REPORTING_URL } from '../../constants/apiConfig'
import type { PortfolioSummary } from '../../types/portfolio/PortfolioSummary'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface GetPortfolioSummaryInput { organizationId: string }
export interface GetPortfolioSummaryResult { success: true; summary: PortfolioSummary }

/**
 * Retrieves the portfolio-level summary for an organization.
 *
 * // TODO: Backend integration required
 * // GET ${REPORTING_URL}/portfolio-summary
 */
export async function getPortfolioSummary(
  input: GetPortfolioSummaryInput
): Promise<GetPortfolioSummaryResult | ServiceError> {
  void REPORTING_URL
  void input
  throw new Error('Not implemented — backend integration required')
}
