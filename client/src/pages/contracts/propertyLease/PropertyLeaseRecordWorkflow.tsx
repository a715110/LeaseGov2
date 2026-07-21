/**
 * RecordTabWorkflow — Tab component consumed by RecordsDetail
 * FC-5 Screen 5.x — Workflow tab
 *
 * Shows: workflow summary header, 6-step approval timeline with SLA/duration,
 * approval task links, and a Rework History section (decline → resubmit cycles).
 * Live event sync: SUBMIT_FOR_REVIEW, REVIEW_OPENED, REVIEW_COMPLETED,
 *   APPROVE_FOR_FINAL, RECORD_APPROVED, DECLINE_SUBMITTED update step statuses.
 *
 * TODO: Backend integration required — GET /api/records/:id/workflow
 * Design: Structured Authority — dense information hierarchy, amber for rework
 */
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, Clock, AlertTriangle, User, ChevronDown, ChevronUp,
  ArrowRight, RotateCcw, ExternalLink, FileText, Shield, Zap, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { subscribeToEvents, getEventHistory } from "@/lib/eventBus";

interface RecordTabWorkflowProps {
  recordId: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type StepStatus = "completed" | "in_progress" | "pending" | "failed" | "skipped";

interface WorkflowStep {
  id: string;
  step: string;
  status: StepStatus;
  actor: string;
  actor_role: string;
  completed_at?: string;
  started_at?: string;
  duration_mins?: number;
  sla_mins: number;
  task_ref?: string;
  task_route?: string;
  notes?: string;
}

interface ReworkIteration {
  id: string;
  iteration: number;
  declined_at: string;
  declined_by: string;
  declined_by_role: string;
  decline_reason: string;
  resubmitted_at?: string;
  resubmitted_by?: string;
  resolution: "resubmitted" | "withdrawn" | "pending";
}

// ─── Mock baseline data ───────────────────────────────────────────────────────
// TODO: Backend integration required — GET /api/records/:id/workflow
const BASE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "w1",
    step: "Document Upload",
    status: "completed",
    actor: "J. Martinez",
    actor_role: "Preparer",
    started_at: "2026-05-16 07:55",
    completed_at: "2026-05-16 08:00",
    duration_mins: 5,
    sla_mins: 60,
    notes: "2 documents uploaded: base lease + Amendment #3.",
  },
  {
    id: "w2",
    step: "AI Extraction",
    status: "completed",
    actor: "Contract Agent",
    actor_role: "System",
    started_at: "2026-05-16 08:00",
    completed_at: "2026-05-16 08:15",
    duration_mins: 15,
    sla_mins: 30,
    task_ref: "AGT-2026-0041",
    notes: "73 fields extracted. 2 deferred (notice period, CAM cap).",
  },
  {
    id: "w3",
    step: "Preparer Review",
    status: "completed",
    actor: "J. Martinez",
    actor_role: "Preparer",
    started_at: "2026-05-16 08:15",
    completed_at: "2026-05-16 09:00",
    duration_mins: 45,
    sla_mins: 120,
    task_ref: "EXT-2026-0041",
    task_route: "/extraction/verify?job=EXT-2026-0041",
    notes: "Deferred fields manually entered. Submitted for review.",
  },
  {
    id: "w4",
    step: "Reviewer Approval",
    status: "completed",
    actor: "M. Thompson",
    actor_role: "Reviewer",
    started_at: "2026-05-16 09:05",
    completed_at: "2026-05-16 10:30",
    duration_mins: 85,
    sla_mins: 480,
    task_ref: "REV-2026-0041",
    task_route: "/approvals/review/t1",
    notes: "Approved after 1 rework cycle. CAM cap confirmed at 3% per §8.4.",
  },
  {
    id: "w5",
    step: "Final Approval",
    status: "completed",
    actor: "A. Chen",
    actor_role: "Approver",
    started_at: "2026-05-16 10:35",
    completed_at: "2026-05-16 11:00",
    duration_mins: 25,
    sla_mins: 240,
    task_ref: "APR-2026-0041",
    task_route: "/approvals/final/t2",
    notes: "Approved. Record finalization triggered automatically.",
  },
  {
    id: "w6",
    step: "Record Finalization",
    status: "completed",
    actor: "System",
    actor_role: "System",
    started_at: "2026-05-16 11:00",
    completed_at: "2026-05-16 11:05",
    duration_mins: 5,
    sla_mins: 10,
    notes: "Contract record committed. Snapshot #1 created.",
  },
];

const BASE_REWORK_HISTORY: ReworkIteration[] = [
  {
    id: "rw-001",
    iteration: 1,
    declined_at: "2026-05-16 09:45",
    declined_by: "M. Thompson",
    declined_by_role: "Reviewer",
    decline_reason: "CAM reconciliation cap value inconsistent — §8.4 references 3% but submitted data showed 5%. Please confirm against original lease and resubmit.",
    resubmitted_at: "2026-05-16 10:20",
    resubmitted_by: "J. Martinez",
    resolution: "resubmitted",
  },
];

// ─── Event → step mapping ─────────────────────────────────────────────────────
// Maps event types to which step ID they affect and what status to apply.
const EVENT_STEP_MAP: Record<string, { stepId: string; status: StepStatus; label: string }> = {
  SUBMIT_FOR_REVIEW:  { stepId: "w3", status: "completed",   label: "Submitted for review" },
  REVIEW_OPENED:      { stepId: "w4", status: "in_progress", label: "Reviewer opened task" },
  REVIEW_COMPLETED:   { stepId: "w4", status: "completed",   label: "Reviewer approved" },
  APPROVE_FOR_FINAL:  { stepId: "w5", status: "in_progress", label: "Sent for final approval" },
  RECORD_APPROVED:    { stepId: "w5", status: "completed",   label: "Final approval granted" },
  DECLINE_SUBMITTED:  { stepId: "w4", status: "pending",     label: "Declined — awaiting resubmission" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slaStatus(durationMins: number | undefined, slaMins: number, status: StepStatus) {
  if (status !== "completed" || durationMins === undefined) return null;
  const pct = durationMins / slaMins;
  if (pct <= 0.5) return { label: "On time", cls: "badge-approved" };
  if (pct <= 1.0) return { label: "Within SLA", cls: "badge-processing" };
  return { label: "SLA exceeded", cls: "badge-error" };
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function nowLabel(): string {
  return new Date().toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "");
}

// ─── Workflow summary header ──────────────────────────────────────────────────
function WorkflowSummary({ steps, rework }: { steps: WorkflowStep[]; rework: ReworkIteration[] }) {
  const completed = steps.filter(s => s.status === "completed").length;
  const totalDuration = steps.reduce((acc, s) => acc + (s.duration_mins ?? 0), 0);
  const slaBreaches = steps.filter(s => s.duration_mins !== undefined && s.duration_mins > s.sla_mins).length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {[
        { icon: <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-lg-success)" }} />, label: "Steps Completed", value: `${completed} / ${steps.length}` },
        { icon: <Clock className="w-4 h-4 text-muted-foreground" />, label: "Total Duration", value: formatDuration(totalDuration) },
        { icon: <RotateCcw className="w-4 h-4" style={{ color: "var(--color-lg-warning)" }} />, label: "Rework Cycles", value: String(rework.length) },
        { icon: <AlertTriangle className="w-4 h-4" style={{ color: slaBreaches > 0 ? "var(--color-lg-error)" : "var(--color-lg-success)" }} />, label: "SLA Breaches", value: String(slaBreaches) },
      ].map(tile => (
        <div key={tile.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          {tile.icon}
          <div>
            <p className="text-[11px] text-muted-foreground">{tile.label}</p>
            <p className="text-[15px] font-semibold text-foreground">{tile.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RecordTabWorkflow({ recordId }: RecordTabWorkflowProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(BASE_WORKFLOW_STEPS);
  const [rework, setRework] = useState<ReworkIteration[]>(BASE_REWORK_HISTORY);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showRework, setShowRework] = useState(true);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);

    // Apply an event to the step list
  const applyEvent = useCallback((eventType: string, payload: Record<string, unknown>) => {
    const mapping = EVENT_STEP_MAP[eventType];
    if (!mapping) return;
    setSteps(prev => prev.map(s => {
      if (s.id !== mapping.stepId) return s;
      // Prefer the event's own ISO timestamp; fall back to nowLabel()
      const rawTs = payload.timestamp as string | undefined;
      const ts = rawTs
        ? new Date(rawTs).toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
          }).replace(',', '')
        : nowLabel();
      return {
        ...s,
        status: mapping.status,
        ...(mapping.status === 'in_progress' ? { started_at: ts } : {}),
        ...(mapping.status === 'completed' ? { completed_at: ts } : {}),
        notes: `[Live] ${mapping.label} at ${ts}`,
      };
    }));

    // Append to live event log
    setLiveEvents(prev => [`${eventType} — ${mapping.label}`, ...prev].slice(0, 5));

    // If DECLINE_SUBMITTED, add a new rework iteration
    if (eventType === "DECLINE_SUBMITTED") {
      const now = nowLabel();
      setRework(prev => [
        ...prev,
        {
          id: `rw-live-${Date.now()}`,
          iteration: prev.length + 1,
          declined_at: now,
          declined_by: "Reviewer",
          declined_by_role: "Reviewer",
          decline_reason: "Declined via live event — awaiting resubmission.",
          resolution: "pending",
        },
      ]);
    }
  }, []);

  // Replay event history on mount to restore state after navigation
  useEffect(() => {
    const history = getEventHistory();
    for (const event of history) {
      const p = event.payload as Record<string, unknown>;
      const matches = !p.record_id || p.record_id === recordId || p.record_id === "r1";
      if (matches) applyEvent(event.type, p);
    }
  }, [recordId, applyEvent]);

  // Subscribe to live events
  useEffect(() => {
    return subscribeToEvents((event) => {
      const p = event.payload as Record<string, unknown>;
      const matches = !p.record_id || p.record_id === recordId || p.record_id === "r1";
      if (!matches) return;
      if (EVENT_STEP_MAP[event.type]) {
        applyEvent(event.type, p);
        toast.info(`Workflow updated: ${EVENT_STEP_MAP[event.type].label}`);
      }
    });
  }, [recordId, applyEvent]);

  function toggleStep(id: string) {
    setExpandedSteps(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const STEP_ICON: Record<StepStatus, React.ReactNode> = {
    completed:   <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-lg-success)" }} />,
    in_progress: <Clock className="w-5 h-5 animate-spin" style={{ color: "var(--color-lg-warning)", animationDuration: "2s" }} />,
    pending:     <Clock className="w-5 h-5 text-muted-foreground opacity-40" />,
    failed:      <AlertTriangle className="w-5 h-5" style={{ color: "var(--color-lg-error)" }} />,
    skipped:     <ArrowRight className="w-5 h-5 text-muted-foreground opacity-40" />,
  };

  return (
    <div className="p-6 flex flex-col gap-0">
      {/* Summary tiles */}
      <WorkflowSummary steps={steps} rework={rework} />

      {/* Live event log strip */}
      {liveEvents.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-border bg-muted/20">
          <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-lg-primary)" }} />
          <span className="text-[11px] font-medium text-muted-foreground">Live:</span>
          <span className="text-[11px] text-foreground truncate">{liveEvents[0]}</span>
          {liveEvents.length > 1 && (
            <span className="text-[10px] text-muted-foreground shrink-0">+{liveEvents.length - 1} more</span>
          )}
        </div>
      )}

      {/* Workflow steps */}
      <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-muted-foreground" />
        Approval Timeline
      </h3>

      <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
        <div className="divide-y divide-border">
          {steps.map((step) => {
            const sla = slaStatus(step.duration_mins, step.sla_mins, step.status);
            const isExpanded = expandedSteps.has(step.id);

            return (
              <div key={step.id}>
                <div
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 transition-colors",
                    step.notes && "cursor-pointer hover:bg-muted/30",
                    step.status === "in_progress" && "bg-[var(--color-lg-warning-subtle)]/30"
                  )}
                  onClick={() => step.notes && toggleStep(step.id)}
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {STEP_ICON[step.status]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-foreground">{step.step}</p>
                      {step.status === "in_progress" && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold badge-processing animate-pulse">
                          In Progress
                        </span>
                      )}
                      {sla && (
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${sla.cls}`}>
                          {sla.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="w-3 h-3" />
                        {step.actor}
                        <span className="opacity-60">({step.actor_role})</span>
                      </span>
                      {step.duration_mins !== undefined && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDuration(step.duration_mins)}
                          <span className="opacity-50">/ SLA {formatDuration(step.sla_mins)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {step.task_ref && (
                      <button
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info(`Task reference: ${step.task_ref}`);
                        }}
                      >
                        <FileText className="w-3 h-3" />
                        {step.task_ref}
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </button>
                    )}
                    {step.completed_at && (
                      <span className="text-[11px] text-muted-foreground">{step.completed_at}</span>
                    )}
                    {step.notes && (
                      <div className="text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && step.notes && (
                  <div className="px-5 pb-3.5 pt-0 bg-muted/20 border-t border-border/50">
                    <p className="text-[12px] text-muted-foreground leading-relaxed pl-10">{step.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rework history */}
      {rework.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="w-4 h-4" style={{ color: "var(--color-lg-warning)" }} />
              Rework History
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: "var(--color-lg-warning-subtle)", color: "var(--color-lg-warning)" }}
              >
                {rework.length} cycle{rework.length !== 1 ? "s" : ""}
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground"
              onClick={() => setShowRework(v => !v)}
            >
              {showRework ? "Collapse" : "Expand"}
            </Button>
          </div>

          {showRework && (
            <div className="flex flex-col gap-3">
              {rework.map(rw => (
                <div
                  key={rw.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                  style={{ borderLeft: "3px solid var(--color-lg-warning)" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
                        style={{ background: "var(--color-lg-warning-subtle)", color: "var(--color-lg-warning)" }}
                      >
                        Rework Cycle {rw.iteration}
                      </span>
                      <span className="text-[12px] font-medium text-foreground">
                        Declined by {rw.declined_by}
                      </span>
                      <span className="text-[11px] text-muted-foreground">({rw.declined_by_role})</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{rw.declined_at}</span>
                  </div>

                  <div className="px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Decline reason</p>
                    <p className="text-[12px] text-foreground leading-relaxed">{rw.decline_reason}</p>
                  </div>

                  {rw.resolution === "resubmitted" && rw.resubmitted_at && (
                    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/10">
                      <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-lg-success)" }} />
                      <p className="text-[12px] text-muted-foreground">
                        Resubmitted by <span className="font-medium text-foreground">{rw.resubmitted_by}</span> at {rw.resubmitted_at}
                      </p>
                      <span className="ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold badge-approved">
                        Resolved
                      </span>
                    </div>
                  )}
                  {rw.resolution === "pending" && (
                    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/10">
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-lg-warning)" }} />
                      <p className="text-[12px] text-muted-foreground">Awaiting resubmission</p>
                      <span className="ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold badge-warning">
                        Pending
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
