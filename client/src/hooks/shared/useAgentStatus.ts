/**
 * useAgentStatus — polls the agent status for a contract.
 *
 * // TODO: Backend integration required
 */
import { useState, useEffect, useRef } from 'react'
import type { AgentStatus } from '../../types/agents/AgentStatus'

export interface UseAgentStatusReturn {
  agentStatus: AgentStatus | null
  isLoading: boolean
  error: string | null
}

const POLL_INTERVAL_MS = 10_000

export function useAgentStatus(
  contractId: string | null,
  organizationId: string,
  enabled = true
): UseAgentStatusReturn {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!contractId || !enabled) return
    setIsLoading(true)
    // TODO: Replace with real API call
    setIsLoading(false)

    intervalRef.current = setInterval(() => {
      // TODO: Poll agent status
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [contractId, organizationId, enabled])

  return { agentStatus, isLoading, error }
}
