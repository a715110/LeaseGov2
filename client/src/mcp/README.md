# MCP Layer — LeaseGov

## Overview

This directory contains Model Context Protocol (MCP) manifest definitions for the LeaseGov platform.
MCP manifests expose service operations as callable tools for AI agents.

## Status

All manifests in this directory are **placeholder stubs**.
They will be populated when the backend integration is completed.

## Manifest Generation

Each manifest file is generated from the corresponding service operation types.
**Source of truth for each manifest:**

| Manifest | Source Types |
|---|---|
| `manifests/contracts/propertyLeaseManifest.ts` | `types/serviceOperations/contracts/propertyLeaseOperations.ts` |
| `manifests/documents/extractionManifest.ts` | `types/serviceOperations/documents/documentOperations.ts` |
| `manifests/workflows/workflowManifest.ts` | `types/serviceOperations/workflows/workflowOperations.ts` |

## Rule

**Never duplicate operation definitions.**
When generating a manifest, read from the source types file.
Do not copy-paste type definitions into the manifest.

## Future Manifests

- `manifests/contracts/equipmentLeaseManifest.ts` — when equipment lease domain is activated
- `manifests/contracts/serviceContractManifest.ts` — when service contract domain is activated
