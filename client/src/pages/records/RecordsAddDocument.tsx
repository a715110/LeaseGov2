/**
 * RecordsAddDocument — FC-5 Screen 5.4 (MVP)
 * Screen key: records-add-document
 * Route: /records/:id/add-document
 *
 * Prompt 5.7: Full-screen inline dialog (same pattern as ReviewDialog421 from FC-4).
 * Context card (locked, surface-secondary) showing record info.
 * Upload zone pre-set to record. Document role suggestion from filename.
 * Info callout about auto-package promotion.
 * "Upload and Process" primary button.
 *
 * Data model refs: StagedDocument (document_role, original_filename),
 *   ContractRecord (contract_number, title)
 */

import { useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  X, Upload, FileText, CheckCircle2, AlertTriangle,
  Info, ChevronDown, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

type DocumentRole = "base_contract" | "amendment" | "addendum" | "exhibit" | "schedule" | "notice" | "supporting" | "unknown";

interface StagedFile {
  id: string;
  file: File;
  suggested_role: DocumentRole;
  selected_role: DocumentRole;
  status: "pending" | "uploading" | "done" | "error";
}

const ROLE_OPTIONS: { value: DocumentRole; label: string }[] = [
  { value:"base_contract", label:"Base Contract" },
  { value:"amendment",     label:"Amendment" },
  { value:"addendum",      label:"Addendum" },
  { value:"exhibit",       label:"Exhibit" },
  { value:"schedule",      label:"Schedule" },
  { value:"notice",        label:"Notice" },
  { value:"supporting",    label:"Supporting" },
  { value:"unknown",       label:"Unknown" },
];

function suggestRole(filename: string): DocumentRole {
  const lower = filename.toLowerCase();
  if (lower.includes("amendment") || lower.includes("amend")) return "amendment";
  if (lower.includes("addendum")) return "addendum";
  if (lower.includes("exhibit")) return "exhibit";
  if (lower.includes("schedule")) return "schedule";
  if (lower.includes("notice")) return "notice";
  if (lower.includes("lease") || lower.includes("contract")) return "base_contract";
  return "supporting";
}

// TODO: Backend integration required — GET /api/records/:id (context card)
const MOCK_RECORD_CONTEXT = {
  contract_number: "CR-2026-0088",
  title: "Office Tower — 350 Fifth Ave",
  status: "approved",
  counterparty: "Fifth Ave Properties LLC",
  workspace_tag: "Corporate HQ",
};

export default function RecordsAddDocument() {
  const _screenKey = SCREEN_KEYS.RECORDS_ADD_DOCUMENT;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordId = params.id || "r1";

  const [files, setFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: StagedFile[] = Array.from(fileList).map(f => ({
      id: `f-${Date.now()}-${Math.random()}`,
      file: f,
      suggested_role: suggestRole(f.name),
      selected_role: suggestRole(f.name),
      status: "pending",
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }

  function updateRole(id: string, role: DocumentRole) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, selected_role: role } : f));
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  // TODO: Backend integration required — POST /api/records/:id/documents
  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setFiles(prev => prev.map(f => ({ ...f, status: "uploading" as const })));
    await new Promise(r => setTimeout(r, 1500));
    setFiles(prev => prev.map(f => ({ ...f, status: "done" as const })));
    setUploading(false);
    setDone(true);
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-lg-page-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-[var(--color-lg-primary)]" />
          <h1 className="text-[15px] font-bold text-foreground">Add Document to Record</h1>
          <span className="font-mono text-[13px] text-muted-foreground">{MOCK_RECORD_CONTEXT.contract_number}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/records/${recordId}`)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 max-w-3xl mx-auto w-full">
        {/* Record context card */}
        <div className="rounded-lg border px-5 py-4 flex items-start gap-3" style={{ background:"var(--color-lg-accent-subtle)", borderColor:"var(--color-lg-primary-light)" }}>
          <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-primary)" }} />
          <div>
            <p className="text-[13px] font-semibold text-foreground">{MOCK_RECORD_CONTEXT.contract_number} — {MOCK_RECORD_CONTEXT.title}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {MOCK_RECORD_CONTEXT.counterparty} · Workspace: {MOCK_RECORD_CONTEXT.workspace_tag}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Upload zone is pre-set to this record and cannot be changed.</p>
          </div>
        </div>

        {/* Auto-package promotion callout */}
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3" style={{ background:"var(--color-lg-info-subtle)", borderColor:"var(--color-lg-info)" }}>
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-info)" }} />
          <p className="text-[12px]" style={{ color:"var(--color-lg-info)" }}>
            <strong>Auto-package promotion:</strong> After upload, the document will be automatically added to the existing Contract Package for this record and queued for extraction. You will be redirected to the Extraction Queue.
          </p>
        </div>

        {/* Upload zone */}
        {!done && (
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 gap-3 transition-colors cursor-pointer ${isDragging ? "border-[var(--color-lg-primary)] bg-[var(--color-lg-accent-subtle)]" : "border-border bg-card hover:border-[var(--color-lg-primary-light)] hover:bg-muted/20"}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("add-doc-input")?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-lg-accent-subtle)] flex items-center justify-center">
              <Upload className="w-6 h-6 text-[var(--color-lg-primary)]" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-foreground">Drop files here or click to browse</p>
              <p className="text-[12px] text-muted-foreground mt-1">PDF, TIFF, DOCX · Max 50 MB per file</p>
            </div>
            <input id="add-doc-input" type="file" multiple accept=".pdf,.tiff,.tif,.docx" className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-[13px] font-semibold text-foreground">Files to Upload ({files.length})</h3>
            {files.map(f => (
              <div key={f.id} className="bg-card border border-border rounded-lg px-4 py-3.5 flex items-center gap-4">
                <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{f.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtSize(f.file.size)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-muted-foreground">Role:</span>
                  <div className="relative">
                    <select className="appearance-none pl-2.5 pr-7 py-1.5 text-[12px] border border-border rounded bg-background focus:outline-none" value={f.selected_role} onChange={e => updateRole(f.id, e.target.value as DocumentRole)} disabled={uploading || done}>
                      {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  </div>
                  {f.suggested_role === f.selected_role && <span className="text-[10px] text-muted-foreground italic">suggested</span>}
                </div>
                {f.status === "uploading" && <div className="w-5 h-5 border-2 border-[var(--color-lg-primary)] border-t-transparent rounded-full animate-spin shrink-0" />}
                {f.status === "done" && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />}
                {f.status === "error" && <AlertTriangle className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-error)" }} />}
                {f.status === "pending" && !uploading && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeFile(f.id)}><X className="w-3.5 h-3.5" /></Button>}
              </div>
            ))}
          </div>
        )}

        {/* Success state */}
        {done && (
          <div className="rounded-xl border-2 flex flex-col items-center justify-center py-10 gap-3" style={{ borderColor:"var(--color-lg-success)", background:"var(--color-lg-success-subtle)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color:"var(--color-lg-success)" }} />
            <p className="text-[15px] font-semibold text-foreground">Upload Complete</p>
            <p className="text-[13px] text-muted-foreground text-center max-w-sm">
              {files.length} document{files.length > 1 ? "s" : ""} added to {MOCK_RECORD_CONTEXT.contract_number}. Redirecting to Extraction Queue…
            </p>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-3.5 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/records/${recordId}`)} disabled={uploading}>Cancel</Button>
        {done ? (
          <Button className="gap-1.5" style={{ background:"var(--color-lg-success)" }} onClick={() => navigate("/extraction/queue")}>
            Go to Extraction Queue
          </Button>
        ) : (
          <Button className="gap-1.5" disabled={files.length === 0 || uploading} onClick={handleUpload}>
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload and Process ({files.length} file{files.length !== 1 ? "s" : ""})</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
