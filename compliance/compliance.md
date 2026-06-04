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

# Compliance Policy

## General Policy Statement

Pynthia Credit Union maintains a Compliance Management System (CMS) designed to **Prevent, Detect, and Correct** compliance issues across every product, channel, and function. The CMS covers the Board, executive management, the compliance function, department managers, and every employee, and its scope is all federal and California (DFPI) laws and regulations applicable to the credit union's products and activities. This is a governance policy: it demonstrates a sound, board-supervised compliance process — governance and reporting independence, an inventory of applicable law, assigned responsibilities, risk assessments, training, monitoring and assurance, independent audit, and regulatory-change and complaint management. Substantive product rules live in their owning policies; the CMS makes sure those policies exist, stay current, are trained, and are tested. The compliance function reports to the Board (or its Audit/Risk committee) on a line that does not route through executive management, preserving its independence.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly Board compliance report | Calendar quarter closes (`compliance.board_report_due`) | 45 days after quarter end | Regulatory changes, policies for approval, training status, audit/exam findings and corrective actions | [CMP-01](#cmp-01-governance-and-board-reporting-line) |
| Applicable-law inventory refresh | Regulatory change identified or scheduled review (`regulatory.change_identified`) | 30 days to assess; inventory reviewed at least annually | Federal and California (DFPI) law inventory | [CMP-02](#cmp-02-scope-of-applicable-laws) |
| Compliance Officer vacancy backup | CCO unable to serve (`compliance.officer_vacancy`) | Backup (CFO and/or Operations Officer) assumes duties immediately; Board notified within 5 business days | Roles and backup designation | [CMP-03](#cmp-03-roles-and-responsibilities) |
| Compliance risk assessment | Annual cycle or material change in products/regulation (`compliance.risk_assessment_due`) | At least annually | Risk assessment results drive the monitoring plan | [CMP-04](#cmp-04-compliance-risk-assessments) |
| New-hire compliance training | Employee start date (`employee.onboarded`) | Within 30 days of hire | Onboarding compliance curriculum | [CMP-05](#cmp-05-training-standards) |
| Annual refresher training | Annual training cycle opens (`training.annual_cycle_opened`) | Complete within the calendar year; 100% coverage | Annual refresher curriculum; attendance records retained by Compliance and HR | [CMP-05](#cmp-05-training-standards) |
| Monitoring & assurance reviews | Monitoring plan schedule (`monitoring.review_due`) | Per plan; trailing-12-month coverage documented | Review scope, findings, and replication detail | [CMP-06](#cmp-06-monitoring-and-assurance-reviews) |
| Independent compliance audit | Annual audit cycle (`audit.compliance_audit_due`) | At least annually | Audit of the CMS including replication of assurance reviews; findings to Board | [CMP-07](#cmp-07-independent-audit) |
| Regulatory correspondence routing | Correspondence received from a regulator (`regulatory.correspondence_received`) | Routed to CCO within 1 business day; analysis within 30 days | Change analysis, procedure updates, training scheduling | [CMP-08](#cmp-08-regulatory-change-and-complaint-management) |
| Consumer complaint intake | Complaint received in any channel (`complaint.received`) | Logged within 2 business days; trend review quarterly | Complaint log and pattern analysis as a compliance signal | [CMP-08](#cmp-08-regulatory-change-and-complaint-management) |
| Policy and CMS re-approval | Annual review cycle or material regulatory change (`policy.review_due`) | At least annually | Board re-approval of this policy and the CMS | [CMP-09](#cmp-09-review-cadence) |

## CMP-01 — Governance and Board Reporting Line

**WHY (Reg cite):** The Board is ultimately responsible for compliance; federal credit unions operate under board governance duties in [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4), and the supervisory-committee audit framework in [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) presumes an assurance line independent of management. DFPI's supervisory authority under the California Consumer Financial Protection Law ([Cal. Fin. Code Division 24](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=)) likewise expects demonstrable board oversight of consumer compliance.

**SYSTEM BEHAVIOR:** Compliance authority flows from the Board to the people doing the work: the Board approves this policy and the CMS, the Chief Compliance Officer (CCO) administers the CMS, and department managers execute compliance in their areas. The CCO reports directly to the Board (or its Audit/Risk committee) on a reporting line that does not route through executive management, and may convene meetings, set agendas, and delegate tasks while retaining control of the function. The quarterly Board report covers, at minimum: regulatory changes, policies submitted for approval, training delivered and coverage, and audit/exam findings with responses and corrective actions. If a quarterly report would be delayed, the CCO notifies the Board chair before the due date with the reason and a new date. The Board reporting package and its distribution list are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Calendar quarter closes (`compliance.board_report_due`) | Regulatory-change log (`regulatory.change_log[]`), policies pending approval (`policy.pending_approvals[]`), training coverage (`training.coverage_pct`), open findings and corrective actions (`finding.open_items[]`) | Quarterly Board compliance report delivered to Board/Audit-Risk committee (`compliance.board_report_delivered`) | 45 days after quarter end (internal: draft 30 days; enforced by `compliance.board_report_due_at`) |
| Board or committee acts on the report (`board.meeting_held`) | Board report (`compliance.board_report_id`), meeting agenda (`board.agenda_id`) | Minutes recording the compliance review and any approvals (`board.minutes_recorded`) | Next regular meeting (internal: minutes filed within 10 BD) |

**ALERTS/METRICS:** Quarterly report on-time rate (target 100%); count of quarters with no direct CCO-to-Board session (target zero); aging alert when a Board report draft is not started 30 days before due.

## CMP-02 — Scope of Applicable Laws

**WHY (Reg cite):** Examiners evaluate whether the institution knows which laws apply to it; the federal consumer inventory spans ECOA/[Reg B (12 CFR Part 1002)](https://www.ecfr.gov/current/title-12/part-1002), TILA/[Reg Z (12 CFR Part 1026)](https://www.ecfr.gov/current/title-12/part-1026), HMDA/[Reg C (12 CFR Part 1003)](https://www.ecfr.gov/current/title-12/part-1003), [Reg CC (12 CFR Part 229)](https://www.ecfr.gov/current/title-12/part-229), [Reg E (12 CFR Part 1005)](https://www.ecfr.gov/current/title-12/part-1005), [Truth in Savings for credit unions (12 CFR Part 707)](https://www.ecfr.gov/current/title-12/part-707), GLBA/[Reg P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016), BSA ([31 CFR Chapter X](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X)), RESPA/[Reg X (12 CFR Part 1024)](https://www.ecfr.gov/current/title-12/part-1024), the Fair Housing Act ([42 USC §3605](https://www.law.cornell.edu/uscode/text/42/3605)), FCRA ([15 USC ch. 41 subch. III](https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-III)), FDCPA/[Reg F (12 CFR Part 1006)](https://www.ecfr.gov/current/title-12/part-1006), the SAFE Act ([12 CFR Part 1007](https://www.ecfr.gov/current/title-12/part-1007)), MLA ([32 CFR Part 232](https://www.ecfr.gov/current/title-32/part-232)), SCRA ([50 USC ch. 50](https://www.law.cornell.edu/uscode/text/50/chapter-50)), and UDAAP ([12 USC §5531](https://www.law.cornell.edu/uscode/text/12/5531), [§5536](https://www.law.cornell.edu/uscode/text/12/5536)); California overlays include the CCFPL and related statutes examined by DFPI ([Cal. Fin. Code Division 24](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=)).

**SYSTEM BEHAVIOR:** Compliance maintains a current inventory of all federal and California laws and regulations applicable to the credit union's products and activities. Each inventory entry records the authority, the products/activities it touches, the owning policy, and the date last reviewed. The inventory is updated whenever a regulatory change is identified (see [CMP-08](#cmp-08-regulatory-change-and-complaint-management)) and reviewed in full at least annually; entries for products the credit union does not offer are marked not-applicable with the rationale rather than deleted, so the scoping judgment is itself auditable. The inventory is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulatory change identified or new product/activity launched (`regulatory.change_identified`) | Authority citation (`regulation.citation`), affected products/activities (`regulation.affected_products[]`), owning policy (`policy.owner_ref`) | Inventory entry added or updated (`regulation.inventory_updated`) | 30 days from identification (internal: 10 BD triage) |
| Annual inventory review cycle (`regulation.inventory_review_due`) | Full inventory (`regulation.inventory[]`), product list (`product.catalog[]`) | Reviewed inventory with applicability rationale, presented in the quarterly Board report (`regulation.inventory_reviewed`) | Annually (enforced by `regulation.inventory_review_due_at`) |

**ALERTS/METRICS:** Inventory staleness alert when any entry's last-review date exceeds 12 months; count of products/activities with no mapped authority (target zero); count of authorities with no owning policy (target zero).

## CMP-03 — Roles and Responsibilities

**WHY (Reg cite):** Board duties to direct management and ensure sound operations are grounded in [12 CFR §701.4(b)](https://www.ecfr.gov/current/title-12/part-701/section-701.4#p-701.4(b)); a named compliance official with defined responsibilities is a baseline CMS expectation reflected in NCUA's consumer-compliance examination program and DFPI supervision under the [CCFPL](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=).

**SYSTEM BEHAVIOR:** The CCO is responsible for the CMS as a whole: conducting risk assessments, formulating and updating policies, procedures, and internal controls, coordinating training with HR, monitoring consumer complaints, coordinating visits and reviews with outside consultants and auditors, and managing regulatory exams. Department managers are responsible for compliance in their functional areas — knowing the laws affecting their area, assisting in drafting and implementing procedures, and coordinating corrections. If the CCO cannot serve, the CFO and/or Operations Officer act as the designated backup until the Board appoints a successor; the backup inherits the direct Board reporting line in [CMP-01](#cmp-01-governance-and-board-reporting-line) for the duration. The CCO maintains compliance knowledge through seminars, workshops, and conferences. The role-assignment register (who holds each compliance responsibility) is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Compliance responsibility assigned or changed (`compliance.role_assigned`) | Role definition (`role.definition`), assignee identity (`employee.id`), effective date (`role.effective_date`) | Updated role-assignment register entry (`compliance.role_register_updated`) | 5 business days of the change |
| CCO unable to serve or position vacated (`compliance.officer_vacancy`) | Backup designation (`role.backup_assignees[]` — CFO and/or Operations Officer), open-items handoff list (`compliance.open_items[]`) | Backup activation recorded and Board notified (`compliance.backup_activated`) | Immediate assumption of duties; Board notified within 5 BD |

**ALERTS/METRICS:** Alert when any CMS responsibility in the register has no current assignee (target zero unassigned roles); alert when a backup activation runs longer than 90 days without a Board-approved succession plan.

## CMP-04 — Compliance Risk Assessments

**WHY (Reg cite):** Risk-focused supervision under NCUA's examination program and the audit-planning expectations of [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) require the institution to know where its compliance risk is concentrated; UDAAP exposure under [12 USC §5531](https://www.law.cornell.edu/uscode/text/12/5531) is assessed the same way by CFPB-aligned examiners and DFPI.

**SYSTEM BEHAVIOR:** The CCO conducts a compliance risk assessment at least annually, and upon material change in products, services, or regulation, scoring each regulated activity for inherent risk, control strength, and residual risk. The output is a ranked view of where compliance risk is concentrated, and it directly drives the monitoring and assurance plan in [CMP-06](#cmp-06-monitoring-and-assurance-reviews) — higher-residual-risk areas get more frequent and deeper review. The assessment methodology and scores are presented to the Board with the next quarterly report. The risk-assessment workbook is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual cycle or material change in products/regulation (`compliance.risk_assessment_due`) | Regulated-activity list from the inventory (`regulation.inventory[]`), prior findings (`finding.history[]`), complaint trends (`complaint.trend_summary`), volume data (`product.volume_stats`) | Completed risk assessment with residual-risk ranking (`compliance.risk_assessment_completed`) | Annually (internal: complete within 60 days of cycle open; enforced by `compliance.risk_assessment_due_at`) |
| Risk assessment accepted (`compliance.risk_assessment_completed`) | Residual-risk ranking (`risk.residual_ranking[]`) | Updated monitoring plan reflecting the ranking (`monitoring.plan_updated`) | 30 days after assessment completion |

**ALERTS/METRICS:** Alert when the risk assessment ages past 12 months; percentage of high-residual-risk areas covered by the current monitoring plan (target 100%).

## CMP-05 — Training Standards

**WHY (Reg cite):** Trained staff is a baseline expectation of every federal regulator's CMS framework and is explicit in several authorities the credit union operates under — e.g., BSA training under [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.210) and identity-theft Red Flags program training under [12 CFR Part 717 Subpart J](https://www.ecfr.gov/current/title-12/part-717/subpart-J); substantive curricula live in the owning policies, but coverage standards and records are managed here.

**SYSTEM BEHAVIOR:** Every employee is trained on compliance. New employees complete onboarding compliance training within 30 days of hire, covering the policies relevant to their role; all employees complete annual refresher training, delivered through Team Development Day sessions, online modules, or both. The compliance team may assign remedial training when monitoring, audit, complaint, or exam results show a knowledge gap, and remedial assignments carry their own due dates. Attendance records are retained by both Compliance and HR. Department managers confirm their staff complete assigned training; an employee who misses a training deadline is escalated to their manager and the CCO. Training-record entries are write-restricted to Compliance and HR.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee start date (`employee.onboarded`) | Employee role (`employee.role`), role-based curriculum (`training.curriculum_map`) | Onboarding training completion record retained by Compliance and HR (`training.onboarding_completed`) | 30 days of hire (enforced by `training.onboarding_due_at`) |
| Annual training cycle opens (`training.annual_cycle_opened`) | Employee roster (`employee.roster[]`), refresher curriculum (`training.refresher_curriculum`) | Per-employee completion records and a coverage report for the Board package (`training.refresher_completed`) | Within the calendar year; 100% coverage (internal: 90% by Q3; enforced by `training.cycle_close_at`) |
| Knowledge gap identified by monitoring, audit, complaint, or exam (`training.remedial_assigned`) | Finding reference (`finding.id`), affected employees (`employee.ids[]`), remedial module (`training.module_id`) | Remedial completion record (`training.remedial_completed`) | Per assignment, default 30 days |

**ALERTS/METRICS:** Training coverage percentage by cycle (target 100%); count of employees past a training due date (aging alert at 7 days overdue); remedial-training closure rate within the assigned window.

## CMP-06 — Monitoring and Assurance Reviews

**WHY (Reg cite):** Ongoing monitoring is the "Detect" leg of the CMS expected by NCUA's consumer-compliance examination program and DFPI under the [CCFPL](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=); review documentation must be retained in a form examiners can rely on, consistent with [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation).

**SYSTEM BEHAVIOR:** Compliance performs ongoing monitoring and periodic assurance reviews of regulated activities according to the risk-ranked plan from [CMP-04](#cmp-04-compliance-risk-assessments). Each review documents the scope (what was reviewed), the population and sample, the test steps, and the findings — in enough detail that an independent reviewer can replicate the result. The monitoring log shows, at any time, what was reviewed over the trailing 12 months and what was found. Findings are assigned an owner and a corrective-action due date, and open findings roll into the quarterly Board report. A review that finds no exceptions is still logged with its scope and sample, since coverage evidence is the point. Monitoring workpapers are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled review comes due per the monitoring plan (`monitoring.review_due`) | Review scope (`monitoring.scope`), population and sample (`monitoring.sample_spec`), test procedures (`monitoring.test_steps[]`) | Documented review workpaper with findings, replicable by an independent reviewer (`monitoring.review_completed`) | Per plan date (internal: workpaper finalized within 15 BD of fieldwork; enforced by `monitoring.review_due_at`) |
| Review identifies an exception (`finding.opened`) | Finding description (`finding.description`), responsible manager (`finding.owner`), severity (`finding.severity`) | Corrective-action plan with due date, tracked to closure (`finding.corrective_action_logged`) | Owner assigned within 5 BD; due date per severity |
| Trailing-12-month coverage check (`monitoring.coverage_review_due`) | Monitoring log (`monitoring.log[]`), risk ranking (`risk.residual_ranking[]`) | Coverage summary for the Board package (`monitoring.coverage_reported`) | Quarterly |

**ALERTS/METRICS:** Monitoring-plan completion rate (target 100% of scheduled reviews); count of high-risk areas with no review in the trailing 12 months (target zero); corrective-action aging with alert at 30 days past due.

## CMP-07 — Independent Audit

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the supervisory committee to obtain an annual audit independent of management, and [12 CFR §715.4](https://www.ecfr.gov/current/title-12/part-715/section-715.4) frames the audit-responsibility loop that routes findings back to credit union governance.

**SYSTEM BEHAVIOR:** The compliance system is audited by an external/independent party at least annually. The audit reviews the CMS itself — including the assurance reviews in [CMP-06](#cmp-06-monitoring-and-assurance-reviews) — and tests whether the documented reviews can be replicated: same scope, same sample logic, same conclusion. Audit findings, management responses, and corrective actions are routed to the Board (or its Audit/Risk committee), not filtered through executive management, and are tracked on the corrective-action log until closed. The CCO coordinates auditor access but does not edit audit conclusions; the audit-report repository is write-restricted to the auditor and the Board/Audit-Risk committee, with Compliance holding read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual audit cycle opens (`audit.compliance_audit_due`) | Engagement scope (`audit.engagement_scope`), monitoring workpapers (`monitoring.log[]`), prior findings (`finding.history[]`) | Independent audit report including replication results on assurance reviews (`audit.report_issued`) | At least annually (enforced by `audit.compliance_audit_due_at`) |
| Audit report issued (`audit.report_issued`) | Findings (`audit.findings[]`), management responses (`audit.management_responses[]`) | Board/Audit-Risk committee presentation and corrective-action entries (`audit.findings_routed_to_board`) | Next Board/committee meeting (internal: within 45 days of issuance) |
| Corrective action closes (`finding.closed`) | Evidence of remediation (`finding.closure_evidence`) | Closure entry on the corrective-action log (`finding.closure_logged`) | Per finding due date |

**ALERTS/METRICS:** Audit completed within 12 months of the prior audit (binary, target yes); percentage of assurance reviews the auditor could replicate (target 100%); audit-finding closure rate by due date.

## CMP-08 — Regulatory-Change and Complaint Management

**WHY (Reg cite):** Responding to regulatory change is core to maintaining compliance with the inventory in [CMP-02](#cmp-02-scope-of-applicable-laws); complaint management is an explicit CMS pillar because complaints evidence potential UDAAP issues under [12 USC §5531](https://www.law.cornell.edu/uscode/text/12/5531) and [§5536](https://www.law.cornell.edu/uscode/text/12/5536), and DFPI exercises complaint-driven oversight under the [CCFPL](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=).

**SYSTEM BEHAVIOR:** All correspondence from regulatory agencies and other regulatory-change sources is directed to the CCO. The CCO, consulting affected department managers, analyzes each item to determine required action: updating the law inventory ([CMP-02](#cmp-02-scope-of-applicable-laws)), revising procedures, and scheduling training for affected personnel ([CMP-05](#cmp-05-training-standards)). Where analysis concludes training is unnecessary, a memorandum on the new procedures circulated to appropriate personnel satisfies the implementation step. Consumer complaints are managed as a compliance signal: complaints from any channel are logged centrally, and the CCO reviews the log quarterly for patterns suggesting a disclosure, training, or practice issue, feeding results into the risk assessment ([CMP-04](#cmp-04-compliance-risk-assessments)) and the Board report. Complaint-handling SLAs specific to collections live in the Collections Policy. The regulatory-change log and complaint log are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Regulatory correspondence or change notice received (`regulatory.correspondence_received`) | Source document (`regulatory.source_doc`), affected areas (`regulation.affected_products[]`) | Routing record to CCO and change-analysis entry (`regulatory.change_analysis_logged`) | Routed within 1 BD; analysis within 30 days (enforced by `regulatory.analysis_due_at`) |
| Analysis concludes change is required (`regulatory.change_required`) | Procedure deltas (`procedure.change_set`), affected personnel (`employee.affected_ids[]`) | Updated procedures plus scheduled training or circulated memorandum (`regulatory.change_implemented`) | By the regulation's effective date (internal: 30 days before effective date where lead time allows) |
| Consumer complaint received in any channel (`complaint.received`) | Channel (`complaint.channel`), subject area (`complaint.category`), narrative (`complaint.narrative`) | Complaint log entry with resolution tracking (`complaint.logged`) | Logged within 2 BD; resolution per owning-policy SLA |
| Quarterly complaint trend review (`complaint.trend_review_due`) | Complaint log (`complaint.log[]`) | Pattern analysis included in the Board report (`complaint.trend_reported`) | Quarterly |

**ALERTS/METRICS:** Regulatory items unanalyzed at 30 days (target zero); changes not implemented by their regulatory effective date (target zero, escalates to Board immediately); complaint-log completeness (every channel reporting each quarter); repeat-category complaint alert when a category recurs above threshold in a quarter.

## CMP-09 — Review Cadence

**WHY (Reg cite):** Annual board review and approval of compliance policies is the operating expectation under the board governance duties of [12 CFR §701.4](https://www.ecfr.gov/current/title-12/part-701/section-701.4) and the annual audit cycle of [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715), which together presume a current, board-approved CMS.

**SYSTEM BEHAVIOR:** This policy and the CMS it describes are reviewed and re-approved by the Board at least annually, and sooner upon material regulatory change identified through [CMP-08](#cmp-08-regulatory-change-and-complaint-management). The CCO prepares the review draft, incorporating the year's risk assessment, monitoring results, audit findings, and regulatory changes; the Board's approval is recorded in minutes with the version approved. Interim non-material edits (titles, links, typographical corrections) may be made by the CCO and are batched into the next annual approval. The policy document of record is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle or material regulatory change (`policy.review_due`) | Current policy version (`policy.version`), year's risk/monitoring/audit/change inputs (`compliance.annual_inputs[]`) | Reviewed draft submitted to the Board (`policy.review_submitted`) | Annually, or within 60 days of a material change (enforced by `policy.review_due_at`) |
| Board approves the policy (`policy.board_approved`) | Reviewed draft (`policy.draft_id`), Board resolution (`board.resolution_id`) | New approved version published with approval recorded in minutes (`policy.version_published`) | Next regular Board meeting after submission |

**ALERTS/METRICS:** Days since last Board approval (alert at 11 months); count of material regulatory changes not followed by a policy review within 60 days (target zero).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the CMS, this policy's content, and the Board reporting line in [CMP-01](#cmp-01-governance-and-board-reporting-line).
- **Approvers:** Patrick Wilson, Chief Compliance Officer; Board of Directors approval per [CMP-09](#cmp-09-review-cadence).
- **Review cadence:** Reviewed and re-approved by the Board at least annually and upon material regulatory change ([CMP-09](#cmp-09-review-cadence)); next scheduled review per the front-matter `next_review` date.
- **Required participants:** Board of Directors (and its Audit/Risk committee), department managers, Human Resources, Internal Audit.
- **Cross-references (substantive rules live in their owning policies):** BSA/AML program design and SAR/CTR filing — BSA Policy. Fair-lending testing and adverse-action methodology — Fair Lending Policy. Member privacy and GLBA safeguarding mechanics — Privacy Policy and Information Security Policy. Collections conduct and collections complaint SLAs — Collections Policy. Internal audit charter and internal-control framework — Audit Policy and Internal Controls Policy. Insider loans and director conflicts — Director Fiduciary Duties Policy and Lending Policy. Record-retention schedules — Record Retention Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The current `vocabulary.json` (Cassandra Banking Core API) defines no events and is banking-core only; none of the compliance-program codes used in the EVENTS tables (`compliance.*`, `regulatory.*`, `regulation.*`, `training.*`, `monitoring.*`, `audit.*`, `finding.*`, `complaint.*`, `policy.*`, `board.*`, `employee.*`, `risk.*`, `procedure.*`, `role.*`, `product.*`) are yet registered. These are the target naming scheme and will be confirmed by engineering before the next review.
- **Quarterly Board-report deadline (45 days after quarter end) is an internal standard**, not a regulatory deadline; Patrick's notes require "at least quarterly" reporting without a delivery SLA. Confirm the 45-day window with the Board.
- **Onboarding-training window of 30 days and the 2-business-day complaint-logging SLA are assumed defaults**; the notes set the obligations but not the timeframes. Confirm with HR and the complaint-handling owners.
- **Remedial-training default due date of 30 days** is an assumption; the notes authorize remedial assignment without a deadline standard.
- **The Audit/Risk committee structure is assumed to exist.** Patrick's notes say the reporting line runs to "the Board (or its Audit/Risk committee)"; whether Pynthia uses a combined Audit/Risk committee, a supervisory committee under NCUA Part 715, or the full Board needs confirmation, since it determines who receives [CMP-01](#cmp-01-governance-and-board-reporting-line) and [CMP-07](#cmp-07-independent-audit) outputs.
- **Charter type is assumed to be a federally insured, California state-chartered credit union** supervised by DFPI with NCUA share insurance — which is why both NCUA rules (Parts 701, 715, 749) and DFPI/CCFPL authorities are cited. If Pynthia is federally chartered, the DFPI overlay narrows and NCUA citations control; if state-chartered, some Part 701 governance cites apply by analogy or through parallel California Financial Code provisions and should be confirmed.
- **The applicable-law inventory's full contents are not reproduced here by design** — [CMP-02](#cmp-02-scope-of-applicable-laws) governs the inventory as a living artifact rather than freezing a statute list in policy text, a deliberate departure from the reference policies' long in-document lists. Confirm the CCO is comfortable with the inventory living outside the policy document.
- **HMDA reporter status, SAFE Act registration applicability, and other product-dependent calls** are deferred to the inventory in [CMP-02](#cmp-02-scope-of-applicable-laws) and need confirmation against Pynthia's actual product set.
