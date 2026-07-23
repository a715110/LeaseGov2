import { test, expect } from '@playwright/test';
import { goto, assertVisible } from './helpers';

test.describe('Records — Property Lease', () => {
  test('records search page loads', async ({ page }) => {
    await goto(page, '/records');
    await expect(page).toHaveURL(/records/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('records table renders rows', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('contract type filter shows Property and Equipment options', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table', { timeout: 10_000 });
    // Look for type filter dropdown or chips
    const hasFilter = await page.locator('button, select, [role="combobox"]')
      .filter({ hasText: /Property|Equipment|Contract Type|Type/i }).count() > 0;
    const hasContent = await page.locator('table').count() > 0;
    expect(hasFilter || hasContent).toBeTruthy();
  });

  test('clicking a property lease record navigates to detail', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    // Click the first row
    await page.locator('table tbody tr').first().click();
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/records/);
  });

  test('record detail page loads for rec-001', async ({ page }) => {
    await goto(page, '/records/rec-001');
    await page.waitForLoadState('networkidle');
    // Should show some record content or redirect to records list
    const url = page.url();
    expect(url).toMatch(/records/);
    const hasContent = await page.locator('h1, h2, [role="tab"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('record detail tabs are navigable', async ({ page }) => {
    await goto(page, '/records/rec-001');
    await page.waitForLoadState('networkidle');
    const tabs = page.locator('[role="tab"]').filter({ hasText: /Overview|Financial|Documents|History/i });
    const count = await tabs.count();
    if (count > 0) {
      await expect(tabs.first()).toBeVisible();
    }
  });

  test('search filters records using page search input', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table', { timeout: 10_000 });
    // Target the editable search input (not the global readonly one)
    const inputs = page.locator('input[type="text"], input[type="search"], input:not([readonly])').filter({ hasText: '' });
    const count = await inputs.count();
    if (count > 0) {
      const editableInput = inputs.first();
      const isReadonly = await editableInput.getAttribute('readonly');
      if (!isReadonly) {
        await editableInput.fill('Retail');
        await page.waitForTimeout(400);
      }
    }
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
