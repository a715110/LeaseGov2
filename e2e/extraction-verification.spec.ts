import { test, expect } from '@playwright/test';
import { goto, assertVisible, waitForHeading } from './helpers';

test.describe('Extraction — AI Workspace & Verification', () => {
  test('AI workspace page loads', async ({ page }) => {
    await goto(page, '/extraction/ai');
    // Should show the AI workspace or redirect
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });

  test('extraction understanding page loads', async ({ page }) => {
    await goto(page, '/extraction/understanding');
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });

  test('extraction strategy page loads', async ({ page }) => {
    await goto(page, '/extraction/strategy');
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });

  test('extraction verification page loads', async ({ page }) => {
    await goto(page, '/extraction/verification');
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });

  test('extraction review page loads', async ({ page }) => {
    await goto(page, '/extraction/review');
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });

  test('extraction complete page loads', async ({ page }) => {
    await goto(page, '/extraction/complete');
    const url = page.url();
    expect(url).toMatch(/extraction/);
  });
});
