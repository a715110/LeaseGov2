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

import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, AlertTriangle, CheckCircle2, XCircle,
  Clock, Send, RefreshCw, Search, MoreHorizontal, Edit2, Layers,
  Eye, Trash2, ArrowRight, FileUp, CheckSquare, Square,
  Package, X, ChevronDown, ChevronUp, ChevronsUpDown, Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { FlagSlidingPanel } from '@/components/shared/FlagSlidingPanel';
import { DocumentIntelligencePanel } from '@/components/pipeline/DocumentIntelligencePanel';
import type { DocForPanel } from '@/components/pipeline/DocumentIntelligencePanel';
import { UploadDialog } from '@/components/pipeline/UploadDialog';
import type { StagedFile as UploadedFile } from '@/components/pipeline/UploadDialog';
import { toast } from 'sonner';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { publishEvent, subscribeToEvents } from '@/lib/eventBus';
import { useRole } from '@/contexts/RoleContext';
import { usePipelineCounts } from '@/contexts/PipelineCountsContext';
import {
  MOCK_CONTRACT_RECORDS,
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
  /** V3: document-level job status for Table 1 committed state */
  document_job_status: 'staged' | 'committed' | 'processing' | 'complete';
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
}

interface Submission {
  id: string;
  packageNum: string;
  packageName?: string;
  mode: 'Package' | 'Single';
  fileCount: number;
  fileNames: string[];
  files: PackageFile[];
  workspace: string;
  submittedBy: string;
  submitDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
}

// ─── Mock data — V3 Change 1 §1a — 8-document seed distribution ─────────────
// Docs 1–2: valid, unassigned (no target record)
// Docs 3–4: valid, assigned to Acme Corp (CR-2026-0038)
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
    workspace_tag: 'Q1-2026-Retail',
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    document_job_status: 'staged',
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
    workspace_tag: 'Q1-2026-Office',
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    document_job_status: 'staged',
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
    workspace_tag: 'Q1-2026-Retail',
    target_record_id: 'mock-record-001',  // Acme Corp — CR-2026-0038
    submission_path: 'existing_record',
    submitter_context_notes: 'Renewal for Acme Corp main location. Please prioritise.',
    document_job_status: 'committed',
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
    workspace_tag: 'Q1-2026-Office',
    target_record_id: 'mock-record-001',  // Acme Corp — CR-2026-0038
    submission_path: 'existing_record',
    submitter_context_notes: null,
    document_job_status: 'committed',
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
    workspace_tag: 'Q2-2026-Land',
    target_record_id: 'mock-record-002',  // Globex LLC — CR-2026-0039
    submission_path: 'existing_record',
    submitter_context_notes: 'Ground lease renewal — compare against approved record.',
    document_job_status: 'committed',
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
    workspace_tag: 'Q2-2026-Land',
    target_record_id: 'mock-record-002',  // Globex LLC — CR-2026-0039
    submission_path: 'existing_record',
    submitter_context_notes: null,
    document_job_status: 'committed',
  },
  {
    id: 'doc-7',
    display_name: 'corrupt_scan_draft.pdf',
    status: 'invalid',
    original_status: 'invalid',
    originalStatus: 'invalid',
    upload_date: '2026-06-12 08:42',
    uploader: 'A. Chen',
    mime_type: 'application/pdf',
    file_size_bytes: 320_000,
    page_count: null,
    workspace_tag: 'Q1-2026-Retail',
    target_record_id: null,
    submission_path: null,
    submitter_context_notes: null,
    document_job_status: 'staged',
    validation_errors: ['File integrity check failed — file cannot be opened or is malformed'],
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
    workspace_tag: 'Q1-2026-Retail',
    target_record_id: null,
    submission_path: 'unknown',  // DocSubmitter was not sure of target record
    submitter_context_notes: 'Not sure which record this belongs to — please advise.',
    document_job_status: 'staged',
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
    workspace: 'Q2-2026-Land',
    createdBy: 'S. Patel',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
  },
];

// V3 §1c — Table 3 seed: PKG-2026-001 as Pending submission
const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-v3-001-local',
    packageNum: 'PKG-2026-001',
    packageName: 'Acme Corp Retail Package',
    mode: 'Package',
    fileCount: 2,
    fileNames: ['Retail-HQ-Lease-2026.pdf', 'Office-Tower-Amendment-3.pdf'],
    files: [
      { docId: 'doc-3', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'doc-4', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
    ],
    workspace: 'Q1-2026-Retail',
    submittedBy: 'A. Chen',
    submitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
          <Button size="sm" onClick={() => onConfirm(docs.map(d => ({ docId: d.id, name: d.display_name, role: roles[d.id] })))} className="text-[13px] gap-1.5">
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

  return (
    <FlagSlidingPanel open={true} onClose={onClose} title="Submission Details" subtitle={submission.packageNum} width={520}>
      <div className="space-y-5">
        {/* Status */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${SUB_STATUS_BADGE[submission.status]}`}>
            {submission.status}
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

        {/* File list */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Files</p>
          <ul className="space-y-1.5">
            {submission.files.map(f => (
              <li key={f.docId} className="flex items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-1.5 text-foreground">
                  <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[240px]">{f.name}</span>
                </div>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                  {f.role}
                </span>
              </li>
            ))}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineDashboard() {
  const _screenKey = SCREEN_KEYS.PIPELINE_DASHBOARD;
  const [, navigate] = useLocation();
  const { activeRole } = useRole();
  const isReadOnly = activeRole === 'auditor';
  const { setPipelineReadyCount, setApprovalsCount } = usePipelineCounts();

  // ── Upload dialog state ──
  const [showUpload, setShowUpload] = useState(false);

  // ── Stage Documents state ──
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>(MOCK_DOCUMENTS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [colFilters, setColFilters] = useState({ name: '', uploader: '', workspace: '' });

  // S1a — Document detail panel
  const [detailDoc, setDetailDoc] = useState<DocForPanel | null>(null);
  // S1b — Batch detail panel
  const [detailBatch, setDetailBatch] = useState<IntakeBatch | null>(null);
  // S1c — Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  // Inline rename
  const [renamingPkgId, setRenamingPkgId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Submissions state ──
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [subColFilters, setSubColFilters] = useState({ packageNum: '', name: '', workspace: '', submittedBy: '' });
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'Pending' | 'In Progress' | 'Completed' | 'Failed'>('all');
  const [subSort, setSubSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(() => {
    try {
      const raw = sessionStorage.getItem('leasegov_sub_sort');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [detailSub, setDetailSub] = useState<Submission | null>(null);

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

  // Clear pipeline state when a batch is confirmed from PipelineSubmitConfirm
  useEffect(() => {
    const unsub = subscribeToEvents((event) => {
      if (event.type !== 'PIPELINE_BATCH_CLEARED') return;
      const payload = event.payload as { fileNames?: string[]; batchId?: string };
      const clearedNames = new Set(payload.fileNames ?? []);
      if (clearedNames.size === 0) return;
      setStagedDocs(prev => prev.filter(d => !clearedNames.has(d.display_name)));
      setContractPackages(prev =>
        prev.filter(pkg => !pkg.files.every(f => clearedNames.has(f.name)))
      );
    });
    return () => unsub();
  }, []);

  // ── Derived counts — committed docs are excluded from all pipeline stat cards ──
  const counts = {
    uploading:  stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'uploading').length,
    validating: stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'validating').length,
    valid:      stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'valid').length,
    invalid:    stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'invalid').length,
    submitted:  submissions.length,
  };

  // Committed docs have left the pipeline — exclude them from the staging table entirely
  const activeStagedDocs = stagedDocs.filter(d => d.document_job_status !== 'committed');

  const filteredDocs = activeStagedDocs.filter(doc => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      doc.display_name.toLowerCase().includes(q) ||
      doc.workspace_tag.toLowerCase().includes(q) ||
      doc.uploader.toLowerCase().includes(q);
    const matchesCol =
      doc.display_name.toLowerCase().includes(colFilters.name.toLowerCase()) &&
      doc.uploader.toLowerCase().includes(colFilters.uploader.toLowerCase()) &&
      doc.workspace_tag.toLowerCase().includes(colFilters.workspace.toLowerCase());
    return matchesStatus && matchesSearch && matchesCol;
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
      setSelectedIds(prev => { const n = new Set(prev); filteredDocs.forEach(d => n.add(d.id)); return n; });
    }
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // ── Upload confirm handler (V3 — 5-argument callback) ──
  function handleUploadConfirm(
    uploadedFiles: UploadedFile[],
    workspaceTag: string,
    targetRecordId: string | null,
    submissionPath: 'new_record' | 'existing_record' | 'unknown' | null,
    contextNotes: string | null,
  ) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newDocs: StagedDocument[] = uploadedFiles.map(f => {
      const resolvedStatus: 'valid' | 'invalid' = f.status === 'invalid' ? 'invalid' : 'valid';
      return {
        id: f.id,
        display_name: f.name,
        status: resolvedStatus,
        original_status: resolvedStatus,
        originalStatus: resolvedStatus,
        upload_date: dateStr,
        uploader: activeRole === 'document_submitter' ? 'You' : 'Current User',
        mime_type: f.mime_type,
        file_size_bytes: f.size,
        page_count: null,
        workspace_tag: workspaceTag,
        target_record_id: targetRecordId,
        submission_path: submissionPath,
        submitter_context_notes: contextNotes,
        document_job_status: 'staged' as const,
        validation_errors: f.status === 'invalid' ? ['File integrity check failed'] : undefined,
      };
    });
    setStagedDocs(prev => [...newDocs, ...prev]);
    toast.success(`${newDocs.length} file${newDocs.length !== 1 ? 's' : ''} added to the pipeline.`);
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
    const pkg: ContractPackage = {
      id: `pkg-${Date.now()}`,
      packageNum: nextPackageNum(),
      mode: files.length >= 2 ? 'Package' : 'Single',
      files,
      workspace: groupingDocs[0].workspace_tag,
      createdBy: groupingDocs[0].uploader,
      createdAt: new Date().toISOString(),
      status: files.every(f => f.role !== 'Undefined') ? 'Ready' : 'Pending',
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
    const sub: Submission = {
      id: `sub-${Date.now()}`,
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
    };
    setContractPackages(prev => prev.filter(p => p.id !== pkg.id));
    setSubmissions(prev => [sub, ...prev]);
    toast.success(`${pkg.packageNum} submitted successfully`);
    publishEvent({
      type: 'BATCH_SUBMITTED',
      payload: { batchId: pkg.id, packageNum: pkg.packageNum },
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
    <div className="flex flex-col gap-6 p-6 min-h-full bg-[var(--color-lg-page-bg)]">

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

      {/* ── 5 Summary cards ── */}
      <div className="grid grid-cols-5 gap-3">
                {([
          { key: 'uploading',  label: 'Uploading',  icon: <FileUp className="w-5 h-5" />,        accent: 'lg-primary-light' },
          { key: 'validating', label: 'Validating', icon: <RefreshCw className="w-5 h-5" />,     accent: 'lg-primary-light', spinning: counts.validating > 0 },
          { key: 'valid',      label: 'Valid',      icon: <CheckCircle2 className="w-5 h-5" />,  accent: 'lg-success' },
          { key: 'invalid',    label: 'Invalid',    icon: <XCircle className="w-5 h-5" />,       accent: 'lg-error' },
          { key: 'submitted',  label: 'Submitted',  icon: <Send className="w-5 h-5" />,          accent: 'lg-success' },
        ] as const).map(card => (
          <SummaryCard
            key={card.key}
            label={card.label}
            count={counts[card.key]}
            icon={card.icon}
            accentClass={card.accent}
            active={statusFilter === card.key}
            onClick={() => setStatusFilter(prev => prev === card.key ? 'all' : card.key)}
            spinning={'spinning' in card ? card.spinning : false}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE 1 — Stage Documents
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Stage Documents</h2>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-[13px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="uploading">Uploading</SelectItem>
                <SelectItem value="validating">Validating</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  <th className="w-8 px-3">
                    <button onClick={toggleAll} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left">File Name</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Workspace</th>
                  <th className="text-left">Record</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Uploaded</th>
                  <th></th>
                </tr>
                {/* Column filters */}
                <tr className="bg-muted/20">
                  <th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.name} onChange={v => setColFilters(f => ({ ...f, name: v }))} placeholder="Filter name…" /></th>
                  <th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.workspace} onChange={v => setColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter workspace…" /></th>
                  <th /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => {
                  const isSelected = selectedIds.has(doc.id);
                  return (
                    <tr key={doc.id} className={isSelected ? 'bg-primary/5' : ''}>
                      <td className="px-3">
                        <button onClick={() => toggleOne(doc.id)} className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      {/* Filename */}
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[180px]" title={doc.display_name}>{doc.display_name}</span>
                        </div>
                      </td>
                      {/* Type */}
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                          {getMimeLabel(doc.mime_type)}
                        </span>
                      </td>
                      {/* Workspace */}
                      <td>
                        <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">{doc.workspace_tag}</span>
                      </td>
                      {/* Record — V3 4-state rendering */}
                      <td>
                        {(() => {
                          if (doc.document_job_status === 'committed') {
                            const rec = findContractRecord(doc.target_record_id);
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {rec ? `${rec.contractNumber} · ${rec.counterparty}` : doc.target_record_id}
                              </span>
                            );
                          }
                          if (doc.target_record_id) {
                            const rec = findContractRecord(doc.target_record_id);
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {rec ? `${rec.contractNumber} · ${rec.counterparty}` : doc.target_record_id}
                              </span>
                            );
                          }
                          if (doc.submission_path === 'unknown') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Awaiting Assignment
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground/60 italic">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                              Unassigned
                            </span>
                          );
                        })()}
                      </td>
                      {/* Status */}
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          doc.document_job_status === 'committed'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : STATUS_BADGE[doc.status]
                        }`}>
                          {doc.status === 'validating' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {doc.document_job_status === 'committed' ? 'Committed' : STATUS_LABEL[doc.status]}
                        </span>
                      </td>
                      {/* Uploaded */}
                      <td className="font-mono text-[12px] text-muted-foreground">{doc.upload_date}</td>
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
                          {/* Trash — shown for all non-committed docs */}
                          {doc.document_job_status !== 'committed' && !isReadOnly && (
                            <button
                              onClick={() => setStagedDocs(prev => prev.filter(d => d.id !== doc.id))}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const selected = stagedDocs.filter(d => selectedIds.has(d.id));
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
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  {([
                    { col: 'packageNum', label: 'Package ID' },
                    { col: 'files',      label: 'Docs' },
                    { col: null,         label: 'Target Record' },
                    { col: null,         label: 'Roles' },
                    { col: 'status',     label: 'Status' },
                    { col: null,         label: 'Actions' },
                  ] as { col: string | null; label: string }[]).map(({ col, label }) => (
                    <th key={label} className="text-left">
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
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.packageNum} onChange={v => setPkgColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th /><th /><th /><th /><th />
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
                  return (
                    <tr key={pkg.id} className="focus:outline-none focus:ring-1 focus:ring-primary/40 focus:ring-inset">
                      {/* Package ID */}
                      <td>
                        <div className="flex flex-col">
                          <span className="font-mono text-[12px] text-primary">{pkg.packageNum}</span>
                          {pkg.packageName && <span className="text-[11px] text-muted-foreground">{pkg.packageName}</span>}
                        </div>
                      </td>
                      {/* Docs count */}
                      <td className="text-muted-foreground">{pkg.files.length}</td>
                      {/* Target Record */}
                      <td>
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
                      {/* Role completeness badge */}
                      <td>
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
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailPkg(pkg)}
                            className="px-2.5 py-1 rounded text-[11px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                          >
                            Open
                          </button>
                          {!isReadOnly && (
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
                          )}
                        </div>
                      </td>
                    </tr>
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
              {(['all', 'Pending', 'In Progress', 'Completed', 'Failed'] as const).map((opt, i) => {
                const activeStyle = opt === 'Pending' ? 'bg-slate-600 text-white'
                  : opt === 'In Progress' ? 'bg-blue-600 text-white'
                  : opt === 'Completed' ? 'bg-emerald-600 text-white'
                  : opt === 'Failed' ? 'bg-red-600 text-white'
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
          <div className="overflow-x-auto">
            <table className="data-table w-full text-[13px]">
              <thead>
                <tr>
                  {([
                    { col: null,          label: 'Batch ID' },
                    { col: 'packageNum',  label: 'Package' },
                    { col: null,          label: 'Target Record' },
                    { col: 'files',       label: 'Files' },
                    { col: 'submitDate',  label: 'Submitted At' },
                    { col: 'status',      label: 'Status' },
                    { col: null,          label: 'Actions' },
                  ] as { col: string | null; label: string }[]).map(({ col, label }) => (
                    <th key={label} className="text-left">
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
                  <th className="px-3 py-1"><ColFilter value={subColFilters.packageNum} onChange={v => setSubColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th /><th /><th /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(sub => {
                  // Derive batchId from submission id for display
                  const batchId = sub.id.startsWith('sub-v3') ? 'BATCH-2026-0041' : `BATCH-${sub.id.slice(-6).toUpperCase()}`;
                  const subTargetRec = findContractRecord(
                    sub.files[0]?.docId
                      ? (stagedDocs.find(d => d.id === sub.files[0].docId)?.target_record_id ?? null)
                      : null
                  );
                  return (
                  <tr key={sub.id}>
                    {/* Batch ID */}
                    <td className="font-mono text-[12px] text-primary">{batchId}</td>
                    {/* Package */}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-mono text-[12px] text-primary">{sub.packageNum}</span>
                        {sub.packageName && <span className="text-[11px] text-muted-foreground">{sub.packageName}</span>}
                      </div>
                    </td>
                    {/* Target Record */}
                    <td>
                      {subTargetRec ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {subTargetRec.contractNumber} · {subTargetRec.counterparty}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/60 italic">Unassigned</span>
                      )}
                    </td>
                    {/* Files */}
                    <td className="text-muted-foreground">{sub.fileCount}</td>
                    {/* Submitted At */}
                    <td className="text-muted-foreground text-[12px]">{formatDate(sub.submitDate)}</td>
                    {/* Status */}
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${SUB_STATUS_BADGE[sub.status]}`}>
                        {sub.status === 'In Progress' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        {sub.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td>
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
                      </div>
                    </td>
                  </tr>
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
      {/* Upload dialog */}
      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onConfirm={handleUploadConfirm}
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
