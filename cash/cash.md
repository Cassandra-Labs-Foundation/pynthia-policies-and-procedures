---
title: Cash Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Cash, Vault, Dual Control, BSA/AML, Surprise Counts]
---

# Cash Policy

## General Policy Statement

Pynthia Credit Union safeguards all physical currency and cash-equivalent devices wherever cash is received, disbursed, stored, shipped, or reconciled — branches, the operations center, ATMs/ITMs, cash recyclers, and night depositories. This policy merges the former Cash Control and Cash Management programs into one. It quantifies board-approved limits, enforces dual control and segregation of duties, ties every cash asset to the general ledger daily, and channels exceptions into the BSA/AML governance cadence. The Board retains ultimate responsibility through limit approval, surprise counts, independent audits, and review of Supervisory Committee and regulatory examinations, while delegating day-to-day control to management under the Chief Compliance Officer. Out of scope: share/deposit terms (Truth in Savings, Member Policy), excess-cash investment and liquidity (Investment, Liquidity Policies), BSA/AML program design and SAR/CTR/Travel Rule (BSA Policy), electronic payment origination (EPS Policy), information-security controls (InfoSec Policy), and retention schedules beyond cash-specific evidence (Record Retention Policy).

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Enterprise cash cap breached | Daily enterprise position posted shows excess (`cash.enterprise_position.posted`) | Same business day | Treasury notified; remediation to cap | [CC-03](#cc-03-enterprise-cash-limit) |
| Per-asset limit exceeded on load | Load requested above device/location limit (`cash.load.requested`) | Real-time block/warn | Exception ticket required before load | [CC-04](#cc-04-location-device-cash-limits) |
| Key/combo holder changes or 90-day cycle hits | Personnel change or rotation due (`cash.custody.rotation_due_at`) | On change; else ≤90 days; revoke immediately on termination | Custodian registry rotated | [CC-05](#cc-05-dual-control-keys-combinations) |
| Daily GL tie-out | EOD ledger close (`gl.eod_closed`) | Same business day | Recon completed across all cash assets | [CC-06](#cc-06-reconciliation-gl-controls) |
| Over/short recorded | Variance posted per person/location (`cash.overshort.posted`) | Investigate ≤1 business day | Over/short investigation opened | [CC-07](#cc-07-over-short-monitoring) |
| Inbound/outbound shipment | Shipment dispatched/received (`cash.shipment.received`) | Same business day verify vs courier receipt + GL | Shipment verified | [CC-08](#cc-08-atm-itm-night-drop-shipments) |
| Surprise count due | Monthly schedule reaches site (`cash.surprise_count.due`) | ≥ monthly per site; variances ≤1 business day | Count completed; results to Supervisory Committee | [CC-09](#cc-09-surprise-cash-counts-audits) |
| Seasonal deviation | Deviation requested before exceeding limits (`cash.deviation.requested`) | Board approval before limits exceeded; sunset on end date | Whitelisted temporary limits | [CC-10](#cc-10-seasonal-deviations-exceptions) |
| New hire / annual training | Covered employee hired (`employee.hired`) | Initial ≤30 days; annual refresher | Training completed | [CC-11](#cc-11-training-competency) |
| Monthly KPI/KRI publish | Month-end close (`cash.kri.month_closed`) | ≤15 calendar days after month end | KRIs/KPIs published; exception log attested | [CC-12](#cc-12-monitoring-reporting-recordkeeping) |

## CC-01 — Governance & Delegation {#cc-01-governance-delegation}

**WHY (Reg cite):** The Federal Credit Union Act vests the Board with safety-and-soundness responsibility ([12 U.S.C. ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14)), and the NCUA security-program rule requires a written, board-approved program with assignment of responsibility ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)); cash-risk KRIs feed the AML program internal controls required by [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210).

**SYSTEM BEHAVIOR:** The system maintains a living, board-approved Cash Policy: the Board approves the limits schedule, monthly cash-risk KRIs post to the AML governance dashboard, and exceptions are tracked and summarized to the Board quarterly on the BSA governance cadence with annual policy review. A lapsing review warning fires before the next-review date; if the policy review lapses, the control flags non-compliance. Policy editing, limit-schedule approval, and the exception register are write-restricted to Compliance and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board reviews/approves the policy and limits schedule (`policy.board_review_started`) | Policy document (`policy.document_id`), version (`policy.document_version`), limit registry (`policy.limit_registry`), RACI registry (`policy.raci_registry`) | Board-approved policy + minutes reference (`policy.board_approved`) | Annual (enforced by `policy.board_approval_due_at`) |
| Monthly cash KRIs posted to AML dashboard (`aml.dashboard.cash_kri_posted`) | KRI trend (`cash.kri.trend`), thresholds (`kri.thresholds`), data source (`kri.data_source`) | KRI dashboard entry (`cash.kri.published`) | Monthly (enforced by `cash.kri.publish_due_at`) |
| Quarterly governance close compiles Board summary (`cash.governance.quarter_closed`) | Exception register summary (`cash.exception_register.summary`), KRI snapshot (`cash.kri.trend`) | Board cash summary delivered (`board.cash_summary.delivered`) | Quarterly (enforced by `compliance.board_report_due_at`) |

**ALERTS/METRICS:** Alert when `policy.review_lapsed` is true or the review-warning timer fires; target zero overdue board reports and zero missed monthly KRI publications.

## CC-02 — Scope & Applicability {#cc-02-scope-applicability}

**WHY (Reg cite):** The NCUA security program must cover all locations and functions where currency is handled ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)), and Supervisory Committee verification presumes a complete inventory of cash-handling activities ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** The system tags every covered employee, activity, and location/channel (vault, teller, ATM, ITM/VTM, recycler, petty cash, night drop, shipments) in a coverage registry. Coverage must be updated before go-live of any new asset or role; small sites that cannot fully segregate duties document a compensating review as an inline carve-out captured in the coverage registry attestation. The coverage registry is write-restricted to Compliance and Operations management.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New cash asset or role goes live (`cash.asset.id` activated via `asset.changed`) | Asset descriptor (`cash.asset.descriptor`), location (`cash.location.id`), custodian (`cash.custodian.user_id`), coverage registry (`cash.coverage.registry`) | Coverage registry updated (`cash.coverage.updated`) | Before go-live (internal: same day) |
| Periodic coverage attestation due (`cash.coverage.attested`) | Coverage registry (`cash.coverage.registry`), compensating-review notes for small sites (`cash.coverage.registry`) | Coverage attestation recorded (`cash.coverage.attested`) | Annual (enforced by `cash.coverage.attestation_due_at`) |

**ALERTS/METRICS:** Alert on any cash asset transacting without a coverage-registry entry; target 100% coverage attestation completion and zero untagged active assets.

## CC-03 — Enterprise Cash Limit {#cc-03-enterprise-cash-limit}

**WHY (Reg cite):** Capping aggregate cash and adjusting fidelity-bond coverage to exposure are safety-and-soundness expectations under the surety-bond rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) and the NCUA security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

**SYSTEM BEHAVIOR:** The system computes total enterprise cash daily as a percentage of total assets and compares it to the board-approved cap. When cash exceeds the cap it auto-notifies Treasury to invest the excess and opens a same-day remediation task; a warning fires as the position approaches the cap. The cap percentage and limits schedule are write-restricted to Compliance and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily enterprise cash position computed (`cash.enterprise_position.posted`) | Total assets (`gl.total_assets`), aggregate cash (`cash.asset.balance`), cap pct (`cash.enterprise_limit.pct`), headroom (`cash.enterprise_position.headroom`) | Enterprise position record + Treasury notification (`treasury.invest_excess.notified`) | Same business day |
| Cap breached (`cash.enterprise_limit.breached`) | Excess amount (`cash.enterprise_position.excess`), remediation plan (`cash.remediation.plan`) | Remediation task opened (`cash.enterprise_limit.remediated`) | Same business day (enforced by `cash.enterprise_limit.remediation_due_at`) |

**ALERTS/METRICS:** Warning alert at configurable headroom threshold (`cash.enterprise_limit.warning`); target zero days in breach beyond same-day remediation and 100% same-day Treasury notification.

## CC-04 — Location & Device Cash Limits {#cc-04-location-device-cash-limits}

**WHY (Reg cite):** Per-asset cash limits and dual custody for high-value devices implement the NCUA security program's currency-control and embezzlement-prevention requirements ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and keep exposure within bonded coverage ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)).

**SYSTEM BEHAVIOR:** The system maintains per-asset limits for vault, teller, ATM, ITM/VTM, recycler, and petty cash and enforces them in real time: a load above limit warns or blocks unless an exception ticket is attached. Vault, ATM, ITM, and recycler operations require dual custodians, enforced as a hard gate before the operation completes. The limits schedule is write-restricted to Compliance and the Board; exception tickets are write-restricted to authorized supervisors.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Load requested against an asset limit (`cash.load.requested`) | Load amount (`cash.load.amount`), asset id (`cash.asset.id`), asset limit (`cash.asset.limit`), overage flag (`cash.load.overage`), exception ticket (`cash.exception_ticket.id`) | Load decision (allow/warn/block) + limit-block alert (`cash.load.decided`) | Real-time |
| Dual-custody operation on vault/ATM/ITM/recycler initiated (`cash.dual_control.initiated`) | Two custodian IDs (`cash.custodian.user_id`), asset id (`cash.asset.id`), restricted-duty flag (`cash.duty.restricted`) | Dual-control completion record (`cash.dual_control.completed`) | At operation (real-time) |

**ALERTS/METRICS:** Alert on any over-limit load without an attached exception ticket (`cash.limit_block.alerted`) and on any single-custodian device operation; target zero unauthorized over-limit loads.

## CC-05 — Dual Control, Keys & Combinations {#cc-05-dual-control-keys-combinations}

**WHY (Reg cite):** Dual control over vault access, shipments, device loads, and night-drop retrieval, plus controlled key/combination custody, are explicit NCUA security-program safeguards against robbery and embezzlement ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

**SYSTEM BEHAVIOR:** The system enforces dual control for vault access, cash shipments, ATM/ITM loads, and night-drop retrieval, and maintains a key/combination custodian registry. Custodians rotate on personnel change or at least every 90 days, with immediate revocation on termination; emergency master copies are held in a dual-control key box whose every opening is logged with a reason. The custodian registry and key-box log are write-restricted to Compliance and Operations management.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Personnel change or 90-day cycle reached (`cash.custody.rotation_due_at`) | Custodian roster (`cash.custodian.user_id`), asset id (`cash.asset.id`) | Custody rotation record (`cash.custody.rotated`) | On change; else ≤90 days (enforced by `cash.custody.rotation_due_at`) |
| Covered employee terminated (`employee.separated`) | Employee id (`employee.id`), custodian roster (`cash.custodian.user_id`) | Custody revocation record (`cash.custody.revoked`) | Immediate (internal: same day) |
| Dual-control key box opened for emergency (`cash.keybox.opened`) | Reason (`cash.keybox.reason`), accessor id (`cash.counter.user_id`) | Key-box access log entry (`cash.keybox.access_logged`) | At access (real-time) |

**ALERTS/METRICS:** Alert on any custodian past the 90-day rotation timer, any active credential for a separated employee, and any key-box opening without a recorded reason; target zero stale custodians.

## CC-06 — Reconciliation & GL Controls {#cc-06-reconciliation-gl-controls}

**WHY (Reg cite):** Daily tie-out of cash to the general ledger and segregation of custody, posting, and reconciliation are core records and internal-control requirements supporting Supervisory Committee verification ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) and the NCUA security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

**SYSTEM BEHAVIOR:** The system reconciles teller, vault, ATM/ITM, recyclers, and petty cash to the GL daily with same-day tie-out, and clears cash-suspense items within a defined aging window, escalating aged items. Custody, posting, and reconciliation duties are enforced as separated roles; a reconciler may not also have posted the item. Reconciliation records and GL corrections are write-restricted to accounting and Compliance, separate from custodians.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| End-of-day ledger close triggers tie-out (`gl.eod_closed`) | GL balances (`gl.balances`), per-asset balances (`cash.asset.balance`), recon variance (`cash.recon.variance`) | Daily reconciliation completed (`cash.recon.completed`) | Same business day (enforced by `recon.daily_due`) |
| Cash-suspense item ages past window (`gl.cash_suspense.posted`) | Suspense item (`gl.cash_suspense.item`), item age (`recon.item_age_days`), research notes (`recon.research_notes`) | Suspense item cleared or escalated (`gl.cash_suspense.cleared`) | Defined aging window (enforced by `gl.cash_suspense.aging_timer`) |

**ALERTS/METRICS:** Alert on any cash asset not tied out same day (`cash.recon.variance_found`) and on suspense items breaching the aging timer (`gl.cash_suspense.escalated`); target zero open same-day reconciliation breaks.

## CC-07 — Over/Short Monitoring {#cc-07-over-short-monitoring}

**WHY (Reg cite):** Tracking and investigating cash variances per person and location supports embezzlement detection under the NCUA security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and feeds suspicious-activity detection in the AML program ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).

**SYSTEM BEHAVIOR:** The system tracks over/short amounts per person and location, opens an investigation within one business day of each variance, applies coaching/discipline thresholds, and reports monthly. Recurring or anomalous patterns are signaled to AML case management for review; resolved differences below de-minimis thresholds are excluded from disciplinary scoring as an inline carve-out. Threshold configuration and disciplinary records are write-restricted to Compliance and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Over/short variance posted (`cash.overshort.posted`) | Variance amount (`cash.overshort.amount`), counter id (`cash.counter.user_id`), location id (`cash.location.id`), thresholds (`cash.overshort.thresholds`) | Over/short investigation opened (`cash.overshort.investigation_opened`) | ≤1 business day (enforced by `cash.overshort.investigation_due_at`) |
| Recurring anomaly detected (`cash.overshort.anomaly_detected`) | Cumulative total (`cash.overshort.cumulative`), pattern (`cash.overshort.pattern`), research notes (`cash.overshort.research_notes`) | AML case referral (`aml.case.referred`) | At detection (internal: 1 BD) |
| Month-end over/short report compiled (`cash.kri.month_closed`) | Monthly summary (`cash.overshort.monthly_summary`) | Over/short monthly report issued (`cash.overshort.report_issued`) | ≤15 calendar days after month end (enforced by `cash.kri.publish_due_at`) |

**ALERTS/METRICS:** Alert when an over/short investigation exceeds the 1-business-day timer and when cumulative variance crosses a disciplinary threshold (`cash.overshort.threshold_crossed`); target zero unresolved variances aged beyond policy and 100% on-time monthly reporting.

## CC-08 — ATM/ITM/Night-Drop & Shipments {#cc-08-atm-itm-night-drop-shipments}

**WHY (Reg cite):** Dual control over device load/retrieval and night-drop handling with seal capture, and same-day verification of cash shipments against courier receipts, are NCUA security-program safeguards ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) supporting records integrity ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)).

**SYSTEM BEHAVIOR:** The system applies dual control to ATM/ITM load and retrieval and to night-drop handling, capturing and verifying tamper-seal numbers against expected values. Inbound and outbound cash shipments are logged and verified the same day against courier receipts and the GL, with any seal mismatch raising an exception. Device service logs, night-drop records, and shipment verifications are write-restricted to authorized device/vault custodians.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Night-drop bag retrieved under dual control (`cash.nightdrop.verified`) | Two custodian IDs (`cash.custodian.user_id`), expected seal (`cash.seal.expected`), found seal (`cash.seal.found`) | Night-drop verification record + seal-mismatch flag (`cash.nightdrop.verified`) | At retrieval (real-time) |
| Inbound/outbound shipment received or dispatched (`cash.shipment.received`) | Shipment amount (`cash.shipment.amount`), courier receipt (`courier.receipt.id`), GL entry (`gl.cash_in_transit.entry`) | Shipment verification record (`cash.shipment.verified`) | Same business day (enforced by `cash.shipment.verification_due_at`) |
| ATM/ITM/recycler load or retrieval serviced (`cash.device.service_logged`) | Device load amount (`cash.load.amount`), asset id (`cash.asset.id`), two custodian IDs (`cash.custodian.user_id`) | Device service log entry (`cash.device.service_logged`) | At service (real-time) |

**ALERTS/METRICS:** Alert on any seal mismatch (`cash.seal.mismatch`), any shipment unverified past the same-day timer, and any single-custodian device service; target zero unverified shipments and zero unexplained seal mismatches.

## CC-09 — Surprise Cash Counts & Audits {#cc-09-surprise-cash-counts-audits}

**WHY (Reg cite):** Surprise cash counts and independent verification of cash on hand are required Supervisory Committee audit procedures ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) and feed AML independent testing ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).

**SYSTEM BEHAVIOR:** The system schedules and records surprise counts across tellers, vaults, and devices at least monthly per site, requires variances to be resolved within one business day, and routes results to the Supervisory Committee/independent audit and to AML independent testing. Counts are conducted under dual control by an independent counter; the count schedule is concealed from custodians and is write-restricted to Compliance and the Supervisory Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly surprise count due at a site (`cash.surprise_count.due`) | Count schedule (`cash.surprise_count.schedule`), asset balances (`cash.asset.balance`), counter id (`cash.counter.user_id`) | Surprise count completed + results to Supervisory Committee (`cash.surprise_count.completed`) | ≥ monthly per site (enforced by `cash.surprise_count.due`) |
| Count variance identified (`cash.surprise_count.completed` with variance) | Surprise variance (`cash.surprise_count.variance`), research notes (`cash.recon.research_notes`) | Variance resolution + Supervisory delivery (`supervisory.count_results.delivered`) | ≤1 business day (internal: 1 BD) |

**ALERTS/METRICS:** Alert on any site overdue for a monthly count and any count variance unresolved past 1 business day; target 100% monthly count completion per site and zero aged count variances.

## CC-10 — Seasonal Deviations & Exceptions {#cc-10-seasonal-deviations-exceptions}

**WHY (Reg cite):** Formal board approval of temporary limit increases — with bond/insurance adjustment — keeps exposure bonded under the surety-bond rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) and within the board-approved security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

**SYSTEM BEHAVIOR:** The system requires a formal Board deviation memo (reason, duration, revised limits, bond/insurance adjustment) approved before any limit is exceeded. On approval it whitelists temporary limits that automatically sunset on the end date, reverting to standard limits. A deviation cannot take effect before board approval is recorded, and any cash held under an expired whitelist becomes a breach against CC-04. Deviation memos and the whitelist are write-restricted to Compliance and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Seasonal deviation requested (`cash.deviation.requested`) | Reason (`cash.deviation.reason`), period (`cash.deviation.period`), revised limits (`cash.limits_whitelist.entry`), bond adjustment (`insurance.bond.adjustment`) | Board deviation decision (`cash.deviation.board_decided`) | Before limits exceeded (internal: prior to effective date) |
| Board approves deviation (`cash.deviation.approved`) | Approved limits (`cash.limits_whitelist.entry`), sunset date (`cash.deviation.sunset_at`) | Temporary whitelist activated (`cash.limits_whitelist.activated`) | At approval (real-time) |
| Whitelist sunset reached (`cash.deviation.expired`) | Sunset date (`cash.deviation.sunset_at`), whitelist entry (`cash.limits_whitelist.sunset`) | Limits reverted to standard (`cash.deviation.expired`) | On end date (enforced by `cash.deviation.sunset_at`) |

**ALERTS/METRICS:** Alert on any cash exceeding a limit without an approved active deviation and on any whitelist entry past sunset; target zero pre-approval deviations and zero expired whitelists in use.

## CC-11 — Training & Competency {#cc-11-training-competency}

**WHY (Reg cite):** Cash-handling, counterfeit-detection, fraud, and robbery/emergency-response training is required under the NCUA security program ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and the AML program's training pillar ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).

**SYSTEM BEHAVIOR:** The system assigns initial cash training within 30 days of hire and an annual refresher covering handling accuracy, counterfeit detection, fraud schemes, robbery/emergency response, dual control, and device/shipment procedures, with role-specific proficiency checks. A failed proficiency check assigns remedial training before the employee resumes restricted cash duties. Curriculum content and completion records are write-restricted to Compliance and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Covered employee hired (`employee.hired`) | Assignee id (`training.assignee_id`), hire date (`training.hire_date`), role curriculum (`training.role_curriculum`) | Initial training assigned + completion record (`training.onboarding_completed`) | ≤30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opens (`training.annual_cycle_opened`) | Assignee id (`training.assignee_id`), required curriculum (`training.required_curriculum`), content version (`training.content_version`) | Annual refresher completion record (`training.refresher_completed`) | Annual (enforced by `training.annual_due_at`) |
| Proficiency check fails (`training.assessment_completed` with `training.proficiency.failed`) | Assessment score (`training.assessment_score`), assignee id (`training.assignee_id`) | Remedial training assigned (`training.remedial_assigned`) | Before resuming duties (internal: same day) |

**ALERTS/METRICS:** Alert on any new hire past the 30-day timer and any lapsed annual refresher (`training.lapsed`); target 100% on-time initial and annual completion and zero employees on restricted duties with a failed proficiency check.

## CC-12 — Monitoring, Reporting & Recordkeeping {#cc-12-monitoring-reporting-recordkeeping}

**WHY (Reg cite):** Timely KPIs/KRIs, an attested exception log, and retained cash evidence with examiner and AML independent-testing exports satisfy records preservation ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)), Supervisory Committee verification ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)), and AML independent testing ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210)).

**SYSTEM BEHAVIOR:** The system publishes monthly KPIs/KRIs within 15 calendar days of month end, maintains an attested exception log, retains required cash evidence per the records schedule, and produces examiner and AML independent-testing exports on request. Retention timers apply to reconciliation packs, count sheets, dual-control logs, device load sheets, and exception registers; the exception log and retention configuration are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Month-end close triggers KPI/KRI publish (`cash.kri.month_closed`) | KRI trend (`cash.kri.trend`), exception register summary (`cash.exception_register.summary`) | KPIs/KRIs published + attested exception log (`cash.kri.published`) | ≤15 calendar days after month end (enforced by `cash.kri.publish_due_at`) |
| Cash evidence created (`cash.evidence.created`) | Artifact (`record.artifact`), retention class (`record.retention_class`), retention anchor (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`) | At creation (per records schedule via `record.retention_expires_at`) |
| Examiner or AML testing export requested (`exam.export.requested`) | Export scope (`exam.export.scope`), exception register (`cash.exception_register`) | Examiner/AML export delivered (`exam.export.delivered`) | On request (internal: per exam SLA) |

**ALERTS/METRICS:** Alert on any KPI/KRI publication past the 15-day timer, any unattested exception-log period, and any retained record past its retention expiry without disposition; target 100% on-time monthly publication and a fully attested exception log.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the Cash Policy, the limits schedule, the exception register, and the cash-risk KRI feed to the AML governance dashboard.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The Board approves the limits schedule and all seasonal deviation memos ([CC-10](#cc-10-seasonal-deviations-exceptions)) and receives quarterly cash summaries ([CC-01](#cc-01-governance-delegation)).
- **Required participants:** Operations (custody, devices, shipments), Treasury/Finance (enterprise-limit remediation and excess investment notification), the BSA Officer (AML case referrals and independent testing), and the Supervisory Committee (surprise-count results and independent audit).
- **Review cadence:** Annual policy review with a pre-deadline lapse warning; monthly KRIs; quarterly Board summaries on the BSA governance cadence.
- **Cross-references:** Truth in Savings Policy and Member Policy (share/deposit terms); Investment and Liquidity Policies (excess-cash investment, liquidity); BSA Policy (AML program design, SAR/CTR, Travel Rule); Electronic Payment Systems Policy (wire/ACH origination); Information Security Policy (cash-system security controls); Record Retention Policy (retention beyond cash-specific evidence).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is partly provisional.** The cash-domain fields, events, and timers cited throughout the EVENTS tables (the `cash.*` family, `treasury.invest_excess.notified`, `aml.dashboard.cash_kri_posted`, `aml.case.referred`, `supervisory.count_results.delivered`, `board.cash_summary.delivered`, `courier.receipt.id`, `insurance.bond.adjustment`, and the `gl.cash_*` suspense codes) are registered in the parsed core vocabulary and are used verbatim. Any code not present in `core-vocabulary.json` follows the agreed provisional spelling (e.g., `cash.duty.id`, `cash.evidence.type`, `cash.recon.due_at`, `cash.enterprise_position.schedule`) and will be confirmed by engineering before the next review.
- **Charter and NCUA applicability.** This policy assumes Pynthia Credit Union is a federally insured credit union to which NCUA Part 748 (security program), Part 713 (fidelity bond), Part 715 (Supervisory Committee audits), and Part 749 (records preservation) apply directly. If the charter is state-chartered/privately insured, the corresponding state security-program, bond, audit, and retention rules must be substituted; the control logic is unchanged.
- **Quantitative limits not yet set.** PATRICK_NOTES specify the structure but not the values for the enterprise cash cap percentage ([CC-03](#cc-03-enterprise-cash-limit)), per-asset limits ([CC-04](#cc-04-location-device-cash-limits)), suspense-aging window ([CC-06](#cc-06-reconciliation-gl-controls)), over/short coaching/discipline and de-minimis thresholds ([CC-07](#cc-07-over-short-monitoring)), and surprise-count frequency above the monthly floor ([CC-09](#cc-09-surprise-cash-counts-audits)). These are board-approved parameters carried in `cash.limits_schedule` / `policy.limit_registry` and confirmed at adoption.
- **Reference-policy reconciliation.** The legacy Cash Handling and Cash Vault documents (teller drawer limits, drawer-offage hand-count procedure, head-teller sole-control vault rules) are absorbed into [CC-04](#cc-04-location-device-cash-limits), [CC-05](#cc-05-dual-control-keys-combinations), [CC-06](#cc-06-reconciliation-gl-controls), and [CC-07](#cc-07-over-short-monitoring). The two "Cash Management" agreements in the reference set are commercial online-banking/treasury-services contracts, not currency-handling controls, and are intentionally out of scope here (see EPS Policy cross-reference); no control was derived from them.
- **OFAC annual report and CTR/CMIR linkage.** Cash handling links to BSA/AML obligations (CTR aggregation, CMIR for cross-border shipments) but does not redefine them; those filings live in the BSA Policy. This policy only routes cash anomalies and shipment data to AML case management and independent testing.
