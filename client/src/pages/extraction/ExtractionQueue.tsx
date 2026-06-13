/**
 * ExtractionQueue — FC-2 Screen 2.1
 * Screen key: extraction-processing-queue
 * Route: /extraction/queue
 * Role: Preparer
 *
 * Design: Structured Authority
 * S4: ClassificationDialog + FieldMappingDialog as inline dialogs (InlineDialog pattern, 95vw×100vh)
 * S5a: Template selector in FieldMappingDialog
 * S5b: Auto-suggest template from filename
 * S5c: AddFieldDialog (560px, shadcn Dialog)
 * S5d: Confirm Mapping button
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw, ChevronRight, BarChart2, X, Clock,
  CheckCircle2, AlertTriangle, XCircle, Cpu, User,
  Settings, Info, CheckCheck, Plus, Trash2, GripVertical,
  ArrowLeft, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation, useSearch } from 'wouter';
import { ProcessingWorkflowDialog } from '@/components/extraction/ProcessingWorkflowDialog';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { InlineDialog } from '@/components/shared/InlineDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { subscribeToEvents, publishEvent } from '@/lib/eventBus';

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = 'processing' | 'ocr_complete' | 'warning' | 'failed' | 'ocr_queued' | 'declined';
type AgentStatus = 'queued' | 'active' | 'complete' | 'awaiting_checkpoint';

interface ProcessingJob {
  id: string;
  display_id: string;
  file_name: string;
  batch_ref: string;
  status: JobStatus;
  ocr_confidence: number;
  started: string;
  duration: string;
  assigned: string;
  agent_status: AgentStatus;
  extraction_mode: 'ai_assisted' | 'manual' | 'hybrid';
  pages: { page: number; confidence: number }[];
  log: { time: string; message: string; level: 'info' | 'warn' | 'error' }[];
}

interface ExtractionTemplateField {
  id: string;
  canonical_name: string;
  data_type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  category: 'Financial' | 'Legal' | 'Party' | 'Date' | 'Property' | 'Other';
  validation_rule: string;
  is_critical: boolean;
  is_required: boolean;
  status: 'Active' | 'Inactive' | 'Draft';
  aliases: string[];
}

interface ExtractionTemplate {
  id: string;
  name: string;
  version: string;
  description: string;
  field_count: number;
  fields: ExtractionTemplateField[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: ProcessingJob[] = [
  {
    id: 'j1', display_id: 'JOB-2026-0441',
    file_name: 'Retail-HQ-Lease-2026.pdf', batch_ref: 'BATCH-2026-0042',
    status: 'ocr_complete', ocr_confidence: 0.94,
    started: '09:14', duration: '1m 22s', assigned: 'J. Martinez',
    agent_status: 'complete', extraction_mode: 'ai_assisted',
    pages: [
      {page:1,confidence:0.97},{page:2,confidence:0.95},{page:3,confidence:0.93},
      {page:4,confidence:0.91},{page:5,confidence:0.94},{page:6,confidence:0.96},
      {page:7,confidence:0.92},{page:8,confidence:0.95},
    ],
    log: [
      {time:'09:14:02',message:'Job created, queued for OCR',level:'info'},
      {time:'09:14:05',message:'OCR engine started (Tesseract v5)',level:'info'},
      {time:'09:15:18',message:'OCR complete — 8 pages, avg confidence 94%',level:'info'},
      {time:'09:15:20',message:'AI extraction queued',level:'info'},
      {time:'09:15:24',message:'AI extraction complete — 68/73 fields extracted',level:'info'},
    ],
  },
  {
    id: 'j2', display_id: 'JOB-2026-0442',
    file_name: 'Office-Tower-Amendment-3.pdf', batch_ref: 'BATCH-2026-0042',
    status: 'processing', ocr_confidence: 0.68,
    started: '09:18', duration: '0m 44s', assigned: 'J. Martinez',
    agent_status: 'active', extraction_mode: 'ai_assisted',
    pages: [
      {page:1,confidence:0.91},{page:2,confidence:0.88},{page:3,confidence:0.75},
      {page:4,confidence:0.62},{page:5,confidence:0.55},{page:6,confidence:0.48},
    ],
    log: [
      {time:'09:18:00',message:'Job created, queued for OCR',level:'info'},
      {time:'09:18:03',message:'OCR engine started',level:'info'},
      {time:'09:18:47',message:'OCR complete — 6 pages, avg confidence 68%',level:'warn'},
      {time:'09:18:49',message:'Warning: pages 5-6 below confidence threshold',level:'warn'},
    ],
  },
  {
    id: 'j3', display_id: 'JOB-2026-0443',
    file_name: 'Warehouse-Lease-Exhibit-A.tiff', batch_ref: 'BATCH-2026-0042',
    status: 'ocr_complete', ocr_confidence: 0.91,
    started: '09:10', duration: '2m 05s', assigned: 'A. Chen',
    agent_status: 'awaiting_checkpoint', extraction_mode: 'hybrid',
    pages: [
      {page:1,confidence:0.93},{page:2,confidence:0.90},{page:3,confidence:0.88},
      {page:4,confidence:0.92},{page:5,confidence:0.91},
    ],
    log: [
      {time:'09:10:00',message:'Job created',level:'info'},
      {time:'09:11:55',message:'OCR complete — 5 pages, avg 91%',level:'info'},
      {time:'09:12:00',message:'AI extraction complete — checkpoint required',level:'warn'},
    ],
  },
  {
    id: 'j4', display_id: 'JOB-2026-0440',
    file_name: 'Corrupted-Scan-Draft.pdf', batch_ref: 'BATCH-2026-0041',
    status: 'failed', ocr_confidence: 0.12,
    started: '08:42', duration: '0m 18s', assigned: 'A. Chen',
    agent_status: 'queued', extraction_mode: 'manual',
    pages: [{page:1,confidence:0.12}],
    log: [
      {time:'08:42:00',message:'Job created',level:'info'},
      {time:'08:42:18',message:'OCR failed — corrupted PDF header',level:'error'},
    ],
  },
  {
    id: 'j5', display_id: 'JOB-2026-0439',
    file_name: 'Ground-Lease-Base-Contract.pdf', batch_ref: 'BATCH-2026-0041',
    status: 'ocr_complete', ocr_confidence: 0.97,
    started: '08:30', duration: '3m 12s', assigned: 'S. Patel',
    agent_status: 'complete', extraction_mode: 'ai_assisted',
    pages: [
      {page:1,confidence:0.98},{page:2,confidence:0.97},{page:3,confidence:0.96},
      {page:4,confidence:0.97},{page:5,confidence:0.98},
    ],
    log: [
      {time:'08:30:00',message:'Job created',level:'info'},
      {time:'08:33:12',message:'OCR complete — 5 pages, avg 97%',level:'info'},
      {time:'08:33:15',message:'AI extraction complete — 73/73 fields',level:'info'},
    ],
  },
];

// S5a: 5 mock templates
const MOCK_TEMPLATES: ExtractionTemplate[] = [
  {
    id: 't1', name: 'Standard Commercial Lease', version: 'v3.2',
    description: 'Full commercial lease with all standard clauses and financial terms.',
    field_count: 73,
    fields: [
      { id: 'f1', canonical_name: 'lease_commencement_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['start_date', 'commencement'] },
      { id: 'f2', canonical_name: 'lease_expiration_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['end_date', 'expiry'] },
      { id: 'f3', canonical_name: 'base_rent_monthly', data_type: 'currency', category: 'Financial', validation_rule: 'positive_number', is_critical: true, is_required: true, status: 'Active', aliases: ['monthly_rent', 'base_rent'] },
      { id: 'f4', canonical_name: 'tenant_legal_name', data_type: 'string', category: 'Party', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['tenant_name', 'lessee'] },
      { id: 'f5', canonical_name: 'landlord_legal_name', data_type: 'string', category: 'Party', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['landlord_name', 'lessor'] },
      { id: 'f6', canonical_name: 'premises_address', data_type: 'string', category: 'Property', validation_rule: 'required', is_critical: false, is_required: true, status: 'Active', aliases: ['property_address', 'location'] },
      { id: 'f7', canonical_name: 'rentable_area_sqft', data_type: 'number', category: 'Property', validation_rule: 'positive_number', is_critical: false, is_required: true, status: 'Active', aliases: ['area', 'sqft', 'square_feet'] },
      { id: 'f8', canonical_name: 'security_deposit', data_type: 'currency', category: 'Financial', validation_rule: 'non_negative', is_critical: false, is_required: false, status: 'Active', aliases: ['deposit'] },
    ],
  },
  {
    id: 't2', name: 'Lease Amendment', version: 'v2.1',
    description: 'Amendment to an existing lease agreement.',
    field_count: 28,
    fields: [
      { id: 'f1', canonical_name: 'amendment_effective_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['effective_date'] },
      { id: 'f2', canonical_name: 'original_lease_reference', data_type: 'string', category: 'Legal', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['lease_ref', 'original_ref'] },
      { id: 'f3', canonical_name: 'amended_rent_amount', data_type: 'currency', category: 'Financial', validation_rule: 'positive_number', is_critical: true, is_required: false, status: 'Active', aliases: ['new_rent', 'revised_rent'] },
      { id: 'f4', canonical_name: 'amendment_description', data_type: 'string', category: 'Legal', validation_rule: 'required', is_critical: false, is_required: true, status: 'Active', aliases: ['changes', 'modifications'] },
    ],
  },
  {
    id: 't3', name: 'Sublease Agreement', version: 'v1.4',
    description: 'Sublease from original tenant to subtenant.',
    field_count: 45,
    fields: [
      { id: 'f1', canonical_name: 'sublease_commencement_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['sublease_start'] },
      { id: 'f2', canonical_name: 'subtenant_legal_name', data_type: 'string', category: 'Party', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['subtenant', 'sub_lessee'] },
      { id: 'f3', canonical_name: 'sublease_rent', data_type: 'currency', category: 'Financial', validation_rule: 'positive_number', is_critical: true, is_required: true, status: 'Active', aliases: ['sub_rent'] },
    ],
  },
  {
    id: 't4', name: 'Lease Renewal', version: 'v2.0',
    description: 'Renewal option exercise or automatic renewal terms.',
    field_count: 32,
    fields: [
      { id: 'f1', canonical_name: 'renewal_term_months', data_type: 'number', category: 'Date', validation_rule: 'positive_integer', is_critical: true, is_required: true, status: 'Active', aliases: ['renewal_period', 'term_months'] },
      { id: 'f2', canonical_name: 'renewal_rent_amount', data_type: 'currency', category: 'Financial', validation_rule: 'positive_number', is_critical: true, is_required: true, status: 'Active', aliases: ['new_rent', 'renewal_rent'] },
      { id: 'f3', canonical_name: 'renewal_exercise_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: false, is_required: true, status: 'Active', aliases: ['exercise_date', 'option_date'] },
    ],
  },
  {
    id: 't5', name: 'Termination Agreement', version: 'v1.1',
    description: 'Early termination or mutual surrender agreement.',
    field_count: 22,
    fields: [
      { id: 'f1', canonical_name: 'termination_effective_date', data_type: 'date', category: 'Date', validation_rule: 'required', is_critical: true, is_required: true, status: 'Active', aliases: ['termination_date', 'surrender_date'] },
      { id: 'f2', canonical_name: 'termination_fee', data_type: 'currency', category: 'Financial', validation_rule: 'non_negative', is_critical: true, is_required: false, status: 'Active', aliases: ['break_fee', 'surrender_fee'] },
      { id: 'f3', canonical_name: 'termination_reason', data_type: 'string', category: 'Legal', validation_rule: 'required', is_critical: false, is_required: true, status: 'Active', aliases: ['reason', 'grounds'] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all',          label: 'All',          count: 15 },
  { key: 'processing',   label: 'Processing',   count: 3 },
  { key: 'ocr_complete', label: 'OCR Complete', count: 8 },
  { key: 'warning',      label: 'Warning',      count: 2 },
  { key: 'failed',       label: 'Failed',       count: 1 },
];

const STATUS_BADGE: Record<JobStatus, string> = {
  processing:   'badge-processing',
  ocr_complete: 'badge-valid',
  ocr_queued:   'badge-processing',
  warning:      'badge-warning',
  failed:       'badge-invalid',
  declined:     'badge-invalid',
};
const STATUS_LABEL: Record<JobStatus, string> = {
  processing: 'Processing', ocr_complete: 'OCR Complete', ocr_queued: 'OCR Queued',
  warning: 'Warning', failed: 'Failed', declined: 'Declined',
};

function getConfidenceClass(c: number) {
  if (c >= 0.90) return 'confidence-high';
  if (c >= 0.60) return 'confidence-medium';
  return 'confidence-low';
}
function getBarColor(c: number) {
  if (c >= 0.90) return 'var(--color-lg-success)';
  if (c >= 0.60) return 'var(--color-lg-warning)';
  return 'var(--color-lg-error)';
}

// S5b: auto-suggest template from filename
function suggestTemplate(filename: string): ExtractionTemplate | null {
  const lower = filename.toLowerCase();
  if (lower.includes('amendment')) return MOCK_TEMPLATES[1];
  if (lower.includes('sublease')) return MOCK_TEMPLATES[2];
  if (lower.includes('renewal')) return MOCK_TEMPLATES[3];
  if (lower.includes('termination')) return MOCK_TEMPLATES[4];
  return null;
}

function AgentBadge({ status }: { status: AgentStatus }) {
  const config = {
    queued:              { label: 'Queued',              cls: 'text-muted-foreground bg-muted border-border' },
    active:              { label: 'Active',              cls: 'badge-processing' },
    complete:            { label: 'Complete',            cls: 'badge-valid' },
    awaiting_checkpoint: { label: 'Awaiting Checkpoint', cls: 'badge-warning' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${config.cls}`}>
      {status === 'active' && <RefreshCw className="w-3 h-3 animate-spin" />}
      {config.label}
    </span>
  );
}

// ─── AddFieldDialog (S5c) ─────────────────────────────────────────────────────

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: ExtractionTemplateField) => void;
  existing?: ExtractionTemplateField | null;
  existingNames: string[];
}

function AddFieldDialog({ open, onClose, onSave, existing, existingNames }: AddFieldDialogProps) {
  const [canonicalName, setCanonicalName] = useState(existing?.canonical_name ?? '');
  const [dataType, setDataType] = useState<ExtractionTemplateField['data_type']>(existing?.data_type ?? 'string');
  const [category, setCategory] = useState<ExtractionTemplateField['category']>(existing?.category ?? 'Other');
  const [validationRule, setValidationRule] = useState(existing?.validation_rule ?? '');
  const [isCritical, setIsCritical] = useState(existing?.is_critical ?? false);
  const [isRequired, setIsRequired] = useState(existing?.is_required ?? false);
  const [status, setStatus] = useState<ExtractionTemplateField['status']>(existing?.status ?? 'Active');
  const [aliases, setAliases] = useState<string[]>(existing?.aliases ?? []);
  const [aliasInput, setAliasInput] = useState('');
  const [nameError, setNameError] = useState('');

  // auto-format to snake_case
  const handleNameChange = (val: string) => {
    const snake = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setCanonicalName(snake);
    if (existingNames.includes(snake) && snake !== existing?.canonical_name) {
      setNameError('This canonical name already exists');
    } else {
      setNameError('');
    }
  };

  const handleAddAlias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && aliasInput.trim()) {
      setAliases(prev => [...prev, aliasInput.trim()]);
      setAliasInput('');
    }
  };

  const handleSave = () => {
    if (!canonicalName || nameError) return;
    onSave({
      id: existing?.id ?? `f_${Date.now()}`,
      canonical_name: canonicalName,
      data_type: dataType,
      category,
      validation_rule: validationRule,
      is_critical: isCritical,
      is_required: isRequired,
      status,
      aliases,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Field' : 'Add Field'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label className="text-[12px] mb-1.5 block">Canonical Name</Label>
            <Input
              value={canonicalName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. lease_commencement_date"
              className="font-mono text-[13px]"
            />
            {nameError && <p className="text-[11px] text-destructive mt-1">{nameError}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">Auto-formatted to snake_case</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[12px] mb-1.5 block">Data Type</Label>
              <Select value={dataType} onValueChange={v => setDataType(v as ExtractionTemplateField['data_type'])}>
                <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['string','number','date','boolean','currency'] as const).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={v => setCategory(v as ExtractionTemplateField['category'])}>
                <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Financial','Legal','Party','Date','Property','Other'] as const).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[12px] mb-1.5 block">Validation Rule</Label>
            <Input value={validationRule} onChange={e => setValidationRule(e.target.value)} placeholder="e.g. required, positive_number" className="text-[13px]" />
          </div>
          <div>
            <Label className="text-[12px] mb-1.5 block">Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as ExtractionTemplateField['status'])}>
              <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Active','Inactive','Draft'] as const).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <Checkbox checked={isCritical} onCheckedChange={v => setIsCritical(!!v)} />
              Critical
            </label>
            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
              <Checkbox checked={isRequired} onCheckedChange={v => setIsRequired(!!v)} />
              Required
            </label>
          </div>
          <div>
            <Label className="text-[12px] mb-1.5 block">Aliases</Label>
            <Input
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={handleAddAlias}
              placeholder="Type alias + Enter to add"
              className="text-[13px] mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {aliases.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium">
                  {a}
                  <button onClick={() => setAliases(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canonicalName || !!nameError}>
            {existing ? 'Save Changes' : 'Add Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FieldMappingDialog (S5a-S5d) ─────────────────────────────────────────────

interface FieldMappingDialogProps {
  job: ProcessingJob | null;
  onClose: () => void;
  onConfirm: (template: ExtractionTemplate) => void;
}

function FieldMappingDialog({ job, onClose, onConfirm }: FieldMappingDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [fields, setFields] = useState<ExtractionTemplateField[]>([]);
  const [autoSuggested, setAutoSuggested] = useState<ExtractionTemplate | null>(null);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [editField, setEditField] = useState<ExtractionTemplateField | null>(null);

  // S5b: auto-suggest on open
  useEffect(() => {
    if (!job) return;
    setSelectedTemplateId('');
    setFields([]);
    setMappingConfirmed(false);
    const suggested = suggestTemplate(job.file_name);
    setAutoSuggested(suggested);
    if (suggested) {
      setSelectedTemplateId(suggested.id);
      setFields([...suggested.fields]);
    }
  }, [job]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setMappingConfirmed(false);
    const tmpl = MOCK_TEMPLATES.find(t => t.id === id);
    if (tmpl) setFields([...tmpl.fields]);
  };

  const selectedTemplate = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId) ?? null;
  const canConfirm = !!selectedTemplateId && !mappingConfirmed;

  const handleConfirmMapping = () => {
    if (!selectedTemplate) return;
    const activeCount = fields.filter(f => f.status === 'Active').length;
    const criticalCount = fields.filter(f => f.is_critical).length;
    toast.success(`Mapping confirmed — ${activeCount} active fields, ${criticalCount} critical fields`);
    setMappingConfirmed(true);
    onConfirm(selectedTemplate);
  };

  const handleAddField = (field: ExtractionTemplateField) => {
    if (editField) {
      setFields(prev => prev.map(f => f.id === editField.id ? field : f));
    } else {
      setFields(prev => [...prev, field]);
    }
    setEditField(null);
  };

  const handleDeleteField = (id: string) => {
    toast('Field deleted', { description: 'Field removed from mapping' });
    setFields(prev => prev.filter(f => f.id !== id));
  };

  return (
    <InlineDialog
      open={!!job}
      onClose={onClose}
      title={`Field Mapping Config — ${job?.display_id ?? ''}`}
      subtitle={job?.file_name}
      width="95vw"
      maxHeight="100vh"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              style={{ borderColor: 'var(--color-lg-success)', color: 'var(--color-lg-success)' }}
              disabled={!canConfirm}
              onClick={handleConfirmMapping}
            >
              <CheckCheck className="w-4 h-4" />
              Confirm Mapping
            </Button>
            <Button
              disabled={!mappingConfirmed}
              onClick={() => { if (selectedTemplate) onConfirm(selectedTemplate); onClose(); }}
            >
              Proceed to Extraction
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-6">
        {/* S5a: Template selector */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <Label className="text-[12px] mb-1.5 block font-semibold">Mapping Template</Label>
            {selectedTemplate && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
                {selectedTemplate.name} {selectedTemplate.version}
              </span>
            )}
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="text-[13px] w-full max-w-md">
                <SelectValue placeholder="Select a mapping template to begin" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground ml-2">{t.version} · {t.field_count} fields</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* S5b: auto-suggest banner */}
          {autoSuggested && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-[12px] text-amber-800 dark:text-amber-300 max-w-sm mt-5">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Template auto-suggested based on document name.{' '}
                <strong>{autoSuggested.name}</strong> — {autoSuggested.description}
              </span>
            </div>
          )}
          {!selectedTemplateId && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-5">
              <Settings className="w-4 h-4" />
              Select a mapping template to begin
            </div>
          )}
        </div>

        {/* Field table */}
        {fields.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-foreground">
                Fields ({fields.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-[12px]"
                onClick={() => { setEditField(null); setAddFieldOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Field
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left">Canonical Name</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Category</th>
                    <th className="text-left">Validation</th>
                    <th className="text-center">Critical</th>
                    <th className="text-center">Required</th>
                    <th className="text-left">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(field => (
                    <tr
                      key={field.id}
                      className="cursor-pointer hover:bg-accent/40"
                      onClick={() => { setEditField(field); setAddFieldOpen(true); }}
                    >
                      <td className="font-mono text-[11px] text-primary">{field.canonical_name}</td>
                      <td className="text-muted-foreground">{field.data_type}</td>
                      <td>
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                          {field.category}
                        </span>
                      </td>
                      <td className="text-muted-foreground font-mono text-[10px]">{field.validation_rule}</td>
                      <td className="text-center">
                        {field.is_critical && <CheckCircle2 className="w-3.5 h-3.5 text-destructive mx-auto" />}
                      </td>
                      <td className="text-center">
                        {field.is_required && <CheckCircle2 className="w-3.5 h-3.5 text-primary mx-auto" />}
                      </td>
                      <td>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                          field.status === 'Active' ? 'badge-valid' :
                          field.status === 'Draft' ? 'badge-warning' : 'badge-invalid'
                        )}>
                          {field.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedTemplateId && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Settings className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">Select a mapping template to begin</p>
            <p className="text-[12px] text-muted-foreground/70 mt-1">
              Choose a template from the dropdown above to load its field definitions
            </p>
          </div>
        )}
      </div>

      {/* S5c: AddFieldDialog */}
      <AddFieldDialog
        open={addFieldOpen}
        onClose={() => { setAddFieldOpen(false); setEditField(null); }}
        onSave={handleAddField}
        existing={editField}
        existingNames={fields.map(f => f.canonical_name).filter(n => n !== editField?.canonical_name)}
      />
    </InlineDialog>
  );
}

// ─── ClassificationDialog (S4) ────────────────────────────────────────────────

interface ClassificationDialogProps {
  job: ProcessingJob | null;
  onClose: () => void;
}

function ClassificationDialog({ job, onClose }: ClassificationDialogProps) {
  const [, navigate] = useLocation();
  const [contractType, setContractType] = useState('commercial_lease');
  const [documentRole, setDocumentRole] = useState('primary_lease');
  const [confidence, setConfidence] = useState(0.91);

  return (
    <InlineDialog
      open={!!job}
      onClose={onClose}
      title={`Document Classification — ${job?.display_id ?? ''}`}
      subtitle={job?.file_name}
      width="95vw"
      maxHeight="100vh"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <Button onClick={() => { onClose(); navigate('/extraction/strategy'); }}>
            Confirm Classification
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-6 max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-[14px] font-semibold text-foreground mb-4">AI Detection Results</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[12px] text-muted-foreground">Confidence:</span>
            <span className={cn(
              'px-2 py-0.5 rounded text-[12px] font-semibold',
              confidence >= 0.90 ? 'badge-valid' : confidence >= 0.60 ? 'badge-warning' : 'badge-invalid'
            )}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[12px] mb-1.5 block">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial_lease">Commercial Lease</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="sublease">Sublease</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="supporting">Supporting Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] mb-1.5 block">Document Role</Label>
              <Select value={documentRole} onValueChange={setDocumentRole}>
                <SelectTrigger className="text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary_lease">Primary Lease</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="sublease">Sublease</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="termination">Termination</SelectItem>
                  <SelectItem value="supporting">Supporting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">Document Preview</h3>
          <div className="h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-[13px]">
            PDF preview — {job?.file_name}
          </div>
        </div>
      </div>
    </InlineDialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExtractionQueue() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_QUEUE;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [jobs, setJobs] = useState<ProcessingJob[]>(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(MOCK_JOBS[0]);
  // Decline dialog state
  const [declineTarget, setDeclineTarget] = useState<ProcessingJob | null>(null);
  const [declineReasonCategory, setDeclineReasonCategory] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  // S4: inline dialog states
  const [classificationItem, setClassificationItem] = useState<ProcessingJob | null>(null);
  const [fieldMappingItem, setFieldMappingItem] = useState<ProcessingJob | null>(null);

  // S6a: ProcessingWorkflowDialog state
  const [workflowJob, setWorkflowJob] = useState<ProcessingJob | null>(null);
  const [workflowInitialStep, setWorkflowInitialStep] = useState(1);

  // S6a: re-open workflow dialog when returning from field mapping with ?from=workflow
  const search = useSearch();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const from = params.get('from');
    const jobId = params.get('jobId');
    if (from === 'workflow' && jobId) {
      const job = MOCK_JOBS.find(j => j.id === jobId || j.display_id === jobId);
      if (job) {
        setWorkflowJob(job);
        setWorkflowInitialStep(3); // re-open at Step 3 (AI Extract)
      }
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [search]);

  // DEMO ONLY: Wire BATCH_SUBMITTED → prepend new job to queue.
  // PRODUCTION: remove this block; replace with a real-time backend subscription
  // (WebSocket/SSE) or a polling query: useQuery(['extractionQueue'], api.get('/api/v1/extraction/queue'))
  useEffect(() => {
    const unsub = subscribeToEvents((event) => {
      if (event.type !== 'BATCH_SUBMITTED') return;
      const payload = event.payload as { batchId?: string; packageNum?: string };
      const newJob: ProcessingJob = {
        id: `job-${Date.now()}`,
        display_id: `DJ-${Math.floor(1000 + Math.random() * 9000)}`,
        file_name: payload.packageNum ?? 'Submitted Package',
        batch_ref: payload.batchId ?? '',
        status: 'ocr_queued',
        ocr_confidence: 0,
        started: new Date().toLocaleTimeString(),
        duration: '—',
        assigned: '—',
        agent_status: 'queued',
        extraction_mode: 'ai_assisted',
        pages: [],
        log: [{ time: new Date().toLocaleTimeString(), message: `Received from pipeline at ${new Date().toLocaleTimeString()}`, level: 'info' }],
      };
      setJobs(prev => [newJob, ...prev]);
    });
    return () => unsub();
  }, []);

  // Expandable batch rows — Set of batch_ref values that are currently expanded
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  function toggleBatch(batchRef: string) {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchRef)) next.delete(batchRef); else next.add(batchRef);
      return next;
    });
  }

  // TODO: Backend integration required — GET /api/document-jobs
  const filtered = activeTab === 'all'
    ? jobs
    : jobs.filter(j => j.status === activeTab);

  // Group filtered jobs by batch_ref for expandable batch rows
  const batchGroups = Array.from(
    filtered.reduce((map, job) => {
      const key = job.batch_ref || '__no_batch__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(job);
      return map;
    }, new Map<string, ProcessingJob[]>())
  ).map(([batchRef, batchJobs]) => ({ batchRef, jobs: batchJobs }));

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Processing Queue</h1>
            <ScreenNumberBadge screenKey="extraction-processing-queue" />
          </div>
          <p className="page-subtitle">Monitor document OCR and AI extraction jobs.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-border bg-card">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Table */}
        <div className={`flex-1 overflow-auto min-w-0 ${selectedJob ? '' : 'w-full'}`}>
          <table className="data-table w-full min-w-[900px] text-[13px]">
            <thead>
              <tr>
                <th className="text-left w-8"></th>{/* expand chevron */}
                <th className="text-left">Batch ID</th>
                <th className="text-left">Files</th>
                <th className="text-left">Status</th>
                <th className="text-left">OCR Confidence</th>
                <th className="text-left hidden xl:table-cell">Agent</th>
                <th className="text-left">Started</th>
                <th className="text-left hidden xl:table-cell">Duration</th>
                <th className="text-left hidden xl:table-cell">Assigned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batchGroups.map(group => {
                const batchExpanded = expandedBatches.has(group.batchRef);
                const TOTAL_EQ_COLS = 10;
                // Derive aggregate status: if any job is processing → processing, any failed → warning, else first job status
                const aggStatus: ProcessingJob['status'] = group.jobs.some(j => j.status === 'processing') ? 'processing'
                  : group.jobs.some(j => j.status === 'failed') ? 'failed'
                  : group.jobs.some(j => j.status === 'warning') ? 'warning'
                  : group.jobs[0]?.status ?? 'ocr_queued';
                const avgConf = group.jobs.length
                  ? group.jobs.reduce((s, j) => s + j.ocr_confidence, 0) / group.jobs.length
                  : 0;
                return (
                  <React.Fragment key={group.batchRef}>
                    {/* Batch summary row */}
                    <tr
                      className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                        batchExpanded ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => toggleBatch(group.batchRef)}
                    >
                      <td className="w-8 pr-0">
                        <span className="text-muted-foreground transition-transform duration-150 inline-block" style={{ transform: batchExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                      <td className="font-mono text-[12px] text-primary">{group.batchRef || '—'}</td>
                      <td>
                        <span className="text-[12px] text-foreground font-medium">{group.jobs.length} file{group.jobs.length !== 1 ? 's' : ''}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[aggStatus]}`}>
                          {aggStatus === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {STATUS_LABEL[aggStatus]}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getConfidenceClass(avgConf)}`}>
                          {Math.round(avgConf * 100)}%
                        </span>
                      </td>
                      <td className="hidden xl:table-cell"><AgentBadge status={group.jobs[0]?.agent_status ?? 'queued'} /></td>
                      <td className="font-mono text-[12px] text-muted-foreground">{group.jobs[0]?.started ?? '—'}</td>
                      <td className="text-muted-foreground hidden xl:table-cell">{group.jobs[0]?.duration ?? '—'}</td>
                      <td className="text-muted-foreground hidden xl:table-cell">{group.jobs[0]?.assigned ?? '—'}</td>
                      <td></td>
                    </tr>
                    {/* Expanded: individual job rows */}
                    {batchExpanded && group.jobs.map(job => (
                      <tr
                        key={job.id}
                        className={`bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer border-t border-border/30 ${
                          selectedJob?.id === job.id ? 'bg-accent/60' : ''
                        }`}
                        onClick={e => { e.stopPropagation(); setSelectedJob(job); }}
                      >
                        <td className="w-8"></td>{/* indent */}
                        <td className="font-mono text-[12px] text-muted-foreground pl-4">{job.display_id}</td>
                        <td>
                          <span className="font-medium text-foreground truncate max-w-[180px] block" title={job.file_name}>
                            {job.file_name}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[job.status]}`}>
                            {job.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {STATUS_LABEL[job.status]}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getConfidenceClass(job.ocr_confidence)}`}>
                            {Math.round(job.ocr_confidence * 100)}%
                          </span>
                        </td>
                        <td className="hidden xl:table-cell"><AgentBadge status={job.agent_status} /></td>
                        <td className="font-mono text-[12px] text-muted-foreground">{job.started}</td>
                        <td className="text-muted-foreground hidden xl:table-cell">{job.duration}</td>
                        <td className="text-muted-foreground hidden xl:table-cell">{job.assigned}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] gap-1"
                              onClick={e => { e.stopPropagation(); setClassificationItem(job); }}
                            >
                              Classify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] gap-1"
                              onClick={e => { e.stopPropagation(); setFieldMappingItem(job); }}
                            >
                              Map Fields
                            </Button>
                            {job.status !== 'declined' && (
                              <Button
                                size="sm"
                                className="h-7 text-[11px] gap-1"
                                onClick={e => { e.stopPropagation(); setWorkflowJob(job); setWorkflowInitialStep(1); }}
                              >
                                <Zap className="w-3 h-3" /> Process
                              </Button>
                            )}
                            {job.status !== 'declined' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                                onClick={e => { e.stopPropagation(); setDeclineTarget(job); setDeclineReasonCategory(''); setDeclineReason(''); }}
                              >
                                <XCircle className="w-3 h-3" /> Decline
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side panel */}
        {selectedJob && (
          <div className="w-[400px] border-l border-border bg-card flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-[14px] font-semibold text-foreground">{selectedJob.display_id}</p>
                <p className="text-[12px] text-muted-foreground truncate max-w-[280px]">{selectedJob.file_name}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OCR bar chart */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-primary" />
                <p className="text-[13px] font-semibold text-foreground">OCR Confidence per Page</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {selectedJob.pages.map(p => (
                  <div key={p.page} className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground w-10 shrink-0">Pg {p.page}</span>
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${p.confidence * 100}%`, backgroundColor: getBarColor(p.confidence) }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold w-10 text-right ${getConfidenceClass(p.confidence)} px-1.5 py-0.5 rounded`}>
                      {Math.round(p.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing log */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">
                Processing Log
              </p>
              <div className="flex flex-col gap-2">
                {selectedJob.log.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0 mt-0.5">{entry.time}</span>
                    <span className={
                      entry.level === 'error' ? 'text-destructive' :
                      entry.level === 'warn'  ? 'text-[var(--color-lg-warning)]' :
                      'text-foreground'
                    }>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full gap-2 text-[13px]"
                onClick={() => setFieldMappingItem(selectedJob)}
              >
                <Settings className="w-3.5 h-3.5" />
                Map Fields
              </Button>
              <Button
                className="w-full gap-2 text-[13px]"
                onClick={() => navigate('/extraction/understanding')}
              >
                Open in Workspace
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* S4: Inline dialogs — mounted at bottom of JSX */}
      <>
        <ClassificationDialog
          job={classificationItem}
          onClose={() => setClassificationItem(null)}
        />
        <FieldMappingDialog
          job={fieldMappingItem}
          onClose={() => setFieldMappingItem(null)}
          onConfirm={(_template) => {
            // TODO: Backend integration required — store confirmed template in ExtractionStoreContext
            setFieldMappingItem(null);
          }}
        />
        {/* S6a: ProcessingWorkflowDialog */}
        <ProcessingWorkflowDialog
          open={!!workflowJob}
          onClose={() => { setWorkflowJob(null); setWorkflowInitialStep(1); }}
          jobId={workflowJob?.display_id}
          fileName={workflowJob?.file_name}
          initialStep={workflowInitialStep}
        />
        {/* Decline dialog — V3 5a: reason dropdown + notes textarea */}
        <Dialog open={!!declineTarget} onOpenChange={v => { if (!v) { setDeclineTarget(null); setDeclineReasonCategory(''); setDeclineReason(''); } }}>
          <DialogContent className="max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Decline Submission</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">{declineTarget?.display_id}</span>
                {' · '}{declineTarget?.file_name}
              </div>
              <div>
                <Label className="text-[12px] mb-1.5 block font-medium">Decline Reason <span className="text-destructive">*</span></Label>
                <Select value={declineReasonCategory} onValueChange={setDeclineReasonCategory}>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Select a reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wrong_destination">Wrong destination record</SelectItem>
                    <SelectItem value="duplicate">Duplicate submission</SelectItem>
                    <SelectItem value="incorrect_type">Incorrect document type</SelectItem>
                    <SelectItem value="insufficient_context">Insufficient context</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] mb-1.5 block font-medium">Notes <span className="text-destructive">*</span></Label>
                <textarea
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="Provide additional context for the submitter…"
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                {declineReason.length > 0 && declineReason.length < 10 && (
                  <p className="text-[11px] text-destructive mt-1">Notes must be at least 10 characters.</p>
                )}
              </div>
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-300">
                Declining will return all documents in this submission to Staged Documents with their original validation status.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeclineTarget(null); setDeclineReasonCategory(''); setDeclineReason(''); }}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={!declineReasonCategory || declineReason.trim().length < 10}
                onClick={() => {
                  if (!declineTarget) return;
                  setJobs(prev => prev.map(j =>
                    j.id === declineTarget.id ? { ...j, status: 'declined' as JobStatus } : j
                  ));
                  if (selectedJob?.id === declineTarget.id) {
                    setSelectedJob(prev => prev ? { ...prev, status: 'declined' as JobStatus } : prev);
                  }
                  const reasonLabel: Record<string, string> = {
                    wrong_destination: 'Wrong destination record',
                    duplicate: 'Duplicate submission',
                    incorrect_type: 'Incorrect document type',
                    insufficient_context: 'Insufficient context',
                    other: 'Other',
                  };
                  // DEMO ONLY: Fire cross-role event so PipelineDashboard Table 3 updates.
                  // PRODUCTION: replace with: await api.post(`/api/v1/submissions/${declineTarget.batch_ref}/decline`, { reason, notes })
                  publishEvent({
                    type: 'DECLINE_SUBMITTED',
                    sourceRole: 'preparer',
                    payload: {
                      submissionId: declineTarget.display_id,
                      batchRef: declineTarget.batch_ref,
                      reasonCategory: declineReasonCategory,
                      reason: declineReason.trim(),
                      reasonLabel: reasonLabel[declineReasonCategory] ?? 'Other',
                    },
                  });
                  toast.error(`${declineTarget.display_id} declined — ${reasonLabel[declineReasonCategory]}`, {
                    description: 'Documents returned to Staged Documents with original status.',
                    duration: 6000,
                  });
                  setDeclineTarget(null);
                  setDeclineReasonCategory('');
                  setDeclineReason('');
                }}
              >
                Confirm Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
}
