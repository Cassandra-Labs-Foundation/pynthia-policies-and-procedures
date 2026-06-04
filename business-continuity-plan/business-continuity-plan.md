---
title: Business Continuity Plan Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Business Continuity, Disaster Recovery, Incident Response, Resilience]
---

# Business Continuity Plan Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people — including regional hazards such as wildfire and smoke in California and tornado and severe storm in Texas. The program covers internal operations and member-facing services across all channels and partners, prioritizing human safety first, then continuity of critical services within defined RTO/RPO targets, prudent recovery, and post-incident learning. It implements NCUA records-preservation and catastrophic-act preparedness requirements ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)) and GLBA-aligned safeguards and incident response under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748), under Board oversight per [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| SEV-1 incident commander assigned | SEV-1 detected or reported (`incident.sev1_detected`) | 5 minutes | IC named in incident record | [BC-05](#bc-05-monitoring-detection-severity-classification) |
| Initial internal alert / member status | SEV-1 declared (`incident.declared`) | 15 minutes | First internal alert + member status page | [BC-11](#bc-11-communications-notification-tree) |
| Sitrep v1 issued | Incident declared (`incident.declared`) | 30 minutes (then 30–60 min cadence) | First-hour checklist + Sitrep v1 | [BC-06](#bc-06-incident-declaration-first-hour-actions) |
| Containment begun (security/privacy incident) | Security incident confirmed (`incident.security_confirmed`) | 1 hour | Containment actions logged | [BC-10](#bc-10-security-privacy-incident-response) |
| Alternate-site / remote readiness | Facility or site loss declared (`facility.loss_declared`) | 8 hours (full critical ops: 24 hours) | Remote posture + minimum staffing list | [BC-08](#bc-08-alternate-site-remote-operations) |
| Legal counsel consulted (breach decisioning) | Security incident confirmed (`incident.security_confirmed`) | 24 hours | Notification decision memo | [BC-10](#bc-10-security-privacy-incident-response) |
| Staffing continuity plan activated | Absenteeism ≥30% or public-health trigger (`workforce.absenteeism_threshold`) | 24 hours | Split-team / remote staffing plan | [BC-12](#bc-12-people-continuity-pandemic) |
| Critical-tier data restored | Restore initiated for crypto-lock or data loss (`restore.initiated`) | Per BIA RTO; critical RPO ≤ 15 minutes | Clean point-in-time restore evidence | [BC-07](#bc-07-data-backup-restore) |
| PIR drafted | Incident closed (`incident.closed`) | 10 business days | PIR with root cause + what worked/failed | [BC-13](#bc-13-post-incident-review-corrective-action) |
| Corrective action plan approved | PIR drafted (`pir.drafted`) | 30 days | CAP with owners, dates, retest plan | [BC-13](#bc-13-post-incident-review-corrective-action) |
| Exercise results to Board | Enterprise exercise completed (`exercise.completed`) | 30 days | Exercise report + gap list | [BC-04](#bc-04-training-testing-exercises) |
| Backup restore test (each tier) | Quarterly schedule fires (`backup.restore_test_due`) | Quarterly | Restore-test evidence per tier | [BC-07](#bc-07-data-backup-restore) |
| IMT roster verification | Quarterly schedule fires (`imt.roster_review_due`) | Quarterly | Verified roster + contact tree | [BC-01](#bc-01-governance-roles) |
| BIA certification | Quarterly schedule fires (`bia.certification_due`) | Quarterly (full update annually) | Certified service catalog + RTO/RPO | [BC-03](#bc-03-business-impact-analysis-rto-rpo) |
| Plan review & Board approval | Annual schedule fires (`bcp.annual_review_due`) | Annually | Approved BCP/DR plan | [BC-01](#bc-01-governance-roles) |
| Threat register refresh | Annual schedule or major change (`threat_register.refresh_due`) | Annually or after major change | Scored regional threat register | [BC-02](#bc-02-regional-hazard-risk-assessment) |
| Vendor BCP/DR evidence refresh | Annual schedule fires (`vendor.bcp_evidence_due`) | Annually | Attestations, SLAs, DR test evidence | [BC-14](#bc-14-vendor-contingency-management) |

## BC-01 — Governance & Roles {#bc-01-governance-roles}

**WHY (Reg cite):** [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) makes the Board responsible for the general direction and control of the credit union, including approval and oversight of preparedness programs; [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) directs credit unions to maintain a program for responding to a catastrophic act with defined responsibilities.

**SYSTEM BEHAVIOR:** The Board approves the BCP/DR program and this policy at least annually and receives continuity reporting; management maintains a living BCP/DR plan with a named owner for every plan section and a standing Incident Management Team (IMT) with primary and alternate role-holders (Incident Commander pool, Operations, IT/SRE, Communications, HR, Vendor Risk, Compliance/Legal liaison). The Business Continuity Manager (BCM) verifies the IMT roster and contact details quarterly and triggers an off-cycle review after any material organizational, facility, system, or vendor change. Plan edits are write-restricted to the BCM and the Chief Compliance Officer; the Board approval record is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review window opens (`bcp.annual_review_due`) | Current plan version (`bcp.plan_version`), open CAP items (`cap.items[]`), prior exercise results (`exercise.results[]`) | Board-approved plan + approval minute (`bcp.board_approved`) | Annually (internal: approval before plan anniversary; enforced by `bcp.annual_review_due`) |
| Quarterly roster check fires (`imt.roster_review_due`) | IMT roster (`imt.roster[]`), contact details (`imt.contacts[]`), HR separations feed (`hr.separations[]`) | Verified roster + change log (`imt.roster_verified`) | Quarterly (internal: 10 BD to close; enforced by `imt.roster_review_due`) |
| Material change occurs — reorg, new site, new core vendor (`org.material_change`) | Change description (`change.summary`), affected plan sections (`bcp.sections_affected[]`) | Updated plan sections (`bcp.section_updated`) | 30 days from change (internal: 30 days) |

**ALERTS/METRICS:** Days since last Board approval (alert at 11 months); quarterly roster-verification completion rate (target 100%); count of plan sections without a named living owner (target zero).

## BC-02 — Regional Hazard Risk Assessment {#bc-02-regional-hazard-risk-assessment}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires assessment of reasonably foreseeable internal and external threats; [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) frames preparedness for catastrophic acts including natural disasters.

**SYSTEM BEHAVIOR:** The BCM maintains a threat register scoring each hazard by likelihood and impact, segmented by geography — at minimum wildfire/smoke (CA), earthquake, tornado/severe storm (TX), flood, grid outage, cyber, and pandemic — and maps each scored hazard to the controls and recovery strategies in this policy. The register is refreshed annually and after any major change such as a new facility, region, or material vendor; scores feed the BIA ([BC-03](#bc-03-business-impact-analysis-rto-rpo)) and exercise scenario selection ([BC-04](#bc-04-training-testing-exercises)). The threat register is write-restricted to the BCM with Compliance review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual refresh fires or major change occurs (`threat_register.refresh_due`) | Hazard list by region (`threat.hazards[]`), likelihood/impact scores (`threat.likelihood`, `threat.impact`), facility/region inventory (`facility.inventory[]`) | Updated scored register (`threat_register.updated`) | Annually or 30 days after major change (enforced by `threat_register.refresh_due`) |
| External monitor signals a rising regional hazard (`hazard.watch_raised`) | Monitor feed detail (`hazard.feed_detail`), affected sites (`facility.affected[]`) | Interim score adjustment + readiness note (`threat_register.interim_update`) | 5 BD (internal: 5 BD) |

**ALERTS/METRICS:** Register age in months (alert at 11); count of hazards without a mapped control or recovery strategy (target zero); interim updates raised per quarter from monitor feeds.

## BC-03 — Business Impact Analysis & RTO/RPO {#bc-03-business-impact-analysis-rto-rpo}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires a vital records preservation program identifying records needed to resume operations ([§749.1](https://www.ecfr.gov/current/title-12/part-749/section-749.1), [Appendix A](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20A%20to%20Part%20749)); [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires assessing the sensitivity and criticality of member information systems.

**SYSTEM BEHAVIOR:** The BCM maintains a Business Impact Analysis cataloging every service, ranked by member impact and regulatory dependency, identifying vital records for each, and assigning an RTO, RPO, and recovery-sequence tier that drives failover order in [BC-09](#bc-09-major-it-failure-response) and restore priority in [BC-07](#bc-07-data-backup-restore). The BIA is fully updated annually and certified quarterly by service owners for changes; a service added or materially changed mid-cycle gets a provisional tier within 10 business days rather than waiting for the annual update. The BIA record is write-restricted to the BCM; tier assignments require Compliance concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BIA update fires (`bia.annual_update_due`) | Service catalog (`bia.services[]`), member-impact ranking (`bia.member_impact`), regulatory dependency flags (`bia.reg_dependency`), vital records list (`bia.vital_records[]`) | Updated BIA with RTO/RPO and sequence (`bia.updated`) | Annually (enforced by `bia.annual_update_due`) |
| Quarterly certification fires (`bia.certification_due`) | Service-owner attestations (`bia.owner_attestations[]`), change list since last cert (`bia.changes[]`) | Certified BIA + exceptions list (`bia.certified`) | Quarterly (internal: 15 BD to close; enforced by `bia.certification_due`) |
| New or materially changed service goes live (`service.launched`) | Service description (`service.summary`), dependencies (`service.dependencies[]`) | Provisional tier + RTO/RPO assignment (`bia.provisional_tier_assigned`) | 10 BD (internal: 10 BD) |

**ALERTS/METRICS:** Percentage of services with current RTO/RPO assignments (target 100%); quarterly certification completion rate; count of services running without a tier (target zero).

## BC-04 — Training, Testing & Exercises {#bc-04-training-testing-exercises}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires training staff and regularly testing key controls, systems, and procedures; [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) expects periodic testing of catastrophic-act response programs.

**SYSTEM BEHAVIOR:** The BCM runs at least one enterprise exercise per year, rotating format across orientation, tabletop, and functional exercises, with scenarios drawn from the highest-scored regional hazards in [BC-02](#bc-02-regional-hazard-risk-assessment). Staff continuity training completion is tracked by role; identified gaps feed the corrective action plan tracked under [BC-13](#bc-13-post-incident-review-corrective-action); exercise results are reported to the Board within 30 days. A real incident with a completed PIR may substitute for the functional exercise for the capabilities it actually exercised, at the CCO's documented discretion. Exercise records and the training ledger are write-restricted to the BCM.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual exercise scheduled (`exercise.scheduled`) | Scenario from threat register (`threat.hazards[]`), participant roster (`imt.roster[]`), success criteria (`exercise.criteria[]`) | Completed exercise + findings (`exercise.completed`) | Annually (internal: at least one enterprise exercise per calendar year) |
| Exercise completed (`exercise.completed`) | Findings (`exercise.findings[]`), gap list (`exercise.gaps[]`) | Board report + CAP entries (`exercise.board_reported`, `cap.item_created`) | 30 days (internal: 20 BD; enforced by `exercise.board_report_due`) |
| Training cycle assigned (`training.assigned`) | Role-based curriculum (`training.curriculum`), assignee list (`training.assignees[]`) | Completion ledger entry (`training.completed`) | 90 days from assignment (internal: 90 days) |

**ALERTS/METRICS:** Exercises completed per year (target ≥1 enterprise); training completion rate by role (alert below 95%); count of exercise gaps without a CAP entry (target zero); Board-report latency in days.

## BC-05 — Monitoring, Detection & Severity Classification {#bc-05-monitoring-detection-severity-classification}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires systems to detect actual and attempted attacks on or intrusions into member information systems and procedures to respond when detected.

**SYSTEM BEHAVIOR:** Pynthia operates a central on-call function with a SEV-1 (critical member-facing outage or active security event) through SEV-4 (minor, no member impact) severity matrix, fed by weather, cyber, and vendor-status monitors. Any detection or report is classified within the matrix; for SEV-1, an Incident Commander is assigned within 5 minutes and initial communications are issued within 15 minutes via [BC-11](#bc-11-communications-notification-tree). A SEV downgrade or upgrade requires the IC's documented rationale; ambiguous events default to the higher severity until scoped. Severity-matrix definitions are write-restricted to the BCM and IT/SRE leadership.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitor or report signals a potential incident (`incident.signal_received`) | Signal source (`monitor.source`), affected service (`bia.services[]`), initial scope (`incident.scope_initial`) | Severity classification (`incident.severity_assigned`) | 10 minutes from signal (internal: 10 min) |
| SEV-1 classified (`incident.sev1_detected`) | On-call IC rotation (`oncall.ic_rotation`), IMT roster (`imt.roster[]`) | IC assignment record (`incident.ic_assigned`) | 5 minutes (enforced by `incident.ic_assignment_timer`) |
| SEV-1 IC assigned (`incident.ic_assigned`) | Comms templates (`comms.templates[]`), status-page playbook (`comms.statuspage_playbook`) | Initial comms issued (`comms.initial_issued`) | 15 minutes from detection (enforced by `comms.initial_timer`) |

**ALERTS/METRICS:** IC-assignment latency distribution for SEV-1 (target ≤5 min, alert on any breach); initial-comms latency (target ≤15 min); monitor coverage of BIA critical services (target 100%); misclassification rate found in PIRs.

## BC-06 — Incident Declaration & First-Hour Actions {#bc-06-incident-declaration-first-hour-actions}

**WHY (Reg cite):** [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) directs credit unions to maintain a response program for catastrophic acts; [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires response programs that contain and control incidents.

**SYSTEM BEHAVIOR:** On declaration, the IC executes the "first hour" checklist in order: confirm human safety, stabilize the immediate situation, scope the impact against the BIA, assign IMT roles, notify per the contact tree, and set the situation-report cadence. Sitrep v1 is produced within 30 minutes of declaration and the IC maintains a 30–60 minute Sitrep cadence until the incident is stabilized, at which point cadence may extend with documented rationale. Declaration authority rests with the IC pool, the CCO, and IT/SRE leadership; the incident record is append-only and write-restricted to the IMT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared (`incident.declared`) | First-hour checklist (`incident.checklist_first_hour`), BIA tiers (`bia.services[]`), contact tree (`comms.contact_tree`) | Checklist execution record (`incident.first_hour_completed`) | 60 minutes (internal: 60 min) |
| Declaration logged (`incident.declared`) | Scope assessment (`incident.scope_initial`), role assignments (`incident.roles[]`) | Sitrep v1 (`sitrep.issued`) | 30 minutes (enforced by `sitrep.v1_timer`) |
| Sitrep issued and incident not yet stable (`sitrep.issued`) | Latest status (`incident.status`), open actions (`incident.actions[]`) | Next Sitrep (`sitrep.issued`) | 30–60 minutes rolling until stabilized (enforced by `sitrep.cadence_timer`) |

**ALERTS/METRICS:** Sitrep v1 latency (target ≤30 min); cadence adherence rate during active incidents (target 100%); first-hour checklist completion rate (target 100%).

## BC-07 — Data Backup & Restore {#bc-07-data-backup-restore}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires preservation of vital records, with [Appendix A](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20A%20to%20Part%20749) addressing storage of duplicate vital records at a separate location; [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires measures to protect against destruction, loss, or damage of member information.

**SYSTEM BEHAVIOR:** IT/SRE maintains tiered backups aligned to BIA tiers, with immutable and offsite/geo-separated copies for vital records and member data; the critical tier carries RPO ≤ 15 minutes. Each tier undergoes a quarterly restore test with timed evidence retained; for crypto-lock (ransomware) events, recovery uses a clean point-in-time restore validated as pre-compromise before reconnection — never restoration over live compromised systems. Backup configuration changes require dual control between IT/SRE and the BCM; deletion of immutable copies is technically blocked during the retention window.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Backup cycle runs per tier (`backup.cycle_completed`) | Tier definition (`bia.services[]`), backup target config (`backup.tier_config`) | Backup completion + integrity check (`backup.verified`) | Continuous; critical-tier RPO ≤ 15 minutes (enforced by `backup.rpo_monitor`) |
| Quarterly restore test fires (`backup.restore_test_due`) | Tier sample (`backup.tier_config`), test environment (`restore.test_env`) | Timed restore-test evidence (`restore.test_completed`) | Quarterly per tier (internal: evidence filed within 5 BD; enforced by `backup.restore_test_due`) |
| Restore needed in an incident (`restore.initiated`) | Validated clean restore point (`restore.point_validated`), BIA restore sequence (`bia.services[]`) | Completed restore + verification (`restore.completed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |

**ALERTS/METRICS:** Measured RPO per tier vs. target (alert on any critical-tier reading >15 min); restore-test pass rate (target 100%); restore-test age per tier (alert at >1 quarter); backup integrity-check failure count (target zero).

## BC-08 — Alternate Site & Remote Operations {#bc-08-alternate-site-remote-operations}

**WHY (Reg cite):** [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) directs preparedness to continue operations after a catastrophic act, including alternative operating capabilities; [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls on member information systems, which extend to remote operating postures.

**SYSTEM BEHAVIOR:** Pynthia maintains a pre-approved remote operating posture (VPN with MFA for all remote access to member-information systems), hot/virtual alternate-site options for critical functions, and minimum staffing lists per BIA tier. On a declared facility or regional loss, alternate-site or remote readiness is achieved within 8 hours and full critical operations within 24 hours, in BIA sequence. Capacity for the remote posture is validated during the annual exercise ([BC-04](#bc-04-training-testing-exercises)); if a regional event impairs both primary and alternate options, the IC escalates to the CCO for out-of-region activation. Remote-access entitlements are write-restricted to IT/SRE with Compliance review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Facility or site loss declared (`facility.loss_declared`) | Minimum staffing list (`staffing.minimum_list[]`), alternate-site inventory (`site.alternates[]`), remote-access config (`access.remote_config`) | Alternate/remote readiness confirmation (`site.readiness_confirmed`) | 8 hours (enforced by `site.readiness_timer`) |
| Readiness confirmed (`site.readiness_confirmed`) | BIA recovery sequence (`bia.services[]`), staffing assignments (`staffing.assignments[]`) | Full critical operations resumed (`ops.critical_resumed`) | 24 hours from declaration (enforced by `ops.resumption_timer`) |
| Annual capacity validation fires (`site.capacity_test_due`) | Concurrent-user targets (`access.capacity_targets`), exercise scenario (`exercise.criteria[]`) | Capacity test evidence (`site.capacity_validated`) | Annually (enforced by `site.capacity_test_due`) |

**ALERTS/METRICS:** Time-to-readiness in incidents and exercises (target ≤8 h); time-to-full-critical-ops (target ≤24 h); remote-access capacity headroom vs. minimum staffing list (alert below 120%); MFA coverage on remote access (target 100%).

## BC-09 — Major IT Failure Response {#bc-09-major-it-failure-response}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires response programs and measures to protect member information systems against failures and unauthorized changes; [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) covers restoring critical functions disrupted by a catastrophic event.

**SYSTEM BEHAVIOR:** IT/SRE maintains a runbook for core and cloud outages covering detection, isolating the blast radius, rollback or failover, and member communication. On a major IT failure, an IC is assigned within 5 minutes and a member status update is issued within 15 minutes per [BC-05](#bc-05-monitoring-detection-severity-classification) and [BC-11](#bc-11-communications-notification-tree); failover proceeds in BIA tier order. Production rollback and failover execution require dual control — two authorized IT/SRE engineers, with the IC's approval logged; a vendor-side outage additionally activates [BC-14](#bc-14-vendor-contingency-management) escalation paths. The runbook is write-restricted to IT/SRE leadership with BCM review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Major IT failure detected (`it.major_failure_detected`) | Runbook (`it.outage_runbook`), service dependency map (`service.dependencies[]`), blast-radius assessment (`incident.scope_initial`) | Isolation actions logged (`it.blast_radius_isolated`) | 60 minutes (internal: 60 min) |
| Failover decision made (`it.failover_decided`) | BIA tier order (`bia.services[]`), dual-control approvers (`it.dual_control_approvers[]`) | Failover/rollback executed (`it.failover_executed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |
| Failure detected and members affected (`it.major_failure_detected`) | Status-page playbook (`comms.statuspage_playbook`), impact summary (`incident.scope_initial`) | Member status update (`comms.member_status_issued`) | 15 minutes (enforced by `comms.initial_timer`) |

**ALERTS/METRICS:** Failover execution time vs. BIA RTO per tier; dual-control compliance on rollbacks (target 100%); member-status latency (target ≤15 min); recurrence rate of the same root cause across incidents.

## BC-10 — Security & Privacy Incident Response {#bc-10-security-privacy-incident-response}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires GLBA-aligned safeguards including response programs; [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) provides response-program guidance for unauthorized access to member information, including containment, investigation, and member notice; [12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1) requires reporting reportable cyber incidents to NCUA within 72 hours.

**SYSTEM BEHAVIOR:** For confirmed security or privacy incidents, the IMT executes containment, eradication, recovery, forensic evidence preservation, and notification decisioning, coordinating with affected service providers. Containment begins within 1 hour of confirmation; legal counsel is consulted within 24 hours to drive notification decisions under applicable breach law, and a reportable cyber incident is reported to NCUA within 72 hours per §748.1(c). Forensic images are captured before eradication wherever containment permits; recovery for crypto-lock events follows the clean-restore rule in [BC-07](#bc-07-data-backup-restore). Detailed cyber runbooks and member breach-notification content live in the Information Security and Privacy Policies respectively; this control governs the continuity-side sequencing. The incident evidence store is append-only and access-restricted to the IMT, Compliance, and counsel.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security incident confirmed (`incident.security_confirmed`) | Affected systems (`incident.systems_affected[]`), containment options (`it.containment_options[]`) | Containment actions begun (`incident.containment_started`) | 1 hour (enforced by `incident.containment_timer`) |
| Containment started (`incident.containment_started`) | Incident facts (`incident.facts`), data classes involved (`incident.data_classes[]`) | Counsel consultation + notification decision memo (`legal.consulted`, `notification.decision_recorded`) | 24 hours (enforced by `legal.consult_timer`) |
| Incident assessed as reportable cyber incident (`incident.reportable_determined`) | Incident summary (`incident.facts`), NCUA reporting channel (`regulator.contact`) | NCUA report filed (`regulator.ncua_notified`) | 72 hours per §748.1(c) (enforced by `regulator.report_timer`) |
| Containment achieved (`incident.contained`) | Forensic images (`forensics.images[]`), clean restore points (`restore.point_validated`) | Eradication + recovery completion (`incident.recovered`) | Per BIA tier RTO (internal: tracked in Sitreps) |

**ALERTS/METRICS:** Containment-start latency (target ≤1 h); counsel-consult latency (target ≤24 h); NCUA 72-hour report compliance (target 100%); incidents with forensic evidence preserved before eradication (target 100% where feasible).

## BC-11 — Communications & Notification Tree {#bc-11-communications-notification-tree}

**WHY (Reg cite):** [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) requires notifying the appropriate NCUA Regional Director and, where warranted, members as part of a response program; [12 CFR §748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1) sets regulator reporting duties including catastrophic-act reporting under §748.1(b).

**SYSTEM BEHAVIOR:** The BCM maintains contact trees for employees, Board, regulators, vendors, and media, plus predefined status-page playbooks for member-facing updates. In an incident the first internal alert goes out within 15 minutes of declaration; regulator notifications follow law and this policy (catastrophic-act report under §748.1(b), cyber report per [BC-10](#bc-10-security-privacy-incident-response)); media statements are issued only by the CEO or designee. If primary communications platforms are themselves impaired, the IMT shifts to the documented backup channels (SMS broadcast, out-of-band conference bridge) without waiting for platform recovery. Contact trees are write-restricted to the BCM; the regulator contact list is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared (`incident.declared`) | Employee/Board tree (`comms.contact_tree`), alert template (`comms.templates[]`) | First internal alert (`comms.internal_alert_issued`) | 15 minutes (enforced by `comms.initial_timer`) |
| Member impact confirmed (`incident.member_impact_confirmed`) | Status-page playbook (`comms.statuspage_playbook`), approved language (`comms.templates[]`) | Status-page update (`comms.member_status_issued`) | 15 minutes from confirmation (internal: 15 min) |
| Regulator notification criteria met (`regulator.notice_criteria_met`) | Regulator contact list (`regulator.contact`), incident summary (`incident.facts`) | Regulator notice (`regulator.notified`) | Per applicable rule — catastrophic-act report per §748.1(b); cyber 72 h per §748.1(c) (enforced by `regulator.report_timer`) |
| Primary comms platform down (`comms.platform_failed`) | Backup channel config (`comms.backup_channels[]`), tree (`comms.contact_tree`) | Backup-channel activation (`comms.backup_activated`) | 30 minutes (internal: 30 min) |

**ALERTS/METRICS:** First-alert latency (target ≤15 min); contact-tree verification age (alert at >1 quarter, tied to [BC-01](#bc-01-governance-roles) roster checks); backup-channel test success rate in exercises (target 100%); regulator-notice timeliness (target 100%).

## BC-12 — People Continuity & Pandemic {#bc-12-people-continuity-pandemic}

**WHY (Reg cite):** [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) directs preparedness programs for catastrophic events, which NCUA applies to events disrupting staff availability including pandemics; [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) holds the Board accountable for ensuring the credit union is administered by competent personnel under all conditions.

**SYSTEM BEHAVIOR:** HR and the BCM identify essential roles per BIA tier, maintain cross-training so each essential role has at least one qualified backup, and pre-plan split-team and remote-work configurations. Staffing continuity plans activate within 24 hours of an absenteeism trigger (≥30% of essential-role staff unavailable) or a declared public-health trigger; activation uses the pre-approved remote posture in [BC-08](#bc-08-alternate-site-remote-operations). Sustained events trigger weekly staffing reviews until the trigger clears. The essential-roles list and cross-training matrix are write-restricted to HR with BCM concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Absenteeism ≥30% or public-health trigger fires (`workforce.absenteeism_threshold`) | Essential-roles list (`staffing.essential_roles[]`), cross-training matrix (`staffing.cross_training[]`), split-team plan (`staffing.split_team_plan`) | Staffing plan activation (`staffing.plan_activated`) | 24 hours (enforced by `staffing.activation_timer`) |
| Plan active and event ongoing (`staffing.plan_activated`) | Current availability (`workforce.availability`), service coverage (`bia.services[]`) | Weekly staffing review (`staffing.review_completed`) | Weekly until trigger clears (enforced by `staffing.review_timer`) |
| Annual readiness check fires (`staffing.readiness_review_due`) | Essential-roles list (`staffing.essential_roles[]`), backup coverage (`staffing.cross_training[]`) | Coverage attestation + gap list (`staffing.coverage_attested`) | Annually (enforced by `staffing.readiness_review_due`) |

**ALERTS/METRICS:** Essential roles without a qualified backup (target zero); staffing-plan activation latency vs. 24-hour target; absenteeism trend monitoring against the 30% trigger during watch periods.

## BC-13 — Post-Incident Review & Corrective Action {#bc-13-post-incident-review-corrective-action}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires monitoring, evaluating, and adjusting the program in light of testing results, incidents, and changes in threats and business arrangements.

**SYSTEM BEHAVIOR:** After every declared incident (and any SEV-2+ near-miss at the CCO's discretion), the IMT conducts a blameless Post-Incident Review covering root cause, what worked, what failed, and timeline-vs-SLA performance. The PIR is drafted within 10 business days of incident closure; the corrective action plan with named owners and dates is approved within 30 days, and each completed corrective action is verified by retest (in the next exercise or a targeted test) before closure. PIR findings feed the threat register ([BC-02](#bc-02-regional-hazard-risk-assessment)) and plan updates ([BC-01](#bc-01-governance-roles)). PIR and CAP records are write-restricted to the BCM and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident closed (`incident.closed`) | Incident record + Sitreps (`sitrep.issued`), timeline (`incident.timeline`), participant input (`pir.interviews[]`) | Draft PIR (`pir.drafted`) | 10 BD (enforced by `pir.draft_timer`) |
| PIR drafted (`pir.drafted`) | Findings (`pir.findings[]`), proposed actions (`cap.items[]`) | Approved CAP with owners and dates (`cap.approved`) | 30 days (enforced by `cap.approval_timer`) |
| CAP item completed (`cap.item_completed`) | Retest plan (`cap.retest_plan`), exercise or targeted test slot (`exercise.scheduled`) | Retest verification (`cap.retest_verified`) | Next scheduled exercise or 90 days, whichever first (internal: 90 days) |

**ALERTS/METRICS:** PIR draft latency (target ≤10 BD); CAP approval latency (target ≤30 days); CAP items overdue (target zero); percentage of closed CAP items with retest verification (target 100%).

## BC-14 — Vendor Contingency Management {#bc-14-vendor-contingency-management}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires overseeing service-provider arrangements, including requiring providers by contract to implement appropriate measures and monitoring them; [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) extends vital-records preservation duties to records held by service providers.

**SYSTEM BEHAVIOR:** Vendor Risk maintains, for each critical vendor, current BCP/IR attestations, contractual SLAs, vendor RTO/RPO commitments mapped against Pynthia's BIA tiers, and the vendor's most recent DR-test evidence; evidence is refreshed annually. Exit and failover criteria are defined per critical vendor before reliance begins, and concentration against shared failure modes (same cloud region, same processor, same telecom) is assessed and diversified where practical. A vendor RTO/RPO weaker than the dependent service's BIA target is escalated to the CCO as an accepted-risk decision or remediation item. General vendor onboarding and due diligence remain under the Third-Party Risk Policy. The vendor contingency register is write-restricted to Vendor Risk with BCM review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual evidence refresh fires (`vendor.bcp_evidence_due`) | Vendor list by criticality (`vendor.critical_list[]`), attestation requests (`vendor.attestation_request`) | Updated attestations, SLAs, DR evidence (`vendor.evidence_refreshed`) | Annually (internal: 60 days to close; enforced by `vendor.bcp_evidence_due`) |
| New critical vendor onboarded (`vendor.critical_onboarded`) | Vendor RTO/RPO (`vendor.rto_rpo`), dependent service tiers (`bia.services[]`) | Exit/failover criteria + tier-gap assessment (`vendor.failover_criteria_set`) | Before production reliance (internal: pre-go-live gate) |
| Vendor outage or failure signal (`vendor.outage_detected`) | Failover criteria (`vendor.failover_criteria`), vendor status feed (`monitor.source`) | Failover decision + escalation (`vendor.failover_decided`) | Per dependent service BIA RTO (enforced by `restore.rto_timer`) |
| Concentration review fires (`vendor.concentration_review_due`) | Shared-failure-mode map (`vendor.shared_modes[]`), vendor list (`vendor.critical_list[]`) | Concentration assessment + diversification actions (`vendor.concentration_assessed`) | Annually (enforced by `vendor.concentration_review_due`) |

**ALERTS/METRICS:** Critical vendors with current (≤12 months) BCP/DR evidence (target 100%); vendors whose RTO/RPO is weaker than the dependent BIA tier (target zero unaccepted); shared-failure-mode concentrations above threshold; vendor-outage failover decision latency vs. BIA RTO.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, the BCP/DR plan, and continuity reporting to the Board.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The Board of Directors approves the BCP/DR program annually per [BC-01](#bc-01-governance-roles).
- **Required participants:** Business Continuity Manager, Incident Management Team, IT/SRE, HR, Vendor Risk, Board of Directors.
- **Review cadence:** Full policy and plan review at least annually and after any incident whose PIR recommends changes; IMT roster quarterly; BIA certification quarterly; threat register annually or after major change.
- **Cross-references:** Detailed cyber runbooks and security control design — Information Security Policy. Vendor onboarding, due diligence, and ongoing oversight — Third-Party Risk Policy. Member breach-notification privacy obligations — Privacy Policy. Records retention schedules outside continuity — Record Retention Policy. Enterprise risk taxonomy and aggregation — Enterprise Risk Management Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The continuity, incident, backup, staffing, communications, and vendor event/field/timer codes used throughout the EVENTS tables (e.g., `incident.declared`, `sitrep.issued`, `backup.rpo_monitor`, `staffing.activation_timer`, `vendor.evidence_refreshed`) are not registered in `vocabulary.json` — the parsed spec is banking-core only and defines zero events. All codes here use the target naming scheme and will be confirmed and registered by engineering before the next review.
- **Severity matrix definitions are assumed.** PATRICK_NOTES specify a SEV-1–SEV-4 range but not the boundary definitions; this policy assumes SEV-1 = critical member-facing outage or active security event and SEV-4 = minor/no member impact. The detailed matrix needs CCO sign-off.
- **The 30% absenteeism trigger is assumed to apply to essential-role staff** rather than total headcount; this interpretation needs HR and CCO confirmation.
- **Real-incident substitution for the annual functional exercise** is assumed permissible at the CCO's documented discretion; PATRICK_NOTES were silent on substitution.
- **Backup tier boundaries beyond the critical tier (RPO ≤ 15 minutes)** are not defined in PATRICK_NOTES; tier-2+ RPO/RTO values will be set in the BIA and need certification at the next quarterly cycle.
- **Out-of-region alternate-site arrangements** are assumed to exist or be procurable for events that impair both primary and in-region alternate facilities; current contractual coverage needs verification by Vendor Risk.
- **FFIEC Business Continuity Management Booklet** informs the program's design as supervisory guidance but is not a binding citation; this policy cites only the binding NCUA regulations (Parts 748, 749, and §701.4) and implements compatible controls.
- **NCUA catastrophic-act reporting under §748.1(b) and cyber-incident reporting under §748.1(c)** are treated as the governing regulator-notice deadlines; any state-level breach-notice timing is decisioned with counsel per [BC-10](#bc-10-security-privacy-incident-response) and detailed in the Privacy Policy.
- **Reference-policy content (legacy bank policy and Sound Community Bank plan)** was used only for structural ideas (declaration authority, activation criteria, maintenance cadence); personnel names, bank-specific roles (EVP/CFO), and deposit-operations emphasis were intentionally not carried over because they do not match Pynthia's credit-union charter and IMT structure.
