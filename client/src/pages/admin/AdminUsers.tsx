/**
 * AdminUsers — FC-8 Screen 8.1
 * Screen key: admin-users
 * Route: /admin/users
 *
 * Prompt 8.1: User management screen.
 * Table: full_name · email · status badge · roles pills · scope_level badge ·
 *   workspace_tag_ids · last_login_at · Edit · Deactivate actions
 * Invite User drawer: name · email · role multi-select · scope level ·
 *   workspace tag assignment (shown when scope = workspace)
 * Edit Role drawer: role multi-select with SoD conflict warnings inline
 * Deactivate: sets status = inactive (never hard delete)
 * SoD rules: warn on assignment, do not block
 *
 * Data model refs: User, UserRoleAssignment, WorkspaceTag
 */

import { useState } from "react";
import { UserPlus, Download, Search, X, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";
import AdminLayout from "@/components/admin/AdminLayout";
import type { UserRole } from "@/lib/types";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/admin/users
type UserStatus = "active" | "inactive" | "pending_activation";
type ScopeLevel = "global" | "workspace" | "own";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  roles: UserRole[];
  scope_level: ScopeLevel;
  workspace_tags: string[];
  last_login_at: string | null;
}

const MOCK_USERS: AdminUser[] = [
  { id:"u1", full_name:"Jordan Martinez",   email:"j.martinez@acme.com",  status:"active",             roles:["preparer","reviewer"],          scope_level:"workspace", workspace_tags:["Retail HQ","Office Tower"], last_login_at:"2026-05-16 09:14" },
  { id:"u2", full_name:"Aisha Chen",        email:"a.chen@acme.com",      status:"active",             roles:["approver"],                     scope_level:"global",    workspace_tags:[],                          last_login_at:"2026-05-16 08:55" },
  { id:"u3", full_name:"Samuel Patel",      email:"s.patel@acme.com",     status:"active",             roles:["accountant","controller"],      scope_level:"global",    workspace_tags:[],                          last_login_at:"2026-05-15 17:30" },
  { id:"u4", full_name:"Fatima Okonkwo",    email:"f.okonkwo@acme.com",   status:"active",             roles:["document_submitter"],           scope_level:"own",       workspace_tags:[],                          last_login_at:"2026-05-15 14:22" },
  { id:"u5", full_name:"Marcus Webb",       email:"m.webb@acme.com",      status:"active",             roles:["lease_admin"],                  scope_level:"global",    workspace_tags:[],                          last_login_at:"2026-05-16 07:45" },
  { id:"u6", full_name:"Priya Nair",        email:"p.nair@acme.com",      status:"active",             roles:["auditor"],                      scope_level:"global",    workspace_tags:[],                          last_login_at:"2026-05-14 16:10" },
  { id:"u7", full_name:"Carlos Reyes",      email:"c.reyes@acme.com",     status:"inactive",           roles:["preparer"],                     scope_level:"workspace", workspace_tags:["Warehouse"],               last_login_at:"2026-04-30 11:05" },
  { id:"u8", full_name:"Diane Hoffman",     email:"d.hoffman@acme.com",   status:"pending_activation", roles:["business_submitter"],           scope_level:"own",       workspace_tags:[],                          last_login_at:null },
];

const STATUS_BADGE: Record<UserStatus, { label: string; cls: string }> = {
  active:             { label:"Active",             cls:"badge-valid" },
  inactive:           { label:"Inactive",           cls:"badge-muted" },
  pending_activation: { label:"Pending Activation", cls:"badge-warning" },
};

const SCOPE_BADGE: Record<ScopeLevel, { label: string; cls: string }> = {
  global:    { label:"Global",    cls:"badge-deferred" },
  workspace: { label:"Workspace", cls:"badge-processing" },
  own:       { label:"Own",       cls:"badge-muted" },
};

const ALL_ROLES: UserRole[] = [
  "document_submitter","preparer","reviewer","approver",
  "accountant","controller","business_submitter","auditor","lease_admin",
];

// SoD incompatibility pairs (warn but don't block)
const SOD_PAIRS: [UserRole, UserRole][] = [
  ["preparer","approver"],
  ["preparer","reviewer"],
  ["reviewer","approver"],
];

function getSodWarnings(roles: UserRole[]): string[] {
  const warnings: string[] = [];
  for (const [a, b] of SOD_PAIRS) {
    if (roles.includes(a) && roles.includes(b)) {
      warnings.push(`${ROLE_LABELS[a]} + ${ROLE_LABELS[b]} on the same record violates SoD`);
    }
  }
  return warnings;
}

const WORKSPACE_TAGS = ["Retail HQ","Office Tower","Warehouse","Industrial Park","Ground Lease","Suburban Campus"];

export default function AdminUsers() {
  const _screenKey = SCREEN_KEYS.ADMIN_USERS;
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  // Invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoles, setInviteRoles] = useState<UserRole[]>([]);
  const [inviteScope, setInviteScope] = useState<ScopeLevel>("own");
  const [inviteTags, setInviteTags] = useState<string[]>([]);

  // Edit form state
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleRole(role: UserRole, roles: UserRole[], set: (r: UserRole[]) => void) {
    if (roles.includes(role)) set(roles.filter(r => r !== role));
    else set([...roles, role]);
  }

  function openEdit(user: AdminUser) {
    setEditUser(user);
    setEditRoles([...user.roles]);
  }

  // TODO: Backend integration required — PATCH /api/admin/users/:id/roles
  function saveEditRoles() {
    if (!editUser) return;
    setUsers(us => us.map(u => u.id === editUser.id ? { ...u, roles: editRoles } : u));
    setEditUser(null);
  }

  // TODO: Backend integration required — PATCH /api/admin/users/:id/status
  function deactivateUser(id: string) {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: "inactive" } : u));
  }

  // TODO: Backend integration required — POST /api/admin/users/invite
  function sendInvite() {
    const newUser: AdminUser = {
      id: `u${Date.now()}`,
      full_name: inviteName,
      email: inviteEmail,
      status: "pending_activation",
      roles: inviteRoles,
      scope_level: inviteScope,
      workspace_tags: inviteTags,
      last_login_at: null,
    };
    setUsers(us => [...us, newUser]);
    setInviteOpen(false);
    setInviteName(""); setInviteEmail(""); setInviteRoles([]); setInviteScope("own"); setInviteTags([]);
  }

  const inviteSodWarnings = getSodWarnings(inviteRoles);
  const editSodWarnings = getSodWarnings(editRoles);

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Users &amp; Roles</h1>
              <ScreenNumberBadge screenKey="admin-users" />
            </div>
            <p className="page-subtitle">{users.filter(u => u.status === "active").length} active users</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5 h-8 text-[12px]">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button className="gap-1.5 h-8 text-[12px]" onClick={() => setInviteOpen(true)}>
              <UserPlus className="w-3.5 h-3.5" /> Invite User
            </Button>
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-4">
          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-9 h-8 text-[12px]" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="data-table w-full text-[12px]">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Roles</th>
                  <th className="text-left">Scope</th>
                  <th className="text-left">Last Login</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const statusBadge = STATUS_BADGE[user.status];
                  const scopeBadge = SCOPE_BADGE[user.scope_level];
                  return (
                    <tr key={user.id}>
                      <td className="font-semibold text-foreground">{user.full_name}</td>
                      <td className="text-muted-foreground">{user.email}</td>
                      <td>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <span
                              key={role}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted/30 text-foreground"
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ROLE_COLORS[role] }} />
                              {ROLE_LABELS[role]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${scopeBadge.cls}`}>
                          {scopeBadge.label}
                        </span>
                      </td>
                      <td className="text-muted-foreground font-mono text-[11px]">{user.last_login_at || "—"}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            className="text-[11px] font-semibold underline"
                            style={{ color:"var(--color-lg-primary)" }}
                            onClick={() => openEdit(user)}
                          >
                            Edit Roles
                          </button>
                          {user.status === "active" && (
                            <button
                              className="text-[11px] font-semibold underline"
                              style={{ color:"var(--color-lg-error)" }}
                              onClick={() => deactivateUser(user.id)}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite User Drawer */}
      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent side="right" className="w-[420px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-[15px]">Invite User</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-foreground">Full Name <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
              <Input className="h-8 text-[12px]" placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-foreground">Email <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
              <Input className="h-8 text-[12px]" placeholder="jane@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-foreground">Roles</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role, inviteRoles, setInviteRoles)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border transition-all"
                    style={{
                      borderColor: inviteRoles.includes(role) ? ROLE_COLORS[role] : "var(--color-border)",
                      background: inviteRoles.includes(role) ? `${ROLE_COLORS[role]}22` : "transparent",
                      color: inviteRoles.includes(role) ? ROLE_COLORS[role] : "var(--color-muted-foreground)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLORS[role] }} />
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
              {inviteSodWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border text-[11px]" style={{ borderColor:"var(--color-lg-warning)", background:"var(--color-lg-warning-subtle)" }}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
                  <span className="text-foreground">{w}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-semibold text-foreground">Scope Level</label>
              <div className="flex gap-2">
                {(["global","workspace","own"] as ScopeLevel[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setInviteScope(s)}
                    className="flex-1 py-1.5 rounded text-[11px] font-semibold border capitalize transition-all"
                    style={{
                      borderColor: inviteScope === s ? "var(--color-lg-primary)" : "var(--color-border)",
                      background: inviteScope === s ? "var(--color-lg-primary)" : "transparent",
                      color: inviteScope === s ? "white" : "var(--color-muted-foreground)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {inviteScope === "workspace" && (
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-foreground">Workspace Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {WORKSPACE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setInviteTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])}
                      className="px-2 py-1 rounded text-[11px] font-medium border transition-all"
                      style={{
                        borderColor: inviteTags.includes(tag) ? "var(--color-lg-primary)" : "var(--color-border)",
                        background: inviteTags.includes(tag) ? "rgba(59,130,246,0.1)" : "transparent",
                        color: inviteTags.includes(tag) ? "var(--color-lg-primary)" : "var(--color-muted-foreground)",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              className="h-8 text-[12px]"
              disabled={!inviteName.trim() || !inviteEmail.trim()}
              onClick={sendInvite}
            >
              Send Invitation
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Role Drawer */}
      <Sheet open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <SheetContent side="right" className="w-[420px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b border-border">
            <SheetTitle className="text-[15px]">Edit Roles — {editUser?.full_name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role, editRoles, setEditRoles)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border transition-all"
                  style={{
                    borderColor: editRoles.includes(role) ? ROLE_COLORS[role] : "var(--color-border)",
                    background: editRoles.includes(role) ? `${ROLE_COLORS[role]}22` : "transparent",
                    color: editRoles.includes(role) ? ROLE_COLORS[role] : "var(--color-muted-foreground)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLORS[role] }} />
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            {editSodWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border text-[11px]" style={{ borderColor:"var(--color-lg-warning)", background:"var(--color-lg-warning-subtle)" }}>
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
                <span className="text-foreground">{w}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              SoD conflicts are flagged as warnings. Role assignment is not blocked — conflicts are enforced at action time.
            </p>
          </div>
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button className="h-8 text-[12px]" onClick={saveEditRoles}>Save Roles</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
