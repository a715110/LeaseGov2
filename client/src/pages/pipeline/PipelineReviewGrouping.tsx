/**
 * PipelineReviewGrouping — FC-1 Screen 1.5
 * Screen key: pipeline-review-grouping
 * Route: /pipeline/review
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * Prompt 1.5: Split-panel file review and grouping.
 *   Left (55%): file list with checkboxes, thumbnails, editable names, document role dropdowns.
 *               Two files grouped in a "Contract Package" card.
 *   Right (45%): PDF preview placeholder with zoom controls.
 *   Submission mode auto-detected label.
 *   "Submit for Ingestion" primary, "Save Draft" outlined.
 * Data model refs: StagedDocument (display_name, document_role, status),
 *                  IntakeBatch (submission_mode: single_contract|contract_package|bulk_batch)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  FileText, CheckSquare, Square, ChevronDown, Edit2, Check,
  X, ZoomIn, ZoomOut, Layers, Package, Info, Save, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
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
  grouped?: boolean; // part of a contract package group
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

      {/* Thumbnail placeholder */}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelineReviewGrouping() {
  const _screenKey = SCREEN_KEYS.PIPELINE_REVIEW_GROUPING;
  const [, navigate] = useLocation();

  const [files, setFiles] = useState<ReviewFile[]>(MOCK_FILES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFileId, setActiveFileId] = useState<string>(MOCK_FILES[0].id);
  const [zoom, setZoom] = useState(100);

  const groupedFiles = files.filter(f => f.grouped);
  const ungroupedFiles = files.filter(f => !f.grouped);
  const submissionMode = groupedFiles.length >= 2 ? 'Contract Package' : 'Single Contract';

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleRename(id: string, name: string) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, display_name: name } : f));
  }

  function handleRoleChange(id: string, role: DocumentRole) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, document_role: role } : f));
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
            <p className="text-[13px] font-semibold text-foreground">{files.length} files</p>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span>{selectedIds.size} selected</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {/* Contract Package group */}
            {groupedFiles.length > 0 && (
              <div className="border border-primary/20 rounded-lg m-3 overflow-hidden bg-accent/30">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent border-b border-primary/20">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-[12px] font-semibold text-primary">Contract Package</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{groupedFiles.length} files</span>
                </div>
                {groupedFiles.map(file => (
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
            {ungroupedFiles.map(file => (
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
          {/* PDF toolbar */}
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

          {/* PDF preview placeholder */}
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
          <Button
            className="gap-2"
            onClick={() => navigate('/pipeline/confirm')}
          >
            <Send className="w-4 h-4" />
            Submit for Ingestion
          </Button>
        </div>
      </div>
    </div>
  );
}
