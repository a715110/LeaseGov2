# FC-9 Audit Gap List — AI Agents and Automation Cluster

**Screens audited:** AgentCheckpointQueue, AgentActivityMonitor
**Audit date:** 2026-06-15

---

## Summary

| Severity | Count | Description |
|---|---|---|
| Critical | 0 | — |
| High | 3 | Dead routes in checkpoint type config; stale Breadcrumb label for checkpoint route |
| Medium | 2 | Missing registry rows; bare /agents route missing |
| Low | 1 | SECTION_ROOTS /agents links to dead /agents path |

---

## Gap Detail

### HIGH

**H1 — AgentCheckpointQueue: 4 checkpoint type routes are dead**
- `extraction_review` → `/extraction/verification` — does NOT exist; actual route is `/extraction/verify`
- `classification_confirm` → `/reassessment/classification` — does NOT exist; actual route is `/reassessment/cases/:id/classify`
- `assessment_confirm` → `/reassessment/assessment` — does NOT exist; actual route is `/reassessment/cases/:id/assess`
- `analysis_confirm` → `/reassessment/analysis` — does NOT exist; actual route is `/reassessment/cases/:id/analysis`
- `export_attest` → `/export/upload-task` — does NOT exist; actual route is `/export/tasks` (bare) or `/export/tasks/:id`
- `onboarding_approval` → `/onboarding/complete` — this route DOES exist (line 374 App.tsx) ✓
- **Fix:** Correct the 5 dead route strings in the `CHECKPOINT_TYPE_CONFIG` map. For parameterised reassessment routes, use a fallback case ID (e.g., `cp.contract_id`) or navigate to `/reassessment/cases` (the list).

**H2 — Breadcrumb stale label: `/agents/checkpoints` vs actual route `/approvals/checkpoints`**
- `ROUTE_LABELS` has `{ prefix: '/agents/checkpoints', label: 'Checkpoint Queue' }` but the actual route is `/approvals/checkpoints`.
- Navigating to `/approvals/checkpoints` shows `Approvals / Checkpoints` (from the `/approvals/checkpoints` entry at line 48) rather than `Agents / Checkpoint Queue`.
- The `/agents/checkpoints` entry is dead — no route at that path exists.
- **Fix:** Remove the stale `/agents/checkpoints` entry; the existing `/approvals/checkpoints` → `Checkpoints` entry is correct.

**H3 — SECTION_ROOTS `/agents` links to dead `/agents` path**
- `SECTION_ROOTS['/agents'] = '/agents'` — no route exists at `/agents`; navigating there shows 404.
- The breadcrumb "Agents" root crumb links to a dead URL.
- **Fix:** Change `SECTION_ROOTS['/agents']` to `/approvals/checkpoints` (the first and primary agents screen).

### MEDIUM

**M1 — SuperAdminScreenRegistry missing both FC-9 rows**
- Neither `agent-checkpoint-queue` nor `agent-activity-monitor` appear in the registry table.
- Spec (SCREEN_REGISTRY_SPECIFICATION_V2.md lines 714–715) defines both rows.
- **Fix:** Add both rows with correct route_path, role_access, feature_cluster, and dependency_screen_keys.

**M2 — No bare `/agents` route in App.tsx**
- The sidebar "Agents" group header has no corresponding route — clicking the group header navigates to `/agents` which renders 404.
- **Fix:** Add `<Route path="/agents"><Redirect to="/approvals/checkpoints" /></Route>` in App.tsx.

### LOW

*(No additional Low gaps beyond what is covered by H3 and M2 above.)*

---

## No-Gap Notes

- **No hardcoded record IDs used in navigation** — `CR-2026-*` IDs in mock data are display-only labels, not used in `navigate()` calls.
- **SCREEN_KEYS correct** — `AGENT_CHECKPOINT_QUEUE` and `AGENT_ACTIVITY_MONITOR` are defined and used correctly.
- **AgentActivityMonitor navigate call correct** — `navigate('/approvals/checkpoints')` at line 358 matches the actual App.tsx route.
- **Both screens use `_screenKey`** — `ScreenNumberBadge` is wired correctly in both components.
