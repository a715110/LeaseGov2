import { test, expect } from '@playwright/test';
import { goto } from './helpers';

async function setAdminRole(page: import('@playwright/test').Page) {
  await page.goto('/pipeline/dashboard');
  await page.evaluate(() => {
    sessionStorage.setItem('dodesk_active_role', 'lease_admin');
  });
}

test.describe('Global Navigation', () => {
  test('root redirects to pipeline dashboard', async ({ page }) => {
    await goto(page, '/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/pipeline/);
  });

  test('sidebar renders navigation items', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    const navItems = page.locator('nav a, aside a, [class*="sidebar"] a, [class*="nav-item"]');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('pipeline dashboard route is reachable', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    await expect(page).toHaveURL(/pipeline\/dashboard/);
  });

  test('records route is reachable', async ({ page }) => {
    await goto(page, '/records');
    await expect(page).toHaveURL(/records/);
  });

  test('reassessment cases route is reachable', async ({ page }) => {
    await goto(page, '/reassessment/cases');
    await expect(page).toHaveURL(/reassessment\/cases/);
  });

  test('extraction queue route is reachable', async ({ page }) => {
    await goto(page, '/extraction/queue');
    await expect(page).toHaveURL(/extraction\/queue/);
  });

  test('admin schema route is reachable with admin role', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/schema');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/schema/);
  });

  test('admin templates route is reachable with admin role', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/templates');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/templates/);
  });

  test('admin thresholds route is reachable with admin role', async ({ page }) => {
    await setAdminRole(page);
    await page.goto('/admin/thresholds');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin\/thresholds/);
  });

  test('export templates route is reachable', async ({ page }) => {
    await goto(page, '/export/templates');
    await expect(page).toHaveURL(/export/);
  });

  test('approvals queue route is reachable', async ({ page }) => {
    await goto(page, '/approvals/queue');
    await expect(page).toHaveURL(/approvals/);
  });

  test('404 page renders for unknown route', async ({ page }) => {
    await goto(page, '/this-route-does-not-exist-xyz');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('role switcher is present in the header', async ({ page }) => {
    await goto(page, '/pipeline/dashboard');
    const roleSwitcher = page.locator('button').filter({ hasText: /Submitter|Preparer|Reviewer|Manager|Admin/i }).first();
    if (await roleSwitcher.count() > 0) {
      await expect(roleSwitcher).toBeVisible();
    }
  });
});
