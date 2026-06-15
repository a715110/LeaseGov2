# LeaseGov — Demo Walkthrough Script
**End-to-End Contract Onboarding & Managed Upload Flow**

> **Purpose:** Reference guide for tonight's live demo. Covers the complete journey from Document Submitter uploading raw contract files through AI-assisted extraction, multi-stage approval, and managed upload to the external lease accounting system. Each step lists the URL, the active role, the key UI elements to highlight, and the talking points.

---

## Cast of Characters

| Role | What They Do in This Demo |
|---|---|
| **Document Submitter** | Uploads raw contract files, assigns them to extraction |
| **Preparer** | Picks up extraction jobs, runs AI workspace, verifies fields |
| **Reviewer** | Reviews extracted data, corrects discrepancies, forwards to Approver |
| **Approver** | Final sign-off; acknowledges deferred fields; releases record |
| **Preparer / Approver** | Drives the export and managed upload to external system |

---

## Demo Data Reference

| Entity | ID / Reference | Label |
|---|---|---|
| Batch submitted | `BATCH-2026-0042` | Retail workspace, 3 files |
| Primary extraction file | `Retail-HQ-Lease-2026.pdf` | JOB-2026-0441 |
| Amendment file | `Office-Tower-Amendment-3.pdf` | JOB-2026-0442 |
| Exhibit file | `Warehouse-Lease-Exhibit-A.tiff` | JOB-2026-0443 |
| Invalid file | `Corrupted-Scan-Draft.pdf` | JOB-2026-0440 (failed) |
| Contract Record | `CR-2026-0088` | Office Tower — 350 Fifth Ave |
| Approval Task | `AT-2026-0041` | task ID `t1` |
| Upload Task | `UT-2026-0041` | task ID `ut1` |
| Export Template | `New Lease Onboarding v3.2` | template ID `t1` |
| External System ID | `EXT-2026-0041` | (enter in Step 2 of upload task) |
| Confirmation Reference | `CONF-20260516-0041` | (enter in Step 2 of upload task) |

---

## Act 1 — Document Submitter: Upload & Submit

### Step 1 — Upload Contract Files
**URL:** `/pipeline/upload`  
**Role:** Document Submitter

Navigate to the Pipeline Upload screen. The screen presents a drag-and-drop zone with file validation cards. For this demo, upload five files:

- `Retail-HQ-Lease-2026.pdf` — Base Contract, 24 pages, 4.2 MB
- `Office-Tower-Amendment-3.pdf` — Amendment, 8 pages, 1.8 MB
- `Warehouse-Lease-Exhibit-A.tiff` — Exhibit, 12 pages, 6.1 MB
- `Corrupted-Scan-Draft.pdf` — will resolve as **invalid** (corrupted PDF header, OCR confidence 12%)
- `Ground-Lease-Base-Contract.pdf` — valid, but will be removed in the next step

**What to point out:**
- The upload zone accepts drag-and-drop or file picker input.
- Each file receives a real-time validation card showing status (`valid`, `warning`, `invalid`).
- The invalid file `Corrupted-Scan-Draft.pdf` immediately shows a red badge and an error message.
- The bottom action bar shows a count of invalid files and disables "Continue" until they are handled.
- Click **Continue to Review** to proceed (invalid files are carried forward but locked out of extraction).

---

### Step 2 — Validation Detail
**URL:** `/pipeline/validation`  
**Role:** Document Submitter

This screen shows the detailed validation report for `Office-Tower-Amendment-3.pdf`, which carries a **warning** status due to low OCR confidence (68% average, below the 80% threshold).

**What to point out:**
- Six validation categories are shown: Authentication, File Integrity, Security Scan, OCR Quality, Duplicate Check, and Contract Likeness.
- OCR Quality is the only failing category; all others pass.
- A per-page confidence bar chart reveals that pages 5 and 6 drop below 55% — the system flags these for manual review.
- The warning does not block the file from proceeding; the Preparer will be alerted during extraction.
- Click **Continue to Review** to advance to the grouping screen.

---

### Step 3 — Review Grouping
**URL:** `/pipeline/review`  
**Role:** Document Submitter

The Review Grouping screen divides files into two sections: **Extraction** (files that will be AI-processed) and **No Extraction** (files excluded or invalid).

**What to point out:**
- `Retail-HQ-Lease-2026.pdf`, `Office-Tower-Amendment-3.pdf`, and `Warehouse-Lease-Exhibit-A.tiff` are pre-assigned to the Extraction section.
- `Corrupted-Scan-Draft.pdf` is locked to No Extraction with a padlock icon — it cannot be moved.
- `Ground-Lease-Base-Contract.pdf` can be dragged from Extraction to No Extraction to exclude it from this batch.
- Each file card shows its document role (Base Contract, Amendment, Exhibit) which can be edited inline.
- The package name can be renamed inline at the top of the Extraction section.
- Click the **Confirm Submission** button (bottom-right) to open the Submission Summary panel.

**Submission Summary panel:**
- Shows the three extraction files, the package name, and the submission mode.
- Click **Confirm Submission** inside the panel to fire the `BATCH_SUBMITTED` event.
- A success toast appears: *"Package submitted for extraction — 3 files queued."* with a **View Queue** action link.
- The screen navigates back to the Pipeline Dashboard; the sidebar Extraction badge increments.

> **Note:** In this demo build, the batch reference is generated dynamically on submission. For the demo, navigate directly to `/extraction/queue` after submission to pick up the pre-seeded `BATCH-2026-0042` jobs.

---

## Act 2 — Preparer: Extraction Workspace

### Step 4 — Extraction Queue
**URL:** `/extraction/queue`  
**Role:** Preparer

The Extraction Queue lists all active processing jobs. The three jobs from `BATCH-2026-0042` are visible:

| Job ID | File | Status | OCR Confidence | Mode |
|---|---|---|---|---|
| JOB-2026-0441 | `Retail-HQ-Lease-2026.pdf` | `ocr_complete` | 94% | AI-Assisted |
| JOB-2026-0442 | `Office-Tower-Amendment-3.pdf` | `processing` | 68% | AI-Assisted |
| JOB-2026-0443 | `Warehouse-Lease-Exhibit-A.tiff` | `ocr_complete` | 91% | Hybrid |

**What to point out:**
- Each row shows the batch reference, workspace tag, OCR confidence, agent status, and assigned Preparer.
- `JOB-2026-0441` (Retail-HQ-Lease-2026.pdf) is the primary demo job — status `ocr_complete`, agent `complete`, 68/73 fields already extracted by the AI agent.
- Click the row to expand the job detail panel on the right, showing the per-page OCR confidence breakdown and the processing log.
- Click **Open in Workspace** to enter the extraction workflow for this job.

---

### Step 5 — Document Understanding
**URL:** `/extraction/understanding`  
**Role:** Preparer

The Document Understanding screen links the incoming file to an existing Contract Record in the system.

**What to point out:**
- The screen shows `Office-Tower-Amendment-3.pdf` as the active document (the AI workspace is file-centric).
- The Preparer searches for the target record — type "Office Tower" to surface `CR-2026-0088 — Office Tower — 350 Fifth Ave`.
- Select the record to associate the extraction with it.
- The OCR quality banner is shown at the top, repeating the 68% average confidence warning.
- Click **Confirm and Proceed** to advance to strategy selection.

---

### Step 6 — Extraction Strategy
**URL:** `/extraction/strategy`  
**Role:** Preparer

Three automation levels are offered: **Full Autonomous** (AI extracts all 73 fields automatically), **AI-Assisted** (AI extracts, Preparer reviews at checkpoints), and **Full Manual** (Preparer enters all values field by field).

**What to point out:**
- For this demo, select **AI-Assisted** — the recommended option for complex multi-document packages.
- The confidence threshold slider is visible; fields below the threshold will be flagged for manual review.
- Click **Begin Extraction** to launch the AI workspace.

---

### Step 7 — AI Extraction Workspace
**URL:** `/extraction/ai`  
**Role:** Preparer

This is the core extraction screen. The left panel lists all extracted fields grouped by category (Core Metadata, Financial, Property, Legal). The right panel shows the PDF viewer with anchor bounding-box overlays.

**What to point out:**
- Each field shows: the AI-extracted value, a confidence badge (green ≥ 80%, amber 60–79%, red < 60%), the anchor status (confirmed / proposed / missing), and the current disposition (accepted / corrected / not_found / deferred / null).
- **Key field to highlight — Base Rent Amount (f7):** AI extracted `$42,500/month` with 93% confidence, anchor confirmed. This is a critical field.
- **Expiration Date (f5):** AI extracted `null` — anchor is `missing`. The Preparer must manually enter the value or mark it deferred.
- **Rent Escalation (f8):** Confidence is 72% (amber) — the system flags it for review. The Preparer can accept the `3% annual` value or correct it.
- The Preparer works through each field: clicking **Accept** to accept the AI value, or clicking the edit icon to enter a corrected value (which changes the disposition to `corrected`).
- The anchor overlay in the PDF viewer highlights the bounding box for the selected field, providing visual evidence.
- The progress counter at the bottom shows disposed fields vs. total (e.g., "45 / 73 disposed").
- When all fields are disposed, click **Complete Extraction** to navigate to the Verification screen.

---

### Step 8 — Extraction Verification
**URL:** `/extraction/verify`  
**Role:** Preparer

The Verification screen is the final quality gate before the record is submitted for review. It mirrors the AI Workspace layout but adds confirmation controls for critical fields.

**What to point out:**
- The status bar at the bottom shows four counters: **Disposed** (must reach 73), **Critical Confirmed** (must reach 22), **Deferred**, and **Unresolved** (must reach 0).
- The **Submit for Review** button is disabled until all three gates are met.
- For each critical field (marked with a red `CRITICAL` badge), the Preparer must click **Confirm** to explicitly acknowledge the value.
- The heatmap toggle overlays a colour-coded confidence heat map on the PDF viewer.
- Once all 73 fields are disposed, 22 critical fields confirmed, and 0 unresolved, the **Submit for Review** button becomes active.
- Click **Submit for Review** to hand the record off to the Approvals queue.

> **Demo note:** The Submit for Review button in the current build does not navigate away on click — in a production integration it would POST to the backend and redirect to the queue. For the demo, after clicking the button, navigate manually to `/approvals/queue`.

---

## Act 3 — Reviewer: Approvals Review

### Step 9 — Approvals Queue
**URL:** `/approvals/queue`  
**Role:** Reviewer

The Approvals Queue lists all pending approval tasks. The notification bell in the top-right header shows an **amber badge** indicating overdue SLA tasks.

**What to point out:**
- The bell badge shows the count of overdue tasks. Click it to open the Notification Drawer, which lists SLA-overdue entries such as `AT-2026-0041 — Office Tower — 350 Fifth Ave — deadline May 18`.
- Each notification links directly to the relevant review screen.
- In the queue table, task `AT-2026-0041` (Office Tower — 350 Fifth Ave) is shown with:
  - Priority: **High**
  - Stage: **Review**
  - Status: **Pending**
  - SLA deadline: May 18, 2026 17:00 — overdue (shown in red)
- Click the **Open →** button on task `t1` to navigate to `/approvals/review/t1`.

---

### Step 10 — Approvals Review
**URL:** `/approvals/review/t1`  
**Role:** Reviewer

The Review screen shows the full extracted field set for the Office Tower record alongside the PDF viewer.

**What to point out:**
- The task header shows: `AT-2026-0041 · CR-2026-0088 · Office Tower — 350 Fifth Ave`.
- The SLA deadline is shown in the header with an overdue indicator.
- **Key field to highlight — Base Rent Amount (f7):** The AI originally extracted `$38,500/month` (72% confidence). The Preparer corrected it to `$42,500/month`. The field disposition shows `corrected` with a yellow flag.
- The comment thread at the bottom shows the Preparer's note: *"Base rent corrected per Amendment 3 — original lease shows $38,500 but Amendment 3 supersedes to $42,500."* The Reviewer has already replied: *"Confirmed. Amendment 3 Section 2.1 explicitly states the new rent."*
- **Security Deposit (f14):** Disposition is `deferred` — the value `$115,500` is pending landlord confirmation. This will require acknowledgment at the Approver stage.
- The Reviewer can make further corrections inline by clicking the edit icon on any field.
- The **Active Flags** card on the right summarises all rework-flagged fields.
- When satisfied, click **Approve for Final** (green button, top-right). A modal appears confirming the action and offering to navigate to the Approver screen.
- Click **Open Approver Screen** in the modal to navigate to `/approvals/final/t1`.

---

## Act 4 — Approver: Final Approval

### Step 11 — Approvals Approver (Final Approval)
**URL:** `/approvals/final/t1`  
**Role:** Approver

The Final Approver screen presents a summary view of the record for the Approver's sign-off.

**What to point out:**
- The summary card shows: task reference `AT-2026-0041`, record `CR-2026-0088 — Office Tower — 350 Fifth Ave`, Reviewer `M. Rodriguez`, submitted by `J. Martinez`.
- Key terms are displayed: Landlord `Fifth Ave Properties LLC`, Tenant `Acme Corporation`, Commencement `2022-01-01`, Expiration `2032-12-31`, Base Rent `$42,500/month`, Escalation `3.00% fixed annual`, Lease Term `132 months`.
- The Reviewer's comments are shown: *"Base rent corrected per Amendment 3 ($42,500/month). All critical fields verified. One deferred field: Security Deposit — pending landlord confirmation."*
- **Deferred field acknowledgment:** Because Security Deposit is deferred, a checkbox appears: *"I acknowledge that 1 field has been deferred and will require follow-up before the record is fully complete."* The **Final Approve** button is disabled until this checkbox is ticked.
- Tick the checkbox, then click **Final Approve** (green button). The screen navigates back to `/approvals/queue`.
- The record status advances to `approved`, unlocking the Export workflow.

---

## Act 5 — Export & Managed Upload

### Step 12 — Contract Record Overview
**URL:** `/records/r1`  
**Role:** Preparer or Approver

Navigate to the Contract Records detail screen for `CR-2026-0088 — Office Tower — 350 Fifth Ave`. The Overview tab is active by default.

**What to point out:**
- The record header shows the contract number, title, and current status (`approved`).
- The Overview tab displays key terms: Landlord, Tenant, Commencement, Expiration, Base Rent, Rentable Area (24,500 sqft), Lease Classification (Operating), Renewal Options (2 × 5yr).
- The ten tabs (Overview, Financial, Documents, History, Reassessment, Open Items, Watchlist, Terms, Workflow, Agent) can be navigated via URL: appending `?tab=financial` deep-links directly to the Financial tab.
- In the right-hand Quick Actions panel, click **Export Record** to begin the export flow.

---

### Step 13 — Export Template Selection
**URL:** `/export/templates?record=r1`  
**Role:** Preparer or Approver

The Template Selection screen shows available export templates. The record context card at the top confirms: `CR-2026-0088 — Office Tower — 350 Fifth Ave — Status: Approved`.

**What to point out:**
- Three templates are available: **New Lease Onboarding v3.2** (73 fields, 5 tabs), **Amendment / Modification v2.1** (41 fields, 3 tabs), and **Reassessment Memo / Recalculation v1.4** (28 fields, 2 tabs).
- Select **New Lease Onboarding v3.2** (template ID `t1`) — the correct template for a new lease record.
- The template card expands to show its tab structure: Cover Sheet (8 fields), Lease Terms (22 fields), Financial Summary (18 fields), Option Schedule (14 fields), Attestation (11 fields).
- Click **Proceed** to navigate to the Staging screen with `?task=ut1&record=r1` threaded through.

---

### Step 14 — Export Staging
**URL:** `/export/staging?task=ut1&record=r1`  
**Role:** Preparer or Approver

The Staging screen provides a triple-view layout: the template field mapping on the left, the record data in the centre, and the PDF viewer on the right.

**What to point out:**
- The staging bar at the top confirms: `UT-2026-0041 · CR-2026-0088 · New Lease Onboarding v3.2`.
- The template version is `3.2` — the system checks whether this matches the latest version and flags any outdated mappings.
- Each template tab (Cover Sheet, Lease Terms, etc.) can be selected to review the field-to-record mapping.
- Unmapped critical fields are highlighted in amber; the **Proceed to Pre-Flight** button is disabled if any critical fields remain unmapped.
- Once all critical fields are mapped, click **Proceed to Pre-Flight** to navigate to `/export/preflight?task=ut1&record=r1`.

---

### Step 15 — Export Pre-Flight
**URL:** `/export/preflight?task=ut1&record=r1`  
**Role:** Preparer or Approver

The Pre-Flight screen runs six sequential validation checks before the upload task can begin.

**What to point out:**
- The six checks are: Record Status (approved ✓), Template Version (current ✓), Field Completeness (all critical fields mapped ✓), Signature Authority (approver confirmed ✓), Compliance Packet (sealed ✓), and External System Connectivity (reachable ✓).
- Each check shows a pass (green), warning (amber), or fail (red) status. For this demo, all six pass.
- A failing check shows a specific reason and a **Fix** link that navigates back to the relevant screen (e.g., back to Staging if field completeness fails).
- The **Re-check** button re-runs all validations.
- Once all six checks pass, the **Begin Upload Task** button becomes active.
- Click **Begin Upload Task** to navigate to `/export/tasks/ut1`.

---

### Step 16 — Upload Task (5-Step Lifecycle)
**URL:** `/export/tasks/ut1`  
**Role:** Preparer or Approver

The Upload Task screen is the final step in the export flow. It presents a five-step sequential lifecycle for `UT-2026-0041`.

The task header shows: `UT-2026-0041 · CR-2026-0041 · New Lease Onboarding v3.2`. A lock banner is displayed: *"This file is locked. Any discrepancy with the external system must be declared as a deviation in Step 4."*

#### Step 1 — Download Generated File
- The export file `CR-2026-0041_NewLeaseOnboarding_v3.2.xlsx` is listed with its SHA-256 hash prefix for integrity verification.
- Click **Download Export File** to download the file and advance the task status to `in_progress`.

#### Step 2 — Upload to External System
- Instructions guide the user to log in to the external lease accounting system, navigate to Contracts → New Import, and upload the downloaded Excel file.
- Enter the **External System ID** in the input field: `EXT-2026-0041`
- Enter the **Confirmation Reference**: `CONF-20260516-0041`
- Click **Mark as Uploaded** to advance the task status to `evidence_submitted`.

#### Step 3 — Provide Upload Evidence
- A drag-and-drop zone accepts a screenshot of the external system showing the uploaded record.
- Upload any screenshot image file as evidence.
- Click **Submit Evidence** to advance the task status to `anchors_entered`.

#### Step 4 — Verify Data
- A side-by-side comparison table shows the Export File Values alongside the External System Values for four anchor fields: Commencement Date (`2024-01-01`), Expiration Date (`2034-12-31`), Base Rent Annual (`$2,400,000`), and IBR Rate (`4.25%`).
- If the values match, leave the **"I detected a discrepancy"** toggle off.
- Click **Confirm Verification** to advance the task status to `evidence_verified`.

#### Step 5 — Attest and Complete
- Two attestation documents must be read and acknowledged:
  - **PAC/SAC Attestation** (Preparers and Approvers Certification / Submitters Attestation Certificate): scroll to the bottom of the text, then tick the checkbox.
  - **DA Attestation** (Data Accuracy Attestation): scroll to the bottom, then tick the second checkbox.
- Both checkboxes must be ticked before the **Attest & Complete** button becomes active.
- Click **Attest & Complete** to seal the Compliance Packet and complete the task.

**Completion state:**
- A green success banner appears: *"Export Completed Successfully — Upload Task UT-2026-0041 · CompliancePacket sealed."*
- The Compliance Packet summary shows: Sealed at `2026-05-16 14:32:07 UTC`, Sealed by `J. Martinez`, External System ID `EXT-2026-0041`, Confirmation Reference `CONF-20260516-0041`.
- The record lock is released and the record status advances to `completed`.
- Click **Back to Record** to return to `/records/r1` and confirm the final status.

---

## Summary Flow Diagram

```
Document Submitter                     Preparer                        Reviewer / Approver
─────────────────────────────────────────────────────────────────────────────────────────
/pipeline/upload
  ↓ (Continue to Review)
/pipeline/validation
  ↓ (Continue to Review)
/pipeline/review
  ↓ (Confirm Submission → toast)
/pipeline/dashboard ──────────────→ /extraction/queue
                                      ↓ (Open in Workspace)
                                    /extraction/understanding
                                      ↓ (Confirm and Proceed)
                                    /extraction/strategy
                                      ↓ (Begin Extraction)
                                    /extraction/ai
                                      ↓ (Complete Extraction)
                                    /extraction/verify
                                      ↓ (Submit for Review)
                                    /approvals/queue ────────────────→ /approvals/queue
                                                                          ↓ (Open →)
                                                                        /approvals/review/t1
                                                                          ↓ (Approve for Final)
                                                                        /approvals/final/t1
                                                                          ↓ (Final Approve)
                                                                        /approvals/queue
                                                                          ↓ (navigate to records)
                                    /records/r1
                                      ↓ (Export Record)
                                    /export/templates?record=r1
                                      ↓ (Proceed)
                                    /export/staging?task=ut1&record=r1
                                      ↓ (Proceed to Pre-Flight)
                                    /export/preflight?task=ut1&record=r1
                                      ↓ (Begin Upload Task)
                                    /export/tasks/ut1
                                      ↓ (Attest & Complete)
                                    /records/r1  ← record status: completed
```

---

## Key Talking Points by Audience

### For Compliance Officers
- Every field disposition is tracked: accepted, corrected, not_found, or deferred — creating a full audit trail from AI extraction through human review.
- The PAC/SAC and DA attestations create an immutable compliance record retained for the duration of the contract plus seven years.
- SLA deadlines are surfaced proactively via the notification bell before tasks become overdue.

### For IT / Integration Teams
- The export flow threads a consistent `?task=` and `?record=` query parameter chain from template selection through to the upload task, enabling deep-linking and browser history navigation.
- The `publishEvent` / `subscribeToEvents` event bus allows cross-screen state propagation (e.g., `BATCH_SUBMITTED`, `REVIEW_OPENED`, `UPLOAD_TASK_STARTED`) without a backend in the current demo build.
- All mock data IDs (`ut1`, `r1`, `t1`) are designed to be replaced with real API responses in the production integration.

### For End Users (Preparers / Reviewers)
- The AI workspace pre-populates 68 of 73 fields automatically; the Preparer only needs to handle the remaining 5 and confirm the 22 critical fields.
- The Base Rent correction story (AI: `$38,500` → Preparer corrected to `$42,500` per Amendment 3) demonstrates how the system captures and surfaces human corrections for downstream reviewers.
- The five-step upload task provides a structured, auditable handoff to the external system with evidence capture at every stage.

---

## Suggested Follow-Up Improvements

The following three enhancements were identified during the audit sessions and are recommended for the next development sprint:

1. **Publish `REVIEW_OPENED` from `ApprovalsReview` on mount** — a single `useEffect` with `publishEvent({ type: 'REVIEW_OPENED', ... })` would flip the corresponding row in `ApprovalsQueue` from `pending` to `opened` in real time, completing the event-driven status feedback loop.

2. **`AgentCheckpointQueue` extraction checkpoint deep-link** — the "Open" button for extraction-type checkpoints should pass `contract_id` as a `?record=` query parameter when navigating to `/extraction/queue`, enabling the queue to pre-filter to the relevant batch.

3. **`RecordsDetail` browser back/forward tab sync** — adding a `popstate` listener alongside the existing `window.history.replaceState` call would keep the active tab in sync when the user navigates with browser back/forward buttons.
