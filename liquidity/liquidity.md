```yaml
---
title: Liquidity Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Liquidity, CFP, NCUA, ALM, Stress-Testing, BaaS]
---
```

## General Policy Statement

Pynthia Credit Union maintains a risk-based liquidity program that measures, limits, and reports cash-flow mismatch, funding concentration, and survival capacity under normal and stressed conditions, and a written Contingency Funding Plan (CFP) that defines how the credit union detects stress, escalates, and executes funding actions before a stress event becomes a crisis. This policy applies across all funding and balance-sheet activities, including Banking-as-a-Service (BaaS) partner flows, and is designed to satisfy [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12). Investment portfolio credit and valuation controls, capital adequacy, physical cash operations, enterprise risk appetite governance, and business continuity are governed by separate policies; liquidity-relevant characteristics of the investment portfolio (AFS marketability, haircut schedules, pledging restrictions) are governed jointly with the Investment Policy.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Daily LAR compute | EOD GL posted (`lar.computed`) | **16:00 daily** | LAR value, band, breach alert | [LQ-03](#lq-03-liquid-assets-ratio-bands) |
| Daily mismatch compute | EOD GL posted (`mismatch.gap_computed`) | **16:00 daily** | Cumulative gap by bucket | [LQ-02](#lq-02-maturity-mismatch-limits) |
| Intraday mismatch recompute | Large unscheduled flow detected (`liquidity.large_flow.detected`) | **Immediate** | Updated gap schedule | [LQ-02](#lq-02-maturity-mismatch-limits) |
| Daily ops pack | EOD compute complete (`report.daily_pack.published`) | **17:00 daily** | LAR, gaps, concentrations, facility headroom | [LQ-07](#lq-07-reporting-cadence) |
| Weekly ALCO digest | Friday close (`report.weekly_digest.published`) | **Fri 12:00** | Trend deltas, EWI summary | [LQ-07](#lq-07-reporting-cadence) |
| Quarterly Board deck | Quarter close (`report.board_deck.published`) | **+5 BD of quarter end** | Stress results, survival horizon, limit status | [LQ-07](#lq-07-reporting-cadence) |
| Quarterly stress run | Quarter open (`stress.quarter_open`) | **Quarterly** | Idiosyncratic, systemic, combined, intraday, BaaS scenarios | [LQ-05](#lq-05-stress-testing) |
| Ad-hoc stress rerun | Major EWI spike (`ewi.spike.flagged`) | **+5 BD** | Updated survival horizon and action deltas | [LQ-05](#lq-05-stress-testing) |
| Quarterly survival model | Quarter open (`survival.quarterly_due_at`) | **Quarterly** | Survival days under idiosyncratic and combined stress | [LQ-04](#lq-04-survival-horizon--coverage-days) |
| Ad-hoc survival rerun | EWI spike (`ewi.spike.flagged`) | **+2 BD** | Updated survival days | [LQ-04](#lq-04-survival-horizon--coverage-days) |
| Concentration waiver | Limit breach detected (`concentration.limit_exceeded`) | **+2 BD** | Waiver decision and rationale | [LQ-06](#lq-06-funding-concentration--counterparty-limits) |
| CFP Level 2/3 activation | LAR or survival threshold crossed (`cfp.level.changed`) | **Within 2 hours** | Playbook tasks, draw orders, crisis team convened | [LQ-10](#lq-10-cfp-activation--escalation-ladder) |
| NCUA notification | Level 2/3 active, federal facility used, survival <15d combined, or LAR <6% (`ncua.notification_due_at`) | **24 hours** | Event memo, metrics snapshot | [LQ-11](#lq-11-regulatory-notification) |
| External comms | Level 2/3 active (`comms.same_day_due_at`) | **Same day** | Scripted depositor/partner updates | [LQ-12](#lq-12-external-communications--stakeholder-matrix) |
| Regulator request response | Request received (`regulator.response_due_at`) | **1 BD** | Response package | [LQ-13](#lq-13-regulator-liaison-protocols) |
| Annual facility test | Annual test due (`facility.test_due_at`) | **Annual** | CLF/DW no-funds or funded test report | [LQ-09](#lq-09-contingent-federal-liquidity-access) |
| Annual tabletop drill | Drill scheduled (`drill.aar_due_at`) | **Annual; AAR +10 BD** | After-action review with owners and dates | [LQ-14](#lq-14-liquidity-drills--after-action-reviews) |
| Policy/limit annual review | Review due (`policy.review_due_at`) | **Annual; ad-hoc +10 BD after material change** | Updated policy and limit registry | [LQ-01](#lq-01-policy-scope--risk-appetite) |
| Record indexing | Artifact finalized (`record.indexed`) | **+2 BD** | Indexed archive entry | [LQ-15](#lq-15-documentation--retention) |

---

## LQ-01 — Policy Scope & Risk Appetite {#lq-01-policy-scope--risk-appetite}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a board-approved, written liquidity policy that establishes risk tolerance and is reviewed at least annually. A versioned policy and limit registry are the documentary evidence of that approval.

**SYSTEM BEHAVIOR:** A single liquidity standard applies across all balance-sheet and BaaS partner flows in scope. The policy document and limit registry are version-controlled; each version carries an effective date and board-approval reference. The annual review cycle is triggered automatically; a material change (new product, new BaaS partner, significant balance-sheet shift, or regulatory change) triggers an ad-hoc review within 10 business days. Limit changes require CFO proposal and Board approval before taking effect. Policy document is write-restricted to Compliance; limit registry is write-restricted to CFO with Board approval required for changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens or material change flagged (`policy.review_due_at` reached or `policy.material_change.flagged`) | Current policy version (`policy.document_version`), limit registry (`policy.limit_registry`), change rationale if ad-hoc (`policy.change_rationale`) | Updated policy draft + Board approval record (`policy.board.approved`); version published (`policy.revision.published`) | Annual; ad-hoc within 10 BD of material change (enforced by `policy.review_due_at`) |
| Limit change proposed (`policy.limit_change.requested`) | Proposed limit value (`policy.proposed_limit`), CFO rationale (`policy.change_rationale`) | Board-approved limit update (`policy.limit.updated`) | Before effective date of change |

**ALERTS/METRICS:** `alert.policy_review_aging` fires when review is overdue by more than 5 BD. Target: zero overdue reviews at any point in the examination cycle.

---

## LQ-02 — Maturity Mismatch Limits {#lq-02-maturity-mismatch-limits}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires measurement of cash-flow gaps across time horizons as a core component of the liquidity risk management program. Cumulative mismatch limits operationalize the board-approved risk tolerance.

**SYSTEM BEHAVIOR:** The system computes cumulative cash-flow gaps in six time buckets — overnight (O/N), 2–7 days, 8–30 days, 31–90 days, 91–365 days, and >1 year — daily by 16:00 using GL balances and behavioral assumptions from the approved catalogue. Each bucket is compared against its board-approved limit; a breach triggers an immediate alert. When a large unscheduled flow is detected intraday (threshold defined in the limit registry), the gap schedule is recomputed immediately. Intraday recomputes are logged separately from the EOD run. Mismatch model is write-restricted to Treasury Operations; limit parameters are write-restricted to CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`liquidity.eod.posted`) | GL balances (`gl.balances`), behavioral assumptions (`liquidity.behavioral_assumptions`), bucket limits (`mismatch.limit`) | Cumulative gap schedule by bucket (`mismatch.gap_computed`); breach alert if any bucket exceeds limit (`alert.mismatch_breach`) | Daily by 16:00 (enforced by `mismatch.compute_due_at`) |
| Large unscheduled flow detected (`liquidity.large_flow.detected`) | Flow amount and direction (`funding.draw_amount`, `funding.shortfall_estimate`), current gap schedule (`mismatch.current_gaps`) | Intraday gap recompute (`mismatch.intraday_recomputed`); breach alert if applicable (`alert.mismatch_breach`) | Immediate |
| Mismatch limit breach dispositioned (`mismatch.breach.dispositioned`) | Breach magnitude (`mismatch.breach_magnitude`), breached bucket (`mismatch.breached_bucket`), remediation plan | Breach disposition record (`mismatch.breach.dispositioned`) | Same day as breach |

**ALERTS/METRICS:** `alert.mismatch_breach` fires on any bucket limit exceedance; target zero unresolved breaches at EOD. Intraday recompute latency monitored; target <15 minutes from flow detection to updated gap schedule.

---

## LQ-03 — Liquid Assets Ratio Bands {#lq-03-liquid-assets-ratio-bands}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires maintenance of a cushion of liquid assets and monitoring of the liquidity ratio. The four-band structure (Normal ≥10%; Watch <10%; Low <8%; Critical <6%) operationalizes the board-approved risk appetite and directly triggers CFP activation levels.

**SYSTEM BEHAVIOR:** LAR is computed daily by 16:00 as unencumbered liquid assets divided by total assets, using the GL snapshot and the approved haircut table. The system classifies the result into one of four bands and compares it to the prior day's band; a band change triggers a real-time alert. The Critical band (<6%) also triggers the NCUA notification workflow (see [LQ-11](#lq-11-regulatory-notification)). LAR value and band are the primary inputs to CFP activation (see [LQ-10](#lq-10-cfp-activation--escalation-ladder)). LAR compute is write-restricted to Treasury Operations; band thresholds are write-restricted to CFO with Board approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`liquidity.eod.posted`) | Unencumbered liquid assets (`liquidity.liquid_assets`), total assets (`liquidity.total_assets`), haircut table (`liquidity.haircut_table`) | LAR value and current band (`lar.computed`); band-change alert if band differs from prior day (`lar.band_alert.issued`); critical breach event if LAR <6% (`lar.critical.breached`) | Daily by 16:00 (enforced by `lar.compute_due_at`) |
| LAR band changes (`lar.band.changed`) | New band (`lar.current_band`), prior band (`lar.prior_band`), LAR value (`lar.value`) | Band-change notification to CFO and ALCO (`alert.lar_band_change`); CFP level evaluation initiated | Immediate (real-time) |

**ALERTS/METRICS:** `alert.lar_band_change` fires on any band transition; `lar.critical.breached` fires when LAR <6% and is the primary trigger for NCUA notification. Target: LAR in Normal band (≥10%) as steady-state; Watch or below requires documented management response within 1 BD.

---

## LQ-04 — Survival Horizon & Coverage Days {#lq-04-survival-horizon--coverage-days}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires assessment of the credit union's ability to meet obligations under stress. Survival horizon modeling quantifies how many days the credit union can operate without new external funding under defined stress scenarios, providing the most direct measure of liquidity adequacy.

**SYSTEM BEHAVIOR:** Survival days are modeled quarterly under two scenarios: idiosyncratic stress (institution-specific deposit outflow and funding withdrawal) and combined stress (idiosyncratic plus systemic market disruption). The model uses behavioral assumptions from the approved catalogue and facility haircuts from the collateral schedule. When an EWI spike is flagged, an ad-hoc rerun is completed within 2 business days. Survival below 15 days (combined scenario) triggers NCUA notification (see [LQ-11](#lq-11-regulatory-notification)). Model is write-restricted to Treasury Operations; independent review is required annually (see [LQ-08](#lq-08-data-quality--model-governance)).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter opens (`stress.quarter_open`) | Behavioral assumptions (`stress.behavioral_assumptions`), facility haircuts (`liquidity.haircut_table`), scenario set (`stress.set`) | Survival days under idiosyncratic and combined stress (`survival.computed`); below-threshold flag if <15d combined (`survival.below_threshold`) | Quarterly (enforced by `survival.quarterly_due_at`) |
| Major EWI spike flagged (`ewi.spike.flagged`) | Current EWI values (`ewi.value`), updated assumptions if changed (`stress.assumption_value`) | Ad-hoc survival recompute (`survival.adhoc_computed`); updated below-threshold flag if applicable | +2 BD (enforced by `stress.rerun_due_at`) |

**ALERTS/METRICS:** `alert.survival_low` fires when survival days fall below the board-approved minimum (15 days combined). Target: survival horizon ≥30 days idiosyncratic and ≥15 days combined in steady state.

---

## LQ-05 — Stress Testing {#lq-05-stress-testing}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires stress testing as a core element of the liquidity risk management program. Credible, regularly refreshed scenarios — including institution-specific and systemic events — are the evidentiary basis for CFP design and limit calibration.

**SYSTEM BEHAVIOR:** Four scenario types are maintained: idiosyncratic (institution-specific deposit outflow, funding withdrawal, asset-quality deterioration), systemic (market-wide funding disruption), combined (both simultaneously), and intraday peak (settlement and clearing stress). A BaaS shock scenario is maintained separately to capture partner-flow concentration risk. All scenarios are run quarterly; a major EWI event triggers a rerun within 5 business days. Scenario assumptions are versioned and approved by the CFO; independent model review is conducted annually (see [LQ-08](#lq-08-data-quality--model-governance)). Stress pack is write-restricted to Treasury Operations; scenario parameters require CFO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter opens (`stress.quarter_open`) | Approved scenario set (`stress.set`), behavioral assumptions (`stress.behavioral_assumptions`), BaaS shock parameters (`stress.baas_shock_params`), intraday profile (`stress.intraday_profile`) | Stress pack with survival horizon, funding gaps, and action plan deltas (`stress.pack.issued`) | Quarterly (enforced by `stress.quarterly_due_at`) |
| Major EWI event flagged (`ewi.major_event.flagged`) | Updated EWI values (`ewi.value`), change rationale (`stress.change_rationale`) | Ad-hoc stress rerun (`stress.adhoc_rerun.issued`) | +5 BD (enforced by `stress.rerun_due_at`) |
| Assumption changed (`stress.assumption.changed`) | Prior assumption value (`stress.assumption_value`), new value, approver (`stress.approver_id` — provisional) | Versioned assumption record (`stress.assumption_versioned`) | Before next scheduled run |

**ALERTS/METRICS:** Stress pack issuance timeliness monitored; target 100% on-time quarterly delivery. Ad-hoc rerun latency target: completed within 5 BD of EWI trigger. Any scenario showing survival <15 days (combined) escalates immediately to CFO.

---

## LQ-06 — Funding Concentration & Counterparty Limits {#lq-06-funding-concentration--counterparty-limits}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires identification and management of funding concentrations as a key liquidity risk. Concentration limits prevent over-reliance on any single depositor, provider, or facility type.

**SYSTEM BEHAVIOR:** The system tracks top-10 depositor balances and single-provider/facility reliance daily, comparing each against board-approved limits. A limit breach triggers an alert and opens a waiver workflow; the waiver must be resolved (approved or denied with remediation plan) within 2 business days. Monthly ALCO review covers wholesale and listing-service deposit exposure trends. Concentration data is sourced from the depositor file and GL; write-restricted to Treasury Operations. Waiver decisions require CFO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD depositor file posted (`liquidity.depositor_file.posted`) | Top-10 depositor balances (`concentration.top10`), single-provider exposure (`concentration.computed`), limits (`concentration.position_id`) | Daily concentration report; breach alert if limit exceeded (`liquidity.concentration.breached`) | Daily by 16:00 (enforced by `concentration.compute_due_at`) |
| Concentration limit breached (`liquidity.concentration.breached`) | Excess amount (`concentration.excess_amount`), reviewer (`concentration.reviewer_id`), waiver request (`concentration.waiver_request`) | Waiver decision record (`concentration.waiver.decided`) | +2 BD (enforced by `concentration.waiver_due_at`) |
| Monthly ALCO review (`alco.ratio_review.logged`) | Wholesale exposure history (`wholesale.exposure_history`), listing-service tenor ladder (`wholesale.tenor_ladder`), pricing authority (`wholesale.pricing_authority_id`) | ALCO review log (`alco.ratio_review.logged`) | Monthly |

**ALERTS/METRICS:** `alert.concentration_breach` fires on any limit exceedance; target zero unresolved breaches beyond 2 BD. Monthly ALCO review completion rate target: 100%.

---

## LQ-07 — Reporting Cadence {#lq-07-reporting-cadence}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires regular reporting to management and the board on the liquidity risk profile. Automated, time-bound report generation ensures decision-makers have current information and creates an audit trail of the program's operation.

**SYSTEM BEHAVIOR:** Three report types are auto-generated on fixed schedules: (1) Daily ops pack at 17:00 containing LAR, band, cumulative gaps, top-depositor concentrations, and facility headroom; (2) Weekly ALCO digest by Friday 12:00 containing trend deltas and EWI summary; (3) Quarterly Board deck within 5 business days of quarter end containing stress results, survival horizon, and limit compliance status. Each report requires a sign-off from the designated owner before distribution. Reports are write-restricted to Treasury Operations; sign-off is restricted to CFO (daily/weekly) and CFO + Board Chair (quarterly).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD compute complete (`liquidity.eod.posted`) | LAR (`lar.value`, `lar.current_band`), gap schedule (`mismatch.current_gaps`), concentration data (`concentration.top10`), facility headroom (`collateral.headroom_computed`) | Daily ops pack (`report.daily_pack.published`) | 17:00 daily (enforced by `report.daily_due_at`) |
| Friday close (`report.weekly_digest.published` timer) | Weekly trend deltas (`report.weekly_deltas`), EWI summary (`ewi.ceo_summary`) | Weekly ALCO digest (`report.weekly_digest.published`) | Friday 12:00 (enforced by `report.weekly_due_at`) |
| Quarter end + 5 BD (`report.board_due_at` reached) | Stress pack (`stress.pack`), survival days (`survival.days_combined`), limit compliance summary (`policy.limit_registry`) | Quarterly Board deck (`report.board_deck.published`) | +5 BD of quarter end (enforced by `report.board_due_at`) |

**ALERTS/METRICS:** `alert.policy_review_aging` covers report latency; dedicated metric tracks on-time delivery rate for each report type. Target: 100% on-time; any missed report escalates to CCO within 1 BD.

---

## LQ-08 — Data Quality & Model Governance {#lq-08-data-quality--model-governance}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that liquidity measurement systems be accurate and reliable. Data lineage, assumption catalogues, and independent model review are the controls that ensure the numbers driving limit decisions and CFP activation are trustworthy.

**SYSTEM BEHAVIOR:** All liquidity metrics tie out to the GL daily; variances above a materiality threshold (defined in the limit registry) open a DQ investigation. The assumption catalogue is versioned and synced to GL mapping daily; any change requires CFO approval. Independent model review is conducted annually by a reviewer who is segregated from model builders; the reviewer roster is maintained in the model record. Model builders and reviewers must not be the same individuals — this segregation is enforced by access control (model builder roster is write-restricted to Treasury Operations; reviewer assignment is write-restricted to CCO). DQ investigation results are reported to ALCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | GL trial balance (`gl.trial_balance`), liquidity metric outputs (`liquidity.system_balances`), materiality threshold | GL tie-out result; DQ variance alert if threshold exceeded (`dq.variance.detected`) | Daily (enforced by `dq.tieout_due_at`) |
| DQ variance detected (`dq.variance.detected`) | Variance amount (`dq.variance_amount`), investigation notes (`dq.investigation`) | DQ investigation opened and resolved (`dq.tieout.completed`) | Same day for investigation open; resolution per severity |
| Annual model review due (`model.review_due_at` reached) | Model documentation, builder roster (`model.builder_roster`), prior review findings | Independent model review completed (`model.review.completed`) | Annual (enforced by `model.review_due_at`) |
| Assumption catalogue change proposed | New assumption value (`stress.assumption_value`), change rationale (`stress.change_rationale`), CFO approval | Versioned assumption record (`stress.assumption_versioned`); catalogue sync (`catalogue.sync.completed`) | Before next metric run (enforced by `catalogue.sync_due_at`) |

**ALERTS/METRICS:** `alert.dq_variance` fires on any GL tie-out failure above materiality threshold; target zero unresolved variances at EOD. `alert.catalogue_sync.failed` fires if daily sync fails. Annual model review completion rate target: 100% on schedule.

---

## LQ-09 — Contingent Federal Liquidity Access {#lq-09-contingent-federal-liquidity-access}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires credit unions with assets ≥$250MM to document access to a federal contingent liquidity source. The Central Liquidity Facility ([12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and Federal Reserve Discount Window ([12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)) are the two qualifying federal sources.

**SYSTEM BEHAVIOR:** Pynthia maintains CLF membership or agent-member access and Discount Window operational readiness (borrower-in-custody or pledged collateral arrangement). Collateral schedules for both facilities are kept current and updated daily alongside the collateral inventory. An annual test — either a funded draw or a no-funds operational test — is conducted for at least one federal facility; the test result and any corrective actions are documented. Facility contacts and legal documents are maintained in the facility record. Collateral pledges and releases require dual authorization. Facility readiness is write-restricted to CFO; collateral schedule updates require dual control.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD collateral inventory updated (`collateral.file.posted`) | Eligible unencumbered balances (`collateral.unencumbered_balance`), haircuts by counterparty (`collateral.eligibility_rules`), pledge schedule (`collateral.pledge_schedule`) | Updated collateral headroom (`collateral.headroom_computed`); low-headroom alert if applicable (`alert.headroom_low`) | Daily (enforced by `collateral.compute_due_at`) |
| Large collateral move detected (`collateral.large_move.detected`) | Move detail (`collateral.move_detail`), updated balances | Headroom recheck (`collateral.headroom_rechecked`) | Immediate |
| Annual facility test due (`facility.test_due_at` reached) | Test script (`facility.test_script`), facility contacts (`facility.contacts`), collateral schedule (`facility.collateral_schedule`) | Facility test completion record (`facility.test.completed`); corrective plan if partial failure | Annual (enforced by `facility.annual_test_due`) |

**ALERTS/METRICS:** `alert.headroom_low` fires when unencumbered collateral headroom falls below the board-approved minimum. `alert.facility_readiness_aging` fires if annual test is overdue. Target: annual test completed on schedule with no unresolved corrective items.

---

## LQ-10 — CFP Activation & Escalation Ladder {#lq-10-cfp-activation--escalation-ladder}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a written CFP that is executable, not aspirational. Defined activation levels, crisis roles, and time-bound escalation requirements ensure the credit union can act before a stress event becomes a crisis.

**SYSTEM BEHAVIOR:** Three CFP levels are defined, tied directly to LAR bands and survival horizon: **Level 1 Watch** (LAR <10% or sustained EWI red); **Level 2 Low** (LAR <8% or survival <30d idiosyncratic / <20d combined); **Level 3 Critical** (LAR <6% or outflow ≥40%/10d or imminent payment failure). Level changes are system-detected and require CFO confirmation. On Level 2 or 3 activation, the crisis team must convene within 60 minutes; first-line funding actions must begin within 2 hours. Crisis roles: CEO manages external communications; CFO runs liquidity operations; ALCO provides advisory support; Board authorizes extraordinary measures. External draws require dual authorization. CEO unavailability triggers succession matrix. Level deactivation requires CFO sign-off with documented rationale.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| LAR band or survival threshold crossed (`lar.band.changed` or `survival.below_threshold`) | LAR value (`lar.value`), survival days (`survival.days_combined`), CFP threshold table (`cfp.level`) | CFP level change record (`cfp.level.changed`); crisis team convene task opened (`crisis.convene_due_at`) | Immediate detection; team convened within 60 min (enforced by `crisis.convene_due_at`) |
| CFP Level 2 or 3 activated (`cfp.level.changed` to Low or Critical) | Playbook spec (`playbook.spec`), crisis roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`) | CFP transition started (`cfp.transition.started`); first-line funding tasks opened | Within 2 hours (enforced by `cfp.transition_due_at`) |
| External draw authorized (`funding.external_draw.requested`) | Draw amount (`funding.draw_amount`), dual-authorization record (`crisis.decision_detail`), source (`funding.next_source`) | External draw executed (`funding.draw.executed`) | Within 2 hours of Level 2 activation (enforced by `funding.first_line_due_at`) |
| CFP deactivated (`cfp.deactivated`) | Deactivation rationale, CFO sign-off | CFP deactivation record (`cfp.deactivated`) | Upon return to Normal band with documented rationale |

**ALERTS/METRICS:** Escalation time from trigger to crisis team convened is monitored; target ≤60 minutes. First-line action initiation target: ≤2 hours from Level 2/3 activation. Any deviation from draw order requires documented rationale (`funding.draw_order_deviated`).

---

## LQ-11 — Regulatory Notification {#lq-11-regulatory-notification}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires timely communication with NCUA when material liquidity stress occurs. Prompt notification preserves the regulator's ability to provide supervisory support and is a condition of the credit union's operating relationship with NCUA.

**SYSTEM BEHAVIOR:** NCUA notification is required within 24 hours when any of the following conditions occur: CFP Level 2 or 3 activates; a federal facility (CLF or Discount Window) is used or attempted; survival falls below 15 days (combined scenario); or LAR falls below 6%. The CFO drafts the notification memo; the CEO sends it to the examiner-in-charge and regional office; the Board Chair is copied. After-hours triggers must be notified by 10:00 the next calendar day, with the after-hours exception documented. NCUA contact list is maintained in the regulator record and verified annually. Notification is write-restricted to CEO (sender) and CFO (drafter).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Notification trigger condition met (`ncua.notification_required` = true) | Trigger condition (`ncua.trigger_condition`), metrics snapshot (`ncua.metrics_snapshot`), event memo (`ncua.memo`), NCUA contacts (`regulator.contacts`) | NCUA notification sent (`ncua.notification.sent`); acknowledgement logged when received (`ncua.ack.logged`) | 24 hours (enforced by `ncua.notification_due_at`); after-hours by 10:00 next calendar day |
| NCUA acknowledgement received (`ncua.ack.received`) | Acknowledgement detail (`ncua.ack_detail`) | Acknowledgement record (`ncua.ack.logged`) | Upon receipt |

**ALERTS/METRICS:** `alert.ncua_notification_aging` fires if notification has not been sent within 20 hours of trigger (4-hour buffer before deadline). Target: 100% on-time notification; zero missed notifications in any examination period.

---

## LQ-12 — External Communications & Stakeholder Matrix {#lq-12-external-communications--stakeholder-matrix}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a CFP that addresses communications during a liquidity event. Controlled, scripted communications mitigate run risk by preventing information asymmetry and panic among depositors and partners.

**SYSTEM BEHAVIOR:** The CEO is the sole external spokesperson during a liquidity event; no other employee may speak to media, major depositors, or BaaS partners about the credit union's liquidity condition without CEO authorization. Scripted updates for major depositors and BaaS partners are pre-approved and maintained in the comms record; scripts are reviewed and updated at each CFP level change. Level 2 or 3 activation requires same-day communications to major depositors and partners. Media inquiries are responded to using the approved holding statement only. Comms scripts are write-restricted to Compliance with CEO approval; stakeholder matrix is maintained by CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CFP Level 2 or 3 activated (`cfp.level.changed` to Low or Critical) | Approved scripts (`comms.draft_script`), stakeholder matrix (`comms.stakeholder_matrix`), CEO approval (`comms.ceo_approval`) | Depositor/partner notices sent (`comms.notices.sent`); communications log (`comms.notices.sent`) | Same day (enforced by `comms.same_day_due_at`) |
| Media inquiry received (`comms.media_inquiry.received`) | Approved holding statement (`comms.holding_statement`) | Media response logged (`comms.media_response.logged`) | Immediate; holding statement only |
| Script change requested (`comms.script_change.requested`) | Revised script, CEO approval | Updated script record (`comms.script.approved`) | Before next use |

**ALERTS/METRICS:** Same-day communication completion rate monitored at Level 2/3 activation; target 100%. Any unauthorized external communication is an immediate escalation to CCO and CEO.

---

## LQ-13 — Regulator Liaison Protocols {#lq-13-regulator-liaison-protocols}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the credit union to maintain an effective relationship with its regulator, including timely responses to supervisory requests. Maintaining current examiner contacts and responding promptly to requests demonstrates program operability.

**SYSTEM BEHAVIOR:** The examiner-in-charge and regional office contacts are maintained in the regulator record and verified annually. Event memos for all material liquidity events are filed in the regulator record. Responses to regulator requests are due within 1 business day unless the regulator specifies a different deadline. Regulator contact list is write-restricted to CCO; response packages are prepared by CFO and reviewed by CCO before submission.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulator request received (`regulator.request.received`) | Request detail (`regulator.request_detail`), response package | Response sent (`regulator.response.sent`) | 1 BD unless otherwise directed (enforced by `regulator.response_due_at`) |
| Annual contact verification due (`regulator.contact_verification_due`) | Current contact list (`regulator.contacts`) | Verified contact record (`regulator.contacts.verified`) | Annual (enforced by `regulator.verification_due_at`) |
| Material liquidity event occurs | Event description, metrics at time of event | Event memo filed (`regulator.memo.filed`) | Same day as event |

**ALERTS/METRICS:** `alert.regulator_request_aging` fires if a regulator request has not been responded to within 20 hours (4-hour buffer). Target: 100% on-time responses; zero overdue items at any examination.

---

## LQ-14 — Liquidity Drills & After-Action Reviews {#lq-14-liquidity-drills--after-action-reviews}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the CFP be tested to ensure it is operationally sound. Annual drills and after-action reviews demonstrate that roles, systems, and playbooks work as designed and that gaps are remediated.

**SYSTEM BEHAVIOR:** An annual tabletop exercise tests the full CFP activation sequence, including crisis team convening, draw order execution, communications, and NCUA notification. The annual facility test (CLF or Discount Window) is coordinated with [LQ-09](#lq-09-contingent-federal-liquidity-access). After-action reviews (AARs) are published within 10 business days of each drill or test; each AAR identifies remediation items with owners and target dates. Remediation items are tracked to closure. Drill design and AAR publication are write-restricted to CCO; remediation ownership is assigned by CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual drill scheduled (`drill.aar_due_at` set) | Drill objectives (`drill.objectives`), participant roster (`drill.roster`), scenario | Drill completed (`drill.completed`); element failures logged (`drill.element.failed`) | Annual |
| Drill or facility test completed (`drill.completed` or `facility.test.completed`) | Drill results, failure details (`drill.failure_detail`), corrective plan | After-action review published (`drill.aar.published`) with remediation owners and dates | +10 BD (enforced by `drill.aar_due_at`) |
| Remediation item identified (`drill.corrective_plan.opened`) | Remediation item (`drill.remediation_item`), owner (`drill.remediation_owner`), target date (`drill.remediation_due_at`) | Remediation closure record (`drill.remediation.closed`) | Per AAR target date (enforced by `drill.remediation_due_at`) |

**ALERTS/METRICS:** AAR publication timeliness monitored; target 100% within 10 BD. Remediation item closure rate monitored; target 100% by AAR target dates. Any critical failure in a drill escalates to Board within 5 BD.

---

## LQ-15 — Documentation & Retention {#lq-15-documentation--retention}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the credit union maintain evidence of its liquidity program's operation. A 10-year retention period covers the full examination cycle and any potential enforcement action horizon.

**SYSTEM BEHAVIOR:** All policy versions, limit registries, daily ops packs, weekly digests, quarterly Board decks, stress packs, NCUA notifications, facility test reports, drill records, and AARs are retained for 10 years from creation date. Each artifact is indexed within 2 business days of creation. The retention system supports legal-hold capability; records subject to a legal hold are flagged and excluded from scheduled destruction. Access to retained records is role-based; legal-hold placement and release require CCO authorization. Record indexing is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Artifact finalized (any liquidity program document) | Artifact blob (`record.blob`), metadata (`record.metadata`), retention class (10 years) | Record created and indexed (`record.indexed`); retention clock set (`record.retention_clock_set`) | +2 BD (enforced by `record.index_due_at`) |
| Legal hold placed (`legal.hold.placed`) | Hold scope (`legal.hold_scope`), matter reference (`legal.matter_id`) | Legal hold flag applied to affected records (`record.hold.applied`) | Immediate |
| Retention period expires (`record.retention.expired`) | Destruction eligibility check (no active legal hold) | Record disposed (`record.disposed`) or hold maintained if legal hold active | Per retention schedule (enforced by `record.retention_expires_at`) |

**ALERTS/METRICS:** Indexing latency monitored; target 100% indexed within 2 BD. Retention gap alerts fire if any artifact class has records without a retention clock set. Legal-hold integrity verified quarterly.

---

## LQ-16 — Definitions & Ratios Catalogue {#lq-16-definitions--ratios-catalogue}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that liquidity measurement systems be well-defined and consistently applied. A central, versioned catalogue of metric definitions, formulas, and GL mappings is the foundation for all ratio computations and prevents definitional drift across reporting periods.

**SYSTEM BEHAVIOR:** The catalogue maintains standardized definitions and formulas for all metrics used in this policy: LAR, cumulative mismatch gaps by bucket, survival horizon (idiosyncratic and combined), and funding concentration ratios. Each metric entry includes its formula, GL account mapping, behavioral assumption references, and the date of last sync. The catalogue is synced to GL mapping daily; any sync failure triggers an alert. Changes to metric definitions require CFO approval and are versioned. Metrics flagged as provisional (not yet fully validated) are marked in the catalogue and excluded from limit-breach determinations until validated. Catalogue is write-restricted to Treasury Operations with CFO approval for definition changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily GL sync due (`catalogue.sync_due_at` reached) | GL chart-of-accounts map (`catalogue.lineage`), current metric definitions (`catalogue.definition`), formula set (`catalogue.formula`) | Catalogue sync completed (`catalogue.sync.completed`); sync failure alert if applicable (`alert.catalogue_sync.failed`) | Daily (enforced by `catalogue.sync_due_at`) |
| Metric definition change requested (`catalogue.change.requested`) | Proposed definition, change rationale, CFO approval (`catalogue.approver_id`) | Updated catalogue definition (`catalogue.definition.updated`); version recorded | Before next metric run |
| Provisional metric flagged (`catalogue.metrics_flagged_provisional`) | Metric identifier, provisional rationale | Provisional flag set; metric excluded from limit-breach logic until validated | Immediate |

**ALERTS/METRICS:** `alert.catalogue_sync.failed` fires on any daily sync failure; target zero sync failures. Provisional metric count monitored; target zero provisional metrics in production limit-breach logic.

---

## LQ-17 — Wholesale / Listing-Service Deposits Guardrails {#lq-17-wholesale--listing-service-deposits-guardrails}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires management of funding concentrations and diversification of funding sources. Listing-service deposits are a contingent funding tool that must be governed to prevent over-reliance and pricing discipline failures.

**SYSTEM BEHAVIOR:** Only ALCO-approved listing services may be used. Each listing-service deposit program must have a board-approved tenor ladder (maximum concentration per maturity bucket) and a designated pricing authority. Exposure is computed and updated daily; the monthly ALCO review assesses total wholesale and listing-service exposure against limits. Pricing decisions must be made by the designated pricing authority; deviations trigger an alert. Listing-service exposure is write-restricted to Treasury Operations; pricing authority designation is write-restricted to CFO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD wholesale exposure computed (`wholesale.exposure.posted`) | Listing-service balances by service and tenor (`wholesale.tenor_ladder`), pricing authority (`wholesale.pricing_authority_id`), daily limit | Daily exposure record (`wholesale.exposure_computed`); pricing violation alert if rate exceeds authority (`alert.wholesale_pricing_violation`) | Daily (enforced by `wholesale.compute_due_at`) |
| Monthly ALCO review (`alco.ratio_review.logged`) | Exposure history (`wholesale.exposure_history`), maturity calendar (`wholesale.maturity_calendar`), limit compliance | ALCO review log with wholesale assessment (`alco.ratio_review.logged`) | Monthly (enforced by `wholesale.monthly_review_due`) |
| New listing service proposed (`wholesale.listing.requested`) | Service due-diligence file, ALCO approval, tenor ladder parameters | Listing service decisioned (`wholesale.listing_decisioned`) | Before first use |

**ALERTS/METRICS:** `alert.wholesale_pricing_violation` fires on any rate exceeding pricing authority; target zero violations. Monthly ALCO review completion rate target: 100%.

---

## Governance & Sign-Off {#governance}

**Owner:** Patrick Wilson, Chief Compliance Officer

**Approvers:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** Annual; ad-hoc within 10 business days of any material change (new product, new BaaS partner, significant balance-sheet shift, regulatory amendment, or AAR finding requiring policy update).

**Cross-References:**
- Investment Policy — governs AFS marketability, haircut schedules, and pledging restrictions (jointly with [LQ-09](#lq-09-contingent-federal-liquidity-access))
- Capitalization Policy and Basel-II Standardized Approach Framework Policy — capital adequacy and reserve frameworks
- Cash Policy — physical cash and vault operations
- Enterprise Risk Management Policy — enterprise-wide risk appetite governance
- Business Continuity Plan — operational resilience

**Governing Authority:** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14) (CLF); [12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b) (Discount Window).

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for liquidity-domain fields.** The following codes used in control overlays are registered in `core-vocabulary.json` and confirmed: `lar.*`, `mismatch.*`, `stress.*`, `survival.*`, `cfp.*`, `ewi.*`, `collateral.*`, `concentration.*`, `wholesale.*`, `funding.*`, `liquidity.*`, `ncua.*`, `regulator.*`, `comms.*`, `drill.*`, `record.*`, `catalogue.*`, `report.*`, `policy.*`, `crisis.*`, `facility.*`, `dq.*`, `model.*`, `alco.*`, `gl.*`. The field `stress.approver_id` is listed as a provisional code in DESIGN_NOTES and is used as-is. No new objects or actions were coined.

- **LAR band thresholds (Normal ≥10%; Watch <10%; Low <8%; Critical <6%) are policy-set values** operationalizing §741.12 and require Board confirmation at the next annual review or upon adoption of this policy.

- **Survival horizon targets (≥30 days idiosyncratic; ≥15 days combined) are policy-set values** and require Board confirmation. The 15-day combined threshold is also the NCUA notification trigger; if the Board sets a different target, the notification trigger remains at 15 days.

- **FHLB eligibility is assumed but not confirmed.** The funding playbook in [LQ-10](#lq-10-cfp-activation--escalation-ladder) includes FHLB advances as an external source if eligible. Confirm district membership, collateral programs, and stock requirements with the relevant FHLB district before relying on this source in the CFP draw order.

- **Pynthia Credit Union's asset size relative to the $250MM threshold for mandatory federal contingent liquidity documentation** should be confirmed. If assets are below $250MM, [LQ-09](#lq-09-contingent-federal-liquidity-access) remains best practice but the CLF/DW documentation requirement under §741.12 is not mandatory. If at or above $250MM, the annual facility test is required.

- **BaaS partner flow behavioral assumptions** for stress scenarios ([LQ-05](#lq-05-stress-testing)) are not yet defined. Treasury Operations must develop and document BaaS-specific outflow assumptions (e.g., partner deposit concentration, intraday settlement peaks) before the first quarterly stress run under this policy.

- **Intraday large-flow threshold** (the dollar amount that triggers a mismatch recompute under [LQ-02](#lq-02-maturity-mismatch-limits)) is a policy-set value that must be defined in the limit registry and approved by the Board.

- **Materiality threshold for DQ variance** ([LQ-08](#lq-08-data-quality--model-governance)) is a policy-set value that must be defined in the limit registry.

- **Pricing authority designation for listing-service deposits** ([LQ-17](#lq-17-wholesale--listing-service-deposits-guardrails)) must be formally documented in the limit registry with the specific rate-deviation tolerance before the first listing-service deposit is accepted under this policy.

- **The `stress.approver_id` field** is used in [LQ-05](#lq-05-stress-testing) and is listed as a provisional code in DESIGN_NOTES. Engineering should confirm registration before the next vocabulary release.
