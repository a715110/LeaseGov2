/**
 * AdminLayout — shared sub-navigation layout for FC-8 Administration
 * All admin screens wrap their content in this component.
 *
 * Sub-nav items: Users · Schema · Templates · Thresholds · Audit Log ·
 *   Appearance & Notifications · Automation Config (Phase 2 — greyed)
 * Role gate: visible to lease_admin and auditor only.
 * auditor sees all screens read-only (enforced per-screen, not here).
 */

import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Users, Database, FileSpreadsheet, SlidersHorizontal, ScrollText, Bell, Bot, ShieldOff } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Users",                   href: "/admin/users",         icon: Users,            phase2: false },
  { label: "Schema",                  href: "/admin/schema",        icon: Database,         phase2: false },
  { label: "Templates",               href: "/admin/templates",     icon: FileSpreadsheet,  phase2: false },
  { label: "Thresholds",              href: "/admin/thresholds",    icon: SlidersHorizontal,phase2: false },
  { label: "Audit Log",               href: "/admin/audit",         icon: ScrollText,       phase2: false },
  { label: "Appearance & Notifications",href: "/admin/notifications",icon: Bell,            phase2: false },
  { label: "Automation Config",       href: "/admin/automation",    icon: Bot,              phase2: true  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  screenKey?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { activeRole } = useRole();

  const allowed = activeRole === "lease_admin" || activeRole === "auditor";

  useEffect(() => {
    if (!allowed) {
      toast.warning("Access restricted", {
        description: "Administration screens require the Lease Admin or Auditor role. Switch roles in the demo switcher.",
        duration: 5000,
      });
      navigate("/pipeline/dashboard");
    }
  }, [allowed, navigate]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
        <ShieldOff className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      {/* Sub-nav */}
      <aside className="w-52 shrink-0 border-r border-border bg-card flex flex-col py-4">
        <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Administration</p>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.phase2 ? "#" : item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
                style={{
                  background: isActive ? "var(--color-lg-primary)" : "transparent",
                  color: item.phase2
                    ? "var(--color-muted-foreground)"
                    : isActive
                    ? "white"
                    : "var(--color-foreground)",
                  opacity: item.phase2 ? 0.5 : 1,
                  cursor: item.phase2 ? "not-allowed" : undefined,
                  pointerEvents: item.phase2 ? "none" : undefined,
                  textDecoration: "none",
                }}
                title={item.phase2 ? "Phase 2 — not yet available" : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
                {item.phase2 && (
                  <span className="ml-auto text-[9px] font-bold px-1 py-0.5 rounded bg-muted/40 text-muted-foreground">P2</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
