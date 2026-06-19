```yaml
---
title: Audit Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Audit, Internal Audit, Risk Management, NCUA]
---
```

## General Policy Statement

Pynthia Credit Union is committed to maintaining a rigorous, risk-focused audit function that provides independent assurance over the effectiveness of its controls, risk management practices, and compliance with applicable laws and regulations. This policy applies to all operational, compliance, financial, and IT functions of the credit union and governs the work of both internal and external auditors. The audit function reports functionally to the Audit Committee — not to management — and has unrestricted access to all records, personnel, and systems necessary to fulfill its mandate. Audit risk concentrates in the independence of the audit function and in the timely identification, escalation, and remediation of control deficiencies; this policy addresses both through disciplined governance, defined escalation thresholds, and mandatory follow-up. BSA/AML independent testing is governed by the BSA Policy (control BA-15); information security control testing and IT audit execution are governed by the Information Security Policy; day-to-day internal control design is governed by the Internal Controls Policy; and enterprise risk taxonomy and methodology are governed by the Enterprise Risk Management Policy.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual audit plan submitted to Audit Committee | Auditor submits plan (`audit.annual_plan.submitted`) | Annually, before plan year opens | Scope, frequency schedule, risk assessment | [AU-04](#au-04-risk-based-audit-scope-and-frequency) |
| Audit Committee meeting held | Calendar month begins (`audit.committee_meeting.scheduled`) | Monthly | Agenda, minutes, findings review | [AU-02](#au-02-audit-committee-governance-and-independence) |
| Each required audit type executed | Plan year opens (`audit.plan_cycle.opened`) | At least annually | Per AU-05 audit type definitions | [AU-05](#au-05-audit-types-and-network-assessments) |
| Audit report issued to management | Fieldwork complete (`audit.fieldwork.completed`) | Promptly after fieldwork | Scope, findings, ratings, recommendations, root cause, management response, responsible party, implementation date | [AU-06](#au-06-audit-reporting-and-work-papers) |
| Management response / risk acceptance due | Final audit report issued (`audit.report.issued`) | 30 days from final report date | Remediation action plan or documented risk acceptance | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Findings reviewed at Compliance Committee | Month begins (`finding.monthly_review.recorded`) | Monthly | Open findings tracker | [AU-07](#au-07-finding-tracking-and-escalation) |
| Findings older than 3 months escalated | Finding ages past 90 days (`finding.aging_threshold.breached`) | Immediately upon breach | Escalation package to Audit Committee / Board | [AU-07](#au-07-finding-tracking-and-escalation) |
| All findings formally reported to Audit Committee | Quarter closes (`finding.quarterly_report.delivered`) | Quarterly | Full open-findings report | [AU-07](#au-07-finding-tracking-and-escalation) |
| Follow-up audit / finding closure verification | Management asserts remediation complete (`finding.remediation.reported`) | Before closure | Closure evidence reviewed by Internal Audit | [AU-09](#au-09-follow-up-audits) |
| Board reviews and approves this policy | Policy review cycle opens (`policy.board_review.started`) | At least annually | Current policy document | [AU-01](#au-01-board-of-directors-oversight) |
| Work papers and audit reports retained | Audit report issued (`audit.report.issued`) | 7 years from report date | Work papers, audit reports | [AU-10](#au-10-work-paper-retention-and-physical-control) |
| External auditor / work-paper access request | Request received (`audit.workpaper_access.requested`) | Audit Committee decision required before access granted | Access request detail, Audit Committee approval | [AU-10](#au-10-work-paper-retention-and-physical-control) |

---

## AU-01 — Board of Directors Oversight {#au-01-board-of-directors-oversight}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Supervisory/Audit Committee to be established by the board and to oversee the audit function independent of management; the board's responsibility to ensure adequate resources for testing approved controls flows from this supervisory framework. Annual board approval of the audit policy is a standard governance requirement reinforced by NCUA examination expectations.

**SYSTEM BEHAVIOR:** The Board of Directors establishes the Audit Committee by resolution and reviews audit testing results at least annually to confirm that sufficient resources are invested to implement and test approved controls. The Board reviews and approves this policy at least once per calendar year; the policy review cycle is initiated by the Chief Compliance Officer and routed to the Board for approval. The Board receives audit results delivered by the Audit Committee and may receive escalated findings directly when findings exceed the three-month aging threshold. The `policy` record for this document is write-restricted to the Chief Compliance Officer; Board approval is recorded by the Corporate Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle opens (`policy.board_review.started`) | Current policy document (`policy.document_id`, `policy.document_version`), prior Board approval record (`policy.board_approved_at`) | Board-approved policy version (`policy.board.approved`); approval recorded in Board minutes (`board.minutes.recorded`) | Annually (internal: before plan-year start; enforced by `policy.board_approval_due_at`) |
| Board receives audit results from Audit Committee (`board.audit_review.recorded`) | Annual results summary (`audit.annual_results_summary`), resource assessment (`audit.resource_assessment`), Audit Committee delivery record (`audit.results_delivered_to_board`) | Board review record (`board.audit_review.recorded`); minutes updated (`board.minutes.recorded`) | At least annually, coinciding with Audit Committee delivery |

**ALERTS/METRICS:** Alert fires if `policy.board_approval_due_at` passes without a `policy.board.approved` event (target: zero lapses). Dashboard tracks days since last Board audit-results review; threshold alert at 13 months.

---

## AU-02 — Audit Committee Governance and Independence {#au-02-audit-committee-governance-and-independence}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Supervisory/Audit Committee to oversee the audit function and to obtain an annual audit of the credit union's books and records. The Audit Committee's authority over the Chief Audit Executive (CAE) hiring/firing and budget control is the structural mechanism that preserves functional independence from management.

**SYSTEM BEHAVIOR:** The Audit Committee meets at least monthly to fulfill its oversight mandate. It develops and manages the audit program; approves audit frequencies, schedules, objectives, and scope; engages external auditors; promptly reviews and approves audit reports; delivers results to the Board; and oversees responses to audit reports. The Audit Committee holds exclusive hiring and firing authority over the Chief Audit Executive and controls the audit budget. Audit Committee meeting minutes are recorded in the `audit.committee_minutes` field and are write-restricted to the Audit Committee Secretary; the `audit.cae_personnel_action` field is write-restricted to the Audit Committee Chair. Any independence impairment (e.g., management attempt to restrict audit scope or access) must be escalated immediately via `audit.independence_escalation_raised`.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly meeting scheduled (`audit.committee_meeting.scheduled`) | Prior month's minutes (`audit.committee_minutes`), open findings tracker (`finding.open_report`), pending audit reports (`audit.report_id`) | Meeting minutes recorded (`audit.committee_minutes.recorded`); findings review logged (`finding.monthly_review.recorded`) | Monthly (internal: within 5 BD of month-end; enforced by `audit.monthly_schedule_due`) |
| Audit report submitted for Audit Committee approval (`audit.report.submitted`) | Draft report (`audit.report_id`), engagement scope (`audit.engagement_scope`), overall rating (`audit.overall_rating`), management responses (`audit.management_responses`) | Approved audit report (`audit.report.approved`); distribution to Board logged (`audit.results_delivered_to_board`) | Promptly; internal SLA: within 10 BD of submission |
| External auditor engagement proposed (`audit.external_engagement.proposed`) | Engagement scope (`audit.engagement_scope`), engagement cost (`audit.engagement_cost`), provider identity | Audit Committee approval recorded (`audit.external_engagement.approved`) | Before engagement commences |
| CAE personnel action required (hire/fire) | Personnel action detail (`audit.cae_personnel_action`) | CAE action recorded (`audit.cae_action.recorded`) | Per Audit Committee decision; no regulatory deadline |
| Independence impairment identified | Description of impairment (`audit.independence_escalation_raised`) | Escalation raised and logged (`audit.gap.detected`); Board notified (`board.audit_review.recorded`) | Immediately upon identification |

**ALERTS/METRICS:** Alert fires if no `audit.committee_minutes.recorded` event occurs within 35 calendar days of the prior meeting (target: zero missed months). Separate alert if `audit.report.submitted` ages more than 10 BD without `audit.report.approved`.

---

## AU-03 — Internal Auditor Independence and Reporting {#au-03-internal-auditor-independence-and-reporting}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that the audit function be independent of the operations it reviews. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires periodic independent testing by staff independent of those who develop or maintain the programs under review.

**SYSTEM BEHAVIOR:** The Internal Auditor reports functionally to the Audit Committee, not to management. The Internal Auditor conducts audits per the approved scope and schedule, has unrestricted access to all records, personnel, and systems, holds no operational responsibilities, and reports findings and recommendations on a timely basis. Access grants to records and systems for audit purposes are logged in `auditor.access_grant`; any denial of access is immediately escalated via `auditor.access_denied` and routed to the Audit Committee. The Internal Auditor attests annually to independence using `auditor.independence_attestation`. The `auditor.independence_attestation` field is write-restricted to the Internal Auditor; `auditor.access_denial_detail` is write-restricted to the Internal Auditor and Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit engagement starts (`audit.engagement.started`) | Approved scope (`audit.engagement_scope`), annual plan reference (`audit.annual_plan_id`), schedule (`audit.tentative_schedule`) | Engagement start logged (`audit.engagement.started`); access grant recorded (`auditor.access_grant`) | Per approved schedule |
| Access to records, personnel, or systems requested during audit | System or record identifier, audit engagement reference (`audit.annual_plan_id`) | Access grant logged (`auditor.access_grant`) or denial escalated (`auditor.access_denied`, `audit.gap.detected`) | Immediately upon request; denial escalated same day |
| Annual independence attestation due | Prior year's attestation (`auditor.independence_attestation`), confirmation of no operational responsibilities | Independence attestation recorded (`auditor.independence_attestation`) | Annually (internal: at plan-year start; enforced by `audit.assessment_annual_due_at`) |
| Audit findings and recommendations ready for reporting | Completed fieldwork (`audit.fieldwork.completed`), findings list (`finding.description`, `finding.risk_rating`, `finding.root_cause`), recommendations | Findings reported to Audit Committee (`audit.report.submitted`) | Promptly after fieldwork; internal SLA: within 15 BD of fieldwork completion |

**ALERTS/METRICS:** Alert fires if `auditor.access_denied` is logged without a corresponding `audit.gap.detected` escalation within 1 BD (target: zero unescalated denials). Annual independence attestation completion tracked; alert if overdue past `audit.assessment_annual_due_at`.

---

## AU-04 — Risk-Based Audit Scope and Frequency {#au-04-risk-based-audit-scope-and-frequency}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Supervisory/Audit Committee to approve the audit program, including frequencies and scope. NCUA examination guidance expects audit frequency to be calibrated to risk, with prior audit ratings as a key input.

**SYSTEM BEHAVIOR:** Auditors submit an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval before the plan year opens. Audits are tentatively scheduled monthly and then finalized, providing scheduling flexibility. Frequency is adjusted based on prior audit ratings (`audit.poor_rating`, `audit.overall_rating`) and control strength: weak controls shorten frequency; strong controls with no material exceptions may lengthen it. All scope and frequency changes are documented in work papers, including a full explanation of circumstances and reasons (`audit.scope_change_rationale`, `audit.scope_change_documented`). The cost of auditing is weighed against the risk of material errors. The annual plan and all scope-change records are write-restricted to the Internal Auditor and Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Plan year approaches (`audit.plan_cycle.opened`) | Prior year audit ratings (`audit.overall_rating`, `audit.poor_rating`), risk assessment results (`risk.assessment_results`), proposed schedule (`audit.tentative_schedule`) | Annual plan submitted to Audit Committee (`audit.annual_plan.submitted`) | Annually, before plan year opens (enforced by `audit.assessment_annual_due_at`) |
| Audit Committee reviews annual plan (`audit.annual_plan.submitted`) | Submitted plan (`audit.annual_plan_id`), scope explanation (`audit.engagement_scope`), frequency rationale | Annual plan approved (`audit.annual_plan.approved`); schedule finalized (`audit.schedule_finalized`) | At the Audit Committee meeting immediately following submission |
| Scope change identified during or before an audit (`audit.scope_change_identified`) | Reason for change (`audit.scope_change_rationale`), operational changes discovered, prior audit program | Scope change documented in work papers (`audit.scope_change_documented`); updated schedule recorded | Before or during the affected audit engagement |
| Poor prior audit rating recorded (`audit.poor_rating.recorded`) | Prior overall rating (`audit.overall_rating`), control weakness description (`finding.description`) | Frequency increase flagged (`audit.frequency_increased`); updated schedule submitted to Audit Committee | At next schedule review; internal SLA: within 30 days of rating |

**ALERTS/METRICS:** Alert fires if `audit.annual_plan.approved` has not occurred by the plan-year start date (target: zero late approvals). Dashboard tracks count of scope changes per plan year; spikes trigger Audit Committee notification.

---

## AU-05 — Audit Types and Network Assessments {#au-05-audit-types-and-network-assessments}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires an annual audit of the credit union's books and records and evaluation of risk management practices. [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires periodic independent testing of security and compliance programs, including technical assessments of IT systems, by parties independent of those who develop or maintain them. Audit work programs are developed and updated using regulatory audit manuals (CFPB, OCC, FDIC, Federal Reserve) and revised when regulatory guidance changes.

**SYSTEM BEHAVIOR:** The following audit types and network assessments must each be executed at least annually. Each engagement is risk-focused, promotes sound controls, and informs the Board of the effectiveness of risk management. Follow-up on prior audit and examination findings is incorporated where possible. **Administrative Audit** — verifies current processes conform to documented policies via interview, observation, and documentation review. **Baseline Compliance Audit** — verifies processes and policies conform to regulations, standards, or other baselines. **Social Engineering Assessment** — tests employee recognition of and response to social engineering attacks. **Acceptable Use Assessment** — verifies employee awareness of and compliance with the Acceptable Use Policy and related agreements using specialized scanning tools. **Vulnerability Assessment** — identifies known vulnerabilities on internal IT systems using specialized scanning tools. **Penetration Test** — probes IT systems and networks for vulnerabilities using specialized tools. **System Configuration Assessment** — verifies systems conform to an industry-accepted standard or baseline using scanning tools and physical observation. Execution of IT-specific assessments (vulnerability, penetration, configuration) is coordinated with the Information Security Policy; this policy governs scheduling, independence, and reporting of results. Each assessment type is tracked as a separate `audit.assessment_type` record; the `audit.cycle_timer` enforces the annual cadence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Plan year opens and each assessment type is due (`audit.plan_cycle.opened`) | Approved annual plan (`audit.annual_plan_id`), assessment type (`audit.assessment_type`), prior results (`audit.annual_results_summary`) | Assessment scheduled (`audit.assessment.scheduled`) | Annually per approved schedule (enforced by `audit.cycle_timer`) |
| Assessment fieldwork begins (`audit.engagement.started`) | Engagement scope (`audit.engagement_scope`), assessment type (`audit.assessment_type`), independence confirmation (`auditor.independence_attestation`) | Fieldwork logged (`audit.fieldwork.logged`) | Per schedule |
| Assessment fieldwork complete (`audit.fieldwork.completed`) | Completed procedures, findings (`finding.description`, `finding.risk_rating`), work papers | Assessment completed (`audit.assessment.completed`); report drafted (`audit.report.drafted`) | Promptly after fieldwork |
| Audit work programs require update due to regulatory guidance change | Regulatory change identified (`regulatory.change_identified`), updated audit manual reference | Work program updated; scope change documented (`audit.scope_change_documented`) | Upon identification of regulatory change |

**ALERTS/METRICS:** Alert fires if any required assessment type has no `audit.assessment.completed` event within the plan year (target: all seven types completed annually). Separate alert if `audit.cycle_timer` expires without a corresponding `audit.engagement.started`.

---

## AU-06 — Audit Reporting and Work Papers {#au-06-audit-reporting-and-work-papers}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires that audit results be reported to the Supervisory/Audit Committee. NCUA examination expectations require that audit reports be accurate, timely, and contain sufficient information for management to take corrective action. Regulatory audit manuals (CFPB, OCC, FDIC, Federal Reserve) inform report format and content standards.

**SYSTEM BEHAVIOR:** Each audit report documents: scope and objective, dates of coverage, findings and deficiencies, recommendations, root cause, management responses, responsible party, implementation date, and an overall risk rating plus a per-finding risk rating (High/Moderate/Low). Risk ratings follow the standard: **High** — potential materiality/regulatory/legal implications, critical control not functioning or non-existent, weakness undermines system integrity, or corporate policy violated; **Moderate** — isolated impact, mitigated by other controls, or cost-saving opportunity; **Low** — small/limited impact, enhancement opportunity only. Audit work papers document the procedures followed and provide sufficient evidence to support all conclusions; they include headings (credit union name, audit type, date, preparer, testing objective, sample method and description) and content (subject matter, source, procedures, findings summary, auditor conclusion). The final audit report is distributed to management, the Audit Committee, and external auditors/examiners per `audit.distribution_list`. Work papers and reports are write-restricted to Internal Audit; the distribution list is controlled by the Internal Auditor with Audit Committee approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Fieldwork complete (`audit.fieldwork.completed`) | Completed work papers, findings (`finding.description`, `finding.risk_rating`, `finding.root_cause`, `finding.responsible_party`, `finding.implementation_date`), management responses (`audit.management_responses`), overall rating (`audit.overall_rating`) | Draft report produced (`audit.report.drafted`); work papers finalized (`audit.record_written`) | Internal SLA: within 15 BD of fieldwork completion |
| Draft report reviewed with management (exit interview) | Draft report (`audit.report_id`), management response (`finding.management_response`), responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Management responses recorded (`audit.management_responses.received`); report updated | Before final report issuance |
| Final report issued (`audit.report.issued`) | Approved report (`audit.report_id`), distribution list (`audit.distribution_list`), overall rating (`audit.overall_rating`), per-finding ratings (`finding.risk_rating`) | Report distributed (`audit.report_distributed`); findings opened in tracker (`finding.opened`) | Promptly after Audit Committee approval |

**ALERTS/METRICS:** Alert fires if `audit.report.drafted` does not follow `audit.fieldwork.completed` within 15 BD (target: zero breaches). Dashboard tracks count of High-rated findings open beyond 30 days without a management response.

---

## AU-07 — Finding Tracking and Escalation {#au-07-finding-tracking-and-escalation}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports. NCUA examination expectations require timely follow-up on findings from internal audits, external audits, and regulatory examinations. Findings must be formally reported to the Audit Committee at least quarterly.

**SYSTEM BEHAVIOR:** All findings from internal audits, external audits, and regulatory examinations are entered into the findings tracker immediately upon identification and assigned to a supervisor-level or above owner (`finding.responsible_party`). Findings are reviewed at the Compliance Committee monthly. Any finding that remains open for more than 90 calendar days is automatically escalated to the Audit Committee and Board (`finding.aging_threshold.breached`). All open findings are formally reported to the Audit Committee at least quarterly (`finding.quarterly_report.delivered`). Ownership of findings must be assigned at supervisor level or above; the findings tracker is write-restricted to Internal Audit for creation and closure, and to department supervisors for status updates.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Finding identified from any source (`finding.opened`) | Finding description (`finding.description`), source (`deficiency.source`), severity (`finding.severity`), risk rating (`finding.risk_rating`), responsible party (`finding.responsible_party`), root cause (`finding.root_cause`) | Finding logged in tracker (`finding.opened`); owner notified (`finding.communicated`) | Immediately upon identification |
| Monthly Compliance Committee meeting (`finding.monthly_review.recorded`) | Open findings list (`finding.open_report`), remediation status (`finding.remediation_status`), aging report (`deficiency.aging_report`) | Monthly review recorded (`finding.monthly_review.recorded`) | Monthly (enforced by `finding.monthly_review_due`) |
| Finding ages past 90 days without closure (`finding.aging_threshold.breached`) | Finding record (`finding.description`, `finding.risk_rating`), aging detail (`deficiency.aging_report`), responsible party (`finding.responsible_party`) | Escalation to Audit Committee / Board (`finding.escalated`); escalation logged (`finding.critical.escalated`) | Immediately upon 90-day threshold breach (enforced by `finding.escalation_due_at`) |
| Quarter closes (`finding.quarterly_report.delivered`) | All open findings (`finding.open_report`), remediation statuses (`finding.remediation_status`), risk ratings (`finding.risk_rating`) | Quarterly findings report delivered to Audit Committee (`finding.quarterly_report.delivered`) | Quarterly (enforced by `finding.quarterly_report_due`) |

**ALERTS/METRICS:** Alert fires when any finding reaches 85 days open without closure (5-day warning before escalation threshold). Dashboard tracks: count of findings by risk rating, count escalated to Board, average days to closure by rating. Target: zero High-rated findings open beyond 90 days without Board-level escalation.

---

## AU-08 — Management Response and Risk Acceptance {#au-08-management-response-and-risk-acceptance}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports. NCUA examination expectations require that management responses be documented and that risk acceptance decisions be subject to appropriate governance, generally including Board-level approval.

**SYSTEM BEHAVIOR:** Management must respond to each audit finding no later than 30 calendar days from the final report date, either with a remediation action plan or a formal risk acceptance. A remediation action plan must include an implementation timeline, personnel responsible, and processes/procedures to be updated. If management elects to accept the risk, the acceptance must be fully documented (`finding.risk_acceptance_rationale`, `risk_acceptance.rationale`), provided to the Audit Committee, and generally requires Board-level approval before the finding can be closed (`risk_acceptance.decided`). Internal Audit advises on a validation timeline following implementation. Risk acceptance records are write-restricted to the Chief Compliance Officer and Audit Committee; management responses are write-restricted to the responsible department supervisor.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Final audit report issued (`audit.report.issued`) | Report ID (`audit.report_id`), findings list (`finding.description`, `finding.risk_rating`), responsible party (`finding.responsible_party`) | Response due date set; management notified (`finding.communicated`) | Response due within 30 days of final report date (enforced by `finding.response_due_at`) |
| Management submits remediation action plan (`finding.management_response.recorded`) | Action plan detail (`audit_detail.corrective_action`), implementation timeline (`finding.implementation_date`), personnel involved (`finding.responsible_party`) | Management response recorded (`finding.management_response.recorded`); remediation timer set (`audit.remediation_timer`) | Within 30 days of final report date |
| Management elects risk acceptance (`finding.risk_acceptance.proposed`) | Risk acceptance rationale (`finding.risk_acceptance_rationale`, `risk_acceptance.rationale`), owner (`risk_acceptance.owner_id`), governance documentation | Risk acceptance package provided to Audit Committee (`finding.risk_acceptance_package`); Board approval requested if required (`finding.risk_acceptance.decided`) | Within 30 days of final report date; Board approval before closure |
| Risk acceptance decided by Board/Audit Committee (`risk_acceptance.decided`) | Acceptance package (`finding.risk_acceptance_package`), Board resolution or Audit Committee minutes | Risk acceptance recorded (`risk_acceptance.decided`); finding closed if approved (`finding.closed`) | Per Board/Audit Committee meeting schedule |

**ALERTS/METRICS:** Alert fires if `finding.response_due_at` passes without `finding.management_response.recorded` or `finding.risk_acceptance.proposed` (target: zero overdue responses). Dashboard tracks count of open risk acceptances awaiting Board approval.

---

## AU-09 — Follow-Up Audits {#au-09-follow-up-audits}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports, which includes verifying that corrective actions have been appropriately implemented. NCUA examination expectations treat follow-up on prior findings as a core element of an effective audit program.

**SYSTEM BEHAVIOR:** Internal Audit reviews all identified findings prior to closure to confirm that management has appropriately remediated the control deficiency. Closure requires documented evidence of remediation (`finding.remediation_evidence`, `finding.closure_evidence`); Internal Audit verifies the evidence before approving closure (`finding.closure.verified`). A sufficiently poor prior audit rating drives enhanced audit review frequency for the affected area, as reflected in the annual risk assessment and schedule (see [AU-04](#au-04-risk-based-audit-scope-and-frequency)). Findings may not be closed by management unilaterally; closure is write-restricted to Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Management asserts remediation complete (`finding.remediation.reported`) | Remediation evidence (`finding.remediation_evidence`), implementation date (`finding.implementation_date`), responsible party (`finding.responsible_party`) | Internal Audit review initiated; retest result recorded (`deficiency.retest_result`) | Internal SLA: within 15 BD of remediation assertion |
| Internal Audit verifies remediation (`finding.closure.verified`) | Retest result (`deficiency.retest_result`), closure evidence (`finding.closure_evidence`), original finding (`finding.description`) | Finding closed (`finding.closed`); closure logged (`finding.closure.logged`) | Upon satisfactory verification |
| Internal Audit rejects closure (remediation insufficient) (`finding.closure.rejected`) | Deficiency in remediation (`deficiency.retest_result`), original finding (`finding.description`) | Finding remains open; responsible party notified (`finding.communicated`); new implementation date set (`finding.implementation_date`) | Immediately upon determination |
| Poor prior audit rating recorded (`audit.poor_rating.recorded`) | Prior overall rating (`audit.overall_rating`), affected area | Enhanced frequency flagged (`audit.frequency_increased`); annual plan updated at next cycle | At next schedule review (see AU-04) |

**ALERTS/METRICS:** Alert fires if a finding with `finding.remediation.reported` has no `finding.closure.verified` or `finding.closure.rejected` within 15 BD (target: zero unreviewed closure assertions). Dashboard tracks count of findings closed without Internal Audit verification (target: zero).

---

## AU-10 — Work Paper Retention and Physical Control {#au-10-work-paper-retention-and-physical-control}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) and NCUA examination expectations require that audit records be maintained for a period sufficient to support examination and legal needs. The seven-year retention period reflects standard credit union records retention practice and aligns with NCUA examination cycles.

**SYSTEM BEHAVIOR:** Work papers and audit reports are retained for seven years from the date of the audit report. Work papers are the property of Internal Audit and must be kept under Internal Audit's control in a secure location. During an active audit, the Internal Auditor must know the location of all work papers at all times. When not in use, audit files are stored in a secure location not readily accessible to unauthorized persons. Any request by persons outside Internal Audit to review work papers requires Audit Committee approval before access is granted (`audit.workpaper_access.decided`). The retention clock is set at the time the audit report is issued (`audit.report.issued`) and recorded in `audit.retention_expires_at`. Work paper access requests are write-restricted to the requestor; approval decisions are write-restricted to the Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit report issued (`audit.report.issued`) | Report date, report ID (`audit.report_id`), work paper set | Retention clock set (`audit.retention.applied`); retention expiry recorded (`audit.retention_expires_at`) | Immediately upon report issuance (enforced by `audit.retention_expires_at`) |
| Work paper access requested by party outside Internal Audit (`audit.workpaper_access.requested`) | Requestor identity, purpose, scope of requested access (`audit.access_request_detail`) | Access request logged (`audit.workpaper_access.requested`); Audit Committee notified | Immediately upon receipt |
| Audit Committee decides on access request (`audit.workpaper_access.decided`) | Access request detail (`audit.access_request_detail`), Audit Committee deliberation | Access granted or denied (`audit.workpaper_access.decided`); decision logged | At next Audit Committee meeting or sooner if urgent |
| Retention period expires (`audit.retention_expires_at`) | Retention record (`audit.retention_expires_at`), legal hold check (`audit.legal_hold_status`) | Records destroyed if no legal hold (`audit.records.destroyed`); destruction logged | At seven-year mark from report date; legal hold suspends destruction |

**ALERTS/METRICS:** Alert fires 90 days before `audit.retention_expires_at` to allow legal hold review before destruction. Alert fires if `audit.workpaper_access.requested` has no `audit.workpaper_access.decided` within 5 BD (target: zero unresolved access requests). Dashboard tracks count of work paper sets approaching retention expiry.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; initiates annual review; routes to Board for approval |
| **Audit Committee** | Approves audit program, frequencies, scope, and external engagements; receives all findings reports; approves work-paper access requests; holds CAE hiring/firing authority |
| **Board of Directors** | Establishes Audit Committee; reviews testing results; approves this policy annually; approves risk acceptances as required |
| **Internal Auditor / Chief Audit Executive** | Executes audit program; reports functionally to Audit Committee; maintains work papers; verifies finding closures |

**Review cadence:** This policy is reviewed and approved by the Board of Directors at least annually. Material changes to regulatory requirements (NCUA Part 715, Part 748) or the credit union's risk profile may trigger an off-cycle review.

**Cross-references:**
- BSA Policy (control BA-15) — BSA/AML independent testing
- Information Security Policy — IT audit execution and security control testing
- Internal Controls Policy — day-to-day internal control design and ownership
- Enterprise Risk Management Policy — enterprise risk taxonomy and risk assessment methodology

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced throughout this policy's control overlays — including `audit.independence_escalation_raised`, `audit.resource_assessment`, `audit.annual_results_summary`, `audit.distribution_list`, `audit.legal_hold_status`, `audit.record_written`, `audit.scope_change_identified`, `audit.scope_change_rationale`, `audit.scope_change_documented`, `audit.frequency_increased`, `audit.tentative_schedule`, `audit.schedule_finalized`, `audit.plan_year`, `auditor.access_grant`, `auditor.access_denied`, `auditor.access_denial_detail`, `auditor.independence_attestation`, and `finding.quarterly_summary` — are either composed per the Composition grammar from registered objects/actions or are provisional spellings. All are flagged for engineering confirmation before the next policy review. Registered codes from `core-vocabulary.json` (e.g., `audit.*`, `finding.*`, `risk_acceptance.*`, `policy.*`, `board.*`, `deficiency.*`) are used verbatim where they fit.

- **NCUA Part 715 applicability confirmed.** This policy assumes Pynthia Credit Union is a federally chartered or federally insured credit union subject to [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715). If the credit union is state-chartered and not federally insured, the applicable state supervisory committee audit requirements should be substituted and this assumption updated.

- **NCUA Part 748 scope.** The independent testing requirement under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) is addressed in AU-05 (audit types and network assessments) and AU-03 (independence). Detailed execution of IT security testing is delegated to the Information Security Policy; this policy governs scheduling, independence, and reporting only.

- **Regulatory audit manuals.** AU-05 references CFPB, OCC, FDIC, and Federal Reserve audit manuals as the basis for developing and updating audit work programs. Pynthia Credit Union is a credit union and is not directly supervised by the OCC, FDIC (for examination purposes), or Federal Reserve; these manuals are used as reference standards only. The primary regulatory authority is NCUA. This assumption should be confirmed with legal counsel.

- **"Promptly" for report issuance.** Patrick's notes and the reference policy both use "promptly" for Audit Committee review and approval of audit reports without specifying a calendar deadline. This policy sets an internal SLA of 10 BD from submission to approval and 15 BD from fieldwork completion to draft. These SLAs should be confirmed by the Audit Committee.

- **Board-level approval for risk acceptance.** The policy states risk acceptance "generally requires Board-level approval." The threshold for when Audit Committee approval alone suffices versus full Board approval is not defined in Patrick's notes. This policy defaults to requiring Board approval for all risk acceptances; the Audit Committee may establish a materiality threshold (e.g., by finding risk rating) below which Audit Committee approval alone is sufficient. This threshold should be documented in Audit Committee operating procedures.

- **Seven-year retention period.** The reference policy specifies seven years from the audit report date. This aligns with common credit union practice but should be confirmed against Pynthia's Records Retention Schedule and any applicable state law requirements.

- **Compliance Committee composition.** AU-07 references monthly finding review at the "Compliance Committee." The composition and charter of this committee are assumed to be defined in the Internal Controls Policy or a separate committee charter. If no such committee exists, the Audit Committee should assume this function.
