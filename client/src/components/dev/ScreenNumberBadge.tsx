/**
 * ScreenNumberBadge — DEVELOPMENT ONLY
 *
 * Renders a small amber badge showing the screen number (e.g. "Screen 1.2")
 * next to the page title. Visibility is controlled by DevModeContext.
 *
 * Usage:
 *   import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
 *   <ScreenNumberBadge screenKey={SCREEN_KEYS.PIPELINE_UPLOAD} />
 */

import { useDevMode } from '@/contexts/DevModeContext';
import { SCREEN_NUMBERS } from '@/constants/screenNumbers';

interface ScreenNumberBadgeProps {
  screenKey: string;
  className?: string;
}

export function ScreenNumberBadge({ screenKey, className = '' }: ScreenNumberBadgeProps) {
  const { showScreenNumbers } = useDevMode();
  const number = SCREEN_NUMBERS[screenKey];

  if (!showScreenNumbers || !number) return null;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold
        bg-amber-100 text-amber-800 border border-amber-300 select-none ${className}`}
      title={`Screen key: ${screenKey}`}
    >
      Screen {number}
    </span>
  );
}
