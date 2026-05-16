/**
 * ContractCheckpointCard — AG.2 (AG.4 in prompt numbering)
 * Prominent full-width card shown at top of workflow screens when
 * HumanCheckpoint.status = pending.
 * Handles all 5 statuses: pending · approved · modified · rejected · expired
 * TODO: Backend integration required — POST /checkpoints/{id}/resolve
 */

import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { HumanCheckpointForm } from '@/components/checkpoints/HumanCheckpointForm';

export type CheckpointStatus = 'pending' | 'approved' | 'modified' | 'rejected' | 'expired';
export type CheckpointType =
  | 'extraction_review'
  | 'classification_confirm'
  | 'assessment_confirm'
  | 'analysis_confirm'
  | 'export_attest'
  | 'onboarding_approval';

export type PreparedField = {
  field_name: string;
  agent_value: string;
  is_critical?: boolean;
};

export type HumanCheckpointData = {
  id: string;
  contract_record_id: string;
  checkpoint_type: CheckpointType;
  status: CheckpointStatus;
  agent_prepared_data: { summary: string; fields: PreparedField[] };
  agent_recommendation?: string;
  agent_confidence?: number;
  human_decision_rationale?: string;
  human_modified_data?: Record<string, string>;
  deadline_at?: string;
  decided_at?: string;
  decided_by?: string;
};

interface Props {
  checkpoint: HumanCheckpointData;
  onApprove?: () => void;
  onModify?: (data: Record<string, string>, rationale: string) => void;
  onReject?: (rationale: string) => void;
}

const TYPE_LABELS: Record<CheckpointType, string> = {
  extraction_review:      'Extraction Review',
  classification_confirm: 'Classification Confirm',
  assessment_confirm:     'Assessment Confirm',
  analysis_confirm:       'Analysis Confirm',
  export_attest:          'Export Attestation',
  onboarding_approval:    'Onboarding Approval',
};

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diffMs = end - now;
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return <span className="text-[11px] font-semibold badge-error px-2 py-0.5 rounded">Overdue</span>;
  }
  const h = Math.floor(diffH);
  const m = Math.floor((diffH - h) * 60);
  const color = diffH > 24 ? 'var(--color-lg-success)' : diffH > 4 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)';
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
      <Clock className="w-3 h-3" />
      {h}h {m}m remaining
    </span>
  );
}

function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.90 ? 'var(--color-lg-success)' : value >= 0.60 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)';
  const r = 18, circ = 2 * Math.PI * r;
  const dash = circ * value;
  return (
    <div className="flex items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-lg-border)" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 22 22)" />
        <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{pct}%</text>
      </svg>
      <span className="text-[11px] text-muted-foreground">Agent confidence</span>
    </div>
  );
}

export function ContractCheckpointCard({ checkpoint, onApprove, onModify, onReject }: Props) {
  const [showFields, setShowFields] = useState(false);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [rejectRationale, setRejectRationale] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isPending = checkpoint.status === 'pending';
  const isOverdue = checkpoint.deadline_at && new Date(checkpoint.deadline_at).getTime() < Date.now();

  const borderColor =
    checkpoint.status === 'pending'   ? 'var(--color-lg-warning)' :
    checkpoint.status === 'approved'  ? 'var(--color-lg-success)' :
    checkpoint.status === 'modified'  ? 'var(--color-lg-accent)'  :
    checkpoint.status === 'rejected'  ? 'var(--color-lg-error)'   :
                                        'var(--color-lg-border)';

  if (showModifyForm) {
    return (
      <HumanCheckpointForm
        checkpoint={checkpoint}
        onSubmit={(data, rationale) => { onModify?.(data, rationale); setShowModifyForm(false); }}
        onCancel={() => setShowModifyForm(false)}
      />
    );
  }

  return (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor, background: 'var(--color-lg-card-bg)' }}>
      {/* Overdue banner */}
      {isOverdue && checkpoint.status === 'pending' && (
        <div className="flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold"
          style={{ background: 'var(--color-lg-error-subtle)', color: 'var(--color-lg-error)' }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          This checkpoint is overdue — immediate action required
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: isPending ? 'var(--color-lg-warning-subtle)' : 'var(--color-lg-accent-subtle)' }}>
            {checkpoint.status === 'approved'
              ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-lg-success)' }} />
              : checkpoint.status === 'rejected'
              ? <XCircle className="w-4 h-4" style={{ color: 'var(--color-lg-error)' }} />
              : <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-lg-warning)' }} />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[13px] font-semibold text-foreground">
                {isPending ? 'Human Decision Required' : `Checkpoint ${checkpoint.status.charAt(0).toUpperCase() + checkpoint.status.slice(1)}`}
              </span>
              <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">{TYPE_LABELS[checkpoint.checkpoint_type]}</span>
              <AutomationPolicyBadge level="collaborative" size="sm" />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted-foreground">{checkpoint.contract_record_id}</span>
              {checkpoint.deadline_at && isPending && <DeadlineCountdown deadline={checkpoint.deadline_at} />}
              {!isPending && checkpoint.decided_at && (
                <span className="text-[11px] text-muted-foreground">Decided {checkpoint.decided_at} by {checkpoint.decided_by}</span>
              )}
            </div>
          </div>
        </div>
        {checkpoint.agent_confidence !== undefined && (
          <ConfidenceGauge value={checkpoint.agent_confidence} />
        )}
      </div>

      {/* Agent preparation summary */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agent Prepared</p>
        <p className="text-[13px] text-foreground">{checkpoint.agent_prepared_data.summary}</p>
      </div>

      {/* Agent recommendation */}
      {checkpoint.agent_recommendation && (
        <div className="mx-5 my-3 rounded-lg px-4 py-3" style={{ background: 'var(--color-lg-accent-subtle)' }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--color-lg-accent)' }}>Agent Recommendation</p>
          <p className="text-[12px] text-foreground">{checkpoint.agent_recommendation}</p>
        </div>
      )}

      {/* Fields requiring attention */}
      {checkpoint.agent_prepared_data.fields.length > 0 && (
        <div className="px-5 py-3 border-t border-border">
          <button className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowFields(f => !f)}>
            {showFields ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Fields requiring your attention ({checkpoint.agent_prepared_data.fields.filter(f => f.is_critical).length} critical)
          </button>
          {showFields && (
            <div className="mt-3 flex flex-col gap-1.5">
              {checkpoint.agent_prepared_data.fields.map(f => (
                <div key={f.field_name} className="flex items-center gap-3 text-[12px] rounded px-3 py-2"
                  style={f.is_critical ? { background: 'var(--color-lg-warning-subtle)', borderLeft: '3px solid var(--color-lg-warning)' } : { background: 'var(--color-lg-surface)' }}>
                  <span className="text-muted-foreground w-40 shrink-0">{f.field_name}</span>
                  <span className="font-mono text-foreground">{f.agent_value}</span>
                  {f.is_critical && <span className="badge-warning px-1.5 py-0.5 rounded text-[10px] ml-auto">Critical</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Human decision result (non-pending) */}
      {!isPending && checkpoint.human_decision_rationale && (
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Decision Rationale</p>
          <p className="text-[12px] text-foreground">{checkpoint.human_decision_rationale}</p>
        </div>
      )}

      {/* Action buttons (pending only) */}
      {isPending && !showRejectForm && (
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
          <Button className="h-9 text-[12px] gap-1.5" style={{ background: 'var(--color-lg-success)' }} onClick={onApprove}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button variant="outline" className="h-9 text-[12px]"
            style={{ borderColor: 'var(--color-lg-warning)', color: 'var(--color-lg-warning)' }}
            onClick={() => setShowModifyForm(true)}>
            Modify
          </Button>
          <Button variant="outline" className="h-9 text-[12px]"
            style={{ borderColor: 'var(--color-lg-error)', color: 'var(--color-lg-error)' }}
            onClick={() => setShowRejectForm(true)}>
            Reject
          </Button>
        </div>
      )}

      {/* Reject form */}
      {isPending && showRejectForm && (
        <div className="px-5 py-4 border-t border-border flex flex-col gap-3">
          <label className="text-[12px] font-semibold text-foreground">Rejection Rationale <span style={{ color: 'var(--color-lg-error)' }}>*</span></label>
          <textarea
            className="w-full h-20 rounded-lg border border-border bg-background text-[12px] px-3 py-2 resize-none focus:outline-none focus:ring-1"
            style={{ '--tw-ring-color': 'var(--color-lg-error)' } as React.CSSProperties}
            placeholder="Explain why this checkpoint is being rejected..."
            value={rejectRationale}
            onChange={e => setRejectRationale(e.target.value)}
          />
          <div className="flex gap-2">
            <Button className="h-8 text-[12px]" style={{ background: 'var(--color-lg-error)' }}
              disabled={rejectRationale.trim().length < 10}
              onClick={() => { onReject?.(rejectRationale); setShowRejectForm(false); }}>
              Confirm Rejection
            </Button>
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => setShowRejectForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
