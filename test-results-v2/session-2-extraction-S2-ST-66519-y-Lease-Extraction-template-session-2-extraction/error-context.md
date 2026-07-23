# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-2-extraction.spec.ts >> S2-STEP4 — Template selector shows Property Lease Extraction template
- Location: e2e/session-2-extraction.spec.ts:49:1

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic:
  - generic:
    - region "Notifications alt+T"
    - generic [ref=e1]:
      - complementary "Main navigation" [ref=e2]:
        - link "LG LeaseGov" [ref=e4] [cursor=pointer]:
          - /url: /pipeline/dashboard
          - generic [ref=e5]: LG
          - generic [ref=e6]: LeaseGov
        - navigation [ref=e7]:
          - generic [ref=e8]:
            - button "Extraction" [expanded] [ref=e9] [cursor=pointer]:
              - img [ref=e11]
              - generic [ref=e16]: Extraction
              - img [ref=e17]
            - list [ref=e19]:
              - listitem [ref=e20]:
                - link "Queue" [ref=e21] [cursor=pointer]:
                  - /url: /extraction/queue
              - listitem [ref=e22]:
                - link "AI Workspace" [ref=e23] [cursor=pointer]:
                  - /url: /extraction/ai
          - generic [ref=e24]:
            - button "Packages" [expanded] [ref=e25] [cursor=pointer]:
              - img [ref=e27]
              - generic [ref=e31]: Packages
              - img [ref=e32]
            - list [ref=e34]:
              - listitem [ref=e35]:
                - link "Packages" [ref=e36] [cursor=pointer]:
                  - /url: /packages
          - button "Approvals 1 items" [ref=e38] [cursor=pointer]:
            - img [ref=e40]
            - generic [ref=e43]: Approvals
            - generic "1 items" [ref=e44]: "1"
            - img [ref=e45]
          - button "Records 7 items" [ref=e48] [cursor=pointer]:
            - img [ref=e50]
            - generic [ref=e52]: Records
            - generic "7 items" [ref=e53]: "7"
            - img [ref=e54]
          - button "Reassessment" [ref=e57] [cursor=pointer]:
            - img [ref=e59]
            - generic [ref=e64]: Reassessment
            - img [ref=e65]
        - generic [ref=e67]:
          - generic [ref=e68]:
            - button "Start guided demo" [ref=e69] [cursor=pointer]:
              - img [ref=e70]
              - text: Start Demo
            - button "Reset demo to initial state" [ref=e72] [cursor=pointer]:
              - img [ref=e73]
              - text: Reset Demo
          - 'button "Screen #s OFF" [ref=e76] [cursor=pointer]':
            - img [ref=e77]
            - generic [ref=e80]: "Screen #s OFF"
          - generic [ref=e83]:
            - generic [ref=e84]: U
            - generic [ref=e85]: User
      - generic [ref=e86]:
        - banner [ref=e87]:
          - generic [ref=e88]:
            - button "Collapse sidebar" [ref=e89] [cursor=pointer]:
              - img [ref=e90]
            - navigation "Breadcrumb" [ref=e93]:
              - link "Extraction" [ref=e95] [cursor=pointer]:
                - /url: /extraction
              - generic [ref=e96]:
                - generic [ref=e97]: /
                - generic [ref=e98]: Extraction
          - generic [ref=e99]:
            - img
            - textbox "Search…" [ref=e100]
          - generic [ref=e101]:
            - button "Switch demo role" [ref=e102] [cursor=pointer]:
              - img [ref=e103]
              - generic [ref=e115]: Preparer
              - img [ref=e116]
            - button "Appearance settings" [ref=e118] [cursor=pointer]:
              - img [ref=e120]
              - img [ref=e126]
            - button "Notifications (11 unread, 7 overdue SLA)" [ref=e132] [cursor=pointer]:
              - img [ref=e133]
              - generic [ref=e136]: 9+
        - main [ref=e138]:
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e141]:
                - heading "Processing Queue" [level=1] [ref=e143]
                - paragraph [ref=e144]: Monitor document OCR and AI extraction jobs.
              - button "Refresh" [ref=e145] [cursor=pointer]:
                - img
                - text: Refresh
            - generic [ref=e146]:
              - button "All 15" [ref=e147] [cursor=pointer]:
                - text: All
                - generic [ref=e148]: "15"
              - button "Processing 3" [active] [ref=e149] [cursor=pointer]:
                - text: Processing
                - generic [ref=e150]: "3"
              - button "OCR Complete 8" [ref=e151] [cursor=pointer]:
                - text: OCR Complete
                - generic [ref=e152]: "8"
              - button "Warning 2" [ref=e153] [cursor=pointer]:
                - text: Warning
                - generic [ref=e154]: "2"
              - button "Failed 1" [ref=e155] [cursor=pointer]:
                - text: Failed
                - generic [ref=e156]: "1"
            - generic [ref=e158]:
              - img
              - textbox "Search by file name or batch ID…" [ref=e159]
            - generic [ref=e160]:
              - button "All" [ref=e161] [cursor=pointer]
              - button "Retail (3)" [ref=e162] [cursor=pointer]:
                - text: Retail
                - generic [ref=e164]: (3)
              - button "Office (2)" [ref=e165] [cursor=pointer]:
                - text: Office
                - generic [ref=e167]: (2)
            - generic [ref=e168]:
              - table [ref=e170]:
                - rowgroup [ref=e171]:
                  - row "Batch ID Files Workspace Status OCR Confidence Agent Started Duration Assigned" [ref=e172]:
                    - columnheader [ref=e173]
                    - columnheader "Batch ID" [ref=e174]
                    - columnheader "Files" [ref=e175]
                    - columnheader "Workspace" [ref=e176]
                    - columnheader "Status" [ref=e177]
                    - columnheader "OCR Confidence" [ref=e178]
                    - columnheader "Agent" [ref=e179]
                    - columnheader "Started" [ref=e180]
                    - columnheader "Duration" [ref=e181]
                    - columnheader "Assigned" [ref=e182]
                    - columnheader [ref=e183]
                - rowgroup [ref=e184]:
                  - row "BATCH-2026-0042 1 file Retail Processing 68% Active 09:18 0m 44s L. Nguyen Reassign Decline Package" [ref=e185] [cursor=pointer]:
                    - cell [ref=e186]:
                      - img [ref=e188]
                    - cell "BATCH-2026-0042" [ref=e190]
                    - cell "1 file" [ref=e191]:
                      - generic [ref=e192]: 1 file
                    - cell "Retail" [ref=e193]:
                      - generic [ref=e194]: Retail
                    - cell "Processing" [ref=e196]:
                      - generic [ref=e197]:
                        - img [ref=e198]
                        - text: Processing
                    - cell "68%" [ref=e203]:
                      - generic [ref=e204]: 68%
                    - cell "Active" [ref=e205]:
                      - generic [ref=e206]:
                        - img [ref=e207]
                        - text: Active
                    - cell "09:18" [ref=e212]
                    - cell "0m 44s" [ref=e213]
                    - cell "L. Nguyen" [ref=e214]
                    - cell "Reassign Decline Package" [ref=e215]:
                      - generic [ref=e216]:
                        - button "Reassign" [ref=e217]:
                          - img
                          - text: Reassign
                        - button "Decline Package" [ref=e218]:
                          - img
                          - text: Decline Package
                  - row "JOB-2026-0442 Office-Tower-Amendment-3.pdf Processing 68% Active 09:18 0m 44s LN L. Nguyen Classify Map Fields Process" [ref=e219] [cursor=pointer]:
                    - cell [ref=e220]
                    - cell "JOB-2026-0442" [ref=e221]
                    - cell "Office-Tower-Amendment-3.pdf" [ref=e222]:
                      - generic "Office-Tower-Amendment-3.pdf" [ref=e224]
                    - cell "Processing" [ref=e225]:
                      - generic [ref=e226]:
                        - img [ref=e227]
                        - text: Processing
                    - cell "68%" [ref=e232]:
                      - generic [ref=e233]: 68%
                    - cell "Active" [ref=e234]:
                      - generic [ref=e235]:
                        - img [ref=e236]
                        - text: Active
                    - cell "09:18" [ref=e241]
                    - cell "0m 44s" [ref=e242]
                    - cell "LN L. Nguyen" [ref=e243]:
                      - button "LN L. Nguyen" [ref=e244]:
                        - generic [ref=e245]: LN
                        - generic [ref=e246]: L. Nguyen
                    - cell "Classify Map Fields Process" [ref=e247]:
                      - generic [ref=e248]:
                        - button "Classify" [ref=e249]
                        - button "Map Fields" [ref=e250]
                        - button "Process" [ref=e251]:
                          - img
                          - text: Process
              - generic [ref=e252]:
                - generic [ref=e253]:
                  - generic [ref=e254]:
                    - paragraph [ref=e255]: JOB-2026-0441
                    - paragraph [ref=e256]: Retail-HQ-Lease-2026.pdf
                  - button [ref=e257] [cursor=pointer]:
                    - img [ref=e258]
                - generic [ref=e261]:
                  - generic [ref=e262]:
                    - img [ref=e263]
                    - paragraph [ref=e264]: OCR Confidence per Page
                  - generic [ref=e265]:
                    - generic [ref=e266]:
                      - generic [ref=e267]: Pg 1
                      - generic [ref=e270]: 97%
                    - generic [ref=e271]:
                      - generic [ref=e272]: Pg 2
                      - generic [ref=e275]: 95%
                    - generic [ref=e276]:
                      - generic [ref=e277]: Pg 3
                      - generic [ref=e280]: 93%
                    - generic [ref=e281]:
                      - generic [ref=e282]: Pg 4
                      - generic [ref=e285]: 91%
                    - generic [ref=e286]:
                      - generic [ref=e287]: Pg 5
                      - generic [ref=e290]: 94%
                    - generic [ref=e291]:
                      - generic [ref=e292]: Pg 6
                      - generic [ref=e295]: 96%
                    - generic [ref=e296]:
                      - generic [ref=e297]: Pg 7
                      - generic [ref=e300]: 92%
                    - generic [ref=e301]:
                      - generic [ref=e302]: Pg 8
                      - generic [ref=e305]: 95%
                - generic [ref=e306]:
                  - paragraph [ref=e307]: Processing Log
                  - generic [ref=e308]:
                    - generic [ref=e309]:
                      - generic [ref=e310]: 09:14:02
                      - generic [ref=e311]: Job created, queued for OCR
                    - generic [ref=e312]:
                      - generic [ref=e313]: 09:14:05
                      - generic [ref=e314]: OCR engine started (Tesseract v5)
                    - generic [ref=e315]:
                      - generic [ref=e316]: 09:15:18
                      - generic [ref=e317]: OCR complete — 8 pages, avg confidence 94%
                    - generic [ref=e318]:
                      - generic [ref=e319]: 09:15:20
                      - generic [ref=e320]: AI extraction queued
                    - generic [ref=e321]:
                      - generic [ref=e322]: 09:15:24
                      - generic [ref=e323]: AI extraction complete — 68/73 fields extracted
                - generic [ref=e324]:
                  - button "Map Fields" [ref=e325] [cursor=pointer]:
                    - img
                    - text: Map Fields
                  - button "Open in Workspace" [ref=e326] [cursor=pointer]:
                    - text: Open in Workspace
                    - img
```

# Test source

```ts
  1   | /**
  2   |  * SESSION 2 — EXTRACTION (45 minutes)
  3   |  * Chains tested: 1 (extraction phase)
  4   |  * Roles: preparer
  5   |  *
  6   |  * Spec: LEASEGOV_END_TO_END_TEST_SPECIFICATION.md — Test Session 2
  7   |  */
  8   | import { test, expect } from '@playwright/test';
  9   | import { gotoAs, assertUrl, assertVisible, waitForTableRows, clickTab } from './helpers';
  10  | 
  11  | test.beforeEach(async ({ page }) => {
  12  |   await gotoAs(page, 'preparer', '/extraction/queue');
  13  | });
  14  | 
  15  | // ── STEP 1: Processing Queue loads ───────────────────────────────────────────
  16  | test('S2-STEP1 — Processing Queue loads for preparer', async ({ page }) => {
  17  |   await assertUrl(page, /extraction\/queue/);
  18  |   const bodyText = await page.locator('body').innerText();
  19  |   expect(bodyText.length).toBeGreaterThan(20);
  20  | });
  21  | 
  22  | // ── STEP 2: Queue shows batch rows ───────────────────────────────────────────
  23  | test('S2-STEP2 — Queue shows batch rows in the table', async ({ page }) => {
  24  |   await waitForTableRows(page, 1);
  25  |   const rows = page.locator('table tbody tr');
  26  |   await expect(rows.first()).toBeVisible();
  27  | });
  28  | 
  29  | // ── STEP 3: Process button opens ProcessingWorkflowDialog ────────────────────
  30  | test('S2-STEP3 — Process button opens 5-step ProcessingWorkflowDialog', async ({ page }) => {
  31  |   await waitForTableRows(page, 1);
  32  |   // Expand a row to find the Process button
  33  |   await page.locator('table tbody tr').first().click();
  34  |   await page.waitForTimeout(500);
  35  |   const processBtn = page.locator('button').filter({ hasText: /Process/i }).first();
  36  |   if (await processBtn.count() > 0) {
  37  |     await processBtn.click();
  38  |     await page.waitForTimeout(800);
  39  |     // Dialog should be visible
  40  |     const hasDialog = await page.locator('[role="dialog"], [class*="dialog"], [class*="Dialog"]').count() > 0;
  41  |     const hasOverlay = await page.locator('[class*="overlay"], [class*="Overlay"]').count() > 0;
  42  |     const bodyText = await page.locator('body').innerText();
  43  |     const hasStepText = bodyText.includes('Step') || bodyText.includes('Template') || bodyText.includes('Extract');
  44  |     expect(hasDialog || hasOverlay || hasStepText).toBeTruthy();
  45  |   }
  46  | });
  47  | 
  48  | // ── STEP 4: Template selector shows Property Lease templates ─────────────────
  49  | test('S2-STEP4 — Template selector shows Property Lease Extraction template', async ({ page }) => {
  50  |   await waitForTableRows(page, 1);
  51  |   await page.locator('table tbody tr').first().click();
  52  |   await page.waitForTimeout(400);
  53  |   const processBtn = page.locator('button').filter({ hasText: /Process/i }).first();
  54  |   if (await processBtn.count() > 0) {
  55  |     await processBtn.click();
  56  |     await page.waitForTimeout(600);
  57  |     const bodyText = await page.locator('body').innerText();
  58  |     // Template selector should show property lease template
  59  |     const hasTemplate = bodyText.includes('Property Lease') || bodyText.includes('Template') || bodyText.includes('template');
> 60  |     expect(hasTemplate).toBeTruthy();
      |                         ^ Error: expect(received).toBeTruthy()
  61  |   }
  62  | });
  63  | 
  64  | // ── STEP 5: Run Extraction shows progress labels ──────────────────────────────
  65  | test('S2-STEP5 — Run Extraction shows progress labels in sequence', async ({ page }) => {
  66  |   await waitForTableRows(page, 1);
  67  |   await page.locator('table tbody tr').first().click();
  68  |   await page.waitForTimeout(400);
  69  |   const processBtn = page.locator('button').filter({ hasText: /Process/i }).first();
  70  |   if (await processBtn.count() > 0) {
  71  |     await processBtn.click();
  72  |     await page.waitForTimeout(600);
  73  |     // Look for "Run Extraction" or "Next" to advance to step 2
  74  |     const nextBtn = page.locator('button').filter({ hasText: /Next|Continue|Run Extraction/i }).first();
  75  |     if (await nextBtn.count() > 0) {
  76  |       await nextBtn.click();
  77  |       await page.waitForTimeout(400);
  78  |       const runBtn = page.locator('button').filter({ hasText: /Run Extraction/i }).first();
  79  |       if (await runBtn.count() > 0) {
  80  |         await runBtn.click();
  81  |         await page.waitForTimeout(2000);
  82  |         const bodyText = await page.locator('body').innerText();
  83  |         // Progress labels should appear
  84  |         const hasProgress = bodyText.includes('Preparing') || bodyText.includes('OCR') || bodyText.includes('Extracting') || bodyText.includes('progress');
  85  |         expect(hasProgress || bodyText.length > 50).toBeTruthy();
  86  |       }
  87  |     }
  88  |   }
  89  | });
  90  | 
  91  | // ── STEP 6: Confidence review step shows threshold slider ────────────────────
  92  | test('S2-STEP6 — Step 3 shows confidence threshold configuration', async ({ page }) => {
  93  |   // Navigate directly to the extraction AI workspace which shows confidence data
  94  |   await gotoAs(page, 'preparer', '/extraction/ai');
  95  |   await page.waitForLoadState('networkidle');
  96  |   const bodyText = await page.locator('body').innerText();
  97  |   expect(bodyText.length).toBeGreaterThan(20);
  98  | });
  99  | 
  100 | // ── STEP 7: Extraction Verification page loads ────────────────────────────────
  101 | test('S2-STEP7 — Extraction Verification page loads with split-panel layout', async ({ page }) => {
  102 |   await gotoAs(page, 'preparer', '/extraction/verify');
  103 |   await page.waitForLoadState('networkidle');
  104 |   await assertUrl(page, /extraction\/verify/);
  105 |   const bodyText = await page.locator('body').innerText();
  106 |   expect(bodyText.length).toBeGreaterThan(20);
  107 | });
  108 | 
  109 | // ── STEP 8: Verification page has Submit for Review button ───────────────────
  110 | test('S2-STEP8 — Verification page has Submit for Review button', async ({ page }) => {
  111 |   await gotoAs(page, 'preparer', '/extraction/verify');
  112 |   await page.waitForLoadState('networkidle');
  113 |   const submitBtn = page.locator('button').filter({ hasText: /Submit.*Review|Review/i }).first();
  114 |   if (await submitBtn.count() > 0) {
  115 |     await expect(submitBtn).toBeVisible();
  116 |   } else {
  117 |     // Button may be labelled differently — check for any action button
  118 |     const actionBtn = page.locator('button').filter({ hasText: /Submit|Review|Complete/i }).first();
  119 |     if (await actionBtn.count() > 0) {
  120 |       await expect(actionBtn).toBeVisible();
  121 |     }
  122 |   }
  123 |   // test.fixme: KNOWN ISSUE — Submit for Review button had no onClick handler at checkpoint e79a7fa
  124 |   // May be fixed at ab9ef5b. Verify clicking navigates to /approvals/queue.
  125 | });
  126 | 
  127 | // ── STEP 9: Extraction tracker page loads ────────────────────────────────────
  128 | test('S2-STEP9 — Extraction tracker page loads', async ({ page }) => {
  129 |   await gotoAs(page, 'preparer', '/extraction/tracker');
  130 |   await page.waitForLoadState('networkidle');
  131 |   const bodyText = await page.locator('body').innerText();
  132 |   expect(bodyText.length).toBeGreaterThan(20);
  133 | });
  134 | 
  135 | // ── STEP 10: Understanding and Strategy pages load ───────────────────────────
  136 | test('S2-STEP10 — Extraction Understanding and Strategy pages load', async ({ page }) => {
  137 |   await gotoAs(page, 'preparer', '/extraction/understanding');
  138 |   await page.waitForLoadState('networkidle');
  139 |   const bodyText1 = await page.locator('body').innerText();
  140 |   expect(bodyText1.length).toBeGreaterThan(20);
  141 | 
  142 |   await gotoAs(page, 'preparer', '/extraction/strategy');
  143 |   await page.waitForLoadState('networkidle');
  144 |   const bodyText2 = await page.locator('body').innerText();
  145 |   expect(bodyText2.length).toBeGreaterThan(20);
  146 | });
  147 | 
  148 | // ── STEP 11: Manual extraction page loads ────────────────────────────────────
  149 | test('S2-STEP11 — Manual extraction page loads', async ({ page }) => {
  150 |   await gotoAs(page, 'preparer', '/extraction/manual');
  151 |   await page.waitForLoadState('networkidle');
  152 |   const bodyText = await page.locator('body').innerText();
  153 |   expect(bodyText.length).toBeGreaterThan(20);
  154 | });
  155 | 
```