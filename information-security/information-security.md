---
title: Information Security Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Information Security, Cybersecurity, GLBA, NCUA 748, Identity Theft, Incident Response]
---

## General Policy Statement

Pynthia Credit Union maintains a board-governed, risk-based information security program to protect the confidentiality, integrity, availability, and resilience of member and organizational information across people, facilities, data, systems, networks, vendors, AI tools, and member-facing channels. Engineering and operations implement each control below and evidence it through audit logs and periodic testing. This policy excludes online/mobile banking governance (E-Commerce Policy), payment rails (Electronic Payment Systems Policy), advertising compliance (Fair Lending Policy), enterprise risk methodology (Enterprise Risk Management Policy), vendor lifecycle mechanics (Third-Party Risk Policy), business continuity planning (Business Continuity Plan Policy), and member privacy rights (Privacy Policy); this policy contributes the information-security inputs to those programs.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Quarterly KPI report to Board | Quarter closes (`security.quarter_closed`) | 30 days post-quarter | Program KPIs, charter, review status | [IS-01](#is-01-governance-oversight) |
| New product security risk assessment | Product initiated (`product.initiated`) | 10 business days | Lightweight risk findings to ERM | [IS-02](#is-02-enterprise-risk-assessment) |
| High/Very High residual risk reassessment | Reassessment due (`risk.reassessment_due_at`) | Quarterly | Updated residual rating | [IS-02](#is-02-enterprise-risk-assessment) |
| CMDB delta posting | Asset changes (`asset.changed`) | 5 business days | Updated inventory + classification | [IS-03](#is-03-asset-inventory-classification) |
| CAB review of medium/high change | RFC submitted (`change.rfc_submitted`) | 3 business days | CAB decision record | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change post-review | Emergency deployed (`change.emergency_deployed`) | 24 hours | Post-review record | [IS-04](#is-04-change-management-configuration-control) |
| Critical vuln patch | Finding confirmed (`vuln.finding_confirmed`) | 7 days (Crit) / 15 (High) / 30 (Med) | POA&M closure | [IS-05](#is-05-vulnerability-penetration-testing) |
| Termination deprovisioning | Employee separated (`employee.separated`) | Same business day | Access revoked | [IS-06](#is-06-access-control-authentication) |
| Quarterly access review | Review due (`access.review_due`) | Quarterly | Review attestation | [IS-06](#is-06-access-control-authentication) |
| Data disposal at eligibility | Retention expired (`record.retention_expired`) | 30 days of eligibility | Disposal certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Restore verification | Backup cycle (`backup.cycle_completed`) | Weekly | Restore verified | [IS-08](#is-08-backup-disaster-recovery) |
| Annual DR exercise | Exercise scheduled (`dr.exercise_due_at`) | Annual | DR exercise results | [IS-08](#is-08-backup-disaster-recovery) |
| NCUA cyber incident notice | Reportable determined (`incident.classified`) | 72 hours | NCUA notification | [IS-09](#is-09-incident-response-cyber-reporting) |
| Member breach notice | Member impact confirmed (`incident.member_impact_confirmed`) | Without unreasonable delay | Member notice per Appendix B | [IS-09](#is-09-incident-response-cyber-reporting) |
| Red-flag case review | Red flag detected (`redflag.detected`) | Same day | Step-up / hold disposition | [IS-10](#is-10-identity-theft-red-flags-program) |
| Red-flag ruleset review | Review due (`redflag.review_due_at`) | Quarterly | Updated ruleset | [IS-10](#is-10-identity-theft-red-flags-program) |
| Vendor breach triage | Vendor breach notified (`vendor.breach_notified`) | Vendor notice ≤24h; internal triage ≤1 BD | Triage record | [IS-11](#is-11-vendor-risk-management) |
| Badge deactivation on separation | Employee separated (`employee.separated`) | 24 hours | Badge deactivated | [IS-12](#is-12-physical-security-facilities) |
| AI register update | Tool approved (`ai.tool_approved`) | 5 days | Updated AI register | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical SIEM alert review | Critical alert (`siem.alert_critical`) | Daily | Alert disposition | [IS-14](#is-14-logging-monitoring-alerting) |
| AUP acknowledgment before access | New hire / role change (`employee.hired`) | Before access granted | Signed acknowledgment | [IS-15](#is-15-acceptable-use-communications) |
| Social media takedown escalation | Impersonation detected (`socialmedia.impersonation_detected`) | Same day | Takedown escalation | [IS-16](#is-16-social-media) |
| New-hire security training | Employee hired (`employee.hired`) | 30 days | Completion record | [IS-17](#is-17-training-awareness-testing) |
| Security records destruction queue | Destruction cycle due (`record.destruction_cycle_due_at`) | Monthly | Destruction log | [IS-18](#is-18-records-management-retention) |

## IS-01 — Governance & Oversight  {#is-01-governance-oversight}

- **WHY (Reg cite):** NCUA requires a board-approved, written security program with continued administration ([12 CFR §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0)); the GLBA safeguards principle requires board oversight of the information security program ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801); [12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)).

- **SYSTEM BEHAVIOR:** The credit union maintains a single authoritative Security Program record holding the charter, owners, KPIs, and review cadence. The board approves the policy annually and receives a quarterly KPI report within 30 days of quarter close. When the policy review window lapses, the system flags it for escalation; if no quarterly report is produced within the deadline a board-notification aging alert fires. The Security Program record and KPI snapshot are write-restricted to Compliance; engineering may emit events but not edit governance attributes.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarter closes (`security.quarter_closed`) | KPI snapshot (`security.kpi_snapshot`), program charter (`security.program_charter`) | Board KPI report + delivery record (`security.board_report_issued`) | 30 days post-quarter (enforced by `security.board_report_due_at`) |
  | Annual policy review cycle opens (`security.policy_review_opened`) | Policy document (`policy.document_id`), version (`policy.document_version`) | Board-approved policy (`security.policy_approved`) | Annual (enforced by `policy.board_approval_due_at`) |
  | Board package distributed (`governance.board_report_delivered`) | Board pack (`reporting.board_pack_submitted`), meeting date (`board.meeting_date`) | Board minutes recorded (`board.minutes_recorded`) | Per board cadence (enforced by `reporting.board_pack_due`) |

- **ALERTS/METRICS:** Alert when `policy.review_lapsed` or board KPI report exceeds 30-day SLA (`alert.policy_review_aging`); target zero overdue board reports and 100% on-time annual approval.

## IS-02 — Enterprise Risk Assessment  {#is-02-enterprise-risk-assessment}

- **WHY (Reg cite):** NCUA App. A requires a written risk assessment identifying threats to member information and the controls that mitigate them ([12 CFR Part 748 App. A, III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA requires ongoing risk-based safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** A security risk register maps assets, threats, and controls — including fraud, social engineering, ID theft, and AI risks — and feeds the centralized enterprise risk register owned by the ERM Policy. Reassessment cadence follows ERM tiers: High/Very High at least quarterly, Moderate at least annually, Low/Very Low every two years or on a trigger event, with monthly POA&M updates. New products receive a lightweight security risk assessment within 10 business days, submitted as input to the ERM new-product review; if an assessment is overdue the register flags the gap. The risk register and residual ratings are write-restricted to Risk and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | New product initiated (`product.initiated`) | Candidate profile (`risk.candidate_profile`), threat catalog (`risk.threat_catalog`), partner dependency (`risk.partner_dependency`) | Product risk assessment to ERM (`risk.product_assessment_completed`) | 10 business days (enforced by `risk.product_assessment_due_at`) |
  | Reassessment due for a residual-risk tier (`risk.reassessment_due_at`) | Inherent rating (`risk.inherent_rating`), residual rating (`risk.residual_rating`), last assessed (`risk.last_assessed_at`) | Updated risk assessment (`risk.assessment_completed`) | Quarterly/annual/biennial by tier (enforced by `risk.reassessment_due_at`) |
  | Monthly POA&M cycle (`risk.poam_updated`) | POA&M status (`risk.poam_status`), remediation evidence (`risk.remediation_evidence`) | Updated POA&M (`risk.poam_updated`) | Monthly (enforced by `risk.assessment_timer`) |

- **ALERTS/METRICS:** Alert on `risk.review_overdue` and `risk.ownership_gap_detected`; target zero overdue high/very-high reassessments and 100% new-product assessments completed within 10 BD.

## IS-03 — Asset Inventory & Classification  {#is-03-asset-inventory-classification}

- **WHY (Reg cite):** NCUA App. A requires the institution to know where member information resides and to classify it for protection ([12 CFR Part 748 App. A, II–III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA requires safeguards proportionate to data sensitivity ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** A CMDB tracks hardware, software, data stores, and vendors with a data classification of Public, Internal, or Confidential-NPI. Inventory deltas post within 5 business days of any change, and asset owners attest to the inventory quarterly. A schedule-drift detection routine surfaces stale records. CMDB classification fields are write-restricted to the Information Security/IT lead and asset owners.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Asset added or modified (`asset.changed`) | CMDB snapshot (`asset.cmdb_snapshot`), classification (`asset.classification`), owner (`asset.owner`) | CMDB updated (`asset.cmdb_updated`) | 5 business days (enforced by `asset.cmdb_update_due_at`) |
  | Quarterly attestation cycle (`asset.attestation_completed`) | Owner roster (`asset.owner_roster`), classification (`asset.classification`) | Attestation record (`asset.attestation_completed`) | Quarterly (enforced by `asset.cmdb_update_due_at`) |

- **ALERTS/METRICS:** Alert on CMDB delta posting beyond 5 BD and on missed quarterly attestations; target 100% asset coverage with current classification.

## IS-04 — Change Management & Configuration Control  {#is-04-change-management-configuration-control}

- **WHY (Reg cite):** NCUA App. A requires controls over changes to systems that handle member information to preserve integrity and availability ([12 CFR Part 748 App. A, III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** An RFC workflow captures risk rating, test evidence, backout plan, and approval. The Change Advisory Board reviews medium/high-risk changes within 3 business days; emergency changes deploy under documented justification and receive a post-implementation review within 24 hours. Configuration drift against approved baselines is detected and resolved. RFC approval and CAB decisions are write-restricted to authorized change approvers.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | RFC submitted (`change.rfc_submitted`) | Risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`), approver (`change.approver_id`) | CAB decision recorded (`change.cab_decision_recorded`) | 3 business days for medium/high (enforced by `change.cab_review_due_at`) |
  | Emergency change deployed (`change.emergency_deployed`) | Emergency justification (`change.emergency_justification`), rollback plan (`change.rollback_plan`) | Post-review completed (`change.post_review_completed`) | 24 hours (enforced by `change.post_review_due_at`) |
  | Configuration drift detected (`config.drift_detected`) | Baseline id (`config.baseline_id`), drift detail (`config.drift_detail`) | Drift resolved (`config.drift_resolved`) | Per change SLA (enforced by `change.cab_review_due_at`) |

- **ALERTS/METRICS:** Alert on CAB review aging past 3 BD and emergency post-review past 24h; target zero unreviewed emergency changes and zero unresolved baseline drift.

## IS-05 — Vulnerability & Penetration Testing  {#is-05-vulnerability-penetration-testing}

- **WHY (Reg cite):** NCUA App. A requires regular testing of key controls, systems, and procedures, including by independent parties ([12 CFR Part 748 App. A, III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Automated scans run on schedule and an independent external penetration test runs annually. High-risk findings are triaged within 5 business days; remediation deadlines are Critical within 7 days, High within 15, Medium within 30, all tracked to closure in a POA&M. The penetration-test engagement record carries an independence attestation. Vulnerability findings and POA&M closure status are write-restricted to the Information Security/IT lead and SecOps.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Vulnerability finding created (`vuln.finding_created`) | Severity (`vuln.severity`), finding detail (`vuln.detail`) | Triage completed (`vuln.triage_completed`) | 5 business days for high-risk (enforced by `vuln.triage_due_at`) |
  | Finding confirmed for patching (`vuln.finding_confirmed`) | Remediation plan (`vuln.remediation_plan`), severity (`vuln.severity`) | Remediated + POA&M closure (`vuln.remediated`) | Crit 7d / High 15d / Med 30d (enforced by `vuln.remediation_due_at`) |
  | Annual pen-test scheduled (`pentest.scheduled`) | Engagement scope (`pentest.scope`), independence (`pentest.independence`) | Pen-test report issued (`pentest.report_issued`) | Annual (enforced by `pentest.engagement_due`) |

- **ALERTS/METRICS:** Alert on any Critical finding open past 7 days and high-risk triage past 5 BD; target zero overdue Critical/High remediations and an annual independent pen-test on schedule.

## IS-06 — Access Control & Authentication  {#is-06-access-control-authentication}

- **WHY (Reg cite):** NCUA App. A requires access controls on member information systems and restrictions to authorized individuals ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** SSO and MFA are enforced, access is least-privilege and role-based, and joiner/mover/leaver changes are automated. On termination, access is deprovisioned the same business day. Quarterly access reviews are attested by reviewers. Break-glass accounts require justification and are heavily logged and reviewed after use. Separation-of-duties conflicts block grants unless a compensating control is approved. Role entitlements, break-glass justification records, and access-review attestations are write-restricted to the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Employee separated (`employee.separated`) | User id (`user.id`), role (`user.role`), employment status (`user.employment_status`) | Access deprovisioned (`access.deprovisioned`) | Same business day (enforced by `access.deprovision_due_at`) |
  | Quarterly access review due (`access.review_due`) | Reviewer roster (`access.reviewer_roster`), role entitlements (`access.role_entitlements`) | Review completed + attestation (`access.review_completed`) | Quarterly (enforced by `access.review_due`) |
  | Break-glass account used (`access.granted`) | Break-glass id (`access.breakglass_id`), justification (`access.breakglass_justification`) | Break-glass review logged (`access.review_completed`) | Reviewed post-use (enforced by `access.review_due_at`) |
  | SoD conflict on grant (`sod.conflict_detected`) | Matrix version (`sod.matrix_version`), compensating control (`sod.compensating_control`) | Grant blocked or compensating control approved (`sod.compensating_control_approved`) | Before grant (enforced by `sod.review_timer`) |

- **ALERTS/METRICS:** Alert on any same-day deprovision miss and on break-glass use without a logged review; target zero terminations with residual access and 100% quarterly review completion.

## IS-07 — Data Protection, Encryption & Disposal  {#is-07-data-protection-encryption-disposal}

- **WHY (Reg cite):** NCUA App. A requires encryption of member information in transit and storage and secure disposal of records ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); the FACTA Disposal Rule requires reasonable measures to render consumer information unreadable on disposal ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)).

- **SYSTEM BEHAVIOR:** Data is encrypted in transit and at rest with approved cryptography (e.g., AES-256, TLS 1.2+), DLP is enforced, and disposed data is rendered unreadable. Disposal completes within 30 days of eligibility unless a litigation hold is in effect, in which case the disposal clock pauses and resumes on hold release. Crypto configuration and disposal methods are write-restricted to the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Record reaches disposal eligibility (`record.retention_expired`) | Disposal eligible flag (`record.disposal_eligible`), disposal method (`record.disposal_method`), legal-hold status (`record.hold_status`) | Disposal executed + certificate (`disposal.executed`) | 30 days of eligibility unless on hold (enforced by `record.disposal_due_at`) |
  | TLS certificate assessment due (`tls.assessment_completed`) | Cipher suite (`tls.cipher_suite`), test rating (`tls.test_rating`) | Crypto verified (`crypto.verified`) | Per assessment cadence (enforced by `tls.assessment_due`) |
  | DLP violation detected (`dlp.violation_detected`) | Violation detail (`dlp.violation_detail`) | Violation resolved (`dlp.violation_resolved`) | Per incident SLA (enforced by `vuln.remediation_due_at`) |

- **ALERTS/METRICS:** Alert on disposal past 30 days of eligibility, expiring TLS certificates, and unresolved DLP violations; target zero overdue disposals and 100% approved-cipher coverage.

## IS-08 — Backup & Disaster Recovery  {#is-08-backup-disaster-recovery}

- **WHY (Reg cite):** NCUA App. A requires measures to protect against destruction or loss of member information and to ensure availability ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** RTO/RPO are defined per system, backups are offsite and immutable, restores are verified weekly, and a full DR exercise runs annually. Ransomware isolation and clean-room restores are available. A failed backup job is flagged and remediated. The RTO/RPO matrix and backup tier configuration are write-restricted to the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Backup cycle completes (`backup.cycle_completed`) | Backup catalog (`backup.catalog`), RPO monitor (`backup.rpo_monitor`) | Restore verified (`backup.restore_verified`) | Weekly (enforced by `backup.restore_test_due`) |
  | Backup job fails (`backup.job_failed`) | Job detail (`backup.job_detail`) | Job remediated (`backup.job_remediated`) | Per backup SLA (enforced by `backup.verify_due_at`) |
  | Annual DR exercise due (`dr.exercise_due_at`) | DR plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`) | DR exercise completed (`dr.exercise_completed`) | Annual (enforced by `dr.exercise_due_at`) |

- **ALERTS/METRICS:** Alert on failed restore verification and on DR exercise aging; target weekly restore success and an annual DR exercise meeting documented RTO/RPO.

## IS-09 — Incident Response & Cyber Incident Reporting  {#is-09-incident-response-cyber-reporting}

- **WHY (Reg cite):** NCUA requires notification to the NCUA as soon as possible and no later than 72 hours after a credit union reasonably believes a reportable cyber incident occurred ([12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1#p-748.1(c))); App. B requires a response program and member notice when misuse of sensitive member information is reasonably possible ([12 CFR Part 748 App. B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748)).

- **SYSTEM BEHAVIOR:** The credit union maintains an incident-response plan, roster, and playbooks. On determining a reportable incident, NCUA is notified within 72 hours; member notice is delivered without unreasonable delay per Appendix B once member impact is confirmed, coordinating with law enforcement and filing a SAR referral where applicable. Incident classification, NCUA notification, and member-notice content are write-restricted to Compliance and the incident commander.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Incident detected (`incident.detected`) | Detection source (`incident.detection_source`), scope (`incident.scope_initial`), severity (`incident.severity`) | Incident triaged (`incident.assessment_completed`) | Per IR SLA (enforced by `incident.triage_due_at`) |
  | Reportable cyber incident determined (`incident.classified`) | Reportability determination (`incident.reportability_determination`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA notified (`incident.ncua_notified`) | 72 hours (enforced by `incident.ncua_notice_due_at`) |
  | Member impact confirmed (`incident.member_impact_confirmed`) | Misuse likelihood (`incident.misuse_likelihood`), notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices_sent`) | Without unreasonable delay (enforced by `incident.notification_due_at`) |

- **ALERTS/METRICS:** Alert on NCUA notification aging toward 72h (`alert.ncua_notification_aging`) and on pending member notices; target zero late NCUA notifications and full member-notice coverage where misuse is reasonably possible.

## IS-10 — Identity Theft Red Flags Program  {#is-10-identity-theft-red-flags-program}

- **WHY (Reg cite):** NCUA requires a written identity-theft prevention program to detect, prevent, and mitigate identity theft on covered accounts ([12 CFR Part 717 Subpart J, §717.90](https://www.ecfr.gov/current/title-12/part-717/subpart-J/section-717.90)); furnisher and address-discrepancy duties under the FCRA implementing regulation ([12 CFR §717.82](https://www.ecfr.gov/current/title-12/part-717/section-717.82)).

- **SYSTEM BEHAVIOR:** A red-flag matrix drives detection across account opening and existing-account access, with step-up verification and account holds as responses. Detected red-flag cases are reviewed the same day; the ruleset is reviewed quarterly. SAR referral is made where applicable, and an address-change-plus-card-reissue within 30 days triggers re-verification before a new card is provided. The red-flag matrix and case dispositions are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Red flag detected (`redflag.detected`) | Red-flag type (`redflag.type`), step-up required (`redflag.stepup_required`) | Case opened + step-up completed (`redflag.stepup_completed`) | Same day (enforced by `redflag.review_due_at`) |
  | Card reissue during address hold (`redflag.detected`) | Address/reissue match (`redflag.address_reissue_match`), member id (`member.id`) | Reissue verified before card issued (`redflag.reissue_verified`) | Before card issuance (enforced by `member.address_hold_expires_at`) |
  | Quarterly ruleset review due (`redflag.review_due_at`) | Pattern updates (`redflag.pattern_updates`), case stats (`redflag.case_stats`) | Ruleset updated (`redflag.ruleset_updated`) | Quarterly (enforced by `redflag.review_due_at`) |

- **ALERTS/METRICS:** Alert on red-flag cases unreviewed same day and on overdue quarterly ruleset review; target zero same-day-review breaches and 100% step-up completion on triggered flags.

## IS-11 — Vendor Risk Management  {#is-11-vendor-risk-management}

- **WHY (Reg cite):** NCUA App. A requires oversight of service-provider arrangements, including due diligence and contractual safeguards for member information ([12 CFR Part 748 App. A, III.D](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA service-provider obligations ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Information-security due diligence (security questionnaires, privacy controls, SOC reports, pen-test results) is the InfoSec contribution to the vendor lifecycle owned by the Third-Party Risk Policy. Contracts require breach notice, data disposition, and a right to audit; breach-notice windows align to Third-Party Risk's standard — vendors notify the institution within 24 hours of discovery, and internal security triage completes within 1 business day. High-risk vendors are reviewed annually consistent with Third-Party Risk monitoring cadences. Vendor due-diligence packages and GLBA addendum verification are write-restricted to Risk and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Vendor InfoSec due diligence initiated (`vendor.due_diligence_initiated`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), NPI access flag (`vendor.npi_access_flag`) | InfoSec diligence completed (`vendor.fl_dd_completed`) | Per onboarding SLA (enforced by `vendor.review_due_at`) |
  | Vendor breach notified (`vendor.breach_notified`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`) | Incident triaged (`vendor.incident_logged`) | Vendor ≤24h; internal triage ≤1 BD (enforced by `vendor.incident_triage_due`) |
  | High-risk vendor annual review due (`vendor.annual_review_due_at`) | GLBA addendum (`vendor.glba_addendum_id`), evidence refreshed (`vendor.evidence_refreshed`) | Annual review completed (`vendor.monitoring_review_completed`) | Annual (enforced by `vendor.annual_review_due_at`) |

- **ALERTS/METRICS:** Alert on vendor breach triage past 1 BD and on overdue high-risk annual reviews; target zero late breach triage and 100% GLBA-clause verification on NPI-access vendors.

## IS-12 — Physical Security & Facilities  {#is-12-physical-security-facilities}

- **WHY (Reg cite):** NCUA App. A requires physical access controls protecting member information and facilities ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); ADA supports accessible yet controlled facility access ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)).

- **SYSTEM BEHAVIOR:** Card/access controls, visitor escort and logging, CCTV/alarm monitoring, and secure areas for servers and media are enforced. On separation, badges deactivate within 24 hours. Visitor arrivals are logged and secure-area access is approved before grant. Facility access lists and badge status are write-restricted to Facilities and the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Employee separated (`employee.separated`) | Badge id (`facility.badge_id`), employee id (`employee.id`) | Badge deactivated (`facility.badge_deactivated`) | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
  | Visitor arrives at facility (`facility.visitor_arrived`) | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), zone (`facility.zone`) | Visitor logged (`facility.visitor_logged`) | At arrival (enforced by `facility.test_due_at`) |
  | Secure-area access requested (`facility.secure_access_granted`) | Access approval (`facility.access_approval`), CCTV ref (`facility.cctv_ref`) | Secure access granted (`facility.secure_access_granted`) | At grant (enforced by `facility.test_due_at`) |

- **ALERTS/METRICS:** Alert on badge deactivation past 24h and on visitors without a logged escort; target zero active badges for separated staff and complete visitor logs.

## IS-13 — AI Governance & Usage Disclosure  {#is-13-ai-governance-usage-disclosure}

- **WHY (Reg cite):** AI tools that touch member NPI fall under the GLBA safeguards principle and NCUA App. A risk-assessment and control obligations ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801); [12 CFR Part 748 App. A, III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)).

- **SYSTEM BEHAVIOR:** A default pro-AI posture operates under controls: an AI Use Register, a DPIA before production, vendor/feature review, member-facing disclosure, and a prohibition on uploading NPI to external AI without approval. The AI register updates within 5 days of an approval. NPI-upload attempts to unapproved external AI are blocked and dispositioned. The AI Use Register and approval records are write-restricted to Compliance and the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | AI tool approved (`ai.tool_approved`) | Use case (`ai.use_case`), DPIA reference (`ai.dpia_ref`), approval record (`ai.approval_record`) | AI register updated (`ai.register_updated`) | 5 days of approval (enforced by `ai.register_update_due_at`) |
  | Member-facing AI feature launched (`ai.member_feature_launched`) | Disclosure text (`ai.disclosure_text`), disclosure channel (`ai.disclosure_channel`) | Disclosure published (`ai.disclosure_published`) | Before/at launch (enforced by `ai.register_update_due_at`) |
  | Unapproved NPI-to-AI attempt (`dlp.violation_detected`) | DLP violation detail (`dlp.violation_detail`), data classification (`asset.classification`) | Violation disposed (`ai.violation_disposed`) | Per incident SLA (enforced by `vuln.remediation_due_at`) |

- **ALERTS/METRICS:** Alert on AI register update past 5 days and on any blocked NPI-to-external-AI event; target zero unapproved NPI uploads and 100% DPIA completion before production.

## IS-14 — Logging, Monitoring & Alerting  {#is-14-logging-monitoring-alerting}

- **WHY (Reg cite):** NCUA App. A requires monitoring systems to detect actual and attempted attacks on or intrusions into member-information systems ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Logs are centralized in a SIEM with time synchronization and real-time alerting for critical events. Critical alerts are reviewed daily, and security-relevant logs are retained at least 12 months aligned to the records schedule. A silent log source is detected and restored. SIEM alert dispositions and source inventory are write-restricted to SecOps and the Information Security/IT lead.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Critical SIEM alert raised (`siem.alert_critical`) | Alert detail (`siem.alert_detail`), last seen (`siem.last_seen_at`) | Alert disposed (`siem.alert_disposed`) | Daily review (enforced by `siem.alert_review_due_at`) |
  | Log source goes silent (`siem.source_silent`) | Source inventory (`siem.source_inventory`) | Source restored (`siem.source_restored`) | Per monitoring SLA (enforced by `siem.alert_review_due_at`) |
  | Intrusion detected (`intrusion.detected`) | Intrusion severity (`intrusion.severity`) | Intrusion response recorded (`intrusion.response_recorded`) | Per IR SLA (enforced by `incident.triage_due_at`) |

- **ALERTS/METRICS:** Alert on critical alerts unreviewed within the daily window and on any silent SIEM source; target 12-month minimum log retention and daily critical-alert clearance.

## IS-15 — Acceptable Use & Communications Systems  {#is-15-acceptable-use-communications}

- **WHY (Reg cite):** NCUA App. A requires personnel controls and clear responsibilities for safeguarding member information ([12 CFR Part 748 App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Permitted use of devices, email, messaging, internet, and removable media is documented with monitoring notice and BYOD/remote-work safeguards. Acknowledgment of the Acceptable Use Policy is required before access is granted, and a revised AUP requires re-acknowledgment. BYOD enrollment validates encryption and MDM status. The AUP content and acknowledgment records are write-restricted to Compliance and HR.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Employee hired or role changed (`employee.hired`) | User id (`user.id`), role (`user.role`) | AUP acknowledged (`aup.acknowledged`) | Before access granted (enforced by `policy.acknowledgment_due_at`) |
  | AUP revised (`aup.revised`) | Revision summary (`aup.revision_summary`) | Re-acknowledged (`aup.reacknowledged`) | Before continued access (enforced by `policy.acknowledgment_due_at`) |
  | BYOD enrollment requested (`byod.enrollment_requested`) | Encryption status (`byod.encryption_status`), MDM status (`byod.mdm_status`) | BYOD enrolled (`byod.enrolled`) | Before device access (enforced by `policy.acknowledgment_due_at`) |

- **ALERTS/METRICS:** Alert on access granted without a signed acknowledgment and on BYOD devices failing encryption/MDM; target 100% acknowledgment before access and zero non-compliant enrolled devices.

## IS-16 — Social Media  {#is-16-social-media}

- **WHY (Reg cite):** Social-media handling of member information and impersonation risk falls under the GLBA safeguards principle and NCUA App. A control obligations ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801); [12 CFR Part 748 App. A, III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)).

- **SYSTEM BEHAVIOR:** Corporate posts are pre-approved, personal posts require disclaimers, and disclosure of member information is prohibited. Scam and impersonation incidents escalate to a same-day takedown. A detected unauthorized member-information disclosure is dispositioned. Social-media approvals and impersonation evidence are write-restricted to Compliance and the approver.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Corporate post drafted (`socialmedia.post_drafted`) | Post content (`socialmedia.post_content`), approver (`socialmedia.approver`) | Post approved (`socialmedia.post_approved`) | Before publication (enforced by `socialmedia.takedown_due_at`) |
  | Impersonation detected (`socialmedia.impersonation_detected`) | Impersonation detail (`socialmedia.impersonation_detail`), evidence (`socialmedia.evidence`) | Takedown escalated (`socialmedia.takedown_escalated`) | Same day (enforced by `socialmedia.takedown_due_at`) |
  | Member-info disclosure detected (`socialmedia.disclosure_detected`) | Evidence (`socialmedia.evidence`) | Disclosure disposed (`socialmedia.disclosure_disposed`) | Same day (enforced by `socialmedia.takedown_due_at`) |

- **ALERTS/METRICS:** Alert on impersonation cases without same-day takedown escalation; target zero unapproved corporate posts and same-day escalation on all impersonation/scam events.

## IS-17 — Training, Awareness & Testing  {#is-17-training-awareness-testing}

- **WHY (Reg cite):** NCUA App. A requires staff training to implement the information security program ([12 CFR Part 748 App. A, III.C.2](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Role-based training is delivered with quarterly phishing simulations and high-risk-role deep-dives. New hires complete training within 30 days, with annual refreshers, and repeated phishing failures trigger re-training. Phishing results and completion records are write-restricted to Compliance and HR.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Employee hired (`employee.hired`) | Assignee id (`training.assignee_id`), role matrix (`training.role_matrix`), hire date (`training.hire_date`) | New-hire training completed (`training.onboarding_completed`) | 30 days (enforced by `training.newhire_due_at`) |
  | Annual refresher cycle opens (`training.annual_cycle_opened`) | Curriculum id (`training.curriculum_id`), content version (`training.content_version`) | Refresher completed (`training.refresher_completed`) | Annual (enforced by `training.annual_due_at`) |
  | Phishing simulation launched (`phishing.simulation_launched`) | Scenario (`phishing.scenario`), failure history (`phishing.failure_history`) | Results recorded; remedial assigned on repeat failure (`phishing.results_recorded`) | Quarterly (enforced by `training.annual_due_at`) |

- **ALERTS/METRICS:** Alert on new-hire training past 30 days and on lapsed annual refreshers; target 100% on-time new-hire completion and declining repeat phishing-failure rates.

## IS-18 — Records Management & Retention  {#is-18-records-management-retention}

- **WHY (Reg cite):** NCUA requires preservation of vital records and a records-preservation program ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)); the FACTA Disposal Rule governs secure disposal of consumer information ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)).

- **SYSTEM BEHAVIOR:** The Record Retention Policy's Schedule A periods apply to security-specific record classes — SIEM and audit logs, incident-response records, vulnerability findings and POA&Ms, access-review evidence, AI-use registry entries, and physical security logs. The security destruction queue processes monthly unless a legal hold (governed by the Record Retention Policy) is in effect; disposal aligns with [IS-07](#is-07-data-protection-encryption-disposal) (render unreadable within 30 days of eligibility). Retention classes, holds, and destruction certificates are write-restricted to Records and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Security destruction cycle due (`record.destruction_cycle_due_at`) | Retention class (`record.retention_class`), disposal eligible (`record.disposal_eligible`), hold status (`record.hold_status`) | Records destroyed + certificate (`record.destruction_certified`) | Monthly unless on hold (enforced by `record.destruction_cycle_due_at`) |
  | Legal hold placed (`legal.hold_placed`) | Hold scope (`legal.hold_scope`), matter id (`legal.matter_id`) | Hold applied; clock paused (`record.hold_applied`) | At hold notice (enforced by `record.retention_expires_at`) |
  | Legal hold released (`legal.hold_released`) | Hold release auth (`record.hold_release_auth`) | Hold lifted; clock resumed (`record.hold_released`) | On release (enforced by `record.destruction_cycle_due_at`) |

- **ALERTS/METRICS:** Alert on destruction queue not run monthly and on records past retention without disposal or hold; target zero over-retained records and 100% destruction-certificate coverage.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the Security Program record, annual policy approval cycle, and quarterly Board/Supervisory Committee KPI reporting.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Information Security/IT lead, Engineering/SecOps, Risk, Privacy, HR, Facilities, and the Board/Supervisory Committee as required.
- **Review cadence:** Annual policy approval; quarterly KPI report within 30 days of quarter close; control-level cadences per each overlay's *Within* column.
- **Cross-references:** ERM Policy (risk taxonomy and scoring, [IS-02](#is-02-enterprise-risk-assessment)); Third-Party Risk Policy (vendor lifecycle, [IS-11](#is-11-vendor-risk-management)); Record Retention Policy (Schedule A and legal holds, [IS-18](#is-18-records-management-retention)); Privacy, E-Commerce, Electronic Payment Systems, Fair Lending, and Business Continuity Plan policies for out-of-scope domains.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several event, field, and timer codes used in the control overlays are not registered in `core-vocabulary.json` (parsed spec is banking-core only) and were composed under the registered grammar or drawn from the provisional list. These include: composed timers `ai.register_update_due_at` (subject `ai_register`, task type `update`), `vendor.incident_triage_due` (subject `vendor_incident`, task type `triage`), and `record.destruction_cycle_due_at` (subject `record`, task type `disposal`); composed/registered codes used here whose exact spelling will be confirmed by engineering include `crypto.verified`, `tls.assessment_completed`, `byod.enrollment_requested`, `siem.source_silent`, and `socialmedia.disclosure_detected`. Field codes referenced from the provisional list (e.g., `risk.candidate_profile`, `risk.partner_dependency`, `vendor.breach_detail`, `policy.document_id`) carry their agreed provisional spellings. Engineering will confirm registration before the next review.
- **Charter and NCUA applicability.** Pynthia Credit Union is treated as a federally-related credit union subject to NCUA 12 CFR Parts 748, 749, and 717 Subpart J. If the charter is state-only with a different supervisory regime, the WHY citations and the 72-hour NCUA notification path in [IS-09](#is-09-incident-response-cyber-reporting) must be re-mapped to the applicable regulator.
- **Reportable cyber incident definition.** [IS-09](#is-09-incident-response-cyber-reporting) assumes the §748.1(c) "reasonable belief that a reportable cyber incident has occurred" standard drives the 72-hour clock from `incident.classified`. The precise internal determination criteria (severity thresholds, data-scope triggers) are assumed and need Compliance confirmation.
- **Vendor breach-notice alignment.** [IS-11](#is-11-vendor-risk-management) assumes the Third-Party Risk Policy standard of vendor notice within 24 hours of discovery and internal triage within 1 business day. If Third-Party Risk's standard differs, this control's *Within* values must be re-aligned.
- **Encryption standards are illustrative.** AES-256 and TLS 1.2+ in [IS-07](#is-07-data-protection-encryption-disposal) are stated as examples per Patrick's notes; the authoritative approved-cryptography list is maintained by the Information Security/IT lead and assumed to match.
- **Schedule A retention periods.** [IS-18](#is-18-records-management-retention) assumes the Record Retention Policy's Schedule A specifies concrete periods for each security record class and that the 12-month minimum log retention in [IS-14](#is-14-logging-monitoring-alerting) is consistent with it; any conflict resolves in favor of the longer period and needs Records confirmation.
- **Patch-window SLAs as stated.** Critical 7 / High 15 / Medium 30 days in [IS-05](#is-05-vulnerability-penetration-testing) are taken directly from Patrick's notes and assumed to be the approved standard; no separate regulatory deadline is implied.
