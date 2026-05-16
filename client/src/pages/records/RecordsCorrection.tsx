/**
 * RecordsCorrection — FC-5 Screen 5.7 (Phase 2)
 * Screen key: records-correction
 * Route: /records/:id/correction
 *
 * PHASE 2 — activate when Phase 2 is enabled
 *
 * Renders as inline dialog (same pattern as ApproverDialog431 from FC-4).
 * Reason input (required) + affected fields multi-select.
 * On confirm: ContractRecord.status → correction_in_progress
 *             ContractRecord.lock_status → correction_in_progress
 *
 * Data model refs: ContractRecord (status, lock_status),
 *   ExtractionField (field_name, field_label)
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { X, Edit3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// TODO: Backend integration required — GET /api/records/:id/fields (for affected fields selector)
const CORRECTABLE_FIELDS = [
  { id:"f1",  label:"Landlord Name" },
  { id:"f2",  label:"Tenant Name" },
  { id:"f3",  label:"Commencement Date" },
  { id:"f4",  label:"Expiration Date" },
  { id:"f5",  label:"Base Rent Amount" },
  { id:"f6",  label:"Escalation Rate" },
  { id:"f7",  label:"Lease Classification" },
  { id:"f8",  label:"Property Address" },
];

export default function RecordsCorrection() {
  const _screenKey = SCREEN_KEYS.RECORDS_CORRECTION;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordId = params.id || "r1";

  const [reason, setReason] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = reason.trim().length >= 10 && selectedFields.length > 0;

  function toggleField(id: string) {
    setSelectedFields(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  // TODO: Backend integration required — PATCH /api/records/:id (status, lock_status)
  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-card rounded-xl shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto my-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-card flex items-center justify-between px-6 py-4 border-b border-border rounded-t-xl">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[var(--color-lg-warning)]" />
            <h2 className="text-[15px] font-bold text-foreground">Initiate Correction</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/records/${recordId}`)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Phase 2 notice */}
        <div className="mx-6 mt-4 rounded-lg border px-4 py-3 flex items-start gap-3" style={{ background:"var(--color-lg-warning-subtle)", borderColor:"var(--color-lg-warning)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
          <p className="text-[12px]" style={{ color:"var(--color-lg-warning)" }}>
            <strong>Phase 2 Feature.</strong> Initiating a correction will set the record status to <strong>Correction in Progress</strong> and lock editing until the correction is approved.
          </p>
        </div>

        {!submitted ? (
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Reason */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-foreground">
                Correction Reason <span className="text-[var(--color-lg-error)]">*</span>
              </label>
              <Textarea
                placeholder="Describe the reason for this correction (minimum 10 characters)…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                className="resize-none text-[13px]"
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-[11px]" style={{ color:"var(--color-lg-error)" }}>Minimum 10 characters required</p>
              )}
            </div>

            {/* Affected fields */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-foreground">
                Affected Fields <span className="text-[var(--color-lg-error)]">*</span>
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">Select all fields that require correction</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CORRECTABLE_FIELDS.map(f => (
                  <label key={f.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(f.id)}
                      onChange={() => toggleField(f.id)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-[13px] text-foreground">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-10 h-10" style={{ color:"var(--color-lg-success)" }} />
            <p className="text-[15px] font-semibold text-foreground">Correction Initiated</p>
            <p className="text-[13px] text-muted-foreground max-w-sm">
              Record status has been set to <strong>Correction in Progress</strong>. The record is now locked for editing until the correction is approved.
            </p>
          </div>
        )}

        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-between rounded-b-xl">
          <Button variant="outline" onClick={() => navigate(`/records/${recordId}`)}>Cancel</Button>
          {!submitted && (
            <Button
              disabled={!canSubmit}
              style={canSubmit ? { background:"var(--color-lg-warning)", color:"white" } : {}}
              onClick={handleSubmit}
            >
              Initiate Correction
            </Button>
          )}
          {submitted && (
            <Button onClick={() => navigate(`/records/${recordId}`)}>Back to Record</Button>
          )}
        </div>
      </div>
    </div>
  );
}
