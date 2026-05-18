/**
 * AdminTemplates — FC-8 Screen 8.3
 * Screen key: admin-templates
 * Route: /admin/templates
 *
 * S7a: Unified TemplateModal (720px, shadcn Dialog) with 3 tabs:
 *   Tab 1 — Details: name, description, document types, status
 *   Tab 2 — Fields: inline field builder with DnD reorder (S7b), bulk delete
 *   Tab 3 — Upload Excel: drag-drop CSV/XLSX, parse headers, import to Fields tab
 * S7b: @dnd-kit/sortable drag-and-drop field reorder in Fields tab
 */

import { useState, useRef } from "react";
import {
  DndContext, closestCenter, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FileSpreadsheet, ChevronRight, GripVertical, Upload, Eye,
  CheckCircle2, AlertCircle, Plus, Trash2, Zap, X, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = "property_lease" | "equipment_lease" | "ground_lease";
type TemplateStatus = "draft" | "active" | "deprecated";
type DataType = "string" | "number" | "date" | "boolean" | "currency";
type Category = "Financial" | "Legal" | "Party" | "Date" | "Property" | "Other";

interface TemplateField {
  id: string;
  canonical_name: string;
  data_type: DataType;
  category: Category;
  validation_rule: string;
  is_critical: boolean;
  is_required: boolean;
  aliases: string[];
}

interface MappingRule {
  id: string;
  template_field: string;
  target_cell: string;
  mapping_type: "direct" | "computed" | "conditional";
  extraction_field: string | null;
}

interface TabDefinition {
  id: string;
  name: string;
  field_count: number;
  mappings: MappingRule[];
}

interface ExportTemplate {
  id: string;
  name: string;
  type: TemplateType;
  version: string;
  status: TemplateStatus;
  tab_count: number;
  mapped_field_count: number;
  total_field_count: number;
  tabs: TabDefinition[];
  created_at: string;
  fields: TemplateField[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEED_FIELDS: TemplateField[] = [
  { id:"f1", canonical_name:"lease_commencement_date", data_type:"date",     category:"Date",      validation_rule:"required",        is_critical:true,  is_required:true,  aliases:["start_date"] },
  { id:"f2", canonical_name:"lease_expiration_date",   data_type:"date",     category:"Date",      validation_rule:"required",        is_critical:true,  is_required:true,  aliases:["end_date"] },
  { id:"f3", canonical_name:"base_rent_monthly",       data_type:"currency", category:"Financial", validation_rule:"positive_number", is_critical:true,  is_required:true,  aliases:["monthly_rent"] },
  { id:"f4", canonical_name:"tenant_legal_name",       data_type:"string",   category:"Party",     validation_rule:"required",        is_critical:true,  is_required:true,  aliases:["tenant_name"] },
  { id:"f5", canonical_name:"landlord_legal_name",     data_type:"string",   category:"Party",     validation_rule:"required",        is_critical:true,  is_required:true,  aliases:["landlord_name"] },
  { id:"f6", canonical_name:"premises_address",        data_type:"string",   category:"Property",  validation_rule:"required",        is_critical:false, is_required:true,  aliases:[] },
  { id:"f7", canonical_name:"rentable_area_sqft",      data_type:"number",   category:"Property",  validation_rule:"positive_number", is_critical:false, is_required:true,  aliases:["sqft"] },
  { id:"f8", canonical_name:"security_deposit",        data_type:"currency", category:"Financial", validation_rule:"non_negative",    is_critical:false, is_required:false, aliases:[] },
];

const MOCK_TEMPLATES: ExportTemplate[] = [
  {
    id:"t1", name:"FASB ASC 842 — Property Lease", type:"property_lease", version:"2.1",
    status:"active", tab_count:5, mapped_field_count:68, total_field_count:73,
    created_at:"2026-01-15",
    fields: SEED_FIELDS,
    tabs:[
      { id:"tab1", name:"Cover Sheet",      field_count:8,  mappings:[] },
      { id:"tab2", name:"Financial Summary", field_count:24, mappings:[] },
      { id:"tab3", name:"Liability Table",  field_count:22, mappings:[] },
      { id:"tab4", name:"Asset Schedule",   field_count:12, mappings:[] },
      { id:"tab5", name:"Disclosure Notes", field_count:7,  mappings:[] },
    ],
  },
  {
    id:"t2", name:"Equipment Lease — IFRS 16", type:"equipment_lease", version:"1.3",
    status:"draft", tab_count:3, mapped_field_count:31, total_field_count:45,
    created_at:"2026-02-08",
    fields: SEED_FIELDS.slice(0, 4),
    tabs:[
      { id:"tab1", name:"Asset Register",  field_count:18, mappings:[] },
      { id:"tab2", name:"Payment Schedule", field_count:15, mappings:[] },
      { id:"tab3", name:"Disclosure",       field_count:12, mappings:[] },
    ],
  },
  {
    id:"t3", name:"Ground Lease — Long Term", type:"ground_lease", version:"1.0",
    status:"deprecated", tab_count:2, mapped_field_count:12, total_field_count:28,
    created_at:"2025-11-20",
    fields: SEED_FIELDS.slice(0, 3),
    tabs:[
      { id:"tab1", name:"Lease Terms",  field_count:16, mappings:[] },
      { id:"tab2", name:"Rent Schedule", field_count:12, mappings:[] },
    ],
  },
];

const DOC_TYPE_OPTIONS = [
  "Commercial Lease", "Amendment", "Sublease", "Renewal", "Termination", "Supporting"
];

const DATA_TYPES: DataType[] = ["string", "number", "date", "boolean", "currency"];
const CATEGORIES: Category[] = ["Financial", "Legal", "Party", "Date", "Property", "Other"];

// ─── SortableFieldRow (S7b) ───────────────────────────────────────────────────

function SortableFieldRow({
  field, selected, onSelect, onDelete, onToggleCritical, onToggleRequired
}: {
  field: TemplateField;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleCritical: (id: string) => void;
  onToggleRequired: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className={cn("border-b border-border", selected && "bg-primary/5")}>
      <td className="px-2 py-1.5 w-8">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </td>
      <td className="px-2 py-1.5 w-8">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(field.id)}
        />
      </td>
      <td className="px-2 py-1.5">
        <span className="font-mono text-[11px] text-primary">{field.canonical_name}</span>
      </td>
      <td className="px-2 py-1.5 text-[12px] text-muted-foreground">{field.data_type}</td>
      <td className="px-2 py-1.5 text-[12px] text-muted-foreground">{field.category}</td>
      <td className="px-2 py-1.5 text-[12px] text-muted-foreground">{field.validation_rule}</td>
      <td className="px-2 py-1.5 text-center">
        <Switch
          checked={field.is_critical}
          onCheckedChange={() => onToggleCritical(field.id)}
          className="scale-75"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <Switch
          checked={field.is_required}
          onCheckedChange={() => onToggleRequired(field.id)}
          className="scale-75"
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <button
          onClick={() => onDelete(field.id)}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── TemplateModal (S7a + S7b) ────────────────────────────────────────────────

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  initial?: ExportTemplate | null;
}

function TemplateModal({ open, onClose, initial }: TemplateModalProps) {
  const isEdit = !!initial;
  const [tab, setTab] = useState<"details" | "fields" | "upload">("details");

  // Tab 1 — Details
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState("");
  const [docTypes, setDocTypes] = useState<string[]>(["Commercial Lease"]);
  const [status, setStatus] = useState<TemplateStatus>(initial?.status ?? "draft");

  // Tab 2 — Fields (S7b)
  const [fields, setFields] = useState<TemplateField[]>(initial?.fields ?? []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tab 3 — Upload Excel
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Field helpers ──────────────────────────────────────────────────────────

  function addBlankField() {
    const id = `f${Date.now()}`;
    setFields(prev => [...prev, {
      id, canonical_name: "", data_type: "string", category: "Other",
      validation_rule: "", is_critical: false, is_required: false, aliases: [],
    }]);
  }

  function deleteField(id: string) {
    setFields(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  function bulkDelete() {
    setFields(prev => prev.filter(f => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleCritical(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, is_critical: !f.is_critical } : f));
  }

  function toggleRequired(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, is_required: !f.is_required } : f));
  }

  // S7b: DnD reorder
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id);
        const newIndex = prev.findIndex(f => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  // ── Upload Excel helpers ───────────────────────────────────────────────────

  function handleFileDrop(file: File) {
    setUploadFile(file);
    // Parse column headers from CSV (simplified — real impl would use papaparse)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split('\n')[0];
      const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      setParsedHeaders(headers);
    };
    reader.readAsText(file);
  }

  function importFields() {
    const newFields: TemplateField[] = parsedHeaders.map((h, i) => ({
      id: `imported_${Date.now()}_${i}`,
      canonical_name: h.toLowerCase().replace(/\s+/g, '_'),
      data_type: "string",
      category: "Other",
      validation_rule: "",
      is_critical: false,
      is_required: false,
      aliases: [h],
    }));
    setFields(prev => [...prev, ...newFields]);
    setParsedHeaders([]);
    setUploadFile(null);
    setTab("fields");
    toast.success(`Imported ${newFields.length} fields from ${uploadFile?.name}`);
  }

  function downloadSampleCsv() {
    const csv = "canonical_name,data_type,category,validation_rule,is_critical,is_required\nlease_commencement_date,date,Date,required,true,true\nbase_rent_monthly,currency,Financial,positive_number,true,true\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_fields_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Save actions ───────────────────────────────────────────────────────────

  function handleSaveDraft() {
    // TODO: Backend integration required — POST/PATCH /api/admin/templates
    toast.success(`Template saved as draft — ${fields.length} fields`);
    onClose();
  }

  function handleSaveActivate() {
    // TODO: Backend integration required — POST/PATCH /api/admin/templates with status=active
    toast.success(`Template activated — ${fields.length} fields · v${isEdit ? parseFloat(initial!.version) + 0.1 : '1.0'}`);
    onClose();
  }

  const TABS = [
    { id: "details", label: "Details" },
    { id: "fields",  label: `Fields (${fields.length})` },
    { id: "upload",  label: "Upload Excel" },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-[15px] font-semibold">
            {isEdit ? `Edit Template — ${initial!.name}` : "New Template"}
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-border px-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>

          {/* Tab 1 — Details */}
          {tab === "details" && (
            <div className="flex flex-col gap-4 p-5">
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Template Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FASB ASC 842 — Property Lease" />
              </div>
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Description</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the purpose and scope of this template…"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Document Types</Label>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPE_OPTIONS.map(dt => (
                    <label key={dt} className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                      <Checkbox
                        checked={docTypes.includes(dt)}
                        onCheckedChange={checked => {
                          setDocTypes(prev =>
                            checked ? [...prev, dt] : prev.filter(d => d !== dt)
                          );
                        }}
                      />
                      {dt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[12px] font-semibold mb-1.5 block">Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as TemplateStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="deprecated">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Tab 2 — Fields (S7a + S7b) */}
          {tab === "fields" && (
            <div className="flex flex-col">
              {/* Bulk action toolbar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                  <span className="text-[12px] font-medium text-destructive">{selectedIds.size} selected</span>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px]" onClick={bulkDelete}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete {selectedIds.size} fields
                  </Button>
                  <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-2 py-2 w-8"></th>
                          <th className="px-2 py-2 w-8">
                            <Checkbox
                              checked={selectedIds.size === fields.length && fields.length > 0}
                              onCheckedChange={checked => {
                                setSelectedIds(checked ? new Set(fields.map(f => f.id)) : new Set());
                              }}
                            />
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Canonical Name</th>
                          <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Type</th>
                          <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Category</th>
                          <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Validation</th>
                          <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Critical</th>
                          <th className="px-2 py-2 text-center font-semibold text-muted-foreground">Required</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map(field => (
                          <SortableFieldRow
                            key={field.id}
                            field={field}
                            selected={selectedIds.has(field.id)}
                            onSelect={toggleSelect}
                            onDelete={deleteField}
                            onToggleCritical={toggleCritical}
                            onToggleRequired={toggleRequired}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SortableContext>
              </DndContext>

              <div className="px-4 py-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={addBlankField} className="gap-1.5 text-[12px]">
                  <Plus className="w-3.5 h-3.5" />
                  Add Field
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3 — Upload Excel */}
          {tab === "upload" && (
            <div className="flex flex-col gap-4 p-5">
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                  isDragOver ? "border-primary bg-primary/5" : "border-border"
                )}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileDrop(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] font-medium text-foreground">Drop CSV, XLSX, or XLS here</p>
                <p className="text-[12px] text-muted-foreground mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }}
                />
              </div>

              {uploadFile && parsedHeaders.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-2 bg-muted/40 border-b border-border text-[12px] font-semibold text-muted-foreground">
                    Parsed {parsedHeaders.length} columns from {uploadFile.name}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Column Header</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Canonical Name (preview)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedHeaders.map((h, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="px-3 py-1.5 text-foreground">{h}</td>
                            <td className="px-3 py-1.5 font-mono text-primary text-[11px]">
                              {h.toLowerCase().replace(/\s+/g, '_')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 flex gap-2">
                    <Button size="sm" onClick={importFields} className="gap-1.5 text-[12px]">
                      <Plus className="w-3.5 h-3.5" />
                      Import Fields
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setUploadFile(null); setParsedHeaders([]); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <Button size="sm" variant="outline" onClick={downloadSampleCsv} className="self-start gap-1.5 text-[12px]">
                <Download className="w-3.5 h-3.5" />
                Download Sample CSV
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleSaveDraft}>Save as Draft</Button>
          <Button
            onClick={handleSaveActivate}
            className="gap-1.5"
            style={{ background: "var(--color-lg-success)", color: "#fff" }}
          >
            <Zap className="w-4 h-4" />
            Save & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SortableTabRow (existing mapping DnD) ────────────────────────────────────

function SortableTabRow({ tab, isSelected, onClick }: {
  tab: TabDefinition; isSelected: boolean; onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-colors text-[12px]",
        isSelected
          ? "border-primary/40 bg-primary/5 text-primary"
          : "border-border hover:border-primary/30 text-muted-foreground"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <span className="flex-1 font-medium">{tab.name}</span>
      <span className="text-[11px] text-muted-foreground">{tab.field_count} fields</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTemplates() {
  const _screenKey = SCREEN_KEYS.ADMIN_TEMPLATES;
  const [templates, setTemplates] = useState<ExportTemplate[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>(MOCK_TEMPLATES[0]);
  const [selectedTab, setSelectedTab] = useState<TabDefinition>(MOCK_TEMPLATES[0].tabs[0]);
  const [previewMode, setPreviewMode] = useState(false);
  const [tabs, setTabs] = useState<TabDefinition[]>(MOCK_TEMPLATES[0].tabs);

  // S7a: TemplateModal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);

  function selectTemplate(t: ExportTemplate) {
    setSelectedTemplate(t);
    setTabs(t.tabs);
    setSelectedTab(t.tabs[0]);
  }

  function selectTab(tab: TabDefinition) {
    setSelectedTab(tab);
  }

  function handleTabDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTabs(prev => {
        const oldIndex = prev.findIndex(t => t.id === active.id);
        const newIndex = prev.findIndex(t => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function openCreate() {
    setEditingTemplate(null);
    setModalOpen(true);
  }

  function openEdit(t: ExportTemplate) {
    setEditingTemplate(t);
    setModalOpen(true);
  }

  const STATUS_BADGE: Record<TemplateStatus, string> = {
    active:     "badge-valid",
    draft:      "badge-processing",
    deprecated: "badge-invalid",
  };
  const STATUS_LABEL: Record<TemplateStatus, string> = {
    active: "Active", draft: "Draft", deprecated: "Deprecated",
  };
  const TYPE_LABEL: Record<TemplateType, string> = {
    property_lease: "Property Lease",
    equipment_lease: "Equipment Lease",
    ground_lease: "Ground Lease",
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Template Management</h1>
              <ScreenNumberBadge screenKey="admin-templates" />
            </div>
            <p className="page-subtitle">Manage export templates and field mappings for FASB ASC 842 / IFRS 16 compliance.</p>
          </div>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden gap-0">
          {/* Template list */}
          <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">
                Templates ({templates.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={cn(
                    "px-4 py-3 border-b border-border cursor-pointer transition-colors",
                    selectedTemplate.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[13px] font-medium text-foreground leading-snug">{t.name}</p>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(t); }}
                      className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{TYPE_LABEL[t.type]}</span>
                    <span className="text-[11px] text-muted-foreground">v{t.version}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{t.mapped_field_count}/{t.total_field_count} mapped</span>
                      <span>{Math.round(t.mapped_field_count / t.total_field_count * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.mapped_field_count / t.total_field_count * 100}%`,
                          background: t.mapped_field_count === t.total_field_count
                            ? "var(--color-lg-success)"
                            : "var(--color-lg-primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Tab selector */}
            <div className="w-52 shrink-0 border-r border-border flex flex-col overflow-hidden">
              <div className="px-3 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Tabs</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
                  <SortableContext items={tabs.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tabs.map(tab => (
                      <SortableTabRow
                        key={tab.id}
                        tab={tab}
                        isSelected={selectedTab.id === tab.id}
                        onClick={() => selectTab(tab)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Mapping editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-foreground">{selectedTab.name} — Mapping Rules</span>
                  <span className="text-[11px] text-muted-foreground">{selectedTab.field_count} fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => setPreviewMode(v => !v)}
                  >
                    <Eye className="w-3 h-3" />
                    {previewMode ? "Edit" : "Preview"}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedTab.mappings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                    <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40" />
                    <p className="text-[13px] font-medium text-muted-foreground">No mapping rules defined</p>
                    <p className="text-[12px] text-muted-foreground/70 max-w-xs">
                      Open the template editor to add field mappings for this tab.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => openEdit(selectedTemplate)} className="gap-1.5 text-[12px]">
                      <Plus className="w-3.5 h-3.5" />
                      Edit Template
                    </Button>
                  </div>
                ) : (
                  <table className="data-table w-full text-[12px]">
                    <thead>
                      <tr>
                        <th className="text-left">Template Field</th>
                        <th className="text-left">Target Cell</th>
                        <th className="text-left">Mapping Type</th>
                        <th className="text-left">Extraction Field</th>
                        <th className="text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTab.mappings.map(rule => (
                        <tr key={rule.id}>
                          <td className="font-mono text-primary text-[11px]">{rule.template_field}</td>
                          <td className="text-muted-foreground">{rule.target_cell}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold badge-processing">
                              {rule.mapping_type}
                            </span>
                          </td>
                          <td className="text-muted-foreground">{rule.extraction_field ?? "—"}</td>
                          <td>
                            {rule.extraction_field ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* S7a: TemplateModal */}
      <TemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editingTemplate}
      />
    </AdminLayout>
  );
}
