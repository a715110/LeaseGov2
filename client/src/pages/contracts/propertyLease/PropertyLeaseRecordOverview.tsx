/**
 * RecordTabOverview — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordOverview.tsx scaffold stub.
 *
 * Prompt 5.3: Two-column layout. Left: contract header + key terms grid.
 * Right: critical dates + action panel.
 *
 * Data model refs: ContractRecord, PropertyLease, Counterparty, Property
 */

import { useLocation } from "wouter";
import {
  Star, StarOff, FileText, TrendingUp, Upload, Edit3, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordTabOverviewProps {
  record: any;
  onWatchlistToggle: () => void;
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits:0 })}`;
}

function KeyTermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function RecordTabOverview({ record, onWatchlistToggle }: RecordTabOverviewProps) {
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
