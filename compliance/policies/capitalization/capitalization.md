```yaml
---
title: Capitalization Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Capital, PCA, NCUA, Stress Testing, ICAAP]
---
```

## General Policy Statement

Pynthia Credit Union (the "Credit Union") is committed to maintaining capital levels that are sufficient to absorb losses, support balance-sheet growth, sustain member and regulatory confidence, and meet or exceed all standards required for classification as a well-capitalized institution under NCUA Prompt Corrective Action (PCA) rules. The Credit Union sets internal net worth ratio targets above regulatory minimums, governs capital planning and stress testing on a quarterly cycle, and requires disciplined escalation and corrective action whenever ratios approach established thresholds. This policy applies to all capital-impacting decisions across the Credit Union's balance sheet and is owned by the Chief Compliance Officer, with the Chief Financial Officer, ALM Committee, and Board of Directors as required participants. Out of scope: risk-weight methodology and RWA calculation tables (see Basel II Standardized Approach Framework Policy); liquidity management and contingency funding plans (see Liquidity Policy); enterprise risk taxonomy (see Enterprise Risk Management Policy); and investment portfolio composition and limits (see Investment Policy).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Net worth ratio computed from call report data | Quarter closes → `capital.ratios.verified` | Within 15 calendar days of quarter-end | Net worth / total assets per 12 CFR § 702.2 | [CP-02](#cp-02-capital-components-and-measurement) |
| PCA classification assigned or updated | Ratio computed → `capital.pca_classification.recorded` | Same day as ratio computation | Five-tier PCA schedule per 12 CFR § 702.102 | [CP-03](#cp-03-pca-thresholds-and-internal-triggers) |
| Internal trigger breached | Ratio falls below internal threshold → `capital.internal_trigger.breached` | Same business day | Internal trigger schedule per CP-03 | [CP-03](#cp-03-pca-thresholds-and-internal-triggers) |
| Capital conservation buffer assessed | Ratio computed → `capital.buffer_status.recorded` | Same day as ratio computation | 2.5% buffer per CP-04 | [CP-04](#cp-04-capital-conservation-buffer) |
| Distribution restriction applied | Buffer eroded → `capital.distribution_restriction.applied` | Before any dividend or capital action is executed | Payout restriction schedule per CP-04 | [CP-04](#cp-04-capital-conservation-buffer) |
| Quarterly capital plan prepared and presented | Quarter closes → `capital.plan.updated` | Within 30 calendar days of quarter-end | Multi-year projections per CP-05 | [CP-05](#cp-05-capital-planning) |
| Quarterly stress report prepared and presented | Quarter closes → `capital.stress_report.issued` | Within 30 calendar days of quarter-end | Base / adverse / severely adverse scenarios per CP-06 | [CP-06](#cp-06-capital-stress-testing) |
| Quarterly monitoring report to ALM Committee | Quarter closes → `capital.quarterly_report.issued` | Within 30 calendar days of quarter-end | Ratio dashboard per CP-07 | [CP-07](#cp-07-quarterly-monitoring-and-reporting) |
| Contingency action memo issued (below internal target) | Projection below internal target → `capital.contingency_memo.issued` | Within 5 business days of trigger | Tier-1 contingency actions per CP-08 | [CP-08](#cp-08-contingency-actions-and-escalation) |
| Board escalation issued (below well-capitalized) | Projection below well-capitalized → `capital.board_escalation.issued` | Within 2 business days of trigger | Tier-2 contingency actions per CP-08 | [CP-08](#cp-08-contingency-actions-and-escalation) |
| Capital action (dividend / subordinated debt / redemption) proposed | Action proposed → `capital.action.proposed` | Before execution | Governance requirements per CP-09 | [CP-09](#cp-09-capital-actions-governance) |
| ICAAP cycle completed and presented | Annual cycle opens → `capital.icaap_report.issued` | Annually, within 60 calendar days of fiscal year-end | Risk-based capital needs assessment per CP-10 | [CP-10](#cp-10-internal-capital-adequacy-assessment-icaap) |

---

## CP-01 — Capital Adequacy Targets {#cp-01-capital-adequacy-targets}

**WHY (Reg cite):** [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702), specifically [§ 702.102](https://www.ecfr.gov/current/title-12/part-702/section-702.102), requires federally insured credit unions to maintain minimum net worth ratios and classifies institutions into PCA categories. The Credit Union's policy is to meet or exceed the well-capitalized threshold (net worth ratio ≥ 7%) at all times and to maintain an internal target of ≥ 7% net worth ratio as a floor, with additional internal buffers established in [CP-03](#cp-03-pca-thresholds-and-internal-triggers) and [CP-04](#cp-04-capital-conservation-buffer).

**SYSTEM BEHAVIOR:** The system enforces a single authoritative capital adequacy target: the Credit Union must be classified as well-capitalized under NCUA PCA at all times, which requires a net worth ratio ≥ 7% per [12 CFR § 702.102(a)(1)](https://www.ecfr.gov/current/title-12/part-702/section-702.102). The internal target mirrors this threshold; internal triggers above the regulatory minimum are defined in CP-03. The `capital.targets` field records the approved target set; changes require CCO sign-off and Board approval. The `capital.targets` field is write-restricted to the Chief Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board approves or revises capital adequacy targets (`capital.targets.approved`) | Approved target ratios (`capital.targets`), regulatory minimum schedule (`capital.regulatory_minima`), Board resolution ID (`capital.board_resolution_id`) | Approved target record + Board resolution logged (`capital.targets.approved`) | At least annually or upon any regulatory change to PCA thresholds |
| Quarterly ratio computed and compared to targets (`capital.ratios.verified`) | Computed net worth ratio (`capital.ratio_record_id`), approved targets (`capital.targets`), PCA category (`capital.pca_category`) | Ratio-vs-target comparison logged; breach flagged if below target (`capital.target.breached`) | Within 15 calendar days of quarter-end (enforced by `capital.ratio_calc_due_at`) |

**ALERTS/METRICS:** Alert fires when the net worth ratio falls below the internal target of 7% (`capital.target.breached`); target is zero occurrences per quarter. Dashboard tracks ratio headroom above the well-capitalized threshold in basis points each quarter.

---

## CP-02 — Capital Components and Measurement {#cp-02-capital-components-and-measurement}

**WHY (Reg cite):** [12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2) defines "net worth" for federally insured credit unions as retained earnings and undivided earnings, plus any other amounts includible under Part 702. Total assets are computed as the average of total assets reported on the most recent call report, consistent with [12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2).

**SYSTEM BEHAVIOR:** The CFO computes the net worth ratio each quarter by dividing net worth (as defined in [12 CFR § 702.2](https://www.ecfr.gov/current/title-12/part-702/section-702.2): retained earnings plus undivided earnings plus any other Part 702-includible amounts) by average total assets (as reported on the most recent call report). The system pulls `capital.retained_earnings`, `capital.undivided_earnings`, and `gl.total_assets` to assemble the ratio inputs. Any adjustments for other includible amounts are documented in `capital.components`. The computed ratio is stored in `capital.ratio_record_id` and is write-restricted to the CFO; the CCO reviews and attests the computation before it is used for PCA classification.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and call report data is available (`capital.ratios.verified`) | Retained earnings (`capital.retained_earnings`), undivided earnings (`capital.undivided_earnings`), other includible amounts (`capital.components`), average total assets from call report (`gl.total_assets`) | Computed net worth ratio record (`capital.ratio_record_id`) + event logged (`capital.ratios.verified`) | Within 15 calendar days of quarter-end (enforced by `capital.ratio_calc_due_at`) |
| CFO attests computation accuracy (`capital.ratios.verified`) | Ratio record (`capital.ratio_record_id`), CCO sign-off (`capital.icaap_cco_signoff`) | Attested ratio record logged; feeds CP-03 PCA classification | Same day as computation |

**ALERTS/METRICS:** Alert fires if the ratio computation task is not completed within 15 calendar days of quarter-end (`capital.ratio_calc_due_at` overdue). Data-quality alert fires if `gl.total_assets` or `capital.retained_earnings` inputs are stale or missing.

---

## CP-03 — PCA Thresholds and Internal Triggers {#cp-03-pca-thresholds-and-internal-triggers}

**WHY (Reg cite):** [12 CFR § 702.102](https://www.ecfr.gov/current/title-12/part-702/section-702.102) establishes five PCA net worth categories: well-capitalized (≥ 7%), adequately capitalized (≥ 6%), undercapitalized (< 6%), significantly undercapitalized (< 4%), and critically undercapitalized (< 2%). The Credit Union sets internal trigger levels above each regulatory threshold so that corrective action begins before any regulatory minimum is breached.

**SYSTEM BEHAVIOR:** The system maintains a trigger schedule (`capital.pca_threshold`) that maps each NCUA PCA category to both the regulatory floor and the Credit Union's internal early-warning trigger set above that floor. When the computed net worth ratio crosses any internal trigger, the system emits `capital.internal_trigger.breached` and initiates the escalation workflow defined in [CP-08](#cp-08-contingency-actions-and-escalation). When the ratio crosses a regulatory PCA threshold, the system additionally emits `capital.pca_threshold.breached` and records the mandatory PCA classification in `capital.pca_category`. Internal trigger levels are approved by the Board and stored in `capital.targets`; they are write-restricted to the CCO. The PCA classification record is write-restricted to the CFO with CCO attestation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly ratio computed and compared to internal trigger schedule (`capital.internal_trigger.breached`) | Computed net worth ratio (`capital.ratio_record_id`), internal trigger schedule (`capital.pca_threshold`), breached trigger label (`capital.breached_trigger`) | Internal trigger breach event logged; escalation workflow initiated (`capital.internal_trigger.breached`) | Same business day as ratio computation |
| Quarterly ratio computed and compared to regulatory PCA thresholds (`capital.pca_threshold.breached`) | Computed net worth ratio (`capital.ratio_record_id`), regulatory PCA schedule (`capital.regulatory_minima`), PCA category (`capital.pca_category`) | PCA classification recorded; mandatory PCA actions noted (`capital.pca_mandatory_actions`) + event logged (`capital.pca_classification.recorded`) | Same business day as ratio computation |
| PCA classification recorded and mandatory actions identified (`capital.pca_response.recorded`) | PCA category (`capital.pca_category`), mandatory action list (`capital.pca_mandatory_actions`), CCO sign-off (`capital.icaap_cco_signoff`) | PCA response plan logged (`capital.pca_response.recorded`) | Within 2 business days of classification |

**ALERTS/METRICS:** Alert fires immediately on `capital.internal_trigger.breached` or `capital.pca_threshold.breached`; target is zero unacknowledged breach events older than one business day. Monitoring dashboard tracks ratio distance to each internal trigger in basis points.

---

## CP-04 — Capital Conservation Buffer {#cp-04-capital-conservation-buffer}

**WHY (Reg cite):** The Credit Union adopts the Basel III standardized approach 2.5% capital conservation buffer as an internal standard above the well-capitalized minimum. When the buffer is eroded, distributions are restricted consistent with the Basel III framework's maximum distributable amount (MDA) concept, applied here as an internal governance constraint rather than a direct regulatory mandate on credit unions.

**SYSTEM BEHAVIOR:** The system computes the buffer as the net worth ratio minus the 7% well-capitalized floor; the buffer requirement is 2.5%, meaning the internal target net worth ratio is effectively 9.5% when the full buffer is maintained. When the computed ratio falls below 9.5%, `capital.buffer_eroded` is set and `capital.distribution_restriction` is applied, restricting dividends and other capital payouts to the maximum payout ratio defined in `capital.max_payout_ratio`. The buffer status is recorded in `capital.buffer_status` each quarter. Distribution restrictions are lifted automatically when the ratio returns above 9.5%. The `capital.buffer_status` and `capital.distribution_restriction` fields are write-restricted to the CFO with CCO attestation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly ratio computed and buffer assessed (`capital.buffer_status.recorded`) | Computed net worth ratio (`capital.ratio_record_id`), buffer requirement (`capital.buffer_requirement`), buffer shortfall if any (`capital.buffer_shortfall`) | Buffer status record logged (`capital.buffer_status.recorded`); if eroded, `capital.buffer.breached` emitted | Same day as ratio computation |
| Buffer eroded and distribution restriction applied (`capital.distribution_restriction.applied`) | Buffer shortfall amount (`capital.buffer_shortfall`), eligible retained income (`capital.eligible_retained_income`), maximum payout ratio (`capital.max_payout_ratio`) | Distribution restriction applied and logged (`capital.distribution_restriction.applied`); payout restriction schedule set (`capital.payout_restriction_schedule`) | Same business day as buffer breach (enforced by `capital.payout_restriction_due_at`) |
| Distribution restriction lifted when buffer restored (`capital.restricted_distribution.decided`) | Restored net worth ratio (`capital.ratio_record_id`), buffer status (`capital.buffer_status`) | Restriction lifted and logged (`capital.restricted_distribution.decided`) | Same business day as restoration confirmed |

**ALERTS/METRICS:** Alert fires on `capital.buffer.breached`; target is zero unacknowledged buffer breach events. Secondary alert fires if any dividend or capital payout is proposed while `capital.distribution_restriction` is active without an approved exception.

---

## CP-05 — Capital Planning {#cp-05-capital-planning}

**WHY (Reg cite):** [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) requires credit unions to maintain adequate capital on a forward-looking basis. Sound capital planning practice, consistent with NCUA supervisory expectations, requires the CFO to prepare multi-year capital projections incorporating asset growth, earnings trends, dividends, asset quality, economic conditions, and regulatory requirements, and to present them to the ALM Committee and/or Board at least quarterly.

**SYSTEM BEHAVIOR:** The CFO prepares a capital plan at least quarterly. The plan incorporates anticipated asset growth, earnings trends, anticipated dividends, asset and liability diversification, asset quality, general economic conditions, industry comparisons, strategic planning assumptions, and regulatory requirements. The plan includes a comparative review assessing current capital adequacy against regulatory guidelines and internal targets. The plan is stored in `capital.plan_id` and presented to the ALM Committee and/or Board. Prior plan versions are retained in `capital.prior_plan_id` for trend comparison. The capital plan is write-restricted to the CFO; Board presentation is logged by the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and capital plan cycle opens (`capital.plan.updated`) | Budget assumptions (`capital.budget_assumptions`), prior plan (`capital.prior_plan_id`), pro-forma ratios (`capital.proforma_ratios`), asset growth projections (`gl.loan_growth_yoy`), earnings trends (`capital.retained_earnings`) | Updated capital plan (`capital.plan_id`) + event logged (`capital.plan.updated`) | Within 30 calendar days of quarter-end (enforced by `capital.plan_due_at`) |
| Capital plan presented to ALM Committee and/or Board (`capital.plan.presented`) | Capital plan (`capital.plan_id`), pro-forma ratios (`capital.proforma_ratios`), regulatory minimum comparison (`capital.regulatory_minima`), internal target comparison (`capital.targets`) | Presentation logged (`capital.plan.presented`); Board/ALM minutes reference recorded | Within 30 calendar days of quarter-end |
| Board or ALM Committee reviews and approves plan (`capital.plan.reviewed`) | Capital plan (`capital.plan_id`), Board resolution or ALM minutes reference (`capital.board_resolution_id`) | Review outcome logged (`capital.plan.reviewed`) | Same meeting at which plan is presented |

**ALERTS/METRICS:** Alert fires if `capital.plan_due_at` passes without `capital.plan.updated` being emitted. Alert fires if the plan has not been presented to the ALM Committee or Board within 30 days of quarter-end.

---

## CP-06 — Capital Stress Testing {#cp-06-capital-stress-testing}

**WHY (Reg cite):** [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and NCUA supervisory guidance require credit unions to assess capital adequacy under adverse conditions. The Credit Union prepares quarterly stress scenarios (base, adverse, and severely adverse) consistent with sound capital management practice and presents results to the ALM Committee and/or Board.

**SYSTEM BEHAVIOR:** The CFO prepares a quarterly capital stress report covering at least three scenarios: base (budget assumptions), adverse (moderate economic deterioration), and severely adverse (severe economic stress). Scenario assumptions are documented in `capital.stress_assumptions` and versioned. The stress report is stored in `capital.stress_report_id` and presented to the ALM Committee and/or Board. If any scenario projects the net worth ratio falling below the internal target or the well-capitalized threshold, the failing scenario is flagged in `capital.failing_scenario` and the contingency workflow in [CP-08](#cp-08-contingency-actions-and-escalation) is initiated. The stress report is write-restricted to the CFO; scenario assumptions are reviewed and attested by the CCO before presentation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and stress cycle opens (`capital.stress_report.issued`) | Stress scenario assumptions (`capital.stress_assumptions`), current ratio (`capital.ratio_record_id`), pro-forma ratios under each scenario (`capital.proforma_ratios`), internal targets (`capital.targets`) | Stress report (`capital.stress_report_id`) + event logged (`capital.stress_report.issued`) | Within 30 calendar days of quarter-end (enforced by `capital.stress_report_due_at`) |
| Stress report presented to ALM Committee and/or Board (`capital.stress_report.presented`) | Stress report (`capital.stress_report_id`), failing scenario flag if applicable (`capital.failing_scenario`), projected shortfall if applicable (`capital.projected_shortfall`) | Presentation logged (`capital.stress_report.presented`); if failing scenario present, contingency workflow triggered | Within 30 calendar days of quarter-end |
| Stress report reviewed and conclusions recorded (`capital.stress_report.reviewed`) | Stress report (`capital.stress_report_id`), Board/ALM resolution or minutes reference (`capital.board_resolution_id`) | Review outcome logged (`capital.stress_report.reviewed`) | Same meeting at which report is presented |

**ALERTS/METRICS:** Alert fires if `capital.stress_report_due_at` passes without `capital.stress_report.issued` being emitted. Alert fires if `capital.failing_scenario` is set and no contingency memo has been issued within 5 business days per [CP-08](#cp-08-contingency-actions-and-escalation).

---

## CP-07 — Quarterly Monitoring and Reporting {#cp-07-quarterly-monitoring-and-reporting}

**WHY (Reg cite):** [12 CFR § 702.102](https://www.ecfr.gov/current/title-12/part-702/section-702.102) requires ongoing monitoring of net worth ratios. NCUA supervisory expectations require the CFO to review capital ratios at least quarterly and report them to the ALM Committee, with a management plan required if ratios approach established guidelines.

**SYSTEM BEHAVIOR:** The CFO reviews capital ratios at least quarterly and prepares a monitoring report that includes current ratios, comparison to internal targets and regulatory minimums, trend analysis, and a summary of any buffer or trigger breaches. The report is presented to the ALM Committee. If ratios approach the internal target (defined as within 50 basis points of any internal trigger), management develops a plan to maintain ratios above acceptable levels; this plan is documented in `capital.recovery_plan_draft` and escalated per [CP-08](#cp-08-contingency-actions-and-escalation). The quarterly report is stored in `capital.quarterly_report_id` and is write-restricted to the CFO; the CCO attests the report before ALM Committee presentation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and monitoring cycle opens (`capital.quarterly_report.issued`) | Current net worth ratio (`capital.ratio_record_id`), prior quarter ratios (`capital.prior_ratios`), internal targets (`capital.targets`), PCA category (`capital.pca_category`), buffer status (`capital.buffer_status`) | Quarterly monitoring report (`capital.quarterly_report_id`) + event logged (`capital.quarterly_report.issued`) | Within 30 calendar days of quarter-end (enforced by `capital.quarterly_report_due_at`) |
| Quarterly report presented to ALM Committee (`capital.quarterly_report.reviewed`) | Quarterly report (`capital.quarterly_report_id`), ratio-below-target flag (`capital.ratio_below_target`), recovery plan draft if applicable (`capital.recovery_plan_draft`) | ALM Committee review logged (`capital.quarterly_report.reviewed`); if ratio approaching trigger, recovery plan initiated | Within 30 calendar days of quarter-end |

**ALERTS/METRICS:** Alert fires if `capital.quarterly_report_due_at` passes without `capital.quarterly_report.issued` being emitted. Alert fires if `capital.ratio_below_target` is set and no recovery plan has been documented within 5 business days.

---

## CP-08 — Contingency Actions and Escalation {#cp-08-contingency-actions-and-escalation}

**WHY (Reg cite):** [12 CFR § 702.111](https://www.ecfr.gov/current/title-12/part-702/section-702.111) and related PCA provisions require credit unions to take corrective action when capital falls below required levels. The Credit Union's internal escalation framework requires management action before regulatory thresholds are breached, with a two-tier response: Tier 1 when projections indicate the net worth ratio may fall below the internal target, and Tier 2 when projections indicate the ratio may fall below the well-capitalized threshold of 7%.

**SYSTEM BEHAVIOR:** When the quarterly capital plan or stress report projects the net worth ratio falling below the internal target, management considers Tier 1 actions: slowing loan growth, selling loans or securities, reducing operating expenses, and soliciting additional capital. When projections indicate the ratio may fall below the well-capitalized threshold, management additionally considers Tier 2 actions: selling other assets, mergers/acquisitions, subordinated debt issuance (qualifying under [12 CFR Part 702 Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D)), and structuring real estate loans for secondary-market sale to provide liquidity or reduce assets. All contingency actions are documented in `capital.contingency_action_id`. Tier 1 triggers a contingency memo (`capital.contingency_memo.issued`) within 5 business days; Tier 2 triggers a Board escalation (`capital.board_escalation.issued`) within 2 business days. The contingency action record is write-restricted to the CFO; Board escalation requires CCO co-signature.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Projection indicates ratio may fall below internal target (`capital.contingency_memo.issued`) | Projection below target flag (`capital.projection_below_target`), projected shortfall (`capital.projected_shortfall`), Tier 1 action analysis (`capital.action_analysis_id`), action type selected (`capital.action_type`) | Contingency memo issued and logged (`capital.contingency_memo.issued`); contingency action record created (`capital.contingency_action_id`) | Within 5 business days of trigger (enforced by `capital.contingency_memo_due_at`) |
| Projection indicates ratio may fall below well-capitalized threshold (`capital.board_escalation.issued`) | Projection below well-capitalized flag (`capital.projection_below_well_capitalized`), projected shortfall (`capital.projected_shortfall`), Tier 2 action analysis (`capital.action_analysis_id`), action type selected (`capital.action_type`), subordinated debt terms if applicable (`capital.subordinated_debt`) | Board escalation issued and logged (`capital.board_escalation.issued`); Board resolution required | Within 2 business days of trigger (enforced by `capital.contingency_due_at`) |
| Contingency action executed (`capital.contingency_action.executed`) | Contingency action record (`capital.contingency_action_id`), action amount (`capital.action_amount`), expected capital impact (`capital.expected_capital_impact`) | Action execution logged (`capital.contingency_action.executed`); post-action ratio recomputed | Within timeline specified in contingency memo or Board resolution |

**ALERTS/METRICS:** Alert fires if `capital.contingency_memo_due_at` or `capital.contingency_due_at` passes without the corresponding event being emitted. Alert fires if a Board escalation has been issued but no Board resolution is recorded within 5 business days.

---

## CP-09 — Capital Actions Governance {#cp-09-capital-actions-governance}

**WHY (Reg cite):** [12 CFR Part 702 Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D) governs subordinated debt issuance by federally insured credit unions, including eligibility, terms, and NCUA pre-approval requirements. Dividend declarations and capital redemptions are governed by applicable credit union law and the Credit Union's bylaws. All capital actions must be consistent with the capital conservation buffer restrictions in [CP-04](#cp-04-capital-conservation-buffer).

**SYSTEM BEHAVIOR:** All proposed capital actions — dividend declarations, subordinated debt issuances, and capital redemptions — must be reviewed for compliance with the distribution restriction in [CP-04](#cp-04-capital-conservation-buffer) before execution. Subordinated debt issuances qualifying under [12 CFR Part 702 Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D) require NCUA pre-approval; the pre-approval status is tracked in `capital.regulatory_preapproval_status` and the approval ID in `capital.regulatory_preapproval_id`. Dividend limits are computed based on eligible retained income (`capital.eligible_retained_income`) and the maximum payout ratio (`capital.max_payout_ratio`). All capital actions require Board approval documented in `capital.board_resolution_id`. The `capital.action.proposed` event initiates the governance workflow; execution is blocked until all approvals are recorded. Capital action records are write-restricted to the CFO; regulatory pre-approval tracking is write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Capital action proposed (dividend, subordinated debt, or redemption) (`capital.action.proposed`) | Proposed action type (`capital.action_type`), proposed amount (`capital.proposed_distribution_amount`), instrument terms if applicable (`capital.instrument_terms`), distribution restriction status (`capital.distribution_restriction`), eligible retained income (`capital.eligible_retained_income`) | Capital action proposal logged (`capital.action.proposed`); distribution restriction check performed | Before any execution step |
| NCUA pre-approval requested for subordinated debt (`capital.action_board.decided`) | Instrument terms (`capital.instrument_terms`), subordinated debt details (`capital.subordinated_debt`), regulatory pre-approval status (`capital.regulatory_preapproval_status`) | Pre-approval request logged; pre-approval ID recorded when received (`capital.regulatory_preapproval_id`) | Per NCUA application timeline under 12 CFR Part 702 Subpart D |
| Board approves capital action (`capital.action_board.decided`) | Capital action proposal (`capital.action_analysis_id`), Board resolution (`capital.board_resolution_id`), regulatory pre-approval if required (`capital.regulatory_preapproval_id`) | Board approval logged (`capital.action_board.decided`) | Before execution |
| Capital action executed (`capital.action.executed`) | Board approval (`capital.board_resolution_id`), action amount (`capital.action_amount`), instrument terms if applicable (`capital.instrument_terms`) | Execution logged (`capital.action.executed`); post-action ratio recomputed | Per Board resolution timeline |

**ALERTS/METRICS:** Alert fires if a capital action execution is attempted while `capital.distribution_restriction` is active without a recorded exception. Alert fires if a subordinated debt issuance proceeds without `capital.regulatory_preapproval_id` being set.

---

## CP-10 — Internal Capital Adequacy Assessment (ICAAP) {#cp-10-internal-capital-adequacy-assessment-icaap}

**WHY (Reg cite):** [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and NCUA supervisory guidance require credit unions to assess capital needs on a risk-based basis beyond regulatory minimums. The ICAAP covers concentration risk, interest rate risk, and other material risks not fully captured by the net worth ratio, consistent with sound capital management practice.

**SYSTEM BEHAVIOR:** The CCO, with support from the CFO and ALM Committee, conducts an annual ICAAP covering: (a) concentration risk exposures (`capital.concentration_exposures`); (b) interest rate risk measures (`capital.irr_measures`); (c) identification of other material risks (`icaap.material_risk_identified`); and (d) capital projections under the ICAAP framework (`icaap.capital_projections`). The ICAAP report is stored in `capital.icaap_report_id` and presented to the Board. The CCO signs off on the ICAAP (`capital.icaap_cco_signoff`) before Board presentation. The ICAAP cycle is tracked by `capital.icaap_cycle` and the due date by `capital.icaap_due_at`. The ICAAP report is write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual ICAAP cycle opens (`capital.icaap_cycle.opened`) | Prior ICAAP report (`capital.icaap_report_id`), current risk profile (concentration exposures `capital.concentration_exposures`, IRR measures `capital.irr_measures`), material risk register (`icaap.material_risk_identified`) | ICAAP cycle opened and logged (`capital.icaap_cycle.opened`) | Within 30 calendar days of fiscal year-end |
| ICAAP assessment completed and report issued (`capital.icaap_report.issued`) | ICAAP capital projections (`icaap.capital_projections`), concentration exposures (`capital.concentration_exposures`), IRR measures (`capital.irr_measures`), new risk assessments (`icaap.new_risk_assessment`), CCO sign-off (`capital.icaap_cco_signoff`) | ICAAP report issued and logged (`capital.icaap_report.issued`) | Within 60 calendar days of fiscal year-end (enforced by `capital.icaap_due_at`) |
| ICAAP presented to Board (`capital.icaap.presented`) | ICAAP report (`capital.icaap_report_id`), Board agenda reference (`capital.board_resolution_id`) | Board presentation logged (`capital.icaap.presented`) | Within 60 calendar days of fiscal year-end |
| Board reviews ICAAP and records conclusions (`capital.icaap.reviewed`) | ICAAP report (`capital.icaap_report_id`), Board resolution or minutes reference (`capital.board_resolution_id`) | Board review outcome logged (`capital.icaap.reviewed`) | Same meeting at which ICAAP is presented |

**ALERTS/METRICS:** Alert fires if `capital.icaap_due_at` passes without `capital.icaap_report.issued` being emitted. Alert fires if the ICAAP has been issued but not presented to the Board within 5 business days of issuance.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all capital targets, ICAAP sign-off, regulatory pre-approval tracking, and Board escalations |
| **Chief Financial Officer** | Prepares quarterly capital plan, stress report, monitoring report, and ratio computations; executes approved capital actions |
| **ALM Committee** | Reviews and accepts quarterly capital plan, stress report, and monitoring report; recommends contingency actions |
| **Board of Directors** | Approves capital adequacy targets annually; receives quarterly capital plan and stress report; approves all capital actions and ICAAP |

**Review cadence:** This policy is reviewed annually by the CCO, or immediately upon any material change to NCUA PCA regulations, the Credit Union's risk profile, or a capital ratio breach. The next scheduled review is 2026-07-01.

**Cross-references:**
- Basel II Standardized Approach Framework Policy (RWA methodology)
- Liquidity Policy (contingency funding plans)
- Enterprise Risk Management Policy (enterprise risk taxonomy)
- Investment Policy (investment portfolio composition and limits)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for capital-domain fields.** The `capital.*`, `icaap.*`, and `gl.*` fields and events referenced throughout this document are registered in `core-vocabulary.json` (the `capital` object has 95 fields and the `icaap` object has 4 fields, all confirmed present). All event codes used (e.g., `capital.ratios.verified`, `capital.stress_report.issued`, `capital.icaap_report.issued`) are registered in the Events table. Timer codes (`capital.ratio_calc_due_at`, `capital.plan_due_at`, `capital.stress_report_due_at`, `capital.quarterly_report_due_at`, `capital.contingency_memo_due_at`, `capital.contingency_due_at`, `capital.payout_restriction_due_at`, `capital.icaap_due_at`) are registered in the Tasks & timers table. No new codes were coined; all codes reuse registered vocabulary.

- **California DFPI minimum capital expectations.** AUTHORITY_HINTS references California Financial Code / DFPI minimum capital requirements as potentially exceeding federal minimums. Pynthia Credit Union's charter type (state-chartered vs. federally chartered) and whether DFPI imposes capital requirements above NCUA Part 702 minimums has not been confirmed. If Pynthia is state-chartered and subject to DFPI capital rules, those requirements must be incorporated into CP-01 targets and CP-03 trigger levels. This assumption requires confirmation from legal counsel before the next review.

- **Internal trigger levels above regulatory PCA thresholds (CP-03).** PATRICK_NOTES require internal triggers "above" each regulatory PCA threshold but do not specify the exact basis-point cushion for each tier. This policy establishes the framework and requires Board approval of the specific trigger levels; the approved levels are stored in `capital.targets`. The specific cushion values must be approved by the Board at the next meeting and recorded before this policy is effective.

- **Capital conservation buffer threshold (CP-04).** The 9.5% effective internal target (7% well-capitalized floor + 2.5% buffer) is derived from PATRICK_NOTES' reference to the Basel III standardized approach buffer. Credit unions are not directly subject to Basel III capital conservation buffer rules as a matter of federal regulation; this buffer is adopted as an internal governance standard only. The Board should confirm this standard at the next meeting.

- **50-basis-point "approaching" threshold (CP-07).** PATRICK_NOTES state that management develops a plan "if ratios approach the established guidelines" but do not define "approach." This policy uses 50 basis points as the early-warning threshold. The Board should confirm or adjust this threshold.

- **ICAAP annual cycle timing (CP-10).** PATRICK_NOTES require an ICAAP but do not specify the cycle anchor date. This policy anchors the ICAAP to the fiscal year-end with a 60-day completion deadline. If the Credit Union's fiscal year-end differs from December 31, the `capital.icaap_due_at` timer must be configured accordingly.

- **Subordinated debt NCUA pre-approval timeline (CP-09).** The NCUA pre-approval process under [12 CFR Part 702 Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D) has variable timelines depending on the application. No specific SLA is set in this policy for the pre-approval step; the CFO should initiate the application sufficiently in advance of any planned issuance to accommodate NCUA review.

- **Single approver.** The OWNER & APPROVERS input lists Patrick Wilson as both owner and sole approver. A single-approver governance structure for a capital policy is noted as a gap; best practice requires at least one independent approver (e.g., Board Chair or Audit Committee Chair). This should be remediated before the next Board review.
