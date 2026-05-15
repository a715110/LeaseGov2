/**
 * Property lease contract type — extends BaseContract.
 * FUTURE: Lease accounting engine integration point (IFRS 16 / ASC 842)
 * will consume monthlyRent, leaseTermMonths, and renewalOptions.
 */
import type { BaseContract } from '../base/BaseContract'

export interface RenewalOption {
  optionNumber: number
  durationMonths: number
  noticeRequiredDays: number
  rentReviewType: 'fixed' | 'cpi' | 'market' | 'fixed_percentage'
  rentReviewPercentage: number | null
  exercised: boolean
  exercisedAt: Date | null
}

export interface PropertyLease extends BaseContract {
  contractType: 'PROPERTY_LEASE'
  propertyId: string
  monthlyRent: number           // In cents (integer, never float)
  currency: string              // ISO 4217
  rentReviewFrequency: string
  leaseTermMonths: number
  renewalOptions: RenewalOption[]
  assessedValue: number
  lastAssessmentDate: Date | null
  nextAssessmentDate: Date | null
  securityDeposit: number
  specialConditions: string[]
}
