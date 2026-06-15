/**
 * ReassessmentDashboard — FC-6 Screen 6.1
 * Screen key: reassessment-dashboard
 * Route: /reassessment/dashboard
 *
 * Prompt 6.1: Summary cards (Open Cases · Pending Classification ·
 *   Pending Assessment · Pending Approval · Watchlisted · Overdue by SLA).
 *   Period-End Alert banner. Recent Activity feed. Quick actions.
 *
 * Data model refs: ReassessmentCase (status, path_type, trigger_type)
 */

import { useLocation } from "wouter";
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle2, Star,
  Plus, Search, Calendar, Activity, ChevronRight, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/dashboard-summary
const SUMMARY = {
  open_cases:              12,
  pending_classification:   4,
  pending_assessment:       3,
  pending_approval:         2,
  watchlisted_records:     18,
  overdue_by_sla:           1,
  sweep_due:               true,
  sweep_due_date:          "2026-05-31",
};

// TODO: Backend integration required — GET /api/reassessments/recent-activity
const RECENT_ACTIVITY = [
  { id:"a1",  caseId:"c1",  case_ref:"RC-2026-0014", event:"Status → pending_approval",   actor:"M. Thompson", time:"2 min ago",  path_type:"modification" },
  { id:"a2",  caseId:"c2",  case_ref:"RC-2026-0013", event:"Classification submitted",     actor:"J. Martinez", time:"18 min ago", path_type:"reassessment" },
  { id:"a3",  caseId:"c3",  case_ref:"RC-2026-0012", event:"Tier 2 assessment completed",  actor:"A. Chen",     time:"1 hr ago",   path_type:"reassessment" },
  { id:"a4",  caseId:"c4",  case_ref:"RC-2026-0011", event:"Case initiated",               actor:"S. Patel",    time:"2 hr ago",   path_type:"modification" },
  { id:"a5",  caseId:"c5",  case_ref:"RC-2026-0010", event:"Status → approved",            actor:"L. Kim",      time:"3 hr ago",   path_type:"modification" },
  { id:"a6",  caseId:"c6",  case_ref:"RC-2026-0009", event:"Remediation flag set",         actor:"System",      time:"5 hr ago",   path_type:"modification" },
  { id:"a7",  caseId:"c7",  case_ref:"RC-2026-0008", event:"Memo draft saved",             actor:"J. Martinez", time:"Yesterday",  path_type:"reassessment" },
  { id:"a8",  caseId:"c8",  case_ref:"RC-2026-0007", event:"Analysis submitted",           actor:"A. Chen",     time:"Yesterday",  path_type:"modification" },
  { id:"a9",  caseId:"c9",  case_ref:"RC-2026-0006", event:"Case closed",                  actor:"L. Kim",      time:"2 days ago", path_type:"reassessment" },
  { id:"a10", caseId:"c10", case_ref:"RC-2026-0005", event:"No-action submitted",          actor:"M. Thompson", time:"2 days ago", path_type:"reassessment" },
];

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  onClick?: () => void;
}

function SummaryCard({ label, value, icon, color, bg, border, onClick }: SummaryCardProps) {
  return (
    <button
      className="bg-card border rounded-lg p-5 flex items-start gap-4 text-left hover:shadow-md transition-shadow w-full"
      style={{ borderColor: border }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[28px] font-bold text-foreground leading-none">{value}</p>
        <p className="text-[12px] text-muted-foreground mt-1">{label}</p>
      </div>
    </button>
  );
}

export default function ReassessmentDashboard() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_DASHBOARD;
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Period-End Sweep Alert */}
      {SUMMARY.sweep_due && (
        <div
          className="flex items-center justify-between px-6 py-3 border-b"
          style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
            <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-warning)" }}>
              Period-End Sweep due {SUMMARY.sweep_due_date} — review all records for periodic re-evaluation
            </span>
          </div>
          <Button
            size="sm"
            className="h-7 text-[12px] gap-1.5"
            style={{ background:"var(--color-lg-warning)", color:"white" }}
            onClick={() => navigate("/reassessment/sweep")}
          >
            <Calendar className="w-3.5 h-3.5" /> Start Sweep
          </Button>
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Reassessment Dashboard</h1>
            <ScreenNumberBadge screenKey="reassessment-dashboard" />
          </div>
          <p className="page-subtitle">Monitor and manage all reassessment and modification cases</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/survey-intake")}>
            <Search className="w-3.5 h-3.5" /> Investigative Survey
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate("/reassessment/trigger")}>
            <Plus className="w-3.5 h-3.5" /> New Trigger Report
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            label="Open Cases"
            value={SUMMARY.open_cases}
            icon={<TrendingUp className="w-5 h-5" />}
            color="var(--color-lg-primary)"
            bg="var(--color-lg-accent-subtle)"
            border="var(--color-lg-primary-light)"
            onClick={() => navigate("/reassessment/cases")}
          />
          <SummaryCard
            label="Pending Classification"
            value={SUMMARY.pending_classification}
            icon={<Clock className="w-5 h-5" />}
            color="var(--color-lg-warning)"
            bg="var(--color-lg-warning-subtle)"
            border="var(--color-lg-warning)"
            onClick={() => navigate("/reassessment/cases")}
          />
          <SummaryCard
            label="Pending Assessment"
            value={SUMMARY.pending_assessment}
            icon={<Activity className="w-5 h-5" />}
            color="var(--color-lg-info)"
            bg="var(--color-lg-info-subtle)"
            border="var(--color-lg-info)"
          />
          <SummaryCard
            label="Pending Approval"
            value={SUMMARY.pending_approval}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="var(--color-lg-success)"
            bg="var(--color-lg-success-subtle)"
            border="var(--color-lg-success)"
            onClick={() => navigate("/approvals/queue")}
          />
          <SummaryCard
            label="Watchlisted Records"
            value={SUMMARY.watchlisted_records}
            icon={<Star className="w-5 h-5" />}
            color="var(--color-lg-warning)"
            bg="var(--color-lg-warning-subtle)"
            border="var(--color-lg-warning)"
            onClick={() => navigate("/reassessment/watchlist")}
          />
          <SummaryCard
            label="Overdue by SLA"
            value={SUMMARY.overdue_by_sla}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="var(--color-lg-error)"
            bg="var(--color-lg-error-subtle)"
            border="var(--color-lg-error)"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Activity feed */}
          <div className="col-span-2 bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h3 className="text-[14px] font-semibold text-foreground">Recent Activity</h3>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]" onClick={() => navigate("/reassessment/cases")}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ACTIVITY.map(a => (
                <button key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors w-full text-left" onClick={() => navigate(`/reassessment/cases/${a.caseId}/classify`)}>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: a.path_type === "modification" ? "var(--color-lg-primary)" : "#7c3aed" }}
                  />
                  <span className="font-mono text-[12px] text-muted-foreground w-28 shrink-0">{a.case_ref}</span>
                  <span className="text-[13px] text-foreground flex-1 truncate">{a.event}</span>
                  <span className="text-[12px] text-muted-foreground shrink-0">{a.actor}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 w-20 text-right">{a.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-4">
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
              <h3 className="text-[14px] font-semibold text-foreground">Quick Actions</h3>
              <Button className="w-full justify-start gap-2 h-9 text-[13px]" onClick={() => navigate("/reassessment/trigger")}>
                <Plus className="w-4 h-4" /> New Trigger Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[13px]" onClick={() => navigate("/reassessment/survey-intake")}>
                <Search className="w-4 h-4" /> Investigative Survey
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[13px]" onClick={() => navigate("/reassessment/sweep")}>
                <Calendar className="w-4 h-4" /> Period-End Sweep
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[13px]" onClick={() => navigate("/reassessment/watchlist")}>
                <Star className="w-4 h-4" /> Manage Watchlist
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[13px]" onClick={() => navigate("/reassessment/cases")}>
                <TrendingUp className="w-4 h-4" /> All Cases
              </Button>
            </div>

            {/* Path type legend */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Path Types</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background:"var(--color-lg-primary)" }} />
                  <span className="text-[12px] text-foreground">Modification</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">contractual change</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background:"#7c3aed" }} />
                  <span className="text-[12px] text-foreground">Reassessment</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">probability re-eval</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
