```yaml
---
title: Information Security Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-08-01
next_review: 2027-08-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Information Security, Cybersecurity, NCUA, GLBA, FACTA, Red Flags]
---
```

# Information Security Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based information security program that protects the confidentiality, integrity, availability, and resilience of member and organizational information across all people, facilities, data, systems, networks, vendors, and AI tools. The program is board-governed, anchored in the requirements of [NCUA 12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) (including Appendices A and B), [NCUA 12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717), [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801), and the [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682), and is informed by NIST SP 800-53 Rev. 5 and NIST CSF 2.0 as non-regulatory frameworks. Engineering and SecOps implement and evidence each control through audit logs, automated monitoring, and periodic testing. Consumer-facing online/mobile banking, electronic payment rails, enterprise risk appetite and taxonomy, vendor onboarding mechanics beyond information-security diligence, detailed business continuity planning, and member privacy notices are governed by their respective policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy approval | Board meeting cycle opens | Annual | Board-approved policy record | [IS-01](#is-01-governance-oversight) |
| Quarterly KPI report to Board | Quarter closes | 30 days post-quarter | Security KPI snapshot | [IS-01](#is-01-governance-oversight) |
| High/Very High risk reassessment | Residual rating recorded or trigger event | Quarterly | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Moderate risk reassessment | Residual rating recorded or trigger event | Annually | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Low/Very Low risk reassessment | Residual rating recorded or trigger event | Every 2 years | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| POA&M update | Open finding or risk item exists | Monthly | POA&M record | [IS-02](#is-02-enterprise-risk-assessment) |
| New-product security risk assessment | New product/service proposed | 10 business days | Risk assessment findings | [IS-02](#is-02-enterprise-risk-assessment) |
| CMDB delta posting | Asset change detected | 5 business days | CMDB record | [IS-03](#is-03-asset-inventory-classification) |
| CMDB quarterly attestation | Quarter closes | Quarterly | Attestation record | [IS-03](#is-03-asset-inventory-classification) |
| CAB review — medium/high-risk change | RFC submitted | 3 business days | CAB decision record | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change post-review | Emergency change deployed | 24 hours | Post-review record | [IS-04](#is-04-change-management-configuration-control) |
| High-risk vulnerability triage | Scan or pentest finding confirmed | 5 business days | Vulnerability finding | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Critical patch | Critical vulnerability confirmed | 7 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| High patch | High vulnerability confirmed | 15 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Medium patch | Medium vulnerability confirmed | 30 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Annual external penetration test | Annual cycle opens | Annual | Pentest report | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Termination access deprovision | Employee separation event | Same business day | Access deprovision record | [IS-06](#is-06-access-control-authentication) |
| Quarterly access review | Quarter closes | Quarterly | Access review attestation | [IS-06](#is-06-access-control-authentication) |
| Data disposal | Retention eligibility date reached (no legal hold) | 30 days | Disposal certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Weekly backup restore verification | Weekly cycle | Weekly | Restore test record | [IS-08](#is-08-backup-disaster-recovery) |
| Annual DR exercise | Annual cycle opens | Annual | DR exercise report | [IS-08](#is-08-backup-disaster-recovery) |
| NCUA cyber-incident notification | Reportability determined | 72 hours | NCUA notification | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notice — reportable incident | Reportability determined | Without unreasonable delay | Member notice | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Red-flag case review | Red flag detected | Same day | Red-flag case record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Red-flag ruleset review | Quarter closes | Quarterly | Ruleset review record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Vendor breach triage | Vendor breach notice received | 1 business day | Triage record | [IS-11](#is-11-vendor-information-security-diligence) |
| High-risk vendor annual review | Annual cycle opens | Annual | Vendor review record | [IS-11](#is-11-vendor-information-security-diligence) |
| Badge deactivation — separation | Employee/contractor separation | 24 hours | Badge deactivation record | [IS-12](#is-12-physical-security-facilities) |
| AI tool registry update | Tool approved | 5 business days | AI register entry | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical SIEM alert review | Critical alert fires | Daily | Alert disposition record | [IS-14](#is-14-logging-monitoring-alerting) |
| AUP acknowledgment | Access granted / annual refresh | Before access | AUP acknowledgment record | [IS-15](#is-15-acceptable-use-communications-systems) |
| Social media takedown escalation | Scam/impersonation detected | Same day | Takedown escalation record | [IS-16](#is-16-social-media) |
| New-hire security training | Employee hired | 30 days | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Annual security training refresh | Annual cycle opens | Annual | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Quarterly phishing simulation | Quarter opens | Quarterly | Phishing results record | [IS-17](#is-17-training-awareness-testing) |
| Monthly security destruction queue | Month closes (no legal hold) | Monthly | Destruction log entry | [IS-18](#is-18-records-management-retention) |
| Incident post-mortem | Incident closed | 30 days | Post-mortem report | [IS-19](#is-19-incident-response-plan-playbooks-post-mortem) |

---

## IS-01 — Governance & Oversight {#is-01-governance-oversight}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §I](https://www.ecfr.gov/current/title-12/part-748) requires each credit union to implement a written information security program approved by the board and subject to ongoing oversight. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the safeguards obligation that the board-level program fulfills.

**SYSTEM BEHAVIOR:** A single authoritative Security Program record (`security.program_charter`) is maintained in the GRC system, containing the program owner, charter, KPI definitions, and review cadence. The CCO submits the policy for board approval annually; the board's approval is recorded as `policy.board.approved`. Quarterly KPI reports are compiled from the SIEM and risk register and delivered to the Board/Supervisory Committee within 30 days of quarter-end. The Security Program record is write-restricted to the CCO and Information Security/IT Lead; board approval actions are write-restricted to the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle opens (`policy.board_review.started`) | Current policy version (`policy.document_version`), change summary (`policy.change_summary`), owner sign-off (`policy.approver_id`) | Board-approved policy record (`policy.board.approved`) | Annual (internal: 30 days before effective date; enforced by `policy.board_approval_due_at`) |
| Quarter closes and KPI report is due (`security.quarter.closed`) | KPI snapshot (`security.kpi_snapshot`), open findings count (`finding.status`), incident trend summary (`incident.quarterly_summary`) | KPI report delivered to Board/Supervisory Committee (`security.board_report.issued`) | 30 days post-quarter (enforced by `security.board.report.due_at`) |

**ALERTS/METRICS:** Alert fires if `policy.board_approval_due_at` is within 14 days and no `policy.board.approved` event exists for the current cycle. Alert fires if `security.board.report.due_at` is breached; target: zero overdue quarterly reports.

---

## IS-02 — Enterprise Risk Assessment {#is-02-enterprise-risk-assessment}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires a risk assessment identifying threats, vulnerabilities, and controls for member information. The ERM tiered reassessment cadence and POA&M discipline are governed by the Enterprise Risk Management Policy; this control defines the information-security register's contribution to that program.

**SYSTEM BEHAVIOR:** The information-security risk register is a tagged subset of the enterprise risk register, covering assets, threats, and controls including fraud, social engineering, identity theft, and AI risks. Each risk entry carries a residual rating that drives the reassessment timer: High/Very High at least quarterly, Moderate at least annually, Low/Very Low every two years or on trigger events (material system change, new threat intelligence, incident). POA&M items are updated monthly. When a new product or service is proposed, a lightweight security risk assessment is completed within 10 business days and submitted as input to the ERM new-product review process. The risk register is write-restricted to the Information Security/IT Lead and Risk team; read access is available to all program participants.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk register entry created or residual rating recorded (`risk.rating.recorded`) | Asset description (`risk.description`), threat catalog (`risk.threat_catalog`), inherent score (`risk.inherent_score`), residual rating (`risk.residual_rating`), owner (`risk.owner_id`) | Risk register entry with reassessment timer set (`risk.assessment.completed`; timer `risk.reassessment_due_at`) | Per residual rating: High/Very High ≤ quarterly; Moderate ≤ annually; Low/Very Low ≤ 2 years (enforced by `risk.reassessment_due_at`) |
| Monthly POA&M cycle opens | Open risk items (`risk.poam_status`), remediation evidence (`risk.remediation_evidence`) | Updated POA&M record (`risk.poam.updated`) | Monthly |
| New product/service proposed (`product.initiated`) | Product description (`product.description`), data flows (`product.data_flows`), preliminary risk profile (`risk.candidate_profile`) | Security risk assessment findings submitted to ERM (`risk.product_assessment.completed`) | 10 business days (enforced by `risk.product_assessment_due_at`) |
| Trigger event detected (incident, material change, new threat intelligence) (`risk.trigger_edd`) | Trigger description (`risk.description`), affected risk entries (`risk.id`) | Reassessment initiated out-of-cycle (`risk.assessment.published`) | Immediately on trigger; reassessment completed per residual-rating cadence |

**ALERTS/METRICS:** Alert fires when any `risk.reassessment_due_at` is breached; target: zero overdue reassessments by tier. Alert fires when POA&M update is not recorded by month-end. New-product assessment aging alert fires at 8 business days with no completed assessment.

---

## IS-03 — Asset Inventory & Classification {#is-03-asset-inventory-classification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires identification of the information and systems that must be protected. Maintaining a current CMDB with data classification is the operational foundation for all downstream controls.

**SYSTEM BEHAVIOR:** The CMDB (`asset.cmdb_snapshot`) is the authoritative inventory of hardware, software, data stores, and vendors, each tagged with a data classification: Public, Internal, or Confidential-NPI. Any addition, removal, or material attribute change to an asset must be posted to the CMDB within 5 business days of the change. The CMDB owner attests to completeness quarterly. Classification of Confidential-NPI assets triggers additional controls in IS-06 (access), IS-07 (encryption/disposal), and IS-14 (monitoring). The CMDB is write-restricted to the Information Security/IT Lead and Engineering; quarterly attestation is performed by the CCO or designated owner.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Asset added, changed, or removed (`asset.changed`) | Asset attributes (`asset.attributes`), classification (`asset.classification`), owner (`asset.owner`), media type (`asset.media_type`) | CMDB updated (`asset.cmdb.updated`) | 5 business days (enforced by `asset.cmdb_update_due_at`) |
| Quarter closes and attestation is due | CMDB snapshot (`asset.cmdb_snapshot`), owner roster (`asset.owner_roster`) | Quarterly attestation recorded (`asset.attestation.completed`) | Quarterly |

**ALERTS/METRICS:** Alert fires when `asset.cmdb_update_due_at` is breached for any pending delta; target: zero overdue postings. Alert fires when quarterly attestation is not completed within 5 days of quarter-end.

---

## IS-04 — Change Management & Configuration Control {#is-04-change-management-configuration-control}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls over system changes to protect the integrity and availability of member information systems. Configuration drift is a primary vector for security degradation.

**SYSTEM BEHAVIOR:** All changes to production systems follow an RFC workflow: the submitter documents risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`), and approver (`change.approver_id`). Medium- and high-risk changes require CAB review within 3 business days of RFC submission. Emergency changes may be deployed with expedited approval but must receive a formal post-review within 24 hours of deployment. Configuration drift detected by automated tooling triggers an immediate alert and must be resolved or risk-accepted. The CAB decision record is write-restricted to the CAB chair; post-review records are write-restricted to the Change Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RFC submitted for medium/high-risk change (`change.rfc.submitted`) | RFC document (`change.rfc`), risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision recorded (`change.cab_decision.recorded`) | 3 business days (enforced by `change.cab_review_due_at`) |
| Emergency change deployed (`change.emergency.deployed`) | Emergency justification (`change.emergency_justification`), deployment record (`change.deployment_record`), rollback plan (`change.rollback_plan`) | Post-review completed (`change.post_review.completed`) | 24 hours (enforced by `change.post_review_due_at`) |
| Configuration drift detected (`config.drift.detected`) | Baseline ID (`config.baseline_id`), drift detail (`config.drift_detail`) | Drift resolved or risk-accepted (`config.drift.resolved`) | Immediate alert; resolution per risk rating |

**ALERTS/METRICS:** Alert fires when `change.cab_review_due_at` is breached; target: zero overdue CAB reviews. Alert fires when `change.post_review_due_at` is breached for any emergency change. Unresolved configuration drift items older than 24 hours trigger an escalation alert.

---

## IS-05 — Vulnerability Testing & Penetration Testing {#is-05-vulnerability-testing-penetration-testing}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires testing and monitoring of information systems. Regular vulnerability scanning and annual penetration testing are the primary mechanisms for identifying exploitable weaknesses before adversaries do.

**SYSTEM BEHAVIOR:** Automated vulnerability scans run on a scheduled basis across all in-scope systems. An independent external penetration test is conducted annually. All findings are triaged and tracked to closure in the POA&M. Triage of high-risk findings must be completed within 5 business days of confirmation. Patching SLAs by severity: Critical within 7 days, High within 15 days, Medium within 30 days. Low findings are tracked but have no mandatory patch deadline. Findings that cannot be remediated within SLA must be risk-accepted with documented rationale. The pentest report and vulnerability findings are write-restricted to the Information Security/IT Lead; remediation ownership is assigned per finding.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vulnerability scan completes or pentest report received (`vuln.finding.created`) | Finding detail (`vuln.detail`), severity (`vuln.severity`), affected asset (`asset.id`) | Vulnerability finding confirmed and triage timer set (`vuln.finding.confirmed`; timer `vuln.triage_due_at`) | Triage: 5 business days for High/Critical (enforced by `vuln.triage_due_at`) |
| Triage completed — remediation assigned (`vuln.triage.completed`) | Remediation plan (`vuln.remediation_plan`), owner, severity (`vuln.severity`) | Remediation tracked in POA&M (`risk.poam.updated`; timer `vuln.remediation_due_at`) | Critical: 7 days; High: 15 days; Medium: 30 days (enforced by `vuln.remediation_due_at`) |
| Remediation completed (`vuln.remediated`) | Closure evidence (`finding.closure_evidence`), retest result | Finding closed in POA&M (`finding.closed`) | Within SLA per severity |
| Annual pentest cycle opens | Scope (`pentest.scope`), independence attestation (`pentest.independence`) | Pentest scheduled and report issued (`pentest.scheduled`; `pentest.report.issued`) | Annual (enforced by `pentest.engagement_due`) |

**ALERTS/METRICS:** Alert fires when `vuln.triage_due_at` or `vuln.remediation_due_at` is breached; target: zero overdue Critical/High findings. Dashboard tracks open findings by severity and age. Pentest aging alert fires 30 days before `pentest.engagement_due`.

---

## IS-06 — Access Control & Authentication {#is-06-access-control-authentication}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II–III](https://www.ecfr.gov/current/title-12/part-748) requires access controls to limit system access to authorized users. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards including access management for nonpublic personal information.

**SYSTEM BEHAVIOR:** All systems enforce SSO with MFA for human users. Access is granted on a least-privilege, role-based basis; SoD conflicts are blocked at provisioning. Joiner/mover/leaver events are automated: joiners receive role-appropriate access on their start date, movers have access adjusted within 1 business day of role change, and leavers are fully deprovisioned the same business day as separation. Break-glass accounts exist for emergency access; every use is logged with justification and reviewed by the CCO within 24 hours. Quarterly access reviews are conducted by system owners with attestation recorded. Access provisioning and deprovisioning records are write-restricted to the IT/IAM team; break-glass review records are write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee separated (`employee.separated`) | User ID (`user.id`), employment status (`user.employment_status`), role (`user.role`) | All access deprovisioned (`access.deprovisioned`; timer `access.deprovision_due_at`) | Same business day (enforced by `access.deprovision_due_at`) |
| Role change detected (`employee.role.changed`) | User ID (`user.id`), prior role, new role (`user.role`) | Access entitlements updated (`access_right.changed`) | 1 business day |
| Break-glass account used (`access.breakglass.used`) | Break-glass ID (`access.breakglass_id`), justification (`access.breakglass_justification`) | Break-glass use logged and review scheduled (`access.breakglass.reviewed`) | Review within 24 hours |
| Quarter closes and access review is due | User roster (`access.user_roster`), role entitlements (`access.role_entitlements`), reviewer roster (`access.reviewer_roster`) | Access review completed and attested (`access_review.completed`; `access.review_attestation`) | Quarterly (enforced by `access.review_due_at`) |

**ALERTS/METRICS:** Alert fires when `access.deprovision_due_at` is breached for any separation; target: zero same-day deprovision failures. Alert fires when break-glass review is not completed within 24 hours. Quarterly access review completion rate target: 100% within 5 business days of quarter-end.

---

## IS-07 — Data Protection, Encryption & Disposal {#is-07-data-protection-encryption-disposal}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for member information including encryption and secure disposal. [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682) requires that consumer information be rendered unreadable or indecipherable before disposal. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the underlying safeguards obligation.

**SYSTEM BEHAVIOR:** All data in transit must use TLS 1.2 or higher; all data at rest classified as Confidential-NPI must use AES-256 or equivalent approved cryptography. The approved cryptography configuration is maintained in the crypto config record (`crypto.config`). DLP controls monitor for unauthorized exfiltration of NPI and block or alert on policy violations. When a data asset reaches its retention eligibility date and no legal hold is in effect, disposal must be completed within 30 days using an approved method (shredding, degaussing, cryptographic erasure) that renders data unreadable; a disposal certificate is recorded. Litigation holds suspend the disposal clock per the Record Retention Policy's legal-hold process. TLS certificate expiry is monitored and certificates are renewed before expiry. DLP violation records and disposal certificates are write-restricted to the Information Security/IT Lead and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| DLP policy violation detected (`dlp.violation.detected`) | Violation detail (`dlp.violation_detail`), data classification (`asset.classification`), actor | DLP violation logged and resolved or escalated (`dlp.violation.resolved`) | Immediate alert; resolution per severity |
| Data asset reaches retention eligibility (no legal hold) (`record.retention.expired`) | Asset ID (`asset.id`), classification (`asset.classification`), disposal method (`disposal.method`), legal hold flag (`record.legal_hold_flag`) | Disposal executed and certificate recorded (`disposal.executed`; `disposal.certificate.recorded`) | 30 days of eligibility (enforced by `record.disposal_due_at`) |
| TLS certificate approaching expiry (`tls.certificate_expires_at`) | Certificate ID, cipher suite (`tls.cipher_suite`), expiry date | Certificate renewed (`tls.certificate.renewed`) | Before expiry (enforced by `tls.certificate_expiry_due`) |
| Crypto configuration reviewed | Approved algorithm list (`crypto.config`), TLS test rating (`tls.test_rating`) | Crypto assessment completed (`crypto.verified`; `tls.assessment.completed`) | Annual (enforced by `tls.assessment_due`) |

**ALERTS/METRICS:** Alert fires when `record.disposal_due_at` is within 5 days and no disposal event exists; target: zero overdue disposals. Alert fires on any DLP violation involving NPI. TLS certificate expiry alert fires 30 days before `tls.certificate_expires_at`.

---

## IS-08 — Backup & Disaster Recovery {#is-08-backup-disaster-recovery}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls to ensure the availability and recovery of member information systems. Immutable offsite backups and tested recovery procedures are the operational implementation of this requirement.

**SYSTEM BEHAVIOR:** RTO and RPO targets are defined per system in the DR plan (`dr.rto_rpo_matrix`) and maintained in the scope registry. Backups are taken on a scheduled cycle, stored offsite, and maintained in an immutable format to resist ransomware. Restore tests are conducted weekly against a non-production environment to verify backup integrity. An annual full DR exercise tests end-to-end recovery including ransomware isolation and clean-room restore scenarios; results and after-action items are documented. Failed backup jobs trigger immediate alerts and remediation. The DR plan and backup catalog are write-restricted to the Information Security/IT Lead and Engineering; exercise reports are reviewed by the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Backup job completes or fails (`backup.cycle.completed` / `backup.job.failed`) | Job detail (`backup.job_detail`), catalog (`backup.catalog`), RPO monitor (`backup.rpo_monitor`) | Backup verified or remediation initiated (`backup.verified`; `backup.job.remediated`) | Immediate on failure |
| Weekly restore test cycle (`backup.restore.verified`) | Restore test environment (`restore.test_env`), backup tier config (`backup.tier_config`) | Restore test completed and validated (`restore.test.completed`; `restore.point.validated`) | Weekly (enforced by `backup.restore_test_due`) |
| Annual DR exercise cycle opens (`dr.exercise.completed`) | DR plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`), exercise roster | DR exercise completed and after-action report issued (`exercise.completed`; `drill.aar.published`) | Annual (enforced by `dr.exercise_due_at`) |
| Ransomware or destructive attack detected (`incident.sev1.detected`) | Blast radius isolation status (`it.blast_radius_isolated`), backup catalog (`backup.catalog`) | Isolation executed and clean-room restore initiated (`restore.initiated`) | Immediate on detection |

**ALERTS/METRICS:** Alert fires on any failed backup job not remediated within 4 hours. Alert fires when `backup.restore_test_due` is breached; target: 100% weekly restore test completion. DR exercise aging alert fires 30 days before `dr.exercise_due_at`.

---

## IS-09 — Incident Response Plan, Playbooks & Post-Mortem {#is-09-incident-response-plan-playbooks-post-mortem}

> **Note:** Incident declaration, IC assignment, first-hour checklist, sitrep cadence, and stabilization mechanics are governed by [SC-03](#sc-03-enterprise-incident-declaration-first-hour-response) (embedded below). Reportability determination and NCUA/member notification are governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) (embedded below). This control covers IR plan and playbook maintenance, law enforcement coordination documentation, and post-mortem completion.

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a written incident response program. Maintaining current playbooks, a tested IC roster, and completed post-mortems is the operational evidence of a functioning program.

**SYSTEM BEHAVIOR:** The IR plan, IC roster (`imt.roster`), and playbooks (`playbook.spec`) are maintained in the GRC system and reviewed at least annually or after any significant incident. Law enforcement coordination is documented in the incident record (`incident.criminal_suspected`, `incident.facts`). Following incident closure, a post-mortem is completed within 30 days, capturing root cause, timeline, and corrective actions. Incident declaration and first-hour mechanics are governed by SC-03 (embedded immediately below this control). Reportability determination and regulatory/member notification are governed by SC-01. The IR plan and playbooks are write-restricted to the Information Security/IT Lead and CCO; post-mortem reports are reviewed by the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual IR plan review cycle opens or significant incident closes | IR plan version, IC roster (`imt.roster`), playbook specs (`playbook.spec`) | IR plan reviewed and IC roster verified (`imt.roster.verified`; `policy.review.completed`) | Annual (enforced by `imt.roster_review_due`) |
| Law enforcement coordination initiated during incident | Criminal suspicion flag (`incident.criminal_suspected`), incident facts (`incident.facts`), incident ID (`incident.id`) | Law enforcement coordination documented in incident record (`incident.external_comms.recorded`) | During active incident response |
| Incident closed (`incident.closed`) | Root cause (`incident.root_cause`), timeline (`incident.timeline`), corrective actions (`finding.corrective_action`), incident scope (`incident.scope`) | Post-mortem completed and report issued (`incident.postmortem.completed`) | 30 days of incident closure |

**ALERTS/METRICS:** Alert fires when `imt.roster_review_due` is breached; target: zero overdue roster reviews. Alert fires when post-mortem is not completed within 30 days of incident closure; target: 100% post-mortem completion rate.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires a federally insured credit union to notify NCUA as soon as possible, and no later than 72 hours after the credit union reasonably believes it has experienced a reportable cyber incident. [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member-notification program when unauthorized access to sensitive member information has occurred or is reasonably possible and misuse is likely; notice must be given without unreasonable delay. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the underlying safeguards obligation that both notification duties serve.

**SYSTEM BEHAVIOR:** Every declared incident undergoes a reportability assessment. When the assessment concludes that the incident meets NCUA's reportable-cyber-incident threshold, the 72-hour NCUA notification clock starts from the moment that determination is made and is tracked by `incident.ncua.notice.due_at`. The notification is submitted via NCUA's cyber-incident reporting portal; the submission and any NCUA acknowledgment are logged against the incident record. In parallel, the member-impact assessment determines whether sensitive member information was accessed or is reasonably at risk of misuse; if so, member notices are prepared using the approved template (`incident.member_notice_template`) and sent without unreasonable delay. Law enforcement coordination is documented in the incident record. Both notification tracks are write-restricted to the CCO and Legal; the Information Security/IT Lead may update technical fields. If the incident originates from or involves a vendor, the vendor incident record (`vendor.incident.logged`) is linked and the Third-Party Risk Policy's escalation path is triggered concurrently.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportability determination made (`incident.reportable.determined`) | Reportability assessment (`incident.reportability_assessment`), determination (`incident.reportability_determination`), rationale (`incident.reportability_rationale`), incident scope (`incident.scope`), data scope (`incident.data_scope`) | NCUA notification submitted (`incident.ncua.notified`); NCUA notice due-at timer set (`incident.ncua.notice.due_at`) | 72 hours of determination (enforced by `incident.ncua.notice.due_at`) |
| NCUA acknowledgment received | NCUA ack detail (`ncua.ack_detail`), notification record | NCUA acknowledgment logged (`ncua.ack.logged`) | Upon receipt |
| Member-impact assessment completed (`incident.member_impact.confirmed`) | Member impact flag (`incident.member_impact`), misuse likelihood (`incident.misuse_likelihood`), notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent (`incident.member_notices.sent`; `incident.member.notified`) | Without unreasonable delay (internal SLA: within 10 business days of impact confirmation unless law enforcement requests delay; enforced by `incident.notification_due_at`) |
| Vendor linked to incident (`vendor.incident.logged`) | Vendor ID (`vendor.id`), incident scope (`vendor.incident_scope`), containment status (`vendor.incident_containment_status`) | Vendor incident track dispatched and Third-Party Risk escalation triggered (`vendor.incident.reported`) | Concurrent with incident response |

**ALERTS/METRICS:** `alert.ncua_notification_aging` fires at 48 hours post-determination if no `incident.ncua.notified` event exists; target: 100% of reportable incidents notified within 72 hours. Separate aging alert fires at 7 business days post-impact-confirmation if no `incident.member_notices.sent` event exists. Both metrics are reported in the quarterly security KPI pack.

---

## IS-10 — Identity Theft Red Flags Program {#is-10-identity-theft-red-flags-program}

**WHY (Reg cite):** [NCUA 12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717) implements the FACT Act's identity-theft red-flag requirements, mandating a written program to detect, prevent, and mitigate identity theft in connection with covered accounts. The program must be board-approved and periodically updated.

**SYSTEM BEHAVIOR:** The red-flag program maintains a ruleset (`redflag.ruleset`) covering all covered accounts (loans, lines of credit, deposit accounts) across all access channels (in-person, telephone, online, ATM, written). The ruleset maps red-flag types (`redflag.type`) to required responses including step-up verification (`redflag.stepup_required`), account holds (`account.restriction`), SAR referral where applicable, and law enforcement notification. When a red flag is detected, a case is opened and reviewed the same day. The ruleset is reviewed quarterly to reflect changes in identity-theft methods, account types, and service-provider arrangements; material changes require board approval. The annual compliance report to the Board includes program effectiveness, significant incidents, and service-provider oversight. The red-flag ruleset is write-restricted to the CCO and Compliance team; case disposition is write-restricted to the designated ID Theft Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Red flag detected on new or existing covered account (`redflag.detected`) | Red-flag type (`redflag.type`), account ID (`account.id`), triggering data (e.g., `redflag.address_reissue_match`, `redflag.stepup_required`), detection source | Red-flag case opened and same-day review initiated (`redflags.case.opened`; `redflags.review.opened`) | Same day (enforced by `redflag.review_due_at`) |
| Step-up verification required (`redflag.stepup_required` = true) | Member identity data (`member.identity_check_method`), verification type (`verification.type`) | Step-up verification completed or account hold applied (`redflag.stepup.completed`; `account.restriction.approved`) | During same-day case review |
| Red-flag case resolved | Case disposition, response taken, SAR referral flag (`incident.sar_referred`) if applicable | Case disposed and logged (`redflag.case.disposed`) | Same day |
| Quarter closes and ruleset review is due | Current ruleset (`redflag.ruleset`), pattern updates (`redflag.pattern_updates`), case statistics (`redflag.case_stats`) | Ruleset reviewed and updated if needed (`redflag.ruleset.updated`) | Quarterly (enforced by `redflag.review_due_at`) |

**ALERTS/METRICS:** Alert fires when any red-flag case is not reviewed same day; target: zero same-day review failures. Alert fires when quarterly ruleset review is not completed within 5 business days of quarter-end. SAR referral rate for high-severity red-flag cases is tracked in the quarterly KPI report.

---

## IS-11 — Vendor Information Security Diligence {#is-11-vendor-information-security-diligence}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §IV](https://www.ecfr.gov/current/title-12/part-748) requires oversight of service-provider arrangements to ensure they implement appropriate safeguards. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires that service providers maintain appropriate safeguards for member NPI. This control defines the information-security contribution to the broader vendor lifecycle governed by the Third-Party Risk Policy.

**SYSTEM BEHAVIOR:** Before a vendor is onboarded or a contract renewed, the Information Security/IT Lead completes an information-security due-diligence package (`vendor.security_questionnaire`, `vendor.soc_report`, `vendor.dd_package`) covering security questionnaires, privacy controls, SOC reports, and penetration-test results where available. Contracts must include breach-notice obligations (vendor notifies the institution within 24 hours of discovery), data-disposition requirements, and right-to-audit clauses (`vendor.contract_clauses`). When a vendor reports a breach or security incident, internal security triage must be completed within 1 business day. High-risk vendors are reviewed annually consistent with Third-Party Risk monitoring cadences. Vendor security diligence records are write-restricted to the Information Security/IT Lead; contract clause verification is write-restricted to Legal and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor proposed or contract renewal initiated (`vendor.proposed`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), DD package (`vendor.dd_package`), NPI access flag (`vendor.npi_access_flag`) | Information-security due diligence completed (`vendor.diligence.completed`; `vendor.due_diligence.approved`) | Before onboarding or renewal |
| Contract drafted or renewed | Required clauses: breach notice, data disposition, right to audit (`vendor.contract_clauses`), GLBA addendum (`vendor.glba_clause`) | Contract clauses verified (`vendor.contract_clauses.verified`; `vendor.glba_clause.verified`) | Before contract execution |
| Vendor breach or security incident reported (`vendor.breach.notified`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`), incident scope (`vendor.incident_scope`) | Internal security triage completed (`vendor.incident.logged`; `vendor.incident_triaged`) | 1 business day (enforced by `vendor.incident_triage_due`) |
| Annual review cycle opens for high-risk vendor (`vendor.annual.review.due`) | Prior review findings, updated security questionnaire, SOC report, monitoring data (`vendor.mi_pack`) | Annual vendor security review completed (`vendor.review.completed`) | Annual (enforced by `vendor.annual_review_due_at`) |

**ALERTS/METRICS:** Alert fires when vendor breach triage is not completed within 1 business day; target: zero overdue triage events. Alert fires when high-risk vendor annual review is overdue per `vendor.annual_review_due_at`. Vendor security diligence completion rate is tracked in the quarterly KPI report.

---

## IS-12 — Physical Security & Facilities {#is-12-physical-security-facilities}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires physical safeguards to protect member information and systems. [ADA 28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) is a supporting authority for facilities access design. Physical controls are the last line of defense against insider threat and physical intrusion.

**SYSTEM BEHAVIOR:** All facilities enforce card/badge access controls with zone-based restrictions (`facility.zone`). Visitors must be escorted and logged (`facility.visitor_identity`, `facility.visit_purpose`). CCTV and alarm systems are monitored continuously; alarm events are logged and resolved. Server rooms and media storage areas are designated secure zones requiring elevated access approval (`facility.access_approval`). When an employee or contractor separates, their badge is deactivated within 24 hours of separation. Facility access logs and CCTV records are retained per the records schedule. Badge deactivation is write-restricted to Facilities and HR; secure-zone access approvals are write-restricted to the Information Security/IT Lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee or contractor separated (`employee.separated`) | Badge ID (`facility.badge_id`), employee ID (`employee.id`), separation date | Badge deactivated (`facility.badge_deactivated`) | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
| Visitor arrives at facility (`facility.visitor.arrived`) | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), escort assigned | Visitor logged and escort confirmed (`facility.visitor.logged`; `facility.access.confirmed`) | At time of arrival |
| Alarm triggered (`facility.alarm.triggered`) | Alarm detail, zone (`facility.zone`), CCTV reference (`facility.cctv_ref`) | Alarm resolved and logged (`facility.alarm.resolved`) | Immediate response; resolution logged |
| Annual facility security test due (`facility.annual.test.due`) | Test script (`facility.test_script`), zone coverage | Facility test completed (`facility.test.completed`) | Annual (enforced by `facility.test_due_at`) |

**ALERTS/METRICS:** Alert fires when `facility.badge_deactivation_due_at` is breached for any separation; target: zero overdue badge deactivations. Alert fires on any unresolved alarm event older than 4 hours. Annual facility test aging alert fires 30 days before `facility.test_due_at`.

---

## IS-13 — AI Governance & Usage Disclosure {#is-13-ai-governance-usage-disclosure}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II–III](https://www.ecfr.gov/current/title-12/part-748) requires that safeguards extend to all systems and tools that process member information, including AI tools. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires protection of NPI regardless of the processing technology. AI tools that process NPI or make member-facing decisions introduce novel risks requiring explicit governance.

**SYSTEM BEHAVIOR:** Pynthia Credit Union maintains a default pro-AI posture with controls. All AI tools and use cases must be registered in the AI Use Register (`ai.tool`, `ai.use_case`) before production use. A Data Protection Impact Assessment (DPIA) (`ai.dpia_ref`) is required before any AI tool is deployed to production. Vendor and feature reviews are conducted as part of the IS-11 diligence process for AI vendors. Member-facing AI features require a published disclosure (`ai.disclosure_text`, `ai.disclosure_channel`). Upload of NPI to external AI tools not approved in the register is prohibited; DLP controls enforce this. The AI Use Register is updated within 5 business days of tool approval. The AI Use Register is write-restricted to the CCO and Information Security/IT Lead; DPIA records are write-restricted to Privacy and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| AI tool proposed for production use (`ai.tool.proposed`) | Tool description (`ai.tool`), use case (`ai.use_case`), DPIA reference (`ai.dpia_ref`), vendor review status, NPI exposure assessment | Tool approved or rejected (`ai.tool.approved` / `ai.tool.rejected`) | Before production deployment |
| AI tool approved (`ai.tool.approved`) | Approval record (`ai.approval_record`), tool ID (`ai.tool`) | AI Use Register updated (`ai.register.updated`; timer `ai.register_update_due_at`) | 5 business days of approval (enforced by `ai.register_update_due_at`) |
| Member-facing AI feature launched (`ai.member_feature.launched`) | Disclosure text (`ai.disclosure_text`), disclosure channel (`ai.disclosure_channel`), member feature ID (`ai.member_feature`) | Member-facing disclosure published (`ai.disclosure.published`) | Before or at feature launch |
| AI policy violation detected (NPI uploaded to unapproved tool) (`ai.violation`) | Violation detail (`dlp.violation_detail`), tool involved (`ai.tool`), actor | Violation disposed and remediated (`ai.violation.disposed`) | Immediate alert; remediation per severity |

**ALERTS/METRICS:** Alert fires when `ai.register_update_due_at` is breached for any approved tool; target: zero overdue register updates. Alert fires on any AI policy violation involving NPI. DPIA completion rate for production AI tools is tracked in the quarterly KPI report.

---

## IS-14 — Logging, Monitoring & Alerting {#is-14-logging-monitoring-alerting}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires monitoring of information systems to detect and respond to attacks and intrusions. Centralized logging with real-time alerting is the operational implementation of this requirement and the evidentiary foundation for all other controls.

**SYSTEM BEHAVIOR:** All security-relevant systems forward logs to a centralized SIEM (`siem.source_inventory`) with time synchronization enforced. The SIEM generates real-time alerts for critical events (`siem.alert_critical`); critical alerts are reviewed daily and dispositioned (confirmed malicious, false positive, or escalated to incident). Silent log sources (no events for an unexpected period) trigger an alert (`siem.source_silent`). Security-relevant logs are retained for at least 12 months, aligned to the records retention schedule. The SIEM configuration and alert rules are write-restricted to the Information Security/IT Lead and SecOps; alert disposition records are write-restricted to SecOps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical SIEM alert fires (`siem.alert_critical`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`), last seen timestamp (`siem.last_seen_at`) | Alert reviewed and dispositioned (`siem.alert.disposed`) | Daily review (enforced by `siem.alert_review_due_at`) |
| SIEM source goes silent (`siem.source_silent`) | Source ID, expected event frequency | Silent source alert raised and source restored or explained (`siem.source.restored`) | Immediate alert |
| Intrusion detected (`intrusion.detected`) | Intrusion severity (`intrusion.severity`), response initiated (`intrusion.response`) | Intrusion response recorded and incident declared if warranted (`intrusion.response.recorded`; `incident.created`) | Immediate |

**ALERTS/METRICS:** Alert fires when any critical SIEM alert is not dispositioned within 24 hours; target: zero unreviewed critical alerts at end of each business day. Silent-source alert fires within 1 hour of expected log gap. Log retention compliance is verified monthly; target: 100% of security-relevant sources retained ≥ 12 months.

---

## IS-15 — Acceptable Use & Communications Systems {#is-15-acceptable-use-communications-systems}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires administrative safeguards including policies governing employee use of information systems. Acceptable use policies establish the behavioral baseline that technical controls enforce.

**SYSTEM BEHAVIOR:** The Acceptable Use Policy (AUP) documents permitted use of devices (corporate and BYOD), email, messaging, internet, and removable media. The AUP includes explicit monitoring notice. BYOD devices must be enrolled in MDM (`byod.mdm_status`) and meet encryption requirements (`byod.encryption_status`) before accessing credit union systems. Remote work access is provided only through approved secure channels (`access.remote_config`). Removable media use on systems containing NPI is restricted and logged. All employees and contractors must acknowledge the AUP before access is granted and re-acknowledge annually or upon material revision. The AUP is write-restricted to the CCO and Information Security/IT Lead; acknowledgment records are maintained by HR and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New employee or contractor onboarded, or AUP materially revised (`employee.hired` / `aup.revised`) | AUP version (`aup.revision_summary`), employee/contractor ID (`employee.id`) | AUP acknowledged before access granted (`aup.acknowledged`) | Before access is granted |
| Annual AUP re-acknowledgment cycle opens | AUP version, employee roster | AUP re-acknowledged (`aup.reacknowledged`) | Annual |
| BYOD enrollment requested (`byod.enrollment.requested`) | MDM status (`byod.mdm_status`), encryption status (`byod.encryption_status`), enrollment record (`byod.enrollment`) | BYOD enrolled and compliant (`byod.enrolled`) | Before device accesses credit union systems |

**ALERTS/METRICS:** Alert fires when any employee or contractor has system access without a current AUP acknowledgment; target: zero access-without-acknowledgment exceptions. BYOD compliance rate (MDM enrolled + encrypted) is tracked monthly; target: 100%.

---

## IS-16 — Social Media {#is-16-social-media}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires safeguards against unauthorized disclosure of member information, including through social media channels. Social media impersonation and member-information disclosure are direct threats to member trust and regulatory standing.

**SYSTEM BEHAVIOR:** Corporate social media posts require pre-approval by the designated approver (`socialmedia.approver`) before publication. Employees making personal posts that reference Pynthia Credit Union must include required disclaimers (`socialmedia.disclosure`). Disclosure of member information on any social media channel is prohibited. The Information Security/IT Lead and Compliance monitor for scams, impersonation accounts, and unauthorized disclosures. When a scam or impersonation is detected, takedown escalation must be initiated the same day (`socialmedia.takedown_due_at`). Evidence of detected incidents is preserved (`socialmedia.evidence`). Social media monitoring and takedown escalation records are write-restricted to the Information Security/IT Lead and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate post drafted (`socialmedia.post.drafted`) | Post content (`socialmedia.post_content`), approver ID (`socialmedia.approver`) | Post approved and published (`socialmedia.post.approved`) | Before publication |
| Scam or impersonation detected (`socialmedia.impersonation.detected`) | Impersonation detail (`socialmedia.impersonation_detail`), evidence (`socialmedia.evidence`) | Takedown escalated (`socialmedia.takedown.escalated`) | Same day (enforced by `socialmedia.takedown_due_at`) |
| Unauthorized member-information disclosure detected (`socialmedia.disclosure.detected`) | Disclosure detail, evidence (`socialmedia.evidence`) | Disclosure disposed and incident assessed (`socialmedia.disclosure.disposed`) | Same day |

**ALERTS/METRICS:** Alert fires when `socialmedia.takedown_due_at` is breached for any detected impersonation or scam; target: zero same-day escalation failures. Corporate post approval compliance rate is tracked monthly; target: 100% pre-approved before publication.

---

## IS-17 — Training, Awareness & Testing {#is-17-training-awareness-testing}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires training of staff to implement the information security program. [NCUA 12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717) requires training for the identity-theft red-flag program. Untrained staff are the most exploited attack vector.

**SYSTEM BEHAVIOR:** All employees receive role-based security training. New hires must complete initial security training within 30 days of hire. Annual refresher training is required for all staff. High-risk roles (e.g., IT, finance, member-facing) receive additional deep-dive modules. Quarterly phishing simulations are conducted against all staff; results are recorded and employees who fail repeatedly receive mandatory re-training. Training completion is tracked per employee (`training.assignee_id`, `training.completion_status`). Re-training is assigned automatically upon repeated phishing failure (`phishing.repeat_failure`). Training records are write-restricted to HR and Compliance; phishing simulation results are write-restricted to the Information Security/IT Lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired (`employee.hired`) | Hire date (`training.hire_date`), role (`user.role`), required curriculum (`training.required_curriculum`) | New-hire security training assigned and completed (`training.assignment.created`; `training.onboarding.completed`) | 30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opens | Employee roster, role matrix (`training.role_matrix`), curriculum version (`training.content_version`) | Annual refresher training completed (`training.annual.assigned`; `training.refresher.completed`) | Annual (enforced by `training.annual_due_at`) |
| Quarter opens and phishing simulation is due | Simulation scenario (`phishing.scenario`), target population | Phishing simulation launched and results recorded (`phishing.simulation.launched`; `phishing.results.recorded`) | Quarterly |
| Repeated phishing failure detected (`phishing.repeat_failure`) | Failure history (`phishing.failure_history`), employee ID (`training.assignee_id`) | Remedial training assigned (`training.remedial.assigned`) | Within 5 business days of failure detection |

**ALERTS/METRICS:** Alert fires when new-hire training is not completed within 30 days; target: 100% on-time completion. Annual training completion rate target: 100% by cycle close. Phishing simulation failure rate is tracked quarterly; re-training assignment rate for repeat failures target: 100%.

---

## IS-18 — Records Management & Retention {#is-18-records-management-retention}

**WHY (Reg cite):** [NCUA 12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) sets records preservation requirements and vital-records schedules. [NCUA 12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires retention of security program records as evidence of compliance. Retention periods for security-specific record classes are governed by the Record Retention Policy's Schedule A.

**SYSTEM BEHAVIOR:** This control governs the security-specific record classes: SIEM and audit logs, incident-response records, vulnerability findings and POA&Ms, access-review evidence, AI-use registry entries, and physical security logs. When a security record is created, the retention clock is set immediately per Schedule A. The monthly destruction queue is processed for all security records that have reached their retention eligibility date and are not subject to a legal hold. Legal holds are governed exclusively by the Record Retention Policy's legal-hold process; this control does not duplicate that process. Data disposal must align with IS-07 (render data unreadable within 30 days of eligibility). Legal-hold, destruction mechanics, and permanent-record events are governed by SC-02 (embedded immediately below). The destruction queue and retention clock records are write-restricted to the Information Security/IT Lead and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security record created (SIEM log, IR record, vulnerability finding, access-review evidence, AI-use registry entry, physical security log) (`record.created`) | Record class (`record.retention_class`), record type (`record.class`), creation date, Schedule A period (`schedule_a.retention_period`) | Retention clock set (`record.retention_clock_set`) | Immediately on record creation |
| Monthly destruction queue cycle opens (no legal hold) | Records at retention eligibility (`record.disposal_eligible` = true), legal hold flag (`record.legal_hold_flag` = false), disposal method (`record.disposal_method`) | Destruction queue processed; eligible records submitted for disposal per IS-07 (`disposal.scheduled`) | Monthly |

**ALERTS/METRICS:** Alert fires when any security record reaches retention eligibility and is not queued for disposal within 5 days; target: zero overdue destruction queue items. Retention clock set rate target: 100% of security records clocked at creation.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [NCUA 12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and its Appendix B set the records-preservation program and vital-records requirements for federally insured credit unions. [NCUA 12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires retention of security-program evidence. The [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682) requires secure disposal of consumer-report information. These authorities collectively require that every record have a defined retention period, a legal-hold override, and a documented destruction method — mechanics that are identical regardless of which policy domain created the record.

**SYSTEM BEHAVIOR:** Every record in scope carries three mandatory fields set at creation: `record.retention_class` (the Schedule A category), `record.retention_anchor` (the clock-start date), and `record.legal_hold_flag` (default false). The retention engine computes `record.retention.expires_at` from anchor + Schedule A period and sets a `record.disposal_due_at` task 30 days before expiry. When Legal places a hold (`legal_hold.created`), `record.legal_hold_flag` is set to true and the disposal task is suspended; the clock resumes only after `legal_hold.clear.confirmed`. Destruction is executed in monthly batches: the sweep selects all records where `record.disposal_eligible` = true, `record.legal_hold_flag` = false, and `record.disposal_due_at` ≤ today. Each destroyed record receives a `destruction_log` entry with method, date, and authorizer; the batch manifest is filed as `record.destruction.certified`. Permanent records (Schedule A period = "permanent") are never queued for destruction; they are flagged at creation and excluded from all disposal sweeps. The retention engine and destruction queue are write-restricted to the Records Manager and Compliance; Legal has exclusive write access to legal-hold fields.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record created in any domain (`record.created`) | Retention class (`record.retention_class`), anchor date (`record.retention_anchor`), legal hold flag (`record.legal_hold_flag`), permanent flag | Retention clock set and `record.retention.expires_at` computed (`record.retention_clock_set`); disposal task created (`record.disposal_due_at`) | Immediately on creation |
| Legal hold placed on matter (`legal_hold.created`) | Matter ID (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`), placed-at timestamp (`legal_hold.placed_at`) | Affected records flagged (`record.hold.placed`); disposal tasks suspended | Immediately on hold placement |
| Legal hold released (`legal_hold.clear.confirmed`) | Release authorization (`legal_hold.release_approved_by`), matter ID | Records unflagged (`record.hold.released`); disposal clock resumed (`record.retention_clock_set`) | Immediately on release confirmation |
| Monthly destruction sweep executes | Records where `record.disposal_eligible` = true, `record.legal_hold_flag` = false, `record.disposal_due_at` ≤ today; disposal method (`record.disposal_method`) | Destruction executed, destruction log entries created, batch manifest certified (`record.destroyed`; `record.destruction.certified`; `destruction_log.entry.created`) | Monthly (enforced by `record.destruction_cycle_due_at`) |
| Permanent record created | Retention class = "permanent", `record.retention_class` | Record flagged permanent and excluded from disposal sweeps (`record.retained`) | At creation; no disposal task set |

**ALERTS/METRICS:** Alert fires when `record.destruction_cycle_due_at` is breached; target: monthly sweep executed within 5 business days of month-end. Alert fires when any `destruction_log.mismatch` is detected between manifest and actual destroyed count. Legal-hold suspension accuracy is verified quarterly; target: zero records destroyed while under active hold.

---

## SC-03 — Enterprise Incident Declaration & First-Hour Response {#sc-03-enterprise-incident-declaration-first-hour-response}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a written incident-response program that includes procedures for detecting, containing, and notifying affected parties of security incidents. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the underlying safeguards obligation. Rapid, structured first-hour response is the primary determinant of containment success and the clock-start for all downstream notification obligations.

**SYSTEM BEHAVIOR:** Any employee, system alert, or vendor notification may trigger incident declaration. The on-call Incident Commander (IC) is assigned within 15 minutes of declaration; the IC roster is maintained in the IMT record (`imt.roster`). The first-hour checklist (`incident.checklist_first_hour`) is mandatory for every declared incident and covers: initial scope assessment (`incident.scope_initial`), blast-radius isolation (`it.blast_radius_isolated`), evidence preservation, and stakeholder notification tree activation (`incident.comms_plan`). Sitreps are issued on a cadence set by severity: Sev-1 every 30 minutes, Sev-2 every 2 hours, Sev-3 every 4 hours, until the incident is stabilized. The IC has authority to invoke emergency access (`access.breakglass_id`) and emergency change procedures without prior CAB approval; both are logged and reviewed post-incident. Declaration and IC assignment are write-restricted to the on-call IC and CCO; first-hour checklist completion is write-restricted to the IC. This control feeds the reportability determination in [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident signal received from any source (`incident.signal.received`) | Detection source (`incident.detection_source`), initial description (`incident.description`), severity estimate (`incident.severity`) | Incident declared and IC assigned (`incident.declared`; `incident.ic.assigned`) | IC assigned within 15 minutes of declaration |
| IC assigned (`incident.ic.assigned`) | IC identity, incident ID (`incident.id`), first-hour checklist template (`incident.checklist_first_hour`) | First-hour checklist initiated and completed (`incident.first_hour.completed`) | Within 1 hour of declaration |
| First-hour checklist completed (`incident.first_hour.completed`) | Scope initial (`incident.scope_initial`), blast-radius isolation status (`it.blast_radius_isolated`), comms plan (`incident.comms_plan`), severity confirmed (`incident.severity`) | Containment started and first sitrep issued (`incident.containment.started`; `sitrep.issued`) | Immediately on checklist completion |
| Sitrep cadence timer fires (`sitrep.cadence_timer`) | Current status, scope update (`incident.scope`), containment status (`incident.contained`) | Sitrep issued to stakeholder distribution (`sitrep.issued`) | Sev-1: every 30 min; Sev-2: every 2 hr; Sev-3: every 4 hr; until stabilized |
| Incident stabilized / contained (`incident.containment.started` → contained) | Containment evidence (`incident.contained`), recovery status (`incident.recovered`) | Incident status updated to contained; reportability assessment initiated per SC-01 (`incident.security.confirmed`) | Immediately on stabilization |

**ALERTS/METRICS:** Alert fires if IC is not assigned within 15 minutes of any declared incident; target: 100% IC assignment within SLA. Alert fires if first-hour checklist is not completed within 60 minutes of declaration. Sitrep cadence compliance is tracked per incident; target: zero missed sitrep windows for Sev-1 and Sev-2 incidents.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| Patrick Wilson, Chief Compliance Officer | Policy owner; annual review; board submission; quarterly KPI delivery |
| Information Security / IT Lead | Control implementation; CMDB; SIEM; vulnerability management; IR plan |
| Engineering / SecOps | Technical control implementation; audit log production; automated monitoring |
| Risk | Enterprise risk register integration; POA&M oversight |
| Privacy | DPIA review; AI governance; data classification |
| HR | Joiner/mover/leaver triggers; training completion tracking |
| Facilities | Physical access controls; badge management |
| Board / Supervisory Committee | Annual policy approval; quarterly KPI review |

**Review cadence:** Annual, or upon material regulatory change, significant incident, or material change to the technology environment.

**Cross-references:**
- Enterprise Risk Management Policy (risk appetite, taxonomy, scoring)
- Third-Party Risk Policy (vendor onboarding and oversight mechanics)
- Record Retention Policy (Schedule A, legal-hold process)
- Business Continuity Plan Policy (detailed BCP)
- Privacy Policy (member privacy notices and rights)
- E-Commerce Policy (online/mobile banking channel governance)
- Electronic Payment Systems Policy (payment rail controls)
- Fair Lending Policy (marketing compliance)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for security-domain fields.** Several field and event codes used in this policy's control overlays are not yet registered in `core-vocabulary.json` as banking-core objects. Codes used follow the Composition grammar and registered-object prefixes (e.g., `security.program_charter` as a property of the registered `security` object). All such codes are the agreed target naming scheme and will be confirmed by engineering before the next review. Specifically: `security.program_charter`, `security.kpi_snapshot`, `security.board.report.due_at` (composed from registered `security` object and registered `report` task type), and `crypto.config` (composed from registered `crypto` object) are provisional spellings pending registration.

- **SC-01, SC-02, SC-03 shared-control bodies are placeholders pending canonical source files.** The LOCAL OVERRIDES instruct this policy to emit the embeddable blocks from `shared-controls/ncua-incident-notification.md`, `shared-controls/record-retention-mechanics.md`, and `shared-controls/incident-declaration.md` verbatim. Those source files are not available in this generation context; the bodies above represent the policy author's best synthesis of the required content and must be reconciled against the canonical shared-control files before publication. The heading lines, control IDs, and fragment anchors are byte-identical to the specified canonical form.

- **NCUA reporter status confirmed.** This policy assumes Pynthia Credit Union is a federally insured credit union subject to NCUA 12 CFR Part 748 in full, including the 72-hour cyber-incident notification requirement under §748.1(c). If the credit union's charter or insurance status changes, applicability must be re-evaluated.

- **ERM tiered reassessment cadence.** The High/Very High quarterly / Moderate annual / Low/Very Low biennial cadence in IS-02 is stated as the ERM Policy's standard. If the ERM Policy uses different tier definitions or cadences, IS-02 must be updated to match exactly.

- **Vendor breach-notice window.** IS-11 states that vendors must notify the institution within 24 hours of discovery, consistent with the Third-Party Risk Policy's standard. If the Third-Party Risk Policy specifies a different window, IS-11 must be updated to match.

- **AI governance regulatory authority.** No specific federal AI regulation is currently cited as the primary authority for IS-13. The control is anchored to NCUA Part 748 Appendix A's general safeguards obligation. If NCUA or GLBA regulators issue specific AI guidance, IS-13's WHY field must be updated.

- **ADA applicability to physical security.** ADA (28 CFR Part 36) is cited as a supporting authority for IS-12 (facilities access and visitor controls). This citation is included per AUTHORITY_HINTS; the primary security authority remains NCUA Part 748 Appendix A. Legal should confirm the specific ADA provisions relevant to Pynthia's facility design obligations.

- **Phishing simulation tooling.** IS-17 assumes automated phishing simulation tooling is in place or will be procured. If no tooling exists, the quarterly simulation cadence must be implemented manually and the EVENTS table's trigger event codes will need to be mapped to the tooling's event model.

- **Social media monitoring scope.** IS-16 assumes the Information Security/IT Lead and Compliance actively monitor external social media channels for impersonation and scams. The specific monitoring tools and channels in scope should be documented in the IS-16 procedure and referenced here once confirmed.

- **Break-glass account review SLA.** IS-06 states break-glass use must be reviewed by the CCO within 24 hours. This is an internal SLA not explicitly required by regulation; it should be confirmed as operationally achievable given on-call coverage and documented in the IR plan.
```
