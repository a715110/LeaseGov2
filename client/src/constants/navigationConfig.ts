/**
 * Navigation configuration — sidebar nav items and route paths.
 *
 * Each nav item references a screenKey for ScreenGate access control.
 * Nav items are filtered by useScreenAccess before rendering.
 */
import { SCREEN_KEYS } from './screenKeys'
import type { ScreenKey } from './screenKeys'

export interface NavItem {
  label: string
  path: string
  screenKey: ScreenKey
  icon: string           // Lucide icon name
  group: NavGroup
  phase: 'mvp' | 'phase_2'
}

export type NavGroup =
  | 'portfolio'
  | 'property_lease'
  | 'equipment_lease'
  | 'service_contract'
  | 'documents'
  | 'surveys'
  | 'checkpoints'
  | 'reporting'
  | 'settings'
  | 'superadmin'

export const NAV_ITEMS: NavItem[] = [
  // Portfolio
  {
    label: 'Dashboard',
    path: '/portfolio',
    screenKey: SCREEN_KEYS.PORTFOLIO_DASHBOARD,
    icon: 'LayoutDashboard',
    group: 'portfolio',
    phase: 'mvp',
  },
  {
    label: 'Exception Queue',
    path: '/portfolio/exceptions',
    screenKey: SCREEN_KEYS.PORTFOLIO_EXCEPTION_QUEUE,
    icon: 'AlertTriangle',
    group: 'portfolio',
    phase: 'mvp',
  },
  {
    label: 'Workflow Summary',
    path: '/portfolio/workflows',
    screenKey: SCREEN_KEYS.PORTFOLIO_WORKFLOW_SUMMARY,
    icon: 'GitBranch',
    group: 'portfolio',
    phase: 'mvp',
  },

  // Property Lease
  {
    label: 'Property Leases',
    path: '/contracts/property-leases',
    screenKey: SCREEN_KEYS.PROPERTY_LEASE_LIST,
    icon: 'Building2',
    group: 'property_lease',
    phase: 'mvp',
  },

  // Documents
  {
    label: 'Document Library',
    path: '/documents',
    screenKey: SCREEN_KEYS.DOCUMENT_LIBRARY,
    icon: 'FileText',
    group: 'documents',
    phase: 'mvp',
  },

  // Surveys
  {
    label: 'Surveys',
    path: '/surveys',
    screenKey: SCREEN_KEYS.SURVEY_LIST,
    icon: 'ClipboardList',
    group: 'surveys',
    phase: 'mvp',
  },

  // Checkpoints
  {
    label: 'Checkpoints',
    path: '/checkpoints',
    screenKey: SCREEN_KEYS.CHECKPOINT_QUEUE,
    icon: 'CheckSquare',
    group: 'checkpoints',
    phase: 'mvp',
  },

  // Settings
  {
    label: 'Settings',
    path: '/settings/profile',
    screenKey: SCREEN_KEYS.SETTINGS_PROFILE,
    icon: 'Settings',
    group: 'settings',
    phase: 'mvp',
  },

  // SuperAdmin
  {
    label: 'Tenants',
    path: '/superadmin/tenants',
    screenKey: SCREEN_KEYS.SUPERADMIN_TENANT_LIST,
    icon: 'Users',
    group: 'superadmin',
    phase: 'mvp',
  },
  {
    label: 'System Health',
    path: '/superadmin/health',
    screenKey: SCREEN_KEYS.SUPERADMIN_SYSTEM_HEALTH,
    icon: 'Activity',
    group: 'superadmin',
    phase: 'mvp',
  },

  // Phase 2 — Equipment Lease
  {
    label: 'Equipment Leases',
    path: '/contracts/equipment-leases',
    screenKey: SCREEN_KEYS.EQUIPMENT_LEASE_LIST,
    icon: 'Package',
    group: 'equipment_lease',
    phase: 'phase_2',
  },

  // Phase 2 — Service Contracts
  {
    label: 'Service Contracts',
    path: '/contracts/service-contracts',
    screenKey: SCREEN_KEYS.SERVICE_CONTRACT_LIST,
    icon: 'Briefcase',
    group: 'service_contract',
    phase: 'phase_2',
  },

  // Phase 2 — Reporting
  {
    label: 'Portfolio Analytics',
    path: '/reporting/portfolio',
    screenKey: SCREEN_KEYS.REPORTING_PORTFOLIO_ANALYTICS,
    icon: 'BarChart2',
    group: 'reporting',
    phase: 'phase_2',
  },
  {
    label: 'Automation Efficiency',
    path: '/reporting/automation',
    screenKey: SCREEN_KEYS.REPORTING_AUTOMATION_EFFICIENCY,
    icon: 'Zap',
    group: 'reporting',
    phase: 'phase_2',
  },
]

export const ROUTE_PATHS: Record<string, string> = {
  portfolio:                  '/portfolio',
  portfolioExceptions:        '/portfolio/exceptions',
  portfolioWorkflows:         '/portfolio/workflows',
  propertyLeaseList:          '/contracts/property-leases',
  propertyLeaseRecord:        '/contracts/property-leases/:leaseId',
  documentLibrary:            '/documents',
  documentViewer:             '/documents/:documentId',
  surveyList:                 '/surveys',
  surveyDetail:               '/surveys/:surveyId',
  checkpointQueue:            '/checkpoints',
  checkpointDetail:           '/checkpoints/:checkpointId',
  notificationCentre:         '/notifications',
  settingsProfile:            '/settings/profile',
  settingsAutomation:         '/settings/automation',
  settingsNotifications:      '/settings/notifications',
  settingsAppearance:         '/settings/appearance',
  superadminTenants:          '/superadmin/tenants',
  superadminTenantDetail:     '/superadmin/tenants/:tenantId',
  superadminHealth:           '/superadmin/health',
  login:                      '/login',
  superadminLogin:            '/superadmin/login',
}
