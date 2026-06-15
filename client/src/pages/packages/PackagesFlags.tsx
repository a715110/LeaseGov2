/**
 * PackagesFlags — FC-3 Screen 3.2
 * Screen key: packages-flags
 * Route: /packages/:packageId/flags
 * Role: Preparer / Lease Admin
 *
 * Design: Structured Authority
 * Prompt 3.2: Header "Package Flags" with "2 Open" error badge.
 *   Flag cards with severity-based border colors:
 *     blocking → var(--color-lg-error) border
 *     warning  → var(--color-lg-warning) border
 *     resolved → var(--color-lg-success) border
 *   Open flag cards show: type label, description, affected documents,
 *     conflicting values (for conflicting_terms), resolution_rationale textarea,
 *     Resolve button (disabled until rationale entered).
 *   Resolved flag cards show: rationale, resolved_by, resolved_at.
 *   "Proceed to Approval" disabled while any open blocking flag exists.
 *
 * Data model refs: PackageFlag (flag_type, severity, status,
 *   resolution_rationale, affected_document_ids, affected_field_names)
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  AlertTriangle, CheckCircle2, XCircle, ChevronRight,
  AlertCircle, FileText, User, Calendar, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type FlagType = "missing_base_contract" | "multiple_base_contracts" | "conflicting_terms" | "duplicate_amendment" | "missing_exhibit" | "supersession_ambiguity";
type FlagSeverity = "blocking" | "warning";
type FlagStatus = "open" | "resolved" | "deferred" | "escalated";

interface PackageFlag {
  id: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  status: FlagStatus;
  description: string;
  affected_document_ids: string[];
  affected_field_names: string[];
  conflicting_values?: { field: string; doc_a: string; doc_b: string }[];
  resolution_rationale: string;
  resolved_by?: string;
  resolved_at?: string;
}

// TODO: Backend integration required — GET /api/packages/:id/flags
const INITIAL_FLAGS: PackageFlag[] = [
  {
    id: "flag1",
    flag_type: "supersession_ambiguity",
    severity: "warning",
    status: "resolved",
    description: "Amendment 1 (2023-06-01) may supersede clauses in the Base Lease but does not explicitly reference the superseded sections.",
    affected_document_ids: ["doc1", "doc2"],
    affected_field_names: ["rent_escalation", "maintenance_obligations"],
    resolution_rationale: "Reviewed with legal team. Amendment 1 Section 4 confirms supersession of Base Lease Section 12. Rationale documented in legal review memo LR-2026-041.",
    resolved_by: "J. Martinez",
    resolved_at: "2026-05-13T14:30:00Z",
  },
  {
    id: "flag2",
    flag_type: "conflicting_terms",
    severity: "blocking",
    status: "open",
    description: "Conflicting base rent amounts found between the Base Lease and Amendment 3. Both documents have been fully extracted and verified.",
    affected_document_ids: ["doc1", "doc3"],
    affected_field_names: ["base_rent_amount"],
    conflicting_values: [
      { field: "Base Rent Amount", doc_a: "$38,500/month (Base Lease 2022)", doc_b: "$42,500/month (Amendment 3 2026)" },
    ],
    resolution_rationale: "",
    resolved_by: undefined,
    resolved_at: undefined,
  },
  {
    id: "flag3",
    flag_type: "missing_exhibit",
    severity: "warning",
    status: "open",
    description: "The Base Lease references Exhibit B (Parking Schedule) in Section 9.2, but no document with role 'exhibit' matching this description has been added to the package.",
    affected_document_ids: ["doc1"],
    affected_field_names: [],
    resolution_rationale: "",
    resolved_by: undefined,
    resolved_at: undefined,
  },
];

const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  missing_base_contract:   "Missing Base Contract",
  multiple_base_contracts: "Multiple Base Contracts",
  conflicting_terms:       "Conflicting Terms",
  duplicate_amendment:     "Duplicate Amendment",
  missing_exhibit:         "Missing Exhibit",
  supersession_ambiguity:  "Supersession Ambiguity",
};

function getSeverityBorderStyle(severity: FlagSeverity, status: FlagStatus) {
  if (status === "resolved") return { borderColor: "var(--color-lg-success)", borderWidth: "1px" };
  if (severity === "blocking") return { borderColor: "var(--color-lg-error)", borderWidth: "1px" };
  return { borderColor: "var(--color-lg-warning)", borderWidth: "1px" };
}

function getSeverityBadgeCls(severity: FlagSeverity, status: FlagStatus) {
  if (status === "resolved") return "badge-valid";
  if (severity === "blocking") return "badge-invalid";
  return "badge-warning";
}

export default function PackagesFlags() {
  const _screenKey = SCREEN_KEYS.PACKAGES_FLAGS;
  const [, navigate] = useLocation();
  const params = useParams<{ packageId: string }>();
  const packageId = params.packageId ?? 'PKG-2026-0041';
  const [flags, setFlags] = useState<PackageFlag[]>(INITIAL_FLAGS);

  const openBlockingCount = flags.filter(f => f.status === "open" && f.severity === "blocking").length;
  const openCount = flags.filter(f => f.status === "open").length;
  const canProceed = openBlockingCount === 0;

  function setRationale(id: string, text: string) {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, resolution_rationale: text } : f));
  }

  function resolveFlag(id: string) {
    // TODO: Backend integration required — POST /api/packages/:id/flags/:flagId/resolve
    setFlags(prev => prev.map(f =>
      f.id === id
        ? { ...f, status: "resolved" as FlagStatus, resolved_by: "Current User", resolved_at: new Date().toISOString() }
        : f
    ));
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Package Flags</h1>
              <ScreenNumberBadge screenKey="packages-flags" />
            </div>
            {openCount > 0 && (
              <span className="badge-invalid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                <XCircle className="w-3.5 h-3.5" /> {openCount} Open
              </span>
            )}
            {openCount === 0 && (
              <span className="badge-valid inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Resolved
              </span>
            )}
          </div>
          <p className="page-subtitle">{packageId} · Office Tower — 350 Fifth Ave</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/packages/${packageId}`)}>
            Back to Package
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
                {openBlockingCount} blocking flag{openBlockingCount !== 1 ? "s" : ""} must be resolved
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4 max-w-4xl">
        {flags.map(flag => {
          const borderStyle = getSeverityBorderStyle(flag.severity, flag.status);
          const badgeCls = getSeverityBadgeCls(flag.severity, flag.status);
          const canResolve = flag.status === "open" && flag.resolution_rationale.trim().length > 10;

          return (
            <div
              key={flag.id}
              className="bg-card rounded-lg overflow-hidden"
              style={{ border: `${borderStyle.borderWidth} solid ${borderStyle.borderColor}` }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  {flag.status === "resolved"
                    ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--color-lg-success)" }} />
                    : flag.severity === "blocking"
                      ? <XCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--color-lg-error)" }} />
                      : <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--color-lg-warning)" }} />
                  }
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-foreground">{FLAG_TYPE_LABELS[flag.flag_type]}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badgeCls}`}>
                        {flag.status === "resolved" ? "Resolved" : flag.severity}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{flag.description}</p>
                  </div>
                </div>
              </div>

              {/* Affected documents */}
              {flag.affected_document_ids.length > 0 && (
                <div className="px-5 py-3 border-b border-border bg-muted/20">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Affected Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {flag.affected_document_ids.map(docId => (
                      <span key={docId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border text-[12px] text-foreground">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        {docId === "doc1" ? "Office-Tower-Base-Lease-2022.pdf"
                          : docId === "doc2" ? "Office-Tower-Amendment-1-2023.pdf"
                          : docId === "doc3" ? "Office-Tower-Amendment-3-2026.pdf"
                          : docId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflicting values (for conflicting_terms) */}
              {flag.conflicting_values && flag.conflicting_values.length > 0 && (
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conflicting Values</p>
                  {flag.conflicting_values.map((cv, i) => (
                    <div key={i} className="flex items-center gap-3 text-[13px]">
                      <span className="font-medium text-foreground w-36 shrink-0">{cv.field}</span>
                      <span className="px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-800 text-[12px]">{cv.doc_a}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-800 text-[12px]">{cv.doc_b}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolution section */}
              <div className="px-5 py-4">
                {flag.status === "resolved" ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Resolution Rationale</p>
                    <p className="text-[13px] text-foreground leading-relaxed">{flag.resolution_rationale}</p>
                    <div className="flex items-center gap-4 mt-1 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {flag.resolved_by}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {flag.resolved_at ? new Date(flag.resolved_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-foreground block mb-1.5">
                        Resolution Rationale <span className="text-[var(--color-lg-error)]">*</span>
                      </label>
                      <Textarea
                        value={flag.resolution_rationale}
                        onChange={e => setRationale(flag.id, e.target.value)}
                        placeholder="Required: describe how this flag has been resolved or why it can be dismissed…"
                        className="text-[13px] min-h-[80px] resize-none"
                      />
                      {flag.resolution_rationale.trim().length > 0 && flag.resolution_rationale.trim().length <= 10 && (
                        <p className="text-[11px] text-[var(--color-lg-error)] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Rationale must be at least 10 characters
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        disabled={!canResolve}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => resolveFlag(flag.id)}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
