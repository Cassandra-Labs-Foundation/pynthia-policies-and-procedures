---
title: Third-Party Risk Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Third-Party Risk, Vendor Management, Outsourcing]
---

## General Policy Statement

Pynthia Credit Union uses third parties to deliver products and services, but the Board and management remain fully responsible for safety and soundness, BSA/AML, sanctions, consumer protection, privacy, and capital adequacy — outsourcing an activity never outsources the responsibility. This policy (merging the former Vendor Management and Outsourcing policies) governs the full third-party lifecycle — Planning → Due Diligence → Contracting → Ongoing Monitoring → Termination — with explicit criticality tiering and visibility into fourth-party subcontractors. It applies to all third parties receiving compensation or accessing nonpublic member or operational data, and is the minimum standard for governance, lifecycle controls, and engineering requirements. Vendor information-security controls, payment-processor BSA due diligence, record retention schedules, business continuity, privacy clauses, and enterprise risk appetite are governed by their respective policies (see [Governance & Sign-Off](#governance-sign-off)).

## Timing Matrix

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Policy and material-vendor re-approval | Annual governance cycle opens (`vendor.governance_review_due`) | Annually | Board/committee approval of policy and material vendors | [TP-01](#tp-01-governance-accountability) |
| Internal Audit program review | Audit cycle reaches third-party program (`vendor.program_audit_due`) | Every 24 months | Independent review of program effectiveness | [TP-01](#tp-01-governance-accountability) |
| Inventory reconciliation vs. AP/procurement | Quarter closes (`vendor.inventory_reconciliation_due`) | Quarterly | Inventory completeness against payments and procurement records | [TP-02](#tp-02-vendor-inventory-criticality-classification) |
| Pre-contract risk assessment (Medium/High) | Engagement proposed (`vendor.engagement_proposed`) | Before contract execution | Risk-proportionate assessment across all risk domains | [TP-03](#tp-03-risk-assessment-planning) |
| Emergency provisional engagement full review | Provisional engagement flagged (`vendor.provisional_engagement_created`) | 30 days | Full risk assessment and approval | [TP-03](#tp-03-risk-assessment-planning) |
| Due-diligence completion | Production data/NPI sharing requested (`vendor.data_sharing_requested`) | Before any production data or NPI is shared | Risk-proportionate due-diligence package | [TP-04](#tp-04-due-diligence-amlkyc-expectations) |
| EDD refresh for BSA/AML/KYC/sanctions vendors | EDD anniversary reached (`vendor.edd_refresh_due`) | Annually | Refreshed enhanced due-diligence package and BSA responsibility split | [TP-04](#tp-04-due-diligence-amlkyc-expectations) |
| Contract clause verification | Contract submitted for execution (`vendor.contract_submitted`) | Before execution | Standard clause library check; Legal/Risk sign-off for core/capital-impacting contracts | [TP-05](#tp-05-contract-standards-regulatory-clauses) |
| Clause library review | Library review anniversary (`vendor.clause_library_review_due`) | Annually | Updated standard clause library | [TP-05](#tp-05-contract-standards-regulatory-clauses) |
| Core/capital-impacting comprehensive review | Annual review anniversary (`vendor.core_review_due`) | Annually | Comprehensive review with board-level awareness | [TP-06](#tp-06-outsourcing-of-core-capital-impacting-functions) |
| Core exit/contingency plan test | Test anniversary (`vendor.exit_test_due`) | Every 24 months | Tested exit and contingency plan | [TP-06](#tp-06-outsourcing-of-core-capital-impacting-functions) |
| Ongoing monitoring review — High risk | Monitoring anniversary (`vendor.monitoring_review_due`) | Annually | SOC reports, metrics, pen-tests, performance review | [TP-07](#tp-07-ongoing-monitoring-performance-risk-reporting) |
| Ongoing monitoring review — Medium risk | Monitoring anniversary (`vendor.monitoring_review_due`) | Every 2 years | Updated risk assessment and due-diligence documents | [TP-07](#tp-07-ongoing-monitoring-performance-risk-reporting) |
| Ongoing monitoring review — Low risk | Monitoring anniversary (`vendor.monitoring_review_due`) | Every 3 years | Updated risk assessment | [TP-07](#tp-07-ongoing-monitoring-performance-risk-reporting) |
| High-severity issue remediation plan | Issue rated high severity (`vendor.issue_rated_high`) | 30 days | Vendor remediation plan accepted by Vendor Risk | [TP-07](#tp-07-ongoing-monitoring-performance-risk-reporting) |
| Vendor incident notification | Vendor discovers incident (`vendor.incident_reported`) | 24 hours of vendor discovery (contractual SLA) | Incident notice with scope, data affected, containment status | [TP-08](#tp-08-incident-breach-reporting) |
| Internal incident triage | Incident notice received (`vendor.incident_reported`) | 1 business day | Triage decision mapping to SAR, member-notice, and regulator-notice tracks | [TP-08](#tp-08-incident-breach-reporting) |
| Exit strategy for critical/capital-impacting vendors | Vendor onboarded (`vendor.onboarded`) | 90 days of onboarding | Exit strategy with alternates, data migration/deletion, transition timelines | [TP-09](#tp-09-termination-exit-strategy) |
| Exit strategy refresh before termination | Termination contemplated (`vendor.termination_initiated`) | Before any termination notice | Refreshed and approved exit strategy | [TP-09](#tp-09-termination-exit-strategy) |
| Owner/RACI assignment | Vendor approaches go-live (`vendor.golive_scheduled`) | Before go-live | Register entry with business, risk, compliance/BSA, and technical owners | [TP-10](#tp-10-key-third-party-owners-raci) |
| RACI register review | Register review anniversary (`vendor.raci_review_due`) | Annually | Confirmed owner assignments for Critical and Material vendors | [TP-10](#tp-10-key-third-party-owners-raci) |

## TP-01 — Governance & Accountability

**WHY (Reg cite):** The [Interagency Guidance on Third-Party Relationships: Risk Management (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) holds the Board and management accountable for oversight of third-party relationships, and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires a Board-approved security program whose obligations extend to vendor arrangements.

**SYSTEM BEHAVIOR:** The institution maintains an authoritative vendor-governance configuration mapping the Board, committees, and management roles to specific third-party responsibilities. The Board (or designated committee) approves this policy and each material vendor before engagement, and re-approves both at least annually. Internal Audit reviews the third-party risk program at least every 24 months and reports findings, with management responses, to the Board or its designated committee. Governance is centralized with the Chief Compliance Officer; the Vendor Risk team, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit are required participants. The governance configuration is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual governance cycle opens (`vendor.governance_review_due`) | Current policy version (`policy.version`), material-vendor list (`vendor.materiality_flag`), governance configuration (`vendor.governance_map`) | Board approval record for policy and material vendors (`vendor.board_approval_recorded`) | Annually (enforced by `vendor.governance_review_due`) |
| Audit cycle reaches the third-party program (`vendor.program_audit_due`) | Program documentation (`vendor.program_docs[]`), prior findings (`vendor.audit_findings[]`) | Internal Audit report with management responses, delivered to Board (`vendor.program_audit_completed`) | Every 24 months (enforced by `vendor.program_audit_due`) |
| Governance configuration changed (`vendor.governance_map_updated`) | Proposed role/responsibility change (`vendor.governance_map`), approver identity (`user.id`) | Versioned governance configuration with approval trail (`vendor.governance_map_approved`) | — |

**ALERTS/METRICS:** Alert when annual re-approval or the 24-month audit is within 60 days of due or overdue (target zero overdue); count of material vendors operating without current Board approval (target zero).

## TP-02 — Vendor Inventory & Criticality Classification

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) expects risk management proportionate to a complete view of third-party relationships, and [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires safeguarding member information wherever it resides — which demands knowing every vendor that holds or touches it.

**SYSTEM BEHAVIOR:** A centralized inventory records every third party that receives compensation or accesses nonpublic member or operational data. Each entry carries an inherent-risk rating and a criticality tier — Critical, Material, Minor, or Exempt — plus flags for core/capital-impacting functions, BSA/AML roles, NPI access, and network connectivity, and identifies known fourth-party subcontractors. A vendor must be added to the inventory before contract execution; the system blocks contract workflows for vendors not yet inventoried. The inventory is reconciled against AP and procurement records at least quarterly to catch unregistered vendors. Inventory classification fields are write-restricted to the Vendor Risk team.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New third party identified (`vendor.identified`) | Vendor identity (`vendor.legal_name`), service description (`vendor.service_description`), compensation/data-access indicators (`vendor.compensation_flag`, `vendor.npi_access_flag`, `vendor.network_access_flag`) | Inventory record with criticality tier and risk flags (`vendor.inventory_created`) | Before contract execution |
| Classification assigned or changed (`vendor.classification_updated`) | Inherent-risk rating (`vendor.inherent_risk`), criticality tier (`vendor.criticality_tier`), core/BSA flags (`vendor.core_function_flag`, `vendor.bsa_role_flag`), known subcontractors (`vendor.fourth_parties[]`) | Versioned classification with rationale (`vendor.classification_recorded`) | — |
| Quarter closes (`vendor.inventory_reconciliation_due`) | AP payment records (`ap.vendor_payments[]`), procurement contracts (`procurement.contracts[]`), current inventory (`vendor.inventory[]`) | Reconciliation report listing unregistered vendors and resolution actions (`vendor.reconciliation_completed`) | Quarterly (enforced by `vendor.inventory_reconciliation_due`) |

**ALERTS/METRICS:** Count of vendors found in AP/procurement but absent from the inventory per quarterly reconciliation (target zero); percentage of inventory entries with complete classification and fourth-party data; aging alert on reconciliations overdue.

## TP-03 — Risk Assessment & Planning

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires planning and risk assessment before entering a third-party relationship, and [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867) extends examination authority over performed services where applicable.

**SYSTEM BEHAVIOR:** Before contract execution, every Medium or High inherent-risk vendor requires a completed and approved risk assessment proportionate to the relationship, covering strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity dimensions. The assessment documents how the relationship fits the strategic plan and whether internal capability exists to manage it. Emergency provisional engagements may proceed without the full assessment only when flagged as provisional, and must receive the full assessment and approval within 30 days or be suspended. Low-risk and Exempt vendors require only the inventory classification rationale. Assessment approval is restricted to the Vendor Risk team, with CCO sign-off required for High-risk vendors.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Engagement proposed for Medium/High vendor (`vendor.engagement_proposed`) | Inventory record (`vendor.inventory_id`), risk-domain inputs (`vendor.risk_assessment_inputs[]`: strategic, financial, operational, compliance, BSA/AML, reputation, cyber, capital/liquidity), business case (`vendor.business_case`) | Approved risk assessment (`vendor.risk_assessment_approved`) | Before contract execution |
| Emergency provisional engagement created (`vendor.provisional_engagement_created`) | Provisional justification (`vendor.provisional_justification`), approving officer (`user.id`) | Provisional flag with review deadline (`vendor.provisional_flagged`) | — |
| Provisional review deadline reached (`vendor.provisional_review_due`) | Full risk-assessment package (`vendor.risk_assessment_inputs[]`) | Full assessment approval or engagement suspension (`vendor.provisional_resolved`) | 30 days from provisional creation (enforced by `vendor.provisional_review_due`) |

**ALERTS/METRICS:** Count of contracts executed without an approved assessment (target zero); count of provisional engagements open past 30 days (target zero); median assessment cycle time by risk tier.

## TP-04 — Due Diligence & AML/KYC Expectations

**WHY (Reg cite):** [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/section-1020.220) keeps CIP obligations with the institution even when a third party performs onboarding, and the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2) require due diligence proportionate to the risk the vendor presents.

**SYSTEM BEHAVIOR:** Every vendor requires a due-diligence package proportional to its risk tier — covering business reputation and references, financial condition, licensing, internal controls (SOC reports where available), and consumer-protection compliance. Any vendor performing onboarding, KYC, AML, sanctions screening, or transaction monitoring requires enhanced due diligence, including a documented BSA/AML responsibility split between the institution and the vendor approved by the BSA Officer. Due diligence must be complete before any production data or NPI is shared with the vendor; the system blocks data-sharing provisioning until the package is approved. EDD packages for BSA-role vendors are refreshed at least annually. Detailed payment-processor BSA due diligence is governed by the BSA Policy. EDD approval is write-restricted to Compliance/BSA.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Due diligence initiated (`vendor.due_diligence_initiated`) | Risk tier (`vendor.inherent_risk`), diligence artifacts (`vendor.dd_artifacts[]`: financials, SOC reports, licenses, references, policies) | Approved due-diligence package (`vendor.due_diligence_approved`) | Before any production data or NPI is shared |
| BSA-role vendor identified (`vendor.bsa_role_flagged`) | BSA function scope (`vendor.bsa_function_scope`), proposed responsibility split (`vendor.bsa_responsibility_split`) | EDD package with BSA Officer-approved responsibility split (`vendor.edd_approved`) | Before any production data or NPI is shared |
| Production data sharing requested (`vendor.data_sharing_requested`) | Due-diligence approval status (`vendor.due_diligence_approved`), data scope (`vendor.data_scope`) | Data-sharing authorization or block decision (`vendor.data_sharing_authorized`) | — |
| EDD refresh anniversary reached (`vendor.edd_refresh_due`) | Updated diligence artifacts (`vendor.dd_artifacts[]`), current responsibility split (`vendor.bsa_responsibility_split`) | Refreshed EDD approval (`vendor.edd_refreshed`) | Annually (enforced by `vendor.edd_refresh_due`) |

**ALERTS/METRICS:** Count of vendors holding NPI or production data without an approved diligence package (target zero); count of BSA-role vendors with EDD refresh overdue (target zero); diligence package aging distribution by tier.

## TP-05 — Contract Standards & Regulatory Clauses

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) expects contracts to address responsibilities, performance, audit rights, and termination; [GLBA/Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) and [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) require contractual safeguarding of member information.

**SYSTEM BEHAVIOR:** All third-party agreements must be in writing and drawn from a standard clause library covering: scope and SLAs, party responsibilities including subcontractor oversight, GLBA/Reg P data security and confidentiality, BSA/AML and sanctions compliance, audit and examination rights, BCP/DR obligations, and termination with exit assistance. Every required clause is checked complete before execution; contracts for core or capital-impacting functions additionally require Legal and Risk sign-off. Departures from the library are recorded in an exceptions log with approver and rationale, and the library itself is reviewed at least annually. Privacy-specific clause content and NPPI sharing limits follow the Privacy Policy. The clause library and exceptions log are write-restricted to Legal and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Contract submitted for execution (`vendor.contract_submitted`) | Draft contract (`vendor.contract_draft`), clause checklist (`vendor.clause_checklist[]`), risk flags (`vendor.core_function_flag`, `vendor.npi_access_flag`) | Clause verification result, plus Legal/Risk sign-off for core/capital-impacting contracts (`vendor.contract_clauses_verified`) | Before execution |
| Clause exception requested (`vendor.clause_exception_requested`) | Departed clause (`vendor.clause_id`), rationale (`vendor.exception_rationale`), approver (`user.id`) | Exceptions-log entry (`vendor.clause_exception_logged`) | Before execution |
| Library review anniversary (`vendor.clause_library_review_due`) | Current library (`vendor.clause_library_version`), regulatory-change inputs (`compliance.reg_change_items[]`) | Updated, approved clause library (`vendor.clause_library_updated`) | Annually (enforced by `vendor.clause_library_review_due`) |

**ALERTS/METRICS:** Count of executed contracts with unresolved clause-checklist items (target zero); exceptions-log volume and aging by clause type; days since last library review.

## TP-06 — Outsourcing of Core & Capital-Impacting Functions

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) calls for the most rigorous oversight of relationships supporting critical activities, and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and [31 CFR Chapter X](https://www.ecfr.gov/current/title-31/chapter-X) keep security-program and BSA/AML responsibility with the credit union regardless of who operates the function.

**SYSTEM BEHAVIOR:** Vendors operating core or ledger systems, card systems, settlement or funding flows, or critical BSA/AML processes are tagged mandatory High inherent risk — the tier cannot be lowered for these functions. Each requires an annual comprehensive review, board-level awareness through the [TP-01](#tp-01-governance-accountability) reporting cycle, and an enhanced exit and contingency plan tested at least every 24 months. Operational continuity detail lives in the Business Continuity Plan; this control owns the vendor-facing tagging, review cadence, and test evidence. The core-function tag is write-restricted to the Vendor Risk team with CCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Core/capital-impacting function identified (`vendor.core_function_flagged`) | Function description (`vendor.core_function_scope`), inventory record (`vendor.inventory_id`) | Mandatory High tag with board notification (`vendor.core_tag_applied`) | Before contract execution |
| Annual review anniversary (`vendor.core_review_due`) | Performance data (`vendor.performance_metrics[]`), SOC reports (`vendor.dd_artifacts[]`), financial condition (`vendor.financial_review`) | Comprehensive review report to Board (`vendor.core_review_completed`) | Annually (enforced by `vendor.core_review_due`) |
| Exit/contingency test anniversary (`vendor.exit_test_due`) | Current exit plan (`vendor.exit_plan_id`), test scenario (`vendor.exit_test_scenario`) | Test results with remediation items (`vendor.exit_test_completed`) | Every 24 months (enforced by `vendor.exit_test_due`) |

**ALERTS/METRICS:** Count of core-function vendors with overdue annual reviews or exit tests (target zero); count of core functions lacking a tested contingency plan; remediation-item closure rate from exit tests.

## TP-07 — Ongoing Monitoring, Performance & Risk Reporting

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires ongoing monitoring commensurate with risk throughout the relationship, and [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires oversight of service providers safeguarding member information.

**SYSTEM BEHAVIOR:** Each vendor carries a risk-proportionate monitoring plan: High-risk vendors are reviewed annually, Medium every 2 years, Low every 3 years. Reviews collect SOC reports, performance metrics against SLAs, penetration-test results where applicable, financial condition, and adverse news. Issues rated high severity require a vendor remediation plan accepted within 30 days; failure to remediate escalates to the CCO and may trigger exit planning under [TP-09](#tp-09-termination-exit-strategy). The status of all High and Medium vendors is reported to the Board (or designated committee) at least annually. Monitoring review records are write-restricted to the Vendor Risk team.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring anniversary reached (`vendor.monitoring_review_due`) | Risk tier (`vendor.inherent_risk`), SOC reports/metrics/pen-tests (`vendor.monitoring_artifacts[]`), SLA performance (`vendor.performance_metrics[]`) | Completed monitoring review with residual-risk rating (`vendor.monitoring_review_completed`) | Annual (High) / 2 years (Medium) / 3 years (Low) (enforced by `vendor.monitoring_review_due`) |
| Issue rated high severity (`vendor.issue_rated_high`) | Issue description (`vendor.issue_detail`), severity rating (`vendor.issue_severity`) | Accepted vendor remediation plan (`vendor.remediation_plan_accepted`) | 30 days (enforced by `vendor.remediation_due`) |
| Board reporting cycle opens (`vendor.board_report_due`) | High/Medium vendor statuses (`vendor.monitoring_review_completed`), open issues (`vendor.issue_detail`) | Board risk report on High/Medium vendors (`vendor.board_report_delivered`) | Annually (enforced by `vendor.board_report_due`) |

**ALERTS/METRICS:** Aging alert on monitoring reviews approaching or past due by tier (target zero overdue); count of high-severity issues without an accepted remediation plan at 30 days (target zero); SLA breach rate per vendor.

## TP-08 — Incident & Breach Reporting

**WHY (Reg cite):** [12 CFR Part 748, Appendices A & B](https://www.ecfr.gov/current/title-12/part-748) set incident-response, member-notice, and regulator-notice expectations for unauthorized access to member information, and the SAR rules in [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/section-1020.320) and [12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1) govern suspicious-activity reporting that vendor incidents may trigger.

**SYSTEM BEHAVIOR:** Vendor contracts require notification of security incidents within a contractual SLA — the standard is 24 hours of the vendor's discovery. On receipt, the institution triages internally within 1 business day, classifying the incident and mapping handling to three downstream tracks as applicable: SAR filing under BSA rules, member notification under Part 748 Appendix B, and regulator notification. Incidents involving member NPI automatically open the Part 748 Appendix B analysis. Detailed incident-response procedures live in the Information Security Policy; this control owns vendor notification SLAs and triage routing. Incident triage decisions are write-restricted to Information Security and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor reports an incident (`vendor.incident_reported`) | Incident scope (`vendor.incident_scope`), data affected (`vendor.incident_data_classes[]`), containment status (`vendor.incident_containment_status`) | Logged incident record (`vendor.incident_logged`) | Vendor must notify within 24 hours of discovery (contractual SLA) |
| Incident notice received (`vendor.incident_reported`) | Incident record (`vendor.incident_logged`), NPI involvement (`vendor.npi_access_flag`), member impact estimate (`vendor.incident_member_count`) | Triage decision with SAR / member-notice / regulator-notice track assignments (`vendor.incident_triaged`) | 1 business day (enforced by `vendor.incident_triage_due`) |
| Triage assigns a notification track (`vendor.incident_triaged`) | Track assignments (`vendor.incident_tracks[]`), regulatory deadlines per track (`compliance.notice_deadlines[]`) | Track handoffs to BSA (SAR), Member Services (member notice), and Compliance (regulator notice) (`vendor.incident_tracks_dispatched`) | Per track: SAR within 30 days of detection; member/regulator notice as soon as possible per Part 748 App. B |

**ALERTS/METRICS:** Time-to-notify distribution versus the 24-hour SLA per vendor; count of incidents not triaged within 1 business day (target zero); count of open notification tracks past their regulatory deadline (target zero).

## TP-09 — Termination & Exit Strategy

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) treats termination as a lifecycle stage requiring planned transition, and GLBA safeguarding under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires member information to remain protected through and after transition.

**SYSTEM BEHAVIOR:** Every Critical and capital-impacting vendor must have a documented exit strategy — identified alternates, data migration and deletion plans, and transition timelines — within 90 days of onboarding. Before any termination notice is issued, the exit strategy is refreshed and approved so the transition reflects current data flows and dependencies. Data deletion is verified with vendor attestation at exit; retention obligations follow the Record Retention Policy. Exit-strategy approval is restricted to the Vendor Risk team, with CCO sign-off required for Critical vendors.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical/capital-impacting vendor onboarded (`vendor.onboarded`) | Service dependencies (`vendor.dependency_map`), data locations (`vendor.data_scope`), candidate alternates (`vendor.alternate_candidates[]`) | Approved exit strategy (`vendor.exit_plan_approved`) | 90 days of onboarding (enforced by `vendor.exit_plan_due`) |
| Termination contemplated (`vendor.termination_initiated`) | Current exit plan (`vendor.exit_plan_id`), updated dependencies (`vendor.dependency_map`) | Refreshed, approved exit strategy (`vendor.exit_plan_refreshed`) | Before any termination notice |
| Exit executed (`vendor.exit_executed`) | Migration completion evidence (`vendor.migration_evidence`), deletion attestation (`vendor.data_deletion_attestation`) | Exit completion record with deletion verification (`vendor.exit_completed`) | Per exit-plan transition timeline |

**ALERTS/METRICS:** Count of Critical/capital-impacting vendors past 90 days without an approved exit plan (target zero); count of terminations issued without a refreshed plan (target zero); exit-plan staleness distribution.

## TP-10 — Key Third-Party Owners & RACI

**WHY (Reg cite):** The [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires clear roles and responsibilities across the third-party lifecycle — oversight fails without named, accountable owners.

**SYSTEM BEHAVIOR:** A published register lists every Critical and Material relationship with four assigned owners: business, risk, compliance/BSA, and technical. Ownership must be complete before the vendor goes live, and the system blocks contract execution where ownership is unresolved. The register is reviewed at least annually, and owner departures trigger reassignment within the review workflow. Owner assignments are write-restricted to the Vendor Risk team with business-unit confirmation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical/Material vendor approaches go-live (`vendor.golive_scheduled`) | Candidate owners (`vendor.owner_candidates[]`: business, risk, compliance/BSA, technical), inventory record (`vendor.inventory_id`) | Register entry with four confirmed owners (`vendor.raci_assigned`) | Before go-live |
| Contract execution attempted with unresolved ownership (`vendor.contract_submitted`) | Register status (`vendor.raci_assigned`) | Execution block with unresolved-owner reason (`vendor.contract_blocked_raci`) | — |
| Register review anniversary (`vendor.raci_review_due`) | Current register (`vendor.raci_register[]`), HR status of owners (`user.employment_status`) | Confirmed or reassigned ownership records (`vendor.raci_review_completed`) | Annually (enforced by `vendor.raci_review_due`) |

**ALERTS/METRICS:** Count of live Critical/Material vendors with any vacant owner role (target zero); count of contract-execution blocks for unresolved ownership; days-vacant distribution after an owner departs.

## Governance & Sign-Off

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy maintenance, control operation, and Board reporting.
- **Approvers:** Patrick Wilson, Chief Compliance Officer; Board (or designated committee) approval required per [TP-01](#tp-01-governance-accountability), with annual re-approval.
- **Review cadence:** Policy reviewed and re-approved at least annually (next review 2027-06-04); Internal Audit reviews the program at least every 24 months.
- **Required participants:** Vendor Risk team, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit.
- **Cross-references (out of scope here):** Vendor information-security and data-protection control requirements — Information Security Policy. BSA/AML due diligence on payment processors and the broader BSA program — BSA Policy. Vendor record retention and destruction schedules — Record Retention Policy. Vendor contingency planning and operational continuity — Business Continuity Plan. Privacy-specific contractual clauses and NPPI sharing limits — Privacy Policy. Material outsourcing implications for enterprise risk appetite — Enterprise Risk Management Policy.

## Assumptions & Gaps

- **Engineering vocabulary is provisional.** The vendor-management resources, fields, and events referenced throughout this document (the `vendor.*`, `ap.*`, `procurement.*`, `policy.*`, and `compliance.*` codes in the EVENTS tables) are not yet registered in `vocabulary.json` — the parsed spec is banking-core only (accounts, transfers, verifications; zero events registered). Names used are the target naming scheme and will be confirmed by engineering before the next review.
- **Bank Service Company Act applicability.** [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867) notification and examination provisions are cited "where applicable"; whether they bind Pynthia depends on charter and primary regulator. Treated here as a planning consideration only — Legal to confirm whether any service-contract notification duty applies under NCUA supervision.
- **Material-vendor threshold.** Board approval is required for "material vendors," but no dollar or criticality threshold is defined. This policy treats Critical-tier vendors and any core/capital-impacting vendor as material; the Board should confirm or adjust the threshold.
- **Incident notification SLA.** The 24-hour vendor notification window was stated as an example ("e.g., 24 hours of discovery") and is adopted as the contractual standard here; legacy contracts may carry longer SLAs and should be remediated at renewal.
- **Criticality tier definitions.** The Critical/Material/Minor/Exempt definitions are adapted from the reference vendor-management templates; Vendor Risk should ratify the precise classification criteria (financial-impact thresholds, substitutability tests) in the supporting procedure.
- **Monitoring cadence for Critical tier.** Monitoring cadence is defined by inherent risk (High/Medium/Low). Critical-tier vendors are assumed to always carry High inherent risk and therefore annual monitoring; confirm no Critical vendor is intended to sit below High.
- **Provisional-engagement authority.** The officer level authorized to create an emergency provisional engagement under [TP-03](#tp-03-risk-assessment-planning) is not specified; assumed to require CCO or delegate approval pending confirmation.
- **RFP requirements.** The reference policies require RFPs for significant projects; the current direction is silent. RFP/competitive-bid expectations are left to Procurement procedure rather than mandated here — confirm whether a policy-level RFP requirement is wanted.
