---
title: Basel II Standardized Approach Framework Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Basel II, Capital Adequacy, Risk-Weighted Assets, Liquidity, ICAAP, Pillar 3]
---

# Basel II Standardized Approach Framework Policy

## General Policy Statement

Pynthia Credit Union maintains loss-absorbing capital and stable funding sufficient to withstand both normal and stressed conditions, targeting ratios that exceed NCUA minima and that are informed by Basel II's three-pillar framework — Pillar 1 minimum capital requirements, Pillar 2 supervisory review (ICAAP and stress testing), and Pillar 3 market discipline (disclosures). As an NCUA-regulated US credit union, Pynthia is not directly subject to Basel II; this policy voluntarily adapts its standardized-approach principles to all assets, liabilities, and off-balance-sheet exposures of the credit union for risk-management strength and future harmonization with banking standards, while actual regulatory compliance follows NCUA rules (12 CFR Part 702 for capital, 12 CFR § 741.12 for liquidity). Capital planning and PCA category management, secondary capital, advanced (IRB) approaches, detailed contingency funding operations, enterprise risk taxonomy, and security-level investment risk weighting are out of scope and governed by the Capitalization, Liquidity, Enterprise Risk Management, and Investment Policies respectively.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratio calculation | Quarter-end close (`gl.period_closed`) | Within 15 business days of quarter-end | Total RBC, Tier 1, CET1, leverage ratios via NCUA RBC calculator | [BC-01](#bc-01-minimum-capital-requirements) |
| Capital ratio falls below internal target | Ratio computed below target (`capital.ratio_below_target`) | Contingency plan activated within 5 business days | Dividend restrictions, asset sales, capital restoration steps | [BC-01](#bc-01-minimum-capital-requirements) |
| Quarterly RWA computation | Quarter-end close (`gl.period_closed`) | Within 15 business days of quarter-end | Credit, operational, and market risk RWA by category | [BC-03](#bc-03-risk-weighted-assets-computation) |
| Weekly liquidity position report | Weekly reporting cycle (`liquidity.report_due`) | Each Friday by close of business | LCR, NSFR, loan-to-share, funding concentration | [BC-05](#bc-05-liquidity-requirements) |
| Liquidity below 20% of shares | Liquidity ratio breach detected (`liquidity.cfp_trigger_breached`) | CFP activated within 1 business day | Contingency Funding Plan actions, CLF access assessment | [BC-05](#bc-05-liquidity-requirements) |
| Buffer breach payout restriction | Combined buffer falls below threshold (`capital.buffer_breached`) | Restriction applied before next dividend declaration | Payout restriction schedule (e.g., 60% if buffer < 1.25%) | [BC-06](#bc-06-capital-buffer-ratios) |
| Annual ICAAP | Annual cycle start (`icaap.cycle_started`) | Completed and Board-presented within 90 days of fiscal year-end | ICAAP document: Pillar 2 risks, capital adequacy conclusion | [BC-07](#bc-07-pillar-2-icaap) |
| Annual stress test | Annual cycle start (`stress_test.cycle_started`) | Completed alongside ICAAP, within 90 days of fiscal year-end | Scenario results (20% share outflow, 10% GDP drop) | [BC-08](#bc-08-stress-testing) |
| Quarterly ALCO ratio review | ALCO meeting convened (`alco.meeting_convened`) | Within 30 days of quarter-end | Ratio dashboard, trend analysis, threshold status | [BC-09](#bc-09-monitoring-and-reporting) |
| Board notification of ratio shortfall | Ratio below target confirmed (`capital.ratio_below_target`) | Board notified within 10 days | Shortfall analysis and recovery plan per NCUA PCA matrix | [BC-09](#bc-09-monitoring-and-reporting) |
| 5300 Call Report submission | NCUA filing window opens (`report.5300_window_open`) | Per NCUA quarterly filing deadline | Capital and balance-sheet data from bookkeeping layer | [BC-09](#bc-09-monitoring-and-reporting) |
| Annual Pillar 3 disclosure | Fiscal year-end close (`gl.fiscal_year_closed`) | Published within 120 days of fiscal year-end | Capital ratios, RWA breakdown, risk exposures | [BC-10](#bc-10-pillar-3-disclosures-and-training) |
| Annual staff training | Training cycle start (`training.capital_cycle_started`) | Completed within the calendar year | Capital/liquidity framework training completion records | [BC-10](#bc-10-pillar-3-disclosures-and-training) |

## BC-01 — Minimum Capital Requirements {#bc-01-minimum-capital-requirements}

- **WHY (Reg cite):** Basel II Pillar 1 sets the 8% minimum total capital-to-RWA standard ([BIS, International Convergence of Capital Measurement and Capital Standards, June 2006, para. 40](https://www.bis.org/publ/bcbs128.htm)); NCUA's risk-based capital framework establishes the binding regulatory floor for complex credit unions ([12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104)) and net worth categories ([12 CFR § 702.102](https://www.ecfr.gov/current/title-12/part-702/section-702.102)).
- **SYSTEM BEHAVIOR:** The CFO's finance team calculates four ratios quarterly using NCUA's RBC calculator against quarter-end general-ledger balances: Total Risk-Based Capital ≥ 8% of RWA, Tier 1 ≥ 6% of RWA, CET1 ≥ 4.5% of RWA, and Leverage (Tier 1 / total assets) ≥ 4%. These are internal targets layered above NCUA minima; where NCUA's Part 702 thresholds are stricter for Pynthia's asset size, the stricter threshold governs. Falling below any target activates the contingency plan — dividend restrictions, asset sales, or other balance-sheet actions — coordinated with the Capitalization Policy, which owns PCA category management. Ratio calculation inputs and the published results are write-restricted to Finance, with Compliance holding read access for verification.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter-end GL close completes (`gl.period_closed`) | Quarter-end balances by 5300 code (`bookkeeping_entry.account_code_5300`, `bookkeeping_entry.schedule_a_code`), total RWA (`capital.rwa_total`), Tier 1 and Tier 2 components (`capital.tier1_total`, `capital.tier2_total`) | Quarterly capital ratio set — Total RBC, Tier 1, CET1, leverage (`capital.ratios_calculated`) | 15 business days after quarter-end (enforced by `capital.ratio_calc_due_at`) |
  | Any ratio computed below its internal target (`capital.ratio_below_target`) | Ratio values and shortfall amounts (`capital.ratio_shortfall[]`), current dividend schedule (`capital.dividend_schedule`), saleable asset inventory (`capital.contingency_asset_list[]`) | Contingency plan activation memo with selected actions (`capital.contingency_activated`) | 5 business days (enforced by `capital.contingency_due_at`) |

- **ALERTS/METRICS:** Dashboard alert when any ratio is within 50 bps of its target; target-zero count of quarters with a ratio below target; ratio-calculation latency tracked against the 15-business-day SLA.

## BC-02 — Components of Capital {#bc-02-components-of-capital}

- **WHY (Reg cite):** Basel II defines eligible Tier 1 and Tier 2 capital and required deductions ([BIS, June 2006, paras. 49(i)–49(xviii)](https://www.bis.org/publ/bcbs128.htm)); NCUA defines the capital numerator for the risk-based capital ratio ([12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)).
- **SYSTEM BEHAVIOR:** Finance classifies capital components each quarter: Tier 1 comprises retained and undivided earnings plus qualifying perpetual preferred, less deductions for goodwill and deferred tax assets exceeding 10% of Tier 1; Tier 2 comprises subordinated debt, general loan loss reserves up to 1.25% of RWA, and revaluation reserves. Total Capital = Tier 1 + Tier 2. Instruments not meeting the qualifying criteria (e.g., secondary capital for low-income designation, which is out of scope per the Capitalization Policy) are excluded. The capital component schedule and its classification rules are write-restricted to Finance; Compliance reviews classification changes before they take effect.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly capital classification run, after GL close (`gl.period_closed`) | Equity and reserve balances (`capital.retained_earnings`, `capital.undivided_earnings`, `capital.perpetual_preferred`), deduction items (`capital.goodwill`, `capital.dta_balance`), Tier 2 items (`capital.subordinated_debt`, `capital.general_reserves`, `capital.revaluation_reserves`) | Capital component schedule — Tier 1, Tier 2, Total Capital with deductions applied (`capital.components_classified`) | 10 business days after quarter-end (internal; feeds `capital.ratio_calc_due_at`) |
  | New capital instrument issued or reserve reclassified (`capital.instrument_changed`) | Instrument terms (`capital.instrument_terms`), proposed tier classification (`capital.proposed_tier`) | Compliance-reviewed classification decision (`capital.classification_approved`) | Before the next quarterly ratio calculation (internal: 10 BD) |

- **ALERTS/METRICS:** Alert when general loan loss reserves counted in Tier 2 approach the 1.25%-of-RWA cap or DTAs approach the 10%-of-Tier-1 deduction threshold; quarterly reconciliation variance between the component schedule and GL equity accounts, target zero.

## BC-03 — Risk-Weighted Assets Computation {#bc-03-risk-weighted-assets-computation}

- **WHY (Reg cite):** Basel II's standardized approach for credit risk ([BIS, June 2006, paras. 50–210](https://www.bis.org/publ/bcbs128.htm)), Basic Indicator Approach for operational risk (paras. 649–651), and standardized market risk measurement define the RWA denominator; NCUA prescribes risk-weighted asset calculation for the RBC ratio ([12 CFR § 702.104(c)](https://www.ecfr.gov/current/title-12/part-702/section-702.104)).
- **SYSTEM BEHAVIOR:** Finance computes total RWA quarterly as the sum of three components: (1) credit risk RWA = Σ (exposure × risk weight) across all on- and off-balance-sheet exposures using the schedule in [BC-04](#bc-04-risk-weight-schedule); (2) operational risk RWA under the Basic Indicator Approach = capital charge of 15% of average annual gross income over the trailing 3 years, converted to RWA-equivalent; (3) market risk RWA under the standardized method, applied only when trading assets exceed 10% of total assets, with capital charge = 8% × Market RWA. Security-level investment risk weighting follows the Investment Policy. The RWA model, mappings, and outputs are write-restricted to Finance with Compliance read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter-end GL close completes (`gl.period_closed`) | Exposure balances by category (`rwa.exposure_balances[]`), assigned risk weights (`rwa.risk_weight_map`), off-balance-sheet commitments and CCFs (`rwa.obs_exposures[]`, `rwa.ccf_map`) | Credit risk RWA by exposure category (`rwa.credit_calculated`) | 15 business days after quarter-end (enforced by `capital.ratio_calc_due_at`) |
  | Trailing 3-year gross income available at quarter-end (`gl.period_closed`) | Annual gross income for trailing 3 years (`rwa.gross_income_3yr[]`) | Operational risk RWA — Basic Indicator Approach (`rwa.operational_calculated`) | 15 business days after quarter-end (enforced by `capital.ratio_calc_due_at`) |
  | Trading assets measured above 10% of total assets at quarter-end (`rwa.trading_threshold_crossed`) | Trading book positions and valuations (`rwa.trading_positions[]`), total assets (`gl.total_assets`) | Market risk RWA and 8% capital charge (`rwa.market_calculated`) | 15 business days after quarter-end (enforced by `capital.ratio_calc_due_at`) |

- **ALERTS/METRICS:** Quarter-over-quarter RWA movement exceeding 10% triggers a review alert; trading-assets-to-total-assets ratio monitored monthly against the 10% market-risk threshold; reconciliation of RWA exposure totals to the GL balance sheet, target zero variance.

## BC-04 — Risk Weight Schedule {#bc-04-risk-weight-schedule}

- **WHY (Reg cite):** Basel II standardized risk weights by claim type ([BIS, June 2006, paras. 50–81](https://www.bis.org/publ/bcbs128.htm)) and credit risk mitigation/collateral recognition (paras. 109–210); NCUA assigns credit-union-specific risk weights, including for CUSO investments and derivatives ([12 CFR § 702.104(c)(2)](https://www.ecfr.gov/current/title-12/part-702/section-702.104)).
- **SYSTEM BEHAVIOR:** Finance maintains a standing risk weight schedule applied during the [BC-03](#bc-03-risk-weighted-assets-computation) computation: 0% for cash and US government claims; 20% for claims on banks and short-term off-balance-sheet exposures (20% credit conversion factor); 50% for qualifying 1–4 family residential mortgages with LTV ≤ 80%; 100% for commercial and member business loans; 150% for loans more than 90 days past due; 300% for high-risk equities and speculative real estate; 1,250% for low-rated securitization tranches. Recognized collateral and sovereign adjustments may reduce the applied weight, and NCUA-specific weights apply to CUSO investments and derivative exposures where they differ from Basel II. Residential mortgages that lose qualifying status (LTV drift above 80% on refresh, or delinquency past 90 days) are remapped at the next quarterly run rather than intra-quarter. The schedule is write-restricted to Finance and any change requires CCO approval before use.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly exposure mapping during RWA run (`rwa.mapping_run_started`) | Exposure category and attributes per asset (`rwa.exposure_category`, `loan.ltv`, `loan.days_past_due`, `rwa.collateral_type`), current schedule version (`rwa.schedule_version`) | Exposure-to-weight mapping file used by the RWA computation (`rwa.weights_applied`) | Within the 15-business-day quarterly calculation window (enforced by `capital.ratio_calc_due_at`) |
  | Risk weight schedule change proposed (`rwa.schedule_change_proposed`) | Proposed weight change and rationale (`rwa.proposed_change`), Basel/NCUA citation supporting it (`rwa.change_authority`) | CCO-approved schedule version increment (`rwa.schedule_approved`) | Before the next quarterly RWA run (internal: 10 BD review) |

- **ALERTS/METRICS:** Count of exposures mapped to a default 100% weight for lack of category data (target: declining to zero); alert on any exposure entering the 150%/300%/1,250% buckets; schedule-version drift check confirming the approved version was the one applied each quarter.

## BC-05 — Liquidity Requirements {#bc-05-liquidity-requirements}

- **WHY (Reg cite):** NCUA requires a board-approved written liquidity policy and contingency funding plan ([12 CFR § 741.12](https://www.ecfr.gov/current/title-12/section-741.12)), with CLF access governed by [12 CFR Part 725](https://www.ecfr.gov/current/title-12/part-725) and supervisory expectations in NCUA Letter to Credit Unions [13-CU-10](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/liquidity-and-contingency-funding-plans); LCR and NSFR standards are adopted from Basel III ([BIS, Basel III liquidity framework](https://www.bis.org/bcbs/basel3.htm)) for future-proofing.
- **SYSTEM BEHAVIOR:** Treasury maintains the Board-approved written liquidity policy covering sources and uses of funds and produces a weekly liquidity position report. Internal targets: LCR ≥ 100%, NSFR ≥ 100%, loan-to-share ratio ≤ 85%, and no more than 50% of funding from a single source. A Contingency Funding Plan covers moderate and severe stress scenarios, including Central Liquidity Facility access; the CFP activates automatically when liquidity falls below 20% of shares. Detailed contingency funding operations are governed by the Liquidity Policy — this control sets the framework targets and the activation trigger. The weekly report and CFP status are write-restricted to Treasury, with ALCO and Compliance read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Weekly liquidity reporting cycle (`liquidity.report_due`) | Liquid asset balances (`liquidity.hqla_balance`), 30-day net outflows (`liquidity.net_outflows_30d`), stable funding profile (`liquidity.asf_total`, `liquidity.rsf_total`), loans and shares totals (`gl.total_loans`, `gl.total_shares`), funding sources by counterparty (`liquidity.funding_sources[]`) | Weekly liquidity position report — LCR, NSFR, loan-to-share, concentration (`liquidity.report_published`) | Each Friday COB (enforced by `liquidity.report_due_at`) |
  | Liquidity measured below 20% of shares (`liquidity.cfp_trigger_breached`) | Current liquidity ratio (`liquidity.ratio_to_shares`), CFP action menu (`liquidity.cfp_actions[]`), CLF borrowing capacity (`liquidity.clf_capacity`) | CFP activation record and notification to ALCO and the Board (`liquidity.cfp_activated`) | 1 business day (enforced by `liquidity.cfp_activation_due_at`) |
  | Funding concentration exceeds 50% from a single source (`liquidity.concentration_breached`) | Funding source breakdown (`liquidity.funding_sources[]`) | Diversification remediation plan logged to ALCO (`liquidity.diversification_plan_logged`) | Next ALCO meeting (internal: 30 days) |

- **ALERTS/METRICS:** Weekly alert when LCR or NSFR falls below 110% (early-warning band above the 100% target); loan-to-share trend alert at 80% (5 points before the 85% ceiling); count of weeks with a late liquidity report, target zero; CFP activation count reported to the Board.

## BC-06 — Capital Buffer Ratios {#bc-06-capital-buffer-ratios}

- **WHY (Reg cite):** Capital conservation and countercyclical buffers are adopted from Basel III ([BIS, Basel III: A global regulatory framework, paras. 122–150](https://www.bis.org/publ/bcbs189.htm)) as forward-looking enhancements to the Basel II Pillar 1 minima ([BIS, June 2006, para. 40](https://www.bis.org/publ/bcbs128.htm)); payout restrictions align conceptually with NCUA's earnings-retention requirements ([12 CFR § 702.201](https://www.ecfr.gov/current/title-12/part-702/section-702.201)).
- **SYSTEM BEHAVIOR:** Pynthia holds a Capital Conservation Buffer of 2.5% of RWA in CET1 above the 4.5% minimum, for a combined CET1 target of ≥ 7%. A Countercyclical Buffer of 0–2.5% of RWA activates when annual credit growth exceeds 10%, with the level set by ALCO and ratified by the Board. Buffer breaches restrict dividends and other payouts on a sliding scale — for example, a 60% payout restriction when the buffer falls below 1.25% — applied before the next dividend declaration. The systemic (G-SIB) buffer does not apply to credit unions and is permanently set to zero. Buffer levels and the restriction schedule are write-restricted to Finance with CCO approval required for changes.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly ratio set published ([BC-01](#bc-01-minimum-capital-requirements)) (`capital.ratios_calculated`) | CET1 ratio (`capital.cet1_ratio`), RWA total (`capital.rwa_total`), active countercyclical buffer level (`capital.ccyb_level`) | Buffer position assessment — conservation + countercyclical headroom (`capital.buffer_assessed`) | 5 business days after ratio publication (internal) |
  | Annual credit growth measured above 10% (`capital.credit_growth_threshold_crossed`) | Year-over-year loan growth (`gl.loan_growth_yoy`), proposed buffer level (`capital.proposed_ccyb_level`) | ALCO-set, Board-ratified countercyclical buffer activation (`capital.ccyb_activated`) | Next quarterly ALCO meeting (internal: 30 days) |
  | Combined buffer falls below restriction threshold (`capital.buffer_breached`) | Buffer shortfall (`capital.buffer_shortfall`), restriction schedule (`capital.payout_restriction_schedule`), pending dividend declarations (`capital.dividend_schedule`) | Payout restriction order applied to dividend processing (`capital.payout_restricted`) | Before the next dividend declaration (enforced by `capital.payout_restriction_due_at`) |

- **ALERTS/METRICS:** Alert when combined CET1 falls within 50 bps of the 7% combined target; credit-growth tracker reported monthly against the 10% countercyclical trigger; target-zero count of dividends declared while a restriction order was pending.

## BC-07 — Pillar 2 ICAAP {#bc-07-pillar-2-icaap}

- **WHY (Reg cite):** Basel II Pillar 2 requires an internal capital adequacy assessment process proportionate to the institution's risk profile ([BIS, June 2006, paras. 725–745](https://www.bis.org/publ/bcbs128.htm)); NCUA's capital planning expectations for covered credit unions provide the domestic analogue ([12 CFR § 702.304](https://www.ecfr.gov/current/title-12/part-702/section-702.304)).
- **SYSTEM BEHAVIOR:** The CFO leads an annual Internal Capital Adequacy Assessment Process documenting material risks not fully captured by Pillar 1 — at minimum concentration risk and interest rate risk — quantifying the additional capital each implies, and concluding whether current and projected capital is adequate over the planning horizon. The ICAAP document is reviewed by ALCO, approved by the CCO, and presented to the Board. Enterprise-wide risk taxonomy and aggregation methodology follow the Enterprise Risk Management Policy; ICAAP consumes that taxonomy rather than redefining it. The ICAAP document and supporting models are write-restricted to Finance, with Compliance read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual ICAAP cycle opens at fiscal year-end (`icaap.cycle_started`) | Pillar 1 ratio set (`capital.ratios_calculated`), concentration exposures (`icaap.concentration_exposures[]`), interest rate risk measures (`icaap.irr_measures`), capital projections (`icaap.capital_projections`) | ICAAP document with capital adequacy conclusion, ALCO-reviewed and Board-presented (`icaap.completed`) | 90 days after fiscal year-end (enforced by `icaap.due_at`) |
  | Material new risk identified mid-cycle (`icaap.material_risk_identified`) | Risk description and exposure estimate (`icaap.new_risk_assessment`) | Interim ICAAP addendum logged to ALCO (`icaap.addendum_logged`) | Next quarterly ALCO meeting (internal: 30 days) |

- **ALERTS/METRICS:** ICAAP completion tracked against the 90-day deadline (target: zero late cycles); count of Pillar 2 risks carrying an explicit capital add-on, with year-over-year comparison; Board presentation date logged each cycle.

## BC-08 — Stress Testing {#bc-08-stress-testing}

- **WHY (Reg cite):** Basel II Pillar 2 requires forward-looking stress testing as part of capital assessment ([BIS, June 2006, paras. 726, 738](https://www.bis.org/publ/bcbs128.htm)); NCUA mandates supervisory stress testing for covered credit unions and treats it as sound practice for all ([12 CFR § 702.306](https://www.ecfr.gov/current/title-12/part-702/section-702.306)).
- **SYSTEM BEHAVIOR:** Finance conducts annual stress tests of Board-approved scenarios — at minimum a 20% member share outflow and a 10% GDP decline — measuring the impact on capital ratios, liquidity ratios, and earnings, and identifying the management actions available in each scenario. Results feed the ICAAP ([BC-07](#bc-07-pillar-2-icaap)) and the CFP trigger calibration in [BC-05](#bc-05-liquidity-requirements). Scenario definitions may only be changed with ALCO approval. Stress models and results are write-restricted to Finance with Compliance and ALCO read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual stress test cycle opens (`stress_test.cycle_started`) | Approved scenario definitions (`stress_test.scenarios[]`), baseline balance sheet (`gl.balance_sheet_snapshot`), behavioral assumptions (`stress_test.assumptions`) | Stress test results — post-stress capital and liquidity ratios with management action menu (`stress_test.completed`) | 90 days after fiscal year-end, alongside ICAAP (enforced by `stress_test.due_at`) |
  | Post-stress ratio falls below regulatory minimum in any scenario (`stress_test.minimum_breached`) | Scenario, ratio, and shortfall detail (`stress_test.breach_detail`) | Remediation recommendation escalated to ALCO and the Board (`stress_test.remediation_escalated`) | 30 days from result finalization (internal) |

- **ALERTS/METRICS:** Stress test completion tracked against the annual deadline (target: zero late cycles); count of scenarios producing a sub-minimum ratio, trended year over year; time from breach identification to ALCO escalation.

## BC-09 — Monitoring and Reporting {#bc-09-monitoring-and-reporting}

- **WHY (Reg cite):** NCUA's prompt corrective action framework governs responses to declining net worth ([12 CFR § 702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204)) and the 5300 Call Report is the mandatory quarterly supervisory filing ([12 CFR § 741.6](https://www.ecfr.gov/current/title-12/section-741.6)); Basel II Pillar 2 expects supervisory and board-level monitoring of capital positions ([BIS, June 2006, paras. 746–760](https://www.bis.org/publ/bcbs128.htm)).
- **SYSTEM BEHAVIOR:** ALCO reviews all capital and liquidity ratios quarterly against targets and trends. Finance files the NCUA 5300 Call Report each quarter, sourcing balance-sheet classifications from the bookkeeping layer's 5300 account codes, and reports the same ratio set internally to the Board. If any ratio falls below its internal target, the Board is notified within 10 days and a recovery plan is implemented consistent with the NCUA PCA matrix ([12 CFR § 702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204)); PCA category management itself is owned by the Capitalization Policy. The ALCO ratio dashboard is write-restricted to Finance, with read access for ALCO members, the CCO, and the Board.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly ALCO meeting convened (`alco.meeting_convened`) | Current ratio set (`capital.ratios_calculated`), liquidity report series (`liquidity.report_published`), buffer position (`capital.buffer_assessed`) | ALCO minutes with ratio review and threshold status (`alco.ratio_review_logged`) | Within 30 days of quarter-end (internal) |
  | NCUA 5300 filing window opens (`report.5300_window_open`) | Balance-sheet aggregates by 5300 code (`bookkeeping_entry.account_code_5300`, `bookkeeping_entry.schedule_a_code`), capital ratio set (`capital.ratios_calculated`) | Filed 5300 Call Report with submission confirmation (`report.5300_filed`) | NCUA quarterly filing deadline (enforced by `report.5300_due_at`) |
  | Ratio confirmed below internal target (`capital.ratio_below_target`) | Shortfall analysis (`capital.ratio_shortfall[]`), draft recovery plan (`capital.recovery_plan_draft`) | Board notification and adopted recovery plan per PCA matrix (`board.shortfall_notified`) | 10 days (enforced by `board.notification_due_at`) |

- **ALERTS/METRICS:** Days-to-file tracker for each 5300 submission (target: zero late filings); Board notification latency for shortfalls measured against the 10-day requirement; count of consecutive quarters with all ratios above target.

## BC-10 — Pillar 3 Disclosures and Training {#bc-10-pillar-3-disclosures-and-training}

- **WHY (Reg cite):** Basel II Pillar 3 requires periodic public disclosure of capital structure, capital adequacy, and risk exposures to enable market discipline ([BIS, June 2006, paras. 808–826](https://www.bis.org/publ/bcbs128.htm)); NCUA's full and fair disclosure principle for financial statements provides the domestic anchor ([12 CFR § 702.402](https://www.ecfr.gov/current/title-12/part-702/section-702.402)).
- **SYSTEM BEHAVIOR:** Compliance publishes an annual Pillar 3 disclosure covering capital ratios, the RWA breakdown by risk category, and material risk exposures, drawing exclusively from the quarter-four outputs of [BC-01](#bc-01-minimum-capital-requirements) and [BC-03](#bc-03-risk-weighted-assets-computation) so disclosed figures always reconcile to filed figures. Compliance also delivers annual staff training on this framework to Finance, Treasury, and ALCO participants, tracking completion. Disclosure drafts are write-restricted to Compliance and require CCO sign-off before publication.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Fiscal year-end close completes (`gl.fiscal_year_closed`) | Q4 ratio set (`capital.ratios_calculated`), RWA breakdown (`rwa.credit_calculated`, `rwa.operational_calculated`, `rwa.market_calculated`), material exposure summary (`icaap.concentration_exposures[]`) | Published Pillar 3 disclosure with CCO sign-off (`disclosure.pillar3_published`) | 120 days after fiscal year-end (enforced by `disclosure.pillar3_due_at`) |
  | Annual training cycle opens (`training.capital_cycle_started`) | Assigned staff roster (`training.assignee_roster[]`), current framework curriculum (`training.curriculum_version`) | Training completion records per staff member (`training.capital_completed`) | Within the calendar year (enforced by `training.completion_due_at`) |

- **ALERTS/METRICS:** Disclosure publication tracked against the 120-day deadline (target: zero late); reconciliation check confirming disclosed ratios match 5300-filed ratios, target zero variance; training completion rate, target 100% by year-end with an aging alert at 60 days remaining.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, interpretation, and the annual review.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Asset-Liability Committee (quarterly ratio review, buffer and scenario approvals), Chief Financial Officer (ratio calculation, RWA, ICAAP, stress testing), Board of Directors (liquidity policy approval, buffer ratification, shortfall notifications, recovery plans).
- **Review cadence:** Annual review by the next_review date in the front-matter, or sooner upon a material NCUA rule change to [Part 702](https://www.ecfr.gov/current/title-12/part-702) or [§ 741.12](https://www.ecfr.gov/current/title-12/section-741.12), a Basel framework revision Pynthia elects to adopt, or activation of any contingency or recovery plan under [BC-01](#bc-01-minimum-capital-requirements), [BC-05](#bc-05-liquidity-requirements), or [BC-09](#bc-09-monitoring-and-reporting).
- **Cross-references:** Capitalization Policy (capital planning, capital actions, PCA category management), Liquidity Policy (contingency funding operations), Enterprise Risk Management Policy (risk taxonomy and aggregation), Investment Policy (security-level risk weighting).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The capital, liquidity, RWA, ICAAP, stress-testing, reporting, and training event and field codes used throughout the EVENTS tables (e.g., `capital.ratios_calculated`, `liquidity.cfp_trigger_breached`, `rwa.weights_applied`, `icaap.completed`, `report.5300_filed`) are not registered in `vocabulary.json`, which currently covers the banking core only (14 entities, 252 fields, zero events). The only registered codes reused here are the bookkeeping fields `bookkeeping_entry.account_code_5300` and `bookkeeping_entry.schedule_a_code`. All other names are the target naming scheme and will be confirmed by engineering before the next review.
- **Basel II is adopted voluntarily.** Pynthia is not subject to Basel II; where this policy's Basel-derived targets (8% total capital, 6% Tier 1, 4.5% CET1, buffers, LCR/NSFR) differ from binding NCUA requirements under Part 702, the NCUA requirement governs for regulatory compliance and the Basel-derived figure operates as an internal target only. Whether Pynthia currently meets the "complex credit union" asset threshold that makes the Part 702 RBC ratio binding needs confirmation from Finance.
- **Internal SLAs are assumed.** PATRICK_NOTES specified the 10-day Board notification and the quarterly/weekly/annual cadences; the 15-business-day ratio calculation window, 5-business-day contingency activation, 1-business-day CFP activation, 90-day ICAAP/stress-test completion, and 120-day Pillar 3 publication windows are minimal-viable assumptions pending CFO and CCO confirmation.
- **Buffer restriction schedule is partially specified.** Patrick's notes give one point on the payout restriction curve (60% restriction if buffer < 1.25%); the full sliding scale needs to be defined by ALCO and ratified by the Board before the first buffer assessment.
- **Operational risk RWA conversion needs confirmation.** The Basic Indicator Approach yields a capital charge (15% of average gross income); the convention for converting that charge to an RWA-equivalent (multiplying by 12.5) is assumed and should be confirmed against the NCUA RBC calculator's treatment.
- **Stress scenarios are a minimum set.** The 20% share outflow and 10% GDP decline scenarios from Patrick's notes are treated as the floor; ALCO may add scenarios (e.g., rate shocks consistent with the IRR program) without amending this policy.
- **CLF access assumed in place.** The Contingency Funding Plan references Central Liquidity Facility access under 12 CFR Part 725; current CLF membership status and borrowing capacity need confirmation from Treasury.
- **Pillar 3 publication channel undefined.** Patrick's notes require annual Pillar 3 disclosures but do not specify the publication venue (member-facing website vs. annual report); Compliance will confirm before the first cycle.
