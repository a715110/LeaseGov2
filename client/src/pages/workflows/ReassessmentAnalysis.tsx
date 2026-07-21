/**
 * ReassessmentAnalysis — FC-6 Workflow Screen
 * Screen key: reassessment-analysis-workflow
 * Route: /workflows/reassessment/analysis
 * Role: Preparer / Analyst
 *
 * AI-assisted quantitative analysis. Updated lease schedule, remeasurement
 * calculations, draft memo. Submit for Reviewer sign-off.
 * Design: Structured Authority
 */
import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  GitBranch, CheckCircle2, ChevronRight, Bot, TrendingUp, FileText, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { MOCK_REASSESSMENT_CASES, FALLBACK_REASSESSMENT_CASE } from '@/lib/mockReassessmentData';

const BEFORE_AFTER = [
  { label: 'Lease Term (months)',  before: '60',         after: '84',         delta: '+24' },
  { label: 'Lease Liability ($)',  before: '$4,250,000', after: '$5,890,000', delta: '+$1,640,000' },
  { label: 'ROU Asset ($)',        before: '$4,100,000', after: '$5,720,000', delta: '+$1,620,000' },
  { label: 'Monthly Payment ($)',  before: '$85,000',    after: '$92,500',    delta: '+$7,500' },
  { label: 'Discount Rate (%)',    before: '4.25%',      after: '4.75%',      delta: '+0.50%' },
  { label: 'Remaining Periods',   before: '24',         after: '48',         delta: '+24' },
];

const JOURNAL_ENTRIES = [
  { dr: 'Right-of-Use Asset',  cr: '',                  amount: '$1,620,000', type: 'dr' },
  { dr: '',                    cr: 'Lease Liability',   amount: '$1,620,000', type: 'cr' },
  { dr: 'Lease Liability',     cr: '',                  amount: '$20,000',    type: 'dr' },
  { dr: '',                    cr: 'Cash / Accrual',    amount: '$20,000',    type: 'cr' },
];

const WORKFLOW_STEPS = [
  { label: 'Event Captured', done: true },
  { label: 'Classification', done: true },
  { label: 'Analysis',       active: true },
  { label: 'Analyst Review', done: false },
  { label: 'Memo Generation', done: false },
  { label: 'Approval',       done: false },
];

export default function ReassessmentAnalysisWorkflowPage() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_ANALYSIS_WORKFLOW;
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const caseId = useMemo(() => new URLSearchParams(searchStr).get('caseId') ?? 'c1', [searchStr]);
  const MOCK_CASE = MOCK_REASSESSMENT_CASES[caseId] ?? FALLBACK_REASSESSMENT_CASE;

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => navigate('/reassessment/cases'), 1800);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <ScreenNumberBadge screenKey={SCREEN_KEYS.REASSESSMENT_ANALYSIS_WORKFLOW} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reassessment Analysis</h1>
            <p className="text-xs text-muted-foreground">AI-assisted quantitative analysis — remeasurement calculations and draft memo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300">
            <Bot className="h-3.5 w-3.5" /><span>AI Confidence: {MOCK_CASE.ai_confidence}%</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" /><span>{MOCK_CASE.analyst}</span>
          </div>
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
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Analysis In Progress
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Before / After Comparison</h2>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Metric</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Before</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">After</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {BEFORE_AFTER.map(row => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                      <td className="px-4 py-3 text-xs">{row.before}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{row.after}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{row.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Journal Entry — Remeasurement</h2>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 font-mono text-xs space-y-1.5">
              {JOURNAL_ENTRIES.map((je, i) => (
                <div key={i} className="flex justify-between">
                  <span className={cn(je.type === 'cr' && 'pl-8 text-muted-foreground')}>
                    {je.dr || je.cr}
                  </span>
                  <span className={cn('font-semibold', je.type === 'dr' ? 'text-foreground' : 'text-muted-foreground')}>
                    {je.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 flex gap-2">
            <Bot className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              AI has generated a draft memo based on this analysis. The memo will be pre-populated
              in the Memo Generation step for Reviewer editing and sign-off.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {submitted ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /><span>Analysis submitted — queued for Analyst Review</span>
              </div>
            ) : (
              <>
                <Button onClick={handleSubmit} className="gap-2">
                  Submit for Review <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/reassessment/cases')}>Save Draft</Button>
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
              {['Preparer', 'Analyst'].map(r => (
                <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r}</span>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">AI Analysis</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Confidence</span><span className="font-semibold text-foreground">{MOCK_CASE.ai_confidence}%</span></div>
              <div className="flex justify-between"><span>Fields analysed</span><span className="font-semibold text-foreground">73</span></div>
              <div className="flex justify-between"><span>Flags raised</span><span className="font-semibold text-foreground">0</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
