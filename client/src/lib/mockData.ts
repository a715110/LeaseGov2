/**
 * mockData.ts — Shared V3 mock data for FC-1 Document Pipeline
 *
 * V3 Document Intake Governance Flow — Change 1 (§1b, §1c)
 * Reference: IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE_V3.md
 *
 * Exports:
 *   MOCK_CONTRACT_RECORDS — 3 seed ContractRecords (Acme Corp, Globex LLC, Initech)
 *   MOCK_PACKAGES         — 2 seed ContractPackages (PKG-2026-001 submitted, PKG-2026-002 assembly)
 *   MOCK_WORKSPACES       — workspace list for upload modal dropdown
 *   MOCK_ASSIGNEES        — users with Preparer / Lease Admin role for routing context
 */

// ─── ContractRecord ───────────────────────────────────────────────────────────

export type ContractRecordStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export type ContractClassification =
  | 'operating_lease'
  | 'finance_lease'
  | 'service_contract';

export interface ContractRecord {
  id: string;
  contractNumber: string;
  counterparty: string;
  address: string;
  status: ContractRecordStatus;
  classification: ContractClassification;
}

/**
 * V3 §1b — 3 seed ContractRecords used for:
 *   - Upload Modal Section 3b "Existing Record" typeahead
 *   - Package Composition Target Record search
 *   - Document Intelligence Panel "Record Target" metadata
 */
export const MOCK_CONTRACT_RECORDS: ContractRecord[] = [
  {
    id: 'mock-record-001',
    contractNumber: 'CR-2026-0038',
    counterparty: 'Acme Corp',
    address: '123 Main St, New York NY 10001',
    status: 'approved',
    classification: 'operating_lease',
  },
  {
    id: 'mock-record-002',
    contractNumber: 'CR-2026-0039',
    counterparty: 'Globex LLC',
    address: '456 Oak Ave, Chicago IL 60601',
    status: 'under_review',
    classification: 'finance_lease',
  },
  {
    id: 'mock-record-003',
    contractNumber: 'CR-2026-0040',
    counterparty: 'Initech',
    address: '789 Pine Rd, Austin TX 78701',
    status: 'draft',
    classification: 'operating_lease',
  },
];

// ─── ContractPackage ──────────────────────────────────────────────────────────

export type PackageStatus =
  | 'assembly'
  | 'validated'
  | 'flags_raised'
  | 'submitted'
  | 'completed'
  | 'rejected';

export type DocumentRole =
  | 'Base Contract'
  | 'Amendment'
  | 'Addendum'
  | 'Exhibit'
  | 'Schedule'
  | 'Notice'
  | 'Supporting'
  | 'Unassigned';

export interface PackageDocument {
  docId: string;
  name: string;
  role: DocumentRole;
}

export interface ContractPackageV3 {
  id: string;
  packageNumber: string;
  target_record_id: string | null;
  status: PackageStatus;
  document_count: number;
  documents: PackageDocument[];
  submitted_by: string | null;
  submitted_at: string | null;
  created_at: string;
}

/**
 * V3 §1c — 2 seed ContractPackages.
 * PKG-2026-001: submitted (appears in Table 3 — Submissions as Pending)
 * PKG-2026-002: assembly (appears in Table 2 — Contract Packages)
 */
export const MOCK_PACKAGES: ContractPackageV3[] = [
  {
    id: 'mock-pkg-001',
    packageNumber: 'PKG-2026-001',
    target_record_id: 'mock-record-001',
    status: 'submitted',
    document_count: 2,
    documents: [
      { docId: 'doc-3', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'doc-4', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
    ],
    submitted_by: 'Document Submitter Demo',
    // 2 days ago from a fixed reference date
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-pkg-002',
    packageNumber: 'PKG-2026-002',
    target_record_id: 'mock-record-002',
    status: 'assembly',
    document_count: 1,
    documents: [
      { docId: 'doc-5', name: 'Ground-Lease-Base-Contract.pdf', role: 'Base Contract' },
    ],
    submitted_by: null,
    submitted_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Submission (Table 3) ─────────────────────────────────────────────────────

export type SubmissionStatus = 'Pending' | 'In Progress' | 'Warning' | 'Completed';

export interface SubmissionV3 {
  id: string;
  batchId: string;
  packageNumber: string;
  target_record_id: string | null;
  fileCount: number;
  documents: PackageDocument[];
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
}

/**
 * V3 Table 3 seed — PKG-2026-001 appears as a Pending submission.
 */
export const MOCK_SUBMISSIONS: SubmissionV3[] = [
  {
    id: 'sub-v3-001',
    batchId: 'BATCH-2026-0041',
    packageNumber: 'PKG-2026-001',
    target_record_id: 'mock-record-001',
    fileCount: 2,
    documents: [
      { docId: 'doc-3', name: 'Retail-HQ-Lease-2026.pdf',    role: 'Base Contract' },
      { docId: 'doc-4', name: 'Office-Tower-Amendment-3.pdf', role: 'Amendment' },
    ],
    submittedBy: 'Document Submitter Demo',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
  },
];

// ─── Workspaces ───────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  team: string;
}

export const MOCK_WORKSPACES: Workspace[] = [
  { id: 'ws-001', name: 'Corporate Leasing',    team: 'Real Estate' },
  { id: 'ws-002', name: 'Retail',       team: 'Retail Portfolio' },
  { id: 'ws-003', name: 'Office',       team: 'Office Portfolio' },
  { id: 'ws-004', name: 'Industrial',   team: 'Industrial Portfolio' },
  { id: 'ws-005', name: 'Land',         team: 'Land & Ground Leases' },
];

// ─── Assignees (Preparer / Lease Admin roles) ─────────────────────────────────

export interface Assignee {
  id: string;
  name: string;
  role: 'Preparer' | 'Lease Admin';
  workspaceId: string;
  avatarColor?: string;
  /** Work email — shown in avatar tooltip; PRODUCTION: from user directory */
  email?: string;
}

export const MOCK_ASSIGNEES: Assignee[] = [
  { id: 'user-prep-001', name: 'R. Thompson',  role: 'Preparer',    workspaceId: 'ws-001', avatarColor: '#3b82f6', email: 'r.thompson@leasegov.internal' },
  { id: 'user-prep-002', name: 'L. Nguyen',    role: 'Preparer',    workspaceId: 'ws-002', avatarColor: '#8b5cf6', email: 'l.nguyen@leasegov.internal' },
  { id: 'user-prep-003', name: 'M. Okonkwo',   role: 'Preparer',    workspaceId: 'ws-003', avatarColor: '#f59e0b', email: 'm.okonkwo@leasegov.internal' },
  { id: 'user-prep-004', name: 'S. Patel',     role: 'Preparer',    workspaceId: 'ws-004', avatarColor: '#10b981', email: 's.patel@leasegov.internal' },
  { id: 'user-prep-005', name: 'D. Hartley',   role: 'Preparer',    workspaceId: 'ws-005', avatarColor: '#6366f1', email: 'd.hartley@leasegov.internal' },
  { id: 'user-admin-001', name: 'C. Reyes',    role: 'Lease Admin', workspaceId: 'ws-001', avatarColor: '#ec4899', email: 'c.reyes@leasegov.internal' },
  { id: 'user-admin-002', name: 'F. Andersen', role: 'Lease Admin', workspaceId: 'ws-004', avatarColor: '#14b8a6', email: 'f.andersen@leasegov.internal' },
  { id: 'user-admin-003', name: 'J. Moreau',   role: 'Lease Admin', workspaceId: 'ws-002', avatarColor: '#f97316', email: 'j.moreau@leasegov.internal' },
  { id: 'user-admin-004', name: 'T. Osei',     role: 'Lease Admin', workspaceId: 'ws-005', avatarColor: '#64748b', email: 't.osei@leasegov.internal' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up a ContractRecord by its id */
export function findContractRecord(id: string | null): ContractRecord | undefined {
  if (!id) return undefined;
  return MOCK_CONTRACT_RECORDS.find(r => r.id === id);
}

/** Filter ContractRecords by a search string (counterparty, address, or contract number) */
export function searchContractRecords(query: string): ContractRecord[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return MOCK_CONTRACT_RECORDS.filter(
    r =>
      r.counterparty.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      r.contractNumber.toLowerCase().includes(q),
  );
}

/** Status badge styles for ContractRecord status */
export const CONTRACT_RECORD_STATUS_BADGE: Record<ContractRecordStatus, string> = {
  draft:        'bg-slate-100 text-slate-600 border border-slate-200',
  under_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected:     'bg-red-50 text-red-700 border border-red-200',
  expired:      'bg-slate-100 text-slate-500 border border-slate-200',
};

export const CONTRACT_RECORD_STATUS_LABEL: Record<ContractRecordStatus, string> = {
  draft: 'Draft', under_review: 'Under Review', approved: 'Approved',
  rejected: 'Rejected', expired: 'Expired',
};

/** Status badge styles for ContractPackageV3 status */
export const PACKAGE_STATUS_BADGE: Record<PackageStatus, string> = {
  assembly:    'bg-slate-100 text-slate-600 border border-slate-200',
  validated:   'bg-blue-50 text-blue-700 border border-blue-200',
  flags_raised:'bg-amber-50 text-amber-700 border border-amber-200',
  submitted:   'bg-violet-50 text-violet-700 border border-violet-200',
  completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected:    'bg-red-50 text-red-700 border border-red-200',
};

export const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  assembly: 'Assembly', validated: 'Validated', flags_raised: 'Flags Raised',
  submitted: 'Submitted', completed: 'Completed', rejected: 'Rejected',
};

/** Status badge styles for SubmissionV3 status */
export const SUBMISSION_STATUS_BADGE: Record<SubmissionStatus, string> = {
  'Pending':     'bg-slate-100 text-slate-600 border border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Warning':     'bg-amber-50 text-amber-700 border border-amber-200',
  'Completed':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

/** Role pill colors for document roles */
export const ROLE_PILL_COLOR: Record<DocumentRole, string> = {
  'Base Contract': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Amendment':     'bg-violet-100 text-violet-800 border border-violet-200',
  'Addendum':      'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'Exhibit':       'bg-teal-100 text-teal-800 border border-teal-200',
  'Schedule':      'bg-cyan-100 text-cyan-800 border border-cyan-200',
  'Notice':        'bg-orange-100 text-orange-800 border border-orange-200',
  'Supporting':    'bg-slate-100 text-slate-700 border border-slate-200',
  'Unassigned':    'bg-slate-50 text-slate-400 border border-slate-200',
};
