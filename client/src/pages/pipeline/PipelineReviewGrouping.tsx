/**
 * PipelineReviewGrouping — FC-1 Screen 1.5
 * Screen key: pipeline-review-grouping
 * Route: /pipeline/review
 * Role: Document Submitter
 *
 * Design: Structured Authority — Structured Clarity (Modern Gov-Tech)
 *
 * Change 4: Two-section layout
 *   Section A — Extraction:   valid files that WILL be packaged
 *   Section B — No Extraction: invalid files (locked) + valid files moved here by user
 *
 * Movement rules:
 *   valid files → can move freely between sections (ArrowDown / ArrowUp)
 *   invalid files → permanently locked to No Extraction (lock icon, tooltip)
 *
 * Grouping action uses only files currently in the Extraction section.
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  FileText, CheckSquare, Square, ChevronDown, Edit2, Check,
  X, ZoomIn, ZoomOut, Layers, Package, Info, Save, Send,
  ArrowDown, ArrowUp, Lock, Filter, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { FlagSlidingPanel } from '@/components/shared/FlagSlidingPanel';
import { toast } from 'sonner';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { publishEvent } from '@/lib/eventBus';
import { MOCK_CONTRACT_RECORDS, searchContractRecords } from '@/lib/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentRole =
  | 'Base Contract' | 'Amendment' | 'Addendum'
  | 'Exhibit' | 'Schedule' | 'Notice' | 'Supporting' | 'Unassigned';

type FileStatus = 'valid' | 'invalid';

interface ReviewFile {
  id: string;
  display_name: string;
  original_filename: string;
  status: FileStatus;
  document_role: DocumentRole;
  file_size_bytes: number;
  page_count: number;
  /** true = in Extraction section; false = in No Extraction section */
  inExtraction: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_FILES: ReviewFile[] = [
  { id: 'f1', display_name: 'Retail-HQ-Lease-2026.pdf',        original_filename: 'Retail-HQ-Lease-2026.pdf',        status: 'valid',   document_role: 'Base Contract', file_size_bytes: 4_200_000, page_count: 24, inExtraction: true },
  { id: 'f2', display_name: 'Office-Tower-Amendment-3.pdf',     original_filename: 'Office-Tower-Amendment-3.pdf',     status: 'valid',   document_role: 'Amendment',     file_size_bytes: 1_800_000, page_count: 8,  inExtraction: true },
  { id: 'f3', display_name: 'Warehouse-Lease-Exhibit-A.tiff',   original_filename: 'Warehouse-Lease-Exhibit-A.tiff',   status: 'valid',   document_role: 'Exhibit',       file_size_bytes: 6_100_000, page_count: 12, inExtraction: true },
  { id: 'f4', display_name: 'Corrupted-Scan-Draft.pdf',         original_filename: 'Corrupted-Scan-Draft.pdf',         status: 'invalid', document_role: 'Unassigned',    file_size_bytes: 512_000,   page_count: 3,  inExtraction: false },
  { id: 'f5', display_name: 'Ground-Lease-Base-Contract.pdf',   original_filename: 'Ground-Lease-Base-Contract.pdf',   status: 'valid',   document_role: 'Base Contract', file_size_bytes: 9_400_000, page_count: 41, inExtraction: true },
  { id: 'f6', display_name: 'Industrial-Park-Schedule.pdf',     original_filename: 'Industrial-Park-Schedule.pdf',     status: 'valid',   document_role: 'Schedule',      file_size_bytes: 2_200_000, page_count: 6,  inExtraction: true },
  { id: 'f7', display_name: 'Invalid-Contract-NoOCR.pdf',       original_filename: 'Invalid-Contract-NoOCR.pdf',       status: 'invalid', document_role: 'Unassigned',    file_size_bytes: 340_000,   page_count: 1,  inExtraction: false },
];

const ROLE_LABELS: Record<DocumentRole, string> = {
  'Base Contract': 'Base Contract',
  'Amendment':     'Amendment',
  'Addendum':      'Addendum',
  'Exhibit':       'Exhibit',
  'Schedule':      'Schedule',
  'Notice':        'Notice',
  'Supporting':    'Supporting',
  'Unassigned':    'Unassigned',
};

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

interface FileRowProps {
  file: ReviewFile;
  selected: boolean;
  active: boolean;
  section: 'extraction' | 'no-extraction';
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRoleChange: (id: string, role: DocumentRole) => void;
  onMove: (id: string, to: 'extraction' | 'no-extraction') => void;
}

function FileRow({
  file, selected, active, section,
  onSelect, onActivate, onRename, onRoleChange, onMove,
}: FileRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(file.display_name);

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed) onRename(file.id, trimmed);
    else setEditValue(file.display_name);
    setEditing(false);
  }

  const isInvalid = file.status === 'invalid';

  // Row background
  let rowBg = active ? 'bg-accent' : 'hover:bg-muted/30';
  if (section === 'no-extraction') {
    if (isInvalid) rowBg = 'bg-red-50/60 dark:bg-red-950/20';
    else rowBg = 'bg-muted/40';
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${rowBg}`}
      style={section === 'no-extraction' && isInvalid ? { borderLeft: '2px solid var(--color-lg-error)' } : undefined}
      onClick={() => onActivate(file.id)}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(file.id); }}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        disabled={isInvalid}
      >
        {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
      </button>

      <div className="w-8 h-10 rounded bg-muted border border-border flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setEditValue(file.display_name); setEditing(false); }
              }}
              className="flex-1 h-7 px-2 text-[12px] border border-primary rounded focus:outline-none"
              autoFocus
            />
            <button onClick={commitRename} className="p-1 text-[var(--color-lg-success)]"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditValue(file.display_name); setEditing(false); }} className="p-1 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group">
            <p className="text-[13px] font-medium text-foreground truncate">{file.display_name}</p>
            {!isInvalid && (
              <button
                onClick={e => { e.stopPropagation(); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">{formatBytes(file.file_size_bytes)} · {file.page_count} pages</p>
      </div>

      {/* Role selector — disabled for invalid */}
      <div onClick={e => e.stopPropagation()} className="shrink-0">
        {isInvalid ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            Invalid
          </span>
        ) : (
          <Select value={file.document_role} onValueChange={role => onRoleChange(file.id, role as DocumentRole)}>
            <SelectTrigger className="h-7 w-36 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-[12px]">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Move button or lock icon */}
      <div onClick={e => e.stopPropagation()} className="shrink-0">
        {isInvalid ? (
          <span
            title="Invalid documents cannot be sent for extraction"
            className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground/50 cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
          </span>
        ) : section === 'extraction' ? (
          <button
            title="Move to No Extraction"
            onClick={() => onMove(file.id, 'no-extraction')}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            title="Move back to Extraction"
            onClick={() => onMove(file.id, 'extraction')}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Submission Detail Panel ──────────────────────────────────────────────────

function SubmissionDetailPanel({
  extractionFiles,
  packageName,
  onClose,
  onConfirm,
}: {
  extractionFiles: ReviewFile[];
  packageName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const mode = extractionFiles.length >= 2 ? 'Contract Package' : 'Single Contract';

  return (
    <FlagSlidingPanel
      open={true}
      onClose={onClose}
      title="Submission Summary"
      subtitle="Review before submitting for ingestion"
      width={440}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <Send className="w-3.5 h-3.5" />
            Confirm Submission
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Submission Mode</p>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-semibold text-foreground">{mode}</span>
            {mode === 'Contract Package' && (
              <span className="text-[12px] text-muted-foreground">· {packageName}</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Files for Extraction</p>
          <div className="space-y-1.5">
            {extractionFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-foreground truncate flex-1">{f.display_name}</span>
                <span className="text-muted-foreground shrink-0">{ROLE_LABELS[f.document_role]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FlagSlidingPanel>
  );
}

// ─── Session storage key ─────────────────────────────────────────────────────

const SESSION_KEY = 'leasegov_review_grouping_session';

// Matches the StagedDocument shape passed from PipelineDashboard via history.state
interface IncomingDoc {
  id: string;
  display_name: string;
  status: 'uploaded' | 'uploading' | 'validating' | 'valid' | 'invalid';
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  workspace_tag: string;
}

interface ReviewSession {
  files: ReviewFile[];
  packageName: string;
  filterRole: string;
  activeFileId: string;
  zoom: number;
  /** The original filenames used to seed this session (for Back-nav restore) */
  selectedFileNames: string[];
  /** navToken of the navigation that created this session */
  navToken?: number;
}

function loadSession(): ReviewSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewSession;
  } catch {
    return null;
  }
}

function saveSession(session: ReviewSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* quota exceeded — ignore */ }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineReviewGrouping() {
  const _screenKey = SCREEN_KEYS.PIPELINE_REVIEW_GROUPING;
  const [, navigate] = useLocation();
  const searchString = useSearch();
  // ── URL param mode ────────────────────────────────────────────────────────────────────────
  const urlParams = new URLSearchParams(searchString);
  const urlMode = urlParams.get('mode');

  // ── Initialise state ─────────────────────────────────────────────────────
  //
  // Priority order:
  //   1. Fresh navigation from Dashboard (history.state.navToken is present and
  //      newer than the token stored in the saved session) → discard stale
  //      session, build ReviewFile list from the real StagedDocument objects
  //      passed in history.state.selectedDocs.
  //   2. Restored back-navigation from Confirm page (history.state has
  //      selectedFileNames but no navToken) → use saved session if it exists,
  //      otherwise fall back to name-based reconstruction.
  //   3. Direct URL access / hard refresh with no navigation state → use saved
  //      session if it exists, otherwise fall back to MOCK_FILES.
  //
  const [files, setFiles] = useState<ReviewFile[]>(() => {
    const histState = window.history.state as {
      selectedDocs?: IncomingDoc[];
      navToken?: number;
      selectedFileNames?: string[];
    } | null;

    const incomingDocs = histState?.selectedDocs;
    const incomingToken = histState?.navToken;
    const saved = loadSession();

    // Case 1 — fresh navigation from Dashboard
    if (incomingDocs && incomingDocs.length > 0 && incomingToken) {
      const savedToken = saved?.navToken;
      const isFresh = !savedToken || incomingToken > savedToken;
      if (isFresh) {
        // Clear the stale session so the new selection takes precedence
        clearSession();
        return incomingDocs.map<ReviewFile>(d => ({
          id: d.id,
          display_name: d.display_name,
          original_filename: d.display_name,
          status: d.status === 'invalid' ? 'invalid' : 'valid',
          document_role: 'Unassigned',
          file_size_bytes: d.file_size_bytes,
          page_count: d.page_count ?? 0,
          inExtraction: d.status !== 'invalid',
        }));
      }
    }

    // Case 2 & 3 — back-navigation or hard refresh: prefer saved session
    if (saved) return saved.files;

    // Case 2 fallback — back-nav with selectedFileNames but no saved session
    const backNames = histState?.selectedFileNames;
    if (backNames && backNames.length > 0) {
      const filtered = MOCK_FILES.filter(f =>
        backNames.includes(f.original_filename) || backNames.includes(f.display_name)
      );
      if (filtered.length > 0) {
        return filtered.map(f => ({ ...f, inExtraction: f.status === 'valid' }));
      }
    }

    // Case 3 fallback — direct URL access, no state at all
    return MOCK_FILES;
  });

  const [packageName, setPackageName] = useState<string>(() => {
    const histState = window.history.state as { navToken?: number } | null;
    // Fresh navigation → reset package name
    if (histState?.navToken) {
      const saved = loadSession();
      if (!saved || (histState.navToken > (saved.navToken ?? 0))) return 'Contract Package';
    }
    return loadSession()?.packageName ?? 'Contract Package';
  });
  const [filterRole, setFilterRole] = useState<string>(() => {
    const histState = window.history.state as { navToken?: number } | null;
    if (histState?.navToken) {
      const saved = loadSession();
      if (!saved || (histState.navToken > (saved.navToken ?? 0))) return 'all';
    }
    return loadSession()?.filterRole ?? 'all';
  });
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const saved = loadSession();
    return saved?.activeFileId ?? (saved?.files[0]?.id ?? MOCK_FILES[0]?.id ?? '');
  });
  const [zoom, setZoom] = useState<number>(() => loadSession()?.zoom ?? 100);

  const [lastRename, setLastRename] = useState<{ id: string; prev: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPackageName, setEditingPackageName] = useState(false);
  const [packageNameEdit, setPackageNameEdit] = useState(packageName);
  const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // ── Session restore banner ─────────────────────────────────────────────────────────────────────────
  // Show banner when files came from sessionStorage (no fresh navToken in history)
  const [sessionRestored, setSessionRestored] = useState<boolean>(() => {
    const histState = window.history.state as { navToken?: number; selectedDocs?: unknown[] } | null;
    const hasFreshNav = !!(histState?.navToken && histState?.selectedDocs && (histState.selectedDocs as unknown[]).length > 0);
    const hasSavedSession = !!loadSession();
    return !hasFreshNav && hasSavedSession;
  });
  // ── Target Record assignment ────────────────────────────────────────────────
  type TargetMode = 'unknown' | 'new' | 'existing';
  const [targetMode, setTargetMode] = useState<TargetMode>('unknown');
  const [targetRecordId, setTargetRecordId] = useState<string | null>(null);
  const [targetRecordSearch, setTargetRecordSearch] = useState('');
  const [showRecordDropdown, setShowRecordDropdown] = useState(false);
  const [workingTitle, setWorkingTitle] = useState('');
  // Inline mock records (duplicated to avoid circular import from RecordsSearch)
  // Use shared MOCK_CONTRACT_RECORDS from mockData.ts (replaces inline mock)
  const filteredRecords = searchContractRecords(targetRecordSearch.length >= 1 ? targetRecordSearch : ' ').concat(
    targetRecordSearch.length < 1 ? MOCK_CONTRACT_RECORDS : []
  ).filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);

  // ── Persist state to sessionStorage on every meaningful change ────────────
  useEffect(() => {
    const histState = window.history.state as { navToken?: number } | null;
    const session: ReviewSession = {
      files,
      packageName,
      filterRole,
      activeFileId,
      zoom,
      selectedFileNames: files.map(f => f.display_name),
      // Carry the navToken forward so hard-refresh can detect a stale session
      navToken: histState?.navToken,
    };
    saveSession(session);
  }, [files, packageName, filterRole, activeFileId, zoom]);

  // Derived sections
  const extractionFiles = files.filter(f => f.inExtraction);
  const noExtractionFiles = files.filter(f => !f.inExtraction);

  // Apply role filter within each section
  const filteredExtraction = extractionFiles.filter(f =>
    filterRole === 'all' || f.document_role === filterRole
  );
  const filteredNoExtraction = noExtractionFiles.filter(f =>
    filterRole === 'all' || f.document_role === filterRole
  );

  const derivedMode = extractionFiles.length >= 2 ? 'Contract Package' : 'Single Contract';
  const submissionMode =
    urlMode === 'attach' ? 'Attach to Existing' :
    urlMode === 'create' ? 'Create New' :
    derivedMode;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const handleRename = useCallback((id: string, name: string) => {
    setFiles(prev => {
      const prevName = prev.find(f => f.id === id)?.display_name ?? '';
      setLastRename({ id, prev: prevName });
      return prev.map(f => f.id === id ? { ...f, display_name: name } : f);
    });
    toast('File renamed', {
      action: {
        label: 'Undo',
        onClick: () => {
          setFiles(p => p.map(f => f.id === id ? { ...f, display_name: lastRename?.prev ?? f.display_name } : f));
          setLastRename(null);
        },
      },
      duration: 4000,
    });
  }, [lastRename]);

  function handleRoleChange(id: string, role: DocumentRole) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, document_role: role } : f));
  }

  function handleMove(id: string, to: 'extraction' | 'no-extraction') {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, inExtraction: to === 'extraction' } : f
    ));
    const file = files.find(f => f.id === id);
    if (file) {
      toast(to === 'extraction'
        ? `"${file.display_name}" moved to Extraction`
        : `"${file.display_name}" excluded from Extraction`
      );
    }
  }

  function commitPackageName() {
    const trimmed = packageNameEdit.trim();
    if (trimmed) setPackageName(trimmed);
    else setPackageNameEdit(packageName);
    setEditingPackageName(false);
  }

  return (
    <div className="page-container flex flex-col h-full">
      {/* Session restore banner */}
      {sessionRestored && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 text-[13px]">
            <Info className="w-4 h-4 shrink-0" />
            <span>Session restored — your previous grouping has been reloaded.</span>
          </div>
          <button
            onClick={() => setSessionRestored(false)}
            className="p-0.5 rounded hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Review &amp; Group</h1>
            <ScreenNumberBadge screenKey="pipeline-review-grouping" />
          </div>
          <p className="page-subtitle">
            Assign document roles and confirm groupings before submission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent border border-border text-[13px] font-semibold text-primary">
            <Layers className="w-3.5 h-3.5" />
            Mode: {submissionMode}
          </span>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>

        {/* Left panel — 55% */}
        <div className="split-panel-left flex flex-col" style={{ width: '55%' }}>

          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {filterRole !== 'all' && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">1</span>
                )}
              </button>
              <span className="text-[12px] text-muted-foreground">{selectedIds.size} selected</span>
            </div>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="px-4 py-2.5 border-b border-border bg-muted/10 flex items-center gap-3">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-7 w-40 text-[12px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All roles</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-[12px]">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterRole !== 'all' && (
                <button
                  onClick={() => setFilterRole('all')}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">

            {/* ── TARGET RECORD SECTION ── */}
            <div className="border-b border-border px-4 py-3 bg-muted/20">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target Record</p>
              <div className="flex gap-1 mb-3">
                {(['unknown', 'new', 'existing'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTargetMode(mode);
                      setTargetRecordId(mode === 'new' ? 'new' : null);
                      setTargetRecordSearch('');
                      setShowRecordDropdown(false);
                    }}
                    className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                      targetMode === mode
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {mode === 'unknown' ? 'Unknown / Later' : mode === 'new' ? 'New Record' : 'Existing Record'}
                  </button>
                ))}
              </div>
              {targetMode === 'existing' && (
                <div className="relative">
                  <input
                    value={targetRecordSearch}
                    onChange={e => { setTargetRecordSearch(e.target.value); setShowRecordDropdown(true); setTargetRecordId(null); }}
                    onFocus={() => setShowRecordDropdown(true)}
                    placeholder="Contract number or counterparty name…"
                    className="w-full h-8 px-3 text-[12px] rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {showRecordDropdown && filteredRecords.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                      {filteredRecords.map(r => (
                        <button
                          key={r.id}
                          className="w-full text-left px-3 py-2 text-[12px] hover:bg-accent transition-colors"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setTargetRecordId(r.id);
                            setTargetRecordSearch(`${r.contractNumber} — ${r.counterparty}`);
                            setShowRecordDropdown(false);
                          }}
                        >
                          <span className="font-mono text-primary">{r.contractNumber}</span>
                          <span className="text-muted-foreground"> — {r.counterparty} · {r.address}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {targetRecordId && targetMode === 'existing' && (
                    <p className="text-[11px] text-[var(--color-lg-success)] mt-1">✓ Record selected: {targetRecordSearch}</p>
                  )}
                </div>
              )}
              {targetMode === 'new' && (
                <input
                  value={workingTitle}
                  onChange={e => setWorkingTitle(e.target.value)}
                  placeholder="Working title (optional)…"
                  className="w-full h-8 px-3 text-[12px] rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )}
            </div>

            {/* ── SECTION A: Extraction ── */}
            <div className="border-b border-border">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40">
                <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                {editingPackageName ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      value={packageNameEdit}
                      onChange={e => setPackageNameEdit(e.target.value)}
                      onBlur={commitPackageName}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitPackageName();
                        if (e.key === 'Escape') { setPackageNameEdit(packageName); setEditingPackageName(false); }
                      }}
                      className="flex-1 h-6 px-2 text-[12px] border border-primary rounded focus:outline-none bg-background"
                      autoFocus
                    />
                    <button onClick={commitPackageName} className="p-0.5 text-[var(--color-lg-success)]"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setPackageNameEdit(packageName); setEditingPackageName(false); }} className="p-0.5 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1 group">
                    <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">Extraction</span>
                    <span className="text-[11px] text-muted-foreground ml-1">· {packageName}</span>
                    {/* Role Completeness badge */}
                    {extractionFiles.length > 0 && (
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        extractionFiles.every(f => f.document_role !== 'Unassigned')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {extractionFiles.filter(f => f.document_role !== 'Unassigned').length}/{extractionFiles.length} roles
                      </span>
                    )}
                    <button
                      onClick={() => { setPackageNameEdit(packageName); setEditingPackageName(true); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {filteredExtraction.length}
                </span>
              </div>

              <div className="divide-y divide-border">
                {filteredExtraction.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    selected={selectedIds.has(file.id)}
                    active={activeFileId === file.id}
                    section="extraction"
                    onSelect={toggleSelect}
                    onActivate={setActiveFileId}
                    onRename={handleRename}
                    onRoleChange={handleRoleChange}
                    onMove={handleMove}
                  />
                ))}
                {filteredExtraction.length === 0 && (
                  <div className="py-6 text-center text-[13px] text-muted-foreground">
                    No files in Extraction section.
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION B: No Extraction ── */}
            <div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50/40 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/40">
                <Lock className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">No Extraction</span>
                <span className="ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  {filteredNoExtraction.length}
                </span>
              </div>

              {filteredNoExtraction.length === 0 ? (
                <div className="mx-4 my-4 flex items-center justify-center rounded-lg border-2 border-dashed border-border py-6 text-[13px] text-muted-foreground">
                  No files excluded — all valid files will be extracted
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNoExtraction.map(file => (
                    <FileRow
                      key={file.id}
                      file={file}
                      selected={selectedIds.has(file.id)}
                      active={activeFileId === file.id}
                      section="no-extraction"
                      onSelect={toggleSelect}
                      onActivate={setActiveFileId}
                      onRename={handleRename}
                      onRoleChange={handleRoleChange}
                      onMove={handleMove}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info callout */}
          <div className="px-4 py-3 border-t border-border bg-muted/20">
            <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>Only files in the Extraction section will be packaged. Invalid files cannot be moved to Extraction.</span>
            </div>
          </div>
        </div>

        {/* Right panel — 45% */}
        <div className="split-panel-right flex flex-col" style={{ width: '45%' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            <p className="text-[12px] font-medium text-foreground truncate max-w-[200px]">
              {files.find(f => f.id === activeFileId)?.display_name ?? '—'}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] text-muted-foreground w-12 text-center font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(200, z + 10))}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
            <div
              className="bg-white border border-border shadow-md rounded flex items-center justify-center"
              style={{ width: `${zoom * 3}px`, maxWidth: '100%', height: '500px', transition: 'width 0.15s ease' }}
            >
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-[13px] font-medium">PDF Preview</p>
                <p className="text-[11px] mt-1">
                  {files.find(f => f.id === activeFileId)?.display_name}
                </p>
                <p className="text-[11px] mt-0.5 opacity-60">
                  Preview loads after backend integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          <span className="text-foreground font-medium">{extractionFiles.length}</span> file{extractionFiles.length !== 1 ? 's' : ''} will be sent for extraction
          {noExtractionFiles.length > 0 && (
            <span className="ml-1 text-muted-foreground">· <span className="text-red-600 font-medium">{noExtractionFiles.length}</span> excluded</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              clearSession();
              toast('Package discarded — documents returned to staging.');
              navigate('/pipeline/dashboard');
            }}
          >
            <X className="w-4 h-4" />
            Undo Package
          </Button>
          <Button
            className="gap-2"
            disabled={extractionFiles.length === 0}
            onClick={() => setShowSubmissionPanel(true)}
            title={extractionFiles.length === 0 ? 'Add at least one file to Extraction before submitting' : undefined}
          >
            <ChevronRight className="w-4 h-4" />
            Review &amp; Submit
          </Button>
        </div>
      </div>

      {/* Submission Detail Panel */}
      {showSubmissionPanel && (
        <SubmissionDetailPanel
          extractionFiles={extractionFiles}
          packageName={packageName}
          onClose={() => setShowSubmissionPanel(false)}
          onConfirm={() => {
            setShowSubmissionPanel(false);
            // V3 Change 4 — fire BATCH_SUBMITTED in-place, no intermediate confirm page
            // DEMO ONLY: notify Preparer tab that a new batch is ready for extraction.
            // PRODUCTION: replace with: await api.post('/api/v1/submissions', { batchId, files, ... })
            const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
            const pkgNum = `PKG-${Date.now().toString(36).toUpperCase()}`;
            publishEvent({
              type: 'BATCH_SUBMITTED',
              sourceRole: 'document_submitter',
              payload: {
                batchId,
                packageNum: pkgNum,
                fileCount: extractionFiles.length,
                workspaceTag: extractionFiles[0]?.display_name?.split('-')[0] ?? 'General',
                packageName,
                targetRecordId,
                submissionMode,
              },
            });
            clearSession();
            toast.success(`Package submitted for extraction — ${extractionFiles.length} file${extractionFiles.length !== 1 ? 's' : ''} queued.`, {
              action: { label: 'View Queue', onClick: () => navigate('/extraction/queue') },
              duration: 6000,
            });
            navigate('/pipeline/dashboard');
          }}
        />
      )}
    </div>
  );
}
