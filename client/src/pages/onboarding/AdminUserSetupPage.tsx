/**
 * AdminUserSetupPage — FC-10 ON.2
 * Route: /onboarding/admin-user
 * Step 2 of 5 — create the first lease_admin user.
 */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
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

export default function AdminUserSetupPage() {
  const _screenKey = SCREEN_KEYS.PLATFORM_ONBOARDING;
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', temp_password: '', send_invite: true });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (!form.send_invite && form.temp_password.length < 8) e.temp_password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
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
                    borderColor: s.n <= 2 ? 'var(--color-lg-primary)' : 'var(--color-border)',
                    background: s.n === 2 ? 'var(--color-lg-primary)' : s.n < 2 ? 'var(--color-lg-success)' : 'transparent',
                    color: s.n <= 2 ? 'white' : 'var(--color-muted-foreground)',
                  }}>
                  {s.n < 2 ? '✓' : s.n}
                </div>
                <span className="text-[10px] mt-1 font-semibold" style={{ color: s.n <= 2 ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-16 h-px mx-2 mb-4" style={{ background: 'var(--color-border)' }} />}
            </div>
          ))}
        </div>

        <div className="w-full max-w-[520px] bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-lg-accent-subtle)' }}>
              <User className="w-5 h-5" style={{ color: 'var(--color-lg-primary)' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-foreground">Admin User</h1>
              <p className="text-[12px] text-muted-foreground">Step 2 of 5 — First lease_admin for this tenant</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">First Name</label>
                <Input className="h-9 text-[13px]" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                {errors.first_name && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Last Name</label>
                <Input className="h-9 text-[13px]" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                {errors.last_name && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.last_name}</p>}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Email</label>
              <Input type="email" className="h-9 text-[13px]" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              {errors.email && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-foreground cursor-pointer">
                <input type="checkbox" checked={form.send_invite} onChange={e => setForm(p => ({ ...p, send_invite: e.target.checked }))}
                  className="accent-[var(--color-lg-primary)]" />
                Send email invite with setup link
              </label>
            </div>
            {!form.send_invite && (
              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">Temporary Password</label>
                <Input type="password" className="h-9 text-[13px]" value={form.temp_password} onChange={e => setForm(p => ({ ...p, temp_password: e.target.value }))} />
                {errors.temp_password && <p className="text-[11px] text-[var(--color-lg-error)] mt-1">{errors.temp_password}</p>}
              </div>
            )}
            <div className="bg-muted/20 rounded-xl px-4 py-3 text-[12px] text-muted-foreground">
              This user will be assigned the <span className="font-semibold text-foreground">lease_admin</span> role and can invite additional users after setup.
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="h-10 text-[13px] px-5 gap-2" onClick={() => navigate('/onboarding/organization')}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button className="flex-1 h-10 text-[13px] gap-2" onClick={() => { if (validate()) navigate('/onboarding/theme-automation'); }}>
              Next: Theme & Automation <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
