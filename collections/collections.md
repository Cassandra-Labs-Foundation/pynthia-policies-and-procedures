---
title: Collections Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Collections, Delinquency, Charge-Offs, Reg F, FDCPA, FCRA, UDAAP, Nonaccrual, Overdrafts]
---

## General Policy Statement

Pynthia Credit Union recognizes, monitors, and controls loan delinquencies and overdrafts; classifies and charges off loans with a high probability of loss in a timely, consistent manner; and treats members fairly and lawfully across all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. This policy applies to all consumer and small-business credit products the credit union originates or services — residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, and co-branded/white-label partner programs — and to overdraft programs that function as extensions of credit. Timings stated here are minimum standards; products, states, or partners with stricter requirements must be configured to tighter SLAs. Collection activity must comply with applicable prudential, safety-and-soundness, consumer-protection, privacy, and information-security requirements.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Material policy breach logged | Breach identified (`collections.policy_breach_logged`) | 5 business days | Breach log entry to CCO | [CL-01](#cl-01-collections-governance-scope) |
| Loans >30 DPD / problem-loan reporting | Monthly board cycle opens (`governance.board_cycle_opened`) | Monthly | Board/ELC delinquency & problem-loan report | [CL-01](#cl-01-collections-governance-scope) |
| 30-day delinquency reached | Loan hits 30 DPD (`loan.dpd_updated`) | Within 5 days of 30 DPD | Right-to-cure notice | [CL-02](#cl-02-delinquency-monitoring-early-stage-collections) |
| 60-day delinquency reached | Loan hits 60 DPD (`loan.dpd_updated`) | Within 10 days of 60 DPD | 60-day status memo | [CL-02](#cl-02-delinquency-monitoring-early-stage-collections) |
| Closed-end retail charge-off | Loan reaches 120 DPD (`loan.dpd_updated`) | Month-end of 120-DPD month | Charge-off booking | [CL-03](#cl-03-retail-credit-classification-charge-offs) |
| Open-end retail charge-off | Loan reaches 180 DPD (`loan.dpd_updated`) | Month-end of 180-DPD month | Charge-off booking | [CL-03](#cl-03-retail-credit-classification-charge-offs) |
| Bankruptcy notice received | Notice received (`loan.bankruptcy_notice_received`) | 60 days | Charge-off booking | [CL-03](#cl-03-retail-credit-classification-charge-offs) |
| Fraud confirmed | Fraud confirmed (`loan.fraud_confirmed`) | 90 days | Charge-off booking | [CL-03](#cl-03-retail-credit-classification-charge-offs) |
| Cease-communication request received | Member requests cease (`collections.cease_request_received`) | 1 business day | Cease flag effective | [CL-05](#cl-05-consumer-protection-in-collections-communications) |
| Direct member complaint | Complaint received (`complaint.direct_received`) | 5 BD ack / 30 days resolve | Acknowledgment + resolution | [CL-06](#cl-06-consumer-complaint-intake-resolution) |
| Regulator complaint | Complaint received (`complaint.regulator_received`) | 15 days initial / 60 days final | Initial + final response | [CL-06](#cl-06-consumer-complaint-intake-resolution) |
| Furnishing dispute received | Dispute received (`furnishing.dispute_received`) | 30 days | Investigation + correction | [CL-07](#cl-07-credit-reporting-dispute-handling) |
| Reportable cyber incident on collections data | Reasonable belief reached (`incident.classified`) | 72 hours | NCUA notification | [CL-08](#cl-08-collections-data-breach-incident-reporting) |
| Incident triage | Incident logged (`incident.collections_logged`) | 24 hours | Triage completed | [CL-08](#cl-08-collections-data-breach-incident-reporting) |
| Nonaccrual trigger | Loan 90+ DPD or collection doubtful (`loan.dpd_updated`) | At trigger | Nonaccrual placement + interest reversal | [CL-09](#cl-09-problem-loans-nonaccrual-foreclosure-governance) |
| Foreclosure proposed | Foreclosure proposed (`loan.foreclosure_proposed`) | Before action | CCO + President approval | [CL-09](#cl-09-problem-loans-nonaccrual-foreclosure-governance) |
| Daily overdraft report | Report generated (`overdraft.report_reviewed`) | Same business day | Reviewed overdraft report | [CL-10](#cl-10-overdraft-collections-and-fee-waiver-practices) |

## CL-01 — Collections Governance & Scope {#cl-01-collections-governance-scope}

- **WHY (Reg cite):** Safety-and-soundness oversight of delinquency, problem loans, and OREO requires active Board/management governance and a controlling policy version; classification and reporting follow the [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.fdic.gov/news/financial-institution-letters/2000/fil0040.html) and [Interagency problem-asset guidance](https://www.fdic.gov/regulations/laws/rules/5000-4800.html). Board reporting and the written program align with [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748).

- **SYSTEM BEHAVIOR:** A single policy configuration object defines covered products, channels, and three-lines ownership; every collections workflow binds to the active policy version before any collection action proceeds. The system reports loans >30 DPD, problem loans, nonaccruals, and OREO to the Board/Executive Loan Committee at least monthly, reviews the policy at least annually, and records material breaches within 5 business days of identification. Policy activation and the RACI registry are write-restricted to Compliance; only the CCO may activate a new policy version.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New policy version approved and activated (`collections.policy_version_activated`) | Policy document version (`policy.document_version`), covered scope and ownership (`policy.raci_registry`), three-lines binding flag (`collections.policy_bound`) | Active policy config bound to workflows (`collections.policy_version_activated`) | At activation (annual review enforced by `collections.annual_review_due_at`) |
  | Monthly Board/ELC reporting cycle opens (`governance.board_cycle_opened`) | Delinquency >30 DPD population (`loan.dpd`), problem-loan and nonaccrual rosters (`loan.risk_rating`, `loan.nonaccrual_placed`), OREO inventory (`collateral.inventory`) | Board/ELC collections report delivered (`collections.board_report_issued`) | Monthly (enforced by `collections.board_report_due_at`) |
  | Material policy breach identified (`collections.policy_breach_logged`) | Breach description (`breach.description`), bound control (`breach.control_id`), owner (`breach.owner`) | Breach log entry routed to CCO (`collections.policy_breach_logged`) | 5 business days (enforced by `collections.breach_log_due_at`) |
  | Annual policy review completes (`collections.policy_review_completed`) | Prior policy version (`policy.document_version`), change rationale (`policy.change_rationale`) | Reviewed/re-approved policy (`collections.policy_review_completed`) | 12 months (enforced by `collections.annual_review_due_at`) |

- **ALERTS/METRICS:** Aging alert when any material breach is unlogged past 5 business days; target zero overdue `collections.board_report_due_at` and `collections.annual_review_due_at` tasks; alert on any collections workflow not bound to the active policy version.

## CL-02 — Delinquency Monitoring & Early-Stage Collections {#cl-02-delinquency-monitoring-early-stage-collections}

- **WHY (Reg cite):** Timely delinquency follow-up supports safety-and-soundness and prevents loss accumulation per the [FFIEC Uniform Retail Credit Classification Policy](https://www.fdic.gov/news/financial-institution-letters/2000/fil0040.html); right-to-cure timing and content overlay [state right-to-cure laws](https://www.law.cornell.edu/wex/right_to_cure) and must not violate [FDCPA/Reg F](https://www.ecfr.gov/current/title-12/part-1006) communication limits.

- **SYSTEM BEHAVIOR:** A nightly delinquency engine recomputes days-past-due against contractual due dates, applying grace periods (10 days standard, 15 days for first-mortgage consumer loans). Courtesy notices are sent at 10/15 days, second reminders by day 20, and a formal right-to-cure within 5 days of 30-day delinquency; a 60-day status memo is filed within 10 days of reaching 60 DPD. Past Due Notes are retained at least one year. Grace-period parameters are write-restricted to Collections Operations under the active policy version; loans secured by residential real property follow the residential-mortgage parameter set, which configures longer cure windows where state law requires.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Nightly delinquency engine runs (`loan.dpd_updated`) | Last payment date (`loan.last_payment_date`), grace-period days (`loan.grace_period_days`), product type (`loan.product_type`), past-due amount (`loan.past_due_amount`) | Updated DPD and stage flags (`loan.dpd_updated`) | Nightly (enforced by `loan.days_past_due`) |
  | Loan reaches 10/15-day grace expiry (`loan.dpd_updated`) | DPD value (`loan.dpd`), member contact preferences (`member.contact_preferences`) | Courtesy notice sent (`collections.courtesy_notice_sent`) | Day 10/15 (enforced by `loan.courtesy_notice_due_at`) |
  | Loan reaches day 20 (`loan.dpd_updated`) | DPD value (`loan.dpd`), prior notice record (`collections.contact_outcome`) | Second reminder sent (`collections.second_reminder_sent`) | Day 20 (enforced by `loan.second_reminder_due_at`) |
  | Loan reaches 30 DPD (`loan.dpd_updated`) | DPD value (`loan.dpd`), cure parameters (`legal.cure_parameters`), past-due amount (`loan.past_due_amount`) | Right-to-cure notice sent (`collections.right_to_cure_sent`) | 5 days of 30 DPD (enforced by `loan.right_to_cure_due_at`) |
  | Loan reaches 60 DPD (`loan.dpd_updated`) | DPD value (`loan.dpd`), collectibility assessment (`loan.collectibility_assessment`), workout alternatives (`loan.workout_alternatives`) | 60-day status memo filed (`collections.status_memo_filed`) | 10 days of 60 DPD (enforced by `loan.status_memo_due_at`) |
  | Past Due Note generated (`collections.contact_logged`) | Note artifact and retention class (`collections.past_due_note_retained`), retention anchor (`retention.anchor_date`) | Retained Past Due Note (`collections.contact_logged`) | Retain ≥1 year (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Aging alerts on any right-to-cure overdue past 30 DPD + 5 days and any 60-day memo overdue past 60 DPD + 10 days; nightly engine completion-latency monitor (target 100% nightly runs); target zero notices skipped at 10/15/20-day stages.

## CL-03 — Retail Credit Classification & Charge-Offs {#cl-03-retail-credit-classification-charge-offs}

- **WHY (Reg cite):** Classification and charge-off timing follow the [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.fdic.gov/news/financial-institution-letters/2000/fil0040.html) (closed-end 120 DPD, open-end 180 DPD, Substandard at 90 cumulative DPD, bankruptcy within 60 days, fraud within 90 days, death when loss is estimable) with real-estate write-downs to fair value less cost to sell.

- **SYSTEM BEHAVIOR:** Retail loans are classified Substandard at 90 cumulative DPD. The system auto-charges-off closed-end credit at 120 DPD and open-end credit at 180 DPD, booked at the end of the month in which the threshold is reached; bankruptcy is charged off within 60 days of court notice unless documented repayment is likely, confirmed fraud within 90 days, and deceased-borrower loans once loss is reasonably estimable. Real-estate balances exceeding fair value net of cost to sell are written down to loss. A well-secured loan in the process of collection that will repay regardless of delinquency status may be left unclassified only with documented evidence in `loan.well_secured_documented`. Charge-off booking and write-down entries are write-restricted to Finance under ELC authority.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Loan reaches 90 cumulative DPD (`loan.dpd_updated`) | DPD value (`loan.dpd`), LTV (`loan.ltv`), well-secured documentation (`loan.well_secured_documented`) | Substandard classification (`loan.rating_review_completed`) | At 90 DPD (enforced by `loan.classification_due_at`) |
  | Closed-end loan reaches 120 DPD (`loan.dpd_updated`) | Product type (`loan.product_type`), balance (`loan.balance`), month-end anchor (`loan.chargeoff_month_end_at`) | Charge-off booked (`loan.re_writedown_booked`) | Month-end of 120-DPD month (enforced by `loan.chargeoff_due_closed_end`) |
  | Open-end loan reaches 180 DPD (`loan.dpd_updated`) | Product type (`loan.product_type`), balance (`loan.balance`), month-end anchor (`loan.chargeoff_month_end_at`) | Charge-off booked (`loan.re_writedown_booked`) | Month-end of 180-DPD month (enforced by `loan.chargeoff_due_open_end`) |
  | Bankruptcy notice received (`loan.bankruptcy_notice_received`) | Bankruptcy case ID (`loan.bankruptcy_case_id`), repayment evidence (`loan.repayment_evidence`) | Charge-off booked (`loan.re_writedown_booked`) | 60 days of notice (enforced by `loan.bankruptcy_chargeoff_due_at`) |
  | Fraud confirmed (`loan.fraud_confirmed`) | Fraud investigation reference (`fraud.investigation_id`), balance (`loan.balance`) | Charge-off booked (`loan.re_writedown_booked`) | 90 days of confirmation (enforced by `loan.fraud_chargeoff_due_at`) |
  | Borrower death reported with estimable loss (`member.death_reported`) | Death-loss-estimable flag (`loan.death_loss_estimable`), estate claim status (`loan.estate_claim_status`) | Charge-off booked (`loan.re_writedown_booked`) | When loss estimable (enforced by `loan.classification_due_at`) |
  | Real-estate value reassessed below balance (`loan.dpd_updated`) | Collateral fair value (`collateral.fair_value`), cost to sell (`collateral.cost_to_sell`), loan balance (`loan.balance`) | Write-down to loss booked (`loan.re_writedown_booked`) | At 120/180-DPD valuation (enforced by `loan.re_valuation_due`) |

- **ALERTS/METRICS:** Aging alert on any charge-off not booked by its month-end target; target zero overdue `loan.bankruptcy_chargeoff_due_at`/`loan.fraud_chargeoff_due_at` tasks; exception count of loans left unclassified without `loan.well_secured_documented` evidence (target zero).

## CL-04 — Forbearance, Extensions, Workouts & TDRs {#cl-04-forbearance-extensions-workouts-tdrs}

- **WHY (Reg cite):** Modifications must reflect sustainable repayment capacity and avoid masking loss per the [FFIEC Uniform Retail Credit Classification Policy](https://www.fdic.gov/news/financial-institution-letters/2000/fil0040.html) re-aging guidance and [interagency problem-asset guidance](https://www.fdic.gov/regulations/laws/rules/5000-4800.html); workout conduct must not be unfair or deceptive under [Dodd-Frank §§1031 & 1036 (UDAAP)](https://www.law.cornell.edu/uscode/text/12/5531).

- **SYSTEM BEHAVIOR:** The system governs hardship forbearance, extensions, and TDRs so that approved modifications reflect documented sustainable repayment capacity. Days-past-due reset only after defined performance — at least three consecutive modified payments. Extensions are capped (up to three months); interest capitalization and interest-only arrangements (3–12 months) require committee approval. Active TDRs are reviewed quarterly. DPD reset eligibility and the modification decision are write-restricted to Collections Operations and the Executive Loan Committee; interest capitalization may be applied only after ELC approval is recorded.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Workout/forbearance requested (`loan.workout_requested`) | Hardship evidence (`member.hardship_evidence`), repayment capacity (`member.repayment_capacity`), proposed modification (`loan.proposed_modification`) | Modification decision recorded (`loan.modification_decided`) | At decision (internal SLA per policy) |
  | Interest-only / capitalization proposed (`loan.io_capitalization_proposed`) | IO term months (`loan.io_term_months`), modified schedule (`loan.modified_schedule`), ELC approval packet (`elc.approval_packet`) | ELC modification approval (`elc.modification_approved`) | Before booking (internal SLA per policy) |
  | Third consecutive modified payment received (`loan.modified_payment_3_received`) | DPD reset eligibility check (`loan.dpd_reset_eligibility_check`), repayment evidence (`loan.repayment_evidence`) | DPD reset applied (`loan.modification_decided`) | After 3 payments (no registered timer) |
  | Quarterly TDR review cycle (`tdr.quarterly_review_completed`) | Active TDR population (`loan.modified_schedule`), performance evidence (`loan.repayment_evidence`) | Quarterly TDR review record (`tdr.quarterly_review_completed`) | Quarterly (enforced by `tdr.quarterly_review_due`) |

- **ALERTS/METRICS:** Alert on any DPD reset applied before three consecutive modified payments; alert on extensions exceeding the three-month cap; target zero overdue `tdr.quarterly_review_due` tasks; metric on interest-capitalization approvals without recorded ELC approval (target zero).

## CL-05 — Consumer Protection in Collections Communications {#cl-05-consumer-protection-in-collections-communications}

- **WHY (Reg cite):** Communication time/place/frequency limits and prohibitions on harassment, threats, and false credit-information statements are governed by [FDCPA / Reg F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006) and the prohibition on unfair, deceptive, or abusive practices under [Dodd-Frank §§1031 & 1036](https://www.law.cornell.edu/uscode/text/12/5536).

- **SYSTEM BEHAVIOR:** The system enforces permitted calling times by member time zone, frequency caps, and do-not-call/attorney-represented/cease-communication flags before any outbound contact; it gates and blocks contacts that would breach these rules. Harassment, threats, obscene language, and false credit-information disclosures are prohibited and templated scripts prevent them. All collection templates and scripts route through Compliance for approval before use; cease-communication flags take effect within 1 business day of request. Template approval and cease/attorney flag configuration are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Outbound contact attempted (`collections.contact_logged`) | Member time zone (`member.timezone`), 7-day contact frequency (`collections.contact_frequency_7d`), cease/attorney flags (`member.cease_request`, `member.attorney_contact`), contact channel (`collections.contact_channel`) | Contact logged or gated (`collections.contact_logged`) | Real-time gate (no registered timer) |
  | Cease-communication request received (`collections.cease_request_received`) | Member ID (`complaint.member_id`), cease request basis (`member.cease_request`) | Cease flag set and effective (`member.cease_flag_set`) | 1 business day (enforced by `collections.cease_flag_due_at`) |
  | Attorney representation identified (`collections.contact_logged`) | Attorney contact (`member.attorney_contact`), attorney-identified flag (`collections.attorney_identified`) | Attorney flag set (`member.attorney_flag_set`) | Per policy (enforced by `collections.attorney_flag_due_at`) |
  | Template/script submitted for approval (`collections.template_submitted`) | Template body (`template.body`), product scope (`template.product_scope`) | Compliance-approved template (`collections.template_approved`) | Before use (no registered timer) |

- **ALERTS/METRICS:** Aging alert on any cease flag not effective within 1 business day (target zero); count of gated/blocked contacts that bypassed the contact gate (target zero); frequency-cap breach count and out-of-window call attempts trended weekly.

## CL-06 — Consumer Complaint Intake & Resolution {#cl-06-consumer-complaint-intake-resolution}

- **WHY (Reg cite):** Complete, accurate, and timely complaint handling — including the standard 15-day initial / 60-day final regulator response windows — follows [CFPB complaint-program expectations](https://www.consumerfinance.gov/complaint/process/) and UDAAP review under [Dodd-Frank §§1031 & 1036](https://www.law.cornell.edu/uscode/text/12/5531).

- **SYSTEM BEHAVIOR:** A single complaint platform captures complaints from all channels. Regulator complaints receive an initial response within 15 days and a final response within 60 days; direct member complaints are acknowledged within 5 business days and resolved within 30 days. Every complaint is tagged with root cause and a UDAAP flag, and trends are reported. Root-cause and UDAAP tagging fields are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Direct member complaint received (`complaint.direct_received`) | Complaint channel (`complaint.channel`), member ID (`complaint.member_id`), narrative (`complaint.narrative`) | Acknowledgment sent (`complaint.acknowledged`) | 5 business days (enforced by `complaint.ack_due_at`) |
  | Direct complaint under investigation (`complaint.investigation_completed`) | Investigation notes (`complaint.investigation_notes`), root cause (`complaint.root_cause_tag`), UDAAP flag (`complaint.udaap_flag`) | Resolution recorded (`complaint.resolved`) | 30 days (enforced by `complaint.resolution_due_at`) |
  | Regulator complaint received (`complaint.regulator_received`) | Regulator case detail (`complaint.category`), member ID (`complaint.member_id`), narrative (`complaint.narrative`) | Initial response sent (`complaint.initial_response_sent`) | 15 days (enforced by `complaint.initial_response_due_at`) |
  | Regulator complaint final response due (`complaint.final_response_pending`) | Investigation notes (`complaint.investigation_notes`), root cause (`complaint.root_cause_tag`), UDAAP flag (`complaint.udaap_flag`) | Final response sent (`complaint.final_response_sent`) | 60 days (enforced by `complaint.final_response_due_at`) |
  | Complaint trend review cycle (`complaint.trend_reported`) | Trend summary (`complaint.trend_summary`), UDAAP flag population (`complaint.udaap_flag`) | Complaint trend report (`complaint.trend_reported`) | Per cycle (enforced by `complaint.trend_review_due`) |

- **ALERTS/METRICS:** Aging alerts on any complaint past its acknowledgment, initial, final, or resolution deadline (target zero overdue); UDAAP-flagged complaint rate and root-cause distribution trended; count of complaints missing a root-cause tag at resolution (target zero).

## CL-07 — Credit Reporting & Dispute Handling {#cl-07-credit-reporting-dispute-handling}

- **WHY (Reg cite):** Furnisher accuracy duties, dispute investigation timelines, and identity-theft handling are governed by [FCRA / Regulation V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022), including the furnisher investigation duty under [§1022.43](https://www.ecfr.gov/current/title-12/part-1022#p-1022.43).

- **SYSTEM BEHAVIOR:** The system generates monthly Metro 2 furnishing files, tracks furnishing history per account, and investigates disputes within 30 days of receipt, applying corrections in the next furnishing batch. Identity-theft disputes are escalated to Fraud. Furnishing-file generation and correction application are write-restricted to the Collections data team; dispute determinations affecting credit data require Compliance review.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly furnishing cycle runs (`furnishing.correction_applied`) | Disputed-account flags (`furnishing.disputed_account`), correction-identified flag (`furnishing.correction_identified`), file transmitted flag (`furnishing.file_transmitted`) | Metro 2 file transmitted (`furnishing.correction_applied`) | Monthly (enforced by `furnishing.cycle_due_at`) |
  | Furnishing dispute received (`furnishing.dispute_received`) | Dispute basis (`dispute.basis`), disputed account (`furnishing.disputed_account`), dispute category (`dispute.category`) | Dispute investigation completed and resolved (`furnishing.dispute_resolved`) | 30 days (enforced by `furnishing.dispute_due_at`) |
  | Correction identified from investigation (`furnishing.correction_applied`) | Correction amount (`dispute.correction_amount`), correction evidence (`correction.evidence_artifact_id`) | Correction applied in next batch (`furnishing.correction_applied`) | Next furnishing batch (enforced by `furnishing.cycle_due_at`) |
  | Identity-theft dispute received (`furnishing.idtheft_dispute_received`) | Identity-theft report (`dispute.idtheft_report`), disputed account (`furnishing.disputed_account`) | Fraud case opened (`fraud.idtheft_case_opened`) | 30 days investigation (enforced by `furnishing.dispute_due_at`) |

- **ALERTS/METRICS:** Aging alert on any dispute open past 30 days (target zero); furnishing data-quality variance monitor; count of corrections identified but not applied in the next batch (target zero); identity-theft disputes not escalated to Fraud (target zero).

## CL-08 — Collections Data Breach & Incident Reporting {#cl-08-collections-data-breach-incident-reporting}

- **WHY (Reg cite):** Logging, classifying, and reporting cyber incidents affecting collections data — including NCUA notification no later than 72 hours after reasonable belief of a reportable cyber incident and member notice when misuse is likely — follow [NCUA Part 748 and §748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1) and the [Appendix B guidance on response programs and member notice](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748).

- **SYSTEM BEHAVIOR:** The system logs and classifies incidents affecting collections data, triages them within 24 hours, and notifies NCUA no later than 72 hours after reasonable belief that a reportable cyber incident has occurred. Member notices are sent as soon as reasonably possible after misuse of member information is determined likely. Reportability determination and NCUA notification are write-restricted to IT/Security and the CCO; enterprise incident-response framework details are governed by the Information Security Policy and referenced here only for collections-data scope.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Collections-data incident logged (`incident.collections_logged`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`), severity (`incident.severity`) | Incident triaged (`incident.classified`) | 24 hours (enforced by `incident.triage_due_at`) |
  | Reportable cyber incident believed (`incident.classified`) | Reportability determination (`incident.reportability_determination`), metrics snapshot (`ncua.metrics_snapshot`), trigger condition (`ncua.trigger_condition`) | NCUA notification sent (`incident.ncua_notified`) | 72 hours (enforced by `incident.ncua_notice_due_at`) |
  | Member-information misuse determined likely (`incident.member_impact_confirmed`) | Misuse likelihood (`incident.misuse_likelihood`), member notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent (`incident.member_notices_sent`) | As soon as reasonably possible (enforced by `incident.notification_due_at`) |

- **ALERTS/METRICS:** Aging alert on any incident untriaged past 24 hours and any NCUA notification approaching 72 hours; target zero missed NCUA-notification deadlines; member-notice latency distribution monitored after misuse determination.

## CL-09 — Problem Loans, Nonaccrual & Foreclosure Governance {#cl-09-problem-loans-nonaccrual-foreclosure-governance}

- **WHY (Reg cite):** Risk rating, nonaccrual placement at 90+ DPD or when full collection is doubtful (with accrued-interest reversal), and problem-asset governance follow [interagency nonaccrual / problem-asset guidance](https://www.fdic.gov/regulations/laws/rules/5000-4800.html) and the [FFIEC Uniform Retail Credit Classification Policy](https://www.fdic.gov/news/financial-institution-letters/2000/fil0040.html); foreclosure conduct overlays [state foreclosure laws](https://www.law.cornell.edu/wex/foreclosure) and must avoid UDAAP under [Dodd-Frank §§1031 & 1036](https://www.law.cornell.edu/uscode/text/12/5531).

- **SYSTEM BEHAVIOR:** The system maintains risk ratings (Pass/Watch/Substandard/Doubtful/Loss) and places loans on nonaccrual at 90+ DPD or when full collection is doubtful, reversing accrued interest at placement. A pre-foreclosure financial-impact evaluation is required and must carry CCO and President approval before foreclosure proceeds. Watch/Substandard/Doubtful ratings are reviewed quarterly. Nonaccrual placement and accrued-interest reversal are write-restricted to Finance; foreclosure approval is write-restricted to the CCO and President.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Loan reaches 90+ DPD or collection doubtful (`loan.dpd_updated`) | DPD value (`loan.dpd`), collectibility assessment (`loan.collectibility_assessment`), accrued interest (`loan.accrued_interest`) | Nonaccrual placed and interest reversed (`loan.nonaccrual_triggered`) | At trigger (enforced by `loan.nonaccrual_due_at`) |
  | Quarterly rating review cycle (`loan.rating_review_completed`) | Risk rating (`loan.risk_rating`), Watch/Substandard/Doubtful population, collectibility assessment (`loan.collectibility_assessment`) | Rating review record (`loan.rating_review_completed`) | Quarterly (enforced by `loan.rating_review_due_at`) |
  | Foreclosure proposed (`loan.foreclosure_proposed`) | Foreclosure financial-impact evaluation (`loan.foreclosure_impact_eval`), foreclosure checklist (`legal.foreclosure_checklist`), CCO/President approval | Foreclosure approved (`loan.foreclosure_approved`) | Before action (no registered timer) |
  | Return-to-accrual requested (`loan.accrual_return_requested`) | Repayment evidence (`loan.repayment_evidence`), collectibility assessment (`loan.collectibility_assessment`) | Accrual restored (`loan.accrual_restored`) | At performance threshold (no registered timer) |

- **ALERTS/METRICS:** Alert on any 90+ DPD loan not placed on nonaccrual; target zero foreclosures executed without recorded CCO and President approval; aging alert on overdue `loan.rating_review_due_at` quarterly reviews; nonaccrual interest-reversal reconciliation monitored.

## CL-10 — Overdraft Collections and Fee Waiver Practices {#cl-10-overdraft-collections-and-fee-waiver-practices}

- **WHY (Reg cite):** Overdraft programs that function as extensions of credit must assess fees consistently and avoid unfair, deceptive, or abusive fee and coverage practices under [Dodd-Frank §§1031 & 1036 (UDAAP)](https://www.law.cornell.edu/uscode/text/12/5531); short-term unsecured-credit treatment supports safety-and-soundness oversight per [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748).

- **SYSTEM BEHAVIOR:** The system treats overdrafts as short-term unsecured credit, reviews the daily overdraft report the same business day, and requires approval within lending authority before continued coverage. Fees are assessed consistently against the schedule; fee waivers are permitted only as documented exceptions, and recurring waiver patterns require CCO approval. Ongoing payroll overdraft coverage absent a formal facility is prohibited and blocked. Fee-schedule configuration and waiver approval are write-restricted to Collections Operations, with CCO sign-off required for recurring-pattern waivers.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily overdraft report generated (`overdraft.report_reviewed`) | Daily-report flag (`overdraft.daily_report_generated`), days outstanding (`overdraft.days_outstanding`), lending authority (`officer.lending_authority`) | Reviewed overdraft report (`overdraft.report_reviewed`) | Same business day (enforced by `overdraft.review_due_at`) |
  | Overdraft fee assessed (`overdraft.fee_logged`) | Fee schedule (`overdraft.fee_schedule`), occurrence count (`overdraft.occurrence_count`), fee amount (`overdraft.amount`) | Fee logged (`overdraft.fee_logged`) | At posting (no registered timer) |
  | Fee waiver requested (`overdraft.waiver_requested`) | Waiver reason (`overdraft.waiver_reason`), occurrence count (`overdraft.occurrence_count`) | Waiver approved as documented exception (`overdraft.waiver_approved`) | At decision (no registered timer) |
  | Recurring payroll/overdraft pattern detected (`overdraft.recurring_pattern_detected`) | Payroll coverage flag (`overdraft.payroll_coverage_flag`), occurrence count (`overdraft.occurrence_count`) | Referral issued for CCO review / coverage blocked (`overdraft.referral_issued`) | Same-day review (enforced by `overdraft.review_due_at`) |

- **ALERTS/METRICS:** Aging alert on any daily overdraft report not reviewed same business day (target zero); recurring-waiver pattern count without CCO approval (target zero); count of ongoing payroll overdraft coverage attempts blocked; fee-assessment consistency variance monitored.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. The CCO owns this policy, its configuration object, and the active-version binding for all collections workflows.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Collections Operations, Credit Risk, Legal, IT/Security, Finance, and the Executive Loan Committee, as required by control.
- **Review cadence:** At least annually (enforced by `collections.annual_review_due_at`), and upon material regulatory change. Board/ELC reporting of loans >30 DPD, problem loans, nonaccruals, and OREO occurs at least monthly (enforced by `collections.board_report_due_at`).
- **Cross-refs (out of scope here):** Loan origination/underwriting — Lending Policy; fair-lending and adverse-action — Fair Lending Policy; BSA/AML and SAR filing (referenced for fraud charge-offs in [CL-03](#cl-03-retail-credit-classification-charge-offs)) — BSA Policy; enterprise information-security and incident-response framework (referenced in [CL-08](#cl-08-collections-data-breach-incident-reporting)) — Information Security Policy; member privacy and data-handling — Privacy Policy; OREO valuation/disposition — OREO guidelines; third-party collector vendor management beyond conduct — Third-Party Risk Policy; record-retention schedules beyond collections-specific evidence — Record Retention Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several collections-side field, event, and timer codes referenced in the control overlays are registered in DESIGN_NOTES (e.g., `collections.*`, `loan.*`, `overdraft.*`, `complaint.*`, `furnishing.*`, `incident.*`, `tdr.quarterly_review_due`). Where a needed concept had no registered code, the closest registered or provisional spelling was used verbatim — including `breach.description`/`breach.control_id`/`breach.owner` (provisional), `complaint.narrative`/`complaint.channel`/`complaint.member_id` (provisional), `dispute.description`/`dispute.status`/`dispute.amount` (provisional), `correction.evidence_artifact_id`, and `fraud.investigation_id`. These provisional names are the agreed target naming scheme and will be confirmed by engineering before the next review.
- **No dedicated foreclosure-approval or return-to-accrual timer exists.** CCO/President foreclosure approval ([CL-09](#cl-09-problem-loans-nonaccrual-foreclosure-governance)) and return-to-accrual ([CL-09](#cl-09-problem-loans-nonaccrual-foreclosure-governance)) and DPD-reset-after-three-payments ([CL-04](#cl-04-forbearance-extensions-workouts-tdrs)) have no registered `due_at` timer; these are state-gated rather than time-gated, and the policy enforces them as approval/performance gates with the time column showing the gate condition.
- **Grace-period and state overlay parameters are assumed configurable per product/state.** The 10-day standard and 15-day first-mortgage grace periods, three-month extension cap, and 3–12-month interest-only range are minimum/default standards; Legal maps tighter product- and state-level right-to-cure, foreclosure, and repossession parameters into the active policy configuration. Specific state parameter tables need confirmation.
- **HMDA reporter status and partner risk-tier definitions are not specified in PATRICK_NOTES.** Co-branded/white-label partner program collection parameters and any partner-specific SLA overlays are assumed to inherit the credit-union minimums unless a stricter partner configuration is bound; partner-tier definitions need confirmation.
- **Charter type assumed federally insured credit union.** NCUA Part 748 applicability (including the 72-hour cyber-incident notification in [CL-08](#cl-08-collections-data-breach-incident-reporting)) is assumed based on the credit-union charter; if the entity is privately insured or state-chartered with differing notification rules, [CL-08](#cl-08-collections-data-breach-incident-reporting) timing must be re-confirmed against the applicable supervisor.
- **Past Due Note one-year retention is treated as a minimum.** Longer collections-specific retention is governed by the Record Retention Policy; the `record.retention_expires_at` anchor in [CL-02](#cl-02-delinquency-monitoring-early-stage-collections) assumes the one-year floor unless a longer schedule applies.
