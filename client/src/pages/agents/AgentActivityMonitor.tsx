/**
 * AgentActivityMonitor — agent-activity-monitor
 * All AgentTask records for the current tenant.
 * Four status columns: Running · Awaiting Checkpoint · Completed Today · Failed
 * TODO: Backend integration required — GET /agents/tasks
 */

import { useState } from 'react';
import { Bot, AlertTriangle, Clock, CheckCircle2, Pause, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import NotFound from '@/pages/NotFound';
import { useRole } from '@/contexts/RoleContext';
import { InterventionButton } from '@/components/automation/InterventionButton';
import { AgentExceptionPanel, type AgentException } from '@/components/agents/AgentExceptionPanel';

const _screenKey = SCREEN_KEYS.AGENT_ACTIVITY_MONITOR;

type AgentStatus = 'running' | 'awaiting_checkpoint' | 'completed' | 'failed' | 'paused_by_human';

type AgentTaskCard = {
  id: string;
  agent_type: string;
  workflow_id: string;
  contract_id: string;
  contract_label: string;
  status: AgentStatus;
  current_step: string;
  started_at: string;
  duration: string;
  exceptions?: AgentException[];
};

// TODO: Backend integration required
const MOCK_TASKS: AgentTaskCard[] = [
  {
    id: 'at-001', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-041',
    contract_id: 'CR-2026-0041', contract_label: 'Retail HQ Lease 2026',
    status: 'running', current_step: 'Extracting financial terms',
    started_at: '09:14', duration: '4m 22s', exceptions: [],
  },
  {
    id: 'at-002', agent_type: 'workflow_orchestration', workflow_id: 'WF-ORCH-2026-039',
    contract_id: 'CR-2026-0039', contract_label: 'Office Tower Amendment',
    status: 'running', current_step: 'Running reassessment classification',
    started_at: '09:08', duration: '10m 15s', exceptions: [],
  },
  {
    id: 'at-003', agent_type: 'reassessment', workflow_id: 'WF-REAS-2026-037',
    contract_id: 'CR-2026-0037', contract_label: 'Warehouse Lease Exhibit',
    status: 'awaiting_checkpoint', current_step: 'Awaiting classification confirm',
    started_at: '08:55', duration: '23m 40s', exceptions: [],
  },
  {
    id: 'at-004', agent_type: 'compliance', workflow_id: 'WF-COMP-2026-035',
    contract_id: 'CR-2026-0035', contract_label: 'Ground Lease Base Contract',
    status: 'awaiting_checkpoint', current_step: 'Awaiting export attestation',
    started_at: '08:30', duration: '48m 02s', exceptions: [],
  },
  {
    id: 'at-005', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-033',
    contract_id: 'CR-2026-0033', contract_label: 'Industrial Park Schedule',
    status: 'completed', current_step: 'Completed',
    started_at: '07:45', duration: '12m 18s', exceptions: [],
  },
  {
    id: 'at-006', agent_type: 'ocr', workflow_id: 'WF-OCR-2026-031',
    contract_id: 'CR-2026-0031', contract_label: 'Suburban Office Lease',
    status: 'completed', current_step: 'Completed',
    started_at: '07:12', duration: '6m 55s', exceptions: [],
  },
  {
    id: 'at-007', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-029',
    contract_id: 'CR-2026-0029', contract_label: 'Mixed-Use Development',
    status: 'failed', current_step: 'Failed at field extraction',
    started_at: '06:50', duration: '3m 11s',
    exceptions: [
      {
        id: 'ex-001', exception_type: 'ocr_quality_insufficient', urgency: 'HIGH',
        message: 'Page 4 OCR confidence below threshold (32%). Cannot extract financial terms.',
        attempted: 'Attempted 3 OCR passes with different preprocessing settings.',
        what_needed: 'Re-upload a higher quality scan of page 4 or enter financial terms manually.',
        contract_id: 'CR-2026-0029', timestamp: '06:53', can_defer: false,
      },
    ],
  },
  {
    id: 'at-008', agent_type: 'workflow_orchestration', workflow_id: 'WF-ORCH-2026-027',
    contract_id: 'CR-2026-0027', contract_label: 'Retail Strip Mall',
    status: 'failed', current_step: 'Failed at approval routing',
    started_at: '06:20', duration: '8m 44s',
    exceptions: [
      {
        id: 'ex-002', exception_type: 'approver_not_assigned', urgency: 'MEDIUM',
        message: 'No approver assigned for workspace "West Region". Cannot route for approval.',
        attempted: 'Checked all user role assignments for workspace.',
        what_needed: 'Assign an approver role to at least one user in the West Region workspace.',
        contract_id: 'CR-2026-0027', timestamp: '06:28', can_defer: true,
      },
    ],
  },
];

const COLUMNS: { key: AgentStatus | 'awaiting_checkpoint'; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'running',              label: 'Running',             icon: Bot,          color: 'var(--color-lg-accent)' },
  { key: 'awaiting_checkpoint',  label: 'Awaiting Checkpoint', icon: Clock,        color: 'var(--color-lg-warning)' },
  { key: 'completed',            label: 'Completed Today',     icon: CheckCircle2, color: 'var(--color-lg-success)' },
  { key: 'failed',               label: 'Failed',              icon: AlertTriangle,color: 'var(--color-lg-error)' },
];

const AGENT_TYPE_LABELS: Record<string, string> = {
  document_intake:       'Intake',
  ocr:                   'OCR',
  extraction:            'Extraction',
  workflow_orchestration:'Orchestration',
  reassessment:          'Reassessment',
  compliance:            'Compliance',
  notification:          'Notification',
};

function TaskCard({ task }: { task: AgentTaskCard }) {
  const [showExceptions, setShowExceptions] = useState(false);
  const [paused, setPaused] = useState(false);

  const statusStyle: Record<AgentStatus, React.CSSProperties> = {
    running:              { borderColor: 'var(--color-lg-accent)' },
    awaiting_checkpoint:  { borderColor: 'var(--color-lg-warning)' },
    completed:            { borderColor: 'var(--color-lg-success)' },
    failed:               { borderColor: 'var(--color-lg-error)' },
    paused_by_human:      { borderColor: 'orange' },
  };

  return (
    <div className="rounded-lg border overflow-hidden text-[12px]" style={{ ...statusStyle[task.status], background: 'var(--color-lg-card-bg)' }}>
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">{AGENT_TYPE_LABELS[task.agent_type] ?? task.agent_type}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{task.workflow_id}</span>
            </div>
            <p className="font-semibold text-foreground">{task.contract_label}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{task.contract_id}</p>
          </div>
          {task.status === 'running' && !paused && (
            <InterventionButton status={task.status} size="sm" onIntervene={() => setPaused(true)} />
          )}
          {paused && (
            <InterventionButton status="paused_by_human" size="sm" onResume={() => setPaused(false)} />
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {task.status === 'running' && !paused && (
            <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: 'var(--color-lg-accent)' }} />
          )}
          {task.status === 'awaiting_checkpoint' && (
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-lg-warning)' }} />
          )}
          {task.status === 'completed' && (
            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
          )}
          {task.status === 'failed' && (
            <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: 'var(--color-lg-error)' }} />
          )}
          <span className="text-muted-foreground text-[11px]">{task.current_step}</span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>Started {task.started_at}</span>
          <span>Duration {task.duration}</span>
        </div>

        {task.exceptions && task.exceptions.length > 0 && (
          <div className="mt-2">
            <button className="flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--color-lg-error)' }}
              onClick={() => setShowExceptions(e => !e)}>
              {showExceptions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span className="badge-error px-1.5 py-0.5 rounded text-[10px]">{task.exceptions.length}</span>
              View Exceptions
            </button>
            {showExceptions && (
              <div className="mt-2">
                <AgentExceptionPanel exceptions={task.exceptions} />
              </div>
            )}
          </div>
        )}

        {task.status === 'awaiting_checkpoint' && (
          <Button size="sm" variant="outline" className="mt-2 h-6 text-[10px] w-full"
            style={{ borderColor: 'var(--color-lg-warning)', color: 'var(--color-lg-warning)' }}>
            View in Checkpoint Queue
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AgentActivityMonitor() {
  const { activeRole } = useRole();
  const allowedRoles = ['lease_admin', 'controller', 'preparer', 'reviewer'];
  if (!allowedRoles.includes(activeRole)) return <NotFound />;

  const [agentTypeFilter, setAgentTypeFilter] = useState('all');

  const filtered = agentTypeFilter === 'all'
    ? MOCK_TASKS
    : MOCK_TASKS.filter(t => t.agent_type === agentTypeFilter);

  const byStatus = (s: AgentStatus) => filtered.filter(t => t.status === s);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Activity Monitor</h1>
          <p className="page-subtitle">Real-time view of all agent tasks for this tenant</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-8 rounded-lg border border-border bg-background text-[12px] px-3"
            value={agentTypeFilter} onChange={e => setAgentTypeFilter(e.target.value)}>
            <option value="all">All Agent Types</option>
            {Object.entries(AGENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Four-column layout */}
      <div className="px-6 py-6 grid grid-cols-4 gap-5">
        {COLUMNS.map(col => {
          const tasks = byStatus(col.key as AgentStatus);
          const ColIcon = col.icon;
          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ColIcon className="w-4 h-4 shrink-0" style={{ color: col.color }} />
                <span className="text-[13px] font-semibold text-foreground">{col.label}</span>
                <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${col.color}20`, color: col.color }}>
                  {tasks.length}
                </span>
              </div>
              {tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-[11px] text-muted-foreground">No tasks</p>
                </div>
              ) : (
                tasks.map(t => <TaskCard key={t.id} task={t} />)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
