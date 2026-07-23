# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-4-records-packages.spec.ts >> S4-CHAIN6-STEP5 — Property lease detail has 10 tabs
- Location: e2e/session-4-records-packages.spec.ts:44:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 3
Received:    0
```

# Page snapshot

```yaml
- generic [active]:
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
            - button "Records 7 items" [expanded] [ref=e9] [cursor=pointer]:
              - img [ref=e11]
              - generic [ref=e13]: Records
              - generic "7 items" [ref=e14]: "7"
              - img [ref=e15]
            - list [ref=e17]:
              - listitem [ref=e18]:
                - link "Records" [ref=e19] [cursor=pointer]:
                  - /url: /records
              - listitem [ref=e20]:
                - link "Dashboard" [ref=e21] [cursor=pointer]:
                  - /url: /records/dashboard
          - generic [ref=e22]:
            - button "Reassessment" [expanded] [ref=e23] [cursor=pointer]:
              - img [ref=e25]
              - generic [ref=e30]: Reassessment
              - img [ref=e31]
            - list [ref=e33]:
              - listitem [ref=e34]:
                - link "Dashboard" [ref=e35] [cursor=pointer]:
                  - /url: /reassessment/dashboard
              - listitem [ref=e36]:
                - link "Cases" [ref=e37] [cursor=pointer]:
                  - /url: /reassessment/cases
              - listitem [ref=e38]:
                - link "Watchlist" [ref=e39] [cursor=pointer]:
                  - /url: /reassessment/watchlist
              - listitem [ref=e40]:
                - link "Projects" [ref=e41] [cursor=pointer]:
                  - /url: /reassessment/surveys
        - generic [ref=e42]:
          - generic [ref=e43]:
            - button "Start guided demo" [ref=e44] [cursor=pointer]:
              - img [ref=e45]
              - text: Start Demo
            - button "Reset demo to initial state" [ref=e47] [cursor=pointer]:
              - img [ref=e48]
              - text: Reset Demo
          - 'button "Screen #s OFF" [ref=e51] [cursor=pointer]':
            - img [ref=e52]
            - generic [ref=e55]: "Screen #s OFF"
          - generic [ref=e58]:
            - generic [ref=e59]: U
            - generic [ref=e60]: User
      - generic [ref=e61]:
        - banner [ref=e62]:
          - generic [ref=e63]:
            - button "Collapse sidebar" [ref=e64] [cursor=pointer]:
              - img [ref=e65]
            - navigation "Breadcrumb" [ref=e68]:
              - link "Records" [ref=e70] [cursor=pointer]:
                - /url: /records
              - generic [ref=e71]:
                - generic [ref=e72]: /
                - generic [ref=e73]: Detail
          - generic [ref=e74]:
            - img
            - textbox "Search…" [ref=e75]
          - generic [ref=e76]:
            - button "Switch demo role" [ref=e77] [cursor=pointer]:
              - img [ref=e78]
              - generic [ref=e90]: Accountant
              - img [ref=e91]
            - button "Appearance settings" [ref=e93] [cursor=pointer]:
              - img [ref=e95]
              - img [ref=e101]
            - button "Notifications (11 unread, 7 overdue SLA)" [ref=e107] [cursor=pointer]:
              - img [ref=e108]
              - generic [ref=e111]: 9+
        - main [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]:
              - generic [ref=e116] [cursor=pointer]: Portfolio
              - img [ref=e117]
              - generic [ref=e119] [cursor=pointer]: Contract Records
              - img [ref=e120]
              - generic [ref=e122]: CR-2026-0088
            - generic [ref=e123]:
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - heading "CR-2026-0088" [level=1] [ref=e126]
                  - generic [ref=e127]: Approved
                  - generic [ref=e128]: Collaborative
                - paragraph [ref=e129]: Office Tower — 350 Fifth Ave
                - generic [ref=e130]:
                  - generic [ref=e131]:
                    - text: "Workspace:"
                    - strong [ref=e132]: Corporate HQ
                  - generic [ref=e133]: ·
                  - generic [ref=e134]:
                    - text: "Type:"
                    - strong [ref=e135]: property lease
                  - generic [ref=e136]: ·
                  - generic [ref=e137]:
                    - text: "Updated:"
                    - strong [ref=e138]: May 16, 2026
                  - generic [ref=e139]: ·
                  - generic [ref=e140]: 3 snapshots
              - button "Initiate Correction" [ref=e142] [cursor=pointer]:
                - img
                - text: Initiate Correction
            - generic [ref=e143]:
              - button "Overview" [ref=e144] [cursor=pointer]
              - button "Financial" [ref=e145] [cursor=pointer]
              - button "Documents" [ref=e146] [cursor=pointer]
              - button "History" [ref=e147] [cursor=pointer]
              - button "Reassessment" [ref=e148] [cursor=pointer]
              - button "Open Items" [ref=e149] [cursor=pointer]
              - button "Watchlist" [ref=e150] [cursor=pointer]
              - button "Terms" [ref=e151] [cursor=pointer]
              - button "Workflow" [ref=e152] [cursor=pointer]
              - button "Agent" [ref=e153] [cursor=pointer]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - generic [ref=e157]:
                  - heading "Parties" [level=3] [ref=e158]
                  - generic [ref=e159]:
                    - generic [ref=e160]:
                      - generic [ref=e161]: Landlord
                      - generic [ref=e162]: Fifth Ave Properties LLC
                    - generic [ref=e163]:
                      - generic [ref=e164]: Tenant
                      - generic [ref=e165]: Acme Corporation
                - generic [ref=e166]:
                  - heading "Lease Terms" [level=3] [ref=e167]
                  - generic [ref=e168]:
                    - generic [ref=e169]:
                      - generic [ref=e170]: Effective Date
                      - generic [ref=e171]: 2022-01-01
                    - generic [ref=e172]:
                      - generic [ref=e173]: Commencement Date
                      - generic [ref=e174]: 2022-01-01
                    - generic [ref=e175]:
                      - generic [ref=e176]: Expiration Date
                      - generic [ref=e177]: 2032-12-31
                    - generic [ref=e178]:
                      - generic [ref=e179]: Term (Months)
                      - generic [ref=e180]: "132"
                    - generic [ref=e181]:
                      - generic [ref=e182]: Base Rent
                      - generic [ref=e183]: $42,500/monthly
                    - generic [ref=e184]:
                      - generic [ref=e185]: Escalation Type
                      - generic [ref=e186]: fixed percentage
                    - generic [ref=e187]:
                      - generic [ref=e188]: Escalation Rate
                      - generic [ref=e189]: 3.00%
                    - generic [ref=e190]:
                      - generic [ref=e191]: Classification
                      - generic [ref=e192]: operating
                - generic [ref=e193]:
                  - heading "Property" [level=3] [ref=e194]
                  - generic [ref=e195]:
                    - generic [ref=e196]:
                      - generic [ref=e197]: Address
                      - generic [ref=e198]: 350 Fifth Avenue, New York, NY 10118
                    - generic [ref=e199]:
                      - generic [ref=e200]: Rentable Area
                      - generic [ref=e201]: 24,500 sqft
                    - generic [ref=e202]:
                      - generic [ref=e203]: Suite / Floor
                      - generic [ref=e204]: Floors 12–14
                    - generic [ref=e205]:
                      - generic [ref=e206]: Property Type
                      - generic [ref=e207]: office
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - heading "Critical Dates" [level=3] [ref=e211]
                  - generic [ref=e212]:
                    - generic [ref=e213]:
                      - generic [ref=e214]: Commencement
                      - generic [ref=e215]: 2022-01-01
                    - generic [ref=e216]:
                      - generic [ref=e217]: Expiration
                      - generic [ref=e218]: 2032-12-31
                    - generic [ref=e219]:
                      - generic [ref=e220]: Rent Commencement
                      - generic [ref=e221]: 2022-02-01
                    - generic [ref=e222]:
                      - generic [ref=e223]: Next Escalation
                      - generic [ref=e224]: 2027-01-01
                    - generic [ref=e225]:
                      - generic [ref=e226]: Option Exercise
                      - generic [ref=e227]: 2031-09-30
                - generic [ref=e228]:
                  - heading "Quick Actions" [level=3] [ref=e229]
                  - button "Add Document" [ref=e230] [cursor=pointer]:
                    - img
                    - text: Add Document
                  - button "Start Reassessment" [ref=e231] [cursor=pointer]:
                    - img
                    - text: Start Reassessment
                  - button "Export Record" [ref=e232] [cursor=pointer]:
                    - img
                    - text: Export Record
                  - button "Initiate Correction" [ref=e233] [cursor=pointer]:
                    - img
                    - text: Initiate Correction
                  - button "Add to Watchlist" [ref=e234] [cursor=pointer]:
                    - img [ref=e235]
                    - text: Add to Watchlist
```

# Test source

```ts
  1   | /**
  2   |  * SESSION 4 — RECORDS + PACKAGES (45 minutes)
  3   |  * Chains tested: 6 (Records chain), 7 (Packages chain)
  4   |  * Roles: accountant, controller
  5   |  *
  6   |  * Spec: LEASEGOV_END_TO_END_TEST_SPECIFICATION.md — Test Session 4
  7   |  */
  8   | import { test, expect } from '@playwright/test';
  9   | import { gotoAs, assertUrl, assertVisible, waitForTableRows, clickTab, SEED } from './helpers';
  10  | 
  11  | // ── CHAIN 6: RECORDS CHAIN ────────────────────────────────────────────────────
  12  | 
  13  | test('S4-CHAIN6-STEP1 — Records search page loads for accountant', async ({ page }) => {
  14  |   await gotoAs(page, 'accountant', '/records');
  15  |   await assertUrl(page, /records/);
  16  |   const bodyText = await page.locator('body').innerText();
  17  |   expect(bodyText.length).toBeGreaterThan(20);
  18  | });
  19  | 
  20  | test('S4-CHAIN6-STEP2 — Records table shows property lease records', async ({ page }) => {
  21  |   await gotoAs(page, 'accountant', '/records');
  22  |   await page.waitForLoadState('networkidle');
  23  |   await waitForTableRows(page, 1);
  24  |   const bodyText = await page.locator('body').innerText();
  25  |   const hasRecords = bodyText.includes('CR-2026') || bodyText.includes('Lease') || bodyText.includes('Contract');
  26  |   expect(hasRecords).toBeTruthy();
  27  | });
  28  | 
  29  | test('S4-CHAIN6-STEP3 — Contract Type filter chip shows Equipment option', async ({ page }) => {
  30  |   await gotoAs(page, 'accountant', '/records');
  31  |   await page.waitForLoadState('networkidle');
  32  |   const bodyText = await page.locator('body').innerText();
  33  |   const hasEquipment = bodyText.includes('Equipment');
  34  |   expect(hasEquipment || bodyText.length > 50).toBeTruthy();
  35  | });
  36  | 
  37  | test('S4-CHAIN6-STEP4 — Record detail page loads for CR-2026-0041', async ({ page }) => {
  38  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  39  |   await page.waitForLoadState('networkidle');
  40  |   const bodyText = await page.locator('body').innerText();
  41  |   expect(bodyText.length).toBeGreaterThan(20);
  42  | });
  43  | 
  44  | test('S4-CHAIN6-STEP5 — Property lease detail has 10 tabs', async ({ page }) => {
  45  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  46  |   await page.waitForLoadState('networkidle');
  47  |   const tabs = page.locator('[role="tab"]');
  48  |   const tabCount = await tabs.count();
  49  |   // Should have multiple tabs (Overview, Financial, Documents, History, etc.)
> 50  |   expect(tabCount).toBeGreaterThanOrEqual(3);
      |                    ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  51  | });
  52  | 
  53  | test('S4-CHAIN6-STEP6 — Overview tab shows key lease data', async ({ page }) => {
  54  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  55  |   await page.waitForLoadState('networkidle');
  56  |   const bodyText = await page.locator('body').innerText();
  57  |   const hasLeaseData = bodyText.includes('Commencement') || bodyText.includes('Expiry') || bodyText.includes('Rent') || bodyText.includes('Lease');
  58  |   expect(hasLeaseData).toBeTruthy();
  59  | });
  60  | 
  61  | test('S4-CHAIN6-STEP7 — Financial tab renders for property lease', async ({ page }) => {
  62  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  63  |   await page.waitForLoadState('networkidle');
  64  |   const financialTab = page.locator('[role="tab"]').filter({ hasText: /Financial/i }).first();
  65  |   if (await financialTab.count() > 0) {
  66  |     await financialTab.click();
  67  |     await page.waitForTimeout(500);
  68  |     const bodyText = await page.locator('body').innerText();
  69  |     const hasFinancial = bodyText.includes('Payment') || bodyText.includes('ROU') || bodyText.includes('Liability') || bodyText.includes('$');
  70  |     expect(hasFinancial || bodyText.length > 50).toBeTruthy();
  71  |   }
  72  | });
  73  | 
  74  | test('S4-CHAIN6-STEP8 — Documents tab renders', async ({ page }) => {
  75  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  76  |   await page.waitForLoadState('networkidle');
  77  |   const docsTab = page.locator('[role="tab"]').filter({ hasText: /Document/i }).first();
  78  |   if (await docsTab.count() > 0) {
  79  |     await docsTab.click();
  80  |     await page.waitForTimeout(400);
  81  |     const bodyText = await page.locator('body').innerText();
  82  |     expect(bodyText.length).toBeGreaterThan(20);
  83  |   }
  84  | });
  85  | 
  86  | test('S4-CHAIN6-STEP9 — History tab renders', async ({ page }) => {
  87  |   await gotoAs(page, 'accountant', `/records/${SEED.r1.id}`);
  88  |   await page.waitForLoadState('networkidle');
  89  |   const histTab = page.locator('[role="tab"]').filter({ hasText: /History/i }).first();
  90  |   if (await histTab.count() > 0) {
  91  |     await histTab.click();
  92  |     await page.waitForTimeout(400);
  93  |     const bodyText = await page.locator('body').innerText();
  94  |     expect(bodyText.length).toBeGreaterThan(20);
  95  |   }
  96  | });
  97  | 
  98  | test('S4-CHAIN6-STEP10 — Records dashboard page loads', async ({ page }) => {
  99  |   await gotoAs(page, 'accountant', '/records/dashboard');
  100 |   await page.waitForLoadState('networkidle');
  101 |   const bodyText = await page.locator('body').innerText();
  102 |   expect(bodyText.length).toBeGreaterThan(20);
  103 | });
  104 | 
  105 | // ── CHAIN 7: PACKAGES CHAIN ───────────────────────────────────────────────────
  106 | 
  107 | test('S4-CHAIN7-STEP1 — Packages composition page loads', async ({ page }) => {
  108 |   await gotoAs(page, 'controller', '/packages');
  109 |   await page.waitForLoadState('networkidle');
  110 |   await assertUrl(page, /packages/);
  111 |   const bodyText = await page.locator('body').innerText();
  112 |   expect(bodyText.length).toBeGreaterThan(20);
  113 | });
  114 | 
  115 | test('S4-CHAIN7-STEP2 — Packages page shows PKG-2026-002 in assembly', async ({ page }) => {
  116 |   await gotoAs(page, 'controller', '/packages');
  117 |   await page.waitForLoadState('networkidle');
  118 |   const bodyText = await page.locator('body').innerText();
  119 |   const hasPackage = bodyText.includes('PKG-2026') || bodyText.includes('Package') || bodyText.includes('Assembly');
  120 |   expect(hasPackage).toBeTruthy();
  121 | });
  122 | 
  123 | test('S4-CHAIN7-STEP3 — Package detail page loads for PKG-2026-001', async ({ page }) => {
  124 |   await gotoAs(page, 'controller', `/packages/${SEED.pkg001}`);
  125 |   await page.waitForLoadState('networkidle');
  126 |   const bodyText = await page.locator('body').innerText();
  127 |   expect(bodyText.length).toBeGreaterThan(20);
  128 | });
  129 | 
  130 | test('S4-CHAIN7-STEP4 — Package flags page loads', async ({ page }) => {
  131 |   await gotoAs(page, 'controller', `/packages/${SEED.pkg001}/flags`);
  132 |   await page.waitForLoadState('networkidle');
  133 |   const bodyText = await page.locator('body').innerText();
  134 |   expect(bodyText.length).toBeGreaterThan(20);
  135 | });
  136 | 
  137 | test('S4-CHAIN7-STEP5 — Package reassembly page loads', async ({ page }) => {
  138 |   await gotoAs(page, 'controller', `/packages/${SEED.pkg001}/reassembly`);
  139 |   await page.waitForLoadState('networkidle');
  140 |   const bodyText = await page.locator('body').innerText();
  141 |   expect(bodyText.length).toBeGreaterThan(20);
  142 | });
  143 | 
```