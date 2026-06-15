---
title: Liquidity Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Liquidity, Contingency Funding Plan, CFP, ALCO, NCUA]
---

## General Policy Statement

Pynthia Credit Union maintains a board-approved, risk-based liquidity program and a written Contingency Funding Plan (CFP) that measure, limit, and report cash-flow mismatch, funding concentration, and survival capacity under normal and stressed conditions across all funding and balance-sheet activities, including BaaS partner flows. The Liquidity Policy governs measurement and limits in normal conditions; the CFP defines detection, escalation, and execution of funding actions when indicators breach triggers. The program aligns to NCUA requirements, maintains federal contingent-liquidity access (CLF and/or Discount Window), and excludes investment-portfolio credit/valuation, capital adequacy, physical cash/vault operations, enterprise risk-appetite governance beyond liquidity, business continuity, and OCC/FDIC frameworks (governed by their respective policies).

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Daily mismatch gaps computed against limits | EOD liquidity data posted (`liquidity.eod_posted`) | Daily by 16:00 | Cumulative gap schedule by bucket | [LP-03](#lp-03-maturity-mismatch-limits) |
| Intraday recompute on large unscheduled flow | Large flow detected (`liquidity.large_flow_detected`) | Intraday, real-time | Updated gap schedule | [LP-03](#lp-03-maturity-mismatch-limits) |
| LAR computed and banded | EOD liquidity data posted (`liquidity.eod_posted`) | Daily by 16:00 | LAR value + band classification | [LP-05](#lp-05-liquid-assets-ratio-bands) |
| LAR band breach alert | Band changed (`lar.band_changed`) | Real-time | Band-change alert | [LP-05](#lp-05-liquid-assets-ratio-bands) |
| Concentration waiver resolution | Limit exceeded (`liquidity.concentration_breached`) | 2 business days | Waiver decision record | [LP-06](#lp-06-funding-concentration-and-counterparty-limits) |
| Survival horizon ad-hoc rerun | EWI spike flagged (`ewi.spike_flagged`) | 2 business days | Survival-day pack | [LP-04](#lp-04-survival-horizon-and-coverage-days) |
| Stress scenario rerun on major EWI | Major EWI flagged (`ewi.major_event_flagged`) | 5 business days | Stress pack with deltas | [LP-07](#lp-07-stress-testing) |
| Daily ops pack published | GL/data posted (`liquidity.eod_posted`) | 17:00 daily | Daily ops pack | [LP-09](#lp-09-reporting-cadence) |
| Weekly ALCO digest published | Weekly cycle (`report.weekly_digest_published`) | Fri 12:00 | ALCO digest | [LP-09](#lp-09-reporting-cadence) |
| Quarterly Board deck published | Quarter close (`report.board_deck_published`) | +5 business days | Board deck | [LP-09](#lp-09-reporting-cadence) |
| NCUA notification | Notify criteria met (`ncua.notification_required`) | 24 hours | Event memo to examiner/region | [LP-10](#lp-10-regulatory-notification) |
| CFP Level 2/3 transition actions | Level changed (`cfp.level_changed`) | 2 hours | Transition tasking orders | [LP-14](#lp-14-cfp-purpose-and-activation) |
| Crisis team convened | Level 2/3 active (`cfp.level_changed`) | 60 minutes | Crisis decision log | [LP-16](#lp-16-escalation-ladder-and-crisis-roles) |
| First-line funding actions executed | Level 2 funding shortfall (`funding.shortfall_estimate` via `cfp.level_changed`) | 2 hours | Draw confirmations | [LP-17](#lp-17-funding-playbooks-and-draw-order) |
| External Level 2/3 communications | Level 2/3 active (`cfp.level_changed`) | Same day | Approved stakeholder notices | [LP-18](#lp-18-external-communications-and-stakeholder-matrix) |
| Regulator request response | Request received (`regulator.request_received`) | 1 business day | Response package | [LP-19](#lp-19-regulator-liaison-protocols) |
| After-action review published | Drill completed (`drill.completed`) | 10 business days | AAR with owners/dates | [LP-20](#lp-20-liquidity-drills-and-after-action-reviews) |
| Annual federal facility test | Test due (`cfp.investment_test_due`) | Annual | Facility test report | [LP-11](#lp-11-contingent-federal-liquidity-access) |
| Document indexed | Artifact finalized (`record.created`) | 2 business days | Searchable index entry | [LP-21](#lp-21-documentation-and-retention) |

---

## LP-01 — Policy Scope, Risk Appetite & Limit Registry

- **WHY (Reg cite):** NCUA requires a board-approved liquidity policy and written CFP for credit unions ≥ $50MM ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** A single, versioned liquidity standard and limit registry applies across all in-scope funding and balance-sheet activities, including BaaS partner flows. The registry is reviewed at least annually and ad-hoc within 10 business days of a material change; each version captures limits, effective dates, and approver. The limit registry and policy document are write-restricted to Compliance with CFO/Board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual review cycle opens or material change declared (`policy.board_review_started`, `strategy.material_change_declared`) | Policy doc (`policy.document_id`), version (`policy.document_version`), limit registry (`policy.limit_registry`), change rationale (`policy.change_rationale`) | Updated versioned policy + limit registry (`policy.version_published`) | Annual; ad-hoc within 10 BD (enforced by `policy.review_due_at`) |
  | Board approves policy version (`policy.board_approved`) | Approver identity (`policy.owner_ref`), minutes (`policy.minutes_reference`) | Board approval record (`policy.version_approved`) | At review (enforced by `policy.board_approval_due_at`) |

- **ALERTS/METRICS:** Alert on policy review past-due (`policy.review_warning_issued`); target zero overdue reviews; track days-to-update after material change.

---

## LP-02 — Definitions & Ratios Catalogue

- **WHY (Reg cite):** Standardized, timely liquidity measurement underpins a sound program ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** A central catalogue defines standardized metrics (LAR, cumulative mismatch, survival horizon, concentration) with formulas and data lineage, kept synced to GL mapping daily. A sync failure surfaces as a provisional state with an alert rather than silently stale values. Catalogue definitions are write-restricted to Compliance with model-governance review.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Metric definition change requested (`catalogue.change_requested`) | Formula (`catalogue.formula`), lineage (`catalogue.lineage`), approver (`catalogue.approver_id`) | Updated metric definition (`catalogue.definition_updated`) | Per change (no registered timer) |
  | Daily GL-to-catalogue sync runs (`catalogue.sync_completed`) | GL mapping (`gl.coa_map`), trial balance (`gl.trial_balance`) | Sync confirmation (`catalogue.sync_completed`) | Daily (enforced by `catalogue.sync_due_at`) |
  | Sync fails (`catalogue.sync_failed`) | Failure reason (`catalogue.failure_reason`), provisional flags (`catalogue.metrics_flagged_provisional`) | Sync-failure record (`catalogue.sync_failed`) | Daily SLA (enforced by `catalogue.sync_due_at`) |

- **ALERTS/METRICS:** Alert on catalogue sync failure (`alert.catalogue_sync_failed`); target 100% daily sync success; track count of metrics flagged provisional.

---

## LP-03 — Maturity Mismatch Limits

- **WHY (Reg cite):** Cumulative cash-flow gap measurement against limits is core liquidity risk control ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Cumulative cash-flow gaps are computed daily by 16:00 across time buckets (O/N, 2–7d, 8–30d, 31–90d, 91–365d, >1y) against policy limits, and recomputed intraday on large unscheduled flows. A breach in any bucket opens a disposition record. Limit parameters are write-restricted to Compliance; the computation engine reads GL and position data.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD liquidity data posted (`liquidity.eod_posted`) | GL balances (`gl.balances`), positions (`position.book_value`), bucket limits (`policy.limit_registry`), current gaps (`mismatch.current_gaps`) | Cumulative gap schedule (`mismatch.gap_computed`) | Daily by 16:00 (enforced by `mismatch.compute_due_at`) |
  | Large unscheduled flow detected (`liquidity.large_flow_detected`) | Flow amount (`flow.amount`), direction (`flow.direction`) | Recomputed intraday gaps (`mismatch.intraday_recomputed`) | Intraday, real-time (no registered timer) |
  | Bucket limit breached (`mismatch.limit_breached`) | Breached bucket (`mismatch.breached_bucket`), magnitude (`mismatch.breach_magnitude`) | Breach disposition record (`mismatch.breach_dispositioned`) | Same day (no registered timer) |

- **ALERTS/METRICS:** Alert on mismatch limit breach (`alert.mismatch_breach`); target zero unremediated bucket breaches; track intraday recompute latency.

---

## LP-04 — Survival Horizon & Coverage Days

- **WHY (Reg cite):** Survival-horizon modeling demonstrates capacity to withstand idiosyncratic and combined stress ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Survival days are modeled quarterly under idiosyncratic and combined stress, and ad-hoc within 2 business days when early-warning indicators spike. A result below the policy threshold drives notification and CFP review. Survival assumptions are write-restricted to Compliance and subject to independent model review.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly survival cycle opens (`survival.computed`) | Behavioral assumptions (`liquidity.behavioral_assumptions`), haircuts (`liquidity.haircut_table`), facility capacity (`liquidity.clf_capacity`) | Survival-day result (`survival.computed`) | Quarterly (enforced by `survival.quarterly_due_at`) |
  | EWI spikes (`ewi.spike_flagged`) | Driver scenario (`survival.driver_scenario`), combined days (`survival.days_combined`) | Ad-hoc survival pack (`survival.adhoc_computed`) | 2 BD (no registered timer) |
  | Survival below threshold (`survival.below_threshold`) | Threshold (`policy.limit_registry`), combined days (`survival.days_combined`) | Below-threshold record (`survival.below_threshold`) | Same day (no registered timer) |

- **ALERTS/METRICS:** Alert on survival below target (`alert.survival_low`); target survival ≥ policy floor under combined stress; track ad-hoc rerun turnaround.

---

## LP-05 — Liquid Assets Ratio Bands

- **WHY (Reg cite):** A maintained liquid-asset cushion and band discipline are central to the liquidity program ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** LAR is computed daily by 16:00 and classified into policy-set bands (Normal ≥10%; Watch <10%; Low <8%; Critical <6%), raising real-time alerts on a band change and tying Watch/Low/Critical to CFP Levels 1/2/3. A drop to Critical (<6%) also triggers NCUA notification. Band thresholds are write-restricted to Compliance with Board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD liquidity data posted (`liquidity.eod_posted`) | Liquid assets (`liquidity.liquid_assets`), total assets (`liquidity.total_assets`), band thresholds (`policy.limit_registry`) | LAR value + band (`lar.computed`) | Daily by 16:00 (enforced by `lar.compute_due_at`) |
  | LAR band changes (`lar.band_changed`) | Prior band (`lar.prior_band`), current band (`lar.current_band`) | Band-change alert (`lar.band_alert_issued`) | Real-time (no registered timer) |
  | LAR falls below 6% (`lar.critical_breached`) | LAR value (`lar.value`) | Critical-breach record + NCUA trigger (`lar.critical_breached`) | Real-time; notify 24h (enforced by `ncua.notification_due_at`) |

- **ALERTS/METRICS:** Alert on band change (`alert.lar_band_change`); target LAR in Normal band; track count of Watch/Low/Critical days per quarter.

---

## LP-06 — Funding Concentration & Counterparty Limits

- **WHY (Reg cite):** Funding diversification and counterparty limits mitigate liquidity risk from over-reliance ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Top-10 depositor and single-provider/facility reliance limits are computed daily; a breach opens a waiver workflow resolved within 2 business days by a designated reviewer. Concentration limits and waiver decisions are write-restricted to Compliance; the daily computation reads depositor and facility data.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Depositor file posted (`liquidity.depositor_file_posted`) | Top-10 exposures (`concentration.top10`), single-provider limits (`policy.limit_registry`) | Concentration computation (`concentration.computed`) | Daily (enforced by `concentration.compute_due_at`) |
  | Concentration limit exceeded (`liquidity.concentration_breached`) | Excess amount (`concentration.excess_amount`), position (`concentration.position_id`) | Waiver request opened (`concentration.waiver_opened`) | Same day (no registered timer) |
  | Waiver decisioned (`concentration.waiver_decided`) | Reviewer (`concentration.reviewer_id`), waiver terms (`concentration.waiver_terms`) | Waiver resolution record (`concentration.waiver_resolved`) | 2 BD (enforced by `concentration.waiver_due_at`) |

- **ALERTS/METRICS:** Alert on concentration breach (`alert.concentration_breach`); target zero unresolved waivers past 2 BD; track top-10 depositor share trend.

---

## LP-07 — Stress Testing

- **WHY (Reg cite):** Credible idiosyncratic, systemic, and combined stress testing underpins the CFP ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Idiosyncratic, systemic, and combined scenarios (including intraday peaks and BaaS shocks) are run quarterly and re-run within 5 business days on a major early-warning indicator. A scenario that breaches a minimum drives escalation and CFP review. Scenario assumptions are versioned and write-restricted to Compliance, with independent model review annually.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly stress cycle opens (`stress.quarter_open`) | Scenario set (`stress.behavioral_assumptions`), intraday profile (`stress.intraday_profile`), BaaS shock params (`stress.baas_shock_params`) | Stress pack with results (`stress.pack_issued`) | Quarterly (enforced by `stress.quarterly_due_at`) |
  | Major EWI flagged (`ewi.major_event_flagged`) | Changed assumptions (`stress.assumption_value`), rationale (`stress.change_rationale`) | Ad-hoc stress rerun (`stress.adhoc_rerun_issued`) | 5 BD (enforced by `stress.rerun_due_at`) |
  | Scenario minimum breached (`stress_test.minimum_breached`) | Breach detail (`stress_test.breach_detail`), failing scenario (`stress.assumption_versioned`) | Remediation escalation (`stress_test.remediation_escalated`) | Same day (no registered timer) |

- **ALERTS/METRICS:** Alert on stress minimum breach (`stress_test.minimum_breached`); target all scenarios above minimum; track ad-hoc rerun completion within 5 BD.

---

## LP-08 — Data Quality & Model Governance

- **WHY (Reg cite):** Reliable data lineage, GL tie-out, and independent model review ensure measurement integrity ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Data lineage and assumption catalogs are maintained, GL tie-out runs daily, and an independent model review is obtained annually with segregation between model builders and reviewers. A material tie-out variance opens an investigation. Model assumptions are write-restricted to Compliance; reviewer identity is segregated from the builder roster and enforced by control.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily GL tie-out runs (`dq.tieout_completed`) | GL balances (`gl.balances`), catalogue values (`catalogue.formula`) | Tie-out result (`dq.tieout_completed`) | Daily (enforced by `dq.tieout_due_at`) |
  | Variance detected (`dq.variance_detected`) | Variance amount (`dq.variance_amount`) | DQ investigation opened (`dq.investigation_opened`) | Same day (no registered timer) |
  | Annual model review completed (`model.review_completed`) | Builder roster (`model.builder_roster`), reviewer id (`model.reviewer_id`) | Independent review record (`model.review_completed`) | Annual (enforced by `model.review_due_at`) |

- **ALERTS/METRICS:** Alert on DQ variance (`alert.dq_variance`); target zero unresolved variances; track model-review independence attestation completeness.

---

## LP-09 — Reporting Cadence

- **WHY (Reg cite):** Regular liquidity reporting to management and the Board is required for program oversight ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** A daily ops pack (17:00), weekly ALCO digest (Fri 12:00), and quarterly Board deck (+5 business days) are auto-generated, each requiring sign-off. A missed publication surfaces as an aging alert. Report templates and distribution lists are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD data posted (`liquidity.eod_posted`) | LAR (`lar.value`), gaps (`mismatch.current_gaps`), concentrations (`concentration.top10`) | Daily ops pack (`report.daily_pack_published`) | 17:00 daily (enforced by `report.daily_due_at`) |
  | Weekly cycle closes (`report.weekly_digest_published`) | Weekly deltas (`report.weekly_deltas`) | Weekly ALCO digest (`report.weekly_digest_published`) | Fri 12:00 (enforced by `report.weekly_due_at`) |
  | Quarter closes (`report.board_deck_published`) | Board pack inputs (`analytics.board_pack_inputs`), sign-off (`board.package_distributed`) | Quarterly Board deck (`report.board_deck_published`) | +5 BD (enforced by `report.board_due_at`) |

- **ALERTS/METRICS:** Alert on report aging (`alert.policy_review_aging` adapted via `report.*_due_at`); target 100% on-time publication; track sign-off latency per cadence.

---

## LP-10 — Regulatory Notification

- **WHY (Reg cite):** Material liquidity stress and federal-facility use must be escalated to NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** NCUA (examiner-in-charge and regional office) is notified within 24 hours when CFP Level 2 or 3 activates, a federal facility is used or attempted, survival falls below 15 days (combined), or LAR falls below 6%. An after-hours trigger is documented and sent by the next business morning. The notification memo is drafted by Compliance and sent under CEO authority; the contact list is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Notification criteria met (`ncua.notification_required`) | Trigger condition (`ncua.trigger_condition`), metrics snapshot (`ncua.metrics_snapshot`), contacts (`regulator.contacts`) | Event memo sent (`ncua.notification_sent`) | 24 hours (enforced by `ncua.notification_due_at`) |
  | NCUA acknowledges (`ncua.ack_received`) | Acknowledgment detail (`ncua.ack_detail`) | Acknowledgment logged (`ncua.ack_logged`) | On receipt (no registered timer) |

- **ALERTS/METRICS:** Alert on notification aging (`alert.ncua_notification_aging`); target zero late notifications; track time-from-trigger-to-send distribution.

---

## LP-11 — Contingent Federal Liquidity Access

- **WHY (Reg cite):** Documented federal contingent liquidity access (CLF and/or Discount Window) is required at scale ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [CLF 12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14); [Fed advances 12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** CLF membership/agent access and Discount Window operational readiness are maintained, collateral schedules are kept current, and an annual funded or no-funds test is conducted. A failed or partial test opens a corrective plan with a deadline. Facility contacts and collateral schedules are write-restricted to Compliance/Treasury under dual control.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual federal test due (`cfp.investment_test_completed`) | Test script (`facility.test_script`), collateral schedule (`facility.collateral_schedule`), contacts (`facility.contacts`) | Facility test report (`cfp.investment_test_completed`) | Annual (enforced by `cfp.investment_test_due`) |
  | Collateral schedule updated (`collateral.file_posted`) | Eligibility rules (`collateral.eligibility_rules`), unencumbered balance (`collateral.unencumbered_balance`) | Updated readiness record (`facility.access_confirmed`) | Per update (no registered timer) |

- **ALERTS/METRICS:** Alert on facility readiness aging (`alert.facility_readiness_aging`); target current collateral schedule and passed annual test; track days since last facility test.

---

## LP-12 — Collateral & Encumbrance Management

- **WHY (Reg cite):** Accurate eligible/unencumbered collateral tracking supports contingent funding capacity ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [Fed advances 12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** Eligible/unencumbered balances and haircuts by counterparty are tracked under dual control, updated daily, and re-checked after large moves. A security in dispute is removed from headroom until cleared. Collateral pledges and releases require dual control; the inventory is write-restricted to Treasury Operations with Compliance oversight.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily collateral computation runs (`collateral.headroom_computed`) | Inventory (`collateral.inventory`), haircuts (`liquidity.haircut_table`), counterparty (`collateral.counterparty_id`) | Headroom computation (`collateral.headroom_computed`) | Daily (enforced by `collateral.compute_due_at`) |
  | Large collateral move detected (`collateral.large_move_detected`) | Move detail (`collateral.move_detail`), fair value (`collateral.fair_value`) | Re-checked headroom (`collateral.headroom_rechecked`) | After move, real-time (no registered timer) |
  | Pledge executed (`collateral.pledge_executed`) | Pledge schedule (`collateral.pledge_schedule`), dual-control approval (`transaction.dual_control_required`) | Pledge record (`collateral.pledge_executed`) | Per pledge (no registered timer) |

- **ALERTS/METRICS:** Alert on low headroom (`alert.headroom_low`); target stable unencumbered headroom buffer; track encumbrance percentage trend.

---

## LP-13 — Wholesale / Listing-Service Deposits Guardrails

- **WHY (Reg cite):** Wholesale/listing-service funding guardrails control concentration and volatility risk ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Approved listing services are allowed with tenor laddering and enforced pricing authority; exposure is updated daily and reviewed monthly by ALCO. A listing request outside the pricing authority or tenor ladder is blocked. Approved-service lists and pricing authority are write-restricted to Compliance/Treasury.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily wholesale exposure computed (`wholesale.exposure_posted`) | Service id (`wholesale.service_id`), tenor ladder (`wholesale.tenor_ladder`), maturity calendar (`wholesale.maturity_calendar`) | Exposure record (`wholesale.exposure_posted`) | Daily (enforced by `wholesale.compute_due_at`) |
  | Listing request submitted (`wholesale.listing_requested`) | Rate (`wholesale.rate`), tenor (`wholesale.tenor`), pricing authority (`wholesale.pricing_authority_id`) | Listing decision (`wholesale.listing_decisioned`) | Per request (no registered timer) |
  | Monthly ALCO review (`wholesale.review_completed`) | Exposure history (`wholesale.exposure_history`) | Monthly review record (`wholesale.review_completed`) | Monthly (enforced by `wholesale.monthly_review_due`) |

- **ALERTS/METRICS:** Alert on pricing-authority violation (`alert.wholesale_pricing_violation`); target zero out-of-authority listings; track wholesale exposure as share of total funding.

---

## LP-14 — CFP Purpose & Activation

- **WHY (Reg cite):** The CFP must specify clear activation levels and tie them to liquidity indicators ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Activation Level 1 (Watch), Level 2 (Low), and Level 3 (Critical) are defined and tied to the LAR bands in [LP-05](#lp-05-liquid-assets-ratio-bands), with transition actions starting within 2 hours of Level 2/3. A false-positive activation may be reverted with documented rationale. Activation authority for Level 2/3 rests with the CEO; the threshold table is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | LAR band change or survival breach (`lar.band_changed`, `survival.below_threshold`) | Threshold table (`policy.limit_registry`), band (`lar.current_band`) | CFP level activation (`cfp.level_changed`) | Real-time (no registered timer) |
  | Level 2/3 transition begins (`cfp.transition_started`) | Selected playbook (`playbook.spec`), tasking orders (`task.type`) | Transition record (`cfp.transition_started`) | 2 hours (enforced by `cfp.transition_due_at`) |
  | Level deactivated (`cfp.deactivated`) | Deactivation rationale (`cfp.execution_plan_documented`) | Deactivation record (`cfp.deactivated`) | When stable (no registered timer) |

- **ALERTS/METRICS:** Alert on activation aging via `liquidity.cfp_activation_due_at`; target transition start within 2 hours at Level 2/3; track time-to-activate distribution.

---

## LP-15 — Early-Warning Indicators & Event Triggers

- **WHY (Reg cite):** Early-warning monitoring positions the credit union into progressive readiness as stress evolves ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Volatile-liability growth, concentrations, negative press, asset-quality deterioration, rising funding costs, margin calls, early CD redemptions, and correspondent line cuts are monitored daily with weekly CEO summaries. An indicator crossing threshold flags a spike that may drive survival rerun ([LP-04](#lp-04-survival-horizon-and-coverage-days)) or stress rerun ([LP-07](#lp-07-stress-testing)). Indicator thresholds are write-restricted to Compliance; Risk has read-only access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily EWI sweep runs (`ewi.sweep_completed`) | Indicator values (`ewi.value`), thresholds (`ewi.thresholds`), history (`ewi.history`) | EWI sweep record (`ewi.sweep_completed`) | Daily (enforced by `ewi.sweep_due_at`) |
  | Indicator crosses threshold (`ewi.threshold_breached`) | Indicator id (`ewi.indicator_id`), trend (`ewi.trend`) | Spike flag (`ewi.spike_flagged`) | Real-time (no registered timer) |
  | Weekly CEO summary due (`ewi.ceo_summary_sent`) | Sweep history (`ewi.history`) | CEO summary (`ewi.ceo_summary_sent`) | Weekly (enforced by `ewi.summary_due_at`) |

- **ALERTS/METRICS:** Alert on EWI threshold breach (`ewi.threshold_breached`); target daily sweep completion; track number of red indicators and acknowledgment time.

---

## LP-16 — Escalation Ladder & Crisis Roles

- **WHY (Reg cite):** Defined crisis roles and timely escalation enable execution before stress becomes crisis ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Crisis roles are defined (CEO external comms, CFO liquidity ops, ALCO advisory, Board extraordinary measures), and the crisis team is convened within 60 minutes of Level 2/3. If the CEO is unavailable, the succession matrix designates an Acting CEO. The roster and succession matrix are write-restricted to the CFO and Compliance; Board authorizes extraordinary measures.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Level 2/3 activates (`cfp.level_changed`) | Roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`) | Crisis team convened (`crisis.team_convened`) | 60 minutes (enforced by `crisis.convene_due_at`) |
  | Crisis decision proposed (`crisis.decision_proposed`) | Decider id (`crisis.decider_id`), decision detail (`crisis.decision_detail`) | Decision logged (`crisis.decision_logged`) | During crisis (no registered timer) |
  | Extraordinary measure proposed (`crisis.extraordinary_proposed`) | Authority basis (`crisis.authority_basis`), board quorum (`crisis.board_quorum`) | Board authorization (`crisis.board_authorized`) | During crisis (no registered timer) |

- **ALERTS/METRICS:** Track escalation time-to-convene against 60-minute SLA; target zero missed convenings at Level 2/3; track decision-log completeness.

---

## LP-17 — Funding Playbooks & Draw Order

- **WHY (Reg cite):** The CFP must enumerate an executable, ordered funding plan ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [CLF 12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14); [Fed advances 12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** An internal-then-external draw order is specified (cash/Fed balances, unencumbered AFS, saleable loans; then FHLB if eligible, Discount Window, CLF, listing-service CDs), with first-line actions executed within 2 hours of Level 2 under dual authorization on external draws. If a planned source is unavailable, the playbook branches to the next source and to collateral readiness in [LP-12](#lp-12-collateral-and-encumbrance-management). External draws require dual authorization; the source registry is write-restricted to Treasury/Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Funding shortfall at Level 2 (`liquidity.cfp_trigger_breached`) | Shortfall estimate (`funding.shortfall_estimate`), next source (`funding.next_source`) | First-line draw executed (`funding.first_line_executed`) | 2 hours (enforced by `funding.first_line_due_at`) |
  | External draw requested (`funding.external_draw_requested`) | Draw amount (`funding.draw_amount`), dual-control flag (`transaction.dual_control_required`) | Draw confirmation (`funding.draw_executed`) | At Level 2/3 (no registered timer) |
  | Planned source unavailable (`funding.source_unavailable`) | Unavailability reason (`funding.unavailability_reason`), draw-order deviation (`funding.draw_order_deviated`) | Branch-to-backup record (`funding.draw_executed`) | Real-time (no registered timer) |

- **ALERTS/METRICS:** Track first-line execution within 2 hours; target zero unauthorized single-signature external draws; track cost-of-funds and headroom-days at draw time.

---

## LP-18 — External Communications & Stakeholder Matrix

- **WHY (Reg cite):** Controlled external communication mitigates reputation contagion and run risk during stress ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** The CEO is the sole spokesperson; scripted updates go to major depositors/partners, and Level 2/3 communications issue same-day. Inbound media inquiries are answered only with the approved holding statement. Scripts and the stakeholder matrix are write-restricted to the Comms team with CEO approval; the Board has view access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Level 2/3 active (`cfp.level_changed`) | Approved script (`comms.draft_script`), stakeholder matrix (`comms.stakeholder_matrix`), CEO approval (`comms.ceo_approval`) | Stakeholder notices sent (`comms.notices_sent`) | Same day (enforced by `comms.same_day_due_at`) |
  | Media inquiry received (`comms.media_inquiry_received`) | Holding statement (`comms.holding_statement`), inquiry detail (`comms.inquiry_detail`) | Media response logged (`comms.media_response_logged`) | Same day (no registered timer) |

- **ALERTS/METRICS:** Track communications latency at Level 2/3; target same-day issuance; track count of off-script external statements (target zero).

---

## LP-19 — Regulator Liaison Protocols

- **WHY (Reg cite):** Maintained examiner contacts and prompt request response support supervisory engagement ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Examiner/region contacts and event memos are maintained, and regulator requests are responded to within 1 business day unless otherwise directed. Contacts are verified periodically; an unverified contact list surfaces an aging alert. The contact registry and event memos are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Regulator request received (`regulator.request_received`) | Request detail (`regulator.request_detail`), contacts (`regulator.contacts`) | Response sent (`regulator.response_sent`) | 1 BD (enforced by `regulator.response_due_at`) |
  | Contact verification due (`regulator.contacts_verified`) | Contact list (`regulator.contacts`) | Verified contacts record (`regulator.contacts_verified`) | Periodic (enforced by `regulator.verification_due_at`) |

- **ALERTS/METRICS:** Alert on regulator request aging (`alert.regulator_request_aging`); target 100% on-time responses; track contact-verification currency.

---

## LP-20 — Liquidity Drills & After-Action Reviews

- **WHY (Reg cite):** Drills and after-action reviews demonstrate CFP operability and drive remediation ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [CLF 12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14)).
- **SYSTEM BEHAVIOR:** An annual facility test and tabletop exercises are run, and the after-action review is published within 10 business days with remediation owners and dates. A failed drill element opens a corrective plan with a deadline. Drill rosters and objectives are write-restricted to the CFO/Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Drill/tabletop completed (`drill.completed`) | Roster (`drill.roster`), objectives (`drill.objectives`) | After-action review published (`drill.aar_published`) | 10 BD (enforced by `drill.aar_due_at`) |
  | Drill element fails (`drill.element_failed`) | Failure detail (`drill.failure_detail`), affected capability (`drill.affected_capability`) | Corrective plan opened (`drill.corrective_plan_opened`) | Per AAR (enforced by `drill.remediation_due_at`) |

- **ALERTS/METRICS:** Track AAR publication within 10 BD; target zero overdue drill remediations; track number of failed drill elements per exercise.

---

## LP-21 — Documentation & Retention

- **WHY (Reg cite):** Retained evidence of the liquidity program supports examination and accountability ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Policies, limits, packs, notifications, facility tests, drills, and AARs are retained for 10 years, indexed within 2 business days of creation, with legal-hold capability. Records under legal hold are exempt from destruction until released. Retention configuration and legal holds are write-restricted to Compliance/Legal with role-based access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Artifact finalized (`record.created`) | Artifact blob (`record.blob`), metadata (`record.metadata`), retention class (`record.retention_class`) | Indexed archive entry (`record.retention_clock_set`) | Index within 2 BD (enforced by `record.index_due_at`) |
  | Legal hold placed (`record.hold_placed`) | Hold scope (`record.hold_scope`), matter id (`record.hold_matter_id`) | Hold applied record (`record.hold_applied`) | On placement (no registered timer) |
  | Retention expires (`record.retention_expired`) | Disposal method (`record.disposal_method`), hold status (`record.hold_status`) | Disposal record (`record.disposed`) | At 10 years (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Track retention-index latency against 2 BD SLA; target zero unindexed artifacts; track count of records improperly disposed under hold (target zero).

---

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. The CFO is program owner for day-to-day execution.
- **Required Participants/Approvers:** CFO (program owner), CEO, ALCO, Treasury Operations, and the Board, as applicable to each control.
- **Approvals:** Patrick Wilson, Chief Compliance Officer (policy approval); Board approves limit registry and CFP activation thresholds.
- **Review Cadence:** At least annually; ad-hoc within 10 business days of a material change ([LP-01](#lp-01-policy-scope-risk-appetite-and-limit-registry)) and following any after-action review finding ([LP-20](#lp-20-liquidity-drills-and-after-action-reviews)).
- **Cross-Refs:** Activation thresholds tie to LAR bands ([LP-05](#lp-05-liquid-assets-ratio-bands)); funding sequence references collateral readiness ([LP-12](#lp-12-collateral-and-encumbrance-management)); the Timing Matrix ([#timing-matrix](#timing-matrix)) provides the consolidated deadline view.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several liquidity-side fields and events referenced in the *When* / *What's needed* / *Produced (and logged)* / *Within* columns are not all confirmed in `core-vocabulary.json` for this domain. Provisional spellings used verbatim per DESIGN_NOTES include `flow.amount`, `flow.direction`, `catalogue.approver_id`, `catalogue.formula`, `catalogue.lineage`, `catalogue.failure_reason`, `catalogue.metrics_flagged_provisional`, `policy.id`, `policy.version`, `policy.approver_id`, `policy.change_summary`, and `stress.approver_id`. These represent the target naming scheme and will be confirmed by engineering before the next review.
- **LAR band thresholds are policy-set.** The 10% / 8% / 6% Normal/Watch/Low/Critical bands and their mapping to CFP Levels 1/2/3 operationalize §741.12 and require Board confirmation as the standing policy floors.
- **Survival-day notification floor.** The 15-day combined-stress NCUA notification trigger and the survival-day policy threshold used in [LP-04](#lp-04-survival-horizon-and-coverage-days) are policy-set and require Board confirmation.
- **FHLB eligibility.** FHLB appears in the draw order in [LP-17](#lp-17-funding-playbooks-and-draw-order) only "if eligible"; FHLB membership/district eligibility and collateral programs for Pynthia Credit Union are not confirmed and need verification.
- **CFP federal-access scale threshold.** Documented federal contingent-liquidity access (CLF and/or Discount Window) is required at $250MM or more under §741.12; confirmation that Pynthia Credit Union meets or exceeds this asset threshold (and the $50MM written-CFP threshold) is assumed and should be verified.
- **BaaS partner flow modeling.** Treatment of BaaS partner balances within concentration ([LP-06](#lp-06-funding-concentration-and-counterparty-limits)), mismatch buckets ([LP-03](#lp-03-maturity-mismatch-limits)), and BaaS shock scenarios ([LP-07](#lp-07-stress-testing)) assumes partner flow data is available daily by 16:00; data-feed availability and partner-tier definitions need confirmation.
- **Scope exclusions governed elsewhere.** Investment-portfolio credit/valuation, capital adequacy/PCA, physical cash/vault operations, enterprise risk-appetite governance beyond liquidity, and business continuity are out of scope and governed by their respective policies; only the liquidity-relevant collateral/AFS characteristics are addressed jointly here.
