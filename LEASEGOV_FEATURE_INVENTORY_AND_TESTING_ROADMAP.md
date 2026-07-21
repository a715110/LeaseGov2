# LeaseGov — Feature Inventory, Timeline, and User Testing Roadmap

**Prepared:** 20 July 2026  
**Build checkpoint:** `1f424f99`  
**TypeScript status:** 0 errors  
**Total commits:** 72  
**Date range:** 15 May 2026 – 20 July 2026 (66 days)

---

## PART 1 — REPOSITORY SUMMARY

### Files Read

The following sources were reviewed to produce this document:

| Source | Purpose |
|---|---|
| `git log --format="%h|%ad|%s"` (72 commits) | Chronological build history |
| `REGROUNDING_REPORT_2026-07-20.md` | Latest build state, gap analysis |
| `BUILD_STATE_REPORT_2026-06-22.md` | Prior build state, event bus audit |
| `TEST_REPORT_2026-06-16.md` | Screen-by-screen pass/warning/fail status |
| `handoff_v3.md` | Carry-forward items and known gaps |
| `FC3_AUDIT_GAP_LIST.md`, `FC4_AUDIT_GAP_LIST.md` | Per-cluster gap details |
| `client/src/contexts/demoSteps.ts` | 46-step demo tour coverage |
| `client/src/pages/**/*.tsx` (85 page files) | Screen-by-screen implementation depth |
| `client/src/services/eventBus.ts` | Event bus publisher/subscriber audit |
| `client/src/App.tsx` | Route inventory |

### Build Identity

**Latest checkpoint:** `1f424f99` (20 July 2026)  
**TypeScript:** 0 errors  
**Total page files:** 85  
**Total routes:** 78  
**Demo tour:** 46 steps across 9 roles  
**Stack:** React 19 + Tailwind 4 + shadcn/ui (static frontend, no backend)

### Scaffolding Summary

The project was bootstrapped on 15 May 2026 with a complete V4-spec-compliant frontend architecture: 63 screen keys, a two-layer `ScreenGate` access control system, a 4-theme × 2-mode design system, 20 service files, 8 agent files, and full `App.tsx` routing. All 85 screens are navigable from day one. Feature implementation then proceeded cluster by cluster over the following 66 days, with the most intensive build period occurring 11–19 June 2026. As of 20 July 2026, the majority of FC-1 through FC-9 screens are fully built with real mock data and interactive flows. Approximately 46 screens remain as visual stubs (marked with a diagonal "STUB" watermark) awaiting full implementation.

---

## PART 2 — FEATURE AND WORKFLOW INVENTORY

### FC-1: Document Pipeline

**Screens:** PipelineUpload, PipelineDashboard (Table 1/2/3), PipelineReviewGrouping, PipelineNewRecordModal, PipelineValidation

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Drag-and-drop file upload with OCR simulation | BUILT | `189d2c1` | 11 Jun | None | ✅ Yes |
| Binary valid/invalid file classification (V3 model) | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| Upload dialog — 4-section all-in-one (workspace, type, record, notes) | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| Seed files: Retail-HQ-Lease-2026.pdf (valid) + Corrupted-Scan-Draft.pdf (invalid) | BUILT | `3bf217f` | 21 Jun | None | ✅ Yes |
| Stage Documents table (Table 1) with Active/Committed tabs | BUILT | `9a7b9f1` | 12 Jun | None | ✅ Yes |
| Document Intelligence Panel with target record assignment | BUILT | `d97661d` | 11 Jun | None | ✅ Yes |
| Locked document rows (amber tint, lock icon, Under Review badge) | BUILT | `a535c4f` | 15 Jun | None | ✅ Yes |
| Bulk selection and package creation from Stage Documents | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| Review & Group screen with URL param mode + Save Draft | BUILT | `9883b9f` | 11 Jun | None | ✅ Yes |
| Package composition with role dropdown and completeness badge | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| BATCH_SUBMITTED event published on package confirm | BUILT | `9883b9f` | 11 Jun | None | ✅ Yes |
| Submission rows (Table 3) with status badges | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| Rework Required amber badge (Approver decline) vs Declined badge (Preparer decline) | BUILT | `f79ef29` | 20 Jul | None | ✅ Yes |
| Decline History panel with "Declined By" indicator (Approver vs Preparer) | BUILT | `1f424f9` | 20 Jul | None | ✅ Yes |
| DECLINE_SUBMITTED restores submission to Stage Documents | BUILT | `559e0d6` | 20 Jul | None | ✅ Yes |
| Assignee filter pills and bulk reassign | BUILT | `ed8a932` | 15 Jun | None | ✅ Yes |
| Notification bell increment on BATCH_SUBMITTED | BUILT | `2a253c9` | 11 Jun | None | ✅ Yes |
| New Record modal (PipelineNewRecordModal) | STUB | `27058ca` | 16 May | Full implementation needed | ❌ No |
| Validation screen (PipelineValidation) | STUB | `27058ca` | 16 May | Full implementation needed | ❌ No |

---

### FC-2: Extraction

**Screens:** ExtractionQueue, ExtractionUnderstanding, ExtractionStrategy, ExtractionAiWorkspace, ExtractionManualWorkspace, ExtractionVerification, ExtractionTracker, ExtractionReprocessing

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Extraction Queue with BATCH_SUBMITTED subscriber (live task arrival) | BUILT | `9883b9f` | 11 Jun | None | ✅ Yes |
| Queue row Decline action with inline dialog (min 10 chars) | BUILT | `9883b9f` | 11 Jun | None | ✅ Yes |
| Queue batch row reassign dialog with notifications | BUILT | `ed8a932` | 15 Jun | None | ✅ Yes |
| 5-step Processing Workflow Dialog (single-pass extraction simulation) | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| Step 2 template selection from 5 MOCK_EXTRACTION_TEMPLATES | BUILT | `4b3f113` | 11 Jun | None | ✅ Yes |
| Step 3 submission_path banner | BUILT | `42d6789` | 16 Jun | None | ✅ Yes |
| Amendment detection banner at Steps 1, 2, 5 | BUILT | `2ec80b6` | 16 Jun | None | ✅ Yes |
| ExtractionUnderstanding — AI suggestion chip, search, record link | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| ExtractionStrategy — strategy selection with confidence scoring | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| ExtractionAiWorkspace — field extraction with amendment banner | BUILT | `aef96ed` | 19 Jun | None | ✅ Yes |
| ExtractionManualWorkspace — manual field entry | PARTIAL | `27058ca` | 16 May | Limited interactivity | ⚠ Partial |
| ExtractionVerification — 11-field review, canSubmit gate, rework banner | BUILT | `b79a988` | 20 Jun | None | ✅ Yes |
| ExtractionVerification — Submit for Review publishes SUBMIT_FOR_REVIEW | BUILT | `42d6789` | 16 Jun | None | ✅ Yes |
| ExtractionVerification — rework banner reads real rejection data from nav state | BUILT | `9954f20` | 20 Jun | None | ✅ Yes |
| ExtractionTracker — batch progress tracking | PARTIAL | `27058ca` | 16 May | Limited mock data depth | ⚠ Partial |
| ExtractionReprocessing — reprocessing queue | STUB | `27058ca` | 16 May | Full implementation needed | ❌ No |

---

### FC-3: Contract Packages

**Screens:** PackagesComposition, PackagesFlags, PackagesReassembly

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Package composition screen with document role list | BUILT | `b7cfb81` | 12 Jun | None | ✅ Yes |
| BR2 auto-detection: multiple base contracts error banner | BUILT | `7d53032` | 15 Jun | None | ✅ Yes |
| Change Role dialog with duplicate-base-contract warning | BUILT | `7d53032` | 15 Jun | None | ✅ Yes |
| Remove from Package with 15-second undo toast | BUILT | `7d53032` | 15 Jun | None | ✅ Yes |
| PackagesFlags — per-flag resolve with confirmation | BUILT | `16236e8` | 15 Jun | None | ✅ Yes |
| PackagesReassembly — before/after comparison from sessionStorage | BUILT | `7d53032` | 15 Jun | None | ✅ Yes |
| Add Document button navigates to Pipeline with pre-populated record | BUILT | `16236e8` | 15 Jun | None | ✅ Yes |

---

### FC-4: Approval Workflow

**Screens:** ApprovalsQueue, ApprovalsReview, ApprovalsApprover, ApprovalsRework

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Approval Queue with live task list (8 mock tasks) | BUILT | `28a2f19` | 15 Jun | None | ✅ Yes |
| SUBMIT_FOR_REVIEW subscriber — live task arrival from Preparer | BUILT | `1a56f8d` | 20 Jul | None | ✅ Yes |
| APPROVE_FOR_FINAL subscriber — task advances to final_approval stage | BUILT | `1a56f8d` | 20 Jul | None | ✅ Yes |
| RECORD_APPROVED mount-time initialiser — task flips to Approved on remount | BUILT | `1f424f9` | 20 Jul | None | ✅ Yes |
| StatusBadge with animated pulse dot on Opened status | BUILT | `5f9bf18` | 16 Jun | None | ✅ Yes |
| SLA countdown chip with progress bar (red <4h, yellow, Overdue) | BUILT | `4d0d5fd` | 15 Jun | None | ✅ Yes |
| Assigned To avatar-badge column with tooltip | BUILT | `b00d4f8` | 15 Jun | None | ✅ Yes |
| Bulk reassign toolbar with stage-aware reviewer list | BUILT | `4d0d5fd` | 15 Jun | None | ✅ Yes |
| Overdue SLA notification bell badge | BUILT | `5ae4bcb` | 15 Jun | None | ✅ Yes |
| ApprovalsReview — 8-task data-driven from MOCK_TASKS_BY_ID | BUILT | `28a2f19` | 15 Jun | None | ✅ Yes |
| ApprovalsReview — Reject button pre-fills flagged + low-confidence fields | BUILT | `5cb1b8a` | 15 Jun | None | ✅ Yes |
| ApprovalsReview — Correction chain (AI → Preparer → Reviewer trail) | BUILT | `5cb1b8a` | 15 Jun | None | ✅ Yes |
| ApprovalsReview — Reassign mid-review with dual notifications | BUILT | `4d0d5fd` | 15 Jun | None | ✅ Yes |
| ApprovalsReview — Approve for Final publishes APPROVE_FOR_FINAL | BUILT | `1a56f8d` | 20 Jul | None | ✅ Yes |
| ApprovalsReview — Decline for Rework passes rework state to ExtractionVerification | BUILT | `e3252f6` | 21 Jun | None | ✅ Yes |
| ApprovalsApprover — data-driven from MOCK_TASKS_BY_ID | BUILT | `28a2f19` | 15 Jun | None | ✅ Yes |
| ApprovalsApprover — Decline for Rework inline form with comments | BUILT | `3bf217f` | 21 Jun | None | ✅ Yes |
| ApprovalsApprover — RECORD_APPROVED published on Final Approve | BUILT | `c5ef778` | 16 Jun | None | ✅ Yes |
| ApprovalsRework — rework banner with real rejection data | BUILT | `9954f20` | 20 Jun | None | ✅ Yes |
| Locked document rows in Stage Documents during review | BUILT | `a535c4f` | 15 Jun | None | ✅ Yes |

---

### FC-5: Contract Records

**Screens:** RecordsDashboard, RecordsSearch, RecordsDetail (10 tabs), RecordsSnapshotViewer, RecordsCorrection, RecordsDeferredTracker

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Records Dashboard with portfolio summary | PARTIAL | `27058ca` | 16 May | Limited mock data depth | ⚠ Partial |
| Records Search with My Watchlist view tab | BUILT | `28a2f19` | 15 Jun | None | ✅ Yes |
| RecordsDetail — Overview tab with lock status banner | BUILT | `c5ef778` | 16 Jun | None | ✅ Yes |
| RecordsDetail — RECORD_APPROVED flips status to Approved + flash banner | BUILT | `f79ef29` | 20 Jul | None | ✅ Yes |
| RecordsDetail — Financial tab (ROU asset, lease liability, amortization) | BUILT | `e79a7fa` | 15 Jun | None | ✅ Yes |
| RecordsDetail — Documents tab | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| RecordsDetail — History tab with Compare-to-Current snapshot buttons | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| RecordsDetail — Reassessment tab | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| RecordsDetail — Open Items tab (flags, deferred fields, pending corrections) | BUILT | `e79a7fa` | 15 Jun | None | ✅ Yes |
| RecordsDetail — Terms tab | PARTIAL | `27058ca` | 16 May | Limited content | ⚠ Partial |
| RecordsDetail — Workflow tab | PARTIAL | `27058ca` | 16 May | Limited content | ⚠ Partial |
| RecordsDetail — Agent tab | PARTIAL | `27058ca` | 16 May | Limited content | ⚠ Partial |
| RecordsDetail — Watchlist tab with star toggle and persistence | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| Watchlist localStorage persistence + sidebar badge | BUILT | `83c2ebf` | 15 Jun | None | ✅ Yes |
| Snapshot Viewer — side-by-side comparison with Swap button | BUILT | `28a2f19` | 15 Jun | None | ✅ Yes |
| Snapshot Viewer — pre-selected from History tab ?snap= param | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| RecordsCorrection — correction submission form | PARTIAL | `27058ca` | 16 May | Limited interactivity | ⚠ Partial |
| RecordsDeferredTracker — age-based severity tracker | BUILT | `e79a7fa` | 15 Jun | None | ✅ Yes |
| ExportUploadTask lock banner wired to RecordsDetail | BUILT | `b1840c3` | 15 Jun | None | ✅ Yes |

---

### FC-6: Reassessment

**Screens:** ReassessmentDashboard, ReassessmentSurveyIntake, ReassessmentTrigger, ReassessmentSweep, ReassessmentClassification, ReassessmentCaseList, ReassessmentAssessment, ReassessmentWatchlist, ReassessmentMemo, ReassessmentPackagePreview, ReassessmentContextualProject, ReassessmentAssessmentWorkflow, ReassessmentUpdate, ReassessmentReview, ReassessmentApproval, ReassessmentAnalysis

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Reassessment Dashboard with portfolio summary | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Survey Intake — survey list with response rates | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Reassessment Trigger — trigger initiation with concurrent case warning | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Period-End Sweep — Tier 1/2/3 sweep configuration | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Classification — 3-question sequential flow with case ID from URL params | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| Case List with one-click No-Change confirmation | BUILT | `e79a7fa` | 15 Jun | None | ✅ Yes |
| Assessment Workflow — case assessment with classification outcome | BUILT | `3f8602a` | 15 Jun | None | ✅ Yes |
| Reassessment Watchlist — automated monitoring rules | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Reassessment Memo — memo preview | PARTIAL | `27058ca` | 16 May | Shallow content (171 lines) | ⚠ Partial |
| Package Preview — document viewer | PARTIAL | `27058ca` | 16 May | Shallow content (167 lines) | ⚠ Partial |
| Contextual Project — project context panel | STUB | `b26ead0` | 11 Jun | Read-only content only | ⚠ Partial |
| Assessment Workflow (FC-6 workflow) | STUB | `b26ead0` | 11 Jun | Read-only content only | ⚠ Partial |
| Update Workflow — read-only content with state machine stepper | BUILT | `559e0d6` | 20 Jul | No live actions | ⚠ Partial |
| Review Workflow — read-only content with state machine stepper | BUILT | `559e0d6` | 20 Jul | No live actions | ⚠ Partial |
| Approval Workflow — read-only content with state machine stepper | BUILT | `559e0d6` | 20 Jul | No live actions | ⚠ Partial |
| Analysis Workflow — read-only content with state machine stepper | BUILT | `559e0d6` | 20 Jul | No live actions | ⚠ Partial |

---

### FC-7: Governed Export

**Screens:** ExportTemplateSelection, ExportStaging, ExportPreflight, ExportUploadTask

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Template selection with 3 templates and record threading | BUILT | `5ae4bcb` | 15 Jun | None | ✅ Yes |
| Export Staging — document list with staging controls | BUILT | `5ae4bcb` | 15 Jun | None | ✅ Yes |
| Pre-Flight checklist — compliance checks before upload | BUILT | `5ae4bcb` | 15 Jun | None | ✅ Yes |
| Upload Task — 5-step compliance packet (PAC, SAC, DAC) | BUILT | `0914e39` | 15 Jun | None | ✅ Yes |
| Upload Task — data-driven from MOCK_UPLOAD_TASKS_BY_ID (ut1/ut2/ut3) | BUILT | `0914e39` | 15 Jun | None | ✅ Yes |
| Upload Task — context-aware breadcrumb (Checkpoint Queue vs CR-XXXX) | BUILT | `5f9bf18` | 16 Jun | None | ✅ Yes |
| UPLOAD_TASK_STARTED/COMPLETED events wired to RecordsDetail lock banner | BUILT | `b1840c3` | 15 Jun | None | ✅ Yes |
| Export from RecordsDetail Overview tab | BUILT | `5ae4bcb` | 15 Jun | None | ✅ Yes |

---

### FC-8: Administration

**Screens:** AdminUsers, AdminSchema, AdminTemplates, AdminThresholds, AdminAuditLog, AdminAppearance, AdminAutomation

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Admin Users — user list with role management | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Schema — field schema configuration | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Templates — extraction template management | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Thresholds — confidence threshold sliders | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Audit Log — append-only event log | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Appearance — theme and color mode settings | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Admin Automation — domain cards, automation level, policy version history | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |

---

### FC-9: AI Agents

**Screens:** AgentCheckpointQueue, AgentActivityMonitor

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| Agent Checkpoint Queue — pending checkpoint list with approve/reject | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Agent Activity Monitor — agent run log with status | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Export from Checkpoint Queue to Upload Task | BUILT | `5f9bf18` | 16 Jun | None | ✅ Yes |

---

### FC-10: Multi-Tenancy

**Screens:** SuperAdminScreenRegistry, SuperAdminTenants, SuperAdminPlatform, OnboardingOrganizationSetup, OnboardingAdminUserSetup, OnboardingThemeAutomationSetup, OnboardingWorkflowTemplateSetup, OnboardingComplete

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| SuperAdmin Screen Registry — enable/disable screens per tenant | BUILT | `aef96ed` | 19 Jun | None | ◈ PHASE 2 |
| SuperAdmin Screen Registry — deprecated screen filter | BUILT | `aef96ed` | 19 Jun | None | ◈ PHASE 2 |
| SuperAdmin Tenants — tenant list | STUB | `27058ca` | 16 May | Full implementation needed | ❌ No |
| SuperAdmin Platform — platform settings | STUB | `27058ca` | 16 May | Full implementation needed | ❌ No |
| Onboarding flow (5 screens: Org, Admin, Theme, Workflow, Complete) | STUB | `d67a122` | 16 May | Full implementation needed | ❌ No |

---

### Cross-Cutting Features

| Feature | Status | Checkpoint | Date | Gaps | Demo-Ready |
|---|---|---|---|---|---|
| EventBus — publish/subscribe with replayState | BUILT | `6d6f108` | 15 May | None | ✅ Yes |
| DemoOverlay — 46-step guided tour, 9 roles, scroll position per role | BUILT | `3bf217f` | 21 Jun | None | ✅ Yes |
| Role Switcher — 9 roles in sidebar header | BUILT | `e3252f6` | 21 Jun | None | ✅ Yes |
| Demo Reset button | BUILT | `bd91f9e` | 19 Jun | None | ✅ Yes |
| Notification bell with badge counts and live updates | BUILT | `83c2ebf` | 15 Jun | None | ✅ Yes |
| Sidebar badge counts (pipeline, approvals, watchlist) | BUILT | `83c2ebf` | 15 Jun | None | ✅ Yes |
| 4-theme × 2-mode design system (ThemeProvider) | BUILT | `6d6f108` | 15 May | None | ✅ Yes |
| ScreenGate two-layer access control | BUILT | `6d6f108` | 15 May | None | ✅ Yes |
| StubPage watermark on all 46 scaffold stubs | BUILT | `f79ef29` | 20 Jul | None | ✅ Yes |
| Breadcrumb navigation across all screens | BUILT | `b1840c3` | 15 Jun | None | ✅ Yes |
| Flash row animation on event bus updates | BUILT | `a00187e` | 18 Jun | None | ✅ Yes |

---

## PART 3 — CHRONOLOGICAL TIMELINE

### Week 1: 15–16 May 2026 — Foundation

| Date | Checkpoint | What Was Added |
|---|---|---|
| 15 May | `9f66eb6` | Initial project bootstrap |
| 15 May | `6d6f108` | ★ **Complete V4 architecture scaffold** — 63 screen keys, ScreenGate, 4-theme system, 8 agents, 20 services, full routing |
| 15 May | `c66f92a` | ScreenGate scaffold-mode fix — all 63 stubs navigable |
| 15 May | `d2d647f` | Fixed nested anchor error in AppShell |
| 15 May | `a1b117a` | Added contractRegistryService, 3 missing constants, reorganised page folders |
| 15 May | `5ef1177` | Applied 5 assessment fixes — screenRegistryService moved, userPreferenceService added, ScreenGate moved |
| 15 May | `1ece7b1` | Split document agents into 3 focused files; added surveyAgent.ts |
| 16 May | `27058ca` | Authoritative 63-screen scaffold with Screen Registry Spec V2 keys |
| 16 May | `d67a122` | Fixed onboarding screens (ON.1–ON.5) |
| 16 May | `64b5e79` | Root redirect / → /pipeline/dashboard; cleared Vite HMR cache |
| 16 May | `86e4db1` | Font system: Inter + JetBrains Mono; useDocumentExtraction hook |
| 16 May | `c4c8e4a` | RegistryProvider context; all 63 stubs render without spinner |

---

### Week 4: 11–12 June 2026 — FC-1 and FC-2 Core Build ✦

| Date | Checkpoint | What Was Added |
|---|---|---|
| 11 Jun | `59e9797` | ✦ **BATCH_SUBMITTED event bus wiring** — ExtractionQueue receives live batches from Pipeline |
| 11 Jun | `9883b9f` | Stabilise batchReference (useRef); PIPELINE_BATCH_CLEARED; Decline action in queue; URL param mode + Save Draft in Review & Group |
| 11 Jun | `4b3f113` | Step 2 template selection from 5 MOCK_EXTRACTION_TEMPLATES |
| 11 Jun | `d97661d` | target_record_id on StagedDocument; Target Record row in Document Detail Panel |
| 11 Jun | `2a253c9` | NotificationContext subscribes to BATCH_SUBMITTED — bell badge increments on submission |
| 11 Jun | `b26ead0` | FC-6 workflow stubs (Update/Review/Approval/Analysis) scaffolded |
| 11 Jun | `189d2c1` | Shared uploadSimulation.ts utility; drag-drop accepts real files |
| 12 Jun | `b7cfb81` | ★ **V3 Document Intake Governance** — binary valid/invalid model, Upload Modal rebuild, Table 3, Document Intelligence Panel, Package Composition, BATCH_SUBMITTED in-place, PipelineSubmitConfirm removed |
| 12 Jun | `e759f20` | Bug fixes: Package button only for staged docs; UploadDialog overflow fix |
| 12 Jun | `21fdf27` | Removed per-row Package button — packaging via bulk action only |
| 12 Jun | `9a7b9f1` | Committed docs excluded from all 5 stat card counts and sidebar badge |
| 12 Jun | `e3c8e2d` | Active/Committed tab bar in Stage Documents; Assign Record inline search |

---

### Week 5: 15 June 2026 — FC-3, FC-4, FC-5 Build Sprint ✦

| Date | Checkpoint | What Was Added |
|---|---|---|
| 15 Jun | `7d53032` | ✦ **FC-3 gap closure** — Change Role dialog, Remove from Package undo toast, PackagesReassembly sessionStorage, BR2 auto-detection |
| 15 Jun | `16236e8` | Add Document navigates to Pipeline with pre-populated record; PackagesFlags per-flag resolve |
| 15 Jun | `ed8a932` | Assignee filter pills; bulk reassign; Reassign button on packages and extraction queue rows |
| 15 Jun | `b00d4f8` | MOCK_REVIEWERS; Assigned To column in ApprovalsQueue; stage-aware reassign dialog |
| 15 Jun | `4d0d5fd` | SLA countdown chip with progress bar; bulk reassign toolbar; ApprovalsReview Reassign mid-review |
| 15 Jun | `5cb1b8a` | ApprovalsReview Reject pre-fills flagged fields; correction chain AI→Preparer→Reviewer; SLA progress bar |
| 15 Jun | `a535c4f` | ✦ **FC-4 locked documents** — locked_for_review field, amber tint, lock icon, Under Review badge |
| 15 Jun | `e79a7fa` | ✦ **FC-5 Financial + Open Items tabs** — ROU asset, amortization, deferred fields tracker; FC-6 one-click No-Change |
| 15 Jun | `3f8602a` | FC-5 Watchlist tab + star toggle; FC-6 Classification Gate with useParams; Snapshot Viewer Compare-to-Current |
| 15 Jun | `28a2f19` | ApprovalsReview + ApprovalsApprover data-driven from MOCK_TASKS_BY_ID; RecordsSearch My Watchlist view |
| 15 Jun | `7a8bd2e` | ApprovalsApprover + ApprovalsReview route params; Watchlist localStorage; Snapshot Viewer Swap button |
| 15 Jun | `83c2ebf` | Watchlist sidebar badge; ApprovalsQueue live filterByTab counts → sidebar Approvals badge |
| 15 Jun | `0914e39` | PipelineCountsContext seeded; ExportUploadTask data-driven from MOCK_UPLOAD_TASKS_BY_ID |
| 15 Jun | `b1840c3` | FC-7 export audit — UPLOAD_TASK_STARTED/COMPLETED events; RecordsDetail lock banner |
| 15 Jun | `5ae4bcb` | ✦ **FC-7 export flow** — TemplateSelection→Staging→Preflight→UploadTask threaded with ?task= param; overdue SLA bell badge |

---

### Week 5 (cont.): 16 June 2026 — Bug Fixes and Event Bus Wiring

| Date | Checkpoint | What Was Added |
|---|---|---|
| 16 Jun | `5f9bf18` | StatusBadge in ApprovalsQueue; context-aware breadcrumb in ExportUploadTask |
| 16 Jun | `c5ef778` | ✦ **REVIEW_COMPLETED + RECORD_APPROVED events** — ApprovalsQueue subscribes; rows flip to rejected/approved |
| 16 Jun | `2ec80b6` | Upgraded amendment detection — detectAmendmentFiles returns matched file names |
| 16 Jun | `42d6789` | ✦ **MOD-1–4** — DECLINE_SUBMITTED restoration, submission_path banner, contractType auto-selects template, Submit for Review wired in ExtractionVerification |

---

### Week 5 (cont.): 18–19 June 2026 — Demo Tour and FC-6/FC-8/FC-9

| Date | Checkpoint | What Was Added |
|---|---|---|
| 18 Jun | `a00187e` | Flash row animation on REVIEW_OPENED/REVIEW_COMPLETED/RECORD_APPROVED; ExportUploadTask record_title header |
| 19 Jun | `aef96ed` | ✦ **Amendment banner** wired to nav state; SuperAdminScreenRegistry deprecated filter; doc-7 gap filled |
| 19 Jun | `a5f9b95` | Amendment banner wired end-to-end (ExtractionQueue → Understanding → Strategy → AiWorkspace → Verification) |
| 19 Jun | `bd91f9e` | ★ **demoSteps v3** — expanded from 20 to 46 steps; all 9 FCs and 9 roles covered |
| 19 Jun | `6a53e16` | DemoOverlay solid white icons and role pill |
| 19 Jun | `1f0a9d2` | DemoOverlay icon opacity fix |

---

### Week 6: 20–21 June 2026 — Rework Loop and Demo Polish

| Date | Checkpoint | What Was Added |
|---|---|---|
| 20 Jun | `b79a988` | ⚑ **B-01 fix** — ExtractionVerification canSubmit gate now dynamic (was hardcoded 73/22) |
| 20 Jun | `9954f20` | ✦ **Rework banner** reads real rejection data from nav state |
| 21 Jun | `e3252f6` | ApprovalsReview decline passes rework state; 9-role switcher chips in DemoOverlay; Corrupted-Scan-Draft.pdf seed |
| 21 Jun | `3bf217f` | ✦ **3 follow-up items** — Retail-HQ-Lease-2026.pdf valid seed; ApprovalsApprover Decline for Rework inline form; DemoOverlay scroll position per role |

---

### Week 10: 20 July 2026 — Event Bus Completion and Polish

| Date | Checkpoint | What Was Added |
|---|---|---|
| 20 Jul | `1a56f8d` | ★ **G-01/G-02/G-03 fixed** — Complete Preparer→Reviewer→Approver event bus handoff |
| 20 Jul | `559e0d6` | G-05/G-06 route fixes; FC-6 workflow stubs rebuilt with real content; CF-01 DECLINE_SUBMITTED Approver path |
| 20 Jul | `f79ef29` | RECORD_APPROVED → RecordsDetail status+flash; Rework Required amber badge; StubPage watermark on 46 stubs |
| 20 Jul | `1f424f9` | Decline History "Declined By" indicator; RECORD_APPROVED mount-time initialiser in ApprovalsQueue |

---

## PART 4 — USER TESTING ROADMAP

**Total test sessions:** 8  
**Total estimated testing time:** 6.5–7.5 hours  
**Base URL:** https://3000-ijnmfy9rp2jv2024sh7rh-4b946ad0.us2.manus.computer

---

### DEMO DATA REFERENCE

| ID | Value | Used In |
|---|---|---|
| Approval task ID | `t1` | ApprovalsQueue, ApprovalsReview, ApprovalsApprover |
| Contract record ID | `r1` → CR-2026-0041 | RecordsDetail, ExtractionVerification |
| Upload task ID | `ut1` | ExportUploadTask |
| Export template | `t1` (New Lease Onboarding v3.2) | ExportTemplateSelection |
| External System ID (Upload Task Step 2) | `EXT-2026-0041` | ExportUploadTask |
| Confirmation Reference (Upload Task Step 2) | `CONF-20260516-0041` | ExportUploadTask |
| Role switcher | Sidebar header chip | All sessions |
| Demo reset | Demo Reset button (sidebar footer) | All sessions |

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 1: Document Upload and Pipeline**  
Estimated time: 50 minutes  
Role(s): document_submitter  
Starting URL: /pipeline/dashboard  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Click the Upload Documents button in the Pipeline Dashboard header.  
Expected result: The Upload dialog opens with 4 sections — Workspace, Document Type, Target Record, and Notes.  
Demo data: None required.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Drag a PDF file onto the upload zone (or click to browse). Observe the file validation animation.  
Expected result: File uploads, OCR simulation runs, and the file appears in Stage Documents (Table 1) with a Valid or Invalid badge.  
Demo data: Use any PDF file from your desktop.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Observe the two seed files already present: Retail-HQ-Lease-2026.pdf (Valid) and Corrupted-Scan-Draft.pdf (Invalid).  
Expected result: Both files appear in Table 1. Valid file has a green badge. Invalid file has a red badge.  
Demo data: Seed files are pre-loaded.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Click the eye icon on the Retail-HQ-Lease-2026.pdf row to open the Document Intelligence Panel.  
Expected result: Panel slides in from the right showing document metadata, OCR confidence, and the Target Record assignment section.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** In the Document Intelligence Panel footer, type "CR-2026" in the Assign Record search box.  
Expected result: Matching contract records appear as suggestions. Select one to assign it.  
Demo data: Type "CR-2026-0041".  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Select the Retail-HQ-Lease-2026.pdf row using the checkbox. Then click the Package button in the bulk action bar.  
Expected result: The Package Composition dialog opens showing the selected document with a role dropdown.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** In the Package Composition dialog, confirm the package. Observe the BATCH_SUBMITTED event.  
Expected result: The submission appears in Table 3 (Submissions). The notification bell increments. The document moves to the Committed tab in Table 1.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Click the Committed tab in Stage Documents.  
Expected result: The committed document appears in a read-only audit view with Contract Record link, uploader, and eye icon. It no longer appears in the Active tab.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** In Table 3, click the row for the submission you just created to open the detail panel.  
Expected result: Detail panel shows submission status, package reference, document list, and decline history.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 10:** Click the Review & Group button on a submission row.  
Expected result: The Review & Group screen opens. The URL includes a ?batch= parameter. A Save Draft button is visible.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Upload dialog, file validation, Document Intelligence Panel, target record assignment, bulk packaging, BATCH_SUBMITTED event, Committed tab, submission detail panel, Review & Group.  
Features NOT tested this session: Assignee reassign, locked documents (tested in Session 3).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 2: Extraction Queue and 5-Step Dialog**  
Estimated time: 45 minutes  
Role(s): preparer  
Starting URL: /extraction/queue  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Switch role to Preparer using the Role Switcher in the sidebar header.  
Expected result: The role chip in the sidebar header updates to show "Preparer". The sidebar navigation may show different items.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Navigate to the Extraction Queue. Observe the batch rows.  
Expected result: Batch rows appear with status, document count, workspace, and assignee. A Decline button is visible on each row.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Click the Process button on a batch row to open the 5-step Processing Workflow Dialog.  
Expected result: Dialog opens at Step 1 (Document Review). Amendment detection banner may appear if amendment files are detected.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Advance through Steps 1–5 of the dialog. At Step 2, select a different extraction template from the dropdown.  
Expected result: Step 2 shows 5 template options. Selecting a template updates the confirmation message with the template name and field count.  
Demo data: Select "New Lease Onboarding v3.2".  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** At Step 3, observe the submission_path banner.  
Expected result: A banner shows the submission path (workspace → package → batch reference).  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Complete Step 5 (Confirm). Observe the BATCH_SUBMITTED event.  
Expected result: Dialog closes. The batch row status updates. The notification bell may increment.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Navigate to Extraction Understanding (/extraction/understanding).  
Expected result: Screen shows an AI suggestion chip with a pre-matched record. A search box is visible.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Navigate through the extraction chain: Understanding → Strategy → AI Workspace → Verification.  
Expected result: Each screen loads with relevant mock data. The amendment banner appears at Understanding, Strategy, and Verification if amendment files are in nav state.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** On the Verification screen, review all 11 fields. Confirm or override each field.  
Expected result: As fields are confirmed, the progress counter updates. The Submit for Review button becomes enabled when all 11 fields are disposed and all 6 critical fields are confirmed.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 10:** Click Submit for Review.  
Expected result: SUBMIT_FOR_REVIEW event fires. Navigation goes to /approvals/queue. ⚠ WARNING: The queue will now show a new task at the top — this is the live event arriving from the Preparer role.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Extraction Queue, 5-step dialog, template selection, submission_path banner, amendment detection, Understanding/Strategy/AI Workspace/Verification chain, canSubmit gate, Submit for Review event.  
Features NOT tested this session: Manual Workspace (partial implementation), Reprocessing (stub).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 3: Approval Workflow — Reviewer Path**  
Estimated time: 50 minutes  
Role(s): reviewer  
Starting URL: /approvals/queue  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Switch role to Reviewer. Navigate to /approvals/queue.  
Expected result: Queue shows tasks with Status, Stage, SLA countdown, and Assigned To columns. A new task may be at the top if Session 2 was completed first.  
Demo data: Task ID t1 is pre-seeded.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Observe the SLA countdown chip on task t1.  
Expected result: Chip shows elapsed hours out of 48 with a progress bar. Red if under 4 hours remaining, yellow otherwise, "Overdue" if expired.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Select one or more task checkboxes. Observe the bulk reassign toolbar.  
Expected result: A toolbar appears at the top of the table with a Bulk Reassign button.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Click the Reassign button on task t1 (not bulk). Complete the reassign dialog.  
Expected result: Dialog opens with a stage-aware reviewer list. On confirm, dual notifications fire to the original assignee and document submitter.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** Click task t1 to open the Review Dialog (ApprovalsReview).  
Expected result: Review dialog opens showing contract data for task t1 (Office Tower — 350 Fifth Ave). The correction chain shows AI → Preparer trail.  
Demo data: Task t1.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Observe the Reject button. Click it.  
Expected result: The reject textarea is pre-filled with flagged fields and low-confidence fields from the extraction.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Complete the rejection with a comment (minimum 10 characters). Click Confirm Rejection.  
Expected result: REVIEW_COMPLETED event fires with outcome "rejected". Navigation goes to /approvals/queue. The task row flips to "Rejected" status with a flash animation.  
Demo data: Type "Rent commencement date is incorrect per amendment."  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Open task t1 again. This time, click Approve for Final.  
Expected result: A confirmation modal opens showing real record metadata (title, task reference, submitted-by, reviewer name).  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** Click "Open Approver Screen" in the modal.  
Expected result: APPROVE_FOR_FINAL event fires. Navigation goes to /approvals/final (ApprovalsApprover). In the background, the ApprovalsQueue task advances to "final_approval" stage.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 10:** Navigate back to /approvals/queue and observe the task status.  
Expected result: Task t1 now shows "final_approval" stage and "Pending" status.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Queue SLA chip, bulk reassign, Reassign mid-review, Review dialog, Reject with pre-filled fields, REVIEW_COMPLETED event, Approve for Final modal, APPROVE_FOR_FINAL event.  
Features NOT tested this session: Approver path (tested in Session 4).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 4: Approval Workflow — Approver Path and Rework Loop**  
Estimated time: 50 minutes  
Role(s): approver, preparer  
Starting URL: /approvals/final  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Switch role to Approver. Navigate to /approvals/final.  
Expected result: ApprovalsApprover screen shows contract data for the task. If Session 3 was completed, the task shows "final_approval" stage.  
Demo data: Task t1.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Click the "Decline for Rework" button.  
Expected result: An inline comments form appears below the button with a textarea and a Confirm Decline button.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Type a decline comment (minimum 10 characters) and click Confirm Decline.  
Expected result: DECLINE_SUBMITTED event fires. Navigation goes to /extraction/verify with rework state. The rework banner appears at the top of ExtractionVerification showing the Approver's name, date, comments, and flagged fields.  
Demo data: Type "Lease term end date does not match the executed agreement."  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Navigate back to /pipeline/dashboard. Observe Table 3.  
Expected result: The submission row now shows an amber "Rework Required" badge (distinct from the orange "Declined" badge). The Decline History panel shows "Declined By: Approver" in an amber panel.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** Switch role to Approver again. Navigate to /approvals/final. Click Final Approve.  
Expected result: RECORD_APPROVED event fires. Navigation goes to /records/r1 (RecordsDetail). The record status badge flips to "Approved" and a green "Record approved — all locks cleared." banner appears for 4 seconds.  
Demo data: Record r1.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Navigate back to /approvals/queue. Observe the task row.  
Expected result: Task t1 shows "Approved" status (green badge). This is the mount-time initialiser working — the task flips to Approved even though the queue was not mounted when the event fired.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Switch role to Preparer. Navigate to /extraction/verify. Observe the rework banner.  
Expected result: The rework banner shows the rejection data from Step 3 — Approver name, date, comments, and flagged field chips.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Approver Decline for Rework inline form, DECLINE_SUBMITTED event, rework banner with real data, Rework Required badge, Decline History "Declined By" indicator, Final Approve, RECORD_APPROVED event, RecordsDetail status flip, ApprovalsQueue mount-time initialiser.  
Features NOT tested this session: ApprovalsRework screen (navigate to /approvals/rework directly).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 5: Contract Records — Detail Tabs and Snapshot Viewer**  
Estimated time: 55 minutes  
Role(s): accountant, controller  
Starting URL: /records  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Navigate to /records. Switch role to Accountant.  
Expected result: Records search screen loads. A "My Watchlist" tab is visible alongside the main search results.  
Demo data: None.  
Known issue: Records Dashboard is partial — limited mock data depth.  
Pass / Fail: [ ]

**STEP 2:** Click the My Watchlist tab.  
Expected result: Watchlist shows all starred records from localStorage, sorted by priority with colour bar, reason, entry count, and Open button.  
Demo data: Star a record first if the watchlist is empty.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Navigate to /records/r1 (RecordsDetail for CR-2026-0041).  
Expected result: Record detail screen loads with 10 tabs: Overview, Financial, Documents, History, Reassessment, Open Items, Terms, Workflow, Agent, Watchlist.  
Demo data: Record r1.  
Known issue: Terms, Workflow, and Agent tabs have partial content.  
Pass / Fail: [ ]

**STEP 4:** Click the Financial tab.  
Expected result: ROU asset and lease liability tiles appear. An amortization schedule table is shown with cumulative totals.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** Click the Open Items tab.  
Expected result: Outstanding flags, action items, deferred fields tracker with age-based severity (green/amber/red), and pending corrections with accept/reject buttons.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Click the History tab. Click a "Compare to Current" button on any snapshot row.  
Expected result: Navigation goes to /records/r1/snapshots?snap=[snapId]. The Snapshot Viewer opens with the selected snapshot in the left panel and the current record in the right panel.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** In the Snapshot Viewer, click the Swap button (arrow icon).  
Expected result: The two panels exchange positions. A tooltip on the Swap button reads "Swap comparison direction".  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Navigate back to /records/r1. Click the Watchlist tab. Star the record.  
Expected result: A star icon appears. The sidebar Contract Records badge increments. The entry is saved to localStorage.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** Switch role to Controller. Navigate to /records/r1. Observe the lock status banner.  
Expected result: If the record is in "pending_approval" state, a lock banner appears at the top of the Overview tab.  
Demo data: None.  
Known issue: Lock banner only appears when the record is in the correct lock state — may need to complete Session 4 first.  
Pass / Fail: [ ]

**STEP 10:** Click the Export button on the Overview tab.  
Expected result: Navigation goes to /export/templates?record=r1. The export flow is pre-populated with the record ID.  
Demo data: Record r1.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Records Search, My Watchlist view, RecordsDetail 10 tabs, Financial tab, Open Items tab, History tab, Snapshot Viewer, Swap button, Watchlist star toggle, sidebar badge, lock banner, Export from RecordsDetail.  
Features NOT tested this session: RecordsCorrection (partial), RecordsDeferredTracker (tested in Session 7).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 6: Governed Export — Full Flow**  
Estimated time: 40 minutes  
Role(s): accountant  
Starting URL: /export/templates  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Navigate to /export/templates. Switch role to Accountant.  
Expected result: Three export templates are shown. Each has a description and a Select button.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Click Select on "New Lease Onboarding v3.2" (template t1).  
Expected result: Navigation goes to /export/staging?task=t1. The staging screen loads with the template name in the header.  
Demo data: Template t1.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** On the Staging screen, observe the document list and staging controls.  
Expected result: Documents are listed with checkboxes. A Proceed to Pre-Flight button is visible.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Click Proceed to Pre-Flight.  
Expected result: Navigation goes to /export/preflight?task=t1. A compliance checklist is shown with pass/fail indicators.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** On the Pre-Flight screen, observe all checklist items. Click Proceed to Upload Task.  
Expected result: Navigation goes to /export/tasks/ut1. The Upload Task screen loads with the task data for ut1.  
Demo data: Upload task ut1.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** On the Upload Task screen, advance through the 5 steps. At Step 2, enter the External System ID and Confirmation Reference.  
Expected result: Step 2 accepts EXT-2026-0041 and CONF-20260516-0041. The task advances to Step 3.  
Demo data: EXT-2026-0041, CONF-20260516-0041.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Complete all 5 steps of the Upload Task.  
Expected result: UPLOAD_TASK_COMPLETED event fires. Navigate to /records/r1 — the lock banner on the Overview tab should clear.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Navigate to /approvals/checkpoints (Agent Checkpoint Queue). Click a checkpoint row.  
Expected result: Checkpoint detail opens. An Export Record button is visible. Clicking it navigates to /export/templates?record=[recordId].  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Template selection, Export Staging, Pre-Flight checklist, Upload Task 5-step flow, UPLOAD_TASK_COMPLETED event, RecordsDetail lock banner clear, Checkpoint Queue export link.  
Features NOT tested this session: None.  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 7: Reassessment Cluster**  
Estimated time: 55 minutes  
Role(s): controller, lease_admin  
Starting URL: /reassessment  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Switch role to Controller. Navigate to /reassessment.  
Expected result: Reassessment Dashboard loads with portfolio summary and active case counts.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Navigate to /reassessment/surveys.  
Expected result: Survey Intake screen shows a list of surveys with response rates, status badges, and reminder buttons.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Navigate to /reassessment/trigger.  
Expected result: Trigger screen shows initiation controls with a concurrent case warning if applicable.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Navigate to /reassessment/sweep.  
Expected result: Period-End Sweep screen shows Tier 1/2/3 sweep configuration options.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** Navigate to /reassessment/classify.  
Expected result: Classification screen shows a 3-question sequential flow. The case context is loaded from the URL parameter (default: case-001).  
Demo data: Navigate to /reassessment/classify?case=case-001.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Navigate to /reassessment/cases. Find a case with "Initiated" status.  
Expected result: Case list shows all cases. Initiated-status rows have a three-dot menu with a "Confirm No Change" option.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Click "Confirm No Change" on an initiated case. Confirm the dialog.  
Expected result: Case status updates to "No Action Submitted". A success toast fires.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Navigate to /reassessment/cases/case-001/assess.  
Expected result: Assessment Workflow screen loads with case context, classification outcome, and assessment fields.  
Demo data: case-001.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** Navigate to /reassessment/watchlist.  
Expected result: Watchlist screen shows automated monitoring rules with trigger conditions and last-run timestamps.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 10:** Navigate to /workflows/reassessment/update.  
Expected result: Update Workflow screen loads with a case context header, state machine stepper, key data fields, and a primary action button. ⚠ NOTE: This screen has read-only content — no live actions are wired.  
Demo data: None.  
Known issue: No live actions — read-only content only.  
Pass / Fail: [ ]

**STEP 11:** Navigate to /workflows/reassessment/review, /approval, and /analysis.  
Expected result: Each screen loads with the same read-only layout pattern.  
Demo data: None.  
Known issue: No live actions — read-only content only.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Reassessment Dashboard, Survey Intake, Trigger, Sweep, Classification, Case List, No-Change confirmation, Assessment Workflow, Watchlist, 4 FC-6 workflow screens.  
Features NOT tested this session: Reassessment Memo (partial), Package Preview (partial).  
Blockers: None.

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**TEST SESSION 8: Administration, AI Agents, and Cross-Cutting**  
Estimated time: 55 minutes  
Role(s): lease_admin, auditor  
Starting URL: /admin/users  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**STEP 1:** Switch role to Lease Admin. Navigate to /admin/users.  
Expected result: Admin Users screen loads with a user list, role badges, and management controls.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 2:** Navigate to /admin/schema.  
Expected result: Field schema configuration screen loads with field definitions and type controls.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 3:** Navigate to /admin/templates.  
Expected result: Extraction template management screen loads with template list and field counts.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 4:** Navigate to /admin/thresholds.  
Expected result: Confidence threshold sliders appear for each field category. Adjusting a slider updates the displayed value.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 5:** Navigate to /admin/automation.  
Expected result: Automation screen loads with domain cards, automation level selectors (Manual/Assisted/Full Autonomous), and policy version history. A warning banner appears when Full Autonomous mode is selected.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 6:** Switch role to Auditor. Navigate to /admin/audit.  
Expected result: Audit Log screen loads with an append-only event log showing timestamps, event types, and user attribution.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 7:** Navigate to /approvals/checkpoints (Agent Checkpoint Queue).  
Expected result: Checkpoint queue loads with pending items, confidence scores, and Approve/Reject actions.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 8:** Navigate to /agents/monitor (Agent Activity Monitor).  
Expected result: Activity monitor loads with agent run log, status badges, and last-run timestamps.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 9:** Test the notification bell. Click the bell icon in the AppShell header.  
Expected result: Notification panel opens showing recent notifications. Badge count reflects unread items.  
Demo data: Complete Session 1 first to generate a BATCH_SUBMITTED notification.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 10:** Test the Demo Reset button (sidebar footer).  
Expected result: All demo state is cleared — event bus, localStorage watchlist, sidebar badge counts reset to defaults.  
Demo data: None.  
Known issue: None.  
Pass / Fail: [ ]

**STEP 11:** ◈ PHASE 2 — Navigate to /superadmin/registry (SuperAdmin Screen Registry).  
Expected result: Screen Registry loads showing all 63+ screens with enable/disable toggles and a deprecated filter. ⚠ NOTE: This screen requires SuperAdmin role and may not be reachable in standard navigation — use the URL directly.  
Demo data: None.  
Known issue: Requires SuperAdmin role. Not reachable from standard sidebar navigation for non-SuperAdmin roles.  
Pass / Fail: [ ]

**Session summary:**  
Features tested: Admin Users, Schema, Templates, Thresholds, Automation, Audit Log, Agent Checkpoint Queue, Agent Activity Monitor, Notification bell, Demo Reset, SuperAdmin Screen Registry (Phase 2).  
Features NOT tested this session: SuperAdmin Tenants (stub), SuperAdmin Platform (stub), Onboarding flow (stub).  
Blockers: SuperAdmin Screen Registry requires direct URL navigation for non-SuperAdmin roles.

---

## TESTING SUMMARY

| Session | Title | Role(s) | Time | Status |
|---|---|---|---|---|
| 1 | Document Upload and Pipeline | document_submitter | 50 min | [ ] |
| 2 | Extraction Queue and 5-Step Dialog | preparer | 45 min | [ ] |
| 3 | Approval Workflow — Reviewer Path | reviewer | 50 min | [ ] |
| 4 | Approval Workflow — Approver Path and Rework Loop | approver, preparer | 50 min | [ ] |
| 5 | Contract Records — Detail Tabs and Snapshot Viewer | accountant, controller | 55 min | [ ] |
| 6 | Governed Export — Full Flow | accountant | 40 min | [ ] |
| 7 | Reassessment Cluster | controller, lease_admin | 55 min | [ ] |
| 8 | Administration, AI Agents, and Cross-Cutting | lease_admin, auditor | 55 min | [ ] |

**Total estimated testing time: 6.5–7 hours**

### Known Stubs (Not Tested — Require Full Implementation)

The following screens display a diagonal "STUB" watermark and contain placeholder content only. They are excluded from the testing roadmap:

- PipelineNewRecordModal, PipelineValidation (FC-1)
- ExtractionReprocessing (FC-2)
- ExtractionManualWorkspace (FC-2, partial)
- RecordsDashboard (FC-5, partial)
- RecordsCorrection (FC-5, partial)
- ReassessmentMemo, ReassessmentPackagePreview (FC-6, partial)
- SuperAdminTenants, SuperAdminPlatform (FC-10)
- Onboarding flow — 5 screens (FC-10)
- All remaining 46 scaffold stubs across FC-1 through FC-10

### Phase 2 Screens (Require SuperAdmin Activation)

◈ The following screens are built but require SuperAdmin role or direct URL navigation:

- /superadmin/registry (SuperAdmin Screen Registry)
- Equipment Lease and Service Contract routes (future contract types — disabled via `{false && <></>}` guards in App.tsx)

---

## Part 3 — Chronological Build Timeline

This section traces the development of LeaseGov from initial scaffolding through the current checkpoint, derived from the git commit log (67 commits, May 15 – July 20, 2026) and the session handoff documents.

### Phase 1 — Scaffolding and Design System (May 15–16, 2026)

The project was initialised with the `web-static` template (React 19, Tailwind 4, shadcn/ui). The design philosophy was established as **Institutional Precision** — a dark-mode, data-dense government enterprise aesthetic using Geist Mono for data fields and Inter for body copy. The global CSS token system, `AppShell` sidebar, `ThemeProvider`, and `DemoOverlay` were built in this phase. The screen registry service and `ScreenGate` permission layer were scaffolded.

### Phase 2 — FC-1 Document Intake and FC-2 Extraction (May 16–22, 2026)

The full document intake pipeline was built: `PipelineDashboard` (Table 1/2/3 with BATCH_SUBMITTED event bus), `PipelineUpload` (drag-and-drop with binary valid/invalid seed files), `PipelineReviewGrouping` (batch assembly), `PipelineValidation` (OCR confidence gates), and `PipelineNewRecordModal`. The extraction cluster followed: `ExtractionQueue`, `ExtractionProcessing`, `ExtractionVerification` (22-field form with rework state), `ExtractionManualWorkspace`, `ExtractionStrategy`, `ExtractionTracker`, and `ExtractionUnderstanding`.

The V3 document intake governance model was implemented during this phase — replacing the earlier V2 multi-stage validation model with a single-pass binary valid/invalid gate and a BATCH_SUBMITTED handoff from `PipelineReviewGrouping` to `ExtractionQueue`.

### Phase 3 — FC-3 Approvals Core (May 22–31, 2026)

The approvals cluster was built: `ApprovalsQueue` (Reviewer and Approver tabs with badge counts), `ApprovalsReview` (22-field review form, decline-for-rework dialog, approve-for-final modal), `ApprovalsApprover` (final approval panel), `ApprovalsRework` (rework iteration banner), and `ApprovalsRecall`. The rework loop was wired end-to-end: Reviewer decline → `REVIEW_COMPLETED{outcome:'declined'}` → `ExtractionVerification` rework banner → Preparer resubmit → Reviewer re-review. The Approver decline path was added in a later session.

### Phase 4 — FC-4 Records and FC-5 Packages/Export (June 1–10, 2026)

The records cluster was built: `RecordsDashboard`, `RecordsDetail` (10-tab layout: Overview, Financials, Clauses, Documents, History, Amendments, Snapshots, Correction, Watchlist, Deferred), `RecordsSearch`, `RecordsSnapshotViewer`, `RecordsCorrection`, and `RecordsDeferredTracker`. The packages and export cluster followed: `PackagesDashboard`, `PackagesAssembly`, `PackagesReassembly`, `ExportDashboard`, `ExportUploadTask` (5-step compliance packet with PAC/SAC/DA/XBRL steps), and `ExportHistory`.

### Phase 5 — FC-6 Reassessment and FC-7 Audit (June 10–16, 2026)

The reassessment cluster was built: `ReassessmentDashboard`, `ReassessmentTrigger`, `ReassessmentSweep`, `ReassessmentClassification` (3-question sequential flow), `ReassessmentSurveyIntake`, `ReassessmentCaseList`, `ReassessmentAssessment`, `ReassessmentWatchlist`, `ReassessmentMemo`, `ReassessmentPackagePreview`, `ReassessmentContextualProject`, and `ReassessmentAssessmentWorkflow`. The audit cluster was built: `AdminAuditLog` (append-only, tamper-evident), `RecordsDeferredTracker` (age/severity matrix), and `AdminThresholds`.

A comprehensive test report (`TEST_REPORT_2026-06-16.md`) was produced at the end of this phase, identifying 12 screen-level warnings and 5 broken interactions.

### Phase 6 — FC-8 Admin and FC-9 Agent Oversight (June 16–20, 2026)

The admin cluster was built: `AdminDashboard`, `AdminUsers`, `AdminRoles`, `AdminWorkspaces`, `AdminThresholds`, `AdminAutomation`, `AdminAuditLog`, and `SuperAdminScreenRegistry`. The agent oversight cluster was built: `AgentActivityMonitor`, `AgentCheckpointQueue`, and `AgentDashboard`. The `DemoOverlay` was substantially upgraded with a 46-step guided tour covering all 9 roles.

### Phase 7 — Event Bus Hardening and Gap Closure (June 20 – July 20, 2026)

This phase addressed the critical event bus gaps identified in the June 22 build-state report and the July 20 regrounding report:

| Date | Checkpoint | Work |
|---|---|---|
| Jun 20 | `3bf217f0` | Valid seed file (Retail-HQ-Lease-2026.pdf), Approver decline rework state, DemoOverlay scroll persistence |
| Jun 22 | `1a56f8d6` | G-01/G-02/G-03: Full Preparer→Reviewer→Approver event bus handoff |
| Jun 22 | `559e0d6b` | G-05/G-06 route fixes, 4 FC-6 workflow stubs built, CF-01 DECLINE_SUBMITTED→PipelineDashboard |
| Jun 22 | `f79ef298` | RECORD_APPROVED→RecordsDetail, Rework Required badge, StubPage watermark (46 stubs) |
| Jul 20 | `1f424f99` | declineSource indicator, RECORD_APPROVED mount-time fix in ApprovalsQueue |

---

## Part 4 — User Testing Roadmap

This roadmap structures the testing of LeaseGov into five sessions, each targeting a distinct cluster of functionality. Each session is designed to be run by a single tester in 45–90 minutes using the DemoOverlay guided tour as the navigation aid.

### Session T-1 — Document Intake Pipeline (FC-1 + FC-2)
**Roles:** Preparer, Extraction Specialist  
**Duration:** ~60 minutes  
**Entry point:** `/pipeline/dashboard`

| Step | Action | Expected Result | Status |
|---|---|---|---|
| T-1.01 | Open PipelineDashboard as Preparer | Table 1 shows 3 documents; Table 3 shows 2 submissions | ✅ Built |
| T-1.02 | Click Upload Documents | PipelineUpload shows Retail-HQ-Lease-2026.pdf (Valid) and Corrupted-Scan-Draft.pdf (Invalid) side-by-side | ✅ Built |
| T-1.03 | Click "Continue to Review" | Navigates to PipelineReviewGrouping with both files | ✅ Built |
| T-1.04 | Assemble batch and submit | BATCH_SUBMITTED fires; ExtractionQueue badge increments | ✅ Built |
| T-1.05 | Switch to Extraction Specialist; open ExtractionQueue | New batch appears in queue | ✅ Built |
| T-1.06 | Open ExtractionProcessing | 22-field extraction form renders with mock data | ✅ Built |
| T-1.07 | Complete extraction and submit for review | SUBMIT_FOR_REVIEW fires; ApprovalsQueue badge increments | ✅ Built |
| T-1.08 | Open ExtractionUnderstanding | Search for "Retail"; AI suggestion chip appears | ✅ Built |

**Known issues:** None critical. Step T-1.08 search hint in demoSteps was corrected (was "Acme").

---

### Session T-2 — Approvals and Rework Loop (FC-3)
**Roles:** Preparer, Reviewer, Approver  
**Duration:** ~75 minutes  
**Entry point:** `/approvals/queue`

| Step | Action | Expected Result | Status |
|---|---|---|---|
| T-2.01 | Switch to Reviewer; open ApprovalsQueue | New task from T-1.07 appears in Pending tab | ✅ Built (G-01 fixed) |
| T-2.02 | Open ApprovalsReview | 22-field review form with all extraction data | ✅ Built |
| T-2.03 | Click "Decline for Rework" | Inline comment form appears; on confirm, navigates to ExtractionVerification with rework state | ✅ Built |
| T-2.04 | Switch to Preparer; open ExtractionVerification | Rework banner shows iteration count and Reviewer comments | ✅ Built |
| T-2.05 | Resubmit for review | Task returns to Reviewer queue | ✅ Built |
| T-2.06 | Reviewer clicks "Approve for Final" | APPROVE_FOR_FINAL fires; Approver queue shows new final_approval task | ✅ Built (G-02/G-03 fixed) |
| T-2.07 | Switch to Approver; open ApprovalsApprover | Final approval panel with record metadata | ✅ Built |
| T-2.08 | Click "Final Approve" | RECORD_APPROVED fires; RecordsDetail lock badge flips to Approved | ✅ Built |
| T-2.09 | Switch to Reviewer; return to ApprovalsQueue | Approved task shows "Approved" status in queue | ✅ Built (mount-time fix) |
| T-2.10 | Approver clicks "Decline for Rework" | Inline comment form; navigates to ExtractionVerification with Approver rework state | ✅ Built |
| T-2.11 | PipelineDashboard shows "Rework Required" badge | Submission row shows amber "Rework Required" badge (not orange "Declined") | ✅ Built |

**Known issues:** No "Completed" tab in ApprovalsQueue — approved tasks disappear from all filter tabs.

---

### Session T-3 — Records, Snapshots, and Corrections (FC-4)
**Roles:** Lease Accountant, Auditor  
**Duration:** ~60 minutes  
**Entry point:** `/records/dashboard`

| Step | Action | Expected Result | Status |
|---|---|---|---|
| T-3.01 | Open RecordsDashboard | Portfolio grid with status badges and search | ✅ Built |
| T-3.02 | Open RecordsDetail | 10-tab layout renders; Overview tab shows lock status | ✅ Built |
| T-3.03 | Open Snapshots tab | Snapshot list with version history | ✅ Built |
| T-3.04 | Click a snapshot | RecordsSnapshotViewer opens with field-level diff | ✅ Built |
| T-3.05 | Open Correction tab | RecordsCorrection form with amendment reason | ✅ Built |
| T-3.06 | Open Deferred tab | RecordsDeferredTracker with age/severity matrix | ✅ Built |
| T-3.07 | Switch to Auditor; open RecordsDeferredTracker | Deferred items with escalation flags | ✅ Built |
| T-3.08 | Open AdminAuditLog | Append-only log with tamper-evident hash column | ✅ Built |

**Known issues:** None critical.

---

### Session T-4 — Packages, Export, and Reassessment (FC-5 + FC-6)
**Roles:** Lease Accountant, Reassessment Analyst  
**Duration:** ~75 minutes  
**Entry point:** `/packages/dashboard`

| Step | Action | Expected Result | Status |
|---|---|---|---|
| T-4.01 | Open PackagesDashboard | Package list with status badges | ✅ Built |
| T-4.02 | Open PackagesAssembly | Document assembly with drag-and-drop ordering | ✅ Built |
| T-4.03 | Open ExportUploadTask | 5-step compliance packet (PAC/SAC/DA/XBRL/Submit) | ✅ Built |
| T-4.04 | Open ReassessmentDashboard | KPI cards and case list | ✅ Built |
| T-4.05 | Open ReassessmentTrigger | Trigger form with concurrent case warning | ✅ Built |
| T-4.06 | Open ReassessmentSweep | Period-end sweep with Tier 1/2/3 classification | ✅ Built |
| T-4.07 | Open ReassessmentClassification | 3-question sequential flow | ✅ Built |
| T-4.08 | Open ReassessmentSurveyIntake | Survey form with negotiation window | ✅ Built (route fixed) |
| T-4.09 | Open ReassessmentCaseList → case → Assessment | Assessment workflow with classification result | ✅ Built (route fixed) |
| T-4.10 | Open FC-6 workflow screens (Update/Review/Approval/Analysis) | Read-only content with workflow stepper | ✅ Built (stubs replaced) |

**Known issues:** ReassessmentMemo and ReassessmentPackagePreview are shallow (167–171 lines).

---

### Session T-5 — Admin, Agent Oversight, and Role Guards (FC-8 + FC-9)
**Roles:** Lease Admin, Auditor, SuperAdmin  
**Duration:** ~60 minutes  
**Entry point:** `/admin/dashboard`

| Step | Action | Expected Result | Status |
|---|---|---|---|
| T-5.01 | Open AdminDashboard as Lease Admin | System health KPIs and recent activity | ✅ Built |
| T-5.02 | Open AdminUsers | User list with role assignment | ✅ Built |
| T-5.03 | Open AdminThresholds | Confidence threshold sliders with save/reset | ✅ Built |
| T-5.04 | Open AdminAutomation | Automation domain cards with level selectors | ✅ Built |
| T-5.05 | Open AgentCheckpointQueue | Pending checkpoint list with approve/reject actions | ✅ Built |
| T-5.06 | Open AgentActivityMonitor | Real-time agent activity feed with filter | ✅ Built |
| T-5.07 | Switch to Auditor; attempt to access /admin/users | Redirected to /unauthorized | ✅ Built |
| T-5.08 | Open SuperAdminScreenRegistry | Screen registry with enable/disable toggles | ✅ Built |
| T-5.09 | Disable a screen; navigate to it | ScreenGate shows "Screen Disabled" state | ✅ Built |
| T-5.10 | Verify ADMIN sidebar group visibility | ADMIN group visible to all roles (no allowedRoles guard) | ⚠️ Known gap |

**Known issues:** T-5.10 — ADMIN sidebar group has no `allowedRoles` guard; non-admin roles see the ADMIN nav group (navigation is blocked by `AdminLayout` redirect, but the sidebar link is visible).

---

### Cross-Session Regression Checks

After completing all 5 sessions, run the following cross-session checks to verify event bus state is consistent:

| Check | Verify |
|---|---|
| CR-01 | PipelineDashboard Table 3 shows "Rework Required" (amber) for Approver declines and "Declined" (orange) for Preparer declines |
| CR-02 | ApprovalsQueue Reviewer tab shows "Approved" for tasks approved by the Approver (not blank/pending) |
| CR-03 | RecordsDetail lock badge shows "Approved" after RECORD_APPROVED fires |
| CR-04 | DemoOverlay scroll position is preserved when switching between roles |
| CR-05 | All 46 stub screens show the semi-transparent "STUB" watermark |
| CR-06 | demoSteps "Navigate" button does not land on NotFound for any of the 46 steps |

---

*Document generated: July 20, 2026 · Checkpoint 1f424f99 · 67 commits · 85 page files*
