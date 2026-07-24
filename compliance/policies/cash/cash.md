```yaml
---
title: Cash Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Cash, Operations, BSA/AML, Dual Control, Reconciliation, Audit]
---
```

## General Policy Statement

Pynthia Credit Union ("the Credit Union") maintains this Cash Policy to safeguard, control, and manage all physical currency and cash-equivalent devices across every location and channel where cash is received, disbursed, stored, shipped, or reconciled. The Board of Directors retains ultimate responsibility for the cash program and delegates day-to-day execution to management under a framework of board-approved limits, dual control, daily general-ledger tie-out, over/short monitoring, surprise counts, and exception reporting integrated into the BSA/AML governance cadence. This policy merges the former Cash Control and Cash Management policies into a single program and applies to all employees who handle cash — tellers, vault custodians, branch managers, operations and accounting staff, armored-courier liaisons, and ATM/ITM custodians — and to all branches, the operations center, ATMs/ITMs, cash recyclers, and night depositories. Topics expressly out of scope include member share and deposit account disclosures (Truth in Savings Policy), investment of excess cash (Investment and Liquidity Policies), BSA/AML program design and SAR/CTR filing (BSA Policy), wire and ACH origination controls (Electronic Payment Systems Policy), information-security controls for cash-handling systems (Information Security Policy), and record-retention schedules beyond cash-specific evidence (Record Retention Policy).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Policy annual review | Board calendar year-end → `policy.review.completed` | Annual | Board-approved policy document | [CP-01](#cp-01-governance-and-delegation) |
| Quarterly Board cash summary | Quarter close → `cash.governance_quarter.closed` | 15 cal days after quarter end | KRI dashboard + exception register | [CP-01](#cp-01-governance-and-delegation) |
| Monthly KRI/KPI publication | Month close → `cash.kri_month.closed` | 15 cal days after month end | KRI pack | [CP-12](#cp-12-monitoring-reporting-and-recordkeeping) |
| New asset/role go-live | Scope change identified → `scope_registry.change.detected` | Before go-live | Scope registry update | [CP-02](#cp-02-scope-and-applicability) |
| Enterprise cash limit breach | Daily position computed → `cash.enterprise_limit.breached` | Same business day | Treasury notification + remediation plan | [CP-03](#cp-03-enterprise-cash-limit) |
| Location/device limit warning | Load requested above warning threshold → `cash.load.decided` | Real-time (block or warn) | Exception ticket | [CP-04](#cp-04-location-and-device-cash-limits) |
| Key/combination rotation | Personnel change or 90-day cycle → `cash.custody.rotated` | Immediately on termination; ≤ 90 days otherwise | Custodian registry update | [CP-05](#cp-05-dual-control-keys-and-combinations) |
| Daily teller/vault/device reconciliation | Business day close → `cash.recon_day.closed` | Same business day | GL tie-out pack | [CP-06](#cp-06-reconciliation-and-gl-controls) |
| Suspense item aging breach | Item age exceeds defined threshold → `gl.cash_suspense.escalated` | Per aging schedule | Research notes + escalation | [CP-06](#cp-06-reconciliation-and-gl-controls) |
| Over/short investigation | Variance posted → `cash.overshort.posted` | 1 business day | Research notes | [CP-07](#cp-07-overshort-monitoring) |
| Monthly over/short report | Month close → `cash.kri_month.closed` | 15 cal days after month end | Over/short summary | [CP-07](#cp-07-overshort-monitoring) |
| ATM/ITM load or night-drop retrieval | Device service event → `cash.device_service.logged` | Real-time dual control | Seal capture + load sheet | [CP-08](#cp-08-atmitm-night-drop-and-shipments) |
| Cash shipment verification | Shipment received → `cash.shipment.received` | Same business day | Courier receipt + GL entry | [CP-08](#cp-08-atmitm-night-drop-and-shipments) |
| Surprise cash count | Monthly schedule → `cash.surprise_count.completed` | ≥ 1 per site per month | Count sheet + variance resolution | [CP-09](#cp-09-surprise-cash-counts-and-audits) |
| Surprise count variance resolution | Variance identified → `cash.surprise_count.completed` | 1 business day | Variance memo | [CP-09](#cp-09-surprise-cash-counts-and-audits) |
| Seasonal/limit deviation approval | Deviation requested → `cash.deviation.approved` | Before limit is exceeded | Board deviation memo | [CP-10](#cp-10-seasonal-deviations-and-exceptions) |
| Deviation sunset | Deviation end date reached → `cash.deviation.expired` | Automatic on end date | Whitelist entry removed | [CP-10](#cp-10-seasonal-deviations-and-exceptions) |
| New-hire cash training | Employee hired → `employee.hired` | Within 30 days of hire | Training completion record | [CP-11](#cp-11-training-and-competency) |
| Annual training refresher | Annual cycle open → `training.annual_cycle.opened` | Annual | Refresher completion record | [CP-11](#cp-11-training-and-competency) |
| Examiner/AML export | Export requested → `exam.export.requested` | On demand | Records package | [CP-12](#cp-12-monitoring-reporting-and-recordkeeping) |

---

## CP-01 — Governance and Delegation {#cp-01-governance-and-delegation}

**WHY (Reg cite):** The [Federal Credit Union Act (12 U.S.C. §§ 1751–1795k)](https://www.law.cornell.edu/uscode/text/12/chapter-14) places ultimate responsibility for safe and sound operations on the Board of Directors. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires written policies and retention of governance records, and [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) requires a board-approved AML program with internal controls that encompass cash handling.

**SYSTEM BEHAVIOR:** The Board approves this policy and the limits schedule at least annually; the Chief Compliance Officer (CCO) owns day-to-day execution. Cash-risk KRIs feed the AML governance dashboard monthly. Exceptions are tracked in the attested exception register and reported on the BSA governance cadence: monthly KRIs, quarterly Board summaries, and an annual policy review. The CCO is write-restricted to the policy document and exception register; the Board resolution is write-restricted to the Board Secretary. Any material change to limits or scope requires a new Board resolution before taking effect.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens (`policy.board_review.started`) | Current policy version (`policy.document_version`), prior-year exception summary (`cash.exception_register.summary`), KRI trend data (`cash.kri.trend`) | Board-approved policy revision + resolution (`policy.board.approved`, `policy.revision.published`) | Annual (enforced by `policy.review_due_at`) |
| Quarter closes (`cash.governance_quarter.closed`) | KRI pack (`cash.kri`), exception register (`cash.exception_register`), over/short summary (`cash.overshort.monthly_summary`) | Quarterly Board cash summary delivered (`board.cash_summary.delivered`) | 15 calendar days after quarter end |
| Monthly KRI cycle closes (`cash.kri_month.closed`) | Per-asset balances (`cash.asset.balance`), over/short counts (`cash.overshort.amount`), enterprise position (`cash.enterprise_position`) | Published KRI pack (`cash.kri.published`) | 15 calendar days after month end (enforced by `cash.kri.publish_due_at`) |
| Exception logged (`cash.exception.logged`) | Exception description, approver, risk acceptance (`exception.rationale`, `exception.risk_acceptance`) | Attested exception register entry (`cash.exception_register`) | Same day as exception identified |

**ALERTS/METRICS:** Alert if the policy review task is overdue by more than 5 business days (`policy.review_due_at` breached). Alert if the quarterly Board summary is not delivered within 15 calendar days of quarter close. Target: zero unattested exceptions in the register at any point in time.

---

## CP-02 — Scope and Applicability {#cp-02-scope-and-applicability}

**WHY (Reg cite):** [12 U.S.C. § 1761b](https://www.law.cornell.edu/uscode/text/12/1761b) (FCUA supervisory committee duties) and [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) (NCUA Security Program) require that written security and control programs identify all covered employees, activities, and locations. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires that the scope of covered records be documented and maintained.

**SYSTEM BEHAVIOR:** The scope registry (`scope_registry`) lists every covered employee role, cash-handling activity, and physical location or device channel. Operations must update the registry before any new asset, role, or channel goes live. For small sites where full dual-control staffing is not feasible, a compensating-control review must be documented in the registry entry before go-live. The scope registry is write-restricted to the CCO and Operations Manager; read access is unrestricted for audit and examination purposes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New asset, role, or channel identified (`scope_registry.change.detected`) | Asset/role description, location ID (`cash.location.id`, `cash.asset.id`), compensating-control documentation if applicable | Updated scope registry entry (`scope_registry.entry.updated`) | Before go-live |
| Annual policy review (`policy.board_review.started`) | Current scope registry version (`scope_registry.version_id`) | Attested scope registry (`scope_registry.attested`) | Annual (enforced by `scope_registry.attestation_due`) |
| Scope registry published after Board approval (`scope_registry.published`) | Board resolution reference (`board.resolution_id`) | Published scope registry version (`scope_registry.version.approved`) | Same day as Board approval |

**ALERTS/METRICS:** Alert if any new branch, ATM, ITM, or recycler is detected in the GL or device management system without a corresponding scope registry entry. Target: zero go-live events without a prior registry update.

---

## CP-03 — Enterprise Cash Limit {#cp-03-enterprise-cash-limit}

**WHY (Reg cite):** [12 U.S.C. §§ 1757, 1761b](https://www.law.cornell.edu/uscode/text/12/1757) (FCUA safety-and-soundness authority) and [12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713) (fidelity bond requirements) require the Board to set and monitor aggregate cash exposure limits commensurate with bond coverage. Excess cash held beyond operational need creates uninsured concentration risk.

**SYSTEM BEHAVIOR:** The Board approves a maximum enterprise cash-to-total-assets percentage (`cash.enterprise_limit.pct`) in the limits schedule. The system computes the enterprise cash position daily against total assets (`gl.total_assets`) and posts the result. When the position exceeds the warning threshold, Treasury is automatically notified to invest excess. When the position breaches the hard limit, a same-day remediation task is created and the CCO is alerted. Loads that would push the enterprise position above the hard limit are blocked without an active exception ticket (`cash.exception_ticket.id`). The limits schedule is write-restricted to the CCO with Board approval; the daily position computation is system-generated and write-restricted.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily position computed (`cash.enterprise_position.posted`) | Total cash across all assets (`cash.enterprise_position`), total assets (`gl.total_assets`), approved limit percentage (`cash.enterprise_limit.pct`) | Enterprise position record; warning or breach event as applicable (`cash.enterprise_limit.breached` or `cash.enterprise_limit.warning`) | Daily (end of business) |
| Warning threshold crossed (`cash.enterprise_limit.warning`) | Excess amount (`cash.enterprise_position.excess`), headroom (`cash.enterprise_position.headroom`) | Treasury invest-excess notification (`treasury.invest_excess.notified`) | Same business day |
| Hard limit breached (`cash.enterprise_limit.breached`) | Breach amount, responsible custodian (`cash.custodian.user_id`) | Remediation plan task + CCO alert (`cash.enterprise_limit.remediated`); enforced by `cash.enterprise_limit.remediation_due_at` | Same business day |
| Limits schedule updated (`cash.limits_schedule.updated`) | Board resolution reference (`board.resolution_id`), new limit percentage (`cash.enterprise_limit.pct`), effective date (`cash.limits_schedule.effective`) | Published limits schedule | Before effective date |

**ALERTS/METRICS:** Alert if the enterprise position is not posted by end of business on any operating day. Alert if a hard-limit breach is not remediated within the same business day. Target: zero unresolved hard-limit breaches at end of day.

---

## CP-04 — Location and Device Cash Limits {#cp-04-location-and-device-cash-limits}

**WHY (Reg cite):** [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires written procedures for the protection of cash assets at each location. [12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713) requires that bond coverage be adequate for the cash exposure at each site; per-asset limits operationalize that requirement.

**SYSTEM BEHAVIOR:** The Board-approved limits schedule (`cash.limits_schedule`) specifies maximum cash balances for each asset type: main vault, teller drawer, ATM, ITM/VTM, cash recycler, and petty cash. The system enforces limits in real time: a load request that would exceed the asset limit without an active exception ticket is blocked (`cash.limit_block.alerted`); a load approaching the warning threshold generates an alert but does not block. Vault, ATM, ITM, and recycler operations require dual custodians (`cash.dual_control`); teller drawers require sole-custodian accountability with supervisor override for shared drawers. Petty cash funds are subject to the same limit controls but may be managed under sole-custodian accountability with monthly surprise counts. The limits schedule is write-restricted to the CCO with Board approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Load requested for any asset (`cash.load.requested`) | Asset ID (`cash.asset.id`), requested load amount (`cash.load.amount`), current balance (`cash.asset.balance`), asset limit (`cash.asset.limit`), exception ticket if applicable (`cash.exception_ticket.id`) | Load decision (approved or blocked) (`cash.load.decided`); block alert if over limit without ticket (`cash.limit_block.alerted`) | Real-time |
| Load approved above warning threshold without exception ticket | Asset ID, overage amount (`cash.load.overage`), custodian ID (`cash.custodian.user_id`) | Exception ticket required; load blocked until ticket created (`cash.exception.logged`) | Real-time |
| Limits schedule revised (`cash.limits_schedule.updated`) | Board resolution reference, per-asset limit values, effective date (`cash.limits_schedule.effective`) | Updated limits schedule published; whitelist entries updated (`cash.limits_whitelist.activated`) | Before effective date |
| Dual-control operation initiated for vault/ATM/ITM/recycler (`cash.dual_control.initiated`) | Two custodian IDs (`cash.custodian.user_id`, `cash.counter.user_id`), asset ID, transaction amount | Dual-control completion record (`cash.dual_control.completed`) | Real-time (before funds move) |

**ALERTS/METRICS:** Alert if any asset balance exceeds its approved limit without an active exception ticket. Alert if a dual-control operation is recorded with only one custodian ID. Target: zero limit overages without a valid exception ticket; zero single-custodian records for dual-control assets.

---

## CP-05 — Dual Control, Keys, and Combinations {#cp-05-dual-control-keys-and-combinations}

**WHY (Reg cite):** [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires written security procedures including dual control for vault access and cash shipments. [12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713) requires that fidelity bond coverage reflect the controls in place; inadequate dual control increases bond exposure. The NCUA Security Program guidance further requires immediate revocation of access credentials upon employee termination.

**SYSTEM BEHAVIOR:** Dual control is required for: vault access (main and back-up), cash shipments (inbound and outbound), ATM/ITM loads and retrievals, and night-drop retrieval. The custodian registry (`cash.coverage.registry`) records every key holder and combination holder by asset, role, and effective date. Combinations and keys must be rotated at least every 90 days or immediately upon any personnel change affecting a custodian. Upon employee termination, the system triggers an immediate revocation task (`cash.custody.revoked`) and the registry must be updated before the employee's last working hour. Master copies of combinations are stored in the dual-control key box (`cash.keybox`); access to the key box is logged (`cash.keybox_access.logged`). The custodian registry is write-restricted to the Branch Manager and CCO; the revocation task is system-generated on `employee.separated`.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee separated (`employee.separated`) | Employee ID (`employee.id`), list of assets for which employee holds keys/combinations (`cash.coverage.registry`) | Immediate revocation task created (`cash.custody.revoked`); registry updated (`cash.coverage.updated`) | Immediately (before last working hour); enforced by `cash.custody.rotation_due_at` |
| 90-day rotation cycle due (`cash.custody.rotation_due_at`) | Current custodian registry (`cash.coverage.registry`), asset IDs | Rotated combinations/keys recorded; registry attested (`cash.coverage.attested`) | ≤ 90 days from last rotation |
| Key box accessed (`cash.keybox.opened`) | Accessing employee ID, reason (`cash.keybox.reason`), asset ID | Key box access log entry (`cash.keybox_access.logged`) | Real-time |
| Dual-control operation completed for vault/shipment/ATM/night-drop (`cash.dual_control.completed`) | Two custodian IDs, asset ID, transaction type and amount | Dual-control evidence record (`cash.evidence.created`) | Real-time |
| Coverage registry change requested (`cash.coverage_change.requested`) | Requesting manager ID, reason, new custodian ID | Updated registry entry (`cash.coverage.updated`); attestation due (`cash.coverage.attestation_due_at`) | Before change takes effect |

**ALERTS/METRICS:** Alert if any custodian's rotation is overdue by more than 1 business day past the 90-day mark. Alert if a terminated employee's registry entry is not revoked within 4 hours of `employee.separated`. Target: zero active registry entries for terminated employees; zero rotations overdue.

---

## CP-06 — Reconciliation and GL Controls {#cp-06-reconciliation-and-gl-controls}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires retention of reconciliation records. [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires internal controls that prevent and detect errors and irregularities in cash handling. NCUA examination guidance requires daily GL tie-out for all cash accounts and timely clearance of suspense items.

**SYSTEM BEHAVIOR:** Every teller drawer, vault, ATM, ITM, recycler, and petty cash fund must be reconciled to the general ledger daily, with same-day tie-out. The reconciliation process enforces segregation of duties: the employee with custody of cash may not post the offsetting GL entry, and a separate employee (or automated system control) performs the reconciliation. Suspense items (`gl.cash_suspense.item`) are tracked with an aging timer; items not cleared within the defined aging schedule are escalated to the CCO. The reconciliation record (`cash.recon`) captures the variance found, research notes, and the employee IDs of the custodian, poster, and reconciler. Reconciliation records are write-restricted to the reconciling employee; the GL posting is write-restricted to Operations/Accounting staff who do not hold the reconciled cash.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Business day closes (`cash.recon_day.closed`) | Per-asset cash balances (`cash.asset.balance`), GL cash account balances (`gl.balances`), prior-day variance carry-forward (`cash.recon.variance`) | Daily reconciliation record; tie-out confirmation or variance flag (`cash.recon.completed`); enforced by `cash.recon.due_at` | Same business day |
| Variance detected during reconciliation (`cash.recon.variance_found`) | Variance amount (`cash.recon.variance`), asset ID, custodian ID, research notes (`cash.recon.research_notes`) | Variance investigation task created; suspense item posted if unresolved (`gl.cash_suspense.posted`) | Same business day |
| Suspense item aging threshold breached (`gl.cash_suspense.aged`) | Item age, item amount, item owner (`gl.cash_suspense.item`), aging timer (`gl.cash_suspense.aging_timer`) | Escalation to CCO (`gl.cash_suspense.escalated`) | Per aging schedule (enforced by `gl.cash_suspense.aging_timer`) |
| Suspense item cleared (`gl.cash_suspense.cleared`) | Clearing transaction ID (`gl.correction.txn_id`), research notes | Cleared suspense record; GL corrected | Same day as resolution |

**ALERTS/METRICS:** Alert if any asset reconciliation is not completed by end of business. Alert if any suspense item exceeds the aging threshold without an escalation record. Target: zero same-day reconciliation failures; suspense aging queue at zero items past threshold at all times.

---

## CP-07 — Over/Short Monitoring {#cp-07-overshort-monitoring}

**WHY (Reg cite):** [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires internal controls to detect and investigate cash discrepancies. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) requires that the AML program include internal controls capable of detecting patterns indicative of insider theft or structuring; recurring over/short anomalies are a recognized red flag.

**SYSTEM BEHAVIOR:** Every over or short is recorded against the responsible employee and location at the time of discovery. The system tracks cumulative over/short amounts and counts per person and per location (`cash.overshort.cumulative`). Variances must be investigated within 1 business day; the investigation due date is enforced by `cash.overshort.investigation_due_at`. Coaching and discipline thresholds are defined in the limits schedule; when a threshold is crossed (`cash.overshort.threshold_crossed`), an HR coaching record is triggered. Recurring anomalies that meet the pattern criteria (`cash.overshort.pattern`) are automatically referred to AML case management (`bsa_alert.created`). Monthly over/short summaries are published as part of the KRI pack. Discrepancy tickets must be posted the same day the variance is discovered; adjusting a drawer balance without a correction transaction is a policy violation subject to discipline.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Over/short discovered at drawer balance (`cash.overshort.recorded`) | Employee ID (`cash.custodian.user_id`), location ID (`cash.location.id`), variance amount (`cash.overshort.amount`), transaction review notes | Over/short record posted; investigation task created (`cash.overshort.posted`); enforced by `cash.overshort.investigation_due_at` | Same business day (posting); investigation within 1 business day |
| Investigation completed (`cash.overshort.resolved`) | Research notes (`cash.overshort.research_notes`), resolution type (resolved/unresolved), correction transaction ID if applicable | Resolved or unresolved over/short record; discrepancy ticket posted (`cash.overshort.resolved`) | 1 business day from discovery |
| Coaching/discipline threshold crossed (`cash.overshort.threshold_crossed`) | Cumulative amount (`cash.overshort.cumulative`), threshold definition (`cash.overshort.thresholds`), employee ID | HR coaching record triggered (`hr.coaching.recorded`) | Same day as threshold breach |
| Recurring anomaly pattern detected (`cash.overshort_anomaly.detected`) | Pattern data (`cash.overshort.pattern`), employee ID, location ID | AML case referral (`bsa_alert.created`); investigation opened (`cash.overshort_investigation.opened`) | Same day as pattern detection |
| Month closes (`cash.kri_month.closed`) | All over/short records for the month (`cash.overshort.monthly_summary`) | Monthly over/short report published (`cash.overshort_report.issued`) | 15 calendar days after month end |

**ALERTS/METRICS:** Alert if any over/short investigation is not completed within 1 business day. Alert if any unresolved over/short of $500 or more is outstanding for more than 1 business day. Monitor the monthly count of AML referrals from over/short patterns; target: zero uninvestigated anomalies.

---

## CP-08 — ATM/ITM, Night-Drop, and Shipments {#cp-08-atmitm-night-drop-and-shipments}

**WHY (Reg cite):** [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires written procedures for the protection of cash in transit and at self-service devices. [31 U.S.C. § 5316](https://www.law.cornell.edu/uscode/text/31/5316) and [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/section-1010.340) (CMIR) require reporting of cash transported across borders exceeding $10,000; domestic armored-courier shipments must be logged and verified to support BSA recordkeeping. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires retention of shipment manifests and device load records.

**SYSTEM BEHAVIOR:** All ATM/ITM loads and retrievals require dual control (`cash.dual_control`); a single custodian may not load or retrieve without a second authorized employee present and recorded. Night-drop retrieval requires dual control and seal capture: the expected seal number (`cash.seal.expected`) is recorded before retrieval, and the found seal number (`cash.seal.found`) is recorded at retrieval; a mismatch (`cash.seal.mismatch`) triggers an immediate incident. Inbound and outbound cash shipments are logged against the courier receipt (`courier.receipt.id`) and verified to the GL the same business day (`cash.shipment.verified`). The shipment verification due date is enforced by `cash.shipment.verification_due_at`. Device service events (fills, partial fills, cassette swaps) are logged in real time (`cash.device_service.logged`). CMIR-reportable shipments are flagged and routed to the BSA Officer for filing. The CCO and Operations Manager are write-restricted to shipment and device records; read access is available to audit and the Supervisory Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ATM/ITM load or retrieval initiated (`cash.dual_control.initiated`) | Two custodian IDs, device asset ID (`cash.asset.id`), load amount (`cash.load.amount`), exception ticket if over limit (`cash.exception_ticket.id`) | Dual-control load record; device service log (`cash.device_service.logged`); dual-control completion (`cash.dual_control.completed`) | Real-time (before funds move) |
| Night-drop retrieved (`cash.nightdrop.retrieved`) | Two custodian IDs, expected seal (`cash.seal.expected`), found seal (`cash.seal.found`), deposit contents | Night-drop verification record (`cash.nightdrop.verified`); mismatch incident if seals differ (`cash.seal.mismatch`) | Real-time |
| Cash shipment dispatched or received (`cash.shipment.received`) | Courier receipt ID (`courier.receipt.id`), shipment amount (`cash.shipment.amount`), direction (inbound/outbound), custodian IDs | Shipment log entry; GL verification task (`cash.shipment.verified`); enforced by `cash.shipment.verification_due_at` | Same business day |
| Shipment verified against GL and courier receipt (`cash.shipment.verified`) | Shipment amount, GL entry reference (`gl.cash_in_transit.entry`), courier receipt ID | Verified shipment record; CMIR flag if applicable (`cmir.reportable.identified`) | Same business day |
| Seal mismatch detected (`cash.seal.mismatch`) | Expected seal, found seal, location ID, custodian IDs | Incident opened (`incident.created`); CCO notified | Immediately |

**ALERTS/METRICS:** Alert if any shipment is not verified to the GL by end of the same business day. Alert if any night-drop retrieval is recorded without dual-control evidence. Alert if any seal mismatch is not escalated to an incident within 1 hour. Target: zero unverified shipments at end of day; zero single-custodian device operations.

---

## CP-09 — Surprise Cash Counts and Audits {#cp-09-surprise-cash-counts-and-audits}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) (Supervisory Committee Audits) requires the Supervisory Committee to conduct or cause to be conducted surprise cash counts and to report results to the Board. [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires that the security program include procedures for surprise audits. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) requires independent testing of the AML program, which includes cash-handling controls.

**SYSTEM BEHAVIOR:** Surprise cash counts must be performed at least once per month at every site (branches, operations center, ATM/ITM locations, and recycler locations). Counts are unannounced and conducted under dual control by a platform employee and the head teller or designee (or, for vaults, by a Supervisory Committee member or independent auditor). The count schedule (`cash.surprise_count.schedule`) is maintained by the CCO and is not disclosed to the employees being counted. Variances identified during a count must be resolved within 1 business day (`cash.surprise_count.variance`). Count results are delivered to the Supervisory Committee and feed the independent audit and AML independent testing programs. The count schedule and results are write-restricted to the CCO and Supervisory Committee; the counted employee may not conduct their own count.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly count schedule due (`cash.surprise_count.due`) | Site list, count schedule (`cash.surprise_count.schedule`), assigned counters | Count scheduled and assigned; enforced by `cash.surprise_count.due` | ≥ 1 per site per month |
| Surprise count conducted (`cash.surprise_count.completed`) | Counter IDs (two), asset ID, physical count amount (`cash.asset.count`), book balance (`cash.asset.balance`), variance (`cash.surprise_count.variance`) | Count sheet record; variance investigation task if variance exists (`cash.overshort_investigation.opened`) | Real-time (during count) |
| Count variance resolved (`cash.overshort.resolved`) | Research notes, resolution type, correction transaction if applicable | Resolved variance record; count sheet updated | 1 business day from count |
| Count results delivered to Supervisory Committee (`supervisory.count_results.delivered`) | All count sheets for the period, variance summary | Supervisory Committee delivery record | Monthly (with quarterly Board summary) |
| AML independent testing export requested (`exam.export.requested`) | Date range, asset scope (`exam.export.scope`) | Records package with count sheets and variance resolutions (`records_package.completed`) | On demand |

**ALERTS/METRICS:** Alert if any site has not had a surprise count in the current calendar month by the 25th of the month. Alert if any count variance is not resolved within 1 business day. Target: 100% of sites counted monthly; zero unresolved count variances older than 1 business day.

---

## CP-10 — Seasonal Deviations and Exceptions {#cp-10-seasonal-deviations-and-exceptions}

**WHY (Reg cite):** [12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713) requires that fidelity bond coverage be adequate for actual cash exposure; a seasonal deviation that increases cash holdings above normal limits must be accompanied by a bond/insurance adjustment. [12 U.S.C. §§ 1757, 1761b](https://www.law.cornell.edu/uscode/text/12/1757) (FCUA) requires Board approval for material changes to operating limits.

**SYSTEM BEHAVIOR:** Any planned exceedance of a Board-approved cash limit — whether seasonal (e.g., holiday cash demand) or event-driven — requires a formal Board deviation memo approved before the limit is exceeded. The memo must state the reason, duration, revised limits, and any required bond or insurance adjustment. Approved deviations are entered as whitelisted temporary limits (`cash.limits_whitelist.entry`) with a defined sunset date (`cash.deviation.sunset_at`). The system automatically removes the whitelist entry and reverts to the standard limit on the sunset date (`cash.deviation.expired`). Loads above the standard limit are permitted only while a valid whitelist entry is active; without one, the standard block applies. The deviation memo and whitelist entry are write-restricted to the CCO with Board approval; the sunset removal is system-automated.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Deviation requested (`cash.deviation.requested`) | Reason (`cash.deviation.reason`), duration (`cash.deviation.period`), revised limit amounts, bond/insurance adjustment documentation (`insurance.bond.adjustment`) | Deviation memo drafted; Board approval task created (`cash.deviation_board.decided`) | Before limit is exceeded |
| Board approves deviation (`cash.deviation.approved`) | Board resolution reference (`board.resolution_id`), approved revised limits, sunset date (`cash.deviation.sunset_at`) | Whitelist entry activated (`cash.limits_whitelist.activated`); limits schedule updated (`cash.limits_schedule.updated`) | Before effective date |
| Deviation sunset date reached (`cash.deviation.expired`) | Whitelist entry ID (`cash.limits_whitelist.entry`), sunset date | Whitelist entry removed; standard limits restored; CCO notified | Automatic on sunset date |
| Exception ticket required for unplanned overage (`cash.exception.logged`) | Exception rationale (`exception.rationale`), approver ID, risk acceptance (`exception.risk_acceptance`), expiry date | Exception register entry; load unblocked for duration of exception | Same day as overage identified |

**ALERTS/METRICS:** Alert if any load above the standard limit occurs without an active whitelist entry or exception ticket. Alert if a deviation memo is not Board-approved before the deviation effective date. Target: zero unapproved limit exceedances; all whitelist entries sunset automatically with no manual intervention required.

---

## CP-11 — Training and Competency {#cp-11-training-and-competency}

**WHY (Reg cite):** [31 CFR § 1020.210(a)(4)](https://www.ecfr.gov/current/title-31/section-1020.210) requires ongoing training for appropriate personnel as part of the AML program. [12 CFR § 748.1](https://www.ecfr.gov/current/title-12/section-748.1) requires that the security program include training for employees on robbery and emergency response procedures. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that the Supervisory Committee have access to training records as part of its audit scope.

**SYSTEM BEHAVIOR:** All employees who handle cash must complete initial training within 30 days of hire and annual refresher training thereafter. The curriculum covers: cash handling accuracy, counterfeit detection, fraud schemes, robbery and emergency response, dual control procedures, and device and shipment procedures. Role-specific proficiency checks are required for tellers (drawer accuracy), vault custodians (vault procedures), and ATM/ITM custodians (device load/retrieval). Training completion is recorded against the employee ID and role (`training.completion_status`, `training.role_curriculum`). Employees who fail a proficiency check are assigned remedial training before returning to unsupervised cash handling. The training curriculum is write-restricted to the CCO; completion records are write-restricted to the Learning Management System and are read-accessible to audit and the Supervisory Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired into a cash-handling role (`employee.hired`) | Employee ID (`employee.id`), role (`user.role`), hire date (`training.hire_date`), required curriculum (`training.required_curriculum`) | New-hire training assignment created (`training.assignment.created`); enforced by `training.newhire_due_at` | Within 30 days of hire |
| Initial training completed (`training.initial.completed`) | Employee ID, module IDs completed (`training.module_id`), assessment score (`training.assessment_score`), proficiency check result | Training completion record (`training.completion.recorded`); proficiency pass/fail logged | Within 30 days of hire |
| Annual training cycle opens (`training.annual_cycle.opened`) | All active cash-handling employees, current curriculum version (`training.content_version`) | Annual refresher assignments created (`training.annual.assigned`); enforced by `training.annual_due_at` | Annual |
| Annual refresher completed (`training.refresher.completed`) | Employee ID, completion date, assessment score | Refresher completion record (`training.completion.recorded`) | Annual |
| Proficiency check failed (`training.proficiency.failed`) | Employee ID, failed module, failure details | Remedial training assigned (`training.remedial.assigned`); employee restricted from unsupervised cash handling until remedial training completed | Same day as failure |

**ALERTS/METRICS:** Alert if any cash-handling employee has not completed initial training within 30 days of hire. Alert if any employee's annual refresher is overdue. Target: 100% training completion rate for all cash-handling roles; zero employees handling cash unsupervised with a lapsed or failed proficiency record.

---

## CP-12 — Monitoring, Reporting, and Recordkeeping {#cp-12-monitoring-reporting-and-recordkeeping}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) specifies minimum retention periods for credit union records, including reconciliation packs, count sheets, dual-control logs, device load sheets, and exception registers. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/section-1020.210) requires that AML program records be available for examination. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that Supervisory Committee audit workpapers and cash count results be retained and available to NCUA examiners.

**SYSTEM BEHAVIOR:** The CCO publishes monthly KPI/KRI reports within 15 calendar days of month end, covering: enterprise cash position vs. limit, per-asset limit utilization, over/short counts and amounts by employee and location, surprise count completion rates, exception register status, and training completion rates. The attested exception register is maintained continuously and reviewed at each governance cadence. All cash-specific evidence — reconciliation packs, count sheets, dual-control logs, device load sheets, shipment manifests, and exception registers — is retained per the records schedule (`record.retention_class`, `record.retention_expires_at`). Examiner and AML independent-testing exports are produced on demand as a records package (`records_package.completed`). The KRI report is write-restricted to the CCO; retention schedules are write-restricted to the Records Manager; export requests require CCO approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Month closes (`cash.kri_month.closed`) | All cash KRIs for the month (`cash.kri`), over/short summary (`cash.overshort.monthly_summary`), exception register (`cash.exception_register`), training completion data (`training.coverage_pct`) | Monthly KPI/KRI report published (`cash.kri.published`); enforced by `cash.kri.publish_due_at` | 15 calendar days after month end |
| Exception register attested (`cash.exception.logged`) | Exception details, approver ID, risk acceptance, expiry date | Attested exception register entry; exception register summary updated (`cash.exception_register.summary`) | Same day as exception identified |
| Cash evidence created (reconciliation, count sheet, dual-control log, load sheet, shipment manifest) (`cash.evidence.created`) | Evidence type (`cash.evidence.type`), subject asset ID, date, custodian IDs | Evidence record retained with retention clock set (`record.retention_clock_set`); enforced by `record.retention_expires_at` | Real-time (at time of event) |
| Examiner or AML independent-testing export requested (`exam.export.requested`) | Export scope (`exam.export.scope`), date range, requestor ID | Records package assembled and delivered (`records_package.completed`, `exam.export.delivered`) | On demand (target: within 1 business day of request) |
| Record retention expiry reached (`record.retention.expired`) | Record ID, retention class, legal hold status (`record.legal_hold_flag`) | Disposal task created if no legal hold; record destroyed and logged (`record.destroyed`) | Per retention schedule |

**ALERTS/METRICS:** Alert if the monthly KRI report is not published within 15 calendar days of month end. Alert if any cash evidence record does not have a retention clock set within 1 business day of creation. Alert if any examiner export request is not fulfilled within 1 business day. Target: 100% of cash evidence records with retention clocks set; zero overdue KRI publications.

---

## Governance & Sign-Off {#governance}

| Role | Name | Responsibility |
|---|---|---|
| Policy Owner | Patrick Wilson, Chief Compliance Officer | Drafts, maintains, and enforces this policy; reports exceptions to the Board |
| Approver | Patrick Wilson, Chief Compliance Officer | Approves policy revisions and exception register |
| Board of Directors | Pynthia Credit Union Board | Approves limits schedule, deviation memos, and annual policy; receives quarterly cash summaries |
| Supervisory Committee | Pynthia Credit Union Supervisory Committee | Conducts or oversees surprise cash counts; receives count results; commissions independent audits |
| BSA Officer | (designated by CCO) | Receives AML referrals from over/short monitoring; oversees AML independent testing of cash controls |
| Operations Manager | (designated) | Day-to-day execution of dual control, reconciliation, and device management |

**Review cadence:** Annual Board review of the full policy; monthly KRI reporting; quarterly Board cash summary; surprise counts at least monthly per site.

**Cross-references:**
- BSA Policy (SAR/CTR filing, AML program design)
- Investment Policy and Liquidity Policy (excess cash investment)
- Truth in Savings Policy and Member Policy (deposit account disclosures)
- Electronic Payment Systems Policy (wire and ACH controls)
- Information Security Policy (system access controls for cash-handling platforms)
- Record Retention Policy (retention schedules beyond cash-specific evidence)
- Fidelity Bond coverage schedule (12 CFR Part 713)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `cash` object and its fields, events, and timers referenced throughout this document (e.g., `cash.asset.balance`, `cash.overshort.investigation_due_at`, `cash.shipment.verification_due_at`, `cash.surprise_count.due`, `cash.kri.publish_due_at`, `cash.enterprise_limit.remediation_due_at`, `cash.custody.rotation_due_at`, `cash.coverage.attestation_due_at`, `cash.deviation.sunset_at`, `cash.limits_whitelist.entry`) are registered in `core-vocabulary.json` under the `cash` object. The `courier` object (`courier.receipt.id`), `treasury` object (`treasury.invest_excess.notified`), and `gl` sub-fields (`gl.cash_in_transit.entry`, `gl.cash_suspense.item`, `gl.cash_suspense.aging_timer`, `gl.cash_suspense.aged`, `gl.cash_suspense.escalated`, `gl.cash_suspense.cleared`, `gl.cash_suspense.posted`) are also registered. All codes used in this document follow the registered vocabulary; engineering should confirm that all referenced `cash.*` sub-field codes (dot-notation fields within the `cash` schema) are registered before the next review cycle.

- **Specific limit values are not set in this policy.** The enterprise cash-to-total-assets percentage cap, per-asset limits (vault, teller, ATM, ITM/VTM, recycler, petty cash), over/short coaching and discipline thresholds, and suspense aging schedules are maintained in the Board-approved limits schedule, which is a separate living document referenced by this policy. This policy establishes the control framework; the limits schedule provides the specific numeric parameters. The limits schedule must be Board-approved and attached to this policy as an exhibit before the effective date.

- **CMIR applicability.** This policy assumes that Pynthia Credit Union conducts or facilitates cash shipments that may meet the CMIR reporting threshold under [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/section-1010.340). If the Credit Union does not transport or receive cash shipments exceeding $10,000 across U.S. borders, the CMIR flag in CP-08 is not applicable and should be confirmed with the BSA Officer.

- **HMDA reporter status and NCUA Part 701.31.** This policy does not address lending-related cash controls (e.g., loan disbursements in cash). If Pynthia Credit Union disburses loan proceeds in cash, the applicability of [12 CFR § 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31) (non-discrimination in lending) and related fair lending controls should be confirmed with the CCO and addressed in the Fair Lending Policy.

- **Small-site compensating controls.** CP-02 references compensating-control reviews for small sites where full dual-control staffing is not feasible. The specific criteria for what constitutes a "small site" and the acceptable compensating controls (e.g., increased surprise count frequency, remote video monitoring, manager override with same-day review) are not defined in this policy and must be documented in the scope registry entry for each affected site before go-live.

- **Back-up vault sole-control option.** The reference policy permitted sole-control back-up vaults where a designated back-up Head Teller exists. This policy defaults to dual control for all vault operations. If Pynthia Credit Union wishes to permit sole-control back-up vaults under specific conditions, this must be documented as a Board-approved exception in the limits schedule with compensating controls specified.

- **Performance review integration.** The reference policy included a detailed over/short scoring rubric integrated into annual performance reviews. This policy establishes the coaching and discipline threshold framework (CP-07) but defers the specific scoring rubric and HR integration to the Human Resources Policy and individual performance management procedures. The CCO should confirm with HR that the over/short thresholds in the limits schedule are reflected in the performance review system before the effective date.

- **Petty cash fund governance.** This policy applies the same limit and reconciliation controls to petty cash funds as to other cash assets. If any petty cash fund is managed by a department outside the Operations/Finance function (e.g., a branch petty cash fund managed by the Branch Manager), the scope registry must identify the custodian and the applicable limit, and the monthly surprise count requirement applies.
