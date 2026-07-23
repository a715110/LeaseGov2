/**
 * EquipmentLeaseRecordAssetDetails — Equipment Lease Prompt 3D
 * Tab: "Asset Details" (equipment lease only)
 * Route: /records/:id → Asset Details tab
 *
 * Five cards:
 *   1. Equipment Specifications
 *   2. Condition and Return
 *   3. Usage Terms (only if usage_limits is not null)
 *   4. Maintenance
 *   5. Purchase Option (only if purchase_option_price is not null)
 */

import { AlertTriangle, CheckCircle, XCircle, Wrench, ShieldCheck, Info } from "lucide-react";

interface EquipmentLeaseRecordAssetDetailsProps {
  record: any;
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-[13px] font-medium text-foreground ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
    </div>
  );
}

function CardHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
    </div>
  );
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

export default function EquipmentLeaseRecordAssetDetails({ record }: EquipmentLeaseRecordAssetDetailsProps) {
  const hasUsageLimits = record.usage_limits != null;
  const hasPurchaseOption = record.purchase_option_price != null;
  const isFinance = record.lease_classification === "finance";

  // Usage progress estimate: assume 50% of term elapsed for demo
  const usageLimit = record.usage_limits ? parseInt(String(record.usage_limits).replace(/[^0-9]/g, "")) : null;
  const estimatedUsage = usageLimit ? Math.round(usageLimit * 0.5) : null;
  const usagePct = usageLimit && estimatedUsage ? (estimatedUsage / usageLimit) * 100 : 0;

  const maintenanceStyle = MAINTENANCE_COLOR[record.maintenance_responsibility ?? "lessee"] ?? MAINTENANCE_COLOR.lessee;

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5">
        {/* ── Card 1: Equipment Specifications ── */}
        <div className="bg-card border border-border rounded-lg p-5">
          <CardHeader title="Equipment Specifications" />
          <div className="flex flex-col gap-4">
            <DetailRow label="Equipment Type" value={record.equipment_type ?? "—"} />
            <DetailRow label="Manufacturer" value={record.manufacturer ?? "—"} />
            <DetailRow label="Model" value={record.model ?? "—"} />
            <DetailRow label="Quantity" value={record.quantity != null ? `${record.quantity} unit${record.quantity !== 1 ? "s" : ""}` : "—"} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Serial Number(s)</span>
              <span className="font-mono text-[12px] text-foreground leading-relaxed">{record.serial_number ?? "—"}</span>
            </div>
            {record.asset_tag && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Asset Tag</span>
                <span className="font-mono text-[12px] text-foreground">{record.asset_tag}</span>
              </div>
            )}
            <DetailRow label="Installation Location" value={record.installation_location ?? "—"} />
          </div>
        </div>

        {/* ── Card 2: Condition and Return ── */}
        <div className="bg-card border border-border rounded-lg p-5">
          <CardHeader title="Condition and Return" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Condition at Commencement</span>
              <p className="text-[13px] text-foreground leading-relaxed">{record.condition_at_commencement ?? "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Return Conditions</span>
              <p className="text-[13px] text-foreground leading-relaxed">{record.return_conditions ?? "—"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Permitted Modifications</span>
              <p className="text-[13px] text-foreground leading-relaxed">{record.permitted_modifications ?? "None"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Deinstallation Responsibility</span>
              <p className="text-[13px] text-foreground">
                {record.maintenance_responsibility === "lessee" ? "Lessee" : record.maintenance_responsibility === "lessor" ? "Lessor" : "Shared / Per Agreement"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Card 3: Usage Terms (conditional) ── */}
        {hasUsageLimits && (
          <div className="bg-card border border-border rounded-lg p-5">
            <CardHeader title="Usage Terms" icon={<Info className="w-4 h-4" />} />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Usage Limit</span>
                <p className="text-[13px] text-foreground">{record.usage_limits}</p>
              </div>
              {record.variable_payment_rate != null && (
                <DetailRow label="Variable Payment Rate" value={`$${record.variable_payment_rate.toFixed(2)} per unit`} />
              )}
              {record.excess_usage_rate != null && (
                <DetailRow label="Excess Usage Rate" value={`$${record.excess_usage_rate.toFixed(2)} per unit over limit`} />
              )}

              {/* Usage progress bar */}
              {usageLimit && estimatedUsage && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-muted-foreground">Estimated Usage Progress</span>
                    <span className={`text-[12px] font-semibold ${usagePct > 80 ? "text-[var(--color-lg-error)]" : usagePct > 60 ? "text-[var(--color-lg-warning)]" : "text-[var(--color-lg-success)]"}`}>
                      {usagePct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-lg-page-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(usagePct, 100)}%`,
                        background: usagePct > 80
                          ? "var(--color-lg-error)"
                          : usagePct > 60
                          ? "var(--color-lg-warning)"
                          : "var(--color-lg-success)",
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Estimated usage: {estimatedUsage.toLocaleString()} of {usageLimit.toLocaleString()} units
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Card 4: Maintenance ── */}
        <div className="bg-card border border-border rounded-lg p-5">
          <CardHeader title="Maintenance" icon={<Wrench className="w-4 h-4" />} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Maintenance Responsibility</span>
              <span
                className="inline-flex items-center w-fit px-2.5 py-1 rounded text-[12px] font-semibold border"
                style={{ background: maintenanceStyle.bg, color: maintenanceStyle.color, borderColor: maintenanceStyle.color }}
              >
                {MAINTENANCE_LABEL[record.maintenance_responsibility ?? "lessee"]}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Insurance Requirements</span>
              <p className="text-[13px] text-foreground">Per standard commercial lease terms. Lessee to maintain comprehensive coverage.</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Warranty Information</span>
              <p className="text-[13px] text-foreground">{record.condition_at_commencement?.includes("warranty") ? "Manufacturer warranty active at commencement" : "No warranty information extracted"}</p>
            </div>
          </div>
        </div>

        {/* ── Card 5: Purchase Option (conditional) ── */}
        {hasPurchaseOption && (
          <div className="bg-card border border-border rounded-lg p-5 border-l-4" style={{ borderLeftColor: isFinance ? "var(--color-lg-error)" : "var(--color-lg-info)" }}>
            <CardHeader title="Purchase Option" icon={<ShieldCheck className="w-4 h-4" />} />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <DetailRow label="Option Price" value={fmtCurrency(record.purchase_option_price)} />
                {record.purchase_option_reasonably_certain && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-lg-error-subtle)] text-[var(--color-lg-error)]">
                    <AlertTriangle className="w-3 h-3" />
                    Reasonably Certain
                  </span>
                )}
                {record.purchase_option_reasonably_certain === false && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground">
                    Not Reasonably Certain
                  </span>
                )}
              </div>
              {record.purchase_option_exercise_date && (
                <DetailRow label="Exercise Date" value={record.purchase_option_exercise_date} />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Expected Fair Value at Exercise</span>
                <span className="text-[13px] text-muted-foreground italic">Pending agent analysis</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-lg-info-subtle)] border border-[var(--color-lg-info)]">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--color-lg-info)" }} />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Finance lease if purchase option is reasonably certain to be exercised (ASC 842-10-25-2(b)).
                  {record.purchase_option_reasonably_certain
                    ? " This lease is classified as Finance based on this criterion."
                    : " This criterion is not currently met."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
