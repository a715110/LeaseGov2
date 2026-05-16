/**
 * PlatformNotAuthorized — FC-10 MT.4
 * Screen key: platform-not-authorized
 * Route: /platform/not-authorized
 * is_system_screen = true — cannot be deactivated.
 *
 * Two states:
 *   State A (screen_inactive): feature not available in plan / not enabled by admin
 *   State B (role_not_permitted): role lacks access — shows permitted roles list
 *
 * Never reveals which specific screen was blocked.
 */

import { Lock, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { SCREEN_KEYS } from '@/constants/screenKeys';
import { useRole } from '@/contexts/RoleContext';
import { ROLE_LABELS } from '@/lib/types';
import type { UserRole } from '@/lib/types';

type NotAuthorizedState = 'screen_inactive' | 'role_not_permitted';

// In production these come from router state / query params
const DEMO_STATE: NotAuthorizedState = 'role_not_permitted';
const DEMO_PERMITTED_ROLES: UserRole[] = ['lease_admin', 'auditor', 'controller'];

const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  document_submitter: 'badge-muted',
  preparer:           'badge-processing',
  reviewer:           'badge-valid',
  approver:           'badge-valid',
  accountant:         'badge-deferred',
  controller:         'badge-warning',
  business_submitter: 'badge-muted',
  auditor:            'badge-processing',
  lease_admin:        'badge-valid',
};

export default function PlatformNotAuthorized() {
  const _screenKey = SCREEN_KEYS.PLATFORM_NOT_AUTHORIZED;
  const { activeRole } = useRole();
  const state: NotAuthorizedState = DEMO_STATE;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-lg-page-bg)] p-6">
      <div className="w-full max-w-[600px] bg-card border border-border rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>

        <h1 className="text-[22px] font-bold text-foreground mb-3">Access Restricted</h1>

        {state === 'screen_inactive' ? (
          <>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[440px] mb-6">
              This feature is not available in your current plan or has not yet been enabled by your administrator.
            </p>
            <div className="bg-muted/20 rounded-xl px-5 py-3 text-[12px] text-muted-foreground mb-8">
              Your current role: <span className="font-semibold text-foreground">{ROLE_LABELS[activeRole]}</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[440px] mb-4">
              Your role does not have access to this screen.
            </p>
            <div className="bg-muted/20 rounded-xl px-5 py-3 text-[12px] text-muted-foreground mb-4 w-full text-left">
              <p className="mb-1">Your current role:</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${ROLE_BADGE_COLOR[activeRole] ?? 'badge-muted'}`}>
                {ROLE_LABELS[activeRole]}
              </span>
            </div>
            <div className="bg-muted/20 rounded-xl px-5 py-3 text-[12px] text-muted-foreground mb-8 w-full text-left">
              <p className="mb-2">Permitted roles for this screen:</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_PERMITTED_ROLES.map(r => (
                  <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${ROLE_BADGE_COLOR[r] ?? 'badge-muted'}`}>
                    {ROLE_LABELS[r]}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link href="/pipeline/dashboard">
            <Button className="h-9 text-[13px] px-6">Go to Dashboard</Button>
          </Link>
          {state === 'role_not_permitted' && (
            <a href="mailto:admin@leasegov.app?subject=Access Request">
              <Button variant="outline" className="h-9 text-[13px] px-6 gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Request Access
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
