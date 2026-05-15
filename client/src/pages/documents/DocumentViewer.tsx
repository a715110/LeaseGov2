/**
 * Document viewer with extraction overlay
 *
 * Screen key: document_viewer
 * // TODO: Implement screen UI
 */
import React from 'react'

export default function DocumentViewerPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">DocumentViewerPage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Screen key: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">document_viewer</code>
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This screen is scaffolded and ready for implementation.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Document viewer with extraction overlay
        </p>
      </div>
    </div>
  )
}
