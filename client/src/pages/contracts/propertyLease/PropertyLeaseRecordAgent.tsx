/**
 * RecordTabAgent — Tab component consumed by RecordsDetail
 * FC-9 wired: ContractAgentProgressPanel (AG.1) replaces the static log list.
 *
 * Shows live Contract Agent progress for this record.
 * TODO: Backend integration required — GET /api/agents/tasks?subject_id=:recordId
 */
import { useMemo } from "react";
import { ContractAgentProgressPanel } from '@/components/agents/ContractAgentProgressPanel';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';

interface RecordTabAgentProps {
  recordId: string;
}

export default function RecordTabAgent({ recordId }: RecordTabAgentProps) {
  // TODO: Replace with real API call — GET /api/agents/tasks?subject_id=recordId
  const mockAgentTask = useMemo(() => ({
    id: `task-record-${recordId}`,
    agent_type: 'contract_processing',
    workflow_id: `wf-${recordId}`,
    contract_id: recordId,
    agent_name: 'Contract Agent',
    automation_level: 'full_autonomous' as const,
    status: 'completed' as const,
    current_step: 'Complete',
    steps: [
      { id: 's1', label: 'Document Understanding',    status: 'completed' as const, timestamp: '08:05', duration: '0m 45s' },
      { id: 's2', label: 'Validation Checks',         status: 'completed' as const, timestamp: '08:10', duration: '0m 32s' },
      { id: 's3', label: 'Field Extraction',          status: 'completed' as const, timestamp: '08:15', duration: '2m 04s' },
      { id: 's4', label: 'Collaborative Review Prep', status: 'completed' as const, timestamp: '10:00', duration: '1m 12s' },
    ],
    decisions: [
      {
        id: 'd1',
        label: 'Extraction completed',
        decision_type: 'extraction',
        confidence: 0.94,
        summary: '73 fields extracted, 2 deferred',
        reasoning: 'Base contract and 1 amendment detected. All high-confidence fields accepted automatically.',
        requires_human_approval: false,
        timestamp: '08:15',
      },
      {
        id: 'd2',
        label: 'Collaborative review prepared',
        decision_type: 'review_prep',
        confidence: 0.97,
        summary: 'Review summary generated for Reviewer',
        reasoning: 'All critical fields confirmed. Deferred fields flagged for reviewer attention.',
        requires_human_approval: true,
        timestamp: '10:00',
      },
    ],
    progress: { current: 4, total: 4, label: 'Complete' },
  }), [recordId]);

  return (
    <div className="flex flex-col gap-0">
      <GracefulDegradationBanner />
      <ContractAgentProgressPanel
        task={mockAgentTask}
        onIntervene={() => {}}
        onResume={() => {}}
      />
    </div>
  );
}
