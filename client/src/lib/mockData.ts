/**
 * mockData.ts — Shared V3 mock data for FC-1 Document Pipeline
 *
 * V3 Document Intake Governance Flow — Change 1 (§1b, §1c)
 * Reference: IMPLEMENTATION_PROMPT_INTAKE_GOVERNANCE_V3.md
 *
 * Exports:
 *   MOCK_CONTRACT_RECORDS   — 4 seed ContractRecords (Acme Corp, Globex LLC, Initech, Office Tower Partners)
 *   MOCK_PACKAGES           — 2 seed ContractPackages (PKG-2026-001 submitted, PKG-2026-002 assembly)
 *   MOCK_WORKSPACES         — workspace list for upload modal dropdown
 *   MOCK_ASSIGNEES          — users with Preparer / Lease Admin role for routing context
 *   MOCK_EQUIPMENT_RECORDS  — 3 seed EquipmentLease records (IT Hardware, Manufacturing, Vehicles)
 */
import type { EquipmentLease } from '@/types/contracts/equipmentLease/EquipmentLease'

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
  contract_type?: 'property_lease' | 'equipment_lease' | 'service_contract';
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
    contract_type: 'property_lease',
  },
  {
    id: 'mock-record-002',
    contractNumber: 'CR-2026-0039',
    counterparty: 'Globex LLC',
    address: '456 Oak Ave, Chicago IL 60601',
    status: 'under_review',
    classification: 'finance_lease',
    contract_type: 'property_lease',
  },
  {
    id: 'mock-record-003',
    contractNumber: 'CR-2026-0040',
    counterparty: 'Initech',
    address: '789 Pine Rd, Austin TX 78701',
    status: 'draft',
    classification: 'operating_lease',
    contract_type: 'property_lease',
  },
  {
    // FC-3 BR1: Office Tower — 350 Fifth Ave (maps to PKG-2026-0041 in PackagesComposition)
    id: 'mock-record-004',
    contractNumber: 'CR-2026-0041',
    counterparty: 'Office Tower Partners LLC',
    address: '350 Fifth Ave, New York NY 10118',
    status: 'under_review',
    classification: 'operating_lease',
    contract_type: 'property_lease',
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

// ─── Reviewers / Approvers ────────────────────────────────────────────────

/** Reviewer / Approver users for Approval Queue reassignment */
export interface Reviewer {
  id: string;
  name: string;
  role: 'Reviewer' | 'Approver';
  avatarColor: string;
  email: string;
}

export const MOCK_REVIEWERS: Reviewer[] = [
  { id: 'user-rev-001', name: 'A. Chen',      role: 'Reviewer', avatarColor: '#3b82f6', email: 'a.chen@leasegov.internal' },
  { id: 'user-rev-002', name: 'J. Martinez',  role: 'Reviewer', avatarColor: '#8b5cf6', email: 'j.martinez@leasegov.internal' },
  { id: 'user-rev-003', name: 'P. Nakamura',  role: 'Reviewer', avatarColor: '#f59e0b', email: 'p.nakamura@leasegov.internal' },
  { id: 'user-rev-004', name: 'B. Okafor',    role: 'Reviewer', avatarColor: '#10b981', email: 'b.okafor@leasegov.internal' },
  { id: 'user-apr-001', name: 'K. Lindqvist', role: 'Approver', avatarColor: '#ec4899', email: 'k.lindqvist@leasegov.internal' },
  { id: 'user-apr-002', name: 'H. Vasquez',   role: 'Approver', avatarColor: '#14b8a6', email: 'h.vasquez@leasegov.internal' },
  { id: 'user-apr-003', name: 'N. Obi',       role: 'Approver', avatarColor: '#f97316', email: 'n.obi@leasegov.internal' },
];

// ─── Role Personas ───────────────────────────────────────────────────────────

/**
 * ROLE_PERSONAS — maps each UserRole to a demo persona name.
 * Used wherever the UI must show the current user's name dynamically
 * (e.g. tracked corrections, comment authors, reassignment dialogs).
 * Production: replace with JWT token claims (given_name + family_name).
 */
export const ROLE_PERSONAS: Record<string, { name: string; initials: string; email: string }> = {
  document_submitter: { name: 'J. Martinez',   initials: 'JM', email: 'j.martinez@leasegov.com' },
  preparer:           { name: 'L. Nguyen',      initials: 'LN', email: 'l.nguyen@leasegov.com' },
  reviewer:           { name: 'M. Rodriguez',   initials: 'MR', email: 'm.rodriguez@leasegov.com' },
  approver:           { name: 'D. Chen',         initials: 'DC', email: 'd.chen@leasegov.com' },
  accountant:         { name: 'P. Okonkwo',     initials: 'PO', email: 'p.okonkwo@leasegov.com' },
  controller:         { name: 'S. Patel',        initials: 'SP', email: 's.patel@leasegov.com' },
  business_submitter: { name: 'A. Kim',          initials: 'AK', email: 'a.kim@leasegov.com' },
  auditor:            { name: 'R. Thompson',     initials: 'RT', email: 'r.thompson@leasegov.com' },
  lease_admin:        { name: 'C. Williams',     initials: 'CW', email: 'c.williams@leasegov.com' },
};

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

// ─── Equipment Lease Mock Records ─────────────────────────────────────────────
// Equipment Lease Prompt 1 of 5 — Part 1B
// Three seed records covering IT Hardware (operating), Manufacturing (finance),
// and Vehicles (operating). IDs: eq-001, eq-002, eq-003.

export const MOCK_EQUIPMENT_RECORDS: EquipmentLease[] = [
  {
    id: 'eq-001',
    contractNumber: 'EQ-2026-0001',
    contract_type: 'equipment_lease',
    status: 'approved',
    lock_status: 'unlocked',
    workspace: 'Corporate IT',
    equipment_type: 'Enterprise Server Array',
    equipment_category: 'it_hardware',
    manufacturer: 'Dell Technologies',
    model: 'PowerEdge R750 (×12 units)',
    serial_number: 'DELL-SRV-2024-0088 through 0099',
    asset_tag: 'IT-2024-SRV-088',
    quantity: 12,
    installation_location: 'Data Center, Floor B2, Rack 14-25',
    counterparty: 'Dell Financial Services LLC',
    commencement_date: '2024-01-15',
    expiration_date: '2029-01-14',
    base_lease_term_months: 60,
    monthly_payment: 18400,
    payment_frequency: 'monthly',
    fair_value_at_commencement: 960000,
    residual_value_guarantee: 48000,
    purchase_option_price: 96000,
    purchase_option_exercise_date: '2029-01-14',
    purchase_option_reasonably_certain: false,
    condition_at_commencement: 'New — manufacturer warranty active',
    return_conditions: 'Original working condition, all components present, factory reset required',
    maintenance_responsibility: 'lessor',
    permitted_modifications: 'RAM upgrades permitted with written consent',
    useful_life_months: 84,
    lessee_useful_life_coverage_pct: 71.4,
    ownership_transfer_at_end: false,
    specialized_nature: false,
    lease_classification: 'operating',
    classification_rationale:
      'Term covers 71% of useful life (below 75% threshold). PV of payments $882,000 = 91.9% of fair value — this criterion is met. However, no ownership transfer, purchase option not reasonably certain, and equipment not specialized. Classification: Operating under ASC 842-10-25-2.',
    discount_rate: 0.0425,
    present_value_of_payments: 882000,
    pv_as_pct_of_fair_value: 91.9,
    rou_asset_balance: 847200,
    lease_liability_balance: 851400,
  },
  {
    id: 'eq-002',
    contractNumber: 'EQ-2026-0002',
    contract_type: 'equipment_lease',
    status: 'approved',
    lock_status: 'unlocked',
    workspace: 'Operations',
    equipment_type: 'CNC Machining Center',
    equipment_category: 'manufacturing',
    manufacturer: 'Haas Automation',
    model: 'VF-4SS Vertical Machining Center',
    serial_number: 'HAAS-VF4SS-2023-1142',
    asset_tag: 'MFG-2023-CNC-001',
    quantity: 1,
    installation_location: 'Manufacturing Plant, Building C, Bay 7',
    counterparty: 'Haas Financial Services',
    commencement_date: '2023-07-01',
    expiration_date: '2030-06-30',
    base_lease_term_months: 84,
    monthly_payment: 11200,
    payment_frequency: 'monthly',
    fair_value_at_commencement: 875000,
    residual_value_guarantee: null,
    purchase_option_price: 87500,
    purchase_option_exercise_date: '2030-06-30',
    purchase_option_reasonably_certain: true,
    condition_at_commencement: 'New — commissioning completed July 2023',
    return_conditions:
      'Full deinstallation at lessee expense. Machine must pass Haas factory acceptance test.',
    maintenance_responsibility: 'lessee',
    permitted_modifications: null,
    useful_life_months: 120,
    lessee_useful_life_coverage_pct: 70.0,
    ownership_transfer_at_end: false,
    specialized_nature: true,
    lease_classification: 'finance',
    classification_rationale:
      "Purchase option price of $87,500 is significantly below expected fair value at exercise (~$220,000). Lessee is reasonably certain to exercise. Finance lease under ASC 842-10-25-2(b). Additionally, machine is specialized for lessee's manufacturing process with no practical alternative use to lessor.",
    discount_rate: 0.051,
    present_value_of_payments: 793000,
    pv_as_pct_of_fair_value: 90.6,
    rou_asset_balance: 718400,
    lease_liability_balance: 724100,
  },
  {
    id: 'eq-003',
    contractNumber: 'EQ-2026-0003',
    contract_type: 'equipment_lease',
    status: 'under_review',
    lock_status: 'pending_review',
    workspace: 'Fleet Management',
    equipment_type: 'Commercial Vehicle Fleet',
    equipment_category: 'vehicles',
    manufacturer: 'Ford Motor Company',
    model: 'Transit 350 Cargo Van (×8 vehicles)',
    serial_number: 'Multiple — see Schedule A',
    asset_tag: 'FLT-2025-VAN-001 through 008',
    quantity: 8,
    installation_location: 'Distribution Center, 789 Pine Rd, Austin TX 78701',
    counterparty: 'Ford Motor Credit Company',
    commencement_date: '2025-03-01',
    expiration_date: '2028-02-28',
    base_lease_term_months: 36,
    monthly_payment: 6840,
    payment_frequency: 'monthly',
    fair_value_at_commencement: 416000,
    residual_value_guarantee: 83200,
    purchase_option_price: null,
    purchase_option_exercise_date: null,
    purchase_option_reasonably_certain: null,
    condition_at_commencement: 'New — 2025 model year',
    return_conditions:
      'Maximum 45,000 miles per vehicle. Excess mileage charged at $0.22/mile. Normal wear and tear accepted.',
    maintenance_responsibility: 'lessee',
    permitted_modifications:
      'Racking and shelving installation permitted. Must be removed at return.',
    usage_limits: '45,000 miles per vehicle over 36-month term',
    variable_payment_rate: 0.22,
    excess_usage_rate: 0.22,
    useful_life_months: 96,
    lessee_useful_life_coverage_pct: 37.5,
    ownership_transfer_at_end: false,
    specialized_nature: false,
    lease_classification: 'operating',
    classification_rationale:
      'Term covers only 37.5% of useful life. No purchase option. No ownership transfer. RVG of $83,200 (20% of fair value) does not indicate finance lease. Operating lease under ASC 842.',
    discount_rate: 0.0475,
    present_value_of_payments: 226800,
    pv_as_pct_of_fair_value: 54.5,
    rou_asset_balance: 198400,
    lease_liability_balance: 204100,
  },
]

/** Look up an EquipmentLease record by its id */
export function findEquipmentRecord(id: string | null): EquipmentLease | undefined {
  if (!id) return undefined
  return MOCK_EQUIPMENT_RECORDS.find(r => r.id === id)
}
