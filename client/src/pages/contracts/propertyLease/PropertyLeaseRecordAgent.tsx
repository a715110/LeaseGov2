/**
 * RecordTabAgent — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordAgent.tsx scaffold stub.
 *
 * Shows Contract Agent activity log for this record.
 */

import { Bot, Clock } from "lucide-react";

interface RecordTabAgentProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/agent-log
const AGENT_LOG = [
  { id:"al1", action:"Extraction completed",          detail:"73 fields extracted, 2 deferred",    timestamp:"2026-05-16 08:15", confidence:0.94 },
  { id:"al2", action:"Validation checks passed",      detail:"6/6 validation checks passed",       timestamp:"2026-05-16 08:10", confidence:null },
  { id:"al3", action:"Document understanding",        detail:"Base contract + 1 amendment detected",timestamp:"2026-05-16 08:05", confidence:null },
  { id:"al4", action:"Collaborative review prepared", detail:"Review summary generated for Reviewer",timestamp:"2026-05-16 10:00",confidence:null },
];

export default function RecordTabAgent({ recordId }: RecordTabAgentProps) {
  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-[var(--color-lg-primary)]" />
        <h3 className="text-[14px] font-semibold text-foreground">Contract Agent Activity</h3>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {AGENT_LOG.map(entry => (
            <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-lg-accent-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-[var(--color-lg-primary)]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">{entry.action}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{entry.detail}</p>
                {entry.confidence !== null && (
                  <p className="text-[11px] mt-1" style={{ color:"var(--color-lg-success)" }}>
                    Confidence: {Math.round(entry.confidence * 100)}%
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{entry.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
