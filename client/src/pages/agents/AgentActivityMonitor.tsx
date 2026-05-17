/**
 * AgentActivityMonitor — FC-9 Page B (agent-activity-monitor)
 * Route: /agents/monitor
 *
 * Real-time view of all AgentTask records for the current tenant.
 * Four status columns: Running · Awaiting Checkpoint · Completed Today · Failed
 *
 * Auto-refresh: polls listAgentTasks() every 15 seconds.
 * Cleanup: clearInterval in useEffect return to prevent memory leaks.
 * Pulse animation: count badges pulse when counts change between polls.
 *
 * "Today" = tasks where created_at >= start of current day.
 * Completed column capped at last 50 entries for performance.
 *
 * InterventionButton in Running cards calls interveneOnAgentTask()
 *   which sets AgentTask.status → paused_by_human
 *
 * "Retry" on failed cards creates a new AgentTask for the same subject.
 *   TODO: Backend integration required — POST /agents/tasks/{id}/retry
 *
 * Activity feed at bottom: synthesized from AgentTask.decisions array
 *   (state transitions, human interventions, checkpoint events).
 *
 * Data model refs:
 *   AgentTask (agent_type, workflow_id, status, current_step,
 *     started_at, decisions, exceptions)
 *   AgentTask.decisions[]: { timestamp, action, actor, notes }
 *   AutomationPolicy (agent_type values for filter)
 *
 * TODO: Backend integration required — GET /agents/tasks
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import {
  Bot, AlertTriangle, Clock, CheckCircle2, Pause,
  ChevronDown, ChevronRight, RefreshCw, RotateCcw,
  Activity, Filter, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import NotFound from '@/pages/NotFound'
import { useRole } from '@/contexts/RoleContext'
import { InterventionButton } from '@/components/automation/InterventionButton'
import { AgentExceptionPanel, type AgentException } from '@/components/agents/AgentExceptionPanel'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const _screenKey = SCREEN_KEYS.AGENT_ACTIVITY_MONITOR

// ─── Types ────────────────────────────────────────────────────────────────────
type AgentStatus = 'running' | 'awaiting_checkpoint' | 'completed' | 'failed' | 'paused_by_human'

interface AgentDecision {
  timestamp: string
  action: string
  actor: 'agent' | 'human' | 'system'
  notes: string
}

interface AgentTaskCard {
  id: string
  agent_type: string
  workflow_id: string
  contract_id: string
  contract_label: string
  status: AgentStatus
  current_step: string
  started_at: string
  created_at: string
  duration: string
  exceptions?: AgentException[]
  decisions: AgentDecision[]
}

// ─── Mock data factory ────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /agents/tasks
function getMockTasks(): AgentTaskCard[] {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  return [
    {
      id: 'at-001', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-041',
      contract_id: 'CR-2026-0041', contract_label: 'Retail HQ Lease 2026',
      status: 'running', current_step: 'Extracting financial terms (step 4/7)',
      started_at: '09:14', created_at: new Date(Date.now() - 4 * 60000).toISOString(),
      duration: '4m 22s', exceptions: [],
      decisions: [
        { timestamp: '09:14:01', action: 'task_started', actor: 'system', notes: 'OCR pass 1 complete. Beginning field extraction.' },
        { timestamp: '09:15:30', action: 'step_completed', actor: 'agent', notes: 'Header fields extracted: 12/12.' },
        { timestamp: '09:17:44', action: 'step_in_progress', actor: 'agent', notes: 'Extracting financial terms. base_rent_amount ambiguous — running secondary pass.' },
      ],
    },
    {
      id: 'at-002', agent_type: 'workflow_orchestration', workflow_id: 'WF-ORCH-2026-039',
      contract_id: 'CR-2026-0039', contract_label: 'Office Tower Amendment',
      status: 'running', current_step: 'Running reassessment classification (step 2/5)',
      started_at: '09:08', created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      duration: '10m 15s', exceptions: [],
      decisions: [
        { timestamp: '09:08:00', action: 'task_started', actor: 'system', notes: 'Workflow orchestration initiated for amendment processing.' },
        { timestamp: '09:12:30', action: 'step_completed', actor: 'agent', notes: 'Document type confirmed: Amendment. Routing to reassessment classification.' },
      ],
    },
    {
      id: 'at-003', agent_type: 'reassessment', workflow_id: 'WF-REAS-2026-037',
      contract_id: 'CR-2026-0037', contract_label: 'Warehouse Lease Exhibit',
      status: 'awaiting_checkpoint', current_step: 'Awaiting classification_confirm checkpoint',
      started_at: '08:55', created_at: new Date(Date.now() - 23 * 60000).toISOString(),
      duration: '23m 40s', exceptions: [],
      decisions: [
        { timestamp: '08:55:00', action: 'task_started', actor: 'system', notes: 'Reassessment agent initiated.' },
        { timestamp: '09:10:00', action: 'checkpoint_created', actor: 'agent', notes: 'Classification complete. Confidence: 71%. Checkpoint created for human review.' },
        { timestamp: '09:18:40', action: 'awaiting_human', actor: 'system', notes: 'Task paused pending HumanCheckpoint cp-003 resolution.' },
      ],
    },
    {
      id: 'at-004', agent_type: 'compliance', workflow_id: 'WF-COMP-2026-035',
      contract_id: 'CR-2026-0035', contract_label: 'Ground Lease Base Contract',
      status: 'awaiting_checkpoint', current_step: 'Awaiting export_attest checkpoint',
      started_at: '08:30', created_at: new Date(Date.now() - 48 * 60000).toISOString(),
      duration: '48m 02s', exceptions: [],
      decisions: [
        { timestamp: '08:30:00', action: 'task_started', actor: 'system', notes: 'Compliance agent initiated for governed export.' },
        { timestamp: '08:55:00', action: 'step_completed', actor: 'agent', notes: 'All 6 preflight checks passed. Export package assembled.' },
        { timestamp: '09:18:02', action: 'checkpoint_created', actor: 'agent', notes: 'Export attestation checkpoint created. Awaiting controller sign-off.' },
      ],
    },
    {
      id: 'at-005', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-033',
      contract_id: 'CR-2026-0033', contract_label: 'Industrial Park Schedule',
      status: 'completed', current_step: 'Completed',
      started_at: '07:45', created_at: new Date(Date.now() - 90 * 60000).toISOString(),
      duration: '12m 18s', exceptions: [],
      decisions: [
        { timestamp: '07:45:00', action: 'task_started', actor: 'system', notes: 'Extraction agent initiated.' },
        { timestamp: '07:57:18', action: 'task_completed', actor: 'agent', notes: 'All 68 fields extracted. Confidence: 96%. Submitted for review.' },
      ],
    },
    {
      id: 'at-006', agent_type: 'ocr', workflow_id: 'WF-OCR-2026-031',
      contract_id: 'CR-2026-0031', contract_label: 'Suburban Office Lease',
      status: 'completed', current_step: 'Completed',
      started_at: '07:12', created_at: new Date(Date.now() - 120 * 60000).toISOString(),
      duration: '6m 55s', exceptions: [],
      decisions: [
        { timestamp: '07:12:00', action: 'task_started', actor: 'system', notes: 'OCR agent initiated. 24-page document.' },
        { timestamp: '07:18:55', action: 'task_completed', actor: 'agent', notes: 'OCR complete. Average confidence: 98.2%. Ready for extraction.' },
      ],
    },
    {
      id: 'at-007', agent_type: 'extraction', workflow_id: 'WF-EXT-2026-029',
      contract_id: 'CR-2026-0029', contract_label: 'Mixed-Use Development',
      status: 'failed', current_step: 'Failed at field extraction (step 4/7)',
      started_at: '06:50', created_at: new Date(Date.now() - 150 * 60000).toISOString(),
      duration: '3m 11s',
      exceptions: [
        {
          id: 'ex-001', exception_type: 'ocr_quality_insufficient', urgency: 'HIGH',
          message: 'Page 4 OCR confidence below threshold (32%). Cannot extract financial terms.',
          attempted: 'Attempted 3 OCR passes with different preprocessing settings.',
          what_needed: 'Re-upload a higher quality scan of page 4 or enter financial terms manually.',
          contract_id: 'CR-2026-0029', timestamp: '06:53', can_defer: false,
        },
      ],
      decisions: [
        { timestamp: '06:50:00', action: 'task_started', actor: 'system', notes: 'Extraction agent initiated.' },
        { timestamp: '06:51:30', action: 'step_completed', actor: 'agent', notes: 'Header fields extracted successfully.' },
        { timestamp: '06:53:11', action: 'task_failed', actor: 'agent', notes: 'OCR quality insufficient on page 4. Exception raised: ocr_quality_insufficient.' },
      ],
    },
    {
      id: 'at-008', agent_type: 'workflow_orchestration', workflow_id: 'WF-ORCH-2026-027',
      contract_id: 'CR-2026-0027', contract_label: 'Retail Strip Mall',
      status: 'failed', current_step: 'Failed at approval routing (step 3/5)',
      started_at: '06:20', created_at: new Date(Date.now() - 180 * 60000).toISOString(),
      duration: '8m 44s',
      exceptions: [
        {
          id: 'ex-002', exception_type: 'approver_not_assigned', urgency: 'MEDIUM',
          message: 'No approver assigned for workspace "West Region". Cannot route for approval.',
          attempted: 'Checked all user role assignments for workspace.',
          what_needed: 'Assign an approver role to at least one user in the West Region workspace.',
          contract_id: 'CR-2026-0027', timestamp: '06:28', can_defer: true,
        },
      ],
      decisions: [
        { timestamp: '06:20:00', action: 'task_started', actor: 'system', notes: 'Workflow orchestration initiated.' },
        { timestamp: '06:25:00', action: 'step_completed', actor: 'agent', notes: 'Document validated. Routing to approval.' },
        { timestamp: '06:28:44', action: 'task_failed', actor: 'agent', notes: 'No approver found for West Region workspace. Exception: approver_not_assigned.' },
      ],
    },
  ]
}

const COLUMNS: { key: AgentStatus; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }[] = [
  { key: 'running', label: 'Running', icon: Bot, color: 'var(--color-lg-accent)' },
  { key: 'awaiting_checkpoint', label: 'Awaiting Checkpoint', icon: Clock, color: 'var(--color-lg-warning)' },
  { key: 'completed', label: 'Completed Today', icon: CheckCircle2, color: 'var(--color-lg-success)' },
  { key: 'failed', label: 'Failed', icon: AlertTriangle, color: 'var(--color-lg-error)' },
]

const AGENT_TYPE_LABELS: Record<string, string> = {
  document_intake: 'Intake',
  ocr: 'OCR',
  extraction: 'Extraction',
  workflow_orchestration: 'Orchestration',
  reassessment: 'Reassessment',
  compliance: 'Compliance',
  notification: 'Notification',
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onIntervene,
  onResume,
  onRetry,
}: {
  task: AgentTaskCard
  onIntervene: (id: string) => void
  onResume: (id: string) => void
  onRetry: (id: string) => void
}) {
  const [, navigate] = useLocation()
  const [showExceptions, setShowExceptions] = useState(false)
  const [showDecisions, setShowDecisions] = useState(false)

  const isPaused = task.status === 'paused_by_human'

  const borderColorMap: Record<AgentStatus, string> = {
    running: 'var(--color-lg-accent)',
    awaiting_checkpoint: 'var(--color-lg-warning)',
    completed: 'var(--color-lg-success)',
    failed: 'var(--color-lg-error)',
    paused_by_human: 'orange',
  }

  return (
    <div
      className="overflow-hidden rounded-lg border text-[12px]"
      style={{ borderColor: borderColorMap[task.status], background: 'var(--color-lg-card-bg)' }}
    >
      <div className="px-3 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">
                {AGENT_TYPE_LABELS[task.agent_type] ?? task.agent_type}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground truncate">{task.workflow_id}</span>
            </div>
            <p className="font-semibold text-foreground text-[13px] leading-tight">{task.contract_label}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{task.contract_id}</p>
          </div>
          <div className="shrink-0">
            {(task.status === 'running' || isPaused) && (
              <InterventionButton
                status={isPaused ? 'paused_by_human' : task.status}
                size="sm"
                onIntervene={() => onIntervene(task.id)}
                onResume={() => onResume(task.id)}
              />
            )}
          </div>
        </div>

        {/* Current step */}
        <div className="flex items-center gap-2 mt-1">
          {task.status === 'running' && !isPaused && (
            <div className="h-2 w-2 shrink-0 rounded-full animate-pulse" style={{ background: 'var(--color-lg-accent)' }} />
          )}
          {task.status === 'awaiting_checkpoint' && (
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--color-lg-warning)' }} />
          )}
          {task.status === 'completed' && (
            <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
          )}
          {task.status === 'failed' && (
            <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-error)' }} />
          )}
          {isPaused && (
            <Pause className="h-3 w-3 shrink-0" style={{ color: 'orange' }} />
          )}
          <span className="text-muted-foreground text-[11px] leading-tight">{task.current_step}</span>
        </div>

        {/* Timing */}
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span>Started {task.started_at}</span>
          <span>·</span>
          <span>{task.duration}</span>
        </div>

        {/* Exceptions */}
        {task.exceptions && task.exceptions.length > 0 && (
          <div className="mt-2">
            <button
              className="flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--color-lg-error)' }}
              onClick={() => setShowExceptions(e => !e)}
            >
              {showExceptions ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span className="badge-error px-1.5 py-0.5 rounded text-[10px]">{task.exceptions.length}</span>
              {showExceptions ? 'Hide Exceptions' : 'View Exceptions'}
            </button>
            {showExceptions && (
              <div className="mt-2">
                <AgentExceptionPanel exceptions={task.exceptions} />
              </div>
            )}
          </div>
        )}

        {/* Decisions toggle */}
        {task.decisions.length > 0 && (
          <div className="mt-2">
            <button
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDecisions(d => !d)}
            >
              <Activity className="h-3 w-3" />
              {showDecisions ? 'Hide' : 'Show'} decision log ({task.decisions.length})
            </button>
            {showDecisions && (
              <div className="mt-2 space-y-1 border-l-2 border-border pl-3">
                {task.decisions.map((d, i) => (
                  <div key={i} className="text-[10px]">
                    <span className="font-mono text-muted-foreground">{d.timestamp}</span>
                    <span className="mx-1.5 text-muted-foreground">·</span>
                    <span className={cn(
                      'font-semibold',
                      d.actor === 'human' ? 'text-foreground' :
                      d.actor === 'agent' ? '' : 'text-muted-foreground'
                    )}
                      style={d.actor === 'agent' ? { color: 'var(--color-lg-primary)' } : {}}
                    >
                      {d.action.replace(/_/g, ' ')}
                    </span>
                    <span className="ml-1.5 text-muted-foreground">{d.notes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Awaiting checkpoint CTA */}
        {task.status === 'awaiting_checkpoint' && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-6 text-[10px] w-full gap-1"
            style={{ borderColor: 'var(--color-lg-warning)', color: 'var(--color-lg-warning)' }}
            onClick={() => navigate('/approvals/checkpoints')}
          >
            <Clock className="h-3 w-3" />
            View in Checkpoint Queue
          </Button>
        )}

        {/* Retry on failed */}
        {task.status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-6 text-[10px] w-full gap-1"
            style={{ borderColor: 'var(--color-lg-error)', color: 'var(--color-lg-error)' }}
            onClick={() => onRetry(task.id)}
          >
            <RotateCcw className="h-3 w-3" />
            Retry Task
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Activity feed ────────────────────────────────────────────────────────────
function ActivityFeed({ tasks }: { tasks: AgentTaskCard[] }) {
  // Synthesize feed from all decisions across all tasks, sorted by timestamp desc
  const feed = tasks
    .flatMap(t =>
      t.decisions.map(d => ({
        ...d,
        contract_label: t.contract_label,
        contract_id: t.contract_id,
        task_status: t.status,
        agent_type: t.agent_type,
      }))
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20) // cap at 20 most recent

  const actorColor = (actor: string) => {
    if (actor === 'human') return 'var(--color-lg-warning)'
    if (actor === 'agent') return 'var(--color-lg-primary)'
    return 'var(--color-lg-muted-foreground)'
  }

  const actionIcon = (action: string) => {
    if (action.includes('failed')) return <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-error)' }} />
    if (action.includes('completed')) return <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
    if (action.includes('checkpoint')) return <Clock className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-warning)' }} />
    if (action.includes('started')) return <Zap className="h-3 w-3 shrink-0" style={{ color: 'var(--color-lg-primary)' }} />
    return <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
  }

  return (
    <div className="border-t border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          Activity Feed
        </h3>
        <span className="text-[10px] text-muted-foreground">(last 20 events, all tasks)</span>
      </div>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {feed.length === 0 ? (
          <p className="text-[12px] text-muted-foreground italic">No activity yet.</p>
        ) : (
          feed.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              {actionIcon(item.action)}
              <span className="font-mono text-muted-foreground shrink-0">{item.timestamp}</span>
              <span className="font-semibold shrink-0" style={{ color: actorColor(item.actor) }}>
                [{item.actor}]
              </span>
              <span className="text-foreground font-medium shrink-0">{item.action.replace(/_/g, ' ')}</span>
              <span className="text-muted-foreground truncate">{item.contract_label} — {item.notes}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AgentActivityMonitor() {
  const { activeRole } = useRole()
  const allowedRoles = ['lease_admin', 'controller', 'preparer', 'reviewer', 'approver']
  if (!allowedRoles.includes(activeRole)) return <NotFound />

  const [tasks, setTasks] = useState<AgentTaskCard[]>(getMockTasks())
  const [agentTypeFilter, setAgentTypeFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pulseBadges, setPulseBadges] = useState(false)
  const prevCountsRef = useRef<Record<string, number>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 15-second auto-refresh with cleanup on unmount ────────────────────────
  const doRefresh = useCallback(() => {
    setIsRefreshing(true)
    // TODO: Backend integration required — GET /agents/tasks
    // Replace with: const data = await listAgentTasks({ tenant_id: currentTenant })
    setTimeout(() => {
      const newTasks = getMockTasks()
      setTasks(newTasks)
      setLastRefresh(new Date())
      setIsRefreshing(false)

      // Pulse badges if counts changed
      const newCounts: Record<string, number> = {}
      COLUMNS.forEach(col => {
        newCounts[col.key] = newTasks.filter(t => t.status === col.key).length
      })
      const changed = COLUMNS.some(col => newCounts[col.key] !== (prevCountsRef.current[col.key] ?? -1))
      if (changed) {
        setPulseBadges(true)
        setTimeout(() => setPulseBadges(false), 1200)
      }
      prevCountsRef.current = newCounts
    }, 300)
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(doRefresh, 15_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [doRefresh])

  // ── Task actions ──────────────────────────────────────────────────────────
  function handleIntervene(id: string) {
    // TODO: Backend integration required — POST /agents/tasks/{id}/intervene
    // Sets AgentTask.status → paused_by_human
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'paused_by_human' as AgentStatus } : t))
    toast.success('Agent paused', { description: 'AgentTask.status → paused_by_human' })
  }

  function handleResume(id: string) {
    // TODO: Backend integration required — POST /agents/tasks/{id}/resume
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'running' as AgentStatus } : t))
    toast.success('Agent resumed')
  }

  function handleRetry(id: string) {
    // TODO: Backend integration required — POST /agents/tasks/{id}/retry
    // Creates a new AgentTask for the same subject (contract_record_id, agent_type)
    const task = tasks.find(t => t.id === id)
    toast.success('Retry initiated', {
      description: `New AgentTask created for ${task?.contract_label ?? id}`,
    })
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = agentTypeFilter === 'all'
    ? tasks
    : tasks.filter(t => t.agent_type === agentTypeFilter)

  const byStatus = (s: AgentStatus) => filtered.filter(t => t.status === s)

  const totalRunning = tasks.filter(t => t.status === 'running').length
  const totalFailed = tasks.filter(t => t.status === 'failed').length

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-lg-page-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[12px] text-muted-foreground">Agents</span>
            <span className="text-[12px] text-muted-foreground">›</span>
            <span className="text-[12px] text-muted-foreground">Activity Monitor</span>
          </div>
          <h1 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Agent Activity Monitor
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Real-time view of all agent tasks for this tenant
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalFailed > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold badge-error">
              <AlertTriangle className="h-3.5 w-3.5" />
              {totalFailed} failed
            </span>
          )}
          {totalRunning > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold badge-processing">
              <Bot className="h-3.5 w-3.5" />
              {totalRunning} running
            </span>
          )}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              className="h-8 rounded-lg border border-border bg-background text-[12px] px-3 pr-8"
              value={agentTypeFilter}
              onChange={e => setAgentTypeFilter(e.target.value)}
            >
              <option value="all">All Agent Types</option>
              {Object.entries(AGENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button
            onClick={doRefresh}
            disabled={isRefreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Four-column kanban */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-4 gap-5">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.key)
            const ColIcon = col.icon
            const count = colTasks.length

            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2">
                  <ColIcon className="h-4 w-4 shrink-0" style={{ color: col.color }} />
                  <span className="text-[13px] font-semibold text-foreground">{col.label}</span>
                  <span
                    className={cn(
                      'ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold transition-all',
                      pulseBadges && count > 0 ? 'scale-110' : 'scale-100'
                    )}
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {count}
                  </span>
                </div>

                {/* Cards */}
                {colTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                    <p className="text-[11px] text-muted-foreground">No tasks</p>
                  </div>
                ) : (
                  colTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onIntervene={handleIntervene}
                      onResume={handleResume}
                      onRetry={handleRetry}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>

        {/* Auto-refresh notice */}
        <p className="mt-4 text-[11px] text-muted-foreground text-right">
          Auto-refreshes every 15s · Last updated {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      {/* Activity feed */}
      <ActivityFeed tasks={tasks} />
    </div>
  )
}
