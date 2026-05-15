/**
 * Automation Policy Service — manages automation level policies per tenant/contract.
 *
 * // TODO: Backend integration required
 */
import { AUTOMATION_POLICY_URL } from '../../constants/apiConfig'
import type { AutomationPolicy } from '../../types/automation/AutomationPolicy'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface GetAutomationPolicyInput {
  policyId: string
  organizationId: string
}
export interface GetAutomationPolicyResult {
  success: true
  policy: AutomationPolicy
}

export interface ListAutomationPoliciesInput {
  organizationId: string
}
export interface ListAutomationPoliciesResult {
  success: true
  policies: AutomationPolicy[]
}

/**
 * Retrieves the automation policy for a contract or tenant default.
 *
 * // TODO: Backend integration required
 * // GET ${AUTOMATION_POLICY_URL}/:policyId
 */
export async function getAutomationPolicy(
  input: GetAutomationPolicyInput
): Promise<GetAutomationPolicyResult | ServiceError> {
  void AUTOMATION_POLICY_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Lists all automation policies for an organization.
 *
 * // TODO: Backend integration required
 * // GET ${AUTOMATION_POLICY_URL}
 */
export async function listAutomationPolicies(
  input: ListAutomationPoliciesInput
): Promise<ListAutomationPoliciesResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
