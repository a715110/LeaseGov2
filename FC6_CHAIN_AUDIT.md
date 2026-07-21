# FC-6 Reassessment Chain-Break Audit — 2026-07-21

## Chain breaks confirmed (7 total)

### Break 1: ReassessmentConcurrentWarn — no :id param
- Route: `/reassessment/concurrent` (no `:id`)
- MOCK_CASE hardcoded to `c4` (RC-2026-0011)
- No `useParams` / `useSearch`
- Fix: Change App.tsx route to `/reassessment/cases/:id/concurrent`, add `useParams` to component

### Break 2: ReassessmentClassification concurrent banner — no case ID in link
- Banner at line 157 shows text but no navigate link to concurrent warn screen
- Fix: Add `onClick={() => navigate(\`/reassessment/cases/${MOCK_CASE.id}/concurrent\`)}` to banner

### Break 3: ReassessmentAnalysis (case-detail) — no "Continue to Memo" button
- Action bar only has "Submit for Approval" (skips Memo step)
- Fix: Add "Continue to Memo" button: `navigate(\`/reassessment/cases/${MOCK_CASE.id}/memo\`)`

### Break 4: ReassessmentMemo (case-detail) — no "Continue to Package Preview" button
- Action bar only has "Submit for Approval" (skips Package Preview step)
- Fix: Add "Continue to Package Preview" button: `navigate(\`/reassessment/cases/${MOCK_CASE.id}/package\`)`

### Break 5: ReassessmentTrigger — no case ID after submit
- After submit, navigates to `/reassessment/cases` with no new case ID
- Fix: Generate a new case ID (e.g. `c-new-${Date.now()}`) and navigate to `/reassessment/cases/c1/classify` (fallback to c1 since no backend)

### Break 6: Workflow screens (4 files) — all hardcode MOCK_CASE to RC-2026-0014
- Files: ReassessmentReview, ReassessmentApproval, ReassessmentAnalysis, ReassessmentUpdate
- Fix: Add `useSearch` + `?caseId=` param, add MOCK_CASES_LOOKUP, replace hardcoded MOCK_CASE

### Break 7: ApprovalsQueue Open button — reassessment_case tasks not routed to workflow screens
- Tasks t3 (reassessment_case, final_approval) and t6 (reassessment_case, review) go to `/approvals/review/:id`
- Fix: Add `case_id` field to t3 (c3 = RC-2026-0012) and t6 (c6 = RC-2026-0009)
- Route: t6 → `/workflows/reassessment/review?caseId=c6`, t3 → `/workflows/reassessment/approval?caseId=c3`

## What is already correct (no fix needed)
- ReassessmentCaseList → classify uses `c.id` ✓
- ReassessmentDashboard → classify uses `a.caseId` ✓
- All 5 case-detail screens use `useParams<{id}>` + `MOCK_CASES_LOOKUP[params.id]` ✓
- classify → assess uses `MOCK_CASE.id` ✓
- assess → analysis uses `MOCK_CASE.id` ✓

## MOCK_CASES_LOOKUP canonical data (from ReassessmentClassification)
c1: RC-2026-0014, CR-2026-0088, Office Tower — 350 Fifth Ave, mod_term, modification
c2: RC-2026-0013, CR-2026-0072, Retail HQ — 200 Park Ave, opt_assess, reassessment
c3: RC-2026-0012, CR-2026-0055, Warehouse — 1 Industrial Blvd, opt_assess, reassessment
c4: RC-2026-0011, CR-2026-0041, Data Center — 500 Tech Park, mod_rent, modification
c5: RC-2026-0010, CR-2026-0033, Branch Office — 88 Main St, mod_scope_inc, modification
c6: RC-2026-0009, CR-2026-0028, Parking Garage — Level B2, compound, modification (concurrent: c1,c2)
c7: RC-2026-0008, CR-2026-0088, Office Tower — 350 Fifth Ave, opt_assess, reassessment
c8: RC-2026-0007, CR-2026-0072, Retail HQ — 200 Park Ave, mod_index, modification
c9: RC-2026-0006, CR-2026-0055, Warehouse — 1 Industrial Blvd, class_reass, reassessment
c10: RC-2026-0005, CR-2026-0041, Data Center — 500 Tech Park, opt_assess, reassessment

## ApprovalsQueue task mapping for reassessment_case tasks
t3: AT-2026-0039, reassessment_case, final_approval → map to case c3 (Warehouse Lease — Scope Increase)
t6: AT-2026-0036, reassessment_case, review → map to case c6 (Tech Campus — Rent Modification → Parking Garage)
