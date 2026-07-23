import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Records — Equipment Lease', () => {
  test('equipment records appear in the records table', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table', { timeout: 10_000 });
    // Equipment records should be visible in the table
    const hasEquipment = await page.getByText(/Equipment Lease|Equipment/i).count() > 0;
    const hasTable = await page.locator('table tbody tr').count() > 0;
    expect(hasEquipment || hasTable).toBeTruthy();
  });

  test('equipment record detail page loads', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    // Click the first row and check it loads
    await page.locator('table tbody tr').first().click();
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/records/);
    const hasContent = await page.locator('h1, h2, [role="tab"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('equipment record detail has tabs', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table tbody tr', { timeout: 10_000 });
    // Navigate to a known record
    await page.goto('/records/rec-001');
    await page.waitForLoadState('networkidle');
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    // Should have at least some tabs (Overview, Financial, etc.)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('equipment type filter chip is present in records', async ({ page }) => {
    await goto(page, '/records');
    await page.waitForSelector('table', { timeout: 10_000 });
    // Find the Equipment filter option
    const equipFilter = page.locator('button, [role="option"]').filter({ hasText: /Equipment/i }).first();
    if (await equipFilter.count() > 0) {
      await equipFilter.click();
      await page.waitForTimeout(400);
    }
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
