/**
 * ReassessmentWatchlist — FC-6 Screen 6.12
 * Screen key: reassessment-watchlist
 * Route: /reassessment/watchlist
 *
 * Prompt 6.12: Watchlist management.
 * Header: "Watchlist" + "Add Rule" button.
 * Rule cards: rule name, trigger condition, threshold, last evaluated,
 *   next evaluation, match count badge, active/paused toggle.
 * "Add Rule" modal: name, trigger type, threshold, evaluation frequency.
 * Matched contracts table below rules.
 *
 * Data model refs: WatchlistRule (rule_name, trigger_type, threshold_value,
 *   evaluation_frequency, is_active, last_evaluated_at, match_count)
 */

import { useState } from "react";
import { Bell, BellOff, Plus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/watchlist/rules
const MOCK_RULES = [
  {
    id:"r1", rule_name:"Renewal Option — 12-Month Horizon",
    trigger_type:"opt_assess", threshold_value:12, threshold_unit:"months",
    evaluation_frequency:"monthly", is_active:true,
    last_evaluated_at:"2026-05-01", next_evaluation:"2026-06-01",
    match_count:7,
  },
  {
    id:"r2", rule_name:"CPI Index Variance > 5%",
    trigger_type:"mod_index", threshold_value:5, threshold_unit:"percent",
    evaluation_frequency:"quarterly", is_active:true,
    last_evaluated_at:"2026-04-01", next_evaluation:"2026-07-01",
    match_count:3,
  },
  {
    id:"r3", rule_name:"Lease Liability > $5M",
    trigger_type:"financial_threshold", threshold_value:5_000_000, threshold_unit:"dollars",
    evaluation_frequency:"monthly", is_active:false,
    last_evaluated_at:"2026-03-01", next_evaluation:"Paused",
    match_count:12,
  },
  {
    id:"r4", rule_name:"Term Extension — 6-Month Horizon",
    trigger_type:"opt_assess", threshold_value:6, threshold_unit:"months",
    evaluation_frequency:"weekly", is_active:true,
    last_evaluated_at:"2026-05-12", next_evaluation:"2026-05-19",
    match_count:2,
  },
];

const MATCHED_CONTRACTS = [
  { id:"cr1", contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",   rule:"Renewal Option — 12-Month Horizon", match_date:"2026-05-01", status:"open" },
  { id:"cr2", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd", rule:"Renewal Option — 12-Month Horizon", match_date:"2026-05-01", status:"open" },
  { id:"cr3", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",      rule:"CPI Index Variance > 5%",            match_date:"2026-04-01", status:"case_open" },
];

const TRIGGER_OPTIONS = [
  { value:"opt_assess",          label:"Option Assessment" },
  { value:"mod_index",           label:"CPI/Index Modification" },
  { value:"mod_term",            label:"Term Modification" },
  { value:"financial_threshold", label:"Financial Threshold" },
  { value:"period_end",          label:"Period-End Sweep" },
];

const FREQ_OPTIONS = [
  { value:"daily",     label:"Daily" },
  { value:"weekly",    label:"Weekly" },
  { value:"monthly",   label:"Monthly" },
  { value:"quarterly", label:"Quarterly" },
];

export default function ReassessmentWatchlist() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_WATCHLIST;

  const [rules, setRules] = useState(MOCK_RULES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({ rule_name:"", trigger_type:"opt_assess", threshold_value:"", evaluation_frequency:"monthly" });

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  }

  // TODO: Backend integration required — POST /api/reassessments/watchlist/rules
  function addRule() {
    if (!newRule.rule_name.trim()) return;
    setRules(prev => [...prev, {
      id: `r${Date.now()}`,
      rule_name: newRule.rule_name,
      trigger_type: newRule.trigger_type,
      threshold_value: Number(newRule.threshold_value) || 0,
      threshold_unit: "months",
      evaluation_frequency: newRule.evaluation_frequency,
      is_active: true,
      last_evaluated_at: "—",
      next_evaluation: "Pending",
      match_count: 0,
    }]);
    setShowAddModal(false);
    setNewRule({ rule_name:"", trigger_type:"opt_assess", threshold_value:"", evaluation_frequency:"monthly" });
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Watchlist</h1>
            <ScreenNumberBadge screenKey="reassessment-watchlist" />
          </div>
          <p className="page-subtitle">Automated monitoring rules for reassessment triggers</p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Rule
        </Button>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-6">
        {/* Rule cards */}
        <div className="grid grid-cols-2 gap-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3"
              style={{ opacity: rule.is_active ? 1 : 0.6 }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{rule.rule_name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{rule.trigger_type.replace(/_/g," ")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rule.match_count > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold badge-warning">
                      {rule.match_count} match{rule.match_count !== 1 ? "es" : ""}
                    </span>
                  )}
                  <button
                    className="p-1.5 rounded hover:bg-muted/30 transition-colors"
                    onClick={() => toggleRule(rule.id)}
                    title={rule.is_active ? "Pause rule" : "Activate rule"}
                  >
                    {rule.is_active
                      ? <Bell className="w-4 h-4" style={{ color:"var(--color-lg-primary)" }} />
                      : <BellOff className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-muted-foreground">Threshold:</span> <span className="font-medium">{typeof rule.threshold_value === "number" && rule.threshold_value > 1000 ? `$${rule.threshold_value.toLocaleString()}` : `${rule.threshold_value} ${rule.threshold_unit}`}</span></div>
                <div><span className="text-muted-foreground">Frequency:</span> <span className="font-medium capitalize">{rule.evaluation_frequency}</span></div>
                <div><span className="text-muted-foreground">Last run:</span> <span>{rule.last_evaluated_at}</span></div>
                <div><span className="text-muted-foreground">Next run:</span> <span>{rule.next_evaluation}</span></div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${rule.is_active ? "badge-valid" : "badge-muted"}`}
                >
                  {rule.is_active ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Matched contracts */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Matched Contracts</h3>
          </div>
          <table className="data-table w-full text-[12px]">
            <thead>
              <tr>
                <th className="text-left">Contract</th>
                <th className="text-left">Title</th>
                <th className="text-left">Matched Rule</th>
                <th className="text-left">Match Date</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {MATCHED_CONTRACTS.map(c => (
                <tr key={c.id}>
                  <td className="font-mono font-semibold" style={{ color:"var(--color-lg-primary)" }}>{c.contract_number}</td>
                  <td className="font-medium">{c.title}</td>
                  <td className="text-muted-foreground">{c.rule}</td>
                  <td className="text-muted-foreground">{c.match_date}</td>
                  <td>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${c.status === "case_open" ? "badge-processing" : "badge-warning"}`}>
                      {c.status === "case_open" ? "Case Open" : "Open"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[480px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-bold text-foreground">Add Watchlist Rule</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded hover:bg-muted/30">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-foreground">Rule Name <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
                <input
                  className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                  placeholder="e.g. Renewal Option — 6-Month Horizon"
                  value={newRule.rule_name}
                  onChange={e => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-foreground">Trigger Type</label>
                <select
                  className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                  value={newRule.trigger_type}
                  onChange={e => setNewRule(prev => ({ ...prev, trigger_type: e.target.value }))}
                >
                  {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-foreground">Threshold Value</label>
                <input
                  type="number"
                  className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                  placeholder="e.g. 12"
                  value={newRule.threshold_value}
                  onChange={e => setNewRule(prev => ({ ...prev, threshold_value: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-foreground">Evaluation Frequency</label>
                <select
                  className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                  value={newRule.evaluation_frequency}
                  onChange={e => setNewRule(prev => ({ ...prev, evaluation_frequency: e.target.value }))}
                >
                  {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button disabled={!newRule.rule_name.trim()} onClick={addRule}>Add Rule</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
