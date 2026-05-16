/**
 * PipelineValidation — FC-1 Screen 1.4
 * Screen key: pipeline-validation
 * Route: /pipeline/validation
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * Prompt 1.4: Detailed validation view for a single staged document.
 *             Shows all 6 validation categories, OCR confidence, and
 *             per-page breakdown. Actions: Re-upload, Continue, Remove.
 * Data model refs: StagedDocument (validation_result, ocr_confidence_avg,
 *                  ocr_confidence_per_page, validation_warnings, validation_errors)
 */

import { useLocation } from 'wouter';
import {
  CheckCircle2, AlertTriangle, XCircle, FileText,
  BarChart2, ArrowLeft, RotateCcw, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';

// ─── Mock data — TODO: Backend integration required ───────────────────────────

interface PageOcr { page: number; confidence: number; }

interface ValidationDetail {
  id: string;
  display_name: string;
  file_size_bytes: number;
  mime_type: string;
  page_count: number;
  status: 'valid' | 'warning' | 'invalid';
  ocr_confidence_avg: number;
  ocr_confidence_per_page: PageOcr[];
  validation_result: {
    auth: boolean;
    file: boolean;
    security: boolean;
    quality: boolean;
    duplicate: boolean;
    contract_likeness: boolean;
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
  status: 'warning',
  ocr_confidence_avg: 0.68,
  ocr_confidence_per_page: [
    { page: 1, confidence: 0.91 },
    { page: 2, confidence: 0.88 },
    { page: 3, confidence: 0.75 },
    { page: 4, confidence: 0.62 },
    { page: 5, confidence: 0.55 },
    { page: 6, confidence: 0.48 },
    { page: 7, confidence: 0.71 },
    { page: 8, confidence: 0.83 },
  ],
  validation_result: {
    auth: true,
    file: true,
    security: true,
    quality: false,
    duplicate: true,
    contract_likeness: true,
  },
  validation_warnings: ['OCR confidence 68% — below recommended 80% threshold.'],
  validation_errors: [],
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Authentication',
  file: 'File Integrity',
  security: 'Security Scan',
  quality: 'OCR Quality',
  duplicate: 'Duplicate Check',
  contract_likeness: 'Contract Likeness',
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function getConfidenceClass(conf: number): string {
  if (conf >= 0.80) return 'confidence-high';
  if (conf >= 0.60) return 'confidence-medium';
  return 'confidence-low';
}

function getBarColor(conf: number): string {
  if (conf >= 0.80) return 'var(--color-lg-success)';
  if (conf >= 0.60) return 'var(--color-lg-warning)';
  return 'var(--color-lg-error)';
}

export default function PipelineValidation() {
  const _screenKey = SCREEN_KEYS.PIPELINE_VALIDATION;
  const [, navigate] = useLocation();

  // TODO: Backend integration required — GET /api/staged-documents/:id
  const doc = MOCK_DOC;

  const statusConfig = {
    valid:   { icon: <CheckCircle2 className="w-5 h-5" />, badgeClass: 'badge-valid',   label: 'Valid' },
    warning: { icon: <AlertTriangle className="w-5 h-5" />, badgeClass: 'badge-warning', label: 'Warning' },
    invalid: { icon: <XCircle className="w-5 h-5" />,       badgeClass: 'badge-invalid', label: 'Invalid' },
  }[doc.status];

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
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
            <h1 className="page-title">Validation Detail</h1>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded bg-muted/40 px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold">OCR Avg</p>
                <p className={`text-[18px] font-bold mt-0.5 ${doc.ocr_confidence_avg >= 0.80 ? 'text-[var(--color-lg-success)]' : doc.ocr_confidence_avg >= 0.60 ? 'text-[var(--color-lg-warning)]' : 'text-[var(--color-lg-error)]'}`}>
                  {Math.round(doc.ocr_confidence_avg * 100)}%
                </p>
              </div>
              <div className="rounded bg-muted/40 px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold">Pages</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">{doc.page_count}</p>
              </div>
              <div className="rounded bg-muted/40 px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] font-semibold">Checks</p>
                <p className="text-[18px] font-bold text-foreground mt-0.5">
                  {Object.values(doc.validation_result).filter(Boolean).length}/6
                </p>
              </div>
            </div>
          </div>

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
            </div>
            <div className="divide-y divide-border">
              {Object.entries(doc.validation_result).map(([key, passed]) => (
                <div key={key} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-lg-success)] shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--color-lg-error)] shrink-0" />
                    )}
                    <span className="text-[13px] font-medium text-foreground">{CATEGORY_LABELS[key]}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${passed ? 'badge-valid' : key === 'quality' ? 'badge-warning' : 'badge-invalid'}`}>
                    {passed ? 'Passed' : key === 'quality' ? 'Warning' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: OCR per-page chart */}
        <div className="w-72 flex flex-col gap-4">
          <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-foreground">OCR Confidence per Page</h2>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              {doc.ocr_confidence_per_page.map(p => (
                <div key={p.page} className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground w-12 shrink-0 font-mono">Pg {p.page}</span>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${p.confidence * 100}%`, backgroundColor: getBarColor(p.confidence) }}
                    />
                  </div>
                  <span className={`text-[12px] font-semibold w-10 text-right inline-flex items-center px-1.5 py-0.5 rounded ${getConfidenceClass(p.confidence)}`}>
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background: 'var(--color-lg-success)'}} /> ≥80%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background: 'var(--color-lg-warning)'}} /> 60–79%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background: 'var(--color-lg-error)'}} /> &lt;60%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4 flex flex-col gap-2">
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
