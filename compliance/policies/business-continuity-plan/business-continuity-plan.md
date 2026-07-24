```yaml
---
title: Business Continuity Plan Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Business Continuity, Disaster Recovery, Incident Management, BCP, DR]
---
```

# Business Continuity Plan Policy

## General Policy Statement

Pynthia Credit Union maintains a Board-approved, risk-based Business Continuity and Disaster Recovery (BCP/DR) program designed to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people across all operational locations (California, South Carolina, Texas, and Porto, Portugal) and all member-facing digital channels. The program prioritizes human safety first, then continuity of critical member services—with electronic payment channels (ACH, wire, debit/ATM, mobile/RDC, Zelle) treated as highest-priority—followed by prudent recovery within defined RTO/RPO targets and systematic post-incident learning. The program aligns with [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation), [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) (GLBA-aligned safeguards and incident response), and [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) (Board oversight), and is informed by FFIEC Business Continuity Management guidance.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual BCP/DR plan review | Calendar year-end or material change → `bcp.annual_review_due` | Annually | Board-approved plan document | [BC-01](#bc-01-governance-and-roles) |
| IMT roster verification | Quarterly calendar trigger → `imt.roster_review_due` | Quarterly | Named IMT roster | [BC-01](#bc-01-governance-and-roles) |
| Threat register refresh | Annual calendar or major change → `threat_register.refresh_due` | Annually or after major change | Threat register by geography | [BC-02](#bc-02-risk-assessment-hazards-by-region) |
| BIA annual update | Annual calendar trigger → `bia.annual_update_due` | Annually | BIA document with RTO/RPO | [BC-03](#bc-03-business-impact-analysis) |
| BIA quarterly certification | Quarterly calendar trigger → `bia.certification_due` | Quarterly | BIA change certification | [BC-03](#bc-03-business-impact-analysis) |
| Annual enterprise exercise | Annual calendar trigger → `dr.exercise_due` | Annually (≥ 1 exercise) | Exercise report | [BC-04](#bc-04-training-testing-and-exercises) |
| Exercise results to Board | Exercise completion → `exercise.completed` | 30 days post-exercise | Board exercise report | [BC-04](#bc-04-training-testing-and-exercises) |
| SEV-1 Incident Commander assignment | SEV-1 detected → `incident.sev1.detected` | 5 minutes | IC assignment log | [BC-05](#bc-05-monitoring-detection-and-severity) |
| SEV-1 initial communications | IC assigned → `incident.ic.assigned` | 15 minutes | Initial comms artifact | [BC-05](#bc-05-monitoring-detection-and-severity) |
| Sitrep v1 | Incident declared → `incident.declared` | 30 minutes | Sitrep v1 document | [BC-06](#bc-06-incident-declaration-and-initial-actions) |
| Sitrep cadence | Sitrep v1 issued → `sitrep.issued` | Every 30–60 minutes until stabilized | Sitrep updates | [BC-06](#bc-06-incident-declaration-and-initial-actions) |
| Backup restore test (per tier) | Quarterly calendar trigger → `backup.restore_test_due` | Quarterly per tier | Restore test results | [BC-07](#bc-07-data-backup-restore-and-rtorpo) |
| Alternate site / remote readiness | Facility loss declared → `facility.loss.declared` | 8 hours | Readiness confirmation | [BC-08](#bc-08-alternate-site-and-remote-operations) |
| Full critical ops at alternate site | Alternate site activated → `site.readiness.confirmed` | 24 hours | Critical ops status | [BC-08](#bc-08-alternate-site-and-remote-operations) |
| IT IC assignment (major failure) | Major IT failure detected → `it.major_failure.detected` | 5 minutes | IC assignment log | [BC-09](#bc-09-major-it-failure-response) |
| Member status communication (IT) | IT IC assigned → `incident.ic.assigned` | 15 minutes | Member status notice | [BC-09](#bc-09-major-it-failure-response) |
| Incident containment (privacy/security) | Security incident created → `incident.created` | 1 hour | Containment record | [BC-15](#bc-15-security-privacy-incident-containment-legal-consult-vendor-coordination) |
| Legal counsel consultation | Containment started → `incident.containment.started` | 24 hours | Legal consult log | [BC-15](#bc-15-security-privacy-incident-containment-legal-consult-vendor-coordination) |
| First internal alert | Incident declared → `incident.declared` | 15 minutes | Internal alert artifact | [BC-11](#bc-11-communications-and-notification-tree) |
| Regulator notification | Reportable incident determined → `incident.reportability_determination` | 72 hours of determination | NCUA notice | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Staffing plan activation (people event) | Absenteeism ≥ 30% or public-health trigger → `staffing.plan.activated` | 24 hours | Staffing activation record | [BC-12](#bc-12-people-continuity-and-pandemic) |
| PIR draft | Incident closed → `incident.closed` | 10 business days | PIR draft document | [BC-13](#bc-13-post-incident-review) |
| CAP approval | PIR drafted → `pir.drafted` | 30 days | Approved CAP | [BC-13](#bc-13-post-incident-review) |
| Vendor BCP/IR evidence refresh | Annual calendar trigger → `vendor.bcp_evidence_due` | Annually | Vendor attestation package | [BC-14](#bc-14-vendor-contingency-management) |

---

## BC-01 — Governance and Roles {#bc-01-governance-and-roles}

**WHY (Reg cite):** [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires the Board to establish and oversee policies governing the credit union's operations, including continuity; [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires a written information security program with designated responsibility and Board approval. The Board must approve the BCP/DR program and receive regular reporting; management is accountable for maintaining a living plan with named owners.

**SYSTEM BEHAVIOR:** The Board approves the BCP/DR policy and program annually and receives exercise results and material updates. The Chief Compliance Officer (CCO) owns the program; the Business Continuity Manager (BCM) maintains the living BCP/DR plan document, including named process owners and the Incident Management Team (IMT) roster. The plan is reviewed and updated at least annually and whenever a material change occurs (new location, new critical system, significant organizational change). The IMT roster is verified quarterly to confirm named individuals, backups, and contact information remain current. The BCP/DR plan document and IMT roster are write-restricted to the CCO and BCM; Board-level approval is required for the policy itself.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens (`bcp.annual_review_due`) | Current plan version (`bcp.plan_version`), prior Board approval record (`board.approval.id`), material change log | Updated BCP/DR plan submitted for Board approval (`bcp.board.approved`) | Annually (internal: Q4 each year; enforced by `bcp.annual_review_due`) |
| Board meeting convened for BCP approval (`board.meeting_held`) | Updated plan document, CCO attestation, change summary | Board approval recorded (`bcp.board.approved`), minutes reference logged (`board.minutes.recorded`) | At annual review cycle or upon material change |
| Quarterly IMT roster verification trigger (`imt.roster_review_due`) | Current IMT roster with named owners, backups, and contact details (`imt.roster_review_due`) | Verified IMT roster (`imt.roster.verified`), any updates logged | Quarterly (enforced by `imt.roster_review_due`) |
| Material change detected (new location, system, or org change) (`org.material_change`) | Description of change, impact assessment | Plan updated (`bcp.section.updated`), unscheduled review initiated | Within 30 days of change |

**ALERTS/METRICS:** Alert fires if `bcp.annual_review_due` passes without `bcp.board.approved` logged; alert fires if `imt.roster_review_due` passes without `imt.roster.verified` logged. Target: zero overdue annual reviews; zero quarters with unverified IMT roster.

---

## BC-02 — Risk Assessment (Hazards by Region) {#bc-02-risk-assessment-hazards-by-region}

**WHY (Reg cite):** [12 CFR Part 749 Appendix B](https://www.ecfr.gov/current/title-12/part-749) requires credit unions to identify and assess risks to vital records and operations; FFIEC Business Continuity Management guidance requires a risk assessment covering natural, technical, and human threats by geography. The threat register operationalizes this requirement for Pynthia's multi-location, cross-border footprint.

**SYSTEM BEHAVIOR:** The BCM maintains a threat register that scores hazards by likelihood and impact for each operational location. Location-specific hazard profiles are: California (wildfire/smoke, earthquake, grid outage/PSPS, drought); South Carolina (hurricane/tropical storm, flood, tornado); Texas (tornado, severe storm, extreme heat, winter storm/grid outage); Porto, Portugal (flood, earthquake/seismic, extreme heat, European regulatory disruption). All locations share cyber, pandemic, and key-person risk. The Portugal office additionally requires assessment of cross-border data transfer constraints (GDPR/Schrems II) and local labor-law implications for continuity activation. The threat register is refreshed annually and after any major change (new location, new threat category, or significant environmental event). The threat register is write-restricted to the BCM and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual threat register refresh trigger (`threat_register.refresh_due`) | Prior threat register version, hazard data by location, cross-border data transfer assessment for Portugal | Updated threat register (`threat_register.updated`) with likelihood/impact scores by geography | Annually (enforced by `threat_register.refresh_due`) |
| Major change or significant environmental event detected (`org.material_change`) | Description of triggering event, affected location(s), current threat register | Interim threat register update (`threat_register.interim_update`), unscheduled refresh initiated | Within 30 days of triggering event |
| Portugal cross-border data transfer constraint change identified (`regulatory.change_identified`) | GDPR/Schrems II regulatory update, current data transfer mechanisms, Portugal labor law implications | Regulatory change analysis logged (`regulatory.change_analysis.logged`), threat register updated if material | Within 30 days of identification |

**ALERTS/METRICS:** Alert fires if `threat_register.refresh_due` passes without `threat_register.updated` logged. Dashboard tracks open threat register items by location and severity. Target: zero overdue annual refreshes; all location-specific hazard profiles current within 12 months.

---

## BC-03 — Business Impact Analysis (BIA) {#bc-03-business-impact-analysis}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires identification of critical systems and services and assessment of the impact of their disruption; [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires identification of vital records. The BIA is the mechanism for ranking services by member impact and regulatory dependency, setting RTO/RPO targets, and establishing recovery sequence.

**SYSTEM BEHAVIOR:** The BCM maintains a BIA that catalogs all services, ranks them by member impact and regulatory dependency, identifies vital records, and sets RTO/RPO targets and recovery sequence for each tier. Electronic payment channels (ACH origination, wire transfer, debit/ATM card, mobile/remote deposit capture, Zelle) are designated highest-priority critical services given their direct member impact and regulatory dependency; their specific channel controls are governed by the Electronic Payment Systems Policy. The BIA is updated annually and certified quarterly to confirm no material changes have occurred since the last full update. RTO/RPO targets are documented in the BIA scope registry. The BIA document is write-restricted to the BCM and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BIA update trigger (`bia.annual_update_due`) | Current service catalog, member impact ratings, regulatory dependency map, vital records inventory, prior RTO/RPO targets | Updated BIA (`bia.updated`) with revised criticality rankings, RTO/RPO, and recovery sequence | Annually (enforced by `bia.annual_update_due`) |
| Quarterly BIA certification trigger (`bia.certification_due`) | Current BIA version, change log since last full update | BIA certified with no material change, or change flagged for full update (`bia.certified`) | Quarterly (enforced by `bia.certification_due`) |
| New service or material change to existing service detected (`org.material_change`) | Service description, member impact assessment, regulatory dependency, proposed RTO/RPO | BIA updated (`bia.updated`), scope registry entry updated (`scope_registry.entry.updated`) | Within 30 days of change |

**ALERTS/METRICS:** Alert fires if `bia.annual_update_due` passes without `bia.updated` logged; alert fires if `bia.certification_due` passes without `bia.certified` logged. Target: zero overdue annual updates; zero quarters with uncertified BIA; all critical payment channels confirmed at highest-priority tier.

---

## BC-04 — Training, Testing, and Exercises {#bc-04-training-testing-and-exercises}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires testing of the information security program, including incident response; FFIEC Business Continuity Management guidance requires annual testing and exercises with documented results and corrective action. Board reporting of exercise results is a supervisory expectation.

**SYSTEM BEHAVIOR:** The BCM plans and executes at least one enterprise-level exercise per calendar year; exercise types include orientation (awareness), tabletop (scenario discussion), and functional (operational activation). All exercises are tracked for completion, and gaps identified during exercises feed a corrective action plan (CAP). Exercise results are reported to the Board within 30 days of completion. Training completion is tracked for all personnel with BCP/DR roles. The BCM and CCO are write-restricted for exercise scheduling and CAP approval; Board reporting is a required output.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual exercise scheduled (`exercise.scheduled`) | Exercise type (orientation/tabletop/functional), scenario, participant roster (`drill.roster`), objectives (`drill.objectives`) | Exercise scheduled and confirmed (`exercise.scheduled`) | Annually (enforced by `dr.exercise_due`) |
| Exercise conducted (`exercise.completed`) | Participant attendance, scenario execution log, gap findings (`drill.failure_detail`), corrective items (`drill.remediation_item`) | Exercise completion record (`exercise.completed`), after-action report (`drill.aar.published`), CAP items created (`cap.item.created`) | Per exercise date |
| Exercise results reported to Board (`exercise.board.reported`) | Exercise completion record, AAR summary, CAP status | Board exercise report delivered (`exercise.board.reported`) | 30 days after exercise completion (enforced by `exercise.board_report_due`) |
| CAP item remediation verified (`cap.retest.verified`) | CAP item description, remediation evidence, retest results | CAP item closed (`cap.item.completed`), retest verification logged (`cap.retest.verified`) | Per CAP due date (enforced by `drill.remediation_due_at`) |

**ALERTS/METRICS:** Alert fires if `dr.exercise_due` passes without `exercise.completed` logged; alert fires if `exercise.board_report_due` passes without `exercise.board.reported` logged. Track open CAP items by age; target zero CAP items overdue beyond agreed remediation date.

---

## BC-05 — Monitoring, Detection, and Severity {#bc-05-monitoring-detection-and-severity}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires monitoring for security events and a defined incident response process; FFIEC Business Continuity Management guidance requires detection and escalation procedures with defined severity levels. Rapid IC assignment and initial communications are supervisory expectations for material incidents.

**SYSTEM BEHAVIOR:** The credit union operates a central on-call function with continuous monitoring feeds covering weather events (by region), cyber/security signals (SIEM), and vendor status. Incidents are classified using a SEV-1 to SEV-4 severity matrix: SEV-1 is a critical outage or breach with immediate member or regulatory impact; SEV-2 is significant degradation; SEV-3 is limited impact; SEV-4 is informational. For SEV-1 events, an Incident Commander (IC) must be assigned within 5 minutes of detection and initial communications issued within 15 minutes. Lower-severity events follow defined escalation paths per the severity matrix. The on-call rotation and severity matrix are maintained by IT/SRE and the BCM; the SIEM and monitoring feeds are write-restricted to IT/SRE.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring signal received (weather, cyber, or vendor) (`incident.signal.received`) | Signal source, affected system or location, initial impact assessment (`incident.scope_initial`) | Incident created and severity assigned (`incident.created`, `incident.severity.assigned`) | Immediately upon detection |
| SEV-1 detected (`incident.sev1.detected`) | Incident record, severity classification (`incident.severity`), on-call IC rotation (`oncall.ic_rotation`) | IC assigned (`incident.ic.assigned`), IC assignment timer started (`incident.ic_assignment_timer`) | 5 minutes (enforced by `incident.ic_assignment_timer`) |
| IC assigned for SEV-1 (`incident.ic.assigned`) | IC identity, incident scope, communications plan (`incident.comms_plan`) | Initial communications issued (`comms.initial.issued`), initial timer logged (`comms.initial_timer`) | 15 minutes after IC assignment |
| Severity downgrade or upgrade (`incident.severity.assigned`) | Updated impact assessment, IC decision | Severity change logged (`incident.classified`), stakeholders notified | Immediately upon reassessment |

**ALERTS/METRICS:** Alert fires if IC assignment exceeds 5 minutes for any SEV-1 (`incident.ic_assignment_timer` breached); alert fires if initial comms exceed 15 minutes from IC assignment. Dashboard tracks mean time to IC assignment and mean time to first communication by severity tier. Target: 100% of SEV-1 events with IC assigned ≤ 5 minutes; 100% with initial comms ≤ 15 minutes.

---

## BC-06 — Incident Declaration and Initial Actions {#bc-06-incident-declaration-and-initial-actions}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires a defined incident response process including declaration, containment, and communication; FFIEC Business Continuity Management guidance requires a structured first-hour checklist and regular situation reporting. Documented declaration authority and initial actions are supervisory expectations.

**SYSTEM BEHAVIOR:** Upon declaration of a disruptive event, the IC executes a "first hour" checklist covering: (1) confirm human safety, (2) stabilize immediate threat, (3) scope the incident, (4) assign IMT roles, (5) notify required parties, and (6) set sitrep cadence. A Situation Report version 1 (Sitrep v1) must be produced within 30 minutes of declaration. Sitreps are issued every 30–60 minutes until the incident is stabilized. Declaration authority rests with the CCO, CEO, or designated IMT lead; the IC manages execution. Sitrep content and cadence are write-restricted to the IC and IMT leads.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared (`incident.declared`) | Incident scope (`incident.scope`), severity (`incident.severity`), IC identity, IMT roster | First-hour checklist initiated (`incident.first_hour.completed`), IMT roles assigned (`incident.ic.assigned`) | Immediately upon declaration |
| First-hour checklist completed (`incident.first_hour.completed`) | Safety confirmation, stabilization status, scope assessment, role assignments, notification list | Sitrep v1 issued (`sitrep.issued`), v1 timer logged (`sitrep.v1_timer`) | 30 minutes after declaration (enforced by `sitrep.v1_timer`) |
| Sitrep v1 issued (`sitrep.issued`) | Current incident status, actions taken, next steps, estimated resolution | Sitrep cadence timer set (`sitrep.cadence_timer`), subsequent sitreps issued at cadence | Every 30–60 minutes until stabilized (enforced by `sitrep.cadence_timer`) |
| Incident stabilized (`incident.contained`) | Stabilization criteria met, IC confirmation | Sitrep cadence suspended, stabilization logged (`incident.contained`) | Upon IC determination of stabilization |

**ALERTS/METRICS:** Alert fires if Sitrep v1 is not issued within 30 minutes of declaration (`sitrep.v1_timer` breached); alert fires if sitrep cadence lapses beyond 60 minutes during active incident. Target: 100% of declared incidents with Sitrep v1 ≤ 30 minutes; zero cadence lapses during active incidents.

---

## BC-07 — Data Backup, Restore, and RTO/RPO {#bc-07-data-backup-restore-and-rtorpo}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires preservation of vital records and the ability to reconstruct them; [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires data integrity and recovery capabilities as part of the information security program. Immutable, offsite backups with tested restore capability are supervisory expectations for federally insured credit unions.

**SYSTEM BEHAVIOR:** IT/SRE maintains tiered, immutable, offsite backups for all critical systems. The critical tier (highest-priority services per the BIA) must achieve RPO ≤ 15 minutes. Backup jobs are monitored continuously; failures trigger immediate remediation. Restore tests are performed for each backup tier at least quarterly to validate recoverability within RTO targets. For ransomware/crypto-lock events, recovery uses only clean point-in-time restores from immutable backup; no payment or negotiation with threat actors is authorized without CCO and legal approval. Backup configuration and restore test results are write-restricted to IT/SRE; the BCM reviews quarterly results.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Backup job completes (`backup.cycle.completed`) | Backup tier (`backup.tier_config`), job detail (`backup.job_detail`), RPO measurement (`backup.rpo_monitor`) | Backup cycle completion logged (`backup.cycle.completed`); failure triggers remediation (`backup.job.remediated`) | Continuously per backup schedule |
| Quarterly restore test trigger (`backup.restore_test_due`) | Backup tier, most recent backup set, test environment (`restore.test_env`), RTO target from BIA | Restore test completed (`restore.test.completed`), point-in-time validated (`restore.point_validated`), results logged | Quarterly per tier (enforced by `backup.restore_test_due`) |
| Crypto-lock or ransomware event detected (`incident.sev1.detected`) | Incident scope, affected systems, clean backup point-in-time (`restore.point_validated`), IC authorization | Clean restore initiated (`restore.initiated`), restore completed (`restore.completed`), RTO timer tracked (`restore.rto_timer`) | Per BIA RTO target for affected tier |
| Backup job failure detected (`backup.job.failed`) | Failed job detail, affected tier, impact on RPO | Remediation initiated (`backup.job.remediated`), BCM and IT/SRE notified | Immediately; remediation within 1 hour for critical tier |

**ALERTS/METRICS:** Alert fires if any critical-tier backup job fails or RPO exceeds 15 minutes; alert fires if quarterly restore test is not completed per tier (`backup.restore_test_due` breached). Dashboard tracks backup success rate by tier, RPO actuals vs. targets, and restore test pass/fail history. Target: 100% backup success rate for critical tier; RPO ≤ 15 minutes; 100% of quarterly restore tests completed and passed.

---

## BC-08 — Alternate Site and Remote Operations {#bc-08-alternate-site-and-remote-operations}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires the ability to continue critical operations following a disruption; FFIEC Business Continuity Management guidance requires pre-approved alternate processing arrangements with defined activation timelines. The credit union's multi-location footprint requires both physical alternate sites and remote work posture.

**SYSTEM BEHAVIOR:** The credit union maintains a pre-approved remote work posture (VPN, MFA, endpoint controls) and hot/virtual site options for critical operations. Minimum staffing lists for each critical function are documented in the BIA. Upon facility loss or inaccessibility, alternate-site or remote readiness must be achieved within 8 hours and full critical operations must be operational within 24 hours. Site capacity is tested at least annually. The Portugal office remote posture accounts for local labor law requirements for remote work activation. Alternate site agreements and remote access configurations are maintained by IT/SRE and Facilities; activation authority rests with the IC or CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Facility loss declared (`facility.loss.declared`) | Affected facility, minimum staffing list from BIA, alternate site options, remote access configuration (`access.remote_config`) | Alternate site or remote posture activated, readiness timer started (`site.readiness_timer`) | Immediately upon declaration |
| Alternate site / remote readiness confirmed (`site.readiness.confirmed`) | VPN and MFA operational, minimum staff connected, critical systems accessible | Readiness confirmed (`site.readiness.confirmed`), capacity validated (`site.capacity_validated`) | 8 hours after facility loss declaration (enforced by `site.readiness_timer`) |
| Full critical operations achieved at alternate site | All BIA-critical services operational, payment channels confirmed, member-facing services restored | Critical operations resumed (`ops.critical_resumed`), resumption timer logged (`ops.resumption_timer`) | 24 hours after facility loss declaration |
| Annual site capacity test trigger (`site.capacity_test_due`) | Alternate site configuration, minimum staffing list, test scenario | Site capacity test completed (`site.capacity_validated`), gaps logged for CAP | Annually (enforced by `site.capacity_test_due`) |

**ALERTS/METRICS:** Alert fires if readiness is not confirmed within 8 hours of facility loss declaration; alert fires if full critical ops are not achieved within 24 hours. Alert fires if annual site capacity test is not completed (`site.capacity_test_due` breached). Target: 100% of facility loss events with readiness ≤ 8 hours; 100% with full critical ops ≤ 24 hours.

---

## BC-09 — Major IT Failure Response {#bc-09-major-it-failure-response}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires incident response procedures for IT failures; FFIEC Business Continuity Management guidance requires runbooks for core system and cloud outages with defined escalation and failover timelines. Dual control for rollback decisions is a supervisory expectation for critical payment systems.

**SYSTEM BEHAVIOR:** IT/SRE maintains a runbook for core system and cloud outages covering: detect, isolate blast radius, rollback/failover, and communicate. For major IT failures, an IC must be assigned within 5 minutes (same as SEV-1 per [BC-05](#bc-05-monitoring-detection-and-severity)) and a member-facing status communication issued within 15 minutes. Failover decisions follow BIA tier priority. Rollback from failover requires dual control (two authorized IT/SRE personnel) to prevent accidental data loss. The outage runbook is maintained by IT/SRE and reviewed annually; rollback dual-control requirements are enforced at the system level.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Major IT failure detected (`it.major_failure.detected`) | Affected system(s), blast radius assessment (`it.blast_radius_isolated`), outage runbook (`it.outage_runbook`) | Incident created (`incident.created`), IC assigned (`incident.ic.assigned`), blast radius isolated | 5 minutes (IC assignment enforced by `incident.ic_assignment_timer`) |
| IC assigned for IT failure (`incident.ic.assigned`) | IC identity, affected services, member impact assessment (`incident.member_impact`) | Member status communication issued (`comms.member_status.issued`) | 15 minutes after IC assignment |
| Failover decision made (`it.failover.decided`) | BIA tier for affected service, failover target, dual-control authorization (`transaction.dual_control_required`) | Failover executed (`it.failover.executed`), failover logged with dual-control evidence | Per BIA RTO for affected tier |
| Rollback from failover initiated | Rollback plan, dual-control authorization (two IT/SRE personnel), IC approval | Rollback executed, dual-control evidence logged (`transaction.dual_control.completed`) | Only with dual-control authorization; logged immediately |

**ALERTS/METRICS:** Alert fires if IC assignment exceeds 5 minutes for major IT failure; alert fires if member status communication exceeds 15 minutes from IC assignment. Alert fires if any rollback is executed without dual-control evidence logged. Target: 100% of major IT failures with IC ≤ 5 minutes; 100% with member status ≤ 15 minutes; zero rollbacks without dual-control.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to notify NCUA within 72 hours of determining a reportable cyber incident. [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member notification program for unauthorized access to sensitive member information.

**SYSTEM BEHAVIOR:** Once a reportable cyber incident is determined, NCUA notification must be sent within 72 hours of that determination. Member notice is sent without unreasonable delay per Appendix B criteria once misuse of member information is determined likely. The reportability determination and the NCUA-notification field are write-restricted to the CCO/Compliance-Legal. An incident determined non-reportable is documented with rationale and triggers no NCUA notice.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportable cyber incident determined (`incident.reportability_determination`) | Reportability rationale (`incident.reportability_rationale`), NCUA notice due (`incident.ncua_notice_due_at`) | NCUA notification sent (`incident.ncua.notified`) | 72 hours of determination (enforced by `incident.ncua_notice_due_at`) |
| Member impact confirmed (`incident.member_impact.confirmed`) | Member impact summary (`incident.member_impact`), notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices.sent`) | Without unreasonable delay per Appendix B (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert fires when `incident.ncua_notice_due_at` is within 12 hours without an `incident.ncua.notified` event; alert fires when member notice is overdue per `incident.notification_due_at`. Target: 100% of reportable incidents notified to NCUA within 72 hours; zero member-notice SLA breaches.

---

## BC-15 — Security/Privacy Incident Containment, Legal Consult & Vendor Coordination {#bc-15-security-privacy-incident-containment-legal-consult-vendor-coordination}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires a GLBA-aligned incident response program covering containment, eradication, recovery, and forensics. Feeds the reportability determination governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** Upon detection of a privacy or security incident, the IC initiates containment within 1 hour. The response follows GLBA-aligned phases: containment, eradication, recovery, and forensics. Legal counsel must be consulted within 24 hours of incident creation to assess notification obligations feeding SC-01. Service-provider coordination is required where the incident involves a vendor. The incident record and containment evidence are write-restricted to the IC, CCO, and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security or privacy incident created (`incident.created`) | Incident description (`incident.description`), data scope (`incident.data_scope`), detection source (`incident.detection_source`), severity (`incident.severity`) | Containment initiated (`incident.containment.started`), containment timer started (`incident.containment_timer`) | 1 hour after incident creation (enforced by `incident.containment_timer`) |
| Containment started (`incident.containment.started`) | Containment actions, affected systems, member impact assessment (`incident.member_impact`) | Legal consult initiated (`legal.consulted`), legal consult timer started (`legal.consult_timer`) | 24 hours after incident creation (enforced by `legal.consult_timer`) |
| Vendor involved in incident (`vendor.incident.logged`) | Vendor identity (`vendor.id`), incident scope (`vendor.incident_scope`), vendor containment status (`vendor.incident_containment_status`) | Vendor incident track dispatched (`vendor.incident_tracks_dispatched`), vendor coordination logged | Immediately upon identification |

**ALERTS/METRICS:** Alert fires if containment is not initiated within 1 hour of incident creation; alert fires if legal consult is not logged within 24 hours. Target: 100% of security/privacy incidents with containment ≤ 1 hour; 100% with legal consult ≤ 24 hours.

---

## BC-11 — Communications and Notification Tree {#bc-11-communications-and-notification-tree}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires communication procedures as part of incident response; FFIEC Business Continuity Management guidance requires pre-defined contact trees for employees, Board, regulators, vendors, and media with backup channels. Timely internal and external communications are supervisory expectations.

**SYSTEM BEHAVIOR:** The BCM maintains contact trees for employees, Board members, regulators, critical vendors, and media, with predefined status-page playbooks for member-facing communications. The first internal alert must be issued within 15 minutes of incident declaration. Regulator notification follows the NCUA mechanic governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification). If primary communications platforms fail, backup channels (cell phones, out-of-band messaging) are activated per the communications plan. Contact trees are reviewed and updated quarterly as part of the IMT roster verification (see [BC-01](#bc-01-governance-and-roles)). The communications plan and contact trees are write-restricted to the BCM and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared (`incident.declared`) | Contact tree (`comms.contact_tree`), stakeholder matrix (`comms.stakeholder_matrix`), internal alert template | First internal alert issued (`comms.internal_alert.issued`), initial timer logged (`comms.initial_timer`) | 15 minutes after declaration (enforced by `comms.initial_timer`) |
| Primary communications platform failure detected (`comms.platform.failed`) | Backup channel list, IC authorization | Backup communications activated (`comms.backup.activated`), backup channel logged | Immediately upon detection |
| Regulator notification required (per [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification)) | Notification determination, regulator contact (`regulator.contacts`), required content | Regulator notified (`regulator.ncua.notified`), notification logged | Per SC-01's 72-hour deadline |
| Member-facing status update required | Incident status, affected services, estimated resolution, status-page playbook (`comms.statuspage_playbook`) | Member status issued (`comms.member_status.issued`), status page updated | Per IC cadence decision; at minimum with each sitrep |
| Media inquiry received (`comms.media_inquiry.received`) | Holding statement (`comms.holding_statement`), CEO/CCO approval (`comms.ceo_approval`) | Media response logged (`comms.media_response.logged`) | Within 1 hour of inquiry receipt |

**ALERTS/METRICS:** Alert fires if first internal alert exceeds 15 minutes from declaration; alert fires if backup communications are not activated within 5 minutes of primary platform failure. Track regulator notification timeliness against applicable deadlines. Target: 100% of incidents with internal alert ≤ 15 minutes; zero missed regulator notification deadlines.

---

## BC-12 — People Continuity and Pandemic {#bc-12-people-continuity-and-pandemic}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires the ability to continue critical operations under adverse conditions, including staffing disruptions; FFIEC Business Continuity Management guidance requires people continuity planning covering key-person risk, cross-training, and pandemic scenarios. The Portugal office requires additional consideration of local labor law for remote work activation.

**SYSTEM BEHAVIOR:** The BCM, in coordination with HR, identifies essential roles for each critical function, maintains cross-training records, and implements split-team and remote work protocols. Staffing plans are activated within 24 hours of an absenteeism trigger (≥ 30% of a critical function's staff unavailable) or a public-health declaration. The staffing plan covers work-at-home, in-office split-team, and work-transfer strategies. For the Portugal office, activation of remote work or work-transfer must comply with applicable Portuguese labor law; HR confirms compliance before activation. Key-person risk is mitigated by requiring documented backups for all IMT roles (verified quarterly per [BC-01](#bc-01-governance-and-roles)). Staffing plans are write-restricted to HR and the BCM.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Absenteeism threshold reached (≥ 30% of critical function) or public-health trigger (`staffing.plan.activated`) | Absenteeism count by function (`workforce.availability`), threshold definition (`workforce.absenteeism_threshold`), staffing plan (`staffing.split_team_plan`) | Staffing plan activated (`staffing.plan.activated`), activation logged | 24 hours of trigger (enforced by `staffing.activation_timer`) |
| Portugal remote work activation required | Local labor law compliance confirmation from HR, remote work authorization, data transfer compliance (GDPR/Schrems II) | HR compliance confirmed, remote work activated, compliance logged | Before activation; HR confirmation required |
| Staffing readiness review trigger (`staffing.readiness_review_due`) | Current cross-training records, backup assignments for all IMT roles, staffing plan version | Staffing readiness reviewed (`staffing.review.completed`), gaps logged for remediation | Quarterly (aligned with IMT roster verification; enforced by `staffing.readiness_review_due`) |
| Staffing plan stand-down (absenteeism resolved or public-health declaration lifted) | IC or CCO authorization, return-to-work procedures | Staffing plan deactivated, return-to-work logged, post-event review initiated | Upon IC/CCO determination |

**ALERTS/METRICS:** Alert fires if staffing plan is not activated within 24 hours of absenteeism trigger; alert fires if Portugal remote work is activated without HR compliance confirmation logged. Track cross-training coverage by critical function. Target: 100% of critical functions with documented backups; 100% of staffing plan activations within 24 hours of trigger.

---

## BC-13 — Post-Incident Review (PIR) {#bc-13-post-incident-review}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires continuous improvement of the incident response program based on lessons learned; FFIEC Business Continuity Management guidance requires post-incident reviews with root cause analysis and corrective action plans. Documented PIRs and CAPs are supervisory expectations.

**SYSTEM BEHAVIOR:** Following closure of any declared incident, the BCM initiates a Post-Incident Review (PIR) covering root cause analysis, what worked, what failed, and a corrective action plan (CAP). The PIR draft must be completed within 10 business days of incident closure. The CAP must be approved within 30 days of PIR completion. CAP items are tracked to closure with retest verification confirming effectiveness. PIR and CAP documents are write-restricted to the BCM and CCO; the Board receives a summary of material PIRs as part of regular BCP/DR reporting.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident closed (`incident.closed`) | Incident timeline (`incident.timeline`), root cause (`incident.root_cause`), impact summary (`incident.impact_summary`), IC and IMT input | PIR draft initiated, PIR draft timer started (`pir.draft_timer`) | Immediately upon incident closure |
| PIR draft completed (`pir.drafted`) | Root cause analysis, what worked/failed, proposed CAP items, BCM and CCO review | PIR draft published (`pir.drafted`), CAP items created (`cap.item.created`), CAP approval timer started (`cap.approval_timer`) | 10 business days after incident closure (enforced by `pir.draft_timer`) |
| CAP approved (`cap.approved`) | PIR findings, CAP items with owners and due dates, CCO approval | CAP approved (`cap.approved`), CAP items tracked for closure | 30 days after PIR completion (enforced by `cap.approval_timer`) |
| CAP item retest completed (`cap.retest.verified`) | CAP item description, remediation evidence, retest scenario and results | CAP item closed (`cap.item.completed`), retest verification logged (`cap.retest.verified`) | Per CAP item due date |

**ALERTS/METRICS:** Alert fires if PIR draft is not completed within 10 business days of incident closure; alert fires if CAP is not approved within 30 days of PIR completion; alert fires if any CAP item is overdue. Target: 100% of declared incidents with PIR ≤ 10 BD; 100% with CAP approved ≤ 30 days; zero overdue CAP items.

---

## BC-14 — Vendor Contingency Management {#bc-14-vendor-contingency-management}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires oversight of service providers with access to member information, including their incident response and continuity capabilities; [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires that vital records held by third parties are recoverable. General vendor onboarding, due diligence, and oversight are governed by the Third-Party Risk Policy; this control addresses BCP/DR-specific vendor requirements.

**SYSTEM BEHAVIOR:** The BCM, in coordination with Vendor Risk, maintains BCP/IR attestations, SLAs, RTO/RPO commitments, and DR test evidence for all critical vendors (as classified in the vendor inventory). Evidence is refreshed annually. Exit and failover criteria are defined for each critical vendor, and vendor concentration risk (shared failure modes across critical vendors) is assessed annually. Vendor BCP/DR evidence is reviewed as part of the annual vendor review cycle. The BCM and Vendor Risk are write-restricted for vendor BCP/DR evidence records; the CCO approves exit criteria changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual vendor BCP evidence refresh trigger (`vendor.bcp_evidence_due`) | Critical vendor list, prior attestation package, vendor DR plan (`vendor.dr_plan`), DR test results (`vendor.dr_test_results`), SLA and RTO/RPO commitments (`vendor.rto_rpo`) | Vendor BCP evidence refreshed (`vendor.evidence_refreshed`), DR attestation confirmed (`vendor.dr.confirmed`) | Annually (enforced by `vendor.bcp_evidence_due`) |
| Vendor outage or incident detected (`vendor.outage.detected`) | Vendor identity (`vendor.id`), affected services, failover criteria (`vendor.failover_criteria`), exit plan (`vendor.exit_plan_id`) | Vendor incident logged (`vendor.incident.logged`), failover decision initiated if criteria met (`vendor.failover.decided`) | Immediately upon detection; failover decision within IC-defined timeline |
| Vendor concentration risk assessment (annual) | Critical vendor list, shared infrastructure or dependency map (`vendor.dependency_map`), concentration assessment | Vendor concentration reviewed (`vendor.concentration_assessed`), diversification gaps logged | Annually (aligned with annual vendor review) |
| Vendor exit or failover executed (`vendor.exit.executed`) | Exit plan, failover target, CCO authorization | Vendor exit completed (`vendor.exit.completed`), migration evidence logged (`vendor.migration_evidence`) | Per exit plan timeline |

**ALERTS/METRICS:** Alert fires if `vendor.bcp_evidence_due` passes without `vendor.evidence_refreshed` logged for any critical vendor; alert fires if a critical vendor outage occurs without a documented failover decision within the IC-defined timeline. Track percentage of critical vendors with current BCP attestation. Target: 100% of critical vendors with current (≤ 12 months) BCP/DR evidence; zero critical vendor outages without documented failover decision.

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer

**Approvers:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** Annual (or upon material change to operations, regulatory requirements, or significant incident). Next scheduled review: 2026-07-01.

**Cross-References:**
- Information Security Policy (cyber incident response runbooks and security control design)
- Third-Party Risk Policy (vendor onboarding, due diligence, and general oversight)
- Privacy Policy (member breach notification obligations)
- Record Retention Policy (vital records retention schedules outside continuity)
- Enterprise Risk Management Policy (enterprise risk taxonomy and aggregation)
- Electronic Payment Systems Policy (ACH/wire dual-control, payment channel authentication, and channel-specific controls)

**Board Approval:** Required annually. Date of current approval: [to be completed at adoption].

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several BCP/DR-specific field and event codes referenced in the control overlays above are not yet registered in `core-vocabulary.json` (parsed spec is banking-core only). Codes used throughout this document follow the Composition grammar and reuse registered objects where available (e.g., `incident`, `bcp`, `bia`, `backup`, `vendor`, `staffing`, `sitrep`, `site`, `ops`, `pir`, `cap`, `comms`, `drill`, `exercise`, `imt`, `threat_register`, `facility`, `restore`). The following codes are composed per grammar and are provisional pending engineering registration: `sitrep.v1_timer`, `sitrep.cadence_timer`, `comms.initial_timer`, `comms.member_status.issued`, `comms.internal_alert.issued`, `ops.critical_resumed`, `ops.resumption_timer`, `pir.draft_timer`, `pir.drafted`, `site.readiness_timer`, `workforce.availability`, `workforce.absenteeism_threshold`, `staffing.activation_timer`, `it.blast_radius_isolated`, `it.outage_runbook`, `it.major_failure.detected`, `it.failover.decided`, `it.failover.executed`. All will be confirmed by engineering before the next review.

- **Portugal labor law compliance process.** The policy requires HR confirmation of Portuguese labor law compliance before activating remote work for the Porto office. The specific compliance checklist and approval workflow are not yet documented. The BCM and HR should define and document this process before the policy effective date.

- **GDPR/Schrems II cross-border data transfer assessment.** The threat register requires assessment of cross-border data transfer constraints for the Portugal office. The specific legal basis for data transfers and the mechanism for ongoing monitoring (e.g., Standard Contractual Clauses, adequacy decision) are not specified in PATRICK_NOTES. Legal and Compliance should confirm the applicable transfer mechanism and document it in the threat register.

- **Severity matrix definition.** The SEV-1 to SEV-4 severity matrix is referenced but not fully defined in this policy. The detailed matrix (criteria, escalation paths, and response SLAs for SEV-2 through SEV-4) should be documented in the BCP/DR plan or a supporting runbook and referenced here.

- **Declaration authority.** PATRICK_NOTES identify the CCO as the primary declaration authority. The policy should confirm whether the CEO and designated IMT leads also hold declaration authority (consistent with the reference policy's approach) and document this in the BCP/DR plan.

- **NCUA reporter status and notification thresholds.** Pynthia Credit Union is a federally insured credit union; NCUA notification obligations under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) apply via [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification). The specific notification thresholds and timelines should be confirmed with Legal and documented in the incident response procedures.

- **NCUA reportable-incident/member-notice mechanic is a single shared control.** [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) is sourced verbatim — same control ID, title, and body — from [`shared-controls/ncua-incident-notification.md`](../shared-controls/ncua-incident-notification.md) and appears identically in Business Continuity Plan, E-Commerce, Electronic Payment Systems, Collections, Information Security, Privacy, and Third-Party Risk. Edit the shared source first, then propagate to all seven; do not edit SC-01 in this policy in isolation. BC-15 carries the containment/legal-consult/vendor-coordination material that used to be bundled into the old BC-10 control.

- **Electronic payment channel RTO/RPO targets.** PATRICK_NOTES designate electronic payment channels as highest-priority critical services but do not specify their individual RTO/RPO targets. These must be set in the BIA ([BC-03](#bc-03-business-impact-analysis)) and confirmed with the Electronic Payment Systems Policy owner before the policy effective date.

- **Hot/virtual site vendor agreements.** [BC-08](#bc-08-alternate-site-and-remote-operations) references hot/virtual site options but does not identify specific vendors or agreements. The BCM should confirm that current alternate site agreements are in place and documented in the BCP/DR plan.
