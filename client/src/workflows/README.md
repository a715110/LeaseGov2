# Workflows — Composable Sequence Definitions

This folder contains **workflow sequence definitions** — the composable step arrays that agents read to execute multi-step processes.

This is **not** the same as `pages/workflows/` which contains UI screens for workflow-related views.

## Structure

```
workflows/
  contracts/
    propertyLeaseOnboardingWorkflow.ts   ← Onboarding sequence (upload → OCR → extract → validate → survey → approve)
    propertyLeaseReassessmentWorkflow.ts ← Reassessment sequence (trigger → analyse → review → update → approve)
  documents/
    documentIntakeWorkflow.ts            ← Document intake sequence (upload → validate → classify → queue)
    documentExtractionWorkflow.ts        ← Extraction sequence (OCR → extract → confidence-check → flag)
  surveys/
    surveyWorkflow.ts                    ← Survey delivery sequence (dispatch → remind → collect → close)
  README.md                             ← This file
```

## Conventions

- Each workflow file exports a `WorkflowDefinition` object with a `steps` array.
- Steps reference agent functions by name — they do not import agents directly.
- Human checkpoint steps include a `checkpointType` field consumed by `ScreenGate`.
- Workflow definitions are read-only at runtime — they are never mutated.
- When adding a new contract domain, create a new subfolder and workflow file here.

## Architecture Reference

MASTER_FRONTEND_ARCHITECTURE_V4 — Part 8 (Workflow Sequences)
