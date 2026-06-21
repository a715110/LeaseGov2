/**
 * ApprovalsReview — FC-4 Screen 4.2 (ReviewDialog421)
 * Screen key: approvals-review
 * Route: /approvals/review
 * Role: Reviewer
 *
 * Design: Structured Authority
 * Prompt 4.2: Full-screen inline dialog over queue.
 *   Left panel: categorized field groups (collapsible accordion), confidence bars,
 *     inline edit with tracked corrections (AI → Preparer → Reviewer),
 *     Active Flags card, comment thread, Verify All bulk action,
 *     critical-field gate badge, SoD indicator.
 *   Right panel: PDF viewer with anchor highlights.
 *   Automation variants: Full Autonomous / Collaborative / Full Manual.
 *   Actions: Approve for Final (success), Reject with Comments (error outlined).
 *   Rejection flow: reason codes multi-select, flagged fields, required comments.
 *
 * Data model refs: ApprovalTask, ExtractionField (field_category, is_critical,
 *   ai_confidence, preparer_value, reviewer_value, disposition, rework_flagged),
 *   ContractRecord (automation_level, rework_iteration)
 */

import { useState, useMemo, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { getApprovalTaskData } from "@/lib/mockApprovalsData";
import { MOCK_REVIEWERS, ROLE_PERSONAS } from "@/lib/mockData";
import { useRole } from "@/contexts/RoleContext";
import { publishEvent } from "@/lib/eventBus";
import { useNotifications } from "@/contexts/NotificationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ContractAgentProgressPanel } from '@/components/agents/ContractAgentProgressPanel';
import { ContractCheckpointCard } from '@/components/checkpoints/ContractCheckpointCard';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { GracefulDegradationBanner } from '@/components/automation/GracefulDegradationBanner';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  X, ChevronDown, ChevronUp, Shield, ShieldAlert,
  CheckCircle2, AlertTriangle, Edit3, MessageSquare,
  Bot, Zap, User, Send, FileText, Eye, ZoomIn, ZoomOut,
  UserCog, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

type FieldCategory = "core_metadata" | "property" | "financial" | "legal" | "tables" | "amendment";
type Disposition = "accepted" | "corrected" | "not_found" | "deferred" | "rejected";
type AutomationLevel = "full_autonomous" | "collaborative" | "full_manual";

interface ReviewField {
  id: string;
  field_name: string;
  field_label: string;
  field_category: FieldCategory;
  is_critical: boolean;
  ai_extracted_value: string;
  ai_confidence: number;
  preparer_value: string;
  reviewer_value: string;
  reviewer_corrected_at: string | null;
  disposition: Disposition | null;
  rework_flagged: boolean;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  created_at: string;
  is_current_user: boolean;
}

// TODO: Backend integration required — GET /api/approvals/tasks/:id/fields
const MOCK_FIELDS: ReviewField[] = [
  { id:"f1",  field_name:"landlord_name",          field_label:"Landlord Name",          field_category:"core_metadata", is_critical:true,  ai_extracted_value:"Fifth Ave Properties LLC",  ai_confidence:0.97, preparer_value:"Fifth Ave Properties LLC",  reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f2",  field_name:"tenant_name",             field_label:"Tenant Name",             field_category:"core_metadata", is_critical:true,  ai_extracted_value:"Acme Corporation",          ai_confidence:0.99, preparer_value:"Acme Corporation",          reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f3",  field_name:"commencement_date",       field_label:"Commencement Date",       field_category:"core_metadata", is_critical:true,  ai_extracted_value:"2022-01-01",                ai_confidence:0.95, preparer_value:"2022-01-01",                reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f4",  field_name:"expiration_date",         field_label:"Expiration Date",         field_category:"core_metadata", is_critical:true,  ai_extracted_value:"2032-12-31",                ai_confidence:0.94, preparer_value:"2032-12-31",                reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f5",  field_name:"property_address_street", field_label:"Property Address",        field_category:"property",      is_critical:true,  ai_extracted_value:"350 Fifth Avenue, New York", ai_confidence:0.98, preparer_value:"350 Fifth Avenue, New York", reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f6",  field_name:"rentable_area_sqft",      field_label:"Rentable Area (sqft)",    field_category:"property",      is_critical:false, ai_extracted_value:"24,500",                    ai_confidence:0.91, preparer_value:"24,500",                    reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f7",  field_name:"base_rent_amount",        field_label:"Base Rent Amount",        field_category:"financial",     is_critical:true,  ai_extracted_value:"$38,500/month",             ai_confidence:0.72, preparer_value:"$42,500/month",             reviewer_value:"", reviewer_corrected_at:null, disposition:"corrected",rework_flagged:true  },
  { id:"f8",  field_name:"base_rent_frequency",     field_label:"Rent Frequency",          field_category:"financial",     is_critical:true,  ai_extracted_value:"monthly",                   ai_confidence:0.99, preparer_value:"monthly",                   reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f9",  field_name:"escalation_type",         field_label:"Escalation Type",         field_category:"financial",     is_critical:true,  ai_extracted_value:"fixed_percentage",          ai_confidence:0.88, preparer_value:"fixed_percentage",          reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f10", field_name:"escalation_rate",         field_label:"Escalation Rate",         field_category:"financial",     is_critical:true,  ai_extracted_value:"3.00%",                     ai_confidence:0.85, preparer_value:"3.00%",                     reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f11", field_name:"lease_term_months",       field_label:"Lease Term (months)",     field_category:"legal",         is_critical:true,  ai_extracted_value:"132",                       ai_confidence:0.93, preparer_value:"132",                       reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f12", field_name:"lease_classification",    field_label:"Lease Classification",    field_category:"legal",         is_critical:true,  ai_extracted_value:"operating",                 ai_confidence:0.96, preparer_value:"operating",                 reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f13", field_name:"renewal_options",         field_label:"Renewal Options",         field_category:"legal",         is_critical:false, ai_extracted_value:"2 × 5yr options",           ai_confidence:0.82, preparer_value:"2 × 5yr options",           reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
  { id:"f14", field_name:"security_deposit",        field_label:"Security Deposit",        field_category:"financial",     is_critical:false, ai_extracted_value:"$115,500",                  ai_confidence:0.89, preparer_value:"$115,500",                  reviewer_value:"", reviewer_corrected_at:null, disposition:"deferred", rework_flagged:false },
];

const MOCK_COMMENTS: Comment[] = [
  { id:"c1", author:"J. Martinez (Preparer)", text:"Base rent corrected per Amendment 3 — original lease shows $38,500 but Amendment 3 supersedes to $42,500.", created_at:"2026-05-16T08:30:00Z", is_current_user:false },
  { id:"c2", author:"M. Rodriguez (Reviewer)", text:"Confirmed. Amendment 3 Section 2.1 explicitly states the new rent. Proceeding with corrected value.", created_at:"2026-05-16T09:15:00Z", is_current_user:true },
];

const CATEGORY_LABELS: Record<FieldCategory, string> = {
  core_metadata:"Core Metadata", property:"Property", financial:"Financial",
  legal:"Legal", tables:"Tables", amendment:"Amendment",
};

const REJECTION_REASON_OPTIONS = [
  { value:"incorrect_value",       label:"Incorrect Value" },
  { value:"missing_evidence",      label:"Missing Evidence" },
  { value:"incomplete_extraction", label:"Incomplete Extraction" },
  { value:"classification_error",  label:"Classification Error" },
];

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? "var(--color-lg-success)" : value >= 0.7 ? "var(--color-lg-warning)" : "var(--color-lg-error)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-muted rounded overflow-hidden">
        <div className="h-full rounded" style={{ width:`${pct}%`, backgroundColor:color }} />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function ApprovalsReview() {
  const _screenKey = SCREEN_KEYS.APPROVALS_REVIEW;
  const [, navigate] = useLocation();
  const { activeRole } = useRole();
  const currentPersona = ROLE_PERSONAS[activeRole] ?? { name: 'Current User', initials: '?', email: '' };

  const routeParams = useParams<{ id: string }>();
  const contractRecordId = routeParams.id || 't1'; // read task ID from URL param
  const { summary: taskSummary, fields: taskFields } = getApprovalTaskData(contractRecordId);
  const [automationLevel] = useState<AutomationLevel>('collaborative'); // TODO: from contractRecord?.automation_level

  const { activeCheckpoint } = useCheckpoints(contractRecordId, {
    checkpointType: 'extraction_review',
  });

  const mockAgentTask = useMemo(() => ({
    id: `task-review-${contractRecordId}`,
    agent_type: 'review',
    workflow_id: `wf-${contractRecordId}`,
    contract_id: contractRecordId,
    agent_name: 'Review Agent',
    automation_level: 'full_autonomous' as const,
    status: 'completed' as const,
    current_step: 'Review Complete',
    steps: [
      { id: 's1', label: 'Field Verification', status: 'completed' as const, timestamp: '10:02', duration: '3m 14s' },
      { id: 's2', label: 'Critical Field Check', status: 'completed' as const, timestamp: '10:05', duration: '1m 08s' },
      { id: 's3', label: 'SoD Validation', status: 'completed' as const, timestamp: '10:06', duration: '0m 22s' },
      { id: 's4', label: 'Approval Recommendation', status: 'completed' as const, timestamp: '10:07', duration: '0m 15s' },
    ],
    decisions: [
      { id: 'd1', label: 'All critical fields verified', decision_type: 'field_check', confidence: 0.97, summary: '22/22 critical fields confirmed', reasoning: 'All critical fields have been verified against source documents.', requires_human_approval: false, timestamp: '10:07' },
    ],
    progress: { current: 4, total: 4, label: 'Complete' },
  }), [contractRecordId]);
  const sodViolation = taskSummary.sod_violation;
  const reworkIteration = taskSummary.rework_iteration;

  // Task context derived from route param via getApprovalTaskData()
  const MOCK_TASK_REVIEWER_ID = 'user-rev-001';
  const MOCK_TASK_SLA = taskSummary.sla_deadline_at ?? '2026-05-30T17:00:00Z';

  // Reassign state
  const { addNotification } = useNotifications();
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const eligibleReviewers = MOCK_REVIEWERS.filter(r => r.role === 'Reviewer');

  function handleConfirmReassign() {
    if (!reassignTargetId) return;
    const prev = MOCK_REVIEWERS.find(r => r.id === MOCK_TASK_REVIEWER_ID);
    const next = MOCK_REVIEWERS.find(r => r.id === reassignTargetId);
    addNotification({
      title: `${taskSummary.record_id} reassigned`,
      body: `Review task redirected from ${prev?.name ?? 'current reviewer'} to ${next?.name ?? 'new reviewer'}.`,
      severity: 'info',
      href: '/approvals',
    });
    addNotification({
      title: 'Your review task has been reassigned',
      body: `${taskSummary.record_id} has been redirected to ${next?.name ?? 'another reviewer'}.`,
      severity: 'warning',
      href: '/approvals',
    });
    toast.success(`${taskSummary.record_id} reassigned to ${next?.name ?? 'new reviewer'}`, { duration: 4000 });
    setShowReassignDialog(false);
    setReassignTargetId('');
    navigate('/approvals/queue');
  }

  // Publish REVIEW_OPENED on mount so ApprovalsQueue flips the matching row to 'opened'
  useEffect(() => {
    publishEvent({
      type: 'REVIEW_OPENED',
      payload: { task_id: contractRecordId },
      sourceRole: activeRole,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractRecordId]);

  // SLA countdown
  const [slaCountdown, setSlaCountdown] = useState('');
  const [slaUrgent, setSlaUrgent] = useState(false);
  useEffect(() => {
    function update() {
      const deadline = new Date(MOCK_TASK_SLA).getTime();
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) { setSlaCountdown('Overdue'); setSlaUrgent(true); return; }
      const hours = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setSlaUrgent(hours < 4);
      setSlaCountdown(hours >= 24
        ? `${Math.floor(hours / 24)}d ${hours % 24}h left`
        : hours > 0 ? `${hours}h ${mins}m left`
        : `${mins}m left`);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [fields, setFields] = useState<ReviewField[]>(() => taskFields as ReviewField[]);
  const [expandedCategories, setExpandedCategories] = useState<Set<FieldCategory>>(new Set<FieldCategory>(["core_metadata","financial"]));
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [comments, setComments] = useState<Comment[]>([{
    id: "c1",
    author: `${taskSummary.submitted_by} (Preparer)`,
    text: taskSummary.reviewer_comments,
    created_at: taskSummary.submitted_at,
    is_current_user: false,
  }]);
  const [newComment, setNewComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<string[]>([]);
  const [rejectionComments, setRejectionComments] = useState("");
  const [showApproverModal, setShowApproverModal] = useState(false);

  const criticalFields = fields.filter(f => f.is_critical);
  const criticalVerified = criticalFields.filter(f => f.disposition && f.disposition !== "deferred").length;
  const criticalFieldCount = criticalFields.length;
  const canApprove = criticalVerified >= criticalFieldCount && !sodViolation;
  const deferredCount = fields.filter(f => f.disposition === "deferred").length;

  const categories = Array.from(new Set(fields.map(f => f.field_category))) as FieldCategory[];

  function toggleCategory(cat: FieldCategory) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function startEdit(field: ReviewField) {
    setEditingFieldId(field.id);
    setEditValue(field.reviewer_value || field.preparer_value || field.ai_extracted_value);
  }

  function saveEdit(fieldId: string) {
    setFields(prev => prev.map(f =>
      f.id === fieldId
        ? { ...f, reviewer_value: editValue, reviewer_corrected_at: new Date().toISOString(), disposition: "corrected" }
        : f
    ));
    setEditingFieldId(null);
  }

  function confirmField(fieldId: string) {
    setFields(prev => prev.map(f =>
      f.id === fieldId ? { ...f, disposition:"accepted" } : f
    ));
  }

  function verifyAll() {
    setFields(prev => prev.map(f =>
      f.disposition === null ? { ...f, disposition:"accepted" } : f
    ));
  }

  function sendComment() {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `c${Date.now()}`,
      author: `${currentPersona.name} (Reviewer)`,
      text: newComment,
      created_at: new Date().toISOString(),
      is_current_user: true,
    }]);
    setNewComment("");
  }

  function toggleRejectionReason(value: string) {
    setRejectionReasons(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    );
  }

  const canReject = rejectionReasons.length > 0 && rejectionComments.trim().length > 10;

  // Reject pre-fill: build a summary of flagged fields + low-confidence fields
  function buildRejectPreFill(): string {
    const lines: string[] = [];
    const flagged = fields.filter(f => f.rework_flagged);
    const lowConf = fields.filter(f => f.ai_confidence < 0.80 && !f.rework_flagged);
    if (flagged.length > 0) {
      lines.push('Flagged fields requiring correction:');
      flagged.forEach(f => lines.push(`  • ${f.field_label}: preparer value "${f.preparer_value}" (AI extracted "${f.ai_extracted_value}", confidence ${Math.round(f.ai_confidence * 100)}%)`));
    }
    if (lowConf.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push('Low-confidence fields that need verification:');
      lowConf.forEach(f => lines.push(`  • ${f.field_label}: "${f.preparer_value}" (confidence ${Math.round(f.ai_confidence * 100)}%)`));
    }
    return lines.join('\n');
  }

  // SLA progress bar
  const SLA_TOTAL_HOURS = 48;
  const slaStart = new Date(MOCK_TASK_SLA).getTime() - SLA_TOTAL_HOURS * 3_600_000;
  const slaDeadline = new Date(MOCK_TASK_SLA).getTime();
  const slaElapsedPct = Math.min(100, Math.max(0, Math.round(((Date.now() - slaStart) / (slaDeadline - slaStart)) * 100)));
  const slaElapsedHours = Math.min(SLA_TOTAL_HOURS, Math.round((Date.now() - slaStart) / 3_600_000));

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-lg-page-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[15px] font-bold text-foreground">{taskSummary.record_id}</span>
          <span className="badge-processing inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
            Under Review
          </span>
          {reworkIteration > 0 && (
            <span className="badge-warning inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
              Rework #{reworkIteration}
            </span>
          )}
          <span className="text-[13px] text-muted-foreground">Submitted by {taskSummary.submitted_by} · {new Date(taskSummary.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* SLA countdown chip */}
          {slaCountdown && (
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border ${
                slaUrgent
                  ? 'border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)] text-[var(--color-lg-error)]'
                  : 'border-[var(--color-lg-warning)] bg-[var(--color-lg-warning-subtle)] text-[var(--color-lg-warning)]'
              }`}>
                <Clock className="w-3.5 h-3.5" /> {slaCountdown}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${slaElapsedPct}%`,
                      backgroundColor: slaUrgent ? 'var(--color-lg-error)' : 'var(--color-lg-warning)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {slaElapsedHours}h / {SLA_TOTAL_HOURS}h
                </span>
              </div>
            </div>
          )}
          {/* SoD indicator */}
          {sodViolation ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)] text-[12px] font-semibold text-[var(--color-lg-error)]">
              <ShieldAlert className="w-4 h-4" /> SoD Violation
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)] text-[12px] font-semibold text-[var(--color-lg-success)]">
              <Shield className="w-4 h-4" /> SoD Verified
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[12px]"
            onClick={() => { setReassignTargetId(''); setShowReassignDialog(true); }}
          >
            <UserCog className="w-3.5 h-3.5" /> Reassign
          </Button>
          <Button
            variant="outline"
            className="border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)] gap-1.5"
            onClick={() => {
              const preFill = buildRejectPreFill();
              if (preFill && !rejectionComments) setRejectionComments(preFill);
              setShowRejectForm(true);
            }}
          >
            <X className="w-4 h-4" /> Reject with Comments
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  disabled={!canApprove}
                  className="gap-1.5 bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white"
                  onClick={() => setShowApproverModal(true)}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve for Final
                </Button>
              </span>
            </TooltipTrigger>
            {!canApprove && (
              <TooltipContent className="text-[12px]">
                {sodViolation ? "SoD Violation — cannot approve" : `${criticalFieldCount - criticalVerified} critical fields must be verified`}
              </TooltipContent>
            )}
          </Tooltip>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/approvals/queue")}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* FC-9: Graceful degradation banner */}
      <GracefulDegradationBanner />

      {/* FC-9: Agent progress panel — full_autonomous */}
      {automationLevel === 'full_autonomous' && (
        <div className="shrink-0 border-b border-border">
          <ContractAgentProgressPanel
            task={mockAgentTask}
            onIntervene={() => {}}
            onResume={() => {}}
          />
        </div>
      )}

      {/* FC-9: Checkpoint card — collaborative */}
      {automationLevel === 'collaborative' && activeCheckpoint && (
        <div className="shrink-0">
          <ContractCheckpointCard
            checkpoint={activeCheckpoint}
            onApprove={() => {}}
            onModify={() => {}}
            onReject={() => {}}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <div className="w-[55%] flex flex-col overflow-hidden border-r border-border">
          {/* Critical field gate + bulk action */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold border ${
                criticalVerified >= criticalFieldCount
                  ? "border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)] text-[var(--color-lg-success)]"
                  : "border-[var(--color-lg-warning)] bg-[var(--color-lg-warning-subtle)] text-[var(--color-lg-warning)]"
              }`}>
                <Shield className="w-3.5 h-3.5" />
                {criticalVerified}/{criticalFieldCount} Critical Fields Verified
              </div>
              {deferredCount > 0 && (
                <span className="badge-warning inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {deferredCount} Deferred
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[12px] gap-1" onClick={verifyAll}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Verify All
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {/* Field groups */}
            {categories.map(cat => {
              const catFields = fields.filter(f => f.field_category === cat);
              const isExpanded = expandedCategories.has(cat);
              return (
                <div key={cat} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    onClick={() => toggleCategory(cat)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{CATEGORY_LABELS[cat]}</span>
                      <span className="text-[11px] text-muted-foreground">({catFields.length} fields)</span>
                      {catFields.some(f => f.rework_flagged) && (
                        <span className="badge-invalid inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {catFields.map(field => (
                        <div
                          key={field.id}
                          className={`px-4 py-3 ${field.is_critical ? "border-l-[3px]" : ""}`}
                          style={field.is_critical ? { borderLeftColor:"var(--color-lg-warning)" } : {}}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {field.is_critical && <Shield className="w-3.5 h-3.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />}
                                <span className="text-[12px] font-semibold text-muted-foreground">{field.field_label}</span>
                                {field.rework_flagged && (
                                  <span className="badge-invalid inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold">Flagged</span>
                                )}
                              </div>
                              {editingFieldId === field.id ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    className="flex-1 px-2 py-1 text-[13px] border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-[var(--color-lg-primary-light)]"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    autoFocus
                                  />
                                  <Button size="sm" className="h-7 text-[12px]" onClick={() => saveEdit(field.id)}>Save</Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setEditingFieldId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[14px] font-medium text-foreground">
                                    {field.reviewer_value || field.preparer_value || field.ai_extracted_value}
                                  </p>
                                  {field.disposition === "corrected" && (
                                    <div className="flex flex-col gap-1 mt-1">
                                      {/* AI → Preparer correction */}
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span className="line-through opacity-60">{field.ai_extracted_value}</span>
                                        <span>→</span>
                                        <span className="font-medium text-foreground">{field.preparer_value}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">Preparer</span>
                                      </div>
                                      {/* Preparer → Reviewer correction (only when reviewer edited) */}
                                      {field.reviewer_value && field.reviewer_value !== field.preparer_value && (
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                          <span className="line-through opacity-60">{field.preparer_value}</span>
                                          <span>→</span>
                                          <span className="font-medium text-[var(--color-lg-primary)]">{field.reviewer_value}</span>
                                          <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold">Reviewer</span>
                                          {field.reviewer_corrected_at && (
                                            <span className="text-[10px] text-muted-foreground">
                                              {new Date(field.reviewer_corrected_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <ConfidenceBar value={field.ai_confidence} />
                              <div className="flex items-center gap-1">
                                {field.disposition === "accepted" || field.disposition === "corrected" ? (
                                  <span className="badge-valid inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </span>
                                ) : field.disposition === "deferred" ? (
                                  <span className="badge-warning inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold">Deferred</span>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => confirmField(field.id)}>
                                    Confirm
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(field)}>
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Comment thread */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold text-foreground">Comments</span>
                <span className="text-[11px] text-muted-foreground">({comments.length})</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                {comments.map(c => (
                  <div key={c.id} className={`flex gap-2.5 ${c.is_current_user ? "flex-row-reverse" : ""}`}>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className={`flex-1 max-w-[80%] ${c.is_current_user ? "items-end" : ""} flex flex-col gap-1`}>
                      <span className="text-[11px] text-muted-foreground">{c.author}</span>
                      <div className={`px-3 py-2 rounded-lg text-[13px] ${c.is_current_user ? "bg-[var(--color-lg-primary)] text-white" : "bg-muted text-foreground"}`}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <input
                    className="flex-1 px-3 py-2 text-[13px] border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-[var(--color-lg-primary-light)]"
                    placeholder="Add a comment…"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendComment())}
                  />
                  <Button size="sm" className="h-9 w-9 p-0" onClick={sendComment}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — PDF viewer */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-foreground">Office-Tower-Base-Lease-2022.pdf</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ZoomOut className="w-3.5 h-3.5" /></Button>
              <span className="text-[12px] text-muted-foreground px-1">100%</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ZoomIn className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-[14px] font-medium">PDF Viewer</p>
              <p className="text-[12px] mt-1">Anchor highlights will appear here</p>
              <p className="text-[11px] mt-1 opacity-60">Page 1 of 47</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection form overlay */}
      {showRejectForm && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
          <div className="bg-card rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">Reject with Comments</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowRejectForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-2">Rejection Reason Codes <span className="text-[var(--color-lg-error)]">*</span></p>
                <div className="flex flex-col gap-2">
                  {REJECTION_REASON_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={rejectionReasons.includes(opt.value)}
                        onCheckedChange={() => toggleRejectionReason(opt.value)}
                      />
                      <span className="text-[13px] text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-1.5">
                  Rejection Comments <span className="text-[var(--color-lg-error)]">*</span>
                </p>
                <Textarea
                  value={rejectionComments}
                  onChange={e => setRejectionComments(e.target.value)}
                  placeholder="Required: describe the issues that must be corrected before resubmission…"
                  className="text-[13px] min-h-[100px] resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button>
              <Button
                disabled={!canReject}
                className="bg-[var(--color-lg-error)] hover:bg-[var(--color-lg-error)]/90 text-white gap-1.5"
                onClick={() => {
                  const flaggedFields = taskFields
                    .filter(f => f.rework_flagged)
                    .map(f => f.field_name);
                  publishEvent({
                    type: 'REVIEW_COMPLETED',
                    payload: {
                      task_id: contractRecordId,
                      record_id: taskSummary.record_id,
                      outcome: 'rejected',
                      reasons: rejectionReasons,
                      comments: rejectionComments,
                    },
                    sourceRole: activeRole,
                  });
                  setShowRejectForm(false);
                  navigate("/extraction/verify", {
                    state: {
                      isRework: true,
                      reworkIteration: (reworkIteration ?? 0) + 1,
                      rejectedBy: `${taskSummary.reviewer_name} (Reviewer)`,
                      rejectedAt: new Date().toISOString(),
                      rejectionComments: rejectionComments,
                      rejectionFlaggedFields: flaggedFields,
                    }
                  });
                }}
              >
                <X className="w-4 h-4" /> Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign dialog */}
      <Dialog open={showReassignDialog} onOpenChange={open => { if (!open) { setShowReassignDialog(false); setReassignTargetId(''); } }}>
        <DialogContent className="w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Reassign Review Task</DialogTitle>
          </DialogHeader>
          <div className="px-1 py-2 flex flex-col gap-4">
            <p className="text-[13px] text-muted-foreground">
              Redirect <strong>{taskSummary.record_id}</strong> to a different Reviewer. The current reviewer and document submitter will be notified.
            </p>
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-1.5">New Reviewer <span className="text-[var(--color-lg-error)]">*</span></p>
              <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
                <SelectTrigger className="text-[13px]">
                  <SelectValue placeholder="Select a reviewer…" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleReviewers.map(r => (
                    <SelectItem key={r.id} value={r.id} disabled={r.id === MOCK_TASK_REVIEWER_ID}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: r.avatarColor }}>
                          {r.name.charAt(0)}
                        </span>
                        <span>{r.name}</span>
                        {r.id === MOCK_TASK_REVIEWER_ID && <span className="text-[10px] text-muted-foreground">(current)</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowReassignDialog(false); setReassignTargetId(''); }}>Cancel</Button>
            <Button disabled={!reassignTargetId || reassignTargetId === MOCK_TASK_REVIEWER_ID} onClick={handleConfirmReassign} className="gap-1.5">
              <UserCog className="w-4 h-4" /> Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approver modal trigger — opens ApprovalsApprover as nested dialog */}
      {showApproverModal && (
        <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center p-8">
          <div className="bg-card rounded-xl shadow-2xl w-[680px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">Final Approval — ApproverDialog431</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowApproverModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[13px] text-muted-foreground">
                Navigate to <strong>/approvals/final</strong> to view the full Approver screen (ApproverDialog431).
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowApproverModal(false)}>Cancel</Button>
                <Button onClick={() => { setShowApproverModal(false); navigate(`/approvals/final/${contractRecordId}`, { state: { taskId: contractRecordId, contractRecordId: taskSummary.record_id } }); }}>
                  Open Approver Screen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
