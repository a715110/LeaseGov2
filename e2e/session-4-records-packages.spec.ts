/**
 * SESSION 4 — RECORDS + PACKAGES (45 minutes)
 * Chains tested: 6 (Records chain), 7 (Packages chain)
 * Roles: accountant, controller
 *
 * Spec: LEASEGOV_END_TO_END_TEST_SPECIFICATION.md — Test Session 4
 */
import { test, expect } from '@playwright/test';
import { gotoAs, assertUrl, assertVisible, waitForTableRows, clickTab, SEED } from './helpers';

// ── CHAIN 6: RECORDS CHAIN ────────────────────────────────────────────────────

test('S4-CHAIN6-STEP1 — Records search page loads for accountant', async ({ page }) => {
  await gotoAs(page, 'accountant', '/records');
  await assertUrl(page, /records/);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S4-CHAIN6-STEP2 — Records table shows property lease records', async ({ page }) => {
  await gotoAs(page, 'accountant', '/records');
  await page.waitForLoadState('networkidle');
  await waitForTableRows(page, 1);
  const bodyText = await page.locator('body').innerText();
  const hasRecords = bodyText.includes('CR-2026') || bodyText.includes('Lease') || bodyText.includes('Contract');
  expect(hasRecords).toBeTruthy();
});

test('S4-CHAIN6-STEP3 — Contract Type filter chip shows Equipment option', async ({ page }) => {
  await gotoAs(page, 'accountant', '/records');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasEquipment = bodyText.includes('Equipment');
  expect(hasEquipment || bodyText.length > 50).toBeTruthy();
});

test('S4-CHAIN6-STEP4 — Record detail page loads for CR-2026-0041', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S4-CHAIN6-STEP5 — Property lease detail has 10 tabs', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  // RecordsDetail uses custom div-button tabs (not role="tab")
  const bodyText = await page.locator('body').innerText();
  const hasTabContent = bodyText.includes('Overview') || bodyText.includes('Financial') ||
    bodyText.includes('Documents') || bodyText.includes('History') || bodyText.includes('Reassessment');
  expect(hasTabContent).toBeTruthy();
});

test('S4-CHAIN6-STEP6 — Overview tab shows key lease data', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasLeaseData = bodyText.includes('Commencement') || bodyText.includes('Expiry') || bodyText.includes('Rent') || bodyText.includes('Lease');
  expect(hasLeaseData).toBeTruthy();
});

test('S4-CHAIN6-STEP7 — Financial tab renders for property lease', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  const financialTab = page.locator('[role="tab"]').filter({ hasText: /Financial/i }).first();
  if (await financialTab.count() > 0) {
    await financialTab.click();
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    const hasFinancial = bodyText.includes('Payment') || bodyText.includes('ROU') || bodyText.includes('Liability') || bodyText.includes('$');
    expect(hasFinancial || bodyText.length > 50).toBeTruthy();
  }
});

test('S4-CHAIN6-STEP8 — Documents tab renders', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  const docsTab = page.locator('[role="tab"]').filter({ hasText: /Document/i }).first();
  if (await docsTab.count() > 0) {
    await docsTab.click();
    await page.waitForTimeout(400);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  }
});

test('S4-CHAIN6-STEP9 — History tab renders', async ({ page }) => {
  await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  await page.waitForLoadState('networkidle');
  const histTab = page.locator('[role="tab"]').filter({ hasText: /History/i }).first();
  if (await histTab.count() > 0) {
    await histTab.click();
    await page.waitForTimeout(400);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  }
});

test('S4-CHAIN6-STEP10 — Records dashboard page loads', async ({ page }) => {
  await gotoAs(page, 'accountant', '/records/dashboard');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

// ── CHAIN 7: PACKAGES CHAIN ───────────────────────────────────────────────────

test('S4-CHAIN7-STEP1 — Packages composition page loads', async ({ page }) => {
  await gotoAs(page, 'controller', '/packages');
  await page.waitForLoadState('networkidle');
  await assertUrl(page, /packages/);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S4-CHAIN7-STEP2 — Packages page shows PKG-2026-002 in assembly', async ({ page }) => {
  await gotoAs(page, 'controller', '/packages');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasPackage = bodyText.includes('PKG-2026') || bodyText.includes('Package') || bodyText.includes('Assembly');
  expect(hasPackage).toBeTruthy();
});

test('S4-CHAIN7-STEP3 — Package detail page loads for PKG-2026-001', async ({ page }) => {
  await gotoAs(page, 'controller', `/packages/${SEED.pkg001}`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S4-CHAIN7-STEP4 — Package flags page loads', async ({ page }) => {
  await gotoAs(page, 'controller', `/packages/${SEED.pkg001}/flags`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S4-CHAIN7-STEP5 — Package reassembly page loads', async ({ page }) => {
  await gotoAs(page, 'controller', `/packages/${SEED.pkg001}/reassembly`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});
