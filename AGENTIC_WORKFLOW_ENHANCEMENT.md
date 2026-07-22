# Agentic Workflow Enhancement
**LeaseGov — AI Agent Architecture Specification**
Version 1.0 | July 2026 | Status: Approved for Implementation

---

## The Key Insight

The agent UI infrastructure is already built and waiting for data. The repository contains fully implemented `ContractAgentProgressPanel`, `ContractCheckpointCard`, `AutomationPolicyBadge`, `InterventionButton`, `GracefulDegradationBanner`, `AgentDecisionCard`, `AgentExceptionPanel`, and `HumanCheckpointForm` components. The `AgentCheckpointQueue` and `AgentActivityMonitor` pages are built. The `AutomationPolicy` per-domain levels are wired.

**The components exist but have no live agents feeding them.** Adding agents is not a UI build problem — it is a service layer problem. The frontend cost of each agent below is low precisely because the display layer already exists.

---

## Tier 1 — Plug Directly Into Built Screens Today

These agents require no new screens or components. They slot into existing built UI and fix real gaps identified in the repo review.

---

### Agent 1 — Extraction Intelligence Agent

**Plugs into:** `ProcessingWorkflowDialog` (Step 2 — AI Extract)
**Existing component receiving output:** `ContractAgentProgressPanel` in `ExtractionQueue`
**AutomationPolicy domain:** `document_processing`
**Checkpoint type:** `extraction_review`

**What currently happens:** Step 2 runs a hardcoded animation with fake progress labels. There is no real extraction. The Preparer sees fabricated results.

**What the agent does:** When the Preparer clicks "Run Extraction," a real LLM call reads the uploaded document and returns 73 structured field extractions with confidence scores, evidence anchor positions (page number + bounding box), and a field-by-field reasoning trace. The `ContractAgentProgressPanel` (already wired) shows genuine progress through the actual processing states: `ocr_queued → ocr_processing → ocr_complete → extraction_pending → extraction_in_progress → completed`.

**Amendment delta feature (fixes carry-forward gap):** When `submission_path = 'existing_record'`, the agent cross-references extracted values against the approved record and outputs a delta: "8 fields changed, 65 unchanged." The amendment detection banner in Step 3 (currently listed as a carry-forward gap) is populated automatically from this delta. Preparer reviews only the changed fields — reducing verification time by 60–70% on amendments.

**Why this is the highest priority agent:** It is the core value proposition of the platform. Everything downstream (review, approval, export) depends on extraction quality. And the UI is already built — `ProcessingWorkflowDialog` Step 2 needs only its fabricated progress replaced with real LLM output.

---

### Agent 2 — Document Classification Agent

**Plugs into:** `UploadDialog` modal (already built in `components/pipeline/`)
**Existing component receiving output:** Target Context section, Step 1 template pre-selection
**AutomationPolicy domain:** `document_processing`
**Checkpoint type:** `classification_confirm`

**What currently happens:** The Preparer manually selects document type and target record. Template pre-selection in `ProcessingWorkflowDialog` Step 1 is listed as a carry-forward gap — not implemented.

**What the agent does:** The moment a file passes the four-check validation (format, size, duplicate, integrity), the agent performs a lightweight document read — not full extraction, just entity recognition:

- Classifies the document type (base contract, amendment, addendum, exhibit, renewal, termination) from the first page
- Identifies party names, property address, effective date, and any contract reference number
- Matches against `MOCK_CONTRACT_RECORDS` using the extracted party and address — ranks matches by confidence
- Pre-selects the record in the "Add to Existing Record" search field if confidence is high
- Pre-selects the `ExtractionTemplate` in `ProcessingWorkflowDialog` Step 1 based on detected document type

The result: the Document Submitter uploads a file and the system immediately says "This looks like an Amendment for CR-2026-0038 (Acme Corp, 123 Main St). Is that right?" One confirmation click instead of manual search.

**Fixes two carry-forward gaps simultaneously:** template pre-selection in Step 1, and the amendment detection identification for Step 3.

---

### Agent 3 — Export Field Mapping Agent

**Plugs into:** `ExportStaging.tsx` (triple-view panel — center column, field mapping table)
**Existing component receiving output:** Field mapping table already built
**AutomationPolicy domain:** `export_processing`
**Checkpoint type:** `export_attest`

**What currently happens:** The FC-7 audit identified High-severity issues with `?record=` param threading through the export chain. Once those navigation bugs are fixed, the Accountant still faces a manual field mapping task in the triple-view staging screen.

**What the agent does:** On `UploadTask` creation, the agent reads the `ExtractionTemplate` field list and the `ExportTemplate` column list and proposes a mapping for each column based on field names, data types, and semantic similarity. For repeat exports of the same template type, it carries forward the historical mapping from the prior export automatically.

Results surface in the existing center column of the triple-view — the field mapping table that is already built. Pre-mapped rows show a green agent badge. Unmapped or low-confidence rows are highlighted in amber for Accountant review. The Accountant's job becomes confirmation and exception handling rather than assembly.

**Prerequisite:** FC-7 navigation bugs (H1, H2, H3) must be fixed first. *(These are now resolved as of checkpoint cb73ff0e.)*

---

### Agent 4 — Critical Date Monitoring Agent

**Plugs into:** `RecordsDashboard.tsx` (summary cards) and `RecordsDetail.tsx` (Financial tab)
**Existing component receiving output:** `RecordsDashboard` summary cards, `RecordsDetail` Open Items tab (both built)
**AutomationPolicy domain:** `compliance_monitoring`
**Schedule:** Nightly across all approved records

**What the agent does:** Runs on a nightly schedule across all approved records. Produces three categories of output:

**Upcoming deadlines (within configurable windows):**
- Option exercise windows opening in the next 90 days → creates `WatchlistEntry` automatically
- Rent escalation dates within 30 days → creates action item in Open Items tab
- Lease expirations within 180 days → creates watchlist entry with `priority = high`

**Portfolio summary for `RecordsDashboard`:**
- "Expiring 90 Days" card count is agent-calculated (not hardcoded)
- "Options to Exercise" alert panel surfaces from agent output
- "Approaching Escalations" count feeds the summary row

**Open Items tab integration:**
The agent-created action items appear directly in the existing Open Items tab under a new "Critical Dates" category. Each item has a due date, a status toggle (Open / Acknowledged / Resolved), and a "Create Reassessment Case" quick action.

**Why this matters beyond UX:** Missing an option exercise deadline under ASC 842 is a material accounting error that triggers a mandatory remeasurement with a penalty impact. This agent eliminates the risk entirely for any organization running LeaseGov.

---

## Tier 2 — Enhance Existing Built Workflows

These agents require minor additions to existing screens — a new card, a new panel section, or a new action. No new pages.

---

### Agent 5 — Policy Compliance Agent

**Plugs into:** `ApprovalsReview.tsx` (750 lines — the Reviewer's primary workspace)
**New UI element:** Compliance card added above the field list in the left panel
**Existing component receiving output:** `AgentDecisionCard` (already built)
**AutomationPolicy domain:** `approval_processing`

**What the agent does:** When a record enters the Approval Queue, the agent reads the extracted key terms and compares against the tenant's configured `ThresholdConfiguration` values:

- Is base rent above the policy threshold for this asset class?
- Does lease term exceed the tenant's maximum approved term?
- Are escalation rates within policy limits?
- Are there unusual clauses (TI allowances above threshold, termination rights, purchase options) that require Controller sign-off?

**Results appear as a compliance card at the top of `ApprovalsReview` — three possible states:**
- **All compliant (green card):** "Policy check passed — 12 terms reviewed"
- **Exceptions found (amber card):** "2 policy exceptions — review before approving" with expandable detail
- **Controller escalation required (red card):** "1 term requires Controller approval" — disables "Approve for Final" until Controller adds a note

The card uses the existing `AgentDecisionCard` component. No new components needed.

---

### Agent 6 — Reassessment Trigger Detection Agent

**Plugs into:** `PipelineReviewGrouping.tsx` (946 lines) and `ReassessmentDashboard.tsx`
**New UI element:** Trigger suggestion banner in `PipelineReviewGrouping`
**AutomationPolicy domain:** `reassessment_processing`

**What the agent does:** When a Document Submitter groups documents for an existing record (Path A — Attach to Existing Record), the agent compares the incoming document against the approved record and detects potential modifications:

- Rent amount changed
- Term extended or shortened
- Leased space expanded or contracted
- Renewal option terms changed
- Rate changes (CPI adjustments, discount rate provisions)

A trigger suggestion banner appears in `PipelineReviewGrouping.tsx` before submission. After extraction confirms the modification, `ReassessmentCaseList.tsx` shows a draft case pre-populated with trigger type, contract reference, and effective date.

**Human in the loop:** The agent cannot open a reassessment case. It creates a draft. The Preparer confirms it. If the Preparer dismisses it, the dismissal is logged in the audit trail with the reason.

**Why this matters:** The most common ASC 842 compliance failure is a missed modification. This agent catches modifications at the point of document submission, not months later during an audit.

---

### Agent 7 — Financial Remeasurement Agent

**Plugs into:** `RecordsDetail.tsx → Financial tab` (`PropertyLeaseRecordFinancial.tsx`, 261 lines)
**Also plugs into:** `ReassessmentAnalysis.tsx` (313 lines)
**AutomationPolicy domain:** `financial_processing`
**Checkpoint type:** `analysis_confirm`

**What the agent does:** Takes approved lease terms (commencement date, expiration date, base rent, escalation rates, renewal options assessment result, incremental borrowing rate) and computes:

- Present value of remaining lease payments
- ROU asset balance with accumulated depreciation
- Lease liability amortization schedule (monthly)
- For reassessments: incremental impact on ROU asset and lease liability
- Day-one journal entry (debit ROU asset, credit lease liability)

Results populate the existing Financial tab tiles and the amortization schedule table (already rendered from mock data). In `ReassessmentAnalysis`, the financial impact section is populated from agent output and presented for Controller confirmation before the memo is generated.

**The key constraint preserved:** The agent proposes calculations. The Controller or Accountant confirms before anything enters the record.

---

### Agent 8 — Memo Generation Agent

**Plugs into:** `ReassessmentMemo.tsx` (164 lines — currently placeholder content)
**AutomationPolicy domain:** `reassessment_processing`
**Checkpoint type:** `analysis_confirm`

**What currently happens:** The memo screen is built but content generation is a placeholder — the memo body is empty or hardcoded.

**What the agent does:** Reads the completed reassessment case (trigger type, classification decision from the 3-question gate, option assessment result, financial impact from Agent 7 if available) and generates a structured accounting memo with seven sections:

1. **Background** — lease description, record reference, counterparty
2. **Triggering Event** — what happened, effective date, document evidence
3. **Classification Analysis** — ASC 842 paragraph citations, Q1/Q2/Q3 answers, result
4. **Lease Term Assessment** — probability determination with supporting factors
5. **Financial Impact** — remeasurement calculation summary
6. **Conclusion** — accounting treatment required
7. **Disclosure Requirements** — what must appear in footnotes

The draft appears in the existing memo screen with each section editable. A "lock" icon on each section shows whether the content is agent-generated (open lock) or Preparer-edited (closed lock with the Preparer's name). Once signed by the Approver, the memo is sealed into the `CompliancePacket` and becomes an immutable part of the permanent record.

**Why this is the highest-value Tier 2 agent:** A reassessment memo is required audit documentation under ASC 842. Currently it's drafted in Word outside the system, which breaks the audit trail. This agent brings memo generation inside the governed workflow without any new screens.

---

## Tier 3 — New Capabilities Extending Existing Architecture

These require minor new UI elements on existing pages or a new section in an existing screen.

---

### Agent 9 — Portfolio Risk Intelligence Agent

**New UI:** A collapsible "Portfolio Intelligence" panel added to `RecordsDashboard.tsx`
**AutomationPolicy domain:** `compliance_monitoring`
**Schedule:** Weekly across the entire portfolio

**Runs weekly and surfaces three risk views:**
- **Concentration risk:** "You have 14 leases with Acme Corp representing 31% of total lease liability. High counterparty concentration."
- **Maturity clustering:** "7 leases expire in Q4 2027. Rollover risk may require advance negotiation planning."
- **Escalation exposure:** "CPI-linked escalation across 22 leases will add an estimated $840,000 in annual payments starting January 2027."

Results appear as insight cards with drill-down links to the specific records. The Controller and Lease Admin are the primary audience. No new screens — a new panel section in the existing `RecordsDashboard`.

---

### Agent 10 — Export Reconciliation Agent

**Plugs into:** `ExportUploadTask.tsx` completion state (Step 5 → completed)
**AutomationPolicy domain:** `export_processing`

**What currently happens:** After the Accountant completes the attestation and clicks "Complete Export," the workflow ends. There is no verification that the external system received correct values.

**What the agent does:** After `UploadTask.status → completed`, the agent compares the sealed `CompliancePacket` hash against a screenshot or confirmation reference the Accountant provided in Step 3. It checks for value consistency between exported data and uploaded evidence.

Results appear in the completion state screen — which already shows the `CompliancePacket` summary card. The agent adds a reconciliation status badge: "Reconciliation: Values match — no discrepancies detected" (green) or "Reconciliation: 2 values differ from uploaded evidence" (amber, with detail).

---

### Agent 11 — Investigative Survey Intelligence Agent

**Plugs into:** `ReassessmentSurveyIntake.tsx` (built, prompt type selector + survey forms)
**AutomationPolicy domain:** `reassessment_processing`

**What the agent does:** When a survey type is selected, the agent searches prior records and approved reassessment cases for relevant evidence and pre-populates survey answers with found evidence, cited with source. The `overall_confidence` score is calculated from evidence strength rather than requiring manual assessment.

---

## Priority Implementation Roadmap

| Phase | Agent | Reason to Do Now |
|-------|-------|-----------------|
| Phase 1 | Agent 1 — Extraction Intelligence | Highest platform value; UI already fully built |
| Phase 1 | Agent 2 — Document Classification | Fixes 2 carry-forward gaps simultaneously |
| Phase 1 | Agent 4 — Critical Date Monitoring | Eliminates highest compliance risk; Open Items tab just built |
| Phase 2 | Agent 3 — Export Field Mapping | After FC-7 navigation bugs are fixed *(now resolved)* |
| Phase 2 | Agent 8 — Memo Generation | `ReassessmentMemo.tsx` is built and waiting |
| Phase 2 | Agent 5 — Policy Compliance | Plugs into `ApprovalsReview` with no new components |
| Phase 3 | Agent 6 — Trigger Detection | Requires extraction to be working first |
| Phase 3 | Agent 7 — Financial Remeasurement | Requires extraction results as input |
| Phase 4 | Agent 9 — Portfolio Intelligence | Standalone, add when core agents are stable |
| Phase 4 | Agent 10 — Export Reconciliation | After export chain navigation bugs are fixed *(now resolved)* |
| Phase 4 | Agent 11 — Survey Intelligence | After FC-6 chain is validated end-to-end |

---

## Reassessment AI Agent — Detailed Expansion

The Reassessment AI Agent is not a single agent. It is four specialized agents that each take ownership of one phase of the FC-6 workflow. They work sequentially, hand off to each other, and hand off to humans at every gate that requires professional judgment.

### Phase 1 — Trigger Detection Agent

**Screens:** `ReassessmentTrigger.tsx` and `PipelineReviewGrouping.tsx`
**Role that benefits:** Business Submitter, Preparer

The agent watches the document intake pipeline. The moment a document is submitted to an existing record (Path A — Attach to Existing Record), it reads the incoming document and cross-references it against the current approved record. It identifies the following trigger types: rent modifications, term changes, space changes, option changes, and rate changes.

A trigger suggestion banner appears in `PipelineReviewGrouping.tsx` before the Document Submitter submits the package. After extraction confirms the modification, `ReassessmentCaseList.tsx` shows a draft case pre-populated with trigger type, effective date, reference to the originating document, and a link to the specific extracted fields that differ from the approved record.

**Human in the loop:** The agent cannot open a reassessment case. It creates a draft. The Preparer confirms it. If the Preparer dismisses it, the dismissal is logged in the audit trail with the reason.

---

### Phase 2 — Classification Agent

**Screen:** `ReassessmentClassification.tsx` (403 lines, full 3-question sequential gate already built)
**Role that benefits:** Preparer

The agent pre-answers all three classification questions based on extraction data:

- **Q1 — Have the terms changed?** Agent compares extracted field values against the approved record and cites specific fields.
- **Q2 — Does the modification grant additional ROU assets?** Agent reads the amendment for premises additions and cross-references against the current record's property description.
- **Q3 — Is the consideration commensurate with standalone price?** Agent reads stated consideration amounts, compares to existing rent per square foot, and presents a calculation with a recommendation.

Each question pre-populates with the agent's recommended answer and supporting evidence. The Preparer sees `[ Accept ] [ Override ]` on each question. If they override, both the agent's recommendation and their override are logged — creating a documented audit trail of the judgment.

**Human in the loop:** The Preparer must click Accept or Override on each question. They cannot skip through without engaging. The agent's recommendation is advisory — the Preparer's decision is what determines the classification outcome.

---

### Phase 3 — Assessment Agent

**Screen:** `ReassessmentAssessment.tsx` (403 lines, built)
**Role that benefits:** Preparer, Business Submitter

The agent pre-populates the assessment factors from three sources: extracted record data, portfolio history (prior option exercise decisions on similar properties), and survey responses (if an Investigative Survey was completed for this case).

Each of the twelve Tier 2 factors appears with an agent pre-assessment showing Factor, Agent Assessment, Confidence, and Evidence. For High-confidence factors, the Preparer can accept in bulk. For Low-confidence or Unknown factors, they can request a Business Submitter response directly from this screen — triggering an Investigative Survey for the specific unknown data point.

The probability percentage updates in real time as the Preparer accepts or overrides each factor. When all twelve are addressed, the determination is produced: "Reasonably Certain" or "Not Reasonably Certain."

**Human in the loop:** Every factor requires Preparer engagement. The agent cannot produce the final determination — the Preparer must address all twelve factors.

---

### Phase 4 — Analysis and Memo Agent

**Screens:** `ReassessmentAnalysis.tsx` (313 lines) and `ReassessmentMemo.tsx` (164 lines, currently placeholder content)
**Role that benefits:** Preparer, Reviewer, Approver

Once classification and assessment are complete, the agent generates two outputs:

**Output 1 — Financial impact calculation:**
Revised present value of remaining lease payments, new lease liability balance at remeasurement date, new ROU asset balance after depreciation adjustment, gain or loss on remeasurement, and journal entry. These numbers populate `ReassessmentAnalysis.tsx` in the financial impact section. The Preparer can adjust the incremental borrowing rate and see the numbers recalculate in real time.

**Output 2 — Accounting memo draft:**
The agent generates the memo in `ReassessmentMemo.tsx` with seven structured sections (Background, Triggering Event, Classification Analysis, Lease Term Assessment, Financial Impact, Conclusion, Disclosure Requirements). Each section is editable. A "lock" icon shows whether content is agent-generated or Preparer-edited. Once signed by the Approver, the memo is sealed into the `CompliancePacket` and becomes an immutable part of the permanent record.

---

## Investigative Survey AI Agent — Detailed Expansion

The six investigative survey types exist because not all reassessment triggers are obvious. The Investigative Survey AI Agent turns each survey type into an active evidence-gathering exercise rather than a passive questionnaire.

### The Six Survey Types

| Survey Type | Scenario | Agent Capability |
|-------------|----------|-----------------|
| **Mailroom Survey** | Unexpected lease-related correspondence received | Reads uploaded letter, classifies type, matches to existing record, pre-populates form |
| **Project Ghost Survey** | Undocumented space occupancy detected | Searches approved records for the property address, checks for related documents in staging |
| **Lease vs Service Contract Survey** | Unclear whether arrangement is lease or service contract | Applies ASC 842 lease identification criteria (3 criteria) with specific contract language cited |
| **Negotiation Whisper Survey** | Intelligence on upcoming lease renegotiation | Connects reported intelligence to existing records, checks current option assessment status |
| **Strategic Pivot Survey** | Significant business change affecting leased space | Identifies all affected lease records by business unit, cost center, or geographic region |
| **Asset Utility Survey** | Changes in how a leased asset is being used | Cross-references asset serial number against ExtractionTemplate field values across all records |

### Confidence Scoring

| Confidence Level | Meaning | Action |
|-----------------|---------|--------|
| **High** | Specific documentary evidence found, cross-referenced to existing record, clear accounting implication | Promotes to case or project |
| **Medium** | Partial evidence found, could not complete the picture | Sends for human review |
| **Low** | No corroborating evidence found | Sends for clarification with specific questions |

### Promotion Paths

After the survey is completed, the agent recommends one of three paths. The human decides which to take:

1. **Promote to Reassessment Case** — Used when the survey confirms a specific triggering event on a known lease record. Draft case pre-populated with trigger type, affected record, and effective date.
2. **Promote to Contextual Project** — Used when the survey identifies something that needs investigation but is not yet clearly a triggering event. Creates an evidence-gathering workspace in `ReassessmentContextualProject.tsx`.
3. **Send for Clarification** — Used when confidence is low. Agent generates specific clarifying questions based on what it could not find.

### The Contextual Project Connection

`ReassessmentContextualProject.tsx` (already built) is the investigation workspace that sits between a survey and a case. The four task types in the Contextual Project map precisely to what the agent cannot resolve on its own:

- **Document upload request** — Agent needs a document it knows should exist but hasn't been uploaded yet
- **Operational fact confirmation** — Agent needs a Business Submitter to confirm a real-world fact
- **Accounting review assignment** — Agent needs a Preparer or Controller to make a professional judgment
- **Downstream evidence submission** — Agent needs information from an external system

Each task in the Contextual Project is created by the agent with a specific ask. Humans complete the tasks. When all tasks are done, the evidence chain is complete and the agent recommends whether to promote to a formal reassessment case.

---

## What Makes This Different From Generic AI Features

Every agent above maps to a screen that exists, a component that is built, and a gap that was identified in the live repo audit:

- **Agent 1** directly replaces the fake animation in `ProcessingWorkflowDialog` Step 2 — the exact gap noted in the build state report.
- **Agent 2** fixes the "template pre-selection carry-forward" and "amendment detection banner carry-forward" — both listed by name in Section 9d of the build state report.
- **Agent 3** turns the `ExportStaging` field mapping table (which already renders mock data) into an intelligence surface — after the H1/H2/H3 navigation bugs are fixed *(now resolved)*.
- **Agent 4** populates the `RecordsDashboard` summary cards and Open Items tab with live calculated data instead of hardcoded numbers.
- **Agent 8** fills the placeholder content in `ReassessmentMemo.tsx` — the screen is 164 lines long and fully rendered but has no generated content.

The agents do not require new screens. They require real service functions replacing the `// TODO: Backend integration required` stubs that already exist in every service file.

---

*Document saved: July 2026 | Source: Agentic Workflow Enhancement spec, session analysis*
