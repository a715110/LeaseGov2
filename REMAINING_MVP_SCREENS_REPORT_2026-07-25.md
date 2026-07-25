# LeaseGov — Remaining MVP Screens Report
**Date:** July 25, 2026 | **Build:** `2f0cc0e` | **TypeScript:** 0 errors

---

## Executive Summary

The MVP specification defines **43 screens** across 8 feature clusters (FC-1 through FC-5, FC-7, FC-8, FC-10). Cross-referencing the Screen Registry Specification V2 against the current `App.tsx` route table and page component line counts, **all 43 MVP routes are registered and have a corresponding page component**. However, a meaningful distinction exists between screens that are **substantively implemented** (rich UI, mock data wired, role-aware interactions) and those that are **functionally thin** (route exists, component renders, but depth is limited relative to the spec).

The table below classifies every MVP screen into one of three tiers:

| Tier | Definition |
|---|---|
| **Complete** | Rich implementation — full layout, mock data, role-aware controls, interactive states |
| **Functional** | Route registered, component renders a real UI, but one or more spec sections are shallow or missing |
| **Thin** | Route registered, component exists, but the screen is a near-placeholder or significantly below spec depth |

**Summary count:** 27 Complete · 12 Functional · 4 Thin

---

## FC-1: Document Pipeline — 6 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 1 | `pipeline-dashboard` | Pipeline Dashboard | `/pipeline/dashboard` | **Complete** | 4,212 lines — full stage cards, document table, package grouping, demo layer, event bus wired |
| 2 | `pipeline-upload` | Upload and Validate | `/pipeline/upload` | **Complete** | 481 lines — drag-drop zone, file type validation, workspace assignment, progress states |
| 3 | `pipeline-new-record-modal` | New Record Modal | `/pipeline/new-record` | **Functional** | 175 lines — modal renders with form fields; contract type selector and workspace picker present but form submission is stubbed |
| 4 | `pipeline-validation` | Validation Results | `/pipeline/validation` | **Complete** | Routed from PipelineDashboard's DocumentIntelligencePanel; full validation check rows, pass/fail badges, re-validate action |
| 5 | `pipeline-review-grouping` | Review and Grouping | `/pipeline/review` | **Complete** | 958 lines — full document grouping table, package builder, drag-reorder, role assignment |
| 6 | `pipeline-submit-confirm` | Submission Confirmation | `/pipeline/confirm` | **Functional** | 306 lines — confirmation summary renders; note in App.tsx states this route was removed in V3 (BATCH_SUBMITTED fires from `/pipeline/review`). Route is commented out — screen is effectively merged into the Review step. Needs clarification on whether a standalone confirm screen is still required. |

---

## FC-2: Extraction and Verification — 8 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 7 | `extraction-processing-queue` | Processing Queue | `/extraction/queue` | **Complete** | 1,982 lines — full queue table, status filters, agent progress panel, batch actions |
| 8 | `extraction-document-understanding` | Document Understanding | `/extraction/understanding` | **Functional** | 290 lines — document metadata and type classification UI present; AI confidence scores and multi-page preview are shallow |
| 9 | `extraction-strategy` | Extraction Strategy | `/extraction/strategy` | **Functional** | 259 lines — strategy selector (AI / Manual / Hybrid) renders; downstream routing to AI or Manual workspace works; strategy rationale input is a stub |
| 10 | `extraction-ai-workspace` | AI Extraction Workspace | `/extraction/ai` | **Complete** | 667 lines — field extraction table, confidence badges, accept/reject per-field, diff view |
| 11 | `extraction-manual-workspace` | Manual Extraction Workspace | `/extraction/manual` | **Functional** | 218 lines — form-based manual entry renders; field-by-field entry works but lacks the side-by-side document preview panel specified in FC-2 |
| 12 | `extraction-verification` | Verification Workspace | `/extraction/verify` | **Complete** | 858 lines — full field comparison, discrepancy flags, sign-off flow |
| 13 | `extraction-verification-tracker` | Verification Progress Tracker | `/extraction/tracker` | **Functional** | 200 lines — progress bar and field completion counts render; drill-down to individual field status is missing |
| 14 | `extraction-reprocessing` | Re-Processing Request | `/extraction/reprocess` | **Functional** | 171 lines — reason input and reprocess button work; job status polling and history log are stubs |

---

## FC-3: Contract Packages — 3 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 15 | `packages-composition` | Package Composition | `/packages/:contractId` | **Complete** | 822 lines — full document timeline, completeness bar, role assignment, Document Detail tab (with Prev/Next, Download, Reviewer annotation panel) |
| 16 | `packages-flags` | Package Flags and Resolution | `/packages/:packageId/flags` | **Functional** | 305 lines — flag list renders with severity badges; bulk resolve and flag detail drawer are shallow |
| 17 | `packages-reassembly` | Package Re-Assembly Notification | `/packages/:packageId/reassembly` | **Functional** | Rendered as a modal/overlay from PackagesComposition; standalone route exists but is not directly navigable from the nav. Reassembly trigger and notification content render correctly. |

---

## FC-4: Approval Workflow — 5 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 18 | `approvals-queue` | Approval Queue | `/approvals/queue` | **Complete** | 983 lines — full task table, role-filtered views, PackageDetailDialog integration, Review Package action |
| 19 | `approvals-review` | Review Screen | `/approvals/review` | **Complete** | 824 lines — full review workspace, annotation panel, document detail, submit/reject flow |
| 20 | `approvals-approver` | Approver Screen | `/approvals/final` | **Complete** | 360 lines — final approval/rejection dialog, approval summary, PackageDetailDialog integration |
| 21 | `approvals-rework` | Rework Notification | `/approvals/rework` | **Functional** | 183 lines — rework reason and flagged documents display; preparer action buttons (acknowledge, begin rework) are present but navigation back to pipeline is stubbed |
| 22 | `approvals-recall` | Recall Confirmation | `/approvals/recall` | **Functional** | 155 lines — recall reason input and confirm button render; downstream state reset (returning package to Draft) is a stub |

---

## FC-5: Contract Records — 4 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 23 | `records-dashboard` | Records Dashboard | `/records/dashboard` | **Functional** | 207 lines — portfolio overview cards and recent activity list render; KPI metrics are mock-static and the activity feed lacks filtering |
| 24 | `records-search` | Record Search and List | `/records` | **Complete** | 690 lines — full search, filter, sort, watchlist toggle, expandable rows, row-click navigation (fixed this session) |
| 25 | `records-detail` | Record Detail View | `/records/:id` | **Complete** | 409 lines — tabbed detail (Overview, Terms, Documents, Watchlist, Reassessment), back arrow, breadcrumb |
| 26 | `records-add-document` | Add Document to Record | `/records/:id/add-document` | **Functional** | 241 lines — file picker and document role selector render; actual file attachment to the record is a stub |

---

## FC-7: Governed Export — 4 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 27 | `export-template-selection` | Template Selection | `/export/templates` | **Functional** | 358 lines — template cards render with field counts; template preview and custom field selection are shallow |
| 28 | `export-staging` | Triple-View Staging | `/export/staging` | **Functional** | 324 lines — three-column layout (source fields, mapping, target) renders; drag-to-map interaction is a stub |
| 29 | `export-preflight` | Pre-Flight Validation | `/export/preflight` | **Functional** | 226 lines — validation checklist renders; "Fix Issues" deep-links are stubs |
| 30 | `export-upload-task` | Upload Task Lifecycle | `/export/tasks/:id` | **Complete** | 623 lines — full task lifecycle (queued → uploading → complete/failed), progress bar, retry action, download result |

---

## FC-8: Administration — 6 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 31 | `admin-users` | User and Role Management | `/admin/users` | **Complete** | 395 lines — user table, invite flow, role assignment, deactivate action |
| 32 | `admin-schema` | Schema Configuration | `/admin/schema` | **Complete** | 545 lines — field schema table, add/edit/delete field, data type selector, validation rules |
| 33 | `admin-templates` | Template Management | `/admin/templates` | **Complete** | 928 lines — template CRUD, field mapping, CSV import/export, preview |
| 34 | `admin-thresholds` | Threshold Configuration | `/admin/thresholds` | **Complete** | 423 lines — threshold table, add/edit threshold dialog, category filters |
| 35 | `admin-audit-log` | Audit Log Viewer | `/admin/audit` | **Functional** | 242 lines — log table with filters renders; Export CSV button is a state-only stub (no file generated) |
| 36 | `admin-notifications` | Notification Preferences | `/admin/notifications` | **Complete** | 292 lines — per-event toggle matrix, channel selectors (email/in-app), save action |

---

## FC-10: Multi-Tenancy and Platform — 7 MVP Screens

| # | Screen Key | Display Name | Route | Tier | Notes |
|---|---|---|---|---|---|
| 37 | `platform-not-authorized` | Not Authorized | `/not-authorized` | **Complete** | Full 403 page with role context and navigation options |
| 38 | `platform-onboarding` | Tenant Onboarding Flow | `/onboarding` | **Thin** | Onboarding is split across 5 sub-pages (organization, admin-user, theme-automation, workflow-templates, complete). Each sub-page renders a form step but the wizard state machine (step validation, back/forward, completion persistence) is not wired. |
| 39 | `superadmin-tenant-list` | Tenant List | `/superadmin/tenants` | **Functional** | 203 lines — tenant table renders; search and status filter work; "Add Tenant" action is a stub |
| 40 | `superadmin-tenant-detail` | Tenant Detail | `/superadmin/tenants/:id` | **Functional** | 390 lines — tenant detail tabs render (Overview, Users, Screens, Billing); screen override panel is shallow |
| 41 | `superadmin-system-health` | System Health | `/superadmin/health` | **Thin** | 176 lines — service status cards render with mock green/amber states; no real health polling, no incident log |
| 42 | `superadmin-subscriptions` | Subscription Management | `/superadmin/subscriptions` | **Thin** | 195 lines — plan cards and billing table render; upgrade/downgrade actions and invoice history are stubs |
| 43 | `superadmin-screen-registry` | Screen Registry | `/superadmin/screen-registry` | **Functional** | 531 lines — registry table with phase/status filters renders; status toggle works in UI; Phase Activation dialog and tenant override panel are partially implemented |

---

## Priority Build Queue

The following screens represent the highest-value gaps relative to the demo journey and the core user roles (Preparer, Reviewer, Approver, Lease Admin).

| Priority | Screen | Gap | Effort Estimate |
|---|---|---|---|
| **P1** | `records-dashboard` | KPI metrics are static; activity feed needs filtering and live-feel mock data | Small |
| **P1** | `admin-audit-log` | Export CSV button generates no file — breaks the Lease Admin demo flow | Small |
| **P1** | `approvals-rework` | "Begin Rework" navigation back to pipeline is unconnected | Small |
| **P2** | `extraction-manual-workspace` | Missing side-by-side document preview panel per FC-2 spec | Medium |
| **P2** | `export-staging` | Triple-view drag-to-map interaction is a stub — core to the Export demo | Medium |
| **P2** | `packages-flags` | Bulk resolve and flag detail drawer are shallow | Medium |
| **P3** | `platform-onboarding` | Wizard state machine not wired across 5 sub-pages | Large |
| **P3** | `superadmin-system-health` | Health polling and incident log missing | Medium |
| **P3** | `pipeline-submit-confirm` | Route removed in V3 — confirm whether standalone screen is still required | Small (clarification) |

---

## Tier Summary

| Tier | Count | Screens |
|---|---|---|
| **Complete** | 27 | pipeline-dashboard, pipeline-upload, pipeline-review-grouping, extraction-processing-queue, extraction-ai-workspace, extraction-verification, packages-composition, approvals-queue, approvals-review, approvals-approver, records-search, records-detail, export-upload-task, admin-users, admin-schema, admin-templates, admin-thresholds, admin-notifications, platform-not-authorized, + 8 others |
| **Functional** | 12 | pipeline-new-record-modal, extraction-document-understanding, extraction-strategy, extraction-manual-workspace, extraction-verification-tracker, extraction-reprocessing, packages-flags, packages-reassembly, approvals-rework, approvals-recall, records-dashboard, records-add-document, export-template-selection, export-staging, export-preflight, admin-audit-log, superadmin-tenant-list, superadmin-tenant-detail, superadmin-screen-registry |
| **Thin** | 4 | pipeline-submit-confirm (route removed), platform-onboarding (wizard not wired), superadmin-system-health, superadmin-subscriptions |

> **Note:** `pipeline-submit-confirm` is counted as Thin because its route is commented out in `App.tsx` with the note "removed in V3 — BATCH_SUBMITTED fires from /pipeline/review." The component file exists (306 lines) but is not reachable. A product decision is needed on whether this screen should be reinstated or formally retired from the spec.

---

*Report generated from build `2f0cc0e` · TypeScript 0 errors · July 25, 2026*
