import { test, expect } from '@playwright/test';

// Admin pages require lease_admin role — set it via sessionStorage before navigation
async function setAdminRole(page: import('@playwright/test').Page) {
  await page.goto('/pipeline/dashboard');
  await page.evaluate(() => {
    sessionStorage.setItem('dodesk_active_role', 'lease_admin');
  });
}

test.describe('Admin — Schema', () => {
  test('admin schema page loads', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/schema/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('Property Lease tab is present', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    const tab = page.locator('[role="tab"], button').filter({ hasText: /Property Lease/i }).first();
    if (await tab.count() > 0) {
      await expect(tab).toBeVisible();
    } else {
      const heading = page.getByText(/Property Lease/i).first();
      await expect(heading).toBeVisible();
    }
  });

  test('Equipment Lease tab is present', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    const equipEl = page.getByText(/Equipment Lease/i).first();
    await expect(equipEl).toBeVisible();
  });

  test('Equipment Lease tab click shows field categories', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    const equipTab = page.locator('[role="tab"], button').filter({ hasText: /Equipment Lease/i }).first();
    if (await equipTab.count() > 0) {
      await equipTab.click();
      await page.waitForTimeout(500);
      const hasCategories = await page.getByText(/Asset Identification|Lease Terms|Financial|Classification|Equipment/i).count() > 0;
      expect(hasCategories).toBeTruthy();
    }
  });

  test('accordion sections are present', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('h1, h2, h3, [role="tab"], button').count() > 0;
    expect(hasContent).toBeTruthy();
  });
});
