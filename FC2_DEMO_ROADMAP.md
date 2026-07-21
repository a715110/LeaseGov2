# FC-2 Extraction — Demo & Testing Roadmap

**Scope:** Three improvements shipped in the 2026-07-21 session.
**Environment:** LeaseGov dev preview · Role: Document Submitter (default) or Extractor

---

## Pre-flight checklist

Before starting any scenario, confirm the following:

| Check | Expected state |
|---|---|
| Dev server running | Green indicator in Management UI |
| Role selector | Set to **Extractor** (top-right role pill) |
| Demo data loaded | Pipeline → Stage Documents shows ≥ 4 files including `Office-Tower-Amendment-3.pdf` |
| ExtractionStoreContext | Fresh page load (no stale store state from a previous session) |

---

## Scenario A — Multi-page PDF Navigation

**Goal:** Verify that the PDF viewer renders all 4 pages with correct content, navigation controls work, and anchor/heatmap overlays are correctly suppressed on pages 2–4.

### Steps

| # | Action | Expected result |
|---|---|---|
| A1 | Navigate to **Extraction → AI Workspace** (`/extraction/ai`) | Page loads with the left field panel and the right PDF panel |
| A2 | Observe the PDF panel header | Shows `‹ p.1/4 ›` with the filename `Office-Tower-Amendment-3.pdf` |
| A3 | Confirm `‹` (previous) button is **disabled** on page 1 | Button is greyed out / cursor: not-allowed |
| A4 | Confirm `›` (next) button is **enabled** | Button is active |
| A5 | Click `›` once | Page counter advances to `p.2/4`; document body changes to **Exhibit A — Premises Description** |
| A6 | Verify Exhibit A content | Heading "Exhibit A", premises table with Suite 2400 (18,200 SF), Suite 2450 (6,300 SF), Total 24,500 SF; two blue-highlighted anchor spans (address + rentable area) |
| A7 | Verify anchor highlight is **absent** on page 2 | No blue border overlay visible anywhere on the page |
| A8 | Toggle **Heatmap** button | Heatmap gradient overlay appears on page 2 (this is intentional — heatmap is a separate toggle from the anchor highlight) |
| A9 | Click `›` again | Advances to `p.3/4`; shows **Exhibit B — Building Rules and Regulations** stub text |
| A10 | Click `›` again | Advances to `p.4/4`; shows **Exhibit C — Form of Estoppel Certificate** stub text; `›` button is now disabled |
| A11 | Click `‹` three times | Returns to `p.1/4`; original amendment body (parties, rent table, signature block) is visible |
| A12 | Verify anchor highlight **reappears** on page 1 | Blue border overlay is visible, positioned at the active field's anchor |
| A13 | Change **Zoom** to 150% | Page width scales; page counter and navigation remain functional |
| A14 | Navigate to page 2 at 150% zoom | Exhibit A content scales proportionally; no layout breakage |

### Pass criteria

- All 4 pages render distinct content.
- `‹` disabled on page 1; `›` disabled on page 4.
- Anchor highlight visible on page 1 only.
- Heatmap overlay works on all pages.
- Zoom + page navigation are independent.

---

## Scenario B — Field-to-Anchor Scroll Sync

**Goal:** Verify that clicking a field row in the left panel smoothly scrolls the PDF panel so the active anchor highlight is centred in the viewport.

### Pre-condition

PDF viewer is on **page 1** (navigate back if needed). Zoom is at **100%** (default).

### Steps

| # | Action | Expected result |
|---|---|---|
| B1 | Observe the default active field | First field row is highlighted; anchor overlay is near the top of the document (~15–18% from top) |
| B2 | Click a field in the **Core Metadata** category (e.g. `lease_commencement_date`) | Left panel highlights the row; PDF panel scrolls smoothly so the anchor highlight is vertically centred |
| B3 | Click `base_rent_monthly` (Financial category) | Anchor jumps to ~42% position; PDF panel scrolls to keep it in view |
| B4 | Click `tenant_name` (Party category) | Anchor moves to ~32% position; scroll sync follows |
| B5 | Click `landlord_name` | Anchor moves to ~37% position |
| B6 | Click `rentable_area_sqft` | Anchor moves to ~64% position; panel scrolls down |
| B7 | Click `security_deposit` | Anchor moves to ~70% position (near bottom of document) |
| B8 | Click back to `lease_commencement_date` | Panel scrolls back up smoothly; anchor returns to top area |
| B9 | Set Zoom to **150%** and repeat B2–B5 | Scroll sync still works — the scroll target recalculates against the taller page height |
| B10 | Set Zoom to **75%** and repeat B2–B5 | Scroll sync still works at smaller page height |
| B11 | Navigate to **page 2**, then click any field | PDF panel stays on page 2 (page does not auto-switch); no scroll error |

### Pass criteria

- Every field click triggers a smooth scroll in the PDF panel.
- Anchor highlight moves to the correct vertical position for each field.
- Scroll sync is proportional — works correctly at all zoom levels.
- No scroll error or console warning when on pages 2–4.

---

## Scenario C — classificationResult Seeding (End-to-End Badge Flow)

**Goal:** Verify that opening `ProcessingWorkflowDialog` seeds `classificationResult` in `ExtractionStoreContext`, and that the resulting badge is visible in `ExtractionVerification`.

### Sub-scenario C1 — Amendment file (filename heuristic)

| # | Action | Expected result |
|---|---|---|
| C1.1 | Navigate to **Extraction → Queue** (`/extraction/queue`) | Queue shows staged jobs |
| C1.2 | Find the job for `Office-Tower-Amendment-3.pdf` and click **Process** (or the ▶ icon) | `ProcessingWorkflowDialog` opens at Step 1 |
| C1.3 | Observe that the dialog opens without error | Header shows `JOB-2026-0442 · Office-Tower-Amendment-3.pdf` |
| C1.4 | Close the dialog | Dialog closes |
| C1.5 | Navigate to **Extraction → AI Workspace** (`/extraction/verify`) | Page loads |
| C1.6 | Observe the **Classification badge** in the page header | Badge reads **Lease Amendment** with confidence ≥ 94% |
| C1.7 | Observe the **Template badge** | Badge reads the template name (e.g. `Lease Amendment v2.1`) if the MOD-3 auto-selection also ran |

### Sub-scenario C2 — Commercial lease file (default heuristic)

| # | Action | Expected result |
|---|---|---|
| C2.1 | Open `ProcessingWorkflowDialog` for `Retail-HQ-Lease-2026.pdf` | Dialog opens |
| C2.2 | Close the dialog | Dialog closes |
| C2.3 | Navigate to `/extraction/verify` | Classification badge reads **Commercial Lease** with confidence ~91% |

### Sub-scenario C3 — contractType prop override

| # | Action | Expected result |
|---|---|---|
| C3.1 | In Pipeline → Upload, upload any file and set **Contract Type** to **Lease Renewal** | File staged with `contract_type = lease_renewal` |
| C3.2 | Submit the package and open `ProcessingWorkflowDialog` from the Extraction Queue | Dialog opens |
| C3.3 | Close the dialog and navigate to `/extraction/verify` | Classification badge reads **Lease Renewal** with confidence ~94%, overriding any filename heuristic |

### Pass criteria

- Classification badge is populated after opening and closing the dialog (store persists across navigation).
- `documentType` label matches the file type (Amendment / Commercial Lease / Renewal / etc.).
- `confidence` value is between 0.85 and 0.97.
- `contractType` prop takes precedence over filename heuristic when both are present.
- Badge is absent (or shows a fallback) if `ExtractionVerification` is visited without ever opening the dialog.

---

## Regression checks

Run these after all scenarios to confirm no regressions were introduced.

| Check | Steps | Expected result |
|---|---|---|
| Submit for Review button | On `/extraction/verify`, dispose all fields and click **Submit for Review** | Toast fires, navigates to `/approvals/queue` |
| Heatmap toggle | Toggle heatmap on page 1 | Gradient overlay appears/disappears |
| Zoom controls | Click `+` / `−` buttons | Page width changes; all content remains readable |
| Field disposition | Click **Confirm** on any field | Field status updates to Confirmed; progress counter increments |
| Template badge (from FC-2 Gap 3) | Open dialog for an amendment file, select a template in Step 2, close, visit `/extraction/verify` | Template badge shows the selected template name and version |

---

## Known limitations (not bugs)

| Item | Notes |
|---|---|
| Anchor positions are approximate | `ANCHOR_TOP_PCT` values are calibrated for 100% zoom on a 1280px-wide viewport. At very narrow viewports the highlight may drift slightly. |
| Page 2 fields not in left panel | `premises_address` and `rentable_area_sqft` are shown as blue anchors on page 2 but are not yet wired to left-panel field rows. Clicking those fields does not navigate to page 2 automatically. |
| classificationResult resets on page refresh | The store is in-memory only. A hard refresh clears the badge until the dialog is reopened. |
| Pages 3–4 are stubs | Exhibit B/C show placeholder text only; no extracted fields or anchors are present. |
