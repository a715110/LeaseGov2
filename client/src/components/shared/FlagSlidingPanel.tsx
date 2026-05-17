/**
 * FlagSlidingPanel — A13 (ARCH-2)
 *
 * Reusable slide-in panel at z-40, used by:
 *   S1a DocumentDetailPanel, S1b BatchDetailPanel, S3d SubmissionDetailPanel
 *
 * Slides in from the right with a translate-x transition.
 * Renders a semi-transparent backdrop that closes the panel on click.
 *
 * Usage:
 *   <FlagSlidingPanel
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Document Details"
 *     width={480}
 *   >
 *     {content}
 *   </FlagSlidingPanel>
 */
import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FlagSlidingPanelProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Panel width in px — default 480 */
  width?: number
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function FlagSlidingPanel({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
  className,
}: FlagSlidingPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex flex-col border-l border-border bg-background shadow-2xl transition-transform duration-250',
          open ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        style={{ width: `min(${width}px, 95vw)` }}
        role="complementary"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
