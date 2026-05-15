/**
 * Foundation type for every contract type in the system.
 * FUTURE: Accounting engine integration point — engines consume
 * contractType, startDate, endDate, and financialTerms from this base.
 */
import type { ContractType, ContractStatus } from './ContractType'

export interface BaseContract {
  id: string
  organizationId: string        // Multi-tenancy: mandatory on every entity
  contractType: ContractType    // 'PROPERTY_LEASE' | 'EQUIPMENT_LEASE' | 'SERVICE_CONTRACT'
  contractNumber: string        // CR-{YYYY}-{sequence}
  title: string
  status: ContractStatus        // draft | under_review | pending_approval | approved | archived
  counterpartyId: string
  startDate: Date
  endDate: Date
  executionDate: Date
  documents: string[]
  workflowId: string
  automationPolicyId: string
  assignedUserId: string
  tags: string[]
  notes: string
  created_at: Date
  updated_at: Date
}
