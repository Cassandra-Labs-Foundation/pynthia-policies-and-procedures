---
title: Information Security Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Information Security, Cybersecurity, NCUA-748, GLBA, Red-Flags]
---

## General Policy Statement

Pynthia Credit Union maintains a board-governed, risk-based information security program to safeguard member and organizational information and ensure its confidentiality, integrity, availability, and resilience across people, facilities, data, systems, networks, vendors, AI tools, and member-facing channels. This policy implements NCUA 12 CFR Part 748 and its Appendices A and B, the Identity Theft Red Flags rule (12 CFR Part 717 Subpart J), GLBA safeguards (15 USC §§6801–6809), the FACTA Disposal Rule (16 CFR Part 682), and records-preservation requirements (12 CFR Part 749). Engineering and operations implement each control below and evidence it through audit logs and periodic testing. Enterprise risk methodology, vendor program mechanics, business continuity, privacy notices, e-commerce channel governance, and payment-rail controls are governed by the cross-referenced policies and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Reportable cyber incident determined | IR team determines incident is reportable (`incident.reportable_determined` recorded) | 72 hours | NCUA notice to regulator | [IS-09](#is-09-incident-response-cyber-incident-reporting) |
| Member harm likely from incident | Misuse of member info determined likely (`incident.member_impact_confirmed`) | Without unreasonable delay | Appendix B member notice | [IS-09](#is-09-incident-response-cyber-incident-reporting) |
| Quarterly KPI reporting to Board | Quarter closes (`security.quarter_closed`) | 30 days post-quarter | Security program KPI pack | [IS-01](#is-01-governance-oversight) |
| New product security risk assessment | New product proposed (`risk.product_assessment_completed`) | 10 business days | Lightweight risk assessment | [IS-02](#is-02-enterprise-risk-assessment) |
| Asset inventory change | CMDB-relevant change (`asset.changed`) | 5 business days | CMDB delta posting | [IS-03](#is-03-asset-inventory-classification) |
| Medium/high-risk change | RFC submitted (`change.rfc_submitted`) | 3 business days CAB review | CAB decision record | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change deployed | Emergency change deployed (`change.emergency_deployed`) | 24 hours post-review | Post-implementation review | [IS-04](#is-04-change-management-configuration-control) |
| Critical vulnerability found | Vuln confirmed Critical (`vuln.finding_confirmed`) | 7 days patch | POA&M closure | [IS-05](#is-05-vulnerability-penetration-testing) |
| Employee termination | Separation recorded (`employee.separated`) | Same business day deprovision | Deprovision record | [IS-06](#is-06-access-control-authentication) |
| Data eligible for disposal | Disposal eligibility reached (`disposal.scheduled`) | 30 days | Destruction certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Backup restore verification | Weekly restore cycle (`backup.restore_verified`) | Weekly | Restore verification log | [IS-08](#is-08-backup-disaster-recovery) |
| Red-flag detected | Red flag triggered (`redflag.detected`) | Same day case review | Red-flag case disposition | [IS-10](#is-10-identity-theft-red-flags-program) |
| Vendor security breach | Vendor notifies institution (`vendor.breach_notified`) | 24 hr vendor notice / 1 BD triage | Vendor incident triage | [IS-11](#is-11-vendor-risk-management) |
| Staff separation (physical) | Separation recorded (`employee.separated`) | 24 hours badge deactivation | Badge deactivation record | [IS-12](#is-12-physical-security-facilities) |
| AI tool approved | AI tool approved (`ai.tool_approved`) | 5 days register update | AI Use Register entry | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical SIEM alert | Critical alert raised (`siem.source_silent` / `siem.alert_critical`) | Daily review | SIEM alert disposition | [IS-14](#is-14-logging-monitoring-alerting) |
| Access grant request | New hire / role change (`employee.hired`) | Before access granted | AUP acknowledgment | [IS-15](#is-15-acceptable-use-communications-systems) |
| Social media scam/impersonation | Impersonation detected (`socialmedia.impersonation_detected`) | Same-day takedown escalation | Takedown escalation record | [IS-16](#is-16-social-media) |
| New-hire security training | Hire recorded (`employee.hired`) | 30 days | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Security record destruction | Monthly destruction cycle (`record.destruction_initiated`) | Monthly | Destruction log entry | [IS-18](#is-18-records-management-retention) |

## IS-01 — Governance & Oversight {#is-01-governance-oversight}

- **WHY (Reg cite):** NCUA requires a written, board-approved security program with continued administration and oversight ([12 CFR §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0) and [Appendix A, III](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA establishes the safeguards mandate ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** A single authoritative Security Program record holds the charter, owners, KPIs, and review cadence; the program is reviewed and approved by the Board annually, and a KPI pack is delivered to the Board/Supervisory Committee within 30 days after each quarter closes. The program charter and KPI snapshot are write-restricted to Compliance and the InfoSec/IT lead. If a scheduled board meeting slips past the 30-day window, the KPI pack is still finalized on time and the board-receipt timestamp is logged when the meeting occurs.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual policy review cycle reached (`security.policy_review_opened`) | Program charter (`security.program_charter`), prior KPI snapshot (`security.kpi_snapshot`), policy version (`policy.document_version`) | Approved security policy + board resolution (`security.policy_approved`) | Annual (enforced by `policy.board_approval_due_at`) |
  | Quarter closes (`security.quarter_closed`) | KPI snapshot (`security.kpi_snapshot`), board package inputs (`board.package_distributed`) | Board KPI report delivered (`security.board_report_issued`) | 30 days post-quarter (enforced by `security.board_report_due_at`) |
- **ALERTS/METRICS:** Alert on board-report aging crossing 25 days post-quarter; track policy-review-lapsed flag at zero and target 100% on-time quarterly KPI delivery.

## IS-02 — Enterprise Risk Assessment {#is-02-enterprise-risk-assessment}

- **WHY (Reg cite):** NCUA Appendix A requires a risk assessment identifying reasonably foreseeable internal and external threats ([12 CFR Part 748, App. A, III.B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA underpins the ongoing assessment duty ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** An information-security risk register maps assets, threats (including fraud, social engineering, ID theft, and AI risks), and controls, and feeds the centralized enterprise register owned by the Enterprise Risk Management Policy. Residual ratings drive reassessment cadence per ERM tiers — High/Very High at least quarterly, Moderate at least annually, Low/Very Low every two years or on trigger — with monthly POA&M updates. For new products, a lightweight security risk assessment completes within 10 business days and is submitted as input to the ERM new-product review. Register write access is restricted to Risk and Compliance; the ERM scoring methodology itself lives in the Enterprise Risk Management Policy and is not redefined here.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk reassessment cadence reached for an entry (`risk.assessment_completed`) | Risk entry (`risk.id`), residual rating (`risk.residual_rating`), threat catalog (`risk.threat_catalog`), POA&M status (`risk.poam_status`) | Updated risk register entry (`risk.poam_updated`) | Tiered (quarterly/annual/biennial; enforced by `risk.reassessment_due_at`) |
  | New product proposed (`risk.product_assessment_completed`) | Candidate profile (`risk.candidate_profile`), impact/likelihood scores (`risk.impact_score`, `risk.likelihood_score`) | Product security risk assessment (`risk.product_assessment_completed`) | 10 business days (enforced by `risk.product_assessment_due_at`) |
- **ALERTS/METRICS:** Alert on any register entry with `risk.review_overdue` true; track POA&M monthly-update completion at 100% and zero overdue High/Very High reassessments.

## IS-03 — Asset Inventory & Classification {#is-03-asset-inventory-classification}

- **WHY (Reg cite):** NCUA Appendix A requires identifying and managing the systems and information to be protected ([12 CFR Part 748, App. A, III.B–C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** A CMDB tracks hardware, software, data stores, and vendors with data classification (Public/Internal/Confidential-NPI). Inventory deltas are posted within 5 business days of any change, and asset owners attest quarterly. Classification values are write-restricted to the InfoSec/IT lead and asset owners.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Asset added or changed (`asset.changed`) | Asset attributes (`asset.attributes`), classification (`asset.classification`), owner (`asset.owner`) | CMDB delta recorded (`asset.cmdb_updated`) | 5 business days (enforced by `asset.cmdb_update_due_at`) |
  | Quarterly attestation cycle reached (`asset.attestation_completed`) | CMDB snapshot (`asset.cmdb_snapshot`), owner roster (`asset.owner_roster`) | Attestation recorded (`asset.attestation_completed`) | Quarterly (enforced by `asset.cmdb_update_due_at`) |
- **ALERTS/METRICS:** Alert on CMDB deltas aging past 4 business days; track quarterly attestation coverage at 100% and zero unclassified Confidential-NPI stores.

## IS-04 — Change Management & Configuration Control {#is-04-change-management-configuration-control}

- **WHY (Reg cite):** NCUA Appendix A requires managing and controlling systems and processes to protect member information ([12 CFR Part 748, App. A, III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** An RFC workflow captures risk rating, test evidence, backout plan, and approval. Medium/high-risk changes require CAB review within 3 business days; emergency changes are deployed under documented justification and receive post-implementation review within 24 hours. Configuration drift against baselines is detected and resolved. RFC approval authority is restricted to designated CAB approvers.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | RFC submitted (`change.rfc_submitted`) | Risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`), approver (`change.approver_id`) | CAB decision recorded (`change.cab_decision_recorded`) | 3 business days for med/high (enforced by `change.cab_review_due_at`) |
  | Emergency change deployed (`change.emergency_deployed`) | Emergency justification (`change.emergency_justification`), deployment record (`change.deployment_record`) | Post-implementation review completed (`change.post_review_completed`) | 24 hours (enforced by `change.post_review_due_at`) |
  | Configuration drift detected (`config.drift_detected`) | Baseline id (`config.baseline_id`), drift detail (`config.drift_detail`) | Drift resolution recorded (`config.drift_resolved`) | Internal: 3 BD (no registered timer) |
- **ALERTS/METRICS:** Alert on CAB reviews aging past 3 business days and emergency post-reviews past 24 hours; track unresolved config drift count toward zero.

## IS-05 — Vulnerability Testing & Penetration Testing {#is-05-vulnerability-penetration-testing}

- **WHY (Reg cite):** NCUA Appendix A requires regular testing of key controls, systems, and procedures ([12 CFR Part 748, App. A, III.C.3](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** Automated scans run on schedule and an external penetration test runs annually by an independent firm. High-risk findings are triaged within 5 business days; patches are applied to Critical within 7 days, High within 15, and Medium within 30, all tracked to closure in a POA&M. Pen-test scope and independence attestation are restricted to the InfoSec/IT lead.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vulnerability confirmed (`vuln.finding_confirmed`) | Severity (`vuln.severity`), detail (`vuln.detail`), remediation plan (`vuln.remediation_plan`) | Triage completed (`vuln.triage_completed`) | High-risk triage 5 BD (enforced by `vuln.triage_due_at`) |
  | Patch SLA reached by severity (`vuln.remediated`) | Severity (`vuln.severity`), remediation plan (`vuln.remediation_plan`) | Remediation recorded to POA&M (`vuln.remediated`) | Critical 7 / High 15 / Medium 30 days (enforced by `vuln.remediation_due_at`) |
  | Annual pen-test cycle reached (`pentest.report_received`) | Scope (`pentest.scope`), independence (`pentest.independence`) | Pen-test report issued (`pentest.report_issued`) | Annual (enforced by `pentest.engagement_due`) |
- **ALERTS/METRICS:** Alert on any Critical patch breaching 7-day SLA; track POA&M Critical/High open-aging distribution and target zero overdue Critical findings.

## IS-06 — Access Control & Authentication {#is-06-access-control-authentication}

- **WHY (Reg cite):** NCUA Appendix A requires access controls and authentication on member-information systems ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** SSO/MFA and least-privilege role-based access are enforced, with joiner/mover/leaver automation. On termination, access is deprovisioned the same business day; access is reviewed quarterly; break-glass accounts are heavily logged with justification. Role entitlement definitions and break-glass review are restricted to the InfoSec/IT lead and Compliance. Separation-of-duties conflicts block grants pending a compensating control.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee separated (`employee.separated`) | User id (`user.id`), employment status (`user.employment_status`), role (`user.role`) | Access deprovisioned (`access.deprovisioned`) | Same business day (enforced by `access.deprovision_due_at`) |
  | Quarterly access review cycle reached (`access.review_completed`) | Reviewer roster (`access.reviewer_roster`), role entitlements (`access.role_entitlements`), review attestation (`access.review_attestation`) | Access review completed (`access_review.completed`) | Quarterly (enforced by `access.review_due_at`) |
  | Break-glass account used (`access.granted`) | Break-glass id (`access.breakglass_id`), justification (`access.breakglass_justification`) | Break-glass use logged + reviewed (`access.granted`) | Reviewed quarterly (enforced by `access.review_due_at`) |
  | SoD conflict on grant attempt (`sod.conflict_detected`) | Matrix version (`sod.matrix_version`), check result (`sod.check_result`) | Grant blocked / compensating control approved (`sod.compensating_control_approved`) | At grant time (no registered timer) |
- **ALERTS/METRICS:** Alert on any termination not deprovisioned same business day; track quarterly access-review completion at 100% and break-glass uses reviewed within the quarter.

## IS-07 — Data Protection, Encryption & Disposal {#is-07-data-protection-encryption-disposal}

- **WHY (Reg cite):** NCUA Appendix A requires encryption and secure disposal of member information ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); FACTA Disposal Rule requires reasonable measures to dispose of consumer information ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** Data is encrypted in transit and at rest with approved cryptography (e.g., AES-256, TLS 1.2+), DLP is enforced, and disposed data is rendered unreadable. Disposal completes within 30 days of eligibility unless under litigation hold, in which case the disposal clock pauses until the hold is released and then resumes. Crypto configuration baselines are write-restricted to the InfoSec/IT lead.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Data reaches disposal eligibility (`disposal.scheduled`) | Disposal method (`disposal.method`), hold flag (`disposal.held`), batch manifest (`disposal.batch_manifest_id`) | Disposal executed + certificate (`disposal.executed`, `disposal.certificate_recorded`) | 30 days (enforced by `record.disposal_due_at`) |
  | DLP violation detected (`dlp.violation_detected`) | Violation detail (`dlp.violation_detail`) | DLP violation resolved (`dlp.violation_resolved`) | Internal: 1 BD (no registered timer) |
  | TLS/crypto assessment cycle reached (`tls.assessment_completed`) | Cipher suite (`tls.cipher_suite`), crypto config (`crypto.config`) | Crypto verified (`crypto.verified`) | Per cycle (enforced by `tls.assessment_due`) |
- **ALERTS/METRICS:** Alert on disposal items aging past 25 days of eligibility (excluding held); track DLP violation MTTR and zero unencrypted Confidential-NPI stores.

## IS-08 — Backup & Disaster Recovery {#is-08-backup-disaster-recovery}

- **WHY (Reg cite):** NCUA Appendix A requires measures to protect against destruction, loss, or damage of member information ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); records preservation under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749). Detailed continuity planning is governed by the Business Continuity Plan Policy.
- **SYSTEM BEHAVIOR:** RTO/RPO are defined by system, offsite/immutable backups are maintained, restores are verified weekly, and a full DR exercise runs annually with ransomware isolation and clean-room restores. Backup tier configuration and RTO/RPO matrix are write-restricted to the InfoSec/IT lead.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Backup job completes (`backup.cycle_completed`) | Catalog (`backup.catalog`), tier config (`backup.tier_config`), RPO monitor (`backup.rpo_monitor`) | Backup verified (`backup.verified`) | Per schedule (enforced by `backup.verify_due_at`) |
  | Weekly restore verification cycle (`backup.restore_verified`) | Restore test env (`restore.test_env`), point validated (`restore.point_validated`) | Restore verified (`backup.restore_verified`) | Weekly (enforced by `backup.restore_test_due`) |
  | Annual DR exercise cycle reached (`dr.exercise_completed`) | DR plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`) | DR exercise completed (`dr.exercise_completed`) | Annual (enforced by `dr.exercise_due_at`) |
- **ALERTS/METRICS:** Alert on any missed weekly restore verification or RPO monitor breach; track DR exercise remediation closure and target zero failed restores.

## IS-09 — Incident Response & Cyber Incident Reporting {#is-09-incident-response-cyber-incident-reporting}

- **WHY (Reg cite):** NCUA requires 72-hour notification of a reportable cyber incident ([12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1)) and an incident response program with member notice ([12 CFR Part 748, App. B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748)).
- **SYSTEM BEHAVIOR:** An IR plan, roster, and playbooks are maintained. When an incident is determined reportable, NCUA is notified within 72 hours; where misuse of member information is likely, member notice is sent without unreasonable delay per Appendix B, coordinating with law enforcement and referring to BSA/SAR where applicable. The NCUA notice determination and member-notice template are write-restricted to the IR commander and Compliance. Incidents later determined non-reportable are documented with rationale and require no NCUA notice.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident determined reportable (`incident.classified`) | Reportability determination (`incident.reportable_determined`), rationale (`incident.reportability_rationale`), data scope (`incident.data_scope`), severity (`incident.severity`) | NCUA notified (`incident.ncua_notified`, `ncua.notification_sent`) | 72 hours (enforced by `incident.ncua_notice_due_at`) |
  | Member misuse likely (`incident.member_impact_confirmed`) | Misuse likelihood (`incident.misuse_likelihood`), notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent (`incident.member_notices_sent`) | Without unreasonable delay (enforced by `incident.notification_due_at`) |
  | Incident declared (`incident.declared`) | Detection source (`incident.detection_source`), scope initial (`incident.scope_initial`), IC assignment (`incident.ic_assignment_timer`) | IC assigned + triage recorded (`incident.ic_assigned`, `incident.assessment_completed`) | Triage (enforced by `incident.triage_due_at`) |
- **ALERTS/METRICS:** Alert on NCUA-notice aging crossing 48 hours after reportable determination; track member-notice latency distribution and target zero missed 72-hour deadlines.

## IS-10 — Identity Theft Red Flags Program {#is-10-identity-theft-red-flags-program}

- **WHY (Reg cite):** NCUA requires an identity-theft prevention program detecting and responding to red flags on covered accounts ([12 CFR Part 717 Subpart J / §717.90](https://www.ecfr.gov/current/title-12/part-717/subpart-J)).
- **SYSTEM BEHAVIOR:** A red-flag matrix drives detection with step-up verification and account holds. Red-flag cases are reviewed the same day and the ruleset is reviewed quarterly; SAR referral is made where applicable. Address-change-plus-card-reissue within 30 days triggers a reissue-verification check before the card is released. Ruleset changes are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Red flag detected (`redflag.detected`) | Red-flag type (`redflag.type`), step-up required (`redflag.stepup_required`) | Step-up completed / case disposed (`redflag.stepup_completed`, `redflag.case_disposed`) | Same day (enforced by `redflag.review_due_at`) |
  | Address change + card reissue within 30 days (`redflag.detected`) | Reissue match flag (`redflag.address_reissue_match`), member id (`member.id`) | Reissue verified before release (`redflag.reissue_verified`) | Before card release (no registered timer) |
  | Quarterly ruleset review cycle (`redflag.ruleset_updated`) | Pattern updates (`redflag.pattern_updates`), case stats (`redflag.case_stats`) | Ruleset updated (`redflag.ruleset_updated`) | Quarterly (enforced by `redflag.review_due_at`) |
- **ALERTS/METRICS:** Alert on any red-flag case open past same-day SLA; track quarterly ruleset-review completion and SAR-referral rate where applicable.

## IS-11 — Vendor Risk Management {#is-11-vendor-risk-management}

- **WHY (Reg cite):** NCUA Appendix A requires oversight of service-provider arrangements ([12 CFR Part 748, App. A, III.D](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards extend to service providers ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)). Broader vendor lifecycle mechanics are governed by the Third-Party Risk Policy.
- **SYSTEM BEHAVIOR:** Information-security due diligence (security questionnaires, privacy controls, SOC reports, pen-test results) is the InfoSec contribution to the vendor lifecycle. Contracts require breach notice, data disposition, and right to audit; vendors must notify the institution within 24 hours of discovery, with internal security triage completed within 1 business day. High-risk vendors are reviewed annually consistent with Third-Party Risk monitoring cadences. Vendor classification and contract-clause verification are restricted to Risk and Compliance; vendor onboarding mechanics beyond InfoSec diligence are governed by the Third-Party Risk Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor breach notified (`vendor.breach_notified`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`), NPI access flag (`vendor.npi_access_flag`) | Vendor incident triaged (`vendor.incident_logged`) | Vendor 24 hr / internal 1 BD (enforced by `vendor.incident_triage_due`) |
  | InfoSec due diligence cycle reached (`vendor.fl_dd_completed`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), GLBA addendum (`vendor.glba_addendum_id`) | InfoSec diligence completed (`vendor.diligence_completed`) | Per onboarding (no registered timer) |
  | Annual high-risk vendor review (`vendor.review_completed`) | Inherent risk (`vendor.inherent_risk`), criticality tier (`vendor.criticality_tier`), monitoring alert (`vendor.monitoring_alert`) | Vendor review completed (`vendor.monitoring_review_completed`) | Annual (enforced by `vendor.annual_review_due_at`) |
- **ALERTS/METRICS:** Alert on vendor incident triage aging past 1 business day; track high-risk vendor annual-review completion at 100%.

## IS-12 — Physical Security & Facilities {#is-12-physical-security-facilities}

- **WHY (Reg cite):** NCUA Appendix A requires physical access controls protecting member information and systems ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); ADA supports facilities access and visitor accommodation ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)).
- **SYSTEM BEHAVIOR:** Card/access controls, visitor escort and logging, CCTV/alarm monitoring, and secure areas for servers and media are enforced; badges are deactivated within 24 hours of separation. Visitor logs and badge management are restricted to Facilities; secure-zone access grants require approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee separated (`employee.separated`) | Badge id (`facility.badge_id`), zone (`facility.zone`) | Badge deactivated (`facility.badge_deactivated`) | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
  | Visitor arrives (`facility.visitor_arrived`) | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), access approval (`facility.access_approval`) | Visitor logged (`facility.visitor_logged`) | At entry (no registered timer) |
  | Annual facility security test cycle (`facility.test_completed`) | Test script (`facility.test_script`), CCTV ref (`facility.cctv_ref`) | Facility test completed (`facility.test_completed`) | Annual (enforced by `facility.annual_test_due`) |
- **ALERTS/METRICS:** Alert on any badge not deactivated within 24 hours of separation; track unescorted-visitor exceptions toward zero and alarm-resolution latency.

## IS-13 — AI Governance & Usage Disclosure {#is-13-ai-governance-usage-disclosure}

- **WHY (Reg cite):** NCUA Appendix A requires safeguards over new technologies and processes that handle member information ([12 CFR Part 748, App. A, III.B–C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards constrain disclosure of NPI ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** A default pro-AI posture is maintained with controls: an AI Use Register, a DPIA before production, vendor/feature review, member-facing disclosure, and a prohibition on uploading NPI to external AI without approval. The registry is updated within 5 days of approval. AI tool approval and the register are write-restricted to Compliance and the InfoSec/IT lead.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | AI tool approved (`ai.tool_approved`) | Use case (`ai.use_case`), DPIA ref (`ai.dpia_ref`), approval record (`ai.approval_record`) | AI register updated (`ai.register_updated`) | 5 days (enforced by `ai.register_update_due_at`) |
  | Member-facing AI feature launched (`ai.member_feature_launched`) | Disclosure text (`ai.disclosure_text`), disclosure channel (`ai.disclosure_channel`) | AI disclosure published (`ai.disclosure_published`) | Before launch (no registered timer) |
  | Unapproved NPI-to-AI attempt (`ai.violation_disposed`) | Use case (`ai.use_case`), DLP violation detail (`dlp.violation_detail`) | AI violation disposed (`ai.violation_disposed`) | Internal: 1 BD (no registered timer) |
- **ALERTS/METRICS:** Alert on AI register updates aging past 5 days post-approval; track DPIA-before-production coverage at 100% and zero unapproved NPI-to-AI events.

## IS-14 — Logging, Monitoring & Alerting {#is-14-logging-monitoring-alerting}

- **WHY (Reg cite):** NCUA Appendix A requires monitoring systems to detect actual and attempted attacks on or intrusions into member-information systems ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); records preservation under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
- **SYSTEM BEHAVIOR:** Logs are centralized in a SIEM with time-sync and real-time alerting for critical events; critical alerts are reviewed daily and security-relevant logs are retained at least 12 months aligned to the records schedule. SIEM source inventory and alert disposition are restricted to SecOps. A silent log source is treated as a critical alert until the source is restored.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Critical SIEM alert raised (`siem.source_silent`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`), last seen (`siem.last_seen_at`) | Alert disposed (`siem.alert_disposed`) | Daily review (enforced by `siem.alert_review_due_at`) |
  | Intrusion detected (`intrusion.detected`) | Severity (`intrusion.severity`) | Intrusion response recorded (`intrusion.response_recorded`) | Internal: same day (no registered timer) |
  | Silent log source detected (`siem.source_silent`) | Source inventory (`siem.source_inventory`), last seen (`siem.last_seen_at`) | Source restored (`siem.source_restored`) | Daily review (enforced by `siem.alert_review_due_at`) |
- **ALERTS/METRICS:** Alert on critical SIEM alerts unreviewed past the daily window and on any silent source; track 12-month log-retention coverage at 100%.

## IS-15 — Acceptable Use & Communications Systems {#is-15-acceptable-use-communications-systems}

- **WHY (Reg cite):** NCUA Appendix A requires personnel controls and policies governing use of member-information systems ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** Permitted use of devices, email, messaging, internet, and removable media is documented with monitoring notice and BYOD/remote-work safeguards; acknowledgment is required before access is granted. The acceptable-use ruleset is write-restricted to Compliance and the InfoSec/IT lead. Re-acknowledgment is required when the AUP is revised.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New hire or role change (`employee.hired`) | Employee id (`employee.id`), role (`user.role`), AUP version (`aup.revision_summary`) | AUP acknowledged before access (`aup.acknowledged`) | Before access grant (no registered timer) |
  | AUP revised (`aup.revised`) | Revision summary (`aup.revision_summary`) | Re-acknowledgment recorded (`aup.reacknowledged`) | Internal: 30 days (no registered timer) |
  | BYOD enrollment requested (`byod.enrollment_requested`) | MDM status (`byod.mdm_status`), encryption status (`byod.encryption_status`) | BYOD enrolled (`byod.enrolled`) | Before access grant (no registered timer) |
- **ALERTS/METRICS:** Alert on access grants without a current AUP acknowledgment; track acknowledgment coverage at 100% and BYOD encryption/MDM compliance.

## IS-16 — Social Media {#is-16-social-media}

- **WHY (Reg cite):** NCUA Appendix A requires safeguards against misuse and impersonation affecting member information and the institution's channels ([12 CFR Part 748, App. A, III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)). Marketing/advertising compliance is governed by the Fair Lending Policy.
- **SYSTEM BEHAVIOR:** Corporate posts are pre-approved, personal posts require disclaimers, member-information disclosure is prohibited, and scams/impersonation are escalated with same-day takedown escalation. Post approval authority is restricted to designated approvers in Compliance/Marketing; advertising-content rules are governed by the Fair Lending Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Impersonation or scam detected (`socialmedia.impersonation_detected`) | Impersonation detail (`socialmedia.impersonation_detail`), evidence (`socialmedia.evidence`) | Takedown escalated (`socialmedia.takedown_escalated`) | Same day (enforced by `socialmedia.takedown_due_at`) |
  | Corporate post drafted (`socialmedia.post_drafted`) | Post content (`socialmedia.post_content`), approver (`socialmedia.approver`) | Post approved (`socialmedia.post_approved`) | Before publication (no registered timer) |
  | Member-info disclosure on post detected (`socialmedia.disclosure_detected`) | Post content (`socialmedia.post_content`), evidence (`socialmedia.evidence`) | Disclosure disposed (`socialmedia.disclosure_disposed`) | Same day (enforced by `socialmedia.takedown_due_at`) |
- **ALERTS/METRICS:** Alert on impersonation cases open past same-day takedown SLA; track pre-approval coverage on corporate posts and zero unredacted member-info disclosures.

## IS-17 — Training, Awareness & Testing {#is-17-training-awareness-testing}

- **WHY (Reg cite):** NCUA Appendix A requires training staff to implement the security program ([12 CFR Part 748, App. A, III.C.2](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)); GLBA safeguards ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** Role-based training is delivered with quarterly phishing simulations and high-risk-role deep-dives; new-hire training completes within 30 days and refreshers are annual, with re-training after repeated phishing failures. Curriculum assignment is restricted to HR and the InfoSec/IT lead.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee hired (`employee.hired`) | Hire date (`training.hire_date`), role curriculum (`training.role_curriculum`) | New-hire training completed (`training.onboarding_completed`) | 30 days (enforced by `training.newhire_due_at`) |
  | Annual refresher cycle reached (`training.annual_cycle_opened`) | Required curriculum (`training.required_curriculum`), content version (`training.content_version`) | Annual training completed (`training.refresher_completed`) | Annual (enforced by `training.annual_due_at`) |
  | Quarterly phishing simulation (`phishing.simulation_launched`) | Scenario (`phishing.scenario`), failure history (`phishing.failure_history`) | Results recorded; remedial assigned on repeat failure (`phishing.results_recorded`, `training.remedial_assigned`) | Quarterly (no registered timer) |
- **ALERTS/METRICS:** Alert on new-hire training aging past 30 days; track annual-refresher coverage at 100% and repeat-phishing-failure remediation completion.

## IS-18 — Records Management & Retention {#is-18-records-management-retention}

- **WHY (Reg cite):** NCUA requires records preservation and vital-records programs ([12 CFR Part 749 and App. B](https://www.ecfr.gov/current/title-12/part-749)); FACTA Disposal Rule governs secure disposal of consumer information ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)). Schedule periods and legal-hold mechanics are governed by the Record Retention Policy.
- **SYSTEM BEHAVIOR:** The Record Retention Policy's Schedule A periods apply to security-specific record classes (SIEM and audit logs, incident-response records, vulnerability findings and POA&Ms, access-review evidence, AI-use registry entries, and physical security logs). The security destruction queue is processed monthly unless a legal hold — governed by the Record Retention Policy — is in effect, which pauses the clock. Data disposal aligns with [IS-07](#is-07-data-protection-encryption-disposal) (render unreadable within 30 days of eligibility). Hold placement/release is write-restricted to Legal and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly destruction cycle reached (`record.destruction_initiated`) | Record class (`record.retention_class`), disposal eligibility (`record.disposal_eligible`), hold status (`record.hold_status`) | Records destroyed + certified (`record.destroyed`, `record.destruction_certified`) | Monthly (enforced by `record.destruction_cycle_due_at`) |
  | Legal hold placed on security records (`legal_hold.created`) | Hold scope (`legal_hold.hold_scope`), matter ref (`legal_hold.matter_ref`) | Hold applied; clock paused (`record.hold_applied`) | At placement (no registered timer) |
  | Legal hold released (`legal_hold.clear_confirmed`) | Release approver (`legal_hold.release_approved_by`), schedule resumed (`legal_hold.schedule_resumed`) | Hold lifted; retention clock resumed (`record.hold_released`) | At release (no registered timer) |
- **ALERTS/METRICS:** Alert on the monthly destruction queue aging past cycle and on any expired-retention record still present; track destruction-certificate completeness and held-record reconciliation at 100%.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for program maintenance, board reporting, and control evidence.
- **Approver:** Patrick Wilson, Chief Compliance Officer (annual approval).
- **Required participants:** InfoSec/IT lead, Engineering/SecOps, Risk, Privacy, HR, Facilities, and the Board/Supervisory Committee as required.
- **Review cadence:** Annual policy approval (see [IS-01](#is-01-governance-oversight)); quarterly KPI reporting to the Board/Supervisory Committee within 30 days post-quarter.
- **Cross-references:** Enterprise Risk Management Policy (risk taxonomy/scoring — see [IS-02](#is-02-enterprise-risk-assessment)); Third-Party Risk Policy (vendor lifecycle — see [IS-11](#is-11-vendor-risk-management)); Record Retention Policy (Schedule A and legal holds — see [IS-18](#is-18-records-management-retention)); Business Continuity Plan Policy (continuity — see [IS-08](#is-08-backup-disaster-recovery)); Privacy Policy; E-Commerce Policy; Electronic Payment Systems Policy; Fair Lending Policy (advertising — see [IS-16](#is-16-social-media)).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Some resources, fields, and events referenced in the *When* / *What's needed* / *Produced (and logged)* / *Within* columns above are drawn from the registered Cassandra Banking Core vocabulary but several InfoSec-specific concepts are not yet bound to this policy's controls in `core-vocabulary.json`. Codes used in those columns are the target naming scheme and will be confirmed by engineering before the next review. Specific provisional/target codes relied on include `security_finding.description`/`security_finding.due_at`/`security_finding.severity` (provisional), `control.id`, `policy.id`, and `record.id`.
- **Charter and NCUA applicability.** This policy assumes Pynthia Credit Union is a federally insured credit union subject to NCUA 12 CFR Parts 748, 717 (Subpart J), and 749. If the charter or FACTA coverage differs, the WHY citations in [IS-09](#is-09-incident-response-cyber-incident-reporting), [IS-10](#is-10-identity-theft-red-flags-program), and [IS-18](#is-18-records-management-retention) must be reconfirmed. NCUA 701.31 was reviewed and intentionally not anchored to any control, as it governs nondiscrimination/appraisal practices outside this policy's information-security scope.
- **Reportable-incident threshold.** [IS-09](#is-09-incident-response-cyber-incident-reporting) assumes the §748.1(c) "reportable cyber incident" determination is made by the IR commander and Compliance; the exact internal criteria and SLA between detection and determination are to be confirmed.
- **ERM tier-to-timer mapping.** [IS-02](#is-02-enterprise-risk-assessment) assumes the registered `risk.reassessment_due_at` timer is configured per the ERM tiered cadence (quarterly/annual/biennial). Confirmation that the ERM Policy owns and parameterizes these tiers is required.
- **Vendor breach-notice window alignment.** [IS-11](#is-11-vendor-risk-management) assumes the Third-Party Risk Policy's standard sets the 24-hour vendor notice and 1-business-day internal triage; if that standard changes, this control's *Within* must follow it rather than restating a divergent value.
- **Non-deadline operational steps.** Several rows (e.g., SoD grant blocking, visitor logging, pre-publication post approval, AUP acknowledgment, hold placement/release) have no registered timer and are enforced at the point of action; "no registered timer" is used rather than coining a per-domain due-date field, consistent with the composition grammar.
- **Phishing-simulation cadence timer.** [IS-17](#is-17-training-awareness-testing) quarterly phishing simulations have no registered timer code; the cadence is tracked operationally and a generic `Task` (`type: simulation`) instance is assumed for scheduling, to be confirmed by engineering.
