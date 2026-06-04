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

# Collections Policy

## General Policy Statement

Pynthia Credit Union recognizes, monitors, and controls loan delinquencies and overdrafts; classifies and charges off loans with a high probability of loss in a timely, consistent manner; and treats members fairly and lawfully in all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. This policy covers all consumer and small-business credit products the credit union originates or services — residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, and co-branded or white-label partner programs — plus overdraft programs that function as extensions of credit. Timings stated here are minimum standards: products or states with stricter requirements must be configured with tighter SLAs. Loan origination, fair-lending/adverse-action requirements, BSA/AML and SAR filing, enterprise information security, member privacy, detailed OREO valuation, third-party-collector vendor management, and general record-retention schedules are governed by their own policies.

## Timing Matrix

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Board/ELC delinquency reporting | Month-end close (`collections.board_report_due`) | Monthly | Loans >30 DPD, problem loans, nonaccruals, OREO | [CL-01](#cl-01-collections-governance--scope) |
| Material policy breach logged | Breach identified (`collections.policy_breach_identified`) | 5 business days | Breach log entry with remediation plan | [CL-01](#cl-01-collections-governance--scope) |
| Courtesy notice | 10 days past due — 15 for first-mortgage consumer (`loan.delinquency_day_10`) | Day 10/15 | Past-due courtesy notice | [CL-02](#cl-02-delinquency-monitoring--early-stage-collections) |
| Second reminder | 20 days past due (`loan.delinquency_day_20`) | By day 20 | Follow-up reminder notice | [CL-02](#cl-02-delinquency-monitoring--early-stage-collections) |
| Formal right-to-cure | 30 days past due (`loan.delinquency_day_30`) | Within 5 days of 30 DPD | State-compliant right-to-cure notice | [CL-02](#cl-02-delinquency-monitoring--early-stage-collections) |
| 60-day status memo | 60 days past due (`loan.delinquency_day_60`) | Within 10 days of 60 DPD | Status memo to collections management | [CL-02](#cl-02-delinquency-monitoring--early-stage-collections) |
| Substandard classification | 90 cumulative days past due (`loan.delinquency_day_90`) | At 90 DPD | Risk-rating change to Substandard | [CL-03](#cl-03-retail-credit-classification--charge-offs) |
| Closed-end charge-off | 120 days past due (`loan.chargeoff_due_closed_end`) | Month-end of the 120-DPD month | Charge-off entry | [CL-03](#cl-03-retail-credit-classification--charge-offs) |
| Open-end charge-off | 180 days past due (`loan.chargeoff_due_open_end`) | Month-end of the 180-DPD month | Charge-off entry | [CL-03](#cl-03-retail-credit-classification--charge-offs) |
| Bankruptcy charge-off | Bankruptcy notice received (`loan.bankruptcy_notice_received`) | 60 days from notice | Charge-off entry unless repayment documented | [CL-03](#cl-03-retail-credit-classification--charge-offs) |
| Fraud charge-off | Fraud confirmed (`loan.fraud_confirmed`) | 90 days from confirmation | Charge-off entry; BSA referral per BSA Policy | [CL-03](#cl-03-retail-credit-classification--charge-offs) |
| Cease-communication flag effective | Member cease request received (`collections.cease_request_received`) | 1 business day | Communication suppression flag active | [CL-05](#cl-05-consumer-protection-in-collections-communications) |
| Regulator complaint — initial response | Regulator complaint received (`complaint.regulator_received`) | 15 days | Initial response to regulator portal | [CL-06](#cl-06-consumer-complaint-intake--resolution) |
| Regulator complaint — final response | Regulator complaint received (`complaint.regulator_received`) | 60 days | Final response with resolution | [CL-06](#cl-06-consumer-complaint-intake--resolution) |
| Direct complaint — acknowledgment | Direct complaint received (`complaint.direct_received`) | 5 business days | Acknowledgment to member | [CL-06](#cl-06-consumer-complaint-intake--resolution) |
| Direct complaint — resolution | Direct complaint received (`complaint.direct_received`) | 30 days | Resolution letter with root-cause tag | [CL-06](#cl-06-consumer-complaint-intake--resolution) |
| Credit-report dispute investigation | Dispute received (`furnishing.dispute_received`) | 30 days of receipt | Investigation result; correction in next batch | [CL-07](#cl-07-credit-reporting--dispute-handling) |
| Incident triage | Collections-data incident logged (`incident.collections_logged`) | 24 hours | Classified incident record | [CL-08](#cl-08-collections-data-breach--incident-reporting) |
| NCUA cyber-incident notification | Reasonable belief of reportable incident (`incident.reportable_determined`) | 72 hours | NCUA notification | [CL-08](#cl-08-collections-data-breach--incident-reporting) |
| Nonaccrual placement | 90+ DPD or collection doubtful (`loan.nonaccrual_triggered`) | At trigger | Nonaccrual status; accrued-interest reversal | [CL-09](#cl-09-problem-loans-nonaccrual--foreclosure-governance) |
| TDR portfolio review | Quarter-end (`tdr.quarterly_review_due`) | Quarterly | TDR performance review | [CL-04](#cl-04-forbearance-extensions-workouts--tdrs) |
| Problem-loan rating review | Quarter-end (`loan.rating_review_due`) | Quarterly | Watch/Substandard/Doubtful rating refresh | [CL-09](#cl-09-problem-loans-nonaccrual--foreclosure-governance) |
| Daily overdraft report review | Business-day open (`overdraft.daily_report_generated`) | Same business day | Reviewed overdraft report with dispositions | [CL-10](#cl-10-overdraft-collections-and-fee-waiver-practices) |

## CL-01 — Collections Governance & Scope

**WHY (Reg cite):** Sound collections governance is a safety-and-soundness expectation under NCUA's general lending rule, [12 CFR §701.21](https://www.ecfr.gov/current/title-12/part-701/section-701.21), and weak oversight of delinquency and loss recognition exposes members to unfair practices prohibited by Dodd-Frank §§1031 & 1036, [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531) and [12 U.S.C. 5536](https://www.law.cornell.edu/uscode/text/12/5536).

**SYSTEM BEHAVIOR:** A single policy configuration object defines covered products, channels, and three-lines ownership (Collections Operations as first line, Compliance and Credit Risk as second, Internal Audit as third). Every collections workflow binds to an active policy version at execution time; workflows referencing a retired version are blocked until rebound. The system compiles a monthly Board/Executive Loan Committee package covering loans >30 DPD, problem loans, nonaccruals, and OREO, and enforces an annual policy review with version increment. Material breaches of this policy are logged within 5 business days of identification with a remediation owner. The policy configuration object is write-restricted to Compliance; breach-log closure is restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Policy version activated or amended (`collections.policy_version_activated`) | Covered products (`policy.covered_products[]`), channels (`policy.channels[]`), ownership map (`policy.three_lines_owners[]`), version (`policy.version`) | Active policy configuration bound to workflows (`collections.policy_bound`) | Before any dependent workflow runs (internal: same day) |
| Month-end close reached (`collections.board_report_due`) | Delinquency roll (`loan.dpd_bucket[]`), problem-loan list (`loan.risk_rating[]`), nonaccrual list (`loan.accrual_status[]`), OREO inventory (`oreo.balance[]`) | Board/ELC delinquency package (`collections.board_report_issued`) | Monthly (internal: by 10th business day; enforced by `collections.board_report_due_at`) |
| Material breach identified (`collections.policy_breach_identified`) | Breach description (`breach.description`), affected control (`breach.control_id`), remediation owner (`breach.owner`) | Breach log entry with remediation plan (`collections.policy_breach_logged`) | 5 business days (enforced by `collections.breach_log_due_at`) |
| Annual review window opens (`collections.annual_review_due`) | Current policy text (`policy.version`), regulatory-change inventory (`policy.reg_change_log[]`) | Reviewed/reapproved policy version (`collections.policy_review_completed`) | 12 months from prior approval (internal: 60-day review window; enforced by `collections.annual_review_due_at`) |

**ALERTS/METRICS:** Alert if the monthly Board package is not issued by the 10th business day; alert on any workflow executing against a retired policy version (target zero); track breach-log aging with escalation to the CCO at 3 business days open.

## CL-02 — Delinquency Monitoring & Early-Stage Collections

**WHY (Reg cite):** Timely delinquency follow-up is a prudential expectation under [12 CFR §701.21](https://www.ecfr.gov/current/title-12/part-701/section-701.21); right-to-cure notices are mandated by state law (varies by state, mapped by Legal), and collection conduct must avoid unfair or deceptive practices under [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** A nightly delinquency engine computes days past due for every loan, applying a 10-day grace period as standard and 15 days for first-mortgage consumer loans. The engine emits stage events that drive notices: courtesy notice at day 10 (day 15 for first mortgages), second reminder by day 20, formal state-compliant right-to-cure within 5 days of reaching 30 days delinquent, and a 60-day status memo to collections management within 10 days of reaching 60 DPD. State or product parameters that require tighter timings override these defaults. Past Due Notes (collector contact records) are retained for at least one year. Grace-period and notice-template parameters are write-restricted to Compliance; delinquency-stage overrides require documented justification by a collections supervisor.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Nightly batch runs (`loan.delinquency_engine_run`) | Payment due dates (`loan.next_payment_due`), payments received (`loan.last_payment_date`), grace period (`loan.grace_period_days`) | Updated DPD value per loan (`loan.dpd_updated`) | Nightly (internal: complete by 6:00 AM; enforced by `loan.delinquency_engine_schedule`) |
| Loan reaches 10/15 days past due (`loan.delinquency_day_10`) | Member contact details (`member.contact_preferences`), past-due amount (`loan.past_due_amount`), product type (`loan.product_type`) | Courtesy past-due notice (`collections.courtesy_notice_sent`) | Day 10 standard / day 15 first-mortgage consumer (enforced by `loan.courtesy_notice_due_at`) |
| Loan reaches 20 days past due (`loan.delinquency_day_20`) | Prior notice history (`collections.notice_history[]`), past-due amount (`loan.past_due_amount`) | Second reminder notice (`collections.second_reminder_sent`) | By day 20 (enforced by `loan.second_reminder_due_at`) |
| Loan reaches 30 days past due (`loan.delinquency_day_30`) | State of residence (`member.state`), state cure parameters (`legal.cure_parameters`), past-due amount (`loan.past_due_amount`) | Formal right-to-cure notice (`collections.right_to_cure_sent`) | Within 5 days of 30 DPD per state law (enforced by `loan.right_to_cure_due_at`) |
| Loan reaches 60 days past due (`loan.delinquency_day_60`) | Collection actions to date (`collections.action_history[]`), collateral position (`loan.collateral_value`), member circumstances (`collections.member_notes`) | 60-day status memo to collections management (`collections.status_memo_filed`) | Within 10 days of 60 DPD (enforced by `loan.status_memo_due_at`) |
| Collector contact logged (`collections.contact_logged`) | Contact channel (`collections.contact_channel`), outcome (`collections.contact_outcome`), collector ID (`collections.collector_id`) | Past Due Note retained ≥1 year (`collections.past_due_note_retained`) | — |

**ALERTS/METRICS:** Alert on any loan past a notice deadline without the corresponding notice event (target zero); track notice latency distribution by stage; monitor nightly-engine completion time and alert on failure or runs past 6:00 AM.

## CL-03 — Retail Credit Classification & Charge-Offs

**WHY (Reg cite):** The [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.govinfo.gov/content/pkg/FR-2000-06-12/pdf/00-14704.pdf) requires Substandard classification at 90 cumulative DPD, charge-off of closed-end retail credit at 120 DPD and open-end at 180 DPD, bankruptcy charge-off within 60 days of notice, fraud within 90 days, and loss recognition on real estate exceeding fair value less cost to sell; full and fair loss disclosure is required by [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702).

**SYSTEM BEHAVIOR:** The delinquency engine drives automatic classification and charge-off: retail loans are classified Substandard at 90 cumulative DPD; closed-end loans auto-charge-off at 120 DPD and open-end at 180 DPD, with the entry booked by the end of the month in which the threshold is reached. Bankruptcy accounts charge off within 60 days of court notice unless documented evidence shows repayment is likely; confirmed-fraud loans charge off within 90 days of confirmation (with BSA referral handled under the BSA Policy); deceased-borrower loans charge off once the loss is reasonably estimable. For residential real estate at the charge-off threshold, a current valuation is obtained and any balance exceeding fair value net of cost to sell is written down to loss. A loan that is well secured and in the process of collection — documented in the file — may be exempted from classification. Charge-off does not end collection effort: recovery activity continues until ultimate uncollectibility is determined. Charge-off execution and classification overrides are write-restricted to Credit Risk with CCO visibility.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan reaches 90 cumulative DPD (`loan.delinquency_day_90`) | DPD computation (`loan.dpd`), current rating (`loan.risk_rating`), well-secured exemption flag (`loan.well_secured_documented`) | Substandard classification (`loan.classified_substandard`) | At 90 DPD (enforced by `loan.classification_due_at`) |
| Closed-end loan reaches 120 DPD (`loan.chargeoff_due_closed_end`) | Outstanding balance (`loan.balance`), collateral value (`loan.collateral_value`), exemption documentation (`loan.well_secured_documented`) | Charge-off entry to allowance (`loan.charged_off`) | Month-end of the 120-DPD month (enforced by `loan.chargeoff_month_end_at`) |
| Open-end loan reaches 180 DPD (`loan.chargeoff_due_open_end`) | Outstanding balance (`loan.balance`), exemption documentation (`loan.well_secured_documented`) | Charge-off entry to allowance (`loan.charged_off`) | Month-end of the 180-DPD month (enforced by `loan.chargeoff_month_end_at`) |
| Bankruptcy notice received (`loan.bankruptcy_notice_received`) | Filing details (`loan.bankruptcy_case_id`), repayment-likelihood documentation (`loan.repayment_evidence`) | Charge-off entry or documented exception (`loan.charged_off`) | 60 days from notice (enforced by `loan.bankruptcy_chargeoff_due_at`) |
| Fraud confirmed (`loan.fraud_confirmed`) | Fraud investigation result (`fraud.investigation_id`), balance (`loan.balance`) | Charge-off entry + referral to BSA process (`loan.charged_off`) | 90 days from confirmation (enforced by `loan.fraud_chargeoff_due_at`) |
| Borrower death — loss reasonably estimable (`loan.death_loss_estimable`) | Estate/insurance claim status (`loan.estate_claim_status`), estimated recovery (`loan.estimated_recovery`) | Charge-off of estimated loss (`loan.charged_off`) | When loss is reasonably estimable (internal: within 30 days of determination) |
| Residential RE at charge-off threshold (`loan.re_valuation_due`) | Current property valuation (`collateral.fair_value`), estimated cost to sell (`collateral.cost_to_sell`), balance (`loan.balance`) | Write-down of balance exceeding fair value net of cost to sell (`loan.re_writedown_booked`) | Month-end of the threshold month (enforced by `loan.chargeoff_month_end_at`) |

**ALERTS/METRICS:** Alert on any loan past its charge-off threshold without a charge-off entry or documented well-secured exemption (target zero at month-end close); track classification latency; report monthly charge-off totals by reason code (delinquency, bankruptcy, fraud, death) to the Board package in [CL-01](#cl-01-collections-governance--scope).

## CL-04 — Forbearance, Extensions, Workouts & TDRs

**WHY (Reg cite):** The [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.govinfo.gov/content/pkg/FR-2000-06-12/pdf/00-14704.pdf) limits re-aging and requires that extensions, deferrals, renewals, and rewrites be based on a renewed willingness and ability to repay; workout arrangements that mislead members about terms are unfair or deceptive under [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** Hardship forbearance, extensions, and troubled-debt restructurings are approved only where the modified terms reflect sustainable repayment capacity, documented in the file. Days-past-due resets occur only after defined performance — three consecutive modified payments received as agreed — never at modification booking. Extensions are capped at three months; interest capitalization and interest-only arrangements (3–12 months) require Executive Loan Committee approval. Active TDRs are reviewed quarterly for performance against modified terms. Modification booking is write-restricted to Collections Operations supervisors; DPD-reset execution is system-automated and cannot be manually overridden without CCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Hardship/workout request received (`loan.workout_requested`) | Hardship documentation (`member.hardship_evidence`), income/capacity analysis (`member.repayment_capacity`), proposed terms (`loan.proposed_modification`) | Approved or declined modification with rationale (`loan.modification_decided`) | — (internal: decision within 15 business days) |
| Interest capitalization or interest-only proposed (`loan.io_capitalization_proposed`) | Capacity analysis (`member.repayment_capacity`), term length 3–12 months (`loan.io_term_months`), committee packet (`elc.approval_packet`) | ELC approval or denial (`elc.modification_approved`) | Before booking (internal: next scheduled ELC meeting) |
| Third consecutive modified payment received (`loan.modified_payment_3_received`) | Modified payment schedule (`loan.modified_schedule`), payment history (`loan.payment_history[]`) | DPD reset to current (`loan.dpd_reset`) | After third consecutive on-time modified payment (enforced by `loan.dpd_reset_eligibility_check`) |
| Quarter-end reached (`tdr.quarterly_review_due`) | Active TDR list (`tdr.active_list[]`), performance status (`tdr.performance_status[]`) | Quarterly TDR review memo (`tdr.quarterly_review_completed`) | Quarterly (internal: within 20 business days of quarter-end; enforced by `tdr.review_due_at`) |

**ALERTS/METRICS:** Alert on any DPD reset without a corresponding three-payment performance record (target zero); track extension counts per loan to flag serial extensions; monitor TDR re-default rate quarterly and report it in the [CL-01](#cl-01-collections-governance--scope) Board package.

## CL-05 — Consumer Protection in Collections Communications

**WHY (Reg cite):** FDCPA/Regulation F, [12 CFR Part 1006](https://www.ecfr.gov/current/title-12/part-1006), restricts communication times, places, and frequency ([§1006.6](https://www.ecfr.gov/current/title-12/part-1006/section-1006.6), [§1006.14](https://www.ecfr.gov/current/title-12/part-1006/section-1006.14)) and prohibits harassment, false representations, and unfair practices ([§1006.18](https://www.ecfr.gov/current/title-12/part-1006/section-1006.18), [§1006.22](https://www.ecfr.gov/current/title-12/part-1006/section-1006.22)); first-party conduct is held to the same standard under [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** The outbound-communication engine enforces permitted calling windows (8 AM–9 PM member local time), frequency caps modeled on Reg F's seven-calls-in-seven-days presumption, and hard suppression for do-not-call, attorney-represented, and cease-communication flags. Cease-communication flags take effect within 1 business day of the member's request. Harassment, threats, obscene language, and false statements about credit information are prohibited in all channels; all templates and scripts are routed through Compliance approval before use. Third-party collectors operating on Pynthia's behalf are bound to these same conduct rules contractually (vendor oversight per the Third-Party Risk Policy). Suppression-flag removal and template approval are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Outbound contact attempted (`collections.contact_attempted`) | Member local time (`member.timezone`), contact count in window (`collections.contact_frequency_7d`), suppression flags (`member.suppression_flags[]`) | Allowed contact or block decision (`collections.contact_gated`) | Real-time at attempt (enforced by `collections.contact_gate_check`) |
| Cease-communication request received (`collections.cease_request_received`) | Request channel and content (`member.cease_request`), affected accounts (`member.account_ids[]`) | Active suppression flag (`member.cease_flag_set`) | 1 business day (enforced by `collections.cease_flag_due_at`) |
| Attorney representation identified (`collections.attorney_identified`) | Attorney contact details (`member.attorney_contact`) | Attorney-routing flag; member contact suppressed (`member.attorney_flag_set`) | 1 business day (internal SLA; enforced by `collections.attorney_flag_due_at`) |
| New or revised template/script submitted (`collections.template_submitted`) | Template content (`template.body`), channel (`template.channel`), product scope (`template.product_scope`) | Compliance-approved template version (`collections.template_approved`) | Before first use (internal: review within 10 business days) |

**ALERTS/METRICS:** Alert on any contact attempt that bypasses the gate (target zero); track cease-flag activation latency against the 1-business-day SLA; monitor frequency-cap near-misses and report monthly conduct exceptions to Compliance.

## CL-06 — Consumer Complaint Intake & Resolution

**WHY (Reg cite):** CFPB complaint-program expectations under [12 U.S.C. 5534](https://www.law.cornell.edu/uscode/text/12/5534) call for complete, accurate, and timely responses (typically 15 days initial, 60 days final for regulator-routed complaints), and unaddressed complaint patterns evidence unfair or abusive practices under [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** A single complaint platform captures complaints from all channels — branch, phone, mail, email, web, social, regulator portals — into one queue with deduplication. Regulator-routed complaints receive an initial response within 15 days and a final response within 60 days; direct member complaints are acknowledged within 5 business days and resolved within 30 days. Every closed complaint carries a root-cause tag and a UDAAP flag where conduct concerns are present; UDAAP-flagged complaints escalate to Compliance for pattern review. Complaint-record edits after closure are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Complaint received from regulator portal (`complaint.regulator_received`) | Complaint narrative (`complaint.narrative`), member/account match (`complaint.member_id`), portal deadline (`complaint.portal_due_date`) | Initial response filed (`complaint.initial_response_sent`) | 15 days (enforced by `complaint.initial_response_due_at`) |
| Regulator complaint open past initial response (`complaint.final_response_pending`) | Investigation findings (`complaint.investigation_notes`), remediation actions (`complaint.remediation[]`) | Final response with resolution (`complaint.final_response_sent`) | 60 days (enforced by `complaint.final_response_due_at`) |
| Direct complaint received — any channel (`complaint.direct_received`) | Channel (`complaint.channel`), narrative (`complaint.narrative`), member match (`complaint.member_id`) | Acknowledgment to member (`complaint.acknowledged`) | 5 business days (enforced by `complaint.ack_due_at`) |
| Direct complaint investigation completes (`complaint.investigation_completed`) | Findings (`complaint.investigation_notes`), root cause (`complaint.root_cause_tag`), UDAAP assessment (`complaint.udaap_flag`) | Resolution letter; tagged, closed record (`complaint.resolved`) | 30 days from receipt (enforced by `complaint.resolution_due_at`) |

**ALERTS/METRICS:** Alert at 80% of any response deadline for open complaints; track on-time rates for all four deadlines (target ≥98%); trend root-cause tags and UDAAP-flag volume monthly for Compliance pattern review.

## CL-07 — Credit Reporting & Dispute Handling

**WHY (Reg cite):** FCRA furnisher duties under [15 U.S.C. §1681s-2](https://www.law.cornell.edu/uscode/text/15/1681s-2) and Regulation V, [12 CFR Part 1022](https://www.ecfr.gov/current/title-12/part-1022) (accuracy and dispute-investigation duties at [§1022.42](https://www.ecfr.gov/current/title-12/part-1022/section-1022.42) and [§1022.43](https://www.ecfr.gov/current/title-12/part-1022/section-1022.43)), require accurate furnishing, investigation of disputes within the FCRA's 30-day window, and identity-theft handling.

**SYSTEM BEHAVIOR:** The furnishing engine generates monthly Metro 2 files for all reported portfolios and retains a complete furnishing history per account so that what was reported, and when, is reconstructible. Direct and CRA-routed disputes are investigated within 30 days of receipt; corrections determined by the investigation are applied in the next furnishing batch, with out-of-cycle corrections for material errors. Disputes asserting identity theft escalate to Fraud and suppress furnishing of the disputed tradeline pending investigation. Metro 2 file generation parameters and manual furnishing corrections are write-restricted to a designated furnishing team with Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly furnishing cycle opens (`furnishing.cycle_due`) | Account statuses (`loan.status[]`), DPD values (`loan.dpd[]`), balances (`loan.balance[]`), prior furnishing history (`furnishing.history[]`) | Metro 2 file transmitted to CRAs (`furnishing.file_transmitted`) | Monthly (internal: by the CRA cutoff date; enforced by `furnishing.cycle_due_at`) |
| Dispute received — direct or CRA e-OSCAR (`furnishing.dispute_received`) | Disputed tradeline (`furnishing.disputed_account`), dispute basis (`dispute.basis`), furnishing history (`furnishing.history[]`) | Investigation result; member/CRA response (`furnishing.dispute_resolved`) | 30 days of receipt (enforced by `furnishing.dispute_due_at`) |
| Investigation finds reporting error (`furnishing.correction_identified`) | Corrected values (`furnishing.corrected_fields[]`), affected periods (`furnishing.affected_cycles[]`) | Correction in next furnishing batch (`furnishing.correction_applied`) | Next monthly batch (enforced by `furnishing.cycle_due_at`) |
| Dispute asserts identity theft (`furnishing.idtheft_dispute_received`) | Identity-theft report/affidavit (`dispute.idtheft_report`), affected tradelines (`furnishing.disputed_account`) | Fraud escalation; tradeline furnishing suppressed pending outcome (`fraud.idtheft_case_opened`) | — (internal: escalate within 2 business days) |

**ALERTS/METRICS:** Alert on disputes open past day 25 (target zero past day 30); reconcile furnished records against servicing data monthly and track the exception count; monitor Metro 2 transmission success and CRA rejection rates per cycle.

## CL-08 — Collections Data Breach & Incident Reporting

**WHY (Reg cite):** NCUA Part 748, [12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1), requires notification to the NCUA as soon as possible and no later than 72 hours after reasonable belief of a reportable cyber incident, and [12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) sets member-notification expectations when misuse of member information has occurred or is reasonably possible.

**SYSTEM BEHAVIOR:** Incidents affecting collections data — member contact records, delinquency histories, dispute files, furnishing data — are logged in the incident register and classified by severity. Triage completes within 24 hours of logging. When IT/Security and Compliance form a reasonable belief that a reportable cyber incident has occurred, the NCUA is notified no later than 72 hours after that determination; member notices are sent as soon as reasonably possible after a determination that misuse of member information has occurred or is reasonably likely. This control governs the collections-specific reporting obligations only; the enterprise incident-response framework, forensics, and containment procedures are governed by the Information Security Policy. Incident classification and regulator-notification issuance are write-restricted to IT/Security leadership and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Collections-data incident logged (`incident.collections_logged`) | Affected systems/data (`incident.affected_assets[]`), discovery details (`incident.discovery_notes`), initial severity (`incident.severity`) | Classified incident record (`incident.triaged`) | 24 hours (enforced by `incident.triage_due_at`) |
| Reasonable belief of reportable cyber incident formed (`incident.reportable_determined`) | Incident classification (`incident.severity`), reportability analysis (`incident.reportability_assessment`), CCO sign-off (`incident.cco_signoff`) | NCUA notification filed (`incident.ncua_notified`) | 72 hours from determination (enforced by `incident.ncua_notice_due_at`) |
| Misuse of member information determined likely (`incident.misuse_determined`) | Affected member population (`incident.affected_members[]`), notice template (`incident.member_notice_template`) | Member notices dispatched (`incident.member_notices_sent`) | As soon as reasonably possible (internal: within 10 business days of determination) |

**ALERTS/METRICS:** Alert at 12 hours for untriaged incidents and at 48 hours post-determination for unfiled NCUA notices; track triage and notification latency distributions; target zero late NCUA notifications.

## CL-09 — Problem Loans, Nonaccrual & Foreclosure Governance

**WHY (Reg cite):** Interagency problem-asset and nonaccrual standards — reflected in the [NCUA Call Report instructions](https://ncua.gov/regulation-supervision/regulatory-reporting/call-report-resources) and the [FFIEC Uniform Retail Credit Classification policy](https://www.govinfo.gov/content/pkg/FR-2000-06-12/pdf/00-14704.pdf) — require nonaccrual at 90+ DPD or when full collection is doubtful; foreclosure decisions implicate state foreclosure law and the UDAAP prohibitions of [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** Every loan carries a risk rating from the Pass/Watch/Substandard/Doubtful/Loss scale. Loans are placed on nonaccrual at 90+ DPD or earlier when full collection of principal and interest becomes doubtful; at placement, accrued-but-uncollected interest is reversed. Return to accrual requires sustained performance and a documented collectibility determination. Before any foreclosure referral, a financial-impact evaluation comparing foreclosure to workout alternatives is completed and approved by the CCO and President. Watch, Substandard, and Doubtful ratings are reviewed quarterly. A loan that is well secured and in the process of collection may remain on accrual with documented justification. Risk-rating changes are write-restricted to Credit Risk; foreclosure-referral approval is restricted to the CCO and President jointly.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan hits 90+ DPD or collection doubtful (`loan.nonaccrual_triggered`) | DPD (`loan.dpd`), collectibility assessment (`loan.collectibility_assessment`), accrued interest (`loan.accrued_interest`) | Nonaccrual status; accrued-interest reversal entry (`loan.nonaccrual_placed`) | At trigger (internal: within 5 business days; enforced by `loan.nonaccrual_due_at`) |
| Sustained performance demonstrated (`loan.accrual_return_requested`) | Payment performance record (`loan.payment_history[]`), collectibility determination (`loan.collectibility_assessment`) | Return-to-accrual with documented basis (`loan.accrual_restored`) | — |
| Foreclosure referral proposed (`loan.foreclosure_proposed`) | Financial-impact evaluation (`loan.foreclosure_impact_eval`), workout-alternative analysis (`loan.workout_alternatives`), state-law checklist (`legal.foreclosure_checklist`) | CCO + President approval or denial (`loan.foreclosure_approved`) | Before referral to counsel (internal: decision within 15 business days) |
| Quarter-end reached (`loan.rating_review_due`) | Watch/Substandard/Doubtful inventory (`loan.risk_rating[]`), updated financials/collateral (`loan.collateral_value[]`) | Refreshed ratings with rationale (`loan.rating_review_completed`) | Quarterly (internal: within 20 business days of quarter-end; enforced by `loan.rating_review_due_at`) |

**ALERTS/METRICS:** Alert on loans 90+ DPD still accruing without a documented well-secured exemption (target zero); track nonaccrual placement latency; alert on any foreclosure referral lacking both required approvals; report nonaccrual and rating-migration totals in the [CL-01](#cl-01-collections-governance--scope) Board package.

## CL-10 — Overdraft Collections and Fee Waiver Practices

**WHY (Reg cite):** NCUA's overdraft-policy requirements for federal credit unions, [12 CFR §701.21(c)(3)](https://www.ecfr.gov/current/title-12/part-701/section-701.21), require a written overdraft policy with time limits and account caps, and inconsistent fee practices or undisclosed overdraft handling are unfair or deceptive under [12 U.S.C. 5531](https://www.law.cornell.edu/uscode/text/12/5531).

**SYSTEM BEHAVIOR:** Overdrafts are treated as short-term unsecured extensions of credit. The daily overdraft report is reviewed the same business day it is generated, with each overdraft approved or actioned within the reviewing officer's lending authority. Overdraft fees are assessed consistently per the published schedule; fee waivers are documented exceptions, and recurring waiver patterns for the same member require CCO approval. Ongoing coverage of payroll or other recurring obligations through overdraft is prohibited absent a formal credit facility — repeated reliance triggers referral to lending for a formal product or to collections for repayment. Unresolved overdrafts age into the delinquency framework of [CL-02](#cl-02-delinquency-monitoring--early-stage-collections) and the charge-off standards of [CL-03](#cl-03-retail-credit-classification--charge-offs). Fee-waiver execution above defined thresholds and the fee schedule itself are write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily overdraft report generated (`overdraft.daily_report_generated`) | Overdrawn accounts (`account.balances.balance`), overdraft amounts and aging (`overdraft.amount`, `overdraft.days_outstanding`), reviewer authority (`officer.lending_authority`) | Reviewed report with per-item dispositions (`overdraft.report_reviewed`) | Same business day (enforced by `overdraft.review_due_at`) |
| Overdraft fee event posts (`overdraft.fee_assessed`) | Fee schedule (`overdraft.fee_schedule`), account history (`overdraft.occurrence_count`) | Fee entry consistent with schedule (`overdraft.fee_logged`) | At posting (internal: same day) |
| Fee waiver requested (`overdraft.waiver_requested`) | Waiver justification (`overdraft.waiver_reason`), member waiver history (`overdraft.waiver_history[]`), approver authority (`officer.lending_authority`) | Documented waiver exception; CCO approval where pattern is recurring (`overdraft.waiver_approved`) | — (internal: decision within 2 business days) |
| Recurring payroll-coverage pattern detected (`overdraft.recurring_pattern_detected`) | Occurrence pattern (`overdraft.occurrence_count`), payroll-coverage indicator (`overdraft.payroll_coverage_flag`) | Referral to lending for formal facility or to collections (`overdraft.referral_issued`) | — (internal: within 5 business days of detection) |

**ALERTS/METRICS:** Alert on daily overdraft reports not reviewed by end of business day (target zero); track waiver counts per member and flag members exceeding the recurrence threshold; monitor aged overdrafts (>30 days) feeding into the delinquency engine.

## Governance & Sign-Off

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, configuration parameters, and breach-log oversight.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Collections Operations, Credit Risk, Legal, IT/Security, Finance, and the Executive Loan Committee, per the three-lines ownership map in [CL-01](#cl-01-collections-governance--scope).
- **Review cadence:** Annual review and reapproval (next review 2027-06-04), with off-cycle updates on material regulatory or product change.
- **Cross-references:** Lending Policy (origination and underwriting), Fair Lending Policy (adverse-action requirements), BSA Policy (SAR filing for fraud charge-offs), Information Security Policy (enterprise incident response), Privacy Policy (member data handling), OREO guidelines (valuation and disposition), Third-Party Risk Policy (collector vendor management), Record Retention Policy (general retention schedules).

## Assumptions & Gaps

- **Engineering vocabulary is provisional.** The parsed `vocabulary.json` spec is banking-core only (entities, accounts, transfers, cards) and registers zero events, no lending or collections entities, and no timers. Every `loan.*`, `collections.*`, `complaint.*`, `furnishing.*`, `incident.*`, `tdr.*`, `overdraft.*`, `elc.*`, `fraud.*`, `oreo.*`, `legal.*`, `member.*`, `template.*`, `dispute.*`, `policy.*`, `breach.*`, `collateral.*`, and `officer.*` code in this document is the target naming scheme and must be registered by engineering before the next review. The only banking-core field referenced directly is `account.balances.balance` in [CL-10](#cl-10-overdraft-collections-and-fee-waiver-practices).
- The right-to-cure trigger and content are state-specific; Legal maintains the product/state parameter map, and the 30-DPD/5-day default here is a baseline, not a substitute for stricter state timelines.
- The reference policy's 60% LTV threshold for substandard classification of delinquent residential loans was not adopted as a numeric parameter; Credit Risk should confirm the LTV threshold to encode in the classification engine.
- Patrick's notes specify a 15-day grace period for "first-mortgage consumer" loans; assumed this means consumer-purpose first-lien residential mortgages only, with home equity and other junior liens at the 10-day standard.
- "Three consecutive modified payments" is assumed as the single DPD-reset performance standard across all products; product-specific variants (e.g., open-end re-aging limits of once per twelve months / twice per five years under FFIEC guidance) need confirmation before engine configuration.
- Complaint deadlines assume CFPB-portal conventions (15-day initial / 60-day final); state-regulator portals with shorter deadlines override via the per-portal `complaint.portal_due_date` field.
- Pynthia is assumed to be a federally insured credit union subject to NCUA Part 748 cyber-incident notification; if state-chartered, parallel state-supervisor notification requirements need to be added to [CL-08](#cl-08-collections-data-breach--incident-reporting).
- The Executive Loan Committee's lending-authority schedule (who can approve overdrafts, extensions, and interest-only arrangements at what dollar levels) is maintained outside this policy and is assumed current; Finance to confirm.
- TDR terminology is retained per Patrick's notes; under CECL/ASU 2022-02 the accounting category is now "loan modifications to borrowers experiencing financial difficulty" — Finance to confirm reporting treatment before next review.
