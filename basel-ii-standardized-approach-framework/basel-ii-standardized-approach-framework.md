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

## General Policy Statement

Pynthia Credit Union maintains loss-absorbing capital and stable funding sufficient to remain well-capitalized and liquid under both normal and stressed conditions. As an NCUA-regulated credit union, Pynthia is **not** directly subject to Basel II; this policy adapts Basel II's three-pillar principles — minimum capital, supervisory review (ICAAP), and market discipline (disclosure) — and Basel III liquidity/buffer supplements as an internal risk-management and future-proofing framework, while **actual regulatory compliance follows NCUA rules** (12 CFR Part 702, § 741.12, Part 725). The policy applies to all assets, liabilities, and off-balance-sheet exposures and targets ratios that exceed NCUA minima. Governance is centralized with the Chief Compliance Officer, with ALCO, the CFO, and the Board of Directors as required participants.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Quarterly capital ratio calculation | Quarter close (`capital.icaap_cycle_opened` / quarter open) → ratios computed (`capital.ratios_verified`) | Quarterly (internal: 15 BD after quarter close) | Total RBC ≥8%, Tier 1 ≥6%, CET1 ≥4.5%, Leverage ≥4% | [BA-01](#ba-01-minimum-capital-requirements) |
| Ratio falls below internal target | Internal trigger breached (`capital.internal_trigger_breached`) → contingency activated (`capital.contingency_activated`) | Promptly on detection (internal: 5 BD to activate) | Contingency actions (dividend restriction, asset sales) | [BA-01](#ba-01-minimum-capital-requirements) |
| Capital components classification | Quarterly close → components classified (`capital.components_classified`) | Quarterly (internal: with ratio calc) | Tier 1 / Tier 2 definitions and deductions | [BA-02](#ba-02-components-of-capital) |
| RWA computation | Mapping run started (`rwa.mapping_run_started`) → weights applied (`rwa.weights_applied`) | Quarterly (internal: with ratio calc) | Credit/operational/market RWA | [BA-03](#ba-03-risk-weighted-assets) |
| Risk-weight schedule change | Schedule change proposed (`rwa.schedule_change_proposed`) → approved (`rwa.schedule_approved`) | On change (internal: 10 BD) | Standardized risk-weight table | [BA-04](#ba-04-risk-weight-schedule) |
| Weekly liquidity position | EOD/weekly close (`liquidity.eod_posted`) → report published (`liquidity.report_published`) | Weekly | LCR ≥100%, NSFR ≥100%, LTS ≤85% | [BA-05](#ba-05-liquidity-requirements) |
| Liquidity below 20% of shares | CFP trigger breached (`liquidity.cfp_trigger_breached`) → CFP activated (`liquidity.cfp_activated`) | Promptly on breach (internal: same day) | Contingency Funding Plan / CLF access | [BA-05](#ba-05-liquidity-requirements) |
| Buffer breach | Buffer breached (`capital.buffer_breached`) → distribution restriction applied (`capital.distribution_restriction_applied`) | Promptly on breach (internal: before next payout) | Conservation 2.5% + countercyclical 0–2.5% | [BA-06](#ba-06-buffer-ratios) |
| Annual ICAAP and stress testing | ICAAP cycle opened (`capital.icaap_cycle_opened`) → report issued (`capital.icaap_report_issued`) | Annually | ICAAP + defined stress scenarios | [BA-07](#ba-07-icaap-and-stress-testing) |
| Ratio below target → Board notice | Target breached (`capital.target_breached`) → Board notified (`capital.target_breach_notified`) | 10 days | PCA recovery plan per § 702.204 | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |
| Annual Pillar 3 disclosure | ICAAP/year close → published (`disclosure.pillar3_published`) | Annually | Capital ratios, RWA breakdown, exposures | [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures) |

## BA-01 — Minimum Capital Requirements  {#ba-01-minimum-capital-requirements}

**WHY (Reg cite):** NCUA risk-based capital and net-worth requirements at [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104) and the well-capitalized RBC threshold context in [12 CFR § 702.102](https://www.ecfr.gov/current/title-12/part-702/section-702.102), informed by Basel II Pillar 1 minimum capital ([BIS, June 2006, paras. 40–53](https://www.bis.org/publ/bcbs128.htm)). The 8% total-capital target is a Basel-derived internal floor layered above NCUA minima.

**SYSTEM BEHAVIOR:** Each quarter the system computes the Total Risk-Based Capital Ratio (≥8% of RWA), Tier 1 Ratio (≥6%), CET1 Ratio (≥4.5%), and Leverage Ratio (≥4% of total assets) using the NCUA RBC calculator inputs and the RWA total from [BA-03](#ba-03-risk-weighted-assets). Verified ratios are recorded against internal targets; any ratio below its target raises an internal trigger that activates contingency planning (dividend restrictions, asset sales). Internal-trigger thresholds may be set above regulatory minima to create early-warning headroom; a breach of regulatory minima additionally routes to the PCA/Board path in [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures). Capital-ratio records and trigger schedules are write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter close opens capital cycle (`capital.icaap_cycle_opened`) | RWA total (`capital.rwa_total`), Tier 1 total (`capital.tier1_total`), Tier 2 total (`capital.tier2_total`), total assets (`gl.total_assets`), regulatory minima (`capital.regulatory_minima`) | Computed ratio record with all four ratios (`capital.ratios_computed`) | Quarterly (internal: 15 BD; enforced by `capital.ratio_computation_due_at`) |
| Ratios computed and checked against targets (`capital.ratios_verified`) | Total RBC (`capital.ratio_total_rbc`), Tier 1/RWA (`capital.ratio_tier1_rwa`), Tier 1 leverage (`capital.ratio_tier1_leverage`), targets (`capital.target_total_rbc`, `capital.target_tier1_rwa`, `capital.target_tier1_leverage`) | Verified ratio record + target-comparison (`capital.ratios_verified`) | Quarterly (internal: with calc; enforced by `capital.ratio_calc_due_at`) |
| Internal trigger breached (`capital.internal_trigger_breached`) | Breached trigger (`capital.breached_trigger`), ratio below target flag (`capital.ratio_below_target`), trigger schedule (`capital.trigger_schedule`) | Contingency activation + escalation (`capital.contingency_activated`, `capital.trigger_escalation_issued`) | Promptly (internal: 5 BD; enforced by `capital.contingency_due_at`) |
| Contingency action executed (`capital.contingency_action_executed`) | Contingency action id (`capital.contingency_action_id`), action type (`capital.action_type`), expected impact (`capital.expected_capital_impact`) | Contingency memo + executed action record (`capital.contingency_memo_issued`) | Internal: 10 BD (enforced by `capital.contingency_memo_due_at`) |

**ALERTS/METRICS:** Alert when any ratio falls within a configurable buffer above its internal trigger (headroom-low); target zero quarters of an unactioned regulatory-minimum breach; track quarter-over-quarter ratio trend and contingency-activation latency against the 5-BD SLA.

## BA-02 — Components of Capital  {#ba-02-components-of-capital}

**WHY (Reg cite):** NCUA capital-component definitions and net-worth composition at [12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2), informed by Basel II Tier 1 / Tier 2 eligibility and deductions ([BIS, June 2006, paras. 49–52](https://www.bis.org/publ/bcbs128.htm)).

**SYSTEM BEHAVIOR:** Quarterly the system classifies capital into Tier 1 (retained/undivided earnings, qualifying perpetual preferred; less goodwill and DTAs exceeding 10% of Tier 1) and Tier 2 (subordinated debt, general loan-loss reserves capped at 1.25% of RWA, revaluation reserves), and computes Total Capital = Tier 1 + Tier 2 with specified exclusions. General loan-loss reserves counted toward Tier 2 are capped at 1.25% of RWA; any excess is excluded. Component classifications feed the ratios in [BA-01](#ba-01-minimum-capital-requirements). Classification approval is write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Capital cycle opens for classification (`capital.icaap_cycle_opened`) | Retained/undivided earnings (`capital.retained_earnings`, `capital.undivided_earnings`), perpetual preferred (`capital.perpetual_preferred`), goodwill (`capital.goodwill`), DTA balance (`capital.dta_balance`), subordinated debt (`capital.subordinated_debt`), general reserves (`capital.general_reserves`), revaluation reserves (`capital.revaluation_reserves`) | Tier 1/Tier 2 classification record (`capital.components_classified`) | Quarterly (internal: with ratio calc; enforced by `capital.ratio_computation_due_at`) |
| Classification reviewed and approved (`capital.classification_approved`) | Tier 1 total (`capital.tier1_total`), Tier 2 total (`capital.tier2_total`), allowance balance (`capital.allowance_balance`) | Approved component classification (`capital.classification_approved`) | Quarterly (internal: 2 BD after classification) |
| Capital instrument terms change (`capital.instrument_changed`) | Instrument terms (`capital.instrument_terms`), proposed tier (`capital.proposed_tier`) | Updated component eligibility record (`capital.instrument_changed`) | On change (internal: 5 BD) |

**ALERTS/METRICS:** Alert when general loan-loss reserves approach the 1.25%-of-RWA cap or when DTAs approach the 10%-of-Tier-1 deduction threshold; target zero quarters where excluded items are mistakenly counted; track Tier 1 share of Total Capital over time.

## BA-03 — Risk-Weighted Assets (RWA)  {#ba-03-risk-weighted-assets}

**WHY (Reg cite):** NCUA risk-weighting framework at [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104), informed by the Basel II standardized approach for credit risk and the Basic Indicator Approach for operational risk ([BIS, June 2006, paras. 50–53, 644–649](https://www.bis.org/publ/bcbs128.htm)).

**SYSTEM BEHAVIOR:** Quarterly the system computes total RWA as the sum of credit-risk RWA (Σ exposure × risk weight, standardized approach), operational-risk RWA (Basic Indicator Approach: 15% of average annual gross income over the trailing three years), and market-risk RWA (standardized method, triggered only when trading assets exceed 10% of total assets; capital charge = 8% × Market RWA). The risk-weight map applied is the schedule governed by [BA-04](#ba-04-risk-weight-schedule). If the trading-asset threshold is not crossed, market-risk RWA is recorded as zero with a documented basis. The RWA total feeds [BA-01](#ba-01-minimum-capital-requirements) and [BA-02](#ba-02-components-of-capital). RWA mapping configuration is write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RWA mapping run started (`rwa.mapping_run_started`) | Exposure category (`rwa.exposure_category`), risk-weight map (`rwa.risk_weight_map`), CCF map (`rwa.ccf_map`), collateral type (`rwa.collateral_type`), schedule version (`rwa.schedule_version`) | Credit RWA computed (`rwa.credit_calculated`) | Quarterly (internal: with ratio calc; enforced by `capital.ratio_computation_due_at`) |
| Operational/market RWA computed (`rwa.weights_applied`) | Trading threshold crossed flag (`rwa.trading_threshold_crossed`), total assets (`gl.total_assets`), gross-income basis (3-yr average) | Operational + market RWA components (`rwa.operational_calculated`, `rwa.market_calculated`) | Quarterly (internal: with ratio calc) |
| All components summed (`rwa.weights_applied`) | Credit/operational/market RWA components | Total RWA record (`capital.rwa_total` populated; `rwa.weights_applied`) | Quarterly (internal: with ratio calc; enforced by `capital.ratio_computation_due_at`) |

**ALERTS/METRICS:** Alert when trading assets cross the 10%-of-total-assets market-risk threshold; target zero RWA runs with stale schedule versions; track RWA composition shift (credit vs operational vs market) quarter over quarter.

## BA-04 — Risk Weight Schedule  {#ba-04-risk-weight-schedule}

**WHY (Reg cite):** NCUA risk-weight assignments at [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104), informed by the Basel II standardized risk-weight table and credit-conversion factors ([BIS, June 2006, Table at paras. 52–53, 82–89](https://www.bis.org/publ/bcbs128.htm)).

**SYSTEM BEHAVIOR:** The system maintains a board-approved standardized risk-weight schedule: 0% cash/government; 20% claims on banks and short-term off-balance-sheet (20% CCF); 50% qualifying 1–4 family residential mortgages (LTV ≤80%); 100% commercial/member-business loans; 150% loans >90 days past due; 300% high-risk equities/speculative real estate; 1,250% low-rated securitization tranches; with collateral and sovereign adjustments and NCUA-specific weights for CUSOs and derivatives. Schedule changes are proposed, reviewed, and approved before the next RWA run consumes them; security-level investment weighting is out of scope and governed by the Investment Policy. The schedule and its change authority are write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk-weight schedule change proposed (`rwa.schedule_change_proposed`) | Proposed change (`rwa.proposed_change`), change authority (`rwa.change_authority`), current schedule version (`rwa.schedule_version`) | Proposed schedule change record (`rwa.schedule_change_proposed`) | On change (internal: 10 BD to approve) |
| Schedule change approved (`rwa.schedule_approved`) | Risk-weight map (`rwa.risk_weight_map`), CCF map (`rwa.ccf_map`), collateral type (`rwa.collateral_type`) | Approved schedule version (`rwa.schedule_approved`) | Internal: 10 BD after proposal |

**ALERTS/METRICS:** Alert on any RWA run referencing a schedule version that differs from the latest approved version; target zero unapproved weight changes in production; track count of schedule changes per year and time-to-approval.

## BA-05 — Liquidity Requirements  {#ba-05-liquidity-requirements}

**WHY (Reg cite):** NCUA board-approved written liquidity policy requirement at [12 CFR § 741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) and Central Liquidity Facility access at [12 CFR Part 725](https://www.ecfr.gov/current/title-12/part-725), with NCUA contingency-funding guidance (Letter to Credit Unions [13-CU-10](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/contingency-funding-plans)); LCR/NSFR targets adopted from Basel III liquidity standards ([BIS, 2010](https://www.bis.org/publ/bcbs188.htm)).

**SYSTEM BEHAVIOR:** The system maintains a board-approved written liquidity policy covering sources and uses, targets LCR ≥100% and NSFR ≥100%, produces weekly liquidity position reports, and maintains a Contingency Funding Plan covering moderate and severe stress including CLF access. It observes a loan-to-share ratio ≤85% and funding diversification (<50% from a single source). If liquidity falls below 20% of shares, the CFP is activated. Activation of the CFP follows the registered liquidity-CFP path; severe-stress scenarios incorporate CLF capacity up to 25% of shares. Liquidity policy parameters and CFP triggers are write-restricted to the CFO/Treasury and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Weekly liquidity position posted (`liquidity.eod_posted`) | HQLA balance (`liquidity.hqla_balance`), 30-day net outflows (`liquidity.net_outflows_30d`), ASF/RSF totals (`liquidity.asf_total`, `liquidity.rsf_total`), ratio to shares (`liquidity.ratio_to_shares`), CLF capacity (`liquidity.clf_capacity`) | Weekly liquidity report with LCR/NSFR/LTS (`liquidity.report_published`) | Weekly (enforced by `liquidity.report_due_at`) |
| Single-source funding concentration ≥50% detected (`liquidity.concentration_breached`) | System balances (`liquidity.system_balances`), liquid assets (`liquidity.liquid_assets`) | Diversification plan record (`liquidity.diversification_plan_logged`) | Promptly (internal: 5 BD) |
| Liquidity falls below 20% of shares (`liquidity.cfp_trigger_breached`) | Ratio to shares (`liquidity.ratio_to_shares`), CFP execution plan (`cfp.execution_plan_documented`), liquidation hierarchy (`cfp.liquidation_hierarchy`) | CFP activation record (`liquidity.cfp_activated`) | Same day (enforced by `liquidity.cfp_activation_due_at`) |

**ALERTS/METRICS:** Alert when LCR or NSFR drops below 105% (pre-breach), when LTS approaches 85%, or when any single funding source approaches 50%; target zero weekly cycles with a missed liquidity report; track minimum daily liquidity-to-shares headroom above the 20% CFP trigger.

## BA-06 — Buffer Ratios  {#ba-06-buffer-ratios}

**WHY (Reg cite):** NCUA capital-adequacy framework at [12 CFR § 702.104](https://www.ecfr.gov/current/title-12/part-702/section-702.104), with the Capital Conservation Buffer and Countercyclical Buffer adopted from Basel III buffer standards ([BIS, 2010/2011](https://www.bis.org/publ/bcbs189.htm)). The systemic buffer is not applicable to credit unions.

**SYSTEM BEHAVIOR:** The system applies a Capital Conservation Buffer of 2.5% of RWA on top of the 4.5% CET1 minimum (combined CET1 ≥7%), plus a Countercyclical Buffer of 0–2.5% activated when year-over-year credit growth exceeds 10%. Buffer breaches restrict dividends and payouts on a graduated schedule (e.g., 60% restriction when the buffer falls below 1.25%). When the countercyclical trigger (credit growth >10%) is crossed, the buffer is activated and the combined requirement recomputed. The systemic buffer is recorded as not applicable for credit-union charter. Buffer requirements and payout-restriction schedules are write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Buffer assessed at quarter close (`capital.buffer_status_recorded`) | CET1 ratio (`capital.cet1_ratio`), buffer requirement (`capital.buffer_requirement`), credit-growth threshold flag (`capital.credit_growth_threshold_crossed`), YoY loan growth (`gl.loan_growth_yoy`) | Buffer status record (`capital.buffer_status_recorded`) | Quarterly (internal: with ratio calc; enforced by `capital.ratio_computation_due_at`) |
| Countercyclical trigger crossed (`capital.ccyb_activated`) | Proposed CCyB level (`capital.proposed_ccyb_level`), CCyB level (`capital.ccyb_level`) | Countercyclical buffer activation (`capital.ccyb_activated`) | Promptly (internal: 5 BD) |
| Buffer breached (`capital.buffer_breached`) | Buffer shortfall (`capital.buffer_shortfall`), eligible retained income (`capital.eligible_retained_income`), max payout ratio (`capital.max_payout_ratio`) | Distribution-restriction record (`capital.distribution_restriction_applied`) | Before next payout (enforced by `capital.payout_restriction_due_at`) |

**ALERTS/METRICS:** Alert when the combined buffer falls below 1.25% (triggering the 60% payout restriction) or when YoY credit growth approaches 10%; target zero distributions executed while a buffer-breach restriction is in force; track buffer headroom above the 7% combined-CET1 floor.

## BA-07 — ICAAP and Stress Testing  {#ba-07-icaap-and-stress-testing}

**WHY (Reg cite):** NCUA capital-planning and stress-testing expectations at [12 CFR § 702.504](https://www.ecfr.gov/current/title-12/part-702/section-702.504) (and § 702.104 capital adequacy), informed by Basel II Pillar 2 supervisory review / ICAAP ([BIS, June 2006, paras. 720–760](https://www.bis.org/publ/bcbs128.htm)).

**SYSTEM BEHAVIOR:** Annually the system runs an Internal Capital Adequacy Assessment Process documenting risks beyond Pillar 1 (concentration risk, interest-rate risk) and conducts stress tests of defined scenarios (e.g., 20% member share outflow, 10% GDP drop). ICAAP findings inform capital targets and feed the recovery path in [BA-08](#ba-08-monitoring-reporting-and-pillar-3-disclosures). When a stress scenario projects capital below the well-capitalized level, a remediation/recovery action is escalated. ICAAP reports and stress assumptions are write-restricted to the CFO and Compliance; CCO sign-off is required before issuance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ICAAP cycle opened (`capital.icaap_cycle_opened`) | Material risk identified flag (`icaap.material_risk_identified`), IRR measures (`icaap.irr_measures`), capital projections (`icaap.capital_projections`), CCO sign-off (`capital.icaap_cco_signoff`) | ICAAP report issued (`capital.icaap_report_issued`) | Annually (enforced by `capital.icaap_due_at`) |
| Stress test run (`stress_test.cycle_started`) | Stress assumptions (`capital.stress_assumptions`), failing scenario (`capital.failing_scenario`), proforma ratios (`capital.proforma_ratios`) | Stress report issued (`capital.stress_report_issued`) | Annually (enforced by `capital.stress_report_due_at`) |
| Stress projects below well-capitalized (`stress_test.minimum_breached`) | Projection-below-well-capitalized flag (`capital.projection_below_well_capitalized`), projected shortfall (`capital.projected_shortfall`) | Remediation escalation + recovery plan draft (`stress_test.remediation_escalated`, `capital.recovery_plan_draft`) | Internal: 10 BD (enforced by `capital.remediation_plan_due_at`) |

**ALERTS/METRICS:** Alert when an ICAAP or stress cycle is within 30 days of its annual due date and not yet started; target zero scenarios that breach the well-capitalized level without an open remediation item; track number of material Pillar 2 risks identified and closed each cycle.

## BA-08 — Monitoring, Reporting, and Pillar 3 Disclosures  {#ba-08-monitoring-reporting-and-pillar-3-disclosures}

**WHY (Reg cite):** NCUA Prompt Corrective Action notice and recovery requirements at [12 CFR § 702.204](https://www.ecfr.gov/current/title-12/part-702/section-702.204), Call Report (5300) obligations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741), and Basel II Pillar 3 market-discipline/disclosure principles ([BIS, June 2006, paras. 808–826](https://www.bis.org/publ/bcbs128.htm)).

**SYSTEM BEHAVIOR:** ALCO reviews ratios quarterly; the system publishes annual Pillar 3 disclosures (capital ratios, RWA breakdown, risk exposures) and reports to NCUA via the 5300 Call Report and internally to the Board. If any ratio falls below target, the Board is notified within 10 days and a recovery plan is implemented per the NCUA PCA matrix (§ 702.204). Annual staff training on this framework is delivered. The Board notification is the controlling regulatory deadline; the quarterly ALCO review and Pillar 3 publication are recurring obligations. Quarterly reports, Pillar 3 disclosures, and PCA records are write-restricted to the CFO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ALCO quarterly ratio review (`alco.ratio_review_logged`) | Quarterly report id (`capital.quarterly_report_id`), prior ratios (`capital.prior_ratios`), PCA category (`capital.pca_category`) | Quarterly capital report issued + reviewed (`capital.quarterly_report_issued`, `capital.quarterly_report_reviewed`) | Quarterly (enforced by `capital.quarterly_report_due_at`) |
| Ratio below target (`capital.target_breached`) | Ratio below target flag (`capital.ratio_below_target`), PCA category (`capital.pca_category`), PCA mandatory actions (`capital.pca_mandatory_actions`) | Board escalation/notice + NCUA notification (`capital.target_breach_notified`, `capital.board_escalation_issued`, `ncua.notification_sent`) | 10 days (enforced by `board.notification_due_at`, `ncua.notification_due_at`) |
| Recovery plan implemented (`capital.pca_response_recorded`) | Recovery plan draft (`capital.recovery_plan_draft`), regulatory minima (`capital.regulatory_minima`) | PCA response record (`capital.pca_response_recorded`) | Internal: 10 BD after Board notice (enforced by `capital.remediation_plan_due_at`) |
| Annual Pillar 3 disclosure cycle (`capital.icaap_cycle_opened`) | Capital ratios, RWA breakdown (`capital.rwa_total`), risk exposures, disclosure template (`disclosure.template_id`) | Pillar 3 disclosure published (`disclosure.pillar3_published`) | Annually (enforced by `disclosure.pillar3_due_at`) |
| Annual framework training cycle opened (`training.capital_cycle_started`) | Curriculum id (`training.curriculum_id`), assignee id (`training.assignee_id`), completion status (`training.completion_status`) | Training completion record (`training.capital_completed`) | Annually (enforced by `training.annual_due_at`) |

**ALERTS/METRICS:** Alert when a below-target ratio approaches the 10-day Board-notice SLA (ncua-notification-aging), when a quarterly ALCO review or annual Pillar 3 publication is overdue, or when annual training completion lags target; target zero late Board notifications; track 5300 submission timeliness and training coverage percentage.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintenance, interpretation, and exception handling of this policy.
- **Required participants:** Asset-Liability Committee (ALCO) for quarterly ratio and liquidity review; Chief Financial Officer for capital, RWA, and liquidity computation and component classification; Board of Directors for approval, buffer/payout decisions, and PCA recovery oversight.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer. Board adoption recorded via `policy.board_approved`.
- **Review cadence:** Annual review (next review 2027-07-01), enforced by `policy.review_due_at`; out-of-cycle review triggered by material NCUA rule change or charter change.
- **Cross-references:** Capital planning, capital actions, and PCA category management — *Capitalization Policy*. Detailed contingency funding operations — *Liquidity Policy*. Enterprise risk taxonomy and aggregation — *Enterprise Risk Management Policy*. Security-level investment risk weighting — *Investment Policy*.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** This policy reuses registered `capital.*`, `rwa.*`, `liquidity.*`, `icaap.*`, `stress_test.*`, `disclosure.*`, `alco.*`, `ncua.*`, `board.*`, `training.*`, and `gl.*` codes from DESIGN_NOTES wherever a registered code fits. A small number of references rely on registered timer codes used as the `due_at` of generic `Task` instances (e.g., `capital.ratio_computation_due_at`, `liquidity.cfp_activation_due_at`, `disclosure.pillar3_due_at`); engineering will confirm exact bindings before the next review.
- **Charter applicability.** This policy treats Pynthia as a federally-insured credit union subject to NCUA Part 702 PCA and § 741.12 liquidity rules, and **not** directly subject to Basel II/III. The specific PCA category mapping and well-capitalized thresholds applied internally above NCUA minima are management targets, not regulatory minima — to be confirmed against Pynthia's current net-worth classification.
- **NCUA stress-testing applicability.** ICAAP and annual stress testing are adopted as internal best practice. Mandatory NCUA stress-testing thresholds (e.g., asset-size triggers under § 702.504) may not bind Pynthia; the annual cadence here is a policy choice pending confirmation of statutory applicability.
- **CLF membership and capacity.** The Contingency Funding Plan assumes Central Liquidity Facility access up to 25% of shares (Part 725). Actual CLF membership status and committed capacity require confirmation; absent membership, alternative contingent funding sources must be substituted.
- **Market-risk RWA scope.** Market-risk RWA is computed only when trading assets exceed 10% of total assets. If Pynthia holds no trading book, this branch is expected to record zero; the trading-asset definition and threshold are management assumptions pending CFO confirmation.
- **Secondary capital and advanced approaches out of scope.** Secondary/supplemental capital for low-income-designated credit unions and advanced risk-weighting approaches (IRB) are excluded per PATRICK_NOTES and are not anchored to any control here.
- **Basel II/III as guidance only.** Basel BIS citations are linked to the BIS framework documents (not eCFR/LII) because they are international standards, not US statutes/regs; they inform internal targets only and confer no direct compliance obligation.
