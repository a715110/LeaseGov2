/**
 * DocumentIntelligencePanel — V3 Document Intelligence Slide Panel
 *
 * V3 Document Intake Governance Flow — Change 3 (Eye icon → 400px slide-in)
 * Reference: IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE_V3.md §DOCUMENT INTELLIGENCE PANEL
 *
 * Pattern: 400px right slide-in panel (translate-x, z-40, backdrop)
 *
 * Sections:
 *   HEADER: filename · file type badge · upload timestamp · Close ×
 *   DOCUMENT PREVIEW: thumbnail grid (2 cols) with grey placeholder rectangles
 *   METADATA GRID (2-col): File Size · Pages · Workspace · Record Target · Uploaded By · Batch ID
 *   VALIDATION RESULTS (4 rows): Format Check · Size Check · Duplicate Check · File Integrity
 *   CONTEXT NOTES: surface-secondary card if submitter_context_notes present
 *   STATUS HISTORY: compact timeline
 *   FOOTER ACTIONS: context-sensitive per document state
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */

import { useEffect } from 'react';
import {
  X, FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  Tag, User, Layers, Hash, Eye, Package, RotateCcw, Trash2, Plus, Search,
} from 'lucide-react';
import {
  findContractRecord,
  CONTRACT_RECORD_STATUS_BADGE,
  CONTRACT_RECORD_STATUS_LABEL,
} from '@/lib/mockData';

// ─── Types (mirrors StagedDocument from PipelineDashboard) ───────────────────

export interface DocForPanel {
  id: string;
  display_name: string;
  status: 'uploaded' | 'uploading' | 'validating' | 'valid' | 'invalid';
  original_status: 'valid' | 'invalid';
  /** @deprecated kept for backward compat with StagedDocument */
  originalStatus?: 'valid' | 'invalid';
  upload_date: string;
  uploader: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  workspace_tag: string;
  validation_errors?: string[];
  target_record_id: string | null;
  submission_path: 'new_record' | 'existing_record' | 'unknown' | null;
  submitter_context_notes: string | null;
  document_job_status: 'staged' | 'committed' | 'processing' | 'complete';
}

export interface DocumentIntelligencePanelProps {
  doc: DocForPanel;
  onClose: () => void;
  onPackage?: (doc: DocForPanel) => void;
  onRemove?: (doc: DocForPanel) => void;
  onRetry?: (doc: DocForPanel) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  };
  return map[mime] ?? 'FILE';
}

// ─── Validation check rows ────────────────────────────────────────────────────

interface ValidationCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

function deriveValidationChecks(doc: DocForPanel): ValidationCheck[] {
  const isInvalid = doc.status === 'invalid';
  const hasIntegrityError = doc.validation_errors?.some(e =>
    e.toLowerCase().includes('integrity') || e.toLowerCase().includes('corrupt') || e.toLowerCase().includes('malformed')
  );
  const hasDuplicateError = doc.validation_errors?.some(e => e.toLowerCase().includes('duplicate'));
  const hasSizeError = doc.validation_errors?.some(e => e.toLowerCase().includes('size'));
  const hasFormatError = doc.validation_errors?.some(e => e.toLowerCase().includes('format') || e.toLowerCase().includes('extension'));

  return [
    {
      label: 'Format Check',
      passed: !isInvalid || !hasFormatError,
      detail: hasFormatError ? 'File extension not accepted' : 'Extension accepted',
    },
    {
      label: 'Size Check',
      passed: !isInvalid || !hasSizeError,
      detail: hasSizeError ? 'File exceeds 100 MB limit' : `${formatBytes(doc.file_size_bytes)} — within limit`,
    },
    {
      label: 'Duplicate Check',
      passed: !isInvalid || !hasDuplicateError,
      detail: hasDuplicateError ? 'Duplicate file detected in staging' : 'No duplicate found',
    },
    {
      label: 'File Integrity',
      passed: !isInvalid || !hasIntegrityError,
      detail: hasIntegrityError
        ? (doc.validation_errors?.[0] ?? 'File integrity check failed')
        : 'File header valid',
    },
  ];
}

// ─── Status timeline ──────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  done: boolean;
  date?: string;
}

function deriveTimeline(doc: DocForPanel): TimelineStep[] {
  const steps: TimelineStep[] = [
    { label: 'Uploaded', done: true, date: doc.upload_date },
    { label: 'Validated', done: doc.status === 'valid' || doc.status === 'invalid', date: doc.status !== 'uploading' && doc.status !== 'validating' ? doc.upload_date : undefined },
  ];
  if (doc.target_record_id) {
    steps.push({ label: 'Assigned', done: true });
  }
  if (doc.document_job_status === 'committed' || doc.document_job_status === 'processing' || doc.document_job_status === 'complete') {
    steps.push({ label: 'Packaged', done: true });
  }
  if (doc.document_job_status === 'processing' || doc.document_job_status === 'complete') {
    steps.push({ label: 'Submitted', done: true });
  }
  return steps;
}

// ─── DocumentIntelligencePanel ────────────────────────────────────────────────

export function DocumentIntelligencePanel({
  doc,
  onClose,
  onPackage,
  onRemove,
  onRetry,
}: DocumentIntelligencePanelProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mimeLabel = getMimeLabel(doc.mime_type);
  const validationChecks = deriveValidationChecks(doc);
  const timeline = deriveTimeline(doc);
  const targetRecord = findContractRecord(doc.target_record_id);
  const pageCount = doc.page_count ?? 4; // fallback for preview grid
  const previewPages = Array.from({ length: Math.min(pageCount, 6) }, (_, i) => i + 1);

  const isCommitted = doc.document_job_status === 'committed' || doc.document_job_status === 'processing' || doc.document_job_status === 'complete';
  const isInvalid = doc.status === 'invalid';
  const isUnassigned = !doc.target_record_id && doc.submission_path !== 'unknown';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onClose}
        style={{ animation: 'fadeIn 200ms ease-out both' }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-40 w-[400px] bg-[var(--color-lg-page-bg)] border-l border-border shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 220ms cubic-bezier(0.23,1,0.32,1) both' }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                {mimeLabel}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                isInvalid
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : isCommitted
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isInvalid ? 'Invalid' : isCommitted ? 'Committed' : 'Valid'}
              </span>
            </div>
            <h3 className="text-[14px] font-semibold text-foreground truncate" title={doc.display_name}>
              {doc.display_name}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{doc.upload_date}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* ── Document Preview ── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Document Preview · {doc.page_count != null ? `${doc.page_count} pages` : 'Pages unknown'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {previewPages.map(page => (
                <div
                  key={page}
                  className="aspect-[3/4] rounded-md bg-muted border border-border flex items-end justify-center pb-1.5 relative overflow-hidden"
                >
                  {/* Paper lines decoration */}
                  <div className="absolute inset-x-3 top-3 flex flex-col gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-px bg-muted-foreground/15 rounded-full" />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-mono relative z-10">{page}</span>
                </div>
              ))}
              {doc.page_count != null && doc.page_count > 6 && (
                <div className="aspect-[3/4] rounded-md bg-muted border border-border flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground">+{doc.page_count - 6}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Metadata Grid ── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Metadata</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                { icon: <Layers className="w-3.5 h-3.5" />, label: 'File Size', value: formatBytes(doc.file_size_bytes) },
                { icon: <FileText className="w-3.5 h-3.5" />, label: 'Pages', value: doc.page_count != null ? String(doc.page_count) : '—' },
                { icon: <Tag className="w-3.5 h-3.5" />, label: 'Workspace', value: doc.workspace_tag },
                { icon: <User className="w-3.5 h-3.5" />, label: 'Uploaded By', value: doc.uploader },
                { icon: <Hash className="w-3.5 h-3.5" />, label: 'Batch ID', value: 'BATCH-2026-0041' },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {item.icon} {item.label}
                  </span>
                  <span className="text-[12px] font-medium text-foreground">{item.value}</span>
                </div>
              ))}
              {/* Record Target — special rendering */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" /> Record Target
                </span>
                {targetRecord ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                    <span className="font-mono">{targetRecord.contractNumber}</span>
                    <span className={`px-1 py-0.5 rounded text-[10px] ${CONTRACT_RECORD_STATUS_BADGE[targetRecord.status]}`}>
                      {CONTRACT_RECORD_STATUS_LABEL[targetRecord.status]}
                    </span>
                  </span>
                ) : doc.submission_path === 'unknown' ? (
                  <span className="text-[11px] text-amber-600 font-medium">Awaiting Assignment</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">Unassigned</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Validation Results ── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Validation Results</p>
            <div className="flex flex-col gap-1.5">
              {validationChecks.map(check => (
                <div key={check.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
                  {check.passed
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className={`text-[12px] font-medium ${check.passed ? 'text-foreground' : 'text-red-700'}`}>
                      {check.label}
                    </span>
                    {check.detail && (
                      <p className="text-[11px] text-muted-foreground truncate">{check.detail}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    check.passed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {check.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Context Notes ── */}
          {doc.submitter_context_notes && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Submitter's Instructions
              </p>
              <div className="px-3 py-3 rounded-lg bg-accent border border-border text-[12px] text-foreground leading-relaxed">
                {doc.submitter_context_notes}
              </div>
            </div>
          )}

          {/* ── Status History ── */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Status History</p>
            <div className="flex flex-col gap-0">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                      step.done
                        ? 'bg-primary border-primary'
                        : 'bg-background border-muted-foreground/30'
                    }`} />
                    {i < timeline.length - 1 && (
                      <div className={`w-px flex-1 min-h-[20px] ${step.done ? 'bg-primary/30' : 'bg-muted-foreground/15'}`} />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className={`text-[12px] font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[11px] text-muted-foreground">{step.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-5 py-4 border-t border-border bg-card shrink-0">
          {isCommitted ? (
            // Committed — read-only
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Record
              </button>
            </div>
          ) : isInvalid ? (
            // Invalid — retry + remove
            <div className="flex gap-2">
              {onRetry && (
                <button
                  onClick={() => { onRetry(doc); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Validation
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => { onRemove(doc); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          ) : isUnassigned ? (
            // Unassigned — assign + create new
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Assign to Record
              </button>
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1F3864] text-white hover:bg-[#162d54] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Create New Record
              </button>
            </div>
          ) : (
            // Assigned, not packaged — view record + package now
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Record
              </button>
              {onPackage && (
                <button
                  onClick={() => { onPackage(doc); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1F3864] text-white hover:bg-[#162d54] transition-colors"
                >
                  <Package className="w-3.5 h-3.5" /> Package Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
