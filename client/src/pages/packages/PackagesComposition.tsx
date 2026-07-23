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
 * BR1: Package auto-created when second document associated with record.
 * BR2: Only one Base Contract per package — multiple_base_contracts blocking flag auto-raised.
 * BR3: Proceed to Approval disabled while any open blocking flag exists.
 * BR4: Six flag types.
 * BR5: Change Role / Remove from Package triggers re-assembly navigation.
 *
 * Data model refs: ContractPackage (auto_promoted, status, document_count),
 *   PackageDocument (document_role, chronological_order, effective_date),
 *   PackageFlag (status, severity)
 */

import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  FileText, Plus, Flag, ChevronRight, Info, Tag,
  CheckCircle2, AlertTriangle, Clock, MoreHorizontal, ArrowRight, AlertCircle,
  Eye, ClipboardCheck, Lock
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

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

// TODO: Backend integration required — replace with GET /api/packages/:id
// ── Mock package data keyed by package ID ─────────────────────────────────
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

const PACKAGES_BY_ID: Record<string, { pkg: PackageMeta; docs: PackageDoc[] }> = {
  "PKG-2026-0041": {
    pkg: {
      id: "PKG-2026-0041",
      record_id: "mock-record-004",
      record_label: "Office Tower — 350 Fifth Ave",
      status: "validated",
      document_count: 4,
      auto_promoted: true,
      promotion_triggered_at: "2026-05-14T09:22:00Z",
      open_blocking_flags: 0,
      open_warning_flags: 1,
    },
    docs: [
      { id:"doc1", chronological_order:1, name:"Office-Tower-Base-Lease-2022.pdf",       document_role:"base_contract", effective_date:"2022-01-01", extraction_status:"complete",    file_size:"9.4 MB" },
      { id:"doc2", chronological_order:2, name:"Office-Tower-Amendment-1-2023.pdf",       document_role:"amendment",     effective_date:"2023-06-01", extraction_status:"complete",    file_size:"2.1 MB" },
      { id:"doc3", chronological_order:3, name:"Office-Tower-Amendment-3-2026.pdf",       document_role:"amendment",     effective_date:"2026-04-01", extraction_status:"in_progress", file_size:"1.8 MB" },
      { id:"doc4", chronological_order:4, name:"Office-Tower-Exhibit-A-FloorPlan.pdf",    document_role:"exhibit",       effective_date:"2022-01-01", extraction_status:"complete",    file_size:"4.2 MB" },
    ],
  },
  "PKG-2026-002": {
    pkg: {
      id: "PKG-2026-002",
      record_id: "mock-record-002",
      record_label: "Globex Ground Lease Package",
      status: "assembling",
      document_count: 2,
      auto_promoted: false,
      promotion_triggered_at: "2026-06-11T14:22:00Z",
      open_blocking_flags: 0,
      open_warning_flags: 0,
    },
    docs: [
      { id:"g1", chronological_order:1, name:"Globex-Ground-Lease-2021.pdf",    document_role:"base_contract", effective_date:"2021-03-01", extraction_status:"complete",    file_size:"7.2 MB" },
      { id:"g2", chronological_order:2, name:"Globex-Ground-Amendment-2024.pdf", document_role:"amendment",     effective_date:"2024-01-15", extraction_status:"not_started", file_size:"1.3 MB" },
    ],
  },
  "PKG-2026-001": {
    pkg: {
      id: "PKG-2026-001",
      record_id: "mock-record-001",
      record_label: "Acme Corp Retail Package",
      status: "pending",
      document_count: 3,
      auto_promoted: true,
      promotion_triggered_at: "2026-06-10T11:05:00Z",
      open_blocking_flags: 1,
      open_warning_flags: 0,
    },
    docs: [
      { id:"a1", chronological_order:1, name:"Acme-Retail-Lease-2020.pdf",       document_role:"base_contract", effective_date:"2020-07-01", extraction_status:"complete",    file_size:"5.6 MB" },
      { id:"a2", chronological_order:2, name:"Acme-Retail-Amendment-2022.pdf",   document_role:"amendment",     effective_date:"2022-11-01", extraction_status:"complete",    file_size:"0.9 MB" },
      { id:"a3", chronological_order:3, name:"Acme-Retail-Exhibit-B-Parking.pdf",document_role:"exhibit",       effective_date:"2020-07-01", extraction_status:"failed",      file_size:"2.1 MB" },
    ],
  },
};

/** Fallback for unknown package IDs (e.g. direct navigation to /packages) */
const FALLBACK_PACKAGE_ID = "PKG-2026-0041";

const INITIAL_PACKAGE = PACKAGES_BY_ID[FALLBACK_PACKAGE_ID].pkg;
const INITIAL_DOCUMENTS = PACKAGES_BY_ID[FALLBACK_PACKAGE_ID].docs;

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
  const { activeRole } = useRole();
  // Role-aware permissions:
  //   Preparer / Lease Admin → full edit surface
  //   Reviewer               → read-only; action bar shows "Review Package"
  //   All others             → read-only
  const isReviewer = activeRole === 'reviewer';
  const canEdit = activeRole === 'preparer' || activeRole === 'lease_admin';
  const params = useParams<{ contractId: string }>();
  // Resolve the package from the route param; fall back to the default mock if unknown
  const contractId = params.contractId ?? FALLBACK_PACKAGE_ID;
  const resolved = PACKAGES_BY_ID[contractId] ?? PACKAGES_BY_ID[FALLBACK_PACKAGE_ID];
  // ── State ──────────────────────────────────────────────────────────────────
  const [pkg, setPkg] = useState(resolved.pkg);
  const [docs, setDocs] = useState<PackageDoc[]>(resolved.docs);

  // Change Role dialog
  const [changeRoleDoc, setChangeRoleDoc] = useState<PackageDoc | null>(null);
  const [pendingRole, setPendingRole] = useState<DocumentRole | "">("");

  // ── BR2: Auto-detect multiple base contracts → raise blocking flag ─────────
  useEffect(() => {
    const baseCount = docs.filter(d => d.document_role === "base_contract").length;
    const hasMultipleBaseFlag = baseCount > 1;
    // Sync open_blocking_flags to reflect the auto-detected condition
    setPkg(prev => ({
      ...prev,
      open_blocking_flags: hasMultipleBaseFlag ? Math.max(prev.open_blocking_flags, 1) : 0,
    }));
  }, [docs]);

  const sortedDocs = [...docs].sort((a, b) => a.chronological_order - b.chronological_order);
  const completeness = docs.length === 0 ? 0 : Math.round((docs.filter(d => d.extraction_status === "complete").length / docs.length) * 100);
  const totalOpenFlags = pkg.open_blocking_flags + pkg.open_warning_flags;
  const canProceed = pkg.open_blocking_flags === 0;

  // ── Derived: multiple base contract warning ────────────────────────────────
  const baseContracts = docs.filter(d => d.document_role === "base_contract");
  const hasMultipleBase = baseContracts.length > 1;

  // ── BR5 helpers ───────────────────────────────────────────────────────────
  /** Navigate to the re-assembly screen, passing before/after snapshots via sessionStorage */
  function triggerReassembly(
    triggerType: "role_changed" | "document_removed",
    triggerLabel: string,
    beforeDocs: PackageDoc[],
    afterDocs: PackageDoc[],
  ) {
    // TODO: Backend integration — POST /api/packages/:id/reassembly
    const event = {
      triggered_at: new Date().toISOString(),
      trigger_type: triggerType,
      trigger_label: triggerLabel,
      triggered_by: "Current User", // TODO: replace with authenticated user
      new_flags_raised: afterDocs.filter(d => d.document_role === "base_contract").length > 1 ? 1 : 0,
      preserved_resolutions: 1,
      before_docs: beforeDocs.map(d => ({ id: d.id, name: d.name, document_role: d.document_role, effective_date: d.effective_date })),
      after_docs:  afterDocs.map(d => ({ id: d.id, name: d.name, document_role: d.document_role, effective_date: d.effective_date })),
    };
    sessionStorage.setItem("leasegov_reassembly_event", JSON.stringify(event));
    navigate(`/packages/${pkg.id}/reassembly`);
  }

  function handleChangeRole() {
    if (!changeRoleDoc || !pendingRole) return;
    const oldRole = changeRoleDoc.document_role;
    const newRole = pendingRole as DocumentRole;
    if (oldRole === newRole) { setChangeRoleDoc(null); return; }

    const beforeDocs = [...docs];
    const updatedDocs = docs.map(d => d.id === changeRoleDoc.id ? { ...d, document_role: newRole } : d);
    setDocs(updatedDocs);
    setChangeRoleDoc(null);
    setPendingRole("");

    toast.success(`Role changed to ${ROLE_LABELS[newRole]}`, {
      description: `"${changeRoleDoc.name}" was reclassified from ${ROLE_LABELS[oldRole]}.`,
    });

    // BR5: trigger re-assembly
    triggerReassembly("role_changed", "Role Changed", beforeDocs, updatedDocs);
  }

  function handleRemove(doc: PackageDoc) {
    const beforeDocs = [...docs];
    const updatedDocs = docs.filter(d => d.id !== doc.id).map((d, i) => ({ ...d, chronological_order: i + 1 }));
    setDocs(updatedDocs);

    // Undo toast (15s per project convention)
    toast.warning(`"${doc.name}" removed from package`, {
      duration: 15000,
      action: {
        label: "Undo",
        onClick: () => {
          setDocs(beforeDocs);
          toast.success("Removal undone");
        },
      },
    });

    // BR5: trigger re-assembly
    triggerReassembly("document_removed", "Document Removed", beforeDocs, updatedDocs);
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Contract Package</h1>
              <ScreenNumberBadge screenKey="packages-composition" />
            </div>
            <span className="badge-valid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated
            </span>
          </div>
          <p className="page-subtitle">{pkg.record_label} · {pkg.id} · {pkg.document_count} documents</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Role badge */}
          {isReviewer ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <Eye className="w-3.5 h-3.5" /> Reviewer View — Read Only
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
            <Button
              variant="outline" size="sm" className="gap-1.5"
              onClick={() => {
                sessionStorage.setItem('leasegov_add_doc_for', JSON.stringify({
                  packageId: pkg.id,
                  recordId: pkg.record_id,
                  recordLabel: pkg.record_label,
                }));
                navigate('/pipeline/dashboard');
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Document
            </Button>
          )}

          {/* View Flags — all roles */}
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

          {/* Primary CTA — differs by role */}
          {isReviewer ? (
            // Reviewer: "Review Package" → navigates to the review detail screen
            <Button
              className="gap-1.5"
              onClick={() => navigate("/approvals/queue")}
            >
              <ClipboardCheck className="w-4 h-4" /> Review Package <ChevronRight className="w-4 h-4" />
            </Button>
          ) : canEdit ? (
            // Preparer: "Proceed to Approval" — disabled while blocking flags exist
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
          ) : null}
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5">

        {/* BR2: Multiple base contracts blocking alert */}
        {hasMultipleBase && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-lg border text-[13px]"
            style={{ background: "var(--color-lg-error-subtle)", borderColor: "var(--color-lg-error)", borderLeftWidth: "4px" }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-lg-error)" }} />
            <div className="flex-1">
              <span className="font-semibold" style={{ color: "var(--color-lg-error)" }}>Multiple Base Contracts detected — blocking flag raised.</span>
              <span className="text-muted-foreground ml-1">
                Only one Base Contract is allowed per package. Found {baseContracts.length}. Reclassify the duplicate to resolve this flag.
              </span>
              {/* Quick-action: one reclassify button per duplicate Base Contract — Preparer / Lease Admin only */}
              {canEdit && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {baseContracts.map((dupeDoc, idx) => (
                    <button
                      key={dupeDoc.id}
                      onClick={() => { setChangeRoleDoc(dupeDoc); setPendingRole(dupeDoc.document_role); }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors"
                      style={{
                        borderColor: "var(--color-lg-error)",
                        color: "var(--color-lg-error)",
                        background: "transparent",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-lg-error-subtle)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      title={`Reclassify "${dupeDoc.name}"`}
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
            {sortedDocs.map((doc, i) => <TimelineNode key={doc.id} doc={doc} isLast={i === sortedDocs.length - 1} />)}
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
              {sortedDocs.map(doc => {
                const extCfg = EXT_CONFIG[doc.extraction_status];
                const isDuplicateBase = doc.document_role === "base_contract" && hasMultipleBase;
                return (
                  <tr key={doc.id} className={isDuplicateBase ? "bg-[var(--color-lg-error-subtle)]/40" : ""}>
                    <td className="font-mono text-[12px] text-muted-foreground">{doc.chronological_order}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[260px]">{doc.name}</span>
                        {isDuplicateBase && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 cursor-help" style={{ color: "var(--color-lg-error)" }} />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[12px]">
                              Duplicate Base Contract — reclassify or remove
                            </TooltipContent>
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
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[13px]">
                          <DropdownMenuItem onClick={() => navigate("/extraction/verify")}>View Extraction</DropdownMenuItem>
                          {/* BR5: Change Role / Remove — Preparer / Lease Admin only */}
                          {canEdit && (
                            <>
                              <DropdownMenuItem onClick={() => { setChangeRoleDoc(doc); setPendingRole(doc.document_role); }}>
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemove(doc)}
                              >
                                Remove from Package
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Change Role Dialog */}
      <Dialog open={!!changeRoleDoc} onOpenChange={open => { if (!open) { setChangeRoleDoc(null); setPendingRole(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Document Role</DialogTitle>
            <DialogDescription className="text-[13px]">
              Reclassifying this document will trigger package re-assembly and re-evaluate all flags.
            </DialogDescription>
          </DialogHeader>
          {changeRoleDoc && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded bg-muted text-[13px]">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{changeRoleDoc.name}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground">New Role</label>
                <Select value={pendingRole} onValueChange={v => setPendingRole(v as DocumentRole)}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select a role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => (
                      <SelectItem key={r} value={r} className="text-[13px]">
                        {ROLE_LABELS[r]}
                        {r === changeRoleDoc.document_role && <span className="ml-2 text-muted-foreground">(current)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pendingRole === "base_contract" && changeRoleDoc.document_role !== "base_contract" && hasMultipleBase && (
                <div className="flex items-start gap-2 px-3 py-2 rounded text-[12px]" style={{ background: "var(--color-lg-error-subtle)", color: "var(--color-lg-error)" }}>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  A Base Contract already exists. Changing to Base Contract will raise a blocking flag.
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setChangeRoleDoc(null); setPendingRole(""); }}>Cancel</Button>
            <Button
              size="sm"
              disabled={!pendingRole || pendingRole === changeRoleDoc?.document_role}
              onClick={handleChangeRole}
            >
              Confirm &amp; Re-Assemble
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
