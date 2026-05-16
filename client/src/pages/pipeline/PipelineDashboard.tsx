/**
 * PipelineDashboard — FC-1 Screen 1.1
 * Screen key: pipeline-dashboard
 * Route: /pipeline/dashboard
 * Role: Document Submitter
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 * Typography: Inter primary, JetBrains Mono for IDs/codes
 * Prompt 1.1: 7 summary cards (Uploaded/Validating/Valid/Warning/Invalid/Ready/Submitted),
 *             Staged Documents table, Recent Batches sidebar, Upload CTA.
 * Data model refs: StagedDocument (status: uploaded|validating|valid|warning|invalid|submitted),
 *                  IntakeBatch (batch_reference, submission_mode, status)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, AlertTriangle, CheckCircle2, XCircle,
  Clock, Send, RefreshCw, Search, MoreHorizontal,
  Eye, Trash2, ArrowRight, FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SCREEN_KEYS } from '@/constants/screenKeys';

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

// ─── Mock data — TODO: Backend integration required ──────────────────────────

const MOCK_DOCUMENTS: StagedDocument[] = [
  { id: '1', display_name: 'Retail-HQ-Lease-2026.pdf', status: 'valid', upload_date: '2026-05-16 09:14', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 4_200_000, page_count: 24, workspace_tag: 'Q1-2026-Retail' },
  { id: '2', display_name: 'Office-Tower-Amendment-3.pdf', status: 'warning', upload_date: '2026-05-16 09:10', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 1_800_000, page_count: 8, workspace_tag: 'Q1-2026-Office' },
  { id: '3', display_name: 'Warehouse-Lease-Exhibit-A.tiff', status: 'valid', upload_date: '2026-05-16 08:55', uploader: 'A. Chen', mime_type: 'image/tiff', file_size_bytes: 6_100_000, page_count: 12, workspace_tag: 'Q1-2026-Industrial' },
  { id: '4', display_name: 'Corrupted-Scan-Draft.pdf', status: 'invalid', upload_date: '2026-05-16 08:42', uploader: 'A. Chen', mime_type: 'application/pdf', file_size_bytes: 320_000, page_count: null, workspace_tag: 'Q1-2026-Retail' },
  { id: '5', display_name: 'Ground-Lease-Base-Contract.pdf', status: 'ready', upload_date: '2026-05-16 08:30', uploader: 'S. Patel', mime_type: 'application/pdf', file_size_bytes: 9_400_000, page_count: 41, workspace_tag: 'Q2-2026-Land' },
  { id: '6', display_name: 'Industrial-Park-Schedule.pdf', status: 'ready', upload_date: '2026-05-16 08:28', uploader: 'S. Patel', mime_type: 'application/pdf', file_size_bytes: 2_200_000, page_count: 6, workspace_tag: 'Q2-2026-Land' },
  { id: '7', display_name: 'Retail-Sublease-Notice.pdf', status: 'validating', upload_date: '2026-05-16 09:18', uploader: 'J. Martinez', mime_type: 'application/pdf', file_size_bytes: 890_000, page_count: null, workspace_tag: 'Q1-2026-Retail' },
  { id: '8', display_name: 'Corporate-HQ-Renewal-2026.pdf', status: 'submitted', upload_date: '2026-05-15 16:44', uploader: 'D. Kim', mime_type: 'application/pdf', file_size_bytes: 5_700_000, page_count: 28, workspace_tag: 'Q1-2026-Office' },
];

const MOCK_BATCHES: IntakeBatch[] = [
  { id: 'b1', batch_reference: 'BATCH-2026-0041', submission_mode: 'contract_package', document_count: 4, status: 'processing', submitted_at: '2026-05-16 09:05' },
  { id: 'b2', batch_reference: 'BATCH-2026-0040', submission_mode: 'single_contract', document_count: 1, status: 'completed', submitted_at: '2026-05-15 16:44' },
  { id: 'b3', batch_reference: 'BATCH-2026-0039', submission_mode: 'bulk_batch', document_count: 12, status: 'completed', submitted_at: '2026-05-15 11:20' },
  { id: 'b4', batch_reference: 'BATCH-2026-0038', submission_mode: 'contract_package', document_count: 3, status: 'completed', submitted_at: '2026-05-14 14:33' },
  { id: 'b5', batch_reference: 'BATCH-2026-0037', submission_mode: 'single_contract', document_count: 1, status: 'failed', submitted_at: '2026-05-14 09:11' },
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

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<StagedStatus, string> = {
  uploaded:   'badge-uploaded',
  validating: 'badge-processing',
  valid:      'badge-valid',
  warning:    'badge-warning',
  invalid:    'badge-invalid',
  ready:      'badge-ready',
  submitted:  'badge-submitted',
};

const STATUS_LABEL: Record<StagedStatus, string> = {
  uploaded: 'Uploaded', validating: 'Validating', valid: 'Valid',
  warning: 'Warning', invalid: 'Invalid', ready: 'Ready', submitted: 'Submitted',
};

const BATCH_BADGE: Record<IntakeBatch['status'], string> = {
  assembling: 'badge-uploaded', submitted: 'badge-processing', processing: 'badge-processing',
  completed: 'badge-valid', failed: 'badge-invalid',
};

const BATCH_LABEL: Record<IntakeBatch['status'], string> = {
  assembling: 'Assembling', submitted: 'Submitted', processing: 'Processing',
  completed: 'Completed', failed: 'Failed',
};

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  accentClass: string;
  active?: boolean;
  onClick: () => void;
  spinning?: boolean;
}

function SummaryCard({ label, count, icon, accentClass, active, onClick, spinning }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left w-full rounded-lg bg-card border shadow-sm p-4 transition-all duration-150
        hover:shadow-md hover:border-primary/40
        ${active ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border'}
      `}
      style={{ borderLeftWidth: '3px', borderLeftColor: `var(--color-${accentClass})` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-1">{label}</p>
          <p className="text-[32px] font-bold leading-none text-foreground">{count}</p>
        </div>
        <div className={`mt-0.5 ${spinning ? 'animate-spin' : ''}`} style={{ color: `var(--color-${accentClass})` }}>
          {icon}
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineDashboard() {
  // Confirm this screen key is correct
  const _screenKey = SCREEN_KEYS.PIPELINE_DASHBOARD;

  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Backend integration required — replace with API call to GET /api/staged-documents
  const documents = MOCK_DOCUMENTS;
  // TODO: Backend integration required — replace with API call to GET /api/intake-batches
  const batches = MOCK_BATCHES;

  const counts = {
    uploaded:   documents.filter(d => d.status === 'uploaded').length,
    validating: documents.filter(d => d.status === 'validating').length,
    valid:      documents.filter(d => d.status === 'valid').length,
    warning:    documents.filter(d => d.status === 'warning').length,
    invalid:    documents.filter(d => d.status === 'invalid').length,
    ready:      documents.filter(d => d.status === 'ready').length,
    submitted:  156, // TODO: Backend integration required — total submitted count from API
  };

  const filteredDocs = documents.filter(doc => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      doc.display_name.toLowerCase().includes(q) ||
      doc.workspace_tag.toLowerCase().includes(q) ||
      doc.uploader.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full bg-[var(--color-lg-page-bg)]">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Document Pipeline</h1>
          <p className="page-subtitle">
            Monitor and manage staged documents before submission to processing.
          </p>
        </div>
        <Button onClick={() => navigate('/pipeline/upload')} className="gap-2">
          <UploadCloud className="w-4 h-4" />
          Upload Files
        </Button>
      </div>

      {/* ── 7 Summary cards ── */}
      <div className="grid grid-cols-7 gap-3">
        {([
          { key: 'uploaded',   label: 'Uploaded',   icon: <FileUp className="w-5 h-5" />,         accent: 'lg-primary-light' },
          { key: 'validating', label: 'Validating', icon: <RefreshCw className="w-5 h-5" />,      accent: 'lg-primary-light', spinning: counts.validating > 0 },
          { key: 'valid',      label: 'Valid',       icon: <CheckCircle2 className="w-5 h-5" />,   accent: 'lg-success' },
          { key: 'warning',    label: 'Warning',     icon: <AlertTriangle className="w-5 h-5" />,  accent: 'lg-warning' },
          { key: 'invalid',    label: 'Invalid',     icon: <XCircle className="w-5 h-5" />,        accent: 'lg-error' },
          { key: 'ready',      label: 'Ready',       icon: <Clock className="w-5 h-5" />,          accent: 'lg-primary-light' },
          { key: 'submitted',  label: 'Submitted',   icon: <Send className="w-5 h-5" />,           accent: 'lg-success' },
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

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Staged Documents table ── */}
        <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Staged Documents</h2>
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

          {documents.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <FileText className="w-7 h-7 text-accent-foreground" />
              </div>
              <p className="text-[15px] font-medium text-foreground">No documents in pipeline</p>
              <p className="text-[13px] text-muted-foreground">Upload files to begin the intake process.</p>
              <Button size="sm" onClick={() => navigate('/pipeline/upload')} className="mt-1 gap-2">
                <UploadCloud className="w-4 h-4" />
                Upload Files
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full text-[13px]">
                <thead>
                  <tr>
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
                </thead>
                <tbody>
                  {filteredDocs.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[200px]" title={doc.display_name}>
                            {doc.display_name}
                          </span>
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
                        <span className="text-[12px] text-primary bg-accent px-2 py-0.5 rounded font-medium">
                          {doc.workspace_tag}
                        </span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="gap-2 text-[13px]">
                              <Eye className="w-3.5 h-3.5" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-[13px] text-destructive">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDocs.length === 0 && (
                <div className="py-10 text-center text-[13px] text-muted-foreground">
                  No documents match the current filter.
                </div>
              )}
            </div>
          )}

          {/* Table footer */}
          {documents.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
              <p className="text-[12px] text-muted-foreground">
                Showing {filteredDocs.length} of {documents.length} documents
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pipeline/review')}
                className="gap-1.5 text-[13px]"
              >
                Review &amp; Group
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Recent Batches sidebar ── */}
        <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Batches</h2>
          </div>
          <div className="divide-y divide-border">
            {batches.map(batch => (
              <div key={batch.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-mono text-[12px] font-medium text-primary">
                    {batch.batch_reference}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${BATCH_BADGE[batch.status]}`}>
                    {BATCH_LABEL[batch.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">
                    {getBatchModeLabel(batch.submission_mode)} · {batch.document_count} file{batch.document_count !== 1 ? 's' : ''}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground/70">
                    {batch.submitted_at.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[13px] gap-1.5"
              onClick={() => navigate('/pipeline/confirm')}
            >
              View All Batches
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
