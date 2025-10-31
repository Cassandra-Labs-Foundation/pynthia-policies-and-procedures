# Business Continuity Plan

> **General Policy Statement** \{{ORGANIZATION\}} maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people—covering internal operations and external member-facing services across all channels/partners in **\{{SCOPE\}}**. The program aligns with NCUA requirements for records preservation and GLBA-style safeguards and incident response expectations applicable to federally insured credit unions. We prioritize human safety, continuity of critical services, prudent recovery, and post-incident learning. (See authority links in the table below.)

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                                                   | Scope                                                                             | Key Clauses / Notes                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NCUA—Records Preservation & Catastrophic Act Preparedness (12 CFR Part 749)**         | Records preservation programs; vital records management; catastrophe preparedness | [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation & vital records); App. A/B expectations for disaster recovery of records.                                                                                                              |
| **NCUA—Security Program; Appendix A Safeguarding Member Information (12 CFR Part 748)** | Information security program; incident response; service provider oversight       | [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748); [Appendix A to Part 748](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) (GLBA-aligned safeguards incl. incident response and coordination with service providers). |
| **NCUA—Board Responsibilities (12 CFR §701.4)**                                         | Board oversight; delegation; accountability                                       | [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) (board responsibilities incl. policy approval and oversight).                                                                                                                                    |

> **Note:** FFIEC Business Continuity Management Booklet informs supervisory expectations but is guidance (not codified). This policy cites only binding regulations above and implements compatible controls.

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                   | Trigger (human → event)                                           |                                                                            Deadline | Content Reference                        | Control                                                                         |
| -------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------: | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Wildfire/Smoke (CA)        | Ops lead declares facility threat → `(incident.declare.facility)` |        **T+15m**: safety check; **T+2h**: critical services status; **RTO** per BIA | Status comms, safety, service posture    | [BC-06](business-continuity-plan.md#bc-06-incident-declaration-initial-actions) |
| Tornado/Storm (TX)         | Weather alert escalated by BCM → `(monitor.weather.escalate)`     |                      **T+15m**: shelter/remote ops; **T+2h**: vendor/utility checks | Site/people safety; remote shift         | [BC-05](business-continuity-plan.md#bc-05-monitoring-detection-severity)        |
| Major Core/Cloud Outage    | PagerDuty page from SRE → `(monitor.system.major_outage)`         | **T+5m**: incident commander on-call; **T+15m**: public status; **RTO/RPO** per BIA | IMT activate; comms; rollback/restore    | [BC-09](business-continuity-plan.md#bc-09-major-it-failure-response)            |
| Confirmed Data Breach      | DLP/IDS alert triaged → `(security.alert.confirmed)`              | **T+1h**: containment; **T+24h**: regulator/legal consult; **clock per breach law** | GLBA-style response; vendor coordination | [BC-10](business-continuity-plan.md#bc-10-incident-response-privacy-security)   |
| Pandemic/People Loss       | HR absenteeism ≥30% → `(hr.absenteeism.threshold)`                |                  **T+24h**: split teams/remote; **T+48h**: service reprioritization | People continuity; critical roles        | [BC-12](business-continuity-plan.md#bc-12-people-continuity-pandemic)           |
| Alternative Work Location  | Facility uninhabitable → `(facility.unavailable)`                 |                 **T+8h**: relocate/remote; **T+24h**: essential staff roster active | Hot/virtual sites; VPN posture           | [BC-08](business-continuity-plan.md#bc-08-alternate-site-remote-operations)     |
| Post-Incident Review (PIR) | Incident resolved → `(incident.resolve)`                          |                          **≤10 business days** draft PIR; **≤30 days** CAP approved | Root cause; CAP; retest                  | [BC-13](business-continuity-plan.md#bc-13-post-incident-review-pir)             |
| Annual Test                | Test plan approved → `(bcm.test.schedule)`                        |                                  **Annual** min; report to Board **≤30 days** after | Exercise results; gaps                   | [BC-04](business-continuity-plan.md#bc-04-training-testing-exercises)           |
| Vital Records Backup       | Daily close → `(ops.day_end)`                                     |                      Backups **Daily**; offsite replication **≤15m RPO** (critical) | RPO/RTO by BIA                           | [BC-07](business-continuity-plan.md#bc-07-data-backup-restore-rto-rpo)          |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                              | Control Name                           | Purpose                                                   | Primary Rule(s)                                                                                           |
| ------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [BC-01](business-continuity-plan.md#bc-01-governance-roles)                     | Governance & Roles                     | Define Board→Management accountability and IMT roles.     | [§701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)                                    |
| [BC-02](business-continuity-plan.md#bc-02-risk-assessment-hazards)              | Risk Assessment (Hazards by Region)    | Identify/score scenarios (e.g., CA wildfire, TX tornado). | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                |
| [BC-03](business-continuity-plan.md#bc-03-business-impact-analysis-bia)         | Business Impact Analysis (BIA)         | Rank products/services; set RTO/RPO.                      | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                |
| [BC-04](business-continuity-plan.md#bc-04-training-testing-exercises)           | Training, Testing & Exercises          | Train staff; validate plans; Board reporting.             | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |
| [BC-05](business-continuity-plan.md#bc-05-monitoring-detection-severity)        | Monitoring, Detection & Severity       | Detect incidents; classify severity; assign commander.    | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |
| [BC-06](business-continuity-plan.md#bc-06-incident-declaration-initial-actions) | Incident Declaration & Initial Actions | Standardize first hour response.                          | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |
| [BC-07](business-continuity-plan.md#bc-07-data-backup-restore-rto-rpo)          | Data Backup & Restore; RTO/RPO         | Ensure recoverability of vital records/systems.           | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                |
| [BC-08](business-continuity-plan.md#bc-08-alternate-site-remote-operations)     | Alternate Site & Remote Operations     | Maintain service when sites unavailable.                  | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                |
| [BC-09](business-continuity-plan.md#bc-09-major-it-failure-response)            | Major IT Failure Response              | Runbook for core/cloud outages.                           | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |
| [BC-10](business-continuity-plan.md#bc-10-incident-response-privacy-security)   | Incident Response (Privacy/Security)   | GLBA-style containment, notice, vendor coordination.      | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |
| [BC-11](business-continuity-plan.md#bc-11-communications-notification-tree)     | Communications & Notification Tree     | Staff/member/vendor/regulator comms.                      | [§701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)                                    |
| [BC-12](business-continuity-plan.md#bc-12-people-continuity-pandemic)           | People Continuity & Pandemic           | Staffing plans; split teams; HR triggers.                 | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                |
| [BC-13](business-continuity-plan.md#bc-13-post-incident-review-pir)             | Post-Incident Review (PIR)             | Lessons, CAP, retest loop.                                | [§701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)                                    |
| [BC-14](business-continuity-plan.md#bc-14-vendor-contingency-management)        | Vendor Contingency Management          | SLAs, failover, right-to-audit.                           | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) |

***

## Control Overlays (Design Overlay v2)

### BC-01 — Governance & Roles <a href="#bc-01-governance-roles" id="bc-01-governance-roles"></a>

* **WHY (Reg cite):** Board must approve/oversee continuity plans; management implements and reports. [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).
* **SYSTEM BEHAVIOR:** Maintain a living BCP/DR plan with clear owners; auto-collect training/tests; generate Board reports at least annually.
* **TRIGGERS (human → event):** Board approves policy → `(board.policy.approve)`; BCM updates plan → `(bcm.plan.update)`; Annual report due → `(bcm.report.due)`.
* **INPUTS (human → field):** Policy version `(bcm.policy.version)`; IMT roster `(imt.roster.list)`; Review cadence `(bcm.review.cadence)`.
* **OUTPUTS:** Board packet (policy, test results, metrics) `(doc.board.packet)`; signed approval `(board.approval.record)`.
* **TIMERS/SLAs:** Review **≥ annually**; IMT roster verified **quarterly**.
* **EDGE CASES:** CEO unavailable → pre-delegated acting IC (Incident Commander).
* **AUDIT LOGS:** `(audit.policy.change)`, `(audit.board.brief)`, `(audit.imt.roster.verify)`.
* **ACCESS CONTROL:** Only BCM/Compliance may modify plan; Board read-only packet.
* **ALERTS/METRICS:** Past-due reviews; IMT coverage %; training completion %.

***

### BC-02 — Risk Assessment (Hazards by Region) <a href="#bc-02-risk-assessment-hazards" id="bc-02-risk-assessment-hazards"></a>

* **WHY (Reg cite):** Records and operations must be protectable against catastrophic events; identify risks by geography. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Maintain threat register (wildfire/smoke—CA; earthquake—CA; tornado—TX; flood; grid outage; cyber; pandemic).
* **TRIGGERS:** Annual risk workshop → `(risk.assess.launch)`; new site/vendor → `(onboard.sitevendor)`.
* **INPUTS:** Hazard likelihood `(risk.hazard.p)`; impact score `(risk.hazard.impact)`; controls `(risk.controls.map)`.
* **OUTPUTS:** Heatmap `(risk.heatmap.png)`; prioritized mitigations `(risk.cap.list)`.
* **TIMERS/SLAs:** Refresh **annually** or after major change.
* **EDGE CASES:** Multi-region concurrent events → separate ICs with unified command.
* **AUDIT LOGS:** `(audit.risk.update)`.
* **ACCESS CONTROL:** BCM owns; contributors Ops/IT/HR.
* **ALERTS/METRICS:** % hazards with assigned mitigations; open CAP items.

***

### BC-03 — Business Impact Analysis (BIA) <a href="#bc-03-business-impact-analysis-bia" id="bc-03-business-impact-analysis-bia"></a>

* **WHY (Reg cite):** Identify **vital records** and functions to set RTO/RPO and recovery order. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Catalog services and rank by member impact/regulatory dependency.
* **TRIGGERS:** BIA survey issued → `(bia.survey.issue)`; product change → `(prod.change.approved)`.
* **INPUTS:** Service `(svc.name)`; Criticality rank `(svc.rank)`; RTO `(svc.rto)`; RPO `(svc.rpo)`; Dependencies `(svc.dep.list)`.
* **OUTPUTS:** BIA table; Recovery sequence; Vital records list.
* **TIMERS/SLAs:** Update **annually**; certify quarterly for changes.
* **EDGE CASES:** Conflicts → COO arbitrates using decision priorities.
* **AUDIT LOGS:** `(audit.bia.signoff)`.
* **ACCESS CONTROL:** Product owners provide data; BCM curates; Board views.
* **ALERTS/METRICS:** % services with current BIA; % with tested runbooks.

> **Illustrative BIA Ranking (Assumption—needs confirmation):**
>
> * Member Authentication/Account Access
> * Card Processing
> * Core Banking/ACH/Wires
> * Payments & Deposits
> * Lending Origination/Servicing
> * Contact Center
> * Reporting/Reg Filings

***

### BC-04 — Training, Testing & Exercises <a href="#bc-04-training-testing-exercises" id="bc-04-training-testing-exercises"></a>

* **WHY (Reg cite):** Programs must be trained, tested, and validated; include incident response practices. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Annual exercise plan (orientation, tabletop, functional); track completion; feed gaps to CAP.
* **TRIGGERS:** Exercise scheduled → `(bcm.test.schedule)`; After action meeting → `(bcm.test.debrief)`.
* **INPUTS:** Scenario `(test.scenario)`; Objectives `(test.objectives)`; Participants `(test.participants)`.
* **OUTPUTS:** Test report `(doc.test.report)`; CAP `(cap.items)`.
* **TIMERS/SLAs:** ≥1 enterprise exercise/year; report to Board ≤30 days after.
* **EDGE CASES:** Real incident substitutes for test if PIR completed.
* **AUDIT LOGS:** `(audit.training.complete)`, `(audit.exercise.run)`.
* **ACCESS CONTROL:** BCM controls plan; managers enforce attendance.
* **ALERTS/METRICS:** Training completion %; time-to-CAP close.

***

### BC-05 — Monitoring, Detection & Severity <a href="#bc-05-monitoring-detection-severity" id="bc-05-monitoring-detection-severity"></a>

* **WHY (Reg cite):** Safeguards require monitoring and prompt incident identification/response. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Central on-call with severity matrix (SEV-1 to SEV-4); weather/cyber/vendor monitors; paging.
* **TRIGGERS:** Alert triage → `(monitor.alert.triage)`; SEV assignment → `(incident.severity.set)`.
* **INPUTS:** Alert source `(alert.source)`; Impacted svc `(svc.id)`; Member impact `(impact.scope)`.
* **OUTPUTS:** Incident record; status page update; comms brief.
* **TIMERS/SLAs:** IC assigned ≤5m for SEV-1; initial comms ≤15m.
* **EDGE CASES:** Conflicting alerts → highest impact drives SEV.
* **AUDIT LOGS:** `(audit.alert.receive)`, `(audit.sev.change)`.
* **ACCESS CONTROL:** SRE/SOC triage; BCM oversight.
* **ALERTS/METRICS:** MTTA/MTTR; false positive rate.

***

### BC-06 — Incident Declaration & Initial Actions <a href="#bc-06-incident-declaration-initial-actions" id="bc-06-incident-declaration-initial-actions"></a>

* **WHY (Reg cite):** Structured incident response is required to protect member information and services. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** “First hour” checklist: safety, stabilize, scope, assign roles, notify, set cadence.
* **TRIGGERS:** IC declares incident → `(incident.declare)`; Facility threat → `(incident.declare.facility)`.
* **INPUTS:** Safety status `(safety.checklist)`; Affected regions `(geo.areas)`; Partners `(vendor.list)`.
* **OUTPUTS:** Incident channel `(chat.incident.create)`; Sitrep `(doc.sitrep.v1)`; Status page `(status.update)`.
* **TIMERS/SLAs:** Sitrep v1 ≤30m; cadence 30–60m until stabilized.
* **EDGE CASES:** Multi-tenant vendor incident → join vendor bridge; retain independence on comms.
* **AUDIT LOGS:** `(audit.ic.assign)`, `(audit.brief.send)`.
* **ACCESS CONTROL:** IC leads; deputies comms/ops/logs.
* **ALERTS/METRICS:** % incidents with complete first-hour checklist.

***

### BC-07 — Data Backup & Restore; RTO/RPO <a href="#bc-07-data-backup-restore-rto-rpo" id="bc-07-data-backup-restore-rto-rpo"></a>

* **WHY (Reg cite):** Preserve/recover **vital records**; meet RTO/RPO by service tier. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Tiered backups (critical, high, standard); immutable/offsite copies; periodic restore tests.
* **TRIGGERS:** Day-end jobs → `(ops.day_end)`; Backup failure → `(backup.job.fail)`; Quarterly restore test → `(restore.test.start)`.
* **INPUTS:** Asset `(asset.id)`; Tier `(asset.tier)`; RPO `(asset.rpo)`; Encryption `(asset.kms.key)`.
* **OUTPUTS:** Backup manifests `(backup.manifest)`; Restore report `(restore.report)`.
* **TIMERS/SLAs:** Critical RPO ≤15m; restore test each tier **quarterly**.
* **EDGE CASES:** Crypto-lock events → use clean point-in-time per RPO.
* **AUDIT LOGS:** `(audit.backup.complete)`, `(audit.restore.exercise)`.
* **ACCESS CONTROL:** Backup admins limited; dual-control for key ops.
* **ALERTS/METRICS:** Backup success rate; time-to-restore vs RTO.

***

### BC-08 — Alternate Site & Remote Operations <a href="#bc-08-alternate-site-remote-operations" id="bc-08-alternate-site-remote-operations"></a>

* **WHY (Reg cite):** Ensure operations can continue when facilities are unavailable. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Pre-approved remote posture (VPN, MFA, split DNS), hot/virtual site options, minimum staffing lists.
* **TRIGGERS:** Facility unavailable → `(facility.unavailable)`; Air quality threshold → `(env.aqi.exceed)`.
* **INPUTS:** Essential roles `(role.essential.list)`; Alt site details `(site.alt.meta)`.
* **OUTPUTS:** Remote enablement kit; site activation checklist.
* **TIMERS/SLAs:** Alt site/remote ready ≤8h; full critical ops ≤24h.
* **EDGE CASES:** Power/internet regional outage → cellular failover kits.
* **AUDIT LOGS:** `(audit.remote.enable)`, `(audit.site.activate)`.
* **ACCESS CONTROL:** IT approves access; HR verifies assignments.
* **ALERTS/METRICS:** % essential staff remote-ready; VPN capacity headroom.

***

### BC-09 — Major IT Failure Response <a href="#bc-09-major-it-failure-response" id="bc-09-major-it-failure-response"></a>

* **WHY (Reg cite):** Safeguards mandate timely containment and continuity; coordinate with service providers. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Runbook for core/cloud outages: detect, isolate blast radius, rollback/failover, communicate.
* **TRIGGERS:** SEV-1 infra alert → `(monitor.system.major_outage)`; Vendor status red → `(vendor.status.red)`.
* **INPUTS:** Affected components `(cmdb.component.list)`; Feature flags `(feat.flag.set)`; Failover endpoints `(dr.endpoint)`.
* **OUTPUTS:** Change freeze notice; rollback plan; member comm.
* **TIMERS/SLAs:** IC ≤5m; member status ≤15m; failover per BIA tier.
* **EDGE CASES:** Partial data divergence → choose authoritative ledger and reconcile.
* **AUDIT LOGS:** `(audit.change.freeze)`, `(audit.failover.exec)`.
* **ACCESS CONTROL:** SRE change authority; dual-control for rollback.
* **ALERTS/METRICS:** MTTR; % successful failovers; incident comms latency.

***

### BC-10 — Incident Response (Privacy/Security) <a href="#bc-10-incident-response-privacy-security" id="bc-10-incident-response-privacy-security"></a>

* **WHY (Reg cite):** Implement GLBA-aligned incident response, including service provider coordination and member notification where appropriate. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Contain, eradicate, recover; legal/regulatory consult; notification decisioning; forensics; evidence chain.
* **TRIGGERS:** Confirmed compromise → `(security.alert.confirmed)`; PII exposure suspected → `(privacy.exposure.suspect)`.
* **INPUTS:** Data classification `(data.class)`; Affected count `(data.subjects.n)`; Jurisdictions `(legal.juris.list)`.
* **OUTPUTS:** Regulator consult memo; member notice templates; vendor instructions.
* **TIMERS/SLAs:** Containment start ≤1h; counsel consult ≤24h; notices per law.
* **EDGE CASES:** Third-party breach without final RCA → send interim member comms.
* **AUDIT LOGS:** `(audit.ir.start)`, `(audit.notice.sent)`, `(audit.forensic.chain)`.
* **ACCESS CONTROL:** Need-to-know only; legal holds applied.
* **ALERTS/METRICS:** Time to containment; completeness of affected records.

***

### BC-11 — Communications & Notification Tree <a href="#bc-11-communications-notification-tree" id="bc-11-communications-notification-tree"></a>

* **WHY (Reg cite):** Board accountability for orderly operations and delegation includes communication plans. [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).
* **SYSTEM BEHAVIOR:** Maintain contact trees for employees, Board, regulators, vendors, media; predefined status page playbooks.
* **TRIGGERS:** Incident declared → `(incident.declare)`; Regulator outreach needed → `(reg.notify.need)`.
* **INPUTS:** Roster `(contact.roster)`; Escalation paths `(contact.escalation.map)`; Templates `(comms.tpl.set)`.
* **OUTPUTS:** Staff SMS/email; regulator notification; member status posts.
* **TIMERS/SLAs:** First internal alert ≤15m; regulator per law/policy.
* **EDGE CASES:** Comms platform failure → backup channels (SMS/phone tree).
* **AUDIT LOGS:** `(audit.page.sent)`, `(audit.reg.notify)`.
* **ACCESS CONTROL:** Comms lead manages templates; IC approves releases.
* **ALERTS/METRICS:** Delivery success; time-to-first-message.

***

### BC-12 — People Continuity & Pandemic <a href="#bc-12-people-continuity-pandemic" id="bc-12-people-continuity-pandemic"></a>

* **WHY (Reg cite):** Preparedness for people outages supports continuity. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Identify essential roles; cross-train; implement split teams/remote work; track absenteeism.
* **TRIGGERS:** Absenteeism threshold → `(hr.absenteeism.threshold)`; Public health order → `(gov.health.order)`.
* **INPUTS:** Essential roles `(hr.roles.essential)`; Cross-train map `(hr.cross.train.map)`.
* **OUTPUTS:** Shift plans; remote work posture; leave guidance links.
* **TIMERS/SLAs:** Activate plan within **24h** of trigger.
* **EDGE CASES:** Caregiver concentration risk → augment with contractors.
* **AUDIT LOGS:** `(audit.shift.activate)`.
* **ACCESS CONTROL:** HR controls PII; BCM receives aggregate stats only.
* **ALERTS/METRICS:** Essential coverage %; cross-train coverage %.

***

### BC-13 — Post-Incident Review (PIR) <a href="#bc-13-post-incident-review-pir" id="bc-13-post-incident-review-pir"></a>

* **WHY (Reg cite):** Board oversight expects effectiveness assessment and improvement loop. [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).
* **SYSTEM BEHAVIOR:** Conduct PIR with root cause, what worked/failed, corrective action plan (CAP), retest.
* **TRIGGERS:** Incident resolved → `(incident.resolve)`; Test completed → `(bcm.test.complete)`.
* **INPUTS:** Timeline `(pir.timeline)`; Impact `(pir.impact)`; Causes `(pir.rca)`; Actions `(pir.cap)`.
* **OUTPUTS:** PIR report; CAP with owners/dates; Board summary.
* **TIMERS/SLAs:** Draft PIR ≤10 business days; CAP approved ≤30 days; verify completion per due dates.
* **EDGE CASES:** Vendor RCA delayed → issue interim PIR; update upon receipt.
* **AUDIT LOGS:** `(audit.pir.issued)`, `(audit.cap.closed)`.
* **ACCESS CONTROL:** PIR read-in limited; published summary for staff learning.
* **ALERTS/METRICS:** % PIR on time; CAP closure velocity.

***

### BC-14 — Vendor Contingency Management <a href="#bc-14-vendor-contingency-management" id="bc-14-vendor-contingency-management"></a>

* **WHY (Reg cite):** Safeguards require oversight of service providers’ incident response and continuity capabilities. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Maintain vendor BCP/IR attestations, SLAs, and failover plans; define exit/failover criteria.
* **TRIGGERS:** New/renewed vendor → `(vendor.onboard)`; SLA breach → `(vendor.sla.breach)`.
* **INPUTS:** SLA `(vendor.sla)`; RTO/RPO `(vendor.rto_rpo)`; DR test evidence `(vendor.dr.evidence)`.
* **OUTPUTS:** Vendor risk profile; contingency plan; comms alignment.
* **TIMERS/SLAs:** Annual evidence refresh; failover test per tier.
* **EDGE CASES:** Shared failure modes (e.g., same cloud region) → diversify.
* **AUDIT LOGS:** `(audit.vendor.review)`, `(audit.vendor.failover.test)`.
* **ACCESS CONTROL:** Vendor risk team manages repository.
* **ALERTS/METRICS:** % critical vendors with current DR evidence; SLA breaches to PIRs.

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* First-Hour Incident Checklist (for IC): safety → severity → stabilize → roles → sitrep → cadence.
* Employee Notification Tree: up-to-date contacts; SMS/email/voice fallbacks.
* Status Page/Member Comms Templates: outage, degradation, security incident.
* Regulator Notification Template: facts, scope, actions, member impact, timelines.
* Vendor Bridge Playbook: how to join, what to ask (RCA clock, member impact, ETR).
* Restore Drill Script: select dataset; recovery steps; success criteria; timings.
* PIR Template: timeline, root cause, contributing factors, what worked, what failed, CAP.
* Training Plan Outline: roles, objectives, scenarios (wildfire, tornado, core outage, data breach, pandemic).

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{Owner, Title\}}.
* **Approvals:** \{{Approver 1, Title\}}; \{{Approver 2, Title\}}.
* **Review Cadence:** At least **annually** and after any material incident or organizational change.
* **Reporting:** BCM provides an annual BCP/DR effectiveness report to the Board, including test outcomes, PIR summaries, metrics (training %, MTTR, CAP closure), and updates to the BIA/risk register.
* **Cross-References:** See [Authority](business-continuity-plan.md#authority), [Control Index](business-continuity-plan.md#control-index), and control-specific fragments throughout this document.

***

## Assumptions & Gaps

* **Scope Placeholder:** \{{SCOPE\}} not provided; policy currently assumes full enterprise coverage (internal ops + external member-facing channels/partners). _(Assumption—needs confirmation.)_
* **Service Ranking:** BIA ranking above is illustrative; replace with \{{ORGANIZATION\}}’s inventory and dependency map. _(Assumption—needs confirmation.)_
* **Role Titles/Rosters:** Specific incident roles, on-call rotations, and contact trees must be populated from HR/IT sources. _(Assumption—needs confirmation.)_

> **Action to Caller:** Provide ORGANIZATION, SCOPE, OWNER & APPROVERS, any REFERENCE\_POLICY content, and any DESIGN\_NOTES (e.g., existing event/field codes) to finalize placeholders and integrate with engineering artifacts.
