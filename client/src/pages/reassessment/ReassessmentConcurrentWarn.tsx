/**
 * ReassessmentConcurrentWarn — FC-6 Screen 6.11
 * Screen key: reassessment-concurrent-warning
 * Route: /reassessment/cases/:id/concurrent
 *
 * Prompt 6.11: Warning banner (warning-subtle background, 4px warning left border).
 * Warning icon + "This lease has N existing open cases."
 * Compact table: Case ID (linked), Trigger Type, Status, Assigned, Effective Date.
 * Dismiss button. Baseline confirmation note.
 * Require explicit acknowledgment checkbox before proceeding.
 *
 * Data model refs: ReassessmentCase (concurrent_case_ids)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/cases/:id/concurrent
const MOCK_CASE = {
  id: "c4",
  case_ref: "RC-2026-0011",
  contract_number: "CR-2026-0041",
  title: "Data Center — 500 Tech Park",
};

const CONCURRENT_CASES = [
  { id:"c3", case_ref:"RC-2026-0012", trigger_type:"opt_assess",    status:"assessment_review",      assigned:"A. Chen",     effective_date:"2026-04-01" },
  { id:"c8", case_ref:"RC-2026-0007", trigger_type:"mod_index",     status:"analysis_in_progress",   assigned:"A. Chen",     effective_date:"2026-02-15" },
];

const STATUS_BADGE: Record<string, string> = {
  assessment_review:    "badge-processing",
  analysis_in_progress: "badge-processing",
  pending_approval:     "badge-warning",
  approved:             "badge-valid",
};

const STATUS_LABEL: Record<string, string> = {
  assessment_review:    "Assessment Review",
  analysis_in_progress: "Analysis In Progress",
  pending_approval:     "Pending Approval",
  approved:             "Approved",
};

export default function ReassessmentConcurrentWarn() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_CONCURRENT_WARN;
  const [, navigate] = useLocation();
  const [acknowledged, setAcknowledged] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-[16px] font-semibold text-foreground">Warning Acknowledged</p>
          <p className="text-[13px] text-muted-foreground">You may now proceed with the classification step.</p>
          <Button onClick={() => navigate(`/reassessment/cases/${MOCK_CASE.id}/classify`)}>
            Proceed to Classification <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Concurrent Case Warning</h1>
            <ScreenNumberBadge screenKey="reassessment-concurrent-warning" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title}</p>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5 max-w-3xl">
        {/* Warning banner */}
        <div
          className="rounded-lg border-l-4 px-5 py-4 flex flex-col gap-4"
          style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
            <div>
              <p className="text-[14px] font-bold" style={{ color:"var(--color-lg-warning)" }}>
                This lease has {CONCURRENT_CASES.length} existing open case{CONCURRENT_CASES.length !== 1 ? "s" : ""}
              </p>
              <p className="text-[12px] mt-1" style={{ color:"var(--color-lg-warning)" }}>
                Review the concurrent cases below before proceeding with classification. Ensure your baseline assumptions account for any in-progress modifications or reassessments.
              </p>
            </div>
          </div>

          {/* Concurrent cases table */}
          <div className="bg-white/60 rounded-lg overflow-hidden border border-[var(--color-lg-warning)]">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-lg-warning)]">
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Case ID</th>
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Trigger Type</th>
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Assigned</th>
                  <th className="text-left px-4 py-2 font-semibold text-foreground">Effective Date</th>
                </tr>
              </thead>
              <tbody>
                {CONCURRENT_CASES.map(c => (
                  <tr key={c.id} className="border-b border-[var(--color-lg-warning)]/30 last:border-0">
                    <td className="px-4 py-2.5">
                      <button
                        className="font-mono font-semibold underline"
                        style={{ color:"var(--color-lg-primary)" }}
                        onClick={() => navigate(`/reassessment/cases/${c.id}/classify`)}
                      >
                        {c.case_ref}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.trigger_type.replace(/_/g," ")}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[c.status] || "badge-muted"}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.assigned}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.effective_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Baseline confirmation note */}
        <div className="bg-card border border-border rounded-lg p-4 text-[12px] text-muted-foreground">
          <strong className="text-foreground">Baseline note:</strong> Your classification and assessment should use the lease terms as they stand <em>after</em> any approved concurrent modifications. If concurrent cases are still in progress, coordinate with the assigned preparers before proceeding.
        </div>

        {/* Acknowledgment checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="w-4 h-4 mt-0.5"
          />
          <span className="text-[13px] text-foreground">
            I have reviewed the concurrent cases and understand that my baseline assumptions must account for any in-progress changes to this lease.
          </span>
        </label>

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
          <Button disabled={!acknowledged} onClick={() => setDismissed(true)}>
            Acknowledge & Proceed to Classification
          </Button>
        </div>
      </div>
    </div>
  );
}
