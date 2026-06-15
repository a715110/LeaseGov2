/**
 * RecordTabHistory — Tab component consumed by RecordsDetail
 *
 * Prompt 5.3 History tab: timeline of ContractRecordSnapshot entries.
 * Each snapshot: snapshot_number · trigger_type badge · created_by · date ·
 *   "Compare to Current" button → navigates to RecordsSnapshotViewer with the
 *   snapshot pre-selected on the left panel via ?snap=<id> query param.
 *
 * Data model refs: ContractRecordSnapshot (snapshot_number, trigger_type,
 *   created_by_user_id, created_at)
 */

import { GitCommit, Clock, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface RecordTabHistoryProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/snapshots
const MOCK_SNAPSHOTS = [
  { id:"snap-003", snapshot_number:3, trigger_type:"correction",       created_by:"J. Martinez", created_at:"2026-05-16T09:00:00Z", note:"Rent correction — Amendment 3 applied" },
  { id:"snap-002", snapshot_number:2, trigger_type:"reassessment",     created_by:"M. Thompson", created_at:"2025-01-15T14:30:00Z", note:"Reassessment — lease extension approved" },
  { id:"snap-001", snapshot_number:1, trigger_type:"initial_approval", created_by:"A. Chen",     created_at:"2022-01-05T10:00:00Z", note:"Initial approval — lease commencement" },
];

const TRIGGER_BADGE: Record<string, string> = {
  initial_approval:"badge-valid",
  reassessment:    "badge-processing",
  correction:      "badge-warning",
  amendment:       "badge-warning",
};

const TRIGGER_LABEL: Record<string, string> = {
  initial_approval:"Initial Approval",
  reassessment:    "Reassessment",
  correction:      "Correction",
  amendment:       "Amendment",
};

export default function RecordTabHistory({ recordId }: RecordTabHistoryProps) {
  const [, navigate] = useLocation();

  function openSnapshotViewer(snapId: string) {
    navigate(`/records/${recordId}/snapshots?snap=${snapId}`);
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">Snapshot History ({MOCK_SNAPSHOTS.length})</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[12px]"
          onClick={() => navigate(`/records/${recordId}/snapshots`)}
        >
          <GitCompare className="w-3.5 h-3.5" />
          Full Comparison View
        </Button>
      </div>

      <div className="relative flex flex-col gap-0">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />

        {MOCK_SNAPSHOTS.map((snap) => (
          <div key={snap.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
            {/* Node */}
            <div className="relative z-10 w-10 h-10 rounded-full bg-card border-2 border-[var(--color-lg-primary)] flex items-center justify-center shrink-0">
              <GitCommit className="w-4 h-4 text-[var(--color-lg-primary)]" />
            </div>

            {/* Content */}
            <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3.5">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">Snapshot #{snap.snapshot_number}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TRIGGER_BADGE[snap.trigger_type] || "badge-muted"}`}>
                    {TRIGGER_LABEL[snap.trigger_type] || snap.trigger_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[12px]"
                    onClick={() => openSnapshotViewer(snap.id)}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    Compare to Current
                  </Button>
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground">{snap.note}</p>
              <div className="flex items-center gap-3 mt-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {new Date(snap.created_at).toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" })} · by {snap.created_by}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
