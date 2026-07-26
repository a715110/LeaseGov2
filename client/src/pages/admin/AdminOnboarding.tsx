/**
 * AdminOnboarding — FC-8 Screen 8.8
 * Screen key: admin-onboarding
 * Route: /admin/onboarding
 *
 * Allows System Admins to view all users and set or change their assigned workspace.
 * The assigned workspace is used as the default in the Upload Files modal when
 * a user has not yet manually selected a workspace preference.
 *
 * Features:
 *   - User list with current workspace assignment badge
 *   - Inline workspace picker (Select) per row — saves immediately (stub)
 *   - Filter by role and workspace
 *   - Status badge (active / pending / inactive)
 *   - Bulk-assign workspace to a filtered set of users
 *   - Audit note: every change is logged to the activity feed (stub)
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */
import { useState, useMemo } from "react";
import {
  UserCog, Building2, CheckCircle2, Clock, XCircle,
  ChevronDown, Search, Users, AlertTriangle, Info,
  RefreshCw, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import AdminLayout from "@/components/admin/AdminLayout";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { MOCK_WORKSPACES } from "@/lib/mockData";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";
import type { UserRole } from "@/lib/types";
import { toast } from "sonner";
import { ScreenNumberBadge } from "@/components/dev/ScreenNumberBadge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = "active" | "pending_activation" | "inactive";

interface OnboardingUser {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  roles: UserRole[];
  /** Workspace ID assigned at onboarding — null means unassigned */
  assignedWorkspaceId: string | null;
  /** ISO timestamp of last workspace change */
  workspaceAssignedAt: string | null;
  /** Admin who last set the workspace */
  workspaceAssignedBy: string | null;
  last_login_at: string | null;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ONBOARDING_USERS: OnboardingUser[] = [
  {
    id: "u1",
    full_name: "Jordan Martinez",
    email: "j.martinez@leasegov.com",
    status: "active",
    roles: ["document_submitter"],
    assignedWorkspaceId: "ws-002",
    workspaceAssignedAt: "2026-05-01T09:00:00Z",
    workspaceAssignedBy: "C. Williams (Admin)",
    last_login_at: "2026-07-25 09:14",
  },
  {
    id: "u2",
    full_name: "Fatima Okonkwo",
    email: "f.okonkwo@leasegov.com",
    status: "active",
    roles: ["document_submitter"],
    assignedWorkspaceId: "ws-003",
    workspaceAssignedAt: "2026-05-03T14:30:00Z",
    workspaceAssignedBy: "C. Williams (Admin)",
    last_login_at: "2026-07-24 14:22",
  },
  {
    id: "u3",
    full_name: "Diane Hoffman",
    email: "d.hoffman@leasegov.com",
    status: "pending_activation",
    roles: ["document_submitter"],
    assignedWorkspaceId: null,
    workspaceAssignedAt: null,
    workspaceAssignedBy: null,
    last_login_at: null,
  },
  {
    id: "u4",
    full_name: "Kwame Asante",
    email: "k.asante@leasegov.com",
    status: "active",
    roles: ["document_submitter", "preparer"],
    assignedWorkspaceId: "ws-001",
    workspaceAssignedAt: "2026-04-15T11:00:00Z",
    workspaceAssignedBy: "C. Williams (Admin)",
    last_login_at: "2026-07-25 08:55",
  },
  {
    id: "u5",
    full_name: "Priya Nair",
    email: "p.nair@leasegov.com",
    status: "active",
    roles: ["preparer"],
    assignedWorkspaceId: "ws-004",
    workspaceAssignedAt: "2026-03-20T10:00:00Z",
    workspaceAssignedBy: "C. Williams (Admin)",
    last_login_at: "2026-07-23 17:30",
  },
  {
    id: "u6",
    full_name: "Marcus Webb",
    email: "m.webb@leasegov.com",
    status: "inactive",
    roles: ["document_submitter"],
    assignedWorkspaceId: "ws-002",
    workspaceAssignedAt: "2026-01-10T09:00:00Z",
    workspaceAssignedBy: "C. Williams (Admin)",
    last_login_at: "2026-04-30 11:05",
  },
  {
    id: "u7",
    full_name: "Aisha Chen",
    email: "a.chen@leasegov.com",
    status: "pending_activation",
    roles: ["document_submitter"],
    assignedWorkspaceId: null,
    workspaceAssignedAt: null,
    workspaceAssignedBy: null,
    last_login_at: null,
  },
  {
    id: "u8",
    full_name: "Samuel Patel",
    email: "s.patel@leasegov.com",
    status: "active",
    roles: ["preparer", "system_admin"],
    assignedWorkspaceId: "ws-005",
    workspaceAssignedAt: "2026-02-28T08:00:00Z",
    workspaceAssignedBy: "System (Onboarding)",
    last_login_at: "2026-07-25 07:45",
  },
];

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<UserStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  active:              { label: "Active",   icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_activation:  { label: "Pending",  icon: Clock,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  inactive:            { label: "Inactive", icon: XCircle,      cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkspaceName(id: string | null): string {
  if (!id) return "—";
  return MOCK_WORKSPACES.find(w => w.id === id)?.name ?? id;
}

function getWorkspaceTeam(id: string | null): string {
  if (!id) return "";
  return MOCK_WORKSPACES.find(w => w.id === id)?.team ?? "";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Workspace colour map (matches UploadDialog) ──────────────────────────────

const WS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  "Corporate Leasing": { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "Retail":            { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  "Office":            { bg: "bg-indigo-50",  text: "text-indigo-700", border: "border-indigo-200" },
  "Industrial":        { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  "Land":              { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200" },
};

function WorkspacePill({ id }: { id: string | null }) {
  if (!id) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border bg-slate-50 text-slate-400 border-slate-200 italic">
        Unassigned
      </span>
    );
  }
  const name = getWorkspaceName(id);
  const c = WS_COLOURS[name] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border", c.bg, c.text, c.border)}>
      <Building2 className="w-3 h-3" />
      {name}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOnboarding() {
  const [users, setUsers] = useState<OnboardingUser[]>(MOCK_ONBOARDING_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterWorkspace, setFilterWorkspace] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkWorkspaceId, setBulkWorkspaceId] = useState<string>("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.roles.includes(filterRole as UserRole);
      const matchWs = filterWorkspace === "all"
        ? true
        : filterWorkspace === "unassigned"
          ? u.assignedWorkspaceId === null
          : u.assignedWorkspaceId === filterWorkspace;
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      return matchSearch && matchRole && matchWs && matchStatus;
    });
  }, [users, search, filterRole, filterWorkspace, filterStatus]);

  const unassignedCount = users.filter(u => u.assignedWorkspaceId === null && u.status !== "inactive").length;

  // ── Selection ──────────────────────────────────────────────────────────────

  const allFilteredSelected = filtered.length > 0 && filtered.every(u => selectedIds.has(u.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(u => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(u => next.add(u.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Single-user workspace change ───────────────────────────────────────────

  function openEditDialog(user: OnboardingUser) {
    setEditingUserId(user.id);
    setEditWorkspaceId(user.assignedWorkspaceId ?? "");
    setEditDialogOpen(true);
  }

  function saveEdit() {
    if (!editingUserId) return;
    const wsName = getWorkspaceName(editWorkspaceId || null);
    setUsers(prev => prev.map(u =>
      u.id === editingUserId
        ? {
            ...u,
            assignedWorkspaceId: editWorkspaceId || null,
            workspaceAssignedAt: new Date().toISOString(),
            workspaceAssignedBy: "C. Williams (Admin)",
          }
        : u,
    ));
    setEditDialogOpen(false);
    setEditingUserId(null);
    toast.success("Workspace updated", {
      description: editWorkspaceId
        ? `Assigned to ${wsName}.`
        : "Workspace cleared — user will be prompted on next upload.",
    });
  }

  // ── Bulk assign ────────────────────────────────────────────────────────────

  function applyBulkAssign() {
    const wsName = getWorkspaceName(bulkWorkspaceId || null);
    setUsers(prev => prev.map(u =>
      selectedIds.has(u.id)
        ? {
            ...u,
            assignedWorkspaceId: bulkWorkspaceId || null,
            workspaceAssignedAt: new Date().toISOString(),
            workspaceAssignedBy: "C. Williams (Admin)",
          }
        : u,
    ));
    toast.success(`Workspace updated for ${selectedIds.size} user${selectedIds.size > 1 ? "s" : ""}`, {
      description: bulkWorkspaceId ? `Assigned to ${wsName}.` : "Workspace cleared.",
    });
    setSelectedIds(new Set());
    setBulkDialogOpen(false);
    setBulkWorkspaceId("");
  }

  const editingUser = editingUserId ? users.find(u => u.id === editingUserId) : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Page header */}
        <div className="px-8 py-5 border-b border-border flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              <h1 className="page-title">User Onboarding</h1>
              <ScreenNumberBadge screenKey={SCREEN_KEYS.ADMIN_ONBOARDING} />
            </div>
            <p className="page-subtitle">
              Assign or change each user's default workspace. This workspace pre-fills the Upload Files modal at first use.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unassignedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[12px] font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {unassignedCount} user{unassignedCount > 1 ? "s" : ""} unassigned
              </div>
            )}
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="h-8 text-[12px] gap-1.5"
                onClick={() => setBulkDialogOpen(true)}
              >
                <Building2 className="w-3.5 h-3.5" />
                Assign Workspace ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-8 mt-4 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-[12px] text-blue-800">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <span>
            The <strong>Assigned Workspace</strong> sets the default selection in the Upload Files modal for each user.
            Users can still change the workspace during upload — their choice is then saved as a personal preference
            and takes priority over this onboarding assignment.
          </span>
        </div>

        {/* Filters */}
        <div className="px-8 py-3 flex items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-[12px]"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-[12px] w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">All statuses</SelectItem>
              <SelectItem value="active" className="text-[12px]">Active</SelectItem>
              <SelectItem value="pending_activation" className="text-[12px]">Pending</SelectItem>
              <SelectItem value="inactive" className="text-[12px]">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-8 text-[12px] w-44">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">All roles</SelectItem>
              <SelectItem value="document_submitter" className="text-[12px]">Document Submitter</SelectItem>
              <SelectItem value="preparer" className="text-[12px]">Preparer</SelectItem>
              <SelectItem value="reviewer" className="text-[12px]">Reviewer</SelectItem>
              <SelectItem value="approver" className="text-[12px]">Approver</SelectItem>
              <SelectItem value="system_admin" className="text-[12px]">System Admin</SelectItem>
              <SelectItem value="auditor" className="text-[12px]">Auditor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
            <SelectTrigger className="h-8 text-[12px] w-44">
              <SelectValue placeholder="All workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[12px]">All workspaces</SelectItem>
              <SelectItem value="unassigned" className="text-[12px] text-muted-foreground italic">Unassigned</SelectItem>
              {MOCK_WORKSPACES.map(ws => (
                <SelectItem key={ws.id} value={ws.id} className="text-[12px]">{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {filtered.length} of {users.length} users
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-3 w-8 text-left">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className="w-3.5 h-3.5"
                  />
                </th>
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">User</th>
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Status</th>
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Roles</th>
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Assigned Workspace</th>
                <th className="pb-2 pr-4 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Assigned By / Date</th>
                <th className="pb-2 text-left font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-[13px]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No users match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map(user => {
                const statusCfg = STATUS_CONFIG[user.status];
                const StatusIcon = statusCfg.icon;
                const isSelected = selectedIds.has(user.id);
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                    )}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pr-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(user.id)}
                        aria-label={`Select ${user.full_name}`}
                        className="w-3.5 h-3.5"
                      />
                    </td>

                    {/* User */}
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground text-[13px]">{user.full_name}</span>
                        <span className="text-muted-foreground text-[11px]">{user.email}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                        statusCfg.cls,
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Roles */}
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                            style={{
                              borderColor: ROLE_COLORS[role] + "66",
                              background: ROLE_COLORS[role] + "18",
                              color: ROLE_COLORS[role],
                            }}
                          >
                            {ROLE_LABELS[role]}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Assigned Workspace */}
                    <td className="py-3 pr-4">
                      <WorkspacePill id={user.assignedWorkspaceId} />
                      {user.assignedWorkspaceId && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {getWorkspaceTeam(user.assignedWorkspaceId)}
                        </div>
                      )}
                    </td>

                    {/* Assigned By / Date */}
                    <td className="py-3 pr-4">
                      {user.workspaceAssignedAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-[11px]">{user.workspaceAssignedBy}</span>
                          <span className="text-muted-foreground text-[10px]">{formatDate(user.workspaceAssignedAt)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Not yet set</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1"
                        onClick={() => openEditDialog(user)}
                      >
                        <Building2 className="w-3 h-3" />
                        {user.assignedWorkspaceId ? "Change" : "Assign"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Single-user Edit Dialog ────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={open => !open && setEditDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Assign Workspace — {editingUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {editingUser?.assignedWorkspaceId && (
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span>Current:</span>
                <WorkspacePill id={editingUser.assignedWorkspaceId} />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                New Workspace Assignment
              </label>
              <Select value={editWorkspaceId} onValueChange={setEditWorkspaceId}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select workspace…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-[12px] text-muted-foreground italic">
                    — Clear assignment —
                  </SelectItem>
                  {MOCK_WORKSPACES.map(ws => (
                    <SelectItem key={ws.id} value={ws.id} className="text-[13px]">
                      <span className="flex flex-col">
                        <span className="font-medium">{ws.name}</span>
                        <span className="text-[10px] text-muted-foreground">{ws.team}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This workspace will be pre-selected in the Upload Files modal the next time{" "}
              <strong>{editingUser?.full_name}</strong> uploads documents — unless they have already
              saved a personal preference.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="h-8 text-[12px]" onClick={saveEdit}>
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Assign Dialog ─────────────────────────────────────────────── */}
      <Dialog open={bulkDialogOpen} onOpenChange={open => !open && setBulkDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Bulk Assign Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-[12px] text-muted-foreground">
              Assigning workspace to <strong>{selectedIds.size} selected user{selectedIds.size > 1 ? "s" : ""}</strong>.
              This will overwrite any existing workspace assignment for each user.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Workspace
              </label>
              <Select value={bulkWorkspaceId} onValueChange={setBulkWorkspaceId}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select workspace…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-[12px] text-muted-foreground italic">
                    — Clear assignment —
                  </SelectItem>
                  {MOCK_WORKSPACES.map(ws => (
                    <SelectItem key={ws.id} value={ws.id} className="text-[13px]">
                      <span className="flex flex-col">
                        <span className="font-medium">{ws.name}</span>
                        <span className="text-[10px] text-muted-foreground">{ws.team}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="h-8 text-[12px]"
              disabled={bulkWorkspaceId === undefined}
              onClick={applyBulkAssign}
            >
              Apply to {selectedIds.size} User{selectedIds.size > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
