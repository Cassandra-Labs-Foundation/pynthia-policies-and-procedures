---
title: Truth in Savings Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Truth in Savings, Regulation DD, TISA, Deposit Disclosures]
---

## General Policy Statement

Pynthia Credit Union complies with the Truth in Savings Act and its implementing Regulation DD (12 CFR Part 1030) by disclosing the terms of consumer deposit accounts in a clear and conspicuous form members can keep, governing the advertising of those accounts, paying interest on the full daily balance using a permitted method, and meeting the additional disclosure requirements for overdraft programs. This policy applies to all consumer deposit accounts across all delivery channels — paper, electronic (with E-SIGN consent), and in-person — and to all employees who open accounts, calculate interest, prepare disclosures, or create advertising. Because an inaccurate or late disclosure is both a Reg DD violation and a UDAAP exposure, disclosure content, timing, review, and error escalation are centrally governed by the Chief Compliance Officer.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Consumer opens an account in person | Account created at branch (`account.created`) | Before account opened / service provided | APY, rate, compounding, minimum balance, fees, transaction limits | [TIS-02](#tis-02-pre-opening-account-disclosures) |
| Consumer not present at opening | Account created remotely (`account.created`) | 10 business days | Same account-opening content set | [TIS-02](#tis-02-pre-opening-account-disclosures) |
| Term change reduces APY or adversely affects consumer | Change approved (`disclosure.change_in_terms.approved`) | At least 30 calendar days before effective date | Change description + effective date | [TIS-03](#tis-03-subsequent-change-in-terms-disclosures) |
| Auto-renewable (rollover) CD nears maturity | Maturity window opens (`account.maturity_window.opened`) | Keyed to term (before maturity) | Maturity/renewal terms | [TIS-04](#tis-04-maturity-and-renewal-notices) |
| Overdraft/returned-item fee assessed | Fee posted (`fee.overdraft.posted`) | On the periodic statement (per cycle) | Aggregate overdraft + returned-item fee totals | [TIS-08](#tis-08-overdraft-service-disclosures) |
| Disclosure error discovered | Error detected (`disclosure.error_detected`) | Escalate per internal SLA | Error description + remediation | [TIS-10](#tis-10-training-monitoring-and-error-escalation) |

## TIS-01 — Disclosure Standards (Content, Format, Delivery)

**WHY (Reg cite):** Regulation DD requires deposit-account disclosures to be clear and conspicuous, in writing, in a form the consumer can keep, and to reflect the legal obligation of the deposit contract — including rules for how rates are stated ([12 CFR §1030.3](https://www.ecfr.gov/current/title-12/part-1030#p-1030.3), [§1030.4](https://www.ecfr.gov/current/title-12/part-1030#p-1030.4)). Inaccurate or unclear disclosures are also a UDAAP exposure under the CCFPL.

**SYSTEM BEHAVIOR:** Each consumer deposit product carries a versioned disclosure template that binds APY, interest rate, balance method, and contract version to the product configuration so the disclosed terms always reflect the deposit contract. Templates render to the consumer's elected delivery channel — paper, in-person, or electronic where E-SIGN consent is captured — and the rendered artifact is retained as a keepable copy. When a product's interest configuration or terms change, a new template version is published and the prior version retired so stale terms cannot be delivered. Disclosure templates and their published versions are write-restricted to Compliance; line staff and marketing may render but not author them.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New or revised deposit product approved for launch (`product.terms_updated`) | Product APY (`product.apy`), interest rate (`product.interest_rate`), balance method (`product.balance_method`), contract version (`product.contract_version`) | Published disclosure template tied to product (`disclosure.template_published`) | — (internal: before first delivery) |
| Interest-config change requires disclosure refresh (`product.interest_config.updated`) | Updated rate/APY fields (`product.apy`, `product.interest_rate`), retirement reason (`disclosure.retirement_reason`) | Retired prior template + new version (`disclosure.template_published`) | — (internal: before effective date) |

**ALERTS/METRICS:** Alert on any deposit product in production with no current published disclosure template; target zero products lacking a current template. Track template-version lag (time between an interest-config change and its template publication).

## TIS-02 — Pre-Opening Account Disclosures

**WHY (Reg cite):** Regulation DD requires account-opening disclosures — APY, interest rate, compounding and crediting, minimum-balance requirements, fees, and transaction limitations — to be provided before an account is opened or a service is provided, or mailed/delivered within 10 business days when the consumer is not present ([12 CFR §1030.4(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.4)).

**SYSTEM BEHAVIOR:** When an account is created, the system gates the opening on delivery of the required account-opening disclosure set for in-person and electronic channels, recording the delivery timestamp. When the consumer is not present (e.g., remote/mail opening), the system instead arms a 10-business-day delivery timer keyed to account creation and tracks delivery against it. The opening channel drives which path applies. Delivery records are write-restricted to Compliance and deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Consumer present — account created in branch (`account.created`) | Opening channel (`account.opening_channel`), product disclosure template (`disclosure.template_id`), APY/rate/fees/limits set (`product.apy`, `product.interest_rate`, `product.balance_method`) | Account-opening disclosure delivered (`disclosure.account_opening.delivered`) | Before account opened (enforced by `disclosure.account_opening_due_at`) |
| Consumer not present — remote account created (`account.created`) | Opening channel (`account.opening_channel`), delivery channel + E-SIGN consent (`member.delivery_channel`, `member.esign_consent_captured`) | Account-opening disclosure delivered + due-date task (`disclosure.account_opening.delivered`) | 10 business days (enforced by `disclosure.account_opening_due_at`) |

**ALERTS/METRICS:** Aging alert as the 10-business-day delivery timer approaches breach; target zero `account.created` events without a matching `disclosure.account_opening.delivered`. Track delivered-before-opening rate for in-person openings.

## TIS-03 — Subsequent (Change-in-Terms) Disclosures

**WHY (Reg cite):** Regulation DD requires advance notice at least 30 calendar days before the effective date of any change that reduces the APY or otherwise adversely affects the consumer, and the notice must include the effective date ([12 CFR §1030.5(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.5)).

**SYSTEM BEHAVIOR:** When a term change is proposed, the system classifies whether it reduces APY or otherwise adversely affects the consumer; changes classified as non-adverse require no advance notice and are recorded with the classification basis. For adverse changes, an approval gates the notice and a 30-calendar-day advance-notice timer is armed against the change's effective date, and the notice content must carry the effective date. Change classification and approval are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Adverse term change approved (`disclosure.change_in_terms.approved`) | Change description (`disclosure.change_description`), effective date (`disclosure.change_effective_date`), classification basis (`disclosure.classification_basis`) | Advance change-in-terms notice sent (`disclosure.change_in_terms.sent`) | ≥30 calendar days before effective date (enforced by `disclosure.change_in_terms_due_at`) |
| Change classified as non-adverse (`disclosure.classification_logged`) | Classification basis (`disclosure.classification_basis`), non-adverse flag (`disclosure.change_in_terms.classified_nonadverse`) | Classification record, no notice required (`disclosure.classification_logged`) | — |

**ALERTS/METRICS:** Aging alert when the 30-day advance-notice timer for an approved adverse change is at risk; target zero adverse changes effective with fewer than 30 days' notice. Track ratio of changes classified adverse vs. non-adverse for review-quality monitoring.

## TIS-04 — Maturity and Renewal Notices

**WHY (Reg cite):** Regulation DD requires pre-maturity notices for automatically renewable (rollover) accounts with terms longer than one month, and maturity notices for non-renewable accounts with terms longer than one year ([12 CFR §1030.5(b)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.5)).

**SYSTEM BEHAVIOR:** Each term account carries a maturity date and a renewal disposition. As maturity approaches, the system opens a maturity window and arms a maturity-notice timer whose lead time is keyed to the account term — auto-renewable certificates receive a pre-maturity rollover notice, and long-term non-renewing accounts receive a maturity notice. The notice content reflects the disposition (renew vs. mature) and term. Maturity-disposition configuration is write-restricted to deposit operations under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Maturity window opens for a term account (`account.maturity_window.opened`) | Maturity date (`account.maturity_date`), disposition (`account.maturity_disposition`), account type/term (`account.account_type`) | Maturity/renewal notice sent (`disclosure.maturity_notice.sent`) | Term-keyed lead time before maturity (enforced by `account.maturity_notice_due_at`) |

**ALERTS/METRICS:** Aging alert when a maturity-notice timer is within its lead window but no notice has been sent; target zero matured rollover/long-term accounts without a prior maturity notice. Track notice lead-time distribution against the term-based requirement.

## TIS-05 — Periodic Statement Disclosures

**WHY (Reg cite):** Where a depository institution provides periodic statements, Regulation DD requires those statements to disclose the APY earned, the amount of interest, fees imposed, and the number of days in the period ([12 CFR §1030.6](https://www.ecfr.gov/current/title-12/part-1030#p-1030.6)).

**SYSTEM BEHAVIOR:** When a statement cycle closes for an interest-bearing or fee-bearing consumer account, the statement-generation process assembles the required Reg DD content — APY earned, interest credited for the period, fees imposed, and days in the period — and the rendered statement is issued and retained. Statement content templates are write-restricted to Compliance; the periodic-statement run itself is automated under deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Statement cycle closes for an account (`statement.cycle_closed`) | Days in period (`statement.days_in_period`), interest credited (`interest.credited`), accrued interest (`interest.accrued`), overdraft/returned-item fee totals (`fee.ytd_total`, `overdraft.fee_assessed`) | Periodic statement issued with required Reg DD content (`statement.issued`) | Per statement cycle |

**ALERTS/METRICS:** Alert on any statement issued without a computed APY-earned/days-in-period block; target zero statements missing required Reg DD fields. Track statement-generation success rate per cycle.

## TIS-06 — Interest Calculation

**WHY (Reg cite):** Regulation DD requires institutions to pay interest on the full principal balance in the account each day, permits only the daily-balance or average-daily-balance methods, and requires the APY/APYE formulas and accrual-start rules to be applied as disclosed ([12 CFR §1030.7](https://www.ecfr.gov/current/title-12/part-1030#p-1030.7), [Appendix A](https://www.ecfr.gov/current/title-12/part-1030/appendix-Appendix%20A%20to%20Part%201030)).

**SYSTEM BEHAVIOR:** The interest engine accrues interest on the full principal balance each day using the permitted balance method configured for the product (daily balance or average daily balance), and credits interest on the crediting schedule. The APY/APYE formula and the date interest begins to accrue are documented in the product's interest configuration and must match what is disclosed under [TIS-01](#tis-01-disclosure-standards-content-format-delivery). Interest-configuration changes are write-restricted to Compliance and deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily/periodic accrual run executes (`interest.accrual_run.completed`) | Balance method (`product.balance_method`), full daily balance (`account.balance`), accrued balance (`interest.accrued_balance`) | Accrual posted to account (`interest.accrual_run.completed`) | Each accrual day |
| Crediting date reached (`interest.accrual_run.completed`) | Accrued interest (`interest.accrued`), crediting schedule (`interest.crediting_due_at`) | Interest credited (`interest.credited`) | Per crediting schedule (enforced by `interest.crediting_due_at`) |

**ALERTS/METRICS:** Alert on accounts whose configured balance method is neither daily nor average-daily-balance; target zero. Track accrual-run completeness (accounts accrued ÷ eligible accounts) and any APY-earned-vs-disclosed variance flagged in reconciliation.

## TIS-07 — Advertising Review

**WHY (Reg cite):** Regulation DD prohibits deposit advertisements that are inaccurate or misleading or that misrepresent the deposit contract, restricts use of "free"/"no cost," and requires additional terms when rates or bonuses are advertised ([12 CFR §1030.8](https://www.ecfr.gov/current/title-12/part-1030#p-1030.8)). Misleading deposit advertising is also a UDAAP exposure under the CCFPL.

**SYSTEM BEHAVIOR:** All deposit advertising across every medium — including online and social — is submitted for pre-publication Compliance review before it can be published. The review verifies the ad is not inaccurate or misleading, applies the "free"/"no cost" rules, and confirms required additional terms appear whenever a rate or bonus is advertised. Publication is gated on a recorded approval, and the published asset and its approval are logged. Advertising approval is write-restricted to Compliance; marketing may draft and submit but not self-approve.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Deposit ad submitted for review (`advertising.review_requested`) | Creative/asset (`advertising.asset_id`), medium (`advertising.medium`), advertised rate/bonus terms (`product.apy`, `product.interest_rate`) | Advertising review decision (`advertising.review_completed`) | — (internal: before publication) |
| Approved ad goes live (`advertising.published`) | Approval id (`advertising.approval_id`), asset id (`advertising.asset_id`) | Publication logged with approval link (`advertising.publication_logged`) | — |

**ALERTS/METRICS:** Alert on any `advertising.published` lacking a prior `advertising.review_completed` approval; target zero unreviewed publications. Track review turnaround time and the count of ads rejected for "free"/additional-terms defects.

## TIS-08 — Overdraft Service Disclosures

**WHY (Reg cite):** Regulation DD requires institutions that promote the payment of overdrafts to disclose, on periodic statements, the aggregate dollar amount of overdraft and returned-item fees for the statement period and year-to-date ([12 CFR §1030.11(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.11)), and to coordinate overdraft advertising and automated-system balance disclosures ([§1030.11(b)–(c)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.11)). These disclosures align with the Reg E §1005.17 affirmative opt-in for ATM/one-time debit overdraft fees ([12 CFR §1005.17](https://www.ecfr.gov/current/title-12/part-1005#p-1005.17)).

**SYSTEM BEHAVIOR:** When an overdraft or returned-item fee posts, the system records it and accumulates period and year-to-date fee totals so the periodic-statement run ([TIS-05](#tis-05-periodic-statement-disclosures)) can surface the §1030.11 aggregate fee disclosure. Automated-system balance inquiries disclose the balance consistent with Reg DD, and overdraft advertising is routed through [TIS-07](#tis-07-advertising-review). Where the Reg E §1005.17 opt-in is not on file, ATM/one-time-debit overdraft fees are suppressed; the Reg E opt-in capture process itself is out of scope (see Compliance Policy and Electronic Payment Systems Policy). Fee-schedule configuration is write-restricted to deposit operations under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Overdraft/returned-item fee posts (`fee.overdraft.posted`) | Fee amount (`overdraft.amount`), fee schedule (`overdraft.fee_schedule`), Reg E opt-in flag (`entity.reg_e_opt_in`) | Fee logged + period/YTD totals updated (`overdraft.fee_logged`) | At posting |
| Automated-system balance inquiry received (`balance.inquiry_received`) | Disclosed balance (`balance.disclosed`), in-flight balance (`balances.inflight_balance`) | Balance disclosed via automated system (`balance.inquiry_received`) | Real-time |

**ALERTS/METRICS:** Alert when a statement cycle closes for an account with overdraft activity but no aggregate fee block; target zero. Track count of ATM/one-time-debit overdraft fees assessed without a Reg E opt-in on file (target zero).

## TIS-09 — Recordkeeping

**WHY (Reg cite):** Regulation DD requires institutions to retain evidence of compliance for a minimum of two years after the date disclosures are required to be made or an action is required to be taken ([12 CFR §1030.9(c)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.9)).

**SYSTEM BEHAVIOR:** Each Reg DD compliance artifact — account-opening disclosure, change-in-terms notice, maturity notice, periodic statement, advertising approval — is registered as a retained record with a retention class and a retention anchor (the date the disclosure was required or the action taken), and its retention clock is set to at least two years. The retention schedule that holds these records is maintained under the Record Retention Policy (out of scope here); this control ensures the records are created, classified, and clocked. Retention classification and disposal authorization are write-restricted to records management under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reg DD disclosure or action completed (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`), artifact reference (`record.artifact`) | Retention clock set on the record (`record.retention_clock_set`) | ≥2 years (enforced by `record.retention_expires_at`) |

**ALERTS/METRICS:** Alert on any Reg DD artifact created without a retention class or anchor; target zero unclassified compliance records. Track count of records whose retention expiry is earlier than the two-year minimum (target zero).

## TIS-10 — Training, Monitoring, and Error Escalation

**WHY (Reg cite):** Sound compliance with Regulation DD requires that staff who open accounts, calculate interest, prepare disclosures, or create advertising understand the disclosure, timing, interest-calculation ([12 CFR §1030.7](https://www.ecfr.gov/current/title-12/part-1030#p-1030.7)) and advertising ([§1030.8](https://www.ecfr.gov/current/title-12/part-1030#p-1030.8)) rules, and that disclosure errors are detected, remediated, and escalated to limit Reg DD and UDAAP exposure.

**SYSTEM BEHAVIOR:** Front-line and disclosure/advertising staff are assigned annual Truth in Savings training on an annual cycle, with completion tracked. Compliance conducts periodic internal monitoring and audit of disclosures and advertising by drawing samples. When a disclosure error is detected, the system opens a remediation track and arms an error-escalation timer; remediation and root cause are recorded, and material errors are escalated to the Chief Compliance Officer. Training assignment, monitoring scope, and error disposition are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`training.annual_cycle_opened`) | Assignee (`training.assignee_id`), role curriculum (`training.role_curriculum`), content version (`training.content_version`) | Training assigned, completion tracked (`training.annual_assigned`) | Annual (enforced by `training.annual_due_at`) |
| Monitoring/audit cycle runs (`monitoring.review_completed`) | Sample spec (`monitoring.sample_spec`), scope (`monitoring.scope`) | Monitoring findings reported (`monitoring.findings_reported`) | Periodic (enforced by `monitoring.review_due_at`) |
| Disclosure error discovered (`disclosure.error_detected`) | Error description (`disclosure.error_description`), root cause (`disclosure.error_root_cause`) | Error remediation + escalation logged (`disclosure.error_remediated`) | Internal SLA (enforced by `disclosure.error_escalation_due_at`) |

**ALERTS/METRICS:** Aging alert on open disclosure errors approaching the escalation SLA; target zero overdue errors. Track annual training completion rate (target 100% of in-scope staff) and monitoring-finding remediation aging.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for disclosure content, timing, review, and error escalation across all controls in this policy.
- **Required participants:** Deposit operations (account-opening delivery, periodic statements, interest calculation, maturity notices, overdraft fee accumulation), Marketing / Advertising review (drafting and submission of deposit advertising), and Front-line staff (account opening and disclosure delivery).
- **Approval:** Approved by the Chief Compliance Officer as listed in the front-matter. Disclosure and advertising changes are approved by Compliance per [TIS-01](#tis-01-disclosure-standards-content-format-delivery), [TIS-03](#tis-03-subsequent-change-in-terms-disclosures), and [TIS-07](#tis-07-advertising-review).
- **Review cadence:** Reviewed at least annually (next review per front-matter) or upon a material change to Regulation DD, §1030.11, or Reg E §1005.17.
- **Cross-references:** Reg E ATM/one-time-debit opt-in mechanics — Compliance Policy and Electronic Payment Systems Policy. Electronic delivery / E-SIGN consent — E-Commerce Policy and Privacy Policy. Account-opening identity / CIP — BSA Policy. Two-year Reg DD retention schedule — Record Retention Policy. UDAAP examination framework — Compliance Policy. General member servicing — Member Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several deposit-disclosure fields, events, and timers referenced in the control overlays are not yet registered in `core-vocabulary.json` (the parsed spec is banking-core only). Codes used are the agreed target naming scheme and will be confirmed by engineering before the next review. This bullet collectively covers, among others: `disclosure.classification_basis`, `disclosure.change_in_terms.classified_nonadverse`, `disclosure.retirement_reason`, `disclosure.template_id`, `product.interest_config.updated`, `product.terms_updated`, `statement.days_in_period`, `interest.accrued`, `interest.credited`, `interest.crediting_due_at`, `balance.disclosed`, `balances.inflight_balance`, `advertising.asset_id`, `advertising.approval_id`, `advertising.publication_logged`, `overdraft.fee_logged`, `record.retention_class`, `record.retention_anchor`, `record.retention_clock_set`, and `monitoring.sample_spec`.
- **Charter and state-law applicability.** The scope identifies Pynthia as a credit union; this policy treats Regulation DD (12 CFR Part 1030) as applying regardless of charter. Whether the California Financial Code (§851 et seq.) parallel deposit-disclosure requirements and DFPI/CCFPL UDAAP examination apply to Pynthia's specific charter has not been confirmed and is not separately controlled here; confirm state-chartered status and any state-law overlay before the next review.
- **Maturity-notice lead times by term.** Reg DD §1030.5(b) sets different timing for rollover (>1 month) versus non-renewable (>1 year) accounts; PATRICK_NOTES keys timing to "the account term" without specifying exact lead-time values. The `account.maturity_notice_due_at` timer is assumed to encode the correct per-term lead times; the lead-time table needs confirmation by deposit operations.
- **Periodic-statement applicability.** [TIS-05](#tis-05-periodic-statement-disclosures) applies only where periodic statements are provided. The set of consumer deposit products that do/do not receive periodic statements is assumed to be configured in product data and needs confirmation.
- **Reg E opt-in interface.** [TIS-08](#tis-08-overdraft-service-disclosures) relies on a Reg E §1005.17 opt-in flag (`entity.reg_e_opt_in`) maintained by an out-of-scope process. The contract by which that flag suppresses ATM/one-time-debit overdraft fees needs confirmation with the Electronic Payment Systems owners.
- **Two-year retention enforcement location.** [TIS-09](#tis-09-recordkeeping) sets and clocks retention but defers the schedule to the Record Retention Policy. Confirmation is needed that the Record Retention Policy's schedule honors the Reg DD two-year minimum as the floor for these record classes.
