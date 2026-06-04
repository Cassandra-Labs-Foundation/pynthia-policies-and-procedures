---
title: Audit Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Audit, Internal Audit, Audit Committee, Supervisory Committee, Independence, Findings]
---

# Audit Policy

## General Policy Statement

Pynthia Credit Union performs regular, risk-focused reviews of its key controls, systems, and procedures to confirm that effective controls are implemented and that risk management practices are sound. Audit frequency and objectives are set by the results of an annual risk assessment; audits are conducted or reviewed by parties independent of those who develop or maintain the programs under review; and results are reported to the Audit Committee and the Board of Directors. This policy applies to all operational, compliance, financial, and IT functions of the credit union and to the work of internal and external auditors. Detailed audit operating procedures, information-security control testing, BSA/AML independent testing, day-to-day internal control design, and the enterprise risk taxonomy are governed by their own policies and procedures and are out of scope here.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Board review and approval of this policy | Annual policy cycle opens (`policy.review_due`) | At least annually | Approved policy with Board minutes | [AU-01](#au-01-board-of-directors-oversight) |
| Audit Committee meeting | Standing committee calendar (`audit.committee_meeting_scheduled`) | At least monthly | Agenda, minutes, report approvals | [AU-02](#au-02-audit-committee-governance-and-independence) |
| Annual audit plan submission | Annual planning cycle opens (`audit.plan_cycle_opened`) | Before the plan year begins; approved by Audit Committee | Annual scope, frequency schedule, risk assessment | [AU-04](#au-04-risk-based-audit-scope-and-frequency) |
| Minimum audit type execution | Plan year in progress (`audit.plan_year_started`) | Each defined audit/assessment type at least annually | Administrative, baseline compliance, social engineering, acceptable use audits; vulnerability, penetration, configuration assessments | [AU-05](#au-05-audit-types-and-network-assessments) |
| Audit report issuance and committee review | Audit fieldwork complete (`audit.fieldwork_completed`) | Promptly reviewed and approved at next Audit Committee meeting | Report with findings, ratings, root cause, responses | [AU-06](#au-06-audit-reporting-and-work-papers) |
| Management response or risk acceptance | Final audit report issued (`audit.report_finalized`) | 30 days from final report date | Remediation action plan or documented risk acceptance | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Compliance Committee finding review | Monthly Compliance Committee meeting (`finding.monthly_review_due`) | Monthly | Open-finding tracking report | [AU-07](#au-07-finding-tracking-and-escalation) |
| Aged-finding escalation | Finding open past three months (`finding.aging_threshold_breached`) | Escalate at the three-month mark | Escalation to Audit Committee / Board | [AU-07](#au-07-finding-tracking-and-escalation) |
| Quarterly formal finding report | Quarterly Audit Committee meeting (`finding.quarterly_report_due`) | At least quarterly | Formal report of all findings | [AU-07](#au-07-finding-tracking-and-escalation) |
| Finding closure verification | Remediation reported complete (`finding.remediation_reported`) | Before closure | Internal Audit closure verification | [AU-09](#au-09-follow-up-audits) |
| Work paper and report retention | Final audit report issued (`audit.report_finalized`) | Retain 7 years after report date | Work papers and audit reports | [AU-10](#au-10-work-paper-retention-and-physical-control) |

## AU-01 — Board of Directors Oversight {#au-01-board-of-directors-oversight}

- **WHY (Reg cite):** NCUA's Supervisory Committee audit rule, [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715), requires board-established, independent committee oversight of the annual audit of the credit union's books and records, including [§715.4](https://www.ecfr.gov/current/title-12/part-715/section-715.4) (audit responsibility of the Supervisory Committee). Board review of testing results also satisfies the governance expectations of [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) security program oversight.
- **SYSTEM BEHAVIOR:** The Board of Directors establishes the Audit Committee, reviews audit and testing results to confirm that sufficient resources are invested to implement and test approved controls, and reviews and approves this policy at least annually. Board minutes record each review and approval. Edits to this policy document are write-restricted to the Chief Compliance Officer; publication requires recorded Board approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual policy review cycle opens (`policy.review_due`) | Current policy text (`policy.document_version`), prior-year audit results summary (`audit.annual_results_summary`) | Board-approved policy and minutes entry (`policy.board_approved`) | At least annually (enforced by `policy.next_review_at`) |
  | Audit/testing results presented to Board (`audit.results_delivered_to_board`) | Audit reports and ratings (`audit.report_id`, `audit.overall_rating`), resourcing assessment (`audit.resource_assessment`) | Board minutes documenting review and any resourcing decision (`board.audit_review_recorded`) | Next regular Board meeting (internal: within 30 days of delivery) |

- **ALERTS/METRICS:** Alert to the CCO if `policy.next_review_at` is within 60 days with no scheduled Board agenda item; target zero years with policy approval lapsed past the anniversary date.

## AU-02 — Audit Committee Governance and Independence {#au-02-audit-committee-governance-and-independence}

- **WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) vests the Supervisory/Audit Committee with responsibility for obtaining the annual audit and overseeing the audit function independent of management ([§715.3](https://www.ecfr.gov/current/title-12/part-715/section-715.3), duties of the Supervisory Committee). Committee control of auditor engagement, budget, and the Chief Audit Executive relationship preserves the independence Part 715 presumes.
- **SYSTEM BEHAVIOR:** A designated Audit Committee oversees the audit function and meets at least monthly. The committee develops and manages the audit program; approves audit frequencies, schedules, objectives, and scope; engages external auditors and authorizes audit execution; promptly reviews and approves audit reports; delivers audit results to the Board; and oversees responses to audit reports. To preserve independence, the committee — not management — holds hiring and firing authority over the Chief Audit Executive and controls the audit budget. Committee records (minutes, approvals, engagement letters) are write-restricted to the committee secretary and the Internal Audit function.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly committee meeting convenes (`audit.committee_meeting_scheduled`) | Agenda, open audit reports (`audit.report_id[]`), open findings (`finding.id[]`), budget status (`audit.budget_status`) | Minutes with approvals and directions (`audit.committee_minutes_recorded`) | Monthly (internal: minutes finalized within 10 BD) |
  | External auditor engagement proposed (`audit.external_engagement_proposed`) | Proposed scope (`audit.engagement_scope`), independence confirmation (`auditor.independence_attestation`), cost (`audit.engagement_cost`) | Executed engagement authorization (`audit.external_engagement_approved`) | Before fieldwork begins (internal: decision at next monthly meeting) |
  | Audit report submitted for approval (`audit.report_submitted`) | Final report (`audit.report_id`), ratings (`audit.overall_rating`, `finding.risk_rating[]`) | Committee approval and Board delivery package (`audit.report_approved`) | Next committee meeting (internal: within 30 days of submission) |
  | CAE appointment, compensation, or removal action (`audit.cae_personnel_action`) | Committee deliberation record (`audit.committee_minutes_recorded`) | Committee decision documented and effected (`audit.cae_action_recorded`) | Internal: recorded in minutes of the deciding meeting |

- **ALERTS/METRICS:** Alert if no committee meeting occurs in a calendar month; track report-submission-to-approval latency (target: ≤ 30 days); target zero external engagements started without recorded committee authorization.

## AU-03 — Internal Auditor Independence and Reporting {#au-03-internal-auditor-independence-and-reporting}

- **WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) ([§748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0)) requires testing of security and compliance programs by parties independent of those who develop or maintain them, and [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) presumes an audit function answerable to the committee rather than to management.
- **SYSTEM BEHAVIOR:** The Internal Auditor reports functionally to the Audit Committee, not to management. The Internal Auditor conducts audits per the committee-approved scope and schedule, holds no operational responsibilities, and reports findings and recommendations to the committee on a timely basis. The Internal Auditor has unrestricted access to all records, personnel, and systems of the credit union for audit purposes; system access for audit personnel is provisioned read-only against production systems and is logged, and any denial of access to the Internal Auditor is itself reportable to the Audit Committee.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Audit begins per approved schedule (`audit.engagement_started`) | Approved scope and objectives (`audit.engagement_scope`), access credentials (`auditor.access_grant`) | Fieldwork record and evidence trail (`audit.fieldwork_logged`) | Per the committee-approved schedule (internal: start within the scheduled month) |
  | Findings identified during fieldwork (`finding.identified`) | Supporting evidence (`finding.evidence_refs[]`), affected department (`finding.department`) | Finding communicated to department supervisor and queued for report (`finding.communicated`) | Timely — before report issuance (internal: within 5 BD of identification) |
  | Access to records, personnel, or systems denied or delayed (`auditor.access_denied`) | Description of denial (`auditor.access_denial_detail`) | Escalation to Audit Committee (`audit.independence_escalation_raised`) | Internal: within 2 BD |

- **ALERTS/METRICS:** Target zero unresolved `auditor.access_denied` events; track finding-identification-to-communication latency (target: ≤ 5 BD); annual committee confirmation that the Internal Auditor held no operational duties.

## AU-04 — Risk-Based Audit Scope and Frequency {#au-04-risk-based-audit-scope-and-frequency}

- **WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) requires the frequency and objectives of testing to follow from risk assessment results, and [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) charges the committee with approving the audit's scope and engagement. Audit work programs follow the regulatory audit manuals published by the CFPB, OCC, FDIC, and Federal Reserve and are updated when regulatory guidance changes.
- **SYSTEM BEHAVIOR:** The auditors submit an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval before the plan year begins. Audits are tentatively scheduled monthly and then finalized, providing flexibility when an audit runs longer or shorter than expected and minimizing conflict with compliance and operational work. Frequency and scope are guidelines, not strict mandates: frequency is shortened where prior audit ratings or control strength were weak and may be lengthened where controls were strong with no material exceptions, weighing audit cost against the risk of material errors, irregularities, and losses. Mid-audit scope changes are permitted when test results cannot be accurately measured, when exceptions require further investigation, or when a policy change renders current audit techniques meaningless. All scope and frequency changes are documented in the audit work papers with a full explanation of circumstances and reasons. The annual plan and schedule are write-restricted to Internal Audit; only the Audit Committee can approve them.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual planning cycle opens (`audit.plan_cycle_opened`) | Enterprise risk assessment results (`risk.assessment_results`), prior audit ratings (`audit.prior_ratings[]`), regulatory audit manual updates (`audit.manual_updates`) | Annual scope, frequency schedule, and risk assessment submitted (`audit.annual_plan_submitted`) | Before the plan year begins (internal: 60 days prior) |
  | Committee reviews the annual plan (`audit.annual_plan_submitted`) | Submitted plan (`audit.annual_plan_id`), committee deliberation | Approved annual audit plan (`audit.annual_plan_approved`) | Before the plan year begins (internal: within 30 days of submission) |
  | Monthly schedule finalization (`audit.monthly_schedule_due`) | Tentative schedule (`audit.tentative_schedule`), engagement progress (`audit.engagement_status[]`) | Finalized monthly schedule (`audit.schedule_finalized`) | Monthly (internal: by the first BD of the month) |
  | Scope or frequency change identified (`audit.scope_change_identified`) | Circumstances and reasons (`audit.scope_change_rationale`) | Work-paper documentation of the change (`audit.scope_change_documented`) | Before or during the affected audit (internal: documented within 5 BD) |

- **ALERTS/METRICS:** Alert if the annual plan is not committee-approved before the plan year begins; track schedule variance (planned vs. actual audit start dates); target 100% of scope/frequency changes carrying documented rationale in work papers.

## AU-05 — Audit Types and Network Assessments {#au-05-audit-types-and-network-assessments}

- **WHY (Reg cite):** [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires regular testing of key controls, systems, and procedures, with tests conducted or reviewed by independent parties; the assessment battery below operationalizes that requirement across administrative, compliance, and technical domains.
- **SYSTEM BEHAVIOR:** A range of risk-focused audits is conducted at least annually: administrative audits (verify current processes conform to documented policies, via interview, observation, and documentation review), baseline compliance audits (verify processes and policies conform to regulations, standards, or other baselines), social engineering assessments (verify employees recognize and properly respond to social engineering attacks), and acceptable use assessments (verify awareness of and compliance with the Acceptable Use Policy and related agreements, using specialized scanning tools). In addition, technical assessments are performed or contracted on internal and external IT systems at least annually: vulnerability assessments (verify configurations and patching are operational and effective), penetration tests (probe systems and networks for vulnerabilities), and system configuration assessments (verify systems conform to an industry-accepted standard or baseline). Execution of IT control testing follows the Information Security Policy; this control governs only that each assessment type occurs at least annually and feeds the audit reporting pipeline. Contracting and authorization of third-party assessors is restricted to the Audit Committee.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Assessment scheduled per annual plan (`audit.assessment_scheduled`) | Assessment type and scope (`audit.assessment_type`, `audit.engagement_scope`), assessor independence confirmation (`auditor.independence_attestation`) | Completed assessment with results (`audit.assessment_completed`) | Each type at least annually (enforced by `audit.assessment_annual_due_at`) |
  | Technical assessment yields exploitable or critical exposure (`audit.critical_exposure_identified`) | Exposure detail (`finding.evidence_refs[]`), affected systems (`finding.affected_systems[]`) | Immediate finding escalated outside the normal report cycle (`finding.critical_escalated`) | Internal: within 1 BD |

- **ALERTS/METRICS:** Dashboard of days-until-due for each assessment type with alerts at 60 and 30 days before the annual deadline; target zero assessment types lapsing past 12 months; track critical-exposure escalation latency (target: ≤ 1 BD).

## AU-06 — Audit Reporting and Work Papers {#au-06-audit-reporting-and-work-papers}

- **WHY (Reg cite):** [12 CFR §715.8](https://www.ecfr.gov/current/title-12/part-715/section-715.8) (audit report and working paper access) requires audit results to be documented and working papers to support them; [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) expects test results to be reported to the board or a designated committee.
- **SYSTEM BEHAVIOR:** Each audit report documents the scope and objective, applicable dates of coverage, findings and deficiencies, recommendations for corrective action, root cause analysis, management responses, the responsible party, and the implementation date, with an overall risk rating and a per-finding risk rating of High, Moderate, or Low (High: management attention required — potential materiality, regulatory or legal implications, critical control not functioning, integrity-undermining weakness, or policy violation; Moderate: management attention desirable — isolated impact or mitigated by other controls; Low: improvement opportunities only). Risk ratings apply the credit union's approved risk-scoring methodology. Audit work papers document the procedures followed and contain sufficient evidence to support all conclusions across every area in scope. Reports are distributed to management of the audited function, the Compliance and Audit Committees, the Board, and external auditors and examiners as applicable. Report finalization is write-restricted to Internal Audit; management may append responses but cannot alter findings.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Audit fieldwork completes (`audit.fieldwork_completed`) | Work papers and evidence (`audit.workpaper_refs[]`), findings with ratings (`finding.id[]`, `finding.risk_rating[]`), root cause analysis (`finding.root_cause`) | Draft report for exit interview and management response (`audit.report_drafted`) | Internal: within 15 BD of fieldwork completion |
  | Management responses received (`audit.management_responses_received`) | Responses, responsible party, implementation date (`finding.management_response`, `finding.responsible_party`, `finding.implementation_date`) | Final report issued and distributed (`audit.report_finalized`) | Internal: within 10 BD of responses |
  | Final report distributed (`audit.report_finalized`) | Distribution list (`audit.distribution_list`) | Delivery to Audit Committee, Board, and management of record (`audit.report_distributed`) | Promptly — by the next Audit Committee meeting (internal: within 5 BD of finalization) |

- **ALERTS/METRICS:** Track fieldwork-to-final-report latency (target: ≤ 25 BD); target 100% of findings carrying a risk rating, root cause, responsible party, and implementation date; alert on any report finalized without complete work-paper references.

## AU-07 — Finding Tracking and Escalation {#au-07-finding-tracking-and-escalation}

- **WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) require audit results to be acted on and reported through committee and board governance; disciplined tracking is how deficiencies identified by testing actually get corrected rather than re-found at the next examination.
- **SYSTEM BEHAVIOR:** Findings from internal audits, external audits, and regulatory examinations are tracked, monitored, and followed up with department supervisors in a timely manner; ownership of corrective actions is assigned at supervisor level or above. Open findings are reviewed at the monthly Compliance Committee meeting; any finding open longer than three months is escalated to the Audit Committee and Board. All findings are formally reported to the Audit Committee at least quarterly, with specific findings discussed as needed. The finding tracker is write-restricted to Internal Audit; department owners may update remediation status but cannot close findings.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Finding enters the tracker from any source (`finding.opened`) | Source report (`audit.report_id` or `exam.report_id`), rating (`finding.risk_rating`), owner (`finding.responsible_party`), due date (`finding.implementation_date`) | Tracked finding record (`finding.tracked`) | On final report issuance (internal: within 5 BD) |
  | Monthly Compliance Committee review (`finding.monthly_review_due`) | Open-finding report (`finding.open_report`), aging data (`finding.age_days[]`) | Review minutes and follow-up directions (`finding.monthly_review_recorded`) | Monthly (internal: minutes within 10 BD) |
  | Finding open past three months (`finding.aging_threshold_breached`) | Finding detail and remediation status (`finding.remediation_status`) | Escalation to Audit Committee / Board (`finding.escalated`) | At the three-month mark (enforced by `finding.escalation_due_at`) |
  | Quarterly formal reporting (`finding.quarterly_report_due`) | All findings opened, closed, and open in the quarter (`finding.quarterly_summary`) | Formal report to Audit Committee (`finding.quarterly_report_delivered`) | At least quarterly (internal: at the quarterly committee meeting) |

- **ALERTS/METRICS:** Aging dashboard with alerts at 60 and 90 days open; track count of findings escalated past three months (target: trending to zero); track quarterly-report on-time delivery (target: 100%).

## AU-08 — Management Response and Risk Acceptance {#au-08-management-response-and-risk-acceptance}

- **WHY (Reg cite):** [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715) committee oversight and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) program-maintenance obligations require management to correct deficiencies identified by testing or to formally and visibly accept the residual risk through governance.
- **SYSTEM BEHAVIOR:** For every finding, management either responds with a remediation action plan or formally accepts the risk, no later than 30 days from the final report date. A remediation plan includes an implementation timeline, the personnel involved, and the processes or procedures to be written or updated; Internal Audit then advises a timeline for validation work. Risk acceptance must be fully documented in audit reporting and tracking, provided to the Audit Committee, and include all points management relies on; closing a risk-accepted item requires demonstration that governance protocols were followed, which in most cases means Board-level approval. Recording a risk acceptance closure is write-restricted to Internal Audit acting on the Audit Committee's instruction.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Final report issued (`audit.report_finalized`) | Findings and recommendations (`finding.id[]`), responsible parties (`finding.responsible_party`) | Management remediation plan or risk acceptance per finding (`finding.management_response_recorded`) | 30 days from final report date (enforced by `finding.response_due_at`) |
  | Risk acceptance elected (`finding.risk_acceptance_proposed`) | Full documentation of management's rationale (`finding.risk_acceptance_rationale`), committee package (`finding.risk_acceptance_package`) | Audit Committee receipt and Board approval decision (`finding.risk_acceptance_decided`) | Before closure (internal: next Board meeting) |

- **ALERTS/METRICS:** Alert at 20 days post-report for findings with no recorded response; target zero responses past the 30-day deadline; track count of open risk acceptances awaiting Board decision.

## AU-09 — Follow-Up Audits {#au-09-follow-up-audits}

- **WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) expects controls to be adjusted as testing reveals weaknesses; verification of remediation before closure — and tighter audit frequency after poor ratings — is how the testing loop closes, under the committee oversight of [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Internal Audit reviews every identified finding prior to closure to confirm management remediated it appropriately, requiring proof of corrective action — a department's assertion alone does not close a finding. During each audit, corrective actions taken on prior internal audit, examination, and external audit recommendations are followed up. Prior audit ratings drive the annual risk assessment: a sufficiently poor rating necessitates enhanced (more frequent) audit review until controls improve. Closure authority is restricted to Internal Audit.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Remediation reported complete (`finding.remediation_reported`) | Proof of corrective action (`finding.remediation_evidence`), original finding (`finding.id`) | Closure verification result — closed or returned (`finding.closure_verified` / `finding.closure_rejected`) | Internal: within 20 BD of report |
  | Poor overall audit rating recorded (`audit.poor_rating_recorded`) | Overall rating (`audit.overall_rating`), affected area (`audit.engagement_scope`) | Enhanced-frequency adjustment to the audit plan (`audit.frequency_increased`) | At the next annual plan cycle, or sooner by committee direction (internal: reflected in next monthly schedule) |

- **ALERTS/METRICS:** Track closure-verification turnaround (target: ≤ 20 BD); target zero findings closed without a `finding.closure_verified` record; track count of areas on enhanced frequency and their re-rating trend.

## AU-10 — Work Paper Retention and Physical Control {#au-10-work-paper-retention-and-physical-control}

- **WHY (Reg cite):** [12 CFR §715.8](https://www.ecfr.gov/current/title-12/part-715/section-715.8) addresses access to the audit report and working papers, and [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) governs preservation of credit union records; the seven-year retention period preserves audit evidence across the examination cycle.
- **SYSTEM BEHAVIOR:** Work papers and audit reports are retained for seven years after the audit report date. Work papers are the property of Internal Audit, kept under Internal Audit's control in a secure location not readily available to unauthorized persons; auditors must know exactly where work papers are during an audit. Requests by persons outside Internal Audit to review work papers require Audit Committee approval, except that NCUA examiners and engaged external auditors are granted access in the ordinary course as contemplated by Part 715. Repository write access is restricted to Internal Audit; all access is logged.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Final report issued (`audit.report_finalized`) | Complete work-paper set (`audit.workpaper_refs[]`), report (`audit.report_id`) | Records placed under retention with destruction date set (`audit.retention_applied`) | Retain 7 years after report date (enforced by `audit.retention_expires_at`) |
  | Outside-Internal-Audit access requested (`audit.workpaper_access_requested`) | Requester identity and purpose (`audit.access_request_detail`) | Audit Committee decision and logged access grant or denial (`audit.workpaper_access_decided`) | Internal: decision within 10 BD |
  | Retention period expires (`audit.retention_expires_at`) | Retention record (`audit.retention_applied`), legal-hold check (`audit.legal_hold_status`) | Authorized destruction or hold extension (`audit.records_destroyed` / `audit.retention_extended`) | After 7 years, absent a hold (internal: disposition within 90 days of expiry) |

- **ALERTS/METRICS:** Target zero work-paper accesses by non-Internal-Audit personnel without a logged committee approval; alert on any destruction attempted before the retention date or during a legal hold; periodic reconciliation that every finalized report has a retention record.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — maintains this policy, coordinates Audit Committee and Board review, and tracks control performance.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The Board of Directors reviews and approves this policy at least annually per [AU-01](#au-01-board-of-directors-oversight).
- **Required participants:** Audit Committee, Board of Directors, and Internal Audit, with the roles and authorities defined in [AU-01](#au-01-board-of-directors-oversight) through [AU-03](#au-03-internal-auditor-independence-and-reporting).
- **Review cadence:** Annually, or sooner upon material change to NCUA Part 715/748 requirements, the regulatory audit manuals, or the credit union's audit structure.
- **Cross-references:** Information Security Policy (IT control testing and execution); BSA Policy, control BA-15 (BSA/AML independent testing); Internal Controls Policy (control design and ownership); Enterprise Risk Management Policy (risk taxonomy and assessment methodology). Detailed audit operating procedures (work-paper preparation, sample sizing, exit interviews, audit work programs) are maintained as operating procedures outside this policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The audit-domain events, fields, and timers cited throughout the EVENTS tables (e.g., `audit.report_finalized`, `finding.opened`, `finding.escalation_due_at`, `audit.retention_expires_at`) are not registered in `vocabulary.json` — the parsed spec is banking-core only (entities, accounts, transfers, cards, BSA alerts) and defines zero events. All codes in this document use the target naming scheme and will be confirmed by engineering before the next review.
- **Governance, risk, and committee workflows are largely manual today.** This policy assumes a finding tracker, audit plan repository, and retention-managed work-paper repository exist or will be stood up; until then, the EVENTS tables describe the record-keeping discipline applied to whatever tooling (including document-based tracking) is in use.
- **Chief Audit Executive vs. Internal Auditor.** PATRICK_NOTES reference both a Chief Audit Executive (hiring/firing authority in AU-02) and an Internal Auditor (AU-03). This policy assumes the CAE leads the Internal Audit function (or the roles are one and the same); the organization chart should confirm.
- **Audit Committee serves as the NCUA Supervisory Committee.** This policy assumes the body referred to as the "Audit Committee" discharges the Supervisory Committee duties of 12 CFR Part 715 for a federally insured credit union. Charter documents should confirm the committee's formal designation.
- **Sole approver.** The CCO is currently the only listed approver in the front-matter; Board approval is evidenced through AU-01 minutes rather than the approver list. Confirm whether the Board Chair or Audit Committee Chair should be added as named approvers.
- **Risk-scoring methodology.** AU-06 requires ratings to follow the credit union's approved risk-scoring methodology, which lives in the Enterprise Risk Management Policy; this policy assumes that methodology defines High/Moderate/Low consistently with the rating standard described in AU-06.
- **Internal SLAs are proposed.** The reference materials fix the regulatory anchors (annual plan, monthly committee meetings, 30-day management response, 3-month escalation, quarterly reporting, 7-year retention); the parenthetical internal SLAs (e.g., 15 BD draft report, 20 BD closure verification, 10 BD access decisions) are proposed defaults pending Audit Committee confirmation.
- **Examiner and external auditor work-paper access.** AU-10 carves out examiner and engaged-external-auditor access from the committee-approval requirement based on Part 715 expectations; the reference policy was silent on this carve-out and the Audit Committee should confirm it.
