```yaml
---
title: Investment Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Investment Policy, Part 703, NCUA, ALM, Liquidity, Credit Risk]
---
```

# Investment Policy

## General Policy Statement

Pynthia Credit Union ("the Credit Union") maintains a written Investment Policy governing the acquisition, holding, monitoring, and disposition of all balance-sheet investment positions — including securities, repurchase and reverse repurchase agreements, certificates of deposit, fed funds, and other non-loan asset placements — whether executed directly or through approved intermediaries. The policy pursues five objectives in priority order: safety of principal, adequate liquidity, mitigation of interest rate risk, reasonable risk-adjusted earnings, and support for pledging requirements. All investment activity must be permissible under the Federal Credit Union Act and [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703), conducted consistent with safe and sound practices, and executed within board-approved authority limits. This policy does not authorize derivative activity under Part 703 Subpart B or retail nondeposit investment product programs; those require separate board-approved policies.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Policy review warning — 60 days | 60 days before `policy.next_review_at` | 60 days prior | Board approval required | [IP-01](#ip-01-policy-record-objectives-and-scope) |
| Policy review warning — 30 days | 30 days before `policy.next_review_at` | 30 days prior | Board approval required | [IP-01](#ip-01-policy-record-objectives-and-scope) |
| Policy review lapsed without approval | `policy.next_review_at` passes without `policy.board.approved` | Immediate flag | Prior policy governs; non-compliant flag | [IP-01](#ip-01-policy-record-objectives-and-scope) |
| Board annual policy approval | Board meeting cycle | ≤ 12 months from last approval | Full policy + authority matrix | [IP-02](#ip-02-governance-board-oversight-and-delegations) |
| Board quarterly investment report | Quarter-end | Quarterly (monthly preferred) | Purchases, sales, composition, duration, gain/loss, credit, market depreciation | [IP-12](#ip-12-ongoing-monitoring-reporting-and-stress-testing) |
| ALCO monthly investment report | Month-end | Monthly | Composition, total return, duration, avg life, liquidity, net worth | [IP-12](#ip-12-ongoing-monitoring-reporting-and-stress-testing) |
| Pre-trade permissibility check | Trade entry (`trade.entered`) | Before booking | Allow-list check; block if prohibited | [IP-03](#ip-03-permissible-investments-and-prohibited-activities) |
| Concentration limit check at trade entry | Trade entry (`trade.entered`) | Before booking | Hard-block if limit breached; warning at soft limit | [IP-07](#ip-07-concentration-and-counterparty-limits) |
| Intermediary validation at trade entry | Trade entry (`trade.entered`) | Before booking | Block if not on approved list | [IP-08](#ip-08-approved-brokers-dealers-and-safekeepers) |
| IRR depreciation stress test | Quarter-end | Quarterly | +100/+200/+300 bp parallel shift; ≤ 30% of Net Worth | [IP-04](#ip-04-interest-rate-risk-and-alm-integration) |
| ALM IRR simulation | Quarter-end (more often if thresholds breached) | Quarterly minimum | Duration, convexity, cash-flow vectors fed to ALM | [IP-04](#ip-04-interest-rate-risk-and-alm-integration) |
| Credit file required before non-government purchase | Trade entry for non-government instrument | Before booking | Credit memo + investment-grade determination | [IP-05](#ip-05-credit-risk-standards-and-downgrade-management) |
| Annual credit re-analysis | 12 months from last analysis | Annually | Full credit file refresh per instrument type | [IP-05](#ip-05-credit-risk-standards-and-downgrade-management) |
| Downgrade review | Rating downgrade detected (`security.downgraded`) | 5 business days | Board notification if material position | [IP-05](#ip-05-credit-risk-standards-and-downgrade-management) |
| Liquidity classification update | Position booked or monthly cycle | Monthly | Bucket, days-to-liquidate, stress haircut | [IP-06](#ip-06-liquidity-and-marketability-limits) |
| Liquidity stress capacity report | Month-end | Monthly (more often under stress) | On-demand and 30-day stress capacity | [IP-06](#ip-06-liquidity-and-marketability-limits) |
| Repo collateral mark-to-market | Weekly (daily under stress) | Weekly / daily | Fair value vs. required margin; margin call if shortfall | [IP-09](#ip-09-repurchase-and-reverse-repurchase-agreements) |
| Fair value update | Month-end | Monthly | Pricing source, date, fair value per position | [IP-10](#ip-10-valuation-accounting-and-fair-value-measurement) |
| OTTI quarterly evaluation | Quarter-end | Quarterly | Security-by-security; write-down if ≥ 10% loss and probable default | [IP-10](#ip-10-valuation-accounting-and-fair-value-measurement) |
| Pre-trade checklist and credit memo | Trade entry (non-government) | Before booking | Full required-field checklist; exception log if waived | [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions) |
| Portfolio stress test | Annually (more often as metrics approach limits) | Annually minimum | Scenario set; results to ALCO and Board | [IP-12](#ip-12-ongoing-monitoring-reporting-and-stress-testing) |
| Performance attribution | Quarter-end | Quarterly | Benchmark attribution by segment | [IP-13](#ip-13-performance-measurement-and-benchmarks) |
| Trade reconciliation | Trade settlement | T+1 | Confirmation match; discrepancy flag | [IP-14](#ip-14-trade-execution-controls-and-segregation-of-duties) |
| Document attachment to trade | Trade booked or sold | 2 business days | Trade ticket, confirmation, credit memo, approvals | [IP-15](#ip-15-recordkeeping-and-documentation-retention) |
| Annual training and COI certification | Annual cycle open | Annually | Covered staff and board members | [IP-16](#ip-16-training-competency-and-conflicts-of-interest) |
| CFP investment-liquidation test | Annually | Annually | Stress scenario; execution plan within 1 BD of actual stress declaration | [IP-17](#ip-17-contingency-planning-and-liquidity-stress-events) |
| Policy version control and amendment | Material regulatory change or annual cycle | ≤ 12 months | Redline, approval metadata, version history | [IP-18](#ip-18-policy-review-amendments-and-version-control) |

---

## IP-01 — Policy Record, Objectives, and Scope {#ip-01-policy-record-objectives-and-scope}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires every federal credit union to maintain a written investment policy approved by the board of directors. The policy must address the credit union's investment objectives and the types of investments authorized.

**SYSTEM BEHAVIOR:** The system maintains a single canonical Investment Policy record (`policy`) tagged with effective date, next-review date, version, and owner. Every balance-sheet position (`position`) is tagged `position.policy_tagged` to this record at booking. The scheduler fires review-warning alerts at 60 and 30 days before `policy.next_review_at`; if the board approval event (`policy.board.approved`) does not arrive before that date, the policy record is flagged `policy.review_lapsed` and all positions remain governed by the prior approved version but are marked non-compliant. The five investment objectives — earnings, liquidity, interest rate risk mitigation, safety of principal, and pledging — are stored as structured attributes of the policy record and are not editable outside a formal amendment workflow. The policy record is write-restricted to Compliance; read access is unrestricted.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Policy record created or amended (`policy.amendment.proposed`) | Draft text (`policy.draft_redline`), change rationale (`policy.change_rationale`), owner reference (`policy.owner_ref`) | Draft policy record + `policy.redline.recorded` | Before board submission |
| Board approves policy (`policy.board.approved`) | Board resolution ID (`board.resolution_id`), meeting date (`board.meeting_date`), approver ID (`policy.approver_id`), effective date (`policy.effective_date`), next review date (`policy.next_review_at`) | Approved policy version + `policy.version.approved`; next-review timer set (`policy.review.due_at`) | ≤ 12 months from prior approval (enforced by `policy.review.due_at`) |
| 60-day review warning fires (`policy.review_warning.issued`) | `policy.next_review_at`, `policy.review_warning_at` | Warning alert to CCO and CFO + `policy.review_warning.issued` | 60 days before `policy.next_review_at` |
| 30-day review warning fires (`policy.review_warning.issued`) | `policy.next_review_at`, `policy.review_warning_at` | Warning alert to CCO and CFO + `policy.review_warning.issued` | 30 days before `policy.next_review_at` |
| Review lapses without board approval (`policy.review_lapsed`) | `policy.next_review_at` passed, no `policy.board.approved` received | Non-compliant flag on policy record + `policy.noncompliance.flagged`; positions remain governed by prior version | Immediate on lapse date |
| Position booked (`position.booked`) | CUSIP (`position.cusip`), instrument type (`position.instrument_type`), policy version (`policy.document_version`) | Position tagged to policy + `position.booked` with `position.policy_tagged` set | At booking |

**ALERTS/METRICS:** Alert fires at 60 and 30 days before `policy.next_review_at`; target zero positions with `policy.review_lapsed = true`. Monitor count of positions missing `position.policy_tagged`; target zero.

---

## IP-02 — Governance, Board Oversight, and Delegations {#ip-02-governance-board-oversight-and-delegations}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires board approval of the investment policy and the authority structure governing investment decisions. NCUA Examiner's Guide expectations require documented delegation of authority with defined limits by role.

**SYSTEM BEHAVIOR:** The system maintains an authority matrix (`authority_matrix`) defining single-trade and aggregate monthly purchase/sale limits by role (Board, President/CEO, ALCO, CFO/CIO). Each trade (`trade`) is linked to an authorized approver; trades exceeding the CFO's aggregate calendar-month limit are blocked (`trade.limit.blocked`) until President/CEO or ALCO approval is recorded. Exceptions must be documented and approved before settlement. The Board reviews and approves the authority matrix at least annually alongside the policy. ALCO convenes at least monthly to develop strategy, monitor activity, ensure compliance, review economic conditions, and report to the Board. The Board reviews investment activity and summary reports at least quarterly (monthly preferred). The authority matrix is write-restricted to Compliance with CFO concurrence; trade approval fields are write-restricted to the designated approver role.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Authority matrix reviewed and approved by Board (`authority.matrix.updated`) | Role limit schedule (`authority_matrix.role_limits`), board resolution ID (`board.resolution_id`), finance concurrence (`authority.finance_concurrence`), change rationale (`authority.change_rationale`) | Updated authority matrix + `authority.matrix.updated` | Annually, concurrent with policy approval |
| Trade submitted for approval (`trade.approval.requested`) | Trade details (`trade.ticket`), instrument type (`trade.instrument_type`), settlement amount (`trade.settlement_amount`), intermediary ID (`trade.intermediary_id`), approver role from matrix (`authority_matrix.role_limits`) | Approval request logged + `trade.approval.requested` | Before settlement |
| Trade approved (`trade.approval.recorded`) | Approver ID, approval rationale, trade ID | Approval recorded + `trade.approval.recorded` | Before settlement |
| CFO aggregate monthly limit approached or breached (`trade.limit_warning.issued` / `trade.limit.blocked`) | Running monthly aggregate (`trade.settlement_amount` sum), limit from matrix (`authority_matrix.role_limits`) | Warning or block event + `trade.limit_warning.issued` or `trade.limit.blocked`; escalation to President/CEO or ALCO | At trade entry; block enforced before booking |
| Exception documented and approved (`trade.exception.approved`) | Exception rationale (`trade.exception_raised`), approver ID, trade ID | Exception log entry + `trade.exception.approved` | Before settlement |
| ALCO monthly meeting convened (`alco.meeting_convened`) | Strategy memo, risk attribute summary, compliance status, economic review | ALCO minutes + `alco.ratio_review.logged` | Monthly |
| Board quarterly investment report delivered (`portfolio.board_report.issued`) | Purchases, sales, gain/loss, composition, total return, duration, avg life, credit risk, market depreciation, depreciation as % of Net Worth | Board report package + `portfolio.board_report.issued` | Quarterly (monthly preferred; enforced by `portfolio.board_report_due_at`) |

**ALERTS/METRICS:** Alert on any trade where `trade.approval` is absent at settlement; target zero. Alert when CFO aggregate monthly volume reaches 80% of matrix limit. Monitor ALCO meeting cadence; alert if gap exceeds 35 days.

---

## IP-03 — Permissible Investments and Prohibited Activities {#ip-03-permissible-investments-and-prohibited-activities}

**WHY (Reg cite):** [12 CFR §§703.13–703.14](https://www.ecfr.gov/current/title-12/part-703) enumerate permissible investment categories and instruments for federal credit unions. [12 CFR §703.15](https://www.ecfr.gov/current/title-12/part-703) prohibits specific activities including derivatives (absent a separate board-approved derivatives policy under Subpart B), subordinated debt, and non-investment-grade instruments.

**SYSTEM BEHAVIOR:** The system maintains a versioned allow-list (`instrument_list`) mapping each permitted instrument type to its Part 703 category (`instrument_list.part703_category`), portfolio diversification limits (max % of portfolio, max % of Net Worth), and instrument-level parameters (single-security limit, single-issuer limit, maximum maturity, maximum weighted average life). At trade entry, the system checks `trade.permissibility` against the allow-list and the diversification limits table; instruments not on the list or that would breach a hard limit are blocked (`trade.blocked_prohibited`). Soft limits trigger a warning (`trade.limit_warning`). The allow-list is reviewed at least annually and whenever Part 703 changes materially; the review produces a new versioned `instrument_list`. The following are hard-blocked at trade entry: derivatives (absent a separate derivatives policy), subordinated debt, instruments below the four highest NRSRO rating categories, stripped MBS unless specifically permitted, and any instrument triggering §703.15 prohibited activities. The allow-list is write-restricted to Compliance; trade permissibility checks are system-enforced and cannot be overridden by a single user.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered (`trade.entered`) | Instrument type (`trade.instrument_type`), CUSIP (`position.cusip`), allow-list version (`instrument_list.version`), proposed portfolio weight, Net Worth reference | Permissibility check result + `trade.permissibility.checked`; if prohibited: `trade.blocked_prohibited`; if soft limit: `trade.limit_warning.issued` | Immediately at trade entry; block before booking |
| Allow-list reviewed and updated (`instrument_list.review.completed`) | Prior version (`instrument_list.version`), Part 703 category mapping (`instrument_list.part703_category`), review date, approver ID | New versioned allow-list + `instrument_list.review.completed` | Annually and on material Part 703 change (enforced by `instrument_list.review_due_at`) |
| Prohibited instrument blocked (`trade.blocked_prohibited`) | Trade details, prohibition basis (§703.15 category or allow-list absence), instrument type | Block event + `trade.blocked_prohibited`; exception log entry required for any override attempt | Immediately at trade entry |
| Diversification limit hard-breach at trade entry (`trade.limit.blocked`) | Proposed position size, current portfolio composition (`portfolio.performance_metrics`), Net Worth, applicable limit from allow-list | Block event + `trade.limit.blocked` | Immediately at trade entry |

**ALERTS/METRICS:** Target zero `trade.blocked_prohibited` events that proceed to settlement. Alert on any allow-list version older than 12 months without a completed review. Monitor soft-limit warning frequency by instrument category; escalate to ALCO if a category consistently approaches hard limits.

---

## IP-04 — Interest Rate Risk and ALM Integration {#ip-04-interest-rate-risk-and-alm-integration}

**WHY (Reg cite):** [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address interest rate risk. NCUA Examiner's Guide expectations require integration of the investment portfolio into the institution-wide ALM and IRR measurement framework, including scenario-based analysis.

**SYSTEM BEHAVIOR:** The system captures effective duration (`position.effective_duration`), convexity (`position.convexity`), and cash-flow vectors per position and feeds these to the ALM model (`alm`) for IRR measurement. The primary analytical tool is prospective, scenario-based total return analysis combining income simulation with projected market value at the horizon (equivalent to income simulation plus EVE). ALCO IRR simulations run at least quarterly; the scheduler triggers more frequent runs when IRR thresholds are breached. The market depreciation stress test — parallel yield curve shifts of +100, +200, and +300 basis points applied to the combined AFS and HTM portfolio — must be performed at least quarterly; aggregate price depreciation may not exceed 30% of Net Worth. Results are reported to ALCO and the Board. ALM model inputs are write-restricted to Treasury/Finance; scenario parameters require ALCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Position booked or analytics updated (`position.analytics.updated`) | Effective duration (`position.effective_duration`), convexity (`position.convexity`), cash-flow vector, instrument type (`position.instrument_type`), fair value (`position.fair_value`) | Updated position analytics + `position.analytics.updated`; ALM feed refreshed | At booking and on each fair-value update |
| Quarterly IRR simulation run (`alm.irr_simulation.completed`) | Scenario set (`alm.scenario_set`), portfolio cash-flow vectors, behavioral assumptions, ALCO-approved rate scenarios | IRR simulation results + `alm.irr_simulation.completed`; results delivered to ALCO | Quarterly minimum (enforced by `alm.irr_simulation_due_at`); more often if thresholds breached |
| Market depreciation stress test computed (`portfolio.stress_test.completed`) | Combined AFS + HTM portfolio fair values, +100/+200/+300 bp parallel shift assumptions, Net Worth | Stress test results (depreciation $ and % of Net Worth) + `portfolio.stress_test.completed`; reported to ALCO and Board | Quarterly (enforced by `portfolio.stress_test_due_at`) |
| Market depreciation limit breached (`stress_test.minimum.breached`) | Stress test result exceeding 30% of Net Worth, Net Worth value | Breach alert + `stress_test.minimum.breached`; escalation to ALCO and Board | Immediately on computation |
| Ad-hoc IRR rerun triggered by threshold breach (`stress.adhoc_rerun.issued`) | Breach trigger event, updated scenario set | Ad-hoc simulation results + `stress.adhoc_rerun.issued` | Within 5 business days of threshold breach |

**ALERTS/METRICS:** Alert when market depreciation stress result exceeds 25% of Net Worth (warning) or 30% (hard breach). Monitor IRR simulation cadence; alert if gap exceeds 95 days. Track duration drift vs. ALCO-approved targets; alert on material deviation.

---

## IP-05 — Credit Risk Standards and Downgrade Management {#ip-05-credit-risk-standards-and-downgrade-management}

**WHY (Reg cite):** [12 CFR §703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6) requires credit unions to conduct independent credit analysis before purchasing non-government investments and to monitor credit quality on an ongoing basis. [NCUA LCU 2013-05](https://www.ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/supervisory-letter-investment-credit-analysis) establishes that NRSRO ratings may support but may not be the sole basis for investment-grade determination.

**SYSTEM BEHAVIOR:** For all investments not directly guaranteed by the U.S. government, a completed credit file (`credit_file`) with internal credit analysis (`credit_file.issuer_analysis`) and an investment-grade determination (`credit_file.internal_rating`) must exist and be approved before the trade is booked. The system blocks booking of non-government instruments without an approved credit file (`trade.blocked_prohibited`). Credit files are re-analyzed at least annually (`credit_file.reanalysis_due_at`). Per-instrument due diligence requirements (municipal GO, essential purpose revenue, other revenue, private-label MBS/ABS, corporate bonds, commercial paper) are documented in the permissible instruments appendix and enforced via the pre-trade checklist (see [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions)). When a rating downgrade is detected (`security.downgraded`), the system opens a downgrade review task (`security.downgrade_review_due_at`) due within 5 business days; if the position is material (defined in the authority matrix), the Board is notified. NRSRO ratings below the four highest categories trigger a hard block at trade entry. Credit file write access is restricted to the investment analyst role; approval is restricted to the CFO or designated CIO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Non-government trade entered (`trade.entered`) | Credit file ID (`credit_file.id`), internal rating (`credit_file.internal_rating`), issuer analysis (`credit_file.issuer_analysis`), approver ID (`credit_file.approver_id`), instrument type (`trade.instrument_type`) | Credit file check result; if absent or unapproved: `trade.blocked_prohibited` | Before booking |
| Credit file approved (`credit_file.approved`) | Issuer analysis (`credit_file.issuer_analysis`), internal rating (`credit_file.internal_rating`), approver ID, reanalysis due date (`credit_file.reanalysis_due_at`) | Approved credit file + `credit_file.approved`; reanalysis timer set | Before trade booking |
| Annual credit re-analysis due (`credit_file.reanalysis.completed`) | Prior credit file, updated issuer financials, NRSRO data (supporting only), instrument type | Updated credit file + `credit_file.reanalysis.completed`; new reanalysis due date set | Annually (enforced by `credit_file.reanalysis_due_at`) |
| Rating downgrade detected (`security.downgraded`) | CUSIP (`position.cusip`), prior rating, new rating (`security.rating_change`), position fair value (`position.fair_value`), materiality threshold from authority matrix | Downgrade review task opened + `security.downgraded`; `security.downgrade_review_due_at` set; Board notification if material | Review within 5 business days (enforced by `security.downgrade_review_due_at`) |
| Downgrade review completed (`security.downgrade.reviewed`) | Review findings, hold/sell/watch recommendation, approver ID | Review outcome recorded + `security.downgrade.reviewed`; Board notification sent if material position | Within 5 business days of `security.downgraded` |

**ALERTS/METRICS:** Target zero non-government positions without an approved credit file. Alert when `credit_file.reanalysis_due_at` is within 30 days without a completed reanalysis. Alert on all `security.downgraded` events; track time-to-review against 5-BD SLA.

---

## IP-06 — Liquidity and Marketability Limits {#ip-06-liquidity-and-marketability-limits}

**WHY (Reg cite):** [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address liquidity risk. [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires credit unions to maintain a Contingency Funding Plan and adequate liquidity; the investment portfolio is a core contingent liquidity source.

**SYSTEM BEHAVIOR:** Each position is classified into a liquidity bucket (`position.liquidity_bucket`) with an estimated days-to-liquidate (`position.days_to_liquidate`) and stress haircut (`position.stress_haircut`) at booking and updated monthly. The portfolio must consist largely of securities with active secondary or resale markets; AFS securities may be sold prior to maturity to provide liquid funds. The system generates an on-demand and 30-day stress liquidity capacity report (`liquidity.report`) at least monthly, more frequently under stress conditions. Liquidity classification is write-restricted to Treasury; stress haircut parameters require ALCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Position booked or monthly classification cycle (`position.liquidity.classified`) | Instrument type (`position.instrument_type`), market depth indicator (`market.depth_indicator`), estimated days-to-liquidate (`position.days_to_liquidate`), stress haircut (`position.stress_haircut`), liquidity bucket (`position.liquidity_bucket`) | Liquidity classification recorded + `position.liquidity.classified` | At booking; refreshed monthly (enforced by `position.liquidity_classification_due`) |
| Monthly liquidity capacity report generated (`liquidity.report.published`) | Portfolio liquidity buckets, stress haircut table (`liquidity.haircut_table`), on-demand capacity, 30-day stress capacity (`liquidity.net_outflows_30d`), liquid assets (`liquidity.liquid_assets`) | Liquidity report + `liquidity.report.published`; delivered to ALCO | Monthly (enforced by `liquidity.report_due_at`); more often under stress |
| Stress event declared (`liquidity.stress.declared`) | Stress trigger, CFP level (`cfp.level`), portfolio AFS liquidation capacity | Stress liquidity report + `liquidity.stress.declared`; CFP investment liquidation hierarchy activated | Immediately on declaration |

**ALERTS/METRICS:** Alert when on-demand liquidity capacity falls below ALCO-approved minimum threshold. Monitor percentage of portfolio in illiquid buckets (days-to-liquidate > 30); alert if above ALCO-set ceiling. Track monthly report delivery against `liquidity.report_due_at`; target zero late reports.

---

## IP-07 — Concentration and Counterparty Limits {#ip-07-concentration-and-counterparty-limits}

**WHY (Reg cite):** [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address concentration risk. NCUA Examiner's Guide expectations require concentration limits addressing single or related issuer, geographic area, and obligations with similar cash-flow or risk characteristics.

**SYSTEM BEHAVIOR:** The system maintains parameterized concentration limits (`limit_set`) covering single-issuer, sector, rating category, product type, and counterparty exposures. The diversification limits table in [IP-03](#ip-03-permissible-investments-and-prohibited-activities) constitutes the hard limits enforced at trade entry; ALCO may establish tighter operating (soft) limits by sector on a periodic basis. At trade entry, the system computes the post-trade concentration (`concentration.computed`) and enforces soft warnings (`trade.limit_warning.issued`) and hard blocks (`trade.limit.blocked`). Concentration limits are reviewed at least annually. The limit set is write-restricted to Compliance with ALCO approval; concentration computations are system-enforced.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered — concentration check (`trade.limit.checked`) | Proposed position size, instrument type (`trade.instrument_type`), issuer ID, sector, current portfolio exposures (`exposure.by_issuer`, `exposure.by_sector`, `exposure.by_counterparty`), Net Worth, limit set version (`limit_set.version`) | Concentration check result + `trade.limit.checked`; if soft limit: `trade.limit_warning.issued`; if hard limit: `trade.limit.blocked` | Immediately at trade entry; block before booking |
| Concentration limit set reviewed and updated (`limit_set.review.completed`) | Prior limit set, ALCO-approved sector overlays, Net Worth reference, review date | Updated limit set + `limit_set.review.completed` | Annually (enforced by `limit_set.review_due_at`); and when ALCO adjusts sector overlays |
| Concentration limit breached post-trade (monitoring) (`concentration.limit_exceeded`) | Portfolio composition snapshot, limit set, Net Worth | Breach alert + `concentration.limit_exceeded`; escalation to ALCO | On daily portfolio computation |

**ALERTS/METRICS:** Target zero hard-limit breaches at trade entry that proceed to settlement. Alert when any issuer, sector, or counterparty exposure reaches 80% of its hard limit. Monitor ALCO sector overlay updates; alert if no review in 90 days.

---

## IP-08 — Approved Brokers, Dealers, and Safekeepers {#ip-08-approved-brokers-dealers-and-safekeepers}

**WHY (Reg cite):** [12 CFR §703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8) requires credit unions to conduct due diligence on securities dealers. [12 CFR §703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9) requires purchased securities to be held with an approved safekeeping agent, not the selling dealer, and requires monthly reconciliation of safekeeping records.

**SYSTEM BEHAVIOR:** The system maintains an approved intermediaries list (`intermediary`) covering both securities dealers and safekeeping agents, with due-diligence file references (`intermediary.due_diligence_file`) and review dates (`intermediary.review_due_at`). At trade entry, the system validates the intermediary ID (`trade.intermediary_id`) against the approved list; trades with unapproved intermediaries are blocked (`trade.intermediary.blocked`). Dealer due diligence covers: capital strength, liquidity, and operating results; reputation for fair and honest dealings; FINRA and regulatory enforcement history; and sales representative experience. The Board reviews and approves the dealer list at least annually; safekeeping agent additions or changes require Board action. Purchased securities must be transferred to an approved safekeeping agent — not held with the selling dealer. Safekeeping statements are reconciled to Credit Union records at least monthly (`safekeeping.reconciliation.completed`). The approved intermediaries list is write-restricted to Compliance; Board approval is required for additions.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade entered — intermediary validation (`trade.intermediary.validated` or `trade.intermediary.blocked`) | Intermediary ID (`trade.intermediary_id`), approved list version (`intermediary.approved_list`), trade date | Validation result + `trade.intermediary.validated` or `trade.intermediary.blocked` | Immediately at trade entry; block before booking |
| Annual dealer due-diligence review (`intermediary.review.completed`) | Due-diligence file (`intermediary.due_diligence_file`): capital/liquidity/operating results, reputation assessment, FINRA/regulatory enforcement check, sales rep experience; review date | Updated due-diligence file + `intermediary.review.completed`; Board approval package prepared | Annually (enforced by `intermediary.review_due_at`) |
| Board approves dealer/safekeeper list (`policy.board.approved` for intermediary list) | Board resolution ID (`board.resolution_id`), approved intermediary list, meeting date | Board-approved list + `policy.board.approved`; list version updated | Annually concurrent with policy approval; immediately for new safekeeper additions |
| Safekeeping statement received and reconciled (`safekeeping.reconciliation.completed`) | Safekeeping statement (`safekeeping.statement`), Credit Union position records (`position.cusip`, `position.book_value`, `position.amortized_cost`), reconciliation date | Reconciliation result + `safekeeping.reconciliation.completed`; discrepancies flagged | Monthly (enforced by `safekeeping.reconciliation_due_at`) |
| Securities transferred to safekeeper post-trade (`trade.settled`) | Trade settlement confirmation, safekeeper confirmation, CUSIP (`position.cusip`) | Settlement and transfer confirmed + `trade.settled` | At settlement; transfer must precede or occur simultaneously with settlement |

**ALERTS/METRICS:** Target zero trades settled with unapproved intermediaries. Alert on any safekeeping reconciliation discrepancy unresolved within 5 business days. Alert when any intermediary's due-diligence review is overdue by more than 30 days.

---

## IP-09 — Repurchase and Reverse Repurchase Agreements {#ip-09-repurchase-and-reverse-repurchase-agreements}

**WHY (Reg cite):** [12 CFR §703.13](https://www.ecfr.gov/current/title-12/part-703) governs repurchase agreements as permissible investment activities. [NCUA IRPS 1985-2](https://www.ncua.gov/regulation-supervision/rules-regulations/interpretive-rulings-policy-statements/irps-85-2) and Part 703 guidance establish safe-and-sound collateral practices, haircut requirements, and maturity-mismatch limits for repurchase transactions.

**SYSTEM BEHAVIOR:** Each repurchase agreement is represented as a `repo` record with explicit fields for collateral CUSIP (`repo.collateral_cusip`), haircut (`repo.haircut`), required margin (`repo.required_margin`), counterparty ID (`repo.counterparty_id`), and maturity mismatch days (`repo.maturity_mismatch_days`). Repos are treated as secured borrowings: the underlying security remains as an asset while a liability is created. Maximum maturity is 3 months; single-issuer limit is 25% of Net Worth (consistent with the diversification table in [IP-03](#ip-03-permissible-investments-and-prohibited-activities)). Bookings that violate maturity-mismatch limits or collateral rules are blocked (`repo.blocked_rule_violation`). Collateral is marked to market at least weekly (`repo.collateral_marked`), daily under stress; margin calls are issued automatically when fair value falls below required margin (`repo.margin_call`). The repo module is write-restricted to Treasury; collateral revaluation parameters require CFO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Repo booking attempted (`repo.entered`) | Collateral CUSIP (`repo.collateral_cusip`), haircut (`repo.haircut`), counterparty ID (`repo.counterparty_id`), maturity date, maturity mismatch days (`repo.maturity_mismatch_days`), single-issuer exposure vs. 25% Net Worth limit | Rule check result; if violation: `repo.blocked_rule_violation`; if compliant: `repo.booked` | Before booking |
| Collateral marked to market (`repo.collateral_marked`) | Collateral CUSIP fair value (`position.fair_value`), required margin (`repo.required_margin`), haircut (`repo.haircut`), revaluation date | Mark-to-market result + `repo.collateral_marked`; if shortfall: `repo.margin_shortfall.detected` | Weekly minimum (enforced by `repo.collateral_revaluation_due_at`); daily under stress |
| Margin shortfall detected (`repo.margin_shortfall.detected`) | Shortfall amount (`repo.margin_shortfall_amount`), counterparty ID, collateral fair value | Margin call issued + `repo.margin_call.issued` | Immediately on detection |

**ALERTS/METRICS:** Target zero repos booked in violation of maturity or collateral rules. Alert on any margin shortfall unresolved within 1 business day. Monitor aggregate repo exposure vs. 50% of Net Worth hard limit; alert at 40%.

---

## IP-10 — Valuation, Accounting, and Fair-Value Measurement {#ip-10-valuation-accounting-and-fair-value-measurement}

**WHY (Reg cite):** [12 CFR §703.11](https://www.ecfr.gov/current/title-12/part-703/section-703.11) requires credit unions to value investment securities in accordance with GAAP. GAAP (ASC 320) governs HTM/AFS classification, fair value measurement, and OTTI recognition. [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address valuation practices.

**SYSTEM BEHAVIOR:** At purchase, each security is classified as HTM or AFS (`position.instrument_type` classification field) in accordance with GAAP and regulatory requirements. HTM securities are reported at amortized cost (`position.amortized_cost`); AFS securities are reported at fair value (`position.fair_value`) with unrealized gains and losses excluded from income and reported in a separate component of members' equity on a tax-affected basis. Transfers between categories are rare and must be documented by the CFO; permitted transfer reasons are: less than 3 months to maturity or effective call date; less than 15% of purchase face remaining on MBS/CMO; deterioration of creditworthiness; major regulatory change; or a business combination resulting in an unacceptable asset/liability position. Fair value is updated at least monthly using reputable, independent pricing sources (`pricing.source`); the system records the pricing source and date (`security.fair_value.update.due_at`). Pricing overrides require dual approval by CFO and Controller and are logged. OTTI evaluation is conducted quarterly on a security-by-security basis; for securities in a loss position of 10% or more, management assesses whether the issuer is unable to pay all contractual amounts due; if probable, OTTI is recorded and the security is written down to fair value with credit impairment flowing through income. Pricing override capability is restricted to CFO and Controller under dual approval; OTTI write-down entries require CFO authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security purchased — classification recorded (`position.booked`) | HTM or AFS designation, CUSIP (`position.cusip`), book value (`position.book_value`), amortized cost (`position.amortized_cost`), pricing source | Classification recorded + `position.booked` with HTM/AFS designation | At purchase |
| Monthly fair value update (`security.fair_value.updated`) | Independent pricing source, pricing date, fair value (`position.fair_value`), CUSIP (`position.cusip`) | Updated fair value + `security.fair_value.updated` | Monthly (enforced by `security.fair_value_update_due_at`) |
| Pricing override applied (`pricing.override.applied`) | Override rationale (`pricing.override_rationale`), CFO approval, Controller approval (dual), prior price, override price | Override logged + `pricing.override.applied` with dual-approval record | At time of override; dual approval required before posting |
| Quarterly OTTI evaluation (`security.otti_analysis.completed`) | Security-by-security fair value vs. amortized cost, loss position ≥ 10% flag, contractual cash-flow assessment, issuer credit assessment | OTTI evaluation results + `security.otti_analysis.completed`; write-down entry if OTTI confirmed | Quarterly (enforced by `portfolio.stress_test_due_at` cycle) |
| OTTI write-down recorded (`security.impairment_indicator_raised`) | OTTI determination, write-down amount, credit impairment amount, CFO authorization | Write-down posted to income + `security.impairment_indicator_raised` | At quarter-end when OTTI confirmed |
| HTM-to-AFS transfer documented (`trade.booked` with classification change) | Transfer rationale (one of five permitted reasons), CFO documentation, prior classification, new classification | Transfer documented + `trade.booked`; CFO rationale attached | Before transfer effective date |

**ALERTS/METRICS:** Target zero fair value updates older than 35 days. Alert on any pricing override without dual-approval record. Monitor count of securities in unrealized loss position ≥ 10%; alert when count increases quarter-over-quarter without OTTI evaluation.

---

## IP-11 — Pre-Purchase Due Diligence and Exceptions {#ip-11-pre-purchase-due-diligence-and-exceptions}

**WHY (Reg cite):** [12 CFR §703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6) requires independent credit analysis before purchasing non-government investments. [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address pre-purchase analysis procedures.

**SYSTEM BEHAVIOR:** Before booking any non-government or non-fully-insured instrument, the system enforces a pre-trade checklist (`trade.pretrade_checklist`) that must be completed and linked to the trade. Required purchase documentation fields are: bond issuer, bond/security type, CUSIP (`position.cusip`), issue size, issue date, maturity date, call date, coupon and coupon frequency, trade date and settlement date, par value, original issue price, Credit Union purchase price, prospective total return profile, yield, duration (`position.effective_duration`), weighted average life, CPR/PSA assumptions and analysis (if applicable), credit analysis memo (`credit_file.issuer_analysis`) for non-government instruments, AFS vs. HTM classification designation, and dealer name (`trade.intermediary_id`). Required sale documentation fields are: bond issuer, bond/security type, CUSIP, rationale for sale, total return profile at sale price, trade date, settlement date, coupon, price, yield, par value, and dealer name. Exceptions to the pre-trade checklist require documented approval before settlement and are logged in the exception register (`trade.exception_raised`). The exception log is reviewed by ALCO at least quarterly; exceptions exceeding a board-set threshold trigger board notification. U.S. government and fully insured instruments are exempt from the credit memo requirement but not from other checklist fields. The pre-trade checklist is write-restricted to the initiating investment officer; approval is restricted to the CFO or designated CIO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Pre-trade checklist completed for purchase (`trade.checklist.completed`) | All required purchase fields (CUSIP `position.cusip`, issuer, type, maturity, coupon, trade/settlement dates, par, price, total return profile, yield, duration `position.effective_duration`, WAL, CPR/PSA if applicable, credit memo `credit_file.issuer_analysis` for non-government, AFS/HTM designation, dealer `trade.intermediary_id`) | Completed checklist + `trade.checklist.completed`; linked to trade record | Before booking |
| Pre-trade checklist completed for sale (`trade.checklist.completed`) | Required sale fields (CUSIP `position.cusip`, issuer, type, sale rationale, total return at sale price, trade/settlement dates, coupon, price, yield, par, dealer `trade.intermediary_id`) | Completed sale checklist + `trade.checklist.completed`; linked to trade record | Before settlement |
| Checklist exception raised (`trade.exception.logged`) | Missing or waived field, exception rationale, approver ID, trade ID | Exception logged + `trade.exception.logged`; approval required before settlement | Before settlement |
| Exception log reviewed by ALCO (`trade.exception.approved`) | Exception register summary, exception count, board threshold from authority matrix | ALCO review recorded + `trade.exception.approved`; board notification if threshold exceeded | Quarterly ALCO review; immediate board notification if threshold breached |

**ALERTS/METRICS:** Target zero trades settled without a completed pre-trade checklist. Alert on any exception log entry without prior approval. Monitor exception rate by instrument type; escalate to ALCO if rate exceeds board-set threshold.

---

## IP-12 — Ongoing Monitoring, Reporting, and Stress Testing {#ip-12-ongoing-monitoring-reporting-and-stress-testing}

**WHY (Reg cite):** [12 CFR §703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12) requires ongoing monitoring of the investment portfolio. [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address monitoring and reporting. NCUA Examiner's Guide expectations require regular reporting to management and the board on portfolio composition, risk, and performance.

**SYSTEM BEHAVIOR:** The system generates recurring reports on portfolio composition, duration, liquidity, gain/loss, and limit adherence. Management (ALCO) receives reports at least monthly; the Board receives reports at least quarterly (monthly preferred). Board reports include: all security purchases; all security sales and net gains/(losses); portfolio composition; prospective total return profile; portfolio total return results; portfolio yield, current effective duration, and current average life; credit risk considerations; market appreciation or depreciation; and market appreciation/depreciation as a percent of Net Worth. ALCO reports include: current and desired portfolio composition; prospective total return profile over one or more time horizons; analysis of risk considerations; liquidity objectives; portfolio total return results, current effective duration, and current average life; and Credit Union net worth levels. Stress scenarios are run at least annually, more often as metrics approach limits. Report generation is automated; distribution is restricted to authorized recipients defined in the governance RACI.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly ALCO portfolio report generated (`portfolio.management_report.issued`) | Portfolio composition, total return profile, duration (`position.effective_duration`), average life, liquidity objectives, risk considerations, net worth (`cda.net_worth`) | ALCO management report + `portfolio.management_report.issued` | Monthly (enforced by `portfolio.report_due_at`) |
| Quarterly Board portfolio report generated (`portfolio.board_report.issued`) | All purchases, all sales and net gains/losses (`portfolio.gain_loss_summary`), composition, total return, yield, duration, avg life, credit risk, market depreciation, depreciation as % of Net Worth | Board report package + `portfolio.board_report.issued` | Quarterly (enforced by `portfolio.board_report_due_at`); monthly preferred |
| Annual portfolio stress test run (`portfolio.stress_test.completed`) | Stress scenario set (`stress.set`), portfolio positions, behavioral assumptions (`stress.behavioral_assumptions`), limit thresholds | Stress test results + `portfolio.stress_test.completed`; results to ALCO and Board | Annually (enforced by `portfolio.stress_test_due_at`); more often as metrics approach limits |
| Ad-hoc stress rerun triggered (`stress.adhoc_rerun.issued`) | Trigger event (metric approaching limit), updated scenario set | Ad-hoc stress results + `stress.adhoc_rerun.issued` | Within 5 business days of trigger |

**ALERTS/METRICS:** Alert when any limit-adherence metric in the monthly report shows a breach. Monitor report delivery against `portfolio.report_due_at` and `portfolio.board_report_due_at`; target zero late deliveries. Alert when stress test results show any metric within 10% of a hard limit.

---

## IP-13 — Performance Measurement and Benchmarks {#ip-13-performance-measurement-and-benchmarks}

**WHY (Reg cite):** [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address performance objectives. NCUA Examiner's Guide expectations require that performance measurement support ALCO's assessment of whether the portfolio's risk/reward profile is consistent with approved strategy and does not incentivize breaching risk limits.

**SYSTEM BEHAVIOR:** Total return analysis — combining income simulation with projected market value at the horizon — is the primary performance measurement tool. Performance is attributed to benchmarks by portfolio segment at least quarterly (`performance.attribution.completed`). Performance targets are set by ALCO and approved by the Board; targets are structured so that achieving them does not require breaching any risk limit in [IP-03](#ip-03-permissible-investments-and-prohibited-activities), [IP-04](#ip-04-interest-rate-risk-and-alm-integration), or [IP-07](#ip-07-concentration-and-counterparty-limits). Any proposed change to performance targets is reviewed for risk-limit compatibility before adoption. Performance attribution data is write-restricted to Treasury/Finance; target changes require ALCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly performance attribution completed (`performance.attribution.completed`) | Portfolio total return by segment, benchmark returns, rate scenario assumptions, time horizon, ALCO-approved targets (`performance.targets`) | Attribution report + `performance.attribution.completed`; delivered to ALCO | Quarterly (enforced by `performance.attribution_due_at`) |
| Performance target change proposed (`performance.target_change.proposed`) | Proposed target (`performance.target_change`), risk-limit compatibility review (`performance.target_risk`), ALCO approval | Target change proposal + `performance.target_change.proposed`; risk review documented | Before adoption; ALCO approval required |
| Performance target risk reviewed (`performance.target_risk.reviewed`) | Proposed target, applicable risk limits from [IP-03](#ip-03-permissible-investments-and-prohibited-activities), [IP-04](#ip-04-interest-rate-risk-and-alm-integration), [IP-07](#ip-07-concentration-and-counterparty-limits) | Risk compatibility determination + `performance.target_risk.reviewed` | Before target adoption |

**ALERTS/METRICS:** Alert when actual portfolio total return deviates from benchmark by more than ALCO-set tolerance for two consecutive quarters. Monitor that no performance target requires a risk-limit breach to achieve; flag any target change that fails the risk-limit compatibility review.

---

## IP-14 — Trade Execution, Controls, and Segregation of Duties {#ip-14-trade-execution-controls-and-segregation-of-duties}

**WHY (Reg cite):** [12 CFR §703.3(b)](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to address internal controls over investment activity. NCUA Examiner's Guide expectations require segregation of duties between trade initiation, approval, confirmation, settlement, and accounting, and dual control over the full transaction lifecycle.

**SYSTEM BEHAVIOR:** The system enforces role-based segregation of duties (`sod`) across the trade lifecycle: initiation (investment officer), approval (CFO/CIO per authority matrix), confirmation (operations/back office), settlement (Treasury), and accounting (Finance/Controller). No single user may control more than one consecutive step in the lifecycle; the system blocks any step where the same user ID appears in two consecutive roles (`trade.sod.blocked`). Dual control is enforced for settlement and accounting entries. Trade confirmations are matched against trade tickets within T+1 (`trade.reconciliation_due_at`); discrepancies are flagged (`trade.confirmation_discrepancy.flagged`) and escalated. Each step in the trade lifecycle is logged as a discrete event (`trade.step.recorded`). SOD matrix is write-restricted to Compliance; changes require CCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade initiated (`trade.entered`) | Initiator user ID (`trade.step_attempted`), instrument type (`trade.instrument_type`), trade ticket (`trade.ticket`), intermediary ID (`trade.intermediary_id`) | Trade entered + `trade.step.recorded`; SOD check initiated | At initiation |
| SOD violation detected (`trade.sod.blocked`) | User ID attempting multiple lifecycle steps, step sequence, SOD matrix version (`sod.matrix_version`) | SOD block + `trade.sod.blocked`; escalation to CCO | Immediately on detection; trade blocked |
| Trade confirmation received and matched (`trade.confirmation.received`) | Dealer confirmation, trade ticket (`trade.ticket`), settlement amount (`trade.settlement_amount`), settlement date (`trade.settlement_date`) | Confirmation match result + `trade.confirmation.received`; if discrepancy: `trade.confirmation_discrepancy.flagged` | T+1 (enforced by `trade.reconciliation_due_at`) |
| Confirmation discrepancy flagged (`trade.confirmation_discrepancy.flagged`) | Discrepancy detail (`trade.confirmation_discrepancy`), trade ID, counterparty | Discrepancy alert + `trade.confirmation_discrepancy.flagged`; escalation to CFO | Immediately on detection; resolution required before settlement |
| Trade settled (`trade.settled`) | Settlement confirmation, dual-control approval, accounting entry | Settlement recorded + `trade.settled`; accounting entry posted | At settlement date |

**ALERTS/METRICS:** Target zero SOD violations (`trade.sod.blocked`) that proceed past the block. Alert on any confirmation discrepancy unresolved at T+1. Monitor reconciliation completion rate against `trade.reconciliation_due_at`; target 100% within T+1.

---

## IP-15 — Recordkeeping and Documentation Retention {#ip-15-recordkeeping-and-documentation-retention}

**WHY (Reg cite):** [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires credit unions to maintain records of investment transactions. NCUA and federal record retention requirements govern minimum retention periods for investment records.

**SYSTEM BEHAVIOR:** All trade tickets, confirmations, credit memos, approvals, safekeeping statements, and reports must be attached to the relevant trade or position record within 2 business days of the triggering event (`document.attachment_due_at`). The system checks the required document set for each trade type (purchase or sale) against the fields defined in [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions) and flags any missing attachments as overdue. Retention schedules comply with applicable NCUA and federal requirements and are governed by the organization's Record Retention Policy; legal-hold, destruction, and permanent-record lifecycle mechanics are handled by SC-02 below. Document attachment is write-restricted to the investment operations role; attachment overdue alerts are routed to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Trade booked or sale settled (`trade.booked` / `trade.settled`) | Trade ID, required document set for instrument type (per [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions)), attachment due date (`document.attachment_due_at`) | Attachment task created + `document.required_set` recorded; `document.attachment_due_at` set | At booking/settlement; attachment due within 2 business days (enforced by `document.attachment_due_at`) |
| Document attached to trade (`document.disposition.recorded`) | Document type (`document.type`), subject reference (`document.subject_ref`), attached flag (`document.attached`), attaching user ID | Attachment recorded + `document.disposition.recorded` | Within 2 business days of trade booking or settlement |
| Attachment overdue (`document.attachment_due_at` passed without `document.attached`) | Trade ID, missing document types, overdue duration | Overdue alert to CCO + `policy.noncompliance.flagged` | Immediately on due-date breach |

**ALERTS/METRICS:** Target zero trade records with missing required documents beyond 2 business days. Monitor attachment completion rate by document type; alert when any category falls below 100% within the SLA window.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [12 CFR §703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4) requires retention of investment records. NCUA record retention expectations and applicable federal requirements govern minimum periods; the organization's Record Retention Policy (see cross-reference below) sets the full schedule.

**SYSTEM BEHAVIOR:** Once a document is attached and the retention clock is set (`record.retention_clock_set`), the system manages the full retention lifecycle: active retention, legal-hold suspension, destruction eligibility, and permanent-record designation. Legal holds (`legal_hold`) suspend the destruction clock for any record in scope; the clock resumes only after the hold is released (`legal_hold.clear.confirmed`). Records eligible for destruction are queued in a destruction cycle (`record.destruction_cycle_due_at`); destruction requires a certified destruction log entry (`destruction_log.entry.created`) and is blocked if a legal hold is active. Permanent records are flagged at classification and are never queued for destruction. Retention schedules are sourced from the organization's Record Retention Policy and are not editable within this policy's controls. Retention schedule parameters are write-restricted to the Records Management function; legal-hold placement and release require Legal authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Document attached and retention clock set (`record.retention_clock_set`) | Record type (`record.retention_class`), retention anchor date (`record.retention_anchor`), retention schedule (`record.retention_class`), legal-hold flag (`record.legal_hold_flag`) | Retention clock started + `record.retention_clock_set`; `record.retention.expires_at` computed | At attachment |
| Legal hold placed on record (`record.hold.placed`) | Matter ID (`record.hold_matter_id`), hold scope (`record.hold_scope`), hold authorizer (`record.hold_authorizer`) | Hold applied + `record.hold.placed`; destruction clock suspended | Immediately on hold placement |
| Legal hold released (`record.hold.released`) | Hold release authorization (`record.hold_release_auth`), matter closure confirmation | Hold lifted + `record.hold.released`; destruction clock resumed | On Legal authorization |
| Record destruction eligibility reached (`record.retention.expired`) | `record.retention.expires_at` passed, legal-hold flag = false, destruction method (`record.disposal_method`) | Destruction queued + `record.retention.expired`; destruction cycle initiated | On expiry date, subject to legal-hold check |
| Record destroyed (`record.destroyed`) | Destruction certificate (`destruction_log.entry_id`), destruction method, actor ID | Destruction logged + `record.destroyed`; destruction log entry created (`destruction_log.entry.created`) | At destruction |
| Permanent record flagged (`record.finalized`) | Permanent designation basis, record class (`record.retention_class`) | Permanent flag set + `record.finalized`; destruction queue excluded | At classification |

**ALERTS/METRICS:** Target zero records destroyed while a legal hold is active. Alert on any destruction log mismatch (`destruction_log.mismatch.detected`). Monitor retention clock coverage — every attached document must have `record.retention.expires_at` set; alert on any gap.

---

## IP-16 — Training, Competency, and Conflicts of Interest {#ip-16-training-competency-and-conflicts-of-interest}

**WHY (Reg cite):** [12 CFR §703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17) prohibits conflicts of interest in investment activities. NCUA Examiner's Guide expectations require that covered staff and board members have adequate competency and that conflicts of interest be identified and managed.

**SYSTEM BEHAVIOR:** The system tracks required investment training (`training`) and annual conflict-of-interest certifications (`coi`) for all covered staff (investment officers, ALCO members, CFO/CIO) and board members. System access to investment functions requires a completed onboarding training record (`training.onboarding.completed`); access is auto-suspended (`access.suspended`) if annual training or COI certification lapses (`training.lapsed` or `coi.status` not `determined`). Annual COI questionnaires are issued at the start of each annual cycle; ad-hoc disclosures are required when a conflict arises. Identified conflicts are reviewed and dispositioned before the covered person participates in any related investment decision. Training and COI records are write-restricted to Compliance/HR; access suspension is system-enforced.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New covered staff or board member onboarded (`employee.hired` / `board.meeting_held`) | Assignee ID (`training.assignee_id`), role curriculum (`training.role_curriculum`), onboarding due date (`training.onboarding_due_at`) | Training assignment created + `training.assignment.created`; access gated until completion | Before system access granted; onboarding training due within role-defined window (enforced by `training.onboarding_due_at`) |
| Onboarding training completed (`training.onboarding.completed`) | Completion record (`training.completion_status`), assessment score (`training.assessment_score`), assignee ID | Training completion recorded + `training.onboarding.completed`; system access provisioned | At completion |
| Annual training cycle opened (`training.annual_cycle.opened`) | Annual curriculum (`training.annual_cycle`), due date (`training.annual_due_at`), covered staff roster | Annual training assignments created + `training.annual.assigned` | At cycle open; completion due within cycle window (enforced by `training.annual_due_at`) |
| Annual COI questionnaire issued (`coi.questionnaire.issued`) | Questionnaire version (`coi.questionnaire_version`), due date (`coi.questionnaire_due_at`), covered person roster | COI questionnaire issued + `coi.questionnaire.issued` | Annually at cycle open (enforced by `coi.questionnaire_due_at`) |
| COI certified (`coi.certified`) | Questionnaire responses (`coi.questionnaire_responses`), attestation signature (`coi.attestation_signature`), attestation date (`coi.attestation_date`) | COI certification recorded + `coi.certified` | Within annual cycle window |
| Training or COI lapsed — access suspended (`access.suspended`) | Lapse event (`training.lapsed` or `coi.status` not `determined`), user ID, access scope | Access suspended + `access.suspended`; alert to CCO and HR | Immediately on lapse |
| Conflict identified and disclosed (`coi.disclosure.filed`) | Conflict description (`coi.interest_description`), related party (`coi.related_party`), matter reference (`coi.matter_reference`) | Ad-hoc disclosure filed + `coi.disclosure.filed`; recusal evaluated | Immediately on identification |
| Conflict dispositioned (`coi.determination.logged`) | Determination (`coi.determination_made`), recusal record (`coi.recusal_record`) if applicable | Disposition recorded + `coi.determination.logged` | Before covered person participates in related investment decision |

**ALERTS/METRICS:** Target zero covered staff or board members with system access and a lapsed training or COI record. Monitor COI certification completion rate at cycle close; target 100%. Alert on any ad-hoc conflict disclosure not dispositioned within 5 business days.

---

## IP-17 — Contingency Planning and Liquidity Stress Events {#ip-17-contingency-planning-and-liquidity-stress-events}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires credit unions to maintain a Contingency Funding Plan (CFP) with defined liquidity stress scenarios and funding sources. The investment portfolio must be structured to serve as a core contingent liquidity source under the CFP.

**SYSTEM BEHAVIOR:** The system maintains a predefined investment-liquidation hierarchy (`cfp.liquidation_hierarchy`) tied to the CFP, specifying which AFS securities are liquidated first under stress and at what estimated haircuts. The CFP investment test is run at least annually (`cfp.investment_test.completed`); the test validates that the AFS tranche can meet contingent funding needs without fire-sale pricing. On declaration of an actual liquidity stress event (`liquidity.stress.declared`), the system requires an initial execution plan to be documented within 1 business day (`cfp.execution_plan_due_at`). The liquidation hierarchy is reviewed and updated at least annually. The CFP investment module is write-restricted to Treasury; stress scenario parameters require ALCO approval; execution plan documentation requires CFO authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual CFP investment test run (`cfp.investment_test.completed`) | Liquidation hierarchy (`cfp.liquidation_hierarchy`), AFS portfolio composition, stress haircut table (`liquidity.haircut_table`), contingent funding need scenarios | Test results + `cfp.investment_test.completed`; gaps identified and remediated | Annually (enforced by `cfp.investment_test_due_at`) |
| Liquidity stress event declared (`liquidity.stress.declared`) | Stress trigger, CFP level (`cfp.level`), AFS liquidation capacity, contingent funding need | Stress declaration + `liquidity.stress.declared`; execution plan task created (`cfp.execution_plan_due_at`) | Immediately on declaration |
| Execution plan documented (`cfp.execution_plan_documented`) | Liquidation sequence, estimated proceeds, counterparties, CFO authorization | Execution plan recorded + `cfp.execution_plan_documented` | Within 1 business day of stress declaration (enforced by `cfp.execution_plan_due_at`) |
| Liquidation hierarchy reviewed and updated (`cfp.investment_test.completed` — annual review) | Prior hierarchy, current AFS composition, updated haircut assumptions, ALCO approval | Updated hierarchy + `cfp.investment_test.completed` | Annually concurrent with CFP investment test |

**ALERTS/METRICS:** Alert if CFP investment test has not been completed within 12 months. Alert if execution plan is not documented within 1 business day of a stress declaration. Monitor AFS liquidation capacity vs. CFP contingent funding need; alert when capacity falls below 110% of the need.

---

## IP-18 — Policy Review, Amendments, and Version Control {#ip-18-policy-review-amendments-and-version-control}

**WHY (Reg cite):** [12 CFR §703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3) requires the investment policy to be reviewed and approved by the board at least annually. Material changes to Part 703 or related NCUA guidance require prompt policy updates.

**SYSTEM BEHAVIOR:** The system maintains full version history for the Investment Policy, including redlines (`policy.draft_redline`), change summaries (`policy.change_summary`), and board approval metadata (`policy.board_approved_at`, `policy.approver_id`, `policy.minutes_reference`). Each version is immutable once approved; amendments create a new draft version. The annual review cycle is triggered by the `policy.review.due_at` timer (set at prior approval). Material regulatory changes to Part 703 or related guidance trigger an out-of-cycle review task (`regulatory.change.identified`). The policy version history is write-restricted to Compliance; board approval metadata is system-generated from the board approval event and cannot be manually edited.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle triggered (`policy.board_review.started`) | `policy.review.due_at`, prior approved version, owner reference (`policy.owner_ref`) | Review cycle opened + `policy.board_review.started`; draft initiated | ≤ 12 months from prior approval (enforced by `policy.review.due_at`) |
| Amendment drafted (`policy.amendment.proposed`) | Redline (`policy.draft_redline`), change rationale (`policy.change_rationale`), change summary (`policy.change_summary`), drafter ID | Draft amendment + `policy.amendment.proposed`; version incremented | Before board submission |
| Board approves amended policy (`policy.board.approved`) | Board resolution ID (`board.resolution_id`), meeting date (`board.meeting_date`), minutes reference (`policy.minutes_reference`), effective date (`policy.effective_date`), next review date (`policy.next_review_at`) | Approved version published + `policy.version.approved`; prior version archived; new `policy.review.due_at` set | At board meeting; effective date as specified |
| Material regulatory change identified (`regulatory.change.identified`) | Regulatory source (`regulatory.source_doc`), change description (`regulatory.change_analysis`), applicability assessment | Out-of-cycle review task created + `regulatory.change.identified`; `regulatory.analysis_due_at` set | Immediately on identification; analysis due within 30 days (enforced by `regulatory.analysis_due_at`) |
| Policy distributed to covered staff (`policy.distribution.logged`) | Distribution list, version ID (`policy.document_version`), distribution date | Distribution logged + `policy.distribution.logged` | Within 5 business days of board approval |

**ALERTS/METRICS:** Target zero policy versions in force beyond 12 months without board re-approval. Alert when `regulatory.analysis_due_at` is within 10 days without a completed analysis. Monitor distribution completion after each approval; target 100% within 5 business days.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; maintains controls IP-01 through IP-18 and SC-02; approves allow-list and authority matrix changes; routes board approval packages |
| **Chief Financial Officer / Chief Investment Officer** | Day-to-day portfolio management; trade execution authority within matrix limits; pricing override dual-approver; CFP execution plan authorization |
| **ALCO / Investment Committee** | Monthly strategy development and monitoring; quarterly IRR simulation review; sector overlay limit setting; performance target approval |
| **Board of Directors** | Annual policy and authority matrix approval; annual dealer list approval; safekeeping agent approval; quarterly investment report review |
| **Internal Audit / Supervisory Committee** | Independent review of investment controls; findings reported to Board |
| **Treasury** | Liquidity classification; repo collateral management; CFP liquidation hierarchy maintenance |
| **Finance / Controller** | Accounting entries; pricing override dual-approver; OTTI write-down entries |

**Review cadence:** Annual board approval required; not to exceed 12 months between approvals. Out-of-cycle review triggered by material Part 703 or related regulatory change.

**Cross-references:**
- Derivatives Policy (Part 703 Subpart B) — separate board-approved policy required for any derivative activity
- Retail Nondeposit Investment Products Policy — separate policy for NDIP sales programs
- Liquidity Policy — enterprise liquidity program and CFP governance
- Capitalization Policy — capital adequacy framework
- Record Retention Policy — full retention schedule governing IP-15 and SC-02
- Third-Party Risk Policy — broker and custodian vendor risk management beyond investment due diligence

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The investment-domain resources, fields, and events referenced throughout this document — including `position.*`, `repo.*`, `instrument_list.*`, `portfolio.*`, `security.*`, `safekeeping.*`, `cfp.*`, `alm.*`, `credit_file.*`, `trade.*`, `intermediary.*`, `performance.*`, `concentration.*`, `limit_set.*`, `exposure.*`, `market.*`, `stress.*`, `liquidity.*`, and related timer codes — are drawn from the registered core-API vocabulary where registered objects and actions exist (e.g., `trade`, `position`, `portfolio`, `security`, `safekeeping`, `cfp`, `alm`, `credit_file`, `intermediary`, `performance`, `concentration`, `limit_set`, `stress`, `liquidity`, `repo`). Fields and events composed per the Composition grammar (e.g., `position.effective_duration`, `position.convexity`, `position.liquidity_bucket`, `position.days_to_liquidate`, `position.stress_haircut`, `repo.collateral_cusip`, `repo.haircut`, `repo.maturity_mismatch_days`, `repo.margin_shortfall_amount`, `instrument_list.part703_category`, `exposure.by_issuer`, `exposure.by_sector`, `exposure.by_counterparty`, `market.depth_indicator`, `market.yield_curve`) are provisional and will be confirmed by engineering before the next review. Timer codes `alm.irr_simulation_due_at`, `portfolio.stress_test_due_at`, `portfolio.board_report_due_at`, `portfolio.report_due_at`, `security.fair_value_update_due_at`, `security.downgrade_review_due_at`, `instrument_list.review_due_at`, `intermediary.review_due_at`, `limit_set.review_due_at`, `cfp.investment_test_due_at`, `cfp.execution_plan_due_at`, `credit_file.reanalysis_due_at`, `performance.attribution_due_at`, `position.liquidity_classification_due`, and `position.analytics_update_due` are composed per the registered Task pattern and are provisional pending engineering registration.

- **CFO aggregate monthly limit.** Patrick's notes reference a CFO aggregate purchase/sale authority limit set in the authority matrix but do not specify a dollar amount. This document treats the limit as a configurable parameter in `authority_matrix.role_limits`. The specific dollar threshold must be set by the Board at the next authority matrix approval and recorded in the matrix.

- **Board materiality threshold for downgrade notification.** The policy requires Board notification for "material positions" subject to a rating downgrade. The specific materiality threshold (e.g., position size as % of Net Worth or $ amount) is not specified in Patrick's notes. This threshold must be defined in the authority matrix and confirmed by the Board.

- **Board exception threshold for pre-trade checklist exceptions.** The policy requires Board notification when the exception log exceeds a board-set threshold. The specific threshold is not specified. This must be defined in the authority matrix.

- **Net Worth definition.** Throughout this policy, "Net Worth" is used as the denominator for diversification and limit calculations, consistent with NCUA usage for federal credit unions. The specific Net Worth figure used for limit calculations should be confirmed as the most recent month-end regulatory net worth figure and documented in the limit set parameters.

- **NCUA §741.3 applicability.** Pynthia Credit Union is described as a credit union but its charter type (federal vs. state-chartered federally insured) is not specified. If state-chartered, [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) may impose additional requirements on nonconforming investments. This should be confirmed with Compliance before the policy is finalized.

- **HMDA reporter status.** Not applicable to this policy; noted for completeness that investment activity is outside HMDA scope.

- **Banker's acceptances.** The reference policy includes banker's acceptances as a permissible money market instrument. Patrick's notes do not include this category. This document omits banker's acceptances from the permissible instruments table. If the Credit Union wishes to hold banker's acceptances, the allow-list and diversification table in IP-03 must be amended and board-approved.

- **Mutual funds and stock holdings.** The reference policy includes mutual funds made up of U.S. obligations, permissible stock holdings, and CRA investments. Patrick's notes do not include these categories for Pynthia. These are omitted from this policy. If the Credit Union wishes to hold these instruments, a separate board approval and allow-list amendment is required, subject to Part 703 permissibility analysis.

- **Tax considerations for municipal securities.** The reference policy addresses bank-qualified bond tax treatment. As a credit union, Pynthia is generally tax-exempt; the tax-optimization objective present in the reference policy's bank context has been omitted. If Pynthia has taxable income and municipal tax treatment is relevant, this should be addressed in the permissible instruments appendix.

- **HTM transfer reason — tax law change.** The reference policy lists "change in tax laws (not tax rates)" as a permitted HTM transfer reason. Patrick's notes list "major regulatory change" but not a separate tax-law-change reason. This document follows Patrick's notes and the GAAP/regulatory standard applicable to credit unions. If a tax-law-change carve-out is needed, it should be added in an amendment.

- **SC-02 shared control source file.** The embeddable block for SC-02 has been synthesized from the policy requirements described in Patrick's notes and the registered vocabulary, as the `shared-controls/record-retention-mechanics.md` source file was not provided as an input. Engineering should confirm that the SC-02 block emitted here is byte-identical to the canonical shared-controls file before publication.
