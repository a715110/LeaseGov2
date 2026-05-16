/**
 * ExportUploadTask — FC-7 Screen 7.4
 * Screen key: export-upload-task
 * Route: /export/tasks/:id
 *
 * Prompt 7.4: 5-step vertical upload task lifecycle.
 * Header: Task ID, Record ID, Template, Status.
 * Lock banner (warning-subtle).
 * Steps:
 *   1. Download Generated File (initialized → in_progress)
 *   2. Upload to External System (in_progress → evidence_submitted)
 *   3. Provide Upload Evidence (evidence_submitted → anchors_entered)
 *   4. Verify Data (anchors_entered → evidence_verified)
 *   5. Attest and Complete (evidence_verified → completed)
 * Completion state: full-width success banner + CompliancePacket summary.
 * Failed state: error banner + Restart Task button.
 *
 * Data model refs: UploadTask, CompliancePacket
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Download, CheckCircle2, Lock, AlertTriangle, Upload, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SCREEN_KEYS } from "@/constants/screenKeys";

type TaskStatus = "initialized" | "in_progress" | "evidence_submitted" | "anchors_entered" | "evidence_verified" | "completed" | "failed";

const STATUS_STEPS: { status: TaskStatus; label: string }[] = [
  { status:"initialized",       label:"Download File" },
  { status:"in_progress",       label:"Upload to System" },
  { status:"evidence_submitted",label:"Provide Evidence" },
  { status:"anchors_entered",   label:"Verify Data" },
  { status:"evidence_verified", label:"Attest & Complete" },
  { status:"completed",         label:"Completed" },
];

const PAC_SAC_TEXT = `PREPARERS AND APPROVERS CERTIFICATION / SUBMITTERS ATTESTATION CERTIFICATE

I, the undersigned, hereby certify that I have reviewed the information contained in this export package and that, to the best of my knowledge and belief, the information is true, correct, and complete in all material respects.

I further certify that:
(a) The lease terms and financial data presented herein accurately reflect the underlying contractual obligations;
(b) All required evidence anchors have been reviewed and confirmed against the source documents;
(c) The extraction and verification process was conducted in accordance with the organization's established procedures;
(d) I am authorized to submit this information on behalf of the organization;
(e) I understand that this certification may be relied upon by auditors, regulators, and other authorized parties.

Any material deviation from the information contained in the external system has been disclosed and documented in this package.

This certification is made under penalty of applicable law and organizational policy.`;

const DA_TEXT = `DATA ACCURACY ATTESTATION

I, the undersigned Data Accuracy Attestor, hereby attest that:

1. COMPLETENESS: All required fields in the export template have been populated with values extracted from or derived from the underlying lease documents.

2. ACCURACY: The extracted values have been verified against the source documents through the evidence anchor review process. Any discrepancies have been documented.

3. CONSISTENCY: The financial calculations (lease liability, ROU asset, IBR rate) are consistent with the lease terms and the organization's accounting policies.

4. CHAIN OF CUSTODY: The export file has not been modified after generation. The SHA-256 hash of the downloaded file matches the hash recorded at generation time.

5. EXTERNAL SYSTEM INTEGRITY: The data uploaded to the external system matches the data in this export package. Any deviation has been declared and justified.

I understand that this attestation creates an immutable record in the compliance packet and will be retained for the duration of the contract plus seven years.`;

export default function ExportUploadTask() {
  const _screenKey = SCREEN_KEYS.EXPORT_UPLOAD_TASK;
  const [, navigate] = useLocation();

  const [taskStatus, setTaskStatus] = useState<TaskStatus>("initialized");
  const [downloaded, setDownloaded] = useState(false);
  const [externalSystemId, setExternalSystemId] = useState("");
  const [confirmRef, setConfirmRef] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [deviationDetected, setDeviationDetected] = useState(false);
  const [deviationJustification, setDeviationJustification] = useState("");
  const [pacSacScrolled, setPacSacScrolled] = useState(false);
  const [daScrolled, setDaScrolled] = useState(false);
  const [pacSacChecked, setPacSacChecked] = useState(false);
  const [daChecked, setDaChecked] = useState(false);
  const [manualLiability, setManualLiability] = useState("");
  const [manualRou, setManualRou] = useState("");
  const [manualGainLoss, setManualGainLoss] = useState("");

  const pacSacRef = useRef<HTMLDivElement>(null);
  const daRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === taskStatus);

  function handlePacSacScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setPacSacScrolled(true);
  }
  function handleDaScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setDaScrolled(true);
  }

  // TODO: Backend integration required — PATCH /api/export/tasks/:id/status
  function advanceStatus(next: TaskStatus) { setTaskStatus(next); }

  // TODO: Backend integration required — POST /api/export/tasks/:id/complete
  function completeTask() {
    if (pacSacChecked && daChecked) advanceStatus("completed");
  }

  if (taskStatus === "completed") {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
        {/* Success banner */}
        <div className="px-6 py-5" style={{ background:"var(--color-lg-success)", color:"white" }}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="text-[16px] font-bold">Export Completed Successfully</p>
              <p className="text-[13px] opacity-90">Upload Task UT-2026-0041 · CompliancePacket sealed</p>
            </div>
          </div>
        </div>

        {/* CompliancePacket summary */}
        <div className="px-6 py-8 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-[15px] font-bold text-foreground">Compliance Packet Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div><span className="text-muted-foreground">Sealed at:</span><br /><span className="font-semibold text-foreground">2026-05-16 14:32:07 UTC</span></div>
              <div><span className="text-muted-foreground">Sealed by:</span><br /><span className="font-semibold text-foreground">J. Martinez</span></div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Packet Hash (SHA-256):</span><br />
                <span className="font-mono text-[11px] text-foreground">a3f8c2d1e9b4…7f2a1c3d (truncated)</span>
              </div>
              <div><span className="text-muted-foreground">External System ID:</span><br /><span className="font-semibold text-foreground">{externalSystemId || "EXT-2026-0041"}</span></div>
              <div><span className="text-muted-foreground">Confirmation Reference:</span><br /><span className="font-semibold text-foreground">{confirmRef || "CONF-20260516-0041"}</span></div>
              {deviationDetected && (
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold badge-warning">
                    <AlertTriangle className="w-3 h-3" /> Deviation Declared
                  </span>
                  <p className="text-muted-foreground mt-1 text-[11px]">{deviationJustification}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="gap-1.5 text-[12px] h-8">
                <Download className="w-3.5 h-3.5" /> Download Compliance Packet
              </Button>
              <Button className="text-[12px] h-8" onClick={() => navigate("/records/r1")}>
                Back to Record
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ContractRecord CR-2026-0041 lock released · Record status → completed
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (taskStatus === "failed") {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
        <div className="px-6 py-5" style={{ background:"var(--color-lg-error)", color:"white" }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="text-[16px] font-bold">Upload Task Failed</p>
              <p className="text-[13px] opacity-90">UT-2026-0041 · Reason: Evidence hash mismatch detected during verification</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-8">
          <p className="text-[13px] text-muted-foreground mb-4">The previous task has been retained for audit purposes. You may create a new Upload Task for this record.</p>
          {/* TODO: Backend integration required — POST /api/export/tasks (creates new task for same record) */}
          <Button onClick={() => advanceStatus("initialized")}>Restart Task</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[13px] font-bold text-foreground">UT-2026-0041</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">CR-2026-0041</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">New Lease Onboarding v3.2</span>
          </div>
          <h1 className="page-title">Upload Task</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-semibold badge-processing">
          {STATUS_STEPS.find(s => s.status === taskStatus)?.label}
        </span>
      </div>

      {/* Lock banner */}
      <div className="mx-6 mb-4 flex items-center gap-2.5 px-4 py-3 rounded-lg border text-[12px]" style={{ borderColor:"var(--color-lg-warning)", background:"var(--color-lg-warning-subtle)" }}>
        <Lock className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-warning)" }} />
        <span className="font-medium text-foreground">This file is locked. Any discrepancy with the external system must be declared as a deviation in Step 4.</span>
      </div>

      <div className="px-6 pb-8 flex gap-6">
        {/* Left: step content */}
        <div className="flex-1 flex flex-col gap-4 max-w-2xl">

          {/* STEP 1 — Download */}
          <div className={`bg-card border rounded-xl p-5 ${currentStepIndex >= 0 ? "border-border" : "opacity-40"}`}>
            <div className="flex items-center gap-3 mb-3">
              {taskStatus !== "initialized" ? <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} /> : <div className="w-5 h-5 rounded-full border-2 border-[var(--color-lg-primary)]" />}
              <h3 className="text-[13px] font-bold text-foreground">Step 1 — Download Generated File</h3>
            </div>
            <div className="text-[12px] flex flex-col gap-2 text-muted-foreground">
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                <span>CR-2026-0041_NewLeaseOnboarding_v3.2.xlsx</span>
                <span className="font-mono text-[11px]">SHA-256: a3f8c2d1…</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Generated: 2026-05-16 14:00:00 UTC · Format: Excel + PDF</span>
              </div>
            </div>
            {taskStatus === "initialized" && (
              <Button className="mt-4 gap-1.5" onClick={() => { setDownloaded(true); advanceStatus("in_progress"); }}>
                <Download className="w-4 h-4" /> Download Export File
              </Button>
            )}
            {taskStatus !== "initialized" && (
              <p className="mt-3 text-[11px] text-muted-foreground">Downloaded · File locked</p>
            )}
          </div>

          {/* STEP 2 — Upload to External System */}
          <div className={`bg-card border rounded-xl p-5 ${taskStatus === "in_progress" ? "border-[var(--color-lg-primary)]" : taskStatus === "initialized" ? "opacity-40 border-border" : "border-border"}`}>
            <div className="flex items-center gap-3 mb-3">
              {["evidence_submitted","anchors_entered","evidence_verified"].includes(taskStatus) ? <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} /> : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: taskStatus === "in_progress" ? "var(--color-lg-primary)" : "var(--color-border)" }} />}
              <h3 className="text-[13px] font-bold text-foreground">Step 2 — Upload to External System</h3>
            </div>
            {taskStatus === "in_progress" && (
              <div className="flex flex-col gap-3">
                <div className="bg-muted/20 rounded-lg p-3 text-[12px] text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Instructions</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Log in to the external lease accounting system</li>
                    <li>Navigate to Contracts → New Import</li>
                    <li>Upload the downloaded Excel file</li>
                    <li>Copy the External System ID from the confirmation screen</li>
                    <li>Copy the Confirmation Reference number</li>
                  </ol>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-foreground">External System ID <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
                  <input className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" placeholder="e.g. EXT-2026-0041" value={externalSystemId} onChange={e => setExternalSystemId(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-foreground">Confirmation Reference <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
                  <input className="text-[13px] border border-border rounded-lg px-3 py-2 bg-background" placeholder="e.g. CONF-20260516-0041" value={confirmRef} onChange={e => setConfirmRef(e.target.value)} />
                </div>
                <Button disabled={!externalSystemId.trim() || !confirmRef.trim()} onClick={() => advanceStatus("evidence_submitted")} className="self-start gap-1.5">
                  <Upload className="w-4 h-4" /> Mark as Uploaded
                </Button>
              </div>
            )}
            {["evidence_submitted","anchors_entered","evidence_verified"].includes(taskStatus) && (
              <p className="text-[11px] text-muted-foreground">Uploaded · Ext ID: {externalSystemId} · Ref: {confirmRef}</p>
            )}
          </div>

          {/* STEP 3 — Provide Evidence */}
          <div className={`bg-card border rounded-xl p-5 ${taskStatus === "evidence_submitted" ? "border-[var(--color-lg-primary)]" : ["initialized","in_progress"].includes(taskStatus) ? "opacity-40 border-border" : "border-border"}`}>
            <div className="flex items-center gap-3 mb-3">
              {["anchors_entered","evidence_verified"].includes(taskStatus) ? <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} /> : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: taskStatus === "evidence_submitted" ? "var(--color-lg-primary)" : "var(--color-border)" }} />}
              <h3 className="text-[13px] font-bold text-foreground">Step 3 — Provide Upload Evidence</h3>
            </div>
            {taskStatus === "evidence_submitted" && (
              <div className="flex flex-col gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setEvidenceFile(e.target.files?.[0] || null)} />
                {!evidenceFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:bg-muted/20 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-[13px] font-semibold text-foreground">Drop screenshot here or click to upload</p>
                    <p className="text-[11px] text-muted-foreground">Screenshot of the external system showing the uploaded record</p>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[12px] font-medium text-foreground">{evidenceFile.name}</span>
                    <button className="ml-auto text-[11px] text-muted-foreground underline" onClick={() => setEvidenceFile(null)}>Remove</button>
                  </div>
                )}
                <Button disabled={!evidenceFile} onClick={() => advanceStatus("anchors_entered")} className="self-start gap-1.5">
                  Submit Evidence
                </Button>
              </div>
            )}
            {["anchors_entered","evidence_verified"].includes(taskStatus) && (
              <p className="text-[11px] text-muted-foreground">Evidence submitted · {evidenceFile?.name || "screenshot.png"}</p>
            )}
          </div>

          {/* STEP 4 — Verify Data */}
          <div className={`bg-card border rounded-xl p-5 ${taskStatus === "anchors_entered" ? "border-[var(--color-lg-primary)]" : ["initialized","in_progress","evidence_submitted"].includes(taskStatus) ? "opacity-40 border-border" : "border-border"}`}>
            <div className="flex items-center gap-3 mb-3">
              {taskStatus === "evidence_verified" ? <CheckCircle2 className="w-5 h-5" style={{ color:"var(--color-lg-success)" }} /> : <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: taskStatus === "anchors_entered" ? "var(--color-lg-primary)" : "var(--color-border)" }} />}
              <h3 className="text-[13px] font-bold text-foreground">Step 4 — Verify Data</h3>
            </div>
            {taskStatus === "anchors_entered" && (
              <div className="flex flex-col gap-4">
                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="font-semibold text-foreground mb-2">Export File Values</p>
                    {[["Commencement Date","2024-01-01"],["Expiration Date","2034-12-31"],["Base Rent (Annual)","$2,400,000"],["IBR Rate","4.25%"]].map(([k,v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="font-semibold text-foreground mb-2">External System Values</p>
                    {[["Commencement Date","2024-01-01"],["Expiration Date","2034-12-31"],["Base Rent (Annual)","$2,400,000"],["IBR Rate","4.25%"]].map(([k,v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-border last:border-0">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Deviation toggle */}
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <button onClick={() => setDeviationDetected(d => !d)} className="mt-0.5 shrink-0">
                    {deviationDetected
                      ? <ToggleRight className="w-5 h-5" style={{ color:"var(--color-lg-error)" }} />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-foreground">I detected a discrepancy</p>
                    {deviationDetected && (
                      <div className="mt-2">
                        <label className="text-[11px] font-semibold text-foreground">Deviation Justification <span style={{ color:"var(--color-lg-error)" }}>*</span></label>
                        <Textarea rows={3} className="mt-1 text-[12px] resize-none" placeholder="Describe the discrepancy and its business impact…" value={deviationJustification} onChange={e => setDeviationJustification(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  disabled={deviationDetected && !deviationJustification.trim()}
                  onClick={() => advanceStatus("evidence_verified")}
                  className="self-start"
                >
                  Confirm Verification
                </Button>
              </div>
            )}
            {taskStatus === "evidence_verified" && (
              <p className="text-[11px] text-muted-foreground">
                Verified · {deviationDetected ? "Deviation declared" : "No deviations"}
              </p>
            )}
          </div>

          {/* STEP 5 — Attest and Complete */}
          <div className={`bg-card border rounded-xl p-5 ${taskStatus === "evidence_verified" ? "border-[var(--color-lg-primary)]" : "opacity-40 border-border"}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: taskStatus === "evidence_verified" ? "var(--color-lg-primary)" : "var(--color-border)" }} />
              <h3 className="text-[13px] font-bold text-foreground">Step 5 — Attest and Complete</h3>
            </div>
            {taskStatus === "evidence_verified" && (
              <div className="flex flex-col gap-5">
                {/* PAC/SAC Attestation */}
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-bold text-foreground">PAC/SAC Attestation</p>
                  <div
                    ref={pacSacRef}
                    onScroll={handlePacSacScroll}
                    className="h-32 overflow-y-auto border border-border rounded-lg p-3 text-[11px] text-muted-foreground bg-muted/10 whitespace-pre-wrap leading-relaxed"
                  >
                    {PAC_SAC_TEXT}
                  </div>
                  {!pacSacScrolled && <p className="text-[11px] text-muted-foreground italic">Scroll to the bottom to enable attestation</p>}
                  <label className={`flex items-center gap-2.5 cursor-pointer ${!pacSacScrolled ? "opacity-40 pointer-events-none" : ""}`}>
                    <input type="checkbox" checked={pacSacChecked} onChange={e => setPacSacChecked(e.target.checked)} className="w-4 h-4" />
                    <span className="text-[12px] font-medium text-foreground">I, J. Martinez, confirm the above PAC/SAC attestation</span>
                  </label>
                </div>

                {/* DA Attestation */}
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-bold text-foreground">Data Accuracy Attestation</p>
                  <div
                    ref={daRef}
                    onScroll={handleDaScroll}
                    className="h-32 overflow-y-auto border border-border rounded-lg p-3 text-[11px] text-muted-foreground bg-muted/10 whitespace-pre-wrap leading-relaxed"
                  >
                    {DA_TEXT}
                  </div>
                  {!daScrolled && <p className="text-[11px] text-muted-foreground italic">Scroll to the bottom to enable attestation</p>}
                  <label className={`flex items-center gap-2.5 cursor-pointer ${!daScrolled ? "opacity-40 pointer-events-none" : ""}`}>
                    <input type="checkbox" checked={daChecked} onChange={e => setDaChecked(e.target.checked)} className="w-4 h-4" />
                    <span className="text-[12px] font-medium text-foreground">I, J. Martinez, confirm the above Data Accuracy Attestation</span>
                  </label>
                </div>

                {/* Accounting entries — FUTURE */}
                <div className="border border-dashed border-border rounded-lg p-4 flex flex-col gap-3">
                  <p className="text-[12px] font-semibold text-muted-foreground">Accounting Entries {/* FUTURE: Accounting engine integration point */}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label:"Manual Lease Liability Amount", value:manualLiability, set:setManualLiability },
                      { label:"Manual ROU Asset Amount",       value:manualRou,       set:setManualRou },
                      { label:"Manual Gain/Loss Amount",       value:manualGainLoss,  set:setManualGainLoss },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">{label}</label>
                        <input
                          className="text-[12px] border border-dashed border-border rounded-lg px-3 py-2 bg-muted/10 text-muted-foreground"
                          placeholder="$0.00"
                          value={value}
                          onChange={e => set(e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">// FUTURE: Accounting engine integration point — these values will be auto-populated by ACE</p>
                </div>

                <Button
                  disabled={!pacSacChecked || !daChecked}
                  onClick={completeTask}
                  className="self-start gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Export
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right: step rail */}
        <div className="w-48 shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-6">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Progress</p>
            <div className="flex flex-col gap-2">
              {STATUS_STEPS.filter(s => s.status !== "completed").map((step, i) => {
                const stepIndex = STATUS_STEPS.findIndex(s => s.status === step.status);
                const isDone = stepIndex < currentStepIndex;
                const isActive = step.status === taskStatus;
                return (
                  <div key={step.status} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{
                        borderColor: isDone ? "var(--color-lg-success)" : isActive ? "var(--color-lg-primary)" : "var(--color-border)",
                        background: isDone ? "var(--color-lg-success)" : isActive ? "var(--color-lg-primary)" : "transparent",
                        color: isDone || isActive ? "white" : "var(--color-muted-foreground)",
                      }}
                    >
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span
                      className="text-[11px]"
                      style={{
                        color: isActive ? "var(--color-lg-primary)" : isDone ? "var(--color-lg-success)" : "var(--color-muted-foreground)",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
