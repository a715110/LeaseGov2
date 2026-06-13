/**
 * ReassessmentRemediation — FC-6 Screen 6.10
 * Screen key: reassessment-remediation
 * Route: /reassessment/cases/:id/remediation
 *
 * Prompt 6.10: 8-step remediation workspace.
 * Horizontal stepper (Impact → Backdated → Remeasurement active → Catch-Up →
 *   Journal → Financials → Root Cause → Close).
 * Active step expanded with Before/After. Completed steps collapsed.
 * "Save Progress" outlined, "Submit for Escalated Approval" disabled until all 8 complete.
 * Warning escalation notice.
 *
 * Data model refs: ReassessmentCase (is_remediation, trigger_date, detection_date)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/cases/:id
const MOCK_CASE = {
  id: "c6",
  case_ref: "RC-2026-0009",
  contract_number: "CR-2026-0028",
  title: "Parking Garage — Level B2",
  trigger_date: "2025-11-01",
  detection_date: "2026-04-15",
  missed_months: 5,
};

const STEPS = [
  { id:1, label:"Impact Assessment",    desc:"Quantify the financial impact of the missed trigger period." },
  { id:2, label:"Backdated Calculation",desc:"Calculate lease liability and ROU asset as at the original trigger date." },
  { id:3, label:"Remeasurement",        desc:"Apply revised lease terms from the trigger date forward." },
  { id:4, label:"Catch-Up Entries",     desc:"Prepare catch-up journal entries for the missed periods." },
  { id:5, label:"Journal Entries",      desc:"Record the correcting journal entries in the general ledger." },
  { id:6, label:"Financial Statements", desc:"Assess impact on current period financial statements." },
  { id:7, label:"Root Cause Analysis",  desc:"Document the reason for the missed trigger detection." },
  { id:8, label:"Close & Escalate",     desc:"Confirm all steps complete and submit for escalated approval." },
];

const BEFORE_AFTER_STEP3 = {
  lease_liability: { before: 890_000, after: 1_240_000 },
  rou_asset:       { before: 850_000, after: 1_190_000 },
  monthly_payment: { before: 18_500,  after: 22_000 },
};

export default function ReassessmentRemediation() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_REMEDIATION;
  const [, navigate] = useLocation();

  const [activeStep, setActiveStep] = useState(3); // step 3 is active
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([1, 2]));
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allComplete = completedSteps.size === 8;

  function completeStep(step: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
    if (step < 8) setActiveStep(step + 1);
  }

  // TODO: Backend integration required — POST /api/reassessments/cases/:id/submit-escalated
  function handleSubmit() { setSubmitted(true); }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Submitted for Escalated Approval</p>
          <p className="text-[13px] text-muted-foreground">Remediation case {MOCK_CASE.case_ref} submitted. A Controller-level approver has been notified.</p>
          <Button onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Remediation header banner */}
      <div
        className="px-6 py-3 border-b flex items-center gap-3"
        style={{ background:"var(--color-lg-error-subtle)", borderColor:"var(--color-lg-error)" }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-error)" }} />
        <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-error)" }}>
          Remediation Case — Trigger missed by {MOCK_CASE.missed_months} months ({MOCK_CASE.trigger_date} → detected {MOCK_CASE.detection_date}). Escalated approval required.
        </span>
      </div>

      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Remediation Workspace</h1>
            <ScreenNumberBadge screenKey="reassessment-remediation" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-muted-foreground">{completedSteps.size} of 8 steps complete</p>
          <div className="h-1.5 w-40 bg-muted rounded-full mt-1.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width:`${(completedSteps.size/8)*100}%`, background:"var(--color-lg-primary)" }} />
          </div>
        </div>
      </div>

      {/* Horizontal stepper */}
      <div className="px-6 pb-2 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STEPS.map((step, i) => {
            const isComplete = completedSteps.has(step.id);
            const isActive = activeStep === step.id;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  className="flex flex-col items-center gap-1 px-3 py-2"
                  onClick={() => setActiveStep(step.id)}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all"
                    style={{
                      borderColor: isComplete ? "var(--color-lg-success)" : isActive ? "var(--color-lg-primary)" : "var(--border)",
                      background:  isComplete ? "var(--color-lg-success)" : isActive ? "var(--color-lg-primary)" : "transparent",
                      color:       isComplete || isActive ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {isComplete ? "✓" : step.id}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? "text-[var(--color-lg-primary)]" : isComplete ? "text-[var(--color-lg-success)]" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="h-0.5 w-6 mb-4" style={{ background: completedSteps.has(step.id) ? "var(--color-lg-success)" : "var(--border)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-4 max-w-3xl">
        {STEPS.map(step => {
          const isComplete = completedSteps.has(step.id);
          const isActive = activeStep === step.id;
          if (!isActive && !isComplete) return null;

          return (
            <div
              key={step.id}
              className="bg-card border rounded-lg overflow-hidden"
              style={{ borderColor: isActive ? "var(--color-lg-primary)" : isComplete ? "var(--color-lg-success)" : "var(--border)" }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-3.5"
                onClick={() => setActiveStep(isActive ? 0 : step.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: isComplete ? "var(--color-lg-success)" : "var(--color-lg-primary)", color:"white" }}
                  >
                    {isComplete ? "✓" : step.id}
                  </div>
                  <span className="text-[13px] font-semibold text-foreground">{step.label}</span>
                </div>
                {isActive ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isActive && (
                <div className="px-5 pb-5 border-t border-border flex flex-col gap-4">
                  <p className="text-[13px] text-muted-foreground pt-3">{step.desc}</p>

                  {/* Step 3 — Before/After comparison */}
                  {step.id === 3 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="text-[12px] font-semibold text-muted-foreground mb-2">Before (Original)</h4>
                        {Object.entries(BEFORE_AFTER_STEP3).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[12px] mb-1">
                            <span className="text-muted-foreground capitalize">{k.replace(/_/g," ")}</span>
                            <span className="font-semibold">${v.before.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg p-4 border-2" style={{ background:"var(--color-lg-accent-subtle)", borderColor:"var(--color-lg-primary)" }}>
                        <h4 className="text-[12px] font-semibold mb-2" style={{ color:"var(--color-lg-primary)" }}>After (Backdated)</h4>
                        {Object.entries(BEFORE_AFTER_STEP3).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[12px] mb-1">
                            <span className="text-muted-foreground capitalize">{k.replace(/_/g," ")}</span>
                            <span className="font-bold" style={{ color:"var(--color-lg-primary)" }}>${v.after.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-foreground">Step Notes</label>
                    <Textarea
                      rows={3}
                      className="text-[13px] resize-none"
                      placeholder={`Notes for ${step.label}…`}
                      value={stepNotes[step.id] || ""}
                      onChange={e => setStepNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => completeStep(step.id)}
                      disabled={isComplete}
                    >
                      {isComplete ? "Completed" : `Complete Step ${step.id}`}
                    </Button>
                  </div>
                </div>
              )}

              {isComplete && !isActive && (
                <div className="px-5 pb-3 border-t border-border">
                  <p className="text-[12px] text-muted-foreground pt-2">{stepNotes[step.id] || "Step completed."}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Escalation notice */}
        <div
          className="rounded-lg border-l-4 px-4 py-3 flex items-start gap-3"
          style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
          <p className="text-[12px]" style={{ color:"var(--color-lg-warning)" }}>
            Remediation cases require Controller-level approval. Submission will notify the assigned Controller and create an escalated approval task.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Save Progress</Button>
          <Button disabled={!allComplete} onClick={handleSubmit}>
            Submit for Escalated Approval
          </Button>
        </div>
      </div>
    </div>
  );
}
