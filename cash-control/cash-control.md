# Cash Control

> **General Policy Statement** \{{ORGANIZATION\}} maintains a board-approved, risk-based program to safeguard cash and cash-equivalent devices. The Board **delegates** day-to-day control to management while retaining **ultimate responsibility** through limit approval, surprise cash counts, independent audits, and review of Supervisory Committee and regulatory examinations. The program sets quantified cash limits (enterprise, vault, teller, ATM/ITM, recyclers, petty cash), enforces **dual control and segregation of duties**, requires daily reconciliation to the GL, monitors over/short, prescribes ATM/night-drop handling and shipments, and governs seasonal deviations aligned with **fidelity bond (surety) coverage**. Governance ties into the **BSA/AML program** (31 CFR §1020.210) for internal controls, training, and independent testing. See the **Authority Table** below.

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                     | Scope                                                                                                                        | Key Clauses / Notes                                                                                                                                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Federal Credit Union Act (FCUA)**                       | Board duties; safety & soundness; supervisory committee; fidelity bond authority                                             | **12 U.S.C. Chapter 14 (FCUA)** (e.g., §§1751–1795k) provides statutory foundation for credit union governance and safety & soundness expectations. [12 U.S.C. Ch. 14](https://www.law.cornell.edu/uscode/text/12/chapter-14) |
| **Bank Secrecy Act (BSA)**                                | AML program; internal controls; training; independent testing; risk-based monitoring (governance link to cash handling)      | **31 U.S.C. Subchapter II (BSA)** including §5318(h) (AML program). [31 U.S.C. Subchapter II](https://www.law.cornell.edu/uscode/text/31/subtitle-IV/chapter-53/subchapter-II)                                                |
| **NCUA Security Program**                                 | Written security program; procedures for robberies/burglaries/embezzlement; dual control/assignment expectations             | **12 CFR §748.1** (establish & maintain security program). [12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748#p-748.1)                                                                                            |
| **BSA/AML Program (FinCEN rule for banks/credit unions)** | Board-approved AML program; internal controls, training, independent testing; risk-based CDD                                 | **31 CFR §1020.210**. [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210)                                                                                                                          |
| **Fidelity (Surety) Bond**                                | Minimum bond coverage; board duty to ensure adequate protection for cash exposures and seasonal adjustments                  | **12 CFR Part 713**. [12 CFR Part 713](https://www.ecfr.gov/current/title-12/part-713)                                                                                                                                        |
| **Supervisory Committee Audits**                          | Surprise cash counts; verification; scope of audits/reviews; reporting to Board                                              | **12 CFR Part 715**. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)                                                                                                                                        |
| **Records Preservation & Retention**                      | Maintain reconciliation packs, count sheets, dual-control logs, device load sheets, exception registers for required periods | **12 CFR Part 749**. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                                                                                                        |

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                              | Trigger (human → event)                                                 |                                                    Deadline | Content Reference                 | Control                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------: | --------------------------------- | ------------------------------------------------------------------ |
| Daily teller/vault/device reconciliation to GL        | Close of business → `eod.close_started`                                 |                            **Same business day** (by close) | Reconciliation packs              | [CA-06](cash-control.md#ca-06-reconciliation--gl-controls)         |
| Over/short variance investigation                     | Variance detected → `cash.var.detected`                                 |  **1 business day** to investigate; escalate ≥ ${threshold} | Over/Short log & case memo        | [CA-07](cash-control.md#ca-07-overshort-monitoring)                |
| Surprise cash counts (all sites/devices)              | Monthly plan → `audit.surprise_scheduled`                               |                               **At least monthly** per site | Count sheets; variance follow-up  | [CA-09](cash-control.md#ca-09-surprise-cash-counts--audits)        |
| Key/combination rotation                              | Custodian change or interval reached → `access.rotate_due`              | **Immediately** on personnel change; else every **90 days** | Key/combo register                | [CA-05](cash-control.md#ca-05-dual-control-keys-combos-access)     |
| Seasonal limit deviation request                      | Cash forecast shows exceedance → `limits.deviation.requested`           |                    **Pre-approval** before exceeding limits | Board memo; insurance endorsement | [CA-10](cash-control.md#ca-10-seasonal-deviations--exceptions)     |
| ATM/ITM/night-drop retrieval/load                     | Route start → `device.service.start`                                    |                         **Dual control at time of service** | Load sheets; video (if available) | [CA-08](cash-control.md#ca-08-atmitmnight-drop-procedures)         |
| **Cash shipment receive/dispatch under dual control** | Shipment arrival/departure → `shipment.arrived` / `shipment.dispatched` |                  **At event time**; log and verify same day | Shipment log; courier receipts    | [CA-08](cash-control.md#ca-08-atmitmnight-drop-procedures)         |
| **Initial & annual training completion**              | New hire/onboarding → `lms.assign.initial`                              |             **Within 30 days** of hire; annually thereafter | LMS records; proficiency check    | [CA-11](cash-control.md#ca-11-training--competency)                |
| Board reporting pack                                  | Month close → `reporting.month_close`                                   |                    **Within 15 calendar days** of month end | KPIs/KRIs; exception list         | [CA-12](cash-control.md#ca-12-monitoring-reporting--recordkeeping) |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                 | Control Name                          | Purpose                                            | Primary Rule(s)                               |
| ------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| [CA-01](cash-control.md#ca-01-governance--delegation)              | Governance & Delegation               | Assign accountability; Board oversight             | FCUA; 12 CFR §748.1; §748.2; 31 CFR §1020.210 |
| [CA-02](cash-control.md#ca-02-scope--applicability)                | Scope & Applicability                 | Define employees, activities, locations            | FCUA; §748.1                                  |
| [CA-03](cash-control.md#ca-03-enterprise-cash-limit)               | Enterprise Cash Limit                 | Cap total cash vs. assets; invest excess           | FCUA; Part 713                                |
| [CA-04](cash-control.md#ca-04-location--device-cash-limits)        | Location & Device Cash Limits         | Set per-vault/teller/ATM/ITM/recycler/petty limits | §748.1; Part 713                              |
| [CA-05](cash-control.md#ca-05-dual-control-keys-combos-access)     | Dual Control, Keys & Combos           | Protect custody/access; rotation                   | §748.1; 31 CFR §1020.210                      |
| [CA-06](cash-control.md#ca-06-reconciliation--gl-controls)         | Reconciliation & GL Controls          | Tie cash to GL; documentation                      | Part 749; 31 CFR §1020.210                    |
| [CA-07](cash-control.md#ca-07-overshort-monitoring)                | Over/Short Monitoring                 | Detect patterns; thresholds/discipline             | §748.1; Part 715; 31 CFR §1020.210            |
| [CA-08](cash-control.md#ca-08-atmitmnight-drop-procedures)         | ATM/ITM/Night-Drop & Shipments        | Dual control; device handling; shipments           | §748.1; Part 715                              |
| [CA-09](cash-control.md#ca-09-surprise-cash-counts--audits)        | Surprise Cash Counts & Audits         | Independent checks; SC oversight                   | Part 715                                      |
| [CA-10](cash-control.md#ca-10-seasonal-deviations--exceptions)     | Seasonal Deviations & Exceptions      | Temporary limit increases & insurance              | Part 713                                      |
| [CA-11](cash-control.md#ca-11-training--competency)                | Training & Competency                 | Role-based proficiency; annual refresh             | 31 U.S.C. §5318(h); 31 CFR §1020.210          |
| [CA-12](cash-control.md#ca-12-monitoring-reporting--recordkeeping) | Monitoring, Reporting & Recordkeeping | KPIs/KRIs; retention                               | §748.2; Part 749; 31 CFR §1020.210            |

***

## Control Overlays (Design Overlay v2)

{% stepper %}
{% step %}
### Governance & Delegation <a href="#ca-01-governance--delegation" id="ca-01-governance--delegation"></a>

* **WHY (Reg cite):** Board governance under **FCUA**; written security and BSA programs under **12 CFR §748.1–§748.2**; AML program elements (internal controls, independent testing, training) under **31 U.S.C. §5318(h)** and **31 CFR §1020.210**.
* **SYSTEM BEHAVIOR:** Maintain a living policy; Board approves limits schedule; cash-risk KRIs feed the AML governance dashboard; exceptions tracked and reported via BSA governance cadence.
* **TRIGGERS (human → event):** Board approval → `governance.policy_approved`; SC/audit report submitted → `report.audit_submitted`.
* **INPUTS (human → field):** Approver roster `(gov.approvers[])`; limits schedule `(limits.table)`; bond coverage `(insurance.bond_amount)`; AML program refs `(aml.controls_refs)`.
* **OUTPUTS:** Board minutes; limits appendix; exception register; AML governance packet entries.
* **TIMERS/SLAs:** Annual review; monthly cash KRIs into AML dashboard; quarterly Board summaries.
* **EDGE CASES:** Interim regulatory change—Chair ratifies; Board at next meeting.
* **AUDIT LOGS:** `policy.version.published`, `limits.appendix.updated`, `aml.dashboard.updated`.
* **ACCESS CONTROL:** Publish: CFO/Ops/Compliance (BSA Officer); Read: enterprise.
* **ALERTS/METRICS:** Policy age; open exceptions past due; AML control mapping completeness.
{% endstep %}

{% step %}
### Scope & Applicability <a href="#ca-02-scope--applicability" id="ca-02-scope--applicability"></a>

* **WHY (Reg cite):** FCUA governance and **§748.1** require comprehensive coverage; AML program must cover all relevant lines (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Tag covered **employees** (tellers, vault custodians, branch managers, ops/accounting, armored-courier liaisons, ATM/ITM custodians), **activities** (receipt, disbursement, shipment, storage, reconciliation, discrepancy handling, training, emergency/disaster), and **locations/channels** (branches, ops center, ATMs/ITMs, recyclers, night depository).
* **TRIGGERS:** New location/device/role created → `coverage.object_added`.
* **INPUTS:** Role matrix `(scope.roles[])`; asset inventory `(assets.locations[], assets.devices[])`.
* **OUTPUTS:** Coverage map used by AML/BSA control inventory.
* **TIMERS/SLAs:** Update before go-live of any new asset/role.
* **EDGE CASES:** Small sites—document compensating reviews and BSA monitoring ties.
* **AUDIT LOGS:** `scope.updated`.
* **ACCESS CONTROL:** Ops updates; Compliance/BSA approves.
* **ALERTS/METRICS:** % assets with assigned custodians/limits; % mapped to AML controls.
{% endstep %}

{% step %}
### Enterprise Cash Limit <a href="#ca-03-enterprise-cash-limit" id="ca-03-enterprise-cash-limit"></a>

* **WHY (Reg cite):** Prudently limit cash; ensure bond coverage (Part 713); inform AML liquidity/anomaly context (31 CFR §1020.210 internal controls).
* **SYSTEM BEHAVIOR:** Enforce **Total Cash** ≤ **{X%\} of total assets**; auto-notify Treasury to invest excess; post breach flags to AML monitoring context.
* **TRIGGERS:** Liquidity report run → `treasury.liquidity_generated`; forecast exceedance → `limits.breach.forecast`.
* **INPUTS:** `(finance.total_assets)`, `(cash.on_hand_total)`, `(limits.enterprise_pct)`.
* **OUTPUTS:** Daily liquidity pack; invest instruction; AML context update.
* **TIMERS/SLAs:** Remediate same day when exceeded.
* **EDGE CASES:** Seasonal needs—use [CA-10](cash-control.md#ca-10-seasonal-deviations--exceptions).
* **AUDIT LOGS:** `limits.enterprise.breached`, `treasury.invest_ordered`.
* **ACCESS CONTROL:** Treasury executes; CFO reviews.
* **ALERTS/METRICS:** Days over cap; max deviation; bond headroom.
{% endstep %}

{% step %}
### Location & Device Cash Limits <a href="#ca-04-location--device-cash-limits" id="ca-04-location--device-cash-limits"></a>

* **WHY (Reg cite):** Prevent excessive exposure per vault/teller/ATM/ITM/recycler/petty fund; align to bond and security expectations (**§748.1**, Part 713); tie exceptions to AML internal control reviews (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Maintain per-asset limits: **Vault ${vault\_limit}**, **Teller ${teller\_limit}**, **ATM ${atm\_limit}**, **ITM/VTM ${itm\_limit}**, **Recycler ${recycler\_limit}**, **Petty ${petty\_limit}**; system warns/blocks loads above limit without exception ticket; feed exception telemetry to AML case mgmt.
* **TRIGGERS:** Load initiated → `device.load.started`; start of day issue → `teller.drawer.issued`.
* **INPUTS:** `(limits.by_asset[asset_id])`; `(asset.cash_level)`.
* **OUTPUTS:** Load sheet; approval trail; AML exception signal.
* **TIMERS/SLAs:** Real-time enforcement.
* **EDGE CASES:** Service outage—manual log with two signatures; back-entry within 1 business day.
* **AUDIT LOGS:** `device.load.completed`, `limits.exception.approved`.
* **ACCESS CONTROL:** Dual custodians for vault/ATM/ITM/recycler operations.
* **ALERTS/METRICS:** Breach attempts; exception frequency by site; AML exception count.
{% endstep %}

{% step %}
### Dual Control, Keys & Combos <a href="#ca-05-dual-control-keys-combos-access" id="ca-05-dual-control-keys-combos-access"></a>

* **WHY (Reg cite):** Physical/operational controls (**§748.1**); AML internal controls mandate (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Enforce **dual control** for vault access, shipments, ATM/ITM loads, night-drop retrieval; maintain key/combination custodian registry; rotate on personnel change or every **90 days**; sealed backups.
* **TRIGGERS:** Staff change → `hr.staff.change`; rotation due → `access.rotate_due`.
* **INPUTS:** `(access.custodians[])`; `(access.rotate_days)`.
* **OUTPUTS:** Key/combo register; change certificates; AML control inventory update.
* **TIMERS/SLAs:** Immediate revocation on termination.
* **EDGE CASES:** Emergency access—incident ticket; post-event review.
* **AUDIT LOGS:** `access.revoked`, `combo.changed`.
* **ACCESS CONTROL:** Need-to-know; background-checked roles only.
* **ALERTS/METRICS:** Overdue rotations; single-custodian attempts blocked.
{% endstep %}

{% step %}
### Reconciliation & GL Controls <a href="#ca-06-reconciliation--gl-controls" id="ca-06-reconciliation--gl-controls"></a>

* **WHY (Reg cite):** Reliable records and retrievability (**Part 749**); AML internal controls & independent testing rely on reconciliations (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Daily reconcile **teller, vault, ATM/ITM, recyclers, petty** to GL and subsidiary ledgers; zero-balance suspense within **{X} days**; require documentation for all postings; provide AML investigators access to reconciliation evidence.
* **TRIGGERS:** EOD close → `eod.close_started`; device settlement file → `device.settlement.posted`.
* **INPUTS:** `(device.report)`; `(gl.batch)`; `(gl.docs[])`.
* **OUTPUTS:** Reconciliation pack; exception list; AML evidence references.
* **TIMERS/SLAs:** Same-day tie-out; suspense aging reviewed daily.
* **EDGE CASES:** System outage → manual count; back-post with dual approval.
* **AUDIT LOGS:** `recon.completed`, `suspense.cleared`.
* **ACCESS CONTROL:** Separate custody vs. posting vs. reconciliation.
* **ALERTS/METRICS:** Late recons; suspense aging > {X} days.
{% endstep %}

{% step %}
### Over/Short Monitoring <a href="#ca-07-overshort-monitoring" id="ca-07-overshort-monitoring"></a>

* **WHY (Reg cite):** Detect losses/embezzlement; governance visibility (**§748.1**, **Part 715**); anomalies feed AML monitoring (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Track over/short **per person and location**; set thresholds for coaching/discipline; analyze patterns; escalate large or recurring items; auto-signal repeated anomalies to AML case mgmt.
* **TRIGGERS:** Variance logged → `cash.var.detected`.
* **INPUTS:** `(cash.var.amount)`; `(cash.var.owner)`; `(cash.var.reason_code)`.
* **OUTPUTS:** Monthly dashboard; case memos; AML anomaly hooks.
* **TIMERS/SLAs:** Investigate within **1 business day**; report monthly.
* **EDGE CASES:** Repeated near-limit shorts—initiate retraining/rotation.
* **AUDIT LOGS:** `var.case.opened`, `var.case.closed`.
* **ACCESS CONTROL:** Managers/Compliance view; HR discipline records.
* **ALERTS/METRICS:** Top N outliers; repeat-offender count; AML referrals.
{% endstep %}

{% step %}
### ATM/ITM/Night-Drop & Shipments <a href="#ca-08-atmitmnight-drop-procedures" id="ca-08-atmitmnight-drop-procedures"></a>

* **WHY (Reg cite):** Secure handling and chain of custody (**§748.1**); audits (**Part 715**); AML internal controls require documented, testable procedures (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Dual-control **load/retrieval**; cassette totals recorded; night-drop logged with seal capture and (where available) video; **cash shipments** (inbound/outbound) logged, sealed, countersigned with courier receipts; match courier/fed credit to GL same day.
* **TRIGGERS:** Route start → `device.service.start`; bag opened → `nightdrop.bag.opened`; shipment events → `shipment.dispatched` / `shipment.arrived`.
* **INPUTS:** `(device.load_sheet)`; `(device.seal_id)`; `(courier.ticket_id)`; `(shipment.manifest_id)`.
* **OUTPUTS:** Device balancing report; night-drop log; shipment log; GL postings.
* **TIMERS/SLAs:** Post night-drop **same day**; ATM/ITM balance at service completion; shipments verified and logged same day.
* **EDGE CASES:** Seal mismatch—stop, escalate, incident ticket; shipment discrepancy—immediate count and courier escalation.
* **AUDIT LOGS:** `device.load.completed`, `nightdrop.processed`, `shipment.logged`.
* **ACCESS CONTROL:** Named dual custodians only; shipment signers authenticated.
* **ALERTS/METRICS:** Seal exceptions; shipment discrepancy rate; time-to-post.
{% endstep %}

{% step %}
### Surprise Cash Counts & Audits <a href="#ca-09-surprise-cash-counts--audits" id="ca-09-surprise-cash-counts--audits"></a>

* **WHY (Reg cite):** Independent verification (**Part 715**); AML independent testing leverages count results (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Perform **surprise counts** across tellers, vaults, devices **at least monthly** per site; Supervisory Committee/independent audit conducts periodic reviews; feed results to AML independent testing workpapers; remediate findings.
* **TRIGGERS:** Count scheduled → `audit.surprise_scheduled`.
* **INPUTS:** `(audit.count.sheet)`; `(audit.findings[])`.
* **OUTPUTS:** Variance report; remediation tracker; AML testing references.
* **TIMERS/SLAs:** Variances resolved within **1 business day**; findings closed by due date.
* **EDGE CASES:** Inability to count—document; reschedule within 48h.
* **AUDIT LOGS:** `audit.count.completed`, `finding.closed`.
* **ACCESS CONTROL:** SC/Audit independence preserved.
* **ALERTS/METRICS:** Count coverage %; open findings aging.
{% endstep %}

{% step %}
### Seasonal Deviations & Exceptions <a href="#ca-10-seasonal-deviations--exceptions" id="ca-10-seasonal-deviations--exceptions"></a>

* **WHY (Reg cite):** Temporary higher cash needs must be documented and bonded (Part 713); AML governance demands documented exceptions (31 CFR §1020.210).
* **SYSTEM BEHAVIOR:** Formal **deviation memo** to Board: reason, duration, revised limits, bond/insurance adjustments; system whitelists temporary limits with expiry; AML exception log updated.
* **TRIGGERS:** Deviation request → `limits.deviation.requested`; Board vote → `limits.deviation.approved`.
* **INPUTS:** `(limits.deviation.forecast)`; `(insurance.endorsement_id)`.
* **OUTPUTS:** Approved deviation record; whitelist entry; AML exception note.
* **TIMERS/SLAs:** Approval **before** exceeding limits; sunset on end date.
* **EDGE CASES:** Emergency surge—Chair + CEO interim approval, ratify next Board.
* **AUDIT LOGS:** `limits.deviation.entered`, `limits.deviation.expired`.
* **ACCESS CONTROL:** CFO/Ops propose; Board approves.
* **ALERTS/METRICS:** Active deviations; days since last review.
{% endstep %}

{% step %}
### Training & Competency <a href="#ca-11-training--competency" id="ca-11-training--competency"></a>

* **WHY (Reg cite):** BSA program requires training (**31 U.S.C. §5318(h)**; **31 CFR §1020.210**); security program effectiveness depends on trained staff (**§748.1**).
* **SYSTEM BEHAVIOR:** Initial + **annual** training: policy/limits, handling accuracy, counterfeit detection, fraud schemes, emergency/robbery response, dual control, device & **shipment** procedures; role-specific proficiency checks; training completion feeds AML program metrics.
* **TRIGGERS:** New hire → `hr.hire.created`; annual cycle → `lms.annual_due`.
* **INPUTS:** `(lms.course_ids[])`; `(lms.completions)`; `(lms.proficiency_scores)`.
* **OUTPUTS:** Training records; proficiency attestations; AML training metrics.
* **TIMERS/SLAs:** Complete within **30 days** of hire; annually thereafter.
* **EDGE CASES:** Failed proficiency—remediation and retest.
* **AUDIT LOGS:** `lms.completed`, `lms.remediation.assigned`.
* **ACCESS CONTROL:** Managers view team status; HR system of record.
* **ALERTS/METRICS:** Completion rate; proficiency scores; overdue training counts.
{% endstep %}

{% step %}
### Monitoring, Reporting & Recordkeeping <a href="#ca-12-monitoring-reporting--recordkeeping" id="ca-12-monitoring-reporting--recordkeeping"></a>

* **WHY (Reg cite):** Ongoing oversight; evidence retention (**12 CFR §748.2**, **Part 749**); AML program requires internal controls & independent testing (**31 CFR §1020.210**).
* **SYSTEM BEHAVIOR:** Monthly KPIs/KRIs (limit breaches, late recons, over/short trends, shipment discrepancies, device exceptions); exception log with officer attestation; retain evidence (count sheets, load/ship logs, dual-control logs, recon packs, courier tickets, audit/exam reports, Board materials) per schedule; provide exports for AML independent testing and examiner requests.
* **TRIGGERS:** Month close → `reporting.month_close`; file archived → `records.archive`.
* **INPUTS:** `(kpi.dataset[])`; `(records.schedule)`; `(aml.testing_requests[])`.
* **OUTPUTS:** Board/Committee dashboards; records index; AML testing binder extracts.
* **TIMERS/SLAs:** Publish within **15 days** of month end; retention **≥ {X years}** per record type.
* **EDGE CASES:** Litigation hold supersedes purge.
* **AUDIT LOGS:** `report.sent`, `records.purged`, `exam.export.generated`.
* **ACCESS CONTROL:** Records custodian role; examiner read-only export.
* **ALERTS/METRICS:** On-time report %; retrieval success rate; open exceptions aging.
{% endstep %}
{% endstepper %}

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Cash Limits Appendix (fill-in):** Enterprise {X% of assets}; Vault ${vault\_limit}; Teller ${teller\_limit}; ATM ${atm\_limit}; ITM/VTM ${itm\_limit}; Recycler ${recycler\_limit}; Petty ${petty\_limit}.
* **Daily Reconciliation Checklist:** device reports → GL tie-out → variance case (≥ ${threshold}) → supervisory sign-off.
* **Dual Control Pack:** custody roster; key/combo rotation log; sealed backup register; emergency access SOP.
* **ATM/ITM/Night-Drop & Shipment SOP:** route plan; seal tracking; load/ship sheets; video capture note; courier receipt match to credit; exception path.
* **Over/Short Playbook:** thresholds; coaching vs. discipline; Board escalation criteria; AML referral triggers.
* **Seasonal Deviation Memo Template:** business case; risk/bond analysis; temporary limits; duration; rollback plan; Board resolution.
* **Surprise Count Kit:** count sheet template; variance remediation form; independence attestations.
* **Monthly Board/AML Pack:** KPIs/KRIs; exception register; findings tracker; attestations; AML training & testing status.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{CFO or Operations/BSA Officer, Title\}}
* **Approvals:** \{{Board Chair, Title\}}; \{{CEO, Title\}}
* **Review Cadence:** Annual Board approval; interim updates upon material changes in operations, coverage, or regulation.
* **Reporting:** Monthly KPIs/KRIs to Management; quarterly summary to Board; Supervisory Committee/Audit reports routed on issuance; metrics integrated into AML/BSA governance dashboards.
* **Cross-Refs:** FCUA; Security Program (12 CFR §748.1); BSA/AML Program (31 U.S.C. §5318(h); 31 CFR §1020.210); Fidelity Bond (Part 713); Supervisory Committee (Part 715); Records (Part 749).

***

## Assumptions & Gaps

* **Placeholders:** `{X%}`, `\${vault_limit}`, `\${teller_limit}`, `\${atm_limit}`, `\${itm_limit}`, `\${recycler_limit}`, `\${petty_limit}`, `{threshold}`, `{X years}` require Board approval and insertion into the Limits Appendix.
* **Scope Clarification Needed:** Confirm complete employee/asset inventory for [CA-02](cash-control.md#ca-02-scope--applicability).
* **Device Coverage:** If cash recyclers or ITMs are not deployed, delete related rows/controls or mark “not in use.”
* **Compensating Controls:** Where segregation is impractical (very small sites), document approvals and enhanced reviews under [CA-06](cash-control.md#ca-06-reconciliation--gl-controls) and [CA-09](cash-control.md#ca-09-surprise-cash-counts--audits).
