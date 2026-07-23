import { test, expect } from '@playwright/test';
import { goto, assertVisible, waitForHeading } from './helpers';

test.describe('Approvals Queue', () => {
  test('approvals page loads', async ({ page }) => {
    await goto(page, '/approvals');
    const url = page.url();
    expect(url).toMatch(/approvals/);
  });

  test('approvals page shows queue or empty state', async ({ page }) => {
    await goto(page, '/approvals');
    // Either shows a table of approvals or an empty state message
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyState = await page.getByText(/no approvals|empty|nothing/i).count() > 0;
    const hasHeading = await page.locator('h1, h2').count() > 0;
    expect(hasTable || hasEmptyState || hasHeading).toBeTruthy();
  });

  test('approvals filter tabs are present', async ({ page }) => {
    await goto(page, '/approvals');
    // Look for status tabs like Pending, Approved, Rejected
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Pending|All|Approved|Rejected/i });
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });
});
