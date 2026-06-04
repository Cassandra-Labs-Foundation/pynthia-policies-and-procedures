---
title: Cash Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Cash, Cash Control, Cash Management, Dual Control, Reconciliation, Vault, ATM]
---

## General Policy Statement

Pynthia Credit Union safeguards all cash and cash-equivalent devices — vaults, teller drawers, ATMs/ITMs, cash recyclers, petty cash, night depositories, and cash shipments — through board-approved limits, dual control, segregation of duties, daily general-ledger tie-out, and surprise counts. This policy merges the former Cash Control and Cash Management policies into a single program covering every employee who handles cash and every location and channel where cash is received, disbursed, stored, shipped, or reconciled. The Board delegates day-to-day control to management while retaining ultimate responsibility through limit approval, surprise counts, independent audits, and review of Supervisory Committee and regulatory examinations; cash-risk indicators and exceptions feed the BSA/AML governance cadence.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Enterprise cash exceeds board-approved cap | EOD aggregation crosses cap → `cash.enterprise_limit.breached` | **Same business day** remediation (Treasury invests excess) | Enterprise limit schedule | [CSH-03](#csh-03-enterprise-cash-limit) |
| Device/location load above limit without exception ticket | Load request exceeds limit → `cash.location_limit.exceeded` | **Real-time** warn/block at point of load | Per-asset limits schedule | [CSH-04](#csh-04-location-device-cash-limits) |
| Key/combination rotation | Personnel change or rotation timer → `cash.custody.rotation_due` | On personnel change; otherwise **≤90 days** | Custodian registry | [CSH-05](#csh-05-dual-control-keys-combinations) |
| Access revocation on termination | HR separation posted → `hr.user.separated` | **Immediate** (same day) | Custodian registry | [CSH-05](#csh-05-dual-control-keys-combinations) |
| Daily cash-to-GL reconciliation | Business day close → `cash.recon.day_closed` | **Same-day** tie-out to GL | Reconciliation pack | [CSH-06](#csh-06-reconciliation-gl-controls) |
| Over/short variance investigation | Variance posted → `cash.overshort.posted` | Investigate within **1 business day** | Over/short register | [CSH-07](#csh-07-over-short-monitoring) |
| Inbound/outbound shipment verification | Courier receipt logged → `cash.shipment.received` / `cash.shipment.dispatched` | **Same-day** verification against courier receipts and GL | Shipment log | [CSH-08](#csh-08-atm-itm-night-drop-shipments) |
| Surprise cash count | Count scheduler fires → `cash.surprise_count.due` | **At least monthly per site**; variances resolved within **1 business day** | Count sheets | [CSH-09](#csh-09-surprise-cash-counts-audits) |
| Seasonal deviation approval | Deviation memo submitted → `cash.deviation.requested` | Board approval **before** limits are exceeded; temporary limits **sunset on end date** | Board deviation memo | [CSH-10](#csh-10-seasonal-deviations-exceptions) |
| New-hire cash training | Hire in covered role → `hr.user.hired_covered_role` | Initial training within **30 days** of hire; refresher **annually** | Training curriculum | [CSH-11](#csh-11-training-competency) |
| Monthly KPI/KRI publication | Month end closes → `cash.kri.month_closed` | Within **15 calendar days** of month end | KRI dashboard | [CSH-12](#csh-12-monitoring-reporting-recordkeeping) |
| Quarterly Board summary | Quarter end closes → `cash.governance.quarter_closed` | Next regular Board meeting after quarter end | Board cash summary | [CSH-01](#csh-01-governance-delegation) |
| Annual policy review | Review tickler fires → `policy.review.due` | **≤12 months** between approvals | This policy | [CSH-01](#csh-01-governance-delegation) |

## CSH-01 — Governance & Delegation {#csh-01-governance-delegation}

- **WHY (Reg cite):** The Federal Credit Union Act vests management of the credit union in the Board ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)), and the BSA/AML program rule requires a board-approved program with internal controls into which cash-risk governance feeds ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/section-1020.210); [31 U.S.C. §5318(h)](https://www.law.cornell.edu/uscode/text/31/5318)).
- **SYSTEM BEHAVIOR:** The credit union maintains this policy as a board-approved, living document. The Board approves the limits schedule annually and on any change; cash-risk KRIs feed the AML governance dashboard monthly; exceptions are tracked in an attested register and reported on the BSA governance cadence (annual review, monthly KRIs, quarterly Board summaries). If a limits-schedule change is needed between annual reviews, it follows the same Board-approval path before taking effect. The limits schedule and exception register are write-restricted to Compliance; the Board approval record is write-restricted to the Board secretary.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual review tickler fires (`policy.review.due`) | Current policy text (`policy.document_id`), limits schedule (`cash.limits_schedule`), prior-year exception register (`cash.exception_register`) | Board-approved policy and limits schedule (`policy.board_approved`) | ≤12 months between approvals (enforced by `policy.review_due_at`) |
  | Month end closes (`cash.kri.month_closed`) | Cash KRI values (`cash.kri.values[]`), open exceptions (`cash.exception_register.open[]`) | KRI feed posted to AML governance dashboard (`aml.dashboard.cash_kri_posted`) | 15 calendar days after month end (internal: 10 CD) |
  | Quarter end closes (`cash.governance.quarter_closed`) | Quarterly KRI trend (`cash.kri.trend`), exception summary (`cash.exception_register.summary`), surprise-count results (`cash.surprise_count.results[]`) | Board cash summary delivered and minuted (`board.cash_summary.delivered`) | Next regular Board meeting after quarter end |

- **ALERTS/METRICS:** Overdue policy review (target zero), KRI publication latency vs. the 15-day deadline, count of exceptions open >30 days, Board summaries delivered on time (target 4/4 per year).

## CSH-02 — Scope & Applicability {#csh-02-scope-applicability}

- **WHY (Reg cite):** NCUA's security program rule requires written procedures covering each office and the assets at risk ([12 CFR §748.1(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)), and AML internal controls must be commensurate with the institution's footprint ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Compliance maintains a coverage registry that tags every covered employee, cash-handling activity, and location/channel (branches, operations center, ATMs/ITMs, recyclers, night depositories). Coverage must be updated before go-live of any new cash-bearing asset or new cash-handling role. At small sites where full segregation of duties is impractical, the registry documents the compensating reviews (e.g., manager review of the reconciler's own work) in lieu of separation. The coverage registry is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New cash-bearing asset or role proposed (`cash.coverage.change_requested`) | Asset/role description (`cash.asset.descriptor`), location/channel (`cash.location.id`), assigned custodians (`cash.custodian.user_ids[]`) | Coverage registry updated with tags and any compensating-review note (`cash.coverage.updated`) | Before go-live (internal: ≥5 BD before activation) |
  | Periodic coverage attestation (`cash.coverage.attestation_due`) | Current registry (`cash.coverage.registry`), HR roster of covered roles (`hr.roster.covered_roles[]`) | Attested coverage registry (`cash.coverage.attested`) | Annually with policy review (enforced by `cash.coverage.attestation_due_at`) |

- **ALERTS/METRICS:** Count of cash-bearing assets live without a coverage tag (target zero), days between asset go-live and registry update, small-site compensating reviews completed vs. scheduled.

## CSH-03 — Enterprise Cash Limit {#csh-03-enterprise-cash-limit}

- **WHY (Reg cite):** Holding excess un-invested cash is a safety-and-soundness exposure under the Board's FCUA management duty ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)) and inflates the exposure the fidelity bond must cover ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** Total cash on hand across all locations and devices is capped at a board-approved percentage of total assets. The system aggregates all location/device balances at end of day, compares to the cap, and auto-notifies Treasury to invest excess when the aggregate approaches or exceeds the cap. Breaches are remediated the same business day; if a same-day shipment or investment is operationally impossible (e.g., courier cutoff missed), the breach is logged as an exception with next-business-day remediation and reported per [CSH-01](#csh-01-governance-delegation). The cap value is write-restricted to the Board approval workflow.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | End-of-day aggregation runs (`cash.enterprise_position.computed`) | Per-location balances (`cash.location.balance[]`), total assets (`gl.total_assets`), board cap percentage (`cash.enterprise_limit.pct`) | Enterprise cash position record (`cash.enterprise_position.posted`) | Each business day at close (enforced by `cash.enterprise_position.schedule`) |
  | Position crosses warning threshold (`cash.enterprise_limit.warning`) | Position vs. cap delta (`cash.enterprise_position.headroom`) | Treasury auto-notification to invest excess (`treasury.invest_excess.notified`) | Same business day |
  | Position breaches cap (`cash.enterprise_limit.breached`) | Breach amount (`cash.enterprise_position.excess`), remediation plan (`cash.remediation.plan`) | Same-day remediation record + exception entry if unremediated (`cash.enterprise_limit.remediated`, `cash.exception.logged`) | Same business day (enforced by `cash.enterprise_limit.remediation_due_at`) |

- **ALERTS/METRICS:** Days at >90% of cap, breach count per quarter (target zero), median remediation time, excess-cash dollars invested per Treasury notification.

## CSH-04 — Location & Device Cash Limits {#csh-04-location-device-cash-limits}

- **WHY (Reg cite):** NCUA's security program requires controls that limit currency exposure at each office and device ([12 CFR §748.1(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)), and fidelity bond adequacy depends on enforced per-asset limits ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** Compliance maintains board-approved per-asset limits for each vault, teller drawer, ATM, ITM/VTM, recycler, and petty cash fund. The system enforces limits in real time at the point of load: loads above limit are warned, and blocked unless an approved exception ticket is attached. Vault, ATM, ITM, and recycler operations require two custodians present; teller drawers and petty cash are single-custodian assets governed by the over/short regime in [CSH-07](#csh-07-over-short-monitoring). The limits table is write-restricted to Compliance under Board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Cash load requested for a device or location (`cash.load.requested`) | Asset ID and current balance (`cash.asset.id`, `cash.asset.balance`), load amount (`cash.load.amount`), per-asset limit (`cash.asset.limit`), exception ticket if any (`cash.exception_ticket.id`) | Load approved, warned, or blocked decision (`cash.load.decided`) | Real time at point of load |
  | Load would exceed limit without ticket (`cash.location_limit.exceeded`) | Overage amount (`cash.load.overage`), requesting custodians (`cash.custodian.user_ids[]`) | Block + exception alert to branch manager and Compliance (`cash.limit_block.alerted`) | Real time |
  | Limits schedule changed (`cash.limits_schedule.updated`) | Board approval reference (`board.approval.id`), new limit values (`cash.asset.limit[]`) | Versioned limits schedule effective (`cash.limits_schedule.effective`) | Before new limits are enforced |

- **ALERTS/METRICS:** Blocked-load count by site, loads completed with exception tickets vs. total, assets persistently >85% of limit, dual-custodian attestation rate on vault/ATM/ITM/recycler operations (target 100%).

## CSH-05 — Dual Control, Keys & Combinations {#csh-05-dual-control-keys-combinations}

- **WHY (Reg cite):** NCUA's security program requires procedures to safeguard currency against robbery and embezzlement, including controlled access devices ([12 CFR §748.1(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)); dual control over cash custody is a core internal control expected by the AML program rule ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Dual control is mandatory for vault access, cash shipments, ATM/ITM loads, and night-drop retrieval: two authorized custodians must each attest presence before the operation proceeds. Compliance maintains a key/combination custodian registry mapping every key, combination half, and access credential to a named individual. Combinations and keys rotate on any personnel change affecting a custodian and at least every 90 days regardless; on termination, all assignments are revoked immediately (same day) and the affected combinations changed. A sealed master copy of combinations/keys is held in the dual-control key box for emergencies; any emergency use triggers a dual-control audit before sole control is restored. The custodian registry is write-restricted to Compliance, with HR feed read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Dual-control operation initiated (`cash.dual_control.initiated`) | Asset ID (`cash.asset.id`), two custodian attestations (`cash.custodian.attestations[]`) | Operation authorized with both identities logged (`cash.dual_control.completed`) | Real time; operation blocked until second attestation |
  | Rotation timer or personnel change (`cash.custody.rotation_due`) | Affected assignments (`cash.custody.assignments[]`), new custodian designations (`cash.custodian.user_ids[]`) | Rotated keys/combinations and updated registry (`cash.custody.rotated`) | On personnel change; otherwise ≤90 days (enforced by `cash.custody.rotation_due_at`) |
  | HR separation posted for a custodian (`hr.user.separated`) | Separated user (`hr.user.id`), their custody assignments (`cash.custody.assignments[]`) | Immediate revocation + combination change order (`cash.custody.revoked`) | Same day (internal: before end of shift) |
  | Emergency master-copy access (`cash.keybox.opened`) | Two authorizing officers (`cash.custodian.attestations[]`), reason (`cash.keybox.reason`) | Emergency access record + mandatory follow-up dual-control audit (`cash.keybox.access_logged`, `cash.audit.scheduled`) | Audit before sole control is restored |

- **ALERTS/METRICS:** Overdue rotations (target zero), time-to-revoke on termination (target same day, 100%), single-attestation attempts blocked, emergency key-box openings per quarter with audit completion rate.

## CSH-06 — Reconciliation & GL Controls {#csh-06-reconciliation-gl-controls}

- **WHY (Reg cite):** Records preservation rules require accurate, current books ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)), and AML internal controls depend on cash positions tying to the general ledger so anomalies surface ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Every teller drawer, vault, ATM/ITM, recycler, and petty cash fund reconciles to the general ledger daily with same-day tie-out. Unmatched items post to a cash suspense account and must clear within defined aging (internal standard: 5 business days; items aging beyond 10 business days escalate to the Controller and Compliance). Duties are segregated: the person with custody of cash does not post entries, and the person who posts does not perform the reconciliation; at small sites, the compensating reviews documented under [CSH-02](#csh-02-scope-applicability) apply. Suspense write-offs are write-restricted to the Controller with Compliance countersign.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Business day closes (`cash.recon.day_closed`) | Physical/device counts (`cash.asset.count[]`), GL cash balances (`gl.cash_accounts.balance[]`), prior-day suspense (`gl.cash_suspense.items[]`) | Daily reconciliation pack with tie-out result (`cash.recon.completed`) | Same business day (enforced by `cash.recon.due_at`) |
  | Tie-out fails (`cash.recon.variance_found`) | Variance amount and asset (`cash.recon.variance`, `cash.asset.id`) | Suspense entry + over/short referral to [CSH-07](#csh-07-over-short-monitoring) (`gl.cash_suspense.posted`, `cash.overshort.posted`) | Same business day |
  | Suspense item ages past threshold (`gl.cash_suspense.aged`) | Item age and amount (`gl.cash_suspense.item`), research notes (`cash.recon.research_notes`) | Escalation to Controller/Compliance and resolution or approved write-off (`gl.cash_suspense.escalated`, `gl.cash_suspense.cleared`) | Clear within 5 BD; escalate at 10 BD (enforced by `gl.cash_suspense.aging_timer`) |

- **ALERTS/METRICS:** Same-day tie-out completion rate (target 100%), suspense items >5 BD and >10 BD (target zero at 10 BD), segregation-of-duties conflicts detected in role assignments (target zero).

## CSH-07 — Over/Short Monitoring {#csh-07-over-short-monitoring}

- **WHY (Reg cite):** Recurring cash variances are a primary embezzlement and suspicious-activity signal the security program and AML program must detect ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1); [31 U.S.C. §5318(h)](https://www.law.cornell.edu/uscode/text/31/5318)).
- **SYSTEM BEHAVIOR:** Every over/short is recorded per person and per location and posted the same day it is discovered — drawer balances are never adjusted without a correcting transaction. Variances are investigated within 1 business day: starting cash verified, the drawer hand-counted (straps broken, no machine count) under supervisor or designee control, and transactions reviewed if unresolved; the custodian remains at their station until dismissed by the supervisor. Coaching and discipline thresholds are maintained by HR with Compliance (cumulative count and gross-dollar bands per rolling 12 months); a cumulative or single unresolved variance at the discipline threshold triggers a formal performance evaluation, retraining, and increased random counts. Trainees accrue measured variances only after their first 90 days. Recurring or anomalous patterns (e.g., repeated shorts at one drawer or location) are signaled to AML case management. The over/short register is write-restricted to branch supervisors and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Variance discovered at balancing (`cash.overshort.posted`) | Person and location (`cash.custodian.user_id`, `cash.location.id`), amount and direction (`cash.overshort.amount`), correcting transaction (`gl.correction.txn_id`) | Over/short register entry posted same day (`cash.overshort.recorded`) | Same day discovered |
  | Investigation opened (`cash.overshort.investigation_opened`) | Drawer recount result (`cash.asset.count`), transaction review notes (`cash.overshort.research_notes`) | Resolution or unresolved determination (`cash.overshort.resolved` / `cash.overshort.unresolved`) | 1 business day (enforced by `cash.overshort.investigation_due_at`) |
  | Threshold crossed per person (`cash.overshort.threshold_crossed`) | 12-month cumulative count and gross dollars (`cash.overshort.cumulative`), threshold bands (`cash.overshort.thresholds`) | Coaching/discipline action record + evaluation if at discipline band (`hr.coaching.recorded`) | Within 5 BD of threshold crossing |
  | Anomalous pattern detected (`cash.overshort.anomaly_detected`) | Pattern descriptor (`cash.overshort.pattern`), person/location history (`cash.overshort.history[]`) | AML case-management referral (`aml.case.referred`) | Within 1 BD of detection |
  | Month end closes (`cash.kri.month_closed`) | Register totals by person and site (`cash.overshort.monthly_summary`) | Monthly over/short report to management and the [CSH-01](#csh-01-governance-delegation) KRI feed (`cash.overshort.report_issued`) | 15 calendar days after month end |

- **ALERTS/METRICS:** Investigations open >1 BD (target zero), per-person 12-month gross variance distribution, AML referral count, unresolved-variance dollars per month.

## CSH-08 — ATM/ITM/Night-Drop & Shipments {#csh-08-atm-itm-night-drop-shipments}

- **WHY (Reg cite):** The security program rule requires procedures for safekeeping currency in transit and in unattended devices ([12 CFR §748.1(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)); shipment and device-service records are retainable evidence under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
- **SYSTEM BEHAVIOR:** Device loads/retrievals (ATM, ITM, recycler) and night-drop handling are performed under dual control with seal numbers captured at every custody hand-off; a broken or mismatched seal stops the process and opens an immediate variance investigation. All inbound and outbound cash shipments are logged and verified the same day against armored-courier receipts and the GL; discrepancies post to suspense under [CSH-06](#csh-06-reconciliation-gl-controls) and the courier is notified the same day. Night-drop bags are logged at retrieval and contents verified under dual control before crediting. Shipment scheduling and courier-liaison records are write-restricted to Operations with Compliance read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Device load or retrieval performed (`cash.device.serviced`) | Two custodian attestations (`cash.custodian.attestations[]`), cassette/seal numbers (`cash.seal.numbers[]`), load/retrieval amounts (`cash.load.amount`) | Device service record with seals (`cash.device.service_logged`) | Real time at service |
  | Night-drop retrieved (`cash.nightdrop.retrieved`) | Bag IDs and seals (`cash.nightdrop.bag_ids[]`, `cash.seal.numbers[]`), dual-control attestations (`cash.custodian.attestations[]`) | Verified contents credited + log entry (`cash.nightdrop.verified`) | Same business day as retrieval |
  | Shipment dispatched or received (`cash.shipment.dispatched` / `cash.shipment.received`) | Courier receipt (`courier.receipt.id`), declared amount (`cash.shipment.amount`), GL entry (`gl.cash_in_transit.entry`) | Same-day verification record; discrepancy to suspense if unmatched (`cash.shipment.verified`, `gl.cash_suspense.posted`) | Same business day (enforced by `cash.shipment.verification_due_at`) |
  | Seal broken or mismatched (`cash.seal.mismatch`) | Expected vs. found seals (`cash.seal.expected`, `cash.seal.found`), custodians present (`cash.custodian.attestations[]`) | Halt + immediate variance investigation opened (`cash.overshort.investigation_opened`) | Immediate; investigation per [CSH-07](#csh-07-over-short-monitoring) timelines |

- **ALERTS/METRICS:** Shipments unverified at end of day (target zero), seal-mismatch count per quarter, night-drop bags pending verification overnight (target zero), dual-control attestation completeness on device services (target 100%).

## CSH-09 — Surprise Cash Counts & Audits {#csh-09-surprise-cash-counts-audits}

- **WHY (Reg cite):** Supervisory Committee audit and verification duties include cash counts ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)), and AML independent testing must cover cash-handling controls ([31 CFR §1020.210(b)(1)(ii)](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Surprise counts are performed across tellers, vaults, and devices at least monthly per site, scheduled by an unpredictable selector and executed under dual control by someone independent of the asset's custodian. The custodian never leaves during their drawer's count, and counts are hand-counts with straps broken. Variances are resolved within 1 business day via the [CSH-07](#csh-07-over-short-monitoring) investigation path. Results feed the Supervisory Committee, the independent audit, and AML independent testing. Count schedules are write-restricted to Compliance and concealed from custodians until execution.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Count scheduler fires (`cash.surprise_count.due`) | Selected assets (`cash.asset.id[]`), independent counter assignment (`cash.counter.user_id`), custodian of record (`cash.custodian.user_id`) | Executed count sheet with dual signatures (`cash.surprise_count.completed`) | At least monthly per site (enforced by `cash.surprise_count.schedule`) |
  | Count variance found (`cash.surprise_count.variance`) | Counted vs. system balance (`cash.asset.count`, `cash.asset.balance`) | Variance investigation opened (`cash.overshort.investigation_opened`) | Resolve within 1 business day |
  | Quarter end closes (`cash.governance.quarter_closed`) | Quarterly count results (`cash.surprise_count.results[]`) | Results package to Supervisory Committee, independent audit, and AML independent testing (`supervisory.count_results.delivered`) | With the quarterly Board summary in [CSH-01](#csh-01-governance-delegation) |

- **ALERTS/METRICS:** Sites with no count in a calendar month (target zero), variance rate per 100 counts, average variance resolution time, count-schedule predictability checks (no custodian counted on a fixed pattern).

## CSH-10 — Seasonal Deviations & Exceptions {#csh-10-seasonal-deviations-exceptions}

- **WHY (Reg cite):** The Board's duty to maintain adequate fidelity bond coverage extends to temporary exposure increases ([12 CFR §713.2](https://www.ecfr.gov/current/title-12/part-713/section-713.2)), and limit changes are Board business under the FCUA ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)).
- **SYSTEM BEHAVIOR:** Any planned exceedance of cash limits (e.g., holiday demand, branch opening) requires a formal Board deviation memo stating the reason, duration, revised limits, and any bond/insurance adjustment — approved before limits are exceeded. Approved deviations are loaded as whitelisted temporary limits in the enforcement engine and sunset automatically on the memo's end date, after which standard limits re-apply without further action. Unplanned, unavoidable exceedances (e.g., an unexpectedly large member deposit at closing) are handled as same-day exceptions under [CSH-03](#csh-03-enterprise-cash-limit) and [CSH-04](#csh-04-location-device-cash-limits) rather than deviations. Deviation memos and whitelist entries are write-restricted to Compliance under Board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Deviation memo submitted (`cash.deviation.requested`) | Reason and duration (`cash.deviation.reason`, `cash.deviation.period`), revised limits (`cash.deviation.limits[]`), bond/insurance assessment (`insurance.bond.adjustment`) | Board decision recorded (`cash.deviation.board_decided`) | Before the deviation start date |
  | Deviation approved (`cash.deviation.approved`) | Approved memo reference (`board.approval.id`) | Whitelisted temporary limits active in enforcement engine (`cash.limits_whitelist.activated`) | Effective on start date only |
  | Deviation end date reached (`cash.deviation.expired`) | Whitelist entry (`cash.limits_whitelist.entry`) | Automatic sunset; standard limits restored (`cash.limits_whitelist.sunset`) | On end date (enforced by `cash.deviation.sunset_at`) |

- **ALERTS/METRICS:** Limits exceeded without an approved deviation (target zero), whitelist entries active past end date (target zero), deviation lead time (approval date vs. start date).

## CSH-11 — Training & Competency {#csh-11-training-competency}

- **WHY (Reg cite):** The security program rule requires initial and periodic training of officers and employees in security procedures ([12 CFR §748.1(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)), and the AML program rule requires training for appropriate personnel ([31 CFR §1020.210(b)(1)(iii)](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Every employee in a covered role completes initial cash training within 30 days of hire and an annual refresher. The curriculum covers handling accuracy, counterfeit detection, fraud schemes, robbery and emergency response, dual control, and device/shipment procedures, with role-specific proficiency checks (e.g., vault custodians demonstrate dual-control and seal procedures; tellers demonstrate balancing and counterfeit detection). New hires acknowledge this policy in writing before operating a cash drawer. Employees who fail a proficiency check are restricted from the corresponding cash duty until they pass a retest. Training records are write-restricted to HR/Training with Compliance read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Hire into covered role (`hr.user.hired_covered_role`) | Role and curriculum assignment (`training.curriculum.id`), policy acknowledgment (`policy.acknowledgment.signed`) | Completed initial training + proficiency result (`training.initial.completed`) | 30 days of hire (enforced by `training.initial.due_at`) |
  | Annual refresher cycle (`training.refresher.due`) | Covered-role roster (`hr.roster.covered_roles[]`), updated curriculum (`training.curriculum.id`) | Refresher completion records (`training.refresher.completed`) | Annually (enforced by `training.refresher.due_at`) |
  | Proficiency check failed (`training.proficiency.failed`) | Failed competency (`training.competency.id`), affected duty (`cash.duty.id`) | Duty restriction until retest passed (`cash.duty.restricted`, `training.retest.passed`) | Restriction immediate; retest within 10 BD |

- **ALERTS/METRICS:** Covered employees past the 30-day initial deadline (target zero), annual refresher completion rate (target 100% by cycle close), proficiency first-pass rate by role, employees operating cash duties while restricted (target zero).

## CSH-12 — Monitoring, Reporting & Recordkeeping {#csh-12-monitoring-reporting-recordkeeping}

- **WHY (Reg cite):** Records preservation requirements govern retention of cash evidence ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)); Supervisory Committee verification and AML independent testing need exportable evidence ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715); [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/section-1020.210)).
- **SYSTEM BEHAVIOR:** Compliance publishes monthly cash KPIs/KRIs (limit utilization, breaches, over/short totals, suspense aging, count results, training currency) within 15 calendar days of month end, maintains an attested exception log, and retains required evidence — reconciliation packs, count sheets, dual-control logs, device load sheets, shipment receipts, and exception registers — per the records schedule (periods beyond cash-specific evidence are governed by the Record Retention Policy). On request, the system produces examiner and AML independent-testing exports covering any date range; a litigation hold supersedes any scheduled purge. Retention deletion and export generation are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Month end closes (`cash.kri.month_closed`) | KPI/KRI source data (`cash.kri.values[]`), exception log (`cash.exception_register`) | Published KPI/KRI report (`cash.kri.published`) | 15 calendar days of month end (enforced by `cash.kri.publish_due_at`) |
  | Evidence artifact created (`cash.evidence.created`) | Artifact type and retention class (`cash.evidence.type`, `records.retention.class`) | Artifact stored with retention timer (`cash.evidence.retained`) | Per records schedule (enforced by `records.retention.expires_at`) |
  | Examiner or independent-testing request (`exam.export.requested`) | Date range and scope (`exam.export.scope`), requesting authority (`exam.requestor.id`) | Complete export package delivered (`exam.export.delivered`) | Within 5 business days of request |

- **ALERTS/METRICS:** KRI publication latency vs. the 15-day deadline, exception-log attestation completeness, export turnaround time, evidence artifacts missing a retention class (target zero).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, the limits schedule, the exception register, and the KRI feed to AML governance.
- **Required participants:** Operations (device, shipment, and branch execution), Treasury/Finance (enterprise limit and excess-cash investment), BSA Officer (AML linkage, case referrals, independent testing), Supervisory Committee (surprise counts, verification, audit).
- **Approvals:** Patrick Wilson, Chief Compliance Officer. The Board approves this policy, the limits schedule, and all deviations per [CSH-01](#csh-01-governance-delegation) and [CSH-10](#csh-10-seasonal-deviations-exceptions).
- **Review cadence:** Annual policy review; monthly KRIs; quarterly Board summaries — all on the BSA governance cadence per [CSH-01](#csh-01-governance-delegation).
- **Cross-references:** BSA Policy (AML program design, SAR/CTR, Travel Rule); Investment Policy and Liquidity Policy (investment of excess cash); Truth in Savings Policy and Member Policy (account terms/disclosures); Electronic Payment Systems Policy (wire/ACH controls); Information Security Policy (system security for cash-handling platforms); Record Retention Policy (retention schedules beyond cash-specific evidence).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The parsed engineering spec (`vocabulary.json`, Cassandra Banking Core API) is banking-core only and registers **no events** and no physical-cash resources. All `cash.*`, `gl.*`, `hr.*`, `training.*`, `courier.*`, `insurance.*`, `exam.*`, `supervisory.*`, `aml.*`, `board.*`, `policy.*`, and `treasury.*` event, field, and timer codes used in this document are the target naming scheme and will be confirmed and registered by engineering before the next review.
- The board-approved enterprise cash cap is expressed as a percentage of total assets per Patrick's notes, but the specific percentage is not stated; the Board must set it in the limits schedule at first approval.
- Per-asset limit dollar values (vault, teller, ATM, ITM/VTM, recycler, petty cash) are not specified; the legacy reference policy's branch limits ($10,000 / $5,000 / $2,000) are treated as historical examples only, not carried forward. The board-approved limits schedule will set current values.
- Suspense aging standards (clear within 5 business days, escalate at 10) and the over/short coaching/discipline bands are minimum-viable internal standards inferred where Patrick's notes said "defined aging" and "thresholds"; Compliance and HR must confirm the bands, including whether the legacy reference policy's $25 supervisor sign-off, sub-$10 de minimis discount, 90-day trainee grace period, and $500/12-month evaluation trigger are retained.
- The unpredictable count-selector design (how surprise counts are randomized and concealed) is assumed to be a system capability; if counts remain manually scheduled, Compliance must document how unpredictability is preserved.
- Same-day enterprise-limit remediation assumes courier or investment channels are available before cutoff; the next-business-day exception path for missed cutoffs is an operational assumption to be confirmed with Treasury.
- The fidelity bond review trigger for seasonal deviations assumes the existing Part 713 bond rider permits temporary limit increases; the insurance carrier's notice requirements need confirmation.
- Pynthia's charter type (federal vs. federally insured state-chartered) is assumed federal; if state-chartered, parallel state cash-control requirements may apply and should be added at next review.
- The commercial cash-management agreements supplied as reference material (business online banking, ACH/wire/RDC client agreements) address member-facing electronic services that are out of scope here per Patrick's notes; no member-facing cash-management product controls were carried into this policy.
