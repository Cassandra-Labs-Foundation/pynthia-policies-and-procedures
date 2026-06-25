```markdown
---
title: Business Continuity Plan Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Business Continuity, Disaster Recovery, BCP, NCUA, GLBA, Records Preservation]
---

# Business Continuity Plan Policy

## General Policy Statement

Pynthia Credit Union maintains a Board-approved, risk-based Business Continuity and Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people across all operational locations (California, South Carolina, Texas, and Porto, Portugal) and all member-facing digital channels. The program prioritizes human safety first, then continuity of critical member services—with electronic payment channels (ACH, wire, debit/ATM, mobile/RDC, Zelle) treated as highest-priority—followed by prudent recovery within defined RTO/RPO targets and disciplined post-incident learning. The program aligns with NCUA records preservation requirements under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749), GLBA-aligned safeguards and incident response under [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748), and Board oversight obligations under [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4). The Portugal office is additionally subject to GDPR/Schrems II cross-border data transfer constraints and local labor law, both of which are factored into continuity activation planning.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| IMT roster verification | Quarterly calendar date | Quarterly | Named IMT roster with current contacts | [BC-01](#bc-01-governance-and-roles) |
| BCP/DR plan annual review | Anniversary of last Board approval | Annually | Full plan document | [BC-01](#bc-01-governance-and-roles) |
| Threat register refresh | Annual calendar or major change event | Annually or after major change | Scored hazard register by geography | [BC-02](#bc-02-risk-assessment-hazards-by-region) |
| BIA annual update | Anniversary of last BIA certification | Annually | BIA document with RTO/RPO and service catalog | [BC-03](#bc-03-business-impact-analysis) |
| BIA quarterly certification | Quarterly calendar date | Quarterly | Certification attestation for changes | [BC-03](#bc-03-business-impact-analysis) |
| Enterprise exercise | Annual calendar | Annually | Exercise report | [BC-04](#bc-04-training-testing-and-exercises) |
| Exercise results to Board | Exercise completion | 30 calendar days | Board report | [BC-04](#bc-04-training-testing-and-exercises) |
| SEV-1 Incident Commander assignment | SEV-1 signal detected | 5 minutes | IC assignment record | [BC-05](#bc-05-monitoring-detection-and-severity) |
| SEV-1 initial communications | IC assigned | 15 minutes | Initial comms message | [BC-05](#bc-05-monitoring-detection-and-severity) |
| Sitrep v1 | Incident declared | 30 minutes | Sitrep document | [BC-06](#bc-06-incident-declaration-and-initial-actions) |
| Sitrep cadence | Sitrep v1 issued | Every 30–60 minutes until stabilized | Sitrep updates | [BC-06](#bc-06-incident-declaration-and-initial-actions) |
| Backup restore test (each tier) | Quarterly calendar date | Quarterly | Restore test results | [BC-07](#bc-07-data-backup-restore-and-rtorpo) |
| Alternate-site/remote readiness | Facility loss or IT outage declared | 8 hours | Readiness confirmation | [BC-08](#bc-08-alternate-site-and-remote-operations) |
| Full critical ops at alternate site | Alternate-site readiness achieved | 24 hours | Critical ops confirmation | [BC-08](#bc-08-alternate-site-and-remote-operations) |
| Major IT failure IC assignment | IT major failure detected | 5 minutes | IC assignment record | [BC-09](#bc-09-major-it-failure-response) |
| Member status communication | IC assigned (IT failure) | 15 minutes | Member status message | [BC-09](#bc-09-major-it-failure-response) |
| Security/privacy incident containment start | Incident declared | 1 hour | Containment actions log | [BC-10](#bc-10-securityprivacy-incident-containment-legal-consult-and-vendor-coordination) |
| Legal counsel consult | Incident declared | 24 hours | Legal consult record | [BC-10](#bc-10-securityprivacy-incident-containment-legal-consult-and-vendor-coordination) |
| NCUA reportable-incident determination & notification | Incident declared | Per SC-01 (72 hours from reasonable belief) | NCUA notification | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| First internal alert | Disruptive event detected | 15 minutes | Internal alert message | [BC-11](#bc-11-communications-and-notification-tree) |
| People continuity staffing plan activation | ≥30% absenteeism or public-health trigger | 24 hours | Staffing plan activation record | [BC-12](#bc-12-people-continuity-and-pandemic) |
| PIR draft | Incident closed | 10 business days | PIR draft document | [BC-13](#bc-13-post-incident-review) |
| CAP approval | PIR draft completed | 30 calendar days | Approved CAP | [BC-13](#bc-13-post-incident-review) |
| Vendor BCP/IR evidence refresh | Annual calendar | Annually | Vendor attestation/evidence package | [BC-14](#bc-14-vendor-contingency-management) |

---

## BC-01 — Governance and Roles {#bc-01-governance-and-roles}

**WHY (Reg cite):** The Board of Directors of a federally insured credit union bears ultimate responsibility for the safety and soundness of the institution, including oversight of operational risk programs. [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires the Board to be informed of and to direct the credit union's affairs; NCUA examination guidance (FFIEC Business Continuity Management Booklet, implemented through NCUA supervisory expectations) requires Board approval of the BCP/DR program and management accountability for its execution.

**SYSTEM BEHAVIOR:** The Board approves the BCP/DR program and any material changes at least annually; the Chief Compliance Officer (CCO) owns the program and is accountable for its currency. Management maintains a living BCP/DR plan document with named owners for each control area and a current Incident Management Team (IMT) roster. The plan is reviewed and updated at least annually and whenever a significant process, system, or organizational change occurs. The IMT roster is verified for accuracy at least quarterly. The CCO is write-restricted to Compliance for plan version control; the Board resolution approving the plan is the authoritative governance record.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BCP/DR plan review cycle opens (`bcp.annual_review_due`) | Current plan document (`bcp.plan_version`), prior Board approval record (`board.resolution_id`), change log since last review | Updated plan document + Board approval resolution (`bcp.board.approved`) | Annually (internal: 30 days before anniversary; enforced by `bcp.annual_review_due`) |
| IMT roster quarterly verification due (`imt.roster_review_due`) | Current IMT roster (`imt.roster.review.due`), HR employee directory | Verified IMT roster with confirmed contacts (`imt.roster.verified`) | Quarterly (internal: first week of each quarter; enforced by `imt.roster_review_due`) |
| Material change to operations, systems, or structure detected (`org.material_change`) | Description of change (`change.description`), affected plan sections | Plan update with change log entry (`bcp.section.updated`) | Within 30 days of change (internal: 15 BD) |

**ALERTS/METRICS:** Alert fires if `bcp.annual_review_due` passes without `bcp.board.approved` logged; alert fires if `imt.roster_review_due` passes without `imt.roster.verified` logged. Target: zero overdue plan reviews; zero quarters with unverified IMT roster.

---

## BC-02 — Risk Assessment: Hazards by Region {#bc-02-risk-assessment-hazards-by-region}

**WHY (Reg cite):** NCUA expects federally insured credit unions to identify and assess threats to operations as part of a comprehensive BCP/DR program, consistent with [12 CFR Part 749 Appendix A](https://www.ecfr.gov/current/title-12/part-749) (records preservation and disaster recovery) and FFIEC Business Continuity Management guidance. A geographically differentiated threat register is required because Pynthia operates across four distinct hazard profiles.

**SYSTEM BEHAVIOR:** The Business Continuity Manager maintains a threat register that scores each identified hazard by likelihood and impact, segmented by operational geography. Hazard profiles are: **California** — wildfire/smoke, earthquake, grid outage/PSPS, drought; **South Carolina** — hurricane/tropical storm, flood, tornado; **Texas** — tornado, severe storm, extreme heat, winter storm/grid outage; **Porto, Portugal** — flood, earthquake/seismic, extreme heat, European regulatory disruption. All locations share cyber, pandemic, and key-person risk. The Portugal office additionally requires assessment of cross-border data transfer constraints (GDPR/Schrems II) and local labor-law implications for continuity activation. The register is refreshed at least annually and after any major change (new location, new critical vendor, significant hazard event). Threat register data is write-restricted to the Business Continuity Manager and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual threat register refresh due (`threat_register.refresh_due`) | Prior register (`threat_register.interim_update`), current hazard intelligence by geography, cyber/pandemic/key-person inputs, Portugal GDPR/labor-law assessment | Updated scored threat register by geography (`threat_register.updated`) | Annually (internal: 60 days before BIA annual update; enforced by `threat_register.refresh_due`) |
| Major change or significant hazard event detected (`org.material_change`) | Event description, affected geography, current register | Interim threat register update (`threat_register.updated`) | Within 30 days of triggering event |
| Portugal cross-border data transfer constraint change identified | GDPR/Schrems II regulatory update, current data flows for Portugal office | Updated Portugal-specific risk entry in threat register (`threat_register.updated`) | Within 30 days of identified change |

**ALERTS/METRICS:** Alert fires if `threat_register.refresh_due` passes without `threat_register.updated` logged. Dashboard metric: count of hazards with no likelihood/impact score (target: zero); count of geographies with no current assessment (target: zero).

---

## BC-03 — Business Impact Analysis {#bc-03-business-impact-analysis}

**WHY (Reg cite):** [12 CFR Part 749 Appendix A](https://www.ecfr.gov/current/title-12/part-749) requires credit unions to identify vital records and critical operations necessary to resume business after a disaster. FFIEC Business Continuity Management guidance requires a formal BIA that ranks services by member impact and regulatory dependency, identifies vital records, and establishes RTO/RPO targets and recovery sequencing.

**SYSTEM BEHAVIOR:** The Business Continuity Manager maintains a BIA that catalogs all services, ranks them by member impact and regulatory dependency, identifies vital records, and sets RTO/RPO targets and recovery sequence for each tier. Electronic payment channels (ACH origination, wire transfer, debit/ATM card, mobile/remote deposit capture, Zelle) are designated highest-priority critical services given their direct member impact and regulatory dependency; their RTO/RPO targets are governed by the Electronic Payment Systems Policy. The BIA is updated at least annually and certified quarterly to confirm no material changes have occurred since the last full update. The BIA document is write-restricted to the Business Continuity Manager and CCO; the scope registry (`scope_registry`) is the authoritative source for per-service RTO/RPO values.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BIA update due (`bia.annual_update_due`) | Current BIA, threat register output (`threat_register.updated`), service catalog, vital records inventory, current RTO/RPO targets (`scope_registry.item.rto`, `scope_registry.item.rpo`) | Updated BIA document with revised service rankings, vital records, RTO/RPO, and recovery sequence (`bia.updated`) | Annually (internal: 30 days before BCP annual review; enforced by `bia.annual_update_due`) |
| Quarterly BIA certification due (`bia.certification_due`) | Current BIA, change log since last full update | Certification attestation confirming no material unrecorded changes (`bia.certified`) | Quarterly (enforced by `bia.certification_due`) |
| New service or material change to existing service detected (`org.material_change`) | Service description, member impact assessment, regulatory dependency, proposed RTO/RPO | BIA interim update with new/revised service entry (`bia.updated`); scope registry updated (`scope_registry.entry.updated`) | Within 30 days of change |

**ALERTS/METRICS:** Alert fires if `bia.annual_update_due` passes without `bia.updated` logged; alert fires if `bia.certification_due` passes without `bia.certified` logged. Target: zero services without a current RTO/RPO assignment in the scope registry; zero highest-priority services without a documented recovery sequence.

---

## BC-04 — Training, Testing, and Exercises {#bc-04-training-testing-and-exercises}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance (implemented through NCUA supervisory expectations) requires credit unions to test their BCP/DR plans through exercises, track results, and report findings to the Board. [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires the Board to be informed of material operational risk matters, including continuity program effectiveness.

**SYSTEM BEHAVIOR:** The Business Continuity Manager plans and executes at least one enterprise-level exercise per calendar year; exercise types may include orientation, tabletop, or functional exercises. Exercise completion is tracked against the annual plan. Gaps and failures identified during exercises are fed into a corrective action plan (CAP). Exercise results are reported to the Board within 30 calendar days of exercise completion. Training completion for all personnel with BCP/DR roles is tracked annually. The exercise schedule and CAP are write-restricted to the Business Continuity Manager and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual enterprise exercise scheduled (`exercise.scheduled`) | BIA service tiers, IMT roster, exercise type selection (orientation/tabletop/functional), scenario based on threat register | Exercise plan document; exercise scheduled (`exercise.scheduled`) | Annually (internal: exercise completed by Q3 each year) |
| Exercise completed (`exercise.completed`) | Exercise scenario, participant roster (`drill.roster`), objectives (`drill.objectives`), observed gaps/failures (`drill.failure_detail`) | After-action report with gap list and corrective action items (`drill.aar.published`); CAP opened (`cap.item.created`) | Within 10 BD of exercise completion |
| Board exercise report due | Exercise AAR completed | Board report on exercise results and CAP status (`exercise.board.reported`) | 30 calendar days after exercise completion (enforced by `exercise.board_report_due`) |
| CAP item remediation verified | CAP item remediation completed | CAP retest verification (`cap.retest.verified`) | Per CAP due date |

**ALERTS/METRICS:** Alert fires if `exercise.board_report_due` passes without `exercise.board.reported` logged. Dashboard metric: count of open CAP items past due date (target: zero); annual exercise completion rate (target: 100%).

---

## BC-05 — Monitoring, Detection, and Severity {#bc-05-monitoring-detection-and-severity}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to maintain monitoring capabilities sufficient to detect disruptive events promptly and to have defined escalation procedures. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) (GLBA-aligned safeguards) requires an incident response capability that includes detection and initial response.

**SYSTEM BEHAVIOR:** The credit union operates a central on-call function with a four-level severity matrix (SEV-1 through SEV-4). SEV-1 is defined as a complete or near-complete loss of a critical member-facing service or a confirmed security breach with material member impact. Monitoring feeds include weather/hazard alerts (covering all four operational geographies), cyber/SIEM alerts, and vendor status monitors. Upon detection of a SEV-1 signal, an Incident Commander (IC) must be assigned within 5 minutes and initial communications issued within 15 minutes. SEV-2 through SEV-4 have defined but less stringent response timelines documented in the BCP/DR runbook. The severity matrix and on-call rotation are write-restricted to IT/SRE and the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| SEV-1 signal detected by monitoring system (`incident.sev1.detected`) | Signal source (`incident.detection_source`), affected service(s) (`incident.scope_initial`), severity classification (`incident.severity`) | Incident record created (`incident.created`); IC assignment initiated | Immediately upon detection |
| IC assignment required (SEV-1) (`incident.ic.assigned`) | On-call roster (`oncall.ic_rotation`), incident record (`incident.id`) | IC assignment logged (`incident.ic.assigned`) | Within 5 minutes of SEV-1 detection (enforced by `incident.ic_assignment_timer`) |
| Initial communications required (SEV-1) | IC assigned, affected service scope, preliminary impact assessment (`incident.member_impact`) | Initial internal alert issued (`comms.initial.issued`) | Within 15 minutes of IC assignment |
| Weather/hazard watch raised for an operational geography | Hazard feed alert (`hazard.watch_raised`), affected geography | Hazard alert logged; on-call notified (`incident.signal.received`) | Immediately upon feed alert |
| Vendor outage signal received | Vendor status monitor alert, affected vendor (`vendor.id`), affected services | Vendor outage logged (`vendor.outage.detected`); severity assessed | Within 5 minutes of signal |

**ALERTS/METRICS:** Alert fires if IC assignment exceeds 5 minutes from SEV-1 detection; alert fires if initial comms exceed 15 minutes from IC assignment. Dashboard metric: mean time to IC assignment for SEV-1 events (target: ≤5 min); mean time to initial comms (target: ≤15 min); count of unacknowledged SEV-1 signals (target: zero).

---

## BC-06 — Incident Declaration and Initial Actions {#bc-06-incident-declaration-and-initial-actions}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to have documented activation procedures for their BCP/DR plans, including a defined "first hour" checklist that ensures safety, stabilization, scoping, role assignment, notification, and cadence-setting occur in a structured sequence. [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires management to keep the Board informed of material events.

**SYSTEM BEHAVIOR:** Upon declaration of a disruptive event, the IC executes a "first hour" checklist covering: (1) confirm personnel safety, (2) stabilize the immediate situation, (3) scope the impact against the BIA service tiers, (4) assign IMT roles, (5) initiate the notification tree, and (6) set the sitrep cadence. A Situation Report version 1 (Sitrep v1) must be produced within 30 minutes of declaration. Sitreps are issued on a 30–60 minute cadence until the incident is stabilized. The IC has authority to declare the incident and activate the BCP/DR plan; the CCO and CEO are notified immediately upon declaration. The first-hour checklist and sitrep templates are write-restricted to the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Disruptive event declared (`incident.declared`) | Triggering signal, IC identity, initial scope assessment (`incident.scope_initial`), BIA tier mapping | Incident declaration logged (`incident.declared`); first-hour checklist initiated (`incident.checklist_first_hour`) | Immediately upon declaration |
| Sitrep v1 due | Incident declared, first-hour checklist in progress, initial scope (`incident.scope`), role assignments | Sitrep v1 issued (`sitrep.issued`); logged with timestamp | Within 30 minutes of declaration (enforced by `sitrep.v1_timer`) |
| Sitrep cadence update due | Prior sitrep, current status, updated scope, recovery actions taken | Sitrep update issued (`sitrep.issued`) | Every 30–60 minutes until stabilized (enforced by `sitrep.cadence_timer`) |
| Incident stabilized | IC determination, critical services restored or workaround in place | Stabilization logged; sitrep cadence reduced or ended (`incident.response.activated` → stabilized state) | Upon IC determination |

**ALERTS/METRICS:** Alert fires if Sitrep v1 is not logged within 30 minutes of declaration. Dashboard metric: sitrep cadence compliance rate (target: 100% of required sitreps issued on schedule); count of incidents without a completed first-hour checklist (target: zero).

---

## BC-07 — Data Backup, Restore, and RTO/RPO {#bc-07-data-backup-restore-and-rtorpo}

**WHY (Reg cite):** [12 CFR Part 749 Appendix A](https://www.ecfr.gov/current/title-12/part-749) requires federally insured credit unions to maintain a records preservation program including offsite storage of vital records and the ability to reconstruct critical records. FFIEC Business Continuity Management guidance requires defined RPO and RTO targets, tiered backup strategies, and periodic restore testing.

**SYSTEM BEHAVIOR:** The credit union maintains tiered, immutable, offsite backups for all critical systems. The RPO for critical-tier services (as defined in the BIA) is ≤15 minutes; RPO targets for lower tiers are documented in the BIA/scope registry. Backups are immutable (write-once) and stored offsite. Restore tests are performed for each backup tier at least quarterly; test results are documented. For ransomware/crypto-lock events, recovery uses only clean point-in-time restores from immutable backup media—no restore from potentially compromised snapshots. The backup catalog and tier configuration are write-restricted to IT/SRE; restore test results are write-restricted to IT/SRE and the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Backup job completes (`backup.cycle.completed`) | Backup tier (`backup.tier_config`), job detail (`backup.job_detail`), RPO monitor result (`backup.rpo_monitor`) | Backup completion logged (`backup.cycle.completed`); RPO breach alert if applicable | Per backup schedule (critical tier: continuous/≤15 min RPO) |
| Backup job fails (`backup.job.failed`) | Job detail, failure reason, affected tier | Failure logged (`backup.job.failed`); on-call alerted | Immediately upon failure |
| Quarterly restore test due (`backup.restore_test_due`) | Backup catalog (`backup.catalog`), test environment (`restore.test_env`), tier under test | Restore test completed and results documented (`restore.test.completed`); point-in-time validation logged (`restore.point.validated`) | Quarterly (enforced by `backup.restore_test_due`) |
| Crypto-lock/ransomware event declared | Incident declaration, affected systems, clean backup point-in-time identified | Clean restore initiated from immutable backup (`restore.initiated`); restore completed (`restore.completed`) | Per BIA RTO for affected tier |

**ALERTS/METRICS:** Alert fires if any critical-tier backup exceeds 15-minute RPO; alert fires if quarterly restore test is not completed on schedule. Dashboard metric: RPO breach count (target: zero for critical tier); restore test pass rate by tier (target: 100%); count of overdue restore tests (target: zero).

---

## BC-08 — Alternate Site and Remote Operations {#bc-08-alternate-site-and-remote-operations}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to maintain viable alternate processing and work sites sufficient to resume critical operations within defined RTO targets. [12 CFR Part 749 Appendix A](https://www.ecfr.gov/current/title-12/part-749) requires the ability to reconstruct critical records and resume operations after a facility loss.

**SYSTEM BEHAVIOR:** The credit union maintains a pre-approved remote work posture (VPN with MFA enforced) and documented hot/virtual site options for each operational location. Minimum staffing lists for critical services at alternate sites are maintained in the BIA. The target is to achieve alternate-site or remote readiness within 8 hours of a facility loss or IT outage declaration, and full critical operations within 24 hours. The Portugal office remote posture accounts for cross-border data transfer constraints (GDPR/Schrems II) and local labor law; activation of remote work for Portugal personnel requires HR and Legal review of applicable obligations. Alternate site configurations and minimum staffing lists are write-restricted to the Business Continuity Manager and IT/SRE.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Facility loss or IT outage declared (`facility.loss.declared`) | Affected location, BIA tier mapping, alternate site matrix, minimum staffing list | Alternate site/remote activation initiated; readiness confirmation target set | Immediately upon declaration |
| Alternate-site/remote readiness achieved | VPN/MFA connectivity confirmed, minimum staffing at alternate site, critical system access verified (`site.capacity.validated`) | Readiness confirmed (`site.readiness.confirmed`) | Within 8 hours of declaration (enforced by `site.readiness_timer`) |
| Full critical operations achieved at alternate site | All BIA critical-tier services operational, member-facing channels restored | Critical ops confirmation logged (`ops.critical_resumed`) | Within 24 hours of declaration |
| Portugal remote activation required | Facility loss or IT outage affecting Porto office, GDPR/Schrems II data transfer assessment, local labor law review | Portugal remote activation logged; HR/Legal review documented | Within 8 hours of declaration (HR/Legal review within 4 hours) |
| Annual alternate-site readiness test due (`facility.annual_test_due`) | Alternate site configuration, minimum staffing list, VPN/MFA test plan | Alternate site test completed (`facility.test.completed`); gaps logged | Annually (enforced by `facility.annual_test_due`) |

**ALERTS/METRICS:** Alert fires if readiness confirmation is not logged within 8 hours of a facility loss declaration; alert fires if critical ops confirmation is not logged within 24 hours. Dashboard metric: alternate-site readiness test pass rate (target: 100%); mean time to readiness (target: ≤8 hours).

---

## BC-09 — Major IT Failure Response {#bc-09-major-it-failure-response}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to maintain documented runbooks for core system and cloud outages, with defined detection, isolation, failover, and communication procedures. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires an incident response capability covering IT failures that affect member data or services.

**SYSTEM BEHAVIOR:** IT/SRE maintains a runbook for core system and cloud outages covering: detect, isolate blast radius, rollback/failover, and communicate. Upon detection of a major IT failure, an IC is assigned within 5 minutes (same timeline as SEV-1 per BC-05). A member-facing status communication is issued within 15 minutes of IC assignment. Failover decisions follow BIA tier priority; rollback from failover requires dual control (two authorized IT/SRE personnel). The blast radius isolation step (`it.blast_radius_isolated`) must be completed before any rollback or failover is executed. The IT outage runbook is write-restricted to IT/SRE and the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Major IT failure detected (`it.major_failure.detected`) | Detection source, affected systems, initial blast radius assessment (`it.blast_radius_isolated`) | Incident created (`incident.created`); IC assignment initiated | Immediately upon detection |
| IC assigned (IT failure) | On-call roster, incident record | IC assignment logged (`incident.ic.assigned`) | Within 5 minutes of detection |
| Member status communication required | IC assigned, affected services, preliminary impact | Member status issued (`comms.member_status.issued`) | Within 15 minutes of IC assignment |
| Blast radius isolated | Affected system scope confirmed | Blast radius isolation logged (`it.blast_radius_isolated`) | Before any rollback/failover action |
| Failover decision required | BIA tier for affected service, blast radius confirmed, dual-control authorization | Failover decision logged (`it.failover.decided`); dual-control record | Per BIA RTO for affected tier |
| Failover executed | Failover decision, dual-control authorization | Failover execution logged (`it.failover.executed`) | Per BIA RTO |
| Rollback from failover required | Dual-control authorization (two IT/SRE personnel), system health confirmed | Rollback logged; dual-control record | Per BIA RTO |

**ALERTS/METRICS:** Alert fires if IC assignment exceeds 5 minutes from major IT failure detection; alert fires if member status communication exceeds 15 minutes from IC assignment. Dashboard metric: mean time to blast radius isolation (target: ≤15 min for SEV-1); dual-control compliance rate for rollback actions (target: 100%).

---

## BC-10 — Security/Privacy Incident Containment, Legal Consult, and Vendor Coordination {#bc-10-securityprivacy-incident-containment-legal-consult-and-vendor-coordination}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) (GLBA-aligned safeguards) requires federally insured credit unions to implement an incident response program covering containment, eradication, recovery, and forensics for security and privacy incidents. Service-provider coordination is required under GLBA safeguards. This control feeds the SC-01 reportability determination; member breach notification obligations are governed by SC-01 and the Privacy Policy.

**SYSTEM BEHAVIOR:** Upon declaration of a security or privacy incident, the IMT executes GLBA-aligned containment, eradication, recovery, and forensics steps per the Information Security Policy runbook. Containment must begin within 1 hour of declaration. Legal counsel must be consulted within 24 hours to assess notification obligations, privilege considerations, and regulatory reporting requirements. Service-provider (vendor) coordination is initiated immediately for any incident involving a vendor system or data; vendor incident tracks are dispatched per the Third-Party Risk Policy. The reportability determination for NCUA notification is governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification). Member breach notification obligations are governed by the Privacy Policy. Detailed cyber incident response runbooks and security control design are out of scope for this policy—see the Information Security Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security/privacy incident declared (`incident.declared`) | Incident record (`incident.id`), initial scope (`incident.scope_initial`), data scope assessment (`incident.data_scope`) | Containment initiated; containment start logged (`incident.containment.started`) | Within 1 hour of declaration (enforced by `incident.containment_timer`) |
| Legal consult required | Incident record, data scope, preliminary notification assessment (`incident.reportability_assessment`) | Legal consult completed and logged (`legal.consulted`); privilege determination noted | Within 24 hours of declaration (enforced by `legal.consult_timer`) |
| Vendor system or data involved in incident | Incident record, affected vendor (`vendor.id`), vendor incident scope | Vendor incident tracks dispatched (`vendor.incident_tracks_dispatched`); vendor notified per contract | Immediately upon identification |
| Reportability determination required | Legal consult complete, data scope confirmed, misuse likelihood assessed (`incident.misuse_likelihood`) | Reportability determination logged (`incident.reportable.determined`); feeds SC-01 | Per SC-01 timeline (see [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification)) |
| Eradication and recovery completed | Containment confirmed, root cause identified (`incident.root_cause`), affected systems remediated | Recovery logged (`incident.recovered`); forensics summary documented | Per BIA RTO for affected services |

**ALERTS/METRICS:** Alert fires if containment start is not logged within 1 hour of declaration; alert fires if legal consult is not logged within 24 hours. Dashboard metric: mean time to containment start (target: ≤1 hour); legal consult compliance rate (target: 100%); count of vendor incidents without dispatched tracks (target: zero).

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to notify NCUA as soon as possible, and no later than 72 hours after the credit union reasonably believes it has experienced a reportable cyber incident. A reportable cyber incident is one that materially disrupts or degrades, or is reasonably likely to materially disrupt or degrade, the confidentiality, integrity, or availability of a member information system or the information the system maintains. Member notification obligations for breaches of member information are governed by [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and applicable state breach notification laws.

**SYSTEM BEHAVIOR:** When an incident is declared, the Incident Commander initiates a reportability assessment in parallel with containment. The assessment evaluates whether the incident meets the NCUA reportable cyber-incident threshold: material disruption or degradation—or reasonable likelihood thereof—of the confidentiality, integrity, or availability of a member information system or member information. Legal counsel is consulted within 24 hours (per [BC-10](#bc-10-securityprivacy-incident-containment-legal-consult-and-vendor-coordination)). If the threshold is met or reasonably believed to be met, NCUA is notified within 72 hours of that determination via the NCUA's preferred notification channel. The notification includes the incident description, affected systems, member impact assessment, and current response status. Member notification decisions—including timing, content, and applicable state law requirements—are made in coordination with Legal and are governed by the Privacy Policy; this control covers only the NCUA notification obligation. The reportability determination and NCUA notification record are write-restricted to the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared and reportability assessment initiated (`incident.declared`) | Incident record (`incident.id`), initial scope (`incident.scope_initial`), data scope (`incident.data_scope`), member impact assessment (`incident.member_impact`) | Reportability assessment started; assessment logged (`incident.assessment.started`) | Immediately upon declaration |
| Reasonable belief of reportable cyber incident formed | Reportability assessment complete, legal consult complete (`legal.consulted`), misuse likelihood assessed (`incident.misuse_likelihood`), material flag set (`incident.material`) | Reportability determination logged (`incident.reportable.determined`); NCUA notification clock started (`incident.ncua.notice.due_at`) | Upon determination (clock starts at this point) |
| NCUA notification due (`incident.ncua.notice.due_at`) | Reportability determination, incident description (`incident.description`), affected systems, member impact, response status | NCUA notified (`incident.ncua.notified`); notification record logged (`ncua.notification.sent`) | Within 72 hours of reasonable belief (enforced by `incident.ncua.notice.due_at`) |
| NCUA acknowledgment received | NCUA notification sent | NCUA acknowledgment logged (`ncua.ack.logged`) | Upon receipt |
| Member notification decision required | Reportability determination, data scope, applicable state breach law assessment, Legal review | Member notification decision logged (`notification.decision.recorded`); member notices issued per Privacy Policy (`incident.member_notices.sent`) | Per applicable state law and Privacy Policy |

**ALERTS/METRICS:** Alert fires at 48 hours after reasonable-belief determination if NCUA notification has not been sent (24-hour warning before 72-hour deadline). Dashboard metric: count of reportable incidents where NCUA notification exceeded 72 hours (target: zero); count of incidents without a completed reportability determination (target: zero within 48 hours of declaration).

---

## BC-11 — Communications and Notification Tree {#bc-11-communications-and-notification-tree}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to maintain current contact trees for employees, Board, regulators, vendors, and media, with predefined communication playbooks. [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires the Board to be kept informed of material events. Regulator notification timelines are governed by applicable law and regulation (see SC-01 for NCUA cyber-incident notification).

**SYSTEM BEHAVIOR:** The Business Continuity Manager maintains current contact trees for employees (all locations including Portugal), Board members, regulators, critical vendors, and media. Predefined status-page playbooks and message templates are maintained for each major incident type. The first internal alert must be issued within 15 minutes of a disruptive event being detected (consistent with BC-05). Backup communication channels (e.g., SMS, satellite phone, out-of-band messaging) are pre-configured for use if primary communications platforms fail. Regulator notification (NCUA and others) follows the timelines in SC-01 and applicable law; this control governs the mechanics of the notification tree, not the reportability determination. Media inquiries are routed to the CCO or designated spokesperson only. Contact trees are reviewed and updated at least quarterly (aligned with IMT roster verification in BC-01) and are write-restricted to the Business Continuity Manager and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Disruptive event detected (`incident.sev1.detected` or equivalent) | Contact tree (`comms.contact_tree`), incident scope, severity | First internal alert issued (`comms.internal_alert.issued`) | Within 15 minutes of detection |
| Primary communications platform fails (`comms.platform.failed`) | Backup channel configuration, contact tree | Backup communications activated (`comms.backup.activated`); backup channel used for all subsequent alerts | Immediately upon failure |
| Board notification required | Incident record, current status, member impact | Board notified (`board.notification.sent`) | Within 1 hour of declaration for SEV-1; per BCP runbook for lower severity |
| Regulator notification required | Reportability determination (from SC-01), notification content | Regulator notified per SC-01 (`regulator.ncua.notified`) | Per SC-01 and applicable law |
| Media inquiry received | Designated spokesperson identity, approved holding statement (`comms.holding_statement`) | Media inquiry logged (`comms.media_inquiry.received`); response issued by designated spokesperson (`comms.media_response.logged`) | Within 2 hours of inquiry |
| Contact tree quarterly review due (`imt.roster_review_due`) | Current contact tree, HR employee directory, vendor contact list | Updated contact tree verified and logged | Quarterly (aligned with BC-01 IMT roster verification) |

**ALERTS/METRICS:** Alert fires if first internal alert is not logged within 15 minutes of a SEV-1 detection; alert fires if backup communications are not activated within 5 minutes of primary platform failure. Dashboard metric: contact tree currency (target: verified quarterly with zero stale entries); count of incidents where Board notification exceeded 1 hour for SEV-1 (target: zero).

---

## BC-12 — People Continuity and Pandemic {#bc-12-people-continuity-and-pandemic}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to address people-availability risks, including pandemic scenarios, through cross-training, split-team arrangements, and remote work capabilities. [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) requires management to maintain operational capability. The Portugal office is subject to local labor law constraints on remote work activation and split-team arrangements, which must be assessed before activation.

**SYSTEM BEHAVIOR:** HR and the Business Continuity Manager maintain a list of essential roles for each critical service (per the BIA), with cross-training plans and designated backups for each role. Split-team and remote work arrangements are pre-approved and documented. Staffing plans are activated within 24 hours of a trigger event: either ≥30% absenteeism across any operational location or a public-health authority declaration. For the Portugal office, HR must confirm compliance with local labor law before activating remote work or split-team arrangements; this review is completed within 4 hours of the trigger. Pandemic-specific protocols (health screening, workstation isolation, supply management) are documented in the BCP/DR runbook. The essential roles list and cross-training plan are write-restricted to HR and the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Absenteeism threshold reached (≥30% at any location) or public-health trigger (`workforce.availability` below threshold) | Absenteeism data (`workforce.absenteeism_threshold`), affected location, essential roles list, backup assignments | Staffing plan activation initiated; activation logged (`staffing.plan.activated`) | Within 24 hours of trigger (enforced by `staffing.activation.timer`) |
| Portugal remote work activation required | Trigger event, local labor law assessment, HR review | HR/Legal review completed; Portugal remote work activated with compliance record | Within 4 hours of trigger (HR review); within 24 hours (full activation) |
| Split-team arrangement activated | Essential roles list, split-team plan (`staffing.split_team_plan`), location assignments | Split-team activation logged (`staffing.plan.activated`) | Within 24 hours of trigger |
| Staffing readiness review due (`staffing.readiness_review_due`) | Essential roles list, cross-training completion records, backup assignments | Staffing readiness review completed (`staffing.review.completed`) | Annually (aligned with BIA annual update) |
| Pandemic stand-down | Public-health authority declaration or absenteeism below threshold | Stand-down logged; normal staffing resumed; post-event review initiated | Upon determination |

**ALERTS/METRICS:** Alert fires if staffing plan activation is not logged within 24 hours of a trigger event. Dashboard metric: cross-training completion rate for essential roles (target: 100%); count of essential roles with no designated backup (target: zero); Portugal labor-law review completion rate for activations (target: 100%).

---

## BC-13 — Post-Incident Review {#bc-13-post-incident-review}

**WHY (Reg cite):** FFIEC Business Continuity Management guidance requires credit unions to conduct post-incident reviews (PIRs) to identify root causes, document lessons learned, and implement corrective actions. Continuous improvement of the BCP/DR program is a supervisory expectation under NCUA examination standards.

**SYSTEM BEHAVIOR:** Following closure of any declared incident (SEV-1 or SEV-2, or any incident that activated the BCP/DR plan), the Business Continuity Manager facilitates a PIR covering: root cause analysis, what worked, what failed, and a corrective action plan (CAP). The PIR draft must be completed within 10 business days of incident closure. The CAP must be approved within 30 calendar days of PIR draft completion. CAP items are tracked to closure with retest verification. PIR findings that reveal gaps in the BCP/DR plan trigger an out-of-cycle plan update per BC-01. PIR documents are write-restricted to the Business Continuity Manager and CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident closed (`incident.closed`) | Incident record, timeline (`incident.timeline`), root cause analysis (`incident.root_cause`), impact summary (`incident.impact_summary`) | PIR draft initiated; draft timer started (`pir.draft_timer`) | Immediately upon closure |
| PIR draft due (`pir.draft_timer`) | Root cause, what worked/failed, preliminary CAP items | PIR draft completed (`pir.drafted`); CAP items created (`cap.item.created`) | Within 10 business days of incident closure (enforced by `pir.draft_timer`) |
| CAP approval due (`cap.approval.timer`) | PIR draft, CAP items with owners and due dates | CAP approved (`cap.approved`) | Within 30 calendar days of PIR draft completion (enforced by `cap.approval.timer`) |
| CAP item remediation completed | CAP item, remediation evidence | CAP item closed (`cap.item.completed`) | Per CAP due date |
| CAP retest verification required | Closed CAP item, retest plan | Retest verified (`cap.retest.verified`) | Per CAP retest schedule |
| PIR reveals BCP/DR plan gap | PIR findings, gap description | Out-of-cycle plan update initiated (`bcp.section.updated`) | Within 30 days of PIR approval |

**ALERTS/METRICS:** Alert fires if PIR draft is not completed within 10 BD of incident closure; alert fires if CAP is not approved within 30 days of PIR draft. Dashboard metric: PIR completion rate for declared incidents (target: 100%); mean time to CAP approval (target: ≤30 days); count of open CAP items past due date (target: zero).

---

## BC-14 — Vendor Contingency Management {#bc-14-vendor-contingency-management}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) (GLBA-aligned safeguards) requires credit unions to oversee service providers' safeguards and incident response capabilities. FFIEC Business Continuity Management guidance requires credit unions to assess vendor BCP/DR capabilities, obtain attestations, and define exit/failover criteria for critical vendors. General vendor onboarding, due diligence, and oversight are governed by the Third-Party Risk Policy; this control covers only the BCP/DR-specific requirements.

**SYSTEM BEHAVIOR:** The Business Continuity Manager, in coordination with Vendor Risk, maintains BCP/IR attestations, SLA terms, RTO/RPO commitments, and DR test evidence for all critical vendors (as classified in the vendor inventory). Evidence is refreshed at least annually. Exit/failover criteria are defined for each critical vendor and documented in the vendor record. Vendor concentration risk (shared failure modes across critical vendors) is assessed annually. For vendors supporting electronic payment channels, BCP/DR evidence requirements are aligned with the Electronic Payment Systems Policy. Vendor BCP/DR evidence is write-restricted to Vendor Risk and the Business Continuity Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual vendor BCP/DR evidence refresh due (`vendor.bcp_evidence_due`) | Critical vendor list, prior attestations, SLA terms (`vendor.rto_rpo`), DR test results (`vendor.dr_test_results`) | Updated vendor BCP/DR evidence package; attestation logged (`vendor.dr.confirmed`) | Annually (enforced by `vendor.bcp_evidence_due`) |
| Vendor DR test results received | Vendor DR test report, RTO/RPO commitments | DR test results reviewed and logged (`vendor.dr.confirmed`) | Within 30 days of receipt |
| Vendor failover criteria review required | Vendor record, current failover criteria (`vendor.failover_criteria`), BIA dependency map | Failover criteria reviewed and updated (`vendor.failover_criteria_set`) | Annually (aligned with vendor annual review) |
| Vendor concentration risk assessment due | Critical vendor list, shared infrastructure/dependency map | Concentration assessment completed (`vendor.concentration_assessed`) | Annually |
| Vendor incident affecting critical service detected (`vendor.outage.detected`) | Vendor incident record, affected services, SLA terms | Vendor incident track dispatched (`vendor.incident_tracks_dispatched`); failover criteria evaluated | Immediately upon detection (per BC-10 for security incidents) |

**ALERTS/METRICS:** Alert fires if annual BCP/DR evidence is not refreshed for any critical vendor within the required period. Dashboard metric: count of critical vendors with expired BCP/DR attestations (target: zero); count of critical vendors without defined exit/failover criteria (target: zero); vendor concentration risk assessment completion rate (target: 100% annually).

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer

**Approvers:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** Annual review and Board approval required. Out-of-cycle updates required upon material change to operations, systems, organizational structure, or regulatory requirements. IMT roster verified quarterly.

**Cross-References:**
- Information Security Policy (cyber incident response runbooks, security control design)
- Third-Party Risk Policy (vendor onboarding, due diligence, general oversight)
- Privacy Policy (member breach notification obligations)
- Record Retention Policy (vital records retention schedules outside continuity)
- Enterprise Risk Management Policy (enterprise risk taxonomy and aggregation)
- Electronic Payment Systems Policy (ACH/wire dual-control, payment channel authentication, electronic payment channel-specific controls)

**Governing Authorities:**
- [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) — NCUA Records Preservation Program
- [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) — NCUA Safeguarding Member Information (GLBA-aligned)
- [12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748) — NCUA Cyber Incident Notification
- [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) — NCUA Board Responsibilities
- FFIEC Business Continuity Management Booklet (supervisory guidance, not codified)

| Role | Name | Signature | Date |
|---|---|---|---|
| Chief Compliance Officer | Patrick Wilson | __________________ | __________ |
| Board of Directors (Chair) | __________________ | __________________ | __________ |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The BCP/DR-domain resources, fields, and events referenced throughout this document (e.g., `hazard.watch_raised`, `hazard.feed_detail`, `hazard.impact`, `hazard.likelihood`, `pir.draft_timer`, `pir.drafted`, `ops.critical_resumed`, `ops.resumption_timer`, `workforce.absenteeism_threshold`, `workforce.availability`, `sitrep.v1_timer`, `sitrep.cadence_timer`, `incident.checklist_first_hour`, `incident.containment_timer`, `it.blast_radius_isolated`, `it.outage_runbook`, `oncall.ic_rotation`, `comms.initial_timer`, `comms.backup.activated`, `comms.holding_statement`, `comms.statuspage_playbook`) are not yet registered in `core-vocabulary.json` (parsed spec is banking-core only). Names used are the target naming scheme and will be confirmed by engineering before the next review. Registered codes from the core vocabulary (e.g., `incident.*`, `bcp.*`, `bia.*`, `imt.*`, `vendor.*`, `backup.*`, `restore.*`, `drill.*`, `exercise.*`, `cap.*`, `staffing.*`, `sitrep.*`, `comms.*`, `facility.*`, `site.*`, `threat_register.*`, `pir.*`) are used where available and are the authoritative contract surface.

- **SC-01 shared control.** SC-01 (NCUA Reportable Cyber-Incident & Member Notification) is a shared control emitted identically across seven policies. The body above is the authoritative version; any deviation in another policy is an error to be corrected at next review.

- **Portugal office labor law.** The specific local labor law obligations applicable to continuity activation for the Porto, Portugal office (including remote work mandates, notice requirements, and works council consultation obligations) have not been enumerated in PATRICK_NOTES. This policy assumes a 4-hour HR/Legal review window is sufficient; the actual obligations must be confirmed with Portuguese employment counsel and documented in the BCP/DR runbook before the next annual review.

- **Portugal GDPR/Schrems II data transfer constraints.** The specific data transfer mechanisms (e.g., Standard Contractual Clauses, adequacy decision status) applicable to continuity activation for the Portugal office are not enumerated in PATRICK_NOTES. The policy assumes these constraints are assessed as part of the annual threat register refresh (BC-02) and documented in the BCP/DR runbook. Legal must confirm the current transfer mechanism and any activation-specific obligations before the next annual review.

- **Electronic payment channel RTO/RPO targets.** PATRICK_NOTES designate ACH origination, wire transfer, debit/ATM card, mobile/RDC, and Zelle as highest-priority critical services but do not specify their RTO/RPO values. This policy defers those values to the Electronic Payment Systems Policy and the BIA/scope registry. The BIA annual update (BC-03) must confirm these values are current and consistent with the Electronic Payment Systems Policy.

- **SEV-2 through SEV-4 response timelines.** PATRICK_NOTES specify SEV-1 timelines (5-minute IC assignment, 15-minute initial comms) but are silent on SEV-2 through SEV-4. This policy assumes those timelines are documented in the BCP/DR runbook. The Business Continuity Manager must define and document them before the next annual review.

- **Backup RPO for non-critical tiers.** PATRICK_NOTES specify critical-tier RPO ≤15 minutes but are silent on RPO targets for lower tiers. This policy assumes lower-tier RPO targets are documented in the BIA/scope registry. The BIA annual update (BC-03) must confirm these values.

- **HMDA reporter status.** Pynthia Credit Union's HMDA reporter status has not been confirmed in PATRICK_NOTES. If Pynthia is a covered institution under [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003), HMDA LAR continuity (ensuring LAR data is preserved and recoverable) should be explicitly addressed in the BIA vital records section.

- **Disaster declaration authority.** PATRICK_NOTES name the CCO as program owner but do not enumerate who holds authority to formally declare a disaster and activate the BCP/DR plan. The reference policy (Sound Community Bank) names CEO, CFO, and VP IT. Pynthia must document its declaration authority matrix in the BCP/DR runbook before the next annual review; this policy assumes the CCO, CEO, and CTO/CIO hold that authority.

- **Community coordination.** The reference policy addresses coordination with local/state/federal disaster plans. This policy does not include a separate control for community coordination, as PATRICK_NOTES are silent on it. If NCUA examination guidance or California OES requirements impose specific community coordination obligations, a control should be added at the next review.
```
