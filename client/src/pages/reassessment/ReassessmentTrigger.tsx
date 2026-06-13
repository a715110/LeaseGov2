/**
 * ReassessmentTrigger — FC-6 Screen 6.2
 * Screen key: reassessment-trigger
 * Route: /reassessment/trigger
 *
 * Prompt 6.2: Dual-path selector (Modification / Reassessment).
 * Lease search typeahead with smart defaults banner.
 * Trigger type grouped dropdown. Date pickers, description textarea,
 * evidence upload. Concurrent case warning banner. Submit primary button.
 *
 * Data model refs: ReassessmentCase (path_type, trigger_type, trigger_date,
 *   detection_date, description, concurrent_case_ids)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, Search, AlertTriangle, Upload, CheckCircle2,
  ChevronDown, FileText, X, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type PathType = "modification" | "reassessment";

const TRIGGER_GROUPS: { group: string; triggers: { value: string; label: string }[] }[] = [
  {
    group: "Modification Triggers",
    triggers: [
      { value:"mod_scope_inc", label:"Modification: Scope Increase" },
      { value:"mod_scope_dec", label:"Modification: Scope Decrease" },
      { value:"mod_term",      label:"Modification: Term Change" },
      { value:"mod_rent",      label:"Modification: Rent Adjustment" },
      { value:"mod_index",     label:"Modification: Index/Rate Change" },
      { value:"compound",      label:"Compound Modification" },
    ],
  },
  {
    group: "Reassessment Triggers",
    triggers: [
      { value:"opt_assess",  label:"Option Exercise Assessment" },
      { value:"rvg_change",  label:"Residual Value Guarantee Change" },
      { value:"pay_change",  label:"Payment Change" },
      { value:"pay_reclass", label:"Payment Reclassification" },
      { value:"class_reass", label:"Lease Classification Reassessment" },
    ],
  },
];

// TODO: Backend integration required — GET /api/records (typeahead)
const MOCK_LEASES = [
  { id:"r1", contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave" },
  { id:"r2", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave" },
  { id:"r3", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd" },
];

// TODO: Backend integration required — GET /api/reassessments/cases?contract_record_id=:id
const MOCK_CONCURRENT = [
  { id:"c1", case_ref:"RC-2026-0012", trigger_type:"opt_assess", status:"assessment_review", assigned:"A. Chen" },
];

export default function ReassessmentTrigger() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_TRIGGER;
  const [, navigate] = useLocation();

  const [pathType, setPathType] = useState<PathType>("modification");
  const [leaseSearch, setLeaseSearch] = useState("");
  const [selectedLease, setSelectedLease] = useState<typeof MOCK_LEASES[0] | null>(null);
  const [showLeaseDropdown, setShowLeaseDropdown] = useState(false);
  const [triggerType, setTriggerType] = useState("");
  const [triggerDate, setTriggerDate] = useState("");
  const [detectionDate, setDetectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const showConcurrentWarning = selectedLease !== null && MOCK_CONCURRENT.length > 0;
  const filteredLeases = MOCK_LEASES.filter(l =>
    l.contract_number.toLowerCase().includes(leaseSearch.toLowerCase()) ||
    l.title.toLowerCase().includes(leaseSearch.toLowerCase())
  );

  const canSubmit = selectedLease && triggerType && triggerDate && description.trim().length >= 10;

  // TODO: Backend integration required — POST /api/reassessments/cases
  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  const pathColors = {
    modification: { border:"var(--color-lg-primary)", bg:"var(--color-lg-accent-subtle)", text:"var(--color-lg-primary)" },
    reassessment: { border:"#7c3aed", bg:"#f5f3ff", text:"#7c3aed" },
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Trigger Report Submitted</p>
          <p className="text-[13px] text-muted-foreground">
            A new reassessment case has been created and is pending classification.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>View Cases</Button>
            <Button onClick={() => navigate("/reassessment/dashboard")}>Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">New Trigger Report</h1>
            <ScreenNumberBadge screenKey="reassessment-trigger" />
          </div>
          <p className="page-subtitle">Report a reassessment or modification event for a contract record</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/reassessment/dashboard")}>Cancel</Button>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-6 max-w-3xl">
        {/* Path selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground">Reassessment Path <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {(["modification","reassessment"] as PathType[]).map(p => (
              <button
                key={p}
                className="flex flex-col gap-1.5 p-4 rounded-lg border-2 text-left transition-all"
                style={{
                  borderColor: pathType === p ? pathColors[p].border : "var(--border)",
                  background:  pathType === p ? pathColors[p].bg : "var(--card)",
                }}
                onClick={() => setPathType(p)}
              >
                <span className="text-[14px] font-bold capitalize" style={{ color: pathType === p ? pathColors[p].text : "var(--foreground)" }}>
                  {p === "modification" ? "Modification Path" : "Reassessment Path"}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {p === "modification" ? "Contractual change requiring remeasurement" : "Exercise probability re-evaluation only"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lease search */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[13px] font-semibold text-foreground">Contract Record <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
          {selectedLease ? (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-lg border"
              style={{ background:"var(--color-lg-success-subtle)", borderColor:"var(--color-lg-success)" }}
            >
              <div>
                <p className="text-[13px] font-semibold text-foreground">{selectedLease.contract_number}</p>
                <p className="text-[12px] text-muted-foreground">{selectedLease.title}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedLease(null); setLeaseSearch(""); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by contract number or title…"
                value={leaseSearch}
                onChange={e => { setLeaseSearch(e.target.value); setShowLeaseDropdown(true); }}
                onFocus={() => setShowLeaseDropdown(true)}
                onBlur={() => setTimeout(() => setShowLeaseDropdown(false), 150)}
              />
              {showLeaseDropdown && filteredLeases.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {filteredLeases.map(l => (
                    <button
                      key={l.id}
                      className="w-full flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/30 text-left"
                      onMouseDown={() => { setSelectedLease(l); setLeaseSearch(""); setShowLeaseDropdown(false); }}
                    >
                      <span className="text-[13px] font-semibold text-foreground">{l.contract_number}</span>
                      <span className="text-[12px] text-muted-foreground">{l.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Concurrent case warning */}
        {showConcurrentWarning && (
          <div
            className="rounded-lg border-l-4 px-4 py-3 flex items-start gap-3"
            style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
            <div className="flex-1">
              <p className="text-[13px] font-semibold" style={{ color:"var(--color-lg-warning)" }}>
                {MOCK_CONCURRENT.length} concurrent case{MOCK_CONCURRENT.length > 1 ? "s" : ""} detected on this record
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {MOCK_CONCURRENT.map(c => (
                  <div key={c.id} className="flex items-center gap-3 text-[12px] text-muted-foreground">
                    <span className="font-mono">{c.case_ref}</span>
                    <span>·</span>
                    <span>{c.trigger_type.replace(/_/g, " ")}</span>
                    <span>·</span>
                    <span>{c.status.replace(/_/g, " ")}</span>
                    <span>·</span>
                    <span>{c.assigned}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trigger type */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground">Trigger Type <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-3 pr-8 py-2.5 text-[13px] border border-border rounded-lg bg-background focus:outline-none"
              value={triggerType}
              onChange={e => setTriggerType(e.target.value)}
            >
              <option value="">Select trigger type…</option>
              {TRIGGER_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.triggers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground">Trigger Date <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
            <Input type="date" value={triggerDate} onChange={e => setTriggerDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-foreground">Detection Date</label>
            <Input type="date" value={detectionDate} onChange={e => setDetectionDate(e.target.value)} />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground">Description <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
          <Textarea
            placeholder="Describe the triggering event in detail (minimum 10 characters)…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="resize-none text-[13px]"
          />
        </div>

        {/* Evidence upload */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground">Supporting Evidence <span className="text-muted-foreground font-normal">(optional)</span></label>
          <div
            className="border-2 border-dashed rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/10 transition-colors"
            onClick={() => document.getElementById("trigger-evidence-input")?.click()}
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <p className="text-[13px] text-muted-foreground">Drop files or click to browse</p>
            <input
              id="trigger-evidence-input"
              type="file"
              multiple
              className="hidden"
              onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
            />
          </div>
          {files.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart defaults info */}
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3" style={{ background:"var(--color-lg-success-subtle)", borderColor:"var(--color-lg-success)" }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[12px]" style={{ color:"var(--color-lg-success)" }}>
            <strong>Smart defaults:</strong> Workspace, automation level, and assigned preparer will be inherited from the selected contract record.
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate("/reassessment/dashboard")}>Cancel</Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>Submit Trigger Report</Button>
        </div>
      </div>
    </div>
  );
}
