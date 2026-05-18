/**
 * UploadDialog — inline dialog version of PipelineUpload (FC-1 Screen 1.2)
 *
 * Props:
 *   open        — controls visibility
 *   onClose     — called when user cancels or closes
 *   onConfirm   — called with the list of valid/warning StagedFile entries
 *                 so the parent can append them to stagedDocs
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, X, Plus, Info, Tag, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidationStatus = 'valid' | 'warning' | 'invalid' | 'validating';

export interface ValidationCategory {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface StagedFile {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  status: ValidationStatus;
  ocr_confidence?: number;
  categories: ValidationCategory[];
  error?: string;
  warning?: string;
  workspace_tag?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

function makeMockFile(name: string, size: number, mime: string): StagedFile {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    size,
    mime_type: mime,
    status: 'validating',
    categories: [
      { name: 'File Format',       passed: true },
      { name: 'File Integrity',    passed: true },
      { name: 'Security Scan',     passed: true },
      { name: 'OCR Quality',       passed: true, detail: 'Pending…' },
      { name: 'Duplicate Check',   passed: true },
      { name: 'Contract Likeness', passed: true, detail: 'Pending…' },
    ],
  };
}

// ─── FileCard ─────────────────────────────────────────────────────────────────

interface FileCardProps {
  file: StagedFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

function FileCard({ file, onRemove, onRetry }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    valid:      { icon: <CheckCircle2 className="w-4 h-4" />, badgeClass: 'badge-valid',       label: 'Valid' },
    warning:    { icon: <AlertTriangle className="w-4 h-4" />, badgeClass: 'badge-warning',    label: 'Warning' },
    invalid:    { icon: <XCircle className="w-4 h-4" />,       badgeClass: 'badge-invalid',    label: 'Invalid' },
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
          title={expanded ? 'Collapse' : 'Expand validation checks'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {file.status === 'invalid' && (
          <button
            onClick={() => onRetry(file.id)}
            className="p-1 rounded hover:bg-amber-100 text-amber-600 hover:text-amber-700 transition-colors"
            title="Retry validation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(file.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove file"
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

// ─── UploadDialog ─────────────────────────────────────────────────────────────

export interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with valid/warning files when user clicks "Add to Pipeline" */
  onConfirm: (files: StagedFile[], workspaceTag: string) => void;
}

export function UploadDialog({ open, onClose, onConfirm }: UploadDialogProps) {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [workspaceTag, setWorkspaceTag] = useState(
    () => localStorage.getItem('leasegov_last_workspace') ?? ''
  );
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track how many files are still being validated so we can show a spinner
  const pendingCount = files.filter(f => f.status === 'validating').length;

  // Persist workspace selection
  useEffect(() => {
    if (workspaceTag) localStorage.setItem('leasegov_last_workspace', workspaceTag);
  }, [workspaceTag]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset files when dialog opens
  useEffect(() => {
    if (open) setFiles([]);
  }, [open]);

  // Include still-validating files as submittable (they will be treated as valid on confirm)
  const validFiles  = files.filter(f => f.status === 'valid' || f.status === 'warning' || f.status === 'validating');
  const invalidFiles = files.filter(f => f.status === 'invalid');
  // Can confirm if there are any non-invalid files and a workspace tag is set
  const canConfirm  = validFiles.length > 0 && workspaceTag !== '';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    const newFiles = dropped.map(f => makeMockFile(f.name, f.size, f.type || 'application/octet-stream'));
    setFiles(prev => [...prev, ...newFiles]);
    // Simulate validation after 1.5s
    setTimeout(() => {
      setFiles(prev => prev.map(sf => {
        if (sf.status !== 'validating') return sf;
        const pass = Math.random() > 0.2;
        return pass
          ? { ...sf, status: 'valid' as ValidationStatus, ocr_confidence: 0.9, categories: sf.categories.map(c => ({ ...c, passed: true, detail: c.name === 'OCR Quality' ? '90% confidence' : c.detail })) }
          : { ...sf, status: 'warning' as ValidationStatus, warning: 'OCR confidence below recommended threshold.', categories: sf.categories.map(c => ({ ...c, passed: c.name !== 'OCR Quality', detail: c.name === 'OCR Quality' ? 'Confidence below 80%' : c.detail })) };
      }));
    }, 1500);
  }, []);

  const handleBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    const newFiles = selected.map(f => makeMockFile(f.name, f.size, f.type || 'application/octet-stream'));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
    setTimeout(() => {
      setFiles(prev => prev.map(sf => {
        if (sf.status !== 'validating') return sf;
        const pass = Math.random() > 0.2;
        return pass
          ? { ...sf, status: 'valid' as ValidationStatus, ocr_confidence: 0.9, categories: sf.categories.map(c => ({ ...c, passed: true, detail: c.name === 'OCR Quality' ? '90% confidence' : c.detail })) }
          : { ...sf, status: 'warning' as ValidationStatus, warning: 'OCR confidence below recommended threshold.', categories: sf.categories.map(c => ({ ...c, passed: c.name !== 'OCR Quality', detail: c.name === 'OCR Quality' ? 'Confidence below 80%' : c.detail })) };
      }));
    }, 1500);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleRetry = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'validating' as ValidationStatus, error: undefined } : f));
    setIsValidating(true);
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === id
        ? { ...f, status: 'warning' as ValidationStatus, warning: 'Re-validation complete — review warnings before submitting.' }
        : f
      ));
      setIsValidating(false);
    }, 2000);
  }, []);

  const handleConfirm = useCallback(() => {
    // Treat any still-validating files as valid so they always appear in the table
    const toSubmit = validFiles.map(f => ({
      ...f,
      status: (f.status === 'validating' ? 'valid' : f.status) as ValidationStatus,
      workspace_tag: workspaceTag,
    }));
    onConfirm(toSubmit, workspaceTag);
    onClose();
  }, [validFiles, workspaceTag, onConfirm, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-6 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-4xl bg-[var(--color-lg-page-bg)] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Upload Files</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Step 1 of 2 — Upload and validate documents before adding to the pipeline.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 gap-6 p-6 min-h-0">
          {/* Left: Upload zone + file list */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-accent border border-border text-[13px] text-accent-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>
                <strong>Step 1 of 2:</strong> Select workspace context now. Contract record is selected during Document Understanding.
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 transition-all duration-150 cursor-pointer
                ${isDragging
                  ? 'border-primary bg-accent/60 scale-[1.01]'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-accent/20'}
              `}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                <UploadCloud className={`w-7 h-7 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-foreground">Drop PDF, JPG, PNG, or TIFF files here</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Maximum 100 MB per file</p>
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
                onChange={handleBrowse}
              />
            </div>

            {/* File cards */}
            {files.length > 0 && (
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-foreground">Files ({files.length})</h3>
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
                  <FileCard key={file.id} file={file} onRemove={handleRemove} onRetry={handleRetry} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Target Context + Summary */}
          <div className="w-64 flex flex-col gap-4 shrink-0">
            <div className="rounded-lg bg-card border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Target Context
                </h3>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] block mb-1.5">
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
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">
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

        {/* Footer */}
        <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            {!workspaceTag
              ? 'Select a workspace tag to continue.'
              : files.length === 0
              ? 'Drop or browse files to begin.'
              : validFiles.length === 0
              ? 'No submittable files — remove invalid files or upload new ones.'
              : `${validFiles.length} file${validFiles.length !== 1 ? 's' : ''} ready to add to the pipeline.`}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!canConfirm}
              onClick={handleConfirm}
              title={!canConfirm ? 'Select a workspace tag and ensure at least one valid file.' : undefined}
              className="gap-2"
            >
              {pendingCount > 0
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <UploadCloud className="w-4 h-4" />}
              {pendingCount > 0 ? `Validating… (${pendingCount})` : 'Add to Pipeline'}
            </Button>
          </div>
        </div>
      </div>

      {/* Re-validating overlay */}
      {isValidating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-lg bg-background border border-border px-5 py-3.5 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[13px] font-medium text-foreground">Re-validating file…</span>
          </div>
        </div>
      )}
    </div>
  );
}
