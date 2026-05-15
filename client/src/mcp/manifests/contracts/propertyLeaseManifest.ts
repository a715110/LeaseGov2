/**
 * MCP Manifest — Property Lease Operations
 *
 * PLACEHOLDER — not yet connected to backend.
 *
 * When implementing:
 * 1. Read types from: types/serviceOperations/contracts/propertyLeaseOperations.ts
 * 2. Read service functions from: services/contracts/propertyLeaseService.ts
 * 3. Generate inputSchema from Input types
 * 4. Generate outputSchema from Result types
 * 5. Register each operation as an MCP tool
 *
 * Operations to expose as MCP tools:
 * - getPropertyLease
 * - listPropertyLeases
 * - createPropertyLease
 * - updatePropertyLease
 * - extractLeaseTerms
 * - validateLeaseData
 * - scheduleReassessment
 * - archivePropertyLease
 *
 * // TODO: Backend integration required
 */

export const PROPERTY_LEASE_MCP_MANIFEST_VERSION = '1.0.0'
export const PROPERTY_LEASE_MCP_TOOLS: string[] = [
  'getPropertyLease',
  'listPropertyLeases',
  'createPropertyLease',
  'updatePropertyLease',
  'extractLeaseTerms',
  'validateLeaseData',
  'scheduleReassessment',
  'archivePropertyLease',
]
