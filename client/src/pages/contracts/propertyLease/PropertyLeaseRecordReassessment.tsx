/**
 * RecordTabReassessment — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordReassessment.tsx scaffold stub.
 *
 * Shows active reassessment cases linked to this record.
 * "Start Reassessment" CTA navigates to reassessment trigger form.
 */

import { useLocation } from "wouter";
import { TrendingUp, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordTabReassessmentProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/reassessments
const MOCK_CASES = [
  { id:"rc1", case_number:"RCASE-2026-0014", trigger_type:"lease_modification", status:"in_progress", assigned_to:"M. Thompson", created_at:"2026-05-10" },
];

const STATUS_BADGE: Record<string, string> = {
  in_progress:      "badge-processing",
  pending_approval: "badge-warning",
  approved:         "badge-valid",
  closed:           "badge-muted",
};

export default function RecordTabReassessment({ recordId }: RecordTabReassessmentProps) {
  const [, navigate] = useLocation();

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">Reassessment Cases ({MOCK_CASES.length})</h3>
        <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
          <Plus className="w-3.5 h-3.5" /> Start Reassessment
        </Button>
      </div>

      {MOCK_CASES.length === 0 ? (
        <div className="bg-card border border-border rounded-lg flex flex-col items-center justify-center py-12 gap-3">
          <TrendingUp className="w-8 h-8 text-muted-foreground opacity-40" />
          <p className="text-[14px] text-muted-foreground">No reassessment cases for this record</p>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
            <Plus className="w-3.5 h-3.5" /> Start Reassessment
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="text-left">Case #</th>
                <th className="text-left">Trigger Type</th>
                <th className="text-left">Status</th>
                <th className="text-left">Assigned To</th>
                <th className="text-left">Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CASES.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-[12px] text-muted-foreground">{c.case_number}</td>
                  <td className="capitalize">{c.trigger_type.replace(/_/g, " ")}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[c.status] || "badge-muted"}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{c.assigned_to}</td>
                  <td className="text-muted-foreground">{c.created_at}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]" onClick={() => navigate("/reassessment/hub")}>
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
