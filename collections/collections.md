---
title: Collections Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Collections, Charge-Offs, Delinquency, FDCPA, FCRA, UDAAP, Nonaccrual]
---

## General Policy Statement

Pynthia Credit Union recognizes, monitors, and controls loan delinquencies and overdrafts; classifies and charges off loans with a high probability of loss in a timely, consistent manner; and treats members fairly and lawfully across all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. This policy applies to all consumer and small-business credit products the credit union originates or services — residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, co-branded/white-label partner programs — and to overdraft programs that function as extensions of credit. The timings here are minimum standards; products, states, or partner programs with stricter requirements must configure tighter SLAs. Collections activity must comply with applicable prudential, safety-and-soundness, consumer-protection, privacy, and information-security requirements.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Material policy breach logged | Breach identified (`collections.policy_breach_logged`) | 5 business days | Breach log entry to CCO | [COL-01](#col-01-collections-governance-scope) |
| Loans >30 DPD / problem loans / nonaccrual / OREO reported to Board | Monthly board cycle (`collections.board_report_issued`) | Monthly | Board/ELC collections report | [COL-01](#col-01-collections-governance-scope) |
| Courtesy notice at grace expiry | Loan hits 10/15 days (`loan.dpd_updated`) | Day 10 (15 first-mortgage) | Courtesy past-due notice | [COL-02](#col-02-delinquency-monitoring-early-stage-collections) |
| Second reminder | Loan hits 20 DPD (`loan.dpd_updated`) | Day 20 | Second reminder notice | [COL-02](#col-02-delinquency-monitoring-early-stage-collections) |
| Right-to-cure on 30-day delinquency | Loan hits 30 DPD (`loan.dpd_updated`) | Within 5 days of 30 DPD | Notice of Right to Cure | [COL-02](#col-02-delinquency-monitoring-early-stage-collections) |
| 60-day status memo | Loan hits 60 DPD (`loan.dpd_updated`) | Within 10 days of 60 DPD | Status memo filed | [COL-02](#col-02-delinquency-monitoring-early-stage-collections) |
| Substandard classification | Loan reaches 90 cumulative DPD (`loan.dpd_updated`) | Month-end | Risk rating set Substandard | [COL-03](#col-03-retail-credit-classification-charge-offs) |
| Closed-end charge-off | Loan reaches 120 DPD (`loan.dpd_updated`) | Month-end | Charge-off booked | [COL-03](#col-03-retail-credit-classification-charge-offs) |
| Open-end charge-off | Loan reaches 180 DPD (`loan.dpd_updated`) | Month-end | Charge-off booked | [COL-03](#col-03-retail-credit-classification-charge-offs) |
| Bankruptcy charge-off | Bankruptcy notice received (`loan.bankruptcy_notice_received`) | 60 days of notice | Charge-off booked | [COL-03](#col-03-retail-credit-classification-charge-offs) |
| Fraud charge-off | Fraud confirmed (`loan.fraud_confirmed`) | 90 days of confirmation | Charge-off booked | [COL-03](#col-03-retail-credit-classification-charge-offs) |
| TDR / modification decision | Workout requested (`loan.workout_requested`) | Per case | Modification decision recorded | [COL-04](#col-04-forbearance-extensions-workouts-tdrs) |
| Active TDR review | Quarterly cycle (`tdr.quarterly_review_completed`) | Quarterly | TDR review record | [COL-04](#col-04-forbearance-extensions-workouts-tdrs) |
| Cease-communication flag effective | Cease request received (`collections.cease_request_received`) | 1 business day | Flag set on member record | [COL-05](#col-05-consumer-protection-in-collections-communications) |
| Regulator complaint response | Regulator complaint received (`complaint.regulator_received`) | 15 days initial / 60 days final | Initial & final responses | [COL-06](#col-06-consumer-complaint-intake-resolution) |
| Direct complaint response | Direct complaint received (`complaint.direct_received`) | 5 BD ack / 30 days resolution | Acknowledgment & resolution | [COL-06](#col-06-consumer-complaint-intake-resolution) |
| Credit-report dispute investigation | Dispute received (`furnishing.dispute_received`) | 30 days | Investigation + correction | [COL-07](#col-07-credit-reporting-dispute-handling) |
| Collections-data incident triage | Incident logged (`incident.collections_logged`) | 24 hours | Triage record | [COL-08](#col-08-collections-data-breach-incident-reporting) |
| NCUA cyber-incident notice | Reportable belief reached (`incident.classified`) | 72 hours | NCUA notification | [COL-08](#col-08-collections-data-breach-incident-reporting) |
| Nonaccrual placement | Loan 90+ DPD / collection doubtful (`loan.nonaccrual_triggered`) | At trigger | Nonaccrual + interest reversal | [COL-09](#col-09-problem-loans-nonaccrual-foreclosure-governance) |
| Pre-foreclosure evaluation | Foreclosure proposed (`loan.foreclosure_proposed`) | Before filing | CCO + President approval | [COL-09](#col-09-problem-loans-nonaccrual-foreclosure-governance) |
| Daily overdraft review | Overdraft report generated (`overdraft.report_reviewed`) | Same business day | Reviewed report + decisions | [COL-10](#col-10-overdraft-collections-and-fee-waiver-practices) |

## COL-01 — Collections Governance & Scope  {#col-01-collections-governance-scope}

**WHY (Reg cite):** Safety-and-soundness oversight of delinquencies, problem assets, and charge-offs follows [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.federalregister.gov/documents/2000/06/12/00-14704/uniform-retail-credit-classification-and-account-management-policy) and [Interagency nonaccrual/problem-asset guidance](https://www.fdic.gov/regulations/safety/manual/section3-7.pdf), with conduct and program governance grounded in [UDAAP — Dodd-Frank §§1031 & 1036 (12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536).

**SYSTEM BEHAVIOR:** A single policy configuration object defines covered products, channels, and three-lines ownership; every collections workflow binds to an active policy version before it can execute. Loans >30 DPD, problem loans, nonaccruals, and OREO are compiled into a monthly Board/Executive Loan Committee report, and the policy itself is reviewed at least annually. Material policy breaches are logged within 5 business days of identification. The policy configuration object and active-version binding are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New collections policy version activated (`collections.policy_version_activated`) | Policy document + version (`policy.document_id`, `policy.document_version`), RACI registry (`policy.raci_registry`), covered scope (`collections.policy_bound`) | Active policy binding for workflows (`collections.policy_version_activated`) | At activation (enforced by `governance.policy_review_due`) |
| Monthly board reporting cycle reached (`collections.board_report_issued`) | >30 DPD population (`loan.days_past_due`), problem loans (`loan.risk_rating`), nonaccruals (`loan.nonaccrual_placed`), OREO/RE writedowns (`loan.re_writedown_booked`) | Board/ELC collections report (`collections.board_report_issued`) | Monthly (enforced by `collections.board_report_due_at`) |
| Annual policy review reached (`collections.policy_review_completed`) | Current policy version (`policy.document_version`), review redline (`policy.change_summary`) | Reviewed/re-approved policy (`collections.policy_review_completed`) | Annually (enforced by `collections.annual_review_due_at`) |
| Material policy breach identified (`collections.policy_breach_logged`) | Breach description (`breach.description`), control reference (`breach.control_id`), owner (`breach.owner`) | Logged breach to CCO (`collections.policy_breach_logged`) | 5 business days (enforced by `collections.breach_log_due_at`) |

**ALERTS/METRICS:** Alert on any unbound collections workflow (target zero), on board-report aging past the monthly cycle, on annual-review aging past due, and on breach-log entries open beyond 5 business days.

## COL-02 — Delinquency Monitoring & Early-Stage Collections  {#col-02-delinquency-monitoring-early-stage-collections}

**WHY (Reg cite):** Prompt, diligent follow-up on deteriorating credits is required by [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.federalregister.gov/documents/2000/06/12/00-14704/uniform-retail-credit-classification-and-account-management-policy); early-stage communications and right-to-cure notices must avoid unfair/deceptive practices under [UDAAP — Dodd-Frank §1031 (12 U.S.C. 5531)](https://www.law.cornell.edu/uscode/text/12/5531) and observe [FDCPA/Reg F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006) communication limits, with state right-to-cure law overlaying these federal minimums.

**SYSTEM BEHAVIOR:** A nightly delinquency engine recomputes days-past-due against contractual due dates, applying grace periods (10 days standard, 15 days for first-mortgage consumer). It emits courtesy notices at 10/15 days, second reminders by day 20, and a Notice of Right to Cure within 5 days of 30-day delinquency, then requires a 60-day status memo within 10 days of 60 DPD. Past-due notes are retained at least one year. State-specific cure parameters are configured by Legal and supersede the standard timeline where stricter. Right-to-cure parameters and the delinquency-engine schedule are write-restricted to Collections Operations and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Nightly delinquency engine updates DPD (`loan.dpd_updated`) | Days past due (`loan.days_past_due`), grace-period config (`loan.grace_period_days`), product type (`loan.product_type`), last payment date (`loan.last_payment_date`) | Updated delinquency state (`loan.dpd_updated`) | Nightly (enforced by `loan.days_past_due`) |
| Loan reaches 10/15-day grace expiry (`loan.dpd_updated`) | Member contact preferences (`member.contact_preferences`), amounts owed (`member.amounts_owed`) | Courtesy past-due notice sent (`collections.courtesy_notice_sent`) | Day 10 / 15 (enforced by `loan.courtesy_notice_due_at`) |
| Loan reaches 20 DPD (`loan.dpd_updated`) | Past-due amount (`loan.past_due_amount`), member contact preferences (`member.contact_preferences`) | Second reminder sent (`collections.second_reminder_sent`) | Day 20 (enforced by `loan.second_reminder_due_at`) |
| Loan reaches 30 DPD (`loan.dpd_updated`) | State cure parameters (`legal.cure_parameters`), past-due amount (`loan.past_due_amount`) | Notice of Right to Cure sent (`collections.right_to_cure_sent`) | 5 days of 30 DPD (enforced by `loan.right_to_cure_due_at`) |
| Loan reaches 60 DPD (`loan.dpd_updated`) | Collectibility assessment (`loan.collectibility_assessment`), workout alternatives (`loan.workout_alternatives`) | 60-day status memo filed (`collections.status_memo_filed`) | 10 days of 60 DPD (enforced by `loan.status_memo_due_at`) |

**ALERTS/METRICS:** Aging alerts on any courtesy/second-reminder/right-to-cure/status-memo task past its due timer (target zero overdue); monitor nightly delinquency-engine run completion and notice-delivery success rates.

## COL-03 — Retail Credit Classification & Charge-Offs  {#col-03-retail-credit-classification-charge-offs}

**WHY (Reg cite):** Retail classification at 90 cumulative DPD and charge-offs at 120 (closed-end) / 180 (open-end) DPD, plus bankruptcy, fraud, death, and real-estate writedown rules, are set by the [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.federalregister.gov/documents/2000/06/12/00-14704/uniform-retail-credit-classification-and-account-management-policy) and [Interagency problem-asset guidance](https://www.fdic.gov/regulations/safety/manual/section3-7.pdf).

**SYSTEM BEHAVIOR:** The system classifies retail loans Substandard at 90 cumulative DPD, auto-charges-off closed-end at 120 DPD and open-end at 180 DPD, with all charge-offs booked at month-end regardless of the exact day the threshold is crossed. Bankruptcy accounts charge off within 60 days of court notice unless documented as likely to repay; fraudulent loans charge off within 90 days of confirmation; deceased-borrower loans charge off once loss is reasonably estimable. Real estate exceeding fair value net of cost to sell is written down. A well-secured loan in the process of collection need not be classified, but the basis must be documented in the file. Charge-off and classification thresholds are write-restricted to Credit Risk and Finance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan reaches 90 cumulative DPD (`loan.dpd_updated`) | Days past due (`loan.days_past_due`), LTV (`loan.ltv`), well-secured documentation (`loan.well_secured_documented`) | Substandard classification (`risk.rating_recorded`) | Month-end (enforced by `loan.classification_due_at`) |
| Closed-end loan reaches 120 DPD / open-end reaches 180 DPD (`loan.dpd_updated`) | Product type (`loan.product_type`), balance (`loan.balance`), collateral value (`loan.collateral_value`) | Charge-off booked (`loan.re_writedown_booked`) | Month-end (enforced by `loan.chargeoff_month_end_at`) |
| Bankruptcy notice received (`loan.bankruptcy_notice_received`) | Bankruptcy case id (`loan.bankruptcy_case_id`), repayment evidence (`loan.repayment_evidence`) | Bankruptcy charge-off booked (`loan.re_writedown_booked`) | 60 days of notice (enforced by `loan.bankruptcy_chargeoff_due_at`) |
| Fraud confirmed (`loan.fraud_confirmed`) | Fraud investigation reference (`fraud.investigation_id`), balance (`loan.balance`) | Fraud charge-off booked (`loan.re_writedown_booked`) | 90 days of confirmation (enforced by `loan.fraud_chargeoff_due_at`) |
| Real-estate value reassessed below balance (`loan.re_writedown_booked`) | Fair value (`collateral.fair_value`), cost to sell (`collateral.cost_to_sell`), balance (`loan.balance`) | RE loss writedown booked (`loan.re_writedown_booked`) | Month-end (enforced by `loan.re_valuation_due`) |

**ALERTS/METRICS:** Target zero loans past charge-off/classification thresholds that remain unbooked at month-end; alert on bankruptcy/fraud charge-off timers approaching due; monitor distribution of write-down amounts against collateral revaluations.

## COL-04 — Forbearance, Extensions, Workouts & TDRs  {#col-04-forbearance-extensions-workouts-tdrs}

**WHY (Reg cite):** Modifications must reflect sustainable repayment capacity and be classified and re-aged consistently per the [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.federalregister.gov/documents/2000/06/12/00-14704/uniform-retail-credit-classification-and-account-management-policy) re-aging/workout guidance, and workout terms must not be unfair, deceptive, or abusive under [UDAAP — Dodd-Frank §§1031 & 1036 (12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536).

**SYSTEM BEHAVIOR:** Hardship forbearance, extensions, and TDRs are governed so each modification reflects documented sustainable repayment capacity; days-past-due reset only after defined performance, e.g., three consecutive modified payments. Extensions are capped (e.g., up to three months), and interest capitalization or interest-only arrangements (3–12 months) require committee approval. Active TDRs are reviewed quarterly. DPD-reset eligibility logic and extension caps are write-restricted to Credit Risk; interest-capitalization/interest-only approval is restricted to the Executive Loan Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member requests workout/hardship (`loan.workout_requested`) | Hardship evidence (`member.hardship_evidence`), repayment capacity (`member.repayment_capacity`), proposed modification (`loan.proposed_modification`) | Modification decision recorded (`loan.modification_decided`) | Per case (enforced by `tdr.review_due_at`) |
| Interest capitalization / interest-only proposed (`loan.io_capitalization_proposed`) | IO term months (`loan.io_term_months`), modified schedule (`loan.modified_schedule`) | ELC approval recorded (`elc.modification_approved`) | Per case (enforced by `tdr.review_due_at`) |
| Third consecutive modified payment received (`loan.modified_payment_3_received`) | DPD-reset eligibility check (`loan.dpd_reset_eligibility_check`), repayment evidence (`loan.repayment_evidence`) | DPD reset applied (`loan.modification_decided`) | At performance (enforced by `loan.dpd_reset`) |
| Quarterly TDR review reached (`tdr.quarterly_review_completed`) | Active TDR population (`loan.modified_schedule`), risk rating (`loan.risk_rating`) | TDR review record (`tdr.quarterly_review_completed`) | Quarterly (enforced by `tdr.quarterly_review_due`) |

**ALERTS/METRICS:** Alert on DPD resets applied without a recorded eligibility check (target zero), on extensions exceeding the configured cap, and on active TDRs past their quarterly review timer.

## COL-05 — Consumer Protection in Collections Communications  {#col-05-consumer-protection-in-collections-communications}

**WHY (Reg cite):** Calling-time, frequency, harassment, and false-information limits are governed by [FDCPA/Regulation F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006) and the [UDAAP prohibition — Dodd-Frank §§1031 & 1036 (12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536).

**SYSTEM BEHAVIOR:** The system enforces permitted calling times by member time zone, frequency caps, and do-not-call/attorney-represented/cease-communication flags at the point of every contact attempt; contact is gated when any flag applies. Harassment, threats, obscene language, and false credit-information disclosures are prohibited by script and policy. All templates and scripts route through Compliance for approval, and cease-communication flags become effective within 1 business day of request. Templates, scripts, and the contact-gating ruleset are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Collector attempts member contact (`collections.contact_logged`) | Contact channel (`collections.contact_channel`), member time zone (`member.timezone`), 7-day frequency (`collections.contact_frequency_7d`), gate check (`collections.contact_gate_check`) | Logged contact with gate outcome (`collections.contact_logged`) | At attempt (no registered timer) |
| Cease-communication request received (`collections.cease_request_received`) | Member cease request (`member.cease_request`), attorney contact if any (`member.attorney_contact`) | Cease/attorney flag set (`member.cease_flag_set`) | 1 business day (enforced by `collections.cease_flag_due_at`) |
| Template/script submitted for review (`collections.template_submitted`) | Template body (`template.body`), product scope (`template.product_scope`) | Compliance-approved template (`collections.template_approved`) | Before use (no registered timer) |

**ALERTS/METRICS:** Alert on any contact attempt that bypassed the gate check or violated a frequency cap (target zero); track cease-flag application latency against the 1-business-day SLA; monitor count of in-use templates lacking Compliance approval (target zero).

## COL-06 — Consumer Complaint Intake & Resolution  {#col-06-consumer-complaint-intake-resolution}

**WHY (Reg cite):** Complete, accurate, and timely complaint handling follows [CFPB complaint-program expectations](https://www.consumerfinance.gov/compliance/supervisory-guidance/) and the [UDAAP prohibition — Dodd-Frank §§1031 & 1036 (12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536), which makes complaint-driven harm a supervisory focus.

**SYSTEM BEHAVIOR:** A single complaint platform captures complaints from all channels. Regulator complaints receive an initial response within 15 days and a final response within 60 days; direct complaints receive an acknowledgment within 5 business days and a resolution within 30 days. Each complaint is tagged with a root cause and a UDAAP flag, and trends are reviewed periodically. Root-cause taxonomy and UDAAP flagging are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulator complaint received (`complaint.regulator_received`) | Channel (`complaint.channel`), narrative (`complaint.narrative`), member id (`complaint.member_id`) | Initial and final responses sent (`complaint.initial_response_sent`, `complaint.final_response_sent`) | 15 days initial / 60 days final (enforced by `complaint.initial_response_due_at`, `complaint.final_response_due_at`) |
| Direct complaint received (`complaint.direct_received`) | Channel (`complaint.channel`), narrative (`complaint.narrative`), member id (`complaint.member_id`) | Acknowledgment and resolution (`complaint.acknowledged`, `complaint.resolved`) | 5 BD ack / 30 days resolution (enforced by `complaint.ack_due_at`, `complaint.resolution_due_at`) |
| Complaint investigation completed (`complaint.investigation_completed`) | Investigation notes (`complaint.investigation_notes`), root cause (`complaint.root_cause_tag`), UDAAP flag (`complaint.udaap_flag`) | Tagged, resolved complaint (`complaint.resolved`) | With resolution (enforced by `complaint.resolution_due_at`) |
| Complaint trend review reached (`complaint.trend_reported`) | Trend summary (`complaint.trend_summary`), category (`complaint.category`) | Trend report (`complaint.trend_reported`) | Periodic (enforced by `complaint.trend_review_due`) |

**ALERTS/METRICS:** Aging alerts on any acknowledgment/initial/final/resolution timer approaching or past due (target zero breaches); monitor UDAAP-flag rate and root-cause concentration for emerging patterns.

## COL-07 — Credit Reporting & Dispute Handling  {#col-07-credit-reporting-dispute-handling}

**WHY (Reg cite):** Furnisher accuracy, dispute investigation, and identity-theft handling are governed by [FCRA/Regulation V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022), including the furnisher-accuracy and dispute-investigation duties at [§1022.42](https://www.ecfr.gov/current/title-12/part-1022/section-1022.42) and [§1022.43](https://www.ecfr.gov/current/title-12/part-1022/section-1022.43).

**SYSTEM BEHAVIOR:** The system generates monthly Metro 2 furnishing files and tracks furnishing history per account. Disputes are investigated within 30 days of receipt, with corrections applied in the next furnishing batch; identity-theft disputes are escalated to Fraud. Furnishing configuration and dispute-disposition authority are write-restricted to the credit-reporting function within Collections Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly furnishing cycle reached (`furnishing.correction_applied`) | Disputed accounts (`furnishing.disputed_account`), corrections identified (`furnishing.correction_identified`), file transmission status (`furnishing.file_transmitted`) | Metro 2 furnishing file transmitted (`furnishing.correction_applied`) | Monthly (enforced by `furnishing.cycle_due_at`) |
| Furnishing dispute received (`furnishing.dispute_received`) | Dispute basis (`dispute.basis`), disputed account (`furnishing.disputed_account`), findings (`dispute.findings`) | Dispute investigation completed + correction (`furnishing.dispute_resolved`, `furnishing.correction_applied`) | 30 days (enforced by `furnishing.dispute_due_at`) |
| Identity-theft dispute received (`furnishing.idtheft_dispute_received`) | Identity-theft report (`dispute.idtheft_report`), dispute category (`dispute.category`) | Fraud case opened (`fraud.idtheft_case_opened`) | 30 days (enforced by `furnishing.dispute_due_at`) |

**ALERTS/METRICS:** Alert on any dispute investigation past 30 days (target zero); confirm corrections land in the next furnishing batch; monitor furnishing-file transmission success and identity-theft escalation latency.

## COL-08 — Collections Data Breach & Incident Reporting  {#col-08-collections-data-breach-incident-reporting}

**WHY (Reg cite):** Incident handling, member-record protection, and reportable cyber-incident notification to NCUA within 72 hours follow [NCUA Part 748 (12 CFR Part 748)](https://www.ecfr.gov/current/title-12/part-748) and its [Appendix B breach-response guidance](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748).

**SYSTEM BEHAVIOR:** Incidents affecting collections data are logged and classified, triaged within 24 hours, and reported to NCUA no later than 72 hours after a reasonable belief of a reportable cyber incident. Member notices are sent as soon as reasonably possible after misuse is determined likely. Reportability determination and NCUA-notification authority are write-restricted to IT/Security and Compliance. Enterprise incident-response framework and SAR linkage are governed by the Information Security and BSA policies respectively.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Collections-data incident logged (`incident.collections_logged`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`), severity (`incident.severity`) | Triage record (`incident.classified`) | 24 hours (enforced by `incident.triage_due_at`) |
| Reportable cyber incident believed (`incident.classified`) | Reportability determination (`incident.reportability_determination`), impact summary (`incident.impact_summary`) | NCUA notification sent (`incident.ncua_notified`) | 72 hours (enforced by `incident.ncua_notice_due_at`) |
| Misuse determined likely (`incident.member_impact_confirmed`) | Misuse likelihood (`incident.misuse_likelihood`), member notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices_sent`) | As soon as reasonably possible (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert on triage approaching the 24-hour mark and on NCUA notification approaching 72 hours (target zero breaches); track member-notice latency after misuse determination.

## COL-09 — Problem Loans, Nonaccrual & Foreclosure Governance  {#col-09-problem-loans-nonaccrual-foreclosure-governance}

**WHY (Reg cite):** Risk-rating, nonaccrual placement with interest reversal, and problem-asset review follow [Interagency nonaccrual/problem-asset guidance](https://www.fdic.gov/regulations/safety/manual/section3-7.pdf) and the [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.federalregister.gov/documents/2000/06/12/00-14704/uniform-retail-credit-classification-and-account-management-policy); foreclosure conduct must avoid unfair/deceptive/abusive practices under [UDAAP — Dodd-Frank §1031 (12 U.S.C. 5531)](https://www.law.cornell.edu/uscode/text/12/5531), with state foreclosure law overlaying.

**SYSTEM BEHAVIOR:** The system maintains risk ratings (Pass/Watch/Substandard/Doubtful/Loss), places loans on nonaccrual at 90+ DPD or when full collection is doubtful, and reverses accrued interest on placement. Foreclosure requires a pre-foreclosure financial-impact evaluation with CCO and President approval before filing. Watch/Substandard/Doubtful ratings are reviewed quarterly. Risk-rating scale and foreclosure approval are write-restricted to Credit Risk, with foreclosure sign-off restricted to the CCO and President.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan reaches 90+ DPD or collection doubtful (`loan.nonaccrual_triggered`) | Days past due (`loan.days_past_due`), accrued interest (`loan.accrued_interest`), collectibility assessment (`loan.collectibility_assessment`) | Nonaccrual placed + interest reversed (`loan.nonaccrual_triggered`) | At trigger (enforced by `loan.nonaccrual_due_at`) |
| Foreclosure proposed (`loan.foreclosure_proposed`) | Foreclosure impact evaluation (`loan.foreclosure_impact_eval`), foreclosure checklist (`legal.foreclosure_checklist`), estimated recovery (`loan.estimated_recovery`) | CCO + President approval recorded (`loan.foreclosure_approved`) | Before filing (no registered timer) |
| Quarterly rating review reached (`loan.rating_review_completed`) | Risk rating (`loan.risk_rating`), problem-loan population (`loan.classified_substandard`) | Rating review record (`loan.rating_review_completed`) | Quarterly (enforced by `loan.rating_review_due_at`) |
| Performance restores collection certainty (`loan.accrual_restored`) | Repayment evidence (`loan.repayment_evidence`), accrual-return request (`loan.accrual_return_requested`) | Accrual restored (`loan.accrual_restored`) | Per case (enforced by `loan.nonaccrual_due_at`) |

**ALERTS/METRICS:** Alert on loans meeting nonaccrual conditions not yet placed (target zero), on foreclosure proposals lacking dual CCO/President approval, and on Watch/Substandard/Doubtful ratings past their quarterly review timer.

## COL-10 — Overdraft Collections and Fee Waiver Practices  {#col-10-overdraft-collections-and-fee-waiver-practices}

**WHY (Reg cite):** Overdraft programs that function as short-term unsecured credit, fee-assessment consistency, and waiver practices are subject to the [UDAAP prohibition — Dodd-Frank §§1031 & 1036 (12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536) and [NCUA safety-and-soundness oversight under Part 741](https://www.ecfr.gov/current/title-12/part-741).

**SYSTEM BEHAVIOR:** Overdrafts are treated as short-term unsecured credit. The daily overdraft report is reviewed the same business day, and approvals must fall within lending authority. Fees are assessed consistently against the configured schedule; fee waivers are allowed only as documented exceptions, with CCO approval required for recurring patterns. Ongoing payroll overdraft coverage is prohibited absent a formal facility. Fee schedule, waiver approval, and the payroll-coverage prohibition flag are write-restricted to Collections Operations and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily overdraft report generated (`overdraft.report_reviewed`) | Overdraft amount (`overdraft.amount`), days outstanding (`overdraft.days_outstanding`), payroll-coverage flag (`overdraft.payroll_coverage_flag`) | Reviewed report + within-authority decisions (`overdraft.report_reviewed`) | Same business day (enforced by `overdraft.review_due_at`) |
| Overdraft fee assessed (`overdraft.fee_logged`) | Fee schedule (`overdraft.fee_schedule`), occurrence count (`overdraft.occurrence_count`) | Logged fee assessment (`overdraft.fee_logged`) | At assessment (no registered timer) |
| Fee waiver requested (`overdraft.waiver_requested`) | Waiver reason (`overdraft.waiver_reason`), occurrence count (`overdraft.occurrence_count`) | Approved waiver exception (`overdraft.waiver_approved`) | Per case (enforced by `overdraft.review_due_at`) |
| Recurring overdraft pattern detected (`overdraft.recurring_pattern_detected`) | Occurrence count (`overdraft.occurrence_count`), payroll-coverage flag (`overdraft.payroll_coverage_flag`) | CCO referral issued (`overdraft.referral_issued`) | Same business day (enforced by `overdraft.review_due_at`) |

**ALERTS/METRICS:** Alert on overdraft reports unreviewed past the same-business-day SLA (target zero), on fee waivers lacking documented exceptions, on recurring patterns missing CCO approval, and on any ongoing payroll-coverage flag absent a formal facility.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy maintenance, control efficacy, and breach escalation.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Collections Operations, Credit Risk, Legal, IT/Security, Finance, and the Executive Loan Committee, per the RACI registry bound in [COL-01](#col-01-collections-governance-scope).
- **Review cadence:** At least annually (enforced under [COL-01](#col-01-collections-governance-scope)), or upon material regulatory change. Board/ELC receives the monthly collections report covering >30 DPD, problem loans, nonaccruals, and OREO.
- **Cross-refs:** Loan origination/underwriting → Lending Policy; fair-lending and adverse-action → Fair Lending Policy; BSA/AML and SAR filing → BSA Policy; enterprise information-security and incident-response framework → Information Security Policy; member privacy and data-handling → Privacy Policy; OREO valuation and disposition → OREO guidelines; third-party collector vendor management → Third-Party Risk Policy; record-retention schedules → Record Retention Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Collections-side resources, fields, events, and timers cited throughout the control overlays are drawn from the parsed core vocabulary where registered; any names not yet registered (or coined under the composition grammar) are the target naming scheme and will be confirmed by engineering before the next review. Where DESIGN_NOTES lists a provisional spelling (e.g., `complaint.id`, `complaint.summary_id`, `cdd.profile`), that exact spelling is used.
- **Charter and applicability.** Pynthia is treated as an NCUA-chartered credit union; Part 748 cyber-incident reporting and Part 741 safety-and-soundness oversight are assumed applicable. NCUA Part 701.31 (nondiscrimination in real-estate lending) is not anchored here because origination/fair-lending is out of scope (Fair Lending Policy). Confirm charter and applicability.
- **State overlays.** State right-to-cure, foreclosure, and repossession requirements vary and overlay these federal minimums; Legal maps product- and state-level cure parameters (`legal.cure_parameters`). The standard 10/15-day grace and 30-day right-to-cure timing assume no stricter state rule applies; confirm per state.
- **Charge-off month-end convention.** All charge-offs are booked at month-end regardless of the exact day the DPD threshold is crossed, per FFIEC guidance; confirm Finance close-cycle alignment with `loan.chargeoff_month_end_at`.
- **DPD-reset performance standard.** The "three consecutive modified payments" re-aging standard is assumed as the minimum; products with stricter re-aging rules must configure tighter eligibility checks. Confirm with Credit Risk.
- **Extension and IO caps.** The up-to-three-months extension cap and 3–12 month interest-only window are assumed defaults requiring ELC approval; confirm exact caps and approval tiers.
- **HMDA reporter status.** Not addressed here; charge-off and collections activity do not themselves trigger HMDA reporting. Confirm reporter status under the Lending/Fair Lending policies.
- **Complaint trend cadence.** The complaint trend-review interval is enforced by `complaint.trend_review_due`; the specific cadence (e.g., monthly vs. quarterly) is assumed and should be confirmed by Compliance.
- **Overdraft "function as credit" scope.** Overdraft programs are treated as short-term unsecured credit for collections purposes; the boundary between covered overdraft lines and incidental courtesy pay should be confirmed against product terms.
