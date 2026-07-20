/**
 * demoSteps.ts — Pure data: DemoStep type, DEMO_STEPS array, and helper functions.
 *
 * Kept in a separate file from DemoModeContext.tsx so that Vite can fast-refresh
 * the React component (DemoModeProvider) without the "incompatible export" warning
 * that occurs when a context file exports both a component and plain constants.
 *
 * Step coverage (v3 — expanded to all 9 FCs and all 9 roles):
 *   Document Submitter  : steps 1–4    FC-1 Pipeline
 *   Preparer            : steps 5–17   FC-2 Extraction + FC-3 Packages
 *   Reviewer            : steps 18–22  FC-4 Approval (review + rework path)
 *   Approver            : steps 23–24  FC-4 Final Approval
 *   Accountant          : steps 25–28  FC-7 Governed Export (full 4-screen path)
 *   Controller          : steps 29–34  FC-5 Records + FC-6 Reassessment (sweep + watchlist)
 *   Business Submitter  : steps 35–38  FC-6 Survey + Trigger
 *   Auditor             : steps 39–41  FC-5 Snapshot Viewer + FC-8 Audit Log
 *   Lease Admin         : steps 42–46  FC-8 Administration + FC-9 AI Agents
 */
import type { UserRole } from '@/lib/types';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-1 — DOCUMENT PIPELINE  (Document Submitter, steps 1–4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-1', stepNumber: 1, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.1',
    title: 'Pipeline Dashboard',
    description: 'The Document Submitter monitors all incoming documents. The dashboard shows real-time status across all staged files — Uploaded, Validating, Valid, Invalid, Ready, and Submitted. KPI tiles summarise the pipeline at a glance.',
    instruction: 'Review the status summary cards. Notice 24 Valid files and 8 Ready for submission. Point out the workspace filter and the flash-highlight on newly arrived rows.',
    route: '/pipeline/dashboard', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-2', stepNumber: 2, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.2',
    title: 'Upload & Validate Documents',
    description: 'The operator drags and drops lease documents. The system immediately validates file format, page count, and readability. Each file receives a binary status badge — Valid or Invalid — in real time. Invalid files show a specific error reason.',
    instruction: 'Observe the drag-and-drop zone and the inline validation status badges on each uploaded file. Point out that Invalid files are excluded from submission automatically.',
    route: '/pipeline/upload', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-3', stepNumber: 3, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.4',
    title: 'Review & Group Documents',
    description: 'Valid documents are grouped into contract packages using drag-and-drop. The operator assigns each document to a workspace and verifies the grouping before submission. Amendment files trigger an amber banner identifying the specific amendment documents.',
    instruction: 'Review the document groupings. Drag a document between groups to demonstrate re-assignment. Point out the amendment banner on the Office-Tower-Amendment-3.pdf row.',
    route: '/pipeline/review', tabHint: 'Tab 1 — Document Submitter',
  },
  {
    id: 'step-4', stepNumber: 4, role: 'document_submitter',
    roleLabel: 'Document Submitter', roleColor: '#64748b',
    screenNumber: '1.4',
    title: 'Submit Batch — Handoff to Preparer',
    description: "The operator submits the validated batch. This triggers the cross-tab handoff — the Preparer's Processing Queue receives the new jobs immediately. The submission_path banner confirms whether this is a new record or an amendment to an existing one.",
    instruction: 'Click "Submit Batch" to send the documents to the Preparer. Watch Tab 2 receive the new jobs in real time.',
    route: '/pipeline/review',
    eventToPublish: { type: 'BATCH_SUBMITTED', payload: { batchId: 'BATCH-DEMO-001', documentCount: 12, workspaceTag: 'Retail', submittedBy: 'Document Submitter' } },
    isHandoff: true, handoffTo: 'preparer',
    handoffLabel: 'Batch submitted → Preparer receives 12 new jobs in Processing Queue',
    tabHint: 'Tab 1 — Document Submitter',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-2 — EXTRACTION & VERIFICATION  (Preparer, steps 5–13)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-5', stepNumber: 5, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.1',
    title: 'Processing Queue — New Jobs Received',
    description: "The Preparer sees the newly submitted batch in their Processing Queue. Each job shows the document name, workspace tag, AI confidence estimate, and current status. Clicking Process opens the 5-step Processing Workflow dialog.",
    instruction: 'Point to the new jobs at the top of the queue (highlighted). The batch from Tab 1 arrived here automatically. Click "Process" on any job to open the workflow dialog.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-6', stepNumber: 6, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.1',
    title: 'Processing Workflow — Field Mapping (Step 1)',
    description: 'Step 1 of the Processing Workflow dialog: the Preparer maps source document columns to the standard lease schema. The Confirm Mapping button is gated until all required fields are mapped. An amendment banner names any amendment files in the batch and calls out rent, dates, and area for special attention.',
    instruction: 'Show Step 1 — Field Mapping. Demonstrate adding a field mapping and clicking Confirm Mapping. Point out the amendment banner if an amendment file is present.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-7', stepNumber: 7, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.1',
    title: 'Processing Workflow — AI Extraction (Step 2)',
    description: 'Step 2 of the Processing Workflow: the AI engine extracts all 73 lease fields from the document. A live progress bar shows extraction status per field category. The Preparer can monitor without intervening.',
    instruction: 'Show Step 2 in the dialog — the AI extraction progress bar animating across field categories. Point out the estimated completion time.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-8', stepNumber: 8, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.1',
    title: 'Processing Workflow — Confidence Review (Step 4)',
    description: 'Step 4 of the Processing Workflow: the Confidence Review panel shows every extracted field with an animated confidence bar. The Preparer sets a threshold; fields below it are flagged for mandatory review. Critical fields auto-confirm when verified.',
    instruction: 'Show the confidence heatmap in Step 4. Adjust the threshold slider. Click "Verify All Below Threshold" to bulk-verify. Point out the critical-field progress pill.',
    route: '/extraction/queue', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-9', stepNumber: 9, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.2',
    title: 'Document Understanding — Record Linkage',
    description: 'After the Processing Workflow completes, the Preparer links the extracted document to an existing contract record or creates a new one. The system suggests a match based on counterparty name and property address. The contract type auto-selects the correct extraction template.',
    instruction: 'Navigate to /extraction/understanding. Show the record search typeahead and the auto-suggested match. Demonstrate selecting an existing record and confirming the link.',
    route: '/extraction/understanding', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-10', stepNumber: 10, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.2a',
    title: 'Extraction Strategy — Automation Level',
    description: 'The Preparer selects the automation level for this extraction: Full Autonomous, Collaborative, or Full Manual. Each card shows estimated time, capabilities, and confidence requirements. A confidence threshold slider controls which fields require human review.',
    instruction: 'Show the three automation-level cards. Select "Collaborative" and adjust the confidence threshold slider to 0.85. Click Proceed.',
    route: '/extraction/strategy', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-11', stepNumber: 11, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.3',
    title: 'AI Extraction Workspace — Field Review',
    description: 'The split-screen AI Workspace shows extracted fields on the left and the source PDF on the right. Critical fields (3px warning border + shield icon) require an explicit Confirm click. Normal fields show a confidence badge and anchor status. An amendment banner reminds the Preparer to verify rent, dates, and area fields against the amendment document.',
    instruction: 'Show the split-screen layout. Expand the Rent category accordion. Confirm a critical field. Toggle the heatmap overlay on the PDF panel. Point out the amendment banner.',
    route: '/extraction/ai', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-12', stepNumber: 12, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.4',
    title: 'Verification Gate — Disposition & Progress',
    description: 'The Reviewer-facing Verification Gate shows all 73 fields with disposition dropdowns (Accepted / Corrected / Not Found / Deferred). Deferred fields require a justification note. The fixed bottom bar tracks Total / Critical / Deferred / Unresolved counts. Submit is gated until all critical fields are confirmed and unresolved count is zero. An amendment banner shows the same rent/dates/area guidance for the Reviewer.',
    instruction: 'Navigate to /extraction/verify. Show the disposition dropdowns. Set one field to Deferred and add a justification. Point out the progress gate in the bottom bar.',
    route: '/extraction/verify', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-13', stepNumber: 13, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '2.4',
    title: 'Submit for Review — Handoff to Reviewer',
    description: "The Preparer submits the verified, flag-resolved package for Reviewer approval. This triggers the cross-tab handoff — the Reviewer's Approval Queue receives the new item immediately.",
    instruction: 'Click "Submit for Review" in the Verification Gate bottom bar. Watch Tab 3 receive the new approval task in real time.',
    route: '/extraction/verify',
    eventToPublish: { type: 'SUBMIT_FOR_REVIEW', payload: { jobId: 'JOB-DEMO-001', documentName: 'Retail-Lease-HQ-2026.pdf', preparedBy: 'Preparer', confidence: 94 } },
    isHandoff: true, handoffTo: 'reviewer',
    handoffLabel: 'Submitted for review → Reviewer receives new approval task in Approval Queue',
    tabHint: 'Tab 2 — Preparer',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-3 — CONTRACT PACKAGES  (Preparer, steps 14–17)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-14', stepNumber: 14, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '3.1',
    title: 'Package Composition — Document Assembly',
    description: 'The Package Composition screen assembles all documents for a contract into a single submission package. The Preparer can reorder documents via drag-and-drop, view the flag summary panel, and check the package completeness gate before submitting to Approvals.',
    instruction: 'Navigate to /packages/pkg-001. Show the document list and drag a document to reorder it. Open the flag summary panel. Point out the Submit to Approvals button (gated until all required documents are present).',
    route: '/packages/pkg-001', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-15', stepNumber: 15, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '3.2',
    title: 'Package Flags — Inline Resolution',
    description: 'The Package Flags screen lists all flags raised during extraction and verification, grouped by severity (Critical / High / Medium / Low). Each flag can be resolved inline with a resolution type and rationale. The package cannot be submitted until all Critical flags are resolved.',
    instruction: 'Navigate to /packages/pkg-001/flags. Expand a Critical flag and click "Resolve". Select a resolution type, add a rationale, and click Mark as Resolved. Show the severity badge update.',
    route: '/packages/pkg-001/flags', tabHint: 'Tab 2 — Preparer',
  },
  {
    id: 'step-16', stepNumber: 16, role: 'preparer',
    roleLabel: 'Preparer', roleColor: '#2563eb',
    screenNumber: '3.2a',
    title: 'Package Re-Assembly — Document Swap',
    description: 'If a document needs to be replaced (e.g. a corrected scan arrives), the Re-Assembly screen allows the Preparer to swap the document without losing the extraction data. A version comparison panel shows what changed between the old and new document.',
    instruction: 'Navigate to /packages/pkg-001/reassembly. Show the document swap workflow. Point out the version comparison panel and the "Preserve Extraction Data" toggle.',
    route: '/packages/pkg-001/reassembly', tabHint: 'Tab 2 — Preparer',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-4 — APPROVAL WORKFLOW  (Reviewer, steps 17–22; Approver, steps 23–24)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-17', stepNumber: 17, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.1',
    title: 'Approvals Queue — New Item Received',
    description: 'The Reviewer sees the submitted record in their Approval Queue. The queue shows priority, document name, Preparer, submission time, and overall confidence score. Items submitted from the Preparer tab appear here in real time. The StatusBadge animates with a pulse dot when a task is newly Opened.',
    instruction: 'Point to the new item at the top of the queue (highlighted). It arrived from Tab 2 automatically. Click "Review" to open the inline review dialog.',
    route: '/approvals/queue', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-18', stepNumber: 18, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2',
    title: 'Review Dialog — Fields, Confidence & Flags',
    description: 'The full-screen Review Dialog shows categorised field groups with animated confidence bars, a display-only threshold indicator, Active Flags card, and a Verify All Below Threshold bulk action. The Reviewer can edit field values — edits are tagged with the Reviewer\'s name in the audit trail.',
    instruction: 'Show the Review Dialog opened from the queue. Point out the confidence bars, threshold indicator, and Active Flags card. Demonstrate editing a field value and adding a review comment.',
    route: '/approvals/review/task-001', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-19', stepNumber: 19, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2',
    title: 'Inline Flag Resolution & Comment Thread',
    description: 'Within the Review Dialog, the Reviewer can resolve flags inline — the Active Flags badge updates in real time. The comment thread (scoped per field category) is visible to the Approver. The Reject button pre-fills the comment textarea with a bullet list of open High/Medium flags.',
    instruction: 'Demonstrate resolving a flag inline. Show the comment thread and add a review note. Point out the Reject pre-fill behaviour.',
    route: '/approvals/review/task-001', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-20', stepNumber: 20, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.1a',
    title: 'Rework Path — Rejection & Rework Instructions',
    description: 'When the Reviewer rejects a submission, the Preparer receives a Rework task in their queue. The Rework Instructions screen shows the rejection reason, flagged fields, and a structured correction checklist. The Preparer corrects and resubmits, creating a new approval task.',
    instruction: 'Navigate to /approvals/rework. Show the rejection reason, flagged fields list, and the "Open for Rework" CTA. Explain that clicking this navigates the Preparer back to the Verification Gate with the rework banner visible.',
    route: '/approvals/rework', tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-21', stepNumber: 21, role: 'reviewer',
    roleLabel: 'Reviewer', roleColor: '#7c3aed',
    screenNumber: '4.2',
    title: 'Approve for Final — Handoff to Approver',
    description: "The Reviewer clicks 'Approve for Final' in the Review Dialog. The critical-field gate ensures all critical fields are verified before approval is allowed. This triggers the cross-tab handoff — the Approver's queue receives the record immediately.",
    instruction: 'Click "Approve for Final" in the Review Dialog. Watch Tab 4 receive the final approval task in real time.',
    route: '/approvals/review/task-001',
    eventToPublish: { type: 'APPROVE_FOR_FINAL', payload: { jobId: 'JOB-DEMO-001', reviewedBy: 'Reviewer', comments: 'All fields verified. Confidence acceptable.' } },
    isHandoff: true, handoffTo: 'approver',
    handoffLabel: 'Approved for final → Approver receives final sign-off task',
    tabHint: 'Tab 3 — Reviewer',
  },
  {
    id: 'step-22', stepNumber: 22, role: 'approver',
    roleLabel: 'Approver', roleColor: '#d97706',
    screenNumber: '4.3',
    title: 'Final Approval Dialog — SoD Check & Financial Summary',
    description: "The Approver opens the Approver Dialog from the Approval Queue. It shows a Segregation of Duties validation — confirming the Approver did not also act as Preparer or Reviewer. Financial impact tiles show ROU Asset, Lease Liability, and classification. The Reviewer's comment thread is visible in a read-only panel.",
    instruction: 'Open the Approver Dialog from the queue. Review the SoD check (green = passed). Examine the financial summary tiles and the Reviewer Comments panel. Show the deferred acknowledgement checkbox.',
    route: '/approvals/final/task-001', tabHint: 'Tab 4 — Approver',
  },
  {
    id: 'step-23', stepNumber: 23, role: 'approver',
    roleLabel: 'Approver', roleColor: '#d97706',
    screenNumber: '4.3',
    title: 'Record Approved — Handoff to Accountant',
    description: "The Approver grants final approval. The record is committed to the Record Store and an export task is automatically created in the Accountant's Governed Export queue.",
    instruction: 'Click "Final Approve" in the Approver Dialog. Tab 5 (Accountant) will receive the export task immediately.',
    route: '/approvals/final/task-001',
    eventToPublish: { type: 'RECORD_APPROVED', payload: { recordId: 'CR-DEMO-001', approvedBy: 'Approver', exportTaskId: 'EXP-DEMO-001' } },
    isHandoff: true, handoffTo: 'accountant',
    handoffLabel: 'Record approved → Accountant receives export task in Governed Export Queue',
    tabHint: 'Tab 4 — Approver',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-7 — GOVERNED EXPORT  (Accountant, steps 24–27)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-24', stepNumber: 24, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.1',
    title: 'Export — Template Selection',
    description: "The Accountant selects the export template for the approved record. Template cards show the target standard (ASC 842 Finance Standard, IFRS 16, etc.), field count, and required/optional breakdown. The template is pre-suggested based on the lease classification.",
    instruction: 'Navigate to /export/templates. Show the template cards. Point out the pre-selected ASC 842 Finance Standard template and the field count breakdown.',
    route: '/export/templates', tabHint: 'Tab 5 — Accountant',
  },
  {
    id: 'step-25', stepNumber: 25, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.2',
    title: 'Export — Triple-View Staging',
    description: 'The Staging screen shows three panels side by side: template fields (left), record data (centre), and the field mapping (right). The Accountant drags record fields onto template slots. Unmapped required fields are highlighted in amber. The mapping is locked once confirmed.',
    instruction: 'Navigate to /export/staging. Show the three-panel layout. Drag a record field onto a template slot. Point out the unmapped required fields highlighted in amber.',
    route: '/export/staging', tabHint: 'Tab 5 — Accountant',
  },
  {
    id: 'step-26', stepNumber: 26, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.2a',
    title: 'Export — Pre-Flight Validation',
    description: 'The Pre-Flight screen runs a final validation checklist before creating the upload task. It checks content hash integrity, required field completeness, and SLA compliance. Any deviation requires a written justification that is permanently logged in the audit trail.',
    instruction: 'Navigate to /export/preflight. Walk through the validation checklist items. Show the deviation justification textarea and explain that it is permanently logged.',
    route: '/export/preflight', tabHint: 'Tab 5 — Accountant',
  },
  {
    id: 'step-27', stepNumber: 27, role: 'accountant',
    roleLabel: 'Accountant', roleColor: '#059669',
    screenNumber: '7.3',
    title: 'Export — Upload Task & Attestation',
    description: 'The Upload Task screen requires the Accountant to provide three evidence items (screenshot of external system, External System ID, Confirmation Reference) and complete two attestation checkboxes (PAC/SAC + DA) before the task can be marked complete. The audit trail is automatically sealed on completion.',
    instruction: 'Navigate to /export/tasks/task-001. Show the three evidence requirement fields. Check both attestation checkboxes. Click "Mark Complete" to seal the compliance packet.',
    route: '/export/tasks/task-001',
    eventToPublish: { type: 'UPLOAD_TASK_COMPLETED', payload: { taskId: 'EXP-DEMO-001', completedBy: 'Accountant' } },
    tabHint: 'Tab 5 — Accountant',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-5 — CONTRACT RECORDS  (Controller, steps 28–31)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-28', stepNumber: 28, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '5.2',
    title: 'Records Search — Portfolio View',
    description: 'The Records Search screen provides a full-width search bar and a collapsible filter panel for the entire contract portfolio. Watchlisted records show an eye icon. Row expand reveals key terms. The Controller uses this screen as the entry point for reassessment and correction workflows.',
    instruction: 'Navigate to /records. Search for "Retail". Expand a row to show key terms. Point out the watchlist eye icon on watchlisted rows.',
    route: '/records', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-29', stepNumber: 29, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '5.3',
    title: 'Record Detail — 9-Tab Master Page',
    description: 'The Record Detail page is the master view for a single contract. The header shows the Record ID in JetBrains Mono, a 7-state lock status banner, and an AutomationPolicy badge. Nine tabs cover Overview, Terms, Financial (ASC 842 amortisation schedule), Documents, Workflow, Reassessment, History, Open Items, and Watchlist.',
    instruction: 'Navigate to /records/CR-DEMO-001. Show the header lock banner. Click through the Financial tab (amortisation schedule) and the Open Items tab (deferred fields with age-based severity badges).',
    route: '/records/CR-DEMO-001', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-30', stepNumber: 30, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '5.5',
    title: 'Snapshot Viewer — Side-by-Side Comparison',
    description: 'The Snapshot Viewer compares two versions of a contract record side by side — any historical snapshot versus another snapshot or the current live record. Changed fields are highlighted in amber. Snapshot 1 is always the initial approval; higher numbers represent later reassessments or corrections.',
    instruction: 'Navigate to /records/CR-DEMO-001/snapshots. Select Snapshot 1 on the left and "Current Record" on the right. Point out the amber-highlighted changed fields.',
    route: '/records/CR-DEMO-001/snapshots', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-31', stepNumber: 31, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '5.6',
    title: 'Record Correction — Initiating a Correction',
    description: 'The Record Correction dialog allows the Controller to initiate a formal correction on an approved record. The Preparer is notified and the record enters Correction In Progress lock state. The affected fields selector lists all extractable fields for precise scoping.',
    instruction: 'Navigate to /records/CR-DEMO-001/correction. Select two affected fields, add a correction reason, and click Confirm. Show the lock state banner updating to Correction In Progress.',
    route: '/records/CR-DEMO-001/correction', tabHint: 'Tab 6 — Controller',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-6 — REASSESSMENT  (Business Submitter, steps 32–34; Controller, steps 35–37)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-32', stepNumber: 32, role: 'business_submitter',
    roleLabel: 'Business Submitter', roleColor: '#ec4899',
    screenNumber: '6.13',
    title: 'Survey Intake — Lease Intelligence Signal',
    description: 'The Business Submitter submits informal lease intelligence signals via the Survey Intake screen. Six prompt types cover negotiation whispers, project ghosts, strategic pivots, asset utility changes, and more. The system scores the response and either promotes it to a reassessment case or routes it to the clarification queue.',
    instruction: 'Navigate to /reassessment/surveys. Select the "Negotiation Whisper" prompt type. Fill in the survey fields and submit. Show the confidence-based result card and the "Promote to Case" CTA.',
    route: '/reassessment/surveys', tabHint: 'Tab 7 — Business Submitter',
  },
  {
    id: 'step-33', stepNumber: 33, role: 'business_submitter',
    roleLabel: 'Business Submitter', roleColor: '#ec4899',
    screenNumber: '6.2',
    title: 'Trigger New Case — Modification or Reassessment',
    description: 'The Trigger New Case screen supports two paths: Modification (a known change to the lease) and Reassessment (a potential change requiring analysis). The trigger type grouped dropdown covers 12 trigger categories. A concurrent case warning banner appears if an open case already exists for the same record.',
    instruction: 'Navigate to /reassessment/trigger. Select the "Reassessment" path. Choose "Option Exercise" as the trigger type. Set the trigger date and add evidence. Show the concurrent case warning banner.',
    route: '/reassessment/trigger', tabHint: 'Tab 7 — Business Submitter',
  },
  {
    id: 'step-34', stepNumber: 34, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '6.3',
    title: 'Period-End Sweep — Bulk Tier 1 Screening',
    description: 'The Period-End Sweep screen allows the Controller to run a bulk Tier 1 screening across all active leases at period end. Each row has an expandable Tier 1 panel with four boolean questions. Amber rows indicate potential reassessment triggers; green rows are confirmed no-change. The Controller can create a case per row or batch-submit all flagged rows.',
    instruction: 'Navigate to /reassessment/sweep. Expand a row to show the Tier 1 panel. Answer the four boolean questions. Show the row turning amber when a trigger is detected. Click "Create Case" on the flagged row.',
    route: '/reassessment/sweep', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-35', stepNumber: 35, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '6.5',
    title: 'Case Classification — Sequential Gate',
    description: 'The Case Classification screen presents three sequential questions that determine whether the event constitutes a lease modification, a reassessment, or a no-action. Each question reveals the next only after answering. The classification gate routes the case to the correct downstream workflow.',
    instruction: 'Navigate to /reassessment/cases/case-001/classify. Answer the three sequential questions. Show how the classification gate updates after each answer and routes to Assessment.',
    route: '/reassessment/cases/case-001/classify', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-36', stepNumber: 36, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '6.6',
    title: 'Option Exercise Assessment — Materiality Threshold',
    description: 'The Assessment screen evaluates the financial materiality of the identified event. Tier 1 factors are shown by default. If the materiality threshold is exceeded, the full 12-factor Tier 2 form auto-expands. The "Continue to Analysis" button is gated until all required factors are completed.',
    instruction: 'Navigate to /reassessment/cases/case-001/assess. Show the Tier 1 factors. Adjust a value to exceed the materiality threshold and watch the Tier 2 form auto-expand.',
    route: '/reassessment/cases/case-001/assess', tabHint: 'Tab 6 — Controller',
  },
  {
    id: 'step-37', stepNumber: 37, role: 'controller',
    roleLabel: 'Controller', roleColor: '#dc2626',
    screenNumber: '6.12',
    title: 'Watchlist Management — Automated Monitoring Rules',
    description: 'The Watchlist Management screen allows the Controller to create and manage automated monitoring rules for contracts. Each rule card shows the trigger criteria, matched contracts count, and active/paused status. The matched contracts table updates overnight as the scheduler evaluates new matches.',
    instruction: 'Navigate to /reassessment/watchlist. Show the rule cards with active/paused toggles. Click "Add Rule" to open the rule creation modal. Show the matched contracts table for an existing rule.',
    route: '/reassessment/watchlist', tabHint: 'Tab 6 — Controller',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-5 (Phase 2) — AUDIT  (Auditor, steps 38–40)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-38', stepNumber: 38, role: 'auditor',
    roleLabel: 'Auditor', roleColor: '#6b7280',
    screenNumber: '5.4',
    title: 'Deferred Fields Tracker — Resolution Workflow',
    description: 'The Deferred Fields Tracker shows all fields that were deferred during extraction, with age-based severity indicators (green < 7 days, amber < 30 days, red > 30 days). The Auditor can review the deferred justifications and the resolution options available to the Preparer.',
    instruction: 'Navigate to /records/CR-DEMO-001/deferred. Show the deferred fields table with age-based severity badges. Open the resolve side panel for a field and show the three resolution options.',
    route: '/records/CR-DEMO-001/deferred', tabHint: 'Tab 8 — Auditor',
  },
  {
    id: 'step-39', stepNumber: 39, role: 'auditor',
    roleLabel: 'Auditor', roleColor: '#6b7280',
    screenNumber: '8.5',
    title: 'Audit Log — Immutable Event Trail',
    description: 'The Audit Log Viewer provides a complete, immutable record of every action taken on the platform. Filters by actor type (human / agent / system), action, subject type, date range, and user. Each row expands to show a before/after JSON diff with changed keys highlighted in amber. Export CSV is available for compliance reporting.',
    instruction: 'Navigate to /admin/audit. Filter by actor_type = "human". Expand a row to show the before/after JSON diff. Point out the amber-highlighted changed keys. Show the Export CSV button.',
    route: '/admin/audit', tabHint: 'Tab 8 — Auditor',
  },
  {
    id: 'step-40', stepNumber: 40, role: 'auditor',
    roleLabel: 'Auditor', roleColor: '#6b7280',
    screenNumber: '5.5',
    title: 'Snapshot Viewer — Compliance Evidence',
    description: 'The Auditor uses the Snapshot Viewer to produce compliance evidence — a side-by-side comparison of the contract record at two points in time. The amber diff highlights every field that changed between snapshots, providing a clear audit trail for regulatory review.',
    instruction: 'Navigate to /records/CR-DEMO-001/snapshots. Select Snapshot 1 (initial approval) and Snapshot 2 (post-reassessment). Show the amber-highlighted changed fields and explain their use as compliance evidence.',
    route: '/records/CR-DEMO-001/snapshots', tabHint: 'Tab 8 — Auditor',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FC-8 + FC-9 — ADMINISTRATION & AI AGENTS  (Lease Admin, steps 41–46)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'step-41', stepNumber: 41, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '8.1',
    title: 'User & Role Management',
    description: 'The Lease Admin manages all platform users and their role assignments. The role assignment UI enforces Segregation of Duties — assigning a user to both Reviewer and Approver on the same contract triggers a warning. Invite flow sends a provisioning email.',
    instruction: 'Navigate to /admin/users. Show the user table and role assignment dropdowns. Attempt to assign a user to both Reviewer and Approver to trigger the SoD warning.',
    route: '/admin/users', tabHint: 'Tab 9 — Lease Admin',
  },
  {
    id: 'step-42', stepNumber: 42, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '8.3',
    title: 'Template Management — Field Mapping Editor',
    description: 'The Template Management screen allows the Lease Admin to create and version extraction templates. The field mapping editor uses drag-to-sort ordering. Templates are version-locked once in use — a new version must be created for changes. The schema dependency graph prevents breaking changes.',
    instruction: 'Navigate to /admin/templates. Open a template and show the field mapping editor. Drag a field to reorder it. Point out the version lock indicator and the "Create New Version" button.',
    route: '/admin/templates', tabHint: 'Tab 9 — Lease Admin',
  },
  {
    id: 'step-43', stepNumber: 43, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '8.4',
    title: 'Threshold Configuration — SLA & Confidence',
    description: 'The Threshold Configuration screen manages confidence thresholds, SLA deadlines, and automation policy parameters across five accordion groups: Onboarding, Reassessment, Approval, Watchlist, and Automation. Version history shows the last 5 configurations with a Restore button.',
    instruction: 'Navigate to /admin/thresholds. Expand the Onboarding accordion. Adjust the confidence threshold. Show the version history panel and the Restore button on a previous version.',
    route: '/admin/thresholds', tabHint: 'Tab 9 — Lease Admin',
  },
  {
    id: 'step-44', stepNumber: 44, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '8.6',
    title: 'Appearance & Notifications — Theme & Branding',
    description: 'The Appearance screen lets the Lease Admin select from four design themes (Structured Authority, Modern Violet, Gradient Pro, Executive Slate), set the colour mode (Light / Dark / System), and configure branding (logo, accent colour) for Professional and Enterprise tiers. Notification preferences are managed per category with In-App and Email toggles.',
    instruction: 'Navigate to /admin/notifications. Show the four theme cards. Switch to Modern Violet and observe the live preview. Toggle a notification category off and show the save confirmation.',
    route: '/admin/notifications', tabHint: 'Tab 9 — Lease Admin',
  },
  {
    id: 'step-45', stepNumber: 45, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '9.1',
    title: 'AI Checkpoint Queue — Human-in-the-Loop',
    description: 'The Checkpoint Queue shows all pending human checkpoints raised by AI agents across every workflow domain. Tabs filter by checkpoint type (extraction review, classification confirm, assessment confirm, export attest, etc.). Checkpoints are sorted by deadline ascending — overdue items appear first. Auto-refreshes every 30 seconds.',
    instruction: 'Navigate to /approvals/checkpoints. Show the tab filter by checkpoint type. Open an extraction_review checkpoint and show the navigation to the Verification Gate. Point out the overdue indicator on expired checkpoints.',
    route: '/approvals/checkpoints', tabHint: 'Tab 9 — Lease Admin',
  },
  {
    id: 'step-46', stepNumber: 46, role: 'lease_admin',
    roleLabel: 'Lease Admin', roleColor: '#1F3864',
    screenNumber: '9.2',
    title: 'Agent Activity Monitor — Real-Time Oversight',
    description: 'The Agent Activity Monitor provides a real-time Kanban view of all AI agent tasks: Running, Awaiting Checkpoint, Completed Today, and Failed. The Intervene button pauses a running agent (sets status to paused_by_human). Failed tasks can be retried, creating a new AgentTask for the same subject. Auto-refreshes every 15 seconds.',
    instruction: 'Navigate to /agents/monitor. Show the four status columns. Click Intervene on a Running task to pause it. Show the Retry button on a Failed task. Point out the auto-refresh pulse animation on count badges.',
    route: '/agents/monitor', tabHint: 'Tab 9 — Lease Admin',
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
