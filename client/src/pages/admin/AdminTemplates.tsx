/**
 * AdminTemplates — FC-8 Screen 8.3
 * Screen key: admin-templates
 * Route: /admin/templates
 *
 * Prompt 8.3: Template and mapping management screen.
 * Template list: name · type badge · version · status badge ·
 *   tab_count · mapped_field_count / total_field_count progress bar
 * Template detail: tab definitions list with field count per tab
 * Mapping editor: two-column table — Left: template fields ·
 *   Right: extraction schema fields · drag to map (@dnd-kit)
 * Status lifecycle: draft → active → deprecated
 * Only one template per type can be active at a time
 * "Preview Mapping" generates a sample row with placeholder values
 *
 * @dnd-kit pattern: DndContext + SortableContext + useSortable + arrayMove
 *
 * Data model refs: ExtractionTemplate, ExportTemplate (Part 2.11)
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
import {
  FileSpreadsheet, ChevronRight, GripVertical, Upload, Eye,
  CheckCircle2, AlertCircle, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";

type TemplateType = "property_lease" | "equipment_lease" | "ground_lease";
type TemplateStatus = "draft" | "active" | "deprecated";

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
}

// TODO: Backend integration required — GET /api/admin/templates
const MOCK_TEMPLATES: ExportTemplate[] = [
  {
    id:"t1", name:"FASB ASC 842 — Property Lease", type:"property_lease", version:"2.1",
    status:"active", tab_count:5, mapped_field_count:68, total_field_count:73,
    created_at:"2026-01-15",
    tabs:[
      { id:"tab1", name:"Cover Sheet",      field_count:8,  mappings:[
        { id:"m1",  template_field:"Lease ID",          target_cell:"B2",  mapping_type:"direct",      extraction_field:"contract_reference" },
        { id:"m2",  template_field:"Tenant Name",        target_cell:"B3",  mapping_type:"direct",      extraction_field:"tenant_legal_name" },
        { id:"m3",  template_field:"Commencement Date",  target_cell:"B4",  mapping_type:"direct",      extraction_field:"commencement_date" },
        { id:"m4",  template_field:"Expiration Date",    target_cell:"B5",  mapping_type:"direct",      extraction_field:"expiration_date" },
        { id:"m5",  template_field:"Lease Term",         target_cell:"B6",  mapping_type:"computed",    extraction_field:null },
        { id:"m6",  template_field:"Property Address",   target_cell:"B7",  mapping_type:"direct",      extraction_field:"property_address" },
        { id:"m7",  template_field:"Annual Base Rent",   target_cell:"B8",  mapping_type:"direct",      extraction_field:"base_rent_annual" },
        { id:"m8",  template_field:"IBR Rate",           target_cell:"B9",  mapping_type:"direct",      extraction_field:"ibr_rate" },
      ]},
      { id:"tab2", name:"Rent Schedule",    field_count:18, mappings:[] },
      { id:"tab3", name:"Liability Table",  field_count:22, mappings:[] },
      { id:"tab4", name:"ROU Asset",        field_count:15, mappings:[] },
      { id:"tab5", name:"Disclosures",      field_count:10, mappings:[] },
    ],
  },
  {
    id:"t2", name:"Equipment Lease — Draft", type:"equipment_lease", version:"0.3",
    status:"draft", tab_count:3, mapped_field_count:12, total_field_count:40,
    created_at:"2026-04-20",
    tabs:[
      { id:"tab6", name:"Summary",     field_count:15, mappings:[] },
      { id:"tab7", name:"Amortization",field_count:15, mappings:[] },
      { id:"tab8", name:"Disclosures", field_count:10, mappings:[] },
    ],
  },
];

const TYPE_BADGE: Record<TemplateType, string> = {
  property_lease:  "badge-processing",
  equipment_lease: "badge-deferred",
  ground_lease:    "badge-valid",
};

const STATUS_BADGE: Record<TemplateStatus, string> = {
  active:     "badge-valid",
  draft:      "badge-warning",
  deprecated: "badge-muted",
};

const MAPPING_TYPE_BADGE: Record<"direct"|"computed"|"conditional", string> = {
  direct:      "badge-valid",
  computed:    "badge-processing",
  conditional: "badge-warning",
};

const EXTRACTION_FIELDS = [
  "contract_reference","tenant_legal_name","commencement_date","expiration_date",
  "base_rent_annual","ibr_rate","property_address","rentable_area_sqft",
  "cpi_escalation_rate","security_deposit","governing_law",
];

function SortableMappingRow({ rule, isDraft }: { rule: MappingRule; isDraft: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isUnmapped = !rule.extraction_field;

  return (
    <tr ref={setNodeRef} style={style} className={isUnmapped ? "bg-[var(--color-lg-warning-subtle)]" : ""}>
      <td className="w-8">
        {isDraft && (
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>
      <td className="font-medium text-foreground">{rule.template_field}</td>
      <td className="font-mono text-[11px] text-muted-foreground">{rule.target_cell}</td>
      <td>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${MAPPING_TYPE_BADGE[rule.mapping_type]}`}>
          {rule.mapping_type}
        </span>
      </td>
      <td>
        {isUnmapped ? (
          <span className="flex items-center gap-1 text-[11px]" style={{ color:"var(--color-lg-warning)" }}>
            <AlertCircle className="w-3 h-3" /> Unmapped
          </span>
        ) : (
          <span className="font-mono text-[11px] text-foreground">{rule.extraction_field}</span>
        )}
      </td>
    </tr>
  );
}

export default function AdminTemplates() {
  const _screenKey = SCREEN_KEYS.ADMIN_TEMPLATES;
  const [templates] = useState<ExportTemplate[]>(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>(MOCK_TEMPLATES[0]);
  const [selectedTab, setSelectedTab] = useState<TabDefinition>(MOCK_TEMPLATES[0].tabs[0]);
  const [mappings, setMappings] = useState<MappingRule[]>(MOCK_TEMPLATES[0].tabs[0].mappings);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isDraft = selectedTemplate.status === "draft";

  function selectTemplate(t: ExportTemplate) {
    setSelectedTemplate(t);
    setSelectedTab(t.tabs[0]);
    setMappings(t.tabs[0].mappings);
  }

  function selectTab(tab: TabDefinition) {
    setSelectedTab(tab);
    setMappings(tab.mappings);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!isDraft) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = mappings.findIndex(m => m.id === active.id);
    const newIdx = mappings.findIndex(m => m.id === over.id);
    setMappings(arrayMove(mappings, oldIdx, newIdx));
  }

  const mappedCount = mappings.filter(m => m.extraction_field).length;

  return (
    <AdminLayout>
      <div className="flex min-h-full bg-[var(--color-lg-page-bg)]">
        {/* Template list sidebar */}
        <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[12px] font-bold text-foreground">Export Templates</span>
            <Button variant="outline" className="h-6 text-[10px] px-2 gap-1">
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {templates.map(t => {
              const isSelected = t.id === selectedTemplate.id;
              const pct = Math.round((t.mapped_field_count / t.total_field_count) * 100);
              return (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className="w-full text-left p-3 rounded-lg border transition-all"
                  style={{
                    borderColor: isSelected ? "var(--color-lg-primary)" : "var(--color-border)",
                    background: isSelected ? "rgba(59,130,246,0.06)" : "transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-foreground leading-tight">{t.name}</span>
                    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold shrink-0 ${STATUS_BADGE[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold ${TYPE_BADGE[t.type]}`}>
                      {t.type.replace(/_/g," ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">v{t.version}</span>
                    <span className="text-[10px] text-muted-foreground">{t.tab_count} tabs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:"var(--color-lg-primary)" }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.mapped_field_count}/{t.total_field_count}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="page-header">
            <div>
              <h1 className="page-title">{selectedTemplate.name}</h1>
              <p className="page-subtitle">v{selectedTemplate.version} · {selectedTemplate.tab_count} tabs · {selectedTemplate.mapped_field_count}/{selectedTemplate.total_field_count} fields mapped</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 text-[12px] gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload New Version
              </Button>
              <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={() => setPreviewOpen(!previewOpen)}>
                <Eye className="w-3.5 h-3.5" /> Preview Mapping
              </Button>
              {isDraft && (
                <Button className="h-8 text-[12px] gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                </Button>
              )}
            </div>
          </div>

          <div className="px-6 pb-8 flex flex-col gap-4">
            {/* Tab selector */}
            <div className="flex gap-1 border-b border-border">
              {selectedTemplate.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab)}
                  className="px-4 py-2 text-[12px] font-semibold border-b-2 transition-colors"
                  style={{
                    borderColor: selectedTab.id === tab.id ? "var(--color-lg-primary)" : "transparent",
                    color: selectedTab.id === tab.id ? "var(--color-lg-primary)" : "var(--color-muted-foreground)",
                  }}
                >
                  {tab.name} <span className="text-[10px] ml-1 opacity-60">{tab.field_count}</span>
                </button>
              ))}
            </div>

            {/* Mapping table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-[12px] font-bold text-foreground">{selectedTab.name} — Mapping Rules</span>
                <span className="text-[11px] text-muted-foreground">{mappedCount}/{mappings.length} mapped</span>
              </div>
              {mappings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileSpreadsheet className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-[12px]">No mapping rules defined for this tab</p>
                </div>
              ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={mappings.map(m => m.id)} strategy={verticalListSortingStrategy}>
                    <table className="data-table w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="w-8" />
                          <th className="text-left">Template Field</th>
                          <th className="text-left">Target Cell</th>
                          <th className="text-left">Mapping Type</th>
                          <th className="text-left">Extraction Field</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map(rule => (
                          <SortableMappingRow key={rule.id} rule={rule} isDraft={isDraft} />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Preview mapping sample row */}
            {previewOpen && (
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-[13px] font-bold text-foreground mb-3">Preview Mapping — Sample Row</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {EXTRACTION_FIELDS.slice(0, 8).map(f => (
                    <div key={f} className="flex items-center gap-3 text-[12px]">
                      <span className="font-mono text-muted-foreground w-40 truncate">{f}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground italic opacity-60">[placeholder value]</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
