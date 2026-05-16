/**
 * ExportStaging — FC-7 Screen 7.2
 * Screen key: export-staging
 * Route: /export/staging
 *
 * Prompt 7.2: Triple-view staging screen.
 * LEFT 33%: Generated export file preview (Excel cell grid with highlighted cells).
 * CENTER 34%: Field mapping table (Template Field · Extracted Value · Source ·
 *   Confidence · Disposition). Critical fields with shield icon. Deferred amber bg.
 * RIGHT 33%: Original lease PDF viewer with EvidenceAnchor overlays.
 * Bottom: "Proceed to Pre-Flight" button — disabled if critical fields unmapped.
 *
 * Data model refs: TemplateField, TemplateMapping, ExtractionField,
 *   EvidenceAnchor, UploadTask (template_version_locked)
 *
 * NOTE: This component is designed to be reusable as a standalone panel
 * for FC-8 template management (AdminTemplates.tsx) — extract to
 * components/export/TripleViewStaging.tsx when FC-8 is built.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, AlertTriangle, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

type Disposition = "confirmed" | "deferred" | "overridden" | "pending";

interface MappingRow {
  id: string;
  tab: string;
  cell_ref: string;
  display_label: string;
  extracted_value: string;
  source: string;
  confidence: number | null;
  disposition: Disposition;
  is_critical: boolean;
  is_deferred: boolean;
  anchor_page: number;
}

// TODO: Backend integration required — GET /api/export/tasks/:id/staging
const TABS = ["Cover Sheet", "Lease Terms", "Financial Summary", "Option Schedule", "Attestation"];

const MOCK_MAPPINGS: MappingRow[] = [
  { id:"f1",  tab:"Cover Sheet",      cell_ref:"B2",  display_label:"Commencement Date",         extracted_value:"2024-01-01",      source:"direct",    confidence:0.98, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:2 },
  { id:"f2",  tab:"Cover Sheet",      cell_ref:"B3",  display_label:"Expiration Date",            extracted_value:"2034-12-31",      source:"direct",    confidence:0.97, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:2 },
  { id:"f3",  tab:"Cover Sheet",      cell_ref:"B4",  display_label:"Tenant Legal Name",          extracted_value:"Acme Corp LLC",   source:"direct",    confidence:0.99, disposition:"confirmed", is_critical:false, is_deferred:false, anchor_page:1 },
  { id:"f4",  tab:"Cover Sheet",      cell_ref:"B5",  display_label:"Landlord Legal Name",        extracted_value:"Park Ave Realty", source:"direct",    confidence:0.96, disposition:"confirmed", is_critical:false, is_deferred:false, anchor_page:1 },
  { id:"f5",  tab:"Lease Terms",      cell_ref:"C2",  display_label:"Base Rent (Annual)",         extracted_value:"$2,400,000",      source:"computed",  confidence:0.94, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:4 },
  { id:"f6",  tab:"Lease Terms",      cell_ref:"C3",  display_label:"CPI Escalation Rate",        extracted_value:"3.00%",           source:"direct",    confidence:0.91, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:5 },
  { id:"f7",  tab:"Lease Terms",      cell_ref:"C4",  display_label:"Security Deposit",           extracted_value:"$200,000",        source:"direct",    confidence:0.88, disposition:"confirmed", is_critical:false, is_deferred:false, anchor_page:6 },
  { id:"f8",  tab:"Lease Terms",      cell_ref:"C5",  display_label:"Renewal Option Term",        extracted_value:"",                source:"—",         confidence:null, disposition:"deferred",  is_critical:true,  is_deferred:true,  anchor_page:8 },
  { id:"f9",  tab:"Financial Summary",cell_ref:"D2",  display_label:"Lease Liability (PV)",       extracted_value:"$18,420,000",     source:"computed",  confidence:null, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:0 },
  { id:"f10", tab:"Financial Summary",cell_ref:"D3",  display_label:"ROU Asset",                  extracted_value:"$18,420,000",     source:"computed",  confidence:null, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:0 },
  { id:"f11", tab:"Financial Summary",cell_ref:"D4",  display_label:"IBR Rate",                   extracted_value:"4.25%",           source:"direct",    confidence:0.95, disposition:"confirmed", is_critical:true,  is_deferred:false, anchor_page:3 },
  { id:"f12", tab:"Option Schedule",  cell_ref:"E2",  display_label:"Option 1 Exercise Deadline", extracted_value:"",                source:"—",         confidence:null, disposition:"pending",   is_critical:false, is_deferred:false, anchor_page:9 },
];

const DISPOSITION_BADGE: Record<Disposition, { label: string; cls: string }> = {
  confirmed: { label:"Confirmed", cls:"badge-valid" },
  deferred:  { label:"Deferred",  cls:"badge-warning" },
  overridden:{ label:"Override",  cls:"badge-deferred" },
  pending:   { label:"Pending",   cls:"badge-muted" },
};

const CONF_COLOR = (c: number | null) => {
  if (c === null) return "text-muted-foreground";
  if (c >= 0.90) return "text-[var(--color-lg-success)]";
  if (c >= 0.75) return "text-[var(--color-lg-warning)]";
  return "text-[var(--color-lg-error)]";
};

// Simulated Excel cell grid for the left panel
const EXCEL_CELLS: { ref: string; label: string; value: string; highlighted?: boolean; warning?: boolean }[] = [
  { ref:"A1", label:"Field",               value:"",                 },
  { ref:"B1", label:"Value",               value:"",                 },
  { ref:"A2", label:"Commencement Date",   value:"",                 },
  { ref:"B2", label:"",                    value:"2024-01-01",       highlighted:true },
  { ref:"A3", label:"Expiration Date",     value:"",                 },
  { ref:"B3", label:"",                    value:"2034-12-31",       highlighted:true },
  { ref:"A4", label:"Tenant Legal Name",   value:"",                 },
  { ref:"B4", label:"",                    value:"Acme Corp LLC",    highlighted:true },
  { ref:"A5", label:"Landlord Legal Name", value:"",                 },
  { ref:"B5", label:"",                    value:"Park Ave Realty",  highlighted:true },
  { ref:"A6", label:"Renewal Option Term", value:"",                 },
  { ref:"B6", label:"",                    value:"[DEFERRED]",       warning:true },
];

export default function ExportStaging() {
  const _screenKey = SCREEN_KEYS.EXPORT_STAGING;
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState("Cover Sheet");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const tabMappings = MOCK_MAPPINGS.filter(m => m.tab === activeTab);
  const unmappedCritical = MOCK_MAPPINGS.filter(m => m.is_critical && (m.disposition === "pending" || (m.is_deferred && m.disposition === "deferred"))).length;

  // Template version lock info
  const templateVersion: string = "3.2";
  const latestVersion: string = "3.3"; // simulated newer version
  const versionOutdated = latestVersion !== templateVersion;

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Export Staging</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-[12px] text-muted-foreground">UT-2026-0041</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">New Lease Onboarding</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-muted">
              Template v{templateVersion} — locked at task creation
            </span>
            {versionOutdated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-warning">
                <AlertTriangle className="w-3 h-3" />
                Newer version v{latestVersion} exists
              </span>
            )}
          </div>
        </div>
        {/* FC-9: AutomationPolicyBadge */}
        <AutomationPolicyBadge level="collaborative" size="sm" />
      </div>

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      {/* Triple-view panels */}
      <div className="flex-1 flex overflow-hidden mx-6 mb-0 gap-3 min-h-[600px]">
        {/* LEFT: Export file preview */}
        <div className="w-[33%] flex flex-col bg-card border border-border rounded-t-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12px] font-semibold text-foreground">Export Preview</span>
            <span className="ml-auto text-[11px] text-muted-foreground">CR-2026-0041_Export.xlsx</span>
          </div>
          {/* Tab selector */}
          <div className="flex overflow-x-auto border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 text-[11px] font-medium whitespace-nowrap border-r border-border transition-colors"
                style={{
                  background: activeTab === tab ? "var(--color-lg-primary)" : "transparent",
                  color: activeTab === tab ? "white" : "var(--color-muted-foreground)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Excel grid */}
          <div className="flex-1 overflow-auto p-3">
            <table className="w-full text-[11px] border-collapse">
              <tbody>
                {EXCEL_CELLS.map((cell, i) => (
                  <tr key={i}>
                    <td className="border border-border px-2 py-1 bg-muted/30 font-semibold text-muted-foreground w-[40%]">{cell.label || cell.ref}</td>
                    <td
                      className="border border-border px-2 py-1 font-mono"
                      style={{
                        background: cell.warning ? "var(--color-lg-warning-subtle)" : cell.highlighted ? "rgba(var(--color-lg-primary-rgb, 59,130,246),0.08)" : undefined,
                        color: cell.warning ? "var(--color-lg-warning)" : cell.highlighted ? "var(--color-lg-primary)" : undefined,
                        fontWeight: cell.highlighted ? 600 : undefined,
                      }}
                    >
                      {cell.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CENTER: Field mapping table */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-t-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">Field Mapping</span>
            <span className="ml-auto text-[11px] text-muted-foreground">{activeTab}</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="data-table w-full text-[11px]">
              <thead>
                <tr>
                  <th className="text-left">Field</th>
                  <th className="text-left">Value</th>
                  <th className="text-left">Source</th>
                  <th className="text-left">Conf.</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tabMappings.map(row => {
                  const badge = DISPOSITION_BADGE[row.disposition];
                  const isActive = selectedRow === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(isActive ? null : row.id)}
                      className="cursor-pointer"
                      style={{
                        background: row.is_deferred
                          ? "var(--color-lg-warning-subtle)"
                          : isActive
                          ? "rgba(var(--color-lg-primary-rgb,59,130,246),0.06)"
                          : undefined,
                      }}
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          {row.is_critical && <Shield className="w-3 h-3 shrink-0" style={{ color:"var(--color-lg-warning)" }} />}
                          <span className="font-medium text-foreground">{row.display_label}</span>
                        </div>
                        <span className="text-muted-foreground font-mono">{row.cell_ref}</span>
                      </td>
                      <td className="font-mono text-foreground max-w-[120px] truncate">{row.extracted_value || <span className="text-muted-foreground italic">—</span>}</td>
                      <td className="capitalize text-muted-foreground">{row.source}</td>
                      <td className={`font-semibold ${CONF_COLOR(row.confidence)}`}>
                        {row.confidence !== null ? `${Math.round(row.confidence * 100)}%` : "—"}
                      </td>
                      <td><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: PDF viewer placeholder */}
        <div className="w-[33%] flex flex-col bg-card border border-border rounded-t-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12px] font-semibold text-foreground">Source Document</span>
            {selectedRow && (
              <span className="ml-auto text-[11px] text-muted-foreground">
                Page {MOCK_MAPPINGS.find(m => m.id === selectedRow)?.anchor_page || "—"}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-muted/10 p-4">
            {/* PDF viewer placeholder — same pattern as ExtractionAiWorkspace */}
            <div className="w-full h-full bg-muted/20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 min-h-[400px]">
              <FileText className="w-10 h-10 text-muted-foreground" />
              <p className="text-[12px] font-semibold text-muted-foreground">PDF Viewer</p>
              <p className="text-[11px] text-muted-foreground text-center px-4">
                {selectedRow
                  ? `Showing page ${MOCK_MAPPINGS.find(m => m.id === selectedRow)?.anchor_page} with EvidenceAnchor overlay`
                  : "Click a mapping row to jump to the source anchor page"}
              </p>
              {selectedRow && (
                <div className="mt-2 px-3 py-1.5 rounded border border-border bg-card text-[11px] text-muted-foreground">
                  Anchor: {MOCK_MAPPINGS.find(m => m.id === selectedRow)?.display_label}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="mx-6 mb-6 bg-card border border-t-0 border-border rounded-b-lg px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12px]">
          {unmappedCritical > 0 ? (
            <span className="flex items-center gap-1.5 text-[var(--color-lg-error)]">
              <AlertTriangle className="w-4 h-4" />
              {unmappedCritical} critical field{unmappedCritical !== 1 ? "s" : ""} unmapped — cannot proceed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--color-lg-success)]">
              <CheckCircle2 className="w-4 h-4" />
              All critical fields mapped
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/export/templates")}>Back</Button>
          <Button
            disabled={unmappedCritical > 0}
            onClick={() => navigate("/export/preflight")}
            className="gap-1.5"
          >
            Proceed to Pre-Flight <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
