/**
 * mockReassessmentData.ts — Shared FC-6 mock data
 * Single source of truth for all reassessment case lookups used across:
 *
 *   Case-level screens (use :id path param):
 *     ReassessmentClassification  → uses classify fields
 *     ReassessmentAssessment      → uses assess fields
 *     ReassessmentAnalysis        → uses analysis fields
 *     ReassessmentConcurrentWarn  → uses concurrent fields
 *
 *   Workflow screens (use ?caseId= query param):
 *     ReassessmentUpdate, ReassessmentAnalysis (workflow),
 *     ReassessmentReview, ReassessmentApproval
 *
 * TODO: Replace with backend calls — GET /api/reassessments/cases/:id
 */

// ─── Shared types ────────────────────────────────────────────────────────────

export type AutoLevel = 'full_autonomous' | 'collaborative' | 'manual';

// ─── Full case record (superset of all per-screen fields) ────────────────────

export interface ReassessmentCase {
  // Identity
  id: string;
  case_ref: string;
  contract_number: string;
  title: string;
  workspace: string;

  // Contract type
  contract_type?: 'property_lease' | 'equipment_lease';

  // Equipment-specific assessment fields (populated for equipment_lease cases)
  useful_life_months?: number;
  remaining_months?: number;
  pv_percentage?: number;
  purchase_option_price?: string;
  rvg_amount?: string;
  asset_description?: string;

  // Classification fields
  trigger_type: string;
  trigger_date: string;
  path_type: string;
  concurrent_case_ids: string[];
  automation_level: AutoLevel;
  contract_record_id: string;

  // Assessment fields
  option_type: string;
  option_exercise_date: string;
  /** Stored in cents — divide by 100 for display */
  financial_impact_amount: number;

  // Analysis (case-level) fields
  is_remediation: boolean;

  // Workflow screen fields
  analyst: string;
  reviewer: string;
  approver: string;
  /** AI confidence score 0–100 */
  ai_confidence: number;
  memo_ref: string;
  submitted_by: string;
  submitted_at: string;
  current_term_end: string;
  monthly_payment: string;
  lease_liability: string;
}

// ─── Canonical lookup (c1–c10) ───────────────────────────────────────────────

export const MOCK_REASSESSMENT_CASES: Record<string, ReassessmentCase> = {
  c1: {
    id: 'c1', case_ref: 'RC-2026-0014', contract_number: 'CR-2026-0088',
    title: 'Office Tower — 350 Fifth Ave', workspace: 'Corporate Real Estate',
    trigger_type: 'mod_term',      trigger_date: '2026-05-10', path_type: 'modification',
    concurrent_case_ids: [],       automation_level: 'collaborative', contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2027-06-30', financial_impact_amount: 2800000_00,
    is_remediation: false,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 96,             memo_ref: 'MEMO-2026-0088-R1',
    submitted_by: 'Sarah Chen',    submitted_at: '2026-05-15 14:32',
    current_term_end: '2028-06-30', monthly_payment: '$85,000', lease_liability: '$4,250,000',
  },
  c2: {
    id: 'c2', case_ref: 'RC-2026-0013', contract_number: 'CR-2026-0072',
    title: 'Retail HQ — 200 Park Ave', workspace: 'Retail Portfolio',
    trigger_type: 'opt_assess',    trigger_date: '2026-05-12', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'collaborative', contract_record_id: 'r1',
    option_type: 'purchase',       option_exercise_date: '2027-09-30', financial_impact_amount: 8500000_00,
    is_remediation: false,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 91,             memo_ref: 'MEMO-2026-0072-R1',
    submitted_by: 'Jordan Kim',    submitted_at: '2026-05-14 11:20',
    current_term_end: '2027-12-31', monthly_payment: '$62,000', lease_liability: '$3,100,000',
  },
  c3: {
    id: 'c3', case_ref: 'RC-2026-0012', contract_number: 'CR-2026-0055',
    title: 'Warehouse — 1 Industrial Blvd', workspace: 'Industrial Assets',
    trigger_type: 'opt_assess',    trigger_date: '2026-05-08', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'manual',        contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2027-03-31', financial_impact_amount: 4500000_00,
    is_remediation: false,
    analyst: 'Sarah Chen',         reviewer: 'Jordan Kim',   approver: 'Michael Torres',
    ai_confidence: 88,             memo_ref: 'MEMO-2026-0055-R1',
    submitted_by: 'Jordan Kim',    submitted_at: '2026-05-13 09:45',
    current_term_end: '2029-03-31', monthly_payment: '$41,500', lease_liability: '$2,075,000',
  },
  c4: {
    id: 'c4', case_ref: 'RC-2026-0011', contract_number: 'CR-2026-0041',
    title: 'Data Center — 500 Tech Park', workspace: 'Technology Assets',
    trigger_type: 'mod_rent',      trigger_date: '2026-05-14', path_type: 'modification',
    concurrent_case_ids: [],       automation_level: 'manual',        contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2027-12-31', financial_impact_amount: 1200000_00,
    is_remediation: false,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 93,             memo_ref: 'MEMO-2026-0041-R1',
    submitted_by: 'Sarah Chen',    submitted_at: '2026-05-12 16:10',
    current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000',
  },
  c5: {
    id: 'c5', case_ref: 'RC-2026-0010', contract_number: 'CR-2026-0033',
    title: 'Branch Office — 88 Main St', workspace: 'Branch Network',
    trigger_type: 'mod_scope_inc', trigger_date: '2026-04-20', path_type: 'modification',
    concurrent_case_ids: [],       automation_level: 'collaborative', contract_record_id: 'r1',
    option_type: 'termination',    option_exercise_date: '2026-12-31', financial_impact_amount: 650000_00,
    is_remediation: false,
    analyst: 'Sarah Chen',         reviewer: 'Jordan Kim',   approver: 'Michael Torres',
    ai_confidence: 95,             memo_ref: 'MEMO-2026-0033-R1',
    submitted_by: 'Jordan Kim',    submitted_at: '2026-05-11 14:55',
    current_term_end: '2027-06-30', monthly_payment: '$28,000', lease_liability: '$1,120,000',
  },
  c6: {
    id: 'c6', case_ref: 'RC-2026-0009', contract_number: 'CR-2026-0028',
    title: 'Parking Garage — Level B2', workspace: 'Facilities',
    trigger_type: 'compound',      trigger_date: '2026-04-15', path_type: 'modification',
    concurrent_case_ids: ['c1', 'c2'], automation_level: 'collaborative', contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2027-06-30', financial_impact_amount: 900000_00,
    is_remediation: true,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 87,             memo_ref: 'MEMO-2026-0028-R1',
    submitted_by: 'Sarah Chen',    submitted_at: '2026-05-10 10:30',
    current_term_end: '2026-12-31', monthly_payment: '$18,500', lease_liability: '$555,000',
  },
  c7: {
    id: 'c7', case_ref: 'RC-2026-0008', contract_number: 'CR-2026-0088',
    title: 'Office Tower — 350 Fifth Ave', workspace: 'Corporate Real Estate',
    trigger_type: 'opt_assess',    trigger_date: '2026-04-10', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'manual',        contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2027-01-31', financial_impact_amount: 3100000_00,
    is_remediation: false,
    analyst: 'Sarah Chen',         reviewer: 'Jordan Kim',   approver: 'Michael Torres',
    ai_confidence: 96,             memo_ref: 'MEMO-2026-0088-R2',
    submitted_by: 'Jordan Kim',    submitted_at: '2026-05-09 15:22',
    current_term_end: '2028-06-30', monthly_payment: '$85,000', lease_liability: '$4,250,000',
  },
  c8: {
    id: 'c8', case_ref: 'RC-2026-0007', contract_number: 'CR-2026-0072',
    title: 'Retail HQ — 200 Park Ave', workspace: 'Retail Portfolio',
    trigger_type: 'mod_index',     trigger_date: '2026-04-05', path_type: 'modification',
    concurrent_case_ids: [],       automation_level: 'collaborative', contract_record_id: 'r1',
    option_type: 'purchase',       option_exercise_date: '2027-03-31', financial_impact_amount: 7200000_00,
    is_remediation: false,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 90,             memo_ref: 'MEMO-2026-0072-R2',
    submitted_by: 'Sarah Chen',    submitted_at: '2026-05-08 13:40',
    current_term_end: '2027-12-31', monthly_payment: '$62,000', lease_liability: '$3,100,000',
  },
  c9: {
    id: 'c9', case_ref: 'RC-2026-0006', contract_number: 'CR-2026-0055',
    title: 'Warehouse — 1 Industrial Blvd', workspace: 'Industrial Assets',
    trigger_type: 'class_reass',   trigger_date: '2026-03-20', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'manual',        contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2026-09-30', financial_impact_amount: 420000_00,
    is_remediation: false,
    analyst: 'Sarah Chen',         reviewer: 'Jordan Kim',   approver: 'Michael Torres',
    ai_confidence: 89,             memo_ref: 'MEMO-2026-0055-R2',
    submitted_by: 'Jordan Kim',    submitted_at: '2026-05-07 11:15',
    current_term_end: '2029-03-31', monthly_payment: '$41,500', lease_liability: '$2,075,000',
  },
  c10: {
    id: 'c10', case_ref: 'RC-2026-0005', contract_number: 'CR-2026-0041',
    title: 'Data Center — 500 Tech Park', workspace: 'Technology Assets',
    trigger_type: 'opt_assess',    trigger_date: '2026-03-15', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'manual',        contract_record_id: 'r1',
    option_type: 'renewal',        option_exercise_date: '2026-06-30', financial_impact_amount: 1800000_00,
    is_remediation: false,
    analyst: 'Jordan Kim',         reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 94,             memo_ref: 'MEMO-2026-0041-R2',
    submitted_by: 'Sarah Chen',    submitted_at: '2026-05-06 09:00',
    current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000',
  },
  'case-eq-001': {
    id: 'case-eq-001', case_ref: 'RC-2026-EQ-001', contract_number: 'EQ-2026-0002',
    title: 'Haas VF-4SS CNC Machining Center', workspace: 'Operations',
    contract_type: 'equipment_lease' as const,
    trigger_type: 'mod_rent',      trigger_date: '2026-06-01', path_type: 'modification',
    concurrent_case_ids: [],       automation_level: 'collaborative' as const, contract_record_id: 'eq-002',
    option_type: 'purchase',       option_exercise_date: '2032-07-31', financial_impact_amount: 6840000,
    is_remediation: false,
    analyst: 'Alex Rivera',        reviewer: 'Sarah Chen',   approver: 'Michael Torres',
    ai_confidence: 88,             memo_ref: 'MEMO-2026-EQ-0002-R1',
    submitted_by: 'Alex Rivera',   submitted_at: '2026-06-05 10:15',
    current_term_end: '2032-07-31', monthly_payment: '$9,800', lease_liability: '$588,000',
    useful_life_months: 120, remaining_months: 74, pv_percentage: 91,
    purchase_option_price: '$28,000', rvg_amount: '$15,000',
    asset_description: 'Haas VF-4SS CNC Machining Center',
  },
  'case-eq-002': {
    id: 'case-eq-002', case_ref: 'RC-2026-EQ-002', contract_number: 'EQ-2026-0001',
    title: 'Dell PowerEdge R750 Server Array (×12)', workspace: 'Technology Assets',
    contract_type: 'equipment_lease' as const,
    trigger_type: 'opt_assess',    trigger_date: '2026-06-10', path_type: 'reassessment',
    concurrent_case_ids: [],       automation_level: 'manual' as const, contract_record_id: 'eq-001',
    option_type: 'purchase',       option_exercise_date: '2028-01-31', financial_impact_amount: 9600000,
    is_remediation: false,
    analyst: 'Alex Rivera',        reviewer: 'Jordan Kim',   approver: 'Michael Torres',
    ai_confidence: 82,             memo_ref: 'MEMO-2026-EQ-0001-R1',
    submitted_by: 'Alex Rivera',   submitted_at: '2026-06-12 14:00',
    current_term_end: '2028-01-31', monthly_payment: '$14,200', lease_liability: '$340,800',
    useful_life_months: 60, remaining_months: 19, pv_percentage: 78,
    purchase_option_price: '$72,000', rvg_amount: 'None',
    asset_description: 'Dell PowerEdge R750 Server Array (×12)',
  },
};

/** Fallback used when a caseId is absent or unrecognised */
export const FALLBACK_REASSESSMENT_CASE = MOCK_REASSESSMENT_CASES['c1'];

// ─── Status-aware routing helper ─────────────────────────────────────────────
/**
 * Resolve the correct destination URL for a case's Open action.
 * Workflow screens receive ?caseId= so they can look up case data from
 * MOCK_REASSESSMENT_CASES.
 * Case-level screens (/reassessment/cases/:id/*) use the :id path param.
 *
 * Used by: ReassessmentCaseList, ReassessmentDashboard, ApprovalsQueue
 */
export function resolveReassessmentUrl(caseId: string, status: string): string {
  switch (status) {
    // Workflow screens — pass caseId as query param
    case 'pending_review':        return `/workflows/reassessment/review?caseId=${caseId}`;
    case 'pending_approval':      return `/workflows/reassessment/approval?caseId=${caseId}`;
    case 'analysis_in_progress':
    case 'analysis_pending':      return `/workflows/reassessment/analysis?caseId=${caseId}`;
    case 'initiated':             return `/workflows/reassessment/update?caseId=${caseId}`;
    // Case-level screens — use :id param in path
    case 'memo_draft':            return `/reassessment/cases/${caseId}/memo`;
    case 'assessment_pending':
    case 'assessment_review':     return `/reassessment/cases/${caseId}/assess`;
    case 'remediation':           return `/reassessment/cases/${caseId}/remediation`;
    case 'classification_pending':
    case 'classification_review':
    default:                      return `/reassessment/cases/${caseId}/classify`;
  }
}
