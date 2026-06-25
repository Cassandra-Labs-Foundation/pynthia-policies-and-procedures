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

Pynthia Credit Union maintains a risk-based information security program that protects the confidentiality, integrity, availability, and resilience of member and organizational information across all people, facilities, data, systems, networks, vendors, and AI tools. The program is governed by the Board of Directors, owned by the Chief Compliance Officer, and implemented by Engineering and SecOps. Controls are calibrated to the credit union's risk profile, evidenced through audit logs and periodic testing, and designed to satisfy the requirements of [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) (including Appendices A and B), [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717), [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749), [15 USC §§ 6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) (GLBA), and [16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682). Consumer-facing channel governance, payment-rail controls, enterprise risk methodology, vendor-program mechanics, detailed BCP, and privacy notices are out of scope and governed by their respective policies.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy approval | Board meeting cycle opens | Annual | Board approval of policy | [IS-01](#is-01-governance-oversight) |
| Quarterly KPI report to Board | Quarter closes | 30 days post-quarter | Security KPI snapshot | [IS-01](#is-01-governance-oversight) |
| High/Very High risk reassessment | Residual rating recorded or trigger event | Quarterly | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Moderate risk reassessment | Residual rating recorded or trigger event | Annually | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| Low/Very Low risk reassessment | Residual rating recorded or trigger event | Every 2 years | Risk register entry | [IS-02](#is-02-enterprise-risk-assessment) |
| POA&M update | Monthly cycle | Monthly | POA&M record | [IS-02](#is-02-enterprise-risk-assessment) |
| New-product security risk assessment | New-product review initiated | 10 business days | Risk assessment findings | [IS-02](#is-02-enterprise-risk-assessment) |
| CMDB delta posting | Asset change detected | 5 business days | CMDB record | [IS-03](#is-03-asset-inventory-classification) |
| CMDB quarterly attestation | Quarter closes | Quarterly | Attestation record | [IS-03](#is-03-asset-inventory-classification) |
| CAB review — medium/high-risk RFC | RFC submitted | 3 business days | CAB decision | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change post-review | Emergency change deployed | 24 hours | Post-review record | [IS-04](#is-04-change-management-configuration-control) |
| High-risk vulnerability triage | Scan or pentest finding confirmed | 5 business days | Vuln finding | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Critical patch | Vuln finding confirmed Critical | 7 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| High patch | Vuln finding confirmed High | 15 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Medium patch | Vuln finding confirmed Medium | 30 days | Remediation record | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Annual external pen-test | Annual cycle | Annual | Pentest report | [IS-05](#is-05-vulnerability-testing-penetration-testing) |
| Termination — access deprovision | Employee separation event | Same business day | Access deprovision record | [IS-06](#is-06-access-control-authentication) |
| Quarterly access review | Quarter closes | Quarterly | Access review attestation | [IS-06](#is-06-access-control-authentication) |
| Data disposal | Retention eligibility reached | 30 days (unless hold) | Disposal certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Weekly backup restore verification | Weekly cycle | Weekly | Restore test record | [IS-08](#is-08-backup-disaster-recovery) |
| Annual DR exercise | Annual cycle | Annual | DR exercise report | [IS-08](#is-08-backup-disaster-recovery) |
| NCUA 72-hour cyber-incident notification | Reportability determined | 72 hours | NCUA notification | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notice — reportable incident | Reportability determined | Without unreasonable delay | Member notice | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Incident declaration & IC assignment | Incident signal received | Immediate / same shift | Incident record | [IS-09](#is-09-incident-declaration-ic-assignment-post-mortem) |
| Red-flag case review | Red flag detected | Same day | Red-flag case record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Red-flag ruleset review | Quarter closes | Quarterly | Ruleset update record | [IS-10](#is-10-identity-theft-red-flags-program) |
| Vendor security triage — breach notice | Vendor notifies institution | 1 business day | Vendor incident triage | [IS-11](#is-11-vendor-information-security-diligence) |
| High-risk vendor annual review | Annual cycle | Annual | Vendor review record | [IS-11](#is-11-vendor-information-security-diligence) |
| Badge deactivation — separation | Employee/contractor separation | 24 hours | Badge deactivation record | [IS-12](#is-12-physical-security-facilities) |
| AI Use Register update | AI tool approved | 5 business days | AI register entry | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical SIEM alert review | Critical alert fires | Daily | SIEM alert disposition | [IS-14](#is-14-logging-monitoring-alerting) |
| AUP acknowledgment | New hire onboarded or AUP revised | Before access granted | AUP acknowledgment record | [IS-15](#is-15-acceptable-use-communications-systems) |
| Social media scam/impersonation takedown | Impersonation detected | Same day escalation | Takedown escalation record | [IS-16](#is-16-social-media) |
| New-hire security training | Employee hired | 30 days | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Annual security training refresher | Annual cycle | Annual | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Quarterly phishing simulation | Quarter opens | Quarterly | Phishing simulation results | [IS-17](#is-17-training-awareness-testing) |
| Monthly security destruction queue | Monthly cycle | Monthly (unless hold) | Destruction log entry | [IS-18](#is-18-records-management-retention) |

---

## IS-01 — Governance & Oversight {#is-01-governance-oversight}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires the board to oversee the information security program, including approving the written program and receiving reports on its effectiveness. [15 USC § 6801](https://www.law.cornell.edu/uscode/text/15/6801) (GLBA) establishes the board-level safeguards obligation.

**SYSTEM BEHAVIOR:** The system maintains a single authoritative Security Program record (`security.program_charter`) that carries the current owner, charter scope, KPI definitions, and review cadence. Each annual cycle, the policy is submitted for board approval; the approval is recorded and the policy version published. Quarterly, a KPI snapshot is assembled and delivered to the Board/Supervisory Committee within 30 days of quarter-close. The Security Program record is write-restricted to the Chief Compliance Officer; KPI data is populated by SecOps and read-only to all other roles after submission.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual board approval cycle opens (`policy.board_review.started`) | Current policy draft (`policy.draft_id`), change summary (`policy.change_summary`), owner attestation (`policy.approver_id`) | Board-approved policy version + published program record (`policy.board.approved`, `policy.version.published`) | Annual (internal: 30 days before effective date; enforced by `policy.board_approval_due_at`) |
| Quarter closes and KPI report is due (`security.quarter.closed`) | KPI snapshot (`security.kpi_snapshot`), program charter reference (`security.program_charter`) | Quarterly KPI report delivered to Board/Supervisory Committee (`security.board_report.issued`) | 30 days post-quarter (enforced by `security.board_report_due_at`) |

**ALERTS/METRICS:** Alert if `policy.board_approval_due_at` is within 14 days and no `policy.board.approved` event has fired for the current cycle. Alert if `security.board_report_due_at` passes without a corresponding `security.board_report.issued` event; target zero overdue quarterly reports.

---

## IS-02 — Enterprise Risk Assessment {#is-02-enterprise-risk-assessment}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires a risk assessment identifying threats and vulnerabilities to member information. The ERM Policy governs the enterprise risk register and tiered reassessment cadence; this control is the InfoSec contribution to that register.

**SYSTEM BEHAVIOR:** The system maintains an information-security risk register as a subset of the enterprise risk register. Each risk entry maps assets, threats (including fraud, social engineering, identity theft, and AI risks), controls, inherent rating, and residual rating. Reassessment cadence is driven by residual rating: High/Very High at least quarterly, Moderate at least annually, Low/Very Low every two years or on trigger events. POA&M status is updated monthly. When a new product enters the ERM new-product review process, a lightweight security risk assessment is completed within 10 business days and submitted as input. Risk register entries are write-restricted to the Information Security/IT lead and CCO; read access is granted to Risk and the Board/Supervisory Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reassessment timer fires for a risk entry (`risk.assessment.due_at` reached) | Risk entry (`risk.id`), residual rating (`risk.residual_rating`), threat catalog (`risk.threat_catalog`), prior assessment results (`risk.assessment_results`) | Updated risk assessment record + published register snapshot (`risk.assessment.completed`, `risk.assessment.published`) | High/Very High: quarterly; Moderate: annually; Low/Very Low: every 2 years (enforced by `risk.reassessment_due_at`) |
| Monthly POA&M cycle opens | Open risk entries with remediation plans (`risk.poam_status`, `risk.poam_cycle`) | Updated POA&M record (`risk.poam.updated`) | Monthly |
| New-product review initiated in ERM (`risk.product_assessment.due_at` set) | Product description (`product.description`), data flows (`product.data_flows`), proposed controls | Security risk assessment findings submitted to ERM new-product review (`risk.product_assessment.completed`) | 10 business days (enforced by `risk.product_assessment.due_at`) |

**ALERTS/METRICS:** Alert if any High/Very High residual-rated risk entry has not received a `risk.assessment.completed` event within 90 days. Alert if POA&M update is not recorded by the 5th business day of the following month. Target zero overdue reassessments by tier.

---

## IS-03 — Asset Inventory & Classification {#is-03-asset-inventory-classification}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires identification of information and systems that require protection. Maintaining a current CMDB with data classification is the operational foundation for all other controls.

**SYSTEM BEHAVIOR:** The system maintains a CMDB covering hardware, software, data stores, and vendors. Each asset record carries a data classification (`asset.classification`) of Public, Internal, or Confidential-NPI. When an asset is added, changed, or retired, the CMDB record is updated within 5 business days and the delta is logged. Each quarter, the asset owner attests to the accuracy of their asset records. The CMDB is write-restricted to the Information Security/IT lead and Engineering; attestation is performed by designated asset owners.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Asset added, changed, or retired (`asset.changed`) | Asset attributes (`asset.attributes`), classification (`asset.classification`), owner (`asset.owner`), media type (`asset.media_type`) | Updated CMDB record + delta log (`asset.cmdb.updated`) | 5 business days (enforced by `asset.cmdb_update_due_at`) |
| Quarterly attestation cycle opens | CMDB snapshot (`asset.cmdb_snapshot`), owner roster (`asset.owner_roster`) | Quarterly attestation record (`asset.attestation.completed`) | Quarterly |

**ALERTS/METRICS:** Alert if any asset change event has not produced a `asset.cmdb.updated` event within 5 business days. Alert if quarterly attestation completion rate falls below 100% by the attestation deadline. Target zero unclassified assets in the CMDB.

---

## IS-04 — Change Management & Configuration Control {#is-04-change-management-configuration-control}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires controls over information systems, including change management. Configuration drift is a primary vector for security degradation.

**SYSTEM BEHAVIOR:** All changes to production systems follow an RFC workflow that requires a risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`), and approver sign-off (`change.approver_id`). Medium- and high-risk RFCs must receive a CAB decision within 3 business days of submission. Emergency changes may be deployed with expedited approval but must receive a post-review within 24 hours of deployment. Configuration drift from approved baselines is detected automatically and triggers a finding. The `change` object is write-restricted to Engineering; CAB decisions are recorded by the Information Security/IT lead or designated CAB chair.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RFC submitted for medium/high-risk change (`change.rfc.submitted`) | RFC record (`change.rfc`), risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision recorded (`change.cab_decision.recorded`) | 3 business days (enforced by `change.cab_review_due_at`) |
| Emergency change deployed (`change.emergency.deployed`) | Emergency justification (`change.emergency_justification`), deployment record (`change.deployment_record`) | Post-deployment review completed (`change.post_review.completed`) | 24 hours (enforced by `change.post_review_due_at`) |
| Configuration drift detected (`config.drift.detected`) | Baseline ID (`config.baseline_id`), drift detail (`config.drift_detail`) | Finding opened and tracked to closure (`finding.opened`) | Immediate detection; remediation per finding severity SLA per [IS-05](#is-05-vulnerability-testing-penetration-testing) |

**ALERTS/METRICS:** Alert if any medium/high-risk RFC has not received a `change.cab_decision.recorded` event within 3 business days. Alert if any emergency change has not received a `change.post_review.completed` event within 24 hours. Alert on any unresolved `config.drift.detected` event older than 1 business day.

---

## IS-05 — Vulnerability Testing & Penetration Testing {#is-05-vulnerability-testing-penetration-testing}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(c)](https://www.ecfr.gov/current/title-12/part-748) requires testing and monitoring of information systems. Regular vulnerability scanning and annual penetration testing are the primary mechanisms for identifying exploitable weaknesses.

**SYSTEM BEHAVIOR:** Automated vulnerability scans run on a scheduled basis across all in-scope systems. An external penetration test is conducted annually by an independent firm. All findings are triaged and tracked in the POA&M. High-risk findings must be triaged within 5 business days of confirmation. Patching SLAs by severity: Critical within 7 calendar days, High within 15 calendar days, Medium within 30 calendar days. Low findings are tracked to closure without a fixed deadline but are reviewed in the monthly POA&M cycle. Findings that cannot be remediated within SLA require a documented risk acceptance. The `vuln` and `pentest` objects are write-restricted to SecOps; risk acceptances require CCO sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vulnerability scan completes and finding confirmed (`vuln.finding.confirmed`) | Finding detail (`vuln.detail`), severity (`vuln.severity`), affected asset (`asset.id`) | Vuln finding created and triage timer set (`vuln.finding.created`); triage completed (`vuln.triage.completed`) | Triage: 5 business days for High/Critical (enforced by `vuln.triage_due_at`) |
| Triage complete — remediation plan assigned | Vuln finding (`vuln.finding`), remediation plan (`vuln.remediation_plan`) | Remediation tracked to closure (`vuln.remediated`) | Critical: 7 days; High: 15 days; Medium: 30 days (enforced by `vuln.remediation_due_at`) |
| Annual pen-test cycle opens (`pentest.scheduled`) | Scope (`pentest.scope`), independence attestation (`pentest.independence`) | Pen-test report issued and findings ingested (`pentest.report.issued`, `pentest.report.received`) | Annual (enforced by `pentest.engagement_due`) |

**ALERTS/METRICS:** Alert if any Critical finding has not been remediated within 7 days or any High finding within 15 days. Alert if the annual pen-test has not produced a `pentest.report.received` event within the scheduled window. Target zero Critical/High findings open beyond SLA.

---

## IS-06 — Access Control & Authentication {#is-06-access-control-authentication}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(b)](https://www.ecfr.gov/current/title-12/part-748) requires access controls to prevent unauthorized access to member information. [15 USC § 6801](https://www.law.cornell.edu/uscode/text/15/6801) (GLBA) reinforces the obligation to protect NPI from unauthorized access.

**SYSTEM BEHAVIOR:** All system access requires SSO with MFA enforced at the identity provider. Access is granted on a least-privilege, role-based basis; role entitlements are defined in the access matrix (`access.role_entitlements`). Joiner/mover/leaver events trigger automated provisioning and deprovisioning workflows. On employee separation, all access must be deprovisioned the same business day. Quarterly access reviews require managers to attest to the continued appropriateness of each entitlement. Break-glass accounts are permitted for emergency use only; every use is logged with justification (`access.breakglass_justification`) and reviewed by the CCO within one business day. SoD conflicts are blocked at provisioning time; compensating controls require CCO approval. The `access` object is write-restricted to IT/SecOps; access reviews are performed by designated managers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee separated (`employee.separated`) | User ID (`user.id`), employment status (`user.employment_status`), role (`user.role`) | All access deprovisioned (`access.deprovisioned`); deprovision logged | Same business day (enforced by `access.deprovision.due_at`) |
| Employee hired or role changed (`employee.hired`, `employee.role.changed`) | Role entitlements (`access.role_entitlements`), manager approval (`access.manager_approval`), SoD check result (`sod.check_result`) | Access provisioned (`access.provisioned`) or SoD conflict blocked (`sod.grant.blocked`) | Before first system access |
| Quarterly access review cycle opens | User roster (`access.user_roster`), reviewer roster (`access.reviewer_roster`), last reviewed date (`access.last_reviewed_at`) | Access review completed and attested (`access.review.completed`); revocations executed (`access.revoked`) | Quarterly (enforced by `access.review_due_at`) |
| Break-glass account used (`access.breakglass.used`) | Break-glass ID (`access.breakglass_id`), justification (`access.breakglass_justification`) | Break-glass use logged and reviewed (`access.breakglass.reviewed`) | Review within 1 business day |

**ALERTS/METRICS:** Alert if any separation event has not produced an `access.deprovisioned` event by end of the same business day. Alert if quarterly access review completion falls below 100% by deadline. Alert on any `access.breakglass.used` event not followed by `access.breakglass.reviewed` within 1 business day.

---

## IS-07 — Data Protection, Encryption & Disposal {#is-07-data-protection-encryption-disposal}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(b)](https://www.ecfr.gov/current/title-12/part-748) requires encryption and other technical safeguards for member information. [16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) (FACTA Disposal Rule) requires secure disposal of consumer information derived from consumer reports.

**SYSTEM BEHAVIOR:** All data classified Confidential-NPI must be encrypted in transit (TLS 1.2 minimum) and at rest (AES-256 or equivalent approved cipher). The approved cryptographic configuration is maintained in the crypto config record (`crypto.config`). DLP controls monitor for unauthorized exfiltration of NPI; violations are logged and escalated. When data reaches its retention eligibility date and is not subject to a legal hold, disposal must be completed within 30 days using an approved method that renders the data unreadable (e.g., cryptographic erasure, degaussing, shredding). A disposal certificate is issued for each batch. Litigation holds governed by the Record Retention Policy suspend the disposal clock. The `crypto` and `dlp` objects are write-restricted to SecOps; disposal certificates are issued by the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| TLS certificate approaching expiry (`tls.certificate_expires_at` within threshold) | Certificate details (`tls.cipher_suite`), expiry date (`tls.certificate_expires_at`) | Certificate renewed (`tls.certificate.renewed`); TLS assessment completed (`tls.assessment.completed`) | Before expiry (enforced by `tls.certificate_expiry_due`) |
| DLP violation detected (`dlp.violation.detected`) | Violation detail (`dlp.violation_detail`) | DLP violation logged and escalated; resolved (`dlp.violation.resolved`) | Immediate detection; resolution per severity |
| Data reaches disposal eligibility (`record.disposal_eligible` = true, no legal hold) | Record class (`record.retention_class`), disposal method (`record.disposal_method`), legal hold flag (`record.legal_hold_flag`) | Disposal executed and certificate recorded (`disposal.executed`, `disposal.certificate.recorded`) | 30 days of eligibility (enforced by `record.disposal_due_at`) |

**ALERTS/METRICS:** Alert if any TLS certificate will expire within 30 days without a renewal in progress. Alert on any `dlp.violation.detected` event not resolved within 1 business day. Alert if any disposal-eligible record has not received a `disposal.executed` event within 30 days. Target zero unencrypted NPI at rest or in transit.

---

## IS-08 — Backup & Disaster Recovery {#is-08-backup-disaster-recovery}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(d)](https://www.ecfr.gov/current/title-12/part-748) requires response programs that include business resumption. [12 CFR Part 749, Appendix B](https://www.ecfr.gov/current/title-12/part-749) requires vital-records preservation. Detailed BCP is governed by the Business Continuity Plan Policy; this control covers the backup and DR technical controls.

**SYSTEM BEHAVIOR:** RTO and RPO targets are defined per system in the DR plan (`dr.rto_rpo_matrix`) and maintained in the scope registry. Backups are stored offsite and in immutable form to prevent ransomware encryption. Restore integrity is verified weekly by restoring a sample backup to an isolated test environment. An annual full DR exercise tests failover and clean-room restore capabilities; results are documented and findings tracked. Ransomware events trigger immediate network isolation of affected systems (`it.blast_radius_isolated`) and initiation of clean-room restore procedures. The `backup` and `dr` objects are write-restricted to Engineering/SecOps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Weekly restore verification cycle opens (`backup.verify_due` reached) | Backup catalog (`backup.catalog`), tier config (`backup.tier_config`), test environment (`restore.test_env`) | Restore test completed and verified (`restore.test.completed`, `backup.restore.verified`) | Weekly (enforced by `backup.verify_due_at`) |
| Annual DR exercise scheduled (`dr.exercise.due` reached) | DR plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`), exercise roster | DR exercise completed; findings tracked (`dr.exercise.completed`) | Annual (enforced by `dr.exercise_due_at`) |
| Ransomware or destructive attack detected (`it.major_failure.detected`) | Blast radius assessment (`it.blast_radius_isolated`), backup catalog (`backup.catalog`), clean-room restore plan | Network isolation executed; clean-room restore initiated (`restore.initiated`, `restore.completed`) | Immediate isolation; restore per RTO |

**ALERTS/METRICS:** Alert if weekly restore verification has not produced a `backup.restore.verified` event within 8 days. Alert if annual DR exercise has not produced a `dr.exercise.completed` event within the scheduled window. Alert on any backup job failure (`backup.job.failed`) not remediated within 4 hours.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [12 CFR § 748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1(c)) requires a federally insured credit union to notify NCUA as soon as possible, and no later than 72 hours after the credit union reasonably believes it has experienced a reportable cyber incident. [12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member-notification response program when sensitive member information has been, or is reasonably believed to have been, accessed or misused by an unauthorized person.

**SYSTEM BEHAVIOR:** Once an incident is declared (see [IS-09](#is-09-incident-declaration-ic-assignment-post-mortem)), the system immediately opens a reportability assessment. The Incident Commander (IC) and CCO jointly evaluate whether the incident meets the NCUA reportability threshold — unauthorized access to, or misuse of, member information that could result in substantial harm or inconvenience. The determination is recorded in `incident.reportability_determination` with rationale in `incident.reportability_rationale`. If reportable, the 72-hour NCUA notification clock starts from `incident.reportable.determined`; the system enforces this via `incident.ncua.notice.due_at`. NCUA is notified via the NCUA MERIT portal or other required channel; the notification record is stored in `incident_ncua`. Member notice is required without unreasonable delay when sensitive member information has been, or is reasonably believed to have been, misused; the member-notice determination is recorded in `incident.member_notice_required` and notices are issued per the approved template (`incident.member_notice_template`). Law-enforcement coordination is documented in `incident.facts`. The reportability determination and NCUA notification fields are write-restricted to the CCO; member-notice issuance is executed by the CCO or designee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared and reportability assessment opened (`incident.declared`) | Incident scope (`incident.scope`), data scope (`incident.data_scope`), severity (`incident.severity`), detection source (`incident.detection_source`) | Reportability assessment started (`incident.assessment.started`) | Immediately on declaration |
| Reportability determination made (`incident.reportable.determined`) | Reportability determination (`incident.reportability_determination`), rationale (`incident.reportability_rationale`), CCO sign-off (`incident.cco_signoff`) | Determination recorded; if reportable, NCUA notification clock set (`incident.ncua.notice.due_at`) | As soon as reasonably practicable after determining reportability |
| NCUA notification due (`incident.ncua.notice.due_at` reached, reportable = true) | Incident summary (`incident.summary_id`), timeline (`incident.timeline`), impact summary (`incident.impact_summary`), regulator notification record (`incident_ncua`) | NCUA notified (`incident.ncua.notified`); notification logged (`ncua.notification.sent`) | 72 hours from `incident.reportable.determined` (enforced by `incident.ncua.notice.due_at`) |
| Member-notice determination made (`incident.notification.determined`) | Member impact assessment (`incident.member_impact`), misuse likelihood (`incident.misuse_likelihood`), notice template (`incident.member_notice_template`) | Member-notice requirement recorded (`incident.member_notice_required`); if required, notice issued (`incident.member_notices.sent`) | Without unreasonable delay after misuse determined or reasonably believed (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert if `incident.ncua.notice.due_at` is within 6 hours and no `incident.ncua.notified` event has fired. Alert if `incident.notification_due_at` is breached for any incident where `incident.member_notice_required` = true. Target zero NCUA notifications delivered after the 72-hour deadline.

---

## IS-09 — Incident Declaration, IC Assignment & Post-Mortem {#is-09-incident-declaration-ic-assignment-post-mortem}

**WHY (Reg cite):** [12 CFR Part 748, Appendix B §I](https://www.ecfr.gov/current/title-12/part-748) requires a written incident response program. This control governs the operational lifecycle of an incident from detection through post-mortem; it feeds the reportability determination in [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** When a security signal is received, an incident is declared and an Incident Commander (IC) is assigned within the same shift. The IC executes the first-hour checklist (`incident.checklist_first_hour`), initiates containment, and coordinates with law enforcement where criminal activity is suspected (`incident.criminal_suspected`). The IR plan, roster (`imt.roster`), and playbooks are maintained and tested. Once the incident is contained, a post-mortem is completed and root cause documented (`incident.root_cause`). Post-mortem findings feed the risk register and POA&M. The IC assignment and first-hour checklist are write-restricted to the IC and CCO; post-mortem sign-off requires CCO approval. This control feeds the reportability determination in [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) — the IC's initial scope and data-scope assessment is the primary input to that determination.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security signal received (`incident.signal.received`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity estimate (`incident.severity`) | Incident declared and IC assigned (`incident.declared`, `incident.ic.assigned`); first-hour checklist initiated (`incident.first_hour.completed`) | Same shift; IC assignment enforced by `incident.ic_assignment_timer` |
| Incident contained (`incident.containment.started`) | Containment evidence (`incident.contained`), data scope confirmed (`incident.data_scope`), member impact (`incident.member_impact`) | Containment recorded; reportability assessment opened per [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) (`incident.assessment.started`) | As soon as containment achieved |
| Incident closed — post-mortem due | Root cause analysis (`incident.root_cause`), timeline (`incident.timeline`), recovery evidence (`incident.recovered`) | Post-mortem completed; findings submitted to risk register and POA&M (`incident.postmortem.completed`) | Within 14 days of closure (internal SLA) |
| IMT roster review cycle opens (`imt.roster.review.due` reached) | Current roster (`imt_roster`), contact details | Roster verified and updated (`imt.roster.verified`) | Annual |

**ALERTS/METRICS:** Alert if any declared incident has not received an `incident.ic.assigned` event within 2 hours. Alert if post-mortem has not been completed within 14 days of incident closure. Alert if IMT roster has not been verified within the annual cycle.

---

## IS-10 — Identity Theft Red Flags Program {#is-10-identity-theft-red-flags-program}

**WHY (Reg cite):** [12 CFR Part 717, Subpart J](https://www.ecfr.gov/current/title-12/part-717) (implementing the FACT Act) requires a written identity-theft prevention program for covered accounts that detects, prevents, and mitigates identity theft. The program must be board-approved and periodically updated.

**SYSTEM BEHAVIOR:** The system maintains a red-flag matrix (`redflag.ruleset`) covering all covered accounts (deposit and loan). The matrix maps red-flag types to required responses, including step-up verification (`redflag.stepup_required`), account holds (`account.restriction`), and SAR referral where applicable. When a red flag is detected, a case is opened and reviewed the same day. The ruleset is reviewed quarterly to reflect changes in identity-theft methods, account types, and service-provider arrangements. Address-change-plus-card-reissue combinations within 30 days are flagged automatically (`redflag.address_reissue_match`). SAR referrals are coordinated with the BSA Officer per the BSA/AML Policy. The red-flag ruleset is write-restricted to the CCO; case dispositions are recorded by the designated ID Theft Compliance Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Red flag detected on new or existing covered account (`redflag.detected`) | Red-flag type (`redflag.type`), account reference, member identity data, detection context | Red-flag case opened and reviewed (`redflags.case.opened`); step-up verification initiated if required (`redflag.stepup.completed`); case disposed (`redflag.case.disposed`) | Same day review (enforced by `redflag.review_due_at`) |
| Address change + card reissue within 30 days detected (`redflag.address_reissue_match` = true) | Address change record, card reissue request, member identity | Address hold applied; card withheld pending verification (`account.restriction.approved`, `redflag.reissue.verified`) | Before card issuance |
| Quarterly ruleset review cycle opens | Current ruleset (`redflag.ruleset`), case statistics (`redflag.case_stats`), pattern updates (`redflag.pattern_updates`) | Ruleset reviewed and updated (`redflag.ruleset.updated`) | Quarterly |

**ALERTS/METRICS:** Alert if any red-flag case has not received a `redflag.case.disposed` event by end of the same business day. Alert if quarterly ruleset review has not produced a `redflag.ruleset.updated` event within the scheduled window. Track SAR referral rate from red-flag cases as a KRI.

---

## IS-11 — Vendor Information Security Diligence {#is-11-vendor-information-security-diligence}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(e)](https://www.ecfr.gov/current/title-12/part-748) requires oversight of service-provider arrangements to ensure they implement appropriate safeguards. This control is the InfoSec contribution to the broader vendor lifecycle governed by the Third-Party Risk Policy.

**SYSTEM BEHAVIOR:** For each vendor with access to NPI or critical systems, the Information Security team performs security due diligence as part of onboarding: security questionnaire (`vendor.security_questionnaire`), privacy controls review (`vendor.privacy_review`), SOC report review (`vendor.soc_report`), and pen-test results where available. Contracts must include breach-notice obligations (vendor notifies the institution within 24 hours of discovery), data disposition requirements (`vendor.data_deletion_attestation`), and right-to-audit clauses (`vendor.contract_clauses`). When a vendor reports a breach or security incident, internal security triage must be completed within 1 business day. High-risk vendors are reviewed annually consistent with Third-Party Risk monitoring cadences. The `vendor.security_questionnaire` and `vendor.soc_report` fields are write-restricted to the Information Security/IT lead; contract clause verification is performed jointly with Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor onboarding initiated for NPI/critical-system vendor (`vendor.onboarding.started`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), privacy review (`vendor.privacy_review`), contract clauses (`vendor.contract_clauses`) | InfoSec due diligence completed; contract clauses verified (`vendor.diligence.completed`, `vendor.contract_clauses.verified`) | Before go-live |
| Vendor reports breach or security incident (`vendor.breach.notified`) | Breach detail (`vendor.breach_detail`), affected scope (`vendor.affected_scope`), incident scope (`vendor.incident_scope`) | Internal security triage completed; incident tracked (`vendor.incident.logged`); incident triaged (`vendor.incident_triaged`) | 1 business day (enforced by `vendor.incident_triage_due`) |
| Annual review cycle opens for high-risk vendor (`vendor.annual.review.due` reached) | Prior review record, security questionnaire, SOC report, pen-test results | Annual vendor review completed (`vendor.review.completed`) | Annual (enforced by `vendor.annual_review_due_at`) |

**ALERTS/METRICS:** Alert if any vendor breach notification has not produced a `vendor.incident_triaged` event within 1 business day. Alert if any high-risk vendor annual review is overdue. Target zero high-risk vendors without a current SOC report or security questionnaire on file.

---

## IS-12 — Physical Security & Facilities {#is-12-physical-security-facilities}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(b)](https://www.ecfr.gov/current/title-12/part-748) requires physical safeguards to protect member information and systems. [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) (ADA) informs accessible facility design for visitor controls.

**SYSTEM BEHAVIOR:** All facilities housing systems or media with NPI enforce card-access controls with logged entry (`facility.access.confirmed`). Visitors must be escorted and logged (`facility.visitor.logged`). CCTV and alarm systems are monitored; alarms are responded to and resolved (`facility.alarm.resolved`). Server rooms and media storage areas are designated secure zones (`facility.zone`). On employee or contractor separation, physical access badges must be deactivated within 24 hours. Annual facility security tests verify the effectiveness of physical controls. The `facility` object is write-restricted to Facilities and the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee or contractor separated (`employee.separated`) | Badge ID (`facility.badge_id`), facility zone access list | Badge deactivated (`facility.badge_deactivated`) | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
| Visitor arrives at a secure facility (`facility.visitor.arrived`) | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), escort assignment | Visitor logged and escort confirmed (`facility.visitor.logged`) | At arrival |
| Facility alarm triggered (`facility.alarm.triggered`) | Alarm detail, CCTV reference (`facility.cctv_ref`), zone | Alarm investigated and resolved (`facility.alarm.resolved`) | Immediate response |
| Annual facility security test cycle opens (`facility.annual.test.due` reached) | Test script (`facility.test_script`), contacts (`facility.contacts`) | Annual test completed; findings tracked (`facility.test.completed`) | Annual (enforced by `facility.test_due_at`) |

**ALERTS/METRICS:** Alert if any separation event has not produced a `facility.badge_deactivated` event within 24 hours. Alert if any facility alarm has not received a `facility.alarm.resolved` event within 4 hours. Target zero unescorted visitor entries in secure zones.

---

## IS-13 — AI Governance & Usage Disclosure {#is-13-ai-governance-usage-disclosure}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires safeguards commensurate with the risk of the technology used. AI tools that process NPI or make member-facing decisions introduce novel risks requiring explicit governance. [15 USC § 6801](https://www.law.cornell.edu/uscode/text/15/6801) (GLBA) reinforces the obligation to protect NPI regardless of the processing technology.

**SYSTEM BEHAVIOR:** Pynthia Credit Union maintains a default pro-AI posture with controls. All AI tools and use cases must be registered in the AI Use Register (`ai_register`) before production use. A Data Protection Impact Assessment (DPIA) is required before any AI tool is deployed in production (`ai.dpia_ref`). Vendor and feature reviews are conducted as part of the vendor diligence process (see [IS-11](#is-11-vendor-information-security-diligence)). Member-facing AI features require a published disclosure (`ai.disclosure_text`, `ai.disclosure_channel`). Uploading NPI to external AI tools not approved through this process is prohibited; violations are treated as DLP incidents under [IS-07](#is-07-data-protection-encryption-disposal). The AI Use Register is updated within 5 business days of tool approval. The `ai_register` is write-restricted to the CCO and Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| AI tool proposed for production use (`ai.tool.proposed`) | Use case (`ai.use_case`), DPIA reference (`ai.dpia_ref`), vendor review (per [IS-11](#is-11-vendor-information-security-diligence)), approval record (`ai.approval_record`) | AI tool approved or rejected (`ai.tool.approved`, `ai.tool.rejected`); AI Use Register updated (`ai.register.updated`) | Register update within 5 business days of approval (enforced by `ai.register_update_due_at`) |
| Member-facing AI feature launched (`ai.member_feature.launched`) | Disclosure text (`ai.disclosure_text`), disclosure channel (`ai.disclosure_channel`) | Member-facing disclosure published (`ai.disclosure.published`) | Before or at launch |
| AI policy violation detected (unauthorized NPI upload) (`ai.violation`) | Violation detail, user identity | Violation disposed and DLP incident opened (`ai.violation.disposed`); treated per [IS-07](#is-07-data-protection-encryption-disposal) | Immediate |

**ALERTS/METRICS:** Alert if any approved AI tool has not produced an `ai.register.updated` event within 5 business days of approval. Alert on any `ai.violation` event not resolved within 1 business day. Track count of AI tools in production without a current DPIA as a KRI; target zero.

---

## IS-14 — Logging, Monitoring & Alerting {#is-14-logging-monitoring-alerting}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(c)](https://www.ecfr.gov/current/title-12/part-748) requires monitoring of information systems to detect actual and attempted attacks. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and the Record Retention Policy's Schedule A govern log retention periods.

**SYSTEM BEHAVIOR:** All security-relevant events are centralized in a SIEM (`siem.source_inventory`). Log sources are time-synchronized; silent sources trigger an alert (`siem.source_silent`). Critical alerts are reviewed daily; the SIEM alert review SLA is enforced by `siem.alert_review_due_at`. Security-relevant logs are retained for a minimum of 12 months, aligned to the Record Retention Policy's Schedule A. The SIEM configuration and alert rules are write-restricted to SecOps; alert dispositions are recorded by the on-call analyst.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical SIEM alert fires (`siem.alert_critical`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`) | Alert reviewed and disposed (`siem.alert.disposed`); if malicious, incident declared per [IS-09](#is-09-incident-declaration-ic-assignment-post-mortem) (`siem.alert_confirmed_malicious`) | Daily review (enforced by `siem.alert_review_due_at`) |
| Log source goes silent (`siem.source_silent`) | Source ID, last-seen timestamp (`siem.last_seen_at`) | Alert fired; source restored or finding opened (`siem.source.restored`) | Immediate detection |
| Log retention expiry reached for security log class | Retention class, retention schedule per Schedule A (`record.retention_class`, `record.retention_expires_at`) | Record disposed per [IS-07](#is-07-data-protection-encryption-disposal) or hold applied (`record.disposed`, `record.hold.applied`) | Per Schedule A (minimum 12 months) |

**ALERTS/METRICS:** Alert if any critical SIEM alert has not received a `siem.alert.disposed` event within 24 hours. Alert on any `siem.source_silent` event not resolved within 4 hours. Track percentage of log sources reporting within the last 24 hours; target 100%.

---

## IS-15 — Acceptable Use & Communications Systems {#is-15-acceptable-use-communications-systems}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(a)](https://www.ecfr.gov/current/title-12/part-748) requires employee training and policies governing the use of information systems. Acceptable use policies are the primary mechanism for establishing user obligations and monitoring notice.

**SYSTEM BEHAVIOR:** The Acceptable Use Policy (AUP) documents permitted use of devices, email, messaging, internet, and removable media. It includes explicit monitoring notice, BYOD enrollment requirements (`byod.enrollment`), and remote-work safeguards (`access.remote_config`). All employees and contractors must acknowledge the AUP before being granted system access; acknowledgment is re-required when the AUP is materially revised. BYOD devices must be enrolled in MDM (`byod.mdm_status`) and encrypted (`byod.encryption_status`) before accessing corporate resources. The AUP is write-restricted to the CCO; acknowledgment records are maintained by HR/IT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire onboarded or AUP materially revised (`employee.hired`, `aup.revised`) | AUP version (`aup.revision_summary`), employee/contractor identity | AUP acknowledged before access granted (`aup.acknowledged`) | Before first system access |
| BYOD enrollment requested (`byod.enrollment.requested`) | Device encryption status (`byod.encryption_status`), MDM enrollment (`byod.mdm_status`) | BYOD enrolled (`byod.enrolled`) | Before device accesses corporate resources |
| AUP materially revised | Revision summary (`aup.revision_summary`) | Re-acknowledgment required from all users (`aup.reacknowledged`) | Within 30 days of revision |

**ALERTS/METRICS:** Alert if any active user account does not have a current AUP acknowledgment on file. Alert if any BYOD device is accessing corporate resources without MDM enrollment. Track AUP acknowledgment completion rate; target 100% before access is granted.

---

## IS-16 — Social Media {#is-16-social-media}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(a)](https://www.ecfr.gov/current/title-12/part-748) requires policies governing employee use of information systems, including social media, to protect member information. Impersonation and scam accounts create direct member harm and reputational risk.

**SYSTEM BEHAVIOR:** Corporate social media posts require pre-approval by the designated approver (`socialmedia.approver`) before publication. Employees making personal posts that reference the credit union must include a disclaimer that views are their own. Disclosure of member information on social media is prohibited; violations are treated as DLP incidents under [IS-07](#is-07-data-protection-encryption-disposal). Scam accounts and impersonation of the credit union must be escalated for takedown the same day they are detected. Evidence of impersonation is preserved (`socialmedia.evidence`) before takedown. The `socialmedia` object is write-restricted to the CCO and designated Communications lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate post drafted (`socialmedia.post.drafted`) | Post content (`socialmedia.post_content`), approver identity (`socialmedia.approver`) | Post approved and published (`socialmedia.post.approved`) | Before publication |
| Impersonation or scam account detected (`socialmedia.impersonation.detected`) | Impersonation detail (`socialmedia.impersonation_detail`), evidence (`socialmedia.evidence`) | Takedown escalated (`socialmedia.takedown.escalated`); takedown tracked to closure | Same day escalation (enforced by `socialmedia.takedown_due_at`) |
| Member-information disclosure detected on social media (`socialmedia.disclosure.detected`) | Disclosure detail, user identity | Disclosure disposed; DLP incident opened per [IS-07](#is-07-data-protection-encryption-disposal) (`socialmedia.disclosure.disposed`) | Immediate |

**ALERTS/METRICS:** Alert if any impersonation detection event has not produced a `socialmedia.takedown.escalated` event within 4 hours. Alert on any unapproved corporate post published without a `socialmedia.post.approved` event. Target zero member-information disclosures on social media.

---

## IS-17 — Training, Awareness & Testing {#is-17-training-awareness-testing}

**WHY (Reg cite):** [12 CFR Part 748, Appendix A §II(a)](https://www.ecfr.gov/current/title-12/part-748) requires employee training as a component of the information security program. [12 CFR Part 717, Subpart J](https://www.ecfr.gov/current/title-12/part-717) requires staff training to implement the identity-theft prevention program.

**SYSTEM BEHAVIOR:** All employees receive role-based security training. New hires must complete initial security training within 30 days of hire. Annual refresher training is required for all staff. High-risk roles (e.g., system administrators, finance, member-facing staff) receive additional deep-dive modules. Quarterly phishing simulations are conducted; results are recorded and employees who repeatedly fail are assigned mandatory re-training. Training completion is tracked per employee; lapsed training triggers an alert. The training curriculum is write-restricted to the CCO and Information Security/IT lead; completion records are maintained by HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired (`employee.hired`) | Hire date (`training.hire_date`), role (`user.role`), required curriculum (`training.required_curriculum`) | New-hire security training assigned and completed (`training.assignment.created`, `training.onboarding.completed`) | 30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opens (`training.annual_cycle.opened`) | Role matrix (`training.role_matrix`), curriculum version (`training.content_version`) | Annual refresher training completed (`training.refresher.completed`) | Annual (enforced by `training.annual_due_at`) |
| Quarterly phishing simulation cycle opens | Simulation scenario (`phishing.scenario`), target population | Phishing simulation launched and results recorded (`phishing.simulation.launched`, `phishing.results.recorded`) | Quarterly |
| Repeated phishing simulation failure detected (`phishing.repeat_failure`) | Failure history (`phishing.failure_history`), employee identity | Remedial training assigned and completed (`training.remedial.assigned`, `training.remedial.completed`) | Within 5 business days of failure detection |

**ALERTS/METRICS:** Alert if any new hire has not completed security training within 30 days. Alert if annual training completion falls below 100% by the cycle deadline. Alert if quarterly phishing simulation has not been launched within the scheduled window. Track repeat-failure rate as a KRI; target downward trend quarter-over-quarter.

---

## IS-18 — Records Management & Retention {#is-18-records-management-retention}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and its Appendix B require credit unions to maintain vital records and follow a records-preservation program. The Record Retention Policy's Schedule A governs retention periods for all record classes; this control applies those periods to security-specific record classes.

**SYSTEM BEHAVIOR:** The following security-specific record classes are subject to Schedule A retention periods: SIEM and audit logs, incident-response records, vulnerability findings and POA&Ms, access-review evidence, AI-use registry entries, and physical security logs. Retention clocks are set at record creation (`record.retention_clock_set`). The monthly destruction queue processes all records that have reached their Schedule A eligibility date and are not subject to a legal hold. Legal holds are governed by the Record Retention Policy's legal-hold process (`legal_hold`); when a hold is placed, the disposal clock is suspended (`disposal.held`). Data disposal must align with [IS-07](#is-07-data-protection-encryption-disposal) — data is rendered unreadable within 30 days of eligibility. Destruction is logged with a certificate (`destruction_log.entry_id`). The destruction queue is write-restricted to the CCO and Records Manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security record created (any security-specific class) | Record class (`record.retention_class`), retention schedule from Schedule A (`record.retention_schedule`), anchor date (`record.retention_anchor`) | Retention clock set (`record.retention_clock_set`); retention timer started (`record.retention.started`) | At record creation |
| Monthly destruction queue cycle opens | Records with `record.disposal_eligible` = true, no active legal hold (`record.legal_hold_flag` = false) | Destruction executed; certificate recorded (`record.destroyed`, `destruction_log.entry.created`) | Monthly (unless legal hold in effect) |
| Legal hold placed on security records (`legal_hold.created`) | Hold scope (`legal_hold.hold_scope`), matter reference (`legal_hold.matter_ref`) | Disposal clock suspended; hold applied to affected records (`record.hold.applied`) | Immediately on hold placement |
| Legal hold released (`legal_hold.clear.confirmed`) | Release authorization (`legal_hold.release_approved_by`) | Disposal clock resumed; records re-enter destruction queue (`disposal.clock_resumed`) | Immediately on release |

**ALERTS/METRICS:** Alert if any security record has reached its Schedule A eligibility date and has not been processed by the monthly destruction queue within 35 days (5-day grace). Alert if any destruction log entry has a mismatch (`destruction_log.mismatch`). Target zero security records retained beyond their Schedule A period absent a legal hold.

---

## Governance & Sign-Off {#governance}

| Role | Name | Responsibility |
|---|---|---|
| Policy Owner | Patrick Wilson, Chief Compliance Officer | Maintains policy, approves exceptions, chairs quarterly KPI review |
| Information Security/IT Lead | TBD | Implements controls, maintains CMDB, manages SecOps |
| Engineering/SecOps | TBD | Implements technical controls, evidences through audit logs |
| Risk | TBD | Maintains enterprise risk register; receives InfoSec risk inputs |
| Privacy | TBD | Coordinates on NPI classification and disposal |
| HR | TBD | Triggers joiner/mover/leaver events; maintains training records |
| Facilities | TBD | Manages physical access controls and badge lifecycle |
| Board/Supervisory Committee | TBD | Annual policy approval; quarterly KPI oversight |

**Review cadence:** Annual policy review and board approval; triggered review on material regulatory change, significant incident, or material change to the credit union's technology environment.

**Cross-references:**
- Enterprise Risk Management Policy — risk appetite, taxonomy, scoring methodology, and enterprise risk register
- Third-Party Risk Policy — vendor onboarding, oversight program mechanics, and monitoring cadences
- Record Retention Policy — Schedule A retention periods and legal-hold process
- Business Continuity Plan Policy — detailed BCP and recovery procedures
- Privacy Policy — privacy notices and member privacy rights
- E-Commerce Policy — consumer-facing online/mobile banking channel governance
- Electronic Payment Systems Policy — payment-rail controls
- BSA/AML Policy — SAR referral process for red-flag cases

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced throughout this document — including security-program-specific fields such as `security.program_charter`, `security.kpi_snapshot`, `security.board_report_due_at`, and `disposal.clock_resumed` — are not yet confirmed as registered in `core-vocabulary.json`. The registered objects `security`, `asset`, `vuln`, `pentest`, `change`, `access`, `siem`, `backup`, `dr`, `redflag`, `ai`, `ai_register`, `byod`, `aup`, `socialmedia`, `phishing`, `training`, `facility`, `vendor`, `incident`, `record`, `disposal`, `dlp`, `tls`, `crypto`, and `finding` are registered; their specific fields cited here follow the composition grammar and are the target naming scheme. Engineering must confirm or adjust all codes before the next review cycle.

- **Provisional codes used from the agreed migration map.** The following provisional codes from DESIGN_NOTES were used verbatim: `security_finding.description`, `security_finding.due_at`, `security_finding.owner`, `security_finding.severity`, `disposal.due_at`, `crypto.config`. These must be registered before production deployment.

- **Information Security/IT Lead identity.** PATRICK_NOTES reference the "Information Security/IT lead" as a required participant but do not name the individual or confirm whether this is a dedicated CISO role or a combined IT/Security function. The Governance table marks this as TBD; the CCO should confirm the designation before the policy is effective.

- **Board/Supervisory Committee composition.** The policy assumes the Board of Directors or its Supervisory Committee serves as the approving body for the annual policy and quarterly KPI reports. If Pynthia Credit Union uses a delegated committee structure, the specific committee name and quorum requirements should be confirmed and added to the Governance section.

- **HMDA reporter status.** This policy does not address HMDA/Reg C obligations. If Pynthia Credit Union is a HMDA reporter, the HMDA LAR and submission records should be added to the Schedule A record classes in IS-18.

- **ERM tiered reassessment cadence alignment.** IS-02 adopts the reassessment cadence described in PATRICK_NOTES (High/Very High quarterly, Moderate annually, Low/Very Low every two years). This must be confirmed as identical to the cadence defined in the Enterprise Risk Management Policy; any divergence should be resolved in favor of the ERM Policy.

- **Vendor breach-notice window — 24-hour standard.** IS-11 adopts a 24-hour vendor-to-institution breach notification window as stated in PATRICK_NOTES, described as aligned to the Third-Party Risk Policy standard. This should be confirmed against the Third-Party Risk Policy's contractual clause library before contracts are executed.

- **AI DPIA requirement — regulatory basis.** The DPIA requirement in IS-13 is a risk-management best practice (NIST CSF 2.0 GV.OC-05) rather than a specific NCUA regulatory mandate. If Pynthia Credit Union operates in a state with AI-specific privacy or impact-assessment requirements, the Privacy Policy owner should confirm whether additional regulatory citations are needed.

- **Physical security — ADA citation scope.** The ADA citation in IS-12 (28 CFR Part 36) is included as a supporting authority for accessible facility design in visitor-control contexts. It does not impose information-security obligations directly; its inclusion should be confirmed with Legal as appropriate for the credit union's facility types.

- **NIST SP 800-53 Rev. 5 and NIST CSF 2.0.** These frameworks are referenced in AUTHORITY_HINTS as non-regulatory. They inform control design but are not cited as binding authority in any WHY field. Engineering may use them as implementation guidance without creating additional compliance obligations.
```
