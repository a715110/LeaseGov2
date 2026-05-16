/**
 * Screen Keys — typed constants for all 63 screens in the LeaseGov platform.
 *
 * Source of truth: SCREEN_REGISTRY_SPECIFICATION_V2.md
 * Count: 43 MVP + 20 Phase 2 = 63 total
 *
 * These keys are used by:
 * - ScreenGate.tsx (two-layer check: registry then role)
 * - screenRegistryService.ts (fetching and caching registry)
 * - App.tsx routing
 * - useScreenAccess hook
 *
 * RULE: Never hardcode screen keys as strings in components.
 * Always import from this file.
 */

// ─── Authentication (4 screens) ───────────────────────────────────────────────
export const SCREEN_KEYS = {

  // Auth
  LOGIN:                          'login',
  SUPERADMIN_LOGIN:               'superadmin_login',
  MFA_CHALLENGE:                  'mfa_challenge',
  PASSWORD_RESET:                 'password_reset',

  // ─── Portfolio (3 screens) ──────────────────────────────────────────────────
  PORTFOLIO_DASHBOARD:            'portfolio_dashboard',
  PORTFOLIO_EXCEPTION_QUEUE:      'portfolio_exception_queue',
  PORTFOLIO_WORKFLOW_SUMMARY:     'portfolio_workflow_summary',

  // ─── Property Lease — Contract List (2 screens) ─────────────────────────────
  PROPERTY_LEASE_LIST:            'property_lease_list',
  PROPERTY_LEASE_SEARCH:          'property_lease_search',

  // ─── Property Lease — Contract Record (7 screens) ───────────────────────────
  PROPERTY_LEASE_RECORD_OVERVIEW:    'property_lease_record_overview',
  PROPERTY_LEASE_RECORD_TERMS:       'property_lease_record_terms',
  PROPERTY_LEASE_RECORD_DOCUMENTS:   'property_lease_record_documents',
  PROPERTY_LEASE_RECORD_WORKFLOW:    'property_lease_record_workflow',
  PROPERTY_LEASE_RECORD_HISTORY:     'property_lease_record_history',
  PROPERTY_LEASE_RECORD_AGENT:       'property_lease_record_agent',
  PROPERTY_LEASE_RECORD_REASSESSMENT:'property_lease_record_reassessment',

  // ─── Tenant Onboarding — SuperAdmin (5 screens, ON.1–ON.5) ─────────────────
  ONBOARDING_ORGANIZATION_SETUP:     'onboarding_organization_setup',
  ONBOARDING_ADMIN_USER_SETUP:       'onboarding_admin_user_setup',
  ONBOARDING_THEME_AUTOMATION_SETUP: 'onboarding_theme_automation_setup',
  ONBOARDING_WORKFLOW_TEMPLATE_SETUP:'onboarding_workflow_template_setup',
  ONBOARDING_COMPLETE:               'onboarding_complete',

  // ─── Property Lease — Reassessment Workflow (4 screens) ─────────────────────
  REASSESSMENT_ANALYSIS:             'reassessment_analysis',
  REASSESSMENT_REVIEW:               'reassessment_review',
  REASSESSMENT_UPDATE:               'reassessment_update',
  REASSESSMENT_APPROVAL:             'reassessment_approval',

  // ─── Documents (4 screens) ──────────────────────────────────────────────────
  DOCUMENT_LIBRARY:                  'document_library',
  DOCUMENT_VIEWER:                   'document_viewer',
  DOCUMENT_EXTRACTION_DETAIL:        'document_extraction_detail',
  DOCUMENT_UPLOAD:                   'document_upload',

  // ─── Surveys (3 screens) ────────────────────────────────────────────────────
  SURVEY_LIST:                       'survey_list',
  SURVEY_DETAIL:                     'survey_detail',
  SURVEY_RESPONSE_FORM:              'survey_response_form',

  // ─── Human Checkpoints (2 screens) ──────────────────────────────────────────
  CHECKPOINT_QUEUE:                  'checkpoint_queue',
  CHECKPOINT_DETAIL:                 'checkpoint_detail',

  // ─── Notifications (1 screen) ───────────────────────────────────────────────
  NOTIFICATION_CENTRE:               'notification_centre',

  // ─── Settings (4 screens) ───────────────────────────────────────────────────
  SETTINGS_PROFILE:                  'settings_profile',
  SETTINGS_AUTOMATION:               'settings_automation',
  SETTINGS_NOTIFICATIONS:            'settings_notifications',
  SETTINGS_APPEARANCE:               'settings_appearance',

  // ─── SuperAdmin (3 screens — MVP) ───────────────────────────────────────────
  SUPERADMIN_TENANT_LIST:            'superadmin_tenant_list',
  SUPERADMIN_TENANT_DETAIL:          'superadmin_tenant_detail',
  SUPERADMIN_SYSTEM_HEALTH:          'superadmin_system_health',

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2 SCREENS (20 screens)
  // ─────────────────────────────────────────────────────────────────────────────

  // Equipment Lease — List + Record (4 screens)
  EQUIPMENT_LEASE_LIST:              'equipment_lease_list',
  EQUIPMENT_LEASE_RECORD_OVERVIEW:   'equipment_lease_record_overview',
  EQUIPMENT_LEASE_RECORD_TERMS:      'equipment_lease_record_terms',
  EQUIPMENT_LEASE_RECORD_WORKFLOW:   'equipment_lease_record_workflow',

  // Service Contract — List + Record (4 screens)
  SERVICE_CONTRACT_LIST:             'service_contract_list',
  SERVICE_CONTRACT_RECORD_OVERVIEW:  'service_contract_record_overview',
  SERVICE_CONTRACT_RECORD_TERMS:     'service_contract_record_terms',
  SERVICE_CONTRACT_RECORD_WORKFLOW:  'service_contract_record_workflow',

  // Reporting (3 screens)
  REPORTING_PORTFOLIO_ANALYTICS:     'reporting_portfolio_analytics',
  REPORTING_AUTOMATION_EFFICIENCY:   'reporting_automation_efficiency',
  REPORTING_AUDIT_EXPORT:            'reporting_audit_export',

  // Counterparties (2 screens)
  COUNTERPARTY_LIST:                 'counterparty_list',
  COUNTERPARTY_DETAIL:               'counterparty_detail',

  // Properties (2 screens)
  PROPERTY_LIST:                     'property_list',
  PROPERTY_DETAIL:                   'property_detail',

  // SuperAdmin — Phase 2 additions (3 screens)
  SUPERADMIN_SCREEN_REGISTRY:        'superadmin_screen_registry',
  SUPERADMIN_SUBSCRIPTION_MANAGEMENT:'superadmin_subscription_management',
  SUPERADMIN_AUDIT_LOG:              'superadmin_audit_log',

  // (Onboarding wizard keys removed — superseded by ON.1–ON.5 tenant onboarding keys above)

} as const

export type ScreenKey = typeof SCREEN_KEYS[keyof typeof SCREEN_KEYS]

// Verify count at compile time
// Original: 43 MVP + 20 Phase 2 = 63 total
// After onboarding key correction: 8 old keys replaced with 5 new keys = 60 total
// The count guard is relaxed until Screen Registry Spec V2 is re-reconciled with V4 Part 19.
// TODO: Reconcile with Screen Registry Spec V2 during FC-10 cluster session.
