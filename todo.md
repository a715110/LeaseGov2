# LeaseGov — V3 Document Intake Governance Implementation Plan

**Reference documents:**
- `/home/ubuntu/upload/pasted_file_koySF6_DOCUMENT_INTAKE_GOVERNANCE_FLOW_V3.md`
- `/home/ubuntu/upload/pasted_file_25tKIo_IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE_V3.md`

**Baseline checkpoint:** `189d2c1e` (TypeScript: 0 errors, Prompts 1–12 complete)

**Governing rule:** V3 supersedes V2 for FC-1 and FC-2. FC-3 through FC-10 are unaffected.

---

## PHASE 1 — PLAN WRITTEN ✅

Plan written to this file. Confirmed by user. Ready to execute.

---

## PHASE 2 — CHANGE 1: MOCK DATA UPDATE

**Target files:**
- `client/src/pages/pipeline/PipelineDashboard.tsx` (StagedDocument interface + MOCK_DOCUMENTS)
- `client/src/lib/uploadSimulation.ts` (remove `warning` validation state)
- New: `client/src/lib/mockData.ts` (shared MOCK_CONTRACT_RECORDS + MOCK_PACKAGES)

### 2.1 — StagedDocument interface: add 4 new fields
- [ ] Add `original_status: 'valid' | 'invalid'` — set at upload, never changes
- [ ] Add `submission_path: 'new_record' | 'existing_record' | 'unknown_record' | null`
- [ ] Add `submitter_context_notes: string | null`
- [ ] Add `document_job_status: string` — mirrors DocumentJob state machine

### 2.2 — MOCK_DOCUMENTS: update 8 seed records per V3 distribution
- [ ] Doc 1, 2: `status='valid'`, `target_record_id=null`, `submission_path=null`, `document_job_status='staged'`
- [ ] Doc 3, 4: `status='valid'`, `target_record_id='mock-record-001'`, `submission_path='existing_record'`, `document_job_status='staged'`
- [ ] Doc 5, 6: `status='valid'`, `target_record_id='mock-record-002'`, `submission_path='new_record'`, `document_job_status='extraction_in_progress'`
- [ ] Doc 7: `status='invalid'`, `original_status='invalid'`, `target_record_id=null`, `validation_errors=["Unsupported file format"]`
- [ ] Doc 8: `status='valid'`, `target_record_id=null`, `submission_path='unknown_record'`, `submitter_context_notes='This is an amendment received from Acme Corp legal team. Not sure which record it belongs to.'`

### 2.3 — Create MOCK_CONTRACT_RECORDS (shared, 3 seed records)
- [ ] `mock-record-001`: CR-2026-0038 · Acme Corp · 123 Main St, New York NY 10001 · approved · operating_lease
- [ ] `mock-record-002`: CR-2026-0039 · Globex LLC · 456 Oak Ave, Chicago IL 60601 · under_review · finance_lease
- [ ] `mock-record-003`: CR-2026-0040 · Initech · 789 Pine Rd, Austin TX 78701 · draft · operating_lease

### 2.4 — Create MOCK_PACKAGES (shared, 2 seed packages)
- [ ] `mock-pkg-001`: PKG-2026-001 · target=mock-record-001 · status=submitted · 2 docs · submitted 2 days ago
- [ ] `mock-pkg-002`: PKG-2026-002 · target=mock-record-002 · status=assembly · 1 doc · not submitted

### 2.5 — Remove `warning` validation state from uploadSimulation.ts
- [ ] Remove `warning` from `StagedFile` status union type
- [ ] Remove any `warning` branch from `simulateFileLifecycle`
- [ ] Remove any `warning` badge/color from `UploadDialog.tsx` rendering
- [ ] Confirm only `uploading → validating → valid | invalid` states remain

### 2.6 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 3 — CHANGE 2: UPLOAD MODAL REBUILD

**Target files:**
- `client/src/components/pipeline/UploadModal.tsx` (new file, replaces/extends UploadDialog)
- `client/src/pages/pipeline/PipelineDashboard.tsx` (wire "Upload" button to new modal)

**Design constraints:**
- Width: 640px · Max height: 90vh with internal scroll
- Fixed sticky footer (Cancel / Save as Draft / Add to Pipeline)
- Opened as floating overlay over Pipeline Dashboard — never navigates away

### 3.1 — Section 1: File Upload zone
- [ ] Drag-drop zone: `border-2 border-dashed`, 120px height, Upload icon + "Drag files here or click to browse"
- [ ] "Click to Browse" opens native file picker (multi-select, accepts `.pdf,.docx,.jpg,.jpeg,.png,.tiff`)
- [ ] Max 100 MB per file enforced client-side
- [ ] Files appended to list below the drop zone (batches can be added repeatedly)
- [ ] Submission Summary bar (shown when ≥1 file): `Total · Uploading · Validating · Valid · Invalid` — live counts

### 3.2 — Section 2: File list with inline validation
- [ ] Each row: FileText icon · Filename (truncated) · File size · Status (animated) · Actions
- [ ] Validation states: `uploading` (progress bar) → `validating` (Loader2 spin) → `valid` (CheckCircle green) → `invalid` (XCircle red + reason)
- [ ] Validation checks (synchronous, no OCR): format, size, duplicate (hash filename+size vs staged docs), integrity (PDF magic bytes)
- [ ] Deterministic invalid simulation: filename contains `corrupt`, `invalid`, `error`, `bad`, `scan_fail` → INVALID "File integrity check failed"
- [ ] Actions: VALID → `×` remove; INVALID → RotateCcw retry + `×` remove
- [ ] "Remove all invalid" link shown above list when ≥1 invalid file exists
- [ ] Invalid files do NOT block valid files from proceeding

### 3.3 — Section 3a: Workspace selector (required)
- [ ] Label: "Workspace" · Select dropdown from mock workspace list
- [ ] Default: user's primary workspace (e.g., "Corporate Leasing")
- [ ] Required before "Add to Pipeline" is enabled

### 3.4 — Section 3b: Record Context radio cards (three options)
- [ ] Card 1 — "New Record" (Plus icon): "For a newly executed contract or one not yet in this system"
  - [ ] On select: reveals inline form — Record Name (optional, auto-generates CR-DRAFT-{YYYY}-{seq}), Counterparty (required), Property Address (required), Contract Type select (Property Lease · Equipment Lease · Service Contract, default Property Lease)
  - [ ] AI type hint: if any filename contains "Amendment" → show amber badge "Amendment detected"
- [ ] Card 2 — "Existing Record" (Search icon): "For an amendment, exhibit, or document for a current record"
  - [ ] On select: reveals search panel — text input (placeholder "Counterparty name, address, or contract number...")
  - [ ] Typeahead: on ≥2 chars, filter MOCK_CONTRACT_RECORDS; show result rows: contract number chip · counterparty · address · status badge
  - [ ] Selected record shown as removable accent chip; `×` on chip restores search input
- [ ] Card 3 — "Not sure — leave instructions" (HelpCircle icon): "A Preparer will find the right record and may contact you"
  - [ ] On select: context notes textarea becomes required; show amber info banner "Your files will be held in staging until a Preparer assigns them to the correct record"
- [ ] Default (no card selected): document enters staging as Unassigned; context notes optional

### 3.5 — Section 4: Routing Context
- [ ] Comments/Instructions textarea (3 rows): placeholder "Describe what these documents are and any context that helps the person processing them..."
- [ ] Required when Card 3 selected; optional otherwise
- [ ] Assignee dropdown (optional): label "Assign to (optional)"; users with Preparer or Lease Admin role; default empty

### 3.6 — Modal footer (fixed, sticky bottom)
- [ ] `[ Cancel ]` ghost — closes modal, discards state
- [ ] `[ Save as Draft ]` outlined — saves under draft Upload ID, no staging entries created
- [ ] `[ Add to Pipeline ]` primary with Upload icon
  - [ ] Enabled when: ≥1 valid file AND workspace selected
  - [ ] Disabled with tooltip "Add at least one valid file to continue" when no valid files

### 3.7 — "Add to Pipeline" confirmation view
- [ ] Replace form content with: CheckCircle (large, success) + "N file(s) added to pipeline"
- [ ] Upload ID: `BATCH-{YYYY}-{seq}` in JetBrains Mono
- [ ] Record chip (or "Unassigned" or "Awaiting assignment")
- [ ] Two links: "Upload more files" (resets to Section 1) · "View in Dashboard" (closes modal)
- [ ] Create StagedDocument entries for valid files only
- [ ] Set `target_record_id`, `submission_path`, `submitter_context_notes` from modal state
- [ ] For "New Record": create draft ContractRecord shell (status='draft', source='pipeline_upload')
- [ ] **Do NOT fire BATCH_SUBMITTED here** — that fires only when a package is submitted for extraction

### 3.8 — Wire to Dashboard
- [ ] "Upload" button on PipelineDashboard opens the new UploadModal (not a page navigation)
- [ ] On "View in Dashboard" close: Table 1 (Staged Documents) refreshes to show newly added docs

### 3.9 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 4 — CHANGE 3: PIPELINE DASHBOARD ENHANCEMENTS

**Target file:** `client/src/pages/pipeline/PipelineDashboard.tsx`

### 4.1 — Table 1 (Staged Documents): Record column 4-state rendering
- [ ] `null`, no notes → `"— Unassigned"` muted + warning dot
- [ ] `null`, `submission_path='unknown_record'` → `"— Awaiting Assignment"` amber dot + tooltip showing context notes preview
- [ ] Draft record → draft chip (muted) + "Draft" badge
- [ ] Existing record → accent chip (e.g., CR-2026-0038), linked

### 4.2 — Table 1: Status badges
- [ ] `valid` → success badge
- [ ] `invalid` → error badge
- [ ] `packaged` → accent badge
- [ ] `committed` → muted badge (read-only row)

### 4.3 — Table 1: Context-sensitive actions per row
- [ ] Valid, unassigned: eye icon · "Package" · Remove
- [ ] Valid, assigned (not packaged): eye icon · "Package" · "View Record"
- [ ] Valid, packaged: eye icon · "View Package" (read-only)
- [ ] Invalid: eye icon · Retry · Remove
- [ ] Committed: eye icon · "View Record" (read-only)

### 4.4 — Table 1: Bulk actions
- [ ] Checkbox column added (only valid, unpackaged docs selectable)
- [ ] Selection bar: "N file(s) selected" + `[ Create Package ({N}) ]` button
- [ ] "Create Package" navigates to Package Composition screen with selected docs

### 4.5 — Table 1: Eye icon → Document Intelligence Panel
- [ ] Eye icon on each row opens `DocumentIntelligencePanel` (Phase 5)
- [ ] Panel slides in from right (400px, z-40); dashboard background remains visible

### 4.6 — Table 2 (Contract Packages): Role completeness badge
- [ ] "N/M roles assigned" — warning color if incomplete, success if all assigned

### 4.7 — Table 2: "Submit for Extraction" action
- [ ] Disabled until `target_record_id` is set AND ≥1 document has a role assigned
- [ ] On click: shows confirmation dialog "Submit N document(s) for extraction?"
- [ ] On confirm: fires `BATCH_SUBMITTED` via eventBus, package status → Submitted, entry appears in Table 3

### 4.8 — Table 3 (Submissions): New table — entire section is new
- [ ] Collapsible section header: "Submissions" with count badge
- [ ] Columns: Batch ID · Package · Target Record · Files · Submitted At · Status · Actions
- [ ] Status badges: Pending (muted) · In Progress (accent, animated dot) · Warning (warning) · Completed (success)
- [ ] Actions: Pending → eye icon + "Unsubmit" (error outlined); In Progress/Warning/Completed → eye icon only
- [ ] Seed Table 3 with `mock-pkg-001` (PKG-2026-001, Pending)

### 4.9 — Table 3: Submission Detail Slide Panel (eye icon)
- [ ] 600px right slide-in panel (same pattern as Document Intelligence Panel)
- [ ] Status banner (color-coded) · Metadata grid (Batch ID, Submitted by, Timestamp, File count)
- [ ] File list: filename · role badge · OCR confidence (after extraction)
- [ ] 4-step processing timeline: Submitted → Extracting → Verified → In Review (timestamps where available, muted dots for pending)
- [ ] "Unsubmit" footer action (Pending status only)

### 4.10 — BATCH_SUBMITTED listener: update to populate Table 3
- [ ] When `BATCH_SUBMITTED` fires, add entry to Table 3 (Submissions) with status=Pending
- [ ] Remove the existing `PipelineSubmitConfirm` page from the flow (see Phase 7)

### 4.11 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 5 — DOCUMENT INTELLIGENCE PANEL (new component)

**Target file:** `client/src/components/pipeline/DocumentIntelligencePanel.tsx`

### 5.1 — Panel shell
- [ ] 400px right slide-in panel: `translate-x` animation, z-40, semi-transparent backdrop
- [ ] Close `×` button in header
- [ ] Background dashboard content remains visible (not a full modal)

### 5.2 — Header section
- [ ] Filename · file type badge · upload timestamp · Close ×

### 5.3 — Document Preview section
- [ ] 2-column thumbnail grid using grey placeholder rectangles with page numbers
- [ ] Label: "N pages"

### 5.4 — Metadata Grid (2-col)
- [ ] File Size · Pages · Workspace · Record Target · Uploaded By · Batch ID

### 5.5 — Validation Results (4 rows)
- [ ] Format Check · Size Check · Duplicate Check · File Integrity
- [ ] Each row: icon + label + Pass/Fail badge
- [ ] Derive from `original_status` and `validation_errors`

### 5.6 — Context Notes card
- [ ] Shown only if `submitter_context_notes` is present
- [ ] Label: "Submitter's instructions" · full text of notes

### 5.7 — Status History timeline
- [ ] Compact timeline: Uploaded · Validated · Assigned (if applicable) · Packaged (if applicable) · Submitted (if applicable)
- [ ] Timestamps where available; pending steps as muted dots

### 5.8 — Footer Actions (context-sensitive)
- [ ] Unassigned: `[ Assign to Record ]` `[ Create New Record ]`
- [ ] Assigned, not packaged: `[ View Record ]` `[ Package Now ]`
- [ ] Invalid: `[ Retry Validation ]` `[ Remove ]`
- [ ] Committed: `[ View Record ]` (read-only)

### 5.9 — Wire to Table 1 eye icons
- [ ] Each row's eye icon passes the `StagedDocument` object to the panel
- [ ] Panel state managed in `PipelineDashboard` (selectedDoc + panelOpen)

### 5.10 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 6 — CHANGE 4: PACKAGE COMPOSITION SCREEN UPDATES

**Target file:** `client/src/pages/pipeline/PipelineReviewGrouping.tsx`

### 6.1 — Remove mode-awareness
- [ ] Remove `?mode=attach` / `?mode=create` URL param logic
- [ ] Screen is always in "compose" mode; context comes from navigation state (selected docs)

### 6.2 — Package header
- [ ] Package Name: inline editable (Pencil icon to edit), auto-generates as `PKG-{YYYY}-{seq}`
- [ ] Target Record: search chip (same typeahead as upload modal — filters MOCK_CONTRACT_RECORDS)
- [ ] "No record assigned" warning banner when target is unset
- [ ] "Submit for Extraction" button (top right): disabled until record set AND ≥1 doc in Extraction section with role assigned

### 6.3 — Document role dropdown per row (in Extraction section)
- [ ] Dropdown per row: Base Contract · Amendment · Addendum · Exhibit · Schedule · Notice · Supporting
- [ ] Role pill colored by type (distinct colors per role)
- [ ] Unassigned role shown as muted "— No role" placeholder

### 6.4 — Role Completeness badge
- [ ] "N/M roles assigned" badge in footer and package header
- [ ] Warning color (amber) if incomplete; success (green) if all assigned

### 6.5 — Undo Package button (footer left)
- [ ] "Undo Package" (slate outlined, Undo2 icon)
- [ ] Inline confirmation banner before deleting: "This will return all documents to Staged Documents. Continue?"
- [ ] On confirm: all docs return to Staged Documents with `doc.status = doc.original_status`, `target_record_id = null`, `submission_path = null`, `document_job_status = 'staged'`
- [ ] Toast: "{filename} returned to Staged Documents" per doc

### 6.6 — Submission footer (fixed 64px)
- [ ] "N file(s) will be extracted · M excluded" summary
- [ ] Role completeness: "N/M roles assigned" (warning if incomplete)
- [ ] `[ Save Package ]` — saves as Assembly status, returns to dashboard
- [ ] `[ Submit for Extraction ]` — disabled: no target record OR zero roles assigned

### 6.7 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 7 — REMOVE PipelineSubmitConfirm + RE-WIRE BATCH_SUBMITTED

**Target files:**
- `client/src/pages/pipeline/PipelineSubmitConfirm.tsx` (to be removed from flow)
- `client/src/pages/pipeline/PipelineReviewGrouping.tsx` (fire BATCH_SUBMITTED here)
- `client/src/App.tsx` (remove or redirect the `/pipeline/confirm` route)

### 7.1 — Wire BATCH_SUBMITTED to Package Composition "Submit for Extraction"
- [ ] On "Submit for Extraction" confirm in `PipelineReviewGrouping`: call `publishEvent({ type: 'BATCH_SUBMITTED', payload: { batchId, packageNum, fileCount }, sourceRole: 'document_submitter' })`
- [ ] Also fire `PIPELINE_BATCH_CLEARED` to reset staged docs state
- [ ] Package status → Submitted in local state
- [ ] Entry added to Table 3 (Submissions) in Dashboard state

### 7.2 — Remove PipelineSubmitConfirm from the active flow
- [ ] Remove navigation from `PipelineReviewGrouping` to `/pipeline/confirm`
- [ ] Remove the `/pipeline/confirm` route from `App.tsx` (or redirect to `/pipeline/dashboard`)
- [ ] Keep `PipelineSubmitConfirm.tsx` file on disk but mark it as deprecated (add comment at top)
- [ ] Ensure `NotificationContext` still receives `BATCH_SUBMITTED` (no change needed — it listens via eventBus)

### 7.3 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 8 — CHANGE 5: FC-2 PROCESSING QUEUE ENHANCEMENTS

**Target files:**
- `client/src/pages/extraction/ExtractionQueue.tsx` (Decline reason dropdown)
- `client/src/components/extraction/ProcessingWorkflowDialog.tsx` (Step 2 single-pass labels)

### 8.1 — Decline action: add reason dropdown
- [ ] Inline reason panel below the row (existing pattern from Prompt 5)
- [ ] Reason dropdown (5 options): "Wrong destination record" · "Duplicate submission" · "Incorrect document type" · "Insufficient context" · "Other"
- [ ] Notes textarea (required, existing)
- [ ] `[ Confirm Decline ]` button:
  - [ ] Sets package status → Rejected
  - [ ] Returns documents to Staged Documents: `doc.status = doc.original_status`, `target_record_id = null`, `submission_path = null`, `document_job_status = 'staged'`
  - [ ] Fires notification to DocSubmitter: "Your submission PKG-2026-001 was declined by [Preparer name]. Reason: [reason]"
  - [ ] Package moves to Rejected status in DocSubmitter's Table 2

### 8.2 — Step 2 (AI Extract): single-pass progress labels
- [ ] Replace multi-phase simulation with single-pass sequence (~8 seconds total):
  - [ ] 0s: "Preparing document…"
  - [ ] 1s: "Running OCR and reading document structure…"
  - [ ] 3s: "Extracting fields and placing evidence anchors…"
  - [ ] 6s: "Scoring confidence and checking critical fields…"
  - [ ] 8s: "Extraction complete — N fields extracted"
- [ ] DocumentJob status progression:
  - [ ] Click "Run Extraction" → `document_job_status = 'ocr_queued'`
  - [ ] After 1s → `'ocr_processing'`
  - [ ] After 3s → `'extraction_in_progress'`
  - [ ] After 8s → `'verification_pending'` (Step 3 unlocks)

### 8.3 — Step 2: DocumentJob.contract_record_id
- [ ] Set `DocumentJob.contract_record_id` at start of Step 2 using the package's `target_record_id`

### 8.4 — Step 2: Amendment detection banner
- [ ] After extraction completes, if `submission_path = 'existing_record'`: show amber banner "Amendment detected — N discrepancies found vs approved record"
- [ ] Pre-seed mock discrepancy count (e.g., 3)

### 8.5 — Step 1: Template pre-selection from upload context
- [ ] If DocSubmitter selected a Contract Type during upload, pre-select matching ExtractionTemplate in Step 1:
  - [ ] Property Lease → "Standard Commercial Lease v3.2"
  - [ ] Equipment Lease → "Equipment Lease v1.0"
  - [ ] Service Contract → "Service Contract v1.0"
- [ ] DocSubmitter's context notes shown as read-only info card in Step 1

### 8.6 — Status restoration consistency (Change 6)
- [ ] Decline (Processing Queue): `doc.status = doc.original_status`, `target_record_id = null`, `submission_path = null`, `document_job_status = 'staged'`
- [ ] Undo Package (Composition screen): same restoration (already in Phase 6.5)
- [ ] Unsubmit (Submissions table): same restoration
- [ ] Toast per doc: "{filename} returned to Staged Documents"

### 8.7 — TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors before proceeding

---

## PHASE 9 — TYPESCRIPT GATE, SMOKE TEST, CHECKPOINT, AND HANDOFF BRIEF

### 9.1 — Final TypeScript gate
- [ ] Run `pnpm tsc --noEmit` — must be 0 errors

### 9.2 — V3 Smoke test (24 checks)
**Upload flow:**
- [ ] 1. Click Upload on Pipeline Dashboard → modal opens (640px overlay, not navigation)
- [ ] 2. Drop 3 files → all start uploading → Submission Summary counts update live
- [ ] 3. Drop a file named "test_corrupt_doc.pdf" → resolves to Invalid with reason "File integrity check failed"
- [ ] 4. Invalid file does NOT block the 3 valid files
- [ ] 5. Select "Existing Record" card → type "Acme" → CR-2026-0038 appears as suggestion → select it → chip appears
- [ ] 6. Add context notes → select Assignee
- [ ] 7. Click "Add to Pipeline" → confirmation view with Upload ID (BATCH-{YYYY}-{seq})
- [ ] 8. Close modal → Table 1 shows 3 new docs with CR-2026-0038 chip

**Pipeline Dashboard:**
- [ ] 9. Table 1 shows seed distribution: 4 valid (2 unassigned, 2 assigned), 2 committed (read-only), 1 invalid, 1 unknown record
- [ ] 10. Eye icon on any row → Document Intelligence Panel slides in from right; dashboard background remains visible
- [ ] 11. Table 2 shows mock packages with correct statuses (Assembly + Submitted)
- [ ] 12. Table 3 shows PKG-2026-001 as Pending; eye icon opens Submission Detail Panel

**Package Composition:**
- [ ] 13. Select 2 valid docs from Table 1 → "Create Package" → opens composition screen
- [ ] 14. Assign roles to each doc → Role Completeness badge updates
- [ ] 15. Set Target Record → "Submit for Extraction" button enables
- [ ] 16. Submit → BATCH_SUBMITTED fires → package moves to Table 3 (no navigation to Confirm page)

**Processing Queue:**
- [ ] 17. Preparer switches to extraction queue → PKG-2026-001 visible
- [ ] 18. Click "Process" → 5-step dialog opens
- [ ] 19. Step 1: template auto-suggested from submission context
- [ ] 20. Step 2: click "Run Extraction" → single-pass progress labels → completes → Step 3 unlocks
- [ ] 21. Step 3: set threshold → flagged fields shown
- [ ] 22. Step 4: verify fields inline, evidence anchors navigate PDF
- [ ] 23. Step 5: Complete → SUBMIT_FOR_REVIEW fires
- [ ] 24. Click "Decline" on another queue item → reason dropdown expands → confirm decline → doc returns to Table 1 with original status

### 9.3 — Save checkpoint
- [ ] Checkpoint message: "V3 Document Intake Governance Flow complete — all 6 changes implemented, 24-check smoke test passed, TypeScript 0 errors"

### 9.4 — Write handoff brief
- [ ] Checkpoint hash + TypeScript status
- [ ] Every file created or modified — exact path + what changed
- [ ] Confirm all 10 verification items from IMPLEMENTATION_PROMPT spec
- [ ] Any deviations from spec with reason
- [ ] Carry-forward items

---

## FILE MANIFEST (expected changes)

| File | Action | Phase |
|---|---|---|
| `client/src/lib/mockData.ts` | CREATE — shared MOCK_CONTRACT_RECORDS, MOCK_PACKAGES | 2 |
| `client/src/lib/uploadSimulation.ts` | EDIT — remove `warning` state | 2 |
| `client/src/pages/pipeline/PipelineDashboard.tsx` | EDIT — StagedDocument interface, MOCK_DOCUMENTS, 3-table layout, Table 3, BATCH_SUBMITTED re-wire | 2, 4 |
| `client/src/components/pipeline/UploadModal.tsx` | CREATE — 4-section all-in-one modal | 3 |
| `client/src/components/pipeline/DocumentIntelligencePanel.tsx` | CREATE — 400px slide-in panel | 5 |
| `client/src/pages/pipeline/PipelineReviewGrouping.tsx` | EDIT — remove mode, role dropdown, completeness badge, Undo Package, Submit wiring | 6, 7 |
| `client/src/pages/pipeline/PipelineSubmitConfirm.tsx` | DEPRECATE — remove from active route, add deprecation comment | 7 |
| `client/src/App.tsx` | EDIT — redirect/remove `/pipeline/confirm` route | 7 |
| `client/src/pages/extraction/ExtractionQueue.tsx` | EDIT — Decline reason dropdown, status restoration | 8 |
| `client/src/components/extraction/ProcessingWorkflowDialog.tsx` | EDIT — Step 2 single-pass labels, Step 1 template pre-selection | 8 |

---

## EXECUTION RULES

1. Execute one phase at a time, only when explicitly instructed by the user.
2. Run `pnpm tsc --noEmit` before every checkpoint — must be 0 errors.
3. Save a checkpoint after each phase completes.
4. All navigation must use wouter `navigate(to, { state })` — never separate `window.history.pushState` before navigate.
5. BATCH_SUBMITTED must fire from Package Composition "Submit for Extraction" — NOT from upload and NOT from PipelineSubmitConfirm.
6. Design theme: Structured Authority (navy #1F3864 sidebar, Inter body + JetBrains Mono for IDs/codes).
7. Every page header must have `<ScreenNumberBadge screenKey={_screenKey} />`.

---

## SESSION 2026-07-21 — FC-1 PIPELINE GAP FIXES

- [ ] Re-read relevant LeaseGov session guidance before implementation
- [ ] Fix DECLINE_SUBMITTED restoration so declined documents reliably reappear in Table 1 even when document_ids is missing from the payload
- [ ] Replace the Table 3 Eye icon placeholder with a real submission detail panel
- [ ] Implement the amendment detection banner in ProcessingWorkflowDialog Step 3
- [ ] Implement template pre-selection from upload modal contract_type
- [ ] Run pnpm tsc --noEmit and confirm zero TypeScript errors
- [ ] Save a new checkpoint after all four fixes are complete
