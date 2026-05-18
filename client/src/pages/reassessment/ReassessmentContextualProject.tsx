/**
 * ReassessmentContextualProject — FC-6 Screen 6.14 (Phase 2)
 * Screen key: reassessment-contextual-project
 * Route: /reassessment/projects/:id
 *
 * Contextual Project workspace. Four task groups driven by
 * ContextualProjectTask.task_type enum values:
 *   document_upload_request · operational_fact_confirmation ·
 *   accounting_review_assignment · downstream_evidence_submission
 *
 * Task status toggle: ContextualProjectTask.status
 *   open → in_progress → completed (sequential)
 *
 * "Promote to Reassessment Case" creates ReassessmentCase and sets
 *   ContextualProject.resulting_case_id
 *   ContextualProject.status → 'completed'
 *
 * "Close Project" sets ContextualProject.status → 'closed'
 *
 * missing_lease_alert banner: always rendered, self-hiding when false.
 *
 * evidence_chain_summary: read-only prose — no edit capability.
 *
 * Data model refs:
 *   ContextualProject (project_reference, status, missing_lease_alert,
 *     missing_lease_description, evidence_chain_summary, resulting_case_id)
 *   ContextualProjectTask (task_type, description, assigned_to_user_id,
 *     due_date, status, completion_notes)
 *
 * Design: Structured Authority — task type accordion groups, amber missing-lease
 *   banner, promote-to-case inline dialog (FC-4/FC-5 pattern)
 */
import { useState } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  Upload, ClipboardCheck, Calculator, Share2,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Circle, Clock, X, FileText, User, Calendar,
  ArrowRight, Lock, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { SCREEN_KEYS } from '@/constants/screenKeys'
import { toast } from 'sonner'
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskType =
  | 'document_upload_request'
  | 'operational_fact_confirmation'
  | 'accounting_review_assignment'
  | 'downstream_evidence_submission'

type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
type ProjectStatus = 'active' | 'clarification' | 'completed' | 'closed'

interface CPTask {
  id: string
  task_type: TaskType
  description: string
  assigned_to_user_id: string | null
  assigned_to_name: string | null
  due_date: string | null
  status: TaskStatus
  completion_notes: string
}

interface ContextualProject {
  id: string
  project_reference: string
  originating_prompt_type: string
  primary_contract_record_id: string | null
  primary_contract_title: string | null
  status: ProjectStatus
  missing_lease_alert: boolean
  missing_lease_description: string | null
  resulting_case_id: string | null
  evidence_chain_summary: string | null
  created_at: string
  tasks: CPTask[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: Backend integration required — GET /reassessments/contextual-projects/{id}
const MOCK_PROJECT: ContextualProject = {
  id: 'cp-001',
  project_reference: 'CP-2026-0004',
  originating_prompt_type: 'project_ghost',
  primary_contract_record_id: 'r2',
  primary_contract_title: 'Retail HQ — 200 Park Ave',
  status: 'active',
  missing_lease_alert: true,
  missing_lease_description: 'Sublease arrangement for floors 3–5 identified via Project Ghost signal. No lease document found in system. Estimated commencement: Q1 2025.',
  resulting_case_id: null,
  evidence_chain_summary: `Investigation initiated May 14, 2026 via Project Ghost signal from the Facilities team.

Operational intelligence indicates that floors 3–5 of 200 Park Ave have been subleased to a third party (Nexus Analytics LLC) since approximately January 2025. No sublease agreement has been uploaded to the system, and no modification to the master lease has been recorded.

The Facilities team confirmed that Nexus Analytics has been paying occupancy costs directly to the building management. The Legal team has been engaged to locate the sublease agreement. Accounting has been notified of a potential undisclosed lease obligation.

This project will be promoted to a Reassessment Case once all four task groups are completed and the sublease document is confirmed.`,
  created_at: '2026-05-14T10:30:00Z',
  tasks: [
    {
      id: 't1', task_type: 'document_upload_request',
      description: 'Locate and upload the sublease agreement for floors 3–5 (Nexus Analytics LLC). Contact Legal (A. Chen) if document is not in the shared drive.',
      assigned_to_user_id: 'u3', assigned_to_name: 'J. Martinez',
      due_date: '2026-05-20', status: 'in_progress', completion_notes: '',
    },
    {
      id: 't2', task_type: 'document_upload_request',
      description: 'Upload any correspondence between the landlord and tenant regarding the sublease arrangement.',
      assigned_to_user_id: 'u3', assigned_to_name: 'J. Martinez',
      due_date: '2026-05-20', status: 'open', completion_notes: '',
    },
    {
      id: 't3', task_type: 'operational_fact_confirmation',
      description: 'Confirm with Facilities the exact commencement date of Nexus Analytics occupancy and the agreed monthly sublease rent.',
      assigned_to_user_id: 'u4', assigned_to_name: 'S. Patel',
      due_date: '2026-05-18', status: 'completed', completion_notes: 'Confirmed: commencement Jan 15, 2025. Monthly sublease rent: $18,500.',
    },
    {
      id: 't4', task_type: 'operational_fact_confirmation',
      description: 'Confirm whether the master lease permits subleasing and whether landlord consent was obtained.',
      assigned_to_user_id: 'u4', assigned_to_name: 'S. Patel',
      due_date: '2026-05-18', status: 'open', completion_notes: '',
    },
    {
      id: 't5', task_type: 'accounting_review_assignment',
      description: 'Review whether the sublease arrangement creates a new ASC 842 right-of-use asset or modifies the existing operating lease classification.',
      assigned_to_user_id: 'u5', assigned_to_name: 'R. Thompson',
      due_date: '2026-05-22', status: 'open', completion_notes: '',
    },
    {
      id: 't6', task_type: 'accounting_review_assignment',
      description: 'Calculate the impact on the existing lease liability balance if the sublease is classified as a finance lease modification.',
      assigned_to_user_id: 'u5', assigned_to_name: 'R. Thompson',
      due_date: '2026-05-25', status: 'open', completion_notes: '',
    },
    {
      id: 't7', task_type: 'downstream_evidence_submission',
      description: 'Submit all collected evidence (sublease agreement, correspondence, operational confirmation, accounting review) to the Reassessment queue for case creation.',
      assigned_to_user_id: null, assigned_to_name: null,
      due_date: '2026-05-28', status: 'open', completion_notes: '',
    },
  ],
}

// ─── Task type config ─────────────────────────────────────────────────────────
const TASK_TYPE_CONFIG: Record<TaskType, {
  label: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  color: string
  description: string
}> = {
  document_upload_request: {
    label: 'Document Upload Requests',
    icon: Upload,
    color: 'var(--color-lg-primary)',
    description: 'Collect and upload source documents required for evidence chain',
  },
  operational_fact_confirmation: {
    label: 'Operational Fact Confirmations',
    icon: ClipboardCheck,
    color: 'var(--color-lg-warning)',
    description: 'Verify operational details with relevant stakeholders',
  },
  accounting_review_assignment: {
    label: 'Accounting Review Assignments',
    icon: Calculator,
    color: 'var(--color-lg-success)',
    description: 'Accounting team assessments and financial impact reviews',
  },
  downstream_evidence_submission: {
    label: 'Downstream Evidence Submissions',
    icon: Share2,
    color: 'var(--color-lg-error)',
    description: 'Final evidence packaging and submission to reassessment queue',
  },
}

const TASK_TYPE_ORDER: TaskType[] = [
  'document_upload_request',
  'operational_fact_confirmation',
  'accounting_review_assignment',
  'downstream_evidence_submission',
]

// ─── Task status badge ────────────────────────────────────────────────────────
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    open: { label: 'Open', cls: 'badge-warning' },
    in_progress: { label: 'In Progress', cls: 'badge-processing' },
    completed: { label: 'Completed', cls: 'badge-approved' },
    cancelled: { label: 'Cancelled', cls: 'badge-error' },
  }
  const m = map[status]
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onStatusChange,
}: {
  task: CPTask
  onStatusChange: (id: string, status: TaskStatus, notes: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(task.completion_notes)

  const nextStatus: TaskStatus | null =
    task.status === 'open' ? 'in_progress' :
    task.status === 'in_progress' ? 'completed' :
    null

  function handleAdvance() {
    if (!nextStatus) return
    onStatusChange(task.id, nextStatus, notes)
  }

  return (
    <div className={cn(
      'rounded-lg border border-border bg-card transition-all',
      task.status === 'completed' ? 'opacity-70' : ''
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {task.status === 'completed' && <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-lg-success)' }} />}
          {task.status === 'in_progress' && <Clock className="h-4 w-4" style={{ color: 'var(--color-lg-primary)' }} />}
          {task.status === 'open' && <Circle className="h-4 w-4 text-muted-foreground" />}
          {task.status === 'cancelled' && <X className="h-4 w-4 text-muted-foreground" />}
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-[13px] text-foreground', task.status === 'completed' ? 'line-through text-muted-foreground' : '')}>
            {task.description}
          </p>
          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            <TaskStatusBadge status={task.status} />
            {task.assigned_to_name && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assigned_to_name}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due {task.due_date}
              </span>
            )}
          </div>
          {task.status === 'completed' && task.completion_notes && (
            <p className="mt-1.5 text-[12px] text-muted-foreground italic">"{task.completion_notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expand for status advance */}
      {expanded && nextStatus && (
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          {nextStatus === 'completed' && (
            <div className="mb-3">
              <label className="text-[12px] font-medium text-foreground mb-1 block">
                Completion Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe what was completed or any relevant findings..."
                className="min-h-[56px] text-[12px] resize-none"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-[12px] gap-1"
              onClick={handleAdvance}
              style={nextStatus === 'completed'
                ? { background: 'var(--color-lg-success)', color: '#fff' }
                : { background: 'var(--color-lg-primary)', color: '#fff' }}
            >
              {nextStatus === 'in_progress' ? (
                <><Clock className="h-3 w-3" /> Mark In Progress</>
              ) : (
                <><CheckCircle2 className="h-3 w-3" /> Mark Completed</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Promote to Case dialog ───────────────────────────────────────────────────
function PromoteToCaseDialog({
  project,
  onConfirm,
  onClose,
}: {
  project: ContextualProject
  onConfirm: () => void
  onClose: () => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')

  const canConfirm = confirmed && reason.trim().length >= 10

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-card rounded-xl shadow-2xl w-[540px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[14px] font-bold text-foreground">{project.project_reference}</p>
            <p className="text-[12px] text-muted-foreground">Promote to Reassessment Case</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Info */}
          <div className="flex items-start gap-3 rounded-lg border-l-2 px-4 py-3 text-[13px]"
            style={{ borderColor: 'var(--color-lg-primary)', background: 'var(--color-lg-accent-subtle)' }}>
            <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-lg-primary)' }} />
            <div>
              <p className="font-semibold text-foreground">This action creates a ReassessmentCase</p>
              <p className="text-muted-foreground mt-0.5">
                Sets <code className="text-[11px] bg-muted px-1 rounded">ContextualProject.resulting_case_id</code> and
                transitions project status to <code className="text-[11px] bg-muted px-1 rounded">completed</code>.
              </p>
            </div>
          </div>

          {/* Case creation reason */}
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-foreground">
              Case Creation Rationale <span style={{ color: 'var(--color-lg-error)' }}>*</span>
            </label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Summarize the evidence gathered and why a formal reassessment case is warranted (min 10 chars)..."
              className="min-h-[80px] text-[13px] resize-none"
            />
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={confirmed}
              onCheckedChange={v => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <span className="text-[13px] text-foreground">
              I confirm that sufficient evidence has been gathered and this Contextual Project is ready to be promoted to a formal Reassessment Case.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="gap-1.5"
            style={canConfirm ? { background: 'var(--color-lg-primary)', color: '#fff' } : {}}
          >
            <FileText className="h-3.5 w-3.5" />
            Create Reassessment Case
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReassessmentContextualProject() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_CONTEXTUAL_PROJECT
  const [, navigate] = useLocation()
  const params = useParams<{ id: string }>()

  const [project, setProject] = useState<ContextualProject>(MOCK_PROJECT)
  const [expandedGroups, setExpandedGroups] = useState<TaskType[]>([...TASK_TYPE_ORDER])
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [evidenceExpanded, setEvidenceExpanded] = useState(false)

  const allTasksCompleted = project.tasks.every(t => t.status === 'completed' || t.status === 'cancelled')
  const completedCount = project.tasks.filter(t => t.status === 'completed').length
  const totalCount = project.tasks.filter(t => t.status !== 'cancelled').length

  function toggleGroup(type: TaskType) {
    setExpandedGroups(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function handleTaskStatusChange(id: string, status: TaskStatus, notes: string) {
    // TODO: Backend integration required — PATCH /reassessments/contextual-projects/tasks/{id}
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, status, completion_notes: notes } : t
      ),
    }))
    toast.success(`Task ${status === 'in_progress' ? 'started' : 'completed'}`)
  }

  function handlePromoteToCase() {
    // TODO: Backend integration required
    // POST /reassessments/cases { contextual_project_id: project.id }
    // PATCH /reassessments/contextual-projects/{id} { status: 'completed', resulting_case_id: newCase.id }
    setProject(prev => ({ ...prev, status: 'completed', resulting_case_id: 'rc-new-001' }))
    setShowPromoteDialog(false)
    toast.success('Reassessment Case created', {
      description: `ContextualProject.status → completed. resulting_case_id set.`,
    })
  }

  function handleCloseProject() {
    // TODO: Backend integration required — PATCH /reassessments/contextual-projects/{id} { status: 'closed' }
    setProject(prev => ({ ...prev, status: 'closed' }))
    toast.success('Project closed')
  }

  const statusBadgeMap: Record<ProjectStatus, string> = {
    active: 'badge-processing',
    clarification: 'badge-warning',
    completed: 'badge-approved',
    closed: 'badge-error',
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-lg-page-bg)]">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <button
              onClick={() => navigate('/reassessment/cases')}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Reassessment
            </button>
            <span className="text-[12px] text-muted-foreground">›</span>
            <span className="text-[12px] text-muted-foreground">Contextual Projects</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold text-foreground font-mono">{project.project_reference}</h1>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusBadgeMap[project.status]}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            {project.resulting_case_id && (
              <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                Case: {project.resulting_case_id}
              </span>
            )}
          </div>
          {project.primary_contract_title && (
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Primary lease: {project.primary_contract_title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {project.status === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseProject}
                className="text-[12px]"
              >
                Close Project
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-[12px]"
                onClick={() => setShowPromoteDialog(true)}
                style={{ background: 'var(--color-lg-primary)', color: '#fff' }}
              >
                <FileText className="h-3.5 w-3.5" />
                Promote to Case
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Missing lease alert — always rendered, self-hiding when false */}
      {project.missing_lease_alert && (
        <div className="flex items-start gap-3 border-b border-border px-6 py-3"
          style={{ background: 'var(--color-lg-error-subtle)' }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-lg-error)' }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-lg-error)' }}>
              Missing Lease Alert
            </p>
            <p className="text-[12px] text-foreground mt-0.5">{project.missing_lease_description}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 flex gap-6">
        {/* Left: Tasks */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground">{completedCount}/{totalCount} tasks completed</span>
            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%`, background: 'var(--color-lg-success)' }}
              />
            </div>
            {allTasksCompleted && (
              <span className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-lg-success)' }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                All tasks complete
              </span>
            )}
          </div>

          {/* Task accordion groups */}
          {TASK_TYPE_ORDER.map(taskType => {
            const config = TASK_TYPE_CONFIG[taskType]
            const Icon = config.icon
            const typeTasks = project.tasks.filter(t => t.task_type === taskType)
            const completedInGroup = typeTasks.filter(t => t.status === 'completed').length
            const isExpanded = expandedGroups.includes(taskType)

            return (
              <div key={taskType} className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(taskType)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${config.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[13px] font-semibold text-foreground">{config.label}</p>
                    <p className="text-[11px] text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-muted-foreground">{completedInGroup}/{typeTasks.length}</span>
                    {completedInGroup === typeTasks.length && typeTasks.length > 0 && (
                      <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--color-lg-success)' }} />
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Tasks */}
                {isExpanded && (
                  <div className="px-4 py-3 flex flex-col gap-2">
                    {typeTasks.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground italic py-2">No tasks in this group.</p>
                    ) : (
                      typeTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleTaskStatusChange}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Evidence chain summary */}
        <div className="w-[320px] shrink-0 flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold text-foreground">Evidence Chain Summary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Read-only</span>
                {evidenceExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </button>
            {evidenceExpanded && (
              <div className="px-4 py-3">
                {project.evidence_chain_summary ? (
                  <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {project.evidence_chain_summary}
                  </p>
                ) : (
                  <p className="text-[12px] text-muted-foreground italic">No evidence chain summary yet.</p>
                )}
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Editing via task completion only</span>
                </div>
              </div>
            )}
          </div>

          {/* Project metadata */}
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Project Details</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold text-foreground">{project.project_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Originating Signal</span>
                <span className="text-foreground capitalize">{project.originating_prompt_type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusBadgeMap[project.status]}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              {project.resulting_case_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resulting Case</span>
                  <span className="font-mono text-foreground">{project.resulting_case_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promote to Case dialog */}
      {showPromoteDialog && (
        <PromoteToCaseDialog
          project={project}
          onConfirm={handlePromoteToCase}
          onClose={() => setShowPromoteDialog(false)}
        />
      )}
    </div>
  )
}
