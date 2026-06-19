```yaml
---
title: Electronic Payment Systems Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Electronic Payment Systems, ACH, Wire Transfer, Fraud, Authentication, Vendor Due Diligence, Training, Testing, Business Continuity]
---
```

## General Policy Statement

Pynthia Credit Union recognizes that electronic payment systems — including ACH origination, wire transfer (Fedwire, SWIFT), debit/ATM cards, retail and business online banking, bill payment, mobile and remote deposit capture, Zelle, and lockbox — carry the highest operational risk of any electronic banking category, arising primarily from fraud, error, and service-delivery failure through third-party vendors. The Credit Union commits to managing these risks through controls commensurate with their severity: structured feasibility analysis for new services, incident preparedness, comprehensive internal controls and testing, active management and Board oversight, layered authentication, dual control for high-risk processes, fraud protection tools, rigorous vendor due diligence, and ongoing employee and client training. The Assistant Vice President of Deposit Operations is accountable for risk assessment and procedure implementation; the Chief Compliance Officer owns this policy; and audit personnel independently verify the internal control structure. Consumer-facing channel enrollment and member experience, cybersecurity and IT general controls, vendor onboarding program governance, enterprise risk taxonomy, and business continuity program detail are governed by separate policies referenced herein.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New electronic banking service proposed | Proposal submitted → `eps.proposal.submitted` | Before deployment | Product Risk Analysis form; ERM Committee review | [EPS-01](#eps-01-planning-and-feasibility-analysis) |
| BCP/IRP test of key electronic banking services | Scheduled test cycle → `eps.bcp_test.scheduled` | Per BCP schedule (at least annual) | Business Continuity Plan Policy | [EPS-02](#eps-02-incident-planning-and-preparedness) |
| Internal control review of electronic payment systems | Review cycle opens → `eps.control_review.opened` | Annual (internal SLA) | Control review checklist; deficiency log | [EPS-03](#eps-03-internal-routines-and-controls) |
| IT Committee meeting | Quarterly calendar → `eps.it_committee.convened` | Quarterly | IT Committee minutes; dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |
| IT Audit | Annual audit cycle → `eps.it_audit.opened` | Annual | IT Audit report | [EPS-04](#eps-04-management-supervision-and-oversight) |
| Board report on electronic banking risks | Periodic reporting cycle → `eps.board_report.delivered` | Periodic (at least annual) | Electronic Banking Summary; dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |
| Client authentication event (login/transaction) | Client accesses electronic banking service → `eps.auth.decided` | Real-time | Exhibit A; Electronic Banking Authentication and Risk Assessment | [EPS-05](#eps-05-authentication-controls) |
| High-risk transaction requiring dual control | Transaction initiated → `wire_transfer.submitted` or `ach_transfer.created` | Before release/settlement | Exhibit B; dual-control procedures | [EPS-06](#eps-06-dual-control-for-high-risk-processes) |
| Positive Pay exception decision | Item presented → `eps.pospay_exception.presented` | Per client SLA (internal: same business day) | Positive Pay exception queue | [EPS-07](#eps-07-electronic-fraud-protection-systems) |
| Fraud trend review | Periodic monitoring cycle → `eps.fraud_trend_review.completed` | Periodic (at least quarterly) | Fraud trend report; industry alerts | [EPS-07](#eps-07-electronic-fraud-protection-systems) |
| Annual vendor SOC report review (Fiserv/Jack Henry) | Annual DD cycle opens → `eps.vendor_dd_cycle.opened` | Annual | SOC 1 Type II; SOC 2 Type II; encryption requirements | [EPS-08](#eps-08-vendor-due-diligence) |
| Employee training — initial (new hire) | Employee hired → `employee.hired` | Per training policy (internal: 30 days of hire) | Training plan; role curriculum | [EPS-09](#eps-09-expertise-and-training) |
| Employee training — annual cycle | Annual cycle opens → `eps.training_annual_cycle.opened` | Annual | Annual training completion records | [EPS-09](#eps-09-expertise-and-training) |
| Client onboarding training | Client enrolled → `eps.client.enrolled` | At onboarding | Training guides; resource materials | [EPS-09](#eps-09-expertise-and-training) |
| Client annual self-certification | Annual cycle opens → `eps.training_annual_cycle.opened` | Annual (where applicable) | Self-certification form | [EPS-09](#eps-09-expertise-and-training) |
| Phishing/fraud communication to clients | Periodic communications cycle → `eps.training_fraud_comm.sent` | Periodic | Fraud communication artifact | [EPS-09](#eps-09-expertise-and-training) |
| Pre-deployment system testing | New system/change scheduled → `eps.deployment.scheduled` | Before go-live | Test plan; test results; vendor participation evidence | [EPS-10](#eps-10-pre-deployment-testing) |

---

## EPS-01 — Planning and Feasibility Analysis {#eps-01-planning-and-feasibility-analysis}

**WHY (Reg cite):** FFIEC IT Examination Handbook (E-Banking Booklet) and [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) require credit unions to assess risk before deploying new electronic services and to maintain controls commensurate with that risk. Sound practice mandates a structured feasibility process — study, design/development, and operation — before any new payment channel goes live.

**SYSTEM BEHAVIOR:** When a proposal for a new electronic banking service is submitted, the system creates an EPS proposal record and routes it through three sequential stages: (1) Study — needs, objectives, and alternatives are documented; (2) Design and Development — the selected solution is specified, policies and procedures are drafted, and documentation is completed; (3) Operation — the service is confirmed to be properly operated and maintained. A Product Risk Analysis form (`eps.product_risk_analysis.drafted`) must be prepared and presented to the Enterprise Risk Management Committee (`eps.erm_review.decided`) before the service is activated. No new electronic payment service may be activated without a completed ERM Committee review decision on record. The EPS proposal record and Product Risk Analysis form are write-restricted to the AVP of Deposit Operations and Compliance; read access is granted to the ERM Committee and IT Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New electronic banking service proposed (`eps.proposal.submitted`) | Proposal description (`eps.proposal.sponsor`, `eps.proposal.study_doc`), service identifier (`eps.service.id`), sponsoring business unit | Study document on record; proposal record created (`eps.proposal.submitted`) | Before design phase begins (internal: 10 BD of proposal receipt) |
| Design and development stage complete (`eps.proposal.submitted` → design stage) | Best-solution selection rationale, draft policies/procedures, design documentation (`eps.proposal.design_docs`) | Design documentation package on record; stage transition logged (`eps.proposal.submitted`) | Before operation stage begins |
| Product Risk Analysis form drafted (`eps.product_risk_analysis.drafted`) | Completed risk analysis covering all three stages, service risk tier, inherent risk score (`risk.inherent_score`) | Product Risk Analysis form (`eps.product_risk_analysis.drafted`) filed and routed to ERM Committee | Before ERM Committee meeting |
| ERM Committee reviews and decides on new service (`eps.erm_review.decided`) | Product Risk Analysis form, design documentation, risk assessment delta (`eps.risk_assessment.delta`) | ERM Committee decision recorded (`eps.erm_review.decided`); Electronic Banking Risk Assessment updated (`eps.risk_assessment_service.added`) | Before service activation (`eps.service.activated`) |
| New service activated (`eps.service.activated`) | ERM Committee approval on record, operational procedures in place | Service activation logged (`eps.service.activated`); Electronic Banking Risk Assessment updated | Only after `eps.erm_review.decided` with approval |

**ALERTS/METRICS:** Alert if any `eps.service.activated` event occurs without a preceding `eps.erm_review.decided` approval for the same service — target zero occurrences. Alert if a proposal record remains in Study or Design stage beyond 60 calendar days without a stage transition.

---

## EPS-02 — Incident Planning and Preparedness {#eps-02-incident-planning-and-preparedness}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to maintain an incident response program and business continuity plan covering information systems and electronic services. The FFIEC IT Examination Handbook (Business Continuity Management Booklet) sets expectations for regular testing of critical electronic banking services. Incident notification obligations for cybersecurity incidents are governed by [NCUA 12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748).

**SYSTEM BEHAVIOR:** The Credit Union maintains a Business Continuity Plan (BCP), associated procedures, and an Incident Response Plan (IRP) that explicitly cover electronic banking risks, including all in-scope payment channels. The BCP must include regular testing of key electronic banking services; test results and after-action items are tracked to closure. When an electronic banking incident is detected, the incident response workflow is activated: the incident is declared, severity assigned, and — where the incident meets NCUA reportability thresholds — the NCUA notification timer is set. Incident records are write-restricted to the AVP of Deposit Operations and the Incident Commander; Compliance has read access. BCP test scheduling and results are maintained by the AVP of Deposit Operations and reviewed by the IT Committee. Detail on BCP program structure, DR objectives, and recovery procedures resides in the Business Continuity Plan Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| BCP test of key electronic banking services scheduled (`eps.bcp_test.scheduled`) | Test scenario (`eps.bcp_test.scenario`), services in scope, test date | BCP test scheduled (`eps.bcp_test.scheduled`); task created (`eps.bcp_test.due_at`) | Per BCP schedule; at least annually |
| BCP test of key electronic banking services completed (`eps.bcp_test.completed`) | Test results, defects identified (`eps.test.defects`), after-action items | BCP test results recorded (`eps.bcp_test.completed`); deficiencies logged if any (`eps.control_review.deficiency_found`) | Within 10 BD of test execution |
| Electronic banking incident detected (`eps.incident.detected`) | Incident description (`incident.description`), affected service (`eps.service.id`), initial severity (`eps.incident.severity`), vendor linkage if applicable (`eps.incident.vendor_linked`) | Incident opened (`eps.incident.opened`); incident record created (`incident.created`) | Immediately upon detection |
| Incident reportability to NCUA determined (`eps.incident.reportable_determined`) | Incident scope (`incident.scope`), member impact (`eps.incident.impact`), reportability assessment (`incident.reportability_assessment`) | Reportability determination recorded (`eps.incident.reportable_determined`); NCUA notification timer set if reportable (`eps.incident.ncua_due_at`) | Within 72 hours of incident discovery (NCUA 72-hour rule where applicable; enforced by `eps.incident.ncua_due_at`) |
| NCUA notified of reportable incident (`eps.incident_ncua.notified`) | NCUA notification content, incident record reference | NCUA notification logged (`eps.incident_ncua.notified`) | Within 72 hours of discovery (enforced by `eps.incident.ncua_due_at`) |

**ALERTS/METRICS:** Alert if a BCP test for electronic banking services has not been completed within the scheduled window — target zero overdue tests. Alert if an incident with `eps.incident.reportable_determined` = true has no `eps.incident_ncua.notified` event within 72 hours of discovery. Monitor mean time to incident containment for electronic banking incidents.

---

## EPS-03 — Internal Routines and Controls {#eps-03-internal-routines-and-controls}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to implement a comprehensive information security program with controls protecting member information and operational systems. The FFIEC IT Examination Handbook (E-Banking Booklet) requires management to validate controls protecting hardware, software, proprietary data, and electronic transmissions through systematic reviews and testing.

**SYSTEM BEHAVIOR:** Management maintains a program of comprehensive system reviews and tests that validate controls protecting hardware, software, proprietary data, and electronic transmissions across all in-scope payment channels. Reviews are conducted at least annually and whenever a material change to a payment system occurs. Each review produces a checklist of controls tested, a list of deficiencies found, and a remediation plan for any open items. Users of electronic payment systems are trained to adhere to control standards (see [EPS-09](#eps-09-expertise-and-training)). Control review records are write-restricted to the AVP of Deposit Operations; audit personnel have independent read access to verify the internal control structure. Deficiency remediation is tracked to closure with aging alerts.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual control review cycle opens (`eps.control_review.opened`) | Prior findings (`eps.control_review.prior_findings`), control review checklist (`eps.control_review.checklist`), services in scope | Control review opened (`eps.control_review.opened`); review task created (`eps.control_review.due_at`) | Annually; also triggered by material system change |
| Control review completed (`eps.control_review.completed`) | Completed checklist, deficiency findings (`eps.control_review.deficiency_found`), test evidence | Control review completed (`eps.control_review.completed`); deficiencies logged (`eps.deficiency.description`, `eps.deficiency.rating`, `eps.deficiency.open_list`) | Within 30 CD of review period close |
| Deficiency identified and remediation plan created (`eps.deficiency_remediation.opened`) | Deficiency description (`eps.deficiency.description`), severity rating (`eps.deficiency.rating`), remediation owner | Deficiency remediation opened (`eps.deficiency_remediation.opened`); remediation due date set (`eps.deficiency.remediation_due_at`) | Within 5 BD of deficiency identification |
| Deficiency remediated and closed | Remediation evidence, retesting results | Deficiency closed (logged against `eps.deficiency.open_list`); control review record updated | Per remediation plan deadline (`eps.deficiency.remediation_due_at`) |

**ALERTS/METRICS:** Alert if any open deficiency (`eps.deficiency.open_list`) ages beyond its `eps.deficiency.remediation_due_at` — target zero overdue remediations. Alert if no `eps.control_review.completed` event exists for any in-scope payment channel within the prior 12 months.

---

## EPS-04 — Management Supervision and Oversight {#eps-04-management-supervision-and-oversight}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires the board of directors to be actively involved in overseeing the information security program. The FFIEC IT Examination Handbook (E-Banking Booklet) sets expectations for management reporting structures, committee governance, and board-level visibility into electronic banking risks.

**SYSTEM BEHAVIOR:** Management and the Board are kept actively informed of electronic banking risks through a structured set of oversight artifacts: the Electronic Banking Risk Assessment (maintained continuously), quarterly IT Committee meetings, an IT Risk Assessment, an annually prepared IT Strategic Plan, an annual IT Audit, IT and Deposit Operations dashboards, and an Electronic Banking Summary. Periodic reports are delivered to the Board. The AVP of Deposit Operations is responsible for maintaining these artifacts; the IT Committee and ERM Committee are required participants in their review. Board reports are write-restricted to the CCO and AVP of Deposit Operations; the Board has read access. Dashboard data is produced by the IT and Deposit Operations functions and surfaced through the registered `eps.dashboard.it` and `eps.dashboard.deposit_ops` fields.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| IT Committee convened (quarterly) (`eps.it_committee.convened`) | Agenda, dashboard data (`eps.dashboard.it`, `eps.dashboard.deposit_ops`), Electronic Banking Summary (`eps.summary.ebanking`), open risk items | IT Committee minutes filed (`eps.it_committee_minutes.filed`) | Quarterly (internal: within 15 CD of quarter end) |
| IT Audit cycle opens (`eps.it_audit.opened`) | Prior audit findings (`eps.it_audit.prior_findings`), audit scope, audit plan | IT Audit opened (`eps.it_audit.opened`); audit task created (`eps.it_audit.due_at`) | Annually |
| IT Audit report issued (`eps.it_audit_report.issued`) | Completed audit fieldwork, findings, management responses | IT Audit report issued (`eps.it_audit_report.issued`); findings routed to Board | Within 30 CD of audit fieldwork completion |
| Board report on electronic banking risks delivered (`eps.board_report.delivered`) | Electronic Banking Summary (`eps.summary.ebanking`), risk assessment delta (`eps.risk_assessment.delta`), dashboard snapshots, open findings | Board report delivered (`eps.board_report.delivered`) | Periodically; at least annually (internal: at each Board meeting where EPS is on agenda) |

**ALERTS/METRICS:** Alert if no `eps.it_committee_minutes.filed` event exists within 95 days of the prior filing (i.e., quarterly cadence missed). Alert if no `eps.it_audit_report.issued` event exists within the prior 13 months. Alert if no `eps.board_report.delivered` event exists within the prior 13 months.

---

## EPS-05 — Authentication Controls {#eps-05-authentication-controls}

**WHY (Reg cite):** FFIEC Authentication Guidance (2005 and 2011 Supplement) and the FFIEC IT Examination Handbook (E-Banking Booklet) require financial institutions to implement layered authentication controls on electronic banking services commensurate with the risk of the transaction or access level. [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls protecting member information and system access. [Regulation E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005) creates liability implications for unauthorized EFTs that authentication controls help mitigate.

**SYSTEM BEHAVIOR:** All client-facing electronic banking services require user authentication; the degree of authentication is calibrated to the risk tier of the service and function, as documented in Exhibit A and the Electronic Banking Authentication and Risk Assessment. Baseline controls include user ID and password for all services. Higher-risk functions (ACH origination, wire transfer, business online banking) require tokens and, where applicable, dual control (see [EPS-06](#eps-06-dual-control-for-high-risk-processes)). Additional controls include IP address restrictions, day/time restrictions, mobile device registration, and challenge questions for retail channels. Card Control settings applied by clients do not override institution-defined card limits and do not bypass the EnFact card monitoring process. Authentication failure counts are tracked; lockout is applied upon reaching the failure threshold (`eps.auth.failure_threshold_reached`). Client enrollment authentication controls are governed by the Electronic Banking Authentication and Risk Assessment; consumer-facing enrollment experience is governed by the E-Commerce Policy. Authentication configuration is write-restricted to the AVP of Deposit Operations and IT; Compliance has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Client authentication attempt on electronic banking service (`eps.auth.decided`) | User credentials (`eps.auth.credentials`), service risk tier (`eps.auth.risk_tier`), device registration status (`eps.auth.device_registered`), IP address, time of access | Authentication decision logged (`eps.auth.decided`); failure count incremented if failed (`eps.auth.failure_count`) | Real-time |
| Authentication failure threshold reached (`eps.auth_lockout.applied`) | Failure count (`eps.auth.failure_count`), user identity, service identifier (`eps.service.id`) | Account/session lockout applied (`eps.auth_lockout.applied`); lockout event logged | Immediately upon threshold breach |
| Challenge question or step-up authentication triggered (`eps.auth.challenged`) | Risk signal, user identity, challenge question set (`member_credential.security_questions`) | Step-up challenge issued and result logged (`eps.auth.challenged`) | Real-time |
| Card control settings applied or changed by client (`eps.card_control.applied`, `eps.card_control.changed`) | Client card identifier (`card.id`), control settings (`card.spend_controls`), institution limit floor (`eps.card.institution_limits`) | Card control change logged (`eps.card_control.applied` or `eps.card_control.changed`); institution limits verified not overridden | Real-time |

**ALERTS/METRICS:** Alert on anomalous authentication failure rates by service or user cohort exceeding baseline thresholds. Monitor lockout event volume daily — sustained elevation indicates credential-stuffing or brute-force activity. Alert if any card control change event bypasses the institution-limit floor check.

---

## EPS-06 — Dual Control for High-Risk Processes {#eps-06-dual-control-for-high-risk-processes}

**WHY (Reg cite):** FFIEC IT Examination Handbook (Retail Payment Systems Booklet) and FFIEC Authentication Guidance require layered controls — including dual control — for high-risk electronic payment functions. [NACHA Operating Rules](https://www.nacha.org/rules) require originators to implement controls over ACH origination, including exposure limits. Federal Reserve / Fedwire Operating Circular and SWIFT operating rules govern wire settlement controls. [Regulation E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005) creates error-resolution obligations that dual control helps prevent from arising.

**SYSTEM BEHAVIOR:** Electronic processes identified as higher-risk require dual controls or enhanced system access, as documented in Exhibit B. For ACH origination via Business Online Banking: dual control is recommended for clients originating over $50,000 per batch; client exposure limits are assigned by the Credit Union for clients not operating under a pre-fund model; user limits may be set below the client limit; and file creation may be restricted to pre-defined templates. For wire transfers via Business Online Banking: dual control or offline callback approval with PIN is required; daily or periodic limits are assigned per client; user limits may be set below the client limit; and file creation is restricted to pre-defined templates. For internal Fedwire processing (Payments Exchange): user ID, passcode, and token are required for system access; an additional PIN is required to release outgoing wires; access is restricted to registered IP addresses with day/time restrictions; and two employees must originate a wire. For SWIFT Alliance Lite2: SWIFT code is used to receive foreign wires; Alliance Lite2 software sends messages to SWIFT participants; actual fund movement occurs through Payments Exchange/Fedwire. For Wire Processing TSP (foreign dollar and non-Fedwire wires): same dual-control and PIN-release requirements as Payments Exchange. For Item Processing (cash letter, ACH returns): user ID, password, and token required; Federal Reserve Bank security certificate required. For Fiserv EFT (debit card maintenance and EnFact): user ID, PIN, and token required. Limit changes require documented justification and approver identity (`eps.limit_change.approver_id`, `eps.limit_change.justification`). Dual-control configuration is write-restricted to the AVP of Deposit Operations and IT; Compliance has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| ACH batch submitted for origination (`ach_transfer.created`) | Originator identity (`eps.wire.originator_id`), batch amount (`ach_transfer.amount`), client exposure limit (`eps.client.ach_exposure_limit`), dual-control status, template restriction flag (`eps.client.ach_template_only`) | ACH transfer created (`ach_transfer.created`); dual-control result logged (`ach_transfer.control_results`); limit check result recorded | Before batch submission to network |
| Wire transfer initiated via Business Online Banking (`wire_transfer.submitted`) | Originator identity (`eps.wire.originator_id`), wire amount (`wire_transfer.amount`), beneficiary (`wire_transfer.beneficiary`), second approval (`eps.wire.second_approval`), callback/PIN confirmation or dual-control evidence, client daily limit (`eps.client.wire_daily_limit`) | Wire transfer submitted (`wire_transfer.submitted`); dual-control or callback approval logged (`eps.wire.second_approval`) | Before release to Fedwire/TSP |
| Outgoing wire release requested via Payments Exchange or TSP (`eps.wire_release.requested`) | Release PIN (`eps.wire.release_pin`), second employee identity, registered IP verification (`eps.wire_ip`), time-of-day check | Wire release requested (`eps.wire_release.requested`); IP verification logged (`eps.wire_ip.verified`); two-employee origination confirmed | Before wire is released to Fedwire |
| Client ACH or wire exposure limit change requested (`eps.client_limit_change.requested`) | Justification (`eps.limit_change.justification`), approver identity (`eps.limit_change.approver_id`), new limit value | Limit change request logged (`eps.client_limit_change.requested`); limit updated upon approval (`eps.client_limit.changed`) | Before new limit takes effect |
| Positive Pay exception presented for client decision (`eps.pospay_exception.presented`) | Issue file (`eps.pospay.issue_file`), presented item details (`eps.pospay.presented_item`), client decision deadline (`eps.pospay.decision_due_at`) | Exception presented (`eps.pospay_exception.presented`); client decision logged (`eps.pospay_exception.decided`) | Per client SLA; enforced by `eps.pospay.decision_due_at` |

**ALERTS/METRICS:** Alert in real-time on any wire release event (`eps.wire_release.requested`) that lacks a confirmed second-employee approval or valid PIN — target zero releases without dual control. Alert if any ACH batch for a client with origination > $50,000 is submitted without dual-control evidence. Monitor daily wire volume against client limits; alert on limit breaches.

---

## EPS-07 — Electronic Fraud Protection Systems {#eps-07-electronic-fraud-protection-systems}

**WHY (Reg cite):** FFIEC IT Examination Handbook (E-Banking and Retail Payment Systems Booklets) requires financial institutions to monitor fraud trends and offer clients tools to protect their accounts. [Regulation E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005) creates error-resolution and liability obligations that fraud detection tools help mitigate. [NACHA Operating Rules](https://www.nacha.org/rules) require ACH originators to monitor for unauthorized entries.

**SYSTEM BEHAVIOR:** The Credit Union offers and monitors three fraud protection tools: (1) Check Positive Pay — clients upload check issue files and make exception decisions within Business Online Banking or Business Mobiliti; (2) Premium Positive Pay — clients upload check issue files, monitor ACH activity, and make exception decisions within Business Online Banking; (3) Card Control (ACBT) — clients register debit cards via the mobile app and may turn cards on/off, set limits, or restrict transaction types; client Card Control settings do not override institution-defined card limits and do not bypass the EnFact card monitoring process. The Credit Union continuously monitors fraud trends using industry alerts (`eps.fraud.industry_alerts`) and internal loss data (`eps.fraud.loss_data`), and conducts periodic fraud trend reviews. Fraud trend review reports are write-restricted to the AVP of Deposit Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Positive Pay exception item presented to client (`eps.pospay_exception.presented`) | Presented item details (`eps.pospay.presented_item`), issue file match result (`eps.pospay.issue_file`), client decision deadline (`eps.pospay.decision_due_at`) | Exception presented (`eps.pospay_exception.presented`) | Real-time upon item presentment |
| Client makes Positive Pay exception decision (`eps.pospay_exception.decided`) | Client decision (pay/return), item identifier, client identity | Exception decision logged (`eps.pospay_exception.decided`) | Per client SLA; enforced by `eps.pospay.decision_due_at` |
| Card control setting applied or changed by client (`eps.card_control.applied`, `eps.card_control.changed`) | Card identifier (`card.id`), new control settings (`card.spend_controls`), institution limit floor (`eps.card.institution_limits`), fraud score (`eps.card.fraud_score`) | Card control event logged (`eps.card_control.applied` or `eps.card_control.changed`); EnFact monitoring confirmed active | Real-time |
| Fraud trend review completed (`eps.fraud_trend_review.completed`) | Industry alert data (`eps.fraud.industry_alerts`), internal loss data (`eps.fraud.loss_data`), prior review findings | Fraud trend review completed (`eps.fraud_trend_review.completed`); findings documented | Periodic; at least quarterly (internal SLA) |

**ALERTS/METRICS:** Alert if any Positive Pay exception decision deadline (`eps.pospay.decision_due_at`) is missed — target zero expired undecided exceptions. Alert if no `eps.fraud_trend_review.completed` event exists within the prior 95 days. Monitor card fraud score distributions; alert on anomalous spikes in `eps.card.fraud_score`.

---

## EPS-08 — Vendor Due Diligence {#eps-08-vendor-due-diligence}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to oversee third-party service providers that handle member information or support critical operations. The FFIEC IT Examination Handbook (Outsourcing Technology Services Booklet) requires annual review of service provider controls, including SOC reports. The Board and senior management remain responsible for vendor performance under NCUA guidance. Detailed vendor onboarding and ongoing third-party oversight program requirements are governed by the Third-Party Risk Policy and the Information Technology Cyber Security Policy.

**SYSTEM BEHAVIOR:** The Credit Union performs annual due diligence on vendors that design, implement, and service electronic payment technologies — principally Fiserv (hosting at Johns Creek) and Jack Henry. Annual due diligence includes review of the hosting provider's SOC 1 Type II and SOC 2 Type II reports and verification of encryption requirements for data communications. Vendor due diligence findings are documented in the vendor DD summary (`eps.vendor.dd_summary`) and any issues identified are escalated (`eps.vendor_issue.escalated`). The Board and senior management are informed of vendor performance through periodic reporting (see [EPS-04](#eps-04-management-supervision-and-oversight)). Vendors are included in pre-deployment testing (see [EPS-10](#eps-10-pre-deployment-testing)). Vendor DD records are write-restricted to the AVP of Deposit Operations and Compliance; the Board has read access to summary reports. Full vendor program governance (onboarding, contract management, exit planning) resides in the Third-Party Risk Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual vendor DD cycle opens for EPS vendors (`eps.vendor_dd_cycle.opened`) | Vendor identifier (`eps.vendor.id`), prior DD summary, SOC report due date (`eps.vendor.soc1_due_at`), encryption requirements (`eps.vendor.encryption_reqs`) | DD cycle opened (`eps.vendor_dd_cycle.opened`); DD task created (`eps.vendor.dd_due_at`) | Annually |
| SOC 1 Type II / SOC 2 Type II report received from vendor (`eps.vendor_soc1.received`) | SOC report document (`eps.vendor.soc1_report`), report period, vendor identifier (`eps.vendor.id`) | SOC report received (`eps.vendor_soc1.received`) | Upon receipt from vendor; at least annually |
| SOC report reviewed and DD completed (`eps.vendor_soc1.reviewed`, `eps.vendor_dd.completed`) | SOC report findings, encryption requirements verification (`eps.vendor.encryption_reqs`), DD summary (`eps.vendor.dd_summary`), user entity control considerations (`eps.vendor.cuec_list`) | SOC review completed (`eps.vendor_soc1.reviewed`); vendor DD completed (`eps.vendor_dd.completed`) | Within 30 CD of report receipt; enforced by `eps.vendor.dd_due_at` |
| Vendor issue identified during DD or monitoring (`eps.vendor_issue.escalated`) | Issue description (`eps.vendor.issue_description`), severity (`eps.vendor.issue_severity`), vendor identifier (`eps.vendor.id`) | Vendor issue escalated (`eps.vendor_issue.escalated`); performance metrics updated (`eps.vendor.performance_metrics`) | Within 5 BD of issue identification |

**ALERTS/METRICS:** Alert if no `eps.vendor_dd.completed` event exists for any critical EPS vendor within the prior 13 months — target zero overdue annual reviews. Alert if a SOC report gap period exceeds 6 months without explanation. Alert on any `eps.vendor_issue.escalated` event with high severity — route to AVP of Deposit Operations within 1 BD.

---

## EPS-09 — Expertise and Training {#eps-09-expertise-and-training}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to train personnel on information security responsibilities. The FFIEC IT Examination Handbook (E-Banking Booklet) requires that key employees have the expertise to perform critical functions and that adequate backup exists for critical roles. [Regulation E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005) and [Regulation CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229) create obligations that depend on staff competency in EFT and remote deposit capture operations.

**SYSTEM BEHAVIOR:** The Credit Union maintains two training tracks. **Employee training:** Management allocates resources for technical coursework, industry conference attendance, and participation in industry working groups; critical-role backup coverage is documented (`eps.staffing.backup_map`, `eps.staffing.critical_roles`); annual training cycles are tracked to completion. **Client training:** Training guides and resource materials are provided at onboarding (`eps.training.guide_version`); annual education and self-certification are completed where applicable (`eps.training.self_cert_form`, `eps.training.self_cert_due_at`); periodic phishing and online fraud communications are sent to clients (`eps.training_fraud_comm`). Self-certification applicability is determined by the AVP of Deposit Operations based on service type and client risk tier (`eps.client.education_applicable`). Training records are write-restricted to the AVP of Deposit Operations and HR; Compliance has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired into EPS-relevant role (`employee.hired`) | Employee role (`user.role`), hire date (`training_detail.hire_date`), required curriculum | Training assignment created (`training.assignment.created`); onboarding training task set (`training.newhire_due_at`) | Within 30 CD of hire date (internal SLA; enforced by `training.newhire_due_at`) |
| Annual employee training cycle opens (`eps.training_employee_cycle.opened`) | Employee roster, role-based curriculum (`eps.training.employee_plan`), prior completion records | Annual training cycle opened (`eps.training_annual_cycle.opened`); assignments created (`training.annual.assigned`) | Annually |
| Employee training completed (`eps.training_employee.completed`) | Completion evidence, assessment score (`training.assessment_score`), employee identifier | Training completion recorded (`eps.training_employee.completed`); completion logged (`training.completion.recorded`) | Per annual cycle deadline (`training.annual_due_at`) |
| Client onboarded to electronic banking service (`eps.client.enrolled`) | Client identifier (`eps.client.contacts`), service type, self-admin agreement status (`eps.client.self_admin_agreement`), education applicability flag (`eps.client.education_applicable`) | Client training guide delivered (`eps.training_client.delivered`); onboarding training logged | At onboarding |
| Annual client self-certification cycle opens (`eps.training_annual_cycle.opened`) | Client list with applicable self-cert flag (`eps.client.education_applicable`), self-cert form version (`eps.training.self_cert_form`) | Self-cert tasks created; self-cert due date set (`eps.training.self_cert_due_at`) | Annually |
| Client self-certification completed (`eps.training_self_cert.completed`) | Completed self-cert form (`eps.training.self_cert_form`), client identifier | Self-certification completion logged (`eps.training_self_cert.completed`) | Per annual cycle deadline (`eps.training.self_cert_due_at`) |
| Phishing/fraud communication sent to clients (`eps.training_fraud_comm.sent`) | Communication content, distribution list, fraud topic | Fraud communication logged (`eps.training_fraud_comm.logged`); send event recorded (`eps.training_fraud_comm.sent`) | Periodically (at least semi-annually; internal SLA) |

**ALERTS/METRICS:** Alert if any employee in an EPS-critical role has no `eps.training_employee.completed` event within the prior 13 months — target zero lapsed employees. Alert if any client with `eps.client.education_applicable` = true has no `eps.training_self_cert.completed` event within the prior 13 months. Alert if no `eps.training_fraud_comm.sent` event exists within the prior 180 days.

---

## EPS-10 — Pre-Deployment Testing {#eps-10-pre-deployment-testing}

**WHY (Reg cite):** FFIEC IT Examination Handbook (E-Banking Booklet and Development and Acquisition Booklet) requires that new systems and material changes be tested to validate proper function and interoperability before deployment. [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls over system changes that could affect the security or integrity of member information and payment operations. [Regulation CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229) and [NACHA Operating Rules](https://www.nacha.org/rules) require that remote deposit capture and ACH systems function correctly and interoperate with existing infrastructure.

**SYSTEM BEHAVIOR:** Before any new electronic payment system or material change to an existing system is deployed, management validates that equipment and systems function properly, produce the desired results, and interoperate with existing technology. Vendors are included in the testing process. Testing produces a test plan, test results, a list of defects, and a signed-off approval before go-live. Emergency deployments require documented exception approval (`eps.change.exception_approval`) and a rollback plan (`eps.change.rollback_plan`). Deployment without a completed test sign-off is blocked unless an emergency exception is on record. Test records are write-restricted to the AVP of Deposit Operations and IT; Compliance has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New system or material change deployment scheduled (`eps.deployment.scheduled`) | Service identifier (`eps.service.id`), test plan (`eps.test.plan`), interoperability scope (`eps.test.interop_scope`), vendor participation confirmation (`eps.vendor.test_participation`) | Deployment scheduled (`eps.deployment.scheduled`); test plan on record (`eps.test.plan`) | Before testing begins |
| Testing completed and results recorded (`eps.test_results.recorded`) | Test results (`eps.test.results`), defects identified (`eps.test.defects`), risk acceptance for any open defects (`eps.test.risk_acceptance`), vendor test participation evidence (`eps.vendor.test_participation`) | Test results recorded (`eps.test_results.recorded`) | Before deployment go-live |
| Test retrospective completed (`eps.test_retro.completed`) | Test results, defect disposition, lessons learned | Test retrospective completed (`eps.test_retro.completed`); retrospective due date enforced (`eps.test.retro_due_at`) | Within 10 BD of go-live; enforced by `eps.test.retro_due_at` |
| Emergency deployment exception approved (`eps.deployment.emergency_exception`) | Emergency justification, rollback plan (`eps.change.rollback_plan`), approver identity, exception approval (`eps.change.exception_approval`) | Emergency exception logged (`eps.deployment.emergency_exception`); rollback plan on record | Before emergency deployment proceeds |

**ALERTS/METRICS:** Alert if any `eps.service.activated` event occurs without a preceding `eps.test_results.recorded` event with sign-off (`eps.test.signed_off`) — target zero unvalidated deployments. Alert if any emergency exception (`eps.deployment.emergency_exception`) is not followed by a test retrospective within 10 BD. Monitor defect counts at go-live; alert if open critical defects exist at deployment.

---

## Governance & Sign-Off {#governance}

| Role | Name | Responsibility |
|---|---|---|
| Policy Owner | Patrick Wilson, Chief Compliance Officer | Maintains policy; ensures controls remain current; escalates gaps |
| Operational Accountable | AVP of Deposit Operations | Assesses risks; implements procedures; maintains risk assessment and oversight artifacts |
| IT Committee | Quarterly participants | Reviews electronic banking risks; receives dashboards and Electronic Banking Summary |
| Enterprise Risk Management Committee | Required participants | Reviews and approves Product Risk Analysis for new services |
| Audit Personnel | Internal Audit | Independently verifies internal control structure; confirms departmental adherence |

**Review cadence:** This policy is reviewed annually and whenever a material change to in-scope payment channels, applicable regulations, or the Credit Union's risk profile occurs.

**Cross-references:**
- E-Commerce Policy — consumer-facing online/mobile banking enrollment and member experience
- Information Security Policy (Information Technology Cyber Security Policy) — cybersecurity, encryption, intrusion, and IT general controls; vendor due diligence detail
- Third-Party Risk Policy — vendor onboarding and ongoing third-party oversight program
- Enterprise Risk Management Policy — risk appetite, taxonomy, and scoring methodology
- Business Continuity Plan Policy — BCP/DR program detail, recovery objectives
- Electronic Banking Authentication and Risk Assessment — Exhibit A detail; client enrollment authentication
- Electronic Banking Risk Assessment — complete risk and control detail by payment channel
- Exhibit A (Authentication Controls) — current authentication controls by application
- Exhibit B (Dual Control Processes) — internal processes requiring enhanced access or dual control

**Sign-off:**

| Approver | Title | Date |
|---|---|---|
| Patrick Wilson | Chief Compliance Officer | __________ |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `eps.*` fields and events referenced throughout this document (e.g., `eps.proposal.submitted`, `eps.auth.decided`, `eps.wire.second_approval`, `eps.vendor.dd_summary`, `eps.training.self_cert_due_at`, `eps.bcp_test.due_at`, `eps.control_review.due_at`, `eps.it_audit.due_at`, `eps.board_report.due_at`, `eps.vendor.soc1_due_at`, `eps.vendor.dd_due_at`, `eps.pospay.decision_due_at`, `eps.deficiency.remediation_due_at`, `eps.test.retro_due_at`, `eps.training.self_cert_due_at`) are registered in the `eps` object of `core-vocabulary.json` and are used verbatim per the DESIGN_NOTES. Timer codes (`eps.bcp_test.due_at`, `eps.control_review.due_at`, `eps.it_audit.due_at`, `eps.vendor.dd_due_at`, `eps.vendor.soc1_due_at`, `eps.pospay.decision_due_at`, `eps.deficiency.remediation_due_at`, `eps.test.retro_due_at`, `eps.training.self_cert_due_at`, `eps.board_report.due_at`) are used as `Task.due_at` instances per the registered task-type grammar. Engineering must confirm all `eps.*` sub-field codes are registered before implementation.

- **SOC 2 Type II not in DESIGN_NOTES.** Patrick's notes specify annual review of both SOC 1 Type II and SOC 2 Type II reports. The registered vocabulary includes `eps.vendor.soc1_report` and `eps.vendor_soc1.received`/`eps.vendor_soc1.reviewed` events. A corresponding `eps.vendor.soc2_report` field and `eps.vendor_soc2.received`/`eps.vendor_soc2.reviewed` events are not listed in DESIGN_NOTES. This document uses the SOC 1 codes as the primary pattern; engineering should confirm whether SOC 2 review is tracked as a separate event or as an attribute of the same DD record.

- **SWIFT Alliance Lite2 as information-transfer layer.** The Reference Policy and Patrick's notes clarify that SWIFT Alliance Lite2 is used to send messages to SWIFT participants but that actual fund movement occurs through Payments Exchange (Fedwire). This policy treats SWIFT as a messaging layer within the wire transfer workflow; no separate SWIFT-specific dual-control event is defined beyond the Fedwire release controls in EPS-06. Engineering should confirm whether SWIFT message events require a distinct event code.

- **ACH dual-control threshold ($50,000) is a recommendation, not a hard block.** Patrick's notes state dual control is "recommended" for clients originating over $50,000, not required. This policy reflects that language. If the Credit Union wishes to make this a hard system block, the policy and system behavior must be updated and the assumption revisited.

- **Client self-certification applicability determination.** The policy assumes the AVP of Deposit Operations determines which clients are subject to annual self-certification (`eps.client.education_applicable`). The criteria for this determination are not specified in Patrick's notes or the Reference Policy. Engineering should confirm how this flag is set and whether it is driven by service type, client risk tier, or another attribute.

- **Fraud trend review cadence.** Patrick's notes state the Credit Union "continually monitors fraud trends" but do not specify a formal review cadence. This policy assumes at least quarterly formal fraud trend reviews (`eps.fraud_trend_review.completed`) as a minimum internal SLA. This assumption should be confirmed by the AVP of Deposit Operations.

- **Phishing communication cadence.** The Reference Policy states communications are sent "periodically." This policy assumes at least semi-annually (every 180 days) as the internal SLA for `eps.training_fraud_comm.sent`. This should be confirmed and documented in the Electronic Banking Risk Assessment.

- **NCUA 72-hour incident notification.** The 72-hour notification deadline for reportable cybersecurity incidents is drawn from [NCUA 12 CFR Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748) (effective September 2023). The registered timer `eps.incident.ncua_due_at` is used to enforce this deadline. Engineering should confirm this timer is set at incident discovery time, not detection time, consistent with the NCUA rule.

- **Regulation CC applicability to remote/mobile deposit capture.** [Regulation CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229) governs funds availability for remotely deposited checks. This policy references Reg CC as an authority for EPS-10 (testing) but does not establish Reg CC funds-availability controls, which are assumed to be governed by the E-Commerce Policy or a separate Funds Availability Policy. This scope boundary should be confirmed.

- **HMDA reporter status.** Pynthia Credit Union's HMDA reporter status is not confirmed in the inputs. If the Credit Union is a HMDA reporter, certain electronic mortgage application channels may have additional data-collection and reporting obligations not addressed in this policy.

- **Lockbox (TMR) dual-control requirements.** Patrick's notes list lockbox as an in-scope payment channel but do not specify dual-control or authentication requirements for lockbox processing. This policy does not define specific controls for lockbox beyond the general internal controls framework in EPS-03. Specific lockbox controls should be documented in the Electronic Banking Risk Assessment and Exhibit B.
```
