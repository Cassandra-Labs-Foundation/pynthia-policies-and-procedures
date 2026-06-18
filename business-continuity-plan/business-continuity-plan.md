---
title: Business Continuity Plan Policy
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-18
next_review: 2027-06-18
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BCP, DR, Continuity, Resilience]
---

## General Policy Statement

Pynthia Credit Union, a California-chartered federally insured credit union operating nationwide across member-facing digital channels and with operational personnel in California, South Carolina, Texas, and Porto, Portugal, maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people. The program prioritizes human safety, continuity of critical member-facing services across all channels and partners, prudent recovery within defined RTO/RPO targets, and disciplined post-incident learning. It aligns with NCUA records-preservation and catastrophic-act-preparedness requirements (12 CFR Part 749), GLBA-aligned safeguards and incident response (12 CFR Part 748, Appendices A and B), and Board oversight duties (12 CFR § 701.4). Electronic payment channels are treated as highest-priority critical services; their channel-specific controls live in the Electronic Payment Systems Policy. Cross-border data-transfer and employment considerations for the Portugal office are addressed under BCP-02 and BCP-12.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger | Deadline | Content Reference | Control |
|---|---|---|---|---|
| SEV-1 incident detected | `incident.sev1_detected` | IC assigned ≤5 min; initial comms ≤15 min | Severity matrix, on-call rotation | [BCP-05](#bcp-05-monitoring-detection-and-severity) |
| Incident declared — first-hour stabilization | `incident.declared` | Sitrep v1 ≤30 min; 30–60 min cadence until contained | First-hour checklist | [BCP-06](#bcp-06-incident-declaration-and-initial-actions) |
| Privacy/security breach confirmed | `incident.security_confirmed` | Containment ≤1 hr; counsel ≤24 hr; NCUA notice per Part 748 App B | GLBA IR playbook | [BCP-10](#bcp-10-incident-response-privacysecurity) |
| Major core/cloud outage | `it.major_failure_detected` | IC ≤5 min; member status ≤15 min; failover per BIA tier | Outage runbook | [BCP-09](#bcp-09-major-it-failure-response) |
| Facility loss / remote activation | `facility.loss_declared` | Alternate/remote readiness ≤8 hr; full critical ops ≤24 hr | Remote posture, site readiness | [BCP-08](#bcp-08-alternate-site-and-remote-operations) |
| Data loss / crypto-lock | `backup.job_failed` | Critical RPO ≤15 min; restore tests quarterly | Tiered backup/restore matrix | [BCP-07](#bcp-07-data-backup-and-restore-rtorpo) |
| Absenteeism ≥30% or public-health trigger | `staffing.plan_activated` | Activate ≤24 hr | People continuity / pandemic plans | [BCP-12](#bcp-12-people-continuity-and-pandemic) |
| Annual enterprise exercise completed | `exercise.completed` | Board report ≤30 days | Exercise results, CAP | [BCP-04](#bcp-04-training-testing-and-exercises) |
| Post-incident review triggered | `incident.contained` | PIR draft ≤10 BD; CAP approved ≤30 days | PIR + CAP | [BCP-13](#bcp-13-post-incident-review-pir) |
| Communications activation | `comms.internal_alert_issued` | First internal alert ≤15 min; regulator notice per law | Contact trees, status-page playbook | [BCP-11](#bcp-11-communications-and-notification-tree) |
| Vendor BCP/DR evidence refresh | `vendor.bcp_evidence_due` | Annual refresh; exit/failover criteria defined | Vendor attestations, DR evidence | [BCP-14](#bcp-14-vendor-contingency-management) |
| Annual BCP policy Board approval | `bcp_annual.review_due` | Annual (enforced by Board calendar) | Living BCP policy document | [BCP-01](#bcp-01-governance-and-roles) |
| Annual threat-register refresh | `threat_register.refresh_due` | Annual or after major change | Threat register, geography factors | [BCP-02](#bcp-02-risk-assessment-hazards-by-region) |
| Annual BIA update | `bia_annual.review_due` | Annual; quarterly certification | BIA service catalog, RTO/RPO matrix | [BCP-03](#bcp-03-business-impact-analysis-bia) |

## BCP-01 — Governance & Roles {#bcp-01-governance-and-roles}

- **WHY (Reg cite):** The Board must approve and oversee the continuity program and key policies, delegating execution while retaining accountability ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)). NCUA catastrophic-act preparedness requires a documented, maintained recovery capability with named owners ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system maintains a living BCP/DR policy document with named owners and an Incident Management Team (IMT) roster. The Board approves the policy at least annually; a review timer warns before lapse and escalates if the review window passes. Management verifies the IMT roster quarterly via a recurring review task; succession paths are documented for all named IMT positions. Policy approval and roster edits are write-restricted to the Chief Compliance Officer and Board secretary roles. Where a quarterly roster verification finds a vacant succession role, a remediation task is opened automatically.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual Board approval cycle opens (`bcp_annual.review_due`) | Policy document + version (`bcp.document_id`, `bcp.document_version`), owner reference (`bcp.owner_ref`) | Board-approved BCP policy (`bcp.board_approved`) | 12 months (enforced by `bcp.board_approval_due_at`) |
  | Policy review approaching lapse (`bcp.review_warning_issued`) | Next-review date (`bcp.next_review_at`), review status (`bcp.review_status`) | Review warning + escalation record (`bcp.review_escalated`) | Warning issued 30 days before `bcp.board_approval_due_at` |
  | Quarterly IMT roster verification due (`imt.roster_review_due`) | IMT roster (`imt_roster.roster_ref`), succession matrix (`imt_roster.succession_matrix`) | Verified roster record (`imt_roster.verified`) | Quarterly |

- **ALERTS/METRICS:** Alert on policy-review aging past the next-review date (target zero lapsed approvals); track IMT roster verification on-time rate each quarter and flag any unresolved vacant succession roles.

## BCP-02 — Risk Assessment (Hazards by Region) {#bcp-02-risk-assessment-hazards-by-region}

- **WHY (Reg cite):** Catastrophic-act preparedness requires identifying threats that could interrupt operations and impair records ([12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749)). GLBA safeguards require a risk assessment of foreseeable threats to information security ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** The system maintains a threat register scoring each hazard by likelihood and impact, tagged by geography and refreshed at least annually or after a major operational or environmental change. Hazard profiles are maintained for each operating location: California (wildfire/smoke, earthquake, grid outage/PSPS, drought); South Carolina (hurricane/tropical storm, flood, tornado); Texas (tornado, severe storm, extreme heat, winter storm/grid outage); Porto, Portugal (flood, earthquake/seismic activity, extreme heat, European regulatory disruption). All locations share cyber, pandemic, and key-person risk. For the Portugal office, the threat register additionally addresses cross-border data-transfer constraints under GDPR/Schrems II and local labor-law implications that could affect incident response and personnel deployment. Hazard-watch feeds (weather services, cyber threat intelligence, vendor alerts) may raise an interim update outside the annual cycle. The threat register is write-restricted to the Business Continuity Manager and Compliance; Portugal-specific regulatory entries require Legal sign-off.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual refresh cycle opens (`threat_register.refresh_due`) | Threat catalog (`threat_register.threat_catalog`), geography tags (`threat_register.geography_factors`), likelihood/impact scores (`threat_register.likelihood`, `threat_register.impact`) | Updated threat register (`threat_register.updated`) | Annual |
  | Hazard watch or material change detected (`threat_register.interim_update_triggered`) | Hazard-feed detail (`threat_register.hazard_feed_detail`), watch flag (`threat_register.watch_raised`) | Interim register update (`threat_register.updated`) | On material change |
  | Portugal cross-border regulatory change identified (`threat_register.portugal_regulatory_updated`) | GDPR/Schrems II assessment (`threat_register.crossborder_assessment`), labor-law review (`threat_register.laborlaw_review`) | Portugal cross-border entry updated (`threat_register.updated`) | On material change; reviewed annually |

- **ALERTS/METRICS:** Alert on register refresh aging past annual cycle (target zero stale registers); track count of hazards with scores older than 12 months and number of interim updates triggered per quarter; flag Portugal cross-border entry if not reviewed in the current annual cycle.

## BCP-03 — Business Impact Analysis (BIA) {#bcp-03-business-impact-analysis-bia}

- **WHY (Reg cite):** Recovery of critical functions and preservation of vital records require cataloguing services, dependencies, and recovery sequencing ([12 CFR Part 749 and Appendix B](https://www.ecfr.gov/current/title-12/part-749)). Identification of critical member-serving functions supports the Board oversight obligation ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).

- **SYSTEM BEHAVIOR:** The system catalogs services, ranks each by member impact and regulatory dependency, identifies vital records, and sets RTO/RPO and recovery sequence. The BIA is updated at least annually and certified quarterly for material changes; provisional criticality tiers are assigned when a new service is onboarded pending full analysis. Electronic payment channels (ACH origination, wire, debit/ATM, mobile/RDC, Zelle) are pre-tagged highest-priority critical given direct member impact and regulatory dependency; authoritative channel-level detail lives in the Electronic Payment Systems Policy. BIA criticality tiers and RTO/RPO values are write-restricted to the Business Continuity Manager; provisional tier assignments may be made by IT/SRE with a review task automatically opened.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual BIA update cycle opens (`bia_annual.review_due`) | Service catalog (`bia.service_catalog`), member-impact scores (`bia.member_impact`), regulatory-dependency scores (`bia.reg_dependency`), RTO/RPO matrix (`bia.rto_rpo_matrix`) | Updated BIA (`bia.updated`) | Annual |
  | Quarterly change certification due (`bia.certification_due`) | Service-catalog deltas (`bia.service_catalog_delta`), changed RTO/RPO items (`bia.rto_changed`, `bia.rpo_changed`) | Certified BIA (`bia.certified`) | Quarterly |
  | New service onboarded before full BIA (`bia.provisional_tier_assigned`) | Provisional tier (`bia.criticality`), service reference (`bia.service_ref`) | Provisional tier record (`bia.provisional_tier_assigned`) and review task | At onboarding; full review enforced by `bia.review_due` |

- **ALERTS/METRICS:** Alert on BIA certification aging past quarterly cycle; track count of services missing RTO/RPO values (target zero) and confirm payment channels are at highest tier each cycle.

## BCP-04 — Training, Testing & Exercises {#bcp-04-training-testing-and-exercises}

- **WHY (Reg cite):** A maintained, tested recovery capability is required to ensure operability after a catastrophic act ([12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749)); Board oversight requires reporting of program effectiveness ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).

- **SYSTEM BEHAVIOR:** The system schedules and runs at least one enterprise exercise per year, which may be an orientation exercise, tabletop, or functional drill. Completion is tracked; identified gaps feed a corrective action plan; results are reported to the Board within 30 days of exercise completion. Failed exercise elements open a remediation task automatically with an owner and due date drawn from the CAP. Exercise scheduling and Board reporting are write-restricted to the Business Continuity Manager; exercise results may be logged by any IMT participant.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual exercise schedule opens (`exercise.scheduled`) | Exercise type and objectives (`exercise.type`, `exercise.objectives`), participant roster (`exercise.roster`) | Scheduled exercise record (`exercise.scheduled`) | Annual (enforced by `exercise.annual_due`) |
  | Exercise completed (`exercise.completed`) | After-action results (`exercise.aar_results`), gap list (`exercise.gaps_identified`) | AAR published + CAP items opened (`exercise.aar_published`, `cap.item_created`) | Board report ≤30 days (enforced by `exercise_board.report_due`) |
  | Exercise element failed (`exercise.element_failed`) | Remediation description (`exercise.remediation_description`), assigned owner (`exercise.remediation_owner`) | Corrective action item opened (`cap.item_created`) | Per CAP schedule (enforced by `cap.item_due_at`) |

- **ALERTS/METRICS:** Alert on Board-exercise report aging past 30 days (target zero); track exercise completion rate per year and count of open exercise-derived CAP items past their due date.

## BCP-05 — Monitoring, Detection & Severity {#bcp-05-monitoring-detection-and-severity}

- **WHY (Reg cite):** GLBA safeguards require monitoring systems and a documented incident-response capability to detect and respond to security events affecting member information ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)); timely detection supports the notification obligation ([12 CFR § 748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

- **SYSTEM BEHAVIOR:** The system operates central on-call monitoring with a SEV-1 to SEV-4 severity matrix and integrated weather, cyber, and vendor-alert feeds. On a SEV-1 detection, an Incident Commander is assigned within 5 minutes and initial communications are issued within 15 minutes. Lower-severity events are triaged per the severity matrix without mandatory IC assignment. Severity downgrade or upgrade requires recorded justification. Severity assignment and IC designation are write-restricted to the on-call IMT lead. A silent SIEM source constitutes an automatic SEV-2 until confirmed healthy.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monitor or feed signal received (`incident.signal_received`) | Detection source (`incident.detection_source`), alert detail (`incident.alert_detail`) | Triaged incident candidate (`incident.detected`) | Per triage SLA (enforced by `incident.triage_due_at`) |
  | SEV-1 confirmed (`incident.sev1_detected`) | Severity assignment (`incident.severity`), on-call IC rotation (`incident.ic_rotation`) | IC assigned (`incident.ic_assigned`) | ≤5 min (enforced by `incident.ic_assignment_timer`) |
  | IC assigned, initial comms required (`incident.ic_assigned`) | Holding statement (`comms.holding_statement`), contact tree reference (`comms.contact_tree_ref`) | Initial comms issued (`comms.initial_issued`) | ≤15 min (enforced by `comms.initial_timer`) |

- **ALERTS/METRICS:** Track IC-assignment latency for SEV-1 events (target ≤5 min) and initial-comms latency (target ≤15 min); alert on any SIEM or monitoring source going silent for more than 5 minutes.

## BCP-06 — Incident Declaration & Initial Actions {#bcp-06-incident-declaration-and-initial-actions}

- **WHY (Reg cite):** A documented incident-response program with defined initial actions and escalation paths is required under GLBA safeguards ([12 CFR Part 748, Appendix A, Section III.B and Appendix B](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** On incident declaration, the system drives a first-hour checklist covering safety, stabilization, scope assessment, role assignment, notification, and cadence setting. A Situation Report (Sitrep) v1 is produced within 30 minutes of declaration and a 30–60 minute Sitrep cadence is maintained until the incident is stabilized or contained. Checklist completion is tracked step-by-step; incomplete checklist items trigger an escalation after 60 minutes. Declaration authority and Sitrep publication are write-restricted to the Incident Commander and IMT lead. In a multi-region event, the IC may delegate regional sub-leads who produce local Sitreps rolled up to the primary.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident declared (`incident.declared`) | First-hour checklist (`incident.checklist_first_hour`), initial scope assessment (`incident.scope_initial`), IMT roles (`incident.ic_assigned`) | First-hour checklist completion record (`incident.first_hour_completed`) | First hour (checklist-driven) |
  | Sitrep v1 required after declaration (`incident.declared`) | Incident timeline (`incident.timeline`), impact summary (`incident.impact_summary`) | Sitrep v1 issued (`sitrep.issued`) | ≤30 min (enforced by `sitrep.v1_timer`) |
  | Ongoing stabilization cadence (`sitrep.issued`) | Updated status and timeline (`incident.status`, `incident.timeline`) | Cadence Sitrep issued (`sitrep.issued`) | Every 30–60 min until `incident.contained` (enforced by `sitrep.cadence_timer`) |

- **ALERTS/METRICS:** Track Sitrep v1 latency (target ≤30 min) and cadence adherence rate; alert on any active incident with no Sitrep update within the cadence window.

## BCP-07 — Data Backup & Restore; RTO/RPO {#bcp-07-data-backup-and-restore-rtorpo}

- **WHY (Reg cite):** Vital records must be preserved and recoverable after a catastrophic act with tested restoration capability ([12 CFR Part 749 and Appendix B](https://www.ecfr.gov/current/title-12/part-749)). Maintenance of member information under the information-security program reinforces this obligation ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** The system maintains tiered, immutable, offsite backups with critical RPO ≤ 15 minutes monitored continuously. Restore tests are performed for each backup tier quarterly using a dedicated test environment; results are logged with pass/fail evidence. Crypto-lock and ransomware events use clean point-in-time restores selected prior to compromise. A failed backup job opens a remediation task automatically; a missed quarterly restore test escalates to the Business Continuity Manager. Backup tier configuration and restore execution are write-restricted to IT/SRE; restore verification sign-off requires the Business Continuity Manager or CCO for tier-1 systems.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Backup job completes or fails (`backup.job_completed`, `backup.job_failed`) | Job detail (`backup.job_detail`), tier configuration (`backup.tier_config`), RPO measurement (`backup.rpo_measured`) | Backup verification record; remediation task if failed (`backup.verified`, `backup.job_remediated`) | Critical RPO ≤15 min (enforced by `backup.rpo_monitor`) |
  | Quarterly restore test due (`backup.restore_test_due`) | Test environment reference (`backup.test_env_ref`), point-in-time selection (`restore.point_selected`) | Restore test result (`backup.restore_verified`) | Quarterly |
  | Crypto-lock or data-loss recovery initiated (`restore.initiated`) | Clean restore point (`restore.point_validated`), RTO target (`restore.rto_target`) | Restore completed and verified (`restore.completed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |

- **ALERTS/METRICS:** Alert on RPO breach exceeding 15 minutes and on any unremediated backup job failure (target zero); track per-tier restore-test pass rate each quarter.

## BCP-08 — Alternate Site & Remote Operations {#bcp-08-alternate-site-and-remote-operations}

- **WHY (Reg cite):** Continuity of critical operations after facility loss is a core catastrophic-act-preparedness requirement ([12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749)). The obligation encompasses personnel, vital records, and critical-function access.

- **SYSTEM BEHAVIOR:** The system maintains a pre-approved remote posture (VPN, MFA) and documented hot/virtual site options with minimum staffing lists per location. On a facility-loss declaration, the system drives alternate-site or remote readiness within 8 hours and full critical-operations resumption within 24 hours. Site capacity is validated on a recurring schedule. For multi-location events, the program accommodates concurrent activation across California, South Carolina, Texas, or Portugal sites; Portugal activations must additionally account for local labor-law requirements and cross-border data-transfer constraints before routing member data through alternate infrastructure. Remote-access configuration and site designation are write-restricted to IT/SRE and the Business Continuity Manager.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Facility loss declared (`facility.loss_declared`) | Remote-access configuration (`site.remote_config`), minimum staffing list (`staffing.minimum_staffing_list`), site readiness checklist (`site.readiness_checklist`) | Site readiness confirmed (`site.readiness_confirmed`) | ≤8 hr (enforced by `site.readiness_timer`) |
  | Alternate site ready, critical ops resumption (`site.readiness_confirmed`) | Critical-service list (`bia.criticality`), resumption status per service (`site.critical_ops_status`) | Critical ops resumed record (`site.critical_ops_resumed`) | ≤24 hr (enforced by `site.resumption_timer`) |
  | Periodic capacity validation due (`site.capacity_test_due`) | Capacity targets (`site.capacity_targets`), test result (`site.capacity_test_result`) | Capacity validation record (`site.capacity_validated`) | Recurring per program calendar |

- **ALERTS/METRICS:** Alert on alternate-site readiness records aging past the periodic validation schedule; track time-to-readiness and time-to-full-critical-ops against the 8-hour and 24-hour targets across all activated sites.

## BCP-09 — Major IT Failure Response {#bcp-09-major-it-failure-response}

- **WHY (Reg cite):** GLBA safeguards require response and recovery for events affecting critical information systems ([12 CFR Part 748, Appendix A and Appendix B](https://www.ecfr.gov/current/title-12/part-748)); recovery of critical functions is required under records-preservation and continuity rules ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)). Detailed cyber runbooks and security-control design live in the Information Security Policy.

- **SYSTEM BEHAVIOR:** The system maintains a runbook for core-system and cloud-platform outages covering detect, isolate blast radius, rollback/failover, and communicate phases. On a major IT failure detection, an Incident Commander is assigned within 5 minutes, member-facing status is issued within 15 minutes, and failover proceeds per BIA tier priority. Rollback and failover execution require dual-control approval to prevent unauthorized or accidental production changes. Failover decisioning and rollback execution are write-restricted to IT/SRE with dual-control enforcement; IC designation is write-restricted to the on-call IMT lead.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Major IT failure detected (`it.major_failure_detected`) | Outage runbook reference (`it.outage_runbook_ref`), blast-radius assessment (`it.blast_radius_scope`) | IC assigned (`incident.ic_assigned`) | IC ≤5 min (enforced by `incident.ic_assignment_timer`) |
  | Member-facing impact confirmed (`incident.member_impact_confirmed`) | Status-page playbook reference (`comms.statuspage_playbook_ref`) | Member status issued (`comms.member_status_issued`) | ≤15 min (enforced by `comms.initial_timer`) |
  | Failover or rollback required (`it.failover_decided`) | BIA tier (`bia.criticality`), dual-control approval (`it.dual_control_approval`) | Failover executed and logged (`it.failover_executed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |

- **ALERTS/METRICS:** Track IC-assignment latency (target ≤5 min) and member-status latency (target ≤15 min) for major IT failures; alert on any rollback or failover executed without a recorded dual-control approval (target zero).

## BCP-10 — Incident Response (Privacy/Security) {#bcp-10-incident-response-privacysecurity}

- **WHY (Reg cite):** GLBA safeguards require containment, eradication, recovery, forensics, and notification decisioning with service-provider coordination for security incidents ([12 CFR Part 748, Appendix A, Section III and Appendix B](https://www.ecfr.gov/current/title-12/part-748)); NCUA requires notification of reportable cyber incidents ([12 CFR § 748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)). Member breach-notice mechanics in detail live in the Privacy Policy.

- **SYSTEM BEHAVIOR:** The system implements GLBA-aligned containment, eradication, recovery, forensics, and notification decisioning with service-provider coordination. Containment begins within 1 hour of a confirmed security incident; counsel is consulted within 24 hours; reportability and NCUA notification are determined per applicable law. Where the incident is reportable, the NCUA notice is driven within the regulatory window. Criminal activity suspicion triggers a SAR referral workflow coordinated with the BSA Officer. Reportability determinations and member-notice content are write-restricted to Compliance and Legal. For incidents involving the Portugal office or European member data, GDPR breach-notification obligations are assessed in parallel.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Security incident confirmed (`incident.security_confirmed`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`) | Containment started (`incident.contained`) | ≤1 hr (enforced by `incident.containment_timer`) |
  | Legal review required (`incident.legal_review_triggered`) | Facts and timeline (`incident.facts`, `incident.timeline`), reportability assessment (`incident.reportability_assessment`) | Legal review record (`incident.legal_review`) | ≤24 hr (enforced by `incident.legal_review_timer`) |
  | Incident determined reportable (`incident.material_flagged`) | Reportability determination (`incident.reportability_assessment`), NCUA notice parameters (`incident.ncua_notice_due_at`) | NCUA notification issued (`incident.ncua_notified`) | Per § 748.1 (enforced by `incident.ncua_notice_due_at`) |
  | Member data impact confirmed (`incident.member_impact_confirmed`) | Notice template (`incident.member_notice_template`), notification determination (`incident.notification_determined`) | Member notices sent (`incident.member_notices_sent`) | Per applicable breach law (enforced by `incident.notification_due_at`) |

- **ALERTS/METRICS:** Alert on NCUA-notification aging past the regulatory clock (target zero missed notices); track containment-start latency (target ≤1 hr) and counsel-consult latency (target ≤24 hr).

## BCP-11 — Communications & Notification Tree {#bcp-11-communications-and-notification-tree}

- **WHY (Reg cite):** Effective internal and external communication and timely regulator notification are integral to the documented response and recovery capability ([12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)); regulator contact verification supports timely notice under the notification obligation ([12 CFR § 748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

- **SYSTEM BEHAVIOR:** The system maintains contact trees for employees (across all four locations), Board, regulators, vendors, and approved media spokespersons, with predefined status-page playbooks and backup communication channels in the event primary platforms fail. The first internal alert is issued within 15 minutes of activation. Regulator notifications are issued per law and policy. Regulator contacts are verified on a recurring basis; stale entries trigger a remediation task. Comms scripts and regulator notifications are write-restricted to CCO and CEO-approved spokespersons. For multi-region or Portugal-involved incidents, communications are coordinated with local HR and Legal given labor-law constraints on employee communications.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Communications activation required (`comms.activation_triggered`) | Contact tree (`comms.contact_tree`), stakeholder matrix (`comms.stakeholder_matrix`) | Internal alert issued (`comms.internal_alert_issued`) | ≤15 min (enforced by `comms.initial_timer`) |
  | Primary comms platform failure (`comms.platform_failed`) | Backup channel plan (`comms.backup_channel_plan`) | Backup channel activated (`comms.backup_activated`) | Immediately on failure |
  | Regulator notification required (`incident.regulator_notification_required`) | Verified regulator contacts (`comms.regulator_contacts`), notice criteria met (`incident.reportability_assessment`) | Regulator notice sent (`incident.regulator_notified`) | Per law (enforced by `incident.regulator_notification_due`) |
  | Periodic regulator contact verification due (`comms.contact_verification_due`) | Regulator contact roster (`comms.regulator_contacts`) | Verified contacts record (`comms.regulator_contacts_verified`) | Recurring per program calendar |

- **ALERTS/METRICS:** Track first-internal-alert latency (target ≤15 min); alert on stale regulator contacts and on any activation that lacked a logged backup-channel fallback when the primary platform was unavailable.

## BCP-12 — People Continuity & Pandemic {#bcp-12-people-continuity-and-pandemic}

- **WHY (Reg cite):** Continuity of critical operations through people-availability events is required under catastrophic-act preparedness ([12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749)); Board oversight of continuity arrangements applies ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).

- **SYSTEM BEHAVIOR:** The system identifies essential roles across all locations, supports cross-training records, and implements split-team and remote-work plans. Staffing plans activate within 24 hours of an absenteeism trigger (≥30% enterprise-wide or per critical function) or a public-health authority trigger. Staffing readiness is reviewed on a recurring basis. For the Portugal office, activation of emergency staffing measures must comply with Portuguese labor law and EU employment regulations, including mandatory consultation requirements; the program documents a Portugal-specific staffing annex coordinated with local legal counsel. Staffing-plan activation and essential-role designation are write-restricted to HR and the Business Continuity Manager.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Absenteeism ≥30% or public-health trigger (`staffing.plan_activation_triggered`) | Availability measurement (`staffing.availability_measurement`), absenteeism threshold check (`staffing.absenteeism_threshold`), split-team plan (`staffing.split_team_plan`) | Staffing plan activated (`staffing.plan_activated`) | ≤24 hr (enforced by `staffing.activation_timer`) |
  | Periodic staffing readiness review due (`staffing.readiness_review_due`) | Critical-role map (`staffing.critical_role_map`), backup-coverage map (`staffing.backup_coverage_map`) | Readiness review record (`staffing_readiness.reviewed`) | Recurring per program calendar |
  | Coverage attestation required (`staffing.coverage_attestation_due`) | Coverage roster (`staffing.split_team_plan`) | Coverage attestation record (`staffing.coverage_attested`) | Per review cycle |

- **ALERTS/METRICS:** Track staffing-plan activation latency (target ≤24 hr) and essential-role coverage ratio; alert on readiness review aging and on any essential role without a documented backup.

## BCP-13 — Post-Incident Review (PIR) {#bcp-13-post-incident-review-pir}

- **WHY (Reg cite):** A maintained program requires learning from events and correcting identified weaknesses to preserve long-term operability ([12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system conducts a Post-Incident Review (PIR) for every declared incident, covering root cause, what worked, what failed, and a corrective action plan. The PIR is drafted within 10 business days of containment and reviewed with relevant stakeholders; the CAP is approved within 30 days; corrective items are tracked through to retest verification and formal closure. PIR findings that implicate regulatory reporting or prior incident characterizations are escalated to Compliance and Legal before closure. PIR authorship and CAP approval are write-restricted to the Business Continuity Manager and CCO.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident contained (`incident.contained`) | Root cause (`incident.root_cause`), incident timeline (`incident.timeline`), description and facts (`incident.description`, `incident.facts`) | PIR draft (`incident.pir_drafted`) | ≤10 business days (enforced by `incident.pir_draft_due_at`) |
  | PIR reviewed, CAP items identified (`incident.pir_reviewed`) | CAP items and owners (`cap.item_description`, `cap.item_owner`) | CAP opened and approved (`cap.approved`) | ≤30 days (enforced by `cap.approval_due_at`) |
  | Corrective item retest (`cap.retest_scheduled`) | Retest plan (`cap.retest_plan`), closure evidence (`cap.closure_evidence`) | Retest verified; item closed (`cap.item_completed`) | Per CAP item schedule (enforced by `cap.item_due_at`) |

- **ALERTS/METRICS:** Alert on PIR-draft aging past 10 business days and CAP approval aging past 30 days (targets zero); track count of open CAP items past their due date and retest pass rate.

## BCP-14 — Vendor Contingency Management {#bcp-14-vendor-contingency-management}

- **WHY (Reg cite):** Service-provider arrangements supporting critical functions must be overseen and coordinated for incident response and continuity ([12 CFR Part 748, Appendix A, Section III.D and Appendix B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)). General vendor onboarding and due diligence live in the Third-Party Risk Policy.

- **SYSTEM BEHAVIOR:** The system maintains vendor BCP/IR attestations, SLAs, RTO/RPO commitments, and DR test evidence for critical vendors; refreshes evidence at least annually; defines exit/failover criteria; and assesses diversification against shared failure modes. A vendor outage or breach automatically opens a vendor-incident track linked to the main incident record. Attestation gaps for critical vendors trigger an escalation to Vendor Risk and the Business Continuity Manager. DR attestation refresh and failover criteria are write-restricted to Vendor Risk and the Business Continuity Manager.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual vendor BCP/DR evidence cycle opens (`vendor_bcp.refresh_due`) | Vendor DR plan (`vendor_bcp.dr_plan`), DR test results (`vendor_dr.test_results`), RTO/RPO commitments (`vendor_bcp.rto_rpo`) | DR attestation confirmed (`vendor_dr.confirmed`) | Annual |
  | Exit and failover criteria set or reviewed (`vendor_bcp.exit_criteria_due`) | Failover criteria (`vendor_bcp.failover_criteria`), exit plan reference (`vendor_bcp.exit_plan_ref`) | Exit/failover criteria record (`vendor_bcp.exit_criteria_set`) | Per annual program cycle |
  | Vendor outage or breach detected (`vendor_bcp.outage_detected`) | Impacted scope (`vendor_bcp.affected_scope`), incident detail (`vendor_bcp.breach_detail`) | Vendor incident logged and triaged (`vendor_bcp.incident_logged`) | Triage per SLA (enforced by `vendor_bcp.incident_triage_due`) |
  | Concentration and shared-failure-mode review due (`vendor_bcp.concentration_review_due`) | Dependency map (`vendor_bcp.dependency_map`), concentration assessment (`vendor_bcp.concentration_assessment`) | Diversification assessment logged (`vendor_bcp.diversification_assessed`) | Recurring per program calendar |

- **ALERTS/METRICS:** Alert on DR-attestation aging past the annual cycle and on critical-vendor outage alerts; track percentage of critical vendors with current DR evidence (target 100%) and vendor-incident triage on-time rate.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for program maintenance, control operation, and Board reporting.
- **Approver(s):** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Business Continuity Manager, Incident Management Team (IMT), IT/SRE, HR, Vendor Risk, and the Board of Directors (oversight and approval per [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).
- **Review cadence:** Board approves the policy at least annually (BCP-01); IMT roster verified quarterly; BIA updated annually and certified quarterly (BCP-03); threat register refreshed annually or on major change (BCP-02); at least one enterprise exercise per year with Board reporting within 30 days (BCP-04).
- **Cross-references:** Information Security Policy (cyber IR runbooks, security control design); Third-Party Risk Policy (vendor onboarding, due diligence, oversight); Privacy Policy (member breach-notification mechanics); Record Retention Policy (vital-records retention schedules outside continuity); Enterprise Risk Management Policy (risk taxonomy and aggregation); Electronic Payment Systems Policy (payment channel-specific controls, ACH/wire dual control, payment authentication).
- **Examiner deadline view:** see the [Timing Matrix](#timing-matrix).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The resources, fields, events, and timers referenced in the EVENTS tables throughout this document (e.g., `incident.*`, `backup.*`, `restore.*`, `bia.*`, `bia_annual.*`, `bcp.*`, `bcp_annual.*`, `threat_register.*`, `comms.*`, `sitrep.*`, `staffing.*`, `staffing_readiness.*`, `vendor_bcp.*`, `vendor_dr.*`, `site.*`, `exercise.*`, `exercise_board.*`, `cap.*`, `it.*`, `imt_roster.*`) are drawn from registered core-API vocabulary where a fit exists and otherwise composed following the registered subject.verb grammar. All names are the target naming scheme and will be confirmed by engineering before the next annual review.
- **Charter type and NCUA applicability.** This policy treats Pynthia Credit Union as a California-chartered, federally insured credit union subject to 12 CFR Parts 748 and 749 and § 701.4. Confirm with Legal and NCUA whether California-specific state-chartered credit union overlays (DFPI regulations) apply in addition to federal requirements.
- **Portugal cross-border and labor obligations.** BCP-02 and BCP-12 identify GDPR/Schrems II data-transfer constraints and Portuguese labor-law obligations as hazard and activation factors. The specific current legal basis for cross-border data transfers and the procedural requirements for emergency staffing measures in Portugal must be confirmed with local legal counsel and are subject to change on European regulatory action.
- **Reportable-incident notification window.** BCP-10 assumes the NCUA reportable-cyber-incident notification obligation under § 748.1(c) requires notice as soon as possible and no later than 72 hours after reasonable belief. Confirm the exact trigger definition, hour count, and any California state breach-notification overlay (Cal. Civ. Code § 1798.82) that may impose an earlier or broader obligation.
- **RPO/RTO targets are policy inputs, not yet system-validated.** Critical RPO ≤ 15 minutes (BCP-07), alternate-site readiness ≤ 8 hr / full critical ops ≤ 24 hr (BCP-08), IC assignment ≤ 5 min / initial comms ≤ 15 min (BCP-05, BCP-09), and containment ≤ 1 hr (BCP-10) are taken from program design inputs; confirm these match contractual SLAs and the BIA-derived tier matrix once `bia.rto_rpo_matrix` is populated.
- **Payment-channel tier designation.** BCP-03 pre-tags electronic payment channels as highest-priority critical; the authoritative channel list and any tier nuances are owned by the Electronic Payment Systems Policy and must be reconciled with the BIA service catalog.
- **Absenteeism trigger threshold and measurement basis.** The ≥30% absenteeism trigger (BCP-12) is taken from program design inputs. Confirm with HR whether the threshold applies enterprise-wide, per critical function, or per location, and whether public-health triggers (e.g., government-declared emergency) supersede the percentage threshold independently.
