/**
 * ExtractionQueue — FC-2 Screen 2.1
 * Screen key: extraction-processing-queue
 * Route: /extraction/queue
 * Role: Preparer
 *
 * Design: Structured Authority
 * Prompt 2.1: Filter tabs (All/Processing/OCR Complete/Warning/Failed),
 *             table with Agent column, side panel with OCR bar chart + log.
 * Data model refs: DocumentJob (status, ocr_confidence_avg),
 *                  ExtractionRecord (extraction_mode, status)
 */

import { useState } from 'react';
import {
  RefreshCw, ChevronRight, BarChart2, X, Clock,
  CheckCircle2, AlertTriangle, XCircle, Cpu, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { SCREEN_KEYS } from '@/constants/screenKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = 'processing' | 'ocr_complete' | 'warning' | 'failed';
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

// ─── Mock data — TODO: Backend integration required ───────────────────────────

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
  warning:      'badge-warning',
  failed:       'badge-invalid',
};
const STATUS_LABEL: Record<JobStatus, string> = {
  processing: 'Processing', ocr_complete: 'OCR Complete', warning: 'Warning', failed: 'Failed',
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExtractionQueue() {
  const _screenKey = SCREEN_KEYS.EXTRACTION_QUEUE;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(MOCK_JOBS[0]);

  // TODO: Backend integration required — GET /api/document-jobs
  const filtered = activeTab === 'all'
    ? MOCK_JOBS
    : MOCK_JOBS.filter(j => j.status === activeTab);

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Processing Queue</h1>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className={`flex-1 overflow-auto ${selectedJob ? '' : 'w-full'}`}>
          <table className="data-table w-full text-[13px]">
            <thead>
              <tr>
                <th className="text-left">Job ID</th>
                <th className="text-left">File Name</th>
                <th className="text-left">Batch</th>
                <th className="text-left">Status</th>
                <th className="text-left">OCR Confidence</th>
                <th className="text-left">Agent</th>
                <th className="text-left">Started</th>
                <th className="text-left">Duration</th>
                <th className="text-left">Assigned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr
                  key={job.id}
                  className={`cursor-pointer ${selectedJob?.id === job.id ? 'bg-accent/60' : ''}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="font-mono text-[12px] text-primary">{job.display_id}</td>
                  <td>
                    <span className="font-medium text-foreground truncate max-w-[180px] block" title={job.file_name}>
                      {job.file_name}
                    </span>
                  </td>
                  <td className="font-mono text-[12px] text-muted-foreground">{job.batch_ref}</td>
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
                  <td><AgentBadge status={job.agent_status} /></td>
                  <td className="font-mono text-[12px] text-muted-foreground">{job.started}</td>
                  <td className="text-muted-foreground">{job.duration}</td>
                  <td className="text-muted-foreground">{job.assigned}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px] gap-1"
                      onClick={e => { e.stopPropagation(); navigate('/extraction/understanding'); }}
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
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

            <div className="px-5 py-3 border-t border-border">
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
    </div>
  );
}
