/**
 * RecordTabOverview — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordOverview.tsx scaffold stub.
 *
 * Prompt 3 (Equipment Lease): Added isEquipmentLease prop.
 *   - isEquipmentLease = false → existing property lease layout (unchanged)
 *   - isEquipmentLease = true  → equipment layout:
 *       Left:  Asset Identity card, Counterparty card
 *       Right: Classification badge (ASC 842), Key Dates card,
 *              Critical Thresholds card, Quick Actions card
 *
 * Data model refs: ContractRecord, PropertyLease, EquipmentLease
 */

import { useLocation } from "wouter";
import {
  Star, StarOff, FileText, TrendingUp, Upload, Edit3,
  Scale, CheckCircle, XCircle, AlertTriangle, Copy
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RecordTabOverviewProps {
  record: any;
  onWatchlistToggle: () => void;
  isEquipmentLease?: boolean;
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits:0 })}`;
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function KeyTermRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={`text-[13px] font-medium text-foreground ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
    </div>
  );
}

// ─── Equipment Overview Layout ─────────────────────────────────────────────────
function EquipmentOverview({ record, onWatchlistToggle }: { record: any; onWatchlistToggle: () => void }) {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const isFinance = record.lease_classification === "finance";

  function copySerial() {
    navigator.clipboard.writeText(record.serial_number ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const usefulLifePct = record.lessee_useful_life_coverage_pct ?? 0;
  const pvPct = record.pv_as_pct_of_fair_value ?? 0;

  const keyDates = [
    { label: "Commencement",   date: record.commencement_date,  warn: false },
    { label: "Expiration",     date: record.expiration_date,    warn: true  },
    { label: "Payment Due Day", date: "1st of each month",      warn: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* ── Left column ── */}
      <div className="col-span-2 flex flex-col gap-5">
        {/* Asset Identity */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Asset Identity</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Equipment Type</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-foreground">{record.equipment_type ?? "—"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#f5f3ff] text-[#7c3aed] border border-[#c4b5fd] capitalize">
                  {(record.equipment_category ?? "other").replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <KeyTermRow label="Manufacturer" value={record.manufacturer ?? "—"} />
            <KeyTermRow label="Model" value={record.model ?? "—"} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Serial Number</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[12px] text-foreground">{record.serial_number ?? "—"}</span>
                <button
                  className="p-0.5 rounded hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
                  onClick={copySerial}
                  title="Copy serial number"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-[var(--color-lg-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Asset Tag</span>
              <span className="font-mono text-[12px] text-foreground">{record.asset_tag ?? "—"}</span>
            </div>
            <KeyTermRow label="Quantity" value={record.quantity != null ? `${record.quantity} unit${record.quantity !== 1 ? "s" : ""}` : "—"} />
            <div className="col-span-2">
              <KeyTermRow label="Installation Location" value={record.installation_location ?? "—"} />
            </div>
          </div>
        </div>

        {/* Counterparty */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Counterparty</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <KeyTermRow label="Vendor / Lessor" value={record.counterparty ?? record.counterparty_name ?? "—"} />
            <KeyTermRow label="Contact" value="—" />
            <KeyTermRow label="Agreement Reference" value={record.contractNumber ?? record.contract_number ?? "—"} />
          </div>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="flex flex-col gap-4">
        {/* Classification badge */}
        <div
          className="rounded-lg p-4 flex flex-col gap-2 border"
          style={
            isFinance
              ? { background: "var(--color-lg-error-subtle)", borderColor: "var(--color-lg-error)" }
              : { background: "var(--color-lg-success-subtle)", borderColor: "var(--color-lg-success)" }
          }
        >
          <div className="flex items-center gap-2">
            {isFinance
              ? <XCircle className="w-5 h-5" style={{ color: "var(--color-lg-error)" }} />
              : <CheckCircle className="w-5 h-5" style={{ color: "var(--color-lg-success)" }} />
            }
            <span
              className="text-[15px] font-bold"
              style={{ color: isFinance ? "var(--color-lg-error)" : "var(--color-lg-success)" }}
            >
              {isFinance ? "Finance Lease" : "Operating Lease"}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">ASC 842 Classification</p>
          {record.classification_rationale && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{record.classification_rationale}</p>
          )}
        </div>

        {/* Key Dates */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Key Dates</h3>
          </div>
          <div className="divide-y divide-border">
            {keyDates.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-muted-foreground">{d.label}</span>
                <span className={`text-[13px] font-medium ${d.warn && d.date !== "—" ? "text-[var(--color-lg-warning)]" : "text-foreground"}`}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Thresholds */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Critical Thresholds</h3>
          </div>
          <div className="divide-y divide-border">
            {/* Useful Life Coverage */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-muted-foreground">Useful Life Coverage</span>
                <div className="flex items-center gap-1">
                  {usefulLifePct > 75 && <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" />}
                  <span className={`text-[13px] font-semibold ${usefulLifePct > 75 ? "text-[var(--color-lg-warning)]" : "text-foreground"}`}>
                    {usefulLifePct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[var(--color-lg-page-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(usefulLifePct, 100)}%`,
                    background: usefulLifePct > 75 ? "var(--color-lg-warning)" : "var(--color-lg-success)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Threshold: 75% → Finance indicator</p>
            </div>
            {/* PV / Fair Value */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-muted-foreground">PV / Fair Value</span>
                <div className="flex items-center gap-1">
                  {pvPct > 90 && <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" />}
                  <span className={`text-[13px] font-semibold ${pvPct > 90 ? "text-[var(--color-lg-warning)]" : "text-foreground"}`}>
                    {pvPct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-[var(--color-lg-page-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(pvPct, 100)}%`,
                    background: pvPct > 90 ? "var(--color-lg-warning)" : "var(--color-lg-success)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Threshold: 90% → Finance indicator</p>
            </div>
            {/* Purchase Option */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-muted-foreground">Purchase Option</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-foreground">
                  {record.purchase_option_price != null ? fmtCurrency(record.purchase_option_price) : "None"}
                </span>
                {record.purchase_option_reasonably_certain && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[var(--color-lg-error-subtle)] text-[var(--color-lg-error)]">
                    Reasonably Certain
                  </span>
                )}
              </div>
            </div>
            {/* Residual Value Guarantee */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-muted-foreground">Residual Value Guarantee</span>
              <span className="text-[13px] font-medium text-foreground">
                {record.residual_value_guarantee != null ? fmtCurrency(record.residual_value_guarantee) : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">Quick Actions</h3>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate(`/records/${record.id}/add-document`)}>
            <FileText className="w-3.5 h-3.5" /> View Documents
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
            <TrendingUp className="w-3.5 h-3.5" /> Request Reassessment
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate(`/export/templates?record=${record.id}`)}>
            <Upload className="w-3.5 h-3.5" /> Export
          </Button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors"
            onClick={onWatchlistToggle}
          >
            {record.is_watchlisted
              ? <><Star className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" /> Remove from Watchlist</>
              : <><StarOff className="w-3.5 h-3.5 text-muted-foreground" /> Add to Watchlist</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Property Overview Layout (unchanged) ─────────────────────────────────────
function PropertyOverview({ record, onWatchlistToggle }: { record: any; onWatchlistToggle: () => void }) {
  const [, navigate] = useLocation();

  const criticalDates = [
    { label:"Commencement",        date: record.commencement_date,      warn: false },
    { label:"Expiration",          date: record.expiration_date,        warn: true  },
    { label:"Rent Commencement",   date: record.rent_commencement_date || "—", warn: false },
    { label:"Next Escalation",     date: record.next_escalation_date   || "—", warn: false },
    { label:"Option Exercise",     date: record.option_exercise_deadline || "—", warn: true  },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Left: key terms */}
      <div className="col-span-2 flex flex-col gap-5">
        {/* Parties */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Parties</h3>
          <div className="grid grid-cols-2 gap-4">
            <KeyTermRow label="Landlord" value={record.landlord_name} />
            <KeyTermRow label="Tenant"   value={record.tenant_name} />
          </div>
        </div>

        {/* Key terms grid */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Lease Terms</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <KeyTermRow label="Effective Date"      value={record.effective_date} />
            <KeyTermRow label="Commencement Date"   value={record.commencement_date} />
            <KeyTermRow label="Expiration Date"     value={record.expiration_date} />
            <KeyTermRow label="Term (Months)"       value={String(record.lease_term_months)} />
            <KeyTermRow label="Base Rent"           value={fmtCents(record.base_rent_amount) + "/" + record.base_rent_frequency} />
            <KeyTermRow label="Escalation Type"     value={record.escalation_type?.replace(/_/g, " ") || "—"} />
            <KeyTermRow label="Escalation Rate"     value={record.escalation_rate ? `${(record.escalation_rate * 100).toFixed(2)}%` : "—"} />
            <KeyTermRow label="Classification"      value={record.lease_classification?.replace(/_/g, " ") || "—"} />
          </div>
        </div>

        {/* Property */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Property</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <KeyTermRow label="Address"         value={record.property_address_street} />
            <KeyTermRow label="Rentable Area"   value={record.rentable_area_sqft ? `${record.rentable_area_sqft.toLocaleString()} sqft` : "—"} />
            <KeyTermRow label="Suite / Floor"   value={record.suite_floor_unit || "—"} />
            <KeyTermRow label="Property Type"   value={record.property_type?.replace(/_/g, " ") || "—"} />
          </div>
        </div>
      </div>

      {/* Right: critical dates + actions */}
      <div className="flex flex-col gap-4">
        {/* Critical dates */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Critical Dates</h3>
          </div>
          <div className="divide-y divide-border">
            {criticalDates.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-muted-foreground">{d.label}</span>
                <span className={`text-[13px] font-medium ${d.warn && d.date !== "—" ? "text-[var(--color-lg-warning)]" : "text-foreground"}`}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-foreground mb-1">Quick Actions</h3>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate(`/records/${record.id}/add-document`)}>
            <FileText className="w-3.5 h-3.5" /> Add Document
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
            <TrendingUp className="w-3.5 h-3.5" /> Start Reassessment
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate(`/export/templates?record=${record.id}`)}>
            <Upload className="w-3.5 h-3.5" /> Export Record
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-[12px]" onClick={() => navigate(`/records/${record.id}/correction`)}>
            <Edit3 className="w-3.5 h-3.5" /> Initiate Correction
          </Button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors"
            onClick={onWatchlistToggle}
          >
            {record.is_watchlisted
              ? <><Star className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" /> Remove from Watchlist</>
              : <><StarOff className="w-3.5 h-3.5 text-muted-foreground" /> Add to Watchlist</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecordTabOverview({ record, onWatchlistToggle, isEquipmentLease = false }: RecordTabOverviewProps) {
  if (isEquipmentLease) {
    return <EquipmentOverview record={record} onWatchlistToggle={onWatchlistToggle} />;
  }
  return <PropertyOverview record={record} onWatchlistToggle={onWatchlistToggle} />;
}
