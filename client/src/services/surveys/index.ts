/**
 * SURVEY SERVICE OPERATIONS REGISTRY
 */
export { listSurveys, getSurveyResponse, submitSurveyAnswers } from './surveyService'

export type {
  ListSurveysInput, ListSurveysResult,
  GetSurveyResponseInput, GetSurveyResponseResult,
  SubmitSurveyAnswersInput, SubmitSurveyAnswersResult,
} from '../../types/serviceOperations/surveys/surveyOperations'
