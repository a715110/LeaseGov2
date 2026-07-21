/**
 * ReassessmentApproval — FC-6 Workflow Screen
 * Screen key: reassessment-approval
 * Route: /workflows/reassessment/approval
 * Role: Approver / Controller
 *
 * Final approval gate for reassessment cases.
 * Memo package summary, SoD compliance check, approve or reject with code.
 * Design: Structured Authority
 */
import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  GitBranch, CheckCircle2, XCircle, ChevronRight, ShieldCheck, FileText, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// TODO: Backend integration required — GET /api/reassessments/cases/:id
const MOCK_CASES_LOOKUP: Record<string, {
  id: string; case_ref: string; contract_number: string; title: string;
  approver: string; memo_ref: string; submitted_by: string; submitted_at: string;
}> = {
  c1:  { id: 'c1',  case_ref: 'RC-2026-0014', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   approver: 'Michael Torres', memo_ref: 'MEMO-2026-0088-R1', submitted_by: 'Sarah Chen',  submitted_at: '2026-05-15 14:32' },
  c2:  { id: 'c2',  case_ref: 'RC-2026-0013', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       approver: 'Michael Torres', memo_ref: 'MEMO-2026-0072-R1', submitted_by: 'Jordan Kim',  submitted_at: '2026-05-14 11:20' },
  c3:  { id: 'c3',  case_ref: 'RC-2026-0012', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  approver: 'Michael Torres', memo_ref: 'MEMO-2026-0055-R1', submitted_by: 'Jordan Kim',  submitted_at: '2026-05-13 09:45' },
  c4:  { id: 'c4',  case_ref: 'RC-2026-0011', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    approver: 'Michael Torres', memo_ref: 'MEMO-2026-0041-R1', submitted_by: 'Sarah Chen',  submitted_at: '2026-05-12 16:10' },
  c5:  { id: 'c5',  case_ref: 'RC-2026-0010', contract_number: 'CR-2026-0033', title: 'Branch Office — 88 Main St',     approver: 'Michael Torres', memo_ref: 'MEMO-2026-0033-R1', submitted_by: 'Jordan Kim',  submitted_at: '2026-05-11 14:55' },
  c6:  { id: 'c6',  case_ref: 'RC-2026-0009', contract_number: 'CR-2026-0028', title: 'Parking Garage — Level B2',      approver: 'Michael Torres', memo_ref: 'MEMO-2026-0028-R1', submitted_by: 'Sarah Chen',  submitted_at: '2026-05-10 10:30' },
  c7:  { id: 'c7',  case_ref: 'RC-2026-0008', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   approver: 'Michael Torres', memo_ref: 'MEMO-2026-0088-R2', submitted_by: 'Jordan Kim',  submitted_at: '2026-05-09 15:22' },
  c8:  { id: 'c8',  case_ref: 'RC-2026-0007', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       approver: 'Michael Torres', memo_ref: 'MEMO-2026-0072-R2', submitted_by: 'Sarah Chen',  submitted_at: '2026-05-08 13:40' },
  c9:  { id: 'c9',  case_ref: 'RC-2026-0006', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  approver: 'Michael Torres', memo_ref: 'MEMO-2026-0055-R2', submitted_by: 'Jordan Kim',  submitted_at: '2026-05-07 11:15' },
  c10: { id: 'c10', case_ref: 'RC-2026-0005', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    approver: 'Michael Torres', memo_ref: 'MEMO-2026-0041-R2', submitted_by: 'Sarah Chen',  submitted_at: '2026-05-06 09:00' },
};

const SOD_CHECKS = [
  { label: 'Approver did not prepare this case', passed: true },
  { label: 'Approver did not review this case', passed: true },
  { label: 'Approver has required authority level', passed: true },
  { label: 'No conflict of interest declared', passed: true },
];

const REJECTION_CODES = [
  { code: 'R01', label: 'Insufficient evidence' },
  { code: 'R02', label: 'Incorrect classification' },
  { code: 'R03', label: 'Materiality threshold not met' },
  { code: 'R04', label: 'SoD violation' },
  { code: 'R05', label: 'Other (see comments)' },
];

const WORKFLOW_STEPS = [
  { label: 'Event Captured',  done: true },
  { label: 'Classification',  done: true },
  { label: 'Analysis',        done: true },
  { label: 'Analyst Review',  done: true },
  { label: 'Memo Generation', done: true },
  { label: 'Approval',        active: true },
];

export default function ReassessmentApprovalPage() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_APPROVAL;
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const caseId = useMemo(() => new URLSearchParams(searchStr).get('caseId') ?? 'c1', [searchStr]);
  const MOCK_CASE = MOCK_CASES_LOOKUP[caseId] ?? MOCK_CASES_LOOKUP['c1'];

  const MEMO_SUMMARY = [
    { label: 'Classification',      value: 'Reassessment — Option Exercise' },
    { label: 'Financial Impact',    value: '+$1,640,000 lease liability' },
    { label: 'Accounting Standard', value: 'IFRS 16 paragraph 45' },
    { label: 'Effective Date',      value: '2026-06-01' },
    { label: 'Reviewer',            value: MOCK_CASE.submitted_by },
    { label: 'Memo Version',        value: MOCK_CASE.memo_ref },
  ];

  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionCode, setRejectionCode] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = decision === 'approve' || (decision === 'reject' && !!rejectionCode);

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    setTimeout(() => navigate('/reassessment/cases'), 1800);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <ScreenNumberBadge screenKey={SCREEN_KEYS.REASSESSMENT_APPROVAL} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reassessment Approval</h1>
            <p className="text-xs text-muted-foreground">Final approval gate — SoD-enforced sign-off on the reassessment memo package</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" /><span>{MOCK_CASE.approver}</span>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{MOCK_CASE.case_ref} · {MOCK_CASE.contract_number}</p>
                <p className="mt-0.5 text-base font-semibold">{MOCK_CASE.title}</p>
              </div>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                Pending Approval
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Submitted by {MOCK_CASE.submitted_by} · {MOCK_CASE.submitted_at}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Memo Package Summary</h2>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {MEMO_SUMMARY.map(row => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground w-48">{row.label}</td>
                      <td className="px-4 py-3 text-xs font-medium">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Segregation of Duties Verification</h2>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2.5">
              {SOD_CHECKS.map((check, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm">{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Decision</h2>
            <div className="flex gap-3">
              <button onClick={() => setDecision('approve')}
                className={cn('flex-1 rounded-lg border p-4 text-left transition-all',
                  decision === 'approve' ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 dark:bg-emerald-950/20' : 'border-border bg-card hover:border-emerald-300')}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cn('h-5 w-5', decision === 'approve' ? 'text-emerald-600' : 'text-muted-foreground')} />
                  <span className="text-sm font-semibold">Approve</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Issue final approval — case advances to implementation</p>
              </button>
              <button onClick={() => setDecision('reject')}
                className={cn('flex-1 rounded-lg border p-4 text-left transition-all',
                  decision === 'reject' ? 'border-destructive bg-destructive/5 ring-1 ring-destructive' : 'border-border bg-card hover:border-destructive/40')}>
                <div className="flex items-center gap-2">
                  <XCircle className={cn('h-5 w-5', decision === 'reject' ? 'text-destructive' : 'text-muted-foreground')} />
                  <span className="text-sm font-semibold">Reject</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Return to Reviewer with mandatory rejection code</p>
              </button>
            </div>

            {decision === 'reject' && (
              <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Rejection Code <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {REJECTION_CODES.map(rc => (
                      <label key={rc.code} className="flex items-center gap-2.5 cursor-pointer">
                        <input type="radio" name="rejection_code" value={rc.code}
                          checked={rejectionCode === rc.code}
                          onChange={() => setRejectionCode(rc.code)}
                          className="accent-destructive" />
                        <span className="text-xs"><span className="font-mono font-semibold">{rc.code}</span> — {rc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Comments <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea placeholder="Add any notes for the Reviewer or audit trail…"
                value={comments} onChange={e => setComments(e.target.value)} rows={3} className="resize-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {submitted ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{decision === 'approve' ? 'Case approved — advancing to implementation' : 'Case rejected — returned to Reviewer'}</span>
              </div>
            ) : (
              <>
                <Button onClick={handleSubmit} disabled={!canSubmit}
                  className={cn('gap-2', decision === 'reject' && 'bg-destructive hover:bg-destructive/90')}>
                  {decision === 'reject' ? 'Confirm Rejection' : 'Issue Final Approval'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => navigate('/reassessment/cases')}>Cancel</Button>
              </>
            )}
          </div>
        </div>

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
                    step.done ? 'bg-emerald-500' : step.active ? 'bg-primary' : 'bg-muted-foreground/25')} />
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
              {['Approver', 'Controller'].map(r => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r}</span>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">SoD Status</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400">All checks passed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
