/**
 * Breadcrumb — A8 (ARCH-1)
 *
 * Route-aware breadcrumb rendered in the AppShell top header.
 * Derives crumbs from the current Wouter location by matching
 * against a static route-to-label map.
 *
 * Parameterised routes (e.g. /packages/:id/flags) are matched via
 * PARAM_ROUTE_PATTERNS — a list of regex patterns with named capture
 * groups that produce a { section, child } label pair.
 *
 * Design: LeaseGov V4 — xs text, muted separators, current page
 * rendered in foreground weight.
 */
import { useLocation, Link } from 'wouter';
import { useRoleLabel } from '@/hooks/useRoleLabel';

interface Crumb {
  label: string;
  href?: string;
}

/** Map of route prefixes → human-readable section labels.
 *  Ordered from most-specific to least-specific. */
const ROUTE_LABELS: Array<{ prefix: string; label: string }> = [
  // Packages (bare root only — sub-routes handled by PARAM_ROUTE_PATTERNS)
  { prefix: '/packages',                 label: 'Packages' },
  // Pipeline
  { prefix: '/pipeline/upload',          label: 'Upload' },
  { prefix: '/pipeline/review',          label: 'Review Grouping' },
  { prefix: '/pipeline/validation',      label: 'Validation' },
  // /pipeline/confirm removed in V3 — BATCH_SUBMITTED fires from /pipeline/review
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
  { prefix: '/approvals/final',          label: 'Final Approval' },
  { prefix: '/approvals/approver',       label: 'Approver' },
  { prefix: '/approvals/queue',          label: 'Queue' },
  { prefix: '/approvals/recall',         label: 'Recall' },
  { prefix: '/approvals/rework',         label: 'Rework' },
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
  // Onboarding
  { prefix: '/onboarding/organization',  label: 'Organization Setup' },
  { prefix: '/onboarding/admin-user',    label: 'Admin User Setup' },
  { prefix: '/onboarding/theme-automation', label: 'Theme & Automation' },
  { prefix: '/onboarding/workflow-templates', label: 'Workflow Templates' },
  { prefix: '/onboarding/complete',      label: 'Complete' },
  { prefix: '/onboarding',               label: 'Onboarding' },
  // Agents
  { prefix: '/approvals/checkpoints',    label: 'Checkpoint Queue' },
  { prefix: '/agents/monitor',           label: 'Activity Monitor' },
  { prefix: '/agents',                   label: 'Agents' },
  // Admin
  { prefix: '/admin/templates',          label: 'Templates' },
  { prefix: '/admin/schema',             label: 'Schema' },
  { prefix: '/admin/users',              label: 'Users' },
  { prefix: '/admin/automation',         label: 'Automation' },
  { prefix: '/admin/thresholds',         label: 'Thresholds' },
  { prefix: '/admin/audit',              label: 'Audit Log' },
  { prefix: '/admin/notifications',      label: 'Notifications' },
  { prefix: '/admin',                    label: 'Admin' },
  // Settings / Notifications
  { prefix: '/settings',                 label: 'Settings' },
  { prefix: '/notifications',            label: 'Notifications' },
  // Home
  { prefix: '/',                         label: 'Home' },
];

/**
 * Parameterised route patterns — for routes whose path segments contain
 * dynamic IDs that cannot be matched by a static prefix.
 *
 * Each entry provides:
 *   pattern  — regex that matches the full pathname
 *   section  — label for the parent (root) crumb
 *   sectionHref — href for the parent crumb link
 *   child    — label for the current (leaf) crumb
 */
const PARAM_ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  section: string;
  sectionHref: string;
  child: string;
}> = [
  // /packages/:id/flags  →  Packages / Flags
  {
    pattern: /^\/packages\/[^/]+\/flags$/,
    section: 'Packages',
    sectionHref: '/packages',
    child: 'Flags',
  },
  // /packages/:id/reassembly  →  Packages / Re-Assembly
  {
    pattern: /^\/packages\/[^/]+\/reassembly$/,
    section: 'Packages',
    sectionHref: '/packages',
    child: 'Re-Assembly',
  },
  // /packages/:id  →  Packages / Composition
  {
    pattern: /^\/packages\/[^/]+$/,
    section: 'Packages',
    sectionHref: '/packages',
    child: 'Composition',
  },
  // /approvals/review/:id  →  Approvals / Review
  {
    pattern: /^\/approvals\/review\/[^/]+$/,
    section: 'Approvals',
    sectionHref: '/approvals/queue',
    child: 'Review',
  },
  // /approvals/final/:id  →  Approvals / Final Approval
  {
    pattern: /^\/approvals\/final\/[^/]+$/,
    section: 'Approvals',
    sectionHref: '/approvals/queue',
    child: 'Final Approval',
  },
  // /records/:id/add-document  →  Records / Add Document
  {
    pattern: /^\/records\/[^/]+\/add-document$/,
    section: 'Records',
    sectionHref: '/records',
    child: 'Add Document',
  },
  // /records/:id/correction  →  Records / Correction
  {
    pattern: /^\/records\/[^/]+\/correction$/,
    section: 'Records',
    sectionHref: '/records',
    child: 'Correction',
  },
  // /records/:id/snapshots  →  Records / Snapshots
  {
    pattern: /^\/records\/[^/]+\/snapshots$/,
    section: 'Records',
    sectionHref: '/records',
    child: 'Snapshots',
  },
  // /records/:id/deferred  →  Records / Deferred Fields
  {
    pattern: /^\/records\/[^/]+\/deferred$/,
    section: 'Records',
    sectionHref: '/records',
    child: 'Deferred Fields',
  },
  // /records/:id  →  Records / Detail
  {
    pattern: /^\/records\/[^/]+$/,
    section: 'Records',
    sectionHref: '/records',
    child: 'Detail',
  },
  // /reassessment/cases/:id/assessment  →  Reassessment / Assessment
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/assessment$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Assessment',
  },
  // /reassessment/cases/:id/analysis  →  Reassessment / Analysis & Memo
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/analysis$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Analysis & Memo',
  },
  // /reassessment/cases/:id/memo  →  Reassessment / Memo
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/memo$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Memo',
  },
  // /reassessment/cases/:id/package  →  Reassessment / Package Preview
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/package$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Package Preview',
  },
  // /reassessment/cases/:id/remediation  →  Reassessment / Remediation
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/remediation$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Remediation',
  },
  // /reassessment/cases/:id/classify  →  Reassessment / Classification
  {
    pattern: /^\/reassessment\/cases\/[^/]+\/classify$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Classification',
  },
  // /reassessment/cases/:id  →  Reassessment / Case Detail
  {
    pattern: /^\/reassessment\/cases\/[^/]+$/,
    section: 'Reassessment',
    sectionHref: '/reassessment/cases',
    child: 'Case Detail',
  },
];

/** Section roots — used to build the parent crumb for static sub-routes */
const SECTION_ROOTS: Record<string, string> = {
  '/packages':     '/packages',
  '/pipeline':     '/pipeline',
  '/extraction':   '/extraction',
  '/records':      '/records',
  '/approvals':    '/approvals',
  '/export':       '/export/templates',
  '/reassessment': '/reassessment',
  '/onboarding':   '/onboarding/organization',
  '/agents':       '/approvals/checkpoints',
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

  // Strip query string for matching, but keep original for display
  const pathname = location.split('?')[0];

  // Try parameterised patterns first (more specific than prefix matching)
  for (const { pattern, section, sectionHref, child } of PARAM_ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      return [
        { label: section, href: sectionHref },
        { label: child },
      ];
    }
  }

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
  const { getLabel } = useRoleLabel();
  const crumbs = buildCrumbs(location).map(crumb => ({
    ...crumb,
    // Resolve role-aware label: try the crumb's href first, then the label itself as a key
    label: crumb.href
      ? getLabel(crumb.href, crumb.label)
      : getLabel(location.split('?')[0], crumb.label),
  }));

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
