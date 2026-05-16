/**
 * RecordsDeferredTracker — FC-5 Screen 5.4 (Phase 2)
 * Screen key: records-deferred-tracker
 * Route: /records/:id/deferred
 *
 * Deferred fields table: ExtractionField records where disposition = 'deferred'
 * linked to this contractRecordId via ExtractionRecord.
 *
 * Resolve side panel: reusable DeferredFieldResolvePanel component.
 * Resolution options:
 *   - Accept AI Value  → disposition = 'accepted', final_value = ai_extracted_value
 *   - Enter Correct Value → disposition = 'corrected', final_value = user input
 *   - Mark Not Found   → disposition = 'not_found'  (hidden for is_critical = true)
 *
 * Resubmit button enabled only when critical_deferred_count = 0.
 * Count badge on Records Detail tab navigation updates reactively.
 *
 * Data model refs:
 *   ExtractionField (field_name, field_category, is_critical, ai_extracted_value,
 *     ai_confidence, deferred_justification, disposition, final_value)
 *   ExtractionRecord (contract_record_id)
 *
 * Design: Structured Authority — warning amber for deferred/critical, side panel 400px
 */
import { useState } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  AlertTriangle, CheckCircle2, X, ChevronRight,
  Shield, Send, Info, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type ResolutionType = 'accept_ai' | 'enter_value' | 'not_found'
type Disposition = 'deferred' | 'accepted' | 'corrected' | 'not_found'

interface DeferredField {
  id: string
  field_name: string
  field_label: string
  field_category: string
  is_critical: boolean
  ai_extracted_value: string | null
  ai_confidence: number | null
  deferred_justification: string
  deferred_by: string
  deferred_date: string
  disposition: Disposition
  final_value: string | null
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /extraction/records?contract_record_id={id}&disposition=deferred
const MOCK_DEFERRED_FIELDS: DeferredField[] = [
  {
    id: 'ef-001',
    field_name: 'security_deposit',
    field_label: 'Security Deposit',
    field_category: 'Financial',
    is_critical: false,
    ai_extracted_value: '$85,000',
    ai_confidence: 0.61,
    deferred_justification: 'Amount unclear — awaiting landlord confirmation letter',
    deferred_by: 'J. Martinez',
    deferred_date: '2026-05-14',
    disposition: 'deferred',
    final_value: null,
  },
  {
    id: 'ef-002',
    field_name: 'cam_base_year',
    field_label: 'CAM Base Year',
    field_category: 'Financial',
    is_critical: false,
    ai_extracted_value: '2022',
    ai_confidence: 0.54,
    deferred_justification: 'Not specified in base contract — check Exhibit B',
    deferred_by: 'J. Martinez',
    deferred_date: '2026-05-14',
    disposition: 'deferred',
    final_value: null,
  },
  {
    id: 'ef-003',
    field_name: 'rent_commencement_date',
    field_label: 'Rent Commencement Date',
    field_category: 'Core Metadata',
    is_critical: true,
    ai_extracted_value: '2022-04-01',
    ai_confidence: 0.72,
    deferred_justification: 'Conflicting dates in base lease vs Amendment 1 — requires legal review',
    deferred_by: 'A. Chen',
    deferred_date: '2026-05-15',
    disposition: 'deferred',
    final_value: null,
  },
  {
    id: 'ef-004',
    field_name: 'escalation_rate',
    field_label: 'Escalation Rate',
    field_category: 'Financial',
    is_critical: true,
    ai_extracted_value: '3.00%',
    ai_confidence: 0.68,
    deferred_justification: 'Escalation clause references CPI index — requires accounting team input',
    deferred_by: 'A. Chen',
    deferred_date: '2026-05-15',
    disposition: 'deferred',
    final_value: null,
  },
  {
    id: 'ef-005',
    field_name: 'cam_cap_pct',
    field_label: 'CAM Cap Percentage',
    field_category: 'Financial',
    is_critical: false,
    ai_extracted_value: null,
    ai_confidence: null,
    deferred_justification: 'CAM cap not found in any document — may be uncapped',
    deferred_by: 'J. Martinez',
    deferred_date: '2026-05-14',
    disposition: 'deferred',
    final_value: null,
  },
]

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
      {category}
    </span>
  )
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? 'var(--color-lg-success)' : value >= 0.6 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ─── Resolve Side Panel ───────────────────────────────────────────────────────
// Reusable component — exported for use in other screens
export function DeferredFieldResolvePanel({
  field,
  onClose,
  onResolve,
}: {
  field: DeferredField
  onClose: () => void
  onResolve: (fieldId: string, resolution: ResolutionType, value: string | null) => void
}) {
  const [selectedResolution, setSelectedResolution] = useState<ResolutionType | null>(null)
  const [enteredValue, setEnteredValue] = useState('')

  const canSubmit =
    selectedResolution === 'accept_ai' ||
    selectedResolution === 'not_found' ||
    (selectedResolution === 'enter_value' && enteredValue.trim().length > 0)

  function handleResolve() {
    if (!selectedResolution) return
    const finalValue =
      selectedResolution === 'accept_ai' ? field.ai_extracted_value :
      selectedResolution === 'enter_value' ? enteredValue.trim() :
      null
    onResolve(field.id, selectedResolution, finalValue)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-foreground">{field.field_label}</h3>
            {field.is_critical && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
                    <Shield className="h-2.5 w-2.5" />
                    CRITICAL
                  </span>
                </TooltipTrigger>
                <TooltipContent>Critical field — cannot be marked Not Found</TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground font-mono">{field.field_name}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-accent"
          aria-label="Close panel"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Deferred justification */}
        <div className="rounded-md border-l-2 px-3 py-2.5 text-[12px]" style={{ borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)' }}>
          <p className="font-semibold mb-0.5" style={{ color: 'var(--color-lg-warning)' }}>Deferred Justification</p>
          <p className="text-foreground">{field.deferred_justification}</p>
          <p className="mt-1 text-muted-foreground">Deferred by {field.deferred_by} on {field.deferred_date}</p>
        </div>

        {/* AI extracted value */}
        {field.ai_extracted_value && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">AI Extracted Value</p>
            <p className="text-[14px] font-medium text-foreground">{field.ai_extracted_value}</p>
            {field.ai_confidence !== null && (
              <div className="mt-1.5">
                <ConfidenceBar value={field.ai_confidence} />
              </div>
            )}
          </div>
        )}

        {/* Resolution options */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Resolution</p>

          {/* Accept AI Value */}
          {field.ai_extracted_value && (
            <button
              onClick={() => setSelectedResolution('accept_ai')}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left transition-all',
                selectedResolution === 'accept_ai'
                  ? 'border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)]'
                  : 'border-border bg-card hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  selectedResolution === 'accept_ai' ? 'border-[var(--color-lg-success)] bg-[var(--color-lg-success)]' : 'border-border'
                )}>
                  {selectedResolution === 'accept_ai' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">Accept AI Value</p>
                  <p className="text-[11px] text-muted-foreground">Use "{field.ai_extracted_value}" as the final value</p>
                </div>
              </div>
            </button>
          )}

          {/* Enter Correct Value */}
          <button
            onClick={() => setSelectedResolution('enter_value')}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-left transition-all',
              selectedResolution === 'enter_value'
                ? 'border-[var(--color-lg-primary)] bg-[var(--color-lg-accent-subtle)]'
                : 'border-border bg-card hover:bg-muted/40'
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                selectedResolution === 'enter_value' ? 'border-[var(--color-lg-primary)] bg-[var(--color-lg-primary)]' : 'border-border'
              )}>
                {selectedResolution === 'enter_value' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">Enter Correct Value</p>
                <p className="text-[11px] text-muted-foreground">Manually enter the verified final value</p>
              </div>
            </div>
            {selectedResolution === 'enter_value' && (
              <div className="mt-3" onClick={e => e.stopPropagation()}>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Correct Value</Label>
                <Input
                  value={enteredValue}
                  onChange={e => setEnteredValue(e.target.value)}
                  placeholder={`Enter ${field.field_label.toLowerCase()}...`}
                  className="h-8 text-[13px]"
                  autoFocus
                />
              </div>
            )}
          </button>

          {/* Mark Not Found — hidden for critical fields */}
          {!field.is_critical && (
            <button
              onClick={() => setSelectedResolution('not_found')}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left transition-all',
                selectedResolution === 'not_found'
                  ? 'border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)]'
                  : 'border-border bg-card hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  selectedResolution === 'not_found' ? 'border-[var(--color-lg-error)] bg-[var(--color-lg-error)]' : 'border-border'
                )}>
                  {selectedResolution === 'not_found' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">Mark Not Found</p>
                  <p className="text-[11px] text-muted-foreground">Field is not present in any source document</p>
                </div>
              </div>
            </button>
          )}

          {/* Critical field note */}
          {field.is_critical && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Critical field — "Not Found" is not available. Accept the AI value or enter the correct value.</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel footer */}
      <div className="border-t border-border px-5 py-4 flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={handleResolve}
          className="gap-1.5"
          style={canSubmit ? { background: 'var(--color-lg-success)', color: '#fff' } : {}}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolve Field
        </Button>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RecordsDeferredTracker() {
  const _screenKey = SCREEN_KEYS.RECORDS_DEFERRED_TRACKER
  const [, navigate] = useLocation()
  const params = useParams<{ id: string }>()
  const recordId = params.id || 'r1'

  const [fields, setFields] = useState<DeferredField[]>(MOCK_DEFERRED_FIELDS)
  const [selectedField, setSelectedField] = useState<DeferredField | null>(null)

  const deferredFields = fields.filter(f => f.disposition === 'deferred')
  const resolvedFields = fields.filter(f => f.disposition !== 'deferred')
  const criticalDeferred = deferredFields.filter(f => f.is_critical)
  const canResubmit = criticalDeferred.length === 0

  function handleResolve(fieldId: string, resolution: ResolutionType, value: string | null) {
    // TODO: Backend integration required — PATCH /extraction/fields/{fieldId}
    const newDisposition: Disposition =
      resolution === 'accept_ai' ? 'accepted' :
      resolution === 'enter_value' ? 'corrected' :
      'not_found'

    setFields(prev => prev.map(f =>
      f.id === fieldId
        ? { ...f, disposition: newDisposition, final_value: value }
        : f
    ))
    setSelectedField(null)
    toast.success('Field resolved', {
      description: resolution === 'accept_ai' ? 'AI value accepted' :
                   resolution === 'enter_value' ? 'Correct value entered' :
                   'Marked not found',
    })
  }

  function handleResubmit() {
    // TODO: Backend integration required — PATCH /contracts/property-leases/{id}/transitions
    toast.success('Record submitted for re-review', { description: 'The Reviewer has been notified.' })
    navigate(`/records/${recordId}`)
  }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-lg-page-bg)]">
      {/* Main content */}
      <div className={cn('flex flex-1 flex-col overflow-hidden transition-all duration-200', selectedField ? 'mr-[400px]' : '')}>
        {/* Page header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <button
                onClick={() => navigate(`/records/${recordId}`)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Record {recordId}
              </button>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">Deferred Fields</span>
            </div>
            <h1 className="text-[20px] font-semibold text-foreground">Deferred Fields Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    disabled={!canResubmit}
                    onClick={handleResubmit}
                    className="gap-1.5"
                    style={canResubmit ? { background: 'var(--color-lg-primary)', color: '#fff' } : {}}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Resubmit for Review
                  </Button>
                </span>
              </TooltipTrigger>
              {!canResubmit && (
                <TooltipContent>
                  Resolve all {criticalDeferred.length} critical deferred field{criticalDeferred.length !== 1 ? 's' : ''} before resubmitting
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Total Deferred</span>
            <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
              {deferredFields.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" style={{ color: 'var(--color-lg-warning)' }} />
            <span className="text-[12px] text-muted-foreground">Critical Deferred</span>
            <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
              style={criticalDeferred.length > 0
                ? { background: 'var(--color-lg-error-subtle)', color: 'var(--color-lg-error)' }
                : { background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
              {criticalDeferred.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-lg-success)' }} />
            <span className="text-[12px] text-muted-foreground">Resolved</span>
            <span className="rounded-full px-2 py-0.5 text-[12px] font-semibold" style={{ background: 'var(--color-lg-success-subtle)', color: 'var(--color-lg-success)' }}>
              {resolvedFields.length}
            </span>
          </div>

          {!canResubmit && (
            <div className="ml-auto flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-lg-error)' }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Resolve {criticalDeferred.length} critical field{criticalDeferred.length !== 1 ? 's' : ''} to enable resubmit
            </div>
          )}
          {canResubmit && deferredFields.length === 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-lg-success)' }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              All fields resolved — ready to resubmit
            </div>
          )}
          {canResubmit && deferredFields.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {deferredFields.length} non-critical field{deferredFields.length !== 1 ? 's' : ''} still deferred — resubmit available
            </div>
          )}
        </div>

        {/* Fields table */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Active deferred fields */}
          {deferredFields.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Pending Resolution ({deferredFields.length})
              </h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Field</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Category</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI Value</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Justification</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Deferred By</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferredFields.map((field) => (
                      <tr
                        key={field.id}
                        className={cn(
                          'border-b border-border last:border-0 transition-colors',
                          selectedField?.id === field.id ? 'bg-[var(--color-lg-accent-subtle)]' : 'hover:bg-muted/30',
                          field.is_critical ? 'border-l-2' : ''
                        )}
                        style={field.is_critical ? { borderLeftColor: 'var(--color-lg-warning)' } : {}}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {field.is_critical && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-lg-warning)' }} />
                                </TooltipTrigger>
                                <TooltipContent>Critical field</TooltipContent>
                              </Tooltip>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{field.field_label}</p>
                              <p className="text-[11px] font-mono text-muted-foreground">{field.field_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={field.field_category} />
                        </td>
                        <td className="px-4 py-3">
                          {field.ai_extracted_value ? (
                            <div>
                              <p className="text-foreground">{field.ai_extracted_value}</p>
                              {field.ai_confidence !== null && <ConfidenceBar value={field.ai_confidence} />}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[12px]">Not extracted</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-[12px] text-muted-foreground line-clamp-2">{field.deferred_justification}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] text-foreground">{field.deferred_by}</p>
                          <p className="text-[11px] text-muted-foreground">{field.deferred_date}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[12px] gap-1"
                            onClick={() => setSelectedField(field)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Resolve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resolved fields */}
          {resolvedFields.length > 0 && (
            <div>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                Resolved ({resolvedFields.length})
              </h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Field</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Resolution</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Final Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedFields.map(field => (
                      <tr key={field.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
                            <div>
                              <p className="font-medium text-foreground">{field.field_label}</p>
                              <p className="text-[11px] font-mono text-muted-foreground">{field.field_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
                            field.disposition === 'accepted' ? 'badge-approved' :
                            field.disposition === 'corrected' ? 'badge-processing' :
                            'badge-warning'
                          )}>
                            {field.disposition === 'accepted' ? 'Accepted' :
                             field.disposition === 'corrected' ? 'Corrected' :
                             'Not Found'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground">
                          {field.final_value ?? <span className="text-muted-foreground italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {fields.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-lg-success-subtle)' }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--color-lg-success)' }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">No Deferred Fields</p>
                <p className="mt-1 text-[13px] text-muted-foreground">All fields have been resolved for this record.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve side panel — fixed right */}
      {selectedField && (
        <div className="fixed right-0 top-0 bottom-0 w-[400px] border-l border-border bg-card shadow-xl z-40 flex flex-col">
          <DeferredFieldResolvePanel
            field={selectedField}
            onClose={() => setSelectedField(null)}
            onResolve={handleResolve}
          />
        </div>
      )}
    </div>
  )
}
