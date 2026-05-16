/**
 * Concurrent Case Warning
 * Screen key: reassessment-concurrent-warning
 * Route: /reassessment/concurrent
 * Feature cluster: FC — see Screen Registry Specification V2 Part 6
 *
 * STATUS: Stub — not yet implemented
 * Build session: TBD
 */

export default function ReassessmentConcurrentWarn() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">Concurrent Case Warning</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Screen key: <code className="font-mono">reassessment-concurrent-warning</code>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">Route: /reassessment/concurrent</p>
    </div>
  )
}
