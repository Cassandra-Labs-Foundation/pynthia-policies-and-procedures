---
title: Capitalization Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Capitalization, Capital Adequacy, PCA, Stress Testing, ICAAP]
---

## General Policy Statement

Pynthia Credit Union maintains capital sufficient to support its activities, meet member needs, absorb losses, and sustain the confidence of members, employees, and regulators. The credit union meets or exceeds all standards to be classified **well-capitalized** under NCUA Prompt Corrective Action (PCA) and holds an internal net worth ratio target at or above **7%**, supplemented by a **2.5% capital conservation buffer**. This policy governs capital-component measurement, internal trigger levels above PCA thresholds, quarterly capital planning and stress testing, contingency actions and escalation, capital-action governance (dividends, raises, redemptions), and a risk-based ICAAP. It applies to all capital-impacting decisions across the credit union's balance sheet. Risk-weight methodology, liquidity contingency funding, enterprise risk taxonomy, and investment-portfolio composition are governed by separate policies and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratios computed and verified | Quarter closes (`ledger.quarter_closed`) | Quarterly (internal: 15 BD after quarter close) | Net worth ratio, PCA category, buffer status | [CAP-01](#cap-01-capital-adequacy-targets-and-measurement) |
| Internal trigger breached above PCA minimum | Ratio crosses internal trigger (`capital.internal_trigger_breached`) | Same quarter (internal: 5 BD) | Trigger level, corrective-action trigger | [CAP-02](#cap-02-pca-thresholds-and-internal-triggers) |
| Capital conservation buffer eroded | Buffer falls below 2.5% (`capital.buffer_breached`) | Immediate (internal: 2 BD) | Distribution restriction, eligible retained income | [CAP-03](#cap-03-capital-conservation-buffer) |
| Quarterly capital projection prepared | Quarter closes (`ledger.quarter_closed`) | Quarterly (internal: 20 BD) | Multi-year projection, growth/earnings assumptions | [CAP-04](#cap-04-capital-planning) |
| Quarterly stress-scenario report prepared | Quarter closes (`ledger.quarter_closed`) | Quarterly (internal: 20 BD) | Base / adverse / severely adverse results | [CAP-05](#cap-05-capital-stress-testing) |
| Quarterly ratios reported to ALM Committee | Ratios verified (`capital.ratios_verified`) | Quarterly (internal: 25 BD) | Ratio record, ALM report | [CAP-06](#cap-06-quarterly-monitoring-and-reporting) |
| Projection indicates breach of target or well-capitalized threshold | Projection below threshold (`capital.target_breached`) | Same quarter (internal: 10 BD to plan) | Contingency action menu, escalation memo | [CAP-07](#cap-07-contingency-actions-and-escalation) |
| Capital action (dividend / raise / redemption) proposed | Action proposed (`capital.action_proposed`) | Before execution (internal: pre-approval logged) | Dividend limit, pre-approval status | [CAP-08](#cap-08-capital-actions-governance) |
| ICAAP cycle prepared | ICAAP cycle opens (`capital.icaap_cycle_opened`) | Annually (internal: 60 days) | Risk-based capital assessment | [CAP-09](#cap-09-internal-capital-adequacy-assessment-icaap) |

## CAP-01 — Capital Adequacy Targets and Measurement {#cap-01-capital-adequacy-targets-and-measurement}

**WHY (Reg cite):** NCUA PCA requires a net worth ratio ≥ 7% to be classified well-capitalized; net worth and total-assets measurement are defined under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) (net worth components at [§ 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)). California Financial Code / DFPI minimum capital expectations may impose a higher state-chartered floor.

**SYSTEM BEHAVIOR:** After each quarter closes, the engine classifies net worth components (retained earnings, undivided earnings, plus other Part 702-includible amounts), computes total assets as the average of total assets per the most recent call report, derives the net worth ratio, and verifies it against the 7% internal target and the well-capitalized minimum. Component classification and approved capital targets are write-restricted to Compliance; CFO prepares the underlying figures. Where a state DFPI minimum exceeds the federal floor, the higher figure governs the target test as an inline carve-out.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter ledger closes (`ledger.quarter_closed`) | Retained earnings (`capital.retained_earnings`), undivided earnings (`capital.undivided_earnings`), general reserves (`capital.general_reserves`), total assets (`gl.total_assets`), regulatory minima (`capital.regulatory_minima`) | Classified capital components (`capital.components_classified`) | Quarterly (internal: 10 BD; enforced by `capital.ratio_calc_due_at`) |
| Components classified (`capital.components_classified`) | Net worth total, total assets average (`gl.total_assets`), target ratios (`capital.target_tier1_leverage`) | Verified ratio record + PCA category (`capital.ratios_verified`) | Quarterly (internal: 15 BD; enforced by `capital.ratio_computation_due_at`) |
| Targets reviewed and approved (`capital.targets_approved`) | Approved target schedule (`capital.target_tier1_leverage`), DFPI minimum (`insurance.dfpi_minimum`) | Approved capital targets (`capital.targets_approved`) | Annually (internal: board cycle) |

**ALERTS/METRICS:** Alert when the net worth ratio falls within 25 bps of the 7% target; target zero quarters where ratios are computed late versus `capital.ratio_computation_due_at`; track distribution of days from quarter close to ratio verification.

## CAP-02 — PCA Thresholds and Internal Triggers {#cap-02-pca-thresholds-and-internal-triggers}

**WHY (Reg cite):** NCUA PCA establishes the five net worth categories — well-capitalized (≥ 7%), adequately capitalized (≥ 6%), undercapitalized (< 6%), significantly undercapitalized (< 4%), critically undercapitalized (< 2%) — under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702/section-702.102). Internal triggers set above each PCA minimum begin corrective action before regulatory breach.

**SYSTEM BEHAVIOR:** On each ratio verification, the engine maps the net worth ratio to its PCA category and tests it against internal trigger levels set above each regulatory minimum. Crossing an internal trigger raises an escalation distinct from a PCA breach so management acts before the regulatory floor is touched. A PCA threshold breach additionally records mandatory PCA actions. The trigger schedule and PCA category assignments are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ratio verified and category mapped (`capital.ratios_verified`) | Net worth ratio, trigger schedule (`capital.trigger_schedule`), PCA category (`capital.pca_category`) | PCA classification record (`capital.pca_classification_recorded`) | Quarterly (internal: with ratio verification) |
| Internal trigger crossed above PCA minimum (`capital.internal_trigger_breached`) | Breached trigger (`capital.breached_trigger`), current ratio, regulatory minima (`capital.regulatory_minima`) | Trigger escalation issued (`capital.trigger_escalation_issued`) | Same quarter (internal: 5 BD) |
| Regulatory PCA threshold breached (`capital.pca_threshold_breached`) | PCA category (`capital.pca_category`), mandatory actions list (`capital.pca_mandatory_actions`) | PCA response record (`capital.pca_response_recorded`) | Immediate (internal: 2 BD; enforced by `ncua.notification_due_at`) |

**ALERTS/METRICS:** Aging alert on any open internal-trigger escalation older than 5 BD; target zero unacknowledged PCA breaches; track count of quarters operating within one band of an internal trigger.

## CAP-03 — Capital Conservation Buffer {#cap-03-capital-conservation-buffer}

**WHY (Reg cite):** A 2.5% capital conservation buffer is adopted as an internal standard consistent with the Basel III standardized approach; erosion of the buffer restricts distributions in line with eligible-retained-income limits. NCUA net worth measurement under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) anchors the underlying ratio.

**SYSTEM BEHAVIOR:** On each ratio verification, the engine assesses the buffer above minimum ratios; if the buffer is eroded it computes a maximum payout ratio from eligible retained income and applies distribution restrictions automatically. Buffer assessment and the resulting payout restriction are write-restricted to Compliance; the restriction stays applied until the buffer is restored and a restricted-distribution decision is recorded. A proposed distribution while the buffer is intact requires no restriction as an inline carve-out.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ratios verified (`capital.ratios_verified`) | Buffer requirement (`capital.buffer_requirement`), CET1/leverage ratio, eligible retained income (`capital.eligible_retained_income`) | Buffer status record (`capital.buffer_status_recorded`) | Quarterly (internal: with ratio verification) |
| Buffer falls below 2.5% (`capital.buffer_breached`) | Buffer shortfall (`capital.buffer_shortfall`), max payout ratio (`capital.max_payout_ratio`), payout restriction schedule (`capital.payout_restriction_schedule`) | Distribution restriction applied (`capital.distribution_restriction_applied`) | Immediate (internal: 2 BD; enforced by `capital.payout_restriction_due_at`) |
| Restricted distribution evaluated during erosion (`capital.restricted_distribution_decided`) | Proposed distribution amount (`capital.proposed_distribution_amount`), eligible retained income (`capital.eligible_retained_income`) | Restricted distribution decision (`capital.restricted_distribution_decided`) | Before execution (internal: pre-decision logged) |

**ALERTS/METRICS:** Alert immediately on buffer erosion; target zero distributions executed while a payout restriction is active; track buffer headroom (bps above 2.5%) quarter over quarter.

## CAP-04 — Capital Planning {#cap-04-capital-planning}

**WHY (Reg cite):** Sound capital planning supports well-capitalized status under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and is a supervisory expectation; the CFO prepares multi-year forward projections incorporating growth, earnings, dividends, asset quality, economic conditions, and regulatory requirements.

**SYSTEM BEHAVIOR:** Each quarter the engine opens a capital-planning cycle in which the CFO produces a multi-year forward capital projection incorporating anticipated asset growth, earnings trends, dividends, asset quality, economic conditions, and regulatory requirements, compares pro-forma ratios against targets and regulatory guidelines, and presents the plan to the ALM Committee and/or Board. The approved plan and budget assumptions are write-restricted to Compliance and the CFO; revisions create a new plan version linked to the prior plan.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes (`ledger.quarter_closed`) | Budget assumptions (`capital.budget_assumptions`), prior ratios (`capital.prior_ratios`), pro-forma ratios (`capital.proforma_ratios`), regulatory minima (`capital.regulatory_minima`) | Updated capital plan (`capital.plan_updated`) | Quarterly (internal: 20 BD; enforced by `capital.plan_due_at`) |
| Plan finalized for governance (`capital.plan_updated`) | Plan ID (`capital.plan_id`), prior plan ID (`capital.prior_plan_id`), projected shortfall (`capital.projected_shortfall`) | Plan presented to ALM/Board (`capital.plan_presented`) | Quarterly (internal: 25 BD) |
| Plan reviewed by committee (`capital.plan_presented`) | Committee review notes, pro-forma ratios (`capital.proforma_ratios`) | Plan review record (`capital.plan_reviewed`) | Quarterly (internal: next ALM meeting) |

**ALERTS/METRICS:** Aging alert when a quarterly plan is not presented within 25 BD of quarter close; target zero quarters without a forward plan; track count of plan revisions per cycle.

## CAP-05 — Capital Stress Testing {#cap-05-capital-stress-testing}

**WHY (Reg cite):** Stress testing across base / adverse / severely adverse scenarios evidences loss-absorbing capacity supporting well-capitalized status under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and is a supervisory expectation for capital adequacy.

**SYSTEM BEHAVIOR:** Each quarter the engine prepares a capital projection and stress-scenario report across base, adverse, and severely adverse scenarios, versions the stress assumptions, identifies any scenario in which projected ratios fall below minimums, and presents results to the ALM Committee and/or Board. A failing scenario escalates to contingency planning under [CAP-07](#cap-07-contingency-actions-and-escalation) as an inline carve-out. Stress assumptions and the report are write-restricted to Compliance and the CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes (`ledger.quarter_closed`) | Stress assumptions (`capital.stress_assumptions`), pro-forma ratios (`capital.proforma_ratios`), failing scenario flag (`capital.failing_scenario`) | Stress report issued (`capital.stress_report_issued`) | Quarterly (internal: 20 BD; enforced by `capital.stress_report_due_at`) |
| Stress report finalized (`capital.stress_report_issued`) | Stress report ID (`capital.stress_report_id`), failing scenario (`capital.failing_scenario`) | Stress report presented to ALM/Board (`capital.stress_report_presented`) | Quarterly (internal: 25 BD) |
| Committee reviews stress results (`capital.stress_report_presented`) | Review notes, projected shortfall (`capital.projected_shortfall`) | Stress report review record (`capital.stress_report_reviewed`) | Quarterly (internal: next ALM meeting) |

**ALERTS/METRICS:** Alert on any failing stress scenario; target zero quarters without a completed stress report; track the worst-case net worth ratio under severely adverse scenario over time.

## CAP-06 — Quarterly Monitoring and Reporting {#cap-06-quarterly-monitoring-and-reporting}

**WHY (Reg cite):** Quarterly review of capital ratios and reporting to the ALM Committee evidences ongoing monitoring of well-capitalized status under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702); where ratios approach guidelines, management develops a maintenance plan.

**SYSTEM BEHAVIOR:** The CFO reviews capital ratios at least quarterly and issues a quarterly capital report to the ALM Committee; the engine records the ratio set, the quarterly report, and committee receipt. If ratios approach established guidelines, the engine routes the matter to contingency planning under [CAP-07](#cap-07-contingency-actions-and-escalation). The quarterly report record is write-restricted to Compliance and the CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Ratios verified for the quarter (`capital.ratios_verified`) | Ratio record ID (`capital.ratio_record_id`), ratios computed (`capital.ratios_computed`), buffer status (`capital.buffer_assessed`) | Quarterly report issued (`capital.quarterly_report_issued`) | Quarterly (internal: 25 BD; enforced by `capital.quarterly_report_due_at`) |
| Report delivered to ALM Committee (`capital.quarterly_report_issued`) | Quarterly report ID (`capital.quarterly_report_id`), ratio below target flag (`capital.ratio_below_target`) | ALM review record (`capital.quarterly_report_reviewed`) | Quarterly (internal: next ALM meeting) |
| Ratios approach guidelines (`capital.target_breach_notified`) | Ratio below target flag (`capital.ratio_below_target`), projected shortfall (`capital.projected_shortfall`) | Board shortfall notification (`board.shortfall_notified`) | Same quarter (internal: 10 BD; enforced by `board.notification_due_at`) |

**ALERTS/METRICS:** Aging alert when a quarterly report is not delivered to ALM within 25 BD of quarter close; target zero quarters without a recorded committee review; track count of quarters flagged "ratio approaching guideline."

## CAP-07 — Contingency Actions and Escalation {#cap-07-contingency-actions-and-escalation}

**WHY (Reg cite):** When projections indicate the net worth ratio may fall below internal target or the well-capitalized threshold, management must act to restore capital and avoid PCA classification under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702/section-702.201). Contingency actions provide loss-absorbing and asset-reduction levers.

**SYSTEM BEHAVIOR:** When a projection indicates the net worth ratio may fall below the internal target, the engine activates contingency planning and management considers slowing loan growth, selling loans or securities, reducing operating expenses, and soliciting additional capital; if the projection indicates a fall below the well-capitalized threshold, management additionally considers selling other assets, mergers/acquisitions, subordinated debt issuance, and structuring real estate loans for secondary-market sale to provide liquidity or reduce assets as an inline escalation tier. A contingency memo and any executed action are logged; the contingency analysis is write-restricted to Compliance and the CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Projection below internal target (`capital.target_breached`) | Projection-below-target flag (`capital.projection_below_target`), projected shortfall (`capital.projected_shortfall`), contingency action set (`capital.contingency_action_id`) | Contingency activated + memo issued (`capital.contingency_activated`) | Same quarter (internal: 10 BD; enforced by `capital.contingency_due_at`) |
| Projection below well-capitalized threshold (`capital.target_breached`) | Projection-below-well-capitalized flag (`capital.projection_below_well_capitalized`), recovery plan draft (`capital.recovery_plan_draft`) | Board escalation issued (`capital.board_escalation_issued`) | Same quarter (internal: 5 BD; enforced by `capital.contingency_memo_due_at`) |
| Contingency action selected and executed (`capital.contingency_action_executed`) | Action type (`capital.action_type`), action amount (`capital.action_amount`), expected capital impact (`capital.expected_capital_impact`) | Contingency action executed record (`capital.contingency_action_executed`) | Per remediation plan (internal: enforced by `capital.remediation_plan_due_at`) |

**ALERTS/METRICS:** Alert immediately on any projection below the well-capitalized threshold; target zero open contingency activations without a remediation plan; track time from projection breach to first executed contingency action.

## CAP-08 — Capital Actions Governance {#cap-08-capital-actions-governance}

**WHY (Reg cite):** Dividend declarations, capital raises, and redemptions are governed by earnings-based limits and regulatory pre-approval; subordinated debt must qualify under NCUA's subordinated debt rule at [12 CFR Part 702 Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D). Net worth measurement under [Part 702](https://www.ecfr.gov/current/title-12/part-702) anchors distribution capacity.

**SYSTEM BEHAVIOR:** When a capital action (dividend, capital raise, or redemption) is proposed, the engine analyzes it against the earnings-based dividend limit and buffer-driven payout restriction, checks whether regulatory pre-approval is required, and blocks execution until the board decides and any required pre-approval status is recorded. Subordinated-debt instruments are tested for Subpart D qualification as an inline carve-out. Action analysis, dividend limits, and pre-approval status are write-restricted to Compliance and the CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Capital action proposed (`capital.action_proposed`) | Action type (`capital.action_type`), action amount (`capital.action_amount`), dividend limit (`capital.dividend_limit`), max payout ratio (`capital.max_payout_ratio`) | Action analysis record (`capital.action_analyzed`) | Before execution (internal: pre-decision logged) |
| Board decides the action (`capital.action_board_decided`) | Board resolution ID (`capital.board_resolution_id`), regulatory pre-approval status (`capital.regulatory_preapproval_status`), instrument terms (`capital.instrument_terms`) | Board decision record (`capital.action_board_decided`) | Before execution (internal: pre-approval ID logged) |
| Action executed after approval (`capital.action_executed`) | Approved amount (`capital.action_amount`), pre-approval ID (`capital.regulatory_preapproval_id`), subordinated debt flag (`capital.subordinated_debt`) | Capital action executed record (`capital.action_executed`) | After approval (internal: same BD) |

**ALERTS/METRICS:** Alert on any proposed action exceeding the dividend limit or executed without recorded pre-approval where required; target zero distributions executed while a payout restriction is active; track count of capital actions requiring regulatory pre-approval per year.

## CAP-09 — Internal Capital Adequacy Assessment (ICAAP) {#cap-09-internal-capital-adequacy-assessment-icaap}

**WHY (Reg cite):** A risk-based assessment of capital needs beyond regulatory minimums — covering concentration, interest rate, and other material risks — supports holding capital commensurate with the credit union's risk profile above the [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) minimums and is a supervisory expectation.

**SYSTEM BEHAVIOR:** The engine opens an ICAAP cycle on a recurring basis in which management performs a risk-based assessment of capital needs beyond regulatory minimums, covering concentration exposures, interest rate risk, and other material risks, issues an ICAAP report with CCO sign-off, and presents it to the ALM Committee and/or Board. Newly identified material risks feed the next capital plan as an inline linkage. The ICAAP report and CCO sign-off are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ICAAP cycle opens (`capital.icaap_cycle_opened`) | Concentration exposures (`capital.concentration_exposures`), IRR measures (`capital.irr_measures`), material risk flag (`icaap.material_risk_identified`) | ICAAP report issued (`capital.icaap_report_issued`) | Annually (internal: 60 days; enforced by `capital.icaap_due_at`) |
| ICAAP report finalized (`capital.icaap_report_issued`) | ICAAP report ID (`capital.icaap_report_id`), CCO sign-off (`capital.icaap_cco_signoff`) | ICAAP presented to ALM/Board (`capital.icaap_presented`) | Annually (internal: next ALM/Board cycle) |
| Committee reviews ICAAP (`capital.icaap_presented`) | Review notes, new risk assessment (`icaap.new_risk_assessment`) | ICAAP review record (`capital.icaap_reviewed`) | Annually (internal: next ALM meeting) |

**ALERTS/METRICS:** Aging alert when an ICAAP cycle exceeds its `capital.icaap_due_at` timer; target zero cycles closed without CCO sign-off; track count of newly identified material risks carried into the capital plan.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Governance of all controls in this policy is centralized with the CCO.
- **Required participants:** Chief Financial Officer (prepares projections, stress tests, quarterly reports, and capital-action analyses); ALM Committee (reviews plans, stress results, quarterly ratios); Board of Directors (approves targets, capital actions, contingency escalations, and ICAAP).
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer. Board ratification of capital targets and capital actions occurs per the schedules in [CAP-01](#cap-01-capital-adequacy-targets-and-measurement) and [CAP-08](#cap-08-capital-actions-governance).
- **Review cadence:** Reviewed at least annually (next review per front-matter). Quarterly operating cadence is enforced through [CAP-04](#cap-04-capital-planning), [CAP-05](#cap-05-capital-stress-testing), and [CAP-06](#cap-06-quarterly-monitoring-and-reporting).
- **Cross-refs (out of scope):** Risk-weight methodology and RWA tables — Basel II Standardized Approach Framework Policy; liquidity and contingency funding — Liquidity Policy; enterprise risk taxonomy — Enterprise Risk Management Policy; investment composition and limits — Investment Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The capital-side resources, fields, events, and timers referenced throughout the control overlays (e.g., `capital.*` fields and events, `ledger.quarter_closed`, `gl.total_assets`, `insurance.dfpi_minimum`, `icaap.*`, `board.shortfall_notified`, `ncua.notification_due_at`, and the registered capital timers such as `capital.ratio_calc_due_at`, `capital.plan_due_at`, `capital.stress_report_due_at`, `capital.quarterly_report_due_at`, `capital.contingency_due_at`, `capital.icaap_due_at`, `capital.payout_restriction_due_at`, `capital.remediation_plan_due_at`, `capital.contingency_memo_due_at`) are drawn from the registered core-API vocabulary where present; any not yet bound to live workflows will be confirmed by engineering before the next review.
- **Internal trigger levels not numerically specified.** PATRICK_NOTES require internal triggers above each PCA minimum but do not state exact trigger values per category beyond the 7% target. Assumed engineering will parameterize `capital.trigger_schedule` with specific levels above each PCA band; the values need Compliance/CFO confirmation.
- **Charter and DFPI applicability.** Pynthia is treated as a federally insured, California state-chartered credit union, so NCUA Part 702 governs and DFPI minimum capital expectations apply where higher. The precise DFPI minimum figure and whether it exceeds the 7% federal well-capitalized floor need confirmation.
- **Capital conservation buffer is an internal standard, not a Part 702 mandate.** The 2.5% buffer and its distribution-restriction mechanics are adopted from the Basel III standardized approach as internal policy; the eligible-retained-income payout formula (`capital.max_payout_ratio`, `capital.eligible_retained_income`) needs Compliance confirmation of the exact calculation basis applicable to a credit union.
- **Internal SLA day-counts are proposed.** Business-day SLAs in the Timing Matrix and *Within* columns (e.g., 10/15/20/25 BD) are minimal-viable defaults inferred from "at least quarterly" language; they need owner confirmation against the credit union's close calendar.
- **Subordinated debt qualification scope.** Subpart D qualification testing for `capital.subordinated_debt` instruments assumes the credit union may issue qualifying subordinated debt; eligibility and any regulatory pre-approval pathway need confirmation per the NCUA subordinated debt rule.
