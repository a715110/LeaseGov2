/**
 * ReassessmentUpdate — FC-6 Workflow Screen
 * Screen key: reassessment-update
 * Route: /workflows/reassessment/update
 * Role: Business Submitter / Lease Admin
 *
 * Planned function: Captures triggering event data and queues the case
 * for classification by the Reassessment team.
 *
 * Design: Structured Authority
 */
import { PageHeader } from '@/components/shared/PageHeader';
import { ScreenGate } from '@/components/shared/ScreenGate';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { AlertTriangle, GitBranch } from 'lucide-react';

export default function ReassessmentUpdatePage() {
  useDocumentTitle('Reassessment Update — LeaseGov');

  return (
    <ScreenGate screenKey={SCREEN_KEYS.REASSESSMENT_UPDATE}>
      <div className="flex h-full flex-col">
        <PageHeader
          title="Reassessment Update"
          subtitle="Capture triggering event data and queue the case for classification"
        />
        <div className="flex flex-1 gap-6 overflow-auto p-6">
          {/* Left column — under construction callout */}
          <div className="w-full max-w-[640px] space-y-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Under Construction — Reassessment Update
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    This screen will allow Business Submitters and Lease Admins to record a
                    triggering event (e.g. option exercise, rent modification, lease extension)
                    against an existing contract record. The submitted event data is validated
                    against the active lease terms and queued for classification by the
                    Reassessment team. Planned fields include: event type, effective date,
                    supporting document upload, and free-text description.
                  </p>
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                    Screen key: <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 py-0.5 font-mono">reassessment-update</code>
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
                  <span>Trigger Identified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-semibold text-foreground">→ Event Captured (this screen)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Queued for Classification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span>Approval</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenGate>
  );
}
