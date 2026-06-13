/**
 * AdminThresholds — FC-8 Screen 8.4
 * Screen key: admin-thresholds
 * Route: /admin/thresholds
 *
 * Prompt 8.4: Threshold and automation configuration.
 * 5 accordion groups: Onboarding · Reassessment · Approval · Watchlist · Automation
 * Each setting: current value, default value, scope badge.
 * Change log expandable. Save Changes primary, Reset to Defaults outlined.
 * Session-specific rules (from FC-8 session spec):
 *   CONFIDENCE THRESHOLDS (ThresholdConfiguration)
 *   SLA CONFIGURATION (TenantSlaConfig)
 *   VERSION HISTORY (last 5 versions with Restore)
 *
 * Data model refs: ThresholdConfiguration, TenantSlaConfig, AutomationPolicy (Part 2.1)
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type NotifType = "email" | "in_app" | "both";
type EscalationTarget = "manager" | "controller" | "both";

interface ThresholdConfig {
  ocr_confidence_minimum: number;
  high_confidence_threshold: number;
  medium_confidence_lower: number;
  extraction_timeout_seconds: number;
  max_file_size_mb: number;
  tier2_assessment_materiality: number;
  option_date_alert_days: number;
  ibr_staleness_days: number;
  payment_change_trigger_pct: number;
  standard_materiality: number;
  escalated_materiality: number;
  watchlist_default_frequency: "weekly" | "monthly" | "quarterly";
}

interface SlaConfig {
  review_sla_business_days: number;
  approval_sla_business_days: number;
  checkpoint_response_hours: number;
  upload_task_stall_days: number;
  rework_sla_business_days: number;
  agent_exception_escalation_hours: number;
  day1_notification_type: NotifType;
  day3_notification_type: NotifType;
  day7_escalation_recipient: EscalationTarget;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  ocr_confidence_minimum: 0.80,
  high_confidence_threshold: 0.90,
  medium_confidence_lower: 0.60,
  extraction_timeout_seconds: 300,
  max_file_size_mb: 100,
  tier2_assessment_materiality: 500000,
  option_date_alert_days: 90,
  ibr_staleness_days: 365,
  payment_change_trigger_pct: 0.10,
  standard_materiality: 250000,
  escalated_materiality: 1000000,
  watchlist_default_frequency: "monthly",
};

const DEFAULT_SLA: SlaConfig = {
  review_sla_business_days: 5,
  approval_sla_business_days: 3,
  checkpoint_response_hours: 48,
  upload_task_stall_days: 3,
  rework_sla_business_days: 5,
  agent_exception_escalation_hours: 24,
  day1_notification_type: "both",
  day3_notification_type: "both",
  day7_escalation_recipient: "both",
};

const VERSION_HISTORY = [
  { version:5, changed_by:"M. Webb", date:"2026-05-10", note:"Raised tier2 materiality to $500K" },
  { version:4, changed_by:"M. Webb", date:"2026-03-22", note:"Reduced OCR minimum to 0.80" },
  { version:3, changed_by:"A. Chen", date:"2026-01-15", note:"Added agent exception escalation SLA" },
  { version:2, changed_by:"M. Webb", date:"2025-11-08", note:"Set approval SLA to 3 days" },
  { version:1, changed_by:"System",  date:"2025-09-01", note:"Initial configuration" },
];

type AccordionKey = "onboarding" | "reassessment" | "approval" | "watchlist" | "automation" | "sla" | "history";

export default function AdminThresholds() {
  const _screenKey = SCREEN_KEYS.ADMIN_THRESHOLDS;
  const [thresholds, setThresholds] = useState<ThresholdConfig>({ ...DEFAULT_THRESHOLDS });
  const [sla, setSla] = useState<SlaConfig>({ ...DEFAULT_SLA });
  const [open, setOpen] = useState<Set<AccordionKey>>(new Set(["onboarding","sla"] as AccordionKey[]));
  const [dirty, setDirty] = useState(false);

  function toggleSection(key: AccordionKey) {
    setOpen(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  function setT<K extends keyof ThresholdConfig>(key: K, val: ThresholdConfig[K]) {
    setThresholds(t => ({ ...t, [key]: val }));
    setDirty(true);
  }

  function setS<K extends keyof SlaConfig>(key: K, val: SlaConfig[K]) {
    setSla(s => ({ ...s, [key]: val }));
    setDirty(true);
  }

  function resetAll() {
    setThresholds({ ...DEFAULT_THRESHOLDS });
    setSla({ ...DEFAULT_SLA });
    setDirty(false);
  }

  // TODO: Backend integration required — POST /api/admin/thresholds (creates new version)
  function saveChanges() { setDirty(false); }

  function AccordionHeader({ label, k }: { label: string; k: AccordionKey }) {
    const isOpen = open.has(k);
    return (
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/10 transition-colors"
        onClick={() => toggleSection(k)}
      >
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-[13px] font-bold text-foreground">{label}</span>
      </button>
    );
  }

  function NotifSelect({ value, onChange }: { value: NotifType; onChange: (v: NotifType) => void }) {
    return (
      <div className="flex gap-1">
        {(["email","in_app","both"] as NotifType[]).map(v => (
          <button key={v} onClick={() => onChange(v)}
            className="px-2 py-1 rounded text-[11px] font-semibold border capitalize transition-all"
            style={{
              borderColor: value === v ? "var(--color-lg-primary)" : "var(--color-border)",
              background: value === v ? "var(--color-lg-primary)" : "transparent",
              color: value === v ? "white" : "var(--color-muted-foreground)",
            }}>
            {v.replace("_","-")}
          </button>
        ))}
      </div>
    );
  }

  function EscalationSelect({ value, onChange }: { value: EscalationTarget; onChange: (v: EscalationTarget) => void }) {
    return (
      <div className="flex gap-1">
        {(["manager","controller","both"] as EscalationTarget[]).map(v => (
          <button key={v} onClick={() => onChange(v)}
            className="px-2 py-1 rounded text-[11px] font-semibold border capitalize transition-all"
            style={{
              borderColor: value === v ? "var(--color-lg-primary)" : "var(--color-border)",
              background: value === v ? "var(--color-lg-primary)" : "transparent",
              color: value === v ? "white" : "var(--color-muted-foreground)",
            }}>
            {v}
          </button>
        ))}
      </div>
    );
  }

  function Row({ label, defaultVal, children }: { label: string; defaultVal: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
        <div className="w-56 shrink-0">
          <p className="text-[12px] font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">Default: {defaultVal}</p>
        </div>
        <div className="flex-1">{children}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground font-semibold">Tenant</span>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">Thresholds &amp; SLA Configuration</h1>
              <ScreenNumberBadge screenKey="admin-thresholds" />
            </div>
            <p className="page-subtitle">Every save creates a new version — previous versions can be restored</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={resetAll}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
            </Button>
            <Button className="h-8 text-[12px] gap-1.5" disabled={!dirty} onClick={saveChanges}>
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-3 max-w-4xl">

          {/* GROUP 1: Onboarding / Confidence Thresholds */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionHeader label="Onboarding — Confidence Thresholds" k="onboarding" />
            {open.has("onboarding") && (
              <div className="border-t border-border px-5 py-2">
                <Row label="OCR Confidence Minimum" defaultVal="0.80">
                  <div className="flex items-center gap-3">
                    <Slider value={[thresholds.ocr_confidence_minimum]} min={0.5} max={1} step={0.01}
                      onValueChange={([v]) => setT("ocr_confidence_minimum", v)} className="flex-1" />
                    <span className="font-mono text-[12px] w-10 text-right">{thresholds.ocr_confidence_minimum.toFixed(2)}</span>
                  </div>
                </Row>
                <Row label="High Confidence Threshold" defaultVal="0.90">
                  <div className="flex items-center gap-3">
                    <Slider value={[thresholds.high_confidence_threshold]} min={0.7} max={1} step={0.01}
                      onValueChange={([v]) => setT("high_confidence_threshold", v)} className="flex-1" />
                    <span className="font-mono text-[12px] w-10 text-right">{thresholds.high_confidence_threshold.toFixed(2)}</span>
                  </div>
                </Row>
                <Row label="Medium Confidence Lower Bound" defaultVal="0.60">
                  <div className="flex items-center gap-3">
                    <Slider value={[thresholds.medium_confidence_lower]} min={0.3} max={0.9} step={0.01}
                      onValueChange={([v]) => setT("medium_confidence_lower", v)} className="flex-1" />
                    <span className="font-mono text-[12px] w-10 text-right">{thresholds.medium_confidence_lower.toFixed(2)}</span>
                  </div>
                </Row>
                <Row label="Max File Size (MB)" defaultVal="100">
                  <Input type="number" className="h-7 w-24 text-[12px]" value={thresholds.max_file_size_mb}
                    onChange={e => setT("max_file_size_mb", parseInt(e.target.value))} />
                </Row>
                <Row label="Extraction Timeout (seconds)" defaultVal="300">
                  <Input type="number" className="h-7 w-24 text-[12px]" value={thresholds.extraction_timeout_seconds}
                    onChange={e => setT("extraction_timeout_seconds", parseInt(e.target.value))} />
                </Row>
              </div>
            )}
          </div>

          {/* GROUP 2: Reassessment */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionHeader label="Reassessment" k="reassessment" />
            {open.has("reassessment") && (
              <div className="border-t border-border px-5 py-2">
                <Row label="Tier 2 Materiality Threshold" defaultVal="$500,000">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-muted-foreground">$</span>
                    <Input type="number" className="h-7 w-32 text-[12px]" value={thresholds.tier2_assessment_materiality}
                      onChange={e => setT("tier2_assessment_materiality", parseInt(e.target.value))} />
                  </div>
                </Row>
                <Row label="Option Date Alert Window (days)" defaultVal="90">
                  <Input type="number" className="h-7 w-24 text-[12px]" value={thresholds.option_date_alert_days}
                    onChange={e => setT("option_date_alert_days", parseInt(e.target.value))} />
                </Row>
                <Row label="IBR Staleness (days)" defaultVal="365">
                  <Input type="number" className="h-7 w-24 text-[12px]" value={thresholds.ibr_staleness_days}
                    onChange={e => setT("ibr_staleness_days", parseInt(e.target.value))} />
                </Row>
                <Row label="Payment Change Trigger (%)" defaultVal="10%">
                  <div className="flex items-center gap-3">
                    <Slider value={[thresholds.payment_change_trigger_pct]} min={0} max={0.5} step={0.01}
                      onValueChange={([v]) => setT("payment_change_trigger_pct", v)} className="flex-1 max-w-xs" />
                    <span className="font-mono text-[12px] w-12">{(thresholds.payment_change_trigger_pct * 100).toFixed(0)}%</span>
                  </div>
                </Row>
                <Row label="Watchlist Default Frequency" defaultVal="monthly">
                  <div className="flex gap-1">
                    {(["weekly","monthly","quarterly"] as const).map(v => (
                      <button key={v} onClick={() => setT("watchlist_default_frequency", v)}
                        className="px-2 py-1 rounded text-[11px] font-semibold border capitalize transition-all"
                        style={{
                          borderColor: thresholds.watchlist_default_frequency === v ? "var(--color-lg-primary)" : "var(--color-border)",
                          background: thresholds.watchlist_default_frequency === v ? "var(--color-lg-primary)" : "transparent",
                          color: thresholds.watchlist_default_frequency === v ? "white" : "var(--color-muted-foreground)",
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </Row>
              </div>
            )}
          </div>

          {/* GROUP 3: Approval */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionHeader label="Approval — Materiality Routing" k="approval" />
            {open.has("approval") && (
              <div className="border-t border-border px-5 py-2">
                <Row label="Standard Materiality Threshold" defaultVal="$250,000">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-muted-foreground">$</span>
                    <Input type="number" className="h-7 w-32 text-[12px]" value={thresholds.standard_materiality}
                      onChange={e => setT("standard_materiality", parseInt(e.target.value))} />
                  </div>
                </Row>
                <Row label="Escalated Materiality Threshold" defaultVal="$1,000,000">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-muted-foreground">$</span>
                    <Input type="number" className="h-7 w-32 text-[12px]" value={thresholds.escalated_materiality}
                      onChange={e => setT("escalated_materiality", parseInt(e.target.value))} />
                  </div>
                </Row>
              </div>
            )}
          </div>

          {/* GROUP 4: SLA */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionHeader label="SLA Configuration" k="sla" />
            {open.has("sla") && (
              <div className="border-t border-border px-5 py-2">
                <Row label="Review SLA (business days)" defaultVal="5">
                  <Input type="number" className="h-7 w-20 text-[12px]" value={sla.review_sla_business_days}
                    onChange={e => setS("review_sla_business_days", parseInt(e.target.value))} />
                </Row>
                <Row label="Approval SLA (business days)" defaultVal="3">
                  <Input type="number" className="h-7 w-20 text-[12px]" value={sla.approval_sla_business_days}
                    onChange={e => setS("approval_sla_business_days", parseInt(e.target.value))} />
                </Row>
                <Row label="Checkpoint Response Deadline (hours)" defaultVal="48">
                  <Input type="number" className="h-7 w-20 text-[12px]" value={sla.checkpoint_response_hours}
                    onChange={e => setS("checkpoint_response_hours", parseInt(e.target.value))} />
                </Row>
                <Row label="Upload Task Stall Threshold (days)" defaultVal="3">
                  <Input type="number" className="h-7 w-20 text-[12px]" value={sla.upload_task_stall_days}
                    onChange={e => setS("upload_task_stall_days", parseInt(e.target.value))} />
                </Row>
                <Row label="Day 1 Notification Type" defaultVal="both">
                  <NotifSelect value={sla.day1_notification_type} onChange={v => setS("day1_notification_type", v)} />
                </Row>
                <Row label="Day 3 Notification Type" defaultVal="both">
                  <NotifSelect value={sla.day3_notification_type} onChange={v => setS("day3_notification_type", v)} />
                </Row>
                <Row label="Day 7 Escalation Recipient" defaultVal="both">
                  <EscalationSelect value={sla.day7_escalation_recipient} onChange={v => setS("day7_escalation_recipient", v)} />
                </Row>
              </div>
            )}
          </div>

          {/* Version history */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionHeader label="Version History" k="history" />
            {open.has("history") && (
              <div className="border-t border-border px-5 py-2">
                {VERSION_HISTORY.map(v => (
                  <div key={v.version} className="flex items-center gap-4 text-[12px] py-2.5 border-b border-border last:border-0">
                    <span className="font-mono font-bold text-foreground w-8">v{v.version}</span>
                    <span className="text-muted-foreground w-24">{v.date}</span>
                    <span className="text-muted-foreground w-20">{v.changed_by}</span>
                    <span className="text-foreground flex-1">{v.note}</span>
                    {/* TODO: Backend integration required — POST /api/admin/thresholds/:id/restore */}
                    <button className="text-[11px] font-semibold underline" style={{ color:"var(--color-lg-primary)" }}>Restore</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
