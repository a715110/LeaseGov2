/**
 * OrganizationSetupPage — FC-10 ON.1
 * Route: /onboarding/organization
 * Step 1 of 5 in the tenant provisioning wizard.
 * Fields: org name, subdomain (auto-slug), admin email, subscription tier.
 * Subdomain uniqueness check (stub), live preview of subdomain URL.
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Building2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';
import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';

const STEPS = [
  { n: 1, label: 'Organization' },
  { n: 2, label: 'Admin User' },
  { n: 3, label: 'Theme & Automation' },
  { n: 4, label: 'Workflow Templates' },
  { n: 5, label: 'Complete' },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function OrganizationSetupPage() {
  const _screenKey = SCREEN_KEYS.PLATFORM_ONBOARDING;
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: '', subdomain: '', admin_email: '', tier: 'professional' });
  const [subdomainManual, setSubdomainManual] = useState(false);
  const [checking, setChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!subdomainManual && form.name) {
      setForm(p => ({ ...p, subdomain: slugify(p.name) }));
    }
  }, [form.name, subdomainManual]);

  useEffect(() => {
    if (!form.subdomain) { setSubdomainAvailable(null); return; }
    setChecking(true);
    const t = setTimeout(() => {
      // TODO: Backend integration required — GET /superadmin/tenants/check-subdomain?subdomain=...
      setSubdomainAvailable(form.subdomain !== 'meridian' && form.subdomain !== 'coastal');
      setChecking(false);
    }, 600);
    return () => clearTimeout(t);
  }, [form.subdomain]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Organization name is required';
    if (!form.subdomain.trim()) e.subdomain = 'Subdomain is required';
    if (subdomainAvailable === false) e.subdomain = 'Subdomain is already taken';
    if (!form.admin_email.includes('@')) e.admin_email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate()) return;
    navigate('/onboarding/admin-user');
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />
      <div className="flex-1 flex flex-col items-center justify-start pt-12 px-4">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all"
                  style={{
                    borderColor: s.n === 1 ? 'var(--color-lg-primary)' : 'var(--color-border)',
                    background: s.n === 1 ? 'var(--color-lg-primary)' : 'transparent',
                    color: s.n === 1 ? 'white' : 'var(--color-muted-foreground)',
                  }}>
                  {s.n}
                </div>
                <span className="text-[10px] mt-1 font-semibold" style={{ color: s.n === 1 ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-16 h-px mx-2 mb-4" style={{ background: 'var(--color-border)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="w-full max-w-[520px] bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-lg-accent-subtle)' }}>
              <Building2 className="w-5 h-5" style={{ color: 'var(--color-lg-primary)' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-foreground">Organization Setup</h1>
              <p className="text-[12px] text-muted-foreground">Step 1 of 5 — Provision a new tenant</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Organization Name</label>
              <Input className="h-9 text-[13px]" placeholder="e.g. Meridian Property Group"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {errors.name && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Subdomain</label>
              <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[var(--color-lg-primary)]">
                <input className="flex-1 h-9 px-3 text-[13px] bg-background outline-none"
                  value={form.subdomain}
                  onChange={e => { setSubdomainManual(true); setForm(p => ({ ...p, subdomain: slugify(e.target.value) })); }} />
                <span className="px-3 text-[12px] text-muted-foreground bg-muted/30 border-l border-border h-9 flex items-center">.leasegov.app</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {checking && <span className="text-[11px] text-muted-foreground">Checking availability…</span>}
                {!checking && subdomainAvailable === true && form.subdomain && (
                  <span className="text-[11px] text-[var(--color-lg-success)] flex items-center gap-1"><Check className="w-3 h-3" /> Available</span>
                )}
                {!checking && subdomainAvailable === false && (
                  <span className="text-[11px] text-[var(--color-lg-error)]">Subdomain already taken</span>
                )}
                {errors.subdomain && <span className="text-[11px] text-[var(--color-lg-error)]">{errors.subdomain}</span>}
              </div>
              {form.subdomain && (
                <p className="text-[11px] text-muted-foreground mt-1">Preview: <span className="font-mono text-foreground">{form.subdomain}.leasegov.app</span></p>
              )}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Admin Email</label>
              <Input type="email" className="h-9 text-[13px]" placeholder="admin@organization.com"
                value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} />
              {errors.admin_email && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.admin_email}</p>}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Subscription Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter','professional','enterprise'] as const).map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, tier: t }))}
                    className="px-3 py-2.5 rounded-lg border text-[12px] font-semibold capitalize transition-all"
                    style={{
                      borderColor: form.tier === t ? 'var(--color-lg-primary)' : 'var(--color-border)',
                      background: form.tier === t ? 'var(--color-lg-accent-subtle)' : 'transparent',
                      color: form.tier === t ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button className="w-full h-10 text-[13px] mt-6 gap-2" onClick={next}>
            Next: Admin User <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
