/**
 * RecordsSnapshotViewer — FC-5 Screen 5.6 (Phase 2)
 * Screen key: records-snapshot-viewer
 * Route: /records/:id/snapshots
 *
 * PHASE 2 — activate when Phase 2 is enabled
 *
 * Side-by-side comparison of two ContractRecordSnapshot entries.
 * Left: selected historical snapshot · Right: current record state.
 * Highlight changed fields in amber.
 * Dropdown to select which snapshot to compare.
 *
 * Data model refs: ContractRecordSnapshot (snapshot_number, trigger_type,
 *   snapshot_data, created_at, created_by_user_id)
 */

import { useLocation, useParams } from "wouter";
import { AlertTriangle, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

export default function RecordsSnapshotViewer() {
  const _screenKey = SCREEN_KEYS.RECORDS_SNAPSHOT_VIEWER;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordId = params.id || "r1";

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {/* Phase 2 banner */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border" style={{ background:"var(--color-lg-warning-subtle)", borderBottomColor:"var(--color-lg-warning)" }}>
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
        <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-warning)" }}>
          Phase 2 Feature — Snapshot Viewer is available in Phase 2.
        </span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Snapshot Comparison</h1>
          <p className="page-subtitle">Compare historical snapshots for record {recordId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/records/${recordId}`)}>Back to Record</Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--color-lg-accent-subtle)] flex items-center justify-center">
            <GitCompare className="w-8 h-8 text-[var(--color-lg-primary)]" />
          </div>
          <p className="text-[15px] font-semibold text-foreground">Snapshot Viewer</p>
          <p className="text-[13px] text-muted-foreground">
            Side-by-side comparison of two ContractRecordSnapshot entries with changed fields highlighted in amber.
            Available in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
