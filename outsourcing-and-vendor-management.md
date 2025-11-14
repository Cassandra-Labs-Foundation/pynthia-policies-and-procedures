# Outsourcing & Vendor Management

&#x20;uses vendors and other third parties to deliver products and services, but the Board and management remain fully responsible for safety and soundness, BSA/AML, sanctions, consumer protection, privacy, and capital adequacy obligations. We will identify, assess, approve, contract with, monitor, and, when necessary, exit third-party relationships in line with applicable law (including BSA/AML, GLBA privacy and safeguarding, and NCUA security and BSA rules) and the Interagency Guidance on Third-Party Relationships: Risk Management, using this policy as the minimum standard for governance, lifecycle controls, and engineering requirements. :contentReference\[oaicite:0]{index=0}

***

### MULTI-RULE AUTHORITY TABLE <a href="#authority" id="authority"></a>

| Topic                                                                 | Scope                                                                                                                                                                  | Key Clauses / Notes                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Third-Party Relationships: Risk Management (Interagency Guidance)** | All third-party relationships and lifecycle stages (planning, due diligence, contracts, monitoring, termination, governance)                                           | Final **Interagency Guidance on Third-Party Relationships: Risk Management** (88 FR 37920) — overview, lifecycle, and governance expectations for banking organizations. :contentReference\[oaicite:1]{index=1}                                                                                                    |
| **BSA / AML & CIP (31 CFR Chapter X)**                                | BSA/AML program obligations, including when using third parties for onboarding, KYC, transaction monitoring, or sanctions screening                                    | 31 CFR § 1020.220 (CIP for banks, savings associations, credit unions) and related BSA rules: institution must maintain its own written program and remains responsible even when leveraging third parties. :contentReference\[oaicite:2]{index=2}                                                                 |
| **Credit Union Security & BSA Programs (12 CFR Part 748)**            | Security program, BSA monitoring, SAR reporting, safeguarding member information, and response programs, including where vendors are involved                          | 12 CFR Part 748, including § 748.0 (security program), § 748.2 (BSA procedures), Appendix A (Guidelines for Safeguarding Member Information), Appendix B (Incident response and member notice). :contentReference\[oaicite:3]{index=3}                                                                             |
| **Privacy of Consumer Financial Information (Regulation P / GLBA)**   | Privacy notices, limits on sharing nonpublic personal information with nonaffiliated third parties, and exceptions                                                     | 12 CFR Part 1016 (Regulation P) implementing GLBA: privacy notices, opt-out where applicable, and limits on disclosure and reuse by third parties. :contentReference\[oaicite:4]{index=4}                                                                                                                          |
| **Bank Service Company Act / Service Provider Reporting**             | Reporting certain service provider relationships and examination authority over service companies (for bank-chartered affiliates and where applicable analogues exist) | 12 U.S.C. § 1867(c) (notification of certain service contracts) and related agency guidance reminding institutions to notify regulators of covered third-party service relationships. (Assumption—application to \[ORGANIZATION] depends on charter and primary regulator.) :contentReference\[oaicite:5]{index=5} |
| **NCUA BSA / AML Oversight**                                          | NCUA’s examination expectations for BSA/AML, including third-party arrangements                                                                                        | NCUA BSA/AML resources: NCUA must review BSA programs at each exam; credit unions remain responsible for BSA/AML compliance even when using third-party vendors. :contentReference\[oaicite:6]{index=6}                                                                                                            |

***

### TIMING MATRIX <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                                                                    | Trigger (human → event)                                                |                                                                                                                                           Deadline | Content Reference                                                                                              | Control                                                                                           |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| New critical / capital-impacting vendor proposed                                            | Business owner submits vendor request → `vendor.requested`             |                                                                                                   Before issuing RFP or engaging vendor in any way | VM-03: Risk Assessment & Planning; VM-06: Outsourcing of Core & Capital-Impacting Functions                    | [VM-03](outsourcing-and-vendor-management.md#vm-03-risk-assessment-planning)                      |
| Selection of vendor providing onboarding, KYC, AML, or sanctions services                   | Compliance signs off on vendor shortlist → `vendor.shortlist.approved` |                                                                              Before contract execution and before any live customer data is shared | VM-04: Due Diligence & AML/KYC Expectations                                                                    | [VM-04](outsourcing-and-vendor-management.md#vm-04-due-diligence-aml-kyc-expectations)            |
| Execution of any high- or medium-risk vendor contract                                       | Authorized signer approves contract → `contract.approval.submitted`    |                                                       After risk assessment & due diligence completed and documented; prior to `contract.executed` | VM-05: Contract Standards & Regulatory Clauses                                                                 | [VM-05](outsourcing-and-vendor-management.md#vm-05-contract-standards-regulatory-clauses)         |
| Periodic review of vendor risk and performance                                              | Calendar or task scheduler issues review task → `vendor.review.due`    |                                                                **High risk:** at least annually; **Medium:** every 2 years; **Low:** every 3 years | VM-07: Ongoing Monitoring, Performance & Risk Reporting                                                        | [VM-07](outsourcing-and-vendor-management.md#vm-07-ongoing-monitoring-performance-risk-reporting) |
| Security incident or privacy breach at vendor (confirmed or suspected)                      | Incident intake receives report → `vendor.incident.reported`           | Internal triage within 1 business day; external notices (members/regulator/card network) per 12 CFR Part 748 Appendix B and other applicable rules | VM-08: Incident & Breach Reporting                                                                             | [VM-08](outsourcing-and-vendor-management.md#vm-08-incident-breach-reporting)                     |
| Change in vendor criticality (e.g., now touches capital, core processing, or BSA functions) | Risk function updates classification → `vendor.criticality.changed`    |                                                          Re-perform risk assessment within 30 days; update monitoring plan and contracts if needed | VM-02: Vendor Inventory & Criticality Classification; VM-06: Outsourcing of Core & Capital-Impacting Functions | [VM-02](outsourcing-and-vendor-management.md#vm-02-vendor-inventory-criticality-classification)   |
| Planned termination or non-renewal of critical vendor                                       | Business owner initiates exit → `vendor.exit.initiated`                |                                                Exit plan approved before notice to vendor; data and continuity risks addressed before contract end | VM-09: Termination & Exit Strategy                                                                             | [VM-09](outsourcing-and-vendor-management.md#vm-09-termination-exit-strategy)                     |

***

### CONTROL INDEX <a href="#control-index" id="control-index"></a>

| ID                                                                                                | Control Name                                      | Purpose                                                                                                                                          | Primary Rule(s)                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [VM-01](outsourcing-and-vendor-management.md#vm-01-governance-accountability)                     | Governance & Accountability                       | Assign board and management ownership for third-party risk, including audit and oversight                                                        | Interagency Guidance (governance); 12 CFR Part 748 (board responsibility for security and BSA) :contentReference\[oaicite:7]{index=7}           |
| [VM-02](outsourcing-and-vendor-management.md#vm-02-vendor-inventory-criticality-classification)   | Vendor Inventory & Criticality Classification     | Maintain an up-to-date inventory and risk-based classification of all vendors, highlighting core and capital-impacting functions                 | Interagency Guidance (risk identification); NCUA security and safeguarding expectations :contentReference\[oaicite:8]{index=8}                  |
| [VM-03](outsourcing-and-vendor-management.md#vm-03-risk-assessment-planning)                      | Risk Assessment & Planning                        | Ensure risk-based analysis and business justification before engaging vendors, including capital and strategic impacts                           | Interagency Guidance lifecycle: planning; 12 U.S.C. § 1867(c) where applicable :contentReference\[oaicite:9]{index=9}                           |
| [VM-04](outsourcing-and-vendor-management.md#vm-04-due-diligence-aml-kyc-expectations)            | Due Diligence & AML/KYC Expectations              | Define, perform, and document enhanced due diligence, especially for vendors supporting onboarding, KYC, AML, and sanctions                      | BSA/CIP rules (31 CFR § 1020.220); NCUA BSA expectations; Interagency Guidance (due diligence) :contentReference\[oaicite:10]{index=10}         |
| [VM-05](outsourcing-and-vendor-management.md#vm-05-contract-standards-regulatory-clauses)         | Contract Standards & Regulatory Clauses           | Embed minimum legal, regulatory, and operational terms in all material vendor contracts                                                          | GLBA/Reg P; 12 CFR Part 748 (safeguarding); Interagency Guidance (contracting) :contentReference\[oaicite:11]{index=11}                         |
| [VM-06](outsourcing-and-vendor-management.md#vm-06-outsourcing-core-capital-impacting-functions)  | Outsourcing of Core & Capital-Impacting Functions | Set stricter expectations for outsourcing core processing, capital-impacting, and BSA-related activities; clarify that risk cannot be outsourced | Interagency Guidance (critical activities); BSA/AML; NCUA security & BSA rules :contentReference\[oaicite:12]{index=12}                         |
| [VM-07](outsourcing-and-vendor-management.md#vm-07-ongoing-monitoring-performance-risk-reporting) | Ongoing Monitoring, Performance & Risk Reporting  | Monitor vendor performance, risk, and compliance; report to management and the Board                                                             | Interagency Guidance (ongoing monitoring, reporting); 12 CFR Part 748 (ongoing BSA monitoring) :contentReference\[oaicite:13]{index=13}         |
| [VM-08](outsourcing-and-vendor-management.md#vm-08-incident-breach-reporting)                     | Incident & Breach Reporting                       | Ensure timely detection, escalation, and response to vendor incidents, including member notification and regulatory reporting                    | 12 CFR Part 748 Appendices A & B; BSA SAR rules; Interagency Guidance (incident response expectations) :contentReference\[oaicite:14]{index=14} |
| [VM-09](outsourcing-and-vendor-management.md#vm-09-termination-exit-strategy)                     | Termination & Exit Strategy                       | Require documented exit plans and safe transition of services and data for critical vendors                                                      | Interagency Guidance lifecycle: termination; GLBA safeguarding during transition :contentReference\[oaicite:15]{index=15}                       |
| [VM-10](outsourcing-and-vendor-management.md#vm-10-key-third-party-owners-raci)                   | Key Third-Party Owners & RACI                     | Maintain and publish the list of key third-party relationships and accountable owners                                                            | Interagency Guidance (documentation and reporting) :contentReference\[oaicite:16]{index=16}                                                     |

***

### CONTROL OVERLAYS (Design Overlay v2)

#### VM-01 — Governance & Accountability

* **WHY (Reg cite):** Regulators expect the Board and senior management to oversee third-party risk with clear accountability, independent reviews, and documentation, including for security and BSA/AML programs. :contentReference\[oaicite:17]{index=17}
* **SYSTEM BEHAVIOR:**
  * Maintain a single authoritative “Vendor Governance” configuration, mapping roles (Board, committees, CRO, CCO, CIO, business owners, Internal Audit) to vendor risk responsibilities.
  * Require evidence of Board or committee approval for this policy and material vendor relationships above defined thresholds (e.g., critical vendors, capital-impacting vendors).
* **TRIGGERS (human → event):**
  * Board or committee approves policy or material vendor → `governance.vendor_policy.approved`
  * Internal Audit completes vendor program review → `audit.vendor_program.completed`
  * Regulator issues examination finding related to vendors → `exam.vendor_finding.recorded`
* **INPUTS (human → field):**
  * Policy owner (CRO/CCO) → `governance.policy_owner`
  * Board/committee name → `governance.board_body`
  * Approval date → `governance.approval_date`
  * Internal audit scope (includes vendors Y/N) → `audit.scope.vendor_flag`
* **OUTPUTS:**
  * Machine-readable policy metadata (owner, version, approval dates).
  * Governance dashboard showing all vendor-related committees, cadence, and last review dates.
* **TIMERS/SLAs:**
  * Policy reviewed and re-approved at least annually.
  * Internal Audit to review vendor management program at least once every 24 months; high-growth / high-risk phases may warrant annual review.
* **EDGE CASES:**
  * If Board is unable to meet, committee with delegated authority may approve policy; system records delegation.
  * If Internal Audit is outsourced, same independence criteria must be documented.
* **AUDIT LOGS (event names):**
  * `governance.policy.approved`
  * `governance.policy.reviewed`
  * `audit.vendor_program.completed`
* **ACCESS CONTROL:**
  * Only policy owner and Governance admin role can edit governance mappings.
  * Read-only access for all management and Internal Audit.
* **ALERTS/METRICS:**
  * Alert when policy “next\_review” date is within 30 days with no scheduled review.
  * Metric: % of critical vendors with explicit Board/committee approval recorded.

***

#### VM-02 — Vendor Inventory & Criticality Classification

* **WHY (Reg cite):** Interagency guidance and NCUA security expectations require institutions to know which third parties they rely on, how critical they are, and what risks they introduce, including access to member information. :contentReference\[oaicite:18]{index=18}
* **SYSTEM BEHAVIOR:**
  * Maintain a centralized vendor inventory covering all third parties receiving compensation or accessing nonpublic member or operational data.
  * Classify vendors by inherent risk and criticality (e.g., Critical, Material, Minor, Exempt) based on standardized criteria including: mission-critical functions, access to NPI, network connectivity, BSA/AML involvement, and capital impact.
  * Flag vendors that:
    * Perform core processing / card issuing / deposit operations.
    * Touch capital-impacting activities (e.g., funding, balance sheet, credit risk).
    * Provide BSA/AML, KYC, or sanctions services.
* **TRIGGERS (human → event):**
  * New vendor proposed → `vendor.requested`
  * Vendor onboarded → `vendor.onboarded`
  * Vendor information updated → `vendor.profile.updated`
* **INPUTS (human → field):**
  * Vendor legal name → `vendor.name`
  * Services description → `vendor.services.description`
  * Inherent risk rating (Low/Med/High) → `vendor.risk.inherent_level`
  * Criticality (Critical/Material/Minor/Exempt) → `vendor.criticality.level`
  * Access to NPI? (Y/N) → `vendor.accesses_npi_flag`
  * Network connection? (Y/N) → `vendor.network_connection_flag`
  * BSA/AML/KYC role? (Y/N) → `vendor.bsa_role_flag`
  * Capital-impacting? (Y/N) → `vendor.capital_impact_flag`
* **OUTPUTS:**
  * Real-time vendor inventory reports filtered by risk level, criticality, and regulatory domain (BSA, GLBA, core processing, capital-impacting).
* **TIMERS/SLAs:**
  * Vendor must be added to inventory before contract execution.
  * Inventory reconciled against Accounts Payable and procurement systems at least quarterly.
* **EDGE CASES:**
  * One-off vendors (e.g., hotels, small events) may be categorized as Exempt with minimal fields, but only if no access to NPI or networks.
  * Open-source software without support contracts is tracked in a separate OSS register but linked when a paid support vendor exists.
* **AUDIT LOGS:**
  * `vendor.inventory.created`
  * `vendor.inventory.reconciled`
  * `vendor.classification.changed`
* **ACCESS CONTROL:**
  * Edit rights: Vendor Risk team, business owners for their vendors.
  * Read rights: all risk, compliance, finance, and audit roles.
* **ALERTS/METRICS:**
  * Metric: % of vendor spend mapped to an active vendor record.
  * Alert if `vendor.capital_impact_flag = true` and `vendor.criticality.level != "Critical"`.

***

#### VM-03 — Risk Assessment & Planning

* **WHY (Reg cite):** Third-party guidance requires risk-based planning and assessment before entering a relationship, including strategic fit and analysis across risk types (credit, liquidity, compliance, operational, reputation, etc.). :contentReference\[oaicite:19]{index=19}
* **SYSTEM BEHAVIOR:**
  * Require a pre-contract risk assessment for all vendors, commensurate with risk and complexity.
  * For critical or capital-impacting vendors, enforce a structured assessment across at least: strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity impact.
  * Capture financial projections / cost-benefit where the relationship is significant.
* **TRIGGERS (human → event):**
  * Business owner initiates risk assessment → `vendor.risk_assessment.started`
  * Risk officer approves assessment → `vendor.risk_assessment.approved`
  * Request to bypass formal RFP for significant engagement → `vendor.rfp.exception.requested`
* **INPUTS (human → field):**
  * Strategic alignment summary → `vendor.assessment.strategic_fit`
  * Risk domains scored → `vendor.assessment.risk_scores[]`
  * Required internal changes (staff, systems) → `vendor.assessment.internal_changes`
  * Financial projection summary → `vendor.assessment.financial_projection`
  * RFP required? (Y/N) → `vendor.rfp.required_flag`
  * RFP exception rationale → `vendor.rfp.exception_reason`
* **OUTPUTS:**
  * Risk assessment report linked to the vendor and contract record.
  * RFP decision (yes/no) documented for significant vendors.
* **TIMERS/SLAs:**
  * Risk assessment must be completed and approved before `contract.executed` for Medium/High risk vendors.
  * For small / low-risk vendors, the system may allow a lightweight assessment template but must still be completed pre-contract.
* **EDGE CASES:**
  * Emergency situations (e.g., urgent security patch vendor) may allow provisional engagement with abbreviated assessment, flagged for full review within 30 days.
  * Multi-entity arrangements (consortia, sub-servicers) must consider each material sub-vendor.
* **AUDIT LOGS:**
  * `vendor.risk_assessment.started`
  * `vendor.risk_assessment.approved`
  * `vendor.rfp.exception.approved`
* **ACCESS CONTROL:**
  * Only Risk and Compliance teams can finalize risk scores.
  * Business owners may draft but not approve the final assessment.
* **ALERTS/METRICS:**
  * Alert if a Medium/High risk vendor has `contract.status = "executed"` and no approved risk assessment attached.
  * Metric: % of critical vendors with completed pre-contract risk assessment.

***

#### VM-04 — Due Diligence & AML/KYC Expectations

* **WHY (Reg cite):** BSA/AML and CIP rules require the institution to maintain its own program, even when a third party performs KYC, onboarding, or monitoring; regulators expect due diligence proportionate to the third party’s risk profile. :contentReference\[oaicite:20]{index=20}
* **SYSTEM BEHAVIOR:**
  * For every vendor, require a due diligence package proportional to risk.
  * For any vendor involved in onboarding, KYC, AML, sanctions, or transaction monitoring:
    * Enforce **enhanced due diligence** (EDD) including: regulatory history, BSA/AML controls, independent audit reports, staffing qualifications, model validation status (if applicable).
    * Record a clear division of BSA/AML responsibilities between \[ORGANIZATION] and the vendor (e.g., who performs CIP, OFAC screening, monitoring, SAR drafting).
  * Capture and track licenses, certifications, and any required registrations.
* **TRIGGERS (human → event):**
  * Due diligence checklist started → `vendor.due_diligence.started`
  * EDD required (BSA/AML/KYC vendor) → `vendor.due_diligence.edd_required`
  * Due diligence completed → `vendor.due_diligence.completed`
* **INPUTS (human → field):**
  * DD type (Standard/EDD) → `vendor.due_diligence.type`
  * BSA/AML role (e.g., “CIP provider”, “Sanctions screening”) → `vendor.bsa.role_description`
  * Summary of BSA/AML responsibilities split → `vendor.bsa.raci_summary`
  * SOC / SSAE report references → `vendor.controls_report.references`
  * Consumer protection controls (UDAAP, Reg P, etc.) → `vendor.consumer_compliance.summary`
* **OUTPUTS:**
  * Due diligence report, including BSA/AML RACI and references to supporting documents.
  * Vendor “risk profile card” summarizing due diligence results.
* **TIMERS/SLAs:**
  * Due diligence must be completed before any production data or member NPI is shared with the vendor.
  * For BSA/AML/KYC vendors, EDD must be refreshed at least annually.
* **EDGE CASES:**
  * If a core provider subcontracts BSA/AML functions, the due diligence must extend to material subcontractors or obtain equivalent assurance through SOC reports.
* **AUDIT LOGS:**
  * `vendor.due_diligence.started`
  * `vendor.due_diligence.completed`
  * `vendor.due_diligence.edd_flagged`
* **ACCESS CONTROL:**
  * Due diligence documents restricted to Compliance, Risk, Internal Audit, and relevant executives.
  * BSA/AML RACI viewable by all product and operations teams building flows dependent on the vendor.
* **ALERTS/METRICS:**
  * Metric: % of BSA/AML/KYC vendors with current (≤12 months) EDD on file.
  * Alert if `vendor.bsa_role_flag = true` and `vendor.bsa.raci_summary` is null.

***

#### VM-05 — Contract Standards & Regulatory Clauses

* **WHY (Reg cite):** Interagency guidance and GLBA/Reg P require contracts with service providers to address responsibilities, performance, access, privacy, safeguarding, audit rights, business continuity, and compliance with applicable laws. :contentReference\[oaicite:21]{index=21}
* **SYSTEM BEHAVIOR:**
  * Enforce a standard contract clause library for material vendor agreements, including:
    * Scope of services, performance SLAs, and reporting.
    * Responsibilities of each party (including oversight of subcontractors).
    * Data security and privacy (GLBA / Reg P, NCUA safeguarding guidelines).
    * BSA/AML and sanctions responsibilities as defined in VM-04.
    * Audit and examination rights (including right of regulators to review).
    * Business continuity / disaster recovery requirements.
    * Termination, exit, and transition assistance.
  * For any contract involving capital-impacting or core functions, require Legal and Risk sign-off before execution.
* **TRIGGERS (human → event):**
  * Contract draft created → `contract.draft.created`
  * Clause library applied → `contract.template.applied`
  * Legal and Risk approvals completed → `contract.approval.legal_risk_completed`
  * Contract executed → `contract.executed`
* **INPUTS (human → field):**
  * Contract type (MSA/SOW/addendum) → `contract.type`
  * Contract value and term → `contract.value_usd`, `contract.term_months`
  * Clause coverage checklist (Y/N per required clause) → `contract.clauses[]`
  * Legal sign-off user and date → `contract.legal_approval`
  * Risk sign-off user and date → `contract.risk_approval`
* **OUTPUTS:**
  * Contract record with clause coverage status and approvals.
  * Exceptions log where any standard clauses are modified or omitted, with rationale.
* **TIMERS/SLAs:**
  * Contract must have all required clause checks completed before `contract.executed`.
  * Clause library reviewed at least annually to reflect updated regulations and guidance.
* **EDGE CASES:**
  * Non-negotiable “click-through” terms (e.g., commodity SaaS) must still be reviewed for high-risk vendors; acceptance is documented with captured terms.
* **AUDIT LOGS:**
  * `contract.template.applied`
  * `contract.clause.exception.approved`
  * `contract.executed`
* **ACCESS CONTROL:**
  * Only Legal and Procurement can modify clause templates.
  * Business owners can view but not alter regulatory clauses.
* **ALERTS/METRICS:**
  * Alert when a contract is flagged as capital-impacting or BSA-related and lacks Legal or Risk sign-off.
  * Metric: % of material contracts with all required clauses present (no exceptions).

***

#### VM-06 — Outsourcing of Core & Capital-Impacting Functions

* **WHY (Reg cite):** Regulators treat core processing, payments, and other critical or capital-impacting services as higher-risk; outsourcing does not transfer responsibility for safety and soundness, capital, or BSA/AML compliance. :contentReference\[oaicite:22]{index=22}
* **SYSTEM BEHAVIOR:**
  * Tag any vendor as “core” or “capital-impacting” where they:
    * Operate or host core banking/ledger/card systems.
    * Handle settlement flows, funding, or exposure directly affecting capital and liquidity.
    * Perform or host critical BSA/AML processes (CIP, monitoring, sanctions).
  * Apply stricter controls:
    * Mandatory **High** inherent risk rating.
    * Annual on-site or equivalent virtual review and enhanced monitoring.
    * Explicit board-level awareness and approval.
    * Enhanced exit and contingency planning.
* **TRIGGERS (human → event):**
  * Capital-impacting flag set → `vendor.capital_impact.flagged`
  * Vendor designated as core provider → `vendor.core_provider.flagged`
* **INPUTS (human → field):**
  * Core vs non-core designation → `vendor.core_flag`
  * Capital impact description → `vendor.capital_impact.description`
  * Enhanced oversight measures selected → `vendor.oversight.enhanced_controls[]`
* **OUTPUTS:**
  * List of core / capital-impacting vendors with oversight plans and test dates.
  * Board/committee reporting highlighting these vendors and concentration risk.
* **TIMERS/SLAs:**
  * Annual comprehensive review required for all core/capital-impacting vendors.
  * Contingency/exit plans for such vendors tested at least every 24 months.
* **EDGE CASES:**
  * If a vendor’s role evolves into capital-impacting, system triggers a re-assessment and contract review within 30 days.
* **AUDIT LOGS:**
  * `vendor.core_provider.flagged`
  * `vendor.capital_impact.flagged`
  * `vendor.capital_review.completed`
* **ACCESS CONTROL:**
  * Only Risk, Finance, and senior management roles may change the core/capital-impact flags.
* **ALERTS/METRICS:**
  * Alert if a capital-impacting vendor lacks a current contingency plan.
  * Metric: % of capital-impacting vendors with tested contingency plans in last 24 months.

***

#### VM-07 — Ongoing Monitoring, Performance & Risk Reporting

* **WHY (Reg cite):** Guidance requires ongoing monitoring of third parties, including performance against SLAs, compliance with laws, financial condition, and alignment with risk appetite, with periodic reporting to management and the Board. :contentReference\[oaicite:23]{index=23}
* **SYSTEM BEHAVIOR:**
  * For each vendor, define a monitoring plan proportionate to risk (e.g., SLAs, complaint patterns, incident history, audit reports, regulatory developments).
  * Collect and store periodic reports (e.g., SOC reports, performance metrics, penetration tests) and track follow-up actions.
  * Generate board/committee reporting summarizing status of High and Medium risk vendors.
* **TRIGGERS (human → event):**
  * Monitoring cycle due → `vendor.monitoring.due`
  * Monitoring tasks completed → `vendor.monitoring.completed`
  * Adverse news or financial deterioration detected → `vendor.adverse_event.detected`
* **INPUTS (human → field):**
  * Monitoring frequency → `vendor.monitoring.frequency`
  * Required artifacts (SOCs, audits, BCP tests) → `vendor.monitoring.artifacts_required[]`
  * SLA thresholds → `vendor.sla.thresholds[]`
  * Summary monitoring rating → `vendor.monitoring.rating`
* **OUTPUTS:**
  * Monitoring activity log per vendor.
  * Risk dashboard showing trends in vendor ratings and issues.
* **TIMERS/SLAs:**
  * Monitoring must be completed per schedule defined in `vendor.monitoring.frequency` (e.g., annual for High, biannual for Medium, every 3 years for Low).
  * High severity issues require documented remediation plan within 30 days.
* **EDGE CASES:**
  * New vendor with limited operating history: rely more on financial backing, references, and contractual protections; flag as requiring closer early-stage monitoring.
* **AUDIT LOGS:**
  * `vendor.monitoring.due`
  * `vendor.monitoring.completed`
  * `vendor.issue.remediation_plan.logged`
* **ACCESS CONTROL:**
  * Monitoring plans editable by Risk and business owners.
  * Read-only for executives and Internal Audit.
* **ALERTS/METRICS:**
  * Metric: % of High and Medium risk vendors with monitoring completed on time.
  * Alert when a vendor’s monitoring rating worsens by more than one notch.

***

#### VM-08 — Incident & Breach Reporting

* **WHY (Reg cite):** NCUA’s safeguarding and incident response guidance requires detecting, responding to, and notifying members and regulators of unauthorized access to member information; BSA rules require SARs for suspicious activity, including vendor-related events. :contentReference\[oaicite:24]{index=24}
* **SYSTEM BEHAVIOR:**
  * Require vendors to promptly notify \[ORGANIZATION] of any security breach, data loss, or incident that could affect members or operations, with specific timelines in contracts.
  * Maintain an internal incident intake and triage process for vendor-related incidents, integrating with security, privacy, legal, and BSA/AML teams.
  * Map incident handling to SAR, member notice, and regulator notice requirements where applicable.
* **TRIGGERS (human → event):**
  * Vendor reports incident → `vendor.incident.reported`
  * Internal detection of vendor-related issue → `vendor.incident.detected`
  * Member complaint suggesting vendor breach → `vendor.incident.member_signal`
* **INPUTS (human → field):**
  * Incident type and severity → `incident.type`, `incident.severity`
  * Data elements affected (NPI, credentials, etc.) → `incident.data_elements[]`
  * Jurisdictions impacted → `incident.jurisdictions[]`
  * SAR decision and rationale → `incident.sar.decision`, `incident.sar.rationale`
  * Member notification decision → `incident.member_notice.decision`
* **OUTPUTS:**
  * Incident records linked to vendor and affected systems.
  * SAR filings and member/regulator notifications where required.
* **TIMERS/SLAs:**
  * Vendor contractual SLA: initial notice to \[ORGANIZATION] within X hours (e.g., 24) of discovery.
  * Internal SLA: triage within 1 business day; SAR determination within regulatory timeframes.
* **EDGE CASES:**
  * Vendor is uncertain whether an incident qualifies as a breach: internal process errs on the side of thorough investigation and documentation.
* **AUDIT LOGS:**
  * `vendor.incident.reported`
  * `vendor.incident.triaged`
  * `vendor.incident.closed`
* **ACCESS CONTROL:**
  * Full incident details restricted to Security, Legal, Compliance, BSA/AML, and relevant executives.
  * Summary metadata (counts, severity) used for dashboards.
* **ALERTS/METRICS:**
  * Metric: number of vendor-related incidents per quarter by severity.
  * Alert for any critical incident at a core/capital-impacting vendor.

***

#### VM-09 — Termination & Exit Strategy

* **WHY (Reg cite):** Interagency guidance requires institutions to plan for and manage termination of third-party relationships, particularly critical ones, to avoid disruption and ensure protection of data and member interests. :contentReference\[oaicite:25]{index=25}
* **SYSTEM BEHAVIOR:**
  * For each critical or capital-impacting vendor, maintain an exit strategy including:
    * Identification of alternate providers or insourcing options.
    * Data migration and deletion plan.
    * Transition service expectations and timelines.
  * Require exit planning as part of the initial risk assessment and periodically update as the relationship evolves.
* **TRIGGERS (human → event):**
  * Exit planning started → `vendor.exit.plan_started`
  * Vendor termination decided → `vendor.exit.decision_recorded`
  * Exit completed → `vendor.exit.completed`
* **INPUTS (human → field):**
  * Exit plan summary → `vendor.exit.plan_summary`
  * Alternate providers identified → `vendor.exit.alternatives[]`
  * Data retention and destruction requirements → `vendor.exit.data_handling`
* **OUTPUTS:**
  * Exit plans attached to vendor records.
  * Post-mortem review document for significant exits.
* **TIMERS/SLAs:**
  * Exit plan must exist for all critical and capital-impacting vendors within 90 days of `vendor.onboarded`.
  * For planned exits, exit plan must be refreshed and approved before termination notice is sent.
* **EDGE CASES:**
  * Unexpected vendor failure: invoke contingency playbook and document deviations from the standard exit plan.
* **AUDIT LOGS:**
  * `vendor.exit.plan_approved`
  * `vendor.exit.completed`
  * `vendor.exit.post_mortem.completed`
* **ACCESS CONTROL:**
  * Exit plans editable by business owner, Risk, and Legal.
  * Read-only access for Internal Audit and senior management.
* **ALERTS/METRICS:**
  * Metric: % of critical / capital-impacting vendors with current exit plans.
  * Alert when a critical vendor has contract expiry within 6 months and no tested exit plan.

***

#### VM-10 — Key Third-Party Owners & RACI

* **WHY (Reg cite):** Guidance emphasizes documentation and reporting of third-party relationships, including assignment of internal accountability for oversight and performance. :contentReference\[oaicite:26]{index=26}
* **SYSTEM BEHAVIOR:**
  * Maintain and periodically publish a list of key third-party relationships (Critical and Material vendors), including:
    * Business owner.
    * Risk owner.
    * Compliance/BSA/AML owner (if applicable).
    * Technical owner.
  * Expose RACI (Responsible, Accountable, Consulted, Informed) for each key vendor.
* **TRIGGERS (human → event):**
  * Vendor classified as Critical or Material → `vendor.key_relationship.flagged`
  * Owner changed → `vendor.owner.changed`
* **INPUTS (human → field):**
  * Business owner → `vendor.owner.business`
  * Risk owner → `vendor.owner.risk`
  * Compliance/BSA owner → `vendor.owner.compliance`
  * Technical owner → `vendor.owner.technology`
* **OUTPUTS:**
  * “Key Third Parties” register with RACI table, exportable for Board and regulator reviews.
* **TIMERS/SLAs:**
  * Owner assignments must be completed before go-live for all Critical and Material vendors.
  * RACI reviewed at least annually.
* **EDGE CASES:**
  * If ownership is disputed, escalation to CRO or COO to resolve; system blocks contract execution until owner is assigned.
* **AUDIT LOGS:**
  * `vendor.owner.assigned`
  * `vendor.owner.changed`
* **ACCESS CONTROL:**
  * Only Governance or Vendor Risk admin roles may change RACI assignments.
* **ALERTS/METRICS:**
  * Alert when any Critical vendor lacks an assigned business or risk owner.
  * Metric: % of key vendors with complete RACI.

***

### EMBEDDED CHECKLISTS & TEMPLATES <a href="#checklists" id="checklists"></a>

The following checklists and templates will be maintained (outside this document) and referenced by control IDs:

* **VM-02 / Vendor Inventory Template**
  * Standard fields for `vendor.*` attributes, including risk and criticality flags, capital impact, BSA role, and NPI access.
* **VM-03 / Pre-Contract Risk Assessment Checklist**
  * Structured questionnaire covering strategic fit, risk domains, financial projections, capital and liquidity impacts, and RFP requirement/exception documentation.
* **VM-04 / Due Diligence & AML/KYC Checklist**
  * Baseline and EDD checklists, including BSA/AML RACI mapping, SOC reports, regulatory history, model risk documentation (if applicable), and consumer protection controls.
* **VM-05 / Contract Clause Library & Coverage Checklist**
  * Standard language for scope, SLAs, privacy and GLBA/Reg P, BSA/AML, data security, audit rights, BCP, incident reporting SLAs, termination, and exit assistance; coverage checklist stored as `contract.clauses[]`.
* **VM-07 / Ongoing Monitoring Plan Template**
  * Template for selecting monitoring frequency, required artifacts, key risk indicators, and reporting format for each vendor risk tier.
* **VM-08 / Vendor Incident Playbook**
  * Step-by-step guide mapping `vendor.incident.*` events to triage, escalation, SAR decision, and member/regulator notice requirements.
* **VM-09 / Exit Plan Template**
  * Template capturing alternate providers, migration steps, data handling, and communication plans for critical and capital-impacting vendors.
* **VM-10 / Key Third Parties RACI Register**
  * Standardized table defining vendor-to-owner mappings and use in Board reports.

***

### GOVERNANCE & SIGN-OFF <a href="#governance" id="governance"></a>

* **Policy Ownership**
  * The Chief Risk Officer owns this policy, is responsible for updates, and coordinates with the Chief Compliance/BSA Officer, CIO, and business leaders.
* **Approval & Review**
  * This policy must be:
    * Approved by the Board of Directors (or a designated committee) initially and at least annually.
    * Reviewed whenever there is material change in applicable guidance or in the third-party risk profile (e.g., significant expansion of fintech partnerships).
* **Related Policies / Cross-References**
  * Information Security / Cybersecurity Policy.
  * BSA/AML and Sanctions Compliance Program.
  * GLBA Privacy & Data Protection Policy.
  * Model Risk Management Policy (for vendors providing models or critical analytics).
  * Business Continuity and Disaster Recovery Policy.
* **Independent Review**
  * Internal Audit (or an independent third party) will review the effectiveness of the third-party risk management program at least every 24 months and report to the Board or appropriate committee, in line with [VM-01](outsourcing-and-vendor-management.md#vm-01-governance-accountability).
* **Non-Compliance**
  * Deviations from this policy require documented exceptions, approved by the policy owner and, for material deviations, by the Board or designated committee.
  * Persistent or material non-compliance may result in disciplinary action and remediation plans overseen by Risk and HR.

***

### ASSUMPTIONS & GAPS

* **Charter-Specific Reporting:** References to the Bank Service Company Act and related reporting expectations are included as best-practice direction; exact applicability for \[ORGANIZATION] depends on its charter type and primary regulator and must be confirmed by counsel. :contentReference\[oaicite:27]{index=27}
* **Effective / Review Dates & Titles:** Dates, titles, and some role names in the YAML front-matter are placeholders and must be aligned with \[ORGANIZATION]’s actual governance structure.
* **Capital-Impacting Definition:** “Capital-impacting” is defined operationally in this policy; Finance and Risk must confirm alignment with regulatory capital rules and internal economic capital frameworks.
