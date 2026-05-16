/**
 * PackagesComposition — FC-3 Screen 3.1
 * Screen key: packages-composition
 * Route: /packages/:contractId
 * Role: Preparer / Lease Admin
 *
 * Design: Structured Authority
 * Prompt 3.1: Header with "Validated" badge and document count.
 *   Horizontal timeline: nodes sorted by chronological_order.
 *   Base contract node filled; others outlined.
 *   Auto-promotion info badge (accent-subtle) when auto_promoted = true.
 *   Document table: name, role badge, effective date, extraction status, actions.
 *   Completeness indicator green bar.
 *   Action bar: Add Document, View Flags (error badge), Proceed to Approval.
 *
 * Data model refs: ContractPackage (auto_promoted, status, document_count),
 *   PackageDocument (document_role, chronological_order, effective_date),
 *   PackageFlag (status, severity)
 */

import { useLocation } from "wouter";
import {
  FileText, Plus, Flag, ChevronRight, Info,
  CheckCircle2, AlertTriangle, Clock, MoreHorizontal, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

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

// TODO: Backend integration required
const MOCK_PACKAGE = {
  id: "PKG-2026-0041",
  record_label: "Office Tower — 350 Fifth Ave",
  status: "validated",
  document_count: 4,
  auto_promoted: true,
  promotion_triggered_at: "2026-05-14T09:22:00Z",
  open_blocking_flags: 0,
  open_warning_flags: 1,
};

const MOCK_DOCUMENTS: PackageDoc[] = [
  { id:"doc1", chronological_order:1, name:"Office-Tower-Base-Lease-2022.pdf",       document_role:"base_contract", effective_date:"2022-01-01", extraction_status:"complete",    file_size:"9.4 MB" },
  { id:"doc2", chronological_order:2, name:"Office-Tower-Amendment-1-2023.pdf",       document_role:"amendment",     effective_date:"2023-06-01", extraction_status:"complete",    file_size:"2.1 MB" },
  { id:"doc3", chronological_order:3, name:"Office-Tower-Amendment-3-2026.pdf",       document_role:"amendment",     effective_date:"2026-04-01", extraction_status:"in_progress", file_size:"1.8 MB" },
  { id:"doc4", chronological_order:4, name:"Office-Tower-Exhibit-A-FloorPlan.pdf",    document_role:"exhibit",       effective_date:"2022-01-01", extraction_status:"complete",    file_size:"4.2 MB" },
];

const ROLE_LABELS: Record<DocumentRole, string> = {
  base_contract:"Base Contract", amendment:"Amendment", addendum:"Addendum",
  exhibit:"Exhibit", schedule:"Schedule", notice:"Notice", supporting:"Supporting",
};

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

export default function PackagesComposition() {
  const _screenKey = SCREEN_KEYS.PACKAGES_COMPOSITION;
  const [, navigate] = useLocation();

  const pkg = MOCK_PACKAGE;
  const docs = [...MOCK_DOCUMENTS].sort((a, b) => a.chronological_order - b.chronological_order);
  const completeness = docs.length === 0 ? 0 : Math.round((docs.filter(d => d.extraction_status === "complete").length / docs.length) * 100);
  const totalOpenFlags = pkg.open_blocking_flags + pkg.open_warning_flags;
  const canProceed = pkg.open_blocking_flags === 0;

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">Contract Package</h1>
            <span className="badge-valid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated
            </span>
          </div>
          <p className="page-subtitle">{pkg.record_label} · {pkg.id} · {pkg.document_count} documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </Button>
          <Button
            variant="outline" size="sm"
            className="gap-1.5 border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)]"
            onClick={() => navigate(`/packages/${pkg.id}/flags`)}
          >
            <Flag className="w-3.5 h-3.5" /> View Flags
            {totalOpenFlags > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-lg-error)] text-white text-[10px] font-bold">{totalOpenFlags}</span>
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={!canProceed} className="gap-1.5" onClick={() => navigate("/approvals/queue")}>
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
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5">

        {/* Auto-promotion badge */}
        {pkg.auto_promoted && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-blue-200 text-[13px]" style={{ background: "var(--color-lg-accent-subtle)" }}>
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
            {docs.map((doc, i) => <TimelineNode key={doc.id} doc={doc} isLast={i === docs.length - 1} />)}
          </div>
        </div>

        {/* Document table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-[13px] font-semibold text-foreground">Documents</h2>
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
              {docs.map(doc => {
                const extCfg = EXT_CONFIG[doc.extraction_status];
                return (
                  <tr key={doc.id}>
                    <td className="font-mono text-[12px] text-muted-foreground">{doc.chronological_order}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[260px]">{doc.name}</span>
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
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[13px]">
                          <DropdownMenuItem onClick={() => navigate("/extraction/verify")}>View Extraction</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove from Package</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
