/**
 * agentSimulation.ts
 *
 * Shared simulation layer for all 11 LeaseGov agent scenarios.
 * Provides realistic auto-cycling AgentTask state machines for demo use.
 *
 * Each scenario cycles through the AgentTask state machine:
 *   queued → running (with step-by-step progress) → awaiting_checkpoint
 *   → completed  (or → failed for failure scenarios)
 *
 * Designed to feed:
 *   - ContractAgentProgressPanel  (AgentTaskData shape)
 *   - AgentActivityMonitor        (AgentTaskCard shape)
 *   - AgentCheckpointQueue        (HumanCheckpoint shape)
 *   - ContractCheckpointCard      (CheckpointCardData shape)
 *
 * Usage:
 *   const { task, checkpoint, phase } = useAgentSimulation('extraction_intelligence', contractId)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentTaskData } from '@/components/agents/ContractAgentProgressPanel'

// ─── Agent scenario IDs ───────────────────────────────────────────────────────

export type AgentScenarioId =
  | 'extraction_intelligence'   // Agent 1
  | 'document_classification'   // Agent 2
  | 'export_field_mapping'      // Agent 3
  | 'critical_date_monitoring'  // Agent 4
  | 'policy_compliance'         // Agent 5
  | 'reassessment_trigger'      // Agent 6
  | 'financial_remeasurement'   // Agent 7
  | 'memo_generation'           // Agent 8
  | 'portfolio_risk'            // Agent 9
  | 'export_reconciliation'     // Agent 10
  | 'survey_intelligence'       // Agent 11

// ─── Simulation phase ─────────────────────────────────────────────────────────

export type SimPhase =
  | 'queued'
  | 'running_step_1'
  | 'running_step_2'
  | 'running_step_3'
  | 'running_step_4'
  | 'awaiting_checkpoint'
  | 'completed'
  | 'failed'

// ─── Checkpoint card data (mirrors ContractCheckpointCard props) ──────────────

export interface SimCheckpointField {
  field_name: string
  agent_value: string
  is_critical: boolean
}

export interface SimCheckpointData {
  id: string
  checkpoint_type: 'extraction_review' | 'classification_confirm' | 'assessment_confirm' | 'analysis_confirm' | 'export_attest' | 'onboarding_approval'
  status: 'pending' | 'approved' | 'modified' | 'rejected' | 'expired'
  step_label: string
  agent_prepared_data: { summary: string; fields: SimCheckpointField[] }
  agent_recommendation: string
  agent_confidence: number
  deadline_at: string
  human_decision_rationale?: string
}

// ─── Activity monitor card (mirrors AgentActivityMonitor AgentTaskCard) ───────

export interface SimActivityDecision {
  timestamp: string
  action: string
  actor: 'agent' | 'human' | 'system'
  notes: string
}

export interface SimActivityCard {
  id: string
  agent_type: string
  agent_label: string
  contract_id: string
  contract_label: string
  status: 'running' | 'awaiting_checkpoint' | 'completed' | 'failed' | 'paused_by_human'
  current_step: string
  started_at: string
  decisions: SimActivityDecision[]
  progress_pct: number
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

interface AgentScenario {
  id: AgentScenarioId
  agent_type: string
  agent_label: string
  contract_label: string
  /** Duration in ms for each running step before auto-advancing */
  step_durations: [number, number, number, number]
  /** Duration in ms before auto-advancing from awaiting_checkpoint to completed */
  checkpoint_duration: number
  steps: {
    label: string
    reasoning_running: string
    reasoning_done: string
  }[]
  checkpoint: Omit<SimCheckpointData, 'id' | 'status' | 'deadline_at'>
  failure_step?: number  // 1-indexed; if set, this step fails instead of completing
  failure_message?: string
}

const SCENARIOS: Record<AgentScenarioId, AgentScenario> = {

  // ── Agent 1: Extraction Intelligence ────────────────────────────────────────
  extraction_intelligence: {
    id: 'extraction_intelligence',
    agent_type: 'document_extraction',
    agent_label: 'Extraction Intelligence Agent',
    contract_label: 'CR-2026-0038 — Acme Corp, 123 Main St',
    step_durations: [3000, 5000, 8000, 4000],
    checkpoint_duration: 12000,
    steps: [
      {
        label: 'Document Understanding',
        reasoning_running: 'Identifying document type and structure. Checking for base lease vs amendment pattern.',
        reasoning_done: 'Identified 2 documents: base lease (Office Tower, 22,000 sqft) and Amendment #3. Classification confidence 0.97.',
      },
      {
        label: 'OCR & Page Analysis',
        reasoning_running: 'Running OCR across 47 pages. Detecting tables, signature blocks, and exhibit sections.',
        reasoning_done: 'OCR complete. 47 pages processed. Average confidence 98.2%. 3 low-quality pages flagged for secondary pass.',
      },
      {
        label: 'Field Extraction (73 fields)',
        reasoning_running: 'Extracting financial fields from Amendment #3. Base contract fields 71/73 complete. base_rent_amount ambiguous — running secondary pass.',
        reasoning_done: '73 fields extracted across 15 categories. 2 fields deferred (notice_period, cam_cap). Confidence avg: 0.91. Delta: 8 fields changed vs approved record.',
      },
      {
        label: 'Collaborative Review Prep',
        reasoning_running: 'Generating review summary for Reviewer. Deferred fields and confidence flags being collated.',
        reasoning_done: 'Review summary generated. 2 deferred fields and 1 conflict flagged. Reviewer notified. Checkpoint created.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'extraction_review',
      step_label: 'Extraction Review',
      agent_prepared_data: {
        summary: '73 fields extracted from CR-2026-0038 Amendment #3. 8 fields changed vs approved record. 2 deferred fields require Reviewer decision. Overall confidence: 91%.',
        fields: [
          { field_name: 'base_rent_amount', agent_value: '$42,500/mo (was $38,000)', is_critical: true },
          { field_name: 'lease_expiration_date', agent_value: '2029-12-31 (was 2027-06-30)', is_critical: true },
          { field_name: 'notice_period', agent_value: 'DEFERRED — ambiguous clause on p.18', is_critical: true },
          { field_name: 'cam_cap', agent_value: 'DEFERRED — exhibit C missing', is_critical: false },
          { field_name: 'renewal_option_count', agent_value: '2 (unchanged)', is_critical: false },
          { field_name: 'leased_sqft', agent_value: '22,000 sqft (unchanged)', is_critical: false },
        ],
      },
      agent_recommendation: 'Approve extraction with modifications to notice_period and cam_cap. Amendment constitutes a lease modification — recommend creating Reassessment Case after approval.',
      agent_confidence: 0.91,
    },
  },

  // ── Agent 2: Document Classification ────────────────────────────────────────
  document_classification: {
    id: 'document_classification',
    agent_type: 'document_classification',
    agent_label: 'Document Classification Agent',
    contract_label: 'Uploaded: "Third_Amendment_Signed.pdf"',
    step_durations: [2000, 3000, 3000, 2000],
    checkpoint_duration: 8000,
    steps: [
      {
        label: 'Format & Integrity Check',
        reasoning_running: 'Validating file format, size, duplicate hash, and integrity checksum.',
        reasoning_done: 'All 4 validation checks passed. File: PDF, 2.4MB, no duplicate detected, checksum verified.',
      },
      {
        label: 'Document Type Recognition',
        reasoning_running: 'Reading first page for entity recognition. Detecting document type from header, party names, and date patterns.',
        reasoning_done: 'Document type: Amendment. Detected "Third Amendment" header. Effective date: 2026-04-01. Party: Acme Corp.',
      },
      {
        label: 'Record Match',
        reasoning_running: 'Matching party name "Acme Corp" and address "123 Main St" against contract records. Ranking by confidence.',
        reasoning_done: 'Match found: CR-2026-0038 (Acme Corp, 123 Main St). Confidence: 0.94. Template pre-selected: Commercial Lease Amendment.',
      },
      {
        label: 'Pre-population',
        reasoning_running: 'Pre-selecting record and extraction template in upload form.',
        reasoning_done: 'Record CR-2026-0038 pre-selected. Template "Commercial Lease Amendment" pre-selected. Ready for Submitter confirmation.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'extraction_review',
      step_label: 'Classification Confirmation',
      agent_prepared_data: {
        summary: 'Document classified as Amendment for CR-2026-0038 (Acme Corp, 123 Main St) with 94% confidence. Template pre-selected. One confirmation click required.',
        fields: [
          { field_name: 'document_type', agent_value: 'Amendment (Third Amendment)', is_critical: false },
          { field_name: 'target_record', agent_value: 'CR-2026-0038 — Acme Corp', is_critical: true },
          { field_name: 'extraction_template', agent_value: 'Commercial Lease Amendment', is_critical: false },
          { field_name: 'effective_date', agent_value: '2026-04-01', is_critical: false },
        ],
      },
      agent_recommendation: 'Confirm record match and proceed with extraction. If record is incorrect, search manually before submitting.',
      agent_confidence: 0.94,
    },
  },

  // ── Agent 3: Export Field Mapping ────────────────────────────────────────────
  export_field_mapping: {
    id: 'export_field_mapping',
    agent_type: 'export_mapping',
    agent_label: 'Export Field Mapping Agent',
    contract_label: 'Export Task UT-003 — GASB 87 Schedule',
    step_durations: [2000, 4000, 3000, 2000],
    checkpoint_duration: 10000,
    steps: [
      {
        label: 'Template Analysis',
        reasoning_running: 'Reading ExtractionTemplate field list and ExportTemplate column list.',
        reasoning_done: 'ExtractionTemplate: 73 fields. ExportTemplate: 28 columns. Semantic similarity analysis starting.',
      },
      {
        label: 'Semantic Field Matching',
        reasoning_running: 'Matching field names, data types, and semantic similarity. Checking historical mapping from prior exports.',
        reasoning_done: '24/28 columns auto-mapped with high confidence. 4 columns require Accountant review (ambiguous or new fields).',
      },
      {
        label: 'Historical Carry-Forward',
        reasoning_running: 'Loading prior export mapping for GASB 87 Schedule template. Applying historical preferences.',
        reasoning_done: '3 of 4 ambiguous columns resolved from historical mapping. 1 new column has no prior mapping — flagged amber.',
      },
      {
        label: 'Mapping Summary',
        reasoning_running: 'Generating mapping summary for Accountant review.',
        reasoning_done: '27/28 columns mapped. 1 new column flagged for Accountant decision. Pre-mapped rows marked with green agent badge.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'export_attest',
      step_label: 'Field Mapping Review',
      agent_prepared_data: {
        summary: '27 of 28 export columns auto-mapped. 1 new column (rou_asset_category) has no prior mapping and requires Accountant assignment.',
        fields: [
          { field_name: 'rou_asset_category', agent_value: 'UNMAPPED — new column in template v2.1', is_critical: true },
          { field_name: 'base_rent_amount', agent_value: '→ financial.base_rent_monthly', is_critical: false },
          { field_name: 'lease_commencement', agent_value: '→ key_dates.commencement_date', is_critical: false },
          { field_name: 'lease_expiration', agent_value: '→ key_dates.expiration_date', is_critical: false },
        ],
      },
      agent_recommendation: 'Assign rou_asset_category mapping before proceeding. All other 27 columns are pre-mapped from extraction and historical data.',
      agent_confidence: 0.96,
    },
  },

  // ── Agent 4: Critical Date Monitoring ───────────────────────────────────────
  critical_date_monitoring: {
    id: 'critical_date_monitoring',
    agent_type: 'critical_date_monitor',
    agent_label: 'Critical Date Monitoring Agent',
    contract_label: 'Portfolio — Nightly Sweep (14 records)',
    step_durations: [3000, 4000, 3000, 2000],
    checkpoint_duration: 0, // auto-completes, no checkpoint
    steps: [
      {
        label: 'Portfolio Scan',
        reasoning_running: 'Scanning all 14 approved records for upcoming critical dates within configured windows.',
        reasoning_done: 'Scanned 14 records. 3 records have upcoming critical dates within alert windows.',
      },
      {
        label: 'Option Exercise Detection',
        reasoning_running: 'Checking option exercise windows opening within 90 days.',
        reasoning_done: '2 option exercise windows opening: CR-2026-0031 (opens in 47 days), CR-2026-0019 (opens in 83 days). WatchlistEntry records created.',
      },
      {
        label: 'Escalation & Expiry Check',
        reasoning_running: 'Checking rent escalation dates within 30 days and lease expirations within 180 days.',
        reasoning_done: '1 CPI escalation due in 22 days (CR-2026-0044). 1 lease expiring in 94 days (CR-2026-0007). Action items created in Open Items tab.',
      },
      {
        label: 'Dashboard Update',
        reasoning_running: 'Updating RecordsDashboard summary card counts.',
        reasoning_done: 'Dashboard updated: "Expiring 90 Days" → 1, "Options to Exercise" → 2, "Approaching Escalations" → 1.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'analysis_confirm',
      step_label: 'Critical Date Review',
      agent_prepared_data: {
        summary: 'Nightly sweep complete. 4 critical date items created across 3 records. No human decision required — items visible in Open Items tab and Dashboard.',
        fields: [
          { field_name: 'option_exercise_cr2026_0031', agent_value: 'Opens in 47 days — HIGH priority', is_critical: true },
          { field_name: 'option_exercise_cr2026_0019', agent_value: 'Opens in 83 days — MEDIUM priority', is_critical: false },
          { field_name: 'escalation_cr2026_0044', agent_value: 'CPI escalation due in 22 days', is_critical: true },
          { field_name: 'expiry_cr2026_0007', agent_value: 'Lease expires in 94 days', is_critical: false },
        ],
      },
      agent_recommendation: 'Review option exercise windows for CR-2026-0031 immediately. CPI escalation for CR-2026-0044 requires Accountant action within 22 days.',
      agent_confidence: 1.0,
    },
  },

  // ── Agent 5: Policy Compliance ───────────────────────────────────────────────
  policy_compliance: {
    id: 'policy_compliance',
    agent_type: 'policy_compliance',
    agent_label: 'Policy Compliance Agent',
    contract_label: 'CR-2026-0038 — Approval Queue',
    step_durations: [2000, 3000, 3000, 2000],
    checkpoint_duration: 10000,
    steps: [
      {
        label: 'Threshold Configuration Load',
        reasoning_running: 'Loading tenant ThresholdConfiguration for Commercial Lease asset class.',
        reasoning_done: 'ThresholdConfiguration loaded: max_term 120 months, max_base_rent $60,000/mo, escalation_cap 5%, TI_allowance_threshold $500,000.',
      },
      {
        label: 'Key Terms Check',
        reasoning_running: 'Comparing extracted key terms against policy thresholds. Checking 12 terms.',
        reasoning_done: '10/12 terms within policy. 2 exceptions: TI allowance $620,000 (above $500,000 threshold), lease term 84 months (within limit but flagged for Controller).',
      },
      {
        label: 'Unusual Clause Detection',
        reasoning_running: 'Scanning for unusual clauses: termination rights, purchase options, co-tenancy clauses.',
        reasoning_done: 'Termination right detected on p.22 (mutual, 12-month notice). Purchase option detected on p.31 (at fair market value). Both require Controller sign-off.',
      },
      {
        label: 'Compliance Card Generation',
        reasoning_running: 'Generating compliance card for ApprovalsReview.',
        reasoning_done: 'Compliance card generated: AMBER — 2 policy exceptions. Controller sign-off required before final approval.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'assessment_confirm',
      step_label: 'Policy Compliance Review',
      agent_prepared_data: {
        summary: '2 policy exceptions found in CR-2026-0038. TI allowance exceeds threshold by $120,000. Termination right and purchase option require Controller sign-off.',
        fields: [
          { field_name: 'ti_allowance', agent_value: '$620,000 (threshold: $500,000) — EXCEPTION', is_critical: true },
          { field_name: 'termination_right', agent_value: 'Mutual, 12-month notice — Controller sign-off required', is_critical: true },
          { field_name: 'purchase_option', agent_value: 'At fair market value — Controller sign-off required', is_critical: true },
          { field_name: 'base_rent_amount', agent_value: '$42,500/mo (within $60,000 limit)', is_critical: false },
          { field_name: 'lease_term', agent_value: '84 months (within 120-month limit)', is_critical: false },
        ],
      },
      agent_recommendation: 'Escalate to Controller for TI allowance exception and unusual clause sign-off. Do not approve for final until Controller adds rationale note.',
      agent_confidence: 0.88,
    },
  },

  // ── Agent 6: Reassessment Trigger Detection ──────────────────────────────────
  reassessment_trigger: {
    id: 'reassessment_trigger',
    agent_type: 'trigger_detection',
    agent_label: 'Reassessment Trigger Detection Agent',
    contract_label: 'CR-2026-0038 — Amendment #3 Submitted',
    step_durations: [2000, 4000, 3000, 2000],
    checkpoint_duration: 8000,
    steps: [
      {
        label: 'Approved Record Load',
        reasoning_running: 'Loading current approved record for CR-2026-0038 for comparison.',
        reasoning_done: 'Approved record loaded. Base rent: $38,000/mo. Expiration: 2027-06-30. Leased area: 22,000 sqft.',
      },
      {
        label: 'Modification Detection',
        reasoning_running: 'Cross-referencing incoming document against approved record. Checking rent, term, area, and option terms.',
        reasoning_done: 'Modifications detected: base_rent +$4,500/mo, lease_expiration extended 30 months. 2 of 4 trigger criteria met.',
      },
      {
        label: 'ASC 842 Trigger Assessment',
        reasoning_running: 'Assessing whether modifications constitute a lease modification under ASC 842-20-55.',
        reasoning_done: 'Lease modification confirmed under ASC 842-20-55-12. Trigger type: MODIFICATION. Reassessment case creation recommended.',
      },
      {
        label: 'Pre-population',
        reasoning_running: 'Pre-populating ReassessmentTrigger form with detected modification details.',
        reasoning_done: 'Trigger form pre-populated: type=MODIFICATION, contract=CR-2026-0038, effective_date=2026-04-01. Awaiting Preparer confirmation.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'classification_confirm',
      step_label: 'Trigger Confirmation',
      agent_prepared_data: {
        summary: 'Lease modification detected in Amendment #3 for CR-2026-0038. Base rent increased $4,500/mo and term extended 30 months. ASC 842 reassessment required.',
        fields: [
          { field_name: 'trigger_type', agent_value: 'MODIFICATION (ASC 842-20-55-12)', is_critical: true },
          { field_name: 'base_rent_change', agent_value: '$38,000 → $42,500/mo (+$4,500)', is_critical: true },
          { field_name: 'term_extension', agent_value: '2027-06-30 → 2029-12-31 (+30 months)', is_critical: true },
          { field_name: 'effective_date', agent_value: '2026-04-01', is_critical: false },
        ],
      },
      agent_recommendation: 'Confirm trigger and create Reassessment Case. Path type: MODIFICATION. Preparer should be assigned immediately.',
      agent_confidence: 0.93,
    },
  },

  // ── Agent 7: Financial Remeasurement ─────────────────────────────────────────
  financial_remeasurement: {
    id: 'financial_remeasurement',
    agent_type: 'financial_remeasurement',
    agent_label: 'Financial Remeasurement Agent',
    contract_label: 'CR-2026-0038 — Reassessment Case RC-2026-014',
    step_durations: [2000, 5000, 5000, 3000],
    checkpoint_duration: 12000,
    steps: [
      {
        label: 'Lease Term Parameters',
        reasoning_running: 'Loading approved lease terms: commencement, expiration, base rent, escalation schedule, IBR.',
        reasoning_done: 'Parameters loaded: commencement 2022-01-01, expiration 2029-12-31, base rent $42,500/mo, CPI escalation 3%/yr, IBR 4.25%.',
      },
      {
        label: 'Present Value Calculation',
        reasoning_running: 'Computing present value of remaining lease payments using IBR 4.25%. Discounting 84 monthly payments.',
        reasoning_done: 'PV of remaining payments: $3,247,891. ROU asset balance: $3,247,891. Lease liability: $3,247,891 (day-one remeasurement).',
      },
      {
        label: 'Amortization Schedule',
        reasoning_running: 'Generating monthly amortization schedule for ROU asset and lease liability.',
        reasoning_done: 'Amortization schedule generated: 84 periods. Year 1 depreciation: $462,556. Year 1 interest: $138,035.',
      },
      {
        label: 'Journal Entry & Impact',
        reasoning_running: 'Computing incremental impact vs prior measurement. Generating day-one journal entry.',
        reasoning_done: 'Incremental ROU asset increase: $412,340. Incremental lease liability increase: $412,340. Journal entry: Dr ROU Asset $412,340 / Cr Lease Liability $412,340.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'analysis_confirm',
      step_label: 'Financial Remeasurement Review',
      agent_prepared_data: {
        summary: 'Remeasurement complete for CR-2026-0038. ROU asset and lease liability each increase by $412,340. 84-period amortization schedule generated. Controller confirmation required.',
        fields: [
          { field_name: 'rou_asset_increase', agent_value: '+$412,340 (new balance: $3,247,891)', is_critical: true },
          { field_name: 'lease_liability_increase', agent_value: '+$412,340 (new balance: $3,247,891)', is_critical: true },
          { field_name: 'ibr_used', agent_value: '4.25% (unchanged from original)', is_critical: false },
          { field_name: 'journal_entry', agent_value: 'Dr ROU Asset / Cr Lease Liability $412,340', is_critical: true },
          { field_name: 'year_1_depreciation', agent_value: '$462,556', is_critical: false },
        ],
      },
      agent_recommendation: 'Confirm remeasurement calculations. Review IBR assumption — if IBR has changed since original measurement, update before confirming.',
      agent_confidence: 0.97,
    },
  },

  // ── Agent 8: Memo Generation ─────────────────────────────────────────────────
  memo_generation: {
    id: 'memo_generation',
    agent_type: 'memo_generation',
    agent_label: 'Memo Generation Agent',
    contract_label: 'RC-2026-014 — Reassessment Memo',
    step_durations: [2000, 4000, 5000, 3000],
    checkpoint_duration: 10000,
    steps: [
      {
        label: 'Case Data Assembly',
        reasoning_running: 'Loading completed reassessment case: trigger type, classification answers, option assessment, financial impact.',
        reasoning_done: 'Case data assembled: MODIFICATION trigger, Q1=Yes/Q2=Yes/Q3=No (lease modification path), financial impact $412,340.',
      },
      {
        label: 'ASC 842 Citation Mapping',
        reasoning_running: 'Mapping classification decisions to ASC 842 paragraph citations for memo body.',
        reasoning_done: 'Citations mapped: ASC 842-20-55-12 (modification definition), ASC 842-20-30-1 (remeasurement requirement), ASC 842-20-50-4 (disclosure).',
      },
      {
        label: 'Memo Draft Generation',
        reasoning_running: 'Generating structured memo: Background, Triggering Event, Classification Analysis, Lease Term Assessment, Financial Impact, Conclusion, Disclosure Requirements.',
        reasoning_done: 'Memo draft generated: 7 sections, 847 words. All ASC 842 citations included. Disclosure requirements identified for footnote.',
      },
      {
        label: 'Review Preparation',
        reasoning_running: 'Formatting memo for Preparer review. Each section marked editable.',
        reasoning_done: 'Memo ready for Preparer review. 7 editable sections. Approver sign-off required before sealing in CompliancePacket.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'analysis_confirm',
      step_label: 'Memo Review',
      agent_prepared_data: {
        summary: 'ASC 842 reassessment memo drafted for RC-2026-014. 7 sections, 847 words. All paragraph citations included. Preparer review and edits required before Approver sign-off.',
        fields: [
          { field_name: 'trigger_section', agent_value: 'Rent increase $4,500/mo + term extension 30 months', is_critical: false },
          { field_name: 'classification_section', agent_value: 'Lease modification — Q1:Yes Q2:Yes Q3:No', is_critical: false },
          { field_name: 'financial_impact_section', agent_value: 'ROU asset +$412,340 / Lease liability +$412,340', is_critical: true },
          { field_name: 'disclosure_section', agent_value: 'Footnote required: modification effective 2026-04-01', is_critical: true },
        ],
      },
      agent_recommendation: 'Review all 7 sections. Pay particular attention to the Financial Impact and Disclosure sections — these are the most likely to require Preparer edits.',
      agent_confidence: 0.89,
    },
  },

  // ── Agent 9: Portfolio Risk Intelligence ─────────────────────────────────────
  portfolio_risk: {
    id: 'portfolio_risk',
    agent_type: 'portfolio_risk',
    agent_label: 'Portfolio Risk Intelligence Agent',
    contract_label: 'Portfolio — Weekly Analysis (14 records)',
    step_durations: [3000, 4000, 4000, 3000],
    checkpoint_duration: 0,
    steps: [
      {
        label: 'Portfolio Load',
        reasoning_running: 'Loading all 14 approved records with financial terms and counterparty data.',
        reasoning_done: '14 records loaded. Total lease liability: $28.4M. 9 counterparties. 4 asset classes.',
      },
      {
        label: 'Concentration Risk',
        reasoning_running: 'Computing counterparty concentration. Flagging any counterparty representing >25% of total lease liability.',
        reasoning_done: 'Acme Corp: 4 leases, $8.8M (31% of total). HIGH concentration risk. Flagged for Controller review.',
      },
      {
        label: 'Maturity Clustering',
        reasoning_running: 'Grouping lease expirations by quarter. Flagging quarters with >3 expirations.',
        reasoning_done: 'Q4 2027: 7 leases expiring ($12.1M). HIGH rollover risk. Advance negotiation planning recommended.',
      },
      {
        label: 'Escalation Exposure',
        reasoning_running: 'Aggregating CPI-linked escalations across portfolio. Projecting 12-month payment increase.',
        reasoning_done: '22 CPI-linked leases. Estimated +$840,000 in annual payments starting January 2027. Insight cards generated.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'analysis_confirm',
      step_label: 'Portfolio Risk Review',
      agent_prepared_data: {
        summary: 'Weekly portfolio analysis complete. 3 risk insights surfaced: counterparty concentration (Acme Corp 31%), Q4 2027 maturity cluster (7 leases), and CPI escalation exposure (+$840K in 2027).',
        fields: [
          { field_name: 'concentration_risk', agent_value: 'Acme Corp: 31% of total liability ($8.8M)', is_critical: true },
          { field_name: 'maturity_cluster', agent_value: 'Q4 2027: 7 leases expiring ($12.1M)', is_critical: true },
          { field_name: 'escalation_exposure', agent_value: '+$840,000/yr starting Jan 2027 (22 leases)', is_critical: false },
          { field_name: 'total_lease_liability', agent_value: '$28.4M across 14 records', is_critical: false },
        ],
      },
      agent_recommendation: 'Review Acme Corp concentration risk with Controller. Begin Q4 2027 renewal planning for 7 expiring leases. No immediate action required on CPI escalation.',
      agent_confidence: 0.95,
    },
  },

  // ── Agent 10: Export Reconciliation ──────────────────────────────────────────
  export_reconciliation: {
    id: 'export_reconciliation',
    agent_type: 'export_reconciliation',
    agent_label: 'Export Reconciliation Agent',
    contract_label: 'Export Task UT-003 — Post-Completion Check',
    step_durations: [2000, 4000, 3000, 2000],
    checkpoint_duration: 8000,
    steps: [
      {
        label: 'CompliancePacket Hash Verification',
        reasoning_running: 'Verifying CompliancePacket hash against sealed export record.',
        reasoning_done: 'Hash verified. CompliancePacket sealed at 14:32:07. No tampering detected.',
      },
      {
        label: 'Uploaded Evidence Comparison',
        reasoning_running: 'Comparing exported field values against Accountant-uploaded confirmation evidence.',
        reasoning_done: '27 of 28 values match uploaded evidence. 1 discrepancy: rou_asset_balance differs by $0.02 (rounding).',
      },
      {
        label: 'Rounding Tolerance Check',
        reasoning_running: 'Applying $1.00 rounding tolerance rule. Classifying $0.02 discrepancy.',
        reasoning_done: '$0.02 discrepancy within $1.00 rounding tolerance. Classified as acceptable. No material discrepancy.',
      },
      {
        label: 'Reconciliation Badge',
        reasoning_running: 'Generating reconciliation status badge for completion screen.',
        reasoning_done: 'Reconciliation complete: GREEN — Values match within rounding tolerance. Badge applied to completion screen.',
      },
    ],
    checkpoint: {
      checkpoint_type: 'export_attest',
      step_label: 'Export Reconciliation',
      agent_prepared_data: {
        summary: 'Export UT-003 reconciliation complete. 27/28 values match exactly. 1 rounding difference of $0.02 — within tolerance. No material discrepancy detected.',
        fields: [
          { field_name: 'rou_asset_balance', agent_value: 'Exported: $3,247,891.00 / Evidence: $3,247,890.98 — $0.02 diff (within tolerance)', is_critical: false },
          { field_name: 'lease_liability', agent_value: 'Exported: $3,247,891.00 / Evidence: $3,247,891.00 — MATCH', is_critical: false },
          { field_name: 'packet_hash', agent_value: 'SHA-256 verified — no tampering', is_critical: false },
          { field_name: 'reconciliation_result', agent_value: 'GREEN — Values match within tolerance', is_critical: false },
        ],
      },
      agent_recommendation: 'Reconciliation passed. Export UT-003 is complete and verified. No further action required.',
      agent_confidence: 0.99,
    },
  },

  // ── Agent 11: Survey Intelligence ────────────────────────────────────────────
  survey_intelligence: {
    id: 'survey_intelligence',
    agent_type: 'survey_intelligence',
    agent_label: 'Investigative Survey Intelligence Agent',
    contract_label: 'RC-2026-014 — Mailroom Survey',
    step_durations: [2000, 4000, 3000, 2000],
    checkpoint_duration: 8000,
    steps: [
      {
        label: 'Survey Type Analysis',
        reasoning_running: 'Identifying survey type: Mailroom. Loading search parameters for Acme Corp correspondence.',
        reasoning_done: 'Survey type: Mailroom. Searching prior records and correspondence for Acme Corp in the past 90 days.',
      },
      {
        label: 'Evidence Gathering',
        reasoning_running: 'Searching prior records, approved reassessment cases, and document intake for relevant evidence.',
        reasoning_done: '3 prior correspondence records found for Acme Corp: 2 emails (rent discussion), 1 letter of intent (term extension). Evidence strength: HIGH.',
      },
      {
        label: 'Answer Pre-population',
        reasoning_running: 'Pre-populating survey answers from found evidence. Citing source for each answer.',
        reasoning_done: '4 of 6 survey questions pre-populated with cited evidence. 2 questions require Preparer input (no prior evidence).',
      },
      {
        label: 'Confidence Scoring',
        reasoning_running: 'Computing overall_confidence from evidence strength and coverage.',
        reasoning_done: 'Overall confidence: 0.82. 4 answers from evidence (high confidence), 2 answers pending Preparer input (low confidence).',
      },
    ],
    checkpoint: {
      checkpoint_type: 'assessment_confirm',
      step_label: 'Survey Intelligence Review',
      agent_prepared_data: {
        summary: 'Mailroom survey pre-populated for RC-2026-014. 4 of 6 answers filled from prior correspondence. 2 questions require Preparer input. Overall confidence: 82%.',
        fields: [
          { field_name: 'correspondence_found', agent_value: '3 records (2 emails + 1 LOI) — cited', is_critical: false },
          { field_name: 'rent_discussion_evidence', agent_value: 'Email 2026-02-14: "rent increase discussed for renewal" — HIGH confidence', is_critical: false },
          { field_name: 'term_extension_evidence', agent_value: 'LOI 2026-03-01: "30-month extension proposed" — HIGH confidence', is_critical: false },
          { field_name: 'pending_questions', agent_value: 'Q4 and Q6 require Preparer input — no prior evidence', is_critical: true },
        ],
      },
      agent_recommendation: 'Review pre-populated answers and their citations. Complete Q4 and Q6 manually. Promote to Reassessment Case if modification confirmed.',
      agent_confidence: 0.82,
    },
  },
}

// ─── State machine transitions ────────────────────────────────────────────────

const PHASE_ORDER: SimPhase[] = [
  'queued',
  'running_step_1',
  'running_step_2',
  'running_step_3',
  'running_step_4',
  'awaiting_checkpoint',
  'completed',
]

function phaseToTaskStatus(phase: SimPhase): AgentTaskData['status'] {
  if (phase === 'queued') return 'queued'
  if (phase === 'completed') return 'completed'
  if (phase === 'failed') return 'failed'
  if (phase === 'awaiting_checkpoint') return 'awaiting_checkpoint'
  return 'running'
}

function phaseToStepIndex(phase: SimPhase): number {
  if (phase === 'running_step_1') return 0
  if (phase === 'running_step_2') return 1
  if (phase === 'running_step_3') return 2
  if (phase === 'running_step_4') return 3
  return -1
}

// ─── Build AgentTaskData from scenario + phase ────────────────────────────────

export function buildAgentTaskData(
  scenario: AgentScenario,
  phase: SimPhase,
  contractId: string,
  liveProgress: number,
): AgentTaskData {
  const activeStepIdx = phaseToStepIndex(phase)
  const status = phaseToTaskStatus(phase)

  const steps: AgentTaskData['steps'] = scenario.steps.map((s, i) => {
    let stepStatus: 'completed' | 'active' | 'upcoming' = 'upcoming'
    if (phase === 'completed' || phase === 'awaiting_checkpoint') {
      stepStatus = 'completed'
    } else if (i < activeStepIdx) {
      stepStatus = 'completed'
    } else if (i === activeStepIdx) {
      stepStatus = 'active'
    }
    return {
      id: `s${i + 1}`,
      label: s.label,
      status: stepStatus,
      reasoning: i < activeStepIdx || phase === 'completed' || phase === 'awaiting_checkpoint'
        ? s.reasoning_done
        : i === activeStepIdx
        ? s.reasoning_running
        : undefined,
    }
  })

  const currentStep = phase === 'completed'
    ? 'Complete'
    : phase === 'awaiting_checkpoint'
    ? `Awaiting checkpoint — ${scenario.steps[3]?.label ?? 'Review'}`
    : phase === 'failed'
    ? `Failed at ${scenario.steps[activeStepIdx]?.label ?? 'step'}`
    : phase === 'queued'
    ? 'Queued'
    : scenario.steps[activeStepIdx]?.label ?? 'Processing'

  return {
    id: `sim-${scenario.id}-${contractId}`,
    agent_type: scenario.agent_type,
    agent_name: scenario.agent_label,
    workflow_id: `wf-sim-${contractId}`,
    contract_id: contractId,
    automation_level: 'full_autonomous',
    status,
    current_step: currentStep,
    steps,
    decisions: [],
    progress: {
      current: liveProgress,
      total: 100,
      label: currentStep,
    },
  }
}

// ─── Build SimCheckpointData from scenario + phase ────────────────────────────

export function buildCheckpointData(
  scenario: AgentScenario,
  phase: SimPhase,
  contractId: string,
): SimCheckpointData {
  const status: SimCheckpointData['status'] =
    phase === 'awaiting_checkpoint' ? 'pending'
    : phase === 'completed' ? 'approved'
    : 'pending'

  return {
    id: `cp-sim-${scenario.id}-${contractId}`,
    ...scenario.checkpoint,
    status,
    deadline_at: new Date(Date.now() + 4 * 3600000).toISOString(),
  }
}

// ─── Build SimActivityCard from scenario + phase ──────────────────────────────

export function buildActivityCard(
  scenario: AgentScenario,
  phase: SimPhase,
  contractId: string,
  liveProgress: number,
): SimActivityCard {
  const status: SimActivityCard['status'] =
    phase === 'queued' ? 'running'
    : phase === 'awaiting_checkpoint' ? 'awaiting_checkpoint'
    : phase === 'completed' ? 'completed'
    : phase === 'failed' ? 'failed'
    : 'running'

  const activeStepIdx = phaseToStepIndex(phase)
  const decisions: SimActivityDecision[] = scenario.steps
    .filter((_, i) => i < activeStepIdx || phase === 'completed' || phase === 'awaiting_checkpoint')
    .map((s, i) => ({
      timestamp: new Date(Date.now() - (scenario.steps.length - i) * 120000).toLocaleTimeString('en-US', { hour12: false }),
      action: 'step_completed',
      actor: 'agent',
      notes: s.reasoning_done,
    }))

  return {
    id: `act-${scenario.id}-${contractId}`,
    agent_type: scenario.agent_type,
    agent_label: scenario.agent_label,
    contract_id: contractId,
    contract_label: scenario.contract_label,
    status,
    current_step: phase === 'completed' ? 'Completed'
      : phase === 'awaiting_checkpoint' ? 'Awaiting checkpoint'
      : phase === 'queued' ? 'Queued'
      : scenario.steps[activeStepIdx]?.label ?? 'Processing',
    started_at: new Date(Date.now() - 600000).toLocaleTimeString('en-US', { hour12: false }),
    decisions,
    progress_pct: liveProgress,
  }
}

// ─── useAgentSimulation hook ──────────────────────────────────────────────────

export interface UseAgentSimulationReturn {
  phase: SimPhase
  liveProgress: number
  task: AgentTaskData
  checkpoint: SimCheckpointData
  activityCard: SimActivityCard
  /** Manually advance to next phase (for demo controls) */
  advance: () => void
  /** Reset to queued */
  reset: () => void
  /** Pause/resume auto-cycling */
  setPaused: (paused: boolean) => void
  paused: boolean
}

export function useAgentSimulation(
  scenarioId: AgentScenarioId,
  contractId: string,
  /** If true, auto-cycles through all phases. Default: true */
  autoPlay = true,
): UseAgentSimulationReturn {
  const scenario = SCENARIOS[scenarioId]
  const [phase, setPhase] = useState<SimPhase>('running_step_1')
  const [liveProgress, setLiveProgress] = useState(5)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }, [])

  const advancePhase = useCallback((currentPhase: SimPhase) => {
    const idx = PHASE_ORDER.indexOf(currentPhase)
    if (idx === -1 || idx >= PHASE_ORDER.length - 1) return
    setPhase(PHASE_ORDER[idx + 1])
  }, [])

  // Progress bar animation for running steps
  useEffect(() => {
    clearTimers()
    if (paused || !autoPlay) return

    const stepIdx = phaseToStepIndex(phase)
    const isRunning = stepIdx >= 0

    if (isRunning) {
      const duration = scenario.step_durations[stepIdx] ?? 4000
      const startPct = stepIdx * 25
      const endPct = (stepIdx + 1) * 25
      setLiveProgress(startPct + 2)

      const tickMs = 200
      const ticks = duration / tickMs
      const increment = (endPct - startPct - 2) / ticks

      progressRef.current = setInterval(() => {
        setLiveProgress(prev => Math.min(prev + increment, endPct - 1))
      }, tickMs)

      timerRef.current = setTimeout(() => {
        clearTimers()
        setLiveProgress(endPct)
        advancePhase(phase)
      }, duration)
    } else if (phase === 'awaiting_checkpoint' && scenario.checkpoint_duration > 0) {
      setLiveProgress(100)
      timerRef.current = setTimeout(() => {
        advancePhase(phase)
      }, scenario.checkpoint_duration)
    } else if (phase === 'completed') {
      setLiveProgress(100)
    }

    return clearTimers
  }, [phase, paused, autoPlay, scenario, advancePhase, clearTimers])

  const advance = useCallback(() => {
    clearTimers()
    advancePhase(phase)
  }, [phase, advancePhase, clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setPhase('running_step_1')
    setLiveProgress(5)
  }, [clearTimers])

  const task = buildAgentTaskData(scenario, phase, contractId, liveProgress)
  const checkpoint = buildCheckpointData(scenario, phase, contractId)
  const activityCard = buildActivityCard(scenario, phase, contractId, liveProgress)

  return { phase, liveProgress, task, checkpoint, activityCard, advance, reset, setPaused, paused }
}

// ─── Multi-agent simulation (for AgentActivityMonitor) ───────────────────────

export interface UseMultiAgentSimulationReturn {
  cards: SimActivityCard[]
}

/**
 * Runs all 11 agent scenarios simultaneously with staggered start times.
 * Each scenario auto-cycles independently.
 */
export function useMultiAgentSimulation(contractId = 'demo'): UseMultiAgentSimulationReturn {
  const ALL_SCENARIOS = Object.keys(SCENARIOS) as AgentScenarioId[]

  // Each scenario gets its own phase state, staggered so they are at different points
  const STAGGER_PHASES: SimPhase[] = [
    'running_step_2',
    'running_step_3',
    'awaiting_checkpoint',
    'completed',
    'running_step_1',
    'running_step_4',
    'awaiting_checkpoint',
    'completed',
    'running_step_2',
    'completed',
    'awaiting_checkpoint',
  ]

  const [phases, setPhases] = useState<SimPhase[]>(
    ALL_SCENARIOS.map((_, i) => STAGGER_PHASES[i] ?? 'running_step_1')
  )
  const [progresses, setProgresses] = useState<number[]>(
    ALL_SCENARIOS.map((_, i) => {
      const p = STAGGER_PHASES[i] ?? 'running_step_1'
      if (p === 'completed') return 100
      if (p === 'awaiting_checkpoint') return 100
      const idx = phaseToStepIndex(p)
      return idx >= 0 ? idx * 25 + 12 : 5
    })
  )

  // Advance each running scenario every few seconds
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ALL_SCENARIOS.forEach((scenarioId, i) => {
      const scenario = SCENARIOS[scenarioId]
      const currentPhase = phases[i]
      const stepIdx = phaseToStepIndex(currentPhase)
      const isRunning = stepIdx >= 0
      const duration = isRunning ? (scenario.step_durations[stepIdx] ?? 4000) : 0

      if (isRunning || currentPhase === 'awaiting_checkpoint') {
        const delay = isRunning ? duration : (scenario.checkpoint_duration || 15000)
        timers.push(setTimeout(() => {
          setPhases(prev => {
            const next = [...prev]
            const idx = PHASE_ORDER.indexOf(next[i])
            if (idx >= 0 && idx < PHASE_ORDER.length - 1) next[i] = PHASE_ORDER[idx + 1]
            return next
          })
          setProgresses(prev => {
            const next = [...prev]
            next[i] = Math.min(next[i] + 25, 100)
            return next
          })
        }, delay + i * 500)) // stagger by 500ms per agent to avoid simultaneous updates
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [phases]) // eslint-disable-line react-hooks/exhaustive-deps

  const cards = ALL_SCENARIOS.map((scenarioId, i) =>
    buildActivityCard(SCENARIOS[scenarioId], phases[i], `${contractId}-${i}`, progresses[i])
  )

  return { cards }
}
