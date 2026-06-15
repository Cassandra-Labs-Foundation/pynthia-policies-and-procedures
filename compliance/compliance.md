---
title: Compliance Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, CMS, Governance, Regulatory Change, Training, Monitoring, Audit]
---

## General Policy Statement

Pynthia Credit Union maintains a Compliance Management System (CMS) built to **Prevent, Detect, and Correct** compliance issues across all products, channels, and partners, and to keep the credit union in compliance with all applicable federal and California (DFPI) consumer-protection laws and regulations. This policy governs the CMS framework only — Board oversight, the compliance reporting line, the inventory of applicable laws, roles and responsibilities, risk assessments, training, monitoring and assurance reviews, independent audit, regulatory-change and complaint intake, and review cadence. Substantive product rules (BSA/AML, fair lending, privacy/GLBA, collections, Reg O, audit charter, record-retention schedules) live in their owning policies and are out of scope here. The compliance function reports directly to the Board (or its Audit/Risk committee) on a line that does not route through executive management, preserving independence.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Compliance Officer reports to Board | Board cycle opens (`governance.board_cycle_opened`) | Quarterly | Reg changes, policies for approval, training, audit/exam findings + corrective actions | [CMP-01](#cmp-01-governance--board-reporting-line) |
| Applicable-law inventory refresh | Inventory review due (`regulation.inventory_review_due_at`) | At least annually + on regulatory change | Federal + CA/DFPI law inventory | [CMP-02](#cmp-02-scope-of-applicable-laws) |
| Compliance Officer vacancy | CCO cannot serve (`compliance.backup_activated`) | Immediate (designate backup) | CFO and/or Operations Officer assumes duties | [CMP-03](#cmp-03-roles--responsibilities) |
| Compliance risk assessment | Risk assessment due (`compliance.risk_assessment_due_at`) | At least annually | Prioritized risk inventory driving monitoring | [CMP-04](#cmp-04-compliance-risk-assessments) |
| New-hire onboarding training | Employee hired (`employee.hired`) | Within onboarding window | Baseline compliance curriculum | [CMP-05](#cmp-05-training-standards) |
| Annual refresher training | Annual cycle opens (`training.annual_cycle_opened`) | Annually | Role-based refresher + attestation | [CMP-05](#cmp-05-training-standards) |
| Monitoring & assurance review | Monitoring review due (`monitoring.review_due_at`) | Per risk-based schedule (trailing 12-mo coverage) | Reviewed scope + findings, replicable | [CMP-06](#cmp-06-monitoring--assurance-reviews) |
| Independent compliance audit | Compliance audit due (`audit.compliance_audit_due_at`) | At least annually | External review of assurance reviews; findings to Board | [CMP-07](#cmp-07-independent-audit) |
| Regulatory correspondence intake | Correspondence received (`regulatory.correspondence_received`) | Analyze + implement timely | Change analysis; procedure + training updates | [CMP-08](#cmp-08-regulatory-change-management) |
| Consumer complaint as compliance signal | Complaint logged (`complaint.logged`) | Trend review per cadence | Trend/pattern analysis feeding CMS | [CMP-09](#cmp-09-complaint-management-signal) |
| Policy & CMS re-approval | Board review starts (`policy.board_review_started`) | At least annually + on material change | Board-approved policy version | [CMP-10](#cmp-10-policy--cms-review-cadence) |

## CMP-01 — Governance & Board Reporting Line  {#cmp-01-governance--board-reporting-line}

**WHY (Reg cite):** Effective compliance management requires active Board oversight and an independent compliance function, the foundational expectation of every prudential and consumer regulator (see the [CFPB Supervision and Examination Manual — Compliance Management Review](https://www.consumerfinance.gov/compliance/supervisory-guidance/) and DFPI authority under the [California Consumer Financial Protection Law](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=24.&lawCode=FIN)). The credit union supervisory framework for board governance is anchored in [NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701).

**SYSTEM BEHAVIOR:** The compliance function reports to the Board (or its Audit/Risk committee) on a line that does not route through executive management. At least quarterly the Compliance Officer delivers a Board report covering pending regulatory changes, policies submitted for approval, training status, and audit/exam findings with management responses and corrective actions; receipt is logged at the Board. The reporting line is enforced at the governance layer and the Board report package is write-restricted to Compliance and the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board governance cycle opens (`governance.board_cycle_opened`) | Reg-change summary (`regulatory.change_analysis_logged`), policies for approval (`policy.document_id`), training metrics (`board_pack.training_metrics`), audit/exam findings + corrective actions (`audit_detail.corrective_action`) | Compliance Board report delivered (`compliance.board_report_delivered`) | Quarterly (enforced by `compliance.board_report_due_at`) |
| Board receives the report package (`board.package_receipt_logged`) | Report ID (`compliance.board_report_id`), meeting date (`board.meeting_date`) | Board minutes recorded (`board.minutes_recorded`) | Same meeting (no statutory deadline) |

**ALERTS/METRICS:** Aging alert when a quarterly Board report is overdue against `compliance.board_report_due_at` (target zero overdue); flag any quarter with no logged `board.package_receipt_logged`.

## CMP-02 — Scope of Applicable Laws  {#cmp-02-scope-of-applicable-laws}

**WHY (Reg cite):** The credit union must know and track every law applicable to its products and activities — the consumer-protection core including [ECOA/Reg B (12 CFR Part 1002)](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z (12 CFR Part 1026)](https://www.ecfr.gov/current/title-12/part-1026), [HMDA/Reg C (12 CFR Part 1003)](https://www.ecfr.gov/current/title-12/part-1003), [Reg CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229), [Reg E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005), [Reg DD (12 CFR Part 1030)](https://www.ecfr.gov/current/title-12/part-1030), [GLBA/Reg P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016), [FCRA (15 USC 1681)](https://www.law.cornell.edu/uscode/text/15/1681), and the [Fair Housing Act (42 USC 3605)](https://www.law.cornell.edu/uscode/text/42/3605) — plus the [CCFPL (Cal. Fin. Code Div. 24)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=24.&lawCode=FIN) and DFPI-examined California overlays.

**SYSTEM BEHAVIOR:** Compliance maintains a current inventory of all applicable federal and California laws and regulations mapped to the products and activities they govern. The inventory is reviewed on a fixed cadence and on detection of a regulatory change, with each entry carrying its citation. The inventory register is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Inventory review cycle due (`regulation.inventory_review_due_at`) | Current inventory (`regulation_inventory.citation`), product/activity mapping (`regulation.citation`) | Inventory reviewed (`regulation.inventory_reviewed`) | At least annually (enforced by `regulation.inventory_review_due_at`) |
| Regulatory change detected (`regulatory.change_identified`) | Change source (`regulatory.source_doc`), affected citation (`regulation.citation`) | Inventory updated (`regulation.inventory_updated`) | Promptly on change (internal: 30 days) |

**ALERTS/METRICS:** Aging alert when inventory review passes `regulation.inventory_review_due_at`; count of identified regulatory changes not yet reflected in the inventory (target zero past internal SLA).

## CMP-03 — Roles & Responsibilities  {#cmp-03-roles--responsibilities}

**WHY (Reg cite):** A designated compliance officer with clear authority and a continuity plan is a baseline supervisory expectation for credit-union governance ([NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)) and consumer-compliance management ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/)).

**SYSTEM BEHAVIOR:** The Compliance Officer owns the CMS — risk assessments, policies/procedures/internal controls, training coordination, complaint monitoring, and exam/consultant/auditor coordination. Department managers are responsible for compliance in their functional areas. If the Compliance Officer cannot serve, the designated backup (CFO and/or Operations Officer) assumes duties until a successor is appointed. The compliance role register is write-restricted to Compliance and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compliance role assigned or backup designated (`compliance.role_assigned`) | Role definition (`role.definition`), effective date (`role.effective_date`), officer identity (`compliance.officer_vacancy`) | Role register updated (`compliance.role_register_updated`) | On assignment (no statutory deadline) |
| Compliance Officer cannot serve (`compliance.backup_activated`) | Vacancy flag (`compliance.officer_vacancy`), backup designation (`covered_person.designated`) | Backup activated (`compliance.backup_activated`) | Immediate (internal: same business day) |

**ALERTS/METRICS:** Alert on any open `compliance.officer_vacancy` with no activated backup (target zero); track days-to-successor-appointment.

## CMP-04 — Compliance Risk Assessments  {#cmp-04-compliance-risk-assessments}

**WHY (Reg cite):** Periodic compliance risk assessment is the mechanism that prioritizes monitoring and assurance and is a core CMS expectation ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/); board oversight under [NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)).

**SYSTEM BEHAVIOR:** Compliance conducts periodic risk assessments scoring inherent and residual compliance risk across products and activities, and uses the results to set the frequency and depth of monitoring and assurance. The assessment results are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Risk assessment cycle due (`compliance.risk_assessment_due_at`) | Risk register (`risk.register_snapshot`), inherent/residual ratings (`risk.inherent_rating`, `risk.residual_rating`), assessment results (`risk.assessment_results`) | Compliance risk assessment completed (`compliance.risk_assessment_completed`) | At least annually (enforced by `compliance.risk_assessment_due_at`) |

**ALERTS/METRICS:** Aging alert when assessment passes `compliance.risk_assessment_due_at` (target zero overdue); count of high-residual-risk areas without a corresponding monitoring plan entry.

## CMP-05 — Training Standards  {#cmp-05-training-standards}

**WHY (Reg cite):** Training every employee on applicable compliance requirements is a universal regulator expectation and a core CMS pillar ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/); board responsibility under [NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)).

**SYSTEM BEHAVIOR:** Every employee receives baseline compliance training at onboarding and an annual refresher; curriculum is role-based. Attendance/completion records are retained by Compliance and HR. Compliance may assign remedial training when non-compliance or a knowledge gap is detected. Training records and curriculum assignments are write-restricted to Compliance and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New employee hired (`employee.hired`) | Assignee (`training.assignee_id`), hire date (`training_detail.hire_date`), required curriculum (`training.required_curriculum`) | Onboarding training completed + record retained (`training.onboarding_completed`) | Onboarding window (enforced by `training.newhire_due_at`) |
| Annual training cycle opens (`training.annual_cycle_opened`) | Role matrix (`training.role_matrix`), content version (`training.content_version`) | Annual refresher completed (`training.refresher_completed`) | Annually (enforced by `training.annual_due_at`) |
| Non-compliance or knowledge gap detected (`training.content_trigger_detected`) | Assignee (`training.assignee_id`), deficiency basis (`training.proficiency.failed`) | Remedial training assigned (`training.remedial_assigned`) | On detection (internal: 30 days to complete) |

**ALERTS/METRICS:** Training coverage percentage (`training.coverage_pct`) with target 100% per cycle; aging alert on incomplete assignments past `training.annual_due_at` or `training.newhire_due_at`; count of open remedial assignments.

## CMP-06 — Monitoring & Assurance Reviews  {#cmp-06-monitoring--assurance-reviews}

**WHY (Reg cite):** Ongoing monitoring with documented, replicable findings is the "Detect" pillar of an effective CMS ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/); board oversight under [NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)).

**SYSTEM BEHAVIOR:** Compliance performs risk-based monitoring and assurance reviews of regulated activities, documenting what was reviewed over the trailing twelve months and the findings so that results are replicable. Coverage and findings are reported to the Board/Audit-Risk committee; resulting findings are tracked to closure. Monitoring scope and sample specifications are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring review due (`monitoring.review_due_at`) | Sample spec (`monitoring.sample_spec`), review scope (`monitoring.scope`), sample drawn (`monitoring.sample_drawn`) | Monitoring review completed (`monitoring.review_completed`) | Per risk-based schedule (enforced by `monitoring.review_due_at`) |
| Review completed (`monitoring.review_completed`) | Trailing-12-mo coverage (`monitoring_coverage.review`), findings (`finding.description`) | Coverage + findings reported (`monitoring.findings_reported`) | Per cadence (enforced by `monitoring.coverage_review_due`) |
| Monitoring finding identified (`finding.opened`) | Finding owner (`finding.owner`), department (`finding.department`), management response (`finding.management_response`) | Finding tracked to closure (`finding.closed`) | Per finding SLA (enforced by `finding.response_due_at`) |

**ALERTS/METRICS:** Coverage gap alert when trailing-12-month coverage falls below target; aging alert on open findings past `finding.response_due_at`; target zero reviews overdue against `monitoring.review_due_at`.

## CMP-07 — Independent Audit  {#cmp-07-independent-audit}

**WHY (Reg cite):** An independent audit of the compliance system, at least annually, that can replicate assurance-review findings is the "Correct/validate" pillar of an effective CMS and the supervisory expectation for independent review ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/); supervisory committee/audit duties under [NCUA 12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** An external/independent firm audits the CMS at least annually, reviewing the assurance reviews themselves and confirming the findings can be replicated. Findings, management responses, and corrective actions route to the Board (or its Audit/Risk committee). The audit report and workpapers are access-controlled to the auditor, Compliance, and the Board. Engagement of the external firm is proposed and approved through the Board before fieldwork begins.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Independent compliance audit due (`audit.compliance_audit_due_at`) | Engagement scope (`audit.engagement_scope`), independence attestation (`auditor.independence_attestation`) | Audit engagement completed (`audit.engagement_completed`) | At least annually (enforced by `audit.compliance_audit_due_at`) |
| Audit report issued (`audit.report_issued`) | Findings (`finding.description`), management responses (`finding.management_response`), corrective actions (`audit_detail.corrective_action`) | Findings routed to Board (`audit.findings_routed_to_board`) | Promptly after issuance (internal: next Board cycle) |
| Audit finding remediation tracked (`finding.opened`) | Finding owner (`finding.owner`), remediation evidence (`finding.remediation_evidence`) | Finding closure verified (`finding.closure_verified`) | Per remediation SLA (enforced by `audit.remediation_due`) |

**ALERTS/METRICS:** Aging alert when the annual audit passes `audit.compliance_audit_due_at` (target zero); count of audit findings open past `audit.remediation_due`; flag any audit lacking a logged independence attestation.

## CMP-08 — Regulatory-Change Management  {#cmp-08-regulatory-change-management}

**WHY (Reg cite):** Routing regulatory correspondence to the Compliance Officer and timely analyzing and implementing required changes (procedures and training) is essential to staying current as rules evolve across the consumer-protection regimes ([ECOA/Reg B](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z](https://www.ecfr.gov/current/title-12/part-1026), [GLBA/Reg P](https://www.ecfr.gov/current/title-12/part-1016)) and DFPI's [CCFPL](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=24.&lawCode=FIN).

**SYSTEM BEHAVIOR:** Regulatory correspondence and resources are directed to the Compliance Officer, who analyzes the change with affected department managers to determine required actions. Where a change is required, procedures are updated and training is scheduled for affected personnel; where training is unnecessary, a procedures memo is circulated and logged instead. The change analysis record is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulatory correspondence received (`regulatory.correspondence_received`) | Source document (`regulatory.source_doc`), affected scope (`regulation.citation`) | Change analysis logged (`regulatory.change_analysis_logged`) | On receipt (enforced by `regulatory.analysis_due_at`) |
| Change determined required (`regulatory.change_required` true) | Procedure delta (`procedure.change_set`), affected roles (`training.role_matrix`) | Change implemented; procedure + training updated (`regulatory.change_implemented`) | Timely before effective date (internal: per change) |

**ALERTS/METRICS:** Aging alert on correspondence not analyzed past `regulatory.analysis_due_at`; count of required changes not implemented before their effective date (target zero).

## CMP-09 — Complaint Management Signal  {#cmp-09-complaint-management-signal}

**WHY (Reg cite):** Consumer complaints are a primary compliance signal and a required CMS input; complaint monitoring for patterns indicating disclosure or training gaps is a baseline supervisory expectation ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/)) and feeds UDAAP risk under [Dodd-Frank §§ 1031 & 1036 (12 USC 5531](https://www.law.cornell.edu/uscode/text/12/5531), [5536)](https://www.law.cornell.edu/uscode/text/12/5536). Detailed complaint-handling SLAs specific to collections live in the Collections Policy.

**SYSTEM BEHAVIOR:** Complaints are logged and monitored by Compliance as a compliance signal; Compliance reviews the complaint log on a fixed cadence for common patterns or themes that may indicate a disclosure or training issue, feeding findings back into monitoring, training, and regulatory-change activity. This control governs complaints only as a CMS signal — substantive resolution SLAs are owned by the Collections and product policies. The complaint trend summary is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Complaint logged (`complaint.logged`) | Category (`complaint.category`), member reference (`complaint.member_id`), UDAAP flag (`complaint.udaap_flag`) | Complaint recorded as compliance signal (`complaint.logged`) | On intake (no CMS-level statutory deadline) |
| Complaint trend review cycle due (`complaint.trend_review_due`) | Trend summary (`complaint.trend_summary`), root-cause tags (`complaint.root_cause_tag`) | Complaint trend reported (`complaint.trend_reported`) | Per cadence (enforced by `complaint.trend_review_due`) |

**ALERTS/METRICS:** Alert on any complaint pattern exceeding a theme threshold (e.g., repeated root-cause tag) indicating a disclosure/training gap; aging alert when a trend review passes `complaint.trend_review_due`.

## CMP-10 — Policy & CMS Review Cadence  {#cmp-10-policy--cms-review-cadence}

**WHY (Reg cite):** The Board must review and re-approve the compliance policy and CMS on a defined cadence — at least annually and upon material regulatory change — evidencing active oversight ([CFPB CMS framework](https://www.consumerfinance.gov/compliance/supervisory-guidance/); board governance under [NCUA 12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)).

**SYSTEM BEHAVIOR:** The policy and CMS are reviewed and re-approved by the Board at least annually and upon material regulatory change. A review-due warning fires ahead of the deadline; material-change events trigger an off-cycle review. The approved policy version and Board approval record are write-restricted to Compliance and the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board policy review starts (`policy.board_review_started`) | Current version (`policy.document_version`), redline (`policy.draft_redline`), next review date (`policy.next_review_date`) | Policy board-approved (`policy.board_approved`) | At least annually (enforced by `policy.board_approval_due_at`) |
| Material regulatory change flagged (`policy.material_change_flagged`) | Change rationale (`policy.change_rationale`), change description (`policy.change_description`) | Off-cycle revision published (`policy.revision_published`) | Promptly on material change (internal: 30 days) |

**ALERTS/METRICS:** Review-warning alert via `policy.review_warning_at` ahead of `policy.next_review_at`; aging alert when policy review lapses past `policy.board_approval_due_at` (target zero lapsed); flag material-change events with no resulting off-cycle review.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the CMS and this policy, including risk assessments, policies/procedures/internal controls, training coordination, complaint monitoring, and exam/consultant/auditor coordination.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Board oversight:** The compliance function reports directly to the Board (or its Audit/Risk committee) on a line that does not route through executive management; the Compliance Officer reports to the Board at least quarterly (see [CMP-01](#cmp-01-governance--board-reporting-line)).
- **Required participants:** Board (and its Audit/Risk committee), department managers, Human Resources, and Internal Audit.
- **Backup continuity:** If the Compliance Officer cannot serve, the CFO and/or Operations Officer assume duties until a successor is appointed (see [CMP-03](#cmp-03-roles--responsibilities)).
- **Review cadence:** Reviewed and re-approved by the Board at least annually and upon material regulatory change (see [CMP-10](#cmp-10-policy--cms-review-cadence)).
- **Cross-references (out of scope here):** BSA Policy; Fair Lending Policy; Privacy Policy; Information Security Policy; Collections Policy; Audit Policy; Internal Controls Policy; Director Fiduciary Duties Policy; Lending Policy; Record Retention Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several governance/CMS field and event codes referenced in the control overlays map cleanly to the registered banking-core vocabulary (e.g., `compliance.board_report_delivered`, `regulation.inventory_reviewed`, `monitoring.review_completed`, `audit.compliance_audit_due_at`, `training.annual_cycle_opened`, `policy.board_approved`). Where a precise CMS concept was not registered, the closest registered or provisional spelling was reused rather than coining a new code; final names will be confirmed by engineering before the next review.
- **Charter type / NCUA applicability.** This policy assumes Pynthia Credit Union is a federally-insured, DFPI-supervised credit union; NCUA Part 701 (board governance) and Part 715 (supervisory committee/audit) are cited as the credit-union governance anchors. If the charter is state-only or differs, the WHY anchors in CMP-01, CMP-03, CMP-07, and CMP-10 must be confirmed.
- **HMDA reporter status.** HMDA/Reg C is included in the applicable-law inventory (CMP-02) on the assumption the credit union is or may become a HMDA reporter; confirm reporter status to scope the inventory entry precisely.
- **Training cadence specifics.** "Annual refresher" and onboarding windows are taken from PATRICK_NOTES at the baseline ("every employee, initial + annual"); exact onboarding deadline (e.g., 30/60/90 days) and role-curriculum mapping need confirmation by Compliance and HR.
- **Monitoring frequency.** CMP-06 frequency is "risk-based per the risk assessment" rather than a fixed interval; the trailing-12-month coverage documentation requirement is fixed, but the per-area cadence is set by CMP-04 outputs and needs confirmation against the current risk assessment.
- **Complaint SLAs deliberately excluded.** CMP-09 treats complaints only as a CMS signal (intake + trend analysis); substantive complaint-resolution SLAs are owned by the Collections and product policies and are not restated here.
- **Independent audit engagement path.** CMP-07 assumes external-firm engagement is proposed and Board-approved before fieldwork; confirm whether the Audit Policy or this policy owns the engagement-approval workflow to avoid duplication.
