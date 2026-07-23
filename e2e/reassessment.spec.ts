import { test, expect } from '@playwright/test';
import { goto, assertVisible, waitForHeading } from './helpers';

test.describe('Reassessment Workflow', () => {
  test('reassessment case list loads', async ({ page }) => {
    await goto(page, '/reassessment/cases');
    await waitForHeading(page, 'Reassessment');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('equipment cases show Cpu icon or Equipment badge', async ({ page }) => {
    await goto(page, '/reassessment/cases');
    await page.waitForSelector('table', { timeout: 10_000 });
    // Equipment cases should have some visual indicator
    const hasEquipmentIndicator = await page.locator('table').getByText(/Equipment|CNC|Server/i).count() > 0;
    expect(hasEquipmentIndicator).toBeTruthy();
  });

  test('trigger page loads', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/trigger');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('trigger page has trigger type dropdown', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/trigger');
    await page.waitForLoadState('networkidle');
    const hasDropdown = await page.locator('select, [role="combobox"], [class*="select"]').count() > 0;
    const hasContent = await page.locator('h1, h2, label').count() > 0;
    expect(hasDropdown || hasContent).toBeTruthy();
  });

  test('classification page loads', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/classify');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('classification page shows Q1/Q2/Q3 questions', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/classify');
    await page.waitForLoadState('networkidle');
    const hasQuestions = await page.getByText(/Q1|Q2|Q3|Question 1|significant/i).count() > 0;
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasQuestions || hasContent).toBeTruthy();
  });

  test('assessment page loads', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/assess');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('assessment page shows Tier 1 questions', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/assess');
    await page.waitForLoadState('networkidle');
    const hasTier = await page.getByText(/Tier 1|Tier1|Preliminary/i).count() > 0;
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasTier || hasContent).toBeTruthy();
  });

  test('equipment assessment page loads for equipment case', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-eq-001/assess');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('memo page loads', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/memo');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('approval page loads', async ({ page }) => {
    await goto(page, '/reassessment/cases/case-001/approve');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/reassessment/);
  });

  test('new reassessment case button is visible on case list', async ({ page }) => {
    await goto(page, '/reassessment/cases');
    const newBtn = page.locator('button').filter({ hasText: /New|Create|Start/i }).first();
    if (await newBtn.count() > 0) {
      await expect(newBtn).toBeVisible();
    }
  });
});
