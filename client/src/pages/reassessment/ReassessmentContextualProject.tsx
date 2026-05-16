/**
 * ReassessmentContextualProject — FC-6 Screen 6.14
 * Screen key: reassessment-contextual-project
 * Route: /reassessment/projects/:id
 *
 * Prompt 6.14: Contextual project workspace.
 * Header: project name, status badge, due date, linked case count.
 * 3-column Kanban: To Do / In Progress / Done.
 * Task cards: title, assignee avatar, due date, priority badge, linked case chip.
 * "Add Task" button opens inline form.
 * Project notes textarea. Close Project button (gated on all tasks done).
 *
 * Data model refs: ContextualProject (project_name, status, due_date, linked_case_ids),
 *   ContextualProjectTask (task_title, assignee_id, due_date, priority, status)
 */

import { useState } from "react";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

type TaskStatus = "todo" | "in_progress" | "done";
type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  assignee: string;
  due_date: string;
  priority: Priority;
  status: TaskStatus;
  linked_case: string;
}

// TODO: Backend integration required — GET /api/reassessments/projects/:id
const MOCK_PROJECT = {
  id: "p1",
  project_name: "Q2 2026 Lease Portfolio Review",
  status: "in_progress",
  due_date: "2026-06-30",
  linked_case_ids: ["c3","c4","c7","c8"],
  notes: "Coordinate with Finance team for IBR confirmation before June 15. Ensure all option assessments are completed before period-end sweep.",
};

const INITIAL_TASKS: Task[] = [
  { id:"t1", title:"Complete IBR confirmation for Q2",           assignee:"A. Chen",    due_date:"2026-06-15", priority:"high",   status:"in_progress", linked_case:"RC-2026-0012" },
  { id:"t2", title:"Review all Tier 2 assessments",              assignee:"B. Patel",   due_date:"2026-06-20", priority:"high",   status:"todo",        linked_case:"RC-2026-0008" },
  { id:"t3", title:"Prepare remediation memo — RC-2026-0009",    assignee:"A. Chen",    due_date:"2026-05-25", priority:"high",   status:"in_progress", linked_case:"RC-2026-0009" },
  { id:"t4", title:"Coordinate with landlord — Park Ave",        assignee:"C. Torres",  due_date:"2026-06-10", priority:"medium", status:"todo",        linked_case:"RC-2026-0013" },
  { id:"t5", title:"Send investigative surveys — 3 leases",      assignee:"B. Patel",   due_date:"2026-05-20", priority:"medium", status:"done",        linked_case:"RC-2026-0012" },
  { id:"t6", title:"Update watchlist rules for CPI threshold",   assignee:"A. Chen",    due_date:"2026-05-18", priority:"low",    status:"done",        linked_case:"—" },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  high:   "badge-error",
  medium: "badge-warning",
  low:    "badge-muted",
};

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id:"todo",        label:"To Do" },
  { id:"in_progress", label:"In Progress" },
  { id:"done",        label:"Done" },
];

export default function ReassessmentContextualProject() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_CONTEXTUAL_PROJECT;

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState(MOCK_PROJECT.notes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title:"", assignee:"", due_date:"", priority:"medium" as Priority, linked_case:"" });
  const [closed, setClosed] = useState(false);

  const allDone = tasks.every(t => t.status === "done");

  function moveTask(id: string, status: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  // TODO: Backend integration required — POST /api/reassessments/projects/:id/tasks
  function addTask() {
    if (!newTask.title.trim()) return;
    setTasks(prev => [...prev, {
      id: `t${Date.now()}`,
      title: newTask.title,
      assignee: newTask.assignee || "Unassigned",
      due_date: newTask.due_date || "—",
      priority: newTask.priority,
      status: "todo",
      linked_case: newTask.linked_case || "—",
    }]);
    setShowAddForm(false);
    setNewTask({ title:"", assignee:"", due_date:"", priority:"medium", linked_case:"" });
  }

  if (closed) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Project Closed</p>
          <p className="text-[13px] text-muted-foreground">{MOCK_PROJECT.project_name} has been marked as complete.</p>
          <Button onClick={() => setClosed(false)}>Back to Project</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">{MOCK_PROJECT.project_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold badge-processing">In Progress</span>
            <span className="text-[12px] text-muted-foreground">Due {MOCK_PROJECT.due_date}</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_PROJECT.linked_case_ids.length} linked cases</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5 h-8 text-[12px]" onClick={() => setShowAddForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
          <Button
            disabled={!allDone}
            className="h-8 text-[12px]"
            onClick={() => setClosed(true)}
          >
            Close Project
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-6">
        {/* Add task form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-foreground">Add Task</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded hover:bg-muted/30">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Task Title *</label>
                <input className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" value={newTask.title} onChange={e => setNewTask(p => ({...p, title:e.target.value}))} placeholder="Task title…" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Assignee</label>
                <input className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" value={newTask.assignee} onChange={e => setNewTask(p => ({...p, assignee:e.target.value}))} placeholder="Name…" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Due Date</label>
                <input type="date" className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" value={newTask.due_date} onChange={e => setNewTask(p => ({...p, due_date:e.target.value}))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Priority</label>
                <select className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" value={newTask.priority} onChange={e => setNewTask(p => ({...p, priority:e.target.value as Priority}))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Linked Case</label>
                <input className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" value={newTask.linked_case} onChange={e => setNewTask(p => ({...p, linked_case:e.target.value}))} placeholder="RC-2026-XXXX" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button disabled={!newTask.title.trim()} onClick={addTask}>Add Task</Button>
            </div>
          </div>
        )}

        {/* Kanban board */}
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</h3>
                  <span className="text-[11px] font-bold text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {colTasks.map(task => (
                    <div key={task.id} className="bg-card border border-border rounded-lg p-3.5 flex flex-col gap-2">
                      <p className="text-[12px] font-semibold text-foreground leading-snug">{task.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_BADGE[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.linked_case !== "—" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold badge-muted">
                            {task.linked_case}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{task.assignee}</span>
                        <span>{task.due_date}</span>
                      </div>
                      {/* Move buttons */}
                      <div className="flex gap-1 pt-1">
                        {col.id !== "todo" && (
                          <button
                            className="flex-1 text-[10px] py-1 rounded border border-border hover:bg-muted/30 text-muted-foreground"
                            onClick={() => moveTask(task.id, col.id === "in_progress" ? "todo" : "in_progress")}
                          >
                            ← {col.id === "in_progress" ? "To Do" : "In Progress"}
                          </button>
                        )}
                        {col.id !== "done" && (
                          <button
                            className="flex-1 text-[10px] py-1 rounded border border-border hover:bg-muted/30 text-muted-foreground"
                            onClick={() => moveTask(task.id, col.id === "todo" ? "in_progress" : "done")}
                          >
                            {col.id === "todo" ? "In Progress" : "Done"} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-[11px] text-muted-foreground py-6">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project notes */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Project Notes</h3>
          <Textarea
            rows={4}
            className="text-[13px] resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Project-level notes and coordination details…"
          />
        </div>
      </div>
    </div>
  );
}
