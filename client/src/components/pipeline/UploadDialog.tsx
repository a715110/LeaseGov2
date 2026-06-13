/**
 * UploadDialog — V3 all-in-one upload modal (FC-1 Screen 1.2)
 *
 * V3 Document Intake Governance Flow — Change 2
 * Reference: IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE_V3.md §Change 2
 *
 * 4 Sections:
 *   1 — File Upload (drag-drop zone)
 *   2 — File List with inline validation
 *   3 — Target Context (Workspace + 3-option Record destination radio cards)
 *   4 — Routing Context (notes textarea + optional assignee)
 *
 * Callback contract (V3):
 *   onConfirm(files, workspaceTag, targetRecordId, submissionPath, contextNotes)
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, XCircle, X, RotateCcw,
  Plus, Search, HelpCircle, Loader2, AlertTriangle, Tag,
  ChevronDown, ChevronUp, Info,
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
  MOCK_CONTRACT_RECORDS,
  MOCK_WORKSPACES,
  MOCK_ASSIGNEES,
  searchContractRecords,
  findContractRecord,
  CONTRACT_RECORD_STATUS_BADGE,
  CONTRACT_RECORD_STATUS_LABEL,
  type ContractRecord,
} from '@/lib/mockData';

// Re-export types so existing importers of UploadDialog continue to work
export type { ValidationStatus, ValidationCategory, StagedFile };

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordDestination = 'new_record' | 'existing_record' | 'unknown' | null;

export interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** V3 callback — passes all context fields for StagedDocument creation */
  onConfirm: (
    files: StagedFile[],
    workspaceTag: string,
    targetRecordId: string | null,
    submissionPath: RecordDestination,
    contextNotes: string | null,
  ) => void;
}

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
}

function FileCard({ file, index, onRemove, onRetry }: FileCardProps) {
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
      className={`rounded-lg bg-card border border-border shadow-sm overflow-hidden upload-card-enter ${shaking ? 'card-shake' : ''} ${flashClass}`}
      style={{ borderLeftWidth: '3px', ...borderColorStyle, animationDelay: `${index * 60}ms` }}
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
        {/* Retry for invalid */}
        {file.status === 'invalid' && (
          <button
            onClick={() => onRetry(file.id)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-amber-600 transition-colors"
            title="Retry validation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Expand/collapse for completed files */}
        {(file.status === 'valid' || file.status === 'invalid') && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? 'Collapse' : 'Show validation checks'}
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
            <div className="h-full rounded-full shimmer-bar transition-[width] duration-150" style={{ width: `${file.uploadProgress}%` }} />
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

      {/* Validation checks (expanded) */}
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
                {cat.passed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-lg-success)] mt-0.5 shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-[var(--color-lg-error)] mt-0.5 shrink-0" />
                }
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

// ─── RecordSearchPanel ────────────────────────────────────────────────────────

interface RecordSearchPanelProps {
  selected: ContractRecord | null;
  onSelect: (record: ContractRecord | null) => void;
}

function RecordSearchPanel({ selected, onSelect }: RecordSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContractRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      setResults(searchContractRecords(query));
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-primary/30">
          <span className="font-mono text-[11px] font-semibold text-primary">{selected.contractNumber}</span>
          <span className="text-[12px] font-medium text-foreground">{selected.counterparty}</span>
          <span className="text-[11px] text-muted-foreground truncate">{selected.address}</span>
          <span className={`ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${CONTRACT_RECORD_STATUS_BADGE[selected.status]}`}>
            {CONTRACT_RECORD_STATUS_LABEL[selected.status]}
          </span>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Counterparty name, address, or contract number…"
          className="w-full pl-8 pr-3 py-2 text-[12px] rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      {showDropdown && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-3 py-3 text-[12px] text-muted-foreground text-center">No records found</div>
          ) : (
            results.map(rec => (
              <button
                key={rec.id}
                onMouseDown={() => { onSelect(rec); setQuery(''); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
              >
                <span className="font-mono text-[11px] font-semibold text-primary shrink-0">{rec.contractNumber}</span>
                <span className="text-[12px] font-medium text-foreground">{rec.counterparty}</span>
                <span className="text-[11px] text-muted-foreground truncate flex-1">{rec.address}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${CONTRACT_RECORD_STATUS_BADGE[rec.status]}`}>
                  {CONTRACT_RECORD_STATUS_LABEL[rec.status]}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── UploadDialog (V3) ────────────────────────────────────────────────────────

export function UploadDialog({ open, onClose, onConfirm }: UploadDialogProps) {
  // ── File state ──
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // ── Section 3 — Target Context ──
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [recordDest, setRecordDest] = useState<RecordDestination>(null);
  const [selectedRecord, setSelectedRecord] = useState<ContractRecord | null>(null);
  // New Record form
  const [newRecordName, setNewRecordName] = useState('');
  const [newRecordCounterparty, setNewRecordCounterparty] = useState('');
  const [newRecordAddress, setNewRecordAddress] = useState('');
  const [newRecordType, setNewRecordType] = useState('Property Lease');

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

  // Notes required when "Not sure" is selected
  const notesRequired = recordDest === 'unknown';
  const canConfirm =
    pendingCount === 0 &&
    validFiles.length > 0 &&
    workspaceId !== '' &&
    (!notesRequired || contextNotes.trim().length > 0);

  // Inject animation CSS once
  useEffect(() => { injectAnimationStyles(); }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setFiles([]);
      setConfirmed(false);
      setConfirmedCount(0);
      setConfirmedBatchId('');
      setRecordDest(null);
      setSelectedRecord(null);
      setContextNotes('');
      setAssigneeId('');
      setNewRecordName('');
      setNewRecordCounterparty('');
      setNewRecordAddress('');
      setNewRecordType('Property Lease');
      progressTimers.current.forEach(t => clearInterval(t));
      progressTimers.current.clear();
    }
  }, [open]);

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

  // ── Confirm handler ──
  const handleConfirm = useCallback(() => {
    const targetRecordId =
      recordDest === 'existing_record' ? (selectedRecord?.id ?? null) :
      recordDest === 'new_record' ? `draft-${Date.now()}` :
      null;

    const batchId = `BATCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    onConfirm(
      validFiles,
      workspaceTag,
      targetRecordId,
      recordDest,
      contextNotes.trim() || null,
    );

    setConfirmedCount(validFiles.length);
    setConfirmedRejected(invalidFiles.length);
    setConfirmedBatchId(batchId);
    setConfirmed(true);
  }, [validFiles, workspaceTag, recordDest, selectedRecord, contextNotes, onConfirm]);

  const handleUploadMore = () => {
    setFiles([]);
    setConfirmed(false);
    setRecordDest(null);
    setSelectedRecord(null);
    setContextNotes('');
    progressTimers.current.forEach(t => clearInterval(t));
    progressTimers.current.clear();
  };

  if (!open) return null;

  // ── Confirmation view ──
  if (confirmed) {
    const rec = recordDest === 'existing_record' ? selectedRecord : null;
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
                  <span className="font-semibold">{confirmedRejected} file{confirmedRejected !== 1 ? 's' : ''} rejected</span> — unsupported format, size limit exceeded, duplicate, or file cannot be opened. These files were not added to the pipeline.
                </span>
              </div>
            )}
            <div className="w-full rounded-lg border border-border bg-card p-4 flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Upload ID</span>
                <span className="font-mono font-semibold text-primary">{confirmedBatchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workspace</span>
                <span className="font-medium text-foreground">{workspaceTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Record</span>
                <span className="font-medium text-foreground">
                  {rec
                    ? <span className="inline-flex items-center gap-1.5"><span className="font-mono text-primary text-[11px]">{rec.contractNumber}</span>{rec.counterparty}</span>
                    : recordDest === 'unknown' ? 'Awaiting Assignment'
                    : recordDest === 'new_record' ? 'New Record (Draft)'
                    : 'Unassigned'
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadMore}
                className="px-4 py-2 rounded text-[13px] font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                Upload more files
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-[13px] font-semibold bg-[#1F3864] text-white hover:bg-[#162d54] transition-colors"
              >
                View in Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AI type hint for "Amendment" in filename ──
  const hasAmendmentHint = files.some(f => f.name.toLowerCase().includes('amendment'));

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

        {/* Scrollable body — no artificial max-height; outer overlay handles scroll */}
        <div className="px-6 py-5 flex flex-col gap-0">

          {/* ── SECTION 1 — FILE UPLOAD ── */}
          <div className="flex flex-col gap-3 pb-6">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent border border-border text-[12px] text-accent-foreground">
              <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Accepted: PDF, DOCX, JPG, JPEG, PNG, TIFF — max 100 MB per file</span>
            </div>

            {/* Submission summary bar */}
            {files.length > 0 && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border text-[12px] flex-wrap">
                <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{files.length}</span></span>
                {files.filter(f => f.status === 'uploading').length > 0 && (
                  <span className="text-blue-600">Uploading: <span className="font-semibold">{files.filter(f => f.status === 'uploading').length}</span></span>
                )}
                {files.filter(f => f.status === 'validating').length > 0 && (
                  <span className="text-amber-600">Validating: <span className="font-semibold">{files.filter(f => f.status === 'validating').length}</span></span>
                )}
                <span className="text-emerald-600">Valid: <span className="font-semibold">{validFiles.length}</span></span>
                {invalidFiles.length > 0 && (
                  <span className="text-red-600">Invalid: <span className="font-semibold">{invalidFiles.length}</span></span>
                )}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <UploadCloud className={`w-9 h-9 transition-all duration-200 ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="text-[14px] font-medium text-foreground">
                  {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Multi-select supported</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif" className="hidden" onChange={handleBrowse} />
            </div>
          </div>

          {/* ── SECTION 2 — FILE LIST ── */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 pb-6">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Files ({files.length})</p>
                {invalidFiles.length > 0 && (
                  <button
                    onClick={() => invalidFiles.forEach(f => handleRemove(f.id))}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Remove all invalid ({invalidFiles.length})
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {files.map((f, i) => (
                  <FileCard key={f.id} file={f} index={i} onRemove={handleRemove} onRetry={handleRetry} />
                ))}
              </div>
            </div>
          )}

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
              </label>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select workspace…" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_WORKSPACES.map(ws => (
                    <SelectItem key={ws.id} value={ws.id} className="text-[13px]">
                      <span className="font-medium">{ws.name}</span>
                      <span className="ml-2 text-muted-foreground text-[11px]">{ws.team}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3b — Record destination */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                Where should these documents go?
              </label>
              <div className="flex flex-col gap-2">

                {/* Card 1 — New Record */}
                <button
                  type="button"
                  onClick={() => setRecordDest(recordDest === 'new_record' ? null : 'new_record')}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 ${
                    recordDest === 'new_record'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${recordDest === 'new_record' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">New Record</p>
                      <p className="text-[11px] text-muted-foreground">For a newly executed contract or one not yet in this system</p>
                    </div>
                  </div>
                </button>

                {/* New Record inline form */}
                {recordDest === 'new_record' && (
                  <div className="ml-4 pl-4 border-l-2 border-primary/30 flex flex-col gap-3 py-2">
                    {hasAmendmentHint && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span><span className="font-semibold">Amendment detected</span> — pre-selected Property Lease</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Record Name</label>
                        <input
                          value={newRecordName}
                          onChange={e => setNewRecordName(e.target.value)}
                          placeholder="Auto-generated if blank"
                          className="w-full px-3 py-1.5 text-[12px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Counterparty <span className="text-red-500">*</span></label>
                        <input
                          value={newRecordCounterparty}
                          onChange={e => setNewRecordCounterparty(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full px-3 py-1.5 text-[12px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Property Address <span className="text-red-500">*</span></label>
                      <input
                        value={newRecordAddress}
                        onChange={e => setNewRecordAddress(e.target.value)}
                        placeholder="e.g. 123 Main St, New York NY 10001"
                        className="w-full px-3 py-1.5 text-[12px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">Contract Type</label>
                      <Select value={newRecordType} onValueChange={setNewRecordType}>
                        <SelectTrigger className="h-8 text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Property Lease" className="text-[12px]">Property Lease</SelectItem>
                          <SelectItem value="Equipment Lease" className="text-[12px]">Equipment Lease</SelectItem>
                          <SelectItem value="Service Contract" className="text-[12px]">Service Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Card 2 — Existing Record (hidden when New Record is selected) */}
                {recordDest !== 'new_record' && (<>
                <button
                  type="button"
                  onClick={() => setRecordDest(recordDest === 'existing_record' ? null : 'existing_record')}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 ${
                    recordDest === 'existing_record'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${recordDest === 'existing_record' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Existing Record</p>
                      <p className="text-[11px] text-muted-foreground">For an amendment, exhibit, or document for a current record</p>
                    </div>
                  </div>
                </button>
                {recordDest === 'existing_record' && (
                  <div className="ml-4 pl-4 border-l-2 border-primary/30 py-1">
                    <RecordSearchPanel selected={selectedRecord} onSelect={setSelectedRecord} />
                  </div>
                )}
                </>)}

                {/* Card 3 — Not sure (hidden when new_record or existing_record is selected) */}
                {(!recordDest || recordDest === 'unknown') && (<>
                <button
                  type="button"
                  onClick={() => setRecordDest(recordDest === 'unknown' ? null : 'unknown')}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 ${
                    recordDest === 'unknown'
                      ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-300/40'
                      : 'border-border bg-card hover:border-amber-300/60 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${recordDest === 'unknown' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">Not sure — leave instructions</p>
                      <p className="text-[11px] text-muted-foreground">A Preparer will find the right record and may contact you</p>
                    </div>
                  </div>
                </button>
                {recordDest === 'unknown' && (
                  <div className="ml-4 pl-4 border-l-2 border-amber-400/50 py-1">
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Your files will be held in staging until a Preparer assigns them to the correct record.</span>
                    </div>
                  </div>
                )}
                </>)}

                {/* Change selection link — shown when a card is selected */}
                {recordDest && (
                  <button
                    type="button"
                    onClick={() => setRecordDest(null)}
                    className="text-[11px] text-primary hover:underline self-start pl-1"
                  >
                    ← Change selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── SECTION 4 — ROUTING CONTEXT ── */}
          <div className="flex flex-col gap-4 pt-6 border-t border-border mt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <p className="text-[13px] font-semibold text-foreground">Routing Context</p>
            </div>

            {/* Comments / Instructions */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                Comments / Instructions
                {notesRequired && <span className="text-red-500 ml-1">*</span>}
                {!notesRequired && <span className="text-muted-foreground/60 ml-1">(optional)</span>}
              </label>
              <textarea
                value={contextNotes}
                onChange={e => setContextNotes(e.target.value)}
                rows={3}
                placeholder="Describe what these documents are and any context that helps the person processing them…"
                className={`w-full px-3 py-2 text-[12px] rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none ${
                  notesRequired && contextNotes.trim().length === 0
                    ? 'border-amber-400 focus:ring-amber-400'
                    : 'border-border'
                }`}
              />
              {notesRequired && contextNotes.trim().length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">Instructions are required when the record destination is unknown.</p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                Assign to <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="System auto-routes to workspace Preparer" />
                </SelectTrigger>
                <SelectContent>
                  {(workspaceId ? assigneesForWorkspace : MOCK_ASSIGNEES).map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-[13px]">
                      <span className="font-medium">{a.name}</span>
                      <span className="ml-2 text-muted-foreground text-[11px]">{a.role}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              variant="outline"
              onClick={() => {
                // Save as Draft — no staging entries created
                onClose();
              }}
              className="h-8 text-[13px]"
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="h-8 text-[13px] gap-1.5"
              title={
                pendingCount > 0 ? 'Wait for validation to complete' :
                validFiles.length === 0 ? 'Add at least one valid file to continue' :
                !workspaceId ? 'Select a workspace first' :
                (notesRequired && contextNotes.trim().length === 0) ? 'Instructions are required for unknown record destination' :
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
