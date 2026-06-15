# FC-5 Audit Gap List

Generated: 2026-06-15

## Summary
- Critical: 0
- High: 4
- Medium: 5
- Low: 3

---

## HIGH Gaps

### H1 — `RecordsDashboard` RECENT_ACTIVITY navigates to `/records/a1` (non-existent IDs)
- **File:** `RecordsDashboard.tsx` line 134
- **Issue:** `navigate(\`/records/${item.id}\`)` uses `item.id` which is `"a1"`, `"a2"` etc. — not real record IDs. Should use a `recordId` field that maps to real IDs (`r1`, `r2`, etc.).
- **Fix:** Add `recordId` field to each `RECENT_ACTIVITY` item mapping to the known mock record IDs.

### H2 — `RecordsDashboard` EXCEPTION_QUEUE navigates to `/records/e1` (non-existent IDs)
- **File:** `RecordsDashboard.tsx` line 189
- **Issue:** Same problem — `item.id` is `"e1"`, `"e2"` etc., not real record IDs.
- **Fix:** Add `recordId` field to each `EXCEPTION_QUEUE` item.

### H3 — `PropertyLeaseRecordReassessment` navigates to `/reassessment/hub` (dead route)
- **File:** `PropertyLeaseRecordReassessment.tsx` line 75
- **Issue:** `/reassessment/hub` does not exist in `App.tsx`. The correct route is `/reassessment/dashboard`.
- **Fix:** Change to `navigate("/reassessment/dashboard")`.

### H4 — `RecordsDetail` ignores `?tab=` query param
- **File:** `RecordsDetail.tsx` — no `URLSearchParams` / `useSearch` usage
- **Issue:** `RecordsSearch` navigates to `/records/${row.recordId}?tab=watchlist` but `RecordsDetail` never reads the `?tab=` param, so the watchlist tab is never pre-selected.
- **Fix:** Read `?tab=` from `window.location.search` on mount and use it as the initial `activeTab` state.

---

## MEDIUM Gaps

### M1 — Breadcrumb missing PARAM_ROUTE_PATTERNS for `/records/:id` sub-routes
- **File:** `Breadcrumb.tsx`
- **Issue:** Routes like `/records/r1/add-document`, `/records/r1/correction`, `/records/r1/snapshots` match the static `/records` prefix and show `Records / Records` instead of `Records / Add Document` etc.
- **Fix:** Add PARAM_ROUTE_PATTERNS entries for these three sub-routes.

### M2 — `RecordsCorrection` stale route_path in `SuperAdminScreenRegistry`
- **File:** `SuperAdminScreenRegistry.tsx` line 70
- **Issue:** `route_path: '/records/correction'` — the actual App.tsx route is `/records/:id/correction`.
- **Fix:** Correct to `/records/:id/correction`.

### M3 — `RecordsSnapshotViewer` stale route_path in `SuperAdminScreenRegistry`
- **File:** `SuperAdminScreenRegistry.tsx` line 71
- **Issue:** `route_path: '/records/snapshot'` — the actual App.tsx route is `/records/:id/snapshots`.
- **Fix:** Correct to `/records/:id/snapshots`.

### M4 — `RecordsAddDocument` context card shows hardcoded `CR-2026-0088` regardless of `:id`
- **File:** `RecordsAddDocument.tsx` — `MOCK_RECORD_CONTEXT` is a static object
- **Issue:** The context card always shows "Office Tower — 350 Fifth Ave / CR-2026-0088" even when navigated from a different record.
- **Fix:** Add a `RECORDS_BY_ID` lookup (reusing the one from `RecordsSearch.tsx`) and resolve the context card from `recordId`.

### M5 — `RecordsCorrection` context card shows hardcoded `CR-2026-0088` regardless of `:id`
- **File:** `RecordsCorrection.tsx` — `MOCK_RECORD` is a static object
- **Issue:** Same as M4 — the correction modal always shows the same record regardless of the `:id` param.
- **Fix:** Resolve `MOCK_RECORD` from `recordId` using the shared lookup.

---

## LOW Gaps

### L1 — `PropertyLeaseRecordWatchlist` uses `rule_id: "r1"` (misleading mock ID)
- **File:** `PropertyLeaseRecordWatchlist.tsx` line 62
- **Issue:** `rule_id: "r1"` looks like a record ID but is actually a watchlist rule ID. Should be `"wl-rule-001"` to avoid confusion with record IDs.
- **Fix:** Rename to `"wl-rule-001"` and `"wl-rule-002"` for the second entry.

### L2 — `SuperAdminScreenRegistry` missing `records-add-document` and `records-deferred-tracker` rows
- **File:** `SuperAdminScreenRegistry.tsx`
- **Issue:** Both screens exist in App.tsx and have `SCREEN_KEYS` entries but are absent from the registry.
- **Fix:** Add two rows for `records-add-document` (`/records/:id/add-document`) and `records-deferred-tracker` (`/records/:id/deferred`).

### L3 — `RecordsSearch` `?watchlisted=true` query param is never consumed
- **File:** `RecordsSearch.tsx` — no `URLSearchParams` usage
- **Issue:** `RecordsDashboard` navigates to `/records?watchlisted=true` but `RecordsSearch` never reads this param to pre-filter the list.
- **Fix:** Read `?watchlisted=true` on mount and set the watchlist filter toggle to `true`.
