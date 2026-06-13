/**
 * ApprovalsRework — FC-4 Screen 4.4
 * Screen key: approvals-rework
 * Route: /approvals/rework
 * Role: Preparer (receives rework notification)
 *
 * Design: Structured Authority
 * Prompt 4.4: Rejection detail card (reason codes, flagged fields with error icons, comments).
 *   Rework status bar (iteration count badge, SLA timer).
 *   Actions: "Open for Rework" primary, "View Rejection History" outlined.
 *
 * Data model refs: ApprovalTask (rejection_reason_codes, rejection_flagged_fields,
 *   rejection_comments, rework_iteration, sla_deadline_at)
 */

import { useLocation } from "wouter";
import {
  AlertTriangle, Clock, RotateCcw, History,
  Flag, MessageSquare, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/approvals/tasks/:id/rework
const MOCK_REWORK = {
  task_reference: "AT-2026-0038",
  record_id: "CR-2026-0088",
  record_title: "Office Tower — 350 Fifth Ave",
  rejected_by: "M. Thompson (Reviewer)",
  rejected_at: "2026-05-15T16:30:00Z",
  rework_iteration: 1,
  sla_deadline_at: "2026-05-16T17:00:00Z",
  rejection_reason_codes: ["incorrect_value", "missing_evidence"],
  rejection_flagged_fields: ["base_rent_amount", "security_deposit"],
  rejection_comments: "The base rent amount does not match Amendment 3. Please verify the correct rent figure and provide evidence anchor from Amendment 3 Section 2.1. Security deposit amount is missing — please locate and extract from the lease agreement.",
};

const REASON_LABELS: Record<string, string> = {
  incorrect_value:       "Incorrect Value",
  missing_evidence:      "Missing Evidence",
  incomplete_extraction: "Incomplete Extraction",
  classification_error:  "Classification Error",
};

const FIELD_LABELS: Record<string, string> = {
  base_rent_amount: "Base Rent Amount",
  security_deposit: "Security Deposit",
  commencement_date: "Commencement Date",
  expiration_date: "Expiration Date",
};

function getSlaStatus(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  const hours = ms / (1000 * 60 * 60);
  if (hours < 0) return { label:"Overdue", cls:"badge-invalid" };
  if (hours < 4) return { label:`${Math.floor(hours)}h remaining`, cls:"badge-invalid" };
  if (hours < 24) return { label:`${Math.floor(hours)}h remaining`, cls:"badge-warning" };
  const days = Math.floor(hours / 24);
  return { label:`${days}d remaining`, cls:"badge-valid" };
}

export default function ApprovalsRework() {
  const _screenKey = SCREEN_KEYS.APPROVALS_REWORK;
  const [, navigate] = useLocation();
  const r = MOCK_REWORK;
  const sla = getSlaStatus(r.sla_deadline_at);

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Rework Required</h1>
            <ScreenNumberBadge screenKey="approvals-rework" />
          </div>
          <p className="page-subtitle">{r.record_id} · {r.record_title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/approvals/queue")}>
            <History className="w-3.5 h-3.5" /> View Rejection History
          </Button>
          <Button className="gap-1.5" onClick={() => navigate("/extraction/verify")}>
            <RotateCcw className="w-4 h-4" /> Open for Rework
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5 max-w-3xl">
        {/* Rework status bar */}
        <div className="flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">Iteration</span>
            <span className="badge-warning inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold">
              #{r.rework_iteration}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">SLA Deadline</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${sla.cls}`}>
              {sla.label}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">Rejected by</span>
            <span className="text-[13px] font-medium text-foreground">{r.rejected_by}</span>
          </div>
        </div>

        {/* Rejection detail card */}
        <div
          className="bg-card rounded-lg overflow-hidden"
          style={{ border:"1px solid var(--color-lg-error)" }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-[var(--color-lg-error-subtle)]">
            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
            <h2 className="text-[14px] font-semibold" style={{ color:"var(--color-lg-error)" }}>Rejection Details</h2>
            <span className="text-[12px] text-muted-foreground ml-auto">
              {new Date(r.rejected_at).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" })}
            </span>
          </div>

          {/* Reason codes */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reason Codes</p>
            <div className="flex flex-wrap gap-2">
              {r.rejection_reason_codes.map(code => (
                <span key={code} className="badge-invalid inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> {REASON_LABELS[code] || code}
                </span>
              ))}
            </div>
          </div>

          {/* Flagged fields */}
          {r.rejection_flagged_fields.length > 0 && (
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Flagged Fields</p>
              <div className="flex flex-col gap-2">
                {r.rejection_flagged_fields.map(fieldName => (
                  <div key={fieldName} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)] text-[13px]">
                    <Flag className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
                    <span className="font-medium text-foreground">{FIELD_LABELS[fieldName] || fieldName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection comments */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Reviewer Comments</p>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{r.rejection_comments}</p>
          </div>
        </div>

        {/* Action guidance */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-muted/20 text-[13px] text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-lg-info)]" />
          <span>
            Address all flagged fields and reason codes before resubmitting. Each resubmission increments the rework iteration counter and resets the SLA timer.
          </span>
        </div>
      </div>
    </div>
  );
}
