/**
 * ExtractionReprocessing — FC-2 Screen 2.9
 * Screen key: extraction-reprocessing
 * Route: /extraction/reprocess
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.9: Modal (500px) for re-processing request.
 *   Per-page OCR bar chart (pages 1-8 success, 9-10 warning, 11-12 error).
 *   Reason textarea. Flagged pages list. Preservation note.
 *   Buttons: Request Re-Processing primary, Cancel outlined.
 * Data model refs: DocumentJob (ocr_confidence_avg, page_count),
 *                  ExtractionRecord (rework_iteration)
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, BarChart2, Flag, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

interface PageData { page: number; confidence: number; flagged: boolean; }

// TODO: Backend integration required — GET /api/document-jobs/:id/ocr-pages
const PAGES: PageData[] = [
  { page:1,  confidence:0.97, flagged:false },
  { page:2,  confidence:0.95, flagged:false },
  { page:3,  confidence:0.93, flagged:false },
  { page:4,  confidence:0.91, flagged:false },
  { page:5,  confidence:0.94, flagged:false },
  { page:6,  confidence:0.96, flagged:false },
  { page:7,  confidence:0.92, flagged:false },
  { page:8,  confidence:0.95, flagged:false },
  { page:9,  confidence:0.72, flagged:true  },
  { page:10, confidence:0.68, flagged:true  },
  { page:11, confidence:0.41, flagged:true  },
  { page:12, confidence:0.38, flagged:true  },
];

function getBarColor(c: number) {
  if (c >= 0.90) return "var(--color-lg-success)";
  if (c >= 0.60) return "var(--color-lg-warning)";
  return "var(--color-lg-error)";
}
function getConfClass(c: number) {
  if (c >= 0.90) return "confidence-high";
  if (c >= 0.60) return "confidence-medium";
  return "confidence-low";
}

export default function ExtractionReprocessing() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_REPROCESSING;
  const [, navigate] = useLocation();
  const [reason, setReason] = useState("");
  const [flaggedPages, setFlaggedPages] = useState<Set<number>>(new Set(PAGES.filter(p => p.flagged).map(p => p.page)));
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = reason.trim().length > 10 && flaggedPages.size > 0;

  function togglePage(page: number) {
    setFlaggedPages(prev => { const n = new Set(prev); n.has(page) ? n.delete(page) : n.add(page); return n; });
  }

  function handleSubmit() {
    // TODO: Backend integration required — POST /api/document-jobs/:id/reprocess
    setSubmitted(true);
    setTimeout(() => navigate("/extraction/queue"), 1800);
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)] items-center justify-center p-6">
      <div className="w-full max-w-[500px] rounded-xl bg-card border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--color-lg-warning)]" />
            <h2 className="text-[16px] font-semibold text-foreground">Request Re-Processing</h2>
          </div>
          <button onClick={() => navigate("/extraction/verify")} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-lg-success)]/10 flex items-center justify-center">
              <Flag className="w-7 h-7 text-[var(--color-lg-success)]" />
            </div>
            <p className="text-[15px] font-semibold text-foreground">Re-Processing Requested</p>
            <p className="text-[13px] text-muted-foreground">Returning to queue…</p>
          </div>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* OCR bar chart */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-primary" />
                <p className="text-[13px] font-semibold text-foreground">OCR Confidence per Page</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {PAGES.map(p => (
                  <div key={p.page} className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground w-10 shrink-0">Pg {p.page}</span>
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${p.confidence * 100}%`, backgroundColor: getBarColor(p.confidence) }} />
                    </div>
                    <span className={`text-[11px] font-semibold w-10 text-right px-1.5 py-0.5 rounded ${getConfClass(p.confidence)}`}>
                      {Math.round(p.confidence * 100)}%
                    </span>
                    {p.flagged && <Flag className="w-3.5 h-3.5 text-[var(--color-lg-error)] shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Flagged pages selector */}
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-2">Flagged Pages for Re-Processing</p>
              <div className="flex flex-wrap gap-2">
                {PAGES.map(p => (
                  <label key={p.page} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={flaggedPages.has(p.page)}
                      onCheckedChange={() => togglePage(p.page)}
                      className="w-4 h-4"
                    />
                    <span className={`text-[12px] font-medium ${flaggedPages.has(p.page) ? "text-foreground" : "text-muted-foreground"}`}>
                      Pg {p.page}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-2">Reason for Re-Processing</p>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe why re-processing is required (minimum 10 characters)…"
                className="text-[13px] min-h-[80px] resize-none"
              />
            </div>

            {/* Preservation note */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-accent border border-border text-[12px] text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                All previously extracted field values and confirmed anchors will be preserved.
                Only the flagged pages will be re-processed. Extraction iteration will increment to {1 + 1}.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => navigate("/extraction/verify")}>Cancel</Button>
              <Button disabled={!canSubmit} onClick={handleSubmit} className="gap-2">
                <Flag className="w-3.5 h-3.5" />
                Request Re-Processing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
