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
 * - Sidebar (fixed, 240px expanded / 64px collapsed): logo + nav groups + user section
 * - Main content area: header bar (role switcher, theme picker, search, bell) + page content
 *
 * Sidebar features:
 * - Collapsible: 240px ↔ 64px icon-only, persisted to localStorage
 * - Role-aware: groups filtered by allowedRoles from navigationConfig
 * - Collapsible groups: expandedGroups state with auto-expand on route change
 * - Scroll active item into view on route change
 * - Tooltips on group icons when collapsed
 * - Badge counts on group headers (approvals unread, pipeline ready)
 *
 * Header features:
 * - Sidebar collapse toggle (Menu/X)
 * - Breadcrumb
 * - Global search placeholder
 * - Role switcher, theme/mode picker
 * - Notification bell → NotificationDrawer slide-in panel
 */
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Link, useLocation } from 'wouter'
import {
  UploadCloud, Scan, Layers, CheckCircle, Folder,
  CloudUpload, Settings, Shield, Bell, ChevronRight,
  RefreshCw, UserCog, ChevronDown, Bot, Play, Palette, Check,
  Sun, Moon, Menu, X, Search,
} from 'lucide-react'
import { Breadcrumb } from '../shared/Breadcrumb'
import { NotificationDrawer } from './NotificationDrawer'
import { cn } from '../../lib/utils'
import { NAV_GROUPS, ROUTE_PATHS } from '../../constants/navigationConfig'
import { useRole } from '../../contexts/RoleContext'
import { useDemoMode } from '../../contexts/DemoModeContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { usePipelineCounts } from '../../contexts/PipelineCountsContext'
import { useDevMode } from '../../contexts/DevModeContext'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import { Input } from '../ui/input'
import { toast } from 'sonner'

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

// ─── Demo badge counts per nav group (static for demo purposes) ───────────────
// In production these would come from API responses / context.
// GROUP_BADGE_COUNTS is now derived from PipelineCountsContext at runtime (see AppShell body)

interface AppShellProps {
  children: React.ReactNode
  userRoles?: string[]
  organizationName?: string
  userDisplayName?: string
}

// ─── Active route helper ──────────────────────────────────────────────────────
function isNavItemActive(location: string, itemPath: string): boolean {
  if (location === itemPath) return true
  const cleanLocation = location.split('?')[0]
  if (cleanLocation === itemPath) return true
  return cleanLocation.startsWith(itemPath + '/')
}

// ─── Role Switcher ────────────────────────────────────────────────────────────
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
            className={cn('text-xs cursor-pointer', activeRole === role && 'font-semibold text-primary')}
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
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: current.swatch }} aria-hidden="true" />
          <Palette className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <ModeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Colour Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.key}
            onSelect={() => setThemeKey(option.key)}
            className={cn('flex items-center gap-2.5 text-xs cursor-pointer', themeKey === option.key && 'font-semibold')}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-border" style={{ background: option.swatch }} aria-hidden="true" />
            <span className="flex-1">{option.label}</span>
            {themeKey === option.key && <Check className="h-3 w-3 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
        {canToggle && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Appearance
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div role="group" aria-label="Color mode" className="inline-flex w-full items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
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
                        isActive ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
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

// ─── Notification Bell button ─────────────────────────────────────────────────
interface NotificationBellProps {
  onClick: () => void
}
function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications()
  return (
    <button
      onClick={onClick}
      className="relative flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </button>
  )
}

// ─── Dev: Screen Number Toggle ──────────────────────────────────────────────────
function DevScreenToggle({ collapsed }: { collapsed: boolean }) {
  const { showScreenNumbers, toggleScreenNumbers } = useDevMode()
  return (
    <button
      onClick={toggleScreenNumbers}
      title={showScreenNumbers ? 'Hide screen numbers' : 'Show screen numbers'}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors mb-1',
        showScreenNumbers
          ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
          : 'text-white/40 hover:bg-white/10 hover:text-white/70',
        collapsed && 'justify-center px-0',
      )}
    >
      {/* Hash icon inline SVG — no extra import needed */}
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="5" y1="2" x2="4" y2="14" />
        <line x1="11" y1="2" x2="10" y2="14" />
        <line x1="2" y1="6" x2="14" y2="6" />
        <line x1="2" y1="10" x2="14" y2="10" />
      </svg>
      {!collapsed && (
        <span className="truncate font-mono text-[10px] tracking-wide">
          {showScreenNumbers ? 'Screen #s ON' : 'Screen #s OFF'}
        </span>
      )}
      {!collapsed && (
        <span
          className={cn(
            'ml-auto h-4 w-7 rounded-full transition-colors flex items-center px-0.5 shrink-0',
            showScreenNumbers ? 'bg-amber-400' : 'bg-white/20',
          )}
        >
          <span
            className={cn(
              'h-3 w-3 rounded-full bg-white transition-transform',
              showScreenNumbers ? 'translate-x-3' : 'translate-x-0',
            )}
          />
        </span>
      )}
    </button>
  )
}

// ─── Start Demo sidebar button ────────────────────────────────────────────────
function StartDemoButton() {
  const { isActive, startDemo } = useDemoMode()
  if (isActive) return null
  return (
    <button
      onClick={startDemo}
      className="mb-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors"
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

// ─── Group badge pill ─────────────────────────────────────────────────────────
function GroupBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-bold text-white"
      aria-label={`${count} items`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── Main AppShell ────────────────────────────────────────────────────────────
export default function AppShell({
  children,
  organizationName = 'LeaseGov',
  userDisplayName = 'User',
}: AppShellProps) {
  const [location] = useLocation()
  const { activeRole } = useRole()
  const { addNotification, unreadCount } = useNotifications()
  const { pipelineReadyCount, approvalsCount, extractionQueueCount } = usePipelineCounts()

  // ── Seed demo notifications once on mount ──
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    addNotification({ title: 'PKG-003 is ready for approval', severity: 'success', href: ROUTE_PATHS.approvalsQueue })
    addNotification({ title: 'Validation warning on Office-Tower-Amendment.pdf', body: 'Page 7 has a low-confidence extraction score. Manual review recommended.', severity: 'warning', href: ROUTE_PATHS.pipelineDashboard })
    addNotification({ title: '2 documents failed ingestion', body: 'Corrupted-Scan-Draft.pdf and one other file could not be processed.', severity: 'error', href: ROUTE_PATHS.pipelineDashboard })
    addNotification({ title: 'Scheduled export completed', body: 'Q1-2026 Retail export task finished successfully.', severity: 'info' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Notification drawer state ──
  const [notifOpen, setNotifOpen] = useState(false)

  // ── Sidebar collapse state (persisted + responsive) ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => {
      // Auto-collapse on narrow viewports regardless of persisted preference
      if (typeof window !== 'undefined' && window.innerWidth < 1024) return true
      return localStorage.getItem('leasegov_sidebar_collapsed') === 'true'
    }
  )
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('leasegov_sidebar_collapsed', String(next))
      return next
    })
  }, [])

  // Auto-collapse below 1024px, restore persisted state above 1024px
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Narrowing: force collapse without touching localStorage
        setSidebarCollapsed(true)
      } else {
        // Widening: restore persisted preference
        setSidebarCollapsed(localStorage.getItem('leasegov_sidebar_collapsed') === 'true')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Build visible, ordered groups ──
  const visibleItems = STATIC_NAV.filter(item => item.phase === 'mvp')
  const grouped = visibleItems.reduce<Record<string, StaticNavEntry[]>>((acc, item) => {
    if (!acc[item.navGroup]) acc[item.navGroup] = []
    acc[item.navGroup].push(item)
    return acc
  }, {})

  const orderedGroups = NAV_GROUPS
    .filter(g => {
      if (g.phase !== 'mvp') return false
      if (!grouped[g.key]) return false
      if (!g.allowedRoles) return true
      return g.allowedRoles.includes(activeRole)
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // ── Expanded groups state ──
  const defaultOpen = new Set(orderedGroups.slice(0, 2).map(g => g.key))
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(defaultOpen)

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Auto-expand group containing current route ──
  useEffect(() => {
    const activeGroup = orderedGroups.find(g =>
      (grouped[g.key] ?? []).some(item => isNavItemActive(location, item.path))
    )
    if (activeGroup) {
      setExpandedGroups(prev => {
        if (prev.has(activeGroup.key)) return prev
        const next = new Set(prev)
        next.add(activeGroup.key)
        return next
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // ── Scroll active nav item into view ──
  const activeNavRef = useRef<HTMLAnchorElement | null>(null)
  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'flex h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
        style={{ background: 'var(--sidebar)' }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className={cn('flex h-14 items-center border-b shrink-0', sidebarCollapsed ? 'justify-center px-0' : 'px-4')}
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          {sidebarCollapsed ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold"
              style={{ background: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
            >
              LG
            </div>
          ) : (
            <Link href="/pipeline/dashboard" className="flex items-center gap-2.5 no-underline">
              <div
                className="flex h-7 w-7 items-center justify-center rounded text-xs font-bold shrink-0"
                style={{ background: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
              >
                LG
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--sidebar-foreground)' }}>
                {organizationName}
              </span>
            </Link>
          )}
        </div>

        {/* Nav groups */}
        <nav className={cn('flex-1 space-y-1 py-3', sidebarCollapsed ? 'px-2' : 'px-3')}>
          {orderedGroups.map(group => {
            const Icon = ICON_MAP[group.icon] ?? ChevronRight
            const items = grouped[group.key] ?? []
            const isExpanded = expandedGroups.has(group.key)
            const hasActiveChild = items.some(item => isNavItemActive(location, item.path))
            const badgeCount = (
              group.key === 'approvals' ? approvalsCount
              : group.key === 'document-pipeline' ? pipelineReadyCount
              : group.key === 'extraction' ? extractionQueueCount
              : 0
            )

            return (
              <div key={group.key} className="mb-1">
                {/* Group header */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !sidebarCollapsed && toggleGroup(group.key)}
                      className={cn(
                        'w-full flex items-center rounded-md transition-colors duration-150',
                        sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-2 px-2 py-1.5',
                        hasActiveChild
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/8'
                      )}
                      aria-expanded={!sidebarCollapsed ? isExpanded : undefined}
                    >
                      {/* Icon — with badge dot when collapsed */}
                      <span className="relative flex-shrink-0">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {sidebarCollapsed && badgeCount > 0 && (
                          <span
                            className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white"
                            aria-hidden="true"
                          >
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left font-semibold text-[10px] uppercase tracking-widest truncate">
                            {group.label}
                          </span>
                          <GroupBadge count={badgeCount} />
                          {isExpanded
                            ? <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                            : <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
                          }
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right" className="text-xs">
                      {group.label}
                      {badgeCount > 0 && ` (${badgeCount})`}
                    </TooltipContent>
                  )}
                </Tooltip>

                {/* Nav items — only when expanded and not collapsed */}
                {!sidebarCollapsed && isExpanded && (
                  <ul
                    className="mt-0.5 space-y-0.5 ml-4 border-l pl-2.5"
                    style={{ borderColor: 'rgba(255,255,255,0.10)' }}
                    role="list"
                  >
                    {items.map(item => {
                      const active = isNavItemActive(location, item.path)
                      return (
                        <li key={item.path}>
                          <Link
                            href={item.path}
                            ref={active ? (activeNavRef as React.Ref<HTMLAnchorElement>) : undefined}
                            className={cn(
                              'block rounded px-2 py-1.5 text-xs transition-colors duration-150 no-underline',
                              active
                                ? 'text-white font-semibold -ml-[13px] pl-[15px] border-l-2 border-sky-400'
                                : 'text-white/55 hover:text-white hover:bg-white/10'
                            )}
                            style={active ? { background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.10)' } : undefined}
                            aria-current={active ? 'page' : undefined}
                          >
                            {item.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div
          className={cn('border-t shrink-0', sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3')}
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          {!sidebarCollapsed && <StartDemoButton />}
          {/* DEV ONLY: Screen number toggle */}
          <DevScreenToggle collapsed={sidebarCollapsed} />
          <div className={cn('flex items-center gap-2.5 rounded px-2 py-1.5', sidebarCollapsed && 'justify-center px-0')}>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' }}
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <span className="truncate text-xs font-medium" style={{ color: 'var(--sidebar-foreground)', opacity: 0.8 }}>
                {userDisplayName}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 gap-3">
          {/* Left: collapse toggle + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleSidebar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
            <Breadcrumb />
          </div>

          {/* Centre: global search placeholder */}
          <div className="relative hidden md:flex items-center w-56 shrink-0">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search…"
              className="pl-8 h-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
              onClick={() => toast.info('Global search coming soon')}
              readOnly
            />
          </div>

          {/* Right: role switcher + appearance picker + notifications */}
          <div className="flex items-center gap-2 shrink-0">
            <RoleSwitcher />
            <ThemePicker />
            <NotificationBell onClick={() => setNotifOpen(true)} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Notification drawer (portal-style, outside main scroll) ── */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}
