/**
 * HumanCheckpointForm — AG.9 (AG.5 in prompt numbering)
 * Modification form shown when human selects "Modify" on ContractCheckpointCard.
 * Each field shows agent value vs editable human value.
 * TODO: Backend integration required — POST /checkpoints/{id}/resolve
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HumanCheckpointData } from './ContractCheckpointCard';

interface Props {
  checkpoint: HumanCheckpointData;
  onSubmit: (modifiedData: Record<string, string>, rationale: string) => void;
  onCancel: () => void;
}

export function HumanCheckpointForm({ checkpoint, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    checkpoint.agent_prepared_data.fields.forEach(f => { init[f.field_name] = f.agent_value; });
    return init;
  });
  const [rationale, setRationale] = useState('');
  const [criticalConfirmed, setCriticalConfirmed] = useState<Set<string>>(new Set());

  const criticalFields = checkpoint.agent_prepared_data.fields.filter(f => f.is_critical);
  const modifiedFields = checkpoint.agent_prepared_data.fields.filter(f => values[f.field_name] !== f.agent_value);
  const allCriticalConfirmed = criticalFields.filter(f => modifiedFields.find(m => m.field_name === f.field_name))
    .every(f => criticalConfirmed.has(f.field_name));
  const canSubmit = rationale.trim().length >= 10 && allCriticalConfirmed;

  function handleSubmit() {
    const diff: Record<string, string> = {};
    modifiedFields.forEach(f => { diff[f.field_name] = values[f.field_name]; });
    onSubmit(diff, rationale);
  }

  return (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-card-bg)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14px] font-semibold text-foreground mb-1">
          Modifying Agent's Work — <span className="font-mono">{checkpoint.contract_record_id}</span>
        </h3>
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[11px]"
          style={{ background: 'var(--color-lg-warning-subtle)', color: 'var(--color-lg-warning)' }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>All modified fields will be tagged as human-modified in the audit trail. Your changes will override the agent's values.</span>
        </div>
      </div>

      {/* Annotation key */}
      <div className="px-5 py-2.5 border-b border-border flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/30 inline-block" />Agent-provided</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block" style={{ background: 'var(--color-lg-accent)' }} />Human-modified</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block" style={{ background: 'var(--color-lg-warning)' }} />Critical field</span>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {checkpoint.agent_prepared_data.fields.map(field => {
          const isModified = values[field.field_name] !== field.agent_value;
          const isCritical = field.is_critical;
          return (
            <div key={field.field_name} className="rounded-lg border px-4 py-3"
              style={isCritical ? { borderColor: 'var(--color-lg-warning)', background: 'var(--color-lg-warning-subtle)' } : { borderColor: 'var(--color-lg-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-foreground">{field.field_name}</span>
                {isCritical && <span className="badge-warning px-1.5 py-0.5 rounded text-[10px]">Critical</span>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-28 shrink-0">Agent proposed</span>
                  <span className="font-mono text-[12px] text-muted-foreground bg-muted/20 px-2 py-1 rounded flex-1">{field.agent_value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-28 shrink-0" style={{ color: isModified ? 'var(--color-lg-accent)' : 'var(--color-muted-foreground)' }}>
                    {isModified ? 'Your value' : 'Your value'}
                  </span>
                  <input
                    className="flex-1 h-8 rounded border bg-background text-[12px] px-2 font-mono focus:outline-none focus:ring-1"
                    style={{
                      borderColor: isModified ? 'var(--color-lg-accent)' : 'var(--color-lg-border)',
                      '--tw-ring-color': 'var(--color-lg-accent)',
                    } as React.CSSProperties}
                    value={values[field.field_name]}
                    onChange={e => setValues(v => ({ ...v, [field.field_name]: e.target.value }))}
                  />
                  {isModified && (
                    <button className="text-[10px] shrink-0" style={{ color: 'var(--color-lg-accent)' }}
                      onClick={() => setValues(v => ({ ...v, [field.field_name]: field.agent_value }))}>
                      Accept Agent Value
                    </button>
                  )}
                </div>
                {isCritical && isModified && (
                  <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: 'var(--color-lg-warning)' }}>
                    <input type="checkbox"
                      checked={criticalConfirmed.has(field.field_name)}
                      onChange={e => {
                        setCriticalConfirmed(prev => {
                          const n = new Set(prev);
                          if (e.target.checked) n.add(field.field_name); else n.delete(field.field_name);
                          return n;
                        });
                      }}
                    />
                    I confirm this change to a critical field
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rationale */}
      <div className="px-5 pb-4 flex flex-col gap-2">
        <label className="text-[12px] font-semibold text-foreground">
          Modification Rationale <span style={{ color: 'var(--color-lg-error)' }}>*</span>
        </label>
        <textarea
          className="w-full h-20 rounded-lg border border-border bg-background text-[12px] px-3 py-2 resize-none focus:outline-none"
          placeholder="Explain why you are modifying the agent's values (min 10 characters)..."
          value={rationale}
          onChange={e => setRationale(e.target.value)}
        />
        {modifiedFields.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{modifiedFields.length} field{modifiedFields.length !== 1 ? 's' : ''} modified</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-border">
        <Button className="h-9 text-[12px]" disabled={!canSubmit} onClick={handleSubmit}>
          Submit Modified Values
        </Button>
        <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
