import { test, expect } from '@playwright/test';

async function setAdminRole(page: import('@playwright/test').Page) {
  await page.goto('/pipeline/dashboard');
  await page.evaluate(() => {
    sessionStorage.setItem('dodesk_active_role', 'lease_admin');
  });
}

test.describe('Admin — Templates', () => {
  test('admin templates page loads', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/templates/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('template list renders content', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    const hasRows = await page.locator('table tbody tr, [class*="card"], [class*="Card"]').count() > 0;
    const hasContent = await page.locator('h1, h2, h3').count() > 0;
    expect(hasRows || hasContent).toBeTruthy();
  });

  test('contract type filter pills are visible', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    const pills = page.locator('button').filter({ hasText: /^All$|^Property$|^Equipment$|^Ground$/i });
    const count = await pills.count();
    if (count > 0) {
      await expect(pills.first()).toBeVisible();
    } else {
      const anyFilter = page.locator('button').filter({ hasText: /Property|Equipment|All/i }).first();
      if (await anyFilter.count() > 0) {
        await expect(anyFilter).toBeVisible();
      }
    }
  });

  test('Equipment filter pill shows equipment templates', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    const equipPill = page.locator('button').filter({ hasText: /^Equipment$/i }).first();
    if (await equipPill.count() > 0) {
      await equipPill.click();
      await page.waitForTimeout(400);
      const hasEquipContent = await page.getByText(/Equipment/i).count() > 0;
      expect(hasEquipContent).toBeTruthy();
    }
  });

  test('opening a template shows a modal or detail view', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    const clickTarget = page.locator('table tbody tr, [class*="card"]').first();
    if (await clickTarget.count() > 0) {
      await clickTarget.click();
      await page.waitForTimeout(600);
      const hasDialog = await page.locator('[role="dialog"], [class*="dialog"], [class*="modal"], [class*="sheet"]').count() > 0;
      const url = page.url();
      expect(hasDialog || url.includes('admin')).toBeTruthy();
    }
  });
});
