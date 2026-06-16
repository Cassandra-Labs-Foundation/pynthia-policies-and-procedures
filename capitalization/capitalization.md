---
title: Capitalization Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Capital, NCUA-PCA, Net-Worth, ICAAP, Stress-Testing]
---

## General Policy Statement

Pynthia Credit Union maintains capital sufficient to support its activities, meet member needs, absorb losses, and sustain the confidence of members, employees, and regulators. The credit union sets internal net-worth targets above NCUA Prompt Corrective Action (PCA) minimums, holds a Basel III-style conservation buffer, plans and stress-tests capital quarterly, and escalates promptly when ratios approach thresholds. This policy governs all capital-impacting decisions across the balance sheet. Risk-weight methodology (Basel II Standardized Framework Policy), liquidity and contingency funding (Liquidity Policy), enterprise risk taxonomy (ERM Policy), and investment composition (Investment Policy) are governed elsewhere and out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly capital ratio computation | Quarter closes (`ledger.quarter_closed`) | Quarterly | Net worth ratio + PCA category | [CAP-02](#cap-02-capital-components-and-measurement) |
| PCA / internal trigger breach | Computed ratio crosses a trigger (`capital.internal_trigger_breached`) | At detection | Escalation memo to ALCO/Board | [CAP-03](#cap-03-pca-thresholds-and-internal-triggers) |
| Conservation buffer eroded | Buffer assessment falls below 2.5% (`capital.buffer_breached`) | At detection | Distribution restriction | [CAP-04](#cap-04-capital-conservation-buffer) |
| Quarterly capital plan | Quarter closes (`capital.plan_due_at`) | Quarterly | Multi-year capital projection | [CAP-05](#cap-05-capital-planning) |
| Quarterly stress test | Quarter closes (`capital.stress_report_due_at`) | Quarterly | Base/adverse/severely-adverse report | [CAP-06](#cap-06-capital-stress-testing) |
| Quarterly monitoring report | Ratios computed (`capital.quarterly_report_due_at`) | Quarterly | Ratio report to ALCO | [CAP-07](#cap-07-quarterly-monitoring-and-reporting) |
| Projected target/well-cap breach | Projection flags shortfall (`capital.target_breached`) | Quarterly | Contingency action plan | [CAP-08](#cap-08-contingency-actions-and-escalation) |
| Dividend / capital raise / redemption | Capital action proposed (`capital.action_proposed`) | Before execution | Action analysis + pre-approval | [CAP-09](#cap-09-capital-actions-governance) |
| Annual ICAAP | ICAAP cycle opens (`capital.icaap_due_at`) | Annually | Risk-based capital assessment | [CAP-10](#cap-10-internal-capital-adequacy-assessment-icaap) |

## CAP-01 — Capital Adequacy Targets {#cap-01-capital-adequacy-targets}

- **WHY (Reg cite):** NCUA PCA requires a net worth ratio ≥ 7% to be classified well-capitalized for federally insured credit unions ([12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702)). The internal target is set at or above that threshold so the credit union holds a margin over the regulatory minimum.

- **SYSTEM BEHAVIOR:** The Board approves internal net-worth targets (≥ 7% net worth ratio) that meet or exceed all standards required to be well-capitalized under PCA, recorded against the capital target fields. Each quarter the computed net worth ratio is compared to the approved internal target; a shortfall raises a target-breach signal that feeds escalation under [CAP-08](#cap-08-contingency-actions-and-escalation). Target values (`capital.target_tier1_leverage`, `capital.target_total_rbc`, equivalents for the net-worth target) are write-restricted to Compliance and the Board.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board approves or revises internal capital targets (`capital.targets_approved`) | Proposed internal targets (`capital.target_tier1_leverage`, `capital.target_total_rbc`), regulatory minima (`capital.regulatory_minima`), board resolution (`capital.board_resolution_id`) | Approved target record + board resolution (`capital.targets_approved`) | Annually with policy review (internal: at each Board cycle) |
  | Quarterly net worth ratio computed below internal target (`capital.target_breached`) | Computed net worth ratio (`capital.ratio_tier1_leverage`), internal target (`capital.target_tier1_leverage`), below-target flag (`capital.ratio_below_target`) | Target-breach notification to ALCO/Board (`capital.target_breach_notified`) | At detection (internal: same business day) |

- **ALERTS/METRICS:** Alert when the net worth ratio is within 50 bps of the internal target; target a zero count of quarters closing below target.

## CAP-02 — Capital Components and Measurement {#cap-02-capital-components-and-measurement}

- **WHY (Reg cite):** Net worth and the net worth ratio are defined by NCUA at [12 CFR §702.2](https://www.ecfr.gov/current/title-12/part-702#p-702.2) — retained and undivided earnings plus other amounts includible under Part 702, divided by the average of total assets per the most recent call report.

- **SYSTEM BEHAVIOR:** Each quarter the system classifies capital components (retained earnings, undivided earnings, general reserves, other includible amounts) and computes the net worth ratio using net worth over average total assets sourced from the general ledger. Component classification is recorded and the ratio computation is timestamped. Classification approval and the component fields (`capital.retained_earnings`, `capital.undivided_earnings`, `capital.general_reserves`) are write-restricted to Finance and Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter closes and ledger is final (`ledger.quarter_closed`) | Retained earnings (`capital.retained_earnings`), undivided earnings (`capital.undivided_earnings`), general reserves (`capital.general_reserves`), total assets (`gl.total_assets`) | Classified capital components record (`capital.components_classified`) | Quarterly (internal: 10 BD after quarter close; enforced by `capital.ratio_computation_due_at`) |
  | Components classified and ratio computed (`capital.ratios_verified`) | Net worth total (`capital.tier1_total`), average total assets (`gl.total_assets`), ratio record (`capital.ratio_record_id`) | Verified net worth ratio record (`capital.ratios_verified`) | Quarterly (internal: 10 BD after quarter close; enforced by `capital.ratio_calc_due_at`) |

- **ALERTS/METRICS:** Alert when ratio computation is not verified within the SLA after quarter close; track variance between successive quarters' net worth ratio.

## CAP-03 — PCA Thresholds and Internal Triggers {#cap-03-pca-thresholds-and-internal-triggers}

- **WHY (Reg cite):** NCUA PCA defines five net-worth classifications — well-capitalized (≥ 7%), adequately capitalized (≥ 6%), undercapitalized (< 6%), significantly undercapitalized (< 4%), critically undercapitalized (< 2%) ([12 CFR §702.102](https://www.ecfr.gov/current/title-12/part-702#p-702.102)). Internal triggers are set above the regulatory thresholds so corrective action begins before a regulatory minimum is breached.

- **SYSTEM BEHAVIOR:** A trigger schedule mapping internal trigger levels above each PCA threshold is maintained against the capital trigger fields. Each quarter the computed net worth ratio is evaluated against both the PCA categories and the internal triggers; the PCA category is recorded, and a breach of an internal trigger (set above the regulatory line) escalates to ALCO/Board ahead of any regulatory breach. A PCA-threshold breach additionally records mandatory PCA actions. The trigger schedule (`capital.trigger_schedule`) is write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly ratio crosses an internal trigger above a PCA line (`capital.internal_trigger_breached`) | Computed ratio (`capital.ratio_tier1_leverage`), trigger schedule (`capital.trigger_schedule`), breached trigger (`capital.breached_trigger`) | Trigger escalation to ALCO/Board (`capital.trigger_escalation_issued`) | At detection (internal: same business day) |
  | Quarterly ratio crosses a regulatory PCA threshold (`capital.pca_threshold_breached`) | Computed ratio (`capital.ratio_tier1_leverage`), PCA category (`capital.pca_category`), mandatory actions (`capital.pca_mandatory_actions`) | Recorded PCA classification + mandatory-action set (`capital.pca_classification_recorded`) | At detection (internal: same business day; NCUA notification per [CAP-08](#cap-08-contingency-actions-and-escalation)) |

- **ALERTS/METRICS:** Alert when the ratio enters the buffer zone between an internal trigger and the corresponding PCA line; target zero quarters where a PCA threshold is breached without a preceding internal-trigger escalation.

## CAP-04 — Capital Conservation Buffer {#cap-04-capital-conservation-buffer}

- **WHY (Reg cite):** The credit union adopts a 2.5% capital conservation buffer above minimum ratios consistent with the Basel III standardized approach as an internal standard, restricting distributions when the buffer is eroded. This control implements the buffer; risk-weight methodology remains in the Basel II Standardized Approach Framework Policy.

- **SYSTEM BEHAVIOR:** Each quarter the system assesses whether the buffer above minimum ratios is at or above 2.5%. If the buffer is eroded, distributions are restricted: a maximum payout ratio is computed from eligible retained income and a distribution restriction is applied that blocks dividends, buybacks, and discretionary payouts until the buffer is restored. The buffer requirement (`capital.buffer_requirement`) and payout-restriction state (`capital.payout_restricted`) are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly buffer assessment falls below 2.5% (`capital.buffer_breached`) | Buffer requirement (`capital.buffer_requirement`), buffer shortfall (`capital.buffer_shortfall`), eligible retained income (`capital.eligible_retained_income`) | Buffer-status record + max payout ratio (`capital.buffer_status_recorded`) | At detection (internal: same business day) |
  | Buffer erosion confirmed and a distribution is pending (`capital.restricted_distribution_decided`) | Max payout ratio (`capital.max_payout_ratio`), proposed distribution amount (`capital.proposed_distribution_amount`), payout-restricted flag (`capital.payout_restricted`) | Distribution-restriction applied (`capital.distribution_restriction_applied`) | Before distribution executes (enforced by `capital.payout_restriction_due_at`) |

- **ALERTS/METRICS:** Alert when the buffer falls below 50 bps of the 2.5% requirement; target zero distributions executed while a payout restriction is active.

## CAP-05 — Capital Planning {#cap-05-capital-planning}

- **WHY (Reg cite):** Disciplined forward-looking capital planning supports the well-capitalized posture required under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) by projecting whether earnings will sustain ratios above minimums and internal targets across growth and stress.

- **SYSTEM BEHAVIOR:** At least quarterly the CFO prepares multi-year capital projections incorporating anticipated asset growth, earnings trends, dividends, asset quality, economic conditions, and regulatory requirements, and presents them to the ALM Committee and/or Board. The plan is recorded with its budget assumptions and pro-forma ratios; a projection indicating ratios below target feeds [CAP-08](#cap-08-contingency-actions-and-escalation). Plan authorship and budget assumptions (`capital.budget_assumptions`, `capital.proforma_ratios`) are write-restricted to Finance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly planning cycle due (`capital.plan_updated`) | Budget assumptions (`capital.budget_assumptions`), prior ratios (`capital.prior_ratios`), pro-forma ratios (`capital.proforma_ratios`), prior plan (`capital.prior_plan_id`) | Updated multi-year capital plan (`capital.plan_updated`) | Quarterly (enforced by `capital.plan_due_at`) |
  | Plan presented to ALCO/Board (`capital.plan_presented`) | Plan id (`capital.plan_id`), projected shortfall if any (`capital.projected_shortfall`), below-target flag (`capital.projection_below_target`) | Plan presentation + ALCO/Board review record (`capital.plan_reviewed`) | Quarterly (internal: next scheduled ALCO/Board meeting) |

- **ALERTS/METRICS:** Alert when a quarterly plan is not produced by its due date; track the number of projection periods showing a below-target net worth ratio.

## CAP-06 — Capital Stress Testing {#cap-06-capital-stress-testing}

- **WHY (Reg cite):** Stress testing capital under base, adverse, and severely adverse scenarios demonstrates loss-absorbing capacity above PCA minimums ([12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702)) and informs the conservation buffer and contingency actions.

- **SYSTEM BEHAVIOR:** Each quarter the CFO prepares a capital projection and stress-scenario report covering base, adverse, and severely adverse scenarios and presents it to the ALM Committee and/or Board. Stress assumptions are versioned and the report is recorded; any scenario in which a minimum is breached is captured as a failing scenario and routed to contingency escalation under [CAP-08](#cap-08-contingency-actions-and-escalation). Stress assumptions (`capital.stress_assumptions`) are write-restricted to Finance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly stress cycle opens (`capital.stress_report_issued`) | Stress assumptions (`capital.stress_assumptions`), pro-forma ratios per scenario (`capital.proforma_ratios`), failing scenario flag (`capital.failing_scenario`) | Stress-scenario report (base/adverse/severe) (`capital.stress_report_issued`) | Quarterly (enforced by `capital.stress_report_due_at`) |
  | Stress report presented to ALCO/Board (`capital.stress_report_presented`) | Stress report id (`capital.stress_report_id`), failing scenario (`capital.failing_scenario`), projected shortfall (`capital.projected_shortfall`) | Stress report review record (`capital.stress_report_reviewed`) | Quarterly (internal: next scheduled ALCO/Board meeting) |

- **ALERTS/METRICS:** Alert when the quarterly stress report is overdue; target zero quarters with a severely-adverse scenario breaching a PCA minimum without a contingency plan opened.

## CAP-07 — Quarterly Monitoring and Reporting {#cap-07-quarterly-monitoring-and-reporting}

- **WHY (Reg cite):** Regular monitoring of capital ratios and reporting to governance underpins the ongoing well-capitalized determination under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and triggers maintenance plans before guidelines are breached.

- **SYSTEM BEHAVIOR:** At least quarterly the CFO reviews capital ratios and reports them to the ALM Committee; if ratios approach established guidelines, management develops a plan to keep ratios above acceptable levels, which links to [CAP-08](#cap-08-contingency-actions-and-escalation). The quarterly report is recorded and reviewed. The quarterly report content (`capital.quarterly_report_id`) is write-restricted to Finance and Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly ratios computed and report due (`capital.quarterly_report_issued`) | Net worth ratio (`capital.ratio_tier1_leverage`), PCA category (`capital.pca_category`), prior ratios (`capital.prior_ratios`) | Quarterly capital ratio report (`capital.quarterly_report_issued`) | Quarterly (enforced by `capital.quarterly_report_due_at`) |
  | Report reviewed by ALM Committee (`capital.quarterly_report_reviewed`) | Quarterly report id (`capital.quarterly_report_id`), ratio-below-target flag (`capital.ratio_below_target`), ALCO review log (`alco.meeting_convened`) | ALCO ratio-review record (`alco.ratio_review_logged`) | Quarterly (internal: next scheduled ALCO meeting) |

- **ALERTS/METRICS:** Alert when a quarterly ratio report is not issued by its due date or not reviewed at the next ALCO meeting; track count of quarters where ratios approached guidelines and a maintenance plan was required.

## CAP-08 — Contingency Actions and Escalation {#cap-08-contingency-actions-and-escalation}

- **WHY (Reg cite):** When projections show the net worth ratio may fall below internal target or the well-capitalized line, prompt corrective measures and regulator notification are required to preserve capital under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702), including the PCA categories at [§702.102](https://www.ecfr.gov/current/title-12/part-702#p-702.102).

- **SYSTEM BEHAVIOR:** If a projection indicates the net worth ratio may fall below the internal target, management considers slowing loan growth, selling loans or securities, reducing operating expenses, and soliciting additional capital. If it may fall below the well-capitalized threshold, management additionally considers selling other assets, mergers/acquisitions, and subordinated debt issuance, and structures real estate loans for secondary-market sale to provide liquidity or reduce assets. A contingency memo is issued to ALCO/Board, contingency actions are executed and recorded, and an NCUA notification is generated where a PCA threshold condition is met. The contingency action record (`capital.contingency_action_id`) and NCUA notification are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Projection indicates ratio may fall below internal target or well-capitalized line (`capital.target_breached`) | Projected shortfall (`capital.projected_shortfall`), below-target flag (`capital.projection_below_target`), below-well-capitalized flag (`capital.projection_below_well_capitalized`) | Contingency memo to ALCO/Board (`capital.contingency_memo_issued`) | At detection (enforced by `capital.contingency_memo_due_at`) |
  | Contingency actions selected and executed (`capital.contingency_action_executed`) | Contingency action id (`capital.contingency_action_id`), action type (`capital.action_type`), remediation plan (`capital.recovery_plan_draft`) | Executed contingency action + remediation plan record (`capital.contingency_action_executed`) | Per plan (enforced by `capital.contingency_due_at`; remediation plan by `capital.remediation_plan_due_at`) |
  | PCA threshold condition met requiring regulator notice (`capital.board_escalation_issued`) | NCUA trigger condition (`ncua.trigger_condition`), metrics snapshot (`ncua.metrics_snapshot`), notification-required flag (`ncua.notification_required`) | NCUA notification sent + board escalation (`ncua.notification_sent`) | At detection (enforced by `ncua.notification_due_at`) |

- **ALERTS/METRICS:** Alert on any open contingency memo past its due date and on NCUA notifications approaching their deadline; target zero late regulator notifications.

## CAP-09 — Capital Actions Governance {#cap-09-capital-actions-governance}

- **WHY (Reg cite):** Dividends, capital raises, and redemptions must respect earnings-based limits and regulatory pre-approval; subordinated debt must qualify under NCUA's subordinated debt rule at [12 CFR Part 702, Subpart D](https://www.ecfr.gov/current/title-12/part-702/subpart-D).

- **SYSTEM BEHAVIOR:** Each proposed capital action (dividend declaration, subordinated debt issuance, redemption) is analyzed for its capital impact, checked against earnings-based dividend limits, and routed for regulatory pre-approval where required before the Board decides and the action is executed. The action analysis, instrument terms, and regulatory pre-approval status are recorded. Dividend limits (`capital.dividend_limit`) and pre-approval status (`capital.regulatory_preapproval_status`) are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Capital action proposed (`capital.action_proposed`) | Action type (`capital.action_type`), action amount (`capital.action_amount`), instrument terms (`capital.instrument_terms`), dividend limit (`capital.dividend_limit`) | Capital action analysis (`capital.action_proposed`) | Before execution (internal: prior to Board decision) |
  | Action requires regulatory pre-approval (`capital.dividend_proposed`) | Expected capital impact (`capital.expected_capital_impact`), pre-approval id (`capital.regulatory_preapproval_id`), pre-approval status (`capital.regulatory_preapproval_status`) | Pre-approval request + status record (`capital.dividend_proposed`) | Before execution (internal: per regulator turnaround) |
  | Board decides and action executes (`capital.action_executed`) | Board resolution (`capital.board_resolution_id`), action analysis id (`capital.action_analysis_id`), pro-forma ratios (`capital.proforma_ratios`) | Executed capital action + board decision record (`capital.action_executed`) | After approvals obtained (internal: per board resolution) |

- **ALERTS/METRICS:** Alert when a capital action is executed without a recorded analysis or required pre-approval; track count of distributions exceeding the earnings-based dividend limit (target zero).

## CAP-10 — Internal Capital Adequacy Assessment (ICAAP) {#cap-10-internal-capital-adequacy-assessment-icaap}

- **WHY (Reg cite):** A risk-based assessment of capital needs beyond regulatory minimums — covering concentration, interest rate, and other material risks — supplements the PCA net-worth floor under [12 CFR Part 702](https://www.ecfr.gov/current/title-12/part-702) and supports the buffer and contingency framework.

- **SYSTEM BEHAVIOR:** At least annually the credit union performs an ICAAP that identifies material risks (concentration, interest rate, and other), measures capital needs beyond regulatory minimums, and presents the result to ALCO/Board. The ICAAP report is recorded with its capital projections and IRR measures; newly identified material risks feed planning under [CAP-05](#cap-05-capital-planning) and the buffer under [CAP-04](#cap-04-capital-conservation-buffer). The ICAAP report id (`capital.icaap_report_id`) and CCO sign-off (`capital.icaap_cco_signoff`) are write-restricted to Compliance.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual ICAAP cycle opens (`capital.icaap_cycle_opened`) | Capital projections (`icaap.capital_projections`), IRR measures (`icaap.irr_measures`), material-risk flag (`icaap.material_risk_identified`) | ICAAP cycle opened record (`capital.icaap_cycle_opened`) | Annually (enforced by `capital.icaap_due_at`) |
  | ICAAP completed and report issued (`capital.icaap_report_issued`) | Concentration exposures (`capital.concentration_exposures`), IRR measures (`capital.irr_measures`), new risk assessment (`icaap.new_risk_assessment`), CCO sign-off (`capital.icaap_cco_signoff`) | ICAAP report (`capital.icaap_report_issued`) | Annually (enforced by `capital.icaap_due_at`) |
  | ICAAP presented to ALCO/Board (`capital.icaap_presented`) | ICAAP report id (`capital.icaap_report_id`), proposed buffer level (`capital.proposed_ccyb_level`) | ICAAP presentation + review record (`capital.icaap_reviewed`) | Annually (internal: next scheduled ALCO/Board meeting) |

- **ALERTS/METRICS:** Alert when the annual ICAAP is overdue or lacks CCO sign-off; track the count of newly identified material risks not yet reflected in the capital plan.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Centralized governance of all controls rests with the CCO.
- **Required participants:** Chief Financial Officer (prepares ratios, plans, stress tests, ICAAP), ALM Committee (quarterly review and escalation forum), and Board of Directors (target approval, capital action decisions, contingency authorization).
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Reviewed at least annually (next review {{2027-06-16}}) and upon any material change to NCUA PCA rules, the Basel III buffer standard, or DFPI minimum-capital expectations.
- **Cross-references:** Risk-weight methodology — Basel II Standardized Approach Framework Policy; liquidity and contingency funding — Liquidity Policy; enterprise risk taxonomy — ERM Policy; investment composition and limits — Investment Policy. Quarter-close timing for all monitoring controls is anchored to `ledger.quarter_closed`.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Most capital-domain fields, events, and timers referenced above (e.g., `capital.*` fields, `capital.*` events, `ncua.notification_due_at`, `icaap.*`, `alco.*`, `gl.total_assets`, `ledger.quarter_closed`) appear in the parsed `core-vocabulary.json` and are used as registered; any that engineering has not yet wired to running endpoints are flagged here collectively and will be confirmed before the next review.
- **Net-worth target field.** Patrick's notes set the internal target as a net worth ratio ≥ 7%, but the registered capital target fields are named for a bank framework (`capital.target_tier1_leverage`, `capital.target_total_rbc`). The assumption is that the net-worth target is stored in the existing leverage-target field pending a credit-union-specific net-worth target field; engineering to confirm naming.
- **PCA category vs. five-tier mapping.** The five PCA categories (well/adequately/under/significantly-under/critically-under) are assumed to map onto the single `capital.pca_category` field as enumerated values; the exact enumeration is to be confirmed by engineering.
- **Conservation buffer as internal standard.** The 2.5% buffer is adopted as an internal Basel III-style standard, not a credit-union regulatory mandate. Assumption: distribution restrictions on buffer erosion are policy-driven and enforced via `capital.payout_restricted`; legal/regulatory necessity for credit unions to confirm.
- **DFPI / state minimums.** AUTHORITY_HINTS cite California Financial Code / DFPI minimum-capital expectations that may exceed federal minimums. Charter type (state vs. federal) and DFPI applicability are not specified in PATRICK_NOTES; the assumption is federal NCUA PCA governs the controls, and any DFPI overlay (a higher minimum) would raise the internal target — to be confirmed with the Board and counsel.
- **ICAAP frequency.** Patrick's notes describe ICAAP without an explicit cadence; an annual cycle is assumed (enforced by `capital.icaap_due_at`), to be confirmed.
- **Subordinated debt applicability.** Subordinated debt issuance under 12 CFR Part 702 Subpart D is included in CAP-09 on the assumption the credit union may qualify as an issuer; eligibility and any complexity/asset-size gating to be confirmed.
