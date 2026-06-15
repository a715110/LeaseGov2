/**
 * RecordTabWatchlist — Tab component consumed by RecordsDetail
 * FC-5 Screen 5.3 — Watchlist tab
 *
 * Spec: WatchlistEntry list for this contract record.
 * - Star toggle at top (mirrors Overview quick-action; persists in local state).
 * - If watchlisted: shows WatchlistEntry cards — reason, added_by, added_at,
 *   expiry_date, priority badge, notes, remove button.
 * - If not watchlisted: empty-state with "Add to Watchlist" CTA.
 * - "Add to Watchlist" dialog: reason dropdown, priority, expiry date, notes.
 * - Matched watchlist rules section (read-only, shows rule name + trigger condition).
 *
 * Data model refs: WatchlistEntry (record_id, reason, priority, added_by,
 *   added_at, expiry_date, notes, rule_id?)
 *
 * Design: Structured Authority — navy primary, amber warning star, Inter typography.
 */
import { useState } from "react";
import { Star, StarOff, Plus, X, Bell, BellOff, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WatchlistEntry {
  id: string;
  reason: string;
  priority: "high" | "medium" | "low";
  added_by: string;
  added_at: string;
  expiry_date: string | null;
  notes: string;
  rule_id: string | null;
  rule_name: string | null;
}

interface RecordTabWatchlistProps {
  recordId: string;
  isWatchlisted: boolean;
  onWatchlistToggle: () => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /api/records/:id/watchlist
const INITIAL_ENTRIES: WatchlistEntry[] = [
  {
    id: "we-001",
    reason: "option_assessment",
    priority: "high",
    added_by: "M. Thompson",
    added_at: "2026-04-10T09:30:00Z",
    expiry_date: "2026-09-30",
    notes: "Option exercise deadline approaching — confirm intent with business unit by Q3.",
    rule_id: "r1",
    rule_name: "Renewal Option — 12-Month Horizon",
  },
  {
    id: "we-002",
    reason: "rent_escalation",
    priority: "medium",
    added_by: "A. Chen",
    added_at: "2026-05-01T14:00:00Z",
    expiry_date: null,
    notes: "CPI clause triggers in Jan 2027 — verify index rate before next period-end.",
    rule_id: null,
    rule_name: null,
  },
];

const REASON_OPTIONS = [
  { value: "option_assessment",  label: "Option Assessment Due" },
  { value: "rent_escalation",    label: "Rent Escalation Upcoming" },
  { value: "expiry_approaching", label: "Lease Expiry Approaching" },
  { value: "modification",       label: "Pending Modification" },
  { value: "audit_flag",         label: "Audit Flag" },
  { value: "manual",             label: "Manual — see notes" },
];

const REASON_LABEL: Record<string, string> = Object.fromEntries(REASON_OPTIONS.map(r => [r.value, r.label]));

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "var(--color-lg-error)",   bg: "var(--color-lg-error-subtle)" },
  medium: { label: "Medium", color: "var(--color-lg-warning)", bg: "var(--color-lg-warning-subtle)" },
  low:    { label: "Low",    color: "var(--color-lg-info)",    bg: "var(--color-lg-info-subtle)" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function RecordTabWatchlist({ recordId, isWatchlisted, onWatchlistToggle }: RecordTabWatchlistProps) {
  const [entries, setEntries] = useState<WatchlistEntry[]>(isWatchlisted ? INITIAL_ENTRIES : []);
  const [showDialog, setShowDialog] = useState(false);

  // Add dialog state
  const [newReason, setNewReason] = useState("option_assessment");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newExpiry, setNewExpiry] = useState("");
  const [newNotes, setNewNotes] = useState("");

  function handleToggle() {
    if (isWatchlisted && entries.length > 0) {
      // Removing from watchlist clears all entries
      setEntries([]);
    }
    onWatchlistToggle();
    toast.success(isWatchlisted ? "Removed from watchlist" : "Added to watchlist");
  }

  function handleAddEntry() {
    if (!newNotes.trim() && newReason === "manual") return;
    const entry: WatchlistEntry = {
      id: `we-${Date.now()}`,
      reason: newReason,
      priority: newPriority,
      added_by: "You",
      added_at: new Date().toISOString(),
      expiry_date: newExpiry || null,
      notes: newNotes.trim(),
      rule_id: null,
      rule_name: null,
    };
    setEntries(prev => [entry, ...prev]);
    if (!isWatchlisted) onWatchlistToggle();
    setShowDialog(false);
    setNewReason("option_assessment");
    setNewPriority("medium");
    setNewExpiry("");
    setNewNotes("");
    toast.success("Watchlist entry added");
  }

  function handleRemoveEntry(id: string) {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      if (next.length === 0 && isWatchlisted) {
        onWatchlistToggle();
        toast.info("All entries removed — record unwatchlisted");
      }
      return next;
    });
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-foreground">
            Watchlist
            {entries.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: "var(--color-lg-warning-subtle)", color: "var(--color-lg-warning)" }}>
                {entries.length}
              </span>
            )}
          </h3>
          {/* Star toggle */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors"
            onClick={handleToggle}
          >
            {isWatchlisted
              ? <><Star className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" /> Watchlisted</>
              : <><StarOff className="w-3.5 h-3.5 text-muted-foreground" /> Not Watchlisted</>
            }
          </button>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => setShowDialog(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </Button>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-lg border border-dashed border-border bg-muted/10">
          <StarOff className="w-10 h-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-[14px] font-medium text-foreground">Not on watchlist</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Add this record to the watchlist to track option assessments, escalations, or custom alerts.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowDialog(true)}>
            <Plus className="w-3.5 h-3.5" /> Add to Watchlist
          </Button>
        </div>
      )}

      {/* Entry cards */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {entries.map(entry => {
            const pCfg = PRIORITY_CONFIG[entry.priority];
            const isRuleBased = !!entry.rule_id;
            return (
              <div key={entry.id} className="bg-card border border-border rounded-lg px-4 py-4 flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-foreground">
                      {REASON_LABEL[entry.reason] || entry.reason}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                      style={{ color: pCfg.color, background: pCfg.bg }}
                    >
                      {pCfg.label}
                    </span>
                    {isRuleBased && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
                        style={{ color: "var(--color-lg-primary)", borderColor: "var(--color-lg-primary)", background: "var(--color-lg-accent-subtle)" }}>
                        <Bell className="w-3 h-3" /> Rule: {entry.rule_name}
                      </span>
                    )}
                  </div>
                  <button
                    className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    onClick={() => handleRemoveEntry(entry.id)}
                    title="Remove entry"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notes */}
                {entry.notes && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{entry.notes}</p>
                )}

                {/* Footer meta */}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
                  <span>Added by <strong className="text-foreground">{entry.added_by}</strong></span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.added_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </span>
                  {entry.expiry_date && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-[var(--color-lg-warning)]" />
                        Expires {new Date(entry.expiry_date).toLocaleDateString("en-US", { dateStyle: "medium" })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Entry Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDialog(false)}>
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">Add Watchlist Entry</h2>
              <button className="p-1 rounded hover:bg-muted/40 text-muted-foreground" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground">Reason <span className="text-[var(--color-lg-error)]">*</span></label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-lg-primary)]"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
              >
                {REASON_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground">Priority</label>
              <div className="flex gap-2">
                {(["high", "medium", "low"] as const).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      className="flex-1 py-1.5 rounded border-2 text-[12px] font-semibold transition-all"
                      style={{
                        borderColor: newPriority === p ? cfg.color : "var(--border)",
                        background:  newPriority === p ? cfg.bg : "transparent",
                        color:       newPriority === p ? cfg.color : "var(--muted-foreground)",
                      }}
                      onClick={() => setNewPriority(p)}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground">Expiry Date <span className="text-muted-foreground">(optional)</span></label>
              <input
                type="date"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-lg-primary)]"
                value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-foreground">Notes</label>
              <Textarea
                rows={3}
                className="text-[13px] resize-none"
                placeholder="Describe why this record is being watchlisted…"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddEntry}>
                <Star className="w-3.5 h-3.5 mr-1.5" /> Add Entry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
