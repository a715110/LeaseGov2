/**
 * PipelineDashboard — FC-1 Screen 1.1
 * Screen key: pipeline-dashboard
 * Route: /pipeline/dashboard
 * Role: Document Submitter
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 * POST-SCAFFOLDING changes:
 *   S1a — DocumentDetailPanel (FlagSlidingPanel) opened from Eye button on doc rows
 *   S1b — BatchDetailPanel (FlagSlidingPanel) opened from Eye button on batch rows
 *   S1c — Bulk Action Bar (checkbox per row, floating bar with Remove/Group actions)
 *   S1d — Three-table layout: Stage Documents → Contract Packages → Submissions
 *         Grouping Dialog with per-file role assignment
 *         Submit Package workflow with isPackageReady guard
 *         Unsubmit from Submission Detail panel (inline confirmation)
 *         Inline package rename
 *         Read-only mode for Auditor role
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, AlertTriangle, CheckCircle2, XCircle,
  Clock, Send, RefreshCw, Search, MoreHorizontal, Edit2, Layers,
  Eye, Trash2, ArrowRight, FileUp, CheckSquare, Square,
  Package, X, ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight, Unlink,
  Archive, ExternalLink, RotateCcw, UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { FlagSlidingPanel } from '@/components/shared/FlagSlidingPanel';
import { DocumentIntelligencePanel } from '@/components/pipeline/DocumentIntelligencePanel';
import type { DocForPanel } from '@/components/pipeline/DocumentIntelligencePanel';
import { UploadDialog, WorkspaceBadge, getWorkspaceColour } from '@/components/pipeline/UploadDialog';
import type { StagedFile as UploadedFile } from '@/components/pipeline/UploadDialog';
import { toast } from 'sonner';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { publishEvent, subscribeToEvents } from '@/lib/eventBus';
import { useRole } from '@/contexts/RoleContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePipelineCounts } from '@/contexts/PipelineCountsContext';
import {
  MOCK_CONTRACT_RECORDS,
  MOCK_ASSIGNEES,
  findContractRecord,
} from '@/lib/mockData';

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Types ────────────────────────────────────────────────────────────────────

type StagedStatus = 'uploaded' | 'uploading' | 'validating' | 'valid' | 'invalid';

/**
 * V3 StagedDocument — Change 1 §1a
 * New fields: original_status, submission_path, submitter_context_notes, document_job_status
 */
interface StagedDocument {
  id: string;
  display_name: string;
  status: StagedStatus;
  /** V3: restored when document returns to staging from any return path */
  original_status: 'valid' | 'invalid';
  /** @deprecated use original_status — kept for backward compat with sub-components */
  originalStatus: 'valid' | 'invalid';
  upload_date: string;
  uploader: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  workspace_tag: string;
  validation_errors?: string[];
  /** V3: FK to ContractRecord — null until assigned */
  target_record_id: string | null;
  /** V3: 'new_record' | 'existing_record' | 'unknown' — set at upload */
  submission_path: 'new_record' | 'existing_record' | 'unknown' | null;
  /** V3: free-text context from DocSubmitter — shown in Document Intelligence Panel */
  submitter_context_notes: string | null;
  /** Optional upload context used to pre-select extraction templates downstream */
  contract_type?: string | null;
  /** V3: document-level job status for Table 1 committed state */
  document_job_status: 'staged' | 'committed' | 'processing' | 'complete';
  /** Assignee override — null means system auto-routes */
  assignee_id: string | null;
  /**
   * FC-4 AC6/BR8 — true when this document's submission is Pending Review or
   * Pending Approval. Prevents Preparer from editing or re-packaging the doc.
   * Production: derived from the linked Submission/ApprovalTask status.
   */
  locked_for_review?: boolean;
}

interface IntakeBatch {
  id: string;
  batch_reference: string;
  submission_mode: 'single_contract' | 'contract_package' | 'bulk_batch';
  document_count: number;
  status: 'assembling' | 'submitted' | 'processing' | 'completed' | 'failed';
  submitted_at: string;
}

type DocumentRole =
  | 'Base Contract' | 'Amendment' | 'Addendum'
  | 'Exhibit' | 'Schedule' | 'Notice' | 'Supporting' | 'Undefined';

interface PackageFile {
  docId: string;
  name: string;
  role: DocumentRole;
  /** Metadata carried from StagedDocument so declined submissions can be restored accurately */
  originalStatus?: 'valid' | 'invalid';
  mime_type?: string;
  file_size_bytes?: number;
  page_count?: number | null;
  target_record_id?: string | null;
  submission_path?: 'new_record' | 'existing_record' | 'unknown' | null;
  submitter_context_notes?: string | null;
  contract_type?: string | null;
  /** Assignee carried from StagedDocument; null = auto-routed */
  assignee_id?: string | null;
}

interface ContractPackage {
  id: string;
  packageNum: string;
  packageName?: string;
  mode: 'Package' | 'Single';
  files: PackageFile[];
  workspace: string;
  createdBy: string;
  createdAt: string;
  status: 'Pending' | 'Ready';
  /** Assignee for the whole package — carried from the first file's assignee_id */
  assignee_id?: string | null;
}

interface Submission {
  id: string;
  batchRef?: string;          // matches batch_ref on ProcessingJob in ExtractionQueue
  record_id?: string | null;
  packageNum: string;
  packageName?: string;
  mode: 'Package' | 'Single';
  fileCount: number;
  fileNames: string[];
  files: PackageFile[];
  workspace: string;
  submittedBy: string;
  submitDate: string;
  /** Assignee carried from ContractPackage */
  assignee_id?: string | null;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Declined';
  declineReason?: string;
  declineReasonLabel?: string;
  /** Per-file decline reasons provided by the Preparer at package-level decline */
  declineFileReasons?: { jobId: string; fileName: string; reason: string }[];
  /** Set to true when this submission was created via the Resubmit flow */
  isResubmit?: boolean;
  /** Attempt number — 1 for first submission, 2+ for resubmissions */
  attemptNumber?: number;
  /** Correction note added by submitter at resubmit time */
  correctionNote?: string;
  /** 'approver' when declined-for-rework by Approver; 'preparer' for Preparer/Extraction decline */
  declineSource?: 'approver' | 'preparer';
}

// ─── Mock data — V3 Change 1 §1a — 8-document seed distribution ─────────────
// Docs 1–2: valid, unassigned (no target record)
// Docs 3–4: valid, assigned to Acme Corp (CR-2026-0038), LOCKED (pending review)
// Docs 5–6: valid, committed to Globex LLC (CR-2026-0039), in-progress
// Doc  7:   invalid (file integrity check failed)
// Doc  8:   valid, target record unknown (submission_path = 'unknown')

const MOCK_DOCUMENTS: StagedDocument[] = [
  {
    id: 'doc-1',
    display_name: 'Retail-HQ-Lease-2026.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-12 09:14',
    uploader: 'J. Martinez',
    mime_type: 'application/pdf',
    file_size_bytes: 4_200_000,
    page_count: 24,
    workspace_tag: 'Retail',
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    contract_type: 'Property Lease',
    document_job_status: 'staged',
    assignee_id: 'user-prep-002', // L. Nguyen
  },
  {
    id: 'doc-2',
    display_name: 'Office-Tower-Amendment-3.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-12 09:10',
    uploader: 'J. Martinez',
    mime_type: 'application/pdf',
    file_size_bytes: 1_800_000,
    page_count: 8,
    workspace_tag: 'Office',
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    document_job_status: 'staged',
    assignee_id: 'user-prep-003', // M. Okonkwo
  },
  {
    id: 'doc-3',
    display_name: 'Retail-HQ-Lease-2026.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-11 14:22',
    uploader: 'A. Chen',
    mime_type: 'application/pdf',
    file_size_bytes: 4_200_000,
    page_count: 24,
    workspace_tag: 'Retail',
    target_record_id: 'mock-record-001',  // Acme Corp — CR-2026-0038
    submission_path: 'existing_record',
    submitter_context_notes: 'Renewal for Acme Corp main location. Please prioritise.',
    document_job_status: 'committed',
    assignee_id: 'user-prep-002', // L. Nguyen
    locked_for_review: true, // FC-4 AC6: submission is Pending Review
  },
  {
    id: 'doc-4',
    display_name: 'Office-Tower-Amendment-3.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-11 14:20',
    uploader: 'A. Chen',
    mime_type: 'application/pdf',
    file_size_bytes: 1_800_000,
    page_count: 8,
    workspace_tag: 'Office',
    target_record_id: 'mock-record-001',  // Acme Corp — CR-2026-0038
    submission_path: 'existing_record',
    submitter_context_notes: null,
    document_job_status: 'committed',
    assignee_id: null,
    locked_for_review: true, // FC-4 AC6: submission is Pending Review
  },
  {
    id: 'doc-5',
    display_name: 'Ground-Lease-Base-Contract.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-10 11:05',
    uploader: 'S. Patel',
    mime_type: 'application/pdf',
    file_size_bytes: 9_400_000,
    page_count: 41,
    workspace_tag: 'Land',
    target_record_id: 'mock-record-002',  // Globex LLC — CR-2026-0039
    submission_path: 'existing_record',
    submitter_context_notes: 'Ground lease renewal — compare against approved record.',
    document_job_status: 'committed',
    assignee_id: 'user-prep-004', // S. Patel
  },
  {
    id: 'doc-6',
    display_name: 'Industrial-Park-Schedule.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-10 11:03',
    uploader: 'S. Patel',
    mime_type: 'application/pdf',
    file_size_bytes: 2_200_000,
    page_count: 6,
    workspace_tag: 'Land',
    target_record_id: 'mock-record-002',  // Globex LLC — CR-2026-0039
    submission_path: 'existing_record',
    submitter_context_notes: null,
    document_job_status: 'committed',
    assignee_id: 'user-prep-004', // S. Patel
  },
  {
    id: 'doc-7',
    display_name: 'Corrupted-Scan-Draft.pdf',
    status: 'invalid',
    original_status: 'invalid',
    originalStatus: 'invalid',
    upload_date: '2026-06-12 09:05',
    uploader: 'J. Martinez',
    mime_type: 'application/pdf',
    file_size_bytes: 512_000,
    page_count: null,
    workspace_tag: 'Office',
    validation_errors: ['File integrity check failed — PDF header is corrupted or truncated.'],
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    document_job_status: 'staged',
    assignee_id: null,
  },
  {
    id: 'doc-8',
    display_name: 'Retail-Sublease-Notice.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-12 09:18',
    uploader: 'D. Kim',
    mime_type: 'application/pdf',
    file_size_bytes: 890_000,
    page_count: null,
    workspace_tag: 'Retail',
    target_record_id: null,
    submission_path: 'unknown',  // DocSubmitter was not sure of target record
    submitter_context_notes: 'Not sure which record this belongs to — please advise.',
    document_job_status: 'staged',
    assignee_id: null, // Auto-routed
  },
  // Equipment Lease demo document — shows teal contract type badge
  {
    id: 'doc-9',
    display_name: 'Forklift-Fleet-Equipment-Lease-2026.pdf',
    status: 'valid',
    original_status: 'valid',
    originalStatus: 'valid',
    upload_date: '2026-06-12 10:30',
    uploader: 'M. Webb',
    mime_type: 'application/pdf',
    file_size_bytes: 3_100_000,
    page_count: 18,
    workspace_tag: 'Operations',
    target_record_id: null,
    submission_path: 'new_record',
    submitter_context_notes: 'New equipment lease for forklift fleet — IFRS 16 classification required.',
    contract_type: 'Equipment Lease',
    document_job_status: 'staged',
    assignee_id: null,
  },
];

// MOCK_BATCHES retained for BatchDetailPanel compatibility (not shown in V3 tables)
const MOCK_BATCHES: IntakeBatch[] = [
  { id: 'b1', batch_reference: 'BATCH-2026-0041', submission_mode: 'contract_package', document_count: 2, status: 'submitted',  submitted_at: '2026-06-10 11:05' },
  { id: 'b2', batch_reference: 'BATCH-2026-0040', submission_mode: 'contract_package', document_count: 1, status: 'assembling', submitted_at: '2026-06-11 14:22' },
];

// V3 §1c — Table 2 seed: PKG-2026-002 in Assembly (not yet submitted)
const INITIAL_PACKAGES: ContractPackage[] = [
  {
    id: 'mock-pkg-002-local',
    packageNum: 'PKG-2026-002',
    packageName: 'Globex Ground Lease Package',
    mode: 'Package',
    files: [
      { docId: 'doc-5', name: 'Ground-Lease-Base-Contract.pdf', role: 'Base Contract' },
    ],
    workspace: 'Land',
    createdBy: 'S. Patel',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
  },
];

// V3 §1c — Table 3 seed
// sub-v3-001: PKG-2026-001 Pending (awaiting extraction)
// sub-v3-002: PKG-2026-000 In Progress (under Reviewer review — docs 3+4 locked)
const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-v3-001-local',
    batchRef: 'BATCH-2026-0041',   // matches batch_ref on MOCK_JOBS j4+j5 in ExtractionQueue
    packageNum: 'PKG-2026-001',
    packageName: 'Acme Corp Retail Package',
    mode: 'Package',
    fileCount: 2,
    fileNames: ['Retail-HQ-Lease-2026.pdf', 'Office-Tower-Amendment-3.pdf'],
    files: [
      { docId: 'doc-3', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'doc-4', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
    ],
    workspace: 'Retail',
    submittedBy: 'A. Chen',
    submitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
  },
  {
    id: 'sub-v3-002-local',
    batchRef: 'BATCH-2026-0039',
    packageNum: 'PKG-2026-000',
    packageName: 'Globex Retail Renewal',
    mode: 'Package',
    fileCount: 2,
    fileNames: ['Retail-HQ-Lease-2026.pdf', 'Office-Tower-Amendment-3.pdf'],
    files: [
      { docId: 'doc-3', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'doc-4', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
    ],
    workspace: 'Retail',
    submittedBy: 'A. Chen',
    submitDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'In Progress', // FC-4 AC6: under Reviewer review — docs 3+4 are locked
    assignee_id: 'user-prep-002',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a badge element for a contract_type value, or null if no type is set. */
function ContractTypeBadge({ contractType }: { contractType?: string | null }) {
  if (!contractType) return null;
  const isEquipment = contractType === 'Equipment Lease' || contractType === 'equipment_lease' || contractType === 'EQUIPMENT_LEASE';
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
        isEquipment
          ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700'
          : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      }`}
    >
      {contractType}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function getMimeLabel(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/tiff': 'TIFF',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
  };
  return map[mime] ?? 'FILE';
}

function getBatchModeLabel(mode: IntakeBatch['submission_mode']): string {
  return { single_contract: 'Single', contract_package: 'Package', bulk_batch: 'Bulk' }[mode];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.split('T')[0];
  }
}

const isPackageReady = (pkg: ContractPackage): boolean =>
  pkg.files.every(f => f.role !== 'Undefined');

let pkgCounter = 4; // starts after seed data
function nextPackageNum(): string {
  return `PKG-2026-${String(pkgCounter++).padStart(3, '0')}`;
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<StagedStatus, string> = {
  uploaded:   'bg-blue-50 text-blue-700 border border-blue-200',
  uploading:  'bg-blue-50 text-blue-700 border border-blue-200',
  validating: 'bg-amber-50 text-amber-700 border border-amber-200',
  valid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  invalid:    'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_LABEL: Record<StagedStatus, string> = {
  uploaded: 'Uploaded', uploading: 'Uploading', validating: 'Validating',
  valid: 'Valid', invalid: 'Invalid',
};

const BATCH_BADGE: Record<IntakeBatch['status'], string> = {
  assembling: 'bg-blue-50 text-blue-700 border border-blue-200',
  submitted:  'bg-amber-50 text-amber-700 border border-amber-200',
  processing: 'bg-violet-50 text-violet-700 border border-violet-200',
  completed:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed:     'bg-red-50 text-red-700 border border-red-200',
};
const BATCH_LABEL: Record<IntakeBatch['status'], string> = {
  assembling: 'Assembling', submitted: 'Submitted', processing: 'Processing',
  completed: 'Completed', failed: 'Failed',
};

const SUB_STATUS_BADGE: Record<Submission['status'], string> = {
  'Pending':     'bg-slate-100 text-slate-600 border border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Completed':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Failed':      'bg-red-50 text-red-700 border border-red-200',
  'Declined':    'bg-orange-50 text-orange-700 border border-orange-200',
};

const DOCUMENT_ROLES: DocumentRole[] = [
  'Base Contract', 'Amendment', 'Addendum', 'Exhibit',
  'Schedule', 'Notice', 'Supporting', 'Undefined',
];

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  accentClass: string;
  active: boolean;
  onClick: () => void;
  spinning?: boolean;
}

function SummaryCard({ label, count, icon, accentClass, active, onClick, spinning }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[var(--color-${accentClass})] ${spinning ? 'animate-spin' : ''}`}>
          {icon}
        </span>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{count}</p>
      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{label}</p>
    </button>
  );
}

// ─── Column filter row helper ─────────────────────────────────────────────────

function ColFilter({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? '…'}
      className="w-full h-6 px-1.5 text-[11px] rounded border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

// ─── S1a: Document Detail Panel ───────────────────────────────────────────────

function DocumentDetailPanel({ doc, onClose }: { doc: StagedDocument; onClose: () => void }) {
  return (
    <FlagSlidingPanel open={true} onClose={onClose} title="Document Details" subtitle={doc.display_name} width={440}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-semibold ${STATUS_BADGE[doc.status]}`}>
            {doc.status === 'validating' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {STATUS_LABEL[doc.status]}
          </span>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">File Information</p>
          <dl className="space-y-2">
            {[
              { label: 'File Name', value: doc.display_name },
              { label: 'Type',      value: getMimeLabel(doc.mime_type) },
              { label: 'Size',      value: formatBytes(doc.file_size_bytes) },
              { label: 'Pages',     value: doc.page_count != null ? String(doc.page_count) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Submission</p>
          <dl className="space-y-2">
            {[
              { label: 'Uploaded By',      value: doc.uploader },
              { label: 'Upload Date',      value: doc.upload_date },
              { label: 'Target Workspace', value: doc.workspace_tag },
              { label: 'Target Record',    value: doc.target_record_id ?? 'Not assigned' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 text-[13px]">
            <Eye className="w-3.5 h-3.5" /> Preview Document
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 text-[13px] text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" /> Remove from Pipeline
          </Button>
        </div>
      </div>
    </FlagSlidingPanel>
  );
}

// ─── S1b: Batch Detail Panel ──────────────────────────────────────────────────

function BatchDetailPanel({ batch, onClose }: { batch: IntakeBatch; onClose: () => void }) {
  return (
    <FlagSlidingPanel open={true} onClose={onClose} title="Batch Details" subtitle={batch.batch_reference} width={400}>
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${BATCH_BADGE[batch.status]}`}>
            {BATCH_LABEL[batch.status]}
          </span>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Batch Information</p>
          <dl className="space-y-2">
            {[
              { label: 'Reference',       value: batch.batch_reference },
              { label: 'Submission Mode', value: getBatchModeLabel(batch.submission_mode) },
              { label: 'Document Count',  value: String(batch.document_count) },
              { label: 'Submitted At',    value: batch.submitted_at },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button size="sm" variant="outline" className="w-full justify-start gap-2 text-[13px]">
            <Layers className="w-3.5 h-3.5" /> View Documents in Batch
          </Button>
        </div>
      </div>
    </FlagSlidingPanel>
  );
}

// ─── S1d: Grouping Dialog ─────────────────────────────────────────────────────

interface GroupingDialogProps {
  docs: StagedDocument[];
  onConfirm: (files: PackageFile[]) => void;
  onCancel: () => void;
}

function GroupingDialog({ docs, onConfirm, onCancel }: GroupingDialogProps) {
  const [roles, setRoles] = useState<Record<string, DocumentRole>>(
    () => Object.fromEntries(docs.map(d => [d.id, 'Undefined' as DocumentRole]))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[15px] font-bold text-foreground">Group into Package</h2>
              <ScreenNumberBadge screenKey="pipeline-review-grouping" />
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">Assign a document role to each file before grouping.</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">File</th>
                <th className="text-left py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide w-48">Role</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[280px]" title={doc.display_name}>
                        {doc.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <Select value={roles[doc.id]} onValueChange={v => setRoles(r => ({ ...r, [doc.id]: v as DocumentRole }))}>
                      <SelectTrigger className="h-7 text-[12px] w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_ROLES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-[13px]">Cancel</Button>
          <Button
            size="sm"
            onClick={() => onConfirm(docs.map(d => ({
              docId: d.id,
              name: d.display_name,
              role: roles[d.id],
              originalStatus: d.original_status ?? d.originalStatus ?? 'valid',
              mime_type: d.mime_type,
              file_size_bytes: d.file_size_bytes,
              page_count: d.page_count,
              target_record_id: d.target_record_id,
              submission_path: d.submission_path,
              submitter_context_notes: d.submitter_context_notes,
              contract_type: d.contract_type ?? null,
              assignee_id: d.assignee_id ?? null,
            })))}
            className="text-[13px] gap-1.5"
          >
            <Package className="w-3.5 h-3.5" /> Create Package
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── S1d: Submission Detail Panel ────────────────────────────────────────────

interface SubmissionDetailPanelProps {
  submission: Submission;
  isReadOnly: boolean;
  onClose: () => void;
  onUnsubmit: (sub: Submission) => void;
}

function SubmissionDetailPanel({ submission, isReadOnly, onClose, onUnsubmit }: SubmissionDetailPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const timelineSteps = [
    {
      label: 'Submitted',
      isActive: true,
      detail: `Submitted on ${formatDate(submission.submitDate)} by ${submission.submittedBy}`,
    },
    {
      label: 'Extraction',
      isActive: submission.status !== 'Pending',
      detail: submission.status === 'Pending'
        ? 'Queued for preparer intake and OCR.'
        : submission.status === 'Declined'
          ? 'Package entered extraction and later returned for correction.'
          : 'Extraction and preparer processing has started.',
    },
    {
      label: 'Review',
      isActive: ['In Progress', 'Completed', 'Declined'].includes(submission.status),
      detail: submission.status === 'In Progress'
        ? 'Currently under reviewer / approver attention.'
        : submission.status === 'Completed'
          ? 'Review completed and the package advanced.'
          : submission.status === 'Declined'
            ? 'Review identified issues that require resubmission.'
            : 'Not yet opened by downstream reviewers.',
    },
    {
      label: 'Outcome',
      isActive: ['Completed', 'Declined'].includes(submission.status),
      detail: submission.status === 'Completed'
        ? 'Processing completed with no further action required.'
        : submission.status === 'Declined'
          ? 'Returned to Table 1 so the submitter can correct and resubmit.'
          : 'Awaiting a downstream decision.',
    },
  ];
  return (

    <FlagSlidingPanel open={true} onClose={onClose} title="Submission Details" subtitle={submission.packageNum} width={520}>
      <div className="space-y-5">
        {/* Status */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${
            submission.status === 'Declined' && submission.declineSource === 'approver'
              ? 'bg-amber-50 text-amber-700 border border-amber-300'
              : SUB_STATUS_BADGE[submission.status]
          }`}>
            {submission.status === 'Declined' && submission.declineSource === 'approver'
              ? 'Rework Required'
              : submission.status}
          </span>
        </div>

        {/* Metadata */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Package Information</p>
          <dl className="space-y-2">
            {[
              { label: 'Package #',    value: submission.packageNum },
              { label: 'Name',         value: submission.packageName ?? '—' },
              { label: 'Mode',         value: submission.mode },
              { label: 'Files',        value: String(submission.fileCount) },
              { label: 'Workspace',    value: submission.workspace },
              { label: 'Submitted By', value: submission.submittedBy },
              { label: 'Submit Date',  value: formatDate(submission.submitDate) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Pipeline Progress</p>
          <div className="space-y-2.5">
            {timelineSteps.map((step, index) => (
              <div key={step.label} className="flex items-start gap-3 rounded-lg border border-border bg-card/70 px-3.5 py-3">
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  step.isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-foreground">{step.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Routing Context</p>
          <dl className="space-y-2">
            {[
              { label: 'Batch Ref', value: submission.batchRef ?? '—' },
              {
                label: 'Current Stage',
                value:
                  submission.status === 'Pending'
                    ? 'Awaiting extraction / preparer review'
                    : submission.status === 'In Progress'
                      ? 'Under reviewer / approver review'
                      : submission.status === 'Completed'
                        ? 'Completed'
                        : 'Returned for correction',
              },
              { label: 'Assigned To', value: submission.assignee_id ?? 'Auto-routed' },
              { label: 'Attempt', value: `Attempt ${submission.attemptNumber ?? 1}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* Decline History — shown only for Declined submissions */}
        {submission.status === 'Declined' && (
          <div className={`rounded-lg border p-4 space-y-3 ${
            submission.declineSource === 'approver'
              ? 'border-amber-300 bg-amber-50/60'
              : 'border-orange-200 bg-orange-50/60'
          }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5 ${
              submission.declineSource === 'approver' ? 'text-amber-700' : 'text-orange-700'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                submission.declineSource === 'approver' ? 'bg-amber-500' : 'bg-orange-500'
              }`} />
              Decline History
            </p>
            {/* Declined by — source indicator */}
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                submission.declineSource === 'approver' ? 'text-amber-600/70' : 'text-orange-600/70'
              }`}>Declined By</p>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-semibold border ${
                submission.declineSource === 'approver'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-orange-100 text-orange-800 border-orange-200'
              }`}>
                {submission.declineSource === 'approver' ? '⬡ Approver' : '◈ Preparer / Extraction'}
              </span>
            </div>
            {/* Reason category */}
            {submission.declineReasonLabel && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600/70 mb-0.5">Reason Category</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                  {submission.declineReasonLabel}
                </span>
              </div>
            )}
            {/* Full reason text */}
            {submission.declineReason && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600/70 mb-0.5">Reviewer Notes</p>
                <p className="text-[12px] text-orange-900 leading-relaxed">{submission.declineReason}</p>
              </div>
            )}
            {/* Submitter correction note */}
            {submission.correctionNote && (
              <div className="pt-1 border-t border-orange-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600/70 mb-0.5">Your Correction Note</p>
                <p className="text-[12px] text-orange-900 italic leading-relaxed">"{submission.correctionNote}"</p>
              </div>
            )}
            {/* Attempt number */}
            {submission.attemptNumber && submission.attemptNumber > 1 && (
              <div className="pt-1 border-t border-orange-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600/70 mb-0.5">Submission Attempt</p>
                <p className="text-[12px] text-orange-800 font-medium">Attempt {submission.attemptNumber}</p>
              </div>
            )}
          </div>
        )}

        {/* File list */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Files</p>
          <ul className="space-y-1.5">
            {submission.files.map(f => {
              const fileReason = submission.declineFileReasons?.find(r => r.fileName === f.name);
              return (
                <li key={f.docId} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[240px]">{f.name}</span>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                      {f.role}
                    </span>
                  </div>
                  {fileReason && (
                    <div className="ml-4.5 flex items-start gap-1 text-[11px] text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{fileReason.reason}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Unsubmit */}
        {!isReadOnly && (
          <div className="pt-2">
            {confirming ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-[13px] font-semibold text-destructive mb-1">Confirm Unsubmit</p>
                <p className="text-[12px] text-muted-foreground mb-3">
                  This will return the package to Contract Packages for editing.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirming(false)} className="text-[12px]">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => { onUnsubmit(submission); onClose(); }}
                    className="text-[12px] bg-destructive hover:bg-destructive/90 text-white">
                    Yes, Unsubmit
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline"
                className="w-full justify-start gap-2 text-[13px] text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                onClick={() => setConfirming(true)}>
                <X className="w-3.5 h-3.5" /> Unsubmit Package
              </Button>
            )}
          </div>
        )}
      </div>
    </FlagSlidingPanel>
  );
}

// ─── S1d: Package Detail Panel ──────────────────────────────────────────────

// Undo toast content component
function UngroupUndoToast({
  packageNum,
  fileCount,
  remaining,
  onUndo,
  onDismiss,
}: {
  packageNum: string;
  fileCount: number;
  remaining: number;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {packageNum} ungrouped
        </p>
        <p className="text-[12px] text-muted-foreground">
          {fileCount} file{fileCount !== 1 ? 's' : ''} returned to Stage Documents
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUndo}
          className="px-2.5 py-1 rounded text-[12px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Undo ({remaining}s)
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Remove-file undo toast
function RemoveFileUndoToast({
  fileName,
  packageNum,
  remaining,
  onUndo,
  onDismiss,
}: {
  fileName: string;
  packageNum: string;
  remaining: number;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
          Removed from {packageNum}
        </p>
        <p className="text-[12px] text-muted-foreground truncate" title={fileName}>
          {fileName}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onUndo}
          className="px-2.5 py-1 rounded text-[12px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Undo ({remaining}s)
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Role badge colour map
const ROLE_BADGE: Record<DocumentRole, string> = {
  'Base Contract': 'bg-blue-50 text-blue-700 border-blue-200',
  'Amendment':     'bg-amber-50 text-amber-700 border-amber-200',
  'Addendum':      'bg-orange-50 text-orange-700 border-orange-200',
  'Exhibit':       'bg-violet-50 text-violet-700 border-violet-200',
  'Schedule':      'bg-teal-50 text-teal-700 border-teal-200',
  'Notice':        'bg-rose-50 text-rose-700 border-rose-200',
  'Supporting':    'bg-slate-100 text-slate-600 border-slate-200',
  'Undefined':     'bg-red-50 text-red-600 border-red-200',
};

interface PackageDetailPanelProps {
  pkg: ContractPackage;
  isReadOnly: boolean;
  onClose: () => void;
  onSaveRoles: (pkgId: string, updatedFiles: PackageFile[]) => void;
  onSubmit: (pkg: ContractPackage) => void;
  onUngroup: (pkg: ContractPackage) => void;
  onRemoveFile: (pkgId: string, docId: string) => void;
  onRename: (pkgId: string, newName: string) => void;
}

function PackageDetailPanel({ pkg, isReadOnly, onClose, onSaveRoles, onSubmit, onUngroup, onRemoveFile, onRename }: PackageDetailPanelProps) {
  const [editedRoles, setEditedRoles] = useState<Record<string, DocumentRole>>(
    () => Object.fromEntries(pkg.files.map(f => [f.docId, f.role]))
  );
  const [dirty, setDirty] = useState(false);
  const [confirmingUngroup, setConfirmingUngroup] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(pkg.packageName ?? '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startNameEdit = () => {
    setNameValue(pkg.packageName ?? '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 20);
  };
  const commitNameEdit = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed !== (pkg.packageName ?? '')) {
      onRename(pkg.id, trimmed);
    }
  };

  const handleRoleChange = (docId: string, role: DocumentRole) => {
    setEditedRoles(prev => ({ ...prev, [docId]: role }));
    setDirty(true);
  };

  const handleSave = () => {
    const updatedFiles = pkg.files.map(f => ({ ...f, role: editedRoles[f.docId] }));
    onSaveRoles(pkg.id, updatedFiles);
    setDirty(false);
    toast.success('Roles saved');
  };

  const allRolesAssigned = pkg.files.every(f => editedRoles[f.docId] !== 'Undefined');
  const readyAfterEdit = Object.values(editedRoles).every(r => r !== 'Undefined');

  return (
    <FlagSlidingPanel open={true} onClose={onClose} title="Package Details" subtitle={pkg.packageNum} width={560}>
      <div className="space-y-5">
        {/* Metadata */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Package Information</p>
          <dl className="space-y-2">
            {[
              { label: 'Package #', value: pkg.packageNum },
              { label: 'Mode',      value: pkg.mode },
              { label: 'Workspace', value: pkg.workspace },
              { label: 'Created By',value: pkg.createdBy },
              { label: 'Created',   value: formatDate(pkg.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
            {/* Editable Name row */}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[12px] text-muted-foreground shrink-0">Name</dt>
              <dd className="flex items-center gap-1.5 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={nameInputRef}
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onBlur={commitNameEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitNameEdit();
                        if (e.key === 'Escape') { setEditingName(false); }
                      }}
                      placeholder="Enter package name…"
                      className="text-[12px] font-medium border border-primary rounded px-2 py-0.5 bg-background text-foreground w-40 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={commitNameEdit}
                      className="p-0.5 rounded text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Save name"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-foreground">
                      {pkg.packageName ?? <span className="italic text-muted-foreground">— click to name</span>}
                    </span>
                    {!isReadOnly && (
                      <button
                        onClick={startNameEdit}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit package name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Role status banner */}
        <div className={`rounded-md px-3 py-2 flex items-center gap-2 text-[12px] font-medium border ${
          allRolesAssigned
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {allRolesAssigned
            ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> All roles assigned — package is ready to submit.</>  
            : <><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Some files have no role assigned. Assign roles before submitting.</>
          }
        </div>

        {/* File list with inline role editing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Files ({pkg.files.length})
            </p>
            {!isReadOnly && dirty && (
              <Button size="sm" onClick={handleSave} className="h-6 px-2.5 text-[11px] gap-1">
                <CheckCircle2 className="w-3 h-3" /> Save Roles
              </Button>
            )}
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide">File</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wide w-44">Role</th>
                </tr>
              </thead>
              <tbody>
                {pkg.files.map((f, idx) => (
                  <tr key={f.docId} className={`border-b border-border/50 last:border-0 ${
                    idx % 2 === 0 ? '' : 'bg-muted/20'
                  }`}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[180px]" title={f.name}>
                          {f.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {isReadOnly ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          ROLE_BADGE[editedRoles[f.docId]]
                        }`}>
                          {editedRoles[f.docId]}
                        </span>
                      ) : (
                        <Select
                          value={editedRoles[f.docId]}
                          onValueChange={v => handleRoleChange(f.docId, v as DocumentRole)}
                        >
                          <SelectTrigger className={`h-7 text-[12px] w-40 border ${
                            editedRoles[f.docId] === 'Undefined'
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-border'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_ROLES.map(r => (
                              <SelectItem key={r} value={r}>
                                <span className={`inline-flex items-center gap-1.5`}>
                                  <span className={`w-2 h-2 rounded-full inline-block border ${
                                    ROLE_BADGE[r as DocumentRole]
                                  }`} />
                                  {r}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="px-2 py-2.5 w-8">
                        <button
                          onClick={() => onRemoveFile(pkg.id, f.docId)}
                          disabled={pkg.files.length <= 1}
                          title={pkg.files.length <= 1 ? 'Cannot remove the last file — ungroup instead' : `Remove ${f.name} from package`}
                          className={`p-1 rounded transition-colors ${
                            pkg.files.length <= 1
                              ? 'text-muted-foreground/30 cursor-not-allowed'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          }`}
                          aria-label={`Remove ${f.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="pt-1 flex flex-col gap-2">
            {dirty && (
              <Button size="sm" onClick={handleSave} className="w-full gap-2 text-[13px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Save Role Changes
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => { onSubmit(pkg); onClose(); }}
              disabled={!readyAfterEdit}
              title={!readyAfterEdit ? 'Assign roles to all files before submitting' : undefined}
              className={`w-full gap-2 text-[13px] ${
                readyAfterEdit
                  ? 'bg-[#1F3864] hover:bg-[#162d54] text-white'
                  : 'bg-[#9CA3AF] text-white cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" /> Submit Package
            </Button>

            {/* Ungroup — inline confirmation */}
            <div className="pt-1">
              {confirmingUngroup ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-[13px] font-semibold text-destructive mb-1">Confirm Ungroup</p>
                  <p className="text-[12px] text-muted-foreground mb-3">
                    This will dissolve <span className="font-semibold text-foreground">{pkg.packageNum}</span> and return all {pkg.files.length} file{pkg.files.length !== 1 ? 's' : ''} to Stage Documents.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmingUngroup(false)} className="text-[12px]">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { onUngroup(pkg); onClose(); }}
                      className="text-[12px] bg-destructive hover:bg-destructive/90 text-white gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Yes, Ungroup
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmingUngroup(true)}
                  className="w-full justify-start gap-2 text-[13px] text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                >
                  <Unlink className="w-3.5 h-3.5" /> Ungroup Package
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </FlagSlidingPanel>
  );
}

// ─── S1e: Add-to-Package Dialog ──────────────────────────────────────────────

function AddToPackageDialog({
  docs,
  packages,
  onConfirm,
  onCancel,
}: {
  docs: StagedDocument[];
  packages: ContractPackage[];
  onConfirm: (targetPkgId: string) => void;
  onCancel: () => void;
}) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-[480px] rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Add to Existing Package</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Adding {docs.length} file{docs.length !== 1 ? 's' : ''} to a package
            </p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File preview */}
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Files to add</p>
          <ul className="space-y-1 max-h-28 overflow-y-auto">
            {docs.map(d => (
              <li key={d.id} className="flex items-center gap-2 text-[12px] text-foreground">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{d.display_name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Package selector */}
        <div className="px-5 py-4">
          <label className="text-[12px] font-semibold text-foreground block mb-2">Select target package</label>
          {packages.length === 0 ? (
            <p className="text-[13px] text-muted-foreground italic">No packages available. Create a package first using “Group Selected”.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {packages.map(pkg => (
                <label
                  key={pkg.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedPkgId === pkg.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="target-pkg"
                    value={pkg.id}
                    checked={selectedPkgId === pkg.id}
                    onChange={() => setSelectedPkgId(pkg.id)}
                    className="accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground font-mono">{pkg.packageNum}</span>
                      {pkg.packageName && (
                        <span className="text-[12px] text-muted-foreground truncate">{pkg.packageName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{pkg.files.length} file{pkg.files.length !== 1 ? 's' : ''}</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">{pkg.workspace}</span>
                      <span className={`ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                        pkg.status === 'Ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{pkg.status}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <Button size="sm" variant="outline" onClick={onCancel} className="text-[13px]">Cancel</Button>
          <Button
            size="sm"
            onClick={() => selectedPkgId && onConfirm(selectedPkgId)}
            disabled={!selectedPkgId || packages.length === 0}
            className="text-[13px] gap-1.5"
          >
            <Package className="w-3.5 h-3.5" /> Add to Package
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── S1c: Bulk Action Bar ─────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  onGroup,
  onAddToPackage,
  onRemove,
  onClear,
}: {
  selectedCount: number;
  onGroup: () => void;
  onAddToPackage: () => void;
  onRemove: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 shadow-xl">
      <span className="text-[13px] font-semibold text-foreground">{selectedCount} selected</span>
      <div className="h-4 w-px bg-border" />
      <Button size="sm" onClick={onGroup} className="gap-1.5 text-[13px]">
        <Package className="w-3.5 h-3.5" /> New Package
      </Button>
      <Button size="sm" variant="outline" onClick={onAddToPackage} className="gap-1.5 text-[13px]">
        <Layers className="w-3.5 h-3.5" /> Add to Package
      </Button>
      <Button size="sm" variant="outline" onClick={onRemove} className="gap-1.5 text-[13px] text-destructive hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" /> Remove
      </Button>
      <button onClick={onClear} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
        Clear
      </button>
    </div>
  );
}

// ─── Resubmit Confirm Dialog ─────────────────────────────────────────────────

function ResubmitConfirmDialog({
  submission,
  onConfirm,
  onCancel,
}: {
  submission: Submission;
  onConfirm: (correctionNote: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-[520px] rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <RotateCcw className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground leading-tight">
              Resubmit {submission.packageNum}?
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              This package was previously declined. Review the reason below and add a correction note before resubmitting.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Decline reason block */}
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600 mb-1">Decline Reason</p>
            {submission.declineReasonLabel && (
              <p className="text-[13px] font-semibold text-orange-800 leading-tight">{submission.declineReasonLabel}</p>
            )}
            {submission.declineReason && (
              <p className="text-[12px] text-orange-700 mt-1 leading-relaxed">{submission.declineReason}</p>
            )}
            {!submission.declineReasonLabel && !submission.declineReason && (
              <p className="text-[12px] text-orange-700 italic">No reason provided.</p>
            )}
          </div>

          {/* Package summary */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Package</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[12px] font-semibold text-primary">{submission.packageNum}</span>
              {submission.packageName && (
                <span className="text-[12px] text-muted-foreground">{submission.packageName}</span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {submission.fileCount} file{submission.fileCount !== 1 ? 's' : ''} · {submission.workspace}
              </span>
            </div>
          </div>

          {/* Correction note */}
          <div>
            <label className="block text-[12px] font-semibold text-foreground mb-1.5">
              Correction Note
              <span className="ml-1 text-[11px] font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Describe what was corrected or why you are resubmitting…"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              This note will be stored with the resubmitted package and visible to reviewers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <Button size="sm" variant="outline" onClick={onCancel} className="text-[13px]">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(note)}
            className="text-[13px] gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Confirm Resubmit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineDashboard() {
  const _screenKey = SCREEN_KEYS.PIPELINE_DASHBOARD;
  const [, navigate] = useLocation();
  const { activeRole } = useRole();
  const isReadOnly = activeRole === 'auditor';
  const { setPipelineReadyCount, setApprovalsCount } = usePipelineCounts();
  const { addNotification } = useNotifications();

  // ── Upload dialog state ──
  const [showUpload, setShowUpload] = useState(false);
  // FC-3 BR1: holds intent from PackagesComposition "Add Document" button
  // { packageId, recordId, recordLabel } — pre-populates UploadDialog with the target record
  const [addDocumentIntent, setAddDocumentIntent] = useState<{ packageId: string; recordId: string; recordLabel: string } | null>(null);

  // ── Table scroll-fade refs (right-edge gradient indicator) ──
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);
  const scrollRef3 = useRef<HTMLDivElement>(null);
  const scrollRef4 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const refs = [scrollRef1, scrollRef2, scrollRef3, scrollRef4];
    const observers: ResizeObserver[] = [];
    refs.forEach(ref => {
      const el = ref.current;
      if (!el) return;
      const update = () => {
        el.classList.toggle('is-scrollable', el.scrollWidth > el.clientWidth + 2);
      };
      update();
      el.addEventListener('scroll', update);
      const ro = new ResizeObserver(update);
      ro.observe(el);
      observers.push(ro);
    });
    return () => {
      refs.forEach(ref => ref.current?.removeEventListener('scroll', () => {}));
      observers.forEach(ro => ro.disconnect());
    };
  }, []);

  // ── Stage Documents state ──
  // PRODUCTION: replace MOCK_DOCUMENTS with: const { data } = useQuery(['stagedDocs'], api.get('/api/v1/pipeline/staged'))
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>(MOCK_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [colFilters, setColFilters] = useState({ name: '', uploader: '', workspace: '' });
  // Workspace quick-filter pill ('' = All)
  const [workspacePill, setWorkspacePill] = useState<string>('');
  // Assignee quick-filter pill ('' = All)
  const [assigneePill, setAssigneePill] = useState<string>('');
  // Contract type quick-filter pill ('' = All, 'Equipment Lease' = equipment only)
  const [contractTypePill, setContractTypePill] = useState<string>('');
  // Bulk reassign dialog state for Stage Documents
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkReassignTargetId, setBulkReassignTargetId] = useState<string>('');
  // Reassign dialog state for Contract Packages
  const [reassignPkgId, setReassignPkgId] = useState<string | null>(null);
  const [reassignPkgTargetId, setReassignPkgTargetId] = useState<string>('');
  // Tab: 'active' = staging pipeline, 'committed' = audit view
  // stageView removed — committed docs now have their own standalone table (Table 4)

  // S1a — Document detail panel
  const [detailDoc, setDetailDoc] = useState<DocForPanel | null>(null);
  // S1b — Batch detail panel
  const [detailBatch, setDetailBatch] = useState<IntakeBatch | null>(null);
  // S1c — Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Inline assignee reassignment in Stage Documents
  const [editingAssigneeDocId, setEditingAssigneeDocId] = useState<string | null>(null);
  // Grouping dialog
  const [groupingDocs, setGroupingDocs] = useState<StagedDocument[] | null>(null);
  // Add-to-package dialog
  const [addToPackageDocs, setAddToPackageDocs] = useState<StagedDocument[] | null>(null);

  // ── Contract Packages state ──
  const [contractPackages, setContractPackages] = useState<ContractPackage[]>(INITIAL_PACKAGES);
  const [pkgColFilters, setPkgColFilters] = useState({ packageNum: '', name: '', workspace: '', createdBy: '' });
  const [pkgStatusFilter, setPkgStatusFilter] = useState<'all' | 'Ready' | 'Incomplete'>('all');
  const [pkgSort, setPkgSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(() => {
    try {
      const raw = sessionStorage.getItem('leasegov_pkg_sort');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [confirmSubmitAll, setConfirmSubmitAll] = useState(false);
  const [detailPkg, setDetailPkg] = useState<ContractPackage | null>(null);
  // Expandable rows — Set of pkg/sub/doc ids that are currently expanded
  const [expandedPkgs, setExpandedPkgs] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [expandedCommitted, setExpandedCommitted] = useState<Set<string>>(new Set());
  function toggleExpand(set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  // Inline rename
  const [renamingPkgId, setRenamingPkgId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Submissions state ──
  // PRODUCTION: replace INITIAL_SUBMISSIONS with: const { data } = useQuery(['submissions'], api.get('/api/v1/submissions'))
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [subColFilters, setSubColFilters] = useState({ packageNum: '', name: '', workspace: '', submittedBy: '' });
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Declined'>('all');
  const [subSort, setSubSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(() => {
    try {
      const raw = sessionStorage.getItem('leasegov_sub_sort');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [detailSub, setDetailSub] = useState<Submission | null>(null);
  // Holds the declined submission awaiting the resubmit confirmation modal
  const [resubmitTarget, setResubmitTarget] = useState<Submission | null>(null);

  // ── Sync live badge counts to sidebar nav context ──
  useEffect(() => {
    // Sidebar badge: only count active (non-committed) valid docs
    const validCount = stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'valid').length;
    setPipelineReadyCount(validCount);
  }, [stagedDocs, setPipelineReadyCount]);

  useEffect(() => {
    // Approvals badge = packages that are Ready (awaiting submission/approval)
    const readyPkgs = contractPackages.filter(p => p.status === 'Ready').length;
    setApprovalsCount(readyPkgs);
  }, [contractPackages, setApprovalsCount]);

  // DEMO ONLY: React to cross-role events (PIPELINE_BATCH_CLEARED, DECLINE_SUBMITTED).
  // PRODUCTION: replace with real-time backend subscriptions (WebSocket/SSE) or polling queries.
  //   PIPELINE_BATCH_CLEARED → invalidate ['stagedDocs'] and ['contractPackages'] queries
  //   DECLINE_SUBMITTED      → invalidate ['submissions'] query; backend sends push notification
  useEffect(() => {
    const unsub = subscribeToEvents((event) => {
      if (event.type === 'PIPELINE_BATCH_CLEARED') {
        const payload = event.payload as { fileNames?: string[]; batchId?: string };
        const clearedNames = new Set(payload.fileNames ?? []);
        if (clearedNames.size === 0) return;
        setStagedDocs(prev => prev.filter(d => !clearedNames.has(d.display_name)));
        setContractPackages(prev =>
          prev.filter(pkg => !pkg.files.every(f => clearedNames.has(f.name)))
        );
      }
      if (event.type === 'DECLINE_SUBMITTED') {
        const payload = event.payload as {
          // ExtractionQueue (Preparer decline) shape
          submissionId?: string;
          batchRef?: string;
          reasonLabel?: string;
          reason?: string;
          document_ids?: string[];
          perFileReasons?: { jobId: string; fileName: string; reason: string }[];
          // ApprovalsApprover (Approver decline-for-rework) shape
          task_id?: string;
          record_id?: string;
          outcome?: string;
          comments?: string;
        };
        const idSet = new Set(payload.document_ids ?? []);
        const declinedFileNames = new Set((payload.perFileReasons ?? []).map(item => item.fileName.toLowerCase()));
        // If document_ids are missing, fall back to file-name matching so the docs
        // still return to Table 1 and any locked rows are unlocked.
        if (idSet.size > 0 || declinedFileNames.size > 0) {
          setStagedDocs(prev => prev.map(d => {
            const matchesDocumentId = idSet.has(d.id);
            const matchesFileName = idSet.size === 0 && declinedFileNames.has(d.display_name.toLowerCase());
            if (!matchesDocumentId && !matchesFileName) return d;
            return {
              ...d,
              status: d.original_status ?? 'valid',
              locked_for_review: false,
              target_record_id: null,
            };
          }));
        }
        // Mark the matching submission as Declined and restore its docs to Table 1
        setSubmissions(prev => prev.map(sub => {
          const isMatch =
            (payload.batchRef     && sub.batchRef    === payload.batchRef)     ||
            (payload.submissionId && sub.packageNum  === payload.submissionId) ||
            (payload.submissionId && sub.id          === payload.submissionId) ||
            (payload.batchRef     && sub.id          === payload.batchRef)     ||
            (payload.record_id    && sub.record_id   === payload.record_id)    ||
            (declinedFileNames.size > 0 && sub.files.some(f => declinedFileNames.has(f.name.toLowerCase()))) ||
            // Approver decline-for-rework: match by task_id (contract record ref)
            (payload.task_id      && (sub.batchRef   === payload.task_id || sub.id === payload.task_id));
          if (!isMatch) return sub;
          // Restore the submission's documents back to Table 1 staging
          // so the submitter can correct and re-package them.
          const restoredDocs: StagedDocument[] = sub.files.map(f => {
            const fileMeta = f as PackageFile;
            const orig: 'valid' | 'invalid' = fileMeta.originalStatus ?? 'valid';
            return {
              id: `restored-decline-${f.docId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              display_name: f.name,
              status: orig,
              original_status: orig,
              originalStatus: orig,
              upload_date: new Date().toLocaleString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false,
              }).replace(',', ''),
              uploader: sub.submittedBy,
              mime_type: fileMeta.mime_type ?? (
                f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif')
                  ? 'image/tiff'
                  : 'application/pdf'
              ),
              file_size_bytes: fileMeta.file_size_bytes ?? 0,
              page_count: fileMeta.page_count ?? null,
              workspace_tag: sub.workspace,
              target_record_id: fileMeta.target_record_id ?? null,
              submission_path: fileMeta.submission_path ?? null,
              submitter_context_notes: fileMeta.submitter_context_notes ?? null,
              contract_type: fileMeta.contract_type ?? null,
              document_job_status: 'staged' as const,
              locked_for_review: false,
              assignee_id: fileMeta.assignee_id ?? sub.assignee_id ?? null,
            };
          });
          // Prepend restored docs to Table 1 without duplicating already-restored rows.
          setStagedDocs(prev => {
            const existingKeys = new Set(prev.map(d => `${d.display_name}::${d.workspace_tag}::${d.uploader}`));
            const uniqueRestored = restoredDocs.filter(d => !existingKeys.has(`${d.display_name}::${d.workspace_tag}::${d.uploader}`));
            return [...uniqueRestored, ...prev];
          });
          // Notify the Document Submitter
          const fileWord = restoredDocs.length !== 1 ? 'files' : 'file';
          // Approver decline-for-rework uses `comments` instead of `reasonLabel`
          const declineLabel = payload.reasonLabel ||
            (payload.outcome === 'declined_for_rework' ? 'Declined for rework by Approver' : 'Submission declined');
          addNotification({
            title: `${sub.packageNum} declined — ${declineLabel}`,
            body: `${restoredDocs.length} ${fileWord} returned to Stage Documents for correction.`,
            severity: 'error',
            href: '/pipeline/dashboard',
          });
          toast.error(`${sub.packageNum} declined — ${declineLabel}`, {
            description: `${restoredDocs.length} ${fileWord} returned to Stage Documents. Review and resubmit.`,
            duration: 8000,
          });
          return {
            ...sub,
            status: 'Declined' as const,
            declineReasonLabel: declineLabel,
            declineReason: payload.reason ?? payload.comments,
            declineFileReasons: payload.perFileReasons ?? [],
            declineSource: payload.outcome === 'declined_for_rework' ? 'approver' as const : 'preparer' as const,
          };
        }));
      }
    });
    return () => unsub();
  }, [addNotification]);

  // ── DEMO ONLY: DEMO_RESET subscriber — restores all state to seed data when the
  // user clicks "Reset Demo" in the sidebar. Remove when backend is wired up;
  // a real reset would be: await api.post('/api/v1/demo/reset') then refetch queries. ──
  useEffect(() => {
    const unsub = subscribeToEvents((event) => {
      if (event.type !== 'DEMO_RESET') return;
      setStagedDocs(MOCK_DOCUMENTS);
      setContractPackages(INITIAL_PACKAGES);
      setSubmissions(INITIAL_SUBMISSIONS);
      setSearchQuery('');
      setColFilters({ name: '', uploader: '', workspace: '' });
      setSelectedIds(new Set());
      setGroupingDocs(null);
      setAddToPackageDocs(null);
      setPkgColFilters({ packageNum: '', name: '', workspace: '', createdBy: '' });
      setPkgStatusFilter('all');
      setPkgSort(null);
      setConfirmSubmitAll(false);
      setDetailDoc(null);
      setDetailBatch(null);
      setDetailPkg(null);
      setDetailSub(null);
      setResubmitTarget(null);
      setSubColFilters({ packageNum: '', name: '', workspace: '', submittedBy: '' });
      setSubStatusFilter('all');
      setSubSort(null);
      setExpandedPkgs(new Set());
      setExpandedSubs(new Set());
      setExpandedCommitted(new Set());
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── FC-3 BR1: Add Document intent from PackagesComposition ───────────────────────────────────────────
  // Reads sessionStorage on mount; if an add-document intent is present,
  // opens the Upload dialog with the target record pre-selected.
  // PRODUCTION: replace sessionStorage with React Router location.state.
  useEffect(() => {
    const raw = sessionStorage.getItem('leasegov_add_doc_for');
    if (!raw) return;
    sessionStorage.removeItem('leasegov_add_doc_for');
    try {
      const intent = JSON.parse(raw) as { packageId: string; recordId: string; recordLabel: string };
      setAddDocumentIntent(intent);
      setShowUpload(true);
      toast.info(`Adding document to ${intent.recordLabel}`, {
        description: 'Upload dialog pre-populated with the target record.',
        duration: 5000,
      });
    } catch { /* ignore malformed intent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived counts — committed docs are excluded from all pipeline stat cards ──
  const counts = {
    uploading:  stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'uploading').length,
    validating: stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'validating').length,
    valid:      stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'valid').length,
    submitted:  submissions.length,
  };

  // Committed docs have left the pipeline — exclude them from the staging table entirely
  const activeStagedDocs = stagedDocs.filter(d => d.document_job_status !== 'committed');

  const filteredDocs = activeStagedDocs.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      doc.display_name.toLowerCase().includes(q) ||
      doc.workspace_tag.toLowerCase().includes(q) ||
      doc.uploader.toLowerCase().includes(q);
    const matchesCol =
      doc.display_name.toLowerCase().includes(colFilters.name.toLowerCase()) &&
      doc.uploader.toLowerCase().includes(colFilters.uploader.toLowerCase()) &&
      doc.workspace_tag.toLowerCase().includes(colFilters.workspace.toLowerCase());
    const matchesPill = !workspacePill || doc.workspace_tag === workspacePill;
    const matchesAssigneePill = !assigneePill ||
      (assigneePill === '__unassigned__' ? !doc.assignee_id : doc.assignee_id === assigneePill);
    const matchesTypePill = !contractTypePill || doc.contract_type === contractTypePill;
    return matchesSearch && matchesCol && matchesPill && matchesAssigneePill && matchesTypePill;
  });

  const filteredPkgs = (() => {
    const filtered = contractPackages.filter(pkg => {
      const matchesStatus = pkgStatusFilter === 'all' ||
        (pkgStatusFilter === 'Ready' && isPackageReady(pkg)) ||
        (pkgStatusFilter === 'Incomplete' && !isPackageReady(pkg));
      return matchesStatus &&
        pkg.packageNum.toLowerCase().includes(pkgColFilters.packageNum.toLowerCase()) &&
        (pkg.packageName ?? '').toLowerCase().includes(pkgColFilters.name.toLowerCase()) &&
        pkg.workspace.toLowerCase().includes(pkgColFilters.workspace.toLowerCase()) &&
        pkg.createdBy.toLowerCase().includes(pkgColFilters.createdBy.toLowerCase());
    });
    if (!pkgSort) return filtered;
    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (pkgSort.col === 'packageNum')  { av = a.packageNum; bv = b.packageNum; }
      else if (pkgSort.col === 'name')   { av = a.packageName ?? ''; bv = b.packageName ?? ''; }
      else if (pkgSort.col === 'mode')   { av = a.mode; bv = b.mode; }
      else if (pkgSort.col === 'files')  { av = a.files.length; bv = b.files.length; }
      else if (pkgSort.col === 'workspace') { av = a.workspace; bv = b.workspace; }
      else if (pkgSort.col === 'createdBy') { av = a.createdBy; bv = b.createdBy; }
      else if (pkgSort.col === 'createdAt') { av = a.createdAt; bv = b.createdAt; }
      else if (pkgSort.col === 'status') { av = isPackageReady(a) ? 'Ready' : 'Incomplete'; bv = isPackageReady(b) ? 'Ready' : 'Incomplete'; }
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return pkgSort.dir === 'asc' ? cmp : -cmp;
    });
  })();

  const filteredSubs = (() => {
    const filtered = submissions.filter(sub =>
      (subStatusFilter === 'all' || sub.status === subStatusFilter) &&
      sub.packageNum.toLowerCase().includes(subColFilters.packageNum.toLowerCase()) &&
      (sub.packageName ?? '').toLowerCase().includes(subColFilters.name.toLowerCase()) &&
      sub.workspace.toLowerCase().includes(subColFilters.workspace.toLowerCase()) &&
      sub.submittedBy.toLowerCase().includes(subColFilters.submittedBy.toLowerCase())
    );
    if (!subSort) return filtered;
    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (subSort.col === 'packageNum')   { av = a.packageNum; bv = b.packageNum; }
      else if (subSort.col === 'name')    { av = a.packageName ?? ''; bv = b.packageName ?? ''; }
      else if (subSort.col === 'mode')    { av = a.mode; bv = b.mode; }
      else if (subSort.col === 'files')   { av = a.fileCount; bv = b.fileCount; }
      else if (subSort.col === 'workspace')   { av = a.workspace; bv = b.workspace; }
      else if (subSort.col === 'submittedBy') { av = a.submittedBy; bv = b.submittedBy; }
      else if (subSort.col === 'submitDate')  { av = a.submitDate; bv = b.submitDate; }
      else if (subSort.col === 'status')  { av = a.status; bv = b.status; }
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return subSort.dir === 'asc' ? cmp : -cmp;
    });
  })();

  // ── S1c helpers ──
  const allFilteredSelected = filteredDocs.length > 0 && filteredDocs.every(d => selectedIds.has(d.id));
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => { const n = new Set(prev); filteredDocs.forEach(d => n.delete(d.id)); return n; });
    } else {
      setSelectedIds(prev => {
        const n = new Set(prev);
        // Determine the assignee anchor: first already-selected doc, or first filtered doc
        const currentlySelected = activeStagedDocs.filter(d => n.has(d.id));
        const anchorAssignee = currentlySelected.length > 0
          ? (currentlySelected[0].assignee_id ?? null)
          : (filteredDocs[0]?.assignee_id ?? null);
        let blocked = 0;
        filteredDocs.forEach(d => {
          if ((d.assignee_id ?? null) === anchorAssignee) {
            n.add(d.id);
          } else {
            blocked++;
          }
        });
        if (blocked > 0) {
          const anchorName = anchorAssignee
            ? (MOCK_ASSIGNEES.find(a => a.id === anchorAssignee)?.name ?? anchorAssignee)
            : 'Auto-routed';
          toast.warning(`${blocked} file${blocked !== 1 ? 's' : ''} skipped`, {
            description: `Only files assigned to ${anchorName} were selected. Reassign the remaining files to include them.`,
            duration: 5000,
          });
        }
        return n;
      });
    }
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        // Deselect — always allowed
        n.delete(id);
        return n;
      }
      // Selecting: enforce same-assignee rule
      const incomingDoc = activeStagedDocs.find(d => d.id === id);
      const currentlySelected = activeStagedDocs.filter(d => n.has(d.id));
      if (currentlySelected.length > 0 && incomingDoc) {
        const existingAssignee = currentlySelected[0].assignee_id ?? null;
        const incomingAssignee = incomingDoc.assignee_id ?? null;
        if (existingAssignee !== incomingAssignee) {
          const existingName = existingAssignee
            ? (MOCK_ASSIGNEES.find(a => a.id === existingAssignee)?.name ?? existingAssignee)
            : 'Auto-routed';
          const incomingName = incomingAssignee
            ? (MOCK_ASSIGNEES.find(a => a.id === incomingAssignee)?.name ?? incomingAssignee)
            : 'Auto-routed';
          toast.error('Mixed assignees — cannot select together', {
            description: `Current selection is assigned to ${existingName}. "${incomingDoc.display_name}" is assigned to ${incomingName}. Reassign one before packaging.`,
            duration: 5000,
          });
          return prev; // reject the selection change
        }
      }
      n.add(id);
      return n;
    });
  };

  // ── Upload confirm handler (V4 — 6-argument callback, includes optional assignee override) ──
  function handleUploadConfirm(
    uploadedFiles: UploadedFile[],
    workspaceTag: string,
    targetRecordId: string | null,
    submissionPath: 'new_record' | 'existing_record' | 'unknown' | null,
    contextNotes: string | null,
    _assigneeId: string | null, // DEMO ONLY — PRODUCTION: pass to POST /api/v1/pipeline/staged as assignee_id
    contractType: string | null = null, // MOD-3: from New Record form; forwarded to extraction template pre-selection
  ) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // V3 spec: only valid files are admitted to staging — invalid files are blocked at upload
    const newDocs: StagedDocument[] = uploadedFiles
      .filter(f => f.status !== 'invalid')
      .map(f => ({
        id: f.id,
        display_name: f.name,
        status: 'valid' as const,
        original_status: 'valid' as const,
        originalStatus: 'valid' as const,
        upload_date: dateStr,
        uploader: activeRole === 'document_submitter' ? 'You' : 'Current User',
        mime_type: f.mime_type,
        file_size_bytes: f.size,
        page_count: null,
        workspace_tag: workspaceTag,
        target_record_id: targetRecordId,
        submission_path: submissionPath,
        submitter_context_notes: contextNotes,
        contract_type: contractType, // MOD-3: stored so GroupingDialog can carry it into PackageFile
        document_job_status: 'staged' as const,
        assignee_id: _assigneeId, // DEMO ONLY — PRODUCTION: pass to POST /api/v1/pipeline/staged
      }));
    const invalidCount = uploadedFiles.filter(f => f.status === 'invalid').length;
    setStagedDocs(prev => [...newDocs, ...prev]);
    if (newDocs.length > 0) {
      toast.success(`${newDocs.length} valid file${newDocs.length !== 1 ? 's' : ''} added to the pipeline.${
        invalidCount > 0 ? ` ${invalidCount} invalid file${invalidCount !== 1 ? 's' : ''} were not added.` : ''
      }`);
    } else if (invalidCount > 0) {
      toast.error(`No files added — all ${invalidCount} file${invalidCount !== 1 ? 's' : ''} failed validation.`);
    }
  }

  // ── Sort helpers ──
  function togglePkgSort(col: string) {
    setPkgSort(prev => {
      const next = prev?.col === col
        ? prev.dir === 'asc' ? { col, dir: 'desc' as const } : null
        : { col, dir: 'asc' as const };
      try { next ? sessionStorage.setItem('leasegov_pkg_sort', JSON.stringify(next)) : sessionStorage.removeItem('leasegov_pkg_sort'); } catch {}
      return next;
    });
  }
  function toggleSubSort(col: string) {
    setSubSort(prev => {
      const next = prev?.col === col
        ? prev.dir === 'asc' ? { col, dir: 'desc' as const } : null
        : { col, dir: 'asc' as const };
      try { next ? sessionStorage.setItem('leasegov_sub_sort', JSON.stringify(next)) : sessionStorage.removeItem('leasegov_sub_sort'); } catch {}
      return next;
    });
  }

  // ── Grouping workflow ──
  function openGroupingDialog() {
    // Only allow grouping of active (non-committed) staged docs
    const docs = activeStagedDocs.filter(d => selectedIds.has(d.id));
    if (docs.length === 0) return;
    setGroupingDocs(docs);
  }

  function confirmGrouping(files: PackageFile[]) {
    if (!groupingDocs) return;
    const docIds = new Set(groupingDocs.map(d => d.id));
    // Carry assignee from the staged docs into each PackageFile and the package itself
    const filesWithAssignee: PackageFile[] = files.map(f => {
      const srcDoc = groupingDocs.find(d => d.id === f.docId);
      return { ...f, assignee_id: srcDoc?.assignee_id ?? null };
    });
    const pkg: ContractPackage = {
      id: `pkg-${Date.now()}`,
      packageNum: nextPackageNum(),
      mode: filesWithAssignee.length >= 2 ? 'Package' : 'Single',
      files: filesWithAssignee,
      workspace: groupingDocs[0].workspace_tag,
      createdBy: groupingDocs[0].uploader,
      createdAt: new Date().toISOString(),
      status: filesWithAssignee.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
      assignee_id: groupingDocs[0].assignee_id ?? null,
    };
    setStagedDocs(prev => prev.filter(d => !docIds.has(d.id)));
    setContractPackages(prev => [pkg, ...prev]);
    setSelectedIds(new Set());
    setGroupingDocs(null);
    toast.success(`Package ${pkg.packageNum} created`);
  }

  // ── Submit package workflow ──
  function submitPackage(pkg: ContractPackage) {
    if (!isPackageReady(pkg)) return;
    const subId = `sub-${Date.now()}`;
    // batchRef is derived the same way ExtractionQueue derives batch_ref from BATCH_SUBMITTED payload
    const batchRef = `BATCH-${subId.slice(-6).toUpperCase()}`;
    // Carry resubmit metadata if the package was restored from a declined submission
    const pkgMeta = pkg as ContractPackage & { _correctionNote?: string; _attemptNumber?: number };
    const sub: Submission = {
      id: subId,
      batchRef,
      packageNum: pkg.packageNum,
      packageName: pkg.packageName,
      mode: pkg.mode,
      fileCount: pkg.files.length,
      fileNames: pkg.files.map(f => f.name),
      files: pkg.files,
      workspace: pkg.workspace,
      submittedBy: pkg.createdBy,
      submitDate: new Date().toISOString(),
      status: 'Pending',
      assignee_id: pkg.assignee_id ?? null,
      ...(pkgMeta._attemptNumber !== undefined && {
        isResubmit: true,
        attemptNumber: pkgMeta._attemptNumber,
        correctionNote: pkgMeta._correctionNote,
      }),
    };
    setContractPackages(prev => prev.filter(p => p.id !== pkg.id));
    setSubmissions(prev => [sub, ...prev]);
    toast.success(`${pkg.packageNum} submitted successfully`);
    // DEMO ONLY: notify Preparer tab that a new batch is ready for extraction.
    // PRODUCTION: replace with: await api.post('/api/v1/submissions', submissionPayload)
    // The backend will create the submission record and push a notification to the Preparer.
    publishEvent({
      type: 'BATCH_SUBMITTED',
      payload: { batchId: batchRef, packageNum: pkg.packageNum, batchRef, workspace: pkg.workspace },
      sourceRole: 'document_submitter',
    });
  }

  // ── Ungroup package workflow (with 10s undo countdown) ──
  const ungroupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function ungroupPackage(pkg: ContractPackage) {
      const restoredDocs: StagedDocument[] = pkg.files.map(f => {
      const orig: 'valid' | 'invalid' = (f as { originalStatus?: 'valid' | 'invalid' }).originalStatus ?? 'valid';
      return {
        id: `restored-${f.docId}-${Date.now()}`,
        // V3 status restoration
        display_name: f.name,
        status: orig,
        original_status: orig,
        originalStatus: orig,
        upload_date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
        uploader: pkg.createdBy,
        mime_type: f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif') ? 'image/tiff' : 'application/pdf',
        file_size_bytes: 0,
        page_count: null,
        workspace_tag: pkg.workspace,
        // V3 Change 6: status restoration fields
        target_record_id: null,
        submission_path: null,
        submitter_context_notes: null,
        document_job_status: 'staged' as const,
        assignee_id: null, // DEMO ONLY — restored from ungroup
      };
    });
    setContractPackages(prev => prev.filter(p => p.id !== pkg.id));
    setStagedDocs(prev => [...restoredDocs, ...prev]);

    // Undo toast with 15-second countdown
    let remaining = 15;
    const toastId = toast(
      <UngroupUndoToast
        packageNum={pkg.packageNum}
        fileCount={pkg.files.length}
        remaining={remaining}
        onUndo={() => {
          if (ungroupTimerRef.current) clearInterval(ungroupTimerRef.current);
          toast.dismiss(toastId);
          // Reverse: remove restored docs, re-add package
          const restoredIds = new Set(restoredDocs.map(d => d.id));
          setStagedDocs(prev => prev.filter(d => !restoredIds.has(d.id)));
          setContractPackages(prev => [pkg, ...prev]);
          toast.success(`Undo successful — ${pkg.packageNum} restored`);
        }}
        onDismiss={() => {
          if (ungroupTimerRef.current) clearInterval(ungroupTimerRef.current);
          toast.dismiss(toastId);
        }}
      />,
      { duration: Infinity, id: String(Date.now()) }
    );

    // Tick countdown every second, auto-dismiss at 0
    ungroupTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (ungroupTimerRef.current) clearInterval(ungroupTimerRef.current);
        toast.dismiss(toastId);
        return;
      }
      toast(
        <UngroupUndoToast
          packageNum={pkg.packageNum}
          fileCount={pkg.files.length}
          remaining={remaining}
          onUndo={() => {
            if (ungroupTimerRef.current) clearInterval(ungroupTimerRef.current);
            toast.dismiss(toastId);
            const restoredIds = new Set(restoredDocs.map(d => d.id));
            setStagedDocs(prev => prev.filter(d => !restoredIds.has(d.id)));
            setContractPackages(prev => [pkg, ...prev]);
            toast.success(`Undo successful — ${pkg.packageNum} restored`);
          }}
          onDismiss={() => {
            if (ungroupTimerRef.current) clearInterval(ungroupTimerRef.current);
            toast.dismiss(toastId);
          }}
        />,
        { duration: Infinity, id: toastId as string }
      );
    }, 1000);
  }

  // ── Remove single file from package (with 15s undo countdown) ──
  const removeFileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function removeFileFromPackage(pkgId: string, docId: string) {
    const pkg = contractPackages.find(p => p.id === pkgId);
    if (!pkg || pkg.files.length <= 1) return;
    const removedFile = pkg.files.find(f => f.docId === docId);
    if (!removedFile) return;
    const updatedFiles = pkg.files.filter(f => f.docId !== docId);
    const updatedPkg: ContractPackage = {
      ...pkg,
      files: updatedFiles,
      mode: updatedFiles.length >= 2 ? 'Package' : 'Single',
      status: updatedFiles.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
    };
    const origStatus: 'valid' | 'invalid' = (removedFile as { originalStatus?: 'valid' | 'invalid' }).originalStatus ?? 'valid';
    const restoredDoc: StagedDocument = {
      id: `restored-${docId}-${Date.now()}`,
      display_name: removedFile.name,
      status: origStatus,
      original_status: origStatus,
      originalStatus: origStatus,
      upload_date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      uploader: pkg.createdBy,
      mime_type: removedFile.name.toLowerCase().endsWith('.tiff') || removedFile.name.toLowerCase().endsWith('.tif') ? 'image/tiff' : 'application/pdf',
      file_size_bytes: 0,
      page_count: null,
      workspace_tag: pkg.workspace,
      // V3 Change 6: status restoration fields
      target_record_id: null,
      submission_path: null,
      submitter_context_notes: null,
      document_job_status: 'staged' as const,
      assignee_id: null, // DEMO ONLY — restored from remove-file action
    };
    setContractPackages(prev => prev.map(p => p.id === pkgId ? updatedPkg : p));
    setStagedDocs(prev => [restoredDoc, ...prev]);
    setDetailPkg(prev => prev?.id === pkgId ? updatedPkg : prev);

    // Undo toast with 15-second countdown
    let remaining = 15;
    const toastId = toast(
      <RemoveFileUndoToast
        fileName={removedFile.name}
        packageNum={pkg.packageNum}
        remaining={remaining}
        onUndo={() => {
          if (removeFileTimerRef.current) clearInterval(removeFileTimerRef.current);
          toast.dismiss(toastId);
          // Reverse: remove restored doc, restore original package
          setStagedDocs(prev => prev.filter(d => d.id !== restoredDoc.id));
          setContractPackages(prev => prev.map(p => p.id === pkgId ? pkg : p));
          setDetailPkg(prev => prev?.id === pkgId ? pkg : prev);
          toast.success(`Undo successful — "${removedFile.name}" restored to ${pkg.packageNum}`);
        }}
        onDismiss={() => {
          if (removeFileTimerRef.current) clearInterval(removeFileTimerRef.current);
          toast.dismiss(toastId);
        }}
      />,
      { duration: Infinity, id: `remove-file-${Date.now()}` }
    );

    removeFileTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (removeFileTimerRef.current) clearInterval(removeFileTimerRef.current);
        toast.dismiss(toastId);
        return;
      }
      toast(
        <RemoveFileUndoToast
          fileName={removedFile.name}
          packageNum={pkg.packageNum}
          remaining={remaining}
          onUndo={() => {
            if (removeFileTimerRef.current) clearInterval(removeFileTimerRef.current);
            toast.dismiss(toastId);
            setStagedDocs(prev => prev.filter(d => d.id !== restoredDoc.id));
            setContractPackages(prev => prev.map(p => p.id === pkgId ? pkg : p));
            setDetailPkg(prev => prev?.id === pkgId ? pkg : prev);
            toast.success(`Undo successful — "${removedFile.name}" restored to ${pkg.packageNum}`);
          }}
          onDismiss={() => {
            if (removeFileTimerRef.current) clearInterval(removeFileTimerRef.current);
            toast.dismiss(toastId);
          }}
        />,
        { duration: Infinity, id: toastId as string }
      );
    }, 1000);
  }

  // ── Unsubmit workflow ──
  function unsubmitPackage(sub: Submission) {
    const restored: ContractPackage = {
      id: `pkg-restored-${Date.now()}`,
      packageNum: sub.packageNum,
      packageName: sub.packageName,
      mode: sub.mode,
      files: sub.files,
      workspace: sub.workspace,
      createdBy: sub.submittedBy,
      createdAt: sub.submitDate,
      status: sub.files.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
    };
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    setContractPackages(prev => [restored, ...prev]);
    toast.success('Package unsubmitted — returned to Contract Packages');
  }

  // ── Resubmit workflow — restore declined submission as a fresh package in Table 2 ──
  function resubmitPackage(sub: Submission, correctionNote: string) {
    const restoredPkg: ContractPackage = {
      id: `pkg-resubmit-${Date.now()}`,
      packageNum: sub.packageNum,
      packageName: sub.packageName,
      mode: sub.mode,
      files: sub.files,
      workspace: sub.workspace,
      createdBy: sub.submittedBy,
      createdAt: new Date().toISOString(),
      status: sub.files.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
    };
    // Remove the declined submission row
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    // Remove any docs that were restored to Table 1 by DECLINE_SUBMITTED
    // (identified by display_name matching the submission's file names),
    // but update their submitter_context_notes with the correction note first.
    const subFileNames = new Set(sub.fileNames);
    if (correctionNote.trim()) {
      setStagedDocs(prev =>
        prev
          .filter(d => !subFileNames.has(d.display_name))
      );
    } else {
      setStagedDocs(prev => prev.filter(d => !subFileNames.has(d.display_name)));
    }
    // Place the package back in Table 2
    setContractPackages(prev => [restoredPkg, ...prev]);
    // Store the correction note and attempt metadata on the package so that
    // when submitPackage() is called next it can carry them into the new Submission row.
    // We do this by tagging the package object with a transient field.
    (restoredPkg as ContractPackage & { _correctionNote?: string; _attemptNumber?: number })._correctionNote = correctionNote.trim() || undefined;
    (restoredPkg as ContractPackage & { _correctionNote?: string; _attemptNumber?: number })._attemptNumber = (sub.attemptNumber ?? 1) + 1;
    toast.success(
      `${sub.packageNum} returned to Contract Packages — review and resubmit when ready`,
      { duration: 5000 }
    );
  }

  // ── Inline rename ──
  function startRename(pkg: ContractPackage) {
    setRenamingPkgId(pkg.id);
    setRenameValue(pkg.packageName ?? '');
    setTimeout(() => renameInputRef.current?.focus(), 30);
  }
  function commitRename(pkgId: string) {
    setContractPackages(prev => prev.map(p => p.id === pkgId ? { ...p, packageName: renameValue.trim() || undefined } : p));
    setRenamingPkgId(null);
    toast.success('Package name updated');
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Document Pipeline</h1>
            <ScreenNumberBadge screenKey="pipeline-dashboard" />
          </div>
          <p className="page-subtitle">Monitor and manage staged documents before submission to processing.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <UploadCloud className="w-4 h-4" /> Upload Files
        </Button>
      </div>

      {/* 4 Summary cards (Invalid removed - V3: invalid files never enter staging) */}
      <div className="grid grid-cols-4 gap-3">
                {([
          { key: 'uploading',  label: 'Uploading',  icon: <FileUp className="w-5 h-5" />,        accent: 'lg-primary-light' },
          { key: 'validating', label: 'Validating', icon: <RefreshCw className="w-5 h-5" />,     accent: 'lg-primary-light', spinning: counts.validating > 0 },
          { key: 'valid',      label: 'Valid',      icon: <CheckCircle2 className="w-5 h-5" />,  accent: 'lg-success' },
          { key: 'submitted',  label: 'Submitted',  icon: <Send className="w-5 h-5" />,          accent: 'lg-success' },
        ] as const).map(card => (
          <SummaryCard
            key={card.key}
            label={card.label}
            count={counts[card.key]}
            icon={card.icon}
            accentClass={card.accent}
            active={false}
            onClick={() => {}}
            spinning={'spinning' in card ? card.spinning : false}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE 1 — Stage Documents
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
        {/* Table 1 header — Stage Documents (active only) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Stage Documents</h2>
            <span className="px-1.5 py-0 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">{activeStagedDocs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-48 text-[13px]"
              />
            </div>

          </div>
        </div>

        {/* Workspace quick-filter pills */}
        {activeStagedDocs.length > 0 && (() => {
          const WORKSPACE_PILLS = ['Retail', 'Office', 'Industrial', 'Land', 'Corporate Leasing', 'Operations'];
          // Only show pills for workspaces that have at least one doc in staging
          const presentWorkspaces = WORKSPACE_PILLS.filter(ws =>
            activeStagedDocs.some(d => d.workspace_tag === ws)
          );
          const hasEquipment = activeStagedDocs.some(d => d.contract_type === 'Equipment Lease');
          if (presentWorkspaces.length < 2 && !hasEquipment) return null;
          return (
            <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border bg-muted/20 flex-wrap">
              <button
                onClick={() => { setWorkspacePill(''); setContractTypePill(''); }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                  workspacePill === '' && contractTypePill === ''
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                All
              </button>
              {presentWorkspaces.map(ws => {
                const c = getWorkspaceColour(ws);
                const active = workspacePill === ws && contractTypePill === '';
                return (
                  <button
                    key={ws}
                    onClick={() => { setWorkspacePill(active ? '' : ws); setContractTypePill(''); }}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ring-1 transition-all duration-150 ${
                      active
                        ? `${c.bg} ${c.text} ${c.ring} shadow-sm scale-[1.04]`
                        : 'bg-muted text-muted-foreground ring-border hover:ring-1 hover:' + c.ring + ' hover:' + c.text
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? c.dot : 'bg-muted-foreground'}`} />
                    {ws}
                    <span className="ml-0.5 opacity-60">
                      ({activeStagedDocs.filter(d => d.workspace_tag === ws).length})
                    </span>
                  </button>
                );
              })}
              {/* Equipment Lease contract-type filter chip */}
              {hasEquipment && (
                <button
                  onClick={() => {
                    const isActive = contractTypePill === 'Equipment Lease';
                    setContractTypePill(isActive ? '' : 'Equipment Lease');
                    setWorkspacePill('');
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ring-1 transition-all duration-150 ${
                    contractTypePill === 'Equipment Lease'
                      ? 'bg-teal-500/15 text-teal-600 ring-teal-500/40 shadow-sm scale-[1.04] dark:text-teal-400'
                      : 'bg-muted text-muted-foreground ring-border hover:ring-teal-500/40 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    contractTypePill === 'Equipment Lease' ? 'bg-teal-500' : 'bg-muted-foreground'
                  }`} />
                  Equipment
                  <span className="ml-0.5 opacity-60">
                    ({activeStagedDocs.filter(d => d.contract_type === 'Equipment Lease').length})
                  </span>
                </button>
              )}
            </div>
          );
        })()}
        {/* Assignee quick-filter pills */}
        {(() => {
          // Collect distinct assignees present in the current workspace-filtered docs
          const presentAssignees = MOCK_ASSIGNEES.filter(a =>
            activeStagedDocs.some(d => d.assignee_id === a.id &&
              (!workspacePill || d.workspace_tag === workspacePill)
            )
          );
          const hasUnassigned = activeStagedDocs.some(d =>
            !d.assignee_id && (!workspacePill || d.workspace_tag === workspacePill)
          );
          if (presentAssignees.length === 0 && !hasUnassigned) return null;
          return (
            <div className="flex items-center gap-1.5 px-5 py-2 border-b border-border bg-muted/10 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mr-1">Preparer:</span>
              <button
                onClick={() => setAssigneePill('')}
                className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                  assigneePill === ''
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                All
              </button>
              {presentAssignees.map(a => {
                const active = assigneePill === a.id;
                const count = activeStagedDocs.filter(d => d.assignee_id === a.id &&
                  (!workspacePill || d.workspace_tag === workspacePill)).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAssigneePill(active ? '' : a.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold ring-1 transition-all duration-150 ${
                      active
                        ? 'bg-foreground text-background ring-foreground shadow-sm scale-[1.04]'
                        : 'bg-muted text-muted-foreground ring-border hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ background: a.avatarColor ?? '#6366f1' }}
                    >
                      {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                    {a.name}
                    <span className="ml-0.5 opacity-60">({count})</span>
                  </button>
                );
              })}
              {hasUnassigned && (
                <button
                  onClick={() => setAssigneePill(assigneePill === '__unassigned__' ? '' : '__unassigned__')}
                  className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold ring-1 transition-all duration-150 ${
                    assigneePill === '__unassigned__'
                      ? 'bg-foreground text-background ring-foreground shadow-sm scale-[1.04]'
                      : 'bg-muted text-muted-foreground ring-border hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Unassigned
                  <span className="ml-0.5 opacity-60">
                    ({activeStagedDocs.filter(d => !d.assignee_id && (!workspacePill || d.workspace_tag === workspacePill)).length})
                  </span>
                </button>
              )}
            </div>
          );
        })()}
        {/* Active staging view */}

        {activeStagedDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <FileText className="w-7 h-7 text-accent-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground">No documents in pipeline</p>
            <p className="text-[13px] text-muted-foreground">Upload files to begin the intake process.</p>
              <Button size="sm" onClick={() => setShowUpload(true)} className="mt-1 gap-2">
              <UploadCloud className="w-4 h-4" /> Upload Files
            </Button>
          </div>
        ) : (
          <div ref={scrollRef1} className="table-scroll-wrap">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  <th className="w-8 px-3">
                    <button onClick={toggleAll} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left">File Name</th>
                  <th className="text-left hidden lg:table-cell">Type</th>
                  <th className="text-left">Workspace</th>
                  <th className="text-left">Record</th>
                  <th className="text-left hidden xl:table-cell">Assignee</th>
                  <th className="text-left hidden lg:table-cell">Uploaded</th>
                  <th></th>
                </tr>
                {/* Column filters */}
                <tr className="bg-muted/20">
                  <th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.name} onChange={v => setColFilters(f => ({ ...f, name: v }))} placeholder="Filter name…" /></th>
                  <th className="hidden lg:table-cell" />
                  <th className="px-3 py-1"><ColFilter value={colFilters.workspace} onChange={v => setColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter workspace…" /></th>
                  <th /><th className="hidden xl:table-cell" /><th className="hidden lg:table-cell" /><th />
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const isSelected = selectedIds.has(doc.id);
                  const isLocked = doc.locked_for_review === true;
                  return (
                    <tr key={doc.id} className={isLocked ? 'bg-amber-50/40 opacity-80' : isSelected ? 'bg-primary/5' : ''}>
                      <td className="px-3">
                        {isLocked ? (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center justify-center text-amber-500 cursor-not-allowed">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-[12px] max-w-[220px]">
                                <p className="font-semibold mb-0.5">Locked for Review</p>
                                <p>This document is under active Reviewer review. It cannot be edited, reassigned, or re-packaged until the review is complete.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <button onClick={() => toggleOne(doc.id)} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                      {/* Filename */}
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[160px]" title={doc.display_name}>{doc.display_name}</span>
                          <ContractTypeBadge contractType={doc.contract_type} />
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              Under Review
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Type */}
                      <td className="hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                          {getMimeLabel(doc.mime_type)}
                        </span>
                      </td>
                      {/* Workspace */}
                      <td>
                        <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">{doc.workspace_tag}</span>
                      </td>
                      {/* Record — 3-state rendering (committed docs excluded from this table) */}
                      <td>
                        {doc.target_record_id
                          ? (() => {
                              const rec = findContractRecord(doc.target_record_id);
                              return (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  {rec ? `${rec.contractNumber} · ${rec.counterparty}` : doc.target_record_id}
                                </span>
                              );
                            })()
                          : doc.submission_path === 'unknown'
                            ? (
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-help">Awaiting Assignment</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed">
                                    <p className="font-semibold mb-1">Awaiting Assignment</p>
                                    <p>The submitter flagged uncertainty about which Contract Record this document belongs to. A Preparer must review and assign it before it can be packaged.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                            : (
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground/60 italic cursor-help"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />Unassigned</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[260px] text-[12px] leading-relaxed">
                                    <p className="font-semibold mb-1">Unassigned</p>
                                    <p>No target Contract Record was specified at upload. A Preparer can assign this document to an existing record or create a new one before packaging.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                        }
                      </td>
                      {/* Assignee — inline-edit with tooltip */}
                      <td className="hidden xl:table-cell" onClick={e => e.stopPropagation()}>
                        {editingAssigneeDocId === doc.id ? (
                          <Select
                            value={doc.assignee_id ?? '__auto__'}
                            onValueChange={val => {
                              // DEMO ONLY: mutate local state; PRODUCTION: PATCH /api/v1/pipeline/staged/{doc.id}/assignee
                              const newAssignee = val === '__auto__' ? null : val;
                              setStagedDocs(prev => prev.map(d =>
                                d.id === doc.id ? { ...d, assignee_id: newAssignee } : d
                              ));
                              setEditingAssigneeDocId(null);
                              const name = newAssignee ? (MOCK_ASSIGNEES.find(a => a.id === newAssignee)?.name ?? 'assignee') : 'Auto-routed';
                              toast.success(`Assignee updated to ${name}`);
                            }}
                            onOpenChange={open => { if (!open) setEditingAssigneeDocId(null); }}
                            open
                          >
                            <SelectTrigger className="h-7 text-[11px] w-[160px]">
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__auto__">
                                <span className="italic text-muted-foreground">Auto-routed</span>
                              </SelectItem>
                              {MOCK_ASSIGNEES.map(a => (
                                <SelectItem key={a.id} value={a.id}>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0"
                                      style={{ background: a.avatarColor ?? '#6366f1' }}
                                    >
                                      {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </span>
                                    <span>{a.name}</span>
                                    <span className="text-muted-foreground text-[10px] ml-auto">{a.role}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          (() => {
                            const assignee = doc.assignee_id
                              ? MOCK_ASSIGNEES.find(a => a.id === doc.assignee_id)
                              : null;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted transition-colors"
                                    onClick={e => { e.stopPropagation(); if (!isReadOnly && !isLocked) setEditingAssigneeDocId(doc.id); }}
                                    title={isLocked ? 'Locked for review — reassignment not available' : isReadOnly ? undefined : 'Click to reassign'}
                                  >
                                    {assignee ? (
                                      <>
                                        <span
                                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0"
                                          style={{ background: assignee.avatarColor ?? '#6366f1' }}
                                        >
                                          {assignee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </span>
                                        <span className="text-[12px] text-foreground truncate max-w-[90px]">{assignee.name}</span>
                                      </>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground italic">Auto-routed</span>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-left">
                                  {assignee ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold">{assignee.name}</span>
                                      <span className="text-[11px] opacity-80">{assignee.email ?? '—'}</span>
                                      <span className="text-[10px] opacity-60">{assignee.role}</span>
                                      {!isReadOnly && <span className="text-[10px] opacity-50 mt-0.5">Click to reassign</span>}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold">Auto-routed</span>
                                      {!isReadOnly && <span className="text-[10px] opacity-60">Click to assign manually</span>}
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()
                        )}
                      </td>
                      {/* Uploaded */}
                      <td className="hidden lg:table-cell font-mono text-[12px] text-muted-foreground">{doc.upload_date}</td>
                      {/* Actions — V3 context-sensitive */}
                      <td>
                        <div className="flex items-center gap-1">
                          {/* Eye icon — always shown */}
                          <button
                            onClick={() => setDetailDoc(doc)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="View document details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Trash — shown for all non-committed docs, hidden when locked */}
                          {doc.document_job_status !== 'committed' && !isReadOnly && !isLocked && (
                            <button
                              onClick={() => setStagedDocs(prev => prev.filter(d => d.id !== doc.id))}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Unlock (Demo) — visible only on locked docs for demo purposes */}
                          {isLocked && (
                            <button
                              onClick={() => {
                                setStagedDocs(prev => prev.map(d =>
                                  d.id === doc.id ? { ...d, locked_for_review: false } : d
                                ));
                                toast.success('Document unlocked for demo', {
                                  description: `${doc.display_name} is now editable.`,
                                });
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                              title="Unlock for demo — removes review lock"
                            >
                              Unlock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDocs.length === 0 && (
              <div className="py-10 text-center text-[13px] text-muted-foreground">No documents match the current filter.</div>
            )}
          </div>
        )}

        {activeStagedDocs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
            <p className="text-[12px] text-muted-foreground">
              Showing {filteredDocs.length} of {activeStagedDocs.length} documents
              {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
            </p>
            <div className="flex items-center gap-2">
            {/* Bulk Reassign Selected */}
            {selectedIds.size > 0 && !isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-[13px]"
                onClick={() => {
                  setBulkReassignTargetId('');
                  setBulkReassignOpen(true);
                }}
              >
                <UserCog className="w-3.5 h-3.5" />
                Reassign Selected ({selectedIds.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const selected = stagedDocs.filter(d => selectedIds.has(d.id));
                // Enforce same-assignee rule: all selected files must share the same assignee
                // (null/undefined counts as a distinct value — 'auto-routed' is a valid common value)
                const assigneeIds = Array.from(new Set(selected.map(d => d.assignee_id ?? null)));
                if (assigneeIds.length > 1) {
                  const names = assigneeIds.map(id =>
                    id ? (MOCK_ASSIGNEES.find(a => a.id === id)?.name ?? id) : 'Auto-routed'
                  ).join(', ');
                  toast.error('Mixed assignees — cannot package together', {
                    description: `Selected files have different assignees: ${names}. Reassign to a single preparer before packaging.`,
                    duration: 6000,
                  });
                  return;
                }
                // Pass full document objects so Review & Group can build ReviewFile
                // records from real data instead of filtering its own MOCK_FILES.
                // navToken lets Review & Group detect a fresh selection and discard
                // any stale sessionStorage session.
                //
                // IMPORTANT: wouter's navigate(to, { state }) calls pushState once.
                // Do NOT call window.history.pushState separately before navigate —
                // wouter's own pushState call would overwrite the state we set.
                navigate('/pipeline/review', {
                  state: {
                    selectedDocs: selected,
                    navToken: Date.now(),
                  },
                } as any);
              }}
              className="gap-1.5 text-[13px]"
              title={selectedIds.size === 0 ? 'Select files first to review & group' : undefined}
            >
              Review &amp; Group{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            </div>{/* end flex gap-2 */}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE 2 — Contract Packages
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Contract Packages</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Group staged documents into packages, then submit for processing.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status filter toggle */}
            <div className="flex items-center rounded-md border border-border overflow-hidden text-[12px] font-medium">
              {(['all', 'Ready', 'Incomplete'] as const).map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => setPkgStatusFilter(opt)}
                  className={`px-3 py-1 transition-colors ${
                    pkgStatusFilter === opt
                      ? opt === 'Ready'
                        ? 'bg-emerald-600 text-white'
                        : opt === 'Incomplete'
                          ? 'bg-amber-500 text-white'
                          : 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  } ${i > 0 ? 'border-l border-border' : ''}`}
                >
                  {opt === 'all' ? 'All' : opt}
                </button>
              ))}
            </div>
            {/* Submit All Ready */}
            {!isReadOnly && contractPackages.some(p => isPackageReady(p)) && (
              <button
                onClick={() => setConfirmSubmitAll(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-3 h-3" />
                Submit All Ready ({contractPackages.filter(p => isPackageReady(p)).length})
              </button>
            )}
            <span className="text-[12px] text-muted-foreground">{filteredPkgs.length}{filteredPkgs.length !== contractPackages.length ? ` / ${contractPackages.length}` : ''} package{contractPackages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {contractPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Package className="w-6 h-6 text-accent-foreground" />
            </div>
            <p className="text-[14px] font-medium text-foreground">No packages yet</p>
            <p className="text-[12px] text-muted-foreground">Group documents from the Stage Documents table to create a package.</p>
          </div>
        ) : (
          <div ref={scrollRef2} className="table-scroll-wrap">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  {([
                    { col: null,         label: '',              hide: false }, // expand chevron
                    { col: null,         label: 'Batch ID',      hide: false },
                    { col: 'packageNum', label: 'Package ID',    hide: false },
                    { col: 'files',      label: 'Docs',          hide: true  },
                    { col: null,         label: 'Target Record', hide: false },
                    { col: 'workspace',  label: 'Workspace',     hide: true  },
                    { col: null,         label: 'Assignee',      hide: true  },
                    { col: null,         label: 'Roles',         hide: true  },
                    { col: 'status',     label: 'Status',        hide: false },
                    { col: null,         label: 'Actions',       hide: false },
                  ] as { col: string | null; label: string; hide: boolean }[]).map(({ col, label, hide }, i) => (
                    <th key={i} className={`text-left${hide ? ' hidden lg:table-cell' : ''}`}>
                      {col ? (
                        <button
                          onClick={() => togglePkgSort(col)}
                          className="flex items-center gap-1 group hover:text-foreground transition-colors"
                        >
                          {label}
                          <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                            {pkgSort?.col === col
                              ? pkgSort.dir === 'asc'
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                              : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                          </span>
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <th />
                  <th />
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.packageNum} onChange={v => setPkgColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th className="hidden lg:table-cell" /><th /><th className="hidden lg:table-cell px-3 py-1"><ColFilter value={pkgColFilters.workspace} onChange={v => setPkgColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter…" /></th><th className="hidden lg:table-cell" /><th className="hidden lg:table-cell" /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredPkgs.map(pkg => {
                  const ready = isPackageReady(pkg);
                  const assignedRoles = pkg.files.filter(f => f.role !== 'Undefined');
                  const rolesComplete = assignedRoles.length === pkg.files.length;
                  const targetRec = findContractRecord(
                    pkg.files[0]?.docId
                      ? (stagedDocs.find(d => d.id === pkg.files[0].docId)?.target_record_id ?? null)
                      : null
                  );
                  const pkgExpanded = expandedPkgs.has(pkg.id);
                  // Derive a preview Batch ID (becomes real batchRef when submitted)
                  const pkgBatchId = `BATCH-${pkg.id.slice(-6).toUpperCase()}`;
                  const TOTAL_PKG_COLS = 10;
                  return (
                    <React.Fragment key={pkg.id}>
                      <tr
                        className={`cursor-pointer hover:bg-muted/30 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40 focus:ring-inset ${
                          pkgExpanded ? 'bg-muted/20' : ''
                        }`}
                        onClick={() => toggleExpand(expandedPkgs, setExpandedPkgs, pkg.id)}
                      >
                        {/* Expand chevron */}
                        <td className="w-8 pr-0">
                          <span className="text-muted-foreground transition-transform duration-150 inline-block" style={{ transform: pkgExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                        {/* Batch ID */}
                        <td className="font-mono text-[12px] text-muted-foreground">{pkgBatchId}</td>
                        {/* Package ID */}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col">
                            <button className="font-mono text-[12px] text-primary hover:underline text-left" onClick={() => navigate(`/packages/${pkg.packageNum}`)}>{pkg.packageNum}</button>
                            {pkg.packageName && <span className="text-[11px] text-muted-foreground">{pkg.packageName}</span>}
                          </div>
                        </td>
                        {/* Docs count */}
                        <td className="hidden lg:table-cell text-muted-foreground">{pkg.files.length}</td>
                        {/* Target Record */}
                        <td onClick={e => e.stopPropagation()}>
                          {targetRec ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {targetRec.contractNumber} · {targetRec.counterparty}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-600">
                              <AlertTriangle className="w-3 h-3" /> No record assigned
                            </span>
                          )}
                        </td>
                        {/* Workspace */}
                        <td className="hidden lg:table-cell">
                          <WorkspaceBadge name={pkg.workspace} size="xs" />
                        </td>
                        {/* Assignee */}
                        <td className="hidden lg:table-cell">
                          {(() => {
                            const a = pkg.assignee_id ? MOCK_ASSIGNEES.find(x => x.id === pkg.assignee_id) : null;
                            return a ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 cursor-default">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0" style={{ background: a.avatarColor ?? '#6366f1' }}>
                                      {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </span>
                                    <span className="text-[12px] text-foreground truncate max-w-[90px]">{a.name}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-left">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold">{a.name}</span>
                                    <span className="text-[11px] opacity-80">{a.email ?? '—'}</span>
                                    <span className="text-[10px] opacity-60">{a.role}</span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Auto-routed</span>
                            );
                          })()}
                        </td>
                        {/* Role completeness badge */}
                        <td className="hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            rolesComplete
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {assignedRoles.length}/{pkg.files.length} roles
                          </span>
                        </td>
                        {/* Status */}
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            pkg.status === 'Ready'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {pkg.status === 'Ready' ? 'Validated' : 'Assembly'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDetailPkg(pkg)}
                              className="px-2.5 py-1 rounded text-[11px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                            >
                              Open
                            </button>
                            {!isReadOnly && (
                              <>
                              <button
                                onClick={() => { setReassignPkgId(pkg.id); setReassignPkgTargetId(pkg.assignee_id ?? ''); }}
                                className="px-2.5 py-1 rounded text-[11px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1"
                                title="Reassign to a different preparer"
                              >
                                <UserCog className="w-3 h-3" /> Reassign
                              </button>
                              <button
                                onClick={() => submitPackage(pkg)}
                                disabled={!ready}
                                title={!ready ? 'Assign roles to all files before submitting' : undefined}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                  ready
                                    ? 'bg-[#1F3864] text-white hover:bg-[#162d54] cursor-pointer'
                                    : 'bg-[#9CA3AF] text-white cursor-not-allowed'
                                }`}
                              >
                                Submit for Extraction
                              </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded file list */}
                      {pkgExpanded && (
                        <tr key={`${pkg.id}-expanded`} className="bg-muted/10">
                          <td colSpan={TOTAL_PKG_COLS} className="px-0 py-0">
                            <div className="pl-10 pr-4 py-2 border-t border-border/40">
                              <table className="w-full text-[12px]">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="text-left font-medium pb-1.5 pr-4">File Name</th>
                                    <th className="text-left font-medium pb-1.5 pr-4">Type</th>
                                    <th className="text-left font-medium pb-1.5">Role</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pkg.files.map(f => (
                                    <tr key={f.docId} className="border-t border-border/30">
                                      <td className="py-1.5 pr-4">
                                        <div className="flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                          <span className="font-medium text-foreground truncate max-w-[180px]" title={f.name}>{f.name}</span>
                                          <ContractTypeBadge contractType={f.contract_type} />
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                          {f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif') ? 'TIFF' : 'PDF'}
                                        </span>
                                      </td>
                                      <td className="py-1.5">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                          f.role === 'Undefined'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>{f.role}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredPkgs.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">No packages match the current filter.</div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE 3 — Submissions
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Submissions</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Packages submitted for processing. Use the eye icon to view details or unsubmit.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Submission status filter */}
            <div className="flex items-center rounded-md border border-border overflow-hidden text-[12px] font-medium">
              {(['all', 'Pending', 'In Progress', 'Completed', 'Failed', 'Declined'] as const).map((opt, i) => {
                const activeStyle = opt === 'Pending' ? 'bg-slate-600 text-white'
                  : opt === 'In Progress' ? 'bg-blue-600 text-white'
                  : opt === 'Completed' ? 'bg-emerald-600 text-white'
                  : opt === 'Failed' ? 'bg-red-600 text-white'
                  : opt === 'Declined' ? 'bg-orange-600 text-white'
                  : 'bg-primary text-primary-foreground';
                return (
                  <button
                    key={opt}
                    onClick={() => setSubStatusFilter(opt)}
                    className={`px-3 py-1 transition-colors ${
                      subStatusFilter === opt
                        ? activeStyle
                        : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    } ${i > 0 ? 'border-l border-border' : ''}`}
                  >
                    {opt === 'all' ? 'All' : opt}
                  </button>
                );
              })}
            </div>
            <span className="text-[12px] text-muted-foreground">{filteredSubs.length}{filteredSubs.length !== submissions.length ? ` / ${submissions.length}` : ''} submission{submissions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Send className="w-6 h-6 text-accent-foreground" />
            </div>
            <p className="text-[14px] font-medium text-foreground">No submissions yet</p>
            <p className="text-[12px] text-muted-foreground">Submit a ready package to begin processing.</p>
          </div>
        ) : (
          <div ref={scrollRef3} className="table-scroll-wrap">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  {([
                    { col: null,          label: '',              hide: false }, // expand chevron
                    { col: null,          label: 'Batch ID',      hide: false },
                    { col: 'packageNum',  label: 'Package',       hide: false },
                    { col: null,          label: 'Target Record', hide: false },
                    { col: 'workspace',   label: 'Workspace',     hide: true  },
                    { col: null,          label: 'Assignee',      hide: true  },
                    { col: 'files',       label: 'Files',         hide: true  },
                    { col: 'submitDate',  label: 'Submitted At',  hide: true  },
                    { col: 'status',      label: 'Status',        hide: false },
                    { col: null,          label: 'Actions',       hide: false },
                  ] as { col: string | null; label: string; hide: boolean }[]).map(({ col, label, hide }, i) => (
                    <th key={i} className={`text-left${hide ? ' hidden lg:table-cell' : ''}`}>
                      {col ? (
                        <button
                          onClick={() => toggleSubSort(col)}
                          className="flex items-center gap-1 group hover:text-foreground transition-colors"
                        >
                          {label}
                          <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                            {subSort?.col === col
                              ? subSort.dir === 'asc'
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />
                              : <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                          </span>
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
                <tr className="bg-muted/20">
                  <th />
                  <th />
                  <th className="px-3 py-1"><ColFilter value={subColFilters.packageNum} onChange={v => setSubColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th /><th className="hidden lg:table-cell px-3 py-1"><ColFilter value={subColFilters.workspace} onChange={v => setSubColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter…" /></th><th className="hidden lg:table-cell" /><th className="hidden lg:table-cell" /><th className="hidden lg:table-cell" /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(sub => {
                  const batchId = sub.batchRef ?? (sub.id.startsWith('sub-v3') ? 'BATCH-2026-0041' : `BATCH-${sub.id.slice(-6).toUpperCase()}`);
                  const subExpanded = expandedSubs.has(sub.id);
                  const TOTAL_SUB_COLS = 10;
                  const subTargetRec = findContractRecord(
                    sub.files[0]?.docId
                      ? (stagedDocs.find(d => d.id === sub.files[0].docId)?.target_record_id ?? null)
                      : null
                  );
                  return (
                  <React.Fragment key={sub.id}>
                    <tr
                      className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                        sub.status === 'In Progress' ? 'bg-amber-50/30' : subExpanded ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => toggleExpand(expandedSubs, setExpandedSubs, sub.id)}
                    >
                      {/* Expand chevron */}
                      <td className="w-8 pr-0">
                        <span className="text-muted-foreground transition-transform duration-150 inline-block" style={{ transform: subExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                      {/* Batch ID */}
                      <td className="font-mono text-[12px] text-primary">{batchId}</td>
                      {/* Package */}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col">
                          <span className="font-mono text-[12px] text-primary">{sub.packageNum}</span>
                          {sub.packageName && <span className="text-[11px] text-muted-foreground">{sub.packageName}</span>}
                        </div>
                      </td>
                      {/* Target Record */}
                      <td onClick={e => e.stopPropagation()}>
                        {subTargetRec ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {subTargetRec.contractNumber} · {subTargetRec.counterparty}
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/60 italic">Unassigned</span>
                        )}
                      </td>
                      {/* Workspace */}
                      <td className="hidden lg:table-cell">
                        <WorkspaceBadge name={sub.workspace} size="xs" />
                      </td>
                      {/* Assignee */}
                      <td className="hidden lg:table-cell">
                        {(() => {
                          const a = sub.assignee_id ? MOCK_ASSIGNEES.find(x => x.id === sub.assignee_id) : null;
                          return a ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-default">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0" style={{ background: a.avatarColor ?? '#6366f1' }}>
                                    {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </span>
                                  <span className="text-[12px] text-foreground truncate max-w-[90px]">{a.name}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-left">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold">{a.name}</span>
                                  <span className="text-[11px] opacity-80">{a.email ?? '—'}</span>
                                  <span className="text-[10px] opacity-60">{a.role}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Auto-routed</span>
                          );
                        })()}
                      </td>
                      {/* Files */}
                      <td className="hidden lg:table-cell text-muted-foreground">{sub.fileCount}</td>
                      {/* Submitted At */}
                      <td className="hidden lg:table-cell text-muted-foreground text-[12px]">{formatDate(sub.submitDate)}</td>
                      {/* Status */}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              sub.status === 'Declined' && sub.declineSource === 'approver'
                                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                : SUB_STATUS_BADGE[sub.status]
                            }`}>
                              {sub.status === 'In Progress' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              )}
                              {sub.status === 'Declined' && sub.declineSource === 'approver'
                                ? 'Rework Required'
                                : sub.status}
                            </span>
                            {sub.status === 'In Progress' && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 cursor-help">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                      Under Review
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[12px] max-w-[220px]">
                                    <p className="font-semibold mb-0.5">Locked for Review</p>
                                    <p>This submission is currently under active Reviewer review. Documents in this package cannot be edited or re-packaged until the review is complete.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {sub.isResubmit && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-violet-300 bg-violet-50 text-violet-700"
                                title={sub.correctionNote ? `Correction note: ${sub.correctionNote}` : 'This package was previously declined and resubmitted'}
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                {sub.attemptNumber ? `Attempt ${sub.attemptNumber}` : 'Resubmitted'}
                              </span>
                            )}
                          </div>
                          {sub.status === 'Declined' && sub.declineReasonLabel && (
                            <span className="text-[11px] text-orange-600 leading-tight">{sub.declineReasonLabel}</span>
                          )}
                          {sub.correctionNote && (
                            <span className="text-[11px] text-muted-foreground italic leading-tight max-w-[200px] truncate" title={sub.correctionNote}>
                              "{sub.correctionNote}"
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Actions */}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailSub(sub)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="View submission details"
                            title="View submission details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {sub.status === 'Pending' && !isReadOnly && (
                            <button
                              onClick={() => unsubmitPackage(sub)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                              title="Unsubmit this package"
                            >
                              Unsubmit
                            </button>
                          )}
                          {sub.status === 'Declined' && !isReadOnly && (
                            <button
                              onClick={() => setResubmitTarget(sub)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                              title="Restore package to Contract Packages for resubmission"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded file list */}
                    {subExpanded && (
                      <tr key={`${sub.id}-expanded`} className="bg-muted/10">
                        <td colSpan={TOTAL_SUB_COLS} className="px-0 py-0">
                          <div className="pl-10 pr-4 py-2 border-t border-border/40">
                            {/* Decline reason header — only shown when submission is Declined */}
                            {sub.status === 'Declined' && sub.declineReason && (
                              <div className="mb-2 rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 px-3 py-2">
                                <p className="text-[11px] font-semibold text-orange-800 dark:text-orange-300 mb-0.5">
                                  {sub.declineReasonLabel ?? 'Declined'}
                                </p>
                                <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-relaxed">{sub.declineReason}</p>
                              </div>
                            )}
                            <table className="w-full text-[12px]">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left font-medium pb-1.5 pr-4">File Name</th>
                                  <th className="text-left font-medium pb-1.5 pr-4">Type</th>
                                  <th className="text-left font-medium pb-1.5">Role</th>
                                  {sub.status === 'Declined' && sub.declineFileReasons && sub.declineFileReasons.length > 0 && (
                                    <th className="text-left font-medium pb-1.5 pl-4">Decline Reason</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {sub.files.map(f => {
                                  const fileReason = sub.declineFileReasons?.find(r => r.fileName === f.name);
                                  return (
                                    <tr key={f.docId} className="border-t border-border/30">
                                      <td className="py-1.5 pr-4">
                                        <div className="flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                          <span className="font-medium text-foreground truncate max-w-[220px]" title={f.name}>{f.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                          {f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif') ? 'TIFF' : 'PDF'}
                                        </span>
                                      </td>
                                      <td className="py-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">{f.role}</span>
                                      </td>
                                      {sub.status === 'Declined' && sub.declineFileReasons && sub.declineFileReasons.length > 0 && (
                                        <td className="py-1.5 pl-4">
                                          {fileReason ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-orange-700 dark:text-orange-400">
                                              <AlertTriangle className="w-3 h-3 shrink-0" />
                                              {fileReason.reason}
                                            </span>
                                          ) : (
                                            <span className="text-[11px] text-muted-foreground">—</span>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredSubs.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">No submissions match the current filter.</div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE 4 — Committed Documents (read-only audit)
      ══════════════════════════════════════════════════════════════════════ */}
      {(() => {
        const committedDocs = stagedDocs.filter(d => d.document_job_status === 'committed');
        // Group committed docs by target_record_id — each group becomes one expandable row
        const committedGroups = Array.from(
          committedDocs.reduce((map, doc) => {
            const key = doc.target_record_id ?? '__unassigned__';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(doc);
            return map;
          }, new Map<string, typeof committedDocs>())
        ).map(([key, docs]) => ({
          key,
          docs,
          rec: findContractRecord(key === '__unassigned__' ? null : key),
          // Derive a Batch ID from the group key for display
          batchId: `BATCH-${key.slice(-6).toUpperCase()}`,
        }));
        const TOTAL_COMMITTED_COLS = 7;
        return (
          <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-semibold text-foreground">Committed Documents</h2>
                  <span className="px-1.5 py-0 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{committedDocs.length}</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">Documents fully processed through the extraction pipeline. Data has been written to their Contract Records.</p>
              </div>
            </div>
            {/* Table */}
            {committedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Archive className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground">No committed documents yet.</p>
              </div>
            ) : (
              <div ref={scrollRef4} className="table-scroll-wrap">
                <table className="data-table w-full text-[13px]">
                  <thead>
                    <tr>
                      <th className="text-left w-8"></th>{/* expand chevron */}
                      <th className="text-left">Batch ID</th>
                      <th className="text-left">Contract Record</th>
                      <th className="text-left">Workspace</th>
                      <th className="text-left">Files</th>
                      <th className="text-left">Committed</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {committedGroups.map(group => {
                      const groupExpanded = expandedCommitted.has(group.key);
                      return (
                        <React.Fragment key={group.key}>
                          <tr
                            className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                              groupExpanded ? 'bg-muted/20' : ''
                            }`}
                            onClick={() => toggleExpand(expandedCommitted, setExpandedCommitted, group.key)}
                          >
                            {/* Expand chevron */}
                            <td className="w-8 pr-0">
                              <span className="text-muted-foreground transition-transform duration-150 inline-block" style={{ transform: groupExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </td>
                            {/* Batch ID */}
                            <td className="font-mono text-[12px] text-muted-foreground">{group.batchId}</td>
                            {/* Contract Record */}
                            <td>
                              {group.rec ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {group.rec.contractNumber} · {group.rec.counterparty}
                                </span>
                              ) : (
                                <span className="text-[12px] text-muted-foreground italic">{group.key === '__unassigned__' ? 'Unassigned' : group.key}</span>
                              )}
                            </td>
                            {/* Workspace */}
                            <td>
                              <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">
                                {group.docs[0]?.workspace_tag ?? '—'}
                              </span>
                            </td>
                            {/* File count */}
                            <td className="text-muted-foreground">{group.docs.length} file{group.docs.length !== 1 ? 's' : ''}</td>
                            {/* Latest committed date */}
                            <td className="font-mono text-[12px] text-muted-foreground">
                              {group.docs.reduce((latest, d) => d.upload_date > latest ? d.upload_date : latest, '')}
                            </td>
                            {/* Actions */}
                            <td onClick={e => e.stopPropagation()}>
                              {group.rec && (
                                <a
                                  href={`/contracts/${group.key}`}
                                  className="p-1 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title={`View in Contract Record ${group.rec.contractNumber}`}
                                  onClick={e => { e.preventDefault(); toast.info(`Navigating to Contract Record ${group.rec!.contractNumber}`, { description: 'Contract Records viewer coming soon.' }); }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </td>
                          </tr>
                          {/* Expanded file list */}
                          {groupExpanded && (
                            <tr key={`${group.key}-expanded`} className="bg-muted/10">
                              <td colSpan={TOTAL_COMMITTED_COLS} className="px-0 py-0">
                                <div className="pl-10 pr-4 py-2 border-t border-border/40">
                                  <table className="w-full text-[12px]">
                                    <thead>
                                      <tr className="text-muted-foreground">
                                        <th className="text-left font-medium pb-1.5 pr-4">File Name</th>
                                        <th className="text-left font-medium pb-1.5 pr-4">Type</th>
                                        <th className="text-left font-medium pb-1.5 pr-4">Assignee</th>
                                        <th className="text-left font-medium pb-1.5 pr-4">Uploader</th>
                                        <th className="text-left font-medium pb-1.5">Committed</th>
                                        <th className="pb-1.5"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.docs.map(doc => (
                                        <tr key={doc.id} className="border-t border-border/30">
                                          <td className="py-1.5 pr-4">
                                            <div className="flex items-center gap-1.5">
                                              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                              <span className="font-medium text-foreground truncate max-w-[220px]" title={doc.display_name}>{doc.display_name}</span>
                                            </div>
                                          </td>
                                          <td className="py-1.5 pr-4">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                              {getMimeLabel(doc.mime_type)}
                                            </span>
                                          </td>
                                          <td className="py-1.5 pr-4">
                                            {(() => {
                                              const a = doc.assignee_id ? MOCK_ASSIGNEES.find(x => x.id === doc.assignee_id) : null;
                                              return a ? (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-default">
                                                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0" style={{ background: a.avatarColor ?? '#6366f1' }}>
                                                        {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                      </span>
                                                      <span className="text-[11px] text-foreground">{a.name}</span>
                                                    </div>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="text-left">
                                                    <div className="flex flex-col gap-0.5">
                                                      <span className="font-semibold">{a.name}</span>
                                                      <span className="text-[11px] opacity-80">{a.email ?? '—'}</span>
                                                    </div>
                                                  </TooltipContent>
                                                </Tooltip>
                                              ) : (
                                                <span className="text-[11px] text-muted-foreground italic">Auto-routed</span>
                                              );
                                            })()}
                                          </td>
                                          <td className="py-1.5 pr-4 text-muted-foreground">{doc.uploader}</td>
                                          <td className="py-1.5 font-mono text-muted-foreground">{doc.upload_date}</td>
                                          <td className="py-1.5">
                                            <button
                                              onClick={() => setDetailDoc(doc as DocForPanel)}
                                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                              title="View document details"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-border bg-muted/30">
                  <p className="text-[12px] text-muted-foreground">{committedDocs.length} committed document{committedDocs.length !== 1 ? 's' : ''} in {committedGroups.length} batch{committedGroups.length !== 1 ? 'es' : ''} — read-only audit view</p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Panels & dialogs ── */}
      {detailDoc && (
        <DocumentIntelligencePanel
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onPackage={(doc) => {
            // Open grouping dialog for this single doc
            setGroupingDocs([stagedDocs.find(d => d.id === doc.id)!].filter(Boolean));
          }}
          onRemove={(doc) => {
            setStagedDocs(prev => prev.filter(d => d.id !== doc.id));
            toast.success('Document removed');
          }}
          onRetry={(doc) => {
            setStagedDocs(prev => prev.map(d =>
              d.id === doc.id ? { ...d, status: 'validating' as const } : d
            ));
            toast.info('Revalidation queued');
          }}
          onAssignRecord={(doc, recordId) => {
            setStagedDocs(prev => prev.map(d =>
              d.id === doc.id
                ? { ...d, target_record_id: recordId, submission_path: 'existing_record' as const }
                : d
            ));
            const rec = findContractRecord(recordId);
            toast.success(`Assigned to ${rec ? `${rec.contractNumber} · ${rec.counterparty}` : recordId}`);
          }}
        />
      )}
      {detailBatch && <BatchDetailPanel batch={detailBatch} onClose={() => setDetailBatch(null)} />}
      {detailPkg && (
        <PackageDetailPanel
          pkg={detailPkg}
          isReadOnly={isReadOnly}
          onClose={() => setDetailPkg(null)}
          onSaveRoles={(pkgId, updatedFiles) => {
            setContractPackages(prev => prev.map(p =>
              p.id === pkgId
                ? { ...p, files: updatedFiles, status: updatedFiles.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending' }
                : p
            ));
            // Keep detailPkg in sync with updated files
            setDetailPkg(prev => prev ? { ...prev, files: updatedFiles, status: updatedFiles.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending' } : null);
          }}
          onSubmit={(pkg) => submitPackage(pkg)}
          onUngroup={(pkg) => ungroupPackage(pkg)}
          onRemoveFile={(pkgId, docId) => removeFileFromPackage(pkgId, docId)}
          onRename={(pkgId, newName) => {
            setContractPackages(prev => prev.map(p => p.id === pkgId ? { ...p, packageName: newName || undefined } : p));
            setDetailPkg(prev => prev ? { ...prev, packageName: newName || undefined } : null);
            toast.success('Package name updated');
          }}
        />
      )}
      {detailSub && (
        <SubmissionDetailPanel
          submission={detailSub}
          isReadOnly={isReadOnly}
          onClose={() => setDetailSub(null)}
          onUnsubmit={unsubmitPackage}
        />
      )}
      {/* Confirm Submit All Ready dialog */}
      {confirmSubmitAll && (() => {
        const readyPkgs = contractPackages.filter(p => isPackageReady(p));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmSubmitAll(false)} />
            <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">Submit {readyPkgs.length} Ready Package{readyPkgs.length !== 1 ? 's' : ''}?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">This action cannot be undone without unsubmitting each package individually.</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border mb-5 max-h-48 overflow-y-auto">
                {readyPkgs.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2">
                    <span className="font-mono text-[12px] text-primary">{p.packageNum}</span>
                    <span className="text-[12px] text-muted-foreground truncate max-w-[180px]">{p.packageName ?? '—'}</span>
                    <span className="text-[11px] text-muted-foreground">{p.files.length} file{p.files.length !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmSubmitAll(false)}
                  className="px-4 py-1.5 rounded text-[13px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    readyPkgs.forEach(p => submitPackage(p));
                    setConfirmSubmitAll(false);
                  }}
                  className="px-4 py-1.5 rounded text-[13px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Submit All
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {groupingDocs && (
        <GroupingDialog
          docs={groupingDocs}
          onConfirm={confirmGrouping}
          onCancel={() => setGroupingDocs(null)}
        />
      )}

      {/* ── Bulk Reassign Selected (Stage Documents) ─────────────────────── */}
      <Dialog open={bulkReassignOpen} onOpenChange={open => { if (!open) setBulkReassignOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reassign {selectedIds.size} File{selectedIds.size !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Select a new preparer for all {selectedIds.size} selected file{selectedIds.size !== 1 ? 's' : ''}.
              This will overwrite any existing assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-[12px] font-semibold text-foreground block mb-1.5">New Preparer</label>
            <Select value={bulkReassignTargetId} onValueChange={setBulkReassignTargetId}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select a preparer…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ASSIGNEES.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: a.avatarColor ?? '#6366f1' }}>
                        {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                      <span>{a.name}</span>
                      <span className="text-[11px] text-muted-foreground">· {a.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkReassignOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!bulkReassignTargetId}
              onClick={() => {
                if (!bulkReassignTargetId) return;
                const newAssignee = MOCK_ASSIGNEES.find(a => a.id === bulkReassignTargetId);
                const count = selectedIds.size;
                setStagedDocs(prev => prev.map(d =>
                  selectedIds.has(d.id) ? { ...d, assignee_id: bulkReassignTargetId } : d
                ));
                setSelectedIds(new Set());
                setBulkReassignOpen(false);
                setBulkReassignTargetId('');
                toast.success(`${count} file${count !== 1 ? 's' : ''} reassigned to ${newAssignee?.name ?? 'new preparer'}`, {
                  description: 'Assignee updated. Files can now be packaged together.',
                  duration: 4000,
                });
              }}
            >
              <UserCog className="w-3.5 h-3.5 mr-1.5" />
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reassign Package (Contract Packages) ─────────────────────────── */}
      {(() => {
        const pkg = reassignPkgId ? contractPackages.find(p => p.id === reassignPkgId) : null;
        if (!pkg) return null;
        return (
          <Dialog open={!!reassignPkgId} onOpenChange={open => { if (!open) { setReassignPkgId(null); setReassignPkgTargetId(''); } }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Reassign Package</DialogTitle>
                <DialogDescription>
                  Reassign <strong>{pkg.packageNum}</strong> to a different preparer.
                  The current assignee will be notified.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <label className="text-[12px] font-semibold text-foreground block mb-1.5">New Preparer</label>
                <Select value={reassignPkgTargetId} onValueChange={setReassignPkgTargetId}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select a preparer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_ASSIGNEES.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: a.avatarColor ?? '#6366f1' }}>
                            {a.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </span>
                          <span>{a.name}</span>
                          <span className="text-[11px] text-muted-foreground">· {a.role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setReassignPkgId(null); setReassignPkgTargetId(''); }}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!reassignPkgTargetId}
                  onClick={() => {
                    if (!reassignPkgTargetId || !reassignPkgId) return;
                    const prevAssignee = pkg.assignee_id ? MOCK_ASSIGNEES.find(a => a.id === pkg.assignee_id) : null;
                    const newAssignee = MOCK_ASSIGNEES.find(a => a.id === reassignPkgTargetId);
                    setContractPackages(prev => prev.map(p =>
                      p.id === reassignPkgId ? { ...p, assignee_id: reassignPkgTargetId } : p
                    ));
                    // Notify original assignee
                    if (prevAssignee) {
                      addNotification({
                        title: `${pkg.packageNum} reassigned`,
                        body: `Package reassigned from ${prevAssignee.name} to ${newAssignee?.name ?? 'another preparer'}.`,
                        severity: 'info',
                        href: '/pipeline/dashboard',
                      });
                    }
                    // Notify document submitter
                    addNotification({
                      title: `${pkg.packageNum} preparer changed`,
                      body: `Your package is now assigned to ${newAssignee?.name ?? 'a new preparer'}.`,
                      severity: 'info',
                      href: '/pipeline/dashboard',
                    });
                    toast.success(`${pkg.packageNum} reassigned to ${newAssignee?.name ?? 'new preparer'}`, {
                      description: prevAssignee ? `Previous assignee ${prevAssignee.name} has been notified.` : undefined,
                      duration: 5000,
                    });
                    setReassignPkgId(null);
                    setReassignPkgTargetId('');
                  }}
                >
                  <UserCog className="w-3.5 h-3.5 mr-1.5" />
                  Confirm Reassignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
      {/* Upload dialog — initialRecord pre-populated when navigating from PackagesComposition */}
      <UploadDialog
        open={showUpload}
        onClose={() => { setShowUpload(false); setAddDocumentIntent(null); }}
        onConfirm={handleUploadConfirm}
        initialRecord={addDocumentIntent ? (() => {
          const rec = findContractRecord(addDocumentIntent.recordId);
          return rec ?? null;
        })() : null}
      />

      {addToPackageDocs && (
        <AddToPackageDialog
          docs={addToPackageDocs}
          packages={contractPackages}
          onConfirm={(targetPkgId) => {
            const targetPkg = contractPackages.find(p => p.id === targetPkgId);
            if (!targetPkg || !addToPackageDocs) return;
            const newFiles: PackageFile[] = addToPackageDocs.map(d => ({
              docId: d.id,
              name: d.display_name,
              role: 'Undefined' as DocumentRole,
            }));
            const updatedFiles = [...targetPkg.files, ...newFiles];
            const updatedPkg: ContractPackage = {
              ...targetPkg,
              files: updatedFiles,
              mode: updatedFiles.length >= 2 ? 'Package' : 'Single',
              status: updatedFiles.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
            };
            setContractPackages(prev => prev.map(p => p.id === targetPkgId ? updatedPkg : p));
            setStagedDocs(prev => prev.filter(d => !addToPackageDocs.some(ad => ad.id === d.id)));
            setSelectedIds(new Set());
            setAddToPackageDocs(null);
            // Auto-open PackageDetailPanel so user can assign roles to newly added files
            setDetailPkg(updatedPkg);
            toast.success(`${addToPackageDocs.length} file${addToPackageDocs.length !== 1 ? 's' : ''} added to ${targetPkg.packageNum} — assign roles below`);
          }}
          onCancel={() => setAddToPackageDocs(null)}
        />
      )}

      {/* Resubmit Confirm Dialog */}
      {resubmitTarget && (
        <ResubmitConfirmDialog
          submission={resubmitTarget}
          onConfirm={(correctionNote) => {
            resubmitPackage(resubmitTarget, correctionNote);
            setResubmitTarget(null);
          }}
          onCancel={() => setResubmitTarget(null)}
        />
      )}

      {/* S1c: Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onGroup={openGroupingDialog}
        onAddToPackage={() => {
          const docs = stagedDocs.filter(d => selectedIds.has(d.id));
          if (docs.length > 0) setAddToPackageDocs(docs);
        }}
        onRemove={() => {
          setStagedDocs(prev => prev.filter(d => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
        }}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
