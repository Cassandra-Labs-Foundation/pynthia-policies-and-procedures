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

Pynthia Credit Union maintains a risk-based, Board-approved, integrated BSA/AML/CFT/OFAC/CIP program that satisfies 12 CFR § 748.2 and the Treasury regulations at 31 CFR Chapter X. The program verifies member identity, understands the nature and purpose of each relationship, performs customer and enhanced due diligence, monitors for and timely reports suspicious activity, files all required currency and cross-border reports, screens against OFAC sanctions and PEP datasets, maintains required records, and escalates breaches. It applies to every member, account, transaction, channel, and third party of the credit union, and consolidates the formerly separate AML/CFT, OFAC, and Customer Due Diligence programs into one policy owned by the Chief Compliance Officer acting as BSA Officer.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Cash transactions cross the CTR threshold | Aggregated cash in/out > $10,000 per person per business day (`ctr.threshold_reached`) | 15 calendar days | FinCEN CTR (Form 112) | [BS-07](#bs-07--ctr-filing--exemptions) |
| Suspicious activity detected, suspect known | BSA alert triaged to a SAR case (`case.opened`) | 30 calendar days | FinCEN SAR | [BS-08](#bs-08--sar-filing--confidentiality) |
| Suspicious activity detected, no suspect identified | SAR case opened with no identified subject (`case.opened`) | 60 calendar days | FinCEN SAR | [BS-08](#bs-08--sar-filing--confidentiality) |
| Continuing suspicious activity under prior SAR | Continuing-activity review reached (`sar.continuing_filed`) | 120 days (every 90 days of activity) | FinCEN SAR (continuing) | [BS-08](#bs-08--sar-filing--confidentiality) |
| Monetary instrument sold for $3,000–$10,000 in currency | MI purchase logged (`monetary_instrument.purchased`) | By the 15th of the following month | MI Central Log | [BS-09](#bs-09--monetary-instruments-log) |
| Wire of $3,000 or more presented for release | Wire created (`wire_transfer.created`) | Before release | Travel Rule record | [BS-10](#bs-10--travel-rule-wires--3000) |
| FinCEN 314(a) request received | SISS request intake (`sar.disclosure_request_received`) | 14 calendar days | 314(a) search response | [BS-11](#bs-11--information-sharing-314a314b) |
| Reportable cross-border currency shipment/receipt | CMIR-reportable item identified (`cmir.reportable_identified`) | 15 days after receipt | FinCEN Form 105 | [BS-17](#bs-17--cmir-cross-border-currency) |
| Reportable foreign financial accounts exist | Annual FBAR cycle (`fbar.inventory_updated`) | April 15 (auto-extension Oct 15) | FinCEN Form 114 | [BS-18](#bs-18--fbar-foreign-account-reporting) |
| OFAC true match on a blocked party/property | OFAC hold placed (`ofac.hold_placed`) | 10 business days (block report) | OFAC blocking/reject report | [BS-05](#bs-05--ofac-screening--holds) |
| Breach or emergent BSA issue raised | Escalation created (`escalation.created`) | Ack 1 BD; action plan 5 BD | Escalation record + action plan | [BS-13](#bs-13--escalation-pathway) |
| FinCEN special measure or GTO received | Order intake recorded (`scope_registry.entry_updated`) | Circulate 1 BD; implement per order | GTO/special-measure operational record | [BS-21](#bs-21--fincen-special-measures--gtos) |

## BS-01 — Governance & Delegation {#bs-01--governance--delegation}

**WHY (Reg cite):** The Board must establish and maintain a written BSA/AML program, designate a qualified BSA compliance officer, and approve the program — [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2) and the four-pillar requirement at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210), with the fifth pillar (risk-based CDD) at [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/section-1010.230).

**SYSTEM BEHAVIOR:** The Board adopts the integrated BSA/AML/OFAC policy, designates the Chief Compliance Officer as BSA Officer, and records the RACI registry that defines roles and segregation of duties across Compliance, BSA Operations, Vendor Management, Payments Operations, HR, and Internal Audit. The policy is approved at least annually, with an interim review opened within 30 days of any material change. Segregation-of-duties conflicts are detected and either remediated or covered by an approved compensating control before they take effect. The policy document, the BSA Officer designation, and the RACI registry are write-restricted to the BSA Officer and the Board secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| BSA Officer designated by the Board (`governance.bsa_officer_designated`) | Designated officer (`governance.bsa_officer_id`), authority statement (`governance.authority_statement`) | Recorded designation in policy record (`governance.designation_recorded`) | At adoption and on change of officer |
| Board approves or re-approves the program (`governance.policy_approved`) | Policy version (`policy.version`), RACI registry (`governance.raci_registry`) | Board-approved policy of record + minutes (`policy.board_approved`) | Annually (enforced by `governance.policy_review_due`) |
| Material change flagged in the program (`policy.material_change_flagged`) | Change summary (`policy.change_summary`) | Interim review opened (`policy.board_review_started`) | 30 days (enforced by `governance.review_timer`) |
| Segregation-of-duties conflict detected (`sod.conflict_detected`) | Conflicting roles, RACI registry (`governance.raci_registry`) | Compensating control approved or violation logged (`sod.compensating_control_approved`) | Before role takes effect |

**ALERTS/METRICS:** Alert when the annual approval timer (`governance.policy_review_due`) is within 30 days of breach or when an interim review remains open past 30 days; target zero unresolved `sod.conflict_detected` events lacking an approved compensating control.

## BS-02 — Enterprise BSA/AML Risk Assessment {#bs-02--enterprise-bsaaml-risk-assessment}

**WHY (Reg cite):** A risk-based program requires a documented assessment of the products, members, channels, and geographies that drive ML/TF risk — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and the CDD risk-profile expectation at [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/section-1010.230).

**SYSTEM BEHAVIOR:** The credit union maintains a product/partner/channel/geography risk catalog, computes inherent-to-residual risk scores, and sets the EDD triggers that downstream controls consume. The assessment is reviewed every 12–18 months or on a material change in products, partners, or geography. The risk catalog and scoring methodology are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk-assessment cycle opened or refreshed (`compliance.risk_assessment_completed`) | Candidate profile (`risk.candidate_profile`), partner dependency (`risk.partner_dependency`), geography factors (`risk.geography_factors`), inherent score (`risk.inherent_score`) | Updated risk catalog + EDD triggers (`compliance.risk_assessment_completed`) | Every 12–18 months or on material change (enforced by `compliance.risk_assessment_due`) |
| Monitoring coverage assessed against the catalog (`monitoring.coverage_reported`) | Monitoring scope (`monitoring.scope`) | Coverage report filed (`monitoring.coverage_reported`) | Each review cycle (enforced by `monitoring.coverage_review_due`) |

**ALERTS/METRICS:** Alert when the assessment is within 60 days of its 18-month outer bound (`compliance.risk_assessment_due`); track the count of monitoring-coverage gaps reported against the current catalog.

## BS-03 — Customer Identification Program (CIP) {#bs-03--customer-identification-program-cip}

**WHY (Reg cite):** Before opening an account the credit union must obtain and verify identifying information — [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/section-1020.220) — and retain CIP records under [31 CFR § 1020.220(a)(3)](https://www.ecfr.gov/current/title-31/section-1020.220).

**SYSTEM BEHAVIOR:** Account opening requires legal name, date of birth, address, and TIN, and supports documentary or non-documentary verification. The system blocks account activation until identity is verified. Identity information is retained for 5 years after account closure and verification records for 5 years after the record is made. Identity records are write-restricted to onboarding staff and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member application submitted (`member.application_submitted`) | Legal name (`entity.name`), date of birth (`entity.date_of_birth`), address (`entity.address`), TIN (`entity.tin`) | Required identity set recorded (`document.required_set`) | At onboarding |
| Identity verified documentary or non-documentary (`entity.activated`) | Identity verification result (`provider_result.identity_verified`), document verification (`provider_result.document_verified`) | Verified member activated (`member.activated`) | Before account activation |
| Identity verification cannot complete | Verification result (`provider_result.identity_verified`) | Activation withheld, member left disabled (`entity.disabled`) | Until verified |

**ALERTS/METRICS:** Target zero accounts activated (`account.created`) without a preceding `member.activated`; alert on aging unverified applications older than the onboarding SLA.

## BS-04 — CDD / EDD & Beneficial Ownership {#bs-04--cdd--edd--beneficial-ownership}

**WHY (Reg cite):** The credit union must understand the nature and purpose of each relationship, conduct ongoing monitoring, and collect beneficial-ownership information for legal-entity members — [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/section-1010.230).

**SYSTEM BEHAVIOR:** Onboarding collects expected activity, source of funds/wealth, and beneficial-ownership information (each natural person owning 25% or more, plus one control person). High-risk relationships follow category playbooks and refresh per risk tier and on event-driven changes (such as an address change or an activity anomaly). CDD profiles and beneficial-ownership certifications are write-restricted to BSA Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CDD profile created at onboarding (`cdd.profile_created`) | Expected activity (`cdd.expected_activity`), source of funds (`cdd.source_of_funds`), industry code (`cdd.industry_code`), risk tier (`cdd_profile.risk_tier`) | CDD profile of record (`cdd.profile_created`) | At onboarding |
| Beneficial owners and control person collected (`cdd.bo_certified`) | Beneficial owners (`cdd.control_person`), source of wealth (`edd.source_of_wealth`) | Certified BO record (`cdd.bo_certified`) | At onboarding for legal-entity members |
| Risk-tier or event-driven change occurs (`cdd.profile_refreshed`) | Updated risk tier (`cdd_profile.risk_tier`), expected activity (`cdd.expected_activity`) | Refreshed CDD profile (`cdd.profile_refreshed`) | Per risk tier (enforced by `cdd.refresh_due`) |
| Enhanced due diligence completed for higher-risk member (`edd.completed`) | EDD file (`edd.file`), approver (`edd.approver_id`) | Completed EDD file (`edd.completed`) | Per tier (enforced by `edd.refresh_due`) |

**ALERTS/METRICS:** Alert when a CDD or EDD refresh timer (`cdd.refresh_due`, `edd.refresh_due`) is overdue; track the count of legal-entity members lacking a certified `cdd.bo_certified` record.

## BS-05 — OFAC Screening & Holds {#bs-05--ofac-screening--holds}

**WHY (Reg cite):** The credit union must screen members, counterparties, and payments against OFAC lists, block or reject as required, and report blocked/rejected transactions — [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501), including the report requirement at [31 CFR § 501.603](https://www.ecfr.gov/current/title-31/section-501.603) and recordkeeping at [31 CFR § 501.601](https://www.ecfr.gov/current/title-31/section-501.601).

**SYSTEM BEHAVIOR:** The credit union screens members, counterparties, and payments at onboarding and pre-execution, applying the OFAC 50% rule to ownership chains. True matches are blocked or rejected per the program; false positives are cleared and logged; licenses are tracked. Required reports are filed under Part 501 and OFAC records are retained 10 years (effective March 12, 2025). The list version, hotline records, and clearing decisions are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Party or payment screened (`ofac.hold_placed`) | Match status (`ofac_result.match_status`), match score (`ofac_result.match_score`), matched lists (`ofac_result.matched_lists`), list version (`ofac.list_version`) | Hold placed pending review (`ofac.hold_placed`) | At onboarding and pre-execution |
| True match confirmed and property blocked (`ofac.blocked`) | Blocked property (`ofac.blocked_property`), payment instructions (`ofac.payment_instructions`) | Blocking action + OFAC report (`ofac.report_filed`) | 10 business days for the block report |
| Prohibited transaction rejected (`ofac.rejected`) | Match status (`ofac_result.match_status`), payment instructions (`ofac.payment_instructions`) | Rejection + OFAC report (`ofac.report_filed`) | 10 business days for the reject report |
| False positive cleared (`ofac.cleared`) | Hotline/review record (`ofac.hotline_record`) | Cleared screen logged (`ofac.cleared`) | At review |
| Annual blocked-property report due (`ofac.annual_report_filed`) | Blocked property (`ofac.blocked_property`) | Annual OFAC report filed (`ofac.annual_report_filed`) | By Sept 30 each year (enforced by `ofac.annual_report_due`) |

**ALERTS/METRICS:** Alert on any open `ofac.hold_placed` approaching the block/reject report deadline; target zero payments released while an unresolved OFAC hold exists; monitor false-positive clearance latency.

## BS-06 — Transaction Monitoring & Case Management {#bs-06--transaction-monitoring--case-management}

**WHY (Reg cite):** The program must include ongoing monitoring to identify and report suspicious transactions — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/section-1020.320).

**SYSTEM BEHAVIOR:** Rules and models generate BSA alerts that are triaged within 2 business days. Alerts warranting investigation become cases; investigators work the case and reach a SAR/no-SAR decision within 30 days of detection where warranted. Alerts, cases, and dispositions are write-restricted to BSA Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring rule or model fires (`bsa_alert.created`) | Alert type (`bsa_alert.alert_type`), details (`bsa_alert.details`), lookback flag (`bsa_alert.requires_lookback`) | BSA alert queued for triage (`bsa_alert.created`) | Real time |
| Alert triaged (`case.opened`) | Alert (`bsa_alert.id`), triage timer (`bsa_alert.triage_timer`) | Case opened or alert cleared (`case.opened`) | 2 business days (enforced by `bsa_alert.triage_timer`) |
| Investigation completed (`case.investigation_complete`) | Case evidence (`case.evidence`), summary (`case.summary`) | Investigation outcome recorded (`case.investigation_complete`) | Within case SLA |

**ALERTS/METRICS:** Alert on alerts aging past the 2-business-day triage timer (`bsa_alert.triage_timer`) and on open cases approaching the 30-day SAR-decision timer (`case.sar_decision_timer`); track alert-to-case conversion rate.

## BS-07 — CTR Filing & Exemptions {#bs-07--ctr-filing--exemptions}

**WHY (Reg cite):** Currency transactions over $10,000 per person per business day must be reported on a CTR, and eligible persons may be exempted — [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/section-1010.311), [§ 1010.306](https://www.ecfr.gov/current/title-31/section-1010.306) (filing within 15 days), and the exemption rules at [31 CFR § 1020.315](https://www.ecfr.gov/current/title-31/section-1020.315).

**SYSTEM BEHAVIOR:** The system auto-aggregates cash in and out per person per business day, manages Phase I/II exemptions on the Designation of Exempt Person (DEP) list, and e-files CTRs within 15 days. Exemptions are reviewed annually and a FinCEN Form 110 (DOEP) is filed for each exempted entity with annual renewal. Exemption designations are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Aggregated cash crosses the threshold (`ctr.threshold_reached`) | Cash-in total (`ctr.cash_in_total`), cash-out total (`ctr.cash_out_total`) | CTR prepared (`filing.type` = ctr) | Detection same business day |
| CTR e-filed (`ctr.filed`) | CTR data (`ctr.cash_in_total`, `ctr.cash_out_total`) | Filed CTR + confirmation (`ctr.filed`) | 15 days (enforced by `ctr.filing_timer`) |
| Exempt person designated (`ctr.exemption_designated`) | Exemption basis (`ctr.exemption_basis`) | DOEP (Form 110) filed (`ctr.doep_filed`) | At designation |
| Annual exemption review reached (`ctr.exemption_reviewed`) | Exemption basis (`ctr.exemption_basis`) | Reviewed/renewed exemption (`ctr.exemption_reviewed`) | Annually (enforced by `ctr.exemption_review_due`) |

**ALERTS/METRICS:** Alert on any `ctr.threshold_reached` without a `ctr.filed` within 15 days (`ctr.filing_timer`); track the count of exemptions past their annual review (`ctr.exemption_review_due`).

## BS-08 — SAR Filing & Confidentiality {#bs-08--sar-filing--confidentiality}

**WHY (Reg cite):** The credit union must file a SAR for qualifying suspicious activity, maintain confidentiality, and retain supporting records — [12 CFR § 748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1) and [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/section-1020.320).

**SYSTEM BEHAVIOR:** The SAR workflow decides file/no-file, files within 30 days when a suspect is known and 60 days when no suspect is identified, and follows a 90-day continuing-activity cadence. SARs and supporting documents are retained 5 years. SAR visibility is restricted to authorized BSA staff and the Board's monthly summary; the system declines subpoenas for SARs and notifies FinCEN/NCUA. SAR records and narratives are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| SAR case ready for decision (`sar.decision_file`) | Narrative (`sar.narrative`), prior filing (`sar.prior_filing_id`) | SAR filed (`sar.filed`) | 30 days suspect known / 60 days no suspect (enforced by `sar.filing_timer`) |
| No-file decision reached (`sar.decision_no_file`) | Case summary (`case.summary`) | No-SAR decision recorded (`sar.decision_no_file`) | Within decision SLA (enforced by `case.sar_decision_timer`) |
| Continuing activity reviewed (`sar.continuing_filed`) | Prior filing (`sar.prior_filing_id`), narrative (`sar.narrative`) | Continuing SAR filed (`sar.continuing_filed`) | 120 days / every 90 days of activity (enforced by `sar.continuing_review_due`) |
| SAR disclosure/subpoena request received (`sar.disclosure_request_received`) | Requester (`disclosure_detail.requester`), request doc (`disclosure_detail.request_doc`) | Disclosure declined + regulator notice (`sar.disclosure_declined`) | On receipt |
| Monthly Board SAR summary due (`board.minutes_recorded`) | SAR count (`reporting.sar_count`) | Board summary delivered (`governance.board_report_delivered`) | Monthly |

**ALERTS/METRICS:** Alert on SAR cases approaching the 30/60-day filing timer (`sar.filing_timer`) and on continuing-activity reviews approaching their 90-day cadence (`sar.continuing_review_due`); target zero unauthorized SAR accesses.

## BS-09 — Monetary Instruments Log {#bs-09--monetary-instruments-log}

**WHY (Reg cite):** Sales of monetary instruments for currency of $3,000–$10,000 require recording purchaser identity, the instrument, and serial numbers — [31 CFR § 1010.415](https://www.ecfr.gov/current/title-31/section-1010.415).

**SYSTEM BEHAVIOR:** For monetary-instrument purchases of $3,000–$10,000 in currency, the system captures purchaser identity, instrument type, and serial numbers, then consolidates entries to the central log by the 15th of the following month and retains them 5 years. The central MI log is write-restricted to BSA Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monetary instrument purchased in the reportable band (`monetary_instrument.purchased`) | Purchaser ID (`mi.purchaser_id_number`), instrument type (`mi.instrument_type`), amount (`mi.amount`) | MI log entry created (`mi.log_entry_created`) | At purchase |
| Monthly consolidation reached (`mi.central_log_updated`) | Log entries (`mi.central_log`) | Consolidated central MI log (`mi.central_log_updated`) | By the 15th of the following month (enforced by `mi.consolidation_due`) |

**ALERTS/METRICS:** Alert if monthly consolidation (`mi.consolidation_due`) is not completed by the 15th; track count of MI purchases captured versus teller cash sales in band.

## BS-10 — Travel Rule (Wires ≥ $3,000) {#bs-10--travel-rule-wires--3000}

**WHY (Reg cite):** Funds transfers of $3,000 or more must collect and transmit originator, beneficiary, and financial-institution information — the Recordkeeping and Travel Rules at [31 CFR § 1010.410(e)](https://www.ecfr.gov/current/title-31/section-1010.410) and [§ 1010.410(f)](https://www.ecfr.gov/current/title-31/section-1010.410).

**SYSTEM BEHAVIOR:** For wires of $3,000 or more, the system requires and stores originator, beneficiary, and financial-institution identifiers and validates that the required fields are present before releasing the wire. Wire transfer records are retained per the BSA schedule and are write-restricted to Payments Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Wire of $3,000+ created (`wire_transfer.created`) | Originator (`originator.name`, `originator.routing_number`), beneficiary (`beneficiary.name`, `beneficiary.account_number`), amount (`transfer.amount`) | Travel-rule record validated (`wire_transfer.record_retained`) | Before release |
| Wire released after validation (`wire_transfer.submitted`) | Validated transfer (`transfer.id`), rail (`transfer.rail`) | Wire submitted with retained record (`wire_transfer.submitted`) | At release |

**ALERTS/METRICS:** Target zero `wire_transfer.submitted` events lacking a preceding `wire_transfer.record_retained`; alert on wires held for missing travel-rule fields.

## BS-11 — Information Sharing (314(a)/314(b)) {#bs-11--information-sharing-314a314b}

**WHY (Reg cite):** The credit union must respond to FinCEN 314(a) requests and may share under 314(b) — [31 CFR § 1010.520](https://www.ecfr.gov/current/title-31/section-1010.520) (314(a)) and [§ 1010.540](https://www.ecfr.gov/current/title-31/section-1010.540) (314(b)).

**SYSTEM BEHAVIOR:** The credit union intakes FinCEN SISS requests, searches across the specified lookback windows, and responds within 14 days. It maintains its 314(b) certification and verifies counterpart certification before sharing. Request scope, search results, and the 314(b) register are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| FinCEN 314(a) SISS request received (`sar.disclosure_request_received`) | Request scope (`fincen.request_scope`) | 314(a) search response filed (`filing.fincen_314a`) | 14 calendar days |
| 314(b) sharing requested (`vendor.data_sharing_requested`) | Counterpart registration (`fincen.counterpart_registration`) | Verified-counterpart sharing authorized (`vendor.data_sharing_authorized`) | Before sharing |

**ALERTS/METRICS:** Alert on any open 314(a) request approaching the 14-day response window; target zero 314(b) shares lacking a verified `fincen.counterpart_registration`.

## BS-12 — Record Retention & Legal Holds {#bs-12--record-retention--legal-holds}

**WHY (Reg cite):** BSA records must be retained 5 years (10 years for OFAC), and holds must suspend disposal — [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/section-1010.430) and the OFAC recordkeeping rule at [31 CFR § 501.601](https://www.ecfr.gov/current/title-31/section-501.601).

**SYSTEM BEHAVIOR:** Retention schedules apply by record type (5-year BSA baseline; 10-year OFAC). Legal holds suspend disposal, and purges run only after the retention timer matures and no hold applies, with an audit log of every disposal. Retention specs and legal holds are write-restricted to Compliance and the General Counsel.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record created with a retention class (`retention.timer_set`) | Record type (`retention.record_type`), schedule (`retention.schedule`), anchor date (`retention.anchor_date`) | Retention timer set (`retention.timer_set`) | At record creation |
| Legal hold placed (`legal_hold.created`) | Hold scope (`legal.hold_scope`), matter (`legal.matter_id`) | Disposal suspended (`retention.hold_applied`) | On hold notice |
| Retention matures with no hold (`document.retention_expired`) | Retention spec (`retention.schedule`), legal-hold flag (`document.legal_hold_flag`) | Purge executed + disposal log (`retention.purge_executed`) | At schedule maturity (enforced by `retention.purge_due`) |

**ALERTS/METRICS:** Alert on records past their retention schedule that remain unpurged absent a hold; target zero purges executed against records under a legal hold.

## BS-13 — Escalation Pathway {#bs-13--escalation-pathway}

**WHY (Reg cite):** A program must escalate emergent BSA issues and breaches, including regulator notification where applicable — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and the NCUA program rule at [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).

**SYSTEM BEHAVIOR:** Staff raise one-click breach/emergent-issue escalations to the BSA Officer and General Counsel. Escalations are acknowledged internally within 1 business day and an action plan is produced within 5 business days, including regulator notifications where applicable. Escalation records are write-restricted to Compliance and the General Counsel.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Breach or emergent issue raised (`escalation.created`) | Description (`escalation.description`), facts (`escalation.facts`), severity (`escalation.severity`), reporter (`escalation.reporter_id`) | Escalation routed to BSA Officer/GC (`escalation.routed`) | Immediately |
| Escalation acknowledged (`escalation.acknowledged`) | Owner (`escalation.owner_id`) | Acknowledgement logged (`escalation.acknowledged`) | 1 business day (enforced by `escalation.ack_timer`) |
| Action plan produced (`escalation.action_plan_published`) | Regulatory assessment (`escalation.regulatory_assessment`) | Published action plan + any regulator notice (`escalation.action_plan_published`) | 5 business days (enforced by `escalation.plan_timer`) |

**ALERTS/METRICS:** Alert on any escalation unacknowledged past 1 business day (`escalation.ack_timer`) or without an action plan past 5 business days (`escalation.plan_timer`).

## BS-14 — Training {#bs-14--training}

**WHY (Reg cite):** The program must provide training for appropriate personnel — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).

**SYSTEM BEHAVIOR:** Role-based curricula are assigned and must be completed within 30 days of hire and annually by the policy anniversary; Board and committee training is tracked separately. Curricula and completion records are write-restricted to HR and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire onboarded (`training.assigned`) | Role curriculum (`training.role_curriculum`), hire date (`training.hire_date`) | Training assigned (`training.assigned`) | 30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opened (`training.annual_assigned`) | Curriculum version (`training.curriculum_version`) | Annual training assigned (`training.annual_assigned`) | By policy anniversary (enforced by `training.annual_due`) |
| Training completed (`training.completed`) | Completion record (`training.curriculum`) | Completion recorded (`training.completion_recorded`) | Within assignment window (enforced by `training.completion_due_at`) |
| Board/committee training delivered (`training.board_completed`) | Board curriculum (`training.board_curriculum`) | Board training recorded (`training.board_completed`) | Per Board schedule |

**ALERTS/METRICS:** Alert on overdue new-hire (`training.newhire_due_at`) or annual (`training.annual_due`) completions; track completion rate by role curriculum.

## BS-15 — Independent Testing {#bs-15--independent-testing}

**WHY (Reg cite):** The program must be independently tested — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).

**SYSTEM BEHAVIOR:** Independent testing is conducted every 12–18 months, with scope mapped to controls and remediation tracked to closure. Test workpapers and findings are write-restricted to Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Independent test engagement started (`audit.engagement_started`) | Engagement scope (`engagement.scope`), provider (`engagement.provider`) | Engagement opened (`audit.engagement_started`) | Every 12–18 months (enforced by `audit.engagement_due`) |
| Test completed and report issued (`audit.engagement_completed`) | Findings (`finding.description`), severity (`finding.severity`) | Independent test report (`audit.report_issued`) | At engagement close |
| Finding remediated and closed (`audit.finding_closed`) | Corrective action (`audit.corrective_action`), finding owner (`audit.finding_owner`) | Closed finding (`audit.finding_closed`) | Per remediation plan (enforced by `audit.remediation_due`) |

**ALERTS/METRICS:** Alert when the testing cycle is within 60 days of its 18-month bound (`audit.engagement_due`) and on findings past their remediation deadline (`audit.remediation_due`).

## BS-16 — High-Risk Categories (MSB, Correspondent, Private Banking) {#bs-16--high-risk-categories-msb-correspondent-private-banking}

**WHY (Reg cite):** Correspondent and private-banking relationships and money-services businesses carry heightened due-diligence obligations — [31 CFR § 1010.610](https://www.ecfr.gov/current/title-31/section-1010.610) (correspondent), [§ 1010.620](https://www.ecfr.gov/current/title-31/section-1010.620) (private banking), and MSB registration at [§ 1022.380](https://www.ecfr.gov/current/title-31/section-1022.380).

**SYSTEM BEHAVIOR:** High-risk categories follow category checklists; the credit union verifies FinCEN MSB registration and state licenses, captures site visits, and refreshes EDD at least annually. Category EDD files are write-restricted to BSA Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| High-risk category onboarded (`edd.category_approved`) | Category checklist (`edd.category_checklist`), MSB registration number (`edd.msb_registration_number`) | Approved category EDD (`edd.category_approved`) | Before activation |
| Site visit conducted (`edd.site_visit_completed`) | Site visit report (`edd.site_visit_report`) | Site-visit record logged (`edd.site_visit_logged`) | Per category playbook |
| Annual category EDD refresh reached (`edd.refresh_completed`) | EDD file (`edd.file`) | Refreshed EDD (`edd.refresh_completed`) | At least annually (enforced by `edd.refresh_due`) |

**ALERTS/METRICS:** Alert on high-risk relationships whose annual EDD refresh (`edd.refresh_due`) is overdue or whose MSB registration is unverified; target zero high-risk activations without an approved category file.

## BS-17 — CMIR (Cross-Border Currency) {#bs-17--cmir-cross-border-currency}

**WHY (Reg cite):** Transporting more than $10,000 in currency or monetary instruments into or out of the United States requires a CMIR — [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/section-1010.340).

**SYSTEM BEHAVIOR:** The credit union identifies reportable shipments and receipts and files FinCEN Form 105 within 15 days after receipt (or by the mailing/shipping date when not accompanying a person), storing confirmations. CMIR records are write-restricted to BSA Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportable cross-border movement identified (`cmir.reportable_identified`) | Amount (`cmir.amount`), direction (`cmir.direction`), counterparty (`cmir.counterparty`), manifest (`cmir.shipment_manifest`) | CMIR-reportable item flagged (`cmir.reportable_identified`) | On identification |
| CMIR filed (`cmir.filed`) | CMIR data (`cmir.amount`, `cmir.direction`) | Form 105 filed + confirmation (`cmir.filed`) | 15 days after receipt (enforced by `cmir.filing_timer`) |

**ALERTS/METRICS:** Alert on any `cmir.reportable_identified` without a `cmir.filed` within 15 days (`cmir.filing_timer`).

## BS-18 — FBAR (Foreign Account Reporting) {#bs-18--fbar-foreign-account-reporting}

**WHY (Reg cite):** Reportable foreign financial accounts require an annual FBAR (FinCEN Form 114) — [31 CFR § 1010.350](https://www.ecfr.gov/current/title-31/section-1010.350) and the filing deadline at [§ 1010.306(c)](https://www.ecfr.gov/current/title-31/section-1010.306).

**SYSTEM BEHAVIOR:** The credit union inventories foreign accounts, calendars the April 15 deadline (with automatic extension to October 15), and e-files via the BSA system. FBAR inventory and filings are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Foreign-account inventory updated (`fbar.inventory_updated`) | Account record (`fbar.account_record`), authority type (`fbar.authority_type`) | Updated FBAR inventory (`fbar.inventory_updated`) | At change |
| FBAR filed (`fbar.filed`) | Account records (`fbar.account_record`) | FinCEN Form 114 filed (`fbar.filed`) | April 15, auto-extend Oct 15 (enforced by `fbar.filing_due`) |
| No reportable accounts determined (`fbar.nil_determined`) | Inventory review (`fbar.account_record`) | Nil determination recorded (`fbar.nil_determined`) | By the filing deadline |

**ALERTS/METRICS:** Alert as the FBAR deadline (`fbar.filing_due`) approaches with an unfiled return; track the count of foreign accounts inventoried versus filed.

## BS-19 — Prepaid Access & Third-Party/Vendor Oversight {#bs-19--prepaid-access--third-partyvendor-oversight}

**WHY (Reg cite):** The credit union remains responsible for AML/CFT obligations performed by third parties and prepaid-access providers — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) and the prepaid-access rule at [31 CFR § 1022.210](https://www.ecfr.gov/current/title-31/section-1022.210).

**SYSTEM BEHAVIOR:** Each AML/CFT-relevant vendor (including prepaid-access and screening providers) requires a due-diligence package, contract clauses covering data access, audit, and sanctions, system-enforced program limits, and an annual vendor review. Critical vendor alerts feed in real time into transaction monitoring. Vendor due-diligence files and contracts are write-restricted to Vendor Management and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| BSA-relevant vendor onboarded (`vendor.due_diligence_initiated`) | DD package (`vendor.dd_package`), data scope (`vendor.data_scope`) | Vendor diligence completed (`vendor.diligence_completed`) | Before go-live |
| Contract clauses verified (`vendor.contract_clauses_verified`) | Contract terms (`vendor.contract_terms`) | Verified clauses logged (`vendor.contract_clauses_verified`) | At contracting |
| Critical vendor alert raised (`vendor.critical_alert`) | Alert details (`vendor.alert_details`), impact scope (`vendor.impact_scope`) | Alert routed into monitoring (`vendor.critical_alert`) | Real time |
| Annual vendor review reached (`vendor.review_completed`) | DD package (`vendor.dd_package`) | Vendor review completed (`vendor.review_completed`) | Annually (enforced by `vendor.annual_review_due`) |

**ALERTS/METRICS:** Alert on vendors past their annual review (`vendor.annual_review_due`) and on any `vendor.critical_alert` not routed into monitoring within its SLA; target zero BSA vendors live without verified contract clauses.

## BS-20 — PEP Screening & EDD {#bs-20--pep-screening--edd}

**WHY (Reg cite):** Politically exposed persons warrant risk-based enhanced due diligence as part of the CDD/ongoing-monitoring obligation — [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/section-1010.230) and [§ 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210).

**SYSTEM BEHAVIOR:** Applicants, beneficial owners, and signers are screened against PEP datasets at onboarding and on refresh. Hits are routed to EDD with elevated approval and adjusted monitoring; high-risk PEPs must complete EDD before activation. PEP status and EDD approvals are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Party screened against PEP datasets (`pep.hit`) | PEP status (`pep.status`), subject role (`pep.subject_role`) | PEP hit routed to EDD (`pep.hit`) | At onboarding and refresh |
| PEP designated and EDD opened (`pep.designated`) | PEP status (`pep.status`), approver (`edd.approver_id`) | PEP EDD opened (`edd.pep_opened`) | Before activation for high-risk PEPs |
| PEP EDD completed (`edd.pep_completed`) | EDD file (`edd.file`), source of wealth (`edd.source_of_wealth`) | Completed PEP EDD (`edd.pep_completed`) | Before activation (high-risk) |
| PEP screening refreshed (`pep.refresh_completed`) | PEP status (`pep.status`) | Refreshed PEP screen (`pep.refresh_completed`) | On refresh cycle (enforced by `edd.refresh_due`) |

**ALERTS/METRICS:** Target zero high-risk PEP activations without a completed `edd.pep_completed`; alert on PEP refreshes overdue against `edd.refresh_due`.

## BS-21 — FinCEN Special Measures & GTOs {#bs-21--fincen-special-measures--gtos}

**WHY (Reg cite):** The credit union must operationalize FinCEN special measures under USA PATRIOT Act § 311 — [31 CFR § 1010.658 et seq.](https://www.ecfr.gov/current/title-31/part-1010/subpart-F) — and any Geographic Targeting Orders issued under [31 USC § 5326](https://www.law.cornell.edu/uscode/text/31/5326).

**SYSTEM BEHAVIOR:** A documented process receives, assesses, and operationalizes FinCEN special measures and any Geographic Targeting Orders directed at the credit union or its sector. The BSA Officer owns intake, circulates to affected business lines within 1 business day of receipt, implements required recordkeeping or reporting within the GTO-specified deadline, and retains GTO compliance records for 5 years. The order register is write-restricted to the BSA Officer. Because the engineering vocabulary has no registered subject for special measures or GTOs, the order is modeled as a scope-registry entry and its records under the standard retention timer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Special measure or GTO received (`scope_registry.change_detected`) | Request scope (`scope_registry.approver_id`), order details (`escalation.facts`) | Order intake recorded (`scope_registry.entry_updated`) | On receipt |
| Order circulated to affected business lines (`scope_registry.published`) | Affected scope (`monitoring.scope`) | Circulation published (`scope_registry.published`) | 1 business day of receipt |
| GTO recordkeeping/reporting implemented (`scope_registry.attested`) | Retention spec (`retention.record_type`), schedule (`retention.schedule`) | Implementation attested + records retained (`retention.timer_set`) | GTO-specified deadline; records retained 5 years (enforced by `retention.purge_due`) |

**ALERTS/METRICS:** Alert if a received order is not circulated within 1 business day or not implemented by its GTO-specified deadline; target zero GTO records purged before the 5-year retention matures.

## Governance & Sign-Off {#governance}

**Owner.** Patrick Wilson, Chief Compliance Officer, serves as BSA Officer and owns this policy and the integrated BSA/AML/CFT/OFAC/CIP program.

**Approval.** Approved by Patrick Wilson, Chief Compliance Officer. The Board adopts and re-approves the policy at least annually, with an interim review opened within 30 days of any material change ([BS-01](#bs-01--governance--delegation)).

**Required participants.** Compliance, BSA Operations, Vendor Management, Payments Operations, HR, and Internal Audit, with roles and segregation of duties defined in the RACI registry.

**Review cadence.** Annual policy review; enterprise risk assessment every 12–18 months ([BS-02](#bs-02--enterprise-bsaaml-risk-assessment)); independent testing every 12–18 months ([BS-15](#bs-15--independent-testing)); monthly Board SAR summaries ([BS-08](#bs-08--sar-filing--confidentiality)).

**Cross-references.** Information Security Policy (system safeguards and cyber incident response); Third-Party Risk Policy (general vendor onboarding/oversight); Privacy Policy (member data handling); Record Retention Policy (non-BSA schedules); Electronic Payment Systems Policy (operational suspicious-activity detection in payment rails).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The BSA-side fields, events, and timers referenced throughout the control overlays use the agreed target naming. The codes still requiring engineering registration are the provisional-spelling codes drawn from the migration map — `governance.bsa_officer_id`, `governance.authority_statement`, `governance.raci_registry`, `policy.version`, `policy.change_summary`, `risk.candidate_profile`, `risk.partner_dependency`, `risk.geography_factors`, `risk.inherent_score`, `monitoring.scope`, `cdd.expected_activity`, `cdd.source_of_funds`, `cdd.industry_code`, `cdd.control_person`, `cdd.profile`, `edd.source_of_wealth`, `edd.file`, `edd.approver_id`, `edd.category_checklist`, `edd.msb_registration_number`, `edd.site_visit_report`, `ofac.list_version`, `ofac.blocked_property`, `ofac.payment_instructions`, `ofac.hotline_record`, `ctr.cash_in_total`, `ctr.cash_out_total`, `ctr.exemption_basis`, `sar.narrative`, `sar.prior_filing_id`, `sar.filing_id`, `mi.purchaser_id_number`, `mi.instrument_type`, `mi.amount`, `mi.central_log`, `fincen.request_scope`, `fincen.counterpart_registration`, `legal.hold_scope`, `legal.matter_id`, `retention.record_type`, `retention.schedule`, `retention.anchor_date`, `retention.timer`, `escalation.description`, `escalation.facts`, `escalation.severity`, `escalation.reporter_id`, `escalation.owner_id`, `escalation.regulatory_assessment`, `training.role_curriculum`, `training.hire_date`, `training.curriculum_version`, `training.curriculum`, `training.board_curriculum`, `engagement.scope`, `engagement.provider`, `finding.description`, `finding.severity`, `audit.corrective_action`, `audit.finding_owner`, `cmir.amount`, `cmir.direction`, `cmir.counterparty`, `cmir.shipment_manifest`, `fbar.account_record`, `fbar.authority_type`, `vendor.dd_package`, `vendor.data_scope`, `vendor.contract_terms`, `vendor.alert_details`, `vendor.impact_scope`, `pep.status`, `pep.subject_role`, `scope_registry.approver_id`, and `reporting.sar_count`. These will be confirmed by engineering before the next review.
- **No registered subject for FinCEN special measures or GTOs.** The subject registry has no `special_measure` or `gto` prefix, so BS-21 models the order intake as a `scope_registry` entry and its records under the standard `retention` timer. If engineering registers a dedicated subject, BS-21's codes should be migrated to it.
- **Charter and reporter status.** This policy assumes Pynthia is a federally insured credit union subject to NCUA Part 748 and the Treasury 31 CFR Chapter X rules; OFAC annual blocked-property reporting is assumed due September 30 each year. CMIR and FBAR applicability assume the credit union actually transports cross-border currency and holds reportable foreign accounts; if neither occurs, BS-17 and BS-18 operate as nil-determination controls.
- **Risk-tier and refresh cadences.** PATRICK_NOTES set EDD/CDD refresh as risk-tier and event-driven but do not fix exact intervals; the specific per-tier cadences are configured in the risk assessment ([BS-02](#bs-02--enterprise-bsaaml-risk-assessment)) and remain to be confirmed.
- **Form 8300 explicitly out of scope.** As a financial institution, Pynthia reports equivalent cash activity via CTRs under 31 CFR § 1010.311 ([BS-07](#bs-07--ctr-filing--exemptions)) rather than IRS/FinCEN Form 8300.
