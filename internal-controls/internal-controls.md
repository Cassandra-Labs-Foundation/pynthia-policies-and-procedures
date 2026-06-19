```yaml
---
title: Internal Controls Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Internal Controls, Governance, Segregation of Duties, Reconciliation, Access Controls]
---
```

## General Policy Statement

Pynthia Credit Union maintains a comprehensive internal control framework — encompassing the control environment, segregation of duties, authorization and approval limits, reconciliations, access and change controls, exception and override management, monitoring and self-assessment, and audit trail and recordkeeping — to safeguard assets, ensure the reliability of financial reporting, and promote compliance with applicable laws and regulations. This policy applies to all operational and financial processes, business units, employees, and supporting systems across the credit union, including activities performed by third-party service providers on its behalf. The framework is aligned with COSO principles and NCUA supervisory expectations, and is governed centrally by the Chief Compliance Officer with active participation from process owners, Finance, Internal Audit, and the Supervisory Committee. Out of scope: information security and logical access technical controls (see Information Security Policy); enterprise risk appetite and taxonomy (see Enterprise Risk Management Policy); internal and Supervisory Committee audit execution (see Audit Policy); BSA/AML program controls (see BSA Policy); third-party control assurance (see Third-Party Risk Policy); and record retention schedules (see Record Retention Policy).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Control framework annual review | Board/Supervisory Committee calendar year-end → `control.framework.approved` | Annual | Framework document, control register, RACI | [IC-01](#ic-01-control-environment-and-governance) |
| SOD conflict detected at access grant | Access provisioning request → `sod.conflict.detected` | Real-time block | SOD matrix, compensating control log | [IC-02](#ic-02-segregation-of-duties) |
| SOD violation attempted | Transaction or system action → `sod.violation.logged` | Immediate | SOD violation log, escalation record | [IC-02](#ic-02-segregation-of-duties) |
| Authority matrix annual review | Calendar trigger → `authority.matrix.updated` | Annual | Role-based authority matrix | [IC-03](#ic-03-authorization-and-approval-limits) |
| Transaction requires dual control | High-risk transaction initiated → `transaction.dual_control.completed` | Before execution | Dual-control evidence | [IC-03](#ic-03-authorization-and-approval-limits) |
| Daily cash/high-volume account reconciliation | End of business day → `recon.daily.completed` | Daily | Reconciliation workpaper | [IC-04](#ic-04-reconciliations) |
| Monthly reconciliation (other accounts) | Month-end close → `recon.monthly.completed` | Monthly | Reconciliation workpaper | [IC-04](#ic-04-reconciliations) |
| Aged reconciling item escalation | Item age threshold breached → `recon.item.escalated` | Per defined aging threshold | Escalation record | [IC-04](#ic-04-reconciliations) |
| Access provisioning (new/role change) | Employee hired or role changed → `access.provisioned` | Before system access granted | Access request, manager approval | [IC-05](#ic-05-access-and-change-controls) |
| Periodic entitlement review | Annual calendar trigger → `access_review.completed` | Annual (minimum) | Entitlement review attestation | [IC-05](#ic-05-access-and-change-controls) |
| Change management approval | RFC submitted → `change.cab_decision.recorded` | Before deployment | RFC, CAB decision, test evidence | [IC-05](#ic-05-access-and-change-controls) |
| Control override or exception captured | Override invoked → `override.recorded` | Real-time | Override log with rationale and approver | [IC-06](#ic-06-exception-and-override-management) |
| Override analytics report | Periodic cycle → `override.analytics.published` | Per defined cycle | Override analytics report | [IC-06](#ic-06-exception-and-override-management) |
| Control self-assessment cycle | CSA cycle opened → `csa.completed` | Per defined cycle | CSA results, deficiency log | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Deficiency remediation tracking | Deficiency logged → `deficiency.plan.recorded` | Per assigned due date | Deficiency record, remediation plan | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Board/Supervisory Committee reporting | Reporting cycle → `control.framework.approved` | Quarterly (minimum) | Management monitoring report | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Audit log tamper-evidence verification | Scheduled integrity check → `record.integrity_test.completed` | Per defined schedule | Integrity test result | [IC-08](#ic-08-audit-trail-and-recordkeeping) |
| Control document retention | Document created/closed → `record.retention_clock_set` | Per retention schedule | Retention record | [IC-08](#ic-08-audit-trail-and-recordkeeping) |

---

## IC-01 — Control Environment and Governance {#ic-01-control-environment-and-governance}

**WHY (Reg cite):** [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) requires the Supervisory Committee to ensure internal controls are established and effectively maintained. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires an internal control structure supporting annual audit and member account verification. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) conditions share insurance on sound business practices including adequate internal controls. FFIEC/NCUA COSO-aligned examiner guidance requires a documented control environment with defined ownership, board oversight, and annual review.

**SYSTEM BEHAVIOR:** The system maintains a control framework record (`control.register`) that maps every material process to a named control owner, documents the RACI registry, and records board and Supervisory Committee review and approval at least annually. When a control owner vacancy is detected (`control.owner_vacated`), the system opens a vacancy task and alerts the CCO within the defined SLA. The framework review cycle is enforced by the registered timer `control.framework_review_due_at`. The CCO is the write-authority for the framework document and RACI registry; process owners may update their own control descriptions subject to CCO countersignature. Board and Supervisory Committee approval is required before a revised framework takes effect.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual framework review cycle opens (`governance.board_cycle.opened`) | Prior framework version (`control.register`), RACI registry (`governance.raci_registry`), prior year findings (`finding.description`, `finding.remediation_status`) | Updated framework document + board/Supervisory Committee approval record (`control.framework.approved`) | Annual (internal: 30 days before year-end; enforced by `control.framework_review_due_at`) |
| Control owner vacancy detected (`control.owner.assigned` not received within SLA after `control.owner_vacated`) | Vacated role (`control.vacancy_reason`), affected control register entries (`control.register`) | Vacancy alert to CCO + interim owner assignment (`control.owner.assigned`) | 5 business days (internal SLA; enforced by `control.owner_vacancy_timer`) |
| Board/Supervisory Committee approves framework (`control.framework.approved`) | Approved framework document, meeting minutes reference (`board.minutes`) | Signed approval record + distribution to process owners (`governance.board_report.delivered`) | Same meeting cycle |

**ALERTS/METRICS:** Alert fires if `control.framework_review_due_at` passes without `control.framework.approved` being recorded; target zero overdue framework reviews at any point in time. Alert fires if any control owner vacancy exceeds 5 business days without an interim assignment.

---

## IC-02 — Segregation of Duties {#ic-02-segregation-of-duties}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including adequate internal controls; NCUA and FFIEC examiner guidance (COSO control activities component) specifically require that no single individual control all phases of a transaction (initiation, authorization, custody, recording, and reconciliation). [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) requires the Supervisory Committee to ensure these controls are effectively maintained.

**SYSTEM BEHAVIOR:** The system enforces a versioned SOD matrix (`sod.matrix_version`) that defines incompatible duty combinations across the five transaction phases. At the point of access provisioning or role assignment, the system performs a real-time SOD check; if a conflict is detected, the grant is blocked (`sod.grant_blocked`) and the conflict is logged (`sod.conflict.detected`). Attempted violations at the transaction level are similarly blocked and logged (`sod.violation.logged`). Where a compensating control is approved as an alternative (e.g., job rotation, supervisory review for small-team environments), it must be documented and approved before the conflicting access is granted (`sod.compensating_control.approved`); compensating controls are subject to periodic review on the same cycle as the SOD matrix. The SOD matrix is reviewed at least annually and on any material role or system change; the CCO is the write-authority for the matrix. Compensating control approvals are write-restricted to the CCO or designee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Access provisioning or role assignment requested (`access.role.requested`) | Requested role (`access.role_id`), current role entitlements (`access.role_entitlements`), SOD matrix version (`sod.matrix_version`) | SOD check result (`sod.check_result`); if conflict: grant blocked (`sod.grant_blocked`) + conflict logged (`sod.conflict.detected`) | Real-time (before grant executes) |
| Transaction step attempted by user with conflicting duties (`sod.violation.logged`) | Transaction initiator (`transaction.initiated_by`), transaction type (`transaction.type` — provisional: `transaction.type`), SOD matrix version (`sod.matrix_version`) | Violation log entry (`sod.violation.logged`) + escalation to supervisor | Immediate |
| Compensating control proposed for an approved SOD exception (`sod.compensating_control.proposed`) | Conflict description (`sod.conflict`), risk rationale (`sod.risk_rationale`), proposed compensating control (`sod.compensating_control`), approver identity | Approved compensating control record (`sod.compensating_control.approved`) | Before conflicting access is granted |
| SOD matrix annual review due (`sod.review_timer`) | Current matrix (`sod.matrix_version`), prior year violation log, role changes since last review | Updated and approved SOD matrix (`authority.matrix.updated`) | Annual (enforced by `sod.review_timer`) |

**ALERTS/METRICS:** Alert fires on every `sod.conflict.detected` and `sod.violation.logged` event; target zero unreviewed violations within 24 hours. Dashboard metric: count of open compensating controls by age; any compensating control exceeding its approved review date triggers an alert.

---

## IC-03 — Authorization and Approval Limits {#ic-03-authorization-and-approval-limits}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including documented authorization controls. FFIEC/NCUA COSO-aligned examiner guidance (control activities component) requires role-based authority matrices with documented approval before execution and dual control for high-risk transactions. [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) requires the Supervisory Committee to ensure these controls are effectively maintained.

**SYSTEM BEHAVIOR:** The system maintains a versioned role-based authority matrix (`authority_matrix.role_limits`) defining transaction and approval limits by role. Before any transaction is executed, the system checks whether the initiating user's role has authority for the transaction type and amount (`transaction.approval_required`); if not, the transaction is routed for approval. Transactions flagged as high-risk require dual control (`transaction.dual_control_required`), enforced as a blocking gate before execution. Proposed changes to the authority matrix require Finance concurrence (`authority.finance_concurrence`) and CCO approval before taking effect (`authority.matrix.updated`). The authority matrix is reviewed at least annually. The matrix document is write-restricted to the CCO with Finance concurrence; process owners may propose changes via the formal change workflow.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Transaction initiated (`transaction.approval.recorded`) | Transaction amount (`transaction.amount`), initiator role (`user.role`), transaction type (`transaction.type` — provisional: `transaction.type`), authority matrix version (`authority_matrix.role_limits`) | Approval decision recorded (`transaction.approval.recorded`); if limit exceeded: routed for approval | Before execution |
| High-risk transaction requires dual control (`transaction.dual_control.completed`) | Transaction details (`transaction.amount`, `transaction.initiated_by`), second approver identity (`user.id`), dual-control flag (`transaction.dual_control_required`) | Dual-control completion record (`transaction.dual_control.completed`) | Before execution |
| Authority matrix change proposed (`authority.matrix_change.proposed`) | Change rationale (`authority.change_rationale`), Finance concurrence (`authority.finance_concurrence`), proposed limits | Approved matrix update (`authority.matrix.updated`) | Before new limits take effect |
| Authority matrix annual review due (`control.framework_review_due_at`) | Current matrix version (`authority_matrix.role_limits`), prior year exception log | Reviewed and re-approved matrix (`authority.matrix.updated`) | Annual |

**ALERTS/METRICS:** Alert fires on any transaction executed without a required approval record; target zero. Alert fires on any dual-control bypass attempt. Dashboard metric: count of transactions routed for approval by tier and outcome, reviewed monthly by the CCO.

---

## IC-04 — Reconciliations {#ic-04-reconciliations}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including adequate recordkeeping and internal controls over financial reporting. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires an internal control structure supporting accurate financial records. FFIEC/NCUA COSO-aligned examiner guidance requires timely reconciliation of general ledger, subsidiary ledger, suspense, and clearing accounts with escalation of aged items.

**SYSTEM BEHAVIOR:** The system enforces two reconciliation cadences: daily for cash and high-volume accounts (enforced by `recon.daily_due`), and monthly for all other general ledger, subsidiary ledger, suspense, and clearing accounts (enforced by `recon.monthly_due`). Each reconciliation produces a workpaper (`recon.research_notes`) and a completion event. Reconciling items are tracked by age (`recon.item_age_days`); items that breach the defined aging threshold trigger an escalation task (`recon.item.escalated`) assigned to the item owner (`recon.item_owner`) with a mandatory resolution deadline. Unresolved items beyond the escalation deadline are reported to the CCO and, if material, to the Supervisory Committee. Finance staff perform reconciliations; the CCO and Internal Audit have read access; write access to reconciliation workpapers is restricted to the assigned reconciler and their supervisor.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| End of business day for cash/high-volume accounts (`gl.eod.closed`) | GL balances (`gl.balances`), subsidiary ledger balances, cash position (`cash.recon`), prior reconciliation record | Daily reconciliation completion (`recon.daily.completed`) with variance noted (`recon.item`) | Daily (enforced by `recon.daily_due`) |
| Month-end close for other accounts (`gl.period.closed`) | GL trial balance (`gl.trial_balance`), subsidiary ledger, suspense account balances, clearing account balances | Monthly reconciliation completion (`recon.monthly.completed`) with open items listed | Monthly (enforced by `recon.monthly_due`) |
| Reconciling item age threshold breached (`recon.item.escalated`) | Item details (`recon.item`), item age (`recon.item_age_days`), item owner (`recon.item_owner`), research notes (`recon.research_notes`) | Escalation record (`recon.item.escalated`) + remediation task assigned to item owner | Per defined aging threshold (internal: 30 days for suspense/clearing; enforced by `recon.item_aging_timer`) |
| Escalated item resolved (`recon.item.resolved`) | Resolution evidence, approver identity, updated research notes (`recon.research_notes`) | Resolution record (`recon.item.resolved`) | Per escalation due date |

**ALERTS/METRICS:** Alert fires if any daily reconciliation is not completed by the defined daily cutoff; target zero missed daily reconciliations. Alert fires on every `recon.item.escalated` event; aging dashboard shows count and dollar value of open reconciling items by age band, reviewed weekly by Finance and monthly by the CCO.

---

## IC-05 — Access and Change Controls {#ic-05-access-and-change-controls}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires internal controls over security and recordkeeping, including access controls. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including adequate internal controls. FFIEC/NCUA COSO-aligned examiner guidance requires least-privilege provisioning, periodic entitlement reviews, and change-management approval for financial systems and control configurations. Logical access technical controls are governed by the Information Security Policy; this control covers the provisioning governance, entitlement review cadence, and change-management approval process.

**SYSTEM BEHAVIOR:** System access to financial systems and control configurations is provisioned on least-privilege and need-to-know principles. Every provisioning request requires manager approval (`access.manager_approval`) and a documented justification (`access.justification`) before access is granted (`access.provisioned`). Entitlement reviews are performed at least annually and on any role change (`employee.role.changed`) or separation (`employee.separated`); the review produces an attestation (`access.review_attestation`) and any excess entitlements are deprovisioned within the defined SLA (`access.deprovisioned`). Changes to financial systems and control configurations require a formal RFC (`change.rfc`), CAB review and decision (`change.cab_decision.recorded`), test evidence (`change.test_evidence`), and a post-implementation review (`change.post_review.completed`). Emergency changes require documented justification (`change.emergency_justification`) and retrospective CAB review within 5 business days. The CCO and IT are co-write-authorities for access provisioning decisions; the CAB (including a Compliance representative) is the approval authority for financial system changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New employee hired or role changed (`employee.hired` or `employee.role.changed`) | Employee identity (`employee.id`), new role (`user.role`), manager approval (`access.manager_approval`), justification (`access.justification`), SOD check result (`sod.check_result`) | Access provisioned (`access.provisioned`) + access right recorded (`access_right.recorded`) | Before system access is needed; SOD check must clear first |
| Employee separated (`employee.separated`) | Employee identity (`employee.id`), separation date, current entitlements (`access.role_entitlements`) | Access deprovisioned (`access.deprovisioned`) | Same day as separation (enforced by `access.deprovision_due_at`) |
| Annual entitlement review due (`access.review_due`) | Full entitlement roster (`access.user_roster`), role definitions (`access.role_entitlements`), last review date (`access.last_reviewed_at`) | Entitlement review completion with attestation (`access_review.completed`) + deprovisioning tasks for excess entitlements | Annual minimum (enforced by `access.review_due`); on role change, within 5 business days |
| RFC submitted for financial system or control configuration change (`change.rfc.submitted`) | RFC document (`change.rfc`), risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision recorded (`change.cab_decision.recorded`) | Before deployment; CAB review within defined change window (enforced by `change.cab_review_due_at`) |
| Change deployed (`change.completed`) | Deployment record (`change.deployment_record`), post-review scope | Post-implementation review completed (`change.post_review.completed`) | Within 5 business days of deployment (enforced by `change.post_review_due_at`) |

**ALERTS/METRICS:** Alert fires if any separated employee's access is not deprovisioned on the day of separation; target zero. Alert fires if annual entitlement review is not completed by `access.review_due`; target zero overdue reviews. Alert fires on any change deployed without a recorded CAB decision; target zero.

---

## IC-06 — Exception and Override Management {#ic-06-exception-and-override-management}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including adequate internal controls; unmanaged overrides are a primary fraud and error vector. FFIEC/NCUA COSO-aligned examiner guidance requires that every control override be captured with rationale and approver, and that override patterns be reported to management and audit. [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) requires the Supervisory Committee to ensure these controls are effectively maintained.

**SYSTEM BEHAVIOR:** Every control override or exception is captured in real time with the rationale (`override.rationale`), the approver identity (`override.senior_approver_id`), and the senior decision (`override.senior_decision`) before the overridden action proceeds. Overrides that exceed defined thresholds (above-limit exceptions) are automatically routed for senior approval (`override.escalation_required = true`) and blocked until that approval is recorded. The system produces periodic override analytics reports (`override.analytics.published`) summarizing override frequency, type, approver, and trend for review by management and Internal Audit. The CCO sets the override threshold parameters; override records are write-restricted to the system (auto-captured) and the approving officer; no self-approval is permitted. Exceptions that represent a standing deviation from policy must also be registered as a formal exception (`exception.registered`) with an expiry date (`exception.expires_at` — provisional: `exception.expires_at`) and risk acceptance (`exception.risk_acceptance`).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control override invoked (`control.override.invoked`) | Override rationale (`override.rationale`), initiator identity (`user.id`), control being overridden (`control.id` — provisional: `control.id`), transaction or action reference | Override record (`override.recorded`) with rationale and timestamp | Real-time, before overridden action proceeds |
| Override exceeds defined limit requiring senior approval (`override.escalation_required = true`) | Override record, senior approver identity (`override.senior_approver_id`), senior decision (`override.senior_decision`) | Senior approval decision recorded (`override.senior_decision.recorded`); action blocked until approval received | Before execution (enforced by `override.escalation_timer`) |
| Standing exception registered (`exception.registered`) | Exception scope (`exception.scope` — provisional: `exception.scope`), rationale (`exception.rationale`), approver (`exception.approver_id` — provisional: `exception.approver_id`), expiry date (`exception.expires_at` — provisional: `exception.expires_at`), risk acceptance (`exception.risk_acceptance`) | Exception registration record (`exception.registered`) | Before the exception takes effect |
| Exception approaching expiry (`exception.expiring`) | Exception record, expiry date, owner identity | Expiry alert issued; renewal or reversion decision required (`exception.reverted` or renewed) | Per defined expiry warning period (enforced by `exception.expiry_timer`) |
| Override analytics cycle due (`override.analytics_due`) | Override log for the period, frequency and trend data | Override analytics report (`override.analytics.published`) distributed to CCO and Internal Audit | Per defined cycle (internal: monthly; enforced by `override.analytics_due`) |

**ALERTS/METRICS:** Alert fires on every above-limit override that lacks a senior approval record; target zero. Alert fires on any exception that reaches its expiry date without a renewal or reversion decision. Dashboard metric: override count by type and approver, trended monthly; any spike above baseline triggers CCO review.

---

## IC-07 — Monitoring and Self-Assessment {#ic-07-monitoring-and-self-assessment}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires ongoing monitoring of the internal control structure and reporting of results to the Supervisory Committee. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including effective monitoring. FFIEC/NCUA COSO-aligned examiner guidance (monitoring component) requires control self-assessments, management testing, deficiency tracking with owners and due dates, and periodic reporting to the board and Supervisory Committee.

**SYSTEM BEHAVIOR:** The system supports a structured control self-assessment (CSA) cycle (`csa.cycle_timer`) in which process owners assess the design and operating effectiveness of controls in their area, producing a CSA completion record (`csa.completed`) with prior results for trend comparison (`csa.prior_results`). Management testing supplements CSA with independent sample-based testing (`monitoring.sample_drawn`, `monitoring.findings`). Deficiencies identified through CSA, management testing, or other sources are logged (`deficiency.logged`) with a severity rating (`deficiency.severity`), an assigned owner (`deficiency.owner_id`), and a remediation due date enforced by `deficiency.plan_timer`. Deficiency status is tracked to closure (`deficiency.closed`) with retest evidence (`deficiency.retest_result`). Results — including open deficiency counts, aging, and remediation status — are reported to the board and Supervisory Committee at least quarterly (`control.framework.approved` cycle). The CCO owns the monitoring program; process owners are responsible for CSA completion and deficiency remediation in their areas; Internal Audit has read access to all monitoring results.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CSA cycle opens (`csa.cycle.opened`) | Prior CSA results (`csa.prior_results`), control register (`control.register`), assigned process owners | CSA completion record per process area (`csa.completed`) | Per defined CSA cycle (internal: semi-annual minimum; enforced by `csa.cycle_timer`) |
| Management testing sample drawn (`monitoring.review.completed`) | Sample specification (`monitoring.sample_spec`), scope (`monitoring.scope`), testing results | Monitoring findings report (`monitoring.findings.reported`) | Per monitoring plan cycle (enforced by `monitoring.review_due_at`) |
| Deficiency identified (`deficiency.logged`) | Deficiency description (`deficiency.severity`, `deficiency.source`), assigned owner (`deficiency.owner_id`), remediation plan | Deficiency record with plan (`deficiency.plan.recorded`) + remediation task assigned | Within 5 business days of identification (enforced by `deficiency.plan_timer`) |
| Deficiency remediation due (`deficiency.plan_timer` fires) | Remediation evidence, retest result (`deficiency.retest_result`) | Deficiency closed (`deficiency.closed`) or escalated if overdue (`deficiency.reopened`) | Per assigned due date |
| Board/Supervisory Committee reporting cycle (`governance.board_cycle.opened`) | Open deficiency aging report (`deficiency.aging_report`), CSA results, monitoring findings, remediation status | Management monitoring report delivered to board and Supervisory Committee (`governance.board_report.delivered`) | Quarterly minimum |

**ALERTS/METRICS:** Alert fires if any deficiency remediation plan is not recorded within 5 business days of identification; target zero. Alert fires if any deficiency exceeds its remediation due date without closure or an approved extension. Dashboard metric: open deficiency count by severity and age, reviewed monthly by the CCO and quarterly by the Supervisory Committee.

---

## IC-08 — Audit Trail and Recordkeeping {#ic-08-audit-trail-and-recordkeeping}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires internal controls over recordkeeping and security, including tamper-evident audit logs. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that documentation of internal audit procedures and results be maintained for inspection by supervisory examiners. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires adequate recordkeeping as a condition of insurability. Retention periods for specific record classes are governed by the Record Retention Policy; this control governs the completeness, tamper-evidence, and accessibility of control-related audit logs and documentation.

**SYSTEM BEHAVIOR:** Every transaction and control event produces an immutable audit log entry (`record.audit_entry_written`) capturing the actor (`record.actor_id`), role (`record.actor_role`), action, timestamp, and resource reference. Audit logs are stored in a tamper-evident medium; integrity is verified on a defined schedule via automated integrity tests (`record.integrity_test.completed`). Control documentation — including policy versions, framework approvals, SOD matrices, authority matrices, reconciliation workpapers, override logs, CSA results, and deficiency records — is retained in accordance with the retention schedule defined in the Record Retention Policy, with retention clocks set at document creation or closure (`record.retention_clock_set`). Records subject to legal hold are flagged (`record.legal_hold_flag`) and excluded from routine disposal until the hold is released (`record.hold.released`). Access to audit logs is read-restricted to Internal Audit, the CCO, and regulators; no user may modify or delete an audit log entry. Disposal of control records requires documented authorization and a destruction certificate (`record.destruction.certified`).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Any transaction or control event occurs | Actor identity (`record.actor_id`), actor role (`record.actor_role`), event type, resource reference, timestamp | Immutable audit log entry (`record.audit_entry_written`) | Real-time, synchronous with the event |
| Audit log integrity test scheduled (`record.integrity_test_due`) | Log segment scope, prior integrity baseline | Integrity test result (`record.integrity_test.completed`); any failure triggers immediate CCO alert | Per defined schedule (internal: monthly; enforced by `record.integrity_test_due`) |
| Control document created or closed | Document type (`record.retention_class`), anchor date (`record.retention_anchor`), retention schedule reference | Retention clock set (`record.retention_clock_set`) + retention record created (`record.retained`) | At document creation or closure |
| Record reaches retention expiry (`record.retention_expires_at`) | Retention record, legal hold status (`record.legal_hold_flag`), disposal authorization | Disposal executed (`record.disposed`) + destruction certificate (`record.destruction.certified`) | Per retention schedule; blocked if legal hold is active |
| Legal hold placed on control records (`record.hold.placed`) | Matter reference (`record.hold_matter`), hold scope (`record.hold_scope`), authorizer (`record.hold_authorizer`) | Legal hold flag set (`record.legal_hold_flag`) + hold registry updated (`record.hold_registry`) | Immediately upon legal hold order |

**ALERTS/METRICS:** Alert fires if any integrity test fails; target zero failures without same-day CCO notification and investigation. Alert fires if any record is disposed while a legal hold flag is active; target zero. Dashboard metric: count of records approaching retention expiry by class, reviewed monthly by the Records function.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all controls, the authority matrix, SOD matrix, and override thresholds; receives all escalations |
| **Process Owners** | Control self-assessment completion; deficiency remediation in their areas; authority matrix input |
| **Finance** | Reconciliation execution; authority matrix concurrence; financial reporting integrity |
| **Internal Audit / Supervisory Committee** | Independent oversight; review of CSA results, monitoring findings, deficiency aging, and override analytics; annual framework approval |
| **IT / Change Advisory Board** | Change management approval for financial systems and control configurations |

**Review cadence:** This policy is reviewed at least annually, or sooner upon a material change in the credit union's operations, regulatory requirements, or risk profile. The next scheduled review is 2026-07-01.

**Cross-references:** Information Security Policy · Enterprise Risk Management Policy · Audit Policy · BSA Policy · Third-Party Risk Policy · Record Retention Policy

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are not yet confirmed as registered in `core-vocabulary.json` for the internal-controls domain. The following codes are used per the Composition grammar or provisional-code list and require engineering confirmation before the next review: `transaction.type` (provisional: `transaction.type`), `control.id` (provisional: `control.id`), `exception.scope` (provisional: `exception.scope`), `exception.approver_id` (provisional: `exception.approver_id`), `exception.expires_at` (provisional: `exception.expires_at`). All other codes (e.g., `sod.*`, `recon.*`, `access.*`, `change.*`, `override.*`, `deficiency.*`, `record.*`, `control.*`, `csa.*`, `monitoring.*`, `authority.*`, `governance.*`) are drawn from registered vocabulary and should be confirmed against the live spec at implementation.

- **SOD matrix content is not defined in this policy.** The specific incompatible-duty combinations for each material process must be documented in a separate SOD matrix artifact maintained by the CCO. This policy establishes the governance and enforcement mechanism; the matrix content is a process-owner deliverable confirmed at the first annual review.

- **Override threshold parameters are not specified here.** The dollar and risk-tier thresholds that trigger senior approval for overrides are to be defined by the CCO in the authority matrix and override configuration. This policy establishes the requirement; the specific thresholds are an operational parameter.

- **CSA cycle frequency.** Patrick's notes require CSA but do not specify a frequency beyond "ongoing." This policy assumes semi-annual as the internal minimum, with the CCO empowered to increase frequency for higher-risk processes. Confirm with the CCO before the first cycle opens.

- **Reconciliation aging thresholds.** Patrick's notes require escalation of aged reconciling items "within defined timeframes" but do not specify the thresholds. This policy assumes 30 days for suspense and clearing accounts as the internal default. Finance and the CCO must confirm and document specific thresholds by process type before the first reconciliation cycle.

- **Dual-control transaction definition.** The specific transaction types and dollar thresholds that require dual control are not enumerated in Patrick's notes. These must be defined in the authority matrix. This policy establishes the requirement; the specific scope is an authority-matrix deliverable.

- **Board vs. Supervisory Committee approval roles.** For a federally chartered credit union, the Supervisory Committee has the primary internal control oversight role under [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) and [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715). This policy treats the board and Supervisory Committee as joint recipients of monitoring reports and framework approvals, consistent with NCUA practice. If Pynthia is a state-chartered credit union, the applicable state supervisory authority requirements should be confirmed and this policy updated accordingly.

- **Third-party control assurance is out of scope.** SOC reports and vendor control assessments are governed by the Third-Party Risk Policy. Where a third-party service provider performs a material process on behalf of the credit union, the process owner is responsible for ensuring that the Third-Party Risk Policy's assurance requirements are met; this policy's controls apply to the credit union's oversight activities, not to the vendor's internal controls directly.

- **Reference policy (Highland Bank, May 2014) was a bank policy.** The reference document was written for a Minnesota-chartered bank under FDIC/state supervision. Its governance structure (Audit Committee, Director of Compliance and Audit, 12 CFR 363 thresholds, Minnesota Rules 2675) does not apply to Pynthia Credit Union. All applicable authority has been re-grounded in NCUA regulations and the Federal Credit Union Act. No Highland Bank-specific content has been carried forward.
```
