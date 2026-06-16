/**
 * PipelineValidation — FC-1 Screen 1.4
 * Screen key: pipeline-validation
 * Route: /pipeline/validation
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * Prompt 1.4: Detailed validation view for a single staged document.
 *             V3 model: four synchronous upload-time checks only.
 *             No OCR (OCR runs in Stage 2, Preparer-triggered extraction).
 *             No contract-likeness scoring.
 *             Actions: Re-upload, Continue, Remove.
 * Data model refs: StagedDocument (validation_result, validation_warnings,
 *                  validation_errors)
 */

import { useLocation } from 'wouter';
import {
  CheckCircle2, AlertTriangle, XCircle, FileText,
  ArrowLeft, RotateCcw, ArrowRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Mock data — TODO: Backend integration required ───────────────────────────

interface ValidationDetail {
  id: string;
  display_name: string;
  file_size_bytes: number;
  mime_type: string;
  page_count: number;
  status: 'valid' | 'invalid';
  validation_result: {
    format: boolean;
    size: boolean;
    duplicate: boolean;
    integrity: boolean;
  };
  validation_warnings: string[];
  validation_errors: string[];
}

const MOCK_DOC: ValidationDetail = {
  id: 'f2',
  display_name: 'Office-Tower-Amendment-3.pdf',
  file_size_bytes: 1_800_000,
  mime_type: 'application/pdf',
  page_count: 8,
  status: 'valid',
  validation_result: {
    format: true,
    size: true,
    duplicate: true,
    integrity: true,
  },
  validation_warnings: [],
  validation_errors: [],
};

const CATEGORY_LABELS: Record<string, string> = {
  format:    'File Format',
  size:      'File Size',
  duplicate: 'Duplicate Check',
  integrity: 'File Integrity',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  format:    'File type is PDF, DOCX, JPG, PNG, or TIFF',
  size:      'File is within the 100 MB per-file limit',
  duplicate: 'No matching file hash found in staged or committed documents',
  integrity: 'File can be opened and is well-formed',
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function PipelineValidation() {
  const _screenKey = SCREEN_KEYS.PIPELINE_VALIDATION;
  const [, navigate] = useLocation();

  // TODO: Backend integration required — GET /api/staged-documents/:id
  const doc = MOCK_DOC;

  const passedCount = Object.values(doc.validation_result).filter(Boolean).length;
  const totalCount  = Object.keys(doc.validation_result).length;

  const statusConfig = {
    valid:   { icon: <CheckCircle2 className="w-5 h-5" />, badgeClass: 'badge-valid',   label: 'Valid' },
    invalid: { icon: <XCircle className="w-5 h-5" />,       badgeClass: 'badge-invalid', label: 'Invalid' },
  }[doc.status];

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pipeline/upload')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Validation Detail</h1>
              <ScreenNumberBadge screenKey="pipeline-validation" />
            </div>
            <p className="page-subtitle">Reviewing: {doc.display_name}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-semibold ${statusConfig.badgeClass}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      <div className="flex gap-6 p-6">
        {/* Left: Validation categories */}
        <div className="flex-1 flex flex-col gap-4">

          {/* File meta */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{doc.display_name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {formatBytes(doc.file_size_bytes)} · {doc.page_count} pages · PDF
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-muted/40 px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold">Pages</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">{doc.page_count}</p>
              </div>
              <div className="rounded bg-muted/40 px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold">Checks</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">
                  {passedCount}/{totalCount}
                </p>
              </div>
            </div>
          </div>

          {/* Errors */}
          {doc.validation_errors.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-800">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {doc.validation_errors.map((e, i) => <p key={i}>{e}</p>)}
                <p className="mt-1 text-red-700 text-[12px]">This file cannot be submitted.</p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {doc.validation_warnings.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                {doc.validation_warnings.map((w, i) => <p key={i}>{w}</p>)}
                <p className="mt-1 text-amber-700 text-[12px]">Warnings don't block submission.</p>
              </div>
            </div>
          )}

          {/* Validation categories */}
          <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-foreground">Validation Checks</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Four synchronous checks run at upload time. OCR and field extraction run later when a Preparer processes the document.
              </p>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(doc.validation_result).map(([key, passed]) => (
                <div key={key} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-lg-success)] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--color-lg-error)] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{CATEGORY_LABELS[key]}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[key]}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ml-4 ${passed ? 'badge-valid' : 'badge-invalid'}`}>
                    {passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* OCR note */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-muted/40 border border-border text-[12px] text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              OCR confidence and field extraction quality are assessed by the Preparer during the extraction step, after this document is packaged and submitted for processing.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-64 flex flex-col gap-4">
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4 flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-foreground mb-1">Actions</p>
            <Button
              variant="outline"
              className="w-full gap-2 text-[13px]"
              onClick={() => { /* TODO: Backend integration required — re-upload flow */ }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-upload File
            </Button>
            <Button
              className="w-full gap-2 text-[13px]"
              onClick={() => navigate('/pipeline/review')}
            >
              Continue to Review
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
