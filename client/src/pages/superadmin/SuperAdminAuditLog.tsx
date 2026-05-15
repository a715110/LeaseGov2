/**
 * SuperAdmin — audit log (Phase 2)
 *
 * Screen key: superadmin_audit_log
 * // TODO: Implement screen UI
 */
import React from 'react'

export default function SuperAdminAuditLogPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">SuperAdminAuditLogPage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Screen key: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">superadmin_audit_log</code>
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This screen is scaffolded and ready for implementation.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          SuperAdmin — audit log (Phase 2)
        </p>
      </div>
    </div>
  )
}
