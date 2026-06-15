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

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people. The program prioritizes human safety, continuity of critical member-facing services (with electronic payment channels treated as highest priority), prudent recovery within defined RTO/RPO targets, and disciplined post-incident learning. It applies across all internal operations and member-facing channels and partners, aligns with NCUA records-preservation and catastrophic-act preparedness requirements (12 CFR Part 749) and GLBA-aligned safeguards and incident-response obligations (12 CFR Part 748, Appendix A & B), and operates under Board oversight per 12 CFR § 701.4. Channel-specific payment controls, security control design, third-party onboarding, and member breach-notification mechanics live in their respective policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| SEV-1 incident detected; Incident Commander must be assigned | On-call detects critical disruption (`incident.sev1_detected`) | 5 minutes | IC assignment + initial comms cadence | [BCP-05](#bcp-05--monitoring-detection--severity) |
| SEV-1 initial communications issued | IC assigned (`incident.ic_assigned`) | 15 minutes | First internal alert / member status | [BCP-05](#bcp-05--monitoring-detection--severity) |
| Incident declared; first-hour stabilization | Incident declared (`incident.declared`) | Sitrep v1 within 30 min; 30–60 min cadence | First-hour checklist + Sitrep | [BCP-06](#bcp-06--incident-declaration--initial-actions) |
| Major IT/core/cloud outage | Outage detected (`it.major_failure_detected`) | IC 5 min; member status 15 min | Outage runbook, failover per BIA | [BCP-09](#bcp-09--major-it-failure-response) |
| Privacy/security incident containment | Security incident confirmed (`incident.security_confirmed`) | Containment 1 hr; counsel 24 hr | GLBA IR containment & notification | [BCP-10](#bcp-10--incident-response-privacysecurity) |
| Alternate-site / remote readiness | Facility loss declared (`facility.loss_declared`) | Readiness 8 hr; full critical ops 24 hr | Remote posture, hot site, staffing | [BCP-08](#bcp-08--alternate-site--remote-operations) |
| People-availability / pandemic trigger | Absenteeism ≥30% or public-health trigger (`incident.declared`) | Staffing plan activated within 24 hr | Split teams / remote work activation | [BCP-12](#bcp-12--people-continuity--pandemic) |
| Enterprise exercise results to Board | Exercise completed (`exercise.completed`) | 30 days | Exercise after-action + CAP feed | [BCP-04](#bcp-04--training-testing--exercises) |
| Post-incident review | Incident closed/stabilized (`incident.postmortem_completed`) | PIR draft 10 BD; CAP approved 30 days | PIR root cause + corrective action | [BCP-13](#bcp-13--post-incident-review) |

---

## BCP-01 — Governance, Roles & Plan Maintenance  {#bcp-01--governance-roles--plan-maintenance}

- **WHY (Reg cite):** The Board must approve and oversee the continuity program and management must maintain it under [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) (Board duties) and the records-preservation/catastrophic-act preparedness obligations of [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (including Appendices A & B).

- **SYSTEM BEHAVIOR:** The system maintains a living BCP/DR plan document with named owners and an Incident Management Team (IMT) roster. The plan is reviewed and Board-approved at least annually, with a review-warning fired ahead of lapse; the IMT roster is verified quarterly. Each approval, version publication, and roster verification is recorded with its artifact. Plan content, owner assignments, and Board approvals are write-restricted to the Chief Compliance Officer and the Business Continuity Manager; Board sign-off is recorded against a Board resolution.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual BCP review cycle opens (`policy.board_review_started`) | Current plan (`bcp.plan_version`), owner (`policy.owner_ref`), next review date (`policy.next_review_date`) | Reviewed plan draft + emitted (`bcp.section_updated`) | 12 months (enforced by `bcp.annual_review_due`) |
  | Board approves the plan (`bcp.board_approved`) | Board resolution (`board.resolution_id`), approval timestamp (`policy.board_approved_at`) | Board-approved BCP version (`policy.board_approved`) | At/before review due (enforced by `policy.board_approval_due_at`) |
  | Quarterly IMT roster verification due (`imt.roster_verified`) | IMT roster (`crisis.roster`), succession matrix (`crisis.succession_matrix`) | Verified roster attestation (`imt.roster_verified`) | Quarterly (enforced by `imt.roster_review_due`) |

- **ALERTS/METRICS:** Alert when `policy.review_warning_at` fires or the plan review lapses (`policy.review_lapsed`); target zero overdue IMT roster verifications and zero lapsed annual Board approvals.

## BCP-02 — Risk Assessment (Hazards by Region)  {#bcp-02--risk-assessment-hazards-by-region}

- **WHY (Reg cite):** Identifying disasters that could interrupt member services and preserving the ability to resume operations is required under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation and catastrophic-act preparedness) and supports the Board's oversight duty under [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).

- **SYSTEM BEHAVIOR:** The system maintains a threat register scoring hazards (wildfire/smoke, earthquake, tornado, flood, grid outage, cyber, pandemic) by likelihood and impact, segmented by geography (e.g., CA wildfire/smoke, TX tornado/storm). The register is refreshed at least annually and after any major change, with interim updates permitted. Threat-register content and scoring are write-restricted to the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual or post-change refresh due (`threat_register.updated`) | Threat catalog (`risk.threat_catalog`), geography factors (`risk.geography_factors`), likelihood/impact scores (`risk.likelihood_score`, `risk.impact_score`) | Updated threat register (`threat_register.updated`) | Annual or on major change (enforced by `threat_register.refresh_due`) |
  | Hazard watch raised by monitor feed (`risk.assessment_completed`) | Hazard feed detail (`hazard.feed_detail`), inherent rating (`risk.inherent_rating`) | Reassessed register entry (`risk.assessment_completed`) | Interim (no registered timer) |

- **ALERTS/METRICS:** Alert when the threat register is past its refresh interval (`risk.review_overdue`); target a register refreshed within 12 months and updated after every declared major regional event.

## BCP-03 — Business Impact Analysis (BIA) & RTO/RPO  {#bcp-03--business-impact-analysis-bia--rtorpo}

- **WHY (Reg cite):** Cataloguing critical services, vital records, and recovery sequencing is required to preserve and restore records under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (vital records and catastrophic-act preparedness, Appendices A & B).

- **SYSTEM BEHAVIOR:** The system catalogs services, ranks them by member impact and regulatory dependency, identifies vital records, and sets RTO/RPO and recovery sequence. Electronic payment channels (ACH origination, wire transfer, debit/ATM card, mobile/remote deposit capture, Zelle) are tagged highest-priority critical services given direct member impact and regulatory dependency; channel-specific payment controls are governed by the Electronic Payment Systems Policy and are out of scope here. The BIA is updated at least annually and certified quarterly for changes. BIA scoring and RTO/RPO targets are write-restricted to the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual BIA update due (`bia.updated`) | Service catalog (`bia.criticality`), member impact (`bia.member_impact`), regulatory dependency (`bia.reg_dependency`), scope RTO/RPO (`scope_registry.item.rto`, `scope_registry.item.rpo`) | Updated BIA + scope registry version (`bia.updated`, `scope_registry.version_approved`) | 12 months (enforced by `bia.annual_update_due`) |
  | Quarterly change certification due (`bia.certified`) | Current criticality ranking (`bia.criticality`), vital records list (`record.retention_class`) | BIA certification record (`bia.certified`) | Quarterly (enforced by `bia.certification_due`) |
  | New/changed service needs provisional tier (`bia.provisional_tier_assigned`) | Service descriptor (`bia.criticality`), payment-channel flag (`bia.reg_dependency`) | Provisional BIA tier (`bia.provisional_tier_assigned`) | Before activation (no registered timer) |

- **ALERTS/METRICS:** Alert on uncertified BIA changes past quarter-close and on any payment channel not tagged highest-priority; target 100% quarterly certification and zero critical services without an RTO/RPO.

## BCP-04 — Training, Testing & Exercises  {#bcp-04--training-testing--exercises}

- **WHY (Reg cite):** Testing the recovery plan and verifying the ability to resume operations supports the catastrophic-act preparedness expectations of [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and the Board oversight duty under [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).

- **SYSTEM BEHAVIOR:** The system schedules and runs at least one enterprise exercise per year (orientation, tabletop, or functional), tracks completion, captures failures, and feeds gaps to a corrective action plan. Results are reported to the Board within 30 days of exercise completion. Exercise scheduling and Board reporting are write-restricted to the Business Continuity Manager; remediation items route to named owners.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual exercise scheduled (`exercise.scheduled`) | Exercise objectives (`drill.objectives`), participant roster (`drill.roster`) | Scheduled exercise (`exercise.scheduled`) | Annual (no registered timer) |
  | Exercise completed (`exercise.completed`) | Failure detail (`drill.failure_detail`), affected capability (`drill.affected_capability`) | After-action report + corrective items (`drill.aar_published`, `drill.corrective_plan_opened`) | 30 days to Board (enforced by `exercise.board_report_due`) |
  | Corrective item opened (`drill.corrective_plan_opened`) | Remediation owner (`drill.remediation_owner`), remediation item (`drill.remediation_item`) | Closed remediation + retest (`drill.remediation_closed`) | Per CAP (enforced by `drill.remediation_due`) |

- **ALERTS/METRICS:** Alert on exercises overdue past 12 months and exercise results not delivered to Board within 30 days; target ≥1 enterprise exercise per year and zero overdue corrective items.

## BCP-05 — Monitoring, Detection & Severity  {#bcp-05--monitoring-detection--severity}

- **WHY (Reg cite):** Timely detection and response to events threatening member-information systems is required under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) (information security program; respond to and contain incidents); preparedness for service interruption is grounded in [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).

- **SYSTEM BEHAVIOR:** The system operates central on-call with a SEV-1 to SEV-4 severity matrix and weather/cyber/vendor monitors. On a SEV-1 detection it assigns an Incident Commander within 5 minutes and issues initial communications within 15 minutes. Severity assignment and IC designation are write-restricted to the on-call Incident Commander and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | SEV-1 condition detected (`incident.sev1_detected`) | Detection source (`incident.detection_source`), IC rotation (`oncall.ic_rotation`) | Assigned Incident Commander (`incident.ic_assigned`) | 5 minutes (enforced by `incident.triage_due_at`) |
  | Incident Commander assigned (`incident.ic_assigned`) | Comms plan (`incident.comms_plan`), severity (`incident.severity`) | Initial internal/member alert (`comms.internal_alert_issued`) | 15 minutes (enforced by `comms.same_day_due_at`) |
  | Monitor raises a signal (`incident.signal_received`) | Monitor source (`monitor.source`), severity matrix (`incident.severity`) | Severity classification (`incident.severity_assigned`) | At detection (no registered timer) |

- **ALERTS/METRICS:** Aging alert on any SEV-1 without an IC at 5 minutes and without initial comms at 15 minutes; track IC-assignment latency distribution and monitor-feed uptime, target zero missed SLAs.

## BCP-06 — Incident Declaration & Initial Actions  {#bcp-06--incident-declaration--initial-actions}

- **WHY (Reg cite):** Structured incident response, stabilization, and notification are required under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) and support resumption obligations under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).

- **SYSTEM BEHAVIOR:** On declaration, the system drives a "first hour" checklist (safety, stabilize, scope, assign roles, notify, set cadence), produces a Sitrep v1 within 30 minutes, and maintains a 30–60 minute Sitrep cadence until stabilized. Declaration authority and checklist sign-off are write-restricted to the Incident Commander and Crisis Management Team Lead; the team is convened on declaration.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident declared (`incident.declared`) | First-hour checklist (`incident.checklist_first_hour`), initial scope (`incident.scope_initial`) | First-hour completion record (`incident.first_hour_completed`) | First hour (enforced by `incident.triage_due_at`) |
  | First-hour stabilization underway (`incident.response_activated`) | Impact summary (`incident.impact_summary`), comms plan (`incident.comms_plan`) | Sitrep v1 (`sitrep.issued`) | 30 minutes (enforced by `sitrep.v1_timer`) |
  | Stabilization continues (`sitrep.issued`) | Updated timeline (`incident.timeline`), severity (`incident.severity`) | Cadence Sitreps (`sitrep.issued`) | Every 30–60 min until stable (enforced by `sitrep.cadence_timer`) |

- **ALERTS/METRICS:** Alert if Sitrep v1 is late past 30 minutes or cadence Sitreps lapse past 60 minutes; target on-time first-hour checklist completion and unbroken Sitrep cadence until stabilization.

## BCP-07 — Data Backup & Restore; RTO/RPO  {#bcp-07--data-backup--restore-rtorpo}

- **WHY (Reg cite):** Maintaining and restoring vital records and backups is required under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation; appendices on vital records and catastrophic-act preparedness); protecting against destruction of member information is grounded in [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748).

- **SYSTEM BEHAVIOR:** The system maintains tiered, immutable/offsite backups with a critical RPO ≤ 15 minutes, performs restore tests for each tier quarterly, and uses clean point-in-time restores for crypto-lock events. Backup tier configuration and restore-point selection are write-restricted to IT/SRE; restore tests are validated in an isolated test environment.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Backup cycle runs (`backup.cycle_completed`) | Tier config (`backup.tier_config`), RPO monitor (`backup.rpo_monitor`) | Verified backup + catalog (`backup.verified`) | RPO ≤ 15 min for critical (enforced by `backup.verify_due`) |
  | Quarterly restore test due (`backup.restore_verified`) | Test environment (`restore.test_env`), validated restore point (`restore.point_validated`) | Restore-test result (`restore.test_completed`) | Quarterly per tier (enforced by `backup.restore_test_due`) |
  | Crypto-lock event detected (`restore.initiated`) | Clean point-in-time (`restore.point_validated`), RTO timer (`restore.rto_timer`) | Clean restore completion (`restore.completed`) | Per BIA RTO (enforced by `restore.rto_timer`) |

- **ALERTS/METRICS:** Alert on backup job failure (`backup.job_failed`), RPO breach beyond 15 minutes for critical tiers, and overdue quarterly restore tests; target zero failed verifications and 100% quarterly restore-test coverage.

## BCP-08 — Alternate Site & Remote Operations  {#bcp-08--alternate-site--remote-operations}

- **WHY (Reg cite):** Resuming critical operations after facility loss is a core catastrophic-act preparedness expectation under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749); secure remote access to member information must satisfy [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748).

- **SYSTEM BEHAVIOR:** The system maintains a pre-approved remote posture (VPN, MFA), hot/virtual site options, and minimum staffing lists, achieving alternate-site/remote readiness within 8 hours and full critical operations within 24 hours of a facility loss. Remote-access configuration and site capacity validation are write-restricted to IT/SRE and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Facility loss declared (`facility.loss_declared`) | Remote config (`access.remote_config`), minimum staffing list (`staffing.split_team_plan`) | Site readiness confirmation (`site.readiness_confirmed`) | 8 hours (enforced by `site.readiness_timer`) |
  | Readiness confirmed (`site.readiness_confirmed`) | Site capacity targets (`access.capacity_targets`), critical-ops scope (`scope_registry.item.rto`) | Capacity-validated full ops (`site.capacity_test_due` completed) | Full critical ops 24 hours (enforced by `ops.resumption_timer`) |
  | Critical operations resumed (`ops.critical_resumed`) | Resumption checklist (`ops.resumption_timer`) | Resumption record (`ops.critical_resumed`) | 24 hours (enforced by `ops.resumption_timer`) |

- **ALERTS/METRICS:** Aging alert when readiness exceeds 8 hours or full critical ops exceed 24 hours after a facility loss; track site-capacity test pass rate and remote-access (MFA/VPN) availability, target zero readiness-SLA breaches.

## BCP-09 — Major IT Failure Response  {#bcp-09--major-it-failure-response}

- **WHY (Reg cite):** Restoring critical systems and protecting member-information systems during outages is required under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the operations-resumption expectations of [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).

- **SYSTEM BEHAVIOR:** The system maintains a runbook for core/cloud outages (detect, isolate blast radius, rollback/failover, communicate), assigns an Incident Commander within 5 minutes, issues member status within 15 minutes, and fails over per BIA tier with dual control required for rollback. Failover decisions and rollback execution are write-restricted to IT/SRE under dual control; member-facing payment channel mechanics remain governed by the Electronic Payment Systems Policy.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Major IT/core/cloud failure detected (`it.major_failure_detected`) | Outage runbook (`it.outage_runbook`), blast-radius isolation (`it.blast_radius_isolated`), IC rotation (`oncall.ic_rotation`) | Assigned IC + member status (`incident.ic_assigned`, `comms.member_status_issued`) | IC 5 min; member status 15 min (enforced by `incident.triage_due_at`) |
  | Failover decision required (`it.failover_decided`) | BIA tier (`bia.criticality`), dual-control flag (`transaction.dual_control_required`) | Failover execution (`it.failover_executed`) | Per BIA tier RTO (no registered timer) |
  | Rollback proposed (`it.failover_executed`) | Dual-control approval (`transaction.approval_recorded`), backout plan (`change.backout_plan`) | Dual-control completion (`transaction.dual_control_completed`) | Before rollback (enforced by `transaction.approval_timer`) |

- **ALERTS/METRICS:** Alert on missed 5-minute IC assignment or 15-minute member-status SLA and on any rollback attempted without dual control; track failover execution latency by BIA tier, target zero single-control rollbacks.

## BCP-10 — Incident Response (Privacy/Security)  {#bcp-10--incident-response-privacysecurity}

- **WHY (Reg cite):** GLBA-aligned containment, recovery, service-provider coordination, and notification decisioning are required under [12 CFR Part 748, Appendix A and Appendix B](https://www.ecfr.gov/current/title-12/part-748) (safeguarding member information and response programs). Detailed cyber runbooks and member breach-notification mechanics are governed by the Information Security and Privacy Policies and are out of scope here.

- **SYSTEM BEHAVIOR:** The system implements GLBA-aligned containment, eradication, recovery, forensics, and notification decisioning with service-provider coordination. Containment begins within 1 hour of a confirmed security incident and counsel is consulted within 24 hours; member and regulator notices follow the applicable determination. Reportability determination and counsel consultation are write-restricted to the Chief Compliance Officer and legal; suspected criminal activity routes to a BSA/SAR referral.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Security incident confirmed (`incident.security_confirmed`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`) | Containment started (`incident.containment_started`) | 1 hour (enforced by `incident.containment_timer` via `incident.triage_due_at`) |
  | Containment underway (`incident.containment_started`) | Legal review (`incident.legal_review`), misuse likelihood (`incident.misuse_likelihood`) | Counsel consultation logged (`legal.consulted`) | 24 hours (enforced by `legal.consult_timer`) |
  | Reportability determined (`incident.material_flagged`) | Reportability assessment (`incident.reportability_assessment`), member-notice template (`incident.member_notice_template`) | Notification decision (`notification.decision_recorded`) | Per applicable breach law (enforced by `incident.notification_due_at`) |

- **ALERTS/METRICS:** Alert if containment exceeds 1 hour or counsel consultation exceeds 24 hours; track confirmed-incident containment latency and notification-decision timeliness, target zero overdue determinations.

## BCP-11 — Communications & Notification Tree  {#bcp-11--communications--notification-tree}

- **WHY (Reg cite):** Notifying regulators and coordinating member/employee communications during incidents supports [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) (response program and notification) and the resumption/communication expectations of [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).

- **SYSTEM BEHAVIOR:** The system maintains contact trees for employees, Board, regulators, vendors, and media, with predefined status-page playbooks and backup channels if primary comms platforms fail. The first internal alert issues within 15 minutes of activation, and NCUA/regulators are notified per law and policy. Communication scripts require compliance review and CEO approval before external release; media response is logged. Regulator-contact lists are write-restricted to the Chief Compliance Officer.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident response activated (`incident.response_activated`) | Contact tree (`comms.contact_tree`), stakeholder matrix (`comms.stakeholder_matrix`) | First internal alert (`comms.internal_alert_issued`) | 15 minutes (enforced by `comms.initial_timer`) |
  | Regulator notice criteria met (`incident.ncua_notified`) | Regulator contacts (`regulator.contacts`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA/regulator notification (`ncua.notification_sent`) | Per law/policy (enforced by `incident.ncua_notice_due_at`) |
  | Primary comms platform fails (`comms.platform_failed`) | Backup channel config (`comms.statuspage_playbook`) | Backup channel activated (`comms.backup_activated`) | Immediate (no registered timer) |

- **ALERTS/METRICS:** Aging alert on first internal alert past 15 minutes and on NCUA notification past its due time; track regulator-contact verification freshness, target zero unverified contact trees at incident time.

## BCP-12 — People Continuity & Pandemic  {#bcp-12--people-continuity--pandemic}

- **WHY (Reg cite):** Maintaining staffing for continuity of critical operations under absenteeism or public-health events is a catastrophic-act preparedness expectation under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and supports Board oversight under [12 CFR § 701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4).

- **SYSTEM BEHAVIOR:** The system identifies essential roles, supports cross-training, and implements split teams/remote work. Staffing plans activate within 24 hours of an absenteeism trigger (≥30%) or a public-health trigger. Staffing plan content and activation authority are write-restricted to HR and the Business Continuity Manager; pandemic-specific facility cleaning and member-facing measures coordinate through this control without duplicating Information Security or Privacy controls.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Absenteeism ≥30% or public-health trigger (`incident.declared`) | Workforce availability (`workforce.availability`), absenteeism threshold (`workforce.absenteeism_threshold`), split-team plan (`staffing.split_team_plan`) | Staffing plan activated (`staffing.plan_activated`) | 24 hours (enforced by `staffing.activation_timer`) |
  | Periodic readiness review due (`staffing.review_completed`) | Critical roles (`eps.staffing.critical_roles`), backup map (`eps.staffing.backup_map`) | Coverage attestation (`staffing.coverage_attested`) | Per cycle (enforced by `staffing.readiness_review_due`) |

- **ALERTS/METRICS:** Alert when a staffing plan is not activated within 24 hours of a trigger and on stale readiness reviews; track essential-role coverage percentage and cross-training depth, target full coverage of essential roles.

## BCP-13 — Post-Incident Review (PIR)  {#bcp-13--post-incident-review-pir}

- **WHY (Reg cite):** Documenting root cause and corrective actions to strengthen the program reflects the response-program and improvement expectations of [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) and the preparedness obligations of [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).

- **SYSTEM BEHAVIOR:** The system conducts a PIR capturing root cause, what worked/failed, and a corrective action plan (CAP) with retest verification. The PIR draft is produced within 10 business days and the CAP is approved within 30 days. PIR authorship and CAP approval are write-restricted to the Business Continuity Manager and the Chief Compliance Officer; corrective items route to named owners with retest evidence required for closure.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident stabilized/closed (`incident.postmortem_completed`) | Root cause (`incident.root_cause`), timeline (`incident.timeline`) | PIR draft (`pir.drafted`) | 10 business days (enforced by `pir.draft_timer`) |
  | CAP items opened (`cap.item_created`) | Remediation owner (`finding.owner`), retest plan (`cap.retest_plan`) | Approved CAP (`cap.approved`) | 30 days (enforced by `cap.approval_timer`) |
  | CAP item remediated (`cap.item_completed`) | Closure evidence (`finding.closure_evidence`) | Retest verification (`cap.retest_verified`) | Per CAP (no registered timer) |

- **ALERTS/METRICS:** Alert on PIR drafts past 10 business days and CAP approvals past 30 days; track open CAP items by age and retest pass rate, target zero overdue CAP items and verified retest on every closed corrective action.

## BCP-14 — Vendor Contingency Management  {#bcp-14--vendor-contingency-management}

- **WHY (Reg cite):** Overseeing service providers that support critical services — including their BCP/IR and DR evidence — is required under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) (service-provider oversight of member-information safeguards) and supports operations resumption under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749). General vendor onboarding and due diligence are governed by the Third-Party Risk Policy and are out of scope here.

- **SYSTEM BEHAVIOR:** The system maintains vendor BCP/IR attestations, SLAs, RTO/RPO, and DR test evidence, refreshes evidence annually, defines exit/failover criteria, and tracks diversification against shared failure modes. This control consumes continuity-relevant vendor evidence only; vendor selection and broad due diligence live in the Third-Party Risk Policy. Failover/exit criteria and continuity attestations are write-restricted to Vendor Risk and the Business Continuity Manager.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual vendor continuity refresh due (`vendor.bcp_evidence_due` reached) | Vendor BCP/DR plan (`vendor.dr_plan`), DR test results (`vendor.dr_test_results`), RTO/RPO (`vendor.rto_rpo`) | Refreshed evidence + DR confirmation (`vendor.dr_confirmed`, `vendor.evidence_refreshed`) | Annual (enforced by `vendor.bcp_evidence_due`) |
  | Failover/exit criteria set or reviewed (`vendor.failover_criteria_set`) | Failover criteria (`vendor.failover_criteria`), exit plan (`vendor.exit_plan_id`) | Recorded failover criteria + exit plan (`vendor.failover_criteria_set`, `vendor.exit_plan_approved`) | Per governance cycle (enforced by `vendor.exit_plan_due`) |
  | Vendor outage/incident affecting critical service (`vendor.outage_detected`) | Impact scope (`vendor.incident_scope`), DR attestation (`vendor.dr_attestation_due`) | Failover decision + incident log (`vendor.failover_decided`, `vendor.incident_logged`) | Per BIA tier (enforced by `vendor.incident_triage_due`) |

- **ALERTS/METRICS:** Alert on critical-vendor continuity evidence past annual refresh (`vendor.critical_alert`) and on vendor concentration exceeding shared-failure-mode thresholds; track DR-attestation freshness and exit-plan test coverage, target zero critical vendors with stale BCP/DR evidence.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Day-to-day program management is delegated to the Business Continuity Manager, with required participation from the Incident Management Team, IT/SRE, HR, Vendor Risk, and the Board of Directors.
- **Approval:** Board-approved; current approver of record is Patrick Wilson, Chief Compliance Officer (see [BCP-01](#bcp-01--governance-roles--plan-maintenance)).
- **Review cadence:** Plan reviewed and Board-approved at least annually and after any major change; IMT roster verified quarterly; threat register and BIA refreshed per [BCP-02](#bcp-02--risk-assessment-hazards-by-region) and [BCP-03](#bcp-03--business-impact-analysis-bia--rtorpo).
- **Cross-references:** Electronic Payment Systems Policy (payment-channel controls, ACH/wire dual control, authentication); Information Security Policy (cyber IR runbooks, security control design); Third-Party Risk Policy (vendor onboarding/due diligence/oversight); Privacy Policy (member breach-notification detail); Record Retention Policy (vital-records retention schedules outside continuity); Enterprise Risk Management Policy (risk taxonomy and aggregation).
- **Deadline view:** The [Timing Matrix](#timing-matrix) is the single consolidated source for cross-control deadlines.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The continuity-side resources, fields, events, and timers referenced throughout the control overlays target the registered core-API vocabulary and the agreed provisional spellings in DESIGN_NOTES, but the parsed spec is banking-core-oriented. Codes coined by composition where no registered or provisional code fit — notably hazard/threat-feed handling (`hazard.feed_detail`, `risk.geography_factors`), the SEV-1 IC-assignment timer (mapped onto `incident.triage_due_at`), full-ops resumption (`ops.resumption_timer`, `ops.critical_resumed`), and pandemic absenteeism triggers (`workforce.availability`, `workforce.absenteeism_threshold`) — will be confirmed by engineering before the next review.
- **SEV-1 5-minute IC and 15-minute comms SLAs** are mapped onto the generic `incident.triage_due_at` / `comms.same_day_due_at` / `comms.initial_timer` timers because no dedicated sub-5-minute continuity timer is registered; engineering to confirm whether finer-grained timers are needed.
- **Charter type and NCUA applicability** (federally insured credit union; applicability of 12 CFR Part 749 and Part 748 vs. NCUA Part 701.31, which addresses advertising of insured status rather than continuity) is assumed; Part 701.31 was reviewed and intentionally not anchored to a control as it is not a continuity authority. To be confirmed by the Chief Compliance Officer.
- **Pandemic in-office cleaning, signage, and member-facing contagion measures** from the reference plan are treated as operational sub-steps of [BCP-12](#bcp-12--people-continuity--pandemic) rather than separate controls; confirm whether a standalone facility-sanitation control is required.
- **Electronic payment channel prioritization** in the BIA assumes ACH origination, wire, debit/ATM, mobile/RDC, and Zelle are all in-scope highest-priority services; channel-specific control design remains in the Electronic Payment Systems Policy. Confirm the full payment-channel inventory with the EPS Policy owner.
- **Quarterly restore-test and RPO ≤ 15-minute targets** assume all critical tiers can meet immutable/offsite backup with point-in-time recovery; confirm tier-by-tier feasibility with IT/SRE.
- **Vendor continuity scope** assumes Vendor Risk supplies continuity-relevant evidence (BCP/IR/DR, RTO/RPO, exit/failover) while onboarding and broad due diligence remain in the Third-Party Risk Policy; confirm the evidence hand-off and ownership split.
