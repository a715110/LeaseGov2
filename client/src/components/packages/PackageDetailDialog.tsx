/**
 * PackageDetailDialog — inline dialog version of the Contract Package detail view.
 *
 * Contains all the same content, layout, and role-aware elements as the
 * former /packages/:id standalone page. Opens as a full-height Sheet from
 * ApprovalsQueue, ApprovalsReview, and any other caller that has a package ID.
 *
 * Tabs:
 *   1. Package — document timeline, completeness bar, document table
 *   2. Document Detail — mirrors DocumentIntelligencePanel: Doc Preview,
 *      Metadata, Validation Results, Submitter's Instructions, Status History
 *      (activated by clicking a document row or the "Detail" button)
 *
 * Props:
 *   open        — controlled open state
 *   onClose     — called when the dialog should close
 *   packageId   — the package to display (e.g. "PKG-2026-0041")
 *   onApproved  — optional callback fired when Approver confirms approval
 *   onRejected  — optional callback fired when Approver confirms rejection
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  FileText, Plus, Flag, ChevronRight, Info, Tag,
  CheckCircle2, AlertTriangle, Clock, MoreHorizontal, ArrowRight, AlertCircle,
  Eye, ClipboardCheck, Lock, MessageSquare, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, AlertOctagon, X, Layers, User, Hash, Search,
  XCircle, Download, ChevronLeft,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  findContractRecord,
  CONTRACT_RECORD_STATUS_BADGE,
  CONTRACT_RECORD_STATUS_LABEL,
} from "@/lib/mockData";

// ── Types ──────────────────────────────────────────────────────────────────────
type DocumentRole = "base_contract" | "amendment" | "addendum" | "exhibit" | "schedule" | "notice" | "supporting";
type ExtractionStatus = "complete" | "in_progress" | "not_started" | "failed";

interface PackageDoc {
  id: string;
  chronological_order: number;
  name: string;
  document_role: DocumentRole;
  effective_date: string;
  extraction_status: ExtractionStatus;
  file_size: string;
}

type PackageMeta = {
  id: string;
  record_id: string;
  record_label: string;
  status: string;
  document_count: number;
  auto_promoted: boolean;
  promotion_triggered_at: string;
  open_blocking_flags: number;
  open_warning_flags: number;
};

// ── Mock data (mirrors PackagesComposition) ────────────────────────────────────
const PACKAGES_BY_ID: Record<string, { pkg: PackageMeta; docs: PackageDoc[] }> = {
  "PKG-2026-0041": {
    pkg: { id:"PKG-2026-0041", record_id:"mock-record-004", record_label:"Office Tower — 350 Fifth Ave", status:"validated", document_count:4, auto_promoted:true, promotion_triggered_at:"2026-05-14T09:22:00Z", open_blocking_flags:0, open_warning_flags:1 },
    docs: [
      { id:"doc1", chronological_order:1, name:"Office-Tower-Base-Lease-2022.pdf",       document_role:"base_contract", effective_date:"2022-01-01", extraction_status:"complete",    file_size:"9.4 MB" },
      { id:"doc2", chronological_order:2, name:"Office-Tower-Amendment-1-2023.pdf",       document_role:"amendment",     effective_date:"2023-06-01", extraction_status:"complete",    file_size:"2.1 MB" },
      { id:"doc3", chronological_order:3, name:"Office-Tower-Amendment-3-2026.pdf",       document_role:"amendment",     effective_date:"2026-04-01", extraction_status:"in_progress", file_size:"1.8 MB" },
      { id:"doc4", chronological_order:4, name:"Office-Tower-Exhibit-A-FloorPlan.pdf",    document_role:"exhibit",       effective_date:"2022-01-01", extraction_status:"complete",    file_size:"4.2 MB" },
    ],
  },
  "PKG-2026-0042": {
    pkg: { id:"PKG-2026-0042", record_id:"mock-record-005", record_label:"Retail HQ — 200 Broadway", status:"validated", document_count:3, auto_promoted:false, promotion_triggered_at:"2026-05-10T08:00:00Z", open_blocking_flags:0, open_warning_flags:0 },
    docs: [
      { id:"r1", chronological_order:1, name:"Retail-HQ-Base-Lease-2021.pdf",   document_role:"base_contract", effective_date:"2021-01-01", extraction_status:"complete", file_size:"6.1 MB" },
      { id:"r2", chronological_order:2, name:"Retail-HQ-Amendment-2023.pdf",    document_role:"amendment",     effective_date:"2023-03-01", extraction_status:"complete", file_size:"1.4 MB" },
      { id:"r3", chronological_order:3, name:"Retail-HQ-Exhibit-B-Parking.pdf", document_role:"exhibit",       effective_date:"2021-01-01", extraction_status:"complete", file_size:"2.8 MB" },
    ],
  },
  "PKG-2026-0043": {
    pkg: { id:"PKG-2026-0043", record_id:"mock-record-006", record_label:"Warehouse District — 45 Industrial Blvd", status:"assembling", document_count:2, auto_promoted:true, promotion_triggered_at:"2026-05-12T10:00:00Z", open_blocking_flags:1, open_warning_flags:0 },
    docs: [
      { id:"w1", chronological_order:1, name:"Warehouse-Base-Lease-2020.pdf",  document_role:"base_contract", effective_date:"2020-06-01", extraction_status:"complete",    file_size:"5.5 MB" },
      { id:"w2", chronological_order:2, name:"Warehouse-Amendment-2024.pdf",   document_role:"amendment",     effective_date:"2024-01-01", extraction_status:"not_started", file_size:"0.8 MB" },
    ],
  },
  "PKG-2026-0044": {
    pkg: { id:"PKG-2026-0044", record_id:"mock-record-007", record_label:"Tech Campus — 1 Innovation Dr", status:"validated", document_count:5, auto_promoted:true, promotion_triggered_at:"2026-04-20T14:00:00Z", open_blocking_flags:0, open_warning_flags:2 },
    docs: [
      { id:"t1", chronological_order:1, name:"TechCampus-Base-Lease-2019.pdf",    document_role:"base_contract", effective_date:"2019-01-01", extraction_status:"complete", file_size:"12.3 MB" },
      { id:"t2", chronological_order:2, name:"TechCampus-Amendment-1-2020.pdf",   document_role:"amendment",     effective_date:"2020-06-01", extraction_status:"complete", file_size:"2.2 MB" },
      { id:"t3", chronological_order:3, name:"TechCampus-Amendment-2-2022.pdf",   document_role:"amendment",     effective_date:"2022-09-01", extraction_status:"complete", file_size:"1.9 MB" },
      { id:"t4", chronological_order:4, name:"TechCampus-Schedule-A-Parking.pdf", document_role:"schedule",      effective_date:"2019-01-01", extraction_status:"complete", file_size:"3.1 MB" },
      { id:"t5", chronological_order:5, name:"TechCampus-Exhibit-C-IT-Specs.pdf", document_role:"exhibit",       effective_date:"2022-09-01", extraction_status:"complete", file_size:"4.7 MB" },
    ],
  },
  "PKG-2026-0045": {
    pkg: { id:"PKG-2026-0045", record_id:"mock-record-008", record_label:"Downtown Plaza — 88 Commerce St", status:"pending", document_count:2, auto_promoted:false, promotion_triggered_at:"2026-06-01T09:00:00Z", open_blocking_flags:0, open_warning_flags:1 },
    docs: [
      { id:"d1", chronological_order:1, name:"DowntownPlaza-Base-Lease-2023.pdf", document_role:"base_contract", effective_date:"2023-02-01", extraction_status:"complete",    file_size:"8.0 MB" },
      { id:"d2", chronological_order:2, name:"DowntownPlaza-Addendum-2024.pdf",   document_role:"addendum",      effective_date:"2024-07-01", extraction_status:"in_progress", file_size:"1.1 MB" },
    ],
  },
  "PKG-2026-0046": {
    pkg: { id:"PKG-2026-0046", record_id:"mock-record-009", record_label:"Suburban Office Park — 500 Park Ave", status:"validated", document_count:3, auto_promoted:true, promotion_triggered_at:"2026-03-15T11:00:00Z", open_blocking_flags:0, open_warning_flags:0 },
    docs: [
      { id:"s1", chronological_order:1, name:"SuburbanPark-Base-Lease-2018.pdf",    document_role:"base_contract", effective_date:"2018-05-01", extraction_status:"complete", file_size:"7.8 MB" },
      { id:"s2", chronological_order:2, name:"SuburbanPark-Amendment-2021.pdf",     document_role:"amendment",     effective_date:"2021-11-01", extraction_status:"complete", file_size:"1.6 MB" },
      { id:"s3", chronological_order:3, name:"SuburbanPark-Exhibit-A-Parking.pdf",  document_role:"exhibit",       effective_date:"2018-05-01", extraction_status:"complete", file_size:"2.3 MB" },
    ],
  },
  "PKG-2026-002": {
    pkg: { id:"PKG-2026-002", record_id:"mock-record-002", record_label:"Globex Ground Lease Package", status:"assembling", document_count:2, auto_promoted:false, promotion_triggered_at:"2026-06-11T14:22:00Z", open_blocking_flags:0, open_warning_flags:0 },
    docs: [
      { id:"g1", chronological_order:1, name:"Globex-Ground-Lease-2021.pdf",     document_role:"base_contract", effective_date:"2021-03-01", extraction_status:"complete",    file_size:"7.2 MB" },
      { id:"g2", chronological_order:2, name:"Globex-Ground-Amendment-2024.pdf", document_role:"amendment",     effective_date:"2024-01-15", extraction_status:"not_started", file_size:"1.3 MB" },
    ],
  },
  "PKG-2026-001": {
    pkg: { id:"PKG-2026-001", record_id:"mock-record-001", record_label:"Acme Corp Retail Package", status:"pending", document_count:3, auto_promoted:true, promotion_triggered_at:"2026-06-10T11:05:00Z", open_blocking_flags:1, open_warning_flags:0 },
    docs: [
      { id:"a1", chronological_order:1, name:"Acme-Retail-Lease-2020.pdf",        document_role:"base_contract", effective_date:"2020-07-01", extraction_status:"complete", file_size:"5.6 MB" },
      { id:"a2", chronological_order:2, name:"Acme-Retail-Amendment-2022.pdf",    document_role:"amendment",     effective_date:"2022-11-01", extraction_status:"complete", file_size:"0.9 MB" },
      { id:"a3", chronological_order:3, name:"Acme-Retail-Exhibit-B-Parking.pdf", document_role:"exhibit",       effective_date:"2020-07-01", extraction_status:"failed",   file_size:"2.1 MB" },
    ],
  },
};

const FALLBACK_PACKAGE_ID = "PKG-2026-0041";

// ── Display maps ───────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<DocumentRole, string> = {
  base_contract:"Base Contract", amendment:"Amendment", addendum:"Addendum",
  exhibit:"Exhibit", schedule:"Schedule", notice:"Notice", supporting:"Supporting",
};
const ALL_ROLES: DocumentRole[] = ["base_contract","amendment","addendum","exhibit","schedule","notice","supporting"];
const ROLE_BADGE_CLASSES: Record<DocumentRole, string> = {
  base_contract: "bg-[var(--color-lg-primary)] text-white",
  amendment:     "bg-blue-100 text-blue-800 border border-blue-200",
  addendum:      "bg-indigo-100 text-indigo-800 border border-indigo-200",
  exhibit:       "bg-purple-100 text-purple-800 border border-purple-200",
  schedule:      "bg-slate-100 text-slate-700 border border-slate-200",
  notice:        "bg-orange-100 text-orange-800 border border-orange-200",
  supporting:    "bg-gray-100 text-gray-700 border border-gray-200",
};
const EXT_CONFIG: Record<ExtractionStatus, { label:string; cls:string; icon:React.ReactNode }> = {
  complete:    { label:"Complete",    cls:"badge-valid",      icon:<CheckCircle2 className="w-3.5 h-3.5" /> },
  in_progress: { label:"In Progress", cls:"badge-processing", icon:<Clock className="w-3.5 h-3.5" /> },
  not_started: { label:"Not Started", cls:"badge-uploaded",   icon:<Clock className="w-3.5 h-3.5" /> },
  failed:      { label:"Failed",      cls:"badge-invalid",    icon:<AlertTriangle className="w-3.5 h-3.5" /> },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*(MB|KB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2].toUpperCase() === 'MB' ? val * 1_000_000 : val * 1024;
}

interface ValidationCheck {
  label: string;
  passed: boolean;
  detail: string;
}

function deriveValidationChecks(doc: PackageDoc): ValidationCheck[] {
  const failed = doc.extraction_status === 'failed';
  return [
    { label: 'Format Check',    passed: true,   detail: 'Extension accepted' },
    { label: 'Size Check',      passed: true,   detail: `${doc.file_size} — within limit` },
    { label: 'Duplicate Check', passed: true,   detail: 'No duplicate found' },
    { label: 'File Integrity',  passed: !failed, detail: failed ? 'Extraction failed — file may be corrupt' : 'File header valid' },
  ];
}

interface TimelineStep { label: string; done: boolean; date?: string; }

function deriveTimeline(doc: PackageDoc): TimelineStep[] {
  const isComplete = doc.extraction_status === 'complete';
  const isFailed   = doc.extraction_status === 'failed';
  const inProgress = doc.extraction_status === 'in_progress';
  return [
    { label: 'Uploaded',   done: true,                        date: doc.effective_date },
    { label: 'Validated',  done: true,                        date: doc.effective_date },
    { label: 'Packaged',   done: true },
    { label: 'Extracting', done: isComplete || isFailed || inProgress },
    { label: 'Complete',   done: isComplete },
  ];
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function TimelineNode({ doc, isLast }: { doc: PackageDoc; isLast: boolean }) {
  const isBase = doc.document_role === "base_contract";
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center gap-1.5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${isBase ? "bg-[var(--color-lg-primary)] border-[var(--color-lg-primary)] text-white" : "bg-white border-[var(--color-lg-primary-light)] text-[var(--color-lg-primary-light)]"}`}>
          {doc.chronological_order}
        </div>
        <div className="text-center max-w-[90px]">
          <p className="text-[11px] font-semibold text-foreground leading-tight">{ROLE_LABELS[doc.document_role]}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{doc.effective_date.slice(0, 7)}</p>
        </div>
      </div>
      {!isLast && (
        <div className="flex items-center mx-3 mb-6">
          <div className="h-0.5 w-12 bg-[var(--color-lg-primary-light)]/40" />
          <ArrowRight className="w-3.5 h-3.5 text-[var(--color-lg-primary-light)]/60 -ml-1" />
        </div>
      )}
    </div>
  );
}

// ── Document Detail Tab content ────────────────────────────────────────────────
function DocumentDetailTab({ doc }: { doc: PackageDoc }) {
  const mimeLabel = 'PDF';
  const pageCount = 4;
  const previewPages = Array.from({ length: Math.min(pageCount, 6) }, (_, i) => i + 1);
  const validationChecks = deriveValidationChecks(doc);
  const timeline = deriveTimeline(doc);
  const targetRecord = findContractRecord(null); // packages don't have a staged record target
  const sizeBytes = parseSizeToBytes(doc.file_size);
  const extCfg = EXT_CONFIG[doc.extraction_status];
  const isFailed = doc.extraction_status === 'failed';

  // Mock submitter instructions for base contracts
  const submitterNotes = doc.document_role === 'base_contract'
    ? 'Original executed lease agreement. Please ensure all exhibits are included in the package before proceeding to extraction.'
    : null;

  return (
    <div className="flex flex-col gap-5 px-6 py-5">

      {/* ── Document Preview ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Document Preview · {pageCount} pages
        </p>
        <div className="grid grid-cols-3 gap-2">
          {previewPages.map(page => (
            <div
              key={page}
              className="aspect-[3/4] rounded-md bg-muted border border-border flex items-end justify-center pb-1.5 relative overflow-hidden"
            >
              {/* Paper lines decoration */}
              <div className="absolute inset-x-3 top-3 flex flex-col gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-px bg-muted-foreground/15 rounded-full" />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground/60 font-mono relative z-10">{page}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metadata ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Metadata</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            { icon: <Layers className="w-3.5 h-3.5" />, label: 'File Size',    value: doc.file_size },
            { icon: <FileText className="w-3.5 h-3.5" />, label: 'Pages',      value: String(pageCount) },
            { icon: <Tag className="w-3.5 h-3.5" />, label: 'Document Role',   value: ROLE_LABELS[doc.document_role] },
            { icon: <User className="w-3.5 h-3.5" />, label: 'Effective Date', value: doc.effective_date },
            { icon: <Hash className="w-3.5 h-3.5" />, label: 'Format',        value: mimeLabel },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {item.icon} {item.label}
              </span>
              <span className="text-[12px] font-medium text-foreground">{item.value}</span>
            </div>
          ))}
          {/* Extraction status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> Extraction
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold w-fit ${extCfg.cls}`}>
              {extCfg.icon} {extCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Validation Results ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Validation Results</p>
        <div className="flex flex-col gap-1.5">
          {validationChecks.map(check => (
            <div key={check.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
              {check.passed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <span className={`text-[12px] font-medium ${check.passed ? 'text-foreground' : 'text-red-700'}`}>
                  {check.label}
                </span>
                <p className="text-[11px] text-muted-foreground truncate">{check.detail}</p>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                check.passed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {check.passed ? 'Pass' : 'Fail'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Submitter's Instructions ── */}
      {submitterNotes && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Submitter's Instructions
          </p>
          <div className="px-3 py-3 rounded-lg bg-accent border border-border text-[12px] text-foreground leading-relaxed">
            {submitterNotes}
          </div>
        </div>
      )}

      {/* ── Status History ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status History</p>
        <div className="flex flex-col gap-0">
          {timeline.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0 mt-0.5">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                  step.done
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted-foreground/30'
                }`} />
                {i < timeline.length - 1 && (
                  <div className={`w-px flex-1 min-h-[20px] ${step.done ? 'bg-primary/30' : 'bg-muted-foreground/15'}`} />
                )}
              </div>
              <div className="pb-3">
                <p className={`text-[12px] font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[11px] text-muted-foreground">{step.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main dialog component ──────────────────────────────────────────────────────
interface PackageDetailDialogProps {
  open: boolean;
  onClose: () => void;
  packageId?: string;
  onApproved?: (packageId: string) => void;
  onRejected?: (packageId: string, reason: string) => void;
  /** Called when Reviewer clicks "Review Package" — advances task to reviewed state */
  onReviewComplete?: (packageId: string) => void;
}

export function PackageDetailDialog({
  open,
  onClose,
  packageId,
  onApproved,
  onRejected,
  onReviewComplete,
}: PackageDetailDialogProps) {
  const [, navigate] = useLocation();
  const { activeRole } = useRole();

  const isReviewer = activeRole === 'reviewer';
  const isApprover = activeRole === 'approver';
  const canEdit    = activeRole === 'preparer' || activeRole === 'lease_admin';
  const isReadOnly = !canEdit;

  // Resolve package data
  const resolvedId = packageId ?? FALLBACK_PACKAGE_ID;
  const resolved   = PACKAGES_BY_ID[resolvedId] ?? PACKAGES_BY_ID[FALLBACK_PACKAGE_ID];

  // ── State ──────────────────────────────────────────────────────────────────
  const [pkg,  setPkg]  = useState(resolved.pkg);
  const [docs, setDocs] = useState<PackageDoc[]>(resolved.docs);

  // Tab state: 'package' | 'document-detail'
  type TabId = 'package' | 'document-detail';
  const [activeTab, setActiveTab] = useState<TabId>('package');
  const [detailDoc, setDetailDoc] = useState<PackageDoc | null>(null);

  function openDocDetail(doc: PackageDoc) {
    setDetailDoc(doc);
    setActiveTab('document-detail');
  }

  // ── Prev / Next navigation in Document Detail tab ─────────────────────────
  function navigateDetail(direction: 'prev' | 'next') {
    if (!detailDoc) return;
    const idx = sortedDocs.findIndex(d => d.id === detailDoc.id);
    if (idx === -1) return;
    const nextIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (nextIdx >= 0 && nextIdx < sortedDocs.length) {
      setDetailDoc(sortedDocs[nextIdx]);
    }
  }

  // ── Download current document + metadata as JSON ──────────────────────────
  function handleDownloadDocument(doc: PackageDoc) {
    const payload = {
      document_name: doc.name,
      document_role: ROLE_LABELS[doc.document_role],
      effective_date: doc.effective_date,
      file_size: doc.file_size,
      extraction_status: EXT_CONFIG[doc.extraction_status].label,
      chronological_order: doc.chronological_order,
      package_id: pkg.id,
      record_label: pkg.record_label,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.replace(/\.pdf$/i, '')}_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Metadata exported', { description: `${doc.name} — metadata JSON downloaded.`, duration: 4000 });
  }

  // Re-sync when packageId prop changes
  useEffect(() => {
    const r = PACKAGES_BY_ID[resolvedId] ?? PACKAGES_BY_ID[FALLBACK_PACKAGE_ID];
    setPkg(r.pkg);
    setDocs(r.docs);
    setAnnotationComment("");
    setFlaggedDocIds(new Set());
    setAnnotationsSubmitted(false);
    setApproverAction(null);
    setRejectReason("");
    setActiveTab('package');
    setDetailDoc(null);
  }, [resolvedId]);

  // Change Role dialog
  const [changeRoleDoc, setChangeRoleDoc] = useState<PackageDoc | null>(null);
  const [pendingRole,   setPendingRole]   = useState<DocumentRole | "">("");

  // Reviewer annotation panel
  const [annotationOpen,       setAnnotationOpen]       = useState(isReviewer);
  const [annotationComment,    setAnnotationComment]    = useState("");
  const [flaggedDocIds,        setFlaggedDocIds]        = useState<Set<string>>(new Set());
  const [annotationsSubmitted, setAnnotationsSubmitted] = useState(false);

  // Keep annotation panel in sync with role changes
  useEffect(() => { setAnnotationOpen(isReviewer); }, [isReviewer]);

  function toggleFlagDoc(docId: string) {
    setFlaggedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  }

  function handleSubmitAnnotations() {
    const flagCount = flaggedDocIds.size;
    const hasComment = annotationComment.trim().length > 0;
    if (!hasComment && flagCount === 0) {
      toast.warning("Add at least one comment or flag a document before submitting.");
      return;
    }
    setAnnotationsSubmitted(true);
    toast.success("Annotations saved", {
      description: `${flagCount} document${flagCount !== 1 ? 's' : ''} flagged for rework${hasComment ? ' · General comment recorded' : ''}.`,
      duration: 5000,
    });
  }

  // Approver confirm dialog
  const [approverAction, setApproverAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason,   setRejectReason]   = useState("");

  function handleApproverConfirm() {
    if (approverAction === 'approve') {
      toast.success("Package approved", { description: `${pkg.id} — ${pkg.record_label} has been approved.`, duration: 6000 });
      onApproved?.(pkg.id);
    } else {
      toast.error("Package rejected", { description: rejectReason.trim() || "No reason provided.", duration: 6000 });
      onRejected?.(pkg.id, rejectReason.trim());
    }
    setApproverAction(null);
    setRejectReason("");
    onClose();
  }

  // BR2: Auto-detect multiple base contracts
  useEffect(() => {
    const baseCount = docs.filter(d => d.document_role === "base_contract").length;
    setPkg(prev => ({
      ...prev,
      open_blocking_flags: baseCount > 1 ? Math.max(prev.open_blocking_flags, 1) : 0,
    }));
  }, [docs]);

  const sortedDocs   = [...docs].sort((a, b) => a.chronological_order - b.chronological_order);
  const completeness = docs.length === 0 ? 0 : Math.round((docs.filter(d => d.extraction_status === "complete").length / docs.length) * 100);
  const totalOpenFlags = pkg.open_blocking_flags + pkg.open_warning_flags;
  const canProceed     = pkg.open_blocking_flags === 0;
  const baseContracts  = docs.filter(d => d.document_role === "base_contract");
  const hasMultipleBase = baseContracts.length > 1;

  // BR5: re-assembly
  function triggerReassembly(
    triggerType: "role_changed" | "document_removed",
    triggerLabel: string,
    beforeDocs: PackageDoc[],
    afterDocs: PackageDoc[],
  ) {
    const event = {
      triggered_at: new Date().toISOString(),
      trigger_type: triggerType,
      trigger_label: triggerLabel,
      triggered_by: "Current User",
      new_flags_raised: afterDocs.filter(d => d.document_role === "base_contract").length > 1 ? 1 : 0,
      preserved_resolutions: 1,
      before_docs: beforeDocs.map(d => ({ id:d.id, name:d.name, document_role:d.document_role, effective_date:d.effective_date })),
      after_docs:  afterDocs.map(d =>  ({ id:d.id, name:d.name, document_role:d.document_role, effective_date:d.effective_date })),
    };
    sessionStorage.setItem("leasegov_reassembly_event", JSON.stringify(event));
    onClose();
    navigate(`/packages/${pkg.id}/reassembly`);
  }

  function handleChangeRole() {
    if (!changeRoleDoc || !pendingRole) return;
    const oldRole = changeRoleDoc.document_role;
    const newRole = pendingRole as DocumentRole;
    if (oldRole === newRole) { setChangeRoleDoc(null); return; }
    const beforeDocs  = [...docs];
    const updatedDocs = docs.map(d => d.id === changeRoleDoc.id ? { ...d, document_role: newRole } : d);
    setDocs(updatedDocs);
    setChangeRoleDoc(null);
    setPendingRole("");
    toast.success(`Role changed to ${ROLE_LABELS[newRole]}`, {
      description: `"${changeRoleDoc.name}" was reclassified from ${ROLE_LABELS[oldRole]}.`,
    });
    triggerReassembly("role_changed", "Role Changed", beforeDocs, updatedDocs);
  }

  function handleRemove(doc: PackageDoc) {
    const beforeDocs  = [...docs];
    const updatedDocs = docs.filter(d => d.id !== doc.id).map((d, i) => ({ ...d, chronological_order: i + 1 }));
    setDocs(updatedDocs);
    toast.warning(`"${doc.name}" removed from package`, {
      duration: 15000,
      action: { label: "Undo", onClick: () => { setDocs(beforeDocs); toast.success("Removal undone"); } },
    });
    triggerReassembly("document_removed", "Document Removed", beforeDocs, updatedDocs);
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'package',         label: 'Package' },
    { id: 'document-detail', label: detailDoc ? `Document Detail — ${detailDoc.name.length > 30 ? detailDoc.name.slice(0, 27) + '…' : detailDoc.name}` : 'Document Detail' },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl p-0 flex flex-col overflow-hidden"
          style={{ maxWidth: "min(90vw, 1100px)" }}
        >
          {/* ── Dialog header ─────────────────────────────────────────────── */}
          <SheetHeader className="shrink-0 px-6 py-4 border-b border-border bg-[var(--color-lg-page-bg)]">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <SheetTitle className="page-title text-[18px]">Contract Package</SheetTitle>
                  <span className="badge-valid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground">{pkg.record_label} · {pkg.id} · {pkg.document_count} documents</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role badge */}
                {isReviewer ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    <Eye className="w-3.5 h-3.5" /> Reviewer View — Read Only
                  </span>
                ) : isApprover ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    <ThumbsUp className="w-3.5 h-3.5" /> Approver View
                  </span>
                ) : canEdit ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-info)] border border-blue-200">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Preparer View
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                    <Lock className="w-3.5 h-3.5" /> Read Only
                  </span>
                )}

                {/* Add Document — Preparer / Lease Admin only */}
                {canEdit && (
                  <Button variant="outline" size="sm" className="gap-1.5"
                    onClick={() => {
                      sessionStorage.setItem('leasegov_add_doc_for', JSON.stringify({ packageId: pkg.id, recordId: pkg.record_id, recordLabel: pkg.record_label }));
                      onClose();
                      navigate('/pipeline/dashboard');
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Document
                  </Button>
                )}

                {/* View Flags — all roles */}
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)]"
                  onClick={() => { onClose(); navigate(`/packages/${pkg.id}/flags`); }}
                >
                  <Flag className="w-3.5 h-3.5" /> View Flags
                  {totalOpenFlags > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-lg-error)] text-white text-[10px] font-bold">{totalOpenFlags}</span>
                  )}
                </Button>

                {/* Primary CTA — differs by role */}
                {isReviewer ? (
                  <Button className="gap-1.5" onClick={() => {
                    if (onReviewComplete && pkg) {
                      onReviewComplete(pkg.id);
                    } else {
                      onClose();
                      navigate("/approvals/queue");
                    }
                  }}>
                    <ClipboardCheck className="w-4 h-4" />
                    Review Package
                    {annotationsSubmitted && flaggedDocIds.size > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">{flaggedDocIds.size} flagged</span>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : isApprover ? (
                  <>
                    <Button variant="outline" size="sm"
                      className="gap-1.5 border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)]"
                      onClick={() => setApproverAction('reject')}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Reject
                    </Button>
                    <Button size="sm"
                      className="gap-1.5 bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white"
                      onClick={() => setApproverAction('approve')}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Approve
                    </Button>
                  </>
                ) : canEdit ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button disabled={!canProceed} className="gap-1.5" onClick={() => { onClose(); navigate("/approvals/queue"); }}>
                          Proceed to Approval <ChevronRight className="w-4 h-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canProceed && (
                      <TooltipContent side="bottom" className="text-[12px]">
                        {pkg.open_blocking_flags} blocking flag{pkg.open_blocking_flags !== 1 ? "s" : ""} must be resolved
                      </TooltipContent>
                    )}
                  </Tooltip>
                ) : null}

                {/* Close button */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ── Tab bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-0 mt-3 border-b border-border -mx-6 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[var(--color-lg-primary)] border-b-2 border-[var(--color-lg-primary)] -mb-px'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {activeTab === 'document-detail' && detailDoc && (
                <button
                  onClick={() => { setActiveTab('package'); setDetailDoc(null); }}
                  className="ml-auto mr-0 flex items-center gap-1 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </SheetHeader>

          {/* ── Main content area ────────────────────────────────────────── */}
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">

            {/* ── Package tab ──────────────────────────────────────────── */}
            {activeTab === 'package' && (
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 bg-[var(--color-lg-page-bg)]">

                {/* BR2: Multiple base contracts blocking alert */}
                {hasMultipleBase && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-lg border text-[13px]"
                    style={{ background:"var(--color-lg-error-subtle)", borderColor:"var(--color-lg-error)", borderLeftWidth:"4px" }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
                    <div className="flex-1">
                      <span className="font-semibold" style={{ color:"var(--color-lg-error)" }}>Multiple Base Contracts detected — blocking flag raised.</span>
                      <span className="text-muted-foreground ml-1">Only one Base Contract is allowed per package. Found {baseContracts.length}. Reclassify the duplicate to resolve this flag.</span>
                      {canEdit && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {baseContracts.map((dupeDoc, idx) => (
                            <button key={dupeDoc.id}
                              onClick={() => { setChangeRoleDoc(dupeDoc); setPendingRole(dupeDoc.document_role); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors"
                              style={{ borderColor:"var(--color-lg-error)", color:"var(--color-lg-error)", background:"transparent" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-lg-error-subtle)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                            >
                              <Tag className="w-3 h-3" />
                              Reclassify {idx === 0 ? "first" : "duplicate"}: {dupeDoc.name.length > 28 ? dupeDoc.name.slice(0, 25) + "…" : dupeDoc.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Auto-promotion badge */}
                {pkg.auto_promoted && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-blue-200 text-[13px]" style={{ background:"var(--color-lg-accent-subtle)" }}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-lg-info)]" />
                    <span className="text-[var(--color-lg-info)]">
                      <strong>Package auto-created</strong> when a second document was associated with this contract record on{" "}
                      {new Date(pkg.promotion_triggered_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}.
                    </span>
                  </div>
                )}

                {/* Completeness bar */}
                <div className="bg-card border border-border rounded-lg px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-foreground">Extraction Completeness</span>
                    <span className="text-[13px] font-bold" style={{ color: completeness === 100 ? "var(--color-lg-success)" : "var(--color-lg-warning)" }}>
                      {completeness}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full rounded transition-all" style={{ width:`${completeness}%`, backgroundColor: completeness === 100 ? "var(--color-lg-success)" : "var(--color-lg-primary-light)" }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {docs.filter(d => d.extraction_status === "complete").length} of {docs.length} documents fully extracted
                  </p>
                </div>

                {/* Horizontal timeline */}
                <div className="bg-card border border-border rounded-lg px-6 py-5">
                  <h2 className="text-[13px] font-semibold text-foreground mb-4">Document Timeline</h2>
                  <div className="flex items-start overflow-x-auto pb-2">
                    {sortedDocs.map((doc, i) => <TimelineNode key={doc.id} doc={doc} isLast={i === sortedDocs.length - 1} />)}
                  </div>
                </div>

                {/* Document table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold text-foreground">Documents</h2>
                    <div className="flex items-center gap-3">
                      {isReadOnly && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Lock className="w-3 h-3" /> Read-only view
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground italic">Click a row to view Document Detail</span>
                    </div>
                  </div>
                  <table className="data-table w-full text-[13px]">
                    <thead>
                      <tr>
                        <th className="text-left">#</th>
                        <th className="text-left">Document Name</th>
                        <th className="text-left">Role</th>
                        <th className="text-left">Effective Date</th>
                        <th className="text-left">Extraction</th>
                        <th className="text-left">Size</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDocs.map(doc => {
                        const extCfg = EXT_CONFIG[doc.extraction_status];
                        const isDuplicateBase = doc.document_role === "base_contract" && hasMultipleBase;
                        const isDetailActive = detailDoc?.id === doc.id && (activeTab as string) === 'document-detail';
                        return (
                          <tr
                            key={doc.id}
                            className={`cursor-pointer transition-colors ${
                              isDuplicateBase
                                ? "bg-[var(--color-lg-error-subtle)]/40 hover:bg-[var(--color-lg-error-subtle)]/60"
                                : isDetailActive
                                  ? "bg-primary/8 hover:bg-primary/10"
                                  : "hover:bg-muted/30"
                            }`}
                            onClick={() => openDocDetail(doc)}
                          >
                            <td className="font-mono text-[12px] text-muted-foreground">{doc.chronological_order}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="font-medium text-foreground truncate max-w-[260px]">{doc.name}</span>
                                {isDuplicateBase && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0 cursor-help" style={{ color:"var(--color-lg-error)" }} />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-[12px]">Duplicate Base Contract — reclassify or remove</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${ROLE_BADGE_CLASSES[doc.document_role]}`}>
                                {ROLE_LABELS[doc.document_role]}
                              </span>
                            </td>
                            <td className="text-muted-foreground">{doc.effective_date}</td>
                            <td>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${extCfg.cls}`}>
                                {extCfg.icon} {extCfg.label}
                              </span>
                            </td>
                            <td className="text-muted-foreground text-[12px]">{doc.file_size}</td>
                            <td className="text-right" onClick={e => e.stopPropagation()}>
                              {canEdit ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-[13px]">
                                    <DropdownMenuItem onClick={() => openDocDetail(doc)}>View Document Detail</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { onClose(); navigate("/extraction/verify"); }}>View Extraction</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setChangeRoleDoc(doc); setPendingRole(doc.document_role); }}>Change Role</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(doc)}>Remove from Package</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center h-7 w-7 cursor-default">
                                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-[12px]">Actions not available in read-only view</TooltipContent>
                                </Tooltip>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Document Detail tab ──────────────────────────────────── */}
            {activeTab === 'document-detail' && (
              <div className="flex-1 overflow-y-auto bg-[var(--color-lg-page-bg)]">
                {detailDoc ? (
                  <>
                    {/* Document selector strip + Prev/Next + Download */}
                    <div className="px-4 py-2.5 border-b border-border bg-card flex items-center gap-2 flex-wrap">
                      {/* Prev / Next */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline" size="sm"
                          className="h-7 w-7 p-0"
                          disabled={sortedDocs.findIndex(d => d.id === detailDoc.id) === 0}
                          onClick={() => navigateDetail('prev')}
                          title="Previous document"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-[11px] text-muted-foreground font-mono px-1">
                          {sortedDocs.findIndex(d => d.id === detailDoc.id) + 1} / {sortedDocs.length}
                        </span>
                        <Button
                          variant="outline" size="sm"
                          className="h-7 w-7 p-0"
                          disabled={sortedDocs.findIndex(d => d.id === detailDoc.id) === sortedDocs.length - 1}
                          onClick={() => navigateDetail('next')}
                          title="Next document"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="h-4 w-px bg-border shrink-0" />

                      {/* Selector pills */}
                      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Viewing:</span>
                        {sortedDocs.map(d => (
                          <button
                            key={d.id}
                            onClick={() => setDetailDoc(d)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                              detailDoc.id === d.id
                                ? 'bg-[var(--color-lg-primary)] text-white border-[var(--color-lg-primary)]'
                                : 'bg-background text-foreground border-border hover:bg-muted'
                            }`}
                          >
                            <span className="font-mono">{d.chronological_order}.</span>
                            {d.name.length > 20 ? d.name.slice(0, 17) + '…' : d.name}
                          </button>
                        ))}
                      </div>

                      {/* Download button */}
                      <Button
                        variant="outline" size="sm"
                        className="gap-1.5 shrink-0 h-7 text-[12px]"
                        onClick={() => handleDownloadDocument(detailDoc)}
                        title="Download document metadata as JSON"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                    <DocumentDetailTab doc={detailDoc} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <FileText className="w-10 h-10 opacity-30" />
                    <p className="text-[13px]">Click a document row in the Package tab to view its detail here.</p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('package')}>
                      Go to Package tab
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Reviewer annotation side panel ───────────────────────── */}
            {isReviewer && (activeTab === 'package' || activeTab === 'document-detail') && (
              <div
                className="shrink-0 border-l border-border bg-card flex flex-col transition-all duration-300"
                style={{ width: annotationOpen ? 320 : 48 }}
              >
                <button
                  className="flex items-center gap-2 px-3 py-3 border-b border-border w-full text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setAnnotationOpen(v => !v)}
                >
                  <MessageSquare className="w-4 h-4 text-[var(--color-lg-info)] shrink-0" />
                  {annotationOpen && <span className="flex-1 text-[13px] font-semibold text-foreground">Review Annotations</span>}
                  {annotationOpen
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                    : <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  }
                </button>

                {annotationOpen && (
                  <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
                    {annotationsSubmitted && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded text-[12px] bg-[var(--color-lg-success-subtle)] text-[var(--color-lg-success)] border border-[var(--color-lg-success)]/30">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Annotations saved. You can update and re-submit.
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Flag for Rework</p>
                      <div className="flex flex-col gap-2">
                        {sortedDocs.map(doc => (
                          <label key={doc.id} className="flex items-start gap-2 cursor-pointer group">
                            <Checkbox checked={flaggedDocIds.has(doc.id)} onCheckedChange={() => toggleFlagDoc(doc.id)} className="mt-0.5 shrink-0" />
                            <span className={`text-[12px] leading-snug select-none ${flaggedDocIds.has(doc.id) ? 'text-[var(--color-lg-error)] font-medium' : 'text-foreground group-hover:text-foreground'}`}>
                              {doc.name.length > 36 ? doc.name.slice(0, 33) + '…' : doc.name}
                              <span className="ml-1 text-muted-foreground font-normal">({ROLE_LABELS[doc.document_role]})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">General Comment</p>
                      <Textarea
                        placeholder="Add observations, concerns, or notes for the preparer…"
                        value={annotationComment}
                        onChange={e => setAnnotationComment(e.target.value)}
                        className="text-[13px] min-h-[100px] resize-none"
                      />
                    </div>
                    <Button size="sm" className="w-full gap-1.5" onClick={handleSubmitAnnotations}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      {annotationsSubmitted ? 'Update Annotations' : 'Submit Annotations'}
                    </Button>
                    {flaggedDocIds.size > 0 && (
                      <p className="text-[11px] text-[var(--color-lg-error)] text-center">
                        {flaggedDocIds.size} document{flaggedDocIds.size !== 1 ? 's' : ''} flagged for rework
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky bottom action bar — Approver only ─────────────────── */}
          {isApprover && pkg && (
            <div className="flex-shrink-0 border-t bg-background px-6 py-3 flex items-center justify-between gap-3">
              <p className="text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">{pkg.record_label}</span>
                {' · '}{pkg.id}{' · '}{pkg.document_count} document{pkg.document_count !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)]"
                  onClick={() => setApproverAction('reject')}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button size="sm"
                  className="gap-1.5 bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white"
                  onClick={() => setApproverAction('approve')}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Change Role dialog ───────────────────────────────────────────── */}
      <Dialog open={!!changeRoleDoc} onOpenChange={open => { if (!open) { setChangeRoleDoc(null); setPendingRole(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4" /> Change Document Role
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              Reclassify "{changeRoleDoc?.name}" to a different role. This will trigger a package re-assembly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">New Role</label>
            <Select value={pendingRole} onValueChange={v => setPendingRole(v as DocumentRole)}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select role…" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map(r => (
                  <SelectItem key={r} value={r} className="text-[13px]">{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setChangeRoleDoc(null); setPendingRole(""); }}>Cancel</Button>
            <Button size="sm" disabled={!pendingRole || pendingRole === changeRoleDoc?.document_role} onClick={handleChangeRole}>
              Apply & Re-assemble
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approver Confirm Dialog ──────────────────────────────────────── */}
      <Dialog open={!!approverAction} onOpenChange={open => { if (!open) { setApproverAction(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approverAction === 'approve'
                ? <><ThumbsUp className="w-4 h-4 text-[var(--color-lg-success)]" /> Approve Package</>
                : <><AlertOctagon className="w-4 h-4 text-[var(--color-lg-error)]" /> Reject Package</>
              }
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {approverAction === 'approve'
                ? `Approving ${pkg.id} will advance it to the Record stage. This action cannot be undone.`
                : `Rejecting ${pkg.id} will return it to the Preparer for rework.`
              }
            </DialogDescription>
          </DialogHeader>
          {approverAction === 'reject' && (
            <div className="py-2">
              <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">Rejection Reason</label>
              <Textarea
                placeholder="Describe what needs to be corrected…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="text-[13px] min-h-[80px] resize-none"
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setApproverAction(null); setRejectReason(""); }}>Cancel</Button>
            <Button size="sm"
              className={approverAction === 'approve' ? 'bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white' : ''}
              variant={approverAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleApproverConfirm}
            >
              {approverAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
