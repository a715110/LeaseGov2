/**
 * RecordsDetail — FC-5 Screen 5.3 (Master Page)
 * Screen key: records-detail
 * Route: /records/:id
 *
 * Prompt 5.3: Header with Record ID (JetBrains Mono), status badge, type,
 *   modified date, workspace, AutomationPolicyBadge, watchlist indicator.
 *   Breadcrumb: Portfolio → Contract Records → [Contract Number]
 *   Tabs: Overview · Terms · Documents · Workflow · Reassessment · History · Agent
 *
 * Lock status banner: 7 states per session spec.
 * Tab components imported from pages/contracts/propertyLease/ (converted stubs).
 *
 * Data model refs: ContractRecord, PropertyLease, ContractRecordSnapshot
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { subscribeToEvents } from "@/lib/eventBus";
import {
  ChevronRight, Star, StarOff, Lock, AlertTriangle, Bot, Clock, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_KEYS } from "@/constants/screenKeys";

// Tab components (converted from contracts/propertyLease stubs)
import RecordTabOverview      from "@/pages/contracts/propertyLease/PropertyLeaseRecordOverview";
import RecordTabTerms         from "@/pages/contracts/propertyLease/PropertyLeaseRecordTerms";
import RecordTabDocuments     from "@/pages/contracts/propertyLease/PropertyLeaseRecordDocuments";
import RecordTabWorkflow      from "@/pages/contracts/propertyLease/PropertyLeaseRecordWorkflow";
import RecordTabReassessment  from "@/pages/contracts/propertyLease/PropertyLeaseRecordReassessment";
import RecordTabHistory       from "@/pages/contracts/propertyLease/PropertyLeaseRecordHistory";
import RecordTabAgent         from "@/pages/contracts/propertyLease/PropertyLeaseRecordAgent";
import RecordTabFinancial     from "@/pages/contracts/propertyLease/PropertyLeaseRecordFinancial";
import RecordTabOpenItems     from "@/pages/contracts/propertyLease/PropertyLeaseRecordOpenItems";
import RecordTabWatchlist    from "@/pages/contracts/propertyLease/PropertyLeaseRecordWatchlist";
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

type RecordStatus = "draft" | "under_review" | "pending_approval" | "approved" | "correction_in_progress" | "completed" | "archived";
type LockStatus = "unlocked" | "pending_review" | "pending_approval" | "upload_task_active" | "correction_in_progress" | "agent_processing" | "checkpoint_pending";

// TODO: Backend integration required — GET /api/records/:id
const MOCK_RECORD = {
  id: "r1",
  contract_number: "CR-2026-0088",
  title: "Office Tower — 350 Fifth Ave",
  contract_type: "property_lease",
  status: "approved" as RecordStatus,
  lock_status: "unlocked" as LockStatus,
  workspace_tag: "Corporate HQ",
  automation_level: "collaborative",
  is_watchlisted: false,
  updated_at: "2026-05-16T11:05:00Z",
  // PropertyLease fields
  landlord_name: "Fifth Ave Properties LLC",
  tenant_name: "Acme Corporation",
  effective_date: "2022-01-01",
  commencement_date: "2022-01-01",
  expiration_date: "2032-12-31",
  rent_commencement_date: "2022-02-01",
  next_escalation_date: "2027-01-01",
  option_exercise_deadline: "2031-09-30",
  lease_term_months: 132,
  base_rent_amount: 4250000,
  base_rent_frequency: "monthly",
  escalation_type: "fixed_percentage",
  escalation_rate: 0.03,
  lease_classification: "operating",
  property_address_street: "350 Fifth Avenue, New York, NY 10118",
  rentable_area_sqft: 24500,
  suite_floor_unit: "Floors 12–14",
  property_type: "office",
  rework_iteration: 0,
  snapshot_count: 3,
};

const STATUS_BADGE: Record<RecordStatus, string> = {
  draft:                  "badge-muted",
  under_review:           "badge-processing",
  pending_approval:       "badge-warning",
  approved:               "badge-valid",
  correction_in_progress: "badge-invalid",
  completed:              "badge-valid",
  archived:               "badge-muted",
};

const STATUS_LABEL: Record<RecordStatus, string> = {
  draft:                  "Draft",
  under_review:           "Under Review",
  pending_approval:       "Pending Approval",
  approved:               "Approved",
  correction_in_progress: "Correction in Progress",
  completed:              "Completed",
  archived:               "Archived",
};

const AUTOMATION_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  full_autonomous: { label:"Full Autonomous", color:"#7c3aed", bg:"#f5f3ff" },
  collaborative:   { label:"Collaborative",   color:"var(--color-lg-primary)", bg:"var(--color-lg-accent-subtle)" },
  full_manual:     { label:"Full Manual",     color:"var(--color-lg-info)",    bg:"var(--color-lg-info-subtle)" },
};

const LOCK_BANNER: Record<LockStatus, { text: string; color: string; bg: string; border: string } | null> = {
  unlocked:               null,
  pending_review:         { text:"Under Review — editing disabled",          color:"var(--color-lg-warning)", bg:"var(--color-lg-warning-subtle)", border:"var(--color-lg-warning)" },
  pending_approval:       { text:"Pending Final Approval — editing disabled", color:"var(--color-lg-warning)", bg:"var(--color-lg-warning-subtle)", border:"var(--color-lg-warning)" },
  upload_task_active:     { text:"Export in progress — editing disabled",    color:"var(--color-lg-info)",    bg:"var(--color-lg-info-subtle)",    border:"var(--color-lg-info)" },
  correction_in_progress: { text:"Correction in progress",                   color:"#ea580c",                 bg:"#fff7ed",                        border:"#ea580c" },
  agent_processing:       { text:"Agent processing — standby",               color:"var(--color-lg-info)",    bg:"var(--color-lg-info-subtle)",    border:"var(--color-lg-info)" },
  checkpoint_pending:     { text:"Checkpoint awaiting response",             color:"#ca8a04",                 bg:"#fefce8",                        border:"#ca8a04" },
};

const TABS = [
  { id:"overview",     label:"Overview" },
  { id:"financial",    label:"Financial" },
  { id:"documents",    label:"Documents" },
  { id:"history",      label:"History" },
  { id:"reassessment", label:"Reassessment" },
  { id:"open_items",   label:"Open Items" },
  { id:"watchlist",    label:"Watchlist" },
  { id:"terms",        label:"Terms" },
  { id:"workflow",     label:"Workflow" },
  { id:"agent",        label:"Agent" },
];

export default function RecordsDetail() {
  const _screenKey = SCREEN_KEYS.RECORDS_DETAIL;
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordId = params.id || "r1";

  const [record, setRecord] = useState({ ...MOCK_RECORD, id: recordId });
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const lockBanner = LOCK_BANNER[record.lock_status];
  const automationStyle = AUTOMATION_BADGE[record.automation_level] || AUTOMATION_BADGE.full_manual;

  // Listen for task lifecycle events to drive the lock banner
  useEffect(() => {
    return subscribeToEvents((event) => {
      const p = event.payload as { record_id?: string };
      const matches = !p.record_id || p.record_id === recordId || p.record_id === 'r1';
      if (!matches) return;
      if (event.type === 'SUBMIT_FOR_REVIEW') {
        setRecord(r => ({ ...r, lock_status: 'pending_review' as LockStatus }));
      } else if (event.type === 'REVIEW_OPENED') {
        setRecord(r => ({ ...r, lock_status: 'pending_review' as LockStatus }));
      } else if (event.type === 'REVIEW_COMPLETED') {
        setRecord(r => ({ ...r, lock_status: 'pending_approval' as LockStatus }));
      } else if (event.type === 'APPROVE_FOR_FINAL') {
        setRecord(r => ({ ...r, lock_status: 'pending_approval' as LockStatus }));
      } else if (event.type === 'RECORD_APPROVED') {
        setRecord(r => ({ ...r, lock_status: 'unlocked' as LockStatus }));
      } else if (event.type === 'DECLINE_SUBMITTED') {
        setRecord(r => ({ ...r, lock_status: 'unlocked' as LockStatus }));
      } else if (event.type === 'UPLOAD_TASK_STARTED') {
        setRecord(r => ({ ...r, lock_status: 'upload_task_active' as LockStatus }));
      } else if (event.type === 'UPLOAD_TASK_COMPLETED') {
        setRecord(r => ({ ...r, lock_status: 'unlocked' as LockStatus }));
      }
    });
  }, [recordId]);

  // Sync active tab with browser back/forward navigation.
  // The tab click handler uses pushState so each tab click is a discrete history
  // entry. popstate fires on browser back/forward; reading ?tab= from the
  // restored URL keeps the tab bar in sync.
  useEffect(() => {
    function handlePopState() {
      const tab = new URLSearchParams(window.location.search).get('tab') || 'overview';
      setActiveTab(tab);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function toggleWatchlist() {
    setRecord(r => ({ ...r, is_watchlisted: !r.is_watchlisted }));
  }

  function renderTab() {
    switch (activeTab) {
      case "overview":     return <RecordTabOverview record={record} onWatchlistToggle={toggleWatchlist} />;
      case "terms":        return <RecordTabTerms recordId={recordId} />;
      case "documents":    return <RecordTabDocuments recordId={recordId} />;
      case "workflow":     return <RecordTabWorkflow recordId={recordId} />;
      case "reassessment": return <RecordTabReassessment recordId={recordId} />;
      case "history":      return <RecordTabHistory recordId={recordId} />;
      case "agent":        return <RecordTabAgent recordId={recordId} />;
      case "financial":    return <RecordTabFinancial recordId={recordId} />;
      case "open_items":   return <RecordTabOpenItems recordId={recordId} />;
      case "watchlist":    return <RecordTabWatchlist recordId={recordId} isWatchlisted={record.is_watchlisted} onWatchlistToggle={toggleWatchlist} />;
      default:             return null;
    }
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-[var(--color-lg-page-bg)]">
      {/* Lock status banner */}
      {lockBanner && (
        <div
          className="flex items-center gap-3 px-6 py-2.5 text-[13px] font-medium"
          style={{ background:lockBanner.bg, borderBottom:`2px solid ${lockBanner.border}`, color:lockBanner.color }}
        >
          <Lock className="w-4 h-4 shrink-0" />
          {lockBanner.text}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 pt-4 pb-0 text-[12px] text-muted-foreground">
        <span className="hover:text-foreground cursor-pointer" onClick={() => navigate("/records/dashboard")}>Portfolio</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:text-foreground cursor-pointer" onClick={() => navigate("/records")}>Contract Records</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{record.contract_number}</span>
      </div>

      {/* Record header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-mono text-[20px] font-bold text-foreground">{record.contract_number}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold ${STATUS_BADGE[record.status]}`}>
              {STATUS_LABEL[record.status]}
            </span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded text-[12px] font-semibold border"
              style={{ color:automationStyle.color, background:automationStyle.bg, borderColor:automationStyle.color }}
            >
              {automationStyle.label}
            </span>
            {record.is_watchlisted && (
              <Star className="w-4 h-4" style={{ color:"var(--color-lg-warning)" }} />
            )}
          </div>
          <p className="text-[15px] text-foreground font-medium">{record.title}</p>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
            <span>Workspace: <strong className="text-foreground">{record.workspace_tag}</strong></span>
            <span>·</span>
            <span>Type: <strong className="text-foreground capitalize">{record.contract_type.replace(/_/g, " ")}</strong></span>
            <span>·</span>
            <span>Updated: <strong className="text-foreground">{new Date(record.updated_at).toLocaleDateString("en-US", { dateStyle:"medium" })}</strong></span>
            <span>·</span>
            <span>{record.snapshot_count} snapshots</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-[12px]"
            onClick={() => navigate(`/records/${recordId}/correction`)}
          >
            <Edit3 className="w-3.5 h-3.5" /> Initiate Correction
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-card">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-lg-primary)] text-[var(--color-lg-primary)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              const url = new URL(window.location.href);
              url.searchParams.set('tab', tab.id);
              // pushState makes each tab a navigable history entry so the
              // browser back button can step through individual tab visits.
              window.history.pushState(null, '', url.toString());
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {renderTab()}
      </div>
    </div>
  );
}
