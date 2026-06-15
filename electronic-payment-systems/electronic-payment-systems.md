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

Pynthia Credit Union segregates its electronic banking into information-only systems (the public website), electronic information transfer systems (online/business banking, file transfer, ATM, email, eStatements, mobile banking), and electronic payment systems, and applies the most stringent risk management to electronic payment systems because they carry the institution's most significant operational (transaction) risk. This policy governs the in-scope payment channels — ACH origination, wire transfer entry/approval and settlement (Fedwire, SWIFT), debit/ATM cards, retail and business online banking, bill payment, mobile and remote deposit capture, Zelle, and lockbox — and commits the credit union to controls commensurate with that risk: assessing risk, assigning accountability, active board management, ongoing testing and monitoring, training and education, internal controls, and planning for future developments, as detailed in the Electronic Banking Risk Assessment. Consumer-channel governance, cybersecurity/IT general controls, the third-party oversight program, enterprise risk methodology, and business-continuity program detail live in their respective policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| New electronic banking service proposed | Sponsor submits proposal with study/design docs (`eps.proposal.submitted`) | Before ERM decision; internal 30 BD | Product Risk Analysis + 3-stage analysis | [EPS-01](#eps-01-planning-and-feasibility-analysis) |
| Higher-risk wire release requested | Originator requests outgoing wire release (`eps.wire.release_requested`) | Real-time, before release | PIN + second approval + registered-IP/day-time | [EPS-06](#eps-06-dual-control-for-high-risk-processes) |
| Positive Pay exception presented | Suspect item presented against issue file (`eps.pospay.exception_presented`) | Same banking day cutoff | Pay/return decision | [EPS-07](#eps-07-electronic-fraud-protection-systems) |
| Vendor SOC report received | Annual SOC 1 Type II / SOC 2 Type II received (`eps.vendor.soc1_received`) | Within 60 days of receipt | SOC review + encryption confirmation | [EPS-08](#eps-08-vendor-due-diligence) |
| Client self-certification due | Annual education cycle opens (`eps.training.annual_cycle_opened`) | Annually | Self-certification + resource guides | [EPS-09](#eps-09-expertise-and-training) |
| Payment-system incident detected | Incident affecting an electronic payment service detected (`eps.incident.detected`) | NCUA notice per §748 App. B; internal 24h triage | Incident response + NCUA notification | [EPS-02](#eps-02-incident-planning-and-preparedness) |
| Quarterly board/management oversight cycle | Oversight cycle closes (`eps.board_report.delivered`) | Quarterly | Electronic Banking Summary + dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |

## EPS-01 — Planning and Feasibility Analysis  {#eps-01-planning-and-feasibility-analysis}

**WHY (Reg cite):** New electronic payment services must be risk-assessed before launch under the safeguarding-of-member-information program standard in [NCUA 12 CFR Part 748 and Appendix A](https://www.ecfr.gov/current/title-12/part-748), which requires risk assessment of operational systems, and the FFIEC E-Banking / Retail Payment Systems booklets' expectation that new channels be evaluated commensurate with risk before deployment.

**SYSTEM BEHAVIOR:** Each proposal for a new electronic banking service is analyzed in three stages — study (needs, objectives, alternatives), design and development (best solution installed; policies, procedures, and documentation completed), and operation (proper operation and maintenance). A Product Risk Analysis form is drafted and routed to the Enterprise Risk Management Committee, which reviews and decides before the service may be activated; a service cannot move to activation until the ERM decision is recorded. Proposals that are study-stage only (no design docs) are returned to the sponsor rather than routed to ERM. The Product Risk Analysis form and the service-activation gate are write-restricted to the AVP of Deposit Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Sponsor submits a new-service proposal (`eps.proposal.submitted`) | Proposal sponsor (`eps.proposal.sponsor`), study doc (`eps.proposal.study_doc`), design docs (`eps.proposal.design_docs`), drafted Product Risk Analysis (`eps.product_risk_analysis.drafted`) | Proposal record + emitted submission event (`eps.proposal.submitted`) | Before ERM review (internal: 5 BD to schedule; enforced by `risk.product_assessment_due_at`) |
| Product Risk Analysis assessed for the service (`risk.product_assessment_completed`) | Product risk subject (`product_risk.candidate_profile`), inherent score (`risk.inherent_score`), partner dependency (`risk.partner_dependency`) | Product risk assessment result (`risk.product_assessment_completed`) | Internal: 30 BD (enforced by `risk.product_assessment_due_at`) |
| ERM Committee decides on the proposal (`eps.erm_review.decided`) | ERM convened flag (`eps.erm_review.convened`), drafted analysis (`eps.product_risk_analysis.drafted`) | ERM decision record (`eps.erm_review.decided`) | Before activation (no regulatory deadline) |
| Service activated after favorable decision (`eps.service.activated`) | Service identifier (`eps.service.id`), risk-assessment delta (`eps.risk_assessment.delta`) | Activated service + risk-assessment service entry (`eps.service.activated`, `eps.risk_assessment.service_added`) | After ERM decision recorded (no regulatory deadline) |

**ALERTS/METRICS:** Alert on any service activation lacking a recorded `eps.erm_review.decided`; target zero. Track aging of `risk.product_assessment_due_at` past 30 BD and count proposals returned at study stage.

## EPS-02 — Incident Planning and Preparedness  {#eps-02-incident-planning-and-preparedness}

**WHY (Reg cite):** A documented response program for incidents affecting member information and payment systems — including member and regulator notification — is required by [NCUA 12 CFR Part 748 Appendix B (Guidance on Response Programs)](https://www.ecfr.gov/current/title-12/part-748) and the safeguarding standards of [Appendix A](https://www.ecfr.gov/current/title-12/part-748); affected EFT channels also carry consumer protections under [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005).

**SYSTEM BEHAVIOR:** The credit union maintains a business continuity plan, incident response plan, and procedures covering electronic banking risks, with regular BCP testing of key electronic banking services. When an incident affects an electronic payment service it is opened, triaged, and assessed for NCUA notifiability; the detailed BCP/DR program lives in the Business Continuity Plan Policy and is referenced rather than restated here. An incident determined non-reportable still completes triage and is logged. NCUA notification content is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Incident affecting a payment service detected (`eps.incident.detected`) | Incident impact (`eps.incident.impact`), vendor linkage (`eps.incident.vendor_linked`), severity (`eps.incident.severity`) | Opened incident record (`eps.incident.opened`) | Internal: 24h triage (enforced by `incident.triage_due_at`) |
| BCP test of a key electronic banking service scheduled (`eps.bcp_test.scheduled`) | Test scenario (`eps.bcp_test.scenario`) | Completed BCP test record (`eps.bcp_test.completed`) | Per BCP schedule (enforced by `eps.bcp_test.due_at`) |
| NCUA notification criteria met for the incident (`eps.incident.ncua_notified`) | Reportability determination (`eps.incident.reportable_determined`), incident identifier (`eps.incident.id`) | NCUA notification + acknowledgement log (`incident.ncua_notified`, `ncua.notification_sent`) | As soon as possible per §748 App. B (enforced by `eps.incident.ncua_due_at`) |

**ALERTS/METRICS:** Alert when an opened payment incident exceeds the 24h triage timer; target zero overdue NCUA notifications. Track BCP-test completion rate against schedule and count incidents closed without a reportability determination (target zero).

## EPS-03 — Internal Routines and Controls  {#eps-03-internal-routines-and-controls}

**WHY (Reg cite):** Comprehensive reviews and tests validating the controls that protect hardware, software, proprietary data, and electronic transmissions are required by the safeguarding-of-member-information standard in [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the operational-controls expectations of the FFIEC E-Banking / Retail Payment Systems booklets.

**SYSTEM BEHAVIOR:** Management maintains a range of comprehensive system reviews and tests validating the controls incorporated into each area protecting hardware, software, proprietary data, and electronic transmissions, and trains users to adhere to control standards. Control reviews open against a defined checklist, run, and close; any deficiency found opens a remediation track rather than closing the review. A clean review (no prior findings, no deficiency) closes directly. The control-review checklist and deficiency ratings are write-restricted to the AVP of Deposit Operations and audit personnel.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control review cycle opens (`eps.control_review.opened`) | Review checklist (`eps.control_review.checklist`), prior findings (`eps.control_review.prior_findings`) | Opened control-review record (`eps.control_review.opened`) | Internal cycle (enforced by `eps.control_review.due_at`) |
| Control review completed with results (`eps.control_review.completed`) | Deficiency-found flag (`eps.control_review.deficiency_found`), open deficiency list (`eps.deficiency.open_list`), deficiency rating (`eps.deficiency.rating`) | Completed review record (`eps.control_review.completed`) | Internal cycle (enforced by `eps.control_review.due_at`) |
| Deficiency identified requiring remediation (`eps.deficiency.remediation_opened`) | Deficiency description (`eps.deficiency.description`), open list (`eps.deficiency.open_list`) | Remediation track + emitted event (`eps.deficiency.remediation_opened`) | Internal SLA per rating (enforced by `eps.deficiency.remediation_due_at`) |

**ALERTS/METRICS:** Alert on remediation items aging past `eps.deficiency.remediation_due_at`; target zero overdue. Track control-review completion rate and the count of high-rated deficiencies open at month-end.

## EPS-04 — Management Supervision and Oversight  {#eps-04-management-supervision-and-oversight}

**WHY (Reg cite):** Active board and senior-management oversight of electronic banking risk, supported by periodic reporting, is required by [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) (board responsibility for the information security program) and the governance expectations of the FFIEC E-Banking booklet.

**SYSTEM BEHAVIOR:** Management and the Board stay actively involved, supported by the Electronic Banking Risk Assessment, a quarterly IT Committee, an IT Risk Assessment, an annually prepared IT Strategic Plan, an annual IT Audit, IT and Deposit Operations dashboards, and an Electronic Banking Summary, with periodic reports to the Board. The IT Committee files minutes each quarter; the IT Audit opens and issues a report annually; the Electronic Banking Summary and dashboards feed the quarterly board report. The board report package and the Electronic Banking Summary are write-restricted to Compliance and the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarterly IT Committee meets (`eps.it_committee.minutes_filed`) | IT Committee convened flag (`eps.it_committee.convened`), IT dashboard (`eps.dashboard.it`), Deposit Ops dashboard (`eps.dashboard.deposit_ops`) | Filed IT Committee minutes (`eps.it_committee.minutes_filed`) | Quarterly (no regulatory deadline) |
| Annual IT Audit issues its report (`eps.it_audit.report_issued`) | IT audit prior findings (`eps.it_audit.prior_findings`) | Issued IT audit report (`eps.it_audit.report_issued`) | Annually (enforced by `eps.it_audit.due_at`) |
| Quarterly board oversight report delivered (`eps.board_report.delivered`) | Electronic Banking Summary (`eps.summary.ebanking`), IT dashboard (`eps.dashboard.it`), Deposit Ops dashboard (`eps.dashboard.deposit_ops`) | Delivered board report (`eps.board_report.delivered`) | Quarterly (enforced by `eps.board_report.due_at`) |

**ALERTS/METRICS:** Alert if a quarter closes without filed IT Committee minutes or a delivered board report; target zero misses. Track IT Audit timeliness against `eps.it_audit.due_at` and dashboard-refresh latency.

## EPS-05 — Authentication Controls  {#eps-05-authentication-controls}

**WHY (Reg cite):** Layered, risk-based authentication on client-facing electronic banking services is required by the [FFIEC Authentication Guidance](https://www.ffiec.gov/) and the safeguarding standards of [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748); the underlying EFT services are also subject to [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005).

**SYSTEM BEHAVIOR:** The credit union requires user authentication on all client-facing electronic banking services, applying degrees of authentication in accordance with perceived risk as documented in Exhibit A and the Electronic Banking Authentication and Risk Assessment. Mechanisms include user ID/password/token for system access, tokens and dual control for higher-risk functions, IP and day/time restrictions, mobile device registration, and challenge questions. Repeated authentication failures past the threshold apply a lockout; Business Mobiliti access is a user-level setting enabled only on client request. Authentication rule configuration and risk-tier mapping are write-restricted to the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Client presents credentials at a payment channel (`eps.auth.decided`) | Credentials (`eps.auth.credentials`), device-registered flag (`eps.auth.device_registered`), challenge result (`eps.auth.challenged`), risk tier (`eps.auth.risk_tier`) | Authentication decision record (`eps.auth.decided`) | Real-time (no registered timer) |
| Failure threshold reached for a login (`eps.auth.lockout_applied`) | Failure count (`eps.auth.failure_count`), failure-threshold-reached flag (`eps.auth.failure_threshold_reached`) | Applied lockout record (`eps.auth.lockout_applied`) | Real-time (no registered timer) |
| Client requests enrollment in a payment service (`eps.client.enrollment_requested`) | Client onboarded flag (`eps.client.onboarded`), self-admin agreement (`eps.client.self_admin_agreement`), contacts (`eps.client.contacts`) | Enrolled client record (`eps.client.enrolled`) | At onboarding (no registered timer) |

**ALERTS/METRICS:** Alert on anomalous lockout spikes and on any client-facing payment service exposed without an authentication decision recorded; target zero. Track authentication-failure rate by channel and proportion of higher-risk functions gated by token/dual control.

## EPS-06 — Dual Control for High-Risk Processes  {#eps-06-dual-control-for-high-risk-processes}

**WHY (Reg cite):** Dual control and enhanced access on higher-risk payment processes implement the access-control and segregation expectations of [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the FFIEC Retail Payment Systems / Wholesale Payment Systems guidance; ACH origination warranties and exposure limits are governed by the [NACHA Operating Rules](https://www.nacha.org/rules), and wire settlement by [Federal Reserve / Fedwire and SWIFT operating rules](https://www.frbservices.org/resources/rules-regulations/operating-circulars.html).

**SYSTEM BEHAVIOR:** Higher-risk electronic processes require dual controls or enhanced system access as documented in Exhibit B. For ACH origination, dual control is recommended for clients originating over $50,000, with client/user exposure limits and template restrictions assigned; for wire transfers, dual control or offline callback approval with PIN is required, plus daily/periodic limits and predefined templates; for internal Fedwire/SWIFT and item processing, ID/passcode/token plus an additional release PIN, registered-IP and day/time restrictions, and two employees are required to originate a wire. An outgoing wire cannot be released until both the release PIN and a second approval are recorded and the originating IP is verified. Exposure limits, template definitions, and the wire release PIN are write-restricted to the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Outgoing wire release requested (`eps.wire.release_requested`) | Originator identity (`eps.wire.originator_id`), release PIN (`eps.wire.release_pin`), second approval (`eps.wire.second_approval`), client daily limit (`eps.client.wire_daily_limit`) | Released wire record (`wire_transfer.submitted`) | Real-time, before release (no registered timer) |
| Originating IP verified for a wire (`eps.wire.ip_verified`) | Originator identity (`eps.wire.originator_id`) | IP-verification record (`eps.wire.ip_verified`) | Real-time, before release (no registered timer) |
| Client requests an ACH/wire limit change (`eps.client.limit_change_requested`) | ACH exposure limit (`eps.client.ach_exposure_limit`), template-only flag (`eps.client.ach_template_only`), limit-change justification (`eps.limit_change.justification`), approver (`eps.limit_change.approver_id`) | Applied limit change (`eps.client.limit_changed`) | Real-time (no registered timer) |

**ALERTS/METRICS:** Target zero wires released without both PIN and second approval and IP verification. Alert on single-employee wire-origination attempts and on ACH originations above $50,000 lacking dual control; track limit-change volume and exception rationale completeness.

## EPS-07 — Electronic Fraud Protection Systems  {#eps-07-electronic-fraud-protection-systems}

**WHY (Reg cite):** Offering and monitoring fraud tools to protect member accounts supports the safeguarding and detection standards of [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the FFIEC Retail Payment Systems guidance on fraud controls; card disputes on these channels are subject to [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005).

**SYSTEM BEHAVIOR:** The credit union offers and monitors Check Positive Pay, Premium Positive Pay (with ACH monitoring), and card controls (debit-card on/off, limits, and transaction-type settings), and continually monitors fraud trends. Client card-control settings do not override institution-defined card limits and do not bypass the EnFact card-monitoring process. Positive Pay exception items must receive a pay/return decision by the same-banking-day cutoff; an undecided exception defaults per the client's standing instruction. Card-control institution limits and the fraud-trend review are write-restricted to the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Suspect item presented against an issue file (`eps.pospay.exception_presented`) | Issue file (`eps.pospay.issue_file`), presented item (`eps.pospay.presented_item`) | Pay/return exception decision (`eps.pospay.exception_decided`) | Same banking day (enforced by `eps.pospay.decision_due_at`) |
| Client applies or changes a card control (`eps.card_control.changed`) | Institution limits (`eps.card.institution_limits`), card fraud score (`eps.card.fraud_score`) | Applied card-control record (`eps.card_control.applied`) | Real-time (no registered timer) |
| Periodic fraud-trend review run (`eps.fraud_trend_review.completed`) | Industry alerts (`eps.fraud.industry_alerts`), loss data (`eps.fraud.loss_data`) | Fraud-trend review report (`eps.fraud_trend_review.completed`) | Periodic (no registered timer) |

**ALERTS/METRICS:** Alert on Positive Pay exceptions approaching the same-day cutoff undecided; target zero missed cutoffs. Track card-control adoption, suppressed-fraud loss avoided, and any card-control setting attempting to exceed institution limits (target zero).

## EPS-08 — Vendor Due Diligence  {#eps-08-vendor-due-diligence}

**WHY (Reg cite):** Due diligence and ongoing oversight of third parties that design, implement, and service payment technologies, with board/senior-management retained responsibility, is required by [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and NCUA third-party guidance; SOC reports and encryption requirements evidence the safeguarding controls expected of payment vendors.

**SYSTEM BEHAVIOR:** Management performs due diligence on the vendors (Fiserv, Jack Henry, and others) that design, implement, and service payment technologies, including annual review of hosting-provider SOC 1 Type II and SOC 2 Type II reports and encryption requirements; the enterprise third-party oversight program detail lives in the Third-Party Risk Policy and the Information Technology Cyber Security Policy and is referenced rather than restated. The Board and senior management remain responsible for vendor performance. A high-severity vendor issue is escalated rather than closed in the review cycle. SOC reports and the vendor due-diligence summary are write-restricted to Compliance and the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor due-diligence cycle opens (`eps.vendor.dd_cycle_opened`) | Vendor identifier (`eps.vendor.id`), DD summary (`eps.vendor.dd_summary`), CUEC list (`eps.vendor.cuec_list`) | Completed DD record (`eps.vendor.dd_completed`) | Annually (enforced by `eps.vendor.dd_due_at`) |
| Annual SOC 1/SOC 2 report received (`eps.vendor.soc1_received`) | SOC 1 report (`eps.vendor.soc1_report`), encryption requirements (`eps.vendor.encryption_reqs`) | Reviewed SOC record (`eps.vendor.soc1_reviewed`) | Within 60 days of receipt (enforced by `eps.vendor.soc1_due_at`) |
| High-severity vendor issue identified (`eps.vendor.issue_escalated`) | Issue identified flag (`eps.vendor.issue_identified`), issue severity (`eps.vendor.issue_severity`), issue description (`eps.vendor.issue_description`) | Escalated vendor issue record (`eps.vendor.issue_escalated`) | Internal SLA per severity (no registered timer) |

**ALERTS/METRICS:** Alert on SOC reviews aging past `eps.vendor.soc1_due_at` and on overdue annual due-diligence cycles; target zero. Track count of open high-severity vendor issues and vendor performance-metric breaches.

## EPS-09 — Expertise and Training  {#eps-09-expertise-and-training}

**WHY (Reg cite):** Training of employees and clients and adequate backup for critical staff implement the security-awareness and personnel expectations of [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the FFIEC E-Banking booklet's guidance on expertise, training, and member education on fraud.

**SYSTEM BEHAVIOR:** Management provides employee training (technical coursework, conferences, working groups) and ensures adequate backup for critical staff, and provides client training and resource guides at onboarding, annual education and self-certification where applicable, and periodic phishing/online-fraud communications. The employee training cycle and the annual client education cycle open on schedule; clients in applicable categories complete self-certification, and non-applicable clients are exempt from the self-cert requirement. Self-certification forms and the staffing backup map are write-restricted to the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee training cycle opens (`eps.training.employee_cycle_opened`) | Employee training plan (`eps.training.employee_plan`), critical roles (`eps.staffing.critical_roles`), backup map (`eps.staffing.backup_map`) | Employee training completion record (`eps.training.employee_completed`) | Per cycle (enforced by `training.annual_due_at`) |
| Annual client education cycle opens (`eps.training.annual_cycle_opened`) | Guide version (`eps.training.guide_version`), education-applicable flag (`eps.client.education_applicable`), self-cert form (`eps.training.self_cert_form`) | Client training delivered + self-cert record (`eps.training.client_delivered`, `eps.training.self_cert_completed`) | Annually (enforced by `eps.training.self_cert_due_at`) |
| Periodic phishing/fraud communication sent (`eps.training.fraud_comm_sent`) | Guide version (`eps.training.guide_version`) | Logged fraud communication (`eps.training.fraud_comm_logged`) | Periodic (no registered timer) |

**ALERTS/METRICS:** Alert on incomplete self-certifications past `eps.training.self_cert_due_at` and incomplete employee training past `training.annual_due_at`; target 100% completion. Track critical-role coverage gaps (target zero) and phishing-communication cadence.

## EPS-10 — Pre-Deployment Testing  {#eps-10-pre-deployment-testing}

**WHY (Reg cite):** Validating that equipment and systems function and interoperate before deployment — with vendors included in testing — supports the change-management and operational-integrity expectations of [NCUA 12 CFR Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the FFIEC Retail Payment Systems guidance on pre-implementation testing.

**SYSTEM BEHAVIOR:** Management validates that equipment and systems function properly and interoperate with existing technology before deployment, including vendors in the testing process. Test results are recorded and signed off before a deployment is scheduled; a deployment cannot proceed on unresolved high-severity defects unless a documented risk acceptance is recorded. Emergency exceptions to pre-deployment testing require documented justification and a retro-test afterward. Test sign-off and risk-acceptance records are write-restricted to the AVP of Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Pre-deployment test executed (`eps.test.results_recorded`) | Test plan (`eps.test.plan`), interop scope (`eps.test.interop_scope`), vendor test participation (`eps.vendor.test_participation`), defects (`eps.test.defects`) | Recorded test results + sign-off (`eps.test.results_recorded`, `eps.test.signed_off`) | Before deployment (no registered timer) |
| Deployment scheduled after sign-off (`eps.deployment.scheduled`) | Results signed-off (`eps.test.signed_off`), risk acceptance (`eps.test.risk_acceptance`), emergency exception (`eps.deployment.emergency_exception`) | Scheduled deployment record (`eps.deployment.scheduled`) | After sign-off (no registered timer) |
| Emergency-exception deployment retro-tested (`eps.test.retro_completed`) | Emergency exception (`eps.deployment.emergency_exception`), change rollback plan (`eps.change.rollback_plan`) | Retro-test completion record (`eps.test.retro_completed`) | Internal SLA after deployment (enforced by `eps.test.retro_due_at`) |

**ALERTS/METRICS:** Alert on any deployment scheduled without recorded sign-off; target zero. Track emergency-exception deployments and retro-test completion against `eps.test.retro_due_at`, and open high-severity defects at go-live.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Governance of these controls is centralized with the CCO.
- **Ultimate operational responsibility:** Assistant Vice President of Deposit Operations, designated as ultimately responsible for assessing risks and implementing procedures.
- **Required participants:** IT Committee (quarterly) and Enterprise Risk Management Committee; audit personnel verify the internal control structure across all electronic banking areas.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual (next review one year from the effective date), or upon material change to a payment channel, vendor, or applicable regulation.
- **Cross-references:** E-Commerce Policy (consumer-channel governance), Information Security Policy (cybersecurity/IT general controls/encryption), Third-Party Risk Policy (vendor onboarding and ongoing oversight), Enterprise Risk Management Policy (risk appetite/taxonomy/scoring), Business Continuity Plan Policy (BCP/DR program detail). Detailed risk and control mappings live in the Electronic Banking Risk Assessment, the Electronic Banking Authentication and Risk Assessment (Exhibit A), and the dual-control inventory (Exhibit B).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is partially provisional.** Most `eps.*` fields and events referenced in the control overlays are registered in the parsed core-vocabulary (`eps` entity and EPS event family). A subset are registered only as **provisional codes** with agreed target spelling and must be confirmed by engineering before next review: `eps.incident.id`, `eps.incident.severity`, `eps.incident.reportable_determined`, `eps.service.id`, `eps.vendor.id`, `eps.product_risk_analysis.id`, `eps.proposal.description`, `eps.risk_assessment.id`, `eps.limit_change.approver_id`, `eps.deficiency.description`, `eps.auth.risk_tier`, `eps.wire.released`, `eps.fraud_trend_review.report`, and the timer codes `eps.bcp_test.due_at`, `eps.board_report.due_at`, `eps.control_review.due_at`, `eps.it_audit.due_at`. Names used are the agreed target scheme.
- **Authentication and dual-control thresholds** (e.g., ACH dual-control recommendation at $50,000, lockout failure threshold) are carried from the reference policy's Exhibit A/B. The exact numeric limits and the per-channel risk-tier mapping are maintained in the Electronic Banking Authentication and Risk Assessment and were not re-derived here; confirm they remain current.
- **NCUA notification timing** for payment-system incidents is anchored to the §748 Appendix B response-program standard ("as soon as possible"); a specific internal SLA clock (`eps.incident.ncua_due_at`) is assumed but the precise hour target needs Compliance confirmation.
- **SOC review window** of 60 days after receipt is an assumed internal SLA (`eps.vendor.soc1_due_at`); confirm against the Third-Party Risk Policy's stated cycle, since that program owns the authoritative deadline.
- **Charter / regulatory applicability:** Pynthia is treated as an NCUA-regulated credit union, so Part 748 (not a bank GLBA 501(b) cite) anchors the safeguarding controls. FFIEC Authentication Guidance and the NACHA Operating Rules are cited as authoritative supervisory/industry standards rather than codified CFR sections; external links point to the issuing bodies. Confirm reporter/applicability status if any in-scope channel implicates HMDA or other regimes (none identified in scope).
- **Fedwire/SWIFT settlement** is governed by Federal Reserve operating circulars and SWIFT rules referenced generally; no specific clause is pinned because the controls here are access/dual-control controls, not settlement-rule controls.
- **Lockbox (TMR), Zelle, and bill payment (CheckFree)** are in scope as payment channels but are governed operationally through the same authentication (EPS-05), fraud-protection (EPS-07), and vendor-oversight (EPS-08) controls rather than channel-specific overlays; confirm no channel-specific control is required by the Electronic Banking Risk Assessment.
