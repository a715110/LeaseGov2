/**
 * PipelineNewRecordModal — FC-1 Screen 1.3
 * Screen key: pipeline-new-record-modal
 * Route: /pipeline/new-record
 * Role: Document Submitter
 *
 * Design: Structured Authority
 * Prompt 1.3: Modal dialog (500px) for creating a new contract record.
 * Data model refs: ContractRecord (record_label, contract_type, property_address,
 *                  counterparty_name, workspace_tag_id)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Info, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { ACTIVE_CONTRACT_TYPES, CONTRACT_TYPE_LABELS, PHASE_2_CONTRACT_TYPES } from '@/constants/contractTypes';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// ─── Mock workspace tags — TODO: Backend integration required ─────────────────
const WORKSPACE_TAGS = [
  'Q1-2026-Retail',
  'Q1-2026-Office',
  'Q1-2026-Industrial',
  'Q2-2026-Land',
];

export default function PipelineNewRecordModal() {
  const _screenKey = SCREEN_KEYS.PIPELINE_NEW_RECORD_MODAL;

  const [, navigate] = useLocation();
  const [recordLabel, setRecordLabel] = useState('');
  const [contractType, setContractType] = useState('PROPERTY_LEASE');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [workspaceTag] = useState('Q1-2026-Retail'); // read-only — set from upload context

  const canCreate = recordLabel.trim().length > 0;

  function handleCreate() {
    if (!canCreate) return;
    // TODO: Backend integration required — POST /api/contract-records
    navigate('/pipeline/upload');
  }

  return (
    <div className="min-h-screen bg-[var(--color-lg-page-bg)] flex items-center justify-center p-6">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={() => navigate('/pipeline/upload')} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[500px] rounded-xl bg-card border border-border shadow-xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-[18px] font-semibold text-foreground">Create New Contract Record</h2>
          <button
            onClick={() => navigate('/pipeline/upload')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Info callout */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-accent border border-border text-[13px] text-accent-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong>Basic identification only.</strong> Full details are populated automatically during extraction.
            </span>
          </div>

          {/* Record Label */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">
              Record Label <span className="text-destructive">*</span>
            </label>
            <Input
              value={recordLabel}
              onChange={e => setRecordLabel(e.target.value)}
              placeholder="e.g. Retail HQ Lease — Chicago 2026"
              className="h-10 text-[13px]"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">A short, descriptive name for this contract record.</p>
          </div>

          {/* Contract Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">Contract Type</label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="h-10 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_CONTRACT_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="text-[13px]">
                    {CONTRACT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  {PHASE_2_CONTRACT_TYPES.map(type => (
                    <div
                      key={type}
                      className="flex items-center justify-between px-2 py-1.5 text-[13px] text-muted-foreground cursor-not-allowed"
                    >
                      <span>{CONTRACT_TYPE_LABELS[type]}</span>
                      <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-medium">Future</span>
                    </div>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Property Address (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">
              Property Address <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={propertyAddress}
              onChange={e => setPropertyAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Chicago, IL 60601"
              className="h-10 text-[13px]"
            />
          </div>

          {/* Counterparty Name (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">
              Counterparty Name <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={counterpartyName}
              onChange={e => setCounterpartyName(e.target.value)}
              placeholder="e.g. Acme Properties LLC"
              className="h-10 text-[13px]"
            />
          </div>

          {/* Workspace Tag (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              Workspace Tag
              <Lock className="w-3 h-3 text-muted-foreground" />
            </label>
            <div className="h-10 px-3 flex items-center rounded border border-border bg-muted/40 text-[13px] text-muted-foreground">
              {workspaceTag}
            </div>
            <p className="text-[11px] text-muted-foreground">Inherited from the upload context. Change on the upload screen.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" onClick={() => navigate('/pipeline/upload')}>Cancel</Button>
          <Button
            disabled={!canCreate}
            onClick={handleCreate}
            title={!canCreate ? 'Record Label is required.' : undefined}
          >
            Create Record
          </Button>
        </div>
      </div>
    </div>
  );
}
