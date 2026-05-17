/**
 * InlineDialog — A12 (ARCH-2)
 *
 * Full-screen inline dialog pattern used by Classification (S4) and
 * FieldMapping (S4) dialogs. Follows the FC-4/FC-5 ApproverDialog pattern:
 *   - fixed inset-0 z-50 bg-black/60 backdrop
 *   - centered card, configurable width (default 620px)
 *   - sticky header with title + close button
 *   - scrollable body
 *   - sticky footer with action buttons
 *
 * Usage:
 *   <InlineDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Document Classification"
 *     width={680}
 *     footer={<Button onClick={handleConfirm}>Confirm</Button>}
 *   >
 *     {content}
 *   </InlineDialog>
 */
import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface InlineDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Width in px or CSS string (e.g. '95vw') — default 620 */
  width?: number | string
  /** Max height as CSS value — default 'calc(100vh - 4rem)' */
  maxHeight?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Extra className on the card */
  className?: string
  /** Whether clicking the backdrop closes the dialog — default true */
  closeOnBackdrop?: boolean
}

export function InlineDialog({
  open,
  onClose,
  title,
  subtitle,
  width = 620 as number | string,
  maxHeight = 'calc(100vh - 4rem)',
  children,
  footer,
  className,
  closeOnBackdrop = true,
}: InlineDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl',
          className
        )}
        style={{ width: typeof width === 'number' ? `min(${width}px, 95vw)` : width, maxHeight }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
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
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
