---
title: Investment Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-11
next_review: 2027-06-11
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Investments, NCUA Part 703, ALM, Liquidity, Credit Risk]
---

## General Policy Statement

Pynthia Credit Union invests surplus funds and places non-loan assets to protect safety and soundness, maintain adequate liquidity, and earn a reasonable risk-adjusted yield, at all times subject to the Federal Credit Union Act and NCUA Part 703. Safety of principal is the primary consideration; every position is limited to instruments permissible under Part 703, held within board-approved authority, concentration, credit, interest-rate, and liquidity limits, and supported by documented pre-trade due diligence, independent valuation, and segregated trade controls. This policy governs all investments, repurchase and reverse repurchase agreements, deposits, and other non-loan asset placements held on the balance sheet, whether executed directly or through third parties. It does not authorize derivative activity under Part 703 Subpart B or retail nondeposit investment product (NDIP) sales, each of which requires a separate board-approved policy.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Investment Policy approaching annual review | Review warning fires 60/30 days before next-review date (`policy.review_warning_issued`) | 12 months between board approvals | Canonical policy record, review warnings | [IN-01](#in-01-policy-objectives-scope-and-covered-instruments) |
| Board re-approves policy and authority matrix | Annual governance cycle opens (`policy.board_review_started`) | At least annually | Board approval of policy and authority matrix | [IN-02](#in-02-governance-board-oversight-and-delegations) |
| Trade entered for a non-permitted instrument | Trade entry permissibility check (`trade.permissibility_checked`) | Blocked at entry (real time) | Part 703 allow-list enforcement | [IN-03](#in-03-permissible-investments-and-prohibited-activities) |
| Quarterly IRR / market depreciation measurement | ALCO IRR cycle (`alm.irr_simulation_completed`) | At least quarterly | IRR simulation; depreciation ≤ 30% Net Worth | [IN-04](#in-04-interest-rate-risk-and-alm-integration) |
| Investment downgraded below internal grade | Downgrade detected (`security.downgraded`) | 5 business days to review | Downgrade review + board notice for material positions | [IN-05](#in-05-credit-risk-standards-and-downgrade-management) |
| Monthly liquidity capacity reporting | Liquidity classification cycle (`position.liquidity_classified`) | At least monthly | On-demand and 30-day stress liquidity capacity | [IN-06](#in-06-liquidity-and-marketability-limits) |
| Trade approaches a concentration limit | Concentration computed at entry (`trade.limit_checked`) | Blocked at entry (hard) / warned (soft) | Issuer, sector, rating, counterparty limits | [IN-07](#in-07-concentration-and-counterparty-limits) |
| Safekeeping statement received | Monthly reconciliation cycle (`safekeeping.statement_received`) | At least monthly | Safekeeping reconciliation per §703.9(c) | [IN-08](#in-08-approved-brokers-dealers-and-safekeepers) |
| Repo collateral falls below required margin | Margin shortfall detected (`repo.margin_shortfall_detected`) | Same day (daily mark; weekly baseline) | Margin call on collateral shortfall | [IN-09](#in-09-repurchase-and-reverse-repurchase-agreements) |
| Quarterly fair-value verification and OTTI review | Fair-value update cycle (`security.fair_value_updated`) | At least quarterly | Fair-value support; security-by-security OTTI | [IN-10](#in-10-valuation-accounting-and-fair-value-measurement) |
| Pre-purchase due diligence before booking | Trade checklist completed (`trade.checklist_completed`) | Before booking (settlement gate) | Pre-trade checklist + credit/valuation support | [IN-11](#in-11-pre-purchase-due-diligence-and-exceptions) |
| Recurring composition and limit-adherence reporting | Management/board report cycle (`portfolio.management_report_issued`) | Monthly (mgmt) / quarterly (board) | Composition, duration, liquidity, gain/loss reports | [IN-12](#in-12-ongoing-monitoring-reporting-and-stress-testing) |
| Quarterly performance attribution to benchmarks | Performance metrics refreshed (`position.analytics_updated`) | At least quarterly | Total-return attribution by segment | [IN-13](#in-13-performance-measurement-and-benchmarks) |
| Single user attempts full trade lifecycle | SOD conflict detected (`sod.conflict_detected`) | Blocked at entry; reconcile T+1 | Segregation of duties; dual control | [IN-14](#in-14-trade-execution-controls-and-segregation-of-duties) |
| Trade documentation must be indexed | Trade settled (`trade.settled`) | 2 business days to attach | Trade tickets, confirmations, memos retained | [IN-15](#in-15-recordkeeping-and-documentation-retention) |
| Covered staff/board training and COI lapse | Training/COI cycle (`training.annual_cycle_opened`) | Before access; annual certification | Training + annual COI certification | [IN-16](#in-16-training-competency-and-conflicts-of-interest) |
| Liquidity stress event declared | CFP investment test/declaration (`cfp.transition_started`) | 1 business day to document execution plan | Investment-liquidation hierarchy per §741.12 | [IN-17](#in-17-contingency-planning-and-liquidity-stress-events) |
| Policy amended on material Part 703 change | Material change flagged (`policy.material_change_flagged`) | 12 months max; earlier on change | Version history, redlines, approval metadata | [IN-18](#in-18-policy-review-amendments-and-version-control) |

## IN-01 — Policy Objectives, Scope, and Covered Instruments  {#in-01-policy-objectives-scope-and-covered-instruments}

**WHY (Reg cite):** NCUA Part 703 requires each federal credit union to maintain a written investment policy that is reviewed at least annually and to operate its investment program consistent with safe and sound practices ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)). The policy must pursue the stated objectives — earnings, liquidity, interest-rate risk mitigation, safety of principal, and pledging capacity — within Part 703's permissible-activities boundary ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13)).

**SYSTEM BEHAVIOR:** The system maintains a single canonical Investment Policy record with effective and next-review dates and tags every balance-sheet position (investments, repos, deposits, other non-loan placements) that falls under it, so the in-scope universe is always enumerable. The five investment objectives — provide earnings, provide liquidity, mitigate interest-rate risk, ensure safety of principal, and meet pledging requirements — are recorded as the governing intent against which strategy is measured, all pursued consistent with safe and sound practices and Part 703. A review warning fires 60 and 30 days before the next-review date; an investment whose governing policy lapses without board approval remains governed by the prior approved policy but is flagged non-compliant rather than orphaned. Edits to the canonical policy record and its scope tags are write-restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Canonical policy record approaches its annual review (`policy.review_warning_issued`) | Policy identity (`policy.id`), current version (`policy.version`), next-review date (`security.policy_review_due_at`) | Review warning notices at 60 and 30 days + logged event (`policy.review_warning_issued`) | 12 months between board approvals (warnings at 60/30 days; enforced by `security.policy_review_due_at`) |
| New balance-sheet position booked or imported (`position.booked`) | Instrument type (`position.instrument_type`), policy-scope tag (`position.policy_tagged`) | Position tagged in scope of the canonical policy + logged event (`position.booked`) | Real time at booking |
| Governing policy lapses without board re-approval (`policy.noncompliance_flagged`) | Affected positions (`position.policy_tagged`), prior approved version (`policy.version`) | Positions flagged non-compliant, prior policy retained as governing + logged event (`policy.noncompliance_flagged`) | Immediately on lapse |

**ALERTS/METRICS:** Alert when the policy review-aging timer crosses the 60/30-day thresholds (`alert.policy_review_aging`); target zero positions tagged non-compliant for lack of a current governing policy; track count of in-scope positions reconciled against the general ledger.

## IN-02 — Governance, Board Oversight, and Delegations  {#in-02-governance-board-oversight-and-delegations}

**WHY (Reg cite):** Part 703 vests the board with responsibility for the investment policy and delegation of investment authority, and requires the policy to define who may make investment decisions and within what limits ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)). Board review of broker-dealers and safekeepers is grounded in [§703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8) and [§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9).

**SYSTEM BEHAVIOR:** The system maintains an authority matrix defining investment decision rights and single-trade and aggregate limits by role, and links each trade and each exception to an authorized approver before settlement. The board reviews and approves the Investment Policy and the authority matrix at least annually (not to exceed 12 months between approvals), approves the lists of securities dealers and safekeeping agents, and reviews investment activity and summary reports at least quarterly (monthly preferred). The ALCO/Investment Committee meets at least monthly to develop strategy, monitor activity and risk attributes, ensure policy and regulatory compliance, review economic conditions and rates, and report to the board. The CFO (or designated Chief Investment Officer) is the primary investment officer for day-to-day management; the CFO's aggregate purchase/sale authority within a calendar month may not exceed the limit set in the authority matrix, and transactions beyond that limit require prior approval of the President/CEO or ALCO as specified in the matrix. The authority matrix is write-restricted to the Chief Compliance Officer with documented Finance concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual governance cycle opens for policy and matrix (`policy.board_review_started`) | Current policy version (`policy.version`), authority-matrix entries (`authority.matrix_entry`, `authority_matrix.version`) | Board approval recorded for policy and matrix + logged event (`policy.board_approved`) | At least annually (≤ 12 months; enforced by `security.policy_review_due_at`) |
| Authority matrix change proposed (`authority.matrix_change_proposed`) | Change rationale (`authority.change_rationale`), Finance concurrence (`authority.finance_concurrence`) | Updated authority matrix + logged event (`authority.matrix_updated`) | Before reliance on new limits |
| ALCO convenes its monthly investment session (`alco.ratio_review_logged`) | Meeting record (`alco.meeting_convened`), portfolio metrics (`portfolio.performance_metrics`) | ALCO minutes and risk review filed to board + logged event (`alco.ratio_review_logged`) | At least monthly |
| Trade requires approval above CFO authority (`trade.approval_requested`) | Trade ticket (`trade.ticket`), settlement amount (`trade.settlement_amount`), matrix entry (`authority.matrix_entry`) | Approval routed to and recorded by authorized approver + logged event (`trade.approval_recorded`) | Before settlement |

**ALERTS/METRICS:** Alert on any board approval cycle aging past 12 months (`alert.policy_review_aging`); track count of trades settled without a linked authorized approver (target zero); monitor ALCO meeting cadence against the monthly requirement.

## IN-03 — Permissible Investments and Prohibited Activities  {#in-03-permissible-investments-and-prohibited-activities}

**WHY (Reg cite):** Part 703 enumerates permissible investments and deposit activities ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13), [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)) and prohibits specified investments, activities, and instruments ([§703.15](https://www.ecfr.gov/current/title-12/part-703/section-703.15), [§703.16](https://www.ecfr.gov/current/title-12/part-703/section-703.16)). Derivative authority is available only under Subpart B and requires a separate board-approved policy.

**SYSTEM BEHAVIOR:** The system enforces an allow-list of instrument types mapped to Part 703 §703.13–703.14 categories and blocks booking of prohibited or non-permitted instruments at trade entry. The diversification guidelines bound each category as a percentage of total portfolio and of Net Worth (e.g., U.S. Treasury and direct agency obligations to 100% of portfolio; structured/callable agency notes to 50% of portfolio and 100% of Net Worth; private-label MBS/ABS and corporate debt to 25% of portfolio and 100% of Net Worth; the combined obligations of all U.S. states and political subdivisions may not exceed 50% of portfolio or 200% of Net Worth). Instrument-level parameters — single security limit, single issuer limit, maximum maturity, and maximum weighted average life — are documented in a permissible-instruments appendix and reviewed at least annually and whenever Part 703 changes materially. The following are prohibited and blocked at entry: derivatives absent a separate Subpart B derivatives policy; subordinated debt; instruments below the four highest NRSRO rating categories; stripped mortgage-backed securities unless specifically permitted; instruments that would trigger §703.15 prohibited activities; and anything not on the approved allow-list. The instrument allow-list and its Part 703 category mappings are write-restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered for permissibility evaluation (`trade.permissibility_checked`) | Instrument type (`trade.instrument_type`), Part 703 category map (`instrument_list.part703_category`), allow-list version (`instrument_list.version`) | Permissibility decision; prohibited instruments blocked (`trade.blocked_prohibited`) + logged event (`trade.permissibility_checked`) | Real time at trade entry |
| Annual or material-change review of the allow-list (`instrument_list.review_completed`) | Current allow-list (`instrument_list.part703_category`, `instrument_list.version`), regulatory change source (`regulatory.source_doc`) | Reviewed and re-approved allow-list + logged event (`instrument_list.review_completed`) | At least annually and on material Part 703 change (`instrument_list.review_due_at`) |

**ALERTS/METRICS:** Track count of blocked prohibited-instrument attempts (`trade.blocked_prohibited`) as a control-effectiveness signal; alert when the allow-list review-aging timer approaches its due date (`instrument_list.review_due_at`); target zero booked positions outside the allow-list.

## IN-04 — Interest Rate Risk and ALM Integration  {#in-04-interest-rate-risk-and-alm-integration}

**WHY (Reg cite):** Part 703 requires credit unions to understand and monitor the interest-rate and price risk of their investments, including securities sensitive to changes in interest rates ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)). The NCUA Examiner's Guide expects the investment policy to integrate with the credit union's asset-liability and interest-rate-risk management.

**SYSTEM BEHAVIOR:** The system captures effective duration, convexity, and cash-flow vectors per security and feeds the ALM models used for interest-rate-risk measurement. ALCO runs IRR simulations at least quarterly, and more often when thresholds are breached, using prospective scenario-based total-return analysis — an income simulation to a defined horizon combined with the projected market value (economic value of equity) at that horizon — as the primary tool for identifying superior risk/reward securities and comparing unlike cash flows across rate scenarios. The policy establishes a market-depreciation limit: given a parallel yield-curve shift of +100, +200, and +300 basis points, the aggregate price depreciation of the combined AFS and HTM portfolio may not exceed 30% of Net Worth; this calculation is performed at least quarterly and reported to ALCO and the board. Scenario assumptions are versioned and write-restricted to ALCO with Treasury concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly (or threshold-triggered) IRR simulation runs (`alm.irr_simulation_completed`) | Per-security analytics (`position.effective_duration`, `position.convexity`), scenario set (`alm.scenario_set`) | IRR/EVE results and ±100/200/300 bp depreciation vs. 30% Net Worth limit + logged event (`alm.irr_simulation_completed`) | At least quarterly; more often on breach (`alm.irr_simulation_due_at`) |
| ALM scenario assumptions changed (`alm.scenario_set`) | Assumption values (`stress.assumption_value`), change rationale (`stress.change_rationale`), approver (`stress.approver_id`) | Versioned scenario set + logged event (`alm.scenario_set`) | Before the next IRR simulation relies on them |

**ALERTS/METRICS:** Alert when measured portfolio depreciation approaches or exceeds 30% of Net Worth under any modeled shift; alert when the IRR simulation due timer ages past quarterly (`alm.irr_simulation_due_at`); track distribution of effective duration and convexity across the portfolio.

## IN-05 — Credit Risk Standards and Downgrade Management  {#in-05-credit-risk-standards-and-downgrade-management}

**WHY (Reg cite):** Part 703 requires a documented credit analysis demonstrating that non-government investments are within policy and that the credit union understands the credit risk before purchase and on an ongoing basis ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6)). NCUA Supervisory Letter LCU 2013-05 requires independent internal credit analysis and limits sole reliance on NRSRO ratings.

**SYSTEM BEHAVIOR:** Before booking any non-government, eligible investment, the system requires a completed credit file with an internal investment-grade determination and an approval link. Investment grade means the issuer has adequate capacity to meet its financial commitments over the projected life of the investment, default risk is low, and full and timely repayment of principal and interest is expected; NRSRO ratings may support but may not be the sole basis for that determination, and the credit union will not generally purchase securities rated below the four highest NRSRO rating categories. Per-instrument due-diligence requirements (municipal GO and revenue bonds, private-label MBS/ABS, corporate bonds, and short-term corporate obligations) are captured in the credit file. Management completes a documented re-analysis at least annually. A downgrade from the internal investment-grade threshold is reviewed within 5 business days, with board notification for material positions. Internal ratings and credit-file approvals are write-restricted to the credit officer function under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Credit file submitted for a non-government instrument (`credit_file.approved`) | Issuer analysis (`credit_file.issuer_analysis`), internal rating (`credit_file.internal_rating`), approver (`credit_file.approver_id`) | Approved credit file gating the booking + logged event (`credit_file.approved`) | Before booking |
| Annual credit re-analysis cycle (`credit_file.reanalysis_completed`) | Existing credit file (`credit_file.id`), updated issuer analysis (`credit_file.issuer_analysis`) | Re-analyzed and re-approved credit file + logged event (`credit_file.reanalysis_completed`) | At least annually (`credit_file.reanalysis_due_at`) |
| Investment downgraded below internal grade (`security.downgraded`) | Rating change (`security.rating_change`), affected position (`concentration.position_id`) | Downgrade review and board notice for material positions + logged event (`security.downgrade_reviewed`) | 5 business days to review (`security.downgrade_review_due_at`) |

**ALERTS/METRICS:** Alert when a downgrade review ages past 5 business days (`security.downgrade_review_due_at`); track count of non-government bookings lacking an approved credit file (target zero); monitor the share of the portfolio below the internal investment-grade threshold.

## IN-06 — Liquidity and Marketability Limits  {#in-06-liquidity-and-marketability-limits}

**WHY (Reg cite):** Part 703 requires the credit union to consider the liquidity and marketability of its investments and to monitor them on an ongoing basis ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)); §741.12 treats the investment portfolio as a core contingent liquidity source ([§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).

**SYSTEM BEHAVIOR:** The system classifies each investment by liquidity bucket, days-to-liquidate, and stress haircut, and reports on-demand and 30-day stress liquidity capacity at least monthly and more frequently under stress. Liquidity risk is the risk that the credit union cannot sell, unwind, or offset a position at a fair price due to inadequate market depth; the portfolio is structured so that a sufficient amount of securities can be converted to cash and consists largely of securities with active secondary or resale markets. AFS securities may be sold prior to maturity to provide liquid funds as needed. Liquidity-bucket assignments and stress haircuts are write-restricted to Treasury under ALCO oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly (or stress-triggered) liquidity classification (`position.liquidity_classified`) | Liquidity bucket (`position.liquidity_bucket`), days-to-liquidate (`position.days_to_liquidate`), stress haircut (`position.stress_haircut`) | On-demand and 30-day stress liquidity capacity report + logged event (`position.liquidity_classified`) | At least monthly; more frequent under stress (`position.liquidity_classification_due`) |

**ALERTS/METRICS:** Alert when 30-day stress liquidity capacity falls below the board-set floor (`alert.survival_low`); track the share of portfolio in the least-liquid buckets; monitor weighted-average days-to-liquidate against target.

## IN-07 — Concentration and Counterparty Limits  {#in-07-concentration-and-counterparty-limits}

**WHY (Reg cite):** Part 703 requires the investment policy to address concentration by issuer, asset class, and other risk characteristics, and to keep investments within policy limits ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3), [§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)). The NCUA Examiner's Guide expects single/related-issuer, geographic, and similar-cash-flow concentration controls.

**SYSTEM BEHAVIOR:** The system maintains parameterized issuer, sector, rating, product, and counterparty limits with soft (warning) and hard (blocking) enforcement at trade entry, reviewed at least annually. Concentration limits address single or related issuer, geographic area, and obligations with similar cash-flow or risk characteristics; the diversification table in [IN-03](#in-03-permissible-investments-and-prohibited-activities) constitutes the hard limits, and ALCO may establish tighter operating limits by sector on a periodic basis. A breach of a hard limit blocks the trade; a soft-limit approach issues a warning and may proceed under a registered, board-thresholded waiver. Limit parameters are write-restricted to ALCO under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade evaluated against concentration limits at entry (`trade.limit_checked`) | Limit parameters (`limit_set.parameters`, `limit_set.version`), computed concentration (`concentration.computed`), issuer/sector exposure (`exposure.by_issuer`, `exposure.by_sector`) | Hard-limit block (`trade.limit_blocked`) or soft-limit warning (`trade.limit_warning_issued`) + logged event (`trade.limit_checked`) | Real time at trade entry |
| Concentration limit exceeded and a waiver sought (`concentration.waiver_opened`) | Excess amount (`concentration.excess_amount`), waiver request (`concentration.waiver_request`), terms (`concentration.waiver_terms`) | Waiver decision recorded against board threshold + logged event (`concentration.waiver_decided`) | Before reliance on the waiver (`concentration.waiver_due_at`) |
| Annual review of concentration/counterparty limits (`limit_set.review_completed`) | Current limit set (`limit_set.parameters`, `limit_set.version`), top-10 exposures (`concentration.top10`) | Reviewed and re-approved limit set + logged event (`limit_set.review_completed`) | At least annually (`limit_set.review_due_at`) |

**ALERTS/METRICS:** Alert on any hard-limit breach attempt (`alert.concentration_breach`); track count of soft-limit warnings and open waivers against board threshold; monitor top-10 issuer and counterparty exposures as a percent of Net Worth.

## IN-08 — Approved Brokers, Dealers, and Safekeepers  {#in-08-approved-brokers-dealers-and-safekeepers}

**WHY (Reg cite):** Part 703 governs the selection and monitoring of broker-dealers ([§703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8)) and requires that purchased securities be held by an approved safekeeper with safekeeping records reconciled at least monthly ([§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9), specifically [§703.9(c)](https://www.ecfr.gov/current/title-12/part-703/section-703.9)).

**SYSTEM BEHAVIOR:** The system maintains an approved-intermediaries list with due-diligence and review dates, blocks trades with unapproved intermediaries, performs annual due-diligence reviews, and reconciles safekeeping statements monthly per §703.9(c). The board reviews and approves the list of securities dealers at least annually and approves safekeeping agents; the credit union trades only through approved dealers, and the CFO maintains current dealer information. Dealer analysis covers the dealer's and its affiliates' capital strength, liquidity, and operating results; general reputation for stability and fair dealing; any formal enforcement actions reported by state or federal securities regulators or self-regulatory organizations such as FINRA; and the experience of the sales representative. Purchased securities are not maintained with the selling dealer but transferred to an approved safekeeping agent per §703.9; approval of existing or additional safekeeping agents requires board action. The approved-intermediaries list is write-restricted to the CFO with board approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade routed to an intermediary for validation (`trade.permissibility_checked`) | Intermediary identity (`trade.intermediary_id`), approved list (`intermediary.approved_list`) | Trade with unapproved intermediary blocked (`trade.intermediary_blocked`); approved intermediary validated (`trade.intermediary_validated`) | Real time at trade entry |
| Annual due-diligence review of an intermediary (`intermediary.review_completed`) | Due-diligence file (`intermediary.due_diligence_file`), approved list (`intermediary.approved_list`) | Reviewed and re-approved intermediary record + logged event (`intermediary.review_completed`) | At least annually (`intermediary.review_due_at`) |
| Safekeeping statement received for reconciliation (`safekeeping.statement_received`) | Safekeeping statement (`safekeeping.statement`), recon items (`recon.item`) | Reconciled safekeeping position + logged event (`safekeeping.reconciliation_completed`) | At least monthly (`safekeeping.reconciliation_due_at`) |

**ALERTS/METRICS:** Track count of blocked unapproved-intermediary attempts (`trade.intermediary_blocked`); alert when a safekeeping reconciliation ages past month-end (`safekeeping.reconciliation_due_at`); target zero unreconciled safekeeping items at month-end.

## IN-09 — Repurchase and Reverse Repurchase Agreements  {#in-09-repurchase-and-reverse-repurchase-agreements}

**WHY (Reg cite):** Part 703 permits repurchase transactions subject to collateral, custody, and counterparty conditions ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13), [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)); NCUA repurchase guidance (IRPS 1985-2 and Part 703) sets safe-and-sound collateral, haircut, and maturity-mismatch practices.

**SYSTEM BEHAVIOR:** The system represents each repurchase agreement with explicit collateral, haircut, counterparty, and maturity-mismatch fields and blocks bookings that violate internal or regulatory mismatch and collateral rules. Repurchase agreements are treated as secured borrowings: the credit union sells securities and agrees to repurchase them at a specified price on a specified future date, creating a balance-sheet liability while the investment remains an asset. Maximum maturity is 3 months as a baseline, single-issuer exposure is limited to 25% of Net Worth, and maturity-mismatch limits apply per IRPS 1985-2. Collateral is marked to market at least weekly, daily under stress, and a margin call is issued on any shortfall. Repo collateral eligibility rules and haircuts are write-restricted to Treasury under ALCO oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Repurchase agreement entered for rule check (`repo.entered`) | Counterparty (`repo.counterparty_id`), collateral CUSIP (`repo.collateral_cusip`), haircut (`repo.haircut`), maturity mismatch (`repo.maturity_mismatch_days`) | Booked repo or block on rule violation (`repo.blocked_rule_violation`) + logged event (`repo.booked`) | Real time at entry |
| Repo collateral marked to market (`repo.collateral_marked`) | Required margin (`repo.required_margin`), collateral fair value (`collateral.fair_value`) | Margin shortfall detection (`repo.margin_shortfall_detected`) + logged event (`repo.collateral_marked`) | At least weekly; daily under stress (`repo.collateral_revaluation_due_at`) |
| Collateral shortfall detected (`repo.margin_shortfall_detected`) | Shortfall amount (`repo.margin_shortfall_amount`), counterparty (`repo.counterparty_id`) | Margin call issued + logged event (`repo.margin_call_issued`) | Same day on shortfall |

**ALERTS/METRICS:** Alert on any maturity-mismatch or collateral rule block (`alert.mismatch_breach`); track open margin shortfalls and time-to-cure; monitor repo single-issuer exposure against the 25% of Net Worth limit.

## IN-10 — Valuation, Accounting, and Fair-Value Measurement  {#in-10-valuation-accounting-and-fair-value-measurement}

**WHY (Reg cite):** Part 703 requires periodic valuation of investments at fair value and supporting records ([§703.11](https://www.ecfr.gov/current/title-12/part-703/section-703.11)); GAAP governs HTM/AFS classification and other-than-temporary impairment (OTTI) measurement, and Part 703 recordkeeping anchors the supporting documentation ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4)).

**SYSTEM BEHAVIOR:** The system captures book value, amortized cost, and fair value per security with pricing source and date, and updates fair value at least monthly. At purchase, each security is classified Held-to-Maturity (amortized cost) or Available-for-Sale (fair value, with unrealized gains/losses in a separate component of members' equity on a tax-affected basis until realized); transfers between categories are rare, documented by the CFO, and permitted out of HTM only for the defined exceptions (under 3 months to maturity/call, under 15% of purchase face remaining on MBS/CMO, creditworthiness deterioration, major regulatory change, or a business combination/disposition producing an unacceptable asset/liability position). The portfolio may be repositioned (AFS sales) to improve risk/reward, adjust rate sensitivity, improve liquidity, or improve credit quality. At least quarterly, reported fair values are verified against reputable, independent pricing sources, and a security-by-security OTTI evaluation is performed: for any security in a loss position of 10% or more, management assesses whether the issuer is unable to pay all contractual amounts due, and if probable records OTTI and writes the security down to fair value with the credit impairment flowing through income. Pricing overrides are restricted to the CFO/Controller under dual approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly fair-value refresh per security (`security.fair_value_updated`) | Book value (`position.book_value`), amortized cost (`position.amortized_cost`), fair value and source (`position.fair_value`, `pricing.source`, `pricing.as_of_date`) | Updated fair values per security + logged event (`security.fair_value_updated`) | At least monthly; verified quarterly (`security.fair_value_update_due_at`) |
| Quarterly security-by-security OTTI evaluation (`security.fair_value_updated`) | Loss-position depth (`position.fair_value`, `position.amortized_cost`), impairment indicator (`security.impairment_indicator_raised`) | OTTI determination and write-down where probable + logged event (`security.impairment_determined`) | At least quarterly |
| Pricing override proposed (`pricing.exception_raised`) | Proposed price (`pricing.proposed_price`), override rationale (`pricing.override_rationale`), approver (`pricing.exception_approver`) | Dual-approved pricing override or rejection + logged event (`pricing.exception_raised`) | Before the override is used in reporting |

**ALERTS/METRICS:** Alert when a fair-value update ages past its monthly/quarterly due (`security.fair_value_update_due_at`); track count of securities in a 10%+ loss position pending OTTI assessment; monitor count and rationale of pricing overrides.

## IN-11 — Pre-Purchase Due Diligence and Exceptions  {#in-11-pre-purchase-due-diligence-and-exceptions}

**WHY (Reg cite):** Part 703 requires documented pre-purchase analysis demonstrating that an investment is permissible and within policy, and that the credit union understands its characteristics and risks ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6), [§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)).

**SYSTEM BEHAVIOR:** The system enforces a pre-trade checklist and approval workflow linking each trade to a credit memo and valuation support before booking, other than U.S. government or fully insured instruments, and maintains a board-thresholded exception log. Required purchase documentation includes issuer; security type; CUSIP; issue size; issue/maturity/call dates; coupon and frequency; trade and settlement dates; par value, original issue price, and credit union purchase price; prospective total-return profile; yield, duration, and weighted-average life; CPR/PSA assumptions where applicable; a credit-analysis memo for non-government instruments; AFS/HTM designation; and dealer name. Required sale documentation includes issuer; security type; CUSIP; rationale for sale; total-return profile at sale price; trade and settlement dates; coupon; price; yield; par value; and dealer name. A missing checklist item raises a registered exception that must be approved before booking; exceptions above the board threshold escalate. The exception log is write-restricted to Compliance with approver linkage.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Pre-trade checklist completed before booking (`trade.checklist_completed`) | Pre-trade checklist (`trade.pretrade_checklist`), credit memo (`credit_file.id`), valuation support (`trade.valuation_support`) | Booking gated on a complete, approved checklist + logged event (`trade.checklist_completed`) | Before booking |
| Checklist item missing, raising an exception (`trade.exception_logged`) | Exception rationale (`exception.rationale`), risk acceptance (`exception.risk_acceptance`), approver (`exception.approver_id`) | Registered, board-thresholded exception approval (`trade.exception_approved`) + logged event (`trade.exception_logged`) | Before booking; expires per `exception.expires_at` |

**ALERTS/METRICS:** Track count and aging of open pre-trade exceptions against the board threshold; alert on any booking that bypassed the checklist gate (target zero); monitor share of trades requiring an exception.

## IN-12 — Ongoing Monitoring, Reporting, and Stress Testing  {#in-12-ongoing-monitoring-reporting-and-stress-testing}

**WHY (Reg cite):** Part 703 requires ongoing monitoring of the investment portfolio and periodic reporting to the board ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)), and the NCUA Examiner's Guide expects stress testing of credit, liquidity, interest-rate, and concentration risk integrated with ALM.

**SYSTEM BEHAVIOR:** The system generates recurring composition, duration, liquidity, gain/loss, and limit-adherence reports — monthly to management and at least quarterly to the board — and runs stress scenarios at least annually, more often as metrics approach limits. The board receives at least quarterly (monthly preferred) all purchases; all sales and net gains/(losses); composition; prospective total-return profile and total-return results; portfolio yield, current effective duration, and current average life; credit-risk considerations; and market appreciation/depreciation in dollars and as a percent of Net Worth. ALCO receives at least monthly current and desired composition; prospective total-return profile over one or more horizons; risk-consideration analysis; liquidity objectives; total-return results, current effective duration, and current average life; and Net Worth levels. Report definitions and distribution lists are write-restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly management reporting cycle (`portfolio.management_report_issued`) | Composition and metrics (`portfolio.performance_metrics`), gain/loss summary (`portfolio.gain_loss_summary`) | Management composition/duration/liquidity/limit report + logged event (`portfolio.management_report_issued`) | Monthly (`portfolio.report_due_at`) |
| Quarterly board reporting cycle (`portfolio.board_report_issued`) | Gain/loss summary (`portfolio.gain_loss_summary`), depreciation vs. Net Worth (`portfolio.performance_metrics`) | Board investment report + logged event (`portfolio.board_report_issued`) | At least quarterly (`portfolio.board_report_due_at`) |
| Periodic portfolio stress test (`portfolio.stress_test_completed`) | Stress assumptions (`stress_test.assumptions`), scenario set (`stress.scenario_set`) | Stress-test results and breach detail (`stress_test.breach_detail`) + logged event (`portfolio.stress_test_completed`) | At least annually; more often near limits (`portfolio.stress_test_due_at`) |

**ALERTS/METRICS:** Alert when a board or management report ages past its due timer (`portfolio.board_report_due_at`, `portfolio.report_due_at`); alert when a stress scenario breaches a limit (`stress_test.breach_detail`); track on-time delivery rate of recurring reports.

## IN-13 — Performance Measurement and Benchmarks  {#in-13-performance-measurement-and-benchmarks}

**WHY (Reg cite):** Part 703 requires the credit union to monitor the performance and risk of its investments on an ongoing basis ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)); performance measurement supports ALCO's assessment that the portfolio's risk/reward profile remains consistent with board-approved strategy.

**SYSTEM BEHAVIOR:** The system attributes return and income to benchmarks by segment at least quarterly, using total-return analysis — income simulation combined with projected market value at the horizon — as the primary tool for evaluating performance and comparing unlike cash flows across rate scenarios. Performance targets are configured so that they do not incentivize breaching risk limits, and the attribution supports ALCO's judgment about whether the risk/reward profile is consistent with approved strategy. Benchmark definitions and performance targets are write-restricted to ALCO under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly performance attribution refresh (`position.analytics_updated`) | Performance metrics (`portfolio.performance_metrics`), per-segment analytics (`position.effective_duration`, `position.fair_value`) | Benchmark-relative return/income attribution by segment + logged event (`position.analytics_updated`) | At least quarterly (`position.analytics_update_due`) |

**ALERTS/METRICS:** Track tracking-error and return/income attribution by segment against benchmark; alert when a performance refresh ages past quarterly (`position.analytics_update_due`); monitor whether any incentive target correlates with a limit breach (target zero).

## IN-14 — Trade Execution, Controls, and Segregation of Duties  {#in-14-trade-execution-controls-and-segregation-of-duties}

**WHY (Reg cite):** Part 703 recordkeeping and safe-and-sound expectations require that no single individual control a full investment transaction lifecycle and that trades be confirmed and reconciled ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4), [§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9)).

**SYSTEM BEHAVIOR:** The system segregates trade initiation, approval, confirmation, settlement, and accounting, enforces dual control, and blocks any single user from controlling a full transaction lifecycle. Trade confirmations are matched and discrepancies flagged, and trades are reconciled within T+1. A detected segregation-of-duties conflict blocks the step; where a compensating control is warranted it must be proposed and approved with a documented rationale. Trade-lifecycle role assignments and the SOD matrix are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| User attempts a trade lifecycle step (`trade.step_recorded`) | Step attempted (`trade.step_attempted`), initiating user (`transaction.initiated_by`), SOD matrix (`sod.matrix_version`) | SOD conflict block (`trade.sod_blocked`) and conflict detection (`sod.conflict_detected`) + logged event (`trade.step_recorded`) | Real time at each step |
| Trade confirmation received for matching (`trade.confirmation_received`) | Confirmation terms (`confirmation.terms`), trade ticket (`trade.ticket`) | Matched confirmation or discrepancy flag (`trade.confirmation_discrepancy_flagged`) + logged event (`trade.confirmation_received`) | Promptly on receipt |
| Trade settled and reconciled (`trade.settled`) | Settlement amount and date (`trade.settlement_amount`, `trade.settlement_date`), recon items (`recon.item`) | Reconciled trade record + logged event (`trade.reconciliation_completed`) | T+1 (`trade.reconciliation_due_at`) |

**ALERTS/METRICS:** Alert on any SOD conflict block or violation (`sod.violation_logged`); track count of unmatched confirmations and unreconciled trades past T+1; target zero single-user full-lifecycle attempts.

## IN-15 — Recordkeeping and Documentation Retention  {#in-15-recordkeeping-and-documentation-retention}

**WHY (Reg cite):** Part 703 requires the credit union to maintain documentation supporting each investment decision and to retain investment records ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4)); enterprise retention schedules are governed by the Record Retention Policy and applicable NCUA and federal requirements.

**SYSTEM BEHAVIOR:** The system stores and indexes trade tickets, confirmations, credit memos, approvals, safekeeping statements, and reports with retention schedules, and requires documents to be attached to trades within 2 business days. Retention classes follow the applicable NCUA and federal record-retention requirements maintained centrally; this control governs attachment, indexing, and linkage of investment artifacts to their trades, while disposition cadence is inherited from the Record Retention Policy. Indexed investment records are write-restricted to the records function with access logged.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade booked or settled, requiring documentation (`trade.settled`) | Trade ticket (`trade.ticket`), supporting artifacts (`record.artifact`), retention class (`record.retention_class`) | Indexed, retention-tagged investment record attached to the trade + logged event (`record.indexed`) | 2 business days to attach |

**ALERTS/METRICS:** Alert when a trade has unattached documentation past 2 business days; track index completeness of trade records (target 100%); monitor retention-class coverage of investment artifacts.

## IN-16 — Training, Competency, and Conflicts of Interest  {#in-16-training-competency-and-conflicts-of-interest}

**WHY (Reg cite):** Part 703 prohibits conflicts of interest in investment activities and requires the credit union to ensure staff have the competence to understand the instruments transacted ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6), [§703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17)).

**SYSTEM BEHAVIOR:** The system tracks required training and annual conflict-of-interest certifications for covered staff and board members, requires training completion before granting system access, and auto-suspends access on non-completion. A covered individual is identified from the covered-person roster; an annual COI cycle issues a questionnaire, captures attestations and any disclosed conflicts, and routes conflicted matters to recusal. Training curricula, the covered-person roster, and COI determinations are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens for covered staff (`training.annual_cycle_opened`) | Required curriculum (`training.required_curriculum`), assignee (`training.assignee_id`), role matrix (`training.role_matrix`) | Assigned training and access gate on completion + logged event (`training.completion_recorded`) | Before access; annual cycle (`training.annual_due_at`) |
| Annual COI certification cycle opens (`coi.annual_cycle_opened`) | Questionnaire version (`coi.questionnaire_version`), responses (`coi.questionnaire_responses`), attestation (`coi.attestation_signature`) | Filed COI certification and any recusal record (`coi.recusal_record`) + logged event (`coi.certified`) | Annually (`coi.certification_due`) |
| Conflict identified on an investment matter (`coi.disclosure_filed`) | Interest description (`coi.interest_description`), related party (`coi.related_party`), matter reference (`coi.matter_reference`) | Recusal executed and determination logged + logged event (`coi.recusal_executed`) | Before the conflicted matter is acted on |

**ALERTS/METRICS:** Alert when covered staff training lapses (`training.lapsed`) and on COI certification aging (`coi.certification_due`); track count of access grants auto-suspended for non-completion; target zero conflicted matters acted on without recusal.

## IN-17 — Contingency Planning and Liquidity Stress Events  {#in-17-contingency-planning-and-liquidity-stress-events}

**WHY (Reg cite):** NCUA §741.12 requires a Contingency Funding Plan and treats the investment portfolio as a contingent liquidity source whose liquidation hierarchy must be defined and tested ([§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)). Enterprise CFP governance is maintained in the Liquidity Policy; this control covers the investment-portfolio role in it.

**SYSTEM BEHAVIOR:** The system maintains predefined liquidity stress scenarios and an investment-liquidation hierarchy tied to the Contingency Funding Plan, tests them at least annually, and documents an initial execution plan within 1 business day of an actual stress declaration. The portfolio is structured so that a sufficient tranche of AFS securities can be liquidated under stress to meet contingent funding needs without resorting to fire-sale pricing. The liquidation hierarchy and stress scenarios are write-restricted to Treasury under ALCO oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual CFP investment-liquidity test (`cfp.investment_test_completed`) | Liquidation hierarchy (`cfp.liquidation_hierarchy`), stress scenarios (`stress.scenario_set`) | Tested investment-liquidation hierarchy + logged event (`cfp.investment_test_completed`) | At least annually (`cfp.investment_test_due_at`) |
| Actual liquidity stress declared (`cfp.transition_started`) | Stress driver (`survival.driver_scenario`), liquidation hierarchy (`cfp.liquidation_hierarchy`) | Documented initial execution plan (`cfp.execution_plan_documented`) + logged event (`cfp.level_changed`) | 1 business day to document plan (`cfp.execution_plan_due_at`) |

**ALERTS/METRICS:** Alert when the CFP investment test ages past annual (`cfp.investment_test_due_at`); alert when an execution plan is not documented within 1 business day of a declaration (`cfp.execution_plan_due_at`); track the liquidatable AFS tranche as a percent of contingent funding need.

## IN-18 — Policy Review, Amendments, and Version Control  {#in-18-policy-review-amendments-and-version-control}

**WHY (Reg cite):** Part 703 requires the board to review and approve the investment policy at least annually and to update it for material regulatory change ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); §741.3 special-reserve treatment of nonconforming investments reinforces the need for current, conforming policy ([§741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

**SYSTEM BEHAVIOR:** The system maintains full version history, redlines, and approval metadata, and drives a review at least annually (not to exceed 12 months between board approvals) and earlier on material regulatory change to Part 703 or related guidance. A material Part 703 change flags the policy for amendment; proposed amendments are redlined, re-approved by the board, and published as a new version with distribution logged. Version history and approval metadata are write-restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle (`policy.review_completed`) | Current version (`policy.version`), redlines (`policy.change_summary`), approver (`policy.approver_id`) | Board-approved policy version + logged event (`policy.version_approved`) | ≤ 12 months between approvals (`policy.review_due_at`) |
| Material Part 703 change identified (`policy.material_change_flagged`) | Regulatory change source (`regulatory.source_doc`), change required flag (`regulatory.change_required`) | Amendment proposed and published version + logged event (`policy.revision_published`) | Promptly on material change |

**ALERTS/METRICS:** Alert when the policy review-aging timer approaches 12 months (`alert.policy_review_aging`); track count of published versions and time from material-change flag to re-approval; target zero positions governed by a lapsed policy version.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Governance of these controls is centralized with the Chief Compliance Officer, with the Chief Financial Officer/Chief Investment Officer (or equivalent), the ALCO/Investment Committee, Treasury, Risk, Finance, and the Internal Audit/Supervisory Committee as required participants.
- **Approval:** Approved by the Board of Directors on the recommendation of the Chief Compliance Officer. The board reviews and approves this policy and the authority matrix at least annually (not to exceed 12 months between approvals), and approves the lists of securities dealers and safekeeping agents (see [IN-02](#in-02-governance-board-oversight-and-delegations), [IN-08](#in-08-approved-brokers-dealers-and-safekeepers)).
- **Review cadence:** At least annually and earlier on material regulatory change to Part 703 or related guidance (see [IN-18](#in-18-policy-review-amendments-and-version-control)). Investment activity is reported to the board at least quarterly (monthly preferred) and to ALCO at least monthly (see [IN-12](#in-12-ongoing-monitoring-reporting-and-stress-testing)).
- **Cross-references:** Derivative authority — separate Derivatives Policy under Part 703 Subpart B (out of scope here). Retail NDIP sales — separate NDIP/retail investment sales policy. Enterprise liquidity program and CFP governance — Liquidity Policy. Asset-liability and capital adequacy frameworks — Capitalization and Basel-II Standardized Approach Framework Policies. Enterprise record-retention schedules — Record Retention Policy. Third-party/vendor risk management for brokers and custodians beyond investment due diligence — Third-Party Risk Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Certain investment-side field, event, and timer codes referenced in the control overlays are not yet registered in `vocabulary.json` (the parsed spec is banking-core only); the spellings used are the agreed target naming scheme and will be confirmed by engineering before the next review. The provisional codes used are: `authority_matrix.version`, `covered_person.id`, `covered_person.role`, `credit_file.approver_id`, `credit_file.id`, `exception.approver_id`, `exception.expires_at`, `instrument_list.version`, `limit_set.version`, `policy.approver_id`, `policy.change_summary`, `policy.id`, `policy.version`, `position.instrument_type`, `position.maturity_date`, `stress.approver_id`, `stress_test.due_at`, `trade.amount`, `trade.instrument_type`, `valuation.report`. The newly composed codes used are: `security.impairment_determined` (registered subject `security` + registered verb `determined`), pending engineering registration.
- **Net Worth as the denominator.** The diversification and instrument-level limits are expressed as a percent of Net Worth, substituting the credit union Net Worth measure for the source reference policy's "Tier 1 Capital." The precise Net Worth definition used by the limit engine (e.g., the §702 net-worth ratio numerator) is assumed to be the regulatory Net Worth and would be confirmed with Finance.
- **Charter and Part 703 applicability.** The policy assumes Pynthia is a federally chartered credit union to which NCUA Part 703 applies directly; for a state charter, the applicable state investment rules and the §741.3 special-reserve treatment of nonconforming investments would need to be layered in.
- **CFP/§741.12 asset tier.** The 1-business-day execution-plan deadline and annual test cadence assume Pynthia's §741.12 asset-tier obligations; the exact tier and any additional liquidity-source requirements are governed by the Liquidity Policy and assumed consistent with it.
- **OTTI/CECL accounting model.** The OTTI write-down treatment follows the source reference policy; if Pynthia has adopted the CECL credit-loss model for available-for-sale and held-to-maturity debt securities, the impairment evaluation in [IN-10](#in-10-valuation-accounting-and-fair-value-measurement) would be re-expressed as an allowance for credit losses, with the same triggers and quarterly cadence. This is assumed to be confirmed with Finance and external audit.
- **Repo maturity-mismatch parameters.** The specific maturity-mismatch and haircut parameters for repurchase and reverse repurchase agreements are set per IRPS 1985-2 and Part 703 in the limit engine; the baseline 3-month maturity and 25% of Net Worth single-issuer limit are stated, but the full mismatch grid is assumed to be maintained in the limit-set parameters and confirmed by Treasury.
- **Permissible-instruments appendix.** The instrument-level single-security, single-issuer, maximum-maturity, and maximum-weighted-average-life parameters are maintained in a permissible-instruments appendix reviewed annually; the baseline values from PATRICK_NOTES are assumed authoritative until that appendix is ratified.
