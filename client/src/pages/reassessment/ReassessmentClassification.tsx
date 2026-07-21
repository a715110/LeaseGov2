/**
 * ReassessmentClassification — FC-6 Screen 6.5
 * Screen key: reassessment-classification
 * Route: /reassessment/cases/:id/classify
 *
 * Prompt 6.5: 3-question sequential classification gate.
 * Case context header. Lease sidebar. Q1→Q2→Q3 branching reveal.
 * Result card (success border for reassessment, purple for modification).
 * Modification type selector. Compound case warning banner.
 * Rationale textarea. Reviewer assignment. Action bar.
 * Automation level variants: Full Autonomous / Collaborative / Full Manual.
 *
 * Data model refs: ClassificationDecision (q1_terms_changed, q2_additional_rou,
 *   q3_standalone_price, classification_result, modification_type,
 *   is_compound_case, rationale, reviewer_id)
 */

import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { ContractCheckpointCard } from '@/components/checkpoints/ContractCheckpointCard';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  CheckCircle2, AlertTriangle, ChevronRight, Info, Bot, Users, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type AutoLevel = "autonomous" | "collaborative" | "manual";
type ClassResult = "reassessment" | "separate_contract" | "modification_not_separate" | null;

// TODO: Backend integration required — GET /api/reassessments/cases/:id
// Shared lookup so navigating from any case row shows correct context
const MOCK_CASES_LOOKUP: Record<string, {
  id: string; case_ref: string; contract_number: string; title: string;
  trigger_type: string; trigger_date: string; path_type: string;
  concurrent_case_ids: string[]; automation_level: AutoLevel; contract_record_id: string;
}> = {
  c1:  { id:"c1",  case_ref:"RC-2026-0014", contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   trigger_type:"mod_term",      trigger_date:"2026-05-10", path_type:"modification", concurrent_case_ids:[],         automation_level:"collaborative", contract_record_id:"r1" },
  c2:  { id:"c2",  case_ref:"RC-2026-0013", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       trigger_type:"opt_assess",    trigger_date:"2026-05-12", path_type:"reassessment", concurrent_case_ids:[],         automation_level:"collaborative", contract_record_id:"r1" },
  c3:  { id:"c3",  case_ref:"RC-2026-0012", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  trigger_type:"opt_assess",    trigger_date:"2026-05-08", path_type:"reassessment", concurrent_case_ids:[],         automation_level:"manual",        contract_record_id:"r1" },
  c4:  { id:"c4",  case_ref:"RC-2026-0011", contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",    trigger_type:"mod_rent",      trigger_date:"2026-05-14", path_type:"modification", concurrent_case_ids:[],         automation_level:"manual",        contract_record_id:"r1" },
  c5:  { id:"c5",  case_ref:"RC-2026-0010", contract_number:"CR-2026-0033", title:"Branch Office — 88 Main St",     trigger_type:"mod_scope_inc", trigger_date:"2026-04-20", path_type:"modification", concurrent_case_ids:[],         automation_level:"collaborative", contract_record_id:"r1" },
  c6:  { id:"c6",  case_ref:"RC-2026-0009", contract_number:"CR-2026-0028", title:"Parking Garage — Level B2",      trigger_type:"compound",      trigger_date:"2026-04-15", path_type:"modification", concurrent_case_ids:["c1","c2"], automation_level:"collaborative", contract_record_id:"r1" },
  c7:  { id:"c7",  case_ref:"RC-2026-0008", contract_number:"CR-2026-0088", title:"Office Tower — 350 Fifth Ave",   trigger_type:"opt_assess",    trigger_date:"2026-04-10", path_type:"reassessment", concurrent_case_ids:[],         automation_level:"manual",        contract_record_id:"r1" },
  c8:  { id:"c8",  case_ref:"RC-2026-0007", contract_number:"CR-2026-0072", title:"Retail HQ — 200 Park Ave",       trigger_type:"mod_index",     trigger_date:"2026-04-05", path_type:"modification", concurrent_case_ids:[],         automation_level:"collaborative", contract_record_id:"r1" },
  c9:  { id:"c9",  case_ref:"RC-2026-0006", contract_number:"CR-2026-0055", title:"Warehouse — 1 Industrial Blvd",  trigger_type:"class_reass",   trigger_date:"2026-03-20", path_type:"reassessment", concurrent_case_ids:[],         automation_level:"manual",        contract_record_id:"r1" },
  c10: { id:"c10", case_ref:"RC-2026-0005", contract_number:"CR-2026-0041", title:"Data Center — 500 Tech Park",    trigger_type:"opt_assess",    trigger_date:"2026-03-15", path_type:"reassessment", concurrent_case_ids:[],         automation_level:"manual",        contract_record_id:"r1" },
};
const FALLBACK_CASE = MOCK_CASES_LOOKUP["c2"];

const MOD_TYPES = [
  { value:"scope_increase",   label:"Scope Increase" },
  { value:"scope_decrease",   label:"Scope Decrease" },
  { value:"term_change",      label:"Term Change" },
  { value:"rent_adjustment",  label:"Rent Adjustment" },
  { value:"index_rate_change",label:"Index/Rate Change" },
];

// AI recommendations for collaborative mode
const AI_RECS = {
  q1: true,
  q2: false,
  q3: null as boolean | null,
  result: "modification_not_separate" as ClassResult,
  rationale: "Based on the amendment documentation, the lessee's term extension modifies existing lease conditions without granting additional right-of-use assets. The standalone price test is not applicable given Q2 answer.",
};

export default function ReassessmentClassification() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_CLASSIFICATION;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  // Resolve the case from the URL param; fall back to c2 for direct navigation
  const MOCK_CASE = MOCK_CASES_LOOKUP[params.id ?? ""] ?? FALLBACK_CASE;

  const autoLevel: AutoLevel = MOCK_CASE.automation_level;

  // FC-9: Map reassessment AutoLevel to AutomationPolicyBadge level
  const contractRecordId = MOCK_CASE.contract_record_id ?? 'r1';
  const badgeLevel = autoLevel === 'autonomous' ? 'full_autonomous' : autoLevel === 'collaborative' ? 'collaborative' : 'full_manual';
  const { activeCheckpoint } = useCheckpoints(contractRecordId, { checkpointType: 'classification_confirm' });

  // Step state
  const [step, setStep] = useState(1); // 1, 2, 3, or 4 (result)
  const [q1, setQ1] = useState<boolean | null>(null);
  const [q2, setQ2] = useState<boolean | null>(null);
  const [q3, setQ3] = useState<boolean | null>(null);
  const [modType, setModType] = useState("");
  const [isCompound, setIsCompound] = useState(false);
  const [rationale, setRationale] = useState(autoLevel === "collaborative" ? AI_RECS.rationale : "");
  const [submitted, setSubmitted] = useState(false);

  // Derive result
  function deriveResult(): ClassResult {
    if (q1 === false) return "reassessment";
    if (q1 === true && q2 === true) return "separate_contract";
    if (q1 === true && q2 === false && q3 === true) return "separate_contract";
    if (q1 === true && q2 === false && q3 === false) return "modification_not_separate";
    return null;
  }

  const result = step === 4 ? deriveResult() : null;

  function answerQ1(val: boolean) {
    setQ1(val);
    if (val === false) { setStep(4); }
    else { setStep(2); }
  }

  function answerQ2(val: boolean) {
    setQ2(val);
    if (val === true) { setStep(4); }
    else { setStep(3); }
  }

  function answerQ3(val: boolean) {
    setQ3(val);
    setStep(4);
  }

  // TODO: Backend integration required — POST /api/reassessments/classification
  function handleSubmit() {
    setSubmitted(true);
  }

  const resultConfig: Record<string, { label:string; color:string; bg:string; border:string }> = {
    reassessment:            { label:"Reassessment Path",          color:"var(--color-lg-success)", bg:"var(--color-lg-success-subtle)", border:"var(--color-lg-success)" },
    separate_contract:       { label:"Separate Contract",          color:"#7c3aed",                  bg:"#f5f3ff",                         border:"#7c3aed" },
    modification_not_separate:{ label:"Modification — Not Separate", color:"var(--color-lg-primary)", bg:"var(--color-lg-accent-subtle)", border:"var(--color-lg-primary)" },
  };

  if (submitted) {
    const r = resultConfig[result || "reassessment"];
    return (
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Classification Submitted</p>
          <div className="px-4 py-2 rounded-lg border-2" style={{ background:r.bg, borderColor:r.border }}>
            <p className="text-[14px] font-bold" style={{ color:r.color }}>{r.label}</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
            <Button onClick={() => navigate(`/reassessment/cases/${MOCK_CASE.id}/assess`)}>Continue to Assessment</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Concurrent case banner — clickable to navigate to ConcurrentWarn screen */}
      {MOCK_CASE.concurrent_case_ids.length > 0 && (
        <button
          className="px-6 py-3 border-b flex items-center gap-3 w-full text-left hover:opacity-90 transition-opacity"
          style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}
          onClick={() => navigate(`/reassessment/cases/${MOCK_CASE.id}/concurrent`)}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
          <span className="text-[13px] font-medium" style={{ color:"var(--color-lg-warning)" }}>
            {MOCK_CASE.concurrent_case_ids.length} concurrent case(s) detected — see Concurrent Case Warning
          </span>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color:"var(--color-lg-warning)" }} />
        </button>
      )}

      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Classification Decision Gate</h1>
            <ScreenNumberBadge screenKey="reassessment-classification" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title}</p>
        </div>
        {/* FC-9: AutomationPolicyBadge */}
        <AutomationPolicyBadge level={badgeLevel} size="sm" />
      </div>

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      {/* FC-9: Checkpoint card — collaborative mode */}
      {autoLevel === 'collaborative' && activeCheckpoint && (
        <div className="px-6 pb-2">
          <ContractCheckpointCard
            checkpoint={activeCheckpoint}
            onApprove={() => {}}
            onModify={() => {}}
            onReject={() => {}}
          />
        </div>
      )}

      <div className="px-6 pb-8 flex gap-6">
        {/* Main wizard */}
        <div className="flex-1 flex flex-col gap-5 max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all"
                  style={{
                    borderColor: step > s ? "var(--color-lg-success)" : step === s ? "var(--color-lg-primary)" : "var(--border)",
                    background:  step > s ? "var(--color-lg-success)" : step === s ? "var(--color-lg-primary)" : "transparent",
                    color:       step >= s ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && <div className="h-0.5 w-8" style={{ background: step > s ? "var(--color-lg-success)" : "var(--border)" }} />}
              </div>
            ))}
            <span className="ml-2 text-[12px] text-muted-foreground">Step {Math.min(step, 3)} of 3</span>
          </div>

          {/* Q1 */}
          <div className={`bg-card border rounded-lg p-5 flex flex-col gap-4 transition-opacity ${step >= 1 ? "opacity-100" : "opacity-40"}`}>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background:"var(--color-lg-primary)", color:"white" }}>1</div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground">Have the terms and conditions of the contract changed?</p>
                {autoLevel === "collaborative" && q1 === null && (
                  <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color:"#7c3aed" }}>
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI recommends: <strong>{AI_RECS.q1 ? "Yes" : "No"}</strong></span>
                  </div>
                )}
              </div>
              {q1 !== null && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
            </div>
            {step === 1 && q1 === null && (
              <div className="flex gap-3 pl-9">
                <Button variant="outline" className="flex-1" onClick={() => answerQ1(false)}>No — Reassessment Path</Button>
                <Button className="flex-1" onClick={() => answerQ1(true)}>Yes — Continue to Q2</Button>
              </div>
            )}
            {q1 !== null && (
              <div className="pl-9 text-[13px] font-medium" style={{ color: q1 ? "var(--color-lg-primary)" : "var(--color-lg-success)" }}>
                Answer: {q1 ? "Yes" : "No"}
              </div>
            )}
          </div>

          {/* Q2 */}
          {step >= 2 && (
            <div className={`bg-card border rounded-lg p-5 flex flex-col gap-4 transition-opacity ${step >= 2 ? "opacity-100" : "opacity-40"}`}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background:"var(--color-lg-primary)", color:"white" }}>2</div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">Does the modification grant the lessee additional ROU assets not included in the original lease?</p>
                  {autoLevel === "collaborative" && q2 === null && (
                    <div className="mt-2 flex items-center gap-2 text-[12px]" style={{ color:"#7c3aed" }}>
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI recommends: <strong>{AI_RECS.q2 ? "Yes" : "No"}</strong></span>
                    </div>
                  )}
                </div>
                {q2 !== null && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
              </div>
              {step === 2 && q2 === null && (
                <div className="flex gap-3 pl-9">
                  <Button variant="outline" className="flex-1" onClick={() => answerQ2(false)}>No — Continue to Q3</Button>
                  <Button className="flex-1" onClick={() => answerQ2(true)}>Yes — Separate Contract</Button>
                </div>
              )}
              {q2 !== null && (
                <div className="pl-9 text-[13px] font-medium" style={{ color: q2 ? "#7c3aed" : "var(--color-lg-primary)" }}>
                  Answer: {q2 ? "Yes" : "No"}
                </div>
              )}
            </div>
          )}

          {/* Q3 */}
          {step >= 3 && (
            <div className={`bg-card border rounded-lg p-5 flex flex-col gap-4 transition-opacity ${step >= 3 ? "opacity-100" : "opacity-40"}`}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background:"var(--color-lg-primary)", color:"white" }}>3</div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">Is the consideration for the additional ROU commensurate with the standalone price?</p>
                </div>
                {q3 !== null && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
              </div>
              {step === 3 && q3 === null && (
                <div className="flex gap-3 pl-9">
                  <Button variant="outline" className="flex-1" onClick={() => answerQ3(false)}>No — Modification Not Separate</Button>
                  <Button className="flex-1" onClick={() => answerQ3(true)}>Yes — Separate Contract</Button>
                </div>
              )}
              {q3 !== null && (
                <div className="pl-9 text-[13px] font-medium" style={{ color: q3 ? "#7c3aed" : "var(--color-lg-primary)" }}>
                  Answer: {q3 ? "Yes" : "No"}
                </div>
              )}
            </div>
          )}

          {/* Result card */}
          {step === 4 && result && (
            <div
              className="rounded-lg border-2 p-5 flex flex-col gap-4"
              style={{ background: resultConfig[result].bg, borderColor: resultConfig[result].border }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" style={{ color: resultConfig[result].color }} />
                <div>
                  <p className="text-[12px] text-muted-foreground">Classification Result</p>
                  <p className="text-[16px] font-bold" style={{ color: resultConfig[result].color }}>{resultConfig[result].label}</p>
                </div>
              </div>

              {/* Modification type selector (shown for modification results) */}
              {(result === "separate_contract" || result === "modification_not_separate") && (
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-foreground">Modification Type</label>
                  <select
                    className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background"
                    value={modType}
                    onChange={e => setModType(e.target.value)}
                  >
                    <option value="">Select modification type…</option>
                    {MOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              )}

              {/* Compound case */}
              <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input type="checkbox" checked={isCompound} onChange={e => setIsCompound(e.target.checked)} className="w-4 h-4" />
                <span className="text-foreground">This is a compound modification (multiple simultaneous changes)</span>
              </label>

              {isCompound && (
                <div className="rounded-lg border px-4 py-3 flex items-start gap-2" style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
                  <p className="text-[12px]" style={{ color:"var(--color-lg-warning)" }}>Compound modifications require separate accounting treatment for each component. Ensure all modification types are documented.</p>
                </div>
              )}

              {/* Rationale */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-foreground">Classification Rationale <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
                <Textarea
                  rows={4}
                  className="text-[13px] resize-none"
                  placeholder="Provide rationale for the classification decision…"
                  value={rationale}
                  onChange={e => setRationale(e.target.value)}
                />
                {autoLevel === "collaborative" && rationale === AI_RECS.rationale && (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color:"#7c3aed" }}>
                    <Bot className="w-3 h-3" /> AI-generated rationale — review and modify as needed
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => { setStep(1); setQ1(null); setQ2(null); setQ3(null); }}>Reset</Button>
                <Button disabled={!rationale.trim()} onClick={handleSubmit}>Submit Classification</Button>
              </div>
            </div>
          )}
        </div>

        {/* Lease sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Case Context</h3>
            <div className="flex flex-col gap-2 text-[12px]">
              <div><span className="text-muted-foreground">Case:</span> <span className="font-mono font-semibold">{MOCK_CASE.case_ref}</span></div>
              <div><span className="text-muted-foreground">Contract:</span> <span className="font-semibold">{MOCK_CASE.contract_number}</span></div>
              <div><span className="text-muted-foreground">Trigger:</span> <span>{MOCK_CASE.trigger_type.replace(/_/g," ")}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span>{MOCK_CASE.trigger_date}</span></div>
              <div>
                <span className="text-muted-foreground">Path:</span>{" "}
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold"
                  style={{ color:"var(--color-lg-primary)", background:"var(--color-lg-accent-subtle)" }}
                >
                  {MOCK_CASE.path_type}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Decision Guide</h3>
            <div className="flex flex-col gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Q1 No → Reassessment path (probability re-evaluation only)</span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Q2 Yes → Separate contract (new lease)</span>
              </div>
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Q3 Yes → Separate contract; Q3 No → Modification not separate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
