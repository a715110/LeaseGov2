/**
 * ApprovalsApprover — FC-4 Screen 4.3 (ApproverDialog431)
 * Screen key: approvals-approver
 * Route: /approvals/final
 * Role: Approver
 *
 * Design: Structured Authority
 * Prompt 4.3: Centered modal over review screen.
 *   Key terms 2-column grid (parties, dates, term, rent, property).
 *   Financial impact Before/After cards.
 *   Critical fields compact 22-row table (all success checkmarks).
 *   Reviewer Comments collapsible card (read-only).
 *   Deferred acknowledgment checkbox (required if deferred fields exist).
 *   SoD indicator: success shield "SoD Verified" / error shield "SoD Violation".
 *   Approve success primary, Reject error outlined, View Full Detail outlined.
 *
 * Data model refs: ApprovalTask (sod_preparer_user_id, sod_reviewer_user_id),
 *   ContractRecord / PropertyLease (key terms), ExtractionField (is_critical, disposition)
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { publishEvent } from "@/lib/eventBus";
import { useRole } from "@/contexts/RoleContext";
import { getApprovalTaskData } from "@/lib/mockApprovalsData";
import { ContractCheckpointCard } from '@/components/checkpoints/ContractCheckpointCard';
import { AutomationPolicyBadge } from '@/components/automation/AutomationPolicyBadge';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import {
  Shield, ShieldAlert, CheckCircle2, X, ChevronDown, ChevronUp,
  DollarSign, Calendar, MapPin, Users, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// MOCK_SUMMARY is resolved dynamically from the task ID in the URL via getApprovalTaskData().

const CRITICAL_FIELDS_22 = [
  "Landlord Name", "Tenant Name", "Commencement Date", "Expiration Date",
  "Lease Term (months)", "Likely Term (months)", "Rent Commencement Date",
  "Base Rent Amount", "Rent Frequency", "Rent Currency",
  "Escalation Type", "Escalation Rate", "Lease Classification",
  "Accounting Standard", "Property Address", "Rentable Area",
  "Amendment Effective Date", "Dates Changed", "Rent Changed",
  "Landlord Name (denorm)", "Tenant Name (denorm)", "Square Footage (denorm)",
];

export default function ApprovalsApprover() {
  const _screenKey = SCREEN_KEYS.APPROVALS_APPROVER;
  const [, navigate] = useLocation();
  const [deferredAcknowledged, setDeferredAcknowledged] = useState(false);
  const [reviewerCommentsExpanded, setReviewerCommentsExpanded] = useState(false);
  // Decline-for-rework inline form state
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineComments, setDeclineComments] = useState('');

  // FC-4 Gap 1: read task ID from route param (/approvals/final/:id), fall back to
  // navigation state (passed by ApprovalsReview on approve-for-final), then 't1'.
  const params = useParams<{ id: string }>();
  const navState = (typeof window !== 'undefined' ? window.history.state : null) as { taskId?: string; contractRecordId?: string } | null;
  const contractRecordId = params.id || navState?.taskId || 't1';
  const { summary: s, fields: taskFields } = getApprovalTaskData(contractRecordId);
  const { activeRole } = useRole();
  const canApprove = !s.sod_violation && (!s.has_deferred || deferredAcknowledged);
  const automationLevel: 'full_autonomous' | 'collaborative' | 'full_manual' = 'collaborative'; // TODO: from contractRecord
  const { activeCheckpoint } = useCheckpoints(contractRecordId, {
    checkpointType: 'onboarding_approval',
  });

  // FC-4 Gap 1 + Gap 2: publish REVIEW_OPENED on mount so ApprovalsQueue flips
  // the matching final-approval row from 'pending' to 'opened'.
  useEffect(() => {
    publishEvent({
      type: 'REVIEW_OPENED',
      payload: { task_id: contractRecordId },
      sourceRole: activeRole,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractRecordId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-card rounded-xl shadow-2xl w-[680px] max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[14px] font-bold text-foreground">{s.record_id}</span>
              <span className="badge-processing inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold">Pending Approval</span>
            </div>
            <p className="text-[13px] text-muted-foreground">{s.record_title}</p>
          </div>
          <div className="flex items-center gap-2">
            <AutomationPolicyBadge level={automationLevel} size="sm" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/approvals/queue")}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* FC-9: Checkpoint card — collaborative mode */}
          {automationLevel === 'collaborative' && activeCheckpoint && (
            <ContractCheckpointCard
              checkpoint={activeCheckpoint}
              onApprove={() => {}}
              onModify={() => {}}
              onReject={() => {}}
            />
          )}

          {/* SoD indicator */}
          {s.sod_violation ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-lg-error)] bg-[var(--color-lg-error-subtle)]">
              <ShieldAlert className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-error)" }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color:"var(--color-lg-error)" }}>SoD Violation — Approve Disabled</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">You were involved in a prior stage of this record. Final Approve is disabled.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)]">
              <Shield className="w-5 h-5 shrink-0" style={{ color:"var(--color-lg-success)" }} />
              <p className="text-[13px] font-semibold" style={{ color:"var(--color-lg-success)" }}>SoD Verified — No conflicts detected</p>
            </div>
          )}

          {/* Key terms 2-column grid */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Key Terms</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:<Users className="w-3.5 h-3.5" />, label:"Landlord",           value:s.key_terms.landlord },
                { icon:<Users className="w-3.5 h-3.5" />, label:"Tenant",             value:s.key_terms.tenant },
                { icon:<Calendar className="w-3.5 h-3.5" />, label:"Commencement",    value:s.key_terms.commencement },
                { icon:<Calendar className="w-3.5 h-3.5" />, label:"Expiration",      value:s.key_terms.expiration },
                { icon:<Clock className="w-3.5 h-3.5" />, label:"Term",               value:`${s.key_terms.term_months} months` },
                { icon:<DollarSign className="w-3.5 h-3.5" />, label:"Base Rent",     value:s.key_terms.base_rent },
                { icon:<DollarSign className="w-3.5 h-3.5" />, label:"Escalation",    value:s.key_terms.escalation },
                { icon:<MapPin className="w-3.5 h-3.5" />, label:"Property",          value:s.key_terms.property },
                { icon:<MapPin className="w-3.5 h-3.5" />, label:"Area",              value:s.key_terms.area_sqft },
                { icon:<Shield className="w-3.5 h-3.5" />, label:"Classification",    value:s.key_terms.classification },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="mt-0.5 text-muted-foreground shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
                    <p className="text-[13px] font-semibold text-foreground mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial impact Before/After */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Financial Impact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-lg border border-border bg-muted/20">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Before</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">ROU Asset</span>
                    <span className="font-semibold text-foreground">{s.financial_impact.before_rou}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Lease Liability</span>
                    <span className="font-semibold text-foreground">{s.financial_impact.before_liability}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 rounded-lg border border-[var(--color-lg-success)] bg-[var(--color-lg-success-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">After</p>
                  <span className="text-[12px] font-bold" style={{ color:"var(--color-lg-success)" }}>{s.financial_impact.delta}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">ROU Asset</span>
                    <span className="font-semibold text-foreground">{s.financial_impact.after_rou}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Lease Liability</span>
                    <span className="font-semibold text-foreground">{s.financial_impact.after_liability}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical fields compact 22-row table */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Critical Fields (22)</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-border">
                {[0, 1].map(col => (
                  <div key={col} className="divide-y divide-border">
                    {CRITICAL_FIELDS_22.slice(col * 11, col * 11 + 11).map((fieldLabel, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <span className="text-[12px] text-foreground">{fieldLabel}</span>
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviewer comments collapsible */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              onClick={() => setReviewerCommentsExpanded(v => !v)}
            >
              <span className="text-[13px] font-semibold text-foreground">Reviewer Comments</span>
              {reviewerCommentsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {reviewerCommentsExpanded && (
              <div className="px-4 py-3 border-t border-border bg-muted/20">
                <p className="text-[12px] text-muted-foreground mb-1">By {s.reviewer_name}</p>
                <p className="text-[13px] text-foreground leading-relaxed">{s.reviewer_comments}</p>
              </div>
            )}
          </div>

          {/* Deferred acknowledgment */}
          {s.has_deferred && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-[var(--color-lg-warning)] bg-[var(--color-lg-warning-subtle)]">
              <Checkbox
                id="deferred-ack"
                checked={deferredAcknowledged}
                onCheckedChange={v => setDeferredAcknowledged(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="deferred-ack" className="text-[13px] text-foreground cursor-pointer leading-relaxed">
                I acknowledge that <strong>{s.deferred_count} field{s.deferred_count !== 1 ? "s" : ""}</strong> have been deferred and will require follow-up before the record is fully complete.
                <span className="text-[var(--color-lg-error)] ml-1">*</span>
              </label>
            </div>
          )}
        </div>

        {/* Decline-for-rework inline form */}
        {showDeclineForm && (
          <div className="px-6 py-4 border-t border-border bg-[var(--color-lg-error-subtle)]">
            <p className="text-[13px] font-semibold text-[var(--color-lg-error)] mb-2">Decline for Rework — Approver Comments</p>
            <Textarea
              placeholder="Describe the issue(s) that require rework before final approval…"
              value={declineComments}
              onChange={e => setDeclineComments(e.target.value)}
              rows={3}
              className="text-[13px] mb-3"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowDeclineForm(false); setDeclineComments(''); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={declineComments.trim().length < 10}
                className="border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)] gap-1.5"
                onClick={() => {
                  const flaggedFields = taskFields
                    .filter(f => f.rework_flagged)
                    .map(f => f.field_name);
                  // FC-4 Fix 2: populate document_ids and perFileReasons so
                  // PipelineDashboard can reliably match and restore staged docs.
                  // document_ids are derived from flagged field IDs as a proxy
                  // (production: use the actual file/document IDs from the task).
                  const document_ids: string[] = taskFields.map(f => f.id);
                  const perFileReasons = flaggedFields.map(fieldName => ({
                    jobId: fieldName,
                    fileName: fieldName,
                    reason: declineComments,
                  }));
                  publishEvent({
                    type: 'DECLINE_SUBMITTED',
                    payload: {
                      task_id: contractRecordId,
                      record_id: s.record_id,
                      // batchRef and submissionId let PipelineDashboard isMatch
                      // find the right submission row even without document_ids.
                      batchRef: s.task_reference,
                      submissionId: s.record_id,
                      outcome: 'declined_for_rework',
                      comments: declineComments,
                      document_ids,
                      perFileReasons,
                    },
                    sourceRole: activeRole,
                  });
                  setShowDeclineForm(false);
                  navigate('/extraction/verify', {
                    state: {
                      isRework: true,
                      reworkIteration: (s.rework_iteration ?? 0) + 1,
                      rejectedBy: `Approver`,
                      rejectedAt: new Date().toISOString(),
                      rejectionComments: declineComments,
                      rejectionFlaggedFields: flaggedFields,
                    },
                  });
                }}
              >
                <X className="w-4 h-4" /> Confirm Decline
              </Button>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border sticky bottom-0 bg-card">
          <Button variant="outline" onClick={() => navigate(`/approvals/review/${contractRecordId}`)}>
            View Full Detail
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-[var(--color-lg-error-subtle)] gap-1.5"
              onClick={() => setShowDeclineForm(v => !v)}
            >
              <X className="w-4 h-4" /> {showDeclineForm ? 'Cancel Decline' : 'Decline for Rework'}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled={!canApprove}
                    className="gap-1.5 bg-[var(--color-lg-success)] hover:bg-[var(--color-lg-success)]/90 text-white"
                    onClick={() => {
                      publishEvent({
                        type: 'RECORD_APPROVED',
                        payload: { task_id: contractRecordId, record_id: s.record_id, label: s.record_title },
                        sourceRole: activeRole,
                      });
                      navigate("/approvals/queue");
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Final Approve
                  </Button>
                </span>
              </TooltipTrigger>
              {!canApprove && (
                <TooltipContent className="text-[12px]">
                  {s.sod_violation ? "SoD Violation — cannot approve" : "Acknowledge deferred fields to enable approval"}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
