```yaml
---
title: Electronic Payment Systems Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Electronic Payment Systems, ACH, Wire Transfer, Fraud, Authentication, Vendor Due Diligence, Training, NCUA, Reg E, Reg CC, NACHA]
---

# Electronic Payment Systems Policy

## General Policy Statement

Pynthia Credit Union recognizes that electronic payment systems — including ACH origination, wire transfer, debit/ATM cards, bill payment, mobile and remote deposit capture, Zelle, and lockbox — carry the highest operational risk of any electronic banking category, arising primarily from fraud, error, and service-delivery failure in a heavily outsourced environment. The Credit Union adopts this policy to establish risk-commensurate controls across all in-scope payment channels, assign clear accountability to the AVP of Deposit Operations and the Chief Compliance Officer, ensure active Board and IT Committee oversight, and mandate ongoing testing, training, and vendor scrutiny. Controls are calibrated to the risk of each channel and documented in detail in the Electronic Banking Risk Assessment and Electronic Banking Authentication and Risk Assessment. Cybersecurity, vendor-program governance, business continuity program detail, enterprise risk methodology, and consumer e-commerce enrollment are governed by their respective policies and are out of scope here except where this policy explicitly cross-references them.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New payment service proposed | Sponsor submits proposal (`eps.proposal.submitted`) | Before go-live | Product Risk Analysis form; three-stage feasibility analysis | [EPS-01](#eps-01-planning-and-feasibility-analysis) |
| BCP test of key payment service due | Scheduler fires (`eps.bcp_test.scheduled`) | Annually (per BCP Policy) | BCP test scenario and results | [EPS-02](#eps-02-payment-incident-detection-bcp-testing) |
| Payment-channel incident detected | Detection event (`eps.incident.detected`) | Immediate triage; NCUA notice per SC-01 | Incident record; severity classification | [EPS-02](#eps-02-payment-incident-detection-bcp-testing) / [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Internal control review due | Annual cycle opens (`eps.control_review.opened`) | Annually | Control review checklist; deficiency log | [EPS-03](#eps-03-internal-routines-and-controls) |
| IT Committee meeting | Quarterly calendar (`eps.it_committee.convened`) | Quarterly | IT Committee minutes; dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |
| IT Audit | Annual cycle (`eps.it_audit.opened`) | Annually | IT Audit report; prior findings | [EPS-04](#eps-04-management-supervision-and-oversight) |
| Board EPS report | Periodic schedule (`eps.board_report.delivered`) | Periodically (at least annually) | Electronic Banking Summary; dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |
| Client authentication configuration change | Client enrollment or access-right change (`eps.client.enrolled`, `access_right.changed`) | Before access granted | Exhibit A authentication matrix | [EPS-05](#eps-05-authentication-controls) |
| High-risk process initiated (wire, ACH >$50k) | Transaction initiated (`wire_transfer.submitted`, `ach_transfer.created`) | Before release/settlement | Exhibit B dual-control matrix; limit schedule | [EPS-06](#eps-06-dual-control-for-high-risk-processes) |
| Positive Pay exception presented | Exception item presented (`eps.pospay_exception.presented`) | Same business day (internal SLA) | Exception decision log | [EPS-07](#eps-07-electronic-fraud-protection-systems) |
| Vendor SOC report review due | Annual cycle (`eps.vendor_dd_cycle.opened`) | Annually | SOC 1 Type II; SOC 2 Type II; encryption requirements | [EPS-08](#eps-08-vendor-due-diligence) |
| Employee EPS training due | Annual cycle opens (`eps.training_annual_cycle.opened`) | Annually | Training plan; completion records | [EPS-09](#eps-09-expertise-and-training) |
| Client onboarding training | Client enrolled (`eps.client.enrolled`) | At onboarding | Resource guides; self-certification (where applicable) | [EPS-09](#eps-09-expertise-and-training) |
| Annual client self-certification due | Annual cycle (`eps.training_annual_cycle.opened`) | Annually | Self-certification form (`eps.training.self_cert_form`) | [EPS-09](#eps-09-expertise-and-training) |
| Phishing/fraud communication | Periodic schedule | Periodically | Fraud communication log (`eps.training_fraud_comm`) | [EPS-09](#eps-09-expertise-and-training) |
| Pre-deployment system test | Deployment scheduled (`eps.deployment.scheduled`) | Before go-live | Test plan; results; vendor participation record | [EPS-10](#eps-10-pre-deployment-testing) |

---

## EPS-01 — Planning and Feasibility Analysis {#eps-01-planning-and-feasibility-analysis}

**WHY (Reg cite):** NCUA safety-and-soundness expectations under [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) require credit unions to assess risk before deploying new technology services. The [FFIEC IT Examination Handbook (E-Banking Booklet)](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) further requires that new electronic banking services undergo structured risk analysis before launch, including feasibility, design, and operational readiness stages.

**SYSTEM BEHAVIOR:** Every proposal for a new electronic payment service must pass through three sequential stages before go-live: (1) **Study** — needs, objectives, and alternatives are documented; (2) **Design and Development** — the selected solution is installed, policies and procedures are drafted, and documentation is completed; (3) **Operation** — the system is confirmed to operate and be maintainable as designed. At the conclusion of the Study stage, the sponsor prepares a Product Risk Analysis form (`eps.product_risk_analysis.id`) and presents it to the Enterprise Risk Management Committee (ERMC) for review and approval before the Design stage begins. No new payment service may be activated without ERMC sign-off. The AVP of Deposit Operations owns the feasibility process; the CCO reviews for compliance risk. The `eps.proposal.*` and `eps.erm_review.*` fields are write-restricted to the sponsoring business unit and Compliance, respectively.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Sponsor submits a new payment-service proposal (`eps.proposal.submitted`) | Proposal description (`eps.proposal.description`), sponsor identity (`eps.proposal.sponsor`), preliminary study document (`eps.proposal.study_doc`) | Study document filed; proposal record created (`eps.proposal.submitted`) | Before Design stage begins — no hard regulatory deadline; internal gate enforced before ERMC review |
| ERMC convenes to review Product Risk Analysis (`eps.erm_review.convened`) | Product Risk Analysis form (`eps.product_risk_analysis.id`), study doc (`eps.proposal.study_doc`), design docs (`eps.proposal.design_docs`), risk assessment (`eps.risk_assessment.id`) | ERMC decision recorded (`eps.erm_review.decided`); Product Risk Analysis form filed | Before go-live; enforced by `risk.product_assessment_due_at` |
| New payment service activated (`eps.service.activated`) | ERMC approval on file (`eps.erm_review.decided`), design docs complete (`eps.proposal.design_docs`), operational procedures documented | Service activation logged (`eps.service.activated`); service ID registered (`eps.service.id`) | After ERMC approval and pre-deployment test (see [EPS-10](#eps-10-pre-deployment-testing)) |

**ALERTS/METRICS:** Alert if any `eps.service.activated` event lacks a preceding `eps.erm_review.decided` event for the same service ID. Target: zero activations without ERMC approval. Dashboard: count of proposals in each stage (Study / Design / Operation) tracked on the IT dashboard (`eps.dashboard.it`).

---

## EPS-02 — Payment-Incident Detection & BCP Testing {#eps-02-payment-incident-detection-bcp-testing}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to maintain incident response and business continuity plans covering information systems. The [FFIEC IT Examination Handbook (Business Continuity Management Booklet)](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_BCP.pdf) requires regular testing of critical systems. This control governs detection and initial classification of payment-channel incidents and scheduling/completion of BCP tests for key payment services; NCUA reportability determination and member notification flow to [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** Any operational failure, fraud event, or service-delivery disruption affecting an in-scope payment channel must be detected and opened as an incident record immediately. The AVP of Deposit Operations is the primary incident owner for payment-channel events; the CCO is notified for any incident with potential regulatory implications. Upon opening, the incident is classified by severity (`eps.incident.severity`) and linked to the affected vendor if applicable (`eps.incident.vendor_linked`). The incident record feeds the SC-01 reportability determination — see [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) for NCUA notification and member-notice obligations. Separately, the BCP must include and regularly test key electronic payment services (ACH, wire, bill payment, mobile deposit, remote deposit capture); test scheduling and results are tracked here. BCP program detail (plan maintenance, RTO/RPO targets, DR exercises) is governed by the Business Continuity Plan Policy. The `eps.incident.*` fields are write-restricted to Deposit Operations and Compliance; `eps.bcp_test.*` fields are write-restricted to the BCP coordinator.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Payment-channel incident detected (`eps.incident.detected`) | Incident description (`incident.description`), affected service (`eps.service.id`), detection source (`incident.detection_source`), initial severity estimate (`eps.incident.severity`) | Incident record opened (`eps.incident.opened`); incident ID assigned (`eps.incident.id`) | Immediate — no regulatory deadline at detection; triage SLA per `incident.triage.due_at` |
| Incident severity classified and vendor linkage assessed (`eps.incident.opened`) | Severity classification (`eps.incident.severity`), vendor link flag (`eps.incident.vendor_linked`), impact summary (`eps.incident.impact`) | Severity assigned; incident record updated; feeds SC-01 reportability queue (`incident_reportable.determined`) | Within triage window enforced by `incident.triage.due_at` |
| BCP test of key payment service scheduled (`eps.bcp_test.scheduled`) | Test scenario (`eps.bcp_test.scenario`), scope of services to be tested, vendor participation flag (`eps.vendor.test_participation`) | BCP test scheduled; task created (`eps.bcp.test.due_at`) | Annually; enforced by `eps.bcp.test.due_at` |
| BCP test completed (`eps.bcp_test.completed`) | Test results (`eps.test_results`), defects identified (`eps.test.defects`), vendor participation confirmed (`eps.vendor.test_participation`) | BCP test results recorded (`eps.bcp_test.completed`); deficiencies opened if applicable (`eps.control_review.deficiency_found`) | Within test window; results recorded same day as test |

**ALERTS/METRICS:** Alert if any payment-channel incident remains in triage status beyond the `incident.triage.due_at` threshold. Alert if annual BCP test for any key payment service is not completed before `eps.bcp.test.due_at` lapses. Target: zero overdue incident triages; 100% of key payment services tested annually.

---

## EPS-03 — Internal Routines and Controls {#eps-03-internal-routines-and-controls}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to implement internal controls commensurate with the risk of their information systems. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) requires comprehensive system reviews and tests validating controls over hardware, software, proprietary data, and electronic transmissions, and mandates that users be trained to adhere to control standards.

**SYSTEM BEHAVIOR:** Management maintains a program of comprehensive system reviews and tests that validate the controls protecting payment-channel hardware, software, proprietary data, and electronic transmissions. Reviews are conducted at least annually and produce a control review checklist (`eps.control_review.checklist`) and a list of open deficiencies (`eps.deficiency.open_list`). Each deficiency is rated (`eps.deficiency.rating`), described (`eps.deficiency.description`), and assigned a remediation deadline (`eps.deficiency.remediation.due_at`). Prior findings from the IT Audit are incorporated into each review cycle (`eps.control_review.prior_findings`). The AVP of Deposit Operations owns the control review program; audit personnel independently verify the internal control structure. The `eps.control_review.*` fields are write-restricted to Deposit Operations; deficiency remediation status is visible to Compliance and Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual control review cycle opens (`eps.control_review.opened`) | Prior findings (`eps.control_review.prior_findings`), current control inventory, scope of payment channels | Control review opened; checklist initialized (`eps.control_review.checklist`) | Annually; enforced by `eps.control.review.due_at` |
| Control review completed (`eps.control_review.completed`) | Completed checklist (`eps.control_review.checklist`), deficiency findings (`eps.control_review.deficiency_found`), prior findings comparison (`eps.control_review.prior_findings`) | Control review results recorded (`eps.control_review.completed`); open deficiency list updated (`eps.deficiency.open_list`) | Within annual review window; enforced by `eps.control.review.due_at` |
| Deficiency identified during review (`eps.control_review.deficiency_found`) | Deficiency description (`eps.deficiency.description`), severity rating (`eps.deficiency.rating`), responsible owner | Deficiency remediation task opened (`eps.deficiency_remediation.opened`); remediation deadline set (`eps.deficiency.remediation.due_at`) | Remediation deadline set at time of identification; enforced by `eps.deficiency.remediation.due_at` |
| Deficiency remediation completed | Remediation evidence, closure confirmation | Deficiency closed; control review record updated (`eps.control_review.completed`) | By `eps.deficiency.remediation.due_at` |

**ALERTS/METRICS:** Alert if annual control review is not completed before `eps.control.review.due_at` lapses. Alert on any open deficiency aging past its `eps.deficiency.remediation.due_at`. Target: zero overdue deficiency remediations; control review completion rate 100% annually. Metrics surfaced on the IT dashboard (`eps.dashboard.it`) and Deposit Operations dashboard (`eps.dashboard.deposit_ops`).

---

## EPS-04 — Management Supervision and Oversight {#eps-04-management-supervision-and-oversight}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires board-level oversight of information security and electronic banking risk. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) requires active management and board involvement in electronic banking risk decisions, supported by regular reporting and committee governance.

**SYSTEM BEHAVIOR:** Management and the Board are kept actively involved in electronic payment systems risk through a structured set of oversight artifacts and governance bodies: (1) the **Electronic Banking Risk Assessment** — maintained by the AVP of Deposit Operations and updated as risks change; (2) the **IT Committee** — meets quarterly, reviews payment-channel risk, and files minutes (`eps.it_committee_minutes`); (3) the **IT Risk Assessment** — annual; (4) the **IT Strategic Plan** — prepared annually; (5) the **IT Audit** — annual review and testing of controls (`eps.it_audit`); (6) the **IT Dashboard** (`eps.dashboard.it`) and **Deposit Operations Dashboard** (`eps.dashboard.deposit_ops`) — ongoing operational monitoring; (7) the **Electronic Banking Summary** (`eps.summary.ebanking`) — periodic summary for Board reporting. The Board receives periodic reports (`eps.board_report`) detailing actions taken to assess and manage electronic banking risks. The AVP of Deposit Operations is ultimately responsible for assessing risks and implementing procedures; audit personnel independently verify the internal control structure. Board report fields are write-restricted to the CCO and AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| IT Committee quarterly meeting convened (`eps.it_committee.convened`) | Risk assessment delta (`eps.risk_assessment.delta`), dashboard data (`eps.dashboard.it`, `eps.dashboard.deposit_ops`), open deficiencies (`eps.deficiency.open_list`) | IT Committee minutes filed (`eps.it_committee_minutes.filed`) | Quarterly; enforced by `eps.it_committee.convened` schedule |
| Annual IT Audit cycle opens (`eps.it_audit.opened`) | Prior audit findings (`eps.it_audit.prior_findings`), control review results (`eps.control_review.checklist`), scope of payment channels | IT Audit opened; audit scope documented | Annually; enforced by `eps.it.audit.due_at` |
| IT Audit report issued (`eps.it_audit_report.issued`) | Audit findings, management responses, corrective action plans | IT Audit report issued (`eps.it_audit_report.issued`); findings routed to Board | Annually; within audit cycle |
| Board EPS report delivered (`eps.board_report.delivered`) | Electronic Banking Summary (`eps.summary.ebanking`), IT dashboard (`eps.dashboard.it`), Deposit Ops dashboard (`eps.dashboard.deposit_ops`), risk assessment status | Board report delivered (`eps.board_report.delivered`) | Periodically (at least annually); enforced by `eps.board.report.due_at` |

**ALERTS/METRICS:** Alert if IT Committee minutes are not filed within 5 business days of the scheduled quarterly meeting. Alert if annual IT Audit report is not issued before `eps.it.audit.due_at` lapses. Alert if Board EPS report is not delivered before `eps.board.report.due_at` lapses. Target: 100% on-time committee and board reporting; zero lapsed audit cycles.

---

## EPS-05 — Authentication Controls {#eps-05-authentication-controls}

**WHY (Reg cite):** [FFIEC Authentication Guidance (2011 and 2021 Supplement)](https://www.ffiec.gov/press/pdf/2021_FFIEC_CIA_Supplement.pdf) requires layered authentication controls on electronic banking services commensurate with the risk of the channel and transaction type. [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect member information and system access. [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) creates liability exposure for unauthorized EFTs that authentication controls are designed to prevent.

**SYSTEM BEHAVIOR:** All client-facing electronic payment services require user authentication; the degree of authentication is calibrated to the perceived risk of the channel and function, as documented in Exhibit A (Authentication Controls on Electronic Banking Services Access for Clients) and the Electronic Banking Authentication and Risk Assessment. Current authentication requirements by channel: **Business Online Banking (general)** — User ID, Password/Token; IP and day/time restrictions recommended; user administration controlled by the Credit Union unless a Self-Administration agreement is on file. **Business Online Banking — ACH Origination** — User ID, Password/Token; dual control recommended for clients originating >$50,000; client exposure limits assigned; user limits may be set below client limit; file creation may be restricted to pre-defined templates. **Business Online Banking — Wire Transfer** — User ID, Password/Token; dual control or offline callback approval with PIN required; daily/periodic limits assigned; file creation limited to pre-defined templates. **Retail Online Banking (including Mobiliti, mobile deposit, Positive Pay, CheckFree/Zelle)** — User ID, Password, challenge questions, mobile device registration; CheckFree/Zelle not activated until new enrollment is verified. **Remote Deposit Capture (Jack Henry/Profit Stars)** — User ID and Password; user administration controlled by the Credit Union unless Self-Administration agreement is on file. Authentication configurations are write-restricted to Deposit Operations; changes require documented approval. Client enrollment authentication controls are governed by the E-Commerce Policy and the Electronic Banking Authentication and Risk Assessment.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Client enrolled in a payment service (`eps.client.enrolled`) | Client identity (`eps.client`), service type (`eps.service.id`), applicable authentication tier from Exhibit A (`eps.auth.risk_tier`), self-administration agreement status (`eps.client.self_admin_agreement`) | Client enrollment recorded (`eps.client.enrolled`); authentication credentials provisioned (`eps.auth.credentials`); device registered if applicable (`eps.auth.device_registered`) | Before first transaction; no regulatory deadline beyond "before access granted" |
| Authentication attempted on payment service (`eps.auth.decided`) | User credentials (`eps.auth.credentials`), IP address (for restricted channels) (`eps.wire_ip`), day/time (for restricted channels), device registration status (`eps.auth.device_registered`), risk tier (`eps.auth.risk_tier`) | Authentication decision logged (`eps.auth.decided`); failure count incremented if failed (`eps.auth.failure_count`) | Real-time at each access attempt |
| Authentication failure threshold reached (`eps.auth_failure_threshold.reached`) | Failure count (`eps.auth.failure_count`), user identity, channel | Account lockout applied (`eps.auth_lockout.applied`); alert generated | Immediate upon threshold breach |
| Authentication challenge issued (step-up) (`eps.auth.challenged`) | Risk signal, transaction context, challenge method | Challenge event logged (`eps.auth.challenged`) | Real-time |
| Client limit or access right changed (`eps.client_limit.changed`) | Justification (`eps.limit_change.justification`), approver identity (`eps.limit_change.approver_id`), new limit value (`eps.client.ach_exposure_limit` or `eps.client.wire_daily_limit`) | Limit change recorded (`eps.client_limit.changed`); prior limit archived | Before change takes effect; enforced by access-right change workflow |

**ALERTS/METRICS:** Alert on any authentication lockout (`eps.auth_lockout.applied`) for review within 1 business day. Monitor authentication failure rates by channel; alert if failure rate exceeds institution-defined threshold. Target: zero unauthenticated transactions on any payment channel; 100% of client enrollments with documented authentication tier assignment.

---

## EPS-06 — Dual Control for High-Risk Processes {#eps-06-dual-control-for-high-risk-processes}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires internal controls commensurate with risk, including separation of duties for high-risk transactions. [NACHA Operating Rules](https://www.nacha.org/rules) require ACH originators to implement controls over origination, including exposure limits and dual authorization for high-value files. [Federal Reserve Fedwire Operating Circular](https://www.frbservices.org/resources/regulations/operating-circulars.html) and [SWIFT operating rules](https://www.swift.com/standards/swift-standards) require authenticated, controlled wire release procedures.

**SYSTEM BEHAVIOR:** Electronic processes that are higher risk in nature require dual controls or enhanced system access, as documented in Exhibit B (Internal Electronic Processes Which Require Enhanced System Access or Dual Processing Control). **ACH Origination (Business Online Banking):** Dual control is recommended for clients originating >$50,000 (`eps.client.ach_exposure_limit`); client exposure limits are assigned by the Credit Union for clients not operating under a Pre-Fund model; user limits may be set below the client limit; file creation may be restricted to pre-defined templates (`eps.client.ach_template_only`). **Wire Transfer (Business Online Banking — Wire Manager):** Dual control or offline callback approval with PIN is required; daily/periodic limits apply; file creation is limited to pre-defined templates. **Payments Exchange (Fedwire) — Internal Processing:** User ID, Passcode, and Token required; an additional PIN is required to release outgoing wires (`eps.wire.release_pin`); access is limited to registered IP addresses (`eps.wire_ip`); day/time restrictions apply; two employees are required to originate a wire (`eps.wire.second_approval`). **Wire Processing TSP (foreign/correspondent wires):** Same controls as Payments Exchange except SWIFT Alliance Lite2 is used for messaging; actual fund movement occurs through Payments Exchange/Fedwire. **SWIFT Alliance Lite2:** SWIFT code used to receive foreign wires; Alliance Lite2 software used to send messages; fund movement through Payments Exchange. **Item Processing (inbound/outbound cash letter, ACH returns):** User ID, Password, and Token required; Federal Reserve Bank security certificate required. **Fiserv EFT (Debit Card Maintenance and ENFACT):** User ID, PIN, and Token required. Limit changes require documented justification and approver identity (`eps.limit_change.justification`, `eps.limit_change.approver_id`). Dual-control fields (`eps.wire.second_approval`, `eps.wire.release_pin`) are write-restricted to authorized Deposit Operations staff only.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Wire transfer initiated internally (Payments Exchange/Fedwire) (`wire_transfer.submitted`) | Originator identity (`eps.wire.originator_id`), second approver identity (`eps.wire.second_approval`), release PIN (`eps.wire.release_pin`), registered IP verification (`eps.wire_ip`), wire amount (`wire_transfer.amount`), beneficiary (`wire_transfer.beneficiary`) | Wire release request logged (`eps.wire_release.requested`); IP verified (`eps.wire_ip.verified`); dual-control completion recorded (`transaction.dual_control.completed`) | Before wire released to Fedwire; real-time gate |
| ACH file originated by business client (`ach_transfer.created`) | Client identity, origination amount (`ach_transfer.amount`), exposure limit check (`eps.client.ach_exposure_limit`), dual-control status if >$50k, template restriction flag (`eps.client.ach_template_only`), control results (`ach_transfer.control_results`) | ACH transfer created (`ach_transfer.created`); control results recorded (`ach_transfer.control_results`) | Before file submitted to ACH network; real-time gate |
| Wire transfer callback approval completed (offline/Business Online Banking) | Callback PIN confirmation, approver identity (`eps.wire.second_approval`), wire details | Dual-control approval recorded (`transaction.dual_control.completed`); wire released | Before wire settlement |
| Client exposure limit or wire daily limit change requested (`eps.client_limit_change.requested`) | Justification (`eps.limit_change.justification`), approver identity (`eps.limit_change.approver_id`), new limit value | Limit change approved and recorded (`eps.client_limit.changed`) | Before new limit takes effect |

**ALERTS/METRICS:** Alert on any wire release (`eps.wire_release.requested`) that lacks a recorded second-approver identity (`eps.wire.second_approval`) or PIN confirmation (`eps.wire.release_pin`). Alert on any ACH file from a client originating >$50,000 without dual-control flag set. Target: zero wire releases without dual control; zero ACH files above threshold without required controls. Metrics surfaced on the Deposit Operations dashboard (`eps.dashboard.deposit_ops`).

---

## EPS-07 — Electronic Fraud Protection Systems {#eps-07-electronic-fraud-protection-systems}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to protect member information and prevent unauthorized transactions. [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) creates liability for unauthorized EFTs; fraud detection tools reduce that exposure. [NACHA Operating Rules](https://www.nacha.org/rules) require ACH originators to monitor for unauthorized entries. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) requires ongoing monitoring of fraud trends.

**SYSTEM BEHAVIOR:** The Credit Union offers and monitors three fraud protection tools for business clients: (1) **Check Positive Pay** — clients upload check issue files and make exception decisions within Business Online Banking or Business Mobiliti; (2) **Premium Positive Pay** — clients upload check issue files, monitor ACH activity, and make exception decisions within Business Online Banking; (3) **Card Controls (ACBT Card Control)** — clients register debit cards via the Mobiliti app and may turn cards on/off, set spending limits, or restrict transaction types. Client-defined card settings do not override institution-defined card limits (`eps.card.institution_limits`) and do not bypass the ENFACT card monitoring process (`eps.card.fraud_score`). The Credit Union continually monitors fraud trends (`eps.fraud_trend_review`) and reviews industry alerts (`eps.fraud.industry_alerts`) to ensure fraud tools remain current and effective. Positive Pay exception decisions must be made by the client within the same-business-day SLA; items not decisioned by cutoff are handled per the default decision rule on file. Fraud loss data (`eps.fraud.loss_data`) is tracked and reported to the IT Committee. The `eps.card.institution_limits` field is write-restricted to Deposit Operations; client card-control settings are client-managed within those bounds.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Positive Pay exception item presented to client (`eps.pospay_exception.presented`) | Presented item details (`eps.pospay.presented_item`), client issue file (`eps.pospay.issue_file`), client identity | Exception presented to client for decision (`eps.pospay_exception.presented`) | Same business day as presentment; enforced by `eps.pospay.decision.due_at` |
| Client makes Positive Pay exception decision (`eps.pospay_exception.decided`) | Client decision (pay/return), item details (`eps.pospay.presented_item`) | Exception decision logged (`eps.pospay_exception.decided`) | By `eps.pospay.decision.due_at` (same business day) |
| Client applies card control setting (`eps.card_control.applied`) | Card registration, client-defined setting (on/off, limit, transaction type), institution limit check (`eps.card.institution_limits`) | Card control applied (`eps.card_control.applied`); institution limits confirmed not overridden | Real-time at setting change |
| Fraud trend review completed (`eps.fraud_trend_review.completed`) | Industry alerts (`eps.fraud.industry_alerts`), loss data (`eps.fraud.loss_data`), fraud trend review report (`eps.fraud_trend_review.report`) | Fraud trend review completed (`eps.fraud_trend_review.completed`); findings reported to IT Committee | Periodically (at minimum quarterly, aligned with IT Committee cadence) |

**ALERTS/METRICS:** Alert on any Positive Pay exception item that reaches `eps.pospay.decision.due_at` without a client decision. Alert if fraud loss data (`eps.fraud.loss_data`) shows a trend breach against institution-defined thresholds. Target: zero undecisioned Positive Pay exceptions at cutoff; fraud trend review completed at every IT Committee cycle.

---

## EPS-08 — Vendor Due Diligence {#eps-08-vendor-due-diligence}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to oversee third-party service providers that handle member information or support critical systems. The [FFIEC IT Examination Handbook (Outsourcing Technology Services Booklet)](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_OutsourcingTechnologyServices.pdf) requires due diligence on vendors that design, implement, and service payment technologies, including review of SOC reports and encryption controls. The Board and senior management remain responsible for vendor performance regardless of outsourcing.

**SYSTEM BEHAVIOR:** The Credit Union performs annual due diligence on all vendors that design, implement, or service in-scope payment technologies (including Fiserv, Jack Henry, and other payment-channel providers). The primary annual deliverable for the hosting provider (Fiserv Johns Creek) is review of the SOC 1 Type II report (`eps.vendor.soc1_report`) and SOC 2 Type II report, and confirmation of encryption requirements (`eps.vendor.encryption_reqs`). The due diligence summary (`eps.vendor.dd_summary`) and list of Complementary User Entity Controls (CUECs) (`eps.vendor.cuec_list`) are reviewed and documented. Vendor performance metrics (`eps.vendor.performance_metrics`) are monitored on an ongoing basis. Any vendor issue identified (`eps.vendor_issue.identified`) is escalated per the vendor issue severity (`eps.vendor.issue_severity`) and described (`eps.vendor.issue_description`). Full vendor onboarding, contract management, and ongoing third-party oversight program details are governed by the Third-Party Risk Policy; this control covers only the EPS-specific annual SOC/encryption review and issue escalation. The `eps.vendor_soc1.*` and `eps.vendor.dd_summary` fields are write-restricted to Deposit Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual vendor due diligence cycle opens (`eps.vendor_dd_cycle.opened`) | Vendor inventory for in-scope payment channels (`eps.vendor.id`), prior year DD summary (`eps.vendor.dd_summary`), prior SOC report findings | DD cycle opened; tasks created for each vendor | Annually; enforced by `eps.vendor.dd_due_at` |
| SOC 1 Type II (and SOC 2 Type II) report received from hosting provider (`eps.vendor_soc1.received`) | SOC 1 Type II report (`eps.vendor.soc1_report`), report period, CUEC list (`eps.vendor.cuec_list`), encryption requirements confirmation (`eps.vendor.encryption_reqs`) | SOC report receipt logged (`eps.vendor_soc1.received`) | Annually; within DD cycle window |
| SOC report review completed (`eps.vendor_soc1.reviewed`) | Reviewed SOC report (`eps.vendor.soc1_report`), CUEC assessment, encryption requirements confirmed (`eps.vendor.encryption_reqs`), exceptions noted | SOC review completed (`eps.vendor_soc1.reviewed`); DD summary updated (`eps.vendor.dd_summary`) | Annually; by `eps.vendor.soc1_due_at` |
| Annual vendor DD completed (`eps.vendor_dd.completed`) | DD summary (`eps.vendor.dd_summary`), performance metrics (`eps.vendor.performance_metrics`), open issues | DD completion recorded (`eps.vendor_dd.completed`) | Annually; by `eps.vendor.dd_due_at` |
| Vendor issue identified (`eps.vendor_issue.identified`) | Issue description (`eps.vendor.issue_description`), severity (`eps.vendor.issue_severity`), affected service (`eps.service.id`) | Vendor issue logged; escalation initiated if high severity (`eps.vendor_issue.escalated`) | Immediate upon identification; escalation per severity |

**ALERTS/METRICS:** Alert if SOC 1 Type II review is not completed before `eps.vendor.soc1_due_at` lapses. Alert on any high-severity vendor issue (`eps.vendor.issue_severity` = high) not escalated within 1 business day. Target: 100% of in-scope payment vendors with completed annual DD; zero lapsed SOC reviews.

---

## EPS-09 — Expertise and Training {#eps-09-expertise-and-training}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to ensure staff have the expertise to manage information security and electronic banking risks. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) requires ongoing employee training and adequate backup for critical staff. [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) and [NACHA Operating Rules](https://www.nacha.org/rules) create liability exposure that client education programs help mitigate.

**SYSTEM BEHAVIOR:** **Employee training:** Management allocates sufficient resources to hire and maintain trained staff and to ensure adequate backup exists for critical roles (`eps.staffing.critical_roles`, `eps.staffing.backup_map`). Training includes technical coursework, industry conferences, working groups, and time for staff to stay current on technology and market developments. The annual employee training plan (`eps.training.employee_plan`) is maintained and completion tracked. **Client training:** Training and resource guides (`eps.training.guide_version`) are provided to clients at onboarding. Annually, additional education and self-certification (`eps.training_self_cert`, `eps.training.self_cert_form`) are completed where applicable. Periodically, the Credit Union sends communications on phishing and online fraud schemes (`eps.training_fraud_comm`). The self-certification due date is enforced by `eps.training.self_cert_due_at`. Training completion records are write-restricted to Deposit Operations and HR; client self-certification records are write-restricted to Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual employee EPS training cycle opens (`eps.training_employee_cycle.opened`) | Employee training plan (`eps.training.employee_plan`), role-based curriculum, critical role backup map (`eps.staffing.backup_map`) | Training cycle opened (`eps.training_annual_cycle.opened`); assignments created | Annually |
| Employee EPS training completed (`eps.training_employee.completed`) | Completion evidence, module ID, employee identity | Training completion recorded (`eps.training_employee.completed`) | Within annual cycle; enforced by `training.annual_due_at` |
| Client onboarded to payment service (`eps.client.enrolled`) | Client identity, service type (`eps.service.id`), guide version (`eps.training.guide_version`), education applicability flag (`eps.client.education_applicable`) | Client training delivered (`eps.training_client.delivered`); onboarding record updated (`eps.client.onboarded`) | At onboarding; before first transaction |
| Annual client self-certification due (`eps.training_self_cert`) | Client identity, self-certification form (`eps.training.self_cert_form`), applicable services | Self-certification completed (`eps.training_self_cert.completed`) | Annually; enforced by `eps.training.self_cert_due_at` |
| Phishing/fraud communication sent (`eps.training_fraud_comm.sent`) | Communication content, distribution list, fraud topic | Fraud communication logged (`eps.training_fraud_comm.logged`) | Periodically (at minimum annually; more frequently as fraud trends warrant) |

**ALERTS/METRICS:** Alert if annual employee training completion rate falls below 100% before cycle close (`training.annual_due_at`). Alert if any client self-certification is not completed before `eps.training.self_cert_due_at`. Alert if no phishing/fraud communication has been sent within the prior 12 months. Target: 100% employee training completion; 100% applicable client self-certifications on time; at least one fraud communication per year.

---

## EPS-10 — Pre-Deployment Testing {#eps-10-pre-deployment-testing}

**WHY (Reg cite):** [12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires controls to ensure systems operate as intended before deployment. The [FFIEC IT Examination Handbook](https://www.ffiec.gov/press/PDF/FFIEC_IT_Booklets_E-Banking.pdf) requires testing to validate that equipment and systems function properly, produce desired results, and interoperate with existing technology, including vendor participation in the testing process.

**SYSTEM BEHAVIOR:** Before any new or materially changed payment system or component is deployed to production, management must validate that it functions properly, produces the desired results, and interoperates with existing technology. Testing must include vendors in the process (`eps.vendor.test_participation`). A test plan (`eps.test.plan`) is prepared in advance; test results (`eps.test.results`) and any defects (`eps.test.defects`) are documented. The interoperability scope (`eps.test.interop_scope`) is explicitly defined. If defects are identified, a risk acceptance decision (`eps.test.risk_acceptance`) is required before deployment proceeds. Emergency deployments require documented exception approval (`eps.deployment.emergency_exception`) and a rollback plan (`eps.change.rollback_plan`). A post-deployment retrospective is completed within the window enforced by `eps.test.retro_due_at`. Test results are write-restricted to the project team and Deposit Operations; sign-off (`eps.test.signed_off`) requires AVP of Deposit Operations approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Deployment scheduled for new/changed payment system (`eps.deployment.scheduled`) | Test plan (`eps.test.plan`), interoperability scope (`eps.test.interop_scope`), vendor participation confirmation (`eps.vendor.test_participation`), rollback plan (`eps.change.rollback_plan`) | Deployment scheduled (`eps.deployment.scheduled`); test plan filed | Before testing begins; no hard regulatory deadline — internal gate before go-live |
| Pre-deployment testing completed (`eps.test_results.recorded`) | Test results (`eps.test.results`), defects found (`eps.test.defects`), vendor participation confirmed (`eps.vendor.test_participation`), interop scope covered (`eps.test.interop_scope`) | Test results recorded (`eps.test_results.recorded`); defects logged; sign-off obtained (`eps.test.signed_off`) | Before production deployment |
| Defects identified requiring risk acceptance | Defect description, severity, risk acceptance rationale (`eps.test.risk_acceptance`) | Risk acceptance decision documented (`eps.test.risk_acceptance`); deployment may proceed only after acceptance | Before deployment; no deployment without documented acceptance |
| Post-deployment retrospective completed (`eps.test_retro.completed`) | Deployment record, test results, any post-go-live issues | Retrospective completed (`eps.test_retro.completed`) | Within window enforced by `eps.test.retro_due_at` |

**ALERTS/METRICS:** Alert if any deployment proceeds without a recorded test sign-off (`eps.test.signed_off`). Alert if post-deployment retrospective is not completed before `eps.test.retro_due_at`. Target: zero deployments without completed pre-deployment testing and sign-off; 100% retrospectives completed on time.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [12 CFR Part 748.1 and Appendix B](https://www.ecfr.gov/current/title-12/part-748) require federally insured credit unions to notify NCUA as soon as possible — and no later than 72 hours — after the credit union reasonably believes it has experienced a reportable cyber incident. Appendix B further requires member notification when sensitive member information has been, or is reasonably believed to have been, misused. The same obligations apply regardless of whether the incident originates in an internal system or a third-party service provider.

**SYSTEM BEHAVIOR:** When any incident is detected — whether originating in an electronic payment channel, a vendor system, or elsewhere — the Credit Union must determine within 72 hours whether it constitutes a reportable cyber incident under Part 748. The CCO (or designee) owns the reportability determination (`incident.reportability_determination`). If reportable, NCUA is notified immediately via the NCUA's cybersecurity incident reporting portal; the notification record is logged (`incident_ncua.notified`). In parallel, if the incident involves sensitive member information that has been or may have been misused, member notification is required; the CCO determines whether misuse has occurred or is reasonably likely (`incident.misuse_likelihood`, `incident.misuse.determined`) and, if so, issues member notices (`incident.member_notices`). Vendor-caused incidents are handled identically — the Credit Union's notification obligation is not delegated to the vendor. The `incident.reportability_determination` and `incident.cco_signoff` fields are write-restricted to the CCO. This control receives incident records from [EPS-02](#eps-02-payment-incident-detection-bcp-testing) (payment-channel incidents) and from equivalent controls in the Business Continuity Plan, E-Commerce, Collections, Information Security, Privacy, and Third-Party Risk policies.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident opened and severity assigned (`incident.severity.assigned`) | Incident description (`incident.description`), scope (`incident.scope`), detection source (`incident.detection_source`), severity (`incident.severity`), vendor linkage if applicable (`incident.vendor_linked`) | Reportability assessment started (`incident.assessment.started`); reportability rationale drafted (`incident.reportability_rationale`) | Immediately upon incident opening; assessment must complete within 72-hour NCUA window enforced by `incident.ncua.notice.due_at` |
| Reportability determination made (`incident_reportable.determined`) | Reportability rationale (`incident.reportability_rationale`), CCO sign-off (`incident.cco_signoff`), determination (`incident.reportability_determination`) | Determination recorded (`incident.reportable.determined`); if reportable, NCUA notification queued | Within 72 hours of reasonable belief; enforced by `incident.ncua.notice.due_at` |
| NCUA notified of reportable cyber incident (`incident.ncua.notified`) | Reportability determination (`incident.reportability_determination`), incident facts (`incident.facts`), CCO sign-off (`incident.cco_signoff`), NCUA notification content | NCUA notification sent and logged (`incident.ncua.notified`); notification due-at timer cleared | No later than 72 hours after reasonable belief; enforced by `incident.ncua.notice.due_at` |
| Member misuse determination made (`incident.misuse.determined`) | Misuse likelihood assessment (`incident.misuse_likelihood`), data scope (`incident.data_scope`), member impact assessment (`incident.member_impact`) | Misuse determination recorded (`incident.misuse.determined`); if misuse confirmed or reasonably likely, member notice required | As soon as practicable after determination; enforced by `incident.notification_due_at` |
| Member notices sent (`incident.member_notices.sent`) | Notice content (`incident.notice_content`), notice template (`incident.notice_template_id`), member impact list (`incident.member_impact`) | Member notices sent and logged (`incident.member_notices.sent`) | As soon as practicable; enforced by `incident.notification_due_at` |

**ALERTS/METRICS:** Alert if any open incident has not reached `incident_reportable.determined` within 48 hours of opening (early-warning buffer before the 72-hour NCUA deadline). Alert if `incident.ncua.notice.due_at` is within 4 hours and NCUA has not yet been notified. Alert if member notice is required (`incident.member_notice_required = true`) but `incident.member_notices.sent` has not fired within the `incident.notification_due_at` window. Target: zero NCUA notifications missed or late; zero member notice obligations unmet.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all revisions; owns reportability determinations (SC-01); reviews EPS risk posture |
| **AVP of Deposit Operations** | Ultimately responsible for assessing electronic payment risks and implementing procedures; owns EPS-03, EPS-05, EPS-06, EPS-07, EPS-08, EPS-09, EPS-10 operational execution |
| **IT Committee** | Quarterly governance body; reviews risk assessments, dashboards, and audit findings |
| **Enterprise Risk Management Committee** | Reviews and approves Product Risk Analysis forms for new payment services (EPS-01) |
| **Internal Audit** | Independently verifies the internal control structure; conducts annual IT Audit |
| **Board of Directors** | Receives periodic EPS reports; retains ultimate responsibility for vendor performance |

**Review cadence:** This policy is reviewed annually (next review: 2027-07-01) or upon any material change to in-scope payment channels, applicable regulations, or the Electronic Banking Risk Assessment.

**Cross-references:**
- Electronic Banking Risk Assessment (detailed risk and control inventory)
- Electronic Banking Authentication and Risk Assessment (Exhibit A detail)
- Exhibit B — Internal Electronic Processes Requiring Enhanced System Access or Dual Processing Control
- [Business Continuity Plan Policy](#) (BCP program detail, DR exercises)
- [E-Commerce Policy](#) (consumer online/mobile banking enrollment and member experience)
- [Information Security Policy](#) (cybersecurity, encryption, IT general controls)
- [Third-Party Risk Policy](#) (vendor onboarding and ongoing oversight program)
- [Enterprise Risk Management Policy](#) (risk appetite, taxonomy, scoring methodology)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `eps.*` object and its fields and events are registered in `core-vocabulary.json` and used throughout this document per the registered vocabulary. However, several field codes used in this policy are drawn from the `eps` entity's 110-field schema and the registered event list — all are treated as registered. Any field or event code not yet confirmed in the live spec should be validated by engineering before the next review cycle. Specific provisional codes referenced include: `eps.proposal.description`, `eps.risk_assessment.id`, `eps.product_risk_analysis.id`, `eps.fraud_trend_review.report`, `eps.wire.released` (from the Provisional codes list in DESIGN_NOTES).

- **SOC 2 Type II scope.** PATRICK_NOTES and the reference policy mention SOC 1 Type II explicitly for Fiserv; SOC 2 Type II is referenced in the PATRICK_NOTES bullets. This policy requires both. If the current vendor agreement does not provide SOC 2 Type II, the gap should be documented in the Electronic Banking Risk Assessment and the vendor DD summary.

- **SWIFT Alliance Lite2 controls.** The reference policy notes that SWIFT Alliance Lite2 is used for messaging but that actual fund movement occurs through Payments Exchange/Fedwire. This policy reflects that structure. If SWIFT direct settlement is ever added, EPS-06 must be updated to reflect additional SWIFT operating rule controls.

- **ACH dual-control threshold ($50,000).** The $50,000 threshold for recommending dual control on ACH origination is drawn from the reference policy and PATRICK_NOTES. NACHA Operating Rules do not prescribe a specific dollar threshold; this is an institution-defined risk control. The threshold should be reviewed annually as part of the Electronic Banking Risk Assessment and updated if the Credit Union's risk profile changes.

- **"Recommended" vs. "required" dual control for ACH.** The reference policy and PATRICK_NOTES describe dual control for ACH clients originating >$50,000 as "recommended," not mandatory. This policy preserves that language. If the Credit Union wishes to make it mandatory, EPS-06 and the Electronic Banking Risk Assessment should be updated accordingly.

- **Positive Pay same-business-day SLA.** The same-business-day decision SLA for Positive Pay exceptions is an internal SLA inferred from standard industry practice; it is not prescribed by regulation. The Credit Union should confirm this SLA in its client agreements and operational procedures.

- **Reg CC / mobile and remote deposit capture.** [12 CFR Part 229 (Regulation CC)](https://www.ecfr.gov/current/title-12/part-229) governs funds availability for checks deposited via mobile and remote deposit capture. This policy governs the authentication and control framework for those channels; funds availability rules are governed by the Credit Union's Funds Availability Policy. If no separate Funds Availability Policy exists, Reg CC obligations should be incorporated here.

- **Reg E error resolution.** [12 CFR Part 1005 (Regulation E)](https://www.ecfr.gov/current/title-12/part-1005) requires specific error resolution procedures for consumer EFT disputes. This policy governs the authentication and fraud-prevention controls that reduce unauthorized EFT exposure; the error resolution workflow itself is governed by the Credit Union's Reg E procedures. If those procedures are not separately documented, they should be added to this policy or a dedicated Reg E procedures document.

- **NCUA charter confirmation.** This policy assumes Pynthia Credit Union is a federally insured credit union subject to [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and NCUA examination. If the Credit Union is state-chartered with a different primary regulator, the SC-01 notification requirements and applicable authority citations should be confirmed with legal counsel.

- **Shared control SC-01 source file.** The LOCAL OVERRIDES instruction directs that SC-01 be emitted verbatim from `shared-controls/ncua-incident-notification.md`. That file was not provided as an input; the SC-01 block above was synthesized from the AUTHORITY_HINTS, DESIGN_NOTES, and the policy's own incident vocabulary to be consistent with the shared-control intent. Engineering and Compliance should confirm that the SC-01 block above is byte-identical to the canonical shared-controls file before publishing.

- **Fiserv Johns Creek as primary hosting provider.** The reference policy identifies Fiserv Johns Creek as the hosting provider for electronic banking channels. This policy reflects that. If hosting arrangements change, EPS-08 must be updated to reflect the new provider and applicable SOC report requirements.
```
