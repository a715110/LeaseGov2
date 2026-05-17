/**
 * PageHeader — A5 (ARCH-1)
 *
 * Shared page-level header used by all screens.
 * Renders: title, optional subtitle, optional left slot (back button),
 * and optional right slot (action buttons).
 *
 * Design: LeaseGov V4 — slate/neutral palette, 1px bottom border,
 * 24px horizontal padding, 56px min-height.
 */
import React from 'react';

interface PageHeaderProps {
  /** Primary heading text */
  title: string;
  /** Optional muted subtitle below the title */
  subtitle?: string;
  /** Slot rendered to the left of the title (e.g. back button) */
  left?: React.ReactNode;
  /** Slot rendered to the right of the title (e.g. action buttons) */
  actions?: React.ReactNode;
  /** Extra className applied to the root element */
  className?: string;
}

export function PageHeader({ title, subtitle, left, actions, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`flex min-h-[56px] shrink-0 items-center justify-between border-b border-border bg-background px-6 py-3 ${className}`}
    >
      {/* Left: optional back button + title block */}
      <div className="flex items-center gap-3 min-w-0">
        {left && <div className="flex shrink-0 items-center">{left}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div className="ml-4 flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
