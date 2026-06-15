# FC-3 Audit — Gap List (Phase 2)
Date: 2026-06-15

## Screens audited
- Screen 3.1 PackagesComposition  (492 lines) — /packages/:contractId
- Screen 3.2 PackagesFlags        (297 lines) — /packages/:packageId/flags
- Screen 3.3 PackagesReassembly   (248 lines) — /packages/:packageId/reassembly

---

## Gap List

### [Hardcoded ID] Screen 3.2 PackagesFlags — subtitle and Back button hardcode PKG-2026-0041
- Line 159: `<p className="page-subtitle">PKG-2026-0041 · Office Tower — 350 Fifth Ave</p>` — hardcoded
- Line 162: `navigate("/packages/PKG-2026-0041")` — hardcoded package ID in Back button
- Neither `useParams` nor `useLocation` is used to read the `:packageId` from the route.
- Fix: add `useParams<{ packageId: string }>()`, derive `packageId` from params (fallback `PKG-2026-0041`), use it in subtitle and Back button navigate call.

### [Hardcoded ID] Screen 3.3 PackagesReassembly — subtitle and both nav buttons hardcode PKG-2026-0041
- Line 113: `<p className="page-subtitle">PKG-2026-0041 · Office Tower — 350 Fifth Ave</p>` — hardcoded
- Line 233: `navigate("/packages/PKG-2026-0041")` — Back to Package button
- Line 238: `navigate("/packages/PKG-2026-0041/flags")` — Dismiss and Review Flags button
- Fix: add `useParams<{ packageId: string }>()`, use `packageId` in all three places.

### [Hardcoded ID] Screen 3.1 PackagesComposition — does not read :contractId from route params
- The component declares `const [, navigate] = useLocation()` but never calls `useParams`.
- `pkg.id` is always "PKG-2026-0041" from INITIAL_PACKAGE — the route param `:contractId` is ignored.
- The `navigate(\`/packages/${pkg.id}/flags\`)` and `navigate(\`/packages/${pkg.id}/reassembly\`)` calls use `pkg.id` (which is fine as long as pkg is loaded from the param), but the param is never read to seed the correct package.
- Fix: add `useParams<{ contractId: string }>()`, read `contractId`, use it as the fallback package ID (mock data keyed by ID). For the demo, the fallback to `PKG-2026-0041` is acceptable.

### [Stale breadcrumb] /packages routes missing from ROUTE_LABELS and SECTION_ROOTS in Breadcrumb.tsx
- `ROUTE_LABELS` has no entries for `/packages`, `/packages/:id/flags`, or `/packages/:id/reassembly`.
- `SECTION_ROOTS` has no entry for `/packages`.
- Result: all three FC-3 screens show the raw path string as the breadcrumb label instead of a human-readable name.
- Fix: add `/packages/*/flags → 'Flags'`, `/packages/*/reassembly → 'Re-Assembly'`, `/packages → 'Packages'` to ROUTE_LABELS; add `'/packages': '/packages'` to SECTION_ROOTS.

### [Dead route] Sidebar "Packages" link → /packages — no bare /packages route in App.tsx
- AppShell sidebar item at line 102: `path: '/packages'`.
- App.tsx has `/packages/:contractId` but no bare `/packages` route.
- Clicking the sidebar Packages link lands on the 404 / Not Found page.
- Fix: add a bare `<Route path="/packages">` in App.tsx that renders PackagesComposition (with fallback package ID).

### [Stale registry] SuperAdminScreenRegistry missing packages-reassembly entry
- Lines 51–52 of SuperAdminScreenRegistry.tsx list `packages-composition` and `packages-flags` but not `packages-reassembly`.
- Fix: add the missing row with correct route_path `/packages/:packageId/reassembly`.

### [Stale registry] SuperAdminScreenRegistry has stale route_paths for packages-composition and packages-flags
- `packages-composition` has `route_path: '/packages/composition'` — should be `/packages/:contractId`
- `packages-flags` has `route_path: '/packages/flags'` — should be `/packages/:packageId/flags`
- Fix: update both rows to match the actual App.tsx routes.

---

## Summary
- 0 Critical (no stubs — all three files are substantive)
- 3 High (Hardcoded IDs in PackagesFlags, PackagesReassembly, PackagesComposition; Dead route for sidebar /packages)
- 2 Medium (Stale breadcrumbs; Missing SECTION_ROOT for /packages)
- 2 Low (SuperAdminScreenRegistry stale/missing rows)

Severity order for fixes: Hardcoded IDs → Dead route → Stale breadcrumbs → Registry rows
