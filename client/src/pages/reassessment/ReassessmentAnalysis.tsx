/**
 * ReassessmentAnalysis — FC-6 Screen 6.7
 * Screen key: reassessment-analysis
 * Route: /reassessment/cases/:id/analysis
 *
 * Prompt 6.7: 2-tab screen (Analysis | Memo).
 * Analysis: Before/After cards, delta row, journal entry T-account,
 *   revised payment schedule.
 * Memo: type toggle (Action/No-Action), auto-populated sections with
 *   editable narrative areas, evidence references, "Generate PDF" button.
 * Bottom: Submit for Approval primary, Export Recalculation Package outlined,
 *   Save Draft.
 *
 * Data model refs: ReassessmentCase (path_type, financial_impact_amount),
 *   ExtractionRecord (field values for before/after comparison)
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { FileText, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/cases/:id/analysis
const MOCK_CASES_LOOKUP: Record<string, { id:string; case_ref:string; contract_number:string; title:string; path_type:string; is_remediation:boolean }> = {
  c1:  { id:"c1",  case_ref:"RC-2026-0014", contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   path_type:"modification", is_remediation:false },
  c2:  { id:"c2",  case_ref:"RC-2026-0013", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       path_type:"reassessment", is_remediation:false },
  c3:  { id:"c3",  case_ref:"RC-2026-0012", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  path_type:"reassessment", is_remediation:false },
  c4:  { id:"c4",  case_ref:"RC-2026-0011", contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",    path_type:"modification", is_remediation:false },
  c5:  { id:"c5",  case_ref:"RC-2026-0010", contract_number:"CR-2026-0033", title:"Branch Office — 88 Main St",     path_type:"modification", is_remediation:false },
  c6:  { id:"c6",  case_ref:"RC-2026-0009", contract_number:"CR-2026-0028", title:"Parking Garage — Level B2",      path_type:"modification", is_remediation:true  },
  c7:  { id:"c7",  case_ref:"RC-2026-0008", contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   path_type:"reassessment", is_remediation:false },
  c8:  { id:"c8",  case_ref:"RC-2026-0007", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       path_type:"modification", is_remediation:false },
  c9:  { id:"c9",  case_ref:"RC-2026-0006", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  path_type:"reassessment", is_remediation:false },
  c10: { id:"c10", case_ref:"RC-2026-0005", contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",    path_type:"reassessment", is_remediation:false },
};

const BEFORE_AFTER = {
  lease_term_months:    { before: 60,           after: 84,           label:"Lease Term (months)" },
  lease_liability:      { before: 4_250_000,    after: 5_890_000,    label:"Lease Liability ($)" },
  rou_asset:            { before: 4_100_000,    after: 5_720_000,    label:"ROU Asset ($)" },
  monthly_payment:      { before: 85_000,       after: 92_500,       label:"Monthly Payment ($)" },
  discount_rate:        { before: 4.25,         after: 4.75,         label:"Discount Rate (%)" },
  remaining_periods:    { before: 24,           after: 48,           label:"Remaining Periods" },
};

const PAYMENT_SCHEDULE = [
  { period:"Jun 2026", payment:92_500, interest:2_340, principal:90_160, balance:5_799_840 },
  { period:"Jul 2026", payment:92_500, interest:2_317, principal:90_183, balance:5_709_657 },
  { period:"Aug 2026", payment:92_500, issue:2_293,   principal:90_207, balance:5_619_450 },
  { period:"Sep 2026", payment:92_500, interest:2_270, principal:90_230, balance:5_529_220 },
  { period:"Oct 2026", payment:92_500, interest:2_246, principal:90_254, balance:5_438_966 },
];

const MEMO_SECTIONS = [
  { key:"background",    label:"Background",            content:"This reassessment was initiated following an option exercise assessment for the Office Tower lease (CR-2026-0088). The lessee has indicated a high probability of exercising the renewal option, triggering remeasurement under IFRS 16." },
  { key:"trigger",       label:"Triggering Event",      content:"Option exercise assessment completed on 2026-05-08. Probability determined to be 88% (Reasonably Certain). Tier 2 full assessment conducted due to financial impact exceeding materiality threshold." },
  { key:"methodology",   label:"Methodology",           content:"Remeasurement performed using the revised lease term of 84 months and updated incremental borrowing rate of 4.75% as at the reassessment date. Present value of revised lease payments calculated using the modified retrospective approach." },
  { key:"impact",        label:"Financial Impact",      content:"Lease liability increased by $1,640,000. ROU asset increased by $1,620,000. Net impact on opening retained earnings: nil (prospective adjustment). Incremental depreciation charge: $19,286/month." },
  { key:"conclusion",    label:"Conclusion",            content:"The reassessment results in a material increase to the lease liability and ROU asset. The accounting treatment is consistent with IFRS 16 paragraph 45. No prior period restatement is required." },
];

export default function ReassessmentAnalysis() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_ANALYSIS;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const MOCK_CASE = MOCK_CASES_LOOKUP[params.id ?? ""] ?? MOCK_CASES_LOOKUP["c7"];

  const [activeTab, setActiveTab] = useState<"analysis" | "memo">("analysis");
  const [memoType, setMemoType] = useState<"action" | "no_action">("action");
  const [memoEdits, setMemoEdits] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function getMemoContent(key: string) {
    return memoEdits[key] ?? MEMO_SECTIONS.find(s => s.key === key)?.content ?? "";
  }

  // TODO: Backend integration required — POST /api/reassessments/cases/:id/submit-approval
  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Submitted for Approval</p>
          <p className="text-[13px] text-muted-foreground">Case {MOCK_CASE.case_ref} is now pending approval.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
            <Button onClick={() => navigate("/approvals/queue")}>View Approval Queue</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {MOCK_CASE.is_remediation && (
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ background:"var(--color-lg-error-subtle)", borderColor:"var(--color-lg-error)" }}>
          <AlertTriangle className="w-4 h-4" style={{ color:"var(--color-lg-error)" }} />
          <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-error)" }}>Remediation Case — Escalated approval required</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Analysis & Memo</h1>
            <ScreenNumberBadge screenKey="reassessment-analysis" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title}</p>
        </div>
        {/* FC-9: AutomationPolicyBadge */}
        <AutomationPolicyBadge level="collaborative" size="sm" />
      </div>

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      {/* Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-card">
        {[
          { id:"analysis", label:"Analysis" },
          { id:"memo",     label:"Memo" },
        ].map(t => (
          <button
            key={t.id}
            className={`px-5 py-3 text-[13px] font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-[var(--color-lg-primary)] text-[var(--color-lg-primary)]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab(t.id as "analysis" | "memo")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-5 flex flex-col gap-6 flex-1">
        {/* Analysis tab */}
        {activeTab === "analysis" && (
          <>
            {/* Before / After cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Before Reassessment</h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(BEFORE_AFTER).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{v.label}</span>
                      <span className="font-semibold text-foreground">
                        {typeof v.before === "number" && v.before > 1000
                          ? `$${v.before.toLocaleString()}`
                          : v.before}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border-2 rounded-lg p-5" style={{ borderColor:"var(--color-lg-primary)" }}>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color:"var(--color-lg-primary)" }}>After Reassessment</h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(BEFORE_AFTER).map(([k, v]) => {
                    const changed = v.after !== v.before;
                    return (
                      <div key={k} className="flex items-center justify-between text-[13px]">
                        <span className="text-muted-foreground">{v.label}</span>
                        <span className={`font-bold ${changed ? "" : "text-foreground"}`} style={changed ? { color:"var(--color-lg-primary)" } : {}}>
                          {typeof v.after === "number" && v.after > 1000
                            ? `$${v.after.toLocaleString()}`
                            : v.after}
                          {changed && (
                            <span className="ml-1.5 text-[11px] font-normal" style={{ color:"var(--color-lg-success)" }}>
                              +{typeof v.after === "number" && typeof v.before === "number"
                                ? (v.after > 1000 ? `$${(v.after - v.before).toLocaleString()}` : (v.after - v.before))
                                : ""}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Journal entry T-account */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-[13px] font-semibold text-foreground mb-4">Journal Entry</h3>
              <div className="grid grid-cols-2 gap-0 border border-border rounded overflow-hidden text-[12px]">
                <div className="border-r border-border">
                  <div className="px-4 py-2 bg-muted/30 font-semibold text-foreground border-b border-border">Debit</div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex justify-between"><span>ROU Asset</span><span className="font-mono">$1,620,000</span></div>
                  </div>
                </div>
                <div>
                  <div className="px-4 py-2 bg-muted/30 font-semibold text-foreground border-b border-border">Credit</div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex justify-between"><span>Lease Liability</span><span className="font-mono">$1,640,000</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Retained Earnings</span><span className="font-mono">($20,000)</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revised payment schedule */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-[13px] font-semibold text-foreground">Revised Payment Schedule (first 5 periods)</h3>
              </div>
              <table className="data-table w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left">Period</th>
                    <th className="text-right">Payment</th>
                    <th className="text-right">Interest</th>
                    <th className="text-right">Principal</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENT_SCHEDULE.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.period}</td>
                      <td className="text-right font-mono">${r.payment.toLocaleString()}</td>
                      <td className="text-right font-mono text-muted-foreground">${(r.interest || (r as any).issue || 0).toLocaleString()}</td>
                      <td className="text-right font-mono">${r.principal.toLocaleString()}</td>
                      <td className="text-right font-mono font-semibold">${r.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Memo tab */}
        {activeTab === "memo" && (
          <>
            {/* Memo type toggle */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-foreground">Memo Type:</span>
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${memoType === "action" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setMemoType("action")}
                >
                  Action Memo
                </button>
                <button
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${memoType === "no_action" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setMemoType("no_action")}
                >
                  No-Action Memo
                </button>
              </div>
            </div>

            {/* Memo sections */}
            <div className="flex flex-col gap-4">
              {MEMO_SECTIONS.map(section => (
                <div key={section.key} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-muted/20">
                    <h3 className="text-[13px] font-semibold text-foreground">{section.label}</h3>
                  </div>
                  <div className="p-4" style={{ background:"var(--color-lg-warning-subtle)" }}>
                    <Textarea
                      rows={3}
                      className="text-[13px] resize-none bg-transparent border-0 p-0 focus:ring-0"
                      value={getMemoContent(section.key)}
                      onChange={e => setMemoEdits(prev => ({ ...prev, [section.key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence references */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-[13px] font-semibold text-foreground mb-3">Evidence References</h3>
              <div className="flex flex-col gap-2 text-[12px] text-muted-foreground">
                <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Option Assessment Record — RC-2026-0008-OAR-001</div>
                <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Lease Agreement Amendment — DOC-2026-0088-AMD-003</div>
                <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Incremental Borrowing Rate Confirmation — FIN-2026-Q2-IBR</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" className="gap-1.5">
                <Download className="w-4 h-4" /> Generate PDF
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Save Draft</Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" /> Export Recalculation Package
          </Button>
          <Button variant="outline" onClick={() => navigate(`/reassessment/cases/${MOCK_CASE.id}/memo`)}>Continue to Memo</Button>
          <Button onClick={handleSubmit}>Submit for Approval</Button>
        </div>
      </div>
    </div>
  );
}
