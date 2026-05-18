/**
 * ReassessmentSweep — FC-6 Screen 6.3 (Phase 2)
 * Screen key: reassessment-sweep
 * Route: /reassessment/sweep
 *
 * Period-end sweep: bulk review interface for all records due for periodic
 * re-evaluation in the selected period.
 *
 * Sweep scope is determined server-side based on:
 *   - Period selected (quarter/month)
 *   - WatchlistEntry.review_frequency for each record
 * Records without WatchlistEntry show N/A for Tier 1.
 *
 * Tier 1 inline quick check (4 boolean questions):
 *   tier1_below_market, tier1_significant_improvements,
 *   tier1_relocation_feasible, tier1_intent_unchanged
 * Saves to OptionAssessmentRecord with assessment_tier = 'tier_1_rapid'.
 * If Tier 1 determines escalation needed → "Create Case" button appears,
 * creates ReassessmentCase with trigger_type = 'opt_assess'.
 *
 * Batch submit creates AuditLog entry with action = 'period_sweep_submitted'.
 *
 * Data model refs:
 *   WatchlistEntry (review_frequency, priority, next_review_date)
 *   OptionAssessmentRecord (assessment_tier, tier1_*, determination)
 *   ReassessmentCase (trigger_type = 'opt_assess')
 *   AuditLog (action = 'period_sweep_submitted')
 *
 * Design: Structured Authority — amber for overdue, green for cleared,
 *   inline expandable Tier 1 panel per row
 */
import { useState, useMemo } from 'react'
import { useLocation } from 'wouter'
import {
  Calendar, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Send, Plus, Shield, Clock, Info, BarChart3, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { toast } from 'sonner'
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReviewFrequency = 'weekly' | 'monthly' | 'quarterly' | 'custom' | null
type Priority = 'high' | 'medium' | 'low'
type Determination = 'reasonably_certain' | 'not_reasonably_certain' | null

interface Tier1Assessment {
  tier1_below_market: boolean | null
  tier1_significant_improvements: boolean | null
  tier1_relocation_feasible: boolean | null
  tier1_intent_unchanged: boolean | null
}

type SweepStatus = 'pending' | 'tier1_complete' | 'case_created' | 'cleared'

interface SweepRecord {
  id: string
  contract_number: string
  title: string
  expiry_date: string
  priority: Priority
  review_frequency: ReviewFrequency
  days_overdue: number
  watchlist_entry_id: string | null
  option_type: 'renewal' | 'termination' | 'purchase' | null
  option_exercise_date: string | null
  sweep_status: SweepStatus
  tier1: Tier1Assessment
  determination: Determination
  case_created: boolean
  notes: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /reassessments/sweep-candidates?period={period}
const MOCK_SWEEP_RECORDS: SweepRecord[] = [
  {
    id: 'r1', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',
    expiry_date: '2032-12-31', priority: 'high', review_frequency: 'quarterly',
    days_overdue: 0, watchlist_entry_id: 'we-1',
    option_type: 'renewal', option_exercise_date: '2032-06-30',
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
  {
    id: 'r2', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',
    expiry_date: '2028-06-30', priority: 'high', review_frequency: 'monthly',
    days_overdue: 3, watchlist_entry_id: 'we-2',
    option_type: 'renewal', option_exercise_date: '2027-12-31',
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
  {
    id: 'r3', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',
    expiry_date: '2030-03-31', priority: 'medium', review_frequency: 'quarterly',
    days_overdue: 0, watchlist_entry_id: 'we-3',
    option_type: 'termination', option_exercise_date: '2028-09-30',
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
  {
    id: 'r4', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',
    expiry_date: '2027-09-30', priority: 'medium', review_frequency: 'monthly',
    days_overdue: 0, watchlist_entry_id: 'we-4',
    option_type: 'renewal', option_exercise_date: '2027-03-31',
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
  {
    id: 'r5', contract_number: 'CR-2026-0033', title: 'Branch Office — 88 Main St',
    expiry_date: '2026-12-31', priority: 'low', review_frequency: null,
    days_overdue: 0, watchlist_entry_id: null,
    option_type: null, option_exercise_date: null,
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
  {
    id: 'r6', contract_number: 'CR-2026-0028', title: 'Parking Garage — Level B2',
    expiry_date: '2029-08-31', priority: 'low', review_frequency: 'quarterly',
    days_overdue: 0, watchlist_entry_id: 'we-6',
    option_type: null, option_exercise_date: null,
    sweep_status: 'pending', tier1: { tier1_below_market: null, tier1_significant_improvements: null, tier1_relocation_feasible: null, tier1_intent_unchanged: null },
    determination: null, case_created: false, notes: '',
  },
]

// ─── Tier 1 question definitions ──────────────────────────────────────────────
const TIER1_QUESTIONS: { key: keyof Tier1Assessment; label: string; escalate_if: boolean }[] = [
  { key: 'tier1_below_market', label: 'Is the current rent significantly below market rate?', escalate_if: true },
  { key: 'tier1_significant_improvements', label: 'Has the tenant made significant leasehold improvements?', escalate_if: true },
  { key: 'tier1_relocation_feasible', label: 'Is relocation to an alternative site feasible and cost-effective?', escalate_if: false },
  { key: 'tier1_intent_unchanged', label: 'Has the business intent for this space remained unchanged?', escalate_if: false },
]

function computeDetermination(tier1: Tier1Assessment): Determination {
  const allAnswered = Object.values(tier1).every(v => v !== null)
  if (!allAnswered) return null
  // Escalation signals: below_market=true OR significant_improvements=true OR relocation_feasible=false
  const escalate = tier1.tier1_below_market === true ||
    tier1.tier1_significant_improvements === true ||
    tier1.tier1_relocation_feasible === false
  return escalate ? 'reasonably_certain' : 'not_reasonably_certain'
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    high: 'badge-error',
    medium: 'badge-warning',
    low: 'badge-approved',
  }
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${map[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

// ─── Tier 1 inline panel ──────────────────────────────────────────────────────
function Tier1Panel({
  record,
  onUpdate,
}: {
  record: SweepRecord
  onUpdate: (id: string, tier1: Tier1Assessment, determination: Determination, status: SweepStatus) => void
}) {
  const [tier1, setTier1] = useState<Tier1Assessment>({ ...record.tier1 })

  function handleAnswer(key: keyof Tier1Assessment, value: boolean) {
    const updated = { ...tier1, [key]: value }
    setTier1(updated)
    const det = computeDetermination(updated)
    const allAnswered = Object.values(updated).every(v => v !== null)
    const newStatus: SweepStatus = allAnswered ? 'tier1_complete' : 'pending'
    onUpdate(record.id, updated, det, newStatus)
  }

  const determination = computeDetermination(tier1)
  const allAnswered = Object.values(tier1).every(v => v !== null)

  return (
    <div className="border-t border-border bg-muted/20 px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4" style={{ color: 'var(--color-lg-primary)' }} />
        <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          Tier 1 Rapid Assessment
        </span>
        <span className="text-[11px] text-muted-foreground">— OptionAssessmentRecord (tier_1_rapid)</span>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-4">
        {TIER1_QUESTIONS.map((q, idx) => (
          <div key={q.key} className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5">
            <span className="text-[11px] font-mono text-muted-foreground w-4 mt-0.5">{idx + 1}.</span>
            <p className="flex-1 text-[13px] text-foreground">{q.label}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleAnswer(q.key, true)}
                className={cn(
                  'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                  tier1[q.key] === true
                    ? 'text-white'
                    : 'border border-border bg-card hover:bg-muted/40 text-foreground'
                )}
                style={tier1[q.key] === true ? { background: 'var(--color-lg-success)' } : {}}
              >
                Yes
              </button>
              <button
                onClick={() => handleAnswer(q.key, false)}
                className={cn(
                  'h-7 px-3 rounded text-[12px] font-medium transition-colors',
                  tier1[q.key] === false
                    ? 'text-white'
                    : 'border border-border bg-card hover:bg-muted/40 text-foreground'
                )}
                style={tier1[q.key] === false ? { background: 'var(--color-lg-error)' } : {}}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {allAnswered && determination && (
        <div className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium',
          determination === 'reasonably_certain'
            ? 'border-l-2'
            : 'border-l-2'
        )}
          style={determination === 'reasonably_certain'
            ? { borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }
            : { borderColor: 'var(--color-lg-success)', background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
          {determination === 'reasonably_certain' ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Reasonably Certain — escalation recommended. Use "Create Case" to open a full Tier 2 assessment.</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Not Reasonably Certain — no immediate action required. Record can be cleared for this period.</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReassessmentSweep() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_SWEEP
  const [, navigate] = useLocation()

  const [period, setPeriod] = useState('Q2-2026')
  const [records, setRecords] = useState<SweepRecord[]>(MOCK_SWEEP_RECORDS)
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const reviewedCount = records.filter(r => r.sweep_status !== 'pending').length
  const caseCreatedCount = records.filter(r => r.case_created).length
  const clearedCount = records.filter(r => r.sweep_status === 'cleared').length
  const canSubmit = reviewedCount > 0 && !submitted

  const PERIODS = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026', 'Q1-2025', 'Q4-2025']

  function toggleRow(id: string) {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  function handleTier1Update(id: string, tier1: Tier1Assessment, determination: Determination, status: SweepStatus) {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, tier1, determination, sweep_status: status } : r
    ))
  }

  function handleCreateCase(id: string) {
    // TODO: Backend integration required
    // POST /reassessments/cases { trigger_type: 'opt_assess', contract_record_id: id }
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, case_created: true, sweep_status: 'case_created' } : r
    ))
    toast.success('Reassessment case created', {
      description: 'trigger_type = opt_assess. Assigned to Reassessment queue.',
    })
  }

  function handleClear(id: string) {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, sweep_status: 'cleared' } : r
    ))
    setExpandedRows(prev => prev.filter(rid => rid !== id))
  }

  function handleBatchSubmit() {
    // TODO: Backend integration required
    // POST /audit/log { action: 'period_sweep_submitted', period, reviewed_count: reviewedCount }
    // Creates PhaseActivationLog-equivalent audit entry
    setSubmitted(true)
    toast.success(`Period sweep submitted`, {
      description: `${reviewedCount} records reviewed for ${period}. AuditLog entry created.`,
    })
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-lg-page-bg)]">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-muted-foreground">Reassessment</span>
            <span className="text-[12px] text-muted-foreground">›</span>
            <span className="text-[12px] text-muted-foreground">Period-End Sweep</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            Period-End Sweep
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Period</span>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-[130px] text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  disabled={!canSubmit}
                  onClick={handleBatchSubmit}
                  className="gap-1.5"
                  style={canSubmit ? { background: 'var(--color-lg-primary)', color: '#fff' } : {}}
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitted ? 'Sweep Submitted' : 'Submit Sweep'}
                </Button>
              </span>
            </TooltipTrigger>
            {!canSubmit && !submitted && (
              <TooltipContent>Complete at least one Tier 1 assessment before submitting</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">In Scope</span>
          <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold bg-muted text-foreground">{records.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Reviewed</span>
          <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
            style={{ background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
            {reviewedCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Cases Created</span>
          <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
            style={caseCreatedCount > 0
              ? { background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }
              : { background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
            {caseCreatedCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Cleared</span>
          <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
            style={{ background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
            {clearedCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground">{reviewedCount}/{records.length} reviewed</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(reviewedCount / records.length) * 100}%`, background: 'var(--color-lg-success)' }}
            />
          </div>
        </div>
      </div>

      {/* Submitted banner */}
      {submitted && (
        <div className="flex items-center gap-3 border-b border-border px-6 py-3"
          style={{ background: 'var(--color-lg-success-subtle)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-lg-success)' }} />
          <span className="text-[13px] font-medium" style={{ color: 'var(--color-lg-success)' }}>
            Sweep submitted for {period} — AuditLog entry created (action = period_sweep_submitted).
          </span>
        </div>
      )}

      {/* Records table */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {records.map((record, idx) => {
            const isExpanded = expandedRows.includes(record.id)
            const hasWatchlist = record.watchlist_entry_id !== null
            const hasOption = record.option_type !== null
            const isOverdue = record.days_overdue > 0

            return (
              <div key={record.id} className={cn('border-b border-border last:border-0')}>
                {/* Row */}
                <div
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 transition-colors',
                    isExpanded ? 'bg-[var(--color-lg-accent-subtle)]' : 'hover:bg-muted/30',
                    record.sweep_status === 'cleared' ? 'opacity-60' : '',
                    isOverdue ? 'border-l-2' : '',
                  )}
                  style={isOverdue ? { borderLeftColor: 'var(--color-lg-warning)' } : {}}
                >
                  {/* Status indicator */}
                  <div className="shrink-0">
                    {record.sweep_status === 'cleared' && (
                      <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-lg-success)' }} />
                    )}
                    {record.sweep_status === 'case_created' && (
                      <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-lg-warning)' }} />
                    )}
                    {record.sweep_status === 'tier1_complete' && (
                      <BarChart3 className="h-4 w-4" style={{ color: 'var(--color-lg-primary)' }} />
                    )}
                    {record.sweep_status === 'pending' && (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Record info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-foreground">{record.contract_number}</span>
                      <PriorityBadge priority={record.priority} />
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: 'var(--color-lg-warning)' }}>
                          <Clock className="h-3 w-3" />
                          {record.days_overdue}d overdue
                        </span>
                      )}
                      {record.sweep_status === 'case_created' && (
                        <span className="badge-warning inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold">
                          Case Created
                        </span>
                      )}
                      {record.sweep_status === 'cleared' && (
                        <span className="badge-approved inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold">
                          Cleared
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{record.title}</p>
                  </div>

                  {/* Expiry */}
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] text-muted-foreground">Expires</p>
                    <p className="text-[13px] text-foreground">{record.expiry_date}</p>
                  </div>

                  {/* Review frequency */}
                  <div className="shrink-0 text-right w-24">
                    {hasWatchlist ? (
                      <>
                        <p className="text-[12px] text-muted-foreground">Frequency</p>
                        <p className="text-[13px] text-foreground capitalize">{record.review_frequency}</p>
                      </>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                            <Info className="h-3 w-3" />
                            N/A
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>No WatchlistEntry — Tier 1 not applicable</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Option type */}
                  <div className="shrink-0 w-24 text-right">
                    {hasOption ? (
                      <>
                        <p className="text-[12px] text-muted-foreground">Option</p>
                        <p className="text-[13px] text-foreground capitalize">{record.option_type}</p>
                      </>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">No option</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {record.sweep_status === 'tier1_complete' && record.determination === 'reasonably_certain' && !record.case_created && (
                      <Button
                        size="sm"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => handleCreateCase(record.id)}
                        style={{ background: 'var(--color-lg-warning)', color: '#fff' }}
                      >
                        <Plus className="h-3 w-3" />
                        Create Case
                      </Button>
                    )}
                    {record.sweep_status === 'tier1_complete' && record.determination === 'not_reasonably_certain' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => handleClear(record.id)}
                        style={{ borderColor: 'var(--color-lg-success)', color: 'var(--color-lg-success)' }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Clear
                      </Button>
                    )}
                    {hasWatchlist && hasOption && record.sweep_status !== 'cleared' && record.sweep_status !== 'case_created' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[12px] gap-1"
                        onClick={() => toggleRow(record.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Collapse' : 'Tier 1'}
                      </Button>
                    )}
                    {!hasWatchlist && (
                      <span className="text-[12px] text-muted-foreground italic">No Tier 1</span>
                    )}
                  </div>
                </div>

                {/* Tier 1 inline panel */}
                {isExpanded && hasWatchlist && hasOption && (
                  <Tier1Panel
                    record={record}
                    onUpdate={handleTier1Update}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
