/**
 * SuperAdminSystemHealth — FC-10 SA.3
 * Screen key: superadmin-system-health
 * Route: /superadmin/health
 *
 * Platform-wide health: status header, summary cards, per-tenant table,
 * event bus status panel, refresh button.
 */

import { useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import NotFound from '@/pages/NotFound';

type PlatformStatus = 'operational' | 'degraded' | 'outage';

// TODO: Backend integration required — GET /superadmin/health
const MOCK_HEALTH = {
  platform_status: 'operational' as PlatformStatus,
  last_updated: '2026-05-16 09:20:00',
  summary: {
    active_tenants: 4,
    active_users_now: 23,
    jobs_processing: 7,
    agent_tasks_running: 3,
    pending_checkpoints: 12,
  },
  tenants: [
    { id:'t1', name:'Meridian Property Group',    status:'active', last_activity:'2026-05-16 09:14', open_flags:2, overdue_items:0, agent_exceptions:0 },
    { id:'t2', name:'Coastal Realty Partners',    status:'active', last_activity:'2026-05-16 08:55', open_flags:1, overdue_items:1, agent_exceptions:0 },
    { id:'t4', name:'Harbor Industrial Trust',    status:'active', last_activity:'2026-05-15 17:30', open_flags:0, overdue_items:3, agent_exceptions:1 },
    { id:'t6', name:'Nexus Urban Development',    status:'active', last_activity:'2026-05-16 09:05', open_flags:4, overdue_items:0, agent_exceptions:0 },
    { id:'t3', name:'Apex Corporate Holdings',    status:'onboarding', last_activity:'—',            open_flags:0, overdue_items:0, agent_exceptions:0 },
    { id:'t5', name:'Summit Government Services', status:'suspended',  last_activity:'2026-03-01',   open_flags:0, overdue_items:0, agent_exceptions:0 },
  ],
  event_bus: [
    { event_type: 'DOCUMENT_UPLOADED',          last_event: '2026-05-16 09:14:22' },
    { event_type: 'EXTRACTION_COMPLETED',        last_event: '2026-05-16 09:10:05' },
    { event_type: 'APPROVAL_APPROVED',           last_event: '2026-05-16 08:55:30' },
    { event_type: 'BATCH_CREATED',               last_event: '2026-05-16 08:42:11' },
    { event_type: 'REASSESSMENT_TRIGGERED',      last_event: '2026-05-16 08:30:00' },
    { event_type: 'TENANT_CONFIG_UPDATED',       last_event: '2026-05-15 16:10:20' },
    { event_type: 'SCREEN_REGISTRY_UPDATED',     last_event: '2026-05-14 11:00:00' },
  ],
};

const PLATFORM_STATUS_STYLE: Record<PlatformStatus, { label: string; color: string; bg: string; border: string }> = {
  operational: { label: 'All Systems Operational', color: 'var(--color-lg-success)', bg: 'var(--color-lg-success-subtle)', border: 'var(--color-lg-success)' },
  degraded:    { label: 'Degraded Performance',    color: 'var(--color-lg-warning)', bg: 'var(--color-lg-warning-subtle)', border: 'var(--color-lg-warning)' },
  outage:      { label: 'Service Outage',          color: 'var(--color-lg-error)',   bg: 'var(--color-lg-error-subtle)',   border: 'var(--color-lg-error)' },
};

const TENANT_STATUS_BADGE: Record<string, string> = {
  active: 'badge-valid', onboarding: 'badge-warning', suspended: 'badge-error',
};

export default function SuperAdminSystemHealth() {
  const _screenKey = SCREEN_KEYS.SUPERADMIN_SYSTEM_HEALTH;
  const isSuperAdmin = true; // TODO: Backend integration required
  if (!isSuperAdmin) return <NotFound />;

  const [lastUpdated, setLastUpdated] = useState(MOCK_HEALTH.last_updated);
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date().toISOString().slice(0,19).replace('T',' '));
      setRefreshing(false);
    }, 1200);
  }

  const ps = PLATFORM_STATUS_STYLE[MOCK_HEALTH.platform_status];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />

      <div className="page-header">
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-subtitle">Platform-wide operational status</p>
        </div>
        <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5">
        {/* Platform status banner */}
        <div className="rounded-xl px-5 py-4 flex items-center gap-3"
          style={{ background: ps.bg, border: `1.5px solid ${ps.border}` }}>
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ps.color }} />
          <p className="text-[14px] font-bold" style={{ color: ps.color }}>{ps.label}</p>
          <span className="ml-auto text-[11px] text-muted-foreground">Last updated: {lastUpdated}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Active Tenants',      value: MOCK_HEALTH.summary.active_tenants },
            { label: 'Active Users Now',    value: MOCK_HEALTH.summary.active_users_now },
            { label: 'Jobs Processing',     value: MOCK_HEALTH.summary.jobs_processing },
            { label: 'Agent Tasks Running', value: MOCK_HEALTH.summary.agent_tasks_running },
            { label: 'Pending Checkpoints', value: MOCK_HEALTH.summary.pending_checkpoints },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-[24px] font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Per-tenant health table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-[13px] font-semibold text-foreground">Per-Tenant Health</h3>
          </div>
          <table className="data-table w-full text-[12px]">
            <thead>
              <tr>
                <th className="text-left">Organization</th>
                <th className="text-left">Status</th>
                <th className="text-left">Last Activity</th>
                <th className="text-right">Open Flags</th>
                <th className="text-right">Overdue Items</th>
                <th className="text-right">Agent Exceptions</th>
                <th className="text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HEALTH.tenants.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold text-foreground">{t.name}</td>
                  <td><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TENANT_STATUS_BADGE[t.status] ?? 'badge-muted'}`}>{t.status}</span></td>
                  <td className="font-mono text-[11px] text-muted-foreground">{t.last_activity}</td>
                  <td className="text-right" style={{ color: t.open_flags > 0 ? 'var(--color-lg-warning)' : 'var(--color-muted-foreground)' }}>{t.open_flags}</td>
                  <td className="text-right" style={{ color: t.overdue_items > 0 ? 'var(--color-lg-error)' : 'var(--color-muted-foreground)' }}>{t.overdue_items}</td>
                  <td className="text-right" style={{ color: t.agent_exceptions > 0 ? 'var(--color-lg-error)' : 'var(--color-muted-foreground)' }}>{t.agent_exceptions}</td>
                  <td>
                    <Link href={`/superadmin/tenants/${t.id}`}>
                      <button className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-lg-primary)] hover:underline">
                        View <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Event bus status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Event Bus — Last Event Per Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_HEALTH.event_bus.map(e => (
              <div key={e.event_type} className="flex items-center justify-between px-3 py-2 bg-muted/10 rounded-lg">
                <span className="font-mono text-[11px] text-foreground">{e.event_type}</span>
                <span className="text-[11px] text-muted-foreground">{e.last_event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
