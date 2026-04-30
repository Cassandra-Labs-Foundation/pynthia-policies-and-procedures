# Collections

The Board of Directors requires management to recognize, monitor, and control loan delinquencies and overdrafts; to classify and charge off loans with a high probability of loss in a timely and consistent manner; and to treat members fairly and lawfully in all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. This policy applies to all consumer and small-business credit products the institution originates or services (including residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, and any co-branded or white-label programs offered through partners) and to overdraft programs that function as extensions of credit. Collections must comply with applicable prudential, safety-and-soundness, consumer protection, privacy, and information-security requirements.

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic / Rule                                                                                               | Scope for This Policy                                                                                                                    | Key Clauses / Notes                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA Part 748 — Security Program, Suspicious Transactions, Catastrophic Acts, Cyber Incidents, and BSA** | Incident/breach reporting where collections systems or member loan data are impacted                                                     | Written security and response program; protection of member records; certain events reportable to NCUA. [https://www.ecfr.gov/current/title-12/part-748](https://www.ecfr.gov/current/title-12/part-748)                                                       |
| **FFIEC Uniform Retail Credit Classification and Account Management Policy**                               | Charge-off and classification of retail open-end and closed-end credit (credit cards, consumer loans, some real estate)                  | Closed-end retail loans charged off at 120 DPD; open-end at 180 DPD; retail accounts 90+ DPD Substandard; guidance on bankruptcy, fraud, death, re-aging, workouts, residential real estate.                                                                   |
| **FDCPA / Regulation F (12 CFR Part 1006)**                                                                | Standards for third-party debt collectors; internal collections aligned to avoid abusive practices                                       | Prohibits abusive, unfair, deceptive practices; limits communications (time, place, frequency); restrictions on time-barred debt suits. [https://www.ecfr.gov/current/title-12/chapter-X/part-1006](https://www.ecfr.gov/current/title-12/chapter-X/part-1006) |
| **UDAAP — Dodd-Frank Act §§ 1031 & 1036 (12 U.S.C. 5531, 5536)**                                           | Prohibition on unfair, deceptive, or abusive acts or practices in collections, forbearance, overdraft handling, and complaint resolution | Authority to identify and prohibit UDAAP; unlawful to engage in unfair, deceptive, or abusive practices. [https://www.law.cornell.edu/uscode/text/12/5531](https://www.law.cornell.edu/uscode/text/12/5531)                                                    |
| **FCRA / Regulation V (12 CFR Part 1022)**                                                                 | Accuracy and integrity of credit reporting, charge-off reporting, and handling of disputes                                               | Furnisher duties to provide accurate information, correct errors, and investigate disputes; negative information and identity-theft provisions. [https://www.law.cornell.edu/cfr/text/12/part-1022](https://www.law.cornell.edu/cfr/text/12/part-1022)         |
| **CFPB Complaint Program / Expectations**                                                                  | Timeliness and quality of responses to consumer complaints, including collections, overdrafts, and credit reporting                      | Expectations for complete, accurate, and timely responses (typically 15 days initial, 60 days final for regulator complaints).                                                                                                                                 |
| **Interagency Nonaccrual / Problem Asset Guidance**                                                        | Nonaccrual treatment, problem-loan classification, and Board reporting                                                                   | Conditions for nonaccrual, return to accrual, and monitoring of problem loans and OREO; use of Watch/Substandard/Doubtful/Loss classifications.                                                                                                                |
| **State Right-to-Cure / Foreclosure / Repossession Laws (varies)**                                         | Content and timing of right-to-cure, foreclosure notices, and repossessions                                                              | State-specific requirements overlay these minimums; Legal must map product-level parameters accordingly.                                                                                                                                                       |

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

> Design note: Timings here are minimum standards; products or states with stricter requirements must configure tighter SLAs.

| Scenario                                                |                                                                  Trigger (human → event) | Deadline                                                                       | Content Reference                                                                           | Control                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Early courtesy notice for non-real-estate loan          |                        Loan becomes 10 days past due → `loan.delinquency.bucket_changed` | By end of next business day                                                    | Send neutral reminder notice; no threats or misleading language                             | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections)                                                                                                                                                        |
| Early courtesy notice for first-mortgage consumer loans |               Mortgage loan becomes 15 days past due → `loan.delinquency.bucket_changed` | By end of next business day                                                    | Courtesy reminder respecting mortgage-specific rules                                        | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections)                                                                                                                                                        |
| Second reminder for past-due loans                      |                        Loan reaches 20 days past due → `loan.delinquency.bucket_changed` | Within 3 calendar days                                                         | Follow-up notice explaining past-due status and options                                     | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections)                                                                                                                                                        |
| Direct outreach after grace period                      |                  Grace period expired (10 or 15 days) → `loan.delinquency.grace_expired` | Before 20th day past due                                                       | Direct contact attempt (phone/digital) + documentation                                      | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections)                                                                                                                                                        |
| Right-to-cure notice for consumer credit                |             Consumer note reaches 30 days delinquent → `loan.delinquency.bucket_changed` | Within 5 calendar days                                                         | Formal right-to-cure / demand notice; may be earlier (15 days) for chronic delinquencies    | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections), [LC-04](collections.md#lc-04-forbearance-extensions-workouts-tdrs)                                                                                    |
| Escalation review at 60 days past due                   |                      Loan reaches 60 days delinquent → `loan.delinquency.bucket_changed` | Within 10 calendar days                                                        | Loan officer memo summarizing status, collateral, and recommended collection / workout path | [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections), [LC-04](collections.md#lc-04-forbearance-extensions-workouts-tdrs), [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance) |
| Substandard classification                              |      Retail loan reaches 90 cumulative days past due → `loan.delinquency.bucket_changed` | Same day as 90-day bucket                                                      | Set classification to Substandard; update loss estimate                                     | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs), [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance)                                                                           |
| Nonaccrual status                                       |       Loan 90+ DPD or collection in full doubtful → `loan.delinquency.threshold_reached` | By next weekly past-due review                                                 | Move to nonaccrual; reverse uncollected interest from income                                | [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance)                                                                                                                                                   |
| Closed-end retail charge-off                            | Closed-end retail loan reaches 120 DPD (contractual) → `loan.delinquency.bucket_changed` | Charge-off by month-end in which 120th day occurs                              | Charge down to net realizable value (if secured) or full balance (if unsecured)             | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs)                                                                                                                                                              |
| Open-end retail charge-off                              |                 Open-end retail loan reaches 180 DPD → `loan.delinquency.bucket_changed` | Charge-off by month-end in which 180th day occurs                              | Charge-off full outstanding balance; update credit bureau                                   | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs)                                                                                                                                                              |
| Bankruptcy filing                                       |                           Bankruptcy notice received → `loan.bankruptcy.notice_received` | Within 60 days of notice                                                       | Classify and charge-off per policy and collateral value                                     | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs), [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance)                                                                           |
| Fraudulent loan identified                              |                                                 Fraud confirmed → `loan.fraud.confirmed` | Within 90 days of discovery                                                    | Charge-off fraudulent portion; file SAR where required                                      | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs)                                                                                                                                                              |
| Member death                                            |                           Borrower reported deceased → `member.status.deceased_recorded` | When loss amount reasonably estimable                                          | Charge-off expected loss; update estate tracking                                            | [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs), [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance)                                                                           |
| Entering a forbearance / workout plan                   |                                     Approved hardship/TDR case → `loan.workout.approved` | Within 5 business days of approval                                             | Implement modified terms; adjust delinquency logic per policy                               | [LC-04](collections.md#lc-04-forbearance-extensions-workouts-tdrs)                                                                                                                                                                  |
| CFPB / external complaint                               |                                                  Complaint intake → `complaint.received` | Initial response ≤ 15 days; final ≤ 60 days                                    | Acknowledgment, investigation, resolution                                                   | [LC-06](collections.md#lc-06-consumer-complaint-intake-resolution)                                                                                                                                                                  |
| Direct member complaint (non-regulator)                 |                                                  Complaint intake → `complaint.received` | Ack ≤ 5 business days; resolution ≤ 30 days                                    | Written or documented oral response; root-cause tagging                                     | [LC-06](collections.md#lc-06-consumer-complaint-intake-resolution)                                                                                                                                                                  |
| Credit reporting dispute                                |                                                    Dispute received → `dispute.received` | Investigation ≤ 30 days                                                        | Correct / verify tradeline; notify CRA(s)                                                   | [LC-07](collections.md#lc-07-credit-reporting-dispute-handling-in-collections)                                                                                                                                                      |
| Reportable cyber incident affecting collections data    |                      Incident triaged as “reportable” → `incident.reportable_classified` | Notify NCUA ≤ 72 hours after reasonable belief                                 | NCUA cyber incident notice; internal / member notifications                                 | [LC-08](collections.md#lc-08-collections-data-breach-incident-reporting)                                                                                                                                                            |
| Unauthorized access to sensitive member information     |                                    Incident confirmed → `incident.data_breach.confirmed` | As soon as reasonably possible after determining misuse is reasonably possible | Member notice and mitigation guidance                                                       | [LC-08](collections.md#lc-08-collections-data-breach-incident-reporting)                                                                                                                                                            |
| Overdraft review & exception fee decision               |                              Overdraft appears on daily report → `overdraft.item.posted` | Same business day                                                              | Review approval, notify customer, document any fee waivers                                  | [LC-10](collections.md#lc-10-overdraft-collections-and-fee-waiver-practices)                                                                                                                                                        |

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                                | Control Name                                       | Purpose                                                                                                         | Primary Rule(s)                                            |
| --------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [LC-01](collections.md#lc-01-collections-governance-scope)                        | Collections Governance & Scope                     | Define governance, scope, ownership, Board/committee oversight, and breach-of-policy escalation                 | NCUA Part 748; safety-and-soundness guidance               |
| [LC-02](collections.md#lc-02-delinquency-monitoring-early-stage-collections)      | Delinquency Monitoring & Early-Stage Collections   | Ensure timely detection of delinquency and standardized early-stage outreach with documentation                 | FFIEC retail classification policy; safety-and-soundness   |
| [LC-03](collections.md#lc-03-retail-credit-classification-charge-offs)            | Retail Credit Classification & Charge-Offs         | Standardize classification and charge-off rules for retail credit (incl. bankruptcy, fraud, death, real estate) | FFIEC retail classification; NCUA charge-off expectations  |
| [LC-04](collections.md#lc-04-forbearance-extensions-workouts-tdrs)                | Forbearance, Extensions, Workouts & TDRs           | Define hardship forbearance, extensions, TDRs, and re-aging limits consistent with safe and sound practices     | FFIEC re-aging/workout guidance; UDAAP                     |
| [LC-05](collections.md#lc-05-consumer-protection-in-collections-communications)   | Consumer Protection in Collections Communications  | Prevent abusive, deceptive, or unfair collection communications (internal and third-party)                      | Reg F / FDCPA; UDAAP                                       |
| [LC-06](collections.md#lc-06-consumer-complaint-intake-resolution)                | Consumer Complaint Intake & Resolution             | Capture, investigate, and resolve member complaints (incl. CFPB) within defined SLAs                            | CFPB complaint standards; UDAAP; NCUA UDAAP guidance       |
| [LC-07](collections.md#lc-07-credit-reporting-dispute-handling-in-collections)    | Credit Reporting & Dispute Handling in Collections | Ensure accurate furnishing, timely charge-off reporting, and proper handling of disputes                        | FCRA / Regulation V                                        |
| [LC-08](collections.md#lc-08-collections-data-breach-incident-reporting)          | Collections Data Breach & Incident Reporting       | Govern detection, classification, and reporting of incidents affecting collections data and member information  | NCUA Part 748 & Appendix B; cyber incident rules           |
| [LC-09](collections.md#lc-09-problem-loans-nonaccrual-and-foreclosure-governance) | Problem Loans, Nonaccrual & Foreclosure Governance | Govern risk ratings, nonaccrual treatment, loss estimation, foreclosure, and OREO                               | Interagency problem-asset & nonaccrual guidance            |
| [LC-10](collections.md#lc-10-overdraft-collections-and-fee-waiver-practices)      | Overdraft Collections and Fee Waiver Practices     | Standardize treatment of overdrafts as unsecured credit, manage fee practices, and avoid unauthorized lending   | UDAAP; interagency overdraft guidance; internal governance |

***

## LC-01 — Collections Governance & Scope <a href="#lc-01-collections-governance-scope" id="lc-01-collections-governance-scope"></a>

* WHY (Reg cite): The Board must adopt written policies, oversee implementation, and ensure adequate security and control over member information and risk-taking activities, including collections, overdrafts, problem loans, and charge-offs (NCUA Part 748).
* SYSTEM BEHAVIOR:
  * Maintain a single Collections & Workout Policy configuration object (`collections.policy.config`) defining:
    * Covered products (`product.type`: `credit_card`, `installment`, `heloc`, `mortgage`, `ewa`, `overdraft_program`, etc.).
    * Covered channels (branch, online banking, phone, partner/fintech-originated).
    * Ownership (1st line collections ops, 2nd line risk/compliance, 3rd line internal audit).
  * Enforce that all collections-related workflows (letters, calls, digital notices, charge-off jobs, credit reporting, complaint handling, overdrafts, foreclosure workflows) reference an active policy version ID.
  * Configure Board and Executive Loan Committee (ELC) reporting so that at least monthly:
    * Loans >30 days past due, problem loans, nonaccruals, and OREO are reported.
    * Ratios (e.g., past-due dollars / total loans) are presented.
  * Designate:
    * Chief Compliance Officer (CCO) as responsible for compliance with this policy’s scope.
    * Chief Credit Officer (CCO/CLO) as responsible for credit risk ratings and problem-loan accuracy.
* TRIGGERS (human → event):
  * Policy drafted or revised → `policy.collections.draft_created`
  * Policy approved by Board → `policy.collections.version_approved`
  * Policy review approaching → `policy.collections.review_due_approaching`
  * Material breach identified → `policy.collections.breach_logged`
* INPUTS (human → field):
  * Policy version (`policy.version_id`)
  * Product scope flags (`product.catalog.collections_scope_flag`)
  * Role mappings (`role.collections.owner_id`, `role.compliance.owner_id`, `role.credit.owner_id`, `role.audit.owner_id`)
  * Breach / exception record (`collections.breach.type`, `collections.breach.severity`, `collections.breach.root_cause`)
* OUTPUTS:
  * Machine-readable policy snapshot (`collections.policy.snapshot`)
  * Governance reports on delinquencies, charge-offs, nonaccruals, overdrafts, forbearance/TDRs, complaints, breaches
  * Version and approval history
* TIMERS/SLAs:
  * Policy review at least annually (review task created 90 days before due date)
  * Breach logged within 5 business days of detection
  * Board/ELC problem-loan reporting at least monthly
* EDGE CASES:
  * New product/partner onboarded without explicit configuration defaults to most conservative thresholds until updated.
  * M\&A portfolios using different standards flagged as exceptions with time-bound harmonization plan.
* AUDIT LOGS (event names):
  * `policy.collections.version_approved`
  * `policy.collections.review_completed`
  * `policy.collections.breach_logged`
  * `policy.collections.exception_approved`
* ACCESS CONTROL:
  * Only Risk, Compliance, Credit, and Collections leaders may edit `collections.policy.config`.
  * Internal Audit has read-only access to config and governance logs.
  * Partners may receive scoped, read-only views where needed.
* ALERTS/METRICS:
  * % of workflows bound to current policy version
  * Number/severity of policy breaches and exceptions per quarter
  * Timeliness of Board/ELC reporting vs. schedule

***

## LC-02 — Delinquency Monitoring & Early-Stage Collections <a href="#lc-02-delinquency-monitoring-early-stage-collections" id="lc-02-delinquency-monitoring-early-stage-collections"></a>

* WHY (Reg cite): Supervisory guidance expects management to monitor delinquencies, promptly follow up deteriorating credits, and maintain appropriate controls over problem loans. Early, consistent outreach reduces loss and supports fair treatment, mitigating UDAAP and Reg F–style risk.
* SYSTEM BEHAVIOR:
  * Nightly delinquency engine:
    * Calculates `loan.days_past_due`.
    * Assigns `loan.delinquency.bucket`: `current`, `1-29`, `30-59`, `60-89`, `90+`.
  * Grace periods:
    * Standard consumer/commercial: 10 days.
    * First-mortgage consumer loans: 15 days.
  * Workflow:
    * After grace expiry but before day 20, require at least one outreach attempt (phone or digital) with documentation.
    * Auto-generate courtesy notices at 10/15 days, second reminders at 20 days.
    * Send formal right-to-cure at 30 days (or earlier at 15 days for chronic delinquencies when loan officer triggers).
    * At 60 days delinquent:
      * Loan officer must prepare a 60-day status memo (current activity, collateral, proposed plan).
      * Memo reviewed by Chief Credit Officer (or delegate).
  * Documentation:
    * Maintain Past Due Notes by Responsibility weekly report:
      * For each delinquent account, list last contact date, channel, summary.
      * Retain history for at least one year.
* TRIGGERS (human → event):
  * Bucket change → `loan.delinquency.bucket_changed`
  * Grace period expiration → `loan.delinquency.grace_expired`
  * Manual delinquency override → `loan.delinquency.manual_adjustment`
  * Case assignment to loan officer/collector → `loan.collections.case_assigned`
* INPUTS (human → field):
  * Due dates / schedule (`loan.schedule.due_dates`)
  * Payment allocation rules (`loan.payment.allocation_method`)
  * Override reason (`loan.delinquency.override_reason`)
  * Contact preferences (`member.contact.preference`, `member.contact.do_not_call_flags`)
  * Contact notes (`collections.contact.note_text`, `collections.contact.channel`, `collections.contact.date_time`)
* OUTPUTS:
  * Updated delinquency status on loans and member profile
  * Work queues for collectors (`collections.queue.id`, `collections.queue.priority`)
  * Weekly Past Due Notes report and 60-day memo artifacts
* TIMERS/SLAs:
  * Courtesy notice: by EOD after grace expiry
  * Second reminder: within 3 days of 20-day mark
  * Right-to-cure: within 5 days of 30-day delinquency (or earlier where configured)
  * 60-day memo: within 10 days of hitting 60 DPD
* EDGE CASES:
  * Accounts in dispute, bankruptcy, or forbearance/TDR flagged so standard collection steps are adjusted (LC-03, LC-04, LC-07).
  * “Paid but not posted” exceptions allow temporary suspension of next step, with documented reason and expected resolution date.
* AUDIT LOGS (event names):
  * `loan.delinquency.bucket_changed`
  * `collections.notice_sent`
  * `collections.contact_attempt_logged`
  * `collections.right_to_cure_sent`
  * `collections.past_due_memo_submitted`
* ACCESS CONTROL:
  * Loan officers/collectors may update notes but not change automatic schedules.
  * Supervisors may approve postponement of specific steps with documented rationale.
* ALERTS/METRICS:
  * % of delinquent loans with on-time notices/contact attempts
  * Roll and cure rates at 30- and 60-day marks
  * Loans missing required 60-day memos or 30-day right-to-cure notices

***

## LC-03 — Retail Credit Classification & Charge-Offs <a href="#lc-03-retail-credit-classification-charge-offs" id="lc-03-retail-credit-classification-charge-offs"></a>

* WHY (Reg cite): The FFIEC Uniform Retail Credit Classification and Account Management Policy requires consistent classification and timely charge-offs for retail loans (120 DPD closed-end; 180 DPD open-end; 90+ DPD Substandard), and guidance on bankruptcy, fraud, death, and residential real estate. NCUA expects Board-approved practices that timely recognize losses.
* SYSTEM BEHAVIOR:
  * For retail credit (consumer/small-business loans in scope):
    * At 90 DPD:
      * Set `loan.classification = substandard`.
    * At 120 DPD (closed-end):
      * Auto-charge-off (`loan.status = charged_off`).
    * At 180 DPD (open-end):
      * Auto-charge-off.
  * Specific circumstances:
    * Bankruptcy: charge off within 60 days of `loan.bankruptcy.notice_received` unless well secured and in process of collection with documented repayment plan.
    * Fraud: charge off confirmed fraudulent amount within 90 days of `loan.fraud.confirmed`.
    * Death: charge off expected loss amount once loss is reasonably estimable after estate analysis.
    * 1–4 family / HE loans: at 90+ DPD and LTV > policy threshold, classify Substandard; by 120/180 days, write down any portion exceeding fair value net of cost to sell.
  * Charge-offs:
    * Post to allowance/charge-off GL accounts.
    * Continue collection efforts; post recoveries to `loan.recovery.amount`.
* TRIGGERS (human → event):
  * Crossing 90/120/180-day thresholds → `loan.delinquency.threshold_reached`
  * Bankruptcy notice → `loan.bankruptcy.notice_received`
  * Fraud confirmation → `loan.fraud.confirmed`
  * Death recorded → `member.status.deceased_recorded`
  * New collateral valuation → `collateral.valuation.updated`
* INPUTS (human → field):
  * Loan/product type (`loan.product_type`, `loan.open_end_flag`)
  * Days past due (`loan.days_past_due`)
  * Collateral data (`collateral.type`, `collateral.fair_value`, `collateral.cost_to_sell`)
  * LTV (`loan.ltv.current`)
  * Status flags (`loan.bankruptcy.status`, `loan.fraud.flag`, `member.deceased_flag`)
* OUTPUTS:
  * Updated classification (`loan.classification`)
  * Charge-off and recovery GL entries
  * Charge-off/recovery reports by product, segment, vintage
* TIMERS/SLAs:
  * Charge-offs executed by month-end of the 120/180 DPD threshold
  * Bankruptcy/fraud/death charge-offs within specified windows
* EDGE CASES:
  * Well-secured & in process of collection:
    * Allowed exception only where net collateral clearly covers exposure and recovery to current is expected within \~90 days; must document plan and have credit approval.
  * TDRs/workouts (LC-04) must reflect realistic capacity to repay and not be used to mask delinquencies.
* AUDIT LOGS (event names):
  * `loan.classification.changed`
  * `loan.charge_off.completed`
  * `loan.recovery.posted`
  * `loan.workout.restructured`
* ACCESS CONTROL:
  * Automated jobs run under service accounts; manual overrides require dual approval (Collections + Credit Risk).
  * Finance controls GL mappings, with change control.
* ALERTS/METRICS:
  * Late charge-offs vs. required timelines
  * Volume/performance of “well-secured/in-process” exceptions
  * Net charge-offs and recoveries by product/cohort

***

## LC-04 — Forbearance, Extensions, Workouts & TDRs <a href="#lc-04-forbearance-extensions-workouts-tdrs" id="lc-04-forbearance-extensions-workouts-tdrs"></a>

* WHY (Reg cite): FFIEC guidance on re-aging, extensions, deferrals, and troubled debt restructurings (TDRs) requires that modifications be used prudently, reflect sustainable capacity to repay, and not conceal portfolio quality problems. Poorly controlled forbearance/TDRs create UDAAP risk when relief is unclear or not delivered.
* SYSTEM BEHAVIOR:
  * Flags:
    * Hardship (`loan.hardship.flag`, `loan.hardship.type`)
    * Workout / modification (`loan.workout.plan_id`)
    * TDR (`loan.tdr.flag`)
  * Forbearance / TDR plan object (`loan.workout.plan_id`) must capture:
    * Modified payment (`loan.modification.new_payment`)
    * New rate (`loan.modification.new_rate`)
    * New maturity date (`loan.modification.new_maturity_date`)
    * Principal or interest reductions (`loan.modification.principal_reduction`, `loan.modification.interest_reduction`)
    * Interest capitalization flag (`loan.modification.interest_capitalization_flag`)
  * Delinquency logic:
    * Only reset `loan.days_past_due` after the member meets defined performance criteria (for example, three consecutive payments under modified terms).
  * Interest capitalization:
    * Generally discouraged; if used:
      * Requires prior Loan Committee approval.
      * Requires file memo from loan officer with circumstances and analysis.
  * Extensions:
    * Limit to a defined maximum (e.g., up to three months of payments) and only when updated cash flow analysis supports timely future performance.
* TRIGGERS (human → event):
  * Hardship request → `loan.hardship.requested`
  * Workout/TDR proposal submitted → `loan.workout.proposed`
  * Plan approved (forbearance or TDR) → `loan.workout.approved` / `loan.tdr.approved`
  * Plan completion/failure → `loan.workout.completed` / `loan.workout.defaulted`
* INPUTS (human → field):
  * Hardship type and details (`loan.hardship.type`, `loan.hardship.description`)
  * Updated financials (`member.income`, `member.cash_flow`, `member.expense_ratio`)
  * Proposed terms (`loan.modification.*`)
  * Prior modification counts (`loan.modification.count_past_12m`, `loan.modification.count_life`)
* OUTPUTS:
  * Forbearance/TDR agreements and disclosures
  * Updated schedules, flags, and risk ratings (if downgraded)
  * Reports on TDRs and other workouts for management, auditors, and regulators
* TIMERS/SLAs:
  * Initial review of request within 5 business days
  * Final decision/communication within 15 days, unless awaiting documentation
  * Quarterly review of active TDRs, interest-only arrangements, and extensions
* EDGE CASES:
  * Interest-only arrangements:
    * 3–12 months max for short-term cash-flow issues (construction, temporary stress).
    * Require Chief Credit Officer and President approval and ELC reporting.
    * May trigger risk-rating downgrade.
  * Not every restructure is a TDR; system must apply accounting criteria to decide when `loan.tdr.flag` is set.
* AUDIT LOGS (event names):
  * `loan.workout.proposed`
  * `loan.workout.approved`
  * `loan.tdr.approved`
  * `loan.workout.modified_terms_applied`
  * `loan.workout.defaulted`
* ACCESS CONTROL:
  * Only authorized workout/loss-mitigation staff may propose plans.
  * TDR approvals require (at minimum) Chief Credit Officer and CFO concurrence, plus any committee approvals.
* ALERTS/METRICS:
  * Forbearance, extension, and TDR rates by product/segment
  * Re-default rate within 12 months of plan completion
  * Use of re-aging/interest capitalization vs. policy limits

***

## LC-05 — Consumer Protection in Collections Communications <a href="#lc-05-consumer-protection-in-collections-communications" id="lc-05-consumer-protection-in-collections-communications"></a>

* WHY (Reg cite): Regulation F (FDCPA) prohibits abusive, unfair, or deceptive collection practices by debt collectors, and UDAAP standards apply to the institution and its service providers. The reference policy further requires that collections be handled ethically and prohibits harassment, threats, obscene language, and false disclosures of credit information.
* SYSTEM BEHAVIOR:
  * Communications rules engine enforces:
    * Permitted calling times by member local time.
    * Contact frequency caps (per day/week).
    * Respect for `member.contact.do_not_call`, `member.represented_by_attorney`, and `member.contact.cease_communication` flags.
  * Conduct constraints, implemented via training + scripts/templates:
    * No contact with such frequency or at such unusual hours that it would reasonably threaten or harass.
    * No conduct reasonably expected to threaten or harass the member or related person.
    * No obscene, threatening, or violent language.
    * No use or threat of force or violence.
    * No disclosure or threat to disclose false negative credit information.
  * Templates:
    * All letters/emails/texts/call scripts tagged by:
      * Purpose (courtesy, demand, workout, legal notice, etc.).
      * FDCPA/Reg F applicability.
      * Version.
    * All templates go through Compliance review.
* TRIGGERS (human → event):
  * System-initiated contact → `collections.contact.scheduled`
  * Agent-initiated contact → `collections.contact.initiated`
  * Preference/attorney updates → `member.contact.preferences_updated`
* INPUTS (human → field):
  * Member timezone (`member.time_zone`)
  * Contact preferences (`member.contact.channels_allowed`, `member.contact.do_not_call`, `member.contact.email_opt_in`)
  * Legal status (`loan.bankruptcy.status`, `member.represented_by_attorney`)
  * Template metadata (`template.id`, `template.version`, `template.fdcpadisclosure_required`)
* OUTPUTS:
  * Contact logs (date/time, channel, template, agent, summary)
  * Conduct/compliance KPIs (frequency, out-of-window contacts, flagged language)
  * Instructions/limits provided to third-party collectors
* TIMERS/SLAs:
  * Preference or attorney flags effective before next outbound batch.
  * Cease-communication flags effective within 1 business day.
* EDGE CASES:
  * Inbound calls outside normal hours handled, but outbound follow-ups remain constrained.
  * Contacts with third parties must obey FDCPA/Reg F and privacy rules; system must limit these and block disclosure of debt details unless permitted.
* AUDIT LOGS (event names):
  * `collections.contact.initiated`
  * `collections.contact.completed`
  * `member.contact.preferences_updated`
  * `thirdparty.collector.sync_performed`
* ACCESS CONTROL:
  * Agents must use approved systems/scripts; no personal devices for collections work.
  * Only Compliance can approve new/updated templates or scripts.
* ALERTS/METRICS:
  * Contacts per member vs. policy caps
  * Complaints alleging harassment, threats, or improper disclosure
  * Number of contacts made despite do-not-call/attorney/cease flags

***

## LC-06 — Consumer Complaint Intake & Resolution <a href="#lc-06-consumer-complaint-intake-resolution" id="lc-06-consumer-complaint-intake-resolution"></a>

* WHY (Reg cite): CFPB and NCUA expect complete, accurate, and timely responses to complaints. Complaints about collections, overdrafts, forbearance, foreclosure, and credit reporting can indicate UDAAP or systemic control issues.
* SYSTEM BEHAVIOR:
  * Single complaint intake and case management platform that:
    * Captures complaints from all channels: CFPB portal, NCUA/referrals, branch, phone, email, web/app, partners.
    * Classifies by product, issue type (collections, overdrafts, forbearance/TDR, foreclosure, credit reporting), severity, alleged harm.
    * Links to `member.id`, `loan.id`, and, if applicable, `overdraft.id`.
  * Integrates with LC-02–LC-05, LC-07, LC-10:
    * Auto-creates tasks for relevant teams (Collections, Credit Reporting, Overdraft Ops, Legal).
    * Flags potential UDAAP issues for Compliance review.
* TRIGGERS (human → event):
  * Complaint received → `complaint.received`
  * Case assigned → `complaint.assigned`
  * Interim response sent → `complaint.interim_response_sent`
  * Final resolution/closure → `complaint.closed`
* INPUTS (human → field):
  * Source (`complaint.source`: `cfpb`, `ncua`, `direct`, `partner`)
  * Product/issue (`complaint.product`, `complaint.issue`)
  * Severity/harm (`complaint.severity`, `complaint.alleged_harm`)
  * Deadlines (`complaint.response_due_date_initial`, `complaint.response_due_date_final`)
  * Root cause tags (`complaint.root_cause`, `complaint.udaap_flag`)
* OUTPUTS:
  * Acknowledgment and resolution communications
  * Internal remediation tickets where root cause requires process/policy changes
  * Aggregate reports for management and Board (volumes, types, UDAAP flags)
* TIMERS/SLAs:
  * Regulator complaints:
    * Initial response ≤ 15 calendar days
    * Final response ≤ 60 days (unless rules specify otherwise)
  * Direct member complaints:
    * Acknowledgment ≤ 5 business days
    * Target resolution ≤ 30 calendar days
* EDGE CASES:
  * Complaints alleging fraud/identity theft escalate concurrently to Fraud and LC-08 if data exposure is suspected.
  * Complaints overlapping legal proceedings involve Legal early; outbound communications may be limited or lawyer-to-lawyer.
* AUDIT LOGS (event names):
  * `complaint.received`
  * `complaint.status_changed`
  * `complaint.response_sent`
  * `complaint.escalated`
* ACCESS CONTROL:
  * Only trained complaint-handling staff may change status or send responses.
  * Managers and Compliance have read access for quality control; Board receives aggregated metrics.
* ALERTS/METRICS:
  * Complaint volumes per 1,000 accounts by product/issue
  * SLA adherence (initial and final responses)
  * Trends in UDAAP-related complaint tags and repeat issues

***

## LC-07 — Credit Reporting & Dispute Handling in Collections <a href="#lc-07-credit-reporting-dispute-handling-in-collections" id="lc-07-credit-reporting-dispute-handling-in-collections"></a>

* WHY (Reg cite): FCRA and Regulation V require furnishers to provide accurate information to CRAs and investigate disputes promptly, correcting errors and reporting accurate data, including for delinquent and charged-off accounts.
* SYSTEM BEHAVIOR:
  * Furnishing:
    * Generate monthly Metro 2 (or similar) files including status changes from LC-03, LC-09, LC-10.
    * Track history of what was furnished (`furnisher.report.history`).
  * Disputes:
    * Intake disputes from CRAs and directly from members.
    * Link disputes to specific tradelines and fields (e.g., balance, DPD, status, date opened).
    * Route tasks to responsible teams (Collections, Credit Reporting, Overdraft Ops).
    * Support outcomes: verified, corrected, or deleted.
* TRIGGERS (human → event):
  * Furnishing batch generated → `furnisher.batch.generated`
  * Furnishing batch transmitted → `furnisher.batch.transmitted`
  * Dispute received → `dispute.received`
  * Dispute resolved → `dispute.resolution_recorded`
* INPUTS (human → field):
  * Furnished tradeline snapshot (`furnisher.tradeline.snapshot`)
  * Dispute reason (`dispute.reason_code`, `dispute.description`)
  * Evidence (`dispute.supporting_docs`)
  * Investigation notes (`dispute.investigation.summary`)
* OUTPUTS:
  * Updated furnisher files (corrections/deletions)
  * Member notifications of dispute outcomes
  * Dispute reports and root-cause analyses for process improvements
* TIMERS/SLAs:
  * Disputes investigated within 30 days of `dispute.received` (shorter if required)
  * Corrections included in next regular or off-cycle furnishing batch
* EDGE CASES:
  * Duplicate or frivolous disputes handled per FCRA but still logged.
  * Disputes indicating identity theft trigger escalation to Fraud and potential incident investigation.
* AUDIT LOGS (event names):
  * `furnisher.batch.generated`
  * `furnisher.batch.transmitted`
  * `dispute.received`
  * `dispute.resolution_recorded`
* ACCESS CONTROL:
  * Furnishing configurations editable only by Credit Reporting/Compliance staff.
  * Dispute decisions recorded by trained dispute investigators and supervisors.
* ALERTS/METRICS:
  * Dispute rate per 1,000 tradelines
  * % of disputes resulting in changes vs. verification
  * Average time-to-resolution vs. 30-day limit

***

## LC-08 — Collections Data Breach & Incident Reporting <a href="#lc-08-collections-data-breach-incident-reporting" id="lc-08-collections-data-breach-incident-reporting"></a>

* WHY (Reg cite): NCUA Part 748 and Appendix B require a security and response program, including incident response and member notification where unauthorized access to member information could result in substantial harm. Cyber incident rules require reportable incidents to be reported to NCUA within 72 hours of reasonable belief.
* SYSTEM BEHAVIOR:
  * Incident management:
    * Log incidents with type (`incident.type`: `cyber`, `fraud`, `operational`, `vendor`) and scope (`incident.scope`: `collections_systems`, `credit_reporting`, `complaints`, `overdrafts`).
    * Tag impacted data (`incident.data_types_impacted`, `incident.sensitive_data_flag`).
  * Classification:
    * Determine whether incident is a reportable cyber incident or involves unauthorized access to sensitive member info likely to cause harm.
  * Response:
    * For reportable cyber incidents, prepare and send NCUA notice within required timeframe.
    * For breaches involving sensitive data, prepare and send member notifications and mitigation guidance.
* TRIGGERS (human → event):
  * Incident logged → `incident.logged`
  * Classification updated (reportable/non-reportable; breach/non-breach) → `incident.classification_updated`
  * NCUA report submitted → `incident.ncua_report_submitted`
  * Member notices sent → `incident.member_notices_sent`
* INPUTS (human → field):
  * Description and timestamps (`incident.description`, `incident.detected_at`)
  * Systems/data impacted (`incident.systems_impacted`, `incident.data_types_impacted`)
  * Sensitive data indicator (`incident.sensitive_data_flag`)
  * Regulatory reporting status (`incident.regulatory_reported_flag`, `incident.ncua_report_timestamp`)
* OUTPUTS:
  * NCUA and other regulatory reports
  * Member notifications and FAQs
  * Post-mortem and remediation plans
* TIMERS/SLAs:
  * Initial triage/classification within 24 hours of `incident.logged`
  * NCUA notification as soon as possible and no later than 72 hours after reasonable belief of reportable cyber incident
  * Member notices as soon as reasonably possible after determining misuse likely or possible
* EDGE CASES:
  * Incidents affecting only non-sensitive or public data may not require notification but must still be logged and assessed.
  * Incidents at service providers must still be reported by the institution; contracts must require timely vendor notification.
* AUDIT LOGS (event names):
  * `incident.logged`
  * `incident.classification_updated`
  * `incident.ncua_report_submitted`
  * `incident.member_notices_sent`
  * `incident.remediation_completed`
* ACCESS CONTROL:
  * Only Security/Incident Response can change classification.
  * Regulatory reports reviewed by Compliance and Legal where time permits.
* ALERTS/METRICS:
  * Number of incidents involving collections data
  * Time from detection to NCUA notification
  * Time from detection to member notification
  * Repeat incident patterns without mitigation

***

## LC-09 — Problem Loans, Nonaccrual and Foreclosure Governance <a href="#lc-09-problem-loans-nonaccrual-and-foreclosure-governance" id="lc-09-problem-loans-nonaccrual-and-foreclosure-governance"></a>

* WHY (Reg cite): Interagency guidance requires early identification of problem loans, appropriate risk ratings (Watch, Substandard, Doubtful, Loss), nonaccrual treatment, loss estimation, and prudent foreclosure/OREO management. The reference policy adds specific expectations for problem-loan lists, narrative strategies, nonaccrual rules, and foreclosure evaluation.
* SYSTEM BEHAVIOR:
  * Risk ratings:
    * Maintain codes including at least: Pass, Watch, Substandard, Doubtful, Loss (`loan.risk_rating`).
    * Problem loans include all Watch/Substandard/Doubtful/Loss and OREO assets.
  * Problem-loan reporting:
    * Monthly problem and classified loan reports:
      * Include narratives of current activity and planned actions.
      * Include borrowers with adverse financial trends, managerial problems, industry declines, missing financials/collateral documentation, repeated delinquency, overdrafts, or renewals.
    * Reports reviewed by ELC and provided to Board.
  * Nonaccrual:
    * Place loans on nonaccrual when:
      * Principal or interest is 90+ DPD, or
      * Collection in full is not expected.
    * At nonaccrual:
      * Stop accruing interest.
      * Reverse any previously accrued but uncollected interest from current-year income.
    * Maintain current list of nonaccruals for Board and examiners.
    * Return to accrual only when:
      * All delinquent interest/principal is brought current, and
      * Repayment capacity is demonstrated, or other nonaccrual-return criteria are met.
  * Foreclosure and OREO:
    * Prior to foreclosure, loan officer must complete a financial impact evaluation:
      * Reasonable market value.
      * Outstanding taxes and superior liens.
      * Estimated maintenance, holding, and selling costs.
      * Projected loss.
    * CCO and President approve commencement of legal action; ELC and Board are updated.
    * OREO guidelines (separate document) govern valuation and disposition; LC-09 ensures linkage from loan to OREO.
* TRIGGERS (human → event):
  * Risk rating change → `loan.risk_rating.changed`
  * Nonaccrual flagged → `loan.nonaccrual.flagged`
  * Nonaccrual status change → `loan.nonaccrual.status_changed`
  * Foreclosure recommended → `loan.foreclosure.recommended`
  * Foreclosure initiated → `loan.foreclosure.initiated`
  * OREO asset recorded → `oreo.asset.recorded`
* INPUTS (human → field):
  * Risk rating and reasons (`loan.risk_rating`, `loan.risk_rating.rationale`)
  * Borrower metrics (profits, sales, working capital, leverage, DSCR)
  * Collateral assumptions (`collateral.fair_value`, `collateral.liquidation_rate`, `collateral.costs_to_sell`)
  * Nonaccrual flag (`loan.nonaccrual.status`)
  * Foreclosure/OREO evaluation fields (`foreclosure.expected_loss`, `oreo.asset.value_at_recording`)
* OUTPUTS:
  * Problem-loan and classified-loan reports with narratives
  * Nonaccrual logs and lists
  * Foreclosure plans, timetables, and cost estimates
  * Data for allowance/impairment and loan loss reserve analysis
* TIMERS/SLAs:
  * Risk rating review at least annually for performing loans, quarterly for Watch/Substandard/Doubtful
  * Loans reaching 90 DPD reviewed for nonaccrual within one week
  * Foreclosure evaluation completed before legal action begins
* EDGE CASES:
  * Loans with repeated delinquency, overdrafts, or renewals may be moved to Watch prior to 90 DPD.
  * Government/agency guarantees may reduce estimated loss; unsecured personal guarantees generally not used unless well documented and supported.
* AUDIT LOGS (event names):
  * `loan.risk_rating.changed`
  * `loan.nonaccrual.status_changed`
  * `loan.foreclosure.recommended`
  * `loan.foreclosure.initiated`
  * `oreo.asset.recorded`
* ACCESS CONTROL:
  * Loan officers recommend risk ratings; CCO reviews and approves changes.
  * Foreclosure decisions require CCO and President approval, with ELC oversight.
* ALERTS/METRICS:
  * Balances and counts in Watch/Substandard/Doubtful/Loss
  * Nonaccrual balances and trends
  * Time from 90 DPD to nonaccrual and/or foreclosure decision

***

## LC-10 — Overdraft Collections and Fee Waiver Practices <a href="#lc-10-overdraft-collections-and-fee-waiver-practices" id="lc-10-overdraft-collections-and-fee-waiver-practices"></a>

* WHY (Reg cite): Overdrafts are unsecured extensions of credit and must be overseen carefully to avoid unauthorized lending, tax/operational risk, and UDAAP issues. The reference policy requires regular review, controlled approvals, consistent application of fees, and documented exceptions.
* SYSTEM BEHAVIOR:
  * Treat overdrafts (other than formal overdraft lines of credit) as short-term unsecured credit:
    * Daily overdraft report (`overdraft.daily_report_id`) listing:
      * Overdraft items, amounts, dates, and cumulative exposure by customer.
    * Any overdraft item honored must:
      * Be approved within the approving officer’s lending authority.
      * Be aggregated with other exposure to the borrower when assessing capacity.
  * Notifications:
    * Auto-generate an overdraft notice (phone call, email, and/or mailed) for overdraft events.
    * Require documentation of verbal communication on the overdraft report.
  * Fee practices:
    * Assess published overdraft charges regularly and consistently.
    * Fee waivers:
      * Exception-only; not the norm.
      * Each waiver documented on daily report with reason.
      * Recurring/continuous waivers require CCO (or designate) approval.
* TRIGGERS (human → event):
  * Overdraft item posted → `overdraft.item.posted`
  * Daily overdraft report generated → `overdraft.report.generated`
  * Fee waiver requested/applied → `overdraft.fee_waiver.requested` / `overdraft.fee_waiver.applied`
* INPUTS (human → field):
  * Overdraft amount and date (`overdraft.amount`, `overdraft.posted_at`)
  * Aggregate borrower exposure (`borrower.total_exposure`)
  * Officer approval (`overdraft.approved_by_officer_id`)
  * Fee waiver reason and approver (`overdraft.fee_waiver.reason`, `overdraft.fee_waiver.approved_by_id`)
* OUTPUTS:
  * Overdraft notices and communication records
  * Daily overdraft report with approvals and waiver documentation
  * Exception and trend reports for overdraft behaviors and fee waivers
* TIMERS/SLAs:
  * Daily overdraft report reviewed same business day
  * Persistent overdrafts (beyond policy aging) escalated to collections; may be converted to term loans or charged off under LC-03
* EDGE CASES:
  * Payroll overdrafts:
    * Ongoing coverage of payroll without formal credit facility is prohibited; system must flag patterns of business accounts using overdrafts for payroll.
  * Overdrafts linked to formal overdraft lines are governed by loan terms and LC-02/LC-03.
* AUDIT LOGS (event names):
  * `overdraft.item.posted`
  * `overdraft.notice_sent`
  * `overdraft.fee_waiver.applied`
  * `overdraft.escalated_to_collections`
* ACCESS CONTROL:
  * Only officers with documented lending authority may approve overdrafts and recurring fee waivers.
  * CCO approval required for systematic or recurring fee-waiver patterns.
* ALERTS/METRICS:
  * Overdraft frequency and concentration by customer segment
  * Fee waiver frequency and reasons
  * Extended overdrafts converted to loans or charged off

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

The following checklist and template packs must be created and maintained in the institution’s template repository and bound to the controls above:

* LC-02 Packs (Delinquency & Early Collections):
  * Delinquency workflow checklist (grace, 10/15/20/30/60-day steps).
  * Courtesy, reminder, and right-to-cure notice templates.
  * Past Due Notes documentation checklist.
* LC-03 Packs (Charge-Offs & Classification):
  * Charge-off decision worksheet (closed-end, open-end, real estate, bankruptcy, fraud, death).
  * Collateral valuation and net realizable value worksheet.
  * Monthly charge-off and recovery reporting template.
* LC-04 Packs (Forbearance, TDRs & Extensions):
  * Hardship intake checklist.
  * Forbearance/TDR plan template and member agreement.
  * Interest-only and extension decision checklist.
  * Re-aging eligibility checklist.
* LC-05 Packs (Communications Conduct):
  * Call scripts and templates reflecting conduct rules (no harassment/threats/false disclosures).
  * Letter/email/SMS templates with required disclosures.
  * Communication rules configuration sheet (time windows, frequency caps, preference logic).
* LC-06 Packs (Complaints):
  * Complaint intake script (branch, phone, digital).
  * Acknowledgment and resolution letter templates.
  * Root-cause and UDAAP tagging guide.
* LC-07 Packs (Furnishing & Disputes):
  * Monthly furnishing checklist.
  * Dispute investigation checklist and documentation template.
  * Standard response letters for verified, corrected, or deleted tradelines.
* LC-08 Packs (Incidents & Breach Notification):
  * Collections-specific incident response playbook.
  * NCUA reporting checklist for cyber incidents.
  * Member breach notification template and FAQ.
* LC-09 Packs (Problem Loans, Nonaccrual & Foreclosure):
  * Risk-rating change justification template.
  * 60-day delinquency memo template.
  * Nonaccrual/return-to-accrual checklist.
  * Foreclosure/OREO evaluation worksheet (value, taxes/liens, maintenance, holding, selling costs).
* LC-10 Packs (Overdrafts):
  * Daily overdraft review checklist.
  * Overdraft notice templates.
  * Fee-waiver decision and documentation checklist.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* Policy Owner: Chief Risk Officer (or designee) is responsible for:
  * Maintaining this policy and ensuring updates for regulatory changes.
  * Coordinating with Collections, Credit, Compliance, Legal, IT/Security, and Finance for implementation.
* Approvals: This policy and any material revisions must be approved by:
  * Chief Executive Officer
  * Chief Compliance Officer
  * Board of Directors (or designated Board committee)
* Review Cadence:
  * Formal review at least annually, or sooner if:
    * Regulatory or accounting changes materially affect collections, charge-offs, overdrafts, complaint handling, nonaccrual, or incident reporting.
    * Exams, audits, or monitoring identify material gaps or UDAAP issues.
* Cross-References:
  * Fair Lending Policy
  * UDAAP/CFPA Policy
  * BSA/AML Policy
  * Information Security & Incident Response Policy
  * Credit Risk / Allowance Policy
  * OREO Guidelines
  * Vendor Management Policy
* Breach Reporting (Policy Non-Compliance):
  * Material deviations from this policy (e.g., systemic delays in charge-offs or nonaccruals, unauthorized overdraft practices, chronic complaint SLA breaches, abusive communications) must be:
    * Logged as `policy.collections.breach_logged`.
    * Reported to the Risk Committee and Board with remediation plan and timeline.
    * Evaluated for potential regulatory self-reporting.

***

## Assumptions & Gaps

* Roles & Titles: CCO, Chief Credit Officer, President, and Executive Loan Committee are generic titles; they must be mapped to actual governance roles.
* State Law Overlays: State-specific right-to-cure, foreclosure, repossession, and overdraft rules are not exhaustively listed; Legal must configure overlays at the product level.
* Numeric Limits: Specific numeric limits (e.g., re-aging counts, interest-only durations, overdraft aging thresholds) here are policy defaults and must be validated against current supervisory expectations and risk appetite.
* Accounting Definitions: TDR and nonaccrual return criteria must be aligned with current GAAP and call-report/NCUA guidance and are further detailed in Credit/Allowance policies.

(Assumption—needs confirmation: finalize product- and jurisdiction-specific parameters for right-to-cure timing, re-aging limits, overdraft aging thresholds, and risk-rating criteria before code is moved into production.)
