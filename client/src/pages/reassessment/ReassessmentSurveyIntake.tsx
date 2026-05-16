/**
 * ReassessmentSurveyIntake — FC-6 Screen 6.13
 * Screen key: reassessment-survey-intake
 * Route: /reassessment/survey/:id
 *
 * Prompt 6.13: Investigative survey intake form.
 * Survey header with case context. Multi-section form:
 *   Section 1: Business Intent (3 questions).
 *   Section 2: Operational Factors (4 questions).
 *   Section 3: Financial Considerations (3 questions).
 * Progress bar. Save Draft + Submit Survey buttons.
 * Read-only mode when survey is already submitted.
 *
 * Data model refs: InvestigativeSurvey (survey_type, questions, status),
 *   SurveyResponse (question_id, response_text, response_value)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/reassessments/surveys/:id
const MOCK_SURVEY = {
  id: "sv1",
  case_ref: "RC-2026-0012",
  contract_number: "CR-2026-0055",
  title: "Warehouse — 1 Industrial Blvd",
  survey_type: "option_exercise",
  status: "pending",
  respondent_name: "J. Martinez",
  respondent_role: "Operations Director",
  due_date: "2026-05-20",
};

const SURVEY_SECTIONS = [
  {
    id: "s1",
    title: "Business Intent",
    questions: [
      { id:"q1", type:"radio",    label:"Does the business intend to exercise the renewal option?",                     options:["Yes, definitely","Likely yes","Uncertain","Likely no","No, definitely not"] },
      { id:"q2", type:"textarea", label:"What are the primary business reasons for this intent?",                       placeholder:"Describe the key business drivers…" },
      { id:"q3", type:"radio",    label:"Has the business strategy for this location changed in the past 12 months?",   options:["Yes, significantly","Yes, somewhat","No change"] },
    ],
  },
  {
    id: "s2",
    title: "Operational Factors",
    questions: [
      { id:"q4", type:"radio",    label:"Are there significant leasehold improvements at this location?",               options:["Yes, major improvements","Yes, minor improvements","No improvements"] },
      { id:"q5", type:"textarea", label:"Describe any planned capital expenditures at this location over the next 2 years.", placeholder:"List planned capex…" },
      { id:"q6", type:"radio",    label:"How difficult would it be to relocate this operation?",                        options:["Very difficult","Moderately difficult","Manageable","Easy"] },
      { id:"q7", type:"textarea", label:"Are there any regulatory, licensing, or contractual requirements tied to this location?", placeholder:"Describe any location-specific requirements…" },
    ],
  },
  {
    id: "s3",
    title: "Financial Considerations",
    questions: [
      { id:"q8", type:"radio",    label:"How does the current lease rate compare to market rates for similar space?",   options:["Significantly below market","Slightly below market","At market","Above market"] },
      { id:"q9", type:"textarea", label:"Are there any pending lease negotiations or discussions with the landlord?",   placeholder:"Describe any ongoing negotiations…" },
      { id:"q10", type:"radio",   label:"What is the estimated cost of relocation (relative to annual lease payments)?", options:["Less than 1 year","1–2 years","2–5 years","More than 5 years"] },
    ],
  },
];

export default function ReassessmentSurveyIntake() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_SURVEY_INTAKE;
  const [, navigate] = useLocation();

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalQuestions = SURVEY_SECTIONS.flatMap(s => s.questions).length;
  const answeredCount = Object.keys(responses).filter(k => responses[k]?.trim()).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  function setResponse(questionId: string, value: string) {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }

  // TODO: Backend integration required — POST /api/reassessments/surveys/:id/submit
  function handleSubmit() { setSubmitted(true); }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Survey Submitted</p>
          <p className="text-[13px] text-muted-foreground">Thank you, {MOCK_SURVEY.respondent_name}. Your responses have been recorded for case {MOCK_SURVEY.case_ref}.</p>
          <Button onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_SURVEY.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_SURVEY.contract_number}</span>
          </div>
          <h1 className="page-title">Investigative Survey</h1>
          <p className="page-subtitle">{MOCK_SURVEY.title}</p>
        </div>
        <div className="text-right text-[12px]">
          <p className="text-muted-foreground">Respondent: <span className="font-semibold text-foreground">{MOCK_SURVEY.respondent_name}</span></p>
          <p className="text-muted-foreground">{MOCK_SURVEY.respondent_role}</p>
          <p className="text-muted-foreground mt-1">Due: <span className="font-semibold text-foreground">{MOCK_SURVEY.due_date}</span></p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span className="text-muted-foreground">{answeredCount} of {totalQuestions} questions answered</span>
          <span className="font-semibold text-foreground">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width:`${progressPct}%`, background:"var(--color-lg-primary)" }}
          />
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-6 max-w-3xl">
        {SURVEY_SECTIONS.map(section => (
          <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h3 className="text-[13px] font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="px-5 py-4 flex flex-col gap-5">
              {section.questions.map((q, qi) => (
                <div key={q.id} className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-foreground">
                    <span className="text-muted-foreground mr-1.5">{qi + 1}.</span>
                    {q.label}
                  </label>
                  {q.type === "radio" && q.options && (
                    <div className="flex flex-col gap-1.5">
                      {q.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={responses[q.id] === opt}
                            onChange={() => setResponse(q.id, opt)}
                            className="w-4 h-4"
                          />
                          <span className={`text-[13px] transition-colors ${responses[q.id] === opt ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.type === "textarea" && (
                    <Textarea
                      rows={3}
                      className="text-[13px] resize-none"
                      placeholder={q.placeholder}
                      value={responses[q.id] || ""}
                      onChange={e => setResponse(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Save Draft</Button>
          <Button disabled={answeredCount < totalQuestions} onClick={handleSubmit}>Submit Survey</Button>
        </div>
      </div>
    </div>
  );
}
