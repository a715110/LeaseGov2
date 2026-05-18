/**
 * PipelineCountsContext — lightweight shared state for sidebar nav badge counts.
 *
 * Pages that own the relevant data call the setters on mount / on state change.
 * AppShell reads the values to render live badge counts on nav group headers.
 *
 * Counts:
 *   pipelineReadyCount   — Stage Documents with status 'ready' (Document Pipeline group)
 *   approvalsCount       — Packages/submissions pending approval (Approvals group)
 *   extractionQueueCount — Jobs in the extraction queue (Extraction group)
 */
import React, { createContext, useContext, useState } from 'react'

interface PipelineCountsValue {
  pipelineReadyCount: number
  setPipelineReadyCount: (n: number) => void
  approvalsCount: number
  setApprovalsCount: (n: number) => void
  extractionQueueCount: number
  setExtractionQueueCount: (n: number) => void
}

const PipelineCountsContext = createContext<PipelineCountsValue | null>(null)

export function PipelineCountsProvider({ children }: { children: React.ReactNode }) {
  const [pipelineReadyCount, setPipelineReadyCount] = useState(0)
  const [approvalsCount, setApprovalsCount] = useState(0)
  const [extractionQueueCount, setExtractionQueueCount] = useState(0)

  return (
    <PipelineCountsContext.Provider
      value={{
        pipelineReadyCount, setPipelineReadyCount,
        approvalsCount, setApprovalsCount,
        extractionQueueCount, setExtractionQueueCount,
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
