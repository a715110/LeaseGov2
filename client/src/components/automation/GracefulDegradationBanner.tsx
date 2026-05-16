/**
 * GracefulDegradationBanner — AG.7 (AG.8 in prompt numbering)
 * Shown when AutomationPolicy.graceful_degradation_enabled = true
 * AND agent is unavailable for full_autonomous or collaborative mode.
 * Never shown in full_manual mode.
 * TODO: Backend integration required — GET /agents/status
 */

import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  estimatedRestoration?: string;
  manualSteps?: string[];
}

export function GracefulDegradationBanner({
  estimatedRestoration = 'Estimated restoration within 15 minutes',
  manualSteps = [
    'Complete field extraction manually in the Extraction Workspace',
    'Review and verify all extracted fields',
    'Submit for approval when ready',
  ],
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  if (dismissed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px]"
        style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>Agent temporarily unavailable — manual mode active</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border-l-4" style={{ borderLeftColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)' }}>
      <div className="flex items-start gap-3 px-5 py-4">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-lg-warning)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground mb-0.5">
            Agent service temporarily unavailable — switched to Collaborative mode
          </p>
          <p className="text-[12px] text-muted-foreground mb-2">
            Your work will not be lost. The agent will resume from where it left off when service is restored.
          </p>
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-lg-warning)' }}>{estimatedRestoration}</p>

          <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-2"
            onClick={() => setShowSteps(s => !s)}>
            {showSteps ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Manual fallback steps
          </button>
          {showSteps && (
            <ol className="mt-2 flex flex-col gap-1 list-decimal list-inside">
              {manualSteps.map((s, i) => (
                <li key={i} className="text-[11px] text-foreground">{s}</li>
              ))}
            </ol>
          )}
        </div>
        <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setDismissed(true)}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
