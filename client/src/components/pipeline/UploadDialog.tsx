/**
 * UploadDialog — inline dialog version of PipelineUpload (FC-1 Screen 1.2)
 *
 * File lifecycle:
 *   uploading → validating → valid | invalid
 *
 * Deterministic invalid rule:
 *   filename (lowercased) contains 'corrupt', 'invalid', 'error', 'bad', 'scan_fail'
 *   → invalid; otherwise → valid
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import {
  UploadCloud, FileText, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, X, Info, Tag, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidationStatus = 'uploading' | 'validating' | 'valid' | 'invalid';

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
  uploadProgress: number;   // 0–100
  ocr_confidence?: number;
  categories: ValidationCategory[];
  error?: string;
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

const INVALID_KEYWORDS = ['corrupt', 'invalid', 'error', 'bad', 'scan_fail'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function isInvalidFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return INVALID_KEYWORDS.some(kw => lower.includes(kw));
}

function makeStagedFile(name: string, size: number, mime: string): StagedFile {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    size,
    mime_type: mime,
    status: 'uploading',
    uploadProgress: 0,
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
}

function FileCard({ file, onRemove }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    uploading:  { icon: <Loader2 className="w-4 h-4 animate-spin" />, badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',     label: 'Uploading' },
    validating: { icon: <Loader2 className="w-4 h-4 animate-spin" />, badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',   label: 'Validating' },
    valid:      { icon: <CheckCircle2 className="w-4 h-4" />,          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Valid' },
    invalid:    { icon: <XCircle className="w-4 h-4" />,               badgeClass: 'bg-red-50 text-red-700 border border-red-200',         label: 'Invalid' },
  }[file.status];

  const borderColorStyle = {
    uploading:  { borderLeftColor: '#93c5fd' },
    validating: { borderLeftColor: '#fbbf24' },
    valid:      { borderLeftColor: 'var(--color-lg-success)' },
    invalid:    { borderLeftColor: 'var(--color-lg-error)' },
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
        {(file.status === 'valid' || file.status === 'invalid') && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? 'Collapse' : 'Expand validation checks'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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

      {/* Upload progress bar */}
      {file.status === 'uploading' && (
        <div className="mx-4 mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${file.uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{file.uploadProgress}%</p>
        </div>
      )}

      {/* Error message */}
      {file.status === 'invalid' && file.error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded bg-red-50 border border-red-200 text-[12px] text-red-800 flex items-start gap-2">
          <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{file.error}</span>
            <span className="ml-1 text-red-700">Cannot be submitted.</span>
          </div>
        </div>
      )}

      {/* Validation checks */}
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
  /** Called with valid files when user clicks "Add to Pipeline" */
  onConfirm: (files: StagedFile[], workspaceTag: string) => void;
}

export function UploadDialog({ open, onClose, onConfirm }: UploadDialogProps) {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [workspaceTag, setWorkspaceTag] = useState(
    () => localStorage.getItem('leasegov_last_workspace') ?? ''
  );
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const pendingCount = files.filter(f => f.status === 'uploading' || f.status === 'validating').length;
  const validFiles   = files.filter(f => f.status === 'valid');
  const invalidFiles = files.filter(f => f.status === 'invalid');
  // Enabled only when no files are pending AND at least one valid file exists
  const canConfirm   = pendingCount === 0 && validFiles.length > 0 && workspaceTag !== '';

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
    if (open) {
      setFiles([]);
      // Clear any running timers
      progressTimers.current.forEach(t => clearInterval(t));
      progressTimers.current.clear();
    }
  }, [open]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      progressTimers.current.forEach(t => clearInterval(t));
    };
  }, []);

  function simulateFileLifecycle(fileId: string, fileName: string) {
    const willBeInvalid = isInvalidFilename(fileName);
    // Step 1: Animate upload progress 0→100 over ~1000ms
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        progressTimers.current.delete(`progress-${fileId}`);
        // Step 2: Transition to validating
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'validating', uploadProgress: 100 } : f
        ));
        // Step 3: Resolve after 2000–3000ms
        const delay = 2000 + Math.random() * 1000;
        const resolveTimer = setTimeout(() => {
          progressTimers.current.delete(`resolve-${fileId}`);
          setFiles(prev => prev.map(f => {
            if (f.id !== fileId) return f;
            if (willBeInvalid) {
              return {
                ...f,
                status: 'invalid' as ValidationStatus,
                error: 'File failed security scan',
                categories: f.categories.map(c => ({
                  ...c,
                  passed: c.name !== 'Security Scan',
                  detail: c.name === 'Security Scan' ? 'Scan failed' : c.detail,
                })),
              };
            }
            return {
              ...f,
              status: 'valid' as ValidationStatus,
              ocr_confidence: 0.9,
              categories: f.categories.map(c => ({
                ...c,
                passed: true,
                detail: c.name === 'OCR Quality' ? '90% confidence' : c.name === 'Contract Likeness' ? 'Score: 0.94' : c.detail,
              })),
            };
          }));
        }, delay);
        progressTimers.current.set(`resolve-${fileId}`, resolveTimer as unknown as ReturnType<typeof setInterval>);
      } else {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, uploadProgress: progress } : f
        ));
      }
    }, 80);
    progressTimers.current.set(`progress-${fileId}`, progressInterval);
  }

  const addFiles = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    const newFiles = rawFiles.map(f => makeStagedFile(f.name, f.size, f.type || 'application/octet-stream'));
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(sf => simulateFileLifecycle(sf.id, sf.name));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }, [addFiles]);

  const handleRemove = useCallback((id: string) => {
    // Cancel any running timers for this file
    progressTimers.current.forEach((_, key) => {
      if (key.includes(id)) {
        clearInterval(progressTimers.current.get(key)!);
        progressTimers.current.delete(key);
      }
    });
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleConfirm = useCallback(() => {
    const toSubmit = validFiles.map(f => ({ ...f, workspace_tag: workspaceTag }));
    onConfirm(toSubmit, workspaceTag);
    onClose();
  }, [validFiles, workspaceTag, onConfirm, onClose]);

  const allTags = [...WORKSPACE_TAGS, ...customTags];

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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-semibold text-foreground">Upload Files</h2>
              <ScreenNumberBadge screenKey="pipeline-upload" />
            </div>
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
              <span>Accepted formats: PDF, TIFF, DOCX, XLSX — max 50 MB per file.</span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="text-[14px] font-medium text-foreground">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.tiff,.tif,.docx,.xlsx"
                className="hidden"
                onChange={handleBrowse}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {files.map(f => (
                  <FileCard key={f.id} file={f} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Target context + summary */}
          <div className="w-64 shrink-0 flex flex-col gap-4">
            {/* Workspace tag */}
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">Target Context</span>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  Workspace Tag
                </label>
                {isCreatingTag ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          const tag = newTagInput.trim();
                          setCustomTags(prev => [...prev, tag]);
                          setWorkspaceTag(tag);
                          setNewTagInput('');
                          setIsCreatingTag(false);
                        } else if (e.key === 'Escape') {
                          setIsCreatingTag(false);
                          setNewTagInput('');
                        }
                      }}
                      placeholder="New tag…"
                      className="flex-1 text-[12px] px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => { setIsCreatingTag(false); setNewTagInput(''); }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Select value={workspaceTag} onValueChange={setWorkspaceTag}>
                    <SelectTrigger className="h-8 text-[12px]">
                      <SelectValue placeholder="Select workspace…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTags.map(t => (
                        <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <button
                  onClick={() => setIsCreatingTag(true)}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  + Create new tag
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-foreground">Submission Summary</span>
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Total files</span>
                <span className="font-medium">{files.length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Uploading</span>
                <span className="font-medium text-blue-600">{files.filter(f => f.status === 'uploading').length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Validating</span>
                <span className="font-medium text-amber-600">{files.filter(f => f.status === 'validating').length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Valid</span>
                <span className="font-medium text-emerald-600">{validFiles.length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-muted-foreground">Invalid</span>
                <span className="font-medium text-red-600">{invalidFiles.length}</span>
              </div>
              {!workspaceTag && files.length > 0 && (
                <p className="text-[11px] text-amber-600 mt-1">⚠ Select a workspace tag to continue.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <div className="text-[12px] text-muted-foreground">
            {pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Validating {pendingCount} file{pendingCount !== 1 ? 's' : ''}… please wait
              </span>
            ) : files.length > 0 ? (
              <span>{validFiles.length} valid · {invalidFiles.length} invalid</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} className="h-8 text-[13px]">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="h-8 text-[13px]"
              title={
                pendingCount > 0 ? 'Wait for validation to complete' :
                validFiles.length === 0 ? 'No valid files to add' :
                !workspaceTag ? 'Select a workspace tag first' : undefined
              }
            >
              Add to Pipeline ({validFiles.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
