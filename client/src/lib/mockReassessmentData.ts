/**
 * mockReassessmentData.ts — Shared FC-6 mock data
 *
 * Single source of truth for reassessment case lookup used by:
 *   - /workflows/reassessment/update   (ReassessmentUpdate)
 *   - /workflows/reassessment/analysis (ReassessmentAnalysis)
 *   - /workflows/reassessment/review   (ReassessmentReview)
 *   - /workflows/reassessment/approval (ReassessmentApproval)
 *
 * TODO: Replace with backend call — GET /api/reassessments/cases/:id
 *
 * All case IDs (c1–c10) align with the MOCK_CASES_LOOKUP defined in
 * the case-level screens (ReassessmentClassification, ReassessmentAssessment,
 * ReassessmentAnalysis, ReassessmentConcurrentWarn) so navigation state
 * is consistent end-to-end.
 */

export interface ReassessmentCaseSummary {
  id: string;
  case_ref: string;
  contract_number: string;
  title: string;
  workspace: string;
  /** Analyst / preparer assigned to this case */
  analyst: string;
  /** Reviewer assigned to this case */
  reviewer: string;
  /** Approver / controller assigned to this case */
  approver: string;
  /** AI confidence score (0–100) */
  ai_confidence: number;
  /** Memo reference once generated */
  memo_ref: string;
  /** User who submitted for approval */
  submitted_by: string;
  /** ISO-like display string for submission timestamp */
  submitted_at: string;
  /** Current term end date (display string) */
  current_term_end: string;
  /** Monthly payment (display string) */
  monthly_payment: string;
  /** Current lease liability (display string) */
  lease_liability: string;
}

// c1–c10 must stay in sync with the case-level screen lookups
export const MOCK_REASSESSMENT_CASES: Record<string, ReassessmentCaseSummary> = {
  c1: {
    id: 'c1', case_ref: 'RC-2026-0014', contract_number: 'CR-2026-0088',
    title: 'Office Tower — 350 Fifth Ave', workspace: 'Corporate Real Estate',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 96, memo_ref: 'MEMO-2026-0088-R1',
    submitted_by: 'Sarah Chen', submitted_at: '2026-05-15 14:32',
    current_term_end: '2028-06-30', monthly_payment: '$85,000', lease_liability: '$4,250,000',
  },
  c2: {
    id: 'c2', case_ref: 'RC-2026-0013', contract_number: 'CR-2026-0072',
    title: 'Retail HQ — 200 Park Ave', workspace: 'Retail Portfolio',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 91, memo_ref: 'MEMO-2026-0072-R1',
    submitted_by: 'Jordan Kim', submitted_at: '2026-05-14 11:20',
    current_term_end: '2027-12-31', monthly_payment: '$62,000', lease_liability: '$3,100,000',
  },
  c3: {
    id: 'c3', case_ref: 'RC-2026-0012', contract_number: 'CR-2026-0055',
    title: 'Warehouse — 1 Industrial Blvd', workspace: 'Industrial Assets',
    analyst: 'Sarah Chen', reviewer: 'Jordan Kim', approver: 'Michael Torres',
    ai_confidence: 88, memo_ref: 'MEMO-2026-0055-R1',
    submitted_by: 'Jordan Kim', submitted_at: '2026-05-13 09:45',
    current_term_end: '2029-03-31', monthly_payment: '$41,500', lease_liability: '$2,075,000',
  },
  c4: {
    id: 'c4', case_ref: 'RC-2026-0011', contract_number: 'CR-2026-0041',
    title: 'Data Center — 500 Tech Park', workspace: 'Technology Assets',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 93, memo_ref: 'MEMO-2026-0041-R1',
    submitted_by: 'Sarah Chen', submitted_at: '2026-05-12 16:10',
    current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000',
  },
  c5: {
    id: 'c5', case_ref: 'RC-2026-0010', contract_number: 'CR-2026-0033',
    title: 'Branch Office — 88 Main St', workspace: 'Branch Network',
    analyst: 'Sarah Chen', reviewer: 'Jordan Kim', approver: 'Michael Torres',
    ai_confidence: 95, memo_ref: 'MEMO-2026-0033-R1',
    submitted_by: 'Jordan Kim', submitted_at: '2026-05-11 14:55',
    current_term_end: '2027-06-30', monthly_payment: '$28,000', lease_liability: '$1,120,000',
  },
  c6: {
    id: 'c6', case_ref: 'RC-2026-0009', contract_number: 'CR-2026-0028',
    title: 'Parking Garage — Level B2', workspace: 'Facilities',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 87, memo_ref: 'MEMO-2026-0028-R1',
    submitted_by: 'Sarah Chen', submitted_at: '2026-05-10 10:30',
    current_term_end: '2026-12-31', monthly_payment: '$18,500', lease_liability: '$555,000',
  },
  c7: {
    id: 'c7', case_ref: 'RC-2026-0008', contract_number: 'CR-2026-0088',
    title: 'Office Tower — 350 Fifth Ave', workspace: 'Corporate Real Estate',
    analyst: 'Sarah Chen', reviewer: 'Jordan Kim', approver: 'Michael Torres',
    ai_confidence: 96, memo_ref: 'MEMO-2026-0088-R2',
    submitted_by: 'Jordan Kim', submitted_at: '2026-05-09 15:22',
    current_term_end: '2028-06-30', monthly_payment: '$85,000', lease_liability: '$4,250,000',
  },
  c8: {
    id: 'c8', case_ref: 'RC-2026-0007', contract_number: 'CR-2026-0072',
    title: 'Retail HQ — 200 Park Ave', workspace: 'Retail Portfolio',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 90, memo_ref: 'MEMO-2026-0072-R2',
    submitted_by: 'Sarah Chen', submitted_at: '2026-05-08 13:40',
    current_term_end: '2027-12-31', monthly_payment: '$62,000', lease_liability: '$3,100,000',
  },
  c9: {
    id: 'c9', case_ref: 'RC-2026-0006', contract_number: 'CR-2026-0055',
    title: 'Warehouse — 1 Industrial Blvd', workspace: 'Industrial Assets',
    analyst: 'Sarah Chen', reviewer: 'Jordan Kim', approver: 'Michael Torres',
    ai_confidence: 89, memo_ref: 'MEMO-2026-0055-R2',
    submitted_by: 'Jordan Kim', submitted_at: '2026-05-07 11:15',
    current_term_end: '2029-03-31', monthly_payment: '$41,500', lease_liability: '$2,075,000',
  },
  c10: {
    id: 'c10', case_ref: 'RC-2026-0005', contract_number: 'CR-2026-0041',
    title: 'Data Center — 500 Tech Park', workspace: 'Technology Assets',
    analyst: 'Jordan Kim', reviewer: 'Sarah Chen', approver: 'Michael Torres',
    ai_confidence: 94, memo_ref: 'MEMO-2026-0041-R2',
    submitted_by: 'Sarah Chen', submitted_at: '2026-05-06 09:00',
    current_term_end: '2030-09-30', monthly_payment: '$125,000', lease_liability: '$7,500,000',
  },
};

/** Fallback used when a caseId is absent or unrecognised */
export const FALLBACK_REASSESSMENT_CASE = MOCK_REASSESSMENT_CASES['c1'];
