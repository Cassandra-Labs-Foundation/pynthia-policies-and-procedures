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

Pynthia Credit Union maintains a board-governed, risk-based information security program that safeguards member and organizational information and preserves its confidentiality, integrity, availability, and resilience, as required by [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and the safeguards principle of [GLBA, 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801). The program covers people, facilities, data, systems, networks, vendors, AI tools, and member-facing channels; engineering and operations implement each control below and evidence it through audit logs and periodic testing. Consumer-facing online/mobile banking governance, payment rails, marketing compliance, enterprise risk methodology, vendor-program mechanics beyond security diligence, detailed business continuity planning, and privacy notices are governed by their respective sibling policies and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly KPI report to Board/Supervisory Committee | Calendar quarter closes (`security.quarter_closed`) | 30 days post-quarter | Program KPIs, incidents, risk posture | [IS-01](#is-01-governance-oversight) |
| Annual policy approval | Annual review cycle opens (`security.policy_review_opened`) | 12 months from last approval | This policy, program charter | [IS-01](#is-01-governance-oversight) |
| Enterprise risk assessment refresh | Assessment anniversary reached (`risk.assessment_due`) | Every 12 months | Risk register, POA&M | [IS-02](#is-02-enterprise-risk-assessment) |
| New-product lightweight risk assessment | New product/service approved for build (`product.initiated`) | 10 business days | Lightweight risk assessment | [IS-02](#is-02-enterprise-risk-assessment) |
| Asset inventory delta posted | Asset added/changed/retired (`asset.changed`) | 5 business days | CMDB record with classification | [IS-03](#is-03-asset-inventory-classification) |
| CAB review of medium/high-risk change | RFC submitted (`change.rfc_submitted`) | 3 business days | RFC with risk, test evidence, backout | [IS-04](#is-04-change-management-configuration-control) |
| Emergency change post-review | Emergency change deployed (`change.emergency_deployed`) | 24 hours | Post-implementation review record | [IS-04](#is-04-change-management-configuration-control) |
| High-risk vulnerability triage | Scan/pen-test finding logged (`vuln.finding_created`) | 5 business days | Triage decision, POA&M entry | [IS-05](#is-05-vulnerability-penetration-testing) |
| Critical vulnerability patched | Critical finding confirmed (`vuln.finding_confirmed`) | 7 days | Patch/remediation evidence | [IS-05](#is-05-vulnerability-penetration-testing) |
| High vulnerability patched | High finding confirmed (`vuln.finding_confirmed`) | 15 days | Patch/remediation evidence | [IS-05](#is-05-vulnerability-penetration-testing) |
| Medium vulnerability patched | Medium finding confirmed (`vuln.finding_confirmed`) | 30 days | Patch/remediation evidence | [IS-05](#is-05-vulnerability-penetration-testing) |
| Access deprovisioned on termination | HR records separation (`employee.separated`) | Same business day | Deprovisioning confirmation | [IS-06](#is-06-access-control-authentication) |
| Quarterly access review | Quarter closes (`security.quarter_closed`) | End of following month | Access recertification records | [IS-06](#is-06-access-control-authentication) |
| Data disposal completed | Record reaches disposal eligibility (`record.disposal_eligible`) | 30 days (unless legal hold) | Disposal certificate | [IS-07](#is-07-data-protection-encryption-disposal) |
| Backup restore verification | Weekly verification cycle (`backup.verify_due`) | Weekly | Restore-test evidence | [IS-08](#is-08-backup-disaster-recovery) |
| Annual DR exercise | Annual schedule (`dr.exercise_due`) | 12 months | DR exercise report | [IS-08](#is-08-backup-disaster-recovery) |
| NCUA cyber incident notification | Reportable incident determined (`incident.reportable_determined`) | 72 hours | NCUA notification per §748.1(c) | [IS-09](#is-09-incident-response-cyber-incident-reporting) |
| Member breach notice | Misuse of member information determined likely (`incident.member_notice_required`) | Without unreasonable delay | Member notice per Appendix B | [IS-09](#is-09-incident-response-cyber-incident-reporting) |
| Red-flag case review | Red flag detected (`redflag.detected`) | Same day | Red-flag case disposition | [IS-10](#is-10-identity-theft-red-flags-program) |
| High-risk vendor security review | Vendor review anniversary (`vendor.review_due`) | Annually | Updated due-diligence file | [IS-11](#is-11-vendor-risk-management) |
| Badge deactivation on separation | HR records separation (`employee.separated`) | 24 hours | Badge deactivation log | [IS-12](#is-12-physical-security-facilities) |
| AI Use Register update | AI tool/feature approved (`ai.tool_approved`) | 5 days | Register entry with DPIA reference | [IS-13](#is-13-ai-governance-usage-disclosure) |
| Critical security alert review | SIEM critical alert raised (`siem.alert_critical`) | Daily review | Alert disposition record | [IS-14](#is-14-logging-monitoring-alerting) |
| Acceptable-use acknowledgment | Access requested for new user (`user.access_requested`) | Before access granted | Signed acknowledgment | [IS-15](#is-15-acceptable-use-communications-systems) |
| Impersonation/scam takedown escalation | Impersonation detected (`socialmedia.impersonation_detected`) | Same day | Takedown escalation record | [IS-16](#is-16-social-media) |
| New-hire security training | Hire start date (`employee.hired`) | 30 days | Training completion record | [IS-17](#is-17-training-awareness-testing) |
| Destruction queue processed | Monthly destruction cycle (`record.destruction_cycle`) | Monthly | Destruction log (holds excluded) | [IS-18](#is-18-records-management-retention) |

## IS-01 — Governance & Oversight

**WHY (Reg cite):** [12 CFR §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0) requires a written, board-approved security program, and [Part 748 Appendix A §III.A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires board involvement in approving and overseeing the information security program, consistent with [GLBA, 15 USC §6801(b)](https://www.law.cornell.edu/uscode/text/15/6801).

**SYSTEM BEHAVIOR:** The CCO maintains a single authoritative Security Program record containing the program charter, control owners, KPIs, and review cadence. The Board/Supervisory Committee approves this policy annually and receives a quarterly KPI report within 30 days of quarter close covering control health, incidents, risk posture, and vendor status. Material program changes between cycles require Board notification at the next scheduled meeting. The Security Program record is write-restricted to the CCO and the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Calendar quarter closes (`security.quarter_closed`) | Control KPIs (`security.kpi_snapshot`), incident summary (`incident.quarterly_summary`), POA&M status (`risk.poam_status`) | Quarterly Board KPI report (`security.board_report_issued`) | 30 days post-quarter (enforced by `security.board_report_due_at`) |
| Annual review cycle opens (`security.policy_review_opened`) | Current policy text, change log (`security.policy_change_log`), program charter (`security.program_charter`) | Board-approved policy version (`security.policy_approved`) | 12 months from prior approval (enforced by `security.policy_review_due_at`) |

**ALERTS/METRICS:** Aging alert when a quarterly report is unissued at day 25 post-quarter; target zero late Board reports and zero quarters without a recorded approval or KPI delivery.

## IS-02 — Enterprise Risk Assessment

**WHY (Reg cite):** [Part 748 Appendix A §III.B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires identification and assessment of reasonably foreseeable internal and external threats to member information, with reassessment as circumstances change.

**SYSTEM BEHAVIOR:** Risk maintains a risk register mapping assets, threats, vulnerabilities, and mitigating controls, explicitly covering fraud, social engineering, identity theft, and AI risks. A full enterprise assessment runs at least every 12 months; the Plan of Action & Milestones (POA&M) is updated monthly with remediation status. New products or services receive a lightweight risk assessment within 10 business days of initiation, before launch approval. Enterprise risk appetite and scoring methodology come from the Enterprise Risk Management Policy. The risk register is write-restricted to Risk and the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Assessment anniversary reached (`risk.assessment_due`) | Asset inventory (`asset.cmdb_snapshot`), threat catalog (`risk.threat_catalog`), prior findings (`risk.poam_status`) | Refreshed risk assessment and register (`risk.assessment_completed`) | 12 months (enforced by `risk.assessment_due_at`) |
| Monthly POA&M cycle (`risk.poam_cycle`) | Open findings (`risk.poam_items[]`), remediation evidence (`risk.remediation_evidence`) | Updated POA&M (`risk.poam_updated`) | Monthly (internal: by 10th of month) |
| New product/service initiated (`product.initiated`) | Product description (`product.description`), data flows (`product.data_flows`), vendor dependencies (`product.vendors[]`) | Lightweight risk assessment (`risk.product_assessment_completed`) | 10 business days (enforced by `risk.product_assessment_due_at`) |

**ALERTS/METRICS:** Alert when the annual assessment ages past 11 months without a refresh in progress; monthly POA&M update completion rate (target 100%); count of products launched without a completed lightweight assessment (target zero).

## IS-03 — Asset Inventory & Classification

**WHY (Reg cite):** [Part 748 Appendix A §III.B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires identifying where member information is stored, transmitted, and processed — which presupposes a complete inventory of systems and data stores handling nonpublic personal information under [GLBA, 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801).

**SYSTEM BEHAVIOR:** The Information Security/IT lead maintains a configuration management database (CMDB) covering hardware, software, data stores, and vendor-hosted systems, each tagged with an owner and a data classification of Public, Internal, or Confidential-NPI. Inventory deltas (additions, changes, retirements) are posted within 5 business days of the change, and asset owners attest to inventory accuracy quarterly. Confidential-NPI classification drives encryption, DLP, retention, and disposal handling in [IS-07](#is-07-data-protection-encryption-disposal). CMDB write access is restricted to IT asset administrators; classification changes for Confidential-NPI require Compliance concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Asset added, changed, or retired (`asset.changed`) | Asset attributes (`asset.attributes`), owner (`asset.owner`), classification (`asset.classification`) | Updated CMDB record (`asset.cmdb_updated`) | 5 business days (enforced by `asset.cmdb_update_due_at`) |
| Quarter closes (`security.quarter_closed`) | Current CMDB extract (`asset.cmdb_snapshot`), owner roster (`asset.owner_roster`) | Owner attestations (`asset.attestation_completed`) | End of following month (internal SLA) |

**ALERTS/METRICS:** Discovery-scan vs. CMDB drift count (unregistered assets, target zero); percentage of assets with classification assigned (target 100%); quarterly attestation completion rate.

## IS-04 — Change Management & Configuration Control

**WHY (Reg cite):** [Part 748 Appendix A §III.C.1](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires policies and procedures designed to control identified risks, including secure configuration and controlled modification of systems handling member information.

**SYSTEM BEHAVIOR:** All production changes flow through a Request for Change (RFC) workflow capturing risk rating, test evidence, backout plan, and approver. Medium and high-risk changes require Change Advisory Board (CAB) review within 3 business days of submission before deployment; low-risk standard changes may be pre-approved by category. Emergency changes may deploy ahead of review but require documented post-implementation review within 24 hours. Configuration baselines for critical systems are version-controlled, and unauthorized drift detected by monitoring is treated as a security event under [IS-14](#is-14-logging-monitoring-alerting). RFC approval authority is restricted to CAB members; emergency-change authorization is restricted to the Information Security/IT lead or designated on-call manager.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| RFC submitted for medium/high-risk change (`change.rfc_submitted`) | Risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision (`change.cab_decision_recorded`) | 3 business days (enforced by `change.cab_review_due_at`) |
| Emergency change deployed (`change.emergency_deployed`) | Deployment record (`change.deployment_record`), justification (`change.emergency_justification`) | Post-implementation review (`change.post_review_completed`) | 24 hours (enforced by `change.post_review_due_at`) |
| Configuration drift detected (`config.drift_detected`) | Baseline reference (`config.baseline_id`), drift detail (`config.drift_detail`) | Drift investigation record (`config.drift_resolved`) | Internal: 5 business days |

**ALERTS/METRICS:** CAB review latency distribution (target ≤3 BD); count of emergency changes lacking 24-hour post-review (target zero); unauthorized-change/drift incidents per quarter.

## IS-05 — Vulnerability & Penetration Testing

**WHY (Reg cite):** [Part 748 Appendix A §III.C.3](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires regular testing of key controls, systems, and procedures, with tests conducted or reviewed by independent parties.

**SYSTEM BEHAVIOR:** Automated vulnerability scans run on a defined schedule across internal and external surfaces, and an independent external penetration test runs at least annually. High-risk findings are triaged within 5 business days. Remediation deadlines by severity: Critical within 7 days, High within 15 days, Medium within 30 days. All findings are tracked to closure in the POA&M maintained under [IS-02](#is-02-enterprise-risk-assessment); deadline exceptions require a documented risk acceptance from the Information Security/IT lead with Compliance concurrence. Scan configuration and finding-severity overrides are write-restricted to SecOps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scan or pen-test finding logged (`vuln.finding_created`) | Affected asset (`asset.attributes`), severity (`vuln.severity`), exploitability detail (`vuln.detail`) | Triage decision and POA&M entry (`vuln.triage_completed`) | 5 business days for high-risk (enforced by `vuln.triage_due_at`) |
| Critical finding confirmed (`vuln.finding_confirmed`) | Patch/mitigation plan (`vuln.remediation_plan`), change record (`change.rfc_submitted`) | Remediation evidence (`vuln.remediated`) | 7 days (enforced by `vuln.remediation_due_at`) |
| High finding confirmed (`vuln.finding_confirmed`) | Patch/mitigation plan (`vuln.remediation_plan`) | Remediation evidence (`vuln.remediated`) | 15 days (enforced by `vuln.remediation_due_at`) |
| Medium finding confirmed (`vuln.finding_confirmed`) | Patch/mitigation plan (`vuln.remediation_plan`) | Remediation evidence (`vuln.remediated`) | 30 days (enforced by `vuln.remediation_due_at`) |
| Annual pen-test scheduled (`pentest.scheduled`) | Scope definition (`pentest.scope`), tester independence attestation (`pentest.independence`) | Pen-test report and findings (`pentest.report_issued`) | 12 months from prior test |

**ALERTS/METRICS:** Open Critical/High findings past deadline (target zero); mean time to remediate by severity; scan coverage percentage of CMDB assets; days since last external pen-test.

## IS-06 — Access Control & Authentication

**WHY (Reg cite):** [Part 748 Appendix A §III.C.1.a](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls on member information systems, including authentication and authorization limited to authorized individuals, consistent with [GLBA, 15 USC §6801(b)(1)](https://www.law.cornell.edu/uscode/text/15/6801).

**SYSTEM BEHAVIOR:** All workforce access to systems handling Internal or Confidential-NPI data goes through SSO with MFA enforced. Access is role-based and least-privilege, provisioned through joiner/mover/leaver automation driven by HR records: movers are re-profiled to the new role's entitlements, and leavers are deprovisioned the same business day as termination. Quarterly access reviews recertify all privileged and Confidential-NPI entitlements. Break-glass accounts are sealed, time-boxed, and heavily logged — every use generates an alert and a post-use review. Shared accounts are prohibited except documented service accounts with owner and rotation schedule. Entitlement-grant authority is restricted to system owners; privileged-role grants additionally require Information Security/IT lead approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire or role change recorded (`employee.hired` / `employee.role_changed`) | HR role record (`employee.role`), role-entitlement map (`access.role_entitlements`) | Provisioned/adjusted access (`access.provisioned`) | Internal: 2 business days |
| Separation recorded (`employee.separated`) | Identity (`employee.id`), entitlement inventory (`access.entitlements[]`) | Full deprovisioning confirmation (`access.deprovisioned`) | Same business day (enforced by `access.deprovision_due_at`) |
| Quarter closes (`security.quarter_closed`) | Entitlement extract (`access.entitlements[]`), reviewer roster (`access.reviewer_roster`) | Recertification decisions (`access.review_completed`) | End of following month (internal SLA) |
| Break-glass account used (`access.breakglass_used`) | Account ID (`access.breakglass_id`), justification (`access.breakglass_justification`) | Post-use review record (`access.breakglass_reviewed`) | Internal: 1 business day |

**ALERTS/METRICS:** Real-time alert on every break-glass use; count of accounts active past separation date (target zero); MFA coverage percentage (target 100%); quarterly review completion rate and revocation counts.

## IS-07 — Data Protection, Encryption & Disposal

**WHY (Reg cite):** [Part 748 Appendix A §III.C.1.c](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires encryption of member information where appropriate, and the [FACTA Disposal Rule, 16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) requires reasonable measures to render consumer information unreadable on disposal.

**SYSTEM BEHAVIOR:** Confidential-NPI data is encrypted in transit (TLS 1.2 or higher) and at rest (AES-256 or equivalent approved cryptography); key management follows documented rotation and custody procedures. DLP controls block unapproved exfiltration of Confidential-NPI via email, web upload, and removable media. On disposal eligibility, data and media are rendered unreadable (cryptographic erasure, wiping, or physical destruction) within 30 days — unless the record is under a litigation hold per [IS-18](#is-18-records-management-retention), in which case disposal is suspended until the hold lifts. Crypto-standard approval and key-custody changes are write-restricted to the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Confidential-NPI data store provisioned (`asset.changed`) | Classification (`asset.classification`), crypto configuration (`crypto.config`) | Encryption verification record (`crypto.verified`) | Internal: before production use |
| DLP policy violation detected (`dlp.violation_detected`) | Channel and payload metadata (`dlp.violation_detail`), user identity (`employee.id`) | Blocked transfer + investigation record (`dlp.violation_resolved`) | Internal: 2 business days to disposition |
| Record/media reaches disposal eligibility (`record.disposal_eligible`) | Record class (`record.class`), hold status (`record.hold_status`), media type (`asset.media_type`) | Disposal certificate (`record.disposed`) | 30 days unless on hold (enforced by `record.disposal_due_at`) |

**ALERTS/METRICS:** Count of Confidential-NPI stores without verified encryption (target zero); DLP violations per month with disposition latency; disposal-queue items past 30 days not on hold (target zero).

## IS-08 — Backup & Disaster Recovery

**WHY (Reg cite):** [Part 748 Appendix A §III.C.1.h](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires measures to protect against destruction, loss, or damage of member information due to environmental hazards or technological failures; [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires preservation of vital records.

**SYSTEM BEHAVIOR:** Each production system has a documented RTO and RPO, and backup schedules are derived from them. Backups are stored offsite and at least one copy is immutable to defeat ransomware encryption of backup sets. Restore verification runs weekly against a sample of critical systems, and a full disaster-recovery exercise runs annually, including ransomware isolation and clean-room restore procedures. Detailed business continuity planning (people, facilities, communications) lives in the Business Continuity Plan Policy. Backup configuration and immutability settings are write-restricted to SecOps with two-person change approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Weekly verification cycle (`backup.verify_due`) | Backup catalog (`backup.catalog`), sample selection (`backup.sample[]`) | Restore-test evidence (`backup.restore_verified`) | Weekly (enforced by `backup.verify_due_at`) |
| Annual DR exercise scheduled (`dr.exercise_due`) | DR plan (`dr.plan`), system RTO/RPO matrix (`dr.rto_rpo_matrix`) | DR exercise report with gaps (`dr.exercise_completed`) | 12 months (enforced by `dr.exercise_due_at`) |
| Backup job fails (`backup.job_failed`) | Job detail (`backup.job_detail`), affected system (`asset.attributes`) | Remediated backup run (`backup.job_remediated`) | Internal: next business day |

**ALERTS/METRICS:** Alert on any backup-job failure and on missed weekly restore verification; restore-success rate (target 100%); RTO/RPO attainment measured in the annual exercise vs. documented targets.

## IS-09 — Incident Response & Cyber Incident Reporting

**WHY (Reg cite):** [12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1) requires notifying the NCUA within 72 hours of reasonably believing a reportable cyber incident occurred, and [Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) requires a response program with member notice when misuse of member information has occurred or is reasonably possible.

**SYSTEM BEHAVIOR:** The credit union maintains an incident response plan, an on-call roster, and scenario playbooks (ransomware, account takeover, data exfiltration, vendor breach). Detected incidents are classified by severity; when the IR lead and CCO determine an incident is reportable under §748.1(c), the 72-hour NCUA notification clock starts at that determination. Member notice issues without unreasonable delay per Appendix B once misuse of sensitive member information is determined to have occurred or be reasonably possible; notice may be briefly delayed at the written request of law enforcement. The credit union coordinates with law enforcement and preserves forensic evidence — affected systems are isolated, not wiped. Reportability determinations are restricted to the IR lead and CCO jointly.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Security incident declared (`incident.declared`) | Detection detail (`incident.detail`), severity classification (`incident.severity`), affected assets (`asset.attributes`) | Incident record and IR activation (`incident.response_activated`) | Internal: immediate on declaration |
| Reportable incident determined (`incident.reportable_determined`) | Incident facts (`incident.detail`), determination rationale (`incident.reportability_rationale`) | NCUA notification (`incident.ncua_notified`) | 72 hours (enforced by `incident.ncua_notice_due_at`) |
| Member misuse determined likely (`incident.member_notice_required`) | Affected member population (`incident.affected_members[]`), notice content (`incident.notice_content`) | Member breach notice issued (`incident.member_notified`) | Without unreasonable delay (internal: 10 business days absent law-enforcement delay) |
| Incident closed (`incident.closed`) | Root cause (`incident.root_cause`), remediation actions (`incident.remediation_actions[]`) | Post-incident review report (`incident.postmortem_completed`) | Internal: 15 business days after closure |

**ALERTS/METRICS:** Elapsed-time tracker from reportability determination to NCUA notice (target well under 72 hours, alert at 48); count of incidents lacking a post-incident review (target zero); mean time to detect and contain by severity.

## IS-10 — Identity Theft Red Flags Program

**WHY (Reg cite):** [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717/subpart-J) requires a written Identity Theft Prevention Program that identifies, detects, and responds to red flags for covered accounts and is periodically updated.

**SYSTEM BEHAVIOR:** Compliance maintains a red-flag matrix derived from Appendix J categories (suspicious documents, suspicious identifying information, alerts from consumer reporting agencies, unusual account activity, and notices from members or law enforcement), mapped to step-up verification requirements and account-hold actions. Detected red flags trigger same-day case review with documented disposition; confirmed identity theft escalates to SAR referral under the BSA program where applicable. Address changes followed within 30 days by a card or credential reissue request require out-of-band member verification before fulfillment. The ruleset is reviewed quarterly and updated for new fraud patterns, account types, and service-provider arrangements; the annual program report rolls into the Board reporting in [IS-01](#is-01-governance-oversight). Red-flag matrix changes are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Red flag detected on account opening or activity (`redflag.detected`) | Member identity (`entity_id`), verification result (`verification.status`, `provider_result.risk_signals[]`), flag type (`redflag.type`) | Case disposition with response action (`redflag.case_disposed`) | Same day (enforced by `redflag.review_due_at`) |
| Step-up verification required (`redflag.stepup_required`) | Additional ID evidence (`verification.provider_result`), account hold status (`account.lock_type`) | Verification outcome + hold release or escalation (`redflag.stepup_completed`) | Internal: 2 business days |
| Address change + reissue request within 30 days (`redflag.address_reissue_match`) | Address-change record (`entity.address_change`), reissue request (`card.reissue_request`) | Out-of-band verification record (`redflag.reissue_verified`) | Before fulfillment |
| Quarterly ruleset cycle (`security.quarter_closed`) | Case statistics (`redflag.case_stats`), new fraud patterns (`redflag.pattern_updates`) | Updated red-flag matrix (`redflag.ruleset_updated`) | Quarterly (internal SLA) |

**ALERTS/METRICS:** Red-flag cases open past same-day review (target zero); confirmed-identity-theft count and SAR referral rate; reissue requests fulfilled without out-of-band verification (target zero).

## IS-11 — Vendor Risk Management

**WHY (Reg cite):** [Part 748 Appendix A §III.D](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires due diligence in selecting service providers, contractual security requirements, and monitoring of providers that access member information, consistent with [GLBA, 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801).

**SYSTEM BEHAVIOR:** Before any vendor receives access to Confidential-NPI or connects to credit union systems, security due diligence is completed (security questionnaire, privacy review, SOC 2 or equivalent report review). Contracts must include breach-notification windows, data disposition on termination, and right-to-audit clauses. High-risk vendors (those holding NPI or with privileged system access) are re-reviewed annually; lower tiers per the Third-Party Risk Policy, which governs broader onboarding mechanics beyond security diligence. Vendor breach notices received are routed into [IS-09](#is-09-incident-response-cyber-incident-reporting). Vendor security-tier assignments are write-restricted to the Information Security/IT lead with Risk concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New vendor with NPI/system access proposed (`vendor.proposed`) | Security questionnaire (`vendor.security_questionnaire`), SOC report (`vendor.soc_report`), contract terms (`vendor.contract_terms`) | Due-diligence approval or rejection (`vendor.diligence_completed`) | Before access or data sharing |
| High-risk vendor review anniversary (`vendor.review_due`) | Updated SOC report (`vendor.soc_report`), incident history (`vendor.incident_history`) | Refreshed due-diligence file (`vendor.review_completed`) | Annually (enforced by `vendor.review_due_at`) |
| Vendor breach notice received (`vendor.breach_notified`) | Breach detail (`vendor.breach_detail`), affected data scope (`vendor.affected_scope`) | Incident declaration handoff (`incident.declared`) | Internal: same business day |

**ALERTS/METRICS:** High-risk vendors past annual review date (target zero); vendors with NPI access lacking completed diligence (target zero); vendor breach notices received vs. contractual notice windows met.

## IS-12 — Physical Security & Facilities

**WHY (Reg cite):** [12 CFR §748.0(b)](https://www.ecfr.gov/current/title-12/part-748/section-748.0) requires a security program to protect offices and assist in the identification of persons committing crimes, and [Part 748 Appendix A §III.C.1.b](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires physical access restrictions on member information; [ADA, 28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) is a supporting authority for accessible facility and visitor controls.

**SYSTEM BEHAVIOR:** Facilities enforces badge-based access control with zone restrictions; server rooms and media storage are secure areas limited to authorized personnel with access logged. Visitors are registered, escorted, and logged; CCTV and alarm systems are monitored, with footage retained per the records schedule in [IS-18](#is-18-records-management-retention). Badges of separated personnel are deactivated within 24 hours of separation (logical access is same-day under [IS-06](#is-06-access-control-authentication)). Physical access-control administration is restricted to Facilities with HR-feed automation; secure-area access lists are approved by the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Separation recorded (`employee.separated`) | Badge ID (`facility.badge_id`), access zones (`facility.access_zones[]`) | Badge deactivation log (`facility.badge_deactivated`) | 24 hours (enforced by `facility.badge_deactivation_due_at`) |
| Visitor arrives (`facility.visitor_arrived`) | Visitor identity (`facility.visitor_identity`), host (`employee.id`), purpose (`facility.visit_purpose`) | Visitor log entry + escort assignment (`facility.visitor_logged`) | At entry |
| Secure-area access granted (`facility.secure_access_granted`) | Authorization approval (`facility.access_approval`), badge ID (`facility.badge_id`) | Access-list update (`facility.access_list_updated`) | Internal: before first entry |
| Alarm or after-hours anomaly (`facility.alarm_triggered`) | Zone (`facility.zone`), CCTV reference (`facility.cctv_ref`) | Response disposition record (`facility.alarm_resolved`) | Internal: same day |

**ALERTS/METRICS:** Badges active past 24 hours post-separation (target zero); unescorted-visitor exceptions per quarter (target zero); secure-area access-list review completion in the quarterly access review.

## IS-13 — AI Governance & Usage Disclosure

**WHY (Reg cite):** [Part 748 Appendix A §III.B–C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires assessing and controlling risks from new technologies that access member information, and [GLBA, 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) prohibits uncontrolled disclosure of nonpublic personal information — including to external AI services.

**SYSTEM BEHAVIOR:** The credit union maintains a default pro-AI posture: AI tools are encouraged where they are approved and controlled. Every AI tool or AI-powered feature is recorded in an AI Use Register before use; production deployments touching member data require a completed data protection impact assessment (DPIA) and vendor/feature security review under [IS-11](#is-11-vendor-risk-management). Member-facing AI interactions carry a usage disclosure. Uploading NPI to unapproved external AI services is prohibited and enforced via DLP under [IS-07](#is-07-data-protection-encryption-disposal). The register is updated within 5 days of each approval. Register write access and AI approvals are restricted to the CCO and Information Security/IT lead jointly.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| AI tool or feature proposed (`ai.tool_proposed`) | Use-case description (`ai.use_case`), data classes touched (`ai.data_classes[]`), vendor review (`vendor.diligence_completed`) | Approval decision with DPIA reference (`ai.tool_approved` / `ai.tool_rejected`) | Internal: 10 business days |
| AI tool approved (`ai.tool_approved`) | Approval record (`ai.approval_record`), DPIA (`ai.dpia_ref`) | AI Use Register entry (`ai.register_updated`) | 5 days (enforced by `ai.register_update_due_at`) |
| Member-facing AI feature launched (`ai.member_feature_launched`) | Disclosure text (`ai.disclosure_text`), channel placement (`ai.disclosure_channel`) | Published disclosure record (`ai.disclosure_published`) | At launch |
| Unapproved NPI upload to external AI blocked (`dlp.violation_detected`) | Tool destination (`dlp.violation_detail`), user (`employee.id`) | Violation case + retraining referral (`ai.violation_disposed`) | Internal: 2 business days |

**ALERTS/METRICS:** AI tools in production absent a register entry or DPIA (target zero); register-update latency vs. 5-day SLA; DLP blocks of NPI-to-AI uploads per month (trend, with retraining follow-through rate).

## IS-14 — Logging, Monitoring & Alerting

**WHY (Reg cite):** [Part 748 Appendix A §III.C.1.f](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires monitoring systems and procedures to detect actual and attempted attacks on or intrusions into member information systems.

**SYSTEM BEHAVIOR:** Security-relevant logs from servers, network devices, applications, identity providers, and cloud services are centralized in a SIEM with NTP time synchronization across sources. Real-time correlation rules raise alerts for critical events (privileged-account anomalies, break-glass use, mass data access, malware detonation, configuration drift); critical alerts are reviewed daily by SecOps with documented disposition. Security-relevant logs are retained at least 12 months, aligned to the records schedule in [IS-18](#is-18-records-management-retention). Log sources may not be disabled without an approved RFC under [IS-04](#is-04-change-management-configuration-control). SIEM rule and retention configuration is write-restricted to SecOps; log integrity is protected against tampering, including by administrators.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Critical alert raised (`siem.alert_critical`) | Correlated source events (`siem.source_events[]`), asset context (`asset.attributes`) | Alert disposition record (`siem.alert_disposed`) | Daily review (enforced by `siem.alert_review_due_at`) |
| Log source goes silent (`siem.source_silent`) | Source inventory (`siem.source_inventory`), last-seen timestamp (`siem.last_seen_at`) | Source restoration or RFC reference (`siem.source_restored`) | Internal: 1 business day |
| Confirmed malicious activity (`siem.alert_confirmed_malicious`) | Alert detail (`siem.alert_detail`), affected scope (`asset.attributes`) | Incident declaration (`incident.declared`) | Internal: immediate |

**ALERTS/METRICS:** Critical alerts unreviewed after 24 hours (target zero); log-source coverage percentage of CMDB assets; alert false-positive rate and triage latency distribution; log retention compliance at 12 months.

## IS-15 — Acceptable Use & Communications Systems

**WHY (Reg cite):** [Part 748 Appendix A §III.C.2](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires training and workforce controls implementing the security program; documented acceptable-use rules are the workforce-facing control surface for safeguarding member information under [GLBA, 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801).

**SYSTEM BEHAVIOR:** A documented Acceptable Use Standard defines permitted use of devices, email, messaging, internet, and removable media, including monitoring notice (users are informed that usage may be monitored), BYOD enrollment requirements (MDM, encryption, remote-wipe consent), and remote-work safeguards (VPN/zero-trust access, screen privacy). Every user must acknowledge the standard before access is granted, and re-acknowledge on material revision. Removable media is blocked by default and exceptions require written approval. Violations route to HR and may trigger access suspension under [IS-06](#is-06-access-control-authentication). The standard's text is write-restricted to Compliance and the Information Security/IT lead.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Access requested for new user (`user.access_requested`) | Current standard version (`aup.version`), user identity (`employee.id`) | Signed acknowledgment (`aup.acknowledged`) | Before access granted (gating `access.provisioned`) |
| Standard materially revised (`aup.revised`) | Revision summary (`aup.revision_summary`), user roster (`access.user_roster`) | Re-acknowledgment campaign completion (`aup.reacknowledged`) | Internal: 30 days |
| BYOD device enrolled (`byod.enrollment_requested`) | MDM compliance status (`byod.mdm_status`), encryption check (`byod.encryption_status`) | Enrollment approval (`byod.enrolled`) | Before corporate-resource access |

**ALERTS/METRICS:** Users with active access lacking a current acknowledgment (target zero); BYOD devices out of MDM compliance; removable-media exception count and review currency.

## IS-16 — Social Media

**WHY (Reg cite):** [Part 748 Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires controls over channels through which member information could be disclosed or members deceived; GLBA's confidentiality duty under [15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) extends to disclosure of member information on social platforms.

**SYSTEM BEHAVIOR:** Corporate social media posts are pre-approved through the marketing review workflow before publication; only designated administrators hold credentials to official accounts, with MFA enforced. Personal posts by staff that discuss the credit union require a disclaimer that views are the author's own, and disclosure of member information on any platform is prohibited. Detected scams or impersonation of the credit union or its leadership escalate same-day to platform takedown channels, with member-warning communications when fraud risk is active. Marketing-compliance content rules (e.g., advertising regulation) are governed by the applicable sibling policies. Official-account credential administration is restricted to Marketing with Information Security/IT oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Corporate post drafted (`socialmedia.post_drafted`) | Content (`socialmedia.post_content`), approver (`socialmedia.approver`) | Approved/rejected post record (`socialmedia.post_approved`) | Before publication |
| Impersonation or scam detected (`socialmedia.impersonation_detected`) | Platform and URL (`socialmedia.impersonation_detail`), evidence capture (`socialmedia.evidence`) | Takedown escalation + member warning if needed (`socialmedia.takedown_escalated`) | Same day (enforced by `socialmedia.takedown_due_at`) |
| Member-information disclosure detected (`socialmedia.disclosure_detected`) | Post detail (`socialmedia.post_content`), poster identity (`employee.id`) | Removal + HR referral record (`socialmedia.disclosure_disposed`) | Internal: same day |

**ALERTS/METRICS:** Unapproved corporate posts published (target zero); impersonation cases with same-day escalation rate (target 100%); time-to-takedown distribution.

## IS-17 — Training, Awareness & Testing

**WHY (Reg cite):** [Part 748 Appendix A §III.C.2](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires training staff to implement the information security program, and [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717/subpart-J) requires training staff to implement the identity theft program.

**SYSTEM BEHAVIOR:** All workforce members complete role-based security training: new hires within 30 days of start, annual refreshers thereafter, and deep-dive modules for high-risk roles (privileged IT, wire/payments operations, member-facing fraud handling). Phishing simulations run quarterly; users who repeatedly fail (two or more failures in a rolling year) receive targeted re-training, and persistent failure escalates to management. Training content covers red-flag detection per [IS-10](#is-10-identity-theft-red-flags-program), AI usage rules per [IS-13](#is-13-ai-governance-usage-disclosure), and acceptable use per [IS-15](#is-15-acceptable-use-communications-systems). Training records are write-restricted to HR/training administrators.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New hire starts (`employee.hired`) | Role training matrix (`training.role_matrix`), assigned modules (`training.assigned_modules[]`) | Completion record (`training.completed`) | 30 days (enforced by `training.newhire_due_at`) |
| Annual refresher cycle (`training.refresher_due`) | Workforce roster (`access.user_roster`), updated content (`training.content_version`) | Refresher completion records (`training.completed`) | 12 months from prior completion |
| Quarterly phishing simulation (`phishing.simulation_launched`) | Target cohort (`phishing.cohort[]`), scenario (`phishing.scenario`) | Result set with failures (`phishing.results_recorded`) | Quarterly |
| Repeated phishing failure (`phishing.repeat_failure`) | Failure history (`phishing.failure_history`), user (`employee.id`) | Re-training assignment + completion (`training.remedial_completed`) | Internal: 30 days |

**ALERTS/METRICS:** New hires past 30 days without training (target zero); annual completion rate (target 100%); phishing failure rate trend by quarter; remedial-training completion within SLA.

## IS-18 — Records Management & Retention

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires a records preservation program with vital-records protection and retention guidance (Appendix B), and the [FACTA Disposal Rule, 16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682) governs secure destruction at end of retention.

**SYSTEM BEHAVIOR:** A records retention schedule assigns retention periods by record class (member records, transaction records, security logs, vendor files, training records), aligned with Part 749 Appendix B and the per-entity retention periods registered in the engineering vocabulary (e.g., 7 years for `account` and `bookkeeping_entry`, 5 years for transfer and verification records). A legal-hold process suspends destruction for records subject to litigation, investigation, or examination; holds override the disposal pipeline in [IS-07](#is-07-data-protection-encryption-disposal). The destruction queue is processed monthly, excluding held records, with destruction logged. Retention-schedule and legal-hold administration is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly destruction cycle (`record.destruction_cycle`) | Eligible records (`record.disposal_queue[]`), hold registry (`record.hold_registry`) | Destruction log (`record.destroyed`) | Monthly (enforced by `record.destruction_cycle_due_at`) |
| Legal hold issued (`record.hold_issued`) | Matter reference (`record.hold_matter`), record scope (`record.hold_scope`) | Hold applied to affected classes (`record.hold_applied`) | Internal: same business day |
| Legal hold released (`record.hold_released`) | Release authorization (`record.hold_release_auth`) | Records returned to retention pipeline (`record.hold_lifted`) | Internal: 5 business days |

**ALERTS/METRICS:** Held records destroyed in error (target zero — hard control); destruction-queue backlog age; percentage of record classes with an assigned retention period (target 100%).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for program content, Board reporting, and regulatory alignment.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board/Supervisory Committee approval per [IS-01](#is-01-governance-oversight).
- **Required participants:** Information Security/IT lead, Engineering/SecOps, Risk, Privacy, HR, Facilities, Board/Supervisory Committee.
- **Review cadence:** Annual review and re-approval (next review per front-matter), plus out-of-cycle review on material regulatory change, significant incident, or major technology change.
- **Cross-references:** E-Commerce Policy (online/mobile channel governance), Electronic Payment Systems Policy (payment rails), Fair Lending Policy (advertising compliance), Enterprise Risk Management Policy (risk appetite and scoring), Third-Party Risk Policy (vendor program mechanics), Business Continuity Plan Policy (detailed BCP), Privacy Policy (privacy notices and member rights).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** `vocabulary.json` (Cassandra Banking Core API) defines entities, fields, and endpoints but registers **no events, timers, or state machines**. All `event.code` and timer references in the EVENTS tables (e.g., `incident.reportable_determined`, `access.deprovisioned`, `vuln.remediation_due_at`, `record.destruction_cycle`) use the target naming scheme and will be confirmed by engineering before the next review. Existing entity fields cited (e.g., `verification.status`, `provider_result.risk_signals[]`, `account.lock_type`, `entity_id`) do exist in the current vocabulary.
- Many controls (HR feeds, badge systems, SIEM, CMDB, DLP, backup tooling, training platform, social-media monitoring) depend on systems outside the banking-core vocabulary; their event codes are entirely provisional pending platform selection and integration.
- PATRICK_NOTES did not specify severity-classification criteria for incidents or the threshold for "reportable" under §748.1(c); this policy assumes the IR lead and CCO make that determination jointly using the NCUA's reportable-incident definition, to be confirmed in the IR plan.
- Internal SLAs not given in PATRICK_NOTES were set to minimal viable values and need confirmation: 2-BD provisioning, 2-BD DLP/AI-violation disposition, 10-BD member-notice internal target, 15-BD post-incident review, 30-day AUP re-acknowledgment window, 10-BD AI approval cycle, and end-of-following-month completion for quarterly access reviews and attestations.
- The repeated-phishing-failure threshold (two or more failures in a rolling 12 months) is an assumption; Patrick's notes said only "re-training after repeated phishing failures."
- High-risk vendor definition (NPI holding or privileged system access) is assumed; the Third-Party Risk Policy's tiering should be confirmed as the authoritative source.
- The reference Identity Theft Red Flag materials are bank-era documents (Sound Community Bank / Dale Employees FCU); their Appendix J flag inventory and forms were generalized into the red-flag matrix in [IS-10](#is-10-identity-theft-red-flags-program), but a Pynthia-specific covered-account inventory and risk rating has not been performed and is required for Part 717 Subpart J compliance.
- CCTV footage retention period was not specified; it is assumed to follow the records schedule in [IS-18](#is-18-records-management-retention) and needs a concrete period.
- NIST SP 800-53 Rev. 5 and NIST CSF 2.0 are treated as non-regulatory framework references informing control design, not compliance obligations; no control-by-control mapping is included here.
- Pynthia's charter type (federal vs. state) was not stated; this policy assumes NCUA Parts 748/749/717 apply directly. State-chartered status would add state regulator notification obligations to [IS-09](#is-09-incident-response-cyber-incident-reporting).
