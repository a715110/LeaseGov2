/**
 * AgentCheckpointQueue — agent-checkpoint-queue
 * All pending HumanCheckpoint records across all workflow domains.
 * Tabs by checkpoint_type. Sort: deadline ascending.
 * TODO: Backend integration required — GET /checkpoints?status=pending
 */

import { useState } from 'react';
import { Clock, AlertTriangle, ChevronRight, Bot } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import NotFound from '@/pages/NotFound';
import { useRole } from '@/contexts/RoleContext';

const _screenKey = SCREEN_KEYS.AGENT_CHECKPOINT_QUEUE;

type CheckpointType =
  | 'all'
  | 'extraction_review'
  | 'classification_confirm'
  | 'assessment_confirm'
  | 'analysis_confirm'
  | 'export_attest'
  | 'onboarding_approval';

const TYPE_LABELS: Record<CheckpointType, string> = {
  all:                    'All',
  extraction_review:      'Extraction Review',
  classification_confirm: 'Classification',
  assessment_confirm:     'Assessment',
  analysis_confirm:       'Analysis',
  export_attest:          'Export Attest',
  onboarding_approval:    'Onboarding',
};

const TABS: CheckpointType[] = [
  'all', 'extraction_review', 'classification_confirm',
  'assessment_confirm', 'analysis_confirm', 'export_attest', 'onboarding_approval',
];

// TODO: Backend integration required
const MOCK_CHECKPOINTS = [
  {
    id: 'cp-001', contract_id: 'CR-2026-0041', contract_label: 'Retail HQ Lease 2026',
    checkpoint_type: 'extraction_review' as CheckpointType,
    agent_confidence: 0.87, agent_recommendation: 'All 73 fields extracted. 2 critical fields require review.',
    deadline_at: new Date(Date.now() + 2.5 * 3600000).toISOString(),
    route: '/extraction/verification',
  },
  {
    id: 'cp-002', contract_id: 'CR-2026-0039', contract_label: 'Office Tower Amendment',
    checkpoint_type: 'classification_confirm' as CheckpointType,
    agent_confidence: 0.94, agent_recommendation: 'Classified as Amendment — Rent Adjustment. High confidence.',
    deadline_at: new Date(Date.now() + 18 * 3600000).toISOString(),
    route: '/reassessment/classification',
  },
  {
    id: 'cp-003', contract_id: 'CR-2026-0037', contract_label: 'Warehouse Lease Exhibit',
    checkpoint_type: 'assessment_confirm' as CheckpointType,
    agent_confidence: 0.71, agent_recommendation: 'Renewal option recommended. Medium confidence — lease terms ambiguous.',
    deadline_at: new Date(Date.now() + 30 * 3600000).toISOString(),
    route: '/reassessment/assessment',
  },
  {
    id: 'cp-004', contract_id: 'CR-2026-0035', contract_label: 'Ground Lease Base Contract',
    checkpoint_type: 'export_attest' as CheckpointType,
    agent_confidence: 0.99, agent_recommendation: 'All 6 preflight checks passed. Ready for attestation.',
    deadline_at: new Date(Date.now() + 47 * 3600000).toISOString(),
    route: '/export/upload-task',
  },
  {
    id: 'cp-005', contract_id: 'CR-2026-0033', contract_label: 'Industrial Park Schedule',
    checkpoint_type: 'analysis_confirm' as CheckpointType,
    agent_confidence: 0.82, agent_recommendation: 'Analysis memo drafted. Recommend lease modification.',
    deadline_at: new Date(Date.now() - 1 * 3600000).toISOString(), // overdue
    route: '/reassessment/analysis',
  },
  {
    id: 'cp-006', contract_id: 'T-NEW-001', contract_label: 'Meridian Property Group',
    checkpoint_type: 'onboarding_approval' as CheckpointType,
    agent_confidence: 1.0, agent_recommendation: 'Tenant provisioning complete. SuperAdmin approval required.',
    deadline_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    route: '/onboarding/complete',
  },
];

function DeadlineCell({ deadline }: { deadline: string }) {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diffMs = end - now;
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return <span className="flex items-center gap-1 text-[11px] font-semibold badge-error px-2 py-0.5 rounded">Overdue</span>;
  }
  const h = Math.floor(diffH);
  const m = Math.floor((diffH - h) * 60);
  const color = diffH > 24 ? 'var(--color-lg-success)' : diffH > 4 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)';
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
      <Clock className="w-3 h-3" />{h}h {m}m
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.90 ? 'var(--color-lg-success)' : value >= 0.60 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function AgentCheckpointQueue() {
  const { activeRole } = useRole();
  const allowedRoles = ['preparer', 'reviewer', 'approver', 'lease_admin', 'controller'];
  if (!allowedRoles.includes(activeRole)) return <NotFound />;

  const [activeTab, setActiveTab] = useState<CheckpointType>('all');

  const filtered = activeTab === 'all'
    ? MOCK_CHECKPOINTS
    : MOCK_CHECKPOINTS.filter(c => c.checkpoint_type === activeTab);

  const sorted = [...filtered].sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());

  const countByType = (t: CheckpointType) =>
    t === 'all' ? MOCK_CHECKPOINTS.length : MOCK_CHECKPOINTS.filter(c => c.checkpoint_type === t).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Checkpoint Queue</h1>
          <p className="page-subtitle">Pending human decisions across all agent-driven workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-warning px-2.5 py-1 rounded-full text-[12px] font-semibold">
            {MOCK_CHECKPOINTS.length} pending
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border flex gap-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap shrink-0"
            style={{
              borderBottomColor: activeTab === t ? 'var(--color-lg-primary)' : 'transparent',
              color: activeTab === t ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)',
            }}>
            {TYPE_LABELS[t]}
            {countByType(t) > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === t ? 'badge-processing' : 'badge-muted'}`}>
                {countByType(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-6 py-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-[14px] font-semibold text-muted-foreground">No pending checkpoints</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">No pending checkpoints of this type</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="data-table w-full text-[12px]">
              <thead>
                <tr>
                  <th className="text-left">Contract</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Confidence</th>
                  <th className="text-left">Recommendation</th>
                  <th className="text-left">Deadline</th>
                  <th className="text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(cp => {
                  const isOverdue = new Date(cp.deadline_at).getTime() < Date.now();
                  return (
                    <tr key={cp.id} className={isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}>
                      <td>
                        <div>
                          <p className="font-semibold text-foreground">{cp.contract_label}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{cp.contract_id}</p>
                        </div>
                      </td>
                      <td>
                        <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">
                          {TYPE_LABELS[cp.checkpoint_type]}
                        </span>
                      </td>
                      <td><ConfidenceBar value={cp.agent_confidence} /></td>
                      <td className="max-w-[280px]">
                        <p className="text-muted-foreground line-clamp-2">{cp.agent_recommendation}</p>
                      </td>
                      <td><DeadlineCell deadline={cp.deadline_at} /></td>
                      <td>
                        <Link href={cp.route}>
                          <Button size="sm" className="h-7 text-[11px] gap-1">
                            Open <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
