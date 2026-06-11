---
title: Electronic Payment Systems Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Electronic Payment Systems, ACH, Wire Transfer, Electronic Banking, Fraud Prevention]
---

## General Policy Statement

Pynthia Credit Union offers electronic banking services in three categories — information-only systems (the public website), electronic information transfer systems (online/business banking, file transfer, ATM, email, eStatements, mobile banking), and electronic payment systems that move money. Risk is most significant in electronic payment systems — ACH origination, wire transfer entry/approval and settlement (Fedwire, SWIFT), debit/ATM cards, bill payment, mobile and remote deposit capture, Zelle, and lockbox — where operational (transaction) risk arises from fraud, error, or the inability to deliver services, and depends heavily on third-party vendors. This policy applies the most stringent risk management to payment systems through ten controls covering planning, incident preparedness, internal routines, management oversight, authentication, dual control, fraud protection, vendor due diligence, training, and pre-deployment testing, with controls commensurate with the risk documented in the Electronic Banking Risk Assessment. Cybersecurity and IT general controls, consumer channel governance, the third-party oversight program, enterprise risk methodology, and business continuity program detail are governed by their own policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New electronic banking service proposed | Proposal submitted → `eps.proposal.submitted` | Product Risk Analysis completed before ERM Committee review; ERM decision before deployment | Product Risk Analysis form | [EP-01](#ep-01-planning-and-feasibility-analysis) |
| Key electronic banking service continuity test | BCP test cycle opens → `eps.bcp_test.scheduled` | At least annually per service | Business Continuity Plan Policy; Incident Response Plan | [EP-02](#ep-02-incident-planning-and-preparedness) |
| System review / control validation cycle | Review cycle opens → `eps.control_review.opened` | At least annually per payment channel | Electronic Banking Risk Assessment | [EP-03](#ep-03-internal-routines-and-controls) |
| IT Committee meeting | Quarter ends → `eps.it_committee.convened` | Quarterly | IT dashboard; Deposit Operations Dashboard; Electronic Banking Summary | [EP-04](#ep-04-management-supervision-and-oversight) |
| IT Strategic Plan and IT Audit | Annual cycle opens → `eps.it_audit.opened` | Annually | IT Strategic Plan; IT Audit report | [EP-04](#ep-04-management-supervision-and-oversight) |
| Client authentication challenge | Client login attempt → `eps.auth.challenged` | Real time, before session grant | Exhibit A; Electronic Banking Authentication and Risk Assessment | [EP-05](#ep-05-authentication-controls) |
| High-risk payment release (wire) | Wire entered → `wire_transfer.created` (status `pending_approval`) | Second approver or callback-with-PIN before release; same business day for Fedwire cutoff | Exhibit B | [EP-06](#ep-06-dual-control-for-high-risk-processes) |
| ACH file origination over exposure limit | ACH batch created → `ach_transfer.created` (status `pending_approval`) | Control engine decision before submission; NACHA processing-window cutoffs | NACHA Operating Rules | [EP-06](#ep-06-dual-control-for-high-risk-processes) |
| Positive pay exception decision | Exception item presented → `eps.pospay.exception_presented` | Client decision by daily cutoff; default per client agreement | Positive Pay agreements | [EP-07](#ep-07-electronic-fraud-protection-systems) |
| Hosting provider SOC 1 Type II and SOC 2 Type II review | SOC reports received → `eps.vendor.soc_received` | Annually | Information Technology Cyber Security Policy | [EP-08](#ep-08-vendor-due-diligence) |
| Client onboarding training | Client enrolled → `eps.client.onboarded` | At onboarding; annual education/self-certification where applicable | Resource guides; self-certification records | [EP-09](#ep-09-expertise-and-training) |
| Pre-deployment system testing | System scheduled for deployment → `eps.deployment.scheduled` | Test sign-off before production go-live | Test plans and results | [EP-10](#ep-10-testing) |

## EP-01 — Planning and Feasibility Analysis  {#ep-01-planning-and-feasibility-analysis}

- **WHY (Reg cite):** NCUA Part 748 and its [Appendix A](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) require a security program that assesses risks to member information systems before and during their operation; the FFIEC IT Examination Handbook ([E-Banking booklet](https://ithandbook.ffiec.gov/it-booklets/e-banking/)) expects board-approved due diligence before new electronic banking services launch.
- **SYSTEM BEHAVIOR:** Every proposal for a new electronic banking service is analyzed in three stages — study (needs, objectives, and alternatives), design and development (best solution identified and installed, policies/procedures developed, documentation completed), and operation (proper operation and maintenance). A Product Risk Analysis form is prepared and presented to the Enterprise Risk Management Committee, which must review the service before deployment. Minor configuration changes to an existing approved service do not re-trigger the full three-stage analysis; they follow change-management procedures instead. The Product Risk Analysis record is write-restricted to Deposit Operations and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New electronic banking service proposed (`eps.proposal.submitted`) | Service description (`eps.proposal.description`), needs/objectives/alternatives analysis (`eps.proposal.study_doc`), sponsoring department (`eps.proposal.sponsor`) | Product Risk Analysis form drafted (`eps.product_risk_analysis.drafted`) | Before ERM Committee agenda cutoff (internal: 10 BD from submission) |
  | ERM Committee reviews the proposal (`eps.erm_review.convened`) | Completed Product Risk Analysis (`eps.product_risk_analysis.id`), vendor due-diligence summary (`eps.vendor.dd_summary`), risk-assessment update (`eps.risk_assessment.delta`) | ERM decision and conditions recorded (`eps.erm_review.decided`) | Before design/development stage begins (internal: next scheduled ERM meeting) |
  | Approved service enters operation (`eps.service.activated`) | ERM approval (`eps.erm_review.decided`), completed documentation (`eps.proposal.design_docs`), test sign-off (`eps.test.signed_off`) | Service registered in Electronic Banking Risk Assessment inventory (`eps.risk_assessment.service_added`) | Before production go-live (internal: 5 BD before launch) |

- **ALERTS/METRICS:** Count of services launched without a completed Product Risk Analysis (target zero); aging alert when a submitted proposal has no ERM decision within 45 days; annual reconciliation of the service inventory against the Electronic Banking Risk Assessment.

## EP-02 — Incident Planning and Preparedness  {#ep-02-incident-planning-and-preparedness}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires response programs for unauthorized access to member information, and [Appendix B](https://www.ecfr.gov/current/title-12/appendix-Appendix%20B%20to%20Part%20748) sets guidance on member notice; [12 CFR §748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1) requires reporting of certain cyber incidents to NCUA within 72 hours.
- **SYSTEM BEHAVIOR:** The credit union maintains a business continuity plan, supporting procedures, and an incident response plan that cover electronic banking risks and outline action plans for disasters and incidents. The business continuity plan includes regular testing of key electronic banking services (ACH, wire, bill pay, mobile/remote deposit capture at minimum). Incidents affecting payment systems are triaged through the incident response plan; reportable cyber incidents are escalated for the 72-hour NCUA notification. Program-level BCP/DR detail lives in the Business Continuity Plan Policy — this control covers only the electronic-banking-specific test scope and incident hooks. Incident records are write-restricted to the incident response team and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Scheduled continuity test of a key electronic banking service (`eps.bcp_test.scheduled`) | Service identifier (`eps.service.id`), test scenario (`eps.bcp_test.scenario`), vendor participation confirmation (`eps.vendor.test_participation`) | Test results and remediation items (`eps.bcp_test.completed`) | At least annually per key service (internal: results filed within 10 BD; tracked by `eps.bcp_test.due_at`) |
  | Electronic banking incident detected (`eps.incident.detected`) | Affected channel (`eps.service.id`), impact assessment (`eps.incident.impact`), incident classification (`eps.incident.severity`) | Incident response activated and incident record opened (`eps.incident.opened`) | Immediately upon detection (internal: triage within 1 hour) |
  | Incident determined to be a reportable cyber incident (`eps.incident.reportable_determined`) | Incident record (`eps.incident.id`), severity and member-impact facts (`eps.incident.impact`) | NCUA notification filed (`eps.incident.ncua_notified`) | 72 hours per 12 CFR §748.1(c) (enforced by `eps.incident.ncua_due_at`) |

- **ALERTS/METRICS:** Percentage of key electronic banking services with a completed continuity test in the trailing 12 months (target 100%); incident triage latency distribution; count of reportable incidents notified past the 72-hour deadline (target zero).

## EP-03 — Internal Routines and Controls  {#ep-03-internal-routines-and-controls}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires institutions to design, test, and adjust controls protecting member information systems; the FFIEC [Retail Payment Systems booklet](https://ithandbook.ffiec.gov/it-booklets/retail-payment-systems/) expects documented internal controls over payment processing.
- **SYSTEM BEHAVIOR:** Management maintains comprehensive system reviews and tests that validate the controls protecting hardware, software, proprietary data, and electronic transmissions in each area touching electronic payments. Review results feed the Electronic Banking Risk Assessment, and users are trained to adhere to control standards (training mechanics in [EP-09](#ep-09-expertise-and-training)). Encryption, intrusion detection, and IT general-control specifics are governed by the Information Security Policy; this control validates that payment-specific routines conform. Audit personnel independently verify the internal control structure. Control-review records are write-restricted to Internal Audit and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Control review cycle opens for a payment channel (`eps.control_review.opened`) | Channel inventory (`eps.service.id`), prior findings (`eps.control_review.prior_findings`), control standards checklist (`eps.control_review.checklist`) | Review results with pass/fail per control (`eps.control_review.completed`) | At least annually per channel (internal: report within 15 BD of cycle close; tracked by `eps.control_review.due_at`) |
  | Control deficiency identified (`eps.control_review.deficiency_found`) | Deficiency description (`eps.deficiency.description`), affected channel (`eps.service.id`), risk rating (`eps.deficiency.rating`) | Remediation plan opened and tracked (`eps.deficiency.remediation_opened`) | Remediation plan within 30 days of finding (enforced by `eps.deficiency.remediation_due_at`) |

- **ALERTS/METRICS:** Open control deficiencies by age and risk rating with aging alerts at 30/60/90 days; percentage of payment channels reviewed within the trailing 12 months (target 100%).

## EP-04 — Management Supervision and Oversight  {#ep-04-management-supervision-and-oversight}

- **WHY (Reg cite):** [12 CFR §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0) makes the board responsible for the security program, and Part 748 [Appendix A §II](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires board involvement in approving and overseeing the program; the FFIEC [E-Banking booklet](https://ithandbook.ffiec.gov/it-booklets/e-banking/) expects ongoing board and senior management oversight of e-banking risk.
- **SYSTEM BEHAVIOR:** Management and the Board remain actively involved in electronic banking decision-making, supported by a standing oversight stack: the Electronic Banking Risk Assessment, a quarterly IT Committee, an IT Risk Assessment, an annually prepared IT Strategic Plan, an annual IT Audit covering controls and supervision, IT and Deposit Operations dashboards, and an Electronic Banking Summary. Reports are provided to the Board periodically detailing actions taken to assess and manage electronic banking risks. The Assistant Vice President of Deposit Operations is the individual ultimately responsible for assessing risks and implementing mitigation procedures; overall governance is centralized with the Chief Compliance Officer. Oversight artifacts are write-restricted to their owning function (IT, Deposit Operations, or Compliance) with read access for the Board.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | IT Committee convenes (`eps.it_committee.convened`) | IT dashboard (`eps.dashboard.it`), Deposit Operations Dashboard (`eps.dashboard.deposit_ops`), Electronic Banking Summary (`eps.summary.ebanking`) | Minutes and action items recorded (`eps.it_committee.minutes_filed`) | Quarterly (internal: minutes filed within 10 BD) |
  | Annual IT Audit performed (`eps.it_audit.opened`) | Control inventory (`eps.control_review.checklist`), prior audit findings (`eps.it_audit.prior_findings`), risk assessments (`eps.risk_assessment.id`) | IT Audit report with findings (`eps.it_audit.report_issued`) | Annually (tracked by `eps.it_audit.due_at`) |
  | Periodic Board report due (`eps.board_report.due`) | Electronic Banking Summary (`eps.summary.ebanking`), risk-assessment updates (`eps.risk_assessment.delta`), open findings (`eps.deficiency.open_list`) | Board report delivered and acknowledged (`eps.board_report.delivered`) | Per Board reporting calendar, at least annually (tracked by `eps.board_report.due_at`) |

- **ALERTS/METRICS:** IT Committee meeting cadence compliance (4 of 4 quarters); count of overdue Board reports or audit cycles (target zero); aging of open IT Audit findings.

## EP-05 — Authentication Controls  {#ep-05-authentication-controls}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires access controls on member information systems, including authentication; the FFIEC [Authentication and Access to Financial Institution Services and Systems guidance](https://www.ffiec.gov/press/pr081121.htm) expects layered, risk-commensurate authentication for digital banking; [Regulation E, 12 CFR §1005.6](https://www.ecfr.gov/current/title-12/part-1005/section-1005.6) limits consumer liability for unauthorized EFTs, making authentication failures a direct loss exposure.
- **SYSTEM BEHAVIOR:** User authentication is required on all client-facing electronic banking services, with degrees of authentication applied in accordance with perceived risk as documented in Exhibit A and the Electronic Banking Authentication and Risk Assessment. Examples: user ID/password/token for system access; tokens and dual control for higher-risk functions; IP and day/time restrictions; mobile device registration; and challenge questions. Bill-pay access is not activated until a new enrollment is verified. Client user administration may be self-administered only where a Self-Administration agreement is on file — otherwise only credit union employees may create users or change user rights. Authentication configuration is write-restricted to Deposit Operations; changes to risk-tier mappings require Compliance approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Client attempts login or steps up to a higher-risk function (`eps.auth.challenged`) | Credentials/token presented (`eps.auth.credentials`), device registration status (`eps.auth.device_registered`), risk tier of requested function (`eps.auth.risk_tier`) | Session granted or denied with reason (`eps.auth.decided`) | Real time, before session grant (internal: sub-second decision) |
  | Client enrolls in an electronic banking service (`eps.client.enrollment_requested`) | Identity verification result (`verification.status`), service requested (`eps.service.id`), Self-Administration agreement status (`eps.client.self_admin_agreement`) | Enrollment activated with authentication profile assigned (`eps.client.enrolled`) | After enrollment verification completes (internal: 2 BD) |
  | Repeated failed authentication detected (`eps.auth.failure_threshold_reached`) | Failure count and pattern (`eps.auth.failure_count`), client identifier (`entity_id`) | Account access locked and review queued (`eps.auth.lockout_applied`) | Real time at threshold (internal: review within 1 BD) |

- **ALERTS/METRICS:** Authentication failure-rate trend by channel; count of sessions granted to unregistered devices on high-risk functions (target zero); lockout-review queue aging.

## EP-06 — Dual Control for High-Risk Processes  {#ep-06-dual-control-for-high-risk-processes}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires segregation-of-duties and dual-control procedures commensurate with risk; the [NACHA Operating Rules](https://www.nachaoperatingrulesonline.org/) require ODFIs to establish and enforce originator exposure limits; UCC Article 4A as implemented through [Regulation J, 12 CFR Part 210 Subpart B](https://www.ecfr.gov/current/title-12/part-210/subpart-B) makes commercially reasonable security procedures the basis for wire-transfer loss allocation.
- **SYSTEM BEHAVIOR:** Higher-risk electronic processes require dual controls or enhanced system access as documented in Exhibit B. For client ACH origination: dual control is recommended for clients originating over $50,000; client and user exposure limits are assigned (user limits may be below the client limit; clients not on a pre-fund model receive credit-union-assigned exposure limits); file creation may be limited to pre-defined templates. For client wire transfers: dual control or offline callback approval with PIN is required, daily/periodic limits may be assigned, and file creation is limited to pre-defined templates. For internal Fedwire/SWIFT and item processing: ID/passcode/token for system access, an additional PIN to release outgoing wires, registered-IP and day/time restrictions, and two employees required to originate a wire. SWIFT Alliance Lite2 sends and receives messages only — actual funds movement settles through the Fedwire platform. Exposure-limit and template configuration is write-restricted to Deposit Operations with Compliance approval for limit increases.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Client ACH batch entered (`ach_transfer.created`, status `pending_approval`) | Amount (`ach_transfer.amount`), counterparty (`ach_transfer.counterparty`), client exposure limit (`eps.client.ach_exposure_limit`), template restriction flag (`eps.client.ach_template_only`) | Control engine decision — submitted or rejected with reason (`ach_transfer.status` → `submitted`/`rejected`, logged in `ach_transfer.control_results`) | Before NACHA processing-window cutoff (`ach_transfer.window`); control decision real time |
  | Client wire entered (`wire_transfer.created`, status `pending_approval`) | Amount (`wire_transfer.amount`), beneficiary (`wire_transfer.beneficiary`), second-approver or callback-with-PIN confirmation (`eps.wire.second_approval`), client daily limit (`eps.client.wire_daily_limit`) | Wire released or rejected (`wire_transfer.status` → `submitted`/`rejected`, logged in `wire_transfer.control_results`) | Same business day before Fedwire cutoff (internal: approval within 2 hours of entry) |
  | Internal outbound wire release requested (`eps.wire.release_requested`) | Releasing employee credentials and PIN (`eps.wire.release_pin`), originating employee identity (`eps.wire.originator_id`), registered-IP check (`eps.wire.ip_verified`) | Wire released with two-employee record (`eps.wire.released`, `wire_transfer.imad` populated on submission) | Before Fedwire cutoff (internal: dual-control verification at release time) |
  | Exposure limit change requested (`eps.client.limit_change_requested`) | Current and proposed limits (`eps.client.ach_exposure_limit`, `eps.client.wire_daily_limit`), justification (`eps.limit_change.justification`), approver identity (`eps.limit_change.approver_id`) | Limit updated with approval record (`eps.client.limit_changed`) | Before next origination at the new limit (internal: Compliance approval within 3 BD) |

- **ALERTS/METRICS:** Count of wires released without a recorded second approval or callback (target zero); ACH batches exceeding client exposure limits caught by the control engine; over-$50k originators without dual control flagged for annual review; limit-change approvals pending more than 3 business days.

## EP-07 — Electronic Fraud Protection Systems  {#ep-07-electronic-fraud-protection-systems}

- **WHY (Reg cite):** [Regulation E, 12 CFR §1005.6 and §1005.11](https://www.ecfr.gov/current/title-12/part-1005) place unauthorized-transfer and error-resolution liability on the institution, making fraud detection a loss-prevention control; the [NACHA Operating Rules](https://www.nachaoperatingrulesonline.org/) require ACH risk management including fraud monitoring; NCUA Part 748 [Appendix A](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires monitoring systems to detect attacks and intrusions.
- **SYSTEM BEHAVIOR:** The credit union offers and monitors fraud protection tools: Check Positive Pay (clients upload check issue files and decide exceptions in business online banking or mobile app), Premium Positive Pay (adds ACH activity monitoring), and card controls (clients register debit cards and can turn the card on/off, set limits, and set transaction types — client settings never override institution-defined card limits and never bypass the card-monitoring process). The credit union continually monitors fraud trends to keep the tool set current. Card spend-control settings are enforced in addition to, never instead of, institution-level controls. Fraud-rule configuration is write-restricted to Deposit Operations and the fraud team.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Presented item fails positive-pay match (`eps.pospay.exception_presented`) | Issue file (`eps.pospay.issue_file`), presented-item details (`eps.pospay.presented_item`), client decision channel (`eps.service.id`) | Client pay/return decision recorded (`eps.pospay.exception_decided`) | Client daily cutoff; default disposition per agreement (enforced by `eps.pospay.decision_due_at`) |
  | Client changes card controls (`eps.card_control.changed`) | Requested setting (`card.spend_controls`), card status (`card.status`), institution limits (`eps.card.institution_limits`) | Setting applied within institution caps (`eps.card_control.applied`) | Real time |
  | Card authorization evaluated against fraud and spend controls (`card_authorization.created`, status `pending`) | Amount (`card_authorization.amount`), merchant (`card_authorization.merchant`), spend controls (`card.spend_controls`), monitoring score (`eps.card.fraud_score`) | Authorization approved or declined with reason (`card_authorization.status` → `approved`/`declined`, `card_authorization.decline_reason`, logged in `card_authorization.control_results`) | Real time (internal: sub-2-second decision) |
  | Fraud trend review performed (`eps.fraud_trend_review.completed`) | Loss and attempt data by channel (`eps.fraud.loss_data`), industry alerts (`eps.fraud.industry_alerts`) | Trend report and tool-gap recommendations (`eps.fraud_trend_review.report`) | Quarterly (internal: presented at next IT Committee) |

- **ALERTS/METRICS:** Positive-pay exceptions undecided at cutoff; fraud loss rate by channel (ACH, wire, card, RDC) with quarter-over-quarter trend; card authorization decline-reason distribution; count of client card settings observed exceeding institution caps (target zero).

## EP-08 — Vendor Due Diligence  {#ep-08-vendor-due-diligence}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.D](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires exercising due diligence in selecting service providers, contractually requiring safeguards, and monitoring them; the FFIEC [Outsourcing Technology Services booklet](https://ithandbook.ffiec.gov/it-booklets/outsourcing-technology-services/) sets supervisory expectations for ongoing third-party monitoring of payment technology providers.
- **SYSTEM BEHAVIOR:** The credit union performs due diligence on the third-party vendors that design, implement, and service its payment technologies (Fiserv, Jack Henry, and similar), per the Information Technology Cyber Security Policy. Annual due diligence on the hosting provider includes review of its SOC 1 Type II report (controls over financial reporting) and SOC 2 Type II report (security, availability, and processing integrity), as well as its requirements for encryption of data communications. The Board and senior management remain responsible for vendor performance and actions at all times — outsourcing the function does not outsource the accountability. The full vendor onboarding and ongoing oversight program is governed by the Third-Party Risk Policy; this control covers the payment-system-specific review obligations. Vendor due-diligence files are write-restricted to the vendor management function and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Hosting provider SOC 1 Type II and SOC 2 Type II reports received (`eps.vendor.soc_received`) | SOC 1 Type II report (`eps.vendor.soc1_report`), SOC 2 Type II report (`eps.vendor.soc2_report`), complementary user entity controls list (`eps.vendor.cuec_list`), encryption requirements (`eps.vendor.encryption_reqs`) | Review memo with exceptions and CUEC mapping (`eps.vendor.soc_reviewed`) | Annually (internal: review within 30 days of receipt; tracked by `eps.vendor.soc_due_at`) |
  | Payment vendor due-diligence cycle opens (`eps.vendor.dd_cycle_opened`) | Vendor inventory (`eps.vendor.id`), performance data (`eps.vendor.performance_metrics`), incident history (`eps.incident.vendor_linked`) | Due-diligence file updated with conclusion (`eps.vendor.dd_completed`) | Annually per critical payment vendor (tracked by `eps.vendor.dd_due_at`) |
  | Vendor performance issue identified (`eps.vendor.issue_identified`) | Issue description (`eps.vendor.issue_description`), affected services (`eps.service.id`), severity (`eps.vendor.issue_severity`) | Escalation to senior management and remediation tracking (`eps.vendor.issue_escalated`) | Escalation within 5 BD of identification |

- **ALERTS/METRICS:** Critical payment vendors with overdue annual due diligence (target zero); SOC 1 Type II or SOC 2 Type II exceptions open beyond 90 days; vendor-attributed incident count per quarter.

## EP-09 — Expertise and Training  {#ep-09-expertise-and-training}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C.2](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires training staff to implement the security program; the FFIEC [Authentication guidance](https://www.ffiec.gov/press/pr081121.htm) expects customer awareness and education programs covering phishing and account-takeover risks.
- **SYSTEM BEHAVIOR:** Employee education: management allocates resources for training key employees on critical payment functions — technical coursework, industry conferences, working groups, and time to track technological and market developments — and ensures adequate backup exists if critical people leave. Client education: training and resource guides are provided at onboarding; annual education and self-certification is completed where applicable; and the credit union periodically sends communications on phishing and other online fraud schemes. Training records are write-restricted to the training function and Deposit Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New client onboarded to a payment service (`eps.client.onboarded`) | Service enrolled (`eps.service.id`), client contacts (`eps.client.contacts`), resource guide version (`eps.training.guide_version`) | Training and resource guide delivery recorded (`eps.training.client_delivered`) | At onboarding (internal: before first origination) |
  | Annual client education cycle opens (`eps.training.annual_cycle_opened`) | Applicable client list (`eps.client.education_applicable`), self-certification forms (`eps.training.self_cert_form`) | Self-certifications collected and exceptions noted (`eps.training.self_cert_completed`) | Annually where applicable (tracked by `eps.training.self_cert_due_at`) |
  | Employee training cycle for critical payment staff (`eps.training.employee_cycle_opened`) | Critical-role roster (`eps.staffing.critical_roles`), backup coverage map (`eps.staffing.backup_map`), training plan (`eps.training.employee_plan`) | Completion records and backup-coverage attestation (`eps.training.employee_completed`) | Annually (internal: completion before year-end) |
  | Fraud-awareness communication sent to clients (`eps.training.fraud_comm_sent`) | Current fraud themes (`eps.fraud.industry_alerts`), client distribution list (`eps.client.contacts`) | Communication record with content and reach (`eps.training.fraud_comm_logged`) | Periodically (internal: at least semiannually) |

- **ALERTS/METRICS:** Self-certification completion rate among applicable clients; critical payment roles without a designated trained backup (target zero); employee training completion rate; elapsed time since last client fraud communication.

## EP-10 — Testing  {#ep-10-testing}

- **WHY (Reg cite):** NCUA Part 748 [Appendix A §III.C.3](https://www.ecfr.gov/current/title-12/appendix-Appendix%20A%20to%20Part%20748) requires regular testing of key controls and systems; the FFIEC [Development and Acquisition booklet](https://ithandbook.ffiec.gov/it-booklets/development-and-acquisition/) expects validation that new systems function as intended and interoperate with existing technology before deployment.
- **SYSTEM BEHAVIOR:** Before any new or changed payment system is deployed, management validates that equipment and systems function properly, produce the desired results, and operate effectively with the credit union's existing technology. Vendors are included in the testing process. Production go-live is gated on test sign-off; emergency fixes deployed under change-management exception are tested retroactively within the exception window. Test sign-off authority is restricted to the AVP of Deposit Operations or designee.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New or changed payment system scheduled for deployment (`eps.deployment.scheduled`) | Test plan (`eps.test.plan`), interoperability scope (`eps.test.interop_scope`), vendor test participation (`eps.vendor.test_participation`) | Test execution results (`eps.test.results_recorded`) | Before production go-live |
  | Test results reviewed for go-live decision (`eps.test.results_recorded`) | Results (`eps.test.results`), defect list (`eps.test.defects`), risk acceptance for open items (`eps.test.risk_acceptance`) | Go-live sign-off or rejection (`eps.test.signed_off`) | Before deployment (internal: sign-off within 5 BD of test completion) |
  | Emergency change deployed without full pre-test (`eps.deployment.emergency_exception`) | Exception approval (`eps.change.exception_approval`), rollback plan (`eps.change.rollback_plan`) | Retroactive test completion record (`eps.test.retro_completed`) | Within the exception window (internal: 10 BD; enforced by `eps.test.retro_due_at`) |

- **ALERTS/METRICS:** Deployments to production without a recorded test sign-off (target zero); emergency exceptions with overdue retroactive testing; defect escape rate (production incidents traced to untested changes).

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, interpretation, and centralized governance of the controls in this document.
- **Operational responsibility:** The Assistant Vice President of Deposit Operations is the individual ultimately responsible for assessing electronic banking risks and implementing procedures to minimize them.
- **Required participants:** The IT Committee (quarterly) and the Enterprise Risk Management Committee (new-service review per [EP-01](#ep-01-planning-and-feasibility-analysis)) are required governance participants. Audit personnel verify the internal control structure and departmental adherence to this policy.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual review, next due 2027-06-04, or sooner upon material change to payment channels, vendors, or regulatory requirements.
- **Cross-references:** E-Commerce Policy (consumer channel governance); Information Security Policy / Information Technology Cyber Security Policy (cybersecurity, encryption, IT general controls); Third-Party Risk Policy (vendor onboarding and ongoing oversight program); Enterprise Risk Management Policy (risk appetite, taxonomy, scoring); Business Continuity Plan Policy (BCP/DR program detail); Electronic Banking Risk Assessment and Electronic Banking Authentication and Risk Assessment (control detail and risk tiers); Exhibits A and B (current authentication and dual-control configurations).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The parsed `vocabulary.json` (Cassandra Banking Core API v1.0.0) registers entities and fields for `ach_transfer`, `wire_transfer`, `card`, `card_authorization`, `verification`, and related resources, but defines **zero events**. All `eps.*` event codes and all lifecycle event codes used in the EVENTS tables (e.g., `ach_transfer.created`, `wire_transfer.created`, `card_authorization.created`, `eps.incident.opened`, `eps.test.signed_off`) are the target naming scheme and must be registered by engineering before the next review. Field codes such as `eps.client.ach_exposure_limit`, `eps.wire.second_approval`, `eps.auth.device_registered`, and the various timer codes (`*.due_at`) are likewise unregistered targets.
- **Vendor and platform names carried forward from the reference policy** (Fiserv ACH Manager / Wire Manager, Payments Exchange: Fedwire, Fiserv EFT, CheckFree, Mobiliti, Jack Henry Remote Deposit Capture, SWIFT Alliance Lite2, TMR Lockbox, EnFact-style card monitoring) reflect a 2021–2022 bank-charter document. Pynthia's actual current vendor stack and channel inventory need confirmation against the live Electronic Banking Risk Assessment.
- **Exhibits A and B are referenced but not reproduced here.** The authentication matrix (Exhibit A) and the dual-control/enhanced-access process list (Exhibit B) are maintained as attachments to this policy; their current versions need to be confirmed and re-issued under Pynthia branding.
- **The $50,000 ACH dual-control threshold is recommended, not mandatory,** per Patrick's notes and the reference policy. Whether Pynthia wants to make dual control mandatory above a threshold (and at what level) needs a decision.
- **Continuity-test and review frequencies** (annual per key service for BCP tests, annual per channel for control reviews, quarterly fraud-trend reviews, semiannual fraud communications) are minimum viable cadences inferred where the reference policy said only "regular" or "periodically"; the AVP of Deposit Operations should confirm or tighten them.
- **The 72-hour NCUA cyber-incident notification** (12 CFR §748.1(c)) is included as the binding reportable-incident deadline; the incident response plan's internal classification of "reportable" needs to be confirmed as aligned with NCUA's definitions.
- **Zelle and lockbox channels** are in scope per the policy statement but have no channel-specific controls beyond the general authentication ([EP-05](#ep-05-authentication-controls)), fraud-protection ([EP-07](#ep-07-electronic-fraud-protection-systems)), and vendor ([EP-08](#ep-08-vendor-due-diligence)) controls; whether they need dedicated dual-control or limit structures should be assessed in the next Electronic Banking Risk Assessment cycle.
- **Patrick Wilson is currently the sole approver.** Board adoption of this policy (consistent with §748.0's board-responsibility framing and the active-board-management critical element) is assumed to occur through the periodic Board reporting in [EP-04](#ep-04-management-supervision-and-oversight); a formal Board approval line should be added when the approval workflow is confirmed.
