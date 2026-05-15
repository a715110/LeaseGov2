/**
 * An item in the portfolio-level exception queue.
 */
export interface ExceptionQueueItem {
  id: string
  organizationId: string
  contractId: string
  contractNumber: string
  contractType: string
  counterpartyName: string
  exceptionType: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  assignedUserId: string | null
  createdAt: Date
  daysOpen: number
}
