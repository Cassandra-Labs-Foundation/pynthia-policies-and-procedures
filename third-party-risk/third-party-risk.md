---
title: Third-Party Risk Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Third-Party Risk, Vendor Management, Outsourcing, BSA/AML, GLBA]
---

## General Policy Statement

Pynthia Credit Union uses third parties to deliver products and services, but the Board and management remain fully responsible for safety and soundness, BSA/AML, sanctions, consumer protection, privacy, and capital adequacy — outsourcing the activity never outsources the responsibility. This policy (merging the former Vendor Management and Outsourcing policies) governs the full third-party lifecycle (Planning → Due Diligence → Contracting → Ongoing Monitoring → Termination) with explicit criticality tiering and fourth-party visibility, and applies to all third parties receiving compensation or accessing nonpublic member or operational data. It is the minimum standard for governance, lifecycle controls, and engineering requirements; vendor information security, BSA/AML payment-processor diligence, record retention, contingency planning, privacy clauses, and ERM appetite are governed by their respective policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Emergency/provisional engagement entered without full review | Provisional vendor flagged (`vendor.provisional_flagged`) | 30 days to full review | Full risk assessment package | [TPR-03](#tpr-03-risk-assessment-planning) |
| EDD vendor (onboarding/KYC/AML/sanctions) onboarded | EDD approved (`vendor.edd_approved`) | Annual EDD refresh | EDD refresh file | [TPR-04](#tpr-04-due-diligence-amlkyc) |
| Vendor reports a security incident | Vendor breach notified (`vendor.breach_notified`) | 24h contractual notify; triage 1 BD | Internal triage + Part 748 mapping | [TPR-08](#tpr-08-incident-breach-reporting) |
| Reportable member-data incident determined | NCUA notice determined (`incident.ncua_notified`) | Per Part 748 App. B | NCUA + member notice | [TPR-08](#tpr-08-incident-breach-reporting) |
| Critical/capital-impacting vendor onboarded | Critical vendor onboarded (`vendor.critical_alert`) | Exit plan within 90 days | Exit strategy package | [TPR-09](#tpr-09-termination-exit-strategy) |
| High-severity monitoring issue identified | High issue rated (`vendor.mi_breach_detected`) | Remediation plan within 30 days | Remediation plan | [TPR-07](#tpr-07-ongoing-monitoring-reporting) |
| Vendor inventory drift vs. AP/procurement | Quarter close (`vendor.reconciliation_completed`) | Quarterly | Inventory reconciliation | [TPR-02](#tpr-02-vendor-inventory-criticality) |
| Core/capital-impacting exit test due | Exit test scheduled (`vendor.exit_test_completed`) | Every 24 months | Tested contingency plan | [TPR-06](#tpr-06-core-capital-functions) |

## TPR-01 — Governance & Accountability  {#tpr-01-governance-accountability}

**WHY (Reg cite):** The Board and committees must own a risk-based third-party program with periodic independent review under the [Interagency Guidance on Third-Party Relationships (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and the security-program/oversight obligations of [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system maintains an authoritative vendor-governance configuration mapping Board, committees, and management roles to third-party responsibilities, and routes the policy and all material vendors for Board/committee approval before activation, with re-approval at least annually. Internal Audit reviews the program at least every 24 months; if the audit cycle lapses, an aging alert fires. The governance map and BSA-officer designation are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Governance map drafted or amended (`vendor.governance_map_updated`) | Role-to-responsibility map (`vendor.governance_map`), BSA officer id (`governance.bsa_officer_id`), authority statement (`governance.authority_statement`) | Updated governance map + emitted (`vendor.governance_map_approved`) | At onboarding; annual re-approval (enforced by `vendor.governance_review_due`) |
| Board/committee reviews program or material vendor (`vendor.board_approval_recorded`) | Board package (`vendor.board_report_due`), resolution id (`board.resolution_id`) | Board approval record + emitted (`vendor.board_report_delivered`) | Annual (enforced by `vendor.board_report_due`) |
| Internal Audit program review cycle opens (`vendor.program_audit_completed`) | Audit plan (`audit.annual_plan_id`), prior findings (`finding.open_report`) | Program audit report + emitted (`vendor.program_audit_completed`) | ≤24 months (enforced by `vendor.program_audit_due`) |

**ALERTS/METRICS:** Alert when annual re-approval or the 24-month audit window ages past due; target zero overdue governance reviews and zero unmapped Critical/Material roles.

## TPR-02 — Vendor Inventory & Criticality Classification  {#tpr-02-vendor-inventory-criticality}

**WHY (Reg cite):** A complete inventory with risk/criticality classification is the foundation of the lifecycle under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), and safeguarding of member information requires knowing which vendors touch NPI under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system maintains a centralized inventory of all third parties receiving compensation or accessing data, classifies each by inherent risk and criticality (Critical/Material/Minor/Exempt), and flags core/capital-impacting/BSA roles plus NPI and network access. A vendor must be added to the inventory before contract execution; vendors flagged Exempt require no further diligence but remain on the inventory. The inventory reconciles against AP/procurement at least quarterly, and unmatched entries open a reconciliation task. Criticality tier and flags are write-restricted to Vendor Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor identified before contracting (`vendor.inventory_created`) | Legal name (`vendor.legal_name`), service description (`vendor.service_description`), compensation flag (`vendor.compensation_flag`), data scope (`vendor.data_scope`) | Inventory record + emitted (`vendor.inventory_created`) | Before contract execution |
| Inherent-risk/criticality scored (`vendor.classification_recorded`) | Criticality tier (`vendor.criticality_tier`), core flag (`vendor.core_function_flag`), NPI flag (`vendor.npi_access_flag`), network flag (`vendor.network_access_flag`), BSA flag (`vendor.bsa_role_flag`) | Classification record + emitted (`vendor.classification_recorded`) | Before contract execution |
| Quarterly AP/procurement reconciliation runs (`vendor.reconciliation_completed`) | Inventory id (`vendor.inventory_id`), procurement feed (`vendor.dependency_map`) | Reconciliation record + emitted (`vendor.reconciliation_completed`) | Quarterly (enforced by `vendor.inventory_reconciliation_due`) |

**ALERTS/METRICS:** Alert on any contract execution with no inventory record and on reconciliation breaks vs. AP; track count of unclassified vendors (target zero) and NPI/network-flagged vendor population.

## TPR-03 — Risk Assessment & Planning  {#tpr-03-risk-assessment-planning}

**WHY (Reg cite):** A pre-contract, risk-proportionate assessment across strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity dimensions is required by the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management); examination authority over service providers is grounded in [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867).

**SYSTEM BEHAVIOR:** The system requires a completed and approved risk assessment before execution for Medium/High-risk vendors, covering strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity risk. Emergency provisional engagements may proceed when flagged, but the system schedules a full review within 30 days of the provisional flag; failure to complete the full review on time escalates. Risk scores and provisional justifications are write-restricted to Vendor Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk assessment opened for a candidate vendor (`vendor.risk_assessment_approved`) | Candidate profile (`risk.candidate_profile`), inherent score (`risk.inherent_score`), partner dependency (`risk.partner_dependency`), geography factors (`risk.geography_factors`) | Approved assessment + emitted (`vendor.risk_assessment_approved`) | Before execution for Medium/High |
| Emergency provisional engagement created (`vendor.provisional_engagement_created`) | Provisional justification (`vendor.provisional_justification`), data scope (`vendor.data_scope`) | Provisional engagement record + emitted (`vendor.provisional_flagged`) | Flagged at engagement |
| Provisional full-review window matures (`vendor.provisional_resolved`) | Provisional review id (`vendor.provisional_review_due`), full assessment (`risk.assessment_results`) | Full-review disposition + emitted (`vendor.provisional_resolved`) | 30 days (enforced by `vendor.provisional_review_due`) |

**ALERTS/METRICS:** Alert when a provisional engagement nears or passes the 30-day review deadline; target zero Medium/High contracts executed without an approved assessment.

## TPR-04 — Due Diligence & AML/KYC Expectations  {#tpr-04-due-diligence-amlkyc}

**WHY (Reg cite):** Due diligence proportional to risk — with enhanced diligence and a documented BSA/AML responsibility split for onboarding/KYC/AML/sanctions vendors — is required under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and the BSA/AML program/CIP obligations at [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/section-1020.220), with safeguarding under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system requires a due-diligence package proportional to risk and blocks the sharing of any production data or NPI until diligence is complete. Any vendor performing onboarding, KYC, AML, sanctions, or transaction monitoring is flagged for enhanced due diligence, including a documented BSA/AML responsibility split; EDD refreshes at least annually and aging EDD escalates. Data-sharing authorization and EDD approval are write-restricted to Compliance and BSA.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Due diligence initiated for a contracting vendor (`vendor.due_diligence_initiated`) | Due-diligence artifact (`vendor.due_diligence_artifact_id`), SOC report (`vendor.soc_report`), financial review (`vendor.financial_review`) | DD package + emitted (`vendor.due_diligence_approved`) | Before any NPI/production data shared |
| BSA/AML/KYC/sanctions vendor identified (`vendor.bsa_role_flagged`) | BSA function scope (`vendor.bsa_function_scope`), responsibility split (`vendor.bsa_responsibility_split`) | EDD file + emitted (`vendor.edd_approved`) | Before data sharing |
| Production data/NPI sharing requested (`vendor.data_sharing_requested`) | Data map (`vendor.data_map_id`), NPI flag (`vendor.npi_access_flag`) | Sharing authorization + emitted (`vendor.data_sharing_authorized`) | Gated on DD completion |
| Annual EDD refresh window matures (`vendor.edd_refresh_due`) | EDD refresh file (`vendor.edd_refreshed`) | EDD refresh record + emitted (`vendor.edd_approved`) | Annual (enforced by `vendor.edd_refresh_due`) |

**ALERTS/METRICS:** Alert on any data-sharing request not gated by completed diligence and on EDD aging past the annual window; target zero NPI grants before diligence completion.

## TPR-05 — Contract Standards & Regulatory Clauses  {#tpr-05-contract-standards-clauses}

**WHY (Reg cite):** Contracts must carry required clauses — scope/SLAs, party/subcontractor responsibilities, data security, BSA/AML and sanctions, audit and examination rights, BCP/DR, termination and exit assistance — per the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), GLBA data-security under [12 CFR Part 1016 (Reg P)](https://www.ecfr.gov/current/title-12/part-1016) and safeguarding under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system enforces a standard clause library and verifies that all required clauses (scope/SLAs, responsibilities and subcontractor oversight, GLBA/Reg P data security, BSA/AML and sanctions, audit/exam rights, BCP/DR, termination and exit assistance) are present before execution. Capital-impacting/core contracts require Legal and Risk sign-off; any missing or modified clause must be entered in an exceptions log with rationale before execution. The clause library is reviewed at least annually. The clause library and exceptions log are write-restricted to Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Contract submitted for execution (`vendor.contract_submitted`) | Contract draft (`vendor.contract_draft`), clause library version (`vendor.clause_library_version`), GLBA addendum (`vendor.glba_addendum_id`) | Clause verification result + emitted (`vendor.contract_clauses_verified`) | Before execution |
| Required clause missing/modified (`vendor.clause_exception_requested`) | Clause id (`vendor.clause_id`), exception rationale (`vendor.exception_rationale`) | Exceptions-log entry + emitted (`vendor.clause_exception_logged`) | Before execution |
| Clause library annual review opens (`vendor.clause_library_updated`) | Library version (`vendor.clause_library_version`) | Updated clause library + emitted (`vendor.clause_library_updated`) | Annual (enforced by `vendor.clause_library_review_due`) |

**ALERTS/METRICS:** Alert on execution attempts with unverified clauses and on clause-library review aging; track open clause exceptions by severity (target zero unresolved on core contracts).

## TPR-06 — Outsourcing of Core & Capital-Impacting Functions  {#tpr-06-core-capital-functions}

**WHY (Reg cite):** Vendors running core/ledger/card, settlement/funding, or critical BSA/AML processes carry heightened safety-and-soundness risk and require enhanced oversight and tested contingency planning under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system tags vendors operating core/ledger/card systems, settlement/funding flows, or critical BSA/AML processes as mandatory High inherent risk, which forces an annual comprehensive review, board-level awareness, and enhanced exit/contingency planning. Contingency/exit arrangements for these vendors are tested at least every 24 months, with failed tests opening remediation. The core-function tag is write-restricted to Vendor Risk and cannot be downgraded below High without documented Risk approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Core/capital-impacting function detected (`vendor.core_function_flagged`) | Core function scope (`vendor.core_function_scope`), criticality tier (`vendor.criticality_tier`) | High-risk core tag + emitted (`vendor.core_tag_applied`) | At classification |
| Annual comprehensive core review opens (`vendor.core_review_completed`) | Core review id (`vendor.core_review_due`), MI pack (`vendor.mi_pack`) | Comprehensive review record + emitted (`vendor.core_review_completed`) | Annual (enforced by `vendor.core_review_due`) |
| Exit/contingency test cycle matures (`vendor.exit_test_completed`) | Exit test scenario (`vendor.exit_test_scenario`), failover criteria (`vendor.failover_criteria`) | Tested contingency record + emitted (`vendor.exit_test_completed`) | ≤24 months (enforced by `vendor.exit_test_due`) |

**ALERTS/METRICS:** Alert when a core vendor's annual review or 24-month exit test ages past due; target zero core vendors without board-level awareness or a current tested contingency plan.

## TPR-07 — Ongoing Monitoring, Performance & Risk Reporting  {#tpr-07-ongoing-monitoring-reporting}

**WHY (Reg cite):** Sound risk management requires risk-proportionate ongoing monitoring, evidence collection, remediation tracking, and Board reporting throughout the relationship under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system applies a risk-proportionate monitoring plan — annual for High, every two years for Medium, every three years for Low — and collects SOC reports, performance metrics, and pen-test results. High-severity issues require a remediation plan within 30 days, and High/Medium vendor status is reported to the Board. The monitoring plan and remediation acceptance are write-restricted to Vendor Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled monitoring review opens (`vendor.monitoring_review_completed`) | SOC report (`vendor.soc_report`), MI trends (`vendor.mi_trends`), inherent risk (`vendor.inherent_risk`) | Monitoring review record + emitted (`vendor.monitoring_review_completed`) | Annual/2yr/3yr by tier (enforced by `vendor.monitoring_review_due`) |
| High-severity issue identified (`vendor.mi_breach_detected`) | Issue detail (`vendor.issue_detail`), issue severity (`vendor.issue_severity`) | Remediation plan + emitted (`vendor.cap_issued`) | Remediation plan ≤30 days (enforced by `vendor.remediation_due`) |
| Board reporting period closes (`vendor.mi_period_closed`) | MI pack (`vendor.mi_pack`), High/Medium status set (`vendor.criticality_tier`) | Board vendor report + emitted (`vendor.board_report_delivered`) | Per board cadence (enforced by `vendor.board_report_due`) |

**ALERTS/METRICS:** Alert on monitoring reviews aging past their tier cadence and on high-severity issues without a 30-day remediation plan; track remediation closure rate and overdue-monitoring count (target zero).

## TPR-08 — Incident & Breach Reporting  {#tpr-08-incident-breach-reporting}

**WHY (Reg cite):** Vendor incidents touching member information trigger institution-side response, SAR, member-notice, and regulator-notice obligations under [12 CFR Part 748 Appendices A & B](https://www.ecfr.gov/current/title-12/part-748), the BSA SAR rules at [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/section-1020.320), and the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management).

**SYSTEM BEHAVIOR:** The system requires vendors to notify the institution of incidents within a contractual SLA (e.g., 24 hours of discovery) and triages internally within one business day. Handling is mapped to SAR, member-notice, and regulator-notice requirements per Part 748 Appendix B; where a reportable member-data incident is determined, NCUA and member notices are generated on their statutory clocks. A confirmed criminal/suspicious nexus routes a BSA/SAR referral. Reportability determination and member-notice content are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor reports an incident (`vendor.breach_notified`) | Breach detail (`vendor.breach_detail`), incident scope (`vendor.incident_scope`), affected member count (`vendor.incident_member_count`) | Vendor incident record + emitted (`vendor.incident_logged`) | 24h contractual notify |
| Internal triage opens (`vendor.incident_triaged`) | Incident scope (`incident.scope_initial`), severity (`incident.severity`), detection source (`incident.detection_source`) | Triage record + emitted (`incident.classified`) | 1 BD (enforced by `vendor.incident_triage_due`) |
| Reportable member-data incident determined (`incident.ncua_notified`) | Reportability determination (`incident.reportability_determination`), member notice template (`incident.member_notice_template`) | NCUA + member notice + emitted (`incident.member_notices_sent`) | Per Part 748 App. B (enforced by `incident.ncua_notice_due_at`) |
| Criminal/suspicious nexus confirmed (`incident.security_confirmed`) | BSA referral id (`incident.bsa_referral_id`), SAR decision (`case.sar_decision_timer`) | SAR referral/decision + emitted (`sar.decision_file`) | Per SAR rules (enforced by `case.sar_decision_timer`) |

**ALERTS/METRICS:** Alert on vendor incidents not triaged within 1 BD and on member/NCUA notices nearing statutory deadlines; target zero late triages and zero missed member notices.

## TPR-09 — Termination & Exit Strategy  {#tpr-09-termination-exit-strategy}

**WHY (Reg cite):** Critical and capital-impacting relationships require a maintained exit strategy (alternates, data migration/deletion, transition timelines) refreshed before termination under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), with continued GLBA safeguarding during transition per [12 CFR Part 1016](https://www.ecfr.gov/current/title-12/part-1016) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The system requires an approved exit strategy — alternates, data migration/deletion, and transition timelines — for all Critical/capital-impacting vendors within 90 days of onboarding, and refreshes and re-approves the exit plan before any termination notice is issued. On termination, the system confirms data return/deletion via attestation and certificate before closure. The exit plan and data-deletion attestation are write-restricted to Vendor Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical/capital-impacting vendor onboarded (`vendor.critical_alert`) | Exit plan id (`vendor.exit_plan_id`), RTO/RPO (`vendor.rto_rpo`), failover criteria (`vendor.failover_criteria`) | Exit strategy package + emitted (`vendor.exit_plan_approved`) | 90 days of onboarding (enforced by `vendor.exit_plan_due`) |
| Termination contemplated (`vendor.termination_initiated`) | Refreshed exit plan (`vendor.exit_plan_refreshed`), migration evidence (`vendor.migration_evidence`) | Re-approved exit plan + emitted (`vendor.exit_plan_approved`) | Before termination notice |
| Exit executed (`vendor.exit_completed`) | Data-deletion attestation (`vendor.data_deletion_attestation`), destruction certificate (`vendor.destruction_certificate`) | Exit completion record + emitted (`vendor.destruction_completed`) | At transition close |

**ALERTS/METRICS:** Alert when a Critical vendor lacks an approved exit plan 90 days post-onboarding and when termination proceeds without a refreshed plan; target zero terminations without confirmed data return/deletion.

## TPR-10 — Key Third-Party Owners & RACI  {#tpr-10-key-owners-raci}

**WHY (Reg cite):** Clear accountability — assigned business, risk, compliance/BSA, and technical owners for Critical and Material relationships — is a governance expectation of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management).

**SYSTEM BEHAVIOR:** The system maintains and publishes a register of Critical and Material relationships with assigned business, risk, compliance/BSA, and technical owners, completed before go-live and reviewed at least annually. Contract execution and go-live are blocked where ownership is unresolved. The RACI register is write-restricted to Vendor Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Owners assigned for a Critical/Material relationship (`vendor.raci_assigned`) | Governance map (`vendor.governance_map`), criticality tier (`vendor.criticality_tier`), contract id (`vendor.contract_id`) | RACI register entry + emitted (`vendor.raci_assigned`) | Before go-live |
| Go-live attempted with unresolved ownership (`vendor.golive_scheduled`) | Ownership gap flag (`vendor.contract_blocked_raci`) | Blocked go-live record + emitted (`vendor.golive_scheduled`) | At go-live gate |
| Annual RACI review opens (`vendor.raci_review_completed`) | RACI review id (`vendor.raci_review_due`) | RACI review record + emitted (`vendor.raci_review_completed`) | Annual (enforced by `vendor.raci_review_due`) |

**ALERTS/METRICS:** Alert on any go-live or contract execution blocked for unresolved ownership and on RACI review aging; target zero Critical/Material vendors live without all four owner roles assigned.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer, who centralizes governance of these controls with the Vendor Risk team, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit as required participants.
- **Approval:** Board/committee approves this policy and all material vendors before activation and re-approves at least annually ([TPR-01](#tpr-01-governance-accountability)).
- **Independent review:** Internal Audit reviews the program at least every 24 months ([TPR-01](#tpr-01-governance-accountability)).
- **Review cadence:** Annual policy review; effective 2026-07-01, next review 2027-07-01.
- **Cross-references (out of scope here, governed elsewhere):** Information Security Policy (vendor infosec/data-protection controls); BSA Policy (payment-processor BSA/AML diligence and broader BSA program); Record Retention Policy (vendor record retention/destruction schedules); Business Continuity Plan (vendor contingency/operational continuity); Privacy Policy (privacy clauses and NPPI sharing limits); Enterprise Risk Management Policy (material-outsourcing risk-appetite implications).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The third-party resources, fields, events, and timers referenced in the EVENTS tables map to the registered `vendor`, `incident`, `sar`, `governance`, and generic `Task` vocabulary in DESIGN_NOTES where available; codes drawn from the provisional list (e.g., `vendor.contract_terms`, `vendor.efficacy_results`, `vendor.alert_details`, `vendor.impact_scope`) use the agreed target spelling and will be confirmed by engineering before the next review. No new subjects, verbs, or task types were minted.
- **Bank Service Company Act applicability.** The reference policy cites the BSCA 30-day service-contract notification (12 USC §1867 / §1786). For a federally insured credit union, the analogous notification and examination authority flow through NCUA supervision; whether a standalone BSCA-style 30-day filing applies depends on charter and primary regulator and must be confirmed before relying on TPR-05/TPR-01 for any such filing.
- **Criticality-tier thresholds.** The four-tier model (Critical/Material/Minor/Exempt) and the inherent-risk scoring bands are adopted from the reference policy; the precise quantitative thresholds (e.g., financial-loss bands, replacement-time thresholds) were not specified by Patrick and are assumed to be defined in the operational Vendor Risk procedures.
- **Incident SLA specifics.** The 24-hour vendor notification and 1-business-day internal triage are stated as examples in PATRICK_NOTES; exact contractual SLA values per criticality tier are assumed to be set in the clause library and confirmed by Legal.
- **NCUA member-notice timing.** Member and NCUA notice deadlines are governed by Part 748 Appendix B as implemented; the specific day counts are enforced by the registered `incident.ncua_notice_due_at` timer and assumed to match the institution's Information Security/Incident Response configuration.
- **Utility/exempt carve-outs.** The reference policy accepts risk from certain utility providers; whether named utilities are classified Exempt under TPR-02 is assumed to be a Vendor Risk determination recorded in the inventory, not a policy-level exclusion.
