/**
 * PipelineUpload — FC-1 Screen 1.2
 * Screen key: pipeline-upload
 * Route: /pipeline/upload
 * Role: Document Submitter
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 * Prompt 1.2: Drag-drop upload zone, file validation cards (valid/invalid),
 *             Target Context right panel, Continue to Review button.
 * Data model refs: StagedDocument (validation_result, validation_errors,
 *                  status: uploaded|validating|valid|invalid) — V3: binary model, no warning state
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, X, Plus, Info, Tag, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { WORKSPACE_TAGS, formatBytes } from '@/lib/uploadSimulation';
// Prompt 12: WORKSPACE_TAGS, formatBytes imported from shared @/lib/uploadSimulation.
// MOCK_FILES removed — the drag-drop zone now accepts real files via the file input.
// ─── Types ────────────────────────────────────────────────────────────────────
// V3 binary model: valid or invalid only (no warning state at upload time)
type ValidationStatus = 'valid' | 'invalid' | 'validating';
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
}

// ─── File validation card ─────────────────────────────────────────────────────

interface FileCardProps {
  file: StagedFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

function FileCard({ file, onRemove, onRetry }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    valid:      { icon: <CheckCircle2 className="w-4 h-4" />, badgeClass: 'badge-valid',    label: 'Valid' },
    invalid:    { icon: <XCircle className="w-4 h-4" />,       badgeClass: 'badge-invalid', label: 'Invalid' },
    validating: { icon: <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />, badgeClass: 'badge-processing', label: 'Validating' },
  }[file.status];

  const borderColorStyle = {
    valid:      { borderLeftColor: 'var(--color-lg-success)' },
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
        {/* S2c: Retry button for invalid files */}
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
        >
          <X className="w-4 h-4" />
        </button>
      </div>

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
  const [files, setFiles] = useState<StagedFile[]>([
    // Demo seed 1: Retail-HQ-Lease-2026.pdf — valid file (all checks pass)
    // Matches the doc-1 entry in PipelineDashboard MOCK_DOCUMENTS. Enables the
    // "Continue to Review" button immediately for the demo without a real upload.
    {
      id: 'demo-retail-hq',
      name: 'Retail-HQ-Lease-2026.pdf',
      size: 2_621_440,
      mime_type: 'application/pdf',
      status: 'valid',
      ocr_confidence: 97,
      categories: [
        { name: 'File Integrity',  passed: true, detail: 'PDF structure is valid and well-formed.' },
        { name: 'OCR Readability', passed: true, detail: 'High-quality text layer detected; confidence: 97%.' },
        { name: 'Page Count',      passed: true, detail: '42 pages detected.' },
        { name: 'File Size',       passed: true, detail: '2.5 MB — within the 50 MB limit.' },
        { name: 'Virus Scan',      passed: true, detail: 'No threats detected.' },
      ],
    },
    // Demo seed 2: Corrupted-Scan-Draft.pdf — invalid file (file integrity check failed)
    // Matches the doc-7 entry in PipelineDashboard MOCK_DOCUMENTS so the invalid
    // upload state is demonstrable from Step 2 without requiring a real file upload.
    {
      id: 'demo-corrupted',
      name: 'Corrupted-Scan-Draft.pdf',
      size: 1_048_576,
      mime_type: 'application/pdf',
      status: 'invalid',
      ocr_confidence: 0,
      error: 'File integrity check failed — the PDF structure is malformed or the scan is unreadable.',
      categories: [
        { name: 'File Integrity',  passed: false, detail: 'PDF structure is malformed; file may be corrupted.' },
        { name: 'OCR Readability', passed: false, detail: 'No readable text layer detected; confidence: 0%.' },
        { name: 'Page Count',      passed: true,  detail: '3 pages detected.' },
        { name: 'File Size',       passed: true,  detail: '1.0 MB — within the 50 MB limit.' },
        { name: 'Virus Scan',      passed: true,  detail: 'No threats detected.' },
      ],
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  // S2b: auto-select last used workspace from localStorage
  const [workspaceTag, setWorkspaceTag] = useState(
    () => localStorage.getItem('leasegov_last_workspace') ?? ''
  );
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // S2b: persist workspace selection
  useEffect(() => {
    if (workspaceTag) localStorage.setItem('leasegov_last_workspace', workspaceTag);
  }, [workspaceTag]);

  const validFiles = files.filter(f => f.status === 'valid');
  const invalidFiles = files.filter(f => f.status === 'invalid');
  const canContinue = validFiles.length > 0 && workspaceTag !== '';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // Process a FileList into StagedFile entries and add them to state
  const processFileList = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles: StagedFile[] = Array.from(fileList).map(f => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      mime_type: f.type || 'application/pdf',
      status: 'validating' as ValidationStatus,
      categories: [],
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setIsValidating(true);
    // Simulate validation — resolves to valid after 1.2 s
    setTimeout(() => {
      setFiles(prev => prev.map(f =>
        newFiles.some(nf => nf.id === f.id)
          ? {
              ...f,
              status: 'valid' as ValidationStatus,
              ocr_confidence: 94,
              categories: [
                { name: 'File Integrity',  passed: true, detail: 'PDF structure is valid.' },
                { name: 'OCR Readability', passed: true, detail: 'Text layer detected; confidence: 94%.' },
                { name: 'File Size',       passed: true, detail: `${(f.size / 1024).toFixed(0)} KB — within limit.` },
                { name: 'Virus Scan',      passed: true, detail: 'No threats detected.' },
              ],
            }
          : f
      ));
      setIsValidating(false);
    }, 1200);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFileList(e.dataTransfer.files);
  }, [processFileList]);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // S2a/S2c: retry validation — sets file back to 'validating' then resolves after mock delay
  const handleRetry = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'validating' as ValidationStatus, error: undefined } : f));
    setIsValidating(true);
    // TODO: Backend integration required — POST /api/staged-documents/:id/revalidate
    setTimeout(() => {
      // V3: re-validation resolves to valid (binary model — no warning state)
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'valid' as ValidationStatus } : f));
      setIsValidating(false);
    }, 2000);
  }, []);

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Upload Files</h1>
            <ScreenNumberBadge screenKey="pipeline-upload" />
          </div>
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
              onChange={e => { processFileList(e.target.files); e.target.value = ''; }}
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

        {/* Right: Target Context panel */}
        <div className="w-[432px] flex flex-col gap-4">
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
                  Workspace <span className="text-destructive">*</span>
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
                      <SelectValue placeholder="Select workspace..." />
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
                    All files assigned to <strong>{workspaceTag}</strong> workspace.
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

      {/* S2a: Global validating overlay */}
      {isValidating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-lg bg-background border border-border px-5 py-3.5 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[13px] font-medium text-foreground">Re-validating file…</span>
          </div>
        </div>
      )}

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
