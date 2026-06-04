---
title: Truth in Savings Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Truth in Savings, Regulation DD, Deposit Disclosures, Advertising, Overdraft]
---

# Truth in Savings Policy

## General Policy Statement

Pynthia Credit Union complies with the Truth in Savings Act and its implementing Regulation DD ([12 CFR Part 1030](https://www.ecfr.gov/current/title-12/part-1030)) by disclosing the terms of consumer deposit accounts accurately, clearly and conspicuously, and in a form the member can keep; by governing the advertising of deposit accounts across all media; and by meeting the disclosure requirements that apply to overdraft services. This policy applies to all consumer deposit accounts across all delivery channels — paper, electronic, and in-person — and to every employee who opens accounts, calculates interest, prepares disclosures, or creates advertising. Truth-in-savings risk concentrates wherever a member relies on a stated rate, yield, fee, or "free" claim; an inaccurate or late disclosure is treated as both a Regulation DD violation and a UDAAP exposure, and is escalated accordingly. Governance of every control in this policy is centralized with the Chief Compliance Officer.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Member opens an account in person or requests a disclosure | Account opened or service requested (`account.created`) | Before account is opened or service provided | Full account disclosures (APY, rate, compounding, balances, fees, limits) | [TS-02](#ts-02-pre-opening-account-disclosures) |
| Member opens an account but is not present (mail/phone/online without contemporaneous delivery) | Account opened remotely (`account.created`) | Within 10 business days after opening | Full account disclosures | [TS-02](#ts-02-pre-opening-account-disclosures) |
| A term change reduces APY or otherwise adversely affects the member | Change-in-terms approved (`disclosure.change_in_terms.approved`) | ≥ 30 calendar days before effective date | Change-in-terms notice incl. effective date | [TS-03](#ts-03-change-in-terms-notices) |
| Rollover CD with term > 1 year matures | Maturity date approaching (`account.maturity_window.opened`) | ≥ 30 calendar days before maturity | Pre-maturity renewal notice with new-term disclosures | [TS-04](#ts-04-maturity-and-renewal-notices) |
| Rollover CD with term > 1 month and ≤ 1 year matures | Maturity date approaching (`account.maturity_window.opened`) | ≥ 20 calendar days before maturity | Renewal notice or alternative short-form disclosures | [TS-04](#ts-04-maturity-and-renewal-notices) |
| Non-rollover CD with term > 1 year matures | Maturity date approaching (`account.maturity_window.opened`) | ≥ 10 calendar days before maturity | Maturity notice (account will not renew) | [TS-04](#ts-04-maturity-and-renewal-notices) |
| Periodic statement cycle closes for a statement account | Statement cycle closed (`statement.cycle_closed`) | With the statement for the period | APY earned, interest, fees, days in period | [TS-05](#ts-05-periodic-statement-disclosures) |
| Periodic statement cycle closes for an account with overdraft/returned-item fees | Statement cycle closed (`statement.cycle_closed`) | With the statement for the period | Period and YTD overdraft and returned-item fee totals | [TS-08](#ts-08-overdraft-service-disclosures) |
| Deposit advertisement is drafted (any medium, incl. online and social) | Ad submitted for review (`advertising.review_requested`) | Before publication | Trigger-term disclosures, "free" rules, APY accuracy | [TS-07](#ts-07-advertising-review) |
| A disclosure error or missed deadline is discovered | Error logged (`disclosure.error_detected`) | Escalation within 2 business days (internal) | Corrected disclosure + remediation record | [TS-10](#ts-10-training-monitoring-and-escalation) |

## TS-01 — Disclosure Standards {#ts-01-disclosure-standards}

- **WHY (Reg cite):** Regulation DD [§1030.3](https://www.ecfr.gov/current/title-12/part-1030/section-1030.3) requires that disclosures be clear and conspicuous, in writing, in a form the consumer may keep, and that they reflect the legal obligation of the account agreement; rates must be stated as "annual percentage yield" and "interest rate" using those terms.
- **SYSTEM BEHAVIOR:** Compliance maintains a single master disclosure template per deposit product (share savings, share draft/checking, money market, certificates). Every template states the APY and interest rate using those exact terms, mirrors the deposit contract, and is version-controlled so the disclosure delivered to a member is always traceable to the contract version in force. Electronic delivery is permitted only where the member has given E-SIGN consent (consent mechanics are governed by the E-Commerce Policy); paper and in-person delivery use the same master template. If a disclosure and the deposit contract conflict, the contract terms govern and Compliance must correct the disclosure under [TS-10](#ts-10-training-monitoring-and-escalation). Disclosure templates are write-restricted to Compliance; deposit operations and front-line staff have read-only access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A deposit product is created or its contract terms change (`product.terms_updated`) | Product terms (`product.apy`, `product.interest_rate`, `product.fee_schedule[]`, `product.transaction_limits[]`), contract version (`product.contract_version`) | Updated master disclosure template, CCO-approved (`disclosure.template_published`) | Before the new terms are offered to any member (internal: 5 BD review SLA) |
  | A disclosure template version is retired (`disclosure.template_retired`) | Superseding template ID (`disclosure.template_id`), retirement reason (`disclosure.retirement_reason`) | Archived template with effective-date range for audit (`disclosure.template_archived`) | — |

- **ALERTS/METRICS:** Alert if any account is opened against a retired or unapproved template version (target zero). Monthly metric: count of active products whose disclosure template version does not match the current contract version (target zero).

## TS-02 — Pre-Opening Account Disclosures {#ts-02-pre-opening-account-disclosures}

- **WHY (Reg cite):** Regulation DD [§1030.4](https://www.ecfr.gov/current/title-12/part-1030/section-1030.4) requires account disclosures before an account is opened or a service is provided, or within 10 business days of opening if the consumer is not present; [§1030.5](https://www.ecfr.gov/current/title-12/part-1030/section-1030.5)(a) governs delivery, and §1030.4(b) specifies the required content.
- **SYSTEM BEHAVIOR:** Account opening in any channel is blocked from completing until the system records that the required disclosures — APY, interest rate, compounding and crediting frequency, minimum-balance requirements, fees, and transaction limitations — were delivered or, for remote openings where the member was not present, a 10-business-day delivery timer is started. In-person and online-with-contemporaneous-delivery openings satisfy the requirement at opening; mail and phone openings without contemporaneous delivery rely on the timer. A member's oral rate inquiry triggers delivery of disclosures upon request per §1030.4(a)(2) without requiring an account opening. Disclosure-delivery records are write-restricted to the account-opening system of record; manual overrides require Compliance approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Account opened with member present or via channel with contemporaneous e-delivery (`account.created`) | Product disclosure template (`disclosure.template_id`), member identity (`entity_id`), channel (`account.opening_channel`), E-SIGN consent flag where electronic (`entity.esign_consent`) | Delivered disclosure package + delivery receipt (`disclosure.account_opening.delivered`) | Before or at account opening |
  | Account opened with member not present (`account.created` with `account.opening_channel` = mail/phone) | Mailing address or e-delivery target (`entity.contact`), disclosure template (`disclosure.template_id`) | Mailed/e-delivered disclosure package (`disclosure.account_opening.delivered`) | 10 business days after opening (internal: 5 BD; enforced by `disclosure.account_opening_due_at`) |
  | Member requests account disclosures without opening (`disclosure.requested`) | Product identifier (`product.id`), requestor contact (`entity.contact`) | Disclosure package delivered (`disclosure.on_request.delivered`) | Upon request (internal: 3 BD) |

- **ALERTS/METRICS:** Aging alert when a remote-opening disclosure is undelivered at 7 business days; daily exception report of accounts opened without a logged `disclosure.account_opening.delivered` event (target zero). Metric: median days from remote opening to disclosure delivery.

## TS-03 — Change-in-Terms Notices {#ts-03-change-in-terms-notices}

- **WHY (Reg cite):** Regulation DD [§1030.5](https://www.ecfr.gov/current/title-12/part-1030/section-1030.5)(a) requires advance notice, mailed or delivered at least 30 calendar days before the effective date, of any change in a term that may reduce the APY or otherwise adversely affect the consumer, and the notice must state the effective date.
- **SYSTEM BEHAVIOR:** Any proposed change to a deposit product term is routed to Compliance, which classifies it as adverse or non-adverse. Adverse changes (APY reduction, new or increased fee, tightened transaction limits) cannot take effect until at least 30 calendar days after the notice mail/delivery date; the system blocks the effective date from being set inside the 30-day window. Changes in the interest rate itself on variable-rate accounts, changes in check-printing fees, and short-term time-account changes excepted by §1030.5(a)(2) do not require advance notice — these carve-outs are applied at Compliance classification, not by front-line judgment. Term-change classification and notice content are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Adverse term change approved by CCO (`disclosure.change_in_terms.approved`) | Affected accounts (`account.id[]`), old and new terms (`product.contract_version`, `product.apy`, `product.fee_schedule[]`), effective date (`disclosure.change_effective_date`) | Change-in-terms notice mailed/delivered to each affected member (`disclosure.change_in_terms.sent`) | ≥ 30 calendar days before effective date (internal: mail at 35 days; enforced by `disclosure.change_in_terms_due_at`) |
  | Proposed term change classified non-adverse (`disclosure.change_in_terms.classified_nonadverse`) | Change description (`disclosure.change_description`), classification rationale (`disclosure.classification_basis`) | Classification record for audit (`disclosure.classification_logged`) | Before the change takes effect |

- **ALERTS/METRICS:** Hard alert if any adverse change effective date falls fewer than 30 days after notice dispatch (target zero). Metric: distribution of notice lead times (target ≥ 35 days median); count of non-adverse classifications reviewed in quarterly monitoring.

## TS-04 — Maturity and Renewal Notices {#ts-04-maturity-and-renewal-notices}

- **WHY (Reg cite):** Regulation DD [§1030.5](https://www.ecfr.gov/current/title-12/part-1030/section-1030.5)(b) requires pre-maturity notices for automatically renewing time accounts (≥ 30 days before maturity for terms over one year; ≥ 20 days for terms over one month up to one year, with alternative content options), and §1030.5(c) requires notices ≥ 10 days before maturity for non-renewing time accounts with terms over one year.
- **SYSTEM BEHAVIOR:** Every certificate carries a maturity date and a renewal flag at booking. A scheduler opens a maturity window keyed to the account term and renewal type and generates the appropriate notice: rollover CDs over one year receive full new-term disclosures at least 30 calendar days pre-maturity; rollover CDs over one month and up to one year receive the notice at least 20 calendar days pre-maturity (the short-form alternative under §1030.5(b)(2) may be used where the new rate is not yet known, stating when it will be available); non-rollover CDs over one year receive a non-renewal notice at least 10 calendar days pre-maturity. CDs with terms of one month or less are outside notice scope. Maturity-notice templates are write-restricted to Compliance; the scheduler configuration is write-restricted to deposit operations with Compliance sign-off.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Rollover CD term > 1 year enters maturity window (`account.maturity_window.opened`) | Maturity date (`account.maturity_date`), renewal terms (`product.apy`, `product.contract_version`), member contact (`entity.contact`) | Pre-maturity renewal notice with new-term disclosures (`disclosure.maturity_notice.sent`) | ≥ 30 calendar days before maturity (enforced by `account.maturity_notice_due_at`) |
  | Rollover CD term > 1 month and ≤ 1 year enters maturity window (`account.maturity_window.opened`) | Maturity date (`account.maturity_date`), renewal terms or rate-availability date (`disclosure.rate_available_date`), member contact (`entity.contact`) | Renewal notice (full or §1030.5(b)(2) alternative) (`disclosure.maturity_notice.sent`) | ≥ 20 calendar days before maturity (enforced by `account.maturity_notice_due_at`) |
  | Non-rollover CD term > 1 year enters maturity window (`account.maturity_window.opened`) | Maturity date (`account.maturity_date`), disposition of funds at maturity (`account.maturity_disposition`), member contact (`entity.contact`) | Non-renewal maturity notice (`disclosure.maturity_notice.sent`) | ≥ 10 calendar days before maturity (enforced by `account.maturity_notice_due_at`) |

- **ALERTS/METRICS:** Daily report of certificates inside their maturity window without a logged `disclosure.maturity_notice.sent` (target zero); alert when a notice deadline is within 5 days and unsent. Metric: on-time maturity-notice rate (target 100%).

## TS-05 — Periodic Statement Disclosures {#ts-05-periodic-statement-disclosures}

- **WHY (Reg cite):** Regulation DD [§1030.6](https://www.ecfr.gov/current/title-12/part-1030/section-1030.6) requires that, where a periodic statement is provided, it include the annual percentage yield earned, the amount of interest, fees imposed, and the length of the statement period.
- **SYSTEM BEHAVIOR:** For every statement account, the statement-generation process computes and prints the APY earned (using the Appendix A Part II formula), the dollar amount of interest credited, each fee debited during the period with its amount, and the number of days in the period. Statement content is generated from ledger data (`bookkeeping_entry` records) — no manual statement edits are permitted, and statement template changes are write-restricted to Compliance. If interest or a fee posted in error, the correction posts as a new ledger entry and appears on the next statement rather than altering an issued statement.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Statement cycle closes for a statement account (`statement.cycle_closed`) | Period interest and fee entries (`bookkeeping_entry` with `source` = `fee` or interest, `bookkeeping_entry.amount`), daily balances (`account.balances.balance`), period day count (`statement.days_in_period`) | Periodic statement with APY earned, interest, fees, and days in period (`statement.issued`) | With the statement for the period (internal: statements rendered within 5 BD of cycle close) |

- **ALERTS/METRICS:** Pre-release validation alert when a rendered statement is missing any of the four required Reg DD elements (target zero released with gaps). Metric: statement render latency from cycle close; count of post-issuance corrections per quarter.

## TS-06 — Interest Calculation {#ts-06-interest-calculation}

- **WHY (Reg cite):** Regulation DD [§1030.7](https://www.ecfr.gov/current/title-12/part-1030/section-1030.7) requires interest to be paid on the full amount of principal in the account each day using either the daily balance or average daily balance method, and governs when interest begins to accrue (no later than the business day the institution receives provisional credit); APY and APY-earned calculations follow [Appendix A to Part 1030](https://www.ecfr.gov/current/title-12/part-1030/appendix-Appendix%20A%20to%20Part%201030).
- **SYSTEM BEHAVIOR:** Each interest-bearing product is configured with a permitted balance-computation method (daily balance or average daily balance) and a documented APY/APYE formula per Appendix A. Interest accrues on the full principal balance each day, beginning no later than the business day the credit union receives provisional credit for deposited funds, and accrued interest is credited per the product's stated crediting frequency. The interest engine configuration (method, accrual start rule, compounding and crediting frequency) is write-restricted to deposit operations with Compliance sign-off, and any configuration change is treated as a potential change in terms routed through [TS-03](#ts-03-change-in-terms-notices).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily accrual run executes (`interest.accrual_run.completed`) | Daily principal balances (`account.balances.balance`), product rate and method (`product.interest_rate`, `product.balance_method`) | Per-account accrual records (`interest.accrued`) | Daily (internal: by end of next business day) |
  | Crediting date reached per product schedule (`interest.crediting_due`) | Accrued interest to date (`interest.accrued_balance`), account status (`account.status`) | Interest credit posted to ledger (`bookkeeping_entry` with `entry_type` = `credit`; `interest.credited`) | On the stated crediting date (enforced by `interest.crediting_due_at`) |
  | Interest configuration change proposed (`product.interest_config.change_requested`) | Proposed method/rate/frequency (`product.balance_method`, `product.interest_rate`), Compliance classification (`disclosure.classification_basis`) | Approved configuration + change-in-terms routing decision (`product.interest_config.updated`) | Before the configuration takes effect |

- **ALERTS/METRICS:** Alert on any accrual run that skips accounts or uses a non-permitted balance method (target zero). Metric: reconciliation variance between accrued interest and credited interest per cycle (target zero variance); periodic APY recalculation sample pass rate from [TS-10](#ts-10-training-monitoring-and-escalation) monitoring.

## TS-07 — Advertising Review {#ts-07-advertising-review}

- **WHY (Reg cite):** Regulation DD [§1030.8](https://www.ecfr.gov/current/title-12/part-1030/section-1030.8) prohibits advertisements that are misleading, inaccurate, or misrepresent the deposit contract; restricts use of "free" or "no cost" where a maintenance or activity fee may be imposed; and requires additional disclosures whenever a rate of return or a bonus is advertised. Deceptive deposit advertising is also independently examinable as a UDAAP under the California Consumer Financial Protection Law ([Cal. Fin. Code §90003](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FIN&sectionNum=90003.)).
- **SYSTEM BEHAVIOR:** No deposit advertisement — print, broadcast, in-branch, online, email, or social media — may be published without pre-publication Compliance review. Reviewers verify that any stated rate is an annual percentage yield using that term, that trigger terms (rates, bonuses) carry the additional §1030.8(c)–(d) disclosures, that "free"/"no cost" claims are used only where no maintenance or activity fee may be imposed, and that the ad does not misrepresent the deposit contract. Broadcast and certain limited media may use the abbreviated disclosures permitted by §1030.8(e). Marketing submits; only Compliance can mark an advertisement approved, and the approval record is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Deposit ad submitted for review (`advertising.review_requested`) | Ad creative and copy (`advertising.asset_id`), advertised product terms (`product.apy`, `product.fee_schedule[]`), medium (`advertising.medium`) | Approval or required-changes decision (`advertising.review_completed`) | Before publication (internal: 5 BD review SLA) |
  | Approved ad published (`advertising.published`) | Approved asset version (`advertising.asset_id`, `advertising.approval_id`) | Publication record linking live ad to approved version (`advertising.publication_logged`) | At publication |
  | Advertised rate or term changes while ad is live (`product.terms_updated`) | Live-ad inventory (`advertising.asset_id[]`), new terms (`product.apy`) | Pulled or re-approved ad (`advertising.review_requested` re-emitted) | Before the stale ad next runs (internal: 2 BD) |

- **ALERTS/METRICS:** Alert on any `advertising.published` event without a matching approval (target zero). Metrics: ad-review turnaround time; count of live ads citing a rate that no longer matches the current product APY (target zero); quarterly social-media sweep findings.

## TS-08 — Overdraft Service Disclosures {#ts-08-overdraft-service-disclosures}

- **WHY (Reg cite):** Regulation DD [§1030.11](https://www.ecfr.gov/current/title-12/part-1030/section-1030.11) requires periodic statements to disclose period and year-to-date totals for overdraft fees and returned-item fees, governs advertising of overdraft services, and requires that automated balance-disclosure systems state a balance that excludes discretionary overdraft funds. This control coordinates with the Regulation E opt-in for ATM and one-time debit overdraft fees under [§1005.17](https://www.ecfr.gov/current/title-12/part-1005/section-1005.17).
- **SYSTEM BEHAVIOR:** The statement engine aggregates overdraft fees and returned-item fees separately, showing both the statement-period total and the calendar-year-to-date total in the §1030.11 tabular format. Automated systems (phone banking, online/mobile banking, ATM balance inquiries) disclose the member's available balance excluding any discretionary overdraft coverage; if a second balance including overdraft funds is offered, it is labeled as such per §1030.11(c). Overdraft-service advertising routes through [TS-07](#ts-07-advertising-review) with the additional §1030.11(b) required disclosures. No ATM or one-time-debit overdraft fee is assessed for a member who has not opted in under Reg E §1005.17 — the opt-in process itself is governed by the Compliance Policy and Electronic Payment Systems Policy; this control only verifies the opt-in flag before fee assessment. Fee-aggregation logic and balance-display configuration are write-restricted to deposit operations with Compliance sign-off.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Statement cycle closes for an account assessed overdraft or returned-item fees (`statement.cycle_closed`) | Period fee entries (`bookkeeping_entry` with `source` = `fee`), fee type tags (`fee.type` = overdraft/returned_item), YTD running totals (`fee.ytd_total`) | Statement with §1030.11 period and YTD fee totals (`statement.issued`) | With the statement for the period |
  | Member queries balance via automated system (`balance.inquiry_received`) | Available balance excluding overdraft funds (`account.balances.balance`), Reg E opt-in flag (`entity.reg_e_opt_in`) | Balance disclosed excluding discretionary overdraft coverage (`balance.disclosed`) | Real time |
  | ATM/one-time-debit overdraft fee about to post (`fee.overdraft.pending`) | Reg E opt-in flag (`entity.reg_e_opt_in`), originating authorization (`card_authorization.id`) | Fee posted only if opted in; otherwise suppressed (`fee.overdraft.posted` or `fee.overdraft.suppressed`) | At fee assessment |

- **ALERTS/METRICS:** Alert on any overdraft fee posted to a non-opted-in member for ATM/one-time-debit transactions (target zero). Metrics: statement-level validation pass rate for §1030.11 fee-total formatting; count of automated-balance responses that included overdraft funds without labeling (target zero).

## TS-09 — Recordkeeping {#ts-09-recordkeeping}

- **WHY (Reg cite):** Regulation DD [§1030.9](https://www.ecfr.gov/current/title-12/part-1030/section-1030.9)(c) requires institutions to retain evidence of compliance with the regulation for a minimum of two years after the date disclosures are required to be made or action is required to be taken.
- **SYSTEM BEHAVIOR:** Every disclosure delivery, change-in-terms notice, maturity notice, statement, advertising approval, and interest-calculation record produced under this policy is retained for at least two years from the date the disclosure or action was required, with rate sheets and calculation documentation sufficient to reconstruct any disclosed APY. The retention schedule itself, and any longer retention periods that apply, are governed by the Record Retention Policy; this control asserts only the Reg DD two-year floor. Retained compliance records are read-only after creation; deletion before the retention floor requires CCO approval and is logged.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Any Reg DD artifact is produced (`disclosure.account_opening.delivered`, `disclosure.change_in_terms.sent`, `disclosure.maturity_notice.sent`, `statement.issued`, `advertising.review_completed`) | Artifact content and delivery proof (`disclosure.artifact_id`, `disclosure.delivered_at`) | Immutable retention record with 2-year-minimum hold (`records.retention_applied`) | At artifact creation; held ≥ 2 years (enforced by `records.retention_expiry_at`) |

- **ALERTS/METRICS:** Alert on any deletion attempt against a record inside its retention floor (target zero unauthorized). Metric: quarterly sample audit of artifact retrievability — percentage of sampled disclosures retrievable with delivery proof (target 100%).

## TS-10 — Training, Monitoring, and Escalation {#ts-10-training-monitoring-and-escalation}

- **WHY (Reg cite):** Regulation DD ([12 CFR Part 1030](https://www.ecfr.gov/current/title-12/part-1030)) compliance is examiner-tested through institution-level compliance-management expectations, and deceptive disclosure practices are independently actionable as UDAAPs under the California Consumer Financial Protection Law ([Cal. Fin. Code §90003](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=FIN&sectionNum=90003.)); training and monitoring are the institutional controls that keep [TS-01](#ts-01-disclosure-standards) through [TS-09](#ts-09-recordkeeping) effective.
- **SYSTEM BEHAVIOR:** All front-line staff who open accounts, quote rates, prepare disclosures, or create advertising complete annual Truth in Savings training, tracked to completion. Compliance performs scheduled monitoring — quarterly sampling of new-account disclosures, change-in-terms and maturity notices, statements, and published advertising, plus periodic recalculation testing of APY/APYE figures — and an independent periodic audit covers the program. Any disclosure error found through monitoring, audit, member complaint, or self-report is logged, escalated to the CCO within two business days, root-caused, and remediated, including corrected disclosures and member restitution where fees or interest were misstated. The training roster and monitoring findings log are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual training cycle opens (`training.cycle_opened`) | In-scope staff roster (`training.roster[]`), TIS curriculum version (`training.curriculum_version`) | Completion records per employee (`training.completed`) | Within the annual cycle (internal: 100% by cycle close; enforced by `training.completion_due_at`) |
  | Quarterly monitoring sample drawn (`monitoring.sample_drawn`) | Sampled artifacts (`disclosure.artifact_id[]`, `advertising.asset_id[]`), product terms for recalculation (`product.apy`, `product.interest_rate`) | Monitoring findings report to CCO (`monitoring.findings_reported`) | Quarterly (internal: report within 15 BD of quarter close) |
  | Disclosure error detected from any source (`disclosure.error_detected`) | Error description (`disclosure.error_description`), affected members (`account.id[]`), root cause (`disclosure.error_root_cause`) | Escalation to CCO + remediation plan incl. corrected disclosures/restitution (`disclosure.error_remediated`) | Escalation within 2 business days (internal; enforced by `disclosure.error_escalation_due_at`) |

- **ALERTS/METRICS:** Alert on training completion below 95% at 30 days before cycle close; alert on any error open beyond its remediation plan date. Metrics: annual training completion rate (target 100%); monitoring exception rate by control; mean time from error detection to remediation.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, all disclosure and advertising approvals, change-in-terms classifications, and error escalations.
- **Approvers:** Patrick Wilson, Chief Compliance Officer, with Board of Directors ratification at adoption and at each material revision.
- **Required participants:** Deposit operations (interest configuration, statement and notice production, scheduler maintenance), marketing (advertising submission), and front-line staff (account-opening disclosure delivery).
- **Review cadence:** Full policy review at least annually (next review per front-matter), and immediately upon any amendment to Regulation DD, the Reg E overdraft rules, or applicable California requirements.
- **Cross-references:** Record Retention Policy (retention schedule behind [TS-09](#ts-09-recordkeeping)); Compliance Policy (UDAAP framework, advertising-review process, Reg E opt-in governance); Electronic Payment Systems Policy (Reg E §1005.17 opt-in mechanics); E-Commerce Policy and Privacy Policy (E-SIGN consent and electronic-delivery mechanics); BSA Policy (account-opening identity verification and CIP); Member Policy (general member account servicing).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The events, fields, and timers referenced in the EVENTS tables throughout this document (e.g., `disclosure.account_opening.delivered`, `statement.cycle_closed`, `account.maturity_window.opened`, `advertising.review_requested`, `interest.credited`, `training.completed`, and all `*_due_at` timers) are not yet registered in `vocabulary.json` — the parsed spec is banking-core only with zero events defined and contains no disclosure, statement, certificate-maturity, advertising, fee-type, training, or interest-engine resources. Names used are the target naming scheme and must be confirmed and registered by engineering before the next review.
- **Certificate products assumed.** The current vocabulary's `account.account_type` enum covers only checking, savings, and money_market — no time/certificate account type exists. [TS-04](#ts-04-maturity-and-renewal-notices) assumes Pynthia offers (or will offer) share certificates; if certificates are not offered, TS-04 remains dormant but stays in the policy for product-launch readiness.
- **Statement accounts assumed.** Reg DD periodic-statement content rules apply only where statements are provided; this policy assumes all share draft and statement-savings accounts receive periodic statements. Confirm whether any products are passbook or non-statement accounts.
- **Discretionary overdraft program status unconfirmed.** PATRICK_NOTES require §1030.11 coordination, so [TS-08](#ts-08-overdraft-service-disclosures) is written as fully operative; confirm whether Pynthia currently promotes a discretionary overdraft service, which determines whether the §1030.11(b) advertising disclosures are actively triggered.
- **California applicability assumed.** AUTHORITY_HINTS reference the California Financial Code (§851 et seq.) and CCFPL/DFPI examination, implying a California state charter or California operations; confirm the charter type and whether DFPI examines Pynthia, which affects the state-law citations in [TS-07](#ts-07-advertising-review) and [TS-10](#ts-10-training-monitoring-and-escalation). The parallel California deposit-disclosure provisions (Fin. Code §851 et seq.) are not separately operationalized pending that confirmation.
- **Internal SLAs are management choices.** The internal SLAs in parentheses (5 BD remote-disclosure mailing, 35-day change-in-terms mailing, 5 BD ad-review turnaround, 2 BD error escalation, 15 BD monitoring report) are proposed defaults where PATRICK_NOTES were silent; the CCO should confirm or adjust them at first review.
- **Single-approver governance.** Only the CCO is listed as approver; Board adoption is asserted in Governance & Sign-Off following the reference policy's board-adoption language, but the Board's formal role should be confirmed in the governance calendar.
- **E-SIGN dependency.** Electronic delivery in [TS-02](#ts-02-pre-opening-account-disclosures) presumes a working E-SIGN consent capture governed by the E-Commerce Policy; the `entity.esign_consent` flag does not exist in the current vocabulary and must be sourced or built.
