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
 *
 * Data model refs: ApprovalTask (task_reference, subject_type, status,
 *   approval_stage, priority, submitted_at, opened_at, recall_available,
 *   sla_deadline_at, rejection_reason_codes)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Clock, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, AlertCircle, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

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
}

// TODO: Backend integration required — GET /api/approvals/tasks
const ALL_TASKS: ApprovalTask[] = [
  { id:"t1",  task_reference:"AT-2026-0041", subject_type:"contract_record",   subject_label:"Office Tower — 350 Fifth Ave",         approval_stage:"review",          status:"pending",           submitted_by:"J. Martinez", submitted_at:"2026-05-16T08:00:00Z", opened_at:null,                      recall_available:true,  priority:"high",      sla_deadline_at:"2026-05-18T17:00:00Z", rework_iteration:0 },
  { id:"t2",  task_reference:"AT-2026-0040", subject_type:"contract_record",   subject_label:"Retail HQ — 1200 Market St",            approval_stage:"review",          status:"opened",            submitted_by:"S. Patel",    submitted_at:"2026-05-15T14:20:00Z", opened_at:"2026-05-15T15:00:00Z",    recall_available:false, priority:"standard",  sla_deadline_at:"2026-05-20T17:00:00Z", rework_iteration:0 },
  { id:"t3",  task_reference:"AT-2026-0039", subject_type:"reassessment_case", subject_label:"Warehouse Lease — Scope Increase",      approval_stage:"final_approval",  status:"pending",           submitted_by:"A. Chen",     submitted_at:"2026-05-14T09:30:00Z", opened_at:null,                      recall_available:true,  priority:"escalated", sla_deadline_at:"2026-05-17T17:00:00Z", rework_iteration:0 },
  { id:"t4",  task_reference:"AT-2026-0038", subject_type:"contract_record",   subject_label:"Ground Lease — Civic Center",           approval_stage:"review",          status:"rework_in_progress",submitted_by:"J. Martinez", submitted_at:"2026-05-12T11:00:00Z", opened_at:"2026-05-12T11:30:00Z",    recall_available:false, priority:"high",      sla_deadline_at:"2026-05-16T17:00:00Z", rework_iteration:1 },
  { id:"t5",  task_reference:"AT-2026-0037", subject_type:"contract_record",   subject_label:"Industrial Park — Unit 7",              approval_stage:"final_approval",  status:"pending",           submitted_by:"S. Patel",    submitted_at:"2026-05-16T07:00:00Z", opened_at:null,                      recall_available:true,  priority:"standard",  sla_deadline_at:"2026-05-21T17:00:00Z", rework_iteration:0 },
  { id:"t6",  task_reference:"AT-2026-0036", subject_type:"reassessment_case", subject_label:"Tech Campus — Rent Modification",       approval_stage:"review",          status:"pending",           submitted_by:"A. Chen",     submitted_at:"2026-05-15T16:00:00Z", opened_at:null,                      recall_available:true,  priority:"standard",  sla_deadline_at:"2026-05-22T17:00:00Z", rework_iteration:0 },
  { id:"t7",  task_reference:"AT-2026-0035", subject_type:"contract_record",   subject_label:"Suburban Office — Suite 400",           approval_stage:"review",          status:"resubmitted",       submitted_by:"J. Martinez", submitted_at:"2026-05-16T06:00:00Z", opened_at:null,                      recall_available:true,  priority:"high",      sla_deadline_at:"2026-05-19T17:00:00Z", rework_iteration:2 },
  { id:"t8",  task_reference:"AT-2026-0034", subject_type:"contract_record",   subject_label:"Downtown Retail — Corner Unit",         approval_stage:"final_approval",  status:"approved",          submitted_by:"S. Patel",    submitted_at:"2026-05-10T09:00:00Z", opened_at:"2026-05-10T10:00:00Z",    recall_available:false, priority:"standard",  sla_deadline_at:null,                   rework_iteration:0 },
];

const CURRENT_USER = "Current User";

type TabId = "all" | "my_reviews" | "my_approvals" | "rework" | "my_submissions";

const TABS: { id: TabId; label: string; badge?: number; badgeCls?: string }[] = [
  { id:"all",            label:"All Pending",    badge:8 },
  { id:"my_reviews",     label:"My Reviews",     badge:3 },
  { id:"my_approvals",   label:"My Approvals",   badge:5 },
  { id:"rework",         label:"Rework",         badge:1, badgeCls:"badge-warning" },
  { id:"my_submissions", label:"My Submissions", badge:2 },
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

export default function ApprovalsQueue() {
  const _screenKey = SCREEN_KEYS.APPROVALS_QUEUE;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("my_reviews");

  const visibleTasks = filterByTab(ALL_TASKS, activeTab);

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Queue</h1>
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

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="text-left">Reference</th>
                <th className="text-left">Type</th>
                <th className="text-left">Name</th>
                <th className="text-left">Stage</th>
                <th className="text-left">Submitted By</th>
                <th className="text-left">Date</th>
                <th className="text-left">Age</th>
                <th className="text-left">Priority</th>
                {activeTab === "my_submissions" && <th className="text-left">Recall</th>}
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "my_submissions" ? 10 : 9} className="text-center py-12 text-muted-foreground text-[13px]">
                    No tasks in this queue
                  </td>
                </tr>
              )}
              {visibleTasks.map(task => (
                <tr key={task.id}>
                  <td className="font-mono text-[12px] text-muted-foreground">{task.task_reference}</td>
                  <td><TypeBadge subject_type={task.subject_type} /></td>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{task.subject_label}</p>
                      {task.rework_iteration > 0 && (
                        <span className="badge-warning inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5">
                          <RotateCcw className="w-3 h-3" /> Rework #{task.rework_iteration}
                        </span>
                      )}
                    </div>
                  </td>
                  <td><StageBadge stage={task.approval_stage} /></td>
                  <td className="text-muted-foreground">{task.submitted_by}</td>
                  <td className="text-muted-foreground text-[12px]">{new Date(task.submitted_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</td>
                  <td><AgeBadge submitted_at={task.submitted_at} /></td>
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
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-[12px]"
                      onClick={() => navigate(task.approval_stage === "final_approval" ? "/approvals/final" : "/approvals/review")}
                    >
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
