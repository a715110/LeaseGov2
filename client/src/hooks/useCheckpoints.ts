/**
 * useCheckpoints — stub hook for human checkpoint data
 * TODO: Backend integration required — GET /checkpoints?subject_id=...
 *
 * Returns mock checkpoint data keyed by contractRecordId.
 * Replace with real API call when backend is available.
 */
import { useMemo } from 'react';
import type { HumanCheckpointData, CheckpointType } from '@/components/checkpoints/ContractCheckpointCard';

// Mock pending checkpoint factory — returns a realistic pending checkpoint
function makeMockCheckpoint(
  contractRecordId: string,
  checkpointType: CheckpointType,
): HumanCheckpointData {
  return {
    id: `cp-${checkpointType}-${contractRecordId}`,
    contract_record_id: contractRecordId,
    checkpoint_type: checkpointType,
    status: 'pending',
    agent_prepared_data: {
      summary: 'Agent has completed automated processing and prepared a recommendation for human review.',
      fields: [
        { field_name: 'Lease Commencement Date', agent_value: '2026-01-01', is_critical: true },
        { field_name: 'Base Rent (Annual)', agent_value: '$1,240,000', is_critical: true },
        { field_name: 'Lease Term (Years)', agent_value: '10', is_critical: false },
        { field_name: 'Renewal Options', agent_value: '2 × 5-year options', is_critical: false },
      ],
    },
    agent_recommendation: 'All extracted fields meet confidence thresholds. Recommend approval.',
    agent_confidence: 0.94,
    deadline_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  };
}

export type CheckpointFilter = {
  checkpointType?: CheckpointType;
  status?: 'pending' | 'approved' | 'modified' | 'rejected' | 'expired';
};

export function useCheckpoints(
  contractRecordId: string,
  filter?: CheckpointFilter,
) {
  // TODO: Backend integration required — replace with real API call
  const checkpoints = useMemo<HumanCheckpointData[]>(() => {
    if (!contractRecordId) return [];
    // Return a mock pending checkpoint for the requested type
    const type = filter?.checkpointType ?? 'extraction_review';
    return [makeMockCheckpoint(contractRecordId, type)];
  }, [contractRecordId, filter?.checkpointType]);

  const activeCheckpoint = useMemo(() => {
    return checkpoints.find(cp => {
      const statusMatch = filter?.status ? cp.status === filter.status : cp.status === 'pending';
      const typeMatch = filter?.checkpointType ? cp.checkpoint_type === filter.checkpointType : true;
      return statusMatch && typeMatch;
    }) ?? null;
  }, [checkpoints, filter?.status, filter?.checkpointType]);

  return { checkpoints, activeCheckpoint };
}
