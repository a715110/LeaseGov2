/**
 * WorkflowTemplateSetupPage — FC-10 ON.4
 * Route: /onboarding/workflow-templates
 * Step 4 of 5 — select workflow templates for the tenant.
 */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Workflow, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import SuperAdminBanner from '@/components/superadmin/SuperAdminBanner';

const STEPS = [
  { n: 1, label: 'Organization' },
  { n: 2, label: 'Admin User' },
  { n: 3, label: 'Theme & Automation' },
  { n: 4, label: 'Workflow Templates' },
  { n: 5, label: 'Complete' },
];

const TEMPLATES = [
  {
    id: 'standard_lease',
    label: 'Standard Lease Onboarding',
    desc: 'Full pipeline: upload → extract → verify → approve → export. Suitable for most property leases.',
    tags: ['MVP', 'Recommended'],
    steps: 6,
  },
  {
    id: 'fast_track',
    label: 'Fast-Track Approval',
    desc: 'Abbreviated workflow for low-risk renewals. Skips manual extraction and verification.',
    tags: ['MVP'],
    steps: 4,
  },
  {
    id: 'reassessment_full',
    label: 'Full Reassessment',
    desc: 'Complete reassessment cycle with classification, option assessment, memo, and approval.',
    tags: ['Phase 2'],
    steps: 8,
  },
  {
    id: 'bulk_import',
    label: 'Bulk Import',
    desc: 'Batch upload and extraction for large portfolio migrations. Requires enterprise tier.',
    tags: ['Phase 2', 'Enterprise'],
    steps: 5,
  },
];

export default function WorkflowTemplateSetupPage() {
  const _screenKey = SCREEN_KEYS.PLATFORM_ONBOARDING;
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<Set<string>>(new Set(['standard_lease']));

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-lg-page-bg)' }}>
      <SuperAdminBanner />
      <div className="flex-1 flex flex-col items-center justify-start pt-12 px-4">
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all"
                  style={{
                    borderColor: s.n <= 4 ? 'var(--color-lg-primary)' : 'var(--color-border)',
                    background: s.n === 4 ? 'var(--color-lg-primary)' : s.n < 4 ? 'var(--color-lg-success)' : 'transparent',
                    color: s.n <= 4 ? 'white' : 'var(--color-muted-foreground)',
                  }}>
                  {s.n < 4 ? '✓' : s.n}
                </div>
                <span className="text-[10px] mt-1 font-semibold" style={{ color: s.n <= 4 ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-16 h-px mx-2 mb-4" style={{ background: 'var(--color-border)' }} />}
            </div>
          ))}
        </div>

        <div className="w-full max-w-[560px] bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-lg-accent-subtle)' }}>
              <Workflow className="w-5 h-5" style={{ color: 'var(--color-lg-primary)' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-foreground">Workflow Templates</h1>
              <p className="text-[12px] text-muted-foreground">Step 4 of 5 — Select templates to activate for this tenant</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {TEMPLATES.map(t => {
              const isSelected = selected.has(t.id);
              return (
                <button key={t.id} onClick={() => toggle(t.id)}
                  className="flex items-start gap-4 px-4 py-4 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--color-lg-primary)' : 'var(--color-border)',
                    background: isSelected ? 'var(--color-lg-accent-subtle)' : 'transparent',
                  }}>
                  <div className="w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isSelected ? 'var(--color-lg-primary)' : 'var(--color-border)',
                      background: isSelected ? 'var(--color-lg-primary)' : 'transparent',
                    }}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-foreground">{t.label}</p>
                      {t.tags.map(tag => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tag === 'Recommended' ? 'badge-valid' : tag === 'Phase 2' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : tag === 'Enterprise' ? 'badge-warning' : 'badge-processing'}`}>{tag}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{t.steps} workflow steps</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="h-10 text-[13px] px-5 gap-2" onClick={() => navigate('/onboarding/theme-automation')}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button className="flex-1 h-10 text-[13px] gap-2" onClick={() => navigate('/onboarding/complete')}
              disabled={selected.size === 0}>
              Provision Tenant <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
