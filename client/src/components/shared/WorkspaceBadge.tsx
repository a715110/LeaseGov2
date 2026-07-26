/**
 * WorkspaceBadge — shared workspace pill component.
 *
 * Extracted from UploadDialog.tsx so that Vite can HMR each file cleanly.
 * A file that exports both React components and plain utility functions causes
 * Vite to fall back to full module invalidation, which breaks provider contexts.
 */
import { getWorkspaceColour } from '@/lib/workspaceColours';

export function WorkspaceBadge({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const c = getWorkspaceColour(name);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${c.bg} ${c.text} ${c.ring} ${
        size === 'xs' ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {name}
    </span>
  );
}
