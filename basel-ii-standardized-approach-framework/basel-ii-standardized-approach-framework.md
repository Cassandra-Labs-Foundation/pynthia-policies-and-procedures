```yaml
---
title: Basel II Standardized Approach Framework Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Capital Adequacy, Liquidity, Basel II, Risk-Weighted Assets, NCUA, ICAAP]
---
```

## General Policy Statement

Pynthia Credit Union adopts the principles of the Basel II Standardized Approach as a voluntary risk-management framework to strengthen capital adequacy, liquidity resilience, and risk governance beyond the minimum requirements of [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702). As a federally chartered credit union regulated by the NCUA, Pynthia is not directly subject to Basel II; however, this policy formalizes Basel II's three-pillar structure—minimum capital requirements (Pillar 1), supervisory review and internal capital adequacy assessment (Pillar 2), and market discipline through public disclosure (Pillar 3)—to future-proof risk management and align with evolving NCUA expectations. The policy applies to all assets, liabilities, and off-balance-sheet exposures of the credit union. Actual regulatory compliance is governed by NCUA rules; where this policy sets targets above NCUA minima, the higher internal target governs. Secondary capital for low-income designated credit unions, advanced IRB approaches, capital planning and PCA category management, detailed contingency funding operations, enterprise risk taxonomy, and investment-level security risk weighting are out of scope and addressed in separate policies.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratio calculation | Quarter-end close → `capital.ratios.verified` | 15 calendar days after quarter-end | NCUA RBC calculator output; all four ratios | [BA-01](#ba-01-minimum-capital-requirements) |
| Capital target breach — Board notification | Ratio falls below internal target → `capital.target.breached` | 10 calendar days | Board memo with ratios and recovery plan reference | [BA-01](#ba-01-minimum-capital-requirements) |
| Capital components classification | Any change to Tier 1 or Tier 2 instruments → `capital.components.classified` | Same quarter as change | Component schedule with deductions | [BA-02](#ba-02-components-of-capital) |
| RWA mapping run | Quarter-end close → `rwa.mapping_run.started` | 15 calendar days after quarter-end | Credit, operational, and market RWA sub-totals | [BA-03](#ba-03-risk-weighted-assets-computation) |
| Risk-weight schedule change | Proposed change to weight table → `rwa.schedule_change.proposed` | Before next mapping run | Updated weight map with change authority | [BA-04](#ba-04-risk-weight-schedule) |
| Weekly liquidity position report | Each Monday → `liquidity.report.published` | Monday by close of business | HQLA, net outflows, LCR, NSFR, loan-to-share ratio | [BA-05](#ba-05-liquidity-requirements) |
| CFP activation | Liquidity-to-shares falls below 20% → `liquidity.cfp.activated` | Immediate | CFP level, funding sources, CLF draw plan | [BA-05](#ba-05-liquidity-requirements) |
| Capital Conservation Buffer breach | CET1 buffer falls below 2.5% → `capital.buffer.breached` | Next business day | Payout restriction schedule; restriction percentage | [BA-06](#ba-06-buffer-ratios) |
| Countercyclical Buffer activation | Credit growth exceeds 10% YoY → `capital.ccyb.activated` | Within 30 calendar days of threshold crossing | Proposed CCyB level; ALCO recommendation | [BA-06](#ba-06-buffer-ratios) |
| Annual ICAAP completion | Annual cycle opens → `icaap.cycle.started` | Within 90 calendar days of fiscal year-end | ICAAP report covering concentration, IRR, and Pillar 2 add-ons | [BA-07](#ba-07-pillar-2-icaap-and-stress-testing) |
| Annual stress test completion | Annual cycle opens → `capital.stress_report.issued` | Within 90 calendar days of fiscal year-end | Stress report with scenario results and remediation | [BA-07](#ba-07-pillar-2-icaap-and-stress-testing) |
| Quarterly ALCO ratio review | Quarter-end close → `alco.ratio_review.logged` | Within 30 calendar days of quarter-end | ALCO minutes with ratio review and action items | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |
| Annual Pillar 3 disclosure publication | Fiscal year-end → `disclosure.pillar3.published` | Within 120 calendar days of fiscal year-end | Capital ratios, RWA breakdown, risk exposures | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |
| NCUA 5300 Call Report filing | Quarter-end close → `ncua.notification.sent` | Per NCUA filing calendar | Capital and liquidity fields per NCUA instructions | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |
| Annual staff training completion | Annual training cycle opens → `training.capital_cycle.started` | Within 90 calendar days of cycle open | Training completion records for all covered staff | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |

---

## BA-01 — Minimum Capital Requirements {#ba-01-minimum-capital-requirements}

**WHY (Reg cite):** [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104) establishes the risk-based capital ratio (Adjusted Net Worth / Risk-Weighted Assets ≥ 8%) as the NCUA well-capitalized threshold; [12 CFR § 702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204) defines the PCA matrix and mandatory actions when ratios fall below thresholds. This policy adopts Basel II's Pillar 1 minimum capital framework (BIS, *International Convergence*, June 2006, paras. 6–49) as an internal standard, setting targets at or above NCUA minima: Total RBC ≥ 8% of RWA, Tier 1 RWA ≥ 6%, CET1 ≥ 4.5%, and Leverage ≥ 4% (Tier 1 / total assets).

**SYSTEM BEHAVIOR:** Each quarter, the system ingests the NCUA RBC calculator output and records all four ratios against their internal targets. If any ratio falls below its internal target, the system emits a breach event and opens a Board notification task due within 10 calendar days; if a ratio falls below the NCUA well-capitalized threshold, the system additionally records the applicable PCA category and mandatory actions per § 702.204. Contingency actions (dividend restrictions, asset sales) are referenced by ID from the Capitalization Policy and are not executed within this system. The `capital` object is write-restricted to the Chief Financial Officer and Chief Compliance Officer; read access is available to ALCO members and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end close triggers ratio computation (`capital.ratios.verified`) | NCUA RBC calculator output; `capital.rwa_total`, `capital.tier1_total`, `capital.tier2_total`, `capital.ratio_total_rbc`, `capital.ratio_tier1_rwa`, `capital.cet1_ratio`, `capital.ratio_tier1_leverage`; `capital.targets` | Quarterly ratio record (`capital.quarterly_report.issued`); ratio record ID stored in `capital.quarterly_report_id` | 15 calendar days after quarter-end (enforced by `capital.ratio_computation_due_at`) |
| Any ratio falls below internal target (`capital.target.breached`) | `capital.ratio_below_target`, `capital.target_total_rbc`, `capital.target_tier1_rwa`, `capital.target_tier1_leverage`; prior quarter ratios in `capital.prior_ratios` | Board notification task opened; escalation memo (`capital.board_escalation.issued`); `capital.board_escalation` recorded | 10 calendar days (enforced by `capital.contingency_memo_due_at`) |
| Ratio falls below NCUA well-capitalized threshold (`capital.pca_threshold.breached`) | `capital.pca_category`, `capital.pca_threshold`, `capital.regulatory_minima` | PCA classification recorded (`capital.pca_classification.recorded`); mandatory actions logged in `capital.pca_mandatory_actions` | Immediate upon detection |
| Contingency plan referenced for execution (`capital.contingency.activated`) | `capital.contingency_action_id`; reference to Capitalization Policy plan ID in `capital.plan_id` | Contingency activation logged (`capital.contingency_action.executed`) | Per Capitalization Policy SLA |

**ALERTS/METRICS:** Alert fires when any ratio is within 50 bps of its internal target (early-warning band); a separate alert fires immediately on any breach. Target: zero quarters with a ratio below the NCUA well-capitalized threshold. ALCO dashboard displays all four ratios with red/amber/green status updated within one business day of quarter-end computation.

---

## BA-02 — Components of Capital {#ba-02-components-of-capital}

**WHY (Reg cite):** [12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2) defines "adjusted net worth" for NCUA purposes; Basel II Pillar 1 (BIS, paras. 49–89) specifies Tier 1 and Tier 2 capital components and deductions. This control operationalizes those definitions: Tier 1 = retained/undivided earnings + qualifying perpetual preferred, less goodwill and DTAs exceeding 10% of Tier 1; Tier 2 = subordinated debt + general loan loss reserves (capped at 1.25% of RWA) + revaluation reserves; Total Capital = Tier 1 + Tier 2.

**SYSTEM BEHAVIOR:** The system maintains a capital components schedule on the `capital` object, updated each quarter and whenever a qualifying instrument is issued, modified, or retired. Deductions are computed automatically: goodwill is sourced from `capital.goodwill`; DTA balance from `capital.dta_balance`; the 10%-of-Tier-1 threshold is enforced by the computation engine. General reserves are capped at 1.25% of `capital.rwa_total` before inclusion in Tier 2. Any proposed change to a capital instrument triggers a classification approval workflow before the instrument is reflected in the schedule. The `capital.components` field is write-restricted to the Chief Financial Officer; the Chief Compliance Officer has read and approval rights.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end computation run (`capital.components.classified`) | `capital.retained_earnings`, `capital.undivided_earnings`, `capital.perpetual_preferred`, `capital.goodwill`, `capital.dta_balance`, `capital.intangibles_balance`, `capital.subordinated_debt`, `capital.general_reserves`, `capital.revaluation_reserves`, `capital.rwa_total` | Capital components schedule recorded; `capital.tier1_total` and `capital.tier2_total` updated; classification event logged (`capital.classification.approved`) | Same quarter as quarter-end close (enforced by `capital.ratio_computation_due_at`) |
| New or modified capital instrument proposed (`capital.instrument.changed`) | `capital.instrument_terms`; proposed tier classification in `capital.proposed_tier` | Classification approval workflow opened; instrument recorded after approval (`capital.components.classified`) | Before next quarterly computation run |
| DTA balance exceeds 10% of Tier 1 (computed inline during classification) | `capital.dta_balance`, `capital.tier1_total` | Excess DTA deduction applied and logged in `capital.components`; alert emitted | Immediate upon detection during computation |

**ALERTS/METRICS:** Alert fires if general reserves included in Tier 2 exceed 1.25% of RWA (cap enforcement check). Alert fires if any Tier 1 deduction item changes by more than 5% quarter-over-quarter without a corresponding instrument-change event. Target: zero quarters where the components schedule is not reconciled to the general ledger within 15 days of quarter-end.

---

## BA-03 — Risk-Weighted Assets Computation {#ba-03-risk-weighted-assets-computation}

**WHY (Reg cite):** [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104) requires RWA computation for the NCUA RBC ratio; Basel II Pillar 1 standardized approach (BIS, paras. 50–210) specifies credit risk RWA, the Basic Indicator Approach for operational risk RWA (15% of average annual gross income over three years), and the standardized method for market risk RWA (applicable when trading assets exceed 10% of total assets, capital charge = 8% × Market RWA).

**SYSTEM BEHAVIOR:** Each quarter, the RWA engine runs three sub-computations and sums them: (1) credit RWA = Σ(exposure × risk weight) per the schedule in BA-04; (2) operational RWA = 15% × three-year average annual gross income, sourced from the general ledger; (3) market RWA = standardized method output, activated only when `rwa.trading_threshold_crossed` is true (trading assets > 10% of total assets). The engine records each sub-total and the aggregate in the `rwa` and `capital` objects. Changes to the risk-weight schedule require a separate approval workflow (see BA-04) before they affect the computation. The RWA computation is write-restricted to the Chief Financial Officer; the Chief Compliance Officer and ALCO have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end triggers RWA mapping run (`rwa.mapping_run.started`) | `rwa.risk_weight_map`, `rwa.ccf_map`, `rwa.exposure_category` for each asset class; `gl.total_assets`, `gl.total_loans`; three-year gross income series from GL | Credit RWA sub-total (`rwa.credit_calculated`), operational RWA sub-total (`rwa.operational_calculated`), market RWA sub-total (`rwa.market_calculated`) recorded; aggregate `capital.rwa_total` updated; mapping run completed (`rwa.weights.applied`) | 15 calendar days after quarter-end (enforced by `capital.ratio_computation_due_at`) |
| Trading assets exceed 10% of total assets (`rwa.trading_threshold_crossed`) | `gl.total_assets`; trading asset balance from portfolio system | Market RWA computation activated; `rwa.trading_threshold_crossed` set to true; alert emitted | Immediate upon threshold crossing |
| Gross income data refreshed for operational RWA | Three-year annual gross income figures from `gl.balance_sheet_snapshot` | Operational RWA recomputed and logged in `rwa.operational_calculated` | Each quarter, before mapping run completes |

**ALERTS/METRICS:** Alert fires if total RWA changes by more than 10% quarter-over-quarter without a corresponding portfolio or weight-schedule change event. Alert fires if the mapping run does not complete within 15 calendar days of quarter-end. Target: zero quarters where RWA sub-totals do not reconcile to the general ledger trial balance.

---

## BA-04 — Risk-Weight Schedule {#ba-04-risk-weight-schedule}

**WHY (Reg cite):** Basel II standardized approach (BIS, paras. 52–53, Table 1; CRE Chapter 20) specifies risk weights by exposure class; [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104) and NCUA guidance apply credit union-specific weights for CUSOs and derivatives. This control maintains the authoritative weight schedule and governs changes to it.

**SYSTEM BEHAVIOR:** The risk-weight schedule is stored in `rwa.risk_weight_map` and `rwa.ccf_map` and is versioned; the current schedule version is recorded in `rwa.schedule_version`. Standard weights are: 0% — cash and direct obligations of the US government; 20% — claims on banks and short-term off-balance-sheet items (20% credit conversion factor); 50% — qualifying 1–4 family residential mortgages with LTV ≤ 80%; 100% — commercial and member business loans; 150% — loans more than 90 days past due; 300% — high-risk equities and speculative real estate; 1,250% — low-rated securitization tranches. Collateral and sovereign adjustments, and NCUA-specific weights for CUSOs and derivatives, are applied as overlays documented in `rwa.weights`. Any proposed change to the schedule requires a change-authority approval (`rwa.change_authority`) before the new version is activated. The schedule is write-restricted to the Chief Financial Officer with Chief Compliance Officer co-approval; read access is available to all ALCO members.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Proposed change to risk-weight schedule submitted (`rwa.schedule_change.proposed`) | `rwa.proposed_change`; rationale in `rwa.change_authority`; current `rwa.schedule_version` | Change-authority approval workflow opened; proposed schedule held pending approval | Before next quarterly mapping run |
| Schedule change approved (`rwa.schedule.approved`) | Approved `rwa.proposed_change`; approver identity from `capital.regulatory_preapproval_id` if NCUA pre-approval required | New schedule version activated; `rwa.schedule_version` incremented; `rwa.weights.applied` emitted | Effective for next mapping run after approval |
| Loan flagged as >90 days past due (sourced from `loan.delinquency_day_90`) | `loan.days_past_due`, `loan.dpd`; current weight in `rwa.risk_weight_map` | Weight reclassified to 150%; `rwa.weights.applied` logged for affected exposure | Within the same quarterly mapping run |
| NCUA-specific CUSO or derivative exposure identified (`rwa.mapping_run.started`) | Exposure category flag in `rwa.exposure_category`; NCUA overlay weight from `rwa.weights` | NCUA-specific weight applied and logged; `rwa.credit_calculated` updated | Within the same quarterly mapping run |

**ALERTS/METRICS:** Alert fires when a schedule change is proposed but not approved before the next mapping run deadline. Alert fires when any exposure is mapped to the 1,250% weight bucket (securitization tranche), requiring CCO review. Target: zero mapping runs using a schedule version that has not been formally approved.

---

## BA-05 — Liquidity Requirements {#ba-05-liquidity-requirements}

**WHY (Reg cite):** [12 CFR § 741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a board-approved written liquidity policy covering sources and uses of funds; [12 CFR Part 725](https://www.ecfr.gov/current/title-12/part-725) governs CLF access (up to 25% of shares); NCUA Letter to Credit Unions 13-CU-10 provides contingency funding guidance. Basel III liquidity standards (BIS, 2010) — LCR ≥ 100% and NSFR ≥ 100% — are adopted here as internal targets for future-proofing. This control does not govern detailed CFP execution operations, which are addressed in the Liquidity Policy.

**SYSTEM BEHAVIOR:** The system produces a weekly liquidity position report every Monday, computing LCR (HQLA / net 30-day outflows), NSFR (ASF / RSF), loan-to-share ratio (`liquidity.ratio_to_shares`), and largest single funding source concentration. If LCR or NSFR falls below 100%, or if the loan-to-share ratio exceeds 85%, or if any single funding source exceeds 50% of total funding, an alert is emitted and ALCO is notified. If liquidity falls below 20% of total shares (`liquidity.cfp_trigger`), the CFP is activated immediately and the system transitions the `cfp` object to the appropriate stress level. CLF capacity is tracked in `liquidity.clf_capacity` and may not exceed 25% of shares. The board-approved liquidity policy document is referenced by ID in `policy.document_id`; the liquidity policy is write-restricted to the Chief Financial Officer with Board approval; the CFP activation is write-restricted to the Chief Financial Officer and Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Each Monday triggers weekly liquidity report (`liquidity.report.published`) | `liquidity.hqla_balance`, `liquidity.net_outflows_30d`, `liquidity.asf_total`, `liquidity.rsf_total`, `liquidity.ratio_to_shares`, `liquidity.concentration`, `liquidity.clf_capacity`, `gl.total_shares` | Weekly liquidity position report published; LCR and NSFR ratios recorded; `liquidity.report` updated | Monday by close of business (enforced by `liquidity.report_due_at`) |
| LCR or NSFR falls below 100%, or loan-to-share exceeds 85%, or single-source concentration exceeds 50% (`liquidity.concentration.breached`) | Ratio values from weekly report; `liquidity.diversification_plan` | Concentration breach alert emitted; ALCO notified; diversification plan review opened (`liquidity.diversification_plan.logged`) | Same business day as detection |
| Liquidity falls below 20% of shares (`liquidity.cfp_trigger.breached`) | `liquidity.ratio_to_shares`, `gl.total_shares`; `cfp.level` | CFP activated (`liquidity.cfp.activated`); CFP level set in `cfp.level`; CLF draw plan referenced in `cfp.liquidation_hierarchy` | Immediate upon threshold breach (enforced by `liquidity.cfp_activation_due_at`) |
| CFP stress level changes (`cfp.level.changed`) | `cfp.level`; stress scenario description in `liquidity.stress`; `cfp.execution_plan_documented` | CFP transition logged (`cfp.transition.started`); execution plan confirmed | Within 1 business day of level change (enforced by `cfp.transition_due_at`) |
| Annual CFP investment test due (`cfp.investment_test.completed`) | `cfp.investment_test_due_at`; test scenario parameters | CFP investment test results recorded; deficiencies logged | Annually (enforced by `cfp.investment_test_due_at`) |

**ALERTS/METRICS:** Alert fires when LCR or NSFR drops below 110% (early-warning band at 10% above the 100% floor). Alert fires immediately when liquidity-to-shares falls below 25% (pre-CFP warning) and again at 20% (CFP trigger). Target: zero weeks where the liquidity report is published more than one business day late. Loan-to-share ratio tracked on the ALCO dashboard with a red threshold at 85%.

---

## BA-06 — Buffer Ratios {#ba-06-buffer-ratios}

**WHY (Reg cite):** Basel III capital buffer standards (BIS, 2010) — Capital Conservation Buffer (CCB) of 2.5% of RWA in CET1, bringing combined CET1 target to ≥ 7%, and Countercyclical Capital Buffer (CCyB) of 0–2.5% — are adopted as internal targets. No direct NCUA regulation mandates these buffers for credit unions; they are implemented here as voluntary internal standards. The systemic risk buffer (G-SIB surcharge) is not applicable to credit unions and is excluded. Buffer breaches restrict dividends and other capital distributions per the Basel III payout restriction framework.

**SYSTEM BEHAVIOR:** The system tracks the CCB and CCyB separately within the `capital` object. The CCB is assessed each quarter as part of the ratio computation; if CET1 falls below 7% (i.e., the 4.5% minimum plus the 2.5% CCB), a buffer breach is recorded and payout restrictions are applied automatically according to the restriction schedule: if the buffer shortfall is less than 1.25% of RWA, dividends and discretionary payouts are restricted by 60%; the restriction percentage scales down as the buffer is restored. The CCyB is activated by ALCO resolution when credit growth (year-over-year loan growth from `gl.loan_growth_yoy`) exceeds 10%; the proposed CCyB level (0–2.5%) is set by ALCO and recorded in `capital.proposed_ccyb_level`. The systemic buffer is not tracked. Payout restriction decisions are write-restricted to the Chief Financial Officer and Chief Compliance Officer; CCyB activation requires Board approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly computation shows CET1 below 7% (`capital.buffer.breached`) | `capital.cet1_ratio`, `capital.buffer_requirement`, `capital.buffer_shortfall`, `capital.buffer_status` | Buffer breach recorded (`capital.buffer_status.recorded`); payout restriction schedule applied (`capital.distribution_restriction.applied`); `capital.max_payout_ratio` set; `capital.payout_restricted` flagged | Next business day after quarter-end computation |
| Payout restriction applied (`capital.distribution_restriction.applied`) | `capital.buffer_shortfall`, `capital.max_payout_ratio`, `capital.dividend_schedule`, `capital.proposed_distribution_amount` | Restricted distribution decision logged (`capital.restricted_distribution.decided`); `capital.payout_restriction_schedule` recorded | Before any dividend or discretionary payout is processed (enforced by `capital.payout_restriction_due_at`) |
| Credit growth exceeds 10% YoY (`capital.credit_growth_threshold_crossed`) | `gl.loan_growth_yoy`; ALCO recommendation in `capital.proposed_ccyb_level` | CCyB activation proposed to Board (`capital.ccyb.activated`); `capital.ccyb_level` updated after Board approval | Within 30 calendar days of threshold crossing |
| Buffer restored above 7% CET1 (`capital.buffer_status.recorded`) | `capital.cet1_ratio`, `capital.buffer_status` | Buffer restoration recorded; payout restrictions lifted; `capital.payout_restricted` cleared | Same quarter as restoration confirmed |

**ALERTS/METRICS:** Alert fires when CET1 falls within 50 bps of the 7% combined target (early-warning). Alert fires immediately on any buffer breach. Alert fires when credit growth exceeds 8% YoY (pre-CCyB warning at 80% of the 10% threshold). Target: zero quarters where a payout is processed in violation of the applicable restriction schedule.

---

## BA-07 — Pillar 2 ICAAP and Stress Testing {#ba-07-pillar-2-icaap-and-stress-testing}

**WHY (Reg cite):** Basel II Pillar 2 (BIS, paras. 660–709) requires an Internal Capital Adequacy Assessment Process (ICAAP) covering risks not fully captured by Pillar 1, including concentration risk and interest rate risk in the banking book. [12 CFR § 702.304](https://www.ecfr.gov/current/title-12/part-702/section-702.304) references stress testing expectations for complex credit unions; NCUA examination guidance expects documented stress testing for capital adequacy. This control mandates an annual ICAAP and annual stress tests of defined scenarios.

**SYSTEM BEHAVIOR:** Each year, the ICAAP cycle is opened within 30 days of fiscal year-end. The ICAAP report documents: (a) all material risks beyond Pillar 1 (concentration risk per `capital.concentration_exposures`, interest rate risk per `capital.irr_measures` and `icaap.irr_measures`); (b) capital projections under base and stress scenarios (`icaap.capital_projections`); (c) any new risk identified (`icaap.new_risk_assessment`). Stress tests must cover at minimum: a 20% member share outflow scenario and a 10% GDP decline scenario; additional scenarios may be added by ALCO. Stress test results are recorded in `capital.stress_report_id`; if any scenario causes a ratio to fall below the internal target, a remediation plan is required. The ICAAP report requires CCO sign-off (`capital.icaap_cco_signoff`) and is presented to the Board. The ICAAP and stress test objects are write-restricted to the Chief Financial Officer and Chief Compliance Officer; Board presentation is required before the report is finalized.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual ICAAP cycle opens (`icaap.cycle.started`) | `capital.icaap_cycle`; prior year ICAAP report ID in `capital.prior_plan_id`; `icaap.irr_measures`, `icaap.capital_projections`, `icaap.material_risk_identified`, `icaap.new_risk_assessment`, `capital.concentration_exposures` | ICAAP cycle opened (`capital.icaap_cycle.opened`); ICAAP report drafted | Within 30 days of fiscal year-end |
| ICAAP report completed and signed off (`icaap.completed`) | `capital.icaap_cco_signoff`; completed `capital.icaap_report_id` | ICAAP report issued (`capital.icaap_report.issued`); presented to Board (`capital.icaap.presented`) | Within 90 calendar days of fiscal year-end (enforced by `capital.icaap_due_at`) |
| Annual stress test cycle opens (`capital.stress_report.issued`) | `capital.stress_assumptions`; scenario parameters: 20% share outflow, 10% GDP decline; `stress_test.assumptions`, `stress_test.cycle` | Stress test run completed (`stress_test.completed`); results recorded in `capital.stress_report_id`; report issued (`capital.stress_report.issued`) | Within 90 calendar days of fiscal year-end (enforced by `capital.stress_report_due_at`) |
| Stress scenario causes ratio to fall below internal target (`stress_test.minimum.breached`) | `capital.failing_scenario`, `capital.projected_shortfall`, `capital.proforma_ratios` | Remediation plan required; plan opened (`capital.contingency.activated`); escalation to Board (`capital.stress_report.presented`) | Within 30 calendar days of stress test completion (enforced by `capital.remediation_plan_due_at`) |

**ALERTS/METRICS:** Alert fires if the ICAAP report is not completed within 90 days of fiscal year-end. Alert fires if any stress scenario produces a CET1 ratio below 5.5% (100 bps above the regulatory minimum), triggering immediate ALCO review. Target: zero years where the ICAAP is not presented to the Board before the annual Pillar 3 disclosure is published.

---

## BA-08 — Monitoring, Reporting, and Pillar 3 Disclosures {#ba-08-monitoring-reporting-and-pillar-3-disclosures}

**WHY (Reg cite):** Basel II Pillar 3 (BIS, paras. 800–881) requires public disclosure of capital ratios, RWA breakdown, and risk exposures to promote market discipline. [12 CFR § 702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204) requires Board notification and a recovery plan when capital falls below PCA thresholds. NCUA 5300 Call Report filing obligations apply quarterly. NCUA Letter to Credit Unions 13-CU-10 requires documented liquidity monitoring and reporting. Annual staff training on capital and liquidity risk management is required by this policy.

**SYSTEM BEHAVIOR:** ALCO reviews all capital and liquidity ratios quarterly; the review is logged in `alco.ratio_review`. The annual Pillar 3 disclosure is published on the credit union's website and includes: all four capital ratios, RWA breakdown by credit/operational/market, and a summary of risk exposures. The NCUA 5300 Call Report is filed quarterly per the NCUA filing calendar; the system maps capital and liquidity fields to the appropriate 5300 line items using `bookkeeping.account_code_5300`. If any ratio falls below its internal target, the Board is notified within 10 calendar days and a recovery plan is referenced from the Capitalization Policy. Annual staff training covers capital adequacy, liquidity risk, and this policy's requirements; completion is tracked in `training.capital`. The Pillar 3 disclosure is write-restricted to the Chief Compliance Officer with Board approval; the 5300 filing is write-restricted to the Chief Financial Officer; training records are maintained by the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end triggers ALCO ratio review (`alco.ratio_review.logged`) | All four capital ratios from `capital.quarterly_report_id`; liquidity ratios from `liquidity.report`; `alco.meeting_convened` | ALCO ratio review logged (`alco.ratio_review.logged`); ALCO minutes recorded (`board.minutes.recorded`) | Within 30 calendar days of quarter-end |
| Annual Pillar 3 disclosure due (`disclosure.pillar3.published`) | `capital.ratio_total_rbc`, `capital.ratio_tier1_rwa`, `capital.cet1_ratio`, `capital.ratio_tier1_leverage`; `rwa.credit_calculated`, `rwa.operational_calculated`, `rwa.market_calculated`; risk exposure summary from `capital.concentration_exposures` | Pillar 3 disclosure published (`disclosure.pillar3.published`); `disclosure.pillar3_due_at` cleared | Within 120 calendar days of fiscal year-end (enforced by `disclosure.pillar3_due_at`) |
| Quarterly NCUA 5300 Call Report filing due (`ncua.notification.sent`) | Capital and liquidity fields mapped via `bookkeeping.account_code_5300`; `capital.quarterly_report_id`; `liquidity.report` | 5300 filed; NCUA notification sent (`ncua.notification.sent`); acknowledgement logged (`ncua.ack.logged`) | Per NCUA filing calendar |
| Ratio falls below internal target — Board notification required (`capital.target_breach.notified`) | `capital.ratio_below_target`; recovery plan reference from Capitalization Policy in `capital.recovery_plan_draft` | Board notification sent (`board.shortfall.notified`); recovery plan reference logged (`capital.board_escalation.issued`) | 10 calendar days after breach detection (enforced by `capital.contingency_memo_due_at`) |
| Annual training cycle opens (`training.capital_cycle.started`) | `training.capital`; `training.required_curriculum`; `training.annual_due_at` | Training assignments created (`training.assignment.created`); completion tracked in `training.capital` | Within 90 calendar days of cycle open (enforced by `training.annual_due_at`) |

**ALERTS/METRICS:** Alert fires if the Pillar 3 disclosure is not published within 120 days of fiscal year-end. Alert fires if the 5300 filing is not submitted by the NCUA deadline. Alert fires if ALCO ratio review minutes are not recorded within 30 days of quarter-end. Training completion rate tracked monthly; alert fires if completion falls below 90% of covered staff at the 60-day mark of the training cycle.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all controls; signs off on ICAAP; approves Pillar 3 disclosure; oversees training |
| **Chief Financial Officer** | Executes RWA computation, capital component classification, liquidity reporting, and 5300 filing |
| **Asset-Liability Committee (ALCO)** | Quarterly ratio review; CCyB activation recommendation; stress scenario approval |
| **Board of Directors** | Approves liquidity policy; approves CCyB activation; receives Board notifications on ratio breaches; approves Pillar 3 disclosure |

**Review cadence:** This policy is reviewed annually, no later than 12 months from the effective date, or immediately upon any material change to NCUA capital or liquidity regulations, or upon NCUA examination findings related to capital adequacy or liquidity.

**Cross-references:**
- Capitalization Policy — capital planning, capital actions, PCA category management
- Liquidity Policy — detailed CFP execution operations
- Enterprise Risk Management Policy — enterprise risk taxonomy and aggregation
- Investment Policy — investment portfolio risk weighting at the security level

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are drawn from the registered `core-vocabulary.json` vocabulary (`capital`, `rwa`, `liquidity`, `cfp`, `icaap`, `alco`, `disclosure`, `training`, `ncua`, `gl`, `stress_test`, `loan`). All codes used are registered or composed per the Composition grammar. No new objects or actions were minted. The following fields used in this policy are composed as new properties on registered objects and are flagged as provisional pending engineering confirmation: `capital.icaap_cco_signoff` (new property on `capital`), `capital.concentration_exposures` (new property on `capital`), `capital.irr_measures` (new property on `capital`), `capital.ratio_below_target` (new property on `capital`), `capital.recovery_plan_draft` (new property on `capital`), `rwa.trading_threshold_crossed` (new property on `rwa`), `liquidity.ratio_to_shares` (new property on `liquidity`), `liquidity.clf_capacity` (new property on `liquidity`), `training.capital` (new property on `training`). These will be confirmed by engineering before the next policy review.

- **Basel II is not directly applicable to credit unions.** Pynthia is regulated by the NCUA under 12 CFR Part 702, not by Basel II. This policy adopts Basel II principles voluntarily. All regulatory compliance obligations are governed by NCUA rules; Basel II targets are internal management standards only. If NCUA harmonizes with Basel III/IV standards in the future, this policy will require revision.

- **CET1 ratio definition.** NCUA Part 702 does not define CET1 separately from the RBC ratio. The CET1 ratio (≥ 4.5%) and the Capital Conservation Buffer (2.5% of RWA) are adopted here as internal Basel III-aligned targets. The system must implement a CET1 computation that maps to the credit union's capital structure; the exact mapping (e.g., treatment of perpetual preferred shares as CET1 vs. Additional Tier 1) requires CFO and CCO confirmation before the first quarterly computation.

- **Operational risk gross income definition.** The Basic Indicator Approach uses "average annual gross income over three years." The specific definition of gross income for credit union purposes (e.g., net interest income plus non-interest income, consistent with NCUA 5300 line items) must be confirmed by the CFO and documented in the RWA computation procedure before the first mapping run.

- **Market risk RWA applicability.** The standardized method for market risk is activated only when trading assets exceed 10% of total assets. Pynthia does not currently maintain a trading book; this threshold is expected to remain unbreached. If trading activity is initiated, the Investment Policy and this policy must be updated concurrently.

- **NCUA-specific weights for CUSOs and derivatives.** NCUA applies specific risk weights to Credit Union Service Organization (CUSO) investments and derivative exposures that differ from Basel II standard weights. The exact NCUA weights must be confirmed against current NCUA guidance and loaded into `rwa.weights` before the first mapping run. This is flagged as a gap requiring CFO and CCO sign-off.

- **Pillar 3 disclosure format.** Basel II Pillar 3 specifies qualitative and quantitative disclosure requirements (BIS, paras. 800–881). The specific format and content of Pynthia's annual Pillar 3 disclosure (e.g., whether it is a standalone document or incorporated into the annual report) has not been specified in PATRICK_NOTES. This policy assumes a standalone web-published document; the format must be approved by the Board before the first publication.

- **Single approver.** Patrick Wilson is listed as both owner and sole approver. For segregation-of-duties purposes, it is assumed that Board approval serves as the independent approval for this policy. If a second management-level approver is required, the approver list should be updated before the next review cycle.

- **Secondary capital exclusion.** Secondary capital available to low-income designated credit unions (LICU) under NCUA rules is explicitly out of scope. If Pynthia obtains LICU designation in the future, this policy must be revised to address secondary capital treatment.

- **`icaap.due_at` provisional code.** The field `icaap.due_at` is listed in the DESIGN_NOTES provisional codes section. This policy uses `capital.icaap_due_at` (a registered field on the `capital` object) as the timer for ICAAP completion, consistent with the registered vocabulary. The provisional `icaap.due_at` is noted but not used, as the registered `capital.icaap_due_at` covers the same obligation.
