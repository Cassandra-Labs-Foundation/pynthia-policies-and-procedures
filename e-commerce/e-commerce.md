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

## General Policy Statement

Pynthia Credit Union identifies, measures, monitors, and controls the risks arising from its electronic-commerce (online and mobile banking) channels operating over public networks. The risk in this domain is concentrated in the public-network attack surface and in member authentication. This policy establishes layered preventive, detective, and recovery controls — covering safeguarding of member information, access and authentication, encryption, monitoring, breach response, business continuity, and staff expertise — and assigns clear accountability to the Chief Compliance Officer with the IT department (CIO), Deposit Operations, and Information Security as required participants. The Board approves this written policy and reviews it at least annually. Backend payment rails, cybersecurity infrastructure controls, CIP for online account opening, online privacy notices, and channel-vendor oversight are governed by adjacent policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Member submits e-commerce enrollment | Enrollment submitted (`ecommerce.enrollment_submitted`) | Verify before access; email confirmation on approval | Identity + member-number verification, then access grant | [EC-03](#ec-03-user-authentication-and-enrollment) |
| Temporary password issued | Credentials issued (`member_credential.temp_password_issued`) | Change on first access; then at least annually | Password complexity + history rules | [EC-04](#ec-04-member-password-standards) |
| Independent firewall review due | Annual cycle reached (`firewall.independent_review_started`) | Annually | Intrusion-risk review and test | [EC-05](#ec-05-firewalls) |
| TLS/SSL certificate test due | Assessment due (`tls.assessment_completed`) | At least yearly | SSL Labs rating + retention | [EC-06](#ec-06-encryption) |
| Intrusion or suspicious connection detected | Intrusion detected (`intrusion.detected`) | Real-time terminate; log | Audit log + connection termination | [EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection) |
| Unauthorized act or user confirmed | Security confirmed (`incident.security_confirmed`) | Notify management immediately | Breach response activities | [EC-10](#ec-10-breach-of-security-response) |
| Annual risk and policy review | Assessment due (`ecommerce.risk_assessment_started`) | Annually; Board approval | Risk assessment + Board approval | [EC-11](#ec-11-contingency-planning-and-business-continuity), [EC-13](#ec-13-governance-and-board-approval) |
| Annual staff training/needs reassessment | Cycle opened (`training.annual_cycle_opened`) | Annually | Staffing/training needs reassessment | [EC-12](#ec-12-expertise-and-training) |

## EC-01 — Safeguarding Member Information  {#ec-01-safeguarding-member-information}

- **WHY (Reg cite):** NCUA Part 748 and Appendix A require a board-approved program with administrative, technical, and physical safeguards protecting the integrity, confidentiality, and availability of member information ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)); GLBA establishes the underlying safeguards principle for nonpublic personal information ([15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** E-commerce systems apply end-to-end security controls to critical member data across the online and mobile channel layer, maintaining data integrity, ensuring member privacy, and protecting computer and telecommunication systems from unauthorized intrusion, misuse, or fraud. The control charter and KPI baselines for the channel are maintained as a security program record reviewed on the standard policy cadence, and channel-level data classification is inherited from the enterprise Information Security Policy rather than redefined here. The security program charter and policy change log are write-restricted to Information Security and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Security program review cycle opens for the channel (`security.policy_review_opened`) | Program charter (`security.program_charter`), prior KPI snapshot (`security.kpi_snapshot`), policy change log (`security.policy_change_log`) | Updated channel security program record (`security.policy_approved`) | Annual (internal: complete within review window; enforced by `policy.review_due_at`) |
  | Channel security board report due (`security.board_report_issued`) | KPI snapshot (`security.kpi_snapshot`), program charter (`security.program_charter`) | Board security report (`security.board_report_issued`) | Annual (enforced by `security.board_report_due_at`) |

- **ALERTS/METRICS:** Target zero unremediated channel-data exposure findings; alert when the channel security program review ages past its `policy.review_due_at` threshold.

## EC-02 — Network and Data Access Controls  {#ec-02-network-and-data-access-controls}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires access controls on member-information systems, including authentication and physical/logical restriction of access to authorized users ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC Authentication Guidance and the E-Banking booklet set layered-security expectations for internet channels.
- **SYSTEM BEHAVIOR:** The channel verifies and enforces each user's authorized right to reach the network, applications, and data using user IDs, passwords with regular updates, member-set security questions, physical controls (locked computer room), and software/hardware security devices (anti-virus, firewall, monitoring software). Logical access entitlements are provisioned by role and reviewed on a recurring cadence; entitlement grants that would create a segregation-of-duties conflict are blocked. Role entitlements and the access-review roster are write-restricted to Information Security; the locked computer-room access list is write-restricted to facilities-authorized personnel.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Access entitlement requested for channel systems (`access.entitlement_requested`) | Requested role (`access.role_id`), role entitlements (`access.role_entitlements`), manager approval (`access.manager_approval`) | Provisioned access right (`access.provisioned`) | At provisioning (internal: per access SLA; enforced by `access.review_due`) |
  | Periodic access review cycle reached (`access_review.completed`) | Reviewer roster (`access.reviewer_roster`), user roster (`access.user_roster`), last-reviewed timestamp (`access.last_reviewed_at`) | Access review attestation (`access.review_completed`) | Periodic (internal: per review cadence; enforced by `access.review_due`) |
  | Separation-of-duties conflict detected on a grant (`sod.conflict_detected`) | SoD matrix version (`sod.matrix_version`), attempted grant (`sod.violation_attempted`) | SoD violation logged + grant blocked (`sod.violation_logged`) | Real-time (internal: block at grant time) |

- **ALERTS/METRICS:** Target zero access reviews aged beyond cadence; alert on any SoD grant-block event and on physical computer-room access list changes outside the approved roster.

## EC-03 — User Authentication and Enrollment  {#ec-03-user-authentication-and-enrollment}

- **WHY (Reg cite):** FFIEC Authentication Guidance (2021) requires risk-based identification and authentication of members for internet channels; NCUA Part 748 Appendix A requires controls to authenticate authorized users before granting access ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)); E-SIGN governs the electronic submission and confirmation of the enrollment record ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)).
- **SYSTEM BEHAVIOR:** The credit union identifies the member before issuing authorization codes, then assigns an access code and password and authenticates identity on every access. Members may not complete enrollment fully online: the applicant must supply related account numbers and submit electronically, in person, or by mail; identity and member-number are verified before access is granted, and an email confirmation is sent on approval. A purely online application that lacks the required account-number match is held and routed for manual verification rather than auto-approved. Enrollment approval and member-number-match decisions are write-restricted to Deposit Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member submits enrollment application (`ecommerce.enrollment_submitted`) | Applicant identity (`enrollment.applicant_identity`), identity evidence (`enrollment.identity_evidence`), member-number match (`enrollment.member_number_match`) | Enrollment recorded for verification (`ecommerce.enrollment_received`) | Before access granted (internal: per enrollment SLA) |
  | Identity and member number verified (`ecommerce.enrollment_verified`) | Identity check method (`member.identity_check_method`), member-number match (`enrollment.member_number_match`) | Verification result + enrollment approval (`ecommerce.enrollment_approved`) | Before access granted (internal: per enrollment SLA) |
  | Enrollment approved (`ecommerce.enrollment_approved`) | Member contact (`entity.email`), e-sign consent (`member.esign_consent_captured`) | Approval email confirmation (`ecommerce.enrollment_confirmation_sent`) | On approval (internal: same business day) |
  | Member attempts channel login (`ecommerce.login_attempted`) | Credentials (`member_credential.login_id`), session authentication state (`ecommerce.session_authenticated`) | Authenticated session (`ecommerce.audit_trail_recorded`) | Every access (real-time) |

- **ALERTS/METRICS:** Target zero enrollments granting access without a recorded verification; alert on any fully-online enrollment that bypasses the account-number match, and on abnormal failed-login rates.

## EC-04 — Member Password Standards  {#ec-04-member-password-standards}

- **WHY (Reg cite):** FFIEC Authentication Guidance and the E-Banking booklet require strong credential management for internet banking; NCUA Part 748 Appendix A requires controls that protect member-information system access ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** When no password is requested, the system issues a randomly generated eight-character temporary password; the member must change it on first access and at least annually thereafter. Passwords must meet core-vendor (Fiserv) complexity rules — minimum length 8, maximum 32, at least one upper-case and one lower-case letter, at least one number or special character; no name/Login ID/"Fiserv"/"password" content; and no reuse of the prior 5 passwords. A temporary credential that is never changed on first access blocks further account activity until reset. Password complexity rules and the credential store are write-restricted to Information Security and the core-banking integration.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member enrolls with no password requested (`member_credential.temp_password_issued`) | Login ID (`member_credential.login_id`), temporary password (`member_credential.temp_password`), is-temporary flag (`member_credential.is_temporary`) | Temporary credential issued (`member_credential.temp_password_issued`) | At issuance (internal: change required on first access) |
  | Member changes password on first access or at cycle (`member_credential.password_changed`) | New password (`member_credential.new_password`), prior-password history (`member_credential.password_hash`), set timestamp (`member_credential.password_set_at`) | Password change recorded (`member_credential.password_changed`) | First access, then at least annually (enforced by `member_credential.expiry_due`) |
  | Repeated failed authentication threshold reached (`ecommerce.login_failed`) | Failed-attempt count (`member_credential.failed_attempts`) | Credential lockout recorded (`ecommerce.credential_locked`) | Real-time (internal: lock on threshold) |

- **ALERTS/METRICS:** Target zero accounts holding an unchanged temporary password past first access; alert when annual password-expiry cycles age past `member_credential.expiry_due` and on lockout spikes.

## EC-05 — Firewalls  {#ec-05-firewalls}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires technical controls protecting member-information systems from unauthorized intrusion; the FFIEC E-Banking booklet expects perimeter controls protecting connection points between internal and external networks ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** Firewalls combine hardware and software to block unwanted communication while permitting acceptable traffic, protecting all connection points between internal and external networks. Firewalls are reviewed and tested periodically, and an independent provider conducts an annual intrusion-risk review and test. An independent annual review that is not completed on schedule raises an aging alert and is escalated rather than allowed to lapse silently. Firewall configuration and review records are write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Periodic internal firewall review reached (`firewall.review_completed`) | Firewall configuration baseline (`config.baseline_id`), drift detail (`config.drift_detail`) | Internal firewall review record (`firewall.review_completed`) | Periodic (enforced by `firewall.review_due`) |
  | Annual independent intrusion-risk review begins (`firewall.independent_review_started`) | Independent provider engagement scope (`engagement.scope`), provider identity (`engagement.provider`) | Independent firewall review report (`firewall.independent_review_completed`) | Annual (enforced by `firewall.independent_review_due`) |

- **ALERTS/METRICS:** Alert when the independent firewall review ages past `firewall.independent_review_due`; track count of unresolved firewall configuration-drift findings (target zero).

## EC-06 — Encryption  {#ec-06-encryption}

- **WHY (Reg cite):** NCUA Part 748 Appendix A and GLBA require encryption of member information in transit where appropriate ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748); [15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801)); FFIEC E-Banking guidance expects current TLS for internet-channel communications.
- **SYSTEM BEHAVIOR:** All e-commerce communications and transmissions of sensitive or critical data use TLS connections with current SSL certificates and ciphers. The SSL certificate and TLS protocol are tested at least yearly (e.g., Qualys SSL Labs) and the results are retained with IT. A certificate approaching expiry triggers a renewal task so coverage never lapses, and a failing or below-grade test rating is treated as a finding requiring remediation. Cipher configuration and certificate management are write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Yearly TLS/SSL test reached (`tls.assessment_completed`) | Cipher suite (`tls.cipher_suite`), test rating (`tls.test_rating`) | SSL Labs assessment result retained with IT (`tls.assessment_completed`) | At least yearly (enforced by `tls.assessment_due`) |
  | TLS certificate approaching expiry (`tls.certificate_renewed`) | Certificate expiry timer (`tls.certificate_expires_at`), cipher suite (`tls.cipher_suite`) | Renewed certificate record (`tls.certificate_renewed`) | Before expiry (enforced by `tls.certificate_expiry_due`) |

- **ALERTS/METRICS:** Alert on TLS test rating below target grade and when a certificate nears `tls.certificate_expiry_due`; target zero lapsed certificates.

## EC-07 — Transaction Verification  {#ec-07-transaction-verification}

- **WHY (Reg cite):** E-SIGN governs the validity of electronic communications and the member's intent to be bound ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)); Regulation E requires accurate records of electronic fund transfers and supports error-resolution and repudiation handling ([12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005)).
- **SYSTEM BEHAVIOR:** Member e-commerce agreements define valid and authentic electronic-communication procedures, and the channel maintains audit trails that identify the parties initiating transactions. These audit trails are used to verify specific transactions and to rebut repudiation claims. When a member asserts repudiation, the recorded audit trail is retrieved and reviewed to support or rebut the claim. Audit-trail records are append-only and read-restricted to Compliance, IT, and Deposit Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member initiates an online transaction (`ecommerce.transaction_initiated`) | Initiating party identity (`transaction.initiated_by`), authenticated session (`ecommerce.session_authenticated`) | Audit-trail entry identifying the parties (`ecommerce.audit_trail_recorded`) | Real-time (at initiation) |
  | Member submits a repudiation claim (`ecommerce.repudiation_claim_received`) | Transaction audit trail (`ecommerce.audit_trail_recorded`), initiating party (`transaction.initiated_by`) | Repudiation review outcome (`ecommerce.repudiation_reviewed`) | Per Reg E error-resolution timeline (internal: per dispute SLA; enforced by `dispute.investigation_due_at`) |

- **ALERTS/METRICS:** Target 100% of online transactions producing a complete audit-trail entry; alert on any repudiation claim lacking a retrievable audit trail.

## EC-08 — Virus Protection  {#ec-08-virus-protection}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires controls to detect and prevent malicious software threatening member-information systems ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** A credit-union-wide detection and prevention program reduces the likelihood of computer viruses, including end-user policies, training and awareness, anti-virus tools, and enforcement procedures. Anti-virus signatures and definitions are kept current, and detections trigger remediation. Anti-virus logs are reviewed on a recurring cadence, and a detection that is not remediated is escalated as a finding. Anti-virus configuration and definition management are write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Anti-virus log review cycle reached (`antivirus.log_review_completed`) | Definitions version (`antivirus.definitions_version`), detection records (`antivirus.detection`) | Anti-virus log review record (`antivirus.log_review_completed`) | Periodic (enforced by `antivirus.log_review_due`) |
  | Malware detected on a channel-supporting endpoint (`antivirus.remediated`) | Detection record (`antivirus.detection`), signature (`antivirus.signature`) | Remediation record (`antivirus.remediated`) | On detection (internal: per remediation SLA) |

- **ALERTS/METRICS:** Alert when anti-virus log review ages past `antivirus.log_review_due` or when definitions fall behind the current version; target zero unremediated detections.

## EC-09 — Security Monitoring, Penetration Testing, and Intrusion Detection  {#ec-09-security-monitoring-penetration-testing-and-intrusion-detection}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires ongoing monitoring and testing of the security program; FFIEC E-Banking and Authentication guidance expect intrusion detection, independent penetration testing, and 24/7 monitoring of internet channels ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** Monitoring tools identify vulnerabilities and detect intrusions in real time; a bonded outside firm conducts penetration testing and recommends remediation. The channel produces real-time transaction and audit logs, terminates suspicious connections, maintains an incident database for trend analysis, and is monitored 24/7 via a security operations center. A confirmed-malicious SIEM alert opens an incident, and a silent monitoring source raises a coverage alert so 24/7 visibility is not lost. Penetration-test scope and SIEM alert disposition are write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Intrusion or suspicious connection detected (`intrusion.detected`) | Connection access log (`connection.access_log_id`), intrusion severity (`intrusion.severity`) | Intrusion response + connection termination recorded (`intrusion.response_recorded`) | Real-time (terminate on detection) |
  | SIEM critical alert raised by SOC (`siem.source_silent`) | Alert detail (`siem.alert_detail`), source inventory (`siem.source_inventory`) | Alert disposition recorded (`siem.alert_disposed`) | Per alert-review SLA (enforced by `siem.alert_review_due_at`) |
  | Scheduled independent penetration test reached (`pentest.report_received`) | Bonded-firm engagement scope (`pentest.scope`), provider independence (`pentest.independence`) | Penetration-test report + remediation recommendations (`pentest.report_issued`) | Periodic (enforced by `pentest.engagement_due`) |
  | Vulnerability confirmed from monitoring or test (`vuln.finding_confirmed`) | Vulnerability detail (`vuln.detail`), severity (`vuln.severity`) | Remediation tracked (`vuln.remediated`) | Per severity SLA (enforced by `vuln.remediation_due_at`) |

- **ALERTS/METRICS:** Track intrusion-to-termination latency (target near real-time), SIEM source-silent alerts (target zero), and penetration-test remediation aging; alert when pentest engagement ages past `pentest.engagement_due`.

## EC-10 — Breach of Security Response  {#ec-10-breach-of-security-response}

- **WHY (Reg cite):** NCUA Part 748 Appendix B requires a response program for unauthorized access to member information, including member notification and notice to NCUA ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)); GLBA underpins the duty to respond to unauthorized access to nonpublic personal information ([15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801)).
- **SYSTEM BEHAVIOR:** On detection of an unauthorized act or user, management is notified immediately; the credit union determines the extent of damage, disclosure, and potential legal liability, then executes response activities covering communications with members, law enforcement, regulators, and media. Only designated individuals are authorized to communicate externally. Where member information is reasonably determined to have been misused or is reasonably likely to be misused, member notices are sent and NCUA is notified. External-communications authority and the incident comms plan are write-restricted to designated responders and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Unauthorized act or user confirmed (`incident.security_confirmed`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity (`incident.severity`) | Management notified + incident declared (`incident.declared`) | Immediately (internal: enforced by `incident.triage_due_at`) |
  | Damage/disclosure and liability assessed (`incident.assessment_completed`) | Data scope (`incident.data_scope`), misuse likelihood (`incident.misuse_likelihood`), legal review (`incident.legal_review`) | Reportability and notification determination (`incident.assessment_completed`) | Per assessment SLA (enforced by `incident.notification_due_at`) |
  | Member misuse determined likely (`incident.member_notices_sent`) | Member notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent (`incident.member_notices_sent`) | Without unreasonable delay (internal: per notice SLA) |
  | NCUA notice criteria met (`incident.ncua_notified`) | Reportability determination (`incident.reportability_determination`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA notification sent (`incident.ncua_notified`) | Per Part 748 timeline (enforced by `incident.ncua_notice_due_at`) |
  | External communication required (`incident.external_comms_started`) | Comms plan (`incident.comms_plan`), designated approver (`comms.ceo_approval`) | External communication recorded (`incident.external_comms_recorded`) | Per comms plan (internal: enforced by `comms.same_day_due_at`) |

- **ALERTS/METRICS:** Alert when incident triage, member notice, or NCUA notification ages past its respective timer; target zero externally-communicated breaches by non-designated personnel.

## EC-11 — Contingency Planning and Business Continuity  {#ec-11-contingency-planning-and-business-continuity}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires the security program to address response, recovery, and resumption of member-information systems; FFIEC E-Banking and Business Continuity guidance expect e-commerce systems to be folded into enterprise BCP based on a business impact analysis ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** All e-commerce systems are incorporated into overall contingency and business-continuity efforts. The credit union confirms that its core processor and e-commerce provider have addressed disaster recovery, and bases the channel recovery plan on a business impact analysis that prioritizes the most critical functions and systems first. Detailed channel-level DR runbooks and RTO/RPO matrices live in the Business Continuity Plan Policy and are referenced rather than restated here. The BIA criticality determinations are write-restricted to the BCP owner and Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | BIA review/update cycle reached for the channel (`bia.completed`) | Criticality rating (`bia.criticality`), member impact (`bia.member_impact`), regulatory dependency (`bia.reg_dependency`) | Channel BIA record (`bia.certified`) | Periodic (enforced by `bia.review_due`) |
  | Core/e-commerce provider DR confirmation due (`vendor.dr_confirmed`) | Vendor DR plan (`vendor.dr_plan`), RTO/RPO (`vendor.rto_rpo`) | Vendor DR attestation recorded (`vendor.dr_confirmed`) | Periodic (enforced by `vendor.dr_attestation_due`) |

- **ALERTS/METRICS:** Alert when channel BIA ages past `bia.review_due` or vendor DR attestation past `vendor.dr_attestation_due`; target zero critical channel functions without a current BIA criticality rating.

## EC-12 — Expertise and Training  {#ec-12-expertise-and-training}

- **WHY (Reg cite):** NCUA Part 748 Appendix A requires staff training appropriate to the security program; FFIEC E-Banking guidance expects adequate expertise for development, operation, and member support of internet channels ([12 CFR Part 748, App. A](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** The credit union assesses staffing and training needs for systems development, operation, and member support, provides additional training as appropriate, and reassesses needs at least annually to keep pace with technological and personnel changes. A training cycle that lapses without completion is flagged for follow-up rather than closed silently. Training curriculum and assignment records are write-restricted to the program owner and HR.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual training/needs cycle opens (`training.annual_cycle_opened`) | Role matrix (`training.role_matrix`), skills inventory (`training.skills_inventory`), curriculum (`training.curriculum_id`) | Training assignments created (`training.annual_assigned`) | Annual (enforced by `training.annual_due`) |
  | Assigned staff completes channel training (`training.completed`) | Assignee (`training.assignee_id`), completion status (`training.completion_status`), content version (`training.content_version`) | Completion recorded (`training.completion_recorded`) | Within cycle (enforced by `training.completion_due_at`) |

- **ALERTS/METRICS:** Track training coverage percentage (target 100% of in-scope staff) and alert when the annual cycle or any assignment ages past `training.annual_due` / `training.completion_due_at`.

## EC-13 — Governance and Board Approval  {#ec-13-governance-and-board-approval}

- **WHY (Reg cite):** NCUA Part 748 requires the Board to approve the written information-security program and oversee its implementation; the program must be reviewed at least annually ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).
- **SYSTEM BEHAVIOR:** Governance is centralized with the Chief Compliance Officer, with the IT department (CIO), Deposit Operations, and Information Security as required participants. The Board approves this written policy and reviews it at least annually; the channel risk assessment feeds that review. A policy whose annual review lapses raises a review-aging warning and is escalated. The policy document, version history, and board-approval record are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual e-commerce risk assessment opens (`ecommerce.risk_assessment_started`) | Risk register snapshot (`risk.register_snapshot`), threat catalog (`risk.threat_catalog`) | Completed channel risk assessment (`ecommerce.risk_assessment_completed`) | Annual (enforced by `ecommerce.risk_assessment_due`) |
  | Board review and approval cycle reached (`policy.board_review_started`) | Policy document (`policy.document_id`), version (`policy.document_version`), risk assessment results (`risk.assessment_results`) | Board-approved policy version (`policy.board_approved`) | At least annually (enforced by `policy.board_approval_due_at`) |

- **ALERTS/METRICS:** Alert when the channel risk assessment or board approval ages past its timer (`ecommerce.risk_assessment_due` / `policy.board_approval_due_at`); target zero lapsed annual reviews.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintenance, interpretation, and annual update of this policy.
- **Required participants:** IT Department (CIO), Deposit Operations, and Information Security support implementation and operation of the controls above.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer, and adopted by the Board of Directors.
- **Review cadence:** Reviewed and Board-approved at least annually (see [EC-13](#ec-13-governance-and-board-approval)); next review on the date in the front-matter.
- **Cross-references:** Backend payment rails (Electronic Payment Systems Policy); cybersecurity infrastructure (Information Security Policy); CIP for online account opening (BSA Policy); online privacy notices/cookies/third-party apps (Privacy Policy); online-vendor oversight (Third-Party Risk Policy); channel BCP/DR detail (Business Continuity Plan Policy).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is partially provisional.** Most events, fields, and timers referenced above (e.g., `ecommerce.*`, `member_credential.*`, `tls.*`, `firewall.*`, `antivirus.*`, `intrusion.*`, `incident.*`, `pentest.*`, `siem.*`) are registered in the parsed core vocabulary. A small number are drawn from the agreed "Provisional codes" list rather than the registered spec — including `enrollment.channel`, `pentest.scope`, `engagement.scope`, `engagement.provider`, `vuln.detail`, `vuln.severity`, and `intrusion.severity`. These spellings are confirmed with engineering and will be registered before the next review.
- **Charter type / NCUA applicability.** This policy assumes Pynthia Credit Union is an NCUA-insured credit union subject to 12 CFR Part 748 and Appendix A/B; FFIEC guidance is treated as supervisory expectation rather than codified rule. If the charter is state-only or otherwise scoped, the controlling citations and breach-notification timelines in [EC-10](#ec-10-breach-of-security-response) must be re-confirmed.
- **Regulation E scope.** [EC-07](#ec-07-transaction-verification) treats repudiation handling under Reg E error-resolution timing; the precise dispute SLA and which EFT products the online channel exposes are assumed to align with the EFT/dispute handling defined elsewhere and should be confirmed against the Electronic Payment Systems Policy.
- **Vendor DR confirmation cadence.** [EC-11](#ec-11-contingency-planning-and-business-continuity) assumes core/e-commerce provider (Fiserv) DR attestations are obtained on the registered vendor DR-attestation cadence; the exact interval and the boundary against the Business Continuity Plan Policy and Third-Party Risk Policy should be confirmed.
- **Independent firewall vs. penetration-test providers.** [EC-05](#ec-05-firewalls) and [EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection) assume the annual independent firewall review and the bonded penetration test may be separate engagements; if a single bonded provider performs both, the two timer references can be consolidated.
- **Member notification trigger threshold.** [EC-10](#ec-10-breach-of-security-response) assumes the Part 748 Appendix B "reasonably likely to be misused" standard governs member-notice timing; any state-law overlay imposing a stricter deadline is not modeled here and should be confirmed.
