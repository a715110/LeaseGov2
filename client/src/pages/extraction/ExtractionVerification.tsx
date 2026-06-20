/**
 * ExtractionVerification — FC-2 Screens 2.6 + 2.7
 * Screen key: extraction-verification
 * Route: /extraction/verify
 * Role: Reviewer
 *
 * Design: Structured Authority
 * Prompt 2.6 + 2.7: Split-screen verification workspace.
 *   Left 50%: Rework rejection banner (when rework_iteration > 0),
 *     duplicate detection banner, fields with disposition dropdowns
 *     (Accepted/Corrected/Not Found/Deferred — Deferred hidden for critical),
 *     Deferred requires justification textarea, critical fields show Confirm button.
 *   Right 50%: PDF with anchor overlays, selected anchor highlighted.
 *   Bottom bar (64px fixed): progress gate — Total/Critical/Deferred/Unresolved,
 *     Submit disabled until all mock fields disposed + all critical confirmed + 0 unresolved.
 *   Automation variants annotated.
 * Data model refs: ExtractionRecord, ExtractionField (disposition, is_critical,
 *   ai_confidence, rework_flagged), EvidenceAnchor
 */

import { useState, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from 'sonner';
import { publishEvent } from '@/lib/eventBus';
import { useRole } from '@/contexts/RoleContext';
import { ContractCheckpointCard } from '@/components/checkpoints/ContractCheckpointCard';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  Shield, CheckCircle2, AlertTriangle, Link2, Link2Off,
  ChevronDown, ChevronUp, ZoomIn, ZoomOut, Layers,
  FileText, ChevronRight, AlertCircle, Copy, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type Disposition = "accepted" | "corrected" | "not_found" | "deferred" | null;
type AnchorStatus = "confirmed" | "proposed" | "missing";

interface VerificationField {
  id: string;
  field_label: string;
  field_category: string;
  is_critical: boolean;
  ai_confidence: number | null;
  ai_extracted_value: string | null;
  preparer_value: string | null;
  disposition: Disposition;
  deferred_justification: string;
  anchor_status: AnchorStatus;
  confirmed: boolean;
  rework_flagged: boolean;
}

// TODO: Backend integration required — GET /api/extraction-records/:id/fields
const INITIAL_FIELDS: VerificationField[] = [
  { id:"v1",  field_label:"Record Label",       field_category:"core_metadata", is_critical:false, ai_confidence:0.96, ai_extracted_value:"Office Tower Amendment 3",  preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v2",  field_label:"Contract Type",      field_category:"core_metadata", is_critical:false, ai_confidence:0.94, ai_extracted_value:"Property Lease",            preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v3",  field_label:"Execution Date",     field_category:"core_metadata", is_critical:true,  ai_confidence:0.91, ai_extracted_value:"March 15, 2026",            preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v4",  field_label:"Commencement Date",  field_category:"core_metadata", is_critical:true,  ai_confidence:0.88, ai_extracted_value:"April 1, 2026",             preparer_value:"April 1, 2026",       disposition:"corrected", deferred_justification:"", anchor_status:"proposed",  confirmed:false, rework_flagged:false },
  { id:"v5",  field_label:"Expiration Date",    field_category:"core_metadata", is_critical:true,  ai_confidence:null, ai_extracted_value:null,                        preparer_value:null,                  disposition:null,        deferred_justification:"", anchor_status:"missing",   confirmed:false, rework_flagged:true  },
  { id:"v6",  field_label:"Amendment Number",   field_category:"core_metadata", is_critical:false, ai_confidence:0.97, ai_extracted_value:"3",                         preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v7",  field_label:"Base Rent Amount",   field_category:"financial",     is_critical:true,  ai_confidence:0.93, ai_extracted_value:"$42,500/month",             preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v8",  field_label:"Rent Escalation",    field_category:"financial",     is_critical:false, ai_confidence:0.72, ai_extracted_value:"3% annual",                 preparer_value:null,                  disposition:null,        deferred_justification:"", anchor_status:"proposed",  confirmed:false, rework_flagged:false },
  { id:"v9",  field_label:"Security Deposit",   field_category:"financial",     is_critical:false, ai_confidence:null, ai_extracted_value:null,                        preparer_value:null,                  disposition:"not_found", deferred_justification:"", anchor_status:"missing",   confirmed:false, rework_flagged:false },
  { id:"v10", field_label:"Property Address",   field_category:"property",      is_critical:true,  ai_confidence:0.95, ai_extracted_value:"350 Fifth Ave, New York",   preparer_value:null,                  disposition:"accepted",  deferred_justification:"", anchor_status:"confirmed", confirmed:false, rework_flagged:false },
  { id:"v11", field_label:"Rentable Area (SF)", field_category:"property",      is_critical:true,  ai_confidence:0.89, ai_extracted_value:"24,500 SF",                 preparer_value:null,                  disposition:null,        deferred_justification:"", anchor_status:"proposed",  confirmed:false, rework_flagged:false },
];

const CATEGORIES = ["core_metadata", "financial", "property"];
const CATEGORY_LABELS: Record<string, string> = { core_metadata:"Core Metadata", financial:"Financial", property:"Property" };

function getConfidenceClass(c: number | null, threshold = 90) {
  if (c === null) return "confidence-low";
  if (c * 100 >= threshold) return "confidence-high";
  if (c >= 0.60) return "confidence-medium";
  return "confidence-low";
}

// ─── Field history tooltip ──────────────────────────────────────────────────

interface FieldHistoryEntry {
  actor: 'AI' | 'Preparer' | 'Reviewer';
  value: string | null;
  note?: string;
  timestamp?: string;
}

const ACTOR_COLOURS: Record<FieldHistoryEntry['actor'], string> = {
  AI: 'bg-blue-100 text-blue-700',
  Preparer: 'bg-amber-100 text-amber-700',
  Reviewer: 'bg-emerald-100 text-emerald-700',
};

function getVerificationFieldHistory(field: VerificationField): FieldHistoryEntry[] {
  const history: FieldHistoryEntry[] = [];
  history.push({
    actor: 'AI',
    value: field.ai_extracted_value,
    note: field.ai_confidence !== null ? `${Math.round(field.ai_confidence * 100)}% confidence` : 'Not extracted',
    timestamp: '09:15',
  });
  if (field.preparer_value !== null || field.disposition) {
    history.push({
      actor: 'Preparer',
      value: field.preparer_value ?? field.ai_extracted_value,
      note: field.disposition ? `Marked as ${field.disposition.replace('_', ' ')}` : undefined,
      timestamp: '09:47',
    });
  }
  return history;
}

function VerificationFieldHistoryTooltip({ field }: { field: VerificationField }) {
  const history = getVerificationFieldHistory(field);
  if (history.length === 0) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground text-[9px] font-bold transition-colors"
            onClick={e => e.stopPropagation()}
            aria-label="Field history"
          >
            H
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0 max-w-[260px]" align="start">
          <div className="p-3">
            <p className="text-[11px] font-semibold text-foreground mb-2">Field History</p>
            <div className="flex flex-col gap-2">
              {history.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${ACTOR_COLOURS[entry.actor]}`}>
                    {entry.actor}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground truncate">{entry.value ?? 'Not extracted'}</p>
                    {entry.note && <p className="text-[10px] text-muted-foreground">{entry.note}</p>}
                  </div>
                  {entry.timestamp && <span className="text-[10px] text-muted-foreground shrink-0">{entry.timestamp}</span>}
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Amendment callout ───────────────────────────────────────────────────────

const VERIFICATION_AMENDMENT_PATTERNS = /amend|amendment|addendum|addenda|rider|supplement|modification/i;

/**
 * Detects amendment-type file names from nav state or falls back to the demo file name.
 * Returns the list of matched file names (may be empty).
 */
function getVerificationAmendmentFiles(): string[] {
  const stateFiles = (window.history.state as { amendmentFiles?: string[] } | null)?.amendmentFiles;
  if (stateFiles && stateFiles.length > 0) return stateFiles;
  // Fallback: the demo document is an amendment — always show the callout in demo mode
  const demoFile = 'Office-Tower-Amendment-3.pdf';
  return VERIFICATION_AMENDMENT_PATTERNS.test(demoFile) ? [demoFile] : [];
}

/**
 * Amber callout shown at the top of the Verification Workspace when the job
 * being reviewed contains an amendment file. Mirrors the AiWorkspace banner —
 * rent/dates/area guidance for the Reviewer role.
 */
function VerificationAmendmentBanner({ amendmentFiles }: { amendmentFiles: string[] }) {
  if (amendmentFiles.length === 0) return null;
  const fileList = amendmentFiles.join(', ');
  return (
    <div className="shrink-0 flex items-start gap-2.5 px-6 py-3 border-b border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
          Amendment detected — verify superseded fields before approving
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-medium">File{amendmentFiles.length > 1 ? 's' : ''}:</span>{' '}
          <span className="font-mono">{fileList}</span>
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
          Pay close attention to <strong>rent</strong>, <strong>dates</strong>, and <strong>area</strong> fields — these are most commonly superseded by amendments. Reject if any extracted value conflicts with the amendment text.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExtractionVerification() {

  const [, navigate] = useLocation();
  const search = useSearch();
  const { activeRole } = useRole();
  // Amendment files from nav state (set by ExtractionAiWorkspace or ExtractionQueue)
  // Falls back to demo file detection so the callout is always visible in demo mode.
  const amendmentFiles = useMemo(() => getVerificationAmendmentFiles(), []);

  // S8: ?from= back navigation; ?record= contract context from AgentCheckpointQueue
  const backDestination = useMemo(() => {
    const params = new URLSearchParams(search);
    const from = params.get('from');
    const record = params.get('record');
    if (from === 'workspace') return { path: record ? `/extraction/ai?record=${encodeURIComponent(record)}` : '/extraction/ai', label: 'AI Workspace' };
    if (from === 'queue')     return { path: '/extraction/queue', label: 'Processing Queue' };
    // Arrived from AgentCheckpointQueue via ?record=
    if (record)               return { path: '/approvals/checkpoints', label: 'Checkpoint Queue' };
    return { path: '/extraction/ai', label: 'AI Workspace' };
  }, [search]);

  const _screenKey = SCREEN_KEYS.EXTRACTION_VERIFICATION;
  const [fields, setFields] = useState<VerificationField[]>(INITIAL_FIELDS);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["core_metadata"]));
  const [activeFieldId, setActiveFieldId] = useState("v1");
  const [zoom, setZoom] = useState(100);
  const [heatmap, setHeatmap] = useState(false);
  const isRework = false; // set true to show rejection banner

  // Dynamic: gate against the loaded mock set, not the full schema count
  const totalFields = fields.length;
  const disposedCount = fields.filter(f => f.disposition !== null).length;
  const criticalTotal = fields.filter(f => f.is_critical).length;
  const criticalConfirmed = fields.filter(f => f.is_critical && f.confirmed).length;
  const deferredCount = fields.filter(f => f.disposition === "deferred").length;
  const unresolvedCount = fields.filter(f => f.disposition === null).length;
  const canSubmit = disposedCount >= totalFields && criticalConfirmed >= criticalTotal && unresolvedCount === 0;

  function toggleCat(cat: string) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }

  function setDisposition(id: string, disposition: Disposition) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, disposition } : f));
  }

  function setJustification(id: string, text: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, deferred_justification: text } : f));
  }

  function confirmCritical(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, confirmed: true } : f));
  }

  // ─── Automation level ──────────────────────────────────────────────────────
  // Prefer ?record= param (set by AgentCheckpointQueue) over the static fallback
  const contractRecordId = useMemo(() => new URLSearchParams(search).get('record') ?? 'r1', [search]);
  const automationLevel = 'collaborative' as const; // TODO: from contractRecord?.automation_level
  const isCollaborative = automationLevel === 'collaborative';

  const { activeCheckpoint } = useCheckpoints(contractRecordId, {
    checkpointType: 'extraction_review',
  });

  // ─── Confidence threshold (shared with AI Workspace via localStorage) ───────────────
  const THRESHOLD_KEY = 'leasegov_confidence_threshold';
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(() => {
    const stored = localStorage.getItem(THRESHOLD_KEY);
    return stored ? Number(stored) : 90;
  });
  const handleThresholdChange = useCallback((val: number[]) => {
    const v = val[0];
    setConfidenceThreshold(v);
    localStorage.setItem(THRESHOLD_KEY, String(v));
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <div className="page-header shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backDestination.path)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={`Back to ${backDestination.label}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Verification Workspace</h1>
              <ScreenNumberBadge screenKey="extraction-verification" />
            </div>
            <p className="page-subtitle">Office-Tower-Amendment-3.pdf · JOB-2026-0442</p>
          </div>
        </div>
      </div>

      {/* FC-9: Checkpoint card — collaborative mode */}
      {isCollaborative && activeCheckpoint && (
        <div className="shrink-0">
          <ContractCheckpointCard
            checkpoint={activeCheckpoint}
            onApprove={() => {}}
            onModify={() => {}}
            onReject={() => {}}
          />
        </div>
      )}

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      {/* Amendment callout — shown when the job contains an amendment/addendum file */}
      <VerificationAmendmentBanner amendmentFiles={amendmentFiles} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col overflow-hidden" style={{ width: "50%", borderRight: "1px solid var(--border)" }}>

          {/* Rework rejection banner */}
          {isRework && (
            <div className="shrink-0 flex items-start gap-3 px-5 py-3 bg-red-50 border-b-2 border-destructive text-[13px] text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Returned for Rework</strong> — Reviewer rejected on 2026-05-14.
                <span className="ml-2 text-muted-foreground">Reason: Base rent amount requires re-verification against executed amendment.</span>
              </div>
            </div>
          )}

          {/* Duplicate detection banner */}
          <div className="shrink-0 flex items-start gap-3 px-5 py-3 bg-accent border-b border-border text-[13px] text-primary">
            <Copy className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Duplicate Detection:</strong> Field values for "Base Rent Amount" and "Property Address" match an existing record.
              <button className="ml-2 underline hover:no-underline">Review</button>
            </span>
          </div>

          {/* Category accordions */}
          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map(cat => {
              const catFields = fields.filter(f => f.field_category === cat);
              const isOpen = expandedCats.has(cat);
              return (
                <div key={cat} className="border-b border-border">
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className="text-[13px] font-semibold text-foreground">{CATEGORY_LABELS[cat]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{catFields.length} fields</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-border/50">
                      {catFields.map(field => (
                        <div
                          key={field.id}
                          onClick={() => setActiveFieldId(field.id)}
                          className={`flex flex-col gap-2 px-4 py-3 cursor-pointer transition-colors border-l-[3px] ${field.is_critical ? "border-l-[var(--color-lg-critical)]" : "border-l-transparent"} ${activeFieldId === field.id ? "bg-accent/60" : "hover:bg-muted/30"}`}
                        >
                          <div className="flex items-center gap-2">
                            {field.is_critical && <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-lg-critical)" }} aria-label="Critical Field — Cannot be deferred" />}
                            <span className="text-[13px] font-medium text-foreground flex-1">{field.field_label}</span>
                            {field.ai_confidence !== null && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${getConfidenceClass(field.ai_confidence, confidenceThreshold)}`}>
                                {Math.round(field.ai_confidence * 100)}%
                              </span>
                            )}
                            {field.anchor_status === "confirmed" && <Link2 className="w-3.5 h-3.5 text-[var(--color-lg-success)]" />}
                            {field.anchor_status === "proposed"  && <Link2 className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" />}
                            {field.anchor_status === "missing"   && <Link2Off className="w-3.5 h-3.5 text-[var(--color-lg-error)]" />}
                            <VerificationFieldHistoryTooltip field={field} />
                          </div>

                          {/* Before/after for corrected */}
                          {field.disposition === "corrected" && field.preparer_value && (
                            <div className="flex items-center gap-2 text-[12px]">
                              <span className="text-muted-foreground line-through">{field.ai_extracted_value}</span>
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground font-medium">{field.preparer_value}</span>
                            </div>
                          )}
                          {field.disposition !== "corrected" && field.ai_extracted_value && (
                            <p className="text-[12px] text-muted-foreground">{field.ai_extracted_value}</p>
                          )}
                          {!field.ai_extracted_value && <p className="text-[12px] text-muted-foreground italic">Not extracted</p>}

                          {/* Disposition selector */}
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Select
                              value={field.disposition ?? ""}
                              onValueChange={v => setDisposition(field.id, v as Disposition)}
                            >
                              <SelectTrigger className="h-7 text-[12px] flex-1">
                                <SelectValue placeholder="Set disposition…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accepted"  className="text-[12px]">Accepted</SelectItem>
                                <SelectItem value="corrected" className="text-[12px]">Corrected</SelectItem>
                                <SelectItem value="not_found" className="text-[12px]">Not Found</SelectItem>
                                {/* Deferred hidden for critical fields */}
                                {!field.is_critical && (
                                  <SelectItem value="deferred" className="text-[12px]">Deferred</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {field.is_critical && !field.confirmed && field.disposition === "accepted" && (
                              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[var(--color-lg-critical)] text-[var(--color-lg-critical)] hover:bg-amber-50 shrink-0" onClick={() => confirmCritical(field.id)}>
                                Confirm
                              </Button>
                            )}
                            {field.is_critical && field.confirmed && <CheckCircle2 className="w-4 h-4 text-[var(--color-lg-success)] shrink-0" />}
                          </div>

                          {/* Deferred justification */}
                          {field.disposition === "deferred" && (
                            <Textarea
                              value={field.deferred_justification}
                              onChange={e => setJustification(field.id, e.target.value)}
                              placeholder="Required: enter justification for deferral…"
                              className="text-[12px] min-h-[60px] resize-none"
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — PDF viewer */}
        <div className="flex flex-col" style={{ width: "50%" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[12px] font-medium text-foreground">Office-Tower-Amendment-3.pdf</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHeatmap(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium border transition-colors ${heatmap ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                <Layers className="w-3.5 h-3.5" /> Heatmap
              </button>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="font-mono text-[12px] text-muted-foreground w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-auto">
            <div className="relative bg-white border border-border shadow-md rounded" style={{ width: `${zoom * 3.5}px`, maxWidth: "100%", minHeight: "500px", transition: "width 0.15s ease" }}>
              {heatmap && <div className="absolute inset-0 rounded pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(46,117,182,0.12) 0%, rgba(245,127,23,0.08) 60%, rgba(198,40,40,0.15) 100%)" }} />}
              {/* Active anchor highlight */}
              <div className="absolute border-2 rounded" style={{ top:"18%", left:"12%", width:"60%", height:"4%", borderColor:"var(--color-lg-primary-light)", background:"rgba(46,117,182,0.08)", boxShadow:"0 0 0 3px rgba(46,117,182,0.25)" }} />
              <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-[13px] font-medium">PDF Preview</p>
                  <p className="text-[11px] mt-1 opacity-60">Renders after backend integration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed 64px bottom gate bar */}
      <div className="shrink-0 h-16 border-t border-border bg-card px-6 flex items-center gap-6">
        {/* Confidence threshold slider */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 pr-5 border-r border-border">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Threshold</span>
                <Slider
                  min={50}
                  max={99}
                  step={1}
                  value={[confidenceThreshold]}
                  onValueChange={handleThresholdChange}
                  className="w-20"
                  aria-label="Confidence threshold"
                />
                <span className="font-mono text-[12px] font-semibold text-foreground w-8 text-right">{confidenceThreshold}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] max-w-[220px]">
              Fields below this confidence level are highlighted as low confidence. Shared with AI Workspace.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-24 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary rounded transition-all" style={{ width: `${(disposedCount / totalFields) * 100}%` }} />
          </div>
          <span className="text-[12px] font-medium text-foreground">
            <strong className="text-primary">{disposedCount}</strong>/{totalFields} Total
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-20 bg-muted rounded overflow-hidden">
            <div className="h-full rounded transition-all" style={{ width: `${criticalTotal > 0 ? (criticalConfirmed / criticalTotal) * 100 : 0}%`, backgroundColor: "var(--color-lg-critical)" }} />
          </div>
          <span className="text-[12px] font-medium" style={{ color: "var(--color-lg-critical)" }}>
            <strong>{criticalConfirmed}</strong>/{criticalTotal} Critical
          </span>
        </div>
        <span className="text-[12px] font-medium text-[var(--color-lg-warning)]">
          <strong>{deferredCount}</strong> Deferred
        </span>
        <span className="text-[12px] font-medium text-[var(--color-lg-error)]">
          <strong>{unresolvedCount}</strong> Unresolved
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/extraction/reprocess")}>Request Re-processing</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  disabled={!canSubmit}
                  className="gap-2 h-9"
                  onClick={() => {
                    publishEvent({
                      type: 'SUBMIT_FOR_REVIEW',
                      payload: { contractRecordId },
                      sourceRole: activeRole,
                    });
                    toast.success('Submitted for review — notifying Reviewer', {
                      duration: 3000,
                    });
                    navigate('/approvals/queue');
                  }}
                >
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
