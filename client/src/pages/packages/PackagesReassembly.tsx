/**
 * PackagesReassembly — FC-3 Screen 3.3
 * Screen key: packages-reassembly
 * Route: /packages/:packageId/reassembly
 * Role: Preparer / Lease Admin
 *
 * Design: Structured Authority
 * Prompt 3.3: Full-width warning banner (warning-subtle background, 4px warning left border).
 *   Title "Package Re-Assembly Triggered." Trigger type badge.
 *   BEFORE/AFTER composition comparison side by side.
 *   Results: new flags raised (error badge), preserved resolutions (success badge).
 *   "Dismiss and Review Flags" primary button.
 *
 * Data model refs: ContractPackage (status), PackageDocument, PackageFlag
 */

import { useLocation, useParams } from "wouter";
import {
  AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  FileText, Plus, Minus, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type DocumentRole = "base_contract" | "amendment" | "addendum" | "exhibit" | "schedule" | "notice" | "supporting";

interface DocSnapshot {
  id: string;
  name: string;
  document_role: DocumentRole;
  effective_date: string;
}

// TODO: Backend integration required — GET /api/packages/:id/reassembly-event
const REASSEMBLY_EVENT = {
  triggered_at: "2026-05-16T08:44:00Z",
  trigger_type: "document_added",
  trigger_label: "Document Added",
  triggered_by: "A. Chen",
  new_flags_raised: 2,
  preserved_resolutions: 1,
  before_docs: [
    { id:"b1", name:"Office-Tower-Base-Lease-2022.pdf",    document_role:"base_contract" as DocumentRole, effective_date:"2022-01-01" },
    { id:"b2", name:"Office-Tower-Amendment-1-2023.pdf",   document_role:"amendment"     as DocumentRole, effective_date:"2023-06-01" },
    { id:"b3", name:"Office-Tower-Exhibit-A-FloorPlan.pdf",document_role:"exhibit"       as DocumentRole, effective_date:"2022-01-01" },
  ] as DocSnapshot[],
  after_docs: [
    { id:"a1", name:"Office-Tower-Base-Lease-2022.pdf",    document_role:"base_contract" as DocumentRole, effective_date:"2022-01-01" },
    { id:"a2", name:"Office-Tower-Amendment-1-2023.pdf",   document_role:"amendment"     as DocumentRole, effective_date:"2023-06-01" },
    { id:"a3", name:"Office-Tower-Amendment-3-2026.pdf",   document_role:"amendment"     as DocumentRole, effective_date:"2026-04-01" },
    { id:"a4", name:"Office-Tower-Exhibit-A-FloorPlan.pdf",document_role:"exhibit"       as DocumentRole, effective_date:"2022-01-01" },
  ] as DocSnapshot[],
};

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

function DocRow({ doc, isNew, isRemoved }: { doc: DocSnapshot; isNew?: boolean; isRemoved?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-[13px] ${
      isNew     ? "border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)]"
      : isRemoved ? "border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)] opacity-70"
      : "border-border bg-card"
    }`}>
      {isNew     && <Plus className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
      {isRemoved && <Minus className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-error)" }} />}
      {!isNew && !isRemoved && <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
      <span className={`flex-1 font-medium truncate ${isRemoved ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {doc.name}
      </span>
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${ROLE_BADGE_CLASSES[doc.document_role]}`}>
        {ROLE_LABELS[doc.document_role]}
      </span>
      <span className="text-[11px] text-muted-foreground shrink-0">{doc.effective_date}</span>
    </div>
  );
}

export default function PackagesReassembly() {
  const _screenKey = SCREEN_KEYS.PACKAGES_REASSEMBLY;
  const [, navigate] = useLocation();
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId ?? 'PKG-2026-0041';
  const PACKAGES_LABEL: Record<string, string> = {
    'PKG-2026-0041': 'Office Tower — 350 Fifth Ave',
    'PKG-2026-002':  'Globex Ground Lease Package',
    'PKG-2026-001':  'Acme Corp Retail Package',
  };
  const packageLabel = PACKAGES_LABEL[packageId] ?? packageId;

  // BR5: Read live event from sessionStorage if available (set by PackagesComposition on Change Role / Remove)
  // Falls back to REASSEMBLY_EVENT mock for direct navigation
  const storedRaw = sessionStorage.getItem('leasegov_reassembly_event');
  const ev = storedRaw ? (JSON.parse(storedRaw) as typeof REASSEMBLY_EVENT) : REASSEMBLY_EVENT;
  const beforeIds = new Set(ev.before_docs.map(d => d.name));
  const afterIds  = new Set(ev.after_docs.map(d => d.name));
  const addedDocs   = ev.after_docs.filter(d => !beforeIds.has(d.name));
  const removedDocs = ev.before_docs.filter(d => !afterIds.has(d.name));

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Package Re-Assembly</h1>
            <ScreenNumberBadge screenKey="packages-reassembly" />
          </div>
          <p className="page-subtitle">{packageId} · {packageLabel}</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5 max-w-5xl">

        {/* Full-width warning banner */}
        <div
          className="w-full rounded-lg overflow-hidden"
          style={{
            background: "var(--color-lg-warning-subtle)",
            borderLeft: "4px solid var(--color-lg-warning)",
            border: "1px solid rgba(245,127,23,0.3)",
            borderLeftWidth: "4px",
          }}
        >
          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background:"rgba(245,127,23,0.15)" }}>
                <RefreshCw className="w-5 h-5" style={{ color:"var(--color-lg-warning)" }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-[16px] font-semibold text-foreground">Package Re-Assembly Triggered</h2>
                  <span className="badge-warning inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold">
                    {ev.trigger_label}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Triggered by <strong>{ev.triggered_by}</strong> on{" "}
                  {new Date(ev.triggered_at).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" })}.
                  The package composition has changed and flags have been re-evaluated.
                </p>

                {/* Results badges */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="badge-invalid inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    {ev.new_flags_raised} new flag{ev.new_flags_raised !== 1 ? "s" : ""} raised
                  </span>
                  <span className="badge-valid inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ev.preserved_resolutions} resolution{ev.preserved_resolutions !== 1 ? "s" : ""} preserved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BEFORE / AFTER comparison */}
        <div className="grid grid-cols-2 gap-5">
          {/* BEFORE */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Before</span>
              <span className="text-[12px] text-muted-foreground">· {ev.before_docs.length} documents</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {ev.before_docs.map(doc => (
                <DocRow key={doc.id} doc={doc} isRemoved={!afterIds.has(doc.name)} />
              ))}
            </div>
          </div>

          {/* AFTER */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">After</span>
              <span className="text-[12px] text-muted-foreground">· {ev.after_docs.length} documents</span>
              {addedDocs.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold" style={{ color:"var(--color-lg-success)" }}>
                  +{addedDocs.length} added
                </span>
              )}
              {removedDocs.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold" style={{ color:"var(--color-lg-error)" }}>
                  -{removedDocs.length} removed
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              {ev.after_docs.map(doc => (
                <DocRow key={doc.id} doc={doc} isNew={!beforeIds.has(doc.name)} />
              ))}
            </div>
          </div>
        </div>

        {/* Change summary */}
        {(addedDocs.length > 0 || removedDocs.length > 0) && (
          <div className="bg-card border border-border rounded-lg px-5 py-4">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Change Summary</h3>
            <div className="flex flex-col gap-2">
              {addedDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-[13px]">
                  <Plus className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                  <span className="text-foreground font-medium">{doc.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Added as {ROLE_LABELS[doc.document_role]}</span>
                </div>
              ))}
              {removedDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 text-[13px]">
                  <Minus className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
                  <span className="text-foreground font-medium line-through">{doc.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Removed from package</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-muted-foreground">
            Review and resolve all new flags before proceeding to approval.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/packages/${packageId}`)}>
              Back to Package
            </Button>
            <Button
              className="gap-2"
              onClick={() => navigate(`/packages/${packageId}/flags`)}
            >
              <AlertTriangle className="w-4 h-4" />
              Dismiss and Review Flags
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
