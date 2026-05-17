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

import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, AlertTriangle, CheckCircle2, XCircle,
  Clock, Send, RefreshCw, Search, MoreHorizontal,
  Eye, Trash2, ArrowRight, FileUp, CheckSquare, Square, Layers,
  Package, X, ChevronDown, Edit2, Unlink
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
import { toast } from 'sonner';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { publishEvent } from '@/lib/eventBus';
import { useRole } from '@/contexts/RoleContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type StagedStatus = 'uploaded' | 'validating' | 'valid' | 'warning' | 'invalid' | 'ready' | 'submitted';

interface StagedDocument {
  id: string;
  display_name: string;
  status: StagedStatus;
  upload_date: string;
  uploader: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  workspace_tag: string;
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

// ─── Mock data — TODO: Backend integration required ──────────────────────────

const MOCK_DOCUMENTS: StagedDocument[] = [
  { id: '1', display_name: 'Retail-HQ-Lease-2026.pdf',      status: 'valid',      upload_date: '2026-05-16 09:14', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 4_200_000, page_count: 24, workspace_tag: 'Q1-2026-Retail' },
  { id: '2', display_name: 'Office-Tower-Amendment-3.pdf',   status: 'warning',    upload_date: '2026-05-16 09:10', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 1_800_000, page_count: 8,  workspace_tag: 'Q1-2026-Office' },
  { id: '3', display_name: 'Warehouse-Lease-Exhibit-A.tiff', status: 'valid',      upload_date: '2026-05-16 08:55', uploader: 'A. Chen',     mime_type: 'image/tiff',       file_size_bytes: 6_100_000, page_count: 12, workspace_tag: 'Q1-2026-Industrial' },
  { id: '4', display_name: 'Corrupted-Scan-Draft.pdf',       status: 'invalid',    upload_date: '2026-05-16 08:42', uploader: 'A. Chen',     mime_type: 'application/pdf', file_size_bytes: 320_000,   page_count: null, workspace_tag: 'Q1-2026-Retail' },
  { id: '5', display_name: 'Ground-Lease-Base-Contract.pdf', status: 'ready',      upload_date: '2026-05-16 08:30', uploader: 'S. Patel',    mime_type: 'application/pdf', file_size_bytes: 9_400_000, page_count: 41, workspace_tag: 'Q2-2026-Land' },
  { id: '6', display_name: 'Industrial-Park-Schedule.pdf',   status: 'ready',      upload_date: '2026-05-16 08:28', uploader: 'S. Patel',    mime_type: 'application/pdf', file_size_bytes: 2_200_000, page_count: 6,  workspace_tag: 'Q2-2026-Land' },
  { id: '7', display_name: 'Retail-Sublease-Notice.pdf',     status: 'validating', upload_date: '2026-05-16 09:18', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 890_000,   page_count: null, workspace_tag: 'Q1-2026-Retail' },
  { id: '8', display_name: 'Corporate-HQ-Renewal-2026.pdf',  status: 'submitted',  upload_date: '2026-05-15 16:44', uploader: 'D. Kim',      mime_type: 'application/pdf', file_size_bytes: 5_700_000, page_count: 28, workspace_tag: 'Q1-2026-Office' },
];

const MOCK_BATCHES: IntakeBatch[] = [
  { id: 'b1', batch_reference: 'BATCH-2026-0041', submission_mode: 'contract_package', document_count: 4,  status: 'processing', submitted_at: '2026-05-16 09:05' },
  { id: 'b2', batch_reference: 'BATCH-2026-0040', submission_mode: 'single_contract',  document_count: 1,  status: 'completed',  submitted_at: '2026-05-15 16:44' },
  { id: 'b3', batch_reference: 'BATCH-2026-0039', submission_mode: 'bulk_batch',       document_count: 12, status: 'completed',  submitted_at: '2026-05-15 11:20' },
  { id: 'b4', batch_reference: 'BATCH-2026-0038', submission_mode: 'contract_package', document_count: 3,  status: 'completed',  submitted_at: '2026-05-14 14:33' },
  { id: 'b5', batch_reference: 'BATCH-2026-0037', submission_mode: 'single_contract',  document_count: 1,  status: 'failed',     submitted_at: '2026-05-14 09:11' },
];

// Seed Contract Packages from first 3 batches
const INITIAL_PACKAGES: ContractPackage[] = [
  {
    id: 'pkg-seed-1',
    packageNum: 'PKG-2026-001',
    packageName: 'Q1 Retail Portfolio',
    mode: 'Package',
    files: [
      { docId: 'f1', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'f2', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
      { docId: 'f3', name: 'Warehouse-Lease-Exhibit-A.tiff', role: 'Exhibit' },
      { docId: 'f4', name: 'Retail-Sublease-Notice.pdf',   role: 'Notice' },
    ],
    workspace: 'Q1-2026-Retail',
    createdBy: 'J. Martinez',
    createdAt: '2026-05-16T09:05:00Z',
    status: 'Ready',
  },
  {
    id: 'pkg-seed-2',
    packageNum: 'PKG-2026-002',
    mode: 'Single',
    files: [
      { docId: 'f5', name: 'Corporate-HQ-Renewal-2026.pdf', role: 'Undefined' },
    ],
    workspace: 'Q1-2026-Office',
    createdBy: 'D. Kim',
    createdAt: '2026-05-15T16:44:00Z',
    status: 'Pending',
  },
  {
    id: 'pkg-seed-3',
    packageNum: 'PKG-2026-003',
    packageName: 'Q2 Land Leases',
    mode: 'Package',
    files: [
      { docId: 'f6', name: 'Ground-Lease-Base-Contract.pdf', role: 'Base Contract' },
      { docId: 'f7', name: 'Industrial-Park-Schedule.pdf',   role: 'Schedule' },
      { docId: 'f8', name: 'Warehouse-Lease-Exhibit-A.tiff', role: 'Exhibit' },
    ],
    workspace: 'Q2-2026-Land',
    createdBy: 'S. Patel',
    createdAt: '2026-05-14T14:33:00Z',
    status: 'Ready',
  },
];

// Seed Submissions from remaining batches
const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-seed-1',
    packageNum: 'PKG-2026-0040',
    packageName: 'Single Office Contract',
    mode: 'Single',
    fileCount: 1,
    fileNames: ['Corporate-HQ-Renewal-2026.pdf'],
    files: [{ docId: 'f9', name: 'Corporate-HQ-Renewal-2026.pdf', role: 'Base Contract' }],
    workspace: 'Q1-2026-Office',
    submittedBy: 'D. Kim',
    submitDate: '2026-05-15T16:44:00Z',
    status: 'Completed',
  },
  {
    id: 'sub-seed-2',
    packageNum: 'PKG-2026-0037',
    mode: 'Single',
    fileCount: 1,
    fileNames: ['Corrupted-Scan-Draft.pdf'],
    files: [{ docId: 'f10', name: 'Corrupted-Scan-Draft.pdf', role: 'Supporting' }],
    workspace: 'Q1-2026-Retail',
    submittedBy: 'A. Chen',
    submitDate: '2026-05-14T09:11:00Z',
    status: 'Failed',
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
  validating: 'bg-amber-50 text-amber-700 border border-amber-200',
  valid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:    'bg-orange-50 text-orange-700 border border-orange-200',
  invalid:    'bg-red-50 text-red-700 border border-red-200',
  ready:      'bg-violet-50 text-violet-700 border border-violet-200',
  submitted:  'bg-slate-100 text-slate-600 border border-slate-200',
};
const STATUS_LABEL: Record<StagedStatus, string> = {
  uploaded: 'Uploaded', validating: 'Validating', valid: 'Valid',
  warning: 'Warning', invalid: 'Invalid', ready: 'Ready', submitted: 'Submitted',
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
            <h2 className="text-[15px] font-bold text-foreground">Group into Package</h2>
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
}

function PackageDetailPanel({ pkg, isReadOnly, onClose, onSaveRoles, onSubmit, onUngroup }: PackageDetailPanelProps) {
  const [editedRoles, setEditedRoles] = useState<Record<string, DocumentRole>>(
    () => Object.fromEntries(pkg.files.map(f => [f.docId, f.role]))
  );
  const [dirty, setDirty] = useState(false);
  const [confirmingUngroup, setConfirmingUngroup] = useState(false);

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
              { label: 'Package #',  value: pkg.packageNum },
              { label: 'Name',       value: pkg.packageName ?? '—' },
              { label: 'Mode',       value: pkg.mode },
              { label: 'Workspace',  value: pkg.workspace },
              { label: 'Created By', value: pkg.createdBy },
              { label: 'Created',    value: formatDate(pkg.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[12px] text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-[12px] font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
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
                        <span className="font-medium text-foreground truncate max-w-[220px]" title={f.name}>
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

// ─── S1c: Bulk Action Bar ─────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  onGroup,
  onRemove,
  onClear,
}: {
  selectedCount: number;
  onGroup: () => void;
  onRemove: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 shadow-xl">
      <span className="text-[13px] font-semibold text-foreground">{selectedCount} selected</span>
      <div className="h-4 w-px bg-border" />
      <Button size="sm" onClick={onGroup} className="gap-1.5 text-[13px]">
        <Package className="w-3.5 h-3.5" /> Group Selected
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

  // ── Stage Documents state ──
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>(MOCK_DOCUMENTS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [colFilters, setColFilters] = useState({ name: '', uploader: '', workspace: '' });

  // S1a — Document detail panel
  const [detailDoc, setDetailDoc] = useState<StagedDocument | null>(null);
  // S1b — Batch detail panel
  const [detailBatch, setDetailBatch] = useState<IntakeBatch | null>(null);
  // S1c — Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Grouping dialog
  const [groupingDocs, setGroupingDocs] = useState<StagedDocument[] | null>(null);

  // ── Contract Packages state ──
  const [contractPackages, setContractPackages] = useState<ContractPackage[]>(INITIAL_PACKAGES);
  const [pkgColFilters, setPkgColFilters] = useState({ packageNum: '', name: '', workspace: '', createdBy: '' });
  const [detailPkg, setDetailPkg] = useState<ContractPackage | null>(null);
  // Inline rename
  const [renamingPkgId, setRenamingPkgId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Submissions state ──
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [subColFilters, setSubColFilters] = useState({ packageNum: '', name: '', workspace: '', submittedBy: '' });
  const [detailSub, setDetailSub] = useState<Submission | null>(null);

  // ── Derived counts ──
  const counts = {
    uploaded:   stagedDocs.filter(d => d.status === 'uploaded').length,
    validating: stagedDocs.filter(d => d.status === 'validating').length,
    valid:      stagedDocs.filter(d => d.status === 'valid').length,
    warning:    stagedDocs.filter(d => d.status === 'warning').length,
    invalid:    stagedDocs.filter(d => d.status === 'invalid').length,
    ready:      stagedDocs.filter(d => d.status === 'ready').length,
    submitted:  156,
  };

  const filteredDocs = stagedDocs.filter(doc => {
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

  const filteredPkgs = contractPackages.filter(pkg =>
    pkg.packageNum.toLowerCase().includes(pkgColFilters.packageNum.toLowerCase()) &&
    (pkg.packageName ?? '').toLowerCase().includes(pkgColFilters.name.toLowerCase()) &&
    pkg.workspace.toLowerCase().includes(pkgColFilters.workspace.toLowerCase()) &&
    pkg.createdBy.toLowerCase().includes(pkgColFilters.createdBy.toLowerCase())
  );

  const filteredSubs = submissions.filter(sub =>
    sub.packageNum.toLowerCase().includes(subColFilters.packageNum.toLowerCase()) &&
    (sub.packageName ?? '').toLowerCase().includes(subColFilters.name.toLowerCase()) &&
    sub.workspace.toLowerCase().includes(subColFilters.workspace.toLowerCase()) &&
    sub.submittedBy.toLowerCase().includes(subColFilters.submittedBy.toLowerCase())
  );

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

  // ── Grouping workflow ──
  function openGroupingDialog() {
    const docs = stagedDocs.filter(d => selectedIds.has(d.id));
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

  // ── Ungroup package workflow ──
  function ungroupPackage(pkg: ContractPackage) {
    // Reconstruct StagedDocument stubs from PackageFile entries
    const restoredDocs: StagedDocument[] = pkg.files.map(f => ({
      id: `restored-${f.docId}-${Date.now()}`,
      display_name: f.name,
      status: 'valid' as StagedStatus,
      upload_date: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
      uploader: pkg.createdBy,
      mime_type: f.name.toLowerCase().endsWith('.tiff') || f.name.toLowerCase().endsWith('.tif') ? 'image/tiff' : 'application/pdf',
      file_size_bytes: 0,
      page_count: null,
      workspace_tag: pkg.workspace,
    }));
    setContractPackages(prev => prev.filter(p => p.id !== pkg.id));
    setStagedDocs(prev => [...restoredDocs, ...prev]);
    toast.success(`${pkg.packageNum} ungrouped — ${pkg.files.length} file${pkg.files.length !== 1 ? 's' : ''} returned to Stage Documents`);
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
          <h1 className="page-title">Document Pipeline</h1>
          <p className="page-subtitle">Monitor and manage staged documents before submission to processing.</p>
        </div>
        <Button onClick={() => navigate('/pipeline/upload')} className="gap-2">
          <UploadCloud className="w-4 h-4" /> Upload Files
        </Button>
      </div>

      {/* ── 7 Summary cards ── */}
      <div className="grid grid-cols-7 gap-3">
        {([
          { key: 'uploaded',   label: 'Uploaded',   icon: <FileUp className="w-5 h-5" />,        accent: 'lg-primary-light' },
          { key: 'validating', label: 'Validating', icon: <RefreshCw className="w-5 h-5" />,     accent: 'lg-primary-light', spinning: counts.validating > 0 },
          { key: 'valid',      label: 'Valid',      icon: <CheckCircle2 className="w-5 h-5" />,  accent: 'lg-success' },
          { key: 'warning',    label: 'Warning',    icon: <AlertTriangle className="w-5 h-5" />, accent: 'lg-warning' },
          { key: 'invalid',    label: 'Invalid',    icon: <XCircle className="w-5 h-5" />,       accent: 'lg-error' },
          { key: 'ready',      label: 'Ready',      icon: <Clock className="w-5 h-5" />,         accent: 'lg-primary-light' },
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
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="validating">Validating</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {stagedDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <FileText className="w-7 h-7 text-accent-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground">No documents in pipeline</p>
            <p className="text-[13px] text-muted-foreground">Upload files to begin the intake process.</p>
            <Button size="sm" onClick={() => navigate('/pipeline/upload')} className="mt-1 gap-2">
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
                  <th className="text-left">Status</th>
                  <th className="text-left">Upload Date</th>
                  <th className="text-left">Uploader</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Size</th>
                  <th className="text-left">Pages</th>
                  <th className="text-left">Target</th>
                  <th></th>
                </tr>
                {/* Column filters */}
                <tr className="bg-muted/20">
                  <th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.name} onChange={v => setColFilters(f => ({ ...f, name: v }))} placeholder="Filter name…" /></th>
                  <th />
                  <th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.uploader} onChange={v => setColFilters(f => ({ ...f, uploader: v }))} placeholder="Filter uploader…" /></th>
                  <th /><th /><th />
                  <th className="px-3 py-1"><ColFilter value={colFilters.workspace} onChange={v => setColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter workspace…" /></th>
                  <th />
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
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[200px]" title={doc.display_name}>{doc.display_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[doc.status]}`}>
                          {doc.status === 'validating' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {STATUS_LABEL[doc.status]}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] text-muted-foreground">{doc.upload_date}</td>
                      <td className="text-muted-foreground">{doc.uploader}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                          {getMimeLabel(doc.mime_type)}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{formatBytes(doc.file_size_bytes)}</td>
                      <td className="text-muted-foreground">
                        {doc.page_count != null ? doc.page_count : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td>
                        <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">{doc.workspace_tag}</span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="gap-2 text-[13px]" onSelect={() => setDetailDoc(doc)}>
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </DropdownMenuItem>
                            {!isReadOnly && (
                              <DropdownMenuItem className="gap-2 text-[13px] text-destructive" onSelect={() => setStagedDocs(prev => prev.filter(d => d.id !== doc.id))}>
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

        {stagedDocs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
            <p className="text-[12px] text-muted-foreground">
              Showing {filteredDocs.length} of {stagedDocs.length} documents
              {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/pipeline/review')} className="gap-1.5 text-[13px]">
              Review &amp; Group <ArrowRight className="w-3.5 h-3.5" />
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
          <span className="text-[12px] text-muted-foreground">{contractPackages.length} package{contractPackages.length !== 1 ? 's' : ''}</span>
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
                  <th className="text-left">Package #</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Mode</th>
                  <th className="text-left">Files</th>
                  <th className="text-left">Roles</th>
                  <th className="text-left">Workspace</th>
                  <th className="text-left">Created By</th>
                  <th className="text-left">Created</th>
                  <th className="text-left">Role Status</th>
                  <th className="text-left">Actions</th>
                </tr>
                <tr className="bg-muted/20">
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.packageNum} onChange={v => setPkgColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.name} onChange={v => setPkgColFilters(f => ({ ...f, name: v }))} placeholder="Filter name…" /></th>
                  <th /><th /><th />
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.workspace} onChange={v => setPkgColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter workspace…" /></th>
                  <th className="px-3 py-1"><ColFilter value={pkgColFilters.createdBy} onChange={v => setPkgColFilters(f => ({ ...f, createdBy: v }))} placeholder="Filter creator…" /></th>
                  <th /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredPkgs.map(pkg => {
                  const ready = isPackageReady(pkg);
                  const uniqueRoles = Array.from(new Set(pkg.files.map(f => f.role))).filter(r => r !== 'Undefined');
                  return (
                    <tr key={pkg.id}>
                      <td className="font-mono text-[12px] text-primary">{pkg.packageNum}</td>
                      <td>
                        {renamingPkgId === pkg.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(pkg.id)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRename(pkg.id); if (e.key === 'Escape') setRenamingPkgId(null); }}
                            className="h-6 px-1.5 text-[12px] rounded border border-primary bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-36"
                          />
                        ) : (
                          <button
                            onClick={() => !isReadOnly && startRename(pkg)}
                            className={`flex items-center gap-1 text-[13px] group ${!isReadOnly ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
                            title={!isReadOnly ? 'Click to rename' : undefined}
                          >
                            {pkg.packageName
                              ? <span className="font-medium text-foreground">{pkg.packageName}</span>
                              : <span className="italic text-muted-foreground">—</span>
                            }
                            {!isReadOnly && <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          pkg.mode === 'Package'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>{pkg.mode}</span>
                      </td>
                      <td className="text-muted-foreground">{pkg.files.length}</td>
                      <td>
                        <span className="text-[12px] text-muted-foreground">
                          {uniqueRoles.length > 0 ? uniqueRoles.join(', ') : <span className="italic">None assigned</span>}
                        </span>
                      </td>
                      <td>
                        <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">{pkg.workspace}</span>
                      </td>
                      <td className="text-muted-foreground">{pkg.createdBy}</td>
                      <td className="text-muted-foreground text-[12px]">{formatDate(pkg.createdAt)}</td>
                      <td>
                        {ready
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Ready</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Incomplete</span>
                        }
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailPkg(pkg)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="View package details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
                              Submit
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
          <span className="text-[12px] text-muted-foreground">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
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
                  <th className="text-left">Package #</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Mode</th>
                  <th className="text-left">Files</th>
                  <th className="text-left">Workspace</th>
                  <th className="text-left">Submitted By</th>
                  <th className="text-left">Submit Date</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
                <tr className="bg-muted/20">
                  <th className="px-3 py-1"><ColFilter value={subColFilters.packageNum} onChange={v => setSubColFilters(f => ({ ...f, packageNum: v }))} placeholder="Filter #…" /></th>
                  <th className="px-3 py-1"><ColFilter value={subColFilters.name} onChange={v => setSubColFilters(f => ({ ...f, name: v }))} placeholder="Filter name…" /></th>
                  <th /><th />
                  <th className="px-3 py-1"><ColFilter value={subColFilters.workspace} onChange={v => setSubColFilters(f => ({ ...f, workspace: v }))} placeholder="Filter workspace…" /></th>
                  <th className="px-3 py-1"><ColFilter value={subColFilters.submittedBy} onChange={v => setSubColFilters(f => ({ ...f, submittedBy: v }))} placeholder="Filter submitter…" /></th>
                  <th /><th /><th />
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(sub => (
                  <tr key={sub.id}>
                    <td className="font-mono text-[12px] text-primary">{sub.packageNum}</td>
                    <td>
                      {sub.packageName
                        ? <span className="font-medium text-foreground">{sub.packageName}</span>
                        : <span className="italic text-muted-foreground">—</span>
                      }
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        sub.mode === 'Package'
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>{sub.mode}</span>
                    </td>
                    <td className="text-muted-foreground">{sub.fileCount}</td>
                    <td>
                      <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">{sub.workspace}</span>
                    </td>
                    <td className="text-muted-foreground">{sub.submittedBy}</td>
                    <td className="text-muted-foreground text-[12px]">{formatDate(sub.submitDate)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${SUB_STATUS_BADGE[sub.status]}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setDetailSub(sub)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="View submission details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubs.length === 0 && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">No submissions match the current filter.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Panels & dialogs ── */}
      {detailDoc && <DocumentDetailPanel doc={detailDoc} onClose={() => setDetailDoc(null)} />}
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
      {groupingDocs && (
        <GroupingDialog
          docs={groupingDocs}
          onConfirm={confirmGrouping}
          onCancel={() => setGroupingDocs(null)}
        />
      )}

      {/* S1c: Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onGroup={openGroupingDialog}
        onRemove={() => {
          setStagedDocs(prev => prev.filter(d => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
        }}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
