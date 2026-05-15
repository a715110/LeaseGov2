/**
 * AppShell — persistent sidebar layout for all authenticated screens.
 *
 * Design philosophy: Structured Authority
 * - Deep navy sidebar, constant across light/dark modes
 * - Clean content area with subtle border separation
 * - IBM Plex Sans typography
 * - Minimal, precise interactions
 *
 * Structure:
 * - Sidebar (fixed, 240px): logo + nav items + user section
 * - Main content area: header bar + page content
 *
 * Nav items are filtered by useScreenAccess before rendering.
 */
import React from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard, AlertTriangle, GitBranch, Building2,
  FileText, ClipboardList, CheckSquare, Settings, Users,
  Activity, Package, Briefcase, BarChart2, Zap,
  Bell, ChevronRight,
} from 'lucide-react'
import { ColorModeToggle } from './ColorModeToggle'
import { cn } from '../../lib/utils'
import type { NavItem } from '../../constants/navigationConfig'
import { NAV_ITEMS } from '../../constants/navigationConfig'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, AlertTriangle, GitBranch, Building2,
  FileText, ClipboardList, CheckSquare, Settings, Users,
  Activity, Package, Briefcase, BarChart2, Zap,
}

interface AppShellProps {
  children: React.ReactNode
  userRoles?: string[]
  organizationName?: string
  userDisplayName?: string
}

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = ICON_MAP[item.icon] ?? ChevronRight
  return (
    <Link href={item.path}>
      <a
        className={cn(
          'flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </a>
    </Link>
  )
}

const NAV_GROUP_LABELS: Record<string, string> = {
  portfolio:        'Portfolio',
  property_lease:   'Property Leases',
  equipment_lease:  'Equipment Leases',
  service_contract: 'Service Contracts',
  documents:        'Documents',
  surveys:          'Surveys',
  checkpoints:      'Checkpoints',
  reporting:        'Reporting',
  settings:         'Settings',
  superadmin:       'Administration',
}

export function AppShell({
  children,
  userRoles = [],
  organizationName = 'LeaseGov',
  userDisplayName = 'User',
}: AppShellProps) {
  const [location] = useLocation()

  // Filter to MVP phase items only for now (Phase 2 items hidden until registry enables them)
  const visibleItems = NAV_ITEMS.filter(item => item.phase === 'mvp')

  // Group items
  const groups = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="flex h-full w-60 shrink-0 flex-col overflow-y-auto"
        style={{ background: 'var(--sidebar)' }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4" style={{ borderColor: 'var(--sidebar-border)' }}>
          <Link href="/portfolio">
            <a className="flex items-center gap-2.5 no-underline">
              <div
                className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold"
                style={{ background: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
              >
                LG
              </div>
              <span
                className="text-sm font-semibold tracking-tight"
                style={{ color: 'var(--sidebar-foreground)' }}
              >
                {organizationName}
              </span>
            </a>
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 space-y-5 px-3 py-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p
                className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}
              >
                {NAV_GROUP_LABELS[group] ?? group}
              </p>
              <ul className="space-y-0.5" role="list">
                {items.map(item => (
                  <li key={item.screenKey}>
                    <SidebarNavItem
                      item={item}
                      isActive={location.startsWith(item.path)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div
          className="border-t px-3 py-3"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="flex items-center gap-2.5 rounded px-2 py-1.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' }}
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <span
              className="truncate text-xs font-medium"
              style={{ color: 'var(--sidebar-foreground)', opacity: 0.8 }}
            >
              {userDisplayName}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <div />
          <div className="flex items-center gap-3">
            <ColorModeToggle />
            <Link href="/notifications">
              <a
                className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
