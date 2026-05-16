/**
 * ReassessmentMemo — FC-6 Screen 6.8
 * Screen key: reassessment-memo
 * Route: /reassessment/cases/:id/memo
 *
 * Standalone memo editing screen (separate from Analysis tab).
 * Action/No-Action toggle. Auto-populated editable sections.
 * Evidence references. Generate PDF. Submit for Approval.
 *
 * Data model refs: ReassessmentCase (is_no_action, case_reference)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/reassessments/cases/:id/memo
const MOCK_CASE = {
  id: "c7",
  case_ref: "RC-2026-0008",
  contract_number: "CR-2026-0088",
  title: "Office Tower — 350 Fifth Ave",
  is_remediation: false,
};

const MEMO_SECTIONS = [
  { key:"background",  label:"Background",         content:"This reassessment was initiated following an option exercise assessment for the Office Tower lease (CR-2026-0088). The lessee has indicated a high probability of exercising the renewal option." },
  { key:"trigger",     label:"Triggering Event",   content:"Option exercise assessment completed on 2026-05-08. Probability determined to be 88% (Reasonably Certain). Tier 2 full assessment conducted due to financial impact exceeding materiality threshold." },
  { key:"methodology", label:"Methodology",        content:"Remeasurement performed using the revised lease term of 84 months and updated incremental borrowing rate of 4.75% as at the reassessment date." },
  { key:"impact",      label:"Financial Impact",   content:"Lease liability increased by $1,640,000. ROU asset increased by $1,620,000. Net impact on opening retained earnings: nil (prospective adjustment)." },
  { key:"conclusion",  label:"Conclusion",         content:"The reassessment results in a material increase to the lease liability and ROU asset. The accounting treatment is consistent with IFRS 16 paragraph 45." },
];

const NO_ACTION_SECTIONS = [
  { key:"background",  label:"Background",         content:"This reassessment case was opened following a period-end sweep review of the Office Tower lease (CR-2026-0088)." },
  { key:"assessment",  label:"Assessment",         content:"Following a Tier 1 rapid assessment, no indicators of a change in exercise probability were identified. The lessee's intent and business plan remain unchanged." },
  { key:"conclusion",  label:"Conclusion",         content:"No reassessment action is required at this time. The existing accounting treatment remains appropriate. This case is closed with no-action status." },
];

export default function ReassessmentMemo() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_MEMO;
  const [, navigate] = useLocation();

  const [memoType, setMemoType] = useState<"action" | "no_action">("action");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const sections = memoType === "action" ? MEMO_SECTIONS : NO_ACTION_SECTIONS;

  function getContent(key: string) {
    return edits[key] ?? sections.find(s => s.key === key)?.content ?? "";
  }

  // TODO: Backend integration required — POST /api/reassessments/cases/:id/submit-approval
  function handleSubmit() { setSubmitted(true); }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Memo Submitted for Approval</p>
          <p className="text-[13px] text-muted-foreground">Case {MOCK_CASE.case_ref} is now pending approval.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
            <Button onClick={() => navigate("/approvals/queue")}>View Approval Queue</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {MOCK_CASE.is_remediation && (
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ background:"var(--color-lg-error-subtle)", borderColor:"var(--color-lg-error)" }}>
          <AlertTriangle className="w-4 h-4" style={{ color:"var(--color-lg-error)" }} />
          <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-error)" }}>Remediation Case — Escalated approval required</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <h1 className="page-title">Reassessment Memo</h1>
          <p className="page-subtitle">{MOCK_CASE.title}</p>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-5 max-w-3xl">
        {/* Memo type toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-foreground">Memo Type:</span>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
            {(["action","no_action"] as const).map(t => (
              <button
                key={t}
                className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${memoType === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                onClick={() => { setMemoType(t); setEdits({}); }}
              >
                {t === "action" ? "Action Memo" : "No-Action Memo"}
              </button>
            ))}
          </div>
        </div>

        {/* Memo sections */}
        {sections.map(section => (
          <div key={section.key} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h3 className="text-[13px] font-semibold text-foreground">{section.label}</h3>
            </div>
            <div className="p-4" style={{ background:"var(--color-lg-warning-subtle)" }}>
              <Textarea
                rows={3}
                className="text-[13px] resize-none bg-transparent border-0 p-0 focus:ring-0"
                value={getContent(section.key)}
                onChange={e => setEdits(prev => ({ ...prev, [section.key]: e.target.value }))}
              />
            </div>
          </div>
        ))}

        {/* Evidence references */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Evidence References</h3>
          <div className="flex flex-col gap-2 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Option Assessment Record — RC-2026-0008-OAR-001</div>
            <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Lease Agreement Amendment — DOC-2026-0088-AMD-003</div>
            <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Incremental Borrowing Rate Confirmation — FIN-2026-Q2-IBR</div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" /> Generate PDF
          </Button>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Save Draft</Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" /> Export Recalculation Package
          </Button>
          <Button onClick={handleSubmit}>Submit for Approval</Button>
        </div>
      </div>
    </div>
  );
}
