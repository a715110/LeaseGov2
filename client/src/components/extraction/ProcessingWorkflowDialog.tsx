/**
 * ProcessingWorkflowDialog — S6a / S6b
 * Component: components/extraction/ProcessingWorkflowDialog.tsx
 *
 * Multi-step processing workflow dialog:
 *   Step 1: Document Review
 *   Step 2: Field Mapping (S6b: stores confirmedTemplate)
 *   Step 3: AI Extract
 *   Step 4: Confidence Review
 *   Step 5: Final Verification (S6b: uses confirmedTemplate canonical field names)
 *
 * S6a: accepts initialStep?: number prop (default 1)
 * S6b: confirmedTemplate state flows from Step 2 → Step 5
 */

import { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, CheckCircle2, Cpu, FileText,
  BarChart2, ShieldCheck, X, GripVertical, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractionTemplateField {
  id: string;
  canonical_name: string;
  data_type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  category: string;
  is_critical: boolean;
  is_required: boolean;
}

interface ExtractionTemplate {
  id: string;
  name: string;
  version: string;
  fields: ExtractionTemplateField[];
}

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
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Document Review', icon: FileText },
  { id: 2, label: 'Map Fields',      icon: GripVertical },
  { id: 3, label: 'AI Extract',      icon: Cpu },
  { id: 4, label: 'Confidence',      icon: BarChart2 },
  { id: 5, label: 'Final Verify',    icon: ShieldCheck },
];

// ─── Mock template for demo ───────────────────────────────────────────────────

const DEMO_TEMPLATE: ExtractionTemplate = {
  id: 't1', name: 'Standard Commercial Lease', version: 'v3.2',
  fields: [
    { id: 'f1', canonical_name: 'lease_commencement_date', data_type: 'date',     category: 'Date',      is_critical: true,  is_required: true  },
    { id: 'f2', canonical_name: 'lease_expiration_date',   data_type: 'date',     category: 'Date',      is_critical: true,  is_required: true  },
    { id: 'f3', canonical_name: 'base_rent_monthly',       data_type: 'currency', category: 'Financial', is_critical: true,  is_required: true  },
    { id: 'f4', canonical_name: 'tenant_legal_name',       data_type: 'string',   category: 'Party',     is_critical: true,  is_required: true  },
    { id: 'f5', canonical_name: 'landlord_legal_name',     data_type: 'string',   category: 'Party',     is_critical: true,  is_required: true  },
    { id: 'f6', canonical_name: 'premises_address',        data_type: 'string',   category: 'Property',  is_critical: false, is_required: true  },
    { id: 'f7', canonical_name: 'rentable_area_sqft',      data_type: 'number',   category: 'Property',  is_critical: false, is_required: true  },
    { id: 'f8', canonical_name: 'security_deposit',        data_type: 'currency', category: 'Financial', is_critical: false, is_required: false },
  ],
};

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

export function ProcessingWorkflowDialog({
  open,
  onClose,
  jobId = 'JOB-2026-0441',
  fileName = 'Retail-HQ-Lease-2026.pdf',
  initialStep = 1,
  preConfirmedTemplate = null,
}: ProcessingWorkflowDialogProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  // S6b: confirmed template flows from Step 2 → Step 5
  const [confirmedTemplate, setConfirmedTemplate] = useState<ExtractionTemplate | null>(
    preConfirmedTemplate
  );
  // Step 5 verification state
  const [verificationFields, setVerificationFields] = useState<VerificationField[]>([]);

  // Reset when dialog opens with a new initialStep
  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
      setConfirmedTemplate(preConfirmedTemplate);
    }
  }, [open, initialStep, preConfirmedTemplate]);

  // Build verification fields from confirmed template (S6b)
  useEffect(() => {
    if (currentStep === 5 && confirmedTemplate) {
      setVerificationFields(
        confirmedTemplate.fields.map(f => ({
          canonical_name: f.canonical_name,
          extracted_value: f.data_type === 'date'     ? '2026-01-01'
                         : f.data_type === 'currency' ? '$12,500.00'
                         : f.data_type === 'number'   ? '4,200'
                         : 'Extracted value placeholder',
          confidence: 0.85 + Math.random() * 0.14,
          is_critical: f.is_critical,
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
    onClose();
  };

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
        <div className="flex shrink-0 items-center gap-0 px-5 py-3 border-b border-border bg-muted/30">
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
              <p className="text-[13px] text-muted-foreground">
                Select the extraction template to use for this document.
              </p>
              <div
                className={cn(
                  'rounded-lg border-2 p-4 cursor-pointer transition-colors',
                  confirmedTemplate?.id === DEMO_TEMPLATE.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => setConfirmedTemplate(DEMO_TEMPLATE)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{DEMO_TEMPLATE.name}</p>
                    <p className="text-[12px] text-muted-foreground">{DEMO_TEMPLATE.version} · {DEMO_TEMPLATE.fields.length} fields</p>
                  </div>
                  {confirmedTemplate?.id === DEMO_TEMPLATE.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>
              {confirmedTemplate && (
                <p className="text-[12px] text-primary font-medium">
                  ✓ Template confirmed — {confirmedTemplate.fields.length} fields will be used in Step 5
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <h3 className="text-[14px] font-semibold text-foreground">AI Extraction Running</h3>
              <p className="text-[13px] text-muted-foreground text-center max-w-sm">
                The AI agent is extracting field values from the document.
                This typically takes 30–90 seconds.
              </p>
              <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full w-3/4 animate-pulse" />
              </div>
              <p className="text-[12px] text-muted-foreground">68 / 73 fields extracted</p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-semibold text-foreground">Confidence Review</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'High Confidence', count: 58, cls: 'badge-valid' },
                  { label: 'Medium Confidence', count: 10, cls: 'badge-warning' },
                  { label: 'Low Confidence', count: 5, cls: 'badge-invalid' },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border bg-card p-4 text-center">
                    <p className="text-[24px] font-bold text-foreground">{item.count}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-1 ${item.cls}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
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
