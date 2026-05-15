/**
 * useWorkflow — fetches and tracks a workflow record.
 *
 * // TODO: Backend integration required
 */
import { useState, useEffect } from 'react'
import type { BaseContractWorkflow } from '../../types/contracts/base/BaseContractWorkflow'

export interface UseWorkflowReturn {
  workflow: BaseContractWorkflow | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useWorkflow(
  workflowId: string | null,
  organizationId: string
): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<BaseContractWorkflow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!workflowId) return
    setIsLoading(true)
    setError(null)
    // TODO: Replace with real API call via workflowService.getWorkflow
    setIsLoading(false)
  }, [workflowId, organizationId, tick])

  return {
    workflow,
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
