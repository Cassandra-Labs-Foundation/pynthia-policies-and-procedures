---
title: E-Commerce Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, E-Commerce, Online Banking, Mobile Banking, Authentication, Member Information Security]
---

# E-Commerce Policy

## General Policy Statement

Pynthia Credit Union identifies, measures, monitors, and controls the risks arising from its electronic-commerce channels — the computer hardware, software, and telecommunication systems, operating over public networks such as the Internet, that let members access account and general credit-union information and conduct transactions online and by mobile device. Risk in this domain concentrates in the public-network attack surface and in member authentication: malicious attacks, viruses, employee misuse of sensitive information, hardware/software failure, disasters, and unauthorized account access. This policy therefore establishes layered preventive, detective, and recovery controls over the consumer-facing channel layer — what we offer online, how members enroll and authenticate, and the business rules that surround it — and assigns clear accountability for each. Backend payment rails, cybersecurity and information-security program detail, CIP for online account opening, online privacy notices, vendor oversight, and business-continuity detail live in adjacent policies (see [Governance & Sign-Off](#governance--sign-off)). The Board approves this written policy and reviews it at least annually.

## Timing Matrix

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Member enrolls in e-commerce services | Enrollment application received (`ecommerce.enrollment_submitted`) | Identity and member-number verified **before** access granted; email confirmation on approval | Enrollment procedure, verification steps | [EC-03](#ec-03--member-enrollment-and-identity-verification) |
| First login with temporary password | Member's initial access (`ecommerce.session_authenticated`) | Password change forced **on first access** | Fiserv complexity rules | [EC-05](#ec-05--member-password-standards) |
| Routine password aging | Password age reaches 12 months (`member_credential.expiry_due`) | At least **annually** | Fiserv complexity rules | [EC-05](#ec-05--member-password-standards) |
| Firewall review and test | Scheduled review cycle (`firewall.review_due`) | **Periodic** internal review; **annual** independent intrusion-risk review and test | Firewall rule set, test scope | [EC-06](#ec-06--firewalls) |
| TLS/SSL certificate and protocol test | Scheduled test cycle (`tls.assessment_due`) | At least **yearly** (e.g., Qualys SSL Labs); results retained with IT | Certificate inventory, cipher configuration | [EC-07](#ec-07--encryption) |
| Penetration test by bonded outside firm | Engagement cycle (`pentest.engagement_due`) | At least **annually**; remediation tracked to closure | Test scope, remediation recommendations | [EC-10](#ec-10--security-monitoring-penetration-testing-and-intrusion-detection) |
| Suspected intrusion or unauthorized act detected | SOC or monitoring alert (`intrusion.detected`) | Management notified **immediately**; suspicious connections terminated in real time | Incident details, damage/disclosure assessment | [EC-11](#ec-11--breach-of-security-response) |
| Reportable cyber incident confirmed | Reportability determination (`incident.regulator_notification_due`) | NCUA notified within **72 hours** | Incident assessment, reporting criteria | [EC-11](#ec-11--breach-of-security-response) |
| Training-needs reassessment | Annual assessment cycle (`training.assessment_due`) | At least **annually** | Staffing and skills inventory | [EC-13](#ec-13--expertise-and-training) |
| Board policy review | Annual governance cycle (`policy.review_due`) | At least **annually** | This policy | [Governance & Sign-Off](#governance--sign-off) |

## EC-01 — Safeguarding Member Information

- **WHY (Reg cite):** NCUA Part 748 and [Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) require a board-approved security program that protects the confidentiality, integrity, and availability of member information across all channels, implementing the GLBA safeguards principle ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** All e-commerce systems apply end-to-end security controls to critical member data: data integrity checks on transmission and storage, member-privacy protections, and intrusion/misuse/fraud prevention spanning the channel from the member's device to the core. This control is the umbrella under which [EC-02](#ec-02--network-and-data-access-controls) through [EC-10](#ec-10--security-monitoring-penetration-testing-and-intrusion-detection) operate; the detailed technical standards live in the Information Security Policy. The channel risk assessment that drives control selection is refreshed when threats, technology, or vendor arrangements change. Risk-assessment records are write-restricted to Information Security and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual channel risk assessment or material change to threats/technology/vendors (`ecommerce.risk_assessment_started`) | Threat inventory (`risk_assessment.threats[]`), current control catalog (`risk_assessment.controls[]`), vendor dependency list (`risk_assessment.vendors[]`) | Updated e-commerce risk assessment with control decisions (`ecommerce.risk_assessment_completed`) | Annually (internal: completed before Board policy review; tracked by `ecommerce.risk_assessment_due`) |

- **ALERTS/METRICS:** Risk-assessment age (target: never older than 12 months); count of controls rated below target effectiveness and unresolved past one review cycle (target zero).

## EC-02 — Network and Data Access Controls

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls on member information systems, including authentication and physical restrictions, per GLBA ([15 USC §6801(b)](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** The credit union verifies and enforces each user's authorized right to access the network, applications, and data before access is granted. Enforcement layers include unique user IDs; passwords with regular updates; member-set security questions; physical controls such as the locked computer room; and software/hardware security devices (anti-virus, firewall, and monitoring software). Unauthorized individuals are prohibited from entering operations facilities, retrieving confidential information, or reaching credit-union applications and operating systems. Access-rights grants and revocations are write-restricted to IT administrators with Information Security approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Access right granted, changed, or revoked for a user (`access_right.changed`) | User identity (`user.id`), role/job function (`user.role`), approver (`access_right.approved_by`) | Updated access-control list entry (`access_right.recorded`) | Same business day as authorization (—) |
  | Periodic access-rights recertification (`access_review.due`) | Current entitlement list (`access_right.entitlements[]`), HR roster (`user.employment_status`) | Recertification report; stale rights removed (`access_review.completed`) | Per Information Security Policy cadence (internal: exceptions closed within 10 BD) |

- **ALERTS/METRICS:** Count of access rights not matched to an active role (target zero); recertification completion rate (target 100% on schedule); failed-access attempts trending by source.

## EC-03 — Member Enrollment and Identity Verification

- **WHY (Reg cite):** The FFIEC E-Banking booklet and the FFIEC Authentication and Access to Financial Institution Services and Systems guidance (2021) call for verifying customer identity before issuing internet-banking credentials; NCUA Part 748 [Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires controls against unauthorized access to member information. E-SIGN ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)) governs electronic delivery of the enrollment agreement and confirmations.
- **SYSTEM BEHAVIOR:** The credit union identifies the member before issuing any authorization code; once identified, the member is assigned an access code and password. Members may not complete an e-commerce enrollment application fully online: the applicant must supply the related account numbers and submit the application electronically, in person, or by mail. Staff verify the applicant's identity and member number before access is granted, and the system sends an email confirmation notifying the member that access has been approved as submitted. Enrollment approval is write-restricted to Deposit Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Enrollment application received electronically, in person, or by mail (`ecommerce.enrollment_submitted`) | Related account numbers (`enrollment.account_numbers[]`), applicant identity (`enrollment.applicant_identity`), submission channel (`enrollment.channel`) | Enrollment record opened for verification (`ecommerce.enrollment_received`) | — |
  | Identity and member-number verification completed (`ecommerce.enrollment_verified`) | Member record (`entity_id`), identity evidence (`enrollment.identity_evidence`), member-number match result (`enrollment.member_number_match`) | Access code and temporary password issued; verification outcome recorded (`ecommerce.credentials_issued`) | Before any access is granted (internal: 2 BD from receipt) |
  | Enrollment approved (`ecommerce.enrollment_approved`) | Member email address (`entity.email`) | Email confirmation that access was approved as submitted (`ecommerce.enrollment_confirmation_sent`) | Same business day as approval (—) |

- **ALERTS/METRICS:** Enrollment-to-verification aging (alert at 2 BD); count of credentials issued without a recorded verification outcome (target zero); confirmation-email delivery failure rate.

## EC-04 — Login Authentication

- **WHY (Reg cite):** FFIEC Authentication guidance (2021) requires risk-based authentication of each session for internet-accessible services; NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires authentication controls protecting member information systems.
- **SYSTEM BEHAVIOR:** Each time a member attempts to access the e-commerce system, the system authenticates the member's identity using the assigned access code and password, supplemented by member-set security questions per [EC-02](#ec-02--network-and-data-access-controls). Only after authentication passes may the member view account information or initiate online transactions. Failed-authentication attempts are throttled and logged; repeated failures lock the credential pending re-verification under the [EC-03](#ec-03--member-enrollment-and-identity-verification) identity procedures. Credential unlock is write-restricted to Deposit Operations after member identity is re-verified.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member attempts login (`ecommerce.login_attempted`) | Access code (`member_credential.login_id`), password verification (`member_credential.password_hash`), challenge answers when invoked (`member_credential.security_questions`) | Authenticated session opened or failure recorded (`ecommerce.session_authenticated` / `ecommerce.login_failed`) | Real time (—) |
  | Failed-attempt threshold reached (`ecommerce.credential_locked`) | Failure count (`member_credential.failed_attempts`), member contact details (`entity.email`) | Credential lock; member notified; re-verification case opened (`ecommerce.lockout_recorded`) | Immediately on threshold (—) |

- **ALERTS/METRICS:** Failed-login rate and lockout volume trended daily; spike alerts on anomalous failure clusters (possible credential-stuffing); count of sessions opened without an authentication record (target zero).

## EC-05 — Member Password Standards

- **WHY (Reg cite):** FFIEC Authentication guidance (2021) and NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) require effective credential controls commensurate with the risk of internet-delivered services.
- **SYSTEM BEHAVIOR:** When no password is requested at enrollment, the system issues a randomly generated eight-character temporary password. Members are required to change the temporary password at first access and at least annually thereafter. All passwords must satisfy the core-vendor (Fiserv) complexity standard, which may change as the vendor updates it: minimum length 8, maximum length 32 (spaces allowed but not at start or end); at least one upper-case letter, one lower-case letter, and one number or special character (allowed: `!`, `#`, `$`, `%`, `_`, `-`); no first or last name, no Login ID match or content, no "Fiserv" or "password" in any case combination; and no reuse of the prior 5 passwords. Password-policy parameters are write-restricted to IT in coordination with the core vendor.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Temporary password issued at enrollment (`member_credential.temp_password_issued`) | Verified enrollment record (`ecommerce.enrollment_verified`), random generator output (`member_credential.temp_password`) | Eight-character temporary credential delivered to member (`member_credential.issued`) | With credential issuance per [EC-03](#ec-03--member-enrollment-and-identity-verification) (—) |
  | First member login with temporary password (`ecommerce.session_authenticated`) | Temporary-credential flag (`member_credential.is_temporary`), new password meeting complexity rules (`member_credential.new_password`) | Forced password change completed (`member_credential.password_changed`) | On first access, before any other function (—) |
  | Password age reaches 12 months (`member_credential.expiry_due`) | Password set date (`member_credential.password_set_at`) | Forced change at next login; change recorded (`member_credential.password_changed`) | At least annually (enforced by `member_credential.expiry_due`) |

- **ALERTS/METRICS:** Percentage of active credentials older than 12 months (target zero); temporary passwords unredeemed beyond 30 days (alert); complexity-rule rejection rate at password change.

## EC-06 — Firewalls

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access restrictions and protection of member information systems connected to external networks, consistent with GLBA ([15 USC §6801(b)](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** Firewalls combining hardware and software block unwanted communication into and out of the credit-union network while permitting acceptable traffic, and protect every connection point between internal and external networks, including the Internet. IT reviews and tests the firewall configuration periodically, and an independent provider conducts an annual intrusion-risk review and test. Firewall rule changes are write-restricted to authorized IT network administrators with change-management approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Periodic internal firewall review (`firewall.review_due`) | Current rule set (`firewall.rules[]`), connection-point inventory (`network.connection_points[]`) | Review/test report; rule corrections applied (`firewall.review_completed`) | Periodic per IT schedule (internal: at least annually; tracked by `firewall.review_due`) |
  | Independent intrusion-risk review engaged (`firewall.independent_review_started`) | Engagement scope (`engagement.scope`), provider credentials (`engagement.provider`) | Independent review and test report; findings logged for remediation (`firewall.independent_review_completed`) | Annually (tracked by `firewall.independent_review_due`) |

- **ALERTS/METRICS:** Days since last internal review and last independent review (alert before due date); count of open firewall findings past remediation date (target zero); blocked-traffic anomaly trends.

## EC-07 — Encryption

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires encryption of electronic member information where appropriate, implementing the GLBA safeguards principle ([15 USC §6801(b)](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** All e-commerce communications, and all transmission of sensitive or critical data, use TLS connections with current SSL certificates and up-to-date underlying ciphers. The SSL certificate and TLS protocol undergo at least a yearly test (e.g., [Qualys SSL Labs](https://www.ssllabs.com/ssltest/analyze)) to determine the security rating, and the results are retained on file with the IT department. Certificate issuance, renewal, and cipher configuration are write-restricted to IT.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual TLS/SSL assessment due (`tls.assessment_due`) | Certificate inventory (`tls.certificates[]`), cipher configuration (`tls.cipher_suite`), test tool output (`tls.test_rating`) | Test report with security rating filed with IT (`tls.assessment_completed`) | At least yearly (tracked by `tls.assessment_due`) |
  | Certificate approaching expiry (`tls.certificate_expiry_due`) | Certificate expiry date (`tls.certificate_expires_at`) | Renewed certificate deployed (`tls.certificate_renewed`) | Before expiry (internal: renew 30 days prior; enforced by `tls.certificate_expiry_due`) |

- **ALERTS/METRICS:** SSL Labs rating below target grade (alert); certificates within 30 days of expiry (alert, target zero expired); count of endpoints accepting deprecated protocol versions (target zero).

## EC-08 — Transaction Verification and Non-Repudiation

- **WHY (Reg cite):** E-SIGN ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)) gives legal effect to electronic records and signatures the parties agree to use; Regulation E ([12 CFR §1005.6](https://www.ecfr.gov/current/title-12/part-1005/section-1005.6) and [§1005.11](https://www.ecfr.gov/current/title-12/part-1005/section-1005.11)) makes records of who initiated an electronic fund transfer essential to resolving liability and error claims.
- **SYSTEM BEHAVIOR:** Member e-commerce agreements define the procedures for valid and authentic electronic communications between the credit union and its members and state that the parties intend to be bound by communications complying with those procedures. The system maintains audit trails identifying the party that initiated each transaction; the credit union uses these trails to verify specific transactions and to rebut repudiation claims. Error investigation and dispute handling under Regulation E follow the Electronic Payment Systems Policy; this control supplies the evidentiary trail. Audit-trail records are immutable, and read access is restricted to Compliance, Internal Audit, and authorized Deposit Operations staff.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member initiates a transaction in the channel (`ecommerce.transaction_initiated`) | Authenticated session (`ecommerce.session_authenticated`), member identity (`entity_id`), transaction details (`transaction.amount`, `transaction.type`) | Audit-trail entry binding the initiator to the transaction (`ecommerce.audit_trail_recorded`) | Real time, atomically with the transaction (—) |
  | Repudiation or dispute claim received (`ecommerce.repudiation_claim_received`) | Audit-trail entries (`ecommerce.audit_trail[]`), member agreement version (`agreement.version`) | Verification finding supporting or rebutting the claim (`ecommerce.repudiation_reviewed`) | Per Reg E error-resolution timelines in the Electronic Payment Systems Policy (internal: trail retrieved within 1 BD) |

- **ALERTS/METRICS:** Count of channel transactions lacking a complete audit-trail entry (target zero, reconciled daily); audit-trail retrieval latency for disputes (target ≤ 1 BD).

## EC-09 — Virus Protection

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires measures to protect against malicious-code attacks on member information systems.
- **SYSTEM BEHAVIOR:** The credit union maintains a credit-union-wide virus detection and prevention program comprising end-user policies, training and awareness programs, anti-virus detection tools deployed across endpoints and servers, and enforcement procedures for violations. Virus-protection logs are reviewed as part of the periodic security assessments under [EC-01](#ec-01--safeguarding-member-information). Anti-virus configuration and exclusions are write-restricted to IT.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Malware detected on any system (`antivirus.detection`) | Affected host (`endpoint.id`), signature/indicator (`antivirus.signature`), user context (`user.id`) | Quarantine/removal action and incident record (`antivirus.remediated`); escalation to [EC-11](#ec-11--breach-of-security-response) if member data exposed | Immediate quarantine (internal: remediation within 1 BD) |
  | Periodic anti-virus log review (`antivirus.log_review_due`) | Detection logs (`antivirus.logs[]`), signature-update status (`antivirus.definitions_version`) | Log-review record with exceptions noted (`antivirus.log_review_completed`) | Per security-assessment cycle (—) |

- **ALERTS/METRICS:** Endpoints with anti-virus definitions stale beyond 7 days (target zero); detections per month trended; repeat-infection hosts flagged for enforcement.

## EC-10 — Security Monitoring, Penetration Testing, and Intrusion Detection

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires monitoring systems to detect attacks and intrusions into member information systems and regular testing of key controls; FFIEC Authentication guidance (2021) reinforces layered detection for internet channels.
- **SYSTEM BEHAVIOR:** Monitoring tools identify vulnerabilities and detect possible intrusions from external and internal parties in real time. Systems produce real-time transaction and network audit logs, notify the proper parties, and terminate suspicious network connections automatically. A bonded outside firm specializing in financial-institution security conducts penetration testing — simulating actions of both unauthorized and authorized users against passwords, firewalls, encryption, and other controls — reports results, and recommends manual or automated remediation; because attacker tactics change, penetration tests are treated as point-in-time assurance, not a guarantee. Management maintains an incident database for trend analysis of intrusions and attack attempts, and the intrusion-detection system is monitored 24/7 by a security operations center. Staff report suspected security breaches promptly to management per [EC-11](#ec-11--breach-of-security-response). Monitoring-tool configuration is write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Suspicious network activity detected (`intrusion.detected`) | Real-time traffic logs (`network.traffic_logs[]`), source/destination (`network.connection`), severity score (`intrusion.severity`) | SOC notification; suspicious connection terminated; incident-database entry (`intrusion.response_recorded`) | Real time, 24/7 SOC coverage (—) |
  | Annual penetration-test engagement (`pentest.engagement_due`) | Scope (`engagement.scope`), bonded-firm credentials (`engagement.provider`), prior findings (`pentest.prior_findings[]`) | Penetration-test report with remediation recommendations (`pentest.report_received`) | At least annually (tracked by `pentest.engagement_due`) |
  | Remediation item opened from a test or monitoring finding (`security_finding.opened`) | Finding details (`security_finding.description`), risk rating (`security_finding.severity`), owner (`security_finding.owner`) | Remediation completed and verified (`security_finding.closed`) | Per severity-based SLA (internal: high severity within 30 days; tracked by `security_finding.due_at`) |
  | Quarterly incident-trend analysis (`incident_trend.review_due`) | Incident database (`incident.records[]`) | Trend report to management (`incident_trend.report_issued`) | Quarterly (—) |

- **ALERTS/METRICS:** Mean time to detect and to terminate suspicious connections; open high-severity findings past 30 days (target zero); SOC coverage gaps (target zero); intrusion-attempt trend by vector.

## EC-11 — Breach of Security Response

- **WHY (Reg cite):** NCUA Part 748 [Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) (response programs for unauthorized access to member information) requires an incident-response program including member notice where warranted, and [12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/section-748.1) requires reporting certain cyber incidents to the NCUA within 72 hours.
- **SYSTEM BEHAVIOR:** On detection of an unauthorized act or user, the credit union initiates intrusion-response procedures: management is notified immediately of the cause and scope; the extent of damage or disclosure of member information is determined, including potential legal liability; and response activities are executed covering communications with members, law enforcement, regulators, and the media. Only designated individuals are authorized to communicate with those external parties; all other staff route inquiries to them. Regulatory notification timing, including the NCUA 72-hour reportable-cyber-incident rule, is coordinated by Compliance. The incident record and external-communication log are write-restricted to the designated incident-response team.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Unauthorized act or user detected (`intrusion.detected`) | Detection details (`incident.detection_source`), affected systems/members (`incident.scope`) | Immediate management notification; incident opened (`incident.opened`) | Immediately (—) |
  | Damage and disclosure assessment begins (`incident.assessment_started`) | Affected data inventory (`incident.affected_data[]`), member impact list (`incident.affected_members[]`), legal-liability analysis (`incident.legal_review`) | Documented assessment of damage, disclosure, and liability (`incident.assessment_completed`) | As soon as practicable (internal: initial assessment within 24 hours) |
  | Reportable cyber incident determined (`incident.regulator_notification_due`) | Assessment findings (`incident.assessment_completed`), NCUA reporting criteria (`incident.reportability_determination`) | NCUA notification filed (`incident.regulator_notified`) | 72 hours from reasonable belief a reportable incident occurred (enforced by `incident.regulator_notification_due`) |
  | External communications executed (`incident.external_comms_started`) | Designated-spokesperson roster (`incident.designated_communicators[]`), approved messaging (`incident.comms_plan`) | Member, law-enforcement, regulator, and media communications logged (`incident.external_comms_recorded`) | Per response plan; member notice as soon as possible consistent with Appendix B and law-enforcement requests (—) |

- **ALERTS/METRICS:** Time from detection to management notification (target: minutes); incidents with regulator notification past 72 hours (target zero); count of external communications by non-designated individuals (target zero).

## EC-12 — Contingency Planning and Business Continuity

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires measures to protect against destruction or loss of member information from environmental hazards and technological failures; [12 CFR Part 749 Appendix B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749) sets NCUA expectations for catastrophic-act preparedness and records preservation.
- **SYSTEM BEHAVIOR:** All e-commerce systems are incorporated into the credit union's overall contingency-planning and business-continuity efforts. The credit union confirms that its core processor and e-commerce provider each maintain disaster-recovery and contingency arrangements covering the services they supply. The e-commerce recovery plan is based on a business impact analysis that evaluates applications and processes, determines their importance, and establishes a prioritized resumption order recovering the most critical functions and systems first. Plan testing cadence, recovery objectives, and full disaster-recovery detail live in the Business Continuity Plan Policy. BIA and recovery-plan documents are write-restricted to Information Security and the business-continuity coordinator.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Business impact analysis refresh (`bia.review_due`) | E-commerce application inventory (`bia.applications[]`), criticality ratings (`bia.criticality`), dependency map (`bia.dependencies[]`) | Updated BIA with prioritized recovery order (`bia.completed`) | Per BCP Policy cadence (internal: at least annually; tracked by `bia.review_due`) |
  | Vendor disaster-recovery attestation cycle (`vendor.dr_attestation_due`) | Core-processor and e-commerce-provider DR documentation (`vendor.dr_plan`, `vendor.dr_test_results`) | Confirmation of vendor disaster-recovery arrangements on file (`vendor.dr_confirmed`) | Annually (tracked by `vendor.dr_attestation_due`) |

- **ALERTS/METRICS:** BIA age (target ≤ 12 months); vendor DR attestations outstanding past due date (target zero); e-commerce channel inclusion verified in each BCP test cycle.

## EC-13 — Expertise and Training

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires staff training to implement the information-security program, consistent with GLBA ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** The credit union assesses all personnel involved in e-commerce systems development, operation, and member support to determine special staffing or training needs, recognizing its reliance on the e-commerce system provider (Fiserv) for software development and support. Additional training is provided as deemed appropriate, and training needs are reassessed at least annually to keep pace with technological and personnel changes. Training records are maintained by Human Resources with read access for Compliance and Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual training-needs assessment (`training.assessment_due`) | Staffing roster for e-commerce roles (`training.roster[]`), skills inventory (`training.skills_inventory`), technology-change log (`training.tech_changes[]`) | Training-needs assessment with planned actions (`training.assessment_completed`) | At least annually (tracked by `training.assessment_due`) |
  | Training delivered to identified staff (`training.session_delivered`) | Assigned attendees (`training.attendees[]`), curriculum (`training.curriculum`) | Completion records filed (`training.completion_recorded`) | Per assessment plan (internal: within the assessment year) |

- **ALERTS/METRICS:** Assessment age (target ≤ 12 months); training-completion rate for assigned staff (target 100% within the plan year); roles flagged as under-skilled and unresolved past one cycle (target zero).

## Governance & Sign-Off

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, regulatory mapping, and annual review.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The Board of Directors approves the written e-commerce policy and reviews it at least annually, with modifications for changes in technology, services, and business arrangements.
- **Required participants:** IT department (CIO) for development, implementation, and maintenance of e-commerce systems; Deposit Operations for member enrollment and credential administration; Information Security for monitoring, testing, and incident response.
- **Review cadence:** At least annually, or sooner upon material change in threats, technology, vendors, or regulation.
- **Cross-references:** Backend payment rails (ACH, wires, cards, bill pay, RDC) — Electronic Payment Systems Policy. Cybersecurity and information-security control detail — Information Security Policy. Customer Identification Program for online account opening — BSA Policy. Online privacy notices, cookies, and third-party app connections — Privacy Policy. Vendor and third-party oversight — Third-Party Risk Policy. Channel-level business continuity and disaster recovery detail — Business Continuity Plan Policy.

## Assumptions & Gaps

- **Engineering vocabulary is provisional.** The parsed engineering spec (`vocabulary.json`, Cassandra Banking Core API) registers no events, and its entities cover core-ledger resources only — there are no channel-layer resources for e-commerce enrollment, member credentials, sessions, TLS assessments, intrusion detection, incidents, or training. All `event.code` and `field.code` references in the EVENTS tables (e.g., `ecommerce.enrollment_submitted`, `member_credential.expiry_due`, `intrusion.detected`, `incident.regulator_notification_due`) use the target naming scheme and will be registered by engineering before the next review.
- The online/mobile banking channel is delivered by Fiserv as core and e-commerce vendor; the password complexity rules in [EC-05](#ec-05--member-password-standards) restate the current Fiserv standard and will change if the vendor updates it. Confirm the current vendor standard at each annual review.
- PATRICK_NOTES reference a 24/7 security operations center but do not name the current SOC provider (the legacy reference policy named Secureworks). The SOC arrangement and the bonded penetration-testing firm are assumed to be under current contract; confirm vendor names and contract status with Information Security.
- Internal SLAs shown in parentheses in EVENTS tables (e.g., enrollment verification within 2 BD, high-severity remediation within 30 days, certificate renewal 30 days before expiry, initial breach assessment within 24 hours) are management targets inferred for operability; PATRICK_NOTES were silent on specific internal timeframes and these need CCO confirmation.
- The NCUA 72-hour reportable-cyber-incident notification in [EC-11](#ec-11--breach-of-security-response) assumes Pynthia is a federally insured credit union subject to 12 CFR §748.1(c); confirm charter and insurance status.
- Regulation E error-resolution mechanics are assumed to live in the Electronic Payment Systems Policy; [EC-08](#ec-08--transaction-verification-and-non-repudiation) supplies only the audit-trail evidence. Confirm that policy covers §1005.11 timelines so no gap exists between the two documents.
- The frequency of the "periodic" internal firewall review in [EC-06](#ec-06--firewalls) is assumed to be at least annual; PATRICK_NOTES specified only "periodically" plus the annual independent review.
- E-SIGN consent capture for electronic delivery of agreements and disclosures is assumed to occur at enrollment under the member e-commerce agreement; the consent-capture procedure itself is not detailed in PATRICK_NOTES and should be confirmed with Deposit Operations.
