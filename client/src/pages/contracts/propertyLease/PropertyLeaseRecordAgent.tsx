/**
 * RecordTabAgent — Tab component consumed by RecordsDetail
 * FC-9 wired: ContractAgentProgressPanel (AG.1) replaces the static log list.
 *
 * Shows live Contract Agent progress for this record.
 * TODO: Backend integration required — GET /api/agents/tasks?subject_id=:recordId
 *
 * Design: Structured Authority — dense information hierarchy, amber for attention
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { ContractAgentProgressPanel, AgentTaskData } from '@/components/agents/ContractAgentProgressPanel';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { AgentExceptionPanel } from '@/components/agents/AgentExceptionPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bot, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RecordTabAgentProps {
  recordId: string;
}

// ─── Demo status cycle ────────────────────────────────────────────────────────
type DemoStatus = 'completed' | 'running' | 'awaiting_checkpoint' | 'paused_by_human';
const DEMO_STATUSES: DemoStatus[] = ['completed', 'running', 'awaiting_checkpoint', 'paused_by_human'];
const DEMO_STATUS_LABELS: Record<DemoStatus, string> = {
  completed:           'Completed',
  running:             'Running',
  awaiting_checkpoint: 'Awaiting Checkpoint',
  paused_by_human:     'Paused by Human',
};

// ─── Mock exceptions (AgentException shape) ──────────────────────────────────
const MOCK_EXCEPTIONS: import('@/components/agents/AgentExceptionPanel').AgentException[] = [
  {
    id: 'exc-001',
    exception_type: 'deferred_field',
    urgency: 'MEDIUM',
    message: 'Deferred field: Option to Renew — Notice Period. Confidence 0.61 — Exhibit D not uploaded.',
    attempted: 'Pattern-matched §12.3 and all renewal-related clauses across 3 documents. Confidence threshold 0.80 not met.',
    what_needed: 'Upload Exhibit D (Renewal Option Terms) or manually enter the notice period in the Terms tab.',
    contract_id: 'r1',
    timestamp: '2026-05-16T08:15:00Z',
    can_defer: true,
  },
  {
    id: 'exc-002',
    exception_type: 'field_conflict',
    urgency: 'HIGH',
    message: 'Conflict: CAM Reconciliation Cap — §8.4 states 3%; Exhibit B states 5%.',
    attempted: 'Cross-referenced §8.4 (3% cap) against Exhibit B (5% cap). Conflict detected; both values flagged.',
    what_needed: 'Review §8.4 and Exhibit B. Confirm correct cap in the Terms tab, then mark field as resolved.',
    contract_id: 'r1',
    timestamp: '2026-05-16T08:17:00Z',
    can_defer: false,
  },
];

export default function RecordTabAgent({ recordId }: RecordTabAgentProps) {
  const [demoStatus, setDemoStatus] = useState<DemoStatus>('completed');
  const [showExceptions, setShowExceptions] = useState(true);
  // Live progress bar for running state — increments every 2 seconds
  const [liveProgress, setLiveProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (demoStatus === 'running') {
      setLiveProgress(12); // start at 12% (steps 1-2 already done)
      intervalRef.current = setInterval(() => {
        setLiveProgress(prev => {
          const next = prev + 2;
          if (next >= 98) { clearInterval(intervalRef.current!); return 98; }
          return next;
        });
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLiveProgress(demoStatus === 'completed' ? 100 : demoStatus === 'awaiting_checkpoint' ? 75 : 0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [demoStatus]);

  const mockAgentTask: AgentTaskData = useMemo(() => {
    const isRunning    = demoStatus === 'running';
    const isAwaiting   = demoStatus === 'awaiting_checkpoint';
    const isPaused     = demoStatus === 'paused_by_human';
    const isCompleted  = demoStatus === 'completed';

    return {
      id: `task-record-${recordId}`,
      agent_type: 'contract_processing',
      workflow_id: `wf-${recordId}`,
      contract_id: recordId,
      agent_name: 'Contract Processing Agent',
      automation_level: 'full_autonomous',
      status: demoStatus,
      current_step: isRunning ? 'Field Extraction' : isAwaiting ? 'Collaborative Review Prep' : isCompleted ? 'Complete' : 'Paused',
      steps: [
        {
          id: 's1',
          label: 'Document Understanding',
          status: 'completed',
          timestamp: '08:05',
          duration: '0m 45s',
          reasoning: 'Identified 2 documents: base lease (Office Tower, 22,000 sqft) and Amendment #3. Document types confirmed via classification model (confidence 0.97).',
        },
        {
          id: 's2',
          label: 'Validation Checks',
          status: 'completed',
          timestamp: '08:10',
          duration: '0m 32s',
          reasoning: 'All 4 V3 validation checks passed: document completeness, party identity, date consistency, and financial coherence. No blocking issues.',
        },
        {
          id: 's3',
          label: 'Field Extraction',
          status: isRunning ? 'active' : 'completed',
          timestamp: isRunning ? undefined : '08:15',
          duration: isRunning ? undefined : '2m 04s',
          reasoning: isRunning
            ? 'Extracting financial fields from Amendment #3. Base contract fields already extracted (71/73 complete).'
            : '73 fields extracted across 15 categories. 2 fields deferred (notice period, CAM cap). Confidence avg: 0.91.',
        },
        {
          id: 's4',
          label: 'Collaborative Review Prep',
          status: isRunning ? 'upcoming' : isAwaiting ? 'active' : 'completed',
          timestamp: (isRunning || isAwaiting) ? undefined : '10:00',
          duration: (isRunning || isAwaiting) ? undefined : '1m 12s',
          reasoning: isAwaiting
            ? 'Generating review summary for Reviewer. Deferred fields and confidence flags being collated.'
            : isRunning
            ? undefined
            : 'Review summary generated. 2 deferred fields and 1 conflict flagged for reviewer attention. Reviewer notified.',
        },
      ],
      decisions: [
        {
          id: 'd1',
          label: 'Document classification confirmed',
          decision_type: 'classification',
          confidence: 0.97,
          summary: '2 documents classified: Base Lease + Amendment #3',
          reasoning: 'Classification model matched document structure, party names, and date patterns against the Commercial Lease template. Amendment detected via "Third Amendment" header and cross-reference to original lease date.',
          data_used: {
            document_1: 'Office-Tower-Lease-2022.pdf',
            document_2: 'Office-Tower-Amendment-3.pdf',
            template_matched: 'Commercial Lease — Standard',
            classification_confidence: '0.97',
          } as Record<string, string>,
          requires_human_approval: false,
          timestamp: '08:05',
        },
        {
          id: 'd2',
          label: 'Extraction completed — 2 fields deferred',
          decision_type: 'extraction',
          confidence: 0.91,
          summary: '73 fields extracted, 2 deferred (notice period, CAM cap)',
          reasoning: 'High-confidence fields accepted automatically. Two fields deferred: (1) renewal notice period — exhibit not uploaded; (2) CAM cap — conflicting values in §8.4 and Exhibit B. Both require human review.',
          data_used: {
            total_fields_extracted: '73',
            auto_accepted_gte_0_80: '71',
            deferred_lt_0_80_or_conflict: '2',
            average_confidence: '0.91',
            amendment_fields_merged: '12',
          } as Record<string, string>,
          requires_human_approval: false,
          timestamp: '08:15',
        },
        {
          id: 'd3',
          label: 'Collaborative review prepared',
          decision_type: 'review_prep',
          confidence: 0.97,
          summary: 'Review summary generated for Reviewer',
          reasoning: 'All critical fields confirmed. Deferred fields and the CAM cap conflict flagged for reviewer attention. Review package includes field confidence scores, source clause references, and amendment delta summary.',
          data_used: {
            review_summary_generated: 'Yes',
            deferred_fields_flagged: '2',
            conflict_flags: '1',
            reviewer_notified: 'M. Thompson',
          } as Record<string, string>,
          requires_human_approval: true,
          timestamp: '10:00',
        },
      ],
      flags: isRunning || isAwaiting || isPaused ? [
        {
          message: 'Deferred field: Option to Renew — Notice Period',
          detail: 'Confidence 0.61 — Exhibit D not uploaded. Manual entry required.',
        },
        {
          message: 'Conflict: CAM Reconciliation Cap',
          detail: '§8.4 states 3%; Exhibit B states 5%. Human review required.',
        },
      ] : [],
      progress: {
        current: isRunning ? 3 : isAwaiting ? 3 : 4,
        total: 4,
        label: isRunning ? 'Field Extraction' : isAwaiting ? 'Awaiting checkpoint' : isCompleted ? 'Complete' : 'Paused',
            },
    };
  }, [recordId, demoStatus]);

  const progressBarPct = demoStatus === 'running' ? liveProgress
    : demoStatus === 'completed' ? 100
    : demoStatus === 'awaiting_checkpoint' ? 75 : 0;

  function cycleStatus() {
    const idx = DEMO_STATUSES.indexOf(demoStatus);
    const next = DEMO_STATUSES[(idx + 1) % DEMO_STATUSES.length];
    setDemoStatus(next);
    toast.info(`Demo status: ${DEMO_STATUS_LABELS[next]}`);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Demo status toggle — dev helper */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">Agent status demo</span>
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold',
              demoStatus === 'completed'           && 'badge-approved',
              demoStatus === 'running'             && 'badge-processing',
              demoStatus === 'awaiting_checkpoint' && 'badge-warning',
              demoStatus === 'paused_by_human'     && 'badge-rework',
            )}
          >
            {DEMO_STATUS_LABELS[demoStatus]}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1.5 text-[11px]"
          onClick={cycleStatus}
        >
          <RefreshCw className="h-3 w-3" />
          Cycle status
        </Button>
      </div>

            {/* Live progress bar — only visible when running or awaiting */}
      {(demoStatus === 'running' || demoStatus === 'awaiting_checkpoint') && (
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              {demoStatus === 'running' && (
                <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-lg-primary)' }} />
              )}
              {demoStatus === 'running' ? 'Field Extraction in progress…' : 'Awaiting checkpoint approval'}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--color-lg-primary)' }}>
              {progressBarPct}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-[2000ms] ease-linear"
              style={{
                width: `${progressBarPct}%`,
                background: demoStatus === 'running'
                  ? 'var(--color-lg-primary)'
                  : 'var(--color-lg-warning)',
              }}
            />
          </div>
        </div>
      )}
      <GracefulDegradationBanner />
      <ContractAgentProgressPanel
        task={mockAgentTask}
        onIntervene={() => {
          setDemoStatus('paused_by_human');
          toast.warning('Agent paused — manual intervention mode active');
        }}
        onResume={() => {
          setDemoStatus('running');
          toast.success('Agent resumed');
        }}
      />

      {/* Exceptions panel — shown when there are deferred/conflicted fields */}
      {MOCK_EXCEPTIONS.length > 0 && (
        <div className="mt-4 mx-0">
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border">
            <span className="text-[13px] font-semibold text-foreground">
              Deferred Fields &amp; Conflicts
              <span className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
                {MOCK_EXCEPTIONS.length}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground"
              onClick={() => setShowExceptions(v => !v)}
            >
              {showExceptions ? 'Collapse' : 'Expand'}
            </Button>
          </div>
          {showExceptions && (
            <div className="flex flex-col gap-3 px-5 pb-5">
              <AgentExceptionPanel
                exceptions={MOCK_EXCEPTIONS}
                onOpenWorkspace={(contractId) => toast.info('Opening workspace for ' + contractId)}
                onEscalate={(id) => toast.warning('Escalated exception: ' + id)}
                onDismiss={(id) => toast.success('Dismissed exception: ' + id)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
