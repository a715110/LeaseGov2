/**
 * Notification Preferences
 * Screen key: admin-notifications
 * Route: /admin/notifications
 * Feature cluster: FC — see Screen Registry Specification V2 Part 6
 *
 * STATUS: Stub — not yet implemented
 * Build session: TBD
 */

export default function AdminNotifications() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">Notification Preferences</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Screen key: <code className="font-mono">admin-notifications</code>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">Route: /admin/notifications</p>
    </div>
  )
}
