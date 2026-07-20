/**
 * StubPage — wrapper for scaffolded screens that are not yet implemented.
 *
 * Renders the standard scaffold callout plus a large semi-transparent
 * "STUB" diagonal watermark so demo viewers and developers can immediately
 * identify placeholder screens.
 *
 * Usage:
 *   import StubPage from "@/components/dev/StubPage";
 *   export default function MyScreen() {
 *     return <StubPage screenKey="my-screen-key" title="My Screen" description="What this screen will do." />;
 *   }
 */

import React from "react";

interface StubPageProps {
  /** The screen key constant string (shown in code badge) */
  screenKey: string;
  /** Human-readable page title */
  title: string;
  /** One-line description of what this screen will do */
  description?: string;
}

export default function StubPage({ screenKey, title, description }: StubPageProps) {
  return (
    <div className="relative p-6 min-h-[400px] overflow-hidden">
      {/* Semi-transparent diagonal STUB watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 0 }}
      >
        <span
          style={{
            fontSize: "clamp(80px, 18vw, 180px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            color: "var(--color-lg-primary, #3B82F6)",
            opacity: 0.06,
            transform: "rotate(-30deg)",
            userSelect: "none",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          STUB
        </span>
      </div>

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Screen key:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {screenKey}
            </code>
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            This screen is scaffolded and ready for implementation.
          </p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
          )}
          <div
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-[11px] font-semibold border"
            style={{
              color: "var(--color-lg-warning, #d97706)",
              background: "var(--color-lg-warning-subtle, #fef3c7)",
              borderColor: "var(--color-lg-warning, #d97706)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Stub — not yet implemented
          </div>
        </div>
      </div>
    </div>
  );
}
