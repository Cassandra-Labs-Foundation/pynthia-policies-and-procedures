---
title: Liquidity Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Liquidity, Contingency Funding Plan, NCUA, ALM]
---

# Liquidity Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based liquidity program and a written Contingency Funding Plan (CFP) sufficient to fund daily obligations and survive idiosyncratic and systemic stress across all funding and balance-sheet activities, including BaaS partner flows. The Liquidity Policy defines what we measure, limit, and report in normal conditions; the CFP defines how we detect stress, escalate, and execute funding actions when indicators breach triggers. The program is owned by the Chief Compliance Officer, operated by the CFO with ALCO, Treasury Operations, CEO, and the Board as required participants, and aligned to NCUA requirements (12 CFR §741.12), with documented access to federal contingent liquidity (CLF and/or Federal Reserve Discount Window). Investment credit/valuation, capital adequacy, physical cash/vault, enterprise risk appetite beyond liquidity, business continuity, and OCC/FDIC materials are out of scope and governed by their own policies.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Maturity mismatch computed | EOD data posted → `liquidity.eod_posted` | Daily by 16:00 | Cumulative gap report by bucket | [LIQ-03](#liq-03-maturity-mismatch-limits) |
| Mismatch limit breach | Bucket gap exceeds limit → `mismatch.limit_breached` | Real-time | Breach disposition | [LIQ-03](#liq-03-maturity-mismatch-limits) |
| LAR computed and banded | EOD data posted → `lar.computed` | Daily by 16:00 | Band classification | [LIQ-05](#liq-05-liquid-assets-ratio-bands) |
| LAR band breach | Band change → `lar.band_changed` | Real-time | Band alert | [LIQ-05](#liq-05-liquid-assets-ratio-bands) |
| Survival horizon refresh | Quarter start → `survival.quarterly_due_at` | Quarterly | Survival pack | [LIQ-04](#liq-04-survival-horizon-and-coverage-days) |
| Survival ad-hoc on EWI spike | EWI spike flagged → `ewi.spike_flagged` | 2 business days | Updated survival days | [LIQ-04](#liq-04-survival-horizon-and-coverage-days) |
| Concentration waiver | Limit exceeded → `concentration.waiver_opened` | 2 business days | Waiver decision | [LIQ-06](#liq-06-funding-concentration-and-counterparty-limits) |
| Stress scenarios refresh | Quarter start → `stress.quarterly_due_at` | Quarterly | Stress pack | [LIQ-07](#liq-07-stress-testing) |
| Stress re-run on major EWI | Major indicator flagged → `ewi.major_event_flagged` | 5 business days | Re-run results | [LIQ-07](#liq-07-stress-testing) |
| Daily ops pack | EOD data posted → `liquidity.eod_posted` | 17:00 | Daily ops pack | [LIQ-09](#liq-09-reporting-cadence) |
| Weekly ALCO digest | Week close → `report.weekly_digest_due` | Fri 12:00 | ALCO digest | [LIQ-09](#liq-09-reporting-cadence) |
| Quarterly Board deck | Quarter close → `report.board_deck_due` | +5 business days | Board deck | [LIQ-09](#liq-09-reporting-cadence) |
| NCUA notification | CFP L2/L3, federal facility used/attempted, survival <15d combined, LAR <6% → `ncua.notification_required` | 24 hours | Event memo to examiner/region | [LIQ-10](#liq-10-regulatory-notification) |
| Federal facility readiness test | Annual test due → `facility.test_due_at` | Annual | Test report; contacts | [LIQ-11](#liq-11-contingent-federal-liquidity-access) |
| Collateral large-move recheck | Large move detected → `collateral.large_move_detected` | Real-time (same day) | Updated headroom | [LIQ-12](#liq-12-collateral-and-encumbrance-management) |
| Wholesale exposure review | Month close → `wholesale.monthly_review_due` | Monthly | ALCO review record | [LIQ-13](#liq-13-wholesale-listing-service-deposits-guardrails) |
| Activate CFP Level 2/3 | LAR Low/Critical band → `liquidity.cfp_trigger_breached` | Transition actions within 2 hours | Activation record; playbook | [LIQ-14](#liq-14-cfp-purpose-and-activation) |
| Convene crisis team | Level 2/3 active → `cfp.level_changed` | 60 minutes | Crisis roster convened | [LIQ-16](#liq-16-escalation-ladder-and-crisis-roles) |
| Execute first-line funding | Level 2 active → `funding.shortfall_estimate` set | First-line within 2 hours | Draw confirmations | [LIQ-17](#liq-17-funding-playbooks-and-draw-order) |
| External communications | Level 2/3 active → `comms.script_approved` | Same day | Approved depositor/partner notices | [LIQ-18](#liq-18-external-communications-and-stakeholder-matrix) |
| Regulator request response | Request received → `regulator.request_received` | 1 business day | Response package | [LIQ-19](#liq-19-regulator-liaison-protocols) |
| After-action review publish | Drill/test completed → `drill.completed` | 10 business days | AAR with owners/dates | [LIQ-20](#liq-20-liquidity-drills-and-after-action-reviews) |
| Documentation indexing | Artifact finalized → `record.created` | 2 business days | Indexed archive | [LIQ-21](#liq-21-documentation-and-retention) |
| Policy ad-hoc review | Material change declared → `strategy.material_change_declared` | 10 business days | Updated policy/limit registry | [LIQ-01](#liq-01-policy-scope-and-risk-appetite) |

---

## LIQ-01 — Policy Scope and Risk Appetite

- **WHY (Reg cite):** NCUA requires a board-approved liquidity policy and written CFP for credit unions of this size ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Enforces a single liquidity standard across scope and maintains a versioned policy and limit registry reviewed at least annually, with an ad-hoc review triggered within 10 business days after a material change. Approved limits live in the limit registry and are referenced by downstream controls. Material-change detection is automatic on strategy declarations; an ad-hoc review that lapses raises a warning. The policy document and limit registry are write-restricted to Compliance with CFO/Board approval.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Policy approved or readopted (`governance.policy_approved`) | Policy document (`policy.document_id`), version (`policy.document_version`), limit registry (`policy.limit_registry`), next review date (`policy.next_review_date`) | Versioned policy + limit registry published (`policy.version_published`) | Annual (enforced by `policy.review_due_at`) |
| Material change declared (`strategy.material_change_declared`) | Change summary (`policy.change_summary`), materiality threshold (`policy.materiality_threshold`) | Ad-hoc review opened and completed (`policy.review_completed`) | 10 business days (enforced by `policy.review_due_at`) |
| Limit change requested (`policy.limit_change_requested`) | Proposed limit (`policy.proposed_limit`), rationale (`policy.change_rationale`), approver (`policy.approver_id`) | Limit registry updated (`policy.limit_updated`) | — |

- **ALERTS/METRICS:** Target zero lapsed reviews; aging alert on `policy.review_warning_at`; track count of limit-registry changes per quarter.

---

## LIQ-02 — Definitions and Ratios Catalogue

- **WHY (Reg cite):** Standardized, reconciled metrics underpin a sound liquidity program required by NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Maintains a central library of standardized metrics (LAR, cumulative mismatch, survival horizon, concentration) kept synced to GL mapping daily, with each definition carrying a formula and data lineage. A failed sync raises an alert and flags affected metrics as provisional until tied out. Catalogue definitions are write-restricted to Compliance with CFO approval.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily GL refresh (`catalogue.sync_completed`) | GL mapping (`gl.coa_map`), metric formulas (`catalogue.formula`), lineage (`catalogue.lineage`) | Synced metric library + sync record (`catalogue.sync_completed`) | Daily (enforced by `catalogue.sync_due_at`) |
| Definition change requested (`catalogue.change_requested`) | Proposed definition (`catalogue.formula`), approver (`catalogue.approver_id`) | Updated definition (`catalogue.definition_updated`) | — |
| Sync failure (`catalogue.sync_failed`) | Failure reason (`catalogue.failure_reason`), affected metrics (`catalogue.metrics_flagged_provisional`) | Sync-failure alert (`alert.catalogue_sync_failed`) | — |

- **ALERTS/METRICS:** Target zero overdue syncs; alert on `alert.catalogue_sync_failed`; track count of metrics flagged provisional.

---

## LIQ-03 — Maturity Mismatch Limits

- **WHY (Reg cite):** Cash-flow mismatch measurement and limits are core liquidity-risk controls expected by NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Computes cumulative cash-flow gaps in time buckets (O/N, 2–7d, 8–30d, 31–90d, 91–365d, >1y) daily by 16:00 against approved limits, and recalculates intraday on large unscheduled flows. A bucket breach raises a real-time alert and opens a disposition record reviewed by Treasury Operations. Gap computation parameters and limits are write-restricted to the Liquidity team with limit changes flowing through [LIQ-01](#liq-01-policy-scope-and-risk-appetite).
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD data posted (`liquidity.eod_posted`) | GL balances (`gl.balances`), behavioral assumptions (`mismatch.current_gaps`), bucket limits (`policy.limit_registry`) | Cumulative gap report (`mismatch.gap_computed`) | Daily by 16:00 (enforced by `mismatch.compute_due_at`) |
| Large unscheduled flow detected (`liquidity.large_flow_detected`) | Flow amount (`flow.amount`), direction (`flow.direction`) | Intraday recompute (`mismatch.intraday_recomputed`) | Real-time |
| Bucket limit breached (`mismatch.limit_breached`) | Breached bucket (`mismatch.breached_bucket`), magnitude (`mismatch.breach_magnitude`) | Breach disposition + alert (`mismatch.breach_dispositioned`, `alert.mismatch_breach`) | Real-time |

- **ALERTS/METRICS:** Alert on `alert.mismatch_breach`; target zero unresolved breaches; track daily compute on-time rate.

---

## LIQ-04 — Survival Horizon and Coverage Days

- **WHY (Reg cite):** Survival-horizon modeling under stress demonstrates resilience expected by NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Models survival days under idiosyncratic and combined stress quarterly, and ad-hoc within 2 business days when early-warning indicators spike. A combined survival result below threshold raises an alert and feeds [LIQ-10](#liq-10-regulatory-notification) when below 15 days. Scenario assumptions are write-restricted to the Liquidity team and independently reviewed under [LIQ-08](#liq-08-data-quality-and-model-governance).
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter start (`stress.quarter_open`) | Scenario set (`stress.set` via `stress.behavioral_assumptions`), haircuts (`liquidity.haircut_table`) | Survival pack with days computed (`survival.computed`) | Quarterly (enforced by `survival.quarterly_due_at`) |
| EWI spike flagged (`ewi.spike_flagged`) | Driver scenario (`survival.driver_scenario`), updated assumptions (`stress.behavioral_assumptions`) | Ad-hoc survival recompute (`survival.adhoc_computed`) | 2 business days |
| Combined survival below target (`survival.below_threshold`) | Combined days (`survival.days_combined`), threshold (`policy.limit_registry`) | Survival-low alert (`alert.survival_low`) | Real-time |

- **ALERTS/METRICS:** Alert on `alert.survival_low`; track combined survival days trend; target survival ≥ policy floor.

---

## LIQ-05 — Liquid Assets Ratio Bands

- **WHY (Reg cite):** A liquid-assets cushion with defined bands is a baseline liquidity measure under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Computes LAR daily by 16:00 and classifies into policy-set bands (Normal ≥10%; Watch <10%; Low <8%; Critical <6%), raising real-time alerts on breach. A move into Low or Critical drives CFP activation under [LIQ-14](#liq-14-cfp-purpose-and-activation), and a move below 6% feeds [LIQ-10](#liq-10-regulatory-notification). Band thresholds are policy-set and write-restricted to the Liquidity team via [LIQ-01](#liq-01-policy-scope-and-risk-appetite).
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD data posted (`liquidity.eod_posted`) | Liquid assets (`liquidity.liquid_assets`), total assets (`liquidity.total_assets`), band thresholds (`policy.limit_registry`) | LAR value + band classification (`lar.computed`) | Daily by 16:00 (enforced by `lar.compute_due_at`) |
| Band changed (`lar.band_changed`) | Current band (`lar.current_band`), prior band (`lar.prior_band`) | Band-change alert (`lar.band_alert_issued`, `alert.lar_band_change`) | Real-time |
| LAR below 6% (`lar.critical_breached`) | LAR value (`lar.value`) | Critical breach record (`lar.critical_breached`) | Real-time |

- **ALERTS/METRICS:** Alert on `alert.lar_band_change`; target time-in-Normal band; track daily LAR compute on-time rate.

---

## LIQ-06 — Funding Concentration and Counterparty Limits

- **WHY (Reg cite):** Diversification and counterparty/provider limits mitigate funding concentration risk under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Tracks top-10 depositors and single-provider/facility reliance limits daily, with a waiver workflow resolved within 2 business days when a limit is exceeded. A breach opens a waiver case routed to ALCO; unresolved waivers age and alert. Concentration limits are write-restricted to the Liquidity team via [LIQ-01](#liq-01-policy-scope-and-risk-appetite).
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Depositor file posted (`liquidity.depositor_file_posted`) | Top-10 depositors (`concentration.top10`), provider/facility exposures (`wholesale.exposure_history`), limits (`policy.limit_registry`) | Concentration computed (`concentration.computed`) | Daily (enforced by `concentration.compute_due_at`) |
| Limit exceeded (`concentration.waiver_opened`) | Excess amount (`concentration.excess_amount`), reviewer (`concentration.reviewer_id`), waiver terms (`concentration.waiver_terms`) | Waiver decision (`concentration.waiver_decided`) | 2 business days (enforced by `concentration.waiver_due_at`) |
| Waiver resolved (`concentration.waiver_resolved`) | Resolution record (`concentration.waiver_terms`) | Resolution logged (`concentration.waiver_resolved`) | — |

- **ALERTS/METRICS:** Alert on `alert.concentration_breach`; target zero aged waivers; track top-10 depositor share trend.

---

## LIQ-07 — Stress Testing

- **WHY (Reg cite):** Liquidity stress testing across idiosyncratic, systemic, and combined scenarios is required to size the cushion and CFP under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Runs idiosyncratic, systemic, and combined scenarios (including intraday peaks and BaaS shocks) quarterly, and re-runs within 5 business days on a major early-warning indicator. Results feed survival-horizon ([LIQ-04](#liq-04-survival-horizon-and-coverage-days)) and CFP playbooks. Scenario assumptions are versioned and write-restricted to the Liquidity team, with independent review under [LIQ-08](#liq-08-data-quality-and-model-governance).
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter start (`stress.quarter_open`) | Scenario set (`stress.behavioral_assumptions`), intraday profile (`stress.intraday_profile`), BaaS shock params (`stress.baas_shock_params`) | Stress pack issued (`stress.pack_issued`) | Quarterly (enforced by `stress.quarterly_due_at`) |
| Major EWI flagged (`ewi.major_event_flagged`) | Driver indicator (`ewi.indicator_id`), revised assumptions (`stress.behavioral_assumptions`) | Ad-hoc re-run issued (`stress.adhoc_rerun_issued`) | 5 business days (enforced by `stress.rerun_due_at`) |
| Assumption changed (`stress.assumption_changed`) | Assumption value (`stress.assumption_value`), rationale (`stress.change_rationale`) | Versioned assumption (`stress.assumption_versioned`) | — |

- **ALERTS/METRICS:** Target zero overdue quarterly runs; track re-run latency after major EWI; monitor scenario-assumption version churn.

---

## LIQ-08 — Data Quality and Model Governance

- **WHY (Reg cite):** Reliable data lineage and independent model review safeguard the integrity of liquidity measurement under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Maintains data lineage and assumption catalogs, ties out to GL daily, and obtains independent model review annually with segregation between model builders and reviewers. A daily tie-out variance opens an investigation; the annual review enforces builder/reviewer separation via roster checks. Model review records are write-restricted to Compliance, and reviewer assignment is restricted from anyone on the builder roster.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily tie-out (`dq.tieout_completed`) | GL balances (`gl.balances`), metric outputs (`catalogue.lineage`) | Tie-out result (`dq.tieout_completed`) | Daily (enforced by `dq.tieout_due_at`) |
| Variance detected (`dq.variance_detected`) | Variance amount (`dq.variance_amount`) | DQ investigation opened (`dq.investigation_opened`, `alert.dq_variance`) | — |
| Annual model review (`model.review_completed`) | Builder roster (`model.builder_roster`), reviewer (`model.reviewer_id`) | Independent review record (`model.review_completed`) | Annual (enforced by `model.review_due_at`) |

- **ALERTS/METRICS:** Alert on `alert.dq_variance`; target zero unresolved tie-out variances; confirm builder/reviewer segregation on every model review.

---

## LIQ-09 — Reporting Cadence

- **WHY (Reg cite):** Regular liquidity reporting to management and the Board is required for effective oversight under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Auto-generates a daily ops pack (17:00), a weekly ALCO digest (Fri 12:00), and a quarterly Board deck (+5 business days), each requiring sign-offs. A missing or late artifact ages and alerts. Report templates and distribution lists are write-restricted to the Liquidity team; sign-offs are restricted to designated approvers.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EOD data posted (`liquidity.eod_posted`) | LAR/band (`lar.current_band`), gaps (`mismatch.current_gaps`), survival days (`survival.days_combined`), headroom (`collateral.headroom_computed`) | Daily ops pack published (`report.daily_pack_published`) | 17:00 (enforced by `report.daily_due_at`) |
| Week close (`liquidity.eod_posted`) | Weekly deltas (`report.weekly_deltas`) | Weekly ALCO digest published (`report.weekly_digest_published`) | Fri 12:00 (enforced by `report.weekly_due_at`) |
| Quarter close (`ledger.quarter_closed`) | Quarterly metrics (`liquidity.report`), stress pack (`stress.pack_issued`) | Board deck published (`report.board_deck_published`) | +5 business days (enforced by `report.board_due_at`) |

- **ALERTS/METRICS:** Target zero late packs; track sign-off latency; monitor on-time publication rate across all three cadences.

---

## LIQ-10 — Regulatory Notification

- **WHY (Reg cite):** Material liquidity stress and federal-facility usage must be escalated to NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Notifies NCUA within 24 hours when CFP Level 2 or 3 activates, a federal facility is used or attempted, survival falls below 15 days (combined), or LAR falls below 6%. An after-hours trigger is satisfied by 10:00 the next calendar day with a documented exception. The event memo is drafted by the CFO and sent by the CEO; the contact list and notification record are write-restricted to Compliance.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Notify condition met (`liquidity.cfp_trigger_breached`) | Trigger condition (`ncua.trigger_condition`), metrics snapshot (`ncua.metrics_snapshot`), contacts (`regulator.contacts`) | NCUA notification sent (`ncua.notification_sent`) | 24 hours (enforced by `ncua.notification_due_at`) |
| Federal facility used/attempted (`funding.draw_executed`) | Facility identity (`funding.next_source`), draw amount (`funding.draw_amount`) | Federal-use notification logged (`ncua.notification_sent`) | 24 hours (enforced by `ncua.notification_due_at`) |
| Acknowledgement received (`ncua.ack_received`) | Ack detail (`ncua.ack_detail`) | Ack logged (`ncua.ack_logged`) | — |

- **ALERTS/METRICS:** Alert on `alert.ncua_notification_aging`; target 100% notifications within 24 hours; track ack receipt rate.

---

## LIQ-11 — Contingent Federal Liquidity Access

- **WHY (Reg cite):** Documented access to a federal contingent source is required, and CLF/Discount Window provide the statutory backstops ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14); [12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** Maintains CLF membership/agent access and Discount Window operational readiness, keeps collateral schedules current, and conducts an annual funded or no-funds test. A readiness item aging past due raises an alert; partial test failure opens a corrective plan with a deadline. Facility contacts and collateral schedules are write-restricted to Treasury Operations under dual control.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual test due (`facility.test_completed`) | Test script (`facility.test_script`), collateral schedule (`facility.collateral_schedule`), contacts (`facility.contacts`) | Test report (`facility.test_completed`) | Annual (enforced by `facility.test_due_at`) |
| Readiness drift detected (`facility.schedule_drift_detected`) | Schedule delta (`facility.collateral_schedule`) | Readiness alert (`alert.facility_readiness_aging`) | — |
| Schedule updated (`facility.schedule_updated`) | Updated schedule (`facility.collateral_schedule`) | Schedule update logged (`facility.schedule_updated`) | — |

- **ALERTS/METRICS:** Alert on `alert.facility_readiness_aging`; target zero overdue annual tests; track collateral-schedule currency.

---

## LIQ-12 — Collateral and Encumbrance Management

- **WHY (Reg cite):** Tracking unencumbered eligible collateral and haircuts is essential to realistic contingent capacity under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Tracks eligible/unencumbered balances and haircuts by counterparty under dual control, updating daily and re-checking after large moves. A disputed or ineligible security is removed from headroom until cleared. Pledges and releases are write-restricted to Treasury Operations under dual control.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily collateral compute (`collateral.file_posted`) | Inventory (`collateral.inventory`), eligibility rules (`collateral.eligibility_rules`), haircuts (`liquidity.haircut_table`) | Headroom computed (`collateral.headroom_computed`) | Daily (enforced by `collateral.compute_due_at`) |
| Large move detected (`collateral.large_move_detected`) | Move detail (`collateral.move_detail`), counterparty (`collateral.counterparty_id`) | Headroom rechecked (`collateral.headroom_rechecked`) | Real-time (same day) |
| Pledge executed (`collateral.pledge_executed`) | Pledge schedule (`collateral.pledge_schedule`), unencumbered balance (`collateral.unencumbered_balance`) | Pledge logged (`collateral.pledge_executed`) | — |

- **ALERTS/METRICS:** Alert on `alert.headroom_low`; track encumbrance percentage; target dual-control completion on every pledge/release.

---

## LIQ-13 — Wholesale / Listing-Service Deposits Guardrails

- **WHY (Reg cite):** Wholesale and listing-service funding requires guardrails on tenor, pricing authority, and exposure under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Allows approved listing services with tenor laddering and enforced pricing authority, updating exposure daily with monthly ALCO review. A listing request outside pricing authority is blocked and routed for decision; a pricing-authority violation raises an alert. The approved listing-service registry and pricing authority are write-restricted to the Liquidity team with ALCO oversight.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Listing request submitted (`wholesale.listing_requested`) | Service id (`wholesale.service_id`), tenor (`wholesale.tenor`), rate (`wholesale.rate`), pricing authority (`wholesale.pricing_authority_id`) | Listing decision (`wholesale.listing_decisioned`) | — |
| Daily exposure compute (`wholesale.exposure_posted`) | Exposure history (`wholesale.exposure_history`), tenor ladder (`wholesale.tenor_ladder`), maturity calendar (`wholesale.maturity_calendar`) | Exposure posted (`wholesale.exposure_posted`) | Daily (enforced by `wholesale.compute_due_at`) |
| Monthly ALCO review (`wholesale.review_completed`) | Exposure trend (`wholesale.exposure_history`) | Review record (`wholesale.review_completed`) | Monthly (enforced by `wholesale.monthly_review_due`) |

- **ALERTS/METRICS:** Alert on `alert.wholesale_pricing_violation`; track wholesale exposure share; monitor tenor-ladder dispersion.

---

## LIQ-14 — CFP Purpose and Activation

- **WHY (Reg cite):** The CFP must define clear activation levels tied to measurable triggers under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Defines activation Level 1 (Watch), Level 2 (Low), and Level 3 (Critical) tied to the LAR bands in [LIQ-05](#liq-05-liquid-assets-ratio-bands), starting transition actions within 2 hours of Level 2/3. A false-positive activation may be reverted with documented rationale. Activation authority for Level 2/3 is write-restricted to the CEO; deactivation requires documented basis.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| LAR band Low/Critical (`liquidity.cfp_trigger_breached`) | Current band (`lar.current_band`), threshold table (`policy.limit_registry`) | CFP activated (`liquidity.cfp_activated`, `cfp.level_changed`) | Transition actions within 2 hours (enforced by `liquidity.cfp_activation_due_at`) |
| Level changed (`cfp.level_changed`) | Level basis (`lar.current_band`) | Activation record (`cfp.transition_started`) | — |
| Conditions normalized (`lar.band_recovered`) | Recovered band (`lar.current_band`) | CFP deactivated (`cfp.deactivated`) | — |

- **ALERTS/METRICS:** Track time-to-activate after band change; target zero unactioned Level 2/3 triggers; monitor false-positive activation rate.

---

## LIQ-15 — Early-Warning Indicators and Event Triggers

- **WHY (Reg cite):** Early-warning indicators position the institution for progressive readiness as stress evolves under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Monitors volatile-liability growth, concentrations, negative press, asset-quality deterioration, rising funding costs, margin calls, early CD redemptions, and correspondent line cuts daily, with weekly CEO summaries. An indicator crossing threshold flags a spike that can drive ad-hoc survival ([LIQ-04](#liq-04-survival-horizon-and-coverage-days)) and stress re-runs ([LIQ-07](#liq-07-stress-testing)). Thresholds are write-restricted to the Liquidity team; Risk holds read-only access.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily EWI sweep (`ewi.sweep_completed`) | Indicator values (`ewi.value`), thresholds (`ewi.thresholds`), history (`ewi.history`) | Sweep completed (`ewi.sweep_completed`) | Daily (enforced by `ewi.sweep_due_at`) |
| Threshold breached (`ewi.threshold_breached`) | Indicator id (`ewi.indicator_id`), trend (`ewi.trend`) | Spike flagged (`ewi.spike_flagged`) | Real-time |
| Week close (`ewi.ceo_summary_sent`) | Weekly indicator deltas (`ewi.history`) | CEO summary sent (`ewi.ceo_summary_sent`) | Weekly (enforced by `ewi.summary_due_at`) |

- **ALERTS/METRICS:** Track indicator-acknowledgement latency; target zero missed daily sweeps; monitor count of red indicators per week.

---

## LIQ-16 — Escalation Ladder and Crisis Roles

- **WHY (Reg cite):** A defined liquidity-event management process with assigned roles is required by NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Defines crisis roles (CEO external comms, CFO liquidity ops, ALCO advisory, Board extraordinary measures) and convenes the crisis team within 60 minutes of Level 2/3. If the CEO is unavailable, an Acting CEO is designated per the succession matrix. The crisis roster and succession matrix are write-restricted to Compliance; extraordinary measures require Board authorization.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Level 2/3 activated (`cfp.level_changed`) | Roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`) | Crisis team convened (`crisis.team_convened`) | 60 minutes (enforced by `crisis.convene_due_at`) |
| Decision proposed (`crisis.decision_proposed`) | Decision detail (`crisis.decision_detail`), decider (`crisis.decider_id`) | Decision logged (`crisis.decision_logged`) | — |
| Extraordinary measure proposed (`crisis.extraordinary_proposed`) | Measure detail (`crisis.measure_detail`), board quorum (`crisis.board_quorum`) | Board authorization (`crisis.board_authorized`) | — |

- **ALERTS/METRICS:** Track escalation/convene time; target convene within 60 minutes at every Level 2/3; monitor decision-log completeness.

---

## LIQ-17 — Funding Playbooks and Draw Order

- **WHY (Reg cite):** The CFP must enumerate actionable funding sources in sequence, including the federal backstops, under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14); [12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** Specifies an internal-then-external draw order (cash/Fed balances, unencumbered AFS, saleable loans; then FHLB if eligible, Discount Window, CLF, listing-service CDs), executing first-line actions within 2 hours of Level 2 under dual authorization on external draws. If a planned source is unavailable, the playbook branches to the next source on the ordered list. The funding source registry and draw steps are write-restricted to Treasury Operations; external draws require dual authorization.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Shortfall detected (`liquidity.cfp_activated`) | Shortfall estimate (`funding.shortfall_estimate`), source registry (`funding.next_source`), haircuts (`liquidity.haircut_table`) | First-line draw executed (`funding.first_line_executed`) | 2 hours at Level 2 (enforced by `funding.first_line_due_at`) |
| External draw requested (`funding.external_draw_requested`) | Draw amount (`funding.draw_amount`), dual-auth approvals (`transaction.dual_control_required`) | External draw executed (`funding.draw_executed`) | — |
| Source unavailable (`funding.source_unavailable`) | Unavailability reason (`funding.unavailability_reason`), next source (`funding.next_source`) | Draw-order deviation logged (`funding.draw_order_deviated`) | — |

- **ALERTS/METRICS:** Track first-line execution latency; target dual-authorization on 100% of external draws; monitor cost-of-funds and headroom days during events.

---

## LIQ-18 — External Communications and Stakeholder Matrix

- **WHY (Reg cite):** Controlled stakeholder communication mitigates reputation-driven run risk during a liquidity event under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Designates the CEO as sole spokesperson, uses scripted updates to major depositors/partners, and issues Level 2/3 communications same-day. Inbound media is answered only with the approved holding statement. Scripts and the stakeholder matrix are edited by the Comms team and approved by the CEO; the Board holds view access.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Script approved (`comms.script_approved`) | Draft script (`comms.draft_script`), CEO approval (`comms.ceo_approval`), stakeholder matrix (`comms.stakeholder_matrix`) | Notices sent (`comms.notices_sent`) | Same day at Level 2/3 (enforced by `comms.same_day_due_at`) |
| Media inquiry received (`comms.media_inquiry_received`) | Inquiry detail (`comms.inquiry_detail`), holding statement (`comms.holding_statement`) | Media response logged (`comms.media_response_logged`) | — |
| Script change requested (`comms.script_change_requested`) | Revised script (`comms.draft_script`) | Script approved (`comms.script_approved`) | — |

- **ALERTS/METRICS:** Track communications latency; target 100% same-day Level 2/3 notices; monitor that all media responses use approved statements.

---

## LIQ-19 — Regulator Liaison Protocols

- **WHY (Reg cite):** Maintaining examiner contacts and timely responses supports supervisory expectations under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Maintains examiner/region contacts and event memos and responds to regulator requests within 1 business day unless otherwise directed. Contacts are verified periodically and event memos filed for each event. The contact registry and response records are write-restricted to Compliance.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulator request received (`regulator.request_received`) | Request detail (`regulator.request_detail`), contacts (`regulator.contacts`) | Response sent (`regulator.response_sent`) | 1 business day (enforced by `regulator.response_due_at`) |
| Contacts verified (`regulator.contacts_verified`) | Contact list (`regulator.contacts`) | Verification logged (`regulator.contacts_verified`) | — |
| Event memo filed (`regulator.memo_filed`) | Event memo (`ncua.memo`) | Memo filed (`regulator.memo_filed`) | — |

- **ALERTS/METRICS:** Alert on `alert.regulator_request_aging`; target 100% responses within 1 business day; track contact-verification currency.

---

## LIQ-20 — Liquidity Drills and After-Action Reviews

- **WHY (Reg cite):** Periodic testing of the CFP and federal access demonstrates operability under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12); [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14); [12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)).
- **SYSTEM BEHAVIOR:** Runs an annual facility test and tabletop exercises, publishing the after-action review (AAR) within 10 business days with remediation owners and dates. A failed drill element opens a corrective plan with a deadline. Drill artifacts and AARs are co-owned by the CFO and CEO and write-restricted accordingly.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Tabletop/drill completed (`drill.completed`) | Objectives (`drill.objectives`), roster (`drill.roster`) | AAR published (`drill.aar_published`) | 10 business days (enforced by `drill.aar_due_at`) |
| Drill element failed (`drill.element_failed`) | Failure detail (`drill.failure_detail`), affected capability (`drill.affected_capability`) | Corrective plan opened (`drill.corrective_plan_opened`) | — |
| Remediation closed (`drill.remediation_closed`) | Remediation item (`drill.remediation_item`), owner (`drill.remediation_owner`) | Remediation closed (`drill.remediation_closed`) | Enforced by `drill.remediation_due_at` |

- **ALERTS/METRICS:** Target AAR publication within 10 business days; track remediation on-track rate; monitor count of open corrective items.

---

## LIQ-21 — Documentation and Retention

- **WHY (Reg cite):** Retaining liquidity program evidence supports examinations under NCUA ([12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12)).
- **SYSTEM BEHAVIOR:** Retains policies, limits, packs, notifications, facility tests, drills, and AARs for 10 years, indexing each within 2 business days of creation, with legal-hold capability. Privileged or sensitive content is routed to a restricted vault, and items under legal hold are exempt from disposal until released. The archive is role-based and legal-hold capable, write-restricted to Compliance.
- **EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Artifact finalized (`record.created`) | Artifact blob (`record.blob`), metadata (`record.metadata`), retention class (`record.retention_class`) | Indexed archive entry (`record.retention_started`) | Index within 2 business days (enforced by `record.index_due_at`) |
| Legal hold placed (`record.hold_placed`) | Hold matter (`record.hold_matter_id`), scope (`record.hold_scope`) | Hold applied (`record.hold_applied`) | — |
| Retention expired (`record.retention_expired`) | Retention class (`record.retention_class`), disposal eligibility (`record.disposal_eligible`) | Record disposed (`record.disposed`) | Enforced by `record.retention_expires_at` |

- **ALERTS/METRICS:** Target zero retention gaps; track indexing on-time rate (≤2 business days); confirm legal-hold exemptions applied before any disposal.

---

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (program governance centralized with the CCO).
- **Program participants:** CFO (program owner/liquidity ops), CEO (external comms/sole spokesperson), ALCO (advisory/limit oversight), Treasury Operations (collateral, draws, facility readiness), Board (extraordinary measures and approvals).
- **Approvals:** Patrick Wilson, Chief Compliance Officer. Board ratification is required for policy adoption and material limit changes per [LIQ-01](#liq-01-policy-scope-and-risk-appetite).
- **Review cadence:** At least annually, with ad-hoc review within 10 business days of a material change ([LIQ-01](#liq-01-policy-scope-and-risk-appetite)).
- **Cross-refs:** Activation thresholds in [LIQ-05](#liq-05-liquid-assets-ratio-bands) drive CFP levels in [LIQ-14](#liq-14-cfp-purpose-and-activation); funding sequence in [LIQ-17](#liq-17-funding-playbooks-and-draw-order); federal readiness in [LIQ-11](#liq-11-contingent-federal-liquidity-access); notifications in [LIQ-10](#liq-10-regulatory-notification). Consolidated deadlines appear in the [Timing Matrix](#timing-matrix).

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Many liquidity-side resources, fields, events, and timers referenced in the EVENTS tables (e.g., `lar.*`, `mismatch.*`, `survival.*`, `concentration.*`, `wholesale.*`, `collateral.*`, `funding.*`, `cfp.*`, `liquidity.cfp_activation_due_at`, `ncua.*`, `facility.*`, `stress.*`, `ewi.*`, `crisis.*`, `comms.*`, `regulator.*`, `drill.*`, `catalogue.*`, `report.*`, `alert.*`) appear in DESIGN_NOTES; where a precise field is not yet registered (for example, large-flow attributes `flow.amount`/`flow.direction`, and certain dual-authorization linkages on external draws), the target naming is used and will be confirmed by engineering before the next review.
- **LAR band thresholds are policy-set.** The Normal ≥10% / Watch <10% / Low <8% / Critical <6% bands, and the survival-day notification floor of 15 days (combined), operationalize §741.12 and require Board confirmation; they are not prescribed numeric minimums in the regulation.
- **CLF/Discount Window applicability assumed at scope.** The policy assumes Pynthia maintains (or will document) CLF membership/agent access and/or Discount Window readiness consistent with §741.12 federal-source expectations; the specific federal source(s) and any size-threshold applicability require confirmation.
- **FHLB eligibility is conditional.** FHLB appears in the draw order only "if eligible"; district membership and collateral program eligibility for a credit union must be confirmed before relying on it as a contingent source.
- **BaaS partner flow modeling.** Treatment of BaaS partner inflows/outflows in mismatch buckets, survival modeling, and stress shocks (`stress.baas_shock_params`) assumes a behavioral-assumption set that engineering and ALCO must validate against actual partner contracts.
- **Charter and reporter status.** NCUA-only scope (federally insured credit union) is assumed per PATRICK_NOTES; any HMDA/other reporter status is out of scope for this policy and not addressed here.
- **Dual-control linkage.** External-draw dual authorization is modeled via the generic `transaction.dual_control_required`/`transaction.dual_control_completed` pattern; confirm this maps to the funding-draw workflow rather than a liquidity-specific control surface.
