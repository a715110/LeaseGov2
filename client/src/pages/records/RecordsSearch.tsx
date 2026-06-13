/**
 * RecordsSearch — FC-5 Screen 5.2
 * Screen key: records-search
 * Route: /records
 *
 * Prompt 5.2: Full-width search bar, collapsible filter panel, sortable table,
 *   watchlist eye icon on watchlisted rows, row expand for key terms, pagination.
 *
 * Data model refs: ContractRecord (contract_number, title, status, lock_status,
 *   is_watchlisted, expiration_date, assigned_user_id, automation_level),
 *   PropertyLease (lease_classification, base_rent_amount, commencement_date),
 *   Counterparty (legal_name), Property (address_street)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Filter, ChevronDown, ChevronUp, ChevronRight,
  Star, StarOff, Eye, SortAsc, SortDesc, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type RecordStatus = "draft" | "under_review" | "pending_approval" | "approved" | "correction_in_progress" | "completed" | "archived";
type LeaseClassification = "operating" | "finance" | "short_term" | "low_value";

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
}

// TODO: Backend integration required — GET /api/records?search=&filters=&sort=&page=
const MOCK_RECORDS: RecordRow[] = [
  { id:"r1",  contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",          counterparty_name:"Fifth Ave Properties LLC",  property_address:"350 Fifth Ave, New York, NY",     lease_classification:"operating", status:"approved",              expiration_date:"2032-12-31", commencement_date:"2022-01-01", base_rent_amount:4250000, assigned_user:"J. Martinez", is_watchlisted:false, automation_level:"collaborative" },
  { id:"r2",  contract_number:"CR-2026-0087", title:"Retail HQ — 1200 Market St",            counterparty_name:"Market Street Partners",     property_address:"1200 Market St, San Francisco, CA", lease_classification:"operating", status:"pending_approval",      expiration_date:"2030-06-30", commencement_date:"2020-07-01", base_rent_amount:3100000, assigned_user:"S. Patel",    is_watchlisted:true,  automation_level:"full_autonomous" },
  { id:"r3",  contract_number:"CR-2026-0086", title:"Warehouse Lease — Industrial Park",     counterparty_name:"Industrial Realty Group",    property_address:"4500 Commerce Dr, Chicago, IL",   lease_classification:"finance",   status:"under_review",          expiration_date:"2028-03-31", commencement_date:"2018-04-01", base_rent_amount:1850000, assigned_user:"A. Chen",     is_watchlisted:false, automation_level:"full_manual" },
  { id:"r4",  contract_number:"CR-2026-0085", title:"Ground Lease — Civic Center",           counterparty_name:"City of Boston",             property_address:"1 City Hall Plaza, Boston, MA",   lease_classification:"finance",   status:"correction_in_progress",expiration_date:"2055-12-31", commencement_date:"2005-01-01", base_rent_amount:2200000, assigned_user:"J. Martinez", is_watchlisted:true,  automation_level:"collaborative" },
  { id:"r5",  contract_number:"CR-2026-0084", title:"Tech Campus — Building A",              counterparty_name:"Silicon Valley Realty",      property_address:"100 Innovation Way, San Jose, CA",lease_classification:"operating", status:"approved",              expiration_date:"2031-09-30", commencement_date:"2021-10-01", base_rent_amount:5600000, assigned_user:"S. Patel",    is_watchlisted:false, automation_level:"full_autonomous" },
  { id:"r6",  contract_number:"CR-2026-0083", title:"Suburban Office — Suite 400",           counterparty_name:"Westfield Properties",       property_address:"2000 Corporate Blvd, Atlanta, GA",lease_classification:"short_term",status:"draft",                 expiration_date:"2027-06-30", commencement_date:"2024-07-01", base_rent_amount:980000,  assigned_user:"A. Chen",     is_watchlisted:false, automation_level:"full_manual" },
  { id:"r7",  contract_number:"CR-2026-0082", title:"Downtown Retail — Corner Unit",         counterparty_name:"Urban Retail LLC",           property_address:"500 Main St, Seattle, WA",        lease_classification:"operating", status:"approved",              expiration_date:"2029-12-31", commencement_date:"2019-01-01", base_rent_amount:2750000, assigned_user:"J. Martinez", is_watchlisted:true,  automation_level:"collaborative" },
  { id:"r8",  contract_number:"CR-2026-0081", title:"Distribution Center — Zone 3",          counterparty_name:"Logistics Park Holdings",    property_address:"8800 Freight Rd, Dallas, TX",     lease_classification:"finance",   status:"approved",              expiration_date:"2033-06-30", commencement_date:"2023-07-01", base_rent_amount:3400000, assigned_user:"S. Patel",    is_watchlisted:false, automation_level:"full_autonomous" },
];

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

export default function RecordsSearch() {
  const _screenKey = SCREEN_KEYS.RECORDS_SEARCH;
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("contract_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterClassification, setFilterClassification] = useState<string>("");
  const [filterWatchlisted, setFilterWatchlisted] = useState(false);

  const filtered = MOCK_RECORDS.filter(r => {
    const q = query.toLowerCase();
    const matchesQuery = !q || r.contract_number.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.counterparty_name.toLowerCase().includes(q) || r.property_address.toLowerCase().includes(q);
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesClass = !filterClassification || r.lease_classification === filterClassification;
    const matchesWatchlist = !filterWatchlisted || r.is_watchlisted;
    return matchesQuery && matchesStatus && matchesClass && matchesWatchlist;
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

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Contract Records</h1>
            <ScreenNumberBadge screenKey="records-search" />
          </div>
          <p className="page-subtitle">{filtered.length} records found</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/pipeline/new-record")}>
          <Plus className="w-3.5 h-3.5" /> New Record
        </Button>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4">
        {/* Search bar + filter toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-[var(--color-lg-primary-light)]"
              placeholder="Search by contract number, title, counterparty, or address…"
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
                onClick={() => { setFilterStatus(""); setFilterClassification(""); setFilterWatchlisted(false); setPage(1); }}
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
                <th className="text-left cursor-pointer" onClick={() => toggleSort("contract_number")}>
                  <div className="flex items-center gap-1">Contract # <SortIcon field="contract_number" /></div>
                </th>
                <th className="text-left cursor-pointer" onClick={() => toggleSort("title")}>
                  <div className="flex items-center gap-1">Name / Counterparty <SortIcon field="title" /></div>
                </th>
                <th className="text-left">Property Address</th>
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
                  <td colSpan={9} className="text-center py-12 text-muted-foreground text-[13px]">No records match your search</td>
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
                    <td className="font-mono text-[12px] text-muted-foreground">{row.contract_number}</td>
                    <td>
                      <p className="font-medium text-foreground">{row.title}</p>
                      <p className="text-[12px] text-muted-foreground">{row.counterparty_name}</p>
                    </td>
                    <td className="text-muted-foreground text-[12px]">{row.property_address}</td>
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
                      <td colSpan={9} className="px-6 py-4">
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
