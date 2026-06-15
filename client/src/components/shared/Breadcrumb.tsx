/**
 * Breadcrumb — A8 (ARCH-1)
 *
 * Route-aware breadcrumb rendered in the AppShell top header.
 * Derives crumbs from the current Wouter location by matching
 * against a static route-to-label map.
 *
 * Design: LeaseGov V4 — xs text, muted separators, current page
 * rendered in foreground weight.
 */
import { useLocation, Link } from 'wouter';

interface Crumb {
  label: string;
  href?: string;
}

/** Map of route prefixes → human-readable section labels.
 *  Ordered from most-specific to least-specific. */
const ROUTE_LABELS: Array<{ prefix: string; label: string }> = [
  // Pipeline
  { prefix: '/pipeline/upload',          label: 'Upload' },
  { prefix: '/pipeline/review',          label: 'Review Grouping' },
  { prefix: '/pipeline/validation',      label: 'Validation' },
  { prefix: '/pipeline/confirm',         label: 'Submit' },
  { prefix: '/pipeline',                 label: 'Pipeline' },
  // Extraction
  { prefix: '/extraction/understanding', label: 'Document Understanding' },
  { prefix: '/extraction/strategy',      label: 'Field Mapping' },
  { prefix: '/extraction/workspace',     label: 'AI Workspace' },
  { prefix: '/extraction/manual',        label: 'Manual Workspace' },
  { prefix: '/extraction/verification',  label: 'Verification' },
  { prefix: '/extraction/tracker',       label: 'Tracker' },
  { prefix: '/extraction/reprocessing',  label: 'Reprocessing' },
  { prefix: '/extraction',               label: 'Extraction' },
  // Records
  { prefix: '/records/deferred',         label: 'Deferred Fields' },
  { prefix: '/records/snapshots',        label: 'Snapshots' },
  { prefix: '/records/correction',       label: 'Correction' },
  { prefix: '/records',                  label: 'Records' },
  // Approvals
  { prefix: '/approvals/checkpoints',    label: 'Checkpoints' },
  { prefix: '/approvals/review',         label: 'Review' },
  { prefix: '/approvals/approver',       label: 'Approver' },
  { prefix: '/approvals/history',        label: 'History' },
  { prefix: '/approvals',               label: 'Approvals' },
  // Export
  { prefix: '/export/templates',         label: 'Templates' },
  { prefix: '/export/staging',           label: 'Staging' },
  { prefix: '/export/preflight',         label: 'Pre-Flight' },
  { prefix: '/export/tasks',             label: 'Upload Task' },
  { prefix: '/export',                   label: 'Export' },
  // Reassessment
  { prefix: '/reassessment/sweep',       label: 'Period Sweep' },
  { prefix: '/reassessment/cases',       label: 'Cases' },
  { prefix: '/reassessment/watchlist',   label: 'Watchlist' },
  { prefix: '/reassessment/survey',      label: 'Survey' },
  { prefix: '/reassessment/projects',    label: 'Projects' },
  { prefix: '/reassessment',             label: 'Reassessment' },
  // Agents
  { prefix: '/agents/checkpoints',       label: 'Checkpoint Queue' },
  { prefix: '/agents/monitor',           label: 'Activity Monitor' },
  { prefix: '/agents',                   label: 'Agents' },
  // Admin
  { prefix: '/admin/templates',          label: 'Templates' },
  { prefix: '/admin/schema',             label: 'Schema' },
  { prefix: '/admin/users',              label: 'Users' },
  { prefix: '/admin/automation',         label: 'Automation' },
  { prefix: '/admin/thresholds',         label: 'Thresholds' },
  { prefix: '/admin/audit',              label: 'Audit Log' },
  { prefix: '/admin',                    label: 'Admin' },
  // Settings / Notifications
  { prefix: '/settings',                 label: 'Settings' },
  { prefix: '/notifications',            label: 'Notifications' },
  // Home
  { prefix: '/',                         label: 'Home' },
];

/** Section roots — used to build the parent crumb */
const SECTION_ROOTS: Record<string, string> = {
  '/pipeline':     '/pipeline',
  '/extraction':   '/extraction',
  '/records':      '/records',
  '/approvals':    '/approvals',
  '/export':       '/export',
  '/reassessment': '/reassessment',
  '/agents':       '/agents',
  '/admin':        '/admin',
};

function getLabelForPath(path: string): string {
  for (const { prefix, label } of ROUTE_LABELS) {
    if (path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?')) {
      return label;
    }
  }
  return path;
}

function buildCrumbs(location: string): Crumb[] {
  if (location === '/') return [{ label: 'Home' }];

  const crumbs: Crumb[] = [];

  // Find which section root this route belongs to
  for (const [rootPrefix, rootHref] of Object.entries(SECTION_ROOTS)) {
    if (location.startsWith(rootPrefix)) {
      crumbs.push({ label: getLabelForPath(rootPrefix), href: rootHref });
      // If the location IS the root, don't add a child crumb
      if (location !== rootPrefix) {
        crumbs.push({ label: getLabelForPath(location) });
      }
      return crumbs;
    }
  }

  // Fallback: single crumb
  crumbs.push({ label: getLabelForPath(location) });
  return crumbs;
}

export function Breadcrumb() {
  const [location] = useLocation();
  const crumbs = buildCrumbs(location);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground/50 select-none">/</span>
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
