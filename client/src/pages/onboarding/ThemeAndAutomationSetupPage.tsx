/**
 * ThemeAndAutomationSetupPage — FC-10 ON.3
 * Route: /onboarding/theme-automation
 * Step 3 of 5 — design theme + automation policy.
 */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
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

const THEMES = [
  { id: 'structured_authority', label: 'Structured Authority', desc: 'Navy & slate — formal, government-grade', preview: '#1e3a5f' },
  { id: 'modern_violet',        label: 'Modern Violet',        desc: 'Purple & grey — contemporary enterprise', preview: '#6d28d9' },
  { id: 'executive_slate',      label: 'Executive Slate',      desc: 'Charcoal & gold — premium, executive', preview: '#374151' },
  { id: 'gradient_pro',         label: 'Gradient Pro',         desc: 'Teal & blue gradient — modern SaaS', preview: '#0d9488' },
];

const AUTOMATION_LEVELS = [
  { id: 'manual',          label: 'Manual',          desc: 'All fields require human entry. No AI suggestions.' },
  { id: 'collaborative',   label: 'Collaborative',   desc: 'AI suggests values; humans confirm each field.' },
  { id: 'full_autonomous', label: 'Full Autonomous',  desc: 'AI auto-populates high-confidence fields. Humans review exceptions only.' },
];

const COLOR_MODES = [
  { id: 'light', label: 'Light' },
  { id: 'dark',  label: 'Dark' },
  { id: 'auto',  label: 'System' },
];

export default function ThemeAndAutomationSetupPage() {
  const _screenKey = SCREEN_KEYS.PLATFORM_ONBOARDING;
  const [, navigate] = useLocation();
  const [theme, setTheme] = useState('structured_authority');
  const [automation, setAutomation] = useState('collaborative');
  const [colorMode, setColorMode] = useState('light');
  const [allowToggle, setAllowToggle] = useState(true);

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
                    borderColor: s.n <= 3 ? 'var(--color-lg-primary)' : 'var(--color-border)',
                    background: s.n === 3 ? 'var(--color-lg-primary)' : s.n < 3 ? 'var(--color-lg-success)' : 'transparent',
                    color: s.n <= 3 ? 'white' : 'var(--color-muted-foreground)',
                  }}>
                  {s.n < 3 ? '✓' : s.n}
                </div>
                <span className="text-[10px] mt-1 font-semibold" style={{ color: s.n <= 3 ? 'var(--color-lg-primary)' : 'var(--color-muted-foreground)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-16 h-px mx-2 mb-4" style={{ background: 'var(--color-border)' }} />}
            </div>
          ))}
        </div>

        <div className="w-full max-w-[560px] bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-lg-accent-subtle)' }}>
              <Palette className="w-5 h-5" style={{ color: 'var(--color-lg-primary)' }} />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-foreground">Theme & Automation</h1>
              <p className="text-[12px] text-muted-foreground">Step 3 of 5 — Configure the tenant experience</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Theme selection */}
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Design Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: theme === t.id ? 'var(--color-lg-primary)' : 'var(--color-border)',
                      background: theme === t.id ? 'var(--color-lg-accent-subtle)' : 'transparent',
                    }}>
                    <div className="w-6 h-6 rounded-full shrink-0" style={{ background: t.preview }} />
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color mode */}
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Default Color Mode</p>
              <div className="flex gap-2">
                {COLOR_MODES.map(m => (
                  <button key={m.id} onClick={() => setColorMode(m.id)}
                    className="flex-1 py-2 rounded-lg border text-[12px] font-semibold transition-all"
                    style={{
                      borderColor: colorMode === m.id ? 'var(--color-lg-primary)' : 'var(--color-border)',
                      background: colorMode === m.id ? 'var(--color-lg-primary)' : 'transparent',
                      color: colorMode === m.id ? 'white' : 'var(--color-muted-foreground)',
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[12px] text-muted-foreground mt-2 cursor-pointer">
                <input type="checkbox" checked={allowToggle} onChange={e => setAllowToggle(e.target.checked)}
                  className="accent-[var(--color-lg-primary)]" />
                Allow users to toggle their own color mode
              </label>
            </div>

            {/* Automation level */}
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Default Automation Level</p>
              <div className="flex flex-col gap-2">
                {AUTOMATION_LEVELS.map(a => (
                  <button key={a.id} onClick={() => setAutomation(a.id)}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: automation === a.id ? 'var(--color-lg-primary)' : 'var(--color-border)',
                      background: automation === a.id ? 'var(--color-lg-accent-subtle)' : 'transparent',
                    }}>
                    <div className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center"
                      style={{ borderColor: automation === a.id ? 'var(--color-lg-primary)' : 'var(--color-border)' }}>
                      {automation === a.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-lg-primary)' }} />}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{a.label}</p>
                      <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="h-10 text-[13px] px-5 gap-2" onClick={() => navigate('/onboarding/admin-user')}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button className="flex-1 h-10 text-[13px] gap-2" onClick={() => navigate('/onboarding/workflow-templates')}>
              Next: Workflow Templates <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
