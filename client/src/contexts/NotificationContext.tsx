/**
 * NotificationContext — A7 (ARCH-2)
 *
 * Lightweight in-memory notification system.
 * Provides: addNotification, markRead, markAllRead, clearAll, unreadCount.
 *
 * Notifications are stored in component state (not persisted).
 * The Bell icon in AppShell reads unreadCount to show a badge.
 *
 * PRODUCTION UPGRADE: Replace state with a WebSocket subscription
 * or polling endpoint: GET /api/v1/notifications?unread=true
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { subscribeToEvents } from '@/lib/eventBus'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id: string
  title: string
  body?: string
  severity: NotificationSeverity
  createdAt: string
  readAt?: string
  /** Optional route to navigate to when the notification is clicked */
  href?: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

let _idCounter = 1

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt'>) => {
      const notification: AppNotification = {
        ...n,
        id: `notif-${_idCounter++}`,
        createdAt: new Date().toISOString(),
      }
      setNotifications(prev => [notification, ...prev].slice(0, 100))
    },
    []
  )

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
  }, [])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    setNotifications(prev => prev.map(n => (n.readAt ? n : { ...n, readAt: now })))
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  const unreadCount = notifications.filter(n => !n.readAt).length

  // DEMO ONLY: Wire BATCH_SUBMITTED → in-app notification.
  // PRODUCTION: replace with a real push notification subscription (WebSocket/SSE or polling).
  // The backend will send a notification when a new batch enters the extraction queue.
  useEffect(() => {
    const unsub = subscribeToEvents(
      (event) => {
        const batchId = (event.payload.batchId as string) ?? 'Unknown'
        const packageNum = (event.payload.packageNum as string) ?? ''
        addNotification({
          title: 'New batch ready for extraction',
          body: `${packageNum ? packageNum + ' — ' : ''}${batchId} has entered the extraction queue.`,
          severity: 'info',
          href: '/extraction/queue',
        })
      },
      ['BATCH_SUBMITTED']
    )
    return unsub
  }, [addNotification])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
