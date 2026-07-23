/**
 * ExportTemplateSelection — FC-7 Screen 7.1
 * Screen key: export-template-selection
 * Route: /export/templates
 *
 * Prompt 7.1 + Equipment Lease Prompt 5A:
 * Record context card (locked). Template cards grouped by contract type:
 *   Property Leases | Equipment Leases | Service Contracts (placeholder)
 * Equipment templates have purple "Equipment — New / Amendment" badges.
 * Version lock notice. "Select and Continue" primary button.
 *
 * Data model refs: ExportTemplate (name, template_type, contract_type,
 *   version, status, output_format, tab_count, total_field_count, mapped_field_count)
 */

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMemo } from "react";
import { CheckCircle2, Lock, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
import { useRoleLabel } from '@/hooks/useRoleLabel';
// TODO: Backend integration required — GET /api/export/templates
const MOCK_TEMPLATES = [
  {
    id: "t1",
    name: "New Lease Onboarding",
    template_type: "new_lease_onboarding",
    contract_type: "property_lease",
    version: "3.2",
    status: "active",
    output_format: "pdf_and_excel",
    tab_count: 5,
    total_field_count: 73,
    mapped_field_count: 71,
    tab_definitions: [
      { tab_name: "Cover Sheet",       tab_order: 1, field_count: 8 },
      { tab_name: "Lease Terms",       tab_order: 2, field_count: 22 },
      { tab_name: "Financial Summary", tab_order: 3, field_count: 18 },
      { tab_name: "Option Schedule",   tab_order: 4, field_count: 14 },
      { tab_name: "Attestation",       tab_order: 5, field_count: 11 },
    ],
    activated_at: "2026-01-15",
  },
  {
    id: "t2",
    name: "Amendment / Modification",
    template_type: "amendment_modification",
    contract_type: "property_lease",
    version: "2.1",
    status: "active",
    output_format: "excel_only",
    tab_count: 3,
    total_field_count: 41,
    mapped_field_count: 38,
    tab_definitions: [
      { tab_name: "Amendment Summary", tab_order: 1, field_count: 12 },
      { tab_name: "Changed Terms",     tab_order: 2, field_count: 19 },
      { tab_name: "Attestation",       tab_order: 3, field_count: 10 },
    ],
    activated_at: "2026-02-20",
  },
  {
    id: "t3",
    name: "Reassessment Memo / Recalculation",
    template_type: "reassessment_memo_recalculation",
    contract_type: "property_lease",
    version: "1.4",
    status: "active",
    output_format: "pdf_only",
    tab_count: 4,
    total_field_count: 55,
    mapped_field_count: 55,
    tab_definitions: [
      { tab_name: "Reassessment Summary", tab_order: 1, field_count: 14 },
      { tab_name: "Option Analysis",      tab_order: 2, field_count: 16 },
      { tab_name: "Recalculation",        tab_order: 3, field_count: 15 },
      { tab_name: "Attestation",          tab_order: 4, field_count: 10 },
    ],
    activated_at: "2026-03-10",
  },
  // ── Equipment Lease templates (Prompt 5A) ──────────────────────────────────
  {
    id: "exp-tmpl-eq-001",
    name: "Equipment Lease Onboarding v1.0",
    template_type: "equipment_new_lease",
    contract_type: "equipment_lease",
    version: "1.0",
    status: "active",
    output_format: "pdf_and_excel",
    tab_count: 4,
    total_field_count: 54,
    mapped_field_count: 48,
    description: "Initial onboarding for new equipment and asset leases. Maps 54 extracted fields to ERP equipment lease module. Includes finance/operating classification flag, ROU asset, and lease liability opening entries.",
    tab_definitions: [
      { tab_name: "Lease Header",      tab_order: 1, field_count: 16 },
      { tab_name: "Classification",    tab_order: 2, field_count: 12 },
      { tab_name: "Financial Entries", tab_order: 3, field_count: 15 },
      { tab_name: "Supporting",        tab_order: 4, field_count: 11 },
    ],
    activated_at: "2026-06-01",
  },
  {
    id: "exp-tmpl-eq-002",
    name: "Equipment Lease Modification v1.0",
    template_type: "equipment_amendment",
    contract_type: "equipment_lease",
    version: "1.0",
    status: "active",
    output_format: "excel_only",
    tab_count: 3,
    total_field_count: 38,
    mapped_field_count: 35,
    description: "Remeasurement export for modified equipment leases. Maps delta values to ERP adjustment entries.",
    tab_definitions: [
      { tab_name: "Amendment Summary", tab_order: 1, field_count: 14 },
      { tab_name: "Delta Entries",     tab_order: 2, field_count: 16 },
      { tab_name: "Supporting",        tab_order: 3, field_count: 8 },
    ],
    activated_at: "2026-06-01",
  },
];

const TYPE_BADGE: Record<string, { label: string; cls: string; isEquipment?: boolean }> = {
  new_lease_onboarding:            { label: "New Lease",            cls: "badge-processing" },
  amendment_modification:          { label: "Amendment",            cls: "badge-warning" },
  reassessment_memo_recalculation: { label: "Reassessment",         cls: "badge-deferred" },
  equipment_new_lease:             { label: "Equipment — New",       cls: "", isEquipment: true },
  equipment_amendment:             { label: "Equipment — Amendment", cls: "", isEquipment: true },
};

const EQUIPMENT_BADGE_STYLE = { background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' };

// Groups control section headers and ordering
const TEMPLATE_GROUPS = [
  { label: "Property Leases",   key: "property_lease",   ids: ["t1", "t2", "t3"] },
  { label: "Equipment Leases",  key: "equipment_lease",  ids: ["exp-tmpl-eq-001", "exp-tmpl-eq-002"] },
  { label: "Service Contracts", key: "service_contract", ids: [] as string[] },
];

const FORMAT_ICON: Record<string, React.ReactNode> = {
  excel_only:    <FileSpreadsheet className="w-3.5 h-3.5" />,
  pdf_only:      <FileText className="w-3.5 h-3.5" />,
  pdf_and_excel: <><FileSpreadsheet className="w-3.5 h-3.5" /><FileText className="w-3.5 h-3.5" /></>,
};

// ─── Record metadata lookup (keyed by record ID from ?record= query param) ───
const MOCK_RECORD_TITLES: Record<string, { contract_number: string; title: string; status: string; contract_type?: string }> = {
  r1:   { contract_number: "CR-2026-0088", title: "Office Tower — 350 Fifth Ave",          status: "approved",              contract_type: "property_lease" },
  r2:   { contract_number: "CR-2026-0087", title: "Retail HQ — 1200 Market St",            status: "pending_approval",      contract_type: "property_lease" },
  r3:   { contract_number: "CR-2026-0086", title: "Warehouse Lease — Industrial Park",     status: "under_review",          contract_type: "property_lease" },
  r4:   { contract_number: "CR-2026-0085", title: "Ground Lease — Civic Center",           status: "correction_in_progress",contract_type: "property_lease" },
  r5:   { contract_number: "CR-2026-0084", title: "Tech Campus — Building A",              status: "approved",              contract_type: "property_lease" },
  r6:   { contract_number: "CR-2026-0083", title: "Suburban Office — Suite 400",           status: "draft",                 contract_type: "property_lease" },
  r7:   { contract_number: "CR-2026-0082", title: "Downtown Retail — Corner Unit",         status: "approved",              contract_type: "property_lease" },
  r8:   { contract_number: "CR-2026-0081", title: "Distribution Center — Zone 3",          status: "approved",              contract_type: "property_lease" },
  "eq-001": { contract_number: "EQ-2026-0001", title: "Dell PowerEdge R750 Server Array (×12)", status: "approved",         contract_type: "equipment_lease" },
  "eq-002": { contract_number: "EQ-2026-0002", title: "Haas VF-4SS CNC Machining Center",       status: "approved",         contract_type: "equipment_lease" },
};

const STATUS_BADGE_CLS: Record<string, string> = {
  approved:               "badge-valid",
  pending_approval:       "badge-warning",
  under_review:           "badge-processing",
  correction_in_progress: "badge-invalid",
  draft:                  "badge-muted",
};
const STATUS_LABEL: Record<string, string> = {
  approved:               "Approved",
  pending_approval:       "Pending Approval",
  under_review:           "Under Review",
  correction_in_progress: "Correction in Progress",
  draft:                  "Draft",
};

export default function ExportTemplateSelection() {
  const _screenKey = SCREEN_KEYS.EXPORT_TEMPLATE_SELECTION;
  const [, navigate] = useLocation();
  const { getLabel } = useRoleLabel();
  const searchStr = useSearch();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedTemplate = MOCK_TEMPLATES.find(t => t.id === selected);

  // Read ?record= query param to show the correct record context card
  const recordId = useMemo(() => new URLSearchParams(searchStr).get('record') ?? 'r1', [searchStr]);
  const recordMeta = MOCK_RECORD_TITLES[recordId] ?? MOCK_RECORD_TITLES.r1;
  const recordContractTypeLabel = recordMeta.contract_type === 'equipment_lease' ? 'Equipment Lease' : 'Property Lease';

  // TODO: Backend integration required — POST /api/export/tasks (creates UploadTask, locks template version)
  const TEMPLATE_TO_TASK: Record<string, string> = {
    t1: 'ut1', t2: 'ut2', t3: 'ut3',
    'exp-tmpl-eq-001': 'ut-eq-1', 'exp-tmpl-eq-002': 'ut-eq-2',
  };
  function handleSelect() {
    if (!selected) return;
    const taskId = TEMPLATE_TO_TASK[selected] ?? 'ut1';
    navigate(`/export/staging?task=${taskId}&record=${recordId}`);
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{getLabel('/export/templates', 'Select Export Template')}</h1>
            <ScreenNumberBadge screenKey="export-template-selection" />
          </div>
          <p className="page-subtitle">Choose the template that matches this contract record type</p>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-6 max-w-5xl">
        {/* Record context card — driven by ?record= query param */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-6">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-8 flex-1 text-[12px]">
            <div><span className="text-muted-foreground">Record: </span><span className="font-mono font-semibold text-foreground">{recordMeta.contract_number}</span></div>
            <div><span className="text-muted-foreground">Title: </span><span className="font-medium text-foreground">{recordMeta.title}</span></div>
            <div>
              <span className="text-muted-foreground">Type: </span>
              {recordMeta.contract_type === 'equipment_lease'
                ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold" style={EQUIPMENT_BADGE_STYLE}>Equipment Lease</span>
                : <span className="font-medium text-foreground">{recordContractTypeLabel}</span>
              }
            </div>
            <div><span className="text-muted-foreground">Status: </span><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE_CLS[recordMeta.status] ?? 'badge-muted'}`}>{STATUS_LABEL[recordMeta.status] ?? recordMeta.status}</span></div>
          </div>
          <span className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-1 rounded">Record locked for export</span>
        </div>

        {/* Template cards — grouped by contract type */}
        <div className="flex flex-col gap-8">
          {TEMPLATE_GROUPS.map(group => {
            const groupTemplates = MOCK_TEMPLATES.filter(t => group.ids.includes(t.id));
            return (
              <div key={group.key}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-[13px] font-bold text-foreground">{group.label}</h3>
                  <div className="flex-1 h-px bg-border" />
                  {groupTemplates.length === 0 && (
                    <span className="text-[11px] text-muted-foreground italic">No templates configured</span>
                  )}
                </div>

                {groupTemplates.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl p-6 text-center text-[12px] text-muted-foreground">
                    Service Contract templates are not yet configured. Contact your administrator to set up templates for this contract type.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {groupTemplates.map(tmpl => {
                      const badge = TYPE_BADGE[tmpl.template_type] ?? { label: tmpl.template_type, cls: "badge-muted" };
                      const isSelected = selected === tmpl.id;
                      const mappingPct = Math.round((tmpl.mapped_field_count / tmpl.total_field_count) * 100);

                      return (
                        <button
                          key={tmpl.id}
                          onClick={() => setSelected(tmpl.id)}
                          className="text-left bg-card border rounded-xl p-5 flex flex-col gap-4 transition-all duration-150 hover:shadow-md"
                          style={{
                            borderColor: isSelected ? "var(--color-lg-primary)" : "var(--color-border)",
                            boxShadow: isSelected ? "0 0 0 2px var(--color-lg-primary)" : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-foreground leading-snug">{tmpl.name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                {badge.isEquipment
                                  ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold" style={EQUIPMENT_BADGE_STYLE}>{badge.label}</span>
                                  : <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
                                }
                                <span className="text-[11px] text-muted-foreground">v{tmpl.version}</span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-primary)" }} />}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[12px]">
                            <div className="bg-muted/20 rounded-lg p-2.5 text-center">
                              <p className="text-[18px] font-bold text-foreground">{tmpl.tab_count}</p>
                              <p className="text-muted-foreground text-[11px]">Tabs</p>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-2.5 text-center">
                              <p className="text-[18px] font-bold text-foreground">{tmpl.total_field_count}</p>
                              <p className="text-muted-foreground text-[11px]">Fields</p>
                            </div>
                          </div>

                          {/* Mapping completeness bar */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">Fields mapped</span>
                              <span className="font-semibold text-foreground">{tmpl.mapped_field_count}/{tmpl.total_field_count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width:`${mappingPct}%`, background: mappingPct === 100 ? "var(--color-lg-success)" : "var(--color-lg-primary)" }}
                              />
                            </div>
                          </div>

                          {/* Output format */}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">{FORMAT_ICON[tmpl.output_format]}</span>
                            <span className="capitalize">{tmpl.output_format.replace(/_/g, " ")}</span>
                          </div>

                          {/* Tab list */}
                          <div className="flex flex-col gap-1">
                            {tmpl.tab_definitions.map(tab => (
                              <div key={tab.tab_order} className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground">{tab.tab_order}. {tab.tab_name}</span>
                                <span className="text-muted-foreground">{tab.field_count} fields</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Version lock notice */}
        {selectedTemplate && (
          <div className="flex items-start gap-3 p-4 rounded-lg border" style={{ borderColor:"var(--color-lg-warning)", background:"var(--color-lg-warning-subtle)" }}>
            <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
            <div className="text-[12px]">
              <p className="font-semibold text-foreground">Template version will be locked at task creation</p>
              <p className="text-muted-foreground mt-0.5">
                <span className="font-mono font-semibold">{selectedTemplate.name} v{selectedTemplate.version}</span> will be locked into this Upload Task.
                If the template is updated later, this task will continue using v{selectedTemplate.version}.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate(`/records/${recordId}`)}>Cancel</Button>
          <Button disabled={!selected} onClick={handleSelect} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Select and Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
