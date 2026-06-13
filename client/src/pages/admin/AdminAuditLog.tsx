/**
 * AdminAuditLog — FC-8 Screen 8.5
 * Screen key: admin-audit-log
 * Route: /admin/audit
 *
 * Prompt 8.5: Audit log viewer.
 * Filters: actor_type (human/agent/system) · action · subject_type ·
 *   date range · user search
 * Log table: timestamp · actor badge · action label · subject_type ·
 *   subject_id (mono truncated) · summary
 * actor_type badges: human (accent person icon) · agent (purple robot) ·
 *   system (muted gear icon)
 * Row expand: before_state vs after_state JSON diff with changed keys in amber
 * Immutable: no edit, no delete, no bulk actions
 * "Export CSV" button: async export with progress indicator
 * auditor: full read access · lease_admin: own-org entries only
 *
 * Data model refs: AuditLog (Part 2.10)
 */

import { useState } from "react";
import { User, Bot, Settings, ChevronDown, ChevronRight, Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";
import { useRole } from "@/contexts/RoleContext";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type ActorType = "human" | "agent" | "system";
type SubjectType = "contract_record" | "staged_document" | "extraction_record" | "user" | "tenant_config" | "threshold_config";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor_type: ActorType;
  actor_name: string;
  action: string;
  subject_type: SubjectType;
  subject_id: string;
  summary: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
}

// TODO: Backend integration required — GET /api/admin/audit-log
const MOCK_ENTRIES: AuditEntry[] = [
  { id:"al1",  timestamp:"2026-05-16 09:14:22", actor_type:"human",  actor_name:"Jordan Martinez",  action:"field.update",         subject_type:"extraction_record", subject_id:"er-2026-0412", summary:"Updated base_rent_annual from $180,000 to $192,000", before_state:{ base_rent_annual: 180000 }, after_state:{ base_rent_annual: 192000 } },
  { id:"al2",  timestamp:"2026-05-16 09:10:05", actor_type:"agent",  actor_name:"extraction_agent", action:"extraction.complete",  subject_type:"staged_document",   subject_id:"sd-2026-0887", summary:"Extracted 68 of 73 fields with high confidence",     before_state:null, after_state:{ fields_extracted: 68, confidence_avg: 0.91 } },
  { id:"al3",  timestamp:"2026-05-16 08:55:30", actor_type:"human",  actor_name:"Aisha Chen",       action:"approval.approve",     subject_type:"contract_record",   subject_id:"cr-2026-0156", summary:"Approved contract package for Ground Lease — Riverside", before_state:{ status:"pending_approval" }, after_state:{ status:"approved" } },
  { id:"al4",  timestamp:"2026-05-16 08:42:11", actor_type:"system", actor_name:"system",           action:"batch.created",        subject_type:"staged_document",   subject_id:"BATCH-2026-0041", summary:"Intake batch created with 4 files",               before_state:null, after_state:{ file_count: 4, batch_type:"package" } },
  { id:"al5",  timestamp:"2026-05-16 08:30:00", actor_type:"agent",  actor_name:"classification_agent", action:"reassessment.classify", subject_type:"contract_record", subject_id:"cr-2026-0099", summary:"Classified reassessment as Tier 1 — routine review", before_state:{ status:"pending_classification" }, after_state:{ tier:"tier_1", classification:"routine_review" } },
  { id:"al6",  timestamp:"2026-05-15 17:30:44", actor_type:"human",  actor_name:"Samuel Patel",     action:"user.deactivate",      subject_type:"user",              subject_id:"u-carlos-reyes", summary:"Deactivated user Carlos Reyes",                   before_state:{ status:"active" }, after_state:{ status:"inactive" } },
  { id:"al7",  timestamp:"2026-05-15 16:10:20", actor_type:"human",  actor_name:"Marcus Webb",      action:"config.threshold.update", subject_type:"threshold_config", subject_id:"tc-v5",       summary:"Updated tier2_assessment_materiality to $500,000", before_state:{ tier2_assessment_materiality_cents: 25000000 }, after_state:{ tier2_assessment_materiality_cents: 50000000 } },
  { id:"al8",  timestamp:"2026-05-15 14:22:05", actor_type:"human",  actor_name:"Fatima Okonkwo",   action:"document.upload",      subject_type:"staged_document",   subject_id:"sd-2026-0886", summary:"Uploaded Retail-HQ-Lease-2026.pdf (4.2 MB)",       before_state:null, after_state:{ filename:"Retail-HQ-Lease-2026.pdf", size_mb: 4.2 } },
];

const ACTOR_BADGE: Record<ActorType, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  human:  { icon: User,     label:"Human",  color:"var(--color-lg-primary)", bg:"rgba(59,130,246,0.1)" },
  agent:  { icon: Bot,      label:"Agent",  color:"#7c3aed",                  bg:"rgba(124,58,237,0.1)" },
  system: { icon: Settings, label:"System", color:"var(--color-muted-foreground)", bg:"var(--color-muted)" },
};

const SUBJECT_TYPE_BADGE: Record<SubjectType, string> = {
  contract_record:   "badge-processing",
  staged_document:   "badge-deferred",
  extraction_record: "badge-valid",
  user:              "badge-muted",
  tenant_config:     "badge-warning",
  threshold_config:  "badge-warning",
};

function JsonDiff({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Before</p>
        <div className="bg-muted/20 rounded-lg p-3 font-mono text-[11px] space-y-1">
          {before ? Array.from(allKeys).map(k => (
            <div key={k} className={`flex gap-2 ${after && JSON.stringify(before[k]) !== JSON.stringify(after[k]) ? "text-[var(--color-lg-warning)]" : "text-muted-foreground"}`}>
              <span className="text-muted-foreground">{k}:</span>
              <span>{JSON.stringify(before[k])}</span>
            </div>
          )) : <span className="text-muted-foreground italic">null</span>}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">After</p>
        <div className="bg-muted/20 rounded-lg p-3 font-mono text-[11px] space-y-1">
          {after ? Array.from(allKeys).map(k => (
            <div key={k} className={`flex gap-2 ${before && JSON.stringify(before[k]) !== JSON.stringify(after[k]) ? "text-[var(--color-lg-warning)] font-semibold" : "text-foreground"}`}>
              <span className="text-muted-foreground">{k}:</span>
              <span>{JSON.stringify(after[k])}</span>
            </div>
          )) : <span className="text-muted-foreground italic">null</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLog() {
  const _screenKey = SCREEN_KEYS.ADMIN_AUDIT_LOG;
  const { activeRole: role } = useRole();
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState<ActorType | "all">("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const isAuditor = role === "auditor";

  const filtered = MOCK_ENTRIES.filter(e => {
    if (actorFilter !== "all" && e.actor_type !== actorFilter) return false;
    if (search && !e.summary.toLowerCase().includes(search.toLowerCase()) &&
        !e.actor_name.toLowerCase().includes(search.toLowerCase()) &&
        !e.subject_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleRow(id: string) {
    setExpandedRows(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  // TODO: Backend integration required — GET /api/admin/audit-log/export
  function exportCsv() {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Audit Log</h1>
              <ScreenNumberBadge screenKey="admin-audit-log" />
            </div>
            <p className="page-subtitle">
              {isAuditor ? "Full read access — all organization entries" : "Read access — own organization entries"}
              {" · "}Immutable — no edits or deletions permitted
            </p>
          </div>
          <Button
            variant="outline" className="h-8 text-[12px] gap-1.5"
            onClick={exportCsv} disabled={exporting}
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-9 h-8 text-[12px]" placeholder="Search actor, subject, summary…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {(["all","human","agent","system"] as const).map(v => (
                <button key={v} onClick={() => setActorFilter(v)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold border capitalize transition-all"
                  style={{
                    borderColor: actorFilter === v ? "var(--color-lg-primary)" : "var(--color-border)",
                    background: actorFilter === v ? "var(--color-lg-primary)" : "transparent",
                    color: actorFilter === v ? "white" : "var(--color-muted-foreground)",
                  }}>
                  {v}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground ml-auto">{filtered.length} entries</span>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="data-table w-full text-[12px]">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th className="text-left">Timestamp</th>
                  <th className="text-left">Actor</th>
                  <th className="text-left">Action</th>
                  <th className="text-left">Subject Type</th>
                  <th className="text-left">Subject ID</th>
                  <th className="text-left">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => {
                  const actor = ACTOR_BADGE[entry.actor_type];
                  const ActorIcon = actor.icon;
                  const isExpanded = expandedRows.has(entry.id);
                  const hasDiff = entry.before_state || entry.after_state;
                  return (
                    <>
                      <tr key={entry.id} className={hasDiff ? "cursor-pointer hover:bg-muted/10" : ""} onClick={() => hasDiff && toggleRow(entry.id)}>
                        <td>
                          {hasDiff && (
                            isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">{entry.timestamp}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{ background: actor.bg, color: actor.color }}>
                            <ActorIcon className="w-3 h-3" />
                            {entry.actor_name}
                          </span>
                        </td>
                        <td className="font-mono text-[11px] text-foreground">{entry.action}</td>
                        <td>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${SUBJECT_TYPE_BADGE[entry.subject_type]}`}>
                            {entry.subject_type.replace(/_/g," ")}
                          </span>
                        </td>
                        <td className="font-mono text-[11px] text-muted-foreground max-w-[120px] truncate">{entry.subject_id}</td>
                        <td className="text-foreground max-w-[280px] truncate">{entry.summary}</td>
                      </tr>
                      {isExpanded && hasDiff && (
                        <tr key={`${entry.id}-expand`}>
                          <td colSpan={7} className="px-6 py-4 bg-muted/5 border-t border-border">
                            <JsonDiff before={entry.before_state} after={entry.after_state} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
