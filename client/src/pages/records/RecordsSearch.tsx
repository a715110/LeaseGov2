/**
 * RecordsSearch — FC-5 Screen 5.2
 * Screen key: records-search
 * Route: /records
 *
 * Prompt 3 (Equipment Lease): Added equipment records, contract type filter,
 *   Type column with icons, and equipment-specific expanded row.
 *
 * Data model refs: ContractRecord, EquipmentLease, PropertyLease
 */

import { useState, useEffect } from "react";
import { useLocation } from 'wouter'
import { useRoleLabel } from '@/hooks/useRoleLabel'
import {
  Search, Filter, ChevronDown, ChevronUp, ChevronRight,
  Star, StarOff, SortAsc, SortDesc, Plus, BookmarkCheck,
  AlertTriangle, Clock, Building2, Server, FileText as FileIcon,
  Cpu, Copy, CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { MOCK_EQUIPMENT_RECORDS } from "@/lib/mockData";
import type { EquipmentLease } from "@/types/contracts/equipmentLease/EquipmentLease";

type RecordStatus = "draft" | "under_review" | "pending_approval" | "approved" | "correction_in_progress" | "completed" | "archived";
type LeaseClassification = "operating" | "finance" | "short_term" | "low_value";
type ContractTypeFilter = "all" | "property_lease" | "equipment_lease" | "service_contract";

interface RecordRow {
  id: string;
  contract_number: string;
  title: string;
  counterparty_name: string;
  property_address: string;
  lease_classification: LeaseClassification;
  status: RecordStatus;
  expiration_date: string;
  commencement_date: string;
  base_rent_amount: number; // cents
  assigned_user: string;
  is_watchlisted: boolean;
  automation_level: string;
  contract_type: "property_lease" | "equipment_lease" | "service_contract";
  // Equipment-specific (optional)
  equipment_type?: string;
  serial_number?: string;
  monthly_payment?: number;
  lease_classification_eq?: "operating" | "finance" | "undetermined";
}

// TODO: Backend integration required — GET /api/records?search=&filters=&sort=&page=
const MOCK_PROPERTY_RECORDS: RecordRow[] = [
  { id:"r1",  contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",          counterparty_name:"Fifth Ave Properties LLC",  property_address:"350 Fifth Ave, New York, NY",     lease_classification:"operating", status:"approved",              expiration_date:"2032-12-31", commencement_date:"2022-01-01", base_rent_amount:4250000, assigned_user:"J. Martinez", is_watchlisted:false, automation_level:"collaborative",   contract_type:"property_lease" },
  { id:"r2",  contract_number:"CR-2026-0087", title:"Retail HQ — 1200 Market St",            counterparty_name:"Market Street Partners",     property_address:"1200 Market St, San Francisco, CA", lease_classification:"operating", status:"pending_approval",      expiration_date:"2030-06-30", commencement_date:"2020-07-01", base_rent_amount:3100000, assigned_user:"S. Patel",    is_watchlisted:true,  automation_level:"full_autonomous", contract_type:"property_lease" },
  { id:"r3",  contract_number:"CR-2026-0086", title:"Warehouse Lease — Industrial Park",     counterparty_name:"Industrial Realty Group",    property_address:"4500 Commerce Dr, Chicago, IL",   lease_classification:"finance",   status:"under_review",          expiration_date:"2028-03-31", commencement_date:"2018-04-01", base_rent_amount:1850000, assigned_user:"A. Chen",     is_watchlisted:false, automation_level:"full_manual",     contract_type:"property_lease" },
  { id:"r4",  contract_number:"CR-2026-0085", title:"Ground Lease — Civic Center",           counterparty_name:"City of Boston",             property_address:"1 City Hall Plaza, Boston, MA",   lease_classification:"finance",   status:"correction_in_progress",expiration_date:"2055-12-31", commencement_date:"2005-01-01", base_rent_amount:2200000, assigned_user:"J. Martinez", is_watchlisted:true,  automation_level:"collaborative",   contract_type:"property_lease" },
  { id:"r5",  contract_number:"CR-2026-0084", title:"Tech Campus — Building A",              counterparty_name:"Silicon Valley Realty",      property_address:"100 Innovation Way, San Jose, CA",lease_classification:"operating", status:"approved",              expiration_date:"2031-09-30", commencement_date:"2021-10-01", base_rent_amount:5600000, assigned_user:"S. Patel",    is_watchlisted:false, automation_level:"full_autonomous", contract_type:"property_lease" },
  { id:"r6",  contract_number:"CR-2026-0083", title:"Suburban Office — Suite 400",           counterparty_name:"Westfield Properties",       property_address:"2000 Corporate Blvd, Atlanta, GA",lease_classification:"short_term",status:"draft",                 expiration_date:"2027-06-30", commencement_date:"2024-07-01", base_rent_amount:980000,  assigned_user:"A. Chen",     is_watchlisted:false, automation_level:"full_manual",     contract_type:"property_lease" },
  { id:"r7",  contract_number:"CR-2026-0082", title:"Downtown Retail — Corner Unit",         counterparty_name:"Urban Retail LLC",           property_address:"500 Main St, Seattle, WA",        lease_classification:"operating", status:"approved",              expiration_date:"2029-12-31", commencement_date:"2019-01-01", base_rent_amount:2750000, assigned_user:"J. Martinez", is_watchlisted:true,  automation_level:"collaborative",   contract_type:"property_lease" },
  { id:"r8",  contract_number:"CR-2026-0081", title:"Distribution Center — Zone 3",          counterparty_name:"Logistics Park Holdings",    property_address:"8800 Freight Rd, Dallas, TX",     lease_classification:"finance",   status:"approved",              expiration_date:"2033-06-30", commencement_date:"2023-07-01", base_rent_amount:3400000, assigned_user:"S. Patel",    is_watchlisted:false, automation_level:"full_autonomous", contract_type:"property_lease" },
];

// Map EquipmentLease records to RecordRow shape for unified table
function equipmentToRow(eq: EquipmentLease): RecordRow {
  const classMap: Record<string, LeaseClassification> = {
    operating: "operating",
    finance: "finance",
    undetermined: "operating",
  };
  return {
    id: eq.id,
    contract_number: eq.contractNumber,
    title: `${eq.equipment_type} — ${eq.installation_location.split(",")[0]}`,
    counterparty_name: eq.counterparty,
    property_address: eq.installation_location,
    lease_classification: classMap[eq.lease_classification] ?? "operating",
    status: (eq.status as RecordStatus) ?? "approved",
    expiration_date: eq.expiration_date,
    commencement_date: eq.commencement_date,
    base_rent_amount: eq.monthly_payment * 100, // convert to cents for fmtRent
    assigned_user: "S. Patel",
    is_watchlisted: false,
    automation_level: "collaborative",
    contract_type: "equipment_lease",
    equipment_type: eq.equipment_type,
    serial_number: eq.serial_number,
    monthly_payment: eq.monthly_payment,
    lease_classification_eq: eq.lease_classification,
  };
}

const MOCK_EQUIPMENT_ROWS: RecordRow[] = MOCK_EQUIPMENT_RECORDS.map(equipmentToRow);

const ALL_RECORDS: RecordRow[] = [...MOCK_PROPERTY_RECORDS, ...MOCK_EQUIPMENT_ROWS];

const STATUS_BADGE: Record<RecordStatus, string> = {
  draft:                  "badge-muted",
  under_review:           "badge-processing",
  pending_approval:       "badge-warning",
  approved:               "badge-valid",
  correction_in_progress: "badge-invalid",
  completed:              "badge-valid",
  archived:               "badge-muted",
};

const STATUS_LABEL: Record<RecordStatus, string> = {
  draft:                  "Draft",
  under_review:           "Under Review",
  pending_approval:       "Pending Approval",
  approved:               "Approved",
  correction_in_progress: "Correction",
  completed:              "Completed",
  archived:               "Archived",
};

const CLASS_LABEL: Record<LeaseClassification, string> = {
  operating:  "Operating",
  finance:    "Finance",
  short_term: "Short-Term",
  low_value:  "Low-Value",
};

function fmtRent(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits:0 })}/mo`;
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ─── Contract Type Icon ───────────────────────────────────────────────────────
function ContractTypeIcon({ type }: { type: RecordRow["contract_type"] }) {
  if (type === "property_lease") {
    return (
      <span title="Property Lease" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden xl:inline">Property</span>
      </span>
    );
  }
  if (type === "equipment_lease") {
    return (
      <span title="Equipment Lease" className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#7c3aed" }}>
        <Cpu className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
        <span className="hidden xl:inline">Equipment</span>
      </span>
    );
  }
  return (
    <span title="Service Contract" className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
      <FileIcon className="w-3.5 h-3.5 text-slate-400" />
      <span className="hidden xl:inline">Service</span>
    </span>
  );
}

// ─── Expanded row: property lease ─────────────────────────────────────────────
function PropertyExpandedRow({ row }: { row: RecordRow }) {
  return (
    <div className="grid grid-cols-4 gap-4 text-[13px]">
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Commencement</p>
        <p className="font-medium text-foreground">{row.commencement_date}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Expiration</p>
        <p className="font-medium text-foreground">{row.expiration_date}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Base Rent</p>
        <p className="font-medium text-foreground">{fmtRent(row.base_rent_amount)}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Automation</p>
        <p className="font-medium text-foreground capitalize">{row.automation_level.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
}

// ─── Expanded row: equipment lease ────────────────────────────────────────────
function EquipmentExpandedRow({ row }: { row: RecordRow }) {
  const isFinance = row.lease_classification_eq === "finance";
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Vendor / Lessor</p>
        <p className="font-medium text-foreground">{row.counterparty_name}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Equipment Type</p>
        <p className="font-medium text-foreground">{row.equipment_type ?? "—"}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Serial Number</p>
        <p className="font-mono text-[12px] text-foreground truncate">{row.serial_number ?? "—"}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Monthly Payment</p>
        <p className="font-medium text-foreground">{row.monthly_payment != null ? fmtCurrency(row.monthly_payment) : "—"}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Classification</p>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
          style={
            isFinance
              ? { background: "var(--color-lg-error-subtle)", color: "var(--color-lg-error)" }
              : { background: "var(--color-lg-success-subtle)", color: "var(--color-lg-success)" }
          }
        >
          {isFinance ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
          {isFinance ? "Finance Lease" : "Operating Lease"}
        </span>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Term</p>
        <p className="font-medium text-foreground">
          {row.commencement_date} – {row.expiration_date}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Expiration Date</p>
        <p className="font-medium text-foreground">{row.expiration_date}</p>
      </div>
    </div>
  );
}

// ─── Watchlist helpers ────────────────────────────────────────────────────────
const RECORD_META: Record<string, { contract_number: string; title: string; counterparty_name: string; status: string }> = {};
ALL_RECORDS.forEach(r => {
  RECORD_META[r.id] = { contract_number: r.contract_number, title: r.title, counterparty_name: r.counterparty_name, status: r.status };
});

const REASON_LABEL: Record<string, string> = {
  option_assessment:  "Option Assessment Due",
  rent_escalation:    "Rent Escalation Upcoming",
  expiry_approaching: "Lease Expiry Approaching",
  modification:       "Pending Modification",
  audit_flag:         "Audit Flag",
  manual:             "Manual — see notes",
};
const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "var(--color-lg-error)",   bg: "var(--color-lg-error-subtle)" },
  medium: { label: "Medium", color: "var(--color-lg-warning)", bg: "var(--color-lg-warning-subtle)" },
  low:    { label: "Low",    color: "var(--color-lg-info)",    bg: "var(--color-lg-info-subtle)" },
};
interface WatchlistSummaryRow {
  recordId: string;
  contract_number: string;
  title: string;
  counterparty_name: string;
  status: string;
  topPriority: string;
  topReason: string;
  entryCount: number;
  addedAt: string;
}
function buildWatchlistRows(): WatchlistSummaryRow[] {
  const rows: WatchlistSummaryRow[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("leasegov_watchlist_")) continue;
    const recordId = key.replace("leasegov_watchlist_", "");
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "{}");
      if (!parsed.isWatchlisted) continue;
      const entries: Array<{ priority: string; reason: string; added_at: string }> = parsed.entries ?? [];
      if (entries.length === 0) continue;
      const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const sortedE = [...entries].sort((a, b) => (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3));
      const top = sortedE[0];
      const meta = RECORD_META[recordId] ?? { contract_number: recordId, title: recordId, counterparty_name: "—", status: "—" };
      rows.push({ recordId, contract_number: meta.contract_number, title: meta.title, counterparty_name: meta.counterparty_name, status: meta.status, topPriority: top.priority, topReason: REASON_LABEL[top.reason] ?? top.reason, entryCount: entries.length, addedAt: top.added_at });
    } catch { /* skip malformed */ }
  }
  // Seed from MOCK_RECORDS is_watchlisted=true if no localStorage entry exists
  for (const [rid, meta] of Object.entries(RECORD_META)) {
    const mockWatchlisted = ["r2", "r4", "r7"];
    if (mockWatchlisted.includes(rid) && !rows.find(r => r.recordId === rid)) {
      rows.push({ recordId: rid, contract_number: meta.contract_number, title: meta.title, counterparty_name: meta.counterparty_name, status: meta.status, topPriority: "medium", topReason: "Option Assessment Due", entryCount: 1, addedAt: new Date().toISOString() });
    }
  }
  rows.sort((a, b) => { const p: Record<string, number> = { high: 0, medium: 1, low: 2 }; return (p[a.topPriority] ?? 3) - (p[b.topPriority] ?? 3); });
  return rows;
}

export default function RecordsSearch() {
  const _screenKey = SCREEN_KEYS.RECORDS_SEARCH;
  const [, navigate] = useLocation();
  const { getLabel, activeRole } = useRoleLabel();
  const isAuditor = activeRole === 'auditor';
  const _watchlistedParam = new URLSearchParams(window.location.search).get('watchlisted') === 'true';
  const [activeView, setActiveView] = useState<"all" | "watchlist">(_watchlistedParam ? "watchlist" : "all");
  const [watchlistRows, setWatchlistRows] = useState<WatchlistSummaryRow[]>([]);
  useEffect(() => {
    if (activeView === "watchlist") setWatchlistRows(buildWatchlistRows());
  }, [activeView]);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("contract_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterClassification, setFilterClassification] = useState<string>("");
  const [filterContractType, setFilterContractType] = useState<ContractTypeFilter>("all");
  const [filterWatchlisted, setFilterWatchlisted] = useState(_watchlistedParam);

  const filtered = ALL_RECORDS.filter(r => {
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      r.contract_number.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.counterparty_name.toLowerCase().includes(q) ||
      r.property_address.toLowerCase().includes(q) ||
      (r.equipment_type ?? "").toLowerCase().includes(q) ||
      (r.serial_number ?? "").toLowerCase().includes(q);
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesClass = !filterClassification || r.lease_classification === filterClassification;
    const matchesType = filterContractType === "all" || r.contract_type === filterContractType;
    const matchesWatchlist = !filterWatchlisted || r.is_watchlisted;
    return matchesQuery && matchesStatus && matchesClass && matchesType && matchesWatchlist;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = (a as any)[sortField] ?? "";
    const bv = (b as any)[sortField] ?? "";
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <SortAsc className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />;
  }

  const CONTRACT_TYPE_OPTIONS: { value: ContractTypeFilter; label: string }[] = [
    { value: "all",              label: "All Types" },
    { value: "property_lease",   label: "Property Lease" },
    { value: "equipment_lease",  label: "Equipment Lease" },
    { value: "service_contract", label: "Service Contract" },
  ];

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{getLabel('/records', 'Contract Records')}</h1>
            <ScreenNumberBadge screenKey="records-search" />
          </div>
          <p className="page-subtitle">
            {activeView === "all" ? `${filtered.length} records found` : `${watchlistRows.length} watchlisted records`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle tabs */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
            <button
              className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
                activeView === "all"
                  ? "bg-[var(--color-lg-primary)] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
              onClick={() => setActiveView("all")}
            >
              All Records
            </button>
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors border-l border-border ${
                activeView === "watchlist"
                  ? "bg-[var(--color-lg-primary)] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
              onClick={() => setActiveView("watchlist")}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              My Watchlist
              {watchlistRows.length > 0 && activeView === "watchlist" && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold">{watchlistRows.length}</span>
              )}
            </button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/pipeline/new-record")} disabled={isAuditor} title={isAuditor ? 'Read-only in Audit view' : undefined}>
            <Plus className="w-3.5 h-3.5" /> New Record
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4">
        {/* ─── My Watchlist view ───────────────────────────────────────────────────────── */}
        {activeView === "watchlist" && (
          <div className="flex flex-col gap-3">
            {watchlistRows.length === 0 ? (
              <div className="bg-card border border-border rounded-lg px-6 py-12 flex flex-col items-center gap-3 text-center">
                <BookmarkCheck className="w-10 h-10 text-muted-foreground opacity-30" />
                <p className="text-[14px] font-medium text-foreground">No watchlisted records</p>
                <p className="text-[13px] text-muted-foreground max-w-xs">Open any contract record and use the Watchlist tab to add it to your watchlist. Entries will appear here.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground">Watchlisted Leases</span>
                  <span className="text-[12px] text-muted-foreground">{watchlistRows.length} record{watchlistRows.length !== 1 ? "s" : ""} — sorted by priority</span>
                </div>
                <div className="divide-y divide-border">
                  {watchlistRows.map(row => {
                    const pc = PRIORITY_CONFIG[row.topPriority] ?? PRIORITY_CONFIG.low;
                    return (
                      <div
                        key={row.recordId}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => navigate(`/records/${row.recordId}?tab=watchlist`)}
                      >
                        <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: pc.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[12px] text-muted-foreground">{row.contract_number}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded font-semibold" style={{ color: pc.color, backgroundColor: pc.bg }}>{pc.label}</span>
                            {row.entryCount > 1 && (
                              <span className="text-[11px] text-muted-foreground">{row.entryCount} entries</span>
                            )}
                          </div>
                          <p className="text-[13px] font-semibold text-foreground truncate">{row.title}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{row.counterparty_name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: pc.color }} />
                          <span className="text-[12px] text-muted-foreground">{row.topReason}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(row.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-[12px] shrink-0" onClick={e => { e.stopPropagation(); navigate(`/records/${row.recordId}`); }}>
                          Open
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search bar + filter toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-[var(--color-lg-primary-light)]"
              placeholder="Search by contract number, title, counterparty, address, equipment type, serial number…"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setFiltersOpen(v => !v)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-card border border-border rounded-lg px-5 py-4 flex flex-wrap gap-4">
            {/* Contract Type — segmented control */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contract Type</label>
              <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                {CONTRACT_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`px-3 py-1.5 text-[12px] font-medium transition-colors border-r border-border last:border-r-0 ${
                      filterContractType === opt.value
                        ? "bg-[var(--color-lg-primary)] text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                    onClick={() => { setFilterContractType(opt.value); setPage(1); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
              <select
                className="px-3 py-1.5 text-[13px] border border-border rounded bg-background focus:outline-none"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="correction_in_progress">Correction</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Classification</label>
              <select
                className="px-3 py-1.5 text-[13px] border border-border rounded bg-background focus:outline-none"
                value={filterClassification}
                onChange={e => { setFilterClassification(e.target.value); setPage(1); }}
              >
                <option value="">All Classifications</option>
                <option value="operating">Operating</option>
                <option value="finance">Finance</option>
                <option value="short_term">Short-Term</option>
                <option value="low_value">Low-Value</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterWatchlisted}
                  onChange={e => { setFilterWatchlisted(e.target.checked); setPage(1); }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-[13px] text-foreground">Watchlisted only</span>
              </label>
            </div>
            <div className="flex items-end ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[12px]"
                onClick={() => { setFilterStatus(""); setFilterClassification(""); setFilterContractType("all"); setFilterWatchlisted(false); setPage(1); }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th className="text-left w-8">Type</th>
                <th className="text-left cursor-pointer" onClick={() => toggleSort("contract_number")}>
                  <div className="flex items-center gap-1">Contract # <SortIcon field="contract_number" /></div>
                </th>
                <th className="text-left cursor-pointer" onClick={() => toggleSort("title")}>
                  <div className="flex items-center gap-1">Name / Counterparty <SortIcon field="title" /></div>
                </th>
                <th className="text-left">Location / Address</th>
                <th className="text-left">Classification</th>
                <th className="text-left cursor-pointer" onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                </th>
                <th className="text-left cursor-pointer" onClick={() => toggleSort("expiration_date")}>
                  <div className="flex items-center gap-1">Expiry <SortIcon field="expiration_date" /></div>
                </th>
                <th className="text-left">Assigned</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground text-[13px]">No records match your search</td>
                </tr>
              )}
              {paged.map(row => (
                <>
                  <tr
                    key={row.id}
                    className={expandedRow === row.id ? "bg-muted/20" : ""}
                  >
                    <td>
                      {row.is_watchlisted
                        ? <Star className="w-4 h-4" style={{ color:"var(--color-lg-warning)" }} />
                        : <StarOff className="w-4 h-4 text-muted-foreground opacity-30" />
                      }
                    </td>
                    <td>
                      <ContractTypeIcon type={row.contract_type} />
                    </td>
                    <td className="font-mono text-[12px] text-muted-foreground">{row.contract_number}</td>
                    <td>
                      <p className="font-medium text-foreground">{row.title}</p>
                      <p className="text-[12px] text-muted-foreground">{row.counterparty_name}</p>
                    </td>
                    <td className="text-muted-foreground text-[12px] max-w-[180px] truncate">{row.property_address}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                        {CLASS_LABEL[row.lease_classification]}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[row.status]}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="text-[12px] text-muted-foreground">{row.expiration_date}</td>
                    <td className="text-[12px] text-muted-foreground">{row.assigned_user}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                        >
                          {expandedRow === row.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-[12px]"
                          onClick={() => navigate(`/records/${row.id}`)}
                        >
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === row.id && (
                    <tr key={`${row.id}-expand`} className="bg-muted/10">
                      <td colSpan={10} className="px-6 py-4">
                        {row.contract_type === "equipment_lease"
                          ? <EquipmentExpandedRow row={row} />
                          : <PropertyExpandedRow row={row} />
                        }
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-[12px] text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[12px]" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 text-[12px] p-0"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-[12px]" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
