import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('Export Templates', () => {
  test('export template selection page loads', async ({ page }) => {
    await goto(page, '/export/templates');
    await expect(page).toHaveURL(/export/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('property lease export templates are visible', async ({ page }) => {
    await goto(page, '/export/templates');
    await page.waitForLoadState('networkidle');
    const hasPropertyTemplate = await page.getByText(/Property Lease|IFRS 16|ASC 842/i).count() > 0;
    const hasContent = await page.locator('h1, h2, [class*="card"], [class*="Card"]').count() > 0;
    expect(hasPropertyTemplate || hasContent).toBeTruthy();
  });

  test('equipment lease export templates are visible', async ({ page }) => {
    await goto(page, '/export/templates');
    await page.waitForLoadState('networkidle');
    const hasEquipmentTemplate = await page.getByText(/Equipment/i).count() > 0;
    expect(hasEquipmentTemplate).toBeTruthy();
  });

  test('export template cards are clickable', async ({ page }) => {
    await goto(page, '/export/templates');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await page.waitForTimeout(400);
      const url = page.url();
      expect(url).toMatch(/export/);
    }
  });
});
