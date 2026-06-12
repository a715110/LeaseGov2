# LeaseGov — V3 Document Intake Governance Flow — Handoff Brief

**Checkpoint:** `b7cfb81e`
**TypeScript status:** Clean (0 errors)
**Date:** 2026-06-12

---

## 1. Files Created or Modified

| File | Action | What Changed |
|---|---|---|
| `client/src/lib/mockData.ts` | **Created** | `ContractRecord`, `MOCK_CONTRACT_RECORDS` (3 records), `PackageV3`, `SubmissionV3`, `MOCK_PACKAGES` (2 packages), `MOCK_SUBMISSIONS` (1 seed submission), `CONTRACT_RECORD_STATUS_BADGE/LABEL` helpers |
| `client/src/lib/uploadSimulation.ts` | **Modified** | Removed OCR/contract-likeness categories; aligned to V3 4-check model (format, size, duplicate, integrity); removed `warning` state; added deterministic invalid keywords (`corrupt`, `invalid`, `error`, `bad`, `scan_fail`) |
| `client/src/pages/pipeline/PipelineDashboard.tsx` | **Modified** | Added 4 new `StagedDocument` fields (`target_record_id`, `original_status`, `submission_path`, `submitter_context_notes`, `document_job_status`); replaced `MOCK_DOCUMENTS` with V3 8-doc seed distribution; updated Table 1 columns to V3 spec; updated Table 2 and Table 3 column headers and row rendering; wired `DocumentIntelligencePanel` |
| `client/src/components/pipeline/UploadDialog.tsx` | **Modified** | Full rebuild — 640px modal, 4 sections (File Upload, File List, Target Context with 3 radio cards, Routing Context), confirmation view with Upload ID; updated `onConfirm` callback to pass `target_record_id`, `submission_path`, `submitter_context_notes`, `contract_type` |
| `client/src/components/pipeline/DocumentIntelligencePanel.tsx` | **Created** | 400px right slide-in panel; shows document metadata, validation checks, target record chip, submission path badge, submitter context notes, document job status timeline |
| `client/src/pages/pipeline/PipelineReviewGrouping.tsx` | **Modified** | V3 `DocumentRole` enum (Base Contract, Amendment, Exhibit, Schedule, Supporting, Unassigned); Role Completeness badge in extraction section header; "Undo Package" replaces "Save Draft"; `BATCH_SUBMITTED` fires in-place on submit (no navigation to confirm page); target record typeahead uses `MOCK_CONTRACT_RECORDS` |
| `client/src/App.tsx` | **Modified** | Removed `PipelineSubmitConfirm` import and `/pipeline/confirm` route |
| `client/src/pages/extraction/ExtractionQueue.tsx` | **Modified** | "Open" button renamed to "Process" and wired to `ProcessingWorkflowDialog`; Decline dialog upgraded to shadcn `Dialog` with 5-option reason dropdown + notes textarea; amber warning banner added to decline dialog |
| `client/src/components/extraction/ProcessingWorkflowDialog.tsx` | **Modified** | Step 3 rebuilt with V3 single-pass simulation: "Run Extraction" button, 5 timed progress labels (0s/1s/3s/6s/8s), animated progress bar, `document_job_status` progression (`ocr_queued → ocr_processing → extraction_in_progress → verification_pending`), extraction log timeline |
| `todo.md` | **Created** | Full V3 implementation plan with 9 phases |
| `handoff_v3.md` | **Created** | This file |

---

## 2. V3 Spec Verification Checklist

| # | Check | Status |
|---|---|---|
| 1 | Upload modal opens over dashboard (no navigation) | ✅ |
| 2 | All 4 sections captured in one interaction | ✅ |
| 3 | Target Context has 3 radio cards (Existing Record, New Record, Unknown) | ✅ |
| 4 | Existing Record card shows typeahead returning `MOCK_CONTRACT_RECORDS` | ✅ |
| 5 | Invalid file does not block valid files | ✅ |
| 6 | `warning` validation state removed | ✅ |
| 7 | Confirmation view shows Upload ID | ✅ |
| 8 | Table 1 shows V3 8-doc seed distribution | ✅ |
| 9 | Eye icon opens Document Intelligence Panel (slide-in, no navigation) | ✅ |
| 10 | Table 2 shows mock packages with correct statuses | ✅ |
| 11 | Table 3 shows submissions | ✅ |
| 12 | Package Composition: V3 role enum in dropdown | ✅ |
| 13 | Role Completeness badge updates as roles assigned | ✅ |
| 14 | "Submit for Extraction" enabled when target record set | ✅ |
| 15 | `BATCH_SUBMITTED` fires from Package Composition (not upload) | ✅ |
| 16 | Package moves to Table 3 after submit | ✅ |
| 17 | `/pipeline/confirm` route removed | ✅ |
| 18 | Processing Queue "Process" button opens 5-step dialog | ✅ |
| 19 | Step 2 uses V3 single-pass progress labels | ✅ |
| 20 | Step 3 `document_job_status` progresses correctly | ✅ |
| 21 | Decline dialog has 5-option reason dropdown | ✅ |
| 22 | Decline dialog requires both reason + notes (min 10 chars) | ✅ |
| 23 | Decline toast shows reason category | ✅ |
| 24 | TypeScript: 0 errors | ✅ |

---

## 3. Deviations from Spec

| Item | Spec | Actual | Reason |
|---|---|---|---|
| Status restoration on Decline | `doc.status = doc.original_status`, returns to Table 1 | Decline sets `job.status = 'declined'` in the queue mock; Table 1 restoration requires a shared event bus payload with document IDs, which are not yet in the `BATCH_SUBMITTED` payload | The queue and dashboard are currently separate state islands. Full restoration requires Phase 4 of a future session to wire the `DECLINE_SUBMITTED` event through `eventBus` back to `PipelineDashboard` state. |
| Amendment detection banner (Step 2) | Amber banner after extraction if `submission_path = 'existing_record'` | Not yet implemented | Requires `submission_path` to be passed into `ProcessingWorkflowDialog` props. Carry-forward item. |
| Step 1 template pre-selection from upload modal | Pre-select template based on contract type selected at upload | Not yet implemented | Requires `contract_type` to be passed from upload modal → package → workflow dialog props chain. Carry-forward item. |

---

## 4. Carry-Forward Items

1. **Status restoration event bus** — Wire `DECLINE_SUBMITTED` event from `ExtractionQueue` → `PipelineDashboard` so declined documents return to Table 1 with `original_status`.
2. **Amendment detection banner** — Pass `submission_path` into `ProcessingWorkflowDialog` props; show amber banner in Step 3 after extraction completes if `submission_path === 'existing_record'`.
3. **Step 1 template pre-selection** — Pass `contract_type` from upload modal through package state into `ProcessingWorkflowDialog`; auto-select matching template in Step 2.
4. **Table 3 eye icon** — Detail panel for submitted packages (currently shows placeholder).
5. **Unsubmit action** — Table 3 "Unsubmit" button to return package to Table 2 with status restoration.
