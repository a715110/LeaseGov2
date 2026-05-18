/**
 * ReassessmentPackagePreview — FC-6 Screen 6.9
 * Screen key: reassessment-package-preview
 * Route: /reassessment/cases/:id/package
 *
 * Pre-submission package preview: all documents, memo, analysis,
 * and evidence bundled for the approver. Read-only summary.
 * "Submit for Approval" primary CTA.
 *
 * Data model refs: ReassessmentCase, ContractPackage (document list)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, CheckCircle2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
// TODO: Backend integration required — GET /api/reassessments/cases/:id/package
const MOCK_CASE = {
  id: "c7",
  case_ref: "RC-2026-0008",
  contract_number: "CR-2026-0088",
  title: "Office Tower — 350 Fifth Ave",
  path_type: "reassessment",
  trigger_type: "opt_assess",
};

const PACKAGE_DOCS = [
  { id:"d1", name:"Reassessment Memo — RC-2026-0008",       type:"memo",       status:"ready",   pages:4 },
  { id:"d2", name:"Option Assessment Record — OAR-001",     type:"assessment", status:"ready",   pages:2 },
  { id:"d3", name:"Analysis & Journal Entry",               type:"analysis",   status:"ready",   pages:3 },
  { id:"d4", name:"Revised Payment Schedule",               type:"schedule",   status:"ready",   pages:1 },
  { id:"d5", name:"Lease Agreement Amendment — AMD-003",    type:"evidence",   status:"ready",   pages:8 },
  { id:"d6", name:"IBR Confirmation — FIN-2026-Q2-IBR",     type:"evidence",   status:"ready",   pages:1 },
];

const TYPE_BADGE: Record<string, string> = {
  memo:       "badge-processing",
  assessment: "badge-warning",
  analysis:   "badge-valid",
  schedule:   "badge-muted",
  evidence:   "badge-muted",
};

const TYPE_LABEL: Record<string, string> = {
  memo:       "Memo",
  assessment: "Assessment",
  analysis:   "Analysis",
  schedule:   "Schedule",
  evidence:   "Evidence",
};

export default function ReassessmentPackagePreview() {
  const _screenKey = SCREEN_KEYS.REASSESSMENT_PACKAGE_PREVIEW;
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  // TODO: Backend integration required — POST /api/reassessments/cases/:id/submit-approval
  function handleSubmit() { setSubmitted(true); }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12" style={{ color:"var(--color-lg-success)" }} />
          <p className="text-[18px] font-bold text-foreground">Package Submitted for Approval</p>
          <p className="text-[13px] text-muted-foreground">Case {MOCK_CASE.case_ref} — {PACKAGE_DOCS.length} documents submitted.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
            <Button onClick={() => navigate("/approvals/queue")}>View Approval Queue</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] text-muted-foreground">{MOCK_CASE.case_ref}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground">{MOCK_CASE.contract_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Package Preview</h1>
            <ScreenNumberBadge screenKey="reassessment-package-preview" />
          </div>
          <p className="page-subtitle">{MOCK_CASE.title} — {PACKAGE_DOCS.length} documents ready for approval</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5 h-8 text-[12px]">
            <Download className="w-3.5 h-3.5" /> Download Package
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5 max-w-3xl">
        {/* Case summary */}
        <div className="bg-card border border-border rounded-lg p-5 grid grid-cols-3 gap-4 text-[12px]">
          <div><span className="text-muted-foreground block mb-0.5">Case Reference</span><span className="font-mono font-bold">{MOCK_CASE.case_ref}</span></div>
          <div><span className="text-muted-foreground block mb-0.5">Path Type</span><span className="font-semibold capitalize">{MOCK_CASE.path_type}</span></div>
          <div><span className="text-muted-foreground block mb-0.5">Trigger Type</span><span className="font-semibold">{MOCK_CASE.trigger_type.replace(/_/g," ")}</span></div>
        </div>

        {/* Document list */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground">Package Documents</h3>
            <span className="text-[12px] text-muted-foreground">{PACKAGE_DOCS.length} documents · {PACKAGE_DOCS.reduce((a,d) => a+d.pages,0)} pages total</span>
          </div>
          <div className="divide-y divide-border">
            {PACKAGE_DOCS.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-[11px] text-muted-foreground">{doc.pages} page{doc.pages !== 1 ? "s" : ""}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TYPE_BADGE[doc.type]}`}>
                  {TYPE_LABEL[doc.type]}
                </span>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-submission checklist */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Pre-Submission Checklist</h3>
          <div className="flex flex-col gap-2">
            {[
              "Classification decision recorded",
              "Option assessment completed (Tier 2)",
              "Analysis and journal entry prepared",
              "Memo drafted and reviewed",
              "All supporting evidence attached",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px]">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:"var(--color-lg-success)" }} />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => navigate("/reassessment/cases")}>Back to Cases</Button>
          <Button onClick={handleSubmit}>Submit for Approval</Button>
        </div>
      </div>
    </div>
  );
}
