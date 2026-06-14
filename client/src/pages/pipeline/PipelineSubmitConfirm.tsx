/**
 * PipelineSubmitConfirm — FC-1 Screen 1.6
 * Screen key: pipeline-submit-confirm
 * Route: /pipeline/confirm
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * Prompt 1.6: Submission confirmation screen.
 *   Pre-submission state: centered card 600px, mode badge, file count,
 *   batch ID (JetBrains Mono), file table with Valid/Warning badges,
 *   green pre-check, amber read-only warning, Confirm + Back buttons.
 *   Success state: large success icon, "Submission Complete", Batch ID,
 *   "View in Processing Queue" link.
 * Data model refs: IntakeBatch (batch_reference, submission_mode, document_count, status),
 *                  StagedDocument (display_name, status, document_role)
 *
 * Navigation state (from PipelineReviewGrouping):
 *   extractionFiles: ConfirmFile[]
 *   packageName: string
 *   submissionMode: 'Single Contract' | 'Contract Package'
 *   selectedFileNames: string[]  — used to restore Review & Group on Back
 */

import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  CheckCircle2, AlertTriangle, ArrowLeft, Send,
  FileText, Layers, Lock, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { publishEvent } from '../../lib/eventBus';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConfirmFile {
  id: string;
  display_name: string;
  document_role: string;
  status: 'valid' | 'invalid' | 'warning';
  page_count: number;
  file_size_bytes: number;
}

interface ConfirmNavState {
  extractionFiles?: ConfirmFile[];
  packageName?: string;
  submissionMode?: string;
  selectedFileNames?: string[];
}

// ─── Fallback mock data (used only when navigated to directly) ────────────────

const MOCK_FILES: ConfirmFile[] = [
  { id: 'f1', display_name: 'Retail-HQ-Lease-2026.pdf',        document_role: 'Base Contract', status: 'valid',   page_count: 24, file_size_bytes: 4_200_000 },
  { id: 'f2', display_name: 'Office-Tower-Amendment-3.pdf',     document_role: 'Amendment',     status: 'warning', page_count: 8,  file_size_bytes: 1_800_000 },
  { id: 'f3', display_name: 'Warehouse-Lease-Exhibit-A.tiff',   document_role: 'Exhibit',       status: 'valid',   page_count: 12, file_size_bytes: 6_100_000 },
  { id: 'f5', display_name: 'Ground-Lease-Base-Contract.pdf',   document_role: 'Base Contract', status: 'valid',   page_count: 41, file_size_bytes: 9_400_000 },
];

const MODE_LABELS: Record<string, string> = {
  'Single Contract':  'Single Contract',
  'Contract Package': 'Contract Package',
  single_contract:    'Single Contract',
  contract_package:   'Contract Package',
  bulk_batch:         'Bulk Batch',
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineSubmitConfirm() {
  const _screenKey = SCREEN_KEYS.PIPELINE_SUBMIT_CONFIRM;
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read state passed by PipelineReviewGrouping
  const navState = (window.history.state ?? {}) as ConfirmNavState;
  const files: ConfirmFile[] = navState.extractionFiles?.length
    ? navState.extractionFiles
    : MOCK_FILES;
  const packageName = navState.packageName ?? 'Contract Package';
  const submissionMode = navState.submissionMode ?? (files.length >= 2 ? 'Contract Package' : 'Single Contract');
  const selectedFileNames = navState.selectedFileNames ?? [];

  const batchReferenceRef = useRef<string>(
    `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const batchReference = batchReferenceRef.current;
  const warningCount = files.filter(f => f.status === 'warning').length;

  function handleBack() {
    // Restore the Review & Group page with the original file list.
    // Use wouter's state option — a separate pushState before navigate() would be
    // overwritten by wouter's own pushState call.
    navigate('/pipeline/review', { state: { selectedFileNames } } as any);
  }

  function handleConfirm() {
    setIsSubmitting(true);
    // DEMO ONLY: notify Preparer tab that a new batch is ready for extraction.
    // PRODUCTION: replace with: await api.post('/api/v1/intake-batches/${batchReference}/submit')
    // DEMO ONLY: read workspace preference from localStorage so ExtractionQueue can show WorkspaceBadge.
    // PRODUCTION: workspace is stored on the submission record and returned by the backend.
    const workspace = localStorage.getItem('leasegov_user_workspace') ?? undefined;
    publishEvent({
      type: 'BATCH_SUBMITTED',
      payload: {
        batchId: batchReference,
        packageNum: packageName ?? batchReference,
        workspace,
      },
      sourceRole: 'document_submitter',
    });
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      // DEMO ONLY: clear staged docs from PipelineDashboard after submission.
      // PRODUCTION: replace with query invalidation after the submit API call resolves.
      publishEvent({
        type: 'PIPELINE_BATCH_CLEARED',
        payload: {
          fileNames: selectedFileNames,
          batchId: batchReference,
        },
        sourceRole: 'document_submitter',
      });
    }, 1200);
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-lg-page-bg)] flex items-center justify-center p-6">
        <div className="w-full max-w-[600px] rounded-xl bg-card border border-border shadow-xl text-center px-8 py-12 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[var(--color-lg-success)]" />
          </div>
          <h2 className="text-[24px] font-bold text-foreground mb-2">Submission Complete</h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            Your documents have been submitted and are now queued for processing.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border mb-8">
            <span className="text-[12px] text-muted-foreground">Batch ID</span>
            <span className="font-mono text-[14px] font-semibold text-primary">{batchReference}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/pipeline/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              className="gap-2"
              onClick={() => navigate('/extraction/queue')}
            >
              <ExternalLink className="w-4 h-4" />
              View in Processing Queue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pre-submission state ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-lg-page-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-[600px] rounded-xl bg-card border border-border shadow-xl overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-semibold text-foreground">Confirm Submission</h2>
            <ScreenNumberBadge screenKey={_screenKey} />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-accent border border-border text-[12px] font-semibold text-primary">
            <Layers className="w-3.5 h-3.5" />
            {MODE_LABELS[submissionMode] ?? submissionMode}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Batch summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold mb-1">Files</p>
              <p className="text-[22px] font-bold text-foreground">{files.length}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold mb-1">Package</p>
              <p className="text-[12px] font-semibold text-foreground mt-1 truncate" title={packageName}>{packageName}</p>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold mb-1">Batch ID</p>
              <p className="font-mono text-[11px] font-semibold text-primary mt-1">{batchReference}</p>
            </div>
          </div>

          {/* File table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">File</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Pages</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[180px]" title={file.display_name}>
                          {file.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">
                      {typeof file.document_role === 'string'
                        ? file.document_role.replace(/_/g, ' ')
                        : file.document_role}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{file.page_count}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        file.status === 'valid'   ? 'badge-valid' :
                        file.status === 'warning' ? 'badge-warning' :
                        'badge-invalid'
                      }`}>
                        {file.status === 'valid'
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <AlertTriangle className="w-3 h-3" />}
                        {file.status === 'valid' ? 'Valid' : file.status === 'warning' ? 'Warning' : 'Invalid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pre-check */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-[13px] text-green-800">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {warningCount > 0
                ? `${warningCount} warning${warningCount > 1 ? 's' : ''} noted — submission is not blocked.`
                : 'All validation checks passed. Files are ready for processing.'}
            </span>
          </div>

          {/* Read-only warning */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>After submission, files become read-only.</strong> Document names and roles cannot be changed once submitted.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <Button
            className="gap-2 min-w-[160px]"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm Submission
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
