/**
 * SuperAdminScreenRegistry — FC-10 SA.5
 * Screen key: superadmin-screen-registry
 * Route: /superadmin/screen-registry
 *
 * Full screen registry management:
 * - 4 summary stat cards
 * - Filter bar: phase pills, status pills, cluster dropdown, search
 * - Registry table: display_name + screen_key, route, phase badge,
 *   3-state status toggle, roles, cluster, dependencies, overrides count
 * - Override Panel (400px right slide-in)
 * - Phase Activation Dialog
 */

import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, Check, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import NotFound from '@/pages/NotFound';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

type ScreenPhase = 'mvp' | 'phase_2' | 'phase_3';
type ScreenStatus = 'active' | 'hidden' | 'development';

interface ScreenDef {
  screen_key: string;
  display_name: string;
  route_path: string;
  phase: ScreenPhase;
  status: ScreenStatus;
  role_access: string[];
  feature_cluster: string;
  dependency_screen_keys: string[];
  is_system_screen: boolean;
  override_count: number;
}

// TODO: Backend integration required — GET /superadmin/screen-registry
const MOCK_SCREENS: ScreenDef[] = [
  { screen_key:'pipeline-dashboard',         display_name:'Pipeline Dashboard',           route_path:'/pipeline/dashboard',          phase:'mvp',     status:'active',      role_access:['document_submitter','preparer','reviewer','lease_admin'],  feature_cluster:'FC-1',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'pipeline-upload',            display_name:'Upload & Validate',            route_path:'/pipeline/upload',             phase:'mvp',     status:'active',      role_access:['document_submitter','preparer'],                           feature_cluster:'FC-1',  dependency_screen_keys:['pipeline-dashboard'], is_system_screen:false, override_count:0 },
  { screen_key:'pipeline-validation',        display_name:'Validation Detail',            route_path:'/pipeline/validation',         phase:'mvp',     status:'active',      role_access:['document_submitter','preparer'],                           feature_cluster:'FC-1',  dependency_screen_keys:['pipeline-upload'],    is_system_screen:false, override_count:0 },
  { screen_key:'pipeline-review-grouping',   display_name:'Review & Grouping',            route_path:'/pipeline/review',             phase:'mvp',     status:'active',      role_access:['preparer'],                                               feature_cluster:'FC-1',  dependency_screen_keys:['pipeline-validation'],is_system_screen:false, override_count:0 },
  { screen_key:'pipeline-submit-confirm',    display_name:'Submit Confirmation',          route_path:'/pipeline/confirm',            phase:'mvp',     status:'active',      role_access:['preparer'],                                               feature_cluster:'FC-1',  dependency_screen_keys:['pipeline-review-grouping'], is_system_screen:false, override_count:0 },
  { screen_key:'extraction-queue',           display_name:'Extraction Queue',             route_path:'/extraction/queue',            phase:'mvp',     status:'active',      role_access:['preparer','reviewer','lease_admin'],                       feature_cluster:'FC-2',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'extraction-ai-workspace',    display_name:'AI Extraction Workspace',      route_path:'/extraction/ai-workspace',     phase:'mvp',     status:'active',      role_access:['preparer'],                                               feature_cluster:'FC-2',  dependency_screen_keys:['extraction-queue'],  is_system_screen:false, override_count:2 },
  { screen_key:'extraction-manual-workspace',display_name:'Manual Extraction Workspace',  route_path:'/extraction/manual-workspace', phase:'mvp',     status:'active',      role_access:['preparer'],                                               feature_cluster:'FC-2',  dependency_screen_keys:['extraction-queue'],  is_system_screen:false, override_count:0 },
  { screen_key:'extraction-verification',    display_name:'Verification Gate',            route_path:'/extraction/verification',     phase:'mvp',     status:'active',      role_access:['reviewer'],                                               feature_cluster:'FC-2',  dependency_screen_keys:['extraction-ai-workspace'], is_system_screen:false, override_count:0 },
  { screen_key:'packages-composition',       display_name:'Package Composition',          route_path:'/packages/:contractId',        phase:'mvp',     status:'active',      role_access:['preparer','reviewer'],                                     feature_cluster:'FC-3',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'packages-flags',             display_name:'Package Flags',                route_path:'/packages/:packageId/flags',   phase:'mvp',     status:'active',      role_access:['preparer','reviewer'],                                     feature_cluster:'FC-3',  dependency_screen_keys:['packages-composition'], is_system_screen:false, override_count:0 },
  { screen_key:'packages-reassembly',        display_name:'Package Re-Assembly',          route_path:'/packages/:packageId/reassembly', phase:'mvp',  status:'active',      role_access:['preparer','reviewer'],                                     feature_cluster:'FC-3',  dependency_screen_keys:['packages-composition'], is_system_screen:false, override_count:0 },
  { screen_key:'approvals-queue',            display_name:'Approvals Queue',              route_path:'/approvals/queue',             phase:'mvp',     status:'active',      role_access:['approver','reviewer','lease_admin'],                       feature_cluster:'FC-4',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'approvals-review',           display_name:'Reviewer Dialog',              route_path:'/approvals/review/:id',        phase:'mvp',     status:'active',      role_access:['reviewer'],                                               feature_cluster:'FC-4',  dependency_screen_keys:['approvals-queue'],   is_system_screen:false, override_count:0 },
  { screen_key:'approvals-approver',          display_name:'Approver Dialog',              route_path:'/approvals/final/:id',         phase:'mvp',     status:'active',      role_access:['approver'],                                               feature_cluster:'FC-4',  dependency_screen_keys:['approvals-review'],  is_system_screen:false, override_count:0 },
  { screen_key:'approvals-recall',            display_name:'Recall Confirmation',          route_path:'/approvals/recall',            phase:'mvp',     status:'active',      role_access:['preparer','reviewer','lease_admin'],                       feature_cluster:'FC-4',  dependency_screen_keys:['approvals-queue'],   is_system_screen:false, override_count:0 },
  { screen_key:'approvals-rework',            display_name:'Rework Instructions',          route_path:'/approvals/rework',            phase:'mvp',     status:'active',      role_access:['preparer'],                                               feature_cluster:'FC-4',  dependency_screen_keys:['approvals-queue'],   is_system_screen:false, override_count:0 },
  { screen_key:'records-dashboard',          display_name:'Records Dashboard',            route_path:'/records/dashboard',           phase:'mvp',     status:'active',      role_access:['preparer','reviewer','approver','accountant','controller','auditor','lease_admin'], feature_cluster:'FC-5', dependency_screen_keys:[], is_system_screen:false, override_count:0 },
  { screen_key:'records-detail',             display_name:'Contract Record Detail',       route_path:'/records/:id',                 phase:'mvp',     status:'active',      role_access:['preparer','reviewer','approver','accountant','controller','auditor','lease_admin'], feature_cluster:'FC-5', dependency_screen_keys:['records-dashboard'], is_system_screen:false, override_count:1 },
  { screen_key:'reassessment-dashboard',     display_name:'Reassessment Hub',             route_path:'/reassessment/dashboard',      phase:'mvp',     status:'active',      role_access:['reviewer','approver','controller','auditor','lease_admin'], feature_cluster:'FC-6',  dependency_screen_keys:[],                                        is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-watchlist',     display_name:'Watchlist Management',         route_path:'/reassessment/watchlist',      phase:'mvp',     status:'active',      role_access:['controller','auditor','lease_admin'],                      feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-dashboard'],                is_system_screen:false, override_count:1 },
  { screen_key:'reassessment-case-list',     display_name:'Case List',                    route_path:'/reassessment/cases',          phase:'mvp',     status:'active',      role_access:['reviewer','approver','controller','auditor','lease_admin'], feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-dashboard'],                is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-classification',display_name:'Case Classification',          route_path:'/reassessment/cases/:id/classify', phase:'mvp', status:'active',    role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-case-list'],                is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-assessment',    display_name:'Option Exercise Assessment',   route_path:'/reassessment/cases/:id/assessment', phase:'mvp', status:'active', role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-classification'],           is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-analysis',      display_name:'Analysis & Memo',              route_path:'/reassessment/cases/:id/analysis', phase:'mvp', status:'active',   role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-assessment'],               is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-memo',          display_name:'Reassessment Memo',            route_path:'/reassessment/cases/:id/memo', phase:'mvp',   status:'active',      role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-analysis'],                 is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-package-preview',display_name:'Package Preview',             route_path:'/reassessment/cases/:id/package', phase:'mvp', status:'active',    role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-memo'],                     is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-remediation',   display_name:'Remediation Workspace',        route_path:'/reassessment/cases/:id/remediation', phase:'mvp', status:'active', role_access:['controller','lease_admin'],                                feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-classification'],           is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-survey-intake', display_name:'Survey Intake',                route_path:'/reassessment/survey-intake',  phase:'mvp',     status:'active',      role_access:['preparer','lease_admin'],                                  feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-dashboard'],                is_system_screen:false, override_count:0 },
  { screen_key:'reassessment-trigger',       display_name:'Trigger New Case',             route_path:'/reassessment/trigger',        phase:'mvp',     status:'active',      role_access:['reviewer','controller','lease_admin'],                     feature_cluster:'FC-6',  dependency_screen_keys:['reassessment-dashboard'],                is_system_screen:false, override_count:0 },
  { screen_key:'export-template-selection',  display_name:'Export Template Selection',    route_path:'/export/templates',            phase:'mvp',     status:'active',      role_access:['accountant','controller','lease_admin'],                   feature_cluster:'FC-7',  dependency_screen_keys:[],                          is_system_screen:false, override_count:0 },
  { screen_key:'export-staging',             display_name:'Export Staging',               route_path:'/export/staging',              phase:'mvp',     status:'active',      role_access:['accountant','controller','lease_admin'],                   feature_cluster:'FC-7',  dependency_screen_keys:['export-template-selection'], is_system_screen:false, override_count:0 },
  { screen_key:'export-preflight',           display_name:'Pre-Flight Validation',        route_path:'/export/preflight',            phase:'mvp',     status:'active',      role_access:['accountant','controller','lease_admin'],                   feature_cluster:'FC-7',  dependency_screen_keys:['export-staging'],            is_system_screen:false, override_count:0 },
  { screen_key:'export-upload-task',         display_name:'Upload Task',                  route_path:'/export/tasks/:id',            phase:'mvp',     status:'active',      role_access:['accountant','controller'],                                 feature_cluster:'FC-7',  dependency_screen_keys:['export-preflight'],          is_system_screen:false, override_count:0 },
  { screen_key:'admin-users',                display_name:'User Management',              route_path:'/admin/users',                 phase:'mvp',     status:'active',      role_access:['lease_admin'],                                             feature_cluster:'FC-8',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'admin-schema',               display_name:'Schema Management',            route_path:'/admin/schema',                phase:'mvp',     status:'active',      role_access:['lease_admin'],                                             feature_cluster:'FC-8',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'admin-templates',            display_name:'Template Management',          route_path:'/admin/templates',             phase:'mvp',     status:'active',      role_access:['lease_admin'],                                             feature_cluster:'FC-8',  dependency_screen_keys:['admin-schema'],      is_system_screen:false, override_count:0 },
  { screen_key:'admin-thresholds',           display_name:'Threshold Configuration',      route_path:'/admin/thresholds',            phase:'mvp',     status:'active',      role_access:['lease_admin','auditor'],                                   feature_cluster:'FC-8',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'admin-audit-log',            display_name:'Audit Log Viewer',             route_path:'/admin/audit',                 phase:'mvp',     status:'active',      role_access:['lease_admin','auditor'],                                   feature_cluster:'FC-8',  dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  { screen_key:'admin-notifications',        display_name:'Notification Preferences',     route_path:'/admin/notifications',         phase:'mvp',     status:'active',      role_access:['preparer','reviewer','approver','accountant','controller','auditor','lease_admin'], feature_cluster:'FC-8', dependency_screen_keys:[], is_system_screen:false, override_count:0 },
  { screen_key:'admin-automation-config',    display_name:'Automation Configuration',     route_path:'/admin/automation',            phase:'phase_2', status:'development', role_access:['lease_admin'],                                             feature_cluster:'FC-8',  dependency_screen_keys:['admin-thresholds'],  is_system_screen:false, override_count:0 },
  { screen_key:'platform-not-authorized',    display_name:'Not Authorized',               route_path:'/platform/not-authorized',     phase:'mvp',     status:'active',      role_access:[],                                                          feature_cluster:'FC-10', dependency_screen_keys:[],                    is_system_screen:true,  override_count:0 },
  { screen_key:'superadmin-tenant-list',     display_name:'Tenant List',                  route_path:'/superadmin/tenants',          phase:'mvp',     status:'active',      role_access:[],                                                          feature_cluster:'FC-10', dependency_screen_keys:[],                    is_system_screen:false, override_count:0 },
  // Phase 2 samples
  { screen_key:'records-correction',         display_name:'Record Correction',            route_path:'/records/:id/correction',      phase:'phase_2', status:'development', role_access:['controller','lease_admin'],                                feature_cluster:'FC-5',  dependency_screen_keys:['records-detail'],    is_system_screen:false, override_count:0 },
  { screen_key:'records-snapshot-viewer',    display_name:'Snapshot Viewer',              route_path:'/records/:id/snapshots',       phase:'phase_2', status:'development', role_access:['auditor','controller'],                                    feature_cluster:'FC-5',  dependency_screen_keys:['records-detail'],    is_system_screen:false, override_count:0 },
  { screen_key:'records-add-document',       display_name:'Add Document to Record',       route_path:'/records/:id/add-document',    phase:'mvp',     status:'active',      role_access:['preparer','lease_admin'],                                  feature_cluster:'FC-5',  dependency_screen_keys:['records-detail'],    is_system_screen:false, override_count:0 },
  { screen_key:'records-deferred-tracker',   display_name:'Deferred Fields Tracker',      route_path:'/records/:id/deferred',        phase:'mvp',     status:'active',      role_access:['preparer','reviewer','lease_admin'],                       feature_cluster:'FC-5',  dependency_screen_keys:['records-detail'],    is_system_screen:false, override_count:0 },
  { screen_key:'extraction-reprocessing',    display_name:'Reprocessing Modal',           route_path:'/extraction/reprocessing',     phase:'phase_2', status:'development', role_access:['preparer','lease_admin'],                                  feature_cluster:'FC-2',  dependency_screen_keys:['extraction-queue'],  is_system_screen:false, override_count:0 },
  // FC-9: AI Agents and Automation
  { screen_key:'agent-checkpoint-queue',     display_name:'Checkpoint Queue',             route_path:'/approvals/checkpoints',       phase:'phase_2', status:'development', role_access:['preparer','reviewer','approver','lease_admin','controller'], feature_cluster:'FC-9',  dependency_screen_keys:['approvals-queue'],   is_system_screen:false, override_count:0 },
  { screen_key:'agent-activity-monitor',     display_name:'Agent Activity Monitor',       route_path:'/agents/monitor',              phase:'phase_2', status:'development', role_access:['preparer','lease_admin','controller'],                      feature_cluster:'FC-9',  dependency_screen_keys:['records-dashboard'], is_system_screen:false, override_count:0 },
];

const PHASE_BADGE: Record<ScreenPhase, { cls: string; label: string }> = {
  mvp:     { cls: 'badge-processing', label: 'MVP' },
  phase_2: { cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Phase 2' },
  phase_3: { cls: 'badge-muted', label: 'Phase 3' },
};

const STATUS_STYLE: Record<ScreenStatus, { cls: string; label: string }> = {
  active:      { cls: 'badge-valid',    label: 'Active' },
  hidden:      { cls: 'badge-muted',    label: 'Hidden' },
  development: { cls: 'badge-warning',  label: 'Dev' },
};

const CLUSTER_LIST = ['All','FC-1','FC-2','FC-3','FC-4','FC-5','FC-6','FC-7','FC-8','FC-9','FC-10'];

interface OverrideEntry {
  id: string;
  org_name: string;
  status: 'active' | 'hidden';
  reason: string;
  expires_at: string | null;
}

const MOCK_OVERRIDES: Record<string, OverrideEntry[]> = {
  'extraction-ai-workspace': [
    { id:'ov1', org_name:'Meridian Property Group', status:'active', reason:'Early access pilot', expires_at:'2026-12-31' },
    { id:'ov2', org_name:'Nexus Urban Development',  status:'active', reason:'Beta testing',       expires_at:null },
  ],
  'records-detail': [
    { id:'ov3', org_name:'Coastal Realty Partners', status:'hidden', reason:'Pending compliance review', expires_at:'2026-06-30' },
  ],
  'reassessment-watchlist': [
    { id:'ov4', org_name:'Meridian Property Group', status:'active', reason:'Enterprise feature unlock', expires_at:null },
  ],
};

export default function SuperAdminScreenRegistry() {
  const _screenKey = SCREEN_KEYS.SUPERADMIN_SCREEN_REGISTRY;
  const isSuperAdmin = true; // TODO: Backend integration required
  if (!isSuperAdmin) return <NotFound />;

  const [screens, setScreens] = useState<ScreenDef[]>(MOCK_SCREENS);
  const [phaseFilter, setPhaseFilter] = useState<ScreenPhase | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ScreenStatus | 'all'>('all');
  const [clusterFilter, setClusterFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [overridePanel, setOverridePanel] = useState<string | null>(null); // screen_key
  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [phaseTarget, setPhaseTarget] = useState<'phase_2' | 'phase_3'>('phase_2');
  const [newOverride, setNewOverride] = useState({ org_name:'', status:'active' as 'active'|'hidden', reason:'', expires_at:'' });
  const [overrides, setOverrides] = useState<Record<string, OverrideEntry[]>>(MOCK_OVERRIDES);

  const filtered = useMemo(() => screens.filter(s => {
    if (phaseFilter !== 'all' && s.phase !== phaseFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (clusterFilter !== 'All' && s.feature_cluster !== clusterFilter) return false;
    if (search && !s.display_name.toLowerCase().includes(search.toLowerCase()) &&
        !s.screen_key.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [screens, phaseFilter, statusFilter, clusterFilter, search]);

  const stats = {
    total: screens.length,
    active: screens.filter(s => s.status === 'active').length,
    hidden: screens.filter(s => s.status === 'hidden').length,
    development: screens.filter(s => s.status === 'development').length,
    mvp_active: screens.filter(s => s.phase === 'mvp' && s.status === 'active').length,
    phase2_active: screens.filter(s => s.phase === 'phase_2' && s.status === 'active').length,
  };

  function cycleStatus(key: string) {
    setScreens(prev => prev.map(s => {
      if (s.screen_key !== key || s.is_system_screen) return s;
      const order: ScreenStatus[] = ['active','hidden','development'];
      const next = order[(order.indexOf(s.status) + 1) % order.length];
      return { ...s, status: next };
    }));
  }

  const panelScreen = overridePanel ? screens.find(s => s.screen_key === overridePanel) : null;
  const panelOverrides = overridePanel ? (overrides[overridePanel] ?? []) : [];

  function removeOverride(screenKey: string, id: string) {
    setOverrides(prev => ({ ...prev, [screenKey]: (prev[screenKey] ?? []).filter(o => o.id !== id) }));
  }

  function addOverride(screenKey: string) {
    if (!newOverride.org_name || !newOverride.reason) return;
    const entry: OverrideEntry = { id: `ov${Date.now()}`, ...newOverride, expires_at: newOverride.expires_at || null };
    setOverrides(prev => ({ ...prev, [screenKey]: [...(prev[screenKey] ?? []), entry] }));
    setNewOverride({ org_name:'', status:'active', reason:'', expires_at:'' });
  }

  // Phase activation preflight
  const phase2Screens = screens.filter(s => s.phase === 'phase_2');
  const phase2Activatable = phase2Screens.filter(s =>
    s.dependency_screen_keys.every(dep => screens.find(d => d.screen_key === dep)?.status === 'active')
  );
  const phase2Skipped = phase2Screens.filter(s =>
    !s.dependency_screen_keys.every(dep => screens.find(d => d.screen_key === dep)?.status === 'active')
  );

  function activatePhase() {
    setScreens(prev => prev.map(s => {
      if (s.phase !== 'phase_2') return s;
      const canActivate = s.dependency_screen_keys.every(dep => prev.find(d => d.screen_key === dep)?.status === 'active');
      return canActivate ? { ...s, status: 'active' } : s;
    }));
    setShowPhaseDialog(false);
  }

  return (
    <div className="flex flex-col min-h-screen relative" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />

      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>Screen Registry</h1>
            <ScreenNumberBadge screenKey="superadmin-screen-registry" />
          </div>
          <p className="page-subtitle">Manage platform screen activation, visibility, and tenant overrides</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" className="h-9 text-[12px] gap-1.5 pr-8"
              onClick={() => setShowPhaseDialog(true)}>
              Activate Phase <ChevronDown className="w-3.5 h-3.5 absolute right-2" />
            </Button>
          </div>
          <Button variant="outline" className="h-9 text-[12px] gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Screens', value: stats.total,       color: 'var(--color-foreground)' },
            { label: 'Active',        value: stats.active,      color: 'var(--color-lg-success)' },
            { label: 'Hidden',        value: stats.hidden,      color: 'var(--color-muted-foreground)' },
            { label: 'Development',   value: stats.development, color: 'var(--color-lg-warning)' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
              {s.label === 'Total Screens' && (
                <p className="text-[10px] text-muted-foreground mt-1">MVP {stats.mvp_active}/{screens.filter(s=>s.phase==='mvp').length} · Phase 2 {stats.phase2_active}/{screens.filter(s=>s.phase==='phase_2').length} · Phase 3 — future</p>
              )}
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['all','mvp','phase_2','phase_3'] as const).map(v => (
              <button key={v} onClick={() => setPhaseFilter(v)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                style={{
                  borderColor: phaseFilter === v ? 'var(--color-lg-primary)' : 'var(--color-border)',
                  background: phaseFilter === v ? 'var(--color-lg-primary)' : 'transparent',
                  color: phaseFilter === v ? 'white' : 'var(--color-muted-foreground)',
                }}>
                {v === 'all' ? 'All Phases' : v === 'mvp' ? 'MVP' : v === 'phase_2' ? 'Phase 2' : 'Phase 3'}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['all','active','hidden','development'] as const).map(v => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize transition-all"
                style={{
                  borderColor: statusFilter === v ? 'var(--color-lg-primary)' : 'var(--color-border)',
                  background: statusFilter === v ? 'var(--color-lg-primary)' : 'transparent',
                  color: statusFilter === v ? 'white' : 'var(--color-muted-foreground)',
                }}>
                {v === 'all' ? 'All Status' : v}
              </button>
            ))}
          </div>
          <select className="h-8 rounded-lg border border-border bg-background text-[12px] px-2"
            value={clusterFilter} onChange={e => setClusterFilter(e.target.value)}>
            {CLUSTER_LIST.map(c => <option key={c} value={c}>{c === 'All' ? 'All Clusters' : c}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-9 h-8 text-[12px] w-56" placeholder="Search screens or keys…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-[11px] text-muted-foreground ml-auto">{filtered.length} screens</span>
        </div>

        {/* Registry table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="data-table w-full text-[12px]">
            <thead>
              <tr>
                <th className="text-left min-w-[200px]">Screen</th>
                <th className="text-left">Route</th>
                <th className="text-left">Phase</th>
                <th className="text-left">Status</th>
                <th className="text-left">Roles</th>
                <th className="text-left">Cluster</th>
                <th className="text-left">Deps</th>
                <th className="text-left">Overrides</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const depsOk = s.dependency_screen_keys.every(dep => screens.find(d => d.screen_key === dep)?.status === 'active');
                const canToggle = !s.is_system_screen && (s.dependency_screen_keys.length === 0 || depsOk);
                const overrideCount = (overrides[s.screen_key] ?? []).length;
                return (
                  <tr key={s.screen_key}>
                    <td>
                      <p className="font-semibold text-foreground">{s.display_name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.screen_key}</p>
                      {s.is_system_screen && <span className="text-[9px] font-bold text-[var(--color-lg-primary)] uppercase">System</span>}
                    </td>
                    <td className="font-mono text-[11px] text-muted-foreground max-w-[160px] truncate" title={s.route_path}>{s.route_path}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${PHASE_BADGE[s.phase].cls}`}>
                        {PHASE_BADGE[s.phase].label}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => canToggle && cycleStatus(s.screen_key)}
                        title={!canToggle && s.dependency_screen_keys.length > 0 ? `Enable '${s.dependency_screen_keys[0]}' first` : s.is_system_screen ? 'System screen — cannot be deactivated' : 'Click to cycle status'}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold transition-opacity ${STATUS_STYLE[s.status].cls} ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}>
                        {STATUS_STYLE[s.status].label}
                      </button>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-0.5">
                        {s.role_access.length === 0
                          ? <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">SuperAdmin only</span>
                          : s.role_access.slice(0,3).map(r => (
                              <span key={r} className="badge-muted px-1.5 py-0.5 rounded text-[10px] capitalize">{r.replace(/_/g,' ')}</span>
                            ))
                        }
                        {s.role_access.length > 3 && (
                          <span className="badge-muted px-1.5 py-0.5 rounded text-[10px]">+{s.role_access.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge-processing px-1.5 py-0.5 rounded text-[10px] font-semibold">{s.feature_cluster}</span>
                    </td>
                    <td>
                      {s.dependency_screen_keys.length === 0
                        ? <span className="text-muted-foreground text-[11px]">—</span>
                        : depsOk
                          ? <Check className="w-3.5 h-3.5 text-[var(--color-lg-success)]" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-lg-warning)]" aria-label={`Unmet: ${s.dependency_screen_keys.join(", ")}`} />
                      }
                    </td>
                    <td>
                      {overrideCount > 0 ? (
                        <button onClick={() => setOverridePanel(s.screen_key)}
                          className="badge-processing px-2 py-0.5 rounded text-[10px] font-semibold hover:opacity-80 transition-opacity">
                          {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <button onClick={() => setOverridePanel(s.screen_key)}
                          className="text-[11px] text-muted-foreground hover:text-[var(--color-lg-primary)] transition-colors">
                          Add
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Panel — 400px right slide-in */}
      {overridePanel && panelScreen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOverridePanel(null)} />
          <div className="relative z-50 w-[400px] h-full bg-card border-l border-border flex flex-col shadow-2xl"
            style={{ animation: 'slideInRight 200ms cubic-bezier(0.23,1,0.32,1)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-[13px] font-bold text-foreground">Overrides — {panelScreen.display_name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{panelScreen.screen_key}</p>
              </div>
              <button onClick={() => setOverridePanel(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Existing overrides */}
              {panelOverrides.length > 0 ? (
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-2 text-muted-foreground font-semibold">Organization</th>
                      <th className="text-left pb-2 text-muted-foreground font-semibold">Status</th>
                      <th className="text-left pb-2 text-muted-foreground font-semibold">Expires</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {panelOverrides.map(o => (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">{o.org_name}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${o.status === 'active' ? 'badge-valid' : 'badge-muted'}`}>{o.status}</span>
                        </td>
                        <td className="py-2 text-muted-foreground">{o.expires_at ?? '—'}</td>
                        <td className="py-2">
                          <button onClick={() => removeOverride(overridePanel, o.id)}
                            className="text-[var(--color-lg-error)] hover:underline text-[10px] font-semibold">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[12px] text-muted-foreground text-center py-4">No overrides for this screen</p>
              )}

              {/* Add override form */}
              <div className="border-t border-border pt-4 flex flex-col gap-3">
                <p className="text-[12px] font-semibold text-foreground">Add Override</p>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Organization</label>
                  <Input className="h-7 text-[11px]" placeholder="Org name" value={newOverride.org_name} onChange={e => setNewOverride(p => ({...p, org_name: e.target.value}))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Override Status</label>
                  <select className="w-full h-7 rounded border border-border bg-background text-[11px] px-2"
                    value={newOverride.status} onChange={e => setNewOverride(p => ({...p, status: e.target.value as 'active'|'hidden'}))}>
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Reason</label>
                  <Input className="h-7 text-[11px]" placeholder="Reason" value={newOverride.reason} onChange={e => setNewOverride(p => ({...p, reason: e.target.value}))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 block">Expires At (optional)</label>
                  <Input type="date" className="h-7 text-[11px]" value={newOverride.expires_at} onChange={e => setNewOverride(p => ({...p, expires_at: e.target.value}))} />
                </div>
                <Button size="sm" className="h-8 text-[12px]" onClick={() => addOverride(overridePanel)}>Add Override</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Activation Dialog */}
      {showPhaseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPhaseDialog(false)} />
          <div className="relative z-50 w-[480px] bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-foreground">Activate Phase 2?</h2>
              <button onClick={() => setShowPhaseDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pre-flight Checklist</p>
              {phase2Activatable.slice(0,6).map(s => (
                <div key={s.screen_key} className="flex items-center gap-2 text-[12px]">
                  <Check className="w-3.5 h-3.5 shrink-0 text-[var(--color-lg-success)]" />
                  <span className="text-foreground">{s.display_name}</span>
                  <span className="text-muted-foreground text-[11px] ml-auto">Will activate</span>
                </div>
              ))}
              {phase2Activatable.length > 6 && (
                <p className="text-[11px] text-muted-foreground pl-5">+{phase2Activatable.length - 6} more screens will activate</p>
              )}
              {phase2Skipped.map(s => (
                <div key={s.screen_key} className="flex items-center gap-2 text-[12px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[var(--color-lg-warning)]" />
                  <span className="text-foreground">{s.display_name}</span>
                  <span className="text-[var(--color-lg-warning)] text-[11px] ml-auto">Skipped — dependency not met</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/20 rounded-xl px-4 py-3 text-[12px] text-foreground">
              This will activate <strong>{phase2Activatable.length}</strong> of <strong>{phase2Screens.length}</strong> Phase 2 screens.
              {phase2Skipped.length > 0 && <> <strong>{phase2Skipped.length}</strong> skipped due to unmet dependencies.</>}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground">Scope</p>
              <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                <input type="radio" name="scope" defaultChecked className="accent-[var(--color-lg-primary)]" />
                Apply platform-wide
              </label>
              <label className="flex items-center gap-2 text-[12px] cursor-pointer text-muted-foreground">
                <input type="radio" name="scope" className="accent-[var(--color-lg-primary)]" />
                Apply to specific tenant (org search — coming soon)
              </label>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 h-9 text-[13px]" onClick={activatePhase}>
                Activate {phase2Activatable.length} Screens
              </Button>
              <Button variant="outline" className="h-9 text-[13px] px-5" onClick={() => setShowPhaseDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
