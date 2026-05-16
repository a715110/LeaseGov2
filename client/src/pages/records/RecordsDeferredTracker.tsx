/**
 * RecordsDeferredTracker — FC-5 Screen 5.5 (Phase 2)
 * Screen key: records-deferred-tracker
 * Route: /records/:id/deferred
 *
 * PHASE 2 — activate when Phase 2 is enabled
 *
 * Deferred fields table: ExtractionFields where disposition = deferred.
 * Columns: field_name · deferred_justification · deferred_by · deferred_date · Resolve action.
 * Resolve action opens the extraction field in a side panel for correction and re-disposition.
 * Count badge shown on Records Detail tab navigation.
 *
 * Data model refs: ExtractionField (disposition, deferred_justification, deferred_by_user_id, deferred_at)
 */

import { useLocation, useParams } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/records/:id/deferred-fields
const MOCK_DEFERRED = [
  { id:"df1", field_name:"security_deposit",     field_label:"Security Deposit",     deferred_justification:"Amount unclear — awaiting landlord confirmation", deferred_by:"J. Martinez", deferred_date:"2026-05-16" },
  { id:"df2", field_name:"cam_base_year",         field_label:"CAM Base Year",         deferred_justification:"Not specified in base contract — check exhibit",  deferred_by:"J. Martinez", deferred_date:"2026-05-16" },
];

export default function RecordsDeferredTracker() {
  const _screenKey = SCREEN_KEYS.RECORDS_DEFERRED_TRACKER;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordId = params.id || "r1";

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {/* Phase 2 banner */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border" style={{ background:"var(--color-lg-warning-subtle)", borderBottomColor:"var(--color-lg-warning)" }}>
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
        <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-warning)" }}>
          Phase 2 Feature — Deferred Fields Tracker is available in Phase 2.
        </span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Deferred Fields</h1>
          <p className="page-subtitle">Fields deferred during extraction for record {recordId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/records/${recordId}`)}>Back to Record</Button>
      </div>

      <div className="px-6 py-5">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="text-left">Field</th>
                <th className="text-left">Justification</th>
                <th className="text-left">Deferred By</th>
                <th className="text-left">Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DEFERRED.map(f => (
                <tr key={f.id}>
                  <td className="font-medium text-foreground">{f.field_label}</td>
                  <td className="text-muted-foreground text-[12px] max-w-[300px]">{f.deferred_justification}</td>
                  <td className="text-muted-foreground">{f.deferred_by}</td>
                  <td className="text-muted-foreground">{f.deferred_date}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]" disabled>
                      Resolve <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
