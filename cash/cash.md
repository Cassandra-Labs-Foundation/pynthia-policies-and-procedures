---
title: Cash Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-18
next_review: 2027-06-18
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Cash, Operations, BSA, Dual-Control]
---

## General Policy Statement

Pynthia Credit Union ("Pynthia" or the "Credit Union") maintains a unified Cash Policy that governs the safeguarding, control, and management of all physical currency and cash-equivalent devices across every channel and location where cash is received, disbursed, stored, shipped, or reconciled. This policy merges the former Cash Control and Cash Management policies and applies to all employees who handle cash — including tellers, vault custodians, branch managers, operations and accounting staff, armored-courier liaisons, and ATM/ITM custodians — and to all cash assets at all branches, the operations center, ATMs/ITMs, cash recyclers, and night depositories. The Board of Directors retains ultimate responsibility by approving limits, authorizing exceptions, reviewing Supervisory Committee audit results and regulatory examination findings, and receiving quarterly risk summaries. Day-to-day control is delegated to management under the supervision of the Chief Compliance Officer, with Operations, Treasury/Finance, and the BSA Officer as required participants.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Enterprise cash position breaches board-approved % of assets | Daily enterprise position computed | Same calendar day — remediation required | Board-approved limits schedule (Appendix A) | [CA-03](#ca-03-enterprise-cash-limit) |
| Location/device load blocked for exceeding per-asset limit | Load request without exception ticket | Same day — exception ticket or denial before load | Per-asset limits schedule (Appendix A) | [CA-04](#ca-04-location-and-device-cash-limits) |
| Key/combination revocation — personnel termination | Employee termination event | Immediate revocation | Key/combo custodian registry | [CA-05](#ca-05-dual-control-keys-and-combinations) |
| Key/combination rotation — 90-day calendar cycle | 90-day rotation trigger | ≤90 days from prior rotation | Key/combo custodian registry | [CA-05](#ca-05-dual-control-keys-and-combinations) |
| Daily cash reconciliation | Business day closes | End of same business day | GL tie-out with segregated approver | [CA-06](#ca-06-reconciliation-and-gl-controls) |
| Over/short variance investigated | Teller or device close with variance | 1 business day to open investigation; same day to post | Investigation record; posting | [CA-07](#ca-07-overshort-monitoring) |
| Cash shipment verified | Courier hand-off (inbound or outbound) | Same day | Manifest vs. courier receipt vs. GL | [CA-08](#ca-08-atmitm-night-drop-and-shipments) |
| Monthly surprise cash count per site | Monthly count schedule | Variance resolved within 1 BD of count | Dual-control count sheet | [CA-09](#ca-09-surprise-cash-counts-and-audits) |
| Board deviation memo — approval before limit exceeded | Request to exceed any board-approved limit | Before the limit is exceeded | Signed Board deviation memo | [CA-10](#ca-10-seasonal-deviations-and-exceptions) |
| New-hire cash-handling training | Date of hire or role assignment | Within 30 calendar days | Training completion record | [CA-11](#ca-11-training-and-competency) |
| Monthly KPI/KRI report published | Month-end close | Within 15 calendar days of month-end | KRI pack to CCO, Board, BSA Officer | [CA-12](#ca-12-monitoring-reporting-and-recordkeeping) |
| Scope registry attestation | New cash asset or role goes live | Before go-live | Scope registry attestation record | [CA-02](#ca-02-scope-and-applicability) |

---

## CA-01 — Governance & Delegation {#ca-01-governance-and-delegation}

**WHY (Reg cite):** The Federal Credit Union Act ([12 U.S.C. §§1751–1795k](https://www.law.cornell.edu/uscode/text/12/chapter-14)) charges the Board with ultimate safety-and-soundness responsibility over all credit union assets, including cash. The BSA program requirement ([31 U.S.C. §5318(h)](https://www.law.cornell.edu/uscode/text/31/5318) and [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)) mandates a board-approved AML program with ongoing monitoring and independent testing; cash-risk KRIs are a required link in that governance chain.

**SYSTEM BEHAVIOR:** The Board approves and re-approves this policy, the limits schedule (Appendix A), and any material deviations annually or out-of-cycle when triggered by a control breach or significant operational change. Cash-risk KRIs feed the BSA/AML governance dashboard on the same cadence as other AML indicators. The CCO publishes a quarterly Board summary within the normal Board-package cycle; the BSA Officer attests to the exception log at each quarterly cycle. Management escalates any enterprise-limit breach or unresolved material variance to the CCO same-day. The exception register is write-restricted to the CCO and BSA Officer; the Board and Supervisory Committee have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review or out-of-cycle material change (`cash.governance.quarter_closed` at annual cycle) | Current policy, limits schedule (`cash.limits_schedule`), exception register summary (`cash.exception_register.summary`) | Approved policy version logged; limits schedule effective date updated (`cash.limits_schedule.updated`) | Annually; out-of-cycle on material change |
| Quarter closes — BSA governance cadence (`cash.governance.quarter_closed`) | Monthly KRI trend data (`cash.kri.trend`), exception register (`cash.exception_register`), prior-quarter Board summary | Quarterly Board summary published; exception log attested (`cash.exception.logged`) | Within normal Board-package cycle following quarter-end |
| Enterprise limit breach detected (`cash.enterprise_limit.breached`) | Enterprise position (`cash.enterprise_position.computed`), board-approved limit percentage (`cash.enterprise_limit.pct`) | Same-day CCO escalation notification; remediation task opened (`cash.enterprise_limit.remediated`) | Same calendar day |

**ALERTS/METRICS:** Dashboard alert fires when any open exception is older than 30 days without a resolved status. Quarterly Board summary publication within 5 business days of quarter-end is a target-zero miss metric; latency tracked by `cash.kri.publish_due_at`.

---

## CA-02 — Scope & Applicability {#ca-02-scope-and-applicability}

**WHY (Reg cite):** NCUA security program requirements ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) require a written security program covering all branch facilities and cash-handling operations. The FCUA ([12 U.S.C. §§1751 et seq.](https://www.law.cornell.edu/uscode/text/12/chapter-14)) obligates the Board to ensure adequate controls over all cash exposures; formally registering each covered asset and role before operations begin operationalizes that duty.

**SYSTEM BEHAVIOR:** The scope registry (`cash.coverage.registry`) lists every covered employee role, activity type, and location/channel — branches, operations center, ATMs/ITMs, cash recyclers, and night depositories. The CCO or designee attests the registry each time a new asset or role goes live; attestation must occur before operational go-live. For sites with fewer than two eligible employees (making standard dual control impractical), a compensating-review memo is attached to the scope entry and reviewed at the next quarterly governance cycle. The scope registry is write-restricted to Operations and the CCO; branch managers may request changes via the coverage-change workflow.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New cash asset or role prepared for go-live (`cash.coverage.change_requested`) | Proposed scope entry (role, location, activity type), compensating-review memo if small site | Coverage registry updated (`cash.coverage.updated`); attestation timestamp logged (`cash.coverage.attested`) | Before go-live; `cash.coverage.attestation_due_at` enforces deadline |
| Annual policy review — full registry re-attestation (`cash.coverage.attestation_due_at`) | Current registry, active branch and ATM/ITM list, HR roster of cash-handling staff | Full registry re-attestation logged (`cash.coverage.attested`) | Annually at policy review |

**ALERTS/METRICS:** Alert fires if any active cash asset lacks an attestation dated within the last 12 months. Target: zero unattested assets at each quarterly governance review.

---

## CA-03 — Enterprise Cash Limit {#ca-03-enterprise-cash-limit}

**WHY (Reg cite):** The FCUA safety-and-soundness mandate ([12 U.S.C. §§1761–1766](https://www.law.cornell.edu/uscode/text/12/chapter-14)) and the NCUA fidelity-bond rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) require the Board to ensure cash exposures are sized within bond coverage and do not represent an undue concentration of risk in liquid assets. A board-approved enterprise cash limit operationalizes those obligations.

**SYSTEM BEHAVIOR:** The Board approves a maximum total-cash-to-total-assets percentage (the "enterprise limit") in the limits schedule (Appendix A). The system computes the enterprise cash position daily against total assets; a warning alert fires at 90 % of the limit and a breach alert fires at 100 %. On a warning, Treasury is automatically notified to prepare an investment sweep; on breach, Treasury must execute same-day remediation (invest excess, adjust branch orders, or seek a Board deviation under CA-10). The CCO is copied on all breach notifications. The enterprise position is posted to the general ledger daily. Remediation is confirmed when the position falls below the limit and the breach record is closed. All limit percentages and sweep-threshold amounts reside in the limits schedule, which is write-restricted to Treasury and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily enterprise cash position computed (`cash.enterprise_position.posted`) | Sum of all asset balances (`cash.asset.balance[]`), total-assets figure from GL, limit percentage (`cash.enterprise_limit.pct`) | Enterprise position record posted; warning or breach event emitted if threshold crossed (`cash.enterprise_limit.breached`) | Daily; same business day |
| 90 % warning threshold reached | Enterprise position (`cash.enterprise_position.computed`), headroom (`cash.enterprise_position.headroom`), limit percentage | Treasury sweep notification; warning logged (`cash.enterprise_limit.breached` with warning flag `cash.enterprise_limit.warning`) | Same day as computation |
| 100 % breach confirmed | Enterprise position, excess amount (`cash.enterprise_position.excess`), limit percentage | CCO escalation notification; remediation task opened; `cash.enterprise_limit.remediation_due_at` set (`cash.enterprise_limit.remediated`) | Same day; deadline enforced by `cash_enterprise_limit.remediation` task |
| Remediation confirmed — position returns below limit | Post-action enterprise position, GL entries confirming investment or redistribution | Breach record closed; remediation completed (`cash.enterprise_limit.remediated`) | Same business day as corrective action |

**ALERTS/METRICS:** Aging alert fires if any open enterprise-limit breach has not been remediated within 4 business hours. Target: zero unresolved breaches at end of each business day. Warning-to-breach conversion rate tracked monthly as a KRI.

---

## CA-04 — Location & Device Cash Limits {#ca-04-location-and-device-cash-limits}

**WHY (Reg cite):** NCUA security program requirements ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) require limits on cash exposure at individual facilities as part of the robbery and burglary prevention program. The FCUA safety-and-soundness mandate and the fidelity-bond rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) tie per-asset limits to bond-coverage adequacy.

**SYSTEM BEHAVIOR:** The limits schedule (Appendix A) specifies per-asset cash limits for each vault, teller drawer, ATM, ITM/VTM, cash recycler, and petty-cash fund. When a load request is submitted, the system compares the requested load plus current balance against the per-asset limit. Loads that would exceed the limit without an open exception ticket are blocked (`cash.load.decided` with blocked disposition) and the requesting custodian and branch manager are alerted. Loads within limit proceed immediately. For vault, ATM, ITM, and recycler operations, dual custodians must be present; a single-custodian load attempt for those asset types is blocked regardless of amount. The limits schedule is write-restricted to the CCO and Treasury; branch managers may view limits for their own assets. Exception tickets authorizing a temporary overage are linked to the load record and subject to CA-10.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Load requested for any cash asset (`cash.load.decided`) | Asset ID (`cash.asset.id`), requested load amount (`cash.load.amount`), current balance (`cash.asset.balance`), per-asset limit (`cash.asset.limit`), exception ticket ID if applicable (`cash.exception_ticket.id`), dual-custodian IDs for controlled assets (`cash.custodian.user_id`) | Load approved or blocked with disposition logged (`cash.load.decided`); overage amount recorded if exception ticket present (`cash.load.overage`) | Real-time at load request |
| Load blocked — limit exceeded without exception ticket | Asset ID, overage amount, custodian IDs | Block notification to custodian and branch manager; limit-block alert logged (`cash.limit_block.alerted`) | Real-time |
| Limits schedule updated by Board or CCO approval | Revised per-asset limits, Board approval reference, effective date (`cash.limits_schedule.effective`) | Updated limits schedule published (`cash.limits_schedule.updated`) | Before effective date |
| Whitelisted temporary limit activated via approved deviation (CA-10) | Exception ticket ID, approved deviation amounts, sunset date (`cash.limits_whitelist.sunset`) | Whitelist entry activated (`cash.limits_whitelist.activated`) | Upon Board deviation approval |

**ALERTS/METRICS:** Target: zero load approvals above the per-asset limit without a linked open exception ticket. Alert fires within 1 minute of any blocked load. Whitelist entries approaching sunset date alert the CCO 5 business days before expiry.

---

## CA-05 — Dual Control, Keys & Combinations {#ca-05-dual-control-keys-and-combinations}

**WHY (Reg cite):** NCUA security program requirements ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) specifically require dual-control procedures for vault access and cash shipments as part of the robbery and embezzlement prevention program. The FCUA and the fidelity-bond coverage rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) condition bond adequacy on the maintenance of dual-control procedures.

**SYSTEM BEHAVIOR:** Dual control is required for all vault access, cash shipments, ATM/ITM loads, and night-drop retrieval. A dual-control session is initiated by the first custodian and is not considered complete until the second custodian authenticates within the same session window (`cash.dual_control.initiated` → `cash.dual_control.completed`). Single-custodian attempts for dual-control operations are blocked at the system layer. The key/combination custodian registry (`cash.custodian.user_id`) records each authorized holder of physical keys or digital combination credentials for every controlled asset. On termination, custody access is revoked immediately (`cash.custody.revoked`); the system enforces this before allowing other offboarding steps. On transfer or role change, revocation occurs the same business day. At least every 90 days, all combinations are rotated; the rotation due date is tracked by `cash.custody.rotation_due_at`. Keybox access events are logged regardless of whether a transaction follows. The custodian registry is write-restricted to the CCO and branch managers within their own site; the BSA Officer has read access for independent-testing purposes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Dual-control operation initiated (vault access, ATM/ITM load, shipment, night-drop retrieval) | First custodian ID (`cash.custodian.user_id`), asset ID (`cash.asset.id`), operation type | Dual-control session opened (`cash.dual_control.initiated`) | Real-time |
| Second custodian authenticates to complete session | Second custodian ID, asset ID, operation type | Dual-control session completed (`cash.dual_control.completed`) | Real-time; session expires if second authentication not received within defined window |
| Keybox opened for combination or key retrieval | Custodian ID, reason (`cash.keybox.reason`), asset ID | Keybox access logged (`cash.keybox.access_logged`); keybox-opened event emitted (`cash.keybox.opened`) | Real-time |
| Termination triggers custody revocation | Employee ID, affected asset list | Custody revoked for all controlled assets (`cash.custody.revoked`); registry updated | Immediate on termination; same business day for transfer or role change |
| 90-day rotation trigger (`cash.custody.rotation_due_at`) | List of controlled assets, current custodian registry | Combinations rotated; rotation logged (`cash.custody.rotated`); new rotation due date set | ≤90 days from prior rotation; enforced by `cash_custody.rotation` task |

**ALERTS/METRICS:** Alert fires if any `cash.custody.rotation_due_at` is past due. Alert fires if any keybox-access event is not followed by a dual-control-completed record within 15 minutes. Target: zero single-custodian completions for dual-control-required operations.

---

## CA-06 — Reconciliation & GL Controls {#ca-06-reconciliation-and-gl-controls}

**WHY (Reg cite):** NCUA records preservation requirements ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)) mandate that reconciliation records and GL entries be maintained in a manner that supports examiner review. The FCUA safety-and-soundness duty requires that cash on the books equals cash in custody at all times, with same-day tie-out to detect losses, mispostings, or fraud. The BSA program rule ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)) requires internal controls that prevent GL manipulation.

**SYSTEM BEHAVIOR:** At the close of each business day, each teller drawer, vault, ATM/ITM, cash recycler, and petty-cash fund must be reconciled to the general ledger. Segregation of duties is enforced: the employee who holds custody of the cash is different from the employee who posts the GL entry, who is different from the employee who approves the reconciliation. Any variance between the physical count and the GL posts as a recon-variance record (`cash.recon.variance`). Recon-variance records must be researched and cleared with a documented explanation (`cash.recon.research_notes`) on the same business day; items that cannot be resolved same-day post to a suspense account with an aging trigger. Suspense items older than the threshold defined in Appendix A escalate to the CCO. Reconciliation records and supporting work papers are retained per CA-12. All GL-posting access is write-restricted to accounting staff; reconciliation approval is restricted to supervisory staff; cash-holding employees are write-blocked from both roles.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Business day closes — reconciliation due | Physical count for each asset, current GL balance for each asset, approver ID | Reconciliation initiated; variance computed (`cash.recon.variance`); day-closed event emitted (`cash.recon.day_closed`) | End of same business day |
| Reconciliation ties — variance equals zero | Physical count, GL balance, approver ID | Reconciliation completed and approved (`cash.recon.completed`) | End of same business day |
| Variance found — research required | Variance amount (`cash.recon.variance_found`), research notes (`cash.recon.research_notes`), suspense account reference | Variance record opened; suspense entry posted if not resolved same-day; resolution deadline enforced (provisional: `cash.recon.due_at`) | Same day for posting; resolution deadline per Appendix A |
| Suspense item ages past threshold | Suspense age, variance amount, asset ID | CCO escalation notification; exception ticket created (`cash.exception.logged`) | Per aging threshold in Appendix A |

**ALERTS/METRICS:** Target: zero open reconciliation variances at end of business day. Alert fires on any suspense item older than 1 business day. Monthly suspense-aging report is a KRI reported under CA-12.

---

## CA-07 — Over/Short Monitoring {#ca-07-overshort-monitoring}

**WHY (Reg cite):** The BSA program rule ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)) requires internal controls sufficient to detect and report suspicious patterns in cash handling; recurring over/short anomalies are a recognized indicator of internal fraud or structuring. NCUA supervisory expectations under the FCUA require that employee performance in cash handling be monitored and that material variances be escalated.

**SYSTEM BEHAVIOR:** Over/short variances are recorded per person and per location (`cash.overshort.recorded`). Each variance triggers a same-day posting. Variances exceeding the investigation threshold in Appendix A must be investigated within 1 business day (`cash.overshort.investigation_opened`). The investigating supervisor documents findings in `cash.overshort.research_notes`. Cumulative over/short by employee is tracked over rolling periods; when cumulative amounts or frequency metrics cross coaching or discipline thresholds (`cash.overshort.threshold_crossed`), the investigation escalates to HR and the branch manager. Recurring anomalies that suggest structured activity, intentional manipulation, or patterns inconsistent with normal employee activity are escalated to AML case management (`cash.overshort.anomaly_detected`). A monthly over/short report is issued to the CCO and BSA Officer within 15 calendar days of month-end. Investigation records and monthly reports are retained per CA-12. The over/short module is write-accessible to teller supervisors and the CCO; threshold configurations are restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Teller or device closes with a balance variance | Employee or device ID, over/short amount (`cash.overshort.amount`), transaction-day GL reference | Over/short posted to register (`cash.overshort.posted`); variance recorded (`cash.overshort.recorded`) | Same business day |
| Investigation threshold exceeded (`cash.overshort.threshold_crossed`) | Over/short amount, threshold value (`cash.overshort.thresholds`), employee or device ID | Investigation opened (`cash.overshort.investigation_opened`); investigation due date set (`cash.overshort.investigation_due_at`); enforced by `cash_overshort.investigation` task | Within 1 business day |
| Cumulative coaching or discipline threshold crossed | Cumulative over/short (`cash.overshort.cumulative`), threshold parameters, HR routing | Escalation to HR and branch manager; exception ticket logged (`cash.exception.logged`) | Within 1 business day of threshold crossing |
| AML anomaly pattern detected | Pattern data (`cash.overshort.pattern`), employee ID, rolling period summary | AML anomaly event emitted (`cash.overshort.anomaly_detected`); AML case opened in BSA system | Same day as detection |
| Month closes — monthly report due (`cash.kri.month_closed`) | All over/short records for the period, unresolved count (`cash.overshort.unresolved`), monthly summary object (`cash.overshort.monthly_summary`) | Monthly over/short report issued (`cash.overshort.report_issued`) | Within 15 calendar days of month-end |
| Investigation closed | Research notes, corrective action, resolution determination | Over/short investigation resolved (`cash.overshort.resolved`) | Within investigation window |

**ALERTS/METRICS:** Alert fires if any open investigation exceeds 1 business day without resolution or escalation. Target: zero AML referrals not opened in AML case management same-day. Monthly report issuance latency tracked as a KRI under CA-12.

---

## CA-08 — ATM/ITM, Night-Drop & Shipments {#ca-08-atmitm-night-drop-and-shipments}

**WHY (Reg cite):** NCUA security program requirements ([12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) specifically include ATM and night-depository procedures within the written security program scope. The BSA Currency and Monetary Instruments Report requirement ([31 CFR Part 1010, Subpart D](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010)) applies to physical cash shipments; same-day verification and GL posting support accurate reporting and anomaly detection.

**SYSTEM BEHAVIOR:** All ATM/ITM load and cassette retrieval operations require dual custodians (enforced by CA-05). Night-drop retrieval also requires dual control; the seal number present at retrieval is recorded and compared against the expected seal (`cash.seal.expected`); a seal mismatch triggers an immediate CCO notification, AML referral, and exception entry. Cash shipments — both inbound from armored courier and outbound to the Federal Reserve or correspondent — are verified same-day by counting received cash against the courier manifest and posting the result to the GL. Any discrepancy between the manifest count and the physical count is treated as an over/short under CA-07 and escalates to the CCO and armored carrier same-day. Device service events that require opening the currency compartment must occur under dual control; all service events are logged. ATM/ITM cash balances are reconciled to the GL daily under CA-06. Operations staff are write-restricted to assets within their assigned locations; dual-control records are write-restricted to Operations and branch managers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Night-drop retrieved under dual control | Custodian IDs (`cash.custodian.user_id`), bag ID, expected seal number (`cash.seal.expected`), found seal number (`cash.seal.found`) | Night-drop verification logged (`cash.nightdrop.verified`); seal-mismatch event emitted if discrepancy (`cash.seal.mismatch`) | Real-time; mismatch investigation opens same day |
| Seal mismatch detected | Bag ID, expected vs. found seal numbers (`cash.seal.mismatch`), custodian IDs | AML referral initiated; CCO notified; exception logged (`cash.exception.logged`) | Same day |
| Cash shipment received from armored courier | Shipment manifest amount (`cash.shipment.amount`), physical count, courier receipt, custodian IDs | Shipment verified (`cash.shipment.verified`); GL posting initiated; verification deadline enforced (`cash.shipment.verification_due_at`) | Same day; enforced by `cash_shipment.verification` task |
| Cash shipment dispatched to armored courier | Outbound manifest, physical count, dual-custodian IDs | Shipment dispatch logged (`cash.shipment.dispatched`); GL posting initiated | Same day |
| Shipment discrepancy found | Manifest vs. physical count variance, courier receipt | Over/short posted per CA-07; CCO and carrier notified same-day | Same day |
| Device service event requiring currency-compartment access | Technician ID, device ID (`cash.asset.id`), dual-custodian IDs, service type, device service flag (`cash.device.serviced`) | Device service logged (`cash.device.service_logged`) | Real-time |

**ALERTS/METRICS:** Alert fires if any cash shipment is not verified by end of business day. Target: zero seal mismatches without a same-day AML investigation opened. Device-service events without a corresponding dual-control-completed record within 30 minutes alert the CCO.

---

## CA-09 — Surprise Cash Counts & Audits {#ca-09-surprise-cash-counts-and-audits}

**WHY (Reg cite):** The NCUA Supervisory Committee Audit rule ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) requires the Supervisory Committee to perform or commission surprise verifications of cash and other assets. The FCUA ([12 U.S.C. §§1761d–1761f](https://www.law.cornell.edu/uscode/text/12/chapter-14)) prescribes the Supervisory Committee's audit function as a safeguard against misappropriation. Surprise counts are also required under the BSA independent-testing program ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)).

**SYSTEM BEHAVIOR:** A surprise cash count must be performed at least once per calendar month at each site, covering teller drawers, the main vault, back-up vaults, and any on-site ATM/ITM or cash recycler. Counts are scheduled by the CCO or the Supervisory Committee independently of branch management; branch personnel are not notified in advance. Each count is conducted under dual control by two persons, at least one of whom is not the regular custodian. Count results — including any variance — are documented in the count sheet record and signed by both counters. Variances are investigated within 1 business day per CA-07 procedures. Count results are reported to the Supervisory Committee and the CCO, and are available to independent audit and BSA independent-testing staff. Unresolved variances escalate to the Supervisory Committee at its next regular meeting. The surprise-count schedule is write-restricted to the CCO and Supervisory Committee; count results are write-restricted to the auditors who conduct the count.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly count due per schedule (`cash.surprise_count.due`) | Site ID (`cash.location.id`), asset list, assigned counter IDs, count schedule (`cash.surprise_count.schedule`) | Count session opened; `cash.surprise_count.due` timer enforced by `cash_surprise_count.due` task | Monthly per site |
| Count completed by dual-control counters | Physical counts for all covered assets, counter IDs, dual-control record | Count completed and logged (`cash.surprise_count.completed`); variance amount recorded (`cash.surprise_count.variance`) | Within the business day of the count |
| Variance found at count | Variance amount, asset ID, counter IDs | Over/short investigation opened per CA-07; Supervisory Committee notification queued | Within 1 business day |
| Audit scheduled by Supervisory Committee or CCO | Site list, date range, auditor assignments | Audit scheduled and logged (`cash.audit.scheduled`) | As scheduled |

**ALERTS/METRICS:** Alert fires if any site has not had a completed surprise count within the current calendar month. Target: zero sites missing a monthly count. Per-site variance rate per month is a KRI reported under CA-12.

---

## CA-10 — Seasonal Deviations & Exceptions {#ca-10-seasonal-deviations-and-exceptions}

**WHY (Reg cite):** The NCUA fidelity-bond rule ([12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)) requires that bond coverage reflect actual cash exposure; temporary limit increases must be accompanied by a review of bond adequacy. The FCUA Board-accountability requirement obligates the Board to affirmatively approve deviations from approved limits rather than allowing management to act unilaterally.

**SYSTEM BEHAVIOR:** Any request to exceed a Board-approved limit — whether for seasonal demand (e.g., holiday cash needs), a special event, or an unanticipated operational requirement — requires a formal deviation memo approved by the Board before the limit is exceeded. The deviation memo must state the reason (`cash.deviation.reason`), the duration (`cash.deviation.period`), the revised limit amounts, and whether bond or insurance adjustment is required. Upon Board approval (`cash.deviation.approved`), the corresponding whitelist entry is activated in the limits engine (CA-04, `cash.limits_whitelist.activated`) with the sunset date (`cash.limits_whitelist.sunset`). On the sunset date, the whitelist entry automatically expires (`cash.deviation.expired`) and limits revert to the approved schedule. Requests that arrive after a limit has already been exceeded are treated as post-breach exceptions and escalated to the CCO and Board immediately; the excess is treated as a breach under CA-03 pending Board ratification. Deviation records and Board approvals are retained per CA-12. The deviation workflow is write-restricted to the CCO; Board decision input is restricted to the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Deviation requested before limit exceeded | Reason (`cash.deviation.reason`), proposed period (`cash.deviation.period`), revised limit amounts, bond or insurance adequacy review | Deviation request logged (`cash.deviation.requested`); Board decision workflow initiated | Before the limit is exceeded |
| Board decides on deviation request (`cash.deviation.board_decided`) | Board decision record, approved or denied | Board decision recorded (`cash.deviation.board_decided`); if approved, whitelist entry activated (`cash.limits_whitelist.activated`) with sunset date (`cash.limits_whitelist.sunset`) | At Board meeting or out-of-cycle action |
| Whitelist entry sunset date reached | Sunset date, whitelist entry | Whitelist entry expired (`cash.deviation.expired`); limits reverted to approved schedule | Automatic on sunset date |
| Post-sunset confirmation | Position against original limits | Breach check; if position still exceeds original limit, CCO and Board notified | Same day as sunset |

**ALERTS/METRICS:** Alert fires 5 business days before a whitelist entry's sunset date to prompt bond-coverage review. Target: zero deviations requested after a limit has already been exceeded. Post-breach exception entries tracked as a KRI under CA-12.

---

## CA-11 — Training & Competency {#ca-11-training-and-competency}

**WHY (Reg cite):** The BSA training requirement ([31 U.S.C. §5318(h)(1)(C)](https://www.law.cornell.edu/uscode/text/31/5318) and [31 CFR §1020.210(a)(4)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)) mandates ongoing training for all persons involved in cash handling as part of the AML internal-controls program. NCUA safety-and-soundness expectations under the FCUA require that employees demonstrate competency in dual control, counterfeit detection, and device procedures before operating independently.

**SYSTEM BEHAVIOR:** All employees assigned to cash-handling roles must complete initial training within 30 calendar days of hire or role assignment. Initial training must cover: cash-handling accuracy, counterfeit detection, common fraud and theft schemes, robbery and emergency response, dual-control procedures, and device and shipment-specific procedures applicable to the employee's role. Annual refresher training is required for all cash-handling employees. Role-specific proficiency checks (e.g., a practical dual-control assessment for vault custodians; an ATM/ITM loading assessment for device custodians) must be completed within the initial training window and annually thereafter. Employees who fail a proficiency check are restricted from independent cash-handling operations until remediation training is completed and the check is re-passed. Training completion records and proficiency scores are retained per CA-12 and feed the AML governance dashboard. Training curriculum is versioned and reviewed at each annual policy cycle. Training records are accessible to the CCO, BSA Officer, HR, and branch managers; employees can view only their own records.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New employee hired or assigned to cash-handling role | Employee ID, hire or assignment date, role, required curriculum (`training.curriculum`) | Training due date set; training record opened | Initial training must be complete within 30 calendar days |
| Training module completed | Employee ID, course IDs, completion scores, trainer or system ID | Training completion logged (`training.completed`); proficiency check scheduled if applicable | Within 30-day window for initial; within 12 months of prior for annual |
| Proficiency check conducted | Employee ID, check type (dual-control, ATM/ITM, vault), assessor ID | Proficiency check result recorded; operational restriction lifted if check passed | Within initial training window; annually thereafter |
| Proficiency check failed | Employee ID, check type, score, assessor ID | Cash-handling access restricted; remediation training required; CCO and HR notified | Same day as failure |
| Annual training cycle opens | All active cash-handling employee IDs, prior completion records | Training assignments refreshed; due dates set for each employee | Beginning of each annual cycle |

**ALERTS/METRICS:** Alert fires if any active cash-handling employee is more than 5 calendar days past their initial or annual training due date. Target: 100 % current training completion for all cash-handling staff at each quarterly governance review. Employees with active operational restrictions due to failed proficiency checks tracked as a KRI.

---

## CA-12 — Monitoring, Reporting & Recordkeeping {#ca-12-monitoring-reporting-and-recordkeeping}

**WHY (Reg cite):** NCUA records preservation requirements ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)) specify retention schedules for reconciliation records, count sheets, dual-control logs, device load sheets, and exception registers. The BSA independent-testing requirement ([31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/section-1020.210)) mandates that AML-program records — including cash-handling evidence — be retrievable for examiner and independent-testing review. Monthly KPI/KRI publication is a CCO commitment to the Board under the FCUA governance framework.

**SYSTEM BEHAVIOR:** The CCO publishes a monthly KPI/KRI dashboard within 15 calendar days of each month-end. The dashboard covers: enterprise cash position vs. limit (with trend), per-asset over/short rates, surprise-count completion rates and outstanding variances, reconciliation suspense aging, training completion rates, exception register status (open/closed/aging), and deviation and whitelist status. The exception register is maintained continuously; each entry is attested by the CCO at each quarterly governance cycle. All required evidence — reconciliation packs, count sheets, dual-control logs, device load sheets, keybox access logs, shipment manifests, deviation memos, training records — is retained for the period specified in the records schedule (Appendix B), indexed by asset and date, and made available to examiners and BSA independent testers on request. Items may not be destroyed before their retention anchor date without a CCO-approved waiver. The records system is write-restricted to accounting staff and the CCO; examiners and auditors have read access to a scoped export. KRI data feeds the BSA/AML governance dashboard.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Month closes — KRI/KPI report due (`cash.kri.month_closed`) | All monthly metrics (over/short rates, reconciliation suspense, surprise-count completion, training status, exception log summary), prior-month comparison | KRI pack compiled and published (`cash.kri.published`); publication deadline enforced (`cash.kri.publish_due_at`) | Within 15 calendar days of month-end; enforced by `cash_kri.publish` task |
| Evidence record created at each covered event (`cash.evidence.created`) | Evidence type (provisional: `cash.evidence.type`), source asset or operation, date, custodian IDs, retention schedule | Evidence record retained with retention anchor date and retention schedule tagged | At time of each covered event |
| Exception log entry created (`cash.exception.logged`) | Exception type, asset ID, date, description, status | Exception entry logged with open or closed status | Real-time at exception occurrence |
| Exception log attested at quarterly cycle | All open and closed exception entries for the quarter, CCO sign-off | Attestation logged; summary produced (`cash.exception_register.summary`) | At each quarterly governance cycle |
| Examiner or audit export requested | Scoped date range, asset or location filter | Structured export produced; access logged | Within examiner-defined response window |

**ALERTS/METRICS:** Alert fires if the monthly KRI report is not published within 15 calendar days of month-end. Alert fires if any evidence record is flagged as missing at an active examination. Exception register staleness alert fires if any entry has been open for more than 30 days without a status update or escalation.

---

## Governance & Sign-Off {#governance}

**Owner:** Patrick Wilson, Chief Compliance Officer

**Required participants:** Operations (daily limits enforcement, dual-control procedures, reconciliation), Treasury/Finance (enterprise limit monitoring, investment sweeps), BSA Officer (AML program linkage, independent testing), Supervisory Committee (surprise cash counts, audit oversight and reporting to Board)

**Review cadence:** Annual. Out-of-cycle review required within 30 calendar days of: (a) a material cash loss or fraud event; (b) any NCUA or BSA examination finding related to cash controls; (c) addition of a new cash-handling channel or technology (e.g., new cash-recycler model, ITM deployment); or (d) a limits-schedule breach that required Board deviation.

**Adjacent policies:**
- **BSA Policy** — AML program design, CTR/SAR filing, Travel Rule, and independent testing of cash controls
- **Investment Policy** — excess-cash investment decisions triggered by CA-03
- **Liquidity Policy** — cash-to-liquidity interface
- **Vendor Risk Management Policy** — armored-carrier and ATM-servicer due diligence and oversight
- **Record Retention Policy** — retention schedules beyond cash-specific evidence (Appendix B)
- **Information Security Policy** — logical access controls for cash-handling systems
- **Electronic Payment Systems Policy** — wire and ACH origination controls; out of scope here

This policy was approved by the Board at the meeting of record. The next scheduled review is 12 months from the effective date.

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for several cash-specific fields.** The following fields referenced in the control overlays are flagged as provisional in the engineering specification and require confirmation before the next review: `cash.duty.id` (segregation-of-duties identity reference used in CA-06), `cash.enterprise_position.schedule` (the daily computation schedule that triggers CA-03), `cash.evidence.type` (evidence-type classification used in CA-12), and `cash.recon.due_at` (the reconciliation deadline timer in CA-06). These are the target naming scheme; engineering will confirm before final publication.

- **Limits schedule (Appendix A) numeric values are not yet specified.** The policy references a Board-approved limits schedule for: enterprise cash percentage, per-asset limits (vault, teller, ATM, ITM, recycler, petty cash), over/short investigation thresholds, cumulative coaching and discipline thresholds, reconciliation suspense aging thresholds, and sweep trigger percentages. These values must be approved by the Board and attached as Appendix A before this policy is operationally effective.

- **Records retention schedule (Appendix B) is not yet attached.** Specific retention periods for each evidence type (reconciliation packs, count sheets, dual-control logs, device load sheets, keybox access logs, shipment manifests, deviation memos, training records) must be confirmed against 12 CFR Part 749 schedules and attached as Appendix B.

- **Small-site compensating review protocol is undefined.** The policy requires compensating reviews for sites too small to maintain standard dual control, but the specific review protocol (e.g., remote supervisor attestation, video monitoring, frequency) has not been defined. Operations and the CCO must agree on a standard before the next scope attestation cycle.

- **Armored carrier and ATM-servicer vendor linkage.** This policy governs cash-handling controls but does not specify vendor-risk-management due-diligence requirements for armored carriers and ATM servicers. Those requirements reside in the Vendor Risk Management Policy. The linkage — specifically whether an annual vendor review triggers an update to dual-control and shipment-verification procedures — should be formalized at the next review cycle.

- **Charter type and regulatory applicability.** As a federally chartered credit union, Pynthia is subject to NCUA rules and the FCUA rather than OCC or FDIC rules. This policy is drafted accordingly. If charter status changes, re-evaluation is required.
