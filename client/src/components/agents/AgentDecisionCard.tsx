/**
 * AgentDecisionCard — AG.3
 * Compact card showing an agent decision with confidence badge and expandable reasoning.
 * Used inside ContractAgentProgressPanel decisions list.
 * TODO: Backend integration required
 */

import { useState } from 'react';
import { Bot, ChevronDown, ChevronRight } from 'lucide-react';
import type { AgentDecision } from './ContractAgentProgressPanel';

interface Props {
  decision: AgentDecision;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const [cls, label] =
    value >= 0.90 ? ['badge-valid', 'High'] :
    value >= 0.60 ? ['badge-warning', 'Medium'] :
                    ['badge-error', 'Low'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {pct}% {label}
    </span>
  );
}

export function AgentDecisionCard({ decision }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden" style={{ background: 'var(--color-lg-card-bg)' }}>
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <Bot className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[12px] font-semibold text-foreground">{decision.label}</span>
            <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">{decision.decision_type.replace(/_/g, ' ')}</span>
            <ConfidenceBadge value={decision.confidence} />
          </div>
          <p className="text-[12px] text-muted-foreground line-clamp-2">{decision.summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{decision.timestamp}</span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reasoning</p>
            <p className="text-[12px] text-foreground">{decision.reasoning}</p>
          </div>
          {decision.data_used && Object.keys(decision.data_used).length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Data Used</p>
              <div className="flex flex-col gap-1">
                {Object.entries(decision.data_used).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[11px]">
                    <span className="text-muted-foreground w-32 shrink-0">{k}</span>
                    <span className="font-mono text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--color-lg-accent-subtle)' }}>
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--color-lg-accent)' }}>Recommendation</p>
            <p className="text-[12px] text-foreground">{decision.summary}</p>
          </div>
          <div className="rounded-lg px-3 py-2 text-[11px]"
            style={decision.requires_human_approval
              ? { background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }
              : { background: 'var(--color-lg-accent-subtle)', color: 'var(--color-lg-accent)' }}>
            {decision.requires_human_approval
              ? '⚠ Human approval required before proceeding'
              : '✓ Proceeding automatically'}
          </div>
        </div>
      )}
    </div>
  );
}
