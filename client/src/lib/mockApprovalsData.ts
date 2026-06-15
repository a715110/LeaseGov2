/**
 * mockApprovalsData.ts
 * Shared lookup used by ApprovalsReview and ApprovalsApprover so that each
 * task navigated to from ApprovalsQueue shows distinct contract data.
 *
 * Keyed by the task ID used in the route: /approvals/review/:id
 * and /approvals/final/:id.
 *
 * TODO: Replace with real API calls — GET /approvals/tasks/:id
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApprovalTaskSummary {
  task_reference: string;
  record_id: string;
  record_title: string;
  sod_violation: boolean;
  has_deferred: boolean;
  deferred_count: number;
  reviewer_name: string;
  reviewer_comments: string;
  submitted_by: string;
  submitted_at: string;
  sla_deadline_at: string | null;
  rework_iteration: number;
  approval_stage: "review" | "final_approval";
  key_terms: {
    landlord: string;
    tenant: string;
    commencement: string;
    expiration: string;
    term_months: number;
    base_rent: string;
    rent_frequency: string;
    escalation: string;
    property: string;
    area_sqft: string;
    classification: string;
    accounting_standard: string;
  };
  financial_impact: {
    before_rou: string;
    after_rou: string;
    before_liability: string;
    after_liability: string;
    delta: string;
  };
}

export interface ApprovalField {
  id: string;
  field_name: string;
  field_label: string;
  field_category: "core_metadata" | "property" | "financial" | "legal" | "tables" | "amendment";
  is_critical: boolean;
  ai_extracted_value: string;
  ai_confidence: number;
  preparer_value: string;
  reviewer_value: string;
  reviewer_corrected_at: string | null;
  disposition: "accepted" | "corrected" | "deferred" | "pending";
  rework_flagged: boolean;
}

export interface ApprovalTaskData {
  summary: ApprovalTaskSummary;
  fields: ApprovalField[];
}

// ─── Shared field templates ───────────────────────────────────────────────────
function coreFields(
  landlord: string,
  tenant: string,
  commence: string,
  expire: string,
  termMonths: number,
  baseRent: string,
  area: string,
  address: string,
  classification: string,
  escalationType: string,
  escalationRate: string,
  reworkFlaggedField?: string
): ApprovalField[] {
  const flag = (name: string) => reworkFlaggedField === name;
  return [
    { id:"f1",  field_name:"landlord_name",          field_label:"Landlord Name",          field_category:"core_metadata", is_critical:true,  ai_extracted_value:landlord,       ai_confidence:0.97, preparer_value:landlord,       reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:flag("landlord_name") },
    { id:"f2",  field_name:"tenant_name",             field_label:"Tenant Name",             field_category:"core_metadata", is_critical:true,  ai_extracted_value:tenant,         ai_confidence:0.99, preparer_value:tenant,         reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:flag("tenant_name") },
    { id:"f3",  field_name:"commencement_date",       field_label:"Commencement Date",       field_category:"core_metadata", is_critical:true,  ai_extracted_value:commence,       ai_confidence:0.95, preparer_value:commence,       reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f4",  field_name:"expiration_date",         field_label:"Expiration Date",         field_category:"core_metadata", is_critical:true,  ai_extracted_value:expire,         ai_confidence:0.94, preparer_value:expire,         reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f5",  field_name:"property_address_street", field_label:"Property Address",        field_category:"property",      is_critical:true,  ai_extracted_value:address,        ai_confidence:0.98, preparer_value:address,        reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f6",  field_name:"rentable_area_sqft",      field_label:"Rentable Area (sqft)",    field_category:"property",      is_critical:false, ai_extracted_value:area,           ai_confidence:0.91, preparer_value:area,           reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f7",  field_name:"base_rent_amount",        field_label:"Base Rent Amount",        field_category:"financial",     is_critical:true,  ai_extracted_value:baseRent,       ai_confidence:0.72, preparer_value:baseRent,       reviewer_value:"", reviewer_corrected_at:null, disposition:flag("base_rent_amount") ? "corrected" : "accepted", rework_flagged:flag("base_rent_amount") },
    { id:"f8",  field_name:"base_rent_frequency",     field_label:"Rent Frequency",          field_category:"financial",     is_critical:true,  ai_extracted_value:"monthly",      ai_confidence:0.99, preparer_value:"monthly",      reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f9",  field_name:"escalation_type",         field_label:"Escalation Type",         field_category:"financial",     is_critical:true,  ai_extracted_value:escalationType, ai_confidence:0.88, preparer_value:escalationType, reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f10", field_name:"escalation_rate",         field_label:"Escalation Rate",         field_category:"financial",     is_critical:true,  ai_extracted_value:escalationRate, ai_confidence:0.85, preparer_value:escalationRate, reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f11", field_name:"lease_term_months",       field_label:"Lease Term (months)",     field_category:"legal",         is_critical:true,  ai_extracted_value:String(termMonths), ai_confidence:0.93, preparer_value:String(termMonths), reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f12", field_name:"lease_classification",    field_label:"Lease Classification",    field_category:"legal",         is_critical:true,  ai_extracted_value:classification, ai_confidence:0.96, preparer_value:classification, reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f13", field_name:"renewal_options",         field_label:"Renewal Options",         field_category:"legal",         is_critical:false, ai_extracted_value:"2 × 5yr options", ai_confidence:0.82, preparer_value:"2 × 5yr options", reviewer_value:"", reviewer_corrected_at:null, disposition:"accepted", rework_flagged:false },
    { id:"f14", field_name:"security_deposit",        field_label:"Security Deposit",        field_category:"financial",     is_critical:false, ai_extracted_value:"$115,500",     ai_confidence:0.89, preparer_value:"$115,500",     reviewer_value:"", reviewer_corrected_at:null, disposition:"deferred", rework_flagged:false },
  ];
}

// ─── Per-task data ────────────────────────────────────────────────────────────
const MOCK_TASKS_BY_ID: Record<string, ApprovalTaskData> = {
  // t1 — Office Tower — 350 Fifth Ave (review, high priority, pending)
  t1: {
    summary: {
      task_reference: "AT-2026-0041",
      record_id: "CR-2026-0088",
      record_title: "Office Tower — 350 Fifth Ave",
      sod_violation: false,
      has_deferred: true,
      deferred_count: 1,
      reviewer_name: "M. Rodriguez",
      reviewer_comments: "Base rent corrected per Amendment 3 ($42,500/month). All critical fields verified. One deferred field: Security Deposit — pending landlord confirmation.",
      submitted_by: "J. Martinez",
      submitted_at: "2026-05-16T08:00:00Z",
      sla_deadline_at: "2026-05-18T17:00:00Z",
      rework_iteration: 0,
      approval_stage: "review",
      key_terms: {
        landlord: "Fifth Ave Properties LLC",
        tenant: "Acme Corporation",
        commencement: "2022-01-01",
        expiration: "2032-12-31",
        term_months: 132,
        base_rent: "$42,500/month",
        rent_frequency: "Monthly",
        escalation: "3.00% fixed annual",
        property: "350 Fifth Avenue, New York, NY 10001",
        area_sqft: "24,500 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$4,120,000",
        after_rou: "$4,580,000",
        before_liability: "$4,050,000",
        after_liability: "$4,510,000",
        delta: "+$460,000",
      },
    },
    fields: coreFields(
      "Fifth Ave Properties LLC", "Acme Corporation",
      "2022-01-01", "2032-12-31", 132,
      "$42,500/month", "24,500", "350 Fifth Avenue, New York, NY 10001",
      "operating", "fixed_percentage", "3.00%", "base_rent_amount"
    ),
  },

  // t2 — Retail HQ — 1200 Market St (review, standard, opened)
  t2: {
    summary: {
      task_reference: "AT-2026-0040",
      record_id: "CR-2026-0075",
      record_title: "Retail HQ — 1200 Market St",
      sod_violation: false,
      has_deferred: false,
      deferred_count: 0,
      reviewer_name: "K. Williams",
      reviewer_comments: "All fields verified against original lease. No corrections required. Escalation clause confirmed as CPI-linked.",
      submitted_by: "S. Patel",
      submitted_at: "2026-05-15T14:20:00Z",
      sla_deadline_at: "2026-05-20T17:00:00Z",
      rework_iteration: 0,
      approval_stage: "review",
      key_terms: {
        landlord: "Market Street Realty Inc.",
        tenant: "Acme Corporation",
        commencement: "2021-06-01",
        expiration: "2031-05-31",
        term_months: 120,
        base_rent: "$28,000/month",
        rent_frequency: "Monthly",
        escalation: "CPI-linked annual",
        property: "1200 Market Street, San Francisco, CA 94102",
        area_sqft: "18,200 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$2,980,000",
        after_rou: "$3,120,000",
        before_liability: "$2,910,000",
        after_liability: "$3,050,000",
        delta: "+$140,000",
      },
    },
    fields: coreFields(
      "Market Street Realty Inc.", "Acme Corporation",
      "2021-06-01", "2031-05-31", 120,
      "$28,000/month", "18,200", "1200 Market Street, San Francisco, CA 94102",
      "operating", "cpi_linked", "CPI annual"
    ),
  },

  // t3 — Warehouse Lease — Scope Increase (final_approval, escalated)
  t3: {
    summary: {
      task_reference: "AT-2026-0039",
      record_id: "CR-2026-0062",
      record_title: "Warehouse Lease — Scope Increase",
      sod_violation: false,
      has_deferred: true,
      deferred_count: 2,
      reviewer_name: "D. Okafor",
      reviewer_comments: "Scope increase amendment adds 8,000 sqft. Two deferred fields pending surveyor report: exact demised area and revised CAM base year.",
      submitted_by: "A. Chen",
      submitted_at: "2026-05-14T09:30:00Z",
      sla_deadline_at: "2026-05-17T17:00:00Z",
      rework_iteration: 0,
      approval_stage: "final_approval",
      key_terms: {
        landlord: "Logistics Park Holdings",
        tenant: "Acme Corporation",
        commencement: "2020-03-01",
        expiration: "2030-02-28",
        term_months: 120,
        base_rent: "$15,500/month",
        rent_frequency: "Monthly",
        escalation: "2.50% fixed annual",
        property: "7 Industrial Drive, Newark, NJ 07102",
        area_sqft: "42,000 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$1,620,000",
        after_rou: "$1,890,000",
        before_liability: "$1,580,000",
        after_liability: "$1,840,000",
        delta: "+$270,000",
      },
    },
    fields: coreFields(
      "Logistics Park Holdings", "Acme Corporation",
      "2020-03-01", "2030-02-28", 120,
      "$15,500/month", "42,000", "7 Industrial Drive, Newark, NJ 07102",
      "operating", "fixed_percentage", "2.50%"
    ),
  },

  // t4 — Ground Lease — Civic Center (review, high, rework_in_progress)
  t4: {
    summary: {
      task_reference: "AT-2026-0038",
      record_id: "CR-2026-0055",
      record_title: "Ground Lease — Civic Center",
      sod_violation: false,
      has_deferred: false,
      deferred_count: 0,
      reviewer_name: "P. Nguyen",
      reviewer_comments: "Rework #1: Commencement date was incorrect — lease commenced 2019-07-01, not 2019-06-01 as originally extracted. Preparer to re-verify.",
      submitted_by: "J. Martinez",
      submitted_at: "2026-05-12T11:00:00Z",
      sla_deadline_at: "2026-05-16T17:00:00Z",
      rework_iteration: 1,
      approval_stage: "review",
      key_terms: {
        landlord: "City of Chicago",
        tenant: "Acme Corporation",
        commencement: "2019-07-01",
        expiration: "2069-06-30",
        term_months: 600,
        base_rent: "$8,200/month",
        rent_frequency: "Monthly",
        escalation: "5-year step-up",
        property: "55 West Randolph Street, Chicago, IL 60601",
        area_sqft: "12,000 sqft",
        classification: "Finance Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$8,400,000",
        after_rou: "$8,650,000",
        before_liability: "$8,300,000",
        after_liability: "$8,540,000",
        delta: "+$250,000",
      },
    },
    fields: coreFields(
      "City of Chicago", "Acme Corporation",
      "2019-07-01", "2069-06-30", 600,
      "$8,200/month", "12,000", "55 West Randolph Street, Chicago, IL 60601",
      "finance", "step_up", "5-year step-up", "commencement_date"
    ),
  },

  // t5 — Industrial Park — Unit 7 (final_approval, standard, pending)
  t5: {
    summary: {
      task_reference: "AT-2026-0037",
      record_id: "CR-2026-0049",
      record_title: "Industrial Park — Unit 7",
      sod_violation: false,
      has_deferred: false,
      deferred_count: 0,
      reviewer_name: "R. Santos",
      reviewer_comments: "All fields verified. Short-term lease — 24 months. Classified as operating per ASC 842 short-term exemption criteria.",
      submitted_by: "S. Patel",
      submitted_at: "2026-05-16T07:00:00Z",
      sla_deadline_at: "2026-05-21T17:00:00Z",
      rework_iteration: 0,
      approval_stage: "final_approval",
      key_terms: {
        landlord: "Eastside Industrial LLC",
        tenant: "Acme Corporation",
        commencement: "2026-01-01",
        expiration: "2027-12-31",
        term_months: 24,
        base_rent: "$6,800/month",
        rent_frequency: "Monthly",
        escalation: "None",
        property: "Unit 7, 200 Commerce Blvd, Edison, NJ 08817",
        area_sqft: "9,500 sqft",
        classification: "Short-term (exempt)",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$0",
        after_rou: "$163,200",
        before_liability: "$0",
        after_liability: "$160,400",
        delta: "+$163,200",
      },
    },
    fields: coreFields(
      "Eastside Industrial LLC", "Acme Corporation",
      "2026-01-01", "2027-12-31", 24,
      "$6,800/month", "9,500", "Unit 7, 200 Commerce Blvd, Edison, NJ 08817",
      "short_term_exempt", "none", "N/A"
    ),
  },

  // t6 — Tech Campus — Rent Modification (review, standard, pending)
  t6: {
    summary: {
      task_reference: "AT-2026-0036",
      record_id: "CR-2026-0041",
      record_title: "Tech Campus — Rent Modification",
      sod_violation: false,
      has_deferred: true,
      deferred_count: 1,
      reviewer_name: "L. Kim",
      reviewer_comments: "Rent modification effective Q2 2026. New base rent $55,000/month confirmed. Deferred: revised ROU asset calculation pending finance sign-off.",
      submitted_by: "A. Chen",
      submitted_at: "2026-05-15T16:00:00Z",
      sla_deadline_at: "2026-05-22T17:00:00Z",
      rework_iteration: 0,
      approval_stage: "review",
      key_terms: {
        landlord: "Silicon Valley Campus Partners",
        tenant: "Acme Corporation",
        commencement: "2018-09-01",
        expiration: "2033-08-31",
        term_months: 180,
        base_rent: "$55,000/month",
        rent_frequency: "Monthly",
        escalation: "3.50% fixed annual",
        property: "2000 Innovation Way, Palo Alto, CA 94304",
        area_sqft: "38,000 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$9,200,000",
        after_rou: "$10,100,000",
        before_liability: "$9,050,000",
        after_liability: "$9,920,000",
        delta: "+$900,000",
      },
    },
    fields: coreFields(
      "Silicon Valley Campus Partners", "Acme Corporation",
      "2018-09-01", "2033-08-31", 180,
      "$55,000/month", "38,000", "2000 Innovation Way, Palo Alto, CA 94304",
      "operating", "fixed_percentage", "3.50%", "base_rent_amount"
    ),
  },

  // t7 — Suburban Office — Suite 400 (review, high, resubmitted, rework #2)
  t7: {
    summary: {
      task_reference: "AT-2026-0035",
      record_id: "CR-2026-0033",
      record_title: "Suburban Office — Suite 400",
      sod_violation: false,
      has_deferred: false,
      deferred_count: 0,
      reviewer_name: "T. Okonkwo",
      reviewer_comments: "Rework #2: Escalation rate corrected to 2.75% (was 2.50% in rework #1). Preparer has resubmitted with updated amendment evidence.",
      submitted_by: "J. Martinez",
      submitted_at: "2026-05-16T06:00:00Z",
      sla_deadline_at: "2026-05-19T17:00:00Z",
      rework_iteration: 2,
      approval_stage: "review",
      key_terms: {
        landlord: "Westfield Office Properties",
        tenant: "Acme Corporation",
        commencement: "2023-01-01",
        expiration: "2028-12-31",
        term_months: 72,
        base_rent: "$18,500/month",
        rent_frequency: "Monthly",
        escalation: "2.75% fixed annual",
        property: "Suite 400, 800 Corporate Drive, Parsippany, NJ 07054",
        area_sqft: "11,200 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$1,240,000",
        after_rou: "$1,310,000",
        before_liability: "$1,210,000",
        after_liability: "$1,280,000",
        delta: "+$70,000",
      },
    },
    fields: coreFields(
      "Westfield Office Properties", "Acme Corporation",
      "2023-01-01", "2028-12-31", 72,
      "$18,500/month", "11,200", "Suite 400, 800 Corporate Drive, Parsippany, NJ 07054",
      "operating", "fixed_percentage", "2.75%", "escalation_rate"
    ),
  },

  // t8 — Downtown Retail — Corner Unit (final_approval, standard, approved)
  t8: {
    summary: {
      task_reference: "AT-2026-0034",
      record_id: "CR-2026-0021",
      record_title: "Downtown Retail — Corner Unit",
      sod_violation: false,
      has_deferred: false,
      deferred_count: 0,
      reviewer_name: "F. Osei",
      reviewer_comments: "All fields verified. Approved. Percentage rent clause noted — triggers above $1.2M annual gross sales.",
      submitted_by: "S. Patel",
      submitted_at: "2026-05-10T09:00:00Z",
      sla_deadline_at: null,
      rework_iteration: 0,
      approval_stage: "final_approval",
      key_terms: {
        landlord: "Downtown Retail Partners LP",
        tenant: "Acme Corporation",
        commencement: "2024-03-01",
        expiration: "2034-02-28",
        term_months: 120,
        base_rent: "$22,000/month",
        rent_frequency: "Monthly",
        escalation: "2.00% fixed annual",
        property: "Corner Unit, 10 Main Street, Boston, MA 02101",
        area_sqft: "6,800 sqft",
        classification: "Operating Lease",
        accounting_standard: "ASC 842",
      },
      financial_impact: {
        before_rou: "$2,350,000",
        after_rou: "$2,500,000",
        before_liability: "$2,290,000",
        after_liability: "$2,440,000",
        delta: "+$150,000",
      },
    },
    fields: coreFields(
      "Downtown Retail Partners LP", "Acme Corporation",
      "2024-03-01", "2034-02-28", 120,
      "$22,000/month", "6,800", "Corner Unit, 10 Main Street, Boston, MA 02101",
      "operating", "fixed_percentage", "2.00%"
    ),
  },
};

// Fallback for unknown task IDs
const FALLBACK_TASK_DATA: ApprovalTaskData = MOCK_TASKS_BY_ID["t1"];

export function getApprovalTaskData(taskId: string): ApprovalTaskData {
  return MOCK_TASKS_BY_ID[taskId] ?? FALLBACK_TASK_DATA;
}

export { MOCK_TASKS_BY_ID };

/**
 * Minimal SLA deadline list used by AppShell to compute the overdue count
 * for the notification bell badge without importing the full ApprovalsQueue.
 */
const MOCK_APPROVAL_SLA_DEADLINES: Array<{ id: string; sla_deadline_at: string | null; status: string }> = [
  { id: 't1', sla_deadline_at: '2026-05-18T17:00:00Z', status: 'pending' },
  { id: 't2', sla_deadline_at: '2026-05-20T17:00:00Z', status: 'opened' },
  { id: 't3', sla_deadline_at: '2026-05-17T17:00:00Z', status: 'pending' },
  { id: 't4', sla_deadline_at: '2026-05-16T17:00:00Z', status: 'rework_in_progress' },
  { id: 't5', sla_deadline_at: '2026-05-21T17:00:00Z', status: 'pending' },
  { id: 't6', sla_deadline_at: '2026-05-22T17:00:00Z', status: 'pending' },
  { id: 't7', sla_deadline_at: '2026-05-19T17:00:00Z', status: 'resubmitted' },
  { id: 't8', sla_deadline_at: null,                   status: 'approved' },
];

/** Returns the number of non-approved tasks whose SLA deadline has passed. */
export function computeOverdueCount(): number {
  const now = Date.now();
  return MOCK_APPROVAL_SLA_DEADLINES.filter(
    t => t.status !== 'approved' && t.sla_deadline_at !== null && new Date(t.sla_deadline_at!).getTime() < now
  ).length;
}
