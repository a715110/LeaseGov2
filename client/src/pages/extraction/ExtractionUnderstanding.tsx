/**
 * ExtractionUnderstanding — FC-2 Screen 2.2
 * Screen key: extraction-document-understanding
 * Route: /extraction/understanding
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.2: Document classification and record association.
 *   Workspace Tag (confirmed), Contract Record typeahead (Select Existing /
 *   Create New / Defer), Contract Type auto-detected, Document Role
 *   auto-detected, OCR quality banner, Confirm and Proceed.
 * Data model refs: StagedDocument (workspace_tag_id), ContractRecord,
 *                  DocumentJob (contract_type_detected, document_role_detected,
 *                  ocr_confidence_avg)
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  CheckCircle2, AlertTriangle, Search, Tag, FileText,
  Plus, Clock, ChevronRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SCREEN_KEYS } from '@/constants/screenKeys';

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Mock data — TODO: Backend integration required ───────────────────────────

const MOCK_SEARCH_RESULTS = [
  { id: 'cr1', label: 'Retail HQ Lease — Chicago 2026', type: 'Property Lease', status: 'draft' },
  { id: 'cr2', label: 'Office Tower Lease — NYC 2025', type: 'Property Lease', status: 'active' },
  { id: 'cr3', label: 'Warehouse Complex — Dallas 2024', type: 'Property Lease', status: 'active' },
];

type RecordAction = 'select' | 'create' | 'defer';

export default function ExtractionUnderstanding() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_UNDERSTANDING;
  const [, navigate] = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<typeof MOCK_SEARCH_RESULTS[0] | null>(null);
  const [recordAction, setRecordAction] = useState<RecordAction>('select');
  const [contractType] = useState({ value: 'PROPERTY_LEASE', label: 'Property Lease', confidence: 0.94 });
  const [documentRole, setDocumentRole] = useState({ value: 'amendment', label: 'Amendment', confidence: 0.72 });

  const canProceed = recordAction === 'defer' || selectedRecord !== null;

  function handleSelectRecord(record: typeof MOCK_SEARCH_RESULTS[0]) {
    setSelectedRecord(record);
    setSearchQuery(record.label);
    setShowResults(false);
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Document Understanding</h1>
            <ScreenNumberBadge screenKey="extraction-document-understanding" />
          </div>
          <p className="page-subtitle">Classify document and associate with a contract record.</p>
        </div>
      </div>

      {/* OCR quality banner */}
      <div className="mx-6 mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>OCR Quality Warning:</strong> Pages 5–6 have confidence below 80% (68% avg).
          Extraction may require manual correction on those pages.
        </span>
      </div>

      <div className="flex gap-6 p-6">
        {/* Left: Classification form */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Workspace Tag */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Workspace Tag
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-valid">
                <CheckCircle2 className="w-3 h-3" /> Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-foreground">Q1-2026-Retail</span>
              <button className="text-[13px] text-primary hover:underline">Change</button>
            </div>
          </div>

          {/* Contract Record */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              Contract Record
            </h2>

            {/* Action selector */}
            <div className="flex items-center gap-2 mb-4">
              {(['select', 'create', 'defer'] as RecordAction[]).map(action => (
                <button
                  key={action}
                  onClick={() => setRecordAction(action)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium border transition-colors ${
                    recordAction === action
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {action === 'select' && <Search className="w-3.5 h-3.5" />}
                  {action === 'create' && <Plus className="w-3.5 h-3.5" />}
                  {action === 'defer'  && <Clock className="w-3.5 h-3.5" />}
                  {action === 'select' ? 'Select Existing' : action === 'create' ? 'Create New' : 'Defer'}
                </button>
              ))}
            </div>

            {recordAction === 'select' && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowResults(true); setSelectedRecord(null); }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search contract records..."
                    className="pl-9 h-10 text-[13px]"
                  />
                </div>
                {showResults && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg bg-card border border-border shadow-lg overflow-hidden">
                    {MOCK_SEARCH_RESULTS.filter(r =>
                      r.label.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectRecord(result)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors"
                      >
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{result.label}</p>
                          <p className="text-[11px] text-muted-foreground">{result.type}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${result.status === 'draft' ? 'badge-uploaded' : 'badge-valid'}`}>
                          {result.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedRecord && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded bg-accent border border-border text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-lg-success)] shrink-0" />
                    <span className="font-medium text-foreground">{selectedRecord.label}</span>
                  </div>
                )}
              </div>
            )}

            {recordAction === 'create' && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-accent border border-border text-[13px] text-accent-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>A new contract record will be created during extraction. You can set the record label in the next step.</span>
              </div>
            )}

            {recordAction === 'defer' && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-800">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Record association will be deferred. The document will be extracted without a linked contract record and must be associated before approval.</span>
              </div>
            )}
          </div>

          {/* Contract Type */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">Contract Type</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-medium text-foreground">{contractType.label}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold confidence-high">
                  {Math.round(contractType.confidence * 100)}% confidence
                </span>
                <span className="text-[12px] text-muted-foreground">Auto-detected</span>
              </div>
              <button className="text-[13px] text-primary hover:underline">Override</button>
            </div>
          </div>

          {/* Document Role */}
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <h2 className="text-[14px] font-semibold text-foreground mb-3">Document Role</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-medium text-foreground">{documentRole.label}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold confidence-medium">
                  {Math.round(documentRole.confidence * 100)}% confidence
                </span>
                <span className="text-[12px] text-muted-foreground">Auto-detected</span>
              </div>
              <Select
                value={documentRole.value}
                onValueChange={v => setDocumentRole({
                  value: v,
                  label: { base_contract:'Base Contract', amendment:'Amendment', addendum:'Addendum', exhibit:'Exhibit', schedule:'Schedule', notice:'Notice', supporting:'Supporting' }[v] || v,
                  confidence: documentRole.confidence,
                })}
              >
                <SelectTrigger className="h-8 w-36 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['base_contract','amendment','addendum','exhibit','schedule','notice','supporting'].map(role => (
                    <SelectItem key={role} value={role} className="text-[13px]">
                      {role.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right: Summary panel */}
        <div className="w-72 flex flex-col gap-4">
          <div className="rounded-lg bg-card border border-border shadow-sm px-5 py-4">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">
              Document
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">Office-Tower-Amendment-3.pdf</p>
                <p className="text-[11px] text-muted-foreground">1.8 MB · 8 pages · PDF</p>
              </div>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">OCR Avg</span>
                <span className="font-semibold confidence-medium px-2 py-0.5 rounded text-[11px]">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch</span>
                <span className="font-mono text-[12px] text-primary">BATCH-2026-0042</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Job ID</span>
                <span className="font-mono text-[12px] text-primary">JOB-2026-0442</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {!canProceed ? 'Select a contract record or choose Defer to continue.' : 'Ready to proceed to extraction strategy.'}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/extraction/queue')}>Back</Button>
          <Button
            disabled={!canProceed}
            onClick={() => navigate('/extraction/strategy')}
            className="gap-2"
          >
            Confirm and Proceed
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
