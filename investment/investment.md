---
title: Investment Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Investments, NCUA Part 703, ALM, Liquidity, Credit Risk]
---

## General Policy Statement

Pynthia Credit Union invests surplus funds and places non-loan assets to protect safety and soundness, maintain adequate liquidity, earn a reasonable risk-adjusted yield, and remain within board-approved authority and the limits of the Federal Credit Union Act and NCUA Part 703. This policy governs all investments, repurchase and reverse repurchase agreements, deposits, and other non-loan asset placements held on the balance sheet, whether executed directly or through third parties. Safety of principal is the primary consideration at all times. This policy does not authorize derivative activity (Part 703 Subpart B) or retail nondeposit investment product sales — those are governed by separate policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---:|---|
| Board approves/readopts Investment Policy and authority matrix | Annual review window opens (`policy.board_review_started`) | ≤ 12 months between approvals; warn at 60 & 30 days | Canonical policy record, effective/next-review dates | [IP-01](#ip-01-policy-canon-objectives-and-covered-instruments) |
| Trade requires approval beyond delegated authority | CFO trade proposed above matrix limit (`trade.approval_requested`) | Before settlement | Authority matrix entry, approver | [IP-02](#ip-02-governance-board-oversight-and-delegated-authority) |
| Prohibited/non-permitted instrument entered | Trade entry screened (`trade.permissibility_checked`) | At trade entry (block) | Allow-list mapped to §703.13–703.14 | [IP-03](#ip-03-permissible-investments-and-prohibited-activities) |
| Quarterly IRR / market depreciation test | Quarter opens (`alm.irr_simulation_due`) | ≤ quarterly; more often on breach | EVE/total-return scenarios; ≤30% NW depreciation @ +100/+200/+300 bps | [IP-04](#ip-04-interest-rate-risk-and-alm-integration) |
| Credit downgrade below investment-grade threshold | Security downgraded (`security.downgraded`) | 5 business days; board notice if material | Internal credit re-analysis | [IP-05](#ip-05-credit-risk-standards-and-downgrade-management) |
| Monthly liquidity capacity report | Report period closes (`liquidity.report_due`) | ≤ monthly; more under stress | On-demand & 30-day stress capacity | [IP-06](#ip-06-liquidity-and-marketability-limits) |
| Concentration limit breach at trade entry | Limit checked (`trade.limit_checked`) | At trade entry (soft warn / hard block) | Diversification limits table | [IP-07](#ip-07-concentration-and-counterparty-limits) |
| Safekeeping statement reconciliation | Statement received (`safekeeping.statement_received`) | ≤ monthly per §703.9(c) | Bank records vs. agent statement | [IP-08](#ip-08-approved-brokers-dealers-and-safekeepers) |
| Repo collateral mark / margin shortfall | Revaluation due (`repo.collateral_revaluation_due`) | ≥ weekly; daily under stress | Collateral, haircut, mismatch | [IP-09](#ip-09-repurchase-and-reverse-repurchase-agreements) |
| Quarterly fair value / OTTI evaluation | Quarter closes (`security.quarter_closed`) | ≤ quarterly | Fair value verification; OTTI write-down | [IP-10](#ip-10-valuation-accounting-and-fair-value-measurement) |
| Pre-purchase due diligence & exception | Trade proposed (`trade.approval_requested`) | Before booking | Pre-trade checklist, credit memo, valuation support | [IP-11](#ip-11-pre-purchase-due-diligence-and-exceptions) |
| Recurring monitoring & board reporting | Report due (`portfolio.report_due` / `portfolio.board_report_due`) | Monthly to mgmt; ≥ quarterly to board | Composition, duration, liquidity, gain/loss, limits | [IP-12](#ip-12-ongoing-monitoring-reporting-and-stress-testing) |
| Quarterly performance attribution | Attribution due (`performance.attribution_due`) | ≤ quarterly | Total-return vs. benchmark by segment | [IP-13](#ip-13-performance-measurement-and-benchmarks) |
| Trade lifecycle SoD & reconciliation | Trade settled (`trade.settled`) | Reconcile within T+1 | Segregated initiation/approval/settlement/accounting | [IP-14](#ip-14-trade-execution-controls-and-segregation-of-duties) |
| Trade artifacts indexed & retained | Trade booked (`trade.booked`) | Attach within 2 business days | Tickets, confirmations, memos, approvals | [IP-15](#ip-15-recordkeeping-and-documentation-retention) |
| Training & COI certification for covered staff | Annual cycle / new hire (`training.annual_cycle_opened`) | Before access; annual | Training & COI completion | [IP-16](#ip-16-training-competency-and-conflicts-of-interest) |
| Liquidity stress declared | Stress declared (`liquidity.stress_declared`) | Initial execution plan ≤ 1 business day | CFP liquidation hierarchy | [IP-17](#ip-17-contingency-planning-and-liquidity-stress-events) |

## IP-01 — Policy Canon, Objectives, and Covered Instruments  {#ip-01-policy-canon-objectives-and-covered-instruments}

- **WHY (Reg cite):** NCUA Part 703 requires a board-approved written investment policy covering objectives, permissible activities, and risk limits ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)), grounded in the safety-and-soundness mandate of the Federal Credit Union Act and the permissible-investment scope of [§703.13–703.14](https://www.ecfr.gov/current/title-12/part-703).
- **SYSTEM BEHAVIOR:** A single canonical Investment Policy record carries the effective date, next-review date, version, and the five stated objectives (provide earnings, provide liquidity, mitigate IRR, ensure safety of principal, meet pledging requirements), all pursued consistent with safe-and-sound practices and Part 703. Every balance-sheet position — investments, repos, deposits, and other non-loan placements — is tagged to this policy at booking. The system raises review-warning signals at 60 and 30 days before the next-review date; if the review lapses without board readoption, in-scope positions remain governed by the prior policy version and are flagged non-compliant rather than blocked. The canonical policy record and its limit registry are write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual policy review window opens (`policy.board_review_started`) | Current document version (`policy.document_version`), effective date (`policy.effective_date`), next-review date (`policy.next_review_date`), objectives statement (`policy.limit_registry`) | Review record + warning schedule armed (`policy.review_warning_issued`) | ≤12 months between approvals; warn at 60/30 days (enforced by `policy.review_due_at`, `policy.review_warning_at`) |
  | Board readopts policy (`policy.board_approved`) | Board resolution (`policy.minutes_reference`), redline (`policy.draft_redline`) | Approved canonical version (`policy.version_published`) | Before prior version lapses (enforced by `policy.board_approval_due_at`) |
  | Review lapses without approval (`policy.review_lapsed`) | Affected position tags (`position.policy_tagged`), prior version id (`policy.document_id`) | Non-compliance flag on in-scope positions (`policy.noncompliance_flagged`) | At lapse date (`policy.next_review_at`) |
  | New position booked | Instrument type (`position.instrument_type`), CUSIP (`position.cusip`), policy linkage (`position.policy_tagged`) | Policy-tagged position (`position.booked`) | At booking (—) |

- **ALERTS/METRICS:** Policy-review aging alert fires at 60 and 30 days (`alert.policy_review_aging`); target is zero in-scope positions carrying a `policy.noncompliance_flagged` state at any month-end.

## IP-02 — Governance, Board Oversight, and Delegated Authority  {#ip-02-governance-board-oversight-and-delegated-authority}

- **WHY (Reg cite):** Part 703 requires board oversight of investment activity, written delegation of authority, and approval of broker-dealers and safekeepers ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3), [§703.5](https://www.ecfr.gov/current/title-12/part-703/section-703.5)); the FCU Act vests ultimate investment responsibility in the board.
- **SYSTEM BEHAVIOR:** An authority matrix defines investment decision rights and single-trade and aggregate monthly limits by role. The board reviews and approves the policy and the authority matrix at least annually (not to exceed 12 months), reviews and approves the securities-dealer and safekeeping-agent lists, and reviews investment activity and summary reports at least quarterly (monthly preferred). The ALCO/Investment Committee meets at least monthly to develop strategy, monitor risk attributes, ensure policy and regulatory compliance, review economic and rate conditions, and report all activity to the board. The CFO (or designated CIO) is the primary investment officer for day-to-day management; the CFO's aggregate monthly purchase/sale authority may not exceed the matrix limit, and transactions beyond it require prior President/CEO or ALCO approval before settlement. Exceptions are documented and approved before settlement. The authority matrix is write-restricted to the Chief Compliance Officer with Finance concurrence.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade proposed above delegated authority (`trade.approval_requested`) | Trade ticket (`trade.ticket`), matrix entry (`authority_matrix.role_limits`), proposed approver | Approval decision linked to approver (`trade.approval_recorded`) | Before settlement (—) |
  | Authority matrix change proposed (`authority.matrix_change_proposed`) | Change rationale (`authority.change_rationale`), Finance concurrence (`authority.finance_concurrence`) | Updated matrix (`authority.matrix_updated`) | Board approval ≤12 months (enforced by `policy.board_approval_due_at`) |
  | ALCO monthly meeting held (`alco.ratio_review_logged`) | Strategy inputs, risk attributes, rate review | ALCO review record routed to board (`board.audit_review_recorded`) | ≤ monthly (—) |
  | Board reviews investment activity (`board.audit_review_recorded`) | Quarterly activity & summary reports (`portfolio.board_report_due`) | Board minutes recorded (`board.minutes_recorded`) | ≥ quarterly (enforced by `portfolio.board_report_due_at`) |

- **ALERTS/METRICS:** Alert on any settlement that proceeds without a recorded approver where one was required (target zero); track monthly count of trades executed against CFO aggregate authority versus the matrix ceiling, with a warning as utilization approaches 100%.

## IP-03 — Permissible Investments and Prohibited Activities  {#ip-03-permissible-investments-and-prohibited-activities}

- **WHY (Reg cite):** Part 703 enumerates permissible investments and activities ([§703.13](https://www.ecfr.gov/current/title-12/part-703/section-703.13), [§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)) and prohibits specified instruments and activities ([§703.15](https://www.ecfr.gov/current/title-12/part-703/section-703.15), [§703.16](https://www.ecfr.gov/current/title-12/part-703/section-703.16)).
- **SYSTEM BEHAVIOR:** An allow-list maps each permitted instrument type to its Part 703 §703.13–703.14 category and carries the per-category parameters — single-security limit, single-issuer limit, maximum maturity, and maximum weighted average life — documented in a permissible-instruments appendix and reviewed at least annually and whenever Part 703 changes materially. Portfolio allocations are bounded by the diversification guidelines (percent of total portfolio and percent of Net Worth) reproduced in the policy appendix; ALCO selects the instrument combination giving the best risk/reward for the total portfolio within those bounds. The system blocks booking of any instrument not on the allow-list and any prohibited instrument: derivatives (absent a separate board-approved derivatives policy under Subpart B), subordinated debt, instruments below the four highest NRSRO rating categories, stripped MBS unless specifically permitted, and anything triggering §703.15 prohibited activities. The allow-list and instrument appendix are write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered for permissibility screen (`trade.permissibility_checked`) | Instrument type (`trade.instrument_type`), allow-list category (`instrument_list.part703_category`), instrument parameters (`instrument_list.version`) | Permissible/blocked decision (`trade.blocked_prohibited`) | At trade entry (block) |
  | Allow-list periodic/triggered review (`instrument_list.review_completed`) | Current list version (`instrument_list.version`), Part 703 change source (`regulatory.source_doc`) | Reviewed instrument list (`instrument_list.review_completed`) | ≥ annually; on material Part 703 change (enforced by `instrument_list.review_due_at`) |
  | Material Part 703 change identified (`regulatory.change_analysis_logged`) | Change citation (`regulation.citation`), required-change flag (`regulatory.change_required`) | Regulatory change analysis (`regulatory.change_analysis_logged`) | On identification (enforced by `regulatory.analysis_due_at`) |

- **ALERTS/METRICS:** Target zero successful bookings of prohibited or off-list instruments (`trade.blocked_prohibited` block rate = 100% of attempts); alert when the instrument-list review is overdue.

## IP-04 — Interest Rate Risk and ALM Integration  {#ip-04-interest-rate-risk-and-alm-integration}

- **WHY (Reg cite):** Part 703 requires measuring and managing the interest-rate-risk characteristics of investments ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)), and the NCUA Examiner's Guide expects investment IRR to integrate with the credit union's ALM framework.
- **SYSTEM BEHAVIOR:** The system captures effective duration, convexity, and cash-flow vectors per security and feeds them into ALM models for IRR measurement. Prospective, scenario-based total-return analysis — an income simulation to a defined horizon combined with the projected market value (EVE) at that horizon — is the primary tool for comparing unlike cash flows across rate scenarios; management evaluates plausible scenarios rather than predicting rates. ALCO runs IRR simulations at least quarterly and more often when thresholds are breached. A market-depreciation limit applies: under parallel yield-curve shifts of +100, +200, and +300 basis points the aggregate price depreciation of the combined AFS and HTM portfolio may not exceed 30% of Net Worth; this is computed at least quarterly and reported to ALCO and the board. IRR model parameters and reviewers are write-restricted to the CFO/CIO function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly IRR simulation due (`alm.scenario_set`) | Per-security duration/convexity (`position.effective_duration`, `position.convexity`), cash-flow vectors, scenario set (`stress.behavioral_assumptions`) | Completed IRR simulation (`alm.irr_simulation_completed`) | ≤ quarterly; more on breach (enforced by `alm.irr_simulation_due_at`) |
  | Market depreciation test computed (`portfolio.stress_test_completed`) | AFS+HTM fair values (`position.fair_value`), Net Worth (`cda.net_worth`), +100/+200/+300 bps shocks (`stress.baas_shock_params`) | Depreciation result vs. 30% NW limit (`portfolio.stress_test_completed`) | ≤ quarterly (enforced by `portfolio.stress_test_due_at`) |
  | Depreciation/IRR threshold breached (`stress_test.minimum_breached`) | Breach detail (`stress_test.breach_detail`), Net Worth basis | Breach escalation to ALCO/board (`stress_test.remediation_escalated`) | On breach (—) |
  | Per-security analytics refreshed (`position.analytics_updated`) | Updated rate scenarios, prepayment assumptions | Refreshed position analytics (`position.analytics_updated`) | Per analytics cycle (enforced by `position.analytics_update_due`) |

- **ALERTS/METRICS:** Alert when modeled aggregate depreciation crosses a soft threshold below 30% of Net Worth; track IRR-simulation latency and target zero quarters with a missed or late simulation.

## IP-05 — Credit Risk Standards and Downgrade Management  {#ip-05-credit-risk-standards-and-downgrade-management}

- **WHY (Reg cite):** Part 703 requires independent internal credit analysis for non-government investments ([§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6)); NCUA Supervisory Letter LCU 2013-05 confirms that NRSRO ratings may support but not be the sole basis for investment-grade determination.
- **SYSTEM BEHAVIOR:** For any investment not directly guaranteed by the U.S. government, the system requires a completed credit file and approval before booking, demonstrating that the issuer has adequate capacity to meet its commitments, that default risk is low, and that full and timely repayment is expected — i.e., investment grade. Internal credit analysis is mandatory; NRSRO ratings may support but not solely determine the conclusion, and the credit union will not purchase securities rated below the four highest NRSRO categories. Per-instrument due-diligence requirements (municipal GO, essential-purpose and other municipal revenue, private-label MBS/ABS, corporate, and commercial paper/short-term obligations) are enforced by the pre-trade checklist in IP-11 and captured in the credit memo. Documented re-analysis is completed at least annually; a downgrade from the internal investment-grade threshold triggers review within 5 business days, with board notification for material positions. Internal ratings and credit files are write-restricted to the credit-analysis function under CFO/CIO oversight.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Non-government instrument proposed for purchase (`credit_file.approved`) | Issuer analysis (`credit_file.issuer_analysis`), internal rating (`credit_file.internal_rating`), due-diligence factors | Approved credit file (`credit_file.approved`) | Before booking (—) |
  | Annual credit re-analysis due (`credit_file.reanalysis_completed`) | Prior credit file (`credit_file.id`), updated issuer financials | Completed re-analysis (`credit_file.reanalysis_completed`) | ≥ annually (enforced by `credit_file.reanalysis_due_at`) |
  | Security downgraded below threshold (`security.downgraded`) | Rating change (`security.rating_change`), position id (`position.cusip`), materiality basis | Downgrade review record (`security.downgrade_reviewed`) + board notice if material (`security.board_report_issued`) | 5 business days; board notice for material positions (enforced by `security.downgrade_review_due_at`) |

- **ALERTS/METRICS:** Aging alert on any downgrade review open beyond 5 business days (target zero overdue); track count of positions held below the four-highest NRSRO categories (target zero) and overdue annual credit re-analyses.

## IP-06 — Liquidity and Marketability Limits  {#ip-06-liquidity-and-marketability-limits}

- **WHY (Reg cite):** Part 703 requires the policy to address liquidity and marketability of investments ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); [§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) treats the investment portfolio as a core contingent liquidity source.
- **SYSTEM BEHAVIOR:** Each investment is classified by liquidity bucket, days-to-liquidate, and stress haircut. The portfolio is structured so a sufficient amount of securities can be converted to cash at fair value in a reasonable time and consists largely of securities with active secondary or resale markets; AFS securities may be sold prior to maturity to provide liquid funds. The system reports on-demand and 30-day stress liquidity capacity at least monthly and more frequently under stress. Liquidity classifications are maintained by Treasury under CFO/CIO oversight and are write-restricted to that function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Position liquidity classified (`position.liquidity_classified`) | Liquidity bucket (`position.liquidity_bucket`), days-to-liquidate (`position.days_to_liquidate`), stress haircut (`position.stress_haircut`) | Classified position (`position.liquidity_classified`) | At booking / on reclassification (enforced by `position.liquidity_classification_due`) |
  | Monthly liquidity capacity report due (`liquidity.report_due`) | Liquid-asset balances (`liquidity.liquid_assets`), 30-day net outflows (`liquidity.net_outflows_30d`), haircut table (`liquidity.haircut_table`) | Capacity report issued (`liquidity.capacity_report_issued`) | ≤ monthly; more under stress (enforced by `liquidity.report_due_at`) |
  | Concentration/marketability strain detected (`liquidity.concentration_breached`) | Bucket exposures, days-to-liquidate distribution | Liquidity concentration breach record (`liquidity.concentration_breached`) | On detection (—) |

- **ALERTS/METRICS:** Headroom-low alert when on-demand or 30-day stress capacity falls below internal floors (`alert.headroom_low`); track the share of portfolio classified to illiquid buckets against the operating ceiling.

## IP-07 — Concentration and Counterparty Limits  {#ip-07-concentration-and-counterparty-limits}

- **WHY (Reg cite):** Part 703 requires the policy to set concentration limits addressing single/related issuer, sector, and similar-risk exposures ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)); the diversification table operationalizes those limits.
- **SYSTEM BEHAVIOR:** Parameterized issuer, sector, rating, product, and counterparty limits are enforced at trade entry with soft (warning) and hard (blocking) thresholds, addressing single or related issuer, geographic area, and obligations with similar cash-flow or risk characteristics. The diversification guidelines table (percent of portfolio and percent of Net Worth) and the per-instrument single-security and single-issuer parameters in the appendix constitute the hard limits; ALCO may set tighter operating limits by sector periodically. Limits are reviewed at least annually. The limit set is write-restricted to the Chief Compliance Officer, with ALCO able to tighten (never loosen below) the registered hard limits.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered for limit check (`trade.limit_checked`) | Proposed exposure by issuer/sector (`concentration.position_id`), limit parameters (`limit_set.parameters`), Net Worth basis (`cda.net_worth`) | Soft warning or hard block decision (`trade.limit_warning_issued` / `trade.limit_blocked`) | At trade entry (soft warn / hard block) |
  | Concentration recomputed (`concentration.waiver_opened`) | Top-10 exposures (`concentration.top10`), excess amount (`concentration.excess_amount`) | Concentration computation + any waiver record (`concentration.waiver_decided`) | Per compute cycle (enforced by `concentration.compute_due_at`, `concentration.waiver_due_at`) |
  | Limit set periodic review (`limit_set.review_completed`) | Current parameters (`limit_set.version`), ALCO operating-limit inputs | Reviewed limit set (`limit_set.review_completed`) | ≥ annually (enforced by `limit_set.review_due_at`) |

- **ALERTS/METRICS:** Concentration-breach alert on any hard-limit excursion (`alert.concentration_breach`, target zero unwaived breaches); track soft-warning volume by issuer/sector as an early indicator.

## IP-08 — Approved Brokers, Dealers, and Safekeepers  {#ip-08-approved-brokers-dealers-and-safekeepers}

- **WHY (Reg cite):** Part 703 requires due diligence and board approval of broker-dealers ([§703.8](https://www.ecfr.gov/current/title-12/part-703/section-703.8)) and use of an approved safekeeping arrangement with at least monthly reconciliation ([§703.9](https://www.ecfr.gov/current/title-12/part-703/section-703.9), §703.9(c)).
- **SYSTEM BEHAVIOR:** An approved-intermediaries list carries due-diligence and review dates; the system blocks trades with unapproved intermediaries. The board reviews and approves the securities-dealer list at least annually; the CFO maintains current dealer information. Dealer analysis covers capital strength/liquidity/operating results, reputation for fair and honest dealing, state/federal regulator and FINRA enforcement information, and the experience of the sales representative. Purchased securities are not maintained with the selling dealer but transferred to an approved safekeeping agent per §703.9; bank records of safekeeping are reconciled to agent statements at least monthly per §703.9(c). Approval of existing or additional safekeeping agents requires board action. The approved-intermediaries list is write-restricted to the CFO/CIO function pending board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade entered with intermediary (`trade.permissibility_checked`) | Intermediary id (`trade.intermediary_id`), approved-list status (`intermediary.approved_list`) | Validated or blocked intermediary (`trade.intermediary_blocked`) | At trade entry (block) |
  | Annual intermediary due-diligence review (`intermediary.review_completed`) | Due-diligence file (`intermediary.due_diligence_file`), FINRA/regulator info | Completed dealer/safekeeper review (`intermediary.review_completed`) | ≥ annually (enforced by `intermediary.review_due_at`) |
  | Safekeeping statement received (`safekeeping.statement_received`) | Agent statement (`safekeeping.statement`), bank holdings records | Completed reconciliation (`safekeeping.reconciliation_completed`) | ≤ monthly per §703.9(c) (enforced by `safekeeping.reconciliation_due_at`) |

- **ALERTS/METRICS:** Target zero trades executed with an unapproved intermediary; aging alert on any safekeeping reconciliation not completed within the monthly window.

## IP-09 — Repurchase and Reverse Repurchase Agreements  {#ip-09-repurchase-and-reverse-repurchase-agreements}

- **WHY (Reg cite):** Part 703 governs repurchase/reverse-repurchase transactions and collateral requirements ([§703.14](https://www.ecfr.gov/current/title-12/part-703/section-703.14)); NCUA IRPS 1985-2 sets safe-and-sound collateral, haircut, and maturity-mismatch practices.
- **SYSTEM BEHAVIOR:** Each repo is represented with explicit collateral, haircut, counterparty, and maturity-mismatch fields and is treated as a secured borrowing — a simultaneous sale and repurchase creating a balance-sheet liability while the investment remains an asset. Baseline maximum maturity is 3 months and single-issuer limit is 25% of Net Worth; the system blocks bookings that violate internal or regulatory mismatch and collateral rules per IRPS 1985-2 and Part 703. Collateral is marked to market at least weekly (daily under stress), and margin calls are issued on shortfalls. Repo collateral and counterparty parameters are write-restricted to Treasury under CFO/CIO oversight.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Repo entered for booking (`repo.entered`) | Collateral CUSIP (`repo.collateral_cusip`), haircut (`repo.haircut`), counterparty (`repo.counterparty_id`), mismatch days (`repo.maturity_mismatch_days`) | Booked or blocked repo (`repo.booked` / `repo.blocked_rule_violation`) | At trade entry (block on violation) |
  | Collateral revaluation due (`repo.collateral_revaluation_due`) | Marked collateral value (`repo.collateral_marked`), required margin (`repo.required_margin`) | Revalued collateral record (`repo.collateral_marked`) | ≥ weekly; daily under stress (enforced by `repo.collateral_revaluation_due_at`) |
  | Margin shortfall detected (`repo.margin_shortfall_detected`) | Shortfall amount (`repo.margin_shortfall_amount`), counterparty (`repo.counterparty_id`) | Margin call issued (`repo.margin_call_issued`) | On detection (—) |

- **ALERTS/METRICS:** Mismatch-breach alert on any maturity-mismatch or collateral-rule violation (`alert.mismatch_breach`, target zero booked violations); track open margin-call count and time-to-cure.

## IP-10 — Valuation, Accounting, and Fair-Value Measurement  {#ip-10-valuation-accounting-and-fair-value-measurement}

- **WHY (Reg cite):** Part 703 requires periodic valuation of investments ([§703.11](https://www.ecfr.gov/current/title-12/part-703/section-703.11)); GAAP governs HTM/AFS classification, fair-value measurement, and OTTI.
- **SYSTEM BEHAVIOR:** For each security the system captures book value, amortized cost, and fair value with pricing source and date, and updates fair value at least monthly. At purchase, every security is classified HTM (positive intent and ability to hold to maturity; amortized cost) or AFS (fair value, unrealized gains/losses in a separate equity component, tax-affected, until realized). Transfers between categories are rare and documented by the CFO; HTM sale/transfer is permitted only for the five enumerated reasons (≤3 months to maturity/call; <15% of MBS/CMO purchase face remaining; creditworthiness deterioration; major regulatory change; or a business combination/disposition causing an unacceptable A/L position). AFS repositioning is permitted to improve risk/reward, adjust IRR, improve liquidity, or improve credit quality. At least quarterly the system verifies fair values against reputable, independent pricing sources and supports a security-by-security OTTI evaluation: for any security in a loss position of 10% or more, management assesses whether the issuer is unable to pay all contractual amounts due, and if probable records OTTI and writes the security down to fair value with credit impairment flowing through income. Pricing overrides are restricted to the CFO/Controller under dual approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Fair value update due (`security.fair_value_updated`) | Independent pricing source (`pricing.source`), as-of date (`pricing.as_of_date`), book/amortized/fair values (`position.book_value`, `position.amortized_cost`, `position.fair_value`) | Updated fair values (`security.fair_value_updated`) | ≤ monthly (enforced by `security.fair_value_update_due_at`) |
  | Quarterly OTTI evaluation (`security.quarter_closed`) | Loss-position percentage, expected cash flows vs. amortized cost, impairment indicator (`security.impairment_indicator_raised`) | OTTI analysis + any write-down (`security.otti_analysis_completed`) | ≤ quarterly (—) |
  | Pricing override requested (`pricing.override_requested`) | Override rationale (`pricing.override_rationale`), proposed price (`pricing.proposed_price`), dual approvers (`pricing.exception_approver`) | Applied override under dual approval (`pricing.override_applied`) | Before posting (—) |

- **ALERTS/METRICS:** Alert on any security held >10% below amortized cost lacking a completed OTTI assessment (target zero); track count of pricing overrides applied without recorded dual approval (target zero).

## IP-11 — Pre-Purchase Due Diligence and Exceptions  {#ip-11-pre-purchase-due-diligence-and-exceptions}

- **WHY (Reg cite):** Part 703 requires pre-purchase analysis and recordkeeping for each investment ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4), [§703.6](https://www.ecfr.gov/current/title-12/part-703/section-703.6)).
- **SYSTEM BEHAVIOR:** A pre-trade checklist and approval workflow link each trade to a credit memo (required for non-government instruments) and valuation support before booking; U.S. government and fully insured instruments are exempt from the credit-memo requirement. Required purchase documentation includes issuer, security type, CUSIP, issue size, issue/maturity/call dates, coupon and frequency, trade and settlement dates, par/original-issue/purchase prices, prospective total-return profile, yield/duration/WAL, CPR/PSA assumptions (if applicable), the credit memo, AFS/HTM designation, and dealer name. Required sale documentation includes issuer, security type, CUSIP, rationale for sale, total-return profile at sale price, trade and settlement dates, coupon, price, yield, par value, and dealer name. Checklist exceptions are logged and routed for approval against a board-set materiality threshold before settlement. The exception log and approval thresholds are write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade proposed (`trade.approval_requested`) | Pre-trade checklist (`trade.pretrade_checklist`), credit memo (`credit_file.id`) for non-government, valuation support (`trade.valuation_support`) | Completed checklist + approval (`trade.checklist_completed`, `trade.approval_recorded`) | Before booking (—) |
  | Checklist exception raised (`trade.exception_logged`) | Exception rationale (`exception.rationale`), materiality vs. threshold (`policy.materiality_threshold`), approver | Logged/approved exception (`trade.exception_approved`) | Before settlement (—) |
  | Sale transaction proposed (`trade.approval_requested`) | Rationale for sale, total-return at sale price, sale documentation set | Sale documentation captured (`trade.step_recorded`) | Before settlement (—) |

- **ALERTS/METRICS:** Target zero non-government bookings lacking an approved credit memo; track count of trades booked with an open (unapproved) checklist exception (target zero) and exception volume above the board threshold.

## IP-12 — Ongoing Monitoring, Reporting, and Stress Testing  {#ip-12-ongoing-monitoring-reporting-and-stress-testing}

- **WHY (Reg cite):** Part 703 requires ongoing monitoring and reporting of investment risk to the board ([§703.12](https://www.ecfr.gov/current/title-12/part-703/section-703.12)); the NCUA Examiner's Guide expects stress testing integrated with ALM.
- **SYSTEM BEHAVIOR:** The system generates recurring composition, duration, liquidity, gain/loss, and limit-adherence reports — monthly to management and at least quarterly to the board (monthly preferred) — and runs stress scenarios at least annually and more often as metrics approach limits. The board package includes all purchases, all sales and net gains/(losses), portfolio composition, prospective total-return profile, total-return results, yield/current effective duration/current average life, credit-risk considerations, and market appreciation/depreciation in dollars and as a percent of Net Worth. The ALCO package (at least monthly) includes current and desired composition, prospective total-return profile over one or more horizons, risk-consideration analysis, liquidity objectives, total-return results/effective duration/average life, and Net Worth levels. Report templates and distribution lists are write-restricted to the CFO/CIO function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Management report due (`portfolio.report_due`) | Composition, duration, liquidity, gain/loss (`portfolio.gain_loss_summary`), limit adherence | Management report issued (`portfolio.management_report_issued`) | ≤ monthly (enforced by `portfolio.report_due_at`) |
  | Board report due (`portfolio.board_report_due`) | Purchases/sales, total-return profile/results, yield/duration/WAL, NW depreciation (`portfolio.performance_metrics`) | Board report issued (`portfolio.board_report_issued`) | ≥ quarterly (enforced by `portfolio.board_report_due_at`) |
  | Stress test cycle (`portfolio.stress_test_completed`) | Stress assumptions (`stress_test.assumptions`), scenario parameters | Stress test results (`portfolio.stress_test_completed`) | ≥ annually; more as limits approach (enforced by `portfolio.stress_test_due_at`) |

- **ALERTS/METRICS:** Alert on any management or board report not issued within its window (target zero late); track number of limit-adherence exceptions surfaced per reporting cycle.

## IP-13 — Performance Measurement and Benchmarks  {#ip-13-performance-measurement-and-benchmarks}

- **WHY (Reg cite):** Part 703 requires the policy to support evaluation of whether the portfolio's risk/reward profile is consistent with approved strategy and safe-and-sound practice ([§703.3](https://www.ecfr.gov/current/title-12/part-703/section-703.3)).
- **SYSTEM BEHAVIOR:** Return and income are attributed to benchmarks by segment quarterly, using total-return analysis (income simulation combined with projected market value at the horizon) as the primary tool for comparing unlike cash flows across rate scenarios. Performance measurement supports ALCO's assessment of whether the portfolio's risk/reward profile is consistent with approved strategy, and performance targets must not incentivize breaching risk limits; proposed target changes are reviewed against risk limits before adoption. Performance targets and benchmark definitions are write-restricted to the CFO/CIO function with ALCO review.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly attribution due (`performance.attribution_completed`) | Segment benchmarks (`performance.targets`), total-return results (`portfolio.performance_metrics`) | Completed attribution (`performance.attribution_completed`) | ≤ quarterly (enforced by `performance.attribution_due_at`) |
  | Performance target change proposed (`performance.target_change_proposed`) | Proposed targets (`performance.targets`), applicable risk limits (`limit_set.parameters`) | Risk-reviewed target decision (`performance.target_risk_reviewed`) | Before adoption (—) |

- **ALERTS/METRICS:** Alert when a proposed performance target would require exceeding a registered risk limit (target zero adopted); track quarters with completed, on-time attribution.

## IP-14 — Trade Execution, Controls, and Segregation of Duties  {#ip-14-trade-execution-controls-and-segregation-of-duties}

- **WHY (Reg cite):** Part 703 requires controls and recordkeeping over investment transactions ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4)); the Examiner's Guide expects segregation of duties across the trade lifecycle.
- **SYSTEM BEHAVIOR:** Trade initiation, approval, confirmation, settlement, and accounting are segregated; the system enforces dual control and blocks any single user from controlling a full transaction lifecycle. Each lifecycle step is recorded, trade confirmations are matched to tickets, and settled trades are reconciled within T+1. The segregation-of-duties matrix is write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Lifecycle step attempted (`trade.step_recorded`) | Step attempted (`trade.step_attempted`), initiating user (`transaction.initiated_by`), SoD matrix (`sod.matrix_version`) | Step recorded or SoD-blocked (`trade.sod_blocked`) | At each step (block on conflict) |
  | Trade confirmation received (`trade.confirmation_received`) | Dealer confirmation terms (`confirmation.terms`), trade ticket (`trade.ticket`) | Matched or discrepancy flagged (`trade.confirmation_discrepancy_flagged`) | On receipt (—) |
  | Trade settled (`trade.settled`) | Settlement amount (`trade.settlement_amount`), settlement date (`trade.settlement_date`) | Completed reconciliation (`trade.reconciliation_completed`) | Within T+1 (enforced by `trade.reconciliation_due_at`) |

- **ALERTS/METRICS:** Target zero trades where one user controlled the full lifecycle (`trade.sod_blocked` enforced); aging alert on any settled trade not reconciled by T+1, and track open confirmation discrepancies.

## IP-15 — Recordkeeping and Documentation Retention  {#ip-15-recordkeeping-and-documentation-retention}

- **WHY (Reg cite):** Part 703 requires retention of investment documentation and records ([§703.4](https://www.ecfr.gov/current/title-12/part-703/section-703.4)); enterprise retention schedules follow applicable NCUA and federal requirements.
- **SYSTEM BEHAVIOR:** The system stores and indexes trade tickets, confirmations, credit memos, approvals, safekeeping statements, and reports, applying a retention schedule that complies with applicable NCUA and federal record-retention requirements; documents are attached to their trade within 2 business days. Detailed enterprise retention schedules are governed by the Record Retention Policy; this control enforces attachment, indexing, and the retention clock for investment records. Retention-class assignment and legal holds are write-restricted to the records-management function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade booked (`trade.booked`) | Trade artifact set (`document.type`), subject reference (`document.subject_ref`), retention class (`record.retention_class`) | Indexed, attached records (`record.created`, `record.retention_clock_set`) | Attach within 2 business days (enforced by `document.attachment_due_at`) |
  | Retention period reached (`record.retention_expired`) | Retention anchor (`record.retention_anchor`), legal-hold status (`record.hold_status`) | Disposition record (`record.disposed`) | At schedule expiry (enforced by `record.retention_expires_at`) |
  | Documentation incomplete at booking (`document.required_set`) | Required-document list, attached flag (`document.attached`) | Required-set record + attachment timer armed (`document.required_set`) | Attach within 2 business days (enforced by `document.attachment_due_at`) |

- **ALERTS/METRICS:** Aging alert on any trade with required documents unattached beyond 2 business days (target zero); track records past retention expiry awaiting disposition with no active hold.

## IP-16 — Training, Competency, and Conflicts of Interest  {#ip-16-training-competency-and-conflicts-of-interest}

- **WHY (Reg cite):** Part 703 prohibits conflicts of interest in investment activity ([§703.17](https://www.ecfr.gov/current/title-12/part-703/section-703.17)) and expects competent personnel managing the program; staff must understand applicable requirements.
- **SYSTEM BEHAVIOR:** The system tracks required training and annual conflict-of-interest certifications for covered staff and board members, requires training completion before system access is granted, and auto-suspends access on non-completion. COI certifications surface any conflicting interest for review and recusal. Curriculum assignment and COI determinations are write-restricted to the Chief Compliance Officer and HR for the covered-person roster.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered person hired or role changed (`employee.hired`) | Covered-person designation (`covered_person.role`), curriculum map (`training.role_curriculum`) | Training assignment created (`training.assigned`) | Before access granted (enforced by `training.onboarding_due_at`) |
  | Annual training/COI cycle opens (`training.annual_cycle_opened`) | Assignee (`training.assignee_id`), COI questionnaire (`coi.questionnaire_version`) | Completion + COI certification recorded (`training.completed`, `coi.certified`) | Annually (enforced by `training.annual_due_at`, `coi.questionnaire_due_at`) |
  | Training/COI not completed (`training.assignment_closed`) | Completion status (`training.completion_status`), access role (`access.role_id`) | Access auto-suspended (`access.deprovisioned`) | On non-completion (enforced by `training.completion_due_at`) |

- **ALERTS/METRICS:** Target zero covered users with active investment-system access and lapsed training or COI; track count of identified conflicts with completed recusal records.

## IP-17 — Contingency Planning and Liquidity Stress Events  {#ip-17-contingency-planning-and-liquidity-stress-events}

- **WHY (Reg cite):** [§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a Contingency Funding Plan and treats the investment portfolio as a contingent liquidity source; Part 703 liquidity expectations integrate with the CFP.
- **SYSTEM BEHAVIOR:** The system maintains predefined liquidity stress scenarios and an investment-liquidation hierarchy tied to the Contingency Funding Plan per §741.12, structures the portfolio so a sufficient tranche of AFS securities can be liquidated under stress without fire-sale pricing, tests the investment-liquidation component at least annually, and documents an initial execution plan within 1 business day of an actual stress declaration. Enterprise CFP governance is owned by the Liquidity Policy; this control governs the investment-portfolio contribution to it. The liquidation hierarchy and stress scenarios are write-restricted to the CFO/CIO and Treasury functions.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual CFP investment test (`cfp.investment_test_completed`) | Liquidation hierarchy (`cfp.liquidation_hierarchy`), stress scenarios, AFS liquidatable tranche | Completed investment test (`cfp.investment_test_completed`) | ≥ annually (enforced by `cfp.investment_test_due_at`) |
  | Liquidity stress declared (`liquidity.stress_declared`) | Driver scenario, available AFS tranche (`liquidity.liquid_assets`), liquidation hierarchy | Documented execution plan (`cfp.execution_plan_documented`) | ≤ 1 business day (enforced by `cfp.execution_plan_due_at`) |
  | Liquidation executed under stress (`funding.first_line_executed`) | Draw amount (`funding.draw_amount`), next source (`funding.next_source`) | Executed liquidation record (`funding.draw_executed`) | Per CFP sequence (enforced by `cfp.transition_due_at`) |

- **ALERTS/METRICS:** Alert if an execution plan is not documented within 1 business day of a declared stress (target zero late); track annual CFP investment-test completion and the modeled stressed-liquidation capacity versus contingent funding need.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintaining this policy, the authority matrix, allow-list, limit sets, and exception thresholds.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Chief Financial Officer / Chief Investment Officer (or equivalent), ALCO/Investment Committee, Treasury, Risk, Finance, and Internal Audit/Supervisory Committee as required.
- **Board cadence:** Board reviews and approves this policy and the authority matrix at least annually, not to exceed 12 months between approvals, and earlier on material change to Part 703 or related guidance; board reviews investment activity and summary reports at least quarterly (monthly preferred), approves the securities-dealer and safekeeping-agent lists at least annually, and receives downgrade, breach, and stress escalations as triggered.
- **Review cadence:** Annual at minimum; earlier on material regulatory change. Full version history, redlines, and approval metadata are maintained per IP-01.
- **Cross-references:** Derivatives authority (Part 703 Subpart B), retail NDIP sales, enterprise liquidity / CFP governance, ALM and capital-adequacy frameworks, enterprise record-retention schedules, and broker/custodian third-party risk management beyond investment due diligence are governed by their respective separate policies.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several investment-side resources, fields, events, and timers referenced in the EVENTS tables (e.g., `position.*`, `repo.*`, `safekeeping.*`, `instrument_list.*`, `intermediary.*`, `security.*`, `cfp.*`, `alm.*`, `portfolio.*`, `performance.*`, `concentration.*`, `limit_set.*`, `trade.*`) appear in the parsed `core-vocabulary.json` dump and are treated as registered; where a near-fit field was reused across entities (e.g., `cda.net_worth` for the Net Worth basis used in diversification and depreciation limits, `stress.baas_shock_params` for the +100/+200/+300 bps parallel shocks, `pricing.*` for fair-value override controls), engineering will confirm the intended subject before the next review.
- **Net Worth basis vs. reference policy's Tier 1 Capital.** The source policy expressed limits as a percent of Tier 1 Capital; per Patrick's notes this credit-union policy uses Net Worth. The diversification table and 30%-depreciation limit are stated against Net Worth; the canonical Net Worth definition and computation source must be confirmed (currently mapped to `cda.net_worth`).
- **Charter and §741.3 nonconforming-investment treatment.** Pynthia is modeled as a federal credit union under Part 703 Subpart A; the special reserve treatment of nonconforming investments under §741.3 applies to state charters and was not separately controlled here. Confirm charter type and whether §741.3 reserve handling is in scope.
- **HECM and structured-note baselines.** Per-instrument maturity/WAL/issuer baselines (e.g., HECM 50-year max maturity, structured/callable agency 20-year max maturity) are reproduced from Patrick's notes into the IP-03 instrument appendix; engineering should confirm these as the registered allow-list parameters.
- **Bank-only categories removed.** The reference policy's Tax-Management objective, Trading account, mutual-fund/stock-holding/CRA/banker's-acceptance instrument categories, and Risk-Based-Capital (Call Report RC-R) treatment were dropped as inapplicable to this credit-union Part 703 scope; confirm none are required.
- **Materiality and exception thresholds.** Board-set thresholds for "material" downgrade positions (IP-05) and pre-purchase checklist exceptions (IP-11) are referenced via `policy.materiality_threshold` / `policy.exception_threshold` but their numeric values are not specified in Patrick's notes and must be set by the board.
- **Stress / depreciation scenario engine.** The +100/+200/+300 bps parallel-shift depreciation calculation and quarterly IRR simulation are mapped to `portfolio.stress_test_*` and `alm.irr_simulation_*`; confirm whether these run in the ALM model of record or a separate investment analytics engine.
