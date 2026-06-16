---
title: BSA Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BSA, AML, CFT, OFAC, CIP, CDD, SAR, CTR]
---

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved integrated BSA/AML/CFT/OFAC/CIP program that meets 12 CFR § 748.2 and the Treasury (FinCEN) regulations at 31 CFR Chapter X. The program verifies member identities, understands the nature and purpose of member relationships, conducts customer and enhanced due diligence, monitors for and timely reports suspicious and reportable activity (SAR, CTR, CMIR, FBAR), screens against OFAC sanctions lists, identifies politically exposed persons, governs third-party AML/CFT screening vendors, and escalates breaches. It applies to all members, accounts, transactions, channels, and third parties. This policy consolidates the formerly separate AML/CFT, OFAC, and Customer Due Diligence programs and is centralized under the Chief Compliance Officer (BSA Officer).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy approval / interim review | Board cycle opens or material change declared (`org.material_change` → `governance.policy_approved`) | Annual; interim within 30 days of material change | Board-approved BSA policy | [BSA-01](#bsa-01-governance-delegation) |
| Enterprise risk assessment refresh | Risk cycle due (`risk.assessment_due_at`) | Every 12–18 months or on material change | Inherent/residual risk catalog | [BSA-02](#bsa-02-enterprise-bsa-aml-risk-assessment) |
| CIP before account activation | Member applies (`member.application_submitted`) | Before account activation | CIP verification record | [BSA-03](#bsa-03-customer-identification-program-cip) |
| CDD/EDD & beneficial ownership | New legal-entity account / refresh due (`cdd.profile_created` / `cdd.refresh_due`) | Before activation; refresh per risk tier | CDD/BO dossier | [BSA-04](#bsa-04-cdd-edd-beneficial-ownership) |
| OFAC screening & holds | Onboarding or pre-execution screen (`ofac.list_updated` / pre-execution) | Block/reject pre-execution; report within 10 BD | OFAC hit memo, blocking report | [BSA-05](#bsa-05-ofac-screening-holds) |
| Transaction monitoring & SAR decision | Alert generated (`bsa_alert.created`) | Triage ≤ 2 BD; SAR/no-SAR ≤ 30 days of detection | Case file | [BSA-06](#bsa-06-transaction-monitoring-case-management) |
| CTR filing | Cash aggregation threshold reached (`ctr.threshold_reached`) | E-file within 15 days | CTR | [BSA-07](#bsa-07-ctr-filing) |
| SAR filing & continuing SAR | Case decided SAR-required (`sar.decision_file`) | 30 days (suspect) / 60 days (no suspect); continuing every 90 days | SAR + supporting docs | [BSA-08](#bsa-08-sar-filing-confidentiality) |
| Monetary instrument log consolidation | $3,000–$10,000 instrument purchased (`monetary_instrument.purchased`) | Consolidate by 15th of following month | Central MI log | [BSA-09](#bsa-09-monetary-instruments-logs) |
| Travel Rule on wires ≥ $3,000 | Wire created (`wire_transfer.created`) | Validate before release | Wire record with required identifiers | [BSA-10](#bsa-10-travel-rule-wires-3000) |
| 314(a) / 314(b) information sharing | FinCEN SISS request received (`regulator.request_received`) | Respond within 14 days | Search result + certification | [BSA-11](#bsa-11-information-sharing-314a-314b) |
| Record retention | Record created (`record.created`) | 5-year BSA baseline; 10-year OFAC | Retention-tagged record | [BSA-12](#bsa-12-record-retention) |
| Breach / emergent escalation | One-click escalation (`escalation.created`) | Ack ≤ 1 BD; action plan ≤ 5 BD | Escalation + action plan | [BSA-13](#bsa-13-escalation-pathway) |
| BSA training | Hire or annual cycle (`employee.hired` / `training.annual_cycle_opened`) | Within 30 days of hire; annually by anniversary | Training completion record | [BSA-14](#bsa-14-training) |
| Independent testing | Testing cycle due (`audit.cycle_timer`) | Every 12–18 months | Test report + remediation tracking | [BSA-15](#bsa-15-independent-testing) |
| High-risk category EDD | High-risk category onboarded (`edd.category_approved`) | EDD before activation; refresh ≥ annually | Category checklist + EDD file | [BSA-16](#bsa-16-high-risk-categories-msb-correspondent-private-banking) |
| CMIR cross-border currency | Reportable shipment identified (`cmir.reportable_identified`) | File Form 105 within 15 days of receipt | CMIR (Form 105) | [BSA-17](#bsa-17-cmir-cross-border-currency) |
| FBAR foreign accounts | Foreign account inventoried (`fbar.inventory_updated`) | April 15 (auto-extension to Oct 15) | FBAR (Form 114) | [BSA-18](#bsa-18-fbar) |
| Prepaid access & third-party vendors | Vendor onboarded / critical alert (`vendor.due_diligence_initiated` / `vendor.critical_alert`) | Annual review; real-time critical alerting | Vendor DD package + review | [BSA-19](#bsa-19-prepaid-access-third-parties) |
| PEP screening & EDD | PEP hit at onboarding/refresh (`pep.hit`) | EDD before activation for high-risk PEPs | PEP EDD file | [BSA-20](#bsa-20-pep-screening-edd) |
| Special Measures / GTO intake | FinCEN order received (`regulatory.correspondence_received`) | Circulate ≤ 1 BD; implement by order deadline | Implementation + retention record | [BSA-21](#bsa-21-fincen-special-measures-gtos) |

---

## Control Overlays (Design Overlay v3)

## BSA-01 — Governance & Delegation {#bsa-01-governance-delegation}

- **WHY (Reg cite):** The Board must establish and maintain a written BSA program with internal controls, a designated BSA Officer, training, and independent testing under [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2), implementing the AML program requirement of [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The Board approves the policy at least annually and within 30 days of a material change; the system tracks the policy version, BSA Officer designation, and a RACI registry defining segregation of duties. Board review cycles open on schedule and a material-change declaration forces an interim review. Quarterly BSA/OFAC metrics packs route to the Board. Policy publication and BSA Officer designation are write-restricted to the Chief Compliance Officer (BSA Officer).

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board review cycle opens (`governance.board_cycle_opened`) | Policy document (`policy.document_id`), BSA Officer id (`governance.bsa_officer_id`), RACI registry (`governance.raci_registry`) | Approved policy version (`governance.policy_approved`) | Annual (enforced by `policy.board_approval_due_at`) |
  | Material change declared (`org.material_change`) | Change summary (`policy.change_summary`), review owner (`policy.owner_ref`) | Interim review record (`policy.board_review_started`) | 30 days (enforced by `governance.policy_review_due`) |
  | BSA Officer appointed/changed (`governance.bsa_officer_designated`) | Designation record (`governance.bsa_officer_id`), authority statement (`governance.authority_statement`) | Designation logged (`governance.designation_recorded`) | — |
  | Quarterly metrics pack assembled (`reporting.board_pack_submitted`) | BSA/OFAC/SAR/training metrics (`board_pack.bsa_metrics`, `board_pack.ofac_metrics`, `board_pack.sar_count`, `board_pack.training_metrics`) | Board report delivered (`governance.board_report_delivered`) | Quarterly (enforced by `reporting.board_pack_due`) |

- **ALERTS/METRICS:** Policy age vs. review due; target zero overdue board approvals; interim-review latency after material change; quarterly pack on-time rate.

## BSA-02 — Enterprise BSA/AML Risk Assessment {#bsa-02-enterprise-bsa-aml-risk-assessment}

- **WHY (Reg cite):** A risk-based AML program tailored to the institution's products, customers, and geographies is required by [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) and the BSA program rule at [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2).
- **SYSTEM BEHAVIOR:** The system maintains a product/partner/channel/geography risk catalog, computes inherent-to-residual scores, and sets EDD triggers. Reassessment runs every 12–18 months or on material change. Approval of the published assessment is write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk assessment cycle due (`risk.assessment_due_at`) | Candidate profiles (`risk_catalog_entry.candidate_profile`), geography factors (`risk_catalog_entry.geography_factors`), partner dependency (`risk_catalog_entry.partner_dependency`) | Catalog entry created (`risk.catalog_entry_created`) | 12–18 months (enforced by `risk.assessment_due_at`) |
  | Scoring run executed (`risk.assessment_completed`) | Inherent score (`risk.inherent_score`), impact/likelihood (`risk.impact_score`, `risk.likelihood_score`), residual rating (`risk.residual_rating`) | Assessment published (`risk.assessment_published`) | — |
  | Material change detected (`org.material_change`) | Reassessment scope (`risk.description`), owner (`risk.owner_id`) | Reassessment recorded (`risk.rating_recorded`) | On change (enforced by `risk.reassessment_due_at`) |

- **ALERTS/METRICS:** Assessment age vs. 18-month ceiling; count of residual-high catalog entries without an EDD trigger mapped; reassessment latency after material change.

## BSA-03 — Customer Identification Program (CIP) {#bsa-03-customer-identification-program-cip}

- **WHY (Reg cite):** CIP requires collecting and verifying identifying information and retaining records under [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220), incorporated into the credit-union BSA program by [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2).
- **SYSTEM BEHAVIOR:** The system enforces required identity data (legal name, DOB, address, TIN), supports documentary and non-documentary verification, and blocks account activation until verification passes. Identity information is retained 5 years after account closure and verification records 5 years after made. Override of a vendor verification outcome is write-restricted to trained Compliance reviewers.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member application submitted (`member.application_submitted`) | Legal name (`entity.name`), DOB (`entity.date_of_birth`), address (`entity.address`), TIN (`entity.tin`) | Verification created (`verification.created`) | Before activation |
  | Verification result returned (`verification.provider_result.identity_verified`) | Provider result (`verification.provider_result`), match status (`verification.match_status`), trust level (`verification.trust_level`) | Verification completed or denied (`verification.completed` / `verification.denied`) | Before activation |
  | Account activation gated (`entity.activated`) | Verification status (`verification.status`), retention anchor (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`) | Identity 5y after closure; verification records 5y after made (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Manual-review queue aging; verification pass/fail and false-positive rates; target zero activations without a passing CIP record.

## BSA-04 — CDD / EDD (incl. Beneficial Ownership) {#bsa-04-cdd-edd-beneficial-ownership}

- **WHY (Reg cite):** Ongoing CDD (nature/purpose, risk profile, monitoring) is required under [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210); beneficial-ownership collection (≥25% owners plus one control person) is required under [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/part-1010#p-1010.230).
- **SYSTEM BEHAVIOR:** The system collects expected activity, source of funds/wealth, and beneficial-ownership data for legal entities, assigns a risk tier, applies high-risk playbooks, and refreshes per tier and on event-driven changes. EDD escalation is triggered automatically when high-risk signals fire. Approval of EDD files is write-restricted to senior Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New CDD profile opened (`cdd.profile_created`) | Expected activity (`cdd.expected_activity`), source of funds (`cdd.source_of_funds`), industry code (`cdd.industry_code`), control person (`cdd.control_person`) | Profile created + risk tier (`cdd.profile_created`, `cdd.risk_tier`) | Before activation |
  | Beneficial ownership certified (`cdd.bo_certified`) | BO list and ownership %, control person (`cdd.control_person`) | BO certification (`cdd.bo_certified`) | Before activation |
  | EDD trigger fires (`risk.trigger_edd`) | Source of wealth (`edd.source_of_wealth`), category checklist (`edd.category_checklist`), approver (`edd.approver_id`) | EDD completed (`edd.completed`) | Per tier (enforced by `edd.refresh_due`) |
  | Refresh due or event-driven change (`cdd.refresh_due`) | Updated profile (`cdd.profile`), risk tier (`cdd.risk_tier`) | Profile refreshed (`cdd.profile_refreshed`) | Per risk tier (enforced by `cdd.refresh_due`) |

- **ALERTS/METRICS:** % entities with verified BO; EDD timely-completion rate; refresh compliance % by tier; target zero legal-entity activations without certified BO.

## BSA-05 — OFAC Screening & Holds {#bsa-05-ofac-screening-holds}

- **WHY (Reg cite):** OFAC sanctions compliance requires screening, blocking/rejecting, reporting, and recordkeeping under [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501) and the substantive prohibitions at [31 CFR Part 594](https://www.ecfr.gov/current/title-31/part-594).
- **SYSTEM BEHAVIOR:** The system screens members, counterparties, and payments at onboarding and pre-execution, applies the 50% rule, and blocks or rejects per program. False positives are adjudicated and licenses managed; blocked/rejected items are reported within 10 business days and an annual blocked-property report is filed. OFAC records are retained 10 years (effective March 12, 2025). Adjudication and report filing are write-restricted to Compliance/OFAC analysts.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | List updated or subject screened (`ofac.list_updated`) | Subject identifiers (`control_result.subject_ref`), list version (`ofac.list_version`), matched lists (`ofac_result.matched_lists`) | Hold placed or cleared (`ofac.hold_placed` / `ofac.cleared`) | Pre-execution |
  | Potential match confirmed (`ofac.blocked`) | Match score/status (`ofac_result.match_score`, `ofac_result.match_status`), hotline record (`ofac_control_context.hotline_record`) | Block/reject + report (`ofac.blocked` / `ofac.rejected`, `ofac.report_filed`) | Report within 10 BD (enforced by `ofac.report_timer`) |
  | Annual blocked-property cycle due (`ofac.annual_report_due`) | Blocked property (`ofac_report_data.blocked_property`), payment instructions (`ofac_report_data.payment_instructions`) | Annual report filed (`ofac.annual_report_filed`) | By Sept 30 (enforced by `ofac.annual_report_due`) |

- **ALERTS/METRICS:** Average time-to-disposition on potential matches; blocked/rejected report on-time rate; target zero payments executed before screening clears.

## BSA-06 — Transaction Monitoring & Case Management {#bsa-06-transaction-monitoring-case-management}

- **WHY (Reg cite):** Ongoing monitoring to identify and report suspicious transactions is required under [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210), with SAR timing anchored to [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320).
- **SYSTEM BEHAVIOR:** The system generates alerts from rules/models, triages them within 2 business days, manages cases through an investigation workflow, and forces a SAR/no-SAR decision within 30 days of detection where warranted. Case ownership and SAR decisions are write-restricted to Investigations/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monitoring alert generated (`bsa_alert.created`) | Alert type (`bsa_alert.alert_type`), entity hash (`bsa_alert.entity_hash`), details (`bsa_alert.details`) | Alert triaged (`case.opened`) | 2 BD (enforced by `bsa_alert.triage_timer`) |
  | Case opened for investigation (`case.opened`) | Evidence (`case.evidence`), summary (`case.summary`), owner (`case.owner_id`) | Investigation complete (`case.investigation_complete`) | — |
  | SAR/no-SAR decision required (`sar.decision_file` / `sar.decision_no_file`) | Case file (`case.id`), narrative (`sar_data.narrative`) | SAR decision recorded (`sar.decision_file` / `sar.decision_no_file`) | 30 days of detection (enforced by `case.sar_decision_timer`) |

- **ALERTS/METRICS:** Alert triage SLA breaches; alert-to-SAR conversion rate; case aging distribution; target zero cases past the 30-day decision clock.

## BSA-07 — CTR Filing {#bsa-07-ctr-filing}

- **WHY (Reg cite):** Currency transactions exceeding $10,000 must be reported under [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/part-1010#p-1010.311) with aggregation under [31 CFR § 1010.313](https://www.ecfr.gov/current/title-31/part-1010#p-1010.313); exemptions are governed by [31 CFR § 1020.315](https://www.ecfr.gov/current/title-31/part-1020#p-1020.315).
- **SYSTEM BEHAVIOR:** The system auto-aggregates cash in/out per person per business day, manages Phase I/II exemptions via the DEP list, e-files CTRs within 15 days, conducts annual exemption reviews, and files FinCEN Form 110 (Designation of Exempt Person) for each exempted entity with annual renewal. Exemption designation and CTR filing are write-restricted to BSA Operations/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Aggregation threshold reached (`ctr.threshold_reached`) | Cash-in total (`ctr.cash_in_total`), cash-out total (`ctr.cash_out_total`), exemption basis (`ctr.exemption_basis`) | CTR filed (`ctr.filed`) | 15 days (enforced by `ctr.filing_timer`) |
  | Exempt person designated (`ctr.exemption_designated`) | Exemption basis (`ctr.exemption_basis`) | DOEP filed (`ctr.doep_filed`) | 30 days after first exempted transaction |
  | Annual exemption review due (`ctr.exemption_reviewed`) | Exemption review record (`ctr.exemption_review_due`) | Exemption reviewed (`ctr.exemption_reviewed`) | Annual (enforced by `ctr.exemption_review_timer`) |

- **ALERTS/METRICS:** CTR filing on-time rate; target zero late CTRs (avoid $10k/day penalty exposure); exemption-review completion %.

## BSA-08 — SAR Filing & Confidentiality {#bsa-08-sar-filing-confidentiality}

- **WHY (Reg cite):** SAR filing timing, continuing-activity cadence, retention, and confidentiality are governed by [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320).
- **SYSTEM BEHAVIOR:** The system manages the SAR decision workflow, files within 30 days (suspect known) or 60 days (no suspect) with a 90-day continuing-SAR cadence, retains SARs and supporting documents 5 years, restricts SAR visibility, and provides monthly Board summaries. The system declines subpoenas for SARs and routes a notification to FinCEN/NCUA; a subpoena disclosure request never produces the SAR. SAR records and visibility are write-restricted to the BSA Officer and designated Investigations staff.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | SAR decision to file (`sar.decision_file`) | Narrative (`sar_data.narrative`), prior filing id (`sar_data.prior_filing_id`) | SAR filed (`sar.filed`) | 30 days suspect / 60 days no suspect (enforced by `sar.filing_timer`) |
  | Continuing activity review due (`sar.continuing_filed`) | Prior SAR (`sar_data.prior_filing_id`), updated narrative (`sar_data.narrative`) | Continuing SAR filed (`sar.continuing_filed`) | Every 90 days (enforced by `sar.continuing_timer`) |
  | SAR disclosure/subpoena received (`sar.disclosure_request_received`) | Request doc (`disclosure_detail.request_doc`), requester (`disclosure_detail.requester`) | Disclosure declined + FinCEN/NCUA notice (`sar.disclosure_declined`, `regulator.ncua_notified`) | Promptly on receipt |

- **ALERTS/METRICS:** SAR filing on-time rate; continuing-SAR cadence adherence; target zero unauthorized SAR disclosures; monthly Board-summary completeness.

## BSA-09 — Monetary Instruments Logs {#bsa-09-monetary-instruments-logs}

- **WHY (Reg cite):** Recordkeeping for monetary-instrument purchases of $3,000–$10,000 in currency is required under [31 CFR § 1010.415](https://www.ecfr.gov/current/title-31/part-1010#p-1010.415).
- **SYSTEM BEHAVIOR:** The system captures purchaser identity, instrument type, and serial numbers for $3,000–$10,000 purchases, consolidates entries to the central log by the 15th of the following month, and retains records 5 years. Aggregated same-day purchases totaling $3,000+ are treated as one purchase. The central log is write-restricted to BSA Operations.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monetary instrument purchased (`monetary_instrument.purchased`) | Purchaser id number (`mi_central_log.purchaser_id_number`), instrument type (`mi_central_log.instrument_type`), amount (`mi_central_log.amount`) | Log entry created (`mi.log_entry_created`) | At purchase |
  | Monthly consolidation due (`mi.central_log_updated`) | Log entries (`mi_central_log.amount`, `mi_central_log.instrument_type`) | Central log updated (`mi.central_log_updated`) | By 15th of following month (enforced by `mi.consolidation_timer`) |

- **ALERTS/METRICS:** Consolidation on-time rate; count of incomplete MI entries (missing serials/ID); target zero unlogged in-range purchases.

## BSA-10 — Travel Rule (Wires ≥ $3,000) {#bsa-10-travel-rule-wires-3000}

- **WHY (Reg cite):** The Funds Transfer recordkeeping and "Travel Rule" requirements for transmittals of $3,000 or more are at [31 CFR § 1010.410(e),(f)](https://www.ecfr.gov/current/title-31/part-1010#p-1010.410).
- **SYSTEM BEHAVIOR:** The system requires and stores originator, beneficiary, and financial-institution identifiers and validates their presence before wire release. A wire missing required identifiers cannot be released. Wire records are retained per BSA retention and the release gate is write-restricted to Payments Operations.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Wire created (`wire_transfer.created`) | Originator (`wire_transfer.amount`, `originator.name`, `originator.routing_number`), beneficiary (`beneficiary.name`, `beneficiary.account_number`), purpose (`wire_transfer.purpose`) | Wire validated/submitted (`wire_transfer.submitted`) | Before release |
  | Required identifiers validated (`wire_transfer.submitted`) | Transmittal identifiers (`wire_transfer.beneficiary`, `wire_transfer.imad`) | Record retained (`wire_transfer.record_retained`) | At release; retain 5 years |

- **ALERTS/METRICS:** % wires released with complete Travel Rule data; target zero releases missing required identifiers; retention completeness on wire records.

## BSA-11 — Information Sharing (314(a)/(b)) {#bsa-11-information-sharing-314a-314b}

- **WHY (Reg cite):** FinCEN 314(a) mandatory searches are governed by [31 CFR § 1010.520](https://www.ecfr.gov/current/title-31/part-1010#p-1010.520); voluntary FI-to-FI sharing under 314(b) is at [31 CFR § 1010.540](https://www.ecfr.gov/current/title-31/part-1010#p-1010.540).
- **SYSTEM BEHAVIOR:** The system intakes FinCEN SISS requests, searches deposit/funds-transfer/loan/safe-deposit records across the specified lookback windows, and responds within 14 days; positive matches are reported and negatives are not required. The system maintains 314(b) certification and verifies counterpart registration before sharing. 314(a) request files and responses are write-restricted to the BSA Officer and approved designees.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | FinCEN 314(a) request received (`regulator.request_received`) | Request scope (`fincen314a_data.request_scope`), search subjects (`regulator.request_detail`) | Match response filed (`regulator.response_sent`) | 14 days (enforced by `regulator.response_due_at`) |
  | 314(b) sharing initiated (`vendor.data_sharing_requested`) | Counterpart registration (`fincen314a_data.counterpart_registration`) | Sharing authorized (`vendor.data_sharing_authorized`) | Before sharing |

- **ALERTS/METRICS:** 314(a) response on-time rate; target zero missed 14-day deadlines; 314(b) certification currency.

## BSA-12 — Record Retention {#bsa-12-record-retention}

- **WHY (Reg cite):** BSA records must be retained for the periods specified in [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/part-1010#p-1010.430) (5-year baseline); OFAC records retain 10 years under [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501).
- **SYSTEM BEHAVIOR:** The system applies retention schedules by record type (5-year BSA baseline; 10-year OFAC), honors legal holds, and purges with audit logs. A record under legal hold is not purged until the hold is released. Hold placement/release is write-restricted to Legal/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Record created (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`) | At creation |
  | Legal hold placed/released (`record.hold_placed` / `record.hold_released`) | Hold scope (`record.hold_scope`), authorizer (`record.hold_authorizer`) | Hold applied/lifted (`record.hold_applied` / `record.hold_lifted`) | On legal direction |
  | Retention expires (`record.retention_expired`) | Disposal method (`record.disposal_method`), hold status (`record.hold_status`) | Record disposed (`record.destroyed`) | Per schedule (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Retrieval success rate; target zero purges of held records; OFAC 10-year retention coverage; stale records without index.

## BSA-13 — Escalation Pathway {#bsa-13-escalation-pathway}

- **WHY (Reg cite):** Internal controls and timely escalation/reporting of compliance breaches are required by the BSA program rule at [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) and the AML program standard at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system provides one-click breach/emergent-issue escalation to the BSA Officer/General Counsel, acknowledges internally within 1 business day, and produces an action plan within 5 business days, including regulator notifications where applicable. Escalation routing and action-plan sign-off are write-restricted to the BSA Officer/General Counsel.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Breach escalation raised (`escalation.created`) | Facts (`escalation.facts`), severity (`escalation.severity`), reporter (`escalation.reporter_id`) | Escalation routed + acknowledged (`escalation.routed`, `escalation.acknowledged`) | Ack ≤ 1 BD (enforced by `escalation.ack_timer`) |
  | Action plan required (`escalation.acknowledged`) | Regulatory assessment (`escalation_detail.regulatory_assessment`) | Action plan published (`escalation.action_plan_published`) | 5 BD (enforced by `escalation.plan_timer`) |
  | Regulator notification warranted (`escalation.action_plan_published`) | Notice criteria (`regulator.notice_criteria_met`), contacts (`regulator.contacts`) | NCUA/regulator notified (`regulator.ncua_notified`) | Per applicable rule |

- **ALERTS/METRICS:** Acknowledgement and action-plan SLA breaches; target zero escalations past 5-BD action-plan clock; regulator-notification completeness.

## BSA-14 — Training {#bsa-14-training}

- **WHY (Reg cite):** Risk-based training for appropriate personnel is a mandatory BSA program element under [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) and [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system assigns role-based curricula, requires completion within 30 days of hire and annually by policy anniversary, and tracks Board/committee training separately. Curriculum assignment and completion records are write-restricted to HR/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New hire onboarded (`employee.hired`) | Hire date (`training.hire_date`), role curriculum (`training.role_curriculum`) | Onboarding training completed (`training.onboarding_completed`) | 30 days of hire (enforced by `training.newhire_due_at`) |
  | Annual cycle opens (`training.annual_cycle_opened`) | Required curriculum (`training.required_curriculum`), content version (`training.content_version`) | Annual training completed (`training.completed`) | By policy anniversary (enforced by `training.annual_due_at`) |
  | Board training session scheduled (`training.board_session_scheduled`) | Board curriculum (`training.board_curriculum`) | Board training completed (`training.board_completed`) | Annual |

- **ALERTS/METRICS:** New-hire 30-day completion rate; annual coverage %; target zero overdue role-curriculum assignments.

## BSA-15 — Independent Testing {#bsa-15-independent-testing}

- **WHY (Reg cite):** Independent testing of the BSA program is required under [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) and [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system schedules independent program testing every 12–18 months, maps scope to controls, and tracks remediation to closure. Findings route to the Board and remediation owners are assigned. Test scheduling and report issuance are write-restricted to Internal Audit.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Testing cycle due (`audit.cycle_timer`) | Engagement scope (`audit.engagement_scope`), control mapping (`audit.annual_plan_id`) | Engagement started (`audit.engagement_started`) | 12–18 months (enforced by `audit.cycle_timer`) |
  | Test report finalized (`audit.report_issued`) | Findings (`finding.description`), overall rating (`audit.overall_rating`) | Report issued + findings opened (`audit.report_issued`, `finding.opened`) | — |
  | Finding remediation tracked (`finding.remediation_reported`) | Remediation evidence (`finding.remediation_evidence`), owner (`finding.owner`) | Finding closed (`finding.closed`) | Per plan (enforced by `audit.remediation_timer`) |

- **ALERTS/METRICS:** Testing cycle adherence; finding aging vs. due; target zero overdue critical findings; remediation closure rate.

## BSA-16 — High-Risk Categories (MSB, Correspondent, Private Banking) {#bsa-16-high-risk-categories-msb-correspondent-private-banking}

- **WHY (Reg cite):** Enhanced due diligence for higher-risk relationships is required under the risk-based AML program at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210); MSB registration verification ties to [31 CFR § 1022.380](https://www.ecfr.gov/current/title-31/part-1022#p-1022.380).
- **SYSTEM BEHAVIOR:** The system applies category checklists, verifies FinCEN MSB registration and state licenses, captures site visits, and refreshes EDD at least annually. Category approval and EDD files are write-restricted to senior Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | High-risk category onboarded (`edd.category_approved`) | Category checklist (`edd.category_checklist`), MSB registration number (`edd.msb_registration_number`), approver (`edd.approver_id`) | Category approved (`edd.category_approved`) | Before activation |
  | Site visit conducted (`edd.site_visit_completed`) | Site visit report (`edd.site_visit_report`) | Site visit logged (`edd.site_visit_logged`) | — |
  | Annual EDD refresh due (`edd.refresh_completed`) | Source of wealth (`edd.source_of_wealth`), refresh record (`edd.refresh_due`) | EDD refresh completed (`edd.refresh_completed`) | At least annually (enforced by `edd.refresh_due`) |

- **ALERTS/METRICS:** % high-risk relationships with current EDD; MSB registration verification coverage; target zero high-risk activations without a completed checklist.

## BSA-17 — CMIR (Cross-Border Currency) {#bsa-17-cmir-cross-border-currency}

- **WHY (Reg cite):** Reports of international transportation of currency or monetary instruments exceeding $10,000 (Form 105) are required under [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/part-1010#p-1010.340).
- **SYSTEM BEHAVIOR:** The system identifies reportable shipments/receipts, files Form 105 within 15 days after receipt (or by mailing/shipping date if not accompanying a person), and stores confirmations. Filing is write-restricted to BSA Operations/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Reportable shipment identified (`cmir.reportable_identified`) | Amount (`cmir_data.amount`), direction (`cmir_data.direction`), shipment manifest (`cmir_data.shipment_manifest`) | CMIR filed (`cmir.filed`) | 15 days after receipt (enforced by `cmir.filing_timer`) |

- **ALERTS/METRICS:** CMIR filing on-time rate; target zero unfiled reportable shipments; confirmation-storage completeness.

## BSA-18 — FBAR {#bsa-18-fbar}

- **WHY (Reg cite):** Reports of Foreign Bank and Financial Accounts exceeding $10,000 aggregate (FinCEN Form 114) are required under [31 CFR § 1010.350](https://www.ecfr.gov/current/title-31/part-1010#p-1010.350).
- **SYSTEM BEHAVIOR:** The system inventories foreign accounts, calendars the April 15 deadline (automatic extension to October 15), and e-files via the BSA system. A nil determination is recorded when no reportable account exists. FBAR filing is write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Foreign account inventoried (`fbar.inventory_updated`) | Account record (`fbar_data.account_record`), authority type (`fbar_data.authority_type`) | Account added (`fbar.account_added`) | At identification |
  | Annual filing due (`fbar.filed`) | Inventory (`fbar_data.account_record`) | FBAR filed (`fbar.filed`) | April 15; auto-extension to Oct 15 (enforced by `fbar.filing_timer`) |
  | No reportable account (`fbar.nil_determined`) | Inventory review (`fbar_data.account_record`) | Nil determination recorded (`fbar.nil_determined`) | By deadline |

- **ALERTS/METRICS:** FBAR filing on-time rate; target zero missed October 15 extended deadlines; inventory currency.

## BSA-19 — Prepaid Access & Third Parties {#bsa-19-prepaid-access-third-parties}

- **WHY (Reg cite):** The credit union retains accountability for outsourced AML/CFT screening under [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2); program limits and recordkeeping for prepaid access tie to the AML program at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system requires a vendor due-diligence package, enforces contract clauses for data access/audit/sanctions, applies system program limits, and conducts annual vendor review with real-time critical alerting routed into transaction monitoring. Vendors flagged with a BSA role are tracked separately. Vendor approval and contract-clause verification are write-restricted to Vendor Management/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor due diligence initiated (`vendor.due_diligence_initiated`) | DD package (`vendor_review.dd_package`), BSA role flag (`vendor.bsa_role_flag`), contract terms (`vendor_review.contract_terms`) | Due diligence completed (`vendor.fl_dd_completed`) | Before engagement |
  | Annual vendor review due (`vendor.annual_review_due_at`) | Efficacy results (`vendor_review.efficacy_results`), MI trends (`vendor.mi_trends`) | Review completed (`vendor.monitoring_review_completed`) | Annual (enforced by `vendor.annual_review_due_at`) |
  | Critical vendor alert raised (`vendor.critical_alert`) | Alert details (`vendor_alert.alert_details`), impact scope (`vendor_alert.impact_scope`) | Alert logged into monitoring (`vendor.incident_logged`) | Real-time (enforced by `vendor.incident_triage_due`) |

- **ALERTS/METRICS:** Annual review on-time rate; critical-alert ingestion latency into monitoring; target zero active BSA-role vendors without a current DD package.

## BSA-20 — PEP Screening & EDD {#bsa-20-pep-screening-edd}

- **WHY (Reg cite):** Risk-based EDD for politically exposed persons is an expectation under the AML program at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) and the FFIEC BSA/AML Examination Manual (PEP guidance — no categorical prohibition).
- **SYSTEM BEHAVIOR:** The system screens applicants, beneficial owners, and signers against PEP datasets at onboarding and refresh, routes hits to EDD with elevated approval and adjusted monitoring, and completes EDD before activation for high-risk PEPs. PEP designation and EDD approval are write-restricted to senior Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | PEP screen returns a hit (`pep.hit`) | Subject role (`pep_status.subject_role`), status (`pep_status.status`) | PEP designated (`pep.designated`) | At onboarding/refresh |
  | High-risk PEP EDD required (`edd.pep_opened`) | Source of wealth (`edd.source_of_wealth`), approver (`edd.approver_id`) | PEP EDD completed (`edd.pep_completed`) | Before activation (enforced by `edd.refresh_due`) |
  | PEP refresh due (`pep.refresh_completed`) | Updated PEP status (`pep_status.status`) | Refresh completed (`pep.refresh_completed`) | Per risk tier (enforced by `edd.refresh_due`) |

- **ALERTS/METRICS:** PEP screening coverage of applicants/BOs/signers; target zero high-risk PEP activations without completed EDD; refresh compliance %.

## BSA-21 — FinCEN Special Measures & GTOs {#bsa-21-fincen-special-measures-gtos}

- **WHY (Reg cite):** Special measures under USA PATRIOT Act § 311 are implemented through [31 CFR § 1010.651–1010.661](https://www.ecfr.gov/current/title-31/part-1010); Geographic Targeting Orders are authorized under [31 CFR § 1010.370](https://www.ecfr.gov/current/title-31/part-1010#p-1010.370).
- **SYSTEM BEHAVIOR:** The system maintains a documented process to receive, assess, and operationalize FinCEN special measures and any Geographic Targeting Orders directed at the credit union or its sector. Intake ownership is assigned to the BSA Officer; the order circulates to affected business lines within 1 business day of receipt; required recordkeeping or reporting is implemented within the GTO-specified deadline; and GTO compliance records are retained 5 years. Intake assessment and implementation sign-off are write-restricted to the BSA Officer.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | FinCEN order received (`regulatory.correspondence_received`) | Source document (`regulatory.source_doc`), change identified (`regulatory.change_identified`) | Change analysis logged + circulated (`regulatory.change_analysis_logged`) | Circulate ≤ 1 BD (enforced by `regulatory.analysis_due_at`) |
  | Required controls implemented (`regulatory.change_analysis_logged`) | Change required flag (`regulatory.change_required`), implementation record (`regulatory.change_implemented`) | Implementation recorded (`record.created`) | By order-specified deadline |
  | GTO compliance records retained (`record.created`) | Retention class (`record.retention_class`), anchor (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`) | 5 years (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Circulation latency vs. 1-BD target; implementation on-time rate vs. order deadline; target zero GTO records outside the 5-year retention schedule.

---

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (BSA Officer)
- **Approvals:** Patrick Wilson, Chief Compliance Officer
- **Required Participants:** Compliance, BSA Operations, Vendor Management, Payments Operations, HR, Internal Audit
- **Review Cadence:** Board approval at least annually; interim review within 30 days of a material change (see [BSA-01](#bsa-01-governance-delegation)).
- **Reporting:** Quarterly BSA/OFAC metrics to the Board; monthly SAR summaries (see [BSA-08](#bsa-08-sar-filing-confidentiality)).
- **Cross-Refs (out of scope here):** Information Security Policy (system safeguards, cyber incident response); Third-Party Risk Policy (general vendor onboarding/oversight); Privacy Policy (member data handling); Record Retention Policy (non-BSA schedules); Electronic Payment Systems Policy (operational detection within payment rails). Form 8300 is not applicable to the credit union; cash reporting is governed by CTR obligations in [BSA-07](#bsa-07-ctr-filing).

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is partially provisional.** Most BSA-side resources, fields, events, and timers referenced in the control overlays are registered in `core-vocabulary.json`. Where a control needed a concept registered only under "Provisional codes" — notably `cmir.amount`, `cmir.counterparty`, `cmir.direction`, `cmir.shipment_manifest`, `mi.amount`, `mi.central_log`, `mi.instrument_type`, `mi.purchaser_id_number`, `fbar.account_record`, `fbar.authority_type`, `pep.status`, `pep.subject_role`, `fincen.counterpart_registration`, `fincen.request_scope`, and `ofac.hotline_record` — the exact provisional spelling was used and will be confirmed by engineering before the next review.
- **No registered subject for "special measures / GTO."** BSA-21 reuses the `regulatory` subject (`regulatory.correspondence_received`, `regulatory.change_analysis_logged`, `regulatory.change_implemented`) plus generic `record` retention codes because no § 311/GTO-specific subject exists in the registry. Confirm whether a dedicated subject should be minted.
- **SAR subpoena-decline notification path.** BSA-08 routes the FinCEN/NCUA notice via `regulator.ncua_notified`; confirm whether a distinct FinCEN-notification event is required versus reusing the NCUA notification path.
- **OFAC 10-year retention effective date.** Retention schedules assume the 10-year OFAC retention requirement effective March 12, 2025 is applied prospectively and retroactively per program; confirm scope of legacy records.
- **HMDA / charter applicability.** This policy assumes Pynthia is a federally insured credit union subject to 12 CFR § 748.2; HMDA reporter status and any NCUA Part 701.31 applicability are out of scope for the BSA program and handled in their own policies.
- **CTR exemption (Phase I/II) DEP list source of truth.** BSA-07 assumes the DEP list and FinCEN Form 110 renewals are maintained within the CTR exemption workflow; confirm the system of record and annual-renewal automation.
- **Travel Rule intermediary role.** BSA-10 assumes Pynthia acts as originator/beneficiary institution; if it acts as a receiving intermediary, confirm pass-through identifier obligations are wired into the same release gate.
