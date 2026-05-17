/**
 * DoDesk MVP — Demo Mode Context (Role-Aware)
 * Back/Next navigate ONLY within the steps belonging to the active role in this tab.
 * Cross-tab handoffs are triggered at each role boundary.
 *
 * Step coverage (v2 — updated to reflect current inline-dialog workflow):
 *   Document Submitter  : steps 1–4   (unchanged)
 *   Preparer           : steps 5–12  (expanded: Processing Workflow dialog, Extractions Table, Flag Panel)
 *   Reviewer           : steps 13–16 (updated: /approvals/queue + ReviewDialog421 inline)
 *   Approver           : steps 17–18 (updated routes)
 *   Accountant         : steps 19–20 (unchanged)
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { UserRole } from '@/lib/types';
import { clearEventHistory, publishEvent, subscribeToEvents } from '@/lib/eventBus';

export interface DemoStep {
  id: string;
  stepNumber: number;
  role: UserRole;
  roleLabel: string;
  roleColor: string;
  /** Screen number badge, e.g. "2.3.1" */
  screenNumber?: string;
  title: string;
  description: string;
  instruction: string;
  route: string;
  eventToPublish?: { type: string; payload: Record<string, unknown> };
  tabHint?: string;
  isHandoff?: boolean;
  handoffTo?: UserRole;
  handoffLabel?: string;
}

export const DEMO_STEPS: DemoStep[] = [
  // ── PIPELINE OPERATOR ──────────────────────────────────────────────────────
  {
    id: 'step-1', stepNumber: 1, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.1',
    title: 'Pipeline Dashboard',
    description: 'The Document Submitter monitors all incoming documents. The dashboard shows real-time status across all staged files — Uploaded, Validating, Valid, Warning, Invalid, Ready, and Submitted.',
    instruction: 'Review the status summary cards. Notice 24 Valid files and 8 Ready for submission.',
    route: '/pipeline/dashboard', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-2', stepNumber: 2, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.2',
    title: 'Upload & Validate Documents',
    description: 'The operator drags and drops lease documents. The system automatically validates file format, page count, and readability. Each file receives a status badge in real time.',
    instruction: 'Observe the drag-and-drop zone and the inline validation status badges on each uploaded file.',
    route: '/pipeline/upload', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-3', stepNumber: 3, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.3',
    title: 'Review & Group Documents',
    description: 'Valid documents are grouped into contract packages. The operator assigns each document to a workspace and verifies the grouping before submission.',
    instruction: 'Review the document groupings. Each group maps to a contract package that will flow to the Preparer.',
    route: '/pipeline/review', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-4', stepNumber: 4, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.4',
    title: 'Submit Batch — Handoff to Preparer',
    description: "The operator submits the validated batch. This triggers the cross-tab handoff — the Preparer's Processing Queue will receive the new jobs immediately.",
    instruction: 'Click "Submit Batch" to send the documents to the Preparer. Watch Tab 2 receive the new jobs in real time.',
    route: '/pipeline/confirm',
    eventToPublish: { type: 'BATCH_SUBMITTED', payload: { batchId: 'BATCH-DEMO-001', documentCount: 12, workspaceTag: 'Q1-2026-Retail', submittedBy: 'Document Submitter' } },
    isHandoff: true, handoffTo: 'preparer',
    handoffLabel: 'Batch submitted → Preparer receives 12 new jobs in Processing Queue',
    tabHint: 'Tab 1 — Document Submitter',
  },

  // ── PREPARER ───────────────────────────────────────────────────────────────
  {
    id: 'step-5', stepNumber: 5, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.1',
    title: 'Processing Queue — New Jobs Received',
    description: "The Preparer sees the newly submitted batch in their Processing Queue. Each job shows the document name, workspace tag, AI confidence estimate, and current status. Clicking the Process button opens the 5-step Processing Workflow dialog.",
    instruction: 'Point to the new jobs at the top of the queue (highlighted in blue). The batch from Tab 1 arrived here automatically. Click "Process" on any job to open the workflow dialog.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-6', stepNumber: 6, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.3.1',
    title: 'Field Mapping Configuration',
    description: 'Step 1 of the Processing Workflow dialog: the Preparer maps source document columns to the standard lease schema. The Confirm Mapping button is gated until all required fields are mapped. A confirmation modal summarises the mapping before committing.',
    instruction: 'Open the Processing Workflow dialog from the queue. Show Step 1 — Field Mapping. Demonstrate adding a field mapping and clicking Confirm Mapping.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-7', stepNumber: 7, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.4',
    title: 'AI Extraction — Processing in Progress',
    description: 'Step 2 of the Processing Workflow: the AI engine extracts all 73 lease fields from the document. A live progress bar shows extraction status per field category. The Preparer can monitor without intervening.',
    instruction: 'Show Step 2 in the dialog — the AI extraction progress bar animating across field categories. Point out the estimated completion time.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-8', stepNumber: 8, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.5.1',
    title: 'Confidence Review — Heatmap & Threshold',
    description: 'Step 4 of the Processing Workflow: the Confidence Review panel shows every extracted field with an animated confidence bar. The Preparer sets a threshold; fields below it are flagged for mandatory review. Critical fields auto-confirm when verified. A non-critical nudge banner appears when all critical fields are done.',
    instruction: 'Show the confidence heatmap in Step 4. Adjust the threshold slider. Click "Verify All Below Threshold" to bulk-verify. Point out the critical-field progress pill and the auto-advance behaviour when all are confirmed.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-9', stepNumber: 9, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.6.1',
    title: 'Verify & Complete — Save or Submit',
    description: 'Step 5 of the Processing Workflow: the Preparer reviews the final verified field list. "Save & Close" saves the package as In-Progress. "Complete" (gated until all documents are verified) marks the package as Completed and navigates to the Extractions Table.',
    instruction: 'Show Step 5. Demonstrate "Save & Close" saving as In-Progress, then re-open and click "Complete" to mark the package as Completed.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-10', stepNumber: 10, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.7',
    title: 'Extractions Table — Completed & In-Progress Packages',
    description: 'The Extractions Table shows all packages: Completed, In-Progress, and Submitted. Flagged rows display per-category flag icons (Data, Classification, Compliance, Other). The Preparer can open a flag panel or submit a Completed package for review.',
    instruction: 'Navigate to the Extractions Table. Point out the status badges, flag icons on flagged rows, and the Submit button on Completed packages.',
    route: '/extraction/verify', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-11', stepNumber: 11, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '3.1.1',
    title: 'Flag Review Panel — Inline Resolution',
    description: 'Clicking the flag icon on a flagged row opens the Flag Sliding Panel (Screen 3.1.1): a 600px right drawer showing all flags grouped by category with severity badges. Opening a flag opens the nested Resolution Panel (Screen 3.2.1) where the Preparer can select a resolution type, add rationale, and mark the flag as Resolved.',
    instruction: 'Click the flag icon on a flagged row to open the Flag Panel. Expand a flag and click "Open Resolution Panel". Show the resolution options and Mark as Resolved.',
    route: '/extraction/verify', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-12', stepNumber: 12, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.7',
    title: 'Submit for Review — Handoff to Reviewer',
    description: "The Preparer submits the verified, flag-resolved package for Reviewer approval. This triggers the cross-tab handoff — the Reviewer's Approval Queue will receive the new item immediately.",
    instruction: 'Click "Submit" on a Completed package in the Extractions Table. Watch Tab 3 receive the new approval task in real time.',
    route: '/extraction/verify',
    eventToPublish: { type: 'SUBMIT_FOR_REVIEW', payload: { jobId: 'JOB-DEMO-001', documentName: 'Retail-Lease-HQ-2026.pdf', preparedBy: 'Preparer', confidence: 94 } },
    isHandoff: true, handoffTo: 'reviewer',
    handoffLabel: 'Submitted for review → Reviewer receives new approval task in Approval Queue',
    tabHint: 'Tab 2 — Preparer',
  },

  // ── REVIEWER ───────────────────────────────────────────────────────────────
  {
    id: 'step-13', stepNumber: 13, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.1',
    title: 'Approval Queue — New Item Received',
    description: 'The Reviewer sees the submitted record in their Approval Queue. The queue shows priority, document name, Preparer, submission time, and overall confidence score. Items submitted from the Preparer tab appear here in real time.',
    instruction: 'Point to the new item at the top of the queue (highlighted). It arrived from Tab 2 automatically. Click "Review" to open the inline review dialog.',
    route: '/approvals/queue', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-14', stepNumber: 14, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2.1',
    title: 'Review Dialog — Fields, Confidence & Flags',
    description: 'The inline Review Dialog (Screen 4.2.1) opens over the queue. The left panel shows categorised field groups with animated confidence bars, a display-only threshold indicator (showing the Preparer\'s setting), Active Flags card, and a Verify All Below Threshold bulk action. The right panel anchors to the source PDF. The Reviewer can edit field values — edits are tagged with the Reviewer\'s name in the audit trail.',
    instruction: 'Show the Review Dialog opened from the queue. Point out the confidence bars, threshold indicator, Active Flags card, and the Reviewer edit mode. Demonstrate editing a field value and adding a review comment.',
    route: '/approvals/queue', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-15', stepNumber: 15, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2.1',
    title: 'Inline Flag Resolution & Comment Thread',
    description: 'Within the Review Dialog, the Reviewer can resolve flags inline — the Active Flags badge updates in real time. The comment thread (scoped per field category) is visible to the Approver in Screen 4.3.1. The Reject button pre-fills the comment textarea with a bullet list of open High/Medium flags.',
    instruction: 'Demonstrate resolving a flag inline using the Resolve button in the Active Flags card. Show the comment thread and add a review note. Point out the Reject pre-fill behaviour.',
    route: '/approvals/queue', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-16', stepNumber: 16, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2.1',
    title: 'Approve for Final — Handoff to Approver',
    description: "The Reviewer clicks 'Approve for Final' in the Review Dialog. The critical-field gate ensures all critical fields are verified before approval is allowed. This triggers the cross-tab handoff — the Approver's queue will receive the record immediately. The queue row updates with an 'Approved' badge before fading out.",
    instruction: 'Click "Approve for Final" in the Review Dialog. Watch Tab 4 receive the final approval task in real time. Note the Approved badge on the queue row.',
    route: '/approvals/queue',
    eventToPublish: { type: 'APPROVE_FOR_FINAL', payload: { jobId: 'JOB-DEMO-001', reviewedBy: 'Reviewer', comments: 'All fields verified. Confidence acceptable.' } },
    isHandoff: true, handoffTo: 'approver',
    handoffLabel: 'Approved for final → Approver receives final sign-off task',
    tabHint: 'Tab 3 — Reviewer',
  },

  // ── APPROVER ───────────────────────────────────────────────────────────────
  {
    id: 'step-17', stepNumber: 17, role: 'approver',
    roleLabel: 'Approver', roleColor: '#d97706',
    screenNumber: '4.3.1',
    title: 'Final Approval Dialog — SoD Check & Financial Summary',
    description: 'The Approver opens the inline Approver Dialog (Screen 4.3.1) from the Approval Queue. It shows a Segregation of Duties validation — confirming the Approver did not also act as Preparer or Reviewer. Financial impact tiles show ROU Asset, Lease Liability, and classification. The Reviewer\'s comment thread is visible in a read-only panel.',
    instruction: 'Open the Approver Dialog from the queue. Review the SoD check (green = passed). Examine the financial summary tiles and the Reviewer Comments panel. Show the deferred acknowledgement checkbox for deferred fields.',
    route: '/approvals/queue', tabHint: 'Tab 4 — Approver',
  },
  {
    id: 'step-18', stepNumber: 18, role: 'approver',
    roleLabel: 'Approver', roleColor: '#d97706',
    screenNumber: '4.3.1',
    title: 'Record Approved — Handoff to Accountant',
    description: "The Approver grants final approval. The record is committed to the Record Store and an export task is automatically created in the Accountant's Governed Export queue.",
    instruction: 'Click "Final Approve" in the Approver Dialog. Tab 5 (Accountant) will receive the export task immediately.',
    route: '/approvals/queue',
    eventToPublish: { type: 'RECORD_APPROVED', payload: { recordId: 'CR-DEMO-001', approvedBy: 'Approver', exportTaskId: 'EXP-DEMO-001' } },
    isHandoff: true, handoffTo: 'accountant',
    handoffLabel: 'Record approved → Accountant receives export task in Governed Export Queue',
    tabHint: 'Tab 4 — Approver',
  },

  // ── ACCOUNTANT ─────────────────────────────────────────────────────────────
  {
    id: 'step-19', stepNumber: 19, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.1',
    title: 'Export Queue — New Task Received',
    description: "The Accountant sees the newly approved record in their Export Queue. The task shows the target template (ASC 842 Finance Standard), the record name, and the approval chain.",
    instruction: 'Notice the new export task from the approved record. The template and destination are pre-selected based on the lease classification.',
    route: '/export/templates', tabHint: 'Tab 5 — Accountant',
  },
  {
    id: 'step-20', stepNumber: 20, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.2',
    title: 'Stage, Upload & Attest — Demo Complete',
    description: 'The Accountant reviews the staged fields, confirms the upload to the system of record, and provides a formal attestation. This completes the full workflow lifecycle.',
    instruction: 'Walk through the 3-step process: Stage → Upload → Attest. The audit trail is automatically updated. The full workflow is now demonstrated.',
    route: '/export/staging', tabHint: 'Tab 5 — Accountant',
  },
];

/** Returns steps belonging to a given role */
export function getStepsForRole(role: UserRole): DemoStep[] {
  return DEMO_STEPS.filter(s => s.role === role);
}

/** Returns the global DEMO_STEPS index for a role-local step index */
export function globalIndexForRole(role: UserRole, localIndex: number): number {
  const steps = getStepsForRole(role);
  if (localIndex < 0 || localIndex >= steps.length) return -1;
  return DEMO_STEPS.findIndex(s => s.id === steps[localIndex].id);
}

interface DemoModeContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: DemoStep | null;
  /** Steps filtered to the active role in this tab */
  totalSteps: number;
  roleSteps: DemoStep[];
  /** Index within the role-scoped steps (for progress display) */
  roleLocalIndex: number;
  startDemo: () => void;
  endDemo: () => void;
  resetDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (globalIndex: number) => void;
  progress: number;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({
  children,
  activeRole: activeRoleProp,
}: {
  children: React.ReactNode;
  activeRole?: UserRole;
}) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Prefer the prop (from RoleContext) over sessionStorage fallback.
  // sessionStorage fallback is kept for cases where DemoModeProvider is used
  // outside of a RoleProvider (e.g. tests).
  const getActiveRole = useCallback((): UserRole => {
    if (activeRoleProp) return activeRoleProp;
    try {
      const stored = sessionStorage.getItem('dodesk_active_role');
      return (stored as UserRole) || 'document_submitter';
    } catch {
      return 'document_submitter';
    }
  }, [activeRoleProp]);

  // Role steps depend only on the active role, not on isActive.
  // Recomputing on isActive change was causing step resets mid-session.
  const roleSteps = useMemo(() => getStepsForRole(getActiveRole()), [getActiveRole]);

  const startDemo = useCallback(() => {
    const role = getActiveRole();
    const firstGlobal = globalIndexForRole(role, 0);
    setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
    setIsActive(true);
  }, [getActiveRole]);

  const endDemo = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const resetDemo = useCallback(() => {
    // 1. Clear all cross-tab event history from localStorage
    clearEventHistory();
    // 2. Broadcast DEMO_RESET so every open tab resets to its role's starting screen
    publishEvent({ type: 'DEMO_RESET', payload: {}, sourceRole: getActiveRole() });
    // 3. Reset this tab's step to the first step for its role
    const role = getActiveRole();
    const firstGlobal = globalIndexForRole(role, 0);
    setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
  }, [getActiveRole]);

  // Listen for DEMO_RESET broadcast from other tabs
  useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
      if (event.type === 'DEMO_RESET') {
        const role = getActiveRole();
        const firstGlobal = globalIndexForRole(role, 0);
        setCurrentStepIndex(firstGlobal >= 0 ? firstGlobal : 0);
      }
    }, ['DEMO_RESET']);
    return unsubscribe;
  }, [getActiveRole]);

  const nextStep = useCallback(() => {
    const role = getActiveRole();
    const steps = getStepsForRole(role);
    const localIdx = steps.findIndex(s => s.id === DEMO_STEPS[currentStepIndex]?.id);
    const nextLocal = localIdx + 1;
    if (nextLocal < steps.length) {
      const nextGlobal = globalIndexForRole(role, nextLocal);
      if (nextGlobal >= 0) setCurrentStepIndex(nextGlobal);
    }
    // If already at last step for this role, do nothing (no cross-role navigation)
  }, [currentStepIndex, getActiveRole]);

  const prevStep = useCallback(() => {
    const role = getActiveRole();
    const steps = getStepsForRole(role);
    const localIdx = steps.findIndex(s => s.id === DEMO_STEPS[currentStepIndex]?.id);
    const prevLocal = localIdx - 1;
    if (prevLocal >= 0) {
      const prevGlobal = globalIndexForRole(role, prevLocal);
      if (prevGlobal >= 0) setCurrentStepIndex(prevGlobal);
    }
    // If already at first step for this role, do nothing (no cross-role navigation)
  }, [currentStepIndex, getActiveRole]);

  const goToStep = useCallback((idx: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(idx, DEMO_STEPS.length - 1)));
  }, []);

  const currentStep = isActive ? DEMO_STEPS[currentStepIndex] ?? null : null;

  const roleLocalIndex = useMemo(() => {
    if (!currentStep) return 0;
    const idx = roleSteps.findIndex(s => s.id === currentStep.id);
    return idx >= 0 ? idx : 0;
  }, [currentStep, roleSteps]);

  // Progress is scoped to this role's own steps only
  const progress = roleSteps.length > 0
    ? ((roleLocalIndex + 1) / roleSteps.length) * 100
    : 0;

  return (
    <DemoModeContext.Provider value={{
      isActive,
      currentStepIndex,
      currentStep,
      totalSteps: roleSteps.length,
      roleSteps,
      roleLocalIndex,
      startDemo,
      endDemo,
      resetDemo,
      nextStep,
      prevStep,
      goToStep,
      progress,
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}
