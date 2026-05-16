/**
 * ReassessmentSweep — FC-6 Screen 6.3
 * Screen key: reassessment-sweep
 * Route: /reassessment/sweep
 *
 * Prompt 6.3: Bulk review interface — all records due for periodic re-evaluation.
 * Table with inline Tier 1 quick-assessment per row.
 * Batch submit creates multiple ReassessmentCase records.
 * Progress indicator: N of M records reviewed.
 *
 * Data model refs: ReassessmentCase (path_type, trigger_type),
 *   WatchlistEntry (next_review_date, priority)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/reassessments/sweep-candidates
const SWEEP_RECORDS = [
  { id:"r1",  contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",     expiry:"2032-12-31", priority:"high",   days_overdue:0,  assessment: null },
  { id:"r2",  contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",         expiry:"2028-06-30", priority:"high",   days_overdue:3,  assessment: null },
  { id:"r3",  contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",    expiry:"2030-03-31", priority:"medium", days_overdue:0,  assessment: null },
  { id:"r4",  contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",      expiry:"2027-09-30", priority:"medium", days_overdue:0,  assessment: null },
  { id:"r5",  contract_number:"CR-2026-0033", title:"Branch Office — 88 Main St",       expiry:"2026-12-31", priority:"low",    days_overdue:0,  assessment: null },
  { id:"r6",  contract_number:"CR-2026-0028", title:"Parking Garage — Level B2",        expiry:"2029-08-31", priority:"low",    days_overdue:0,  assessment: null },
];

type Assessment = "no_change" | "trigger_required" | null;

interface RowState {
  expanded: boolean;
  assessment: Assessment;
  notes: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  high:   "badge-invalid",
  medium: "badge-warning",
  low:    "badge-muted",
};

export default function ReassessmentSweep() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_SWEEP;
  const [, navigate] = useLocation();

  const [rows, setRows] = useState<Record<string, RowState>>(
    Object.fromEntries(SWEEP_RECORDS.map(r => [r.id, { expanded:false, assessment:null, notes:"" }]))
  );
  const [submitted, setSubmitted] = useState(false);

  const reviewedCount = Object.values(rows).filter(r => r.assessment !== null).length;
  const triggeredCount = Object.values(rows).filter(r => r.assessment === "trigger_required").length;
  const progressPct = Math.round((reviewedCount / SWEEP_RECORDS.length) * 100);

  function toggleRow(id: string) {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], expanded: !prev[id].expanded } }));
  }

  function setAssessment(id: string, val: Assessment) {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], assessment: val, expanded: val === "trigger_required" } }));
  }

  function setNotes(id: string, val: string) {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], notes: val } }));
  }

  // TODO: Backend integration required — POST /api/reassessments/sweep-batch
  function handleBatchSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Period-End Sweep Submitted</p>
          <p className="text-[13px] text-muted-foreground">
            {reviewedCount} records reviewed. {triggeredCount} trigger report{triggeredCount !== 1 ? "s" : ""} created.
          </p>
          <Button onClick={() => navigate("/reassessment/cases")}>View Cases</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Period-End Sweep</h1>
          <p className="page-subtitle">Review all records due for periodic re-evaluation — May 2026</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/reassessment/dashboard")}>Cancel</Button>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-4">
        {/* Progress bar */}
        <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-foreground">{reviewedCount} of {SWEEP_RECORDS.length} records reviewed</span>
              <span className="text-[12px] text-muted-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width:`${progressPct}%`, background:"var(--color-lg-primary)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-[20px] font-bold" style={{ color:"var(--color-lg-success)" }}>{Object.values(rows).filter(r => r.assessment === "no_change").length}</p>
              <p className="text-[11px] text-muted-foreground">No Change</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold" style={{ color:"var(--color-lg-warning)" }}>{triggeredCount}</p>
              <p className="text-[11px] text-muted-foreground">Triggers</p>
            </div>
          </div>
        </div>

        {/* Records table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {SWEEP_RECORDS.map(record => {
              const row = rows[record.id];
              const isReviewed = row.assessment !== null;
              return (
                <div key={record.id} className={`transition-colors ${isReviewed ? "bg-muted/10" : ""}`}>
                  {/* Row header */}
                  <div className="flex items-center gap-4 px-5 py-3.5">
                    <button className="shrink-0" onClick={() => toggleRow(record.id)}>
                      {row.expanded
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-muted-foreground">{record.contract_number}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_BADGE[record.priority]}`}>
                          {record.priority}
                        </span>
                        {record.days_overdue > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold badge-invalid">
                            <AlertTriangle className="w-3 h-3" /> {record.days_overdue}d overdue
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-foreground truncate">{record.title}</p>
                    </div>
                    <span className="text-[12px] text-muted-foreground shrink-0">Expires {record.expiry}</span>
                    {/* Quick assessment buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-all ${row.assessment === "no_change" ? "border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)] text-[var(--color-lg-success)]" : "border-border text-muted-foreground hover:border-[var(--color-lg-success)]"}`}
                        onClick={() => setAssessment(record.id, "no_change")}
                      >
                        No Change
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-all ${row.assessment === "trigger_required" ? "border-[var(--color-lg-warning)] bg-[var(--color-lg-warning-subtle)] text-[var(--color-lg-warning)]" : "border-border text-muted-foreground hover:border-[var(--color-lg-warning)]"}`}
                        onClick={() => setAssessment(record.id, "trigger_required")}
                      >
                        Trigger Required
                      </button>
                    </div>
                    {isReviewed && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
                  </div>

                  {/* Expanded notes (shown when trigger_required) */}
                  {row.expanded && row.assessment === "trigger_required" && (
                    <div className="px-12 pb-4">
                      <textarea
                        className="w-full text-[12px] border border-border rounded-lg p-3 bg-background resize-none focus:outline-none"
                        rows={2}
                        placeholder="Brief description of the triggering event…"
                        value={row.notes}
                        onChange={e => setNotes(record.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Batch submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[12px] text-muted-foreground">
            {SWEEP_RECORDS.length - reviewedCount} record{SWEEP_RECORDS.length - reviewedCount !== 1 ? "s" : ""} remaining
          </p>
          <Button
            disabled={reviewedCount < SWEEP_RECORDS.length}
            onClick={handleBatchSubmit}
          >
            Submit Sweep ({reviewedCount}/{SWEEP_RECORDS.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
