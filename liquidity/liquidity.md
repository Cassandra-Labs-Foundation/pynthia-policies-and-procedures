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

# Liquidity Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based liquidity program and a written Contingency Funding Plan (CFP) that together satisfy [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12). The Liquidity Policy defines what we measure, limit, and report in normal conditions — cash-flow mismatch, funding concentration, liquid-asset coverage, and survival under stress — and the CFP defines how we detect stress, escalate, and execute funding actions before a stress event becomes a crisis. The policy applies across all funding and balance-sheet activities, including BaaS partner flows. Governance is centralized with the Chief Compliance Officer; the CFO owns the program day to day, with the CEO, ALCO, Treasury Operations, and the Board as required participants and approvers. Scope is NCUA-only for federally insured credit unions; investment-portfolio credit controls, capital adequacy, physical cash operations, enterprise risk appetite, and business continuity are governed by their own policies.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy review | Review anniversary reached (`policy.review_due`) | Annual (ad-hoc within 10 BD after material change) | Versioned policy + limit registry | [LQ-01](#lq-01-policy-scope-risk-appetite) |
| Daily mismatch run | EOD positions posted (`liquidity.eod_posted`) | Daily by 16:00 | Cumulative gap report by bucket | [LQ-03](#lq-03-maturity-mismatch-limits) |
| Survival horizon refresh | Quarter opens (`stress.quarter_open`) | Quarterly (ad-hoc within 2 BD on EWI spike) | Survival-days model output | [LQ-04](#lq-04-survival-horizon-coverage-days) |
| Daily LAR banding | EOD positions posted (`liquidity.eod_posted`) | Daily by 16:00 | LAR value + band classification | [LQ-05](#lq-05-liquid-assets-ratio-bands) |
| Concentration limit check | EOD depositor file posted (`liquidity.depositor_file_posted`) | Daily (waiver resolved within 2 BD) | Top-10 / single-provider report | [LQ-06](#lq-06-funding-concentration-counterparty-limits) |
| Quarterly stress run | Quarter opens (`stress.quarter_open`) | Quarterly (re-run within 5 BD on major EWI) | Stress pack with scenarios | [LQ-07](#lq-07-stress-testing) |
| Daily GL tie-out | EOD GL close (`gl.eod_closed`) | Daily | Reconciliation report | [LQ-08](#lq-08-data-quality-model-governance) |
| Daily ops pack | Pack generation scheduled (`report.daily_pack_due`) | Daily by 17:00 | Daily liquidity ops pack | [LQ-09](#lq-09-reporting-cadence) |
| Weekly ALCO digest | Digest scheduled (`report.weekly_digest_due`) | Friday 12:00 | Weekly ALCO digest | [LQ-09](#lq-09-reporting-cadence) |
| Quarterly Board deck | Quarter closes (`report.board_deck_due`) | Quarter-end + 5 BD | Board liquidity deck | [LQ-09](#lq-09-reporting-cadence) |
| NCUA notification | Notification condition met (`ncua.notification_required`) | **24 hours** | Event memo to examiner/region | [LQ-10](#lq-10-regulatory-notification) |
| Federal facility test | Annual test due (`facility.annual_test_due`) | Annual | Test report + readiness attestation | [LQ-11](#lq-11-contingent-federal-liquidity-access) |
| Collateral inventory update | EOD collateral file posted (`collateral.file_posted`) | Daily (re-check after large moves) | Unencumbered balances + haircuts | [LQ-12](#lq-12-collateral-encumbrance-management) |
| Listing-service exposure update | EOD wholesale file posted (`wholesale.exposure_posted`) | Daily (monthly ALCO review) | Exposure ladder report | [LQ-13](#lq-13-wholesale-listing-service-deposits-guardrails) |
| CFP Level 2/3 activation | LAR enters Low/Critical band (`cfp.level_changed`) | Transition actions within **2 hours** | Activation record + playbook tasks | [LQ-14](#lq-14-cfp-purpose-activation) |
| EWI daily sweep | EWI feed refreshed (`ewi.daily_sweep_due`) | Daily (weekly CEO summary) | EWI dashboard + summary | [LQ-15](#lq-15-early-warning-indicators-event-triggers) |
| Crisis team convening | Level 2/3 activated (`cfp.level_changed`) | Within **60 minutes** | Crisis meeting + decision log | [LQ-16](#lq-16-escalation-ladder-crisis-roles) |
| First-line funding draws | Level 2 activated (`cfp.level_changed`) | Within **2 hours** | Executed draw orders | [LQ-17](#lq-17-funding-playbooks-draw-order) |
| Stakeholder communications | Level 2/3 activated (`cfp.level_changed`) | Same day | Scripted notices sent | [LQ-18](#lq-18-external-communications-stakeholder-matrix) |
| Regulator request response | Regulator request received (`regulator.request_received`) | 1 business day | Response + liaison log | [LQ-19](#lq-19-regulator-liaison-protocols) |
| After-action review | Drill or test completed (`drill.completed`) | Within 10 BD | AAR with owners and dates | [LQ-20](#lq-20-liquidity-drills-after-action-reviews) |
| Record indexing | Liquidity artifact finalized (`record.finalized`) | Within 2 BD (retain 10 years) | Indexed, immutable archive entry | [LQ-21](#lq-21-documentation-retention) |

## LQ-01 — Policy Scope & Risk Appetite {#lq-01-policy-scope-risk-appetite}

- **WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires federally insured credit unions to maintain a board-approved liquidity policy; at $50MM or more in assets, a written CFP is required, and at $250MM or more, documented access to a federal contingent liquidity source.
- **SYSTEM BEHAVIOR:** A single liquidity standard governs all in-scope activity, including BaaS partner flows. The policy and its limit registry are maintained as versioned artifacts; every limit referenced by [LQ-03](#lq-03-maturity-mismatch-limits), [LQ-05](#lq-05-liquid-assets-ratio-bands), [LQ-06](#lq-06-funding-concentration-counterparty-limits), and [LQ-13](#lq-13-wholesale-listing-service-deposits-guardrails) resolves to a registry entry, not to prose. The policy is reviewed at least annually and within 10 business days after a material change (new funding channel, new BaaS partner with novel flows, regulatory change); a new partner whose flows are not yet modeled operates under a provisional limit set until the registry is updated. The limit registry is write-restricted to Compliance; the CFO proposes changes and the Board approves them.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual review anniversary reached (`policy.review_due`) | Current policy version (`policy.version`), limit registry (`policy.limit_registry`), prior-year exceptions log (`policy.exceptions[]`) | Reviewed/re-approved policy version (`policy.version_approved`) | Annual (enforced by `policy.review_due_at`) |
  | Material change identified (`policy.material_change_flagged`) | Change description (`policy.change_description`), impacted limits (`policy.impacted_limits[]`) | Ad-hoc policy revision (`policy.revision_published`) | 10 BD from flag |
  | Limit registry edit requested (`policy.limit_change_requested`) | Proposed limit value (`policy.proposed_limit`), rationale (`policy.change_rationale`), approver identity (`policy.approver_id`) | Updated registry entry with approval chain (`policy.limit_updated`) | — |

- **ALERTS/METRICS:** Alert when the annual review is within 30 days of due or past due (`alert.policy_review_aging`); target zero limits in production that lack a registry entry; count of provisional limit sets open longer than 10 BD (target zero).

## LQ-02 — Definitions & Ratios Catalogue {#lq-02-definitions-ratios-catalogue}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the liquidity policy to provide a framework for managing liquidity with a list of sources that can be employed — which presupposes standardized, consistently computed measures.
- **SYSTEM BEHAVIOR:** A central catalogue defines every metric used in this policy — Liquid Assets Ratio (LAR), cumulative cash-flow mismatch by bucket, survival horizon, and funding concentration measures — with formula, data sources, and GL mapping. The catalogue is synced to the GL chart-of-accounts mapping daily so a GL change cannot silently break a ratio; a failed sync flags all dependent metrics as provisional until resolved. Each downstream control consumes catalogue definitions by reference, never by local re-definition. The catalogue is write-restricted to Treasury Operations with Compliance approval on definition changes.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily GL mapping sync runs (`catalogue.sync_due`) | GL chart-of-accounts map (`gl.coa_map`), metric definitions (`catalogue.definitions[]`) | Sync result with diffs (`catalogue.sync_completed`) | Daily (enforced by `catalogue.sync_due_at`) |
  | Metric definition change proposed (`catalogue.change_requested`) | New formula (`catalogue.formula`), data lineage (`catalogue.lineage`), approver identity (`catalogue.approver_id`) | Versioned definition with approval (`catalogue.definition_updated`) | — |
  | Sync failure detected (`catalogue.sync_failed`) | Failure detail (`catalogue.failure_reason`), impacted metrics (`catalogue.impacted_metrics[]`) | Provisional flag on dependent metrics (`catalogue.metrics_flagged_provisional`) | Same day |

- **ALERTS/METRICS:** Alert on sync failure (`alert.catalogue_sync_failed`); count of metrics in provisional status (target zero); age of oldest unresolved definition change request.

## LQ-03 — Maturity Mismatch Limits {#lq-03-maturity-mismatch-limits}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires policies that provide for the management of liquidity risk, which examiners assess through cash-flow gap measurement against board-approved limits.
- **SYSTEM BEHAVIOR:** The system computes cumulative cash-flow gaps in six time buckets — overnight, 2–7 days, 8–30 days, 31–90 days, 91–365 days, and over 1 year — daily by 16:00, comparing each cumulative gap to its registry limit from [LQ-01](#lq-01-policy-scope-risk-appetite). A large unscheduled flow (an inbound or outbound movement above the intraday-recalc threshold in the limit registry, including BaaS partner sweep anomalies) triggers an intraday recalculation rather than waiting for the next daily run. A breach routes to the CFO and ALCO for disposition; a breach that coincides with a LAR band deterioration also feeds [LQ-14](#lq-14-cfp-purpose-activation). Gap-limit values are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD positions posted (`liquidity.eod_posted`) | Contractual cash flows by bucket (`liquidity.cashflows[]`), behavioral assumptions (`liquidity.behavioral_assumptions`), bucket limits (`policy.limit_registry`) | Cumulative gap report by bucket (`mismatch.gap_computed`) | Daily by 16:00 (enforced by `mismatch.compute_due_at`) |
  | Large unscheduled flow detected (`liquidity.large_flow_detected`) | Flow amount and direction (`flow.amount`, `flow.direction`), current gap state (`mismatch.current_gaps`) | Intraday gap recalculation (`mismatch.intraday_recomputed`) | Intraday, immediate |
  | Gap limit breached (`mismatch.limit_breached`) | Breached bucket (`mismatch.breached_bucket`), magnitude (`mismatch.breach_magnitude`), limit value (`policy.limit_registry`) | Breach notice to CFO/ALCO with disposition (`mismatch.breach_dispositioned`) | Same day |

- **ALERTS/METRICS:** Real-time alert on any cumulative gap breach (`alert.mismatch_breach`); daily-run on-time rate against the 16:00 deadline (target 100%); count of intraday recalcs and median recalc latency.

## LQ-04 — Survival Horizon & Coverage Days {#lq-04-survival-horizon-coverage-days}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to address stress events and the credit union's ability to meet obligations through them — survival-days modeling is the quantified expression of that ability.
- **SYSTEM BEHAVIOR:** The system models survival days — how long the credit union can meet obligations without new external funding — under idiosyncratic stress and under combined (idiosyncratic plus systemic) stress, quarterly, using scenario assumptions from [LQ-07](#lq-07-stress-testing) and collateral headroom from [LQ-12](#lq-12-collateral-encumbrance-management). When an early-warning indicator from [LQ-15](#lq-15-early-warning-indicators-event-triggers) spikes, the model re-runs ad-hoc within 2 business days. A combined-stress survival result below 15 days triggers the NCUA notification path in [LQ-10](#lq-10-regulatory-notification). Model assumptions are write-restricted to Treasury Operations with independent review per [LQ-08](#lq-08-data-quality-model-governance).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter opens (`stress.quarter_open`) | Scenario set (`stress.scenarios[]`), cash-flow projections (`liquidity.cashflows[]`), available headroom (`collateral.unencumbered_balance`) | Survival-days result per scenario (`survival.computed`) | Quarterly (enforced by `survival.quarterly_due_at`) |
  | EWI spike flagged (`ewi.spike_flagged`) | Spiking indicator (`ewi.indicator_id`), current value (`ewi.value`), refreshed assumptions (`stress.behavioral_assumptions`) | Ad-hoc survival re-run (`survival.adhoc_computed`) | 2 BD from spike |
  | Combined survival below 15 days (`survival.below_threshold`) | Survival result (`survival.days_combined`), driving scenario (`survival.driver_scenario`) | NCUA notification trigger record (`ncua.notification_required`) | Immediate hand-off to [LQ-10](#lq-10-regulatory-notification) |

- **ALERTS/METRICS:** Alert when combined survival falls below 20 days (early buffer) and below 15 days (notification threshold) (`alert.survival_low`); quarterly-run on-time rate; distribution of survival days quarter over quarter.

## LQ-05 — Liquid Assets Ratio Bands {#lq-05-liquid-assets-ratio-bands}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the policy to identify liquidity sources sufficient to meet demands; the LAR band structure is the board-approved measure of that sufficiency and the activation backbone of the CFP under [§741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12).
- **SYSTEM BEHAVIOR:** The system computes the Liquid Assets Ratio daily by 16:00 using the catalogue definition from [LQ-02](#lq-02-definitions-ratios-catalogue) and classifies it into policy-set bands: **Normal ≥10%**, **Watch <10%**, **Low <8%**, **Critical <6%**. A band change raises a real-time alert and, for Watch/Low/Critical, drives CFP activation per [LQ-14](#lq-14-cfp-purpose-activation); LAR below 6% additionally triggers NCUA notification per [LQ-10](#lq-10-regulatory-notification). A band change caused by a known transient (e.g., a same-day settlement timing artifact) may be annotated but not suppressed — the band stands until the next computation. Band thresholds are write-restricted to Compliance and changeable only via the limit registry in [LQ-01](#lq-01-policy-scope-risk-appetite).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD positions posted (`liquidity.eod_posted`) | Liquid asset balances (`liquidity.liquid_assets`), total assets (`liquidity.total_assets`), band thresholds (`policy.limit_registry`) | LAR value + band classification (`lar.computed`) | Daily by 16:00 (enforced by `lar.compute_due_at`) |
  | Band change detected (`lar.band_changed`) | Prior band (`lar.prior_band`), new band (`lar.current_band`), LAR value (`lar.value`) | Real-time band-change alert + CFP hand-off record (`lar.band_alert_issued`) | Immediate |
  | LAR below 6% (`lar.critical_breached`) | LAR value (`lar.value`), contributing balances (`liquidity.liquid_assets`) | NCUA notification trigger record (`ncua.notification_required`) | Immediate hand-off to [LQ-10](#lq-10-regulatory-notification) |

- **ALERTS/METRICS:** Real-time band-change alerts (`alert.lar_band_change`); days-in-band distribution per quarter; LAR computation on-time rate against 16:00 (target 100%).

## LQ-06 — Funding Concentration & Counterparty Limits {#lq-06-funding-concentration-counterparty-limits}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the policy to provide for diversified funding; concentration limits are the enforceable form of that requirement.
- **SYSTEM BEHAVIOR:** The system tracks the top-10 depositor concentration (including BaaS partner FBO positions, measured per `fbo_position` data) and single-provider/single-facility reliance against registry limits daily. A position that exceeds a limit opens a waiver workflow: the CFO requests, Compliance reviews, and the waiver is resolved — approved with conditions and expiry, or denied with a remediation plan — within 2 business days. A denied waiver requires the exposure to be brought within limit on the remediation timeline. Concentration limits are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD depositor file posted (`liquidity.depositor_file_posted`) | Depositor balances (`depositor.balances[]`), FBO positions (`fbo_position.balance`), provider/facility reliance (`funding.provider_reliance[]`), limits (`policy.limit_registry`) | Top-10 / single-provider concentration report (`concentration.computed`) | Daily (enforced by `concentration.compute_due_at`) |
  | Concentration limit exceeded (`concentration.limit_exceeded`) | Exceeding position (`concentration.position_id`), magnitude (`concentration.excess_amount`) | Waiver workflow opened (`concentration.waiver_opened`) | Same day |
  | Waiver decision recorded (`concentration.waiver_decided`) | Waiver request (`concentration.waiver_request`), reviewer identity (`concentration.reviewer_id`), conditions/expiry (`concentration.waiver_terms`) | Approved-with-conditions or denied waiver record (`concentration.waiver_resolved`) | 2 BD from open (enforced by `concentration.waiver_due_at`) |

- **ALERTS/METRICS:** Alert on any new limit excess (`alert.concentration_breach`); count of waivers open past 2 BD (target zero); trend of top-10 depositor share of total funding.

## LQ-07 — Stress Testing {#lq-07-stress-testing}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to address a range of stress events; credible scenario testing is how the credit union demonstrates the plan would actually work.
- **SYSTEM BEHAVIOR:** Treasury Operations runs idiosyncratic, systemic, and combined stress scenarios quarterly, including intraday payment peaks and BaaS-specific shocks (partner concentration runs, sweep failures, sudden program wind-down). Scenario outputs feed survival-horizon modeling in [LQ-04](#lq-04-survival-horizon-coverage-days) and playbook calibration in [LQ-17](#lq-17-funding-playbooks-draw-order). A major early-warning indicator event triggers a re-run within 5 business days. Scenario assumptions and their changes are governed under [LQ-08](#lq-08-data-quality-model-governance); scenario parameters are write-restricted to Treasury Operations with Compliance sign-off.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter opens (`stress.quarter_open`) | Scenario library (`stress.scenarios[]`), behavioral outflow assumptions (`stress.behavioral_assumptions`), intraday peak profile (`stress.intraday_profile`), BaaS shock parameters (`stress.baas_shock_params`) | Quarterly stress pack with results per scenario (`stress.pack_issued`) | Quarterly (enforced by `stress.quarterly_due_at`) |
  | Major EWI event flagged (`ewi.major_event_flagged`) | Triggering indicator (`ewi.indicator_id`), refreshed assumptions (`stress.behavioral_assumptions`) | Ad-hoc stress re-run results (`stress.adhoc_rerun_issued`) | 5 BD from flag (enforced by `stress.rerun_due_at`) |
  | Scenario assumption change approved (`stress.assumption_changed`) | New assumption value (`stress.assumption_value`), rationale (`stress.change_rationale`), approver (`stress.approver_id`) | Versioned assumption catalogue entry (`stress.assumption_versioned`) | — |

- **ALERTS/METRICS:** Quarterly-run on-time rate (target 100%); count of ad-hoc re-runs and their latency against the 5 BD SLA; scenario-coverage check confirming idiosyncratic, systemic, combined, intraday, and BaaS shocks all ran each quarter.

## LQ-08 — Data Quality & Model Governance {#lq-08-data-quality-model-governance}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires liquidity management commensurate with complexity; supervisory reliance on the program's outputs requires that its data and models be demonstrably sound.
- **SYSTEM BEHAVIOR:** Treasury Operations maintains a data-lineage catalog (every metric input traced to source system and GL account) and an assumption catalog (every behavioral or scenario assumption with owner, basis, and last-review date). Liquidity data ties out to the GL daily; an unexplained tie-out variance above the registry tolerance flags all downstream outputs as provisional until resolved. The liquidity models receive an independent review annually, with strict segregation between model builders and reviewers — no individual may review a model they built or materially modified. Lineage and assumption catalogs are write-restricted to Treasury Operations; review findings are write-restricted to the independent reviewer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily GL close completes (`gl.eod_closed`) | GL balances (`gl.balances`), liquidity-system balances (`liquidity.system_balances`), tolerance (`policy.limit_registry`) | Daily tie-out report with variances (`dq.tieout_completed`) | Daily (enforced by `dq.tieout_due_at`) |
  | Tie-out variance above tolerance (`dq.variance_detected`) | Variance amount (`dq.variance_amount`), affected accounts (`dq.affected_accounts[]`) | Provisional flag on downstream outputs + investigation ticket (`dq.investigation_opened`) | Same day |
  | Annual model review due (`model.review_due`) | Model inventory (`model.inventory[]`), builder roster (`model.builder_roster`), reviewer assignment (`model.reviewer_id`) | Independent review report with findings (`model.review_completed`) | Annual (enforced by `model.review_due_at`) |

- **ALERTS/METRICS:** Alert on tie-out variance above tolerance (`alert.dq_variance`); count of days with provisional outputs (target zero); model-review findings open past their remediation date.

## LQ-09 — Reporting Cadence {#lq-09-reporting-cadence}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires board-approved policies and oversight, which depends on a defined, evidenced reporting rhythm to ALCO and the Board.
- **SYSTEM BEHAVIOR:** The system auto-generates three packs: a daily ops pack by 17:00 (LAR and band, cumulative gaps, top depositors, facility headroom, survival days), a weekly ALCO digest by Friday 12:00, and a quarterly Board deck within 5 business days of quarter-end. Each pack carries a required sign-off — Treasury Operations for daily, CFO for weekly, CFO plus CCO for quarterly — and an unsigned pack past its deadline escalates to the CFO. If an upstream feed is missing, the pack still publishes on time with the affected sections flagged provisional rather than holding the whole pack. Pack templates are write-restricted to Treasury Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily pack scheduled (`report.daily_pack_due`) | LAR and band (`lar.value`, `lar.current_band`), gaps (`mismatch.current_gaps`), concentrations (`concentration.top10`), headroom (`collateral.unencumbered_balance`) | Daily ops pack + sign-off (`report.daily_pack_published`) | Daily by 17:00 (enforced by `report.daily_due_at`) |
  | Weekly digest scheduled (`report.weekly_digest_due`) | Week-over-week metric deltas (`report.weekly_deltas`), open breaches/waivers (`report.open_items[]`) | Weekly ALCO digest + CFO sign-off (`report.weekly_digest_published`) | Friday 12:00 (enforced by `report.weekly_due_at`) |
  | Quarter closes (`report.board_deck_due`) | Quarterly stress pack (`stress.pack_issued`), survival results (`survival.days_combined`), limit-exception history (`policy.exceptions[]`) | Quarterly Board deck + CFO/CCO sign-offs (`report.board_deck_published`) | Quarter-end + 5 BD (enforced by `report.board_due_at`) |

- **ALERTS/METRICS:** On-time publication rate per pack type (target 100%); count of packs published with provisional sections; sign-off latency distribution.

## LQ-10 — Regulatory Notification {#lq-10-regulatory-notification}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to establish lines of communication for liquidity events; timely notification of the NCUA is the regulatory leg of that requirement.
- **SYSTEM BEHAVIOR:** The credit union notifies the NCUA examiner-in-charge and regional office within 24 hours when any of four conditions occurs: CFP Level 2 or 3 activates ([LQ-14](#lq-14-cfp-purpose-activation)), a federal facility (CLF or Discount Window) is used or its use is attempted, combined-stress survival falls below 15 days ([LQ-04](#lq-04-survival-horizon-coverage-days)), or LAR falls below 6% ([LQ-05](#lq-05-liquid-assets-ratio-bands)). The CFO drafts the event memo, the CEO sends it, and the Board Chair is copied. An after-hours trigger is notified by 10:00 the next calendar day with the timing exception documented. Notification authority is restricted to the CEO (or Acting CEO per the succession matrix in [LQ-16](#lq-16-escalation-ladder-crisis-roles)).
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Notification condition met (`ncua.notification_required`) | Triggering condition (`ncua.trigger_condition`), current metrics pack (`ncua.metrics_snapshot`), examiner/region contacts (`regulator.contacts`) | Event memo sent + send confirmation (`ncua.notification_sent`) | **24 hours** (enforced by `ncua.notification_due_at`) |
  | NCUA acknowledges receipt (`ncua.ack_received`) | Acknowledgment detail (`ncua.ack_detail`) | Acknowledgment logged to incident record (`ncua.ack_logged`) | — |
  | Follow-up request from NCUA (`regulator.request_received`) | Request content (`regulator.request_detail`) | Hand-off to liaison protocol (`regulator.request_routed`) | Immediate routing to [LQ-19](#lq-19-regulator-liaison-protocols) |

- **ALERTS/METRICS:** Notifications-on-time rate (target 100%); countdown alert at 12 hours remaining on an unsent required notification (`alert.ncua_notification_aging`); count of after-hours timing exceptions.

## LQ-11 — Contingent Federal Liquidity Access {#lq-11-contingent-federal-liquidity-access}

- **WHY (Reg cite):** [12 CFR §741.12(a)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires credit unions of $250MM or more to demonstrate access to a federal contingent liquidity source — the Central Liquidity Facility under [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14) and/or the Federal Reserve Discount Window under [12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b).
- **SYSTEM BEHAVIOR:** The credit union maintains CLF membership (or agent access through a corporate credit union) and operational readiness at the Discount Window: executed legal agreements, current authorized-borrower lists, and collateral schedules kept synchronized with the encumbrance data in [LQ-12](#lq-12-collateral-encumbrance-management). An annual test of at least one federal facility — funded or no-funds — verifies that a draw could actually execute, with results feeding the after-action process in [LQ-20](#lq-20-liquidity-drills-after-action-reviews). Facility agreements and authorized-borrower lists are write-restricted to the CFO with Compliance countersign.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual facility test due (`facility.annual_test_due`) | Test script (`facility.test_script`), facility contacts (`facility.contacts`), pledged collateral schedule (`collateral.pledge_schedule`) | Test result + readiness attestation (`facility.test_completed`) | Annual (enforced by `facility.test_due_at`) |
  | Membership/agreement renewal due (`facility.renewal_due`) | Current agreements (`facility.agreements[]`), authorized-borrower list (`facility.authorized_borrowers[]`) | Renewed/confirmed access documentation (`facility.access_confirmed`) | Before expiry |
  | Collateral schedule drift detected (`facility.schedule_drift_detected`) | Facility-side schedule (`facility.collateral_schedule`), internal inventory (`collateral.inventory`) | Reconciled, re-filed collateral schedule (`facility.schedule_updated`) | 5 BD from detection |

- **ALERTS/METRICS:** Alert at 60 days before any facility agreement or test deadline (`alert.facility_readiness_aging`); readiness attestation freshness (target: none older than 12 months); collateral-schedule drift count (target zero).

## LQ-12 — Collateral & Encumbrance Management {#lq-12-collateral-encumbrance-management}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to identify funding sources actually available in stress — which depends on knowing, daily, what collateral is eligible, unencumbered, and at what haircut.
- **SYSTEM BEHAVIOR:** The system tracks eligible and unencumbered collateral balances and applicable haircuts by counterparty (FHLB if eligible, Discount Window, CLF, repo counterparties), updating daily and re-checking after any large market move or large pledge/release. All pledges and releases execute under dual control — no single individual can encumber or free collateral. A security in dispute or with uncertain eligibility is removed from headroom until cleared. Headroom figures feed survival modeling ([LQ-04](#lq-04-survival-horizon-coverage-days)) and the funding playbooks ([LQ-17](#lq-17-funding-playbooks-draw-order)). Pledge/release authority is restricted to named Treasury Operations officers under the dual-control rule.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD collateral file posted (`collateral.file_posted`) | Position inventory (`collateral.inventory`), eligibility rules (`collateral.eligibility_rules`), counterparty haircuts (`collateral.haircuts[]`) | Unencumbered-balance and headroom report (`collateral.headroom_computed`) | Daily (enforced by `collateral.compute_due_at`) |
  | Large market move or large pledge/release (`collateral.large_move_detected`) | Move detail (`collateral.move_detail`), revalued positions (`collateral.revalued_positions[]`) | Intraday headroom re-check (`collateral.headroom_rechecked`) | Same day |
  | Pledge or release requested (`collateral.pledge_requested`) | Position identifier (`collateral.position_id`), counterparty (`collateral.counterparty_id`), two authorizer identities (`collateral.authorizer_ids[]`) | Dual-controlled pledge/release record (`collateral.pledge_executed`) | — |

- **ALERTS/METRICS:** Alert when unencumbered headroom falls below the registry floor (`alert.headroom_low`); encumbrance percentage trend; count of pledge/release actions missing a second authorizer (target zero — hard block).

## LQ-13 — Wholesale / Listing-Service Deposits Guardrails {#lq-13-wholesale-listing-service-deposits-guardrails}

- **WHY (Reg cite):** [12 CFR §741.12(b)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires identification of funding sources and diversified funding; wholesale and listing-service deposits are permitted sources only within enforced guardrails that prevent over-reliance.
- **SYSTEM BEHAVIOR:** Only approved listing services may be used, with maturities laddered by tenor so no single maturity window concentrates rollover risk, and with rate-setting restricted to holders of pricing authority — the system rejects a listing posted outside the authorized rate schedule. Exposure (outstanding balance by service, tenor bucket, and rate) updates daily, and ALCO reviews the full wholesale book monthly. Listing-service exposure counts toward the concentration limits in [LQ-06](#lq-06-funding-concentration-counterparty-limits). The approved-service list and pricing authority matrix are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | EOD wholesale file posted (`wholesale.exposure_posted`) | Outstanding balances by service (`wholesale.balances[]`), tenor ladder (`wholesale.tenor_ladder`), registry limits (`policy.limit_registry`) | Exposure ladder report (`wholesale.exposure_computed`) | Daily (enforced by `wholesale.compute_due_at`) |
  | New listing posted (`wholesale.listing_requested`) | Service identity (`wholesale.service_id`), rate and tenor (`wholesale.rate`, `wholesale.tenor`), poster's pricing authority (`wholesale.pricing_authority_id`) | Approved or rejected listing record (`wholesale.listing_decisioned`) | Real-time |
  | Monthly ALCO review convenes (`wholesale.monthly_review_due`) | Month's exposure history (`wholesale.exposure_history`), maturity calendar (`wholesale.maturity_calendar`) | ALCO review minutes with dispositions (`wholesale.review_completed`) | Monthly (enforced by `wholesale.review_due_at`) |

- **ALERTS/METRICS:** Alert on a rejected listing attempt (`alert.wholesale_pricing_violation`); tenor-ladder concentration (share maturing in any 30-day window, target below the registry cap); listing-service share of total funding trend.

## LQ-14 — CFP Purpose & Activation {#lq-14-cfp-purpose-activation}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires a written CFP commensurate with complexity, addressing the management of liquidity events with defined responsibility and escalation.
- **SYSTEM BEHAVIOR:** The CFP activates in three levels tied directly to the LAR bands in [LQ-05](#lq-05-liquid-assets-ratio-bands): **Level 1 (Watch)** when LAR enters the Watch band, **Level 2 (Low)** when LAR enters the Low band, and **Level 3 (Critical)** when LAR enters the Critical band. Level 2 and 3 activations start transition actions within 2 hours, convene the crisis team per [LQ-16](#lq-16-escalation-ladder-crisis-roles), open the funding playbook per [LQ-17](#lq-17-funding-playbooks-draw-order), and trigger NCUA notification per [LQ-10](#lq-10-regulatory-notification). De-activation requires the LAR to return to the higher band and hold for the registry-defined confirmation period; a false-positive activation is reverted with a documented rationale rather than silently withdrawn. Level 2/3 activation authority rests with the CEO; Level 1 activates automatically on band change.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | LAR band deteriorates (`lar.band_changed`) | New band (`lar.current_band`), LAR value (`lar.value`), survival context (`survival.days_combined`) | CFP activation record at mapped level (`cfp.level_changed`) | Immediate |
  | Level 2/3 activation confirmed (`cfp.level_changed`) | Level playbook (`playbook.spec`), crisis roster (`crisis.roster`) | Transition actions opened as tasks (`cfp.transition_started`) | **2 hours** (enforced by `cfp.transition_due_at`) |
  | Band recovers and holds (`lar.band_recovered`) | Recovery confirmation period (`policy.limit_registry`), closing metrics (`lar.value`) | De-activation record with rationale (`cfp.deactivated`) | After confirmation period |

- **ALERTS/METRICS:** Time-to-activate distribution (band change to activation record, target under 15 minutes); time-to-first-transition-action against the 2-hour SLA; count of false-positive activations with documented reversion.

## LQ-15 — Early-Warning Indicators & Event Triggers {#lq-15-early-warning-indicators-event-triggers}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to address events that could erode liquidity; early-warning monitoring is how the credit union positions itself into readiness before activation thresholds are hit.
- **SYSTEM BEHAVIOR:** The system monitors a defined indicator set daily: volatile-liability growth, funding concentrations, negative press and social-media sentiment, asset-quality deterioration, rising funding costs, margin calls, early CD redemptions, and correspondent line cuts. Each indicator has green/amber/red thresholds in the limit registry. A red indicator opens an investigation and feeds the ad-hoc re-run triggers in [LQ-04](#lq-04-survival-horizon-coverage-days) and [LQ-07](#lq-07-stress-testing); a rumor or press spike also pre-stages communications per [LQ-18](#lq-18-external-communications-stakeholder-matrix). The CEO receives a weekly EWI summary regardless of status. Indicator thresholds are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily EWI sweep runs (`ewi.daily_sweep_due`) | Indicator feeds (`ewi.feeds[]`), thresholds (`ewi.thresholds[]`) | EWI dashboard refresh with statuses (`ewi.sweep_completed`) | Daily (enforced by `ewi.sweep_due_at`) |
  | Indicator crosses red threshold (`ewi.threshold_breached`) | Breaching indicator (`ewi.indicator_id`), value and trend (`ewi.value`, `ewi.trend`) | Investigation opened + downstream trigger records (`ewi.spike_flagged`) | Same day |
  | Weekly CEO summary due (`ewi.weekly_summary_due`) | Week's indicator history (`ewi.history`), open investigations (`ewi.open_investigations[]`) | CEO summary delivered (`ewi.ceo_summary_sent`) | Weekly (enforced by `ewi.summary_due_at`) |

- **ALERTS/METRICS:** Red-indicator acknowledgment latency (target under 4 business hours); count of red indicators without an open investigation (target zero); weekly summary on-time rate.

## LQ-16 — Escalation Ladder & Crisis Roles {#lq-16-escalation-ladder-crisis-roles}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to identify the responsibilities and authorities of personnel during a liquidity event.
- **SYSTEM BEHAVIOR:** Crisis roles are fixed in advance: the **CEO** owns external communications and is sole spokesperson, the **CFO** runs liquidity operations and the playbooks, **ALCO** advises, and the **Board** authorizes extraordinary measures (asset sales beyond playbook scope, emergency borrowing beyond pre-approved capacity). On Level 2/3 activation the crisis team convenes within 60 minutes; if the CEO is unreachable, the Acting CEO per the succession matrix assumes the role and the substitution is logged. All crisis decisions are recorded in a decision log with decider, basis, and time. The succession matrix and role roster are write-restricted to the CEO with Board visibility.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Level 2/3 activated (`cfp.level_changed`) | Crisis roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`), current liquidity snapshot (`report.daily_pack_published`) | Crisis team convened, attendance logged (`crisis.team_convened`) | **60 minutes** (enforced by `crisis.convene_due_at`) |
  | Crisis decision taken (`crisis.decision_proposed`) | Decision detail (`crisis.decision_detail`), decider identity (`crisis.decider_id`), authority basis (`crisis.authority_basis`) | Decision log entry (`crisis.decision_logged`) | Real-time |
  | Extraordinary measure proposed (`crisis.extraordinary_proposed`) | Measure description (`crisis.measure_detail`), Board quorum (`crisis.board_quorum`) | Board authorization record (`crisis.board_authorized`) | Before execution |

- **ALERTS/METRICS:** Convening latency against the 60-minute SLA; count of decisions executed without a log entry (target zero); succession-matrix freshness (reviewed within the last 12 months).

## LQ-17 — Funding Playbooks & Draw Order {#lq-17-funding-playbooks-draw-order}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to list available funding sources in the order they would be used; the CLF ([12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and the Discount Window ([12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b)) anchor the federal end of the draw order.
- **SYSTEM BEHAVIOR:** The playbook specifies an internal-then-external draw order: (1) cash and Fed balances, (2) unencumbered AFS securities, (3) saleable loans; then external — (4) FHLB if eligible, (5) Discount Window, (6) CLF, (7) listing-service CDs within the guardrails of [LQ-13](#lq-13-wholesale-listing-service-deposits-guardrails). On Level 2 activation, first-line actions execute within 2 hours. Every external draw requires dual authorization — two named officers, neither of whom may self-authorize. If a planned facility is unavailable (counterparty outage, eligibility lapse), execution branches to the next source in the order with the deviation logged; the CEO approves any deviation from the published order. Draw execution authority is restricted to the CFO and named Treasury Operations officers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Level 2 activated (`cfp.level_changed`) | Funding shortfall estimate (`funding.shortfall_estimate`), source registry with capacity/tenor/cost (`funding.sources[]`), collateral headroom (`collateral.unencumbered_balance`) | First-line draw orders executed (`funding.first_line_executed`) | **2 hours** (enforced by `funding.first_line_due_at`) |
  | External draw requested (`funding.external_draw_requested`) | Facility identity (`facility.id`), draw amount (`funding.draw_amount`), two authorizer identities (`funding.authorizer_ids[]`) | Dual-authorized draw + confirmation (`funding.draw_executed`) | Per facility cutoff |
  | Planned source unavailable (`funding.source_unavailable`) | Failure reason (`funding.unavailability_reason`), next source in order (`funding.next_source`) | Logged branch to alternate source (`funding.draw_order_deviated`) | Immediate |

- **ALERTS/METRICS:** First-line execution latency against the 2-hour SLA; count of external draws missing dual authorization (target zero — hard block); headroom-days remaining after each draw; realized cost of funds versus playbook estimate.

## LQ-18 — External Communications & Stakeholder Matrix {#lq-18-external-communications-stakeholder-matrix}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to establish lines of communication; disciplined external communication is the principal mitigant against perception-driven run risk.
- **SYSTEM BEHAVIOR:** The CEO is the sole spokesperson for all external liquidity communications. Pre-approved scripted updates exist for each stakeholder class in the stakeholder matrix — major depositors, BaaS partners, correspondent counterparties, media — and Level 2/3 communications go out same-day using only those scripts. Inbound media inquiries receive only the approved holding statement; no other employee may comment. Script edits require CEO approval with Compliance review; the stakeholder matrix is write-restricted to the Communications lead with CEO approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Level 2/3 activated (`cfp.level_changed`) | Stakeholder matrix (`comms.stakeholder_matrix`), approved scripts (`comms.scripts[]`) | Scripted notices sent + delivery log (`comms.notices_sent`) | Same day (enforced by `comms.same_day_due_at`) |
  | Media inquiry received (`comms.media_inquiry_received`) | Inquiry detail (`comms.inquiry_detail`), holding statement (`comms.holding_statement`) | Logged response using approved statement only (`comms.media_response_logged`) | Same day |
  | Script revision requested (`comms.script_change_requested`) | Draft script (`comms.draft_script`), CEO approval (`comms.ceo_approval`), Compliance review (`comms.compliance_review`) | Versioned approved script (`comms.script_approved`) | — |

- **ALERTS/METRICS:** Same-day delivery rate for Level 2/3 communications (target 100%); count of off-script external statements detected (target zero); stakeholder-matrix freshness (reviewed within the last 12 months).

## LQ-19 — Regulator Liaison Protocols {#lq-19-regulator-liaison-protocols}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires CFP communication lines to include the regulator; maintained contacts and responsive liaison are how that line stays open under stress.
- **SYSTEM BEHAVIOR:** Compliance maintains a current contact file for the NCUA examiner-in-charge and regional office, verified at least annually, plus a running file of event memos covering every notification sent under [LQ-10](#lq-10-regulatory-notification). Any regulator request — information, follow-up, or examination support — is answered within 1 business day unless the regulator directs a different timeline, in which case the directed timeline is logged and followed. All regulator interactions are logged in the liaison record. The contact file and liaison log are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Regulator request received (`regulator.request_received`) | Request detail (`regulator.request_detail`), responsive materials (`regulator.response_materials[]`) | Response sent + liaison log entry (`regulator.response_sent`) | 1 BD unless otherwise directed (enforced by `regulator.response_due_at`) |
  | Annual contact verification due (`regulator.contact_verification_due`) | Contact file (`regulator.contacts`) | Verified/updated contact file (`regulator.contacts_verified`) | Annual (enforced by `regulator.verification_due_at`) |
  | Event memo finalized (`ncua.notification_sent`) | Memo content (`ncua.memo`), related metrics snapshot (`ncua.metrics_snapshot`) | Memo filed to liaison record (`regulator.memo_filed`) | 2 BD of send |

- **ALERTS/METRICS:** Regulator-response on-time rate (target 100%); aging alert on any open request past 1 BD without a directed extension (`alert.regulator_request_aging`); contact-file verification currency.

## LQ-20 — Liquidity Drills & After-Action Reviews {#lq-20-liquidity-drills-after-action-reviews}

- **WHY (Reg cite):** [12 CFR §741.12(c)](https://www.ecfr.gov/current/title-12/part-741/section-741.12) requires the CFP to be operational, not aspirational — periodic testing of facilities ([12 U.S.C. §347b](https://www.law.cornell.edu/uscode/text/12/347b); [12 U.S.C. §§1795–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and crisis processes is the evidence.
- **SYSTEM BEHAVIOR:** The credit union runs the annual federal facility test from [LQ-11](#lq-11-contingent-federal-liquidity-access) plus at least one tabletop exercise per year simulating a Level 2/3 event end to end — detection, activation, convening, draws, communications, and notification. Every drill or test produces an after-action review published within 10 business days, with each finding assigned a remediation owner and due date tracked to closure. A failed test element (e.g., a draw that could not execute) opens an immediate corrective plan rather than waiting for the AAR. Drill design and AAR publication are owned by the CFO; remediation tracking is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Drill or test completes (`drill.completed`) | Drill objectives (`drill.objectives`), participant roster (`drill.roster`), observed results (`drill.observations[]`) | After-action review with owners and dates (`drill.aar_published`) | **10 BD** (enforced by `drill.aar_due_at`) |
  | Test element fails (`drill.element_failed`) | Failure detail (`drill.failure_detail`), affected capability (`drill.affected_capability`) | Immediate corrective plan opened (`drill.corrective_plan_opened`) | Same day |
  | Remediation item due (`drill.remediation_due`) | Remediation item (`drill.remediation_item`), owner (`drill.remediation_owner`) | Closure evidence or escalation (`drill.remediation_closed`) | Per assigned date (enforced by `drill.remediation_due_at`) |

- **ALERTS/METRICS:** AAR publication latency against the 10 BD SLA; remediation items past due (target zero, escalates to CCO); annual drill coverage check (facility test plus at least one tabletop completed per year).

## LQ-21 — Documentation & Retention {#lq-21-documentation-retention}

- **WHY (Reg cite):** [12 CFR §741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) compliance is demonstrated through records — examiners must be able to reconstruct the program's operation from retained evidence.
- **SYSTEM BEHAVIOR:** All liquidity program artifacts — policy versions and limit registries, daily/weekly/quarterly packs, breach and waiver records, NCUA notifications and liaison logs, facility tests, drill records, and AARs — are retained for 10 years in an immutable archive, indexed within 2 business days of creation so any artifact is retrievable by date, type, and control ID. The archive supports legal hold: held records are exempt from any disposition until the hold is released by Legal. Records containing PII or privileged content are stored in a restricted vault tier. Archive disposition authority is restricted to Compliance, and legal-hold release is restricted to Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Liquidity artifact finalized (`record.finalized`) | Artifact content (`record.blob`), metadata: type, date, control ID (`record.metadata`) | Indexed immutable archive entry (`record.indexed`) | **2 BD** (enforced by `record.index_due_at`) |
  | Legal hold placed (`record.legal_hold_placed`) | Hold scope (`record.hold_scope`), authorizing counsel (`record.hold_authorizer`) | Held records flagged, disposition suspended (`record.hold_applied`) | Same day |
  | Retention period expires (`record.retention_expired`) | Record age (`record.age`), hold status (`record.hold_status`) | Disposition record or hold-based deferral (`record.dispositioned`) | After 10 years, hold permitting |

- **ALERTS/METRICS:** Indexing latency against the 2 BD SLA; retention-gap scan (artifacts referenced by other controls but missing from the archive, target zero); count of disposition actions attempted against held records (target zero — hard block).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (policy owner). The CFO is the liquidity program owner and operates the controls day to day.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The CEO, ALCO, and the Board are required participants: ALCO reviews the wholesale book monthly ([LQ-13](#lq-13-wholesale-listing-service-deposits-guardrails)) and advises in crisis ([LQ-16](#lq-16-escalation-ladder-crisis-roles)); the Board approves the limit registry ([LQ-01](#lq-01-policy-scope-risk-appetite)), receives the quarterly deck ([LQ-09](#lq-09-reporting-cadence)), and authorizes extraordinary measures ([LQ-16](#lq-16-escalation-ladder-crisis-roles)).
- **Review cadence:** Annual, and within 10 business days after any material change per [LQ-01](#lq-01-policy-scope-risk-appetite); drill and AAR findings ([LQ-20](#lq-20-liquidity-drills-after-action-reviews)) may force an earlier review.
- **Cross-references:** Investment portfolio credit, valuation, and concentration — Investment Policy. Capital adequacy and reserves — Capitalization and Basel-II Standardized Approach Framework Policies. Physical cash and vault operations — Cash Policy. Enterprise-wide risk appetite — Enterprise Risk Management Policy. Business continuity and operational resilience — Business Continuity Plan.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The parsed engineering spec (Cassandra Banking Core API v1.0.0) registers no events, timers, or state machines, and its entities cover banking-core resources only (accounts, transfers, FBO positions, BSA alerts). Every `event.code`, `field.code`, and timer referenced in the EVENTS tables of this document — the `policy.*`, `catalogue.*`, `liquidity.*`, `mismatch.*`, `survival.*`, `lar.*`, `concentration.*`, `stress.*`, `dq.*`, `model.*`, `report.*`, `ncua.*`, `facility.*`, `collateral.*`, `wholesale.*`, `cfp.*`, `ewi.*`, `crisis.*`, `funding.*`, `comms.*`, `regulator.*`, `drill.*`, and `record.*` namespaces — is the target naming scheme and must be registered by engineering before the next review. The only spec-registered surface this policy touches is FBO position data (`fbo_position.balance`) used in [LQ-06](#lq-06-funding-concentration-counterparty-limits).
- **Asset-size applicability assumed.** The policy assumes Pynthia is at or above the $250MM threshold of 12 CFR §741.12(a), making documented federal contingent liquidity access ([LQ-11](#lq-11-contingent-federal-liquidity-access)) mandatory rather than advisory. If assets are between $50MM and $250MM, LQ-11 remains in force as a prudential control but the federal-access documentation requirement is not regulatory. Confirm current asset size and trajectory.
- **LAR bands and survival thresholds are policy-set, not regulatory.** The 10/8/6% LAR bands, the 15-day combined-survival notification threshold, and the 2-hour/60-minute crisis SLAs operationalize §741.12 but are internal choices requiring Board confirmation; NCUA prescribes none of these specific values.
- **The 24-hour NCUA notification commitment is self-imposed.** §741.12 requires CFP communication lines with the regulator but does not mandate a 24-hour clock; the four notification triggers in [LQ-10](#lq-10-regulatory-notification) reflect Patrick's directive and should be confirmed with the examiner-in-charge as the working protocol.
- **FHLB eligibility unconfirmed.** The draw order in [LQ-17](#lq-17-funding-playbooks-draw-order) includes FHLB "if eligible." Credit-union FHLB membership depends on district and charter specifics; confirm eligibility, and if ineligible, the draw order collapses to Discount Window then CLF at the external tier.
- **CLF access mode unconfirmed.** [LQ-11](#lq-11-contingent-federal-liquidity-access) covers both direct CLF membership and agent access through a corporate credit union; which mode Pynthia holds (or will establish) must be confirmed, as the legal documentation and test mechanics differ.
- **Intraday-recalc and "large move" thresholds undefined.** [LQ-03](#lq-03-maturity-mismatch-limits) and [LQ-12](#lq-12-collateral-encumbrance-management) reference registry thresholds for triggering intraday recalculation; PATRICK_NOTES did not specify values. Treasury Operations should propose values for Board approval with the first limit registry.
- **BaaS shock scenario parameters need partner data.** The BaaS-specific stress shocks in [LQ-07](#lq-07-stress-testing) (partner concentration runs, sweep failures, program wind-down) require per-partner flow profiles that do not yet exist as modeled inputs; provisional parameters will be used until partner flow histories support calibration.
- **Retention period exceeds spec retention.** [LQ-21](#lq-21-documentation-retention) mandates 10-year retention for liquidity artifacts, while the engineering spec's underlying entities carry 5–7 year retention tags. The liquidity archive must be a separate store (or an override tier) so program records are not disposed on the banking-core schedule.
- **Approver set is thin.** PATRICK_NOTES name the CCO as sole listed approver while requiring the CFO, CEO, ALCO, and Board as participants. Board adoption of this policy (standard for a §741.12 liquidity policy) should be added to the approval chain at the next Board meeting.
