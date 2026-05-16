/**
 * AdminUserSetupPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Screen ID:  ON.2
 * Screen key: admin_user_setup
 * Access:     SuperAdmin only
 *
 * Admin User Setup — create the first Tenant Admin user for the new organization.
SuperAdmin sets the admin email, name, and sends the activation invite.
 *
 * Status: Stub — to be implemented in FC-10 cluster session.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function AdminUserSetupPage() {
  return (
    <div className="flex flex-col items-start gap-3 p-8">
      <h1 className="text-xl font-semibold text-foreground">AdminUserSetupPage</h1>
      <p className="text-sm text-muted-foreground">Screen key: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">admin_user_setup</code></p>
      <div className="mt-4 w-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        <p>This screen is scaffolded and ready for implementation.</p>
        <p className="mt-1 text-xs opacity-60">Admin User Setup — create the first Tenant Admin user for the new organization.</p>
      </div>
    </div>
  )
}
