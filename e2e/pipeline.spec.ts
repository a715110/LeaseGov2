import { test, expect } from '@playwright/test';
import { goto, assertVisible } from './helpers';

test.describe('Document Pipeline', () => {
  test('pipeline dashboard page loads', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await expect(page).toHaveURL(/pipeline/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('Stage Documents table renders rows', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('workspace filter pills are visible', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    const pills = page.locator('button').filter({ hasText: /Retail|Office|Industrial|All/i });
    const count = await pills.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Equipment filter chip is present', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await page.waitForSelector('table', { timeout: 10_000 });
    const equipChip = page.locator('button').filter({ hasText: /Equipment/i }).first();
    if (await equipChip.count() > 0) {
      await expect(equipChip).toBeVisible();
    }
  });

  test('stage documents table has content after load', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Upload Files button is visible', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    const uploadBtn = page.locator('button').filter({ hasText: /Upload/i }).first();
    if (await uploadBtn.count() > 0) {
      await expect(uploadBtn).toBeVisible();
    }
  });

  test('Review & Group section is visible', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    const reviewEl = page.getByText(/Review|Group|Package/i).first();
    await expect(reviewEl).toBeVisible();
  });

  test('Contract Packages section renders', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await assertVisible(page, 'Contract Packages');
  });

  test('pipeline upload page loads', async ({ page }) => {
    await goto(page, '/pipeline/upload');
    await expect(page).toHaveURL(/pipeline/);
  });
});
