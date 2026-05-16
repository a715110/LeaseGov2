/**
 * ExtractionTracker — FC-2 Screen 2.8
 * Screen key: extraction-verification-tracker
 * Route: /extraction/tracker
 * Role: Reviewer / Preparer
 *
 * Design: Structured Authority
 * Prompt 2.8: Fixed 64px bottom progress bar as a standalone dashboard view.
 *   Four sections: Total (accent progress bar), Critical (warning bar),
 *   Deferred (warning badge), Unresolved.
 *   Submit button: disabled grey with tooltip blockers list,
 *   enabled accent variant when all 22/22 green and all counts resolved.
 *   Also shows a field-by-field tracker table above the bar.
 * Data model refs: ExtractionRecord (verified_count, critical_verified_count,
 *   deferred_count), ExtractionField
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield, CheckCircle2, AlertTriangle, Clock, XCircle,
  ChevronRight, AlertCircle, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

type FieldStatus = "confirmed" | "accepted" | "corrected" | "deferred" | "not_found" | "unresolved";

interface TrackerField {
  id: string;
  field_label: string;
  field_category: string;
  is_critical: boolean;
  status: FieldStatus;
  ai_confidence: number | null;
  reviewer_note?: string;
}

// TODO: Backend integration required — GET /api/extraction-records/:id/tracker
const TRACKER_FIELDS: TrackerField[] = [
  { id:"t1",  field_label:"Record Label",       field_category:"core_metadata", is_critical:false, status:"accepted",    ai_confidence:0.96 },
  { id:"t2",  field_label:"Contract Type",      field_category:"core_metadata", is_critical:false, status:"accepted",    ai_confidence:0.94 },
  { id:"t3",  field_label:"Execution Date",     field_category:"core_metadata", is_critical:true,  status:"confirmed",   ai_confidence:0.91 },
  { id:"t4",  field_label:"Commencement Date",  field_category:"core_metadata", is_critical:true,  status:"corrected",   ai_confidence:0.88 },
  { id:"t5",  field_label:"Expiration Date",    field_category:"core_metadata", is_critical:true,  status:"unresolved",  ai_confidence:null },
  { id:"t6",  field_label:"Amendment Number",   field_category:"core_metadata", is_critical:false, status:"accepted",    ai_confidence:0.97 },
  { id:"t7",  field_label:"Base Rent Amount",   field_category:"financial",     is_critical:true,  status:"accepted",    ai_confidence:0.93 },
  { id:"t8",  field_label:"Rent Escalation",    field_category:"financial",     is_critical:false, status:"unresolved",  ai_confidence:0.72 },
  { id:"t9",  field_label:"Security Deposit",   field_category:"financial",     is_critical:false, status:"not_found",   ai_confidence:null },
  { id:"t10", field_label:"Property Address",   field_category:"property",      is_critical:true,  status:"confirmed",   ai_confidence:0.95 },
  { id:"t11", field_label:"Rentable Area (SF)", field_category:"property",      is_critical:true,  status:"unresolved",  ai_confidence:0.89 },
];

const STATUS_CONFIG: Record<FieldStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  confirmed:  { label:"Confirmed",  icon:<CheckCircle2 className="w-3.5 h-3.5" />, cls:"badge-valid" },
  accepted:   { label:"Accepted",   icon:<CheckCircle2 className="w-3.5 h-3.5" />, cls:"badge-valid" },
  corrected:  { label:"Corrected",  icon:<AlertTriangle className="w-3.5 h-3.5" />, cls:"badge-warning" },
  deferred:   { label:"Deferred",   icon:<Clock className="w-3.5 h-3.5" />, cls:"badge-deferred" },
  not_found:  { label:"Not Found",  icon:<XCircle className="w-3.5 h-3.5" />, cls:"badge-uploaded" },
  unresolved: { label:"Unresolved", icon:<AlertCircle className="w-3.5 h-3.5" />, cls:"badge-invalid" },
};

export default function ExtractionTracker() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_TRACKER;
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FieldStatus | "all">("all");

  // TODO: Backend integration required
  const totalFields = 73;
  const disposedCount = TRACKER_FIELDS.filter(f => f.status !== "unresolved").length;
  const criticalTotal = 22;
  const criticalConfirmed = TRACKER_FIELDS.filter(f => f.is_critical && (f.status === "confirmed" || f.status === "accepted")).length;
  const deferredCount = TRACKER_FIELDS.filter(f => f.status === "deferred").length;
  const unresolvedCount = TRACKER_FIELDS.filter(f => f.status === "unresolved").length;
  const canSubmit = disposedCount >= totalFields && criticalConfirmed >= criticalTotal && unresolvedCount === 0;

  const filtered = filter === "all" ? TRACKER_FIELDS : TRACKER_FIELDS.filter(f => f.status === filter);

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <div className="page-header shrink-0">
        <div>
          <h1 className="page-title">Verification Progress Tracker</h1>
          <p className="page-subtitle">Office-Tower-Amendment-3.pdf · JOB-2026-0442</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/extraction/verify")}>
          Back to Workspace
        </Button>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-3 border-b border-border bg-card">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(["all", "unresolved", "confirmed", "accepted", "corrected", "deferred", "not_found"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded text-[12px] font-medium border transition-colors ${filter === s ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s as FieldStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Field table */}
      <div className="flex-1 overflow-auto">
        <table className="data-table w-full text-[13px]">
          <thead>
            <tr>
              <th className="text-left">Field</th>
              <th className="text-left">Category</th>
              <th className="text-left">Critical</th>
              <th className="text-left">AI Confidence</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(field => {
              const cfg = STATUS_CONFIG[field.status];
              return (
                <tr key={field.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate("/extraction/verify")}>
                  <td className="font-medium text-foreground">{field.field_label}</td>
                  <td className="text-muted-foreground capitalize">{field.field_category.replace("_", " ")}</td>
                  <td>
                    {field.is_critical && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--color-lg-critical)" }}>
                        <Shield className="w-3.5 h-3.5" /> Critical
                      </span>
                    )}
                  </td>
                  <td>
                    {field.ai_confidence !== null ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${field.ai_confidence >= 0.90 ? "confidence-high" : field.ai_confidence >= 0.60 ? "confidence-medium" : "confidence-low"}`}>
                        {Math.round(field.ai_confidence * 100)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[12px]">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${cfg.cls}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fixed 64px bottom gate bar */}
      <div className="shrink-0 h-16 border-t border-border bg-card px-6 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-28 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary rounded transition-all" style={{ width: `${(disposedCount / totalFields) * 100}%` }} />
          </div>
          <span className="text-[12px] font-medium text-foreground">
            <strong className="text-primary">{disposedCount}</strong>/{totalFields} Total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-muted rounded overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${(criticalConfirmed / criticalTotal) * 100}%`, backgroundColor: criticalConfirmed >= criticalTotal ? "var(--color-lg-success)" : "var(--color-lg-critical)" }} />
          </div>
          <span className="text-[12px] font-medium" style={{ color: criticalConfirmed >= criticalTotal ? "var(--color-lg-success)" : "var(--color-lg-critical)" }}>
            <strong>{criticalConfirmed}</strong>/{criticalTotal} Critical
          </span>
        </div>
        <span className="text-[12px] font-medium text-[var(--color-lg-warning)]"><strong>{deferredCount}</strong> Deferred</span>
        <span className="text-[12px] font-medium text-[var(--color-lg-error)]"><strong>{unresolvedCount}</strong> Unresolved</span>
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={!canSubmit} className={`gap-2 h-9 ${canSubmit ? "" : "opacity-50 cursor-not-allowed"}`}>
                  Submit for Review <ChevronRight className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            {!canSubmit && (
              <TooltipContent side="top" className="max-w-[260px] text-[12px]">
                <div className="flex flex-col gap-1">
                  {unresolvedCount > 0 && <span>• {unresolvedCount} field{unresolvedCount !== 1 ? "s" : ""} unresolved</span>}
                  {criticalConfirmed < criticalTotal && <span>• {criticalTotal - criticalConfirmed} critical field{criticalTotal - criticalConfirmed !== 1 ? "s" : ""} not confirmed</span>}
                  {disposedCount < totalFields && <span>• {totalFields - disposedCount} field{totalFields - disposedCount !== 1 ? "s" : ""} need disposition</span>}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
