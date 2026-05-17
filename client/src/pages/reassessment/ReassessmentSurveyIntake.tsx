/**
 * ReassessmentSurveyIntake — FC-6 Screen 6.13 (Phase 2)
 * Screen key: reassessment-survey-intake
 * Route: /reassessment/survey/:id  (new survey: /reassessment/survey/new?type={prompt_type})
 *
 * Investigative survey intake form for one of six prompt types.
 * Questions are frontend-defined per prompt_type — not from DB.
 * Answers map to SurveyResponse records on submit.
 *
 * Six prompt_type values (InvestigativeSurvey.prompt_type enum):
 *   mailroom · project_ghost · lease_vs_service ·
 *   negotiation_whisper · strategic_pivot · asset_utility
 *
 * Confidence determination (InvestigativeSurvey.overall_confidence):
 *   high → green success result card → "Promote to Case" or "Promote to Contextual Project"
 *   low  → amber warning result card → "Send to Clarification"
 *
 * On promote to case:
 *   POST /reassessments/cases { survey_response_id: survey.id }
 *   InvestigativeSurvey.status → 'promoted_to_case'
 *
 * On promote to contextual project:
 *   POST /reassessments/contextual-projects { originating_survey_id: survey.id }
 *   InvestigativeSurvey.status → 'promoted_to_case' (same state machine)
 *
 * On send to clarification:
 *   PATCH /reassessments/surveys/{id} { status: 'sent_to_clarification' }
 *
 * Data model refs:
 *   InvestigativeSurvey (prompt_type, path_type, target_contract_record_id,
 *     overall_confidence, status, resulting_case_id)
 *   SurveyResponse (question_key, question_text, response_text,
 *     response_value, evidence_category)
 *
 * Design: Structured Authority — prompt-type selector as card grid on step 1,
 *   distinct question sets per type, result card with promote actions
 */
import { useState } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  Mail, Ghost, Scale, MessageSquare, TrendingUp, Building2,
  ChevronRight, CheckCircle2, AlertTriangle, ArrowRight,
  FileText, FolderOpen, X, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { toast } from 'sonner'

// ─── Prompt type definitions ──────────────────────────────────────────────────
type PromptType =
  | 'mailroom'
  | 'project_ghost'
  | 'lease_vs_service'
  | 'negotiation_whisper'
  | 'strategic_pivot'
  | 'asset_utility'

type EvidenceCategory = 'retrospective' | 'operational' | 'strategic'

interface SurveyQuestion {
  key: string
  text: string
  type: 'text' | 'yesno' | 'select'
  options?: string[]
  evidence_category: EvidenceCategory
  required: boolean
  confidence_weight: 'high' | 'medium' | 'low'
}

interface PromptTypeConfig {
  id: PromptType
  label: string
  description: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  color: string
  path_type: 'modification' | 'reassessment'
  questions: SurveyQuestion[]
}

// ─── Question bank — frontend-defined per prompt_type ────────────────────────
const PROMPT_CONFIGS: PromptTypeConfig[] = [
  {
    id: 'mailroom',
    label: 'Mailroom Signal',
    description: 'Undocumented lease event detected via physical mail or correspondence',
    icon: Mail,
    color: 'var(--color-lg-primary)',
    path_type: 'modification',
    questions: [
      { key: 'document_type', text: 'What type of document was received?', type: 'select', options: ['Amendment notice', 'Rent adjustment letter', 'Termination notice', 'Renewal offer', 'Other correspondence'], evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'sender', text: 'Who sent the document (landlord, broker, legal counsel)?', type: 'text', evidence_category: 'retrospective', required: true, confidence_weight: 'medium' },
      { key: 'date_received', text: 'When was the document received?', type: 'text', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'financial_impact', text: 'Does the document reference any financial changes (rent, deposits, CAM)?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'lease_identified', text: 'Can you identify the specific lease this document relates to?', type: 'yesno', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'additional_context', text: 'Any additional context about this document?', type: 'text', evidence_category: 'operational', required: false, confidence_weight: 'low' },
    ],
  },
  {
    id: 'project_ghost',
    label: 'Project Ghost',
    description: 'Business project activity suggests undocumented lease changes or new obligations',
    icon: Ghost,
    color: 'var(--color-lg-warning)',
    path_type: 'reassessment',
    questions: [
      { key: 'project_name', text: 'What is the name or reference of the business project?', type: 'text', evidence_category: 'strategic', required: true, confidence_weight: 'medium' },
      { key: 'project_type', text: 'What type of project is this?', type: 'select', options: ['Office relocation', 'Expansion', 'Consolidation', 'Renovation', 'Subleasing', 'New site acquisition'], evidence_category: 'strategic', required: true, confidence_weight: 'high' },
      { key: 'lease_impact', text: 'Does this project directly impact any existing lease obligations?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'timeline', text: 'What is the expected timeline for this project?', type: 'text', evidence_category: 'strategic', required: true, confidence_weight: 'medium' },
      { key: 'undocumented_changes', text: 'Are there lease changes that have occurred but not yet been formally documented?', type: 'yesno', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'stakeholders', text: 'Which stakeholders are involved in this project?', type: 'text', evidence_category: 'strategic', required: false, confidence_weight: 'low' },
    ],
  },
  {
    id: 'lease_vs_service',
    label: 'Lease vs. Service',
    description: 'Ambiguous contract that may contain embedded lease components requiring ASC 842 assessment',
    icon: Scale,
    color: 'var(--color-lg-success)',
    path_type: 'reassessment',
    questions: [
      { key: 'contract_reference', text: 'What is the contract reference or vendor name?', type: 'text', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'asset_identified', text: 'Does the contract identify a specific physical asset (equipment, space, vehicle)?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'right_to_direct', text: 'Does the customer have the right to direct how and for what purpose the asset is used?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'substitution_right', text: 'Does the supplier have a substantive right to substitute the asset?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'contract_term', text: 'What is the contract term (months)?', type: 'text', evidence_category: 'retrospective', required: true, confidence_weight: 'medium' },
      { key: 'annual_value', text: 'What is the approximate annual contract value ($)?', type: 'text', evidence_category: 'operational', required: false, confidence_weight: 'medium' },
    ],
  },
  {
    id: 'negotiation_whisper',
    label: 'Negotiation Whisper',
    description: 'Informal intelligence about ongoing or upcoming lease negotiations',
    icon: MessageSquare,
    color: 'var(--color-lg-error)',
    path_type: 'reassessment',
    questions: [
      { key: 'source', text: 'What is the source of this intelligence (broker, internal, landlord)?', type: 'select', options: ['Internal team member', 'Broker/agent', 'Landlord contact', 'Legal counsel', 'Other'], evidence_category: 'strategic', required: true, confidence_weight: 'medium' },
      { key: 'negotiation_type', text: 'What type of negotiation is underway?', type: 'select', options: ['Renewal negotiation', 'Rent renegotiation', 'Early termination', 'Expansion', 'Lease restructure'], evidence_category: 'strategic', required: true, confidence_weight: 'high' },
      { key: 'timeline', text: 'What is the expected timeline for conclusion?', type: 'text', evidence_category: 'strategic', required: true, confidence_weight: 'medium' },
      { key: 'financial_magnitude', text: 'What is the estimated financial magnitude of the change?', type: 'select', options: ['< $50K/yr', '$50K–$200K/yr', '$200K–$500K/yr', '> $500K/yr', 'Unknown'], evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'formal_documentation', text: 'Has any formal documentation been exchanged?', type: 'yesno', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'confidence_level', text: 'How confident are you in this intelligence?', type: 'select', options: ['Very confident', 'Reasonably confident', 'Uncertain', 'Speculative'], evidence_category: 'strategic', required: true, confidence_weight: 'high' },
    ],
  },
  {
    id: 'strategic_pivot',
    label: 'Strategic Pivot',
    description: 'Organizational strategy change that may affect the lease portfolio',
    icon: TrendingUp,
    color: 'var(--color-lg-primary)',
    path_type: 'reassessment',
    questions: [
      { key: 'pivot_type', text: 'What type of strategic change is occurring?', type: 'select', options: ['Workforce reduction', 'Workforce expansion', 'Geographic consolidation', 'Remote/hybrid transition', 'M&A activity', 'Business unit restructure'], evidence_category: 'strategic', required: true, confidence_weight: 'high' },
      { key: 'affected_locations', text: 'Which locations or regions are affected?', type: 'text', evidence_category: 'strategic', required: true, confidence_weight: 'high' },
      { key: 'headcount_impact', text: 'What is the estimated headcount impact?', type: 'text', evidence_category: 'operational', required: false, confidence_weight: 'medium' },
      { key: 'decision_timeline', text: 'When is the strategic decision expected to be finalized?', type: 'text', evidence_category: 'strategic', required: true, confidence_weight: 'medium' },
      { key: 'lease_implications', text: 'Have any lease implications been formally assessed by leadership?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'executive_sponsor', text: 'Who is the executive sponsor of this strategic initiative?', type: 'text', evidence_category: 'strategic', required: false, confidence_weight: 'low' },
    ],
  },
  {
    id: 'asset_utility',
    label: 'Asset Utility',
    description: 'Operational change in how a leased asset is being used',
    icon: Building2,
    color: 'var(--color-lg-success)',
    path_type: 'modification',
    questions: [
      { key: 'usage_change', text: 'How has the use of the leased asset changed?', type: 'select', options: ['Partial vacancy', 'Subleasing portion', 'Change in permitted use', 'Abandonment', 'Increased utilization', 'Repurposing'], evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'change_date', text: 'When did this change in usage occur?', type: 'text', evidence_category: 'retrospective', required: true, confidence_weight: 'high' },
      { key: 'lease_compliance', text: 'Is the current usage compliant with the lease terms?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'financial_impact', text: 'Has this change resulted in any financial impact (sublease income, penalties)?', type: 'yesno', evidence_category: 'operational', required: true, confidence_weight: 'high' },
      { key: 'landlord_notified', text: 'Has the landlord been notified of this change?', type: 'yesno', evidence_category: 'retrospective', required: true, confidence_weight: 'medium' },
      { key: 'remediation_plan', text: 'Is there a remediation or normalization plan in place?', type: 'text', evidence_category: 'strategic', required: false, confidence_weight: 'low' },
    ],
  },
]

// ─── Confidence computation ───────────────────────────────────────────────────
function computeConfidence(
  questions: SurveyQuestion[],
  responses: Record<string, string>
): 'high' | 'low' {
  const highWeightAnswered = questions
    .filter(q => q.confidence_weight === 'high' && q.required)
    .filter(q => (responses[q.key] ?? '').trim().length > 0)
    .length
  const totalHighWeight = questions.filter(q => q.confidence_weight === 'high' && q.required).length
  return highWeightAnswered >= Math.ceil(totalHighWeight * 0.8) ? 'high' : 'low'
}

// ─── Step 1: Prompt type selector ─────────────────────────────────────────────
function PromptTypeSelector({
  selected,
  onSelect,
}: {
  selected: PromptType | null
  onSelect: (type: PromptType) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground mb-1">Select Investigation Type</h2>
        <p className="text-[13px] text-muted-foreground">
          Choose the type of signal or intelligence that prompted this investigation.
          Each type has a distinct question set tailored to the evidence category.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROMPT_CONFIGS.map(config => {
          const Icon = config.icon
          const isSelected = selected === config.id
          return (
            <button
              key={config.id}
              onClick={() => onSelect(config.id)}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-[var(--color-lg-primary)] shadow-sm'
                  : 'border-border bg-card hover:bg-muted/40'
              )}
              style={isSelected ? { background: 'var(--color-lg-accent-subtle)' } : {}}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${config.color}20` }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: config.color }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{config.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{config.description}</p>
                <span className="mt-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'var(--color-lg-accent-subtle)', color: 'var(--color-lg-primary)' }}>
                  {config.path_type === 'modification' ? 'Modification Path' : 'Reassessment Path'}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Survey form ──────────────────────────────────────────────────────
function SurveyForm({
  config,
  responses,
  onChange,
}: {
  config: PromptTypeConfig
  responses: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const Icon = config.icon
  const answeredRequired = config.questions.filter(q => q.required && (responses[q.key] ?? '').trim().length > 0).length
  const totalRequired = config.questions.filter(q => q.required).length
  const progress = Math.round((answeredRequired / totalRequired) * 100)

  // Group by evidence_category
  const categories: EvidenceCategory[] = ['retrospective', 'operational', 'strategic']
  const categoryLabels: Record<EvidenceCategory, string> = {
    retrospective: 'Retrospective Evidence',
    operational: 'Operational Factors',
    strategic: 'Strategic Context',
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Survey header */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${config.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-foreground">{config.label}</p>
          <p className="text-[12px] text-muted-foreground">{config.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[12px] text-muted-foreground">{answeredRequired}/{totalRequired} required</p>
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: 'var(--color-lg-success)' }}
            />
          </div>
        </div>
      </div>

      {/* Questions grouped by evidence category */}
      {categories.map(cat => {
        const catQuestions = config.questions.filter(q => q.evidence_category === cat)
        if (catQuestions.length === 0) return null
        return (
          <div key={cat}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {categoryLabels[cat]}
            </h3>
            <div className="space-y-3">
              {catQuestions.map((q, idx) => (
                <div key={q.key} className="rounded-lg border border-border bg-card px-4 py-3">
                  <Label className="text-[13px] font-medium text-foreground mb-2 block">
                    {q.text}
                    {q.required && <span style={{ color: 'var(--color-lg-error)' }}> *</span>}
                  </Label>
                  {q.type === 'text' && (
                    <Textarea
                      value={responses[q.key] ?? ''}
                      onChange={e => onChange(q.key, e.target.value)}
                      placeholder="Enter your response..."
                      className="min-h-[60px] text-[13px] resize-none"
                    />
                  )}
                  {q.type === 'yesno' && (
                    <div className="flex items-center gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => onChange(q.key, opt)}
                          className={cn(
                            'h-8 px-4 rounded text-[13px] font-medium transition-colors border',
                            responses[q.key] === opt
                              ? 'text-white border-transparent'
                              : 'border-border bg-card hover:bg-muted/40 text-foreground'
                          )}
                          style={responses[q.key] === opt
                            ? { background: opt === 'Yes' ? 'var(--color-lg-success)' : 'var(--color-lg-error)' }
                            : {}}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'select' && q.options && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => onChange(q.key, opt)}
                          className={cn(
                            'h-7 px-3 rounded text-[12px] transition-colors border',
                            responses[q.key] === opt
                              ? 'text-white border-transparent'
                              : 'border-border bg-card hover:bg-muted/40 text-foreground'
                          )}
                          style={responses[q.key] === opt
                            ? { background: 'var(--color-lg-primary)' }
                            : {}}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 3: Result card ──────────────────────────────────────────────────────
function ResultCard({
  config,
  confidence,
  onPromoteToCase,
  onPromoteToProject,
  onSendToClarification,
  onClose,
  promoted,
}: {
  config: PromptTypeConfig
  confidence: 'high' | 'low'
  onPromoteToCase: () => void
  onPromoteToProject: () => void
  onSendToClarification: () => void
  onClose: () => void
  promoted: string | null
}) {
  const Icon = config.icon
  const isHigh = confidence === 'high'

  return (
    <div className="flex flex-col gap-5">
      {/* Result header */}
      <div
        className="rounded-xl border-l-4 px-5 py-4"
        style={isHigh
          ? { borderColor: 'var(--color-lg-success)', background: 'var(--color-lg-success-subtle)' }
          : { borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          {isHigh
            ? <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-lg-success)' }} />
            : <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-lg-warning)' }} />}
          <p className="text-[15px] font-semibold" style={{ color: isHigh ? 'var(--color-lg-success)' : 'var(--color-lg-warning)' }}>
            {isHigh ? 'High Confidence — Action Required' : 'Low Confidence — Clarification Needed'}
          </p>
        </div>
        <p className="text-[13px] text-foreground">
          {isHigh
            ? `Survey responses indicate sufficient evidence to proceed. You can promote this investigation to a Reassessment Case or Contextual Project.`
            : `Survey responses do not provide sufficient evidence to proceed. Send to clarification to gather additional information before promoting.`}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Prompt type:</span>
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ background: `${config.color}20`, color: config.color }}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground capitalize">{config.path_type} path</span>
        </div>
      </div>

      {/* Action cards */}
      {promoted ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
          <div>
            <p className="text-[14px] font-semibold text-foreground">
              {promoted === 'case' ? 'Promoted to Reassessment Case' : promoted === 'project' ? 'Promoted to Contextual Project' : 'Sent to Clarification'}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {promoted === 'case' ? 'InvestigativeSurvey.status → promoted_to_case. ReassessmentCase created.' :
               promoted === 'project' ? 'ContextualProject created with originating_survey_id = this survey.' :
               'InvestigativeSurvey.status → sent_to_clarification.'}
            </p>
          </div>
        </div>
      ) : isHigh ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPromoteToCase}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-muted/40 hover:border-[var(--color-lg-primary)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--color-lg-accent-subtle)' }}>
              <FileText className="h-4.5 w-4.5" style={{ color: 'var(--color-lg-primary)' }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Promote to Case</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Creates ReassessmentCase with survey_response_id linked.
                Status → promoted_to_case.
              </p>
            </div>
          </button>
          <button
            onClick={onPromoteToProject}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-muted/40 hover:border-[var(--color-lg-success)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--color-lg-success-subtle)' }}>
              <FolderOpen className="h-4.5 w-4.5" style={{ color: 'var(--color-lg-success)' }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Promote to Contextual Project</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Creates ContextualProject with originating_survey_id.
                Use for complex multi-task investigations.
              </p>
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={onSendToClarification}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-muted/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-lg-warning-subtle)' }}>
            <MessageSquare className="h-4.5 w-4.5" style={{ color: 'var(--color-lg-warning)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Send to Clarification</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Status → sent_to_clarification. The submitter will be notified to provide additional evidence.
            </p>
          </div>
        </button>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onClose}>
          {promoted ? 'Close' : 'Cancel'}
        </Button>
        {promoted && (
          <Button
            size="sm"
            onClick={onClose}
            style={{ background: 'var(--color-lg-primary)', color: '#fff' }}
          >
            Done
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
type WizardStep = 'select_type' | 'fill_survey' | 'result'

export default function ReassessmentSurveyIntake() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_SURVEY_INTAKE
  const [, navigate] = useLocation()

  const [step, setStep] = useState<WizardStep>('select_type')
  const [selectedType, setSelectedType] = useState<PromptType | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<'high' | 'low' | null>(null)
  const [promoted, setPromoted] = useState<string | null>(null)

  const config = selectedType ? PROMPT_CONFIGS.find(c => c.id === selectedType) ?? null : null

  function handleTypeSelect(type: PromptType) {
    setSelectedType(type)
    setResponses({})
  }

  function handleResponseChange(key: string, value: string) {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmitSurvey() {
    if (!config) return
    const conf = computeConfidence(config.questions, responses)
    setConfidence(conf)
    setStep('result')
    // TODO: Backend integration required
    // POST /reassessments/surveys { prompt_type, path_type, responses, overall_confidence }
  }

  function handlePromoteToCase() {
    // TODO: Backend integration required
    // POST /reassessments/cases { survey_response_id: survey.id }
    // PATCH /reassessments/surveys/{id} { status: 'promoted_to_case' }
    setPromoted('case')
    toast.success('Promoted to Reassessment Case', {
      description: 'InvestigativeSurvey.status → promoted_to_case',
    })
  }

  function handlePromoteToProject() {
    // TODO: Backend integration required
    // POST /reassessments/contextual-projects { originating_survey_id: survey.id }
    setPromoted('project')
    toast.success('Promoted to Contextual Project', {
      description: 'ContextualProject created with originating_survey_id',
    })
  }

  function handleSendToClarification() {
    // TODO: Backend integration required
    // PATCH /reassessments/surveys/{id} { status: 'sent_to_clarification' }
    setPromoted('clarification')
    toast.warning('Sent to clarification', {
      description: 'InvestigativeSurvey.status → sent_to_clarification',
    })
  }

  function handleClose() {
    navigate('/reassessment/cases')
  }

  // Compute if survey can be submitted (all required questions answered)
  const canSubmit = config
    ? config.questions.filter(q => q.required).every(q => (responses[q.key] ?? '').trim().length > 0)
    : false

  // Step labels
  const STEPS = [
    { id: 'select_type', label: 'Investigation Type' },
    { id: 'fill_survey', label: 'Survey Questions' },
    { id: 'result', label: 'Result & Action' },
  ]
  const currentStepIdx = STEPS.findIndex(s => s.id === step)

  return (
    <div className="flex flex-col h-full bg-[var(--color-lg-page-bg)]">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-muted-foreground">Reassessment</span>
            <span className="text-[12px] text-muted-foreground">›</span>
            <span className="text-[12px] text-muted-foreground">Investigative Survey</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground">New Investigative Survey</h1>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-border bg-background px-6 py-3">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                  idx < currentStepIdx ? 'text-white' :
                  idx === currentStepIdx ? 'text-white' :
                  'bg-muted text-muted-foreground'
                )}
                style={idx <= currentStepIdx ? { background: 'var(--color-lg-primary)' } : {}}
              >
                {idx < currentStepIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span className={cn(
                'text-[12px]',
                idx === currentStepIdx ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 mx-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {step === 'select_type' && (
          <>
            <PromptTypeSelector selected={selectedType} onSelect={handleTypeSelect} />
            <div className="mt-6 flex justify-end">
              <Button
                size="sm"
                disabled={!selectedType}
                onClick={() => setStep('fill_survey')}
                className="gap-1.5"
                style={selectedType ? { background: 'var(--color-lg-primary)', color: '#fff' } : {}}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {step === 'fill_survey' && config && (
          <>
            <SurveyForm config={config} responses={responses} onChange={handleResponseChange} />
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep('select_type')}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                {!canSubmit && (
                  <p className="text-[11px] text-muted-foreground">
                    Answer all required questions to submit
                  </p>
                )}
                <Button
                  size="sm"
                  disabled={!canSubmit}
                  onClick={handleSubmitSurvey}
                  className="gap-1.5"
                  style={canSubmit ? { background: 'var(--color-lg-primary)', color: '#fff' } : {}}
                >
                  Submit Survey
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'result' && config && confidence && (
          <ResultCard
            config={config}
            confidence={confidence}
            onPromoteToCase={handlePromoteToCase}
            onPromoteToProject={handlePromoteToProject}
            onSendToClarification={handleSendToClarification}
            onClose={handleClose}
            promoted={promoted}
          />
        )}
      </div>
    </div>
  )
}
