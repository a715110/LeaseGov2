/**
 * EquipmentLeaseRecordMaintenance — Equipment Lease Prompt 3 (Maintenance tab)
 * Shows maintenance schedule, service history, and compliance tracking.
 */

import { Wrench, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface EquipmentLeaseRecordMaintenanceProps {
  record: any;
}

const MAINTENANCE_LABEL: Record<string, string> = {
  lessee: "Lessee",
  lessor: "Lessor",
  shared: "Shared",
};

const MAINTENANCE_COLOR: Record<string, { bg: string; color: string }> = {
  lessee: { bg: "var(--color-lg-warning-subtle)", color: "var(--color-lg-warning)" },
  lessor: { bg: "var(--color-lg-success-subtle)", color: "var(--color-lg-success)" },
  shared: { bg: "var(--color-lg-info-subtle)",    color: "var(--color-lg-info)" },
};

// Mock maintenance events for demo
const MOCK_MAINTENANCE_EVENTS = [
  { date: "2024-06-15", type: "Preventive", description: "Annual inspection completed", status: "completed" },
  { date: "2024-12-10", type: "Corrective", description: "Minor component replacement", status: "completed" },
  { date: "2025-06-15", type: "Preventive", description: "Annual inspection", status: "completed" },
  { date: "2026-06-15", type: "Preventive", description: "Annual inspection (upcoming)", status: "upcoming" },
];

export default function EquipmentLeaseRecordMaintenance({ record }: EquipmentLeaseRecordMaintenanceProps) {
  const maintenanceStyle = MAINTENANCE_COLOR[record.maintenance_responsibility ?? "lessee"] ?? MAINTENANCE_COLOR.lessee;

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Responsibility banner */}
      <div
        className="flex items-center gap-3 p-4 rounded-lg border"
        style={{ background: maintenanceStyle.bg, borderColor: maintenanceStyle.color }}
      >
        <Wrench className="w-5 h-5 shrink-0" style={{ color: maintenanceStyle.color }} />
        <div>
          <p className="text-[13px] font-semibold" style={{ color: maintenanceStyle.color }}>
            Maintenance Responsibility: {MAINTENANCE_LABEL[record.maintenance_responsibility ?? "lessee"]}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {record.maintenance_responsibility === "lessor"
              ? "Lessor is responsible for all scheduled and corrective maintenance."
              : record.maintenance_responsibility === "shared"
              ? "Maintenance responsibilities are shared per the agreement schedule."
              : "Lessee is responsible for all scheduled and corrective maintenance."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Maintenance history */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Maintenance History</h3>
          </div>
          <div className="divide-y divide-border">
            {MOCK_MAINTENANCE_EVENTS.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <div className="mt-0.5 shrink-0">
                  {ev.status === "completed"
                    ? <CheckCircle className="w-4 h-4 text-[var(--color-lg-success)]" />
                    : ev.status === "upcoming"
                    ? <Clock className="w-4 h-4 text-[var(--color-lg-warning)]" />
                    : <AlertTriangle className="w-4 h-4 text-[var(--color-lg-error)]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold text-foreground">{ev.type}</span>
                    <span className="text-[11px] text-muted-foreground">{ev.date}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance and compliance */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Insurance Requirements</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Coverage Type</span>
                <span className="text-[13px] text-foreground">Comprehensive commercial equipment insurance</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Minimum Coverage</span>
                <span className="text-[13px] text-foreground">Replacement value of equipment</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Named Insured</span>
                <span className="text-[13px] text-foreground">{record.counterparty ?? "Lessor"} as additional insured</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Permitted Modifications</h3>
            <p className="text-[13px] text-foreground leading-relaxed">
              {record.permitted_modifications ?? "No modifications permitted without prior written consent from lessor."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
