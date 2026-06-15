# FC-4 Audit — Gap List (Phase 2)
Date: 2026-06-15

## Screens audited
- 4.1 ApprovalsQueue (`/approvals/queue`) — 620 lines — substantive
- 4.2 ApprovalsReview (`/approvals/review/:id`) — 760 lines — substantive
- 4.3 ApprovalsApprover (`/approvals/final/:id`) — 264 lines — substantive
- 4.4 ApprovalsRework (`/approvals/rework`) — 174 lines — substantive
- 4.5 ApprovalsRecall (`/approvals/recall`) — 155 lines — substantive

---

## Gap List

### HIGH — Dead Routes

**[Dead route] ApprovalsReview line 192** — `navigate('/approvals')` is called after a reassign action. No bare `/approvals` route exists in `App.tsx`. The user lands on NotFound. Should navigate to `/approvals/queue`.

**[Dead route] ApprovalsReview line 750** — `navigate("/approvals/final")` (bare, no `:id`) is called after "Approve for Final". While `/approvals/final` (bare) exists in `App.tsx`, it renders `ApprovalsApprover` without an `id` param, so the approver screen falls back to `t1` regardless of which task was reviewed. Should pass the task ID: `navigate(\`/approvals/final/${contractRecordId}\`)`.

**[Dead route] ApprovalsApprover line 230** — `navigate("/approvals/review")` (bare, no `:id`) is called from the "Back to Review" button. While `/approvals/review` bare route exists, it renders ApprovalsReview with no task context. Should pass the task ID: `navigate(\`/approvals/review/${contractRecordId}\`)`.

### MEDIUM — Stale / Missing Breadcrumb

**[Stale breadcrumb] ROUTE_LABELS missing `/approvals/queue`** — The breadcrumb for `/approvals/queue` matches the bare `/approvals` prefix and shows "Approvals / Approvals" (duplicate). A specific entry `{ prefix: '/approvals/queue', label: 'Queue' }` is missing.

**[Stale breadcrumb] ROUTE_LABELS missing `/approvals/final`** — `/approvals/final` and `/approvals/final/:id` have no label entry. Breadcrumb shows the raw path segment.

**[Stale breadcrumb] ROUTE_LABELS missing `/approvals/recall`** — `/approvals/recall` has no label entry. Breadcrumb shows the raw path segment.

**[Stale breadcrumb] ROUTE_LABELS missing `/approvals/rework`** — `/approvals/rework` has no label entry. Breadcrumb shows the raw path segment.

### MEDIUM — No Lock Wiring

**[No lock wiring] ApprovalsReview — no `publishEvent` on open/approve/reject** — BR8 requires the record to be locked while Pending Review. `RecordsDetail` already has `pending_review` and `pending_approval` lock states and a `subscribeToEvents` handler, but `ApprovalsReview` never calls `publishEvent` to set or clear those states. `DemoEventType` has `SUBMIT_FOR_REVIEW` and `APPROVE_FOR_FINAL` but neither is used here.

**[No lock wiring] ApprovalsApprover — no `publishEvent` on final approve/reject** — Same issue. `RECORD_APPROVED` and `DECLINE_SUBMITTED` exist in `DemoEventType` but `ApprovalsApprover` never calls `publishEvent`.

### MEDIUM — Missing event

**[Missing event] `REVIEW_OPENED` not in `DemoEventType`** — BR6 (Recall available until `opened_at` is set) implies a `REVIEW_OPENED` event should fire when the Reviewer opens a task. `ApprovalsRecall` needs to react to this to disable the Recall button. Currently `ApprovalsRecall` ignores the event bus entirely.

### LOW — Static Badge / Hardcoded threshold

**[Static badge] ApprovalsReview line 237/406/450/455** — `criticalVerified >= 22` and `${22 - criticalVerified}` hardcode the critical-field threshold as the literal `22`. The value is derived from `fields.filter(f => f.is_critical).length` which is already computed as `criticalFields.length`. Should use `criticalFields.length` as the threshold instead of the magic number `22`.

### LOW — SuperAdminScreenRegistry gaps

**[Registry] `approvals-review` route_path stale** — Listed as `/approvals/review` (bare). Should be `/approvals/review/:id` to match the actual parameterised route.

**[Registry] `approvals-approver` row missing** — No row for `approvals-approver` (screen 4.3, route `/approvals/final/:id`).

**[Registry] `approvals-recall` row missing** — No row for `approvals-recall` (screen 4.5, route `/approvals/recall`).

**[Registry] `approvals-rework` row missing** — No row for `approvals-rework` (screen 4.4, route `/approvals/rework`).

---

## Summary
- 0 Critical
- 3 High (dead routes)
- 5 Medium (4 stale breadcrumbs + 2 no-lock-wiring + 1 missing event — some overlap)
- 5 Low (1 static badge + 4 registry rows)
