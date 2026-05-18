/**
 * AgentCheckpointQueue — FC-9 Page A (agent-checkpoint-queue)
 * Route: /approvals/checkpoints
 *
 * All pending HumanCheckpoint records across all workflow domains.
 * Tabs by checkpoint_type. Sort: deadline ascending (overdue first).
 *
 * Auto-refresh: polls listHumanCheckpoints() every 30 seconds.
 * Cleanup: clearInterval in useEffect return to prevent memory leaks.
 *
 * Navigation map (checkpoint_type → destination route):
 *   extraction_review     → /extraction/verification
 *   classification_confirm→ /reassessment/classification
 *   assessment_confirm    → /reassessment/assessment
 *   analysis_confirm      → /reassessment/analysis
 *   export_attest         → /export/upload-task
 *   onboarding_approval   → /onboarding/complete
 *
 * Overdue = deadline_at < now(). Color-coded by time remaining:
 *   > 24h → green · 4–24h → amber · < 4h → red · overdue → red badge
 *
 * Data model refs:
 *   HumanCheckpoint (checkpoint_type, status, deadline_at,
 *     agent_confidence, agent_recommendation, contract_record_id)
 *
 * TODO: Backend integration required — GET /checkpoints?status=pending
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import {
  Clock, AlertTriangle, ChevronRight, Bot, RefreshCw,
  CheckCircle2, FileText, Tag, BarChart3, Share2, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import NotFound from '@/pages/NotFound'
import { useRole } from '@/contexts/RoleContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

const _screenKey = SCREEN_KEYS.AGENT_CHECKPOINT_QUEUE

// ─── Types ────────────────────────────────────────────────────────────────────
type CheckpointType =
  | 'all'
  | 'extraction_review'
  | 'classification_confirm'
  | 'assessment_confirm'
  | 'analysis_confirm'
  | 'export_attest'
  | 'onboarding_approval'

interface HumanCheckpoint {
  id: string
  contract_id: string
  contract_label: string
  checkpoint_type: Exclude<CheckpointType, 'all'>
  agent_confidence: number
  agent_recommendation: string
  deadline_at: string
  created_at: string
  assigned_to: string | null
}

// ─── Checkpoint type configuration ───────────────────────────────────────────
const TYPE_CONFIG: Record<Exclude<CheckpointType, 'all'>, {
  label: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  route: string
  description: string
}> = {
  extraction_review: {
    label: 'Extraction Review',
    icon: FileText,
    route: '/extraction/verification',
    description: 'Review agent-extracted fields before submission',
  },
  classification_confirm: {
    label: 'Classification',
    icon: Tag,
    route: '/reassessment/classification',
    description: 'Confirm agent lease classification',
  },
  assessment_confirm: {
    label: 'Assessment',
    icon: BarChart3,
    route: '/reassessment/assessment',
    description: 'Confirm option assessment determination',
  },
  analysis_confirm: {
    label: 'Analysis',
    icon: CheckCircle2,
    route: '/reassessment/analysis',
    description: 'Confirm reassessment analysis memo',
  },
  export_attest: {
    label: 'Export Attest',
    icon: Share2,
    route: '/export/upload-task',
    description: 'Attest governed export package',
  },
  onboarding_approval: {
    label: 'Onboarding',
    icon: Building2,
    route: '/onboarding/complete',
    description: 'Approve tenant onboarding completion',
  },
}

const TABS: CheckpointType[] = [
  'all', 'extraction_review', 'classification_confirm',
  'assessment_confirm', 'analysis_confirm', 'export_attest', 'onboarding_approval',
]

const TYPE_LABELS: Record<CheckpointType, string> = {
  all: 'All',
  extraction_review: 'Extraction Review',
  classification_confirm: 'Classification',
  assessment_confirm: 'Assessment',
  analysis_confirm: 'Analysis',
  export_attest: 'Export Attest',
  onboarding_approval: 'Onboarding',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /checkpoints?status=pending
function getMockCheckpoints(): HumanCheckpoint[] {
  return [
    {
      id: 'cp-001', contract_id: 'CR-2026-0041', contract_label: 'Retail HQ Lease 2026',
      checkpoint_type: 'extraction_review',
      agent_confidence: 0.87, agent_recommendation: 'All 73 fields extracted. 2 critical fields require review: base_rent_amount, option_exercise_date.',
      deadline_at: new Date(Date.now() + 2.5 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      assigned_to: 'J. Martinez',
    },
    {
      id: 'cp-002', contract_id: 'CR-2026-0039', contract_label: 'Office Tower Amendment',
      checkpoint_type: 'classification_confirm',
      agent_confidence: 0.94, agent_recommendation: 'Classified as Amendment — Rent Adjustment. High confidence. Lease modification path recommended.',
      deadline_at: new Date(Date.now() + 18 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      assigned_to: 'S. Patel',
    },
    {
      id: 'cp-003', contract_id: 'CR-2026-0037', contract_label: 'Warehouse Lease Exhibit',
      checkpoint_type: 'assessment_confirm',
      agent_confidence: 0.71, agent_recommendation: 'Renewal option recommended. Medium confidence — lease terms ambiguous on exercise window.',
      deadline_at: new Date(Date.now() + 30 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 60 * 60000).toISOString(),
      assigned_to: null,
    },
    {
      id: 'cp-004', contract_id: 'CR-2026-0035', contract_label: 'Ground Lease Base Contract',
      checkpoint_type: 'export_attest',
      agent_confidence: 0.99, agent_recommendation: 'All 6 preflight checks passed. Package ready for attestation and governed export.',
      deadline_at: new Date(Date.now() + 47 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      assigned_to: 'R. Thompson',
    },
    {
      id: 'cp-005', contract_id: 'CR-2026-0033', contract_label: 'Industrial Park Schedule',
      checkpoint_type: 'analysis_confirm',
      agent_confidence: 0.82, agent_recommendation: 'Analysis memo drafted. Recommend lease modification path. Option exercise date within 90 days.',
      deadline_at: new Date(Date.now() - 1 * 3600000).toISOString(), // overdue
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      assigned_to: 'J. Martinez',
    },
    {
      id: 'cp-006', contract_id: 'T-NEW-001', contract_label: 'Meridian Property Group',
      checkpoint_type: 'onboarding_approval',
      agent_confidence: 1.0, agent_recommendation: 'Tenant provisioning complete. All 12 setup steps passed. SuperAdmin approval required to activate.',
      deadline_at: new Date(Date.now() + 72 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      assigned_to: null,
    },
  ]
}

// ─── Deadline cell ────────────────────────────────────────────────────────────
function DeadlineCell({ deadline }: { deadline: string }) {
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const diffMs = end - now
  const diffH = diffMs / (1000 * 60 * 60)

  if (diffMs < 0) {
    const overdueMins = Math.abs(Math.floor(diffMs / 60000))
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold badge-error">
        <AlertTriangle className="h-3 w-3" />
        {overdueMins < 60 ? `${overdueMins}m overdue` : `${Math.floor(overdueMins / 60)}h overdue`}
      </span>
    )
  }
  const h = Math.floor(diffH)
  const m = Math.floor((diffH - h) * 60)
  const color = diffH > 24 ? 'var(--color-lg-success)' : diffH > 4 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)'
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
      <Clock className="h-3 w-3" />
      {h > 0 ? `${h}h ${m}m` : `${m}m`}
    </span>
  )
}

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.90 ? 'var(--color-lg-success)' : value >= 0.60 ? 'var(--color-lg-warning)' : 'var(--color-lg-error)'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AgentCheckpointQueue() {
  const { activeRole } = useRole()
  const allowedRoles = ['preparer', 'reviewer', 'approver', 'lease_admin', 'controller']
  if (!allowedRoles.includes(activeRole)) return <NotFound />

  const [, navigate] = useLocation()
  const [activeTab, setActiveTab] = useState<CheckpointType>('all')
  const [checkpoints, setCheckpoints] = useState<HumanCheckpoint[]>(getMockCheckpoints())
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 30-second auto-refresh with cleanup on unmount ────────────────────────
  function doRefresh() {
    setIsRefreshing(true)
    // TODO: Backend integration required — GET /checkpoints?status=pending
    // Replace with: const data = await listHumanCheckpoints({ status: 'pending' })
    setTimeout(() => {
      setCheckpoints(getMockCheckpoints())
      setLastRefresh(new Date())
      setIsRefreshing(false)
    }, 400)
  }

  useEffect(() => {
    intervalRef.current = setInterval(doRefresh, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Filtering and sorting ─────────────────────────────────────────────────
  const filtered = activeTab === 'all'
    ? checkpoints
    : checkpoints.filter(c => c.checkpoint_type === activeTab)

  const sorted = [...filtered].sort((a, b) => {
    // Overdue first, then by deadline ascending
    const aOverdue = new Date(a.deadline_at).getTime() < Date.now()
    const bOverdue = new Date(b.deadline_at).getTime() < Date.now()
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
  })

  const countByType = (t: CheckpointType) =>
    t === 'all' ? checkpoints.length : checkpoints.filter(c => c.checkpoint_type === t).length

  const overdueCount = checkpoints.filter(c => new Date(c.deadline_at).getTime() < Date.now()).length

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-lg-page-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-muted-foreground">Agents</span>
            <span className="text-[12px] text-muted-foreground">›</span>
            <span className="text-[12px] text-muted-foreground">Checkpoint Queue</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            Checkpoint Queue
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Pending human decisions across all agent-driven workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold badge-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overdueCount} overdue
            </span>
          )}
          <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold badge-warning">
            {checkpoints.length} pending
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={doRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Refresh · Auto-refreshes every 30s
              <br />
              Last: {lastRefresh.toLocaleTimeString()}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border bg-background px-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === t ? 'var(--color-lg-primary)' : 'transparent',
              color: activeTab === t ? 'var(--color-lg-primary)' : undefined,
            }}
          >
            {TYPE_LABELS[t]}
            {countByType(t) > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                activeTab === t ? 'badge-processing' : 'badge-muted'
              )}>
                {countByType(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="h-10 w-10 mb-3" style={{ color: 'var(--color-lg-success)' }} />
            <p className="text-[15px] font-semibold text-foreground">All clear</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {activeTab === 'all'
                ? 'No pending checkpoints across any workflow domain.'
                : `No pending ${TYPE_LABELS[activeTab]} checkpoints.`}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contract</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Confidence</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Assigned</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Deadline</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((cp, idx) => {
                  const isOverdue = new Date(cp.deadline_at).getTime() < Date.now()
                  const config = TYPE_CONFIG[cp.checkpoint_type]
                  const TypeIcon = config.icon

                  return (
                    <tr
                      key={cp.id}
                      className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        isOverdue ? 'border-l-2' : 'hover:bg-muted/20'
                      )}
                      style={isOverdue ? { borderLeftColor: 'var(--color-lg-error)' } : {}}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{cp.contract_label}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{cp.contract_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-semibold badge-muted cursor-default">
                              <TypeIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{config.description}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar value={cp.agent_confidence} />
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="text-muted-foreground line-clamp-2 text-[12px]">{cp.agent_recommendation}</p>
                      </td>
                      <td className="px-4 py-3">
                        {cp.assigned_to ? (
                          <span className="text-[12px] text-foreground">{cp.assigned_to}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DeadlineCell deadline={cp.deadline_at} />
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => navigate(config.route)}
                          style={{ background: 'var(--color-lg-primary)', color: '#fff' }}
                        >
                          Open <ChevronRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Auto-refresh notice */}
        <p className="mt-3 text-[11px] text-muted-foreground text-right">
          Auto-refreshes every 30s · Last updated {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
