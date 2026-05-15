/**
 * useCheckpoints — fetches pending human checkpoints.
 *
 * // TODO: Backend integration required
 */
import { useState, useEffect } from 'react'
import type { HumanCheckpoint } from '../../types/automation/HumanCheckpoint'

export interface UseCheckpointsReturn {
  checkpoints: HumanCheckpoint[]
  total: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCheckpoints(
  organizationId: string,
  contractId?: string
): UseCheckpointsReturn {
  const [checkpoints, setCheckpoints] = useState<HumanCheckpoint[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    // TODO: Replace with real API call via workflowService.getPendingCheckpoints
    setIsLoading(false)
  }, [organizationId, contractId, tick])

  return {
    checkpoints,
    total,
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
