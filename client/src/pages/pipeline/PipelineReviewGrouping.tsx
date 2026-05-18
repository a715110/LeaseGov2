/**
 * PipelineReviewGrouping — FC-1 Screen 1.5
 * Screen key: pipeline-review-grouping
 * Route: /pipeline/review
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * POST-SCAFFOLDING changes:
 *   S3a — dialog width: max-w-4xl for the grouping dialog (N/A here — no dialog in this screen; the
 *          spec refers to the "New Contract Package" group dialog which is inline here)
 *   S3b — editable package name on the Contract Package group header
 *   S3c — undo last rename (stores previous display_name, shows Undo toast)
 *   S3d — submission detail panel (FlagSlidingPanel) showing full batch summary before submit
 *   S3e — rename inline (already present, confirmed)
 *   S3f — filter bar: filter by document_role and status
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  FileText, CheckSquare, Square, ChevronDown, Edit2, Check,
  X, ZoomIn, ZoomOut, Layers, Package, Info, Save, Send,
  Undo2, Filter, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { FlagSlidingPanel } from '@/components/shared/FlagSlidingPanel';
import { toast } from 'sonner';
import { SCREEN_KEYS } from '@/constants/screenKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentRole =
  | 'base_contract' | 'amendment' | 'addendum'
  | 'exhibit' | 'schedule' | 'notice' | 'supporting' | 'unknown';

interface ReviewFile {
  id: string;
  display_name: string;
  original_filename: string;
  status: 'valid' | 'warning';
  document_role: DocumentRole;
  file_size_bytes: number;
  page_count: number;
  grouped?: boolean;
}

// ─── Mock data — TODO: Backend integration required ───────────────────────────

const MOCK_FILES: ReviewFile[] = [
  { id: 'f1', display_name: 'Retail-HQ-Lease-2026.pdf', original_filename: 'Retail-HQ-Lease-2026.pdf', status: 'valid', document_role: 'base_contract', file_size_bytes: 4_200_000, page_count: 24, grouped: true },
  { id: 'f2', display_name: 'Office-Tower-Amendment-3.pdf', original_filename: 'Office-Tower-Amendment-3.pdf', status: 'warning', document_role: 'amendment', file_size_bytes: 1_800_000, page_count: 8, grouped: true },
  { id: 'f3', display_name: 'Warehouse-Lease-Exhibit-A.tiff', original_filename: 'Warehouse-Lease-Exhibit-A.tiff', status: 'valid', document_role: 'exhibit', file_size_bytes: 6_100_000, page_count: 12 },
  { id: 'f5', display_name: 'Ground-Lease-Base-Contract.pdf', original_filename: 'Ground-Lease-Base-Contract.pdf', status: 'valid', document_role: 'base_contract', file_size_bytes: 9_400_000, page_count: 41 },
  { id: 'f6', display_name: 'Industrial-Park-Schedule.pdf', original_filename: 'Industrial-Park-Schedule.pdf', status: 'valid', document_role: 'schedule', file_size_bytes: 2_200_000, page_count: 6 },
];

const ROLE_LABELS: Record<DocumentRole, string> = {
  base_contract: 'Base Contract',
  amendment: 'Amendment',
  addendum: 'Addendum',
  exhibit: 'Exhibit',
  schedule: 'Schedule',
  notice: 'Notice',
  supporting: 'Supporting',
  unknown: 'Unknown',
};

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ─── File row ─────────────────────────────────────────────────────────────────

interface FileRowProps {
  file: ReviewFile;
  selected: boolean;
  active: boolean;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRoleChange: (id: string, role: DocumentRole) => void;
}

function FileRow({ file, selected, active, onSelect, onActivate, onRename, onRoleChange }: FileRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(file.display_name);

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed) onRename(file.id, trimmed);
    else setEditValue(file.display_name);
    setEditing(false);
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-accent' : 'hover:bg-muted/30'}`}
      onClick={() => onActivate(file.id)}
    >
      <button
        onClick={e => { e.stopPropagation(); onSelect(file.id); }}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
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
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditValue(file.display_name); setEditing(false); } }}
              className="flex-1 h-7 px-2 text-[12px] border border-primary rounded focus:outline-none"
              autoFocus
            />
            <button onClick={commitRename} className="p-1 text-[var(--color-lg-success)]"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditValue(file.display_name); setEditing(false); }} className="p-1 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group">
            <p className="text-[13px] font-medium text-foreground truncate">{file.display_name}</p>
            <button
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">{formatBytes(file.file_size_bytes)} · {file.page_count} pages</p>
      </div>

      <div onClick={e => e.stopPropagation()} className="shrink-0">
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
      </div>

      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${file.status === 'valid' ? 'badge-valid' : 'badge-warning'}`}>
        {file.status === 'valid' ? 'Valid' : 'Warning'}
      </span>
    </div>
  );
}

// ─── S3d: Submission Detail Panel ─────────────────────────────────────────────

function SubmissionDetailPanel({
  files,
  packageName,
  submissionMode,
  onClose,
  onConfirm,
}: {
  files: ReviewFile[];
  packageName: string;
  submissionMode: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const validCount = files.filter(f => f.status === 'valid').length;
  const warningCount = files.filter(f => f.status === 'warning').length;

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
            <span className="text-[13px] font-semibold text-foreground">{submissionMode}</span>
            {submissionMode === 'Contract Package' && (
              <span className="text-[12px] text-muted-foreground">· {packageName}</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">File Breakdown</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total files</span>
              <span className="font-medium text-foreground">{files.length}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Valid</span>
              <span className="font-medium text-[var(--color-lg-success)]">{validCount}</span>
            </div>
            {warningCount > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Warning</span>
                <span className="font-medium text-amber-600">{warningCount}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Document Roles</p>
          <div className="space-y-1.5">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-foreground truncate flex-1">{f.display_name}</span>
                <span className="text-muted-foreground shrink-0">{ROLE_LABELS[f.document_role]}</span>
              </div>
            ))}
          </div>
        </div>

        {warningCount > 0 && (
          <div className="rounded bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
            {warningCount} file{warningCount !== 1 ? 's have' : ' has'} warnings. Warnings do not block submission but may affect extraction quality.
          </div>
        )}
      </div>
    </FlagSlidingPanel>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineReviewGrouping() {
  const _screenKey = SCREEN_KEYS.PIPELINE_REVIEW_GROUPING;
  const [location, navigate] = useLocation();

  // Filter to only the files selected on the dashboard (passed via navigation state).
  // Fall back to all MOCK_FILES when navigated to directly (e.g. demo / direct URL).
  const initialFiles = (() => {
    const state = (window.history.state as any)?.selectedFileNames as string[] | undefined;
    if (state && state.length > 0) {
      const filtered = MOCK_FILES.filter(f => state.includes(f.original_filename) || state.includes(f.display_name));
      return filtered.length > 0 ? filtered : MOCK_FILES;
    }
    return MOCK_FILES;
  })();

  const [files, setFiles] = useState<ReviewFile[]>(initialFiles);
  // S3c: undo last rename
  const [lastRename, setLastRename] = useState<{ id: string; prev: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFileId, setActiveFileId] = useState<string>(MOCK_FILES[0].id);
  const [zoom, setZoom] = useState(100);
  // S3b: editable package name
  const [packageName, setPackageName] = useState('Contract Package');
  const [editingPackageName, setEditingPackageName] = useState(false);
  const [packageNameEdit, setPackageNameEdit] = useState(packageName);
  // S3d: submission detail panel
  const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);
  // S3f: filter bar
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const groupedFiles = files.filter(f => f.grouped);
  const ungroupedFiles = files.filter(f => !f.grouped);
  const submissionMode = groupedFiles.length >= 2 ? 'Contract Package' : 'Single Contract';

  // S3f: apply filters
  const filteredGrouped = groupedFiles.filter(f => {
    if (filterRole !== 'all' && f.document_role !== filterRole) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });
  const filteredUngrouped = ungroupedFiles.filter(f => {
    if (filterRole !== 'all' && f.document_role !== filterRole) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });
  const filteredFiles = [...filteredGrouped, ...filteredUngrouped];
  const activeFiltersCount = (filterRole !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // S3c: rename with undo
  const handleRename = useCallback((id: string, name: string) => {
    setFiles(prev => {
      const prev_name = prev.find(f => f.id === id)?.display_name ?? '';
      setLastRename({ id, prev: prev_name });
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

  function commitPackageName() {
    const trimmed = packageNameEdit.trim();
    if (trimmed) setPackageName(trimmed);
    else setPackageNameEdit(packageName);
    setEditingPackageName(false);
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Review &amp; Group</h1>
          <p className="page-subtitle">Assign document roles and confirm groupings before submission.</p>
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

        {/* Left panel 55% */}
        <div className="split-panel-left flex flex-col" style={{ width: '55%' }}>
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">{filteredFiles.length} of {files.length} files</p>
            <div className="flex items-center gap-2">
              {/* S3f: filter toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <span className="text-[12px] text-muted-foreground">{selectedIds.size} selected</span>
            </div>
          </div>

          {/* S3f: filter bar */}
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-7 w-32 text-[12px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All statuses</SelectItem>
                  <SelectItem value="valid" className="text-[12px]">Valid</SelectItem>
                  <SelectItem value="warning" className="text-[12px]">Warning</SelectItem>
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setFilterRole('all'); setFilterStatus('all'); }}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {/* S3b: Contract Package group with editable name */}
            {filteredGrouped.length > 0 && (
              <div className="border border-primary/20 rounded-lg m-3 overflow-hidden bg-accent/30">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent border-b border-primary/20">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  {editingPackageName ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        value={packageNameEdit}
                        onChange={e => setPackageNameEdit(e.target.value)}
                        onBlur={commitPackageName}
                        onKeyDown={e => { if (e.key === 'Enter') commitPackageName(); if (e.key === 'Escape') { setPackageNameEdit(packageName); setEditingPackageName(false); } }}
                        className="flex-1 h-6 px-2 text-[12px] border border-primary rounded focus:outline-none bg-background"
                        autoFocus
                      />
                      <button onClick={commitPackageName} className="p-0.5 text-[var(--color-lg-success)]"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setPackageNameEdit(packageName); setEditingPackageName(false); }} className="p-0.5 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-1 group">
                      <span className="text-[12px] font-semibold text-primary">{packageName}</span>
                      <button
                        onClick={() => { setPackageNameEdit(packageName); setEditingPackageName(true); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{filteredGrouped.length} files</span>
                </div>
                {filteredGrouped.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    selected={selectedIds.has(file.id)}
                    active={activeFileId === file.id}
                    onSelect={toggleSelect}
                    onActivate={setActiveFileId}
                    onRename={handleRename}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </div>
            )}

            {/* Ungrouped files */}
            {filteredUngrouped.map(file => (
              <FileRow
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                active={activeFileId === file.id}
                onSelect={toggleSelect}
                onActivate={setActiveFileId}
                onRename={handleRename}
                onRoleChange={handleRoleChange}
              />
            ))}

            {filteredFiles.length === 0 && (
              <div className="py-10 text-center text-[13px] text-muted-foreground">
                No files match the current filters.
              </div>
            )}
          </div>

          {/* Info callout */}
          <div className="px-4 py-3 border-t border-border bg-muted/20">
            <div className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>Two or more files with the same contract record will be auto-grouped as a Contract Package.</span>
            </div>
          </div>
        </div>

        {/* Right panel 45% */}
        <div className="split-panel-right flex flex-col" style={{ width: '45%' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            <p className="text-[12px] font-medium text-foreground truncate max-w-[200px]">
              {files.find(f => f.id === activeFileId)?.display_name}
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
                  {/* TODO: Backend integration required — render PDF from storage_path */}
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
          {files.length} file{files.length !== 1 ? 's' : ''} ready for submission · {submissionMode}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { /* TODO: Backend integration required — save draft */ }}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          {/* S3d: opens submission detail panel instead of navigating directly */}
          <Button
            className="gap-2"
            onClick={() => setShowSubmissionPanel(true)}
          >
            <ChevronRight className="w-4 h-4" />
            Review &amp; Submit
          </Button>
        </div>
      </div>

      {/* S3d: Submission Detail Panel */}
      {showSubmissionPanel && (
        <SubmissionDetailPanel
          files={files}
          packageName={packageName}
          submissionMode={submissionMode}
          onClose={() => setShowSubmissionPanel(false)}
          onConfirm={() => {
            setShowSubmissionPanel(false);
            navigate('/pipeline/confirm');
          }}
        />
      )}
    </div>
  );
}
