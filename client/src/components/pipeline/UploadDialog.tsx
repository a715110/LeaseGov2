/**
 * UploadDialog — V4 two-column upload modal (FC-1 Screen 1.2)
 *
 * V4 Changes:
 *   - Two-column layout: left = drop zone + file list, right = Target Context + Routing Context
 *   - Workspace colour badges (Retail=blue, Office=violet, Industrial=amber, Land=green)
 *   - Drag-to-reorder file list (HTML5 drag API, no extra deps)
 *   - Default workspace auto-selected from localStorage (leasegov_user_workspace)
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, XCircle, X, RotateCcw,
  Loader2, AlertTriangle, Tag,
  ChevronDown, ChevronUp, Info, GripVertical,
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
  makeStagedFile,
  injectAnimationStyles,
  simulateFileLifecycle,
} from '@/lib/uploadSimulation';
import {
  MOCK_WORKSPACES,
  MOCK_ASSIGNEES,
  ROLE_PERSONAS,
} from '@/lib/mockData';
import { useRole } from '@/contexts/RoleContext';
import { getWorkspaceColour } from '@/lib/workspaceColours';
import { WorkspaceBadge } from '@/components/shared/WorkspaceBadge';

// Re-export types so existing importers of UploadDialog continue to work
export type { ValidationStatus, ValidationCategory, StagedFile };
// Re-export shared utilities so existing importers continue to work
export { getWorkspaceColour } from '@/lib/workspaceColours';
export { WorkspaceBadge } from '@/components/shared/WorkspaceBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** V4 callback — passes workspace and routing context for StagedDocument creation */
  onConfirm: (
    files: StagedFile[],
    workspaceTag: string,
    contextNotes: string | null,
    assigneeId: string | null,
  ) => void;
}

// ─── Workspace colour helpers are in @/lib/workspaceColours and @/components/shared/WorkspaceBadge ──

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
  onRetry: (id: string) => void;
  isDragOver?: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

function FileCard({ file, index, onRemove, onRetry, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop }: FileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [prevStatus, setPrevStatus] = useState<ValidationStatus>(file.status);
  const [flashClass, setFlashClass] = useState('');
  const [shaking, setShaking] = useState(false);

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

  const borderColorStyle: React.CSSProperties =
    file.status === 'uploading'  ? { borderLeftColor: '#93c5fd' } :
    file.status === 'validating' ? { borderLeftColor: '#fbbf24' } :
    file.status === 'valid'      ? { borderLeftColor: 'var(--color-lg-success)' } :
                                   { borderLeftColor: 'var(--color-lg-error)' };

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
      icon: <span className="result-pop-icon"><CheckCircle2 className="w-3.5 h-3.5" /></span>,
    },
    invalid: {
      badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      label: 'Invalid',
      icon: <span className="result-pop-icon"><XCircle className="w-3.5 h-3.5" /></span>,
    },
  }[file.status];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, file.id)}
      onDragOver={e => onDragOver(e, file.id)}
      onDragEnd={onDragEnd}
      onDrop={e => onDrop(e, file.id)}
      className={`rounded-lg bg-card border border-border shadow-sm overflow-hidden upload-card-enter transition-all duration-150 ${shaking ? 'card-shake' : ''} ${flashClass} ${isDragOver ? 'border-primary ring-1 ring-primary/30 scale-[1.01]' : ''}`}
      style={{ borderLeftWidth: '3px', ...borderColorStyle, animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab active:cursor-grabbing" />
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-foreground truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${statusConfig.badgeClass}`}>
          {statusConfig.icon}
          {statusConfig.label}
        </span>
        {file.status === 'invalid' && (
          <button onClick={() => onRetry(file.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors" title="Retry validation">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
        {(file.status === 'valid' || file.status === 'invalid') && (
          <button onClick={() => setExpanded(v => !v)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={expanded ? 'Collapse' : 'Show checks'}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        <button onClick={() => onRemove(file.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {file.status === 'uploading' && (
        <div className="mx-3 mb-2.5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full shimmer-bar transition-[width] duration-150" style={{ width: `${file.uploadProgress}%` }} />
          </div>
          <p className="text-[10px] text-blue-600 mt-0.5 font-mono">{file.uploadProgress}%</p>
        </div>
      )}
      {file.status === 'validating' && (
        <div className="mx-3 mb-2.5">
          <div className="relative h-1.5 bg-amber-100 rounded-full overflow-hidden"><div className="scan-sweep-bar" /></div>
          <p className="text-[10px] text-amber-600 mt-0.5">Running validation checks…</p>
        </div>
      )}
      {file.status === 'invalid' && file.error && (
        <div className="mx-3 mb-2.5 px-2.5 py-1.5 rounded bg-red-50 border border-red-200 text-[11px] text-red-800 flex items-start gap-1.5">
          <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="font-medium">{file.error}</span>
        </div>
      )}
      {expanded && (
        <div className="border-t border-border px-3 py-2.5 bg-muted/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground mb-1.5">Validation Checks</p>
          <div className="grid grid-cols-2 gap-1">
            {file.categories.map((cat, ci) => (
              <div key={cat.name} className="flex items-start gap-1.5 text-[11px]" style={{ animation: `upload-card-in 180ms cubic-bezier(0.23,1,0.32,1) ${ci * 40}ms both` }}>
                {cat.passed ? <CheckCircle2 className="w-3 h-3 text-[var(--color-lg-success)] mt-0.5 shrink-0" /> : <XCircle className="w-3 h-3 text-[var(--color-lg-error)] mt-0.5 shrink-0" />}
                <div>
                  <span className={cat.passed ? 'text-foreground' : 'text-destructive font-medium'}>{cat.name}</span>
                  {cat.detail && <p className="text-[10px] text-muted-foreground">{cat.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UploadDialog (V4) ────────────────────────────────────────────────────────

const WORKSPACE_STORAGE_KEY = 'leasegov_user_workspace';

export function UploadDialog({ open, onClose, onConfirm }: UploadDialogProps) {
  const { activeRole } = useRole();
  // ── File state ──
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  // ── Drag-to-reorder state ──
  const dragItemId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // ── Section 3 — Target Context ──
  // Priority: 1) localStorage user preference, 2) persona's assigned workspace (set at onboarding)
  const getDefaultWorkspace = () => {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved) return saved;
    return ROLE_PERSONAS[activeRole]?.assignedWorkspaceId ?? '';
  };
    const [workspaceId, setWorkspaceId] = useState<string>(() => getDefaultWorkspace());
  // ── Section 4 — Routing Context ──
  const [contextNotes, setContextNotes] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');

  // ── Confirmation view ──
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [confirmedRejected, setConfirmedRejected] = useState(0);
  const [confirmedBatchId, setConfirmedBatchId] = useState('');

  // ── Derived ──
  const pendingCount = files.filter(f => f.status === 'uploading' || f.status === 'validating').length;
  const validFiles   = files.filter(f => f.status === 'valid');
  const invalidFiles = files.filter(f => f.status === 'invalid');
  const workspaceTag = MOCK_WORKSPACES.find(w => w.id === workspaceId)?.name ?? workspaceId;
  const assigneesForWorkspace = MOCK_ASSIGNEES.filter(a => a.workspaceId === workspaceId);

  const canConfirm =
    pendingCount === 0 &&
    validFiles.length > 0 &&
    workspaceId !== '';

  // Persist workspace selection to localStorage as user preference
  const handleWorkspaceChange = (id: string) => {
    setWorkspaceId(id);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
  };

  // Inject animation CSS once
  useEffect(() => { injectAnimationStyles(); }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset on open (preserve workspace preference)
  useEffect(() => {
    if (open) {
      setFiles([]);
      setConfirmed(false);
      setConfirmedCount(0);
      setConfirmedBatchId('');
      setContextNotes('');
      setAssigneeId('');
      progressTimers.current.forEach(t => clearInterval(t));
      progressTimers.current.clear();
      // Re-read workspace preference on each open.
      // Priority: 1) user's saved localStorage preference, 2) persona's onboarding workspace.
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      setWorkspaceId(saved ?? ROLE_PERSONAS[activeRole]?.assignedWorkspaceId ?? '');
    }
  }, [open, activeRole]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { progressTimers.current.forEach(t => clearInterval(t)); };
  }, []);

  // ── File handlers ──
  const addFiles = useCallback((rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    const newFiles = rawFiles.map(f => makeStagedFile(f.name, f.size, f.type || 'application/octet-stream'));
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(sf => simulateFileLifecycle(sf.id, sf.name, setFiles, progressTimers));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);
  const handleBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }, [addFiles]);
  const handleRemove = useCallback((id: string) => {
    progressTimers.current.forEach((_, key) => {
      if (key.includes(id)) { clearInterval(progressTimers.current.get(key)!); progressTimers.current.delete(key); }
    });
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);
  const handleRetry = useCallback((id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading', uploadProgress: 0, error: undefined } : f));
    const file = files.find(f => f.id === id);
    if (file) simulateFileLifecycle(id, file.name, setFiles, progressTimers);
  }, [files]);

  // ── Drag-to-reorder handlers ──
  const handleFileDragStart = useCallback((e: React.DragEvent, id: string) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  const handleFileDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragItemId.current !== id) setDragOverId(id);
  }, []);
  const handleFileDragEnd = useCallback(() => {
    dragItemId.current = null;
    setDragOverId(null);
  }, []);
  const handleFileDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = dragItemId.current;
    if (!sourceId || sourceId === targetId) { setDragOverId(null); return; }
    setFiles(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(f => f.id === sourceId);
      const toIdx = arr.findIndex(f => f.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDragOverId(null);
  }, []);

  // ── Confirm handler ──
  const handleConfirm = useCallback(() => {
    const batchId = `BATCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    onConfirm(
      validFiles,
      workspaceTag,
      contextNotes.trim() || null,
      assigneeId || null,
    );

    setConfirmedCount(validFiles.length);
    setConfirmedRejected(invalidFiles.length);
    setConfirmedBatchId(batchId);
    setConfirmed(true);
  }, [validFiles, workspaceTag, contextNotes, onConfirm]);

  const handleUploadMore = () => {
    setFiles([]);
    setConfirmed(false);
    setContextNotes('');
    progressTimers.current.forEach(t => clearInterval(t));
    progressTimers.current.clear();
  };

  if (!open) return null;

  // ── Confirmation view ──
  if (confirmed) {
    const wsCols = getWorkspaceColour(workspaceTag);
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-6 px-4 overflow-y-auto">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
        <div
          className="relative z-10 w-full max-w-[960px] bg-[var(--color-lg-page-bg)] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ animation: 'upload-card-in 260ms cubic-bezier(0.23,1,0.32,1) both' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
            <h2 className="text-[16px] font-semibold text-foreground">Upload Complete</h2>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-5 px-8 py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-[18px] font-semibold text-foreground">
                {confirmedCount} file{confirmedCount !== 1 ? 's' : ''} added
                {confirmedRejected > 0 && (
                  <span className="text-red-500"> · {confirmedRejected} rejected</span>
                )}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Documents are now staged and ready for packaging.
              </p>
            </div>
            {confirmedRejected > 0 && (
              <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5 text-[13px] text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold">{confirmedRejected} file{confirmedRejected !== 1 ? 's' : ''} rejected</span> — unsupported format, size limit exceeded, duplicate, or file cannot be opened.
                </span>
              </div>
            )}
            <div className="w-full rounded-lg border border-border bg-card p-4 flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Upload ID</span>
                <span className="font-mono font-semibold text-primary">{confirmedBatchId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Workspace</span>
                <WorkspaceBadge name={workspaceTag} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Assigned to</span>
                <span className="font-medium text-foreground">
                  {(() => {
                    const a = MOCK_ASSIGNEES.find(x => x.id === assigneeId);
                    return a
                      ? <span className="inline-flex items-center gap-1.5">{a.name}<span className="text-muted-foreground text-[11px]">{a.role}</span></span>
                      : <span className="text-muted-foreground italic">System auto-routes</span>;
                  })()}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUploadMore} className="px-4 py-2 rounded text-[13px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors">
                Upload more files
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded text-[13px] font-semibold bg-[#1F3864] text-white hover:bg-[#162d54] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedWorkspace = MOCK_WORKSPACES.find(w => w.id === workspaceId);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-[960px] bg-[var(--color-lg-page-bg)] rounded-xl shadow-2xl border border-border flex flex-col"
        style={{ animation: 'upload-card-in 260ms cubic-bezier(0.23,1,0.32,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">Upload Files</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Add documents to the pipeline and set their destination.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── TWO-COLUMN BODY ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT COLUMN — Drop zone + File list ── */}
          <div className="flex-1 flex flex-col gap-0 px-6 py-5 overflow-y-auto border-r border-border">

            {/* Accepted formats hint */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-border text-[11px] text-accent-foreground mb-4">
              <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Accepted: PDF, DOCX, JPG, JPEG, PNG, TIFF — max 100 MB per file</span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all duration-200 mb-4 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <UploadCloud className={`w-9 h-9 transition-all duration-200 ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="text-[13px] font-medium text-foreground">
                  {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Multi-select supported</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif" className="hidden" onChange={handleBrowse} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                    Files ({files.length})
                    {files.length > 1 && <span className="ml-1.5 text-muted-foreground font-normal normal-case">· drag to reorder</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    {files.filter(f => f.status === 'uploading').length > 0 && <span className="text-[11px] text-blue-600">Uploading: {files.filter(f => f.status === 'uploading').length}</span>}
                    {files.filter(f => f.status === 'validating').length > 0 && <span className="text-[11px] text-amber-600">Validating: {files.filter(f => f.status === 'validating').length}</span>}
                    <span className="text-[11px] text-emerald-600">Valid: {validFiles.length}</span>
                    {invalidFiles.length > 0 && (
                      <button onClick={() => invalidFiles.forEach(f => handleRemove(f.id))} className="text-[11px] text-red-600 hover:underline">
                        Remove invalid ({invalidFiles.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {files.map((f, i) => (
                    <FileCard
                      key={f.id}
                      file={f}
                      index={i}
                      onRemove={handleRemove}
                      onRetry={handleRetry}
                      isDragOver={dragOverId === f.id}
                      onDragStart={handleFileDragStart}
                      onDragOver={handleFileDragOver}
                      onDragEnd={handleFileDragEnd}
                      onDrop={handleFileDrop}
                    />
                  ))}
                </div>
              </div>
            )}

            {files.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-[12px] text-muted-foreground">No files added yet</p>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — Target Context + Routing Context ── */}
          <div className="w-[380px] shrink-0 flex flex-col gap-0 px-6 py-5 overflow-y-auto bg-card/40">

            {/* ── SECTION 3 — TARGET CONTEXT ── */}
            <div className="flex flex-col gap-4 pb-6">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Tag className="w-4 h-4 text-primary" />
                <p className="text-[13px] font-semibold text-foreground">Target Context</p>
              </div>

              {/* 3a — Workspace */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Workspace <span className="text-red-500">*</span>
                  {selectedWorkspace && (
                    <span className="ml-2 normal-case font-normal text-muted-foreground/60">
                      {localStorage.getItem(WORKSPACE_STORAGE_KEY)
                        ? '(saved as default)'
                        : '(assigned workspace)'}
                    </span>
                  )}
                </label>
                <Select value={workspaceId} onValueChange={handleWorkspaceChange}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select workspace…">
                      {selectedWorkspace && (
                        <span className="flex items-center gap-2">
                          <WorkspaceBadge name={selectedWorkspace.name} size="xs" />
                          <span className="text-[11px] text-muted-foreground">{selectedWorkspace.team}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_WORKSPACES.map(ws => (
                      <SelectItem key={ws.id} value={ws.id} className="text-[13px]">
                        <span className="flex items-center gap-2">
                          <WorkspaceBadge name={ws.name} size="xs" />
                          <span className="text-muted-foreground text-[11px]">{ws.team}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWorkspace && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    All files assigned to <span className="font-medium text-foreground">{selectedWorkspace.name}</span> workspace.
                    {localStorage.getItem(WORKSPACE_STORAGE_KEY)
                      ? ' Selection saved to your profile.'
                      : ' Assigned at onboarding — change to override.'}
                  </p>
                )}
              </div>

            </div>

            {/* ── SECTION 4 — ROUTING CONTEXT ── */}
            <div className="flex flex-col gap-4 pt-5 border-t border-border">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <p className="text-[13px] font-semibold text-foreground">Routing Context</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Comments / Instructions
                  <span className="text-muted-foreground/60 ml-1">(optional)</span>
                </label>
                <textarea
                  value={contextNotes}
                  onChange={e => setContextNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what these documents are and any context that helps the person processing them…"
                  className="w-full px-3 py-2 text-[12px] rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />

              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Assign to <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <Select value={assigneeId} onValueChange={v => setAssigneeId(v === '__auto__' ? '' : v)}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue>
                      {assigneeId ? (() => {
                        const a = MOCK_ASSIGNEES.find(x => x.id === assigneeId);
                        return a ? (
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{a.name}</span>
                            <span className="text-muted-foreground text-[11px]">{a.role}</span>
                          </span>
                        ) : null;
                      })() : (
                        <span className="text-muted-foreground text-[13px]">System auto-routes to workspace Preparer</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* Default — system routing */}
                    <SelectItem value="__auto__" className="text-[13px] text-muted-foreground italic">
                      System auto-routes (default)
                    </SelectItem>
                    {/* Workspace assignees */}
                    {assigneesForWorkspace.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-t border-border mt-1">
                          {workspaceTag || 'Workspace'} team
                        </div>
                        {assigneesForWorkspace.map(a => (
                          <SelectItem key={a.id} value={a.id} className="text-[13px]">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{a.name}</span>
                              <span className="text-muted-foreground text-[11px]">{a.role}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {/* All other assignees (override) */}
                    {(() => {
                      const others = MOCK_ASSIGNEES.filter(a => a.workspaceId !== workspaceId);
                      if (others.length === 0) return null;
                      return (
                        <>
                          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-t border-border mt-1">
                            Other teams
                          </div>
                          {others.map(a => {
                            const ws = MOCK_WORKSPACES.find(w => w.id === a.workspaceId);
                            return (
                              <SelectItem key={a.id} value={a.id} className="text-[13px]">
                                <span className="flex items-center gap-2">
                                  <span className="font-medium">{a.name}</span>
                                  <span className="text-muted-foreground text-[11px]">{a.role}</span>
                                  {ws && <WorkspaceBadge name={ws.name} size="xs" />}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
                {assigneeId && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Overriding default routing.{' '}
                    <button
                      type="button"
                      onClick={() => setAssigneeId('')}
                      className="text-primary underline hover:no-underline"
                    >
                      Revert to auto-route
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="text-[12px] text-muted-foreground">
            {pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
              className="h-8 text-[13px] gap-1.5"
              title={
                pendingCount > 0 ? 'Wait for validation to complete' :
                validFiles.length === 0 ? 'Add at least one valid file to continue' :
                !workspaceId ? 'Select a workspace first' :
                undefined
              }
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Add to Pipeline ({validFiles.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
