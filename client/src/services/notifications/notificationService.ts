/**
 * Notification Service — in-app and email notification management.
 *
 * // TODO: Backend integration required
 */
import { NOTIFICATION_URL } from '../../constants/apiConfig'
import type { Notification } from '../../types/shared/Notification'
import type { ServiceError } from '../../types/shared/errors/ServiceError'

export interface ListNotificationsInput {
  organizationId: string
  userId: string
  unreadOnly?: boolean
}
export interface ListNotificationsResult {
  success: true
  notifications: Notification[]
  unreadCount: number
}

/**
 * Lists notifications for the current user.
 *
 * // TODO: Backend integration required
 * // GET ${NOTIFICATION_URL}
 */
export async function listNotifications(
  input: ListNotificationsInput
): Promise<ListNotificationsResult | ServiceError> {
  void NOTIFICATION_URL
  void input
  throw new Error('Not implemented — backend integration required')
}

/**
 * Marks a notification as read.
 *
 * // TODO: Backend integration required
 * // PATCH ${NOTIFICATION_URL}/:notificationId/read
 */
export async function markNotificationRead(
  input: { notificationId: string; organizationId: string }
): Promise<{ success: true } | ServiceError> {
  void input
  throw new Error('Not implemented — backend integration required')
}
