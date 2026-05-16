/**
 * PipelineUpload — FC-1 Screen 1.2
 * Screen key: pipeline-upload
 * Route: /pipeline/upload
 * Role: Document Submitter
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 * Prompt 1.2: Drag-drop upload zone, file validation cards (valid/warning/invalid),
 *             Target Context right panel, Continue to Review button.
 * Data model refs: StagedDocument (validation_result, validation_warnings, validation_errors,
 *                  ocr_confidence_avg, status: uploaded|validating|valid|warning|invalid)
 */

import { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, X, Plus, Info, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SCREEN_KEYS } from '@/constants/screenKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

type ValidationStatus = 'valid' | 'warning' | 'invalid' | 'validating';

interface ValidationCategory {
  name: string;
  passed: boolean;
  detail?: string;
}

interface StagedFile {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  status: ValidationStatus;
  ocr_confidence?: number;
  categories: ValidationCategory[];
  error?: string;
  warning?: string;
}

// ─── Mock staged files — TODO: Backend integration required ──────────────────

const MOCK_FILES: StagedFile[] = [
  {
    id: 'f1',
    name: 'Retail-HQ-Lease-2026.pdf',
    size: 4_200_000,
    mime_type: 'application/pdf',
    status: 'valid',
    ocr_confidence: 0.94,
    categories: [
      { name: 'File Format', passed: true },
      { name: 'File Integrity', passed: true },
      { name: 'Security Scan', passed: true },
      { name: 'OCR Quality', passed: true, detail: '94% confidence' },
      { name: 'Duplicate Check', passed: true },
      { name: 'Contract Likeness', passed: true, detail: 'Lease document detected' },
    ],
  },
  {
    id: 'f2',
    name: 'Office-Tower-Amendment-3.pdf',
    size: 1_800_000,
    mime_type: 'application/pdf',
    status: 'warning',
    ocr_confidence: 0.68,
    warning: 'OCR confidence 68% — below recommended threshold.',
    categories: [
      { name: 'File Format', passed: true },
      { name: 'File Integrity', passed: true },
      { name: 'Security Scan', passed: true },
      { name: 'OCR Quality', passed: false, detail: 'Confidence 68% — below 80% threshold' },
      { name: 'Duplicate Check', passed: true },
      { name: 'Contract Likeness', passed: true },
    ],
  },
  {
    id: 'f3',
    name: 'Corrupted-Scan-Draft.pdf',
    size: 320_000,
    mime_type: 'application/pdf',
    status: 'invalid',
    error: 'Corrupted PDF header — file cannot be parsed.',
    categories: [
      { name: 'File Format', passed: true },
      { name: 'File Integrity', passed: false, detail: 'Corrupted PDF header' },
      { name: 'Security Scan', passed: true },
      { name: 'OCR Quality', passed: false, detail: 'Cannot process — file corrupted' },
      { name: 'Duplicate Check', passed: true },
      { name: 'Contract Likeness', passed: false, detail: 'Unable to classify' },
    ],
  },
];

const WORKSPACE_TAGS = [
  'Q1-2026-Retail',
  'Q1-2026-Office',
  'Q1-2026-Industrial',
  'Q2-2026-Land',
  'Q2-2026-Retail',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ─── File validation card ─────────────────────────────────────────────────────

interface FileCardProps {
  file: StagedFile;
  onRemove: (id: string) => void;
}

function FileCard({ file, onRemove }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    valid:      { icon: <CheckCircle2 className="w-4 h-4" />, badgeClass: 'badge-valid',    label: 'Valid' },
    warning:    { icon: <AlertTriangle className="w-4 h-4" />, badgeClass: 'badge-warning', label: 'Warning' },
    invalid:    { icon: <XCircle className="w-4 h-4" />,       badgeClass: 'badge-invalid', label: 'Invalid' },
    validating: { icon: <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />, badgeClass: 'badge-processing', label: 'Validating' },
  }[file.status];

  const borderColorStyle = {
    valid:      { borderLeftColor: 'var(--color-lg-success)' },
    warning:    { borderLeftColor: 'var(--color-lg-warning)' },
    invalid:    { borderLeftColor: 'var(--color-lg-error)' },
    validating: { borderLeftColor: 'var(--color-lg-primary-light)' },
  }[file.status];

  return (
    <div
      className="rounded-lg bg-card border border-border shadow-sm overflow-hidden"
      style={{ borderLeftWidth: '3px', ...borderColorStyle }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">{file.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${statusConfig.badgeClass}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onRemove(file.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {file.status === 'warning' && file.warning && (
        <div className="mx-4 mb-3 px-3 py-2 rounded bg-amber-50 border border-amber-200 text-[12px] text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{file.warning}</span>
            <span className="ml-1 text-amber-700">Warnings don't block submission.</span>
          </div>
        </div>
      )}

      {file.status === 'invalid' && file.error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded bg-red-50 border border-red-200 text-[12px] text-red-800 flex items-start gap-2">
          <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{file.error}</span>
            <span className="ml-1 text-red-700">Cannot be submitted.</span>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-2">
            Validation Checks
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {file.categories.map(cat => (
              <div key={cat.name} className="flex items-start gap-2 text-[12px]">
                {cat.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-lg-success)] mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-[var(--color-lg-error)] mt-0.5 shrink-0" />
                )}
                <div>
                  <span className={cat.passed ? 'text-foreground' : 'text-destructive font-medium'}>{cat.name}</span>
                  {cat.detail && <p className="text-[11px] text-muted-foreground">{cat.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineUpload() {
  const _screenKey = SCREEN_KEYS.PIPELINE_UPLOAD;

  const [, navigate] = useLocation();
  const [files, setFiles] = useState<StagedFile[]>(MOCK_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const [workspaceTag, setWorkspaceTag] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validFiles = files.filter(f => f.status === 'valid' || f.status === 'warning');
  const invalidFiles = files.filter(f => f.status === 'invalid');
  const canContinue = validFiles.length > 0 && workspaceTag !== '';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // TODO: Backend integration required — upload dropped files via POST /api/staged-documents
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Files</h1>
          <p className="page-subtitle">Step 1 of 2 — Upload and validate documents</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6">
        {/* Left: Upload zone + file list */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-accent border border-border text-[13px] text-accent-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong>Step 1 of 2:</strong> Select workspace context now. Contract record is selected during Document Understanding.
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-12 gap-4 transition-all duration-150 cursor-pointer
              ${isDragging
                ? 'border-primary bg-accent/60 scale-[1.01]'
                : 'border-border bg-card hover:border-primary/50 hover:bg-accent/20'}
            `}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
              <UploadCloud className={`w-8 h-8 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-foreground">Drop PDF, JPG, PNG, or TIFF files here</p>
              <p className="text-[13px] text-muted-foreground mt-1">Maximum 100 MB per file</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
              className="hidden"
              onChange={() => { /* TODO: Backend integration required */ }}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-foreground">Files ({files.length})</h2>
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-lg-success)]" />
                    {files.filter(f => f.status === 'valid').length} valid
                  </span>
                  {files.filter(f => f.status === 'warning').length > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" />
                      {files.filter(f => f.status === 'warning').length} warning
                    </span>
                  )}
                  {invalidFiles.length > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-[var(--color-lg-error)]" />
                      {invalidFiles.length} invalid
                    </span>
                  )}
                </div>
              </div>
              {files.map(file => (
                <FileCard key={file.id} file={file} onRemove={handleRemove} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Target Context panel */}
        <div className="w-72 flex flex-col gap-4">
          <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Target Context
              </h2>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] block mb-1.5">
                  Workspace Tag <span className="text-destructive">*</span>
                </label>
                {isCreatingTag ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New tag name..."
                      className="flex-1 h-9 px-3 rounded border border-input bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                      autoFocus
                      onBlur={() => setIsCreatingTag(false)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') setIsCreatingTag(false);
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) setWorkspaceTag(val);
                          setIsCreatingTag(false);
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => setIsCreatingTag(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Select value={workspaceTag} onValueChange={setWorkspaceTag}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="Select workspace tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_TAGS.map(tag => (
                        <SelectItem key={tag} value={tag} className="text-[13px]">{tag}</SelectItem>
                      ))}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={() => setIsCreatingTag(true)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-primary hover:bg-accent rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create new tag
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                )}
                {workspaceTag && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    All files tagged to <strong>{workspaceTag}</strong>.
                  </p>
                )}
              </div>
              <div className="rounded bg-muted/40 border border-border px-3 py-2 text-[12px] text-muted-foreground">
                <p className="font-medium text-foreground mb-0.5">Contract Record</p>
                <p>Selected during Document Understanding (Step 2).</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">
                Submission Summary
              </p>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total files</span>
                  <span className="font-medium text-foreground">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submittable</span>
                  <span className="font-medium text-[var(--color-lg-success)]">{validFiles.length}</span>
                </div>
                {invalidFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blocked</span>
                    <span className="font-medium text-[var(--color-lg-error)]">{invalidFiles.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {!workspaceTag
            ? 'Select a workspace tag to continue.'
            : validFiles.length === 0
            ? 'No submittable files — remove invalid files or upload new ones.'
            : `${validFiles.length} file${validFiles.length !== 1 ? 's' : ''} ready to continue.`}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/pipeline/dashboard')}>Cancel</Button>
          <Button
            disabled={!canContinue}
            onClick={() => navigate('/pipeline/review')}
            title={!canContinue ? 'Select a workspace tag and ensure at least one valid file.' : undefined}
          >
            Continue to Review
          </Button>
        </div>
      </div>
    </div>
  );
}
