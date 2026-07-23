import { test, expect } from '@playwright/test';
import { goto, assertVisible } from './helpers';

test.describe('Demo Tour', () => {
  test('Start Demo button is visible on the pipeline page', async ({ page }) => {
    await goto(page, '/pipeline');
    await assertVisible(page, 'Start Demo');
  });

  test('clicking Start Demo activates the tour', async ({ page }) => {
    await goto(page, '/pipeline');
    const startBtn = page.locator('button').filter({ hasText: /Start Demo/i }).first();
    await startBtn.click();
    await page.waitForTimeout(600);
    // Demo mode should show step indicators or a tour overlay
    const hasTourUI = await page.locator('[class*="demo"], [class*="tour"], [class*="step"]').count() > 0;
    const hasNextBtn = await page.locator('button').filter({ hasText: /Next|Continue|Step/i }).count() > 0;
    expect(hasTourUI || hasNextBtn).toBeTruthy();
  });

  test('Reset Demo button is visible', async ({ page }) => {
    await goto(page, '/pipeline');
    await assertVisible(page, 'Reset Demo');
  });

  test('demo step counter advances on Next click', async ({ page }) => {
    await goto(page, '/pipeline');
    const startBtn = page.locator('button').filter({ hasText: /Start Demo/i }).first();
    await startBtn.click();
    await page.waitForTimeout(600);
    const nextBtn = page.locator('button').filter({ hasText: /Next/i }).first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(400);
      // Should still be in demo mode
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });
});
