/**
 * useContractRecord — aggregated contract record context hook.
 *
 * Fetches and assembles the full ContractRecordContext for a given contract.
 * Used by contract record page components to avoid prop drilling.
 *
 * // TODO: Backend integration required — all fetches are stubs
 */
import { useState, useEffect } from 'react'
import type { ContractRecordContext } from '../../types/shared/ContractRecordContext'

export function useContractRecord(
  contractId: string,
  contractType: string,
  organizationId: string
): ContractRecordContext {
  const [ctx, setCtx] = useState<ContractRecordContext>({
    contractId,
    contractType,
    organizationId,
    contract: null,
    workflow: null,
    agentStatus: null,
    pendingCheckpoints: [],
    openExceptions: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    // TODO: Replace with real API calls via service layer
    setCtx(prev => ({ ...prev, isLoading: false }))
  }, [contractId, contractType, organizationId])

  return ctx
}
