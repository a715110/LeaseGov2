/**
 * helpers.ts — Shared utilities for the LeaseGov E2E test suite
 * Version 2.0 — Spec-grounded against LEASEGOV_END_TO_END_TEST_SPECIFICATION.md
 */
import { type Page, expect } from '@playwright/test';
import * as path from 'path';

// ── Fixture paths (resolved relative to this file at runtime) ───────────────
const _e2eDir = path.resolve(process.cwd(), 'e2e');

// ── Role storage key (must match RoleContext.tsx ROLE_STORAGE_KEY) ──────────
export const ROLE_STORAGE_KEY = 'dodesk_active_role';

// ── Available roles (from UserRole.ts) ──────────────────────────────────────
export type UserRole =
  | 'document_submitter'
  | 'preparer'
  | 'reviewer'
  | 'approver'
  | 'accountant'
  | 'controller'
  | 'business_submitter'
  | 'auditor'
  | 'lease_admin'
  | 'super_admin';

// ── Fixture paths ────────────────────────────────────────────────────────────
export const FIXTURES_DIR = path.join(_e2eDir, 'fixtures');
export const SAMPLE_PDF = path.join(FIXTURES_DIR, 'sample-lease.pdf');

// ── Seed data IDs (from spec PRE-TEST SETUP section) ────────────────────────
export const SEED = {
  r1: { id: 'r1', contractNumber: 'CR-2026-0041', entity: 'Meridian Property Group' },
  r2: { id: 'r2', contractNumber: 'CR-2026-0038', entity: 'Acme Corp' },
  r3: { id: 'r3', contractNumber: 'CR-2026-0039', entity: 'Globex LLC' },
  r4: { id: 'r4', contractNumber: 'CR-2026-0040', entity: 'Initech' },
  eq001: { id: 'eq-001', contractNumber: 'EQ-2026-0001', entity: 'Dell Financial Services' },
  eq002: { id: 'eq-002', contractNumber: 'EQ-2026-0002', entity: 'Haas Financial Services' },
  eq003: { id: 'eq-003', contractNumber: 'EQ-2026-0003', entity: 'Ford Motor Credit' },
  pkg001: 'PKG-2026-001',
  pkg002: 'PKG-2026-002',
  t1: 't1',
  ut1: 'ut1',
  extId: 'EXT-2026-0041',
  confRef: 'CONF-20260516-0041',
  c1: 'c1',
  caseEq001: 'case-eq-001',
  caseEq002: 'case-eq-002',
};

// ── Set active role via sessionStorage ──────────────────────────────────────
export async function setRole(page: Page, role: UserRole): Promise<void> {
  await page.goto('/pipeline/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ([key, r]) => { sessionStorage.setItem(key, r); },
    [ROLE_STORAGE_KEY, role] as [string, string]
  );
}

// ── Navigate with role pre-set ───────────────────────────────────────────────
export async function gotoAs(page: Page, role: UserRole, url: string): Promise<void> {
  await setRole(page, role);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// ── Basic navigation helper ──────────────────────────────────────────────────
export async function goto(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// ── Assert text is visible anywhere on the page ──────────────────────────────
export async function assertVisible(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}

// ── Assert URL matches pattern ────────────────────────────────────────────────
export async function assertUrl(page: Page, pattern: RegExp | string): Promise<void> {
  await expect(page).toHaveURL(pattern);
}

// ── Click a sidebar nav item by its label ────────────────────────────────────
export async function navTo(page: Page, label: string): Promise<void> {
  const link = page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]')
    .getByText(label, { exact: false })
    .first();
  await link.click();
  await page.waitForLoadState('networkidle');
}

// ── Wait for a heading to appear ─────────────────────────────────────────────
export async function waitForHeading(page: Page, text: string): Promise<void> {
  await page.waitForSelector(
    `h1:has-text("${text}"), h2:has-text("${text}"), h3:has-text("${text}")`,
    { timeout: 12_000 }
  );
}

// ── Click a button by its visible text ───────────────────────────────────────
export async function clickButton(page: Page, text: string): Promise<void> {
  await page.locator('button').filter({ hasText: text }).first().click();
}

// ── Wait for table rows to appear ────────────────────────────────────────────
export async function waitForTableRows(page: Page, minCount = 1, timeout = 12000): Promise<void> {
  await page.waitForFunction(
    (min) => document.querySelectorAll('table tbody tr').length >= min,
    minCount,
    { timeout }
  );
}

// ── Count table rows ──────────────────────────────────────────────────────────
export async function getTableRowCount(page: Page): Promise<number> {
  return page.locator('table tbody tr').count();
}

// ── Check if element exists (non-throwing) ───────────────────────────────────
export async function exists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

// ── Dismiss any open modal/dialog ────────────────────────────────────────────
export async function dismissModal(page: Page): Promise<void> {
  const closeBtn = page.locator('[aria-label="Close"], button')
    .filter({ hasText: /^(Close|Cancel|✕|×)$/ })
    .first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

// ── Wait for toast notification ───────────────────────────────────────────────
export async function waitForToast(page: Page, text: string, timeout = 8000): Promise<void> {
  await expect(
    page.locator('[data-sonner-toast], [role="status"], [class*="toast"], [class*="Toast"]')
      .filter({ hasText: text })
      .first()
  ).toBeVisible({ timeout });
}

// ── Assert element count ──────────────────────────────────────────────────────
export async function assertCount(page: Page, selector: string, expectedCount: number): Promise<void> {
  await expect(page.locator(selector)).toHaveCount(expectedCount);
}

// ── Get tab count ─────────────────────────────────────────────────────────────
export async function getTabCount(page: Page): Promise<number> {
  return page.locator('[role="tab"]').count();
}

// ── Click a tab by its label ──────────────────────────────────────────────────
export async function clickTab(page: Page, label: string): Promise<void> {
  await page.locator('[role="tab"]').filter({ hasText: label }).first().click();
  await page.waitForTimeout(300);
}
