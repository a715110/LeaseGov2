/**
 * Survey Service — survey campaign management and response collection.
 *
 * // TODO: Backend integration required
 */
import { SURVEY_URL } from '../../constants/apiConfig'
import type {
  ListSurveysInput, ListSurveysResult,
  GetSurveyResponseInput, GetSurveyResponseResult,
  SubmitSurveyAnswersInput, SubmitSurveyAnswersResult,
} from '../../types/serviceOperations/surveys/surveyOperations'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

/**
 * Lists survey campaigns for an organization.
 *
 * // TODO: Backend integration required
 * // GET ${SURVEY_URL}
 */
export async function listSurveys(
  input: ListSurveysInput
): Promise<ListSurveysResult | ServiceError> {
  void SURVEY_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Retrieves a survey response for a specific contract.
 *
 * // TODO: Backend integration required
 * // GET ${SURVEY_URL}/:surveyId/responses/:contractId
 */
export async function getSurveyResponse(
  input: GetSurveyResponseInput
): Promise<GetSurveyResponseResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Submits survey answers for a contract.
 *
 * // TODO: Backend integration required
 * // POST ${SURVEY_URL}/:surveyId/responses
 */
export async function submitSurveyAnswers(
  input: SubmitSurveyAnswersInput
): Promise<SubmitSurveyAnswersResult | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
