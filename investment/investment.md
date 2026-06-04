---
title: Investment Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Investment, Part 703, ALM, Liquidity, Credit Risk, Treasury]
---

# Investment Policy

## General Policy Statement

Pynthia Credit Union invests surplus funds and places non-loan assets to protect safety and soundness, maintain adequate liquidity, and earn a reasonable risk-adjusted yield while complying with the Federal Credit Union Act and [NCUA 12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703). This policy covers all investments, repurchase and reverse repurchase agreements, deposits, and other non-loan asset placements held on the balance sheet, whether executed directly or through third parties. Every covered position is tagged to this policy, traded only within board-approved authority and instrument limits, supported by documented pre-purchase credit analysis and valuation, safeguarded by segregation of duties and approved-intermediary controls, and monitored continuously for credit, interest-rate, liquidity, and concentration risk. Derivative authority under Part 703 Subpart B and retail nondeposit investment product sales are out of scope and require separate policies.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Policy review reminder | Next-review date approaching (`policy.review_due_soon`) | 60 and 30 days before `next_review` | Warning to CCO and board secretary | [IN-01](#in-01-policy-record-scope-and-covered-instruments) |
| Board re-approval of policy and authority matrix | Prior board approval recorded (`policy.board_approved`) | ≤ 12 months from prior approval | Board minutes + approved policy version | [IN-02](#in-02-governance-board-oversight-and-delegations) |
| Trade exception approval | Exception raised at trade entry (`trade.exception_raised`) | Before settlement | Documented exception with authorized approver | [IN-02](#in-02-governance-board-oversight-and-delegations) |
| Permissible-instruments list review | Annual cycle or material Part 703 change (`instrument_list.review_due`) | At least annually | Updated allow-list mapped to Part 703 categories | [IN-03](#in-03-permissible-investments-and-prohibited-activities) |
| ALCO IRR simulation | Quarterly cycle or threshold breach (`alm.irr_simulation_due`) | At least quarterly | IRR simulation results to ALCO | [IN-04](#in-04-interest-rate-risk-and-alm-integration) |
| Pre-purchase credit file | Eligible non-government trade entered (`trade.entered`) | Before booking | Completed credit file + approval | [IN-05](#in-05-credit-risk-standards-and-downgrade-management) |
| Annual credit re-analysis | Anniversary of credit file (`credit_file.reanalysis_due`) | At least annually | Documented re-analysis | [IN-05](#in-05-credit-risk-standards-and-downgrade-management) |
| Downgrade review | Downgrade below internal investment-grade threshold (`security.downgraded`) | 5 business days | Downgrade review; board notification if material | [IN-05](#in-05-credit-risk-standards-and-downgrade-management) |
| Liquidity capacity report | Monthly cycle, or stress declared (`liquidity.report_due`) | At least monthly | On-demand and 30-day stress liquidity report | [IN-06](#in-06-liquidity-and-marketability-limits) |
| Concentration-limit review | Annual cycle (`limit_set.review_due`) | At least annually | Re-approved limit parameters | [IN-07](#in-07-concentration-and-counterparty-limits) |
| Intermediary due-diligence review | Anniversary of approval (`intermediary.review_due`) | Annually | Refreshed due-diligence file | [IN-08](#in-08-approved-brokers-dealers-and-safekeepers) |
| Safekeeping reconciliation | Month-end statement received (`safekeeping.statement_received`) | Monthly | Reconciliation per §703.9(c) | [IN-08](#in-08-approved-brokers-dealers-and-safekeepers) |
| Repo collateral mark-to-market | Weekly cycle; daily in stress (`repo.collateral_revaluation_due`) | Weekly (daily in stress) | Updated collateral values; margin call on shortfall | [IN-09](#in-09-repurchase-and-reverse-repurchase-agreements) |
| Fair-value update | Monthly pricing cycle (`security.fair_value_update_due`) | At least monthly | Updated fair values with pricing source and date | [IN-10](#in-10-valuation-accounting-and-fair-value-measurement) |
| Pre-trade checklist | Trade entered for non-exempt instrument (`trade.entered`) | Before booking | Completed checklist linked to credit memo + valuation support | [IN-11](#in-11-pre-purchase-due-diligence-and-exceptions) |
| Management portfolio report | Month-end (`portfolio.report_due`) | Monthly | Composition, duration, liquidity, gain/loss, limit-adherence report | [IN-12](#in-12-ongoing-monitoring-reporting-and-stress-testing) |
| Board portfolio report | Quarter-end (`portfolio.board_report_due`) | At least quarterly | Board investment report | [IN-12](#in-12-ongoing-monitoring-reporting-and-stress-testing) |
| Portfolio stress test | Annual cycle, or metrics approaching limits (`portfolio.stress_test_due`) | At least annually | Documented stress-scenario results | [IN-12](#in-12-ongoing-monitoring-reporting-and-stress-testing) |
| Performance attribution | Quarter-end (`performance.attribution_due`) | Quarterly | Benchmark attribution by segment | [IN-13](#in-13-performance-measurement-and-benchmarks) |
| Trade settlement reconciliation | Trade settles (`trade.settled`) | T+1 | Reconciled trade record | [IN-14](#in-14-trade-execution-controls-and-segregation-of-duties) |
| Document attachment | Trade booked (`trade.booked`) | 2 business days | Indexed trade documentation | [IN-15](#in-15-recordkeeping-and-documentation-retention) |
| Training / COI certification | Hire, role change, or annual cycle (`training.due`) | Before system access; annually thereafter | Completed training + COI certification | [IN-16](#in-16-training-competency-and-conflicts-of-interest) |
| Contingency plan test | Annual cycle (`cfp.investment_test_due`) | At least annually | Documented liquidation-hierarchy test | [IN-17](#in-17-contingency-planning-and-liquidity-stress-events) |
| Stress-event execution plan | Liquidity stress declared (`liquidity.stress_declared`) | 1 business day | Initial execution plan | [IN-17](#in-17-contingency-planning-and-liquidity-stress-events) |
| Policy version re-approval | Material regulatory change or annual cycle (`policy.amendment_proposed`) | At least annually; earlier on material change | New approved version with redline and approval metadata | [IN-18](#in-18-policy-review-amendments-and-version-control) |

## IN-01 — Policy Record, Scope, and Covered Instruments {#in-01-policy-record-scope-and-covered-instruments}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires a federal credit union's board to adopt a written investment policy consistent with the FCU Act and Part 703, addressing purposes, objectives, and risk characteristics; [§703.2](https://www.ecfr.gov/current/title-12/part-703/section-703.2) defines the instruments and activities in scope.

**SYSTEM BEHAVIOR:** The system maintains a single canonical Investment Policy record carrying effective and next-review dates, and every balance-sheet position covered by the policy — investments, repos, deposits, and other non-loan placements — is tagged to it at booking. The system warns the CCO and board secretary 60 and 30 days before the next-review date. If the review date lapses without board re-approval, existing positions remain governed by the prior approved version but the policy record and all tagged positions are flagged non-compliant until re-approval. The policy record and its dates are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New covered position is booked (`position.booked`) | Instrument identifiers (`position.cusip`, `position.instrument_type`), policy reference (`policy.id`) | Position tagged to the canonical policy record (`position.policy_tagged`) | At booking (—) |
| Next-review date approaches (`policy.review_due_soon`) | Policy record dates (`policy.effective_date`, `policy.next_review_date`) | Review warning to CCO and board secretary (`policy.review_warning_issued`) | 60 and 30 days before `next_review` (enforced by `policy.review_warning_at`) |
| Review date passes without board approval (`policy.review_lapsed`) | Policy record (`policy.id`), latest board approval (`policy.board_approved_at`) | Policy record and tagged positions flagged non-compliant (`policy.noncompliance_flagged`) | Same day as lapse (internal: immediate) |

**ALERTS/METRICS:** Count of positions lacking a policy tag (target zero); days-to-next-review dashboard; standing alert while `policy.noncompliance_flagged` is active.

## IN-02 — Governance, Board Oversight, and Delegations {#in-02-governance-board-oversight-and-delegations}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the board to review the investment policy at least annually and to address delegation of authority, including who may make investment decisions and within what limits; [12 USC §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) vests general management direction in the board.

**SYSTEM BEHAVIOR:** The system maintains an authority matrix defining investment decision rights, single-trade limits, and aggregate limits by role (CIO or equivalent, Treasury staff, ALCO/Investment Committee). Every trade and every exception must be linked to an authorized approver whose limits cover the transaction; trades without a valid approver link cannot proceed to settlement. Exceptions must be documented and approved before settlement — an exception approved after settlement is recorded as a violation, not an exception. The board reviews and approves the policy and the authority matrix at least annually, with no more than 12 months between approvals. The authority matrix is write-restricted to Compliance with board-approved changes only.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade is submitted for approval (`trade.approval_requested`) | Trade terms (`trade.amount`, `trade.instrument_type`), approver role and limits (`authority_matrix.role_limits`) | Approval decision linked to trade (`trade.approval_recorded`) | Before settlement (—) |
| Exception is raised at trade entry (`trade.exception_raised`) | Exception rationale (`exception.rationale`), authorized approver (`exception.approver_id`) | Documented, approved exception (`trade.exception_approved`) | Before settlement (internal: same business day) |
| Annual board review convenes (`policy.board_review_started`) | Current policy version (`policy.version`), authority matrix (`authority_matrix.version`) | Board approval with minutes reference (`policy.board_approved`) | ≤ 12 months from prior approval (enforced by `policy.board_approval_due_at`) |

**ALERTS/METRICS:** Count of trades settled without an approver link (target zero); count of post-settlement exception approvals (target zero); days since last board approval with escalation at month 11.

## IN-03 — Permissible Investments and Prohibited Activities {#in-03-permissible-investments-and-prohibited-activities}

**WHY (Reg cite):** [12 CFR §703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13) and [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14) define permissible investment activities and investments for federal credit unions; [§703.15](https://www.ecfr.gov/current/title-12/part-703/section-703.15) and [§703.16](https://www.ecfr.gov/current/title-12/part-703/section-703.16) prohibit specified activities and investments, and [§703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17) prohibits related conflicts of interest.

**SYSTEM BEHAVIOR:** The system enforces an allow-list of instrument types, each mapped to its Part 703 category and citation. Trade entry validates the instrument against the allow-list; bookings of prohibited or non-permitted instruments are hard-blocked, with no override path below board level. The allow-list is reviewed at least annually and whenever Part 703 changes materially, and each review is recorded with the reviewer and outcome. The allow-list is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered for any instrument (`trade.entered`) | Instrument classification (`position.instrument_type`), allow-list mapping (`instrument_list.part703_category`) | Permissibility pass or hard block (`trade.permissibility_checked` / `trade.blocked_prohibited`) | At trade entry, before booking (—) |
| Allow-list review cycle starts (`instrument_list.review_due`) | Current allow-list (`instrument_list.version`), Part 703 change log (`regwatch.part703_changes[]`) | Re-approved or amended allow-list (`instrument_list.review_completed`) | At least annually; promptly on material Part 703 change (enforced by `instrument_list.review_due_at`) |

**ALERTS/METRICS:** Count of blocked prohibited-instrument attempts (reviewed monthly for pattern); allow-list review aging alert at 11 months; target zero prohibited instruments on the balance sheet.

## IN-04 — Interest Rate Risk and ALM Integration {#in-04-interest-rate-risk-and-alm-integration}

**WHY (Reg cite):** [12 CFR §703.12(c)](https://www.ecfr.gov/current/title-12/part-703/section-703.12) requires at least quarterly assessment of how interest-rate changes affect securities; [12 CFR §741.3(b)(5)](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires a written interest-rate-risk management program as a condition of insurability.

**SYSTEM BEHAVIOR:** The system captures effective duration, convexity, and cash-flow vectors for every security at booking and on each revaluation, and feeds those analytics to the ALM models used for enterprise IRR measurement. ALCO runs IRR simulations on the investment portfolio at least quarterly and more frequently whenever IRR thresholds are breached. Simulation assumptions and results are retained with the run. Security-level analytics fields are write-restricted to Treasury with Risk review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security booked or revalued (`position.analytics_update_due`) | Security terms (`position.cusip`, `position.coupon`, `position.maturity_date`), market data (`market.yield_curve`) | Duration, convexity, cash-flow vectors stored (`position.analytics_updated`) | At booking; refreshed with each revaluation (—) |
| Quarterly IRR cycle or threshold breach (`alm.irr_simulation_due`) | Portfolio analytics (`position.effective_duration`, `position.convexity`, `position.cashflow_vector[]`), scenario set (`alm.scenario_set`) | ALCO IRR simulation results (`alm.irr_simulation_completed`) | At least quarterly; more often on breach (enforced by `alm.irr_simulation_due_at`) |

**ALERTS/METRICS:** Count of positions missing duration/convexity analytics (target zero); IRR simulation aging alert at day 80 of the quarter; threshold-breach alerts routed to ALCO chair within 1 business day.

## IN-05 — Credit Risk Standards and Downgrade Management {#in-05-credit-risk-standards-and-downgrade-management}

**WHY (Reg cite):** [12 CFR §703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6) requires conducting and documenting a credit analysis before purchasing an investment (other than one issued or fully guaranteed by the U.S. government or its agencies) and updating it at least annually while the investment is held; NCUA Supervisory Letter [13-CU-05 / LCU 2013-05](https://ncua.gov/files/supervisory-letters/LCU2013-05_SupervisoryLetter.pdf) limits reliance on NRSRO ratings in favor of independent internal analysis.

**SYSTEM BEHAVIOR:** The system requires a completed credit file — independent internal analysis, not ratings alone — and a recorded approval before any eligible non-government investment can be booked; bookings without a linked credit file are blocked. Each held position carries a re-analysis due date, and documented re-analysis must be completed at least annually. When a security is downgraded below the internal investment-grade threshold, a review must be completed within 5 business days, and the board is notified when the position is material under board-set thresholds. U.S. government and fully guaranteed instruments are exempt from the pre-purchase credit-file requirement. Credit files are write-restricted to Risk, with approvals recorded by authorized approvers per [IN-02](#in-02-governance-board-oversight-and-delegations).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Eligible non-government trade entered (`trade.entered`) | Issuer financials and analysis inputs (`credit_file.issuer_analysis`), internal rating (`credit_file.internal_rating`), approver (`credit_file.approver_id`) | Completed credit file + booking approval (`credit_file.approved`) | Before booking (—) |
| Annual re-analysis comes due (`credit_file.reanalysis_due`) | Current credit file (`credit_file.id`), updated issuer data (`credit_file.issuer_analysis`) | Documented re-analysis (`credit_file.reanalysis_completed`) | At least annually (enforced by `credit_file.reanalysis_due_at`) |
| Downgrade below internal threshold (`security.downgraded`) | Position size (`position.book_value`), downgrade detail (`security.rating_change`), materiality threshold (`policy.materiality_threshold`) | Downgrade review; board notification if material (`security.downgrade_reviewed`, `board.notification_sent`) | 5 business days (enforced by `security.downgrade_review_due_at`) |

**ALERTS/METRICS:** Count of bookings blocked for missing credit files; re-analysis aging report (alert at 30 days before due, escalation when overdue); downgrade-review latency distribution with target 100% within 5 business days.

## IN-06 — Liquidity and Marketability Limits {#in-06-liquidity-and-marketability-limits}

**WHY (Reg cite):** [12 CFR §703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12) requires monthly reporting and ongoing monitoring of investments, and [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires liquidity planning in which the investment portfolio serves as a core contingent liquidity source.

**SYSTEM BEHAVIOR:** The system classifies every investment by liquidity bucket, estimated days-to-liquidate, and stress haircut at booking, refreshing the classification on revaluation or market disruption. It computes and reports on-demand liquidity capacity and 30-day stress liquidity capacity at least monthly, and more frequently when a liquidity stress is declared under [IN-17](#in-17-contingency-planning-and-liquidity-stress-events). Liquidity classifications are write-restricted to Treasury with Risk review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Position booked or revalued (`position.liquidity_classification_due`) | Instrument type and market depth (`position.instrument_type`, `market.depth_indicator`), haircut table (`liquidity.haircut_table`) | Liquidity bucket, days-to-liquidate, stress haircut stored (`position.liquidity_classified`) | At booking; refreshed on revaluation (—) |
| Monthly liquidity reporting cycle (`liquidity.report_due`) | Classified positions (`position.liquidity_bucket`, `position.days_to_liquidate`, `position.stress_haircut`) | On-demand and 30-day stress liquidity capacity report (`liquidity.capacity_report_issued`) | Monthly; more frequent under stress (enforced by `liquidity.report_due_at`) |

**ALERTS/METRICS:** Count of unclassified positions (target zero); stress liquidity capacity tracked against board minimums with alerting at 110% of minimum; report timeliness target 100% on schedule.

## IN-07 — Concentration and Counterparty Limits {#in-07-concentration-and-counterparty-limits}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address concentration limits, including how much may be invested with any single obligor or in any given type of investment; the NCUA Examiner's Guide expects concentration risk in the investment portfolio to be measured and controlled.

**SYSTEM BEHAVIOR:** The system maintains parameterized limits by issuer, sector, rating band, product type, and counterparty, each with a soft threshold (warning) and a hard threshold (blocking). Limits are evaluated at trade entry: a trade breaching a soft limit proceeds with a logged warning routed to Risk; a trade breaching a hard limit is blocked and can proceed only as a documented, pre-settlement exception under [IN-02](#in-02-governance-board-oversight-and-delegations). The limit set is reviewed at least annually. Limit parameters are write-restricted to Risk with board-approved changes for hard limits.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered (`trade.entered`) | Trade size (`trade.amount`), current exposures (`exposure.by_issuer`, `exposure.by_sector`, `exposure.by_counterparty`), limit parameters (`limit_set.parameters`) | Limit check result: pass, warning, or block (`trade.limit_checked`, `trade.limit_warning_issued`, `trade.limit_blocked`) | At trade entry, before booking (—) |
| Annual limit review cycle (`limit_set.review_due`) | Current limit set (`limit_set.version`), exposure history (`exposure.history[]`) | Re-approved or amended limit parameters (`limit_set.review_completed`) | At least annually (enforced by `limit_set.review_due_at`) |

**ALERTS/METRICS:** Soft-limit warning volume by issuer/sector (trend reviewed at ALCO); hard-limit block count and exception ratio; limit-set review aging alert at 11 months.

## IN-08 — Approved Brokers, Dealers, and Safekeepers {#in-08-approved-brokers-dealers-and-safekeepers}

**WHY (Reg cite):** [12 CFR §703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8) restricts purchases and sales to broker-dealers meeting specified criteria after documented analysis; [12 CFR §703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9) requires qualified safekeeping arrangements and, under §703.9(c), obtaining and reconciling statements of purchased investments and repo collateral at least monthly.

**SYSTEM BEHAVIOR:** The system maintains an approved-intermediaries list (brokers, dealers, safekeepers) with each entry's due-diligence date, review date, and supporting file. Trade entry validates the counterparty intermediary; trades with unapproved intermediaries are blocked. Due-diligence reviews are performed annually for every listed intermediary, covering financial capacity, regulatory standing (e.g., FINRA actions), and experience. Safekeeping statements are reconciled to internal records monthly per §703.9(c), with breaks investigated and cleared. The approved list is write-restricted to Compliance with board approval for additions.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered naming an intermediary (`trade.entered`) | Intermediary identity (`trade.intermediary_id`), approved list (`intermediary.approved_list`) | Intermediary validation pass or block (`trade.intermediary_validated` / `trade.intermediary_blocked`) | At trade entry, before booking (—) |
| Annual due-diligence anniversary (`intermediary.review_due`) | Intermediary financials and regulatory record (`intermediary.due_diligence_file`) | Refreshed due-diligence review (`intermediary.review_completed`) | Annually (enforced by `intermediary.review_due_at`) |
| Month-end safekeeping statement received (`safekeeping.statement_received`) | Safekeeper statement (`safekeeping.statement`), internal position records (`position.holdings[]`) | Completed reconciliation with any breaks logged (`safekeeping.reconciliation_completed`) | Monthly per §703.9(c) (internal: 10 BD after statement; enforced by `safekeeping.reconciliation_due_at`) |

**ALERTS/METRICS:** Count of trades blocked for unapproved intermediaries; due-diligence aging alert at 11 months; unreconciled safekeeping breaks aging report with escalation at 30 days.

## IN-09 — Repurchase and Reverse Repurchase Agreements {#in-09-repurchase-and-reverse-repurchase-agreements}

**WHY (Reg cite):** [12 CFR §703.13(c)–(d)](https://www.ecfr.gov/current/title-12/part-703/section-703.13) governs repurchase and reverse repurchase transactions, including the requirements that purchased securities be permissible investments, that the credit union receive daily assessments of their market value, and that adequate margin be maintained; NCUA repurchase guidance ([IRPS 1985-2](https://ncua.gov/files/publications/irps/IRPS1985-02.pdf)) sets safe-and-sound collateral, haircut, and maturity-mismatch practices, including the 30-day baseline mismatch limit.

**SYSTEM BEHAVIOR:** Every repo and reverse repo is represented with explicit collateral, haircut, counterparty, and maturity-mismatch fields; bookings that violate internal or regulatory mismatch and collateral rules are blocked at entry. Collateral is marked to market at least weekly, and daily when a stress is declared under [IN-17](#in-17-contingency-planning-and-liquidity-stress-events); the system issues margin calls automatically when collateral value falls below required margin. Repo counterparties must also clear the approved-intermediaries check in [IN-08](#in-08-approved-brokers-dealers-and-safekeepers). Repo terms are write-restricted to Treasury with dual entry verification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Repo or reverse repo entered (`repo.entered`) | Collateral detail (`repo.collateral_cusip`, `repo.haircut`), counterparty (`repo.counterparty_id`), maturity terms (`repo.maturity_mismatch_days`) | Validated booking or block (`repo.booked` / `repo.blocked_rule_violation`) | At entry, before booking (—) |
| Collateral revaluation cycle (`repo.collateral_revaluation_due`) | Market prices (`market.collateral_prices`), required margin (`repo.required_margin`) | Updated collateral values (`repo.collateral_marked`) | Weekly; daily in stress (enforced by `repo.collateral_revaluation_due_at`) |
| Collateral shortfall detected (`repo.margin_shortfall_detected`) | Shortfall amount (`repo.margin_shortfall_amount`), counterparty contacts (`repo.counterparty_id`) | Margin call issued (`repo.margin_call_issued`) | Same business day as detection (internal: by close of business) |

**ALERTS/METRICS:** Count of blocked repo bookings by rule violated; collateral mark staleness alert (any repo unmarked > 7 days, > 1 day in stress); outstanding margin calls aging report with escalation at 2 business days.

## IN-10 — Valuation, Accounting, and Fair-Value Measurement {#in-10-valuation-accounting-and-fair-value-measurement}

**WHY (Reg cite):** [12 CFR §703.11](https://www.ecfr.gov/current/title-12/part-703/section-703.11) requires obtaining the fair value of investments at least monthly and assessing prices from sources independent of the seller for certain securities; [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires records sufficient to demonstrate compliance, including valuation support.

**SYSTEM BEHAVIOR:** The system captures book value, amortized cost, and fair value for every security, with the pricing source and pricing date stored alongside each fair-value observation. Fair values are updated at least monthly from independent pricing sources, and the position record supports other-than-temporary-impairment (OTTI) analysis by retaining valuation history and expected-cash-flow comparisons. Manual pricing overrides are restricted to the CFO or Controller and require dual approval; every override is logged with rationale. Valuation fields are otherwise write-restricted to the automated pricing feed.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly pricing cycle (`security.fair_value_update_due`) | Independent prices (`pricing.source`, `pricing.as_of_date`), position inventory (`position.holdings[]`) | Updated fair values with source and date (`security.fair_value_updated`) | At least monthly per §703.11 (enforced by `security.fair_value_update_due_at`) |
| Impairment indicator detected (`security.impairment_indicator_raised`) | Fair value vs. amortized cost (`position.fair_value`, `position.amortized_cost`), expected cash flows (`position.expected_cashflows[]`) | OTTI analysis with conclusion (`security.otti_analysis_completed`) | Quarter in which the indicator arises (internal: before quarter close) |
| Pricing override requested (`pricing.override_requested`) | Override rationale (`pricing.override_rationale`), two approvers among CFO/Controller (`pricing.override_approvers[]`) | Approved override with dual sign-off (`pricing.override_applied`) | Before the overridden value is used in any report (—) |

**ALERTS/METRICS:** Stale-price report (any position unpriced > 1 month, target zero); pricing-override count per quarter with each override reviewed by Internal Audit; OTTI candidates flagged vs. analyzed (target 100% analyzed by quarter close).

## IN-11 — Pre-Purchase Due Diligence and Exceptions {#in-11-pre-purchase-due-diligence-and-exceptions}

**WHY (Reg cite):** [12 CFR §703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6) requires documented pre-purchase credit analysis for non-exempt investments, and [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires records demonstrating that each investment decision was prudent and authorized.

**SYSTEM BEHAVIOR:** The system enforces a pre-trade checklist and approval workflow: before booking, each trade must be linked to its credit memo (per [IN-05](#in-05-credit-risk-standards-and-downgrade-management)) and valuation support, except for U.S. government or fully insured/guaranteed instruments, which bypass the credit-memo step but still require checklist completion. Trades exceeding board-set thresholds that proceed on incomplete documentation are recorded in a board-visible exception log and require pre-settlement exception approval under [IN-02](#in-02-governance-board-oversight-and-delegations). Checklist templates are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered for non-exempt instrument (`trade.entered`) | Credit memo link (`credit_file.id`), valuation support (`trade.valuation_support`), checklist items (`trade.pretrade_checklist`) | Completed checklist gating the booking (`trade.checklist_completed`) | Before booking (—) |
| Checklist exception over board threshold (`trade.checklist_exception_raised`) | Exception detail (`exception.rationale`), threshold parameters (`policy.exception_threshold`) | Entry in board exception log (`trade.exception_logged`) | Before settlement; reported at next board meeting (—) |

**ALERTS/METRICS:** Checklist completion rate at booking (target 100%); exception-log volume trended quarterly to the board; count of trades booked with missing valuation support (target zero).

## IN-12 — Ongoing Monitoring, Reporting, and Stress Testing {#in-12-ongoing-monitoring-reporting-and-stress-testing}

**WHY (Reg cite):** [12 CFR §703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12) requires at least monthly reports to the board (or investment-related committee) of investment purchases, sales, and holdings, and at least quarterly evaluation of fair value and risk; the NCUA Examiner's Guide expects stress testing of portfolio risk consistent with complexity.

**SYSTEM BEHAVIOR:** The system generates recurring portfolio reports covering composition, duration, liquidity, realized/unrealized gain and loss, and limit adherence — monthly to management and ALCO, and at least quarterly to the board (with monthly purchase/sale/holdings detail available to the board per §703.12). Portfolio stress scenarios are run at least annually and more frequently as any monitored metric approaches its limit. Report generation is automated; report parameters are write-restricted to Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Month-end management cycle (`portfolio.report_due`) | Position data (`position.holdings[]`), analytics (`position.effective_duration`, `position.liquidity_bucket`), limit results (`trade.limit_checked` history) | Management/ALCO portfolio report (`portfolio.management_report_issued`) | Monthly (internal: 10 BD after month-end; enforced by `portfolio.report_due_at`) |
| Quarter-end board cycle (`portfolio.board_report_due`) | Monthly report series (`portfolio.management_report_issued` history), gain/loss summary (`portfolio.gain_loss_summary`) | Board investment report (`portfolio.board_report_issued`) | At least quarterly (enforced by `portfolio.board_report_due_at`) |
| Stress-test cycle or metric approaching limit (`portfolio.stress_test_due`) | Scenario definitions (`stress.scenario_set`), position analytics (`position.cashflow_vector[]`, `position.stress_haircut`) | Documented stress results to ALCO and board (`portfolio.stress_test_completed`) | At least annually; more often near limits (enforced by `portfolio.stress_test_due_at`) |

**ALERTS/METRICS:** Report delivery timeliness (target 100% on schedule); limit-adherence exceptions surfaced per report; stress-test aging alert at 11 months and automatic re-trigger when any metric crosses 90% of its limit.

## IN-13 — Performance Measurement and Benchmarks {#in-13-performance-measurement-and-benchmarks}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the policy to state how investments relate to the credit union's objectives and risk tolerance; the NCUA Examiner's Guide expects performance to be measured in a way that does not encourage imprudent risk-taking.

**SYSTEM BEHAVIOR:** The system attributes portfolio return and income to assigned benchmarks by portfolio segment quarterly, separating yield, price, and allocation effects. Performance targets and any incentive metrics referencing portfolio performance are reviewed by Risk to confirm they do not incentivize breaching the risk limits in [IN-04](#in-04-interest-rate-risk-and-alm-integration), [IN-06](#in-06-liquidity-and-marketability-limits), and [IN-07](#in-07-concentration-and-counterparty-limits). Benchmark assignments are write-restricted to Treasury with ALCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end attribution cycle (`performance.attribution_due`) | Segment returns (`portfolio.segment_returns[]`), benchmark series (`benchmark.series[]`) | Benchmark attribution report by segment (`performance.attribution_completed`) | Quarterly (enforced by `performance.attribution_due_at`) |
| Performance target proposed or changed (`performance.target_change_proposed`) | Proposed targets (`performance.targets`), current risk limits (`limit_set.parameters`) | Risk sign-off confirming no limit-breach incentive (`performance.target_risk_reviewed`) | Before the target takes effect (—) |

**ALERTS/METRICS:** Attribution report timeliness (target 100% within 30 days of quarter-end); count of performance targets active without Risk sign-off (target zero).

## IN-14 — Trade Execution, Controls, and Segregation of Duties {#in-14-trade-execution-controls-and-segregation-of-duties}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the policy to address how the credit union manages its investment program, and the NCUA Examiner's Guide expects segregation of duties among trade initiation, approval, settlement, and recordkeeping as a core internal control; [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires records evidencing each step.

**SYSTEM BEHAVIOR:** The system segregates trade initiation, approval, confirmation, settlement, and accounting into distinct role-bound steps and enforces dual control: no single user may perform more than one conflicting step on the same transaction, and the system blocks any user from controlling a full transaction lifecycle. Trade confirmations from intermediaries are matched against internal tickets, and every settled trade is reconciled to ledger and safekeeping records within T+1. Role assignments are write-restricted to Compliance with quarterly access review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade lifecycle step attempted (`trade.step_attempted`) | Acting user and role (`user.id`, `user.role`), prior step actors (`trade.step_history[]`) | Step permitted or blocked for SoD conflict (`trade.step_recorded` / `trade.sod_blocked`) | At each step, in real time (—) |
| Intermediary confirmation received (`trade.confirmation_received`) | Confirmation terms (`confirmation.terms`), internal ticket (`trade.ticket`) | Matched confirmation or discrepancy flag (`trade.confirmation_matched` / `trade.confirmation_discrepancy_flagged`) | Same business day as receipt (internal: by close of business) |
| Trade settles (`trade.settled`) | Settlement detail (`trade.settlement_amount`, `trade.settlement_date`), ledger and safekeeping records (`ledger.entries[]`, `safekeeping.holdings[]`) | Reconciled trade record (`trade.reconciliation_completed`) | T+1 (enforced by `trade.reconciliation_due_at`) |

**ALERTS/METRICS:** SoD-block count (each investigated); unmatched confirmations aging (escalation at 2 business days); T+1 reconciliation completion rate (target 100%).

## IN-15 — Recordkeeping and Documentation Retention {#in-15-recordkeeping-and-documentation-retention}

**WHY (Reg cite):** [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires maintaining documentation of each investment transaction for as long as the investment is held (and analyses/reports as long as relevant), sufficient for examiners to evaluate compliance.

**SYSTEM BEHAVIOR:** The system stores and indexes trade tickets, confirmations, credit memos, approvals, safekeeping statements, and portfolio reports against the related trade or position, each carrying a retention schedule consistent with §703.4 and the enterprise Record Retention Policy. Required documents must be attached to the trade record within 2 business days of booking; trades with missing documents past the window are flagged on the management report. Document deletion before retention expiry is blocked; index metadata is write-restricted to Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade booked (`trade.booked`) | Required document set for the instrument type (`document.required_set`), uploaded artifacts (`document.files[]`) | Indexed documents linked to the trade (`document.attached`) | 2 business days (enforced by `document.attachment_due_at`) |
| Retention schedule reached (`document.retention_expired`) | Retention rule (`document.retention_schedule`), legal-hold status (`document.legal_hold_flag`) | Disposition action recorded (`document.disposition_recorded`) | Per retention schedule; never before hold release (—) |

**ALERTS/METRICS:** Trades with incomplete documentation past 2 BD (target zero, surfaced on monthly management report); retention-rule coverage of stored documents (target 100%).

## IN-16 — Training, Competency, and Conflicts of Interest {#in-16-training-competency-and-conflicts-of-interest}

**WHY (Reg cite):** [12 CFR §703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17) prohibits officials and employees involved in investment decisions from receiving anything of value in connection with the credit union's investment transactions, requiring conflict-of-interest discipline; [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) expects investment personnel to operate within defined, board-approved competence.

**SYSTEM BEHAVIOR:** The system tracks required investment training and annual conflict-of-interest certifications for covered staff and board members. Investment-system access is granted only after required training is complete, and access is automatically suspended when training or COI certification lapses past its due date; suspended access is restored only on completion. Training and certification records are write-restricted to Compliance/HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered person hired or role changed (`training.assignment_created`) | Role-based curriculum (`training.required_curriculum`), person record (`user.id`) | Training completion gating system access (`training.completed`, `access.granted`) | Before system access (—) |
| Annual training/COI cycle (`training.due`) | Outstanding requirements (`training.outstanding_items[]`, `coi.certification_due`) | Completed training and COI certification (`training.completed`, `coi.certified`) | Annually (enforced by `training.due_at`) |
| Requirement lapses past due date (`training.lapsed`) | Lapsed items (`training.outstanding_items[]`), access roster (`access.roster`) | Automatic access suspension (`access.suspended`) | Same day as lapse (internal: immediate) |

**ALERTS/METRICS:** Training/COI completion rate for covered population (target 100%); count of active users with lapsed requirements (target zero — auto-suspension makes any nonzero value an incident); suspension/restoration log reviewed quarterly.

## IN-17 — Contingency Planning and Liquidity Stress Events {#in-17-contingency-planning-and-liquidity-stress-events}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires liquidity policies and, by asset tier, a Contingency Funding Plan addressing stress events in which investment liquidation is a primary funding source.

**SYSTEM BEHAVIOR:** The system maintains predefined liquidity stress scenarios and an investment-liquidation hierarchy (which positions to sell, in what order, at what expected haircuts) tied to the enterprise Contingency Funding Plan governed by the Liquidity Policy. The hierarchy and scenarios are tested at least annually. When an actual liquidity stress is declared, an initial execution plan applying the hierarchy must be documented within 1 business day, and the stress declaration tightens the monitoring cadences in [IN-06](#in-06-liquidity-and-marketability-limits) and [IN-09](#in-09-repurchase-and-reverse-repurchase-agreements). The liquidation hierarchy is write-restricted to Treasury with ALCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual contingency test cycle (`cfp.investment_test_due`) | Stress scenarios (`stress.scenario_set`), liquidation hierarchy (`cfp.liquidation_hierarchy`) | Documented test results (`cfp.investment_test_completed`) | At least annually (enforced by `cfp.investment_test_due_at`) |
| Liquidity stress declared (`liquidity.stress_declared`) | Liquidation hierarchy (`cfp.liquidation_hierarchy`), current liquidity classifications (`position.liquidity_bucket`, `position.stress_haircut`) | Initial execution plan documented (`cfp.execution_plan_documented`) | 1 business day (enforced by `cfp.execution_plan_due_at`) |

**ALERTS/METRICS:** Contingency test aging alert at 11 months; in a declared stress, execution-plan latency tracked against the 1-BD deadline; liquidation-hierarchy coverage of the portfolio (target 100% of positions ranked).

## IN-18 — Policy Review, Amendments, and Version Control {#in-18-policy-review-amendments-and-version-control}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the board to review the investment policy at least annually, and [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires records — including superseded policy versions — sufficient to demonstrate the rules in effect for any historical transaction.

**SYSTEM BEHAVIOR:** The system maintains full version history of this policy with redlines between versions and approval metadata (approver, body, date, minutes reference) on each version. Review occurs at least annually and earlier when a material regulatory change is identified; amendments take effect only after recorded approval, and every historical position remains linked to the version in force when it was booked. Version records are write-restricted to Compliance and immutable once approved.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Amendment proposed or material reg change identified (`policy.amendment_proposed`) | Draft changes (`policy.draft_redline`), regulatory trigger if any (`regwatch.part703_changes[]`) | Redlined draft routed for approval (`policy.redline_recorded`) | Before next board review; promptly on material change (—) |
| Amendment approved (`policy.version_approved`) | Approval metadata (`policy.approver_ids[]`, `policy.minutes_reference`) | New immutable policy version with effective date (`policy.version_published`) | On approval; effective date as approved (—) |

**ALERTS/METRICS:** Version-history completeness audit annually (every effective period covered, target 100%); count of amendments effective without approval metadata (target zero).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, the canonical policy record ([IN-01](#in-01-policy-record-scope-and-covered-instruments)), and version control ([IN-18](#in-18-policy-review-amendments-and-version-control)).
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board of Directors approval of the policy and authority matrix is required at least annually per [IN-02](#in-02-governance-board-oversight-and-delegations).
- **Required participants:** Chief Investment Officer (or equivalent), ALCO/Investment Committee, Treasury, Risk, Finance, and the Internal Audit/Supervisory Committee, each in the roles assigned by the authority matrix.
- **Review cadence:** At least annually (not to exceed 12 months between board approvals), and earlier on material regulatory change per [IN-18](#in-18-policy-review-amendments-and-version-control).
- **Cross-references:** Derivatives Policy (Part 703 Subpart B authority — out of scope here); NDIP/Retail Investment Sales Policy; Liquidity Policy (enterprise liquidity program and CFP governance); Capitalization and Basel-II Standardized Approach Framework Policies; Record Retention Policy; Third-Party Risk Policy (broker/custodian vendor management beyond investment due diligence).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The investment-side resources, fields, events, and timers cited throughout the EVENTS tables (e.g., `trade.entered`, `position.booked`, `credit_file.approved`, `repo.collateral_marked`, `safekeeping.reconciliation_completed`) are not registered in `vocabulary.json` — the parsed spec is banking-core only (entities, transfers, cards, BSA) with zero events defined. All codes used here are the target naming scheme and will be confirmed by engineering before the next review.
- **Charter type and Part 703 applicability.** Pynthia is treated as a federal credit union directly subject to 12 CFR Part 703. If Pynthia is state-chartered, the binding authority shifts to state law plus the §741.3 nonconforming-investment reserve requirement, and citations need re-anchoring.
- **Internal investment-grade threshold.** PATRICK_NOTES require downgrade review below "the internal investment-grade threshold" without defining it. This policy assumes a board-approved internal rating scale exists; the threshold and the materiality threshold for board notification need board confirmation.
- **Repo maturity-mismatch limit.** The NCUA 30-day baseline from IRPS 1985-2 is assumed as the regulatory mismatch reference; the internal mismatch limit parameters enforced at booking ([IN-09](#in-09-repurchase-and-reverse-repurchase-agreements)) need ALCO/board confirmation.
- **Quantitative limits not yet parameterized.** Issuer, sector, rating, product, and counterparty limit values ([IN-07](#in-07-concentration-and-counterparty-limits)), liquidity capacity minimums ([IN-06](#in-06-liquidity-and-marketability-limits)), IRR thresholds ([IN-04](#in-04-interest-rate-risk-and-alm-integration)), and board exception thresholds ([IN-11](#in-11-pre-purchase-due-diligence-and-exceptions)) are structural in this policy; the numeric parameters live in the board-approved limit set and authority matrix, which the reference bank policy's diversification table can seed but does not bind.
- **OTTI vs. CECL terminology.** The reference policy and PATRICK_NOTES use "OTTI"; current GAAP (ASU 2016-13/CECL) replaces OTTI for most debt securities with the allowance approach. [IN-10](#in-10-valuation-accounting-and-fair-value-measurement) retains the OTTI label per PATRICK_NOTES; Finance should confirm the accounting framework actually applied.
- **Stress-declaration authority.** [IN-17](#in-17-contingency-planning-and-liquidity-stress-events) assumes the authority to declare a liquidity stress event sits with the CFP governance defined in the Liquidity Policy; the declaring role needs confirmation there.
- **Reference policy is a bank document.** The Sound Community Bank reference policy was used only for structural ideas (reporting content, dealer due-diligence factors, safekeeping practice); its bank-specific limits, Tier 1 capital references, and FDIC/OCC framing were not carried over, since Pynthia's binding framework is the FCU Act and Part 703.
- **Single-approver governance.** The CCO is currently the sole listed approver in front-matter. Board approval is regulatorily required for the investment policy (§703.3); the approvals block should be expanded to record the board (and any committee) once the approval workflow is confirmed.
