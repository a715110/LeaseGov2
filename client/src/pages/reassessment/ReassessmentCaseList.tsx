/**
 * ReassessmentCaseList — FC-6 Screen 6.4
 * Screen key: reassessment-case-list
 * Route: /reassessment/cases
 *
 * Prompt 6.4: Reassessment Hub — collapsible summary + 4-tab interface.
 * Cases tab: quick filter tabs, 12-status badge table, "Confirm No Change" action.
 * Watchlist tab: priority summary, source badges.
 * Surveys tab: 6 investigative prompt cards.
 * Period Reviews tab: 3 saved-search expandable cards.
 *
 * Data model refs: ReassessmentCase (status, path_type, trigger_type,
 *   case_reference, is_remediation, is_no_action)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, Star, Search, Calendar, ChevronRight,
  AlertTriangle, CheckCircle2, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/cases
const MOCK_CASES = [
  { id:"c1",  case_ref:"RC-2026-0014", contract:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   path_type:"modification", trigger_type:"mod_term",     status:"pending_approval",       is_remediation:false, is_no_action:false, assigned:"M. Thompson", created:"2026-05-10" },
  { id:"c2",  case_ref:"RC-2026-0013", contract:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       path_type:"reassessment", trigger_type:"opt_assess",    status:"classification_pending", is_remediation:false, is_no_action:false, assigned:"J. Martinez", created:"2026-05-12" },
  { id:"c3",  case_ref:"RC-2026-0012", contract:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  path_type:"reassessment", trigger_type:"opt_assess",    status:"assessment_review",      is_remediation:false, is_no_action:false, assigned:"A. Chen",     created:"2026-05-08" },
  { id:"c4",  case_ref:"RC-2026-0011", contract:"CR-2026-0041", title:"Data Center — 500 Tech Park",    path_type:"modification", trigger_type:"mod_rent",      status:"initiated",              is_remediation:false, is_no_action:false, assigned:"S. Patel",    created:"2026-05-14" },
  { id:"c5",  case_ref:"RC-2026-0010", contract:"CR-2026-0033", title:"Branch Office — 88 Main St",     path_type:"modification", trigger_type:"mod_scope_inc", status:"approved",               is_remediation:false, is_no_action:false, assigned:"L. Kim",      created:"2026-04-20" },
  { id:"c6",  case_ref:"RC-2026-0009", contract:"CR-2026-0028", title:"Parking Garage — Level B2",      path_type:"modification", trigger_type:"compound",      status:"remediation",            is_remediation:true,  is_no_action:false, assigned:"J. Martinez", created:"2026-04-15" },
  { id:"c7",  case_ref:"RC-2026-0008", contract:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   path_type:"reassessment", trigger_type:"opt_assess",    status:"memo_draft",             is_remediation:false, is_no_action:false, assigned:"J. Martinez", created:"2026-04-10" },
  { id:"c8",  case_ref:"RC-2026-0007", contract:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       path_type:"modification", trigger_type:"mod_index",     status:"analysis_in_progress",  is_remediation:false, is_no_action:false, assigned:"A. Chen",     created:"2026-04-05" },
  { id:"c9",  case_ref:"RC-2026-0006", contract:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  path_type:"reassessment", trigger_type:"class_reass",   status:"closed",                 is_remediation:false, is_no_action:false, assigned:"L. Kim",      created:"2026-03-20" },
  { id:"c10", case_ref:"RC-2026-0005", contract:"CR-2026-0041", title:"Data Center — 500 Tech Park",    path_type:"reassessment", trigger_type:"opt_assess",    status:"no_action_submitted",    is_remediation:false, is_no_action:true,  assigned:"M. Thompson", created:"2026-03-15" },
];

const STATUS_BADGE: Record<string, string> = {
  initiated:               "badge-warning",
  classification_pending:  "badge-warning",
  classification_review:   "badge-processing",
  assessment_pending:      "badge-warning",
  assessment_review:       "badge-processing",
  analysis_pending:        "badge-warning",
  analysis_in_progress:    "badge-processing",
  memo_draft:              "badge-processing",
  pending_review:          "badge-warning",
  pending_approval:        "badge-warning",
  approved:                "badge-valid",
  exported:                "badge-valid",
  closed:                  "badge-valid",
  remediation:             "badge-invalid",
  escalated:               "badge-invalid",
  no_action_submitted:     "badge-muted",
};

const STATUS_LABEL: Record<string, string> = {
  initiated:               "Initiated",
  classification_pending:  "Classification Pending",
  classification_review:   "Classification Review",
  assessment_pending:      "Assessment Pending",
  assessment_review:       "Assessment Review",
  analysis_pending:        "Analysis Pending",
  analysis_in_progress:    "Analysis In Progress",
  memo_draft:              "Memo Draft",
  pending_review:          "Pending Review",
  pending_approval:        "Pending Approval",
  approved:                "Approved",
  exported:                "Exported",
  closed:                  "Closed",
  remediation:             "Remediation",
  escalated:               "Escalated",
  no_action_submitted:     "No Action",
};

const TRIGGER_LABEL: Record<string, string> = {
  mod_scope_inc: "Scope Increase",
  mod_scope_dec: "Scope Decrease",
  mod_term:      "Term Change",
  mod_rent:      "Rent Adjustment",
  mod_index:     "Index/Rate Change",
  opt_assess:    "Option Assessment",
  rvg_change:    "RVG Change",
  pay_change:    "Payment Change",
  pay_reclass:   "Pay Reclassification",
  class_reass:   "Classification Reassessment",
  compound:      "Compound Modification",
};

const FILTER_TABS = [
  { id:"all",      label:"All Cases" },
  { id:"open",     label:"Open" },
  { id:"pending",  label:"Pending Action" },
  { id:"approved", label:"Approved / Closed" },
  { id:"remediation", label:"Remediation" },
];

export default function ReassessmentCaseList() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_CASE_LIST;
  const [, navigate] = useLocation();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState("cases");

  const filtered = MOCK_CASES.filter(c => {
    const matchSearch = !search ||
      c.case_ref.toLowerCase().includes(search.toLowerCase()) ||
      c.contract.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      activeTab === "all" ||
      (activeTab === "open" && !["approved","exported","closed","no_action_submitted"].includes(c.status)) ||
      (activeTab === "pending" && ["classification_pending","assessment_pending","pending_review","pending_approval"].includes(c.status)) ||
      (activeTab === "approved" && ["approved","exported","closed"].includes(c.status)) ||
      (activeTab === "remediation" && c.is_remediation);
    return matchSearch && matchTab;
  });

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Reassessment Hub</h1>
            <ScreenNumberBadge screenKey="reassessment-case-list" />
          </div>
          <p className="page-subtitle">Cases, watchlist, surveys, and period reviews</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
          <TrendingUp className="w-3.5 h-3.5" /> New Trigger Report
        </Button>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-card">
        {[
          { id:"cases",   label:"Cases",          icon:<TrendingUp className="w-4 h-4" /> },
          { id:"watchlist",label:"Watchlist",     icon:<Star className="w-4 h-4" /> },
          { id:"surveys", label:"Surveys",        icon:<Search className="w-4 h-4" /> },
          { id:"periods", label:"Period Reviews", icon:<Calendar className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors ${mainTab === t.id ? "border-[var(--color-lg-primary)] text-[var(--color-lg-primary)]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMainTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Cases tab */}
      {mainTab === "cases" && (
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Filter tabs + search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {FILTER_TABS.map(t => (
                <button
                  key={t.id}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${activeTab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-[12px]" placeholder="Search cases…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-left">Case #</th>
                  <th className="text-left">Contract</th>
                  <th className="text-left">Path</th>
                  <th className="text-left">Trigger</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Assigned</th>
                  <th className="text-left">Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[12px] text-muted-foreground">{c.case_ref}</span>
                        {c.is_remediation && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold badge-invalid">REM</span>
                        )}
                        {c.is_no_action && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold badge-muted">No Action</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground text-[12px]">{c.contract}</p>
                        <p className="text-muted-foreground text-[11px] truncate max-w-[180px]">{c.title}</p>
                      </div>
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border"
                        style={{
                          color:       c.path_type === "modification" ? "var(--color-lg-primary)" : "#7c3aed",
                          background:  c.path_type === "modification" ? "var(--color-lg-accent-subtle)" : "#f5f3ff",
                          borderColor: c.path_type === "modification" ? "var(--color-lg-primary)" : "#7c3aed",
                        }}
                      >
                        {c.path_type === "modification" ? "Modification" : "Reassessment"}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-[12px]">{TRIGGER_LABEL[c.trigger_type] || c.trigger_type}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[c.status] || "badge-muted"}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-[12px]">{c.assigned}</td>
                    <td className="text-muted-foreground text-[12px]">{c.created}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost" size="sm" className="h-7 gap-1 text-[12px]"
                        onClick={() => navigate(`/reassessment/cases/${c.id}/classify`)}
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Watchlist tab */}
      {mainTab === "watchlist" && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Watchlisted Records</h3>
            <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/watchlist")}>
              Manage Watchlist
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg p-8 flex items-center justify-center">
            <p className="text-[13px] text-muted-foreground">See full watchlist management at <button className="text-[var(--color-lg-primary)] underline" onClick={() => navigate("/reassessment/watchlist")}>Watchlist Management</button></p>
          </div>
        </div>
      )}

      {/* Surveys tab */}
      {mainTab === "surveys" && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Investigative Surveys</h3>
            <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/survey-intake")}>
              New Survey
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { type:"mailroom",            label:"Mailroom / Unexpected Correspondence", desc:"Unexpected lease-related mail or correspondence received" },
              { type:"project_ghost",       label:"Ghost Project / Undocumented Occupancy", desc:"Occupancy detected without a corresponding lease record" },
              { type:"lease_vs_service",    label:"Lease vs Service Contract Assessment", desc:"Determine if an arrangement contains a lease component" },
              { type:"negotiation_whisper", label:"Negotiation Intelligence", desc:"Early-stage negotiation signals that may trigger future events" },
              { type:"strategic_pivot",     label:"Strategic Business Change", desc:"Organizational changes that may affect lease obligations" },
              { type:"asset_utility",       label:"Asset Utility and Usage Change", desc:"Changes in how a leased asset is being used or occupied" },
            ].map(s => (
              <button
                key={s.type}
                className="bg-card border border-border rounded-lg p-4 text-left hover:border-[var(--color-lg-primary)] hover:shadow-sm transition-all"
                onClick={() => navigate(`/reassessment/survey-intake?type=${s.type}`)}
              >
                <p className="text-[13px] font-semibold text-foreground">{s.label}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Period Reviews tab */}
      {mainTab === "periods" && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">Period Reviews</h3>
            <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/sweep")}>
              Start Sweep
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label:"Q1 2026 Period-End Review", records:24, completed:24, date:"2026-03-31", status:"completed" },
              { label:"Q4 2025 Period-End Review", records:22, completed:22, date:"2025-12-31", status:"completed" },
              { label:"Q3 2025 Period-End Review", records:20, completed:20, date:"2025-09-30", status:"completed" },
            ].map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{r.label}</p>
                  <p className="text-[12px] text-muted-foreground">{r.records} records reviewed · {r.date}</p>
                </div>
                <span className="badge-valid inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold">Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
