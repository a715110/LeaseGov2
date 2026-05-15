/**
 * Service operation input/output types for survey operations.
 *
 * MCP NOTE: Each Input type maps to an MCP tool's inputSchema.
 */
import type { Survey } from '../../surveys/Survey'
import type { SurveyResponse } from '../../surveys/SurveyResponse'
import type { SurveyAnswer } from '../../surveys/SurveyAnswer'

// ─── listSurveys ──────────────────────────────────────────────────────────────
export interface ListSurveysInput {
  organizationId: string
  status?: string
}
export interface ListSurveysResult {
  success: true
  surveys: Survey[]
  total: number
}

// ─── getSurveyResponse ────────────────────────────────────────────────────────
export interface GetSurveyResponseInput {
  surveyId: string
  contractId: string
  organizationId: string
}
export interface GetSurveyResponseResult {
  success: true
  response: SurveyResponse | null
  answers: SurveyAnswer[]
}

// ─── submitSurveyAnswers ──────────────────────────────────────────────────────
export interface SubmitSurveyAnswersInput {
  surveyId: string
  contractId: string
  organizationId: string
  answers: Array<{ questionId: string; value: string }>
  respondentUserId: string
}
export interface SubmitSurveyAnswersResult {
  success: true
  surveyResponseId: string
  submittedAt: Date
}
