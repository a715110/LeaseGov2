/**
 * playwright.config.ts — LeaseGov E2E Test Suite
 * Version 2.0 — Grounded in repo state as of July 22, 2026
 *
 * 8 named projects map 1:1 to the 8 test sessions in the spec document.
 * Run a single session: npx playwright test --project="session-1-pipeline"
 * Run all sessions:     npx playwright test
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'session-1-pipeline',
      testMatch: '**/session-1-pipeline.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-2-extraction',
      testMatch: '**/session-2-extraction.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-3-review-approval',
      testMatch: '**/session-3-review-approval.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-4-records-packages',
      testMatch: '**/session-4-records-packages.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-5-export',
      testMatch: '**/session-5-export.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-6-reassessment',
      testMatch: '**/session-6-reassessment.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-7-admin',
      testMatch: '**/session-7-admin.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'session-8-equipment',
      testMatch: '**/session-8-equipment.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Dev server is already running — no webServer block needed
});
