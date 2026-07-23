/**
 * ReassessmentAssessment — FC-6 Screen 6.6
 * Screen key: reassessment-assessment
 * Route: /reassessment/cases/:id/assess
 *
 * Prompt 6.6: Two-tier option assessment.
 * Prior assessment sidebar. Tier 1 (4 questions, prominent):
 *   Q1-Q4 with determination result card and probability input.
 *   "Submit Rapid Assessment" button.
 * Tier 2 (collapsed): "Expand Full 12-Factor Assessment."
 *   4 category sections: Economic, Business, Operational, Historical.
 * Circular gauge for probability_pct after submission.
 *
 * Data model refs: OptionAssessmentRecord (tier1_*, tier2_factors,
 *   determination, probability_pct, assessment_tier)
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  CheckCircle2, ChevronDown, ChevronRight, Bot, Users, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { MOCK_REASSESSMENT_CASES, FALLBACK_REASSESSMENT_CASE } from '@/lib/mockReassessmentData';
type Determination = "reasonably_certain" | "not_reasonably_certain" | null;

// TODO: Backend integration required — GET /api/reassessments/cases/:id
// Data sourced from shared mockReassessmentData module

// Prior assessment mock
const PRIOR_ASSESSMENT = {
  date: "2025-05-15",
  tier: "tier_1_rapid",
  determination: "reasonably_certain" as Determination,
  probability_pct: 85,
};

const TIER1_QUESTIONS = [
  { key:"below_market",         label:"Is the space leased significantly below market rate?" },
  { key:"significant_improvements", label:"Has the lessee made significant leasehold improvements?" },
  { key:"relocation_feasible",  label:"Is relocation operationally feasible?" },
  { key:"intent_unchanged",     label:"Has the lessee's stated intent or business plan changed?" },
];

// Equipment Lease — Tier 1 rapid assessment (4 questions)
const EQUIPMENT_TIER1_QUESTIONS = [
  {
    key: "purchase_option_below_fv",
    label: "Is the purchase option price significantly below the expected fair value of the asset at exercise date?",
    hint: "If yes → strong indicator of reasonably certain",
  },
  {
    key: "specialized_equipment",
    label: "Is this equipment specialized to the lessee's operations with no practical alternative use available to the lessor?",
    hint: "If yes → finance lease indicator",
  },
  {
    key: "useful_life_coverage",
    label: "Does the remaining useful life of the equipment substantially cover the remaining lease term? (≥75% threshold)",
    hint: "Useful life vs remaining term — ≥75% = yes",
  },
  {
    key: "operational_disruption",
    label: "Would returning this equipment create significant operational disruption (replacement unavailable, long lead time, or critical production dependency)?",
    hint: "If yes → reasonably certain indicator",
  },
];

// Equipment Lease — Tier 2 full assessment (12 factors)
const EQUIPMENT_TIER2_FACTORS = [
  {
    category: "Economic",
    factors: [
      { key:"purchase_option_vs_fv",  label:"Purchase option price vs expected fair value",       type:"select", options:["Significantly below (supports RC)","At market","Above market (does not support RC)"] },
      { key:"specialized_alt_use",    label:"Specialized equipment — alternative use to lessor",   type:"select", options:["Yes (specialized — finance lease indicator)","No (generic)"] },
      { key:"useful_life_coverage",   label:"Useful life coverage (75% threshold — ASC 842)",      type:"select", options:["\u226575% (major part met)","<75%"] },
      { key:"pv_vs_fv",              label:"PV of payments vs fair value (90% threshold — ASC 842)", type:"select", options:["\u226590% (substantially all met)","<90%"] },
    ],
  },
  {
    category: "Ownership & Guarantees",
    factors: [
      { key:"ownership_transfer",     label:"Ownership transfer at lease end",                     type:"select", options:["Yes — finance lease criterion directly met","No"] },
      { key:"rvg_significance",       label:"Residual value guarantee significance",               type:"select", options:["Significant (>20% of fair value)","Nominal","None"] },
    ],
  },
  {
    category: "Business Intent",
    factors: [
      { key:"economic_compulsion",    label:"Economic compulsion to exercise option",              type:"text" },
      { key:"lessee_intent",          label:"Lessee's stated business intent",                     type:"select", options:["Confirmed intent to purchase","Undecided","No purchase intent"] },
      { key:"historical_behavior",    label:"Historical equipment lease behavior (prior option exercises)", type:"select", options:["Yes — supports reasonably certain","No","Unknown"] },
    ],
  },
  {
    category: "Operational",
    factors: [
      { key:"alternative_suppliers",  label:"Remaining alternative suppliers",                    type:"select", options:["Multiple alternatives available","Limited alternatives","Single source (sole supplier)"] },
      { key:"obsolescence_risk",      label:"Technology obsolescence risk",                       type:"select", options:["High (equipment likely obsolete at end of term)","Medium","Low (equipment retains value)"] },
      { key:"asset_integration",      label:"Integration with other owned assets",                type:"select", options:["Deeply integrated (creates switching cost)","Modular (easy to replace)","Standalone"] },
    ],
  },
];

const TIER2_FACTORS = [
  {
    category: "Economic",
    factors: [
      "Remaining lease payments vs market rate differential",
      "Unamortized leasehold improvements at option date",
      "Relocation costs and business disruption estimate",
      "Remaining useful life of leasehold improvements",
    ],
  },
  {
    category: "Business",
    factors: [
      "Strategic importance of the leased location",
      "Availability of comparable alternative locations",
      "Contractual obligations tied to this location",
      "Regulatory or licensing requirements at this site",
    ],
  },
  {
    category: "Operational",
    factors: [
      "Operational disruption risk from relocation",
      "Workforce proximity and commute considerations",
      "Equipment and infrastructure relocation feasibility",
    ],
  },
  {
    category: "Historical",
    factors: [
      "Historical exercise pattern for similar options",
    ],
  },
];

// AI recommendations for collaborative mode
const AI_TIER1_RECS: Record<string, boolean> = {
  below_market: true,
  significant_improvements: true,
  relocation_feasible: false,
  intent_unchanged: false,
};

export default function ReassessmentAssessment() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_ASSESSMENT;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const MOCK_CASE = MOCK_REASSESSMENT_CASES[params.id ?? ""] ?? FALLBACK_REASSESSMENT_CASE;
  const isEquipmentLease = MOCK_CASE.contract_type === 'equipment_lease';

  const autoLevel = MOCK_CASE.automation_level;
  const badgeLevel = autoLevel === 'full_autonomous' ? 'full_autonomous' : autoLevel === 'collaborative' ? 'collaborative' : 'full_manual';
  const contractRecordId = MOCK_CASE.contract_record_id;
  const { activeCheckpoint: _checkpoint } = useCheckpoints(contractRecordId, { checkpointType: 'assessment_confirm' });

  const activeTier1Questions = isEquipmentLease ? EQUIPMENT_TIER1_QUESTIONS : TIER1_QUESTIONS;
  const activeTier2Factors = isEquipmentLease ? EQUIPMENT_TIER2_FACTORS : TIER2_FACTORS;

  const [tier1Answers, setTier1Answers] = useState<Record<string, boolean | null>>(
    Object.fromEntries(activeTier1Questions.map(q => [q.key, null]))
  );
  const [tier2Expanded, setTier2Expanded] = useState(false);
  const [tier2Answers, setTier2Answers] = useState<Record<string, string>>({});
  const [probabilityPct, setProbabilityPct] = useState<number | "">(autoLevel === "collaborative" ? 88 : "");
  const [rationale, setRationale] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTier, setActiveTier] = useState<"tier_1" | "tier_2">("tier_1");

  const tier1AnsweredCount = Object.values(tier1Answers).filter(v => v !== null).length;
  const tier1Complete = tier1AnsweredCount === activeTier1Questions.length;

  // Auto-escalate logic: 3+ "change indicated" answers → Tier 2
  // For equipment: 3+ yes answers = escalate
  const changeIndicatedCount = isEquipmentLease
    ? Object.values(tier1Answers).filter(v => v === true).length
    : [
        tier1Answers.below_market === true,
        tier1Answers.significant_improvements === true,
        tier1Answers.relocation_feasible === false,
        tier1Answers.intent_unchanged === true,
      ].filter(Boolean).length;
  const autoEscalateToTier2 = changeIndicatedCount >= 3;
  const aboveFinancialThreshold = MOCK_CASE.financial_impact_amount > 1_000_000_00; // financial_impact_amount is stored in cents; 1_000_000_00 = $1,000,000

  const requiresTier2 = autoEscalateToTier2 || aboveFinancialThreshold;

  function deriveDetermination(): Determination {
    if (!tier1Complete) return null;
    if (requiresTier2 && activeTier === "tier_1") return null;
    const pct = typeof probabilityPct === "number" ? probabilityPct : 0;
    return pct >= 75 ? "reasonably_certain" : "not_reasonably_certain";
  }

  const determination = deriveDetermination();

  // TODO: Backend integration required — POST /api/reassessments/assessment
  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    const pct = typeof probabilityPct === "number" ? probabilityPct : 0;
    const isRC = pct >= 75;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (pct / 100) * circumference;
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          {/* Circular gauge */}
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke={isRC ? "var(--color-lg-success)" : "var(--color-lg-muted-text)"}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-foreground">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="text-[18px] font-bold text-foreground">Assessment Submitted</p>
            <p className="text-[14px] font-semibold mt-1" style={{ color: isRC ? "var(--color-lg-success)" : "var(--muted-foreground)" }}>
              {isRC ? "Reasonably Certain" : "Not Reasonably Certain"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
            <Button onClick={() => navigate(`/reassessment/cases/${MOCK_CASE.id}/analysis`)}>Continue to Analysis</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Option Exercise Assessment</h1>
            <ScreenNumberBadge screenKey="reassessment-assessment" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title} — {MOCK_CASE.option_type} option, {MOCK_CASE.option_exercise_date}</p>
        </div>
        <AutomationPolicyBadge level={badgeLevel} size="sm" />
      </div>

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      <div className="px-6 pb-8 flex gap-6">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-5 max-w-2xl">
          {/* Tier toggle */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 w-fit">
            <button
              className={`px-4 py-1.5 rounded text-[12px] font-medium transition-colors ${activeTier === "tier_1" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setActiveTier("tier_1")}
            >
              Tier 1 — Rapid (4 Questions)
            </button>
            <button
              className={`px-4 py-1.5 rounded text-[12px] font-medium transition-colors ${activeTier === "tier_2" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setActiveTier("tier_2")}
            >
              Tier 2 — Full (12 Factors)
              {requiresTier2 && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold badge-warning">Required</span>}
            </button>
          </div>

          {/* Tier 1 */}
          {activeTier === "tier_1" && (
            <div className="flex flex-col gap-4">
              {isEquipmentLease && MOCK_CASE.useful_life_months && (
                <div className="rounded-lg border px-4 py-3 flex items-center gap-3" style={{ background:'#f0fdfa', borderColor:'#5eead4' }}>
                  <div className="flex gap-6 text-[12px]">
                    <span><span className="text-muted-foreground">Useful life:</span> <strong>{MOCK_CASE.useful_life_months} mo</strong></span>
                    <span><span className="text-muted-foreground">Remaining:</span> <strong>{MOCK_CASE.remaining_months} mo</strong></span>
                    <span><span className="text-muted-foreground">Coverage:</span> <strong style={{ color: ((MOCK_CASE.remaining_months ?? 0) / (MOCK_CASE.useful_life_months ?? 1) * 100) >= 75 ? '#0d9488' : '#dc2626' }}>{Math.round(((MOCK_CASE.remaining_months ?? 0) / (MOCK_CASE.useful_life_months ?? 1)) * 100)}%</strong></span>
                    <span><span className="text-muted-foreground">PV:</span> <strong style={{ color: (MOCK_CASE.pv_percentage ?? 0) >= 90 ? '#0d9488' : '#dc2626' }}>{MOCK_CASE.pv_percentage}%</strong></span>
                    {MOCK_CASE.purchase_option_price && <span><span className="text-muted-foreground">Option price:</span> <strong>{MOCK_CASE.purchase_option_price}</strong></span>}
                    {MOCK_CASE.rvg_amount && MOCK_CASE.rvg_amount !== 'None' && <span><span className="text-muted-foreground">RVG:</span> <strong>{MOCK_CASE.rvg_amount}</strong></span>}
                  </div>
                </div>
              )}
              {activeTier1Questions.map((q, i) => {
                const ans = tier1Answers[q.key];
                const aiRec = AI_TIER1_RECS[q.key];
                const hint = (q as { hint?: string }).hint;
                return (
                  <div key={q.key} className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background:"var(--color-lg-primary)", color:"white" }}>{i+1}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-foreground">{q.label}</p>
                        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{hint}</p>}
                        {autoLevel === "collaborative" && ans === null && aiRec !== undefined && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color:"#7c3aed" }}>
                            <Bot className="w-3 h-3" /> AI recommends: <strong>{aiRec ? "Yes" : "No"}</strong>
                          </div>
                        )}
                      </div>
                      {ans !== null && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
                    </div>
                    <div className="flex gap-3 pl-9">
                      <button
                        className={`flex-1 py-2 rounded text-[12px] font-medium border transition-all ${ans === false ? "border-[var(--color-lg-primary)] bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-primary)]" : "border-border text-muted-foreground hover:border-[var(--color-lg-primary)]"}`}
                        onClick={() => setTier1Answers(prev => ({ ...prev, [q.key]: false }))}
                      >No</button>
                      <button
                        className={`flex-1 py-2 rounded text-[12px] font-medium border transition-all ${ans === true ? "border-[var(--color-lg-primary)] bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-primary)]" : "border-border text-muted-foreground hover:border-[var(--color-lg-primary)]"}`}
                        onClick={() => setTier1Answers(prev => ({ ...prev, [q.key]: true }))}
                      >Yes</button>
                    </div>
                  </div>
                );
              })}

              {/* Auto-escalate notice */}
              {tier1Complete && requiresTier2 && (
                <div className="rounded-lg border-l-4 px-4 py-3 flex items-start gap-3" style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}>
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color:"var(--color-lg-warning)" }}>
                      {autoEscalateToTier2 ? `${changeIndicatedCount} of 4 indicators suggest change — Tier 2 required` : "Financial impact above materiality threshold — Tier 2 required"}
                    </p>
                    <button className="text-[12px] underline mt-1" style={{ color:"var(--color-lg-warning)" }} onClick={() => setActiveTier("tier_2")}>
                      Proceed to Tier 2 Full Assessment →
                    </button>
                  </div>
                </div>
              )}

              {/* Probability + submit (Tier 1 only, when not requiring Tier 2) */}
              {tier1Complete && !requiresTier2 && (
                <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-foreground">Exercise Probability (%)</label>
                    <input
                      type="number" min={0} max={100}
                      className="w-32 text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                      value={probabilityPct}
                      onChange={e => setProbabilityPct(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-semibold text-foreground">Rationale</label>
                    <Textarea rows={3} className="text-[13px] resize-none" value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Provide assessment rationale…" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {determination && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${determination === "reasonably_certain" ? "badge-valid" : "badge-muted"}`}>
                          {determination === "reasonably_certain" ? "Reasonably Certain" : "Not Reasonably Certain"}
                        </span>
                      )}
                    </div>
                    <Button disabled={!probabilityPct || !rationale.trim()} onClick={handleSubmit}>Submit Rapid Assessment</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tier 2 */}
          {activeTier === "tier_2" && (
            <div className="flex flex-col gap-4">
              {activeTier2Factors.map((cat, ci) => (
                <div key={cat.category} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20"
                    onClick={() => setTier2Answers(prev => ({ ...prev, [`__expand_${ci}`]: prev[`__expand_${ci}`] === 'open' ? '' : 'open' }))}
                  >
                    <span className="text-[13px] font-semibold text-foreground">{cat.category} Factors</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tier2Answers[`__expand_${ci}`] === 'open' ? "rotate-180" : ""}`} />
                  </button>
                  {tier2Answers[`__expand_${ci}`] === 'open' && (
                    <div className="px-5 pb-4 flex flex-col gap-3 border-t border-border">
                      {(cat.factors as { key: string; label: string; type?: string; options?: string[] }[]).map((f, fi) => (
                        <div key={fi} className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-foreground">{f.label}</label>
                          {f.type === 'select' && f.options ? (
                            <select
                              className="text-[12px] border border-border rounded-lg px-3 py-2 bg-background"
                              value={tier2Answers[`${cat.category}-${f.key ?? fi}`] || ""}
                              onChange={e => setTier2Answers(prev => ({ ...prev, [`${cat.category}-${f.key ?? fi}`]: e.target.value }))}
                            >
                              <option value="">Select…</option>
                              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <textarea
                              className="text-[12px] border border-border rounded-lg p-2 bg-background resize-none"
                              rows={2}
                              placeholder="Assessment notes…"
                              value={tier2Answers[`${cat.category}-${f.key ?? fi}`] || ""}
                              onChange={e => setTier2Answers(prev => ({ ...prev, [`${cat.category}-${f.key ?? fi}`]: e.target.value }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-foreground">Exercise Probability (%)</label>
                  <input
                    type="number" min={0} max={100}
                    className="w-32 text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                    value={probabilityPct}
                    onChange={e => setProbabilityPct(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-foreground">Rationale</label>
                  <Textarea rows={3} className="text-[13px] resize-none" value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Provide full assessment rationale…" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {determination && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${determination === "reasonably_certain" ? "badge-valid" : "badge-muted"}`}>
                        {determination === "reasonably_certain" ? "Reasonably Certain" : "Not Reasonably Certain"}
                      </span>
                    )}
                  </div>
                  <Button disabled={!probabilityPct || !rationale.trim()} onClick={handleSubmit}>Submit Full Assessment</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prior assessment sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Prior Assessment</h3>
            <div className="flex flex-col gap-2 text-[12px]">
              <div><span className="text-muted-foreground">Date:</span> <span>{PRIOR_ASSESSMENT.date}</span></div>
              <div><span className="text-muted-foreground">Tier:</span> <span>{PRIOR_ASSESSMENT.tier.replace(/_/g," ")}</span></div>
              <div>
                <span className="text-muted-foreground">Result:</span>{" "}
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${PRIOR_ASSESSMENT.determination === "reasonably_certain" ? "badge-valid" : "badge-muted"}`}>
                  {PRIOR_ASSESSMENT.determination === "reasonably_certain" ? "Reasonably Certain" : "Not Reasonably Certain"}
                </span>
              </div>
              <div><span className="text-muted-foreground">Probability:</span> <span className="font-bold">{PRIOR_ASSESSMENT.probability_pct}%</span></div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Financial Impact</h3>
            <p className="text-[20px] font-bold text-foreground">${(MOCK_CASE.financial_impact_amount / 100).toLocaleString()}</p>
            {aboveFinancialThreshold && (
              <p className="text-[11px] mt-1" style={{ color:"var(--color-lg-warning)" }}>Above materiality threshold — Tier 2 required</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
