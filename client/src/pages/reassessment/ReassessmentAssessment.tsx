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

  const autoLevel = MOCK_CASE.automation_level;
  const badgeLevel = autoLevel === 'full_autonomous' ? 'full_autonomous' : autoLevel === 'collaborative' ? 'collaborative' : 'full_manual';
  const contractRecordId = MOCK_CASE.contract_record_id;
  const { activeCheckpoint: _checkpoint } = useCheckpoints(contractRecordId, { checkpointType: 'assessment_confirm' });

  const [tier1Answers, setTier1Answers] = useState<Record<string, boolean | null>>({
    below_market: null,
    significant_improvements: null,
    relocation_feasible: null,
    intent_unchanged: null,
  });
  const [tier2Expanded, setTier2Expanded] = useState(false);
  const [tier2Answers, setTier2Answers] = useState<Record<string, string>>({});
  const [probabilityPct, setProbabilityPct] = useState<number | "">(autoLevel === "collaborative" ? 88 : "");
  const [rationale, setRationale] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTier, setActiveTier] = useState<"tier_1" | "tier_2">("tier_1");

  const tier1AnsweredCount = Object.values(tier1Answers).filter(v => v !== null).length;
  const tier1Complete = tier1AnsweredCount === 4;

  // Auto-escalate logic: 3+ "change indicated" answers → Tier 2
  const changeIndicatedCount = [
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
              {TIER1_QUESTIONS.map((q, i) => {
                const ans = tier1Answers[q.key];
                const aiRec = AI_TIER1_RECS[q.key];
                return (
                  <div key={q.key} className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background:"var(--color-lg-primary)", color:"white" }}>{i+1}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-foreground">{q.label}</p>
                        {autoLevel === "collaborative" && ans === null && (
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
              {TIER2_FACTORS.map(cat => (
                <div key={cat.category} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20"
                    onClick={() => setTier2Expanded(prev => !prev)}
                  >
                    <span className="text-[13px] font-semibold text-foreground">{cat.category} Factors</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tier2Expanded ? "rotate-180" : ""}`} />
                  </button>
                  {tier2Expanded && (
                    <div className="px-5 pb-4 flex flex-col gap-3 border-t border-border">
                      {cat.factors.map((f, fi) => (
                        <div key={fi} className="flex flex-col gap-1.5">
                          <label className="text-[12px] font-medium text-foreground">{f}</label>
                          <textarea
                            className="text-[12px] border border-border rounded-lg p-2 bg-background resize-none"
                            rows={2}
                            placeholder="Assessment notes…"
                            value={tier2Answers[`${cat.category}-${fi}`] || ""}
                            onChange={e => setTier2Answers(prev => ({ ...prev, [`${cat.category}-${fi}`]: e.target.value }))}
                          />
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
