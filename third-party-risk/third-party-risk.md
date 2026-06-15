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

Pynthia Credit Union uses third parties to deliver products and services, but the Board and management remain fully responsible for safety and soundness, BSA/AML, sanctions, consumer protection, privacy, and capital adequacy — outsourcing the activity never outsources the responsibility. This combined Third-Party Risk Policy (merging the former Vendor Management and Outsourcing policies) governs how the institution identifies, assesses, approves, contracts with, monitors, and exits third-party relationships across the full lifecycle (Planning → Due Diligence → Contracting → Ongoing Monitoring → Termination), with explicit criticality tiering and visibility into fourth-party subcontractors. It applies to all third parties receiving compensation or accessing nonpublic member or operational data, and is centralized with the Chief Compliance Officer supported by Vendor Risk, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit. Vendor information-security controls, BSA/AML payment-processor diligence, record-retention schedules, contingency planning, privacy clauses, and ERM appetite implications are governed by the respective standalone policies named in scope.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---:|---|
| Emergency/provisional vendor engagement created | Provisional engagement flagged (`vendor.provisional_engagement_created`) | Full risk review within 30 days | Strategic/financial/operational/compliance/BSA/cyber/capital assessment | [TPR-03](#tpr-03-risk-assessment-planning) |
| Vendor reports a security incident | Vendor incident notified (`vendor.incident_reported`) | Vendor SLA ≤ 24h of discovery; internal triage ≤ 1 business day | Triage record + Part 748 App B reportability mapping | [TPR-08](#tpr-08-incident-breach-reporting) |
| Critical/capital-impacting vendor onboarded | Vendor onboarded (`vendor.onboarded`) | Exit strategy within 90 days of onboarding | Exit plan (alternates, migration/deletion, timelines) | [TPR-09](#tpr-09-termination-exit-strategy) |
| High-risk monitoring issue raised | High-severity issue rated (`vendor.mi_breach_detected`) | Remediation plan within 30 days | Accepted CAP / remediation plan | [TPR-07](#tpr-07-ongoing-monitoring-reporting) |
| Material vendor approval / re-approval | Board/committee cycle opened (`governance.board_cycle_opened`) | At least annually | Board resolution + governance map | [TPR-01](#tpr-01-governance-accountability) |
| Internal Audit program review | Audit assessment scheduled (`audit.assessment_scheduled`) | At least every 24 months | Audit report + management responses | [TPR-01](#tpr-01-governance-accountability) |

## TPR-01 — Governance & Accountability  {#tpr-01-governance-accountability}

- **WHY (Reg cite):** The Board and management retain accountability for third-party arrangements under the [Interagency Guidance on Third-Party Relationships: Risk Management (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and the NCUA security-program/board duties in [12 CFR Part 748 §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0).
- **SYSTEM BEHAVIOR:** The institution maintains an authoritative vendor-governance configuration mapping Board, committee, and management roles to third-party responsibilities, requires Board/committee approval of this policy and of material vendors, re-approves at least annually, and routes Internal Audit's program review (at least every 24 months) with management responses to the Board. Material vendor approval is blocked until the governance map is current and approved. The governance map and board-approval records are write-restricted to Compliance and the Board secretariat.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board/committee approval cycle opens (`governance.board_cycle_opened`) | Governance map (`vendor.governance_map`), materiality flag (`vendor.materiality_flag`), board package (`board.package_distributed`) | Board approval recorded + governance map approved (`vendor.board_approval_recorded`, `vendor.governance_map_approved`) | At least annually (enforced by `vendor.governance_review_due`) |
  | Internal Audit program review scheduled (`audit.assessment_scheduled`) | Program audit scope (`audit.engagement_scope`), prior findings (`finding.open_report`) | Program audit completed + report issued (`vendor.program_audit_completed`, `audit.report_issued`) | At least every 24 months (enforced by `vendor.program_audit_due`) |
  | Board report delivered (`vendor.board_report_delivered`) | High/Medium vendor status (`vendor.mi_trends`), governance map (`vendor.governance_map`) | Board report delivered + minutes recorded (`vendor.board_report_delivered`, `board.minutes_recorded`) | Per board cadence (enforced by `vendor.board_report_due`) |

- **ALERTS/METRICS:** Alert when the annual material-vendor re-approval or the 24-month audit review ages past due (`vendor.governance_review_due`, `vendor.program_audit_due`); target zero materially-changed vendors operating without current Board approval.

## TPR-02 — Vendor Inventory & Criticality Classification  {#tpr-02-vendor-inventory-classification}

- **WHY (Reg cite):** Maintaining a complete inventory and risk-based classification is a core lifecycle expectation of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and supports member-information safeguarding under [12 CFR Part 748 §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0).
- **SYSTEM BEHAVIOR:** A centralized inventory records all third parties receiving compensation or accessing data, classifies each by inherent risk and criticality (Critical/Material/Minor/Exempt), and flags core/capital-impacting/BSA roles and NPI/network access. Vendors must be added to the inventory before contract execution, and the inventory is reconciled against AP/procurement at least quarterly with discrepancies opened as reconciliation items. Exempt classification (e.g., regulated utility providers posing no risk) is recorded with rationale and remains in the inventory. Inventory creation and criticality reclassification are write-restricted to Vendor Risk.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor proposed before contracting (`vendor.proposed`) | Legal name (`vendor.legal_name`), compensation flag (`vendor.compensation_flag`), NPI/network/core/BSA flags (`vendor.npi_access_flag`, `vendor.network_access_flag`, `vendor.core_function_flag`, `vendor.bsa_role_flag`) | Inventory entry created (`vendor.inventory_created`) | Before contract execution (—) |
  | Criticality assessed (`vendor.classification_recorded`) | Inherent risk inputs (`vendor.inherent_risk`), service description (`vendor.service_description`) | Classification recorded + tier set (`vendor.classification_recorded`, `vendor.criticality_tier`) | Before contract execution (—) |
  | Quarterly AP/procurement reconciliation (`vendor.reconciliation_completed`) | Inventory snapshot (`vendor.inventory_id`), AP/procurement feed (`vendor.dependency_map`) | Reconciliation completed (`vendor.reconciliation_completed`) | Quarterly (enforced by `vendor.inventory_reconciliation_due`) |

- **ALERTS/METRICS:** Alert on any contract execution where no inventory entry exists and on quarterly-reconciliation aging (`vendor.inventory_reconciliation_due`); target zero unreconciled AP-to-inventory discrepancies older than one quarter.

## TPR-03 — Risk Assessment & Planning  {#tpr-03-risk-assessment-planning}

- **WHY (Reg cite):** Pre-contract, risk-proportionate assessment is required by the planning and due-diligence stages of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), with examination authority over service relationships under [12 USC §1867(c)](https://www.law.cornell.edu/uscode/text/12/1867).
- **SYSTEM BEHAVIOR:** A risk-proportionate assessment covering strategic, financial, operational, compliance, BSA/AML, reputation, cyber, and capital/liquidity risk must be completed and approved before contract execution for Medium/High-risk vendors. Emergency provisional engagements may proceed when flagged, but trigger a full assessment within 30 days; the provisional flag is cleared only on completion. Risk assessment approval is write-restricted to Vendor Risk with sign-off recorded per criticality tier.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor engagement proposed (`vendor.engagement_proposed`) | Inherent risk (`vendor.inherent_risk`), business case (`vendor.business_case`), risk assessment results (`risk.assessment_results`) | Risk assessment approved (`vendor.risk_assessment_approved`) | Before execution for Medium/High (enforced by `risk.product_assessment_due_at`) |
  | Emergency provisional engagement created (`vendor.provisional_engagement_created`) | Provisional justification (`vendor.provisional_justification`), inherent risk (`vendor.inherent_risk`) | Provisional engagement flagged (`vendor.provisional_flagged`) | Full review within 30 days (enforced by `vendor.provisional_review_due`) |
  | Provisional review completed (`vendor.provisional_resolved`) | Completed assessment (`risk.assessment_results`), disposition (`vendor.risk_dispositioned`) | Provisional resolved + risk dispositioned (`vendor.provisional_resolved`, `vendor.risk_dispositioned`) | Within 30 days of engagement (enforced by `vendor.provisional_review_due`) |

- **ALERTS/METRICS:** Alert on provisional engagements approaching the 30-day full-review deadline (`vendor.provisional_review_due`); target zero Medium/High vendors with executed contracts lacking an approved pre-contract assessment.

## TPR-04 — Due Diligence & AML/KYC Expectations  {#tpr-04-due-diligence-aml-kyc}

- **WHY (Reg cite):** Due diligence proportional to risk, with enhanced diligence and a documented BSA/AML responsibility split for onboarding/KYC/AML/sanctions vendors, is required under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and the BSA/CIP program rules at [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/section-1020.220), with safeguarding duties under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** A due-diligence package proportional to risk must be completed before any production data or NPI is shared. Any vendor performing onboarding, KYC, AML, sanctions, or monitoring functions requires enhanced due diligence (EDD), including a documented BSA/AML responsibility split, and the EDD must be refreshed at least annually. Data sharing is blocked until diligence is approved. EDD approval and the responsibility split are write-restricted to Compliance/BSA.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Due diligence initiated (`vendor.due_diligence_initiated`) | DD artifact (`vendor.due_diligence_artifact_id`), SOC report (`vendor.soc_report`), financial review (`vendor.financial_review`) | Due diligence approved (`vendor.due_diligence_approved`) | Before production data/NPI shared (—) |
  | BSA/AML/KYC/sanctions vendor flagged (`vendor.bsa_role_flagged`) | BSA function scope (`vendor.bsa_function_scope`), responsibility split (`vendor.bsa_responsibility_split`) | EDD approved (`vendor.edd_approved`) | Before production data/NPI shared (—) |
  | Annual EDD refresh due (`vendor.edd_refreshed`) | Refreshed evidence (`vendor.evidence_refreshed`), responsibility split (`vendor.bsa_responsibility_split`) | EDD refresh completed (`vendor.edd_refreshed`) | At least annually (enforced by `vendor.edd_refresh_due`) |
  | Data sharing requested (`vendor.data_sharing_requested`) | Data map (`vendor.data_map_id`), NPI access flag (`vendor.npi_access_flag`) | Data sharing authorized (`vendor.data_sharing_authorized`) | After diligence approval (—) |

- **ALERTS/METRICS:** Alert on any data-sharing authorization preceding diligence approval and on EDD-refresh aging (`vendor.edd_refresh_due`); target zero BSA/AML vendors without a current documented responsibility split.

## TPR-05 — Contract Standards & Regulatory Clauses  {#tpr-05-contract-standards-clauses}

- **WHY (Reg cite):** Written contracts with required regulatory clauses (data security, audit/examination rights, BCP/DR, termination/exit) reflect the contracting-stage expectations of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), GLBA/Regulation P safeguards at [12 CFR Part 1016](https://www.ecfr.gov/current/title-12/part-1016), and member-information safeguarding under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** A standard clause library (scope/SLAs, party responsibilities and subcontractor oversight, GLBA/Reg P data security, BSA/AML and sanctions, audit and examination rights, BCP/DR, termination and exit assistance) is enforced so that all required clauses are verified before execution. Capital-impacting/core contracts require Legal and Risk sign-off, clause exceptions are registered in an exceptions log, and the clause library is reviewed at least annually. The clause library and exceptions log are write-restricted to Legal and Vendor Risk.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Contract submitted for execution (`vendor.contract_submitted`) | Contract draft (`vendor.contract_draft`), clause library version (`vendor.clause_library_version`), GLBA addendum (`vendor.glba_addendum_id`) | Contract clauses verified + GLBA clause verified (`vendor.contract_clauses_verified`, `vendor.glba_clause_verified`) | Before execution (—) |
  | Required clause missing / waiver sought (`vendor.clause_exception_requested`) | Exception rationale (`vendor.exception_rationale`), clause id (`vendor.clause_id`) | Clause exception logged (`vendor.clause_exception_logged`) | Before execution (—) |
  | Annual clause library review (`vendor.clause_library_updated`) | Library version (`vendor.clause_library_version`), regulatory citations (`regulation.citation`) | Clause library updated (`vendor.clause_library_updated`) | At least annually (enforced by `vendor.clause_library_review_due`) |

- **ALERTS/METRICS:** Alert on contracts executed with unverified required clauses and on clause-library review aging (`vendor.clause_library_review_due`); target zero core/capital-impacting contracts executed without Legal and Risk sign-off.

## TPR-06 — Outsourcing of Core & Capital-Impacting Functions  {#tpr-06-core-capital-functions}

- **WHY (Reg cite):** Core/ledger/card, settlement/funding, and critical BSA/AML processing are highest-risk outsourced activities under the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), with safeguarding/board duties under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and BSA program responsibility under [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/section-1020.220).
- **SYSTEM BEHAVIOR:** Vendors operating core/ledger/card systems, settlement/funding flows, or critical BSA/AML processes are tagged as mandatory High inherent risk, requiring annual comprehensive review, board-level awareness, and enhanced exit/contingency planning tested at least every 24 months. The mandatory-High tag cannot be downgraded below the floor. The core-function tag is write-restricted to Vendor Risk; board awareness is evidenced through the governance reporting in [TPR-01](#tpr-01-governance-accountability).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Core/capital-impacting function identified (`vendor.core_function_flagged`) | Core function scope (`vendor.core_function_scope`), criticality tier (`vendor.criticality_tier`) | Core tag applied (`vendor.core_tag_applied`) | Before execution (—) |
  | Annual comprehensive core review (`vendor.core_review_completed`) | Financial review (`vendor.financial_review`), SOC report (`vendor.soc_report`), MI trends (`vendor.mi_trends`) | Core review completed (`vendor.core_review_completed`) | At least annually (enforced by `vendor.core_review_due`) |
  | Exit/contingency test executed (`vendor.exit_test_completed`) | Exit test scenario (`vendor.exit_test_scenario`), failover criteria (`vendor.failover_criteria`) | Exit test completed (`vendor.exit_test_completed`) | At least every 24 months (enforced by `vendor.exit_test_due`) |

- **ALERTS/METRICS:** Alert when a core/capital-impacting vendor's annual review or 24-month exit test ages past due (`vendor.core_review_due`, `vendor.exit_test_due`); target zero core-system vendors below the mandatory-High floor.

## TPR-07 — Ongoing Monitoring, Performance & Risk Reporting  {#tpr-07-ongoing-monitoring-reporting}

- **WHY (Reg cite):** Risk-proportionate ongoing monitoring, performance evidence, and Board reporting are required under the monitoring stage of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** A risk-proportionate monitoring plan sets review cadence (annual for High, every 2 years for Medium, every 3 years for Low) and collects SOC reports, performance metrics, and pen-test results. High-severity monitoring issues require an accepted remediation plan within 30 days, and High/Medium vendor status is reported to the Board. The monitoring plan and remediation acceptance are write-restricted to Vendor Risk.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Scheduled monitoring review due (`vendor.monitoring_review_completed`) | SOC report (`vendor.soc_report`), MI pack (`vendor.mi_pack`), criticality tier (`vendor.criticality_tier`) | Monitoring review completed (`vendor.monitoring_review_completed`) | Annual High / 2yr Medium / 3yr Low (enforced by `vendor.monitoring_review_due`) |
  | High-severity issue detected (`vendor.mi_breach_detected`) | Issue severity (`vendor.issue_severity`), issue detail (`vendor.issue_detail`) | CAP issued + remediation plan accepted (`vendor.cap_issued`, `vendor.remediation_plan_accepted`) | Remediation plan within 30 days (enforced by `vendor.remediation_due`) |
  | Monitoring period closed (`vendor.mi_period_closed`) | MI trends (`vendor.mi_trends`), board pack inputs (`vendor.mi_pack`) | Board report delivered (`vendor.board_report_delivered`) | Per board cadence (enforced by `vendor.board_report_due`) |

- **ALERTS/METRICS:** Alert on monitoring-review aging by tier and on high-severity remediation plans not accepted within 30 days (`vendor.monitoring_review_due`, `vendor.remediation_due`); track distribution of overdue SOC-report collection across the High/Medium population.

## TPR-08 — Incident & Breach Reporting  {#tpr-08-incident-breach-reporting}

- **WHY (Reg cite):** Vendor-incident notification, internal triage, and mapping to member-notice and regulator-notice duties are required under [12 CFR Part 748 Appendix A & B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748), with SAR obligations under [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/section-1020.320) and the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management).
- **SYSTEM BEHAVIOR:** Vendor contracts require notification of incidents within a contractual SLA (e.g., 24 hours of discovery); the institution triages internally within 1 business day and maps handling to SAR, member-notice, and regulator-notice requirements per Part 748 Appendix B. A vendor-linked incident is modeled as an incident record so that the institution's existing incident, member-notice, and NCUA-notice machinery applies. Reportability determination and SAR referral are write-restricted to Compliance/BSA.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor reports an incident (`vendor.incident_reported`) | Incident scope (`vendor.incident_scope`), affected scope (`vendor.affected_scope`), member count (`vendor.incident_member_count`) | Vendor incident logged + incident created (`vendor.incident_logged`, `incident.created`) | Vendor SLA ≤ 24h of discovery (enforced by `vendor.incident_triage_due`) |
  | Internal triage performed (`vendor.incident_triaged`) | Detection source (`incident.detection_source`), data scope (`incident.data_scope`), severity (`incident.severity`) | Incident triaged + reportability assessed (`incident.assessment_completed`, `incident.classified`) | 1 business day (enforced by `incident.triage_due_at`) |
  | Reportability determined (`incident.material_flagged`) | Misuse likelihood (`incident.misuse_likelihood`), reportability rationale (`incident.reportability_rationale`), SAR referral (`incident.bsa_referral_id`) | NCUA notified / member notices sent / SAR referred (`incident.ncua_notified`, `incident.member_notices_sent`) | Per Part 748 App B & SAR timelines (enforced by `incident.ncua_notice_due_at`) |

- **ALERTS/METRICS:** Alert when vendor-incident triage exceeds 1 business day or NCUA/member notice ages past due (`vendor.incident_triage_due`, `incident.triage_due_at`, `incident.ncua_notice_due_at`); target zero vendor incidents lacking a documented reportability determination.

## TPR-09 — Termination & Exit Strategy  {#tpr-09-termination-exit-strategy}

- **WHY (Reg cite):** Exit planning (alternates, data migration/deletion, transition timelines) is a termination-stage expectation of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management), with GLBA safeguarding of member data during transition under [12 CFR Part 1016](https://www.ecfr.gov/current/title-12/part-1016) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** An exit strategy (alternates, data migration/deletion, transition timelines) is maintained for all critical/capital-impacting vendors within 90 days of onboarding and refreshed and approved before any termination notice. On termination, data-deletion attestation and destruction certificates are captured to evidence GLBA-safe handling during transition. Exit-plan approval is write-restricted to Vendor Risk; data-deletion attestation is verified by Information Security/IT.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Critical/capital-impacting vendor onboarded (`vendor.onboarded`) | Criticality tier (`vendor.criticality_tier`), failover criteria (`vendor.failover_criteria`), RTO/RPO (`vendor.rto_rpo`) | Exit plan approved (`vendor.exit_plan_approved`) | Within 90 days of onboarding (enforced by `vendor.exit_plan_due`) |
  | Termination initiated (`vendor.termination_initiated`) | Refreshed exit plan (`vendor.exit_plan_refreshed`), migration evidence (`vendor.migration_evidence`) | Exit executed (`vendor.exit_executed`) | Exit plan refreshed/approved before termination notice (—) |
  | Data deletion confirmed (`vendor.destruction_completed`) | Deletion attestation (`vendor.data_deletion_attestation`), destruction certificate (`vendor.destruction_certificate`) | Exit completed (`vendor.exit_completed`) | Per transition timeline (—) |

- **ALERTS/METRICS:** Alert when a critical/capital-impacting vendor lacks an approved exit plan past 90 days from onboarding (`vendor.exit_plan_due`); target zero terminations executed without a refreshed, approved exit plan and data-deletion attestation.

## TPR-10 — Key Third-Party Owners & RACI  {#tpr-10-key-owners-raci}

- **WHY (Reg cite):** Clear ownership and accountability for material relationships is a governance expectation of the [Interagency Guidance (88 FR 37920)](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management).
- **SYSTEM BEHAVIOR:** A published register of Critical and Material relationships assigns business, risk, compliance/BSA, and technical owners; ownership must be complete before go-live and reviewed at least annually. Contract execution is blocked where ownership is unresolved. The RACI register is write-restricted to Vendor Risk.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Critical/Material vendor pending go-live (`vendor.raci_assigned`) | Governance map (`vendor.governance_map`), criticality tier (`vendor.criticality_tier`) | RACI assigned (`vendor.raci_assigned`) | Before go-live (—) |
  | Contract submitted with unresolved ownership (`vendor.contract_submitted`) | RACI register (`vendor.governance_map`), contract block state (`vendor.contract_blocked_raci`) | Contract blocked for RACI (`vendor.contract_blocked_raci`) | Before execution (—) |
  | Annual RACI review (`vendor.raci_review_completed`) | Owner roster (`vendor.governance_map`), criticality tier (`vendor.criticality_tier`) | RACI review completed (`vendor.raci_review_completed`) | At least annually (enforced by `vendor.raci_review_due`) |

- **ALERTS/METRICS:** Alert on go-live attempts and contract executions with unresolved ownership and on annual RACI-review aging (`vendor.raci_review_due`); target zero Critical/Material vendors live without a complete owner set.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the program, the centralized vendor-governance configuration, and Board reporting.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Vendor Risk, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit, as defined in the governance map ([TPR-01](#tpr-01-governance-accountability)).
- **Review cadence:** This policy and all material vendors are Board/committee-approved and re-approved at least annually; Internal Audit reviews the program at least every 24 months ([TPR-01](#tpr-01-governance-accountability)). Next scheduled policy review: 2027-07-01.
- **Cross-refs:** Vendor information-security controls — Information Security Policy; BSA/AML payment-processor diligence and the broader BSA program — BSA Policy; vendor record retention/destruction schedules — Record Retention Policy; vendor contingency/continuity — Business Continuity Plan; privacy clauses and NPPI sharing limits — Privacy Policy; material-outsourcing risk-appetite implications — Enterprise Risk Management Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** This document uses registered `vendor.*`, `incident.*`, `audit.*`, `governance.*`, `risk.*`, and registered timer codes from `core-vocabulary.json` wherever they fit. Where the policy needed a concept covered only by a provisional spelling (e.g., `vendor.id`, `vendor.dd_package`, `vendor.contract_terms`, `vendor.alert_details`, `vendor.impact_scope`, `vendor.efficacy_results`, `vendor.data_scope`), the agreed provisional spelling was used; engineering will confirm registration before the next review. No new subjects, verbs, or task types were minted.
- **BSA-responsibility-split storage.** The documented BSA/AML responsibility split for onboarding/KYC/AML/sanctions vendors is captured via `vendor.bsa_responsibility_split`; confirm whether the broader BSA program (BSA Policy) is the system of record so the split is not duplicated.
- **Vendor incidents modeled as incidents.** [TPR-08](#tpr-08-incident-breach-reporting) reuses the registered `incident.*` resource and its NCUA/member-notice timers for vendor-linked incidents rather than coining vendor-specific notice fields; confirm the vendor-incident-to-incident linkage (`vendor.incident_logged` → `incident.created`) is wired in engineering.
- **Bank Service Company Act applicability.** The 30-day service-contract notification and examination authority under 12 USC §1867(c) is cited as supporting authority; its precise applicability to Pynthia Credit Union as an NCUA-supervised credit union (vs. NCUA Part 748 / examination expectations) should be confirmed by Legal, and any required NCUA notification step added if applicable.
- **Criticality tier definitions.** Critical/Material/Minor/Exempt thresholds and the mandatory-High floor for core/capital-impacting vendors ([TPR-06](#tpr-06-core-capital-functions)) are assumed from PATRICK_NOTES; specific quantitative thresholds and the Exempt rationale standard (e.g., regulated utilities) need confirmation.
- **Vendor SLA for incident notification.** The "24 hours of discovery" vendor notification window in [TPR-08](#tpr-08-incident-breach-reporting) is stated as an example contractual SLA; confirm the binding institution standard for inclusion in the clause library ([TPR-05](#tpr-05-contract-standards-clauses)).
