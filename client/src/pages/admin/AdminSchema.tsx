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
 * Equipment Lease Prompt 2C:
 *   - Added "Equipment Lease" tab alongside "Property Lease" tab
 *   - Equipment Lease template: 41 fields across 6 categories
 *     (asset_identification, financial_terms, equipment_conditions,
 *      usage_terms, classification_indicators, legal_terms)
 *   - Tab state is independent; each tab has its own draft/active lifecycle
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
import { Shield, ChevronDown, ChevronRight, GripVertical, Plus, CheckCircle2, Lock, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Types ─────────────────────────────────────────────────────────────────────

type PropertyFieldCategory = "core_metadata" | "property" | "financial" | "legal" | "tables" | "amendment";
type EquipmentFieldCategory = "asset_identification" | "financial_terms" | "equipment_conditions" | "usage_terms" | "classification_indicators" | "legal_terms";
type FieldCategory = PropertyFieldCategory | EquipmentFieldCategory;
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

// ─── Property Lease fields ────────────────────────────────────────────────────

const PROPERTY_FIELDS: ExtractionField[] = [
  // core_metadata
  { id:"f1",  field_name:"commencement_date",      display_label:"Commencement Date",      field_category:"core_metadata", data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be before expiration_date",  sort_order:1 },
  { id:"f2",  field_name:"expiration_date",         display_label:"Expiration Date",        field_category:"core_metadata", data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be after commencement_date", sort_order:2 },
  { id:"f3",  field_name:"lease_term_months",       display_label:"Lease Term (Months)",    field_category:"core_metadata", data_type:"integer",    is_critical:false, is_required:true,  anchor_requirement:"optional", validation_rule:"Computed from dates if blank",    sort_order:3 },
  { id:"f4",  field_name:"contract_type",           display_label:"Contract Type",          field_category:"core_metadata", data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"none",     validation_rule:null,                             sort_order:4 },
  // property
  { id:"f5",  field_name:"property_address",        display_label:"Property Address",       field_category:"property",      data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:5 },
  { id:"f6",  field_name:"rentable_area_sqft",      display_label:"Rentable Area (sq ft)",  field_category:"property",      data_type:"decimal",    is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:"Positive number",                sort_order:6 },
  // financial
  { id:"f7",  field_name:"base_rent_annual",        display_label:"Base Rent (Annual)",     field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Positive value in USD",          sort_order:7 },
  { id:"f8",  field_name:"cpi_escalation_rate",     display_label:"CPI Escalation Rate",    field_category:"financial",     data_type:"percentage", is_critical:true,  is_required:false, anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:8 },
  { id:"f9",  field_name:"security_deposit",        display_label:"Security Deposit",       field_category:"financial",     data_type:"currency",   is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:9 },
  { id:"f10", field_name:"ibr_rate",                display_label:"IBR Rate",               field_category:"financial",     data_type:"percentage", is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:10 },
  { id:"f11", field_name:"lease_liability_pv",      display_label:"Lease Liability (PV)",   field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"none",     validation_rule:"Computed field",                 sort_order:11 },
  { id:"f12", field_name:"rou_asset",               display_label:"ROU Asset",              field_category:"financial",     data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"none",     validation_rule:"Computed field",                 sort_order:12 },
  // legal
  { id:"f13", field_name:"tenant_legal_name",       display_label:"Tenant Legal Name",      field_category:"legal",         data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:13 },
  { id:"f14", field_name:"landlord_legal_name",     display_label:"Landlord Legal Name",    field_category:"legal",         data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:14 },
  { id:"f15", field_name:"governing_law",           display_label:"Governing Law",          field_category:"legal",         data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:15 },
  // tables
  { id:"f16", field_name:"rent_schedule",           display_label:"Rent Schedule",          field_category:"tables",        data_type:"table",      is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Min 1 row",                      sort_order:16 },
  { id:"f17", field_name:"option_schedule",         display_label:"Option Schedule",        field_category:"tables",        data_type:"table",      is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:17 },
  // amendment
  { id:"f18", field_name:"amendment_effective_date",display_label:"Amendment Effective Date",field_category:"amendment",   data_type:"date",       is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:18 },
];

const PROPERTY_TEMPLATE: ExtractionTemplate = {
  id: "et1",
  name: "Property Lease v1",
  version: "1.4",
  status: "active",
  total_field_count: 18,
  critical_field_count: 8,
  fields: PROPERTY_FIELDS,
  activated_at: "2026-01-15",
  created_at: "2025-11-01",
};

// ─── Equipment Lease fields (41 fields, 6 categories) ────────────────────────

const EQUIPMENT_FIELDS: ExtractionField[] = [
  // asset_identification (8 fields)
  { id:"eq-f01", field_name:"equipment_type",                  display_label:"Equipment Type",                   field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:1  },
  { id:"eq-f02", field_name:"equipment_category",              display_label:"Equipment Category",               field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:2  },
  { id:"eq-f03", field_name:"manufacturer",                    display_label:"Manufacturer",                     field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:3  },
  { id:"eq-f04", field_name:"model",                           display_label:"Model",                            field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:4  },
  { id:"eq-f05", field_name:"serial_number",                   display_label:"Serial Number",                    field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:5  },
  { id:"eq-f06", field_name:"asset_tag",                       display_label:"Asset Tag",                        field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:6  },
  { id:"eq-f07", field_name:"quantity",                        display_label:"Quantity",                         field_category:"asset_identification",    data_type:"integer",    is_critical:false, is_required:true,  anchor_requirement:"optional", validation_rule:"Positive integer",               sort_order:7  },
  { id:"eq-f08", field_name:"installation_location",           display_label:"Installation Location",            field_category:"asset_identification",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:8  },
  // financial_terms (10 fields — all critical)
  { id:"eq-f09", field_name:"commencement_date",               display_label:"Commencement Date",                field_category:"financial_terms",         data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be before expiration_date", sort_order:9  },
  { id:"eq-f10", field_name:"expiration_date",                 display_label:"Expiration Date",                  field_category:"financial_terms",         data_type:"date",       is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Must be after commencement_date",sort_order:10 },
  { id:"eq-f11", field_name:"base_lease_term_months",          display_label:"Base Lease Term (Months)",         field_category:"financial_terms",         data_type:"integer",    is_critical:true,  is_required:true,  anchor_requirement:"optional", validation_rule:"Positive integer",               sort_order:11 },
  { id:"eq-f12", field_name:"monthly_payment",                 display_label:"Monthly Payment",                  field_category:"financial_terms",         data_type:"currency",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Positive value in USD",          sort_order:12 },
  { id:"eq-f13", field_name:"payment_frequency",               display_label:"Payment Frequency",                field_category:"financial_terms",         data_type:"string",     is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:13 },
  { id:"eq-f14", field_name:"fair_value_at_commencement",      display_label:"Fair Value at Commencement",       field_category:"financial_terms",         data_type:"currency",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Positive value in USD",          sort_order:14 },
  { id:"eq-f15", field_name:"residual_value_guarantee",        display_label:"Residual Value Guarantee",         field_category:"financial_terms",         data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:15 },
  { id:"eq-f16", field_name:"purchase_option_price",           display_label:"Purchase Option Price",            field_category:"financial_terms",         data_type:"currency",   is_critical:true,  is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:16 },
  { id:"eq-f17", field_name:"purchase_option_exercise_date",   display_label:"Purchase Option Exercise Date",    field_category:"financial_terms",         data_type:"date",       is_critical:true,  is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:17 },
  { id:"eq-f18", field_name:"discount_rate",                   display_label:"Discount Rate (IBR)",              field_category:"financial_terms",         data_type:"percentage", is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:18 },
  // equipment_conditions (6 fields)
  { id:"eq-f19", field_name:"condition_at_commencement",       display_label:"Condition at Commencement",        field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:19 },
  { id:"eq-f20", field_name:"return_conditions",               display_label:"Return Conditions",                field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:20 },
  { id:"eq-f21", field_name:"maintenance_responsibility",      display_label:"Maintenance Responsibility",       field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:21 },
  { id:"eq-f22", field_name:"permitted_modifications",         display_label:"Permitted Modifications",          field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:22 },
  { id:"eq-f23", field_name:"deinstallation_responsibility",   display_label:"Deinstallation Responsibility",    field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:23 },
  { id:"eq-f24", field_name:"insurance_requirements",          display_label:"Insurance Requirements",           field_category:"equipment_conditions",    data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:24 },
  // usage_terms (5 fields)
  { id:"eq-f25", field_name:"usage_limits",                    display_label:"Usage Limits",                     field_category:"usage_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:25 },
  { id:"eq-f26", field_name:"variable_payment_rate",           display_label:"Variable Payment Rate",            field_category:"usage_terms",             data_type:"decimal",    is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:"Positive decimal",               sort_order:26 },
  { id:"eq-f27", field_name:"usage_measurement_unit",          display_label:"Usage Measurement Unit",           field_category:"usage_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:27 },
  { id:"eq-f28", field_name:"maximum_usage_per_period",        display_label:"Maximum Usage per Period",         field_category:"usage_terms",             data_type:"decimal",    is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:"Positive decimal",               sort_order:28 },
  { id:"eq-f29", field_name:"excess_usage_rate",               display_label:"Excess Usage Rate",                field_category:"usage_terms",             data_type:"decimal",    is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:"Positive decimal",               sort_order:29 },
  // classification_indicators (6 fields — all critical)
  { id:"eq-f30", field_name:"useful_life_months",              display_label:"Useful Life (Months)",             field_category:"classification_indicators",data_type:"integer",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"Positive integer",               sort_order:30 },
  { id:"eq-f31", field_name:"lessee_useful_life_coverage_pct", display_label:"Lessee Useful Life Coverage (%)",  field_category:"classification_indicators",data_type:"percentage",is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:"0.00–1.00",                      sort_order:31 },
  { id:"eq-f32", field_name:"ownership_transfer_at_end",       display_label:"Ownership Transfer at End",        field_category:"classification_indicators",data_type:"boolean",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:32 },
  { id:"eq-f33", field_name:"purchase_option_reasonably_certain",display_label:"Purchase Option Reasonably Certain",field_category:"classification_indicators",data_type:"boolean",is_critical:true, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:33 },
  { id:"eq-f34", field_name:"specialized_nature",              display_label:"Specialized Nature",               field_category:"classification_indicators",data_type:"boolean",   is_critical:true,  is_required:true,  anchor_requirement:"required", validation_rule:null,                             sort_order:34 },
  { id:"eq-f35", field_name:"pv_as_pct_of_fair_value",         display_label:"PV as % of Fair Value",            field_category:"classification_indicators",data_type:"percentage",is_critical:true,  is_required:false, anchor_requirement:"optional", validation_rule:"0.00–1.00",                      sort_order:35 },
  // legal_terms (6 fields)
  { id:"eq-f36", field_name:"governing_law",                   display_label:"Governing Law",                    field_category:"legal_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:36 },
  { id:"eq-f37", field_name:"early_termination_clause",        display_label:"Early Termination Clause",         field_category:"legal_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:37 },
  { id:"eq-f38", field_name:"early_termination_penalty",       display_label:"Early Termination Penalty",        field_category:"legal_terms",             data_type:"currency",   is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:38 },
  { id:"eq-f39", field_name:"assignment_rights",               display_label:"Assignment Rights",                field_category:"legal_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:39 },
  { id:"eq-f40", field_name:"sublease_rights",                 display_label:"Sublease Rights",                  field_category:"legal_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:40 },
  { id:"eq-f41", field_name:"insurance_requirements_legal",    display_label:"Insurance Requirements (Legal)",   field_category:"legal_terms",             data_type:"string",     is_critical:false, is_required:false, anchor_requirement:"optional", validation_rule:null,                             sort_order:41 },
];

const EQUIPMENT_TEMPLATE: ExtractionTemplate = {
  id: "et2",
  name: "Equipment Lease v1.0",
  version: "1.0",
  status: "active",
  total_field_count: 41,
  critical_field_count: 16,
  fields: EQUIPMENT_FIELDS,
  activated_at: "2026-04-01",
  created_at: "2026-03-15",
};

// ─── Category labels ──────────────────────────────────────────────────────────

const PROPERTY_CATEGORY_LABELS: Record<PropertyFieldCategory, string> = {
  core_metadata: "Core Metadata",
  property:      "Property",
  financial:     "Financial",
  legal:         "Legal",
  tables:        "Tables",
  amendment:     "Amendment",
};

const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentFieldCategory, string> = {
  asset_identification:     "Asset Identification",
  financial_terms:          "Financial Terms",
  equipment_conditions:     "Equipment Conditions",
  usage_terms:              "Usage Terms",
  classification_indicators:"Classification Indicators",
  legal_terms:              "Legal Terms",
};

const PROPERTY_CATEGORIES: PropertyFieldCategory[] = ["core_metadata","property","financial","legal","tables","amendment"];
const EQUIPMENT_CATEGORIES: EquipmentFieldCategory[] = ["asset_identification","financial_terms","equipment_conditions","usage_terms","classification_indicators","legal_terms"];

// ─── Data type badge ──────────────────────────────────────────────────────────

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

// ─── Template panel (shared between Property and Equipment tabs) ──────────────
interface TemplatePanelProps {
  template: ExtractionTemplate;
  draftTemplate: ExtractionTemplate | null;
  setDraftTemplate: React.Dispatch<React.SetStateAction<ExtractionTemplate | null>>;
  setBaseTemplate: React.Dispatch<React.SetStateAction<ExtractionTemplate>>;
  categories: FieldCategory[];
  categoryLabels: Record<string, string>;
  versionHistory: { version: string; changed_by: string; date: string; note: string }[];
  accentColor?: string;
}

function TemplatePanel({
  template,
  draftTemplate,
  setDraftTemplate,
  setBaseTemplate,
  categories,
  categoryLabels,
  versionHistory,
  accentColor = "var(--color-lg-primary)",
}: TemplatePanelProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.slice(0, 2))
  );

  const activeTemplate = draftTemplate || template;
  const isDraft = !!draftTemplate;

  function toggleCategory(cat: string) {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function createNewVersion() {
    setDraftTemplate({
      ...template,
      id: `${template.id}-draft`,
      version: `${parseFloat(template.version) + 0.1}`.slice(0, 3),
      status: "draft",
      activated_at: null,
    });
  }

  function activateDraft() {
    if (!draftTemplate) return;
    setBaseTemplate({ ...draftTemplate, status: "active", activated_at: new Date().toISOString().slice(0,10) });
    setDraftTemplate(null);
  }

  function discardDraft() { setDraftTemplate(null); }

  function handleDragEnd(event: DragEndEvent, category: string) {
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
    <div className="flex flex-col gap-3">
      {/* Template header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isDraft ? "badge-warning" : "badge-valid"}`}>
            {isDraft ? "Draft" : "Active"} v{activeTemplate.version}
          </span>
          {!isDraft && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-[12px] text-muted-foreground">
            {activeTemplate.total_field_count} fields · {activeTemplate.critical_field_count} critical
            {isDraft && <span className="ml-2 font-semibold" style={{ color: "var(--color-lg-warning)" }}>· Draft — editable</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <Button variant="outline" className="h-7 text-[11px]" onClick={discardDraft}>Discard Draft</Button>
              <Button className="h-7 text-[11px] gap-1.5" onClick={activateDraft}>
                <CheckCircle2 className="w-3 h-3" /> Activate v{activeTemplate.version}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="h-7 text-[11px] gap-1.5" onClick={createNewVersion}>
              <Plus className="w-3 h-3" /> Create New Version
            </Button>
          )}
        </div>
      </div>

      {/* Field accordions */}
      {categories.map(cat => {
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
              <span className="text-[13px] font-bold text-foreground">{categoryLabels[cat]}</span>
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
              <button className="text-[11px] font-semibold underline" style={{ color: accentColor }}>Restore</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSchema() {
  const _screenKey = SCREEN_KEYS.ADMIN_SCHEMA;

  // Property Lease tab state
  const [propertyTemplate, setPropertyTemplate] = useState<ExtractionTemplate>(PROPERTY_TEMPLATE);
  const [propertyDraft, setPropertyDraft] = useState<ExtractionTemplate | null>(null);

  // Equipment Lease tab state
  const [equipmentTemplate, setEquipmentTemplate] = useState<ExtractionTemplate>(EQUIPMENT_TEMPLATE);
  const [equipmentDraft, setEquipmentDraft] = useState<ExtractionTemplate | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'property' | 'equipment'>('property');

  const propertyVersionHistory = [
    { version:"1.4", changed_by:"M. Webb", date:"2026-01-15", note:"Added ibr_staleness field" },
    { version:"1.3", changed_by:"M. Webb", date:"2025-11-20", note:"Made cpi_escalation_rate critical" },
    { version:"1.2", changed_by:"M. Webb", date:"2025-09-10", note:"Added amendment category" },
  ];

  const equipmentVersionHistory = [
    { version:"1.0", changed_by:"M. Webb", date:"2026-04-01", note:"Initial Equipment Lease template — 41 fields, IFRS 16 classification indicators" },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="page-title">Schema Configuration</h1>
                <ScreenNumberBadge screenKey="admin-schema" />
              </div>
            </div>
            <p className="page-subtitle">
              Manage extraction templates and field definitions for each contract type.
            </p>
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-4 max-w-5xl">
          {/* ── Contract type tabs ── */}
          <div className="flex items-center gap-0 border-b border-border">
            <button
              onClick={() => setActiveTab('property')}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === 'property'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Property Lease
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                {propertyTemplate.total_field_count} fields
              </span>
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
                activeTab === 'equipment'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="w-4 h-4" />
              Equipment Lease
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                {equipmentTemplate.total_field_count} fields
              </span>
            </button>
          </div>

          {/* ── Property Lease panel ── */}
          {activeTab === 'property' && (
            <TemplatePanel
              template={propertyTemplate}
              draftTemplate={propertyDraft}
              setDraftTemplate={setPropertyDraft}
              setBaseTemplate={setPropertyTemplate}
              categories={PROPERTY_CATEGORIES as FieldCategory[]}
              categoryLabels={PROPERTY_CATEGORY_LABELS}
              versionHistory={propertyVersionHistory}
            />
          )}

          {/* ── Equipment Lease panel ── */}
          {activeTab === 'equipment' && (
            <TemplatePanel
              template={equipmentTemplate}
              draftTemplate={equipmentDraft}
              setDraftTemplate={setEquipmentDraft}
              setBaseTemplate={setEquipmentTemplate}
              categories={EQUIPMENT_CATEGORIES as FieldCategory[]}
              categoryLabels={EQUIPMENT_CATEGORY_LABELS}
              versionHistory={equipmentVersionHistory}
              accentColor="var(--color-teal-600, #0d9488)"
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
