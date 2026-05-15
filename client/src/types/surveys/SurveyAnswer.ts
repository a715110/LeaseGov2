/**
 * A single answer to one question within a survey response.
 */
export interface SurveyAnswer {
  id: string
  surveyResponseId: string
  surveyQuestionId: string
  organizationId: string
  answerValue: string | null
  answeredAt: Date
}
