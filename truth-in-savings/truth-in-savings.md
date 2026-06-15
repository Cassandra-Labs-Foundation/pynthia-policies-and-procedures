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

## General Policy Statement

Pynthia Credit Union provides deposit-account disclosures that are accurate, clear, and conspicuous; advertises deposit accounts truthfully; and discloses overdraft-program terms in compliance with the Truth in Savings Act and Regulation DD (12 CFR Part 1030), across all delivery channels (paper, electronic, and in-person) and to all consumer deposit products. Because an inaccurate or late rate, yield, fee, or "free" claim is both a Reg DD violation and a UDAAP exposure, the Chief Compliance Officer owns disclosure content, timing, and review, and approves all disclosure and advertising changes, supported by deposit operations, marketing, and front-line staff.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Account opened in person | Consumer opens account (`account.created`) | Before account opened / service provided | APY, rate, compounding, minimums, fees, transaction limits | [TIS-02](#tis-02-pre-opening-account-disclosures) |
| Account opened, consumer not present | Account created remotely (`account.created`) | Within 10 business days | Same account-opening content | [TIS-02](#tis-02-pre-opening-account-disclosures) |
| Adverse term change | Change reducing APY / adversely affecting consumer approved (`disclosure.change_in_terms.approved`) | At least 30 calendar days before effective date | Change description + effective date | [TIS-03](#tis-03-change-in-terms-disclosures) |
| Rollover CD nearing maturity | Maturity window opens (`account.maturity_window.opened`) | Term-keyed advance notice before maturity | Renewal terms / non-renewal notice | [TIS-04](#tis-04-maturity-notices) |
| Statement cycle closes | Statement cycle closed (`statement.cycle_closed`) | Per statement cycle | APY earned, interest, fees, days in period, OD/returned-item totals | [TIS-05](#tis-05-periodic-statement-disclosures) |
| Advertising published | Ad submitted for pre-publication review (`advertising.review_requested`) | Before publication | "Free"/"no cost" rules + required additional terms | [TIS-07](#tis-07-advertising-review) |
| Disclosure error found | Error detected (`disclosure.error_detected`) | Escalate per internal SLA | Error description, root cause, remediation | [TIS-10](#tis-10-training-and-monitoring) |

## TIS-01 — Disclosure Standards  {#tis-01-disclosure-standards}

**WHY (Reg cite):** Regulation DD requires deposit disclosures to be clear, conspicuous, in a form the consumer can keep, and to reflect the terms of the legal deposit contract ([12 CFR §1030.3](https://www.ecfr.gov/current/title-12/part-1030#p-1030.3); content per [§1030.4](https://www.ecfr.gov/current/title-12/part-1030#p-1030.4)). Inaccurate disclosures also create UDAAP exposure under the CCFPL.

**SYSTEM BEHAVIOR:** Each consumer deposit product carries a versioned disclosure template that binds the product's stated APY, interest rate, balance method, and contract version, and that renders to the consumer's chosen delivery channel (paper, electronic with E-SIGN consent captured on the entity record, or in-person). The system blocks delivery of a disclosure whose template version does not match the active product contract version, forcing a re-publish through the approval workflow. Counter-copy and per-channel renderings draw from one source template so paper and electronic content cannot diverge. Disclosure templates and the publish/retire workflow are write-restricted to Compliance; deposit operations and marketing have read-only access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compliance publishes or revises a product disclosure template (`disclosure.template_published`) | Template body (`disclosure.template_id`), product APY/rate/balance method (`product.apy`, `product.interest_rate`, `product.balance_method`), contract version (`product.contract_version`), delivery channel (`member.delivery_channel`) | Approved, versioned disclosure template (`disclosure.template_published`) | No regulatory deadline (internal: publish before product launch) |
| A retired template is removed from active use (`disclosure.recorded`) | Retirement reason (`disclosure.retirement_reason`), archived flag (`disclosure.template_archived`) | Archived template record (`disclosure.recorded`) | No regulatory deadline (internal: same business day) |

**ALERTS/METRICS:** Alert on any delivery attempt where template version ≠ active product contract version (target zero); track count of templates published vs. active products to confirm full coverage.

## TIS-02 — Pre-Opening Account Disclosures  {#tis-02-pre-opening-account-disclosures}

**WHY (Reg cite):** Regulation DD requires account disclosures (APY, interest rate, compounding/crediting, minimum-balance and balance-computation method, fees, and transaction limitations) before an account is opened or a service is provided; if the consumer is not present, the institution must deliver within 10 business days of account opening ([12 CFR §1030.4(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.4)).

**SYSTEM BEHAVIOR:** When an account is created, the system requires that the account-opening disclosure be presented and the delivery logged before the account leaves the opening workflow for an in-person channel; for a not-present channel (`account.opening_channel` indicating remote), it opens a 10-business-day delivery timer and records the delivery event when the disclosure is mailed or e-delivered. Where the consumer elects electronic delivery, the workflow verifies E-SIGN consent on the entity record before counting electronic delivery as compliant — absent consent, the system falls back to paper and the timer continues to run. Delivery records are write-restricted to deposit operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Account opened (`account.created`) | Account type (`account.account_type`), opening channel (`account.opening_channel`), product APY/rate/balance method (`product.apy`, `product.interest_rate`, `product.balance_method`), E-SIGN consent (`entity.esign_consent`), delivery channel (`member.delivery_channel`) | Account-opening disclosure delivered to consumer (`disclosure.account_opening.delivered`) | Before opening (present); 10 business days (not present; enforced by `disclosure.account_opening_due_at`) |

**ALERTS/METRICS:** Aging alert on any not-present account approaching the 10-business-day `disclosure.account_opening_due_at` (escalate at day 7); target zero accounts opened in-person without a logged delivery.

## TIS-03 — Change-in-Terms Disclosures  {#tis-03-change-in-terms-disclosures}

**WHY (Reg cite):** Regulation DD requires advance notice at least 30 calendar days before the effective date of any change that reduces the APY or otherwise adversely affects the consumer, and the notice must include the effective date ([12 CFR §1030.5(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.5)).

**SYSTEM BEHAVIOR:** When a change to a deposit-product term is approved, the system classifies it as adverse or non-adverse based on whether it reduces the APY or otherwise harms the consumer; an adverse classification opens a 30-calendar-day notice timer keyed to the change's effective date and requires the notice to carry that effective date before it can be sent. A change classified non-adverse (`disclosure.change_in_terms.classified_nonadverse`) records its classification basis and requires no 30-day advance notice. The classification decision and the change-in-terms template are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Adverse term change approved (`disclosure.change_in_terms.approved`) | Change description (`disclosure.change_description`), effective date (`disclosure.change_effective_date`), classification basis (`disclosure.classification_basis`) | Change-in-terms notice sent to consumer (`disclosure.change_in_terms.sent`) | ≥30 calendar days before effective date (enforced by `disclosure.change_in_terms_due_at`) |
| Change classified non-adverse (`disclosure.classification_logged`) | Change description (`disclosure.change_description`), classification basis (`disclosure.classification_basis`) | Logged classification record, no advance notice (`disclosure.classification_logged`) | No deadline (internal: log at decision) |

**ALERTS/METRICS:** Alert if an adverse change's effective date is fewer than 30 days out and no notice has been sent (target zero); track adverse-vs-non-adverse classification volumes for trend review.

## TIS-04 — Maturity Notices  {#tis-04-maturity-notices}

**WHY (Reg cite):** Regulation DD requires notices shortly before the maturity of automatically renewable (rollover) accounts and for certain long-term non-renewing accounts, with timing keyed to the account term ([12 CFR §1030.5(b)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.5)).

**SYSTEM BEHAVIOR:** When an account's maturity window opens, the system selects the maturity-notice timing from the account term (longer-term certificates trigger earlier notice) and produces the rollover renewal notice or, for non-renewing long-term accounts, the maturity notice, keyed to `account.maturity_date` and `account.maturity_disposition`. The notice content reflects the renewal terms or the consequences of non-renewal. Maturity-notice templates are write-restricted to Compliance; the maturity calendar is read-only to deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Maturity window opens for a rollover or long-term account (`account.maturity_window.opened`) | Maturity date (`account.maturity_date`), maturity disposition (`account.maturity_disposition`), account type (`account.account_type`) | Maturity / renewal notice delivered (`disclosure.maturity_notice.sent`) | Term-keyed advance window before maturity (enforced by `account.maturity_notice_due_at`) |

**ALERTS/METRICS:** Aging alert on any maturing account approaching `account.maturity_notice_due_at` without a sent notice (target zero); track on-time maturity-notice rate by account term band.

## TIS-05 — Periodic Statement Disclosures  {#tis-05-periodic-statement-disclosures}

**WHY (Reg cite):** Where an institution provides periodic statements, Regulation DD requires the statement to disclose APY earned, interest earned, fees imposed, and the number of days in the period ([12 CFR §1030.6(a)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.6)).

**SYSTEM BEHAVIOR:** At each statement cycle close, the system assembles the required Reg DD content — APY earned, interest credited, fees imposed, and days in the statement period — from the interest-accrual and fee ledgers and renders it onto the periodic statement. A statement cycle cannot be issued unless all four required fields are populated; a missing field routes the cycle to deposit operations for correction before issuance. Statement composition logic is write-restricted to deposit operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Statement cycle closes (`statement.cycle_closed`) | Interest credited (`interest.credited`), accrued balance (`interest.accrued_balance`), fee year/period totals (`fee.ytd_total`), days in period (`statement.days_in_period`), product APY (`product.apy`) | Periodic statement issued with required Reg DD content (`statement.issued`) | Per statement cycle (internal: by cycle-close + 2 business days) |

**ALERTS/METRICS:** Target zero statements issued with a missing required field; monitor statement-issuance latency distribution against the cycle-close SLA.

## TIS-06 — Interest Calculation  {#tis-06-interest-calculation}

**WHY (Reg cite):** Regulation DD requires interest to be paid on the full principal balance each day using a permitted balance-computation method (daily balance or average daily balance), and prescribes APY/APYE computation ([12 CFR §1030.7](https://www.ecfr.gov/current/title-12/part-1030#p-1030.7); Appendix A).

**SYSTEM BEHAVIOR:** The interest engine accrues interest daily on the full principal balance using the product's registered balance method (`product.balance_method` — daily balance or average daily balance) and applies the documented APY/APYE formula and accrual-start rule held with the product configuration. Any change to a product's interest configuration is routed through an approval workflow before it can take effect, so the disclosed APY and the accrual method always match. The interest-configuration change workflow is write-restricted to Compliance; the accrual engine is read-only to deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily accrual run executes (`interest.accrual_run.completed`) | Balance method (`product.balance_method`), product APY (`product.apy`), accrued balance (`interest.accrued_balance`) | Accrued interest posted to account ledger (`interest.accrual_run.completed`) | Daily (enforced by `interest.crediting_due_at`) |
| Interest configuration change requested (`product.interest_config.change_requested`) | Proposed APY/rate (`product.apy`, `product.interest_rate`), balance method (`product.balance_method`) | Approved, updated interest configuration (`product.interest_config.updated`) | No regulatory deadline (internal: effective only after approval) |

**ALERTS/METRICS:** Alert on any accrual run that skips a day or uses a balance method inconsistent with the disclosed APY (target zero); monitor accrual-run completion against the daily timer.

## TIS-07 — Advertising Review  {#tis-07-advertising-review}

**WHY (Reg cite):** Regulation DD prohibits inaccurate or misleading deposit advertising, restricts use of "free"/"no cost," and requires disclosure of additional terms when rates or bonuses are advertised ([12 CFR §1030.8](https://www.ecfr.gov/current/title-12/part-1030#p-1030.8)). Misleading ads also create UDAAP exposure under the CCFPL.

**SYSTEM BEHAVIOR:** Every deposit advertisement across all media (print, online, social) is submitted for pre-publication review; the system blocks publication until Compliance records an approval that confirms the ad is not misleading, that any "free"/"no cost" claim meets the Reg DD conditions, and that required additional terms accompany any advertised rate or bonus. Publication events are logged with the approval reference so each live asset traces to its review. The advertising-approval gate is write-restricted to Compliance; marketing submits and may view status only.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ad submitted for pre-publication review (`advertising.review_requested`) | Creative (`ad.creative`), medium (`advertising.medium`), asset reference (`advertising.asset_id`), advertised rate/bonus terms (`product.apy`, `product.interest_rate`) | Recorded review decision / approval (`advertising.review_completed`) | Before publication (internal: SLA per media lead time) |
| Approved ad published (`advertising.published`) | Approval reference (`advertising.approval_id`), medium (`advertising.medium`) | Publication logged with approval link (`advertising.publication_logged`) | At publication |

**ALERTS/METRICS:** Target zero published deposit ads lacking a linked approval; track review turnaround time and rate of ads returned for required-term corrections.

## TIS-08 — Overdraft Service Disclosures  {#tis-08-overdraft-service-disclosures}

**WHY (Reg cite):** Regulation DD §1030.11 requires aggregate overdraft and returned-item fee totals on periodic statements, governs overdraft-service advertising, and requires balance disclosures through automated systems; this coordinates with the Reg E §1005.17 affirmative opt-in for ATM/one-time debit overdraft fees ([12 CFR §1030.11](https://www.ecfr.gov/current/title-12/part-1030#p-1030.11); [12 CFR §1005.17](https://www.ecfr.gov/current/title-12/part-1005#p-1005.17)).

**SYSTEM BEHAVIOR:** As overdraft and returned-item fees post during a statement cycle, the system accumulates per-period and year-to-date totals and surfaces both aggregates on the periodic statement, and ensures automated balance disclosures reflect the actual available balance consistent with §1030.11. Where a fee depends on an ATM/one-time debit overdraft, the system checks the consumer's Reg E opt-in flag on the entity record before the fee is treated as collectible; the Reg E opt-in capture process itself is out of scope and lives in the Electronic Payment Systems Policy. Overdraft fee schedules and the statement-aggregation logic are write-restricted to Compliance and deposit operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Overdraft or returned-item fee posts (`fee.overdraft.posted`) | Fee amount (`overdraft.fee_assessed`), fee schedule (`overdraft.fee_schedule`), Reg E opt-in flag (`entity.reg_e_opt_in`) | Fee logged and added to period/YTD totals (`overdraft.fee_logged`) | At posting |
| Statement cycle closes (`statement.cycle_closed`) | Period OD/returned-item totals (`fee.ytd_total`), per-period total (`overdraft.occurrence_count`) | Aggregate OD/returned-item fee totals rendered on statement (`statement.issued`) | Per statement cycle (internal: with TIS-05 issuance) |

**ALERTS/METRICS:** Target zero statements missing aggregate OD/returned-item totals; alert on any ATM/one-time-debit overdraft fee posted without a confirmed Reg E opt-in flag.

## TIS-09 — Recordkeeping  {#tis-09-recordkeeping}

**WHY (Reg cite):** Regulation DD requires institutions to retain evidence of compliance for at least two years after disclosures are required to be made or an action is required to be taken ([12 CFR §1030.9(c)](https://www.ecfr.gov/current/title-12/part-1030#p-1030.9)).

**SYSTEM BEHAVIOR:** Each disclosure, advertising approval, maturity notice, change-in-terms notice, and statement produced under this policy is written to the records store with a retention class and a retention anchor date, starting a retention clock of at least two years; the underlying retention schedule and purge mechanics are governed by the Record Retention Policy and are out of scope here. Records under legal hold are exempt from purge until the hold is released. Retention-class assignment and hold flags are write-restricted to Compliance and records management.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| A Reg DD compliance artifact is produced (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_timer`), legal-hold flag (`record.legal_hold_placed`) | Retention clock set on the record (`record.retention_clock_set`) | At creation (clock ≥2 years; enforced by `record.retention_expires_at`) |

**ALERTS/METRICS:** Target zero Reg DD artifacts created without a retention class assigned; alert on any purge attempt against a record still inside its two-year window or under legal hold.

## TIS-10 — Training and Monitoring  {#tis-10-training-and-monitoring}

**WHY (Reg cite):** Reg DD compliance and UDAAP risk management depend on competent staff and ongoing review; annual training, periodic monitoring/audit of disclosures and advertising, and prompt escalation of disclosure errors operationalize the accuracy obligations of [12 CFR §§1030.3–1030.8](https://www.ecfr.gov/current/title-12/part-1030#p-1030.3) and the §1030.9 evidence requirement.

**SYSTEM BEHAVIOR:** The system assigns annual Truth in Savings training to all front-line staff who open accounts, calculate interest, prepare disclosures, or create advertising, and tracks completion against an annual cycle. Compliance draws periodic monitoring samples of opened-account disclosures and published advertising and records findings. When a disclosure error is detected — in monitoring or operationally — the system opens an escalation timer requiring remediation and routes it to Compliance. Training assignments and monitoring samples are write-restricted to Compliance; completion records are read-only to managers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`training.annual_cycle_opened`) | Role curriculum (`training.required_curriculum`), assignee (`training.assignee_id`), content version (`training.content_version`) | Training assigned to in-scope staff (`training.annual_assigned`) | Annually (enforced by `training.annual_due_at`) |
| Compliance completes a monitoring review (`monitoring.review_completed`) | Sample spec (`monitoring.sample_spec`), disclosure/ad artifacts (`disclosure.artifact_id`, `advertising.asset_id`) | Monitoring findings reported (`monitoring.findings_reported`) | Per monitoring cycle (enforced by `monitoring.review_due_at`) |
| Disclosure error detected (`disclosure.error_detected`) | Error description (`disclosure.error_description`), root cause (`disclosure.error_root_cause`) | Remediated error + escalation logged (`disclosure.error_remediated`) | Internal escalation SLA (enforced by `disclosure.error_escalation_due_at`) |

**ALERTS/METRICS:** Track annual training completion rate (target 100% by `training.annual_due_at`); aging alert on any open disclosure-error escalation past its `disclosure.error_escalation_due_at`; monitor monitoring-finding volume and recurrence by root cause.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — owns disclosure content, timing, review, and approval of all disclosure and advertising changes.
- **Required participants:** Deposit operations (account opening, interest calculation, statement issuance), marketing/advertising review, and front-line staff.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual (next review {{2027-07-01}}), or upon a material Regulation DD or CCFPL change.
- **Cross-references:** Reg E opt-in mechanics → Compliance Policy and Electronic Payment Systems Policy; electronic delivery and E-SIGN consent → E-Commerce Policy and Privacy Policy; account-opening identity verification/CIP → BSA Policy; two-year retention schedule → Record Retention Policy; UDAAP examination and advertising-review framework → Compliance Policy; general member account servicing → Member Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the control overlays are deposit-disclosure concepts the parsed core vocabulary covers only partially. The following are coined under the Composition grammar (registered subject + registered verb/task type) and must be confirmed/registered by engineering before the next review: `disclosure.account_opening_due_at` (issuance/review timer for the §1030.4(a) account-opening clock), `disclosure.classification_logged` (non-adverse change-in-terms classification), `product.interest_config.change_requested` / `product.interest_config.updated` (interest-configuration change workflow), `disclosure.template_published` / `disclosure.recorded` (template publish/retire). All other codes used are registered or appear in the provisional-codes list.
- **Charter and state-law applicability.** Pynthia Credit Union is treated as subject to Reg DD/Part 1030 regardless of charter. Whether the California Financial Code (§851 et seq.) parallel deposit-disclosure requirements and DFPI/CCFPL UDAAP examination apply depends on charter type and California operations — to be confirmed; if applicable, TIS-01, TIS-07, and TIS-08 carry an additional state-law overlay.
- **Statement provision is conditional.** TIS-05 assumes Pynthia provides periodic statements for consumer deposit accounts; Reg DD §1030.6 content obligations attach only where statements are provided. If any product is statement-exempt, that product is out of scope for TIS-05.
- **Maturity-notice timing bands.** TIS-04 assumes term-keyed notice windows consistent with §1030.5(b) (e.g., earlier notice for longer-term certificates); the exact day-count bands per term tier are to be confirmed against product terms and encoded in the maturity calendar.
- **Reg E opt-in boundary.** TIS-08 assumes the Reg E §1005.17 opt-in is captured upstream and exposed as `entity.reg_e_opt_in`; the capture process itself is owned by the Electronic Payment Systems Policy. If that flag is not reliably populated, the ATM/one-time-debit fee-collectibility check cannot be enforced.
- **Two-year retention enforcement.** TIS-09 assumes the Record Retention Policy implements the actual purge schedule and legal-hold mechanics; this policy only sets the retention class and ≥2-year clock. The mapping from Reg DD artifact types to retention classes is to be confirmed with records management.
- **Disclosure-error escalation SLA.** The internal time limit on `disclosure.error_escalation_due_at` (TIS-10) is not specified in Patrick's notes; a default escalation SLA must be set by Compliance.
