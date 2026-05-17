/**
 * useDocumentTitle — A4 (ARCH-1)
 *
 * Sets document.title on mount and restores the previous title on unmount.
 * Appends the app name suffix so every page follows the pattern:
 *   "Screen Name — LeaseGov"
 *
 * Usage:
 *   useDocumentTitle('Pipeline Dashboard')
 *   // → document.title = "Pipeline Dashboard — LeaseGov"
 */
import { useEffect } from 'react';

const APP_NAME = 'LeaseGov';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
