```yaml
---
title: E-Commerce Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, E-Commerce, Information Security, Authentication, Risk Management]
---
```

# E-Commerce Policy

## General Policy Statement

Pynthia Credit Union is committed to identifying, measuring, monitoring, and controlling the risks that arise from operating electronic-commerce channels — the computer hardware, software, and telecommunications systems that allow members to access account information and conduct transactions over public networks such as the Internet. This policy establishes layered preventive, detective, and recovery controls across the consumer-facing channel layer, including member enrollment and authentication, network and data access, encryption, virus protection, security monitoring, breach response, contingency planning, and staff training. Accountability for these controls is centralized with the Chief Compliance Officer, with required participation from the CIO/IT Department, Deposit Operations, and Information Security. The Board of Directors approves this written policy and reviews it at least annually. Backend payment rails, cybersecurity controls, CIP for online account opening, privacy notices, third-party vendor oversight, and detailed business-continuity procedures are governed by adjacent policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Member submits e-commerce enrollment application | Application received electronically, in person, or by mail (`ecommerce.enrollment.received`) | Before access code issued | Identity verified; member number confirmed; email confirmation sent | [EC-03](#ec-03-member-enrollment-and-identity-verification) |
| Temporary password issued (no password requested) | Credentials issued (`ecommerce.credentials.issued`) | At first login | Member must change temp password on first access | [EC-04](#ec-04-member-password-standards) |
| Annual password expiry | Password age reaches 12 months (`member_credential.expiry_due`) | 12 months from last change | Member prompted to change password | [EC-04](#ec-04-member-password-standards) |
| Firewall periodic review | Scheduled review cycle (`firewall.review_due`) | Periodically (internal: quarterly) | Firewall rule-set reviewed and tested | [EC-05](#ec-05-firewalls) |
| Annual independent firewall intrusion-risk review | Annual cycle opens (`firewall.independent_review_due`) | Annually | Independent provider conducts review and test; results retained | [EC-05](#ec-05-firewalls) |
| Annual TLS/SSL certificate and protocol test | Annual cycle opens (`tls.assessment_due`) | Annually | Qualys SSL Labs test run; results retained with IT | [EC-06](#ec-06-encryption-and-tls) |
| TLS certificate approaching expiry | Certificate expiry timer fires (`tls.certificate_expires_at`) | Before expiry | Certificate renewed; test re-run | [EC-06](#ec-06-encryption-and-tls) |
| Penetration test engagement | Annual cycle opens (`pentest.engagement_due`) | Annually | Bonded outside firm conducts test; report issued; remediation tracked | [EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection) |
| E-commerce risk assessment | Annual cycle opens (`ecommerce.risk_assessment_due`) | Annually | Risk assessment completed; findings fed to control owners | [EC-01](#ec-01-safeguarding-member-information-and-e-commerce-risk-assessment) |
| Unauthorized act or user detected | Intrusion or unauthorized access detected (`intrusion.detected`) | Immediately | Management notified; damage/liability assessed; response activated | [EC-10](#ec-10-breach-detection-liability-assessment-and-external-comms-gating) |
| NCUA reportable cyber-incident determination | Reportability determined (`incident.reportable.determined`) | 72 hours of discovery | NCUA notified; member notification assessed | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| E-commerce BCP/contingency review | Annual BCP review cycle (`bcp.annual_review_due`) | Annually | E-commerce systems confirmed in BCP; vendor DR arrangements confirmed | [EC-11](#ec-11-contingency-planning-and-business-continuity) |
| Annual staffing and training needs assessment | Annual cycle opens (`training.annual_due`) | Annually | Staffing and training needs assessed; additional training provided as needed | [EC-12](#ec-12-expertise-and-training) |
| Policy annual review | Policy review due (`policy.review_due`) | Annually | Board reviews and re-approves policy | [Governance & Sign-Off](#governance--sign-off) |

---

## EC-01 — Safeguarding Member Information and E-Commerce Risk Assessment {#ec-01-safeguarding-member-information-and-e-commerce-risk-assessment}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 and Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires a board-approved written security program with controls to protect the confidentiality, integrity, and availability of member information across electronic channels. The [FFIEC IT Examination Handbook (E-Banking booklet)](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) and [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) establish the safeguards principle for nonpublic personal information handled online.

**SYSTEM BEHAVIOR:** E-commerce systems must maintain data integrity, ensure member privacy, and protect the credit union's computer and telecommunications systems from unauthorized intrusion, misuse, or fraud. End-to-end security controls are applied to all critical data traversing the channel. An annual e-commerce risk assessment is conducted to identify internal and external threats, evaluate the effectiveness of existing controls, and drive decisions to modify or add controls. Assessment results are documented and fed to the owners of controls EC-02 through EC-12. The risk assessment is write-restricted to the CCO and CIO; findings are read-accessible to Information Security and Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual e-commerce risk assessment cycle opens (`ecommerce.risk_assessment.started`) | Prior assessment results (`ecommerce.risk.assessment.due`), current threat landscape (`threat_register.refresh_due`), control inventory (`control.register`) | Completed risk assessment report; updated risk register (`ecommerce.risk_assessment.completed`) | Annually (internal: complete within 60 days of cycle open; enforced by `ecommerce.risk_assessment_due`) |
| Risk assessment identifies a new or elevated threat | Assessment results (`risk.assessment_results`), threat catalog (`risk.threat_catalog`), control gaps (`audit.gap`) | Risk catalog entry created or updated; control owners notified (`risk.catalog_entry.created`) | Within 10 business days of assessment completion |
| Periodic security assessment conducted (virus logs, file maintenance reports reviewed) | Antivirus log (`antivirus.log_review.due`), monitoring findings (`monitoring.findings`) | Assessment findings logged; remediation tasks created if needed (`antivirus.log_review.completed`) | Periodically (internal: monthly; enforced by `antivirus.log_review_due`) |

**ALERTS/METRICS:** Alert when the annual risk assessment is not completed within 60 days of cycle open (`ecommerce.risk_assessment_due` overdue). Dashboard metric: count of open high-severity risk catalog entries; target zero unmitigated high-severity items older than 30 days.

---

## EC-02 — Network and Data Access Controls {#ec-02-network-and-data-access-controls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls to prevent unauthorized access to member information systems. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) sets expectations for layered access controls across internet-facing channels.

**SYSTEM BEHAVIOR:** The credit union verifies and enforces each user's authorized right to access the network, applications, and data. Controls include: unique user IDs; passwords with regular updates (see [EC-04](#ec-04-member-password-standards)); member-set security questions; physical controls (e.g., combination lock on the computer room); and software/hardware security devices (anti-virus software, firewall, PC/computer control and monitoring software). Unauthorized individuals are prohibited from entering operations facilities, retrieving confidential information, or accessing credit union software applications and operating systems. Access entitlements are reviewed periodically to confirm they remain appropriate; access is deprovisioned promptly upon role change or separation. The access review and provisioning workflow is write-restricted to the CIO and Information Security; the CCO has read access for oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| User requests access to e-commerce network, application, or data (`access.entitlement.requested`) | User identity (`user.id`), role (`user.role`), manager approval (`access.manager_approval`), justification (`access.justification`) | Access granted or denied; entitlement recorded (`access.granted` or `access.role.denied`) | Before access is provisioned (internal: same business day) |
| Periodic access review cycle opens (`access.review.due_at`) | Current user roster (`access.user_roster`), role entitlements (`access.role_entitlements`), last review date (`access.last_reviewed_at`) | Access review completed; inappropriate access revoked (`access_review.completed`; `access.deprovisioned` where applicable) | Periodically (internal: semi-annually; enforced by `access.review_due`) |
| Employee role changes or separation (`employee.separated` or `employee.role.changed`) | Employee ID (`employee.id`), prior role (`user.role`), separation date | Access deprovisioned; deprovision logged (`access.deprovisioned`) | Same day as separation or role change (enforced by `access.deprovision_due_at`) |
| Physical access to computer room requested | Visitor identity (`facility.visitor_identity`), visit purpose (`facility.visit_purpose`), access approval (`facility.access_approval`) | Visitor logged; access confirmed or denied (`facility.visitor.logged`; `facility.secure_access.granted`) | At time of access request |

**ALERTS/METRICS:** Alert when access deprovision is not completed on the day of separation (`access.deprovision_due_at` breached). Alert when periodic access review is overdue. Metric: count of active accounts with no review in the past 180 days; target zero.

---

## EC-03 — Member Enrollment and Identity Verification {#ec-03-member-enrollment-and-identity-verification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to authenticate users before granting access to member information. The [FFIEC Authentication Guidance (2021)](https://www.ffiec.gov/press/pdf/Authentication-and-Access-to-Financial-Institution-Services-and-Systems.pdf) requires risk-based authentication and identity verification prior to issuing credentials for online banking access.

**SYSTEM BEHAVIOR:** Members may not complete an e-commerce enrollment application entirely online without identity verification. The applicant must supply related account numbers and submit the application electronically, in person, or by mail. Before an access code is issued, staff verify the applicant's identity and confirm the member number. Once verification passes, the system assigns an access code and temporary password (see [EC-04](#ec-04-member-password-standards)) and sends an email confirmation to the member. On every subsequent access, the member's identity is authenticated before account information or transactions are available. Enrollment applications that cannot be verified are held pending; access is not granted until verification is complete. The enrollment approval workflow is write-restricted to Deposit Operations with oversight by the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member submits e-commerce enrollment application (`ecommerce.enrollment.submitted`) | Applicant identity (`enrollment.applicant_identity`), related account numbers (`enrollment.identity_evidence`), submission channel (`enrollment.channel`) | Enrollment application received and logged (`ecommerce.enrollment.received`) | Immediately upon submission |
| Staff verifies applicant identity and member number (`ecommerce.enrollment.verified`) | Identity evidence (`enrollment.identity_evidence`), member number match result (`enrollment.member_number_match`), member ID (`member.id`) | Verification result recorded; enrollment approved or held (`ecommerce.enrollment.approved` or `verification.denied`) | Before access code is issued (internal: 1 business day) |
| Enrollment approved — access code and credentials issued (`ecommerce.credentials.issued`) | Verified member ID (`member.id`), login ID (`member_credential.login_id`), temporary password (`member_credential.temp_password`), `is_temporary` flag (`member_credential.is_temporary`) | Credentials issued and logged; email confirmation sent (`member_credential.issued`; `ecommerce.enrollment_confirmation.sent`) | Same day as approval |
| Member attempts to access e-commerce system (`ecommerce.login_attempted`) | Login ID (`member_credential.login_id`), password hash (`member_credential.password_hash`), security questions (`member_credential.security_questions`) | Authentication result logged; session opened or lockout recorded (`ecommerce.session_authenticated` or `ecommerce.login.failed`; `ecommerce.lockout.recorded` after threshold) | Real-time at each access attempt |

**ALERTS/METRICS:** Alert when failed authentication attempts reach the lockout threshold (`ecommerce.credential.locked`). Alert when enrollment applications remain unverified for more than 1 business day. Metric: enrollment-to-confirmation cycle time; target ≤ 1 business day.

---

## EC-04 — Member Password Standards {#ec-04-member-password-standards}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to prevent unauthorized access, including credential management standards. The [FFIEC Authentication Guidance (2021)](https://www.ffiec.gov/press/pdf/Authentication-and-Access-to-Financial-Institution-Services-and-Systems.pdf) requires that authentication mechanisms be commensurate with the risk of the transactions and information accessed.

**SYSTEM BEHAVIOR:** When no password is requested by the member, the system assigns a randomly generated eight-character temporary password. The member is prompted and required to change the temporary password on first access. Passwords must be changed at least annually thereafter; the system enforces this via the `member_credential.expiry_due` timer. All passwords must meet Fiserv complexity rules (subject to change as provided by the core vendor): minimum length 8, maximum length 32 (spaces allowed but not at beginning or end); must contain at least one upper-case letter, at least one lower-case letter, and at least one number or special character; cannot contain the member's first or last name, the Login ID (or Login ID as a substring), the word "Fiserv" in any case combination, or the word "password" as a substring; and cannot match any of the prior 5 passwords. Allowed special characters include: `!`, `#`, `$`, `%`, `_`, `-`. The password complexity ruleset is owned by IT and is updated whenever Fiserv publishes revised standards; the CCO is notified of any changes. Password hashes are stored; plaintext passwords are never logged.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Credentials issued with no member-requested password (`ecommerce.credentials.issued`) | Member ID (`member.id`), `is_temporary` flag (`member_credential.is_temporary`) | Temporary password generated and issued (`member_credential.temp_password.issued`) | At time of credential issuance |
| Member logs in for the first time with a temporary password (`ecommerce.login_attempted` where `member_credential.is_temporary = true`) | Login ID (`member_credential.login_id`), temporary password (`member_credential.temp_password`), new password candidate (`member_credential.new_password`) | Password changed; `is_temporary` flag cleared; change logged (`member_credential.password.changed`) | At first login (system blocks access until change is complete) |
| Annual password expiry timer fires (`member_credential.expiry_due`) | Member ID (`member.id`), password set date (`member_credential.password_set_at`), prior password hashes for reuse check | Member prompted to change password; change logged (`member_credential.password.changed`) | Within 12 months of last change (enforced by `member_credential.expiry_due`) |
| Member changes password voluntarily or on prompt (`member_credential.password.changed`) | New password candidate (`member_credential.new_password`), prior 5 password hashes (`member_credential.password_hash`), complexity ruleset | Password validated against complexity rules; change accepted or rejected; new hash stored; change logged (`member_credential.password.changed`) | Real-time at change attempt |

**ALERTS/METRICS:** Alert when a member's password has not been changed within 12 months (`member_credential.expiry_due` overdue). Metric: count of accounts with expired passwords; target zero. Alert on any failed complexity-rule enforcement (system defect indicator).

---

## EC-05 — Firewalls {#ec-05-firewalls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect systems from unauthorized access, including network perimeter controls. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires firewall protection at all connection points between internal and external networks.

**SYSTEM BEHAVIOR:** The credit union combines hardware and software firewalls to block unwanted inbound and outbound communications while permitting acceptable traffic. Firewalls protect all connection points between the internal network and external networks, including the Internet. The CIO is responsible for firewall configuration and periodic review. Firewall rules are reviewed and tested periodically (internal cadence: quarterly). In addition, an independent provider conducts an annual review and test for intrusion risks; results are documented and retained. Firewall configuration changes follow the change management process. The firewall configuration is write-restricted to IT; the CCO and Information Security have read access to review results.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Periodic firewall review cycle opens (`firewall.review_due`) | Current firewall rule-set, prior review results, change log | Firewall reviewed and tested; findings logged; rule-set updated if needed (`firewall.review.completed`) | Periodically (internal: quarterly; enforced by `firewall.review_due`) |
| Annual independent intrusion-risk review cycle opens (`firewall.independent_review_due`) | Engagement scope (`pentest.scope`), independence attestation (`pentest.independence`), prior findings | Independent review and test completed; report issued; remediation tasks created for findings (`firewall.independent_review.completed`) | Annually (enforced by `firewall.independent_review_due`) |
| Firewall configuration change proposed (`change.rfc.submitted`) | Change request (`change.rfc`), risk rating (`change.risk_rating`), rollback plan (`change.rollback_plan`), CAB decision (`change.cab_decision`) | Change reviewed, approved, and deployed; post-review completed (`change.cab_decision.recorded`; `change.completed`; `change.post_review.completed`) | Per change management SLA (internal: CAB review within 5 BD; enforced by `change.cab_review_due_at`) |

**ALERTS/METRICS:** Alert when the quarterly firewall review is overdue (`firewall.review_due` breached). Alert when the annual independent review is not completed within the calendar year (`firewall.independent_review_due` breached). Metric: count of open firewall-related findings; target zero critical findings older than 30 days.

---

## EC-06 — Encryption and TLS {#ec-06-encryption-and-tls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect the confidentiality and integrity of member information in transit. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the safeguards principle for nonpublic personal information, which includes data in transit over public networks.

**SYSTEM BEHAVIOR:** All e-commerce system communications use TLS connections with up-to-date SSL certificates and current cipher suites. Encryption is applied to all sensitive or critical data in transit. The SSL certificate and TLS protocol are tested at least annually using Qualys SSL Labs (https://www.ssllabs.com/ssltest/analyze); test results are retained with the IT department. The TLS certificate expiry is monitored; renewal is initiated before expiry. If a test reveals a degraded security rating, IT initiates remediation immediately and re-tests after remediation. The TLS configuration and test results are write-restricted to IT; the CCO has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual TLS/SSL assessment cycle opens (`tls.assessment_due`) | Current certificate details (`tls.certificate_expires_at`), cipher suite (`tls.cipher_suite`), Qualys SSL Labs test tool | TLS assessment completed; test rating recorded; results retained with IT (`tls.assessment.completed`) | Annually (enforced by `tls.assessment_due`) |
| TLS certificate approaching expiry (`tls.certificate_expires_at`) | Certificate expiry date (`tls.certificate_expires_at`), renewal process | Certificate renewed; post-renewal test run; renewal logged (`tls.certificate.renewed`) | Before certificate expiry (internal: initiate renewal 30 days before expiry; enforced by `tls.certificate_expiry_due`) |
| TLS assessment reveals degraded rating (`tls.assessment.completed` with failing `tls.test_rating`) | Test rating (`tls.test_rating`), cipher suite (`tls.cipher_suite`), remediation plan | Vulnerability finding created; remediation tracked; re-test conducted (`vuln.finding.created`; `vuln.remediated`) | Remediation initiated same day; re-test within 10 BD (enforced by `vuln.remediation_due_at`) |

**ALERTS/METRICS:** Alert when the annual TLS assessment is not completed within the calendar year (`tls.assessment_due` breached). Alert when a certificate is within 30 days of expiry without a renewal in progress (`tls.certificate_expiry_due`). Metric: TLS security rating from most recent Qualys test; target grade A or better.

---

## EC-07 — Transaction Verification and Audit Trails {#ec-07-transaction-verification-and-audit-trails}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III](https://www.ecfr.gov/current/title-12/part-748) requires controls to ensure the integrity of electronic transactions and maintain records sufficient to support examination. [E-SIGN Act 15 USC §7001 et seq.](https://www.law.cornell.edu/uscode/text/15/7001) governs the legal effect of electronic records and signatures. [Regulation E 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) requires records sufficient to support error resolution for electronic fund transfers.

**SYSTEM BEHAVIOR:** The credit union's e-commerce member agreements define the procedures for valid and authentic electronic communications between the credit union and its members, and specify that the parties intend to be bound by communications that comply with those procedures. Audit trails are maintained in real time for all transactions, identifying the parties that initiate each transaction. These audit trails enable the credit union to verify specific transactions and provide proof of transactions to rebut repudiation claims. Audit trail records are immutable once written; only the CCO and CIO may access the audit trail management interface. Members may submit repudiation claims through the e-commerce channel or in person; each claim is reviewed against the audit trail.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member initiates an e-commerce transaction (`ecommerce.transaction.initiated`) | Member ID (`member.id`), transaction details (`transaction.amount`, `transaction.type`), session ID (`web.session`), initiating party identity (`transaction.initiated_by`) | Audit trail entry written; transaction logged (`ecommerce.audit_trail.recorded`) | Real-time at transaction initiation |
| Member submits a repudiation claim (`ecommerce.repudiation_claim.received`) | Member ID (`member.id`), claimed transaction details (`transaction.id`, `transaction.amount`), audit trail records (`ecommerce.audit_trail.recorded`) | Repudiation claim reviewed against audit trail; outcome recorded (`ecommerce.repudiation.reviewed`) | Internal: review completed within 10 BD of claim receipt |
| E-commerce member agreement updated or re-issued | Agreement version (`agreement.version`), change description (`change.description`), member consent | Agreement change logged; members notified as required (`disclosure.change_in_terms.sent`) | Before new agreement terms take effect |

**ALERTS/METRICS:** Alert if any transaction is initiated without a corresponding audit trail entry (system integrity failure). Metric: count of open repudiation claims older than 10 business days; target zero. Audit trail completeness rate: target 100%.

---

## EC-08 — Virus Protection {#ec-08-virus-protection}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect information systems from malicious code. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires a malware detection and prevention program as part of layered security for internet-facing systems.

**SYSTEM BEHAVIOR:** The credit union maintains a credit-union-wide virus detection and prevention program covering all systems connected to or supporting the e-commerce channel. The program includes: end-user acceptable-use policies; training and awareness programs (see [EC-12](#ec-12-expertise-and-training)); anti-virus detection tools with current signature definitions; and enforcement procedures for policy violations. Anti-virus logs are reviewed periodically to identify detections and confirm the program is operating effectively. Signature definitions are updated automatically; any failure to update triggers an alert. The anti-virus program configuration is managed by IT; the CCO reviews periodic log summaries.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Anti-virus detection event occurs (`antivirus.remediated`) | Detection details (`antivirus.detection`), affected system, signature version (`antivirus.definitions_version`) | Detection logged; affected system quarantined or remediated; incident opened if warranted (`antivirus.remediated`; `incident.created` if severity warrants) | Real-time detection; remediation within 4 hours for critical detections |
| Periodic anti-virus log review cycle opens (`antivirus.log_review_due`) | Anti-virus log (`antivirus.log_review.due`), definitions version (`antivirus.definitions_version`), prior review results | Log review completed; findings documented; remediation tasks created if needed (`antivirus.log_review.completed`) | Periodically (internal: monthly; enforced by `antivirus.log_review_due`) |
| Anti-virus signature definitions update fails | Definitions version (`antivirus.definitions_version`), update failure detail | Alert issued; IT notified; manual update initiated; failure logged (`vuln.finding.created`) | Alert within 1 hour of failed update; remediation same day |

**ALERTS/METRICS:** Alert when anti-virus definitions are more than 24 hours out of date. Alert when a critical detection is not remediated within 4 hours. Metric: count of systems with out-of-date definitions; target zero. Monthly log review completion rate: target 100%.

---

## EC-09 — Security Monitoring, Penetration Testing, and Intrusion Detection {#ec-09-security-monitoring-penetration-testing-and-intrusion-detection}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748) requires monitoring controls to detect unauthorized access and security events. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires real-time monitoring, intrusion detection, and periodic penetration testing as components of a layered security program.

**SYSTEM BEHAVIOR:** The credit union uses monitoring tools to identify vulnerabilities and detect possible intrusions from external and internal parties in real time. Transaction and audit logs are produced on a real-time basis indicating network traffic. Systems are in place to notify appropriate parties or terminate suspicious network connections automatically. Intrusion detection tools enable management to maintain an incident database for trend analysis of network intrusions and attack attempts. The intrusion detection system is monitored 24/7 by a security operations center (currently SecureWorks). The credit union contracts with a bonded outside firm specializing in security for financial institutions to conduct annual penetration testing; the firm provides test results and recommends manual or automated remediation processes. Penetration test findings are tracked to closure. Because penetration tests simulate probable actions of unauthorized and authorized users but cannot guarantee prevention of all attack types, results are used to continuously improve controls rather than as a certification of security. The SIEM and intrusion detection configuration is managed by IT and Information Security; the CCO reviews trend reports.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| SIEM or intrusion detection system generates a critical alert (`siem.alert_critical`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`), network traffic logs | Alert reviewed; suspicious connections terminated if warranted; incident opened (`siem.alert.disposed` or `incident.created`; `intrusion.response.recorded`) | Real-time detection; alert review within 15 minutes (SOC SLA) |
| Intrusion detected (`intrusion.detected`) | Intrusion severity (`intrusion.severity`), response playbook, incident commander | Incident declared; response activated; intrusion logged (`incident.declared`; `intrusion.response.recorded`) | Immediately upon detection; incident declared within 1 hour |
| Annual penetration test engagement opens (`pentest.engagement_due`) | Engagement scope (`pentest.scope`), independence attestation (`pentest.independence`), prior findings | Penetration test completed; report issued; findings logged; remediation tasks created (`pentest.report.issued`; `vuln.finding.created` per finding) | Annually (enforced by `pentest.engagement_due`) |
| Penetration test finding requires remediation (`vuln.finding.created`) | Finding detail (`vuln.detail`), severity (`vuln.severity`), remediation plan (`vuln.remediation_plan`) | Remediation tracked to closure; re-test conducted (`vuln.remediated`) | Per severity: critical ≤ 30 days, high ≤ 60 days, medium ≤ 90 days (enforced by `vuln.remediation_due_at`) |
| SIEM source goes silent (no events for unexpected period) (`siem.source_silent`) | Source inventory (`siem.source_inventory`), last seen timestamp (`siem.last_seen_at`) | Alert issued; IT investigates; source restored or incident opened (`siem.source.restored` or `incident.created`) | Alert within 1 hour of silence threshold breach (enforced by `siem.alert_review_due_at`) |

**ALERTS/METRICS:** Alert when a critical SIEM alert is not reviewed within 15 minutes. Alert when a penetration test finding is not remediated within its severity-based deadline (`vuln.remediation_due_at` breached). Metric: mean time to detect (MTTD) and mean time to respond (MTTR) for intrusion events; targets set annually by the CCO and CIO. Count of open critical/high penetration test findings; target zero older than 30/60 days respectively.

---

## EC-10 — Breach Detection, Liability Assessment, and External Comms Gating {#ec-10-breach-detection-liability-assessment-and-external-comms-gating}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §IV](https://www.ecfr.gov/current/title-12/part-748) requires a response program for unauthorized access to member information, including notification procedures. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards against unauthorized access and a response program. This control feeds the reportability determination in [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** Upon detection of an unauthorized act or user — whether identified through intrusion detection ([EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection)), monitoring, member report, or any other means — management is notified immediately. The credit union then determines the extent of damage or disclosure of information, including the legal liability the credit union may incur. Proper response activities are put in place covering communications with members, law enforcement agencies, regulatory agencies, and the media. Only designated individuals are authorized to communicate externally with any of these entities; all external communications are routed through the CCO (or designee) before release. The outcome of the damage and liability assessment is the primary input to the SC-01 reportability determination. This control is write-restricted to the CCO; the CIO and Information Security are required participants in the assessment.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Unauthorized act or user detected (`intrusion.detected` or `incident.detected`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity (`incident.severity`) | Incident declared; management notified immediately; incident record opened (`incident.declared`; `incident.ic.assigned`) | Immediately upon detection; management notification within 1 hour |
| Damage and legal liability assessment initiated (`incident.assessment.started`) | Incident facts (`incident.facts`), data scope (`incident.data_scope`), member impact (`incident.member_impact`), legal review (`incident.legal_review`) | Assessment completed; damage extent documented; legal liability determination recorded; reportability assessment fed to SC-01 (`incident.assessment.completed`; `incident.reportable.determined`) | Within 24 hours of incident declaration (internal SLA) |
| External communications required (members, law enforcement, regulators, media) (`incident.external_comms.started`) | Designated communicators roster (`covered_person.roster`), communications plan (`incident.comms_plan`), CCO sign-off (`incident.cco_signoff`) | External communications reviewed and approved by CCO (or designee) before release; communications logged (`incident.external_comms.recorded`) | Before any external communication is released |
| Response activities completed; incident closed (`incident.closed`) | Root cause (`incident.root_cause`), remediation evidence (`risk.remediation_evidence`), postmortem (`incident.postmortem.completed`) | Incident closed; postmortem completed; lessons learned fed back to EC-01 risk assessment (`incident.closed`) | Postmortem within 14 days of incident closure |

**ALERTS/METRICS:** Alert when management is not notified within 1 hour of incident declaration. Alert when the damage/liability assessment is not completed within 24 hours. Metric: time from detection to management notification; target ≤ 1 hour. Count of incidents where external communications were released without CCO approval; target zero.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748.1(b) and Appendix B](https://www.ecfr.gov/current/title-12/part-748) require a federally insured credit union to notify NCUA as soon as possible — and no later than 72 hours after the credit union reasonably believes it has experienced a reportable cyber incident. Appendix B further requires member notification when sensitive member information has been, or is reasonably believed to have been, accessed or misused by an unauthorized person. [GLBA 15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801) establishes the underlying safeguards obligation.

**SYSTEM BEHAVIOR:** When any incident is declared — whether originating in this policy's [EC-10](#ec-10-breach-detection-liability-assessment-and-external-comms-gating) or in any other policy domain — the system evaluates reportability against the NCUA cyber-incident definition. The CCO owns the reportability determination. If the incident meets the threshold, the NCUA notification task is created immediately and the 72-hour clock starts from the moment the credit union reasonably believed the incident occurred. Member notification is assessed in parallel: if sensitive member information was accessed or misused, member notices are prepared and sent without unreasonable delay. Only the CCO (or a designated deputy) may approve and transmit the NCUA notification and member notices. This control is shared across all seven policies that can generate reportable incidents (Business Continuity Plan, Electronic Payment Systems, Collections, Information Security, Privacy, Third-Party Risk, and this E-Commerce Policy); the control body is identical in each.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared in any policy domain (`incident.declared`) | Incident description (`incident.description`), detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity (`incident.severity`) | Reportability assessment task created; CCO assigned (`incident.assessment.started`; `incident.ic.assigned`) | Immediately upon declaration |
| CCO completes reportability determination (`incident.reportable.determined`) | Incident facts (`incident.facts`), data scope (`incident.data_scope`), legal review (`incident.legal_review`), reportability rationale (`incident.reportability_rationale`) | Reportability determination recorded; if reportable, NCUA notification task created with 72-hour deadline (`incident.reportable.determined`; `incident.ncua.notified` task queued; `incident.ncua_notice_due_at` set) | Within 24 hours of incident declaration (internal SLA); NCUA notified ≤ 72 hours of reasonable belief (enforced by `incident.ncua_notice_due_at`) |
| NCUA notification sent (`incident.ncua.notified`) | NCUA notification content (`incident.notice_content`), CCO sign-off (`incident.cco_signoff`), NCUA contact (`regulator.contacts`) | NCUA notified; notification logged; acknowledgement tracked (`ncua.notification.sent`; `ncua.ack.logged`) | ≤ 72 hours from reasonable belief of reportable incident (enforced by `incident.ncua_notice_due_at`) |
| Member notification determination made (`incident.member_notices.sent`) | Member impact assessment (`incident.member_impact`), `member_notice_required` flag (`incident.member_notice_required`), notice template (`incident.member_notice_template`), CCO sign-off (`incident.cco_signoff`) | Member notices sent without unreasonable delay; delivery logged (`incident.member_notices.sent`; `incident.notifications.sent`) | Without unreasonable delay after determination that sensitive member information was accessed or misused (internal: within 10 BD of determination; enforced by `incident.notification_due_at`) |
| Quarterly incident trend review (`incident_trend.report.issued`) | Incident database (`incident.summary_id`), trend data (`incident.quarterly_summary`), prior quarter report | Trend report issued; patterns identified; control improvements recommended (`incident_trend.report.issued`) | Quarterly (internal: within 15 days of quarter close) |

**ALERTS/METRICS:** Alert when the NCUA notification deadline is within 12 hours and notification has not been sent (`incident.ncua_notice_due_at` aging alert). Alert when member notification has not been sent within 10 business days of a determination that notice is required (`incident.notification_due_at` breached). Metric: 100% of reportable incidents notified to NCUA within 72 hours; 100% of required member notices sent within the internal SLA. Count of incidents where the reportability determination took more than 24 hours; target zero.

---

## EC-11 — Contingency Planning and Business Continuity {#ec-11-contingency-planning-and-business-continuity}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §IV](https://www.ecfr.gov/current/title-12/part-748) requires a response program that includes business continuity and recovery procedures. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that e-commerce systems be incorporated into the institution's overall business continuity planning, including vendor disaster-recovery arrangements.

**SYSTEM BEHAVIOR:** All e-commerce systems are incorporated into the credit union's overall contingency planning and business continuity efforts. The credit union confirms annually that its core processor (Fiserv) and e-commerce provider have each addressed disaster recovery and contingency planning. The credit union's recovery plan for e-commerce is based on a business impact analysis (BIA) that evaluates business applications and processes to determine their importance and establishes a prioritized order of business resumption designed to recover the most critical functions and systems first. The BIA is reviewed and updated annually. Detailed BCP procedures, RTO/RPO targets, and drill schedules are governed by the Business Continuity Plan Policy; this control establishes the e-commerce-specific requirements that feed into that policy. The CCO owns this control; the CIO is the primary operational participant.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BCP review cycle opens (`bcp.annual_review_due`) | Current BCP plan version (`bcp.plan_version`), e-commerce system inventory, prior BIA results (`bia.criticality`) | E-commerce systems confirmed in BCP; BCP section updated if needed (`bcp.section.updated`; `bcp.board.approved`) | Annually (enforced by `bcp.annual_review_due`) |
| Annual BIA update cycle opens (`bia.annual_update_due`) | Prior BIA (`bia.criticality`, `bia.member_impact`, `bia.reg_dependency`), e-commerce system inventory, RTO/RPO targets | BIA updated; e-commerce systems prioritized; BIA certified (`bia.updated`; `bia.certified`) | Annually (enforced by `bia.annual_update_due`) |
| Annual vendor DR confirmation required (`vendor.dr_attestation_due`) | Fiserv DR plan (`vendor.dr_plan`), e-commerce provider DR plan, prior attestation results (`vendor.dr_test_results`) | Vendor DR arrangements confirmed; attestation logged (`vendor.dr.confirmed`) | Annually (enforced by `vendor.dr_attestation_due`) |
| BCP/DR drill or exercise conducted (`drill.completed`) | Drill objectives (`drill.objectives`), e-commerce scenario, participant roster (`drill.roster`) | Drill completed; after-action report issued; corrective items tracked (`drill.aar.published`; `drill.corrective_plan.opened` if failures found) | Per BCP drill schedule (internal: at least annually; enforced by `dr.exercise_due`) |

**ALERTS/METRICS:** Alert when the annual BCP review is not completed within the calendar year (`bcp.annual_review_due` breached). Alert when vendor DR confirmation is overdue (`vendor.dr_attestation_due` breached). Metric: BIA coverage of e-commerce systems; target 100%. Count of open drill corrective items older than 30 days; target zero.

---

## EC-12 — Expertise and Training {#ec-12-expertise-and-training}

**WHY (Reg cite):** [NCUA 12 CFR Part 748, Appendix A §II](https://www.ecfr.gov/current/title-12/part-748) requires that the credit union assess the qualifications of personnel responsible for implementing and maintaining the security program. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that staff involved in e-commerce operations have appropriate expertise and that training needs be assessed regularly.

**SYSTEM BEHAVIOR:** The credit union relies on its e-commerce system provider (Fiserv) for software development and support. The CCO and CIO jointly assess all personnel to determine whether special staffing or training needs exist for those involved in systems development, operation, and member support. As deemed appropriate, additional training is provided. Training needs are assessed annually to keep pace with technological and personnel changes. New hires in e-commerce-related roles receive role-specific onboarding training before being granted access to production systems. Training completion is tracked; lapsed training triggers a remediation assignment. The training program is owned by the CCO with operational delivery by IT and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training needs assessment cycle opens (`training.annual_due`) | Current staffing roster (`staffing.split_team_plan`), role matrix (`training.role_matrix`), prior assessment results, technology change log | Training needs assessed; gaps identified; additional training assigned as needed (`staffing.review.completed`; `training.assignment.created` for gaps) | Annually (enforced by `training.annual_due`) |
| New hire joins in e-commerce-related role (`employee.hired`) | Employee ID (`employee.id`), role (`user.role`), hire date (`training_detail.hire_date`), required curriculum (`training.required_curriculum`) | Onboarding training assigned; completion tracked (`training.assigned`; `training.onboarding.completed`) | Onboarding training completed before production access granted (enforced by `training.onboarding_due_at`) |
| Annual training cycle opens for existing e-commerce staff (`training.annual_cycle.opened`) | Assignee ID (`training.assignee_id`), curriculum ID (`training.curriculum_id`), annual due date (`training.annual_due_at`) | Annual training assigned; completion tracked; lapsed training flagged (`training.annual.assigned`; `training.lapsed` if not completed) | Annually (enforced by `training.annual_due_at`) |
| Training completed (`training.completed`) | Module ID (`training.module_id`), assessment score (`training.assessment_score`), completion status (`training.completion_status`) | Completion recorded; certificate issued if applicable (`training.completion.recorded`) | At time of completion |
| Training lapses (not completed by due date) (`training.lapsed`) | Assignee ID (`training.assignee_id`), lapsed module (`training.module_id`), due date (`training.annual_due_at`) | Remedial training assigned; manager notified; access restriction considered (`training.remedial.assigned`) | Within 5 BD of lapse |

**ALERTS/METRICS:** Alert when any e-commerce staff member's required training lapses (`training.lapsed`). Alert when a new hire has not completed onboarding training before production access is granted. Metric: training completion rate for e-commerce staff; target 100% by annual due date. Count of staff with lapsed training; target zero.

---

## Governance & Sign-Off {#governance--sign-off}

| Role | Name | Responsibility |
|---|---|---|
| **Policy Owner** | Patrick Wilson, Chief Compliance Officer | Drafts, maintains, and enforces this policy; owns controls EC-01 through EC-12 and SC-01 |
| **Approver** | Patrick Wilson, Chief Compliance Officer | Approves policy on behalf of management; presents to Board |
| **Board of Directors** | Pynthia Credit Union Board | Approves written policy annually; receives annual review summary |
| **CIO / IT Department** | CIO (name TBD) | Operational responsibility for EC-02, EC-05, EC-06, EC-08, EC-09; required participant in EC-01, EC-10, EC-11, EC-12 |
| **Deposit Operations** | VP Deposit Operations (name TBD) | Required participant in EC-03; read access to enrollment and access control workflows |
| **Information Security** | CISO / Information Security Officer (name TBD) | Required participant in EC-09, EC-10; read access to all security control results |

**Review cadence:** This policy is reviewed by management and modified if necessary at least annually to reflect changes in technology, services, and business arrangements. The Board approves the written policy at least annually. The next scheduled review is 2027-07-01.

**Cross-references:**
- Electronic Payment Systems Policy — backend payment rails (ACH, wires, cards, bill pay, RDC)
- Information Security Policy — cybersecurity and information-security controls for online channels
- BSA Policy — Customer Identification Program for online account opening
- Privacy Policy — online privacy notices, cookies, and third-party app connections
- Third-Party Risk Policy — oversight of online-service vendors and third parties (including Fiserv)
- Business Continuity Plan Policy — detailed BCP/DR procedures, RTO/RPO targets, and drill schedules

---

## Assumptions & Gaps {#assumptions--gaps}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the control overlays above are not yet registered in `core-vocabulary.json` or are listed only as provisional codes in DESIGN_NOTES. Specifically: `enrollment.applicant_identity`, `enrollment.channel`, `enrollment.identity_evidence`, `enrollment.member_number_match` (the `enrollment` object fields are listed in DESIGN_NOTES but the object itself is not in the registered objects list — confirm whether `enrollment` is a registered object or whether these fields should be modeled under `ecommerce` or `verification`); `agreement.version` (listed as provisional); `change.description` and `change.summary` (listed as provisional); `transaction.type` and `transaction.id` (listed as provisional). All codes used in this document follow the Composition grammar and registered-object/action registries; provisional codes are flagged here collectively and will be confirmed by engineering before the next review.

- **`enrollment` object registration.** The DESIGN_NOTES list `enrollment` fields (`applicant_identity`, `channel`, `identity_evidence`, `member_number_match`) but `enrollment` does not appear in the registered objects list. EC-03 uses these fields as the most semantically precise fit. Engineering should confirm whether to register `enrollment` as a new object or to model these fields under `ecommerce` or `verification`. Until confirmed, the codes are treated as provisional.

- **Approver is also the Owner.** Patrick Wilson is listed as both Owner and sole Approver. This creates a self-approval situation. The credit union should consider whether a second approver (e.g., the Board Chair or Audit Committee Chair) is required to satisfy NCUA's expectation of Board-level approval independent of management. This document assumes the Board's annual approval of the written policy satisfies the independence requirement.

- **Independent firewall review provider identity.** PATRICK_NOTES and the REFERENCE_POLICY do not name the independent provider for the annual firewall intrusion-risk review. EC-05 refers to "an independent provider." The credit union should confirm the current provider and ensure the engagement is documented in the Third-Party Risk Policy vendor inventory.

- **Security operations center provider.** The REFERENCE_POLICY names "SecureWorks" as the 24/7 SOC provider. EC-09 references this. The credit union should confirm this is current and that the SecureWorks engagement is documented in the Third-Party Risk Policy vendor inventory.

- **Penetration testing firm identity.** EC-09 refers to "a bonded outside firm." The credit union should confirm the current provider, confirm the bonding requirement is met, and ensure the engagement is documented in the Third-Party Risk Policy vendor inventory.

- **Quarterly firewall review cadence.** PATRICK_NOTES state "periodically" for firewall review. The Timing Matrix and EC-05 assume quarterly as the internal cadence. The credit union should confirm this cadence is appropriate and document it in the associated procedure.

- **Monthly anti-virus log review cadence.** PATRICK_NOTES do not specify a frequency for anti-virus log review. EC-08 assumes monthly as the internal cadence. The credit union should confirm.

- **HMDA reporter status and Reg C applicability.** This policy does not address HMDA/Reg C because the scope is the e-commerce channel layer, not lending decisions. If the credit union is a HMDA reporter and uses the e-commerce channel for mortgage applications, the HMDA LAR data collection requirements are governed by the Fair Lending Policy, not this policy.

- **NCUA Part 748 Appendix B — "sensitive member information" definition.** SC-01 references the member notification obligation when "sensitive member information" has been accessed or misused. The specific definition of sensitive member information under Appendix B should be confirmed with legal counsel and documented in the Information Security Policy's incident response procedures, which feed SC-01.

- **E-SIGN Act member consent.** EC-07 references the E-SIGN Act in the context of e-commerce member agreements. The credit union should confirm that its e-commerce enrollment process captures affirmative E-SIGN consent (including the hardware/software disclosure) before delivering electronic disclosures. If not, this is a gap to remediate. E-SIGN consent capture is tracked via `entity.esign_consent` and `member.esign_consent_captured` in the vocabulary.

- **Regulation E error resolution.** EC-07 notes Reg E applicability for audit trail records. The credit union should confirm that the e-commerce audit trail retention period meets the Reg E record retention requirement (generally 2 years from the date of the transfer or the date the member requests documentation). Retention schedules are governed by the Records Retention Policy.

- **SC-01 shared-control source file.** The LOCAL OVERRIDES instruct that SC-01 be emitted verbatim from `shared-controls/ncua-incident-notification.md`. That file was not provided as an input. The SC-01 block above was synthesized from NCUA 12 CFR Part 748 Appendix B, the AUTHORITY_HINTS, and the PATRICK_NOTES breach-response requirements, consistent with the other six policies that share this control. Engineering and Compliance should verify that this block is byte-identical to the canonical shared-control file once that file is finalized.
