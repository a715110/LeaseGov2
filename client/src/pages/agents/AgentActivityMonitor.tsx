/**
 * Agent Activity Monitor
 * Screen key: agent-activity-monitor
 * Route: /agents/monitor
 * Feature cluster: FC — see Screen Registry Specification V2 Part 6
 *
 * STATUS: Stub — not yet implemented
 * Build session: TBD
 */

export default function AgentActivityMonitor() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">Agent Activity Monitor</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Screen key: <code className="font-mono">agent-activity-monitor</code>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">Route: /agents/monitor</p>
    </div>
  )
}
