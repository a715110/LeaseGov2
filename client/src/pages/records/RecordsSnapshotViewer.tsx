/**
 * RecordsSnapshotViewer — FC-5 Screen 5.5 (Phase 2)
 * Screen key: records-snapshot-viewer
 * Route: /records/:id/snapshots
 *
 * Side-by-side comparison of two ContractRecordSnapshot entries (or current record).
 * Left dropdown: select historical snapshot.
 * Right dropdown: select another snapshot OR "Current Record" (live data).
 * Diff computed client-side — field-by-field comparison of snapshot_data JSONB.
 * Changed fields highlighted in amber (warning-subtle background).
 * snapshot_number 1 = initial approval; higher = later reassessments/corrections.
 *
 * Data model refs:
 *   ContractRecordSnapshot (snapshot_number, trigger_type, snapshot_data,
 *     created_at, created_by_user_id)
 *   ContractRecord + PropertyLease (for "Current Record" right panel)
 *
 * Design: Structured Authority — amber highlight for changed fields, split panels
 */
import { useState, useMemo } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  ChevronRight, GitCompare, Calendar, User,
  AlertTriangle, CheckCircle2, ArrowRight, ArrowLeftRight, Download, Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SnapshotData {
  [key: string]: string | number | boolean | null
}

interface Snapshot {
  id: string
  snapshot_number: number
  trigger_type: 'initial_approval' | 'reassessment' | 'correction' | 'amendment'
  snapshot_data: SnapshotData
  created_at: string
  created_by_user_id: string
  created_by_name: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /contracts/records/{id}/snapshots
const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snap-001',
    snapshot_number: 1,
    trigger_type: 'initial_approval',
    created_at: '2022-01-15T14:32:00Z',
    created_by_user_id: 'u1',
    created_by_name: 'S. Patel',
    snapshot_data: {
      landlord_name: 'Fifth Ave Properties LLC',
      tenant_name: 'Acme Corporation',
      commencement_date: '2022-01-01',
      expiration_date: '2027-12-31',
      lease_term_months: 72,
      base_rent_amount: 38000,
      base_rent_frequency: 'monthly',
      escalation_type: 'fixed_percentage',
      escalation_rate: 0.025,
      property_address_street: '350 Fifth Avenue, New York, NY 10001',
      rentable_area_sqft: 22000,
      lease_classification: 'operating',
      accounting_standard: 'asc_842',
      security_deposit: 76000,
      cam_base_year: 2022,
    },
  },
  {
    id: 'snap-002',
    snapshot_number: 2,
    trigger_type: 'amendment',
    created_at: '2023-06-01T09:15:00Z',
    created_by_user_id: 'u2',
    created_by_name: 'A. Chen',
    snapshot_data: {
      landlord_name: 'Fifth Ave Properties LLC',
      tenant_name: 'Acme Corporation',
      commencement_date: '2022-01-01',
      expiration_date: '2032-12-31',
      lease_term_months: 132,
      base_rent_amount: 42500,
      base_rent_frequency: 'monthly',
      escalation_type: 'fixed_percentage',
      escalation_rate: 0.03,
      property_address_street: '350 Fifth Avenue, New York, NY 10001',
      rentable_area_sqft: 24500,
      lease_classification: 'operating',
      accounting_standard: 'asc_842',
      security_deposit: 85000,
      cam_base_year: 2022,
    },
  },
  {
    id: 'snap-003',
    snapshot_number: 3,
    trigger_type: 'correction',
    created_at: '2024-03-10T11:45:00Z',
    created_by_user_id: 'u1',
    created_by_name: 'S. Patel',
    snapshot_data: {
      landlord_name: 'Fifth Ave Properties LLC',
      tenant_name: 'Acme Corporation',
      commencement_date: '2022-01-01',
      expiration_date: '2032-12-31',
      lease_term_months: 132,
      base_rent_amount: 42500,
      base_rent_frequency: 'monthly',
      escalation_type: 'fixed_percentage',
      escalation_rate: 0.03,
      property_address_street: '350 Fifth Avenue, Suite 1200, New York, NY 10001',
      rentable_area_sqft: 24500,
      lease_classification: 'operating',
      accounting_standard: 'asc_842',
      security_deposit: 85000,
      cam_base_year: 2023,
    },
  },
]

// "Current Record" live data (reads ContractRecord + PropertyLease)
// TODO: Backend integration required — GET /contracts/property-leases/{id}
const CURRENT_RECORD_DATA: SnapshotData = {
  landlord_name: 'Fifth Ave Properties LLC',
  tenant_name: 'Acme Corporation',
  commencement_date: '2022-01-01',
  expiration_date: '2032-12-31',
  lease_term_months: 132,
  base_rent_amount: 42500,
  base_rent_frequency: 'monthly',
  escalation_type: 'fixed_percentage',
  escalation_rate: 0.03,
  property_address_street: '350 Fifth Avenue, Suite 1200, New York, NY 10001',
  rentable_area_sqft: 24500,
  lease_classification: 'operating',
  accounting_standard: 'asc_842',
  security_deposit: 85000,
  cam_base_year: 2023,
}

// Field display config
const FIELD_LABELS: Record<string, string> = {
  landlord_name: 'Landlord Name',
  tenant_name: 'Tenant Name',
  commencement_date: 'Commencement Date',
  expiration_date: 'Expiration Date',
  lease_term_months: 'Lease Term (months)',
  base_rent_amount: 'Base Rent Amount',
  base_rent_frequency: 'Rent Frequency',
  escalation_type: 'Escalation Type',
  escalation_rate: 'Escalation Rate',
  property_address_street: 'Property Address',
  rentable_area_sqft: 'Rentable Area (sqft)',
  lease_classification: 'Lease Classification',
  accounting_standard: 'Accounting Standard',
  security_deposit: 'Security Deposit',
  cam_base_year: 'CAM Base Year',
}

const FIELD_CATEGORIES: Record<string, string> = {
  landlord_name: 'Parties',
  tenant_name: 'Parties',
  commencement_date: 'Dates',
  expiration_date: 'Dates',
  lease_term_months: 'Dates',
  base_rent_amount: 'Financial',
  base_rent_frequency: 'Financial',
  escalation_type: 'Financial',
  escalation_rate: 'Financial',
  security_deposit: 'Financial',
  cam_base_year: 'Financial',
  property_address_street: 'Property',
  rentable_area_sqft: 'Property',
  lease_classification: 'Legal',
  accounting_standard: 'Legal',
}

function formatValue(key: string, val: string | number | boolean | null): string {
  if (val === null || val === undefined) return '—'
  if (key === 'base_rent_amount' || key === 'security_deposit') {
    return `$${Number(val).toLocaleString()}/mo`
  }
  if (key === 'escalation_rate') return `${(Number(val) * 100).toFixed(2)}%`
  if (key === 'rentable_area_sqft') return `${Number(val).toLocaleString()} sqft`
  return String(val)
}

function triggerTypeBadge(type: Snapshot['trigger_type']) {
  const map: Record<string, { label: string; cls: string }> = {
    initial_approval: { label: 'Initial Approval', cls: 'badge-approved' },
    reassessment:     { label: 'Reassessment',     cls: 'badge-processing' },
    correction:       { label: 'Correction',        cls: 'badge-warning' },
    amendment:        { label: 'Amendment',         cls: 'badge-rework' },
  }
  const m = map[type] ?? { label: type, cls: 'badge-warning' }
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>
}

// ─── Diff engine (client-side) ────────────────────────────────────────────────
function computeDiff(
  left: SnapshotData,
  right: SnapshotData
): Record<string, boolean> {
  const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]))
  const changed: Record<string, boolean> = {}
  for (const key of allKeys) {
    changed[key] = String(left[key] ?? '') !== String(right[key] ?? '')
  }
  return changed
}

// ─── Panel header ─────────────────────────────────────────────────────────────
function PanelHeader({
  snapshot,
  isCurrent,
}: {
  snapshot: Snapshot | null
  isCurrent: boolean
}) {
  if (isCurrent) {
    return (
      <div className="rounded-t-lg border border-b-0 border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="badge-approved inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold">
            Current Record
          </span>
          <span className="text-[12px] text-muted-foreground">Live data</span>
        </div>
      </div>
    )
  }
  if (!snapshot) return null
  return (
    <div className="rounded-t-lg border border-b-0 border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            Snapshot #{snapshot.snapshot_number}
          </span>
          {triggerTypeBadge(snapshot.trigger_type)}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(snapshot.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {snapshot.created_by_name}
        </span>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RecordsSnapshotViewer() {
  const _screenKey = SCREEN_KEYS.RECORDS_SNAPSHOT_VIEWER
  const [, navigate] = useLocation()
  const params = useParams<{ id: string }>()
  const recordId = params.id || 'r1'

  // Read ?snap= query param to pre-select a snapshot navigated from the History tab
  const snapParam = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('snap')
    : null
  const initialLeftId = snapParam && MOCK_SNAPSHOTS.some(s => s.id === snapParam)
    ? snapParam
    : MOCK_SNAPSHOTS[0].id

  // Default: left = snapshot from URL param (or snapshot 1), right = current record
  const [leftId, setLeftId] = useState<string>(initialLeftId)
  const [rightId, setRightId] = useState<string>('current')
  const [showChangedOnly, setShowChangedOnly] = useState(false)

  const leftSnapshot = MOCK_SNAPSHOTS.find(s => s.id === leftId) ?? null
  const rightSnapshot = rightId === 'current' ? null : MOCK_SNAPSHOTS.find(s => s.id === rightId) ?? null
  const rightIsCurrent = rightId === 'current'

  const leftData = leftSnapshot?.snapshot_data ?? {}
  const rightData = rightIsCurrent ? CURRENT_RECORD_DATA : (rightSnapshot?.snapshot_data ?? {})

  // Client-side diff
  const diff = useMemo(() => computeDiff(leftData, rightData), [leftData, rightData])
  const changedCount = Object.values(diff).filter(Boolean).length

  // Group fields by category
  const allKeys = Object.keys(FIELD_LABELS)
  const categories = Array.from(new Set(allKeys.map(k => FIELD_CATEGORIES[k] ?? 'Other')))

  return (
    <div className="flex flex-col h-full bg-[var(--color-lg-page-bg)]">
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
            <span className="text-[12px] text-muted-foreground">Snapshot Comparison</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-muted-foreground" />
            Snapshot Viewer
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/records/${recordId}`)}>
          Back to Record
        </Button>
      </div>

      {/* Selector bar */}
      <div className="flex items-center gap-4 border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-muted-foreground w-10">Left</span>
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger className="h-8 w-[220px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_SNAPSHOTS.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  Snapshot #{s.snapshot_number} — {s.trigger_type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-background hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0 group"
              onClick={() => {
                const prevLeft = leftId;
                const prevRight = rightId;
                // When right is 'current', swap: left becomes 'current' (not valid for left panel),
                // so fall back to the first snapshot for the left side instead.
                const newLeft = prevRight === 'current'
                  ? (MOCK_SNAPSHOTS.find(s => s.id !== prevLeft)?.id ?? MOCK_SNAPSHOTS[0].id)
                  : prevRight;
                setLeftId(newLeft);
                setRightId(prevLeft);
              }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[12px]">
            Swap comparison direction
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-muted-foreground w-10">Right</span>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger className="h-8 w-[220px] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Record (live)</SelectItem>
              {MOCK_SNAPSHOTS.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  Snapshot #{s.snapshot_number} — {s.trigger_type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {changedCount > 0 ? (
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-lg-warning)' }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {changedCount} field{changedCount !== 1 ? 's' : ''} changed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--color-lg-success)' }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              No differences
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-[12px]"
                onClick={() => {
                  const leftLabel = leftSnapshot ? `Snapshot #${leftSnapshot.snapshot_number}` : 'Left'
                  const rightLabel = rightIsCurrent ? 'Current Record' : rightSnapshot ? `Snapshot #${rightSnapshot.snapshot_number}` : 'Right'
                  const lines = [`Snapshot Diff Export — Record ${recordId}`, `${leftLabel}  →  ${rightLabel}`, `Changed fields: ${changedCount}`, '']
                  for (const key of allKeys) {
                    if (!diff[key]) continue
                    const lv = formatValue(key, leftData[key] ?? null)
                    const rv = formatValue(key, rightData[key] ?? null)
                    lines.push(`${FIELD_LABELS[key]}: ${lv}  →  ${rv}`)
                  }
                  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = `diff-${recordId}.txt`; a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Diff exported')
                }}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[12px]">Download changed fields as .txt</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-[12px]"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[12px]">Print this comparison</TooltipContent>
          </Tooltip>
          {/* Changed-only toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChangedOnly ? 'default' : 'outline'}
                size="sm"
                className="h-7 gap-1.5 text-[12px]"
                onClick={() => setShowChangedOnly(v => !v)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {showChangedOnly ? 'All fields' : 'Changed only'}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[12px]">
              {showChangedOnly ? 'Show all fields' : 'Show only changed fields'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Comparison panels */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Empty state when changed-only filter has no results */}
        {showChangedOnly && changedCount === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-lg-success-subtle)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--color-lg-success)' }} />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-foreground">No differences found</p>
              <p className="text-[13px] text-muted-foreground mt-1">These two versions are identical across all fields.</p>
            </div>
            <button
              className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={() => setShowChangedOnly(false)}
            >
              Show all fields
            </button>
          </div>
        )}
        {categories.map(category => {
          const categoryKeys = allKeys.filter(k => (FIELD_CATEGORIES[k] ?? 'Other') === category)
          const hasCategoryChanges = categoryKeys.some(k => diff[k])
          // When showChangedOnly, skip categories with no changes entirely
          if (showChangedOnly && !hasCategoryChanges) return null

          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {category}
                </h2>
                {hasCategoryChanges && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
                    Changed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-border">
                {/* Left panel header */}
                <div className="border-b border-r border-border bg-muted/40 px-4 py-2.5">
                  {leftSnapshot && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">
                        Snapshot #{leftSnapshot.snapshot_number}
                      </span>
                      {triggerTypeBadge(leftSnapshot.trigger_type)}
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {new Date(leftSnapshot.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                {/* Right panel header */}
                <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                  {rightIsCurrent ? (
                    <div className="flex items-center gap-2">
                      <span className="badge-approved inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold">
                        Current Record
                      </span>
                      <span className="text-[11px] text-muted-foreground">Live data</span>
                    </div>
                  ) : rightSnapshot ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">
                        Snapshot #{rightSnapshot.snapshot_number}
                      </span>
                      {triggerTypeBadge(rightSnapshot.trigger_type)}
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {new Date(rightSnapshot.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Field rows — 3-column grid: left | arrow | right */}
                {categoryKeys.map((key, idx) => {
                  const isChanged = diff[key]
                  const leftVal = formatValue(key, leftData[key] ?? null)
                  const rightVal = formatValue(key, rightData[key] ?? null)
                  const isLast = idx === categoryKeys.length - 1
                  // Skip unchanged rows when filter is active
                  if (showChangedOnly && !isChanged) return null

                  return (
                    <>
                      {/* Left cell */}
                      <div
                        key={`left-${key}`}
                        className={cn(
                          'border-r border-border px-4 py-2.5',
                          !isLast && 'border-b',
                          isChanged && 'bg-[var(--color-lg-warning-subtle)]'
                        )}
                      >
                        <p className="text-[11px] text-muted-foreground mb-0.5">{FIELD_LABELS[key]}</p>
                        <div className="flex items-center gap-1.5">
                          <p className={cn('text-[13px]', isChanged ? 'font-medium line-through opacity-60' : 'text-foreground')}
                            style={isChanged ? { color: 'var(--color-lg-warning)' } : {}}>
                            {leftVal}
                          </p>
                          {isChanged && (
                            <ArrowRight className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-warning)' }} />
                          )}
                        </div>
                      </div>
                      {/* Right cell */}
                      <div
                        key={`right-${key}`}
                        className={cn(
                          'px-4 py-2.5',
                          !isLast && 'border-b border-border',
                          isChanged && 'bg-[var(--color-lg-warning-subtle)]'
                        )}
                      >
                        <p className="text-[11px] text-muted-foreground mb-0.5">{FIELD_LABELS[key]}</p>
                        <p className={cn('text-[13px]', isChanged ? 'font-semibold' : 'text-foreground')}
                          style={isChanged ? { color: 'var(--color-lg-warning)' } : {}}>
                          {rightVal}
                        </p>
                      </div>
                    </>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
