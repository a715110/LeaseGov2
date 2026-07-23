/**
 * ProcessingWorkflowDialog — S6a / S6b
 * Component: components/extraction/ProcessingWorkflowDialog.tsx
 *
 * Multi-step processing workflow dialog:
 *   Step 1: Document Review
 *   Step 2: Field Mapping (S6b: stores confirmedTemplate) — grouped by contract type
 *   Step 3: AI Extract — contract-type-aware extraction log labels
 *   Step 4: Confidence Review — finance lease indicator card for equipment leases
 *   Step 5: Final Verification (S6b: uses confirmedTemplate canonical field names)
 *
 * S6a: accepts initialStep?: number prop (default 1)
 * S6b: confirmedTemplate state flows from Step 2 → Step 5
 *
 * Equipment Lease Prompt 2B:
 *   - Step 2: grouped template selector (Property Lease Documents / Equipment Lease Documents)
 *   - Step 3: equipment-specific extraction log labels when tpl-6 is confirmed
 *   - Step 4: finance lease indicator card (IFRS 16 classification) when tpl-6 is confirmed
 */

import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, CheckCircle2, Cpu, FileText,
  BarChart2, ShieldCheck, X, GripVertical, Zap, AlertTriangle, GitMerge,
  Package, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  MOCK_EXTRACTION_TEMPLATES,
  useExtractionStore,
  type ExtractionTemplate,
  type ClassificationResult,
} from '../../contexts/ExtractionStoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────
// ExtractionTemplate and ExtractionTemplateField are imported from ExtractionStoreContext
// (camelCase field names: canonicalName, dataType, isCritical, isRequired)

interface VerificationField {
  canonical_name: string;
  extracted_value: string;
  confidence: number;
  is_critical: boolean;
  status: 'Pending' | 'Verified' | 'Flagged';
}

interface ProcessingWorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  fileName?: string;
  /** S6a: initial step (1-based, default 1) */
  initialStep?: number;
  /** S6b: pre-confirmed template (passed when re-opening from queue) */
  preConfirmedTemplate?: ExtractionTemplate | null;
  /** Optional: all file names in the same batch, used for amendment detection */
  batchFiles?: string[];
  /** V3: submission_path from StagedDocument — 'existing_record' triggers comparison banner in Step 3 */
  submissionPath?: string;
  /** MOD-3: contract_type from upload context — used to auto-select a template in Step 2 */
  contractType?: string;
  /**
   * Called when the operator clicks Complete on step 5.
   * Receives the list of amendment file names detected in this job's batch
   * so the caller can forward them as navigation state to the AI Workspace.
   */
  onComplete?: (amendmentFiles: string[]) => void;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Document Review', icon: FileText },
  { id: 2, label: 'Map Fields',      icon: GripVertical },
  { id: 3, label: 'AI Extract',      icon: Cpu },
  { id: 4, label: 'Confidence',      icon: BarChart2 },
  { id: 5, label: 'Final Verify',    icon: ShieldCheck },
];

// ─── Template grouping ────────────────────────────────────────────────────────

const PROPERTY_TEMPLATE_IDS = new Set(['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4', 'tpl-5']);
const EQUIPMENT_TEMPLATE_IDS = new Set(['tpl-6']);

const PROPERTY_TEMPLATES = MOCK_EXTRACTION_TEMPLATES.filter(t => PROPERTY_TEMPLATE_IDS.has(t.id));
const EQUIPMENT_TEMPLATES = MOCK_EXTRACTION_TEMPLATES.filter(t => EQUIPMENT_TEMPLATE_IDS.has(t.id));

// ─── Confidence helpers ───────────────────────────────────────────────────────

function confidenceLabel(c: number) {
  if (c >= 0.90) return 'High';
  if (c >= 0.60) return 'Medium';
  return 'Low';
}
function confidenceClass(c: number) {
  if (c >= 0.90) return 'badge-valid';
  if (c >= 0.60) return 'badge-warning';
  return 'badge-invalid';
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Amendment detection helper ─────────────────────────────────────────────
/** Returns the list of amendment-like file names found in the current file or its batch siblings. */
function detectAmendmentFiles(fileName: string, batchFiles: string[]): string[] {
  const AMENDMENT_PATTERNS = /amend|amendment|addendum|addenda|rider|supplement|modification/i;
  const matched: string[] = [];
  if (AMENDMENT_PATTERNS.test(fileName)) matched.push(fileName);
  batchFiles.forEach(f => { if (AMENDMENT_PATTERNS.test(f)) matched.push(f); });
  return matched;
}

/** Inline banner shown at Steps 1, 2, and 5 when amendment files are present. */
function AmendmentBanner({ amendmentFiles, step }: { amendmentFiles: string[]; step: number }) {
  if (amendmentFiles.length === 0) return null;
  const fileList = amendmentFiles.join(', ');
  const stepMessages: Record<number, string> = {
    1: 'Review this document alongside the amendment before proceeding. Superseded clauses may not be visible in the base contract alone.',
    2: 'Select a template that covers amendment-specific fields (e.g. Amendment Effective Date, Rent Changed, Dates Changed). Do not use a base-lease-only template.',
    5: 'Verify rent, dates, and area fields against the amendment — these are the fields most commonly superseded. Flag any value that conflicts with the amendment text.',
  };
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-3.5 py-3">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
          Amendment detected — superseded fields require manual verification
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-medium">File{amendmentFiles.length > 1 ? 's' : ''}:</span>{' '}
          <span className="font-mono">{fileList}</span>
        </p>
        <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
          {stepMessages[step] ?? stepMessages[2]}
        </p>
      </div>
    </div>
  );
}

/** Grouped template selector row */
function TemplateCard({
  template,
  isSelected,
  isAutoSelected,
  onSelect,
}: {
  template: ExtractionTemplate;
  isSelected: boolean;
  isAutoSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">{template.name}</p>
            {isAutoSelected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                Auto-selected from upload context
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">{template.version} · {template.fields.length} fields</p>
        </div>
        {isSelected && (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        )}
      </div>
    </div>
  );
}

export function ProcessingWorkflowDialog({
  open,
  onClose,
  jobId = 'JOB-2026-0441',
  fileName = 'Retail-HQ-Lease-2026.pdf',
  initialStep = 1,
  preConfirmedTemplate = null,
  batchFiles = [],
  submissionPath,
  contractType,
  onComplete,
}: ProcessingWorkflowDialogProps) {
  const amendmentFiles = detectAmendmentFiles(fileName, batchFiles);
  const [currentStep, setCurrentStep] = useState(initialStep);
  // S6b: confirmed template flows from Step 2 → Step 5
  const extractionStore = useExtractionStore();
  const [confirmedTemplate, setConfirmedTemplate] = useState<ExtractionTemplate | null>(
    preConfirmedTemplate
  );
  // MOD-3: track whether the current template was auto-selected from contractType
  const [autoSelectedTemplateId, setAutoSelectedTemplateId] = useState<string | null>(null);
  // Step 5 verification state
  const [verificationFields, setVerificationFields] = useState<VerificationField[]>([]);

  // V3 Step 3 — single-pass extraction simulation state
  const [extractionStarted, setExtractionStarted] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionLabel, setExtractionLabel] = useState('Ready to extract');
  const [extractionJobStatus, setExtractionJobStatus] = useState('staged');
  const extractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived: is this an equipment lease extraction?
  const isEquipmentLease = confirmedTemplate?.id === 'tpl-6';

  // Reset extraction state when dialog opens/closes or step changes
  useEffect(() => {
    if (!open || currentStep !== 3) {
      setExtractionStarted(false);
      setExtractionComplete(false);
      setExtractionProgress(0);
      setExtractionLabel('Ready to extract');
      setExtractionJobStatus('staged');
      if (extractionTimerRef.current) clearTimeout(extractionTimerRef.current);
    }
  }, [open, currentStep]);

  const handleRunExtraction = () => {
    setExtractionStarted(true);
    setExtractionJobStatus('ocr_queued');
    setExtractionLabel('Preparing document…');
    setExtractionProgress(5);

    extractionTimerRef.current = setTimeout(() => {
      setExtractionJobStatus('ocr_processing');
      setExtractionLabel(isEquipmentLease ? 'Running OCR and reading asset schedules…' : 'Running OCR and reading document structure…');
      setExtractionProgress(20);
    }, 1000);

    extractionTimerRef.current = setTimeout(() => {
      setExtractionJobStatus('extraction_in_progress');
      setExtractionLabel(isEquipmentLease ? 'Extracting equipment identifiers and financial terms…' : 'Extracting fields and placing evidence anchors…');
      setExtractionProgress(55);
    }, 3000);

    extractionTimerRef.current = setTimeout(() => {
      setExtractionLabel(isEquipmentLease ? 'Scoring IFRS 16 classification indicators…' : 'Scoring confidence and checking critical fields…');
      setExtractionProgress(80);
    }, 6000);

    extractionTimerRef.current = setTimeout(() => {
      setExtractionJobStatus('verification_pending');
      const fieldCount = isEquipmentLease ? 41 : 68;
      setExtractionLabel(`Extraction complete — ${fieldCount} fields extracted`);
      setExtractionProgress(100);
      setExtractionComplete(true);
    }, 8000);
  };

  // Reset when dialog opens with a new initialStep
  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
      setConfirmedTemplate(preConfirmedTemplate);
      setAutoSelectedTemplateId(null);
    }
  }, [open, initialStep, preConfirmedTemplate]);

  // MOD-3: auto-select template from contractType on dialog open
  useEffect(() => {
    if (!open || !contractType || confirmedTemplate) return;
    const CONTRACT_TYPE_TO_TEMPLATE: Record<string, string> = {
      commercial_lease:  'tpl-1', // Property Lease v3.2
      lease_amendment:   'tpl-2', // Lease Amendment
      sublease:          'tpl-3', // Sublease Agreement
      lease_renewal:     'tpl-4', // Lease Renewal
      termination:       'tpl-5', // Termination Agreement
      equipment_lease:   'tpl-6', // Equipment Lease v1.0
      EQUIPMENT_LEASE:   'tpl-6', // Equipment Lease v1.0 (uppercase variant)
      // V3 upload context values
      'Property Lease':  'tpl-1',
      'Equipment Lease': 'tpl-6',
      'Service Contract':'tpl-1',
    };
    const templateId = CONTRACT_TYPE_TO_TEMPLATE[contractType];
    if (!templateId) return;
    const match = MOCK_EXTRACTION_TEMPLATES.find(t => t.id === templateId);
    if (!match) return;
    setConfirmedTemplate(match);
    extractionStore.setConfirmedTemplate(match);
    setAutoSelectedTemplateId(match.id);
  }, [open, contractType]); // eslint-disable-line react-hooks/exhaustive-deps

  // FC-2 Gap 3: seed classificationResult when dialog opens at Step 1.
  // Derives document type from fileName heuristics and stores it in the shared
  // ExtractionStoreContext so ExtractionVerification can display the badge.
  useEffect(() => {
    if (!open) return;
    const AMENDMENT_RE = /amend|amendment|addendum|rider|supplement|modification/i;
    const RENEWAL_RE   = /renew|renewal|extension/i;
    const SUBLEASE_RE  = /sublease|sub-lease|subtenant/i;
    const TERMINATION_RE = /terminat|surrender/i;
    const EQUIPMENT_RE = /equipment|asset|hardware|machinery|vehicle|device/i;
    let documentType = 'Commercial Lease';
    let confidence   = 0.91;
    let suggestedTemplateId = 'tpl-1';
    if (AMENDMENT_RE.test(fileName))    { documentType = 'Lease Amendment';      confidence = 0.94; suggestedTemplateId = 'tpl-2'; }
    else if (RENEWAL_RE.test(fileName)) { documentType = 'Lease Renewal';        confidence = 0.89; suggestedTemplateId = 'tpl-4'; }
    else if (SUBLEASE_RE.test(fileName)){ documentType = 'Sublease Agreement';   confidence = 0.87; suggestedTemplateId = 'tpl-3'; }
    else if (TERMINATION_RE.test(fileName)){ documentType = 'Termination Agreement'; confidence = 0.92; suggestedTemplateId = 'tpl-5'; }
    else if (EQUIPMENT_RE.test(fileName)){ documentType = 'Equipment Lease';     confidence = 0.93; suggestedTemplateId = 'tpl-6'; }
    // Also honour the contractType prop if present
    if (contractType === 'lease_amendment')   { documentType = 'Lease Amendment';      confidence = 0.96; suggestedTemplateId = 'tpl-2'; }
    else if (contractType === 'sublease')     { documentType = 'Sublease Agreement';   confidence = 0.95; suggestedTemplateId = 'tpl-3'; }
    else if (contractType === 'lease_renewal'){ documentType = 'Lease Renewal';        confidence = 0.94; suggestedTemplateId = 'tpl-4'; }
    else if (contractType === 'termination')  { documentType = 'Termination Agreement'; confidence = 0.95; suggestedTemplateId = 'tpl-5'; }
    else if (contractType === 'equipment_lease' || contractType === 'EQUIPMENT_LEASE' || contractType === 'Equipment Lease') {
      documentType = 'Equipment Lease'; confidence = 0.96; suggestedTemplateId = 'tpl-6';
    }
    const suggestedTemplate = MOCK_EXTRACTION_TEMPLATES.find(t => t.id === suggestedTemplateId) ?? null;
    const result: ClassificationResult = { documentType, confidence, suggestedTemplate: suggestedTemplate ?? undefined };
    extractionStore.setClassificationResult(result);
  }, [open, fileName, contractType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build verification fields from confirmed template (S6b)
  useEffect(() => {
    if (currentStep === 5 && confirmedTemplate) {
      setVerificationFields(
        confirmedTemplate.fields.map(f => ({
          canonical_name: f.canonicalName,
          extracted_value: f.dataType === 'date'       ? '2026-01-01'
                         : f.dataType === 'currency'   ? '$12,500.00'
                         : f.dataType === 'number'     ? '4,200'
                         : f.dataType === 'integer'    ? '36'
                         : f.dataType === 'percentage' ? '4.50%'
                         : f.dataType === 'decimal'    ? '0.045'
                         : f.dataType === 'boolean'    ? 'Yes'
                         : 'Extracted value placeholder',
          confidence: 0.85 + Math.random() * 0.14,
          is_critical: f.isCritical,
          status: 'Pending' as const,
        }))
      );
    }
  }, [currentStep, confirmedTemplate]);

  if (!open) return null;

  const canGoNext = currentStep < STEPS.length;
  const canGoPrev = currentStep > 1;

  // S6b: Complete button disabled until all critical fields verified
  const criticalFields = verificationFields.filter(f => f.is_critical);
  const allCriticalVerified = criticalFields.length > 0 && criticalFields.every(f => f.status === 'Verified');

  const handleVerifyField = (name: string) => {
    setVerificationFields(prev =>
      prev.map(f => f.canonical_name === name ? { ...f, status: 'Verified' } : f)
    );
  };

  const handleComplete = () => {
    toast.success('Processing workflow complete', {
      description: `${verificationFields.length} fields verified for ${jobId}`,
    });
    onComplete?.(amendmentFiles);
    onClose();
  };

  // ── Equipment lease extraction log steps ─────────────────────────────────
  const PROPERTY_EXTRACTION_STEPS = [
    { threshold: 5,   label: 'Preparing document…' },
    { threshold: 20,  label: 'Running OCR and reading document structure…' },
    { threshold: 55,  label: 'Extracting fields and placing evidence anchors…' },
    { threshold: 80,  label: 'Scoring confidence and checking critical fields…' },
    { threshold: 100, label: 'Extraction complete — 68 fields extracted' },
  ];
  const EQUIPMENT_EXTRACTION_STEPS = [
    { threshold: 5,   label: 'Preparing document…' },
    { threshold: 20,  label: 'Running OCR and reading asset schedules…' },
    { threshold: 45,  label: 'Extracting equipment identifiers and serial numbers…' },
    { threshold: 65,  label: 'Extracting financial terms and payment schedule…' },
    { threshold: 80,  label: 'Scoring IFRS 16 classification indicators…' },
    { threshold: 100, label: 'Extraction complete — 41 fields extracted' },
  ];
  const extractionSteps = isEquipmentLease ? EQUIPMENT_EXTRACTION_STEPS : PROPERTY_EXTRACTION_STEPS;

  // ── Equipment confidence counts (Step 4) ─────────────────────────────────
  const propertyConfidenceCounts = [
    { label: 'High Confidence', count: 58, cls: 'badge-valid' },
    { label: 'Medium Confidence', count: 10, cls: 'badge-warning' },
    { label: 'Low Confidence', count: 5, cls: 'badge-invalid' },
  ];
  const equipmentConfidenceCounts = [
    { label: 'High Confidence', count: 34, cls: 'badge-valid' },
    { label: 'Medium Confidence', count: 5, cls: 'badge-warning' },
    { label: 'Low Confidence', count: 2, cls: 'badge-invalid' },
  ];
  const confidenceCounts = isEquipmentLease ? equipmentConfidenceCounts : propertyConfidenceCounts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        style={{ width: 'min(860px, 95vw)', maxHeight: 'calc(100vh - 3rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Processing Workflow</p>
            <p className="text-[12px] text-muted-foreground font-mono">{jobId} · {fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex shrink-0 items-center gap-0 px-5 py-3 border-b border-border bg-muted/20 overflow-x-auto">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' :
                    isDone   ? 'text-primary hover:bg-primary/10' :
                               'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {step.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-foreground">Document Review</h3>
              <AmendmentBanner amendmentFiles={amendmentFiles} step={1} />
              <div className="rounded-lg border border-border bg-muted h-48 flex items-center justify-center text-muted-foreground text-[13px]">
                PDF preview — {fileName}
              </div>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-2">File Info</p>
                  <p className="text-foreground font-medium">{fileName}</p>
                  <p className="text-muted-foreground mt-1">Job: {jobId}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-2">OCR Status</p>
                  <span className="badge-valid px-2 py-0.5 rounded text-[11px] font-semibold">OCR Complete</span>
                  <p className="text-muted-foreground mt-1">Avg confidence: 94%</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-foreground">Map Fields</h3>
              {/* Amendment detection banner */}
              <AmendmentBanner amendmentFiles={amendmentFiles} step={2} />
              <p className="text-[13px] text-muted-foreground">
                Select the extraction template to use for this document.
              </p>

              {/* ── Property Lease Documents group ── */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Property Lease Documents
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {PROPERTY_TEMPLATES.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={confirmedTemplate?.id === template.id}
                    isAutoSelected={autoSelectedTemplateId === template.id}
                    onSelect={() => {
                      setConfirmedTemplate(template);
                      extractionStore.setConfirmedTemplate(template);
                    }}
                  />
                ))}
              </div>

              {/* ── Equipment Lease Documents group ── */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-3.5 h-3.5 text-teal-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-teal-600 dark:text-teal-400">
                    Equipment Lease Documents
                  </p>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {EQUIPMENT_TEMPLATES.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={confirmedTemplate?.id === template.id}
                    isAutoSelected={autoSelectedTemplateId === template.id}
                    onSelect={() => {
                      setConfirmedTemplate(template);
                      extractionStore.setConfirmedTemplate(template);
                    }}
                  />
                ))}
              </div>

              {confirmedTemplate && (
                <p className="text-[12px] text-primary font-medium">
                  ✓ {confirmedTemplate.name} confirmed — {confirmedTemplate.fields.length} fields will be used in Step 5.
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              {/* Amendment detection banner — shown when amendment-like files are in the batch */}
              <AmendmentBanner amendmentFiles={amendmentFiles} step={3} />
              {/* MOD-2: existing_record comparison banner */}
              {submissionPath === 'existing_record' && (
                <div className="flex items-start gap-2.5 rounded-lg border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-3">
                  <GitMerge className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">
                      Matched to existing record
                    </p>
                    <p className="text-[12px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      This document was matched to an existing record.
                      Verify extracted values against the existing approved record fields before running extraction.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">AI Extract</h3>
                <span className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-semibold',
                  extractionJobStatus === 'staged' ? 'badge-processing' :
                  extractionJobStatus === 'ocr_queued' ? 'badge-processing' :
                  extractionJobStatus === 'ocr_processing' ? 'badge-processing' :
                  extractionJobStatus === 'extraction_in_progress' ? 'badge-processing' :
                  extractionJobStatus === 'verification_pending' ? 'badge-valid' :
                  'badge-processing'
                )}>
                  {extractionJobStatus === 'staged' ? 'Pending' :
                   extractionJobStatus === 'ocr_queued' ? 'OCR Queued' :
                   extractionJobStatus === 'ocr_processing' ? 'OCR Processing' :
                   extractionJobStatus === 'extraction_in_progress' ? 'Extracting' :
                   extractionJobStatus === 'verification_pending' ? 'Complete' :
                   extractionJobStatus}
                </span>
              </div>

              {!extractionStarted && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[13px] text-muted-foreground text-center max-w-sm">
                    {isEquipmentLease
                      ? 'Single-pass OCR + extraction. The AI agent reads the asset schedules, extracts all 41 equipment lease fields, and scores IFRS 16 classification indicators in one pass (~8 seconds).'
                      : 'Single-pass OCR + extraction. The AI agent reads the document, extracts all fields, and places evidence anchors in one pass (~8 seconds).'}
                  </p>
                  <Button
                    className="gap-2"
                    onClick={handleRunExtraction}
                    disabled={!confirmedTemplate}
                  >
                    <Zap className="w-4 h-4" />
                    Run Extraction
                  </Button>
                  {!confirmedTemplate && (
                    <p className="text-[12px] text-amber-600 dark:text-amber-400">
                      Select a template in Step 2 before running extraction.
                    </p>
                  )}
                </div>
              )}

              {extractionStarted && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className={cn(
                        'text-foreground font-medium transition-all duration-300',
                        extractionComplete ? 'text-[var(--color-lg-success)]' : ''
                      )}>
                        {extractionLabel}
                      </span>
                      <span className="font-mono text-muted-foreground">{extractionProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${extractionProgress}%`,
                          backgroundColor: extractionComplete
                            ? 'var(--color-lg-success)'
                            : 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>

                  {/* V3 5b — progress label timeline (contract-type-aware) */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">Extraction Log</p>
                    <div className="flex flex-col gap-1.5">
                      {extractionSteps.map(step => (
                        <div
                          key={step.threshold}
                          className={cn(
                            'flex items-center gap-2 text-[12px] transition-opacity duration-300',
                            extractionProgress >= step.threshold ? 'opacity-100' : 'opacity-30'
                          )}
                        >
                          {extractionProgress >= step.threshold ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--color-lg-success)]" />
                          ) : (
                            <div className="w-3.5 h-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                          )}
                          <span className={extractionProgress >= step.threshold ? 'text-foreground' : 'text-muted-foreground'}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {extractionComplete && (
                    <div className="rounded-lg border border-[var(--color-lg-success)]/40 bg-[var(--color-lg-success)]/5 px-4 py-3 text-[13px] text-[var(--color-lg-success)] font-medium">
                      Extraction complete — proceed to Step 4 to review confidence scores.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-foreground">Confidence Review</h3>
              <div className="grid grid-cols-3 gap-3">
                {confidenceCounts.map(item => (
                  <div key={item.label} className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-[24px] font-bold text-foreground">{item.count}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-1 ${item.cls}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Finance Lease Indicator Card — only shown for Equipment Lease template */}
              {isEquipmentLease && (
                <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <p className="text-[13px] font-semibold text-teal-800 dark:text-teal-300">
                      IFRS 16 Classification Indicator
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/30 p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-1">Preliminary Classification</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-600">
                        Finance Lease
                      </span>
                    </div>
                    <div className="rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-teal-900/30 p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-1">Confidence</p>
                      <p className="text-[20px] font-bold text-teal-700 dark:text-teal-300">87%</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: 'Ownership transfer at end', value: 'Yes', met: true },
                      { label: 'Useful life coverage', value: '82%  (≥ 75% threshold)', met: true },
                      { label: 'PV as % of fair value', value: '91%  (≥ 90% threshold)', met: true },
                      { label: 'Purchase option reasonably certain', value: 'Not applicable', met: null },
                    ].map(indicator => (
                      <div key={indicator.label} className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">{indicator.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{indicator.value}</span>
                          {indicator.met === true && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          )}
                          {indicator.met === false && (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                          )}
                          {indicator.met === null && (
                            <div className="w-3.5 h-3.5 rounded-full bg-muted shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-3 leading-relaxed">
                    Preliminary classification based on extracted indicators. Final classification requires review by the accounting team in the Equipment Lease record.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">Final Verification</h3>
                {confirmedTemplate && (
                  <span className="text-[12px] text-muted-foreground">
                    Template: <strong>{confirmedTemplate.name}</strong>
                  </span>
                )}
              </div>
              <AmendmentBanner amendmentFiles={amendmentFiles} step={5} />
              {!confirmedTemplate ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-[13px] text-amber-800 dark:text-amber-300">
                  No template confirmed in Step 2. Go back to Step 2 to select a template.
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-muted-foreground">
                    Verify all critical fields before completing. Critical fields must be individually confirmed.
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="data-table w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left">Canonical Name</th>
                          <th className="text-left">Extracted Value</th>
                          <th className="text-left">Confidence</th>
                          <th className="text-left">Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationFields.map(field => (
                          <tr key={field.canonical_name} className={field.is_critical ? 'bg-destructive/5' : ''}>
                            <td>
                              <span className="font-mono text-[11px] text-primary">{field.canonical_name}</span>
                              {field.is_critical && (
                                <span className="ml-1.5 text-[10px] text-destructive font-semibold">CRITICAL</span>
                              )}
                            </td>
                            <td className="text-foreground">{field.extracted_value}</td>
                            <td>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${confidenceClass(field.confidence)}`}>
                                {confidenceLabel(field.confidence)} ({Math.round(field.confidence * 100)}%)
                              </span>
                            </td>
                            <td>
                              <span className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                field.status === 'Verified' ? 'badge-valid' :
                                field.status === 'Flagged'  ? 'badge-invalid' :
                                'badge-processing'
                              )}>
                                {field.status}
                              </span>
                            </td>
                            <td>
                              {field.status !== 'Verified' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => handleVerifyField(field.canonical_name)}
                                >
                                  Verify
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {criticalFields.length > 0 && (
                    <p className="text-[12px] text-muted-foreground">
                      {criticalFields.filter(f => f.status === 'Verified').length} / {criticalFields.length} critical fields verified
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <Button
            variant="outline"
            onClick={canGoPrev ? () => setCurrentStep(s => s - 1) : onClose}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {canGoPrev ? 'Back' : 'Cancel'}
          </Button>
          <div className="flex items-center gap-2">
            {currentStep === 5 ? (
              <Button
                onClick={handleComplete}
                disabled={!allCriticalVerified}
                className="gap-2"
                style={{ background: 'var(--color-lg-success)', color: '#fff' }}
              >
                <Zap className="w-4 h-4" />
                Complete
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={currentStep === 2 && !confirmedTemplate}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
