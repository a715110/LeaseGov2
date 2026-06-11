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
 * Animation system:
 *   uploading  — shimmer progress bar + blue pulsing border
 *   validating — amber scanning sweep + bouncing dots
 *   valid      — spring-scale checkmark entrance + emerald flash on border
 *   invalid    — shake + red X entrance
 *   card entry — slide-up fade-in with stagger
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
import {
  type ValidationStatus,
  type ValidationCategory,
  type StagedFile,
  WORKSPACE_TAGS,
  formatBytes,
  isInvalidFilename,
  makeStagedFile,
  injectAnimationStyles,
  simulateFileLifecycle,
} from '@/lib/uploadSimulation';

// Re-export types so existing importers of UploadDialog continue to work
export type { ValidationStatus, ValidationCategory, StagedFile };

// Animation styles and injectAnimationStyles are imported from @/lib/uploadSimulation

// ─── BouncingDots ─────────────────────────────────────────────────────────────

function BouncingDots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-amber-500 inline-block"
          style={{ animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

// ─── FileCard ─────────────────────────────────────────────────────────────────

interface FileCardProps {
  file: StagedFile;
  index: number;
  onRemove: (id: string) => void;
}

function FileCard({ file, index, onRemove }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [prevStatus, setPrevStatus] = useState<ValidationStatus>(file.status);
  const [flashClass, setFlashClass] = useState('');
  const [shaking, setShaking] = useState(false);

  // Detect status transitions to trigger animations
  useEffect(() => {
    if (file.status === prevStatus) return;
    if (file.status === 'valid') {
      setFlashClass('border-flash-valid');
      setTimeout(() => setFlashClass(''), 650);
    } else if (file.status === 'invalid') {
      setFlashClass('border-flash-invalid');
      setShaking(true);
      setTimeout(() => { setFlashClass(''); setShaking(false); }, 650);
    }
    setPrevStatus(file.status);
  }, [file.status, prevStatus]);

  const borderColorStyle: React.CSSProperties = {
    uploading:  { borderLeftColor: '#93c5fd' },
    validating: { borderLeftColor: '#fbbf24' },
    valid:      { borderLeftColor: 'var(--color-lg-success)' },
    invalid:    { borderLeftColor: 'var(--color-lg-error)' },
  }[file.status];

  const statusConfig = {
    uploading: {
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
      label: 'Uploading',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    validating: {
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      label: 'Validating',
      icon: <BouncingDots />,
    },
    valid: {
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      label: 'Valid',
      icon: (
        <span className="result-pop-icon">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      ),
    },
    invalid: {
      badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      label: 'Invalid',
      icon: (
        <span className="result-pop-icon">
          <XCircle className="w-3.5 h-3.5" />
        </span>
      ),
    },
  }[file.status];

  return (
    <div
      className={`rounded-lg bg-card border border-border shadow-sm overflow-hidden upload-card-enter ${shaking ? 'card-shake' : ''} ${flashClass}`}
      style={{
        borderLeftWidth: '3px',
        ...borderColorStyle,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">{file.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${statusConfig.badgeClass}`}>
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

      {/* Upload progress bar — shimmer */}
      {file.status === 'uploading' && (
        <div className="mx-4 mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full shimmer-bar transition-[width] duration-150"
              style={{ width: `${file.uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-mono">{file.uploadProgress}%</p>
        </div>
      )}

      {/* Validating scan sweep */}
      {file.status === 'validating' && (
        <div className="mx-4 mb-3">
          <div className="relative h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="scan-sweep-bar" />
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Running validation checks…</p>
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
            {file.categories.map((cat, ci) => (
              <div
                key={cat.name}
                className="flex items-start gap-2 text-[12px]"
                style={{ animation: `upload-card-in 180ms cubic-bezier(0.23,1,0.32,1) ${ci * 40}ms both` }}
              >
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

  // Inject animation CSS once
  useEffect(() => { injectAnimationStyles(); }, []);

  const pendingCount = files.filter(f => f.status === 'uploading' || f.status === 'validating').length;
  const validFiles   = files.filter(f => f.status === 'valid');
  const invalidFiles = files.filter(f => f.status === 'invalid');
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

  const addFiles = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    const newFiles = rawFiles.map(f => makeStagedFile(f.name, f.size, f.type || 'application/octet-stream'));
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(sf => simulateFileLifecycle(sf.id, sf.name, setFiles, progressTimers));
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

      {/* Dialog — entrance animation */}
      <div
        className="relative z-10 w-full max-w-4xl bg-[var(--color-lg-page-bg)] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
        style={{ animation: 'upload-card-in 260ms cubic-bezier(0.23,1,0.32,1) both' }}
      >
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
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud
                className={`w-10 h-10 transition-all duration-200 ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`}
              />
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
                {files.map((f, i) => (
                  <FileCard key={f.id} file={f} index={i} onRemove={handleRemove} />
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

            {/* Summary — live counter with transition */}
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-foreground">Submission Summary</span>
              {[
                { label: 'Total files',  value: files.length,                                     color: 'text-foreground' },
                { label: 'Uploading',    value: files.filter(f => f.status === 'uploading').length, color: 'text-blue-600' },
                { label: 'Validating',   value: files.filter(f => f.status === 'validating').length, color: 'text-amber-600' },
                { label: 'Valid',        value: validFiles.length,                                 color: 'text-emerald-600' },
                { label: 'Invalid',      value: invalidFiles.length,                               color: 'text-red-600' },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span
                    className={`font-medium tabular-nums transition-all duration-200 ${row.color}`}
                    style={{ minWidth: '1.5rem', textAlign: 'right' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
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
                Processing {pendingCount} file{pendingCount !== 1 ? 's' : ''}…
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
