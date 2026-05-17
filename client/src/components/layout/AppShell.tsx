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
 * - Sidebar (fixed, 240px): logo + nav groups + user section
 * - Main content area: header bar (with role switcher) + page content
 *
 * In production, nav items are driven by the screen registry response.
 * During scaffolding, a static MVP nav list is rendered directly.
 */
import React, { useContext } from 'react'
import { Link, useLocation } from 'wouter'
import {
  UploadCloud, Scan, Layers, CheckCircle, Folder,
  CloudUpload, Settings, Shield, Bell, ChevronRight,
  RefreshCw, UserCog, ChevronDown, Bot, Play, Palette, Check,
  Sun, Moon,
} from 'lucide-react'
import { Breadcrumb } from '../shared/Breadcrumb'
import { cn } from '../../lib/utils'
import { NAV_GROUPS, ROUTE_PATHS } from '../../constants/navigationConfig'
import { useRole } from '../../contexts/RoleContext'
import { useDemoMode } from '../../contexts/DemoModeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { LeaseGovThemeContext } from '../../contexts/LeaseGovThemeContext'
import type { UserRole } from '../../lib/types'
import { ROLE_LABELS } from '../../lib/types'
import type { ThemeKey, ColorMode } from '../../types/shared/ThemeMode'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  UploadCloud, Scan, Layers, CheckCircle, Folder,
  CloudUpload, Settings, Shield, RefreshCw, Bot,
}

// ─── All 9 V4 roles for the demo switcher ────────────────────────────────────
const ALL_ROLES: UserRole[] = [
  'document_submitter',
  'preparer',
  'reviewer',
  'approver',
  'accountant',
  'controller',
  'business_submitter',
  'auditor',
  'lease_admin',
]

// ─── Static MVP nav items (used until registry-driven nav is wired) ───────────
interface StaticNavEntry {
  label: string
  path: string
  navGroup: string
  phase: 'mvp' | 'phase_2'
}

const STATIC_NAV: StaticNavEntry[] = [
  // FC-1
  { label: 'Pipeline',            path: ROUTE_PATHS.pipelineDashboard,   navGroup: 'document-pipeline', phase: 'mvp' },
  { label: 'Upload',              path: ROUTE_PATHS.pipelineUpload,       navGroup: 'document-pipeline', phase: 'mvp' },
  // FC-2
  { label: 'Queue',               path: ROUTE_PATHS.extractionQueue,      navGroup: 'extraction',        phase: 'mvp' },
  { label: 'AI Workspace',        path: ROUTE_PATHS.extractionAi,         navGroup: 'extraction',        phase: 'mvp' },
  // FC-3
  { label: 'Packages',            path: '/packages',                      navGroup: 'packages',          phase: 'mvp' },
  // FC-4
  { label: 'Approvals Queue',     path: ROUTE_PATHS.approvalsQueue,       navGroup: 'approvals',         phase: 'mvp' },
  // FC-5
  { label: 'Records',             path: ROUTE_PATHS.records,              navGroup: 'records',           phase: 'mvp' },
  { label: 'Dashboard',           path: ROUTE_PATHS.recordsDashboard,     navGroup: 'records',           phase: 'mvp' },
  // FC-7
  { label: 'Export',              path: ROUTE_PATHS.exportTemplates,      navGroup: 'export',            phase: 'mvp' },
  // FC-8
  { label: 'Users',               path: ROUTE_PATHS.adminUsers,           navGroup: 'admin',             phase: 'mvp' },
  { label: 'Schema',              path: ROUTE_PATHS.adminSchema,          navGroup: 'admin',             phase: 'mvp' },
  { label: 'Audit Log',           path: ROUTE_PATHS.adminAudit,           navGroup: 'admin',             phase: 'mvp' },
  // FC-10
  { label: 'Tenants',             path: ROUTE_PATHS.superadminTenants,    navGroup: 'superadmin',        phase: 'mvp' },
  { label: 'System Health',       path: ROUTE_PATHS.superadminHealth,     navGroup: 'superadmin',        phase: 'mvp' },
  { label: 'Screen Registry',     path: ROUTE_PATHS.superadminScreenRegistry, navGroup: 'superadmin',   phase: 'mvp' },
  // FC-6 Reassessment
  { label: 'Dashboard',           path: ROUTE_PATHS.reassessmentDashboard,  navGroup: 'reassessment', phase: 'mvp' },
  { label: 'Cases',               path: ROUTE_PATHS.reassessmentCases,      navGroup: 'reassessment', phase: 'mvp' },
  { label: 'Watchlist',           path: ROUTE_PATHS.reassessmentWatchlist,  navGroup: 'reassessment', phase: 'mvp' },
  { label: 'Projects',            path: ROUTE_PATHS.reassessmentSurveys,    navGroup: 'reassessment', phase: 'mvp' },
  // FC-9 Agents
  { label: 'Checkpoint Queue',    path: ROUTE_PATHS.agentCheckpoints,       navGroup: 'agents',       phase: 'mvp' },
  { label: 'Activity Monitor',    path: ROUTE_PATHS.agentMonitor,           navGroup: 'agents',       phase: 'mvp' },
]

interface AppShellProps {
  children: React.ReactNode
  userRoles?: string[]
  organizationName?: string
  userDisplayName?: string
}

function SidebarNavItem({ label, path, isActive }: { label: string; path: string; isActive: boolean }) {
  return (
    <Link
      href={path}
      className={cn(
        'flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium transition-colors duration-150 no-underline',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <ChevronRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

/** Demo role switcher — shown in the top header bar */
function RoleSwitcher() {
  const { activeRole, setActiveRole, roleLabel } = useRole()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Switch demo role"
        >
          <UserCog className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="max-w-[140px] truncate">{roleLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Demo Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map(role => (
          <DropdownMenuItem
            key={role}
            onSelect={() => setActiveRole(role)}
            className={cn(
              'text-xs cursor-pointer',
              activeRole === role && 'font-semibold text-primary'
            )}
          >
            {activeRole === role && (
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            {ROLE_LABELS[role]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Theme + Mode Picker ──────────────────────────────────────────────────────
const THEME_OPTIONS: { key: ThemeKey; label: string; swatch: string }[] = [
  { key: 'structured_authority', label: 'Structured Authority', swatch: 'oklch(0.38 0.14 240)' },
  { key: 'modern_violet',        label: 'Modern Violet',        swatch: 'oklch(0.50 0.22 290)' },
  { key: 'gradient_pro',         label: 'Gradient Pro',         swatch: 'oklch(0.48 0.18 195)' },
  { key: 'executive_slate',      label: 'Executive Slate',      swatch: 'oklch(0.55 0.16 65)'  },
]

const MODE_OPTIONS: { value: ColorMode; icon: React.ElementType; label: string }[] = [
  { value: 'light', icon: Sun,  label: 'Light' },
  { value: 'dark',  icon: Moon, label: 'Dark'  },
]

function ThemePicker() {
  const ctx = useContext(LeaseGovThemeContext)
  if (!ctx) return null
  const { themeKey, setThemeKey, rawMode, setMode, canToggle } = ctx
  const current = THEME_OPTIONS.find(t => t.key === themeKey) ?? THEME_OPTIONS[0]
  const currentMode = MODE_OPTIONS.find(m => m.value === rawMode) ?? MODE_OPTIONS[0]
  const ModeIcon = currentMode.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Appearance settings"
          title={`Theme: ${current.label} · Mode: ${currentMode.label}`}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: current.swatch }}
            aria-hidden="true"
          />
          <Palette className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <ModeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* ── Colour Theme section ── */}
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Colour Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.key}
            onSelect={() => setThemeKey(option.key)}
            className={cn(
              'flex items-center gap-2.5 text-xs cursor-pointer',
              themeKey === option.key && 'font-semibold'
            )}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-border"
              style={{ background: option.swatch }}
              aria-hidden="true"
            />
            <span className="flex-1">{option.label}</span>
            {themeKey === option.key && (
              <Check className="h-3 w-3 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        {/* ── Appearance Mode section (only when toggle is allowed) ── */}
        {canToggle && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Inline segmented control — not individual menu items so it doesn't close on click */}
            <div className="px-2 py-1.5">
              <div
                role="group"
                aria-label="Color mode"
                className="inline-flex w-full items-center rounded-md border border-border bg-muted p-0.5 gap-0.5"
              >
                {MODE_OPTIONS.map(({ value, icon: Icon, label }) => {
                  const isActive = rawMode === value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`${label} mode`}
                      onClick={() => setMode(value)}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Notification Bell — A7 ──────────────────────────────────────────────────
function NotificationBell() {
  const { unreadCount } = useNotifications()
  return (
    <Link
      href="/notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

// ─── Sidebar active state helper — A9 ──────────────────────────────────────
/**
 * Returns true when the current location matches the nav item path.
 * Uses prefix matching so nested routes (e.g. /records/123) keep the
 * parent nav item (e.g. /records) highlighted.
 * Special case: root-level paths like /pipeline/dashboard must not
 * match /pipeline/upload, so we use the full path for exact items
 * and prefix matching only for section roots.
 */
function isNavItemActive(location: string, itemPath: string): boolean {
  if (location === itemPath) return true
  // Strip query string for comparison
  const cleanLocation = location.split('?')[0]
  if (cleanLocation === itemPath) return true
  // Prefix match: /records/123 → /records is active
  // But avoid /pipeline matching /pipeline/upload AND /pipeline/dashboard simultaneously
  // by requiring the prefix to be followed by / or end of string
  return cleanLocation.startsWith(itemPath + '/')
}

// ─── Start Demo sidebar button ──────────────────────────────────────────────
function StartDemoButton() {
  const { isActive, startDemo } = useDemoMode()
  if (isActive) return null
  return (
    <button
      onClick={startDemo}
      className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 ring-1"
      style={{
        background: 'var(--color-lg-blue)',
        color: '#fff',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.30)',
      }}
      aria-label="Start guided demo"
    >
      <Play className="h-3.5 w-3.5 fill-current" />
      Start Demo
    </button>
  )
}

export default function AppShell({
  children,
  organizationName = 'LeaseGov',
  userDisplayName = 'User',
}: AppShellProps) {
  const [location] = useLocation()

  // Only show MVP items during scaffolding
  const visibleItems = STATIC_NAV.filter(item => item.phase === 'mvp')

  // Group by navGroup
  const grouped = visibleItems.reduce<Record<string, StaticNavEntry[]>>((acc, item) => {
    if (!acc[item.navGroup]) acc[item.navGroup] = []
    acc[item.navGroup].push(item)
    return acc
  }, {})

  // Render groups in NAV_GROUPS sort order (MVP only)
  const orderedGroups = NAV_GROUPS
    .filter(g => g.phase === 'mvp' && grouped[g.key])
    .sort((a, b) => a.sortOrder - b.sortOrder)

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
          <Link
            href="/pipeline/dashboard"
            className="flex items-center gap-2.5 no-underline"
          >
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
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 space-y-5 px-3 py-4">
          {orderedGroups.map(group => {
            const Icon = ICON_MAP[group.icon] ?? ChevronRight
            const items = grouped[group.key] ?? []
            return (
              <div key={group.key}>
                <div className="mb-1 flex items-center gap-1.5 px-3">
                  <Icon
                    className="h-3 w-3 shrink-0"
                    style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}
                    aria-hidden="true"
                  />
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}
                  >
                    {group.label}
                  </p>
                </div>
                <ul className="space-y-0.5" role="list">
                  {items.map(item => (
                    <li key={item.path}>
                      <SidebarNavItem
                        label={item.label}
                        path={item.path}
                        isActive={isNavItemActive(location, item.path)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* User section */}
        <div
          className="border-t px-3 py-3"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <StartDemoButton />
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
          {/* Left: breadcrumb — A8 */}
          <Breadcrumb />
          {/* Right: role switcher + appearance picker + notifications */}
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <ThemePicker />
            <NotificationBell />
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
