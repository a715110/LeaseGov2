# LeaseGov — Comprehensive Regrounding Report
**Date:** 20 July 2026 | **Checkpoint:** `3bf217f0` | **TypeScript:** 0 errors
**Prepared by:** Manus AI | **Scope:** Full conversation history · all spec documents · all project shared files · GitHub repository · live build audit

---

## 1. Project Identity & Tech Stack

LeaseGov is a **static React 19 + TypeScript + Tailwind 4 + shadcn/ui** frontend demo for an enterprise contract management platform. It is a pure frontend with no backend persistence — all state resets on page refresh. The event bus (`publishEvent` / `subscribeToEvents`) uses an in-memory array with `BroadcastChannel` for cross-tab propagation, simulating what would be WebSocket/SSE in production.

| Attribute | Value |
|---|---|
| Framework | React 19 + Wouter routing |
| Styling | Tailwind 4 + CSS custom properties (4 themes × 2 modes) |
| Components | shadcn/ui (full suite) |
| State | In-memory mock data + eventBus (no backend) |
| TypeScript | 0 errors as of checkpoint `3bf217f0` |
| Demo mode | 46-step guided tour across 9 roles |
| GitHub remote | `user_github` — not configured (Manus internal S3 remote only) |
| Last checkpoint | `3bf217f0` — 20 June 2026 (3 weeks ago) |

---

## 2. Checkpoint History (Last 15 Commits)

| Commit | Summary |
|---|---|
| `3bf217f` | **3 follow-up items:** PipelineUpload valid seed file; ApprovalsApprover inline decline form with rework state; DemoOverlay scroll position per role |
| `e3252f6` | Wire ApprovalsReview reject path with rework state; 9-role switcher chips in DemoOverlay; Corrupted-Scan-Draft.pdf seed |
| `9954f20` | Wire isRework to navigation state through full rework loop |
| `b79a988` | Fix critical bug B-01: ExtractionVerification canSubmit gate uses dynamic field counts |
| `1f0a9d2` | DemoOverlay icon opacity fix |
| `a00187e` | ApprovalsQueue row flash on events; ExportUploadTask header record title; PipelineUpload warning state removed |
| `42d6789` | MOD-1 through MOD-8: DECLINE_SUBMITTED payload; submission_path banner; contractType auto-select; SUBMIT_FOR_REVIEW wired |
| `2ec80b6` | Amendment detection: detectAmendmentFiles returns matched file names; AmendmentBanner component |
| `c5ef778` | Wire REVIEW_COMPLETED (rejected) and RECORD_APPROVED events; ApprovalsQueue subscribes |
| `5f9bf18` | ExportUploadTask breadcrumb; ApprovalsQueue StatusBadge with 6 states |
| `ab9ef5b` | ApprovalsReview publishes REVIEW_OPENED; AgentCheckpointQueue passes ?record=; RecordsDetail popstate |
| `881761a` | AgentCheckpointQueue case navigation; RecordsDetail ?tab= URL sync; PipelineDashboard package row links |
| `56160b5` | FC-10 audit: OnboardingCompletePage, 5 missing registry rows, breadcrumbs |
| `ff7e6fa` | FC-9 audit: 5 dead checkpoint type routes, registry rows, breadcrumbs |
| `f2bf2ec` | FC-8 audit: 5 missing registry rows, 4 sidebar nav items, notifications breadcrumb |

---

## 3. Screen Inventory

### 3.1 Fully Built Screens (≥200 lines, interactive)

| Screen | File | Lines | FC | Demo Step |
|---|---|---|---|---|
| PipelineDashboard | pipeline/PipelineDashboard.tsx | 3,922 | FC-1 | 1–5 |
| ExtractionQueue | extraction/ExtractionQueue.tsx | 1,672 | FC-2 | 6–8 |
| PipelineReviewGrouping | pipeline/PipelineReviewGrouping.tsx | 946 | FC-1 | 4 |
| AdminTemplates | admin/AdminTemplates.tsx | 850 | FC-8 | 42 |
| ApprovalsReview | approvals/ApprovalsReview.tsx | 798 | FC-4 | 18–21 |
| ReassessmentSurveyIntake | reassessment/ReassessmentSurveyIntake.tsx | 705 | FC-6 | 32 |
| ApprovalsQueue | approvals/ApprovalsQueue.tsx | 694 | FC-4 | 17 |
| ReassessmentContextualProject | reassessment/ReassessmentContextualProject.tsx | 687 | FC-6 | — |
| ExtractionAiWorkspace | extraction/ExtractionAiWorkspace.tsx | 667 | FC-2 | 11 |
| RecordsDeferredTracker | records/RecordsDeferredTracker.tsx | 650 | FC-5 | 38 |
| AgentActivityMonitor | agents/AgentActivityMonitor.tsx | 642 | FC-9 | 46 |
| ExportUploadTask | export/ExportUploadTask.tsx | 620 | FC-7 | 27 |
| ExtractionVerification | extraction/ExtractionVerification.tsx | 596 | FC-2 | 12–13 |
| ReassessmentSweep | reassessment/ReassessmentSweep.tsx | 574 | FC-6 | 34 |
| PackagesComposition | packages/PackagesComposition.tsx | 552 | FC-3 | 14 |
| SuperAdminScreenRegistry | superadmin/SuperAdminScreenRegistry.tsx | 531 | FC-10 | — |
| RecordsSearch | records/RecordsSearch.tsx | 527 | FC-5 | 28 |
| RecordsSnapshotViewer | records/RecordsSnapshotViewer.tsx | 508 | FC-5 | 30, 40 |
| AgentCheckpointQueue | agents/AgentCheckpointQueue.tsx | 465 | FC-9 | 45 |
| PipelineUpload | pipeline/PipelineUpload.tsx | 447 | FC-1 | 2 |
| ReassessmentClassification | reassessment/ReassessmentClassification.tsx | 412 | FC-6 | 35 |
| ReassessmentAssessment | reassessment/ReassessmentAssessment.tsx | 407 | FC-6 | 36 |
| AdminUsers | admin/AdminUsers.tsx | 395 | FC-8 | 41 |
| ReassessmentCaseList | reassessment/ReassessmentCaseList.tsx | 394 | FC-6 | — |
| SuperAdminTenantDetail | superadmin/SuperAdminTenantDetail.tsx | 390 | FC-10 | — |
| AdminThresholds | admin/AdminThresholds.tsx | 372 | FC-8 | 43 |
| AdminAutomation | admin/AdminAutomation.tsx | 348 | FC-8 | — |
| RecordsCorrection | records/RecordsCorrection.tsx | 346 | FC-5 | 31 |
| AdminSchema | admin/AdminSchema.tsx | 343 | FC-8 | — |
| ApprovalsApprover | approvals/ApprovalsApprover.tsx | 332 | FC-4 | 22–23 |
| ExportStaging | export/ExportStaging.tsx | 324 | FC-7 | 25 |
| ReassessmentTrigger | reassessment/ReassessmentTrigger.tsx | 319 | FC-6 | 33 |
| ReassessmentAnalysis | reassessment/ReassessmentAnalysis.tsx | 319 | FC-6 | — |
| PackagesFlags | packages/PackagesFlags.tsx | 305 | FC-3 | 15 |
| AdminNotifications | admin/AdminNotifications.tsx | 292 | FC-8 | 44 |
| RecordsDetail | records/RecordsDetail.tsx | 291 | FC-5 | 29 |
| ExtractionUnderstanding | extraction/ExtractionUnderstanding.tsx | 290 | FC-2 | 9 |
| ReassessmentRemediation | reassessment/ReassessmentRemediation.tsx | 270 | FC-6 | — |
| ReassessmentWatchlist | reassessment/ReassessmentWatchlist.tsx | 266 | FC-6 | 37 |
| ExportTemplateSelection | export/ExportTemplateSelection.tsx | 262 | FC-7 | 24 |
| ExtractionStrategy | extraction/ExtractionStrategy.tsx | 259 | FC-6 | 10 |
| PackagesReassembly | packages/PackagesReassembly.tsx | 256 | FC-3 | 16 |
| ReassessmentDashboard | reassessment/ReassessmentDashboard.tsx | 248 | FC-6 | — |
| AdminAuditLog | admin/AdminAuditLog.tsx | 242 | FC-8 | 39 |
| RecordsAddDocument | records/RecordsAddDocument.tsx | 241 | FC-5 | — |
| PipelineValidation | pipeline/PipelineValidation.tsx | 236 | FC-1 | 3 |
| ExportPreflight | export/ExportPreflight.tsx | 226 | FC-7 | 26 |
| ExtractionManualWorkspace | extraction/ExtractionManualWorkspace.tsx | 218 | FC-2 | — |
| RecordsDashboard | records/RecordsDashboard.tsx | 205 | FC-5 | — |
| ExtractionTracker | extraction/ExtractionTracker.tsx | 200 | FC-2 | — |
| ApprovalsRework | approvals/ApprovalsRework.tsx | 183 | FC-4 | 20 |
| ReassessmentMemo | reassessment/ReassessmentMemo.tsx | 171 | FC-6 | — |

### 3.2 Shallow / Stub Screens (≤100 lines or "Under Construction")

| Screen | File | Lines | Status |
|---|---|---|---|
| ReassessmentUpdate | workflows/ReassessmentUpdate.tsx | 95 | Under Construction stub |
| ReassessmentReview (workflow) | workflows/ReassessmentReview.tsx | 96 | Under Construction stub |
| ReassessmentApproval (workflow) | workflows/ReassessmentApproval.tsx | 96 | Under Construction stub |
| ReassessmentAnalysis (workflow) | workflows/ReassessmentAnalysis.tsx | 101 | Under Construction stub |
| ReassessmentMemo | reassessment/ReassessmentMemo.tsx | 171 | Shallow — no rich memo preview |
| ReassessmentPackagePreview | reassessment/ReassessmentPackagePreview.tsx | ~167 | Shallow — no document viewer |
| ApprovalsRecall | approvals/ApprovalsRecall.tsx | ~120 | Minimal — no event bus wiring |
| PipelineSubmitConfirm | pipeline/PipelineSubmitConfirm.tsx | 306 | **Deprecated** (V3 removed) |
| All 28-line stubs | documents/, portfolio/, properties/, etc. | 28 each | Placeholder "Under Construction" |

### 3.3 RecordsDetail Tab Inventory (10 tabs — all present)

Overview · Terms · Financial (ASC 842 amortisation) · Documents · Workflow · Reassessment · History · Agent · Open Items · Watchlist

---

## 4. Event Bus Wiring Audit

### 4.1 Published Events

| Event Type | Publisher | Payload |
|---|---|---|
| `BATCH_SUBMITTED` | PipelineReviewGrouping | batchId, fileCount, workspaceTag |
| `PIPELINE_BATCH_CLEARED` | PipelineReviewGrouping | fileNames, batchId |
| `DECLINE_SUBMITTED` | ExtractionQueue (Preparer declines batch) | submissionId, batchRef, reasonCategory, perFileReasons, document_ids |
| `DECLINE_SUBMITTED` | ApprovalsApprover (Approver declines for rework) | task_id, record_id, outcome, comments |
| `SUBMIT_FOR_REVIEW` | ExtractionVerification | contractRecordId, sourceRole |
| `REVIEW_OPENED` | ApprovalsReview (on mount) | task_id |
| `REVIEW_COMPLETED` (rejected) | ApprovalsReview (Confirm Rejection) | task_id, record_id, outcome:'rejected', reasons, comments |
| `RECORD_APPROVED` | ApprovalsApprover (Final Approve) | task_id, record_id, label |
| `UPLOAD_TASK_STARTED` | ExportUploadTask | task_id, record_id |
| `UPLOAD_TASK_COMPLETED` | ExportUploadTask | task_id, record_id |
| `DEMO_RESET` | DemoOverlay | — |

### 4.2 Subscribers

| Subscriber | Events Handled |
|---|---|
| ApprovalsQueue | `REVIEW_OPENED` (flip to opened) · `REVIEW_COMPLETED{rejected}` (flip to rejected) · `RECORD_APPROVED` (flip to approved) |
| PipelineDashboard | `PIPELINE_BATCH_CLEARED` (remove from staged) · `DECLINE_SUBMITTED` (restore docs to Table 1) |
| PipelineCountsContext | `BATCH_SUBMITTED` · `SUBMIT_FOR_REVIEW` · `RECORD_APPROVED` (badge counts) |
| eventBus.replayState() | All events — reconstructs pendingBatches / pendingReviews / pendingApprovals / pendingExports |

### 4.3 Critical Event Bus Gaps

**G-01 — ApprovalsQueue missing `SUBMIT_FOR_REVIEW` subscriber.** When the Preparer clicks "Submit for Review" in ExtractionVerification, the event is published and the user is navigated to `/approvals/queue`. However, the queue does not add a new task row in response to this event. The Reviewer arrives at an empty queue (only the 8 pre-seeded mock tasks are visible). The demo relies on the pre-seeded `t1` task being in the queue already, which means the "Submit for Review → Reviewer sees new task" handoff (demo steps 13→17) is not dynamically wired.

**G-02 — ApprovalsReview "Approve for Final" does not publish `APPROVE_FOR_FINAL`.** The "Approve for Final" button opens `showApproverModal`, which contains placeholder copy ("Navigate to /approvals/final to view the full Approver screen (ApproverDialog431)") and navigates to `/approvals/final/:id` without publishing any event. The `APPROVE_FOR_FINAL` event type is defined in `types.ts` and handled in `eventBus.replayState()`, but is never fired. This means the Approver queue does not receive a task when the Reviewer approves, and the `pendingApprovals` state in the event bus replay is never populated from a live session action.

**G-03 — ApprovalsQueue `REVIEW_COMPLETED` handler only handles `rejected` outcome.** When the Reviewer approves for final (if G-02 were fixed), the queue would need to advance the task from `review` stage to `final_approval` stage. Currently the handler only flips the status to `rejected` on `outcome:'rejected'` — there is no `outcome:'approved'` branch that advances the task to `final_approval`.

**G-04 — `showApproverModal` placeholder copy.** The modal title reads "Final Approval — ApproverDialog431" and the body reads "Navigate to /approvals/final to view the full Approver screen (ApproverDialog431)." This is placeholder text that would be visible to demo viewers.

---

## 5. Route / demoSteps Mismatches

| Step | demoSteps route | App.tsx route | Status |
|---|---|---|---|
| Step 32 | `/reassessment/survey-intake` | `/reassessment/surveys` | **MISMATCH** — demoSteps navigates to a 404 |
| Step 36 | `/reassessment/cases/case-001/assessment` | `/reassessment/cases/:id/assess` | **MISMATCH** — demoSteps navigates to a 404 |

Both mismatches cause the DemoOverlay "Navigate" button to land on the NotFound page for those steps.

---

## 6. Carry-Forward Items (from handoff_v3.md)

These five items were documented as deferred in the V3 handoff and remain open:

1. **CF-01 — Status restoration event bus.** The `DECLINE_SUBMITTED` event from ExtractionQueue is now wired to PipelineDashboard (implemented in commit `42d6789`). **Status: RESOLVED.**
2. **CF-02 — Amendment detection banner.** `submission_path` is passed into `ProcessingWorkflowDialog` and the `AmendmentBanner` component shows at Steps 1, 2, and 5 (implemented in commit `2ec80b6`). **Status: RESOLVED.**
3. **CF-03 — Step 1 template pre-selection.** `contractType` auto-selects the matching template in Step 2 of `ProcessingWorkflowDialog` (implemented in commit `42d6789`). **Status: RESOLVED.**
4. **CF-04 — Table 3 eye icon.** The Document Intelligence Panel slide-in is present for Table 1 rows. The Table 3 (Submissions) eye icon detail panel remains a placeholder. **Status: OPEN.**
5. **CF-05 — Unsubmit action.** Table 3 "Unsubmit" button to return a package to Table 2 with status restoration is not yet implemented. **Status: OPEN.**

---

## 7. Admin Sidebar Visibility

The SuperAdmin navigation group has no `allowedRoles` guard — it is visible to all 9 roles. This is noted in a code comment as intentional for the demo build, but may confuse demo viewers who are not in the `lease_admin` or `auditor` role. The `AdminLayout` component redirects non-admin users who navigate directly to admin routes, but the sidebar links remain visible.

---

## 8. Spec Compliance Summary

| Spec Document | Coverage |
|---|---|
| DOC1 Product Overview V2 | ✅ All 10 FCs represented in the build |
| DOC2 Feature Specifications V2 | ✅ FC-1 through FC-10 screens present; FC-6 workflow stubs are under construction |
| DOC6 User Journey Maps V2 | ✅ All 9 cross-role handoffs navigable; G-01/G-02 break the Preparer→Reviewer→Approver event chain |
| DOCUMENT_INTAKE_GOVERNANCE_FLOW V3 | ✅ V3 binary valid/invalid model, single-pass extraction, upload modal, BATCH_SUBMITTED from PipelineReviewGrouping |
| IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE V3 | ✅ All 24 V3 spec checks pass per handoff_v3.md |
| SCREEN_REGISTRY_SPECIFICATION V2 | ✅ 63 screen keys defined; SuperAdminScreenRegistry shows deprecated pipeline-submit-confirm |
| MASTER_FRONTEND_ARCHITECTURE V4 | ⚠️ Folder structure partially aligned; `documents/`, `portfolio/`, `properties/` are 28-line stubs |

---

## 9. Prioritised Gap List

### Critical (break the demo flow)

| ID | Gap | Affected Demo Steps | Fix Complexity |
|---|---|---|---|
| **G-01** | ApprovalsQueue missing `SUBMIT_FOR_REVIEW` subscriber — Reviewer sees no new task arrive after Preparer submits | Steps 13→17 | Low — add subscriber that pushes a new task row |
| **G-02** | ApprovalsReview "Approve for Final" does not publish `APPROVE_FOR_FINAL` — Approver queue never receives task from live session | Steps 21→22 | Low — publish event in showApproverModal confirm handler |
| **G-03** | ApprovalsQueue `REVIEW_COMPLETED` handler missing `approved` branch — task never advances to `final_approval` stage | Steps 21→22 | Low — add `outcome:'approved'` branch that advances stage |
| **G-04** | showApproverModal placeholder copy visible to demo viewers | Step 21 | Trivial — replace placeholder text |
| **G-05** | demoSteps step-32 route `/reassessment/survey-intake` → 404 (App.tsx uses `/reassessment/surveys`) | Step 32 | Trivial — fix route in demoSteps.ts |
| **G-06** | demoSteps step-36 route `/reassessment/cases/case-001/assessment` → 404 (App.tsx uses `/assess`) | Step 36 | Trivial — fix route in demoSteps.ts |

### Moderate (reduce demo quality)

| ID | Gap | Affected Demo Steps | Fix Complexity |
|---|---|---|---|
| **G-07** | 4 FC-6 workflow stubs (`/workflows/reassessment/update|review|approval|analysis`) are "Under Construction" callouts only | Not in demo tour | Medium — build minimal interactive content |
| **G-08** | ReassessmentMemo (171 lines) is shallow — no rich memo preview or document viewer | Not in demo tour | Medium |
| **G-09** | CF-04 Table 3 eye icon detail panel is a placeholder | Step 4 (PipelineDashboard) | Low |
| **G-10** | CF-05 Unsubmit action in Table 3 not implemented | Step 4 (PipelineDashboard) | Low |
| **G-11** | SuperAdmin sidebar group visible to all roles (no `allowedRoles` guard) | All steps | Low — add allowedRoles filter |

### Low Priority (polish)

| ID | Gap |
|---|---|
| **G-12** | 28-line stub screens in `documents/`, `portfolio/`, `properties/`, `settings/`, `auth/` — not in demo tour |
| **G-13** | ApprovalsRecall screen has no event bus wiring |
| **G-14** | ExtractionManualWorkspace is shallow (218 lines, no real field entry UX) |

---

## 10. Recommended Session Plan

The highest-value work for the next session, in priority order:

**Session A — Fix the 6 critical gaps (estimated: 1 session)**
1. Fix demoSteps step-32 and step-36 route mismatches (G-05, G-06) — 5 minutes
2. Replace showApproverModal placeholder copy (G-04) — 5 minutes
3. Add `SUBMIT_FOR_REVIEW` subscriber to ApprovalsQueue that pushes a new task (G-01) — 30 minutes
4. Publish `APPROVE_FOR_FINAL` from ApprovalsReview showApproverModal confirm (G-02) — 15 minutes
5. Add `REVIEW_COMPLETED{approved}` branch to ApprovalsQueue that advances task to `final_approval` stage (G-03) — 15 minutes

**Session B — Polish and carry-forward (estimated: 1 session)**
1. Table 3 eye icon detail panel (CF-04 / G-09)
2. Unsubmit action (CF-05 / G-10)
3. SuperAdmin sidebar `allowedRoles` guard (G-11)

**Session C — FC-6 workflow stubs (estimated: 1–2 sessions)**
1. Build minimal interactive content for the 4 `/workflows/reassessment/*` stubs (G-07)
2. Deepen ReassessmentMemo with a rich memo preview (G-08)

---

*Report generated from: git log `3bf217f0`, 15 spec documents, 46 demoSteps, 85 page files, and full event bus audit.*
