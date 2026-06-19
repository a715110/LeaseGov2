/**
 * ExtractionAiWorkspace — FC-2 Screen 2.4
 * Screen key: extraction-ai-workspace
 * Route: /extraction/ai
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.4: Split-screen AI-assisted extraction workspace.
 *   Left 50%: Summary bar, automation panel (collapsible), category accordions,
 *             critical fields (3px warning border + shield icon + Confirm button),
 *             normal fields (confidence badge + anchor status).
 *   Right 50%: PDF viewer placeholder, zoom, heatmap toggle, anchor bbox overlay.
 *   Bottom: Continue to Verification.
 * Data model refs: ExtractionRecord, ExtractionField (is_critical, ai_confidence,
 *                  disposition, evidence_anchor_id), EvidenceAnchor
 */

import { useState, useMemo, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ContractAgentProgressPanel } from '@/components/agents/ContractAgentProgressPanel';
import { ContractCheckpointCard } from '@/components/checkpoints/ContractCheckpointCard';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { InterventionButton } from '@/components/automation/InterventionButton';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { LeaseManualTaskCard } from '@/components/automation/LeaseManualTaskCard';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  Shield, CheckCircle2, AlertTriangle, Link2, Link2Off,
  ChevronDown, ChevronUp, ZoomIn, ZoomOut, Layers,
  Cpu, StopCircle, FileText, ChevronRight, Edit2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Types ────────────────────────────────────────────────────────────────────

type Disposition = "accepted" | "corrected" | "not_found" | "deferred" | null;
type AnchorStatus = "confirmed" | "proposed" | "missing";
type ConfidenceTier = "high" | "medium" | "low";

interface ExtractionField {
  id: string;
  field_name: string;
  field_label: string;
  field_category: string;
  is_critical: boolean;
  ai_extracted_value: string | null;
  ai_confidence: number | null;
  preparer_value: string | null;
  disposition: Disposition;
  anchor_status: AnchorStatus;
  confirmed: boolean;
}

// ─── Mock data — TODO: Backend integration required ───────────────────────────

const MOCK_FIELDS: ExtractionField[] = [
  // Core Metadata
  { id:"f1", field_name:"record_label",       field_label:"Record Label",        field_category:"core_metadata", is_critical:false, ai_extracted_value:"Office Tower Amendment 3", ai_confidence:0.96, preparer_value:null, disposition:"accepted", anchor_status:"confirmed", confirmed:false },
  { id:"f2", field_name:"contract_type",      field_label:"Contract Type",       field_category:"core_metadata", is_critical:false, ai_extracted_value:"Property Lease",           ai_confidence:0.94, preparer_value:null, disposition:"accepted", anchor_status:"confirmed", confirmed:false },
  { id:"f3", field_name:"execution_date",     field_label:"Execution Date",      field_category:"core_metadata", is_critical:true,  ai_extracted_value:"March 15, 2026",           ai_confidence:0.91, preparer_value:null, disposition:null,       anchor_status:"confirmed", confirmed:false },
  { id:"f4", field_name:"commencement_date",  field_label:"Commencement Date",   field_category:"core_metadata", is_critical:true,  ai_extracted_value:"April 1, 2026",            ai_confidence:0.88, preparer_value:null, disposition:null,       anchor_status:"proposed",  confirmed:false },
  { id:"f5", field_name:"expiration_date",    field_label:"Expiration Date",     field_category:"core_metadata", is_critical:true,  ai_extracted_value:null,                       ai_confidence:null, preparer_value:null, disposition:null,       anchor_status:"missing",   confirmed:false },
  { id:"f6", field_name:"amendment_number",   field_label:"Amendment Number",    field_category:"core_metadata", is_critical:false, ai_extracted_value:"3",                        ai_confidence:0.97, preparer_value:null, disposition:"accepted", anchor_status:"confirmed", confirmed:false },
  // Financial
  { id:"f7", field_name:"base_rent_amount",   field_label:"Base Rent Amount",    field_category:"financial",     is_critical:true,  ai_extracted_value:"$42,500/month",            ai_confidence:0.93, preparer_value:null, disposition:null,       anchor_status:"confirmed", confirmed:false },
  { id:"f8", field_name:"rent_escalation",    field_label:"Rent Escalation",     field_category:"financial",     is_critical:false, ai_extracted_value:"3% annual",                ai_confidence:0.72, preparer_value:null, disposition:null,       anchor_status:"proposed",  confirmed:false },
  { id:"f9", field_name:"security_deposit",   field_label:"Security Deposit",    field_category:"financial",     is_critical:false, ai_extracted_value:null,                       ai_confidence:null, preparer_value:null, disposition:"not_found",anchor_status:"missing",   confirmed:false },
  // Property
  { id:"f10",field_name:"property_address",   field_label:"Property Address",    field_category:"property",      is_critical:true,  ai_extracted_value:"350 Fifth Ave, New York",  ai_confidence:0.95, preparer_value:null, disposition:null,       anchor_status:"confirmed", confirmed:false },
  { id:"f11",field_name:"rentable_area",      field_label:"Rentable Area (SF)",  field_category:"property",      is_critical:true,  ai_extracted_value:"24,500 SF",                ai_confidence:0.89, preparer_value:null, disposition:null,       anchor_status:"proposed",  confirmed:false },
];

const CATEGORIES = ["core_metadata", "financial", "property"];
const CATEGORY_LABELS: Record<string, string> = {
  core_metadata: "Core Metadata",
  financial: "Financial",
  property: "Property",
};

// ─── Amendment detection ─────────────────────────────────────────────────────

const AMENDMENT_PATTERNS = /amend|amendment|addendum|addenda|rider|supplement|modification/i;

/**
 * Detects amendment-type file names from the current document and its batch siblings.
 * Returns the list of matched file names (may be empty).
 */
function detectAmendmentFiles(fileName: string, batchFiles: string[] = []): string[] {
  const matched: string[] = [];
  if (AMENDMENT_PATTERNS.test(fileName)) matched.push(fileName);
  batchFiles.forEach(f => { if (AMENDMENT_PATTERNS.test(f)) matched.push(f); });
  // Deduplicate
  return Array.from(new Set(matched));
}

/**
 * Inline amber banner shown in the AI Workspace when amendment files are detected.
 * Mirrors the step-5 variant in ProcessingWorkflowDialog — rent/dates/area guidance.
 */
function AiWorkspaceAmendmentBanner({ amendmentFiles }: { amendmentFiles: string[] }) {
  if (amendmentFiles.length === 0) return null;
  const fileList = amendmentFiles.join(', ');
  return (
    <div className="shrink-0 flex items-start gap-2.5 px-6 py-3 border-b border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
          Amendment detected — superseded fields require manual verification
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-medium">File{amendmentFiles.length > 1 ? 's' : ''}:</span>{' '}
          <span className="font-mono">{fileList}</span>
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
          Verify rent, dates, and area fields against the amendment — these are the fields most commonly superseded. Flag any value that conflicts with the amendment text.
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfidenceTier(c: number | null): ConfidenceTier {
  if (c === null) return "low";
  if (c >= 0.90) return "high";
  if (c >= 0.60) return "medium";
  return "low";
}
function confidenceClass(tier: ConfidenceTier) {
  return { high: "confidence-high", medium: "confidence-medium", low: "confidence-low" }[tier];
}

function AnchorIcon({ status }: { status: AnchorStatus }) {
  if (status === "confirmed") return <Link2 className="w-3.5 h-3.5 text-[var(--color-lg-success)]" />;
  if (status === "proposed")  return <Link2 className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" />;
  return <Link2Off className="w-3.5 h-3.5 text-[var(--color-lg-error)]" />;
}

// ─── Field history tooltip ───────────────────────────────────────────────────

interface FieldHistoryEntry {
  actor: 'AI' | 'Preparer' | 'Reviewer';
  value: string | null;
  note?: string;
  timestamp?: string;
}

function getFieldHistory(field: ExtractionField): FieldHistoryEntry[] {
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

const ACTOR_COLOURS: Record<FieldHistoryEntry['actor'], string> = {
  AI: 'bg-blue-100 text-blue-700',
  Preparer: 'bg-amber-100 text-amber-700',
  Reviewer: 'bg-emerald-100 text-emerald-700',
};

function FieldHistoryTooltip({ field }: { field: ExtractionField }) {
  const history = getFieldHistory(field);
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

// ─── Field row ────────────────────────────────────────────────────────────────

interface FieldRowProps {
  field: ExtractionField;
  onConfirm: (id: string) => void;
  isActive: boolean;
  onActivate: (id: string) => void;
}

function FieldRow({ field, onConfirm, isActive, onActivate }: FieldRowProps) {
  const tier = getConfidenceTier(field.ai_confidence);

  return (
    <div
      onClick={() => onActivate(field.id)}
      className={`
        flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
        ${field.is_critical ? "border-l-[3px]" : "border-l-[3px] border-l-transparent"}
        ${field.is_critical ? "border-l-[var(--color-lg-critical)]" : ""}
        ${isActive ? "bg-accent/60" : "hover:bg-muted/30"}
      `}
    >
      {/* Critical shield */}
      {field.is_critical && (
        <Shield
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: "var(--color-lg-critical)" }}
          aria-label="Critical Field — Cannot be deferred"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium text-foreground">{field.field_label}</span>
          {field.ai_confidence !== null && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${confidenceClass(tier)}`}>
              {Math.round(field.ai_confidence * 100)}%
            </span>
          )}
          <AnchorIcon status={field.anchor_status} />
          <FieldHistoryTooltip field={field} />
        </div>
        <p className={`text-[12px] ${field.ai_extracted_value ? "text-foreground" : "text-muted-foreground italic"}`}>
          {field.ai_extracted_value ?? "Not extracted"}
        </p>
        {field.disposition && (
          <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
            field.disposition === "accepted"  ? "badge-valid" :
            field.disposition === "corrected" ? "badge-warning" :
            field.disposition === "not_found" ? "badge-uploaded" :
            "badge-deferred"
          }`}>
            {field.disposition.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Critical confirm button */}
      {field.is_critical && !field.confirmed && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] shrink-0 border-[var(--color-lg-critical)] text-[var(--color-lg-critical)] hover:bg-amber-50"
          onClick={e => { e.stopPropagation(); onConfirm(field.id); }}
        >
          Confirm
        </Button>
      )}
      {field.is_critical && field.confirmed && (
        <CheckCircle2 className="w-4 h-4 text-[var(--color-lg-success)] shrink-0 mt-0.5" />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExtractionAiWorkspace() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_AI_WORKSPACE;
  const [, navigate] = useLocation();
  const search = useSearch();

  // Read amendment files forwarded via navigation state from ExtractionStrategy
  // (set by ExtractionQueue after ProcessingWorkflowDialog completes).
  // Falls back to pattern-matching the hardcoded demo file name so the banner
  // still appears when navigating directly to this screen without nav state.
  const navAmendmentFiles: string[] = useMemo(() => {
    const stateFiles = (window.history.state as { amendmentFiles?: string[] } | null)?.amendmentFiles;
    if (stateFiles && stateFiles.length > 0) return stateFiles;
    // Fallback: detect from the demo file name so the banner is always visible in demos
    return detectAmendmentFiles('Office-Tower-Amendment-3.pdf', []);
  }, []);

  // S8: ?from= back navigation
  const backDestination = useMemo(() => {
    const from = new URLSearchParams(search).get('from');
    if (from === 'queue')     return { path: '/extraction/queue',   label: 'Processing Queue' };
    if (from === 'approvals') return { path: '/approvals/review',   label: 'Approvals' };
    return { path: '/extraction/queue', label: 'Processing Queue' };
  }, [search]);

  const [fields, setFields] = useState<ExtractionField[]>(MOCK_FIELDS);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["core_metadata"]));
  const [activeFieldId, setActiveFieldId] = useState<string>("f1");
  const [zoom, setZoom] = useState(100);
  const [heatmap, setHeatmap] = useState(false);
  const [automationPanelOpen, setAutomationPanelOpen] = useState(true);

  // ─── Confidence threshold (persisted) — declared first; used in derived counts below ──
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

  // TODO: Backend integration required — GET /api/extraction-records/:id
  const totalFields = 73;
  const extractedCount = fields.filter(f => f.ai_extracted_value !== null).length;
  const lowConfCount = fields.filter(f => f.ai_confidence !== null && f.ai_confidence < (confidenceThreshold / 100)).length;
  const missingCount = fields.filter(f => f.ai_extracted_value === null).length;
  const criticalConfirmed = fields.filter(f => f.is_critical && f.confirmed).length;
  const totalCritical = fields.filter(f => f.is_critical).length;

  function toggleCat(cat: string) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function handleConfirm(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, confirmed: true, disposition: "accepted" } : f));
  }

  // ─── Automation level ──────────────────────────────────────────────────────
  const contractRecordId = 'r1'; // TODO: derive from route params
  // TODO: replace with contractRecord?.automation_level ?? tenantConfig?.automationPolicy?.documentExtractionLevel ?? 'collaborative'
  type AutomationLevelType = 'full_autonomous' | 'collaborative' | 'full_manual';
  const [automationLevel] = useState<AutomationLevelType>('full_autonomous');
  const isFullAutonomous = automationLevel === 'full_autonomous';
  const isCollaborative  = automationLevel === 'collaborative';
  const isFullManual     = automationLevel === 'full_manual';

  // ─── Checkpoint ─────────────────────────────────────────────────────────────
  const { activeCheckpoint } = useCheckpoints(contractRecordId, {
    checkpointType: 'extraction_review',
  });

  // ─── Mock agent task for ContractAgentProgressPanel ─────────────────────────
  const mockAgentTask = useMemo(() => ({
    id: `task-extraction-${contractRecordId}`,
    agent_type: 'extraction',
    workflow_id: `wf-${contractRecordId}`,
    contract_id: contractRecordId,
    agent_name: 'Extraction Agent',
    automation_level: 'full_autonomous' as const,
    status: 'running' as const,
    current_step: 'Confidence Scoring',
    steps: [
      { id: 's1', label: 'OCR Processing', status: 'completed' as const, timestamp: '09:14', duration: '1m 22s' },
      { id: 's2', label: 'Field Extraction', status: 'completed' as const, timestamp: '09:15', duration: '2m 04s' },
      { id: 's3', label: 'Confidence Scoring', status: 'active' as const },
      { id: 's4', label: 'Evidence Anchoring', status: 'upcoming' as const },
    ],
    decisions: [],
    progress: { current: 2, total: 4, label: 'Confidence Scoring' },
  }), [contractRecordId]);

  // ─── Manual task steps for LeaseManualTaskCard ───────────────────────────────
  const manualExtractionSteps = useMemo(() => [
    { id: 'ms1', label: 'Review each document page', assigned_role: 'preparer' },
    { id: 'ms2', label: 'Enter core metadata fields', assigned_role: 'preparer' },
    { id: 'ms3', label: 'Enter financial terms', assigned_role: 'preparer' },
    { id: 'ms4', label: 'Enter option and renewal terms', assigned_role: 'preparer' },
    { id: 'ms5', label: 'Confirm all critical fields', assigned_role: 'preparer' },
  ], []);

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      {/* Header */}
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
              <h1 className="page-title">AI Extraction Workspace</h1>
              <ScreenNumberBadge screenKey="extraction-ai-workspace" />
            </div>
            <p className="page-subtitle">Office-Tower-Amendment-3.pdf · JOB-2026-0442</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AutomationPolicyBadge level={automationLevel} size="sm" />
        </div>
      </div>

      {/* Graceful degradation banner — self-hiding when not needed */}
      <GracefulDegradationBanner />

      {/* Amendment banner — shown when amendment files are present in nav state (real flow)
           or detected from the demo file name (direct navigation / demo mode). */}
      <AiWorkspaceAmendmentBanner amendmentFiles={navAmendmentFiles} />

      {/* Summary bar */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 bg-muted/40 border-b border-border text-[13px]">
        <span className="text-foreground font-medium">
          <strong>{extractedCount}</strong> of <strong>{totalFields}</strong> extracted
        </span>
        <span className="text-[var(--color-lg-warning)] font-medium">
          <strong>{lowConfCount}</strong> low confidence
        </span>
        <span className="text-[var(--color-lg-error)] font-medium">
          <strong>{missingCount}</strong> missing
        </span>
        <span className="text-muted-foreground ml-auto">
          Critical confirmed: <strong className="text-foreground">{criticalConfirmed}/{totalCritical}</strong>
        </span>
        {/* Confidence threshold slider */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 border-l border-border pl-5 ml-2">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Threshold</span>
                <Slider
                  min={50}
                  max={99}
                  step={1}
                  value={[confidenceThreshold]}
                  onValueChange={handleThresholdChange}
                  className="w-24"
                  aria-label="Confidence threshold"
                />
                <span className="font-mono text-[12px] font-semibold text-foreground w-8 text-right">{confidenceThreshold}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] max-w-[220px]">
              Fields below this confidence level are highlighted as low confidence. Setting persists across sessions.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="split-panel-left flex flex-col" style={{ width: "50%" }}>

          {/* FC-9 Agent / Checkpoint / Manual panel */}
          {isFullAutonomous && (
            <div className="border-b border-border">
              <ContractAgentProgressPanel
                task={mockAgentTask}
                onIntervene={() => {}}
                onResume={() => {}}
              />
            </div>
          )}
          {isCollaborative && activeCheckpoint && (
            <div className="border-b border-border">
              <ContractCheckpointCard
                checkpoint={activeCheckpoint}
                onApprove={() => {}}
                onModify={() => {}}
                onReject={() => {}}
              />
            </div>
          )}
          {isFullManual && (
            <div className="border-b border-border">
              <LeaseManualTaskCard
                steps={manualExtractionSteps}
                workflowLabel="Manual Extraction"
                contractId={contractRecordId}
              />
            </div>
          )}

          {/* Automation panel (legacy — kept for full_autonomous mode) */}
          <div className="border-b border-border bg-muted/20">
            <button
              onClick={() => setAutomationPanelOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">Automation Panel</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-valid">
                  <CheckCircle2 className="w-3 h-3" /> Agent Complete
                </span>
              </div>
              {automationPanelOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {automationPanelOpen && (
              <div className="px-5 pb-3 flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground">
                  Agent extracted <strong className="text-foreground">{extractedCount} of {totalFields}</strong> fields.
                  Review and verify below.
                </p>
                <Button variant="outline" size="sm" className="gap-1.5 text-[12px] text-destructive border-destructive/40 hover:bg-destructive/5">
                  <StopCircle className="w-3.5 h-3.5" />
                  Intervene
                </Button>
              </div>
            )}
          </div>

          {/* Intervention button — full autonomous only */}
          {isFullAutonomous && (
            <div className="px-5 py-2 border-b border-border bg-muted/10">
              <InterventionButton
                status="running"
                onIntervene={() => {}}
                onResume={() => {}}
                size="sm"
              />
            </div>
          )}

          {/* Category accordions */}
          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map(cat => {
              const catFields = fields.filter(f => f.field_category === cat);
              const isOpen = expandedCats.has(cat);
              return (
                <div key={cat} className="border-b border-border">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <span className="text-[13px] font-semibold text-foreground">{CATEGORY_LABELS[cat]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{catFields.length} fields</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-border/50">
                      {catFields.map(field => (
                        <FieldRow
                          key={field.id}
                          field={field}
                          onConfirm={handleConfirm}
                          isActive={activeFieldId === field.id}
                          onActivate={setActiveFieldId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — PDF viewer */}
        <div className="split-panel-right flex flex-col" style={{ width: "50%" }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[12px] font-medium text-foreground">Office-Tower-Amendment-3.pdf</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHeatmap(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium border transition-colors ${
                  heatmap ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Heatmap
              </button>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[12px] text-muted-foreground w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* PDF canvas */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-auto">
            <div
              className="relative bg-white border border-border shadow-md rounded"
              style={{ width: `${zoom * 3.5}px`, maxWidth: "100%", minHeight: "500px", transition: "width 0.15s ease" }}
            >
              {/* Heatmap overlay */}
              {heatmap && (
                <div
                  className="absolute inset-0 rounded pointer-events-none"
                  style={{ background: "linear-gradient(135deg, rgba(46,117,182,0.12) 0%, rgba(245,127,23,0.08) 60%, rgba(198,40,40,0.15) 100%)" }}
                />
              )}
              {/* Anchor bbox overlay for active field */}
              <div
                className="absolute border-2 rounded"
                style={{
                  top: "18%", left: "12%", width: "60%", height: "4%",
                  borderColor: "var(--color-lg-primary-light)",
                  background: "rgba(46,117,182,0.08)",
                  boxShadow: "0 0 0 2px rgba(46,117,182,0.2)",
                }}
              />
              <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-[13px] font-medium">PDF Preview</p>
                  <p className="text-[11px] mt-1 opacity-60">
                    {/* TODO: Backend integration required — render from storage_path */}
                    Renders after backend integration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {criticalConfirmed < totalCritical
            ? `${totalCritical - criticalConfirmed} critical field${totalCritical - criticalConfirmed !== 1 ? "s" : ""} still need confirmation.`
            : "All critical fields confirmed. Ready for verification."}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/extraction/strategy")}>Back</Button>
          <Button className="gap-2" onClick={() => navigate("/extraction/verify")}>
            Continue to Verification
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
