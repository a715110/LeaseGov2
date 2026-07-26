/**
 * workspaceColours.ts — shared workspace colour map and helpers.
 *
 * Extracted from UploadDialog.tsx so that Vite can HMR each file cleanly.
 * UploadDialog.tsx previously exported both React components and plain util
 * functions, which caused Vite to fall back to full module invalidation on
 * every save — triggering a full React tree remount outside the provider tree
 * and breaking useDemoMode / useRole context hooks.
 */

// ─── Workspace colour map ─────────────────────────────────────────────────────
// Keyed by workspace name (lowercase) for easy lookup
const WORKSPACE_COLOURS: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  'retail':            { bg: 'bg-blue-100',   text: 'text-blue-800',   ring: 'ring-blue-300',   dot: 'bg-blue-500'   },
  'office':            { bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-300', dot: 'bg-violet-500' },
  'industrial':        { bg: 'bg-amber-100',  text: 'text-amber-800',  ring: 'ring-amber-300',  dot: 'bg-amber-500'  },
  'land':              { bg: 'bg-green-100',  text: 'text-green-800',  ring: 'ring-green-300',  dot: 'bg-green-500'  },
  'corporate leasing': { bg: 'bg-slate-100',  text: 'text-slate-700',  ring: 'ring-slate-300',  dot: 'bg-slate-500'  },
};

export function getWorkspaceColour(name: string) {
  return WORKSPACE_COLOURS[name.toLowerCase()] ?? {
    bg: 'bg-muted',
    text: 'text-foreground',
    ring: 'ring-border',
    dot: 'bg-muted-foreground',
  };
}
