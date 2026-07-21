/**
 * ReassessmentReview — FC-6 Workflow Screen
 * Screen key: reassessment-review
 * Route: /workflows/reassessment/review
 * Role: Reviewer
 *
 * Analyst review of AI-generated classification output.
 * Field comparison table, sign-off checklist, approve for memo or escalate.
 * Design: Structured Authority
 */
import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  GitBranch, CheckCircle2, AlertTriangle, ChevronRight,
  Edit3, Eye, ShieldAlert, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// TODO: Backend integration required — GET /api/reassessments/cases/:id
const MOCK_CASES_LOOKUP: Record<string, { id: string; case_ref: string; contract_number: string; title: string; reviewer: string }> = {
  c1:  { id: 'c1',  case_ref: 'RC-2026-0014', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   reviewer: 'Sarah Chen'    },
  c2:  { id: 'c2',  case_ref: 'RC-2026-0013', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       reviewer: 'Sarah Chen'    },
  c3:  { id: 'c3',  case_ref: 'RC-2026-0012', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  reviewer: 'Jordan Kim'    },
  c4:  { id: 'c4',  case_ref: 'RC-2026-0011', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    reviewer: 'Sarah Chen'    },
  c5:  { id: 'c5',  case_ref: 'RC-2026-0010', contract_number: 'CR-2026-0033', title: 'Branch Office — 88 Main St',     reviewer: 'Jordan Kim'    },
  c6:  { id: 'c6',  case_ref: 'RC-2026-0009', contract_number: 'CR-2026-0028', title: 'Parking Garage — Level B2',      reviewer: 'Sarah Chen'    },
  c7:  { id: 'c7',  case_ref: 'RC-2026-0008', contract_number: 'CR-2026-0088', title: 'Office Tower — 350 Fifth Ave',   reviewer: 'Jordan Kim'    },
  c8:  { id: 'c8',  case_ref: 'RC-2026-0007', contract_number: 'CR-2026-0072', title: 'Retail HQ — 200 Park Ave',       reviewer: 'Sarah Chen'    },
  c9:  { id: 'c9',  case_ref: 'RC-2026-0006', contract_number: 'CR-2026-0055', title: 'Warehouse — 1 Industrial Blvd',  reviewer: 'Jordan Kim'    },
  c10: { id: 'c10', case_ref: 'RC-2026-0005', contract_number: 'CR-2026-0041', title: 'Data Center — 500 Tech Park',    reviewer: 'Sarah Chen'    },
};

const CLASSIFICATION_FIELDS = [
  { key: 'classification_result', label: 'Classification Result', ai_value: 'Reassessment', corrected: false },
  { key: 'trigger_type',          label: 'Trigger Type',          ai_value: 'Option Exercise', corrected: false },
  { key: 'path_type',             label: 'Path Type',             ai_value: 'Reassessment', corrected: false },
  { key: 'materiality',           label: 'Materiality Assessment', ai_value: 'Tier 2 Required', corrected: true },
  { key: 'probability',           label: 'Exercise Probability',  ai_value: '88% — Reasonably Certain', corrected: false },
];

const CHECKLIST = [
  'AI classification output reviewed',
  'Trigger type and date confirmed',
  'Materiality assessment validated',
  'Supporting evidence reviewed',
  'No escalation required',
];

const WORKFLOW_STEPS = [
  { label: 'Event Captured', done: true },
  { label: 'Classification', done: true },
  { label: 'Analysis',       done: true },
  { label: 'Analyst Review', active: true },
  { label: 'Memo Generation', done: false },
  { label: 'Approval',       done: false },
];

export default function ReassessmentReviewPage() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_REVIEW;
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const caseId = useMemo(() => new URLSearchParams(searchStr).get('caseId') ?? 'c1', [searchStr]);
  const MOCK_CASE = MOCK_CASES_LOOKUP[caseId] ?? MOCK_CASES_LOOKUP['c1'];

  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [commentary, setCommentary] = useState('');
  const [approved, setApproved] = useState(false);

  const allChecked = CHECKLIST.every((_, i) => checked[i]);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  function handleApprove() {
    if (!allChecked) return;
    setApproved(true);
    setTimeout(() => navigate('/reassessment/cases'), 1800);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <ScreenNumberBadge screenKey={SCREEN_KEYS.REASSESSMENT_REVIEW} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reassessment Review</h1>
            <p className="text-xs text-muted-foreground">Analyst review of classification output before memo generation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" /><span>{MOCK_CASE.reviewer}</span>
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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Reassessment</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">AI Confidence: 94%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Classification Output Review</h2>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Field</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">AI Output</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CLASSIFICATION_FIELDS.map(f => (
                    <tr key={f.key} className={cn('transition-colors', f.corrected && 'bg-amber-50/50 dark:bg-amber-950/20')}>
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{f.label}</td>
                      <td className="px-4 py-3 text-xs font-medium">{f.ai_value}</td>
                      <td className="px-4 py-3">
                        {f.corrected ? (
                          <div className="flex items-center gap-1.5"><Edit3 className="h-3.5 w-3.5 text-amber-600" /><span className="text-xs text-amber-700 dark:text-amber-400">Corrected</span></div>
                        ) : (
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-xs text-emerald-700 dark:text-emerald-400">Confirmed</span></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {CLASSIFICATION_FIELDS.some(f => f.corrected) && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">1 field corrected from AI output. Corrections are tracked in the audit trail.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Reviewer Sign-off Checklist</h2>
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              {CHECKLIST.map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!checked[i]}
                    onChange={e => setChecked(prev => ({ ...prev, [i]: e.target.checked }))}
                    className="h-4 w-4 rounded border-border accent-primary" />
                  <span className={cn('text-sm', checked[i] && 'line-through text-muted-foreground')}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Reviewer Commentary <span className="text-muted-foreground font-normal">(optional)</span></h2>
            <Textarea placeholder="Add any notes or observations for the Approver…"
              value={commentary} onChange={e => setCommentary(e.target.value)} rows={3} className="resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {approved ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /><span>Approved for memo generation</span>
              </div>
            ) : (
              <>
                <Button onClick={handleApprove} disabled={!allChecked} className="gap-2">
                  Approve for Memo <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5">
                  <ShieldAlert className="h-4 w-4" /> Escalate to Controller
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
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Reviewer</span>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Sign-off Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(checkedCount / CHECKLIST.length) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{checkedCount}/{CHECKLIST.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
