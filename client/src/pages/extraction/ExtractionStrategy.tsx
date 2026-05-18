/**
 * ExtractionStrategy — FC-2 Screen 2.3
 * Screen key: extraction-strategy
 * Route: /extraction/strategy
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.3: Automation level selection.
 *   Three cards: Full Autonomous / Collaborative / Full Manual.
 *   Active card highlighted with primary border.
 *   Each card shows description, estimated time, and capabilities list.
 *   Confidence threshold slider (0.60–0.99, default 0.90).
 *   Proceed button.
 * Data model refs: ExtractionRecord (extraction_mode: ai_assisted|manual|hybrid,
 *                  confidence_threshold)
 */

import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Cpu, Users, User, ChevronRight, Info, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type AutomationLevel = "ai_assisted" | "hybrid" | "manual";

interface StrategyOption {
  key: AutomationLevel;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  estimatedTime: string;
  capabilities: string[];
  note?: string;
}

const OPTIONS: StrategyOption[] = [
  {
    key: "ai_assisted",
    label: "Full Autonomous",
    subtitle: "AI extracts all 73 fields automatically",
    icon: <Cpu className="w-6 h-6" />,
    estimatedTime: "~2 minutes",
    capabilities: [
      "AI extracts all 73 fields",
      "Confidence badges on every field",
      "Evidence anchors auto-placed",
      "Low-confidence fields flagged for review",
      "Preparer reviews and verifies output",
    ],
    note: "Recommended for high-quality scans (OCR ≥ 90%)",
  },
  {
    key: "hybrid",
    label: "Collaborative",
    subtitle: "AI extracts, Preparer reviews at checkpoints",
    icon: <Users className="w-6 h-6" />,
    estimatedTime: "~5 minutes",
    capabilities: [
      "AI extracts fields in batches",
      "Checkpoint review after each category",
      "Preparer can correct before AI continues",
      "Suitable for mixed-quality documents",
      "Audit trail of AI vs Preparer values",
    ],
  },
  {
    key: "manual",
    label: "Full Manual",
    subtitle: "Preparer enters all values field by field",
    icon: <User className="w-6 h-6" />,
    estimatedTime: "~20 minutes",
    capabilities: [
      "No AI extraction",
      "Tab-order navigation through 73 fields",
      "Draw Anchor tool active by default",
      "Try AI Extraction available per field",
      "Required for highly sensitive documents",
    ],
    note: "Use when AI extraction is not permitted by policy",
  },
];

export default function ExtractionStrategy() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_STRATEGY;
  const [, navigate] = useLocation();
  const search = useSearch();
  const [selected, setSelected] = useState<AutomationLevel>("ai_assisted");
  const [threshold, setThreshold] = useState(0.90);

  // S8: ?from= back navigation
  const backDestination = useMemo(() => {
    const from = new URLSearchParams(search).get('from');
    if (from === 'queue')    return { path: '/extraction/queue',    label: 'Processing Queue' };
    if (from === 'workflow') return { path: '/extraction/queue?from=workflow', label: 'Workflow' };
    if (from === 'admin')    return { path: '/admin/schema',         label: 'Admin Schema' };
    return { path: '/extraction/understanding', label: 'Understanding' };
  }, [search]);

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backDestination.path)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={`Back to ${backDestination.label}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Extraction Strategy</h1>
              <ScreenNumberBadge screenKey="extraction-strategy" />
            </div>
            <p className="page-subtitle">Choose how fields will be extracted from this document.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Strategy cards */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            {OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                className={`
                  text-left rounded-xl border-2 p-5 transition-all duration-150 shadow-sm
                  ${selected === opt.key
                    ? "border-primary bg-accent/40 shadow-md"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-md"}
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  selected === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {opt.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">{opt.label}</h3>
                <p className="text-[12px] text-muted-foreground mb-3">{opt.subtitle}</p>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">Est. time:</span>
                  <span className="text-[12px] font-medium text-foreground">{opt.estimatedTime}</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {opt.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {cap}
                    </li>
                  ))}
                </ul>
                {opt.note && (
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-primary">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {opt.note}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Confidence threshold */}
          {selected !== "manual" && (
            <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="text-[14px] font-semibold text-foreground">Confidence Threshold</h2>
                </div>
                <span className="font-mono text-[14px] font-bold text-primary">
                  {Math.round(threshold * 100)}%
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                Fields with AI confidence below this threshold will be flagged for manual review.
              </p>
              <Slider
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
                min={0.60}
                max={0.99}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
                <span>60% (permissive)</span>
                <span>99% (strict)</span>
              </div>
              <div className="mt-3 flex items-start gap-2 text-[12px] text-muted-foreground">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                <span>
                  At {Math.round(threshold * 100)}%, approximately{" "}
                  <strong className="text-foreground">
                    {threshold >= 0.90 ? "6–8" : threshold >= 0.75 ? "12–15" : "20–25"}
                  </strong>{" "}
                  fields will be flagged for review on this document.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="w-72 flex flex-col gap-4">
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">
              Selected Strategy
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {OPTIONS.find(o => o.key === selected)?.icon}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  {OPTIONS.find(o => o.key === selected)?.label}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {OPTIONS.find(o => o.key === selected)?.estimatedTime}
                </p>
              </div>
            </div>
            {selected !== "manual" && (
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Threshold</span>
                <span className="font-semibold text-foreground">{Math.round(threshold * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          Strategy: <strong className="text-foreground">{OPTIONS.find(o => o.key === selected)?.label}</strong>
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/extraction/understanding")}>Back</Button>
          <Button
            className="gap-2"
            onClick={() => navigate(selected === "manual" ? "/extraction/manual" : "/extraction/ai")}
          >
            Start Extraction
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
