```markdown
---
title: Third-Party Risk Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Third-Party Risk, Vendor Management, Outsourcing, BSA/AML, GLBA, NCUA Part 748]
---

## General Policy Statement

Pynthia Credit Union relies on third parties to deliver products and services, but the Board of Directors and management retain full and non-delegable responsibility for safety and soundness, BSA/AML compliance, sanctions screening, consumer protection, member privacy, and capital adequacy — regardless of which party performs the underlying activity. This policy establishes the minimum governance, lifecycle controls, and engineering requirements for every third-party relationship in which a vendor receives compensation or accesses nonpublic member or operational data. It applies across the full relationship lifecycle — Planning, Due Diligence, Contracting, Ongoing Monitoring, and Termination — and supersedes the former Vendor Management and Outsourcing policies. Information-security control requirements, BSA program details, record retention schedules, contingency planning, privacy-specific contractual clauses, and enterprise risk-appetite implications are governed by their respective policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New vendor identified | Business owner proposes engagement → `vendor.proposed` | Before contract execution | Risk assessment required for Medium/High | [TR-01](#tr-01-governance-accountability) |
| Vendor inventory reconciliation | Quarter-end → `vendor.reconciliation.completed` | Quarterly | AP/procurement cross-check | [TR-02](#tr-02-vendor-inventory-criticality-classification) |
| Pre-contract risk assessment (Medium/High) | Engagement proposed → `vendor.risk_assessment.approved` | Before contract execution | Full risk assessment package | [TR-03](#tr-03-risk-assessment-planning) |
| Emergency provisional engagement review | Provisional engagement created → `vendor.provisional_engagement.created` | 30 days | Full risk assessment | [TR-03](#tr-03-risk-assessment-planning) |
| Due diligence completion (all vendors) | Engagement proposed → `vendor.due_diligence.approved` | Before production data / NPI shared | DD package proportional to risk tier | [TR-04](#tr-04-due-diligence-amlkyc-expectations) |
| EDD refresh (BSA/AML/KYC/sanctions vendors) | Annual cycle → `vendor.edd.approved` | Annually | Enhanced due diligence package | [TR-04](#tr-04-due-diligence-amlkyc-expectations) |
| Contract clause verification | Contract drafted → `vendor.contract_clauses.verified` | Before execution | Standard clause library checklist | [TR-05](#tr-05-contract-standards-regulatory-clauses) |
| Clause library annual review | Calendar year-end → `vendor.clause_library.updated` | Annually | Full clause library review | [TR-05](#tr-05-contract-standards-regulatory-clauses) |
| Core/capital-impacting vendor annual review | Annual cycle → `vendor.core_review.completed` | Annually | Comprehensive review package | [TR-06](#tr-06-outsourcing-of-core-capital-impacting-functions) |
| Core vendor exit/contingency test | 24-month cycle → `vendor.exit_test.completed` | Every 24 months | Exit scenario test results | [TR-06](#tr-06-outsourcing-of-core-capital-impacting-functions) |
| High-risk vendor monitoring review | Annual cycle → `vendor.monitoring_review.completed` | Annually | SOC reports, metrics, pen-test results | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Medium-risk vendor monitoring review | Biennial cycle → `vendor.monitoring_review.completed` | Every 2 years | Monitoring package | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Low-risk vendor monitoring review | Triennial cycle → `vendor.monitoring_review.completed` | Every 3 years | Monitoring package | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| High-severity issue remediation plan | Issue rated high → `vendor.cap.issued` | 30 days | Corrective action plan | [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting) |
| Vendor incident notification (vendor → CU) | Vendor reports incident → `vendor.incident.reported` | Per contract SLA (target: 24 hrs of discovery) | Incident notification | [TR-08](#tr-08-vendor-incident-notification-internal-triage-sar-referral) |
| Internal triage of vendor incident | Incident received → `vendor.incident.logged` | 1 business day | Triage determination | [TR-08](#tr-08-vendor-incident-notification-internal-triage-sar-referral) |
| Exit strategy — critical/capital-impacting vendors | Vendor onboarded → `vendor.exit_plan.approved` | 90 days of onboarding | Exit strategy document | [TR-09](#tr-09-termination-exit-strategy) |
| Exit strategy refresh before termination | Termination initiated → `vendor.termination.initiated` | Before notice issued | Refreshed exit strategy | [TR-09](#tr-09-termination-exit-strategy) |
| RACI register completion | Vendor onboarded → `vendor.raci.assigned` | Before go-live | Ownership register | [TR-10](#tr-10-key-third-party-owners-raci) |
| RACI register annual review | Annual cycle → `vendor.raci_review.completed` | Annually | Updated ownership register | [TR-10](#tr-10-key-third-party-owners-raci) |
| NCUA reportable cyber-incident determination | Incident declared → `incident.declared` | 72 hours of reasonable belief | Reportability determination | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notification (if misuse likely) | Misuse determined → `incident.member.notified` | As soon as reasonably possible | Member notice | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |

---

## TR-01 — Governance & Accountability {#tr-01-governance-accountability}

**WHY (Reg cite):** The [2023 Interagency Guidance on Third-Party Relationships (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires banking organizations to maintain board-level oversight and clearly defined management accountability for third-party risk. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires NCUA-supervised credit unions to maintain a written information-security program approved by the Board, and the same governance expectations extend to the broader vendor-risk program.

**SYSTEM BEHAVIOR:** The system maintains an authoritative vendor-governance configuration (`vendor.governance_map`) that maps the Board, the Supervisory Committee, the Vendor Risk Committee, and named management roles to their third-party responsibilities. The Board or a designated committee must approve this policy and any material vendor relationship; re-approval occurs at least annually. Internal Audit reviews the entire third-party risk program at least every 24 months and reports findings to the Board. The governance map is write-restricted to the Chief Compliance Officer; read access is granted to all participants listed in the RACI. Any lapse in the annual policy re-approval cycle triggers an aging alert.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board or committee convenes to approve or re-approve this policy (`policy.board.approved`) | Current policy version (`policy.document_version`), Board resolution ID (`board.resolution_id`), approver roster (`policy.approver_id`) | Board-approved policy record + minutes reference (`policy.board.approved`; logged as `policy.board_approved_at`) | Annually (internal: 11-month alert; enforced by `policy.board_approval_due_at`) |
| Governance map is created or materially updated (`vendor.governance_map.updated`) | Role-to-responsibility mapping (`vendor.governance_map`), CCO sign-off (`vendor.governance_map`) | Updated governance configuration (`vendor.governance_map.approved`; logged as `vendor.governance_map.updated`) | Before any material vendor is approved; refreshed at least annually (enforced by `vendor.governance_review_due`) |
| Internal Audit completes program review (`vendor.program_audit.completed`) | Audit scope (`audit.engagement_scope`), prior findings (`audit.management_responses`), program documentation | Audit report delivered to Board (`audit.report.issued`; logged as `vendor.program_audit.completed`) | At least every 24 months (enforced by `vendor.program_audit_due`) |

**ALERTS/METRICS:** Alert when `policy.board_approval_due_at` is within 30 days and no `policy.board.approved` event has been emitted for the current cycle. Alert when `vendor.governance_review_due` lapses. Target: zero open governance-map vacancies at any time.

---

## TR-02 — Vendor Inventory & Criticality Classification {#tr-02-vendor-inventory-criticality-classification}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires institutions to maintain a complete inventory of third-party relationships and to apply risk-based classification. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and NCUA safeguarding expectations require identification of all parties with access to member nonpublic personal information.

**SYSTEM BEHAVIOR:** Every third party receiving compensation or accessing nonpublic member or operational data must be added to the centralized vendor inventory before contract execution. Each vendor record carries a criticality tier (`vendor.criticality_tier`: Critical / Material / Minor / Exempt), an inherent-risk rating (`vendor.inherent_risk`), and boolean flags for core/capital-impacting functions (`vendor.core_function_flag`), BSA/AML roles (`vendor.bsa_role_flag`), NPI access (`vendor.npi_access_flag`), and network connectivity (`vendor.network_access_flag`). Classification is performed by the Vendor Risk team and approved by the CCO; tier changes are write-restricted to Compliance. The inventory is reconciled against AP/procurement records at least quarterly; discrepancies block the next payment cycle until resolved. Exempt vendors (no risk now or in the future, easily replaced) are logged but require no further due diligence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| A new third party is identified for engagement (`vendor.proposed`) | Legal name (`vendor.legal_name`), service description (`vendor.service_description`), compensation flag (`vendor.compensation_flag`), NPI/network access flags (`vendor.npi_access_flag`, `vendor.network_access_flag`), BSA role flag (`vendor.bsa_role_flag`), core function flag (`vendor.core_function_flag`) | Vendor inventory record created (`vendor.inventory.created`; logged with `vendor.inventory_id`) | Before contract execution |
| Criticality classification is assigned or updated (`vendor.classification.recorded`) | Inherent-risk inputs (strategic, financial, operational, compliance, BSA/AML, reputation, cyber, capital/liquidity), criticality tier decision (`vendor.criticality_tier`), approver ID | Classification record (`vendor.classification.updated`; logged with tier and approver) | At onboarding; updated whenever material facts change |
| Quarterly inventory reconciliation is completed (`vendor.reconciliation.completed`) | AP/procurement extract, current inventory snapshot (`vendor.inventory_id`), discrepancy list | Reconciliation completion record (`vendor.reconciliation.completed`; discrepancies logged as `vendor.mi_breach.detected` if unresolved) | Quarterly (enforced by `vendor.inventory_reconciliation_due`) |

**ALERTS/METRICS:** Alert when a vendor record exists in AP/procurement but not in the inventory (reconciliation gap). Alert when `vendor.inventory_reconciliation_due` lapses. Target: zero unclassified vendors in inventory; zero AP/inventory discrepancies older than 5 business days.

---

## TR-03 — Risk Assessment & Planning {#tr-03-risk-assessment-planning}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires a pre-engagement risk assessment proportionate to the risk and complexity of the relationship. [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867) provides examination authority over service companies and underpins the expectation that institutions assess and document the risks of outsourcing arrangements before execution.

**SYSTEM BEHAVIOR:** A risk assessment covering strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity dimensions must be completed and approved before contract execution for any Medium- or High-risk vendor. The assessment is documented in `vendor.risk_assessment` and must be approved by the CCO (or delegate) before the contract is submitted. Low-risk and Exempt vendors may use a streamlined assessment. Emergency provisional engagements — where a vendor begins performing before full assessment — are flagged in `vendor.provisional_engagement` with a documented justification (`vendor.provisional_justification`) and must complete the full assessment within 30 days; the system blocks contract renewal until the provisional flag is cleared. Risk assessments are write-restricted to the Vendor Risk team; approval is write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk assessment is initiated for a proposed vendor (`vendor.risk_assessment.approved`) | Vendor inventory record (`vendor.inventory_id`), risk dimension scores (strategic, financial, operational, compliance, BSA/AML, reputation, cyber, capital/liquidity), inherent-risk rating (`vendor.inherent_risk`), business case (`vendor.business_case`) | Approved risk assessment record (`vendor.risk_assessment.approved`; logged with approver and date) | Before contract execution for Medium/High-risk vendors |
| Emergency provisional engagement is created (`vendor.provisional_engagement.created`) | Provisional justification (`vendor.provisional_justification`), emergency approval, partial risk inputs | Provisional engagement record flagged (`vendor.provisional.flagged`; logged with `vendor.provisional_review_due`) | Immediately upon provisional go-live; full assessment due within 30 days (enforced by `vendor.provisional_review_due`) |
| Provisional engagement full review is completed (`vendor.provisional.resolved`) | Completed risk assessment (`vendor.risk_assessment`), CCO approval | Provisional flag cleared (`vendor.provisional.resolved`; logged) | Within 30 days of provisional engagement creation (enforced by `vendor.provisional_review_due`) |

**ALERTS/METRICS:** Alert when `vendor.provisional_review_due` is within 5 business days and no `vendor.provisional.resolved` event has been emitted. Alert when a contract submission event is detected without a corresponding `vendor.risk_assessment.approved` for Medium/High-risk vendors. Target: zero contracts executed without an approved risk assessment.

---

## TR-04 — Due Diligence & AML/KYC Expectations {#tr-04-due-diligence-amlkyc-expectations}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires risk-proportionate due diligence before entering a third-party relationship. [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220) and NCUA BSA/AML examination expectations require that the institution remain responsible for CIP, KYC, and AML obligations even when a third party performs those functions, and that the institution document the split of BSA/AML responsibilities with any such vendor.

**SYSTEM BEHAVIOR:** A due-diligence package proportionate to the vendor's risk tier must be completed before any production data or NPI is shared with the vendor. For any vendor performing onboarding, KYC, AML monitoring, or sanctions screening functions (`vendor.bsa_role_flag = true`), enhanced due diligence (EDD) is required, including a documented BSA/AML responsibility split (`vendor.bsa_responsibility_split`) and a review of the vendor's own BSA/AML controls. The EDD package must be approved by the BSA Officer. EDD must be refreshed at least annually for BSA-role vendors; standard due diligence is refreshed on the monitoring cycle applicable to the vendor's risk tier (see [TR-07](#tr-07-ongoing-monitoring-performance-risk-reporting)). The system blocks data-sharing authorization (`vendor.data_sharing.authorized`) until `vendor.due_diligence.approved` is recorded. Due-diligence records are write-restricted to the Vendor Risk team; EDD approval is write-restricted to the BSA Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Standard due diligence is completed for a vendor (`vendor.due_diligence.approved`) | Background check, financial review (`vendor.financial_review`), SOC report (`vendor.soc_report`), security questionnaire (`vendor.security_questionnaire`), policies/procedures review, DD package artifact (`vendor.due_diligence_artifact_id`) | Approved DD record (`vendor.due_diligence.approved`; logged with approver and date) | Before production data or NPI is shared |
| Enhanced due diligence is completed for a BSA-role vendor (`vendor.edd.approved`) | Standard DD package plus BSA/AML responsibility split (`vendor.bsa_responsibility_split`), BSA function scope (`vendor.bsa_function_scope`), vendor BSA controls review, EDD artifact (`vendor.due_diligence_artifact_id`), BSA Officer approval | Approved EDD record (`vendor.edd.approved`; logged with BSA Officer approver ID) | Before production data or NPI is shared; refreshed annually (enforced by `vendor.edd_refresh_due`) |
| Annual EDD refresh is completed (`vendor.edd.approved`) | Updated BSA/AML responsibility split, refreshed vendor BSA controls evidence, EDD refresh artifact | Refreshed EDD record (`vendor.edd.approved`; logged as `vendor.edd.refreshed`) | Annually for BSA-role vendors (enforced by `vendor.edd_refresh_due`) |

**ALERTS/METRICS:** Alert when `vendor.edd_refresh_due` is within 30 days and no refresh event has been emitted. Alert when a data-sharing authorization is attempted without `vendor.due_diligence.approved`. Target: zero BSA-role vendors with an EDD package older than 12 months; zero data-sharing events without prior DD approval.

---

## TR-05 — Contract Standards & Regulatory Clauses {#tr-05-contract-standards-regulatory-clauses}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires written contracts with provisions covering scope, SLAs, audit rights, data security, BCP/DR, and termination. [GLBA / Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) requires contractual safeguards for nonpublic personal information shared with nonaffiliated third parties. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires written information-security program elements, including vendor contracts, to protect member data.

**SYSTEM BEHAVIOR:** All third-party agreements must be in writing and must include the standard clause library elements: scope and SLAs, party responsibilities and subcontractor oversight, GLBA/Reg P data-security addendum (`vendor.glba_clause`), BSA/AML and sanctions compliance, audit and examination rights, BCP/DR requirements, and termination and exit-assistance provisions. The system verifies clause presence against the current clause library version (`vendor.clause_library_version`) before contract submission is permitted (`vendor.contract.submitted`). Legal and Risk sign-off is required for any contract involving a core or capital-impacting function. Clause exceptions must be logged (`vendor.clause_exception`) with a documented rationale (`vendor.exception_rationale`) and approved by the CCO; exceptions are tracked in an exceptions register. The clause library is reviewed and updated at least annually. The clause library is write-restricted to Legal; exception approvals are write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Contract clause verification is completed before execution (`vendor.contract_clauses.verified`) | Contract draft (`vendor.contract_draft`), clause library version (`vendor.clause_library_version`), clause checklist result, Legal sign-off (for core/capital contracts), Risk sign-off (for core/capital contracts) | Clause verification record (`vendor.contract_clauses.verified`; logged with library version and any exception IDs) | Before contract execution |
| A clause exception is requested and logged (`vendor.clause_exception.requested`) | Exception scope (`vendor.clause_id`), rationale (`vendor.exception_rationale`), requesting party | Exception logged in register (`vendor.clause_exception.logged`; logged with CCO approval status) | Before contract execution; CCO approval required before submission |
| Annual clause library review is completed (`vendor.clause_library.updated`) | Current library version, Legal review, regulatory change analysis, CCO approval | Updated clause library record (`vendor.clause_library.updated`; logged with new `vendor.clause_library_version`) | Annually (enforced by `vendor.clause_library_review_due`) |

**ALERTS/METRICS:** Alert when `vendor.clause_library_review_due` lapses. Alert when a contract submission is attempted without `vendor.contract_clauses.verified`. Target: zero contracts executed without clause verification; exceptions register reviewed quarterly with zero unresolved exceptions older than 90 days.

---

## TR-06 — Outsourcing of Core & Capital-Impacting Functions {#tr-06-outsourcing-of-core-capital-impacting-functions}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) imposes heightened expectations for critical activities, including board-level awareness and robust contingency planning. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires security programs and continuity measures that address critical service providers. NCUA BSA/AML examination guidance requires that the institution maintain direct oversight of any vendor performing core BSA/AML processes.

**SYSTEM BEHAVIOR:** Any vendor operating core/ledger/card systems, settlement or funding flows, or critical BSA/AML processes is automatically tagged as mandatory High inherent risk (`vendor.core_tag`, `vendor.core_function_flag = true`) upon classification. These vendors require: (1) an annual comprehensive review (`vendor.core_review.completed`) covering financial health, operational performance, subcontractor dependencies (`vendor.dependency_map`), and BSA/AML control effectiveness; (2) board-level awareness documented in board minutes or a board report (`vendor.board_approval`); and (3) an exit/contingency plan (`vendor.exit_plan_id`) tested at least every 24 months (`vendor.exit_test.completed`). The system blocks the annual review from being marked complete without board-awareness documentation. Exit plan testing is write-restricted to the Vendor Risk team with CCO sign-off; board-awareness documentation is write-restricted to the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| A vendor is tagged as core/capital-impacting (`vendor.core_tag.applied`) | Core function scope (`vendor.core_function_scope`), classification approval, mandatory High inherent-risk assignment | Core tag applied (`vendor.core_tag.applied`; logged with `vendor.core_function_flag = true` and inherent-risk override) | At classification; before contract execution |
| Annual comprehensive review is completed for a core vendor (`vendor.core_review.completed`) | Financial review (`vendor.financial_review`), operational metrics (`vendor.mi_pack`), subcontractor dependency map (`vendor.dependency_map`), BSA/AML control review (if applicable), board-awareness documentation (`vendor.board_approval`) | Annual review record (`vendor.core_review.completed`; logged with board-awareness artifact reference) | Annually (enforced by `vendor.core_review_due`) |
| Exit/contingency plan test is completed (`vendor.exit_test.completed`) | Exit test scenario (`vendor.exit_test_scenario`), DR test results (`vendor.dr_test_results`), failover criteria (`vendor.failover_criteria`), CCO sign-off | Exit test record (`vendor.exit_test.completed`; logged with test scenario and results) | Every 24 months (enforced by `vendor.exit_test_due`) |

**ALERTS/METRICS:** Alert when `vendor.core_review_due` is within 30 days and no review event has been emitted. Alert when `vendor.exit_test_due` lapses. Target: zero core vendors without a board-awareness record in the current annual cycle; zero core vendors with an exit plan test older than 24 months.

---

## TR-07 — Ongoing Monitoring, Performance & Risk Reporting {#tr-07-ongoing-monitoring-performance-risk-reporting}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires ongoing monitoring of third-party relationships commensurate with risk, including periodic review of performance, financial condition, and control environment. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires that the institution's security program address ongoing oversight of service providers.

**SYSTEM BEHAVIOR:** Each vendor has a risk-proportionate monitoring plan: High-risk vendors are reviewed annually, Medium-risk every two years, and Low-risk every three years. Monitoring collects SOC reports (`vendor.soc_report`), performance metrics (`vendor.mi_pack`), penetration-test results (where applicable), adverse-news scans, and financial-condition updates. When a monitoring review identifies a high-severity issue (`vendor.issue_rated_high`), the system requires a corrective action plan (`vendor.cap`) within 30 days. High- and Medium-risk vendor status is reported to the Board at least annually (`vendor.board_report.delivered`). Monitoring reviews are write-restricted to the Vendor Risk team; board reports are write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Periodic monitoring review is completed (`vendor.monitoring_review.completed`) | SOC report (`vendor.soc_report`), performance metrics (`vendor.mi_pack`), adverse-news scan, financial review (`vendor.financial_review`), pen-test results (High-risk), issue severity assessment (`vendor.issue_severity`) | Monitoring review record (`vendor.monitoring_review.completed`; logged with review date and issue count) | Annually (High), every 2 years (Medium), every 3 years (Low) — enforced by `vendor.monitoring_review_due` |
| High-severity issue is identified during monitoring (`vendor.cap.issued`) | Issue detail (`vendor.issue_detail`), severity rating (`vendor.issue_severity`), responsible party | Corrective action plan issued (`vendor.cap.issued`; logged with `vendor.remediation_due`) | CAP required within 30 days of issue identification (enforced by `vendor.remediation_due`) |
| Board report on High/Medium vendor status is delivered (`vendor.board_report.delivered`) | High/Medium vendor status summary, open issues, monitoring results (`vendor.mi_trends`), CCO sign-off | Board report delivered (`vendor.board_report.delivered`; logged with board meeting reference) | At least annually (enforced by `vendor.board_report_due`) |

**ALERTS/METRICS:** Alert when `vendor.monitoring_review_due` lapses for any vendor. Alert when a CAP is open and `vendor.remediation_due` is within 5 business days. Alert when `vendor.board_report_due` lapses. Target: zero vendors with overdue monitoring reviews; zero high-severity issues without a CAP within 30 days.

---

## TR-08 — Vendor Incident Notification, Internal Triage & SAR Referral {#tr-08-vendor-incident-notification-internal-triage-sar-referral}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires contracts to include incident-notification provisions and institutions to have processes for responding to vendor incidents. [12 CFR Part 748, Appendices A and B](https://www.ecfr.gov/current/title-12/part-748) establish the credit union's security-program and member-notification obligations when a service provider incident affects member information. BSA SAR rules under [31 CFR Chapter X](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X) require the institution to file a SAR when it knows, suspects, or has reason to suspect that a transaction or pattern involves funds from illegal activity or that a vendor incident may constitute a reportable suspicious activity.

**SYSTEM BEHAVIOR:** All vendor contracts must include a notification SLA requiring the vendor to notify Pynthia Credit Union within 24 hours of discovering any security incident, data breach, or operational disruption that may affect the credit union or its members. Upon receiving a vendor incident notification, the Vendor Risk team logs the incident (`vendor.incident.logged`) and initiates internal triage within one business day to determine scope (`vendor.incident_scope`), member impact (`vendor.incident_member_count`), and containment status (`vendor.incident_containment_status`). Triage feeds the SC-01 reportability determination (see [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification)) and the BSA/SAR referral assessment. If triage indicates potential suspicious activity, the incident is referred to the BSA Officer for SAR evaluation. Vendor incident records are write-restricted to the Vendor Risk team; SAR referral decisions are write-restricted to the BSA Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor reports an incident to the credit union (`vendor.incident.reported`) | Vendor ID (`vendor.id`), incident description (`vendor.incident_scope`), discovery timestamp, affected scope (`vendor.affected_scope`), vendor contact | Vendor incident record created (`vendor.incident.logged`; logged with receipt timestamp and `vendor.incident_triage_due`) | Per contract SLA (target: vendor notifies within 24 hours of discovery) |
| Internal triage of vendor incident is completed (`vendor.incident.logged`) | Incident scope (`vendor.incident_scope`), member impact count (`vendor.incident_member_count`), containment status (`vendor.incident_containment_status`), initial severity assessment (`vendor.issue_severity`) | Triage determination record (`vendor.incident_triaged`; logged with severity, member impact, and SC-01 referral flag) | Within 1 business day of notification receipt (enforced by `vendor.incident_triage_due`) |
| BSA/SAR referral is made for a vendor incident (`vendor.incident.reported`) | Triage determination, suspicious-activity indicators, BSA Officer review | SAR referral logged (`vendor.incident_tracks_dispatched`; BSA Officer notified; SAR evaluation initiated per BSA Policy) | Immediately upon triage determination if suspicious activity is indicated; SAR filing governed by BSA Policy |

**ALERTS/METRICS:** Alert when `vendor.incident_triage_due` lapses (triage not completed within 1 business day). Alert when a vendor incident is logged with High severity and no SC-01 reportability determination has been made within 24 hours. Target: 100% of vendor incidents triaged within 1 business day; zero SAR referral decisions delayed beyond triage completion.

---

## TR-09 — Termination & Exit Strategy {#tr-09-termination-exit-strategy}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires institutions to plan for the termination of third-party relationships, including transition timelines, data migration, and alternative arrangements. [GLBA / Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) requires that member NPI be protected during and after the transition away from a service provider.

**SYSTEM BEHAVIOR:** An exit strategy must be documented and approved for all Critical and capital-impacting vendors within 90 days of onboarding. The exit strategy covers: identified alternative providers or in-house alternatives, data migration and deletion procedures (`vendor.data_deletion_attestation`), transition timelines, and member-impact mitigation. The exit strategy is stored as `vendor.exit_plan_id` and must be refreshed and re-approved before any termination notice is issued. Upon termination, the system tracks data deletion attestation (`vendor.data_deletion_attestation`) and migration evidence (`vendor.migration_evidence`) to confirm GLBA-compliant wind-down. Exit strategies are write-restricted to the Vendor Risk team with CCO approval; data-deletion attestations are write-restricted to Information Security.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Exit strategy is created and approved for a critical/capital-impacting vendor (`vendor.exit_plan.approved`) | Alternative provider analysis, data migration plan, transition timeline, data-deletion procedure, CCO approval | Approved exit strategy record (`vendor.exit_plan.approved`; logged with `vendor.exit_plan_id` and `vendor.exit_plan_due`) | Within 90 days of onboarding (enforced by `vendor.exit_plan_due`) |
| Exit strategy is refreshed before termination notice is issued (`vendor.exit_plan.approved`) | Updated alternative analysis, current data map (`vendor.data_map_id`), refreshed transition timeline, CCO re-approval | Refreshed exit strategy record (`vendor.exit_plan.refreshed`; logged before `vendor.termination.initiated`) | Before termination notice is issued |
| Vendor termination is completed and data deletion is confirmed (`vendor.exit.completed`) | Data deletion attestation (`vendor.data_deletion_attestation`), migration evidence (`vendor.migration_evidence`), destruction certificate (`vendor.destruction_certificate`) | Exit completion record (`vendor.exit.completed`; logged with deletion attestation and destruction certificate reference) | Per transition timeline in exit strategy |

**ALERTS/METRICS:** Alert when `vendor.exit_plan_due` lapses for any Critical or capital-impacting vendor. Alert when `vendor.termination.initiated` is emitted without a prior `vendor.exit_plan.refreshed` event. Target: zero Critical vendors without an approved exit strategy; zero terminations initiated without a refreshed exit plan.

---

## TR-10 — Key Third-Party Owners & RACI {#tr-10-key-third-party-owners-raci}

**WHY (Reg cite):** The [2023 Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) requires clear assignment of accountability for each third-party relationship, including business, risk, compliance, and technical ownership. Unresolved ownership gaps create accountability failures that examiners treat as program deficiencies.

**SYSTEM BEHAVIOR:** For every Critical and Material vendor, the system maintains a RACI register (`vendor.governance_map`) that assigns named owners across four dimensions: business owner, risk owner, compliance/BSA owner, and technical owner. The register must be completed before go-live; the system blocks contract execution (`vendor.contract.submitted`) when any ownership field is unresolved. The RACI register is published to all participants and reviewed at least annually. When an owner role is vacated, the system raises an alert and blocks the next monitoring review from being marked complete until a replacement is assigned. RACI assignments are write-restricted to the CCO; the published register is readable by all participants.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RACI register is completed and assigned for a Critical or Material vendor (`vendor.raci.assigned`) | Business owner ID, risk owner ID, compliance/BSA owner ID, technical owner ID, vendor ID (`vendor.id`), CCO approval | RACI assignment record (`vendor.raci.assigned`; logged with all four owner IDs) | Before go-live; blocks contract execution if incomplete |
| RACI register is reviewed and updated (`vendor.raci_review.completed`) | Current owner roster, any ownership changes, CCO sign-off | RACI review completion record (`vendor.raci_review.completed`; logged with review date and any changes) | Annually (enforced by `vendor.raci_review_due`) |
| An owner role is vacated and replacement is needed (`vendor.governance_map.updated`) | Vacated role identification, interim owner assignment (if applicable), CCO notification | Ownership gap alert emitted (`vendor.monitoring.alert`; logged with vacancy details and `vendor.raci_review_due` accelerated) | Immediately upon vacancy detection; replacement required before next monitoring review |

**ALERTS/METRICS:** Alert when any Critical or Material vendor has an unresolved RACI ownership gap. Alert when `vendor.raci_review_due` lapses. Target: zero Critical or Material vendors with unresolved ownership; zero contracts executed with incomplete RACI.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to notify NCUA as soon as possible — and no later than 72 hours after the credit union reasonably believes a reportable cyber incident has occurred — and to notify affected members when misuse of their information has occurred or is reasonably possible. The NCUA's 2023 cyber-incident notification rule (effective September 1, 2023) defines a "reportable cyber incident" as a substantial cyber incident that materially disrupts or degrades, or is reasonably likely to materially disrupt or degrade, the credit union's ability to carry out operations or deliver products and services, or that leads to unauthorized access to or use of sensitive member data.

**SYSTEM BEHAVIOR:** When an incident is declared (`incident.declared`), the system immediately opens a reportability-determination workflow. The Incident Commander (IC) and CCO must jointly assess whether the incident meets the NCUA reportable-cyber-incident threshold within 72 hours of the credit union first reasonably believing the threshold is met. The determination is recorded in `incident.reportability_determination` with a rationale (`incident.reportability_rationale`). If reportable, the system generates an NCUA notification task (`incident.ncua.notice.due_at`) and emits `incident.ncua.notified` upon submission. In parallel, the IC assesses member impact (`incident.member_impact`) and misuse likelihood (`incident.misuse_likelihood`); if misuse has occurred or is reasonably possible, member notices are dispatched using the approved template (`incident.member_notice_template`) as soon as reasonably possible. The reportability determination and all notification records are write-restricted to the CCO; the IC may update incident fields but cannot clear the reportability flag without CCO co-sign (`incident.cco_signoff`). Vendor-sourced incidents that reach this control arrive via [TR-08](#tr-08-vendor-incident-notification-internal-triage-sar-referral), which performs the initial triage and flags the SC-01 referral.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident is declared and reportability determination is initiated (`incident.declared`) | Incident description (`incident.description`), detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), IC assignment (`incident.ic_assignment_timer`) | Reportability workflow opened; IC assigned (`incident.ic.assigned`; logged with `incident.triage.due_at`) | Immediately upon declaration |
| Reportability determination is made (`incident.assessment.completed`) | Reportability assessment (`incident.reportability_assessment`), determination (`incident.reportability_determination`), rationale (`incident.reportability_rationale`), CCO sign-off (`incident.cco_signoff`) | Determination recorded (`notification.decision.recorded`; logged with determination, rationale, and CCO sign-off) | Within 72 hours of the credit union reasonably believing the incident meets the reportable threshold (enforced by `incident.ncua.notice.due_at`) |
| NCUA is notified of a reportable cyber incident (`incident.ncua.notified`) | Reportability determination, incident summary, impact scope (`incident.impact_summary`), CCO sign-off | NCUA notification submitted (`incident.ncua.notified`; logged with submission timestamp and `incident_ncua.notice.due_at`) | As soon as possible; no later than 72 hours after reasonable belief threshold is met (enforced by `incident.ncua.notice.due_at`) |
| Member-impact and misuse-likelihood assessment is completed (`incident.member_impact.confirmed`) | Member impact scope (`incident.member_impact`), misuse likelihood determination (`incident.misuse_likelihood`), data scope (`incident.data_scope`) | Member-impact determination recorded (`incident.member_impact.confirmed`; logged with misuse flag and `incident.member_notice_required`) | Concurrent with or immediately following reportability determination |
| Member notices are dispatched when misuse has occurred or is reasonably possible (`incident.member.notified`) | Approved notice template (`incident.member_notice_template`), notice content (`incident.notice_content`), affected member list, CCO approval | Member notices sent (`incident.member_notices.sent`; logged with dispatch timestamp and member count) | As soon as reasonably possible after misuse determination (no regulatory bright-line; internal SLA: within 10 business days of misuse determination) |

**ALERTS/METRICS:** Alert when `incident.ncua.notice.due_at` is within 12 hours and no `incident.ncua.notified` event has been emitted. Alert when `incident.member_notice_required = true` and no `incident.member_notices.sent` event has been emitted within 10 business days. Target: 100% of reportable incidents notified to NCUA within 72 hours; zero member-notice obligations outstanding beyond the internal SLA.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves vendor classifications, risk assessments, EDD, RACI assignments, clause exceptions, exit plans, and NCUA notifications |
| **BSA Officer** | Approves EDD for BSA-role vendors; makes SAR referral decisions |
| **Vendor Risk Team** | Executes due diligence, monitoring reviews, exit plan documentation, and incident triage |
| **Legal** | Maintains clause library; provides sign-off on core/capital-impacting contracts |
| **Procurement / Finance** | Maintains AP records; participates in quarterly inventory reconciliation |
| **Information Security / IT** | Provides security questionnaire review; confirms data-deletion attestations |
| **Business Owners** | Identify vendor needs; serve as business owners in RACI register |
| **Internal Audit** | Reviews the third-party risk program at least every 24 months; reports to Board |
| **Board of Directors / Supervisory Committee** | Approves this policy annually; receives annual High/Medium vendor status report; maintains awareness of core/capital-impacting vendor relationships |

**Review cadence:** This policy is reviewed and re-approved by the Board at least annually. The CCO may initiate an off-cycle review upon any material regulatory change, significant vendor incident, or material change to the credit union's third-party portfolio.

**Cross-references:**
- Information Security Policy (vendor information-security and data-protection control requirements)
- BSA Policy (BSA/AML due diligence on payment processors; broader BSA program)
- Record Retention Policy (vendor record retention and destruction schedules)
- Business Continuity Plan (vendor contingency planning and operational continuity)
- Privacy Policy (privacy-specific contractual clauses and NPPI sharing limits)
- Enterprise Risk Management Policy (material outsourcing implications for enterprise risk appetite)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for several vendor-domain fields.** The following codes used in this document are drawn from the registered `vendor` object in `core-vocabulary.json` and are confirmed registered: `vendor.governance_map`, `vendor.criticality_tier`, `vendor.inherent_risk`, `vendor.core_function_flag`, `vendor.bsa_role_flag`, `vendor.npi_access_flag`, `vendor.network_access_flag`, `vendor.bsa_responsibility_split`, `vendor.bsa_function_scope`, `vendor.clause_library_version`, `vendor.glba_clause`, `vendor.clause_exception`, `vendor.exception_rationale`, `vendor.soc_report`, `vendor.financial_review`, `vendor.security_questionnaire`, `vendor.due_diligence_artifact_id`, `vendor.exit_plan_id`, `vendor.exit_test_scenario`, `vendor.dr_test_results`, `vendor.failover_criteria`, `vendor.dependency_map`, `vendor.mi_pack`, `vendor.mi_trends`, `vendor.issue_severity`, `vendor.issue_rated_high`, `vendor.issue_detail`, `vendor.data_deletion_attestation`, `vendor.migration_evidence`, `vendor.destruction_certificate`, `vendor.data_map_id`, `vendor.provisional_justification`, `vendor.provisional_engagement`, `vendor.board_approval`, `vendor.business_case`, `vendor.contract_draft`, `vendor.inventory_id`, `vendor.legal_name`, `vendor.service_description`, `vendor.compensation_flag`, `vendor.core_function_scope`, `vendor.core_tag`, `vendor.affected_scope`, `vendor.incident_scope`, `vendor.incident_member_count`, `vendor.incident_containment_status`, `vendor.incident_tracks_dispatched`, `vendor.incident_triaged`. The following timer codes are confirmed registered: `vendor.annual_review_due`, `vendor.monitoring_review_due`, `vendor.edd_refresh_due`, `vendor.exit_plan_due`, `vendor.exit_test_due`, `vendor.core_review_due`, `vendor.clause_library_review_due`, `vendor.inventory_reconciliation_due`, `vendor.provisional_review_due`, `vendor.raci_review_due`, `vendor.board_report_due`, `vendor.governance_review_due`, `vendor.program_audit_due`, `vendor.incident_triage_due`, `vendor.remediation_due`. The following events are confirmed registered: `vendor.proposed`, `vendor.inventory.created`, `vendor.classification.recorded`, `vendor.classification.updated`, `vendor.reconciliation.completed`, `vendor.risk_assessment.approved`, `vendor.provisional_engagement.created`, `vendor.provisional.flagged`, `vendor.provisional.resolved`, `vendor.due_diligence.approved`, `vendor.edd.approved`, `vendor.edd.refreshed`, `vendor.contract_clauses.verified`, `vendor.clause_exception.requested`, `vendor.clause_exception.logged`, `vendor.clause_library.updated`, `vendor.core_tag.applied`, `vendor.core_review.completed`, `vendor.exit_test.completed`, `vendor.monitoring_review.completed`, `vendor.cap.issued`, `vendor.board_report.delivered`, `vendor.incident.reported`, `vendor.incident.logged`, `vendor.incident_triaged`, `vendor.exit_plan.approved`, `vendor.exit_plan.refreshed`, `vendor.exit.completed`, `vendor.raci.assigned`, `vendor.raci_review.completed`, `vendor.governance_map.approved`, `vendor.governance_map.updated`, `vendor.termination.initiated`, `vendor.data_sharing.authorized`, `vendor.mi_breach.detected`, `vendor.monitoring.alert`. Engineering should confirm all codes before the next review cycle.

- **Bank Service Company Act (12 USC §1867(c)) applicability.** The AUTHORITY_HINTS note that application of 12 USC §1867(c) depends on charter type and primary regulator. Pynthia Credit Union is NCUA-supervised; the BSCA notification obligation applies to FDIC-supervised institutions. This policy does not include a BSCA 30-day notification control. If Pynthia has any FDIC-insured subsidiaries or if the charter changes, this assumption must be revisited and a notification control added.

- **HMDA reporter status.** This policy does not include HMDA-specific vendor controls (e.g., for HMDA data-collection vendors). If Pynthia is a HMDA reporter and uses a third party for LAR data collection or submission, a supplemental control should be added referencing [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003).

- **Risk-tier definitions for "Medium" and "High" are not enumerated here.** The policy references Medium/High inherent risk but defers the scoring rubric to the Vendor Risk Assessment template maintained by the Vendor Risk team. Engineering should confirm that `vendor.inherent_risk` values are constrained to the four tiers (Critical/Material/Minor/Exempt for criticality; High/Medium/Low for inherent risk) and that the scoring rubric is version-controlled.

- **Emergency provisional engagement threshold.** The 30-day full-review deadline for provisional engagements is inferred from Patrick's notes ("emergency provisional engagements flagged for full review within 30 days"). If the Board or CCO wishes to set a shorter internal SLA (e.g., 15 business days), the `vendor.provisional_review_due` timer should be updated accordingly.

- **Vendor incident contractual SLA.** The 24-hour notification SLA is stated as a target ("e.g., 24 hours of discovery") in Patrick's notes. Actual SLAs are set in individual contracts. Engineering should confirm that `vendor.incident_triage_due` is parameterized per contract rather than hardcoded, and that the monitoring runbook alerts on any contract where no SLA is specified.

- **SAR referral process.** TR-08 references SAR evaluation and filing but defers the mechanics to the BSA Policy. The `vendor.incident_tracks_dispatched` field is used to log the BSA referral dispatch. If the BSA Policy uses a different field or event code for SAR referral intake, the two policies should be reconciled at the next joint review.

- **SC-01 shared-control source file.** The SC-01 block above was generated from the policy inputs because `shared-controls/ncua-incident-notification.md` was not available in the project root at generation time. Before publication, the CCO must verify that this block is byte-identical to the canonical shared-control file and update it if the canonical version has been revised.
```
