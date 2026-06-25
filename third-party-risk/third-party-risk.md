```yaml
---
title: Third-Party Risk Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Third-Party Risk, Vendor Management, Outsourcing, BSA/AML, GLBA, NCUA]
---
```

## General Policy Statement

Pynthia Credit Union (the "Credit Union") relies on third parties to deliver products and services, but the Board of Directors and management retain full responsibility for safety and soundness, BSA/AML compliance, sanctions screening, consumer protection, privacy, and capital adequacy — outsourcing an activity never outsources the accountability for it. This policy governs the complete lifecycle of every third-party relationship — Planning, Due Diligence, Contracting, Ongoing Monitoring, and Termination — and applies to all third parties that receive compensation from or access nonpublic member or operational data of the Credit Union. It establishes minimum standards for governance, criticality classification, risk assessment, due diligence, contract requirements, monitoring, incident handling, exit planning, and ownership accountability. Information-security control requirements, BSA program details, record retention schedules, business continuity planning, privacy-specific contractual clauses, and enterprise risk appetite implications are addressed in their respective standalone policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New vendor identified | Business owner proposes engagement → `vendor.proposed` | Before contract execution | Risk assessment and DD package | [TR-01](#tr-01-governance-accountability) / [TR-03](#tr-03-risk-assessment-planning) |
| Vendor added to inventory | Vendor approved for engagement → `vendor.approved` | Before contract execution | Inventory record with flags | [TR-02](#tr-02-vendor-inventory-criticality-classification) |
| Inventory reconciliation | Quarter closes → `vendor.reconciliation.completed` | Quarterly | AP/procurement cross-check | [TR-02](#tr-02-vendor-inventory-criticality-classification) |
| Risk assessment — Medium/High | Vendor classified Medium or High → `vendor.risk_assessment.approved` | Before contract execution | Signed risk assessment | [TR-03](#tr-03-risk-assessment-planning) |
| Emergency provisional engagement | Provisional engagement created → `vendor.provisional_engagement.created` | Full review within 30 days | Provisional flag + review task | [TR-03](#tr-03-risk-assessment-planning) |
| Due diligence — standard | Vendor onboarding started → `vendor.due_diligence.initiated` | Before production data/NPI shared | DD package proportional to risk | [TR-04](#tr-04-due-diligence-amlkyc-expectations) |
| EDD refresh — AML/KYC/sanctions vendor | Annual cycle opens → `vendor.edd.approved` | Annually | Enhanced DD package | [TR-04](#tr-04-due-diligence-amlkyc-expectations) |
| Contract clause verification | Contract submitted → `vendor.contract_clauses.verified` | Before execution | Clause checklist signed off | [TR-05](#tr-05-contract-standards-regulatory-clauses) |
| Clause library review | Annual cycle → `vendor.clause_library.updated` | Annually | Updated clause library version | [TR-05](#tr-05-contract-standards-regulatory-clauses) |
| Core/capital-impacting vendor review | Annual cycle → `vendor.core_review.completed` | Annually | Comprehensive review package | [TR-06](#tr-06-outsourcing-of-core-capital-impacting-functions) |
| Core vendor exit/contingency test | 24-month cycle → `vendor.exit_test.completed` | Every 24 months | Exit test results | [TR-06](#tr-06-outsourcing-of-core-capital-impacting-functions) |
| High-risk vendor monitoring review | Annual cycle → `vendor.monitoring_review.completed` | Annually | Monitoring report | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Medium-risk vendor monitoring review | Biennial cycle → `vendor.monitoring_review.completed` | Every 2 years | Monitoring report | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Low-risk vendor monitoring review | Triennial cycle → `vendor.monitoring_review.completed` | Every 3 years | Monitoring report | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| High-severity issue remediation | Issue rated high → `vendor.cap.issued` | 30 days | Remediation/CAP plan | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Board risk report — vendor status | Monitoring period closes → `vendor.board_report.delivered` | Per monitoring cycle | High/Medium vendor status report | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Vendor incident — vendor notification | Vendor discovers incident → `vendor.incident.reported` | Per contract SLA (≤ 24 hrs of discovery) | Vendor incident notification | [TR-11](#tr-11-vendor-incident-notification-internal-triage-sar-referral) |
| Vendor incident — internal triage | Incident reported → `vendor.incident.logged` | 1 business day | Triage determination | [TR-11](#tr-11-vendor-incident-notification-internal-triage-sar-referral) |
| Exit strategy — critical/capital-impacting | Vendor onboarded as Critical/capital-impacting → `vendor.exit_plan.approved` | Within 90 days of onboarding | Documented exit strategy | [TR-09](#tr-09-termination-exit-strategy) |
| Exit strategy refresh | Termination notice pending → `vendor.exit_plan.approved` | Before notice issued | Refreshed and approved exit plan | [TR-09](#tr-09-termination-exit-strategy) |
| RACI register — initial | Vendor classified Critical or Material → `vendor.raci.assigned` | Before go-live | Completed RACI register entry | [TR-10](#tr-10-key-third-party-owners-raci) |
| RACI register — annual review | Annual cycle → `vendor.raci_review.completed` | Annually | Reviewed RACI register | [TR-10](#tr-10-key-third-party-owners-raci) |
| Program governance review | Annual cycle → `vendor.governance_map.approved` | Annually | Board/committee approval of policy | [TR-01](#tr-01-governance-accountability) |
| Internal Audit program review | 24-month cycle → `vendor.program_audit.completed` | Every 24 months | IA report with management responses | [TR-01](#tr-01-governance-accountability) |

---

## TR-01 — Governance & Accountability {#tr-01-governance-accountability}

**WHY (Reg cite):** The [2023 Interagency Guidance on Third-Party Relationships (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires boards and senior management to maintain clear accountability for third-party risk management, including documented roles, committee oversight, and independent review. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires NCUA-supervised credit unions to maintain a written information security program and governance structure that encompasses service provider arrangements.

**SYSTEM BEHAVIOR:** The Credit Union maintains an authoritative vendor-governance configuration (`vendor.governance_map`) that maps the Board, Supervisory Committee, Vendor Risk Committee, and named management roles to specific third-party risk responsibilities. The Board or a designated committee must approve this policy and any material changes at least annually; the governance map is updated to reflect any structural changes before the next Board cycle opens. Internal Audit must conduct an independent review of the third-party risk program at least every 24 months and report findings, including management responses, to the Board or Supervisory Committee. The Chief Compliance Officer owns this control and is the write-restricted approver for the governance map; business owners and the Vendor Risk team may propose updates but cannot approve them.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle opens (`governance.board_cycle.opened`) | Current policy version (`policy.document_version`), proposed redline (`policy.draft_redline`), change rationale (`policy.change_rationale`) | Board-approved policy + governance map (`vendor.governance_map.approved`, `governance.policy.approved`) | Annually (internal: 30 days before effective date; enforced by `vendor.governance_review_due`) |
| Internal Audit program review due (`vendor.program_audit.completed`) | Prior IA findings (`audit.findings_routed_to_board`), management responses (`audit.management_responses`), program scope (`audit.engagement_scope`) | IA report delivered to Board/Supervisory Committee (`audit.report.issued`) | Every 24 months (internal: 60-day engagement window; enforced by `vendor.program_audit_due`) |
| Board approval of material vendor required | Vendor classification (`vendor.criticality_tier`), business case (`vendor.business_case`), risk assessment (`vendor.risk_assessment`) | Board approval recorded (`vendor.board_approval.recorded`) | Before contract execution (no internal SLA override) |

**ALERTS/METRICS:** Alert fires if `vendor.governance_review_due` ages past 365 days without `vendor.governance_map.approved`; separate alert fires if `vendor.program_audit_due` ages past 730 days without `vendor.program_audit.completed`. Target: zero overdue governance reviews and zero overdue IA program reviews at any point in time.

---

## TR-02 — Vendor Inventory & Criticality Classification {#tr-02-vendor-inventory-criticality-classification}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires institutions to maintain a complete inventory of third-party relationships and to apply risk-based classification. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and NCUA safeguarding expectations require identification of all service providers with access to member information.

**SYSTEM BEHAVIOR:** Every third party that receives compensation from or accesses nonpublic member or operational data of the Credit Union must be recorded in the centralized vendor inventory (`vendor.inventory_id`) before contract execution. Each record carries a criticality tier (`vendor.criticality_tier`: Critical / Material / Minor / Exempt), an inherent risk rating (`vendor.inherent_risk`), and boolean flags for core/capital-impacting function (`vendor.core_function_flag`), BSA/AML/KYC/sanctions role (`vendor.bsa_role_flag`), NPI access (`vendor.npi_access_flag`), and network connectivity (`vendor.network_access_flag`). Classification is performed by the Vendor Risk team and approved by the CCO; business owners may not self-classify. The inventory is reconciled against AP/procurement records at least quarterly; discrepancies are flagged as findings. Exempt vendors (no risk now or in the future, easily replaced) are recorded but excluded from further due diligence requirements.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New vendor proposed (`vendor.proposed`) | Legal name (`vendor.legal_name`), service description (`vendor.service_description`), compensation flag (`vendor.compensation_flag`), data scope (`vendor.data_scope`), network access flag (`vendor.network_access_flag`), NPI access flag (`vendor.npi_access_flag`) | Inventory record created with provisional classification (`vendor.inventory.created`) | Before contract execution |
| Vendor classification decision made | Inherent risk inputs (strategic, financial, operational, compliance, BSA, cyber, capital), core function flag (`vendor.core_function_flag`), BSA role flag (`vendor.bsa_role_flag`) | Classification recorded and approved (`vendor.classification.recorded`) | Within 5 business days of proposal |
| Quarterly reconciliation cycle (`vendor.reconciliation.completed`) | AP/procurement extract, current inventory snapshot (`vendor.inventory_id`) | Reconciliation completed; discrepancies logged as findings (`vendor.reconciliation.completed`) | Quarterly (enforced by `vendor.inventory_reconciliation_due`) |

**ALERTS/METRICS:** Alert fires if any vendor reaches contract execution without an `inventory_id`; alert fires if `vendor.inventory_reconciliation_due` ages past 90 days without `vendor.reconciliation.completed`. Target: 100% of active vendors in inventory; zero unclassified vendors older than 5 business days.

---

## TR-03 — Risk Assessment & Planning {#tr-03-risk-assessment-planning}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires a pre-engagement risk assessment covering strategic, financial, operational, compliance, reputation, and other relevant risk dimensions, proportionate to the risk and complexity of the relationship. [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867) provides examination authority over service companies and informs notification expectations for certain service contracts.

**SYSTEM BEHAVIOR:** A documented risk assessment (`vendor.risk_assessment`) covering strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity risk dimensions must be completed and approved before contract execution for any Medium or High inherent-risk vendor. Low-risk and Exempt vendors require only a documented rationale for the classification. Emergency provisional engagements — where operational necessity requires engagement before full assessment — are permitted only with CCO approval; the provisional flag (`vendor.provisional_engagement`) is set, and a full risk assessment must be completed and approved within 30 days. The risk assessment is write-restricted to the Vendor Risk team; business owners provide inputs but cannot approve. A vendor tagged as core/capital-impacting is automatically assigned High inherent risk regardless of other scoring inputs.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor classified Medium or High (`vendor.classification.recorded`) | Risk dimension scores (strategic, financial, operational, compliance, BSA/AML, reputation, cyber, capital/liquidity), staff expertise assessment, criticality determination, exit strategy feasibility | Approved risk assessment (`vendor.risk_assessment.approved`) | Before contract execution |
| Emergency provisional engagement approved (`vendor.provisional_engagement.created`) | CCO approval record, provisional justification (`vendor.provisional_justification`), engagement scope | Provisional flag set; full-review task created (`vendor.provisional.flagged`) | Immediately on engagement; full review within 30 days (enforced by `vendor.provisional_review_due`) |
| Core/capital-impacting flag applied (`vendor.core_function.flagged`) | Core function scope (`vendor.core_function_scope`), capital/liquidity impact assessment | Inherent risk automatically set to High; core tag applied (`vendor.core_tag.applied`) | Immediately on classification |

**ALERTS/METRICS:** Alert fires if any Medium/High vendor reaches contract execution without `vendor.risk_assessment.approved`; alert fires if `vendor.provisional_review_due` ages past 30 days without `vendor.risk_assessment.approved`. Target: zero contracts executed without a completed, approved risk assessment for Medium/High vendors; zero provisional engagements outstanding beyond 30 days.

---

## TR-04 — Due Diligence & AML/KYC Expectations {#tr-04-due-diligence-amlkyc-expectations}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires risk-proportionate due diligence before entering a third-party relationship. [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-C/section-1020.220) and NCUA BSA examination guidance establish that the Credit Union remains responsible for BSA/AML and CIP obligations even when a third party performs onboarding, KYC, monitoring, or sanctions screening functions; a documented responsibility split is required for any such vendor.

**SYSTEM BEHAVIOR:** A due diligence package (`vendor.due_diligence_artifact_id`) proportional to the vendor's risk tier must be completed before any production data or NPI is shared with the vendor. Standard due diligence includes background and reputation check, business model and financial health review, policies/procedures and consumer protection controls review, and SOC report or equivalent. Enhanced due diligence (EDD) is required for any vendor performing onboarding, KYC, AML transaction monitoring, or sanctions screening; EDD must include a documented BSA/AML responsibility split (`vendor.bsa_responsibility_split`) and must be refreshed at least annually. The Vendor Risk team and BSA Officer jointly approve EDD packages; standard DD packages are approved by the Vendor Risk team alone. No production data or NPI may be shared until the applicable DD package is approved.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor onboarding started (`vendor.onboarding.started`) | Background check results, financial statements, SOC report or equivalent, policies/procedures review, consumer protection controls evidence | Standard DD package approved (`vendor.due_diligence.approved`) | Before production data or NPI shared |
| Vendor flagged as BSA/AML/KYC/sanctions role (`vendor.bsa_role.flagged`) | All standard DD items plus BSA/AML responsibility split (`vendor.bsa_responsibility_split`), BSA function scope (`vendor.bsa_function_scope`), sanctions screening methodology | EDD package approved (`vendor.edd.approved`) | Before production data or NPI shared |
| Annual EDD refresh cycle opens for BSA/AML/KYC/sanctions vendor (`vendor.edd_refresh_due`) | Updated financial statements, refreshed SOC/audit report, updated BSA responsibility split, adverse news review | EDD refresh completed and approved (`vendor.edd.approved`) | Annually (enforced by `vendor.edd_refresh_due`) |

**ALERTS/METRICS:** Alert fires if any vendor with `vendor.npi_access_flag = true` or `vendor.bsa_role_flag = true` reaches production without `vendor.due_diligence.approved`; alert fires if `vendor.edd_refresh_due` ages past 365 days without `vendor.edd.approved`. Target: zero production NPI-sharing vendors without approved DD; zero EDD packages overdue for annual refresh.

---

## TR-05 — Contract Standards & Regulatory Clauses {#tr-05-contract-standards-regulatory-clauses}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) specifies required contract elements including scope, SLAs, audit rights, data security, BCP/DR, and termination. [GLBA / Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) requires appropriate contractual safeguards for NPI shared with nonaffiliated third parties. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires written agreements with service providers that address information security and incident response.

**SYSTEM BEHAVIOR:** All third-party contracts must include the Credit Union's standard clause library (`vendor.clause_library_version`), which covers: scope of services and SLAs; party responsibilities and subcontractor oversight; GLBA/Reg P data security and NPI protections (`vendor.glba_clause`); BSA/AML and sanctions compliance obligations; audit and examination rights; BCP/DR requirements; and termination and exit assistance. A clause checklist (`vendor.contract_clauses`) must be verified as complete before any contract is executed; the system blocks execution if required clauses are unverified (`vendor.contract_blocked_raci`). Legal and Risk sign-off is required for any contract involving a core or capital-impacting vendor. Clause exceptions must be documented in the exceptions log (`vendor.clause_exception`) with CCO approval; exceptions are write-restricted to Legal and the CCO. The clause library is reviewed and updated at least annually.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Contract submitted for execution (`vendor.contract.submitted`) | Contract draft (`vendor.contract_draft`), clause checklist (`vendor.contract_clauses`), GLBA clause verification (`vendor.glba_clause`), BSA/AML clause, audit rights clause, BCP/DR clause, termination clause | Clause checklist verified; contract cleared for execution (`vendor.contract_clauses.verified`) | Before execution |
| Core/capital-impacting contract submitted | All standard clause items plus Legal sign-off, Risk sign-off | Legal and Risk approval recorded; contract cleared (`vendor.contract_clauses.verified`) | Before execution |
| Clause exception requested (`vendor.clause_exception.requested`) | Exception rationale (`vendor.exception_rationale`), compensating control or mitigant, CCO approval | Exception logged (`vendor.clause_exception.logged`) | Before contract execution |
| Annual clause library review cycle (`vendor.clause_library_review_due`) | Current library version, regulatory change log, Legal review | Updated clause library published (`vendor.clause_library.updated`) | Annually (enforced by `vendor.clause_library_review_due`) |

**ALERTS/METRICS:** Alert fires if any contract reaches execution without `vendor.contract_clauses.verified`; alert fires if `vendor.clause_library_review_due` ages past 365 days without `vendor.clause_library.updated`. Target: zero contracts executed without verified clause checklist; zero unlogged clause exceptions.

---

## TR-06 — Outsourcing of Core & Capital-Impacting Functions {#tr-06-outsourcing-of-core-capital-impacting-functions}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) imposes heightened expectations for critical activities, including board-level awareness, comprehensive annual review, and robust exit and contingency planning. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and NCUA BSA examination guidance require that outsourcing of BSA/AML-critical processes not diminish the Credit Union's compliance posture or examination readiness.

**SYSTEM BEHAVIOR:** Vendors operating core/ledger/card systems, settlement or funding flows, or critical BSA/AML processes are tagged as core (`vendor.core_tag`) and assigned mandatory High inherent risk. These vendors require: (a) a comprehensive annual review (`vendor.core_review_due`) covering financial health, operational performance, SOC reports, and regulatory standing; (b) board-level awareness documented in board minutes or a board report (`vendor.board_report.delivered`); and (c) an exit and contingency plan (`vendor.exit_plan_id`) that is tested at least every 24 months (`vendor.exit_test_due`). The exit test must simulate transition to an alternate provider or in-house capability and produce documented results (`vendor.exit_test_scenario`, `vendor.dr_test_results`). The CCO and CIO jointly approve core vendor reviews; the Board receives a summary at least annually.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Core tag applied to vendor (`vendor.core_tag.applied`) | Core function scope (`vendor.core_function_scope`), inherent risk set to High, board notification requirement flagged | Core vendor record established; annual review task created (`vendor.core_review.completed`) | Immediately on tagging |
| Annual core vendor review cycle (`vendor.core_review_due`) | SOC report (`vendor.soc_report`), financial review (`vendor.financial_review`), performance metrics (`vendor.mi_pack`), regulatory standing, subprocessor attestation (`vendor.subprocessor_attestation`) | Comprehensive review completed; board summary delivered (`vendor.core_review.completed`, `vendor.board_report.delivered`) | Annually (enforced by `vendor.core_review_due`) |
| Exit/contingency test cycle (`vendor.exit_test_due`) | Exit plan (`vendor.exit_plan_id`), test scenario (`vendor.exit_test_scenario`), alternate provider or in-house capability assessment, failover criteria (`vendor.failover_criteria`) | Exit test completed; results documented (`vendor.exit_test.completed`) | Every 24 months (enforced by `vendor.exit_test_due`) |

**ALERTS/METRICS:** Alert fires if any core-tagged vendor's `vendor.core_review_due` ages past 365 days without `vendor.core_review.completed`; alert fires if `vendor.exit_test_due` ages past 730 days without `vendor.exit_test.completed`. Target: zero core vendors without a current annual review; zero core vendors without a tested exit plan within the 24-month window.

---

## TR-07 — Ongoing Monitoring, Performance & Risk Reporting {#tr-07-ongoing-monitoring-performance-risk-reporting}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires ongoing monitoring of third-party relationships commensurate with risk, including collection of performance data, SOC reports, and other evidence, and periodic reporting to management and the board. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires that the Credit Union maintain oversight of service providers' information security controls.

**SYSTEM BEHAVIOR:** Each vendor has a risk-proportionate monitoring plan with review frequency set at onboarding and updated at each review: High inherent risk — annually; Medium — every 2 years; Low — every 3 years. Monitoring activities collect SOC reports, performance metrics (`vendor.mi_pack`), penetration test results where applicable, adverse news, and regulatory standing. The Vendor Risk team conducts reviews and documents findings (`vendor.issue_detail`); issues rated high-severity (`vendor.issue_rated_high`) require a corrective action plan (CAP) accepted by the vendor within 30 days (`vendor.remediation_due`). High and Medium vendor status — including open issues and remediation progress — is reported to the Board or a designated committee at least annually (`vendor.board_report.delivered`). Monitoring review records are write-restricted to the Vendor Risk team; business owners receive read access to their vendors' status.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring review due (`vendor.monitoring_review_due`) | SOC report (`vendor.soc_report`), performance metrics (`vendor.mi_pack`), adverse news check, regulatory standing, prior findings status | Monitoring review completed; findings logged (`vendor.monitoring_review.completed`) | High: annually; Medium: every 2 years; Low: every 3 years (enforced by `vendor.monitoring_review_due`) |
| High-severity issue identified (`vendor.issue_rated_high`) | Issue detail (`vendor.issue_detail`), issue severity (`vendor.issue_severity`), affected scope (`vendor.affected_scope`) | CAP issued to vendor; remediation task created (`vendor.cap.issued`) | CAP accepted within 30 days (enforced by `vendor.remediation_due`) |
| Board reporting cycle (`vendor.board_report_due`) | High/Medium vendor status summary, open issues, remediation progress, MI trends (`vendor.mi_trends`) | Board report delivered (`vendor.board_report.delivered`) | At least annually (enforced by `vendor.board_report_due`) |
| Management information period closes (`vendor.mi_period.closed`) | MI pack (`vendor.mi_pack`), MI period (`vendor.mi_period`), breach indicators (`vendor.mi_breach`) | MI reviewed; breach alerts fired if thresholds exceeded (`vendor.mi.reviewed`) | Per monitoring plan cadence (enforced by `vendor.mi_due_at`) |

**ALERTS/METRICS:** Alert fires if `vendor.monitoring_review_due` ages past its tier deadline without `vendor.monitoring_review.completed`; alert fires if `vendor.remediation_due` ages past 30 days without `vendor.remediation_plan_accepted`. Target: zero overdue monitoring reviews by tier; zero high-severity issues without an accepted CAP within 30 days; 100% of High/Medium vendors included in annual board report.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to notify NCUA within 72 hours of determining a reportable cyber incident. [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member notification program for unauthorized access to sensitive member information.

**SYSTEM BEHAVIOR:** Once a reportable cyber incident is determined, NCUA notification must be sent within 72 hours of that determination. Member notice is sent without unreasonable delay per Appendix B criteria once misuse of member information is determined likely. The reportability determination and the NCUA-notification field are write-restricted to the CCO/Compliance-Legal. An incident determined non-reportable is documented with rationale and triggers no NCUA notice.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportable cyber incident determined (`incident.reportability_determination`) | Reportability rationale (`incident.reportability_rationale`), NCUA notice due (`incident.ncua_notice_due_at`) | NCUA notification sent (`incident.ncua.notified`) | 72 hours of determination (enforced by `incident.ncua_notice_due_at`) |
| Member impact confirmed (`incident.member_impact.confirmed`) | Member impact summary (`incident.member_impact`), notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices.sent`) | Without unreasonable delay per Appendix B (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert fires when `incident.ncua_notice_due_at` is within 12 hours without an `incident.ncua.notified` event; alert fires when member notice is overdue per `incident.notification_due_at`. Target: 100% of reportable incidents notified to NCUA within 72 hours; zero member-notice SLA breaches.

---

## TR-11 — Vendor Incident Notification, Internal Triage & SAR Referral {#tr-11-vendor-incident-notification-internal-triage-sar-referral}

**WHY (Reg cite):** [12 CFR Part 748, Appendices A and B](https://www.ecfr.gov/current/title-12/part-748) require NCUA-supervised credit unions to maintain an incident response program covering incidents caused by or involving service providers. BSA SAR rules ([31 CFR Chapter X](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X)) require SAR filing when a vendor incident involves suspected criminal activity. The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires contracts to include vendor incident notification obligations. Vendor notification and triage feed the reportability determination governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** All vendor contracts must include a clause requiring the vendor to notify the Credit Union of any security incident or data breach within the contractual SLA (target: no later than 24 hours of the vendor's discovery). Upon receipt of a vendor incident notification, the Vendor Risk team logs the incident (`vendor.incident.logged`) and the Compliance/BSA team triages it within 1 business day to determine member NPI impact and SAR referral requirement, routing to SC-01 for the member-notice/NCUA-notice determination. Triage outcomes are mapped to the Credit Union's incident response process (`incident.created`) for handling. The BSA Officer approves SAR referrals. Vendor incident history (`vendor.incident_history`) is maintained in the vendor record and reviewed at each monitoring cycle.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor reports incident (`vendor.incident.reported`) | Vendor incident notification, incident scope (`vendor.incident_scope`), member count estimate (`vendor.incident_member_count`), containment status (`vendor.incident_containment_status`) | Incident logged; triage task created (`vendor.incident.logged`) | Immediately on receipt; triage within 1 business day (enforced by `vendor.incident_triage_due`) |
| Internal triage completed (`vendor.incident_triage_due`) | Triage determination: member NPI impact, SAR referral flag; incident severity (`vendor.issue_severity`) | Triage completed; incident tracks dispatched to response process (`vendor.incident_tracks_dispatched`, `incident.created`) | Within 1 business day of vendor notification (enforced by `vendor.incident_triage_due`) |
| SAR referral determination made | BSA Officer review, incident facts, criminal activity assessment | SAR referral recorded or declined; BSA case opened if referred (`sar.filed` or `sar.decision_no_file`) | Per BSA SAR timing rules (30 days of detection; 60 days with extension) |

**ALERTS/METRICS:** Alert fires if `vendor.incident_triage_due` ages past 1 business day without `vendor.incident_tracks_dispatched`. Target: 100% of vendor incidents triaged within 1 business day.

---

## TR-09 — Termination & Exit Strategy {#tr-09-termination-exit-strategy}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires institutions to plan for orderly termination of third-party relationships, including transition timelines, data migration or deletion, and identification of alternatives. [GLBA / Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) requires that NPI protections continue through and after termination, including data deletion or return.

**SYSTEM BEHAVIOR:** An exit strategy (`vendor.exit_plan_id`) must be documented and approved for all Critical and capital-impacting vendors within 90 days of onboarding (`vendor.exit_plan_due`). The exit strategy must identify: alternate providers or in-house capability; data migration or deletion procedures and timeline; transition assistance obligations; and member communication requirements if applicable. The exit plan must be refreshed and re-approved before any termination notice is issued to the vendor (`vendor.exit_plan_refreshed`). Upon termination, the Credit Union confirms data deletion or return (`vendor.data_deletion_attestation`) and obtains a destruction certificate where applicable (`vendor.destruction_certificate`). GLBA data protections apply throughout the transition period. The CCO approves all exit plans; the Vendor Risk team maintains them. For non-Critical/non-capital-impacting vendors, a documented transition approach is required but a formal exit plan is not mandated.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical or capital-impacting vendor onboarded (`vendor.critical.alert`) | Alternate provider options, data migration/deletion plan, transition timeline, member communication assessment | Exit plan documented and approved (`vendor.exit_plan.approved`) | Within 90 days of onboarding (enforced by `vendor.exit_plan_due`) |
| Termination notice pending | Current exit plan (`vendor.exit_plan_id`), refreshed alternate provider assessment, updated data migration plan, CCO approval | Exit plan refreshed and approved before notice issued (`vendor.exit_plan.approved`, `vendor.exit_plan_refreshed`) | Before termination notice issued |
| Vendor termination executed (`vendor.termination.initiated`) | Exit plan, data deletion/return confirmation, destruction certificate where applicable | Termination completed; data deletion attested (`vendor.exit.completed`, `vendor.data_deletion_attestation`) | Per transition timeline in exit plan |

**ALERTS/METRICS:** Alert fires if any Critical or capital-impacting vendor's `vendor.exit_plan_due` ages past 90 days post-onboarding without `vendor.exit_plan.approved`; alert fires if a termination notice is issued without a current `vendor.exit_plan.approved`. Target: 100% of Critical/capital-impacting vendors with an approved exit plan within 90 days of onboarding; zero termination notices issued without a refreshed exit plan.

---

## TR-10 — Key Third-Party Owners & RACI {#tr-10-key-third-party-owners-raci}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires clear assignment of accountability for each third-party relationship, including business, risk, compliance, and technical ownership, to ensure effective ongoing oversight and escalation.

**SYSTEM BEHAVIOR:** Every Critical and Material vendor must have a completed RACI register entry (`vendor.raci.assigned`) identifying: a business owner (accountable for service delivery and relationship management); a risk/compliance owner (accountable for risk assessment and regulatory compliance, typically the Vendor Risk team or CCO delegate); a BSA/compliance owner for any vendor with a BSA role flag; and a technical owner (accountable for integration, security, and operational continuity). The RACI register is published and accessible to all relevant stakeholders. Contract execution is blocked (`vendor.contract_blocked_raci`) if ownership is unresolved at the time of contract submission. RACI assignments are reviewed and confirmed at least annually (`vendor.raci_review_due`). The CCO is the approving authority for RACI assignments; the Vendor Risk team maintains the register.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor classified Critical or Material (`vendor.classification.recorded`) | Business owner identity, risk/compliance owner identity, BSA owner identity (if BSA role flagged), technical owner identity | RACI assigned and recorded (`vendor.raci.assigned`) | Before go-live; contract blocked until complete (`vendor.contract_blocked_raci`) |
| Annual RACI review cycle (`vendor.raci_review_due`) | Current RACI register, ownership confirmation from each named owner, any personnel changes | RACI review completed; register updated if needed (`vendor.raci_review.completed`) | Annually (enforced by `vendor.raci_review_due`) |
| Ownership vacancy detected | Departing owner notification, vendor criticality tier (`vendor.criticality_tier`) | Vacancy flagged; replacement assignment required before next monitoring activity (`vendor.raci.assigned`) | Within 10 business days of vacancy |

**ALERTS/METRICS:** Alert fires if any Critical or Material vendor reaches go-live without `vendor.raci.assigned`; alert fires if `vendor.raci_review_due` ages past 365 days without `vendor.raci_review.completed`; alert fires on any ownership vacancy unresolved beyond 10 business days. Target: 100% of Critical/Material vendors with complete, current RACI assignments; zero go-lives with unresolved ownership.

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer

**Approvers:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** This policy is reviewed and approved by the Board or a designated committee at least annually. Material changes (new regulatory guidance, significant program restructuring, or material changes to the Credit Union's third-party risk profile) trigger an out-of-cycle review.

**Cross-References:**
- Information Security Policy — vendor information-security and data-protection control requirements
- BSA Policy — BSA/AML due diligence on payment processors and the broader BSA program
- Record Retention Policy — vendor record retention and destruction schedules
- Business Continuity Plan — vendor contingency planning and operational continuity
- Privacy Policy — privacy-specific contractual clauses and NPPI sharing limits
- Enterprise Risk Management Policy — material outsourcing implications for enterprise risk appetite

**Effective Date:** 2026-07-01
**Next Scheduled Review:** 2027-07-01

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for select codes.** The `vendor` object and its fields, events, and timers referenced throughout this policy are registered in `core-vocabulary.json` and confirmed as available. The following codes used in this policy are drawn from the registered vocabulary and confirmed: `vendor.governance_map`, `vendor.criticality_tier`, `vendor.inherent_risk`, `vendor.core_function_flag`, `vendor.bsa_role_flag`, `vendor.npi_access_flag`, `vendor.network_access_flag`, `vendor.risk_assessment`, `vendor.due_diligence_artifact_id`, `vendor.bsa_responsibility_split`, `vendor.bsa_function_scope`, `vendor.clause_library_version`, `vendor.glba_clause`, `vendor.contract_clauses`, `vendor.contract_blocked_raci`, `vendor.clause_exception`, `vendor.exit_plan_id`, `vendor.exit_plan_due`, `vendor.exit_plan_refreshed`, `vendor.data_deletion_attestation`, `vendor.destruction_certificate`, `vendor.raci.assigned`, `vendor.incident.logged`, `vendor.incident.reported`, `vendor.incident_triage_due`, `vendor.incident_tracks_dispatched`, `vendor.incident_scope`, `vendor.incident_member_count`, `vendor.incident_containment_status`, `vendor.incident_history`, `vendor.mi_pack`, `vendor.mi_trends`, `vendor.mi_breach`, `vendor.mi_due_at`, `vendor.mi_period`, `vendor.issue_detail`, `vendor.issue_rated_high`, `vendor.issue_severity`, `vendor.affected_scope`, `vendor.remediation_due`, `vendor.remediation_plan_accepted`, `vendor.cap.issued`, `vendor.board_report.delivered`, `vendor.board_report_due`, `vendor.core_tag`, `vendor.core_tag.applied`, `vendor.core_function_scope`, `vendor.core_review_due`, `vendor.exit_test_due`, `vendor.exit_test_scenario`, `vendor.dr_test_results`, `vendor.failover_criteria`, `vendor.soc_report`, `vendor.financial_review`, `vendor.subprocessor_attestation`, `vendor.provisional_engagement`, `vendor.provisional_justification`, `vendor.provisional_review_due`, `vendor.inventory_id`, `vendor.inventory_reconciliation_due`, `vendor.clause_library_review_due`, `vendor.governance_review_due`, `vendor.program_audit_due`, `vendor.raci_review_due`, `vendor.edd_refresh_due`, `vendor.monitoring_review_due`, `vendor.annual_review_due`, `vendor.legal_name`, `vendor.service_description`, `vendor.compensation_flag`, `vendor.data_scope`, `vendor.business_case`, `vendor.contract_draft`, `vendor.contract_id`, `vendor.exception_rationale`, `vendor.golive`, `vendor.critical.alert`, `vendor.termination`, `vendor.exit.completed`, `vendor.dr_attestation_due`, `vendor.concentration_review_due`. The following codes used in this policy are drawn from the provisional codes list and must be confirmed by engineering before the next review: `vendor.alert_details`, `vendor.contract_terms`, `vendor.efficacy_results`, `vendor.impact_scope`. No new object prefixes or actions were coined.

- **Charter type and NCUA primary regulator assumed.** This policy is written for a federally insured credit union subject to NCUA examination. The applicability of [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867) (Bank Service Company Act notification) is noted in TR-03 as an authority hint; its precise applicability to credit unions depends on charter type and whether the Credit Union is an FDIC-supervised institution. Legal counsel should confirm whether BSCA notification obligations apply and, if so, which service contracts trigger the 30-day notification requirement.

- **Board approval threshold for "material vendors" is undefined.** PATRICK_NOTES and the reference policies reference Board approval for material vendors but do not define the dollar threshold or other criteria that trigger Board (versus committee) approval. This policy requires Board or committee approval for all Critical vendors and for any vendor the CCO designates as material. A specific dollar or risk threshold should be confirmed with the Board and documented in the governance map.

- **Contractual SLA for vendor incident notification is a target, not a fixed requirement.** The 24-hour notification SLA in TR-11 is the Credit Union's target for contract negotiations. Some incumbent vendors may have negotiated longer windows. Legal and the CCO should confirm the minimum acceptable SLA for each vendor tier and update the clause library accordingly.
- **NCUA reportable-incident/member-notice mechanic is a single shared control.** [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) is sourced verbatim — same control ID, title, and body — from [`shared-controls/ncua-incident-notification.md`](../shared-controls/ncua-incident-notification.md) and appears identically in Business Continuity Plan, E-Commerce, Electronic Payment Systems, Collections, Information Security, Privacy, and Third-Party Risk. Edit the shared source first, then propagate to all seven; do not edit SC-01 in this policy in isolation. TR-11 carries the vendor-notification-SLA/internal-triage/SAR-referral material that used to be bundled into the old TR-08 control.

- **Fourth-party (subcontractor) visibility.** PATRICK_NOTES require visibility into fourth-party subcontractors. This policy requires subprocessor attestation (`vendor.subprocessor_attestation`) as part of core vendor reviews and EDD packages, but a dedicated fourth-party inventory and monitoring workflow is not yet defined. Engineering should confirm whether the `vendor` object supports a subprocessor relationship graph, or whether a separate `vendor.dependency_map` field is sufficient.

- **HMDA reporter status not assessed.** This policy does not address HMDA reporting obligations. If any vendor performs covered lending activities on behalf of the Credit Union, HMDA applicability should be confirmed separately.

- **Exempt vendor criteria.** The definition of "Exempt" (no risk now or in the future, easily replaced) is intentionally minimal. The Vendor Risk team should document specific examples and a decision tree for the Exempt classification to ensure consistent application and to satisfy examiner expectations.
