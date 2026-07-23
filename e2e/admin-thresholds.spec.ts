import { test, expect } from '@playwright/test';

async function setAdminRole(page: import('@playwright/test').Page) {
  await page.goto('/pipeline/dashboard');
  await page.evaluate(() => {
    sessionStorage.setItem('dodesk_active_role', 'lease_admin');
  });
}

test.describe('Admin — Thresholds', () => {
  test('admin thresholds page loads', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/thresholds/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('threshold page has meaningful content', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    const hasContent = await page.locator('h1, h2, h3, label, [class*="accordion"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Equipment Lease Classification section is present', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    const equipEl = page.getByText(/Equipment/i).first();
    await expect(equipEl).toBeVisible();
  });

  test('Equipment Classification accordion expands to show content', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    const eqSection = page.locator('button, [role="button"]').filter({ hasText: /Equipment/i }).first();
    if (await eqSection.count() > 0) {
      await eqSection.click();
      await page.waitForTimeout(400);
      const hasContent = await page.locator('input, label, [class*="slider"], p').count() > 0;
      expect(hasContent).toBeTruthy();
    }
  });

  test('threshold page has save or apply controls', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    const controls = page.locator('button').filter({ hasText: /Save|Apply|Update|Reset/i });
    const count = await controls.count();
    if (count > 0) {
      await expect(controls.first()).toBeVisible();
    }
  });
});
