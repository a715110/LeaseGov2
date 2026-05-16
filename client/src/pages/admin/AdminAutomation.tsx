/**
 * AdminAutomation — admin-automation-config (FC-8 / FC-9 Phase 2 — now active)
 * Route: /admin/automation
 *
 * AutomationPolicy configuration per workflow domain:
 *   Document Extraction · Verification · Approval Review ·
 *   Reassessment Classification · Assessment · Analysis
 *
 * Each domain: three-option segmented control
 *   Full Autonomous · Collaborative · Full Manual
 * Checkpoint response deadline: hours input
 * Graceful degradation: toggle switch
 *
 * Data model refs: AutomationPolicy (Part 2.1)
 * TODO: Backend integration required — GET/PUT /automation/policy
 */

import { useState } from 'react';
import { Bot, Users, User, Clock, Shield, Save, RotateCcw, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AutomationPolicyBadge, type AutomationLevel } from '@/components/automation/AutomationPolicyBadge';

type WorkflowDomain = {
  id: string;
  label: string;
  description: string;
  icon: string;
  level: AutomationLevel;
  checkpoint_deadline_hours: number;
  graceful_degradation: boolean;
};

const INITIAL_DOMAINS: WorkflowDomain[] = [
  {
    id: 'document_extraction',
    label: 'Document Extraction',
    description: 'OCR processing, field extraction, confidence scoring, and evidence anchoring.',
    icon: '📄',
    level: 'full_autonomous',
    checkpoint_deadline_hours: 24,
    graceful_degradation: true,
  },
  {
    id: 'verification',
    label: 'Extraction Verification',
    description: 'Cross-field consistency checks, duplicate detection, and critical field validation.',
    icon: '🔍',
    level: 'collaborative',
    checkpoint_deadline_hours: 48,
    graceful_degradation: true,
  },
  {
    id: 'approval_review',
    label: 'Approval Review',
    description: 'Preparer review, reviewer sign-off, and approver final decision routing.',
    icon: '✅',
    level: 'collaborative',
    checkpoint_deadline_hours: 72,
    graceful_degradation: false,
  },
  {
    id: 'reassessment_classification',
    label: 'Reassessment Classification',
    description: 'Trigger detection, event type classification, and urgency scoring.',
    icon: '🏷️',
    level: 'full_autonomous',
    checkpoint_deadline_hours: 24,
    graceful_degradation: true,
  },
  {
    id: 'option_assessment',
    label: 'Option Assessment',
    description: 'Tier 1 and Tier 2 option analysis, financial impact modelling, and recommendation generation.',
    icon: '📊',
    level: 'collaborative',
    checkpoint_deadline_hours: 48,
    graceful_degradation: true,
  },
  {
    id: 'analysis_memo',
    label: 'Analysis & Memo',
    description: 'Memo drafting, remediation planning, and approval package assembly.',
    icon: '📝',
    level: 'collaborative',
    checkpoint_deadline_hours: 72,
    graceful_degradation: false,
  },
];

const LEVEL_CONFIG: Record<AutomationLevel, {
  label: string;
  description: string;
  icon: React.ElementType;
  style: React.CSSProperties;
  risk: string;
}> = {
  full_autonomous: {
    label: 'Full Autonomous',
    description: 'Agent runs end-to-end. Human receives checkpoints at defined gates only.',
    icon: Bot,
    style: { background: 'var(--color-lg-accent-subtle)', color: 'var(--color-lg-accent)', borderColor: 'var(--color-lg-accent)' },
    risk: 'Highest throughput. Requires well-calibrated confidence thresholds.',
  },
  collaborative: {
    label: 'Collaborative',
    description: 'Agent prepares recommendations at each step. Human makes all final decisions.',
    icon: Users,
    style: { background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderColor: '#3B82F6' },
    risk: 'Balanced throughput and oversight. Recommended for most organizations.',
  },
  full_manual: {
    label: 'Full Manual',
    description: 'No agent involvement. All steps completed manually by assigned users.',
    icon: User,
    style: { background: 'var(--color-lg-surface)', color: 'var(--color-muted-foreground)', borderColor: 'var(--color-lg-border)' },
    risk: 'Maximum control. Significantly lower throughput.',
  },
};

const LEVELS: AutomationLevel[] = ['full_autonomous', 'collaborative', 'full_manual'];

function SegmentedControl({ value, onChange }: { value: AutomationLevel; onChange: (v: AutomationLevel) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      {LEVELS.map(l => {
        const cfg = LEVEL_CONFIG[l];
        const Icon = cfg.icon;
        const isActive = value === l;
        return (
          <button key={l}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-all"
            style={isActive ? cfg.style : { background: 'transparent', color: 'var(--color-muted-foreground)' }}
            onClick={() => onChange(l)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

function DomainCard({ domain, onChange }: { domain: WorkflowDomain; onChange: (id: string, patch: Partial<WorkflowDomain>) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LEVEL_CONFIG[domain.level];

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <span className="text-xl shrink-0">{domain.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-foreground">{domain.label}</span>
            <AutomationPolicyBadge level={domain.level} size="sm" />
          </div>
          <p className="text-[11px] text-muted-foreground">{domain.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Deadline</p>
            <p className="text-[12px] font-semibold text-foreground">{domain.checkpoint_deadline_hours}h</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Fallback</p>
            <p className="text-[12px] font-semibold" style={{ color: domain.graceful_degradation ? 'var(--color-lg-success)' : 'var(--color-muted-foreground)' }}>
              {domain.graceful_degradation ? 'On' : 'Off'}
            </p>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-5 flex flex-col gap-5">
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-2 block">Automation Level</label>
            <SegmentedControl value={domain.level} onChange={v => onChange(domain.id, { level: v })} />
            <div className="mt-2 rounded-lg px-3 py-2.5 text-[11px] border" style={cfg.style}>
              <p className="font-semibold mb-0.5">{cfg.label}</p>
              <p>{cfg.description}</p>
              <p className="mt-1 opacity-70">{cfg.risk}</p>
            </div>
          </div>

          {domain.level !== 'full_manual' && (
            <div>
              <label className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Checkpoint Response Deadline
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={1} max={168}
                  className="w-24 h-9 rounded-lg border border-border bg-background text-[13px] px-3 font-mono focus:outline-none"
                  value={domain.checkpoint_deadline_hours}
                  onChange={e => onChange(domain.id, { checkpoint_deadline_hours: Math.max(1, parseInt(e.target.value) || 1) })}
                />
                <span className="text-[12px] text-muted-foreground">hours from checkpoint creation</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                If no human decision is received within this window, the checkpoint is marked overdue and escalated.
              </p>
            </div>
          )}

          {domain.level !== 'full_manual' && (
            <div className="flex items-start gap-4 rounded-lg border border-border px-4 py-3.5" style={{ background: 'var(--color-lg-surface)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground mb-0.5">Graceful Degradation</p>
                <p className="text-[11px] text-muted-foreground">
                  Fall back to Collaborative mode automatically when the agent service is unavailable.
                  Work continues without interruption; the agent resumes when service is restored.
                </p>
              </div>
              <Switch
                checked={domain.graceful_degradation}
                onCheckedChange={v => onChange(domain.id, { graceful_degradation: v })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAutomation() {
  const [domains, setDomains] = useState<WorkflowDomain[]>(INITIAL_DOMAINS);
  const [saved, setSaved] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  function handleChange(id: string, patch: Partial<WorkflowDomain>) {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    setSaved(false);
  }

  function handleSave() {
    // TODO: Backend integration required — PUT /automation/policy
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    setDomains(INITIAL_DOMAINS);
    setSaved(false);
  }

  const autonomousCount = domains.filter(d => d.level === 'full_autonomous').length;
  const collaborativeCount = domains.filter(d => d.level === 'collaborative').length;
  const manualCount = domains.filter(d => d.level === 'full_manual').length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h2 className="text-[18px] font-bold text-foreground mb-1">Automation Configuration</h2>
          <p className="text-[13px] text-muted-foreground">
            Configure automation levels and checkpoint policies for each workflow domain.
            Changes apply to all new workflows; in-progress workflows continue with their original settings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Full Autonomous', count: autonomousCount, color: 'var(--color-lg-accent)', bg: 'var(--color-lg-accent-subtle)' },
            { label: 'Collaborative', count: collaborativeCount, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Full Manual', count: manualCount, color: 'var(--color-muted-foreground)', bg: 'var(--color-lg-surface)' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border px-4 py-3.5 flex items-center gap-3" style={{ background: s.bg }}>
              <span className="text-[28px] font-bold" style={{ color: s.color }}>{s.count}</span>
              <span className="text-[12px] font-semibold text-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {autonomousCount > 0 && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
            style={{ background: 'var(--color-lg-warning-subtle)', borderColor: 'var(--color-lg-warning)' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-lg-warning)' }} />
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-0.5">
                Full Autonomous mode active on {autonomousCount} domain{autonomousCount !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Ensure confidence thresholds are calibrated in the Thresholds screen before enabling full autonomous mode.
                Human checkpoints remain active at critical gates regardless of automation level.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {domains.map(d => (
            <DomainCard key={d.id} domain={d} onChange={handleChange} />
          ))}
        </div>

        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
          <button className="w-full flex items-center justify-between px-5 py-3.5 text-[12px] font-semibold text-foreground"
            onClick={() => setShowVersionHistory(v => !v)}>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Policy Version History
            </span>
            {showVersionHistory ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showVersionHistory && (
            <div className="border-t border-border">
              {[
                { version: 'v3 (current)', date: 'May 14, 2026', user: 'admin@meridian.com', summary: 'Enabled graceful degradation on Extraction and Classification domains.' },
                { version: 'v2', date: 'Apr 28, 2026', user: 'admin@meridian.com', summary: 'Changed Approval Review from Full Autonomous to Collaborative.' },
                { version: 'v1', date: 'Mar 15, 2026', user: 'admin@meridian.com', summary: 'Initial automation policy configuration.' },
              ].map((v, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-3.5 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-foreground">{v.version}</span>
                      <span className="text-[11px] text-muted-foreground">{v.date} · {v.user}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{v.summary}</p>
                  </div>
                  {i > 0 && (
                    <button className="text-[11px] shrink-0" style={{ color: 'var(--color-lg-accent)' }}>Restore</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button className="h-9 text-[12px] gap-1.5" onClick={handleSave}>
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save Policy'}
          </Button>
          <Button variant="outline" className="h-9 text-[12px] gap-1.5" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </Button>
          <p className="text-[11px] text-muted-foreground ml-auto">
            Changes apply to new workflows only. In-progress workflows are unaffected.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
