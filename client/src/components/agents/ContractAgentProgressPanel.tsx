/**
 * ContractAgentProgressPanel — AG.1
 * Real-time agent progress panel for an open contract record.
 * Handles: full_autonomous (primary), graceful degradation state.
 * TODO: Backend integration required — GET /agents/tasks?subject_id=...
 */

import { useState } from 'react';
import { Bot, CheckCircle2, Clock, ChevronDown, ChevronRight, AlertTriangle, Flag } from 'lucide-react';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { InterventionButton } from '@/components/automation/InterventionButton';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { AgentDecisionCard } from '@/components/agents/AgentDecisionCard';

export type AgentStep = {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
  timestamp?: string;
  reasoning?: string;
  duration?: string;
};

export type AgentDecision = {
  id: string;
  label: string;
  decision_type: string;
  confidence: number;
  summary: string;
  reasoning: string;
  data_used?: Record<string, string>;
  requires_human_approval: boolean;
  timestamp: string;
};

export type AgentTaskData = {
  id: string;
  agent_type: string;
  workflow_id: string;
  contract_id: string;
  status: 'queued' | 'running' | 'awaiting_checkpoint' | 'completed' | 'failed' | 'paused_by_human';
  automation_level: 'full_autonomous' | 'collaborative' | 'full_manual';
  current_step?: string;
  steps: AgentStep[];
  decisions: AgentDecision[];
  flags?: { message: string; detail: string }[];
  progress?: { current: number; total: number; label: string };
  agent_name: string;
};

interface Props {
  task: AgentTaskData;
  agentUnavailable?: boolean;
  onIntervene?: () => void;
  onResume?: () => void;
}

export function ContractAgentProgressPanel({ task, agentUnavailable = false, onIntervene, onResume }: Props) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showDecisions, setShowDecisions] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState(false);

  function toggleStep(id: string) {
    setExpandedSteps(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  if (agentUnavailable) {
    return (
      <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
        <GracefulDegradationBanner />
      </div>
    );
  }

  const completedSteps = task.steps.filter(s => s.status === 'completed');
  const activeStep = task.steps.find(s => s.status === 'active');
  const upcomingSteps = task.steps.filter(s => s.status === 'upcoming');

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-lg-accent-subtle)' }}>
            <Bot className="w-4 h-4" style={{ color: 'var(--color-lg-accent)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">{task.agent_name}</span>
              <AutomationPolicyBadge level={task.automation_level} size="sm" />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{task.contract_id}</span>
          </div>
        </div>
        <InterventionButton
          status={task.status}
          onIntervene={onIntervene}
          onResume={onResume}
        />
      </div>

      {/* Flags */}
      {task.flags && task.flags.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border px-4 py-3 cursor-pointer"
          style={{ background: 'var(--color-lg-warning-subtle)', borderColor: 'var(--color-lg-warning)' }}
          onClick={() => setExpandedFlags(f => !f)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-3.5 h-3.5" style={{ color: 'var(--color-lg-warning)' }} />
              <span className="text-[12px] font-semibold" style={{ color: 'var(--color-lg-warning)' }}>
                {task.flags.length} item{task.flags.length !== 1 ? 's' : ''} require attention
              </span>
            </div>
            {expandedFlags ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          {expandedFlags && (
            <div className="mt-2 flex flex-col gap-1.5">
              {task.flags.map((f, i) => (
                <div key={i} className="text-[12px] text-foreground">
                  <span className="font-semibold">{f.message}</span>
                  {f.detail && <span className="text-muted-foreground ml-1">— {f.detail}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="px-4 py-4 flex flex-col gap-2">
        {/* Completed */}
        {completedSteps.map(step => (
          <div key={step.id}>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleStep(step.id)}>
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--color-lg-success)' }} />
              <span className="text-[12px] font-medium text-foreground flex-1">{step.label}</span>
              {step.timestamp && <span className="text-[11px] text-muted-foreground">{step.timestamp}</span>}
              {step.reasoning && (expandedSteps.has(step.id)
                ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                : <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            {expandedSteps.has(step.id) && step.reasoning && (
              <div className="ml-7 mt-1 text-[11px] text-muted-foreground bg-muted/20 rounded px-3 py-2">{step.reasoning}</div>
            )}
          </div>
        ))}

        {/* Active */}
        {activeStep && (
          <div className="rounded-lg px-4 py-3 border" style={{ background: 'var(--color-lg-accent-subtle)', borderColor: 'var(--color-lg-accent)' }}>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--color-lg-accent)' }} />
              <span className="text-[12px] font-semibold flex-1" style={{ color: 'var(--color-lg-accent)' }}>{activeStep.label}</span>
              {activeStep.duration && <span className="text-[11px] text-muted-foreground">{activeStep.duration}</span>}
            </div>
            {task.progress && (
              <div className="mt-2 ml-7">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{task.progress.label}</span>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--color-lg-accent)' }}>
                    {task.progress.current} / {task.progress.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${(task.progress.current / task.progress.total) * 100}%`,
                    background: 'var(--color-lg-accent)',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming */}
        {upcomingSteps.map(step => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: 'var(--color-lg-border)' }} />
            <span className="text-[12px] text-muted-foreground">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Decisions */}
      {task.decisions.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <button className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowDecisions(d => !d)}>
            {showDecisions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Agent Decisions ({task.decisions.length})
          </button>
          {showDecisions && (
            <div className="mt-3 flex flex-col gap-3">
              {task.decisions.map(d => <AgentDecisionCard key={d.id} decision={d} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
