/**
 * ExportPreflight — FC-7 Screen 7.3
 * Screen key: export-preflight
 * Route: /export/preflight
 *
 * Prompt 7.3: Pre-flight validation checklist.
 * 6 sequential validation steps with pass/fail/warning states.
 * Any failing step shows specific reason and fix action link.
 * "Begin Upload Task" disabled until all 6 steps pass.
 *
 * Validation steps:
 *   1. All 73 fields have a final disposition
 *   2. All 22 critical fields confirmed
 *   3. All critical evidence anchors present
 *   4. No unresolved blocking package flags
 *   5. Export template version matches locked version
 *   6. Record status = approved
 */

import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type StepStatus = "pass" | "fail" | "warning" | "pending";

interface PreflightStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  detail?: string;
  fix_label?: string;
  fix_route?: string;
}

// TODO: Backend integration required — POST /api/export/tasks/:id/preflight
const INITIAL_STEPS: PreflightStep[] = [
  {
    id:"s1",
    title:"All fields have a final disposition",
    description:"73 of 73 template fields must have a disposition (confirmed, deferred, or overridden)",
    status:"pass",
    detail:"73/73 fields dispositioned",
  },
  {
    id:"s2",
    title:"All critical fields confirmed",
    description:"22 critical fields must be confirmed — deferred or pending critical fields block export",
    status:"fail",
    detail:"1 critical field deferred: Renewal Option Term (C5)",
    fix_label:"Return to Staging",
    fix_route:"/export/staging",
  },
  {
    id:"s3",
    title:"All critical evidence anchors present",
    description:"Every critical field must have at least one EvidenceAnchor linking to a source document page",
    status:"pass",
    detail:"21/22 anchors present (deferred field excluded)",
  },
  {
    id:"s4",
    title:"No unresolved blocking package flags",
    description:"ContractPackage must have zero blocking flags in unresolved state",
    status:"pass",
    detail:"0 blocking flags",
  },
  {
    id:"s5",
    title:"Export template version matches locked version",
    description:"The template version locked at task creation must match the currently active version",
    status:"warning",
    detail:"Task locked to v3.2 — active template is v3.3. This task will proceed with v3.2.",
  },
  {
    id:"s6",
    title:"Record status is approved",
    description:"ContractRecord.status must be 'approved' before export can proceed",
    status:"pass",
    detail:"CR-2026-0041 status: approved",
  },
];

const STATUS_ICON = {
  pass:    <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} />,
  fail:    <XCircle      className="w-5 h-5" style={{ color:"var(--color-lg-error)" }} />,
  warning: <AlertTriangle className="w-5 h-5" style={{ color:"var(--color-lg-warning)" }} />,
  pending: <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />,
};

const STATUS_BG: Record<StepStatus, string> = {
  pass:    "border-[var(--color-lg-success)]",
  fail:    "border-[var(--color-lg-error)]",
  warning: "border-[var(--color-lg-warning)]",
  pending: "border-border",
};

// Task data for the context bar — mirrors MOCK_UPLOAD_TASKS in ExportUploadTask
const PREFLIGHT_TASK_META: Record<string, { task_ref: string; record_id: string; template_name: string }> = {
  ut1: { task_ref: 'UT-2026-0041', record_id: 'CR-2026-0041', template_name: 'New Lease Onboarding v3.2' },
  ut2: { task_ref: 'UT-2026-0038', record_id: 'CR-2026-0038', template_name: 'Lease Renewal v2.1' },
  ut3: { task_ref: 'UT-2026-0035', record_id: 'CR-2026-0035', template_name: 'Sublease Addendum v1.4' },
};

export default function ExportPreflight() {
  const _screenKey = SCREEN_KEYS.EXPORT_PREFLIGHT;
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  // Read task ID from ?task= query param; fall back to ut1
  const taskId = useMemo(() => {
    const params = new URLSearchParams(searchStr);
    return params.get('task') ?? 'ut1';
  }, [searchStr]);
  const taskMeta = PREFLIGHT_TASK_META[taskId] ?? PREFLIGHT_TASK_META.ut1;

  const [steps, setSteps] = useState<PreflightStep[]>(INITIAL_STEPS);
  const [running, setRunning] = useState(false);

  const allPass = steps.every(s => s.status === "pass" || s.status === "warning");
  const hasFailures = steps.some(s => s.status === "fail");

  // TODO: Backend integration required — re-run preflight checks
  function reRunChecks() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      // Simulate re-check (in real app, would fetch updated results)
    }, 1500);
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Pre-Flight Validation</h1>
            <ScreenNumberBadge screenKey="export-preflight" />
          </div>
          <p className="page-subtitle">All 6 checks must pass before the Upload Task can begin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5 h-8 text-[12px]" onClick={reRunChecks} disabled={running}>
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Re-run Checks
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-4 max-w-3xl">
        {/* Task context */}
        <div className="bg-card border border-border rounded-lg px-5 py-3 flex items-center gap-6 text-[12px]">
          <div><span className="text-muted-foreground">Task: </span><span className="font-mono font-semibold text-foreground">{taskMeta.task_ref}</span></div>
          <div><span className="text-muted-foreground">Record: </span><span className="font-mono font-semibold text-foreground">{taskMeta.record_id}</span></div>
          <div><span className="text-muted-foreground">Template: </span><span className="font-medium text-foreground">{taskMeta.template_name}</span></div>
          <div className="ml-auto">
            {hasFailures
              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-error"><XCircle className="w-3 h-3" /> {steps.filter(s=>s.status==="fail").length} check{steps.filter(s=>s.status==="fail").length!==1?"s":""} failed</span>
              : allPass
              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-valid"><CheckCircle2 className="w-3 h-3" /> All checks passed</span>
              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-muted">Checking…</span>
            }
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`bg-card border-l-4 rounded-lg p-5 ${STATUS_BG[step.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{STATUS_ICON[step.status]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground">CHECK {i + 1}</span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground mt-0.5">{step.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{step.description}</p>
                  {step.detail && (
                    <p
                      className="text-[12px] font-medium mt-2"
                      style={{
                        color: step.status === "pass" ? "var(--color-lg-success)"
                          : step.status === "fail" ? "var(--color-lg-error)"
                          : "var(--color-lg-warning)",
                      }}
                    >
                      {step.detail}
                    </p>
                  )}
                  {step.status === "fail" && step.fix_label && step.fix_route && (
                    <button
                      className="mt-2 text-[12px] font-semibold underline"
                      style={{ color:"var(--color-lg-primary)" }}
                      onClick={() => navigate(step.fix_route!)}
                    >
                      {step.fix_label} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate(`/export/staging?task=${taskId}`)}>Back to Staging</Button>
          <Button
            disabled={!allPass || hasFailures}
            onClick={() => navigate(`/export/tasks/${taskId}`)}
            className="gap-1.5"
          >
            Begin Upload Task <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
