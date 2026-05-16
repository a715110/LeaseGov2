/**
 * AdminSchema — FC-8 Screen 8.2
 * Screen key: admin-schema
 * Route: /admin/schema
 *
 * Prompt 8.2: Schema configuration screen.
 * Active ExtractionTemplate with version lock badge.
 * Field list grouped by field_category accordion.
 * Each field: display_label · field_name (mono) · data_type badge ·
 *   is_critical shield · is_required dot.
 * Field reorder: @dnd-kit (DndContext + SortableContext + useSortable + arrayMove)
 * "Create New Version" clones current template as draft.
 * Draft: editable. Active: read-only.
 * "Activate" on draft: creates new version, deprecates old.
 * Header: total fields count · critical fields count.
 *
 * @dnd-kit imports:
 *   import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
 *   import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
 *   import { CSS } from "@dnd-kit/utilities";
 *
 * Data model refs: ExtractionTemplate, ExtractionField (Part 2.5)
 */

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Shield, ChevronDown, ChevronRight, GripVertical, Plus, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";

type FieldCategory = "core_metadata" | "property" | "financial" | "legal" | "tables" | "amendment";
type DataType = "string" | "date" | "decimal" | "integer" | "boolean" | "currency" | "percentage" | "table";
type TemplateStatus = "active" | "draft" | "deprecated";

interface ExtractionField {
  id: string;
  field_name: string;
  display_label: string;
  field_category: FieldCategory;
  data_type: DataType;
  is_critical: boolean;
  is_required: boolean;
  anchor_requirement: "required" | "optional" | "none";
  validation_rule: string | null;
  sort_order: number;
}

interface ExtractionTemplate {
  id: string;
  name: string;
  version: string;
  status: TemplateStatus;
  total_field_count: number;
  critical_field_count: number;
  fields: ExtractionField[];
  activated_at: string | null;
  created_at: string;
}

// TODO: Backend integration required — GET /api/admin/schema/templates
const INITIAL_FIELDS: ExtractionField[] = [
  // core_metadata
  { id:"f1",  field_name:"commencement_date",     display_label:"Commencement Date",     field_category:"core_metadata", data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be before expiration_date",  sort_order:1 },
  { id:"f2",  field_name:"expiration_date",        display_label:"Expiration Date",       field_category:"core_metadata", data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be after commencement_date", sort_order:2 },
  { id:"f3",  field_name:"lease_term_months",      display_label:"Lease Term (Months)",   field_category:"core_metadata", data_type:"integer",    is_critical:false, is_required:true,  anchor_requirement:"optional", validation_rule:"Computed from dates if blank",    sort_order:3 },
  { id:"f4",  field_name:"contract_type",          display_label:"Contract Type",         field_category:"core_metadata", data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"none",     validation_rule:null,                             sort_order:4 },
  // property
  { id:"f5",  field_name:"property_address",       display_label:"Property Address",      field_category:"property",      data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:5 },
  { id:"f6",  field_name:"rentable_area_sqft",     display_label:"Rentable Area (sq ft)", field_category:"property",      data_type:"decimal",    is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:"Positive number",                sort_order:6 },
  // financial
  { id:"f7",  field_name:"base_rent_annual",       display_label:"Base Rent (Annual)",    field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Positive value in USD",          sort_order:7 },
  { id:"f8",  field_name:"cpi_escalation_rate",    display_label:"CPI Escalation Rate",   field_category:"financial",     data_type:"percentage", is_critical:true,  is_required:false, anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:8 },
  { id:"f9",  field_name:"security_deposit",       display_label:"Security Deposit",      field_category:"financial",     data_type:"currency",   is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:9 },
  { id:"f10", field_name:"ibr_rate",               display_label:"IBR Rate",              field_category:"financial",     data_type:"percentage", is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:10 },
  { id:"f11", field_name:"lease_liability_pv",     display_label:"Lease Liability (PV)",  field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"none",     validation_rule:"Computed field",                 sort_order:11 },
  { id:"f12", field_name:"rou_asset",              display_label:"ROU Asset",             field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"none",     validation_rule:"Computed field",                 sort_order:12 },
  // legal
  { id:"f13", field_name:"tenant_legal_name",      display_label:"Tenant Legal Name",     field_category:"legal",         data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:13 },
  { id:"f14", field_name:"landlord_legal_name",    display_label:"Landlord Legal Name",   field_category:"legal",         data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:14 },
  { id:"f15", field_name:"governing_law",          display_label:"Governing Law",         field_category:"legal",         data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:15 },
  // tables
  { id:"f16", field_name:"rent_schedule",          display_label:"Rent Schedule",         field_category:"tables",        data_type:"table",      is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Min 1 row",                      sort_order:16 },
  { id:"f17", field_name:"option_schedule",        display_label:"Option Schedule",       field_category:"tables",        data_type:"table",      is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:17 },
  // amendment
  { id:"f18", field_name:"amendment_effective_date",display_label:"Amendment Effective Date",field_category:"amendment", data_type:"date",       is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:18 },
];

const MOCK_TEMPLATE: ExtractionTemplate = {
  id: "et1",
  name: "Property Lease v1",
  version: "1.4",
  status: "active",
  total_field_count: 18,
  critical_field_count: 8,
  fields: INITIAL_FIELDS,
  activated_at: "2026-01-15",
  created_at: "2025-11-01",
};

const CATEGORY_LABELS: Record<FieldCategory, string> = {
  core_metadata: "Core Metadata",
  property:      "Property",
  financial:     "Financial",
  legal:         "Legal",
  tables:        "Tables",
  amendment:     "Amendment",
};

const DATA_TYPE_BADGE: Record<DataType, string> = {
  string:     "badge-muted",
  date:       "badge-processing",
  decimal:    "badge-deferred",
  integer:    "badge-deferred",
  boolean:    "badge-muted",
  currency:   "badge-valid",
  percentage: "badge-valid",
  table:      "badge-warning",
};

const CATEGORIES: FieldCategory[] = ["core_metadata","property","financial","legal","tables","amendment"];

// ─── Sortable field row ───────────────────────────────────────────────────────
function SortableFieldRow({ field, isDraft }: { field: ExtractionField; isDraft: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="w-8">
        {isDraft && (
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>
      <td>
        <div className="flex items-center gap-1.5">
          {field.is_critical && <Shield className="w-3 h-3 shrink-0" style={{ color:"var(--color-lg-warning)" }} />}
          <span className="font-medium text-foreground">{field.display_label}</span>
          {field.is_required && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-lg-error)] shrink-0" title="Required" />}
        </div>
      </td>
      <td className="font-mono text-[11px] text-muted-foreground">{field.field_name}</td>
      <td>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${DATA_TYPE_BADGE[field.data_type]}`}>
          {field.data_type}
        </span>
      </td>
      <td className="text-[11px] text-muted-foreground capitalize">{field.anchor_requirement}</td>
      <td className="text-[11px] text-muted-foreground max-w-[160px] truncate">{field.validation_rule || "—"}</td>
    </tr>
  );
}

export default function AdminSchema() {
  const _screenKey = SCREEN_KEYS.ADMIN_SCHEMA;
  const [template, setTemplate] = useState<ExtractionTemplate>(MOCK_TEMPLATE);
  const [draftTemplate, setDraftTemplate] = useState<ExtractionTemplate | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<FieldCategory>>(new Set(["core_metadata","financial"] as FieldCategory[]));
  const [versionHistory] = useState([
    { version:"1.4", changed_by:"M. Webb", date:"2026-01-15", note:"Added ibr_staleness field" },
    { version:"1.3", changed_by:"M. Webb", date:"2025-11-20", note:"Made cpi_escalation_rate critical" },
    { version:"1.2", changed_by:"M. Webb", date:"2025-09-10", note:"Added amendment category" },
  ]);

  const activeTemplate = draftTemplate || template;
  const isDraft = !!draftTemplate;

  function toggleCategory(cat: FieldCategory) {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  // TODO: Backend integration required — POST /api/admin/schema/templates/:id/clone
  function createNewVersion() {
    setDraftTemplate({
      ...template,
      id: "et-draft",
      version: `${parseFloat(template.version) + 0.1}`.slice(0, 3),
      status: "draft",
      activated_at: null,
    });
  }

  // TODO: Backend integration required — POST /api/admin/schema/templates/:id/activate
  function activateDraft() {
    if (!draftTemplate) return;
    setTemplate({ ...draftTemplate, status: "active", activated_at: new Date().toISOString().slice(0,10) });
    setDraftTemplate(null);
  }

  function discardDraft() { setDraftTemplate(null); }

  function handleDragEnd(event: DragEndEvent, category: FieldCategory) {
    if (!isDraft) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const catFields = activeTemplate.fields.filter(f => f.field_category === category);
    const oldIndex = catFields.findIndex(f => f.id === active.id);
    const newIndex = catFields.findIndex(f => f.id === over.id);
    const reordered = arrayMove(catFields, oldIndex, newIndex);
    const otherFields = activeTemplate.fields.filter(f => f.field_category !== category);
    setDraftTemplate(dt => dt ? { ...dt, fields: [...otherFields, ...reordered] } : null);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">Schema Configuration</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isDraft ? "badge-warning" : "badge-valid"}`}>
                {isDraft ? "Draft" : "Active"} v{activeTemplate.version}
              </span>
              {!isDraft && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="page-subtitle">
              {activeTemplate.total_field_count} total fields · {activeTemplate.critical_field_count} critical
              {isDraft && <span className="ml-2 text-[var(--color-lg-warning)] font-semibold">· Draft — editable</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDraft ? (
              <>
                <Button variant="outline" className="h-8 text-[12px]" onClick={discardDraft}>Discard Draft</Button>
                <Button className="h-8 text-[12px] gap-1.5" onClick={activateDraft}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activate v{activeTemplate.version}
                </Button>
              </>
            ) : (
              <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={createNewVersion}>
                <Plus className="w-3.5 h-3.5" /> Create New Version
              </Button>
            )}
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-3 max-w-5xl">
          {/* Field accordions by category */}
          {CATEGORIES.map(cat => {
            const catFields = activeTemplate.fields.filter(f => f.field_category === cat);
            if (catFields.length === 0) return null;
            const isOpen = openCategories.has(cat);
            const critCount = catFields.filter(f => f.is_critical).length;

            return (
              <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors"
                  onClick={() => toggleCategory(cat)}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-[13px] font-bold text-foreground">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[11px] text-muted-foreground">{catFields.length} fields</span>
                  {critCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px]" style={{ color:"var(--color-lg-warning)" }}>
                      <Shield className="w-3 h-3" /> {critCount} critical
                    </span>
                  )}
                  {isDraft && <span className="ml-auto text-[10px] text-muted-foreground">Drag to reorder</span>}
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={e => handleDragEnd(e, cat)}
                    >
                      <SortableContext
                        items={catFields.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <table className="data-table w-full text-[12px]">
                          <thead>
                            <tr>
                              <th className="w-8" />
                              <th className="text-left">Display Label</th>
                              <th className="text-left">Field Name</th>
                              <th className="text-left">Type</th>
                              <th className="text-left">Anchor</th>
                              <th className="text-left">Validation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catFields.map(field => (
                              <SortableFieldRow key={field.id} field={field} isDraft={isDraft} />
                            ))}
                          </tbody>
                        </table>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            );
          })}

          {/* Version history */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Version History</p>
            <div className="flex flex-col gap-2">
              {versionHistory.map(v => (
                <div key={v.version} className="flex items-center gap-4 text-[12px] py-2 border-b border-border last:border-0">
                  <span className="font-mono font-bold text-foreground w-10">v{v.version}</span>
                  <span className="text-muted-foreground">{v.date}</span>
                  <span className="text-muted-foreground">{v.changed_by}</span>
                  <span className="text-foreground flex-1">{v.note}</span>
                  {/* TODO: Backend integration required — POST /api/admin/schema/templates/:id/restore */}
                  <button className="text-[11px] font-semibold underline" style={{ color:"var(--color-lg-primary)" }}>Restore</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
