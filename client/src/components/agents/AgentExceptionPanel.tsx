/**
 * AgentExceptionPanel — AG.4
 * Full-width error panel for unresolved AgentTask exceptions.
 * Escalate fires AGENT_EXCEPTION_RAISED event.
 * TODO: Backend integration required — POST /agents/tasks/{id}/exceptions/{exId}/escalate
 */

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AgentException = {
  id: string;
  exception_type: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  attempted: string;
  what_needed: string;
  contract_id: string;
  timestamp: string;
  can_defer: boolean;
};

interface Props {
  exceptions: AgentException[];
  onEscalate?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onOpenWorkspace?: (contractId: string) => void;
}

const URGENCY_STYLE: Record<string, string> = {
  HIGH:   'badge-error',
  MEDIUM: 'badge-warning',
  LOW:    'badge-muted',
};

export function AgentExceptionPanel({ exceptions, onEscalate, onDismiss, onOpenWorkspace }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  if (exceptions.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-lg-error)', background: 'var(--color-lg-error-subtle)' }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--color-lg-error)' }}>
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-lg-error)' }} />
        <span className="text-[13px] font-semibold" style={{ color: 'var(--color-lg-error)' }}>
          Agent Exception{exceptions.length !== 1 ? 's' : ''} — {exceptions.length} unresolved
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {exceptions.map(ex => (
          <div key={ex.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[12px] font-semibold text-foreground">{ex.exception_type.replace(/_/g, ' ')}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${URGENCY_STYLE[ex.urgency]}`}>{ex.urgency}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{ex.contract_id}</span>
                </div>
                <p className="text-[12px] text-foreground mb-2">{ex.message}</p>

                <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => toggle(ex.id)}>
                  {expanded.has(ex.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  What Was Attempted
                </button>
                {expanded.has(ex.id) && (
                  <div className="mb-2 text-[11px] text-muted-foreground bg-muted/20 rounded px-3 py-2">{ex.attempted}</div>
                )}

                <div className="rounded-lg px-3 py-2.5 text-[12px]" style={{ background: 'var(--color-lg-warning-subtle)', borderLeft: '3px solid var(--color-lg-warning)' }}>
                  <p className="font-semibold mb-0.5" style={{ color: 'var(--color-lg-warning)' }}>What Is Needed</p>
                  <p className="text-foreground">{ex.what_needed}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => onOpenWorkspace?.(ex.contract_id)}>
                <ExternalLink className="w-3 h-3" /> Open in Workspace
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]"
                style={{ borderColor: 'var(--color-lg-error)', color: 'var(--color-lg-error)' }}
                onClick={() => onEscalate?.(ex.id)}>
                Escalate
              </Button>
              {ex.can_defer && (
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onDismiss?.(ex.id)}>
                  Dismiss
                </Button>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{ex.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
