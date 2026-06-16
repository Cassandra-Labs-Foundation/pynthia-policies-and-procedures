---
title: Basel II Standardized Approach Framework Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Capital Adequacy, Liquidity, Basel II, RWA, Buffers, ICAAP, Pillar 3]
---

## General Policy Statement

Pynthia Credit Union maintains loss-absorbing capital and stable funding sufficient to withstand normal and stressed conditions, adapting the three-pillar principles of the Basel II Standardized Approach as a forward-looking risk-management framework layered on top of binding NCUA requirements. As a US credit union regulated by the NCUA, Pynthia is not directly subject to Basel II; this policy sets internal targets that meet or exceed NCUA minima and prepares the institution for potential harmonization with banking standards. It applies to all assets, liabilities, and off-balance-sheet exposures. Where this framework and NCUA rules differ, NCUA rules (12 CFR Parts 702, 725, and 741) control. Several adjacent operating activities are out of scope and governed elsewhere: capital actions and PCA category management (Capitalization Policy), contingency funding operations (Liquidity Policy), enterprise risk taxonomy (ERM Policy), and security-level investment risk weighting (Investment Policy).

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratios computed | Quarter closes (`ledger.quarter_closed`) | Quarterly (internal: 20 BD) | Total RBC, Tier 1, CET1, Leverage ratios vs. targets | [CAP-01](#cap-01-minimum-capital-requirements) |
| Capital components classified | Quarter closes (`ledger.quarter_closed`) | Quarterly | Tier 1 / Tier 2 composition and deductions | [CAP-02](#cap-02-capital-components-classification) |
| RWA recomputed | RWA mapping run starts (`rwa.mapping_run_started`) | Quarterly | Credit + operational + market RWA | [CAP-03](#cap-03-risk-weighted-assets-computation) |
| Risk-weight schedule change proposed | Schedule change proposed (`rwa.schedule_change_proposed`) | On change (internal: board cycle) | Standardized risk-weight schedule | [CAP-04](#cap-04-risk-weight-schedule) |
| Weekly liquidity position | Liquidity EOD posts (`liquidity.eod_posted`) | Weekly | LCR, NSFR, loan-to-share, concentration | [CAP-05](#cap-05-liquidity-requirements) |
| Liquidity falls below 20% of shares | CFP trigger breached (`liquidity.cfp_trigger_breached`) | Immediate (internal: same day) | Contingency Funding Plan activation | [CAP-05](#cap-05-liquidity-requirements) |
| Buffer assessed / breached | Quarter closes (`ledger.quarter_closed`) | Quarterly | CCB 2.5%, CCyB 0–2.5%, payout restrictions | [CAP-06](#cap-06-buffer-ratios) |
| Annual ICAAP & stress testing | ICAAP cycle opens (`capital.icaap_cycle_opened`) | Annual | ICAAP report; defined stress scenarios | [CAP-07](#cap-07-icaap-and-stress-testing) |
| Ratio falls below target | Internal trigger breached (`capital.internal_trigger_breached`) | Notify Board ≤ 10 days | Board notification + recovery plan (PCA §702.204) | [CAP-08](#cap-08-monitoring-reporting-and-pillar-3-disclosures) |
| Pillar 3 annual disclosure | ICAAP cycle opens (`capital.icaap_cycle_opened`) | Annual | Capital ratios, RWA breakdown, exposures | [CAP-08](#cap-08-monitoring-reporting-and-pillar-3-disclosures) |

## CAP-01 — Minimum Capital Requirements  {#cap-01-minimum-capital-requirements}

**WHY (Reg cite):** NCUA risk-based capital and net-worth requirements set the binding floor ([12 CFR §702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104), [§702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)); Basel II Pillar 1 (BIS 2006, paras. 40–49) informs the internal 8% total-capital target and ratio framework adopted here for future-proofing.

**SYSTEM BEHAVIOR:** At each quarter close the system computes the Total Risk-Based Capital Ratio (≥ 8% of RWA), Tier 1 Capital Ratio (≥ 6%), CET1 Ratio (≥ 4.5%), and Leverage Ratio (≥ 4% of total assets) using the NCUA RBC methodology, then verifies each against its internal target. Targets exceed NCUA minima and are board-approved before they take effect. When any computed ratio falls below its internal target, the system flags an internal trigger that routes to CAP-08 for Board notification and recovery planning; the contingency-action selection (dividend restrictions, asset sales) is governed by the Capitalization Policy and out of scope here. Target-setting and approval of the ratio thresholds are write-restricted to the Board acting on CCO recommendation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and ratios are due (`ledger.quarter_closed`) | Total assets (`gl.total_assets`), RWA total (`capital.rwa_total`), Tier 1 total (`capital.tier1_total`), CET1 ratio (`capital.cet1_ratio`), regulatory minima (`capital.regulatory_minima`) | Computed ratio record + emitted `capital.ratios_verified` | Quarterly (internal: 20 BD; enforced by `capital.ratio_calc_due_at`) |
| Board approves internal ratio targets (`capital.targets_approved`) | Target total RBC (`capital.target_total_rbc`), target Tier 1/RWA (`capital.target_tier1_rwa`), target leverage (`capital.target_tier1_leverage`) | Approved target set + emitted `capital.targets_approved` | On change (internal: board cycle; enforced by `policy.board_approval_due_at`) |
| Computed ratio below internal target (`capital.target_breached`) | Ratio below target flag (`capital.ratio_below_target`), breached trigger (`capital.breached_trigger`) | Internal trigger record routed to CAP-08 + emitted `capital.internal_trigger_breached` | Same quarter (internal: 2 BD; enforced by `capital.contingency_due_at`) |

**ALERTS/METRICS:** Alert when any ratio is within 50 bps of its internal target (early-warning) and on any target breach; target zero quarters with a missed `capital.ratio_calc_due_at`; track the distribution of headroom (computed ratio minus target) over trailing eight quarters.

## CAP-02 — Capital Components Classification  {#cap-02-capital-components-classification}

**WHY (Reg cite):** NCUA defines eligible capital components and deductions for the RBC numerator ([12 CFR §702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)); Basel II Pillar 1 (BIS 2006, paras. 49(i)–(xviii)) informs the Tier 1 / Tier 2 split and the goodwill/DTA deductions adopted here.

**SYSTEM BEHAVIOR:** Each quarter the system classifies capital into Tier 1 (retained/undivided earnings, qualifying perpetual preferred) and Tier 2 (subordinated debt, general loan-loss reserves limited to 1.25% of RWA, revaluation reserves), applies deductions for goodwill and for DTAs exceeding 10% of Tier 1, and computes Total Capital = Tier 1 + Tier 2 with the specified exclusions. General reserves recognized in Tier 2 are capped at 1.25% of RWA; any excess is excluded inline rather than carried forward. The component classification and its approval are write-restricted to Finance under CCO oversight, with the final classification approved before it feeds CAP-01.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and components are due (`ledger.quarter_closed`) | Retained earnings (`capital.retained_earnings`), undivided earnings (`capital.undivided_earnings`), perpetual preferred (`capital.perpetual_preferred`), subordinated debt (`capital.subordinated_debt`), general reserves (`capital.general_reserves`), revaluation reserves (`capital.revaluation_reserves`), goodwill (`capital.goodwill`), DTA balance (`capital.dta_balance`), RWA total (`capital.rwa_total`) | Tier 1 total (`capital.tier1_total`) + Tier 2 total (`capital.tier2_total`) classification record + emitted `capital.components_classified` | Quarterly (internal: 20 BD; enforced by `capital.ratio_computation_due_at`) |
| Classification approved for use (`capital.classification_approved`) | Classified component record, instrument terms (`capital.instrument_terms`) | Approved capital classification + emitted `capital.classification_approved` | Quarterly (internal: 20 BD; enforced by `capital.ratio_computation_due_at`) |
| Capital instrument terms change (`capital.instrument_changed`) | Proposed tier (`capital.proposed_tier`), instrument terms (`capital.instrument_terms`) | Updated instrument classification + emitted `capital.instrument_changed` | On change (internal: same quarter) |

**ALERTS/METRICS:** Alert when Tier 2 general reserves approach the 1.25%-of-RWA cap or when DTA deductions move >10% of Tier 1 quarter-over-quarter; target zero unclassified instruments at quarter close; monitor Tier 1 / Total Capital composition drift.

## CAP-03 — Risk-Weighted Assets Computation  {#cap-03-risk-weighted-assets-computation}

**WHY (Reg cite):** NCUA prescribes RWA computation for the RBC ratio denominator ([12 CFR §702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104)); Basel II Standardized Approach for credit risk, the Basic Indicator Approach for operational risk, and the standardized market-risk method (BIS 2006, paras. 50–53, 644–651, 709–718) inform the three-component RWA build adopted here.

**SYSTEM BEHAVIOR:** Each quarter the system computes RWA as the sum of credit-risk RWA (Σ exposure × standardized risk weight from CAP-04), operational-risk RWA (15% of average annual gross income over the trailing three years, Basic Indicator Approach), and market-risk RWA (standardized method, applied only when trading assets exceed 10% of total assets; capital charge = 8% × Market RWA). Where trading assets are at or below the 10% threshold, market-risk RWA is recorded as zero inline and no standardized market calculation runs. The RWA total feeds CAP-01 and CAP-02. The mapping run and weight application are write-restricted to Finance; advanced (IRB) approaches are out of scope until NCUA approves.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RWA mapping run starts for the quarter (`rwa.mapping_run_started`) | Exposure category (`rwa.exposure_category`), risk-weight map (`rwa.risk_weight_map`), CCF map (`rwa.ccf_map`), collateral type (`rwa.collateral_type`), schedule version (`rwa.schedule_version`) | Credit-RWA computed flag (`rwa.credit_calculated`) record + emitted `rwa.mapping_run_started` | Quarterly (internal: 15 BD; enforced by `capital.ratio_computation_due_at`) |
| Weights applied across exposures (`rwa.weights_applied`) | Exposure category (`rwa.exposure_category`), risk-weight map (`rwa.risk_weight_map`), trading-threshold flag (`rwa.trading_threshold_crossed`) | RWA total (`capital.rwa_total`) with credit/operational/market components (`rwa.operational_calculated`, `rwa.market_calculated`) + emitted `rwa.weights_applied` | Quarterly (internal: 15 BD; enforced by `capital.ratio_computation_due_at`) |

**ALERTS/METRICS:** Alert when trading assets cross the 10%-of-total-assets market-risk threshold (activating the standardized market charge) and when quarter-over-quarter RWA moves materially without a corresponding balance-sheet change; target zero exposures mapped to a missing risk weight; monitor operational-RWA gross-income inputs for staleness.

## CAP-04 — Risk Weight Schedule  {#cap-04-risk-weight-schedule}

**WHY (Reg cite):** NCUA sets the standardized risk weights and conversion factors applied to credit-union exposures, including CUSO and derivative treatments ([12 CFR §702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104)); Basel II Standardized Approach risk-weight tables (BIS 2006, paras. 52–53; CRE Ch. 20) inform the schedule values adopted here.

**SYSTEM BEHAVIOR:** The system maintains a versioned standardized risk-weight schedule: 0% cash/government; 20% claims on banks and short-term off-balance-sheet items (20% CCF); 50% qualifying 1–4 family residential mortgages (LTV ≤ 80%); 100% commercial/member-business loans; 150% loans >90 days past due; 300% high-risk equities/speculative real estate; 1,250% low-rated securitization tranches; with collateral and sovereign adjustments and NCUA-specific weights for CUSOs and derivatives. A residential mortgage with LTV above 80% does not qualify for the 50% weight and falls to the applicable higher weight inline. Schedule changes are proposed, board-approved, then versioned before the next RWA run consumes them. The schedule and its change authority are write-restricted to Finance with Board approval (`rwa.change_authority`).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Schedule change proposed (`rwa.schedule_change_proposed`) | Proposed change (`rwa.proposed_change`), risk-weight map (`rwa.risk_weight_map`), CCF map (`rwa.ccf_map`), change authority (`rwa.change_authority`) | Proposed schedule redline + emitted `rwa.schedule_change_proposed` | On change (internal: board cycle; enforced by `policy.board_approval_due_at`) |
| Schedule approved for use (`rwa.schedule_approved`) | Schedule version (`rwa.schedule_version`), risk-weight map (`rwa.risk_weight_map`), collateral type (`rwa.collateral_type`) | Approved versioned risk-weight schedule + emitted `rwa.schedule_approved` | On approval (internal: board cycle; enforced by `policy.board_approval_due_at`) |

**ALERTS/METRICS:** Alert on any RWA run executed against an unapproved or stale schedule version and on exposures defaulting to the 1,250% tranche weight; target a single approved schedule version live per quarter; track count of LTV-driven reclassifications from 50% to higher weights.

## CAP-05 — Liquidity Requirements  {#cap-05-liquidity-requirements}

**WHY (Reg cite):** NCUA requires a board-approved written liquidity policy and contingency funding ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)) and provides Central Liquidity Facility access ([12 CFR Part 725](https://www.ecfr.gov/current/title-12/part-725)); Basel III liquidity standards (BIS 2010) inform the LCR ≥ 100% and NSFR ≥ 100% targets adopted here for future-proofing.

**SYSTEM BEHAVIOR:** The system maintains a board-approved written liquidity policy covering sources and uses, computes LCR (target ≥ 100%) and NSFR (target ≥ 100%), produces weekly liquidity position reports, observes a loan-to-share ratio ≤ 85% and funding diversification (<50% from a single source), and maintains a Contingency Funding Plan covering moderate and severe stress including CLF access. When liquidity falls below 20% of shares, the system breaches the CFP trigger and activates the Contingency Funding Plan; detailed contingency funding operations are governed by the Liquidity Policy and are out of scope here. Funding-concentration breaches (>50% single source) are logged inline against the diversification plan. Liquidity targets and the written policy are write-restricted to the Board on ALCO/CFO recommendation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Weekly liquidity position closes (`liquidity.eod_posted`) | HQLA balance (`liquidity.hqla_balance`), net 30-day outflows (`liquidity.net_outflows_30d`), ASF total (`liquidity.asf_total`), RSF total (`liquidity.rsf_total`), ratio to shares (`liquidity.ratio_to_shares`), total assets (`liquidity.total_assets`) | Weekly liquidity position report + emitted `liquidity.report_published` | Weekly (internal: 2 BD; enforced by `liquidity.report_due_at`) |
| Single funding source exceeds 50% (`liquidity.concentration_breached`) | System balances (`liquidity.system_balances`), behavioral assumptions (`liquidity.behavioral_assumptions`) | Diversification plan log entry + emitted `liquidity.diversification_plan_logged` | Same week (internal: 2 BD; enforced by `liquidity.report_due_at`) |
| Liquidity falls below 20% of shares (`liquidity.cfp_trigger_breached`) | Ratio to shares (`liquidity.ratio_to_shares`), CLF capacity (`liquidity.clf_capacity`), liquid assets (`liquidity.liquid_assets`) | CFP activation record + emitted `liquidity.cfp_activated` | Immediate (internal: same day; enforced by `liquidity.cfp_activation_due_at`) |

**ALERTS/METRICS:** Alert when LCR or NSFR drops below 105%, when loan-to-share exceeds 80% (approaching the 85% ceiling), or any single source nears 50%; target zero weeks with a missed `liquidity.report_due_at`; monitor ratio-to-shares trend toward the 20% CFP trigger.

## CAP-06 — Buffer Ratios  {#cap-06-buffer-ratios}

**WHY (Reg cite):** NCUA capital adequacy and payout/earnings-retention requirements anchor distribution restrictions tied to buffers ([12 CFR §702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104), [§702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)); Basel III capital buffers (BIS 2010, Capital Conservation Buffer and Countercyclical Buffer) inform the 2.5% CCB and 0–2.5% CCyB adopted here.

**SYSTEM BEHAVIOR:** Each quarter the system assesses a Capital Conservation Buffer of 2.5% of RWA (CET1), bringing combined CET1 to ≥ 7%, plus a Countercyclical Buffer of 0–2.5% activated when credit growth exceeds 10%. When the buffer is breached, the system applies graduated distribution restrictions (e.g., 60% payout restriction when the buffer falls below 1.25%) per the eligible-retained-income schedule. The systemic buffer is not applicable to credit unions and is excluded inline. The CCyB level and buffer-driven payout restrictions are write-restricted to the Board on CCO recommendation; capital actions themselves are governed by the Capitalization Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and buffer is assessed (`ledger.quarter_closed`) | CET1 ratio (`capital.cet1_ratio`), buffer requirement (`capital.buffer_requirement`), RWA total (`capital.rwa_total`), CCyB level (`capital.ccyb_level`) | Buffer status record (`capital.buffer_assessed`) + emitted `capital.buffer_status_recorded` | Quarterly (internal: 20 BD; enforced by `capital.ratio_calc_due_at`) |
| Credit growth exceeds 10% (`capital.ccyb_activated`) | Credit-growth threshold flag (`capital.credit_growth_threshold_crossed`), proposed CCyB level (`capital.proposed_ccyb_level`), loan growth YoY (`gl.loan_growth_yoy`) | CCyB activation record + emitted `capital.ccyb_activated` | Same quarter (internal: board cycle; enforced by `capital.payout_restriction_due_at`) |
| Buffer breached (`capital.buffer_breached`) | Buffer shortfall (`capital.buffer_shortfall`), eligible retained income (`capital.eligible_retained_income`), max payout ratio (`capital.max_payout_ratio`) | Distribution-restriction record + emitted `capital.distribution_restriction_applied` | Same quarter (internal: 5 BD; enforced by `capital.payout_restriction_due_at`) |

**ALERTS/METRICS:** Alert when combined CET1 approaches the 7% floor, when YoY credit growth nears 10% (CCyB activation), and on any buffer breach triggering payout restrictions; target zero distributions executed while a buffer breach is active; monitor buffer headroom over trailing eight quarters.

## CAP-07 — ICAAP and Stress Testing  {#cap-07-icaap-and-stress-testing}

**WHY (Reg cite):** NCUA stress-testing and supervisory-review expectations ([12 CFR §702.304](https://www.ecfr.gov/current/title-12/part-702/section-702.304)) anchor the annual program; Basel II Pillar 2 / ICAAP (BIS 2006, paras. 720–760) informs the assessment of risks beyond Pillar 1 (concentration, interest-rate risk) adopted here.

**SYSTEM BEHAVIOR:** Annually the system opens an ICAAP cycle that documents material risks beyond Pillar 1 — including concentration and interest-rate risk — and projects capital adequacy, then runs stress tests of defined scenarios (e.g., 20% member-share outflow, 10% GDP drop). The ICAAP report is reviewed and signed off by the CCO before presentation to the Board. A stress scenario that breaches a minimum target escalates to CAP-08 for recovery planning inline. ICAAP assumptions, scenario sets, and CCO sign-off are write-restricted to the CCO and Finance under Board oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ICAAP cycle opens (`capital.icaap_cycle_opened`) | Material-risk flag (`icaap.material_risk_identified`), capital projections (`icaap.capital_projections`), IRR measures (`icaap.irr_measures`), new-risk assessment (`icaap.new_risk_assessment`) | ICAAP report (`capital.icaap_report_id`) + emitted `capital.icaap_report_issued` | Annual (internal: 60 BD; enforced by `capital.icaap_due_at`) |
| Stress-test cycle starts (`stress_test.cycle_started`) | Stress assumptions (`capital.stress_assumptions`), failing scenario (`capital.failing_scenario`), behavioral assumptions (`stress.behavioral_assumptions`) | Stress report (`capital.stress_report_id`) + emitted `capital.stress_report_issued` | Annual (internal: 60 BD; enforced by `capital.stress_report_due_at`) |
| Stress scenario breaches a minimum (`stress_test.minimum_breached`) | Projected shortfall (`capital.projected_shortfall`), projection below well-capitalized flag (`capital.projection_below_well_capitalized`) | Escalation record routed to CAP-08 + emitted `stress_test.remediation_escalated` | Same cycle (internal: 10 BD; enforced by `capital.remediation_plan_due_at`) |

**ALERTS/METRICS:** Alert on any stress scenario projecting capital below well-capitalized and on a missed `capital.icaap_due_at` or `capital.stress_report_due_at`; target one completed ICAAP and stress cycle per year; monitor the most binding scenario's projected shortfall trend across cycles.

## CAP-08 — Monitoring, Reporting, and Pillar 3 Disclosures  {#cap-08-monitoring-reporting-and-pillar-3-disclosures}

**WHY (Reg cite):** NCUA Prompt Corrective Action and Board/regulator reporting ([12 CFR §702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204)) anchor the notification and recovery-plan obligations; Basel II Pillar 3 market-discipline disclosures (BIS 2006, paras. 808–826) inform the annual capital-ratio, RWA-breakdown, and exposure disclosures adopted here.

**SYSTEM BEHAVIOR:** ALCO reviews ratios quarterly and the system publishes annual Pillar 3 disclosures covering capital ratios, RWA breakdown, and risk exposures. Capital metrics are reported to NCUA via the 5300 Call Report and internally to the Board. When any ratio falls below target, the system notifies the Board within 10 days and implements a recovery plan per the NCUA PCA matrix (§702.204); PCA category management itself is governed by the Capitalization Policy. Annual staff training on this framework is assigned and tracked. Pillar 3 disclosure content and Board notifications are write-restricted to the CCO; recovery-plan drafting is restricted to Finance under CCO oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ALCO reviews ratios for the quarter (`alco.ratio_review_logged`) | Verified ratios (`capital.ratios_verified`), prior ratios (`capital.prior_ratios`), regulatory minima (`capital.regulatory_minima`) | Quarterly capital report (`capital.quarterly_report_id`) + emitted `capital.quarterly_report_issued` | Quarterly (internal: 20 BD; enforced by `capital.quarterly_report_due_at`) |
| Ratio falls below target (`capital.target_breached`) | Ratio below target flag (`capital.ratio_below_target`), PCA category (`capital.pca_category`), metrics snapshot (`ncua.metrics_snapshot`) | Board notification + recovery-plan draft (`capital.recovery_plan_draft`) + emitted `capital.target_breach_notified` | ≤ 10 days (internal: 5 BD; enforced by `board.notification_due_at`) |
| Pillar 3 disclosure cycle opens (`capital.icaap_cycle_opened`) | RWA breakdown (`capital.rwa_total`), capital ratios (`capital.ratios_verified`), exposure summary (`exposure.by_sector`) | Published Pillar 3 disclosure + emitted `disclosure.pillar3_published` | Annual (internal: 30 BD; enforced by `disclosure.pillar3_due_at`) |
| Annual staff training cycle opens (`training.capital_cycle_started`) | Assignee (`training.assignee_id`), curriculum (`training.curriculum_id`), content version (`training.content_version`) | Completed training record + emitted `training.capital_completed` | Annual (internal: 30 BD; enforced by `training.annual_due_at`) |

**ALERTS/METRICS:** Alert on any Board notification not sent within 10 days of a target breach, any missed Pillar 3 publication, and any staff below the annual training completion target; target 100% annual training completion and zero late Board notifications; monitor recovery-plan implementation status against PCA mandatory actions.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this framework, its controls, and its annual review.
- **Required participants:** Asset-Liability Committee (ALCO) — quarterly ratio and liquidity review; Chief Financial Officer — capital component classification, RWA computation, recovery-plan drafting; Board of Directors — approval of internal targets, risk-weight schedule, CCyB level, payout restrictions, and receipt of breach notifications.
- **Approvals:** Approved by the Chief Compliance Officer; internal capital targets, the risk-weight schedule, and buffer parameters require Board approval before taking effect (`policy.board_approval_due_at`).
- **Review cadence:** Annual review (`next_review` above) or upon material change to NCUA capital/liquidity rules, charter type, or harmonization with banking standards; reviews recorded via `policy.review_completed`.
- **Cross-references:** Capitalization Policy (capital actions, PCA category management), Liquidity Policy (contingency funding operations), Enterprise Risk Management Policy (risk taxonomy and aggregation), Investment Policy (security-level risk weighting). These are referenced, not duplicated; binding requirements live in [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702), [Part 725](https://www.ecfr.gov/current/title-12/part-725), and [§741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional for any code not registered in the parsed spec.** The capital, RWA, liquidity, ICAAP, stress, disclosure, and training codes cited throughout the control overlays are largely registered in `core-vocabulary.json` (Cassandra Banking Core v2.2.0). Codes used in the *Within* column reference registered timers under the generic `Task` pattern (e.g., `capital.ratio_calc_due_at`, `liquidity.report_due_at`, `disclosure.pillar3_due_at`). A small number of supporting field references (e.g., `exposure.by_sector`, `gl.loan_growth_yoy`) are taken verbatim from the registered field tables; any that prove unregistered at implementation will be confirmed by engineering before the next review. No new subjects, verbs, or task types were minted.
- **Basel II is adopted as guidance, not binding law.** This framework treats Basel II/III (BIS 2006/2010) as a future-proofing overlay. Where any internal target conflicts with NCUA rules, NCUA controls. Confirmation needed: that the Board accepts the internal targets exceeding NCUA minima as stated (8% Total RBC, 6% Tier 1, 4.5% CET1, 4% Leverage, 7% combined CET1 with CCB).
- **Charter and applicability.** Pynthia is assumed to be a federally regulated credit union subject to 12 CFR Part 702 RBC requirements (assets above the $500M RBC-applicability threshold). If Pynthia is below the RBC threshold or a complex/non-complex designation applies differently, the binding minima and the RBC-ratio calculation basis must be confirmed.
- **Market-risk applicability.** Market-risk RWA via the standardized method is assumed to engage only when trading assets exceed 10% of total assets. If Pynthia holds no trading book, CAP-03's market-risk component is effectively inert; confirm whether any positions are classified as trading.
- **Operational-risk gross-income inputs.** The Basic Indicator Approach (15% of trailing-three-year average annual gross income) assumes a registered gross-income series is available; the data source and three-year averaging window must be confirmed by Finance.
- **PCA notification window.** The 10-day Board notification on a target breach is taken from PATRICK_NOTES and aligned to the §702.204 PCA matrix; confirm whether the 10 days are calendar or business days for the `board.notification_due_at` timer.
- **Pillar 3 disclosure timing.** Annual Pillar 3 disclosures are assumed to align with the ICAAP cycle open (`capital.icaap_cycle_opened`). Confirm the intended publication anchor and audience (public vs. regulator-only) for `disclosure.pillar3_published`.
- **Secondary capital and advanced approaches are out of scope** per PATRICK_NOTES (low-income-designated secondary capital; IRB credit-risk approaches) and are not anchored to any control here by design.
