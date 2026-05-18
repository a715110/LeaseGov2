/**
 * SCREEN_NUMBERS
 *
 * Maps every screen_key to its human-readable screen number.
 * Numbering convention:  {FC_group}.{sort_order}
 *
 * FC-1  Document Pipeline      → 1.x
 * FC-2  Extraction             → 2.x
 * FC-3  Contract Packages      → 3.x
 * FC-4  Approval Workflow      → 4.x
 * FC-5  Contract Records       → 5.x
 * FC-6  Reassessment           → 6.x
 * FC-7  Governed Export        → 7.x
 * FC-8  Administration         → 8.x
 * FC-9  AI Agents              → 9.x
 * FC-10 Multi-Tenancy/Platform → 10.x
 *
 * Screens without a nav sort order (modals, confirm flows, etc.)
 * receive a letter suffix: e.g. 1.2a, 1.4a.
 *
 * Source: SCREEN_REGISTRY_SPECIFICATION_V2.md — full 63-screen inventory.
 */

export const SCREEN_NUMBERS: Record<string, string> = {
  // ─── FC-1: Document Pipeline ─────────────────────────────────────────────
  'pipeline-dashboard':         '1.1',
  'pipeline-upload':            '1.2',
  'pipeline-new-record-modal':  '1.2a',
  'pipeline-validation':        '1.3',
  'pipeline-review-grouping':   '1.4',
  'pipeline-submit-confirm':    '1.4a',

  // ─── FC-2: Extraction and Verification ───────────────────────────────────
  'extraction-processing-queue':      '2.1',
  'extraction-document-understanding':'2.2',
  'extraction-strategy':              '2.2a',
  'extraction-ai-workspace':          '2.3',
  'extraction-manual-workspace':      '2.3a',
  'extraction-verification':          '2.4',
  'extraction-verification-tracker':  '2.4a',
  'extraction-reprocessing':          '2.1a',

  // ─── FC-3: Contract Packages ─────────────────────────────────────────────
  'packages-composition':   '3.1',
  'packages-flags':         '3.2',
  'packages-reassembly':    '3.2a',

  // ─── FC-4: Approval Workflow ──────────────────────────────────────────────
  'approvals-queue':    '4.1',
  'approvals-review':   '4.2',
  'approvals-approver': '4.3',
  'approvals-rework':   '4.1a',
  'approvals-recall':   '4.1b',

  // ─── FC-5: Contract Records (MVP) ────────────────────────────────────────
  'records-dashboard':    '5.1',
  'records-search':       '5.2',
  'records-detail':       '5.3',
  'records-add-document': '5.3a',

  // ─── FC-5: Contract Records (Phase 2) ────────────────────────────────────
  'records-deferred-tracker':  '5.4',
  'records-snapshot-viewer':   '5.5',
  'records-correction':        '5.6',

  // ─── FC-6: Reassessment (Phase 2) ────────────────────────────────────────
  'reassessment-dashboard':          '6.1',
  'reassessment-trigger':            '6.2',
  'reassessment-sweep':              '6.3',
  'reassessment-case-list':          '6.4',
  'reassessment-classification':     '6.5',
  'reassessment-assessment':         '6.6',
  'reassessment-analysis':           '6.7',
  'reassessment-memo':               '6.8',
  'reassessment-package-preview':    '6.9',
  'reassessment-remediation':        '6.10',
  'reassessment-concurrent-warning': '6.11',
  'reassessment-watchlist':          '6.12',
  'reassessment-survey-intake':      '6.13',
  'reassessment-contextual-project': '6.14',

  // ─── FC-7: Governed Export ───────────────────────────────────────────────
  'export-template-selection': '7.1',
  'export-staging':            '7.2',
  'export-preflight':          '7.2a',
  'export-upload-task':        '7.3',

  // ─── FC-8: Administration ────────────────────────────────────────────────
  'admin-users':          '8.1',
  'admin-schema':         '8.2',
  'admin-templates':      '8.3',
  'admin-thresholds':     '8.4',
  'admin-audit-log':      '8.5',
  'admin-notifications':  '8.6',
  'admin-automation-config': '8.7',

  // ─── FC-9: AI Agents and Automation ──────────────────────────────────────
  'agent-checkpoint-queue':   '9.1',
  'agent-activity-monitor':   '9.2',

  // ─── FC-10: Multi-Tenancy and Platform ───────────────────────────────────
  'platform-not-authorized':       '10.1',
  'platform-onboarding':           '10.2a',
  'superadmin-tenant-list':        '10.3',
  'superadmin-tenant-detail':      '10.4',
  'superadmin-system-health':      '10.5',
  'superadmin-subscriptions':      '10.6',
  'superadmin-screen-registry':    '10.7',
} as const;
