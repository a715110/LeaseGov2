/**
 * LeaseManualTaskCard — AG.8
 * Shown in full_manual mode in place of ContractAgentProgressPanel.
 * Lists manual workflow steps as a checklist with progress bar.
 * Completion tracked locally — no agent involvement.
 * TODO: Backend integration required — POST /records/{id}/manual-steps
 */

import { useState } from 'react';
import { User, CheckSquare, Square } from 'lucide-react';

export type ManualStep = {
  id: string;
  label: string;
  assigned_role: string;
  description?: string;
};

interface Props {
  steps: ManualStep[];
  workflowLabel?: string;
  contractId?: string;
}

export function LeaseManualTaskCard({ steps, workflowLabel = 'Manual Workflow', contractId }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  const completed = checked.size;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-lg-surface)' }}>
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">{workflowLabel}</span>
            <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">Manual</span>
          </div>
          {contractId && <span className="font-mono text-[11px] text-muted-foreground">{contractId}</span>}
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 py-4 flex flex-col gap-2">
        {steps.map(step => {
          const isDone = checked.has(step.id);
          return (
            <div key={step.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/10 transition-colors"
              onClick={() => toggle(step.id)}>
              {isDone
                ? <CheckSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
                : <Square className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[12px] font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step.label}</span>
                  <span className="badge-muted px-1.5 py-0.5 rounded text-[10px] capitalize">{step.assigned_role.replace(/_/g, ' ')}</span>
                </div>
                {step.description && !isDone && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">{completed} of {total} steps completed</span>
          <span className="text-[11px] font-semibold" style={{ color: pct === 100 ? 'var(--color-lg-success)' : 'var(--color-lg-accent)' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{
            width: `${pct}%`,
            background: pct === 100 ? 'var(--color-lg-success)' : 'var(--color-lg-accent)',
          }} />
        </div>
      </div>
    </div>
  );
}
