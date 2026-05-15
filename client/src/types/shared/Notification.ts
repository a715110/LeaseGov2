/**
 * A notification sent to a user.
 */
export type NotificationChannel = 'in_app' | 'email' | 'sms'
export type NotificationPriority = 'high' | 'medium' | 'low'

export interface Notification {
  id: string
  organizationId: string
  recipientUserId: string
  channel: NotificationChannel
  priority: NotificationPriority
  subject: string
  body: string
  contractId: string | null
  contractType: string | null
  actionUrl: string | null
  isRead: boolean
  readAt: Date | null
  sentAt: Date
  created_at: Date
}
