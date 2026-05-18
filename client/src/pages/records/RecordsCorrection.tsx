/**
 * RecordsCorrection — FC-5 Screen 5.6 (Phase 2)
 * Screen key: records-correction
 * Route: /records/:id/correction
 *
 * Renders as inline dialog over RecordsDetail page — same pattern as
 * ApproverDialog431 from FC-4 (fixed inset-0 overlay, centered card).
 *
 * On confirm:
 *   PATCH /contracts/property-leases/{id}/transitions
 *   → ContractRecord.status = correction_in_progress
 *   → ContractRecord.lock_status = correction_in_progress
 *   → ContractRecord.rework_iteration++
 *   → Notification entity created for assigned Preparer
 *
 * Data model refs:
 *   ContractRecord (status, lock_status, rework_iteration, assigned_user_id)
 *   ExtractionField (field_name, field_label) — for affected fields selector
 *
 * Design: Structured Authority — inline dialog, warning amber for lock notice,
 *   error outlined for destructive action, FC-4 header/footer pattern
 */
import { useState } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  X, Edit3, AlertTriangle, CheckCircle2,
  Lock, Bell, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { toast } from 'sonner'
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /extraction/records?contract_record_id={id}
const CORRECTABLE_FIELDS = [
  { id: 'f1',  label: 'Landlord Name',          category: 'Parties',    is_critical: true },
  { id: 'f2',  label: 'Tenant Name',             category: 'Parties',    is_critical: true },
  { id: 'f3',  label: 'Commencement Date',        category: 'Dates',      is_critical: true },
  { id: 'f4',  label: 'Expiration Date',          category: 'Dates',      is_critical: true },
  { id: 'f5',  label: 'Base Rent Amount',         category: 'Financial',  is_critical: true },
  { id: 'f6',  label: 'Escalation Rate',          category: 'Financial',  is_critical: true },
  { id: 'f7',  label: 'Lease Classification',     category: 'Legal',      is_critical: true },
  { id: 'f8',  label: 'Property Address',         category: 'Property',   is_critical: true },
  { id: 'f9',  label: 'Rentable Area',            category: 'Property',   is_critical: true },
  { id: 'f10', label: 'Accounting Standard',      category: 'Legal',      is_critical: true },
  { id: 'f11', label: 'Security Deposit',         category: 'Financial',  is_critical: false },
  { id: 'f12', label: 'CAM Base Year',            category: 'Financial',  is_critical: false },
  { id: 'f13', label: 'CAM Cap Percentage',       category: 'Financial',  is_critical: false },
  { id: 'f14', label: 'Renewal Options',          category: 'Legal',      is_critical: false },
  { id: 'f15', label: 'Termination Options',      category: 'Legal',      is_critical: false },
  { id: 'f16', label: 'Rent Commencement Date',   category: 'Dates',      is_critical: true },
  { id: 'f17', label: 'Escalation Type',          category: 'Financial',  is_critical: true },
  { id: 'f18', label: 'Rent Frequency',           category: 'Financial',  is_critical: true },
]

// TODO: Backend integration required — GET /contracts/records/{id}
const MOCK_RECORD = {
  id: 'r1',
  contract_number: 'CR-2026-0088',
  title: 'Office Tower — 350 Fifth Ave',
  status: 'approved',
  rework_iteration: 1,
  assigned_preparer: 'J. Martinez',
}

const CATEGORIES = Array.from(new Set(CORRECTABLE_FIELDS.map(f => f.category)))

export default function RecordsCorrection() {
  const _screenKey = SCREEN_KEYS.RECORDS_CORRECTION
  const [, navigate] = useLocation()
  const params = useParams<{ id: string }>()
  const recordId = params.id || 'r1'

  const [reason, setReason] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(CATEGORIES)
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const canSubmit = reason.trim().length >= 10 && selectedFields.length > 0 && confirmed

  function toggleField(id: string) {
    setSelectedFields(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  function toggleCategory(cat: string) {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function handleSubmit() {
    if (!canSubmit) return
    // TODO: Backend integration required
    // PATCH /contracts/property-leases/{recordId}/transitions
    // body: { transition: 'initiate_correction', reason, affected_field_ids: selectedFields }
    // Response: ContractRecord.status → correction_in_progress
    //           ContractRecord.lock_status → correction_in_progress
    //           ContractRecord.rework_iteration++
    //           Notification created for assigned Preparer
    setSubmitted(true)
  }

  function handleClose() {
    navigate(`/records/${recordId}`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-card rounded-xl shadow-2xl w-[620px] max-h-[90vh] overflow-y-auto my-auto">

        {/* ── Header (FC-4 ApproverDialog431 pattern) ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[14px] font-bold text-foreground">
                {MOCK_RECORD.contract_number}
              </span>
              <span className="badge-approved inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold">
                Approved
              </span>
              {MOCK_RECORD.rework_iteration > 0 && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
                  Iteration {MOCK_RECORD.rework_iteration}
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground">{MOCK_RECORD.title}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Body ── */}
        {!submitted ? (
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Lock warning */}
            <div className="flex items-start gap-3 rounded-lg border-l-2 px-4 py-3 text-[13px]"
              style={{ borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)' }}>
              <Lock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-lg-warning)' }} />
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-lg-warning)' }}>
                  Record will be locked immediately
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Initiating correction sets <code className="text-[11px] bg-muted px-1 rounded">lock_status = correction_in_progress</code> and
                  increments <code className="text-[11px] bg-muted px-1 rounded">rework_iteration</code> to {MOCK_RECORD.rework_iteration + 1}.
                  The assigned Preparer (<strong>{MOCK_RECORD.assigned_preparer}</strong>) will be notified.
                </p>
              </div>
            </div>

            {/* Correction reason */}
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-foreground">
                Correction Reason <span style={{ color: 'var(--color-lg-error)' }}>*</span>
              </Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe what needs to be corrected and why (minimum 10 characters)..."
                className="min-h-[80px] text-[13px] resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {reason.trim().length}/10 minimum characters
                {reason.trim().length >= 10 && (
                  <span style={{ color: 'var(--color-lg-success)' }}> ✓</span>
                )}
              </p>
            </div>

            {/* Affected fields selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-semibold text-foreground">
                  Affected Fields <span style={{ color: 'var(--color-lg-error)' }}>*</span>
                </Label>
                <span className="text-[12px] text-muted-foreground">
                  {selectedFields.length} selected
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Select all fields that require correction. Critical fields are marked with a shield icon.
              </p>

              <div className="rounded-lg border border-border overflow-hidden">
                {CATEGORIES.map((cat, catIdx) => {
                  const catFields = CORRECTABLE_FIELDS.filter(f => f.category === cat)
                  const isExpanded = expandedCategories.includes(cat)
                  const selectedInCat = catFields.filter(f => selectedFields.includes(f.id)).length

                  return (
                    <div key={cat} className={cn('border-b border-border last:border-0')}>
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-foreground">{cat}</span>
                          {selectedInCat > 0 && (
                            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ background: 'var(--color-lg-primary)', color: '#fff' }}>
                              {selectedInCat}
                            </span>
                          )}
                        </div>
                        {isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 py-2 grid grid-cols-2 gap-1">
                          {catFields.map(field => (
                            <label
                              key={field.id}
                              className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/40 transition-colors"
                            >
                              <Checkbox
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                                className="h-3.5 w-3.5"
                              />
                              <span className="text-[12px] text-foreground flex-1">{field.label}</span>
                              {field.is_critical && (
                                <span className="text-[9px] font-semibold uppercase tracking-wide px-1 rounded"
                                  style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
                                  CRIT
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notification notice */}
            <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2.5 text-[12px] text-muted-foreground">
              <Bell className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                A notification will be sent to <strong className="text-foreground">{MOCK_RECORD.assigned_preparer}</strong> with
                the correction reason and list of affected fields.
              </span>
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={confirmed}
                onCheckedChange={v => setConfirmed(v === true)}
                className="mt-0.5"
              />
              <span className="text-[13px] text-foreground">
                I understand this action will lock the record and notify the assigned Preparer to begin corrections.
                This cannot be undone without a new approval cycle.
              </span>
            </label>
          </div>
        ) : (
          /* ── Success state ── */
          <div className="px-6 py-10 flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'var(--color-lg-warning-subtle)' }}>
              <Edit3 className="h-8 w-8" style={{ color: 'var(--color-lg-warning)' }} />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-foreground">Correction Initiated</p>
              <p className="mt-1 text-[13px] text-muted-foreground max-w-sm">
                Record <span className="font-mono font-semibold">{MOCK_RECORD.contract_number}</span> is now
                locked for correction. <strong>{MOCK_RECORD.assigned_preparer}</strong> has been notified.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-[12px]">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium" style={{ color: 'var(--color-lg-warning)' }}>correction_in_progress</span>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-muted-foreground">Iteration:</span>
              <span className="font-medium text-foreground">{MOCK_RECORD.rework_iteration + 1}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Back to Record
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/records')}
                style={{ background: 'var(--color-lg-primary)', color: '#fff' }}
              >
                Go to Records List
              </Button>
            </div>
          </div>
        )}

        {/* ── Footer (FC-4 pattern) ── */}
        {!submitted && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-card">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {!canSubmit && (
                <p className="text-[11px] text-muted-foreground">
                  {reason.trim().length < 10 ? 'Add correction reason · ' : ''}
                  {selectedFields.length === 0 ? 'Select affected fields · ' : ''}
                  {!confirmed ? 'Confirm acknowledgment' : ''}
                </p>
              )}
              <Button
                size="sm"
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="gap-1.5"
                style={canSubmit ? { background: 'var(--color-lg-error)', color: '#fff' } : {}}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Initiate Correction
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
