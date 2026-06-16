---
title: Internal Controls Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Internal Controls, Segregation of Duties, Reconciliation, Access, Override, Audit Trail]
---

## General Policy Statement

Pynthia Credit Union maintains a system of internal control — segregation of duties, authorizations, reconciliations, access controls, override discipline, and management oversight — that safeguards member assets, ensures reliable financial reporting, and promotes compliance with law. The framework applies to all operational and financial processes, business units, employees, and supporting systems, including activities third-party service providers perform on the credit union's behalf. Control risk is concentrated wherever a single person could initiate, approve, record, and conceal a transaction; this policy is engineered to detect and block those concentrations and to give the Board and Supervisory Committee timely, reliable evidence that controls operate as designed.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Control framework annual review | Framework review timer fires (`control.framework_review_due_at`) | Annually | Reviewed framework + board approval | [IC-01](#ic-01-control-environment-and-governance) |
| Incompatible-duty grant attempt | Entitlement requested triggers SoD check (`access.entitlement_requested`) | Real time (block) | SoD conflict logged, grant blocked | [IC-02](#ic-02-segregation-of-duties) |
| High-risk transaction initiated | Transaction needs approval (`transaction.approval_recorded`) | Before execution | Documented approval + dual control | [IC-03](#ic-03-authorization-and-approval-limits) |
| Daily cash / high-volume recon | Daily recon timer fires (`recon.daily_due`) | End of business day (internal: same BD) | Completed reconciliation | [IC-04](#ic-04-reconciliations) |
| Other GL / subledger recon | Monthly recon timer fires (`recon.monthly_due`) | Month-end + 10 BD | Completed reconciliation | [IC-04](#ic-04-reconciliations) |
| Aged reconciling item | Item aging timer fires (`recon.item_aging_timer`) | 30 days (internal: escalate at 30, resolve by 60) | Escalation + resolution | [IC-04](#ic-04-reconciliations) |
| Entitlement review | Access review timer fires (`access.review_due`) | Annually + on role change | Completed entitlement review | [IC-05](#ic-05-access-and-change-controls) |
| Change to financial system | RFC submitted (`change.rfc_submitted`) | Before deployment | CAB decision + post-review | [IC-05](#ic-05-access-and-change-controls) |
| Control override invoked | Override recorded (`override.recorded`) | Real time; senior approval within 1 BD | Override record + analytics | [IC-06](#ic-06-exception-and-override-management) |
| Control self-assessment cycle | CSA cycle opens (`csa.cycle_opened`) | Per cycle | CSA results + deficiency tracking | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Deficiency identified | Deficiency logged (`deficiency.logged`) | Remediate by owner due date | Remediation to closure | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Quarterly results to Board/Supervisory Committee | Quarterly report timer fires (`finding.quarterly_report_due`) | Quarterly | Board/Supervisory Committee report | [IC-07](#ic-07-monitoring-and-self-assessment) |
| Control event / transaction recorded | Any control or transaction event (`event.created`) | Real time | Tamper-evident audit entry | [IC-08](#ic-08-audit-trail-and-recordkeeping) |
| Record retention expiry | Retention timer fires (`record.retention_expires_at`) | Per schedule (hold-aware) | Disposal certificate | [IC-08](#ic-08-audit-trail-and-recordkeeping) |

## IC-01 — Control Environment and Governance  {#ic-01-control-environment-and-governance}

- **WHY (Reg cite):** The Federal Credit Union Act vests the Supervisory Committee with the duty to ensure internal controls are established and effectively maintained ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b)); sound internal controls and recordkeeping are a condition of insurability ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)), and Part 715 requires an internal control structure supporting the annual Supervisory Committee audit ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)). FFIEC/NCUA examiner guidance expects a COSO-aligned control environment.

- **SYSTEM BEHAVIOR:** The credit union maintains a control register naming an owner for each material process; the framework is approved by the Board and reviewed at least annually, with the Supervisory Committee exercising oversight. A timer drives the annual review; if a control owner role is vacated, an owner-vacancy timer opens a remediation task so no material process is left unowned. The control register and framework approval status are write-restricted to Compliance; process owners hold read access to their own entries.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Framework annual review due (`control.framework_review_due_at`) | Control register (`control.register`), prior framework, owner roster (`control.owner_vacated`) | Reviewed framework presented for approval (`governance.board_cycle_opened`) | Annually (enforced by `control.framework_review_due_at`) |
  | Board approves framework (`control.framework_approved`) | Reviewed framework, board agenda (`board.agenda_id`) | Approved framework + board minutes (`board.minutes_recorded`) | Annually (internal: at the approving board meeting) |
  | Control owner assigned to a process (`control.owner_assigned`) | Process identifier (`process.id`), owner identity (`control.register`) | Ownership recorded in register (`control.owner_assigned`) | At process onboarding (internal: 5 BD) |
  | Control owner role vacated (`risk.ownership_gap_detected`) | Vacancy reason (`control.vacancy_reason`), affected process (`process.id`) | Ownership-gap flagged for reassignment (`risk.ownership_gap_detected`) | Reassign within owner-vacancy window (enforced by `control.owner_vacancy_timer`) |

- **ALERTS/METRICS:** Alert when the annual framework review is past due or an owner-vacancy timer ages beyond its window; target zero material processes without a named owner and zero overdue framework reviews.

## IC-02 — Segregation of Duties  {#ic-02-segregation-of-duties}

- **WHY (Reg cite):** Separation of incompatible duties so no individual controls all phases of a transaction is the foundation of insurable internal control under [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and the internal-control structure required by [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715), consistent with COSO control activities expected by FFIEC/NCUA guidance.

- **SYSTEM BEHAVIOR:** A versioned SoD matrix defines incompatible duty combinations across initiation, authorization, custody, recording, and reconciliation. At entitlement-request time the system evaluates the requested role against the matrix and blocks any grant that would create a conflict, logging the attempt. Where separation is operationally impractical, a documented compensating control (job rotation or supervisory review) may be approved in lieu of blocking; that exception is itself routed through [IC-06](#ic-06-exception-and-override-management). The SoD matrix is write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Entitlement requested (`access.entitlement_requested`) | Requested role (`access.role_id`), role entitlements (`access.role_entitlements`), SoD matrix version (`sod.matrix_version`) | SoD check result (`sod.conflict_detected`) | Real time (synchronous to request) |
  | Incompatible combination detected (`sod.conflict_detected`) | Conflict detail (`sod.check_result`), requester identity (`access.agent_identity`) | Grant blocked + violation logged (`sod.violation_logged`) | Real time (block) |
  | Compensating control proposed for impractical separation (`sod.compensating_control_proposed`) | Rationale (`sod.risk_rationale`), proposed control (`sod.compensating_control`) | Compensating control approved/recorded (`sod.compensating_control_approved`) | Before grant (internal: 2 BD) |

- **ALERTS/METRICS:** Alert on every blocked-grant attempt and on any compensating control approaching its review timer (`sod.review_timer`); target zero approved exceptions without a documented compensating control and trend the count of blocked attempts.

## IC-03 — Authorization and Approval Limits  {#ic-03-authorization-and-approval-limits}

- **WHY (Reg cite):** Documented authorization within defined limits, with heightened control over high-risk transactions, is a required control activity under the insurability standard ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and the internal-control structure supporting the Supervisory Committee audit ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

- **SYSTEM BEHAVIOR:** A role-based authority matrix sets transaction and approval limits; transactions requiring approval are gated until a documented approval is recorded before execution, and transactions flagged high-risk additionally require dual control. Changes to the authority matrix require documented rationale and Finance concurrence. The authority matrix is write-restricted to Compliance and Finance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Transaction initiated requiring approval (`transaction.approval_recorded`) | Initiator (`transaction.initiated_by`), amount, approval-required flag (`transaction.approval_required`), authority matrix limits (`authority_matrix.role_limits`) | Documented approval recorded (`transaction.approval_recorded`) | Before execution (enforced by `transaction.approval_timer`) |
  | High-risk transaction requires second control (`transaction.dual_control_completed`) | Dual-control-required flag (`transaction.dual_control_required`), second approver identity (`access.agent_identity`) | Dual control completed (`transaction.dual_control_completed`) | Before execution (internal: synchronous) |
  | Authority matrix change proposed (`authority.matrix_change_proposed`) | Change rationale (`authority.change_rationale`), Finance concurrence (`authority.finance_concurrence`), matrix entry (`authority.matrix_entry`) | Updated authority matrix (`authority.matrix_updated`) | Before effective (internal: 5 BD) |

- **ALERTS/METRICS:** Alert on any approval timer aging past its execution gate and on dual-control completion latency for high-risk transactions; target zero executed transactions lacking a recorded pre-execution approval.

## IC-04 — Reconciliations  {#ic-04-reconciliations}

- **WHY (Reg cite):** Timely reconciliation of general ledger, subsidiary, suspense, and clearing accounts evidences asset safeguarding and reliable reporting required for insurability ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and supports the Supervisory Committee's verification duty ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b); [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

- **SYSTEM BEHAVIOR:** Cash and high-volume accounts reconcile daily; other GL, subledger, suspense, and clearing accounts reconcile monthly. Reconciling items carry an age and owner; items breaching the aging threshold escalate automatically and must resolve within defined timeframes. Suspense and clearing entries follow the same aging discipline (`gl.cash_suspense.aged`). Reconciliation completion and item resolution are write-restricted to Finance with Compliance read access.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily reconciliation due (`recon.daily_due`) | GL balances (`gl.balances`), trial balance (`gl.trial_balance`), recon item set (`recon.item`) | Daily reconciliation completed (`recon.daily_completed`) | End of business day (enforced by `recon.daily_timer`) |
  | Monthly reconciliation due (`recon.monthly_due`) | GL balances (`gl.balances`), subledger balances, recon item set (`recon.item`) | Monthly reconciliation completed (`recon.monthly_completed`) | Month-end + 10 BD (enforced by `recon.monthly_timer`) |
  | Reconciling item ages past threshold (`recon.item_aged`) | Item age (`recon.item_age_days`), owner (`recon.item_owner`), research notes (`recon.research_notes`) | Aged item escalated (`recon.item_escalated`) | Escalate at 30 days (enforced by `recon.item_aging_timer`) |
  | Aged item researched and cleared (`recon.item_resolved`) | Research notes (`recon.research_notes`), suspense entry (`gl.cash_suspense.item`) | Item resolved + suspense cleared (`recon.item_resolved`, `gl.cash_suspense.cleared`) | Resolve by 60 days (internal SLA) |

- **ALERTS/METRICS:** Alert on any daily recon not completed by EOD, any monthly recon past month-end + 10 BD, and the aging distribution of open reconciling items; target zero items aged beyond 60 days.

## IC-05 — Access and Change Controls  {#ic-05-access-and-change-controls}

- **WHY (Reg cite):** Least-privilege provisioning, periodic entitlement review, and change-management approval over financial systems and control configurations are control activities required for insurable operations ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and the internal-control structure under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715). (Technical logical-access controls live in the Information Security Policy.)

- **SYSTEM BEHAVIOR:** Access is provisioned on least-privilege and need-to-know with manager approval and justification; entitlements are reviewed at least annually and on role change, and access is deprovisioned promptly on separation. Changes to financial systems and control configurations require a submitted RFC, CAB approval before deployment, and a post-implementation review; emergency changes use the emergency-approval path and are reviewed retroactively. Access provisioning and review attestation are write-restricted to Compliance and the entitlement reviewers named in the roster.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Access entitlement requested (`access.entitlement_requested`) | Requested role (`access.role_id`), justification (`access.justification`), manager approval (`access.manager_approval`) | Access provisioned on least-privilege (`access.provisioned`) | At onboarding/role change (internal: 2 BD) |
  | Entitlement review due (`access.review_due`) | Reviewer roster (`access.reviewer_roster`), current entitlements (`access.role_entitlements`), last reviewed date (`access.last_reviewed_at`) | Review attestation completed (`access.review_completed`) | Annually + on role change (enforced by `access.review_due`) |
  | Employee separated (`employee.separated`) | User identity (`user.id`), employment status (`user.employment_status`) | Access deprovisioned (`access.deprovisioned`) | Promptly (enforced by `access.deprovision_due_at`) |
  | Change to financial system submitted (`change.rfc_submitted`) | Change detail (`change.requested`), risk rating (`change.risk_rating`), test evidence (`change.test_evidence`), backout plan (`change.backout_plan`) | CAB decision recorded (`change.cab_decision_recorded`) | Before deployment (enforced by `change.cab_review_due_at`) |
  | Change deployed (`change.completed`) | Deployment record (`change.deployment_record`), approver (`change.approver_id`) | Post-implementation review completed (`change.post_review_completed`) | Post-deploy (enforced by `change.post_review_due_at`) |

- **ALERTS/METRICS:** Alert on entitlement reviews past due, separations with access not deprovisioned within SLA, and financial-system changes deployed without recorded CAB approval; target zero standing entitlements beyond their review window and zero un-reviewed emergency changes.

## IC-06 — Exception and Override Management  {#ic-06-exception-and-override-management}

- **WHY (Reg cite):** Capturing every control override with rationale and approver, escalating above-limit exceptions, and producing override analytics for management and audit is a control-monitoring expectation under the insurability standard ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)) and supports the Supervisory Committee audit's reliance on controls ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

- **SYSTEM BEHAVIOR:** Every control override or exception is recorded with rationale and approver at the moment it is invoked; overrides above the configured limit route for senior approval, and periodic override analytics are produced for management and audit. Registered exceptions carry an expiry so they cannot become permanent silently; an expiry timer reverts or re-reviews the exception. Override records and senior-approval decisions are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Control override invoked (`control.override_invoked`) | Rationale (`override.rationale`), invoking user (`access.agent_identity`), escalation-required flag (`override.escalation_required`) | Override recorded (`override.recorded`) | Real time (at invocation) |
  | Above-limit override needs senior approval (`override.recorded`) | Senior approver (`override.senior_approver_id`), rationale (`override.rationale`) | Senior decision recorded (`override.senior_decision_recorded`) | 1 BD (enforced by `override.escalation_timer`) |
  | Exception registered with expiry (`exception.registered`) | Risk acceptance (`exception.risk_acceptance`), rationale (`exception.rationale`) | Exception registered; revert scheduled (`exception.reverted`) | Expire/re-review by set date (enforced by `exception.expiry_timer`) |
  | Override analytics cycle due (`override.analytics_published`) | Override population, escalation outcomes (`override.senior_approver_id`) | Override analytics published for management/audit (`override.analytics_published`) | Per cycle (enforced by `override.analytics_due`) |

- **ALERTS/METRICS:** Alert on above-limit overrides awaiting senior approval past 1 BD and on exceptions nearing expiry; target zero overrides without rationale/approver and zero expired-but-still-active exceptions.

## IC-07 — Monitoring and Self-Assessment  {#ic-07-monitoring-and-self-assessment}

- **WHY (Reg cite):** Ongoing control self-assessment, management testing, deficiency tracking to remediation, and reporting to the Board and Supervisory Committee operationalize the monitoring component expected by FFIEC/NCUA guidance and the Supervisory Committee's oversight duty ([12 U.S.C. §1761b](https://www.law.cornell.edu/uscode/text/12/1761b); [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)). (Audit execution and scope are governed by the Audit Policy.)

- **SYSTEM BEHAVIOR:** Control self-assessments and management testing run on a defined cycle; identified deficiencies are logged with an owner and due date, tracked through remediation, and re-tested before closure. Monthly deficiency review and quarterly reporting roll results to the Board and Supervisory Committee. Critical or aging deficiencies escalate automatically. CSA results, deficiency status, and Board reporting are write-restricted to Compliance, with management owners able to update remediation status on their own items.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CSA cycle opens (`csa.cycle_opened`) | Prior results (`csa.prior_results`), sample spec (`monitoring.sample_spec`) | CSA completed (`csa.completed`) | Per cycle (enforced by `csa.cycle_timer`) |
  | Deficiency identified (`deficiency.logged`) | Source (`deficiency.source`), severity (`deficiency.severity`), owner (`deficiency.owner_id`) | Remediation plan recorded (`deficiency.plan_recorded`) | Plan by set date (enforced by `deficiency.plan_timer`) |
  | Remediation submitted (`deficiency.remediation_submitted`) | Retest result (`deficiency.retest_result`), closure evidence (`finding.closure_evidence`) | Deficiency closed after verification (`deficiency.closed`, `finding.closure_verified`) | By owner due date (enforced by `audit.remediation_timer`) |
  | Deficiency ages past threshold (`finding.aging_threshold_breached`) | Aging report (`deficiency.aging_report`), severity (`deficiency.severity`) | Critical/aged deficiency escalated (`finding.critical_escalated`) | At threshold (enforced by `finding.escalation_due_at`) |
  | Quarterly reporting due (`finding.quarterly_report_due`) | Open/closed deficiency population, monthly review record (`finding.monthly_review_recorded`) | Board/Supervisory Committee report delivered (`finding.quarterly_report_delivered`) | Quarterly (enforced by `finding.quarterly_report_due`) |

- **ALERTS/METRICS:** Alert on deficiencies past remediation due date, the open-deficiency aging distribution, and any missed CSA cycle or quarterly report; target zero overdue critical deficiencies and 100% on-time Board/Supervisory Committee reporting.

## IC-08 — Audit Trail and Recordkeeping  {#ic-08-audit-trail-and-recordkeeping}

- **WHY (Reg cite):** Complete, tamper-evident audit logs of transactions and control events and retention of control documentation are required for the security/recordkeeping program ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)) and for insurable recordkeeping ([12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)); the records must support the Supervisory Committee audit ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)). (General retention schedules are set by the Record Retention Policy.)

- **SYSTEM BEHAVIOR:** Every transaction and control event is written to an immutable, tamper-evident audit log keyed by event code, actor, and timestamp; integrity tests run periodically to confirm the chain is intact. Control documentation is retained on its retention schedule with disposal blocked while a legal hold is in place; the retention clock resumes on hold release. Audit-log configuration and record-disposal authority are write-restricted to Compliance; sensitive-record access is logged.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Transaction or control event occurs (`event.created`) | Event code (`event.code`), actor (`record.actor_id`), resource reference (`event.resource_id`) | Tamper-evident audit entry written (`record.access_logged`) | Real time (synchronous) |
  | Audit-log integrity test due (`record.integrity_test_completed`) | Integrity test scope (`record.integrity_test_due`), checksum chain (`records_package.checksum_chain`) | Integrity test completed (`record.integrity_test_completed`) | Per cycle (enforced by `record.integrity_test_due`) |
  | Legal hold placed on control records (`record.hold_placed`) | Hold matter (`record.hold_matter_id`), hold scope (`record.hold_scope`), authorizer (`record.hold_authorizer`) | Hold applied; disposal suspended (`record.hold_applied`) | Real time (on hold) |
  | Retention period expires (`record.retention_expires_at`) | Retention class (`record.retention_class`), disposal eligibility (`record.disposal_eligible`), hold status (`record.hold_status`) | Disposal executed + certificate recorded (`record.destroyed`, `record.destruction_certified`) | Per schedule, hold-aware (enforced by `record.retention_expires_at`) |

- **ALERTS/METRICS:** Alert on any audit-log integrity test failure, gaps in the event chain, and disposals attempted while a hold is active; target zero integrity-test failures and zero records destroyed under legal hold.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the internal control framework, the control register, and the consolidated SoD, authority, exception, and reconciliation configurations.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer. Board and Supervisory Committee exercise oversight per [IC-01](#ic-01-control-environment-and-governance) and receive monitoring results per [IC-07](#ic-07-monitoring-and-self-assessment).
- **Participants:** Process owners (control execution and remediation), Finance (reconciliations and authority-matrix concurrence), Internal Audit and the Supervisory Committee (independent assurance and reporting recipients).
- **Review cadence:** At least annually (next review {{2027-06-16}}) and upon material change to processes, systems, or regulation, driven by the framework review timer in [IC-01](#ic-01-control-environment-and-governance).
- **Cross-references:** Information Security Policy (logical-access technical controls), Enterprise Risk Management Policy (risk appetite/taxonomy), Audit Policy (audit execution and scope), BSA Policy (BSA/AML program controls), Third-Party Risk Policy (vendor control assurance), Record Retention Policy (retention schedules).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several control-event and field codes referenced in the overlays are not registered in the parsed core vocabulary (which is banking-core only) and are used here as the target naming scheme to be confirmed by engineering before the next review. Codes coined under the composition grammar from registered subjects/verbs/task types include: `control.framework_approved`, `control.owner_assigned`, `control.override_invoked`, `authority.matrix_change_proposed`, `authority.matrix_updated`, `transaction.approval_recorded`, `transaction.dual_control_completed`, `sod.compensating_control_proposed`, `sod.compensating_control_approved`, and the use of `risk.ownership_gap_detected` for control-owner vacancy. Existing registered codes were reused wherever they fit (e.g., `recon.*`, `access.*`, `change.*`, `override.*`, `deficiency.*`, `finding.*`, `csa.*`, `event.created`, `record.*`).
- **Deadline numerics for reconciling-item aging and monthly recon are internal assumptions.** PATRICK_NOTES require "defined timeframes" but do not state them; this policy assumes escalation at 30 days, resolution by 60 days, and monthly recon completion by month-end + 10 business days. Confirm against operating procedures.
- **High-risk transaction definition is delegated to configuration.** The set of transactions requiring dual control under [IC-03](#ic-03-authorization-and-approval-limits) is driven by the `transaction.dual_control_required` flag and the authority matrix; the criteria themselves are assumed to be maintained in procedure and confirmed by Finance/Compliance.
- **Override and exception cadence/limits are configuration-driven assumptions.** The above-limit threshold for senior approval, the 1-business-day escalation SLA, and the override-analytics cycle in [IC-06](#ic-06-exception-and-override-management) are assumed defaults pending confirmation.
- **Audit-log tamper-evidence mechanism is assumed.** [IC-08](#ic-08-audit-trail-and-recordkeeping) assumes a checksum/hash-chained immutable log with periodic integrity testing; the specific cryptographic and storage controls are owned by the Information Security Policy and assumed available.
- **Charter/insurability and Supervisory Committee applicability.** Authorities are cited on the assumption that Pynthia is a federally insured credit union subject to NCUA Parts 715, 741, and 748 and FCU Act §1761b; if the charter differs (e.g., state-chartered with a different examiner), the WHY citations should be re-mapped.
- **Several reused codes carry a generic subject.** Suspense/clearing aging reuses `gl.cash_suspense.*` and aged-item handling reuses `recon.item_*`; if a distinct clearing-account subject is later required, it should be registered rather than coined ad hoc.
