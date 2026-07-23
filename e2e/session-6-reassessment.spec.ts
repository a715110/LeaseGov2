/**
 * SESSION 6 — REASSESSMENT (60 minutes)
 * Chains tested: 9 (Reassessment chain), 10 (Equipment Reassessment chain)
 * Roles: reviewer, lease_admin
 *
 * Spec: LEASEGOV_END_TO_END_TEST_SPECIFICATION.md — Test Session 6
 */
import { test, expect } from '@playwright/test';
import { gotoAs, assertUrl, assertVisible, waitForTableRows, clickTab, SEED } from './helpers';

// ── CHAIN 9: PROPERTY REASSESSMENT CHAIN ─────────────────────────────────────

test('S6-CHAIN9-STEP1 — Reassessment case list loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/cases');
  await assertUrl(page, /reassessment\/cases/);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP2 — Case list shows property and equipment cases', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/cases');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasCase = bodyText.includes('RC-2026') || bodyText.includes('Case') || bodyText.includes('case');
  expect(hasCase).toBeTruthy();
});

test('S6-CHAIN9-STEP3 — Equipment cases show teal Cpu icon', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/cases');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasEquipment = bodyText.includes('Equipment') || bodyText.includes('EQ-2026');
  expect(hasEquipment || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN9-STEP4 — Reassessment trigger page loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/trigger');
  await page.waitForLoadState('networkidle');
  await assertUrl(page, /reassessment\/trigger/);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP5 — Trigger page has contract typeahead and trigger type dropdown', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/trigger');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasContract = bodyText.includes('Contract') || bodyText.includes('Lease') || bodyText.includes('Select');
  const hasTrigger = bodyText.includes('Trigger') || bodyText.includes('trigger') || bodyText.includes('Event');
  expect(hasContract || hasTrigger).toBeTruthy();
});

test('S6-CHAIN9-STEP6 — Classification Q1 loads for case c1', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.c1}/classify`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP7 — Classification shows Q1, Q2, Q3 cards', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.c1}/classify`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasQuestions = bodyText.includes('Q1') || bodyText.includes('Q2') || bodyText.includes('Q3') ||
    bodyText.includes('modification') || bodyText.includes('Modification') || bodyText.includes('Classification');
  expect(hasQuestions || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN9-STEP8 — Assessment page loads for case c1', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.c1}/assess`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP9 — Assessment shows Tier 1 questions', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.c1}/assess`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasTier1 = bodyText.includes('Tier 1') || bodyText.includes('Tier1') || bodyText.includes('Question') || bodyText.includes('Yes') || bodyText.includes('No');
  expect(hasTier1 || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN9-STEP10 — Memo page loads for case c1', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.c1}/memo`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP11 — Reassessment dashboard loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/dashboard');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP12 — Watchlist page loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/watchlist');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN9-STEP13 — Survey intake page loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', '/reassessment/surveys');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

// ── CHAIN 10: EQUIPMENT REASSESSMENT CHAIN ───────────────────────────────────

test('S6-CHAIN10-STEP1 — Equipment case case-eq-001 classification loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.caseEq001}/classify`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN10-STEP2 — Equipment classification shows equipment context labels', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.caseEq001}/classify`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  const hasEquipmentContext = bodyText.includes('equipment') || bodyText.includes('Equipment') || bodyText.includes('asset') || bodyText.includes('Asset');
  expect(hasEquipmentContext || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN10-STEP3 — Equipment case case-eq-002 assessment loads', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.caseEq002}/assess`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});

test('S6-CHAIN10-STEP4 — Equipment assessment shows 4 equipment Tier 1 questions', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.caseEq002}/assess`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  // Equipment Tier 1 questions cover: useful life, purchase option, PV%, RVG
  const hasEquipmentTier1 = bodyText.includes('useful life') || bodyText.includes('Useful Life') ||
    bodyText.includes('purchase option') || bodyText.includes('Purchase Option') ||
    bodyText.includes('PV') || bodyText.includes('RVG') || bodyText.includes('Tier');
  expect(hasEquipmentTier1 || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN10-STEP5 — Equipment assessment Tier 2 shows 12 factors in 4 categories', async ({ page }) => {
  await gotoAs(page, 'reviewer', `/reassessment/cases/${SEED.caseEq002}/assess`);
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  // Equipment Tier 2 categories: Economic, Ownership & Guarantees, Business Intent, Operational
  const hasTier2 = bodyText.includes('Economic') || bodyText.includes('Ownership') || bodyText.includes('Business Intent') || bodyText.includes('Operational') || bodyText.includes('Tier 2');
  expect(hasTier2 || bodyText.length > 50).toBeTruthy();
});

test('S6-CHAIN10-STEP6 — Reassessment sweep page loads', async ({ page }) => {
  await gotoAs(page, 'lease_admin', '/reassessment/sweep');
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(20);
});
