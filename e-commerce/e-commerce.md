```yaml
---
title: E-Commerce Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-15
next_review: 2027-07-15
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, E-Commerce, Information Security, Authentication, Risk Management]
---
```

# E-Commerce Policy

## General Policy Statement

Pynthia Credit Union is committed to identifying, measuring, monitoring, and controlling the risks that arise from operating electronic-commerce channels — the computer hardware, software, and telecommunications systems that allow members to access account information and conduct transactions over public networks such as the Internet. This policy establishes layered preventive, detective, and recovery controls across the consumer-facing channel layer, covering member enrollment and authentication, network and data access, encryption, transaction verification, virus protection, security monitoring and penetration testing, breach response, contingency planning, and staff training. Governance is centralized with the Chief Compliance Officer, with required participation from the CIO/IT Department, Deposit Operations, and Information Security; the Board approves this policy and reviews it at least annually. Backend payment rails, cybersecurity controls, CIP for online account opening, privacy notices, and third-party vendor oversight are governed by adjacent policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Member enrollment application received | Application submitted electronically, in person, or by mail → `ecommerce.enrollment.received` | Before access granted | Identity verification + member-number match required | [EC-03](#ec-03-member-enrollment-and-identity-verification) |
| Enrollment approved — confirmation sent | Identity verified → `ecommerce.enrollment.verified` | Immediate upon approval | Email confirmation to member | [EC-03](#ec-03-member-enrollment-and-identity-verification) |
| Temporary password issued | No password requested at enrollment → `member_credential.temp_password.issued` | At credential issuance | 8-character random temp password | [EC-04](#ec-04-member-password-standards) |
| Member first login with temp password | Member accesses system → `ecommerce.login.failed` (if not changed) | First access | Force password change before session proceeds | [EC-04](#ec-04-member-password-standards) |
| Annual password expiry | Password age reaches 12 months → `member_credential.expiry.due` | 12 months from last change | Prompt member to change password | [EC-04](#ec-04-member-password-standards) |
| Firewall periodic review | Scheduled review cycle → `firewall.review.completed` | Periodically (internal: quarterly) | Firewall rule-set review and test | [EC-05](#ec-05-firewalls) |
| Annual independent firewall/intrusion-risk review | Annual cycle → `firewall.independent_review.completed` | Annually | Independent provider engagement | [EC-05](#ec-05-firewalls) |
| Annual TLS/SSL certificate and protocol test | Annual cycle → `tls.assessment.completed` | Annually | Qualys SSL Labs test; results retained by IT | [EC-06](#ec-06-encryption-and-tls) |
| TLS certificate expiry approaching | Certificate expiry date → `tls.certificate_expires_at` | Before expiry | Certificate renewal | [EC-06](#ec-06-encryption-and-tls) |
| Annual penetration test | Annual engagement cycle → `pentest.report.issued` | Annually | Bonded outside firm; results with remediation recommendations | [EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection) |
| Security breach detected | Unauthorized act or user detected → `incident.detected` | Immediate | Management notification; damage/liability assessment within 24 h | [EC-13](#ec-13-breach-detection-liability-assessment-and-external-comms-gating) |
| NCUA reportable cyber-incident determination | Reportability determined → `incident.reportable.determined` | 72 hours of discovery | NCUA notification if reportable | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Member notification of breach | Misuse determined or likely → `incident.member_notices.sent` | Without unreasonable delay | Member notice per NCUA Part 748 Appendix B | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Annual e-commerce risk assessment | Annual cycle → `ecommerce.risk_assessment.completed` | Annually | Risk assessment covering all channel controls | [EC-01](#ec-01-e-commerce-risk-assessment-and-safeguarding-member-information) |
| Annual staffing and training needs assessment | Annual cycle → `training.annual_cycle.opened` | Annually | Staffing and training needs review | [EC-12](#ec-12-expertise-and-training) |
| Annual policy review | Board review cycle → `policy.board.approved` | Annually | Board approval of updated policy | [EC-14](#ec-14-governance-and-annual-policy-review) |

---

## EC-01 — E-Commerce Risk Assessment and Safeguarding Member Information {#ec-01-e-commerce-risk-assessment-and-safeguarding-member-information}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 and Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires a board-approved written security program with controls to protect the confidentiality, integrity, and availability of member information. The [FFIEC IT Examination Handbook (E-Banking booklet)](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) and [FFIEC Authentication Guidance (2021)](https://www.ffiec.gov/press/pdf/2021-FFIEC-Authentication-Guidance.pdf) require periodic risk assessments of internet-banking channels and layered security controls commensurate with identified risks. [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) establishes the safeguards principle for nonpublic personal information handled online.

**SYSTEM BEHAVIOR:** The credit union conducts an annual e-commerce risk assessment covering all channel controls — authentication, network access, encryption, virus protection, monitoring, and contingency arrangements. The assessment identifies internal and external threats, evaluates the effectiveness of existing controls, and produces findings that drive control modifications or additions. Results are reviewed by the CCO and reported to the Board. Periodic assessments (e.g., triggered by material technology or service changes) supplement the annual cycle. The risk assessment record is write-restricted to the CCO and CIO; read access is granted to Information Security and Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual assessment cycle opens (`ecommerce.risk_assessment.started`) | Prior assessment results (`ecommerce.risk.assessment.due`), current control inventory (`control.register`), threat catalog (`risk.threat_catalog`), vendor arrangements (`vendor.service_description`) | Completed risk assessment report + `ecommerce.risk_assessment.completed` | Annually (internal: complete before fiscal year-end; enforced by `ecommerce.risk_assessment_due`) |
| Material technology or service change deployed (`change.completed`) | Change record (`change.rfc`), risk rating (`change.risk_rating`), prior assessment delta (`eps.risk_assessment.delta`) | Updated risk assessment or documented rationale for no change + `ecommerce.risk_assessment.completed` | Within 30 days of change (internal: 15 BD) |
| Assessment finding identifies control gap (`finding.opened`) | Finding description (`finding.description`), severity (`finding.severity`), responsible party (`finding.responsible_party`) | Finding record + remediation task + `finding.corrective_action.logged` | Remediation per finding severity; critical findings within 30 days |

**ALERTS/METRICS:** Alert when `ecommerce.risk_assessment_due` is within 30 days and no `ecommerce.risk_assessment.completed` event exists for the current cycle. Track count of open critical findings from the assessment; target zero unaddressed critical findings beyond their remediation deadline.

---

## EC-02 — Network and Data Access Controls {#ec-02-network-and-data-access-controls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to prevent unauthorized access to member information systems. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires verification and enforcement of authorized access rights using layered controls including logical and physical access mechanisms.

**SYSTEM BEHAVIOR:** The credit union enforces access to the e-commerce network, applications, and data through a combination of logical controls (user IDs, passwords with regular updates, member-set security questions) and physical controls (locked computer room with combination lock or equivalent). Software and hardware security devices — including anti-virus software, firewalls, and monitoring software — form additional layers. Access rights are provisioned based on job function and reviewed periodically; unauthorized individuals are prohibited from entering operations facilities, retrieving confidential information, or accessing credit union software and operating systems. Access provisioning and deprovisioning are write-restricted to the CIO/IT Department with CCO oversight; access review results are logged and retained.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New user requires system access (`access.entitlement.requested`) | User identity (`user.id`), role (`user.role`), manager approval (`access.manager_approval`), job-function justification (`access.justification`) | Access grant record + `access.granted` | Before first system use (internal: 1 BD from approval) |
| Periodic access review cycle opens (`access_review.completed`) | Current user roster (`access.user_roster`), role entitlements (`access.role_entitlements`), last review date (`access.last_reviewed_at`) | Access review attestation + `access.review.completed` | Annually (internal: quarterly spot-check; enforced by `access.review_due_at`) |
| User separated or role changed (`employee.separated` or `employee.role.changed`) | Employee record (`employee.id`), separation/change date, access scope (`access.role_entitlements`) | Deprovisioning record + `access.deprovisioned` | Same day as separation; role change within 1 BD (enforced by `access.deprovision_due_at`) |
| Unauthorized access attempt detected (`ecommerce.login.failed`) | Login ID (`member_credential.login_id`), failure count (`eps.auth.failure_count`), session metadata (`web.session`) | Lockout record + `ecommerce.credential.locked` + `ecommerce.lockout.recorded` | Immediate upon threshold breach (enforced by `eps.auth_failure_threshold.reached`) |

**ALERTS/METRICS:** Alert when access deprovisioning is not completed within 1 BD of a separation event. Alert when access review attestation is overdue per `access.review_due_at`. Monitor failed-login rate; alert on anomalous spikes exceeding baseline by 2× within any 1-hour window.

---

## EC-03 — Member Enrollment and Identity Verification {#ec-03-member-enrollment-and-identity-verification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to authenticate users before granting access to member information. The [FFIEC Authentication Guidance (2021)](https://www.ffiec.gov/press/pdf/2021-FFIEC-Authentication-Guidance.pdf) requires risk-based authentication and identity verification prior to credential issuance. [E-SIGN Act 15 USC §7001 et seq.](https://www.law.cornell.edu/uscode/text/15/7001) governs electronic records and member consent to electronic delivery.

**SYSTEM BEHAVIOR:** Members may not complete an e-commerce enrollment application entirely online without identity verification. The applicant must supply related account numbers and submit the application electronically, in person, or by mail. Before any access code or password is issued, staff verify the applicant's identity and confirm the member number. Upon approval, the system issues credentials and sends an email confirmation to the member. The enrollment record — including identity evidence and member-number match result — is write-restricted to Deposit Operations and the CIO/IT Department; the CCO has read access for audit purposes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Enrollment application received (`ecommerce.enrollment.received`) | Applicant identity (`enrollment.applicant_identity`), related account numbers (`enrollment.identity_evidence`), submission channel (`enrollment.channel`) | Enrollment application record + `ecommerce.enrollment.submitted` | Immediate upon receipt |
| Identity and member-number verification completed (`ecommerce.enrollment.verified`) | Identity evidence (`enrollment.identity_evidence`), member-number match result (`enrollment.member_number_match`), verifying staff ID (`user.id`) | Verification record + `ecommerce.enrollment.verified` | Before credential issuance (internal: 1 BD) |
| Enrollment approved and credentials issued (`ecommerce.enrollment.approved`) | Verified enrollment record, member email (`entity.email`), credential parameters (`member_credential.login_id`) | Access code + temporary password issued + `ecommerce.credentials.issued` + `member_credential.issued` | Immediate upon verification approval |
| Email confirmation sent to member (`ecommerce.enrollment_confirmation.sent`) | Member email address (`entity.email`), enrollment approval record | Confirmation email + `ecommerce.enrollment_confirmation.sent` | Immediately after credential issuance |

**ALERTS/METRICS:** Alert when an enrollment application has been received but not verified within 2 BD. Track count of enrollments where credentials were issued without a completed verification record; target zero. Monitor email confirmation delivery failures.

---

## EC-04 — Member Password Standards {#ec-04-member-password-standards}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect the integrity of authentication credentials. The [FFIEC Authentication Guidance (2021)](https://www.ffiec.gov/press/pdf/2021-FFIEC-Authentication-Guidance.pdf) requires that password controls be commensurate with the risk of the channel and the sensitivity of the data accessed.

**SYSTEM BEHAVIOR:** When no password is requested at enrollment, the system issues a randomly generated eight-character temporary password. Members are required to change the temporary password on first access; the system blocks session continuation until the change is made. Passwords must thereafter be changed at least annually. All passwords must meet Fiserv complexity rules: minimum 8 characters, maximum 32 (spaces allowed but not at beginning or end), at least one upper-case letter, at least one lower-case letter, at least one number or special character, must not contain the member's first or last name, must not match or contain the Login ID, must not contain "Fiserv" (any case combination) or "password," and must not repeat any of the prior 5 passwords. Allowed special characters include `!`, `#`, `$`, `%`, `_`, and `-`. Complexity rules are subject to change as provided by the core vendor (Fiserv); the CCO and CIO are responsible for updating this policy when Fiserv standards change. Password hashes are write-restricted to the core system; plaintext passwords are never stored or logged.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| No password requested at enrollment (`ecommerce.enrollment.approved`) | Enrollment approval record, member credential record (`member_credential.login_id`) | 8-character random temporary password + `member_credential.temp_password.issued` | At credential issuance |
| Member first login with temporary password (`ecommerce.login.failed` — temp flag) | Temporary password flag (`member_credential.is_temporary`), session context (`web.session`) | Forced password-change prompt; session blocked until changed + `member_credential.password.changed` | Before any account access is permitted |
| Member sets new password (first access or annual reset) (`member_credential.password.changed`) | New password (`member_credential.new_password`), complexity validation result, prior password history (`member_credential.password_hash` × 5) | Password hash stored; prior hash added to history; `member_credential.password.changed` logged; `member_credential.password_set_at` updated | Immediate |
| Annual password expiry reached (`member_credential.expiry.due`) | Password set date (`member_credential.password_set_at`), member credential record | Expiry prompt sent to member; session requires password change + `member_credential.password.changed` | At 12-month anniversary (enforced by `member_credential.expiry_due`) |

**ALERTS/METRICS:** Alert when the count of active credentials with `is_temporary = true` and age > 30 days exceeds zero — these represent members who have not completed first login. Monitor annual password expiry compliance; alert when more than 5% of active credentials are past their annual change deadline.

---

## EC-05 — Firewalls {#ec-05-firewalls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect the credit union's systems from unauthorized intrusion. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that firewalls protect all connection points between internal and external networks and that they be periodically reviewed and tested.

**SYSTEM BEHAVIOR:** The credit union deploys a combination of hardware and software firewalls to block unwanted inbound and outbound communications while permitting acceptable traffic. Firewalls protect all connection points between the internal network and external networks, including the Internet. The CIO/IT Department conducts periodic internal reviews and tests of firewall rule sets. In addition, an independent provider conducts an annual review and test for intrusion risks. Firewall rule-set changes follow the change-management process. Firewall review records and independent-review reports are retained by IT and are write-restricted to the CIO/IT Department; the CCO has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Periodic internal firewall review cycle (`firewall.review.completed`) | Current firewall rule set, prior review findings, change log | Firewall review record + `firewall.review.completed` | Periodically (internal: at least quarterly; enforced by `firewall.review_due`) |
| Annual independent intrusion-risk review engagement (`firewall.independent_review.started`) | Independent provider contract (`vendor.contract_id`), scope definition (`pentest.scope`), prior year findings | Engagement initiation record + `firewall.independent_review.started` | Annually (internal: Q4; enforced by `firewall.independent_review_due`) |
| Independent review completed and report received (`firewall.independent_review.completed`) | Independent provider report (`pentest.report`), findings list (`finding.description`), remediation recommendations | Independent review report filed + findings opened + `firewall.independent_review.completed` | Within 30 days of engagement start (internal: report received within 15 BD) |
| Firewall rule-set change proposed (`change.rfc.submitted`) | Change request (`change.rfc`), risk rating (`change.risk_rating`), backout plan (`change.backout_plan`), CAB decision (`change.cab_decision`) | Change record + `change.cab_decision.recorded` | Per change-management SLA |

**ALERTS/METRICS:** Alert when `firewall.review_due` is reached and no `firewall.review.completed` event exists for the current period. Alert when `firewall.independent_review_due` is within 30 days and no engagement has been initiated. Track count of open critical firewall findings; target zero beyond remediation deadline.

---

## EC-06 — Encryption and TLS {#ec-06-encryption-and-tls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect the confidentiality and integrity of member information in transit. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires encryption of sensitive data transmitted over public networks. [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards for nonpublic personal information, including in-transit protection.

**SYSTEM BEHAVIOR:** All e-commerce communications use TLS connections with current SSL certificates and up-to-date cipher suites. Encryption is applied to all sensitive or critical data in transit. The SSL certificate and TLS protocol are tested at least annually using Qualys SSL Labs (https://www.ssllabs.com/ssltest/analyze); test results are retained by the IT Department. The CIO/IT Department is responsible for certificate renewal before expiry and for maintaining current cipher suites. TLS configuration records and test results are write-restricted to the CIO/IT Department; the CCO has read access for audit purposes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual TLS/SSL assessment cycle (`tls.assessment.completed`) | Current certificate details (`tls.cipher_suite`), Qualys SSL Labs test execution, prior year rating (`tls.test_rating`) | Qualys test results retained by IT + `tls.assessment.completed` | Annually (enforced by `tls.assessment_due`) |
| TLS certificate approaching expiry (`tls.certificate_expires_at`) | Certificate expiry date (`tls.certificate_expires_at`), renewal request | Certificate renewal initiated + `tls.certificate.renewed` | Before expiry (internal: initiate renewal 60 days prior; enforced by `tls.certificate_expiry_due`) |
| Cipher suite or protocol downgrade detected (`security.downgraded`) | Current cipher suite (`tls.cipher_suite`), downgrade detail, risk assessment | Security finding opened + `security_finding.opened` + `tls.assessment.completed` triggered | Immediate upon detection; remediation within 5 BD |

**ALERTS/METRICS:** Alert when `tls.assessment_due` is within 30 days and no `tls.assessment.completed` event exists for the current year. Alert when `tls.certificate_expiry_due` is within 60 days and no renewal has been initiated. Alert immediately on any cipher-suite downgrade detection.

---

## EC-07 — Transaction Verification and Audit Trails {#ec-07-transaction-verification-and-audit-trails}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to ensure the integrity of electronic transactions and to maintain audit trails. [Regulation E 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) governs electronic fund transfers and requires records sufficient to support error resolution. [E-SIGN Act 15 USC §7001 et seq.](https://www.law.cornell.edu/uscode/text/15/7001) governs the legal enforceability of electronic records and signatures.

**SYSTEM BEHAVIOR:** The credit union's e-commerce member agreements define the procedures for valid and authentic electronic communications and specify that parties intend to be bound by communications complying with those procedures. The system maintains audit trails for all transactions, identifying the initiating party, transaction type, timestamp, and session context. Audit trails are used to verify specific transactions and to rebut repudiation claims by members. Transaction and audit log records are immutable once written; write access is restricted to the core system; read access for dispute resolution is granted to Deposit Operations and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member initiates an e-commerce transaction (`ecommerce.transaction.initiated`) | Member identity (`member.id`), session authentication record (`ecommerce.session_authenticated`), transaction type (`transaction.type`), transaction amount (`transaction.amount`), initiating party (`transaction.initiated_by`) | Immutable audit trail entry + `ecommerce.audit_trail.recorded` | Immediate upon transaction initiation |
| Repudiation claim received from member (`ecommerce.repudiation_claim.received`) | Member identity (`member.id`), claimed transaction details, audit trail records (`ecommerce.audit_trail.recorded`), e-commerce agreement reference | Repudiation review record + `ecommerce.repudiation.reviewed` | Review initiated within 1 BD of claim receipt |
| Repudiation review completed (`ecommerce.repudiation.reviewed`) | Audit trail evidence, agreement terms, review findings | Review outcome documented + `ecommerce.repudiation.reviewed` logged | Within 10 BD of claim receipt (Reg E error-resolution clock may apply) |

**ALERTS/METRICS:** Alert when any transaction event lacks a corresponding `ecommerce.audit_trail.recorded` entry — target zero gaps. Monitor repudiation review aging; alert when any open review exceeds 5 BD without a disposition.

---

## EC-08 — Virus Protection {#ec-08-virus-protection}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect credit union systems from malicious code. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires a malware detection and prevention program covering all systems connected to the e-commerce channel.

**SYSTEM BEHAVIOR:** The credit union maintains a credit-union-wide virus detection and prevention program covering all systems connected to or supporting the e-commerce channel. The program includes end-user acceptable-use policies, training and awareness, anti-virus detection tools with current signature definitions, and enforcement procedures for policy violations. Anti-virus logs are reviewed periodically to identify detections and confirm tool effectiveness. The CIO/IT Department is responsible for maintaining current definitions and for responding to detections; the CCO oversees the program. Anti-virus log review records are write-restricted to the CIO/IT Department.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Anti-virus detection event occurs (`antivirus.remediated`) | Detection details (`antivirus.detection`), affected system, signature version (`antivirus.definitions_version`), remediation action | Detection and remediation record + `antivirus.remediated` | Immediate upon detection; remediation within 4 hours for critical detections |
| Periodic anti-virus log review (`antivirus.log_review.completed`) | Anti-virus log for review period (`antivirus.log.review.due`), prior review findings, definitions currency check (`antivirus.definitions_version`) | Log review record + `antivirus.log_review.completed` | Periodically (internal: monthly; enforced by `antivirus.log_review_due`) |
| Signature definitions update applied (`antivirus.remediated`) | New definitions version (`antivirus.definitions_version`), update source, affected systems | Definitions update record + `antivirus.remediated` | Within 24 hours of vendor release for critical updates |

**ALERTS/METRICS:** Alert when anti-virus definitions on any in-scope system are more than 48 hours behind the current vendor release. Alert when `antivirus.log_review_due` is reached and no `antivirus.log_review.completed` event exists for the current period. Track count of unresolved critical detections; target zero beyond 4-hour remediation window.

---

## EC-09 — Security Monitoring, Penetration Testing, and Intrusion Detection {#ec-09-security-monitoring-penetration-testing-and-intrusion-detection}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires monitoring controls to detect and respond to unauthorized access attempts. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires real-time monitoring, intrusion detection, and periodic penetration testing for internet-banking channels.

**SYSTEM BEHAVIOR:** The credit union deploys monitoring tools to identify vulnerabilities and detect intrusions in real time. Transaction and audit logs are produced on a real-time basis, indicating network traffic and session activity. Systems are configured to notify appropriate parties and to terminate suspicious network connections automatically. An incident database is maintained for trend analysis of network intrusions and attack attempts. The security operations center (currently SecureWorks) monitors the intrusion detection system 24 hours a day, 7 days a week. The credit union engages a bonded outside firm annually to conduct penetration testing; the firm provides test results and recommends manual or automated remediation processes. Penetration test results and monitoring findings are write-restricted to the CIO/IT Department and Information Security; the CCO has read access. Monitoring tool configuration changes follow the change-management process.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Real-time intrusion or suspicious connection detected (`intrusion.detected`) | Intrusion details (`intrusion.severity`), network traffic log (`siem.alert_detail`), SIEM alert (`siem.alert_critical`), session context | SIEM alert record + suspicious connection terminated + `intrusion.detected` + `intrusion.response.recorded` | Immediate (automated); SOC notification within 15 minutes |
| SIEM alert requires human review (`siem.alert.disposed`) | Alert detail (`siem.alert_detail`), alert classification (`siem.alert_confirmed_malicious`), analyst ID | Alert disposition record + `siem.alert.disposed` | Within SLA per alert severity (critical: 1 hour; high: 4 hours; enforced by `siem.alert_review_due_at`) |
| Annual penetration test engagement initiated (`pentest.scheduled`) | Bonded firm contract (`vendor.contract_id`), scope (`pentest.scope`), independence attestation (`pentest.independence`) | Engagement record + `pentest.scheduled` | Annually (internal: Q3; enforced by `pentest.engagement_due`) |
| Penetration test report received (`pentest.report.received`) | Test report (`pentest.report`), findings list, remediation recommendations | Report filed + findings opened + `pentest.report.received` + `pentest.report.issued` | Within 30 days of engagement start |
| Vulnerability finding remediated (`vuln.remediated`) | Vulnerability detail (`vuln.detail`), severity (`vuln.severity`), remediation plan (`vuln.remediation_plan`), evidence | Remediation record + `vuln.remediated` | Per severity: critical within 15 days, high within 30 days (enforced by `vuln.remediation_due_at`) |

**ALERTS/METRICS:** Alert when `pentest.engagement_due` is within 30 days and no engagement has been initiated. Alert when any critical vulnerability finding from a penetration test exceeds its 15-day remediation deadline. Monitor SIEM alert queue depth; alert when critical alerts exceed SLA. Track 24/7 SOC coverage gaps; target zero.

---

## EC-10 — Contingency Planning and Business Continuity {#ec-10-contingency-planning-and-business-continuity}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires that the security program address business continuity and disaster recovery for systems that process member information. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that e-commerce systems be incorporated into the institution's overall contingency planning and that recovery plans be based on a business impact analysis.

**SYSTEM BEHAVIOR:** All e-commerce systems are incorporated into the credit union's overall contingency planning and business continuity efforts. The credit union confirms that its core processor (Fiserv) and e-commerce provider have each addressed disaster recovery and contingency planning. The recovery plan for e-commerce is based on a business impact analysis that evaluates business applications and processes to determine criticality and establishes a prioritized order of business resumption — recovering the most critical functions and systems first. Detailed BCP/DR procedures, RTO/RPO targets, and drill schedules are governed by the Business Continuity Plan Policy; this control establishes the e-commerce channel's participation in and alignment with that program. The CCO and CIO jointly own this control; the BCP record is write-restricted to the CIO/IT Department.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual BIA update cycle opens (`bia.updated`) | Prior BIA (`bia.criticality`), current e-commerce system inventory, member impact assessment (`bia.member_impact`), regulatory dependency (`bia.reg_dependency`) | Updated BIA with e-commerce criticality ratings + `bia.updated` | Annually (enforced by `bia.annual_update_due`) |
| Vendor DR/contingency confirmation required (`vendor.dr.confirmed`) | Core processor DR plan (`vendor.dr_plan`), e-commerce provider DR attestation (`vendor.dr_test_results`), vendor contract terms (`vendor.contract_terms`) | Vendor DR confirmation record + `vendor.dr.confirmed` | Annually, aligned with vendor review cycle (enforced by `vendor.dr_attestation_due`) |
| BCP/DR drill or exercise completed (`drill.completed`) | Drill objectives (`drill.objectives`), e-commerce system scope (`drill.element`), results, after-action report | Drill record + AAR + `drill.completed` + `drill.aar.published` | Per BCP drill schedule (at least annually; enforced by `drill.aar_due_at`) |
| E-commerce system outage or recovery event (`it.failover.executed`) | Outage runbook (`it.outage_runbook`), blast radius assessment (`it.blast_radius_isolated`), recovery steps | Recovery record + `it.failover.executed` | Per RTO defined in BIA |

**ALERTS/METRICS:** Alert when `bia.annual_update_due` is within 30 days and no `bia.updated` event exists for the current cycle. Alert when vendor DR confirmation is overdue per `vendor.dr_attestation_due`. Track e-commerce system RTO achievement in drills; alert when actual recovery time exceeds BIA-defined RTO.

---

## EC-11 — Member E-Commerce Agreement and Electronic Consent {#ec-11-member-e-commerce-agreement-and-electronic-consent}

**WHY (Reg cite):** [E-SIGN Act 15 USC §7001 et seq.](https://www.law.cornell.edu/uscode/text/15/7001) requires member consent to electronic delivery of records and disclosures and establishes the legal enforceability of electronic agreements. [Regulation E 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) requires disclosures to be provided in a form the member can retain; electronic delivery requires prior consent. [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires that e-commerce agreements define valid electronic communication procedures.

**SYSTEM BEHAVIOR:** Before a member is granted e-commerce access, the credit union presents the e-commerce member agreement, which defines the procedures for valid and authentic electronic communications, specifies that parties intend to be bound by compliant communications, and obtains the member's consent to electronic delivery of disclosures. E-SIGN consent is captured and retained as part of the enrollment record. Agreement version is tracked; members are notified of material changes. The agreement and consent record are write-restricted to Deposit Operations; the CCO has read access for compliance review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member presented with e-commerce agreement at enrollment (`application.disclosures.presented`) | Agreement version (`policy.document_version`), member identity (`member.id`), delivery channel (`enrollment.channel`) | Agreement presentation record + `application.disclosures.presented` | Before credential issuance |
| Member provides E-SIGN consent (`privacy.esign_consent.recorded`) | Consent evidence (`member.esign_consent_captured`), consent artifact (`member.esign_consent_evidence`), agreement version | E-SIGN consent record + `privacy.esign_consent.recorded` | At enrollment, before access granted |
| Material change to e-commerce agreement (`policy.revision.published`) | Change description (`policy.change_description`), prior version, effective date (`policy.effective_date`), member notification plan | Updated agreement published + member notification sent + `policy.revision.published` + `comms.notices.sent` | Notice to members before effective date (internal: 30 days prior) |

**ALERTS/METRICS:** Alert when any active e-commerce credential lacks a corresponding `privacy.esign_consent.recorded` event — target zero. Monitor agreement version currency; alert when the deployed agreement version does not match the current approved version.

---

## EC-12 — Expertise and Training {#ec-12-expertise-and-training}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires that the security program include training for staff with responsibilities for member information security. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that institutions assess staffing and training needs for e-commerce systems development, operation, and member support.

**SYSTEM BEHAVIOR:** The credit union relies on its e-commerce system provider (Fiserv) for software development and support. The CCO and CIO jointly assess all personnel involved in e-commerce systems development, operation, and member support to determine whether special staffing or training needs exist. Additional training is provided as deemed appropriate. Training needs are reassessed annually to keep pace with technological changes, personnel changes, and emerging threats. Training completion is tracked per employee; the annual assessment and training records are write-restricted to the CCO and CIO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training needs assessment cycle opens (`training.annual_cycle.opened`) | Current staff roster (`access.user_roster`), role matrix (`training.role_matrix`), prior year assessment, technology change log | Training needs assessment record + `training.annual_cycle.opened` | Annually (internal: complete by Q1; enforced by `training.annual_due`) |
| Training assigned to staff member (`training.assigned`) | Assignee ID (`training.assignee_id`), curriculum (`training.curriculum_id`), due date (`training.completion_due_at`), role (`user.role`) | Training assignment record + `training.assigned` | Within 10 BD of needs assessment completion |
| Training completed by staff member (`training.completed`) | Assignee ID (`training.assignee_id`), module ID (`training.module_id`), completion date, assessment score (`training.assessment_score`) | Completion record + `training.completed` + `training.completion.recorded` | By due date (enforced by `training.completion_due_at`) |
| New hire requires e-commerce training (`employee.hired`) | Hire date (`training_detail.hire_date`), role (`user.role`), onboarding curriculum | Training assignment + `training.assigned` | Within 30 days of hire (enforced by `training.newhire_due_at`) |

**ALERTS/METRICS:** Alert when annual training needs assessment is not completed by Q1 deadline. Alert when any assigned training is overdue per `training.completion_due_at`. Track training completion rate for in-scope staff; target 100% completion within each annual cycle.

---

## EC-13 — Breach Detection, Liability Assessment, and External Comms Gating {#ec-13-breach-detection-liability-assessment-and-external-comms-gating}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A and Appendix B](https://www.ecfr.gov/current/title-12/part-748) require procedures to respond to unauthorized access or use of member information, including management notification, damage assessment, and member notification. [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) requires safeguards that include response procedures for security failures.

**SYSTEM BEHAVIOR:** Upon detection of an unauthorized act or user in the e-commerce channel — whether identified by the SOC, monitoring tools, staff, or member report — the detecting party immediately notifies management (CCO and CIO). Within 24 hours of detection, the credit union determines the extent of damage or disclosure of member information and assesses the potential legal liability the credit union may incur. This assessment feeds the SC-01 reportability determination (see [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) below). External communications — with members, law enforcement agencies, regulatory agencies, and the media — are gated: only designated individuals are authorized to communicate externally. A holding statement is prepared by the designated spokesperson before any external communication is made. Enterprise incident declaration and first-hour response mechanics (IC assignment, first-hour checklist, sitrep cadence, stabilization) proceed per [SC-03](#sc-03-enterprise-incident-declaration-first-hour-response) (embedded below). This control is write-restricted to the CCO and CIO; Deposit Operations and Information Security are required participants in the assessment.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Unauthorized act or user detected in e-commerce channel (`incident.detected`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity assessment (`incident.severity`), detecting party ID | Incident record created + management notified + `incident.created` + `incident.detected` | Immediate upon detection |
| Damage and legal-liability assessment completed (`incident.assessment.completed`) | Incident record (`incident.id`), data scope (`incident.data_scope`), member impact (`incident.member_impact`), legal review (`incident.legal_review`), impact summary (`incident.impact_summary`) | Assessment record + `incident.assessment.completed`; feeds SC-01 reportability determination | Within 24 hours of detection |
| External communication authorized by designated spokesperson (`incident.external_comms.started`) | Designated spokesperson designation (`covered_person.designated`), holding statement (`comms.holding_statement`), approved communication script (`comms.draft_script`), CCO sign-off (`incident.cco_signoff`) | External communication record + `incident.external_comms.recorded` | Only after CCO authorization; holding statement prepared before any external contact |

**ALERTS/METRICS:** Alert when an `incident.detected` event has no corresponding management notification within 15 minutes. Alert when the 24-hour damage-assessment deadline is approaching (at 20 hours) and `incident.assessment.completed` has not been logged. Monitor for any external communication event lacking a prior `incident.cco_signoff` record — target zero.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to notify NCUA of reportable cyber incidents within 72 hours of discovery and to notify affected members without unreasonable delay when sensitive member information has been, or is reasonably believed to have been, accessed or misused. [GLBA 15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801) and the Safeguards Rule underpin the member-notification obligation.

**SYSTEM BEHAVIOR:** When an incident is declared, the CCO (or delegate) evaluates whether it meets NCUA's reportability criteria — unauthorized access to, or misuse of, sensitive member information affecting 500 or more members, or any incident that rises to the level of a "notification incident" under Appendix B. The determination is made as soon as practicable and no later than 72 hours after discovery. If reportable, NCUA is notified via the NCUA's reporting portal; the notification includes the incident ID, discovery date, nature of the incident, affected member count (estimated), and remediation status. Member notification is required when misuse of sensitive information has occurred or is reasonably likely; the notice is sent without unreasonable delay and includes the nature of the incident, the information involved, and steps members can take to protect themselves. Only the CCO or a designated spokesperson may communicate with NCUA, law enforcement, or the media. The reportability determination record and all external notifications are write-restricted to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared and reportability assessment begins (`incident.assessment.started`) | Incident record (`incident.id`), data scope (`incident.data_scope`), member impact (`incident.member_impact`), misuse likelihood (`incident.misuse_likelihood`), legal review (`incident.legal_review`) | Reportability assessment record + `incident.assessment.started` | Immediately upon incident declaration |
| Reportability determination made (`incident.reportable.determined`) | Assessment findings, member count estimate, NCUA criteria checklist, CCO sign-off (`incident.cco_signoff`) | Reportability determination logged + `incident.reportable.determined`; if reportable → NCUA notification task created (`ncua.notification_due_at`) | Within 72 hours of discovery (enforced by `incident.ncua_notice_due_at`) |
| NCUA notified of reportable incident (`ncua.notification.sent`) | Incident ID (`incident.id`), discovery date, nature of incident, estimated affected member count (`incident.member_impact`), remediation status (`incident.reportability_rationale`), designated spokesperson ID (`covered_person.designated`) | NCUA notification record + `ncua.notification.sent` + `incident.ncua.notified` | Within 72 hours of discovery (enforced by `incident.ncua_notice_due_at`) |
| Member notification required (`incident.member_notices.sent`) | Misuse determination (`incident.misuse.determined`), affected member list (`incident.member_impact`), notice template (`incident.member_notice_template`), CCO approval | Member notices sent + `incident.member_notices.sent` + `incident.member.notified` | Without unreasonable delay after misuse determined or reasonably likely (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert at 48 hours post-discovery if `incident.reportable.determined` has not been logged for any open incident. Alert at 60 hours if a reportable incident has no `ncua.notification.sent` event. Alert when `incident.notification_due_at` is reached and `incident.member_notices.sent` has not been logged. Track count of incidents where NCUA notification exceeded 72 hours; target zero.

---

## SC-03 — Enterprise Incident Declaration & First-Hour Response {#sc-03-enterprise-incident-declaration-first-hour-response}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A and B](https://www.ecfr.gov/current/title-12/part-748) require a written incident-response program with defined roles, escalation paths, and response procedures. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that institutions maintain and test incident-response capabilities, including initial triage, containment, and communication procedures.

**SYSTEM BEHAVIOR:** Any staff member who detects or suspects a security incident declares it immediately by creating an incident record. The on-call Incident Commander (IC) is paged automatically; the IC must acknowledge within 15 minutes and assume command of the response. Within the first hour, the IC completes the first-hour checklist: confirm scope, assign response team roles, initiate containment actions, and issue the first situation report (sitrep). Sitreps are issued every 30 minutes during active response. The IC has authority to invoke emergency change procedures and to escalate to the CCO and Board as warranted by severity. All first-hour actions are logged in the incident record. This control applies enterprise-wide; e-commerce-specific detection and damage assessment are handled in [EC-13](#ec-13-breach-detection-liability-assessment-and-external-comms-gating), which feeds this control's declaration trigger.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident declared (`incident.declared`) | Detection source (`incident.detection_source`), initial description (`incident.description`), declaring staff ID (`user.id`), severity estimate (`incident.severity`) | Incident record created + IC paged + `incident.declared` + `incident.created` | Immediate upon detection |
| IC acknowledges and assumes command (`incident.ic.assigned`) | On-call IC roster (`oncall.ic_rotation`), incident record (`incident.id`), severity (`incident.severity`) | IC assignment logged + `incident.ic.assigned` | Within 15 minutes of declaration (enforced by `incident.ic_assignment_timer`) |
| First-hour checklist completed (`incident.first_hour.completed`) | Scope confirmation (`incident.scope`), containment actions (`incident.contained`), team roster, sitrep v1 (`sitrep.v1_timer`) | First-hour checklist record + first sitrep issued + `incident.first_hour.completed` + `sitrep.issued` | Within 1 hour of declaration |
| Sitrep issued during active response (`sitrep.issued`) | Current incident status, containment progress (`incident.contained`), next actions, IC ID | Sitrep record + `sitrep.issued` | Every 30 minutes during active response (enforced by `sitrep.cadence_timer`) |
| Containment achieved (`incident.containment.started`) | Containment evidence (`incident.contained`), blast radius assessment (`it.blast_radius_isolated`), IC sign-off | Containment record + `incident.containment.started` | As soon as technically feasible; IC declares containment |

**ALERTS/METRICS:** Alert when IC acknowledgement has not been logged within 15 minutes of `incident.declared`. Alert when `incident.first_hour.completed` has not been logged within 65 minutes of declaration. Alert when sitrep cadence lapses beyond 35 minutes during active response. Track mean time to containment; target per severity tier defined in the BCP.

---

## EC-14 — Governance and Annual Policy Review {#ec-14-governance-and-annual-policy-review}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires the Board of Directors to approve the written security program and to review it at least annually. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/pdf/e-banking_final6-03.pdf) requires that e-commerce policies be reviewed and updated to reflect changes in technology, services, and business arrangements.

**SYSTEM BEHAVIOR:** The Board of Directors approves the written e-commerce policy. The CCO is responsible for development, implementation, and maintenance of the policy. Management reviews the policy at least annually and modifies it as necessary to reflect changes in technology, services, personnel, and business arrangements. The CIO, Deposit Operations, and Information Security are required participants in the annual review. The approved policy version is distributed to all relevant staff; acknowledgment is tracked. Policy records are write-restricted to the CCO; the Board resolution approving the policy is retained in Board minutes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle opens (`policy.board_review.started`) | Current policy version (`policy.document_version`), prior year review findings, technology and service change log, regulatory change inventory (`regulation.citation`) | Review initiated + `policy.board_review.started` | Annually (internal: initiate 60 days before anniversary; enforced by `policy.review_due_at`) |
| Policy review completed and draft submitted for Board approval (`policy.review.submitted`) | Redlined draft (`policy.draft_redline`), change summary (`policy.change_summary`), CCO sign-off, CIO and Information Security concurrence | Draft policy + `policy.review.submitted` | At least 30 days before Board meeting |
| Board approves policy (`policy.board.approved`) | Board resolution ID (`board.resolution_id`), meeting date (`board.meeting_date`), approved policy version | Board approval record + `policy.board.approved` + `governance.policy.approved` | Annually (enforced by `policy.board_approval_due_at`) |
| Policy distributed to staff (`policy.distribution.logged`) | Approved policy version, staff roster, distribution channel | Distribution record + acknowledgment tasks created + `policy.distribution.logged` | Within 5 BD of Board approval |

**ALERTS/METRICS:** Alert when `policy.review_due_at` is within 60 days and no `policy.board_review.started` event exists. Alert when `policy.board_approval_due_at` is within 30 days and no `policy.board.approved` event exists for the current cycle. Track staff acknowledgment completion rate; alert when below 100% at 30 days post-distribution.

---

## Governance & Sign-Off {#governance}

| Role | Name | Responsibility |
|---|---|---|
| Policy Owner | Patrick Wilson, Chief Compliance Officer | Development, maintenance, annual review, Board submission |
| Required Participant | CIO / IT Department | Network, encryption, firewall, monitoring, and contingency controls |
| Required Participant | Deposit Operations | Member enrollment, credential issuance, transaction verification |
| Required Participant | Information Security | Security monitoring, penetration testing, incident response |
| Approver | Board of Directors | Annual approval of written policy |

**Review cadence:** At least annually, or sooner upon material changes in technology, services, personnel, or regulatory requirements.

**Cross-references:**
- Electronic Payment Systems Policy — backend payment rails (ACH, wires, cards, bill pay, RDC)
- Information Security Policy — cybersecurity and information-security controls
- BSA Policy — Customer Identification Program for online account opening
- Privacy Policy — online privacy notices, cookies, third-party app connections
- Third-Party Risk Policy — oversight of Fiserv and other online-service vendors
- Business Continuity Plan Policy — detailed BCP/DR procedures, RTO/RPO targets, drill schedules
- Shared control `SC-01` — NCUA Reportable Cyber-Incident & Member Notification (shared across seven policies)
- Shared control `SC-03` — Enterprise Incident Declaration & First-Hour Response (shared across consuming policies)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are composed per the Composition grammar from registered objects, properties, and actions but are not yet confirmed as registered in `core-vocabulary.json`. Specifically: `ecommerce.risk.assessment.due` (composed from `ecommerce` + `risk` property + `assessment.due` timer pattern), `enrollment.applicant_identity`, `enrollment.identity_evidence`, `enrollment.member_number_match`, `enrollment.channel` (the `enrollment` object has registered fields in DESIGN_NOTES but the specific field codes above are provisional spellings), and `ecommerce.session_authenticated` (registered as a field on `ecommerce` but its use as a session-context reference in EC-07 is provisional). All codes used in this document follow the registered-object + registered-action grammar; engineering should confirm or adjust spellings before the next review.

- **Shared control SC-01 embeddable block.** The LOCAL OVERRIDES instruct this document to emit SC-01 verbatim from `shared-controls/ncua-incident-notification.md`. The block above represents the policy author's best synthesis of that control consistent with NCUA 12 CFR Part 748 Appendix B and the DESIGN_NOTES vocabulary. The byte-identical version must be confirmed against the canonical shared-controls file before publication.

- **Shared control SC-03 embeddable block.** Similarly, SC-03 above represents the policy author's synthesis consistent with the LOCAL OVERRIDES instruction to emit from `shared-controls/incident-declaration.md`. The canonical file must be confirmed before publication to ensure byte-identity across all consuming policies.

- **Firewall review frequency.** PATRICK_NOTES states "periodically" for internal firewall reviews. This document assumes quarterly as the internal SLA. The CIO should confirm the intended frequency; if a different cadence is operationally appropriate, update EC-05 and the Timing Matrix accordingly.

- **Penetration test timing.** PATRICK_NOTES does not specify a quarter for the annual penetration test. This document assumes Q3 as the internal target. The CIO should confirm the preferred scheduling window.

- **Anti-virus log review frequency.** PATRICK_NOTES states the program includes log review but does not specify frequency. This document assumes monthly as the internal SLA. The CIO should confirm.

- **Fiserv complexity rules are subject to change.** EC-04 notes that password complexity rules are subject to change as provided by Fiserv. When Fiserv updates its standards, the CCO and CIO must update this policy and the system configuration within 30 days of notification. No assumption is made about the change process beyond what is stated; a formal change-notification procedure with Fiserv should be confirmed in the Third-Party Risk Policy or vendor contract.

- **E-SIGN consent scope.** EC-11 assumes that E-SIGN consent is captured at enrollment and covers electronic delivery of all disclosures delivered through the e-commerce channel, including Regulation E disclosures. If the credit union's E-SIGN consent form has a narrower scope, EC-11 and the Privacy Policy should be reviewed together to ensure all required disclosures are covered.

- **Regulation E applicability.** EC-07 notes that the Reg E error-resolution clock may apply to repudiation reviews. The specific Reg E timelines (10 BD for provisional credit, 45 BD for investigation) are governed by the Electronic Payment Systems Policy. This policy does not duplicate those timelines; the cross-reference in EC-07 is a reminder to Deposit Operations to coordinate.

- **SOC provider identity.** The REFERENCE_POLICY names SecureWorks as the 24/7 SOC provider. This document preserves that reference. If the provider has changed, update EC-09 and the Third-Party Risk Policy vendor inventory accordingly.

- **Board approval as sole approver.** The OWNER & APPROVERS input lists only Patrick Wilson, CCO, as approver. NCUA 12 CFR Part 748 Appendix A requires Board approval of the written security program. This document reflects Board approval as the governance requirement; the CCO's role is as policy owner and preparer. If the credit union's governance structure routes Board approval through a committee, confirm the approval chain and update the Governance & Sign-Off section.

- **Incident commander on-call roster.** SC-03 references `oncall.ic_rotation` as the source for IC paging. This roster must be maintained and tested; responsibility for roster currency should be confirmed with the CIO and documented in the Business Continuity Plan Policy.
