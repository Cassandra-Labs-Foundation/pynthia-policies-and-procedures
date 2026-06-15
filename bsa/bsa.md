---
title: BSA Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer (BSA Officer)
version: v3.0
effective: 2026-06-11
next_review: 2027-06-11
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BSA, AML, CFT, OFAC, CIP, CDD, SAR, CTR]
---

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved integrated BSA/AML/CFT/OFAC/CIP program that meets **12 CFR § 748.2** and applicable Treasury regulations in **31 CFR Chapter X**. The program verifies member identities, performs customer due diligence (including enhanced due diligence where warranted), screens against OFAC sanctions and PEP datasets, monitors and reports suspicious activity, files all required reports (CTR, SAR, CMIR, FBAR, DOEP/Form 110, Form 105, Form 114), maintains required records, escalates breaches, and operationalizes FinCEN special measures and Geographic Targeting Orders. It applies to all members, accounts, transactions, channels, and third parties of the credit union, and consolidates the formerly separate AML/CFT, OFAC, and Customer Due Diligence programs. The Chief Compliance Officer (BSA Officer) owns the program; Compliance, BSA Operations, Vendor Management, Payments Operations, HR, and Internal Audit are required participants.

***

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy approval / interim review | Board approves or material change occurs (`governance.policy_approved`) | Annual; interim ≤ 30 days of material change | Approved policy + RACI | [BSA-01](#bsa-01-governance--delegation) |
| Block account until CIP verified | Onboarding submitted (`member.application_submitted`) | Before account activation | CIP verification result | [BSA-03](#bsa-03-customer-identification-program-cip) |
| Collect & verify beneficial ownership | Legal-entity onboarding (`cdd.profile_created`) | Before account activation | BO/CDD dossier | [BSA-04](#bsa-04-cdd--edd-including-beneficial-ownership) |
| Screen and hold on OFAC hit | Pre-execution / onboarding screen (`ofac.hold_placed`) | Immediate hold; report ≤ 10 business days | Block/reject + OFAC report | [BSA-05](#bsa-05-ofac-screening--holds) |
| Triage monitoring alert | Alert generated (`bsa_alert.created`) | ≤ 2 business days | Triaged case | [BSA-06](#bsa-06-transaction-monitoring--case-management) |
| File CTR | Aggregated cash > $10,000 (`ctr.threshold_reached`) | ≤ 15 calendar days | E-filed CTR | [BSA-07](#bsa-07-ctr-filing--exemptions) |
| File SAR (suspect known) | SAR decision to file (`sar.decision_file`) | ≤ 30 days from detection | SAR + supporting docs | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| File SAR (no suspect) | SAR decision to file (`sar.decision_file`) | ≤ 60 days from detection | SAR + supporting docs | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| Continuing SAR | Ongoing activity (`sar.continuing_filed`) | Every 90 days | Continuing SAR | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| Consolidate monetary-instrument log | $3,000–$10,000 MI purchase (`monetary_instrument.purchased`) | Central log by 15th of following month | Consolidated MI log | [BSA-09](#bsa-09-monetary-instruments-log) |
| Validate Travel Rule data before wire release | Wire ≥ $3,000 (`wire_transfer.created`) | Before wire release | Wire with full Travel Rule record | [BSA-10](#bsa-10-travel-rule-wires-3000) |
| Respond to 314(a) request | SISS request received (`regulator.request_received`) | ≤ 14 days | Match response + search docs | [BSA-11](#bsa-11-information-sharing-314a-314b) |
| Escalate breach / emergent issue | Escalation created (`escalation.created`) | Ack ≤ 1 BD; action plan ≤ 5 BD | Acknowledged escalation + action plan | [BSA-12](#bsa-12-escalation-pathway) |
| File CMIR | Reportable cross-border currency (`cmir.reportable_identified`) | ≤ 15 days after receipt | E-filed Form 105 | [BSA-13](#bsa-13-cmir-cross-border-currency) |
| File FBAR | Reportable foreign accounts (`fbar.inventory_updated`) | April 15 (auto-ext. October 15) | E-filed Form 114 | [BSA-14](#bsa-14-fbar) |
| PEP hit to EDD | PEP screen hit (`pep.hit`) | Before activation for high-risk PEP | EDD file w/ elevated approval | [BSA-16](#bsa-16-pep-screening--edd) |
| Operationalize special measure / GTO | FinCEN directive received (`regulator.request_received`) | Circulate ≤ 1 BD; implement by GTO deadline | Implementation record | [BSA-17](#bsa-17-fincen-special-measures--gtos) |

***

## BSA-01 — Governance & Delegation {#bsa-01-governance--delegation}

- **WHY (Reg cite):** Federally insured credit unions must maintain a written, Board-approved BSA program with internal controls, independent testing, a designated BSA Officer, and training. [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2); AML program rule [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system maintains the policy artifact with a designated BSA Officer and a RACI registry, requires Board approval at least annually, and forces an interim review when a material change is flagged (an interim review is required within 30 days of any material change, not the next annual cycle). Monthly Board summaries of BSA/OFAC metrics are compiled and delivered. Policy publication and the BSA Officer designation are write-restricted to the Chief Compliance Officer; the Board holds read/approve rights.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board approves the BSA policy (`governance.policy_approved`) | Policy document + version (`policy.document_id`, `policy.document_version`), BSA Officer (`governance.bsa_officer_id`), RACI registry (`governance.raci_registry`) | Approved policy + Board minutes (`policy.board_approved`) | Annual (enforced by `governance.policy_review_due`) |
  | Material change declared (`org.material_change`) | Change summary (`policy.change_summary`), materiality threshold (`policy.materiality_threshold`) | Interim review record (`policy.amendment_proposed`) | 30 days (enforced by `policy.review_due_at`) |
  | BSA Officer designated (`governance.bsa_officer_designated`) | Designated officer (`governance.bsa_officer_id`), authority statement (`governance.authority_statement`) | Designation record (`governance.designation_recorded`) | At designation (no timer) |
  | Monthly Board summary compiled (`board.cash_summary.delivered`) | BSA metrics (`reporting.bsa_metrics`), OFAC metrics (`reporting.ofac_metrics`), SAR count (`reporting.sar_count`), training metrics (`reporting.training_metrics`) | Board pack + delivery log (`governance.board_report_delivered`) | Monthly (enforced by `compliance.board_report_due_at`) |

- **ALERTS/METRICS:** Policy age vs. annual deadline; days-to-interim-review aging after a material change (target zero overdue); monthly Board-pack on-time delivery rate.

***

## BSA-02 — Enterprise BSA/AML Risk Assessment {#bsa-02-enterprise-bsaaml-risk-assessment}

- **WHY (Reg cite):** A risk-based AML program requires identifying products, customers, channels, and geographies more vulnerable to abuse and tailoring controls accordingly. [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210); [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2).
- **SYSTEM BEHAVIOR:** The system maintains a product/partner/channel/geography risk catalog, computes inherent and residual risk scores, and registers EDD triggers derived from the catalog. The assessment is reviewed at least every 12–18 months or on material change (an out-of-cycle reassessment is forced when a material change is declared). Risk-catalog edits and score approvals are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk-catalog entry created (`risk.catalog_entry_created`) | Candidate profile (`risk.candidate_profile`), geography factors (`risk.geography_factors`), partner dependency (`risk.partner_dependency`), inherent score (`risk.inherent_score`) | Catalog entry + risk register snapshot (`risk.created`) | At creation (no deadline) |
  | Periodic or event-driven assessment due (`risk.assessment_completed`) | Inherent/residual ratings (`risk.inherent_rating`, `risk.residual_rating`), assessment results (`risk.assessment_results`) | Published risk assessment (`risk.assessment_published`) | 12–18 months (enforced by `risk.assessment_due_at`) |

- **ALERTS/METRICS:** Risk-assessment age vs. 12–18 month window; count of EDD triggers without a mapped control (target zero); residual-score distribution drift between cycles.

***

## BSA-03 — Customer Identification Program (CIP) {#bsa-03-customer-identification-program-cip}

- **WHY (Reg cite):** The CIP must collect required identifying information, verify identity by documentary or non-documentary means, and retain records. [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220).
- **SYSTEM BEHAVIOR:** The system enforces collection of legal name, DOB, address, and TIN, supports documentary and non-documentary verification, and blocks account activation until verification passes (activation is hard-gated on a passing verification result). Identity information is retained 5 years after account closure and verification records 5 years after they are made. Override of a vendor verification outcome is write-restricted to trained Compliance reviewers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member onboarding submitted (`member.application_submitted`) | Legal name (`entity.name`), DOB (`entity.date_of_birth`), address (`entity.address`), TIN (`entity.tin`) | Verification record created (`verification.created`) | Before activation (no separate timer) |
  | Identity verification completed (`verification.completed`) | Provider result (`verification.provider_result`), match status (`verification.match_status`), trust level (`verification.trust_level`) | Pass/deny decision + activation gate cleared (`member.activated`) | Before account activation (no timer) |
  | Verification denied (`verification.denied`) | Provider result (`verification.provider_result`), alt-path availability (`verification.alt_path_available`) | Denied record + retained CIP evidence (`document.required_set`) | At decision; retain 5 yrs (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Activations attempted without passing verification (target zero); manual-review queue aging; CIP-record retention-timer coverage gaps.

***

## BSA-04 — CDD / EDD (incl. Beneficial Ownership) {#bsa-04-cdd--edd-including-beneficial-ownership}

- **WHY (Reg cite):** Understand the nature and purpose of relationships, collect/verify beneficial owners (≥25% plus one control person), and conduct ongoing risk-based due diligence. [31 CFR §1010.230](https://www.ecfr.gov/current/title-31/part-1010#p-1010.230); [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system collects expected activity and source of funds/wealth, captures beneficial-ownership data (each owner ≥25% plus one control person), assigns a risk tier, and applies high-risk playbooks. Profiles refresh per risk tier and on event-driven changes (an ownership-change event forces an out-of-cycle refresh). EDD files are opened on registered triggers and require senior approval. Beneficial-ownership and EDD data are write-restricted to Compliance on a need-to-know basis.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Legal-entity CDD profile created (`cdd.profile_created`) | Expected activity (`cdd.expected_activity`), source of funds (`cdd.source_of_funds`), control person (`cdd.control_person`), industry code (`cdd.industry_code`), risk tier (`cdd.risk_tier`) | CDD profile + BO certification (`cdd.bo_certified`) | Before account activation (no timer) |
  | EDD trigger fires (`risk.trigger_edd`) | Source of wealth (`edd.source_of_wealth`), category checklist (`edd.category_checklist`), approver (`edd.approver_id`) | EDD file + approval (`edd.completed`) | Per risk tier (enforced by `edd.refresh_due`) |
  | Risk-tier or event-driven refresh due (`cdd.profile_refreshed`) | Risk tier (`cdd.risk_tier`), updated expected activity (`cdd.expected_activity`) | Refreshed CDD profile (`cdd.profile_refreshed`) | Per tier (enforced by `cdd.refresh_due`) |

- **ALERTS/METRICS:** % legal-entity files with all BO certified; EDD-completed-on-time rate; CDD refresh-overdue count by risk tier.

***

## BSA-05 — OFAC Screening & Holds {#bsa-05-ofac-screening--holds}

- **WHY (Reg cite):** Screen parties and payments, block or reject prohibited transactions, apply the 50% rule, manage licenses, and report. [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501); [31 CFR Part 594](https://www.ecfr.gov/current/title-31/part-594).
- **SYSTEM BEHAVIOR:** The system screens members, counterparties, and payments at onboarding and pre-execution against the current OFAC list version, auto-holds potential matches, and routes them for adjudication including the 50%-rule analysis and false-positive disposition. Confirmed hits are blocked or rejected per program and reported to OFAC within 10 business days; blocked-property annual reports are filed by September 30. OFAC records are retained 10 years (effective March 12, 2025). Block/reject decisions and license handling are write-restricted to the BSA Officer/Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Screening hold placed (`ofac.hold_placed`) | Subject identifiers (`control_result.subject_ref`), matched lists (`ofac_result.matched_lists`), match score (`ofac_result.match_score`), list version (`ofac.list_version`) | Adjudication case + hotline record (`ofac.cleared` or `ofac.blocked`) | Immediate hold (no timer) |
  | Block/reject confirmed (`ofac.blocked` / `ofac.rejected`) | Blocked property (`ofac.blocked_property`), payment instructions (`ofac.payment_instructions`) | OFAC report filed (`ofac.report_filed`) | 10 business days (enforced by `ofac.report_timer`) |
  | Annual blocked-property report due (`ofac.annual_report_filed`) | Blocked property inventory (`ofac.blocked_property`), list version (`ofac.list_version`) | Annual OFAC report (`ofac.annual_report_filed`) | By Sept 30 (enforced by `ofac.annual_report_due`) |

- **ALERTS/METRICS:** Potential-match adjudication latency; blocked/rejected reports filed within 10 BD (target 100%); OFAC 10-year retention-timer coverage.

***

## BSA-06 — Transaction Monitoring & Case Management {#bsa-06-transaction-monitoring--case-management}

- **WHY (Reg cite):** Ongoing monitoring must detect and surface suspicious activity for case investigation and SAR decisioning. [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210); SAR basis at [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320).
- **SYSTEM BEHAVIOR:** The system generates alerts from rules/models, triages each alert within 2 business days, manages investigations as cases, and routes warranted cases to a SAR/no-SAR decision within 30 days of detection. Critical real-time vendor alerts feed directly into monitoring. Case dispositions and SAR-decision authority are write-restricted to the Investigations/Compliance role.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monitoring alert generated (`bsa_alert.created`) | Alert type (`bsa_alert.alert_type`), entity hash (`bsa_alert.entity_hash`), lookback flag (`bsa_alert.requires_lookback`) | Triaged alert + case opened (`case.opened`) | 2 business days (enforced by `bsa_alert.triage_timer`) |
  | Investigation completed (`case.investigation_complete`) | Case summary (`case.summary`), evidence (`case.evidence`), owner (`case.owner_id`) | SAR/no-SAR decision (`sar.decision_file` / `sar.decision_no_file`) | 30 days from detection (enforced by `case.sar_decision_timer`) |

- **ALERTS/METRICS:** Alert triage SLA breaches (target zero past 2 BD); alert-to-SAR conversion rate; open-case aging distribution.

***

## BSA-07 — CTR Filing & Exemptions {#bsa-07-ctr-filing--exemptions}

- **WHY (Reg cite):** Report currency transactions exceeding $10,000 and administer Phase I/II exemptions via Designation of Exempt Person. [31 CFR §1010.311](https://www.ecfr.gov/current/title-31/part-1010#p-1010.311); [31 CFR §1010.306](https://www.ecfr.gov/current/title-31/part-1010#p-1010.306).
- **SYSTEM BEHAVIOR:** The system auto-aggregates cash in/out per person per business day, files CTRs electronically within 15 days of the transaction, and manages Phase I/II exemptions through a DEP list. It files a FinCEN Form 110 (Designation of Exempt Person) for each exempted entity and renews annually, and conducts annual exemption eligibility reviews (an exempt person failing the annual review has its exemption revoked and reverts to standard CTR filing). Exemption designations and revocations are write-restricted to the BSA Officer/Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Aggregated cash exceeds threshold (`ctr.threshold_reached`) | Cash-in total (`ctr.cash_in_total`), cash-out total (`ctr.cash_out_total`), exemption basis (`ctr.exemption_basis`) | E-filed CTR (`ctr.filed`) | 15 calendar days (enforced by `ctr.filing_timer`) |
  | Exemption designated (`ctr.exemption_designated`) | Exemption basis (`ctr.exemption_basis`), entity ref (`control_result.subject_ref`) | Form 110 DOEP filed (`ctr.doep_filed`) | At designation; renew annually (enforced by `ctr.exemption_review_timer`) |
  | Annual exemption review due (`ctr.exemption_reviewed`) | Exemption basis (`ctr.exemption_basis`), prior designation (`filing.filing_id`) | Reviewed exemption + renewal/revocation (`ctr.exemption_reviewed`) | Annual (enforced by `ctr.exemption_review_due`) |

- **ALERTS/METRICS:** CTRs filed within 15 days (target 100%); exemption annual-review-overdue count; DOEP renewal lapses (target zero).

***

## BSA-08 — SAR Filing & Confidentiality {#bsa-08-sar-filing--confidentiality}

- **WHY (Reg cite):** File SARs within 30 days (60 if no suspect), file continuing SARs every 90 days, retain SARs and supporting documents 5 years, and maintain SAR confidentiality. [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320).
- **SYSTEM BEHAVIOR:** The system manages the SAR decision workflow, files within 30 days when a suspect is known and 60 days when no suspect is identified, and files continuing SARs on a 90-day cadence. It retains SARs and supporting documents 5 years, restricts SAR visibility, provides monthly Board summaries, and declines subpoenas for SARs while notifying FinCEN/NCUA (a subpoena or disclosure request other than from FinCEN or an appropriate law-enforcement/regulatory agency is auto-declined). SAR records and narratives are write-restricted to the SAR review function on a strict need-to-know basis.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | SAR decision to file — suspect known (`sar.decision_file`) | Narrative (`sar.narrative`), case ref (`case.id`) | Filed SAR + supporting docs (`sar.filed`) | 30 days (enforced by `sar.filing_timer`) |
  | SAR decision to file — no suspect (`sar.decision_file`) | Narrative (`sar.narrative`), case ref (`case.id`) | Filed SAR + supporting docs (`sar.filed`) | 60 days (enforced by `sar.filing_timer`) |
  | Continuing activity review due (`sar.continuing_filed`) | Prior filing ID (`sar.prior_filing_id`), updated narrative (`sar.narrative`) | Continuing SAR (`sar.continuing_filed`) | Every 90 days (enforced by `sar.continuing_timer`) |
  | SAR disclosure request received (`sar.disclosure_request_received`) | Requester (`disclosure_detail.requester`), request doc (`disclosure_detail.request_doc`) | Declination + FinCEN/NCUA notice (`sar.disclosure_declined`) | Promptly on receipt (no timer) |

- **ALERTS/METRICS:** SARs filed within deadline by suspect/no-suspect path (target 100%); continuing-SAR cadence adherence; unauthorized SAR-access attempts (target zero).

***

## BSA-09 — Monetary Instruments Log {#bsa-09-monetary-instruments-log}

- **WHY (Reg cite):** Record purchaser identity, instrument, and serials for monetary-instrument purchases of $3,000–$10,000 in currency and retain the records. [31 CFR §1010.415](https://www.ecfr.gov/current/title-31/part-1010#p-1010.415).
- **SYSTEM BEHAVIOR:** The system captures purchaser identity, instrument type, and serial numbers for currency purchases of monetary instruments between $3,000 and $10,000 inclusive, and consolidates entries to the central log by the 15th of the following month (aggregated same-day purchases totaling $3,000 or more are treated as one reportable purchase). Records are retained 5 years. The central MI log is write-restricted to BSA Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monetary instrument purchased in currency (`monetary_instrument.purchased`) | Purchaser ID number (`mi_central_log.purchaser_id_number`), instrument type (`mi_central_log.instrument_type`), amount (`mi_central_log.amount`) | MI log entry (`mi.log_entry_created`) | At purchase (no timer) |
  | Monthly consolidation due (`mi.central_log_updated`) | Log entries (`mi_central_log.amount`), instrument types (`mi_central_log.instrument_type`) | Consolidated central MI log (`mi.central_log_updated`) | By 15th of following month (enforced by `mi.consolidation_timer`) |

- **ALERTS/METRICS:** MI log consolidation completed by the 15th (target 100%); count of MI purchases captured without serials/identity (target zero); 5-year retention-timer coverage.

***

## BSA-10 — Travel Rule (Wires ≥$3,000) {#bsa-10-travel-rule-wires-3000}

- **WHY (Reg cite):** Collect, retain, and transmit originator, beneficiary, and financial-institution identifiers for funds transfers of $3,000 or more. [31 CFR §1010.410](https://www.ecfr.gov/current/title-31/part-1010#p-1010.410).
- **SYSTEM BEHAVIOR:** The system requires and stores originator, beneficiary, and financial-institution identifiers and validates the complete Travel Rule record before a wire is released (a wire missing required originator/beneficiary/FI identifiers is blocked from release). Wire records are retained per the BSA baseline. Release authority is write-restricted to Payments Operations with second-approval controls.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Wire ≥ $3,000 created (`wire_transfer.created`) | Originator (`originator.name`, `originator.routing_number`), beneficiary (`beneficiary.name`, `beneficiary.account_number`, `beneficiary.bank_name`), amount (`wire_transfer.amount`), purpose (`wire_transfer.purpose`) | Validated wire record (`wire_transfer.record_retained`) | Before release (no timer) |
  | Wire submitted for release (`wire_transfer.submitted`) | IMAD (`wire_transfer.imad`), control results (`wire_transfer.control_results`) | Released wire + retained record (`wire_transfer.record_retained`) | Before release (no timer) |

- **ALERTS/METRICS:** Wires released with incomplete Travel Rule data (target zero); pre-release validation failure rate; wire-record retention completeness.

***

## BSA-11 — Information Sharing (314(a)/(b)) {#bsa-11-information-sharing-314a-314b}

- **WHY (Reg cite):** Respond to FinCEN 314(a) requests via SISS, search across specified lookback windows, and maintain 314(b) certification for voluntary FI-to-FI sharing. [31 CFR §1010.520](https://www.ecfr.gov/current/title-31/part-1010#p-1010.520); [31 CFR §1010.540](https://www.ecfr.gov/current/title-31/part-1010#p-1010.540).
- **SYSTEM BEHAVIOR:** The system intakes FinCEN SISS requests, searches member records across the specified lookback windows, and responds with any match within 14 days (a negative response is not required, so only matches are reported). It maintains 314(b) certification and verifies counterpart registration before any voluntary information sharing. 314(a) request files and match responses are write-restricted to the BSA Officer/designated recipients.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | SISS 314(a) request received (`regulator.request_received`) | Request scope (`fincen314a_data.request_scope`), request detail (`regulator.request_detail`) | Match response + search documentation (`regulator.response_sent`) | 14 days (enforced by `regulator.response_due_at`) |
  | 314(b) sharing initiated (`vendor.data_sharing_requested`) | Counterpart registration (`fincen314a_data.counterpart_registration`), request scope (`fincen314a_data.request_scope`) | Verified-counterpart sharing record (`vendor.data_sharing_authorized`) | At sharing (no timer) |

- **ALERTS/METRICS:** 314(a) responses within 14 days (target 100%); 314(b) certification currency; count of shares attempted without verified counterpart registration (target zero).

***

## BSA-12 — Escalation Pathway {#bsa-12-escalation-pathway}

- **WHY (Reg cite):** A risk-based program requires timely internal escalation and remediation of breaches and emergent issues, with regulator notification where applicable. [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2); [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system provides one-click breach/emergent-issue escalation to the BSA Officer/General Counsel, acknowledges internally within 1 business day, and produces an action plan within 5 business days, including regulator notifications where applicable (an escalation assessed as meeting regulator-notice criteria triggers an NCUA notification track). Escalation routing and action-plan publication are write-restricted to the BSA Officer/General Counsel.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Breach/issue escalated (`escalation.created`) | Description (`escalation_detail.description`), facts (`escalation_detail.facts`), severity (`escalation_detail.severity`), reporter (`escalation_detail.reporter_id`) | Routed + acknowledged escalation (`escalation.acknowledged`) | 1 business day (enforced by `escalation.ack_timer`) |
  | Action plan due (`escalation.action_plan_published`) | Regulatory assessment (`escalation_detail.regulatory_assessment`), severity (`escalation_detail.severity`) | Published action plan + regulator notice if applicable (`escalation.action_plan_published`) | 5 business days (enforced by `escalation.plan_timer`) |

- **ALERTS/METRICS:** Escalation acknowledgement within 1 BD (target 100%); action-plan delivery within 5 BD; count of regulator-notice-eligible escalations not routed (target zero).

***

## BSA-13 — CMIR (Cross-Border Currency) {#bsa-13-cmir-cross-border-currency}

- **WHY (Reg cite):** Report international transportation of currency or monetary instruments exceeding $10,000 on FinCEN Form 105. [31 CFR §1010.340](https://www.ecfr.gov/current/title-31/part-1010#p-1010.340).
- **SYSTEM BEHAVIOR:** The system identifies reportable cross-border shipments/receipts exceeding $10,000 and files Form 105 within 15 days after receipt (or by the mailing/shipping date when the currency does not accompany a person), storing confirmations. CMIR filings are write-restricted to BSA Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Reportable cross-border movement identified (`cmir.reportable_identified`) | Amount (`cmir_data.amount`), direction (`cmir_data.direction`), counterparty (`cmir_data.counterparty`), manifest (`cmir_data.shipment_manifest`) | E-filed Form 105 + confirmation (`cmir.filed`) | 15 days after receipt (enforced by `cmir.filing_timer`) |

- **ALERTS/METRICS:** CMIRs filed within 15 days (target 100%); count of identified shipments missing manifest data (target zero); confirmation-storage completeness.

***

## BSA-14 — FBAR {#bsa-14-fbar}

- **WHY (Reg cite):** Report foreign financial accounts with aggregate value exceeding $10,000 on FinCEN Form 114. [31 CFR §1010.350](https://www.ecfr.gov/current/title-31/part-1010#p-1010.350).
- **SYSTEM BEHAVIOR:** The system inventories foreign accounts, calendars the April 15 deadline with the automatic extension to October 15, and e-files Form 114 via the BSA system (a year with no reportable foreign accounts is recorded as a nil determination rather than a filing). FBAR filings are write-restricted to BSA Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Foreign-account inventory updated (`fbar.inventory_updated`) | Account record (`fbar_data.account_record`), authority type (`fbar_data.authority_type`) | E-filed Form 114 or nil determination (`fbar.filed` / `fbar.nil_determined`) | April 15 (auto-ext. Oct 15) (enforced by `fbar.filing_timer`) |

- **ALERTS/METRICS:** FBARs filed by deadline (target 100%); days-to-deadline aging on open foreign-account inventory; nil-determination documentation completeness.

***

## BSA-15 — High-Risk Categories (MSB, Correspondent, Private Banking) {#bsa-15-high-risk-categories-msb-correspondent-private-banking}

- **WHY (Reg cite):** Higher-risk customer categories require category-specific EDD, registration/licensing verification, and periodic refresh. [31 CFR §1010.230](https://www.ecfr.gov/current/title-31/part-1010#p-1010.230); [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system applies category checklists for MSB, correspondent, and private-banking relationships, verifies FinCEN MSB registration and applicable state licenses, captures site visits, and refreshes EDD at least annually (an MSB whose FinCEN registration cannot be confirmed is routed to escalation and held from activation). Category-EDD approvals are write-restricted to senior Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | High-risk category EDD opened (`edd.category_approved`) | Category checklist (`edd.category_checklist`), MSB registration number (`edd.msb_registration_number`), approver (`edd.approver_id`) | Category EDD file (`edd.category_approved`) | Before activation (no timer) |
  | Site visit logged (`edd.site_visit_logged`) | Site-visit report (`edd.site_visit_report`), source of wealth (`edd.source_of_wealth`) | Site-visit record (`edd.site_visit_completed`) | At visit (no timer) |
  | Annual EDD refresh due (`edd.refresh_completed`) | Category checklist (`edd.category_checklist`), registration evidence (`edd.msb_registration_number`) | Refreshed category EDD (`edd.refresh_completed`) | At least annually (enforced by `edd.refresh_due`) |

- **ALERTS/METRICS:** High-risk relationships with current EDD (target 100%); MSB registrations unverified at activation (target zero); annual-refresh-overdue count by category.

***

## BSA-16 — PEP Screening & EDD {#bsa-16-pep-screening--edd}

- **WHY (Reg cite):** PEP relationships warrant risk-based enhanced due diligence (no categorical prohibition) consistent with FFIEC supervisory expectations and the AML program rule. [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210); FFIEC BSA/AML Examination Manual (supervisory guidance).
- **SYSTEM BEHAVIOR:** The system screens applicants, beneficial owners, and signers against PEP datasets at onboarding and on refresh, routes hits to EDD with elevated approval and adjusted monitoring, and completes EDD before activation for high-risk PEPs (a high-risk PEP is hard-gated from activation until EDD is complete). PEP designation and EDD approval are write-restricted to senior Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | PEP screen hit (`pep.hit`) | PEP status (`pep_status.status`), subject role (`pep_status.subject_role`) | PEP-designated subject routed to EDD (`pep.designated`) | At screen (no timer) |
  | PEP EDD opened (`edd.pep_opened`) | Source of wealth (`edd.source_of_wealth`), approver (`edd.approver_id`) | PEP EDD file (`edd.pep_completed`) | Before activation for high-risk PEP (no timer) |
  | PEP refresh due (`pep.refresh_completed`) | PEP status (`pep_status.status`), subject role (`pep_status.subject_role`) | Refreshed PEP screen (`pep.refresh_completed`) | Per risk tier (enforced by `edd.refresh_due`) |

- **ALERTS/METRICS:** High-risk PEP activations before EDD completion (target zero); PEP-hit-to-EDD routing latency; PEP refresh-overdue count.

***

## BSA-17 — FinCEN Special Measures & GTOs {#bsa-17-fincen-special-measures--gtos}

- **WHY (Reg cite):** Maintain a documented process to receive, assess, and operationalize FinCEN special measures and Geographic Targeting Orders, with required recordkeeping/reporting. [31 USC §5318A (USA PATRIOT Act §311)](https://www.law.cornell.edu/uscode/text/31/5318A); GTO authority [31 USC §5326](https://www.law.cornell.edu/uscode/text/31/5326).
- **SYSTEM BEHAVIOR:** The system assigns intake ownership of FinCEN special measures and GTOs to the BSA Officer, circulates received directives to affected business lines within 1 business day of receipt, and implements required recordkeeping or reporting within the GTO-specified deadline (a directive whose deadline cannot be met within current capacity is escalated under BSA-12). GTO compliance records are retained 5 years. Directive intake and operationalization decisions are write-restricted to the BSA Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | FinCEN directive / GTO received (`regulator.request_received`) | Request scope (`fincen314a_data.request_scope`), request detail (`regulator.request_detail`) | Circulated directive + intake record (`regulator.request_routed`) | 1 business day to circulate (enforced by `regulator.response_due_at`) |
  | Directive operationalized (`regulator.memo_filed`) | Implementation memo (`regulator.request_detail`), retention class (`retention.record_type`) | Implementation record + retained GTO file (`regulator.memo_filed`) | GTO-specified deadline; retain 5 yrs (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Directives circulated within 1 BD (target 100%); implementation completed by GTO deadline; GTO-record 5-year retention-timer coverage.

***

## BSA-18 — Prepaid Access & Third-Party Oversight {#bsa-18-prepaid-access--third-party-oversight}

- **WHY (Reg cite):** The credit union retains accountability for outsourced BSA/AML screening; vendor due diligence, contractual data/audit/sanctions rights, and ongoing oversight are required. [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2); [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210).
- **SYSTEM BEHAVIOR:** The system requires a vendor due-diligence package, contract clauses for data access/audit/sanctions, and system program limits for prepaid access, performs an annual vendor review, and ingests real-time critical vendor alerts directly into transaction monitoring (a critical vendor alert is routed into monitoring as a same-flow input rather than a deferred review item). Vendor classification and BSA-role flagging are write-restricted to Vendor Management with Compliance approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | BSA vendor onboarded (`vendor.onboarding_started`) | DD package (`vendor_review.dd_package`), contract terms (`vendor_review.contract_terms`), BSA role flag (`vendor.bsa_role_flag`) | Approved vendor + BSA-role flag (`vendor.fl_dd_completed`) | Before go-live (no timer) |
  | Annual vendor review due (`vendor.monitoring_review_completed`) | Efficacy results (`vendor_review.efficacy_results`), MI trends (`vendor.mi_trends`) | Vendor scorecard (`vendor.monitoring_review_completed`) | Annual (enforced by `vendor.annual_review_due`) |
  | Critical vendor alert received (`vendor.critical_alert`) | Alert details (`vendor_alert.alert_details`), impact scope (`vendor_alert.impact_scope`) | Monitoring case + logged alert (`bsa_alert.created`) | Real-time (no timer) |

- **ALERTS/METRICS:** Vendor annual reviews on time (target 100%); critical-alert-to-monitoring latency; BSA vendors operating without verified DD package (target zero).

***

## BSA-19 — Training {#bsa-19-training}

- **WHY (Reg cite):** A BSA program must provide training to appropriate personnel tailored to their responsibilities, with Board/committee training tracked. [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2).
- **SYSTEM BEHAVIOR:** The system assigns role-based curricula, requires completion within 30 days of hire and annually by policy anniversary, and tracks Board/committee training separately (a new hire in a covered role who does not complete training within 30 days is flagged as lapsed). Curriculum assignment and completion records are write-restricted to HR/Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered-role hire (`hr.user.hired_covered_role`) | Hire date (`training_detail.hire_date`), role curriculum (`curriculum.role_curriculum`) | New-hire assignment (`training.assigned`) | 30 days of hire (enforced by `training.new_hire_timer`) |
  | Annual training cycle opened (`training.annual_cycle_opened`) | Role matrix (`training.role_matrix`), curriculum version (`curriculum.curriculum_version`) | Annual completion record (`training.completed`) | Annually by anniversary (enforced by `training.annual_timer`) |
  | Board session scheduled (`training.board_session_scheduled`) | Board curriculum (`curriculum.board_curriculum`), assignee (`training.assignee_id`) | Board training completion (`training.board_completed`) | Annual (enforced by `training.annual_due`) |

- **ALERTS/METRICS:** New-hire training within 30 days (target 100%); annual completion coverage %; Board-training completion tracked separately (target 100%).

***

## BSA-20 — Independent Testing {#bsa-20-independent-testing}

- **WHY (Reg cite):** Independent, risk-based testing of the BSA program is required, with scope mapped to controls and remediation tracked to closure. [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2).
- **SYSTEM BEHAVIOR:** The system schedules independent program testing every 12–18 months, maps test scope to controls, and tracks each finding's remediation to closure (a finding past its remediation-aging threshold is escalated). Independent-test scheduling and finding closure verification are write-restricted to Internal Audit.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Independent test cycle due (`audit.engagement_started`) | Engagement scope (`audit.engagement_scope`), assessment type (`audit.assessment_type`) | Independent test report (`audit.report_issued`) | 12–18 months (enforced by `audit.cycle_timer`) |
  | Finding opened (`finding.opened`) | Finding description (`finding.description`), severity (`finding.severity`), owner (`finding.owner`) | Tracked finding + remediation plan (`finding.remediation_reported`) | Per plan (enforced by `audit.remediation_timer`) |
  | Finding closure submitted (`finding.closure_logged`) | Closure evidence (`finding.closure_evidence`), management response (`finding.management_response`) | Verified closure (`finding.closure_verified`) | At verification (no timer) |

- **ALERTS/METRICS:** Independent test completed within 12–18 months (target 100%); finding-remediation aging past threshold (target zero); % findings closed on time.

***

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (BSA Officer)
- **Approvals:** Patrick Wilson, Chief Compliance Officer
- **Review Cadence:** Board approval at least annually; interim review within 30 days of any material change ([BSA-01](#bsa-01-governance--delegation)).
- **Reporting:** Monthly BSA/OFAC/SAR/training summaries to the Board ([BSA-01](#bsa-01-governance--delegation)); enterprise risk assessment refreshed every 12–18 months ([BSA-02](#bsa-02-enterprise-bsaaml-risk-assessment)); independent testing every 12–18 months ([BSA-20](#bsa-20-independent-testing)).
- **Cross-Refs (out of scope here):** Information Security Policy (information-system safeguards and cyber incident response); Third-Party Risk Policy (general vendor onboarding/oversight); Privacy Policy (member privacy/data handling); Record Retention Policy (non-BSA records); Electronic Payment Systems Policy (operational detection within payment rails). IRS/FinCEN Form 8300 is not applicable to Pynthia as a financial institution; CTR obligations under 31 CFR §1010.311 govern equivalent cash reporting ([BSA-07](#bsa-07-ctr-filing--exemptions)).

***

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several BSA-side fields and events referenced in the EVENTS tables are registered in the parsed `core-vocabulary.json` (e.g., `ctr.threshold_reached`, `sar.filing_timer`, `ofac.report_timer`, `cmir.filing_timer`, `fbar.filing_timer`, `cdd.profile_created`, `pep.hit`), while others are drawn from the agreed **Provisional codes** list (e.g., `cdd.expected_activity`, `cdd.source_of_funds`, `cdd.control_person`, `edd.source_of_wealth`, `edd.category_checklist`, `edd.msb_registration_number`, `mi.purchaser_id_number`, `mi.central_log`, `ofac.list_version`, `ofac.blocked_property`, `cmir.amount`, `fbar.account_record`, `sar.narrative`, `escalation.*`, `reporting.bsa_metrics`). These provisional spellings are used verbatim and must be registered by engineering before the next review.
- **No dedicated special-measures/GTO subject exists.** No registered or provisional subject captures FinCEN §311 special measures or GTOs directly; [BSA-17](#bsa-17-fincen-special-measures--gtos) reuses the `regulator` subject (`regulator.request_received`, `regulator.request_routed`, `regulator.memo_filed`) and the generic retention timer. A dedicated subject (e.g., `gto`/`special_measure`) is a vocabulary gap to confirm with engineering.
- **314(b) sharing modeled on vendor data-sharing events.** [BSA-11](#bsa-11-information-sharing-314a-314b) reuses `vendor.data_sharing_requested`/`vendor.data_sharing_authorized` for FI-to-FI sharing because no FI-to-FI sharing subject is registered; confirm whether a `fincen314b`-specific event set should be coined.
- **Prepaid-access program limits** are operationalized through the vendor-oversight and transaction-monitoring vocabulary ([BSA-18](#bsa-18-prepaid-access--third-party-oversight)); no prepaid-specific subject/field exists in the vocabulary and is flagged for confirmation.
- **Charter applicability confirmed.** Pynthia is treated as a federally insured credit union subject to **12 CFR §748.2**; 314(b) certification status, HMDA reporter status, and any state MSB-licensing nuances are assumed standard and to be confirmed.
- **OFAC 10-year retention effective date.** [BSA-05](#bsa-05-ofac-screening--holds) applies the 10-year OFAC retention baseline effective March 12, 2025; pre-effective-date records are assumed to follow the prior schedule unless Counsel directs otherwise.
- **Out-of-scope detection in payment rails.** Operational suspicious-activity detection within payment rails is delegated to the Electronic Payment Systems Policy; [BSA-06](#bsa-06-transaction-monitoring--case-management) assumes those signals feed BSA monitoring but does not define the rail-level detection logic.
