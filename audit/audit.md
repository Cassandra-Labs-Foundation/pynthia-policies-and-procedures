```yaml
---
title: Audit Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Audit, Internal Audit, Governance, Risk Management]
---
```

# Audit Policy

## General Policy Statement

Pynthia Credit Union is committed to maintaining a rigorous, independent, and risk-focused audit function that provides the Board of Directors and Audit Committee with objective assurance over the effectiveness of internal controls, risk management practices, and compliance with applicable laws and regulations. This policy establishes the governance structure, independence requirements, scope and frequency standards, reporting obligations, finding-tracking disciplines, and record-retention requirements for all internal and external audit activity across the credit union's operational, compliance, financial, and IT functions. Audits are conducted or reviewed by parties independent of those who develop or maintain the programs under review, and results are reported to the Audit Committee and Board of Directors in a timely and disciplined manner. Detailed audit operating procedures, BSA/AML independent testing, information security control testing, day-to-day internal control design, and enterprise risk taxonomy are governed by separate policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual audit plan submitted to Audit Committee | Auditor submits scope, frequency schedule, and risk assessment (`audit.annual_plan.submitted`) | Annually, before plan year begins | Scope, frequency, risk assessment | [AU-04](#au-04-risk-based-audit-scope-and-frequency) |
| Monthly Audit Committee meeting | Calendar month end (`audit.committee_meeting.scheduled`) | Monthly | Agenda, prior findings, open items | [AU-02](#au-02-audit-committee-governance-and-independence) |
| Audit report issued to management | Audit fieldwork complete (`audit.report.issued`) | Promptly after fieldwork | Scope, findings, ratings, recommendations, root cause | [AU-06](#au-06-audit-reporting-and-work-papers) |
| Management response due | Final audit report issued (`audit.management_responses.received`) | 30 days from final report date | Remediation action plan or formal risk acceptance | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Finding reviewed at Compliance Committee | Monthly Compliance Committee meeting (`finding.monthly_review.recorded`) | Monthly | All open findings | [AU-07](#au-07-finding-tracking-and-escalation) |
| Finding escalated to Audit Committee/Board | Finding age exceeds 90 days (`finding.aging_threshold.breached`) | ≤ 90 days from identification | Finding detail, aging, responsible party | [AU-07](#au-07-finding-tracking-and-escalation) |
| All findings formally reported to Audit Committee | Quarterly Audit Committee meeting (`finding.quarterly_report.delivered`) | Quarterly | All open and closed findings | [AU-07](#au-07-finding-tracking-and-escalation) |
| Risk acceptance documented and provided to Audit Committee | Management elects risk acceptance (`finding.risk_acceptance.decided`) | 30 days from final report date | Full risk acceptance package, Board approval where required | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Follow-up audit / finding closure verification | Finding remediation submitted (`audit.finding.closed`) | Prior to closure | Remediation evidence reviewed by Internal Audit | [AU-09](#au-09-follow-up-audits) |
| Annual audit types executed | Plan year opens (`audit.plan_cycle.opened`) | At least annually | All required audit types and network assessments | [AU-05](#au-05-audit-types-and-network-assessments) |
| Work-paper access request by outside party | Request received (`audit.workpaper_access.requested`) | Before access granted | Audit Committee approval required | [AU-10](#au-10-work-paper-retention-and-physical-control) |
| Work papers and audit reports retention clock set | Audit report issued (`audit.report.issued`) | 7 years from report date | All work papers and audit reports | [AU-10](#au-10-work-paper-retention-and-physical-control) |
| Policy reviewed and approved by Board | Annual review cycle (`policy.board.approved`) | At least annually | Full policy | [AU-01](#au-01-board-of-directors-oversight) |

---

## AU-01 — Board of Directors Oversight {#au-01-board-of-directors-oversight}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Supervisory/Audit Committee to be established by the board and to oversee the audit function independent of management; the Board's responsibility to ensure adequate resources for control testing is a foundational governance obligation under NCUA supervisory expectations. This policy must be reviewed and approved by the Board at least annually per the credit union's governance framework.

**SYSTEM BEHAVIOR:** The Board of Directors establishes the Audit Committee by formal resolution and reviews audit testing results at least annually to confirm that sufficient resources are invested to implement and test approved controls. The Board reviews and approves this policy at least annually; the Chief Compliance Officer initiates the review cycle and routes the draft to the Board for approval. Board approval is recorded in board minutes and the approved policy version is published. The Board also receives audit results delivered by the Audit Committee and, where required, approves risk acceptances that cannot be closed at the committee level. Board meeting records and policy approval actions are write-restricted to the Board Secretary and Compliance function.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual policy review cycle opens (`audit.plan_cycle.opened`) | Current policy version (`policy.document_version`), prior Board approval date (`policy.board_approved_at`), proposed redline (`policy.draft_redline`) | Board-approved policy version published (`policy.board.approved`); board minutes updated (`board.minutes.recorded`) | Annually (internal: 30 days before plan year start; enforced by `policy.board_approval_due_at`) |
| Board receives audit results from Audit Committee (`board.audit_review.recorded`) | Annual results summary (`audit.annual_results_summary`), resource assessment (`audit.resource_assessment`), Audit Committee delivery confirmation (`audit.results_delivered_to_board`) | Board review recorded in minutes (`board.audit_review.recorded`) | At least annually, coincident with annual plan approval |
| Board approves risk acceptance requiring Board-level closure (`finding.risk_acceptance.decided`) | Risk acceptance package (`finding.risk_acceptance_package`), risk acceptance rationale (`finding.risk_acceptance_rationale`), Audit Committee referral (`audit.findings_routed_to_board`) | Board resolution recorded (`board.minutes.recorded`); finding status updated (`finding.closed`) | As required; no later than next scheduled Board meeting after Audit Committee referral |

**ALERTS/METRICS:** Alert when `policy.board_approval_due_at` is within 30 days and no `policy.board.approved` event has been emitted for the current plan year. Alert when `audit.results_delivered_to_board` has not been recorded within 12 months. Target: zero policy review lapses per year.

---

## AU-02 — Audit Committee Governance and Independence {#au-02-audit-committee-governance-and-independence}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Supervisory/Audit Committee to oversee the audit function and obtain an annual audit of the credit union's books and records. The Audit Committee's authority over the Chief Audit Executive (CAE) hiring/firing and budget control is the structural mechanism that preserves functional independence from management.

**SYSTEM BEHAVIOR:** The Audit Committee meets at least monthly to fulfill its oversight responsibilities. It develops and manages the audit program; approves audit frequencies, schedules, objectives, and scope; engages external auditors; promptly reviews and approves audit reports; delivers results to the Board; and oversees responses to audit reports. The Audit Committee holds exclusive hiring and firing authority over the Chief Audit Executive and controls the audit budget. Audit Committee meeting minutes are recorded after each meeting and retained as governance records. Any independence concern raised by the Internal Auditor is escalated to the Audit Committee immediately. Audit Committee minutes and CAE personnel actions are write-restricted to the Audit Committee Chair and Board Secretary.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monthly Audit Committee meeting convened (`audit.committee_meeting.scheduled`) | Prior meeting minutes (`audit.committee_minutes`), open findings summary (`finding.open_report`), audit schedule status (`audit.tentative_schedule`) | Committee minutes recorded (`audit.committee_minutes.recorded`) | Monthly (internal: within 5 business days of meeting date) |
| Audit report submitted to Audit Committee for review (`audit.report.submitted`) | Final audit report (`audit.report_id`), overall rating (`audit.overall_rating`), management responses (`audit.management_responses`) | Audit report approved by Audit Committee (`audit.report.approved`) | Promptly; internal SLA: within 10 business days of report submission |
| External auditor engagement proposed (`audit.external_engagement.proposed`) | Engagement scope (`audit.engagement_scope`), engagement cost (`audit.engagement_cost`), independence confirmation | External engagement approved (`audit.external_engagement.approved`) | Before engagement commences |
| CAE personnel action initiated (hire or termination) | CAE personnel action detail (`audit.cae_personnel_action`), Audit Committee authorization | CAE action recorded (`audit.cae_action.recorded`) | Before action is effective |
| Independence concern escalated by Internal Auditor (`audit.gap.detected`) | Description of independence concern (`audit.independence_escalation_raised`), facts (`escalation.facts`) | Escalation created and routed to Audit Committee (`escalation.created`; `escalation.routed`) | Immediately upon identification |
| Audit results delivered to Board of Directors (`audit.results_delivered_to_board`) | Annual results summary (`audit.annual_results_summary`), Audit Committee approval confirmation (`audit.report.approved`) | Board delivery recorded (`board.audit_review.recorded`) | At least annually; coincident with Board policy review |

**ALERTS/METRICS:** Alert when no `audit.committee_minutes.recorded` event is emitted within 35 calendar days (monthly cadence + 5-day buffer). Alert when an `audit.report.submitted` event has no corresponding `audit.report.approved` within 10 business days. Target: zero months without a recorded Audit Committee meeting; zero audit reports pending Audit Committee approval beyond SLA.

---

## AU-03 — Internal Auditor Independence and Reporting {#au-03-internal-auditor-independence-and-reporting}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) require that audits and independent testing be conducted by staff independent of those who develop or maintain the programs under review. Functional reporting to the Audit Committee rather than management is the structural safeguard that preserves this independence.

**SYSTEM BEHAVIOR:** The Internal Auditor reports functionally to the Audit Committee, not to management, and has no operational responsibilities that would impair independence. The Internal Auditor conducts audits per the approved scope and schedule, has unrestricted access to all records, personnel, and systems necessary to perform audit work, and reports findings and recommendations on a timely basis. Any denial of access is immediately escalated to the Audit Committee. The Internal Auditor attests to independence at least annually. Independence attestation records and access-denial escalations are write-restricted to the Internal Auditor and Audit Committee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual independence attestation due (`audit.assessment_annual_due_at`) | Auditor identity (`auditor.independence_attestation`), confirmation of no operational responsibilities, confirmation of unrestricted access | Independence attestation recorded (`auditor.independence_attestation`) | Annually, at plan year start |
| Internal Auditor requests access to records, personnel, or systems (`audit.engagement.started`) | Engagement scope (`audit.engagement_scope`), access grant confirmation (`auditor.access_grant`) | Access grant logged (`auditor.access_grant`) | At commencement of each audit engagement |
| Access denied to Internal Auditor (`auditor.access.denied`) | Access denial detail (`auditor.access_denial_detail`), description of records or systems denied | Independence escalation raised (`audit.independence_escalation_raised`); escalation routed to Audit Committee (`escalation.routed`) | Immediately upon denial |
| Audit fieldwork completed (`audit.fieldwork.completed`) | Audit work papers (`audit.records`), findings (`finding.description`), recommendations (`audit.corrective_action`) | Audit report drafted (`audit.report.drafted`) | Promptly after fieldwork; internal SLA: within 10 business days |
| Audit report issued to management and Audit Committee (`audit.report.issued`) | Final report (`audit.report_id`), distribution list (`audit.distribution_list`), overall rating (`audit.overall_rating`) | Report distributed (`audit.report_distributed`); findings opened (`finding.opened`) | Promptly after Audit Committee approval |

**ALERTS/METRICS:** Alert when `auditor.independence_attestation` has not been recorded within the current plan year. Alert when `auditor.access.denied` is emitted and no `escalation.routed` follows within 1 business day. Target: zero unresolved access-denial escalations; 100% annual independence attestation completion.

---

## AU-04 — Risk-Based Audit Scope and Frequency {#au-04-risk-based-audit-scope-and-frequency}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to approve the audit program, including frequencies and scope. NCUA supervisory expectations and the regulatory audit manuals of the CFPB, OCC, FDIC, and Federal Reserve require that audit frequency and scope be risk-driven and updated when regulatory guidance changes.

**SYSTEM BEHAVIOR:** The Internal Auditor submits an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval before the plan year begins. Audits are tentatively scheduled monthly and then finalized, providing scheduling flexibility. Scope is reviewed before each audit commences; if material changes in the operational function are discovered, the auditor determines whether scope adjustment is warranted. Frequency is adjusted based on prior audit ratings and control strength: poor ratings drive increased frequency; strong ratings with no material exceptions may support reduced frequency. All scope and frequency changes are documented in audit work papers with a full explanation of the circumstances and reasons. At a minimum, all defined audit types are executed at least annually. Scope-change documentation is write-restricted to the Internal Auditor; frequency changes require Audit Committee awareness.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Plan year opens; annual plan submitted to Audit Committee (`audit.annual_plan.submitted`) | Annual plan document (`audit.annual_plan_id`), risk assessment (`audit.assessment_type`), tentative schedule (`audit.tentative_schedule`), plan year (`audit.plan_year`) | Annual plan approved by Audit Committee (`audit.annual_plan.approved`) | Before plan year begins (enforced by `audit.assessment_annual_due_at`) |
| Pre-audit scope review conducted before each engagement (`audit.engagement.started`) | Prior audit rating (`audit.overall_rating`), prior audit findings (`audit.poor_rating`), operational changes identified (`audit.scope_change.identified`) | Scope confirmed or scope change documented in work papers (`audit.scope_change_documented`; `audit.scope_change_rationale`) | Before fieldwork commences |
| Scope or frequency change identified during audit (`audit.scope_change.identified`) | Circumstances and reasons for change (`audit.scope_change_rationale`), updated schedule (`audit.schedule_finalized`) | Scope change documented in work papers (`audit.scope_change_documented`) | Immediately upon identification; documented before audit conclusion |
| Poor prior audit rating recorded (`audit.poor_rating.recorded`) | Prior overall rating (`audit.overall_rating`), control weakness description (`finding.description`) | Frequency increased for affected area (`audit.frequency_increased`); updated schedule submitted to Audit Committee | At next annual plan cycle or sooner if risk warrants |
| Monthly audit schedule finalized (`audit.committee_meeting.scheduled`) | Tentative schedule (`audit.tentative_schedule`), resource availability | Finalized schedule recorded (`audit.schedule_finalized`) | Monthly, at Audit Committee meeting |

**ALERTS/METRICS:** Alert when `audit.annual_plan.approved` has not been emitted before the plan year start date. Alert when an audit area with a prior poor rating (`audit.poor_rating.recorded`) has not had `audit.frequency_increased` recorded in the subsequent plan. Target: 100% of required annual audit types completed within each plan year; zero scope changes undocumented in work papers.

---

## AU-05 — Audit Types and Network Assessments {#au-05-audit-types-and-network-assessments}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires periodic independent testing of the credit union's security and compliance programs by staff independent of those who develop or maintain them. [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to approve the scope of audits, including the range of audit types. Regulatory audit manuals (CFPB, OCC, FDIC, Federal Reserve) are used to develop and update audit work programs when regulatory guidance changes.

**SYSTEM BEHAVIOR:** A range of risk-focused audits is conducted at least annually, covering: (1) **Administrative Audit** — verifies current processes conform to documented policies and supporting documents; (2) **Baseline Compliance Audit** — verifies processes and policies conform to regulations, standards, or other baselines; (3) **Social Engineering Assessment** — verifies employees can recognize and respond to social engineering attacks; (4) **Acceptable Use Assessment** — verifies employee awareness of and compliance with the Acceptable Use Policy and related agreements using specialized scanning tools. In addition, the following technical network assessments are performed at least annually on internal and external IT systems: (5) **Vulnerability Assessment** — identifies known vulnerabilities using specialized scanning tools; (6) **Penetration Test** — probes IT systems and networks for vulnerabilities; (7) **System Configuration Assessment** — verifies systems conform to an industry-accepted standard or baseline. Each assessment is risk-focused and informs the Board of Directors of the effectiveness of risk management practices. Follow-up on prior audit and examination findings is incorporated where possible. Audit work programs are updated when regulatory guidance changes. Scheduling and execution of all audit types is tracked against the approved annual plan. Note: IT audit execution details and information security control testing are governed by the Information Security Policy; this control establishes the minimum required types and annual frequency only.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Plan year opens; each required audit type scheduled (`audit.plan_cycle.opened`) | Approved annual plan (`audit.annual_plan_id`), list of required audit types (`audit.assessment_type`), prior findings for follow-up (`finding.open_report`) | Audit engagement scheduled (`audit.assessment.scheduled`) | At plan year start; all types must be scheduled within the plan year |
| Each audit engagement commenced (`audit.engagement.started`) | Engagement scope (`audit.engagement_scope`), audit work program (referencing regulatory manuals), prior audit findings for follow-up | Fieldwork logged (`audit.fieldwork.logged`) | Per approved schedule |
| Each audit engagement completed (`audit.engagement.completed`) | Completed work papers (`audit.records`), findings (`finding.description`), overall rating (`audit.overall_rating`) | Audit assessment completed (`audit.assessment.completed`); report drafted (`audit.report.drafted`) | Promptly after fieldwork; internal SLA: within 10 business days |
| Regulatory guidance change identified affecting audit work programs | Updated regulatory manual or guidance (`regulation.citation`) | Audit work program updated; scope change documented (`audit.scope_change_documented`) | Before next scheduled audit of affected area |

**ALERTS/METRICS:** Alert when any of the seven required audit types has not had `audit.assessment.completed` emitted by the end of the plan year. Alert when a penetration test or vulnerability assessment engagement has not been scheduled within the first quarter of the plan year. Target: 100% completion of all seven required audit types annually; zero plan-year lapses.

---

## AU-06 — Audit Reporting and Work Papers {#au-06-audit-reporting-and-work-papers}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to promptly review and approve audit reports and deliver results to the Board. Accurate and timely reporting is essential to the audit function's effectiveness; without it, the purpose of performing audits is defeated.

**SYSTEM BEHAVIOR:** Each audit report documents: scope and objective, applicable dates of coverage, findings and deficiencies, recommendations for corrective action, root cause analysis, management responses, responsible party, implementation date, and an overall risk rating plus individual per-finding risk ratings (High/Moderate/Low). Reports are written in plain language, report only facts, and are kept as concise as possible while fully communicating results. Audit work papers document the procedures followed, sources of information, findings, and conclusions, and contain sufficient evidence to support all conclusions reached. Work papers are prepared with standard headings (credit union name, audit type, audit date, preparer, testing objective, sample method and description). The final audit report is distributed to management, the Audit Committee, and external auditors and examiners as appropriate. Risk ratings follow the approved standard: High (potential materiality/regulatory/legal implications, critical control not functioning, corporate policy violated); Moderate (isolated impact, mitigated by other controls); Low (small/limited impact, enhancement opportunity). The audit report and work papers are write-restricted to the Internal Auditor during preparation; distribution is controlled by the Internal Auditor after Audit Committee approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit fieldwork completed; report drafted (`audit.report.drafted`) | Scope and objective, coverage dates, findings (`finding.description`), recommendations (`audit.corrective_action`), root cause (`finding.root_cause`), overall rating (`audit.overall_rating`), per-finding ratings (`finding.risk_rating`), responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Draft audit report created (`audit.report.drafted`) | Within 10 business days of fieldwork completion |
| Management responses obtained from department supervisor | Management response (`finding.management_response`), remediation plan or risk acceptance (`finding.corrective_action`), responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Management responses recorded (`audit.management_responses.received`) | Before report finalization |
| Final audit report issued (`audit.report.issued`) | Approved report (`audit.report_id`), distribution list (`audit.distribution_list`), Audit Committee approval (`audit.report.approved`) | Report distributed to management, Audit Committee, external auditors (`audit.report_distributed`); findings formally opened (`finding.opened`) | Promptly after Audit Committee approval |
| Work papers completed and filed | Work paper headings, procedures, evidence, findings, conclusions (`audit.records`), audit date, preparer identity | Work papers recorded and secured (`audit.fieldwork.logged`) | Concurrent with fieldwork; finalized before report issuance |

**ALERTS/METRICS:** Alert when `audit.report.drafted` has not been emitted within 10 business days of `audit.engagement.completed`. Alert when `audit.report.issued` has no corresponding `finding.opened` for each finding documented in the report. Target: zero audit reports issued without all required content fields populated; zero findings without a risk rating.

---

## AU-07 — Finding Tracking and Escalation {#au-07-finding-tracking-and-escalation}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports. Timely tracking, escalation, and reporting of findings is the operational mechanism that ensures the audit function drives actual control improvement rather than producing reports that are filed and forgotten.

**SYSTEM BEHAVIOR:** All findings from internal audits, external audits, and regulatory examinations are tracked in the finding-tracking system from identification through closure. Each finding is assigned to a responsible party at supervisor level or above. Findings are reviewed at the Compliance Committee meeting monthly. Any finding that remains open for more than 90 days is automatically escalated to the Audit Committee and Board. All findings are formally reported to the Audit Committee at least quarterly. Tracking reports are reviewed by the Board monthly. The finding-tracking system is write-restricted to the Internal Auditor and Compliance function; escalation routing is system-enforced based on aging thresholds.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Finding identified and opened from audit report or examination (`finding.opened`) | Finding description (`finding.description`), risk rating (`finding.risk_rating`), severity (`finding.severity`), responsible party (`finding.responsible_party`), department (`finding.department`), source (internal audit, external audit, or exam) (`finding.tracked`) | Finding record created and tracked (`finding.opened`) | At report issuance or examination close |
| Monthly Compliance Committee meeting (`finding.monthly_review.recorded`) | All open findings (`finding.open_report`), remediation status (`finding.remediation_status`), aging (`finding.aging_threshold`) | Monthly review recorded (`finding.monthly_review.recorded`) | Monthly (enforced by `finding.monthly.review.due`) |
| Finding age exceeds 90 days without closure (`finding.aging_threshold.breached`) | Finding detail (`finding.description`), responsible party (`finding.responsible_party`), aging data (`finding.aging_threshold`), escalation facts (`escalation.facts`) | Finding escalated to Audit Committee and Board (`finding.escalated`); escalation routed (`escalation.routed`) | Upon breach of 90-day threshold (enforced by `finding.escalation_due_at`) |
| Quarterly Audit Committee meeting (`finding.quarterly_report.delivered`) | All open and closed findings (`finding.open_report`), remediation status (`finding.remediation_status`), escalation history | Quarterly findings report delivered to Audit Committee (`finding.quarterly_report.delivered`) | Quarterly (enforced by `finding.quarterly.report.due`) |
| Board monthly tracking report review | All open findings summary (`finding.open_report`), escalated findings (`finding.critical`), aging summary | Board review recorded (`board.audit_review.recorded`) | Monthly |

**ALERTS/METRICS:** Alert when any finding reaches 80 days open without closure (pre-escalation warning). Alert when `finding.quarterly_report.delivered` has not been emitted within the quarter. Target: zero findings exceeding 90 days without escalation; zero quarters without a formal Audit Committee findings report.

---

## AU-08 — Management Response and Risk Acceptance {#au-08-management-response-and-risk-acceptance}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports. The 30-day management response requirement and the Board-level approval gate for risk acceptance are the governance controls that prevent findings from being informally deferred without accountability.

**SYSTEM BEHAVIOR:** Management must respond to each audit finding no later than 30 days from the final report date, either with a remediation action plan or a formal risk acceptance. A remediation action plan must include an implementation timeline, personnel responsible, and processes or procedures to be updated. A formal risk acceptance must be fully documented, provided to the Audit Committee, and generally requires Board-level approval before the finding can be closed. Risk acceptances that do not receive Board approval remain open in the tracking system. Internal Audit advises on a timeline for validation follow-up after remediation implementation. Management response records are write-restricted to the responsible department supervisor and Compliance; risk acceptance packages require Audit Committee and Board sign-off to close.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Final audit report issued; management response clock starts (`audit.report.issued`) | Report date, finding list (`finding.description`), responsible party (`finding.responsible_party`) | Response due date set (`finding.response.due_at`) | Clock starts at report issuance (enforced by `finding.response_due_at`) |
| Management submits remediation action plan (`finding.corrective_action.logged`) | Remediation plan (`finding.corrective_action`), implementation timeline (`finding.implementation_date`), personnel involved (`finding.responsible_party`), process/procedure changes | Corrective action logged (`finding.corrective_action.logged`); finding moved to in-remediation status | Within 30 days of final report date (enforced by `finding.response.due_at`) |
| Management elects formal risk acceptance (`finding.risk_acceptance.proposed`) | Risk acceptance rationale (`finding.risk_acceptance_rationale`), risk acceptance package (`finding.risk_acceptance_package`), documentation of governance protocols followed | Risk acceptance proposed and routed to Audit Committee (`finding.risk_acceptance.proposed`) | Within 30 days of final report date (enforced by `finding.response.due_at`) |
| Audit Committee and Board review risk acceptance (`finding.risk_acceptance.decided`) | Risk acceptance package (`finding.risk_acceptance_package`), Board approval where required (`audit.findings_routed_to_board`) | Risk acceptance decided (`finding.risk_acceptance.decided`); finding closed if approved (`finding.closed`) or remains open if not approved | At next Audit Committee meeting after submission; Board approval at next Board meeting if required |

**ALERTS/METRICS:** Alert when `finding.response.due_at` is reached and no `finding.corrective_action.logged` or `finding.risk_acceptance.proposed` event has been emitted. Alert when a risk acceptance package has been submitted but no `finding.risk_acceptance.decided` event is recorded within 30 days. Target: 100% of findings with management response within 30 days; zero risk acceptances closed without documented Audit Committee review.

---

## AU-09 — Follow-Up Audits {#au-09-follow-up-audits}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee responses to audit reports, which includes verifying that corrective actions have been appropriately implemented. Follow-up audit activity is the assurance mechanism that confirms remediation is real and not merely documented.

**SYSTEM BEHAVIOR:** Internal Audit reviews all identified findings prior to closure to confirm that management has appropriately remediated the control deficiency. Closure is not permitted based solely on management's assertion; Internal Audit must independently verify remediation evidence before a finding is marked closed. Poor prior audit ratings are a driver for the annual risk assessment and result in enhanced audit review frequency for the affected area in subsequent plan cycles. Follow-up review results are documented in work papers. Finding closure decisions are write-restricted to the Internal Auditor.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Management submits remediation evidence for finding closure (`finding.remediation.reported`) | Remediation evidence (`finding.remediation_evidence`), corrective action taken (`finding.corrective_action`), implementation date (`finding.implementation_date`), responsible party (`finding.responsible_party`) | Internal Audit follow-up review initiated (`audit.engagement.started` with follow-up scope) | Upon receipt of remediation submission |
| Internal Audit verifies remediation (`audit.finding.closed`) | Remediation evidence reviewed (`finding.closure_evidence`), Internal Audit conclusion, work paper documentation (`audit.records`) | Finding closure verified and logged (`finding.closure.verified`); finding closed (`finding.closed`) | Before finding is marked closed in tracking system |
| Finding closure rejected by Internal Audit (remediation insufficient) (`finding.closure.rejected`) | Basis for rejection (`finding.description`), additional remediation required (`finding.corrective_action`) | Finding remains open; responsible party notified (`finding.communicated`); new implementation date set (`finding.implementation_date`) | Immediately upon determination |
| Poor prior audit rating recorded; enhanced frequency triggered (`audit.poor_rating.recorded`) | Prior overall rating (`audit.overall_rating`), affected audit area (`audit.assessment_type`) | Frequency increased for affected area (`audit.frequency_increased`); updated plan submitted to Audit Committee | At next annual plan cycle |

**ALERTS/METRICS:** Alert when a finding in `in_remediation` status has had no `finding.closure.verified` or `finding.closure.rejected` event within 30 days of remediation submission. Alert when `audit.poor_rating.recorded` has not resulted in `audit.frequency_increased` in the subsequent plan. Target: zero findings closed without Internal Audit verification; 100% of poor-rated areas with documented frequency adjustment.

---

## AU-10 — Work Paper Retention and Physical Control {#au-10-work-paper-retention-and-physical-control}

**WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) requires the Audit Committee to oversee the audit function, which includes ensuring audit records are maintained with integrity. A seven-year retention period reflects standard regulatory examination expectations for credit union audit records and supports the credit union's ability to respond to examiner requests.

**SYSTEM BEHAVIOR:** Work papers and audit reports are retained for seven years after the date of the audit report. Work papers are the property of Internal Audit and must be kept under Internal Audit's control at all times during and after the audit. When not in use, audit files are stored in a secure location not readily accessible to unauthorized persons. Any request by a person outside Internal Audit to review work papers requires Audit Committee approval before access is granted; the access request and approval are logged. The retention clock is set at audit report issuance. Legal-hold suspension, destruction scheduling, and permanent-record mechanics are governed by SC-02 (embedded below). Work paper access approvals are write-restricted to the Audit Committee Chair.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Audit report issued; retention clock set (`audit.report.issued`) | Audit report date (`audit.report_id`), work paper set reference (`audit.records`), retention schedule (7 years) | Retention clock set on audit records (`audit.retention.applied`); retention expiry recorded (`audit.retention.expires_at`) | At report issuance (enforced by `audit.retention_expires_at`) |
| Outside party requests access to work papers (`audit.workpaper_access.requested`) | Requester identity, purpose of request, work papers requested (`audit.workpaper_access`), access request detail (`audit.access_request_detail`) | Access request logged (`audit.workpaper_access.requested`); Audit Committee notified | Immediately upon receipt of request |
| Audit Committee decides on work-paper access request (`audit.workpaper_access.decided`) | Audit Committee approval or denial, access request detail (`audit.access_request_detail`) | Access decision recorded (`audit.workpaper_access.decided`); access granted or denied (`auditor.access_grant` or `auditor.access.denied`) | Before access is provided |

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** Records-retention obligations arise from multiple sources depending on record class; the mechanics below apply universally once a class-specific retention period is set. NCUA examination authority and general federal credit union operating requirements ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)) establish baseline records-preservation duties. Legal-hold obligations arise under litigation-preservation common law and applicable federal rules of civil procedure. Destruction must be affirmatively authorized to prevent premature disposal and to create an auditable chain of custody.

**SYSTEM BEHAVIOR:** Once a retention anchor date and schedule are set on a record (by the consuming policy's class-specific control), the lifecycle proceeds automatically: the system monitors elapsed time, suspends the destruction clock if a legal hold is placed, resumes the clock when the hold is lifted, flags the record as disposal-eligible when the retention period expires, requires affirmative destruction authorization before any record is destroyed, and logs a destruction certificate. Records designated as permanent are never flagged for disposal. Access to retention-schedule configuration is write-restricted to the Records Manager and Compliance; legal-hold placement and release require Legal or Compliance authorization; destruction authorization requires the Records Manager plus a second approver.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention clock set on a record by a class-specific control (`record.retention_clock_set`) | Record identifier (`record.id`), record class (`record.retention_class`), anchor date (`record.retention_anchor`), retention schedule (`record.retention_class`), legal-hold flag (`record.legal_hold_flag`) | Retention timer started (`record.retention.started`); expiry date computed and stored (`record.retention.expires_at`; enforced by `record.retention_expires_at`) | At record creation or class assignment |
| Legal hold placed on a record (`record.hold.placed`) | Matter identifier (`record.hold_matter_id`), hold scope (`record.hold_scope`), authorizer (`record.hold_authorizer`) | Hold applied; destruction clock suspended (`record.hold.applied`); hold registry updated (`record.hold_registry`) | Immediately upon legal-hold order |
| Legal hold lifted (`record.hold.released`) | Hold release authorization (`record.hold_release_auth`), matter closure confirmation | Hold released; destruction clock resumed from suspension point (`record.hold.lifted`); updated expiry recomputed (`record.retention.expires_at`) | Upon matter resolution and Legal/Compliance sign-off |
| Retention period expires and no legal hold is active (`record.retention.expired`) | Expiry confirmation, legal-hold flag check (`record.legal_hold_flag`), permanent-record flag check | Record flagged as disposal-eligible (`record.disposal_eligible = true`); disposal task created (`record.disposal.due_at`; enforced by `record.disposal_due_at`) | At expiry date; permanent records are excluded and never reach this state |
| Destruction authorized and executed (`record.destroyed`) | Destruction authorization (Records Manager + second approver), disposal method (`record.disposal_method`), batch manifest | Destruction certificate logged (`record.destruction.certified`); destruction log entry created (`destruction_log.entry.created`) | After affirmative dual authorization; never before retention expiry and hold clearance |
| Retention period extended before expiry (`record.retention.extended`) | Extension justification (`record.extension_requested_at`), authorizer, new expiry date | Extension recorded; updated expiry stored (`record.retention.expires_at`) | Before original expiry date |

**ALERTS/METRICS:** Alert when `record.disposal_eligible = true` and no destruction authorization has been initiated within 90 days (records accumulating past expiry). Alert when a legal hold has been active for more than 365 days without a hold-status review. Alert on any `destruction_log.mismatch.detected` event. Target: zero records destroyed before retention expiry; zero destruction events without a logged certificate; 100% of disposal-eligible records dispositioned within policy.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; initiates annual review; routes to Board for approval; oversees audit function governance |
| **Audit Committee** | Approves policy; oversees audit program, findings, and CAE; approves risk acceptances |
| **Board of Directors** | Final approval of policy; receives annual audit results; approves risk acceptances requiring Board-level closure |
| **Internal Auditor / Chief Audit Executive** | Executes audit program; reports functionally to Audit Committee; maintains work papers and independence |

**Review cadence:** This policy is reviewed and approved by the Board of Directors at least annually. The Chief Compliance Officer initiates the review no later than 30 days before the plan year start date.

**Cross-references:**
- Information Security Policy (IT audit execution, security control testing)
- BSA Policy, Control BA-15 (BSA/AML independent testing)
- Internal Controls Policy (day-to-day internal control design and ownership)
- Enterprise Risk Management Policy (enterprise risk taxonomy and risk assessment methodology)
- Records Retention Schedule (record classes and retention periods)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The audit-domain fields and events referenced throughout this document (e.g., `audit.*`, `auditor.*`, `finding.*`) are registered in `core-vocabulary.json` and used per the registered spelling. All codes have been matched to registered objects, actions, and task types. No new objects or actions were coined. The following fields used in EVENTS tables are composed per grammar from registered objects and registered properties but should be confirmed as registered fields before implementation: `audit.independence_escalation_raised`, `audit.resource_assessment`, `audit.annual_results_summary`, `audit.results_delivered_to_board`, `audit.findings_routed_to_board`, `audit.frequency_increased`, `audit.tentative_schedule`, `audit.schedule_finalized`, `audit.scope_change_documented`, `audit.scope_change_rationale`, `audit.scope_change.identified`, `audit.poor_rating`, `audit.workpaper_access`, `audit.access_request_detail`, `auditor.independence_attestation`, `auditor.access_grant`, `auditor.access_denial_detail`, `auditor.access.denied`. These follow the `object.property` composition grammar and are flagged as provisional pending engineering confirmation.

- **NCUA Part 715 applicability confirmed.** This policy assumes Pynthia Credit Union is a federally chartered or federally insured credit union subject to [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) (Supervisory Committee Audits and Verifications). If the credit union's charter type or insurance status differs, the applicable audit oversight requirements should be confirmed with NCUA counsel.

- **NCUA Part 748 scope.** The independent testing requirement under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) is addressed in AU-05 (audit types and network assessments) at the frequency and independence level. Detailed IT security control testing execution is delegated to the Information Security Policy per Patrick's out-of-scope note. This assumption should be confirmed to ensure no gap exists between the two policies.

- **Regulatory audit manual update trigger.** AU-05 states that audit work programs are updated when regulatory guidance changes (CFPB, OCC, FDIC, Federal Reserve manuals). The mechanism for monitoring regulatory guidance changes is assumed to be covered by the Enterprise Risk Management Policy's regulatory change process. If no such process exists, a monitoring control should be added here or to the Compliance Policy.

- **Board-level risk acceptance threshold.** Patrick's notes state that risk acceptance "generally requires Board-level approval to close." The word "generally" implies exceptions may exist (e.g., Low-rated findings accepted at Audit Committee level). The specific threshold (e.g., all risk acceptances, or only High/Moderate-rated ones) should be confirmed and documented in the policy or a supporting procedure. This policy conservatively routes all risk acceptances to the Audit Committee and flags Board approval as the default requirement.

- **Compliance Committee composition and authority.** AU-07 references the Compliance Committee as the monthly finding-review body. This policy assumes the Compliance Committee is a standing management committee with appropriate authority to review findings and escalate. Its charter and composition are assumed to be defined elsewhere (e.g., Internal Controls Policy or a committee charter). If no such committee exists, the finding-review function should be assigned to a defined management body.

- **Seven-year retention period source.** The 7-year retention period for work papers and audit reports is drawn from the Reference Policy and Patrick's notes. This period should be confirmed against the credit union's Records Retention Schedule and any applicable NCUA examination guidance. If the Records Retention Schedule specifies a different period for audit records, the Schedule governs and this policy should be updated to reference it.

- **SC-02 shared control.** The `SC-02 — Record-Retention Lifecycle Mechanics` block embedded in this policy is a shared control consumed verbatim across multiple policies. The legal-hold, destruction, and permanent-record mechanics in SC-02 are not duplicated in AU-10. Engineering should confirm that the `record.*` events and fields referenced in SC-02 are registered and that the retention lifecycle state machine is implemented consistently across all consuming policies.
```
