/**
 * Navigation configuration — sidebar nav groups and items.
 *
 * SOURCE OF TRUTH: SCREEN_REGISTRY_SPECIFICATION_V2.md Part 4.5 (Dynamic Navigation Pattern)
 *
 * Nav groups match the nav_group values in the ScreenDefinition table.
 * The sidebar is built dynamically from the screen registry response —
 * never from a hardcoded visible list. This config defines the group
 * metadata (label, icon, sort order) only.
 *
 * Nav items with nav_label = null in the registry are modal/overlay screens
 * and are never shown in the sidebar.
 */
import { SCREEN_KEYS } from './screenKeys'
import type { ScreenKey } from './screenKeys'
import type { UserRole } from '../lib/types'

// ─── Nav Group Metadata ───────────────────────────────────────────────────────
// Matches nav_group values in ScreenDefinition.
// Used by AppShell to render group headers and icons.

export interface NavGroupConfig {
  key: string
  label: string
  icon: string   // Lucide icon name
  sortOrder: number
  phase: 'mvp' | 'phase_2'
  /** If omitted the group is visible to all roles */
  allowedRoles?: UserRole[]
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    key: 'document-pipeline', label: 'Document Pipeline', icon: 'UploadCloud', sortOrder: 1, phase: 'mvp',
    allowedRoles: ['document_submitter', 'auditor', 'lease_admin'],
  },
  {
    key: 'extraction', label: 'Extraction', icon: 'Scan', sortOrder: 2, phase: 'mvp',
    allowedRoles: ['preparer', 'reviewer', 'auditor', 'lease_admin'],
  },
  {
    key: 'packages', label: 'Packages', icon: 'Layers', sortOrder: 3, phase: 'mvp',
    allowedRoles: ['preparer', 'reviewer', 'approver', 'auditor', 'lease_admin'],
  },
  {
    key: 'approvals', label: 'Approvals', icon: 'CheckCircle', sortOrder: 4, phase: 'mvp',
    allowedRoles: ['preparer', 'reviewer', 'approver', 'auditor', 'lease_admin'],
  },
  {
    key: 'records', label: 'Records', icon: 'Folder', sortOrder: 5, phase: 'mvp',
    allowedRoles: ['preparer', 'reviewer', 'approver', 'accountant', 'controller', 'auditor', 'lease_admin'],
  },
  {
    key: 'export', label: 'Governed Export', icon: 'CloudUpload', sortOrder: 6, phase: 'mvp',
    allowedRoles: ['controller', 'auditor', 'lease_admin'],
  },
  {
    key: 'admin', label: 'Admin', icon: 'Settings', sortOrder: 7, phase: 'mvp',
    allowedRoles: ['lease_admin'],
  },
  {
    key: 'reassessment', label: 'Reassessment', icon: 'RefreshCw', sortOrder: 8, phase: 'mvp',
    allowedRoles: ['preparer', 'reviewer', 'approver', 'accountant', 'controller', 'auditor', 'lease_admin'],
  },
  {
    key: 'agents', label: 'Agents', icon: 'Bot', sortOrder: 9, phase: 'mvp',
    allowedRoles: ['lease_admin', 'auditor'],
  },
  {
    key: 'superadmin', label: 'SuperAdmin', icon: 'Shield', sortOrder: 10, phase: 'mvp',
    // Only visible when the demo role is set to super_admin
    allowedRoles: ['super_admin'],
  },
]

// ─── Static Nav Item Type ─────────────────────────────────────────────────────
// Used only for nav items that are NOT driven by the screen registry
// (e.g. logout, help). All screen-driven nav items come from the registry.

export interface StaticNavItem {
  label: string
  path: string
  screenKey: ScreenKey
  icon: string
  navGroup: string
  phase: 'mvp' | 'phase_2'
}

// ─── Route Paths ─────────────────────────────────────────────────────────────
// Canonical route paths keyed by screen key constant name.
// Use these instead of hardcoding paths in components.

export const ROUTE_PATHS: Record<string, string> = {
  // FC-1: Document Pipeline
  pipelineDashboard:        '/pipeline/dashboard',
  pipelineUpload:           '/pipeline/upload',
  pipelineNewRecord:        '/pipeline/new-record',
  pipelineValidation:       '/pipeline/validation',
  pipelineReview:           '/pipeline/review',
  // pipelineConfirm removed in V3 — BATCH_SUBMITTED fires from pipelineReview

  // FC-2: Extraction and Verification
  extractionQueue:          '/extraction/queue',
  extractionUnderstanding:  '/extraction/understanding',
  extractionStrategy:       '/extraction/strategy',
  extractionAi:             '/extraction/ai',
  extractionManual:         '/extraction/manual',
  extractionVerify:         '/extraction/verify',
  extractionTracker:        '/extraction/tracker',
  extractionReprocess:      '/extraction/reprocess',

  // FC-3: Contract Packages
  packagesComposition:      '/packages/:contractId',
  packagesFlags:            '/packages/:packageId/flags',
  packagesReassembly:       '/packages/:packageId/reassembly',

  // FC-4: Approval Workflow
  approvalsQueue:           '/approvals/queue',
  approvalsReview:          '/approvals/review',
  approvalsFinal:           '/approvals/final',
  approvalsRework:          '/approvals/rework',
  approvalsRecall:          '/approvals/recall',

  // FC-5: Contract Records
  recordsDashboard:         '/records/dashboard',
  records:                  '/records',
  recordsDetail:            '/records/:id',
  recordsAddDocument:       '/records/:id/add-document',
  recordsDeferred:          '/records/:id/deferred',
  recordsSnapshots:         '/records/:id/snapshots',
  recordsCorrection:        '/records/:id/correction',

  // FC-7: Governed Export
  exportTemplates:          '/export/templates',
  exportStaging:            '/export/staging',
  exportPreflight:          '/export/preflight',
  exportTasks:              '/export/tasks/:id',

  // FC-8: Administration
  adminUsers:               '/admin/users',
  adminSchema:              '/admin/schema',
  adminTemplates:           '/admin/templates',
  adminThresholds:          '/admin/thresholds',
  adminAudit:               '/admin/audit',
  adminNotifications:       '/admin/notifications',
  adminAutomation:          '/admin/automation',

  // FC-10: Platform
  notAuthorized:            '/not-authorized',
  onboardingOrganization:   '/onboarding/organization',
  onboardingAdminUser:      '/onboarding/admin-user',
  onboardingTheme:          '/onboarding/theme-automation',
  onboardingWorkflow:       '/onboarding/workflow-templates',
  onboardingComplete:       '/onboarding/complete',
  superadminTenants:        '/superadmin/tenants',
  superadminTenantDetail:   '/superadmin/tenants/:id',
  superadminHealth:         '/superadmin/health',
  superadminSubscriptions:  '/superadmin/subscriptions',
  superadminScreenRegistry: '/superadmin/screen-registry',

  // FC-6: Reassessment (Phase 2)
  reassessmentDashboard:    '/reassessment/dashboard',
  reassessmentTrigger:      '/reassessment/trigger',
  reassessmentSweep:        '/reassessment/sweep',
  reassessmentCases:        '/reassessment/cases',
  reassessmentClassify:     '/reassessment/cases/:id/classify',
  reassessmentAssess:       '/reassessment/cases/:id/assess',
  reassessmentAnalysis:     '/reassessment/cases/:id/analysis',
  reassessmentMemo:         '/reassessment/cases/:id/memo',
  reassessmentPackage:      '/reassessment/cases/:id/package',
  reassessmentRemediation:  '/reassessment/cases/:id/remediation',
  reassessmentConcurrent:   '/reassessment/concurrent',
  reassessmentWatchlist:    '/reassessment/watchlist',
  reassessmentSurveys:      '/reassessment/surveys',
  reassessmentProjects:     '/reassessment/projects/:id',

  // FC-9: AI Agents (Phase 2)
  agentCheckpoints:         '/approvals/checkpoints',
  agentMonitor:             '/agents/monitor',
}

// Silence unused import warning — SCREEN_KEYS is used by consumers of this file
export { SCREEN_KEYS }
