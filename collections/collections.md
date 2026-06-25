```yaml
---
title: Collections Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Collections, Delinquency, Charge-Off, FDCPA, UDAAP, FCRA, Forbearance, Overdraft, Nonaccrual]
---

# Collections Policy

## General Policy Statement

Pynthia Credit Union is committed to recognizing, monitoring, and controlling loan delinquencies and overdrafts in a timely and consistent manner; to classifying and charging off loans with a high probability of loss in accordance with FFIEC retail-credit guidance; and to treating members fairly and lawfully in all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. This policy applies to all consumer and small-business credit products the credit union originates or services — residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, and co-branded or white-label partner programs — and to overdraft programs that function as extensions of credit. All collections activities must comply with applicable prudential, safety-and-soundness, consumer-protection (including FDCPA/Reg F and UDAAP), credit-reporting (FCRA/Reg V), privacy, and information-security requirements. Timings stated in this policy are minimum standards; products or states with stricter requirements must configure tighter SLAs in the relevant product configuration.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Nightly delinquency engine run | End of business day → `loan.dpd.updated` | Nightly | DPD recalculation for all active loans | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| Courtesy notice — standard products | Loan reaches 10 DPD → `loan.delinquency_day_10.reached` | Day 10 | Past-due notice | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| Courtesy notice — first-mortgage consumer | Loan reaches 15 DPD → `loan.delinquency_day_15.reached` | Day 15 | Past-due notice | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| Second reminder | Loan reaches 20 DPD → `loan.delinquency_day_20.reached` | Day 20 | Second reminder notice | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| Right-to-cure notice | Loan reaches 30 DPD → `loan.delinquency_day_30.reached` | Within 5 days of 30 DPD | Right-to-cure letter | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| 60-day status memo | Loan reaches 60 DPD → `loan.delinquency_day_60.reached` | Within 10 days of 60 DPD | Problem-loan status memo | [CO-02](#co-02-delinquency-monitoring-early-stage-collections) |
| Substandard classification | Loan reaches 90 DPD → `loan.delinquency_day_90.reached` | Month-end | Substandard classification | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| Closed-end charge-off | Loan reaches 120 DPD → `loan.chargeoff_due_closed_end.reached` | Month-end | Charge-off booking | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| Open-end charge-off | Loan reaches 180 DPD → `loan.chargeoff_due_open_end.reached` | Month-end | Charge-off booking | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| Bankruptcy charge-off | Bankruptcy notice received → `loan.bankruptcy_notice.received` | 60 days | Charge-off booking | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| Fraud charge-off | Fraud confirmed → `loan.fraud.confirmed` | 90 days | Charge-off booking | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| Death charge-off | Loss reasonably estimable → `loan.death_loss_estimable.determined` | Month-end of determination | Charge-off booking | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| RE write-down | RE loan exceeds fair value net of cost to sell → `loan.re_writedown.triggered` | Month-end | Write-down to fair value less cost to sell | [CO-03](#co-03-retail-credit-classification-charge-offs) |
| TDR quarterly review | Quarter-end → `tdr.quarterly_review_due` | Quarterly | TDR performance review | [CO-04](#co-04-forbearance-extensions-workouts-tdrs) |
| Cease-communication flag effective | Cease request received → `collections.cease_request.received` | 1 business day | Cease-communication flag set | [CO-05](#co-05-consumer-protection-in-collections-communications) |
| Attorney flag effective | Attorney representation identified → `collections.attorney.identified` | 1 business day | Attorney flag set | [CO-05](#co-05-consumer-protection-in-collections-communications) |
| Regulator complaint — initial response | Regulator complaint received → `complaint.regulator.received` | 15 days | Initial acknowledgment | [CO-06](#co-06-consumer-complaint-intake-resolution) |
| Regulator complaint — final response | Regulator complaint received → `complaint.regulator.received` | 60 days | Final substantive response | [CO-06](#co-06-consumer-complaint-intake-resolution) |
| Direct complaint — acknowledgment | Direct complaint received → `complaint.direct.received` | 5 business days | Acknowledgment | [CO-06](#co-06-consumer-complaint-intake-resolution) |
| Direct complaint — resolution | Direct complaint received → `complaint.direct.received` | 30 days | Resolution | [CO-06](#co-06-consumer-complaint-intake-resolution) |
| Monthly Metro 2 furnishing | Month-end → `furnishing.cycle_due_at` | Monthly | Metro 2 file transmitted | [CO-07](#co-07-credit-reporting-dispute-handling) |
| FCRA dispute investigation | Dispute received → `furnishing.dispute.received` | 30 days | Investigation complete + correction applied | [CO-07](#co-07-credit-reporting-dispute-handling) |
| Collections-data incident triage | Incident logged → `incident.collections.logged` | 24 hours | Triage complete; reportability determination initiated | [CO-08](#co-08-collections-data-incident-logging-triage) |
| NCUA cyber-incident notification | Reasonable belief of reportable incident → `incident.reportable.determined` | 72 hours | NCUA notification sent | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notice — misuse likely | Misuse determined likely → `incident.misuse.determined` | As soon as reasonably possible | Member notice sent | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Nonaccrual placement | Loan reaches 90+ DPD or full collection doubtful → `loan.nonaccrual.triggered` | Immediate | Nonaccrual status; accrued interest reversed | [CO-09](#co-09-problem-loans-nonaccrual-foreclosure-governance) |
| Watch/Substandard/Doubtful rating review | Quarter-end → `loan.rating_review_due` | Quarterly | Rating review completed | [CO-09](#co-09-problem-loans-nonaccrual-foreclosure-governance) |
| Overdraft daily report review | Daily report generated → `overdraft.daily_report_generated` | Same business day | Report reviewed; approvals within lending authority | [CO-10](#co-10-overdraft-collections-fee-waiver-practices) |
| Board/ELC delinquency report | Month-end → `collections.board_report.due_at` | Monthly | Board/ELC report delivered | [CO-01](#co-01-collections-governance-scope) |
| Annual policy review | Policy anniversary → `collections.annual.review.due_at` | Annually | Policy review completed | [CO-01](#co-01-collections-governance-scope) |
| Material breach log | Material breach identified → `collections.policy_breach.identified` | 5 business days | Breach logged | [CO-01](#co-01-collections-governance-scope) |

---

## CO-01 — Collections Governance & Scope {#co-01-collections-governance-scope}

**WHY (Reg cite):** NCUA safety-and-soundness expectations under [12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701) and [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) require federally insured credit unions to maintain written policies governing credit risk and collections. UDAAP obligations under [Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) require that collections activities be governed by a documented, consistently applied program.

**SYSTEM BEHAVIOR:** The system maintains a single active `collections` policy-configuration object that defines covered products, channels, and three-lines-of-defense ownership (RACI). Every collections workflow must be bound to an active policy version (`collections.policy_version`) before it can execute; workflows bound to a superseded version are blocked pending re-binding. The CCO owns the policy object; only Compliance may write to `collections.policy_version` and `collections.policy_bound`. The Board and Executive Loan Committee (ELC) receive a monthly report covering loans >30 DPD, problem loans, nonaccruals, and OREO. The policy is reviewed at least annually. Material breaches of this policy must be logged within 5 business days of identification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Policy version activated or updated (`collections.policy_version.activated`) | New policy document (`policy.document_id`, `policy.version`), CCO approval (`policy.approver_id`), RACI registry (`policy.raci_registry`) | Active policy version record + `collections.policy_version.activated` | Immediate on approval |
| Every collections workflow initiated | Active policy version reference (`collections.policy_version`), product scope (`collections.policy_bound`) | Workflow bound to policy version + `collections.policy_bound` logged | Before workflow execution |
| Month-end Board/ELC reporting cycle (`collections.board_report.due_at`) | Loans >30 DPD count and balances (`loan.days_past_due`, `loan.past_due_amount`), problem-loan list (`loan.risk_rating`), nonaccrual balances (`loan.nonaccrual.placed`), OREO summary | Board/ELC collections report + `collections.board_report.issued` | Monthly (enforced by `collections.board_report_due_at`) |
| Annual policy review due (`collections.annual.review.due_at`) | Prior policy version, regulatory change log, CCO sign-off | Updated policy document + `collections.policy_review.completed` | Annually (enforced by `collections.annual_review_due_at`) |
| Material policy breach identified (`collections.policy_breach.identified`) | Breach description (`breach.description`), control reference (`breach.control_id`), owner (`breach.owner`) | Breach log entry + `collections.policy_breach.logged` | Within 5 business days (enforced by `collections.breach_log_due_at`) |

**ALERTS/METRICS:** Alert when the monthly Board/ELC report has not been issued within 2 business days of month-end. Alert when any active collections workflow is bound to a policy version older than the current approved version. Target zero unlogged material breaches beyond the 5-business-day window.

---

## CO-02 — Delinquency Monitoring & Early-Stage Collections {#co-02-delinquency-monitoring-early-stage-collections}

**WHY (Reg cite):** FFIEC Uniform Retail Credit Classification and Account Management Policy requires timely identification and follow-up on delinquent retail credit. [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) and safety-and-soundness expectations require systematic delinquency monitoring. State right-to-cure laws (varies by state and product) impose specific notice timing requirements that overlay these federal minimums.

**SYSTEM BEHAVIOR:** A nightly delinquency engine recalculates days-past-due for every active loan and updates `loan.dpd`. Grace periods are product-configured: 10 days for standard consumer products, 15 days for first-mortgage consumer loans (`loan.grace_period_days`). The engine automatically schedules courtesy notices, second reminders, right-to-cure letters, and status memos based on DPD milestones. All outbound notices use Compliance-approved templates (`collections.template`). Past Due Notes must be retained for at least one year (`collections.past_due_note.retained`). Legal maps state-specific cure parameters into `legal.cure_parameters` before product launch; the engine reads those parameters to set product-level SLAs. Compliance is write-restricted on template approval; Collections Operations may not approve its own templates.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Nightly engine run (`loan.delinquency_engine_run`) | All active loan records (`loan.id`, `loan.last_payment_date`, `loan.grace_period_days`, `loan.product_type`) | Updated `loan.dpd` for all loans + `loan.dpd.updated` | Nightly (enforced by `loan.delinquency_engine_schedule`) |
| Loan reaches 10 DPD — standard products (`loan.delinquency_day_10.reached`) | Member contact info (`loan_party.contact`), approved courtesy-notice template (`collections.template`), loan balance (`loan.past_due_amount`) | Courtesy notice sent to member + `collections.courtesy_notice.sent` | Day 10 (enforced by `loan.courtesy_notice_due_at`) |
| Loan reaches 15 DPD — first-mortgage consumer (`loan.delinquency_day_15.reached`) | Member contact info (`loan_party.contact`), approved courtesy-notice template (`collections.template`), loan balance (`loan.past_due_amount`) | Courtesy notice sent to member + `collections.courtesy_notice.sent` | Day 15 (enforced by `loan.courtesy_notice_due_at`) |
| Loan reaches 20 DPD (`loan.delinquency_day_20.reached`) | Member contact info (`loan_party.contact`), approved second-reminder template (`collections.template`), loan balance (`loan.past_due_amount`) | Second reminder sent + `collections.second_reminder.sent` | Day 20 (enforced by `loan.second_reminder_due_at`) |
| Loan reaches 30 DPD (`loan.delinquency_day_30.reached`) | Member contact info (`loan_party.contact`), state-specific cure parameters (`legal.cure_parameters`), approved right-to-cure template (`collections.template`) | Right-to-cure notice sent + `collections.right_to_cure.sent` | Within 5 days of 30 DPD (enforced by `loan.right_to_cure_due_at`) |
| Loan reaches 60 DPD (`loan.delinquency_day_60.reached`) | Loan officer collectibility assessment (`loan.collectibility_assessment`), collateral value (`loan.collateral_value`), workout alternatives (`loan.workout_alternatives`) | 60-day status memo filed + `collections.status_memo.filed` | Within 10 days of 60 DPD (enforced by `loan.status_memo_due_at`) |
| Past Due Note created or updated | Loan ID (`loan.id`), note content (`collections.member_notes`), collector ID (`collections.collector_id`) | Past Due Note retained + `collections.past_due_note.retained` | Immediate; retained ≥ 1 year |

**ALERTS/METRICS:** Alert when any courtesy notice, second reminder, right-to-cure, or status memo task is not completed within its SLA window. Monitor the nightly engine run completion time; alert if the run does not complete before the start of the next business day. Target zero loans with missed notice milestones.

---

## CO-03 — Retail Credit Classification & Charge-Offs {#co-03-retail-credit-classification-charge-offs}

**WHY (Reg cite):** The [FFIEC Uniform Retail Credit Classification and Account Management Policy](https://www.ffiec.gov/press/pr062000.htm) requires: closed-end retail loans charged off at 120 DPD; open-end at 180 DPD; retail accounts 90+ DPD classified Substandard; bankruptcy charge-off within 60 days of notice; fraud charge-off within 90 days of confirmation; death charge-off when loss is reasonably estimable; and real estate write-down to fair value less cost to sell. [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) incorporates these standards for federally insured credit unions.

**SYSTEM BEHAVIOR:** The system enforces FFIEC classification and charge-off timelines automatically. At 90 DPD, the loan is flagged for Substandard classification (`loan.classified_substandard`). Closed-end loans reaching 120 DPD and open-end loans reaching 180 DPD are queued for month-end charge-off (`loan.chargeoff_month_end_at`). All charge-offs are booked at month-end regardless of the exact day the threshold is crossed. A well-secured-and-in-process-of-collection exception (`loan.well_secured_documented`) may defer classification only if clearly documented with evidence of expected recovery within 90 days; Compliance must approve any such exception. For real estate loans, a current valuation is required at the 120/180-day threshold; any balance exceeding fair value less cost to sell is classified Loss and written down (`loan.re_writedown`). Bankruptcy charge-offs require court notice (`loan.bankruptcy_notice`) and must be completed within 60 days unless repayment is clearly documented as likely. Fraud charge-offs require confirmed fraud (`loan.fraud.confirmed`) and must be completed within 90 days; confirmed fraud cases are also referred to BSA per the BSA Policy. Death charge-offs are triggered when the loss is reasonably estimable (`loan.death_loss_estimable`). Credit Risk is write-restricted on charge-off booking; Finance posts the GL entry.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan reaches 90 DPD (`loan.delinquency_day_90.reached`) | DPD count (`loan.dpd`), product type (`loan.product_type`), well-secured exception flag (`loan.well_secured_documented`) | Substandard classification applied + `loan.rating_review.completed` | Month-end (enforced by `loan.classification_due_at`) |
| Closed-end loan reaches 120 DPD (`loan.chargeoff_due_closed_end.reached`) | Loan balance (`loan.balance`), product type (`loan.product_type`), well-secured exception flag (`loan.well_secured_documented`) | Charge-off booked to loan-loss reserve + `loan.charged_off` | Month-end (enforced by `loan.chargeoff_month_end_at`) |
| Open-end loan reaches 180 DPD (`loan.chargeoff_due_open_end.reached`) | Loan balance (`loan.balance`), product type (`loan.product_type`), well-secured exception flag (`loan.well_secured_documented`) | Charge-off booked to loan-loss reserve + `loan.charged_off` | Month-end (enforced by `loan.chargeoff_month_end_at`) |
| Bankruptcy notice received (`loan.bankruptcy_notice.received`) | Court notice reference (`loan.bankruptcy_case_id`), repayment-likely documentation (`loan.repayment_evidence`) | Charge-off booked (unless repayment documented) + `loan.charged_off` | Within 60 days (enforced by `loan.bankruptcy_chargeoff_due_at`) |
| Fraud confirmed (`loan.fraud.confirmed`) | Fraud investigation ID (`loan.fraud.chargeoff.due_at`), BSA referral flag | Charge-off booked + BSA referral initiated + `loan.charged_off` | Within 90 days (enforced by `loan.fraud.chargeoff.due_at`) |
| Death loss reasonably estimable (`loan.death_loss_estimable.determined`) | Estate claim status (`loan.estate_claim_status`), estimated recovery (`loan.estimated_recovery`) | Charge-off booked + `loan.charged_off` | Month-end of determination |
| RE loan at 120/180 DPD threshold — valuation required (`loan.re.valuation.due`) | Current appraisal or valuation (`collateral.fair_value`, `collateral.cost_to_sell`), LTV (`loan.ltv`) | Write-down to fair value less cost to sell + `loan.re_writedown.booked` | Month-end (enforced by `loan.re.valuation.due`) |

**ALERTS/METRICS:** Alert when any loan crosses a charge-off threshold and the charge-off task has not been queued for month-end processing. Alert when a well-secured exception has been in place for more than 90 days without documented recovery. Monitor the count of loans in each classification bucket (Pass/Substandard/Doubtful/Loss) monthly; flag unexpected period-over-period increases exceeding 20%.

---

## CO-04 — Forbearance, Extensions, Workouts & TDRs {#co-04-forbearance-extensions-workouts-tdrs}

**WHY (Reg cite):** FFIEC Uniform Retail Credit Classification and Account Management Policy governs re-aging, extensions, and workout standards for retail credit, including conditions for resetting days-past-due. [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) and interagency problem-asset guidance require that modifications reflect sustainable repayment capacity and that TDRs be identified and reviewed. [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) prohibits abusive forbearance practices.

**SYSTEM BEHAVIOR:** Hardship forbearance, extensions, and TDRs are governed by this control. A modification may only be approved when the member demonstrates repayment capacity (`member.repayment_capacity`) and the proposed modification reflects a sustainable schedule (`loan.proposed_modification`). Days-past-due may only be reset after the member completes three consecutive modified payments (`loan.modified_payment_3`); the system enforces this gate via `loan.dpd_reset_eligibility_check` before allowing `loan.dpd_reset`. Extensions are capped at three months per event; cumulative extension limits are tracked in `loan.modified_schedule`. Interest capitalization and interest-only arrangements (3–12 months) require ELC committee approval (`elc.modification`) before booking; the system blocks booking until `elc.modification.approved` is recorded. Active TDRs are reviewed quarterly (`tdr.quarterly_review_due`). Workout alternatives must be documented in `loan.workout_alternatives` before any modification is approved. Compliance is write-restricted on TDR designation; Credit Risk owns the classification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Hardship forbearance or extension requested (`loan.workout.requested`) | Member hardship evidence (`member.hardship_evidence`), repayment capacity assessment (`member.repayment_capacity`), proposed modification terms (`loan.proposed_modification`), workout alternatives documented (`loan.workout_alternatives`) | Modification decision recorded + `loan.modification.decided` | Per lending authority SLA |
| Interest capitalization or interest-only arrangement proposed (`loan.io_capitalization.proposed`) | Proposed IO term in months (`loan.io_term_months`), IO capitalization flag (`loan.io_capitalization`), ELC approval packet (`elc.approval_packet`) | ELC approval recorded + `elc.modification.approved` | Before booking |
| Three consecutive modified payments received (`loan.modified_payment_3.received`) | Payment history confirming three consecutive on-time modified payments (`loan.modified_payment_3`), DPD reset eligibility check (`loan.dpd_reset_eligibility_check`) | DPD reset applied + `loan.dpd.updated` | Immediate on third payment confirmation |
| TDR quarterly review due (`tdr.quarterly_review_due`) | Active TDR list, performance data for each TDR (`loan.modified_schedule`, `loan.dpd`), Credit Risk sign-off | TDR quarterly review completed + `tdr.quarterly_review.completed` | Quarterly (enforced by `tdr.quarterly_review_due`) |

**ALERTS/METRICS:** Alert when a DPD reset is attempted without the three-consecutive-payment gate being satisfied. Alert when an IO or capitalization arrangement is booked without a recorded ELC approval. Monitor the count of active TDRs and flag any TDR that has not been reviewed within the current quarter.

---

## CO-05 — Consumer Protection in Collections Communications {#co-05-consumer-protection-in-collections-communications}

**WHY (Reg cite):** [FDCPA / Regulation F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006) prohibits abusive, unfair, and deceptive collection practices; limits communications to permitted times (8 a.m.–9 p.m. member's local time), places, and frequency (no more than 7 calls within 7 consecutive days per debt); and requires honoring cease-communication and attorney-representation flags. [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) independently prohibits harassment, threats, obscene language, and false credit-information disclosures in collections.

**SYSTEM BEHAVIOR:** The collections platform enforces permitted calling times using the member's timezone (`member.timezone`) and blocks outbound contact outside 8 a.m.–9 p.m. local time. A 7-day rolling frequency counter (`collections.contact_frequency_7d`) gates each contact attempt; attempts that would exceed 7 calls in 7 days are blocked (`collections.contact_gated`). Cease-communication flags (`member.cease_flag_set`) and attorney-representation flags (`member.attorney_contact`) must be applied within 1 business day of the triggering request and immediately suppress all further outbound contact on the flagged account. All collection templates and scripts must be routed through Compliance for approval (`collections.template.approved`) before use; unapproved templates are blocked from the platform. Prohibited conduct — harassment, threats, obscene language, false credit-information disclosures — is enforced by script-level controls and monitored via call-quality review. Compliance is write-restricted on template approval and flag configuration; Collections Operations may not self-approve templates or override flags.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Cease-communication request received (`collections.cease_request.received`) | Member ID (`member.id`), request channel (`collections.contact_channel`), cease request record (`collections.cease_request`) | Cease-communication flag set on member account + `member.cease_flag_set` | Within 1 business day (enforced by `collections.cease_flag_due_at`) |
| Attorney representation identified (`collections.attorney.identified`) | Member ID (`member.id`), attorney contact information (`member.attorney_contact`) | Attorney flag set on member account + `member.attorney_flag_set` | Within 1 business day (enforced by `collections.attorney_flag_due_at`) |
| Outbound contact attempted (`collections.contact_attempted`) | Member timezone (`member.timezone`), 7-day contact frequency count (`collections.contact_frequency_7d`), cease flag (`member.cease_flag_set`), attorney flag (`member.attorney_contact`), contact gate check result (`collections.contact_gate_check`) | Contact logged or blocked + `collections.contact.logged` | Real-time gate check before each attempt |
| New collection template or script submitted for approval (`collections.template.submitted`) | Template body (`collections.template`), product scope, submitting collector ID (`collections.collector_id`) | Compliance review initiated + `collections.template.approved` (or rejected) | Per Compliance review SLA (internal: 5 BD) |

**ALERTS/METRICS:** Alert in real time when a contact attempt is blocked by the frequency cap or a cease/attorney flag. Monitor the count of unapproved templates in use; target zero. Alert when a cease or attorney flag has not been applied within 1 business day of the triggering event.

---

## CO-06 — Consumer Complaint Intake & Resolution {#co-06-consumer-complaint-intake-resolution}

**WHY (Reg cite):** [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) requires that consumer complaints be handled fairly and promptly. CFPB complaint-program expectations require complete, accurate, and timely responses — typically 15 days initial and 60 days final for regulator-forwarded complaints. [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741) and safety-and-soundness expectations require a documented complaint-management program.

**SYSTEM BEHAVIOR:** All complaints — regardless of channel (phone, email, branch, regulator portal, social media) — are captured in the single `complaint` platform. Each complaint is tagged with channel (`complaint.channel`), root cause (`complaint.root_cause_tag`), and a UDAAP flag (`complaint.udaap_flag`) at intake. Regulator-forwarded complaints (CFPB, NCUA, state) are tagged `complaint.regulator` and carry a 15-day initial-response deadline and 60-day final-response deadline. Direct member complaints are tagged `complaint.direct` and carry a 5-business-day acknowledgment deadline and 30-day resolution deadline. Complaint trend data is reviewed periodically; UDAAP-flagged complaints are escalated to Compliance immediately. Compliance is write-restricted on UDAAP flag and root-cause tag; Collections Operations may not self-close UDAAP-flagged complaints.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulator complaint received (`complaint.regulator.received`) | Complaint narrative (`complaint.narrative`), channel (`complaint.channel`), regulator case ID (`complaint.regulator`), member ID (`complaint.member_id`) | Complaint logged + initial response task created + `complaint.logged` | Immediate on receipt |
| Initial response to regulator complaint due (`complaint.initial_response_due_at`) | Investigation notes (`complaint.investigation_notes`), root cause tag (`complaint.root_cause_tag`), UDAAP flag (`complaint.udaap_flag`) | Initial response sent + `complaint.initial_response.sent` | 15 days from receipt (enforced by `complaint.initial_response_due_at`) |
| Final response to regulator complaint due (`complaint.final.response.due_at`) | Complete investigation findings, corrective action if applicable | Final response sent + `complaint.final_response.sent` | 60 days from receipt (enforced by `complaint.final.response.due_at`) |
| Direct member complaint received (`complaint.direct.received`) | Complaint narrative (`complaint.narrative`), channel (`complaint.channel`), member ID (`complaint.member_id`) | Complaint logged + acknowledgment task created + `complaint.logged` | Immediate on receipt |
| Acknowledgment of direct complaint due (`complaint.ack_due_at`) | Complaint record (`complaint.id`), member contact info | Acknowledgment sent + `complaint.acknowledged` | 5 business days from receipt (enforced by `complaint.ack_due_at`) |
| Resolution of direct complaint due (`complaint.resolution.due_at`) | Investigation notes (`complaint.investigation_notes`), root cause tag (`complaint.root_cause_tag`), UDAAP flag (`complaint.udaap_flag`) | Resolution communicated + `complaint.resolved` | 30 days from receipt (enforced by `complaint.resolution.due_at`) |
| UDAAP flag set on complaint (`complaint.udaap_flag` = true) | Complaint record, UDAAP flag, root cause tag | Escalation to Compliance + `complaint.investigation.completed` (escalation path) | Immediate on flag set |

**ALERTS/METRICS:** Alert when any regulator complaint initial response is not sent within 13 days (2-day early warning). Alert when any direct complaint acknowledgment is not sent within 4 business days. Monitor the count of open UDAAP-flagged complaints; target resolution within 30 days. Track complaint volume by root-cause category monthly.

---

## CO-07 — Credit Reporting & Dispute Handling {#co-07-credit-reporting-dispute-handling}

**WHY (Reg cite):** [FCRA / Regulation V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022) imposes furnisher duties for accuracy ([§ 1022.42](https://www.ecfr.gov/current/title-12/part-1022#p-1022.42)), dispute investigation ([§ 1022.43](https://www.ecfr.gov/current/title-12/part-1022#p-1022.43)), and negative-information and identity-theft provisions. Furnishers must investigate disputes within 30 days of receipt and correct inaccurate information promptly.

**SYSTEM BEHAVIOR:** The system generates a Metro 2-format furnishing file monthly for all reportable accounts. Each furnishing cycle is tracked in `furnishing` with a cycle due date (`furnishing.cycle_due_at`) and transmission confirmation (`furnishing.file_transmitted`). Furnishing history is retained to support dispute investigations. When a consumer dispute is received — whether directly or via a consumer reporting agency — it is logged as a `dispute` with `dispute.basis` and `dispute.category` populated. The investigation must be completed within 30 days (`furnishing.dispute_due_at`). If the investigation identifies an inaccuracy (`furnishing.correction.identified`), the correction is applied in the next furnishing batch. Identity-theft disputes (`furnishing.idtheft_dispute`) are escalated immediately to the Fraud team for a parallel investigation (`fraud.idtheft_case`). Compliance is write-restricted on furnishing file approval; Credit Risk owns dispute investigation outcomes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly furnishing cycle due (`furnishing.cycle_due_at`) | All reportable account data in Metro 2 format (`furnishing.disputed_account`, `loan.balance`, `loan.dpd`, `loan.status`), furnishing history | Metro 2 file transmitted to bureaus + `furnishing.file_transmitted` | Monthly (enforced by `furnishing.cycle_due_at`) |
| Consumer dispute received (`furnishing.dispute.received`) | Dispute basis (`dispute.basis`), dispute category (`dispute.category`), disputed account reference (`furnishing.disputed_account`), consumer identity | Dispute opened + investigation task created + `dispute.opened` | Immediate on receipt |
| Dispute investigation due (`furnishing.dispute_due_at`) | Investigation findings (`dispute.findings`), correction amount if applicable (`dispute.correction_amount`), furnishing history | Investigation completed + correction queued for next batch + `dispute.investigation.completed` | 30 days from receipt (enforced by `furnishing.dispute_due_at`) |
| Correction identified in furnishing data (`furnishing.correction.identified`) | Corrected data fields, next furnishing cycle date | Correction applied in next furnishing batch + `furnishing.correction.applied` | Next monthly furnishing cycle |
| Identity-theft dispute received (`furnishing.idtheft_dispute.received`) | Identity-theft report reference (`dispute.idtheft_report`), disputed account, consumer identity | Fraud team escalation initiated + `fraud.idtheft_case.opened` | Immediate on receipt |

**ALERTS/METRICS:** Alert when a dispute investigation task is not completed within 28 days (2-day early warning). Alert when a furnishing file transmission fails. Monitor the count of open disputes by age; target zero disputes exceeding 30 days without resolution. Track correction rate per furnishing cycle as a data-quality KRI.

---

## CO-08 — Collections-Data Incident Logging & Triage {#co-08-collections-data-incident-logging-triage}

**WHY (Reg cite):** [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to maintain a written security program protecting member records and to report certain cyber incidents. This control governs the collections-specific logging and 24-hour triage step that feeds the reportability determination under [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification). [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) and [FCRA / Regulation V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022) require that member data affected by collections-system incidents be protected and that affected furnishing data be corrected promptly.

**SYSTEM BEHAVIOR:** Any event affecting the confidentiality, integrity, or availability of collections data — including unauthorized access to member account or delinquency records, furnishing-file corruption, or collections-platform outages affecting member data — must be logged as an `incident` with `incident.collections` populated. The incident is classified by severity (`incident.severity`) and triaged within 24 hours (`incident.triage.due_at`). Triage determines whether the incident meets the threshold for NCUA reportability assessment under [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification); the triage outcome is recorded in `incident.reportability_assessment` and passed to the SC-01 workflow. If the incident also affects furnishing data, a furnishing-correction review is initiated in parallel. IT/Security owns incident logging; Compliance owns the reportability determination. Collections Operations is read-only on incident records until triage is complete.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Collections-data incident detected or reported (`incident.collections.logged`) | Incident description (`incident.description`), detection source (`incident.detection_source`), data scope (`incident.data_scope`), collections flag (`incident.collections`), initial severity estimate (`incident.severity`) | Incident record created + triage task opened + `incident.created` | Immediate on detection |
| 24-hour triage due (`incident.triage.due_at`) | Incident record, scope assessment (`incident.scope_initial`), security confirmation (`incident.security`), reportability assessment (`incident.reportability_assessment`) | Triage completed + reportability determination initiated for SC-01 + `incident.classified` | Within 24 hours (enforced by `incident.triage.due_at`) |
| Furnishing data affected by incident (identified during triage) | Affected account list, furnishing cycle status (`furnishing.cycle_due_at`), correction scope | Furnishing-correction review initiated + `furnishing.correction.identified` | Within 24 hours of triage completion |

**ALERTS/METRICS:** Alert when a collections-data incident triage task is not completed within 20 hours (4-hour early warning before the 24-hour deadline). Alert when an incident affecting furnishing data does not have a correction review initiated within 24 hours of triage. Monitor the count of open collections-data incidents by severity tier weekly.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [12 CFR Part 748.1(b)](https://www.ecfr.gov/current/title-12/part-748#p-748.1(b)) requires every federally insured credit union to notify NCUA **no later than 72 hours** after the credit union reasonably believes it has experienced a reportable cyber incident. A reportable cyber incident is one that leads to — or is reasonably likely to lead to — a material loss of member data, a significant disruption of member services, or unauthorized access to sensitive systems. Member notification is required as soon as reasonably possible after the credit union determines that misuse of member information is reasonably likely ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748#Appendix-A-to-Part-748)).

**SYSTEM BEHAVIOR:** When an incident is classified as potentially reportable — either by the 24-hour triage in [CO-08](#co-08-collections-data-incident-logging-triage) or by any other detection path — the system sets `incident.reportable.determined` and starts the 72-hour NCUA notification clock (`incident.ncua.notice.due_at`). The CCO must sign off on the reportability determination (`incident.cco_signoff`) before the NCUA notification is sent; this sign-off is the only write-gated step in the notification path. If the CCO is unavailable, the President may sign off. The notification is transmitted via the NCUA's cyber-incident reporting portal and logged as `incident.ncua.notified`. In parallel, the system evaluates member impact (`incident.member_impact`); if misuse is determined to be reasonably likely (`incident.misuse.determined`), member notices are prepared using the approved template (`incident.member_notice_template`) and sent as soon as reasonably possible (`incident.member_notices`). The 72-hour clock is measured from the moment of reasonable belief, not from the moment of confirmed certainty — when in doubt, notify. All incident records are write-restricted to IT/Security and Compliance; no other function may alter the reportability determination or notification timestamps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident classified as potentially reportable (`incident.reportable.determined`) | Incident record (`incident.id`), scope assessment (`incident.scope`), security confirmation (`incident.security`), CCO sign-off (`incident.cco_signoff`) | NCUA notification sent + `incident.ncua.notified` | No later than 72 hours after reasonable belief (enforced by `incident.ncua.notice.due_at`) |
| Member misuse determined likely (`incident.misuse.determined`) | Member impact assessment (`incident.member_impact`), approved notice template (`incident.member_notice_template`), affected member list (`incident.member_notices`) | Member notices sent + `incident.member_notices.sent` | As soon as reasonably possible after misuse determination (no fixed outer bound; internal SLA: same business day where feasible) |
| NCUA notification sent (`incident.ncua.notified`) | Notification content, portal submission confirmation | NCUA notification logged + `ncua.notification.sent` | Simultaneous with transmission |

**ALERTS/METRICS:** Alert at 48 hours if a reportable incident has not yet had an NCUA notification sent (24-hour early warning before the 72-hour deadline). Alert immediately if the CCO sign-off step is not completed within 36 hours of the reportability determination. Monitor the count of incidents where member notices were not sent within 24 hours of a misuse determination; target zero.

---

## CO-09 — Problem Loans, Nonaccrual & Foreclosure Governance {#co-09-problem-loans-nonaccrual-foreclosure-governance}

**WHY (Reg cite):** Interagency nonaccrual and problem-asset guidance (incorporated by [NCUA Part 741](https://www.ecfr.gov/current/title-12/part-741)) requires credit unions to place loans on nonaccrual at 90+ DPD or when full collection is doubtful, to reverse accrued interest, and to maintain a risk-rating system (Pass/Watch/Substandard/Doubtful/Loss). [NCUA Part 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) and state foreclosure laws require documented pre-foreclosure evaluation and appropriate approvals. [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) requires that foreclosure decisions be made fairly and consistently.

**SYSTEM BEHAVIOR:** The system maintains a five-tier risk-rating scale (Pass/Watch/Substandard/Doubtful/Loss) in `loan.risk_rating`. Loans are placed on nonaccrual automatically when they reach 90+ DPD (`loan.nonaccrual.placed`) or when a collectibility assessment determines full collection is doubtful (`loan.collectibility_assessment`); accrued interest is reversed at placement (`loan.accrued_interest`). Return to accrual requires documented evidence of sustained performance. Watch, Substandard, and Doubtful ratings are reviewed quarterly (`loan.rating_review_due`). Before initiating foreclosure, a financial-impact evaluation (`loan.foreclosure_impact_eval`) must be completed and approved by both the CCO and the President; the system blocks foreclosure initiation until `loan.foreclosure.approved` is recorded. Legal maps state-specific foreclosure requirements into `legal.foreclosure_checklist` before any foreclosure proceeds. Credit Risk is write-restricted on risk-rating assignment; Collections Operations may not initiate foreclosure without the required approvals.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Loan reaches 90+ DPD or collectibility doubtful (`loan.nonaccrual.triggered`) | DPD count (`loan.dpd`), collectibility assessment (`loan.collectibility_assessment`), accrued interest balance (`loan.accrued_interest`) | Nonaccrual status applied + accrued interest reversed + `loan.nonaccrual.triggered` | Immediate on trigger condition |
| Quarterly rating review due for Watch/Substandard/Doubtful loans (`loan.rating_review_due`) | Current risk rating (`loan.risk_rating`), DPD (`loan.dpd`), collateral value (`loan.collateral_value`), collectibility assessment (`loan.collectibility_assessment`) | Rating review completed + rating updated if warranted + `loan.rating_review.completed` | Quarterly (enforced by `loan.rating_review_due_at`) |
| Foreclosure proposed (`loan.foreclosure.proposed`) | Financial-impact evaluation (`loan.foreclosure_impact_eval`), state foreclosure checklist (`legal.foreclosure_checklist`), CCO approval, President approval | Foreclosure approved or rejected + `loan.foreclosure.approved` | Before foreclosure initiation |
| Loan returns to accrual (`loan.accrual.restored`) | Documented sustained performance evidence (`loan.repayment_evidence`), Credit Risk sign-off | Accrual restored + `loan.accrual.restored` | Per Credit Risk determination |

**ALERTS/METRICS:** Alert when a loan reaches 90 DPD and nonaccrual placement has not been recorded within 1 business day. Alert when a Watch/Substandard/Doubtful loan has not been reviewed within the current quarter. Monitor the total nonaccrual balance as a percentage of total loans monthly; flag increases exceeding 10 basis points period-over-period.

---

## CO-10 — Overdraft Collections & Fee Waiver Practices {#co-10-overdraft-collections-fee-waiver-practices}

**WHY (Reg cite):** [UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. §§ 5531, 5536)](https://www.law.cornell.edu/uscode/text/12/5531) prohibits unfair, deceptive, or abusive overdraft practices, including inconsistent fee assessment and undisclosed payroll-coverage arrangements. [NCUA Part 701](https://www.ecfr.gov/current/title-12/part-701) requires that overdraft programs functioning as extensions of credit be governed as such. [Regulation E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005) governs opt-in requirements for ATM and one-time debit card overdraft coverage.

**SYSTEM BEHAVIOR:** Overdrafts are treated as short-term unsecured credit. The daily overdraft report (`overdraft.daily_report_generated`) must be reviewed by Collections Operations on the same business day it is generated. Each overdraft requires approval within the applicable lending authority before coverage is extended; the system enforces this via `overdraft.referral` to the appropriate approver. Fees are assessed consistently per the published fee schedule (`overdraft.fee_schedule`); any deviation requires a documented exception. Fee waivers are permitted only as documented exceptions (`overdraft.waiver_reason`); recurring waiver patterns (`overdraft.recurring_pattern`) require CCO approval before the pattern may continue. Ongoing payroll overdraft coverage absent a formal credit facility (`overdraft.payroll_coverage_flag`) is prohibited; the system flags and blocks such arrangements. Compliance is write-restricted on fee-schedule configuration and waiver-pattern approval; Collections Operations may not self-approve recurring waivers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily overdraft report generated (`overdraft.daily_report_generated`) | All overdraft accounts (`overdraft.amount`, `overdraft.days_outstanding`, `overdraft.occurrence_count`), fee schedule (`overdraft.fee_schedule`) | Report reviewed + approvals initiated within lending authority + `overdraft.report.reviewed` | Same business day (enforced by `overdraft.review_due_at`) |
| Overdraft fee assessed (`overdraft.fee_assessed`) | Fee schedule (`overdraft.fee_schedule`), account overdraft amount (`overdraft.amount`), occurrence count (`overdraft.occurrence_count`) | Fee posted + `fee.overdraft.posted` | Per fee schedule |
| Fee waiver requested (`overdraft.waiver.requested`) | Waiver reason (`overdraft.waiver_reason`), member account history, approver ID | Waiver approved or denied + `overdraft.waiver.approved` | Per lending authority SLA |
| Recurring waiver pattern detected (`overdraft.recurring_pattern.detected`) | Pattern history (`overdraft.recurring_pattern`), waiver count, member account | CCO approval required before pattern continues + `overdraft.recurring_pattern.detected` | Immediate on detection; CCO approval within 2 business days |
| Payroll overdraft coverage without formal facility detected (`overdraft.payroll_coverage_flag` = true) | Account record, payroll deposit history, facility status | Coverage blocked + alert issued + `overdraft.referral.issued` | Immediate on detection |

**ALERTS/METRICS:** Alert when the daily overdraft report has not been reviewed by end of business on the day it is generated. Alert when a recurring waiver pattern has been detected and CCO approval has not been obtained within 2 business days. Monitor the overdraft fee-waiver rate monthly; flag increases exceeding 15% period-over-period as a potential UDAAP indicator.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all controls, templates, and material exceptions; signs off on NCUA reportability determinations |
| **Collections Operations** | Day-to-day delinquency follow-up, notice generation, overdraft review, complaint intake |
| **Credit Risk** | Risk-rating assignment, charge-off recommendations, TDR designation, nonaccrual placement |
| **Legal** | State-specific cure parameters, foreclosure checklists, attorney-flag management |
| **IT/Security** | Collections-platform security, incident logging, furnishing-file transmission |
| **Finance** | GL entries for charge-offs and write-downs |
| **Executive Loan Committee (ELC)** | Approves interest capitalization, IO arrangements, and foreclosure initiation |
| **Board of Directors** | Receives monthly delinquency and problem-loan report; approves policy annually |

**Review cadence:** This policy is reviewed at least annually by the CCO, with input from Collections Operations, Credit Risk, Legal, IT/Security, and Finance. Material regulatory changes trigger an out-of-cycle review. The next scheduled review is 2027-07-01.

**Cross-references:**
- Lending Policy (origination, underwriting, credit policy)
- Fair Lending Policy (fair-lending and adverse-action requirements)
- BSA Policy (BSA/AML program; SAR filing for fraud charge-offs)
- Information Security Policy (enterprise incident-response framework)
- Privacy Policy (member privacy and data-handling obligations)
- OREO Guidelines (detailed OREO valuation and disposition)
- Third-Party Risk Policy (vendor management of third-party collectors beyond conduct requirements)
- Record Retention Policy (retention schedules beyond collections-specific evidence)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are composed per the Composition grammar and have not yet been confirmed as registered in `core-vocabulary.json`. Specifically, the following codes are used in this policy and should be confirmed or registered by engineering before the next review: `loan.delinquency_day_10.reached`, `loan.delinquency_day_15.reached`, `loan.delinquency_day_20.reached`, `loan.delinquency_day_30.reached`, `loan.delinquency_day_60.reached`, `loan.delinquency_day_90.reached`, `loan.chargeoff_due_closed_end.reached`, `loan.chargeoff_due_open_end.reached`, `loan.death_loss_estimable.determined`, `loan.re_writedown.triggered`, `loan.delinquency_engine_run`, `loan.delinquency_engine_schedule`, `loan.charged_off`, `loan.nonaccrual.placed`, `loan.foreclosure_impact_eval`, `loan.collectibility_assessment`, `loan.workout_alternatives`, `loan.proposed_modification`, `loan.modified_schedule`, `loan.dpd_reset_eligibility_check`, `loan.dpd_reset`, `loan.io_capitalization`, `loan.io_term_months`, `loan.modified_payment_3`, `loan.re_writedown`, `loan.estate_claim_status`, `loan.estimated_recovery`, `loan.accrued_interest`, `loan.well_secured_documented`, `loan.repayment_evidence`, `collections.contact_frequency_7d`, `collections.contact_gate_check`, `collections.contact_gated`, `collections.contact_outcome`, `collections.policy_bound`, `collections.past_due_note.retained`, `collections.attorney.identified`, `overdraft.daily_report_generated`, `overdraft.fee_assessed`, `overdraft.payroll_coverage_flag`, `loan.delinquency_day_15` (first-mortgage grace period variant). All codes follow the registered Composition grammar (`object.property.action` or `object.property`) and use registered objects and actions; none mint new objects or actions.

- **First-mortgage grace period (15 days).** The 15-day grace period for first-mortgage consumer loans is stated as a product-configuration parameter (`loan.grace_period_days`). The specific products that qualify as "first-mortgage consumer" must be enumerated in the product configuration by Legal and Credit Risk before go-live. This policy assumes the distinction maps to `loan.product_type` values already defined in the Lending Policy.

- **State right-to-cure and foreclosure parameters.** This policy assumes Legal will map all applicable state-specific cure notice timing and foreclosure requirements into `legal.cure_parameters` and `legal.foreclosure_checklist` for each covered product and state before the collections engine is activated for that product. Until those parameters are loaded, the federal minimums stated in CO-02 and CO-09 apply as defaults.

- **HMDA reporter status.** This policy does not address HMDA reporting obligations. If Pynthia Credit Union meets the HMDA coverage thresholds under [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003), collections-related data (e.g., foreclosure actions) may need to be reflected in the LAR. This should be confirmed with Legal and addressed in the Fair Lending Policy or a separate HMDA procedure.

- **Partner program conduct requirements.** This policy applies conduct requirements (CO-05) to co-branded and white-label partner programs. The specific contractual mechanisms by which those requirements are imposed on third-party collectors are governed by the Third-Party Risk Policy and individual program agreements. This policy assumes those agreements are in place and enforceable before any partner-program collections activity begins.

- **Overdraft opt-in (Regulation E).** CO-10 governs overdraft collections and fee practices. The upstream opt-in requirement for ATM and one-time debit card overdraft coverage under [12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) is governed by the account-opening disclosure process in the Lending Policy and product terms. This policy assumes opt-in status is correctly recorded in `entity.reg_e_opt_in` before any overdraft fee is assessed.

- **BSA referral for fraud charge-offs.** CO-03 notes that confirmed fraud charge-offs are referred to BSA. The specific SAR-filing workflow is governed by the BSA Policy. This policy assumes the `fraud.idtheft_case` and BSA referral path are operational and that the BSA Policy defines the SAR decision timeline independently of the 90-day fraud charge-off deadline.

- **SC-01 shared-control embeddable block.** The SC-01 control above is intended to be byte-identical to the same control in the Business Continuity Plan, E-Commerce, Electronic Payment Systems, Information Security, Privacy, and Third-Party Risk policies. If the canonical `shared-controls/ncua-incident-notification.md` embeddable block has been updated since this policy was generated, this policy must be regenerated to pick up the current version before the next review.

- **Well-secured exception approval.** CO-03 states that Compliance must approve any well-secured-and-in-process-of-collection exception that defers classification. The specific approval workflow (ticket type, authority level, documentation standard) is assumed to follow the general loan-exception process in the Lending Policy. If a separate collections-exception workflow is needed, it should be defined in a procedure document and linked from CO-03.
```
