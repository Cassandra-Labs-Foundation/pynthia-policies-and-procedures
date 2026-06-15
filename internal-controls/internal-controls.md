---
title: Internal Controls Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Internal Controls, Segregation of Duties, Reconciliation, Governance]
---

## General Policy Statement

Pynthia Credit Union maintains a documented system of internal controls — segregation of duties, authorization limits, reconciliations, access and change controls, exception/override management, monitoring, and tamper-evident audit trails — designed to provide reasonable assurance that assets are safeguarded, financial reporting is reliable, and operations comply with applicable laws and regulations. This policy applies to all operational and financial processes, business units, employees, and supporting systems, including activities performed by third-party service providers on the credit union's behalf. Information-security technical controls, enterprise risk appetite, audit execution scope, BSA/AML program controls, vendor control assurance, and general record-retention schedules are governed by their respective policies and are out of scope here except where this framework assigns control ownership.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Control framework annual review | Framework review window opens (`control.framework_review_due_at`) | Annually | Approved framework + owner assignments | [IC-01](#ic-01--control-environment-and-governance) |
| Incompatible-duty grant attempted | Access grant would create SoD conflict (`sod.conflict_detected`) | Real-time (block at grant) | SoD matrix + violation log | [IC-02](#ic-02--segregation-of-duties) |
| High-risk transaction initiated | Transaction flagged dual-control (`transaction.approval_recorded`) | Before execution | Authority matrix + approval record | [IC-03](#ic-03--authorization-and-approval-limits) |
| Daily cash / high-volume recon | Recon timer fires (`recon.daily_due`) | Daily (by EOD next BD) | Completed recon + aged-item escalation | [IC-04](#ic-04--reconciliations) |
| Monthly GL / subsidiary recon | Recon timer fires (`recon.monthly_due`) | Monthly | Completed recon + aged-item escalation | [IC-04](#ic-04--reconciliations) |
| Entitlement review cycle | Review window opens (`access.review_due`) | Annually / on role change | Access review attestation | [IC-05](#ic-05--access-and-change-controls) |
| Change to financial system / control config | RFC submitted (`change.rfc_submitted`) | Before deployment | CAB decision + deployment record | [IC-05](#ic-05--access-and-change-controls) |
| Control override invoked | Override recorded (`control.override_invoked`) | At invocation; senior approval for above-limit | Override record + senior decision | [IC-06](#ic-06--exception-and-override-management) |
| Self-assessment cycle | CSA cycle opens (`csa.cycle_opened`) | Per cycle | CSA results + deficiency tracking | [IC-07](#ic-07--monitoring-and-self-assessment) |
| Deficiency identified | Deficiency logged (`deficiency.logged`) | Remediation plan per SLA | Tracked finding to closure | [IC-07](#ic-07--monitoring-and-self-assessment) |
| Quarterly board / SC report | Quarterly reporting timer fires (`reporting.quarterly_due`) | Quarterly | Board/SC control report | [IC-07](#ic-07--monitoring-and-self-assessment) |
| Control event / transaction logged | Event emitted (`record.created`) | Real-time; retained per schedule | Tamper-evident audit entry | [IC-08](#ic-08--audit-trail-and-recordkeeping) |

## IC-01 — Control Environment and Governance

**WHY (Reg cite):** The Supervisory Committee must ensure internal controls are established and effectively maintained ([FCU Act 12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)), supported by an internal-control structure for the annual audit ([NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) and adequate internal controls and recordkeeping as a condition of insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

**SYSTEM BEHAVIOR:** The credit union maintains a control framework register that assigns a named owner to each material process and is approved by the board, reviewed at least annually. A review timer drives the annual re-approval; lapsed reviews escalate to the CCO and Supervisory Committee. When a control owner role becomes vacant, the framework register flags the gap and starts a vacancy timer so reassignment is forced. Board and Supervisory Committee oversight is evidenced through recorded meeting minutes and delivered control reports. The control framework register and owner assignments are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual framework review window opens (`control.framework_review_due_at`) | Current framework register (`control.register`), process owner map (`policy.raci_registry`), prior approval (`policy.board_approved_at`) | Re-approved framework + board resolution (`control.framework_approved`) | Annually (internal: complete within review window; enforced by `control.framework_review_due_at`) |
| Material process onboarded or owner reassigned (`control.owner_assigned`) | Process identifier (`process.id`), owner identity (`risk.owner_id`), framework register (`control.register`) | Owner assignment recorded (`control.owner_assigned`) | At assignment (internal: 5 BD) |
| Control owner role vacated (`control.owner_vacated`) | Vacancy reason (`control.vacancy_reason`), vacancy timer (`control.owner_vacancy_timer`) | Reassignment task + escalation logged (`escalation.created`) | Per vacancy timer (`control.owner_vacancy_timer`) |
| Board/SC oversight review held (`board.audit_review_recorded`) | Meeting date (`board.meeting_date`), control report package (`board.package_distributed`) | Minutes recorded (`board.minutes_recorded`) | Per board cadence (internal: each scheduled meeting) |

**ALERTS/METRICS:** Aging alert when the framework review passes its due date with target zero overdue; count of material processes with no assigned owner (target zero); and time-to-reassignment distribution for vacated control-owner roles.

## IC-02 — Segregation of Duties

**WHY (Reg cite):** Sound internal controls preventing any one person from controlling all phases of a transaction are required for insurability ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and form the control structure the Supervisory Committee must maintain ([FCU Act 12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b); [NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** A versioned SoD matrix defines incompatible-duty combinations across initiation, authorization, custody, recording, and reconciliation. At entitlement grant the system checks the requested role against the matrix and blocks any grant that would create a conflict, logging the attempted violation. Where separation is operationally impractical, an approved compensating control (e.g., job rotation or supervisory review) may be registered against the conflict; the compensating control requires documented approval before the otherwise-blocked grant proceeds. The SoD matrix and compensating-control approvals are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Entitlement grant would create incompatible duties (`sod.conflict_detected`) | Requested role (`access.role_id`), role entitlements (`access.role_entitlements`), SoD matrix version (`sod.matrix_version`) | Grant blocked + violation logged (`sod.violation_logged`) | Real-time (block at grant) |
| Compensating control proposed for an unavoidable conflict (`sod.compensating_control_proposed`) | Compensating control description (`sod.compensating_control`), risk rationale (`sod.risk_rationale`), approver identity (`access_right.approved_by`) | Approval decision recorded (`sod.compensating_control_approved`) | Before grant proceeds (internal: 5 BD) |
| SoD matrix periodic review timer fires (`sod.review_timer`) | Current matrix (`sod.matrix_version`), prior check results (`sod.check_result`) | Updated matrix version (`access_review.completed`) | Annually (enforced by `sod.review_timer`) |

**ALERTS/METRICS:** Count of blocked grant attempts (trend monitored for spikes), target zero un-reviewed compensating controls, and number of active SoD exceptions without a registered compensating control (target zero).

## IC-03 — Authorization and Approval Limits

**WHY (Reg cite):** Documented authorization and approval controls are part of the sound business practices and internal-control structure required for insurability ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and the controls the Supervisory Committee must ensure are maintained ([FCU Act 12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)).

**SYSTEM BEHAVIOR:** A role-based authority matrix defines transaction and approval limits by role. Transactions above a role's limit require documented approval before execution, and transactions designated high-risk require dual control (two distinct approvers). The system gates execution until the required approval(s) are recorded; an approval timer flags transactions awaiting authorization. Changes to the authority matrix require finance concurrence and documented rationale. The authority matrix is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Transaction initiated above role limit (`transaction.approval_recorded`) | Initiator (`transaction.initiated_by`), amount (`transaction.amount`), approval flag (`transaction.approval_required`), authority matrix (`authority_matrix.role_limits`) | Approval record gating execution (`transaction.approval_recorded`) | Before execution (internal: per `transaction.approval_timer`) |
| High-risk transaction requires dual control (`transaction.dual_control_completed`) | Dual-control flag (`transaction.dual_control_required`), first/second approver identities (`access.role_id`) | Dual-control completion logged (`transaction.dual_control_completed`) | Before execution (internal: per `transaction.approval_timer`) |
| Authority matrix change proposed (`authority.matrix_change_proposed`) | Change rationale (`authority.change_rationale`), finance concurrence (`authority.finance_concurrence`), matrix entry (`authority.matrix_entry`) | Updated authority matrix (`authority.matrix_updated`) | Before effect (internal: 5 BD) |

**ALERTS/METRICS:** Count of executions attempted without required approval (target zero), aging of transactions stalled awaiting approval against the approval timer, and dual-control completion rate for designated high-risk transactions (target 100%).

## IC-04 — Reconciliations

**WHY (Reg cite):** Timely reconciliation of ledgers and clearing/suspense accounts is part of the recordkeeping and internal-control adequacy required for insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and supports the verification structure underpinning the Supervisory Committee audit ([NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** The system reconciles general ledger, subsidiary ledgers, and suspense/clearing accounts on a defined cadence — daily for cash and high-volume accounts, monthly for others — driven by recon timers. Reconciling items are aged; items exceeding the defined aging threshold are escalated to a named owner and must be resolved within defined timeframes. Cash-suspense items have their own aging timer and escalate independently. Reconciliation records and aged-item dispositions are write-restricted to Finance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Daily cash / high-volume recon timer fires (`recon.daily_due`) | Account balances (`gl.balances`), recon items (`recon.item`) | Completed daily recon (`recon.daily_completed`) | Daily (internal: by EOD next BD; enforced by `recon.daily_due`) |
| Monthly GL / subsidiary recon timer fires (`recon.monthly_due`) | Trial balance (`gl.trial_balance`), subsidiary balances (`gl.balances`) | Completed monthly recon (`recon.monthly_completed`) | Monthly (enforced by `recon.monthly_due`) |
| Reconciling item exceeds aging threshold (`recon.item_aged`) | Item age (`recon.item_age_days`), item owner (`recon.item_owner`), aging timer (`recon.item_aging_timer`) | Aged item escalated (`recon.item_escalated`) | Per aging threshold (enforced by `recon.item_aging_timer`) |
| Aged reconciling item resolved (`recon.item_resolved`) | Research notes (`cash.recon.research_notes`), variance detail (`cash.recon.variance`) | Resolution logged (`recon.item_resolved`) | Within defined resolution timeframe (internal: per item aging SLA) |
| Cash-suspense item aged (`gl.cash_suspense.escalated`) | Suspense item (`gl.cash_suspense.item`), aging timer (`gl.cash_suspense.aging_timer`) | Suspense escalation logged (`gl.cash_suspense.escalated`) | Per suspense aging threshold (enforced by `gl.cash_suspense.aging_timer`) |

**ALERTS/METRICS:** Aging alert for reconciling items past threshold (target zero unresolved beyond SLA), recon completion rate against daily/monthly timers (target 100% on-time), and cash over/short variance trend monitored for anomalies.

## IC-05 — Access and Change Controls

**WHY (Reg cite):** Least-privilege provisioning, periodic entitlement review, and controlled changes to financial systems are part of the internal-control and recordkeeping adequacy required for insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)); security-program controls over records are required by [NCUA 12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748). Technical/logical security controls are governed by the Information Security Policy; this control covers entitlement governance and change-management approval over financial systems and control configurations.

**SYSTEM BEHAVIOR:** Access is provisioned on least-privilege and need-to-know principles, with each grant tied to documented approval. Entitlements are reviewed at least annually and on role change; review windows are driven by an access-review timer and produce an attestation. Separations and role changes trigger deprovisioning. Changes to financial systems and control configurations require change-management (CAB) approval with test evidence and a rollback plan before deployment; emergency changes require post-deployment review within a defined window. Access-review attestations and change approvals are write-restricted to Compliance and the change-advisory function respectively.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Entitlement requested (`access.entitlement_requested`) | Requestor justification (`access.justification`), role (`access.role_id`), manager approval (`access.manager_approval`) | Access provisioned on least-privilege (`access.provisioned`) | At provisioning (internal: per approval workflow) |
| Access review window opens (`access.review_due`) | Entitlement roster (`access.user_roster`), reviewer roster (`access.reviewer_roster`), review timer (`access.review_timer`) | Review attestation completed (`access.review_completed`) | Annually / on role change (enforced by `access.review_due`) |
| Employee separated or role changed (`employee.role_changed`) | Employment status (`user.employment_status`), deprovision timer (`access.deprovision_due_at`) | Access deprovisioned (`access.deprovisioned`) | At separation/change (enforced by `access.deprovision_due_at`) |
| Change to financial system / control config submitted (`change.rfc_submitted`) | Change description (`change.requested`), test evidence (`change.test_evidence`), rollback plan (`change.rollback_plan`) | CAB decision + deployment record (`change.cab_decision_recorded`) | Before deployment (internal: per `change.cab_review_due_at`) |
| Emergency change deployed (`change.emergency_deployed`) | Emergency justification (`change.emergency_justification`), backout plan (`change.backout_plan`) | Post-implementation review (`change.post_review_completed`) | Per `change.post_review_due_at` |

**ALERTS/METRICS:** Aging alert for overdue access reviews (target zero), count of active entitlements for separated users (target zero), and rate of changes to financial systems deployed without CAB approval (target zero).

## IC-06 — Exception and Override Management

**WHY (Reg cite):** Capturing every control override with rationale and approver, and routing above-limit exceptions for senior approval, is part of the documented internal-control structure required for insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and the controls the Supervisory Committee must ensure are maintained ([FCU Act 12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)).

**SYSTEM BEHAVIOR:** Every control override or exception is captured with its rationale and the approver. Exceptions above a defined limit are flagged as requiring senior approval and routed accordingly; an escalation timer enforces timely senior decision. Override and exception activity is consolidated into analytics for management and audit. Registered exceptions carry an expiry timer so they revert rather than persist silently. Override records and senior-decision records are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control override invoked (`control.override_invoked`) | Override rationale (`override.rationale`), approver identity (`override.senior_approver_id`), escalation flag (`override.escalation_required`) | Override recorded (`override.recorded`) | At invocation (real-time) |
| Above-limit exception requires senior approval (`override.senior_decision_recorded`) | Escalation flag (`override.escalation_required`), escalation timer (`override.escalation_timer`) | Senior decision recorded (`override.senior_decision_recorded`) | Per `override.escalation_timer` |
| Exception registered with expiry (`exception.registered`) | Rationale (`exception.rationale`), risk acceptance (`exception.risk_acceptance`), expiry timer (`exception.expiry_timer`) | Registered exception + revert on expiry (`exception.reverted`) | Per `exception.expiry_timer` |
| Override analytics period closes (`override.analytics_published`) | Override register (`override.rationale`), analytics window (`override.analytics_due`) | Override analytics published (`override.analytics_published`) | Per `override.analytics_due` |

**ALERTS/METRICS:** Count of above-limit exceptions awaiting senior approval past the escalation timer (target zero), count of expired-but-not-reverted exceptions (target zero), and override volume trend by control for management review.

## IC-07 — Monitoring and Self-Assessment

**WHY (Reg cite):** Ongoing monitoring, deficiency tracking, and reporting to the board and Supervisory Committee support the control structure and annual audit requirements of [NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) and the Supervisory Committee's duty to ensure controls are effectively maintained ([FCU Act 12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)); adequate controls are also a condition of insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

**SYSTEM BEHAVIOR:** Control self-assessments and management testing run on defined cycles, driven by a CSA cycle timer. Deficiencies are logged with a named owner and due date and tracked to remediation; aged deficiencies escalate. Results are consolidated into a quarterly report delivered to the board and Supervisory Committee, driven by a quarterly reporting timer. Deficiency tracking and self-assessment results are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Self-assessment cycle opens (`csa.cycle_opened`) | Sample specification (`monitoring.sample_spec`), prior results (`csa.prior_results`), cycle timer (`csa.cycle_timer`) | CSA completed (`csa.completed`) | Per cycle (enforced by `csa.cycle_timer`) |
| Deficiency identified (`deficiency.logged`) | Source (`deficiency.source`), owner (`deficiency.owner_id`), severity (`deficiency.severity`), plan timer (`deficiency.plan_timer`) | Remediation plan recorded (`deficiency.plan_recorded`) | Per `deficiency.plan_timer` |
| Deficiency remediation submitted (`deficiency.remediation_submitted`) | Retest result (`deficiency.retest_result`), aging report (`deficiency.aging_report`) | Deficiency closed (`deficiency.closed`) | Per remediation due date (internal: tracked to closure) |
| Quarterly board/SC report timer fires (`reporting.quarterly_due`) | Monitoring findings (`monitoring.findings_reported`), deficiency status (`deficiency.aging_report`) | Board/SC control report (`reporting.quarterly_published`) | Quarterly (enforced by `reporting.quarterly_due`) |

**ALERTS/METRICS:** Aging alert for deficiencies past remediation due date (target zero), CSA cycle completion rate against the cycle timer (target 100% on-time), and reopened-deficiency count trend.

## IC-08 — Audit Trail and Recordkeeping

**WHY (Reg cite):** Complete, tamper-evident records of transactions and control events are required as part of the security program and records preservation under [NCUA 12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and the recordkeeping adequacy required for insurance ([NCUA 12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)); they also support the Supervisory Committee verification structure ([NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** Transactions and control events emit immutable, tamper-evident audit entries capturing actor, action, and timestamp; entries cannot be edited after write. Control documentation is retained per the applicable retention class and protected from premature destruction by legal-hold flags; detailed retention schedules are governed by the Record Retention Policy and inherited here. Integrity of the audit log is periodically tested. Audit-log configuration and retention/legal-hold settings are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Transaction or control event occurs (`record.created`) | Actor (`record.actor_id`), actor role (`record.actor_role`), artifact (`record.artifact`), retention class (`record.retention_class`) | Tamper-evident audit entry written (`record.access_logged`) | Real-time |
| Retention clock set on a control record (`record.retention_clock_set`) | Record class (`record.retention_class`), retention timer (`record.retention_timer`), legal-hold flag (`record.legal_hold_placed`) | Retention clock recorded (`record.retention_clock_set`) | At record creation (per retention schedule) |
| Audit-log integrity test due (`record.integrity_test_due`) | Integrity test scope (`audit.assessment_type`), test timer (`record.integrity_test_due`) | Integrity test completed (`record.integrity_test_completed`) | Per `record.integrity_test_due` |
| Retention period expires with no hold (`record.retention_expired`) | Disposal eligibility (`record.disposal_eligible`), hold status (`record.hold_status`), disposal timer (`record.destruction_due_at`) | Record disposed + certificate (`record.destruction_certified`) | Per `record.destruction_due_at` |

**ALERTS/METRICS:** Target zero detected audit-log tamper events, integrity-test pass rate (target 100%), and count of records past retention expiry still pending disposition (excluding legal holds; target zero).

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the control framework, control ownership assignments, and override/exception governance.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Process owners (control execution and self-assessment), Finance (reconciliations and authority-matrix concurrence), Internal Audit (independent testing), and the Supervisory Committee (oversight and acceptance).
- **Review cadence:** Reviewed and re-approved at least annually (see [IC-01](#ic-01--control-environment-and-governance)); the control framework, deficiency status, and override analytics are reported to the board and Supervisory Committee quarterly (see [IC-07](#ic-07--monitoring-and-self-assessment)).
- **Cross-refs:** Information Security Policy (logical/technical access controls), Enterprise Risk Management Policy (risk appetite/taxonomy), Audit Policy (audit execution and scope), BSA Policy (BSA/AML controls), Third-Party Risk Policy (vendor control assurance), Record Retention Policy (retention schedules consumed by [IC-08](#ic-08--audit-trail-and-recordkeeping)).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the control overlays map to the registered or provisional naming scheme in DESIGN_NOTES but are reused here under the closed-world grammar; where a needed concept had no exact registered code (e.g., `control.register`, `control.owner_vacancy_timer`, `sod.matrix_version`, `sod.review_timer`, `authority_matrix.role_limits`, `recon.item_aging_timer`, `override.escalation_timer`, `exception.expiry_timer`, `csa.cycle_timer`, `record.integrity_test_due`), the closest registered or provisional spelling was used. Engineering will confirm the final registry mapping before the next review.
- **Charter type and applicability.** This policy is drafted for a federally insured credit union and anchors to NCUA Part 715, §741.3, Part 748, and FCU Act §1761b. The original reference policy was a Minnesota state-chartered bank document (12 CFR 363, MN Rule 2675); those bank-specific authorities are intentionally not carried over. Confirm Pynthia's exact charter and whether any state supervisory-authority internal-control rules also apply.
- **Reconciliation aging thresholds and resolution timeframes** ("defined timeframes" for aged items) are not specified in PATRICK_NOTES; minimal viable cadence (daily/monthly) is encoded, but the specific day-count thresholds for escalation and resolution must be confirmed by Finance and set on the recon aging timers.
- **High-risk transaction definition and dual-control thresholds** are referenced but not enumerated; the authority matrix must define which transaction types/amounts are "high-risk" and the specific role limits — to be confirmed by the CCO and Finance.
- **Self-assessment cycle frequency** (e.g., quarterly vs. semi-annual CSA) is assumed to run on a defined recurring cycle; the exact frequency and deficiency remediation SLAs must be confirmed by the CCO.
- **Supervisory Committee audit reporting deadline.** The reference policy cited a 30-day post-examination report deadline under state rule; that specific deadline is not carried into the NCUA framework here. Confirm whether an internal SLA for delivering control-monitoring results to the Supervisory Committee should be fixed.
- **NCUA notification triggers.** This policy does not enumerate events requiring NCUA notification (governed by incident/BSA policies); confirm whether any internal-control failure thresholds should independently trigger `ncua.notification_required`.
