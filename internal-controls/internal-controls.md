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

# Internal Controls Policy

## General Policy Statement

Pynthia Credit Union maintains a comprehensive system of internal controls — encompassing segregation of duties, authorization and approval limits, reconciliations, access and change controls, exception management, monitoring, and audit-trail integrity — to safeguard assets, ensure the reliability of financial reporting, and promote compliance with applicable laws and regulations. This policy applies to all operational and financial processes, business units, employees, and third-party service providers acting on the credit union's behalf. The control framework is aligned with COSO principles and NCUA supervisory expectations, is owned by the Chief Compliance Officer, and is reviewed at least annually by the Board of Directors and Supervisory Committee.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Control framework annual review | Calendar year-end or material change → `control.framework.approved` | Annual | Board/Supervisory Committee approval of framework | [IC-01](#ic-01-control-environment-and-governance) |
| SOD conflict detected at access grant | Access provisioning request → `sod.conflict.detected` | Real-time block | SOD matrix check; compensating control if approved | [IC-02](#ic-02-segregation-of-duties) |
| SOD violation attempted at transaction | Transaction initiation → `sod.violation.logged` | Real-time block | Incompatible-duty block; log and alert | [IC-02](#ic-02-segregation-of-duties) |
| Authority matrix annual review | Calendar year-end → `authority.matrix.updated` | Annual | Finance concurrence; board approval | [IC-03](#ic-03-authorization-and-approval-limits) |
| Dual control required for high-risk transaction | Transaction above dual-control threshold → `transaction.dual_control.completed` | Before execution | Dual-control completion record | [IC-03](#ic-03-authorization-and-approval-limits) |
| Daily reconciliation — cash and high-volume accounts | Business day close → `recon.daily.completed` | Next business day | GL/subsidiary/cash recon; variance noted | [IC-04](#ic-04-reconciliations) |
| Monthly reconciliation — all other accounts | Month-end → `recon.monthly.completed` | 5 BD after month-end | Suspense/clearing/subsidiary recon | [IC-04](#ic-04-reconciliations) |
| Aged reconciling item escalation | Item age threshold breached → `recon.item.escalated` | Per aging schedule | Escalation to Finance/CCO | [IC-04](#ic-04-reconciliations) |
| Access provisioning — new hire or role change | Employee hired or role changed → `access.provisioned` | Day of effective date | Least-privilege entitlement grant | [IC-05](#ic-05-access-and-change-controls) |
| Access entitlement review | Annual cycle or role change → `access.review.completed` | Annual (or within 5 BD of role change) | Entitlement attestation | [IC-05](#ic-05-access-and-change-controls) |
| Access deprovisioning — separation | Employee separated → `access.deprovisioned` | Same business day | Revocation of all entitlements | [IC-05](#ic-05-access-and-change-controls) |
| Change to financial system or control config | RFC submitted → `change.cab_decision.recorded` | Before deployment | CAB approval; post-deployment review | [IC-05](#ic-05-access-and-change-controls) |
| Control override or exception captured | Override invoked → `override.recorded` | Real-time | Rationale, approver, senior decision if above limit | [IC-06](#ic-06-exception-and-override-management) |
| Override analytics report | Periodic cycle → `override.analytics.published` | Monthly | Management and audit override summary | [IC-06](#ic-06-exception-and-override-management) |
| Control self-assessment cycle | Annual or triggered → `csa.completed` | Annual | CSA results; deficiency log | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Deficiency remediation tracking | Deficiency logged → `deficiency.plan.recorded` | Per severity SLA | Owner, due date, retest | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Board/Supervisory Committee monitoring report | Quarterly → `finding.quarterly_report.delivered` | 15 CD after quarter-end | Open findings, remediation status | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Control document created — retention clock set | Document finalized → `record.retention_clock_set` | Same day | Retention class assigned; tamper-evident log | [IC-08](#ic-08-audit-trail-and-recordkeeping) |
| Audit log integrity test | Scheduled → `record.integrity_test.completed` | Annual (or on demand) | Integrity test result | [IC-08](#ic-08-audit-trail-and-recordkeeping) |

---

## IC-01 — Control Environment and Governance {#ic-01-control-environment-and-governance}

**WHY (Reg cite):** [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) requires the Supervisory Committee to ensure internal controls are established and effectively maintained. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) conditions NCUA share insurance on sound business practices including adequate internal controls. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires an internal control structure supporting annual audit and member account verification. FFIEC/NCUA examiner guidance (COSO-aligned) expects a documented control environment with assigned ownership and board-level oversight.

**SYSTEM BEHAVIOR:** The credit union maintains a written internal control framework that identifies every material process, assigns a named control owner, and maps each control to its regulatory authority. The Chief Compliance Officer (CCO) owns the framework; process owners, Finance, Internal Audit, and the Supervisory Committee are required participants. The Board of Directors and Supervisory Committee review and approve the framework at least annually; any material change to the credit union's risk profile, organizational structure, or regulatory environment triggers an interim review. The `control.register` field holds the current inventory of controls and owners; `control.framework.review.due_at` drives the annual review task. The `control.owner_vacated` field triggers an immediate vacancy alert when a control owner role is vacated, and `control.owner_vacancy_timer` enforces a 30-day fill deadline. Write access to the control register is restricted to the CCO and designated Compliance staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens or material change detected (`control.framework.approved`) | Current control register (`control.register`), prior-year approval record (`policy.board_approved_at`), RACI registry (`governance.raci_registry`), Supervisory Committee minutes | Updated framework document + board/Supervisory Committee approval record (`control.framework.approved`); logged to audit trail | Annual; internal target: 30 CD before year-end (enforced by `control.framework.review.due_at`) |
| Control owner role vacated (`control.owner.assigned`) | Vacated role identifier (`control.owner_vacated`), vacancy reason (`control.vacancy_reason`) | Vacancy alert issued; replacement assignment recorded (`control.owner.assigned`) | 30 days to fill (enforced by `control.owner_vacancy_timer`) |
| New material process identified or existing process materially changed | Process description (`process.description`), process owner (`process.owner_id`), risk rating (`process.risk_rating`) | New control register entry; owner assignment event (`control.owner.assigned`) | Within 10 BD of identification |

**ALERTS/METRICS:** Alert fires when `control.framework.review.due_at` is within 30 days and no in-progress review task exists. Vacancy alert fires immediately on `control.owner_vacated`; target: zero open vacancies beyond 30 days. Board/Supervisory Committee approval completion rate target: 100% annually.

---

## IC-02 — Segregation of Duties {#ic-02-segregation-of-duties}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including controls that prevent a single individual from controlling all phases of a transaction. FFIEC/NCUA examiner guidance (COSO-aligned) explicitly requires separation of initiation, authorization, custody, recording, and reconciliation functions. [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) places Supervisory Committee responsibility over the adequacy of these controls.

**SYSTEM BEHAVIOR:** The system enforces a current SOD matrix (`sod.matrix_version`) that defines incompatible duty combinations across the five transaction phases: initiation, authorization, custody, recording, and reconciliation. At access provisioning, the system checks the proposed entitlement set against the matrix and blocks any grant that would create an incompatible combination (`sod.grant.blocked`). At transaction execution, the system checks the acting user's role set and blocks execution if an incompatible combination is detected (`sod.conflict`). Every blocked grant and every attempted violation is logged immediately. Where operational necessity requires a compensating control in lieu of full separation (e.g., small-branch staffing), a documented compensating control (`sod.compensating_control`) must be approved by the CCO and recorded before the access is granted; the compensating control is subject to enhanced supervisory review. The SOD matrix is reviewed at least annually and on any material role or system change. Write access to the SOD matrix is restricted to the CCO and IT Security.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Access provisioning request submitted for a role that creates an incompatible duty combination (`sod.conflict.detected`) | Proposed role entitlements (`access.role_entitlements`), SOD matrix version (`sod.matrix_version`), requesting user (`user.id`), manager approval (`access.manager_approval`) | Access grant blocked (`sod.grant.blocked`); conflict logged (`sod.violation.logged`) | Real-time; block occurs before grant |
| Transaction execution attempted by user holding incompatible duties (`sod.violation.logged`) | Transaction type and amount (`transaction.type`, `transaction.amount`), acting user role (`user.role`), SOD check result (`sod.check_result`) | Execution blocked; violation logged (`sod.violation.logged`); alert issued to CCO | Real-time; block occurs before execution |
| Compensating control proposed for an approved SOD exception (`sod.compensating_control.approved`) | SOD conflict description (`sod.conflict`), compensating control description (`sod.compensating_control`), risk rationale (`sod.risk_rationale`), CCO approval | Compensating control recorded and approved (`sod.compensating_control.approved`); exception registered (`exception.registered`) | Before access is granted |
| Annual SOD matrix review completed | Current matrix (`sod.matrix_version`), prior-year review record, role/system change log | Updated matrix published; review completion logged (`access_review.completed`) | Annual (enforced by `access.review_due`) |

**ALERTS/METRICS:** Real-time alert to CCO and IT Security on every `sod.violation.logged`. Target: zero unresolved SOD violations beyond 1 BD. Monthly metric: count of compensating controls in force; any increase triggers CCO review. SOD matrix review completion tracked against `access.review_due`.

---

## IC-03 — Authorization and Approval Limits {#ic-03-authorization-and-approval-limits}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including documented authorization structures. FFIEC/NCUA examiner guidance (COSO-aligned) requires a role-based authority matrix with defined transaction and approval limits, documented pre-execution approval, and dual control for high-risk transactions. [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) places Supervisory Committee responsibility over the adequacy of authorization controls.

**SYSTEM BEHAVIOR:** The credit union maintains a role-based authority matrix (`authority_matrix.role_limits`) that defines the maximum transaction amount each role may initiate, approve, or both. The system enforces the matrix at transaction initiation: transactions above a role's limit are blocked pending documented approval from a role with sufficient authority (`transaction.approval_required`). Transactions above the dual-control threshold require two independent approvers before execution (`transaction.dual_control_required`); the system will not release such transactions until both approvals are recorded (`transaction.dual_control.completed`). The authority matrix is reviewed at least annually with Finance concurrence (`authority.finance_concurrence`) and approved by the Board; any proposed change requires documented rationale (`authority.change_rationale`) and is logged as a matrix change event (`authority.matrix.updated`). Write access to the authority matrix is restricted to the CCO and Finance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Transaction initiated above the initiating role's approval limit (`transaction.approval.recorded`) | Transaction amount (`transaction.amount`), initiating user role (`user.role`), authority matrix entry (`authority_matrix.role_limits`), approval required flag (`transaction.approval_required`) | Approval request routed to authorized approver; approval recorded (`transaction.approval.recorded`) | Before execution; internal SLA: same business day for routine transactions |
| High-risk transaction requiring dual control submitted (`transaction.dual_control.completed`) | Transaction amount and type (`transaction.amount`, `transaction.type`), first approver identity, second approver identity, dual control required flag (`transaction.dual_control_required`) | Dual-control completion record (`transaction.dual_control.completed`); both approvals logged | Before execution; real-time enforcement |
| Authority matrix change proposed (`authority.matrix_change.proposed`) | Proposed change description (`authority.matrix_change`), change rationale (`authority.change_rationale`), Finance concurrence (`authority.finance_concurrence`) | Change proposal logged (`authority.matrix_change.proposed`); pending board approval | Before change takes effect |
| Authority matrix annual review and approval (`authority.matrix.updated`) | Current matrix (`authority_matrix.role_limits`), Finance concurrence, board approval record | Updated matrix published (`authority.matrix.updated`) | Annual (internal target: Q4 each year) |

**ALERTS/METRICS:** Alert fires on any transaction execution attempt that bypasses the approval gate. Target: zero unapproved transactions above role limits. Dual-control completion rate target: 100% for flagged transactions. Authority matrix review completion tracked annually; alert fires 30 days before due if no review task is in progress.

---

## IC-04 — Reconciliations {#ic-04-reconciliations}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including adequate recordkeeping and reconciliation. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires an internal control structure that supports accurate financial reporting, which depends on timely reconciliation. FFIEC/NCUA examiner guidance (COSO-aligned) requires timely reconciliation of GL, subsidiary ledgers, suspense, and clearing accounts, with aged items escalated and resolved within defined timeframes.

**SYSTEM BEHAVIOR:** The system enforces two reconciliation cadences: daily for cash and high-volume accounts (`recon.daily_due`), and monthly for all other GL, subsidiary, suspense, and clearing accounts (`recon.monthly_due`). Each reconciliation produces a variance record (`recon.item`) when a difference is identified; the item is assigned an owner (`recon.item_owner`) and tracked by age (`recon.item_age_days`). Items that breach the aging threshold trigger automatic escalation to Finance and the CCO (`recon.item.escalated`). Research notes are required for all open items (`recon.research_notes`). Reconciliations are performed by staff who did not initiate or record the underlying transactions (SOD enforcement per [IC-02](#ic-02-segregation-of-duties)). Supervisory review of completed reconciliations is required before sign-off. Write access to reconciliation records is restricted to Finance and designated Operations staff; CCO has read access for oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Business day closes for cash or high-volume accounts (`recon.daily.completed`) | GL balances (`gl.balances`), subsidiary ledger balances, cash position (`cash.recon`), prior-day reconciliation record | Daily reconciliation completion record (`recon.daily.completed`); any variance items created (`recon.item`) | Next business day (enforced by `recon.daily_due`) |
| Month-end closes for all other accounts (`recon.monthly.completed`) | GL trial balance (`gl.trial_balance`), suspense account balances, clearing account balances, subsidiary ledger totals | Monthly reconciliation completion record (`recon.monthly.completed`); any variance items created (`recon.item`) | 5 BD after month-end (enforced by `recon.monthly_due`) |
| Reconciling item age threshold breached (`recon.item.escalated`) | Item details (`recon.item`), item age (`recon.item_age_days`), item owner (`recon.item_owner`), research notes (`recon.research_notes`) | Escalation event logged (`recon.item.escalated`); CCO and Finance notified | Per aging schedule: items ≥ 30 days escalated to Finance; ≥ 60 days escalated to CCO |
| Reconciling item resolved (`recon.item.resolved`) | Resolution evidence, approver identity, research notes (`recon.research_notes`) | Item closure recorded (`recon.item.resolved`) | Within defined resolution SLA per item severity |

**ALERTS/METRICS:** Alert fires when daily reconciliation is not completed by the next business day deadline. Alert fires when monthly reconciliation is not completed within 5 BD of month-end. Aging dashboard tracks all open items by age bucket; target: zero items ≥ 60 days unresolved. CCO receives weekly summary of open reconciling items above 30 days.

---

## IC-05 — Access and Change Controls {#ic-05-access-and-change-controls}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires internal controls over security and recordkeeping, including access controls. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including controls over system access and change management. FFIEC/NCUA examiner guidance (COSO-aligned) requires least-privilege provisioning, periodic entitlement reviews, and change-management approval for changes to financial systems and control configurations. Note: technical logical-access controls (e.g., MFA, encryption, network segmentation) are governed by the Information Security Policy; this control covers the provisioning, review, and change-management governance layer.

**SYSTEM BEHAVIOR:** System access to financial systems and control configurations is provisioned on least-privilege and need-to-know principles: each user receives only the entitlements required for their current role (`access.role_entitlements`), and no entitlement is granted without documented manager approval (`access.manager_approval`) and a SOD check (per [IC-02](#ic-02-segregation-of-duties)). On employee hire or role change, access is provisioned on the effective date; on separation, all access is revoked the same business day (`access.deprovisioned`). Entitlements are reviewed at least annually and within 5 BD of any role change; the review requires attestation by the entitlement owner (`access.review_attestation`). Changes to financial systems or control configurations require a formal Request for Change (RFC) submitted to the Change Advisory Board (CAB) (`change.rfc.submitted`), CAB approval before deployment (`change.cab_decision.recorded`), and a post-deployment review (`change.post_review.completed`). Emergency changes require documented justification (`change.emergency_justification`) and retrospective CAB review within 2 BD. Write access to access provisioning records and change records is restricted to IT Security and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired or role changed (`access.provisioned`) | User identity (`user.id`), new role (`user.role`), manager approval (`access.manager_approval`), SOD check result (`sod.check_result`), least-privilege entitlement set (`access.role_entitlements`) | Access provisioned (`access.provisioned`); entitlement record created (`access_right.recorded`) | Day of effective date |
| Employee separated (`access.deprovisioned`) | User identity (`user.id`), employment status (`user.employment_status`), separation date (`employee.terminated`) | All access revoked (`access.deprovisioned`); deprovisioning logged | Same business day (enforced by `access.deprovision_due_at`) |
| Annual entitlement review cycle or role-change review (`access.review.completed`) | User roster (`access.user_roster`), current entitlements (`access.role_entitlements`), reviewer roster (`access.reviewer_roster`), last review date (`access.last_reviewed_at`) | Review attestation recorded (`access.review.completed`); any excess entitlements revoked (`access.revoked`) | Annual cycle (enforced by `access.review_due`); role-change review within 5 BD |
| RFC submitted for financial system or control configuration change (`change.rfc.submitted`) | RFC document (`change.rfc`), risk rating (`change.risk_rating`), backout plan (`change.backout_plan`), test evidence (`change.test_evidence`), approver (`change.approver_id`) | RFC logged (`change.rfc.submitted`); CAB review scheduled (enforced by `change.cab_review_due_at`) | Before deployment |
| CAB decision recorded (`change.cab_decision.recorded`) | CAB decision (`change.cab_decision`), approver identity | CAB decision logged (`change.cab_decision.recorded`); deployment authorized or blocked | Before deployment |
| Post-deployment review completed (`change.post_review.completed`) | Deployment record (`change.deployment_record`), test evidence (`change.test_evidence`), rollback plan (`change.rollback_plan`) | Post-deployment review logged (`change.post_review.completed`) | Within 5 BD of deployment (enforced by `change.post_review_due_at`) |
| Emergency change deployed (`change.emergency.deployed`) | Emergency justification (`change.emergency_justification`), approver identity, deployment record | Emergency deployment logged (`change.emergency.deployed`); retrospective CAB review scheduled | Retrospective CAB review within 2 BD |

**ALERTS/METRICS:** Alert fires if separated employee access is not revoked by end of separation day. Alert fires if annual entitlement review is not completed within the review window. CAB approval bypass alert fires on any deployment without a recorded CAB decision. Post-deployment review completion tracked against `change.post_review_due_at`; target: 100% completion within 5 BD.

---

## IC-06 — Exception and Override Management {#ic-06-exception-and-override-management}

**WHY (Reg cite):** [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including controls that detect and correct deviations. FFIEC/NCUA examiner guidance (COSO-aligned) requires that every control override or exception be captured with rationale and approver, that above-limit exceptions be routed for senior approval, and that override analytics be produced for management and audit review. [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) places Supervisory Committee responsibility over the adequacy of exception controls.

**SYSTEM BEHAVIOR:** Every invocation of a control override — whether a transaction limit override, a reconciliation deadline extension, an SOD compensating control, or a policy exception — is captured in real time with the rationale (`override.rationale`), the approving individual (`override.senior_approver_id`), and the senior decision (`override.senior_decision`). Overrides above a defined materiality threshold automatically trigger escalation to a senior approver (`override.escalation_required`); the escalation timer (`override.escalation.timer`) enforces a same-business-day response. All overrides are registered in the exception register (`exception.registered`) and are subject to expiry tracking (`exception.expiry.timer`). Override analytics are compiled and published monthly (`override.analytics.published`) for management review and quarterly for the Supervisory Committee. Overrides that remain open beyond their approved period are automatically flagged for revocation (`exception.reverted`). Write access to override records is restricted to the CCO; process owners may initiate but not approve their own overrides.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control override invoked by any user (`override.recorded`) | Override rationale (`override.rationale`), control being overridden (`control.id`), initiating user (`user.id`), transaction or process reference (`transaction.id`) | Override recorded (`override.recorded`); exception registered (`exception.registered`) | Real-time at point of override |
| Override above materiality threshold requiring senior approval (`override.senior_decision.recorded`) | Override record, escalation flag (`override.escalation_required`), senior approver identity (`override.senior_approver_id`), senior decision (`override.senior_decision`) | Senior decision recorded (`override.senior_decision.recorded`); escalation timer cleared | Same business day (enforced by `override.escalation.timer`) |
| Override expiry threshold reached (`exception.reverted`) | Exception record, expiry timer (`exception.expiry.timer`), expiry flag (`exception.expiring`) | Exception reverted or renewed (`exception.reverted`); CCO notified | Per approved exception period |
| Monthly override analytics report published (`override.analytics.published`) | All override records for the period, senior decision outcomes, open exception register (`exception.registered`) | Override analytics report published (`override.analytics.published`); distributed to management and CCO | Monthly (enforced by `override.analytics_due`) |

**ALERTS/METRICS:** Real-time alert to CCO on every override above the materiality threshold. Target: zero overrides without a recorded senior decision beyond 1 BD. Monthly analytics report completion tracked; target: published within 5 BD of month-end. Quarterly Supervisory Committee summary derived from monthly analytics.

---

## IC-07 — Monitoring and Self-Assessment {#ic-07-monitoring-and-self-assessment}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires ongoing monitoring of the internal control structure and reporting of results to the Supervisory Committee. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires sound business practices including monitoring of control effectiveness. FFIEC/NCUA examiner guidance (COSO-aligned) requires control self-assessments, management testing, deficiency tracking with owners and due dates, and reporting to the board and Supervisory Committee.

**SYSTEM BEHAVIOR:** The credit union performs an annual control self-assessment (CSA) cycle (`csa.cycle.opened`) covering all material processes in the control register. Each CSA produces a results record (`csa.prior_results`) and identifies any deficiencies. Deficiencies are logged immediately (`deficiency.logged`) with a severity rating (`deficiency.severity`), an assigned owner (`deficiency.owner_id`), and a remediation plan with a due date (`deficiency.plan.recorded`). Remediation progress is tracked to closure (`deficiency.closed`); retesting is required before closure (`deficiency.retest_result`). Deficiencies that are not remediated by their due date are automatically escalated. Management testing supplements the CSA on a risk-based schedule determined by the CCO. Results — including open deficiencies, remediation status, and aging — are reported to the Board and Supervisory Committee quarterly (`finding.quarterly_report.delivered`). The CCO is write-restricted on deficiency severity ratings to prevent downgrading without documented rationale.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual CSA cycle opens (`csa.cycle.opened`) | Control register (`control.register`), prior-year CSA results (`csa.prior_results`), CSA scope | CSA cycle opened (`csa.cycle.opened`); assessment tasks assigned | Annual; cycle opens Q3 each year |
| CSA completed (`csa.completed`) | CSA results for all in-scope controls, deficiency list, CCO sign-off | CSA completion recorded (`csa.completed`); deficiencies logged (`deficiency.logged`) | Annual; target: completed by Q4 |
| Deficiency identified (CSA, management test, or audit) (`deficiency.logged`) | Deficiency description (`deficiency.summary`), severity (`deficiency.severity`), source (`deficiency.source`), owner (`deficiency.owner_id`) | Deficiency logged (`deficiency.logged`); remediation plan task created (`deficiency.plan.recorded`) | Within 2 BD of identification |
| Deficiency remediation plan recorded (`deficiency.plan.recorded`) | Remediation plan, due date, owner (`deficiency.owner_id`), severity (`deficiency.severity`) | Remediation plan recorded (`deficiency.plan.recorded`); timer set (enforced by `audit.remediation_due`) | Within 5 BD of deficiency logging |
| Deficiency remediation completed and retested (`deficiency.closed`) | Retest result (`deficiency.retest_result`), closure evidence, CCO approval | Deficiency closed (`deficiency.closed`) | Per remediation due date |
| Quarterly monitoring report delivered to Board/Supervisory Committee (`finding.quarterly_report.delivered`) | Open deficiency register, remediation status, aging report (`deficiency.aging_report`), CSA results summary | Quarterly report delivered (`finding.quarterly_report.delivered`) | 15 CD after quarter-end (enforced by `finding.quarterly_report_due`) |

**ALERTS/METRICS:** Alert fires when a deficiency remediation due date is breached without closure. Critical deficiencies (severity = high) trigger immediate CCO and Supervisory Committee notification. Quarterly report delivery tracked against 15-CD deadline; target: 100% on-time. Open deficiency count and aging reported on the quarterly dashboard; target: zero critical deficiencies open beyond 90 days.

---

## IC-08 — Audit Trail and Recordkeeping {#ic-08-audit-trail-and-recordkeeping}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires internal controls over recordkeeping and the maintenance of records supporting the BSA/AML compliance program and security program. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires adequate recordkeeping as a condition of insurability. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that documentation of internal audit procedures and resulting reports be maintained for inspection by supervisory examiners. FFIEC/NCUA examiner guidance (COSO-aligned) requires complete, tamper-evident audit logs of transactions and control events, retained in line with regulatory and internal retention requirements.

**SYSTEM BEHAVIOR:** Every transaction and control event governed by this policy produces a tamper-evident audit log entry at the moment of occurrence; no post-hoc modification of log entries is permitted. Control documents (policies, procedures, CSA results, reconciliation records, override logs, authority matrices) are assigned a retention class and retention clock at creation or closure. The retention clock is set by the system at the time the document is finalized (`record.retention_clock_set`), using the retention schedule applicable to the record class (`record.retention_class`). Audit log integrity is tested at least annually on a scheduled basis; the integrity test result is recorded (`record.integrity_test.completed`). Legal-hold, destruction scheduling, and permanent-record mechanics are governed exclusively by SC-02 (embedded immediately below). Write access to audit log entries is restricted to system processes; no human user may modify or delete a log entry.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Control document created or finalized (`record.retention_clock_set`) | Document type (`record.class`), retention class (`record.retention_class`), retention schedule (`record.retention_anchor`), finalizing user (`record.actor_id`) | Retention clock set; tamper-evident log entry created (`record.retention_clock_set`) | Same day as document creation or closure |
| Audit log integrity test scheduled and completed (`record.integrity_test.completed`) | Audit log scope, test methodology, prior test result | Integrity test result recorded (`record.integrity_test.completed`) | Annual (enforced by `record.integrity_test_due`) |

**ALERTS/METRICS:** Alert fires if any audit log entry is modified or deleted (target: zero occurrences). Alert fires if the annual integrity test is not completed within the scheduled window. Retention clock coverage metric: 100% of finalized control documents must have a retention clock set within 1 BD of finalization.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires retention of records supporting the security program and BSA/AML compliance program. [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) requires adequate recordkeeping as a condition of share insurance. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that internal audit documentation be maintained for inspection. General retention obligations for credit union records are established by NCUA and applicable state law; specific schedules are maintained in the Record Retention Policy and Schedule A.

**SYSTEM BEHAVIOR:** Once a retention clock is set (by the consuming policy's control), the lifecycle engine takes over: it monitors expiry, enforces legal-hold suspension, routes eligible records to destruction, and logs every state transition in a tamper-evident chain. A record may not be destroyed while a legal hold is active (`record.legal_hold_flag = true`); the destruction clock is suspended and resumes only after the hold is released and confirmed (`legal_hold.clear.confirmed`). Permanent records (`record.retention_class = permanent`) are never routed to destruction. The destruction method (`record.disposal_method`) must match the sensitivity of the record class. All destruction events produce a destruction certificate (`disposal.certificate.recorded`) and a destruction log entry (`destruction_log.entry.created`). Any mismatch between the destruction log and the manifest triggers an immediate alert (`destruction_log.mismatch.detected`). Write access to retention schedules and legal-hold flags is restricted to the Records Manager and Legal; no operational user may modify a retention clock or hold flag without documented authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention clock expires and no legal hold is active (`record.retention.expired`) | Record class (`record.retention_class`), retention anchor (`record.retention_anchor`), retention schedule (`record.retention_class`), legal hold flag (`record.legal_hold_flag`), disposal eligibility (`record.disposal_eligible`) | Record marked disposal-eligible; disposal scheduled (`disposal.scheduled`); expiry logged (`record.retention.expired`) | Same day as expiry |
| Legal hold placed on a record (`record.hold.placed`) | Matter ID (`record.hold_matter_id`), hold scope (`record.hold_scope`), hold authorizer (`record.hold_authorizer`), legal hold flag set (`record.legal_hold_flag`) | Hold placed (`record.hold.placed`); destruction clock suspended; hold registry updated (`record.hold_registry`) | Same day as legal hold order |
| Legal hold released and confirmed (`legal_hold.clear.confirmed`) | Hold release authorization (`record.hold_release_auth`), matter closure confirmation, legal hold flag cleared | Hold released (`record.hold.released`); destruction clock resumed; confirmation logged (`legal_hold.clear.confirmed`) | Within 1 BD of hold release authorization |
| Record destruction executed (`record.destroyed`) | Disposal method (`record.disposal_method`), batch manifest, destruction certificate, destruction log entry (`destruction_log.entry_id`) | Destruction certificate recorded (`disposal.certificate.recorded`); destruction log entry created (`destruction_log.entry.created`); record marked destroyed (`record.destroyed`) | Per destruction schedule |
| Destruction log mismatch detected (`destruction_log.mismatch.detected`) | Destruction log (`destruction_log.entry_id`), manifest, mismatch detail (`destruction_log.mismatch`) | Mismatch alert issued (`destruction_log.mismatch.detected`); investigation opened | Immediate; alert within minutes of detection |

**ALERTS/METRICS:** Alert fires on any `destruction_log.mismatch.detected` (target: zero unresolved mismatches beyond 1 BD). Alert fires if a record past its retention expiry date has not been routed to destruction within 5 BD (excluding legal-hold suspensions). Legal-hold registry completeness: 100% of active holds must have a corresponding `record.hold_registry` entry. Destruction certificate issuance rate: 100% of destruction events must produce a certificate.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; framework maintenance; CCO approval authority |
| **Board of Directors** | Annual framework approval; oversight of Supervisory Committee reports |
| **Supervisory Committee** | Annual framework review; quarterly monitoring report receipt; control adequacy oversight per [12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b) and [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) |
| **Finance** | Reconciliation ownership; authority matrix concurrence |
| **Internal Audit** | Independent testing; deficiency identification; CSA support |
| **Process Owners** | Control operation within their processes; deficiency remediation |
| **IT Security** | Access provisioning and deprovisioning execution; SOD matrix maintenance |

**Review cadence:** Annual, or upon material change to the credit union's risk profile, organizational structure, regulatory environment, or control framework. Next scheduled review: 2026-07-01.

**Cross-references:**
- Information Security Policy (logical-access technical controls)
- Enterprise Risk Management Policy (risk appetite and taxonomy)
- Audit Policy (Internal Audit and Supervisory Committee audit execution and scope)
- BSA Policy (BSA/AML program controls)
- Third-Party Risk Policy (vendor control assurance, SOC reports)
- Record Retention Policy and Schedule A (retention schedules)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above are not yet confirmed as registered in `core-vocabulary.json` for the internal-controls domain. Codes used follow the Composition grammar and registered-code preference rules. Specific provisional codes used include: `process.description`, `process.owner_id`, `process.risk_rating`, `control.id`, `transaction.type`, `transaction.id`, `override.approver_id` (mapped to registered `override.senior_approver_id`), `deficiency.summary`, `record.integrity_test_due` (composed as `record.<test>.due_at` per Task grammar). Engineering must confirm or register these before the next policy review.

- **Dual-control threshold not specified.** Patrick's notes require dual control for "high-risk transactions" but do not define the dollar or transaction-type threshold. This policy assumes the threshold is defined in the authority matrix (`authority_matrix.role_limits`) and maintained by Finance with CCO approval. The specific threshold must be documented in the authority matrix before this control is operationally effective.

- **Reconciliation aging schedule not fully specified.** Patrick's notes require escalation of aged reconciling items "within defined timeframes" but do not specify the exact aging thresholds. This policy assumes 30-day escalation to Finance and 60-day escalation to CCO as the minimum viable schedule. Finance and the CCO must confirm or adjust these thresholds.

- **Override materiality threshold not specified.** Patrick's notes require senior approval for "above-limit exceptions" but do not define the materiality threshold. This policy assumes the threshold is defined in the authority matrix and maintained by Finance with CCO approval. The specific threshold must be documented before IC-06 is operationally effective.

- **CSA scope and management testing schedule.** Patrick's notes require "ongoing control self-assessments and management testing" but do not specify the scope of management testing beyond the annual CSA. This policy assumes management testing is performed on a risk-based schedule determined by the CCO. The CCO must document the testing schedule as part of the annual CSA cycle.

- **NCUA Part 748 scope.** This policy references 12 CFR Part 748 for recordkeeping and access control obligations. Part 748 also governs the BSA/AML compliance program and suspicious activity reporting; those controls are explicitly out of scope and governed by the BSA Policy. The boundary between this policy and the BSA Policy should be confirmed with the CCO.

- **Third-party service provider controls.** This policy states it applies to third-party service providers acting on the credit union's behalf, but the specific control requirements for third parties (e.g., SOD verification, access review, reconciliation) are not detailed here. Detailed third-party control assurance requirements are governed by the Third-Party Risk Policy. The CCO should confirm that the Third-Party Risk Policy adequately addresses the internal control obligations for material service providers.

- **Approver independence.** This policy has a single approver (Patrick Wilson, CCO) who is also the policy owner. For policies of this significance, best practice and NCUA examiner expectations typically require at least one independent approver (e.g., Board Chair or Supervisory Committee Chair). This gap should be addressed at the next governance review.

- **SC-02 embeddable block source.** The SC-02 block above was generated from the policy prompt instructions and Patrick's notes, as `shared-controls/record-retention-mechanics.md` was not available as a separate file input. Engineering and Compliance must verify that the SC-02 block emitted here is byte-identical to the canonical version in `shared-controls/record-retention-mechanics.md` before publication.
