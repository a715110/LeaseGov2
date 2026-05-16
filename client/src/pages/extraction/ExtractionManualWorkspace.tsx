/**
 * ExtractionManualWorkspace — FC-2 Screen 2.5
 * Screen key: extraction-manual-workspace
 * Route: /extraction/manual
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.5: Split-screen, all values blank, tab-order numbers,
 *   Draw Anchor tool active, Try AI Extraction button, Submit disabled.
 * Data model refs: ExtractionField (all ai_extracted_value null,
 *   anchor_status: missing), EvidenceAnchor (drawn_by: preparer)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Shield, Link2Off, ChevronDown, ChevronUp,
  ZoomIn, ZoomOut, Layers, FileText, ChevronRight,
  Cpu, Crosshair, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";

interface ManualField {
  id: string;
  tab_order: number;
  field_label: string;
  field_category: string;
  is_critical: boolean;
  value: string;
  anchor_drawn: boolean;
}

// TODO: Backend integration required — load from ExtractionTemplate
const INITIAL_FIELDS: ManualField[] = [
  { id:"mf1",  tab_order:1,  field_label:"Record Label",       field_category:"core_metadata", is_critical:false, value:"", anchor_drawn:false },
  { id:"mf2",  tab_order:2,  field_label:"Contract Type",      field_category:"core_metadata", is_critical:false, value:"", anchor_drawn:false },
  { id:"mf3",  tab_order:3,  field_label:"Execution Date",     field_category:"core_metadata", is_critical:true,  value:"", anchor_drawn:false },
  { id:"mf4",  tab_order:4,  field_label:"Commencement Date",  field_category:"core_metadata", is_critical:true,  value:"", anchor_drawn:false },
  { id:"mf5",  tab_order:5,  field_label:"Expiration Date",    field_category:"core_metadata", is_critical:true,  value:"", anchor_drawn:false },
  { id:"mf6",  tab_order:6,  field_label:"Amendment Number",   field_category:"core_metadata", is_critical:false, value:"", anchor_drawn:false },
  { id:"mf7",  tab_order:7,  field_label:"Base Rent Amount",   field_category:"financial",     is_critical:true,  value:"", anchor_drawn:false },
  { id:"mf8",  tab_order:8,  field_label:"Rent Escalation",    field_category:"financial",     is_critical:false, value:"", anchor_drawn:false },
  { id:"mf9",  tab_order:9,  field_label:"Security Deposit",   field_category:"financial",     is_critical:false, value:"", anchor_drawn:false },
  { id:"mf10", tab_order:10, field_label:"Property Address",   field_category:"property",      is_critical:true,  value:"", anchor_drawn:false },
  { id:"mf11", tab_order:11, field_label:"Rentable Area (SF)", field_category:"property",      is_critical:true,  value:"", anchor_drawn:false },
];

const CATEGORIES = ["core_metadata", "financial", "property"];
const CATEGORY_LABELS: Record<string, string> = {
  core_metadata: "Core Metadata", financial: "Financial", property: "Property",
};

export default function ExtractionManualWorkspace() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_MANUAL_WORKSPACE;
  const [, navigate] = useLocation();
  const [fields, setFields] = useState<ManualField[]>(INITIAL_FIELDS);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["core_metadata"]));
  const [activeFieldId, setActiveFieldId] = useState("mf1");
  const [zoom, setZoom] = useState(100);
  const [heatmap, setHeatmap] = useState(false);
  const [drawAnchorActive, setDrawAnchorActive] = useState(true);

  const filledCount = fields.filter(f => f.value.trim().length > 0).length;
  const totalFields = 73;
  const canSubmit = false;

  function toggleCat(cat: string) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <div className="page-header shrink-0">
        <div>
          <h1 className="page-title">Manual Extraction Workspace</h1>
          <p className="page-subtitle">Office-Tower-Amendment-3.pdf · JOB-2026-0442</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-muted border border-border text-[12px] font-semibold text-muted-foreground">Full Manual</span>
          <Button variant="outline" size="sm" className="gap-1.5 text-[12px] text-primary border-primary/40 hover:bg-accent" onClick={() => navigate("/extraction/ai")}>
            <Cpu className="w-3.5 h-3.5" /> Try AI Extraction
          </Button>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-4 px-6 py-2.5 bg-muted/40 border-b border-border text-[13px]">
        <span className="text-foreground font-medium"><strong>{filledCount}</strong> of <strong>{totalFields}</strong> fields entered</span>
        <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
          <div className="h-full bg-primary rounded transition-all" style={{ width: `${(filledCount / totalFields) * 100}%` }} />
        </div>
        <span className="text-muted-foreground text-[12px]">{Math.round((filledCount / totalFields) * 100)}%</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col overflow-hidden" style={{ width: "50%", borderRight: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-card border-b border-border shrink-0">
            <button
              onClick={() => setDrawAnchorActive(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium border transition-colors ${drawAnchorActive ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              <Crosshair className="w-3.5 h-3.5" /> Draw Anchor {drawAnchorActive && <span className="text-[10px] font-bold uppercase tracking-wide ml-1">Active</span>}
            </button>
            <p className="text-[12px] text-muted-foreground">Click a field then draw a bounding box on the PDF to link the source.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map(cat => {
              const catFields = fields.filter(f => f.field_category === cat);
              const isOpen = expandedCats.has(cat);
              return (
                <div key={cat} className="border-b border-border">
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className="text-[13px] font-semibold text-foreground">{CATEGORY_LABELS[cat]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{catFields.length} fields</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-border/50">
                      {catFields.map(field => (
                        <div
                          key={field.id}
                          onClick={() => setActiveFieldId(field.id)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-l-[3px] ${field.is_critical ? "border-l-[var(--color-lg-critical)]" : "border-l-transparent"} ${activeFieldId === field.id ? "bg-accent/60" : "hover:bg-muted/30"}`}
                        >
                          <span className="w-6 h-6 rounded bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{field.tab_order}</span>
                          {field.is_critical && <Shield className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--color-lg-critical)" }} aria-label="Critical Field — Cannot be deferred" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-medium text-foreground">{field.field_label}</span>
                              <Link2Off className="w-3.5 h-3.5 text-[var(--color-lg-error)]" />
                            </div>
                            <Input
                              value={field.value}
                              onChange={e => setFields(prev => prev.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                              placeholder="Enter value…"
                              className="h-8 text-[13px]"
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                          {drawAnchorActive && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px] shrink-0 gap-1" onClick={e => { e.stopPropagation(); setFields(prev => prev.map(f => f.id === field.id ? { ...f, anchor_drawn: true } : f)); }}>
                              <Crosshair className="w-3 h-3" /> {field.anchor_drawn ? "Re-draw" : "Anchor"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col" style={{ width: "50%" }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[12px] font-medium text-foreground">Office-Tower-Amendment-3.pdf</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHeatmap(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium border transition-colors ${heatmap ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                <Layers className="w-3.5 h-3.5" /> Heatmap
              </button>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="font-mono text-[12px] text-muted-foreground w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4 overflow-auto">
            <div className={`relative bg-white border border-border shadow-md rounded ${drawAnchorActive ? "cursor-crosshair" : ""}`} style={{ width: `${zoom * 3.5}px`, maxWidth: "100%", minHeight: "500px", transition: "width 0.15s ease" }}>
              {heatmap && <div className="absolute inset-0 rounded pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(46,117,182,0.12) 0%, rgba(245,127,23,0.08) 60%, rgba(198,40,40,0.15) 100%)" }} />}
              <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-[13px] font-medium">PDF Preview</p>
                  <p className="text-[11px] mt-1 opacity-60">Renders after backend integration</p>
                  {drawAnchorActive && <p className="text-[11px] mt-2 text-primary font-medium">Draw Anchor mode active — click and drag to mark source</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">{filledCount} of {totalFields} fields entered. All fields and anchors required before submission.</p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/extraction/strategy")}>Back</Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled={!canSubmit} className="gap-2">
                  Continue to Verification <ChevronRight className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-[12px]">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>All {totalFields} fields must be entered and anchored before proceeding.</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
