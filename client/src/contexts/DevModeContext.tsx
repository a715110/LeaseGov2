/**
 * DevModeContext
 *
 * Lightweight context for development-only UI helpers.
 * Currently exposes a single toggle: showScreenNumbers.
 *
 * This context and all components that depend on it are
 * DEVELOPMENT-ONLY and must not be included in production builds.
 * The toggle is persisted to localStorage so it survives page refreshes.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DevModeContextValue {
  showScreenNumbers: boolean;
  toggleScreenNumbers: () => void;
}

const DevModeContext = createContext<DevModeContextValue>({
  showScreenNumbers: false,
  toggleScreenNumbers: () => {},
});

const STORAGE_KEY = 'leasegov_dev_show_screen_numbers';

export function DevModeProvider({ children }: { children: ReactNode }) {
  const [showScreenNumbers, setShowScreenNumbers] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleScreenNumbers = useCallback(() => {
    setShowScreenNumbers(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  return (
    <DevModeContext.Provider value={{ showScreenNumbers, toggleScreenNumbers }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  return useContext(DevModeContext);
}
