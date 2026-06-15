# LeaseGov — Build-State Report
**Date:** 2026-06-15  
**Mode:** Full 9-Section Re-Grounding (Mode 2)  
**Checkpoint:** `e79a7fa8`  
**Branch:** `Post-Scaffolding-Changes` (HEAD = `user_github/main` = `origin/main`)

---

## Section 1 — Build Identity

| Item | Value |
|---|---|
| Latest commit hash | `e79a7fa8` |
| TypeScript errors | **0** |
| Dev server | Running on port 3000 |
| GitHub remote | `user_github` → `https://github.com/a715110/LeaseGov2.git` (private) |
| Sync status | HEAD is aligned with `user_github/main` and `origin/main` — no divergence |

**Last 8 commits (most recent first):**

| Hash | Message summary |
|---|---|
| `e79a7fa` | FC-5 Financial + Open Items tabs; FC-6 No-Change confirmation; Demo Unlock for locked Stage Docs |
| `a535c4f` | FC-4 AC2 ROLE_PERSONAS; AC6/BR8 locked_for_review on StagedDocument; amber lock UI |
| `5cb1b8a` | ApprovalsReview: Reject pre-fills from flagged fields; correction chain AI→Preparer→Reviewer; SLA progress bar |
| `4d0d5fd` | ApprovalsReview: Reassign dialog; ApprovalsQueue: SlaBadge, bulk reassign toolbar |
| `b00d4f8` | MOCK_REVIEWERS added; ApprovalsQueue: Assigned To column, stage-aware Reassign dialog |
| `ed8a932` | Assignee filter pills; Bulk Reassign; Package-row Reassign; ExtractionQueue Reassign |
| `16236e8` | FC-3: Add Document → Pipeline intent; UploadDialog initialRecord; quick-action reclassify buttons |
| `7d53032` | FC-3 gap closure: Change Role dialog; Remove from Package; PackagesReassembly live event; BR2 auto-detection |

---

## Section 2 — FC-1 Pipeline Screens

All six FC-1 screens are **BUILT** at production-demo level.

| Screen | File | Lines | Status | Key gaps |
|---|---|---|---|---|
| Pipeline Dashboard | `PipelineDashboard.tsx` | 3,887 | **BUILT** | 17 backend-integration TODOs (all `// TODO: Backend integration required` comments) |
| Pipeline Upload | `PipelineUpload.tsx` | 426 | **BUILT** | 5 TODOs — legacy route, superseded by UploadDialog modal |
| New Record Modal | `PipelineNewRecordModal.tsx` | 175 | **BUILT** | 5 TODOs — backend stubs |
| Validation Detail | `PipelineValidation.tsx` | 267 | **BUILT** | 3 TODOs — backend stubs |
| Review & Group | `PipelineReviewGrouping.tsx` | 946 | **BUILT** | 5 TODOs — backend stubs |
| Submit Confirm | `PipelineSubmitConfirm.tsx` | 306 | **BUILT** | 0 TODOs |

**PipelineDashboard deep features confirmed:**
- Three-table layout: Stage Documents → Contract Packages → Submissions.
- Stage Documents: checkbox bulk-select, workspace filter pills, preparer filter pills, inline assignee edit, Bulk Reassign dialog, `locked_for_review` amber tint + Under Review badge + **Demo Unlock button** (new in `e79a7fa`).
- Contract Packages: inline rename, Dissolve dialog, Package Detail slide panel, Reassign dialog.
- Submissions: Submission Detail slide panel, Unsubmit inline confirmation, DECLINE_SUBMITTED event bus subscriber restores docs to Table 1.
- EventBus: subscribes to `DEMO_RESET` (line 1654) and `DECLINE_SUBMITTED` (line 1568); publishes `PIPELINE_BATCH_CLEARED` (line 1986).

**Carry-forward from `handoff_v3.md`:**
1. Status restoration on Decline — `DECLINE_SUBMITTED` event bus wiring partially done; full doc restoration to Table 1 needs validation.
2. Amendment detection banner in ProcessingWorkflowDialog Step 3.
3. Step 1 template pre-selection from upload modal `contract_type`.
4. Table 3 Eye icon detail panel (currently placeholder).

---

## Section 3 — FC-2 Extraction Screens

| Screen | File | Lines | Status | Key gaps |
|---|---|---|---|---|
| Extraction Queue | `ExtractionQueue.tsx` | 1,640 | **BUILT** | 14 backend TODOs; Reassign dialog, Decline dialog (5-option), Process → 5-step workflow dialog |
| Extraction Verification | `ExtractionVerification.tsx` | 484 | **BUILT** | 6 TODOs; PDF viewer is a placeholder panel |
| Extraction Tracker | `ExtractionTracker.tsx` | 200 | **BUILT** | 2 TODOs |
| Extraction Understanding | `ExtractionUnderstanding.tsx` | 288 | **BUILT** | 2 TODOs |

**ExtractionQueue deep features confirmed:**
- Process button opens `ProcessingWorkflowDialog` (5-step: Template → Extraction → Verification → Record Match → Complete).
- Decline dialog: 5-option reason dropdown + notes textarea (min 10 chars); publishes `DECLINE_SUBMITTED` event.
- Reassign dialog: stage-aware (Reviewers for review stage, Approvers for final_approval); dual notifications.
- Batch-level grouping with expandable rows.

**Gap:** `ExtractionVerification` PDF viewer is a styled placeholder — no real PDF rendering. The `canSubmit` gate and `criticalConfirmed` logic are implemented.

---

## Section 4 — FC-3 Contract Packages Screens

| Screen | File | Lines | Status | Key gaps |
|---|---|---|---|---|
| Package Composition | `PackagesComposition.tsx` | 492 | **BUILT** | 5 TODOs; Change Role dialog with BR2 duplicate-base-contract guard |
| Package Flags | `PackagesFlags.tsx` | 297 | **BUILT** | 3 TODOs; per-flag resolve confirmed |
| Package Reassembly | `PackagesReassembly.tsx` | 248 | **BUILT** | 1 TODO; reads live sessionStorage event |

**Key features confirmed:**
- `canProceed = pkg.open_blocking_flags === 0` guards "Proceed to Approval".
- BR2 auto-detection: `useEffect` watches docs array; if `baseContracts.length > 1`, sets `open_blocking_flags ≥ 1` and shows error banner.
- Change Role dialog warns if selected role would create a second base contract.
- Remove from Package: 15-second undo toast, serialises event to sessionStorage.
- PackagesReassembly reads live sessionStorage event (falls back to mock for direct navigation).

---

## Section 5 — FC-4 Approval Workflow Screens

| Screen | File | Lines | Status | Key gaps |
|---|---|---|---|---|
| Approvals Queue | `ApprovalsQueue.tsx` | 607 | **BUILT** | 3 TODOs; SlaBadge, bulk reassign toolbar, Assigned To column |
| Approvals Review | `ApprovalsReview.tsx` | 750 | **BUILT** | 6 TODOs; correction chain, SLA countdown, Reassign dialog, Reject pre-fill |
| Approvals Approver | `ApprovalsApprover.tsx` | ~300 | **BUILT** | `contractRecordId` hardcoded to `'r1'` |
| Approvals Rework | `ApprovalsRework.tsx` | ~200 | **BUILT** | backend stubs |
| Approvals Recall | `ApprovalsRecall.tsx` | ~200 | **BUILT** | backend stubs |

**ApprovalsReview deep features confirmed:**
- `ROLE_PERSONAS` from `mockData.ts` drives comment attribution.
- Correction chain shows AI → Preparer → Reviewer trail with purple Reviewer badge.
- SLA countdown chip with progress bar (red < 4h, yellow otherwise, Overdue when expired).
- Reassign dialog: dual notifications to original assignee and document submitter.
- Reject flow: pre-fills textarea with flagged fields + low-confidence fields.
- `locked_for_review` on StagedDocuments (docs 3+4 seeded as locked) — amber tint + Under Review badge.

---

## Section 6 — FC-5 Contract Records Screens

| Screen | File | Lines | Status | Key gaps |
|---|---|---|---|---|
| Records Dashboard | `RecordsDashboard.tsx` | 205 | **BUILT** | 2 TODOs |
| Records Search | `RecordsSearch.tsx` | 365 | **BUILT** | 2 TODOs |
| Records Detail | `RecordsDetail.tsx` | 240 | **BUILT** | 3 TODOs; all 9 tabs wired |
| Records Add Document | `RecordsAddDocument.tsx` | ~300 | **BUILT** | backend stubs |
| Records Deferred Tracker | `RecordsDeferredTracker.tsx` | ~250 | **BUILT** | Phase 2 screen |
| Records Snapshot Viewer | `RecordsSnapshotViewer.tsx` | ~300 | **BUILT** | Phase 2; Compare to Current disabled |
| Records Correction | `RecordsCorrection.tsx` | ~300 | **BUILT** | Phase 2 screen |

**RecordsDetail tab inventory (9 tabs, all wired as of `e79a7fa`):**

| Tab ID | Component | Lines | Status |
|---|---|---|---|
| `overview` | `PropertyLeaseRecordOverview.tsx` | 133 | BUILT |
| `financial` | `PropertyLeaseRecordFinancial.tsx` | 261 | **NEW** — ROU asset/lease liability tiles, amortization schedule, term progress bar |
| `documents` | `PropertyLeaseRecordDocuments.tsx` | 107 | BUILT |
| `history` | `PropertyLeaseRecordHistory.tsx` | 86 | BUILT |
| `reassessment` | `PropertyLeaseRecordReassessment.tsx` | 87 | BUILT |
| `open_items` | `PropertyLeaseRecordOpenItems.tsx` | 424 | **NEW** — flags, action items, deferred fields tracker, pending corrections |
| `terms` | `PropertyLeaseRecordTerms.tsx` | 127 | BUILT |
| `workflow` | `PropertyLeaseRecordWorkflow.tsx` | 59 | BUILT |
| `agent` | `PropertyLeaseRecordAgent.tsx` | 68 | BUILT |

**Gap:** `RecordsSnapshotViewer` "Compare to Current" buttons are disabled (Phase 2 placeholder). The side-by-side diff view is not yet implemented.

---

## Section 7 — FC-6 Reassessment Screens

All 14 FC-6 screens are routed and built. The full path from trigger to memo is demonstrable.

| Screen | File | Lines | Status |
|---|---|---|---|
| Reassessment Dashboard | `ReassessmentDashboard.tsx` | 248 | BUILT |
| Trigger | `ReassessmentTrigger.tsx` | ~300 | BUILT |
| Sweep | `ReassessmentSweep.tsx` | 574 | BUILT |
| Case List | `ReassessmentCaseList.tsx` | 394 | **BUILT** — FC-6 No-Change one-click added in `e79a7fa` |
| Classification | `ReassessmentClassification.tsx` | 403 | BUILT — full 3-question sequential gate (Q1→Q2→Q3→result) |
| Assessment | `ReassessmentAssessment.tsx` | 403 | BUILT |
| Analysis | `ReassessmentAnalysis.tsx` | 313 | BUILT |
| Memo | `ReassessmentMemo.tsx` | 164 | BUILT |
| Package Preview | `ReassessmentPackagePreview.tsx` | ~200 | BUILT |
| Remediation | `ReassessmentRemediation.tsx` | ~250 | BUILT |
| Concurrent Warn | `ReassessmentConcurrentWarn.tsx` | ~150 | BUILT |
| Watchlist | `ReassessmentWatchlist.tsx` | ~200 | BUILT |
| Survey Intake | `ReassessmentSurveyIntake.tsx` | ~200 | BUILT |
| Contextual Project | `ReassessmentContextualProject.tsx` | ~300 | BUILT |

**FC-6 No-Change feature (new in `e79a7fa`):**
- `initiated`-status rows in ReassessmentCaseList now show a `⋯` dropdown.
- "Confirm No Change" opens an AlertDialog; confirming sets `status = "no_action_submitted"` and `is_no_action = true` in local state, fires a success toast.
- Cases state is now `useState(MOCK_CASES)` (was a direct filter on the constant) — mutations persist within the session.

**Workflow screens** (under `pages/workflows/`): ReassessmentUpdate, ReassessmentReview, ReassessmentApproval, ReassessmentAnalysisWorkflow — all routed and built.

---

## Section 8 — Shared Components, Mock Data, State Management, and EventBus

### 8a — Shared Components

| Component | Location | Z-index | Animation | Used by |
|---|---|---|---|---|
| `FlagSlidingPanel` | `components/shared/` | z-40 | `translate-x-full → translate-x-0`, 250ms | PipelineDashboard (doc/batch/pkg detail), ExtractionQueue |
| `InlineDialog` | `components/shared/` | z-50 | Backdrop fade | PackagesComposition, ExtractionQueue workflow |
| `PageHeader` | `components/shared/` | — | — | Most pages |
| `ScreenGate` | `components/shared/` | — | — | Role-gated routes |
| `DocumentIntelligencePanel` | `components/pipeline/` | z-40 (via FlagSlidingPanel) | Slide-in right | PipelineDashboard Eye button |
| `UploadDialog` | `components/pipeline/` | Dialog (z-50) | shadcn Dialog | PipelineDashboard Upload button |
| `ProcessingWorkflowDialog` | `components/extraction/` | Dialog (z-50) | shadcn Dialog | ExtractionQueue Process button |

### 8b — Central Mock Data (`lib/mockData.ts`)

| Export | Count | Key fields |
|---|---|---|
| `MOCK_CONTRACT_RECORDS` | 4 records | `id`, `contractNumber`, `counterparty`, `propertyAddress`, `status`, `contract_type`, `workspace` |
| `MOCK_PACKAGES` | 2 packages | `id`, `packageNum`, `packageName`, `mode`, `files`, `workspace`, `status` |
| `MOCK_SUBMISSIONS` | 2 submissions | `id`, `packageNum`, `fileCount`, `status`, `assignee_id` |
| `MOCK_WORKSPACES` | 5 workspaces | Corporate Leasing · Retail · Office · Industrial · Land |
| `MOCK_ASSIGNEES` | 9 assignees | 5 Preparers (one per workspace) + 4 Lease Admins |
| `MOCK_REVIEWERS` | 7 reviewers | 4 Reviewers + 3 Approvers |
| `ROLE_PERSONAS` | 9 roles | Maps `UserRole` → `{ name, initials, email }` for comment attribution |

Local `MOCK_` constants exist in individual page files for page-specific data (e.g., `MOCK_DOCUMENTS` in PipelineDashboard, `MOCK_CASES` in ReassessmentCaseList). These are intentionally not centralised.

### 8c — State Management (Contexts)

| Context | State managed | Persistence | Wraps App.tsx |
|---|---|---|---|
| `DemoModeContext` | `isActive`, demo step, reset | `sessionStorage` (tab-isolated) | Yes |
| `DevModeContext` | `showScreenNumbers` toggle | `localStorage` | Yes |
| `ExtractionStoreContext` | `activeJobId`, `confirmedTemplate`, `classificationResult` | In-memory | Yes |
| `LeaseGovThemeProvider` | `themeKey` (Structured Authority / etc.) | `localStorage` | Yes |
| `NotificationContext` | `notifications[]` | In-memory | Yes |
| `PipelineCountsContext` | `pipelineReadyCount`, `approvalsCount`, `extractionQueueCount` | In-memory | Yes |
| `RegistryContext` | `isRegistryLoaded`, `scaffoldMode` | In-memory | Yes |
| `RoleContext` | `activeRole` (7 personas) | `sessionStorage` (tab-isolated) | Yes |
| `TenantContext` | `tenantCtx` (org name, plan, features) | In-memory | Yes |
| `ThemeContext` | `theme` (light/dark) | `localStorage` | Yes |

### 8d — EventBus Usage

The eventBus uses `BroadcastChannel` for cross-tab delivery. `localStorage` persistence is **intentionally removed** (confirmed in `lib/eventBus.ts` line 37). All call sites are annotated `// DEMO ONLY`.

| Publisher | File | Event type | Trigger |
|---|---|---|---|
| `DemoModeContext` | `contexts/DemoModeContext.tsx:119` | `DEMO_RESET` | Reset Demo button |
| `ExtractionQueue` | `pages/extraction/ExtractionQueue.tsx:1521` | `DECLINE_SUBMITTED` | Decline dialog confirm |
| `PipelineDashboard` | `pages/pipeline/PipelineDashboard.tsx:1986` | `PIPELINE_BATCH_CLEARED` | Batch cleared action |
| `PipelineReviewGrouping` | `pages/pipeline/PipelineReviewGrouping.tsx:922` | `BATCH_SUBMITTED` | Submit package |
| `PipelineSubmitConfirm` | `pages/pipeline/PipelineSubmitConfirm.tsx:111,125` | `BATCH_SUBMITTED` (×2) | Submit confirm |

| Subscriber | File | Listens for | Action on receive |
|---|---|---|---|
| `DemoModeContext` | `contexts/DemoModeContext.tsx:129` | All events | Demo step tracking |
| `NotificationContext` | `contexts/NotificationContext.tsx:76` | All events | Generates notification entries |
| `ExtractionQueue` | `pages/extraction/ExtractionQueue.tsx:849` | `BATCH_SUBMITTED`, `DEMO_RESET` | Adds jobs to queue; resets state |
| `PipelineDashboard` | `pages/pipeline/PipelineDashboard.tsx:1568` | `DECLINE_SUBMITTED` | Restores docs to Table 1 |
| `PipelineDashboard` | `pages/pipeline/PipelineDashboard.tsx:1654` | `DEMO_RESET` | Resets all state to seed data |

**Broken handoff check:** No orphaned publishers detected. Every published event type has at least one subscriber.

---

## Section 9 — Known Issues and Deviations

### 9a — TypeScript
**0 errors.** Clean build confirmed at checkpoint `e79a7fa8`. A transient Vite parse error (`Unterminated JSX contents` at `ReassessmentCaseList.tsx:391`) appeared during the previous session's development cycle but was resolved before the checkpoint was saved. The last successful HMR update for that file (`04:01:05 UTC`) follows the error timestamp (`04:00:55 UTC`), and `pnpm tsc --noEmit` confirms 0 errors in the current state.

### 9b — Browser Console Warnings
One recurring accessibility warning: `Missing Description or aria-describedby={undefined} for {DialogContent}`. This affects several Dialog instances across the codebase that omit `<DialogDescription>`. Not a functional bug but should be resolved before production.

### 9c — Incomplete / Partially Built Screens

| Screen | Issue |
|---|---|
| `ExtractionVerification` | PDF viewer is a styled placeholder — no real rendering library |
| `RecordsSnapshotViewer` | "Compare to Current" buttons disabled — side-by-side diff not implemented |
| `ApprovalsApprover` | `contractRecordId` hardcoded to `'r1'` instead of reading from route params |
| `PropertyLeaseRecordHistory` | Only 86 lines — snapshot list renders but "Compare to Current" is disabled |
| `PropertyLeaseRecordAgent` | Only 68 lines — minimal stub |
| `PropertyLeaseRecordWorkflow` | Only 59 lines — minimal stub |
| `PipelineSubmitConfirm` | Route `/pipeline/confirm` was removed per V3 spec; file still exists but is no longer reachable via normal navigation |

### 9d — Deviations from Spec

| Item | Spec | Actual | Status |
|---|---|---|---|
| Status restoration on Decline | Declined docs return to Table 1 with `original_status` | `DECLINE_SUBMITTED` subscriber in PipelineDashboard exists but restoration logic depends on `document_ids` in payload — not always populated | Carry-forward |
| Amendment detection banner (Step 3) | Amber banner after extraction if `submission_path = 'existing_record'` | Not implemented | Carry-forward |
| Step 1 template pre-selection | Pre-select template from upload modal `contract_type` | Not implemented | Carry-forward |
| RecordsDetail tab count | Spec: 7 tabs | Actual: 9 tabs (spec-aligned after `e79a7fa` — Financial + Open Items added) | **Resolved** |
| FC-6 No-Change path | One-click no-action confirmation on Case List rows | **Implemented** in `e79a7fa` | **Resolved** |
| Demo Unlock for locked docs | Unlock action on locked Stage Document rows | **Implemented** in `e79a7fa` | **Resolved** |

---

## Carry-Forward Items (Priority Order)

The following items represent the highest-value unfinished work identified across this session and the `handoff_v3.md`:

1. **FC-6 Classification Gate → Assessment navigation** — `ReassessmentClassification` navigates to `/reassessment/cases/:id/assess` on submit, and `ReassessmentAssessment` is built (403 lines), but the full case-ID-driven data flow (passing live `case_ref`, `path_type`, `trigger_type` through navigation state) has not been validated end-to-end. Confirm the route-param chain works for all 14 FC-6 screens.

2. **RecordsDetail Snapshot Viewer** — "Compare to Current" in the History tab is disabled. Implementing a side-by-side field-diff panel would complete the record audit trail feature and is a high-visibility demo moment.

3. **Decline → Stage Documents restoration** — The `DECLINE_SUBMITTED` event bus subscriber in PipelineDashboard needs the `document_ids` array to be reliably populated in the ExtractionQueue decline payload so that declined docs actually reappear in Table 1 with `original_status`.

4. **ApprovalsApprover route param** — `contractRecordId` is hardcoded to `'r1'`. Should read from `window.history.state` or route params to support multi-record demos.

5. **FC-7 Governed Export depth** — All 4 export screens are built (210–493 lines each) but have not been audited for spec compliance in this session. Recommend a targeted audit before the next demo.

6. **Accessibility: DialogDescription warnings** — Add `<DialogDescription className="sr-only">` to all `DialogContent` instances that currently omit it to eliminate the recurring console warning.

---

## Design Constraints Reminder

| Constraint | Value |
|---|---|
| Theme | Structured Authority |
| Sidebar colour | `#1F3864` (always dark, regardless of light/dark mode) |
| Typography | Inter (body) + JetBrains Mono (IDs, codes, timestamps) |
| Navigation | `wouter navigate(to, { state: payload })` — single `pushState`, never a separate `window.history.pushState` before navigate |
| Cross-page state | `window.history.state` on receiving page — never URL query params for sensitive data |
| Page header | Every page must include `<ScreenNumberBadge screenKey={_screenKey} />` |
| TypeScript gate | 0 errors required before every checkpoint |
| Registry mode | `scaffoldMode=true` — all screens pass Layer 1 automatically |
| Backend status | All `services/` are stubs — no backend wired |
| Demo layer | `localStorage` persistence removed from `publishEvent`; all call sites annotated `// DEMO ONLY` |
