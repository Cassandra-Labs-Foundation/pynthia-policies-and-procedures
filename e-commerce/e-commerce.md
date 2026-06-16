---
title: E-Commerce Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, E-Commerce, Online Banking, Mobile Banking, Authentication, Member Information Security]
---

## General Policy Statement

Pynthia Credit Union operates online and mobile banking over public networks and treats the public-network attack surface and member authentication as its two highest-risk domains. This policy establishes layered preventive, detective, and recovery controls — safeguarding member information, enforcing network and data access, authenticating members at enrollment and on every session, hardening firewalls and encryption, verifying transactions, monitoring and detecting intrusions, responding to breaches, planning for continuity, and maintaining staff expertise — and assigns clear accountability to the Chief Compliance Officer with the CIO, Deposit Operations, and Information Security as required participants. Scope is the consumer-facing channel layer only: backend payment rails, cybersecurity controls, CIP for online account opening, online privacy notices, vendor oversight, and channel-level continuity detail live in the adjacent policies named in Assumptions & Gaps. The Board approves this written policy and reviews it at least annually.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Member submits e-commerce enrollment (no full online completion permitted) | Enrollment submitted (`ecommerce.enrollment_submitted`) | Identity + member-number verified before access; confirmation on approval | Identity and member-number match, channel of submission | [EC-03](#ec-03-user-authentication-and-enrollment) |
| Temporary password issued without member request | Credentials issued (`ecommerce.credentials_issued`) | Change required on first access, then at least annually | Random 8-char temp password, Fiserv complexity rules | [EC-04](#ec-04-member-password-standards) |
| Annual independent intrusion-risk review/test of firewalls | Independent review due (`firewall.independent_review_due`) | Annual | Firewall config, connection points, test scope | [EC-05](#ec-05-firewalls) |
| Annual SSL/TLS rating test (e.g., Qualys SSL Labs) | Assessment due (`tls.assessment_due`) | At least yearly | Certificate, cipher suite, protocol rating | [EC-06](#ec-06-encryption) |
| Intrusion detected in real time | Intrusion detected (`intrusion.detected`) | Immediate notify; terminate suspicious connection | Severity, source, affected connection | [EC-09](#ec-09-security-monitoring-penetration-testing-and-intrusion-detection) |
| Unauthorized act/user confirmed (breach) | Security confirmed (`incident.security_confirmed`) | Immediate management notice; NCUA per Part 748 App. B | Scope, data impact, legal liability assessment | [EC-10](#ec-10-breach-of-security-response) |
| Annual BCP/DR review incorporating e-commerce systems | BIA review due (`bia.review_due`) | Annual | BIA criticality, processor/provider DR confirmation | [EC-11](#ec-11-contingency-planning-and-business-continuity) |
| Annual staffing/training needs reassessment | Annual training due (`training.annual_due`) | Annual | Skills inventory, role curriculum | [EC-12](#ec-12-expertise-and-training) |

## EC-01 — Safeguarding Member Information

- **WHY (Reg cite):** NCUA Safeguarding Member Information requires a board-approved program to protect the integrity, confidentiality, and availability of member data across electronic channels ([12 CFR Part 748 & Appendix A](https://www.ecfr.gov/current/title-12/part-748)), implementing the GLBA safeguards principle ([15 USC §§6801–6809](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** The e-commerce platform applies end-to-end security controls to critical member data — encryption in transit, integrity checks, and access restriction — so that data integrity, member privacy, and protection from unauthorized intrusion, misuse, or fraud are maintained across the channel. A periodic security risk assessment scores inherent and residual risk for the e-commerce channel and drives control additions or modifications. The information-security program charter and the e-commerce risk-assessment records are write-restricted to Information Security and Compliance; the CIO may read but not alter assessment scoring. Detailed cybersecurity control engineering lives in the Information Security Policy and is referenced, not duplicated, here.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | E-commerce channel risk assessment cycle opens (`risk.assessment_completed`) | Channel scope (`risk.candidate_profile`), inherent score (`risk.inherent_score`), residual rating (`risk.residual_rating`) | Completed assessment + emitted `risk.assessment_published` | Annual (enforced by `ecommerce.risk_assessment_due`) |
  | Security control change required from assessment (`control.framework_approved`) | Control register entry (`control.register`), framework owner (`control.owner_assigned`) | Updated control framework + emitted `control.framework_approved` | Internal: 30 days (enforced by `control.framework_review_due_at`) |

- **ALERTS/METRICS:** Alert when the e-commerce risk assessment is overdue (`ecommerce.risk_assessment_due` breached); target zero critical residual-risk items without an owner; track count of control modifications driven per assessment cycle.

## EC-02 — Network and Data Access Controls

- **WHY (Reg cite):** Reg B / GLBA-aligned safeguards require verifying and enforcing each user's authorized right to access network, application, and data ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748), [15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)); FFIEC layered-security expectations apply to access enforcement on internet channels.

- **SYSTEM BEHAVIOR:** Access to the network, applications, and member data is gated by user IDs, passwords with regular updates, member-set security questions, physical controls on the computer room, and software/hardware security devices (anti-virus, firewall, monitoring software). The system records each access attempt and the entitlement basis; unauthorized individuals are blocked from operations facilities, confidential information, and operating systems. Periodic access reviews re-attest entitlements and revoke stale ones. Entitlement grants and the access-review roster are write-restricted to Information Security; physical computer-room access lists are maintained by Facilities and read-only to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | User requests access to e-commerce systems (`access.entitlement_requested`) | Role entitlements (`access.role_entitlements`), manager approval (`access.manager_approval`), justification (`access.justification`) | Provisioned access record + emitted `access.provisioned` | Internal: 2 BD (no reg deadline) |
  | Periodic access review falls due (`access.review_completed`) | Reviewer roster (`access.reviewer_roster`), last review date (`access.last_reviewed_at`), attestation (`access.review_attestation`) | Completed access review + emitted `access.review_completed` | Internal: quarterly (enforced by `access.review_due_at`) |
  | Antivirus/monitoring device log review falls due (`antivirus.log_review_completed`) | Definitions version (`antivirus.definitions_version`), detection state (`antivirus.detection`) | Log-review record + emitted `antivirus.log_review_completed` | Internal: monthly (enforced by `antivirus.log_review_due`) |

- **ALERTS/METRICS:** Alert on access reviews aging past `access.review_due_at`; target zero active entitlements lacking manager approval; track antivirus log-review completion rate and stale-definition count.

## EC-03 — User Authentication and Enrollment

- **WHY (Reg cite):** FFIEC Authentication Guidance (2021 update) and the E-Banking booklet require risk-based authentication and identity verification for internet/mobile banking; E-SIGN governs the electronic submission and the email confirmation of access ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)); GLBA safeguards underpin identity-before-access ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** The member is identified before any authorization codes issue; the system then assigns an access code and password and authenticates identity on every session. Enrollment cannot be completed fully online — the applicant must supply related account numbers and submit electronically, in person, or by mail, and identity plus member-number match must verify before access is granted. On approval the system sends an email confirmation that access was approved as submitted. An enrollment that arrives without the required account-number evidence is held and not provisioned until identity and member-number verification pass; a session that fails authentication is denied and does not reach account data. Enrollment verification decisions are write-restricted to Deposit Operations; the member-number match flag is system-set and not editable by front-line staff.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member submits enrollment application (`ecommerce.enrollment_submitted`) | Applicant identity (`enrollment.applicant_identity`), identity evidence (`enrollment.identity_evidence`), member-number match (`enrollment.member_number_match`), submission channel (`enrollment.channel`) | Received enrollment record + emitted `ecommerce.enrollment_received` | Before access granted (internal: 2 BD) |
  | Identity and member number verified (`ecommerce.enrollment_verified`) | Identity evidence (`enrollment.identity_evidence`), member-number match (`enrollment.member_number_match`) | Verified enrollment + emitted `ecommerce.enrollment_verified` | Before access granted (internal: 1 BD) |
  | Enrollment approved (`ecommerce.enrollment_approved`) | Verified identity (`verification.match_status`), member id (`member.id`) | Approval + email confirmation + emitted `ecommerce.enrollment_confirmation_sent` | Same day as approval |
  | Member attempts a session login (`ecommerce.login_attempted`) | Session authentication state (`ecommerce.session_authenticated`), credentials (`member_credential.password_hash`) | Authenticated session or denial + emitted `ecommerce.audit_trail_recorded` | Every access (real time) |

- **ALERTS/METRICS:** Target zero enrollments provisioned without a passed member-number match; alert on enrollments aging in "received" beyond internal SLA; track session authentication failure rate and confirmation-email send success.

## EC-04 — Member Password Standards

- **WHY (Reg cite):** FFIEC Authentication Guidance requires credential strength and lifecycle controls for online banking; GLBA safeguards require protection of authentication credentials ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801), [12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)).

- **SYSTEM BEHAVIOR:** When no password is requested, the system issues a randomly generated eight-character temporary password and forces a change on first access and at least annually thereafter. New passwords must meet core-vendor (Fiserv) complexity rules: minimum length 8, maximum 32, at least one upper-case and one lower-case letter, at least one number or special character, no first/last name, no Login ID content, no "Fiserv" or "password" content, and no reuse of the prior 5 passwords. A temporary password that is never changed on first access blocks further access until reset; an expired annual credential forces a change at next login. Password complexity rules track the core vendor and are write-restricted to Information Security; password hashes are never exposed to staff.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | No password requested at enrollment (`member_credential.temp_password_issued`) | Login ID (`member_credential.login_id`), temp flag (`member_credential.is_temporary`), temp password (`member_credential.temp_password`) | Temporary credential issued + emitted `ecommerce.credentials_issued` | At provisioning (real time) |
  | Member changes password on first access or rotation (`member_credential.password_changed`) | New password (`member_credential.new_password`), set timestamp (`member_credential.password_set_at`), prior-5 history check | Updated credential + emitted `member_credential.password_changed` | First access; then at least annually (enforced by `member_credential.expiry_due`) |
  | Repeated failed authentication crosses threshold (`ecommerce.login_failed`) | Failed attempts (`member_credential.failed_attempts`) | Lockout record + emitted `ecommerce.credential_locked` | Real time |

- **ALERTS/METRICS:** Target zero accounts retaining an unchanged temporary password past first-access enforcement; alert on credentials past `member_credential.expiry_due`; track lockout volume and complexity-rule rejection rate.

## EC-05 — Firewalls

- **WHY (Reg cite):** GLBA safeguards and NCUA require technical controls protecting connection points between internal and external networks ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC E-Banking booklet expects periodic firewall review and independent testing.

- **SYSTEM BEHAVIOR:** Hardware and software combine to block unwanted communication while permitting acceptable traffic, protecting all connection points between internal and external networks. The credit union reviews and tests firewalls periodically, and an independent provider conducts an annual intrusion-risk review and test; a failing independent test opens a remediation finding tracked to closure. Firewall configuration changes route through change management and are write-restricted to Information Security; independent-test reports are filed read-only for Compliance and the Board.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Periodic internal firewall review falls due (`firewall.review_completed`) | Connection-point inventory, ruleset, review scope | Internal review record + emitted `firewall.review_completed` | Internal: periodic (enforced by `firewall.review_due`) |
  | Independent annual intrusion-risk review/test falls due (`firewall.independent_review_completed`) | Independent provider scope, test results, intrusion findings | Independent review report + emitted `firewall.independent_review_completed` | Annual (enforced by `firewall.independent_review_due`) |
  | Test produces a deficiency (`finding.opened`) | Finding severity (`finding.severity`), owner (`finding.owner`), root cause (`finding.root_cause`) | Remediation finding + emitted `finding.opened` | Internal: per severity SLA (enforced by `finding.response_due_at`) |

- **ALERTS/METRICS:** Alert when the independent firewall review ages past `firewall.independent_review_due`; target zero open high-severity firewall findings past SLA; track firewall change-management exception count.

## EC-06 — Encryption

- **WHY (Reg cite):** GLBA safeguards require encryption of sensitive member data in transit ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801), [12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC expects current TLS/cipher configurations and periodic validation for internet banking.

- **SYSTEM BEHAVIOR:** All e-commerce communications use TLS connections with up-to-date SSL certificates and ciphers, and encryption is applied whenever sensitive or critical data is transmitted. The SSL certificate and TLS protocol are tested at least yearly (e.g., Qualys SSL Labs) to determine the security rating, and results are retained with IT. A certificate nearing expiry triggers renewal before it lapses; a sub-standard test rating opens a remediation finding. TLS/cipher configuration is write-restricted to Information Security; assessment results are read-only for Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual TLS/SSL rating test falls due (`tls.assessment_completed`) | Cipher suite (`tls.cipher_suite`), certificate (`tls.certificate_expires_at`), test rating (`tls.test_rating`) | Assessment record retained with IT + emitted `tls.assessment_completed` | At least yearly (enforced by `tls.assessment_due`) |
  | Certificate approaches expiry (`tls.certificate_renewed`) | Certificate expiry (`tls.certificate_expires_at`) | Renewed certificate + emitted `tls.certificate_renewed` | Before expiry (enforced by `tls.certificate_expiry_due`) |
  | Test rating below standard (`finding.opened`) | Finding severity (`finding.severity`), owner (`finding.owner`) | Remediation finding + emitted `finding.opened` | Internal: per severity SLA (enforced by `finding.response_due_at`) |

- **ALERTS/METRICS:** Alert on certificates approaching `tls.certificate_expiry_due`; target zero e-commerce endpoints below the target SSL Labs grade; track annual-assessment on-time completion.

## EC-07 — Transaction Verification

- **WHY (Reg cite):** E-SIGN validates electronic records and agreements binding the parties ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)); Reg E requires reliable transaction records for error resolution on electronic fund transfers ([12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005)).

- **SYSTEM BEHAVIOR:** Member e-commerce agreements define valid and authentic electronic-communication procedures and bind the parties to communications that comply. The system maintains audit trails identifying the parties that initiate transactions and uses them to verify specific transactions and rebut repudiation claims. When a member raises a repudiation claim, the audit trail is retrieved and reviewed against the recorded initiation, and the disposition is logged. Audit-trail records are immutable once written and are read-restricted to Compliance, Deposit Operations, and Information Security for dispute handling.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member initiates an e-commerce transaction (`ecommerce.transaction_initiated`) | Initiating party identity (`access.agent_identity`), session authentication (`ecommerce.session_authenticated`) | Audit-trail entry + emitted `ecommerce.audit_trail_recorded` | Real time |
  | Member asserts repudiation/non-authorization (`ecommerce.repudiation_claim_received`) | Audit trail (`record.blob`), transaction record, initiating-party evidence | Repudiation review disposition + emitted `ecommerce.repudiation_reviewed` | Internal: align with Reg E error-resolution clock (10 BD provisional/45 days) |

- **ALERTS/METRICS:** Target zero transactions lacking an associated audit-trail entry; alert on open repudiation reviews aging past the Reg E clock; track repudiation rebuttal success rate.

## EC-08 — Virus Protection

- **WHY (Reg cite):** GLBA safeguards and NCUA require a malware detection and prevention program protecting member-information systems ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC expects end-user awareness and enforcement.

- **SYSTEM BEHAVIOR:** A credit-union-wide detection and prevention program reduces virus likelihood through end-user policies, training and awareness, anti-virus detection tools, and enforcement procedures. Anti-virus definitions are kept current and detection logs are reviewed on cycle; a confirmed detection opens remediation. Anti-virus configuration and signature updates are write-restricted to Information Security; end-user acceptable-use acknowledgements are tracked by HR/Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Anti-virus detection-log review falls due (`antivirus.log_review_completed`) | Definitions version (`antivirus.definitions_version`), detection state (`antivirus.detection`), signature (`antivirus.signature`) | Log-review record + emitted `antivirus.log_review_completed` | Internal: monthly (enforced by `antivirus.log_review_due`) |
  | Confirmed virus/malware detection (`antivirus.remediated`) | Detection detail (`antivirus.detection`), affected asset (`asset.id`) | Remediation record + emitted `antivirus.remediated` | Internal: per severity SLA |
  | End-user awareness training cycle opens (`training.cycle_opened`) | Curriculum (`training.required_curriculum`), assignee (`training.assignee_id`) | Training assignment + emitted `training.assigned` | Annual (enforced by `training.annual_due`) |

- **ALERTS/METRICS:** Alert on antivirus definitions stale beyond threshold; target zero unremediated confirmed detections past SLA; track end-user awareness training completion percentage.

## EC-09 — Security Monitoring, Penetration Testing, and Intrusion Detection

- **WHY (Reg cite):** FFIEC E-Banking and Information Security expectations require real-time monitoring, intrusion detection, and independent penetration testing; GLBA safeguards require ongoing monitoring of member-information systems ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748), [15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** Monitoring tools identify vulnerabilities and detect intrusions in real time; a bonded outside firm conducts penetration testing and recommends remediation. The system produces real-time transaction and audit logs, terminates suspicious connections, maintains an incident database for trend analysis, and is monitored 24/7 via a security operations center. A detected intrusion records a response and, where warranted, terminates the offending connection; a critical SIEM alert is triaged within SLA. Penetration-test scope and engagement records are write-restricted to Information Security; the SOC monitoring roster is maintained by Information Security and read-only to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Real-time intrusion detected (`intrusion.detected`) | Severity (`intrusion.severity`), affected connection (`connection.id`), source | Intrusion response record + emitted `intrusion.response_recorded` | Immediate (real time) |
  | Suspicious connection identified (`connection.scope_violation_detected`) | Connection party (`connection.party_id`), access log (`connection.access_log_id`) | Connection suspended + emitted `connection.token_issued` revocation logged via `connection.revoke_requested` | Real time |
  | Critical SIEM alert raised (`siem.source_silent`) | Alert detail (`siem.alert_detail`), criticality (`siem.alert_critical`) | Alert disposition + emitted `siem.alert_disposed` | Internal: per SLA (enforced by `siem.alert_review_due_at`) |
  | Penetration test engagement falls due (`pentest.scheduled`) | Engagement scope (`pentest.scope`), independence (`pentest.independence`) | Pentest report + emitted `pentest.report_issued` | Internal: scheduled cadence (enforced by `pentest.engagement_due`) |
  | Pentest/monitoring finding raised (`vuln.finding_created`) | Severity (`vuln.severity`), detail (`vuln.detail`), remediation plan (`vuln.remediation_plan`) | Vulnerability finding + emitted `vuln.finding_confirmed` | Triage per SLA (enforced by `vuln.triage_due_at`); remediation (enforced by `vuln.remediation_due_at`) |

- **ALERTS/METRICS:** Alert on critical SIEM alerts aging past `siem.alert_review_due_at` and silent log sources (`siem.source_silent`); target zero high-severity vulnerabilities past `vuln.remediation_due_at`; track pentest engagement on-time rate and SOC 24/7 coverage uptime.

## EC-10 — Breach of Security Response

- **WHY (Reg cite):** NCUA requires a member-information breach response program and member/agency notification ([12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748)); GLBA safeguards mandate incident response ([15 USC §6801](https://www.law.cornell.edu/uscode/text/15/6801)).

- **SYSTEM BEHAVIOR:** On detection of an unauthorized act or user, management is notified immediately; the credit union determines the extent of damage or disclosure and potential legal liability, then executes response activities covering communications with members, law enforcement, regulators, and the media. Only designated individuals are authorized to communicate externally; any external communication by a non-designated person is blocked. Where misuse of member information is reasonably possible, member notice and NCUA notification are determined and issued on their regulatory clocks. The external-communications designee list and the incident reportability determination are write-restricted to Compliance and the incident commander.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Unauthorized act/user confirmed (`incident.security_confirmed`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), severity (`incident.severity`) | Declared incident + immediate management notice + emitted `incident.declared` | Immediate; triage (enforced by `incident.triage_due_at`) |
  | Damage/disclosure and liability assessed (`incident.assessment_completed`) | Data scope (`incident.data_scope`), misuse likelihood (`incident.misuse_likelihood`), legal review (`incident.legal_review`) | Reportability determination + emitted `incident.assessment_completed` | Internal: per response SLA |
  | Member notice required (`incident.member_notified`) | Notice template (`incident.member_notice_template`), notice content (`incident.notice_content`) | Member notices sent + emitted `incident.member_notices_sent` | Per Part 748 App. B (as soon as practicable) |
  | NCUA notification criteria met (`incident.ncua_notified`) | NCUA notice due (`incident.ncua_notice_due_at`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA notification + emitted `incident.ncua_notified` | Per Part 748 App. B (enforced by `incident.ncua_notice_due_at`) |
  | External communication attempted (`incident.external_comms_started`) | Designee identity (`comms.ceo_approval`), draft script (`comms.draft_script`) | Logged external comms (designee-gated) + emitted `incident.external_comms_recorded` | Real time |

- **ALERTS/METRICS:** Alert on NCUA notification aging toward `incident.ncua_notice_due_at`; target zero external communications by non-designated persons; track time-to-management-notice and member-notice completeness.

## EC-11 — Contingency Planning and Business Continuity

- **WHY (Reg cite):** NCUA requires e-commerce systems within the credit union's continuity and member-information availability program ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC expects BIA-driven recovery and confirmed third-party DR arrangements.

- **SYSTEM BEHAVIOR:** All e-commerce systems are incorporated into the overall contingency and business-continuity effort; the core processor and e-commerce provider disaster-recovery arrangements are confirmed; and the recovery plan is based on a business impact analysis that prioritizes the most critical functions and systems for resumption first. The BIA is reviewed and certified on cycle, and a DR exercise validates recovery objectives. Detailed channel-level continuity testing lives in the Business Continuity Plan Policy and is referenced here. The BIA criticality ratings and processor/provider DR confirmations are write-restricted to the BCP owner and read-only to Compliance and the Board.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | BIA review/certification falls due (`bia.completed`) | Criticality (`bia.criticality`), member impact (`bia.member_impact`), regulatory dependency (`bia.reg_dependency`) | Completed/certified BIA + emitted `bia.certified` | Annual (enforced by `bia.review_due` / `bia.certification_due`) |
  | Core/e-commerce provider DR confirmation needed (`vendor.dr_confirmed`) | DR plan (`vendor.dr_plan`), RTO/RPO (`vendor.rto_rpo`), test results (`vendor.dr_test_results`) | DR confirmation record + emitted `vendor.dr_confirmed` | Internal: annual (enforced by `vendor.dr_attestation_due`) |
  | DR exercise falls due (`dr.exercise_completed`) | Plan (`dr.plan`), RTO/RPO matrix (`dr.rto_rpo_matrix`) | Exercise record + emitted `dr.exercise_completed` | Internal: annual (enforced by `dr.exercise_due_at`) |

- **ALERTS/METRICS:** Alert on BIA review/certification aging past `bia.review_due`; target zero critical e-commerce systems lacking a confirmed provider DR arrangement; track DR exercise pass rate against RTO/RPO.

## EC-12 — Expertise and Training

- **WHY (Reg cite):** GLBA safeguards and NCUA require staff competent to develop, operate, and support member-information systems ([12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748)); FFIEC expects ongoing skills assessment for e-banking operations and support.

- **SYSTEM BEHAVIOR:** The credit union assesses staffing and training needs for systems development, operation, and member support; provides additional training as appropriate; and reassesses needs annually to keep pace with technological and personnel changes. A training cycle assigns role-appropriate curriculum and tracks completion; lapsed assignments trigger remedial assignment. The skills inventory and role curriculum map are maintained by the CIO and Compliance; completion records are read-only to the Board for governance reporting.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual staffing/training needs reassessment opens (`training.annual_cycle_opened`) | Skills inventory (`training.skills_inventory`), role matrix (`training.role_matrix`), curriculum map (`training.curriculum_map`) | Annual assignment + emitted `training.annual_assigned` | Annual (enforced by `training.annual_due`) |
  | Assigned training completed (`training.completed`) | Assignee (`training.assignee_id`), completion status (`training.completion_status`) | Completion record + emitted `training.completion_recorded` | Internal: per cycle (enforced by `training.completion_due_at`) |
  | Training assignment lapses (`training.refresh_issued`) | Lapsed flag (`training.lapsed`), curriculum (`training.refresher_curriculum`) | Remedial assignment + emitted `training.remedial_assigned` | Internal: per cycle |

- **ALERTS/METRICS:** Alert on training assignments past `training.completion_due_at`; target 100% annual completion for e-commerce development, operations, and support roles; track lapsed-then-remediated count.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Centralized governance of these controls sits with the CCO, with the IT department (CIO), Deposit Operations, and Information Security as required participants.
- **Approvals:** Approved by Patrick Wilson, Chief Compliance Officer. The Board of Directors approves the written e-commerce policy.
- **Review cadence:** Board reviews this policy at least annually (next review {{next_review}}); management may modify sooner for changes in technology, services, or business arrangements. Policy review and board-approval timers are tracked via `policy.review_due_at` and `policy.board_approval_due_at`.
- **Cross-refs:** Timing deadlines are consolidated in the [Timing Matrix](#timing-matrix). Adjacent policies are named in [Assumptions & Gaps](#assumptions).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Most e-commerce resources, fields, events, and timers cited above (e.g., `ecommerce.*`, `member_credential.*`, `enrollment.*`, `tls.*`, `firewall.*`, `antivirus.*`, `intrusion.*`, `pentest.*`, `siem.*`, `incident.*`, `bia.*`, `dr.*`, `vendor.dr_*`, `training.*`, `ecommerce.risk_assessment_due`) are present in the parsed core vocabulary; where a precise field had no registered code it was composed under the registered subject + verb/task grammar. All such codes are the agreed target naming and will be confirmed by engineering before the next review.
- **Charter type and applicability.** Pynthia Credit Union's charter type (state vs. federal) was not specified. NCUA 12 CFR Part 748/Appendix A & B is treated as the governing safeguarding/breach-response authority; if state-chartered, the equivalent state regulator's safeguarding and breach-notification rules must be confirmed and mapped.
- **Reg E error-resolution timing for repudiation (EC-07).** The internal clock for repudiation review is aligned to Reg E error-resolution timelines as a working assumption; the exact internal SLA (10 BD provisional credit / 45-day investigation applicability) for e-commerce repudiation claims must be confirmed against the consumer EFT product scope.
- **Member-information breach notice triggers (EC-10).** The member-notice and NCUA-notification trigger thresholds follow Part 748 Appendix B "reasonably possible misuse." The precise internal severity-to-notice mapping and the NCUA notice timing window must be confirmed with Compliance and counsel.
- **24/7 SOC and bonded pentest vendor (EC-09).** The policy assumes a contracted bonded outside firm for penetration testing and a SOC for 24/7 monitoring (per the reference policy's SecureWorks model). Specific vendor identities, independence attestations, and engagement cadence are governed by the Third-Party Risk Policy and must be confirmed.
- **Adjacent policy boundaries.** This policy deliberately excludes and references: Electronic Payment Systems Policy (ACH, wires, cards, bill pay, RDC), Information Security Policy (cybersecurity/infosec controls), BSA Policy (CIP for online account opening), Privacy Policy (online privacy notices, cookies, third-party app connections), Third-Party Risk Policy (vendor oversight including Fiserv), and Business Continuity Plan Policy (channel-level BC/DR detail). The hand-off boundaries are assumed accurate and should be confirmed so no control gap exists at the seams.
