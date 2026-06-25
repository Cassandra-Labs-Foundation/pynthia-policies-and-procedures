```yaml
---
title: Compliance Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, CMS, Governance, Training, Monitoring, Audit, Regulatory-Change]
---
```

## General Policy Statement

Pynthia Credit Union maintains a Compliance Management System (CMS) designed to **Prevent, Detect, and Correct** violations of all applicable federal and California (DFPI) laws and regulations across every product, channel, and partner relationship. The Board of Directors bears ultimate responsibility for the CMS and approves this policy at least annually. The Chief Compliance Officer (CCO) administers the CMS and reports directly to the Board (or its Audit/Risk Committee) on a line that does not route through executive management, preserving the independence required by NCUA examination standards. Every employee, officer, and director is expected to understand and comply with the requirements applicable to their role.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Board compliance report | Quarter closes → `compliance.board_report_due_at` | Quarterly | Reg changes, policy approvals, training metrics, audit/exam findings + CAs | [CM-01](#cm-01-governance-and-board-reporting-line) |
| Regulation inventory review | Calendar year-end or material reg change → `regulation.inventory_review_due_at` | Annually (or upon material change) | Full inventory of applicable federal and CA laws | [CM-02](#cm-02-scope-of-applicable-laws) |
| Compliance Officer vacancy | CCO departure → `compliance.officer_vacancy` | Immediate designation | CFO or Operations Officer as interim | [CM-03](#cm-03-roles-and-responsibilities) |
| Compliance risk assessment | Annual cycle opens → `compliance.risk_assessment_due_at` | Annually | Risk scores, high-risk areas, monitoring prioritization | [CM-04](#cm-04-compliance-risk-assessment) |
| New-hire compliance training | Employee hired → `employee.hired` | 30 days of hire | Onboarding compliance curriculum | [CM-05](#cm-05-training-standards) |
| Annual compliance training | Annual cycle opens → `training.annual_cycle.opened` | By cycle close date (internal: Dec 31) | Role-based refresher curriculum | [CM-05](#cm-05-training-standards) |
| Remedial training assignment | Monitoring or audit finding → `monitoring.findings.reported` | Within 15 BD of finding | Targeted module for deficient area | [CM-05](#cm-05-training-standards) |
| Monitoring review completion | Review period closes → `monitoring.review_due_at` | Trailing 12-month coverage documented | Sample specs, findings, replication evidence | [CM-06](#cm-06-monitoring-and-assurance-reviews) |
| Independent compliance audit | Annual cycle → `audit.compliance_audit_due_at` | Annually | Assurance reviews, transaction testing, written report | [CM-07](#cm-07-independent-audit) |
| Audit findings routed to Board | Audit report issued → `audit.report.issued` | Next Board/Audit Committee meeting | Findings, management responses, corrective actions | [CM-07](#cm-07-independent-audit) |
| Regulatory correspondence received | Mail/email arrives → `regulatory.correspondence.received` | Routed to CCO same day | Analysis memo, required procedure/training changes | [CM-08](#cm-08-regulatory-change-and-complaint-management) |
| Regulatory change implemented | Analysis complete → `regulatory.change_analysis.logged` | Before effective date of regulation | Updated procedures, training scheduled | [CM-08](#cm-08-regulatory-change-and-complaint-management) |
| Consumer complaint logged | Complaint received → `complaint.received` | Logged same day; resolved per Complaint Resolution Policy | Complaint log entry, root-cause tag, UDAAP flag | [CM-08](#cm-08-regulatory-change-and-complaint-management) |
| Policy/CMS annual re-approval | Annual review cycle → `policy.board_approval_due_at` | Annually (or upon material change) | Board-approved policy with updated effective date | [CM-09](#cm-09-policy-and-cms-review-cadence) |

---

## CM-01 — Governance and Board Reporting Line {#cm-01-governance-and-board-reporting-line}

**WHY (Reg cite):** NCUA's CMS examination framework (NCUA Examiner's Guide, CMS chapter; [12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)) requires that the compliance function have a direct, independent reporting line to the Board or its Audit/Risk Committee, free from executive-management interference. The CFPB's supervisory expectations for supervised entities (Dodd-Frank Act §§ 1025–1026) and DFPI's examination standards for state-chartered credit unions reinforce board-level accountability for the CMS.

**SYSTEM BEHAVIOR:** The CCO holds a standing agenda item at each quarterly Board (or Audit/Risk Committee) meeting. The quarterly compliance report is prepared by the CCO and delivered directly to the Board package without routing through the CEO or any other executive officer. The report covers: (1) regulatory changes since the last report and their implementation status; (2) policies submitted for Board approval; (3) training completion metrics; and (4) audit and examination findings with management responses and corrective-action status. The `compliance.board_report_due_at` timer fires 10 business days before each quarter-end to allow preparation time. The Board minutes record receipt and any Board action. The compliance report document is write-restricted to the CCO and the Board Secretary; no executive officer may edit or suppress it before delivery.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and board report is due (`compliance.board_report_due_at` fires) | Regulatory change log (`regulatory.change_analysis`), policy approval queue (`policy.board_approval_due_at`), training completion metrics (`training.coverage_pct`, `training.completion_status`), open findings with corrective-action status (`finding.remediation_status`, `finding.corrective_action`) | Quarterly compliance board report delivered to Board package (`compliance.board_report.delivered`); Board receipt logged in minutes (`board.minutes.recorded`) | Quarterly; report delivered ≥ 2 BD before Board meeting (enforced by `compliance.board_report_due_at`) |
| Board or Audit/Risk Committee meeting held | Compliance report in board package (`compliance.board_report_id`), quorum confirmed | Board action or acknowledgment recorded (`board.audit_review.recorded`) | At each quarterly Board meeting |
| CCO vacancy occurs (`compliance.officer_vacancy` set) | Interim designee identity (`employee.id` of CFO or Operations Officer) | Interim designation recorded (`compliance.role.assigned`); Board notified (`board.notification.sent`) | Immediate; interim in place before next business day |

**ALERTS/METRICS:** Alert fires if `compliance.board_report_due_at` passes without `compliance.board_report.delivered` being logged — target zero occurrences per year. Dashboard tracks days-to-delivery against the 2-BD-before-meeting SLA; any miss is escalated to the Board Chair.

---

## CM-02 — Scope of Applicable Laws {#cm-02-scope-of-applicable-laws}

**WHY (Reg cite):** NCUA's CMS guidance requires credit unions to identify and track all applicable consumer protection laws and regulations ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The inventory must cover federal statutes — including [ECOA/Reg B (12 CFR Part 1002)](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z (12 CFR Part 1026)](https://www.ecfr.gov/current/title-12/part-1026), [HMDA/Reg C (12 CFR Part 1003)](https://www.ecfr.gov/current/title-12/part-1003), [RESPA/Reg X (12 CFR Part 1024)](https://www.ecfr.gov/current/title-12/part-1024), [EFTA/Reg E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005), [TISA/Reg DD (12 CFR Part 1030)](https://www.ecfr.gov/current/title-12/part-1030), [Reg CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229), [FCRA/Reg V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022), [FDCPA/Reg F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006), [GLBA/Reg P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016), [BSA (31 CFR Chapter X)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X), [MLA (32 CFR Part 232)](https://www.ecfr.gov/current/title-32/part-232), [SCRA (50 U.S.C. §§ 3901–4043)](https://www.law.cornell.edu/uscode/text/50/chapter-50), [Fair Housing Act (42 U.S.C. § 3605)](https://www.law.cornell.edu/uscode/text/42/3605), [UDAAP (Dodd-Frank §§ 1031–1036)](https://www.law.cornell.edu/uscode/text/12/5531), and the [SAFE Act (12 CFR Part 1007)](https://www.ecfr.gov/current/title-12/part-1007) — as well as California overlays including the CCFPL, California Financing Law, Rosenthal FDCPA, Holden Act, California Homeowner Bill of Rights, CCPA/CPRA, and Unruh Civil Rights Act, all examined by DFPI.

**SYSTEM BEHAVIOR:** The CCO maintains a current regulation inventory (`regulation_inventory`) that maps each applicable law and regulation to the credit union's products and activities. The inventory is reviewed and updated at least annually and immediately upon identification of a material regulatory change. Each entry records the citation, the products/activities affected, and the date last reviewed. The inventory is the authoritative source for scoping monitoring reviews ([CM-06](#cm-06-monitoring-and-assurance-reviews)) and risk assessments ([CM-04](#cm-04-compliance-risk-assessment)). The inventory is write-restricted to the CCO and designated Compliance staff; read access is available to all department managers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens or material regulatory change identified (`regulation.inventory_review_due_at` fires, or `regulatory.correspondence.received` flags a material change) | Current inventory entries (`regulation_inventory.citation`), list of new or amended regulations from regulatory correspondence (`regulatory.source_doc`, `regulatory.change_identified`) | Updated regulation inventory (`regulation.inventory.updated`); review completion logged (`regulation.inventory.reviewed`) | Annually; or within 30 days of a material regulatory change (enforced by `regulation.inventory_review_due_at`) |
| Regulation inventory entry added or amended | Citation (`regulation_inventory.citation`), affected products/activities, effective date of regulation | Inventory entry created or updated (`regulation.inventory.updated`) | Before the regulation's effective date |

**ALERTS/METRICS:** Alert fires if `regulation.inventory_review_due_at` passes without `regulation.inventory.reviewed` being logged — target zero lapses per year. CCO receives a 30-day advance warning alert to initiate the review.

---

## CM-03 — Roles and Responsibilities {#cm-03-roles-and-responsibilities}

**WHY (Reg cite):** NCUA's CMS examination framework requires clear assignment of compliance responsibilities from the Board through management to front-line staff ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). CFPB supervisory guidance on CMS (Supervision and Examination Manual, CMS chapter) similarly requires defined roles, a designated compliance officer with sufficient authority, and a documented backup arrangement.

**SYSTEM BEHAVIOR:** The CCO is responsible for the overall CMS, including: maintaining the regulation inventory; conducting risk assessments; formulating and updating policies, procedures, and internal controls; coordinating training with Human Resources; monitoring consumer complaints; and coordinating regulatory examinations and outside consultant reviews. Department managers are responsible for compliance within their functional areas, including knowledge of applicable laws, participation in policy and procedure development, and timely correction of identified deficiencies. If the CCO position is vacant or the CCO is unable to perform duties, the CFO and/or Operations Officer serves as interim CCO until a permanent appointment is made; this designation is recorded immediately and the Board is notified. Role assignments are maintained in the RACI registry (`governance.raci_registry`) and are write-restricted to the CCO and the Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CCO appointed or role changes (`compliance.role.assigned`) | Appointee identity (`employee.id`), effective date, Board resolution reference (`board.resolution_id`) | Role assignment recorded in RACI registry (`compliance.role_register.updated`); Board notified (`board.notification.sent`) | Before the appointee assumes duties |
| CCO vacancy or incapacity (`compliance.officer_vacancy` set) | Interim designee identity (`employee.id` of CFO or Operations Officer), reason for vacancy | Interim designation recorded (`compliance.role.assigned`); Board notified (`board.notification.sent`) | Immediate; before next business day |
| Department manager compliance responsibility assigned or updated | Manager identity (`employee.id`), functional area, effective date | RACI registry updated (`compliance.role_register.updated`) | Upon hire, promotion, or reorganization |

**ALERTS/METRICS:** Alert fires if `compliance.officer_vacancy` is set and no interim designation (`compliance.role.assigned`) is logged within 1 business day — target zero unresolved vacancies. RACI registry completeness is reviewed quarterly as part of the Board compliance report.

---

## CM-04 — Compliance Risk Assessment {#cm-04-compliance-risk-assessment}

**WHY (Reg cite):** NCUA's CMS examination framework requires periodic compliance risk assessments to identify high-risk areas and prioritize monitoring ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The CFPB's CMS guidance (Supervision and Examination Manual) and DFPI examination standards for state-chartered credit unions both treat a documented, risk-based approach as a foundational CMS element.

**SYSTEM BEHAVIOR:** The CCO conducts a compliance risk assessment at least annually, and more frequently when the credit union introduces new products, enters new markets, or experiences material regulatory changes. The assessment scores each regulated activity for inherent risk (likelihood and impact of non-compliance) and residual risk (after controls), producing a prioritized list of high-risk areas that drives the monitoring and assurance schedule ([CM-06](#cm-06-monitoring-and-assurance-reviews)). The assessment methodology, scoring criteria, and results are documented and retained. The completed assessment is presented to the Board (or Audit/Risk Committee) as part of the quarterly compliance report. The risk assessment document is write-restricted to the CCO and designated Compliance staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual assessment cycle opens, or new product/material change triggers off-cycle assessment (`compliance.risk_assessment_due_at` fires, or `regulatory.change_implemented` or `product.initiated` triggers) | Current regulation inventory (`regulation_inventory.citation`), prior assessment results (`risk.assessment_results`), monitoring findings from trailing 12 months (`monitoring.findings`), complaint trend data (`complaint.trend_summary`) | Completed compliance risk assessment (`compliance.risk_assessment.completed`); high-risk areas flagged for increased monitoring (`risk.rating.recorded`) | Annually; or within 60 days of a material trigger (enforced by `compliance.risk_assessment_due_at`) |
| Risk assessment results presented to Board | Completed assessment document, Board meeting date (`board.meeting_date`) | Board receipt recorded in minutes (`board.audit_review.recorded`) | At next quarterly Board/Audit Committee meeting after completion |

**ALERTS/METRICS:** Alert fires if `compliance.risk_assessment_due_at` passes without `compliance.risk_assessment.completed` being logged — target zero lapses per year. High-risk areas identified in the assessment must appear in the monitoring schedule within 30 days of assessment completion.

---

## CM-05 — Training Standards {#cm-05-training-standards}

**WHY (Reg cite):** Every federal banking regulator — including NCUA ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)) — treats employee compliance training as a baseline CMS requirement. Specific training obligations arise under [ECOA/Reg B (12 CFR Part 1002)](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z (12 CFR Part 1026)](https://www.ecfr.gov/current/title-12/part-1026), [BSA (31 CFR Chapter X)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X), [FCRA/Reg V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022), [MLA (32 CFR Part 232)](https://www.ecfr.gov/current/title-32/part-232), and the California CCFPL. The CFPB's CMS Supervision and Examination Manual identifies training as one of the four pillars of an effective CMS.

**SYSTEM BEHAVIOR:** Every employee must complete compliance training at two points: (1) **onboarding** — within 30 days of hire, covering baseline consumer protection requirements applicable to the credit union's products and the employee's role; and (2) **annual refresher** — by the close of each calendar year, covering role-based curriculum updated to reflect regulatory changes since the prior cycle. The CCO, in coordination with Human Resources, assigns curricula, tracks completion, and retains attendance records. Both Compliance and HR retain copies of attendance records. The CCO may assign **remedial training** to any employee whose monitoring review, audit finding, or examination result reveals a compliance deficiency; remedial assignments must be completed within 30 days of assignment. Training completion records are write-restricted to Compliance and HR; no other party may alter completion status. Board members receive compliance training appropriate to their oversight role at least annually.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired (`employee.hired`) | Employee identity (`employee.id`), hire date (`training.hire_date`), role-based curriculum assignment (`training.role_curriculum`) | Onboarding training assignment created (`training.assignment.created`); completion recorded upon finish (`training.onboarding.completed`) | Assignment within 1 BD of hire; completion within 30 days of hire (enforced by `training.onboarding_due_at`) |
| Annual training cycle opens (`training.annual_cycle.opened`) | All active employee roster (`employee.id[]`), updated role-based curriculum (`training.refresher_curriculum`, `training.curriculum_version`) | Annual training assignments created (`training.annual.assigned`); completions recorded (`training.refresher.completed`); coverage percentage tracked (`training.coverage_pct`) | Assignments by cycle-open date; completions by Dec 31 (enforced by `training.annual_due_at`) |
| Monitoring finding, audit finding, or exam finding identifies employee deficiency (`monitoring.findings.reported` or `finding.opened`) | Employee identity (`employee.id`), deficiency description (`finding.description`), targeted module (`training.module_id`) | Remedial training assignment created (`training.remedial.assigned`); completion recorded (`training.remedial.completed`); attendance record retained by Compliance and HR (`training.completion_due_at`) | Assignment within 5 BD of finding; completion within 30 days of assignment (enforced by `training.completion_due_at`) |
| Training session delivered (any modality) | Session content (`training.session`), attendee list (`training.assignee_id[]`), curriculum version (`training.curriculum_version`) | Session delivery logged (`training.session.delivered`); attendance records retained by Compliance and HR (`training.completion.recorded`) | Logged same day as delivery |

**ALERTS/METRICS:** Alert fires if any employee's `training.onboarding_due_at` or `training.annual_due_at` passes without `training.completed` — target ≥ 98% completion rate by cycle close. Remedial training overdue beyond 30 days triggers an escalation alert to the CCO and the relevant department manager. Training coverage percentage is reported in the quarterly Board compliance report.

---

## CM-06 — Monitoring and Assurance Reviews {#cm-06-monitoring-and-assurance-reviews}

**WHY (Reg cite):** NCUA's CMS examination framework requires ongoing compliance monitoring of regulated activities, with documented results sufficient for an examiner to replicate findings ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The CFPB's CMS Supervision and Examination Manual (Monitoring and Corrective Action chapter) and DFPI examination standards require that monitoring be risk-based, cover all high-risk areas identified in the risk assessment, and produce written records of scope, methodology, sample, findings, and corrective actions.

**SYSTEM BEHAVIOR:** The CCO maintains a monitoring schedule that covers all regulated activities, prioritized by the compliance risk assessment ([CM-04](#cm-04-compliance-risk-assessment)). Each review documents: the regulation(s) tested, the population and sample drawn, the testing methodology, findings (including any violations or weaknesses), and required corrective actions. The trailing 12-month monitoring log must demonstrate coverage of all high-risk areas. Findings are tracked to closure. Monitoring results are reported to the Board (or Audit/Risk Committee) as part of the quarterly compliance report and are available to the independent auditor ([CM-07](#cm-07-independent-audit)). Monitoring workpapers are write-restricted to Compliance staff; department managers may view findings affecting their area but may not alter workpapers.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monitoring review period opens for a regulated activity (`monitoring.review_due_at` fires per schedule) | Regulation citation (`regulation_inventory.citation`), risk rating for the activity (`risk.residual_rating`), sample specification (`monitoring.sample_spec`), prior findings (`monitoring.findings`) | Sample drawn and documented (`monitoring.sample_drawn`); review completed with findings recorded (`monitoring.review.completed`); findings reported (`monitoring.findings.reported`) | Per monitoring schedule; high-risk areas at least annually; coverage of all areas documented over trailing 12 months (enforced by `monitoring.review_due_at`) |
| Monitoring finding identified requiring corrective action (`monitoring.findings.reported` with violation noted) | Finding description (`finding.description`), responsible department (`finding.department`), severity (`finding.severity`), root cause (`finding.root_cause`) | Finding opened and tracked (`finding.opened`); corrective action assigned (`finding.corrective_action`); remedial training assigned if applicable (`training.remedial.assigned`) | Finding logged same day; corrective action plan within 10 BD; closure verified per plan timeline |
| Trailing 12-month coverage review (`monitoring.coverage_review_due` fires) | Monitoring log for trailing 12 months (`monitoring.scope[]`), regulation inventory (`regulation_inventory.citation[]`), risk assessment high-risk areas (`risk.residual_rating`) | Coverage report produced (`monitoring.coverage.reported`); gaps flagged for remediation | Annually; included in Board compliance report |

**ALERTS/METRICS:** Alert fires if any high-risk area identified in the current risk assessment has no completed monitoring review in the trailing 12 months — target zero uncovered high-risk areas. Open findings aging beyond their corrective-action target date trigger an escalation alert to the CCO. Coverage percentage is reported in the quarterly Board compliance report.

---

## CM-07 — Independent Audit {#cm-07-independent-audit}

**WHY (Reg cite):** NCUA's CMS examination framework requires that the compliance program be subject to independent audit, separate from management's own monitoring ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The CFPB's CMS Supervision and Examination Manual (Independent Audit chapter) requires that the independent audit function review the adequacy of the monitoring program itself, conduct transaction testing, and produce written reports routed to the Board or its Audit Committee. DFPI examination standards for state-chartered credit unions impose equivalent requirements.

**SYSTEM BEHAVIOR:** An external or otherwise independent auditor (not reporting to executive management) conducts a compliance audit at least annually. The audit scope includes: review of the monitoring program's adequacy and replicability; transaction testing of high-risk regulated activities; and assessment of the overall CMS. The auditor produces a written report identifying violations, weaknesses, and potential deficiencies. The report, management responses, and corrective-action plans are routed directly to the Board (or Audit/Risk Committee) — not filtered through executive management. The CCO tracks all audit findings to closure using the finding-tracking system. The `audit.compliance_audit_due_at` timer fires 60 days before the annual anniversary to allow engagement planning. Audit workpapers and reports are write-restricted to the independent auditor and the CCO; executive management may view the final report but may not alter it before Board delivery.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual compliance audit cycle opens (`audit.compliance_audit_due_at` fires) | Prior audit report (`audit.report_id`), monitoring workpapers for trailing 12 months (`monitoring.scope`, `monitoring.findings`), regulation inventory (`regulation_inventory.citation`), risk assessment (`risk.assessment_results`) | External audit engagement started (`audit.engagement.started`); scope documented (`audit.engagement_scope`) | Annually; engagement initiated within 30 days of timer fire |
| Audit fieldwork completed | Transaction test results, monitoring review replication results, CMS adequacy assessment | Audit report drafted (`audit.report.drafted`); findings documented (`finding.opened` for each finding) | Within 30 days of fieldwork completion |
| Audit report finalized | Management responses to each finding (`finding.management_response`), corrective-action plans (`finding.corrective_action`) | Final audit report issued (`audit.report.issued`); findings routed to Board (`audit.findings_routed_to_board`) | Report delivered to Board at next Audit/Risk Committee meeting after issuance |
| Audit finding corrective action completed | Evidence of remediation (`finding.remediation_evidence`), closure verification | Finding closed (`finding.closed`); closure logged (`finding.closure.logged`) | Per corrective-action plan timeline; overdue findings escalated (`finding.escalated`) |

**ALERTS/METRICS:** Alert fires if `audit.compliance_audit_due_at` passes without `audit.engagement.started` — target zero lapses per year. Open audit findings aging beyond their corrective-action target date trigger an escalation alert to the CCO and Board Audit Committee Chair. All findings must reach `finding.closed` status within the agreed corrective-action timeline; aging report reviewed at each quarterly Board meeting.

---

## CM-08 — Regulatory Change and Complaint Management {#cm-08-regulatory-change-and-complaint-management}

**WHY (Reg cite):** NCUA's CMS examination framework requires a systematic process for identifying, analyzing, and implementing regulatory changes, and for managing consumer complaints as a compliance signal ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The CFPB's CMS Supervision and Examination Manual (Regulatory Change Management and Complaint Management chapters) treats both as core CMS components. Complaint management obligations also arise under [UDAAP (Dodd-Frank §§ 1031–1036)](https://www.law.cornell.edu/uscode/text/12/5531), [ECOA/Reg B (12 CFR Part 1002)](https://www.ecfr.gov/current/title-12/part-1002), and the California CCFPL. Substantive complaint SLAs and BSA/AML-specific change management are addressed in the Complaint Resolution Policy and BSA Policy, respectively.

**SYSTEM BEHAVIOR:** All regulatory correspondence (agency guidance, final rules, examination bulletins, DFPI communications) is directed to the CCO upon receipt. The CCO analyzes each item in consultation with affected department managers to determine whether action is required — procedure updates, form revisions, training, or no action — and documents the determination. Required changes are implemented before the regulation's effective date; training is scheduled for affected staff. If no training session is required, a written memorandum is circulated to affected personnel. Consumer complaints (oral and written, including those received through regulators) are logged in the complaint management system on the day received, categorized, investigated, and resolved per the Complaint Resolution Policy. The CCO reviews complaint trends at least quarterly to identify patterns suggesting systemic disclosure or training issues; trend summaries are included in the quarterly Board compliance report. Complaint log entries and regulatory change analyses are write-restricted to Compliance staff; department managers may view items affecting their area.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulatory correspondence received (`regulatory.correspondence.received`) | Source document (`regulatory.source_doc`), regulation citation (`regulation_inventory.citation`), effective date | Correspondence routed to CCO same day; analysis initiated (`regulatory.change_analysis.logged`); action determination documented (`regulatory.change_required`) | Routed same day; analysis completed within 15 BD of receipt (enforced by `regulatory.analysis_due_at`) |
| Regulatory change requires procedure or training update (`regulatory.change_required` = true) | Analysis memo (`regulatory.change_analysis`), affected procedures, affected employee groups | Procedures updated (`procedure.change_set`); training scheduled (`training.assignment.created`) or memo circulated; change implemented (`regulatory.change_implemented`) | Before the regulation's effective date |
| Consumer complaint received (any channel) (`complaint.received`) | Complaint narrative (`complaint.narrative`), member identity (`complaint.member_id`), channel (`complaint.channel`), category (`complaint.category`) | Complaint logged same day (`complaint.logged`); UDAAP flag set if applicable (`complaint.udaap_flag`); root-cause tag assigned (`complaint.root_cause_tag`) | Logged same day; resolved per Complaint Resolution Policy timelines (enforced by `complaint.resolution_due_at`) |
| Quarterly complaint trend review (`complaint.trend_review_due` fires) | Complaint log for trailing quarter (`complaint.category[]`, `complaint.root_cause_tag[]`, `complaint.udaap_flag[]`) | Trend summary produced (`complaint.trend.reported`); systemic issues flagged for monitoring or training action | Quarterly; included in Board compliance report |

**ALERTS/METRICS:** Alert fires if `regulatory.analysis_due_at` passes without `regulatory.change_analysis.logged` — target zero lapses. Alert fires if any complaint's `complaint.resolution_due_at` is breached — monitored per Complaint Resolution Policy SLAs. Complaint UDAAP-flag rate and trend-identified systemic issues are reported in the quarterly Board compliance report.

---

## CM-09 — Policy and CMS Review Cadence {#cm-09-policy-and-cms-review-cadence}

**WHY (Reg cite):** NCUA's CMS examination framework requires that the compliance policy and CMS be reviewed and re-approved by the Board at least annually ([12 CFR Part 701](https://www.ecfr.gov/current/title-12/part-701)). The CFPB's CMS Supervision and Examination Manual and DFPI examination standards treat Board approval of the compliance program as a foundational governance requirement. Material regulatory changes may require an off-cycle review and re-approval.

**SYSTEM BEHAVIOR:** The CCO initiates the annual policy review no later than 60 days before the policy's anniversary date. The review assesses whether the policy accurately reflects the current CMS structure, regulatory environment, and risk profile. Any material changes are documented in a redline and change summary. The revised policy is submitted to the Board for approval at the next scheduled Board meeting. The Board-approved policy is published and distributed to all employees. Off-cycle reviews are triggered by material regulatory changes (identified through [CM-08](#cm-08-regulatory-change-and-complaint-management)) or significant changes to the credit union's products, services, or organizational structure. The `policy.board_approval_due_at` timer fires 60 days before the anniversary to initiate the review cycle. The policy document is write-restricted to the CCO; the Board Secretary records the approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens (`policy.review_due_at` fires, 60 days before anniversary) | Current policy version (`policy.document_version`), regulatory changes since last review (`regulatory.change_implemented[]`), risk assessment results (`risk.assessment_results`), monitoring and audit findings (`monitoring.findings`, `finding.remediation_status`) | Policy review initiated (`policy.board_review.started`); redline and change summary drafted (`policy.draft_redline`, `policy.change_summary`) | Review initiated within 5 BD of timer fire |
| Material regulatory change or organizational change identified between annual reviews (`regulatory.change_implemented` or `product.initiated` with material impact) | Change description (`regulatory.change_analysis` or `product.description`), impact on policy | Off-cycle review initiated (`policy.board_review.started`); policy flagged for material change (`policy.material_change.flagged`) | Within 30 days of the triggering change |
| Board approves revised policy (`policy.board.approved`) | Board-approved policy document (`policy.document_id`), Board meeting minutes reference (`board.minutes`), effective date (`policy.effective_date`) | Policy version approved and published (`policy.version.approved`, `policy.revision.published`); distributed to all employees (`policy.distribution.logged`); employee acknowledgment cycle opened (`policy.training_cycle.opened`) | Approval at next Board meeting after submission; publication within 5 BD of approval |

**ALERTS/METRICS:** Alert fires if `policy.board_approval_due_at` passes without `policy.board.approved` — target zero lapses per year. A 30-day advance warning alert (`policy.review_warning_at`) is issued to the CCO to initiate the review. Policy distribution completion rate is tracked; target 100% of employees receive the updated policy within 10 BD of publication.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Board of Directors** | Ultimate accountability for the CMS; approves this policy annually and upon material change; receives quarterly compliance reports directly from the CCO |
| **Audit/Risk Committee** | Receives audit findings, monitoring results, and complaint trend summaries; oversees corrective-action closure |
| **Chief Compliance Officer (Patrick Wilson)** | Policy owner; administers the CMS; prepares Board reports; maintains regulation inventory, risk assessment, monitoring schedule, and training program |
| **CFO / Operations Officer** | Designated interim CCO if the CCO position is vacant or the CCO is unable to serve |
| **Department Managers** | Responsible for compliance within their functional areas; participate in policy/procedure development; implement corrective actions |
| **Human Resources** | Co-retains training attendance records; coordinates onboarding training logistics |
| **Independent Auditor** | Conducts annual compliance audit; reports directly to the Board/Audit Committee |

**Review cadence:** This policy is reviewed and re-approved by the Board at least annually and upon any material regulatory change or significant organizational change. Next scheduled review: 2026-07-01.

**Cross-references:**
- BSA Policy (BSA/AML program design, SAR/CTR filing)
- Fair Lending Policy (fair-lending testing, adverse-action methodology)
- Privacy Policy and Information Security Policy (GLBA/Reg P, safeguarding)
- Complaint Resolution Policy (complaint SLAs, resolution procedures)
- Audit Policy and Internal Controls Policy (internal audit charter, broader control framework)
- Director Fiduciary Duties Policy and Lending Policy (Reg O, insider lending)
- Record Retention Policy (detailed retention schedules)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the control overlays above — including `compliance.officer_vacancy`, `regulatory.change_required`, `regulatory.change_implemented`, `regulatory.change_analysis`, `regulatory.source_doc`, `regulatory.change_identified`, `monitoring.scope`, `monitoring.sample_spec`, `monitoring.sample_drawn`, `monitoring.findings`, `monitoring.coverage_pct`, `training.coverage_pct`, `training.completion_status`, `training.role_curriculum`, `training.refresher_curriculum`, `training.curriculum_version`, `training.module_id`, `training.session`, `training.assignee_id`, `training.hire_date`, `training.remedial`, `finding.department`, `finding.root_cause`, `finding.remediation_evidence`, `finding.corrective_action`, `finding.management_response`, `finding.closure.logged`, `audit.engagement_scope`, `audit.findings_routed_to_board`, `audit.report_id`, `regulation_inventory.citation`, `governance.raci_registry`, `compliance.board_report_id`, `compliance.risk_assessment_due_at`, `compliance.role_register.updated`, `compliance.role.assigned`, `policy.draft_redline`, `policy.change_summary`, `policy.document_version`, `policy.effective_date`, `policy.training_cycle.opened`, `policy.distribution.logged`, `policy.material_change.flagged`, `policy.review_warning_at`, `complaint.root_cause_tag`, `complaint.udaap_flag`, `complaint.trend_summary`, `complaint.category`, `complaint.narrative`, `complaint.member_id`, `complaint.channel`, `complaint.resolution_due_at`, `procedure.change_set`, `board.resolution_id`, `board.minutes`, `board.audit_review.recorded`, `board.notification.sent`, `board.meeting_date`, `risk.residual_rating`, `risk.assessment_results`, `risk.rating.recorded`, `employee.id`, `product.description`, `product.initiated` (as a trigger)` — are either registered in the core vocabulary (and cited by their registered codes) or are provisional target names following the Composition grammar. Engineering must confirm registration of all codes before the next policy review cycle.

- **HMDA reporter status not confirmed.** The regulation inventory ([CM-02](#cm-02-scope-of-applicable-laws)) lists HMDA/Reg C as applicable. Whether Pynthia Credit Union meets the HMDA coverage thresholds (asset size, loan volume, location) must be confirmed annually. If the credit union is not a covered institution in a given year, HMDA monitoring obligations do not apply for that year.

- **CRA applicability.** The Community Reinvestment Act (12 CFR Part 25 / Part 195) is not listed in AUTHORITY_HINTS but appears in the reference policies. CRA applies to federally insured credit unions only in limited circumstances; NCUA-supervised credit unions are not subject to CRA. This policy does not include CRA as an applicable law. If Pynthia's charter or supervisory status changes, this assumption must be revisited.

- **SAFE Act MLO registration.** The SAFE Act ([12 CFR Part 1007](https://www.ecfr.gov/current/title-12/part-1007)) requires registration of mortgage loan originators. Whether Pynthia Credit Union employs MLOs who must register with the NMLS must be confirmed; if so, a specific monitoring control for SAFE Act compliance should be added to the monitoring schedule.

- **Complaint Resolution Policy SLAs.** This policy defers complaint resolution timelines to the Complaint Resolution Policy. If that policy does not yet exist or does not specify SLAs, interim SLAs (e.g., acknowledgment within 5 BD, resolution within 45 days) should be documented here until the Complaint Resolution Policy is finalized.

- **Independent auditor independence standard.** This policy requires the compliance auditor to be "external or otherwise independent" and not report to executive management. The specific independence standard (e.g., whether an internal audit function with a direct Board reporting line qualifies, or whether an external firm is required) should be confirmed with the Board and documented in the Audit Policy. This policy assumes the standard applied is consistent with NCUA examination expectations.

- **Board member training curriculum.** This policy requires Board members to receive compliance training at least annually. The specific curriculum for Board members (scope, format, delivery method) is not defined here and should be documented in the training program maintained by the CCO in coordination with the Board Chair.

- **California DFPI-specific obligations.** The California overlays listed in [CM-02](#cm-02-scope-of-applicable-laws) (CCFPL, California Financing Law, Rosenthal FDCPA, Holden Act, CHBOR, CCPA/CPRA, Unruh Civil Rights Act) are included in the regulation inventory scope. The specific applicability of each to Pynthia Credit Union's products and activities must be confirmed by the CCO with California counsel and documented in the regulation inventory. This policy assumes all listed California laws are potentially applicable and must be assessed.

- **Monitoring review frequency for non-high-risk areas.** This policy requires that all regulated activities be covered in the trailing 12-month monitoring log, with high-risk areas reviewed at least annually. The minimum frequency for lower-risk areas (e.g., every 18 or 24 months) is not specified and should be documented in the monitoring schedule maintained by the CCO, informed by the risk assessment.
