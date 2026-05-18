/**
 * SuperAdminTenantDetail — FC-10 SA.2
 * Screen key: superadmin-tenant-detail
 * Route: /superadmin/tenants/:id
 *
 * Four tabs: Overview · Configuration · Users · Screen Overrides
 */

import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import NotFound from '@/pages/NotFound';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

// TODO: Backend integration required — GET /superadmin/tenants/:id
const MOCK_TENANT = {
  id: 't1',
  name: 'Meridian Property Group',
  subdomain: 'meridian',
  status: 'active' as const,
  tier: 'enterprise' as const,
  created_at: '2025-11-12',
  active_users: 42,
  records_count: 187,
  last_activity: '2026-05-16 09:14',
  config: {
    version: 5,
    design_theme: 'structured_authority',
    color_mode_default: 'light',
    automation_policy_id: 'ap-collaborative',
    activated_at: '2026-04-01',
    activated_by: 'admin@meridian.com',
    active_feature_flags: ['advanced_reassessment', 'bulk_export', 'watchlist_alerts'],
  },
  config_history: [
    { version: 5, activated_at: '2026-04-01', activated_by: 'admin@meridian.com', design_theme: 'structured_authority', color_mode_default: 'light', automation_policy_id: 'ap-collaborative' },
    { version: 4, activated_at: '2026-02-15', activated_by: 'admin@meridian.com', design_theme: 'modern_violet',        color_mode_default: 'dark',  automation_policy_id: 'ap-full-autonomous' },
    { version: 3, activated_at: '2025-12-10', activated_by: 'sa-platform',        design_theme: 'structured_authority', color_mode_default: 'light', automation_policy_id: 'ap-collaborative' },
  ],
  users: [
    { id:'u1', name:'Jordan Martinez',  email:'j.martinez@meridian.com',  roles:['preparer','reviewer'],    status:'active',   last_login:'2026-05-16' },
    { id:'u2', name:'Aisha Chen',       email:'a.chen@meridian.com',      roles:['approver'],               status:'active',   last_login:'2026-05-15' },
    { id:'u3', name:'Samuel Patel',     email:'s.patel@meridian.com',     roles:['lease_admin'],            status:'active',   last_login:'2026-05-16' },
    { id:'u4', name:'Fatima Okonkwo',   email:'f.okonkwo@meridian.com',   roles:['document_submitter'],     status:'active',   last_login:'2026-05-14' },
    { id:'u5', name:'Carlos Reyes',     email:'c.reyes@meridian.com',     roles:['accountant','controller'],'status':'inactive', last_login:'2026-03-22' },
  ],
  screen_overrides: [
    { id:'so1', screen_key:'reassessment-watchlist', status:'active' as const,  reason:'Early access pilot',        expires_at:'2026-12-31' },
    { id:'so2', screen_key:'export-preflight',       status:'hidden' as const,  reason:'Pending compliance review', expires_at:null },
  ],
};

type Tab = 'overview' | 'configuration' | 'users' | 'screen_overrides';

const STATUS_BADGE: Record<string, string> = {
  active:     'badge-valid',
  onboarding: 'badge-warning',
  suspended:  'badge-error',
  offboarded: 'badge-muted',
  inactive:   'badge-muted',
};

const TIER_STYLE: Record<string, string> = {
  starter:      'badge-muted',
  professional: 'badge-processing',
  enterprise:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function SuperAdminTenantDetail() {
  const _screenKey = SCREEN_KEYS.SUPERADMIN_TENANT_DETAIL;
  const isSuperAdmin = true; // TODO: Backend integration required
  if (!isSuperAdmin) return <NotFound />;

  const [tab, setTab] = useState<Tab>('overview');
  const [expandedConfigs, setExpandedConfigs] = useState<Set<number>>(new Set());
  const [overrides, setOverrides] = useState<{ id: string; screen_key: string; status: 'active' | 'hidden'; reason: string; expires_at: string | null }[]>(MOCK_TENANT.screen_overrides as { id: string; screen_key: string; status: 'active' | 'hidden'; reason: string; expires_at: string | null }[]);
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [newOverride, setNewOverride] = useState({ screen_key: '', status: 'active' as 'active' | 'hidden', reason: '', expires_at: '' });
  const t = MOCK_TENANT;

  function toggleConfig(v: number) {
    setExpandedConfigs(prev => { const n = new Set(prev); if (n.has(v)) n.delete(v); else n.add(v); return n; });
  }

  function removeOverride(id: string) {
    setOverrides(prev => prev.filter(o => o.id !== id));
  }

  function addOverride() {
    if (!newOverride.screen_key || !newOverride.reason) return;
    setOverrides(prev => [...prev, { id: `so${Date.now()}`, ...newOverride, expires_at: newOverride.expires_at || null }]);
    setNewOverride({ screen_key: '', status: 'active', reason: '', expires_at: '' });
    setShowAddOverride(false);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',        label: 'Overview' },
    { key: 'configuration',   label: 'Configuration' },
    { key: 'users',           label: 'Users' },
    { key: 'screen_overrides',label: 'Screen Overrides' },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/superadmin/tenants">
            <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="page-title mb-0">{t.name}</h1>
              <span className="font-mono text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{t.subdomain}.leasegov.app</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[t.status]}`}>{t.status}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_STYLE[t.tier]}`}>{t.tier}</span>
            </div>
            <p className="page-subtitle">Created {t.created_at}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border flex gap-0">
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === tb.key ? 'var(--color-lg-primary)' : 'transparent',
              color: tab === tb.key ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)',
            }}>
            {tb.label}
            {tb.key === 'screen_overrides' && overrides.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold badge-processing">{overrides.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 flex flex-col gap-5">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active Users',    value: t.active_users },
                { label: 'Contract Records',value: t.records_count },
                { label: 'Last Activity',   value: t.last_activity },
              ].map(m => (
                <div key={m.label} className="bg-card border border-border rounded-xl px-5 py-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{m.label}</p>
                  <p className="text-[22px] font-bold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-foreground mb-3">Active Configuration</h3>
              <div className="grid grid-cols-3 gap-4 text-[12px]">
                <div><p className="text-muted-foreground mb-0.5">Theme</p><p className="font-semibold text-foreground capitalize">{t.config.design_theme.replace(/_/g,' ')}</p></div>
                <div><p className="text-muted-foreground mb-0.5">Color Mode</p><p className="font-semibold text-foreground capitalize">{t.config.color_mode_default}</p></div>
                <div><p className="text-muted-foreground mb-0.5">Automation</p><p className="font-semibold text-foreground">{t.config.automation_policy_id}</p></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-foreground mb-3">Feature Flags</h3>
              <div className="flex flex-wrap gap-2">
                {t.config.active_feature_flags.map(f => (
                  <span key={f} className="badge-processing px-2.5 py-1 rounded-full text-[11px] font-semibold">{f.replace(/_/g,' ')}</span>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-fit h-9 text-[12px] border-[var(--color-lg-error)] text-[var(--color-lg-error)] hover:bg-red-50">
              Suspend Tenant
            </Button>
          </>
        )}

        {/* ── CONFIGURATION TAB ── */}
        {tab === 'configuration' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="data-table w-full text-[12px]">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th className="text-left">Version</th>
                  <th className="text-left">Activated At</th>
                  <th className="text-left">Activated By</th>
                  <th className="text-left">Theme</th>
                  <th className="text-left">Color Mode</th>
                  <th className="text-left">Automation Policy</th>
                </tr>
              </thead>
              <tbody>
                {t.config_history.map(c => (
                  <>
                    <tr key={c.version} className="cursor-pointer hover:bg-muted/10" onClick={() => toggleConfig(c.version)}>
                      <td>{expandedConfigs.has(c.version) ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}</td>
                      <td className="font-semibold text-foreground">v{c.version} {c.version === t.config.version && <span className="badge-valid px-1.5 py-0.5 rounded text-[10px] ml-1">Active</span>}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{c.activated_at}</td>
                      <td className="text-muted-foreground">{c.activated_by}</td>
                      <td className="capitalize text-foreground">{c.design_theme.replace(/_/g,' ')}</td>
                      <td className="capitalize text-foreground">{c.color_mode_default}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{c.automation_policy_id}</td>
                    </tr>
                    {expandedConfigs.has(c.version) && (
                      <tr key={`${c.version}-expand`}>
                        <td colSpan={7} className="px-6 py-4 bg-muted/5 border-t border-border">
                          <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">{JSON.stringify(c, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <>
            <div className="flex gap-3 text-[12px] text-muted-foreground">
              <span>Active: <strong className="text-foreground">{t.users.filter(u => u.status === 'active').length}</strong></span>
              <span>Inactive: <strong className="text-foreground">{t.users.filter(u => u.status === 'inactive').length}</strong></span>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="data-table w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Roles</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {t.users.map(u => (
                    <tr key={u.id}>
                      <td className="font-semibold text-foreground">{u.name}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{u.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(r => (
                            <span key={r} className="badge-muted px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize">{r.replace(/_/g,' ')}</span>
                          ))}
                        </div>
                      </td>
                      <td><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                      <td className="text-muted-foreground">{u.last_login}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SCREEN OVERRIDES TAB ── */}
        {tab === 'screen_overrides' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">{overrides.length} override{overrides.length !== 1 ? 's' : ''} active for this tenant</p>
              <Button size="sm" className="h-8 text-[12px] gap-1.5" onClick={() => setShowAddOverride(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Override
              </Button>
            </div>

            {showAddOverride && (
              <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                <h3 className="text-[13px] font-semibold text-foreground">Add Screen Override</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Screen Key</label>
                    <Input className="h-8 text-[12px] font-mono" placeholder="e.g. reassessment-watchlist" value={newOverride.screen_key} onChange={e => setNewOverride(p => ({ ...p, screen_key: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Override Status</label>
                    <select className="w-full h-8 rounded-lg border border-border bg-background text-[12px] px-2" value={newOverride.status} onChange={e => setNewOverride(p => ({ ...p, status: e.target.value as 'active' | 'hidden' }))}>
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Reason</label>
                    <Input className="h-8 text-[12px]" placeholder="Reason for override" value={newOverride.reason} onChange={e => setNewOverride(p => ({ ...p, reason: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Expires At (optional)</label>
                    <Input type="date" className="h-8 text-[12px]" value={newOverride.expires_at} onChange={e => setNewOverride(p => ({ ...p, expires_at: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 text-[12px]" onClick={addOverride}>Add Override</Button>
                  <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => setShowAddOverride(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="data-table w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left">Screen Key</th>
                    <th className="text-left">Override Status</th>
                    <th className="text-left">Reason</th>
                    <th className="text-left">Expires</th>
                    <th className="text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map(o => (
                    <tr key={o.id}>
                      <td className="font-mono text-[11px] text-muted-foreground">{o.screen_key}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${o.status === 'active' ? 'badge-valid' : 'badge-muted'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-foreground">{o.reason}</td>
                      <td className="text-muted-foreground">{o.expires_at ?? '—'}</td>
                      <td>
                        <button onClick={() => removeOverride(o.id)} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-lg-error)] hover:underline">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {overrides.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted-foreground py-8 text-[12px]">No overrides for this tenant</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
