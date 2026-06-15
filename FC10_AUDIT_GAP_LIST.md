# FC-10 Audit Gap List

**Cluster:** Multi-Tenancy and Platform (Onboarding + SuperAdmin)
**Screens audited:** OrganizationSetupPage, AdminUserSetupPage, ThemeAndAutomationSetupPage, WorkflowTemplateSetupPage, OnboardingCompletePage, SuperAdminTenantDetail (cross-cutting)
**Date:** 2026-06-15

---

## Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 3 |
| Low | 1 |
| **Total** | **5** |

---

## HIGH

### H1 — `OnboardingCompletePage` hardcoded `MOCK_TENANT_ID = 't-new-001'` links to non-existent tenant detail
- **File:** `OnboardingCompletePage.tsx` line 54
- **Issue:** The "View Tenant Detail" link navigates to `/superadmin/tenants/t-new-001`. `SuperAdminTenantDetail` ignores `useParams` and always shows `MOCK_TENANT` (id `t1`). The link works but shows the wrong tenant. More importantly, `t-new-001` is not in any mock tenant list, so a real-looking onboarding completion always shows Meridian Property Group's detail — a confusing mismatch.
- **Fix:** Change `MOCK_TENANT_ID` to `'t3'` (Apex Corporate Holdings, which has `status: 'onboarding'` in `SuperAdminTenantList`) and `MOCK_SUBDOMAIN` to `'apex'` so the completion screen reflects the tenant that was "just onboarded" in the mock flow.

---

## MEDIUM

### M1 — Bare `/onboarding` route missing from App.tsx
- **File:** `App.tsx`
- **Issue:** The spec defines `platform-onboarding` at route `/onboarding`. There is no bare `/onboarding` route in App.tsx. Navigating to `/onboarding` returns 404. The SuperAdmin "New Tenant" button in `SuperAdminTenantList` links to `/onboarding/organization` (correct), but the spec's canonical route is `/onboarding`.
- **Fix:** Add `<Route path="/onboarding"><Redirect to="/onboarding/organization" /></Route>` in App.tsx.

### M2 — 5 missing FC-10 registry rows in `SuperAdminScreenRegistry`
- **File:** `SuperAdminScreenRegistry.tsx`
- **Issue:** Only 2 of the 7 FC-10 spec rows are present (`platform-not-authorized`, `superadmin-tenant-list`). Missing: `platform-onboarding`, `superadmin-tenant-detail`, `superadmin-system-health`, `superadmin-subscriptions`, `superadmin-screen-registry`.
- **Fix:** Add 5 missing rows.

### M3 — Breadcrumb missing all `/onboarding` entries and SECTION_ROOTS entry
- **File:** `Breadcrumb.tsx`
- **Issue:** No `/onboarding/*` entries in `ROUTE_LABELS` and no `/onboarding` key in `SECTION_ROOTS`. All onboarding screens show a bare path string as the breadcrumb instead of a human-readable label.
- **Fix:** Add 5 `ROUTE_LABELS` entries and 1 `SECTION_ROOTS` entry for `/onboarding`.

---

## LOW

### L1 — `SuperAdminTenantDetail` ignores `useParams` — always shows `t1` (Meridian)
- **File:** `SuperAdminTenantDetail.tsx`
- **Issue:** The component uses a hardcoded `MOCK_TENANT` with `id: 't1'` and never reads the `:id` route param. Navigating to `/superadmin/tenants/t2` or `/superadmin/tenants/t3` always shows Meridian Property Group.
- **Fix:** Add a `TENANTS_BY_ID` lookup map (reusing the same 3 tenants from `SuperAdminTenantList`) and resolve from `useParams<{ id: string }>()`.

---

## No gaps found

- All 5 onboarding step-to-step `navigate()` calls use correct routes that exist in App.tsx (`/onboarding/admin-user`, `/onboarding/theme-automation`, `/onboarding/workflow-templates`, `/onboarding/complete`).
- All screens share `SCREEN_KEYS.PLATFORM_ONBOARDING` — correct per spec (single screen key for the entire onboarding flow).
- No eventBus usage needed in onboarding cluster (no cross-screen lock wiring required).
- No hardcoded contract or record IDs in any onboarding screen.
