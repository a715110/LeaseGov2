# FC-7 Export Cluster — Audit Gap List

**Screens audited:** ExportTemplateSelection, ExportStaging, ExportPreflight, ExportUploadTask
**Date:** 2026-06-15

---

## HIGH

### H1 — ExportStaging Back button drops ?record= param
**File:** `ExportStaging.tsx` line 299
**Detail:** `navigate("/export/templates")` — loses the `?record=` context that was threaded from `PropertyLeaseRecordOverview`. The user lands on the template selection screen with no record context, so the record context card falls back to `r1`.
**Fix:** Change to `navigate(\`/export/templates?record=${recordId}\`)` after reading `?record=` from `useSearch`.

### H2 — ExportStaging does not read or forward ?record= param
**File:** `ExportStaging.tsx` lines 100–115
**Detail:** The component reads `?task=` from `useSearch` but never reads `?record=`. The `?record=` param is forwarded from `ExportTemplateSelection` (`navigate(\`/export/staging?task=${taskId}&record=${recordId}\`)`), but `ExportStaging` ignores it. The record context bar only shows `taskMeta.record_id` (a contract number string like `CR-2026-0041`), not the full record title/status from `MOCK_RECORD_TITLES`.
**Fix:** Read `?record=` from `useSearch`, resolve `recordMeta` from `MOCK_RECORD_TITLES`, display it in the context bar, and forward `?record=` to `navigate(\`/export/preflight?task=${taskId}&record=${recordId}\`)`.

### H3 — ExportPreflight does not read or forward ?record= param
**File:** `ExportPreflight.tsx` lines 110–120
**Detail:** Same pattern as H2 — reads `?task=` but not `?record=`. The context bar shows only `taskMeta.record_id` (a contract number string). The "Back to Staging" button does not forward `?record=` back. The "Begin Upload Task" button navigates to `/export/tasks/${taskId}` without `?record=`.
**Fix:** Read `?record=`, forward it in both the Back and Begin Upload Task navigate calls.

### H4 — ExportUploadTask "Back to Record" navigates to /records/r1 (non-existent route)
**File:** `ExportUploadTask.tsx` line 231
**Detail:** `navigate(\`/records/${task.record_id}\`)` where `task.record_id` is `'r1'`, `'r3'`, or `'r5'`. These are valid record IDs in the records cluster, so the route `/records/r1` is actually correct — but the field name is confusing because it looks like a contract number. **Verdict: this is actually correct** — `r1`, `r3`, `r5` are the real record IDs used in `RecordsDetail`. No fix needed here.

---

## MEDIUM

### M1 — ExportPreflight fix_route for s2 does not include ?task= param
**File:** `ExportPreflight.tsx` line 55
**Detail:** `fix_route: "/export/staging"` — clicking "Return to Staging" from the failed check loses the `?task=` context, landing on staging with `ut1` fallback instead of the correct task.
**Fix:** Change `fix_route` to a dynamic value. Since `INITIAL_STEPS` is a static constant, the fix_route must be computed at render time. Replace the static `fix_route` in `INITIAL_STEPS` with a computed `steps` state that includes the task-aware fix route.

### M2 — SuperAdminScreenRegistry missing export-staging and export-preflight rows
**File:** `SuperAdminScreenRegistry.tsx` lines 72–73
**Detail:** Only `export-template-selection` and `export-upload-task` are registered. `export-staging` and `export-preflight` are missing.
**Fix:** Add two rows for `export-staging` (`/export/staging`) and `export-preflight` (`/export/preflight`).

### M3 — SuperAdminScreenRegistry export-upload-task has stale route_path
**File:** `SuperAdminScreenRegistry.tsx` line 73
**Detail:** `route_path: '/export/upload-task'` — the actual App.tsx route is `/export/tasks/:id`.
**Fix:** Change to `/export/tasks/:id`.

---

## LOW

### L1 — ExportPreflight hardcoded "CR-2026-0041 status: approved" in s6 detail
**File:** `ExportPreflight.tsx` line 83
**Detail:** The record status check detail always shows `CR-2026-0041 status: approved` regardless of which task/record is loaded. This should reflect `taskMeta.record_id`.
**Fix:** Make `INITIAL_STEPS` a function that accepts `taskMeta` and interpolates `taskMeta.record_id` into the `s6` detail string.

### L2 — Breadcrumb missing /export/upload-task entry (stale label)
**File:** `Breadcrumb.tsx` line 61
**Detail:** `{ prefix: '/export/tasks', label: 'Upload Task' }` — correct. But the SECTION_ROOTS entry for `/export` points to `/export` which has no route. Should point to `/export/templates` as the entry point.
**Fix:** Update `SECTION_ROOTS['/export']` from `/export` to `/export/templates`.

---

## Summary

| Severity | Count | Items |
|---|---|---|
| High | 3 | H1, H2, H3 (H4 is a false positive) |
| Medium | 3 | M1, M2, M3 |
| Low | 2 | L1, L2 |
| **Total** | **8** | |
