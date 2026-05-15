/**
 * A single question within a survey.
 */
export type QuestionType = 'text' | 'number' | 'boolean' | 'select' | 'multi_select' | 'date'

export interface SurveyQuestion {
  id: string
  surveyId: string
  organizationId: string
  questionText: string
  questionType: QuestionType
  isRequired: boolean
  options: string[] | null      // For select/multi_select types
  sortOrder: number
}
