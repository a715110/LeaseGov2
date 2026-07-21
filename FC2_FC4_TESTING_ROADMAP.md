# LeaseGov — User Testing Roadmap: FC-2 Extraction & FC-4 Approvals

**Document version:** 2026-07-21  
**Scope:** Feature Clusters 2 (Extraction Verification) and 4 (Approvals Queue, Review, and Final Approval)  
**Build checkpoint:** `3daf8d53`  
**Prepared by:** Manus AI

---

## Overview

This roadmap defines the end-to-end testing scenarios for all fixes and enhancements shipped across FC-2 and FC-4 in the current session. It is structured as a sequence of **pre-flight checks**, **scenario walkthroughs**, **cross-cluster integration tests**, and a **known-limitations register**. Each scenario includes a clear entry state, numbered steps, and the expected outcome so that a tester can execute it independently without prior knowledge of the implementation details.

---

## Pre-Flight Checklist

Before beginning any scenario, complete the following setup steps to ensure a clean, reproducible baseline.

| # | Action | Expected State |
|---|--------|---------------|
| 1 | Navigate to the app root and click **Reset Demo** in the sidebar | All pipeline, extraction, and approvals state returns to seed data |
| 2 | Confirm the Pipeline Dashboard (Table 1) shows exactly 4 staged documents | `Retail-HQ-Lease-2026.pdf`, `Office-Tower-Amendme...`, `Corrupted-Scan-Draft.pdf`, `Retail-Sublease-Notice....` |
| 3 | Navigate to `/approvals/queue` and confirm the **My Reviews** tab shows 4 rows | t1 (Pending), t2 (Opened), t4 (Rework), t7 (Resubmitted) |
| 4 | Confirm the **My Approvals** tab shows 2 rows | t3 (Pending), t5 (Pending) |
| 5 | Confirm the **My Submissions** tab shows 3 rows | t1, t4, t7 (submitted by J. Martinez) |
| 6 | Open browser DevTools → Application → Local Storage and confirm `leasegov_demo_events` key exists or is absent | Either state is acceptable; Reset Demo clears it |

---

## FC-2 Extraction — Testing Scenarios

### Scenario A: Multi-Page PDF Navigation

**Entry state:** Navigate to `/extraction/verify` (or open any job from the Extraction Queue).

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| A-1 | Observe the PDF panel header | Shows `‹ p.1/4 ›` with a disabled `‹` button and an enabled `›` button |
| A-2 | Click `›` | Page advances to 2; header reads `p.2/4`; content shows **Exhibit A — Premises Description** with a premises table (Suite 2400 / 2450, 24,500 SF total) |
| A-3 | Verify anchor highlights on page 2 | Blue anchor highlight appears over the `24,500 SF` cell; heatmap overlay is absent on page 2 |
| A-4 | Click `›` again | Page advances to 3; header reads `p.3/4`; content shows Exhibit B stub |
| A-5 | Click `›` again | Page advances to 4; header reads `p.4/4`; `›` button is now disabled |
| A-6 | Click `‹` three times | Page returns to 1; `‹` button is disabled; page 1 amendment body is restored |
| A-7 | On page 1, click any field row in the left panel | Anchor highlight appears on page 1; heatmap overlay is visible |
| A-8 | Navigate to page 2 and click a field row | Viewer stays on page 2; no scroll jump to page 1 |
| A-9 | Change zoom to 150% using the `+` button, then navigate pages | Page navigation works at all zoom levels; content scales correctly |

**Pass criteria:** All 9 steps produce the expected outcome without console errors.

---

### Scenario B: Field-to-Anchor Scroll Sync

**Entry state:** `/extraction/verify`, page 1, zoom at 100%.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| B-1 | Click the **Landlord Name** field row in the left panel | PDF panel smoothly scrolls so the blue anchor highlight for Landlord Name is vertically centred in the viewport |
| B-2 | Click **Base Rent Amount** | Smooth scroll to the rent section; anchor highlight moves to the rent line |
| B-3 | Click **Commencement Date** | Smooth scroll to the dates section; anchor highlight moves |
| B-4 | Click **Expiration Date** | Anchor highlight moves without a full-page jump |
| B-5 | Click **Amendment Effective Date** | Smooth scroll to the amendment section near the bottom of page 1 |
| B-6 | Reduce zoom to 75% and repeat B-1 | Anchor is still centred in the viewport at the smaller zoom level |
| B-7 | Navigate to page 2, then click a page-1 field in the left panel | Viewer navigates back to page 1 and scrolls to the correct anchor |

**Pass criteria:** Scroll is smooth (`behavior: smooth`), anchor is visible in the viewport after each click, and no field click causes a blank or mis-scrolled state.

---

### Scenario C: classificationResult Seeding (End-to-End)

**Entry state:** Extraction Queue (`/extraction/queue`). Open any pending job to trigger `ProcessingWorkflowDialog`.

#### C-1: Amendment filename → "Lease Amendment" badge

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| C-1a | Open a job whose filename contains "Amendment" (e.g. `Office-Tower-Amendment-3.pdf`) | `ProcessingWorkflowDialog` opens at Step 1 |
| C-1b | Observe Step 1 classification card | Classification badge reads **Lease Amendment** at ≥ 94% confidence |
| C-1c | Advance through all steps to completion | Dialog closes and navigates to `/extraction/verify` |
| C-1d | Observe the page header in ExtractionVerification | Two badge pills appear: **Template** (e.g. "Amendment Template v2.1") and **Classification** ("Lease Amendment · 94%") |

#### C-2: Commercial lease filename → "Commercial Lease" badge

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| C-2a | Open a job whose filename contains "Lease" but not "Amendment" (e.g. `Retail-HQ-Lease-2026.pdf`) | `ProcessingWorkflowDialog` opens at Step 1 |
| C-2b | Observe Step 1 classification card | Classification badge reads **Commercial Lease** at ~91% confidence |
| C-2c | Complete the workflow and check ExtractionVerification header | Classification badge reads "Commercial Lease · 91%" |

#### C-3: contractType prop override

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| C-3a | Open a job with `contractType` set to "Lease Renewal" via the upload modal | `ProcessingWorkflowDialog` opens |
| C-3b | Observe Step 1 classification | Badge reads **Lease Renewal** regardless of filename content |
| C-3c | Confirm ExtractionVerification header | Badge reflects "Lease Renewal" — prop takes precedence over filename heuristic |

**Pass criteria:** All three sub-scenarios produce the correct badge text and confidence value. No badge is blank or shows "Unknown".

---

### Scenario D: Submit for Review Button (Regression)

**Entry state:** `/extraction/verify`, at least one field marked as Accepted.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| D-1 | Click **Submit for Review** | `SUBMIT_FOR_REVIEW` event fires; toast "Submitted for review" appears |
| D-2 | Observe navigation | App navigates to `/approvals/queue` |
| D-3 | Check the My Reviews tab | A new task row appears at the top with status **Pending** and the record label from the submitted file |
| D-4 | Verify the tooltip on the Submit button when confidence threshold is not met | Button is disabled; tooltip reads "Raise confidence threshold to submit" |

---

## FC-4 Approvals — Testing Scenarios

### Scenario E: REVIEW_OPENED Badge — Reviewer Opens Task

**Entry state:** `/approvals/queue`, My Reviews tab. Task t1 shows status **Pending**.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| E-1 | Click **Open** on task t1 (Office Tower — 350 Fifth Ave) | Navigates to `/approvals/review/t1` |
| E-2 | Observe the `REVIEW_OPENED` event fires on mount | No visible action needed; event is published automatically |
| E-3 | Click the **×** button to return to `/approvals/queue` | Queue re-renders |
| E-4 | Observe task t1 in the My Reviews tab | Status badge reads **Opened** (blue, with pulsing dot); tooltip shows "Opened at HH:MM" |
| E-5 | Reload the page | Status badge still reads **Opened** (replayed from event history) |

**Pass criteria:** Badge updates live on return and persists after reload.

---

### Scenario F: REVIEW_OPENED Badge — Approver Opens Final Task

**Entry state:** `/approvals/queue`, My Approvals tab. Task t3 (Warehouse Lease) shows status **Pending**.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| F-1 | Click **Open** on task t3 | Navigates to `/approvals/final/t3` |
| F-2 | Return to `/approvals/queue` | Queue re-renders |
| F-3 | Switch to My Approvals tab | Task t3 status badge reads **Opened** |
| F-4 | Reload the page | Status badge still reads **Opened** |

**Pass criteria:** Final-approval tasks flip to Opened via the new `useEffect` publish added to `ApprovalsApprover`.

---

### Scenario G: Recall Availability Guard

**Entry state:** `/approvals/queue`, My Submissions tab. Task t1 shows **Recall** button enabled (green).

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| G-1 | Confirm task t1 Recall button is enabled | Green "Recall" button; tooltip reads "Recall available — reviewer has not opened" |
| G-2 | In a second browser tab, navigate to `/approvals/review/t1` | `REVIEW_OPENED` event fires |
| G-3 | Return to the first tab (My Submissions) | Task t1 Recall button is now **disabled** (red, 50% opacity); tooltip reads "Reviewer has opened this record at HH:MM" |
| G-4 | Reload the first tab | Recall button remains disabled |
| G-5 | Repeat G-2 to G-4 for a final-approval task (t3) via `/approvals/final/t3` | Recall button for t3 also disables after the Approver opens it |

**Pass criteria:** Recall disables immediately on `REVIEW_OPENED` and stays disabled after reload for both review-stage and final-approval tasks.

---

### Scenario H: Approver DECLINE_SUBMITTED → Pipeline Restoration

**Entry state:** `/approvals/final/t1` (or navigate from queue). At least 10 characters of decline comments entered.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| H-1 | Click **Decline for Rework** to open the inline form | Decline form expands |
| H-2 | Enter at least 10 characters of comments | Confirm button becomes enabled |
| H-3 | Click **Confirm Decline** | `DECLINE_SUBMITTED` event fires with `document_ids`, `perFileReasons`, `batchRef` (= task_reference), and `submissionId` (= record_id) |
| H-4 | Navigate to Pipeline Dashboard (`/pipeline/dashboard`) | The matching submission row in Table 3 (Contract Packages) shows status **Declined** |
| H-5 | Check Table 1 (Stage Documents) | The submission's files reappear as staged documents with status restored to their original valid/invalid state |
| H-6 | Confirm a toast notification appears | Toast reads "{packageNum} declined — Declined for rework by Approver" with file count |
| H-7 | Confirm a bell notification appears | Notification reads "{packageNum} declined — Declined for rework by Approver" |

**Pass criteria:** Files are restored to Table 1 without duplicates; submission row in Table 3 shows Declined; toast and notification both fire.

---

### Scenario I: my_approvals Tab Filter (Final-Approval Tasks)

**Entry state:** `/approvals/queue`, My Approvals tab.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| I-1 | Confirm seed tasks t3 and t5 appear in My Approvals | Both show `final_approval` stage with status Pending |
| I-2 | Open t3 (`/approvals/final/t3`) and return to queue | t3 status changes to Opened; t3 still appears in My Approvals tab |
| I-3 | Confirm tab badge count decrements only after Approve or Reject | Opening a task does not remove it from the tab |

**Pass criteria:** `['pending', 'opened']` filter correctly retains opened tasks in the My Approvals tab.

---

## Cross-Cluster Integration Test

This scenario exercises the full FC-2 → FC-4 handoff in a single continuous flow.

| Step | Action | Expected Outcome |
|------|--------|-----------------|
| X-1 | Upload a file via Pipeline Dashboard → Upload Files | File appears in Table 1 |
| X-2 | Group the file into a package and Submit All Ready | `BATCH_SUBMITTED` event fires; submission appears in Table 3 |
| X-3 | Navigate to Extraction Queue; open the new job | `ProcessingWorkflowDialog` opens; classification badge appears in Step 1 |
| X-4 | Complete all 5 steps; click Submit for Review | `SUBMIT_FOR_REVIEW` fires; app navigates to Approvals Queue |
| X-5 | In My Reviews tab, open the new task | `REVIEW_OPENED` fires; task flips to Opened |
| X-6 | Return to queue; confirm Recall button for the task is disabled | `recall_available` is false |
| X-7 | In ApprovalsReview, click Approve for Final | `APPROVE_FOR_FINAL` fires; task advances to final_approval stage |
| X-8 | In My Approvals tab, open the task | `REVIEW_OPENED` fires from ApprovalsApprover; task flips to Opened |
| X-9 | Click Final Approve | `RECORD_APPROVED` fires; task moves to Approved state |
| X-10 | Navigate to Pipeline Dashboard | Submission row shows Approved; no files remain in Table 1 for this batch |

**Pass criteria:** All 10 steps complete without errors, and each cross-role event correctly updates the corresponding UI state.

---

## Known Limitations Register

The following items are expected gaps in the current build and should **not** be filed as bugs unless explicitly noted.

| # | Area | Description | Workaround |
|---|------|-------------|------------|
| L-1 | FC-2 PDF Viewer | Anchor position percentages are calibrated for 100% zoom; slight drift may occur at very narrow viewports (< 900 px wide) | Test at ≥ 1280 px viewport width |
| L-2 | FC-2 PDF Viewer | Page 2 fields (premises_address, rentable_area_sqft) are not yet wired to the left panel field list | No workaround; scheduled for next session |
| L-3 | FC-2 ExtractionStore | Store resets on hard page reload (in-memory only); classification badge disappears after F5 | Navigate via the app rather than reloading |
| L-4 | FC-2 PDF Viewer | Pages 3 and 4 render Exhibit B/C stubs only; no extracted fields are anchored there | Expected — stub pages are placeholders |
| L-5 | FC-4 Approvals | `document_ids` in Approver DECLINE_SUBMITTED uses field IDs as a proxy; exact file-ID matching requires `ApprovalTaskSummary.document_ids` to be populated | PipelineDashboard falls back to `batchRef`/`submissionId` match which is reliable for seed data |
| L-6 | FC-4 Approvals | `APPROVE_FOR_FINAL` does not yet set `recall_available: false` | Recall button remains enabled after Approve for Final; scheduled for next session |
| L-7 | FC-4 Approvals | My Submissions tab hardcodes `submitted_by === "J. Martinez"`; live-submitted tasks use "Current User (Preparer)" | Switch role to Document Submitter to see live tasks |

---

## Regression Checklist

After completing all scenarios above, run the following quick regression checks to confirm no prior functionality was broken.

| Check | Route | Expected |
|-------|-------|----------|
| Pipeline Table 1 filters | `/pipeline/dashboard` | Workspace and preparer filters work; search filters file names |
| Pipeline DECLINE_SUBMITTED (Preparer) | Decline from ExtractionQueue | Files restored to Table 1; submission shows Declined |
| Extraction heatmap toggle | `/extraction/verify` | Heatmap overlay toggles on/off independently of page navigation |
| Extraction zoom controls | `/extraction/verify` | `+` / `−` buttons change zoom; content scales; navigation still works |
| ApprovalsReview Approve for Final | `/approvals/review/t1` | `APPROVE_FOR_FINAL` fires; task advances to final_approval in queue |
| ApprovalsApprover close button | `/approvals/final/t1` | `×` navigates back to `/approvals/queue` |
| Sidebar badge count | Any page | Approvals badge reflects actionable task count (pending + resubmitted + opened) |

---

*End of roadmap — LeaseGov FC-2 & FC-4 Testing Roadmap v1.0 · 2026-07-21*
