```yaml
---
title: Information Security Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Information Security, Cybersecurity, NCUA, GLBA, FACTA, Identity Theft]
---
```

# Information Security Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based information security program that protects the confidentiality, integrity, availability, and resilience of member and organizational information across all people, facilities, data, systems, networks, vendors, and AI tools. The program is governed by the Board of Directors, owned by the Chief Compliance Officer, and implemented by Engineering and SecOps. Every control below is mandatory; evidence of implementation and testing must be maintained in audit logs and made available to examiners on request. Consumer-facing online/mobile banking channel governance, electronic payment rail controls, enterprise risk appetite and taxonomy, vendor onboarding program mechanics beyond information-security diligence, detailed business continuity planning, and member privacy notices are out of scope and governed by their respective policies.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy approval | Board meeting cycle opens | 12 months from last approval | Board-approved policy document | [IS-01](#is-01-governance-oversight) |
| Quarterly KPI report to Board | Quarter closes | 30 days post-quarter | Security KPI snapshot | [IS-01](#is-01-governance-oversight) |
| Risk register reassessment — High/Very High | Residual rating recorded or trigger event | Quarterly | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Risk register reassessment — Moderate | Residual rating recorded or trigger event | Annually | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Risk register reassessment — Low/Very Low | Residual rating recorded or trigger event | Every 2 years or trigger | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| POA&M update | Month closes | Monthly | POA&M record | [IS-02](#is-02-enterprise-risk-assessment) |
| New-product security assessment | New product proposed | 10 business days | Security risk assessment findings | [IS-02](#is-02-enterprise-risk-assessment) |
| CMDB delta posting | Asset change detected | 5 business days | CMDB record | [IS-03](#is-03-asset-inventory-classification) |
| CMDB quarterly attestation | Quarter closes | Quarterly | Attestation record | [IS-03](#is-03-asset-inventory-classification) |
| CAB review — medium/high-risk RFC | RFC submitted | 3 business days | CAB decision record | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change post-review | Emergency change deployed | 24 hours | Post-review record | [IS-04](#is-04-change-management-configuration-control) |
| High-risk vulnerability triage | Scan result confirmed | 5 business days | Vulnerability finding | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Critical patch | Vulnerability confirmed Critical | 7 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| High patch | Vulnerability confirmed High | 15 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Medium patch | Vulnerability confirmed Medium | 30 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Annual external pen-test | Calendar year opens | Annually | Pen-test report | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Termination access deprovision | Employee separation event | Same business day | Access deprovision record | [IS-06](#is-06-access-control-authentication) |
| Quarterly access review | Quarter closes | Quarterly | Access review attestation | [IS-06](#is-06-access-control-authentication) |
| Data disposal | Eligibility date reached (no legal hold) | 30 days | Disposal certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Weekly backup restore verification | Week closes | Weekly | Restore test record | [IS-08](#is-08-backup-disaster-recovery) |
| Annual DR exercise | Calendar year opens | Annually | DR exercise report | [IS-08](#is-08-backup-disaster-recovery) |
| NCUA cyber-incident notification | Reportability determined | 72 hours | NCUA notification | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notice — reportable incident | Misuse determined or likely | Without unreasonable delay | Member notice | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Red-flag case review | Red flag detected | Same business day | Red-flag case record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Red-flag ruleset review | Quarter closes | Quarterly | Ruleset update record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Vendor breach triage | Vendor breach notice received | 1 business day | Vendor incident triage record | [IS-11](#is-11-vendor-risk-management-infosec-diligence) |
| High-risk vendor annual review | Calendar year opens | Annually | Vendor review record | [IS-11](#is-11-vendor-risk-management-infosec-diligence) |
| Badge deactivation — separation | Employee/contractor separation | 24 hours | Badge deactivation record | [IS-12](#is-12-physical-security-facilities) |
| AI Use Register update | AI tool/feature approved | 5 business days | AI register entry | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical SIEM alert review | Critical alert fires | Daily | SIEM alert disposition | [IS-14](#is-14-logging-monitoring-alerting) |
| AUP acknowledgment | New hire onboarded or AUP revised | Before access granted | AUP acknowledgment record | [IS-15](#is-15-acceptable-use-communications-systems) |
| Social media takedown escalation | Scam/impersonation detected | Same business day | Takedown escalation record | [IS-16](#is-16-social-media) |
| New-hire security training | Employee hired | 30 days | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Annual security training refresher | Annual cycle opens | Annually | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Quarterly phishing simulation | Quarter opens | Quarterly | Phishing simulation results | [IS-17](#is-17-training-awareness-testing) |
| Security destruction queue | Month closes (no legal hold) | Monthly | Destruction log entry | [IS-18](#is-18-records-management-retention) |

---

## IS-01 — Governance & Oversight {#is-01-governance-oversight}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §I](https://www.ecfr.gov/current/title-12/part-748) requires each federally insured credit union to implement a written information security program approved by the board. [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) establishes the board-level safeguards obligation for nonpublic personal information.

**SYSTEM BEHAVIOR:** A single authoritative Security Program record (`security.program_charter`) holds the program charter, owner assignments, KPI definitions, and review cadence. The CCO submits the program for board approval annually; the board vote is recorded as `policy.board.approved`. Quarterly KPI snapshots are compiled from SIEM, vulnerability, access-review, and incident metrics and delivered to the Board/Supervisory Committee within 30 days of quarter close. The Security Program record is write-restricted to the CCO; KPI data is read-only for the Board package consumer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual board approval cycle opens (`policy.board_review.started`) | Current policy version (`policy.document_version`), prior approval date (`policy.board_approved_at`), change summary (`policy.change_summary`) | Board-approved policy record + `policy.board.approved` | Annually (internal: 30 days before effective date; enforced by `policy.board_approval_due_at`) |
| Quarter closes and KPI report is due (`security.quarter.closed`) | KPI snapshot (`security.kpi_snapshot`), incident trend summary (`incident.quarterly_summary`), vulnerability aging data (`vuln.severity`), access-review completion rate (`access.review_attestation`) | Board KPI package + `security.board_report.issued` | 30 days post-quarter (enforced by `security.board.report.due_at`) |

**ALERTS/METRICS:** Alert if board approval lapses beyond 12 months (`alert.policy_review_aging`). Alert if quarterly KPI package is not delivered within 30 days of quarter close. Target: zero lapsed approvals, zero late board packages.

---

## IS-02 — Enterprise Risk Assessment {#is-02-enterprise-risk-assessment}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires a risk assessment identifying threats, vulnerabilities, and controls for member information. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards commensurate with identified risks.

**SYSTEM BEHAVIOR:** The information-security risk register is a subset of the enterprise risk register governed by the Enterprise Risk Management Policy. Each risk entry (`risk.id`, `risk.residual_rating`, `risk.threat_catalog`) maps assets, threats (including fraud, social engineering, identity theft, and AI risks), and controls. Reassessment cadence follows ERM tiers: High/Very High residual risks at least quarterly, Moderate at least annually, Low/Very Low every two years or on trigger events. POA&M status (`risk.poam_status`, `risk.poam_cycle`) is updated monthly. For new products, a lightweight security risk assessment is completed within 10 business days of proposal and submitted as input to the ERM new-product review; findings are recorded as `risk.product_assessment.completed`. The risk register is write-restricted to the Information Security/IT lead and CCO; ERM owns the consolidated register.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk reassessment due date reached (`risk.assessment.due_at`) | Risk entry (`risk.id`), residual rating (`risk.residual_rating`), threat catalog (`risk.threat_catalog`), prior assessment results (`risk.assessment_results`) | Updated risk register entry + `risk.assessment.completed` | High/Very High: quarterly; Moderate: annually; Low/Very Low: every 2 years or on trigger (enforced by `risk.reassessment_due_at`) |
| Month closes and POA&M update is due | Open POA&M items (`risk.poam_status`), remediation evidence (`risk.remediation_evidence`), owner (`risk.owner_id`) | Updated POA&M record + `risk.poam.updated` | Monthly |
| New product proposed (`product.initiated`) | Product description (`product.description`), data flows (`product.data_flows`), risk rating (`process.risk_rating`) | Security risk assessment findings + `risk.product_assessment.completed` | 10 business days (enforced by `risk.product_assessment_due_at`) |

**ALERTS/METRICS:** Alert if any High/Very High risk entry has not been reassessed within 90 days. Alert if POA&M update is not recorded within the calendar month. Target: zero overdue reassessments by tier, zero months with missing POA&M updates.

---

## IS-03 — Asset Inventory & Classification {#is-03-asset-inventory-classification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires identification of information and systems that must be protected. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards proportionate to the sensitivity of the information held.

**SYSTEM BEHAVIOR:** The CMDB (`asset.cmdb_snapshot`) is the authoritative inventory of hardware, software, data stores, and vendors. Each asset record carries a data classification (`asset.classification`) of Public, Internal, or Confidential-NPI. When any asset is added, changed, or retired, the CMDB delta is posted within 5 business days. A quarterly attestation confirms the inventory is complete and classifications are current. The CMDB is write-restricted to the Information Security/IT lead; read access is granted to Engineering, Risk, and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Asset added, changed, or retired (`asset.changed`) | Asset attributes (`asset.attributes`), classification (`asset.classification`), owner (`asset.owner`), media type (`asset.media_type`) | Updated CMDB record + `asset.cmdb.updated` | 5 business days (enforced by `asset.cmdb_update_due_at`) |
| Quarter closes and attestation is due | CMDB snapshot (`asset.cmdb_snapshot`), owner roster (`asset.owner_roster`) | Quarterly attestation record + `asset.attestation.completed` | Quarterly |

**ALERTS/METRICS:** Alert if any asset change event is not reflected in the CMDB within 5 business days. Alert if quarterly attestation is not completed. Target: zero unattested quarters, CMDB delta lag ≤ 5 BD for 100% of changes.

---

## IS-04 — Change Management & Configuration Control {#is-04-change-management-configuration-control}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls over system changes to protect the integrity and availability of member information systems.

**SYSTEM BEHAVIOR:** All changes to production systems follow an RFC workflow (`change.rfc`, `change.risk_rating`, `change.test_evidence`, `change.backout_plan`, `change.approver_id`). Medium- and high-risk changes require CAB review within 3 business days of RFC submission; the CAB decision is recorded as `change.cab_decision`. Emergency changes may be deployed without prior CAB approval but must undergo post-review within 24 hours (`change.post.review.due_at`). Configuration drift (`config.drift_detail`) is detected automatically and must be resolved before the next change window. The change record is write-restricted to Engineering/SecOps; CAB decisions require the CCO or designated approver.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Medium/high-risk RFC submitted (`change.rfc.submitted`) | RFC details (`change.rfc`), risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision record + `change.cab_decision.recorded` | 3 business days (enforced by `change.cab_review_due_at`) |
| Emergency change deployed (`change.emergency.deployed`) | Emergency justification (`change.emergency_justification`), deployment record (`change.deployment_record`), rollback plan (`change.rollback_plan`) | Post-review record + `change.post_review.completed` | 24 hours (enforced by `change.post_review_due_at`) |
| Configuration drift detected (`config.drift.detected`) | Baseline ID (`config.baseline_id`), drift detail (`config.drift_detail`) | Drift resolution record + `config.drift.resolved` | Before next change window |

**ALERTS/METRICS:** Alert if any medium/high-risk RFC has not received a CAB decision within 3 BD. Alert if any emergency change post-review is not completed within 24 hours. Target: zero CAB SLA breaches, zero unreviewed emergency changes.

---

## IS-05 — Vulnerability Testing & Penetration Testing {#is-05-vulnerability-testing-penetration-testing}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires testing and monitoring of information systems. [NIST SP 800-53 Rev.5 CA-8, RA-5](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) (framework reference, non-regulatory) provides the vulnerability scanning and penetration testing control baseline.

**SYSTEM BEHAVIOR:** Automated vulnerability scans run on a scheduled basis across all in-scope systems. An external penetration test (`pentest.scope`, `pentest.independence`, `pentest.report`) is conducted annually by an independent party. All findings are recorded as `vuln.finding` with severity (`vuln.severity`) and tracked to closure in the POA&M. High-risk findings must be triaged within 5 business days (`vuln.triage_due_at`). Patching SLAs are: Critical within 7 days, High within 15 days, Medium within 30 days (all enforced by `vuln.remediation_due_at`). Findings that cannot be remediated within SLA require a risk acceptance (`risk_acceptance.rationale`) approved by the CCO. Vulnerability findings and pen-test reports are write-restricted to Engineering/SecOps; read access is granted to Risk and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vulnerability scan produces a finding (`vuln.finding.created`) | Finding detail (`vuln.detail`), severity (`vuln.severity`), affected asset (`asset.id`) | Triage task + `vuln.triage.completed` | 5 BD for High-risk findings (enforced by `vuln.triage_due_at`) |
| Vulnerability confirmed and remediation assigned | Finding record (`vuln.finding`), severity (`vuln.severity`), remediation plan (`vuln.remediation_plan`) | Remediation record + `vuln.remediated` | Critical: 7 days; High: 15 days; Medium: 30 days (enforced by `vuln.remediation_due_at`) |
| Annual pen-test cycle opens | Scope definition (`pentest.scope`), independence attestation (`pentest.independence`) | Scheduled pen-test engagement + `pentest.scheduled` | Annually (enforced by `pentest.engagement_due`) |
| Pen-test report received (`pentest.report.received`) | Pen-test report (`pentest.report`), findings list (`vuln.finding`) | Findings entered in POA&M + `pentest.report.issued` | Within 5 BD of receipt |

**ALERTS/METRICS:** Alert if any Critical finding is not remediated within 7 days, High within 15 days, or Medium within 30 days. Alert if annual pen-test has not been scheduled by Q1. Target: zero findings past SLA, 100% of findings tracked in POA&M.

---

## IS-06 — Access Control & Authentication {#is-06-access-control-authentication}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires access controls to limit access to member information to authorized individuals. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards including access controls proportionate to risk.

**SYSTEM BEHAVIOR:** All system access requires SSO with MFA enforced at the identity provider. Access is granted on a least-privilege, role-based basis (`access.role_entitlements`, `access.role_id`); the SoD matrix (`sod.matrix_version`) is enforced at provisioning. Joiner/mover/leaver events are automated: new hires are provisioned on their start date, role changes trigger entitlement updates, and terminations trigger same-business-day deprovision (`access.deprovision.due_at`). Break-glass accounts (`access.breakglass_id`) require written justification (`access.breakglass_justification`) and are reviewed after every use (`access.breakglass.reviewed`). Quarterly access reviews (`access.review_attestation`) are completed by system owners and attested to the CCO. Access provisioning and deprovision records are write-restricted to IT/SecOps; access reviews require the system owner and CCO attestation.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee separated (`employee.separated`) | User ID (`user.id`), employment status (`user.employment_status`), role (`user.role`), access scope (`access.role_entitlements`) | Deprovision record + `access.deprovisioned` | Same business day (enforced by `access.deprovision.due_at`) |
| New hire onboarded or role changed (`employee.hired` / `employee.role.changed`) | User ID (`user.id`), role (`user.role`), manager approval (`access.manager_approval`), SoD check result (`sod.check_result`) | Access provisioning record + `access.provisioned` | On start date / effective date of role change |
| Quarter closes and access review is due | User roster (`access.user_roster`), role entitlements (`access.role_entitlements`), reviewer roster (`access.reviewer_roster`) | Access review attestation + `access.review.completed` | Quarterly (enforced by `access.review_due_at`) |
| Break-glass account used (`access.breakglass.used`) | Break-glass ID (`access.breakglass_id`), justification (`access.breakglass_justification`), agent identity (`access.agent_identity`) | Break-glass review record + `access.breakglass.reviewed` | Within 1 BD of use |

**ALERTS/METRICS:** Alert if any termination deprovision is not completed same business day. Alert if quarterly access review attestation is overdue. Alert on every break-glass use for immediate CCO notification. Target: zero same-day deprovision failures, 100% quarterly review completion, all break-glass uses reviewed within 1 BD.

---

## IS-07 — Data Protection, Encryption & Disposal {#is-07-data-protection-encryption-disposal}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires encryption and secure disposal of member information. [FACTA Disposal Rule, 16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) requires proper disposal of consumer information derived from consumer reports. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards for nonpublic personal information including during disposal.

**SYSTEM BEHAVIOR:** All data in transit must use TLS 1.2 or higher (`tls.cipher_suite`, `tls.test_rating`); TLS certificates are monitored for expiry (`tls.certificate_expires_at`). All data at rest classified Confidential-NPI must use AES-256 or equivalent approved cryptography (`crypto.config`). DLP controls (`dlp.violation_detail`) are enforced at email, endpoint, and cloud egress points; violations are triaged by SecOps. Disposed data (physical and digital) must be rendered unreadable using approved methods (`disposal.method`) and a disposal certificate (`disposal.certificate`) recorded within 30 days of eligibility, unless a legal hold (`record.legal_hold_flag`) is in effect — in which case disposal is suspended until the hold is released per the Record Retention Policy. Encryption configuration and DLP policy are write-restricted to Engineering/SecOps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| TLS certificate approaching expiry (`tls.certificate.expiry.due`) | Certificate details (`tls.certificate_expires_at`), cipher suite (`tls.cipher_suite`) | Renewed certificate + `tls.certificate.renewed` | Before expiry (enforced by `tls.certificate_expiry_due`) |
| DLP violation detected (`dlp.violation.detected`) | Violation detail (`dlp.violation_detail`), asset classification (`asset.classification`) | DLP triage record + `dlp.violation.resolved` | Within 1 BD of detection |
| Data disposal eligibility reached and no legal hold (`record.disposal_eligible` = true, `record.legal_hold_flag` = false) | Asset/record ID (`asset.id`), classification (`asset.classification`), disposal method (`disposal.method`), batch manifest (`disposal.batch_manifest_id`) | Disposal certificate + `disposal.certificate.recorded` | 30 days of eligibility (enforced by `record.disposal_due_at`) |
| Crypto configuration reviewed or changed | Approved crypto config (`crypto.config`), reviewer ID | Crypto verification record + `crypto.verified` | Annually or on algorithm change |

**ALERTS/METRICS:** Alert if any TLS certificate will expire within 30 days without a renewal in progress. Alert on every DLP violation for same-day SecOps triage. Alert if any disposal-eligible record has not been disposed within 30 days. Target: zero expired certificates, zero unresolved DLP violations > 1 BD, zero disposal SLA breaches.

---

## IS-08 — Backup & Disaster Recovery {#is-08-backup-disaster-recovery}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls to ensure the availability and integrity of member information, including backup and recovery. [NIST SP 800-53 Rev.5 CP-9, CP-10](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) (framework reference, non-regulatory) provides the backup and recovery control baseline.

**SYSTEM BEHAVIOR:** RTO and RPO targets are defined per system in the DR plan (`dr.rto_rpo_matrix`) and registered in the scope registry (`scope_registry.item.rto`, `scope_registry.item.rpo`). Backups are maintained offsite and in immutable storage (`backup.tier_config`). Restore tests (`restore.test_env`) are conducted weekly to verify backup integrity; results are recorded as `restore.test.completed`. An annual full DR exercise (`dr.exercise.due_at`) tests end-to-end recovery including ransomware isolation and clean-room restore scenarios; the after-action report is delivered to the Board. Backup job failures (`backup.job.failed`) trigger immediate SecOps response. Backup and DR configuration is write-restricted to Engineering/SecOps; DR exercise results are reported to the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Week closes and restore test is due (`backup.restore.test.due`) | Backup catalog (`backup.catalog`), restore test environment (`restore.test_env`), RTO/RPO matrix (`dr.rto_rpo_matrix`) | Restore test result + `restore.test.completed` | Weekly (enforced by `backup.restore_test_due`) |
| Backup job fails (`backup.job.failed`) | Job detail (`backup.job_detail`), cycle (`backup.cycle`), RPO monitor (`backup.rpo_monitor`) | Remediation record + `backup.job.remediated` | Immediate SecOps response; remediation within 4 hours |
| Annual DR exercise due (`dr.exercise.due_at`) | DR plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`), scope registry (`scope_registry.version_id`), ransomware isolation scenario | DR exercise report + `dr.exercise.completed` | Annually (enforced by `dr.exercise_due_at`) |
| DR exercise completed — findings identified | Exercise report, finding detail (`finding.description`), severity (`finding.severity`) | Findings entered in POA&M + `finding.opened` | Within 5 BD of exercise completion |

**ALERTS/METRICS:** Alert if weekly restore test is not completed. Alert immediately on any backup job failure. Alert if annual DR exercise has not been scheduled by Q1. Target: 100% weekly restore test completion, zero unresolved backup failures > 4 hours, annual DR exercise completed with board report delivered.

---

## IS-09 — Incident Declaration, IC Assignment & Post-Mortem {#is-09-incident-declaration-ic-assignment-post-mortem}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a written incident response program. [NCUA 12 CFR Part 748 §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires notification of suspected crimes and reportable cyber incidents. This control governs the internal IR lifecycle; the reportability determination and regulatory/member notification obligations are governed by [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** The IR plan, on-call roster (`imt.roster.review.due`), and playbooks (`playbook.spec`) are maintained and reviewed at least annually. When a security signal is received, an incident is declared (`incident.declared`) and an Incident Commander (IC) is assigned within the timeframe specified in the IR plan. The IC leads the first-hour checklist (`incident.checklist_first_hour`), containment (`incident.contained`), scope determination (`incident.scope`), and root-cause analysis (`incident.root_cause`). Upon closure, a post-mortem is completed (`incident.postmortem.completed`) and findings are entered into the POA&M. The reportability assessment (`incident.reportability_assessment`, `incident.reportable.determined`) feeds directly into [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) for the 72-hour NCUA notification clock. Incident records are write-restricted to the IC and CCO; the CCO must sign off on reportability determinations (`incident.cco_signoff`).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security signal received (`incident.signal.received`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity (`incident.severity`) | Incident declared + `incident.declared` | Immediately upon detection |
| Incident declared (`incident.declared`) | Incident ID (`incident.id`), IC assignment roster (`imt.roster.review.due`), on-call rotation | IC assigned + `incident.ic.assigned` | Per IR plan SLA (internal: within 1 hour for Sev-1) |
| IC assigned (`incident.ic.assigned`) | Checklist (`incident.checklist_first_hour`), containment plan, comms plan (`incident.comms_plan`) | First-hour checklist completed + `incident.first_hour.completed` | Within 1 hour of IC assignment |
| Incident contained and scope determined | Scope (`incident.scope`), data scope (`incident.data_scope`), member impact (`incident.member_impact`), reportability assessment (`incident.reportability_assessment`) | Reportability determination + `incident.reportable.determined` → feeds [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) | As soon as practicable; reportability determination triggers SC-01 72-hour clock |
| Incident closed (`incident.closed`) | Root cause (`incident.root_cause`), timeline (`incident.timeline`), recovery evidence (`incident.recovered`) | Post-mortem report + `incident.postmortem.completed`; findings entered as `finding.opened` | Within 5 BD of closure |

**ALERTS/METRICS:** Alert if IC is not assigned within 1 hour of a Sev-1 declaration. Alert if reportability determination is not recorded within 24 hours of incident containment. Alert if post-mortem is not completed within 5 BD of closure. Target: 100% of incidents with IC assigned per SLA, zero reportability determinations delayed beyond 24 hours post-containment.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires a federally insured credit union to notify NCUA as soon as possible and no later than 72 hours after the credit union reasonably believes it has experienced a reportable cyber incident. [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member-notification response program when sensitive member information has been, or is reasonably believed to have been, accessed or misused by an unauthorized party.

**SYSTEM BEHAVIOR:** When an incident is determined to be reportable (`incident.reportable.determined` = true), the 72-hour NCUA notification clock starts from the moment of that determination and is tracked by `incident.ncua.notice.due_at`. The CCO reviews the reportability assessment (`incident.reportability_assessment`, `incident.reportability_rationale`) and signs off (`incident.cco_signoff`) before the notification is submitted. The NCUA notification (`incident_ncua`) is filed via the NCUA's reporting portal and the submission is logged as `incident.ncua.notified`. Member notice is required without unreasonable delay when misuse of sensitive member information has occurred or is reasonably likely (`incident.misuse_likelihood`, `incident.member_notice_required`); the notice content (`incident.notice_content`) follows the template approved under Appendix B and is logged as `incident.member_notices.sent`. Law-enforcement coordination is documented in the incident record (`incident.criminal_suspected`). The reportability determination and NCUA notification fields are write-restricted to the CCO; member-notice dispatch is write-restricted to Compliance and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident reportability determined (`incident.reportable.determined`) | Reportability assessment (`incident.reportability_assessment`), rationale (`incident.reportability_rationale`), CCO sign-off (`incident.cco_signoff`), incident scope (`incident.scope`), data scope (`incident.data_scope`) | NCUA notification submitted + `incident.ncua.notified`; NCUA notice due-at set (`incident.ncua.notice.due_at`) | 72 hours from determination (enforced by `incident.ncua.notice.due_at`; alerted by `alert.ncua_notification_aging`) |
| Misuse determined or reasonably likely (`incident.misuse.determined`) | Member impact summary (`incident.member_impact`), misuse likelihood (`incident.misuse_likelihood`), notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent + `incident.member_notices.sent`; notification due-at set (`incident.notification_due_at`) | Without unreasonable delay (internal SLA: within 10 BD of misuse determination; enforced by `incident.notification_due_at`) |
| Law-enforcement referral warranted | Criminal suspicion flag (`incident.criminal_suspected`), incident facts (`incident.facts`), legal review (`incident.legal_review`) | Law-enforcement referral logged + `incident.external_comms.recorded` | Concurrent with or immediately after NCUA notification |

**ALERTS/METRICS:** Fire `alert.ncua_notification_aging` if the NCUA notification has not been submitted within 48 hours of a reportable determination (24-hour buffer before the 72-hour deadline). Alert if member-notice dispatch exceeds 10 BD from misuse determination. Target: 100% of reportable incidents notified to NCUA within 72 hours, zero member-notice SLA breaches.

---

## IS-10 — Identity Theft Red Flags Program {#is-10-identity-theft-red-flags-program}

**WHY (Reg cite):** [NCUA 12 CFR Part 717, Subpart J](https://www.ecfr.gov/current/title-12/part-717) implements the FACT Act identity-theft red-flag requirements for credit unions, requiring a written program to detect, prevent, and mitigate identity theft in connection with covered accounts. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) reinforces the obligation to protect member nonpublic personal information.

**SYSTEM BEHAVIOR:** The red-flag program maintains a ruleset (`redflag.ruleset`) covering all covered accounts (loans, lines of credit, deposit accounts) across all access channels (in-person, telephone, online, ATM, written). The ruleset maps red-flag types (`redflag.type`) to required responses including step-up verification (`redflag.stepup_required`), account holds (`account.restriction`), and SAR referral (`sar.narrative`) where applicable. When a red flag is detected (`redflag.detected`), a case is opened and reviewed the same business day. Address-change-plus-card-reissue combinations are automatically flagged (`redflag.address_reissue_match`). The ruleset is reviewed quarterly (`redflag.review.due_at`) and updated to reflect new fraud patterns, new account types, and new access methods. Red-flag case records are write-restricted to the ID Theft Compliance Officer (designated by the CCO); the Board receives an annual summary of significant incidents as part of the IS-01 KPI report.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Red flag detected at account opening or on existing account (`redflag.detected`) | Red-flag type (`redflag.type`), account type, channel, member identity data (`member.identity_check_method`), step-up requirement (`redflag.stepup_required`) | Red-flag case opened + `redflags.case.opened`; step-up verification initiated if required (`redflag.stepup.completed`) | Same business day (enforced by `redflag.review.due_at`) |
| Address change received within 30 days of card reissue request | Address-reissue match flag (`redflag.address_reissue_match`), member identity verification | Red-flag case opened + `redflags.case.opened`; card hold applied until verification complete | Same business day |
| Red-flag case resolved | Case disposition, response taken, SAR referral if applicable (`sar.narrative`, `incident.sar_referred`) | Case disposed + `redflag.case.disposed`; SAR filed if warranted (`sar.filed`) | Within 5 BD of case opening |
| Quarter closes and ruleset review is due (`redflag.review.due_at`) | Current ruleset (`redflag.ruleset`), pattern updates (`redflag.pattern_updates`), case statistics (`redflag.case_stats`) | Updated ruleset + `redflag.ruleset.updated` | Quarterly |

**ALERTS/METRICS:** Alert if any red-flag case is not reviewed same business day. Alert if quarterly ruleset review is overdue. Target: 100% of red-flag cases reviewed same day, zero overdue quarterly ruleset reviews, all SAR referrals filed within BSA deadlines.

---

## IS-11 — Vendor Risk Management (InfoSec Diligence) {#is-11-vendor-risk-management-infosec-diligence}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §IV](https://www.ecfr.gov/current/title-12/part-748) requires oversight of service provider arrangements to ensure they implement appropriate safeguards. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires that service providers maintain appropriate safeguards for member nonpublic personal information.

**SYSTEM BEHAVIOR:** This control covers the information-security diligence contribution to the broader vendor lifecycle governed by the Third-Party Risk Policy. For each vendor with access to member data or critical systems, InfoSec completes a security questionnaire (`vendor.security_questionnaire`), reviews privacy controls, SOC reports (`vendor.soc_report`), and pen-test results as part of the due-diligence package (`vendor.dd_package`). Contracts must include breach-notice requirements (vendor notifies the institution within 24 hours of discovery), data disposition obligations (`vendor.data_deletion_attestation`), and right-to-audit clauses (`vendor.contract_clauses`). When a vendor breach notice is received (`vendor.breach.notified`), internal security triage must be completed within 1 business day (`vendor.incident.triage.due`). High-risk vendors are reviewed annually (`vendor.annual.review.due_at`) consistent with Third-Party Risk monitoring cadences. InfoSec diligence records are write-restricted to the Information Security/IT lead; vendor risk ratings feed the Third-Party Risk Policy's consolidated register.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor proposed for engagement with data/system access (`vendor.proposed`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), privacy controls review, pen-test results, NPI access flag (`vendor.npi_access_flag`), network access flag (`vendor.network_access_flag`) | InfoSec due-diligence package + `vendor.diligence.completed` | Before contract execution |
| Vendor breach notice received (`vendor.breach.notified`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`), incident scope (`vendor.incident_scope`), member count (`vendor.incident_member_count`) | Vendor incident triage record + `vendor.incident.logged`; feeds [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) reportability assessment | 1 business day (enforced by `vendor.incident_triage_due`) |
| High-risk vendor annual review due (`vendor.annual.review.due_at`) | Vendor risk assessment (`vendor.risk_assessment`), SOC report (`vendor.soc_report`), security questionnaire (`vendor.security_questionnaire`), contract clauses (`vendor.contract_clauses`) | Annual vendor review record + `vendor.review.completed` | Annually (enforced by `vendor.annual_review_due_at`) |

**ALERTS/METRICS:** Alert if vendor breach triage is not completed within 1 BD of notice receipt. Alert if any high-risk vendor annual review is overdue. Target: 100% of vendor breaches triaged within 1 BD, zero overdue high-risk vendor reviews, all contracts verified for required InfoSec clauses before go-live.

---

## IS-12 — Physical Security & Facilities {#is-12-physical-security-facilities}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires physical and environmental controls to protect member information systems. [ADA 28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) is a supporting authority for facilities access controls and visitor management.

**SYSTEM BEHAVIOR:** All facilities housing servers, network equipment, or sensitive media are access-controlled via card/badge systems (`facility.badge_id`, `facility.zone`). Visitors must be escorted and logged (`facility.visitor_identity`, `facility.visit_purpose`). CCTV and alarm systems are monitored continuously (`facility.cctv_ref`); alarms are responded to and resolved (`facility.alarm.resolved`). Secure areas for servers and media are designated and access-approved (`facility.access_approval`). Upon employee or contractor separation, badges are deactivated within 24 hours (`facility.badge_deactivation_due_at`). Physical security controls are tested annually (`facility.annual.test.due`). Badge deactivation is write-restricted to Facilities/HR; access approvals require the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee or contractor separated (`employee.separated`) | Badge ID (`facility.badge_id`), facility zone (`facility.zone`), separation record | Badge deactivated + `facility.badge_deactivated` | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
| Visitor arrives at a controlled facility (`facility.visitor.arrived`) | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), escort assignment | Visitor log entry + `facility.visitor.logged` | At time of arrival |
| Facility alarm triggered (`facility.alarm.triggered`) | Alarm detail, CCTV reference (`facility.cctv_ref`), zone (`facility.zone`) | Alarm response and resolution record + `facility.alarm.resolved` | Immediate response per security runbook |
| Annual physical security test due (`facility.annual.test.due`) | Test script (`facility.test_script`), facility contacts (`facility.contacts`) | Annual test completion record + `facility.test.completed` | Annually (enforced by `facility.annual_test_due`) |

**ALERTS/METRICS:** Alert if any badge deactivation is not completed within 24 hours of separation. Alert on every unresolved facility alarm beyond the runbook response window. Target: 100% of badge deactivations within 24 hours, zero unescorted visitor incidents, annual physical security test completed with findings remediated.

---

## IS-13 — AI Governance & Usage Disclosure {#is-13-ai-governance-usage-disclosure}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II–III](https://www.ecfr.gov/current/title-12/part-748) requires risk assessment and controls for all information systems, including AI tools that process member data. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards for NPI regardless of the processing technology used.

**SYSTEM BEHAVIOR:** Pynthia Credit Union maintains a default pro-AI posture with controls. The AI Use Register (`ai.tool`, `ai.use_case`, `ai.approval_record`) is the authoritative list of approved AI tools and use cases. Before any AI tool or feature is deployed to production, a Data Protection Impact Assessment (DPIA) must be completed (`ai.dpia_ref`) and the tool must pass vendor/feature review. Member-facing AI features require a disclosure (`ai.disclosure_text`, `ai.disclosure_channel`) published before launch. Uploading NPI to unapproved external AI tools is prohibited; violations are logged as `ai.violation` and triaged by SecOps. The AI Use Register is updated within 5 business days of any tool approval or retirement (`ai.register.update.due_at`). The AI Use Register is write-restricted to the CCO and Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| AI tool or feature proposed for production use (`ai.tool.proposed`) | Use case (`ai.use_case`), DPIA reference (`ai.dpia_ref`), vendor review results, NPI exposure assessment | Tool approval or rejection + `ai.tool.approved` or `ai.tool.rejected` | Before production deployment |
| AI tool approved (`ai.tool.approved`) | Approval record (`ai.approval_record`), tool details (`ai.tool`), use case (`ai.use_case`) | AI Use Register updated + `ai.register.updated` | 5 business days (enforced by `ai.register.update.due_at`) |
| Member-facing AI feature launched (`ai.member_feature.launched`) | Disclosure text (`ai.disclosure_text`), disclosure channel (`ai.disclosure_channel`) | Member-facing disclosure published + `ai.disclosure.published` | Before or at launch |
| NPI uploaded to unapproved external AI tool detected (`ai.violation`) | Violation detail (`ai.violation`), user ID, tool name, data classification (`asset.classification`) | Violation triage record + `ai.violation.disposed` | Same business day |

**ALERTS/METRICS:** Alert if any AI tool is deployed to production without a completed DPIA and approval record. Alert on every NPI-to-unapproved-AI violation for same-day SecOps response. Alert if AI Use Register update is not completed within 5 BD of approval. Target: zero unapproved AI tools in production, zero NPI violations unresolved > 1 BD, 100% of register updates within 5 BD.

---

## IS-14 — Logging, Monitoring & Alerting {#is-14-logging-monitoring-alerting}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires monitoring of information systems to detect and respond to attacks and intrusions. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards including monitoring to detect unauthorized access to member information.

**SYSTEM BEHAVIOR:** All security-relevant events are centralized in a SIEM (`siem.source_inventory`) with time-synchronized log sources. The SIEM generates real-time alerts for critical events (`siem.alert_critical`); critical alerts are reviewed daily (`siem.alert.review.due_at`). Silent log sources (sources that stop sending events) are detected and alerted (`siem.source_silent`). Security-relevant logs are retained for at least 12 months aligned to the records retention schedule governed by IS-18 and SC-02. SIEM configuration and alert rules are write-restricted to Engineering/SecOps; alert disposition records are readable by Compliance and Risk.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical SIEM alert fires (`siem.alert_critical`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`), last seen timestamp (`siem.last_seen_at`) | Alert review and disposition + `siem.alert.disposed` | Daily (enforced by `siem.alert_review_due_at`) |
| Log source goes silent (`siem.source_silent`) | Source inventory (`siem.source_inventory`), last seen timestamp (`siem.last_seen_at`) | Source restoration record + `siem.source.restored` | Immediate alert; restoration within 4 hours |
| Alert confirmed malicious (`siem.alert_confirmed_malicious`) | Alert detail (`siem.alert_detail`), confirmed malicious flag (`siem.alert_confirmed_malicious`) | Incident declared + `incident.declared` → feeds [IS-09](#is-09-incident-declaration-ic-assignment-post-mortem) | Immediately upon confirmation |

**ALERTS/METRICS:** Alert if any critical SIEM alert has not been reviewed and dispositioned within 24 hours. Alert immediately on any silent log source. Target: 100% of critical alerts reviewed daily, zero silent sources unresolved > 4 hours, log retention verified at 12 months minimum.

---

## IS-15 — Acceptable Use & Communications Systems {#is-15-acceptable-use-communications-systems}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls over access to and use of information systems. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards including controls over employee use of systems that process member NPI.

**SYSTEM BEHAVIOR:** The Acceptable Use Policy (AUP) documents permitted use of devices, email, messaging, internet, and removable media (`aup.revision_summary`). All users must acknowledge the AUP before access to any credit union system is granted; acknowledgment is recorded as `aup.acknowledged`. BYOD devices must be enrolled in MDM (`byod.mdm_status`, `byod.encryption_status`) before connecting to credit union networks. Remote access requires approved secure methods only (`access.remote_config`). Monitoring notice is included in the AUP. When the AUP is revised, all users must re-acknowledge within the timeframe specified in the revision (`aup.reacknowledged`). AUP content is write-restricted to the CCO; acknowledgment records are maintained by HR and IT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire onboarded or AUP revised (`employee.hired` / `aup.revised`) | AUP version (`aup.revision_summary`), user ID (`user.id`), role (`user.role`) | AUP acknowledgment record + `aup.acknowledged` | Before access is granted (new hire); within timeframe specified in revision notice (existing users) |
| BYOD device enrollment requested (`byod.enrollment.requested`) | MDM status (`byod.mdm_status`), encryption status (`byod.encryption_status`), enrollment record (`byod.enrollment`) | BYOD enrollment record + `byod.enrolled` | Before device connects to credit union network |
| AUP violation detected | Violation detail, user ID (`user.id`), system accessed | Policy violation record + `policy.noncompliance.flagged` | Same business day; escalated to HR and CCO |

**ALERTS/METRICS:** Alert if any user has system access without a current AUP acknowledgment. Alert if any BYOD device connects to the network without MDM enrollment. Target: 100% of users with current AUP acknowledgment before access, zero unenrolled BYOD devices on network.

---

## IS-16 — Social Media {#is-16-social-media}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect member information across all channels, including social media. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) prohibits unauthorized disclosure of member NPI through any channel.

**SYSTEM BEHAVIOR:** Corporate social media posts require pre-approval by the designated approver (`socialmedia.approver`) before publication. Personal posts by employees that reference the credit union must include required disclaimers (`socialmedia.disclosure`). Disclosure of member information on social media is prohibited; violations are detected and disposed (`socialmedia.disclosure.disposed`). Scams, impersonation accounts, and fraudulent posts are escalated for takedown the same business day (`socialmedia.takedown_due_at`). Evidence of all social media incidents is retained (`socialmedia.evidence`). Social media monitoring is write-restricted to Compliance; takedown escalations are coordinated by the CCO and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate post drafted (`socialmedia.post.drafted`) | Post content (`socialmedia.post_content`), approver (`socialmedia.approver`) | Approved post + `socialmedia.post.approved` | Before publication |
| Member information disclosure detected on social media (`socialmedia.disclosure.detected`) | Disclosure detail, post content (`socialmedia.post_content`), evidence (`socialmedia.evidence`) | Disclosure disposed + `socialmedia.disclosure.disposed`; policy violation flagged + `policy.noncompliance.flagged` | Same business day |
| Scam or impersonation account detected (`socialmedia.impersonation.detected`) | Impersonation detail (`socialmedia.impersonation_detail`), evidence (`socialmedia.evidence`) | Takedown escalation + `socialmedia.takedown.escalated` | Same business day (enforced by `socialmedia.takedown_due_at`) |

**ALERTS/METRICS:** Alert if any corporate post is published without an approval record. Alert if any scam/impersonation takedown escalation is not initiated same business day. Target: 100% of corporate posts pre-approved, zero member-information disclosures unresolved > 1 BD, all takedown escalations initiated same day.

---

## IS-17 — Training, Awareness & Testing {#is-17-training-awareness-testing}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §IV](https://www.ecfr.gov/current/title-12/part-748) requires training of staff to implement the information security program. [NCUA 12 CFR Part 717, Subpart J](https://www.ecfr.gov/current/title-12/part-717) requires training of staff to implement the identity-theft red-flag program.

**SYSTEM BEHAVIOR:** All employees receive role-based security training (`training.role_curriculum`, `training.role_matrix`). New hires must complete initial security training within 30 days of hire (`training.newhire_due_at`). Annual refresher training is required for all staff (`training.annual_due_at`). High-risk roles (e.g., IT, Finance, Member Services) receive additional deep-dive modules. Quarterly phishing simulations (`phishing.simulation`) are conducted; results are recorded (`phishing.results`). Employees who fail phishing simulations repeatedly (`phishing.repeat_failure`) are assigned mandatory re-training (`training.remedial.assigned`). Training completion is tracked per employee and reported to the Board as part of the IS-01 KPI report. Training records are write-restricted to HR and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire onboarded (`employee.hired`) | Hire date (`training.hire_date`), role curriculum (`training.role_curriculum`), module ID (`training.module_id`) | Training assigned + `training.assignment.created`; completion recorded + `training.onboarding.completed` | 30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opens (`training.annual_cycle.opened`) | Annual curriculum (`training.annual_cycle`), role matrix (`training.role_matrix`), cycle close date (`training.cycle_close_at`) | Annual training assigned + `training.annual.assigned`; completion recorded + `training.refresher.completed` | Annually (enforced by `training.annual_due_at`) |
| Quarter opens and phishing simulation is due | Phishing scenario (`phishing.scenario`), target population | Phishing simulation launched + `phishing.simulation.launched`; results recorded + `phishing.results.recorded` | Quarterly |
| Repeated phishing failure detected (`phishing.repeat_failure`) | Failure history (`phishing.failure_history`), employee ID (`training.assignee_id`) | Remedial training assigned + `training.remedial.assigned`; completion recorded + `training.remedial.completed` | Remedial training assigned within 5 BD of failure detection |

**ALERTS/METRICS:** Alert if any new hire has not completed security training within 30 days. Alert if annual training completion rate falls below 95% at the cycle close date. Alert if quarterly phishing simulation has not been launched. Target: 100% new-hire training within 30 days, ≥ 95% annual completion, 100% of repeat phishing failures assigned remedial training within 5 BD.

---

## IS-18 — Records Management & Retention (Security-Specific Classes) {#is-18-records-management-retention}

**WHY (Reg cite):** [NCUA 12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and its Appendix B set retention schedules and vital-records requirements for federally insured credit unions. [NCUA 12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires retention of records sufficient to evidence the security program. [FACTA Disposal Rule, 16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) requires secure disposal of consumer information.

**SYSTEM BEHAVIOR:** This control applies the Record Retention Policy's Schedule A retention periods to the following security-specific record classes: SIEM and audit logs, incident-response records, vulnerability findings and POA&Ms, access-review evidence, AI-use registry entries, and physical security logs. When a security record is created, the retention clock is set immediately (`record.retention_clock_set`) using the applicable Schedule A period (`record.retention_class`, `record.retention_anchor`). The security destruction queue is processed monthly unless a legal hold (`record.legal_hold_flag`) governed by the Record Retention Policy's legal-hold process is in effect. Data disposal must align with IS-07 (render data unreadable within 30 days of eligibility). Legal-hold placement, destruction execution, and permanent-record handling are governed exclusively by SC-02 below. Security records are write-restricted to Engineering/SecOps and Compliance; destruction requires CCO authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security record created (SIEM log, IR record, POA&M, access-review evidence, AI-use registry entry, physical security log) (`record.created`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`), Schedule A period (`schedule_a.retention_period`), legal hold flag (`record.legal_hold_flag`) | Retention clock set + `record.retention_clock_set` | Immediately upon record creation |
| Month closes and destruction queue is due (no legal hold in effect) | Destruction queue manifest (`disposal.batch_manifest_id`), legal hold status (`record.legal_hold_flag`), disposal method (`disposal.method`) | Destruction log entry + `destruction_log.entry.created`; disposal certificate + `disposal.certificate.recorded` | Monthly (destruction queue processed; enforced by `record.destruction_cycle_due_at`) |

**ALERTS/METRICS:** Alert if any security record is created without a retention clock being set within 1 BD. Alert if the monthly destruction queue is not processed. Target: 100% of security records with retention clocks set at creation, monthly destruction queue processed with zero skipped cycles absent a legal hold.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [NCUA 12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and Appendix B set minimum retention periods and vital-records requirements. [FACTA Disposal Rule, 16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) requires secure disposal of consumer information derived from consumer reports. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards for NPI throughout its lifecycle, including at disposal.

**SYSTEM BEHAVIOR:** Every record created under any policy that references SC-02 must have its retention clock set at creation using the Schedule A period for its class (`record.retention_class`, `record.retention_anchor`, `schedule_a.retention_period`). When the retention period expires and no legal hold is in effect (`record.legal_hold_flag` = false, `record.disposal_eligible` = true), the record enters the destruction queue and is disposed using an approved method (`disposal.method`) within 30 days of eligibility; a disposal certificate (`disposal.certificate`) is recorded. Legal holds (`legal_hold.created`) suspend the destruction clock for all records within the hold scope (`legal_hold.hold_scope`) until the hold is released (`legal_hold.clear.confirmed`) by authorized Legal or CCO sign-off (`legal_hold.release_approved_by`). Permanent records (Schedule A class = "permanent") are never destroyed and are flagged accordingly. Destruction is write-restricted to Compliance and Legal; legal-hold placement and release require CCO or Legal authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention period expires and no legal hold in effect (`record.retention.expired`, `record.disposal_eligible` = true) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`), legal hold flag (`record.legal_hold_flag`), disposal method (`disposal.method`), batch manifest (`disposal.batch_manifest_id`) | Disposal executed + `disposal.executed`; disposal certificate recorded + `disposal.certificate.recorded`; destruction log entry + `destruction_log.entry.created` | Within 30 days of eligibility (enforced by `record.disposal_due_at`) |
| Legal hold placed (`legal_hold.created`) | Hold scope (`legal_hold.hold_scope`), matter reference (`legal_hold.matter_ref`), placed timestamp (`legal_hold.placed_at`), authorizer | Legal hold applied to all in-scope records + `record.hold.placed`; destruction clock suspended | Immediately upon hold placement |
| Legal hold released (`legal_hold.clear.confirmed`) | Release approval (`legal_hold.release_approved_by`), released timestamp (`legal_hold.released_at`), schedule resumption flag (`legal_hold.schedule_resumed`) | Hold lifted + `record.hold.lifted`; destruction clock resumed; records re-enter destruction queue at next cycle | Immediately upon authorized release |
| Permanent record flagged for destruction (error condition) | Record class (`record.retention_class`) = "permanent", destruction attempt | Destruction blocked + `record.hold.applied`; alert issued to CCO | Immediately; no destruction permitted |

**ALERTS/METRICS:** Alert if any disposal-eligible record has not been destroyed within 30 days of eligibility. Alert if a legal hold is placed without an authorizer recorded. Alert immediately if a permanent record enters the destruction queue. Target: zero disposal SLA breaches, 100% of legal holds with documented authorizer and scope, zero permanent records destroyed.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| Patrick Wilson, Chief Compliance Officer | Policy owner; annual review; board submission; CCO sign-off on reportability determinations and destruction authorizations |
| Information Security / IT Lead | Day-to-day program operation; CMDB, vulnerability, access, SIEM, and backup controls |
| Engineering / SecOps | Implementation and evidencing of all technical controls; audit log maintenance |
| Risk | ERM integration; risk register co-ownership |
| Privacy | AI DPIA review; NPI classification oversight |
| HR | Joiner/mover/leaver triggers; training completion tracking |
| Facilities | Physical security controls; badge management |
| Board / Supervisory Committee | Annual policy approval; quarterly KPI review; DR exercise report receipt |

**Review cadence:** Annual, or upon material regulatory change, significant incident, or material change to the credit union's technology environment.

**Cross-references:**
- Enterprise Risk Management Policy (risk appetite, taxonomy, scoring)
- Third-Party Risk Policy (vendor onboarding and oversight program mechanics)
- Record Retention Policy (Schedule A, legal-hold process)
- Business Continuity Plan Policy (detailed BCP)
- Privacy Policy (member privacy notices and rights)
- E-Commerce Policy (online/mobile banking channel governance)
- Electronic Payment Systems Policy (payment rail controls)
- BSA/AML Policy (SAR filing procedures)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are not yet registered in `core-vocabulary.json` (the parsed spec covers the Cassandra Banking Core API). Specifically, the following codes are used per the Composition grammar and provisional-code list but require engineering confirmation before the next review: `security.program_charter` (new property on `security`), `security.board.report.due_at` (timer — maps to registered `security.board.report.due_at`), `risk.product_assessment_due_at` (maps to registered `risk.product.assessment.due_at`), `record.disposal_due_at` (maps to registered `record.disposal.due_at`), `vendor.incident.triage.due` (maps to registered `vendor.incident_triage_due`), `ai.register.update.due_at` (maps to registered `ai.register.update.due_at`). All other codes used in this document are registered in the vocabulary or listed as provisional codes in DESIGN_NOTES.

- **SC-01 and SC-02 shared-control bodies.** The bodies of SC-01 and SC-02 are intended to be byte-identical across all consuming policies. The text above is the authoritative source; any deviation in a sibling policy is an error to be corrected at next review.

- **ID Theft Compliance Officer designation.** PATRICK_NOTES designate the CCO as program owner but do not name a separate ID Theft Compliance Officer as required by NCUA 12 CFR Part 717, Subpart J. This policy assumes the CCO serves as the ID Theft Compliance Officer or formally designates a named individual. The designation must be documented and reported to the Board at the next annual review.

- **HMDA reporter status.** PATRICK_NOTES do not confirm whether Pynthia Credit Union is a HMDA reporter. If it is, HMDA-specific data security obligations (LAR data integrity, submission security) should be reviewed for inclusion in IS-03 and IS-14 at next review.

- **NCUA Part 701.31 applicability.** AUTHORITY_HINTS do not include NCUA 12 CFR Part 701.31 (nondiscrimination in lending). This policy does not address fair-lending obligations; those are governed by the Fair Lending Policy. Confirmed out of scope.

- **Ransomware isolation and clean-room restore procedures.** IS-08 references ransomware isolation and clean-room restore scenarios in the annual DR exercise. The specific technical procedures (network segmentation playbook, clean-room environment specification) are assumed to be documented in the IR playbooks (`playbook.spec`) and DR plan (`dr.plan`). Engineering must confirm these artifacts exist and are referenced in the DR exercise scope before the first annual exercise.

- **Vendor breach-notice window alignment.** IS-11 states vendors must notify the institution within 24 hours of discovery, consistent with the Third-Party Risk Policy standard. If the Third-Party Risk Policy specifies a different window, IS-11 must be updated to match at next joint review.

- **ADA facilities applicability.** ADA 28 CFR Part 36 is cited as a supporting authority for IS-12 physical security and visitor controls. The specific ADA obligations applicable to Pynthia Credit Union's facilities (e.g., accessible visitor check-in) are assumed to be addressed in the Facilities management program. This policy does not duplicate those obligations.

- **Phishing simulation vendor.** IS-17 assumes a third-party phishing simulation platform is in use. If no such platform is contracted, the quarterly simulation cadence must be met through an alternative method approved by the CCO, and the vendor should be added to the IS-11 diligence scope.

- **New-product security assessment integration with ERM.** IS-02 states that new-product security assessment findings are submitted as input to the ERM new-product review process. The specific handoff mechanism (e.g., a shared risk register entry, a formal memo) is not defined in PATRICK_NOTES and must be confirmed with the ERM Policy owner before the next new-product review cycle.
