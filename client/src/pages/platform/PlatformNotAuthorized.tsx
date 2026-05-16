/**
 * Not Authorized
 * Screen key: platform-not-authorized
 * Route: /not-authorized
 * Feature cluster: FC — see Screen Registry Specification V2 Part 6
 *
 * STATUS: Stub — not yet implemented
 * Build session: TBD
 */

export default function PlatformNotAuthorized() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">Not Authorized</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Screen key: <code className="font-mono">platform-not-authorized</code>
      </p>
      <p className="mt-1 text-muted-foreground text-sm">Route: /not-authorized</p>
    </div>
  )
}
