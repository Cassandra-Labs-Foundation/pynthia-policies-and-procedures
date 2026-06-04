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

# Capitalization Policy

## General Policy Statement

Pynthia Credit Union maintains capital adequate to support its activities, meet member needs, absorb losses, and sustain the confidence of members, employees, and regulators. The credit union meets or exceeds all standards required to be classified well-capitalized under the applicable prompt corrective action (PCA) framework and holds internal capital-ratio targets above regulatory minimums — at minimum a 9% Tier 1 Leverage Ratio, a 6% Tier 1 Capital Ratio, and a 12% Total Risk-Based Ratio — plus a 2.5% capital conservation buffer. This policy governs capital measurement, planning, stress testing, monitoring, contingency escalation, capital actions, and the internal capital adequacy assessment across all capital-impacting decisions on the credit union's balance sheet. Risk-weight methodology, liquidity management, the enterprise risk taxonomy, and investment portfolio limits are governed by the Basel II Standardized Approach Framework Policy, Liquidity Policy, Enterprise Risk Management Policy, and Investment Policy respectively.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratio computation | Quarter-end close completes (`ledger.quarter_closed`) | Within 15 BD of quarter-end | Tier 1 Leverage, Tier 1 Capital, Total Risk-Based ratios vs. targets | [CP-02](#cp-02-capital-components-and-measurement) |
| Quarterly capital ratio review and ALM report | Ratios computed (`capital.ratios_computed`) | Quarterly, before next ALM Committee meeting | Ratio dashboard, trend, target comparison | [CP-07](#cp-07-quarterly-monitoring-and-reporting) |
| Quarterly capital plan update | Quarter-end close completes (`ledger.quarter_closed`) | Quarterly, presented at next ALM/Board meeting | Multi-year capital projection | [CP-05](#cp-05-capital-planning) |
| Quarterly stress-scenario report | Capital plan updated (`capital.plan_updated`) | Quarterly, presented at next ALM/Board meeting | Base / adverse / severely adverse projections | [CP-06](#cp-06-capital-stress-testing) |
| Internal trigger breach | Any ratio crosses an internal trigger level (`capital.internal_trigger_breached`) | Remediation plan within 30 days | Management plan to restore ratios | [CP-03](#cp-03-pca-thresholds-and-internal-triggers) |
| Projection shows ratio below internal target | Stress or plan projection breaches target (`capital.projection_below_target`) | Contingency options memo within 30 days | Tier-1 contingency action set | [CP-08](#cp-08-contingency-actions-and-escalation) |
| Projection shows ratio below well-capitalized | Projection breaches well-capitalized floor (`capital.projection_below_well_capitalized`) | Escalation to Board at next meeting (no later than 45 days) | Expanded contingency action set | [CP-08](#cp-08-contingency-actions-and-escalation) |
| Buffer erosion restricts distributions | Conservation buffer falls below 2.5% (`capital.buffer_eroded`) | Distribution restrictions effective immediately | Maximum payout computation | [CP-04](#cp-04-capital-conservation-buffer) |
| Dividend declaration | Board considers dividend (`capital.dividend_proposed`) | Approval before declaration; regulatory pre-approval where required | Earnings-based limit check | [CP-09](#cp-09-capital-actions-governance) |
| Annual ICAAP | Annual planning cycle opens (`capital.icaap_cycle_opened`) | Annually, presented to Board | Risk-based capital needs assessment | [CP-10](#cp-10-internal-capital-adequacy-assessment-icaap) |

## CP-01 — Capital Adequacy Targets {#cp-01-capital-adequacy-targets}

**WHY (Reg cite):** The PCA framework for federally insured credit unions ([12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702); statutory basis [12 USC § 1790d](https://www.law.cornell.edu/uscode/text/12/1790d), paralleling [12 USC § 1831o](https://www.law.cornell.edu/uscode/text/12/1831o) for banks) requires minimum net worth and risk-based capital ratios; internal targets above the minima ensure corrective capacity exists before regulatory thresholds are approached.

**SYSTEM BEHAVIOR:** The credit union maintains, at all times, ratios sufficient to be classified well-capitalized and holds internal targets above the regulatory minima: Tier 1 Leverage Ratio ≥ 9% (regulatory minimum 5%), Tier 1 Capital Ratio ≥ 6% of risk-weighted assets, and Total Risk-Based Ratio ≥ 12% (regulatory minimum 10%). Targets are reviewed annually as part of the ICAAP cycle ([CP-10](#cp-10-internal-capital-adequacy-assessment-icaap)) and may not be lowered below this policy's floors without Board approval and a policy amendment. Where state (DFPI) minimum capital expectations exceed federal minimums, the higher standard governs. Target values are write-restricted to Compliance; the CFO's office reads them for monitoring and planning.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board approves or reaffirms target set annually (`capital.targets_approved`) | Current targets (`capital.target_tier1_leverage`, `capital.target_tier1_rwa`, `capital.target_total_rbc`), ICAAP results (`capital.icaap_report_id`), regulatory minima (`capital.regulatory_minima`) | Approved target record + Board minutes reference (`capital.targets_approved`) | Annually (internal: within the annual planning cycle) |
| Any computed ratio falls below an internal target (`capital.target_breached`) | Computed ratios (`capital.ratio_tier1_leverage`, `capital.ratio_tier1_rwa`, `capital.ratio_total_rbc`), target values (`capital.target_tier1_leverage`, `capital.target_tier1_rwa`, `capital.target_total_rbc`) | Target-breach notification to CFO and CCO (`capital.target_breach_notified`) | Same business day as ratio computation (internal: 1 BD) |

**ALERTS/METRICS:** Dashboard tracks each ratio's distance to its internal target and regulatory minimum; an alert fires when any ratio is within 50 bps of its internal target; the target count of internal-target breaches is zero.

## CP-02 — Capital Components and Measurement {#cp-02-capital-components-and-measurement}

**WHY (Reg cite):** Capital component definitions and measurement conventions follow the regulatory capital rules ([12 CFR Part 702 Subpart A](https://www.ecfr.gov/current/title-12/part-702/subpart-A), definitions at [§ 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2)) and the Basel III standardized framework as implemented in [12 CFR Part 217](https://www.ecfr.gov/current/title-12/part-217); consistent measurement is the precondition for every other control in this policy.

**SYSTEM BEHAVIOR:** Tier 1 Capital consists of equity and retained earnings, excluding unrealized gains and losses on available-for-sale securities. Total Capital is Tier 1 plus the permissible portion of the allowance for loan losses. Average Assets are computed as total average assets net of goodwill and other intangible assets. Risk-Weighted Assets include on-balance-sheet assets plus qualifying off-balance-sheet items (primarily unfunded loan commitments) allocated by risk-weight category; the risk-weight methodology itself is defined in the Basel II Standardized Approach Framework Policy and is out of scope here. Quarter-end computations are produced by the finance close process from the general ledger and 5300 bookkeeping layer; computed ratio records are write-restricted to the CFO's office, with Compliance holding read access for verification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end close completes (`ledger.quarter_closed`) | GL balances by 5300 code (`bookkeeping_entry.account_code_5300`, `bookkeeping_entry.schedule_a_code`), AFS unrealized G/L (`capital.afs_unrealized_gl`), allowance balance (`capital.allowance_balance`), goodwill/intangibles (`capital.intangibles_balance`), off-balance-sheet exposures (`capital.obs_exposures[]`) | Computed Tier 1, Total Capital, Average Assets, RWA, and the three ratios (`capital.ratios_computed`) | 15 BD after quarter-end (internal: 10 BD; enforced by `capital.ratio_computation_due_at`) |
| Computation verified by Compliance (`capital.ratios_verified`) | Computed ratio record (`capital.ratio_record_id`), prior-quarter comparatives (`capital.prior_ratios`) | Verified ratio record locked for reporting (`capital.ratios_verified`) | 5 BD after computation (internal SLA) |

**ALERTS/METRICS:** Alert if quarter-end ratios are not computed within 10 BD or not verified within 15 BD of quarter-end; the reconciliation-difference metric between computed RWA and 5300 filing values targets zero.

## CP-03 — PCA Thresholds and Internal Triggers {#cp-03-pca-thresholds-and-internal-triggers}

**WHY (Reg cite):** PCA categories — well capitalized through critically undercapitalized — and their mandatory supervisory consequences are set in [12 CFR Part 702 Subpart A](https://www.ecfr.gov/current/title-12/part-702/subpart-A) and [12 USC § 1790d](https://www.law.cornell.edu/uscode/text/12/1790d); internal triggers above each threshold ensure corrective action begins before any regulatory floor is breached.

**SYSTEM BEHAVIOR:** The credit union maintains an internal trigger schedule set above each regulatory PCA threshold across the five categories (well capitalized, adequately capitalized, undercapitalized, significantly undercapitalized, critically undercapitalized). When any computed or projected ratio crosses an internal trigger, the escalation in [CP-08](#cp-08-contingency-actions-and-escalation) activates before the corresponding regulatory threshold is reached. Crossing a regulatory PCA threshold itself triggers the mandatory and discretionary supervisory actions of Part 702, including any required net worth restoration plan. The trigger schedule is write-restricted to Compliance and approved by the Board with the annual target set.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Verified ratios compared to trigger schedule each quarter (`capital.ratios_verified`) | Verified ratios (`capital.ratio_record_id`), trigger schedule (`capital.trigger_schedule`) | PCA classification + trigger evaluation record (`capital.pca_classification_recorded`) | 5 BD after verification (internal SLA) |
| A ratio crosses an internal trigger level (`capital.internal_trigger_breached`) | Breached trigger and category (`capital.breached_trigger`), current ratios (`capital.ratio_record_id`) | Escalation notice to CFO, CCO, ALM Committee + remediation-plan requirement (`capital.trigger_escalation_issued`) | 1 BD notification; remediation plan within 30 days (enforced by `capital.remediation_plan_due_at`) |
| A ratio crosses a regulatory PCA threshold (`capital.pca_threshold_breached`) | PCA category (`capital.pca_category`), Part 702 mandatory actions checklist (`capital.pca_mandatory_actions`) | Board notification + regulatory engagement record, net worth restoration plan if required (`capital.pca_response_recorded`) | Per Part 702 deadlines (internal: Board notified within 5 BD) |

**ALERTS/METRICS:** Alert at each internal trigger crossing and at any projected crossing within the planning horizon; a metric tracks the margin (bps) between each ratio and the nearest trigger; the target count of regulatory PCA threshold breaches is zero.

## CP-04 — Capital Conservation Buffer {#cp-04-capital-conservation-buffer}

**WHY (Reg cite):** The Basel III standardized approach requires a 2.5% capital conservation buffer above minimum risk-based ratios, with graduated payout restrictions when the buffer is eroded ([12 CFR § 217.11](https://www.ecfr.gov/current/title-12/part-217/section-217.11)).

**SYSTEM BEHAVIOR:** The credit union maintains a 2.5% capital conservation buffer on top of its minimum risk-based capital ratios, consistent with the Basel III standardized approach. If the buffer falls below 2.5%, distributions — dividends, discretionary bonus payments, and capital redemptions — are restricted in proportion to the shortfall using the graduated maximum-payout schedule of § 217.11, and any proposed distribution while the buffer is eroded requires CCO sign-off and Board approval. Buffer computation accompanies the quarterly ratio computation in [CP-02](#cp-02-capital-components-and-measurement). The buffer status flag is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly ratio verification completes (`capital.ratios_verified`) | Risk-based ratios (`capital.ratio_tier1_rwa`, `capital.ratio_total_rbc`), buffer minimum (`capital.buffer_requirement`) | Buffer level and status flag (`capital.buffer_status_recorded`) | 5 BD after verification (internal SLA) |
| Buffer falls below 2.5% (`capital.buffer_eroded`) | Buffer shortfall (`capital.buffer_shortfall`), eligible retained income (`capital.eligible_retained_income`), payout schedule (`capital.max_payout_ratio`) | Distribution restriction in force + maximum payout amount (`capital.distribution_restriction_applied`) | Immediately upon determination (internal: same BD) |
| Distribution proposed while buffer eroded (`capital.dividend_proposed`) | Proposed distribution amount (`capital.proposed_distribution_amount`), maximum payout (`capital.max_payout_ratio`) | CCO/Board approval or rejection record (`capital.restricted_distribution_decided`) | Before declaration (internal: decision within 10 BD) |

**ALERTS/METRICS:** Alert when the buffer falls within 50 bps of 2.5% and again at erosion; a metric tracks the buffer level each quarter; the target count of distributions paid in excess of the maximum payout is zero.

## CP-05 — Capital Planning {#cp-05-capital-planning}

**WHY (Reg cite):** Sound capital planning is a safety-and-soundness expectation under the PCA framework ([12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702)) and supports the net-worth planning obligations of [12 USC § 1790d](https://www.law.cornell.edu/uscode/text/12/1790d); forward projections are the mechanism by which target breaches are anticipated rather than discovered.

**SYSTEM BEHAVIOR:** The CFO prepares capital projections at least quarterly, incorporating anticipated asset growth, earnings trends, dividends, asset quality, asset/liability diversification and maturity, general economic conditions, industry comparisons, strategic planning, and legal and regulatory requirements. Projections use the growth and profitability assumptions of the corporate budget, include a multi-year forward look, and contain a comparative review of current capital against regulatory guidelines and this policy's internal targets. The plan is presented quarterly to the ALM Committee and/or the Board. Capital plan records are write-restricted to the CFO's office.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter-end close completes (`ledger.quarter_closed`) | Budget assumptions (`capital.budget_assumptions`), current ratios (`capital.ratio_record_id`), growth/earnings/dividend forecasts (`capital.forecast_inputs[]`) | Multi-year capital projection + target comparison (`capital.plan_updated`) | Quarterly, before next ALM/Board meeting (internal: 20 BD after quarter-end; enforced by `capital.plan_due_at`) |
| Plan presented to ALM Committee and/or Board (`capital.plan_presented`) | Capital plan (`capital.plan_id`), prior-quarter plan for comparison (`capital.prior_plan_id`) | Meeting minutes reference + acceptance or directed revisions (`capital.plan_reviewed`) | At the next scheduled ALM/Board meeting (internal SLA) |

**ALERTS/METRICS:** Alert if the quarterly plan is not produced within 20 BD of quarter-end or not presented at the next ALM/Board meeting; a metric tracks projection accuracy (projected vs. actual ratios) by quarter.

## CP-06 — Capital Stress Testing {#cp-06-capital-stress-testing}

**WHY (Reg cite):** Stress testing of capital under adverse conditions is integral to the risk-based capital framework of [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) (see the stress-testing provisions for covered credit unions at [§ 702.306](https://www.ecfr.gov/current/title-12/part-702/section-702.306), applied here proportionately as an internal standard) and to Basel III capital adequacy principles ([12 CFR Part 217](https://www.ecfr.gov/current/title-12/part-217)).

**SYSTEM BEHAVIOR:** The CFO prepares a quarterly capital projection and stress-scenario report covering base, adverse, and severely adverse scenarios, and presents it to the ALM Committee and/or the Board. Scenarios stress earnings, asset growth, credit losses, and other material drivers; results show projected ratios against internal targets and regulatory thresholds under each scenario. If a stress scenario projects insufficient capital generation through earnings to support projected growth while maintaining targets, the contingency evaluation in [CP-08](#cp-08-contingency-actions-and-escalation) is initiated. Scenario definitions and results are write-restricted to the CFO's office, with Compliance read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly capital plan completes (`capital.plan_updated`) | Plan baseline (`capital.plan_id`), scenario definitions (`capital.stress_scenarios[]`), loss/earnings assumptions (`capital.stress_assumptions`) | Stress report with projected ratios per scenario (`capital.stress_report_issued`) | Quarterly, before next ALM/Board meeting (internal: 20 BD after quarter-end; enforced by `capital.stress_report_due_at`) |
| Stress report presented (`capital.stress_report_presented`) | Stress report (`capital.stress_report_id`) | Meeting minutes reference + directed actions if any (`capital.stress_report_reviewed`) | At the next scheduled ALM/Board meeting (internal SLA) |
| Any scenario projects a ratio below internal target (`capital.projection_below_target`) | Failing scenario and ratio path (`capital.failing_scenario`), shortfall size (`capital.projected_shortfall`) | Contingency evaluation referral to [CP-08](#cp-08-contingency-actions-and-escalation) (`capital.contingency_referred`) | 5 BD after report issuance (internal SLA) |

**ALERTS/METRICS:** Alert if the stress report is not produced or presented on schedule; a metric tracks the minimum projected ratio across scenarios each quarter and the number of quarters any scenario breaches a target.

## CP-07 — Quarterly Monitoring and Reporting {#cp-07-quarterly-monitoring-and-reporting}

**WHY (Reg cite):** Ongoing monitoring against PCA categories is required to comply with the classification and net-worth measurement obligations of [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and [12 USC § 1790d](https://www.law.cornell.edu/uscode/text/12/1790d); board-level visibility is a core safety-and-soundness expectation.

**SYSTEM BEHAVIOR:** The CFO reviews capital ratios at least quarterly and includes them in the report to the ALM Committee, showing each ratio against its internal target, internal trigger levels, and regulatory thresholds, with trend analysis. If ratios approach the established guidelines, management develops a plan to maintain ratios above acceptable levels; that plan obligation is enforced through the trigger mechanics in [CP-03](#cp-03-pca-thresholds-and-internal-triggers). The quarterly capital report is write-restricted to the CFO's office and distributed to the ALM Committee, the CCO, and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Verified quarterly ratios available (`capital.ratios_verified`) | Verified ratios (`capital.ratio_record_id`), targets and triggers (`capital.target_tier1_leverage`, `capital.target_total_rbc`, `capital.trigger_schedule`), trend history (`capital.ratio_history[]`) | Quarterly capital report to ALM Committee (`capital.quarterly_report_issued`) | Quarterly, before next ALM Committee meeting (internal: 20 BD after quarter-end; enforced by `capital.quarterly_report_due_at`) |
| Report reviewed by ALM Committee (`capital.quarterly_report_reviewed`) | Quarterly report (`capital.quarterly_report_id`) | Minutes reference + any directed management plan (`capital.quarterly_report_reviewed`) | At the next scheduled ALM Committee meeting (internal SLA) |

**ALERTS/METRICS:** Alert if the quarterly report misses its due date; metrics track the on-time delivery rate (target 100%) and the number of quarters with a "ratios approaching guidelines" flag.

## CP-08 — Contingency Actions and Escalation {#cp-08-contingency-actions-and-escalation}

**WHY (Reg cite):** The PCA framework imposes escalating mandatory and discretionary actions as capital declines ([12 CFR Part 702 Subpart A](https://www.ecfr.gov/current/title-12/part-702/subpart-A); [12 USC § 1790d](https://www.law.cornell.edu/uscode/text/12/1790d)); pre-defined internal contingency tiers ensure management acts before those statutory consequences attach.

**SYSTEM BEHAVIOR:** Two contingency tiers apply. Tier 1 — if projections indicate the Tier 1 Leverage Ratio or Total Risk-Based Ratio may fall below internal targets, management considers slowing loan growth, selling loans or securities, reducing operating expenses, and soliciting additional capital. Tier 2 — if projections indicate either ratio may fall below the well-capitalized regulatory guidelines, management additionally considers selling other assets, public or private stock offerings, merger/acquisition activity, and debt issuance. To preserve these options, real-estate-secured loans are structured to meet secondary-market requirements so they can be sold to provide liquidity or reduce assets. Other actions appropriate to the circumstances may be added at either tier. Contingency decisions and their execution status are write-restricted to the CFO's office, with CCO and Board visibility.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Projection shows ratio below internal target (`capital.projection_below_target`) | Failing projection (`capital.failing_scenario`), shortfall (`capital.projected_shortfall`), Tier 1 action menu (`capital.contingency_actions_tier1[]`) | Contingency options memo with selected actions (`capital.contingency_memo_issued`) | 30 days (internal: 20 BD; enforced by `capital.contingency_memo_due_at`) |
| Projection shows ratio below well-capitalized guideline (`capital.projection_below_well_capitalized`) | Failing projection (`capital.failing_scenario`), Tier 2 action menu (`capital.contingency_actions_tier2[]`) | Expanded contingency memo + Board escalation (`capital.board_escalation_issued`) | Board notified at next meeting, no later than 45 days (internal: 10 BD notification) |
| Contingency action approved and executed (`capital.contingency_action_executed`) | Approved action (`capital.contingency_action_id`), expected capital impact (`capital.expected_capital_impact`) | Execution record + realized impact tracking (`capital.contingency_action_executed`) | Per action plan milestones (internal: status reported quarterly) |

**ALERTS/METRICS:** Alert on any open contingency memo past its due date; metrics track time from projection breach to memo issuance, and realized vs. expected capital impact of executed actions.

## CP-09 — Capital Actions Governance {#cp-09-capital-actions-governance}

**WHY (Reg cite):** Dividends, redemptions, and capital instruments are constrained by the PCA payout limits and capital-classification rules ([12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702); earnings-retention requirements at [§ 702.201](https://www.ecfr.gov/current/title-12/part-702/section-702.201)), the conservation-buffer payout restrictions ([12 CFR § 217.11](https://www.ecfr.gov/current/title-12/part-217/section-217.11)), and — where a holding company is involved — the source-of-strength doctrine ([12 USC § 1831o-1](https://www.law.cornell.edu/uscode/text/12/1831o-1)).

**SYSTEM BEHAVIOR:** All capital actions — dividend declarations, capital raises (including common stock issuance and subordinated debt qualifying as Tier 2 capital), redemptions, and any holding-company capital injections — require Board approval supported by a CFO impact analysis showing pro-forma ratios after the action. Dividends are subject to earnings-based limits and may not be declared if the action would erode the conservation buffer ([CP-04](#cp-04-capital-conservation-buffer)) or drop any ratio below internal targets; regulatory pre-approval is obtained where required before execution. Subordinated debt issuance follows the applicable regulatory qualification requirements for inclusion in Total Capital. Capital action records are write-restricted to the CFO's office, with Compliance approval required on each record before execution.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Capital action proposed (`capital.action_proposed`) | Action type and size (`capital.action_type`, `capital.action_amount`), pro-forma ratios (`capital.proforma_ratios`), earnings-based limit (`capital.dividend_limit`), buffer status (`capital.buffer_status_recorded`) | CFO impact analysis + Compliance review record (`capital.action_analyzed`) | Before Board consideration (internal: 10 BD from proposal) |
| Board decides on capital action (`capital.action_board_decided`) | Impact analysis (`capital.action_analysis_id`), regulatory pre-approval status (`capital.regulatory_preapproval_status`) | Board resolution + approval/denial record (`capital.action_board_decided`) | Before declaration or execution (internal SLA) |
| Approved action executed (`capital.action_executed`) | Board resolution (`capital.board_resolution_id`), regulatory pre-approval where required (`capital.regulatory_preapproval_id`) | Execution record + post-action ratio recomputation (`capital.action_executed`) | Per action terms (internal: post-action ratios recomputed within 10 BD) |

**ALERTS/METRICS:** Alert on any capital action executed without a linked Board resolution or, where required, regulatory pre-approval (target zero); a metric tracks pro-forma vs. realized ratio impact for each executed action.

## CP-10 — Internal Capital Adequacy Assessment (ICAAP) {#cp-10-internal-capital-adequacy-assessment-icaap}

**WHY (Reg cite):** An internal assessment of capital needs beyond regulatory minimums implements the Basel framework's supervisory-review pillar as reflected in the capital adequacy expectations of [12 CFR Part 217](https://www.ecfr.gov/current/title-12/part-217) and the risk-based capital provisions of [12 CFR Part 702 Subpart A](https://www.ecfr.gov/current/title-12/part-702/subpart-A), ensuring capital covers risks the standardized ratios understate.

**SYSTEM BEHAVIOR:** At least annually, the CFO leads a risk-based assessment of capital needs beyond regulatory minimums, covering concentration risk, interest rate risk, and other material risks identified under the Enterprise Risk Management Policy taxonomy. The ICAAP quantifies capital needed for each material risk, compares aggregate needs to actual capital, and informs the annual target reaffirmation in [CP-01](#cp-01-capital-adequacy-targets). Results are presented to the Board with the annual capital plan. The ICAAP report is write-restricted to the CFO's office, with Compliance read access and CCO sign-off before Board presentation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual planning cycle opens (`capital.icaap_cycle_opened`) | Material risk inventory (`capital.material_risks[]`), concentration exposures (`capital.concentration_exposures`), IRR measures (`capital.irr_measures`), current capital (`capital.ratio_record_id`) | ICAAP report quantifying capital needs by risk (`capital.icaap_report_issued`) | Annually (internal: completed before annual target reaffirmation; enforced by `capital.icaap_due_at`) |
| ICAAP presented to Board (`capital.icaap_presented`) | ICAAP report (`capital.icaap_report_id`), CCO sign-off (`capital.icaap_cco_signoff`) | Board minutes reference + any directed target changes feeding [CP-01](#cp-01-capital-adequacy-targets) (`capital.icaap_reviewed`) | At the annual planning Board meeting (internal SLA) |

**ALERTS/METRICS:** Alert if the ICAAP is not completed before the annual target reaffirmation; a metric tracks aggregate ICAAP capital need vs. actual capital (the surplus must remain positive).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, annual review, and regulatory change monitoring.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Chief Financial Officer (ratio computation, planning, stress testing, ICAAP, capital action analysis), ALM Committee (quarterly review of ratios, plans, and stress reports), Board of Directors (target approval, capital actions, contingency escalations, ICAAP review).
- **Review cadence:** Annual full review (next review 2027-06-04); interim review upon any change to 12 CFR Part 702, 12 CFR Part 217, applicable state (DFPI) capital expectations, or a change in the credit union's PCA classification.
- **Cross-references:** Basel II Standardized Approach Framework Policy (risk-weight methodology and RWA tables); Liquidity Policy (liquidity management and contingency funding); Enterprise Risk Management Policy (risk taxonomy); Investment Policy (portfolio composition and limits).
- **Sign-off:** Approval is recorded in Board minutes and the policy register; this document supersedes all prior capital/capitalization policies.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `capital.*` and `ledger.*` events, fields, and timers cited in the EVENTS tables throughout this document are not registered in `vocabulary.json` (the parsed spec is banking-core only, with zero events defined). All codes used are the target naming scheme and must be registered by engineering before the next review; their presence in the tables is the registration request.
- **Charter and regulatory framework.** Pynthia is treated as a federally insured credit union subject to NCUA PCA under 12 CFR Part 702 and 12 USC § 1790d. The reference policy and Patrick's notes use bank-style ratio names and PCA categories (the 12 USC § 1831o framework), and the authority hints cite both regimes plus DFPI expectations; this policy preserves the bank-style internal targets (9% leverage / 6% Tier 1 / 12% total) as internal standards layered over the credit-union PCA framework. The exact charter type and which PCA regime legally controls need confirmation with Patrick Wilson and counsel.
- **Conservation buffer applicability.** The 2.5% Basel III conservation buffer (12 CFR § 217.11) does not formally apply to NCUA-supervised credit unions; it is adopted here as an internal standard per Patrick's note (d). The graduated payout schedule is applied by analogy.
- **Stock offerings and holding-company actions.** Credit unions do not issue common stock and rarely have holding companies; the Tier 2 contingency menu (stock offerings, M&A, debt issuance) and the capital-actions list (stock issuance, holding-company injections) are carried over from Patrick's notes (h)–(i) and the bank-origin reference policy. Which instruments are actually available to Pynthia (e.g., subordinated debt under NCUA's subordinated debt rule, 12 CFR Part 702 Subpart D) needs confirmation.
- **Internal trigger schedule values.** Patrick's notes require internal triggers above each PCA threshold but do not specify the values; the specific cushion per category must be set by the CFO and approved by the Board at the first annual target approval.
- **Permissible allowance portion in Total Capital.** The cap on the allowance for loan losses includible in Total Capital (commonly 1.25% of RWA) is assumed to follow the applicable standardized-approach limit; exact treatment under CECL needs CFO confirmation.
- **Meeting cadence.** "Next scheduled ALM/Board meeting" SLAs assume at least quarterly ALM Committee and Board meetings; if cadence differs, the Timing Matrix deadlines need adjustment.
- **DFPI minimums.** State minimum capital expectations are referenced but no specific DFPI numeric requirement is incorporated; confirm whether a state requirement above federal minimums applies to Pynthia's charter.
