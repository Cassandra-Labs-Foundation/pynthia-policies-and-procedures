```markdown
---
title: Liquidity Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Liquidity, CFP, NCUA, ALM, BaaS]
---

# Liquidity Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based liquidity program that measures, limits, and reports cash-flow adequacy under normal conditions and executes pre-planned funding actions when stress indicators breach defined thresholds. The program applies across all balance-sheet and funding activities, including Banking-as-a-Service partner flows, and is anchored to [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12). Governance is centralized with the Chief Compliance Officer; the CFO owns day-to-day program execution; the CEO, ALCO, Treasury Operations, and the Board are required participants and approvers as specified in each control below.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Daily LAR computation | EOD GL posted (`lar.computed`) | **16:00 daily** | LAR value, band, breach flag | [LQ-05](#lq-05-liquid-assets-ratio-bands) |
| Daily mismatch computation | EOD GL posted (`mismatch.gap_computed`) | **16:00 daily** | Gap table by bucket | [LQ-03](#lq-03-maturity-mismatch-limits) |
| Intraday mismatch recompute | Large unscheduled flow detected (`liquidity.large_flow.detected`) | **Immediate** | Updated gap table | [LQ-03](#lq-03-maturity-mismatch-limits) |
| Daily ops pack | EOD computations complete (`report.daily_pack.published`) | **17:00 daily** | LAR, gaps, concentrations, headroom | [LQ-09](#lq-09-reporting-cadence) |
| Weekly ALCO digest | Friday close (`report.weekly_digest.published`) | **Fri 12:00** | Trend deltas, EWI summary | [LQ-09](#lq-09-reporting-cadence) |
| Quarterly Board deck | Quarter-end + 5 BD (`report.board_deck.published`) | **+5 BD** | Full program metrics | [LQ-09](#lq-09-reporting-cadence) |
| Quarterly stress run | Quarter open (`stress.pack.issued`) | **Quarterly** | Idiosyncratic, systemic, combined scenarios | [LQ-07](#lq-07-stress-testing) |
| Ad-hoc stress rerun | Major EWI spike (`stress.adhoc_rerun.issued`) | **5 BD** | Updated survival horizon | [LQ-07](#lq-07-stress-testing) |
| Survival horizon model | Quarterly or EWI spike (`survival.computed`) | **Quarterly / 2 BD ad-hoc** | Survival days by scenario | [LQ-04](#lq-04-survival-horizon-and-coverage-days) |
| Concentration waiver | Limit breach detected (`concentration.waiver.opened`) | **2 BD** | Waiver decision memo | [LQ-06](#lq-06-funding-concentration-and-counterparty-limits) |
| CFP Level 2/3 transition | LAR or survival threshold crossed (`cfp.level.changed`) | **2 hours** | Playbook activation, crisis team convened | [LQ-14](#lq-14-cfp-activation-and-escalation) |
| NCUA notification | Level 2/3 active, federal facility used, survival <15d, or LAR <6% (`ncua.notification.sent`) | **24 hours** | Event memo + metrics snapshot | [LQ-10](#lq-10-regulatory-notification) |
| Federal facility test | Annual test due (`facility.test.completed`) | **Annual** | Test report + AAR | [LQ-11](#lq-11-contingent-federal-liquidity-access) |
| Collateral update | Daily or large move (`collateral.valued`) | **Daily / immediate on large move** | Pledge schedule, headroom | [LQ-12](#lq-12-collateral-and-encumbrance-management) |
| Wholesale exposure update | Daily (`wholesale.exposure.posted`) | **Daily** | Exposure vs. limit | [LQ-13](#lq-13-wholesale-and-listing-service-deposit-guardrails) |
| Drill after-action review | Annual tabletop completed (`drill.aar.published`) | **10 BD** | AAR with owners and dates | [LQ-16](#lq-16-liquidity-drills-and-after-action-reviews) |
| Regulator request response | Request received (`regulator.response.sent`) | **1 BD** | Response package | [LQ-17](#lq-17-regulator-liaison-protocols) |
| Record indexing | Artifact finalized (`record.indexed`) | **2 BD** | Indexed archive entry | [LQ-15](#lq-15-documentation-and-retention) |
| Policy annual review | Review due (`policy.review.completed`) | **Annual / 10 BD ad-hoc** | Revised policy version | [LQ-01](#lq-01-policy-scope-and-risk-appetite) |

---

## LQ-01 — Policy Scope and Risk Appetite {#lq-01-policy-scope-and-risk-appetite}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a board-approved, written liquidity policy that establishes risk tolerance and covers all material funding activities. A versioned policy and limit registry are the documentary foundation for examiner review.

**SYSTEM BEHAVIOR:** The policy document and its companion limit registry are maintained as versioned artifacts. The policy covers all balance-sheet and funding activities including BaaS partner flows; out-of-scope items (investment credit, capital adequacy, vault cash, enterprise risk appetite, BCP, OCC/FDIC materials) are explicitly excluded. The Board approves the policy at least annually; the CCO triggers an ad-hoc review within 10 business days of any material change (new product, new BaaS partner, regulatory amendment, or limit breach pattern). The limit registry is a write-restricted artifact: only the CCO and CFO may update it; all others have read-only access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens or material change flagged (`policy.material_change.flagged`) | Current policy version (`policy.document_version`), change rationale (`policy.change_rationale`), limit registry (`policy.limit_registry`) | Revised policy draft + Board approval record (`policy.board.approved`) | Annual; ad-hoc within 10 BD of material change (enforced by `policy.review.due_at`) |
| Board approves revised policy (`policy.board.approved`) | Signed resolution (`board.resolution_id`), effective date (`policy.effective_date`) | Published policy version + distribution log (`policy.revision.published`) | Same meeting cycle |
| Limit registry updated outside annual cycle (`policy.limit.updated`) | Proposed limit (`policy.proposed_limit`), CCO/CFO approval (`policy.approver_id`) | Updated registry entry + change log (`policy.limit.updated`) | Immediate on approval |

**ALERTS/METRICS:** Alert `alert.policy_review_aging` fires when `policy.review.due_at` is within 15 calendar days and no draft is in progress. Target: zero overdue annual reviews; zero unapproved ad-hoc changes outstanding beyond 10 BD.

---

## LQ-02 — Definitions and Ratios Catalogue {#lq-02-definitions-and-ratios-catalogue}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that liquidity measurement be consistent and well-defined. A central, GL-mapped catalogue prevents metric drift and supports examiner reproducibility.

**SYSTEM BEHAVIOR:** A single catalogue object (`catalogue`) holds the canonical definitions, formulas, and GL-account mappings for all program metrics: Liquid Assets Ratio (LAR), cumulative mismatch gaps by bucket, survival horizon (idiosyncratic and combined), and funding concentration ratios. The catalogue syncs to the GL mapping daily; any formula or mapping change requires CCO approval before publication. Metrics flagged as provisional are blocked from appearing in regulatory reports until approved. The catalogue is write-restricted to the CCO and model-governance team; Treasury Operations has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily GL close (`gl.eod.closed`) | GL balances (`gl.balances`), COA map (`gl.coa_map`) | Catalogue sync confirmation (`catalogue.sync.completed`) | Daily by 16:00 (enforced by `catalogue.sync_due_at`) |
| Sync fails (`catalogue.sync.failed`) | Failure reason (`catalogue.failure_reason`), affected metrics | Alert to CCO + provisional flag on affected metrics (`alert.catalogue_sync.failed`) | Immediate |
| Formula or mapping change proposed (`catalogue.change.requested`) | Change description (`catalogue.change`), lineage documentation (`catalogue.lineage`), approver (`catalogue.approver_id`) | Approved definition update (`catalogue.definition.updated`) | Before next daily sync |

**ALERTS/METRICS:** Alert `alert.catalogue_sync.failed` fires on any sync failure; target zero consecutive failures. Metric staleness (>1 BD since last successful sync) blocks LAR and mismatch computations in LQ-03 and LQ-05.

---

## LQ-03 — Maturity Mismatch Limits {#lq-03-maturity-mismatch-limits}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires measurement of cash-flow gaps across time horizons. Cumulative mismatch limits operationalize the Board's risk appetite for funding tenor imbalance.

**SYSTEM BEHAVIOR:** The system computes cumulative cash-flow gaps in six time buckets — overnight, 2–7 days, 8–30 days, 31–90 days, 91–365 days, and >1 year — daily by 16:00 using GL balances and the catalogue formula. Each bucket is compared against its Board-approved limit; a breach triggers an immediate alert and a disposition workflow. When a large unscheduled flow is detected intraday (threshold defined in the limit registry), the mismatch engine recomputes immediately. Breach dispositions are write-restricted to the CFO; read access is available to ALCO and Treasury Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | GL balances (`gl.balances`), catalogue formula (`catalogue.formula`), limit set (`limit_set.parameters`) | Gap table by bucket (`mismatch.current_gaps`) + breach flag if applicable (`mismatch.limit.breached`) | Daily by 16:00 (enforced by `mismatch.compute_due_at`) |
| Large unscheduled flow detected (`liquidity.large_flow.detected`) | Flow amount (`liquidity.large_flow`), updated GL snapshot (`gl.balances`) | Intraday recomputed gap table (`mismatch.intraday_recomputed`) | Immediate |
| Mismatch limit breached (`mismatch.limit.breached`) | Breached bucket (`mismatch.breached_bucket`), breach magnitude (`mismatch.breach_magnitude`), CFO disposition | Disposition record (`mismatch.breach.dispositioned`) | Same business day |

**ALERTS/METRICS:** Alert `alert.mismatch_breach` fires on any bucket breach; target zero unresolved breaches at EOD. Intraday recompute latency monitored; target <15 minutes from flow detection to updated gap table.

---

## LQ-04 — Survival Horizon and Coverage Days {#lq-04-survival-horizon-and-coverage-days}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the CFP be grounded in quantitative projections of funding adequacy under stress. Survival-horizon modeling translates stress scenarios into actionable day-counts.

**SYSTEM BEHAVIOR:** The system models survival days — the number of days the credit union can meet obligations without new external funding — under idiosyncratic and combined stress scenarios. Quarterly runs use the approved scenario set; an ad-hoc run is triggered within 2 business days when any early-warning indicator spikes to a major-event state. Results feed directly into CFP activation thresholds in LQ-14. The model is owned by the CFO; independent review is conducted annually per LQ-08. Ad-hoc runs require CFO authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter opens (`stress.quarter_open`) | Approved scenario set (`stress.set`), behavioral assumptions (`stress.behavioral_assumptions`), collateral haircuts (`collateral.eligibility_rules`) | Survival horizon pack with days by scenario (`survival.computed`) | Quarterly (enforced by `survival.quarterly_due_at`) |
| Major EWI spike flagged (`ewi.major_event.flagged`) | Updated EWI values (`ewi.value`), scenario set (`stress.set`) | Ad-hoc survival recompute (`survival.adhoc_computed`) | 2 BD (enforced by `stress.rerun_due_at`) |
| Survival falls below CFP threshold (`survival.below_threshold`) | Days combined (`survival.days_combined`), driver scenario (`survival.driver_scenario`) | CFP trigger signal (`liquidity.cfp_trigger.breached`) + NCUA notification check | Immediate |

**ALERTS/METRICS:** Alert `alert.survival_low` fires when combined survival days fall below 30 (Watch) or 15 (notification threshold). Target: quarterly model run completed within 5 BD of quarter open; ad-hoc run within 2 BD of EWI spike.

---

## LQ-05 — Liquid Assets Ratio Bands {#lq-05-liquid-assets-ratio-bands}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires maintenance of adequate liquid assets and a mechanism to detect deterioration. LAR bands provide the primary real-time signal for CFP activation.

**SYSTEM BEHAVIOR:** The system computes LAR daily by 16:00 and classifies it into four policy-set bands: Normal (≥10%), Watch (<10%), Low (<8%), Critical (<6%). A band change triggers a real-time alert and, at Low or Critical, initiates CFP activation per LQ-14. The LAR value and band are the primary inputs to the daily ops pack (LQ-09) and the NCUA notification check (LQ-10). LAR computation is write-restricted to Treasury Operations; the CCO and CFO receive real-time alerts on any band change.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | Liquid assets (`liquidity.liquid_assets`), total assets (`liquidity.total_assets`), catalogue formula (`catalogue.formula`) | LAR value (`lar.value`), current band (`lar.current_band`) (`lar.computed`) | Daily by 16:00 (enforced by `lar.compute_due_at`) |
| LAR band changes (`lar.band.changed`) | Prior band (`lar.prior_band`), current band (`lar.current_band`), LAR value (`lar.value`) | Band-change alert (`lar.band_alert.issued`) + CFP trigger if Low/Critical | Immediate (real-time) |
| LAR falls below 6% (`lar.critical.breached`) | LAR value (`lar.value`), timestamp | Critical breach record + NCUA notification trigger (`ncua.notification_required`) | Immediate |

**ALERTS/METRICS:** Alert `alert.lar_band_change` fires on every band transition; `alert.survival_low` fires when LAR enters Critical. Target: zero days where LAR computation is not completed by 16:00; zero unacknowledged Critical breaches.

---

## LQ-06 — Funding Concentration and Counterparty Limits {#lq-06-funding-concentration-and-counterparty-limits}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires diversification of funding sources and monitoring of concentrations. Single-provider reliance limits reduce cliff-edge withdrawal risk.

**SYSTEM BEHAVIOR:** The system tracks top-10 depositor balances and single-provider/facility reliance daily, comparing each against Board-approved limits. A limit breach opens a waiver workflow that must be resolved within 2 business days; the CFO owns the waiver decision and documents the rationale. Concentration data feeds the daily ops pack and the weekly ALCO digest. Waiver approvals are write-restricted to the CFO; ALCO members have read access. BaaS partner flows are included in concentration calculations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | Depositor file (`liquidity.depositor_file`), facility balances (`liquidity.system_balances`), limit set (`limit_set.parameters`) | Concentration report (`concentration.computed`), top-10 snapshot (`concentration.top10`) | Daily by 16:00 (enforced by `concentration.compute_due_at`) |
| Concentration limit exceeded (`liquidity.concentration.breached`) | Excess amount (`concentration.excess_amount`), position ID (`concentration.position_id`), reviewer (`concentration.reviewer_id`) | Waiver workflow opened (`concentration.waiver.opened`) | Immediate |
| Waiver decided (`concentration.waiver.decided`) | Waiver terms (`concentration.waiver_terms`), CFO rationale | Waiver decision record (`concentration.waiver.resolved`) | 2 BD (enforced by `concentration.waiver_due_at`) |

**ALERTS/METRICS:** Alert `alert.concentration_breach` fires on any limit breach; target zero waivers outstanding beyond 2 BD. Monthly ALCO review of concentration trends is tracked via the weekly digest cadence in LQ-09.

---

## LQ-07 — Stress Testing {#lq-07-stress-testing}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires stress testing to validate the CFP and ensure the credit union can survive adverse scenarios. Scenario coverage must include institution-specific and systemic events.

**SYSTEM BEHAVIOR:** The program runs four scenario types quarterly: idiosyncratic (e.g., large depositor withdrawal, BaaS partner shock), systemic (e.g., market dislocation), combined (idiosyncratic + systemic), and intraday peak. Each scenario produces a survival horizon, a funding gap profile, and a set of required CFP actions. An ad-hoc rerun is triggered within 5 business days of a major EWI event. Scenario assumptions are versioned and approved by the CFO; independent review of model assumptions occurs annually per LQ-08. Model builders and reviewers are segregated: Treasury Operations builds; the CCO or an independent party reviews.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter opens (`stress.quarter_open`) | Approved scenario set (`stress.set`), BaaS shock parameters (`stress.baas_shock_params`), intraday profile (`stress.intraday_profile`), behavioral assumptions (`stress.behavioral_assumptions`) | Stress pack with survival horizon and action plan deltas (`stress.pack.issued`) | Quarterly (enforced by `stress.quarterly_due_at`) |
| Major EWI spike (`ewi.major_event.flagged`) | Updated EWI values (`ewi.value`), current scenario set (`stress.set`) | Ad-hoc stress rerun results (`stress.adhoc_rerun.issued`) | 5 BD (enforced by `stress.rerun_due_at`) |
| Scenario assumption changed (`stress.assumption.changed`) | Change rationale (`stress.change_rationale`), prior assumption value (`stress.assumption_value`), CFO approval | Versioned assumption record (`stress.assumption_versioned`) | Before next scheduled run |

**ALERTS/METRICS:** Alert `alert.survival_low` fires when any scenario produces survival days below the Watch threshold. Target: quarterly stress pack issued within 5 BD of quarter open; ad-hoc rerun within 5 BD of trigger; zero runs with unapproved assumption changes.

---

## LQ-08 — Data Quality and Model Governance {#lq-08-data-quality-and-model-governance}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that liquidity measurement systems be reliable and that assumptions be documented and periodically reviewed. Model governance and data lineage are the controls that make measurements auditable.

**SYSTEM BEHAVIOR:** Data quality is enforced through a daily GL tie-out: the liquidity system reconciles its computed balances against the GL trial balance and flags any variance above a materiality threshold. Variances open a DQ investigation workflow. The model assumption catalogue is maintained in the `stress` object; all assumption changes require CFO approval and are versioned. An independent model review is conducted annually; the reviewer must be organizationally separate from the model builders (Treasury Operations builds; CCO or external party reviews). The model review report is delivered to ALCO and the Board. Write access to assumption records is restricted to the CFO; the model reviewer has read-only access during the review period.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | GL trial balance (`gl.trial_balance`), liquidity system balances (`liquidity.system_balances`), materiality threshold (`catalogue.definition`) | Tie-out result; variance flag if applicable (`dq.tieout.completed`) | Daily by 16:00 (enforced by `dq.tieout_due_at`) |
| DQ variance detected (`dq.variance.detected`) | Variance amount (`dq.variance_amount`), affected metrics | DQ investigation opened (`dq.investigation.opened`) | Immediate |
| Annual model review due (`model.review_due_at`) | Model documentation, assumption catalogue (`stress.set`), builder roster (`model.builder_roster`), independent reviewer (`model.reviewer_id`) | Model review report (`model.review.completed`) | Annual (enforced by `model.review_due_at`) |

**ALERTS/METRICS:** Alert `alert.dq_variance` fires on any tie-out variance above materiality; target zero unresolved variances at start of next business day. Annual model review completion tracked; target zero overdue reviews.

---

## LQ-09 — Reporting Cadence {#lq-09-reporting-cadence}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires regular reporting to management and the Board on the liquidity risk profile. Automated, time-bound report generation ensures consistent information flow.

**SYSTEM BEHAVIOR:** Three report artifacts are auto-generated on fixed schedules: (1) a daily ops pack containing LAR, band, cumulative gaps, top-10 depositor concentrations, and facility headroom; (2) a weekly ALCO digest containing trend deltas and EWI summary; and (3) a quarterly Board deck containing full program metrics, stress results, and survival horizon. Each report requires a sign-off from the designated recipient before the next cycle opens. The CFO signs the daily pack; the ALCO chair signs the weekly digest; the Board chair signs the quarterly deck. Report generation is automated by Treasury Operations; sign-off is write-restricted to the designated signatories.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD computations complete (`liquidity.eod.posted`) | LAR (`lar.value`), gaps (`mismatch.current_gaps`), concentrations (`concentration.top10`), headroom (`collateral.headroom_computed`), facility status (`facility.contacts`) | Daily ops pack (`report.daily_pack.published`) | 17:00 daily (enforced by `report.daily_due_at`) |
| Friday close (`gl.eod.closed` on Friday) | Prior-week daily packs, EWI trend (`ewi.trend`), EWI history (`ewi.history`) | Weekly ALCO digest (`report.weekly_digest.published`) | Friday 12:00 (enforced by `report.weekly_due_at`) |
| Quarter-end + 5 BD (`stress.pack.issued` for quarter) | Stress pack (`stress.pack`), survival horizon (`survival.days_combined`), full program metrics | Quarterly Board deck (`report.board_deck.published`) | +5 BD from quarter-end (enforced by `report.board_due_at`) |

**ALERTS/METRICS:** Alert fires when any report is not published by its deadline; target 100% on-time publication rate. Sign-off latency tracked; target sign-off within 1 BD of publication for daily and weekly reports.

---

## LQ-10 — Regulatory Notification {#lq-10-regulatory-notification}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires timely communication with NCUA when material liquidity stress occurs. Prompt notification preserves the regulator's ability to assist and demonstrates supervisory cooperation.

**SYSTEM BEHAVIOR:** The system monitors four notification triggers: CFP Level 2 or 3 activation, use or attempted use of a federal contingent liquidity facility (CLF or Discount Window), combined survival horizon falling below 15 days, or LAR falling below 6%. When any trigger fires, the CCO drafts an event memo and the CEO sends it to the NCUA examiner-in-charge and regional office within 24 hours. After-hours triggers must be sent by 10:00 the next calendar day with the delay documented. The CEO is the sole sender; the CFO drafts; the Board Chair is copied. Notification records are retained per LQ-15.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Notification trigger fires (`ncua.notification_required` = true) | Trigger condition (`ncua.trigger_condition`), metrics snapshot (`ncua.metrics_snapshot`), examiner contacts (`regulator.contacts`) | Event memo drafted (`ncua.memo`) | Immediate on trigger |
| Notification sent (`ncua.notification.sent`) | Signed memo (`ncua.memo`), metrics pack (`ncua.metrics_snapshot`), send timestamp | Notification log entry (`ncua.notification.sent`) | 24 hours from trigger (enforced by `ncua.notification_due_at`) |
| NCUA acknowledgment received (`ncua.ack.received`) | Acknowledgment detail (`ncua.ack_detail`) | Acknowledgment log (`ncua.ack.logged`) | Upon receipt |

**ALERTS/METRICS:** Alert `alert.ncua_notification_aging` fires when a notification is not sent within 20 hours of trigger. Target: 100% of notifications sent within 24 hours; zero unacknowledged notifications after 3 BD.

---

## LQ-11 — Contingent Federal Liquidity Access {#lq-11-contingent-federal-liquidity-access}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires credit unions ≥$250MM to document access to a federal contingent liquidity source. The [Central Liquidity Facility statute (12 U.S.C. §§1795–1795k)](https://www.law.cornell.edu/uscode/text/12/chapter-14) and [Federal Reserve advances authority (12 U.S.C. §347b)](https://www.law.cornell.edu/uscode/text/12/347b) are the two permissible federal backstops.

**SYSTEM BEHAVIOR:** The credit union maintains CLF membership or agent-member access and Federal Reserve Discount Window operational readiness. Collateral schedules for both facilities are kept current and updated daily as part of LQ-12. An annual test — either a funded draw or a no-funds operational test — is conducted for at least one federal facility; the test confirms that legal documents are current, collateral can be moved, and the draw process works end-to-end. The CFO and CEO co-own the test; results and any remediation items are documented in an after-action review published within 10 business days. Facility contacts are maintained in `facility.contacts` and verified at least annually.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual test due (`facility.annual_test_due`) | Test script (`facility.test_script`), participant roster (`drill.roster`), collateral schedule (`facility.collateral_schedule`), facility contacts (`facility.contacts`) | Test completion record (`facility.test.completed`) | Annual (enforced by `facility.annual.test.due`) |
| Test completed (`facility.test.completed`) | Test results, failure detail if applicable (`drill.failure_detail`) | After-action review (`drill.aar.published`) | 10 BD from test date (enforced by `drill.aar_due_at`) |
| Federal facility used or attempted (`funding.external_draw.requested`) | Draw amount (`funding.draw_amount`), facility ID, dual-authorization record (`funding.external_draw`) | Draw execution record (`funding.draw.executed`) + NCUA notification trigger | Immediate; NCUA within 24 hours |

**ALERTS/METRICS:** Alert `alert.facility_readiness_aging` fires when the annual test is overdue or when collateral schedules have not been updated within 2 BD. Target: annual test completed before fiscal year-end; zero overdue AAR publications.

---

## LQ-12 — Collateral and Encumbrance Management {#lq-12-collateral-and-encumbrance-management}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the credit union know its available collateral at all times. Accurate encumbrance tracking is a prerequisite for executing the funding playbook in LQ-14.

**SYSTEM BEHAVIOR:** The system tracks eligible and unencumbered collateral balances, haircuts by counterparty, and pledge schedules daily. After any large collateral move (threshold defined in the limit registry), headroom is recomputed immediately. All pledge and release actions require dual control: two authorized Treasury Operations staff must approve each transaction. The collateral inventory is updated daily by 16:00; the pledge schedule is the authoritative source for facility headroom calculations in LQ-11 and LQ-14. Write access to pledge records is restricted to dual-authorized Treasury Operations staff; the CFO has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | Collateral inventory (`collateral.inventory`), eligibility rules (`collateral.eligibility_rules`), haircut table (`liquidity.haircut_table`), counterparty ID (`collateral.counterparty_id`) | Updated collateral file (`collateral.file.posted`), headroom computed (`collateral.headroom_computed`) | Daily by 16:00 (enforced by `collateral.compute_due_at`) |
| Large collateral move detected (`collateral.large_move.detected`) | Move detail (`collateral.move_detail`), updated fair value (`collateral.fair_value`) | Headroom recheck (`collateral.headroom_rechecked`) | Immediate |
| Pledge or release executed (`collateral.pledge.executed`) | Dual-authorization record, pledge schedule update (`collateral.pledge_schedule`), unencumbered balance (`collateral.unencumbered_balance`) | Pledge record (`collateral.pledge.executed`) | Immediate; dual auth required before execution |

**ALERTS/METRICS:** Alert `alert.headroom_low` fires when unencumbered collateral headroom falls below the policy floor. Target: daily update completed by 16:00; zero pledges executed without dual authorization.

---

## LQ-13 — Wholesale and Listing-Service Deposit Guardrails {#lq-13-wholesale-and-listing-service-deposit-guardrails}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that wholesale and rate-sensitive funding be managed within defined limits to prevent over-reliance. Listing-service deposits are a permissible contingent source when governed by tenor laddering and pricing authority controls.

**SYSTEM BEHAVIOR:** Only ALCO-approved listing services may be used. Each listing-service engagement must comply with tenor laddering requirements (no more than a Board-approved percentage maturing in any single month or quarter) and pricing authority limits (rates set only by designated pricing officers). Wholesale exposure is computed and compared against limits daily; the monthly ALCO review assesses trends and approves any new listing-service relationships. Pricing authority is write-restricted to designated pricing officers; ALCO approves new services and limit changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD GL posted (`gl.eod.closed`) | Wholesale balances by service (`wholesale.exposure_history`), tenor calendar (`wholesale.maturity_calendar`), limit set (`limit_set.parameters`) | Daily exposure report (`wholesale.exposure.posted`) | Daily by 16:00 (enforced by `wholesale.compute_due_at`) |
| New listing-service deposit requested (`wholesale.listing.requested`) | Service ID (`wholesale.service_id`), tenor (`wholesale.tenor`), rate (`wholesale.rate`), pricing authority ID (`wholesale.pricing_authority_id`) | Listing decision record (`wholesale.listing_decisioned`) | Before settlement |
| Monthly ALCO review (`alco.ratio_review.logged`) | Exposure history (`wholesale.exposure_history`), tenor ladder (`wholesale.tenor_ladder`), limit utilization | Monthly review record (`wholesale.review.completed`) | Monthly (enforced by `wholesale.monthly_review_due`) |

**ALERTS/METRICS:** Alert `alert.wholesale_pricing_violation` fires when a rate is set outside pricing authority. Target: zero pricing violations; monthly ALCO review completed within 5 BD of month-end.

---

## LQ-14 — CFP Activation and Escalation {#lq-14-cfp-activation-and-escalation}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a written CFP with defined activation criteria, escalation procedures, and executable action plans. Timely activation preserves funding options before a stress event becomes a crisis.

**SYSTEM BEHAVIOR:** The CFP has three activation levels tied to LAR bands and survival horizon: Level 1 Watch (LAR <10% or sustained EWI red), Level 2 Low (LAR <8% or survival <30d idiosyncratic / <20d combined), Level 3 Critical (LAR <6% or survival <15d combined or outflow ≥40%/10d). Level 1 triggers enhanced monitoring and facility pre-staging. Level 2 and 3 trigger the crisis team convene within 60 minutes and first-line funding actions within 2 hours. External draws at Level 2 and above require dual authorization. The CEO authorizes Level 2/3 activation; the CFO executes funding operations; ALCO advises; the Board authorizes extraordinary measures. The CEO is the sole external spokesperson. CFP level changes are logged immediately; the transition timer (`cfp.transition_due_at`) enforces the 2-hour action deadline.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| LAR or survival threshold crossed (`lar.band.changed` or `survival.below_threshold`) | Current LAR (`lar.value`), survival days (`survival.days_combined`), prior CFP level (`cfp.level`) | CFP level change record (`cfp.level.changed`) | Immediate |
| Level 2 or 3 activated (`cfp.level.changed` to Low or Critical) | Crisis roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`), playbook spec (`playbook.spec`) | Crisis team convened (`crisis.team_convened`); transition timer started | 60 minutes to convene (enforced by `crisis.convene_due_at`) |
| First-line funding actions initiated (`funding.first_line.executed`) | Draw order (`cfp.liquidation_hierarchy`), dual-authorization record (`funding.external_draw`), source availability (`funding.next_source`) | First-line execution record (`funding.first_line.executed`) | 2 hours from Level 2/3 activation (enforced by `cfp.transition_due_at`) |
| CFP deactivated (`cfp.deactivated`) | Deactivation rationale, CFO sign-off | Deactivation record (`cfp.deactivated`) | Upon return to Normal band |

**ALERTS/METRICS:** Alert fires when crisis team is not convened within 60 minutes of Level 2/3 activation; alert fires when first-line actions are not initiated within 2 hours. Target: 100% of Level 2/3 events with documented convene and action timestamps within SLA.

---

## LQ-15 — Documentation and Retention {#lq-15-documentation-and-retention}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the credit union maintain evidence of its liquidity program for examiner review. A 10-year retention period covers the full examination cycle and supports legal-hold capability.

**SYSTEM BEHAVIOR:** All liquidity program artifacts — policy versions, limit registries, daily ops packs, weekly digests, quarterly Board decks, stress packs, NCUA notifications, facility test reports, drill AARs, and model review reports — are retained for 10 years from creation date. Each artifact must be indexed within 2 business days of finalization. The CCO owns the retention program; the records management team executes indexing. Legal-hold capability is provided by the shared SC-02 control embedded below. Write access to the retention index is restricted to the records management team; the CCO and legal counsel have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Liquidity artifact finalized (any `*.published`, `*.issued`, `*.completed`, or `*.sent` event for a program artifact) | Artifact blob (`record.blob`), metadata (`record.metadata`), retention class (10 years) (`record.retention_class`) | Indexed archive entry (`record.indexed`) | 2 BD from finalization (enforced by `record.index_due_at`) |
| Retention period expires (`record.retention.expired`) | Record ID (`record.id`), retention anchor (`record.retention_anchor`), legal-hold flag (`record.legal_hold_flag`) | Disposition eligibility flag (destruction governed by SC-02) | Per SC-02 lifecycle |

**ALERTS/METRICS:** Alert fires when any artifact is not indexed within 2 BD of finalization; target zero indexing latency breaches. Retention gap report reviewed quarterly; target zero records without a retention class assigned.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** NCUA record-keeping obligations under [12 CFR §749](https://www.ecfr.gov/current/title-12/part-749) require federally insured credit unions to retain specified records for defined periods and to produce them on examiner request. Destruction without authorization, or failure to suspend destruction under a legal hold, exposes the credit union to regulatory sanction and litigation risk.

**SYSTEM BEHAVIOR:** Once a record's retention anchor date is set, the system starts a retention timer (`record.retention.timer`) that expires at anchor + retention period. On expiry the record transitions to `disposal_eligible = true`; no destruction occurs automatically. A destruction batch requires an authorized disposal certificate and a check that `record.legal_hold_flag` is false. Legal holds are placed by the CCO or legal counsel and block destruction for all records within the hold scope until explicitly released; the hold registry (`record.hold_registry`) is the authoritative source. Permanent records (retention class `permanent`) are never flagged `disposal_eligible`. Media conversion (paper → digital) resets the integrity-test clock but does not change the retention anchor. All destruction events write an immutable entry to the destruction log. Write access to hold placement and release is restricted to the CCO and legal counsel; records management executes destruction only after dual sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record created or received (`record.created`) | Record type, subject reference, retention schedule (`record.retention_schedule`), anchor date (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`); timer `record.retention.timer` started | Immediate on creation |
| Retention period expires (`record.retention.expired`) | Record ID (`record.id`), legal-hold flag (`record.legal_hold_flag`), retention class (`record.retention_class`) | Disposal-eligibility flag set if no hold and not permanent; logged (`record.dispositioned`) | Immediate on expiry |
| Legal hold placed (`record.hold.placed`) | Hold scope (`record.hold_scope`), matter ID (`record.hold_matter_id`), authorizer (`record.hold_authorizer`) | Hold registry entry (`record.hold_registry`); destruction blocked for all in-scope records | Immediate |
| Legal hold released (`record.hold.released`) | Release authorization (`record.hold_release_auth`), matter closure confirmation | Hold registry updated; disposal eligibility re-evaluated (`record.hold.released`) | Immediate on authorization |
| Destruction authorized (`record.destruction.initiated`) | Disposal certificate (`disposal.certificate`), dual sign-off, confirmed `legal_hold_flag = false` | Destruction log entry (`record.destroyed`); immutable audit trail | Before physical/digital destruction |
| Media conversion completed (`record.conversion.certified`) | Conversion method, integrity verification result (`record.reproduction_result`) | Conversion certificate (`record.conversion.certified`); integrity-test clock reset | Within 5 BD of conversion |
| Integrity test due (`record.integrity.test.due`) | Sample set, test method | Integrity test result (`record.audit.completed`) | Per schedule (enforced by `record.integrity_test_due`) |

**ALERTS/METRICS:** Alert fires when any record reaches `disposal_eligible` without a destruction decision within 30 days; alert fires when a legal-hold placement is not confirmed in the hold registry within 1 BD. Destruction log reconciled monthly against disposal-eligible records; target zero unlogged destructions.

---

## LQ-16 — Liquidity Drills and After-Action Reviews {#lq-16-liquidity-drills-and-after-action-reviews}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires that the CFP be tested to confirm operational readiness. Annual drills and after-action reviews close the loop between plan design and execution capability.

**SYSTEM BEHAVIOR:** An annual tabletop exercise simulates a CFP activation scenario; the annual federal facility test (LQ-11) counts as the facility-readiness component. The drill tests crisis team convene time, communication protocols, playbook execution, and regulator notification. An after-action review (AAR) is published within 10 business days of each drill, identifying gaps, remediation owners, and target dates. Remediation items are tracked as open findings until closed. The CFO and CEO co-own the drill; the CCO publishes the AAR. Drill results and AARs are retained per LQ-15.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual drill scheduled (`exercise.scheduled`) | Drill objectives (`drill.objectives`), participant roster (`drill.roster`), scenario elements (`drill.element`) | Drill completion record (`drill.completed`) | Annual |
| Drill completed (`drill.completed`) | Failure detail if applicable (`drill.failure_detail`), corrective plan (`drill.corrective_plan`) | After-action review (`drill.aar.published`) with remediation owners and dates (`drill.remediation_owner`) | 10 BD from drill date (enforced by `drill.aar_due_at`) |
| Remediation item opened (`drill.corrective_plan.opened`) | Remediation item (`drill.remediation_item`), owner, target date (`drill.remediation.due_at`) | Open finding tracked until closed (`drill.remediation.closed`) | Per AAR target date |

**ALERTS/METRICS:** Alert fires when AAR is not published within 10 BD of drill completion. Target: 100% of remediation items closed by AAR target date; annual drill completed before fiscal year-end.

---

## LQ-17 — Regulator Liaison Protocols {#lq-17-regulator-liaison-protocols}

**WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires cooperation with NCUA examination and supervision. Maintaining current examiner contacts and responding promptly to requests demonstrates supervisory responsiveness.

**SYSTEM BEHAVIOR:** The CCO maintains a current list of NCUA examiner-in-charge and regional office contacts, verified at least annually. All regulator requests are logged on receipt and routed to the CFO for response coordination. Responses are due within 1 business day unless the regulator specifies otherwise; the CCO documents any extended deadline in the request record. Event memos for CFP activations and federal facility use (LQ-10) are filed in the regulator contact record. Write access to the regulator contact record is restricted to the CCO; the CFO has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulator request received (`regulator.request.received`) | Request detail (`regulator.request_detail`), receipt timestamp | Request routed to CFO (`regulator.request.routed`) | Immediate on receipt |
| Response sent (`regulator.response.sent`) | Response package, send timestamp, regulator contact (`regulator.contacts`) | Response log entry (`regulator.response.sent`) | 1 BD from receipt (enforced by `regulator.response.due_at`) |
| Annual contact verification due (`regulator.contact.verification.due`) | Current contact list (`regulator.contacts`), verification method | Verified contact record (`regulator.contacts.verified`) | Annual (enforced by `regulator.contact_verification_due`) |

**ALERTS/METRICS:** Alert `alert.regulator_request_aging` fires when a response is not sent within 20 hours of receipt. Target: 100% of responses within 1 BD; annual contact verification completed before fiscal year-end.

---

## Governance and Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves limit registry changes; owns model governance and retention program |
| **CFO** | Program owner; day-to-day liquidity operations; executes funding draws; signs daily ops pack |
| **CEO** | Authorizes Level 2/3 CFP activation; sole external spokesperson; sends NCUA notifications |
| **ALCO** | Advisory body; approves wholesale/listing-service relationships; reviews weekly digest and quarterly deck |
| **Treasury Operations** | Computes daily metrics; executes collateral pledges (dual control); generates reports |
| **Board of Directors** | Approves policy annually; approves limit registry; receives quarterly Board deck; authorizes extraordinary measures |

**Review cadence:** Annual Board approval; ad-hoc review within 10 business days of any material change (new product, new BaaS partner, regulatory amendment, or limit breach pattern). Cross-references: Investment Policy (AFS marketability and haircut schedules), Capitalization Policy (capital adequacy), Cash Policy (vault operations), Enterprise Risk Management Policy (enterprise risk appetite), Business Continuity Plan (operational resilience).

---

## Assumptions and Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The liquidity-domain objects (`lar`, `mismatch`, `survival`, `stress`, `ewi`, `cfp`, `collateral`, `concentration`, `wholesale`, `funding`, `catalogue`, `facility`, `report`, `ncua`, `regulator`, `drill`, `crisis`, `comms`, `alco`, `model`, `dq`, `record`, `policy`, `limit_set`, `playbook`) and their fields and events are registered in `core-vocabulary.json` and used verbatim above. Any field or event code cited in this document that is not yet confirmed in the engineering build will be flagged during the vocabulary registration sprint before the effective date.

- **LAR band thresholds (10% / 8% / 6%) and survival-day thresholds (30d idiosyncratic / 20d combined / 15d combined) are policy-set defaults** operationalizing §741.12 and require explicit Board confirmation at the first annual review. The limit registry is the authoritative source once confirmed.

- **NCUA asset-size threshold.** The $250MM threshold for mandatory documented federal contingent liquidity access (CLF or Discount Window) is assumed to apply to Pynthia Credit Union. If total assets are below $250MM, LQ-11 remains best practice but the federal-access documentation requirement is not mandatory under §741.12; confirm with legal counsel.

- **FHLB eligibility.** The funding playbook in LQ-14 references FHLB advances as a contingent external source. FHLB membership eligibility for credit unions depends on district rules and collateral programs. Confirm current eligibility and advance capacity with the relevant FHLB district before the effective date.

- **BaaS partner flow classification.** BaaS partner deposit and withdrawal flows are included in concentration calculations (LQ-06) and stress scenarios (LQ-07). The specific behavioral assumptions (runoff rates, intraday peak profiles) for each BaaS partner are treated as provisional until the first quarterly stress run validates them against observed flow data.

- **Intraday large-flow threshold.** The dollar threshold that triggers an intraday mismatch recompute (LQ-03) and a collateral headroom recheck (LQ-12) is referenced as "defined in the limit registry" and requires Board approval at the first annual review.

- **Wholesale listing-service tenor laddering limits** (maximum percentage maturing in any single month or quarter) are referenced as "Board-approved" and must be set in the limit registry before the first wholesale deposit is placed under this policy.

- **Model builder / reviewer segregation.** The policy assigns model building to Treasury Operations and independent review to the CCO or an external party. If the CCO is also involved in model design, an external reviewer must be engaged for the annual model review to satisfy the segregation requirement in LQ-08.

- **CFP Level 1 Watch actions** (enhanced monitoring, facility pre-staging) are described at a high level. Detailed playbook steps for Level 1 are maintained in the CFP playbook artifact (`playbook.spec`) and are not reproduced in this policy to avoid duplication; the playbook must be approved by the CFO before the effective date.
```
