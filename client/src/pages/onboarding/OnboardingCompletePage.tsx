/**
 * OnboardingCompletePage — FC-10 ON.5
 * Route: /onboarding/complete
 * Step 5 of 5 — provisioning progress animation + success state.
 * TODO: Backend integration required — POST /superadmin/tenants/provision
 */

import { useState, useEffect } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
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

const PROVISIONING_STEPS = [
  { id: 'org',      label: 'Creating organization record',    duration: 800 },
  { id: 'config',   label: 'Applying tenant configuration',   duration: 600 },
  { id: 'user',     label: 'Provisioning admin user',         duration: 700 },
  { id: 'schema',   label: 'Initializing schema version',     duration: 900 },
  { id: 'screens',  label: 'Activating MVP screen registry',  duration: 600 },
  { id: 'templates',label: 'Applying workflow templates',     duration: 700 },
  { id: 'invite',   label: 'Sending admin invite email',      duration: 500 },
];

export default function OnboardingCompletePage() {
  const _screenKey = SCREEN_KEYS.PLATFORM_ONBOARDING;
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string | null>(PROVISIONING_STEPS[0].id);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let delay = 0;
    PROVISIONING_STEPS.forEach((step, i) => {
      delay += step.duration;
      setTimeout(() => {
        setCurrentStep(PROVISIONING_STEPS[i + 1]?.id ?? null);
        setCompletedSteps(prev => { const n = new Set(prev); n.add(step.id); return n; });
        if (i === PROVISIONING_STEPS.length - 1) {
          setTimeout(() => setDone(true), 300);
        }
      }, delay);
    });
  }, []);

  const MOCK_TENANT_ID = 't-new-001';
  const MOCK_SUBDOMAIN = 'apex';

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
                    borderColor: 'var(--color-lg-primary)',
                    background: s.n < 5 ? 'var(--color-lg-success)' : done ? 'var(--color-lg-success)' : 'var(--color-lg-primary)',
                    color: 'white',
                  }}>
                  {s.n < 5 || done ? '✓' : s.n}
                </div>
                <span className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--color-lg-primary)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-16 h-px mx-2 mb-4" style={{ background: 'var(--color-lg-primary)', opacity: 0.3 }} />}
            </div>
          ))}
        </div>

        <div className="w-full max-w-[520px] bg-card border border-border rounded-2xl p-8 shadow-sm">
          {!done ? (
            <>
              <h1 className="text-[18px] font-bold text-foreground mb-1">Provisioning Tenant…</h1>
              <p className="text-[12px] text-muted-foreground mb-6">Please wait while we set up the new tenant environment.</p>
              <div className="flex flex-col gap-3">
                {PROVISIONING_STEPS.map(step => {
                  const isComplete = completedSteps.has(step.id);
                  const isActive = currentStep === step.id;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isComplete ? 'var(--color-lg-success)' : isActive ? 'var(--color-lg-primary)' : 'var(--color-muted)/20',
                          border: isActive ? '2px solid var(--color-lg-primary)' : 'none',
                        }}>
                        {isComplete
                          ? <Check className="w-3.5 h-3.5 text-white" />
                          : isActive
                            ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        }
                      </div>
                      <span className="text-[13px]" style={{
                        color: isComplete ? 'var(--color-lg-success)' : isActive ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                        fontWeight: isActive ? 600 : 400,
                      }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-lg-success-subtle)' }}>
                  <Check className="w-8 h-8" style={{ color: 'var(--color-lg-success)' }} />
                </div>
                <h1 className="text-[20px] font-bold text-foreground mb-1">Tenant Provisioned!</h1>
                <p className="text-[13px] text-muted-foreground">The new tenant environment is ready.</p>
              </div>

              <div className="bg-muted/20 rounded-xl px-5 py-4 flex flex-col gap-2 text-[12px] mb-6">
                <div className="flex justify-between"><span className="text-muted-foreground">Tenant ID</span><span className="font-mono font-semibold text-foreground">{MOCK_TENANT_ID}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">URL</span><span className="font-mono font-semibold text-foreground">{MOCK_SUBDOMAIN}.leasegov.app</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Admin invite</span><span className="badge-valid px-2 py-0.5 rounded text-[11px] font-semibold">Sent</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Screens activated</span><span className="font-semibold text-foreground">23 MVP screens</span></div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={`/superadmin/tenants/${MOCK_TENANT_ID}`}>
                  <Button className="w-full h-10 text-[13px] gap-2">
                    View Tenant Detail <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/superadmin/tenants">
                  <Button variant="outline" className="w-full h-10 text-[13px]">Back to Tenant List</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
