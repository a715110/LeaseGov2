/**
 * OnboardingCompletePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Screen ID:  ON.5
 * Screen key: onboarding_complete
 * Access:     SuperAdmin only
 *
 * Onboarding Complete — confirmation screen shown after all setup steps are finished.
SuperAdmin sees a summary of what was configured and a link to the new tenant's dashboard.
 *
 * Status: Stub — to be implemented in FC-10 cluster session.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function OnboardingCompletePage() {
  return (
    <div className="flex flex-col items-start gap-3 p-8">
      <h1 className="text-xl font-semibold text-foreground">OnboardingCompletePage</h1>
      <p className="text-sm text-muted-foreground">Screen key: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">onboarding_complete</code></p>
      <div className="mt-4 w-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        <p>This screen is scaffolded and ready for implementation.</p>
        <p className="mt-1 text-xs opacity-60">Onboarding Complete — confirmation screen shown after all setup steps are finished.</p>
      </div>
    </div>
  )
}
