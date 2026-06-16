---
title: Business Continuity Plan Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BCP, DR, Continuity, Resilience]
---

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people. The program prioritizes human safety, continuity of critical member-facing services across all channels and partners, prudent recovery within defined RTO/RPO targets, and disciplined post-incident learning. It aligns with NCUA records-preservation and catastrophic-act-preparedness requirements (12 CFR Part 749), GLBA-aligned safeguards and incident response (12 CFR Part 748, Appendix A and Appendix B), and Board oversight duties (12 CFR § 701.4). Electronic payment channels are treated as highest-priority critical services; their channel-specific controls live in the Electronic Payment Systems Policy.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| SEV-1 incident detected by on-call/monitors | SEV-1 detected (`incident.sev1_detected`) | IC assigned in 5 min; initial comms in 15 min | Severity matrix, on-call rotation | [BCP-05](#bcp-05-monitoring-detection-and-severity) |
| Incident declared; first-hour stabilization | Incident declared (`incident.declared`) | Sitrep v1 in 30 min; 30–60 min cadence | First-hour checklist | [BCP-06](#bcp-06-incident-declaration-and-initial-actions) |
| Privacy/security breach suspected | Security incident confirmed (`incident.security_confirmed`) | Containment in 1 hr; counsel in 24 hr; NCUA notice per Part 748 App B | GLBA IR playbook | [BCP-10](#bcp-10-incident-response-privacy-security) |
| Major core/cloud outage | Major IT failure detected (`it.major_failure_detected`) | IC in 5 min; member status in 15 min; failover per BIA tier | Outage runbook | [BCP-09](#bcp-09-major-it-failure-response) |
| Facility loss / remote activation | Facility loss declared (`facility.loss_declared`) | Alternate/remote readiness in 8 hr; full critical ops in 24 hr | Remote posture, site readiness | [BCP-08](#bcp-08-alternate-site-and-remote-operations) |
| Data loss / crypto-lock | Backup job failure or restore need (`backup.job_failed`) | Critical RPO ≤ 15 min; restore tests quarterly | Tiered backup/restore matrix | [BCP-07](#bcp-07-data-backup-and-restore-rto-rpo) |
| Absenteeism ≥30% or public-health trigger | Staffing plan activation needed (`staffing.plan_activated`) | Activate within 24 hr | People continuity / pandemic plans | [BCP-12](#bcp-12-people-continuity-and-pandemic) |
| Enterprise exercise completed | Exercise completed (`exercise.completed`) | Board report within 30 days | Exercise results, CAP | [BCP-04](#bcp-04-training-testing-and-exercises) |
| Post-incident review | Incident contained (`incident.contained`) | PIR draft in 10 BD; CAP approved in 30 days | PIR + CAP | [BCP-13](#bcp-13-post-incident-review) |
| Communications activation | Internal alert needed (`comms.internal_alert_issued`) | First internal alert in 15 min; regulator notice per law | Contact trees, status-page playbook | [BCP-11](#bcp-11-communications-and-notification-tree) |
| Vendor contingency evidence refresh | Annual vendor BCP/DR cycle (`vendor.bcp_evidence_due`) | Annual refresh; exit/failover criteria defined | Vendor attestations, DR evidence | [BCP-14](#bcp-14-vendor-contingency-management) |

## BCP-01 — Governance & Roles  {#bcp-01-governance-and-roles}

- **WHY (Reg cite):** The Board must approve and oversee the continuity program and key policies, and may delegate execution while retaining accountability ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)). NCUA catastrophic-act preparedness requires a documented, maintained recovery capability ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system maintains a living BCP/DR policy document with named owners and an Incident Management Team (IMT) roster. The Board approves the policy at least annually; a review timer warns before lapse and escalates if the review window passes. Management verifies the IMT roster quarterly via a recurring review task. Policy approval and roster edits are write-restricted to the Chief Compliance Officer and Board secretary roles.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual Board approval cycle opens (`governance.board_cycle_opened`) | Policy document + version (`policy.document_id`, `policy.document_version`), owner (`policy.owner_ref`) | Board-approved BCP policy (`policy.board_approved`) | 12 months (enforced by `policy.board_approval_due_at`) |
  | Policy nearing review lapse (`policy.review_warning_issued`) | Next review date (`policy.next_review_at`), review status (`policy.review_lapsed`) | Review warning + escalation (`policy.review_completed`) | Warning at `policy.review_warning_at`; due at `policy.review_due_at` |
  | Quarterly IMT roster verification (`imt.roster_verified`) | IMT roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`) | Verified roster record (`imt.roster_verified`) | Quarterly (enforced by `imt.roster_review_due`) |

- **ALERTS/METRICS:** Alert on policy review aging (`alert.policy_review_aging`) and target zero lapsed approvals; track IMT roster verification on-time rate each quarter.

## BCP-02 — Risk Assessment (Hazards by Region)  {#bcp-02-risk-assessment-hazards-by-region}

- **WHY (Reg cite):** Catastrophic-act preparedness requires identifying threats that could interrupt operations and impair records ([12 CFR Part 749, App B](https://www.ecfr.gov/current/title-12/part-749)). GLBA safeguards require a risk assessment of foreseeable threats ([12 CFR Part 748, App A](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** The system maintains a threat register scoring each hazard (wildfire/smoke, earthquake, tornado, flood, grid outage, cyber, pandemic) by likelihood and impact, tagged by geography. The register is refreshed at least annually and on interim major change. Hazard watch feeds (weather/cyber/vendor) can raise an interim update. The threat register is write-restricted to the Business Continuity Manager and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual refresh cycle opens (`threat_register.updated`) | Threat catalog (`risk.threat_catalog`), geography factors (`risk.geography_factors`), likelihood/impact (`threat.likelihood`, `threat.impact`) | Updated threat register (`threat_register.updated`) | Annual (enforced by `threat_register.refresh_due`) |
  | Hazard feed raises a watch (`facility.schedule_drift_detected`) | Hazard feed detail (`hazard.feed_detail`), watch flag (`hazard.watch_raised`) | Interim register update (`threat_register.updated`) | On material change (interim `threat_register.interim_update`) |

- **ALERTS/METRICS:** Alert on register refresh aging; track count of hazards with stale scores (target zero) and interim updates triggered per quarter.

## BCP-03 — Business Impact Analysis (BIA)  {#bcp-03-business-impact-analysis-bia}

- **WHY (Reg cite):** Recovery of critical functions and preservation of vital records require cataloguing services, dependencies, and recovery sequencing ([12 CFR Part 749 and App B](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system catalogs services, ranks each by member impact and regulatory dependency, identifies vital records, and sets RTO/RPO and recovery sequence. The BIA is updated at least annually and certified quarterly for changes; provisional criticality tiers are assigned when a new service is onboarded pending full analysis. Electronic payment channels (ACH origination, wire, debit/ATM, mobile/RDC, Zelle) are pre-tagged highest-priority critical given direct member impact and regulatory dependency (see Electronic Payment Systems Policy). BIA criticality tiers and RTO/RPO values are write-restricted to the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual BIA update cycle (`bia.updated`) | Criticality (`bia.criticality`), member impact (`bia.member_impact`), reg dependency (`bia.reg_dependency`), RTO/RPO matrix (`dr.rto_rpo_matrix`) | Updated BIA (`bia.updated`) | Annual (enforced by `bia.annual_update_due`) |
  | Quarterly change certification (`bia.certified`) | Service catalog deltas (`scope_registry.change_description`), RTO/RPO items (`scope_registry.item.rto`, `scope_registry.item.rpo`) | Certified BIA (`bia.certified`) | Quarterly (enforced by `bia.certification_due`) |
  | New service onboarded before full BIA (`bia.provisional_tier_assigned`) | Provisional tier (`bia.criticality`), service ref (`eps.service.id`) | Provisional tier record (`bia.provisional_tier_assigned`) | At onboarding (review enforced by `bia.review_due`) |

- **ALERTS/METRICS:** Alert on BIA certification aging; track count of services missing RTO/RPO (target zero) and payment channels confirmed at highest tier each cycle.

## BCP-04 — Training, Testing & Exercises  {#bcp-04-training-testing-and-exercises}

- **WHY (Reg cite):** A maintained, tested recovery capability is required to ensure operability after a catastrophic act ([12 CFR Part 749, App B](https://www.ecfr.gov/current/title-12/part-749)); Board oversight requires reporting of program effectiveness ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).

- **SYSTEM BEHAVIOR:** The system schedules and runs at least one enterprise exercise per year (orientation, tabletop, or functional), tracks completion, feeds identified gaps to a corrective action plan, and reports results to the Board within 30 days of completion. Failed exercise elements open a remediation task with an owner and due date. Exercise scheduling and Board reporting are write-restricted to the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual exercise scheduled (`exercise.scheduled`) | Objectives (`drill.objectives`), roster (`drill.roster`) | Scheduled exercise record (`exercise.scheduled`) | Annual (enforced by `dr.exercise_due`) |
  | Exercise completed (`exercise.completed`) | After-action results (`drill.failure_detail`), affected capability (`drill.affected_capability`) | AAR + CAP items (`drill.aar_published`, `cap.item_created`) | Board report in 30 days (enforced by `exercise.board_report_due`) |
  | Exercise element failed (`drill.element_failed`) | Remediation item (`drill.remediation_item`), owner (`drill.remediation_owner`) | Corrective plan opened (`drill.corrective_plan_opened`) | Per CAP (enforced by `drill.remediation_due`) |

- **ALERTS/METRICS:** Alert on Board-report aging past 30 days (target zero); track exercise completion rate and open exercise CAP items past due.

## BCP-05 — Monitoring, Detection & Severity  {#bcp-05-monitoring-detection-and-severity}

- **WHY (Reg cite):** GLBA safeguards require monitoring systems and a documented incident-response capability to detect and respond to events ([12 CFR Part 748, App A and App B](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** The system operates central on-call with a SEV-1 to SEV-4 severity matrix and weather/cyber/vendor monitors that emit signals. On a SEV-1 detection, an Incident Commander is assigned within 5 minutes and initial communications are issued within 15 minutes. Severity assignment and IC designation are write-restricted to the on-call IMT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monitor signal received (`incident.signal_received`) | Detection source (`incident.detection_source`), SIEM/monitor detail (`siem.alert_detail`) | Triaged signal + incident candidate (`incident.detected`) | Triage per SLA (enforced by `incident.triage_due_at`) |
  | SEV-1 detected (`incident.sev1_detected`) | Severity (`incident.severity`), on-call rotation (`oncall.ic_rotation`) | IC assignment (`incident.ic_assigned`) | 5 min (enforced by `incident.ic_assignment_timer`) |
  | IC assigned, initial comms required (`incident.ic_assigned`) | Holding statement (`comms.holding_statement`), contact tree (`comms.contact_tree`) | Initial comms issued (`comms.initial_issued`) | 15 min (internal: 15 min; enforced by `comms.initial_timer`) |

- **ALERTS/METRICS:** Track IC-assignment latency distribution for SEV-1 (target ≤5 min) and initial-comms latency (target ≤15 min); alert on SIEM source going silent (`siem.source_silent`).

## BCP-06 — Incident Declaration & Initial Actions  {#bcp-06-incident-declaration-and-initial-actions}

- **WHY (Reg cite):** A documented incident-response program with defined actions and escalation is required under GLBA safeguards ([12 CFR Part 748, App A §III.B and App B](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** On declaration, the system drives a "first hour" checklist (safety, stabilize, scope, assign roles, notify, set cadence), produces a Situation Report (Sitrep) v1 within 30 minutes, and maintains a 30–60 minute Sitrep cadence until the incident is stabilized/contained. Declaration authority and Sitrep publication are write-restricted to the Incident Commander and IMT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident declared (`incident.declared`) | First-hour checklist (`incident.checklist_first_hour`), scope (`incident.scope_initial`), roles (`crisis.roster`) | First-hour completion record (`incident.first_hour_completed`) | First hour (checklist-driven) |
  | Sitrep v1 required (`incident.response_activated`) | Timeline (`incident.timeline`), impact summary (`incident.impact_summary`) | Sitrep v1 issued (`sitrep.issued`) | 30 min (enforced by `sitrep.v1_timer`) |
  | Ongoing stabilization (`sitrep.issued`) | Updated status (`incident.timeline`) | Cadence Sitreps (`sitrep.issued`) | Every 30–60 min until contained (enforced by `sitrep.cadence_timer`) |

- **ALERTS/METRICS:** Track Sitrep v1 latency (target ≤30 min) and cadence adherence; alert on incidents with no Sitrep update within the cadence window.

## BCP-07 — Data Backup & Restore; RTO/RPO  {#bcp-07-data-backup-and-restore-rto-rpo}

- **WHY (Reg cite):** Vital records must be preserved and reconstructable after a catastrophic act, with tested restoration capability ([12 CFR Part 749 and App B](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system maintains tiered, immutable/offsite backups with critical RPO ≤ 15 minutes monitored continuously, performs restore tests for each tier quarterly, and supports clean point-in-time restores for crypto-lock events. A failed backup job opens a remediation task; a missed restore test escalates. Backup tier configuration and restore execution are write-restricted to IT/SRE.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Backup job completes/fails (`backup.job_failed`) | Job detail (`backup.job_detail`), tier config (`backup.tier_config`), RPO monitor (`backup.rpo_monitor`) | Backup verification + remediation if failed (`backup.job_remediated`) | Critical RPO ≤ 15 min (enforced by `backup.verify_due_at`) |
  | Quarterly restore test due (`restore.test_completed`) | Test environment (`restore.test_env`), point validation (`restore.point_validated`) | Restore-test result (`backup.restore_verified`) | Quarterly (enforced by `backup.restore_test_due`) |
  | Crypto-lock recovery needed (`restore.initiated`) | Clean point-in-time selection (`restore.point_validated`), RTO timer (`restore.rto_timer`) | Restore completed (`restore.completed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |

- **ALERTS/METRICS:** Alert on RPO breach (>15 min) and backup job failures (target zero unremediated); track per-tier restore-test pass rate quarterly.

## BCP-08 — Alternate Site & Remote Operations  {#bcp-08-alternate-site-and-remote-operations}

- **WHY (Reg cite):** Continuity of critical operations after facility loss is a core catastrophic-act-preparedness requirement ([12 CFR Part 749, App B](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system maintains a pre-approved remote posture (VPN, MFA), hot/virtual site options, and minimum staffing lists. On facility loss, it drives alternate-site/remote readiness within 8 hours and full critical operations within 24 hours. Site capacity is validated on a recurring basis. Remote-access configuration and site designation are write-restricted to IT/SRE and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Facility loss declared (`facility.loss_declared`) | Remote config (`access.remote_config`), minimum staffing (`staffing.split_team_plan`), site readiness (`site.readiness_confirmed`) | Readiness confirmation (`site.readiness_confirmed`) | Alternate/remote in 8 hr (enforced by `site.readiness_timer`) |
  | Critical ops resumption (`site.readiness_confirmed`) | Critical service list (`bia.criticality`), resumption status (`ops.critical_resumed`) | Critical ops resumed record (`ops.critical_resumed`) | Full critical ops in 24 hr (enforced by `ops.resumption_timer`) |
  | Periodic capacity validation (`site.readiness_confirmed`) | Capacity targets (`access.capacity_targets`), validation result (`site.capacity_validated`) | Capacity test record (`site.readiness_confirmed`) | Recurring (enforced by `site.capacity_test_due`) |

- **ALERTS/METRICS:** Alert on alternate-site readiness aging (`alert.facility_readiness_aging`); track time-to-readiness and time-to-full-critical-ops against 8 hr / 24 hr targets.

## BCP-09 — Major IT Failure Response  {#bcp-09-major-it-failure-response}

- **WHY (Reg cite):** GLBA safeguards require response and recovery for events affecting critical systems ([12 CFR Part 748, App A and App B](https://www.ecfr.gov/current/title-12/part-748)); recovery of critical functions is required under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749). Detailed cyber runbooks live in the Information Security Policy.

- **SYSTEM BEHAVIOR:** The system maintains a runbook for core/cloud outages (detect, isolate blast radius, rollback/failover, communicate). On a major IT failure, an Incident Commander is assigned within 5 minutes, member status is issued within 15 minutes, and failover proceeds per BIA tier with dual control required for rollback. Failover decisioning and rollback execution are write-restricted to IT/SRE with dual-control enforcement.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Major IT failure detected (`it.major_failure_detected`) | Outage runbook (`it.outage_runbook`), blast-radius status (`it.blast_radius_isolated`) | IC assignment (`incident.ic_assigned`) | IC in 5 min (enforced by `incident.ic_assignment_timer`) |
  | Member-facing impact confirmed (`incident.member_impact_confirmed`) | Status-page playbook (`comms.statuspage_playbook`) | Member status issued (`comms.member_status_issued`) | 15 min (enforced by `comms.initial_timer`) |
  | Failover/rollback required (`it.failover_decided`) | BIA tier (`bia.criticality`), dual-control approval (`transaction.dual_control_required`, `transaction.approval_timer`) | Failover executed (`it.failover_executed`) | Per BIA tier RTO (enforced by `restore.rto_timer`) |

- **ALERTS/METRICS:** Track IC-assignment and member-status latency (targets ≤5 min, ≤15 min); alert on any rollback executed without recorded dual-control approval (target zero).

## BCP-10 — Incident Response (Privacy/Security)  {#bcp-10-incident-response-privacy-security}

- **WHY (Reg cite):** GLBA response programs require containment, recovery, and member-notice decisioning with service-provider coordination ([12 CFR Part 748, App A §III and App B](https://www.ecfr.gov/current/title-12/part-748)); NCUA requires notification of certain reportable cyber incidents ([12 CFR § 748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)). Member breach-notice mechanics in detail live in the Privacy Policy.

- **SYSTEM BEHAVIOR:** The system implements GLBA-aligned containment, eradication, recovery, forensics, and notification decisioning with service-provider coordination. Containment begins within 1 hour of a confirmed security incident, counsel is consulted within 24 hours, and reportability/NCUA notification is determined per applicable law. Where the incident is determined reportable, NCUA notice is driven within the regulatory window. SAR referral is created where criminal activity is suspected. Reportability determination and member-notice content are write-restricted to Compliance and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Security incident confirmed (`incident.security_confirmed`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`) | Containment started (`incident.containment_started`) | 1 hr (enforced by `incident.containment_timer`) |
  | Legal review required (`incident.assessment_started`) | Facts (`incident.facts`), reportability assessment (`incident.reportability_assessment`) | Legal review recorded (`incident.assessment_completed`) | Counsel in 24 hr (internal: 24 hr) |
  | Incident determined reportable (`incident.material_flagged`) | Reportability determination (`incident.reportability_determination`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA notification (`incident.ncua_notified`) | Per § 748.1(c) (enforced by `incident.ncua_notice_due_at`) |
  | Member misuse likely (`incident.member_impact_confirmed`) | Notice template (`incident.member_notice_template`), notification determination (`incident.notification_determined`) | Member notices sent (`incident.member_notices_sent`) | Per breach law (enforced by `incident.notification_due_at`) |

- **ALERTS/METRICS:** Alert on NCUA-notification aging (`alert.ncua_notification_aging`); track containment-start latency (target ≤1 hr) and counsel-consult latency (target ≤24 hr).

## BCP-11 — Communications & Notification Tree  {#bcp-11-communications-and-notification-tree}

- **WHY (Reg cite):** Effective internal/external communication and regulator notification are integral to the documented response and recovery capability ([12 CFR Part 748, App B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)). Regulator contact verification supports timely notice ([12 CFR § 748.1](https://www.ecfr.gov/current/title-12/part-748/section-748.1)).

- **SYSTEM BEHAVIOR:** The system maintains contact trees for employees, Board, regulators, vendors, and media, with predefined status-page playbooks and backup channels if comms platforms fail. The first internal alert is issued within 15 minutes of activation, and regulators are notified per law/policy. Regulator contacts are verified on a recurring basis. Comms scripts and regulator notifications are write-restricted to the CCO and CEO-approved spokespersons.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Communications activation (`comms.internal_alert_issued`) | Contact tree (`comms.contact_tree`), stakeholder matrix (`comms.stakeholder_matrix`) | Internal alert issued (`comms.internal_alert_issued`) | 15 min (internal: 15 min; enforced by `comms.initial_timer`) |
  | Comms platform failure (`comms.platform_failed`) | Backup channel plan (`comms.statuspage_playbook`) | Backup channel activated (`comms.backup_activated`) | Immediately on failure |
  | Regulator notification required (`regulator.ncua_notified`) | Verified regulator contacts (`regulator.contacts`), notice criteria (`regulator.notice_criteria_met`) | Regulator notice sent (`incident.regulator_notified`) | Per law (enforced by `incident.regulator_notification_due`) |
  | Periodic contact verification (`regulator.contacts_verified`) | Contact roster (`regulator.contacts`) | Verified contacts record (`regulator.contacts_verified`) | Recurring (enforced by `regulator.contact_verification_due`) |

- **ALERTS/METRICS:** Track first-internal-alert latency (target ≤15 min); alert on stale regulator contacts and on any activation lacking a logged backup-channel fallback when the primary platform failed.

## BCP-12 — People Continuity & Pandemic  {#bcp-12-people-continuity-and-pandemic}

- **WHY (Reg cite):** Continuity of critical operations through people-availability events is required under catastrophic-act preparedness ([12 CFR Part 749, App B](https://www.ecfr.gov/current/title-12/part-749)); Board oversight of continuity arrangements applies ([12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).

- **SYSTEM BEHAVIOR:** The system identifies essential roles, supports cross-training, and implements split-team/remote-work plans. Staffing plans activate within 24 hours of an absenteeism trigger (≥30%) or a public-health trigger. Staffing readiness is reviewed on a recurring basis. Staffing-plan activation and essential-role designation are write-restricted to HR and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Absenteeism ≥30% or public-health trigger (`staffing.plan_activated`) | Availability (`workforce.availability`), absenteeism threshold (`workforce.absenteeism_threshold`), split-team plan (`staffing.split_team_plan`) | Staffing plan activated (`staffing.plan_activated`) | 24 hr (enforced by `staffing.activation_timer`) |
  | Periodic staffing readiness review (`staffing.review_completed`) | Critical-role map (`eps.staffing.critical_roles`), backup map (`eps.staffing.backup_map`) | Readiness review record (`staffing.review_completed`) | Recurring (enforced by `staffing.readiness_review_due`) |
  | Coverage attestation (`staffing.coverage_attested`) | Coverage roster (`staffing.split_team_plan`) | Coverage attestation (`staffing.coverage_attested`) | Per review cycle (enforced by `staffing.review_timer`) |

- **ALERTS/METRICS:** Track staffing-plan activation latency (target ≤24 hr) and essential-role coverage ratio; alert on readiness review aging.

## BCP-13 — Post-Incident Review (PIR)  {#bcp-13-post-incident-review}

- **WHY (Reg cite):** A maintained program requires learning from events and correcting weaknesses to preserve operability ([12 CFR Part 748, App B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749, App B](https://www.ecfr.gov/current/title-12/part-749)).

- **SYSTEM BEHAVIOR:** The system conducts a PIR with root cause, what worked/failed, and a corrective action plan. The PIR is drafted within 10 business days of containment, the CAP is approved within 30 days, and corrective items are tracked to retest verification. PIR authorship and CAP approval are write-restricted to the Business Continuity Manager and CCO.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident contained (`incident.contained`) | Root cause (`incident.root_cause`), timeline (`incident.timeline`) | PIR draft (`incident.postmortem_completed`) | 10 business days (internal: 10 BD; enforced by `pir.draft_timer`) |
  | CAP requires approval (`cap.item_created`) | CAP items (`cap.retest_plan`), owners (`finding.owner`) | CAP approved (`cap.approved`) | 30 days (enforced by `cap.approval_timer`) |
  | Corrective item retest (`cap.retest_verified`) | Retest plan (`cap.retest_plan`), closure evidence (`finding.closure_evidence`) | Retest verified + item closed (`cap.item_completed`) | Per CAP item (enforced by `finding.response_due_at`) |

- **ALERTS/METRICS:** Alert on PIR-draft aging past 10 BD and CAP approval aging past 30 days (targets zero); track open CAP items past due and retest pass rate.

## BCP-14 — Vendor Contingency Management  {#bcp-14-vendor-contingency-management}

- **WHY (Reg cite):** Service-provider arrangements supporting critical functions must be overseen and coordinated for incident response and continuity ([12 CFR Part 748, App A §III.D and App B](https://www.ecfr.gov/current/title-12/part-748); [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)). General vendor onboarding/due diligence lives in the Third-Party Risk Policy.

- **SYSTEM BEHAVIOR:** The system maintains vendor BCP/IR attestations, SLAs, RTO/RPO, and DR test evidence; refreshes evidence at least annually; defines exit/failover criteria; and assesses diversification against shared failure modes. A vendor outage or breach triages an incident track. DR attestation refresh and failover criteria are write-restricted to Vendor Risk and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual vendor BCP/DR evidence cycle (`vendor.dr_confirmed`) | DR plan (`vendor.dr_plan`), DR test results (`vendor.dr_test_results`), RTO/RPO (`vendor.rto_rpo`) | DR attestation confirmed (`vendor.dr_confirmed`) | Annual (enforced by `vendor.dr_attestation_due`) |
  | Failover/exit criteria set (`vendor.failover_criteria_set`) | Failover criteria (`vendor.failover_criteria`), exit plan (`vendor.exit_plan_id`) | Exit/failover criteria record (`vendor.failover_criteria_set`) | Per program cycle (enforced by `vendor.exit_plan_due`) |
  | Vendor outage or breach (`vendor.outage_detected`) | Impact scope (`vendor.affected_scope`), incident detail (`vendor.breach_detail`) | Vendor incident logged + triaged (`vendor.incident_logged`) | Triage per SLA (enforced by `vendor.incident_triage_due`) |
  | Concentration / shared-failure review (`vendor.reconciliation_completed`) | Dependency map (`vendor.dependency_map`), concentration assessment (`vendor.concentration_assessed`) | Diversification plan logged (`liquidity.diversification_plan_logged`) | Recurring (enforced by `vendor.concentration_review_due`) |

- **ALERTS/METRICS:** Alert on DR-attestation refresh aging and critical-vendor alerts (`vendor.critical_alert`); track count of critical vendors with current DR evidence (target 100%) and vendor incidents triaged on time.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for program maintenance, control operation, and Board reporting.
- **Approver(s):** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Business Continuity Manager, Incident Management Team (IMT), IT/SRE, HR, Vendor Risk, and the Board of Directors (oversight and approval per [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4)).
- **Review cadence:** Board approves the policy at least annually (BCP-01); IMT roster verified quarterly; BIA updated annually and certified quarterly (BCP-03); threat register refreshed annually or on major change (BCP-02); at least one enterprise exercise per year with Board reporting within 30 days (BCP-04).
- **Cross-references:** Information Security Policy (cyber IR runbooks, security control design); Third-Party Risk Policy (vendor onboarding, due diligence, oversight); Privacy Policy (member breach-notification mechanics); Record Retention Policy (vital-records retention schedules outside continuity); Enterprise Risk Management Policy (risk taxonomy and aggregation); Electronic Payment Systems Policy (payment channel-specific controls, ACH/wire dual control, payment authentication).
- **Examiner deadline view:** see the [Timing Matrix](#timing-matrix).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The continuity-side resources, fields, events, and timers referenced in the EVENTS tables throughout this document (e.g., `incident.*`, `backup.*`, `restore.*`, `bia.*`, `threat_register.*`, `comms.*`, `sitrep.*`, `staffing.*`, `vendor.dr_*`, `site.*`, `ops.*`, `drill.*`, `cap.*`, `pir.*`, hazard feeds via `facility.schedule_drift_detected`/`hazard.feed_detail`) are drawn from the registered core-API vocabulary where a fit exists and otherwise composed per the registered grammar. Names are the target naming scheme and will be confirmed by engineering before the next review. `pir.draft_timer` is used as the registered PIR draft timer; if engineering prefers a generic `Task` of type `report` keyed to `incident`, that substitution is acceptable.
- **Charter type / NCUA applicability.** This policy assumes Pynthia Credit Union is a federally insured credit union subject to 12 CFR Parts 748 and 749 and § 701.4. NCUA Part 701.31 (nondiscrimination in real-estate lending) was reviewed and intentionally not anchored to any control — it governs fair-lending advertising, not continuity, and is out of scope here. Confirm charter type and any state-specific continuity or breach-notification overlays.
- **Reportable-incident notification window.** BCP-10 assumes the NCUA reportable-cyber-incident notification obligation under § 748.1(c) (notify as soon as possible and no later than 72 hours after reasonable belief). The specific clock is enforced via `incident.ncua_notice_due_at`; confirm the exact trigger definition and hour count with Compliance/Legal before go-live.
- **RPO/RTO targets are policy inputs, not yet system-validated.** Critical RPO ≤ 15 minutes (BCP-07) and the 8 hr / 24 hr readiness targets (BCP-08), 5 min IC / 15 min comms (BCP-05, BCP-09) are taken from Patrick's notes; confirm these match contractual SLAs and the BIA-derived tier matrix once `dr.rto_rpo_matrix` is populated.
- **Payment-channel tier designation.** BCP-03 pre-tags electronic payment channels as highest-priority critical; the authoritative channel list and any tier nuances are owned by the Electronic Payment Systems Policy and must be reconciled with the BIA service catalog.
- **Absenteeism trigger threshold.** The ≥30% absenteeism trigger (BCP-12) is taken from Patrick's notes and modeled via `workforce.absenteeism_threshold`; confirm measurement basis (enterprise-wide vs. per-critical-function) with HR.
