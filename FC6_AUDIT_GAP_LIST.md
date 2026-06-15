# FC-6 Audit Gap List

Generated: 2026-06-15

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 4 |
| Medium | 4 |
| Low | 4 |
| **Total** | **12** |

---

## High Severity

### H1 — `ReassessmentAssessment` ignores `:id` route param (static `MOCK_CASE`)
- **File:** `ReassessmentAssessment.tsx` line 35
- **Issue:** `MOCK_CASE` is a top-level constant hardcoded to `c3` / `RC-2026-0012`. No `useParams` call. `contractRecordId` is also hardcoded to `'r1'` with a TODO comment.
- **Impact:** Navigating to `/reassessment/cases/c7/assess` shows Warehouse data instead of Office Tower data. The "Continue to Analysis" button navigates to the correct `MOCK_CASE.id` (`c3`) regardless of the actual URL param.
- **Fix:** Add `useParams<{ id }>()`, add `MOCK_CASES_LOOKUP` (same as Classification), resolve `MOCK_CASE` from param.

### H2 — `ReassessmentAnalysis` ignores `:id` route param (static `MOCK_CASE`)
- **File:** `ReassessmentAnalysis.tsx` line 29
- **Issue:** `MOCK_CASE` hardcoded to `c7` / `RC-2026-0008`. No `useParams`.
- **Fix:** Same pattern as H1 — add `useParams`, `MOCK_CASES_LOOKUP`, resolve from param.

### H3 — `ReassessmentMemo` ignores `:id` route param (static `MOCK_CASE`)
- **File:** `ReassessmentMemo.tsx` line 22
- **Issue:** `MOCK_CASE` hardcoded to `c7` / `RC-2026-0008`. No `useParams`.
- **Fix:** Same pattern as H1.

### H4 — `ReassessmentPackagePreview` and `ReassessmentRemediation` ignore `:id` param
- **Files:** `ReassessmentPackagePreview.tsx` line 21, `ReassessmentRemediation.tsx` line 25
- **Issue:** Both have static `MOCK_CASE` objects (c7 and c6 respectively). No `useParams`.
- **Fix:** Same pattern as H1 for both.

---

## Medium Severity

### M1 — Dead route: `navigate("/reassessment/survey-intake")` → route is `/reassessment/surveys`
- **Files:** `ReassessmentDashboard.tsx` lines 115, 213; `ReassessmentCaseList.tsx` lines 309, 325
- **Issue:** App.tsx registers the survey screen at `/reassessment/surveys` but all navigate calls use `/reassessment/survey-intake`. This is a 404 on click.
- **Fix:** Change all four `navigate("/reassessment/survey-intake")` calls to `navigate("/reassessment/surveys")`. Also fix the `?type=` query param pass-through: `navigate(\`/reassessment/surveys?type=${s.type}\`)`.

### M2 — Breadcrumb missing PARAM_ROUTE_PATTERNS for `/reassessment/cases/:id` sub-routes
- **File:** `Breadcrumb.tsx`
- **Issue:** Routes like `/reassessment/cases/c3/assess` match the static `{ prefix: '/reassessment/cases', label: 'Cases' }` entry and show `Reassessment / Cases` — missing the child crumb (e.g. "Assessment").
- **Fix:** Add 6 PARAM_ROUTE_PATTERNS entries: `classify → Classification`, `assess → Assessment`, `analysis → Analysis`, `memo → Memo`, `package → Package Preview`, `remediation → Remediation`.

### M3 — `ReassessmentDashboard` RECENT_ACTIVITY items not clickable / no case navigation
- **File:** `ReassessmentDashboard.tsx` lines 191–200
- **Issue:** Activity rows have `hover:bg-muted/20` styling suggesting interactivity, but no `onClick`. The `case_ref` values map to known case IDs in `ReassessmentCaseList` (`RC-2026-0014` → `c1`, etc.) but the row does not navigate.
- **Fix:** Add `caseId` field to each RECENT_ACTIVITY item mapping to the real case ID, add `onClick={() => navigate(\`/reassessment/cases/${a.caseId}/classify\`)}` and `cursor-pointer` class.

### M4 — `ReassessmentTrigger` MOCK_RECORDS use `r1/r2/r3` IDs inconsistent with records cluster
- **File:** `ReassessmentTrigger.tsx` lines 55–57
- **Issue:** The "Target Record" dropdown uses `id: "r1"`, `id: "r2"`, `id: "r3"` which match the records cluster IDs, but the contract numbers (`CR-2026-0088`, `CR-2026-0072`, `CR-2026-0055`) are correct. The selected record ID is not used in the success-state navigate call — it navigates to `/reassessment/cases` regardless. Low impact but inconsistent.
- **Fix:** Add a `navigate(\`/reassessment/cases\`)` on success (already done), but also add the newly created case ID to the navigate call when available (minor improvement).

---

## Low Severity

### L1 — `SuperAdminScreenRegistry` missing 10 FC-6 screen rows
- **File:** `SuperAdminScreenRegistry.tsx`
- **Issue:** Only `reassessment-dashboard` and `reassessment-watchlist` are registered. Missing: `reassessment-trigger`, `reassessment-sweep`, `reassessment-case-list`, `reassessment-classification`, `reassessment-assessment`, `reassessment-analysis`, `reassessment-memo`, `reassessment-package-preview`, `reassessment-remediation`, `reassessment-concurrent-warning`, `reassessment-survey-intake`, `reassessment-contextual-project`.
- **Fix:** Add all missing rows with correct route_paths from spec.

### L2 — Breadcrumb missing `/reassessment/trigger` and `/reassessment/dashboard` labels
- **File:** `Breadcrumb.tsx`
- **Issue:** `ROUTE_LABELS` has entries for sweep, cases, watchlist, survey, projects but not `trigger` or `dashboard` (the dashboard is the section root, but `trigger` is missing).
- **Fix:** Add `{ prefix: '/reassessment/trigger', label: 'Trigger' }` and `{ prefix: '/reassessment/dashboard', label: 'Dashboard' }` to ROUTE_LABELS.

### L3 — `ReassessmentWatchlist` uses `id: "r1"` for watchlist rule (same collision as FC-5 L1)
- **File:** `ReassessmentWatchlist.tsx` line 26
- **Issue:** Rule ID `"r1"` collides with record ID namespace. Should be `"wl-rule-001"` or similar.
- **Fix:** Rename to `"wl-rule-ra-001"` to distinguish from the PropertyLeaseRecordWatchlist rule.

### L4 — `ReassessmentAssessment` financial threshold comment has wrong value (`1_000_000_00` = $10M not $1M)
- **File:** `ReassessmentAssessment.tsx` line 137
- **Issue:** `MOCK_CASE.financial_impact_amount > 1_000_000_00` — the comment says "$1M threshold" but `1_000_000_00` is 100,000,000 cents = $1M only if the field is in cents. The comment is misleading.
- **Fix:** Add a clarifying comment: `// financial_impact_amount is stored in cents; 1_000_000_00 = $1,000,000`.
