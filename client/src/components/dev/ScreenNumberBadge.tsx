/**
 * ScreenNumberBadge — DEVELOPMENT ONLY
 *
 * Renders a small amber badge showing the screen number (e.g. "Screen 1.2")
 * next to the page title. Visibility is controlled by DevModeContext.
 * Clicking the badge copies the screen key to the clipboard with a brief toast.
 *
 * Usage:
 *   import { ScreenNumberBadge } from '@/components/dev/ScreenNumberBadge';
 *   <ScreenNumberBadge screenKey={SCREEN_KEYS.PIPELINE_UPLOAD} />
 */

import { useState } from 'react';
import { useDevMode } from '@/contexts/DevModeContext';
import { SCREEN_NUMBERS } from '@/constants/screenNumbers';

interface ScreenNumberBadgeProps {
  screenKey: string;
  className?: string;
}

export function ScreenNumberBadge({ screenKey, className = '' }: ScreenNumberBadgeProps) {
  const { showScreenNumbers } = useDevMode();
  const number = SCREEN_NUMBERS[screenKey];
  const [copied, setCopied] = useState(false);

  if (!showScreenNumbers || !number) return null;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(screenKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {
      // Fallback for environments without clipboard API
      const ta = document.createElement('textarea');
      ta.value = screenKey;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={copied ? 'Copied!' : `Click to copy screen key: ${screenKey}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold
        border select-none transition-colors cursor-pointer
        ${copied
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 hover:border-amber-400'
        } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="2,6 5,9 10,3" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          Screen {number}
          <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="1" width="7" height="8" rx="1" />
            <path d="M1 4v7h7" />
          </svg>
        </>
      )}
    </button>
  );
}
