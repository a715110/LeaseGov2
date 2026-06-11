/**
 * ReassessmentApproval — FC-6 Workflow Screen
 * Screen key: reassessment-approval
 * Route: /workflows/reassessment/approval
 * Role: Approver / Controller
 *
 * Planned function: Final approval gate for reassessment cases.
 * Approver reviews the complete memo package, confirms SoD compliance,
 * and issues final approval or rejection with mandatory rejection codes.
 *
 * Design: Structured Authority
 */
import { PageHeader } from '@/components/shared/PageHeader';
import { ScreenGate } from '@/components/shared/ScreenGate';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { AlertTriangle, GitBranch } from 'lucide-react';

export default function ReassessmentApprovalPage() {
  useDocumentTitle('Reassessment Approval — LeaseGov');

  return (
    <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_APPROVAL}>
      <div className="flex h-full flex-col">
        <PageHeader
          title="Reassessment Approval"
          subtitle="Final approval gate — SoD-enforced sign-off on the reassessment memo package"
        />
        <div className="flex flex-1 gap-6 overflow-auto p-6">
          {/* Left column — under construction callout */}
          <div className="w-full max-w-[640px] space-y-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Under Construction — Reassessment Approval
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    This screen will present the complete reassessment memo package to the
                    Approver or Controller for final sign-off. The system enforces Segregation
                    of Duties — the Approver cannot be the same individual who prepared or
                    reviewed the case. Planned features include: full memo package viewer,
                    SoD identity check badge, deferred-field acknowledgement checklist,
                    mandatory rejection codes on reject, and immutable audit stamp on approval.
                  </p>
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                    Screen key: <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 py-0.5 font-mono">reassessment-approval</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — state machine position */}
          <div className="w-72 shrink-0">
            <div className="rounded-lg border border-border bg-muted/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  State Machine Position
                </p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Event Captured</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Classification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Analyst Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Memo Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">→ Final Approval (this screen)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenGate>
  );
}
