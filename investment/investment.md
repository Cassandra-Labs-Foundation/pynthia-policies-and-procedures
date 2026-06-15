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

Pynthia Credit Union invests surplus funds and places non-loan assets only in instruments permissible under the Federal Credit Union Act and NCUA Part 703, with safety of principal as the primary consideration and adequate liquidity, reasonable risk-adjusted yield, and disciplined governance as the operating objectives. This policy governs all investments, repurchase and reverse repurchase agreements, deposits, and other non-loan asset placements on the balance sheet — whether executed directly or through third parties — and is enforced through board-approved authority limits, an allow-list of permitted instruments, pre-trade due diligence, independent credit analysis, valuation and accounting controls, and recurring monitoring and stress testing. It does not authorize derivative activity (Part 703 Subpart B) or retail nondeposit investment product (NDIP) sales, which are governed by separate policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Policy review approaching lapse | Review window opens (`policy.board_review_started`) | ≤ 12 months between board approvals; warn at 60/30 days | Canonical policy record, effective/next-review dates | [IP-01](#ip-01-policy-objectives-scope-and-covered-instruments) |
| Board annual policy & authority-matrix approval | Board cycle opens (`governance.board_cycle_opened`) | Annually, not to exceed 12 months | Investment Policy + authority matrix | [IP-02](#ip-02-governance-board-oversight-and-delegations) |
| Permissible-instrument allow-list review | Annual review or Part 703 change (`instrument_list.review_completed`) | Annually + on material Part 703 change | Permissible instruments appendix | [IP-03](#ip-03-permissible-investments-and-prohibited-activities) |
| ALCO IRR simulation | Quarter opens (`alm.scenario_set`) | Quarterly; more often on threshold breach | IRR / total-return analysis; ≤30% NW depreciation limit | [IP-04](#ip-04-interest-rate-risk-and-alm-integration) |
| Credit downgrade below investment-grade threshold | Downgrade detected (`security.downgraded`) | Review within 5 BD; board notice for material positions | Credit file, internal rating | [IP-05](#ip-05-credit-risk-standards-and-downgrade-management) |
| Liquidity/marketability reporting | Month/quarter close (`position.liquidity_classified`) | Monthly; more frequently under stress | Liquidity-bucket and stress-haircut report | [IP-06](#ip-06-liquidity-and-marketability-limits) |
| Concentration limit check at trade entry | Trade entered (`trade.entered`) | Real-time block (hard) / warn (soft) | Diversification limits table | [IP-07](#ip-07-concentration-and-counterparty-limits) |
| Safekeeping reconciliation | Statement received (`safekeeping.statement_received`) | Monthly (§703.9(c)) | Safekeeping statement vs. books | [IP-08](#ip-08-approved-brokers-dealers-and-safekeepers) |
| Repo collateral mark-to-market | Repo booked (`repo.booked`) | At least weekly; daily under stress | Collateral, haircut, mismatch fields | [IP-09](#ip-09-repurchase-and-reverse-repurchase-agreements) |
| Fair-value update & OTTI evaluation | Quarter close (`security.quarter_closed`) | Fair value ≥ monthly; OTTI quarterly | Book/amortized/fair value, pricing source | [IP-10](#ip-10-valuation-accounting-and-fair-value-measurement) |
| Pre-purchase due diligence & exceptions | Trade entered (`trade.entered`) | Before booking (settlement) | Pre-trade checklist, credit memo, valuation | [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions) |
| Recurring reporting & stress testing | Reporting cycle (`portfolio.management_report_issued`) | Monthly to mgmt; ≥ quarterly to board; stress ≥ annual | Composition/duration/liquidity/limit reports | [IP-12](#ip-12-ongoing-monitoring-reporting-and-stress-testing) |
| Performance attribution to benchmarks | Quarter close (`performance.attribution_completed`) | Quarterly | Total-return attribution by segment | [IP-13](#ip-13-performance-measurement-and-benchmarks) |
| Trade lifecycle SoD & reconciliation | Trade step attempted (`trade.step_recorded`) | Reconcile within T+1 | Segregated lifecycle, dual control | [IP-14](#ip-14-trade-execution-controls-and-segregation-of-duties) |
| Trade documentation attachment | Trade booked (`trade.booked`) | Documents attached within 2 BD | Tickets, confirms, memos, approvals | [IP-15](#ip-15-recordkeeping-and-documentation-retention) |
| Training & COI for covered staff/board | Hire / annual cycle (`training.annual_cycle_opened`) | Training before access; annual COI | Training & COI records | [IP-16](#ip-16-training-competency-and-conflicts-of-interest) |
| Liquidity stress declaration | Stress declared (`liquidity.stress_declared`) | Execution plan within 1 BD; test ≥ annually | CFP liquidation hierarchy | [IP-17](#ip-17-contingency-planning-and-liquidity-stress-events) |
| Policy amendment / version control | Material reg change (`policy.amendment_proposed`) | ≤ 12 months; earlier on material change | Version history, redlines, approvals | [IP-18](#ip-18-policy-review-amendments-and-version-control) |

## IP-01 — Policy Objectives, Scope, and Covered Instruments

- **WHY (Reg cite):** NCUA Part 703 requires a board-adopted written investment policy that states objectives and governs permissible activities ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); safety-and-soundness expectations and the policy's articulated objectives (earnings, liquidity, IRR mitigation, safety of principal, pledging) anchor here, with permissible scope drawn from [§703.13–§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.13).
- **SYSTEM BEHAVIOR:** The system maintains a single canonical Investment Policy record with `policy.effective_date` and `policy.next_review_date`, articulating the five objectives (earnings, liquidity, IRR mitigation, safety of principal, pledging) all pursued consistent with safe-and-sound practices and Part 703. Every balance-sheet position — investments, repos, deposits, and other non-loan placements — is tagged to the policy via `position.policy_tagged`. The scheduler warns at 60 and 30 days before `policy.next_review_date`; if the review lapses, in-scope investments remain governed by the prior approved version and are flagged non-compliant rather than blocked. The canonical policy record is write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Policy created or republished (`policy.version_published`) | Policy document and version (`policy.document_id`, `policy.document_version`), effective and next-review dates (`policy.effective_date`, `policy.next_review_date`) | Canonical policy record + emitted (`policy.version_published`) | At adoption (internal: same day) |
  | New balance-sheet position booked and needs scope tagging (`position.booked`) | Position identifier and instrument type (`position.cusip`, `position.instrument_type`) | Policy-tagged position + emitted (`position.liquidity_classified`)… policy tag set (`position.policy_tagged`) | At booking (internal: T+0) |
  | Review window approaches (`policy.review_warning_issued`) | Next-review date (`policy.next_review_date`), warning thresholds (`policy.review_warning_at`) | 60/30-day review warning + emitted (`policy.review_warning_issued`); review task (`governance.policy_review_due`) | 60 and 30 days before next review (enforced by `policy.next_review_at`) |
  | Review lapses without board approval (`policy.review_lapsed`) | Lapse flag (`policy.review_lapsed`), affected positions (`position.policy_tagged`) | Non-compliance flag on positions + emitted (`policy.noncompliance_flagged`) | On lapse (internal: same day) |

- **ALERTS/METRICS:** Alert on policy-review aging (`alert.policy_review_aging`) at 60/30 days and after lapse; target zero in-scope positions untagged to the canonical policy and zero positions governed by a lapsed policy without a remediation flag.

## IP-02 — Governance, Board Oversight, and Delegations

- **WHY (Reg cite):** Part 703 requires the board to establish investment authority, limits, and oversight, and to review the policy at least annually ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); board approval of broker-dealers and safekeepers and delegation discipline tie to [§703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8) and [§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9).
- **SYSTEM BEHAVIOR:** The system maintains an authority matrix (`authority_matrix.role_limits`) defining investment decision rights and single-trade and aggregate limits by role, linking each trade and exception to an authorized approver. The board reviews and approves the policy and authority matrix at least annually (not to exceed 12 months), plus the dealer list and safekeeping agents, and reviews investment activity at least quarterly (monthly preferred). ALCO performs monthly strategy, monitoring, compliance, and board-reporting duties. The CFO/CIO is the primary investment officer; the CFO's aggregate monthly purchase/sale authority may not exceed the matrix limit, and transactions beyond it require prior President/CEO or ALCO approval before settlement. Exceptions must be documented and approved before settlement. The authority matrix is write-restricted to the Board (via resolution) and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Authority-matrix change proposed (`authority.matrix_change_proposed`) | Proposed matrix entry (`authority.matrix_entry`), change rationale (`authority.change_rationale`) | Updated authority matrix + emitted (`authority.matrix_updated`) | Before reliance (internal: prior to next trade) |
  | Board reviews/approves policy & matrix (`policy.board_review_started`) | Policy version (`policy.document_version`), board resolution (`board.resolution_id`) | Board approval record + emitted (`policy.board_approved`) | ≤ 12 months between approvals (enforced by `policy.board_approval_due_at`) |
  | ALCO monthly review convenes (`alco.ratio_review_logged`) | Strategy, risk attributes, compliance status (`portfolio.performance_metrics`) | ALCO minutes/report + emitted (`alco.ratio_review_logged`) | Monthly (internal: by month-end) |
  | Board quarterly activity review (`board.audit_review_recorded`) | Activity & summary reports (`portfolio.gain_loss_summary`) | Board review minutes + emitted (`board.minutes_recorded`); board report task (`reporting.board_pack_due`) | At least quarterly (enforced by `portfolio.board_report_due_at`) |
  | Trade exceeds CFO aggregate/monthly limit (`trade.approval_requested`) | Proposed trade and approval tier (`trade.intermediary_id`, `authority_matrix.role_limits`) | Approval record + emitted (`trade.approval_recorded`) | Before settlement (internal: pre-settlement) |

- **ALERTS/METRICS:** Alert on authority-matrix or policy-approval aging (`alert.policy_review_aging`); target zero trades settled above delegated authority without recorded prior approval and zero quarters without a board activity review.

## IP-03 — Permissible Investments and Prohibited Activities

- **WHY (Reg cite):** Part 703 defines permissible investments and deposit activities ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13), [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)) and enumerates prohibited investments and activities ([§703.15](https://www.ecfr.gov/current/title-12/part-703/section-703.15), [§703.16](https://www.ecfr.gov/current/title-12/part-703/section-703.16)); derivatives are permissible only under Subpart B.
- **SYSTEM BEHAVIOR:** The system enforces an allow-list of instrument types mapped to Part 703 §703.13–703.14 categories (`instrument_list.part703_category`) and blocks booking of prohibited or non-permitted instruments at trade entry. Portfolio allocations are bounded by the diversification guidelines (max % of portfolio and % of Net Worth) and instrument-level parameters (single security limit, single issuer limit, maximum maturity, maximum weighted average life) documented in a permissible instruments appendix; the diversification table constitutes hard limits. Prohibited items blocked at entry include derivatives (absent a separate board-approved Subpart B derivatives policy), subordinated debt, instruments below the four highest NRSRO categories, stripped MBS unless specifically permitted, anything triggering §703.15 prohibitions, and any instrument not on the allow-list. The allow-list and appendix are reviewed at least annually and whenever Part 703 changes materially; both are write-restricted to Compliance with ALCO concurrence.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered for permissibility screen (`trade.permissibility_checked`) | Instrument type and Part 703 category (`position.instrument_type`, `instrument_list.part703_category`), allow-list version (`instrument_list.version`) | Permissibility decision + emitted (`trade.permissibility_checked`) | At trade entry (internal: real-time) |
  | Prohibited/non-permitted instrument attempted (`trade.booked`) | Blocked flag and rule (`trade.blocked_prohibited`), allow-list entry (`instrument_list.part703_category`) | Booking block + emitted (`trade.booked`)… block recorded (`trade.blocked_prohibited`) | At trade entry (internal: real-time) |
  | Annual or Part 703-driven allow-list review (`instrument_list.review_completed`) | Current allow-list (`instrument_list.version`), Part 703 change source (`regulatory.source_doc`) | Reviewed allow-list/appendix + emitted (`instrument_list.review_completed`); review task (`instrument_list.review_due`) | Annually + on material change (enforced by `instrument_list.review_due_at`) |

- **ALERTS/METRICS:** Target zero prohibited or off-allow-list bookings; alert on allow-list review aging (`alert.policy_review_aging` proxy) and on any diversification hard-limit breach observed at booking.

## IP-04 — Interest Rate Risk and ALM Integration

- **WHY (Reg cite):** Part 703 requires analysis of an investment's risk characteristics, including interest-rate and price sensitivity, before purchase and on an ongoing basis ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)); IRR integration with ALM follows NCUA Examiner's Guide (Investment Analysis & Liquidity) expectations.
- **SYSTEM BEHAVIOR:** The system captures effective duration, convexity, and cash-flow vectors per security (`position.effective_duration`, `position.convexity`) and feeds ALM models for IRR measurement. The primary analytical tool is prospective, scenario-based total return analysis (income simulation to a horizon combined with projected market value / EVE), used to compare unlike cash flows across common time, rate, and assumption denominators; management evaluates plausible rate scenarios rather than predicting rates. ALCO runs IRR simulations at least quarterly, more often when thresholds are breached. The aggregate price depreciation of the combined AFS/HTM portfolio under parallel +100/+200/+300 bps shifts may not exceed 30% of Net Worth; this is computed at least quarterly and reported to ALCO and the Board. Scenario assumptions are write-restricted to ALCO/Treasury with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly IRR cycle opens (`alm.scenario_set`) | Rate scenarios and assumptions (`stress.behavioral_assumptions`), per-security analytics (`position.effective_duration`, `position.convexity`) | IRR scenario set + emitted (`alm.scenario_set`) | Quarterly (internal: quarter open) |
  | IRR simulation runs (`alm.irr_simulation_completed`) | Cash-flow vectors and yield curve (`market.yield_curve`), per-position analytics (`position.analytics_updated`) | Total-return / IRR results + emitted (`alm.irr_simulation_completed`); simulation task (`alm.irr_simulation_due`) | Quarterly; sooner on breach (enforced by `alm.irr_simulation_due_at`) |
  | Market depreciation limit computed (`portfolio.stress_test_completed`) | Portfolio fair values (`position.fair_value`), Net Worth (`capital.tier1_total` proxy / `cda.net_worth`) | Depreciation report vs. 30% NW + emitted (`portfolio.stress_test_completed`); stress task (`portfolio.stress_test_due`) | At least quarterly (enforced by `portfolio.stress_test_due_at`) |
  | Threshold approaching/breached (`analytics.threshold_breached`) | Breach detail (`analytics.breach_detail`), depreciation as % NW | Ad-hoc rerun + emitted (`stress.adhoc_rerun_issued`) | On breach (internal: same business day) |

- **ALERTS/METRICS:** Alert when aggregate depreciation approaches 30% of Net Worth and on IRR-simulation aging; track distribution of effective duration and convexity by segment; target zero quarters without a completed IRR simulation.

## IP-05 — Credit Risk Standards and Downgrade Management

- **WHY (Reg cite):** Part 703 requires independent credit analysis and limits reliance on NRSRO ratings ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6)); supervisory expectations on independent internal credit analysis follow NCUA LCU 2013-05, and ongoing risk analysis follows [§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12).
- **SYSTEM BEHAVIOR:** For all investments not directly U.S.-government guaranteed, the system requires a completed credit file and approval before booking, demonstrating investment grade (adequate issuer capacity, low default risk, full and timely repayment). Management performs independent internal credit analysis; NRSRO ratings may support but not be the sole basis, and the credit union generally will not purchase below the four highest NRSRO categories. Per-instrument due-diligence factors apply (municipal GO/revenue spread, default, capacity, demographics, budget/revenue strength; private-label MBS/ABS tranche position, waterfall, loss-allocation, enhancement, underwriting, subordination, adverse-scenario analysis; corporate spread/default/capacity; commercial paper investment-grade confirmation). Documented re-analysis is completed at least annually. Downgrades from the internal investment-grade threshold are reviewed within 5 business days, with board notification for material positions. The credit file and internal rating are write-restricted to Credit/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Eligible non-government investment proposed (`trade.entered`) | Issuer analysis and internal rating (`credit_file.issuer_analysis`, `credit_file.internal_rating`), instrument type (`position.instrument_type`) | Approved credit file + emitted (`credit_file.approved`) | Before booking (internal: pre-settlement) |
  | Annual credit re-analysis cycle (`credit_file.reanalysis_completed`) | Updated issuer analysis (`credit_file.issuer_analysis`), current rating (`credit_file.internal_rating`) | Re-analysis record + emitted (`credit_file.reanalysis_completed`); reanalysis task (`credit_file.reanalysis_due`) | At least annually (enforced by `credit_file.reanalysis_due_at`) |
  | Credit downgrade detected (`security.downgraded`) | Rating change (`security.rating_change`), position identifier (`position.cusip`) | Downgrade flag + emitted (`security.downgraded`) | At detection (internal: same day) |
  | Downgrade review performed (`security.downgrade_reviewed`) | Downgrade assessment (`credit_file.issuer_analysis`), materiality (`policy.materiality_threshold`) | Downgrade review + board notice if material + emitted (`security.downgrade_reviewed`); review task (`security.downgrade_review_due_at`) | Within 5 business days (enforced by `security.downgrade_review_due_at`) |

- **ALERTS/METRICS:** Target zero non-government bookings without an approved credit file; alert on downgrade-review aging beyond 5 business days and on overdue annual re-analyses; track count of positions below internal investment-grade threshold.

## IP-06 — Liquidity and Marketability Limits

- **WHY (Reg cite):** Part 703 requires the policy to address liquidity and marketability of investments ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); the portfolio is a core contingent liquidity source under [§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12).
- **SYSTEM BEHAVIOR:** The system classifies each investment by liquidity bucket, days-to-liquidate, and stress haircut (`position.liquidity_bucket`, `position.days_to_liquidate`, `position.stress_haircut`) and reports on-demand and 30-day stress liquidity capacity at least monthly, more frequently under stress. The portfolio must remain sufficiently liquid to meet reasonably anticipated funding demands and must consist largely of securities with active secondary or resale markets; AFS securities may be sold before maturity to provide liquid funds as needed. Liquidity classifications and haircut tables are write-restricted to Treasury/ALCO with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Position classified for liquidity (`position.liquidity_classified`) | Liquidity bucket, days-to-liquidate, stress haircut (`position.liquidity_bucket`, `position.days_to_liquidate`, `position.stress_haircut`) | Liquidity classification + emitted (`position.liquidity_classified`); classification task (`position.liquidity_classification_due`) | At booking and on refresh (internal: T+0) |
  | Monthly liquidity capacity reporting (`liquidity.capacity_report_issued`) | HQLA and net outflows (`liquidity.hqla_balance`, `liquidity.net_outflows_30d`), haircut table (`liquidity.haircut_table`) | Liquidity capacity report + emitted (`liquidity.capacity_report_issued`); report task (`liquidity.report_due`) | Monthly; more under stress (enforced by `liquidity.report_due_at`) |
  | Large outflow or marketability stress detected (`liquidity.large_flow_detected`) | Flow magnitude (`flow.amount`, `flow.direction`), market depth (`market.depth_indicator`) | Stress liquidity rerun + emitted (`liquidity.report_published`) | On detection (internal: same business day) |

- **ALERTS/METRICS:** Alert on low headroom (`alert.headroom_low`) and survival-days below threshold (`alert.survival_low`); track distribution of days-to-liquidate and the share of portfolio in active-secondary-market buckets; target zero months without a liquidity capacity report.

## IP-07 — Concentration and Counterparty Limits

- **WHY (Reg cite):** Part 703 requires concentration limits addressing single/related issuer, sector, and similar-risk characteristics ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); permissible deposit/counterparty limits follow [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14).
- **SYSTEM BEHAVIOR:** The system maintains parameterized issuer, sector, rating, product, and counterparty limits with soft (warning) and hard (blocking) enforcement at trade entry. Concentration limits address single or related issuer, geographic area, and obligations with similar cash-flow or risk characteristics. The diversification limits table in IP-03 constitutes the hard limits; ALCO may establish tighter operating limits by sector periodically. Limits are reviewed at least annually. Limit parameters are write-restricted to ALCO/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered for concentration check (`trade.limit_checked`) | Proposed exposure by issuer/sector/counterparty (`exposure.by_issuer`, `exposure.by_sector`, `exposure.by_counterparty`), limit set (`limit_set.parameters`) | Concentration decision + emitted (`trade.limit_checked`) | At trade entry (internal: real-time) |
  | Soft limit approached (`trade.limit_warning_issued`) | Computed concentration (`concentration.computed`), warning threshold (`limit_set.parameters`) | Warning + emitted (`trade.limit_warning_issued`) | At trade entry (internal: real-time) |
  | Hard limit breached at entry (`trade.booked`) | Limit-exceeded flag (`concentration.limit_exceeded`, `trade.limit_blocked`), excess amount (`concentration.excess_amount`) | Booking block + emitted (`trade.booked`)… block recorded (`trade.limit_blocked`) | At trade entry (internal: real-time) |
  | Annual limit review / waiver decision (`limit_set.review_completed`) | Limit parameters (`limit_set.parameters`), waiver terms if any (`concentration.waiver_terms`) | Reviewed limits + emitted (`limit_set.review_completed`); review task (`limit_set.review_due`); waiver decision (`concentration.waiver_decided`) | At least annually (enforced by `limit_set.review_due_at`) |

- **ALERTS/METRICS:** Alert on concentration breach (`alert.concentration_breach`); track top-10 issuer/sector exposures (`concentration.top10`) versus limits and count of soft warnings escalating to blocks; target zero hard-limit breaches booked.

## IP-08 — Approved Brokers, Dealers, and Safekeepers

- **WHY (Reg cite):** Part 703 requires board-approved broker-dealer due diligence ([§703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8)) and safekeeping of investments with approved agents, including reconciliation of safekeeping statements ([§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9), specifically [§703.9(c)](https://www.ecfr.gov/current/title-12/part-703/section-703.9)).
- **SYSTEM BEHAVIOR:** The system maintains an approved intermediaries list with due-diligence and review dates (`intermediary.approved_list`, `intermediary.due_diligence_file`) and blocks trades with unapproved intermediaries at entry. Dealer analysis covers capital/liquidity/operating results, reputation and fair dealing, regulator/SRO (e.g., FINRA) enforcement information, and sales-representative experience. The board reviews and approves the dealer list at least annually and approves safekeeping agents. Purchased securities are not maintained with the selling dealer; they are transferred to an approved safekeeping agent per §703.9, and bank records are reconciled to safekeeping-agent statements at least monthly per §703.9(c). The approved-intermediaries list is write-restricted to Compliance with board approval of additions.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered with intermediary (`trade.entered`) | Intermediary identifier and approval status (`trade.intermediary_id`, `intermediary.approved_list`) | Intermediary validation + emitted (`trade.permissibility_checked`)… block if unapproved (`trade.intermediary_blocked`) | At trade entry (internal: real-time) |
  | Annual intermediary due-diligence review (`intermediary.review_completed`) | Due-diligence file (`intermediary.due_diligence_file`), capital/reputation/regulator data | Reviewed dealer record + emitted (`intermediary.review_completed`); review task (`intermediary.review_due`) | Annually (enforced by `intermediary.review_due_at`) |
  | Safekeeping statement received (`safekeeping.statement_received`) | Safekeeping statement (`safekeeping.statement`), book positions (`position.cusip`, `position.book_value`) | Receipt logged + emitted (`safekeeping.statement_received`) | On receipt (internal: T+1) |
  | Monthly safekeeping reconciliation (`safekeeping.reconciliation_completed`) | Statement vs. book positions (`safekeeping.statement`, `position.book_value`) | Reconciliation record + emitted (`safekeeping.reconciliation_completed`); reconciliation task (`safekeeping.reconciliation_due_at`) | Monthly per §703.9(c) (enforced by `safekeeping.reconciliation_due_at`) |

- **ALERTS/METRICS:** Target zero trades with unapproved intermediaries and zero securities held with the selling dealer; alert on intermediary-review aging and on any safekeeping reconciliation variance or aging beyond month-end.

## IP-09 — Repurchase and Reverse Repurchase Agreements

- **WHY (Reg cite):** Part 703 governs repurchase and reverse-repurchase transactions and related collateral/safekeeping requirements ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13), [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)); safe-and-sound collateral, haircut, and maturity-mismatch practices follow NCUA IRPS 1985-2.
- **SYSTEM BEHAVIOR:** The system represents each repo with explicit collateral, haircut, counterparty, and maturity-mismatch fields (`repo.collateral_cusip`, `repo.haircut`, `repo.counterparty_id`, `repo.maturity_mismatch_days`) and treats repos as secured borrowings (a balance-sheet liability while the investment remains an asset). It blocks bookings that violate internal or regulatory mismatch and collateral rules. Baseline maximum maturity is 3 months; maturity-mismatch limits apply per IRPS 1985-2 and Part 703; single issuer limit is 25% of Net Worth. Collateral is marked to market at least weekly (daily under stress) and margin calls are issued on shortfalls. Repo collateral and counterparty parameters are write-restricted to Treasury/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Repo entered for rule check (`repo.entered`) | Collateral, haircut, counterparty, mismatch (`repo.collateral_cusip`, `repo.haircut`, `repo.counterparty_id`, `repo.maturity_mismatch_days`) | Rule decision + emitted (`repo.booked`)… block if violation (`repo.blocked_rule_violation`) | At trade entry (internal: real-time) |
  | Collateral mark-to-market (`collateral.valued`) | Collateral fair value (`collateral.fair_value`), required margin (`repo.required_margin`) | Revaluation record + emitted (`collateral.valued`); revaluation task (`repo.collateral_revaluation_due`) | At least weekly; daily under stress (enforced by `repo.collateral_revaluation_due_at`) |
  | Margin shortfall detected (`repo.margin_shortfall_detected`) | Shortfall amount (`repo.margin_shortfall_amount`), counterparty (`repo.counterparty_id`) | Margin call + emitted (`repo.margin_call_issued`) | On shortfall (internal: same business day) |

- **ALERTS/METRICS:** Alert on mismatch breach (`alert.mismatch_breach`) and unresolved margin shortfalls; track repo single-issuer exposure versus 25% NW limit and maturity-mismatch distribution; target zero repos booked in violation of collateral/mismatch rules.

## IP-10 — Valuation, Accounting, and Fair-Value Measurement

- **WHY (Reg cite):** Part 703 requires periodic valuation of investments and supporting records ([§703.11](https://www.ecfr.gov/current/title-12/part-703/section-703.11)); GAAP/HTM-AFS classification, fair-value measurement, and OTTI follow safe-and-sound accounting expectations referenced in the NCUA Examiner's Guide.
- **SYSTEM BEHAVIOR:** The system captures book value, amortized cost, and fair value per security with pricing source and date (`position.book_value`, `position.amortized_cost`, `position.fair_value`) and updates fair value at least monthly. At purchase each security is classified HTM (positive intent and ability to hold; amortized cost) or AFS (fair value with unrealized gains/losses in members' equity, tax-affected). HTM transfers/sales are rare and documented by the CFO only for the five permitted reasons (≤3 months to maturity/call; <15% of MBS/CMO purchase face remaining; creditworthiness deterioration; major regulatory change; business combination/disposition causing unacceptable A/L position). AFS repositioning is permitted to improve risk/reward, adjust IRR sensitivity, improve liquidity, or improve credit quality. At least quarterly, reported fair values are verified against reputable independent pricing sources, and a security-by-security OTTI evaluation is performed; for loss positions of 10% or more, if it is probable the issuer cannot pay all contractual amounts due, OTTI is recorded and the security is written down to fair value with credit impairment through income. Pricing overrides are restricted to CFO/Controller under dual approval.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Fair value updated (`security.fair_value_updated`) | Pricing source and date (`pricing.source`, `pricing.as_of_date`), book/amortized cost (`position.book_value`, `position.amortized_cost`) | Updated fair value + emitted (`security.fair_value_updated`); update task (`security.fair_value_update_due`) | At least monthly (enforced by `security.fair_value_update_due_at`) |
  | Quarterly fair-value verification (`security.quarter_closed`) | Independent pricing (`cda.independent_pricing` proxy / `pricing.source`), reported fair value (`position.fair_value`) | Fair-value verification + emitted (`security.quarter_closed`) | At least quarterly (internal: quarter close) |
  | OTTI evaluation performed (`security.otti_analysis_completed`) | Loss position and impairment indicator (`security.impairment_indicator_raised`), expected cash flows | OTTI determination + write-down if probable + emitted (`security.otti_analysis_completed`) | Quarterly (internal: quarter close) |
  | Pricing override requested (`pricing.override_requested`) | Override rationale and approver (`pricing.override_rationale`, `pricing.exception_approver`) | Override applied under dual approval + emitted (`pricing.override_applied`) | Before reporting use (internal: same day) |

- **ALERTS/METRICS:** Track count of securities in ≥10% loss positions and OTTI write-downs; alert on stale fair values past monthly update and on pricing overrides lacking dual approval; target zero quarters without independent fair-value verification.

## IP-11 — Pre-Purchase Due Diligence and Exceptions

- **WHY (Reg cite):** Part 703 requires pre-purchase analysis of risk characteristics and supporting documentation ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)), with credit analysis for non-government instruments ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6)) and board-thresholded exception governance ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)).
- **SYSTEM BEHAVIOR:** The system enforces a pre-trade checklist and approval workflow linking each trade to a credit memo and valuation support before booking (other than U.S. government or fully insured instruments). Required purchase documentation includes issuer; security type; CUSIP; issue size; issue/maturity/call dates; coupon and frequency; trade and settlement dates; par, original issue price, and purchase price; prospective total-return profile; yield, duration, and weighted average life; CPR/PSA assumptions (if applicable); credit memo (non-government); AFS/HTM designation; and dealer. Required sale documentation includes issuer; security type; CUSIP; rationale; total-return profile at sale price; trade/settlement dates; coupon; price; yield; par; and dealer. Exceptions are logged with a board-threshold and must be approved before settlement. The exception log and checklist are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Pre-trade checklist completed (`trade.checklist_completed`) | Pre-trade checklist and valuation support (`trade.pretrade_checklist`, `trade.valuation_support`), credit memo (`credit_file.issuer_analysis`) | Completed checklist + emitted (`trade.checklist_completed`) | Before booking (internal: pre-settlement) |
  | Required documentation captured (`document.required_set`) | Purchase/sale documentation fields (`position.cusip`, `position.coupon`, `position.fair_value`, `trade.ticket`) | Documentation set + emitted (`document.required_set`) | Before settlement (internal: pre-settlement) |
  | Checklist exception raised (`trade.checklist_exception_raised`) | Exception rationale and threshold (`exception.rationale`, `policy.exception_threshold`) | Exception log entry + emitted (`trade.exception_logged`) | Before settlement (internal: pre-settlement) |
  | Exception decided (`trade.exception_approved`) | Approver and risk acceptance (`exception.risk_acceptance`, `exception.registered`) | Exception decision + emitted (`trade.exception_approved`) | Before settlement; board reporting if above threshold (internal: pre-settlement) |

- **ALERTS/METRICS:** Target zero non-government trades booked without a credit memo and valuation support; alert on exceptions exceeding board threshold and on aged unapproved exceptions; track exception count by instrument type.

## IP-12 — Ongoing Monitoring, Reporting, and Stress Testing

- **WHY (Reg cite):** Part 703 requires ongoing monitoring and periodic review of the portfolio's risk characteristics ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)) and board reporting under the written policy ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); stress-testing and risk integration follow the NCUA Examiner's Guide (Investment Analysis & Liquidity).
- **SYSTEM BEHAVIOR:** The system generates recurring composition, duration, liquidity, gain/loss, and limit-adherence reports — monthly to management and at least quarterly to the board (monthly preferred) — and runs stress scenarios at least annually, more often as metrics approach limits. The Board receives all purchases; all sales and net gains/(losses); composition; prospective total-return profile; total-return results; yield, current effective duration, and current average life; credit-risk considerations; market appreciation/depreciation; and depreciation as a percent of Net Worth. ALCO receives monthly current and desired composition; prospective total-return profile over one or more horizons; risk analysis; liquidity objectives; total-return results, effective duration, and average life; and net worth levels. Report generation parameters are write-restricted to Finance/Treasury with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly management report (`portfolio.management_report_issued`) | Composition, duration, liquidity, gain/loss, limit adherence (`portfolio.performance_metrics`, `portfolio.gain_loss_summary`) | Management report + emitted (`portfolio.management_report_issued`); report task (`portfolio.report_due`) | Monthly (enforced by `portfolio.report_due_at`) |
  | Board portfolio report (`portfolio.board_report_issued`) | Board report inputs (`portfolio.performance_metrics`), depreciation as % NW (`cda.net_worth`) | Board report + emitted (`portfolio.board_report_issued`); board report task (`portfolio.board_report_due`) | At least quarterly (enforced by `portfolio.board_report_due_at`) |
  | Stress test cycle (`portfolio.stress_test_completed`) | Stress assumptions (`stress.behavioral_assumptions`), portfolio positions (`position.fair_value`) | Stress test results + emitted (`portfolio.stress_test_completed`); stress task (`portfolio.stress_test_due`) | At least annually; more as limits approach (enforced by `portfolio.stress_test_due_at`) |

- **ALERTS/METRICS:** Alert on report aging (management monthly, board quarterly) and stress-test aging; target zero months without a management report and zero quarters without a board report; track frequency of off-cycle stress runs triggered by limit proximity.

## IP-13 — Performance Measurement and Benchmarks

- **WHY (Reg cite):** Part 703 requires the policy to address how investment performance and risk characteristics are evaluated against objectives ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3), [§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)); performance discipline supports safe-and-sound expectations in the NCUA Examiner's Guide.
- **SYSTEM BEHAVIOR:** The system attributes return and income to benchmarks by segment quarterly and ensures performance targets do not incentivize breaching risk limits. Total return analysis — combining income simulation with projected market value at the horizon — is the primary tool for evaluating performance and comparing unlike cash flows across rate scenarios, supporting ALCO's assessment of whether the portfolio's risk/reward profile is consistent with approved strategy. Performance targets and benchmark definitions are write-restricted to ALCO with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly performance attribution (`performance.attribution_completed`) | Segment benchmarks and total-return inputs (`performance.targets`, `portfolio.performance_metrics`) | Attribution report + emitted (`performance.attribution_completed`); attribution task (`performance.attribution_due`) | Quarterly (enforced by `performance.attribution_due_at`) |
  | Performance target change proposed (`performance.target_change_proposed`) | Proposed targets (`performance.targets`), risk-limit context (`limit_set.parameters`) | Target proposal + emitted (`performance.target_change_proposed`) | Before adoption (internal: prior to use) |
  | Target risk review (`performance.target_risk_reviewed`) | Targets vs. risk limits (`performance.targets`, `risk_appetite.document`) | Risk-alignment review + emitted (`performance.target_risk_reviewed`) | At target change and annually (internal: with attribution cycle) |

- **ALERTS/METRICS:** Track total-return attribution by segment versus benchmarks; alert on any performance target that conflicts with a risk limit; target zero quarters without a completed attribution.

## IP-14 — Trade Execution, Controls, and Segregation of Duties

- **WHY (Reg cite):** Part 703 requires internal controls including segregation of duties over investment functions ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)) and prohibits conflicts of interest in execution ([§703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17)).
- **SYSTEM BEHAVIOR:** The system segregates trade initiation, approval, confirmation, settlement, and accounting; it enforces dual control and blocks any single user from controlling a full transaction lifecycle. Trades reconcile within T+1, matching confirmations to tickets and settlement records. Segregation-of-duties matrix and dual-control configuration are write-restricted to Compliance/IT, with overrides requiring senior approval.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade lifecycle step attempted (`trade.step_recorded`) | Step and acting user role (`trade.step_attempted`, `user.role`), SoD matrix (`sod.matrix_version`) | Step record + emitted (`trade.step_recorded`)… block on SoD conflict (`trade.sod_blocked`) | Per step (internal: real-time) |
  | Confirmation received and matched (`trade.confirmation_received`) | Dealer confirmation terms (`confirmation.terms`), trade ticket (`trade.ticket`) | Matched confirmation + emitted (`trade.confirmation_received`)… discrepancy flag (`trade.confirmation_discrepancy_flagged`) | On receipt (internal: T+0) |
  | T+1 trade reconciliation (`trade.reconciliation_completed`) | Tickets, confirmations, settlement (`trade.ticket`, `trade.settlement_amount`, `trade.settlement_date`) | Reconciliation record + emitted (`trade.reconciliation_completed`); reconciliation task (`trade.reconciliation_due_at`) | Within T+1 (enforced by `trade.reconciliation_due_at`) |

- **ALERTS/METRICS:** Target zero single-user full-lifecycle transactions and zero T+1 reconciliation breaks left unresolved; alert on confirmation discrepancies and SoD-block attempts; track time-to-reconcile distribution.

## IP-15 — Recordkeeping and Documentation Retention

- **WHY (Reg cite):** Part 703 requires recordkeeping for investment transactions and supporting documentation ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4)) and safekeeping documentation ([§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9)).
- **SYSTEM BEHAVIOR:** The system stores and indexes trade tickets, confirmations, credit memos, approvals, safekeeping statements, and reports with retention schedules; documents must be attached to trades within 2 business days of booking. Retention schedules comply with applicable NCUA and federal record-retention requirements (general retention schedules are governed by the Record Retention Policy). Document indexing and retention metadata are write-restricted to Compliance/Records.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade booked requiring documentation (`trade.booked`) | Document set and trade reference (`document.subject_ref`, `trade.ticket`) | Required-document checklist + emitted (`document.required_set`); attachment task (`document.attachment_due_at`) | Within 2 business days (enforced by `document.attachment_due_at`) |
  | Document attached and indexed (`document.disposition_recorded`) | Document type and retention schedule (`document.type`, `document.retention_schedule`, `document.retention_anchor`) | Indexed record + emitted (`document.disposition_recorded`); retention timer (`record.retention_expires_at`) | At attachment (internal: T+2) |
  | Retention expires (`document.retention_expired`) | Retention class and disposal eligibility (`record.retention_class`, `record.disposal_eligible`) | Disposition record + emitted (`document.retention_expired`); purge task (`retention.purge_due`) | Per retention schedule (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Target zero trades with documents unattached beyond 2 business days; alert on retention-schedule gaps and on documents under legal hold approaching purge; track indexing completeness rate.

## IP-16 — Training, Competency, and Conflicts of Interest

- **WHY (Reg cite):** Part 703 prohibits conflicts of interest for persons involved in investment decisions ([§703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17)) and presumes competent administration under the written policy ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)).
- **SYSTEM BEHAVIOR:** The system tracks required training and annual conflict-of-interest (COI) certifications for covered staff and board members, requires training before granting system access, and auto-suspends access on non-completion. Covered persons are designated and rostered; COI disclosures and recusals are recorded. Training records, COI register, and access provisioning are write-restricted to Compliance/HR.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered person hired/designated for covered role (`hr.user.hired_covered_role`) | Covered-person designation and role (`covered_person.designated`, `user.role`) | Training assignment + access gate + emitted (`training.assigned`); onboarding task (`training.onboarding_due_at`) | Before system access (enforced by `training.onboarding_due_at`) |
  | Annual training/COI cycle opens (`training.annual_cycle_opened`) | Curriculum and assignees (`training.required_curriculum`, `training.assignee_id`) | Annual assignment + emitted (`training.annual_assigned`); annual task (`training.annual_due`) | Annually (enforced by `training.annual_due_at`) |
  | COI certification submitted (`coi.certified`) | Questionnaire responses and conflicts (`coi.questionnaire_responses`, `coi.conflict_identified`) | COI certification + emitted (`coi.certified`); questionnaire task (`coi.certification_due`) | Annually (enforced by `coi.questionnaire_due_at`) |
  | Training/COI not completed (`training.lapsed`) | Lapse flag and access linkage (`training.lapsed`, `access.role_id`) | Access auto-suspension + emitted (`access.deprovisioned`) | On lapse (internal: same day) |

- **ALERTS/METRICS:** Target 100% training completion before access and zero overdue annual COI certifications; alert on lapsed-training access not suspended; track conflicts identified and recusals executed.

## IP-17 — Contingency Planning and Liquidity Stress Events

- **WHY (Reg cite):** NCUA requires a Contingency Funding Plan and liquidity stress provisions by asset tier ([§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)); the investment portfolio's marketability supports contingent liquidity under Part 703 ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)).
- **SYSTEM BEHAVIOR:** The system maintains predefined liquidity stress scenarios and an investment-liquidation hierarchy tied to the Contingency Funding Plan (CFP) (`cfp.liquidation_hierarchy`), tests them at least annually, and documents an initial execution plan within 1 business day of an actual stress declaration. The portfolio is structured so a sufficient tranche of AFS securities can be liquidated under stress to meet contingent funding needs without fire-sale pricing. Enterprise CFP governance is owned by the Liquidity Policy; this control covers only the investment-portfolio liquidation linkage. CFP investment scenarios and liquidation hierarchy are write-restricted to Treasury/ALCO with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Liquidity stress declared (`liquidity.stress_declared`) | Stress driver and affected positions (`liquidity.behavioral_assumptions`, `position.liquidity_bucket`) | Stress declaration logged + emitted (`liquidity.stress_declared`) | On declaration (internal: same day) |
  | Initial execution plan documented (`cfp.investment_test_completed` proxy) | Liquidation hierarchy and AFS tranche (`cfp.liquidation_hierarchy`, `cfp.execution_plan_documented`) | Execution plan + emitted (`liquidity.cfp_activated`); execution-plan task (`cfp.execution_plan_due_at`) | Within 1 business day (enforced by `cfp.execution_plan_due_at`) |
  | Annual CFP investment liquidation test (`cfp.investment_test_completed`) | Test scenario and hierarchy (`cfp.liquidation_hierarchy`, `stress.behavioral_assumptions`) | Test results + emitted (`cfp.investment_test_completed`); test task (`cfp.investment_test_due`) | At least annually (enforced by `cfp.investment_test_due_at`) |

- **ALERTS/METRICS:** Alert on survival-days below threshold (`alert.survival_low`) and on overdue CFP investment tests; target zero stress declarations without a documented execution plan within 1 business day; track liquidatable AFS tranche capacity under stress.

## IP-18 — Policy Review, Amendments, and Version Control

- **WHY (Reg cite):** Part 703 requires periodic board review and updating of the written investment policy ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)), with currency to Part 703 changes ([§703.13–§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.13)).
- **SYSTEM BEHAVIOR:** The system maintains full version history, redlines, and approval metadata (`policy.document_version`, `policy.draft_redline`, `policy.board_approved_at`), reviewing the policy at least annually (not to exceed 12 months between board approvals) and earlier on material regulatory change to Part 703 or related guidance. Material regulatory-change detection feeds an amendment workflow. Version history and approval metadata are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Material regulatory change identified (`regulatory.change_analysis_logged`) | Change source and applicability (`regulatory.source_doc`, `regulatory.change_required`) | Change analysis + amendment trigger + emitted (`policy.material_change_flagged`) | On identification (internal: prompt) |
  | Policy amendment proposed (`policy.amendment_proposed`) | Draft redline and rationale (`policy.draft_redline`, `policy.change_rationale`) | Redline record + emitted (`policy.redline_recorded`) | Before board action (internal: prior to meeting) |
  | Board approves revised policy (`policy.board_approved`) | Approved version and minutes (`policy.document_version`, `policy.minutes_reference`) | Approved version published + emitted (`policy.version_published`); review task (`policy.review_due`) | ≤ 12 months between approvals (enforced by `policy.next_review_at`) |

- **ALERTS/METRICS:** Alert on policy-review aging (`alert.policy_review_aging`) at 60/30 days; target zero approvals exceeding 12 months and zero material Part 703 changes without a logged amendment analysis; track time from change detection to board adoption.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Governance of these controls is centralized with the CCO.
- **Required participants:** Chief Financial Officer / Chief Investment Officer (primary investment officer), ALCO/Investment Committee, Treasury, Risk, Finance, and Internal Audit/Supervisory Committee.
- **Approvals:** Board approves the Investment Policy and authority matrix at least annually (not to exceed 12 months), the securities-dealer list, and safekeeping agents. ALCO approves operating strategies and tighter sector limits. This version is approved by Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual board review (≤ 12 months between approvals) and earlier on material Part 703 or related-guidance change; see [IP-18](#ip-18-policy-review-amendments-and-version-control) and the [Timing Matrix](#timing-matrix).
- **Cross-references (out of scope here):** Derivatives Policy (Part 703 Subpart B); NDIP/retail investment sales policy; Liquidity Policy (enterprise CFP); Capitalization and Basel-II Standardized Approach Framework Policies; Record Retention Policy; Third-Party Risk Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The investment-side resources, fields, events, and timers referenced throughout the control overlays (e.g., `position.*`, `trade.*`, `repo.*`, `safekeeping.*`, `intermediary.*`, `instrument_list.*`, `security.*`, `alm.*`, `portfolio.*`, `performance.*`, `cfp.*`, `policy.*`) are drawn from the registered core vocabulary where one fits; where the registered spec lacks a precise match the closest registered or provisional code was reused rather than re-coined. Names will be confirmed by engineering before the next review.
- **Net Worth field mapping unconfirmed.** Diversification and market-depreciation limits are expressed as a percent of Net Worth, but the vocabulary registers capital components under `capital.*` and a `cda.net_worth` field; the canonical Net Worth source field for investment limit calculations needs engineering confirmation.
- **Per-instrument parameters appendix.** The baseline single-security, single-issuer, maximum-maturity, and maximum-WAL limits per category live in a permissible-instruments appendix referenced by [IP-03](#ip-03-permissible-investments-and-prohibited-activities); the structured representation of those parameters (instrument-list entries) must be registered by engineering. Mutual funds, banker's acceptances, permissible stock, and CRA investments from the reference policy were intentionally omitted as not articulated in Patrick's notes for Pynthia; confirm whether any should be added to the allow-list.
- **Tax objective omitted.** The reference (bank) policy's "Manage Tax Liabilities" objective and "bank-qualified"/national-bank stock provisions were dropped because Part 703 and the credit-union charter make them inapplicable; confirm no tax-driven municipal strategy is intended.
- **Charter and §741.12 tier.** This policy assumes Pynthia is a federally insured credit union subject to NCUA Part 703 and §741.12; the applicable liquidity asset-tier requirements under §741.12 (and any state-charter §741.3 nonconforming-investment reserve treatment) should be confirmed for [IP-17](#ip-17-contingency-planning-and-liquidity-stress-events).
- **Stress and depreciation tax-affecting.** The reference policy tax-affected the 30%-of-Net-Worth depreciation calculation; for a credit union the depreciation limit is stated against Net Worth without a bank tax-rate adjustment — confirm the intended tax treatment in [IP-04](#ip-04-interest-rate-risk-and-alm-integration).
- **Repo maturity-mismatch parameters.** The specific maturity-mismatch limits under IRPS 1985-2 referenced in [IP-09](#ip-09-repurchase-and-reverse-repurchase-agreements) are applied as a baseline (3-month maximum maturity, 25% NW single-issuer); the exact mismatch thresholds and stress-frequency (daily vs. weekly) trigger definitions need ALCO/engineering confirmation.
