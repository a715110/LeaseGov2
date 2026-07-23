/**
 * ApprovalsQueue — FC-4 Screen 4.1
 * Screen key: approvals-queue
 * Route: /approvals/queue
 * Role: Reviewer / Approver / Preparer (My Submissions)
 *
 * Design: Structured Authority
 * Prompt 4.1: Tabbed queue. Type badge (Record accent / Reassessment purple).
 *   Age color coding: success <2d / warning <5d / error >5d.
 *   My Submissions tab: Recall action with available/unavailable states.
 *   Reassign: Reviewer can redirect a pending/resubmitted task to another Reviewer/Approver.
 *
 * Data model refs: ApprovalTask (task_reference, subject_type, status,
 *   approval_stage, priority, submitted_at, opened_at, recall_available,
 *   sla_deadline_at, rejection_reason_codes)
 */

import { useState, useCallback, useEffect } from "react";
import { subscribeToEvents, getLatestEvent, getEventHistory, publishEvent, PENDING_REVIEW_EVENTS_KEY } from "@/lib/eventBus";
import { useRole } from "@/contexts/RoleContext";
import type { DemoEvent } from "@/lib/types";
import { useLocation } from "wouter";
import {
  Clock, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, AlertCircle, Filter, UserCog, ExternalLink, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { MOCK_REVIEWERS } from "@/lib/mockData";
import { useNotifications } from "@/contexts/NotificationContext";
import { usePipelineCounts } from "@/contexts/PipelineCountsContext";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { PackageDetailDialog } from '@/components/packages/PackageDetailDialog';

type SubjectType = "contract_record" | "reassessment_case";
type ApprovalStage = "review" | "final_approval";
type TaskStatus = "pending" | "opened" | "approved" | "rejected" | "rework_in_progress" | "resubmitted";
type Priority = "standard" | "high" | "escalated";

interface ApprovalTask {
  id: string;
  task_reference: string;
  subject_type: SubjectType;
  subject_label: string;
  approval_stage: ApprovalStage;
  status: TaskStatus;
  submitted_by: string;
  submitted_at: string;
  opened_at: string | null;
  recall_available: boolean;
  priority: Priority;
  sla_deadline_at: string | null;
  rework_iteration: number;
  /** Assigned reviewer/approver id — maps to MOCK_REVIEWERS */
  reviewer_id?: string;
  /** For reassessment_case tasks: the case ID to pass as ?caseId= query param */
  case_id?: string;
  /** Optional status hint used to resolve the correct destination URL for special case types (remediation, project_review) */
  case_status?: string;
  /** For contract_record tasks: the linked package ID — enables "View Package" navigation */
  package_id?: string;
}

// TODO: Backend integration required — GET /api/approvals/tasks
const INITIAL_TASKS: ApprovalTask[] = [
  { id:"t1",  task_reference:"AT-2026-0041", subject_type:"contract_record",   subject_label:"Office Tower — 350 Fifth Ave",         approval_stage:"review",          status:"pending",           submitted_by:"J. Martinez", submitted_at:"2026-05-16T08:00:00Z", opened_at:null,                      recall_available:true,  priority:"high",      sla_deadline_at:"2026-05-18T17:00:00Z", rework_iteration:0, reviewer_id:"user-rev-001", package_id:"PKG-2026-0041" },
  { id:"t2",  task_reference:"AT-2026-0040", subject_type:"contract_record",   subject_label:"Retail HQ — 1200 Market St",            approval_stage:"review",          status:"opened",            submitted_by:"S. Patel",    submitted_at:"2026-05-15T14:20:00Z", opened_at:"2026-05-15T15:00:00Z",    recall_available:false, priority:"standard",  sla_deadline_at:"2026-05-20T17:00:00Z", rework_iteration:0, reviewer_id:"user-rev-002", package_id:"PKG-2026-0042" },
  { id:"t3",  task_reference:"AT-2026-0039", subject_type:"reassessment_case", subject_label:"Warehouse Lease — Scope Increase",      approval_stage:"final_approval",  status:"pending",           submitted_by:"A. Chen",     submitted_at:"2026-05-14T09:30:00Z", opened_at:null,                      recall_available:true,  priority:"escalated", sla_deadline_at:"2026-05-17T17:00:00Z", rework_iteration:0, reviewer_id:"user-apr-001", case_id:"c3" },
  { id:"t4",  task_reference:"AT-2026-0038", subject_type:"contract_record",   subject_label:"Ground Lease — Civic Center",           approval_stage:"review",          status:"rework_in_progress",submitted_by:"J. Martinez", submitted_at:"2026-05-12T11:00:00Z", opened_at:"2026-05-12T11:30:00Z",    recall_available:false, priority:"high",      sla_deadline_at:"2026-05-16T17:00:00Z", rework_iteration:1, reviewer_id:"user-rev-003", package_id:"PKG-2026-0043" },
  { id:"t5",  task_reference:"AT-2026-0037", subject_type:"contract_record",   subject_label:"Industrial Park — Unit 7",              approval_stage:"final_approval",  status:"pending",           submitted_by:"S. Patel",    submitted_at:"2026-05-16T07:00:00Z", opened_at:null,                      recall_available:true,  priority:"standard",  sla_deadline_at:"2026-05-21T17:00:00Z", rework_iteration:0, reviewer_id:"user-apr-002", package_id:"PKG-2026-0044" },
  { id:"t6",  task_reference:"AT-2026-0036", subject_type:"reassessment_case", subject_label:"Tech Campus — Rent Modification",       approval_stage:"review",          status:"pending",           submitted_by:"A. Chen",     submitted_at:"2026-05-15T16:00:00Z", opened_at:null,                      recall_available:true,  priority:"standard",  sla_deadline_at:"2026-05-22T17:00:00Z", rework_iteration:0, reviewer_id:"user-rev-004", case_id:"c6" },
  { id:"t7",  task_reference:"AT-2026-0035", subject_type:"contract_record",   subject_label:"Suburban Office — Suite 400",           approval_stage:"review",          status:"resubmitted",       submitted_by:"J. Martinez", submitted_at:"2026-05-16T06:00:00Z", opened_at:null,                      recall_available:true,  priority:"high",      sla_deadline_at:"2026-05-19T17:00:00Z", rework_iteration:2, reviewer_id:"user-rev-001", package_id:"PKG-2026-0045" },
  { id:"t8",  task_reference:"AT-2026-0034", subject_type:"contract_record",   subject_label:"Downtown Retail — Corner Unit",         approval_stage:"final_approval",  status:"approved",          submitted_by:"S. Patel",    submitted_at:"2026-05-10T09:00:00Z", opened_at:"2026-05-10T10:00:00Z",    recall_available:false, priority:"standard",  sla_deadline_at:null,                   rework_iteration:0, reviewer_id:"user-apr-003", package_id:"PKG-2026-0046" },
  // Remediation case — routes to /reassessment/cases/:id/remediation
  { id:"t9",  task_reference:"AT-2026-0033", subject_type:"reassessment_case", subject_label:"Parking Garage — Remediation Review",    approval_stage:"review",          status:"pending",           submitted_by:"A. Chen",     submitted_at:"2026-05-13T10:00:00Z", opened_at:null,                      recall_available:true,  priority:"escalated", sla_deadline_at:"2026-05-18T17:00:00Z", rework_iteration:0, reviewer_id:"user-rev-005", case_id:"c6", case_status:"remediation" },
  // Contextual project case — routes to /reassessment/projects/:id
  { id:"t10", task_reference:"AT-2026-0032", subject_type:"reassessment_case", subject_label:"Office Tower — Project Context Review",  approval_stage:"review",          status:"pending",           submitted_by:"J. Martinez", submitted_at:"2026-05-14T14:00:00Z", opened_at:null,                      recall_available:true,  priority:"standard",  sla_deadline_at:"2026-05-21T17:00:00Z", rework_iteration:0, reviewer_id:"user-rev-006", case_id:"c7", case_status:"project_review" },
];

const CURRENT_USER = "Current User";

type TabId = "all" | "my_reviews" | "my_approvals" | "rework" | "my_submissions";

const TAB_DEFS: { id: TabId; label: string; badgeCls?: string }[] = [
  { id:"all",            label:"All Pending" },
  { id:"my_reviews",     label:"My Reviews" },
  { id:"my_approvals",   label:"My Approvals" },
  { id:"rework",         label:"Rework",         badgeCls:"badge-warning" },
  { id:"my_submissions", label:"My Submissions" },
];

function getAgeMs(submitted_at: string) {
  return Date.now() - new Date(submitted_at).getTime();
}

function AgeBadge({ submitted_at }: { submitted_at: string }) {
  const ms = getAgeMs(submitted_at);
  const days = ms / (1000 * 60 * 60 * 24);
  const hours = ms / (1000 * 60 * 60);
  const label = days >= 1 ? `${Math.floor(days)}d` : `${Math.floor(hours)}h`;
  const cls = days < 2 ? "badge-valid" : days < 5 ? "badge-warning" : "badge-invalid";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function SlaBadge({ sla_deadline_at }: { sla_deadline_at: string | null }) {
  if (!sla_deadline_at) return <span className="text-[11px] text-muted-foreground">—</span>;
  const diff = new Date(sla_deadline_at).getTime() - Date.now();
  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-invalid">
        <Clock className="w-3 h-3" /> Overdue
      </span>
    );
  }
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const label = hours >= 24
    ? `${Math.floor(hours / 24)}d ${hours % 24}h`
    : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const urgent = hours < 4;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
      urgent ? 'badge-invalid' : 'badge-warning'
    }`}>
      <Clock className="w-3 h-3" /> {label}
    </span>
  );
}

function StatusBadge({ status, opened_at }: { status: TaskStatus; opened_at: string | null }) {
  const map: Record<TaskStatus, { label: string; cls: string }> = {
    pending:            { label: 'Pending',     cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
    opened:             { label: 'Opened',      cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    approved:           { label: 'Approved',    cls: 'badge-valid' },
    rejected:           { label: 'Rejected',    cls: 'badge-invalid' },
    rework_in_progress: { label: 'Rework',      cls: 'badge-warning' },
    resubmitted:        { label: 'Resubmitted', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold cursor-default ${cls}`}>
          {status === 'opened' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          )}
          {label}
        </span>
      </TooltipTrigger>
      {status === 'opened' && opened_at && (
        <TooltipContent className="text-[12px]">
          Opened at {new Date(opened_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function TypeBadge({ subject_type }: { subject_type: SubjectType }) {
  if (subject_type === "contract_record") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--color-lg-accent-subtle)] text-[var(--color-lg-info)] border border-blue-200">Record</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Reassessment</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    standard:  "bg-gray-100 text-gray-600 border border-gray-200",
    high:      "bg-orange-100 text-orange-700 border border-orange-200",
    escalated: "badge-invalid",
  };
  const labels: Record<Priority, string> = { standard:"Standard", high:"High", escalated:"Escalated" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${map[priority]}`}>{labels[priority]}</span>;
}

function StageBadge({ stage }: { stage: ApprovalStage }) {
  if (stage === "review") return <span className="text-[11px] text-muted-foreground">Review</span>;
  return <span className="text-[11px] font-semibold" style={{ color:"var(--color-lg-primary)" }}>Final Approval</span>;
}

/** Avatar badge for a reviewer */
function ReviewerAvatar({ reviewerId }: { reviewerId?: string }) {
  const reviewer = reviewerId ? MOCK_REVIEWERS.find(r => r.id === reviewerId) : null;
  if (!reviewer) return <span className="text-[12px] text-muted-foreground">—</span>;
  const initials = reviewer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-white cursor-default shrink-0"
          style={{ background: reviewer.avatarColor }}
        >
          {initials}
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-[12px] space-y-0.5 p-2.5">
        <p className="font-semibold">{reviewer.name}</p>
        <p className="text-muted-foreground">{reviewer.email}</p>
        <p className="text-muted-foreground capitalize">{reviewer.role}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function filterByTab(tasks: ApprovalTask[], tab: TabId): ApprovalTask[] {
  switch (tab) {
    case "all":            return tasks.filter(t => !["approved"].includes(t.status));
    case "my_reviews":     return tasks.filter(t => t.approval_stage === "review" && ["pending","opened","resubmitted"].includes(t.status));
    case "my_approvals":   return tasks.filter(t => t.approval_stage === "final_approval" && ["pending","opened"].includes(t.status));
    case "rework":         return tasks.filter(t => t.status === "rework_in_progress");
    case "my_submissions": return tasks.filter(t => t.submitted_by === "J. Martinez");
    default:               return tasks;
  }
}

/** Whether a task can be reassigned (not yet opened, not approved/rejected) */
function canReassign(task: ApprovalTask): boolean {
  return ["pending", "resubmitted"].includes(task.status);
}

export default function ApprovalsQueue() {
  const _screenKey = SCREEN_KEYS.APPROVALS_QUEUE;
  const [, navigate] = useLocation();
  const { activeRole } = useRole();
  const isReviewer = activeRole === 'reviewer';
  const isApprover = activeRole === 'approver';
  const isAuditor  = activeRole === 'auditor';
  const [activeTab, setActiveTab] = useState<TabId>("my_reviews");
  const [packageDialogId, setPackageDialogId] = useState<string | null>(null);
  // Initialise tasks — replay RECORD_APPROVED and REVIEW_OPENED events that fired
  // before this mount so badge state is correct when navigating back to the queue.
  const [tasks, setTasks] = useState<ApprovalTask[]>(() => {
    let base: ApprovalTask[] = [...INITIAL_TASKS];
    // Replay RECORD_APPROVED
    const approvedEvent = getLatestEvent('RECORD_APPROVED');
    if (approvedEvent) {
      const p = approvedEvent.payload as { task_id?: string };
      if (p.task_id) {
        base = base.map(t =>
          t.id === p.task_id ? { ...t, status: 'approved' as TaskStatus } : t
        );
      }
    }
    // FC-4 Gap 2: replay all REVIEW_OPENED events so 'opened' badge persists
    // when the user navigates away from the queue and back.
    const history = getEventHistory();
    for (const event of history) {
      if (event.type !== 'REVIEW_OPENED') continue;
      const p = event.payload as { task_id?: string };
      if (!p.task_id) continue;
      base = base.map(t => {
        if (t.id !== p.task_id) return t;
        if (t.status !== 'pending') return t; // don't downgrade approved/rejected rows
        // FC-4 Fix 3: also clear recall_available during replay so My Submissions
        // Recall button is correctly disabled after page reload.
        return { ...t, status: 'opened' as TaskStatus, opened_at: t.opened_at ?? event.timestamp, recall_available: false };
      });
    }
    return base;
  });
  const [flashedRows, setFlashedRows] = useState<Set<string>>(new Set());

  const triggerFlash = (taskId: string) => {
    setFlashedRows(prev => new Set(prev).add(taskId));
    setTimeout(() => setFlashedRows(prev => { const n = new Set(prev); n.delete(taskId); return n; }), 1100);
  };
  const { addNotification } = useNotifications();
  const { setApprovalsCount } = usePipelineCounts();

  // Compute live tab badges from tasks state
  const TABS = TAB_DEFS.map(tab => ({
    ...tab,
    badge: filterByTab(tasks, tab.id).length,
  }))

  // Publish total actionable count to sidebar nav badge
  useEffect(() => {
    const actionable = tasks.filter(t => ['pending', 'resubmitted', 'opened'].includes(t.status)).length
    setApprovalsCount(actionable)
  }, [tasks, setApprovalsCount])

  // DEMO ONLY: Mount-time drain for SUBMIT_FOR_REVIEW events that fired while
  // ApprovalsQueue was unmounted (reviewer was on a different screen).
  // PRODUCTION: remove — backend persists the review task; queue fetches via GET /api/v1/approvals/queue.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_REVIEW_EVENTS_KEY);
      if (raw) {
        const pending: DemoEvent[] = JSON.parse(raw);
        if (pending.length > 0) {
          pending.forEach(event => {
            window.dispatchEvent(new CustomEvent('leasegov_same_tab_event', { detail: event }));
          });
          sessionStorage.removeItem(PENDING_REVIEW_EVENTS_KEY);
        }
      }
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to REVIEW_OPENED — flip matching 'pending' row to 'opened'
  useEffect(() => {
    return subscribeToEvents((event) => {
      if (event.type === 'REVIEW_OPENED') {
        const p = event.payload as { task_id?: string };
        setTasks(prev => prev.map(t => {
          if (t.status !== 'pending') return t;
          if (p.task_id && t.id === p.task_id) {
            // FC-4 Fix 3: set recall_available=false when a reviewer/approver opens
            // the task, so the Recall button in My Submissions disables correctly.
            return { ...t, status: 'opened' as TaskStatus, opened_at: new Date().toISOString(), recall_available: false };
          }
          return t;
        }));
        if (p.task_id) triggerFlash(p.task_id);
      }
      if (event.type === 'REVIEW_COMPLETED') {
        const p = event.payload as { task_id?: string; outcome?: string };
        if (p.outcome === 'rejected') {
          setTasks(prev => prev.map(t =>
            (p.task_id && t.id === p.task_id) ? { ...t, status: 'rejected' as TaskStatus } : t
          ));
          if (p.task_id) triggerFlash(p.task_id);
        }
      }
      if (event.type === 'RECORD_APPROVED') {
        const p = event.payload as { task_id?: string };
        setTasks(prev => prev.map(t =>
          (p.task_id && t.id === p.task_id) ? { ...t, status: 'approved' as TaskStatus } : t
        ));
        if (p.task_id) triggerFlash(p.task_id);
      }
      // G-01: Preparer submits for review → add a new review-stage task to the queue // DEMO ONLY
      if (event.type === 'SUBMIT_FOR_REVIEW') {
        const p = event.payload as {
          contractRecordId?: string;
          batchRef?: string;
          label?: string;
          fileNames?: string[];
          workspace?: string;
          fileCount?: number;
          submittedBy?: string;
          packageId?: string;
        };
        // Use the explicit label from the payload if provided (set by ExtractionQueue);
        // fall back to the legacy hardcoded record label map for older events.
        const recordId = p.contractRecordId ?? p.batchRef ?? 'r1';
        const RECORD_LABEL_MAP: Record<string, string> = {
          'r1':              'Office Tower Amendment 3',
          'mock-record-001': 'Acme Corp — 123 Main St',
          'mock-record-002': 'Globex LLC — 456 Oak Ave',
          'mock-record-003': 'Initech — 789 Pine Rd',
          'mock-record-004': 'Office Tower — 350 Fifth Ave',
        };
        const label = p.label ?? RECORD_LABEL_MAP[recordId] ?? `Batch ${recordId}`;
        const newTaskId = `live-${Date.now()}`;
        const newTask: ApprovalTask = {
          id: newTaskId,
          task_reference: `AT-${new Date().getFullYear()}-${(p.batchRef ?? recordId).slice(-4).toUpperCase()}`,
          subject_type: 'contract_record',
          subject_label: label,
          approval_stage: 'review',
          status: 'pending',
          submitted_by: p.submittedBy ?? 'Preparer',
          submitted_at: new Date().toISOString(),
          opened_at: null,
          recall_available: true,
          priority: 'high',
          sla_deadline_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          rework_iteration: 0,
          reviewer_id: 'user-rev-001',
          package_id: p.packageId,
        };
        setTasks(prev => [newTask, ...prev]);
        triggerFlash(newTaskId);
        toast.success(`Review task arrived: ${label}`, { duration: 4000 });
      }
      // G-03: Reviewer approves for final → advance matching task to final_approval stage // DEMO ONLY
      if (event.type === 'APPROVE_FOR_FINAL') {
        const p = event.payload as { task_id?: string; label?: string };
        setTasks(prev => prev.map(t => {
          if (p.task_id && t.id === p.task_id) {
            return { ...t, approval_stage: 'final_approval' as ApprovalStage, status: 'pending' as TaskStatus };
          }
          return t;
        }));
        if (p.task_id) triggerFlash(p.task_id);
        toast.success(`Advanced to Final Approval${p.label ? ': ' + p.label : ''}`, { duration: 4000 });
      }
      // DEMO_RESET: clear pending review queue and restore seed tasks
      if (event.type === 'DEMO_RESET') {
        sessionStorage.removeItem(PENDING_REVIEW_EVENTS_KEY);
        setTasks(INITIAL_TASKS);
      }
    });
  }, [])

  // Reassign dialog state
  const [reassignTask, setReassignTask] = useState<ApprovalTask | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const visibleTasks = filterByTab(tasks, activeTab);

  // Bulk-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkReassign, setShowBulkReassign] = useState(false);
  const [bulkReassignTargetId, setBulkReassignTargetId] = useState('');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const reassignable = visibleTasks.filter(canReassign);
    if (selectedIds.size === reassignable.length && reassignable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reassignable.map(t => t.id)));
    }
  }, [visibleTasks, selectedIds]);

  const selectedTasks = visibleTasks.filter(t => selectedIds.has(t.id));
  const bulkStage = selectedTasks.length > 0 ? selectedTasks[0].approval_stage : null;
  const bulkEligibleReviewers = bulkStage
    ? MOCK_REVIEWERS.filter(r => bulkStage === 'review' ? r.role === 'Reviewer' : r.role === 'Approver')
    : MOCK_REVIEWERS;

  function handleBulkReassign() {
    if (!bulkReassignTargetId || selectedTasks.length === 0) return;
    const newReviewer = MOCK_REVIEWERS.find(r => r.id === bulkReassignTargetId);
    setTasks(prev => prev.map(t =>
      selectedIds.has(t.id) ? { ...t, reviewer_id: bulkReassignTargetId } : t
    ));
    addNotification({
      title: `${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} bulk-reassigned`,
      body: `Reassigned to ${newReviewer?.name ?? 'new reviewer'} by Team Lead.`,
      severity: 'info',
      href: '/approvals/queue',
    });
    toast.success(`${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} reassigned to ${newReviewer?.name ?? 'new reviewer'}`, { duration: 4000 });
    setSelectedIds(new Set());
    setBulkReassignTargetId('');
    setShowBulkReassign(false);
  }

  // Reviewers for the same stage as the task being reassigned
  const eligibleReviewers = reassignTask
    ? MOCK_REVIEWERS.filter(r =>
        reassignTask.approval_stage === "review"
          ? r.role === "Reviewer"
          : r.role === "Approver"
      )
    : MOCK_REVIEWERS;

  function handleConfirmReassign() {
    if (!reassignTask || !reassignTargetId) return;
    const prevReviewer = reassignTask.reviewer_id
      ? MOCK_REVIEWERS.find(r => r.id === reassignTask.reviewer_id)
      : null;
    const newReviewer = MOCK_REVIEWERS.find(r => r.id === reassignTargetId);

    setTasks(prev => prev.map(t =>
      t.id === reassignTask.id ? { ...t, reviewer_id: reassignTargetId } : t
    ));

    // Notify original reviewer
    if (prevReviewer) {
      addNotification({
        title: `${reassignTask.task_reference} reassigned`,
        body: `Task reassigned from ${prevReviewer.name} to ${newReviewer?.name ?? 'another reviewer'}.`,
        severity: 'info',
        href: '/approvals/queue',
      });
    }
    // Notify document submitter
    addNotification({
      title: `${reassignTask.task_reference} reviewer changed`,
      body: `Your submission is now assigned to ${newReviewer?.name ?? 'a new reviewer'} for ${reassignTask.approval_stage === 'review' ? 'review' : 'final approval'}.`,
      severity: 'info',
      href: '/approvals/queue',
    });

    toast.success(`${reassignTask.task_reference} reassigned to ${newReviewer?.name ?? 'new reviewer'}`, {
      description: prevReviewer
        ? `Original reviewer ${prevReviewer.name} and document submitter have been notified.`
        : 'Document submitter has been notified.',
      duration: 5000,
    });

    setReassignTask(null);
    setReassignTargetId('');
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">
              {isReviewer ? 'Review Queue' : isApprover ? 'Approval Queue' : 'Approval Queue'}
            </h1>
            <ScreenNumberBadge screenKey="approvals-queue" />
          </div>
          <p className="page-subtitle">Review and approve contract records and reassessment cases</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-[var(--color-lg-primary)] text-[var(--color-lg-primary)]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab.badgeCls || "bg-muted text-muted-foreground"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk reassign toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-lg-accent-subtle)] border border-[var(--color-lg-info)] rounded-lg text-[13px]">
            <span className="font-semibold text-[var(--color-lg-info)]">{selectedIds.size} task{selectedIds.size > 1 ? 's' : ''} selected</span>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[12px] ml-2"
              onClick={() => { setBulkReassignTargetId(''); setShowBulkReassign(true); }}
            >
              <UserCog className="w-3.5 h-3.5" /> Reassign Selected ({selectedIds.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-[var(--color-lg-primary)]"
                    checked={selectedIds.size > 0 && selectedIds.size === visibleTasks.filter(canReassign).length}
                    onChange={toggleSelectAll}
                    title="Select all reassignable"
                  />
                </th>
                <th className="text-left">Reference</th>
                <th className="text-left">Type</th>
                <th className="text-left">Name</th>
                <th className="text-left">Stage</th>
                <th className="text-left">Status</th>
                <th className="text-left">Submitted By</th>
                <th className="text-left">Assigned To</th>
                <th className="text-left">Date</th>
                <th className="text-left">Age</th>
                <th className="text-left">SLA</th>
                <th className="text-left">Priority</th>
                {activeTab === "my_submissions" && <th className="text-left">Recall</th>}
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "my_submissions" ? 14 : 13} className="text-center py-12 text-muted-foreground text-[13px]">
                    No tasks in this queue
                  </td>
                </tr>
              )}
              {visibleTasks.map(task => (
                <tr key={task.id} className={[
                  selectedIds.has(task.id) ? 'bg-[var(--color-lg-accent-subtle)]' : '',
                  flashedRows.has(task.id) ? 'animate-flash-row' : '',
                ].filter(Boolean).join(' ')}>
                  <td className="text-center">
                    {canReassign(task) ? (
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 accent-[var(--color-lg-primary)]"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                      />
                    ) : (
                      <span className="w-3.5 h-3.5 inline-block" />
                    )}
                  </td>
                  <td className="font-mono text-[12px] text-muted-foreground">{task.task_reference}</td>
                  <td><TypeBadge subject_type={task.subject_type} /></td>
                  <td>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {task.subject_type === 'contract_record' && task.package_id ? (
                          <button
                            type="button"
                            className="font-medium text-foreground text-left cursor-pointer hover:text-[var(--color-lg-accent)] hover:underline underline-offset-2 transition-colors bg-transparent border-0 p-0"
                            onClick={() => setPackageDialogId(task.package_id!)}
                          >{task.subject_label}</button>
                        ) : task.subject_type === 'reassessment_case' && task.case_id ? (
                          <button
                            type="button"
                            className="font-medium text-foreground text-left cursor-pointer hover:text-[var(--color-lg-accent)] hover:underline underline-offset-2 transition-colors bg-transparent border-0 p-0"
                            onClick={() => {
                              if (task.case_status === 'remediation') navigate(`/reassessment/cases/${task.case_id}/remediation`);
                              else if (task.case_status === 'project_review') navigate(`/reassessment/projects/${task.case_id}`);
                              else navigate(task.approval_stage === 'final_approval' ? `/workflows/reassessment/approval?caseId=${task.case_id}` : `/workflows/reassessment/review?caseId=${task.case_id}`);
                            }}
                          >{task.subject_label}</button>
                        ) : (
                          <p className="font-medium text-foreground">{task.subject_label}</p>
                        )}
                        {task.subject_type === 'contract_record' && task.package_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                onClick={() => setPackageDialogId(task.package_id!)}
                                aria-label="View package detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[12px]">View package detail</TooltipContent>
                          </Tooltip>
                        )}
                        {task.subject_type === 'reassessment_case' && task.case_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                onClick={() => {
                                  if (task.case_status === 'remediation') navigate(`/reassessment/cases/${task.case_id}/remediation`);
                                  else if (task.case_status === 'project_review') navigate(`/reassessment/projects/${task.case_id}`);
                                  else navigate(task.approval_stage === 'final_approval' ? `/workflows/reassessment/approval?caseId=${task.case_id}` : `/workflows/reassessment/review?caseId=${task.case_id}`);
                                }}
                                aria-label="Open reassessment case"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[12px]">Open reassessment case</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {task.rework_iteration > 0 && (
                        <span className="badge-warning inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5">
                          <RotateCcw className="w-3 h-3" /> Rework #{task.rework_iteration}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><StageBadge stage={task.approval_stage} /></td>
                  <td><StatusBadge status={task.status} opened_at={task.opened_at} /></td>
                  <td className="text-muted-foreground">{task.submitted_by}</td>
                  <td>
                    <ReviewerAvatar reviewerId={task.reviewer_id} />
                  </td>
                  <td className="text-muted-foreground text-[12px]">{new Date(task.submitted_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</td>
                  <td><AgeBadge submitted_at={task.submitted_at} /></td>
                  <td><SlaBadge sla_deadline_at={task.sla_deadline_at} /></td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  {activeTab === "my_submissions" && (
                    <td>
                      {task.recall_available ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[12px] border-[var(--color-lg-success)] text-[var(--color-lg-success)] hover:bg-[var(--color-lg-success-subtle)]"
                              onClick={() => navigate(`/approvals/recall?taskId=${task.id}`)}
                            >
                              <RotateCcw className="w-3 h-3" /> Recall
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-[12px]">Recall available — reviewer has not opened</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" disabled className="h-7 gap-1 text-[12px] border-[var(--color-lg-error)] text-[var(--color-lg-error)] opacity-50">
                              <RotateCcw className="w-3 h-3" /> Recall
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-[12px]">
                            Reviewer has opened this record{task.opened_at ? ` at ${new Date(task.opened_at).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })}` : ""}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                  )}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Reassign — only for pending/resubmitted tasks */}
                      {canReassign(task) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[12px]"
                              onClick={() => {
                                setReassignTargetId(task.reviewer_id ?? '');
                                setReassignTask(task);
                              }}
                            >
                              <UserCog className="w-3 h-3" /> Reassign
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-[12px]">
                            Redirect to a different {task.approval_stage === "review" ? "Reviewer" : "Approver"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* View Case — reassessment_case tasks with a known case_id */}
                      {task.subject_type === "reassessment_case" && task.case_id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[12px]"
                              onClick={() => {
                                if (task.case_status === 'remediation') navigate(`/reassessment/cases/${task.case_id}/remediation`);
                                else if (task.case_status === 'project_review') navigate(`/reassessment/projects/${task.case_id}`);
                                else navigate(task.approval_stage === 'final_approval' ? `/workflows/reassessment/approval?caseId=${task.case_id}` : `/workflows/reassessment/review?caseId=${task.case_id}`);
                              }}
                            >
                              <ExternalLink className="w-3 h-3" /> View Case
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-[12px]">Open reassessment case detail</TooltipContent>
                        </Tooltip>
                      )}
                      {/* View Package — contract_record tasks with a known package_id */}
                      {task.subject_type === "contract_record" && task.package_id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-[12px]"
                              onClick={() => setPackageDialogId(task.package_id!)}
                            >
                              <ExternalLink className="w-3 h-3" /> View Package
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="text-[12px]">Open contract package for inspection</TooltipContent>
                        </Tooltip>
                      )}
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-[12px]"
                        disabled={isAuditor}
                        title={isAuditor ? 'Read-only in Audit view' : undefined}
                        onClick={() => {
                          if (task.subject_type === "reassessment_case") {
                            if (!task.case_id) {
                              // Runtime guard — case_id must be seeded on every reassessment_case task
                              toast.error("Case ID missing — contact admin", {
                                description: `Task ${task.task_reference} has no linked case ID. Update INITIAL_TASKS to add case_id.`,
                              });
                              return;
                            }
                            // Route to the correct screen based on case_status hint
                            if (task.case_status === "remediation") {
                              navigate(`/reassessment/cases/${task.case_id}/remediation`);
                            } else if (task.case_status === "project_review") {
                              navigate(`/reassessment/projects/${task.case_id}`);
                            } else {
                              navigate(task.approval_stage === "final_approval"
                                ? `/workflows/reassessment/approval?caseId=${task.case_id}`
                                : `/workflows/reassessment/review?caseId=${task.case_id}`);
                            }
                          } else {
                            navigate(task.approval_stage === "final_approval" ? `/approvals/final/${task.id}` : `/approvals/review/${task.id}`);
                          }
                        }}
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bulk Reassign Dialog ─────────────────────────────────────────── */}
      <Dialog open={showBulkReassign} onOpenChange={open => { if (!open) { setShowBulkReassign(false); setBulkReassignTargetId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk Reassign Tasks</DialogTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              Redirect <strong>{selectedIds.size} selected task{selectedIds.size > 1 ? 's' : ''}</strong> to a new{' '}
              {bulkStage === 'review' ? 'Reviewer' : bulkStage === 'final_approval' ? 'Approver' : 'Reviewer/Approver'}.
              All original assignees and document submitters will be notified.
            </p>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">
              New {bulkStage === 'review' ? 'Reviewer' : 'Approver'}
            </label>
            <Select value={bulkReassignTargetId} onValueChange={setBulkReassignTargetId}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select a reviewer…" />
              </SelectTrigger>
              <SelectContent>
                {bulkEligibleReviewers.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: r.avatarColor }}
                      >
                        {r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                      <span>{r.name}</span>
                      <span className="text-[11px] text-muted-foreground">· {r.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowBulkReassign(false); setBulkReassignTargetId(''); }}>Cancel</Button>
            <Button size="sm" disabled={!bulkReassignTargetId} onClick={handleBulkReassign}>
              <UserCog className="w-3.5 h-3.5 mr-1.5" /> Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reassign Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={!!reassignTask}
        onOpenChange={open => { if (!open) { setReassignTask(null); setReassignTargetId(''); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
            <p className="text-[13px] text-muted-foreground mt-1">
              Redirect <strong>{reassignTask?.task_reference}</strong> to a different{' '}
              {reassignTask?.approval_stage === 'review' ? 'Reviewer' : 'Approver'}.
              The original assignee and document submitter will be notified.
            </p>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">
              New {reassignTask?.approval_stage === 'review' ? 'Reviewer' : 'Approver'}
            </label>
            <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select a reviewer…" />
              </SelectTrigger>
              <SelectContent>
                {eligibleReviewers.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ background: r.avatarColor }}
                      >
                        {r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                      <span>{r.name}</span>
                      <span className="text-[11px] text-muted-foreground">· {r.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Current assignee info */}
            {reassignTask?.reviewer_id && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Currently assigned to:{' '}
                <strong>{MOCK_REVIEWERS.find(r => r.id === reassignTask.reviewer_id)?.name ?? '—'}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setReassignTask(null); setReassignTargetId(''); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!reassignTargetId || reassignTargetId === reassignTask?.reviewer_id}
              onClick={handleConfirmReassign}
            >
              <UserCog className="w-3.5 h-3.5 mr-1.5" />
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package detail inline dialog */}
      <PackageDetailDialog
        open={packageDialogId !== null}
        onClose={() => setPackageDialogId(null)}
        packageId={packageDialogId ?? undefined}
        onApproved={(_pkgId) => {
          setPackageDialogId(null);
        }}
        onRejected={(_pkgId, _reason) => {
          setPackageDialogId(null);
        }}
        onReviewComplete={(pkgId) => {
          // Advance the linked task to 'reviewed' status
          const linkedTask = tasks.find(t => t.package_id === pkgId);
          if (linkedTask) {
            setTasks(prev => prev.map(t =>
              t.id === linkedTask.id
                ? { ...t, status: 'reviewed' as TaskStatus, opened_at: t.opened_at ?? new Date().toISOString() }
                : t
            ));
            // Fire SUBMIT_FOR_REVIEW toward Approver queue
            publishEvent({
              type: 'SUBMIT_FOR_REVIEW',
              sourceRole: 'reviewer',
              payload: {
                contractRecordId: linkedTask.id,
                batchRef: linkedTask.task_reference,
                label: linkedTask.subject_label,
                packageId: pkgId,
                fileCount: 1,
                workspace: 'Reviewed',
                submittedBy: 'Reviewer',
                forApproval: true,
              },
            });
            toast.success(`${linkedTask.task_reference} sent for approval`, {
              description: `${linkedTask.subject_label} has been reviewed and forwarded to the Approver queue.`,
              duration: 6000,
            });
          }
          setPackageDialogId(null);
        }}
      />
    </div>
  );
}
