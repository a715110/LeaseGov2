/**
 * Aggregated context for one open contract record.
 * Passed to contract-level components to avoid prop drilling.
 */
import type { PropertyLease } from '../contracts/propertyLease/PropertyLease'
import type { BaseContractWorkflow } from '../contracts/base/BaseContractWorkflow'
import type { AgentStatus } from '../agents/AgentStatus'
import type { HumanCheckpoint } from '../automation/HumanCheckpoint'
import type { AgentException } from '../agents/AgentException'

export interface ContractRecordContext {
  contractId: string
  contractType: string
  organizationId: string
  contract: PropertyLease | null   // Extend union as new contract types are added
  workflow: BaseContractWorkflow | null
  agentStatus: AgentStatus | null
  pendingCheckpoints: HumanCheckpoint[]
  openExceptions: AgentException[]
  isLoading: boolean
  error: string | null
}
