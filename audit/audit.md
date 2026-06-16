---
title: Audit Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Audit, Internal Audit, Supervisory Committee, Independence]
---

## General Policy Statement

Pynthia Credit Union maintains an independent, risk-focused audit function that tests the design and operating effectiveness of key controls, systems, and procedures across all operational, compliance, financial, and IT functions. The audit function reports functionally to the Audit Committee — not management — holds unrestricted access to records, personnel, and systems, and carries no operational responsibilities so as to preserve independence. Audit frequency and scope are driven by risk assessment results; findings are documented, risk-rated, tracked, escalated, and closed under disciplined governance; and results are reported to the Audit Committee and the Board of Directors. This policy is reviewed and approved by the Board at least annually.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Board approves this policy | Board review cycle opens (`policy.board_review_started`) | Annually | Board minutes record approval | [AU-01](#au-01-board-of-directors-oversight) |
| Audit Committee meets to oversee audit function | Committee meeting scheduled (`audit.committee_meeting_scheduled`) | Monthly | Committee minutes | [AU-02](#au-02-audit-committee-governance-and-independence) |
| Annual audit plan submitted for approval | Plan year starts (`audit.plan_year_started`) | Annually | Approved scope, frequency schedule, risk assessment | [AU-04](#au-04-risk-based-audit-scope-and-frequency) |
| Defined audit types executed | Plan cycle opens (`audit.plan_cycle_opened`) | At least annually | Completed engagements | [AU-05](#au-05-audit-types-and-network-assessments) |
| Audit report finalized | Fieldwork completed (`audit.fieldwork_completed`) | Per schedule | Report with risk ratings, root cause, responses | [AU-06](#au-06-audit-reporting-and-work-papers) |
| Findings reviewed monthly | Monthly review window (`finding.monthly_review_recorded`) | Monthly | Compliance Committee minutes | [AU-07](#au-07-finding-tracking-and-escalation) |
| Finding older than 3 months | Aging threshold breached (`finding.aging_threshold_breached`) | >3 months | Escalation to Audit Committee/Board | [AU-07](#au-07-finding-tracking-and-escalation) |
| All findings reported to Audit Committee | Quarterly report due (`finding.quarterly_report_delivered`) | Quarterly | Quarterly finding report | [AU-07](#au-07-finding-tracking-and-escalation) |
| Management responds or accepts risk | Report finalized (`audit.report_issued`) | 30 days from final report date | Remediation plan or risk acceptance | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Finding closure verified | Remediation reported (`finding.remediation_reported`) | Before closure | Follow-up validation record | [AU-09](#au-09-follow-up-audits) |
| Work papers and reports retained | Report finalized (`audit.report_issued`) | 7 years from report date | Retention/disposal record | [AU-10](#au-10-work-paper-retention-and-physical-control) |

## AU-01 — Board of Directors Oversight  {#au-01-board-of-directors-oversight}

**WHY (Reg cite):** NCUA Supervisory Committee Audit rules require the board to establish and rely on the Supervisory/Audit Committee for independent oversight of the credit union's books and records ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); independent program testing flows from the board's security-program duty ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** The Board establishes the Audit Committee, reviews testing results to confirm sufficient resources are invested to implement and test approved controls, and reviews and approves this policy at least annually. The annual board review cycle is opened on a timer; on approval the resolution and minutes are recorded as the authoritative evidence of board oversight. Policy approval and the board-approval timer are write-restricted to Board Governance; Compliance maintains the policy document of record.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual board review cycle opens (`governance.board_cycle_opened`) | Policy document and version (`policy.document_id`, `policy.document_version`), prior board resolution (`board.resolution_id`) | Board review started + scheduled approval task (`policy.board_review_started`) | 12 months (enforced by `policy.board_approval_due_at`) |
| Board reviews audit testing results and resource adequacy (`board.audit_review_recorded`) | Annual results summary (`audit.annual_results_summary`), resource assessment (`audit.resource_assessment`) | Board audit-review minutes (`board.minutes_recorded`) | Annually (enforced by `board.notification_due_at`) |
| Board approves the Audit Policy (`policy.board_approved`) | Approving resolution (`board.resolution_id`), policy version (`policy.document_version`) | Board-approved policy of record (`governance.policy_approved`) | 12 months (enforced by `policy.next_review_at`) |

**ALERTS/METRICS:** Alert when `policy.review_warning_at` fires ahead of the annual deadline; target zero lapsed board approvals (`policy.review_lapsed` count = 0) and zero quarters without a recorded board audit-review.

## AU-02 — Audit Committee Governance and Independence  {#au-02-audit-committee-governance-and-independence}

**WHY (Reg cite):** The Supervisory/Audit Committee must oversee the audit function independent of management and obtain the required audit of books and records ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); independence of testing from program developers/maintainers is required ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** A designated Audit Committee oversees the audit function and meets at least monthly. It develops and manages the audit program, approves audit frequencies, schedules, objectives, and scope, engages external auditors, promptly reviews and approves audit reports, delivers results to the Board, and oversees responses. To preserve independence, the committee holds hiring/firing authority over the Chief Audit Executive and controls the audit budget; any CAE personnel action or budget change is recorded as committee evidence. Monthly meeting cadence is enforced by a recurring committee-meeting timer; if a month closes without a recorded committee meeting an independence escalation is raised. Committee minutes, CAE personnel actions, and budget controls are write-restricted to the Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit Committee meeting scheduled (`audit.committee_meeting_scheduled`) | Committee roster, agenda, prior minutes (`audit.distribution_list`) | Scheduled monthly meeting + recurring timer (`audit.committee_meeting_scheduled`) | Monthly (enforced by `audit.monthly_schedule_due`) |
| Committee meeting held and minuted (`audit.committee_minutes_recorded`) | Agenda items, attendance, decisions on scope/budget/personnel (`audit.budget_status`, `audit.cae_personnel_action`) | Committee minutes of record (`audit.committee_minutes_recorded`) | Monthly (enforced by `audit.monthly_schedule_due`) |
| External auditor engagement proposed (`audit.external_engagement_proposed`) | Engagement scope and cost (`audit.engagement_scope`, `audit.engagement_cost`) | Approved/declined engagement decision (`audit.external_engagement_approved`) | Per plan (enforced by `audit.cycle_timer`) |
| CAE hire/fire or budget action recorded (`audit.cae_action_recorded`) | Personnel/budget basis (`audit.cae_personnel_action`, `audit.budget_status`), independence attestation (`auditor.independence_attestation`) | CAE/budget action record + independence escalation if raised (`audit.cae_action_recorded`) | Same meeting cycle (enforced by `audit.monthly_schedule_due`) |

**ALERTS/METRICS:** Alert on any month closing without recorded committee minutes (`audit.independence_escalation_raised` > 0); target 100% monthly-meeting coverage and zero budget/personnel actions taken outside committee authority.

## AU-03 — Internal Auditor Independence and Reporting  {#au-03-internal-auditor-independence-and-reporting}

**WHY (Reg cite):** Testing must be performed by persons independent of those who develop or maintain the programs under review, with unrestricted access ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)); Supervisory/Audit Committee oversight of an independent audit function is required ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** The Internal Auditor reports functionally to the Audit Committee rather than to management, conducts audits per the approved scope and schedule, has unrestricted access to records, personnel, and systems, holds no operational responsibilities, and reports findings and recommendations on a timely basis. Each engagement records an independence attestation; if access to any record, person, or system is denied, the denial is logged and an independence escalation is routed to the Audit Committee for resolution. Independence attestations and access-denial records are write-restricted to Internal Audit and the Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit engagement started under approved plan (`audit.engagement_started`) | Approved scope (`audit.engagement_scope`), independence attestation (`auditor.independence_attestation`) | Engagement record with independence attestation (`audit.engagement_started`) | Per approved schedule (enforced by `audit.cycle_timer`) |
| Auditor access to records/personnel/systems denied (`auditor.access_denied` via `escalation.created`) | Denial detail (`auditor.access_denial_detail`), reporter (`escalation.reporter_id`) | Independence escalation routed to Audit Committee (`escalation.routed`) | Acknowledge promptly (enforced by `escalation.ack_timer`) |
| Findings and recommendations reported (`audit.management_responses_received`) | Engagement findings (`finding.description`, `finding.risk_rating`), recommendations (`audit.corrective_action`) | Findings delivered to committee (`finding.management_response_recorded`) | Timely per plan (enforced by `finding.response_due_at`) |

**ALERTS/METRICS:** Alert on any logged auditor access denial (target zero); track independence-attestation completeness at 100% of engagements and time-to-resolve any independence escalation.

## AU-04 — Risk-Based Audit Scope and Frequency  {#au-04-risk-based-audit-scope-and-frequency}

**WHY (Reg cite):** Audit frequency and objectives must be set from risk-assessment results, and required audits obtained at least annually ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); periodic independent program testing is required ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Auditors submit an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval. Audits are tentatively scheduled monthly then finalized to allow flexibility when an engagement takes more or less time than expected. Frequency is adjusted based on prior audit ratings and control strength — poor prior ratings shorten the cycle, strong controls with no material exceptions lengthen it — and all scope/frequency changes are documented in work papers with the circumstances and rationale. At a minimum, defined audit types execute at least annually. The annual plan, tentative-to-final schedule, and scope-change documentation are write-restricted to Internal Audit pending Audit Committee approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual plan year starts (`audit.plan_year_started`) | Prior-year ratings (`audit.overall_rating`), risk assessment (`risk.assessment_results`), tentative schedule (`audit.tentative_schedule`) | Annual plan submitted to committee (`audit.annual_plan_submitted`) | Annually (enforced by `audit.assessment_annual_due_at`) |
| Audit Committee approves the plan (`audit.annual_plan_approved`) | Submitted scope/frequency (`audit.annual_plan_id`), committee decision | Approved annual plan + monthly schedule timer (`audit.annual_plan_approved`) | Annually (enforced by `audit.monthly_schedule_due`) |
| Scope or frequency change identified mid-cycle (`audit.gap_detected`) | Change rationale (`audit.scope_change_rationale`), prior rating driver (`audit.poor_rating_recorded`) | Documented scope/frequency change in work papers (`audit.scope_change_documented`) | At change (enforced by `audit.cycle_timer`) |
| Poor prior rating recorded (`audit.poor_rating_recorded`) | Engagement rating (`audit.overall_rating`), affected area | Increased-frequency record (`audit.poor_rating_recorded`) | Next plan cycle (enforced by `audit.assessment_annual_due_at`) |

**ALERTS/METRICS:** Alert if the annual plan is unapproved past `audit.assessment_annual_due_at`; target zero defined audit types missing their at-least-annual execution and 100% of scope/frequency changes documented in work papers.

## AU-05 — Audit Types and Network Assessments  {#au-05-audit-types-and-network-assessments}

**WHY (Reg cite):** Risk-focused audits of internal controls and compliance, plus independent technical testing of IT systems, must be performed at least annually ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)); the Supervisory/Audit Committee obtains the required audit coverage ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)).

**SYSTEM BEHAVIOR:** A range of risk-focused audits is conducted at least annually, including administrative audits (process conformance to documented policy), baseline compliance audits (conformance to regulations/standards), social engineering assessments, and acceptable use assessments, plus technical assessments on internal and external IT systems — vulnerability assessments, penetration tests, and system configuration assessments. IT audit execution and information-security control testing themselves are governed operationally by the Information Security Policy; this control governs that the assessments are scheduled, executed at least annually, and their results captured as audit evidence. Assessment scheduling and completion records are write-restricted to Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Administrative or baseline compliance audit scheduled (`audit.assessment_scheduled`) | Assessment type (`audit.assessment_type`), engagement scope (`audit.engagement_scope`) | Scheduled assessment + annual timer (`audit.assessment_scheduled`) | At least annually (enforced by `audit.compliance_audit_due_at`) |
| Administrative/compliance assessment completed (`audit.assessment_completed`) | Procedures and evidence (`audit.record_written`), findings (`finding.description`) | Completed assessment record (`audit.assessment_completed`) | At least annually (enforced by `audit.assessment_annual_due_at`) |
| Technical assessment (vuln/pentest/config) engaged (`pentest.scheduled`) | Independent provider (`pentest.independence`), scope (`pentest.scope`) | Scheduled technical engagement (`pentest.scheduled`) | At least annually (enforced by `pentest.engagement_due`) |
| Technical assessment report received (`pentest.report_received`) | Findings and severities (`vuln.severity`, `vuln.detail`) | Technical assessment report logged (`pentest.report_issued`) | At least annually (enforced by `pentest.engagement_due`) |

**ALERTS/METRICS:** Alert when any required audit/assessment type approaches its annual due date without a scheduled engagement; target 100% annual coverage of the four audit types plus the three technical assessment types.

## AU-06 — Audit Reporting and Work Papers  {#au-06-audit-reporting-and-work-papers}

**WHY (Reg cite):** Audit results and supporting work must be documented to evidence the required independent audit and its conclusions ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); program-testing results must be documented and reported ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Each audit report documents scope and objective, dates of coverage, findings and deficiencies, recommendations, root cause, management responses, responsible party, and implementation date, with an overall and per-finding risk rating (High/Moderate/Low). Audit work papers document the procedures followed and provide sufficient evidence to support all conclusions, addressing all areas within the audit scope. Detailed work-paper preparation, sample sizing, and exit-interview mechanics are maintained as operating procedures, not in this policy; this control governs that the report and work papers exist, are complete, and are risk-rated. Drafted and finalized reports are write-restricted to Internal Audit pending Audit Committee approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Fieldwork completed and report drafted (`audit.report_drafted`) | Scope/objective (`audit.engagement_scope`), findings (`finding.description`), root cause (`finding.root_cause`), ratings (`audit.overall_rating`, `finding.risk_rating`) | Drafted audit report with ratings (`audit.report_drafted`) | Per schedule (enforced by `audit.cycle_timer`) |
| Management responses received (`audit.management_responses_received`) | Management response (`finding.management_response`), responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Report with responses recorded (`finding.management_response_recorded`) | 30 days of final report (enforced by `finding.response_due_at`) |
| Audit Committee approves report (`audit.report_approved`) | Drafted report (`audit.report_id`), work-paper evidence (`audit.record_written`) | Approved/issued report (`audit.report_issued`) | Promptly per committee cycle (enforced by `audit.monthly_schedule_due`) |
| Report distributed to stakeholders (`audit.report_submitted`) | Distribution list (`audit.distribution_list`), final report (`audit.report_id`) | Distribution record (`audit.report_submitted`) | Per committee cycle (enforced by `audit.monthly_schedule_due`) |

**ALERTS/METRICS:** Alert on any issued report missing a required section (root cause, ratings, responsible party, implementation date); target 100% of reports carrying both overall and per-finding risk ratings and complete work-paper evidence.

## AU-07 — Finding Tracking and Escalation  {#au-07-finding-tracking-and-escalation}

**WHY (Reg cite):** Tracking and reporting of audit and exam findings supports the Supervisory/Audit Committee's oversight of corrective action ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); follow-up on program-testing deficiencies is required ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Findings from internal and external audits and examinations are tracked, monitored, and followed up with department supervisors, with ownership assigned at supervisor level or above. Findings are reviewed at the Compliance Committee monthly; findings older than three months are escalated to the Audit Committee/Board; and all findings are formally reported to the Audit Committee at least quarterly. Aging timers drive monthly review and the three-month escalation automatically. The finding register and aging reports are write-restricted to Internal Audit and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Finding opened and tracked (`finding.opened`) | Finding description (`finding.description`), department (`finding.department`), owner (`finding.responsible_party`), severity (`finding.severity`) | Tracked finding + aging timer (`finding.corrective_action_logged`) | At identification (enforced by `finding.response_due_at`) |
| Monthly Compliance Committee review (`finding.monthly_review_recorded`) | Open finding register (`finding.open_report`), remediation status (`finding.remediation_status`) | Monthly review record (`finding.monthly_review_recorded`) | Monthly (enforced by `finding.monthly_review_due`) |
| Finding ages past three months (`finding.aging_threshold_breached`) | Finding age, remediation status (`finding.remediation_status`) | Escalation to Audit Committee/Board (`finding.escalated`) | >3 months (enforced by `finding.escalation_due_at`) |
| Quarterly report to Audit Committee (`finding.quarterly_report_delivered`) | All findings and ratings (`finding.risk_rating`, `finding.remediation_status`) | Quarterly finding report delivered (`finding.quarterly_report_delivered`) | Quarterly (enforced by `finding.quarterly_report_due`) |

**ALERTS/METRICS:** Alert on findings breaching the three-month aging threshold (`finding.aging_threshold_breached` count) and on any month/quarter without a recorded review or report; target zero un-escalated findings older than three months.

## AU-08 — Management Response and Risk Acceptance  {#au-08-management-response-and-risk-acceptance}

**WHY (Reg cite):** The Supervisory/Audit Committee oversees management's response and corrective action to audit findings ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); deficiency remediation from independent testing must be addressed ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Management responds with a remediation action plan or formally accepts the risk no later than 30 days from the final report date; a remediation plan includes an implementation timeline, personnel involved, and the processes/procedures to be updated. Risk acceptance must be fully documented, provided to the Audit Committee, and generally requires Board-level approval to close. A response timer runs from the final report date; risk-acceptance decisions are routed to the Audit Committee and Board. Risk-acceptance packages and decisions are write-restricted to the Audit Committee and Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Final report issued, response clock starts (`audit.report_issued`) | Final report (`audit.report_id`), responsible party (`finding.responsible_party`) | Response task opened (`finding.management_response_recorded`) | 30 days from final report (enforced by `finding.response_due_at`) |
| Management submits remediation plan (`finding.remediation_reported`) | Implementation timeline (`finding.implementation_date`), owner (`finding.responsible_party`), remediation evidence (`finding.remediation_evidence`) | Recorded remediation plan (`finding.corrective_action_logged`) | ≤30 days from final report (enforced by `finding.response_due_at`) |
| Management proposes risk acceptance (`finding.risk_acceptance_proposed`) | Acceptance package (`finding.risk_acceptance_package`), rationale (`finding.risk_acceptance_rationale`) | Risk-acceptance proposal to committee (`finding.risk_acceptance_proposed`) | ≤30 days from final report (enforced by `risk_acceptance.decision_due_at`) |
| Audit Committee/Board decides risk acceptance (`finding.risk_acceptance_decided`) | Board resolution (`board.resolution_id`), acceptance package (`finding.risk_acceptance_package`) | Risk-acceptance decision recorded (`risk_acceptance.decided`) | At committee/board cycle (enforced by `risk_acceptance.decision_due_at`) |

**ALERTS/METRICS:** Alert on any finding past 30 days from final report with no response or acceptance (target zero); track count of open risk acceptances lacking Board approval.

## AU-09 — Follow-Up Audits  {#au-09-follow-up-audits}

**WHY (Reg cite):** Independent verification that deficiencies are remediated supports the Supervisory/Audit Committee's corrective-action oversight ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)) and required follow-up on program-testing deficiencies ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Internal Audit reviews all identified findings prior to closure to confirm management has remediated them appropriately; closure requires validation evidence, and a rejected closure reopens the finding. Poor prior audit ratings drive enhanced audit review frequency and feed the annual risk assessment used by [AU-04](#au-04-risk-based-audit-scope-and-frequency). Closure verification and reopening are write-restricted to Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Management reports remediation complete (`finding.remediation_reported`) | Closure evidence (`finding.closure_evidence`), remediation evidence (`finding.remediation_evidence`) | Closure-verification task opened (`finding.closure_logged`) | Before closure (enforced by `finding.response_due_at`) |
| Internal Audit verifies remediation (`finding.closure_verified`) | Validation result (`finding.closure_evidence`), retest result (`deficiency.retest_result`) | Finding closed (`finding.closed`) | Before closure (enforced by `audit.remediation_due`) |
| Verification fails / closure rejected (`finding.closure_rejected`) | Reason, residual deficiency (`deficiency.reopened`) | Finding reopened (`finding.closure_rejected`) | At verification (enforced by `audit.remediation_timer`) |

**ALERTS/METRICS:** Alert on closures logged without verification evidence (target zero unverified closures) and on reopened-finding rate; track count of poor-rated areas driving enhanced frequency in the next plan cycle.

## AU-10 — Work Paper Retention and Physical Control  {#au-10-work-paper-retention-and-physical-control}

**WHY (Reg cite):** Audit records evidencing the required independent audit must be retained and controlled ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); records supporting program testing must be preserved and protected ([12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748)).

**SYSTEM BEHAVIOR:** Work papers and audit reports are retained for seven years after the audit report date. Work papers are the property of Internal Audit, kept under their control and in a secure location not readily available to unauthorized persons; requests for access by persons outside Internal Audit require Audit Committee approval. Retention timers anchor on the report date and gate disposal; an active legal hold suspends disposal until released. Work papers, the retention clock, and external-access decisions are write-restricted to Internal Audit and the Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit report finalized (`audit.report_issued`) | Report date anchor (`audit.report_id`), retention class (`record.retention_class`) | Retention clock set (`audit.retention_applied`) | 7 years from report date (enforced by `audit.retention_expires_at`) |
| External party requests work-paper access (`audit.workpaper_access_requested`) | Requester and detail (`audit.access_request_detail`), Audit Committee approval | Access decision recorded (`audit.workpaper_access_decided`) | At request (enforced by `escalation.ack_timer`) |
| Retention period expires with no hold (`audit.records_destroyed`) | Hold status (`audit.legal_hold_status`), disposal method (`record.disposal_method`) | Destruction/disposal record (`audit.records_destroyed`) | After 7 years (enforced by `audit.retention_expires_at`) |

**ALERTS/METRICS:** Alert on any external work-paper access without recorded Audit Committee approval (target zero) and on disposal attempts while a legal hold is active; track retention-clock completeness at 100% of issued reports.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintaining this policy and the centralized governance of these controls.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Audit Committee (program oversight, independence, report approval, risk-acceptance approval), Board of Directors (policy approval, resource adequacy, risk-acceptance closure), Internal Audit (execution, reporting, follow-up, work-paper custody).
- **Review cadence:** Board reviews and approves at least annually (see [AU-01](#au-01-board-of-directors-oversight)); the Audit Committee meets at least monthly (see [AU-02](#au-02-audit-committee-governance-and-independence)).
- **Cross-references:** Information Security Policy (IT audit execution and information-security control testing); BSA Policy control BA-15 (BSA/AML independent testing); Internal Controls Policy (control design and ownership); Enterprise Risk Management Policy (risk taxonomy and assessment methodology). Audit work programs are developed, changed, and implemented using regulatory audit manuals (CFPB, OCC, FDIC, Federal Reserve) and updated when guidance changes — maintained as operating procedures outside this policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several audit-domain field and event codes referenced in the control overlays (e.g., `audit.committee_meeting_scheduled`, `audit.cae_action_recorded`, `audit.scope_change_documented`, `audit.workpaper_access_requested`, `audit.retention_applied`, `finding.aging_threshold_breached`, `finding.monthly_review_recorded`, `finding.quarterly_report_delivered`, `auditor.access_denied`) and provisional codes (`audit.corrective_action`, `audit.finding_owner`, `finding.id`, `finding.quarterly_summary`) appear in DESIGN_NOTES as registered or provisional entries; any that resolve to provisional spellings are used verbatim per the agreed naming scheme and will be confirmed by engineering before the next review. Deadlines use registered `Task`/timer codes (`audit.*_due_at`, `finding.*_due`, `escalation.*_timer`, `audit.retention_expires_at`).
- **Charter and applicability.** Pynthia Credit Union is assumed to be a federally insured credit union subject to the NCUA Supervisory Committee Audit rule (12 CFR Part 715) and the NCUA security-program/independent-testing rule (12 CFR Part 748); the specific Part 715 audit type and minimum scope applicable to this institution need confirmation. NCUA 701.31 (nondiscrimination in real-estate lending) was considered and intentionally excluded as not implicated by an audit-function policy.
- **Compliance Committee vs. Audit Committee roles.** PATRICK_NOTES place monthly finding review at the Compliance Committee while quarterly reporting and escalation run to the Audit Committee/Board; the exact committee membership, escalation thresholds, and whether the Compliance Committee is a distinct body need confirmation.
- **Risk-acceptance closure authority.** "Generally requires Board-level approval" is modeled as Audit Committee/Board decision; the precise threshold at which Board (vs. committee) approval is mandatory to close a risk acceptance needs confirmation.
- **Scope boundaries.** Detailed audit operating procedures (work-paper preparation, sample sizing, exit interviews, audit work programs), IT audit execution/information-security control testing, BSA/AML independent testing, internal-control design/ownership, and enterprise risk taxonomy/methodology are out of scope here and governed by the cross-referenced policies; this policy governs only that the audits, reports, tracking, and retention occur under independent governance.
