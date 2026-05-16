/**
 * RecordsDashboard — FC-5 Screen 5.1
 * Screen key: records-dashboard
 * Route: /records/dashboard
 *
 * Prompt 5.1: 5 summary cards, watchlist widget, recent activity feed,
 *   exception queue, quick action buttons.
 *
 * Data model refs: ContractRecord (status, is_watchlisted, lock_status)
 */

import { useLocation } from "wouter";
import {
  FileText, Clock, AlertTriangle, CheckCircle2, Upload,
  Star, TrendingUp, Eye, ChevronRight, Plus, Search, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/records/dashboard-summary
const SUMMARY_CARDS = [
  { label:"Total Active",        value:247, icon:<FileText className="w-5 h-5" />,      color:"var(--color-lg-primary)",  bg:"var(--color-lg-accent-subtle)" },
  { label:"Active Leases",       value:198, icon:<CheckCircle2 className="w-5 h-5" />,  color:"var(--color-lg-success)",  bg:"var(--color-lg-success-subtle)" },
  { label:"Open Items",          value:12,  icon:<AlertTriangle className="w-5 h-5" />, color:"var(--color-lg-warning)",  bg:"var(--color-lg-warning-subtle)", badge:"warning" },
  { label:"Active Reassessments",value:5,   icon:<TrendingUp className="w-5 h-5" />,    color:"#7c3aed",                  bg:"#f5f3ff" },
  { label:"Pending Export",      value:3,   icon:<Upload className="w-5 h-5" />,         color:"#ea580c",                  bg:"#fff7ed" },
];

const WATCHLIST_ITEMS = [
  { label:"High Priority",  count:3, color:"var(--color-lg-error)" },
  { label:"Medium Priority",count:4, color:"var(--color-lg-warning)" },
  { label:"Low Priority",   count:1, color:"var(--color-lg-success)" },
];

// TODO: Backend integration required — GET /api/records/recent-activity
const RECENT_ACTIVITY = [
  { id:"a1",  record:"CR-2026-0088", action:"Approved",        actor:"M. Thompson",  time:"2 min ago",  status:"approved" },
  { id:"a2",  record:"CR-2026-0087", action:"Submitted",       actor:"J. Martinez",  time:"18 min ago", status:"pending_approval" },
  { id:"a3",  record:"CR-2026-0086", action:"Under Review",    actor:"S. Patel",     time:"1h ago",     status:"under_review" },
  { id:"a4",  record:"CR-2026-0085", action:"Rework Required", actor:"M. Thompson",  time:"2h ago",     status:"correction_in_progress" },
  { id:"a5",  record:"CR-2026-0084", action:"Approved",        actor:"A. Chen",      time:"3h ago",     status:"approved" },
  { id:"a6",  record:"CR-2026-0083", action:"Draft Created",   actor:"J. Martinez",  time:"4h ago",     status:"draft" },
  { id:"a7",  record:"CR-2026-0082", action:"Approved",        actor:"M. Thompson",  time:"5h ago",     status:"approved" },
  { id:"a8",  record:"CR-2026-0081", action:"Submitted",       actor:"S. Patel",     time:"6h ago",     status:"pending_approval" },
  { id:"a9",  record:"CR-2026-0080", action:"Under Review",    actor:"A. Chen",      time:"7h ago",     status:"under_review" },
  { id:"a10", record:"CR-2026-0079", action:"Approved",        actor:"J. Martinez",  time:"8h ago",     status:"approved" },
];

const EXCEPTION_QUEUE = [
  { id:"e1", record:"CR-2026-0075", issue:"Overdue approval — 6 days",    severity:"error" },
  { id:"e2", record:"CR-2026-0071", issue:"3 open flags unresolved",       severity:"warning" },
  { id:"e3", record:"CR-2026-0068", issue:"Option exercise due in 14 days",severity:"warning" },
  { id:"e4", record:"CR-2026-0062", issue:"Expiring in 45 days",           severity:"warning" },
];

const STATUS_BADGE: Record<string, string> = {
  approved:               "badge-valid",
  pending_approval:       "badge-warning",
  under_review:           "badge-processing",
  correction_in_progress: "badge-invalid",
  draft:                  "badge-muted",
};

const STATUS_LABEL: Record<string, string> = {
  approved:               "Approved",
  pending_approval:       "Pending Approval",
  under_review:           "Under Review",
  correction_in_progress: "Correction",
  draft:                  "Draft",
};

export default function RecordsDashboard() {
  const _screenKey = SCREEN_KEYS.RECORDS_DASHBOARD;
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contract Records</h1>
          <p className="page-subtitle">Portfolio overview and recent activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/records")}>
            <Search className="w-3.5 h-3.5" /> Search Records
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/pipeline/new-record")}>
            <Plus className="w-3.5 h-3.5" /> New Record
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5">
        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-4">
          {SUMMARY_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg px-4 py-4 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/records")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted-foreground">{card.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:card.bg, color:card.color }}>
                  {card.icon}
                </div>
              </div>
              <p className="text-[28px] font-bold leading-none" style={{ color:card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Recent activity feed */}
          <div className="col-span-2 bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-[14px] font-semibold text-foreground">Recent Activity</h2>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[12px] gap-1" onClick={() => navigate("/records")}>
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ACTIVITY.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/records/${item.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-muted-foreground w-[110px]">{item.record}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[item.status] || "badge-muted"}`}>
                      {STATUS_LABEL[item.status] || item.action}
                    </span>
                    <span className="text-[13px] text-foreground">{item.action}</span>
                    <span className="text-[12px] text-muted-foreground">by {item.actor}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Watchlist widget */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--color-lg-warning)]" />
                  <h2 className="text-[14px] font-semibold text-foreground">Watchlisted Leases</h2>
                </div>
                <span className="text-[20px] font-bold" style={{ color:"var(--color-lg-warning)" }}>8</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {WATCHLIST_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background:item.color }} />
                      <span className="text-[13px] text-foreground">{item.label}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground">{item.count}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full h-7 text-[12px] mt-1 gap-1" onClick={() => navigate("/records?watchlisted=true")}>
                  <Eye className="w-3.5 h-3.5" /> View Watchlist
                </Button>
              </div>
            </div>

            {/* Exception queue */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex-1">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
                <AlertTriangle className="w-4 h-4" style={{ color:"var(--color-lg-error)" }} />
                <h2 className="text-[14px] font-semibold text-foreground">Exception Queue</h2>
                <span className="badge-invalid inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-auto">{EXCEPTION_QUEUE.length}</span>
              </div>
              <div className="divide-y divide-border">
                {EXCEPTION_QUEUE.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => navigate(`/records/${item.id}`)}
                  >
                    <div>
                      <p className="font-mono text-[12px] text-muted-foreground">{item.record}</p>
                      <p className="text-[12px] text-foreground mt-0.5">{item.issue}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
