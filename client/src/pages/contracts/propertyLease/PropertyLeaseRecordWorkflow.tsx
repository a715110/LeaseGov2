/**
 * RecordTabWorkflow — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordWorkflow.tsx scaffold stub.
 *
 * Shows the current workflow state, approval tasks, and rework history.
 */

import { CheckCircle2, Clock, AlertTriangle, User } from "lucide-react";

interface RecordTabWorkflowProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/workflow
const WORKFLOW_STEPS = [
  { id:"w1", step:"Document Upload",     status:"completed", actor:"J. Martinez", completed_at:"2026-05-16 08:00" },
  { id:"w2", step:"Extraction",          status:"completed", actor:"AI Agent",    completed_at:"2026-05-16 08:15" },
  { id:"w3", step:"Preparer Review",     status:"completed", actor:"J. Martinez", completed_at:"2026-05-16 09:00" },
  { id:"w4", step:"Reviewer Approval",   status:"completed", actor:"M. Thompson", completed_at:"2026-05-16 10:30" },
  { id:"w5", step:"Final Approval",      status:"completed", actor:"A. Chen",     completed_at:"2026-05-16 11:00" },
  { id:"w6", step:"Record Finalization", status:"completed", actor:"System",      completed_at:"2026-05-16 11:05" },
];

const STEP_ICON = {
  completed: <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} />,
  in_progress: <Clock className="w-5 h-5" style={{ color:"var(--color-lg-warning)" }} />,
  pending: <Clock className="w-5 h-5 text-muted-foreground opacity-40" />,
  failed: <AlertTriangle className="w-5 h-5" style={{ color:"var(--color-lg-error)" }} />,
};

export default function RecordTabWorkflow({ recordId }: RecordTabWorkflowProps) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <h3 className="text-[14px] font-semibold text-foreground">Workflow Steps</h3>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {STEP_ICON[step.status as keyof typeof STEP_ICON] || STEP_ICON.pending}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">{step.step}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{step.actor}</span>
                </div>
              </div>
              {step.completed_at && (
                <span className="text-[11px] text-muted-foreground shrink-0">{step.completed_at}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
