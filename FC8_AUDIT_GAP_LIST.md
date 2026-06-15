# FC-8 Audit Gap List — Administration Cluster

**Screens audited:** AdminUsers, AdminSchema, AdminTemplates, AdminAuditLog, AdminThresholds, AdminNotifications, AdminAutomation
**Audit date:** 2026-06-15

---

## Summary

| Severity | Count | Description |
|---|---|---|
| Critical | 0 | — |
| High | 0 | No navigate calls, no dead routes, no hardcoded record IDs in any screen |
| Medium | 2 | Missing registry rows; missing sidebar links |
| Low | 2 | Missing /admin/notifications breadcrumb label; bare /admin route missing |

---

## Gap Detail

### MEDIUM

**M1 — SuperAdminScreenRegistry missing 5 FC-8 rows**
- `admin-templates`, `admin-thresholds`, `admin-audit-log`, `admin-notifications`, `admin-automation-config` are all absent from the registry table.
- Only `admin-users` and `admin-schema` are present.
- Spec (SCREEN_REGISTRY_SPECIFICATION_V2.md lines 654–659, 708) defines all 7 rows.
- **Fix:** Add the 5 missing rows with correct route_path, role_access, feature_cluster, and dependency_screen_keys.

**M2 — Sidebar admin navGroup missing Templates, Thresholds, Notifications, Automation links**
- AppShell.tsx navGroup `admin` only exposes Users, Schema, Audit Log.
- AdminTemplates (`/admin/templates`), AdminThresholds (`/admin/thresholds`), AdminNotifications (`/admin/notifications`), AdminAutomation (`/admin/automation`) are all reachable by direct URL but have no sidebar entry.
- **Fix:** Add the 4 missing nav items to the `admin` navGroup in AppShell.tsx.

### LOW

**L1 — Breadcrumb missing `/admin/notifications` label**
- ROUTE_LABELS has `/admin/audit` → `Audit Log` but does not have `/admin/notifications` → `Notifications`.
- Navigating to `/admin/notifications` shows the raw path in the breadcrumb instead of `Notifications`.
- **Fix:** Add `{ prefix: '/admin/notifications', label: 'Notifications' }` to ROUTE_LABELS (already present as a standalone `/notifications` entry but not under `/admin/`).

**L2 — No bare `/admin` route in App.tsx**
- The SECTION_ROOTS entry for `/admin` links to `/admin` but no route exists for that path — navigating to `/admin` renders the 404 page.
- **Fix:** Add `<Route path="/admin">` redirecting to `/admin/users` (the first admin screen) in App.tsx.

---

## No-Gap Notes

- **No hardcoded record IDs** — None of the 7 admin screens reference `CR-2026-*`, `r1`/`r2`, or any other cross-cluster entity IDs.
- **No dead navigate() calls** — None of the screens call `navigate()` to external routes.
- **No useParams gaps** — Admin screens are all flat (no parameterised routes), so no useParams wiring is needed.
- **SCREEN_KEYS correct** — All 7 admin screen keys are defined in `screenKeys.ts` and used correctly in each component via `_screenKey`.
- **Breadcrumb labels correct** — `/admin/templates`, `/admin/schema`, `/admin/users`, `/admin/automation`, `/admin/thresholds`, `/admin/audit` all have correct ROUTE_LABELS entries.
