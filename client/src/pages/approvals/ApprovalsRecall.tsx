/**
 * ApprovalsRecall — FC-4 Screen 4.5
 * Screen key: approvals-recall
 * Route: /approvals/recall
 * Role: Preparer (My Submissions)
 *
 * Design: Structured Authority
 * Prompt 4.5: Available state (success-subtle border): recall available, reviewer not opened.
 *   Unavailable state (error-subtle border): cannot recall, reviewer opened at [time].
 *   Recall action returns ContractRecord.status → draft.
 *
 * Data model refs: ApprovalTask (recall_available, opened_at, task_reference)
 */

import { useLocation } from "wouter";
import {
  CheckCircle2, XCircle, RotateCcw, AlertCircle, Clock, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/approvals/tasks/:id/recall-status
const MOCK_RECALL_AVAILABLE = {
  task_reference: "AT-2026-0041",
  record_id: "CR-2026-0088",
  record_title: "Office Tower — 350 Fifth Ave",
  recall_available: true,
  opened_at: null as string | null,
  submitted_at: "2026-05-16T08:00:00Z",
  submitted_to: "M. Thompson (Reviewer)",
};

const MOCK_RECALL_UNAVAILABLE = {
  task_reference: "AT-2026-0040",
  record_id: "CR-2026-0089",
  record_title: "Retail HQ — 1200 Market St",
  recall_available: false,
  opened_at: "2026-05-15T15:00:00Z",
  submitted_at: "2026-05-15T14:20:00Z",
  submitted_to: "M. Thompson (Reviewer)",
};

export default function ApprovalsRecall() {
  const _screenKey = SCREEN_KEYS.APPROVALS_RECALL;
  const [, navigate] = useLocation();

  // Show both states for demo purposes
  const tasks = [MOCK_RECALL_AVAILABLE, MOCK_RECALL_UNAVAILABLE];

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Recall Submission</h1>
            <ScreenNumberBadge screenKey="approvals-recall" />
          </div>
          <p className="page-subtitle">Recall a submitted record before the reviewer opens it</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/approvals/queue")}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
        </Button>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4 max-w-2xl">
        {tasks.map(task => (
          <div
            key={task.task_reference}
            className="bg-card rounded-lg overflow-hidden"
            style={{
              border: task.recall_available
                ? `1px solid var(--color-lg-success)`
                : `1px solid var(--color-lg-error)`,
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b border-border"
              style={{
                background: task.recall_available
                  ? "var(--color-lg-success-subtle)"
                  : "var(--color-lg-error-subtle)",
              }}
            >
              {task.recall_available
                ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                : <XCircle className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
              }
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground">{task.record_title}</p>
                <p className="text-[12px] text-muted-foreground">{task.record_id} · {task.task_reference}</p>
              </div>
              {task.recall_available
                ? <span className="badge-valid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recall Available
                  </span>
                : <span className="badge-invalid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Cannot Recall
                  </span>
              }
            </div>

            {/* Card body */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted {new Date(task.submitted_at).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                </span>
                <span>to {task.submitted_to}</span>
              </div>

              {task.recall_available ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/30 border border-border text-[13px] text-muted-foreground">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-lg-info)]" />
                    <span>
                      The reviewer has <strong>not yet opened</strong> this record. Recalling will return the record to <strong>draft</strong> status and remove it from the reviewer's queue.
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      className="gap-1.5 bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white"
                      onClick={() => navigate("/approvals/queue")}
                    >
                      <RotateCcw className="w-4 h-4" /> Recall Submission
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--color-lg-error-subtle)] border border-[var(--color-lg-error)] text-[13px]">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
                    <span className="text-foreground">
                      The reviewer <strong>opened this record</strong> at{" "}
                      <strong>{task.opened_at ? new Date(task.opened_at).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }) : "—"}</strong> on{" "}
                      {task.opened_at ? new Date(task.opened_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }) : "—"}.
                      Recall is no longer available.
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button disabled variant="outline" className="gap-1.5 border-[var(--color-lg-error)] text-[var(--color-lg-error)] opacity-50">
                      <RotateCcw className="w-4 h-4" /> Recall Unavailable
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
