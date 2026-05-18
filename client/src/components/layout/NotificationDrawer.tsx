/**
 * NotificationDrawer — right-side slide-in panel for in-app notifications.
 *
 * Consumes useNotifications() from NotificationContext.
 * Features:
 *  - Severity icons: info (blue), success (green), warning (amber), error (red)
 *  - Unread items have a left accent border and slightly elevated background
 *  - Click item → markRead + optional href navigation
 *  - "Mark all read" and "Clear all" header actions
 *  - Polished empty state when no notifications exist
 *  - Escape key + backdrop click to close
 *  - Matches FlagSlidingPanel interaction pattern (z-50, translate-x transition)
 */
import React, { useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import {
  Bell, X, CheckCheck, Trash2,
  Info, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useNotifications } from '../../contexts/NotificationContext'
import type { NotificationSeverity } from '../../contexts/NotificationContext'

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { Icon: React.ElementType; iconClass: string; borderClass: string; bgClass: string }
> = {
  info:    { Icon: Info,          iconClass: 'text-blue-500',   borderClass: 'border-l-blue-400',   bgClass: '' },
  success: { Icon: CheckCircle2,  iconClass: 'text-emerald-500',borderClass: 'border-l-emerald-400',bgClass: '' },
  warning: { Icon: AlertTriangle, iconClass: 'text-amber-500',  borderClass: 'border-l-amber-400',  bgClass: '' },
  error:   { Icon: XCircle,       iconClass: 'text-red-500',    borderClass: 'border-l-red-400',    bgClass: '' },
}

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const [, navigate] = useLocation()

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleItemClick = useCallback(
    (id: string, href?: string) => {
      markRead(id)
      if (href) {
        navigate(href)
        onClose()
      }
    },
    [markRead, navigate, onClose]
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col bg-background shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                System alerts, workflow updates, and approval requests will appear here.
              </p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-border">
              {notifications.map(notif => {
                const isUnread = !notif.readAt
                const { Icon, iconClass, borderClass } = SEVERITY_CONFIG[notif.severity]
                return (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleItemClick(notif.id, notif.href)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex gap-3 transition-colors duration-100',
                        'hover:bg-accent/60',
                        isUnread
                          ? cn('bg-accent/30 border-l-2', borderClass)
                          : 'border-l-2 border-l-transparent'
                      )}
                      aria-label={`${isUnread ? 'Unread: ' : ''}${notif.title}`}
                    >
                      {/* Severity icon */}
                      <span className={cn('mt-0.5 shrink-0', iconClass)}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-xs leading-snug', isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80')}>
                            {notif.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                        {notif.body && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {notif.body}
                          </p>
                        )}
                        {notif.href && (
                          <span className="mt-1 inline-block text-[10px] font-medium text-primary">
                            View →
                          </span>
                        )}
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-border px-4 py-3 text-center">
            <span className="text-[11px] text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 ? ` · ${unreadCount} unread` : ' · all read'}
            </span>
          </div>
        )}
      </aside>
    </>
  )
}
