/**
 * RecordTabDocuments — Tab component consumed by RecordsDetail
 * Converted from PropertyLeaseRecordDocuments.tsx scaffold stub.
 *
 * Prompt 5.3 Documents tab: document list from DocumentJob records,
 *   filename · role badge · upload date · OCR confidence · status badge · View button.
 *   "Add Document" CTA.
 *
 * Data model refs: StagedDocument (document_role, ocr_confidence_avg, status)
 */

import { useLocation } from "wouter";
import { FileText, Plus, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecordTabDocumentsProps {
  recordId: string;
}

// TODO: Backend integration required — GET /api/records/:id/documents
const MOCK_DOCUMENTS = [
  { id:"d1", filename:"Office-Tower-Base-Lease-2022.pdf",    role:"base_contract", upload_date:"2026-05-16", ocr_confidence:0.97, status:"submitted" },
  { id:"d2", filename:"Amendment-3-Rent-Revision-2024.pdf",  role:"amendment",     upload_date:"2026-05-16", ocr_confidence:0.94, status:"submitted" },
  { id:"d3", filename:"Exhibit-A-Floor-Plan.pdf",            role:"exhibit",       upload_date:"2026-05-16", ocr_confidence:0.88, status:"submitted" },
  { id:"d4", filename:"Schedule-1-Rent-Schedule.pdf",        role:"schedule",      upload_date:"2026-05-15", ocr_confidence:0.91, status:"submitted" },
  { id:"d5", filename:"Notice-of-Commencement-2022.pdf",     role:"notice",        upload_date:"2026-05-14", ocr_confidence:0.85, status:"submitted" },
];

const ROLE_LABEL: Record<string, string> = {
  base_contract:"Base Contract", amendment:"Amendment", addendum:"Addendum",
  exhibit:"Exhibit", schedule:"Schedule", notice:"Notice", supporting:"Supporting", unknown:"Unknown",
};

const STATUS_BADGE: Record<string, string> = {
  submitted:"badge-valid", valid:"badge-valid", warning:"badge-warning",
  invalid:"badge-invalid", uploaded:"badge-muted", validating:"badge-processing",
};

export default function RecordTabDocuments({ recordId }: RecordTabDocumentsProps) {
  const [, navigate] = useLocation();

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-foreground">Documents ({MOCK_DOCUMENTS.length})</h3>
        <Button size="sm" className="gap-1.5 h-8 text-[12px]" onClick={() => navigate(`/records/${recordId}/add-document`)}>
          <Plus className="w-3.5 h-3.5" /> Add Document
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="data-table w-full text-[13px]">
          <thead>
            <tr>
              <th className="text-left">Filename</th>
              <th className="text-left">Role</th>
              <th className="text-left">Upload Date</th>
              <th className="text-left">OCR Confidence</th>
              <th className="text-left">Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENTS.map(doc => {
              const pct = Math.round(doc.ocr_confidence * 100);
              const confColor = pct >= 90 ? "var(--color-lg-success)" : pct >= 70 ? "var(--color-lg-warning)" : "var(--color-lg-error)";
              return (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate max-w-[260px]">{doc.filename}</span>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                      {ROLE_LABEL[doc.role] || doc.role}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{doc.upload_date}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width:`${pct}%`, backgroundColor:confColor }} />
                      </div>
                      <span className="text-[11px] font-mono" style={{ color:confColor }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_BADGE[doc.status] || "badge-muted"}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
