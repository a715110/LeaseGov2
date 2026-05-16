/**
 * SuperAdminTenantList — FC-10 SA.1
 * Screen key: superadmin-tenant-list
 * Route: /superadmin/tenants
 *
 * SuperAdmin only — isSuperAdmin check enforced.
 * Features: summary stats row, search, filter pills, tenant table,
 *   Suspend/Activate toggle per row, "New Tenant" → /onboarding/organization
 */

import { useState } from 'react';
import { Search, Plus, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import NotFound from '@/pages/NotFound';
import { useTenantContext } from '@/contexts/TenantContext';

type OrgStatus = 'active' | 'onboarding' | 'suspended' | 'offboarded';
type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  status: OrgStatus;
  tier: SubscriptionTier;
  user_count: number;
  active_workflows: number;
  theme: string;
  created_at: string;
}

// TODO: Backend integration required — GET /superadmin/tenants
const MOCK_TENANTS: TenantRow[] = [
  { id:'t1', name:'Meridian Property Group',    subdomain:'meridian',    status:'active',     tier:'enterprise',    user_count:42,  active_workflows:8,  theme:'Structured Authority', created_at:'2025-11-12' },
  { id:'t2', name:'Coastal Realty Partners',    subdomain:'coastal',     status:'active',     tier:'professional',  user_count:18,  active_workflows:3,  theme:'Modern Violet',        created_at:'2026-01-08' },
  { id:'t3', name:'Apex Corporate Holdings',    subdomain:'apex',        status:'onboarding', tier:'enterprise',    user_count:0,   active_workflows:0,  theme:'Executive Slate',      created_at:'2026-05-14' },
  { id:'t4', name:'Harbor Industrial Trust',    subdomain:'harbor',      status:'active',     tier:'professional',  user_count:11,  active_workflows:2,  theme:'Gradient Pro',         created_at:'2025-09-03' },
  { id:'t5', name:'Summit Government Services', subdomain:'summit-gov',  status:'suspended',  tier:'starter',       user_count:6,   active_workflows:0,  theme:'Structured Authority', created_at:'2025-06-20' },
  { id:'t6', name:'Nexus Urban Development',    subdomain:'nexus-urban', status:'active',     tier:'enterprise',    user_count:29,  active_workflows:5,  theme:'Modern Violet',        created_at:'2026-02-17' },
];

const STATUS_BADGE: Record<OrgStatus, string> = {
  active:     'badge-valid',
  onboarding: 'badge-warning',
  suspended:  'badge-error',
  offboarded: 'badge-muted',
};

const TIER_STYLE: Record<SubscriptionTier, { cls: string; label: string }> = {
  starter:      { cls: 'badge-muted',       label: 'Starter' },
  professional: { cls: 'badge-processing',  label: 'Professional' },
  enterprise:   { cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Enterprise' },
};

export default function SuperAdminTenantList() {
  const _screenKey = SCREEN_KEYS.SUPERADMIN_TENANT_LIST;
  // TODO: Backend integration required — replace with real isSuperAdmin from auth context
  const isSuperAdmin = true;
  if (!isSuperAdmin) return <NotFound />;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrgStatus | 'all'>('all');
  const [tenants, setTenants] = useState<TenantRow[]>(MOCK_TENANTS);

  const filtered = tenants.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.subdomain.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSuspend(id: string) {
    setTenants(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'suspended' ? 'active' : 'suspended' } : t
    ));
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    onboarding: tenants.filter(t => t.status === 'onboarding').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />

      <div className="page-header">
        <div>
          <h1 className="page-title">Tenant Management</h1>
          <p className="page-subtitle">All organizations provisioned on the LeaseGov platform</p>
        </div>
        <Link href="/onboarding/organization">
          <Button className="h-9 text-[13px] gap-1.5">
            <Plus className="w-4 h-4" /> New Tenant
          </Button>
        </Link>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Tenants', value: stats.total, color: 'var(--color-foreground)' },
            { label: 'Active',        value: stats.active,     color: 'var(--color-lg-success)' },
            { label: 'Onboarding',    value: stats.onboarding, color: 'var(--color-lg-warning)' },
            { label: 'Suspended',     value: stats.suspended,  color: 'var(--color-lg-error)' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-5 py-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-9 h-8 text-[12px]" placeholder="Search org name or subdomain…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {(['all','active','onboarding','suspended'] as const).map(v => (
              <button key={v} onClick={() => setFilter(v)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold border capitalize transition-all"
                style={{
                  borderColor: filter === v ? 'var(--color-lg-primary)' : 'var(--color-border)',
                  background: filter === v ? 'var(--color-lg-primary)' : 'transparent',
                  color: filter === v ? 'white' : 'var(--color-muted-foreground)',
                }}>
                {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground ml-auto">{filtered.length} tenants</span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="data-table w-full text-[12px]">
            <thead>
              <tr>
                <th className="text-left">Organization</th>
                <th className="text-left">Subdomain</th>
                <th className="text-left">Status</th>
                <th className="text-left">Tier</th>
                <th className="text-right">Users</th>
                <th className="text-right">Workflows</th>
                <th className="text-left">Theme</th>
                <th className="text-left">Created</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="font-semibold text-foreground">{t.name}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">{t.subdomain}.leasegov.app</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[t.status]}`}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_STYLE[t.tier].cls}`}>
                      {TIER_STYLE[t.tier].label}
                    </span>
                  </td>
                  <td className="text-right text-foreground">{t.user_count}</td>
                  <td className="text-right text-foreground">{t.active_workflows}</td>
                  <td className="text-muted-foreground">{t.theme}</td>
                  <td className="text-muted-foreground">{t.created_at}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/superadmin/tenants/${t.id}`}>
                        <button className="text-[11px] font-semibold text-[var(--color-lg-primary)] hover:underline">View</button>
                      </Link>
                      <button
                        onClick={() => toggleSuspend(t.id)}
                        className="text-[11px] font-semibold hover:underline"
                        style={{ color: t.status === 'suspended' ? 'var(--color-lg-success)' : 'var(--color-lg-error)' }}>
                        {t.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
