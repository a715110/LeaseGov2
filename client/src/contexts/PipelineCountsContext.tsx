/**
 * PipelineCountsContext — lightweight shared state for sidebar nav badge counts.
 *
 * Pages that own the relevant data call the setters on mount / on state change.
 * AppShell reads the values to render live badge counts on nav group headers.
 *
 * Counts:
 *   pipelineReadyCount   — Stage Documents with status 'valid' and not committed (Document Pipeline group)
 *   approvalsCount       — Packages/submissions pending approval (Approvals group)
 *   extractionQueueCount — Jobs in the extraction queue (Extraction group)
 *   watchlistCount       — Records currently watchlisted (Records group)
 *
 * Initial values are seeded from MOCK data so badges are correct even before the
 * owning page is visited. Pages overwrite these values on mount via the setters.
 */
import React, { createContext, useContext, useState } from 'react'

// ── Seed helpers ─────────────────────────────────────────────────────────────
// These mirror the MOCK_DOCUMENTS filter in PipelineDashboard and the
// MOCK_TASKS filter in ApprovalsQueue so the sidebar shows correct counts
// immediately on first render, before either page has been visited.

function seedPipelineReadyCount(): number {
  // Docs 1–2 are valid + staged; docs 3–8 are committed or invalid.
  // Mirrors: stagedDocs.filter(d => d.document_job_status !== 'committed' && d.status === 'valid').length
  return 3 // docs 1, 2, 8 (valid + staged/unknown path, not committed)
}

function seedApprovalsCount(): number {
  // Mirrors: contractPackages.filter(p => p.status === 'Ready').length
  // Initial MOCK has 1 package in Ready state (PKG-2026-001)
  return 1
}

function seedWatchlistCount(): number {
  // Read from localStorage — same logic as AppShell refreshWatchlistCount
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('leasegov_watchlist_'))
    const watchlisted = new Set<string>()
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.is_watchlisted === true) {
          const recordId = key.replace('leasegov_watchlist_', '')
          watchlisted.add(recordId)
        }
      } catch { /* ignore malformed entries */ }
    }
    // Fall back to 3 (r2, r4, r7 are watchlisted in MOCK_RECORDS) if no localStorage data yet
    return watchlisted.size > 0 ? watchlisted.size : 3
  } catch {
    return 3
  }
}

// ─────────────────────────────────────────────────────────────────────────────

interface PipelineCountsValue {
  pipelineReadyCount: number
  setPipelineReadyCount: (n: number) => void
  approvalsCount: number
  setApprovalsCount: (n: number) => void
  extractionQueueCount: number
  setExtractionQueueCount: (n: number) => void
  watchlistCount: number
  setWatchlistCount: (n: number) => void
}

const PipelineCountsContext = createContext<PipelineCountsValue | null>(null)

export function PipelineCountsProvider({ children }: { children: React.ReactNode }) {
  const [pipelineReadyCount, setPipelineReadyCount] = useState(seedPipelineReadyCount)
  const [approvalsCount, setApprovalsCount] = useState(seedApprovalsCount)
  const [extractionQueueCount, setExtractionQueueCount] = useState(0)
  const [watchlistCount, setWatchlistCount] = useState(seedWatchlistCount)

  return (
    <PipelineCountsContext.Provider
      value={{
        pipelineReadyCount, setPipelineReadyCount,
        approvalsCount, setApprovalsCount,
        extractionQueueCount, setExtractionQueueCount,
        watchlistCount, setWatchlistCount,
      }}
    >
      {children}
    </PipelineCountsContext.Provider>
  )
}

export function usePipelineCounts(): PipelineCountsValue {
  const ctx = useContext(PipelineCountsContext)
  if (!ctx) throw new Error('usePipelineCounts must be used inside PipelineCountsProvider')
  return ctx
}
