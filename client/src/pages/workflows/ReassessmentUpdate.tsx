/**
 * ReassessmentUpdate — FC-6 Workflow Screen
 * Screen key: reassessment-update
 * Route: /workflows/reassessment/update
 * Role: Business Submitter / Lease Admin
 *
 * Captures triggering event data and queues the case for classification.
 * Event type selector, effective date, description, validation rules.
 *
 * Design: Structured Authority
 */
import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  GitBranch, CheckCircle2, Calendar, Info, ChevronRight, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

const EVENT_TYPES = [
  { key: 'opt_exercise',   label: 'Option Exercise',     desc: 'Renewal, termination, or purchase option' },
  { key: 'rent_mod',       label: 'Rent Modification',   desc: 'Change to base rent, escalation, or index' },
  { key: 'scope_change',   label: 'Scope Change',        desc: 'Area increase, decrease, or floor change' },
  { key: 'term_extension', label: 'Term Extension',      desc: 'Lease term extended beyond original end date' },
  { key: 'early_term',     label: 'Early Termination',   desc: 'Lessee or lessor exercising early exit' },
  { key: 'ibr_change',     label: 'IBR Reassessment',    desc: 'Incremental borrowing rate change trigger' },
];

// TODO: Backend integration required — GET /api/reassessments/cases/:id
const MOCK_CASES_LOOKUP: Record<string, {
  id: string; case_ref: string; contract_number: string; title: string;
  workspace: string; current_term_end: string; monthly_payment: string; lease_liability: string;
}> = {
  c1:  { id: 'c1',  case_ref: 'RC-2026-0014', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   workspace: 'Corporate Real Estate', current_term_end: '2028-06-30', monthly_payment: '$85,000',  lease_liability: '$4,250,000' },
  c2:  { id: 'c2',  case_ref: 'RC-2026-0013', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       workspace: 'Retail Portfolio',      current_term_end: '2027-12-31', monthly_payment: '$62,000',  lease_liability: '$3,100,000' },
  c3:  { id: 'c3',  case_ref: 'RC-2026-0012', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  workspace: 'Industrial Assets',     current_term_end: '2029-03-31', monthly_payment: '$41,500',  lease_liability: '$2,075,000' },
  c4:  { id: 'c4',  case_ref: 'RC-2026-0011', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    workspace: 'Technology Assets',     current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000' },
  c5:  { id: 'c5',  case_ref: 'RC-2026-0010', contract_number: 'CR-2026-0033', title: 'Branch Office — 88 Main St',     workspace: 'Branch Network',        current_term_end: '2027-06-30', monthly_payment: '$28,000',  lease_liability: '$1,120,000' },
  c6:  { id: 'c6',  case_ref: 'RC-2026-0009', contract_number: 'CR-2026-0028', title: 'Parking Garage — Level B2',      workspace: 'Facilities',            current_term_end: '2026-12-31', monthly_payment: '$18,500',  lease_liability: '$555,000'  },
  c7:  { id: 'c7',  case_ref: 'RC-2026-0008', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   workspace: 'Corporate Real Estate', current_term_end: '2028-06-30', monthly_payment: '$85,000',  lease_liability: '$4,250,000' },
  c8:  { id: 'c8',  case_ref: 'RC-2026-0007', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       workspace: 'Retail Portfolio',      current_term_end: '2027-12-31', monthly_payment: '$62,000',  lease_liability: '$3,100,000' },
  c9:  { id: 'c9',  case_ref: 'RC-2026-0006', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  workspace: 'Industrial Assets',     current_term_end: '2029-03-31', monthly_payment: '$41,500',  lease_liability: '$2,075,000' },
  c10: { id: 'c10', case_ref: 'RC-2026-0005', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    workspace: 'Technology Assets',     current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000' },
};

const WORKFLOW_STEPS = [
  { label: 'Trigger Identified', done: true },
  { label: 'Event Captured',     active: true },
  { label: 'Classification',     done: false },
  { label: 'Analysis',           done: false },
  { label: 'Review',             done: false },
  { label: 'Approval',           done: false },
];

export default function ReassessmentUpdatePage() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_UPDATE;
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const caseId = useMemo(() => new URLSearchParams(searchStr).get('caseId') ?? 'c1', [searchStr]);
  const MOCK_CASE = MOCK_CASES_LOOKUP[caseId] ?? MOCK_CASES_LOOKUP['c1'];

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = !!selectedEvent && !!effectiveDate && description.length >= 20;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    setTimeout(() => navigate('/reassessment/cases'), 1800);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <ScreenNumberBadge screenKey={SCREEN_KEYS.REASSESSMENT_UPDATE} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reassessment Update</h1>
            <p className="text-xs text-muted-foreground">Capture triggering event — queue for classification</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{MOCK_CASE.workspace}</span>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* Case context */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{MOCK_CASE.case_ref} · {MOCK_CASE.contract_number}</p>
                <p className="mt-0.5 text-base font-semibold">{MOCK_CASE.title}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Event Capture
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 border-t border-border pt-3">
              <div><p className="text-xs text-muted-foreground">Term End</p><p className="text-sm font-medium">{MOCK_CASE.current_term_end}</p></div>
              <div><p className="text-xs text-muted-foreground">Monthly Payment</p><p className="text-sm font-medium">{MOCK_CASE.monthly_payment}</p></div>
              <div><p className="text-xs text-muted-foreground">Lease Liability</p><p className="text-sm font-medium">{MOCK_CASE.lease_liability}</p></div>
            </div>
          </div>

          {/* Event type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Triggering Event Type <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(ev => (
                <button key={ev.key} onClick={() => setSelectedEvent(ev.key)}
                  className={cn('rounded-lg border p-3 text-left transition-all',
                    selectedEvent === ev.key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/40'
                  )}>
                  <p className="text-sm font-medium">{ev.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ev.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Effective date */}
          <div className="space-y-2">
            <Label htmlFor="effective-date" className="text-sm font-semibold">
              Effective Date <span className="text-destructive">*</span>
            </Label>
            <div className="relative max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="effective-date" type="date" value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Event Description <span className="text-destructive">*</span>
            </Label>
            <Textarea id="description"
              placeholder="Describe the triggering event in detail. Include any relevant context, counterparty communications, or supporting evidence references…"
              value={description} onChange={e => setDescription(e.target.value)}
              rows={4} className="resize-none" />
            <p className="text-xs text-muted-foreground">{description.length} / 20 minimum characters</p>
          </div>

          {/* Evidence note */}
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 flex gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Supporting documents (emails, notices, valuations) should be attached to the contract record
              under the <strong>Documents</strong> tab before submitting. The classification team will review all attached evidence.
            </p>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 pt-2">
            {submitted ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Event captured — queued for classification</span>
              </div>
            ) : (
              <>
                <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
                  Queue for Classification <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/reassessment/cases')}>Cancel</Button>
              </>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 border-l border-border bg-muted/20 p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workflow Position</p>
            </div>
            <div className="space-y-2.5">
              {WORKFLOW_STEPS.map(step => (
                <div key={step.label} className="flex items-center gap-2.5">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full',
                    step.done ? 'bg-emerald-500' : step.active ? 'bg-primary' : 'bg-muted-foreground/25'
                  )} />
                  <span className={cn('text-xs',
                    step.active ? 'font-semibold text-foreground' : step.done ? 'text-muted-foreground line-through' : 'text-muted-foreground'
                  )}>{step.active ? `→ ${step.label}` : step.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Required Role</p>
            <div className="flex flex-wrap gap-1">
              {['Business Submitter', 'Lease Admin'].map(r => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r}</span>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Validation Rules</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-1.5"><span className="text-primary">•</span> Event type required</li>
              <li className="flex gap-1.5"><span className="text-primary">•</span> Effective date required</li>
              <li className="flex gap-1.5"><span className="text-primary">•</span> Description ≥ 20 chars</li>
              <li className="flex gap-1.5"><span className="text-primary">•</span> No open case for same record</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
