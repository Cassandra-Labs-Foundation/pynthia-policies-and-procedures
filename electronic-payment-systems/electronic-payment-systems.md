---
title: Electronic Payment Systems Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Electronic Payment Systems, ACH, Wire, Fraud, Vendor Risk]
---

## General Policy Statement

Pynthia Credit Union segregates its electronic banking services into information-only systems, electronic information transfer systems, and electronic payment systems, and applies the most stringent risk management to electronic payment systems — ACH origination, wire transfer entry/approval and settlement (Fedwire, SWIFT), debit/ATM cards, retail and business online banking, bill payment, mobile and remote deposit capture, Zelle, and lockbox — because they carry the most significant operational (transaction) risk from fraud, error, and dependence on third-party vendors. The Credit Union commits to controls commensurate with that risk across seven critical elements: assessing risk, assigning accountability, active board management, ongoing testing and monitoring, training and education, internal controls, and planning for future developments. Governance is centralized with the Chief Compliance Officer, with the Assistant Vice President of Deposit Operations ultimately responsible for assessing risks and implementing procedures, supported by the IT Committee and Enterprise Risk Management Committee, and verified by audit personnel.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| New e-banking service proposed | Sponsor submits proposal study/design docs (`eps.proposal.submitted`) | Before deployment (ERM review) | Product Risk Analysis + 3-stage analysis | [EPS-01](#eps-01-planning-and-feasibility-analysis) |
| Suspected/confirmed payment incident | Reportable incident determined (`eps.incident.reportable_determined`) | 72 hours to NCUA | NCUA incident notification | [EPS-02](#eps-02-incident-planning-and-preparedness) |
| Client requests higher-risk EPS access/limit | Limit/enrollment change requested (`eps.client.limit_change_requested`) | At provisioning (internal: 2 BD) | Authentication degree per Exhibit A | [EPS-05](#eps-05-authentication-controls) |
| Outgoing wire release requested | Wire release requested (`eps.wire.release_requested`) | Real-time, before release | Dual control + PIN + IP/time per Exhibit B | [EPS-06](#eps-06-dual-control-for-high-risk-processes) |
| Positive Pay exception presented | Item presented for decision (`eps.pospay.exception_presented`) | Same business day (per cutoff) | Positive Pay exception decision | [EPS-07](#eps-07-electronic-fraud-protection-systems) |
| Vendor SOC report due | DD cycle opened (`eps.vendor.dd_cycle_opened`) | Annual | SOC 1 Type II / SOC 2 Type II review | [EPS-08](#eps-08-vendor-due-diligence) |
| Client self-certification due | Annual training cycle opened (`eps.training.annual_cycle_opened`) | Annual | Self-certification form | [EPS-09](#eps-09-expertise-and-training) |
| New/changed system pre-deployment | Deployment scheduled (`eps.deployment.scheduled`) | Before go-live | Interop test results + sign-off | [EPS-10](#eps-10-testing) |
| Quarterly board/committee oversight | IT Committee convened (`eps.it_committee.minutes_filed`) | Quarterly | E-Banking Summary + dashboards | [EPS-04](#eps-04-management-supervision-and-oversight) |
| Periodic internal control review | Control review opened (`eps.control_review.opened`) | Per review cycle | Control review checklist | [EPS-03](#eps-03-internal-routines-and-controls) |

## EPS-01 — Planning and Feasibility Analysis {#eps-01-planning-and-feasibility-analysis}

**WHY (Reg cite):** Safety-and-soundness governance of new electronic payment services is required under [NCUA Part 748 and Appendix A](https://www.ecfr.gov/current/title-12/part-748) (member-information safeguards and operational systems) and reflects FFIEC E-Banking risk-management expectations that new services be assessed before deployment. Commensurate-with-risk product review supports the Credit Union's safe introduction of payment channels.

**SYSTEM BEHAVIOR:** Each proposal for a new electronic banking service is analyzed in three stages — study (needs, objectives, alternatives), design and development (best solution installed; policies, procedures, documentation completed), and operation (proper operation and maintenance). A Product Risk Analysis form is drafted and presented to the Enterprise Risk Management Committee, which decides whether the service proceeds; only an ERM-approved service is added to the Electronic Banking Risk Assessment and activated. Proposals with no payment-system component still pass through study but are routed to the lighter information-transfer review path described in scope. Product Risk Analysis drafting and ERM decision authority are write-restricted to Compliance and the ERM Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Sponsor submits a new-service proposal (`eps.proposal.submitted`) | Proposal sponsor (`eps.proposal.sponsor`), study doc (`eps.proposal.study_doc`), design docs (`eps.proposal.design_docs`) | Logged proposal + product risk analysis drafted (`eps.product_risk_analysis.drafted`) | Before ERM review (internal: 10 BD to draft) |
| ERM Committee reviews the proposal (`eps.erm_review.convened`) | Drafted product risk analysis (`eps.product_risk_analysis.drafted`), risk delta (`eps.risk_assessment.delta`) | ERM decision recorded (`eps.erm_review.decided`) | Before deployment |
| Approved service added to risk assessment (`eps.risk_assessment.service_added`) | Service id (`eps.service.id`), risk delta (`eps.risk_assessment.delta`) | Service activated + Electronic Banking Risk Assessment updated (`eps.service.activated`) | Before go-live |

**ALERTS/METRICS:** Alert on any service activation (`eps.service.activated`) lacking a prior ERM decision; target zero unreviewed deployments; track median days from proposal submission to ERM decision.

## EPS-02 — Incident Planning and Preparedness {#eps-02-incident-planning-and-preparedness}

**WHY (Reg cite):** [NCUA Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a response program for unauthorized access to member information, and [NCUA Part 748.1(c)](https://www.ecfr.gov/current/title-12/part-748/section-748.1) requires notification to the NCUA of a reportable cyber incident as soon as possible and no later than 72 hours after reasonable belief one occurred. Business-continuity testing of key electronic banking services supports operational resilience.

**SYSTEM BEHAVIOR:** The Credit Union maintains a business continuity plan, procedures, and an incident response plan covering electronic-banking risks, with regular testing of key payment services (detailed program lives in the Business Continuity Plan Policy). When a payment-system incident is detected, it is opened, scoped, and assessed for reportability; if determined reportable, the NCUA 72-hour notification timer governs. Incidents linked to a third-party vendor are flagged for the vendor-incident track without duplicating the vendor program here. Reportability determination and NCUA notification are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Payment-system incident detected (`eps.incident.detected`) | Incident id (`eps.incident.id`), impact (`eps.incident.impact`), severity (`eps.incident.severity`), vendor linkage (`eps.incident.vendor_linked`) | Incident opened (`eps.incident.opened`) | Immediate (internal: triage same day) |
| Reportability determined (`eps.incident.reportable_determined`) | Severity (`eps.incident.severity`), member impact (`eps.incident.impact`) | NCUA notification sent (`eps.incident.ncua_notified`) | 72 hours (enforced by `eps.incident.ncua_due_at`) |
| BCP test scheduled for a key service (`eps.bcp_test.scheduled`) | Test scenario (`eps.bcp_test.scenario`), service id (`eps.service.id`) | BCP test completed (`eps.bcp_test.completed`) | Per BCP cycle (enforced by `eps.bcp_test.due_at`) |

**ALERTS/METRICS:** Aging alert on open `eps.incident.opened` approaching `eps.incident.ncua_due_at`; target zero 72-hour breaches; track BCP-test completion rate against scheduled key services.

## EPS-03 — Internal Routines and Controls {#eps-03-internal-routines-and-controls}

**WHY (Reg cite):** [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires administrative, technical, and physical safeguards protecting member information and the systems that process payments, validated through periodic review and testing. User adherence to control standards reflects FFIEC information-security and E-Banking expectations.

**SYSTEM BEHAVIOR:** Management maintains comprehensive system reviews and tests validating the controls protecting hardware, software, proprietary data, and electronic transmissions, and trains users to adhere to control standards. A control review is opened on cycle, deficiencies are recorded with remediation due dates, and remediation is tracked to closure. Cybersecurity, encryption, and IT general-control detail are governed by the Information Security Policy and are not duplicated here. Control-review opening and deficiency remediation tracking are write-restricted to Compliance and Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control review opened (`eps.control_review.opened`) | Review checklist (`eps.control_review.checklist`), prior findings (`eps.control_review.prior_findings`) | Control review completed (`eps.control_review.completed`) | Per review cycle (enforced by `eps.control_review.due_at`) |
| Deficiency found in review (`eps.control_review.completed` with `eps.control_review.deficiency_found`) | Deficiency description (`eps.deficiency.description`), rating (`eps.deficiency.rating`) | Remediation track opened (`eps.deficiency.remediation_opened`) | Per severity (enforced by `eps.deficiency.remediation_due_at`) |

**ALERTS/METRICS:** Aging alert on open deficiencies past `eps.deficiency.remediation_due_at`; target zero overdue high-rated deficiencies; track control-review completion against schedule.

## EPS-04 — Management Supervision and Oversight {#eps-04-management-supervision-and-oversight}

**WHY (Reg cite):** Active board and management oversight of electronic banking is an expectation of [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) safety-and-soundness governance and the FFIEC E-Banking booklet, which call for board-level reporting and risk monitoring of payment systems commensurate with risk.

**SYSTEM BEHAVIOR:** Management and the Board remain actively involved, supported by the Electronic Banking Risk Assessment, a quarterly IT Committee, an IT Risk Assessment, an annually prepared IT Strategic Plan, an annual IT Audit, IT and Deposit Operations dashboards, and an Electronic Banking Summary, with periodic reports to the Board. The IT Committee convenes quarterly and files minutes; the annual IT Audit opens, runs, and issues a report whose findings feed remediation under EPS-03. Enterprise risk appetite and scoring methodology live in the Enterprise Risk Management Policy and are not redefined here. Board-report delivery and IT Audit issuance are write-restricted to Compliance and Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| IT Committee convenes (`eps.it_committee.convened`) | IT dashboard (`eps.dashboard.it`), Deposit Ops dashboard (`eps.dashboard.deposit_ops`), E-Banking Summary (`eps.summary.ebanking`) | IT Committee minutes filed (`eps.it_committee.minutes_filed`) | Quarterly (internal: within 10 BD of meeting) |
| Annual IT Audit opened (`eps.it_audit.opened`) | Prior findings (`eps.it_audit.prior_findings`) | IT Audit report issued (`eps.it_audit.report_issued`) | Annual (enforced by `eps.it_audit.due_at`) |
| Periodic board reporting due (`eps.board_report.delivered`) | E-Banking Summary (`eps.summary.ebanking`), risk delta (`eps.risk_assessment.delta`) | Board report delivered + logged (`eps.board_report.delivered`) | Per board cadence (enforced by `eps.board_report.due_at`) |

**ALERTS/METRICS:** Alert when a quarter closes without filed IT Committee minutes or when `eps.board_report.due_at` lapses; target 100% on-time quarterly meetings and annual IT Audit issuance.

## EPS-05 — Authentication Controls {#eps-05-authentication-controls}

**WHY (Reg cite):** [FFIEC Authentication Guidance](https://www.ffiec.gov/) and [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) require layered authentication for client-facing electronic banking commensurate with risk; consumer EFT channels are also subject to [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005).

**SYSTEM BEHAVIOR:** The Credit Union requires user authentication on all client-facing electronic banking services, applying degrees of authentication in accordance with perceived risk as documented in Exhibit A and the Electronic Banking Authentication and Risk Assessment — user ID/password/token for system access, tokens and dual control for higher-risk functions, IP and day/time restrictions, mobile device registration, and challenge questions. On enrollment or limit/access change, the appropriate authentication degree is applied at provisioning; repeated authentication failures past threshold apply a lockout. Consumer-facing channel governance (enrollment, member experience, business rules) lives in the E-Commerce Policy. Authentication-tier assignment and limit changes are write-restricted to Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Client requests EPS enrollment (`eps.client.enrollment_requested`) | Self-admin agreement (`eps.client.self_admin_agreement`), risk tier (`eps.auth.risk_tier`), credentials (`eps.auth.credentials`) | Client enrolled with auth tier applied (`eps.client.enrolled`) | At provisioning (internal: 2 BD) |
| Client requests a limit/access change (`eps.client.limit_change_requested`) | Justification (`eps.limit_change.justification`), approver (`eps.limit_change.approver_id`), risk tier (`eps.auth.risk_tier`) | Limit changed + logged (`eps.client.limit_changed`) | At provisioning (internal: 2 BD) |
| Authentication decision evaluated at login (`eps.auth.decided`) | Credentials (`eps.auth.credentials`), device registration (`eps.auth.device_registered`), failure count (`eps.auth.failure_count`) | Lockout applied when threshold reached (`eps.auth.lockout_applied`) | Real-time (on `eps.auth.failure_threshold_reached`) |

**ALERTS/METRICS:** Alert on limit changes lacking an approver id; monitor authentication-failure and lockout rates by channel; target zero higher-risk functions provisioned without the required token/dual-control tier.

## EPS-06 — Dual Control for High-Risk Processes {#eps-06-dual-control-for-high-risk-processes}

**WHY (Reg cite):** Dual control and separation of duties over high-value payment origination are required under [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) and FFIEC Wholesale/Retail Payment Systems guidance; ACH origination carries originator warranties and exposure-limit obligations under the [NACHA Operating Rules](https://www.nacha.org/rules), and wire settlement is governed by [Fedwire](https://www.frbservices.org/) and SWIFT operating rules.

**SYSTEM BEHAVIOR:** Higher-risk electronic processes require dual controls or enhanced system access as documented in Exhibit B. For ACH origination, dual control is recommended for clients originating over $50,000, with client/user exposure limits and template restrictions assigned. For wire transfers, dual control or offline callback approval with PIN is required, plus daily/periodic limits and predefined templates. For internal Fedwire/SWIFT and item processing, ID/passcode/token, an additional PIN to release outgoing wires, registered-IP and day/time restrictions, and two employees to originate a wire are required. A wire release is blocked until the second approval and PIN are recorded and the IP is verified; a callback-approved offline wire substitutes the verified callback for the in-system second approver. Exposure-limit and template configuration and wire-release authority are write-restricted to Deposit Operations under separation of duties.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Outgoing wire release requested (`eps.wire.release_requested`) | Originator id (`eps.wire.originator_id`), release PIN (`eps.wire.release_pin`), second approval (`eps.wire.second_approval`), client daily limit (`eps.client.wire_daily_limit`) | Wire IP verified and release authorized (`eps.wire.ip_verified`) | Real-time, before release |
| ACH client enrolled/configured for origination (`eps.client.enrolled`) | ACH exposure limit (`eps.client.ach_exposure_limit`), template-only flag (`eps.client.ach_template_only`) | Exposure limits + template restriction applied (`eps.card_control.applied`) | At provisioning (internal: 2 BD) |
| Card/spend control change requested (`eps.client.limit_change_requested`) | Institution limits (`eps.card.institution_limits`), justification (`eps.limit_change.justification`) | Card control change applied (`eps.card_control.changed`) | Real-time |

**ALERTS/METRICS:** Alert on any wire release lacking `eps.wire.second_approval` or `eps.wire.ip_verified`; target zero single-approver wires; monitor ACH originations exceeding configured exposure limits and clients over $50k without dual control.

## EPS-07 — Electronic Fraud Protection Systems {#eps-07-electronic-fraud-protection-systems}

**WHY (Reg cite):** Fraud-mitigation tools for payment channels support member-information safeguards under [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) and consumer EFT protections under [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005); ongoing fraud monitoring reflects FFIEC Retail Payment Systems expectations.

**SYSTEM BEHAVIOR:** The Credit Union offers and monitors fraud tools including Check Positive Pay, Premium Positive Pay (with ACH monitoring), and card controls (debit-card on/off, limits, and transaction-type settings). Card-control client settings do not override institution-defined card limits and do not bypass the institution's card-monitoring (EnFact) process. Positive Pay exceptions are presented to the client for a same-day decision against the cutoff; an undecided exception at cutoff follows the configured default-pay/return rule. Fraud trends are reviewed periodically and feed tool tuning. Card-control settings that would weaken institution limits are blocked at apply time. Institution card-limit definitions and fraud-monitoring configuration are write-restricted to Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Positive Pay exception presented (`eps.pospay.exception_presented`) | Issue file (`eps.pospay.issue_file`), presented item (`eps.pospay.presented_item`) | Exception decision recorded (`eps.pospay.exception_decided`) | Same business day (enforced by `eps.pospay.decision_due_at`) |
| Card control applied/changed by client (`eps.card_control.changed`) | Institution limits (`eps.card.institution_limits`), fraud score context (`eps.card.fraud_score`) | Card control applied within institution limits (`eps.card_control.applied`) | Real-time |
| Periodic fraud-trend review (`eps.fraud_trend_review.completed`) | Industry alerts (`eps.fraud.industry_alerts`), loss data (`eps.fraud.loss_data`) | Fraud-trend review completed + logged (`eps.fraud_trend_review.completed`) | Periodic (internal: quarterly) |

**ALERTS/METRICS:** Alert on Positive Pay exceptions approaching `eps.pospay.decision_due_at`; target zero card-control changes that breach institution limits; track fraud-trend review cadence and emerging-pattern counts.

## EPS-08 — Vendor Due Diligence {#eps-08-vendor-due-diligence}

**WHY (Reg cite):** Third-party oversight of payment-technology vendors is required under [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) and NCUA/FFIEC third-party risk-management guidance; the Board and senior management remain responsible for vendor performance.

**SYSTEM BEHAVIOR:** Management performs due diligence on the third-party vendors that design, implement, and service payment technologies (program detail in the Information Technology Cyber Security Policy and the Third-Party Risk Policy), including annual review of hosting-provider SOC 1 Type II and SOC 2 Type II reports and encryption requirements. A DD cycle is opened annually; the SOC report is received and reviewed, and any vendor issue is escalated to the responsible owner. The Board and senior management retain responsibility for vendor performance. Vendor onboarding and the enterprise third-party oversight program are governed elsewhere and not duplicated here. DD-cycle disposition and SOC review sign-off are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual vendor DD cycle opened (`eps.vendor.dd_cycle_opened`) | Vendor id (`eps.vendor.id`), DD summary (`eps.vendor.dd_summary`), encryption requirements (`eps.vendor.encryption_reqs`) | DD completed + logged (`eps.vendor.dd_completed`) | Annual (enforced by `eps.vendor.dd_due_at`) |
| SOC report received (`eps.vendor.soc1_received`) | SOC 1/2 report (`eps.vendor.soc1_report`), performance metrics (`eps.vendor.performance_metrics`) | SOC report reviewed (`eps.vendor.soc1_reviewed`) | Annual (enforced by `eps.vendor.soc1_due_at`) |
| Vendor issue identified (`eps.vendor.issue_identified`) | Issue description (`eps.vendor.issue_description`), severity (`eps.vendor.issue_severity`) | Vendor issue escalated (`eps.vendor.issue_escalated`) | Per severity (internal: 5 BD for high) |

**ALERTS/METRICS:** Aging alert on DD cycles or SOC reviews past `eps.vendor.dd_due_at` / `eps.vendor.soc1_due_at`; target 100% annual SOC 1 Type II and SOC 2 Type II reviews for hosted payment channels; track open high-severity vendor issues.

## EPS-09 — Expertise and Training {#eps-09-expertise-and-training}

**WHY (Reg cite):** Trained personnel and informed members are required safeguards under [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) and reflect FFIEC E-Banking expectations; member phishing and fraud awareness supports consumer EFT protection under [Regulation E, 12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005).

**SYSTEM BEHAVIOR:** The Credit Union provides employee training (technical coursework, conferences, working groups) and ensures adequate backup for critical staff, and provides client training and resource guides at onboarding, annual education and self-certification where applicable, and periodic communications on phishing and online fraud. Employee and client training cycles open annually; client self-certification is tracked to completion where applicable; phishing/fraud communications are sent and logged periodically. Where a client is not in an education-applicable category, self-certification is not required and the cycle closes as not-applicable. Training-cycle administration and self-cert tracking are write-restricted to Compliance and Deposit Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opened (`eps.training.annual_cycle_opened`) | Guide version (`eps.training.guide_version`), education-applicable flag (`eps.client.education_applicable`), self-cert form (`eps.training.self_cert_form`) | Client training delivered + self-cert completed (`eps.training.client_delivered`, `eps.training.self_cert_completed`) | Annual (enforced by `eps.training.self_cert_due_at`) |
| Employee training cycle opened (`eps.training.employee_cycle_opened`) | Employee plan (`eps.training.employee_plan`), critical roles (`eps.staffing.critical_roles`), backup map (`eps.staffing.backup_map`) | Employee training completed + logged (`eps.training.employee_completed`) | Annual (internal: cycle close) |
| Periodic phishing/fraud communication sent (`eps.training.fraud_comm_sent`) | Communication content (`eps.training.guide_version`) | Fraud communication logged (`eps.training.fraud_comm_logged`) | Periodic (internal: quarterly) |

**ALERTS/METRICS:** Aging alert on applicable clients past `eps.training.self_cert_due_at`; target full self-cert completion among education-applicable clients; flag critical roles without a backup in `eps.staffing.backup_map`.

## EPS-10 — Testing {#eps-10-testing}

**WHY (Reg cite):** Pre-deployment validation and interoperability testing of payment systems support operational-risk control under [NCUA Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) and FFIEC change-management/E-Banking expectations that systems function properly before live use.

**SYSTEM BEHAVIOR:** Management validates that equipment and systems function properly and interoperate with existing technology before deployment, including vendors in the testing process. A deployment is scheduled, the test plan runs against the interop scope, results are recorded with any defects, and a sign-off gates go-live; a post-deployment retrospective is completed on schedule. An emergency change deployed under exception still requires a documented risk acceptance and a retrospective. Test sign-off and emergency-exception approval are write-restricted to Deposit Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Deployment scheduled (`eps.deployment.scheduled`) | Test plan (`eps.test.plan`), interop scope (`eps.test.interop_scope`), vendor participation (`eps.vendor.test_participation`) | Test results recorded + sign-off (`eps.test.results_recorded`) | Before go-live |
| Defects found or emergency exception used (`eps.deployment.scheduled` with `eps.deployment.emergency_exception`) | Defects (`eps.test.defects`), risk acceptance (`eps.test.risk_acceptance`) | Retro completed + logged (`eps.test.retro_completed`) | Per retro SLA (enforced by `eps.test.retro_due_at`) |

**ALERTS/METRICS:** Alert on go-lives lacking a recorded sign-off (`eps.test.signed_off`); target zero unsigned deployments; track emergency-exception count and on-time retrospective completion against `eps.test.retro_due_at`.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — centralized governance of all controls in this policy.
- **Ultimately responsible for execution:** Assistant Vice President of Deposit Operations — assessing risks and implementing procedures.
- **Required participants:** IT Committee (quarterly) and Enterprise Risk Management Committee (new-service review); audit personnel verify the internal control structure.
- **Approval:** Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual (next review 2027-06-16) or upon material change to payment channels, vendors, or applicable regulation.
- **Cross-references:** E-Commerce Policy (consumer channel governance), Information Security Policy (cybersecurity/encryption/IT general controls), Third-Party Risk Policy (vendor onboarding/oversight program), Enterprise Risk Management Policy (risk appetite/taxonomy/scoring), Business Continuity Plan Policy (BCP/DR program detail). Control deadlines are consolidated in the [Timing Matrix](#timing-matrix).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The `eps.*` fields, events, and timers referenced throughout the control overlays (e.g., `eps.proposal.submitted`, `eps.incident.ncua_due_at`, `eps.wire.release_requested`, `eps.vendor.soc1_due_at`, `eps.training.self_cert_due_at`) appear in the DESIGN_NOTES `eps` entity and event/timer registries and are used verbatim; a handful of supporting concepts cited in *What's needed* (e.g., `eps.product_risk_analysis.id`, `eps.proposal.description`, `eps.fraud_trend_review.report`, `eps.wire.released`, `eps.risk_assessment.id`) are listed only under Provisional codes and will be confirmed by engineering before the next review.
- **Charter / NCUA applicability.** Pynthia Credit Union is treated as a federally insured credit union subject to NCUA Part 748 and Appendix A/B; if the charter or insurer differs, the WHY citations and the EPS-02 72-hour NCUA notification timer must be re-confirmed.
- **Reg E and Reg CC reach.** Regulation E (consumer EFT/error resolution) and Regulation CC (mobile/remote deposit funds availability) touch several in-scope channels but their detailed error-resolution and funds-availability controls are assumed governed by the Deposit Account / E-Commerce policies; only their authentication- and fraud-relevant aspects are anchored here. Confirm whether any error-resolution control belongs in this policy.
- **NACHA / Fedwire / SWIFT operating rules.** ACH exposure-limit and wire-settlement obligations are anchored in EPS-06 at a control level; the specific operating-rule citations (NACHA Rules sections, Fedwire/SWIFT terms) are referenced generically and assumed maintained in operational procedures rather than restated here.
- **Positive Pay cutoff default.** EPS-07 assumes a configured default-pay-or-return rule for Positive Pay exceptions undecided at cutoff; the actual default and cutoff time need confirmation from Deposit Operations procedures.
- **Dual-control threshold.** The $50,000 ACH dual-control recommendation and per-client wire/daily limits are carried from the reference policy's Exhibits A/B; confirm these thresholds remain current and whether dual control should be mandatory (not merely recommended) above the threshold.
- **Information-only systems.** The public website (information-only category) is in declared scope but carries no payment-system control; it is intentionally not anchored to a control and is covered by the General Policy Statement and the E-Commerce/Information Security policies.
