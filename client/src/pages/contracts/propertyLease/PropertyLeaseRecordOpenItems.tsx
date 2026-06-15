/**
 * RecordTabOpenItems — Tab component consumed by RecordsDetail
 * FC-5 Screen 5.3 Open Items tab
 *
 * Shows: open action items, deferred fields (with age-based severity),
 * pending corrections, and outstanding flags — all with status badges.
 *
 * Spec: Deferred fields tracker — success <7d, warning <30d, error >30d
 * Data model refs: DeferredField, PendingCorrection, OpenFlag
 */
import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Flag, Edit3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RecordTabOpenItemsProps {
  recordId: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /api/records/:id/open-items

type ActionItemStatus = "open" | "in_progress" | "resolved" | "overdue";
interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: ActionItemStatus;
  priority: "high" | "medium" | "low";
  assigned_to: string;
  due_date: string;
  created_at: string;
}

const MOCK_ACTION_ITEMS: ActionItem[] = [
  {
    id: "ai-001",
    title: "Confirm Renewal Option Exercise Deadline",
    description: "Tenant must provide written notice by Sep 30, 2031. Lease Admin to confirm with legal team.",
    status: "open",
    priority: "high",
    assigned_to: "J. Martinez",
    due_date: "2026-06-30",
    created_at: "2026-05-10",
  },
  {
    id: "ai-002",
    title: "Obtain Landlord Consent for Sublease",
    description: "Pending written consent from Fifth Ave Properties LLC for partial sublease of Floor 14.",
    status: "in_progress",
    priority: "high",
    assigned_to: "M. Thompson",
    due_date: "2026-06-15",
    created_at: "2026-05-08",
  },
  {
    id: "ai-003",
    title: "Reconcile CAM Charges — Q1 2026",
    description: "Common area maintenance reconciliation for Q1 2026 not yet received from landlord.",
    status: "overdue",
    priority: "medium",
    assigned_to: "A. Chen",
    due_date: "2026-05-31",
    created_at: "2026-04-01",
  },
  {
    id: "ai-004",
    title: "Update Insurance Certificate",
    description: "Annual insurance certificate renewal due. Current certificate expired May 1, 2026.",
    status: "open",
    priority: "medium",
    assigned_to: "J. Martinez",
    due_date: "2026-07-01",
    created_at: "2026-05-15",
  },
];

type DeferredSeverity = "success" | "warning" | "error";
interface DeferredField {
  id: string;
  field_name: string;
  reason: string;
  deferred_by: string;
  deferred_at: string;
  days_deferred: number;
}

const MOCK_DEFERRED_FIELDS: DeferredField[] = [
  {
    id: "df-001",
    field_name: "Parking Stalls Included",
    reason: "Awaiting confirmation from lease schedule exhibit",
    deferred_by: "J. Martinez",
    deferred_at: "2026-05-12",
    days_deferred: 4,
  },
  {
    id: "df-002",
    field_name: "HVAC Maintenance Responsibility",
    reason: "Conflicting language in base contract vs. Amendment 2",
    deferred_by: "M. Thompson",
    deferred_at: "2026-04-28",
    days_deferred: 18,
  },
  {
    id: "df-003",
    field_name: "Tenant Improvement Allowance — Final Amount",
    reason: "Pending final invoice from contractor",
    deferred_by: "A. Chen",
    deferred_at: "2026-03-10",
    days_deferred: 67,
  },
];

interface PendingCorrection {
  id: string;
  field_name: string;
  original_value: string;
  proposed_value: string;
  raised_by: string;
  raised_at: string;
  status: "pending" | "accepted" | "rejected";
}

const MOCK_CORRECTIONS: PendingCorrection[] = [
  {
    id: "pc-001",
    field_name: "Base Rent Amount",
    original_value: "$42,000/mo",
    proposed_value: "$42,500/mo",
    raised_by: "AI Agent",
    raised_at: "2026-05-16",
    status: "pending",
  },
  {
    id: "pc-002",
    field_name: "Escalation Rate",
    original_value: "2.5%",
    proposed_value: "3.0%",
    raised_by: "J. Martinez",
    raised_at: "2026-05-14",
    status: "pending",
  },
];

interface OpenFlag {
  id: string;
  flag_type: "blocking" | "warning" | "info";
  description: string;
  raised_by: string;
  raised_at: string;
}

const MOCK_FLAGS: OpenFlag[] = [
  {
    id: "fl-001",
    flag_type: "blocking",
    description: "Multiple base contracts detected — package requires reclassification before final approval",
    raised_by: "System",
    raised_at: "2026-05-16",
  },
  {
    id: "fl-002",
    flag_type: "warning",
    description: "Lease term exceeds 10 years — Controller sign-off required per policy §4.2",
    raised_by: "AI Agent",
    raised_at: "2026-05-15",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeferredSeverity(days: number): DeferredSeverity {
  if (days < 7) return "success";
  if (days < 30) return "warning";
  return "error";
}

const DEFERRED_SEVERITY_STYLES: Record<DeferredSeverity, { badge: string; dot: string; label: string }> = {
  success: { badge: "badge-valid",      dot: "bg-[var(--color-lg-success)]", label: "Recent" },
  warning: { badge: "badge-warning",    dot: "bg-[var(--color-lg-warning)]", label: "Aging" },
  error:   { badge: "badge-invalid",    dot: "bg-[var(--color-lg-error)]",   label: "Overdue" },
};

const ACTION_STATUS_STYLES: Record<ActionItemStatus, { badge: string; label: string }> = {
  open:        { badge: "badge-processing", label: "Open" },
  in_progress: { badge: "badge-warning",    label: "In Progress" },
  resolved:    { badge: "badge-valid",      label: "Resolved" },
  overdue:     { badge: "badge-invalid",    label: "Overdue" },
};

const PRIORITY_STYLES: Record<string, string> = {
  high:   "text-[var(--color-lg-error)]",
  medium: "text-[var(--color-lg-warning)]",
  low:    "text-muted-foreground",
};

const FLAG_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  blocking: {
    bg: "var(--color-lg-error-subtle)",
    border: "var(--color-lg-error)",
    icon: <XCircle className="w-4 h-4" style={{ color: "var(--color-lg-error)" }} />,
  },
  warning: {
    bg: "var(--color-lg-warning-subtle)",
    border: "var(--color-lg-warning)",
    icon: <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-lg-warning)" }} />,
  },
  info: {
    bg: "var(--color-lg-info-subtle)",
    border: "var(--color-lg-info)",
    icon: <Flag className="w-4 h-4" style={{ color: "var(--color-lg-info)" }} />,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecordTabOpenItems({ recordId }: RecordTabOpenItemsProps) {
  const [corrections, setCorrections] = useState(MOCK_CORRECTIONS);
  const [showAllActions, setShowAllActions] = useState(false);

  const visibleActions = showAllActions ? MOCK_ACTION_ITEMS : MOCK_ACTION_ITEMS.slice(0, 3);

  function acceptCorrection(id: string) {
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "accepted" } : c));
    toast.success("Correction accepted — field updated");
  }

  function rejectCorrection(id: string) {
    setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    toast.error("Correction rejected");
  }

  const openCount = MOCK_ACTION_ITEMS.filter(a => a.status === "open" || a.status === "overdue").length;
  const pendingCorrectionsCount = corrections.filter(c => c.status === "pending").length;
  const overdueDeferred = MOCK_DEFERRED_FIELDS.filter(d => getDeferredSeverity(d.days_deferred) === "error").length;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open Actions",        value: openCount,                icon: <Clock className="w-4 h-4" />,          color: "var(--color-lg-warning)" },
          { label: "Pending Corrections", value: pendingCorrectionsCount,  icon: <Edit3 className="w-4 h-4" />,          color: "var(--color-lg-info)" },
          { label: "Deferred Fields",     value: MOCK_DEFERRED_FIELDS.length, icon: <FileText className="w-4 h-4" />,   color: "var(--color-lg-primary)" },
          { label: "Overdue Deferred",    value: overdueDeferred,          icon: <AlertTriangle className="w-4 h-4" />, color: "var(--color-lg-error)" },
        ].map(tile => (
          <div key={tile.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${tile.color}18`, color: tile.color }}>
              {tile.icon}
            </span>
            <div>
              <p className="text-[20px] font-bold text-foreground leading-none">{tile.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{tile.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Outstanding flags */}
      {MOCK_FLAGS.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">Outstanding Flags ({MOCK_FLAGS.length})</h3>
          {MOCK_FLAGS.map(flag => {
            const style = FLAG_STYLES[flag.flag_type] || FLAG_STYLES.info;
            return (
              <div
                key={flag.id}
                className="flex items-start gap-3 rounded-lg px-4 py-3.5 border"
                style={{ background: style.bg, borderColor: style.border }}
              >
                <span className="shrink-0 mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{flag.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Raised by {flag.raised_by} · {new Date(flag.raised_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${flag.flag_type === "blocking" ? "badge-invalid" : flag.flag_type === "warning" ? "badge-warning" : "badge-processing"}`}>
                  {flag.flag_type.charAt(0).toUpperCase() + flag.flag_type.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Action items */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Action Items ({MOCK_ACTION_ITEMS.length})</h3>
          <span className="text-[11px] text-muted-foreground">{openCount} requiring attention</span>
        </div>
        <div className="divide-y divide-border">
          {visibleActions.map(item => (
            <div key={item.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-foreground">{item.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${ACTION_STATUS_STYLES[item.status].badge}`}>
                    {ACTION_STATUS_STYLES[item.status].label}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">{item.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-muted-foreground">Assigned: {item.assigned_to}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className={`text-[11px] font-semibold ${PRIORITY_STYLES[item.priority]}`}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
                  </span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {new Date(item.due_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {MOCK_ACTION_ITEMS.length > 3 && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowAllActions(!showAllActions)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-[var(--color-lg-primary)] hover:bg-[var(--color-lg-accent-subtle)] transition-colors"
            >
              {showAllActions ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show all {MOCK_ACTION_ITEMS.length} items</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Deferred fields tracker */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Deferred Fields Tracker ({MOCK_DEFERRED_FIELDS.length})</h3>
          <span className="text-[11px] text-muted-foreground">Age: &lt;7d success · &lt;30d warning · &gt;30d overdue</span>
        </div>
        <div className="divide-y divide-border">
          {MOCK_DEFERRED_FIELDS.map(field => {
            const severity = getDeferredSeverity(field.days_deferred);
            const style = DEFERRED_SEVERITY_STYLES[severity];
            return (
              <div key={field.id} className="px-5 py-4 flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-foreground">{field.field_name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${style.badge}`}>
                      {style.label} · {field.days_deferred}d
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{field.reason}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Deferred by {field.deferred_by} · {new Date(field.deferred_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending corrections */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-foreground">Pending Corrections ({corrections.length})</h3>
          <span className="text-[11px] text-muted-foreground">{pendingCorrectionsCount} awaiting decision</span>
        </div>
        <div className="divide-y divide-border">
          {corrections.map(corr => (
            <div key={corr.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-foreground">{corr.field_name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    corr.status === "pending"  ? "badge-warning" :
                    corr.status === "accepted" ? "badge-valid"   : "badge-invalid"
                  }`}>
                    {corr.status.charAt(0).toUpperCase() + corr.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="text-muted-foreground line-through">{corr.original_value}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{corr.proposed_value}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Raised by {corr.raised_by} · {new Date(corr.raised_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </p>
              </div>
              {corr.status === "pending" && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px] border-[var(--color-lg-success)] text-[var(--color-lg-success)] hover:bg-[var(--color-lg-success-subtle)]"
                    onClick={() => acceptCorrection(corr.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px] border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)]"
                    onClick={() => rejectCorrection(corr.id)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
