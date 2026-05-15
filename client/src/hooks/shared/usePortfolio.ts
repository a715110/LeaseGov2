/**
 * usePortfolio — fetches the portfolio-level summary for an organization.
 *
 * // TODO: Backend integration required
 */
import { useState, useEffect } from 'react'
import type { PortfolioSummary } from '../../types/portfolio/PortfolioSummary'

export interface UsePortfolioReturn {
  summary: PortfolioSummary | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function usePortfolio(organizationId: string): UsePortfolioReturn {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    // TODO: Replace with real API call via reportingService.getPortfolioSummary
    setIsLoading(false)
  }, [organizationId, tick])

  return {
    summary,
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
