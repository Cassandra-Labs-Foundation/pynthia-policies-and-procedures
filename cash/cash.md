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

Pynthia Credit Union safeguards cash and cash-equivalent devices through quantified limits, enforced dual control and segregation of duties, daily reconciliation to the general ledger, and escalation of exceptions into the BSA/AML governance cadence. This policy merges the former Cash Control and Cash Management programs and applies to every employee who handles cash (tellers, vault custodians, branch managers, operations/accounting staff, armored-courier liaisons, ATM/ITM custodians) and to every location and channel where cash is received, disbursed, stored, shipped, or reconciled — branches, the operations center, ATMs/ITMs, recyclers, and night depositories. The Board delegates day-to-day control to management while retaining ultimate responsibility through limit approval, surprise counts, independent audits, and review of Supervisory Committee and regulatory examinations. Member account terms, liquidity investment, BSA program design and SAR/CTR filing, electronic-payment controls, information security, and broader record retention are governed by their respective policies and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Enterprise cash cap exceeded | Daily position computed above board-approved % of assets (`cash.enterprise_limit.breached`) | Same business day | Treasury invest-excess notice + remediation | [CC-03](#cc-03-enterprise-cash-limit) |
| Location/device load over limit | Load requested above asset limit without exception ticket (`cash.load.requested`) | Real time (block/warn) | Exception ticket or blocked load | [CC-04](#cc-04-location--device-cash-limits) |
| Key/combo rotation | Personnel change or 90-day cycle reached (`cash.custody.rotation_due_at`) | On change; ≤90 days | Updated custodian registry | [CC-05](#cc-05-dual-control-keys--combinations) |
| Daily GL tie-out | End-of-day reconciliation run (`cash.recon.day_closed`) | Same business day | Reconciliation pack + variance log | [CC-06](#cc-06-reconciliation--gl-controls) |
| Over/short variance | Variance recorded per person/location (`cash.overshort.recorded`) | Investigate ≤1 business day | Variance investigation record | [CC-07](#cc-07-overshort-monitoring) |
| Inbound/outbound shipment | Shipment received/dispatched (`cash.shipment.received`) | Same-day verify vs courier receipt + GL | Shipment verification record | [CC-08](#cc-08-atmitmnight-drop--shipments) |
| Surprise cash count | Monthly count scheduled per site (`cash.surprise_count.due`) | ≥ monthly; resolve variance ≤1 BD | Count results to SupCom/audit | [CC-09](#cc-09-surprise-cash-counts--audits) |
| Seasonal deviation | Deviation requested before limits exceeded (`cash.deviation.requested`) | Before breach; sunset on end date | Board deviation memo + whitelist | [CC-10](#cc-10-seasonal-deviations--exceptions) |
| New-hire / annual training | Hire or annual cycle reached (`training.newhire_due_at`) | ≤30 days of hire; annual | Completion + proficiency record | [CC-11](#cc-11-training--competency) |
| Monthly KPI/KRI publication | Month-end close (`cash.kri.month_closed`) | ≤15 calendar days after month end | KPI/KRI pack + exception log | [CC-12](#cc-12-monitoring-reporting--recordkeeping) |

## CC-01 — Governance & Delegation

- **WHY (Reg cite):** A board-approved, living cash program with limit approval, KRIs, and a reporting cadence is required under the Federal Credit Union Act board-duty framework ([12 U.S.C. ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and the BSA internal-controls/governance expectation ([31 U.S.C. §5318(h)](https://www.law.cornell.edu/uscode/text/31/5318), [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)). Surprise counts and audit oversight tie to the Supervisory Committee audit rule ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).
- **SYSTEM BEHAVIOR:** The system maintains a versioned cash policy with a board-approved limits schedule, publishes cash-risk KRIs to the AML governance dashboard monthly, and closes a quarterly governance cycle that compiles a Board summary of exceptions and KRI trends. The Board approves the limits schedule annually; management runs day-to-day control. Edits to the limits schedule and the policy document are write-restricted to Compliance, and board-approval records are write-restricted to Board governance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board approves the cash policy and limits schedule (`policy.board_approved`) | Policy document and version (`policy.document_id`, `policy.document_version`), limit registry (`policy.limit_registry`), board approval timestamp (`policy.board_approved_at`) | Approved policy of record + limits schedule (`cash.limits_schedule.updated`) | Annual (enforced by `policy.board_approval_due_at`) |
  | Monthly cash-risk KRI posted to AML dashboard (`cash.kri.published`) | KRI definitions and thresholds (`kri.thresholds`), observed value (`kri.value`), cash KRI trend (`cash.kri.trend`) | AML dashboard KRI entry (`aml.dashboard.cash_kri_posted`) | Monthly (enforced by `cash.kri.publish_due_at`) |
  | Quarterly governance cycle closes (`cash.governance.quarter_closed`) | Exception register summary (`cash.exception_register.summary`), KRI trend (`cash.kri.trend`) | Board cash summary delivered (`board.cash_summary.delivered`) | Quarterly (enforced by `governance.policy_review_due`) |

- **ALERTS/METRICS:** Alert when the policy review window lapses (`policy.review_lapsed`) and when a monthly KRI publication is overdue past the 15-day SLA; target zero overdue Board summaries per quarter.

## CC-02 — Scope & Applicability

- **WHY (Reg cite):** The written security program must designate covered persons, locations, and procedures and keep coverage current ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)); fidelity-bond adequacy depends on accurately scoped cash exposures ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** The system maintains a coverage registry tagging covered employees, activities, and locations/channels, and requires the registry to be updated and attested before any new cash asset or role goes live. Small sites without full segregation document a compensating review in the registry attestation rather than blocking go-live. The coverage registry is write-restricted to Compliance and Operations leads.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New cash asset or role coverage requested (`cash.coverage.change_requested`) | Coverage registry (`cash.coverage.registry`), asset/role descriptor (`cash.asset.descriptor`), compensating-control note where applicable (`sod.compensating_control`) | Updated coverage registry (`cash.coverage.updated`) | Before go-live (internal: 5 BD) |
  | Periodic coverage attestation reached (`cash.coverage.attestation_due_at`) | Coverage registry (`cash.coverage.registry`), attester identity (`cash.custodian.user_id`) | Coverage attestation record (`cash.coverage.attested`) | Annual (enforced by `cash.coverage.attestation_due_at`) |

- **ALERTS/METRICS:** Alert on any new asset/role activated without a current coverage attestation; target zero un-tagged covered locations at month end.

## CC-03 — Enterprise Cash Limit

- **WHY (Reg cite):** Capping aggregate cash as a percentage of assets and remediating breaches is a safety-and-soundness control under the FCUA board-duty framework ([12 U.S.C. ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and supports bond adequacy ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** Each business day the system computes the enterprise cash position against the board-approved percentage of total assets, posts headroom or excess, notifies Treasury to invest any excess, and opens same-day remediation when the cap is breached. The board-approved percentage in the limits schedule is write-restricted to Compliance and is changeable only via an approved board action.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily enterprise cash position computed (`cash.enterprise_position.posted`) | Total assets (`gl.total_assets`), enterprise limit percentage (`cash.enterprise_limit.pct`), computed position (`cash.enterprise_position.computed`), excess/headroom (`cash.enterprise_position.excess`, `cash.enterprise_position.headroom`) | Position record + Treasury invest-excess notice (`treasury.invest_excess.notified`) | Same business day |
  | Enterprise cap breached (`cash.enterprise_limit.breached`) | Breached trigger (`cash.enterprise_limit.warning`), remediation plan (`cash.remediation.plan`) | Breach + remediation record (`cash.enterprise_limit.remediated`) | Same day (enforced by `cash.enterprise_limit.remediation_due_at`) |

- **ALERTS/METRICS:** Alert when the enterprise headroom is low (`cash.enterprise_limit.warning`) and when a breach remediation passes its same-day SLA; target zero open enterprise breaches overnight.

## CC-04 — Location & Device Cash Limits

- **WHY (Reg cite):** Per-asset limits with dual custodians for vault/ATM/ITM/recycler operations implement the security-program dual-control and assignment expectations ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and contain insured exposure ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** The system maintains per-asset limits for vault, teller, ATM, ITM/VTM, recycler, and petty cash, and evaluates every load in real time: loads above limit warn or block unless an exception ticket is attached, and vault/ATM/ITM/recycler operations require two designated custodians. A load decision records the deciding custodians and any exception ticket reference inline. The per-asset limit values are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Cash load requested against an asset (`cash.load.requested`) | Asset limit (`cash.asset.limit`), requested amount (`cash.load.amount`), current count (`cash.asset.count`), overage flag (`cash.load.overage`), exception ticket reference (`cash.exception_ticket.id`) | Load decision + alert on over-limit (`cash.load.decided`, `cash.limit_block.alerted`) | Real time |
  | Dual-control device operation initiated (`cash.dual_control.initiated`) | Two custodian identities (`cash.custodian.user_id`), asset id (`cash.asset.id`) | Dual-control completion record (`cash.dual_control.completed`) | Real time |

- **ALERTS/METRICS:** Alert on any over-limit load lacking an exception ticket and on any single-custodian device operation; target zero unticketed over-limit loads per month.

## CC-05 — Dual Control, Keys & Combinations

- **WHY (Reg cite):** Dual control over vault access, shipments, device loads, and night-drop retrieval, plus a custodian registry with rotation and immediate revocation, is mandated by the security-program rule ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).
- **SYSTEM BEHAVIOR:** The system enforces dual control for vault access, cash shipments, ATM/ITM loads, and night-drop retrieval, and maintains a key/combination custodian registry that rotates on personnel change or at least every 90 days. On termination the system revokes custody immediately rather than waiting for the next rotation cycle. Key-box access is logged on every open with a stated reason. The custodian registry is write-restricted to Compliance and branch management.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Key/combo rotation cycle reached or personnel change (`cash.custody.rotation_due_at`) | Custodian registry (`cash.coverage.registry`), custodian identity (`cash.custodian.user_id`) | Custody rotation record (`cash.custody.rotated`) | On change; ≤90 days (enforced by `cash.custody.rotation_due_at`) |
  | Custodian terminated (`employee.separated`) | Terminated custodian identity (`cash.custodian.user_id`), revocation reason (`cash.keybox.reason`) | Immediate custody revocation (`cash.custody.revoked`) | Same day |
  | Key box opened (`cash.keybox.opened`) | Opener identity (`cash.custodian.user_id`), access reason (`cash.keybox.reason`) | Key-box access log entry (`cash.keybox.access_logged`) | Real time |

- **ALERTS/METRICS:** Alert when a custodian rotation is overdue and when a terminated user retains any cash custody assignment; target zero terminated users with active custody.

## CC-06 — Reconciliation & GL Controls

- **WHY (Reg cite):** Daily tie-out of teller, vault, ATM/ITM, recycler, and petty cash to the GL with segregation of custody, posting, and reconciliation is core safety-and-soundness control and supports records preservation ([12 U.S.C. ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14), [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)).
- **SYSTEM BEHAVIOR:** The system reconciles each cash asset to the GL daily with same-day tie-out, opens variance research where the reconciliation does not balance, and ages cash-suspense items against a defined threshold with escalation when aged. Custody, posting, and reconciliation are enforced as separated duties so no single user spans all three. Suspense-clearing and reconciliation sign-off are write-restricted to Accounting independent of teller custody.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily reconciliation run (`cash.recon.day_closed`) | GL balances (`gl.balances`), asset balance (`cash.asset.balance`), variance flag (`cash.recon.variance_found`), variance amount (`cash.recon.variance`) | Reconciliation completion record (`cash.recon.completed`) | Same business day (enforced by `recon.daily_due`) |
  | Cash-suspense item ages past threshold (`gl.cash_suspense.aging_timer`) | Suspense item (`gl.cash_suspense.item`), item age (`recon.item_age_days`), research notes (`recon.research_notes`) | Aged-suspense escalation (`gl.cash_suspense.escalated`) | Defined aging (enforced by `gl.cash_suspense.aging_timer`) |

- **ALERTS/METRICS:** Alert on any asset failing same-day tie-out and on cash-suspense items exceeding the aging threshold; target zero open daily reconciliations after EOD and zero aged suspense items past SLA.

## CC-07 — Over/Short Monitoring

- **WHY (Reg cite):** Tracking over/short per person and location, investigating promptly, and signaling recurring anomalies into AML case management implements the security-program embezzlement focus ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and the BSA internal-controls/independent-testing linkage ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).
- **SYSTEM BEHAVIOR:** The system records over/short variances per person and location, opens an investigation within one business day, applies coaching/discipline thresholds, reports monthly, and detects recurring anomalies that it routes to AML case management. Variances below the de-minimis threshold are tracked for trend but do not trigger individual investigation tickets. Threshold configuration and discipline records are write-restricted to Compliance and HR respectively.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Over/short variance recorded (`cash.overshort.recorded`) | Variance amount (`cash.overshort.amount`), thresholds (`cash.overshort.thresholds`), threshold-crossed flag (`cash.overshort.threshold_crossed`) | Variance posted + investigation opened (`cash.overshort.posted`, `cash.overshort.investigation_opened`) | Investigate ≤1 business day (enforced by `cash.overshort.investigation_due_at`) |
  | Recurring anomaly detected (`cash.overshort.anomaly_detected`) | Cumulative pattern (`cash.overshort.cumulative`, `cash.overshort.pattern`), research notes (`cash.overshort.research_notes`) | AML case referral (`aml.case.referred`) | Same business day |
  | Monthly over/short reporting close (`cash.kri.month_closed`) | Monthly summary (`cash.overshort.monthly_summary`) | Over/short report issued (`cash.overshort.report_issued`) | Monthly (enforced by `cash.kri.publish_due_at`) |

- **ALERTS/METRICS:** Alert on unresolved variances past the 1-business-day SLA and on threshold crossings per person; target zero overdue over/short investigations.

## CC-08 — ATM/ITM/Night-Drop & Shipments

- **WHY (Reg cite):** Dual control over device load/retrieval and night-drop handling with seal capture, and same-day verification of shipments against courier receipts and GL, are required security-program controls ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) protecting insured cash ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** The system applies dual control to device load/retrieval and night-drop handling, captures and verifies expected vs found seals, and logs inbound/outbound shipments with same-day verification against courier receipts and the GL. A seal mismatch blocks acceptance and opens an exception inline rather than completing the verification. Shipment and night-drop records are write-restricted to vault custodians and the courier liaison.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Night drop retrieved under dual control (`cash.nightdrop.retrieved`) | Two custodian identities (`cash.custodian.user_id`), expected seal (`cash.seal.expected`), found seal (`cash.seal.found`), mismatch flag (`cash.seal.mismatch`) | Night-drop verification record (`cash.nightdrop.verified`) | Same business day |
  | Inbound/outbound shipment received or dispatched (`cash.shipment.received`) | Shipment amount (`cash.shipment.amount`), courier receipt id (`courier.receipt.id`), GL entry (`gl.cash_in_transit.entry`) | Shipment verification record (`cash.shipment.verified`) | Same day (enforced by `cash.shipment.verification_due_at`) |
  | Device load/retrieval serviced (`cash.device.service_logged`) | Asset id (`cash.asset.id`), two custodian identities (`cash.custodian.user_id`), seal capture (`cash.seal.expected`, `cash.seal.found`) | Device service record (`cash.dual_control.completed`) | Real time |

- **ALERTS/METRICS:** Alert on any seal mismatch and on shipments not verified against courier receipt + GL by end of day; target zero unverified shipments overnight.

## CC-09 — Surprise Cash Counts & Audits

- **WHY (Reg cite):** Surprise cash counts at least monthly across tellers, vaults, and devices, with results fed to the Supervisory Committee and independent testing, are required by the Supervisory Committee audit rule ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) and the security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).
- **SYSTEM BEHAVIOR:** The system schedules surprise counts at least monthly per site across tellers, vaults, and devices, requires variance resolution within one business day, and routes results to the Supervisory Committee/independent audit and AML independent testing. Count scheduling is randomized so the timing is not predictable to custodians. Count results and variance dispositions are write-restricted to the count team and Supervisory Committee.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Surprise count scheduled (`cash.audit.scheduled`) | Count schedule (`cash.surprise_count.schedule`), site/asset id (`cash.location.id`) | Scheduled count record (`cash.surprise_count.due`) | ≥ monthly per site (enforced by `cash.surprise_count.due`) |
  | Surprise count completed (`cash.surprise_count.completed`) | Counter identity (`cash.counter.user_id`), count variance (`cash.surprise_count.variance`) | Count results to SupCom/independent test (`supervisory.count_results.delivered`) | Resolve variance ≤1 business day |

- **ALERTS/METRICS:** Alert when a site has no completed surprise count in the month and on count variances unresolved past 1 business day; target ≥1 surprise count per site per month with zero overdue variances.

## CC-10 — Seasonal Deviations & Exceptions

- **WHY (Reg cite):** Board-approved deviation memos with revised limits and bond/insurance adjustment before limits are exceeded reflect board limit-approval duty ([12 U.S.C. ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and fidelity-bond seasonal-adjustment expectations ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).
- **SYSTEM BEHAVIOR:** The system requires a formal Board deviation memo (reason, duration, revised limits, bond/insurance adjustment) approved before any limit is exceeded, then whitelists the temporary limits with a sunset date that auto-expires on the end date. A deviation cannot activate retroactively — if the requested effective date has passed without board approval, the request is rejected. Deviation approval and the whitelist are write-restricted to the Board and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Seasonal deviation requested (`cash.deviation.requested`) | Reason (`cash.deviation.reason`), duration/period (`cash.deviation.period`), revised limits (`cash.limits_whitelist.entry`), bond adjustment (`insurance.bond.adjustment`) | Deviation memo routed for board decision (`cash.deviation.board_decided`) | Before any breach |
  | Board approves deviation (`cash.deviation.approved`) | Approved revised limits (`cash.limits_whitelist.entry`), sunset date (`cash.deviation.sunset_at`) | Temporary limit whitelist activated (`cash.limits_whitelist.activated`) | Before limits exceeded |
  | Deviation sunset reached (`cash.deviation.expired`) | Whitelist sunset (`cash.limits_whitelist.sunset`) | Whitelist entry expired to standard limits | On end date (enforced by `cash.deviation.sunset_at`) |

- **ALERTS/METRICS:** Alert on any limit exceeded without an active approved deviation and on whitelist entries past their sunset still active; target zero unauthorized seasonal overages.

## CC-11 — Training & Competency

- **WHY (Reg cite):** Initial training within 30 days of hire and annual refreshers covering handling accuracy, counterfeit detection, fraud, robbery/emergency response, dual control, and device/shipment procedures support the security-program training duty ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and the BSA training requirement ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).
- **SYSTEM BEHAVIOR:** The system assigns initial cash-handling training within 30 days of hire and annual refreshers covering handling accuracy, counterfeit detection, fraud schemes, robbery/emergency response, dual control, and device/shipment procedures, with role-specific proficiency checks. A failed proficiency check assigns remedial training rather than marking the curriculum complete. Curriculum content and proficiency thresholds are write-restricted to Compliance and Training.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Covered employee hired (`employee.hired`) | Hire date (`training.hire_date`), role curriculum (`training.role_curriculum`) | Initial training assigned + completion record (`training.onboarding_completed`) | ≤30 days of hire (enforced by `training.newhire_due_at`) |
  | Annual refresher cycle reached (`training.annual_cycle_opened`) | Required curriculum (`training.required_curriculum`), assignee (`training.assignee_id`) | Refresher completion record (`training.refresher_completed`) | Annual (enforced by `training.annual_due_at`) |
  | Proficiency check failed (`training.proficiency.failed`) | Assessment score (`training.assessment_score`), role matrix (`training.role_matrix`) | Remedial training assigned (`training.remedial_assigned`) | Internal: 30 days |

- **ALERTS/METRICS:** Alert on new hires past 30 days without completed training and on lapsed annual refreshers (`training.lapsed`); target 100% on-time completion for covered roles.

## CC-12 — Monitoring, Reporting & Recordkeeping

- **WHY (Reg cite):** Monthly KPIs/KRIs published within 15 days of month end, an attested exception log, retained cash evidence, and examiner/AML independent-testing exports satisfy records preservation ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)), Supervisory Committee audit support ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)), and BSA independent-testing access ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).
- **SYSTEM BEHAVIOR:** The system publishes monthly cash KPIs/KRIs within 15 calendar days of month end, maintains an attested exception log, retains required cash evidence per the records schedule, and produces examiner and AML independent-testing exports on request. Retention runs off the records schedule anchor and pauses under any active legal hold rather than purging on the normal clock. The exception log and KPI/KRI pack are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Month-end KPI/KRI close (`cash.kri.month_closed`) | KRI values and thresholds (`kri.value`, `kri.thresholds`), exception register summary (`cash.exception_register.summary`) | Published KPI/KRI pack (`cash.kri.published`) | ≤15 calendar days after month end (enforced by `cash.kri.publish_due_at`) |
  | Cash exception logged (`cash.exception.logged`) | Exception register (`cash.exception_register`), attestation evidence (`cash.evidence.retained`) | Attested exception-log entry (`cash.evidence.created`) | Real time |
  | Examiner or AML independent-testing export requested (`exam.export.requested`) | Export scope (`exam.export.scope`), retained evidence (`cash.evidence.retained`) | Examiner export delivered (`exam.export.delivered`) | Internal: 5 BD |

- **ALERTS/METRICS:** Alert when the monthly KPI/KRI publication exceeds the 15-day SLA, when exception-log entries lack attestation, and when retention runs against a held record; target zero late publications and zero unattested exceptions.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintenance, exception oversight, and the BSA governance cadence linkage.
- **Required participants:** Operations, Treasury/Finance, the BSA Officer, and the Supervisory Committee.
- **Approval:** Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual policy review (Board-approved), monthly KRIs to the AML dashboard, quarterly Board summaries; surprise counts at least monthly per site; independent audit and Supervisory Committee testing per [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **Cross-refs:** Enterprise cap and breach handling — [CC-03](#cc-03-enterprise-cash-limit); dual control and custody — [CC-05](#cc-05-dual-control-keys--combinations); daily GL tie-out — [CC-06](#cc-06-reconciliation--gl-controls); deviations — [CC-10](#cc-10-seasonal-deviations--exceptions). Out-of-scope items are governed by the Truth in Savings, Member, Investment, Liquidity, BSA, Electronic Payment Systems, Information Security, and Record Retention policies.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Most cash-domain codes referenced above (e.g., `cash.*` fields and events, `cash.surprise_count.due`, `cash.custody.rotation_due_at`, `aml.dashboard.cash_kri_posted`, `treasury.invest_excess.notified`, `supervisory.count_results.delivered`) are registered in the parsed `cash`, `gl`, `recon`, `training`, `insurance`, and `aml` namespaces; a small number used here for inputs are listed under DESIGN_NOTES "Provisional codes" (e.g., `cash.asset.id`, `cash.asset.balance`, `cash.load.amount`, `cash.location.id`, `cash.shipment.amount`, `cash.overshort.amount`, `cash.exception_ticket.id`, `cash.recon.due_at`, `courier.receipt.id`, `insurance.bond.adjustment` via `insurance.bond.adjustment`). Those provisional spellings are used verbatim and will be confirmed/registered by engineering before the next review.
- **Charter and applicability.** This policy assumes a federally regulated credit union; NCUA Part 748, Part 713, Part 715, and Part 749 are treated as applicable. If Pynthia is state-chartered, equivalent state security-program, bond, audit, and records rules should be substituted in each WHY field.
- **Enterprise cash percentage and per-asset limit values.** PATRICK_NOTES specify a board-approved percentage of total assets and per-asset limits but not numeric values; the system holds them in the board-approved limits schedule (`policy.limit_registry` / `cash.limits_schedule`). Actual thresholds require Board ratification.
- **Suspense aging and over/short discipline thresholds.** "Defined aging" for cash suspense (CC-06) and coaching/discipline and de-minimis thresholds for over/short (CC-07) are referenced but not quantified in PATRICK_NOTES; minimal viable controls are specified and the numeric thresholds need Compliance/HR confirmation.
- **Surprise-count randomization.** Monthly minimum frequency is stated; the randomization approach in CC-09 is an inferred minimal control to preserve the "surprise" property and should be confirmed against Supervisory Committee practice.
- **BSA linkage boundary.** Cash-risk KRIs, AML case referrals, and independent-testing exports link to the BSA program but do not redefine SAR/CTR filing or the Travel Rule, which remain governed by the BSA Policy.
