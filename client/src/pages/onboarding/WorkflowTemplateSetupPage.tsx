/**
 * WorkflowTemplateSetupPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Screen ID:  ON.4
 * Screen key: workflow_template_setup
 * Access:     SuperAdmin only
 *
 * Workflow Template Setup — assign workflow templates to the new tenant.
SuperAdmin selects which contract workflow templates are active for this organization.
 *
 * Status: Stub — to be implemented in FC-10 cluster session.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function WorkflowTemplateSetupPage() {
  return (
    <div className="flex flex-col items-start gap-3 p-8">
      <h1 className="text-xl font-semibold text-foreground">WorkflowTemplateSetupPage</h1>
      <p className="text-sm text-muted-foreground">Screen key: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">workflow_template_setup</code></p>
      <div className="mt-4 w-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        <p>This screen is scaffolded and ready for implementation.</p>
        <p className="mt-1 text-xs opacity-60">Workflow Template Setup — assign workflow templates to the new tenant.</p>
      </div>
    </div>
  )
}
