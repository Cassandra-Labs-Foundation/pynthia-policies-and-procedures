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

## General Policy Statement

Pynthia Credit Union maintains an independent, risk-focused audit function that regularly reviews the credit union's key controls, systems, and procedures across operational, compliance, financial, and IT functions. The function reports functionally to the Audit Committee — not management — holds unrestricted access to records, personnel, and systems, and operates on a board-approved, risk-based schedule. Findings are documented, rated, tracked, escalated, and closed through disciplined governance, with results reported to the Audit Committee and Board. This policy applies to all internal and external audit work and is reviewed and approved by the Board at least annually.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Board reviews and approves this policy | Annual board review cycle opens (`policy.board_review_started`) | At least annually | Board oversight & policy approval | [AU-01](#au-01-board-of-directors-oversight) |
| Audit Committee meets to oversee the function | Monthly committee meeting scheduled (`audit.committee_meeting_scheduled`) | Monthly | Committee governance & independence | [AU-02](#au-02-audit-committee-governance-and-independence) |
| Annual audit plan/scope/risk assessment submitted | Plan cycle opens (`audit.plan_cycle_opened`) | Annually | Risk-based scope & frequency | [AU-04](#au-04-risk-based-audit-scope-and-frequency) |
| Defined audit types executed | Annual schedule due (`audit.assessment_scheduled`) | At least annually | Audit types & network assessments | [AU-05](#au-05-audit-types-and-network-assessments) |
| Audit report finalized and issued | Fieldwork completed (`audit.fieldwork_completed`) | Per schedule | Audit reporting & work papers | [AU-06](#au-06-audit-reporting-and-work-papers) |
| Findings reviewed monthly at Compliance Committee | Monthly finding review (`finding.monthly_review_recorded`) | Monthly | Finding tracking & escalation | [AU-07](#au-07-finding-tracking-and-escalation) |
| Findings older than 3 months escalated | Aging threshold breached (`finding.aging_threshold_breached`) | At 3 months | Finding tracking & escalation | [AU-07](#au-07-finding-tracking-and-escalation) |
| All findings reported to Audit Committee | Quarterly cycle reached (`finding.quarterly_report_delivered`) | Quarterly | Finding tracking & escalation | [AU-07](#au-07-finding-tracking-and-escalation) |
| Management responds or accepts risk | Report finalized (`audit.report_issued`) | ≤ 30 days from final report date | Management response & risk acceptance | [AU-08](#au-08-management-response-and-risk-acceptance) |
| Internal Audit verifies remediation before closure | Closure requested (`finding.closure_logged`) | Before closure | Follow-up audits | [AU-09](#au-09-follow-up-audits) |
| Work papers/reports retained and disposed | Retention clock set (`audit.retention_applied`) | 7 years from report date | Work paper retention & control | [AU-10](#au-10-work-paper-retention-and-physical-control) |

## AU-01 — Board of Directors Oversight {#au-01-board-of-directors-oversight}

- **WHY (Reg cite):** The Supervisory/Audit Committee derives its mandate from the board, which must ensure an annual audit of books and records and adequate resourcing of the control program ([12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715)); independence and periodic testing obligations flow from [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** The Board establishes the Audit Committee, reviews testing results to confirm sufficient resources are invested to implement and test approved controls, and reviews and approves this policy at least annually. The system opens an annual board review cycle, records the resourcing assessment as a board-pack input, and captures the board's approval resolution. If the annual review lapses, an aging alert fires. Board approval records and resourcing assessments are write-restricted to the Board Secretary and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual board review cycle opens (`policy.board_review_started`) | Current policy version (`policy.document_version`), resourcing/resource assessment (`audit.resource_assessment`), prior-year testing results summary (`audit.annual_results_summary`) | Board review record + emitted (`policy.board_review_started`) | At least annually (internal: open 30 BD before due; enforced by `policy.board_approval_due_at`) |
  | Board approves the policy and confirms resourcing (`policy.board_approved`) | Board resolution (`board.resolution_id`), meeting record (`board.meeting_held`), resource sufficiency determination (`audit.resource_assessment`) | Approved policy version + board minutes (`board.audit_review_recorded`) | At least annually (enforced by `policy.board_approval_due_at`) |

- **ALERTS/METRICS:** Alert when `policy.review_lapsed` is true or the board approval timer ages past due; target zero overdue annual approvals and a board-pack resourcing assessment present for every cycle.

## AU-02 — Audit Committee Governance and Independence {#au-02-audit-committee-governance-and-independence}

- **WHY (Reg cite):** The Audit Committee must independently oversee the audit function and obtain the required annual audit under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715); its independence from management is reinforced by the independent-testing requirement of [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** A designated Audit Committee oversees the audit function and meets at least monthly. It develops and manages the audit program, approves audit frequencies, schedules, objectives, and scope, engages external auditors, promptly reviews and approves audit reports, delivers results to the Board, and oversees responses. To preserve independence, the committee holds hiring/firing authority over the Chief Audit Executive and controls the audit budget; any personnel action affecting the CAE is recorded against the committee, not management. The system schedules monthly meetings, records minutes, and routes external-engagement proposals for committee approval. Audit Committee personnel-action and budget-control records are write-restricted to the Audit Committee Chair.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Monthly committee meeting scheduled (`audit.committee_meeting_scheduled`) | Committee roster, agenda, prior open items | Meeting record + emitted (`audit.committee_meeting_scheduled`) | Monthly (internal: same calendar month) |
  | Committee meeting held and minutes recorded (`audit.committee_minutes_recorded`) | Meeting decisions, approvals, oversight notes | Committee minutes (`audit.committee_minutes_recorded`) | Monthly |
  | External auditor engagement proposed (`audit.external_engagement_proposed`) | Engagement scope (`audit.engagement_scope`), engagement cost (`audit.engagement_cost`), provider identity (`engagement.provider`) | Committee-approved engagement (`audit.external_engagement_approved`) | Per plan cycle (internal: before fieldwork start) |
  | CAE hiring/firing or budget action taken (`audit.cae_action_recorded`) | Personnel/budget action (`audit.cae_personnel_action`), budget status (`audit.budget_status`) | CAE action record (`audit.cae_action_recorded`) | At time of action |

- **ALERTS/METRICS:** Alert on any month without recorded committee minutes and on any CAE personnel/budget action routed outside the committee; target 12 of 12 monthly meetings held and 100% of external engagements committee-approved before fieldwork.

## AU-03 — Internal Auditor Independence and Reporting {#au-03-internal-auditor-independence-and-reporting}

- **WHY (Reg cite):** Audits must be conducted or reviewed by staff independent of those who develop or maintain the programs under review ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)); the function's books-and-records mandate sits under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** The Internal Auditor reports functionally to the Audit Committee rather than to management, conducts audits per the approved scope and schedule, holds no operational responsibilities, and has unrestricted access to records, personnel, and systems. Each engagement captures an independence attestation; if access is denied, an independence-escalation is raised to the Audit Committee rather than resolved by management. Findings and recommendations are reported on a timely basis. Independence attestations and access-denial records are write-restricted to Internal Audit and the Audit Committee.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Audit engagement started under approved scope (`audit.engagement_started`) | Approved scope (`audit.engagement_scope`), auditor independence attestation (`auditor.independence_attestation`) | Engagement record + emitted (`audit.engagement_started`) | Per approved schedule |
  | Auditor access to records/personnel/systems requested or denied (`audit.workpaper_access_requested`) | Access grant/denial (`auditor.access_grant` / `auditor.access_denied`), denial detail (`auditor.access_denial_detail`) | Access decision + independence escalation if denied (`audit.workpaper_access_decided`) | At time of request (internal: escalate denial within 1 BD) |
  | Findings reported to the committee (`audit.report_submitted`) | Findings set (`finding.identified`), recommendations | Report submission record (`audit.report_submitted`) | Timely (internal: per engagement close) |

- **ALERTS/METRICS:** Alert when `audit.independence_escalation_raised` is true or an engagement lacks an independence attestation; target zero engagements started without attestation and zero unresolved access denials.

## AU-04 — Risk-Based Audit Scope and Frequency {#au-04-risk-based-audit-scope-and-frequency}

- **WHY (Reg cite):** Audit frequency and objectives must be set on risk-assessment results, and testing must remain independent and periodic ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)); the annual-audit obligation anchors in [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Auditors submit an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval. Audits are tentatively scheduled monthly then finalized; frequency is adjusted based on prior audit ratings and control strength. Any scope or frequency change must be documented in work papers with the circumstances and rationale — changes during fieldwork (e.g., when test results cannot be measured or a policy change renders techniques meaningless) are captured the same way. At a minimum, defined audit types execute at least annually. Annual plans, risk assessments, and scope-change rationale are write-restricted to Internal Audit pending committee approval.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Annual audit plan cycle opens (`audit.plan_cycle_opened`) | Risk assessment (`risk.assessment_results`), proposed scope (`audit.engagement_scope`), tentative schedule (`audit.tentative_schedule`) | Submitted annual plan (`audit.annual_plan_submitted`) | Annually (internal: submit ≥ 30 BD before plan year; enforced by `audit.assessment_annual_due_at`) |
  | Committee approves the annual plan (`audit.annual_plan_approved`) | Submitted plan (`audit.annual_plan_id`), committee decision | Approved plan + finalized schedule (`audit.annual_plan_approved`) | Annually |
  | Scope or frequency change identified (`audit.gap_detected`) | Change rationale (`audit.scope_change_rationale`), prior rating (`audit.overall_rating`), frequency adjustment (`audit.frequency_increased`) | Documented scope/frequency change in work papers (`audit.cae_action_recorded`) | At time of change (internal: documented same engagement) |

- **ALERTS/METRICS:** Alert when the annual plan is unsubmitted past its due timer or a scope/frequency change lacks documented rationale; target 100% of defined audit types scheduled at least annually and every change recorded in work papers.

## AU-05 — Audit Types and Network Assessments {#au-05-audit-types-and-network-assessments}

- **WHY (Reg cite):** Periodic, risk-focused testing of security and compliance programs by independent parties is required under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748); the annual-audit scope is set under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715). IT audit execution and information-security control testing are governed by the Information Security Policy; this control covers scheduling and completion tracking only.
- **SYSTEM BEHAVIOR:** A range of risk-focused audits is conducted at least annually — administrative audits, baseline compliance audits, social engineering assessments, and acceptable use assessments — plus technical assessments on internal and external IT systems (vulnerability assessments, penetration tests, and system configuration assessments). The system schedules each defined type, records assessment completion with type and result, and flags any type not completed within its annual window. Assessment scheduling and completion records are write-restricted to Internal Audit; technical-assessment execution is owned by the Information Security Policy.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Defined audit type scheduled (`audit.assessment_scheduled`) | Assessment type (`audit.assessment_type`), approved scope (`audit.engagement_scope`) | Scheduled assessment record (`audit.assessment_scheduled`) | At least annually (enforced by `audit.assessment_annual_due_at`) |
  | Assessment completed with result (`audit.assessment_completed`) | Result/rating (`audit.overall_rating`), evidence reference | Completed assessment record (`audit.assessment_completed`) | At least annually |
  | Penetration test report received from independent party (`pentest.report_received`) | Independence attestation (`pentest.independence`), test scope (`pentest.scope`) | Pentest report record (`pentest.report_issued`) | At least annually (enforced by `pentest.engagement_due`) |

- **ALERTS/METRICS:** Alert when any defined audit type is past its annual due timer without completion; target each of the seven defined types completed at least once per 12-month cycle and zero stale scheduled assessments.

## AU-06 — Audit Reporting and Work Papers {#au-06-audit-reporting-and-work-papers}

- **WHY (Reg cite):** Audit results must be documented and reported to enable corrective action and independent assessment of program effectiveness ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748)); reporting supports the committee's annual-audit mandate under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Each audit report documents scope and objective, dates of coverage, findings and deficiencies, recommendations, root cause, management responses, responsible party, and implementation date, with an overall and per-finding risk rating (High/Moderate/Low). Audit work papers document the procedures followed and provide sufficient evidence to support all conclusions, addressing every area in scope. The system drafts the report from fieldwork, records the overall and per-finding ratings, and finalizes and distributes per the committee-approved distribution list. Detailed work-paper preparation and sampling are operating procedures maintained outside this policy. Finalized reports and work papers are write-restricted to Internal Audit.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Fieldwork completed (`audit.fieldwork_completed`) | Procedures performed (`audit.engagement_scope`), evidence/work papers, findings (`finding.identified`) | Drafted audit report (`audit.report_drafted`) | Per schedule (internal: draft within 10 BD of fieldwork close) |
  | Report finalized with ratings (`audit.report_finalized`) | Overall rating (`audit.overall_rating`), per-finding ratings (`finding.risk_rating`), root cause (`finding.root_cause`), responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Finalized report (`audit.report_issued`) | Per schedule |
  | Report distributed to recipients (`audit.report_distributed`) | Distribution list (`audit.distribution_list`) | Distribution record (`audit.report_distributed`) | Per schedule (internal: within 5 BD of finalization) |

- **ALERTS/METRICS:** Alert on any finalized report missing an overall or per-finding rating, root cause, responsible party, or implementation date; target 100% of reports with complete required sections and every conclusion supported by work-paper evidence.

## AU-07 — Finding Tracking and Escalation {#au-07-finding-tracking-and-escalation}

- **WHY (Reg cite):** Timely identification, reporting, and follow-up of control deficiencies is integral to the independent testing and corrective-action expectations under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748), supporting the committee's oversight role under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Findings from internal and external audits and examinations are tracked, monitored, and followed up with department supervisors. Findings are reviewed at the Compliance Committee monthly; any finding older than three months is escalated to the Audit Committee/Board; all findings are formally reported to the Audit Committee at least quarterly. Ownership is assigned at supervisor level or above. The system runs a monthly review, fires an escalation when a finding's age crosses three months, and produces a consolidated quarterly report. The finding register is write-restricted to Internal Audit and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Finding identified and tracked (`finding.opened`) | Finding detail (`finding.identified`), department (`finding.department`), owner (`finding.owner`), source (`deficiency.source`) | Tracked finding record (`finding.opened`) | At report issuance |
  | Monthly Compliance Committee review (`finding.monthly_review_recorded`) | Open findings list (`finding.open_report`), remediation status (`finding.remediation_status`) | Monthly review record (`finding.monthly_review_recorded`) | Monthly (enforced by `finding.monthly_review_due`) |
  | Finding ages past three months (`finding.aging_threshold_breached`) | Finding age, owner (`finding.owner`), status (`finding.remediation_status`) | Escalation to Audit Committee/Board (`finding.escalated`) | At 3 months (enforced by `finding.escalation_due_at`) |
  | Quarterly reporting cycle reached (`finding.quarterly_report_delivered`) | All findings (`finding.tracked`), ratings (`finding.risk_rating`) | Quarterly committee report (`finding.quarterly_report_delivered`) | Quarterly (enforced by `finding.quarterly_report_due`) |

- **ALERTS/METRICS:** Alert when a finding exceeds three months without escalation or a monthly review is skipped; target zero un-escalated findings older than three months and four quarterly committee reports per year.

## AU-08 — Management Response and Risk Acceptance {#au-08-management-response-and-risk-acceptance}

- **WHY (Reg cite):** Corrective action and accountable management response to audit deficiencies support the independent-testing and remediation expectations under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748); committee oversight of responses sits under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Management responds with a remediation action plan or formally accepts the risk no later than 30 days from the final report date. Risk acceptance must be fully documented, provided to the Audit Committee, and generally requires Board-level approval to close. The system starts a response clock at report finalization, records the management response or risk-acceptance package, and routes risk acceptances for committee visibility and Board approval. Risk-acceptance packages and approval records are write-restricted to the Audit Committee and Board.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Final report issued, response clock starts (`audit.report_issued`) | Final report date, finding owner (`finding.owner`), implementation date (`finding.implementation_date`) | Management response task opened (`finding.management_response_recorded`) | 30 days from final report date (enforced by `finding.response_due_at`) |
  | Management submits remediation plan (`finding.remediation_reported`) | Action plan, timeline, responsible party (`finding.responsible_party`), implementation date (`finding.implementation_date`) | Remediation plan record (`finding.remediation_reported`) | ≤ 30 days from final report date (enforced by `finding.response_due_at`) |
  | Management proposes risk acceptance (`finding.risk_acceptance_proposed`) | Acceptance package (`finding.risk_acceptance_package`), rationale (`finding.risk_acceptance_rationale`) | Risk-acceptance decision with Board approval to close (`finding.risk_acceptance_decided`) | ≤ 30 days from final report date (enforced by `risk_acceptance.decision_due_at`) |

- **ALERTS/METRICS:** Alert when the 30-day response clock ages without a plan or acceptance, and on any risk acceptance closed without Board approval; target zero overdue management responses and 100% of risk acceptances documented and provided to the committee.

## AU-09 — Follow-Up Audits {#au-09-follow-up-audits}

- **WHY (Reg cite):** Verifying that deficiencies are remediated before closure, and tightening frequency where prior ratings are poor, implements the risk-based, corrective-action testing expectations under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the annual-audit oversight under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Internal Audit reviews all identified findings prior to closure to confirm appropriate remediation; poor prior audit ratings drive enhanced audit review frequency by feeding the annual risk assessment. The system blocks finding closure until Internal Audit verifies remediation evidence, and a recorded poor rating raises the frequency for the affected area. Closure verification records are write-restricted to Internal Audit.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Closure requested for a finding (`finding.closure_logged`) | Remediation evidence (`finding.remediation_evidence`), closure evidence (`finding.closure_evidence`) | Verified closure or rejection (`finding.closure_verified` / `finding.closure_rejected`) | Before closure (internal: verify within 5 BD of request) |
  | Poor prior rating recorded (`audit.poor_rating_recorded`) | Overall rating (`audit.overall_rating`), affected area scope (`audit.engagement_scope`) | Enhanced-frequency adjustment fed to risk assessment (`audit.cae_action_recorded`) | At next plan cycle (enforced by `risk.assessment_due_at`) |

- **ALERTS/METRICS:** Alert on any finding closed without recorded Internal Audit verification; target zero unverified closures and confirmed frequency increases for every area with a poor prior rating.

## AU-10 — Work Paper Retention and Physical Control {#au-10-work-paper-retention-and-physical-control}

- **WHY (Reg cite):** Retention and controlled custody of audit work papers and reports support the documentation and independent-testing expectations under [12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) and the committee's records obligations under [12 CFR Part 715](https://www.ecfr.gov/current/title-12/part-715).
- **SYSTEM BEHAVIOR:** Work papers and audit reports are retained for seven years after the audit report date. Work papers are the property of Internal Audit, kept under their control in a secure location; requests for access by persons outside Internal Audit require Audit Committee approval. The system sets a seven-year retention clock at report date, governs disposal at expiry (honoring any legal hold), and routes outside-access requests for committee decision. Retention configuration and access decisions are write-restricted to Internal Audit and the Audit Committee.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|---|
  | Report finalized, retention clock set (`audit.retention_applied`) | Report date as anchor (`retention.anchor_date`), record type (`retention.record_type`), schedule (`retention.schedule`) | Retention clock recorded (`record.retention_clock_set`) | 7 years from report date (enforced by `audit.retention_expires_at`) |
  | Outside party requests work-paper access (`audit.workpaper_access_requested`) | Requester (`disclosure_detail.requester`), request doc (`disclosure_detail.request_doc`), access detail (`audit.access_request_detail`) | Access decision (`audit.workpaper_access_decided`) | At time of request (internal: committee decision within 5 BD) |
  | Retention period expires (`record.retention_expired`) | Legal-hold status (`audit.legal_hold_status`), disposal method (`record.disposal_method`) | Disposal record or hold-blocked retention (`record.destroyed`) | At 7 years (enforced by `record.destruction_due_at`) |

- **ALERTS/METRICS:** Alert on any work-paper access granted to an outside party without committee approval and on disposal attempted under an active legal hold; target zero unauthorized accesses and zero premature disposals.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for maintenance, interpretation, and centralized governance of these controls.
- **Required participants:** Audit Committee, Board of Directors, and Internal Audit.
- **Approval:** Patrick Wilson, Chief Compliance Officer. This policy is reviewed and approved by the Board of Directors at least annually (see [AU-01](#au-01-board-of-directors-oversight)).
- **Review cadence:** Annual, or upon material regulatory change affecting NCUA Parts 715 or 748.
- **Cross-references:** Information Security Policy (IT audit execution and information-security control testing), BSA Policy control BA-15 (BSA/AML independent testing), Internal Controls Policy (internal control design and ownership), Enterprise Risk Management Policy (risk taxonomy and risk-assessment methodology).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several audit-side fields and events referenced in the control overlays are registered in `core-vocabulary.json` (e.g., `audit.*`, `finding.*`, `pentest.*`, `record.retention_*`), but a subset uses the agreed target/provisional naming scheme not yet registered — including `audit.resource_assessment`, `engagement.provider`, `engagement.scope`, `deficiency.source`, `retention.anchor_date`, `retention.record_type`, `retention.schedule`, `disclosure_detail.requester`, `disclosure_detail.request_doc`, `finding.risk_rating`, `finding.root_cause`, `finding.responsible_party`, `finding.implementation_date`, and `pentest.scope`. Names used are the target naming scheme and will be confirmed by engineering before the next review.
- **Provisional codes reused, not re-coined.** Where the migration map already lists an agreed spelling (e.g., `finding.id`, `finding.severity`, `finding.root_cause`, `pentest.scope`, `engagement.scope`, `engagement.provider`, `deficiency.severity`), those exact spellings are used rather than near-duplicates.
- **Charter and reporter status.** This policy assumes Pynthia Credit Union is an NCUA-regulated federal credit union to which 12 CFR Parts 715 and 748 apply; the Supervisory Committee function is treated as the "Audit Committee" named in PATRICK_NOTES. If the charter is state-chartered or differently structured, the applicable supervisory-committee audit authority must be confirmed.
- **Regulatory audit manuals as authority.** AUTHORITY_HINTS cites CFPB/OCC/FDIC/Federal Reserve audit manuals as the basis for developing audit work programs. Detailed work-program development is treated as operating procedure (out of scope) and is not anchored to a standalone control; if examiners expect a policy-level control for work-program maintenance, one should be added.
- **Monthly committee meeting timer.** No registered monthly Audit Committee meeting timer exists; AU-02 relies on the scheduling event (`audit.committee_meeting_scheduled`) plus the monthly review pattern. If a dedicated committee-meeting timer is required, engineering should register one under the generic `Task` pattern.
- **"Compliance Committee" vs "Audit Committee" monthly review.** PATRICK_NOTES route monthly finding review through the Compliance Committee and quarterly formal reporting to the Audit Committee; AU-07 uses `finding.monthly_review_recorded` for the monthly review without distinguishing committee identity in vocabulary. The committee mapping is assumed and should be confirmed.
