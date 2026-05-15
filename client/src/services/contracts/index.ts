/**
 * CONTRACT SERVICE OPERATIONS REGISTRY
 *
 * MCP NOTE: This file is the source for future MCP manifest generation.
 * Each exported function + its types = one potential MCP tool.
 * When generating /mcp/manifests/contracts/propertyLeaseManifest.ts,
 * read from here. Do not duplicate operation definitions elsewhere.
 *
 * TO ADD A NEW CONTRACT DOMAIN:
 * 1. Create the service file in this folder
 * 2. Add its exports here
 * 3. Nothing else needs to change
 */

export {
  getPropertyLease,
  listPropertyLeases,
  createPropertyLease,
  updatePropertyLease,
  extractLeaseTerms,
  validateLeaseData,
  scheduleReassessment,
  archivePropertyLease,
} from './propertyLeaseService'

export type {
  GetPropertyLeaseInput, GetPropertyLeaseResult,
  ListPropertyLeasesInput, ListPropertyLeasesResult,
  CreatePropertyLeaseInput, CreatePropertyLeaseResult,
  UpdatePropertyLeaseInput, UpdatePropertyLeaseResult,
  ExtractLeaseTermsInput, ExtractLeaseTermsResult,
  ValidateLeaseDataInput, ValidateLeaseDataResult,
  ScheduleReassessmentInput, ScheduleReassessmentResult,
  ArchivePropertyLeaseInput, ArchivePropertyLeaseResult,
} from '../../types/serviceOperations/contracts/propertyLeaseOperations'

// Equipment Lease operations — future
// export { ... } from './equipmentLeaseService'

// Service Contract operations — future
// export { ... } from './serviceContractService'
