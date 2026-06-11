/**
 * SCREEN KEYS — typed constants for every screen in the LeaseGov platform.
 *
 * SOURCE OF TRUTH: SCREEN_REGISTRY_SPECIFICATION_V2.md (Part 4.1 and Part 6)
 *
 * RULES:
 * 1. Use these constants everywhere — never string literals for screen keys.
 * 2. The string values must exactly match ScreenDefinition.screen_key in the database.
 * 3. These values NEVER change after the database row is created.
 * 4. Adding a new screen: add a row here AND a row to the ScreenDefinition seed data.
 *
 * TOTAL: 63 defined screen keys (43 MVP · 20 Phase 2)
 * Phase 3 screen keys are added when those domains are activated.
 *
 * Feature Cluster groupings:
 *   FC-1  Document Pipeline         (MVP — 6 screens)
 *   FC-2  Extraction & Verification (MVP — 8 screens)
 *   FC-3  Contract Packages         (MVP — 3 screens)
 *   FC-4  Approval Workflow         (MVP — 5 screens)
 *   FC-5  Contract Records          (MVP — 4 screens, Phase 2 — 3 screens)
 *   FC-6  Reassessment              (Phase 2 — 14 screens)
 *   FC-7  Governed Export           (MVP — 4 screens)
 *   FC-8  Administration            (MVP — 6 screens, Phase 2 — 1 screen)
 *   FC-9  AI Agents & Automation    (Phase 2 — 2 screens)
 *   FC-10 Multi-Tenancy & Platform  (MVP — 7 screens)
 */

export const SCREEN_KEYS = {

  // ─── FC-1: DOCUMENT PIPELINE (MVP — 6 screens) ──────────────────────────────
  PIPELINE_DASHBOARD:           'pipeline-dashboard',
  PIPELINE_UPLOAD:              'pipeline-upload',
  PIPELINE_NEW_RECORD_MODAL:    'pipeline-new-record-modal',
  PIPELINE_VALIDATION:          'pipeline-validation',
  PIPELINE_REVIEW_GROUPING:     'pipeline-review-grouping',
  PIPELINE_SUBMIT_CONFIRM:      'pipeline-submit-confirm',

  // ─── FC-2: EXTRACTION AND VERIFICATION (MVP — 8 screens) ────────────────────
  EXTRACTION_QUEUE:             'extraction-processing-queue',
  EXTRACTION_UNDERSTANDING:     'extraction-document-understanding',
  EXTRACTION_STRATEGY:          'extraction-strategy',
  EXTRACTION_AI_WORKSPACE:      'extraction-ai-workspace',
  EXTRACTION_MANUAL_WORKSPACE:  'extraction-manual-workspace',
  EXTRACTION_VERIFICATION:      'extraction-verification',
  EXTRACTION_TRACKER:           'extraction-verification-tracker',
  EXTRACTION_REPROCESSING:      'extraction-reprocessing',

  // ─── FC-3: CONTRACT PACKAGES (MVP — 3 screens) ──────────────────────────────
  PACKAGES_COMPOSITION:         'packages-composition',
  PACKAGES_FLAGS:               'packages-flags',
  PACKAGES_REASSEMBLY:          'packages-reassembly',

  // ─── FC-4: APPROVAL WORKFLOW (MVP — 5 screens) ──────────────────────────────
  APPROVALS_QUEUE:              'approvals-queue',
  APPROVALS_REVIEW:             'approvals-review',
  APPROVALS_APPROVER:           'approvals-approver',
  APPROVALS_REWORK:             'approvals-rework',
  APPROVALS_RECALL:             'approvals-recall',

  // ─── FC-5: CONTRACT RECORDS (MVP — 4 screens) ───────────────────────────────
  RECORDS_DASHBOARD:            'records-dashboard',
  RECORDS_SEARCH:               'records-search',
  RECORDS_DETAIL:               'records-detail',
  RECORDS_ADD_DOCUMENT:         'records-add-document',

  // ─── FC-7: GOVERNED EXPORT (MVP — 4 screens) ────────────────────────────────
  EXPORT_TEMPLATE_SELECTION:    'export-template-selection',
  EXPORT_STAGING:               'export-staging',
  EXPORT_PREFLIGHT:             'export-preflight',
  EXPORT_UPLOAD_TASK:           'export-upload-task',

  // ─── FC-8: ADMINISTRATION (MVP — 6 screens) ─────────────────────────────────
  ADMIN_USERS:                  'admin-users',
  ADMIN_SCHEMA:                 'admin-schema',
  ADMIN_TEMPLATES:              'admin-templates',
  ADMIN_THRESHOLDS:             'admin-thresholds',
  ADMIN_AUDIT_LOG:              'admin-audit-log',
  ADMIN_NOTIFICATIONS:          'admin-notifications',

  // ─── FC-10: MULTI-TENANCY AND PLATFORM (MVP — 7 screens) ────────────────────
  PLATFORM_NOT_AUTHORIZED:      'platform-not-authorized',
  PLATFORM_ONBOARDING:          'platform-onboarding',
  SUPERADMIN_TENANT_LIST:       'superadmin-tenant-list',
  SUPERADMIN_TENANT_DETAIL:     'superadmin-tenant-detail',
  SUPERADMIN_SYSTEM_HEALTH:     'superadmin-system-health',
  SUPERADMIN_SUBSCRIPTIONS:     'superadmin-subscriptions',
  SUPERADMIN_SCREEN_REGISTRY:   'superadmin-screen-registry',

  // ─── FC-5: CONTRACT RECORDS (Phase 2 — 3 screens) ───────────────────────────
  RECORDS_DEFERRED_TRACKER:     'records-deferred-tracker',
  RECORDS_SNAPSHOT_VIEWER:      'records-snapshot-viewer',
  RECORDS_CORRECTION:           'records-correction',

  // ─── FC-6: REASSESSMENT (Phase 2 — 14 screens) ──────────────────────────────
  REASSESSMENT_DASHBOARD:       'reassessment-dashboard',
  REASSESSMENT_TRIGGER:         'reassessment-trigger',
  REASSESSMENT_SWEEP:           'reassessment-sweep',
  REASSESSMENT_CASE_LIST:       'reassessment-case-list',
  REASSESSMENT_CLASSIFICATION:  'reassessment-classification',
  REASSESSMENT_ASSESSMENT:      'reassessment-assessment',
  REASSESSMENT_ANALYSIS:        'reassessment-analysis',
  REASSESSMENT_MEMO:            'reassessment-memo',
  REASSESSMENT_PACKAGE_PREVIEW: 'reassessment-package-preview',
  REASSESSMENT_REMEDIATION:     'reassessment-remediation',
  REASSESSMENT_CONCURRENT_WARN: 'reassessment-concurrent-warning',
  REASSESSMENT_WATCHLIST:       'reassessment-watchlist',
  REASSESSMENT_SURVEY_INTAKE:   'reassessment-survey-intake',
  REASSESSMENT_PROJECT_VIEW:         'reassessment-contextual-project',
  REASSESSMENT_CONTEXTUAL_PROJECT:   'reassessment-contextual-project',

  // ─── FC-6: REASSESSMENT WORKFLOW SCREENS (workflows/ subfolder) ────────────────
  REASSESSMENT_UPDATE:               'reassessment-update',
  REASSESSMENT_REVIEW:               'reassessment-review',
  REASSESSMENT_APPROVAL:             'reassessment-approval',
  REASSESSMENT_ANALYSIS_WORKFLOW:    'reassessment-analysis-workflow',

  // ─── FC-8: ADMINISTRATION (Phase 2 — 1 screen) ──────────────────────────────
  ADMIN_AUTOMATION:             'admin-automation-config',

  // ─── FC-9: AI AGENTS AND AUTOMATION (Phase 2 — 2 screens) ──────────────────
  AGENT_CHECKPOINT_QUEUE:       'agent-checkpoint-queue',
  AGENT_ACTIVITY_MONITOR:       'agent-activity-monitor',

} as const

export type ScreenKey = typeof SCREEN_KEYS[keyof typeof SCREEN_KEYS]
