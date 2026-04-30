# Cybersecurity

> **General Policy Statement** \{{ORGANIZATION\}} safeguards member and organizational information to ensure confidentiality, integrity, availability, and resilience. We implement a risk-based program aligned to NCUA Part 748 (including incident reporting), record-retention under Part 749, Identity Theft “Red Flags” (Part 717 Subpart J), FACTA Disposal, and related rules. Scope includes people, facilities, data, systems, networks, vendors, AI tools, and channels listed in **SCOPE**. Engineering and operations must implement the controls below and evidence them via audit logs and periodic testing.

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                                                             | Scope                                                  | Key Clauses / Notes                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA Part 748 – Security Program, Report of Suspected Crimes, and Cyber Incident Notification** | Program, incident reporting, response                  | [12 CFR Part 748](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748); 72-hour cyber incident reporting: [§748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1%28c%29) |
| **NCUA Part 748, App. A – Guidelines for Safeguarding Member Information**                        | Safeguards, risk assessment, testing, vendor oversight | [12 CFR Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                         |
| **NCUA Part 748, App. B – Response Programs**                                                     | Incident response, member notice                       | [12 CFR Part 748 App. B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748)                                                                                         |
| **NCUA Part 717 Subpart J – Identity Theft Red Flags**                                            | ID theft program & red flags                           | [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717#subpart-J)                                                                                                                    |
| **FACTA Disposal Rule**                                                                           | Secure disposal of consumer info                       | [16 CFR Part 682](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-F/part-682)                                                                                                                 |
| **NCUA Part 749 – Records Preservation**                                                          | Retention schedules & vital records                    | [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749); Vital records schedule: [App. B](https://www.ecfr.gov/current/title-12/part-749/appendix-Appendix%20B%20to%20Part%20749)              |
| **GLBA – Protection of Nonpublic Personal Information**                                           | Safeguards principle                                   | [15 U.S.C. §§6801–6809](https://www.law.cornell.edu/uscode/text/15/chapter-94)                                                                                                                           |
| **ADA – Facilities access (supporting)**                                                          | Visitor controls & reasonable access                   | [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) _(supporting; not primary infosec rule)_                                                                                                 |

> _Framework references (non-regulatory): NIST SP 800-53 Rev.5, NIST CSF 2.0._

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                      | Trigger (human → event)                                                |                                                                        Deadline | Content Reference             | Control                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------: | ----------------------------- | -------------------------------------------------------------------------- |
| Cyber incident potentially reportable to NCUA | IR leader flags incident → `incident.potential_reportable`             |              As soon as possible, **≤72 hours** of determination (see Part 748) | NCUA notice content & channel | [IS-09](cybersecurity.md#is-09-incident-response-cyber-incident-reporting) |
| Member notice warranted (data compromise)     | Privacy lead confirms PII exposure → `incident.member_notice_required` | **Without unreasonable delay** after containment & law enforcement coordination | Notice template pack          | [IS-09](cybersecurity.md#is-09-incident-response-cyber-incident-reporting) |
| Privilege removal on termination/transfer     | HR submits separation/transfer → `hr.user.separated`                   |                                                           **Same business day** | Access removal checklist      | [IS-06](cybersecurity.md#is-06-access-control-authentication)              |
| Annual risk assessment                        | Compliance calendar tickler → `risk.assessment.due`                    |                                              **≤12 months** between assessments | RA report to Board            | [IS-02](cybersecurity.md#is-02-enterprise-risk-assessment)                 |
| Vulnerability testing / external scan         | SecOps schedule → `vuln.scan.window.open`                              |     **At least annually**; high-risk findings triage within **5 business days** | VT plan & POA\&M              | [IS-05](cybersecurity.md#is-05-vulnerability-testing-penetration-testing)  |
| Change requiring CAB approval                 | Engineer submits RFC → `change.request.submitted`                      |                                           CAB review within **3 business days** | RFC template                  | [IS-04](cybersecurity.md#is-04-change-management-configuration-control)    |
| Backup verification                           | Ops schedule → `backup.verify.due`                                     |                                                **Weekly** checksum restore test | Backup runbook                | [IS-08](cybersecurity.md#is-08-backup-disaster-recovery)                   |
| Red Flags review                              | Fraud ops cycle → `redflags.review.cycle`                              |                                                    **Quarterly** ruleset review | Red Flags matrix              | [IS-10](cybersecurity.md#is-10-identity-theft-red-flags-program)           |
| AI use disclosure & DPIA                      | Team proposes AI use → `ai.use.proposed`                               |         DPIA prior to production; register update **within 5 days** of approval | AI registry                   | [IS-13](cybersecurity.md#is-13-ai-governance-usage-disclosure)             |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                         | Control Name                                 | Purpose                                            | Primary Rule(s)                                                                                                                                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [IS-01](cybersecurity.md#is-01-governance-oversight)                       | Governance & Oversight                       | Board-approved program; roles; cadence             | [Part 748](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748)                                                                                                            |
| [IS-02](cybersecurity.md#is-02-enterprise-risk-assessment)                 | Enterprise Risk Assessment                   | Identify threats, likelihood, impact, and controls | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-03](cybersecurity.md#is-03-asset-inventory-classification)             | Asset Inventory & Classification             | Know assets, data classes, ownership               | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-04](cybersecurity.md#is-04-change-management-configuration-control)    | Change Management                            | Safe, auditable system changes                     | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-05](cybersecurity.md#is-05-vulnerability-testing-penetration-testing)  | Vulnerability Testing & Pen-Testing          | Find and fix weaknesses                            | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-06](cybersecurity.md#is-06-access-control-authentication)              | Access Control & Authentication              | Least privilege; authN/authZ; termination          | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-07](cybersecurity.md#is-07-data-protection-encryption-disposal)        | Data Protection, Encryption & Disposal       | Protect data in transit/at rest; disposal          | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748), [16 CFR 682](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-F/part-682) |
| [IS-08](cybersecurity.md#is-08-backup-disaster-recovery)                   | Backup & Disaster Recovery                   | Resilience and recovery                            | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                                                                                                     |
| [IS-09](cybersecurity.md#is-09-incident-response-cyber-incident-reporting) | Incident Response & Cyber Incident Reporting | Prepare, detect, respond, notify                   | [Part 748 App. B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748), [§748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1%28c%29)          |
| [IS-10](cybersecurity.md#is-10-identity-theft-red-flags-program)           | Identity Theft Red Flags Program             | Detect, prevent, mitigate ID theft                 | [Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717#subpart-J)                                                                                                                 |
| [IS-11](cybersecurity.md#is-11-vendor-risk-management)                     | Vendor Risk Management                       | Due diligence and contracts                        | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-12](cybersecurity.md#is-12-physical-security-facilities)               | Physical Security & Facilities               | Protect premises, media, visitors                  | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-13](cybersecurity.md#is-13-ai-governance-usage-disclosure)             | AI Governance & Usage Disclosure             | Pro-AI with safeguards; privacy-aligned            | [GLBA](https://www.law.cornell.edu/uscode/text/15/chapter-94), [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                       |
| [IS-14](cybersecurity.md#is-14-logging-monitoring-alerting)                | Logging, Monitoring & Alerting               | Detect anomalies; evidence                         | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-15](cybersecurity.md#is-15-acceptable-use-communications-systems)      | Acceptable Use & Communications Systems      | Staff conduct; email; internet; BYOD               | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-16](cybersecurity.md#is-16-social-media)                               | Social Media                                 | Roles; disclaimers; approval                       | _(supporting; ensure coordination with marketing rules as applicable)_                                                                                                                         |
| [IS-17](cybersecurity.md#is-17-training-awareness-testing)                 | Training, Awareness & Testing                | Security training; phishing sims                   | [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)                                                                                      |
| [IS-18](cybersecurity.md#is-18-records-management-retention)               | Records Management & Retention               | Retention schedules                                | [Part 749](https://www.ecfr.gov/current/title-12/part-749)                                                                                                                                     |

***

### IS-01 — Governance & Oversight

* **WHY (Reg cite):** Board-approved information security program; oversight, resources, accountability. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748).
* **SYSTEM BEHAVIOR:** Maintain a single authoritative “Security Program” record with owners, charter, KPIs, and review cadence; produce quarterly and annual reports to Board/Supervisory Committee.
* **TRIGGERS (human → event):** Board cycle starts → `(governance.board.cycle)`; Policy up for review → `(policy.review.due)`.
* **INPUTS (human → field):** Owner → `(gov.owner.user_id)`; Next review date → `(gov.next_review.date)`; KPIs list → `(gov.kpis.array)`.
* **OUTPUTS:** Board deck; policy redlines; decision log.
* **TIMERS/SLAs:** Annual policy approval; quarterly KPI report **≤30 days** post-quarter.
* **EDGE CASES:** Emergency interim policy; document temporary exceptions with expiry.
* **AUDIT LOGS:** `policy.updated`, `board.report.submitted`, `exception.approved`.
* **ACCESS CONTROL:** Read: all staff; Write: Compliance/IS lead; Approve: Board/Committee.
* **ALERTS/METRICS:** % controls green; open POA\&Ms; overdue reviews.

### IS-02 — Enterprise Risk Assessment

* **WHY (Reg cite):** Identify reasonably foreseeable threats; assess risk and adequacy of controls. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Maintain risk register mapped to assets, threats, controls (NIST categories optional); include fraud/scam, social engineering, ID theft, and AI risks.
* **TRIGGERS:** Risk assessment cycle → `(risk.assessment.due)`; Major change → `(risk.assessment.change)`.
* **INPUTS:** Asset list → `(risk.assets.table)`; Threats → `(risk.threats.array)`; Impact/Likelihood → `(risk.scores.matrix)`.
* **OUTPUTS:** Risk report to Board; POA\&M.
* **TIMERS/SLAs:** **≤12 months** between assessments; POA\&M updates **monthly**.
* **EDGE CASES:** New product fast-track: perform lightweight RA within **10 business days**.
* **AUDIT LOGS:** `risk.register.updated`, `risk.report.issued`.
* **ACCESS CONTROL:** Read: management; Write: Risk/IS; Approve: Board/Supervisory.
* **ALERTS/METRICS:** # high risks; # overdue POA\&M items.

### IS-03 — Asset Inventory & Classification

* **WHY (Reg cite):** Know where member info resides; assign owners and protections. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Maintain CMDB of hardware, software, data stores, vendors; classify data (e.g., Public, Internal, Confidential/NPI).
* **TRIGGERS:** New asset onboard → `(asset.onboarded)`; Asset decommission → `(asset.decom.started)`.
* **INPUTS:** Asset record → `(asset.record.json)`; Data class → `(asset.data.class)`.
* **OUTPUTS:** Current inventory; data flow maps.
* **TIMERS/SLAs:** Inventory delta posted within **5 business days** of change; quarterly attestation.
* **EDGE CASES:** Shadow IT → quarantine until inventoried.
* **AUDIT LOGS:** `asset.created`, `asset.updated`, `asset.retired`.
* **ACCESS CONTROL:** Read: IS/Ops; Write: Owners/IS.
* **ALERTS/METRICS:** % assets with owner/classification; % vendor assets with DPAs.

### IS-04 — Change Management & Configuration Control

* **WHY (Reg cite):** Prevent unauthorized changes; ensure testing and rollback. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** RFC workflow (risk, test evidence, backout, approval); CAB for medium/high risk; infra as code preferred; emergency changes documented post-hoc.
* **TRIGGERS:** Engineer submits RFC → `(change.request.submitted)`; Emergency change → `(change.emergency.invoked)`.
* **INPUTS:** Risk level → `(change.risk.level)`; Approver → `(change.approver.user_id)`; Backout → `(change.backout.plan)`.
* **OUTPUTS:** Approved RFC; change tickets; release notes.
* **TIMERS/SLAs:** CAB review **≤3 business days**; emergency post-review **≤24 hours**.
* **EDGE CASES:** Security patch out of band; expedite path with auto-approval rules.
* **AUDIT LOGS:** `change.approved`, `change.deployed`, `change.rolled_back`.
* **ACCESS CONTROL:** Approve: CAB/IS; Deploy: DevOps.
* **ALERTS/METRICS:** Change failure rate; % changes with tests.

### IS-05 — Vulnerability Testing & Penetration Testing

* **WHY (Reg cite):** Ongoing testing appropriate to risk. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Schedule automated scans; annual external pen-test; triage/patch per severity; track to closure in POA\&M.
* **TRIGGERS:** Scan window → `(vuln.scan.scheduled)`; Pen-test start → `(pentest.started)`.
* **INPUTS:** Targets → `(vuln.targets.list)`; Findings → `(vuln.findings.table)`.
* **OUTPUTS:** Reports; remediation tickets; executive summary.
* **TIMERS/SLAs:** Critical patching **≤7 days**; High **≤15**; Medium **≤30** (Assumption—needs confirmation).
* **EDGE CASES:** Compensating control documented if vendor patch not available.
* **AUDIT LOGS:** `scan.completed`, `finding.remediated`.
* **ACCESS CONTROL:** Read: IS/Engineering leadership; Write: SecOps.
* **ALERTS/METRICS:** MTTR by severity; open criticals.

### IS-06 — Access Control & Authentication

* **WHY (Reg cite):** Least privilege, unique IDs, strong authentication. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Enforce SSO/MFA; role-based access; joiner/mover/leaver automation; lockouts; password policy consistent with digital banking controls.
* **TRIGGERS:** Hire → `(hr.user.onboarded)`; Transfer → `(hr.user.transferred)`; Termination → `(hr.user.separated)`.
* **INPUTS:** Role → `(iam.role.id)`; Manager approval → `(iam.approval.signature)`; Access expiry → `(iam.access.expiry)`.
* **OUTPUTS:** Provisioned accounts; access review attestations.
* **TIMERS/SLAs:** Termination deprovision **same day**; periodic access reviews **quarterly**.
* **EDGE CASES:** Break-glass accounts with heightened logging.
* **AUDIT LOGS:** `iam.provisioned`, `iam.deprovisioned`, `iam.role_changed`, `auth.failed.lockout`.
* **ACCESS CONTROL:** Approve: Manager + Data Owner; Execute: IAM.
* **ALERTS/METRICS:** Orphaned accounts; privileged access count.

### IS-07 — Data Protection, Encryption & Disposal

* **WHY (Reg cite):** Protect NPI; secure disposal. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748); [16 CFR Part 682](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-F/part-682).
* **SYSTEM BEHAVIOR:** Encrypt data in transit and at rest; enforce DLP for email and file sharing; approved crypto (e.g., AES-256, TLS 1.2+); disposal renders data unreadable; secure media handling.
* **TRIGGERS:** New data store → `(data.store.created)`; Disposal request → `(data.disposal.requested)`.
* **INPUTS:** Data class → `(data.class)`; Key owner → `(kms.key.owner)`; Retention code → `(records.schedule.code)`.
* **OUTPUTS:** Encryption configs; disposal certificates.
* **TIMERS/SLAs:** Disposal within **30 days** of eligibility unless litigation hold.
* **EDGE CASES:** Third-party hosted data—contractual destruction certification.
* **AUDIT LOGS:** `kms.key.used`, `data.exported`, `data.disposed`.
* **ACCESS CONTROL:** KMS custodians limited; dual control for key rotation.
* **ALERTS/METRICS:** % stores encrypted; DLP incidents.

### IS-08 — Backup & Disaster Recovery

* **WHY (Reg cite):** Preserve vital records; recover operations. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Define RTO/RPO by system; offsite/immutable backups; periodic restore tests; DR runbook with roles and comms.
* **TRIGGERS:** Backup job start → `(backup.job.started)`; DR test scheduled → `(dr.test.scheduled)`.
* **INPUTS:** System criticality → `(bcdr.criticality.tier)`; RTO/RPO → `(bcdr.targets)`.
* **OUTPUTS:** Backup logs; restore test reports; DR exercise report.
* **TIMERS/SLAs:** Weekly restore verification; annual full DR exercise.
* **EDGE CASES:** Ransomware isolation; clean-room restores.
* **AUDIT LOGS:** `backup.completed`, `restore.verified`, `dr.exercise.completed`.
* **ACCESS CONTROL:** Backup vault restricted; dual control for destructive ops.
* **ALERTS/METRICS:** Backup success rate; last successful restore age.

### IS-09 — Incident Response & Cyber Incident Reporting

* **WHY (Reg cite):** Response program & notifications. [Part 748 App. B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748); 72-hour notice: [§748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1%28c%29).
* **SYSTEM BEHAVIOR:** Maintain IR plan, team roster, and playbooks (malware, credential compromise, vendor breach, BEC, data leakage); coordinate with law enforcement; determine member notice.
* **TRIGGERS:** Suspected incident → `(incident.suspected)`; Confirmed reportable → `(incident.reportable.confirmed)`.
* **INPUTS:** Impacted systems → `(ir.scope.assets)`; Data elements → `(ir.data.elements)`; Decision log → `(ir.decision.log)`.
* **OUTPUTS:** Incident ticket; NCUA report; member notices; lessons learned.
* **TIMERS/SLAs:** NCUA notice **≤72 hours**; member notice per App. B (without unreasonable delay).
* **EDGE CASES:** Third-party breach where scope unclear—initiate joint investigation and interim notice strategy.
* **AUDIT LOGS:** `ir.playbook.invoked`, `ncua.report.sent`, `member.notice.sent`.
* **ACCESS CONTROL:** IR team only; legal holds applied.
* **ALERTS/METRICS:** MTTD/MTTR; # reportables; tabletop frequency.

### IS-10 — Identity Theft Red Flags Program

* **WHY (Reg cite):** Detect, prevent, mitigate identity theft. [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717#subpart-J).
* **SYSTEM BEHAVIOR:** Maintain red-flag matrix (alerts, docs, activity patterns); step-up verification; account holds.
* **TRIGGERS:** Flag hit → `(redflag.hit)`; Address change prior to new card → `(address.change.before.card)`.
* **INPUTS:** Flag type → `(redflag.type)`; Verification outcome → `(redflag.verify.result)`.
* **OUTPUTS:** Case notes; SAR referral where applicable.
* **TIMERS/SLAs:** Review red-flag cases **same day**; rule review **quarterly**.
* **EDGE CASES:** Elder fraud escalation; EWA/fintech partner channel anomalies.
* **AUDIT LOGS:** `redflag.case.opened`, `redflag.case.closed`.
* **ACCESS CONTROL:** Fraud ops; restricted read to support teams.
* **ALERTS/METRICS:** False positive rate; time to resolution.

### IS-11 — Vendor Risk Management

* **WHY (Reg cite):** Ensure service providers protect member info. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Due diligence (security, privacy, SOC reports), contractual safeguards (breach notice, disposition, right to audit), ongoing monitoring.
* **TRIGGERS:** New vendor → `(vendor.onboard.requested)`; Renewal → `(vendor.renewal.due)`; Incident → `(vendor.incident.reported)`.
* **INPUTS:** Diligence pack → `(vendor.dd.pack)`; Data types → `(vendor.data.scope)`.
* **OUTPUTS:** Risk rating; contract clauses; monitoring calendar.
* **TIMERS/SLAs:** High-risk vendors annual review; breach notice windows per contract (Assumption—set **24–72h**).
* **EDGE CASES:** Sub-processors disclosure and approval.
* **AUDIT LOGS:** `vendor.approved`, `vendor.review.completed`.
* **ACCESS CONTROL:** VRM owned by Compliance/Procurement.
* **ALERTS/METRICS:** % critical vendors with current SOC; SLA breaches.

### IS-12 — Physical Security & Facilities

* **WHY (Reg cite):** Protect facilities, media, and visitors. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Card/access controls; visitor escort & logs; CCTV/alarm monitoring; secure areas for servers/media; environmental protections.
* **TRIGGERS:** Visitor arrival → `(visitor.checkin)`; Badge revoke → `(badge.revoke.request)`.
* **INPUTS:** Access list → `(phys.access.whitelist)`; Visitor log → `(visitor.log.entry)`.
* **OUTPUTS:** Access logs; incident tickets.
* **TIMERS/SLAs:** Badge deactivation **≤24h** post-separation.
* **EDGE CASES:** Emergency access with post-event review.
* **AUDIT LOGS:** `door.access.granted`, `visitor.logged`.
* **ACCESS CONTROL:** Facilities/IS.
* **ALERTS/METRICS:** Tailgating alerts; access exceptions.

### IS-13 — AI Governance & Usage Disclosure

* **WHY (Reg cite):** Safeguards for NPI when using AI; privacy and security controls. [GLBA](https://www.law.cornell.edu/uscode/text/15/chapter-94); [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Default **pro-AI** posture with controls: AI Use Register; DPIA for models/tools; vendor/feature review; disclosure of AI use in member-facing workflows; no unapproved uploads of NPI to external AI.
* **TRIGGERS:** New AI tool/workflow → `(ai.use.proposed)`; Model update → `(ai.model.change)`.
* **INPUTS:** Purpose → `(ai.purpose.text)`; Data categories → `(ai.data.classes)`; DPIA result → `(ai.dpia.result)`.
* **OUTPUTS:** AI registry entry; user disclosures; guardrail configs (e.g., content filters, PII scrubbing).
* **TIMERS/SLAs:** DPIA prior to production; registry update **≤5 days**.
* **EDGE CASES:** Fine-tuning with member data requires explicit approval and documented minimization/pseudonymization.
* **AUDIT LOGS:** `ai.tool.approved`, `ai.guardrail.blocked`, `ai.disclosure.rendered`.
* **ACCESS CONTROL:** Approvals by IS/Privacy; usage by authorized teams.
* **ALERTS/METRICS:** # blocked PII egress attempts; model drift alerts (Assumption).

### IS-14 — Logging, Monitoring & Alerting

* **WHY (Reg cite):** Monitor for anomalies; support IR. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Centralize logs (SIEM); time-sync; retain security-relevant logs; real-time alerting for critical events.
* **TRIGGERS:** New system onboard → `(logging.source.added)`; Offense detected → `(siem.offense.created)`.
* **INPUTS:** Log source metadata → `(logging.source.meta)`; Retention → `(logging.retention.days)`.
* **OUTPUTS:** Dashboards; alerts; case artifacts.
* **TIMERS/SLAs:** Daily review of critical alerts; log retention **≥12 months** (Assumption—align with records schedule).
* **EDGE CASES:** Privacy by design for employee monitoring; minimize PII in logs.
* **AUDIT LOGS:** `siem.ingest.started`, `alert.acknowledged`, `case.closed`.
* **ACCESS CONTROL:** Least privilege to logs; IR team full read.
* **ALERTS/METRICS:** Alert fatigue score; mean acknowledge time.

### IS-15 — Acceptable Use & Communications Systems

* **WHY (Reg cite):** Human control surface for many risks. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Document what employees can/can’t do with devices, email, messaging, internet, removable media; monitoring notice; BYOD constraints; remote work safeguards.
* **TRIGGERS:** New hire → `(hr.onboard.policy.ack)`; Policy update → `(policy.au.updated)`.
* **INPUTS:** User acknowledgment → `(policy.ack.timestamp)`; Device enrollment → `(mdm.device.id)`.
* **OUTPUTS:** Signed acknowledgments; MDM compliance posture.
* **TIMERS/SLAs:** Acknowledgment required **before** access is granted.
* **EDGE CASES:** Reasonable personal use; protected concerted activity respected per law (Assumption—labor counsel to confirm).
* **AUDIT LOGS:** `policy.ack.logged`, `mdm.noncompliant.flag`.
* **ACCESS CONTROL:** HR/IS maintain records.
* **ALERTS/METRICS:** % devices compliant; phishing sim failure rate (ties to [IS-17](cybersecurity.md#is-17-training-awareness-testing)).

### IS-16 — Social Media

* **WHY (Reg cite):** Prevent brand/data leakage; ensure disclosures and approvals (marketing rules may apply separately).
* **SYSTEM BEHAVIOR:** Pre-approval for corporate posts; disclaimers for personal posts; no member info disclosure; escalate scams/impersonation.
* **TRIGGERS:** Post request → `(social.post.requested)`; Impersonation report → `(social.impersonation.flagged)`.
* **INPUTS:** Channel → `(social.channel)`; Content → `(social.content.id)`.
* **OUTPUTS:** Approved posts; takedown/impersonation reports.
* **TIMERS/SLAs:** Takedown escalation **same day**.
* **EDGE CASES:** Employee bio linking—training provided.
* **AUDIT LOGS:** `social.post.approved`, `social.takedown.requested`.
* **ACCESS CONTROL:** Marketing/Comms; Security for takedowns.
* **ALERTS/METRICS:** # spoof domains/accounts detected.

### IS-17 — Training, Awareness & Testing

* **WHY (Reg cite):** Personnel competence underpins the program. [Part 748 App. A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748).
* **SYSTEM BEHAVIOR:** Role-based training; quarterly phishing simulations; high-risk role deep-dives; records retained.
* **TRIGGERS:** New role → `(training.assignment.created)`; Phishing sim → `(phish.sim.launched)`.
* **INPUTS:** Curriculum → `(training.curriculum.id)`; Completion → `(training.completion.timestamp)`.
* **OUTPUTS:** Completion reports; improvement plan.
* **TIMERS/SLAs:** New hire training within **30 days**; annual refreshers.
* **EDGE CASES:** Re-training for repeated phishing failures.
* **AUDIT LOGS:** `training.assigned`, `training.completed`.
* **ACCESS CONTROL:** HR/Compliance own LMS.
* **ALERTS/METRICS:** Completion %; phish fail rate trend.

### IS-18 — Records Management & Retention

* **WHY (Reg cite):** Preserve required records; dispose timely. [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749).
* **SYSTEM BEHAVIOR:** Apply retention schedule by record class; legal hold process; align with disposal in [IS-07](cybersecurity.md#is-07-data-protection-encryption-disposal).
* **TRIGGERS:** Record created → `(records.item.created)`; Retention met → `(records.expired)`.
* **INPUTS:** Record class → `(records.class.code)`; Hold flag → `(records.hold.flag)`.
* **OUTPUTS:** Retention schedule; destruction log.
* **TIMERS/SLAs:** Destruction queue processed **monthly** (unless on hold).
* **EDGE CASES:** Mixed content systems—declare record in M365/G Suite equivalents (Assumption).
* **AUDIT LOGS:** `records.destroyed`, `hold.applied`.
* **ACCESS CONTROL:** Records manager; custodians by function.
* **ALERTS/METRICS:** Over-retained items; holds age.

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Board Pack:** Annual program report template; risk heatmap; POA\&M summary.
* **Risk Assessment:** Asset/threat/control matrix; scoring rubric.
* **Change Management:** RFC form; CAB agenda; emergency change post-mortem.
* **Vuln/Pen-Test:** Scope request; false positive challenge; remediation plan.
* **Access Management:** JML checklist; privileged access request; quarterly review attestation.
* **Incident Response:** NCUA 72-hour notification script; member notice template; law-enforcement coordination checklist; tabletop scenario pack.
* **Red Flags:** Rules matrix; verification scripts; escalation tree; SAR referral cue sheet.
* **Vendor Risk:** Diligence checklist (security/privacy/SOC); contract clause library; monitoring plan.
* **Data Protection:** Encryption standards quick-ref; disposal certificate template; DLP exception form.
* **Backup/DR:** Restore test runbook; communications tree; alt-site checklist.
* **AI Governance:** DPIA template; AI Use Register schema; disclosure snippets; prompt-safety/do-not-paste guidance.
* **Acceptable Use & Social:** Acknowledgment form; remote work setup list; social disclaimer boilerplate.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{Owner, Title\}}
* **Approvals:** \{{Approver 1, Title\}}; \{{Approver 2, Title\}}
* **Review Cadence:** Annual, or sooner upon material changes (product, technology, vendor, incident).
* **Cross-References:** Vendor Due Diligence & Oversight; Configuration Management; Patch Management; Incident Response Policy; Electronic Communications/Acceptable Use; Records Retention Schedule.

***

### Assumptions & Gaps

* **Deadlines & SLAs:** Where not explicitly set by regulation (e.g., vuln remediation windows, log retention months), conservative industry-standard targets were assumed—confirm with Risk/Board.
* **AI Controls:** GLBA and NCUA safeguarding principles applied to AI; specific disclosure language to be finalized with Privacy and Legal.
* **Social Media & Marketing Rules:** This policy sets security/usage boundaries; marketing compliance (e.g., Reg Z advertising) is out of scope here and should be addressed in a separate policy if applicable.
* **Placeholders:** \{{ORGANIZATION\}}, OWNER/APPROVERS, and SCOPE to be populated; integrate any REFERENCE\_POLICY clauses only where they strengthen controls without duplicating this spec.
