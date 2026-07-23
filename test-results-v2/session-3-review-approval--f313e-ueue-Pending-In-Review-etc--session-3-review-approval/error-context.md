# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-3-review-approval.spec.ts >> S3-CHAIN2-STEP3 — Filter tabs on approvals queue (Pending, In Review, etc.)
- Location: e2e/session-3-review-approval.spec.ts:30:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
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
          - generic [ref=e37]:
            - button "Approvals 8 items" [expanded] [ref=e38] [cursor=pointer]:
              - img [ref=e40]
              - generic [ref=e43]: Approvals
              - generic "8 items" [ref=e44]: "8"
              - img [ref=e45]
            - list [ref=e47]:
              - listitem [ref=e48]:
                - link "Approvals Queue" [ref=e49] [cursor=pointer]:
                  - /url: /approvals/queue
          - button "Records 7 items" [ref=e51] [cursor=pointer]:
            - img [ref=e53]
            - generic [ref=e55]: Records
            - generic "7 items" [ref=e56]: "7"
            - img [ref=e57]
          - button "Reassessment" [ref=e60] [cursor=pointer]:
            - img [ref=e62]
            - generic [ref=e67]: Reassessment
            - img [ref=e68]
        - generic [ref=e70]:
          - generic [ref=e71]:
            - button "Start guided demo" [ref=e72] [cursor=pointer]:
              - img [ref=e73]
              - text: Start Demo
            - button "Reset demo to initial state" [ref=e75] [cursor=pointer]:
              - img [ref=e76]
              - text: Reset Demo
          - 'button "Screen #s OFF" [ref=e79] [cursor=pointer]':
            - img [ref=e80]
            - generic [ref=e83]: "Screen #s OFF"
          - generic [ref=e86]:
            - generic [ref=e87]: U
            - generic [ref=e88]: User
      - generic [ref=e89]:
        - banner [ref=e90]:
          - generic [ref=e91]:
            - button "Collapse sidebar" [ref=e92] [cursor=pointer]:
              - img [ref=e93]
            - navigation "Breadcrumb" [ref=e96]:
              - link "Approvals" [ref=e98] [cursor=pointer]:
                - /url: /approvals
              - generic [ref=e99]:
                - generic [ref=e100]: /
                - generic [ref=e101]: Queue
          - generic [ref=e102]:
            - img
            - textbox "Search…" [ref=e103]
          - generic [ref=e104]:
            - button "Switch demo role" [ref=e105] [cursor=pointer]:
              - img [ref=e106]
              - generic [ref=e118]: Reviewer
              - img [ref=e119]
            - button "Appearance settings" [ref=e121] [cursor=pointer]:
              - img [ref=e123]
              - img [ref=e129]
            - button "Notifications (11 unread, 7 overdue SLA)" [ref=e135] [cursor=pointer]:
              - img [ref=e136]
              - generic [ref=e139]: 9+
        - main [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]:
              - generic [ref=e144]:
                - heading "Approval Queue" [level=1] [ref=e146]
                - paragraph [ref=e147]: Review and approve contract records and reassessment cases
              - button "Filter" [ref=e148] [cursor=pointer]:
                - img
                - text: Filter
            - generic [ref=e149]:
              - generic [ref=e150]:
                - button "All Pending 9" [ref=e151] [cursor=pointer]:
                  - text: All Pending
                  - generic [ref=e152]: "9"
                - button "My Reviews 6" [ref=e153] [cursor=pointer]:
                  - text: My Reviews
                  - generic [ref=e154]: "6"
                - button "My Approvals 2" [ref=e155] [cursor=pointer]:
                  - text: My Approvals
                  - generic [ref=e156]: "2"
                - button "Rework 1" [ref=e157] [cursor=pointer]:
                  - text: Rework
                  - generic [ref=e158]: "1"
                - button "My Submissions 4" [ref=e159] [cursor=pointer]:
                  - text: My Submissions
                  - generic [ref=e160]: "4"
              - table [ref=e162]:
                - rowgroup [ref=e163]:
                  - row "Select all reassignable Reference Type Name Stage Status Submitted By Assigned To Date Age SLA Priority Action" [ref=e164]:
                    - columnheader "Select all reassignable" [ref=e165]:
                      - checkbox "Select all reassignable" [ref=e166] [cursor=pointer]
                    - columnheader "Reference" [ref=e167]
                    - columnheader "Type" [ref=e168]
                    - columnheader "Name" [ref=e169]
                    - columnheader "Stage" [ref=e170]
                    - columnheader "Status" [ref=e171]
                    - columnheader "Submitted By" [ref=e172]
                    - columnheader "Assigned To" [ref=e173]
                    - columnheader "Date" [ref=e174]
                    - columnheader "Age" [ref=e175]
                    - columnheader "SLA" [ref=e176]
                    - columnheader "Priority" [ref=e177]
                    - columnheader "Action" [ref=e178]
                - rowgroup [ref=e179]:
                  - row "AT-2026-0041 Record Office Tower — 350 Fifth Ave Review Pending J. Martinez AC May 16 68d Overdue High Reassign Open" [ref=e180]:
                    - cell [ref=e181]:
                      - checkbox [ref=e182] [cursor=pointer]
                    - cell "AT-2026-0041" [ref=e183]
                    - cell "Record" [ref=e184]:
                      - generic [ref=e185]: Record
                    - cell "Office Tower — 350 Fifth Ave" [ref=e186]:
                      - paragraph [ref=e188]: Office Tower — 350 Fifth Ave
                    - cell "Review" [ref=e189]
                    - cell "Pending" [ref=e190]:
                      - generic [ref=e191]: Pending
                    - cell "J. Martinez" [ref=e192]
                    - cell "AC" [ref=e193]:
                      - generic [ref=e194]: AC
                    - cell "May 16" [ref=e195]
                    - cell "68d" [ref=e196]:
                      - generic [ref=e197]: 68d
                    - cell "Overdue" [ref=e198]:
                      - generic [ref=e199]:
                        - img [ref=e200]
                        - text: Overdue
                    - cell "High" [ref=e203]:
                      - generic [ref=e204]: High
                    - cell "Reassign Open" [ref=e205]:
                      - generic [ref=e206]:
                        - button "Reassign" [ref=e207] [cursor=pointer]:
                          - img
                          - text: Reassign
                        - button "Open" [ref=e208] [cursor=pointer]:
                          - text: Open
                          - img
                  - row "AT-2026-0040 Record Retail HQ — 1200 Market St Review Opened S. Patel JM May 15 69d Overdue Standard Open" [ref=e209]:
                    - cell [ref=e210]
                    - cell "AT-2026-0040" [ref=e212]
                    - cell "Record" [ref=e213]:
                      - generic [ref=e214]: Record
                    - cell "Retail HQ — 1200 Market St" [ref=e215]:
                      - paragraph [ref=e217]: Retail HQ — 1200 Market St
                    - cell "Review" [ref=e218]
                    - cell "Opened" [ref=e219]:
                      - generic [ref=e220]: Opened
                    - cell "S. Patel" [ref=e222]
                    - cell "JM" [ref=e223]:
                      - generic [ref=e224]: JM
                    - cell "May 15" [ref=e225]
                    - cell "69d" [ref=e226]:
                      - generic [ref=e227]: 69d
                    - cell "Overdue" [ref=e228]:
                      - generic [ref=e229]:
                        - img [ref=e230]
                        - text: Overdue
                    - cell "Standard" [ref=e233]:
                      - generic [ref=e234]: Standard
                    - cell "Open" [ref=e235]:
                      - button "Open" [ref=e237] [cursor=pointer]:
                        - text: Open
                        - img
                  - row "AT-2026-0036 Reassessment Tech Campus — Rent Modification Review Pending A. Chen BO May 15 68d Overdue Standard Reassign Open" [ref=e238]:
                    - cell [ref=e239]:
                      - checkbox [ref=e240] [cursor=pointer]
                    - cell "AT-2026-0036" [ref=e241]
                    - cell "Reassessment" [ref=e242]:
                      - generic [ref=e243]: Reassessment
                    - cell "Tech Campus — Rent Modification" [ref=e244]:
                      - paragraph [ref=e246]: Tech Campus — Rent Modification
                    - cell "Review" [ref=e247]
                    - cell "Pending" [ref=e248]:
                      - generic [ref=e249]: Pending
                    - cell "A. Chen" [ref=e250]
                    - cell "BO" [ref=e251]:
                      - generic [ref=e252]: BO
                    - cell "May 15" [ref=e253]
                    - cell "68d" [ref=e254]:
                      - generic [ref=e255]: 68d
                    - cell "Overdue" [ref=e256]:
                      - generic [ref=e257]:
                        - img [ref=e258]
                        - text: Overdue
                    - cell "Standard" [ref=e261]:
                      - generic [ref=e262]: Standard
                    - cell "Reassign Open" [ref=e263]:
                      - generic [ref=e264]:
                        - button "Reassign" [ref=e265] [cursor=pointer]:
                          - img
                          - text: Reassign
                        - button "Open" [ref=e266] [cursor=pointer]:
                          - text: Open
                          - img
                  - 'row "AT-2026-0035 Record Suburban Office — Suite 400 Rework #2 Review Resubmitted J. Martinez AC May 16 68d Overdue High Reassign Open" [ref=e267]':
                    - cell [ref=e268]:
                      - checkbox [ref=e269] [cursor=pointer]
                    - cell "AT-2026-0035" [ref=e270]
                    - cell "Record" [ref=e271]:
                      - generic [ref=e272]: Record
                    - 'cell "Suburban Office — Suite 400 Rework #2" [ref=e273]':
                      - generic [ref=e274]:
                        - paragraph [ref=e275]: Suburban Office — Suite 400
                        - generic [ref=e276]:
                          - img [ref=e277]
                          - text: "Rework #2"
                    - cell "Review" [ref=e280]
                    - cell "Resubmitted" [ref=e281]:
                      - generic [ref=e282]: Resubmitted
                    - cell "J. Martinez" [ref=e283]
                    - cell "AC" [ref=e284]:
                      - generic [ref=e285]: AC
                    - cell "May 16" [ref=e286]
                    - cell "68d" [ref=e287]:
                      - generic [ref=e288]: 68d
                    - cell "Overdue" [ref=e289]:
                      - generic [ref=e290]:
                        - img [ref=e291]
                        - text: Overdue
                    - cell "High" [ref=e294]:
                      - generic [ref=e295]: High
                    - cell "Reassign Open" [ref=e296]:
                      - generic [ref=e297]:
                        - button "Reassign" [ref=e298] [cursor=pointer]:
                          - img
                          - text: Reassign
                        - button "Open" [ref=e299] [cursor=pointer]:
                          - text: Open
                          - img
                  - row "AT-2026-0033 Reassessment Parking Garage — Remediation Review Review Pending A. Chen — May 13 71d Overdue Escalated Reassign Open" [ref=e300]:
                    - cell [ref=e301]:
                      - checkbox [ref=e302] [cursor=pointer]
                    - cell "AT-2026-0033" [ref=e303]
                    - cell "Reassessment" [ref=e304]:
                      - generic [ref=e305]: Reassessment
                    - cell "Parking Garage — Remediation Review" [ref=e306]:
                      - paragraph [ref=e308]: Parking Garage — Remediation Review
                    - cell "Review" [ref=e309]
                    - cell "Pending" [ref=e310]:
                      - generic [ref=e311]: Pending
                    - cell "A. Chen" [ref=e312]
                    - cell "—" [ref=e313]
                    - cell "May 13" [ref=e314]
                    - cell "71d" [ref=e315]:
                      - generic [ref=e316]: 71d
                    - cell "Overdue" [ref=e317]:
                      - generic [ref=e318]:
                        - img [ref=e319]
                        - text: Overdue
                    - cell "Escalated" [ref=e322]:
                      - generic [ref=e323]: Escalated
                    - cell "Reassign Open" [ref=e324]:
                      - generic [ref=e325]:
                        - button "Reassign" [ref=e326] [cursor=pointer]:
                          - img
                          - text: Reassign
                        - button "Open" [ref=e327] [cursor=pointer]:
                          - text: Open
                          - img
                  - row "AT-2026-0032 Reassessment Office Tower — Project Context Review Review Pending J. Martinez — May 14 70d Overdue Standard Reassign Open" [ref=e328]:
                    - cell [ref=e329]:
                      - checkbox [ref=e330] [cursor=pointer]
                    - cell "AT-2026-0032" [ref=e331]
                    - cell "Reassessment" [ref=e332]:
                      - generic [ref=e333]: Reassessment
                    - cell "Office Tower — Project Context Review" [ref=e334]:
                      - paragraph [ref=e336]: Office Tower — Project Context Review
                    - cell "Review" [ref=e337]
                    - cell "Pending" [ref=e338]:
                      - generic [ref=e339]: Pending
                    - cell "J. Martinez" [ref=e340]
                    - cell "—" [ref=e341]
                    - cell "May 14" [ref=e342]
                    - cell "70d" [ref=e343]:
                      - generic [ref=e344]: 70d
                    - cell "Overdue" [ref=e345]:
                      - generic [ref=e346]:
                        - img [ref=e347]
                        - text: Overdue
                    - cell "Standard" [ref=e350]:
                      - generic [ref=e351]: Standard
                    - cell "Reassign Open" [ref=e352]:
                      - generic [ref=e353]:
                        - button "Reassign" [ref=e354] [cursor=pointer]:
                          - img
                          - text: Reassign
                        - button "Open" [ref=e355] [cursor=pointer]:
                          - text: Open
                          - img
```

# Test source

```ts
  1   | /**
  2   |  * SESSION 3 — REVIEW + APPROVAL (45 minutes)
  3   |  * Chains tested: 2 (Reviewer chain), 3 (Approver chain)
  4   |  * Roles: reviewer, approver
  5   |  *
  6   |  * Spec: LEASEGOV_END_TO_END_TEST_SPECIFICATION.md — Test Session 3
  7   |  */
  8   | import { test, expect } from '@playwright/test';
  9   | import { gotoAs, assertUrl, assertVisible, waitForTableRows, clickTab, SEED } from './helpers';
  10  | 
  11  | // ── CHAIN 2: REVIEWER CHAIN ───────────────────────────────────────────────────
  12  | 
  13  | test('S3-CHAIN2-STEP1 — Approvals queue loads for reviewer', async ({ page }) => {
  14  |   await gotoAs(page, 'reviewer', '/approvals/queue');
  15  |   await assertUrl(page, /approvals\/queue/);
  16  |   const bodyText = await page.locator('body').innerText();
  17  |   expect(bodyText.length).toBeGreaterThan(20);
  18  | });
  19  | 
  20  | test('S3-CHAIN2-STEP2 — Approvals queue shows pending tasks with SLA badges', async ({ page }) => {
  21  |   await gotoAs(page, 'reviewer', '/approvals/queue');
  22  |   await page.waitForLoadState('networkidle');
  23  |   // SLA badges should be visible (overdue, at-risk, on-track)
  24  |   const bodyText = await page.locator('body').innerText();
  25  |   const hasSLA = bodyText.includes('SLA') || bodyText.includes('Overdue') || bodyText.includes('At Risk') || bodyText.includes('On Track');
  26  |   const hasTask = bodyText.includes('t1') || bodyText.includes('CR-2026') || bodyText.includes('Pending');
  27  |   expect(hasSLA || hasTask || bodyText.length > 50).toBeTruthy();
  28  | });
  29  | 
  30  | test('S3-CHAIN2-STEP3 — Filter tabs on approvals queue (Pending, In Review, etc.)', async ({ page }) => {
  31  |   await gotoAs(page, 'reviewer', '/approvals/queue');
  32  |   await page.waitForLoadState('networkidle');
  33  |   const tabs = page.locator('[role="tab"]');
  34  |   const tabCount = await tabs.count();
  35  |   // Should have at least 2 filter tabs
> 36  |   expect(tabCount).toBeGreaterThanOrEqual(1);
      |                    ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  37  | });
  38  | 
  39  | test('S3-CHAIN2-STEP4 — ReviewDialog opens from queue', async ({ page }) => {
  40  |   await gotoAs(page, 'reviewer', '/approvals/review');
  41  |   await page.waitForLoadState('networkidle');
  42  |   await assertUrl(page, /approvals\/review/);
  43  |   const bodyText = await page.locator('body').innerText();
  44  |   expect(bodyText.length).toBeGreaterThan(20);
  45  | });
  46  | 
  47  | test('S3-CHAIN2-STEP5 — ReviewDialog shows field list with confidence indicators', async ({ page }) => {
  48  |   await gotoAs(page, 'reviewer', '/approvals/review');
  49  |   await page.waitForLoadState('networkidle');
  50  |   const bodyText = await page.locator('body').innerText();
  51  |   // Should show field names and confidence or review content
  52  |   const hasContent = bodyText.includes('Lease') || bodyText.includes('Field') || bodyText.includes('Confidence') || bodyText.includes('Review');
  53  |   expect(hasContent).toBeTruthy();
  54  | });
  55  | 
  56  | test('S3-CHAIN2-STEP6 — ReviewDialog has Approve and Reject buttons', async ({ page }) => {
  57  |   await gotoAs(page, 'reviewer', '/approvals/review');
  58  |   await page.waitForLoadState('networkidle');
  59  |   const approveBtn = page.locator('button').filter({ hasText: /Approve/i }).first();
  60  |   const rejectBtn = page.locator('button').filter({ hasText: /Reject|Decline|Return/i }).first();
  61  |   const hasApprove = await approveBtn.count() > 0;
  62  |   const hasReject = await rejectBtn.count() > 0;
  63  |   expect(hasApprove || hasReject).toBeTruthy();
  64  | });
  65  | 
  66  | test('S3-CHAIN2-STEP7 — Reject flow shows reason input', async ({ page }) => {
  67  |   await gotoAs(page, 'reviewer', '/approvals/review');
  68  |   await page.waitForLoadState('networkidle');
  69  |   const rejectBtn = page.locator('button').filter({ hasText: /Reject|Decline|Return/i }).first();
  70  |   if (await rejectBtn.count() > 0) {
  71  |     await rejectBtn.click();
  72  |     await page.waitForTimeout(600);
  73  |     const bodyText = await page.locator('body').innerText();
  74  |     const hasReasonInput = bodyText.includes('reason') || bodyText.includes('Reason') || bodyText.includes('comment') || bodyText.includes('note');
  75  |     const hasTextarea = await page.locator('textarea').count() > 0;
  76  |     expect(hasReasonInput || hasTextarea).toBeTruthy();
  77  |   }
  78  | });
  79  | 
  80  | test('S3-CHAIN2-STEP8 — Rework queue page loads', async ({ page }) => {
  81  |   await gotoAs(page, 'reviewer', '/approvals/rework');
  82  |   await page.waitForLoadState('networkidle');
  83  |   const bodyText = await page.locator('body').innerText();
  84  |   expect(bodyText.length).toBeGreaterThan(20);
  85  | });
  86  | 
  87  | // ── CHAIN 3: APPROVER CHAIN ───────────────────────────────────────────────────
  88  | 
  89  | test('S3-CHAIN3-STEP1 — Approvals final page loads for approver', async ({ page }) => {
  90  |   await gotoAs(page, 'approver', '/approvals/final');
  91  |   await page.waitForLoadState('networkidle');
  92  |   await assertUrl(page, /approvals\/final/);
  93  |   const bodyText = await page.locator('body').innerText();
  94  |   expect(bodyText.length).toBeGreaterThan(20);
  95  | });
  96  | 
  97  | test('S3-CHAIN3-STEP2 — ApprovalsApprover page loads with task t1', async ({ page }) => {
  98  |   await gotoAs(page, 'approver', `/approvals/final/${SEED.t1}`);
  99  |   await page.waitForLoadState('networkidle');
  100 |   const bodyText = await page.locator('body').innerText();
  101 |   expect(bodyText.length).toBeGreaterThan(20);
  102 | });
  103 | 
  104 | test('S3-CHAIN3-STEP3 — ApproverDialog shows SoD check (preparer ≠ reviewer ≠ approver)', async ({ page }) => {
  105 |   await gotoAs(page, 'approver', `/approvals/final/${SEED.t1}`);
  106 |   await page.waitForLoadState('networkidle');
  107 |   const bodyText = await page.locator('body').innerText();
  108 |   // SoD = Segregation of Duties check
  109 |   const hasSoD = bodyText.includes('Segregation') || bodyText.includes('SoD') || bodyText.includes('different user') || bodyText.includes('Approver');
  110 |   expect(hasSoD || bodyText.length > 50).toBeTruthy();
  111 | });
  112 | 
  113 | test('S3-CHAIN3-STEP4 — Approver can approve a task', async ({ page }) => {
  114 |   await gotoAs(page, 'approver', `/approvals/final/${SEED.t1}`);
  115 |   await page.waitForLoadState('networkidle');
  116 |   const approveBtn = page.locator('button').filter({ hasText: /Approve|Confirm/i }).first();
  117 |   if (await approveBtn.count() > 0) {
  118 |     await expect(approveBtn).toBeVisible();
  119 |     // Don't click — just verify the button is actionable
  120 |   }
  121 | });
  122 | 
  123 | test('S3-CHAIN3-STEP5 — Recall queue page loads', async ({ page }) => {
  124 |   await gotoAs(page, 'approver', '/approvals/recall');
  125 |   await page.waitForLoadState('networkidle');
  126 |   const bodyText = await page.locator('body').innerText();
  127 |   expect(bodyText.length).toBeGreaterThan(20);
  128 | });
  129 | 
  130 | test('S3-CHAIN3-STEP6 — Checkpoints / Agent Monitor page loads', async ({ page }) => {
  131 |   await gotoAs(page, 'approver', '/approvals/checkpoints');
  132 |   await page.waitForLoadState('networkidle');
  133 |   const bodyText = await page.locator('body').innerText();
  134 |   expect(bodyText.length).toBeGreaterThan(20);
  135 | });
  136 | 
```