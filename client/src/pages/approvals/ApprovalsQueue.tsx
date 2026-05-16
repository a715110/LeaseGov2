/**
 * Approval Queue
 * Screen key: approvals-queue
 * Route: /approvals/queue
 * Feature cluster: FC — see Screen Registry Specification V2 Part 6
 *
 * STATUS: Stub — not yet implemented
 * Build session: TBD
 */

export default function ApprovalsQueue() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">Approval Queue</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Screen key: <code className="font-mono">approvals-queue</code>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">Route: /approvals/queue</p>
    </div>
  )
}
