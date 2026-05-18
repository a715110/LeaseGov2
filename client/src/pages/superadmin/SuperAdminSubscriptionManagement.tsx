/**
 * SuperAdminSubscriptionManagement — FC-10 SA.4
 * Screen key: superadmin-subscriptions
 * Route: /superadmin/subscriptions
 *
 * Tenant subscription table with inline tier change,
 * feature flag toggles per tenant, CSV export.
 */

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import NotFound from '@/pages/NotFound';

import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

interface TenantSub {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  tier: SubscriptionTier;
  user_count: number;
  created_at: string;
  feature_flags: string[];
}

const ALL_FEATURE_FLAGS = [
  'advanced_reassessment',
  'bulk_export',
  'watchlist_alerts',
  'ai_workspace',
  'concurrent_reassessment',
  'custom_templates',
];

// TODO: Backend integration required — GET /superadmin/subscriptions
const INITIAL_TENANTS: TenantSub[] = [
  { id:'t1', name:'Meridian Property Group',    subdomain:'meridian',    status:'active',     tier:'enterprise',    user_count:42, created_at:'2025-11-12', feature_flags:['advanced_reassessment','bulk_export','watchlist_alerts'] },
  { id:'t2', name:'Coastal Realty Partners',    subdomain:'coastal',     status:'active',     tier:'professional',  user_count:18, created_at:'2026-01-08', feature_flags:['ai_workspace'] },
  { id:'t3', name:'Apex Corporate Holdings',    subdomain:'apex',        status:'onboarding', tier:'enterprise',    user_count:0,  created_at:'2026-05-14', feature_flags:[] },
  { id:'t4', name:'Harbor Industrial Trust',    subdomain:'harbor',      status:'active',     tier:'professional',  user_count:11, created_at:'2025-09-03', feature_flags:['bulk_export'] },
  { id:'t5', name:'Summit Government Services', subdomain:'summit-gov',  status:'suspended',  tier:'starter',       user_count:6,  created_at:'2025-06-20', feature_flags:[] },
  { id:'t6', name:'Nexus Urban Development',    subdomain:'nexus-urban', status:'active',     tier:'enterprise',    user_count:29, created_at:'2026-02-17', feature_flags:['advanced_reassessment','bulk_export','watchlist_alerts','ai_workspace','concurrent_reassessment'] },
];

const TIER_STYLE: Record<SubscriptionTier, string> = {
  starter:      'badge-muted',
  professional: 'badge-processing',
  enterprise:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-valid', onboarding: 'badge-warning', suspended: 'badge-error',
};

export default function SuperAdminSubscriptionManagement() {
  const _screenKey = SCREEN_KEYS.SUPERADMIN_SUBSCRIPTIONS;
  const isSuperAdmin = true; // TODO: Backend integration required
  if (!isSuperAdmin) return <NotFound />;

  const [tenants, setTenants] = useState<TenantSub[]>(INITIAL_TENANTS);
  const [pendingTiers, setPendingTiers] = useState<Record<string, SubscriptionTier>>({});
  const [exporting, setExporting] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());

  function applyTier(id: string) {
    const newTier = pendingTiers[id];
    if (!newTier) return;
    // TODO: Backend integration required — PUT /superadmin/tenants/:id/subscription
    setTenants(prev => prev.map(t => t.id === id ? { ...t, tier: newTier } : t));
    setPendingTiers(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  function toggleFlag(tenantId: string, flag: string) {
    // TODO: Backend integration required — PATCH /superadmin/tenants/:id/feature-flags
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      const flags = t.feature_flags.includes(flag)
        ? t.feature_flags.filter(f => f !== flag)
        : [...t.feature_flags, flag];
      return { ...t, feature_flags: flags };
    }));
  }

  function toggleFlagsExpand(id: string) {
    setExpandedFlags(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function exportCsv() {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />

      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">Subscription Management</h1>
            <ScreenNumberBadge screenKey="superadmin-subscriptions" />
          </div>
          <p className="page-subtitle">Manage tenant tiers and feature flag overrides</p>
        </div>
        <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={exportCsv} disabled={exporting}>
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Exporting…' : 'Export Billing Report'}
        </Button>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="data-table w-full text-[12px]">
            <thead>
              <tr>
                <th className="text-left">Organization</th>
                <th className="text-left">Status</th>
                <th className="text-left">Current Tier</th>
                <th className="text-left">Change Tier</th>
                <th className="text-right">Users</th>
                <th className="text-left">Created</th>
                <th className="text-left">Feature Flags</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <>
                  <tr key={t.id}>
                    <td className="font-semibold text-foreground">{t.name}</td>
                    <td><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[t.status] ?? 'badge-muted'}`}>{t.status}</span></td>
                    <td><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_STYLE[t.tier]}`}>{t.tier}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-7 rounded border border-border bg-background text-[11px] px-2"
                          value={pendingTiers[t.id] ?? t.tier}
                          onChange={e => setPendingTiers(prev => ({ ...prev, [t.id]: e.target.value as SubscriptionTier }))}>
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        {pendingTiers[t.id] && pendingTiers[t.id] !== t.tier && (
                          <button onClick={() => applyTier(t.id)}
                            className="h-7 px-2.5 rounded text-[11px] font-semibold text-white"
                            style={{ background: 'var(--color-lg-primary)' }}>
                            Apply
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-right text-foreground">{t.user_count}</td>
                    <td className="text-muted-foreground">{t.created_at}</td>
                    <td>
                      <button onClick={() => toggleFlagsExpand(t.id)}
                        className="text-[11px] font-semibold text-[var(--color-lg-primary)] hover:underline">
                        {t.feature_flags.length} flag{t.feature_flags.length !== 1 ? 's' : ''} {expandedFlags.has(t.id) ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {expandedFlags.has(t.id) && (
                    <tr key={`${t.id}-flags`}>
                      <td colSpan={7} className="px-6 py-3 bg-muted/5 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                          {ALL_FEATURE_FLAGS.map(flag => {
                            const active = t.feature_flags.includes(flag);
                            return (
                              <button key={flag} onClick={() => toggleFlag(t.id, flag)}
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                                style={{
                                  borderColor: active ? 'var(--color-lg-primary)' : 'var(--color-border)',
                                  background: active ? 'var(--color-lg-primary)' : 'transparent',
                                  color: active ? 'white' : 'var(--color-muted-foreground)',
                                }}>
                                {flag.replace(/_/g,' ')}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
