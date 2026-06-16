---
title: Compliance Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, CMS, Governance, Regulatory Change, Training, Monitoring, Audit]
---

## General Policy Statement

Pynthia Credit Union maintains a Compliance Management System (CMS) that the Board of Directors supervises and the Chief Compliance Officer (CCO) administers to **Prevent, Detect, and Correct** compliance issues across all federal and California (DFPI) laws applicable to its products, channels, and partners. The compliance function reports directly to the Board (or its Audit/Risk committee) on a line that does not route through executive management, preserving independence. This policy is governance-only: it establishes the framework — board reporting, an applicable-law inventory, roles, risk assessment, training, monitoring, independent audit, regulatory-change and complaint management, and review cadence — while substantive product rules live in their owning policies (BSA, Fair Lending, Privacy, Information Security, Collections, Audit, Internal Controls, Director Fiduciary Duties, Lending, and Record Retention).

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---:|---|
| CCO reports to the Board on regulatory changes, policies, training, and findings | Board cycle opens (`governance.board_cycle_opened`) | At least quarterly | Board compliance report | [CP-01](#cp-01-governance-board-reporting-line) |
| Applicable-law inventory refreshed | Inventory review timer fires (`regulation.inventory_reviewed`) | At least annually + on regulatory change | Regulation inventory | [CP-02](#cp-02-applicable-law-inventory) |
| New hire completes onboarding compliance training | Employee hired (`employee.hired`) | Within onboarding window | New-hire curriculum | [CP-05](#cp-05-training-standards) |
| All staff complete annual refresher | Annual cycle opens (`training.annual_cycle_opened`) | At least annually | Annual refresher curriculum | [CP-05](#cp-05-training-standards) |
| Independent compliance audit performed and routed to Board | Audit cycle opens (`audit.plan_cycle_opened`) | At least annually | Independent audit report | [CP-07](#cp-07-independent-audit) |
| Regulatory correspondence analyzed and changes implemented | Correspondence received (`regulatory.correspondence_received`) | Per CCO analysis SLA | Change analysis + procedure/training updates | [CP-08](#cp-08-regulatory-change-complaint-management) |
| Consumer complaint logged and monitored as compliance signal | Complaint received (`complaint.received`) | Per complaint SLA | Complaint log + trend review | [CP-08](#cp-08-regulatory-change-complaint-management) |
| Policy and CMS re-approved by the Board | Board review opens (`policy.board_review_started`) | At least annually + on material change | Re-approved policy | [CP-09](#cp-09-review-cadence) |

## CP-01 — Governance & Board Reporting Line  {#cp-01-governance-board-reporting-line}

- **WHY (Reg cite):** NCUA's regulatory framework requires a board-supervised compliance program with an independent reporting line; the CMS prevent/detect/correct posture and direct board accountability reflect federal-examination expectations and the DFPI's [California Consumer Financial Protection Law (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=). The line that bypasses executive management preserves the independence examiners expect of a credit-union compliance function.

- **SYSTEM BEHAVIOR:** The CCO is designated as the responsible officer and reports to the Board (or its Audit/Risk committee) at least quarterly on regulatory changes, policies submitted for approval, training status, and audit/exam findings with corrective actions. A board cycle opens on schedule, a compliance board report is assembled and delivered, and the Board records its review in the minutes. The reporting relationship does not route through executive management; the report distribution list and the designation record are write-restricted to Compliance and the Board secretary. If the CCO position is vacant, the designation falls to the named backup (CFO and/or Operations Officer) until a successor is designated, and that interim designation is recorded.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Compliance officer designated or backup invoked (`governance.designation_recorded`) | Officer identity (`compliance.officer_vacancy`), authority statement (`governance.authority_statement`), RACI registry (`governance.raci_registry`) | Designation record + emitted `governance.designation_recorded` | — |
  | Board reporting cycle opens (`governance.board_cycle_opened`) | RACI registry (`governance.raci_registry`), prior findings (`finding.open_report`) | Board cycle opened + emitted `governance.board_cycle_opened` | Quarterly (enforced by `compliance.board_report_due_at`) |
  | CCO delivers quarterly board compliance report (`compliance.board_report_delivered`) | Regulatory-change summary (`regulatory.change_identified`), training metrics (`training.coverage_pct`), audit/exam findings (`finding.open_report`), board report id (`compliance.board_report_id`) | Board compliance report + emitted `compliance.board_report_delivered` | Quarterly (internal: 5 BD after cycle open; enforced by `compliance.board_report_due_at`) |
  | Board records its review (`board.audit_review_recorded`) | Meeting date (`board.meeting_date`), resolution id (`board.resolution_id`) | Board minutes + emitted `board.audit_review_recorded` | Same meeting (enforced by `board.notification_due_at`) |

- **ALERTS/METRICS:** Alert if a quarter closes without a delivered `compliance.board_report_delivered` (target zero); track board-report-aging against `compliance.board_report_due_at` and flag any CCO-vacancy interval where `compliance.officer_vacancy` is set without a recorded backup designation.

## CP-02 — Applicable-Law Inventory  {#cp-02-applicable-law-inventory}

- **WHY (Reg cite):** A current inventory of all applicable federal and California laws is the foundation of a sound CMS; it anchors the consumer-protection statutes examined federally and by DFPI — e.g., [ECOA/Reg B (12 CFR 1002)](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z (12 CFR 1026)](https://www.ecfr.gov/current/title-12/part-1026), [HMDA/Reg C (12 CFR 1003)](https://www.ecfr.gov/current/title-12/part-1003), [Reg E (12 CFR 1005)](https://www.ecfr.gov/current/title-12/part-1005), [Reg DD (12 CFR 1030)](https://www.ecfr.gov/current/title-12/part-1030), [Reg CC (12 CFR 229)](https://www.ecfr.gov/current/title-12/part-229), [GLBA/Reg P (12 CFR 1016)](https://www.ecfr.gov/current/title-12/part-1016), [FCRA (15 USC 1681)](https://www.law.cornell.edu/uscode/text/15/1681), [Fair Housing Act (42 USC 3605)](https://www.law.cornell.edu/uscode/text/42/3605), and the [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=).

- **SYSTEM BEHAVIOR:** Compliance maintains an inventory of every federal and California law and regulation applicable to the credit union's products and activities, with citations. The inventory is reviewed on a timer and updated whenever a regulatory change is detected, so it stays current. Each substantive rule maps to its owning policy rather than being restated here. The inventory and its citations are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Inventory review timer fires (`regulation.inventory_reviewed`) | Citation set (`regulation.citation`), prior inventory snapshot (`regulation_inventory.citation`) | Reviewed inventory + emitted `regulation.inventory_reviewed` | Annually (enforced by `regulation.inventory_review_due_at`) |
  | New or changed regulation identified (`regulation.inventory_updated`) | New citation (`regulation.citation`), change source (`regulatory.source_doc`) | Updated inventory entry + emitted `regulation.inventory_updated` | On change (no registered timer) |

- **ALERTS/METRICS:** Alert when `regulation.inventory_review_due_at` is breached (target zero overdue); track count of regulatory-change events that did not produce a corresponding `regulation.inventory_updated` within the analysis SLA.

## CP-03 — Roles & Responsibilities  {#cp-03-roles-responsibilities}

- **WHY (Reg cite):** Clear assignment of compliance responsibility — a designated officer with authority and resources, plus accountable line managers — is a core CMS expectation under the DFPI's [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=) and federal examination standards reflected across consumer-protection regulations such as [ECOA/Reg B (12 CFR 1002)](https://www.ecfr.gov/current/title-12/part-1002).

- **SYSTEM BEHAVIOR:** The CCO owns the CMS — risk assessments, policies/procedures/internal controls, training coordination, complaint monitoring, and coordination of exams and outside consultants — with authority to delegate and to call and set agendas for relevant committees. Department managers own compliance in their functional areas, including knowledge of applicable rules, assisting with procedures, and tracking corrections. A designated backup (CFO and/or Operations Officer) assumes the role if the CCO cannot serve. Role assignments are recorded in a register that is write-restricted to Compliance and HR.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Compliance role assigned to an individual (`compliance.role_assigned`) | Assignee identity (`employee.id`), role (`user.role`), RACI registry (`governance.raci_registry`) | Role register entry + emitted `compliance.role_assigned` | — |
  | Role register updated (e.g., manager change, backup invoked) (`compliance.role_register_updated`) | Change rationale (`compliance.change_rationale`), effective date (`covered_person.effective_date`) | Updated role register + emitted `compliance.role_register_updated` | — |

- **ALERTS/METRICS:** Track count of functional areas without an assigned department-manager role owner (target zero); alert on any active CCO-vacancy (`compliance.officer_vacancy`) lacking a current `compliance.role_register_updated` recording the backup.

## CP-04 — Compliance Risk Assessments  {#cp-04-compliance-risk-assessments}

- **WHY (Reg cite):** Periodic compliance risk assessment is a CMS pillar that prioritizes monitoring and assurance; it is expected under DFPI [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=) authority and federal examination practice across consumer-protection rules (e.g., [ECOA/Reg B (12 CFR 1002)](https://www.ecfr.gov/current/title-12/part-1002), [TILA/Reg Z (12 CFR 1026)](https://www.ecfr.gov/current/title-12/part-1026)).

- **SYSTEM BEHAVIOR:** Compliance conducts periodic risk assessments to identify higher-risk areas and direct increased monitoring there. Each assessment is scored, recorded, and used to update the monitoring plan. The assessment timer drives the cadence, and results feed the Board report. The assessment results and scoring are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk-assessment timer fires (`compliance.risk_assessment_completed`) | Candidate profile (`risk.candidate_profile`), inherent score (`risk.inherent_score`), assessment results (`risk.assessment_results`) | Completed compliance risk assessment + emitted `compliance.risk_assessment_completed` | At least annually (enforced by `compliance.risk_assessment_due_at`) |
  | Monitoring plan updated from assessment (`monitoring.plan_updated`) | Assessment scope (`monitoring.scope`), sample spec (`monitoring.sample_spec`) | Updated monitoring plan + emitted `monitoring.plan_updated` | Internal: 30 days after assessment (no registered timer) |

- **ALERTS/METRICS:** Alert when `compliance.risk_assessment_due_at` is breached (target zero overdue); track whether each completed assessment produced a `monitoring.plan_updated` within the internal SLA.

## CP-05 — Training Standards  {#cp-05-training-standards}

- **WHY (Reg cite):** Training of all personnel is a baseline regulator expectation of every CMS and underpins compliance with consumer-protection regimes such as [ECOA/Reg B (12 CFR 1002)](https://www.ecfr.gov/current/title-12/part-1002) and [GLBA/Reg P (12 CFR 1016)](https://www.ecfr.gov/current/title-12/part-1016); the DFPI examines training adequacy under the [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=).

- **SYSTEM BEHAVIOR:** Every employee is trained on compliance — initial onboarding training for new hires and annual refreshers for all staff. Compliance and HR retain attendance and completion records, and Compliance may assign remedial training when proficiency fails or a deficiency is found. New-hire training is keyed off the hire event and tracked to a completion timer; the annual cycle opens on schedule and is tracked to coverage targets. Completion records are write-restricted to Compliance and HR.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New employee hired (`employee.hired`) | Employee id (`employee.id`), hire date (`training.hire_date`), role curriculum (`training.role_curriculum`) | Onboarding assignment + emitted `training.onboarding_completed` | Onboarding window (enforced by `training.onboarding_due_at`) |
  | Annual training cycle opens (`training.annual_cycle_opened`) | Assignee id (`training.assignee_id`), required curriculum (`training.required_curriculum`), content version (`training.content_version`) | Annual assignments + emitted `training.annual_assigned` | At least annually (enforced by `training.annual_due_at`) |
  | Employee completes assigned training (`training.completion_recorded`) | Completion status (`training.completion_status`), assessment score (`training.assessment_score`) | Completion/attendance record + emitted `training.completion_recorded` | Per assignment (enforced by `training.completion_due_at`) |
  | Compliance assigns remedial training (`training.remedial_assigned`) | Failed-proficiency flag (`training.proficiency.failed`), curriculum (`training.refresher_curriculum`) | Remedial assignment + emitted `training.remedial_completed` | Internal: 30 days (no registered timer) |

- **ALERTS/METRICS:** Track annual training coverage (`training.coverage_pct`) with a target of 100% before `training.annual_due_at`; alert on lapsed assignments (`training.lapsed`) and on new hires past `training.onboarding_due_at` without a `training.onboarding_completed`.

## CP-06 — Monitoring & Assurance Reviews  {#cp-06-monitoring-assurance-reviews}

- **WHY (Reg cite):** Ongoing monitoring and assurance reviews of regulated activities are a CMS pillar; documenting what was reviewed and the findings so they are replicable reflects federal-examination expectations and DFPI [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=) oversight across consumer-protection rules.

- **SYSTEM BEHAVIOR:** Compliance performs ongoing monitoring and assurance reviews focused on higher-risk regulated activities, drawing documented samples and recording findings so a third party can replicate them. The trailing-12-month coverage is reported, and findings flow to corrective action and the Board report. Monitoring scope, samples, and findings are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monitoring review timer fires (`monitoring.review_completed`) | Review scope (`monitoring.scope`), sample spec (`monitoring.sample_spec`), sample drawn (`monitoring.sample_drawn`) | Completed monitoring review + emitted `monitoring.review_completed` | Per plan (enforced by `monitoring.review_due_at`) |
  | Findings reported from monitoring (`monitoring.findings_reported`) | Finding description (`finding.description`), severity (`finding.severity`), owner (`finding.owner`) | Findings record + emitted `monitoring.findings_reported` | Internal: 10 BD after review (no registered timer) |
  | Trailing-12-month coverage reported (`monitoring.coverage_reported`) | Coverage review (`monitoring_coverage.review`) | Coverage report + emitted `monitoring.coverage_reported` | Annually (enforced by `monitoring.coverage_review_due`) |

- **ALERTS/METRICS:** Alert when `monitoring.review_due_at` or `monitoring.coverage_review_due` is breached (target zero overdue); track open monitoring findings by aging and severity, with target zero past their `finding.response_due_at`.

## CP-07 — Independent Audit  {#cp-07-independent-audit}

- **WHY (Reg cite):** An independent audit of the compliance system — at least annually, capable of reviewing and replicating the assurance reviews and routing findings to the Board — is a foundational CMS control under federal-examination standards and DFPI [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=) oversight. The broader internal-audit charter lives in the Audit Policy; this control covers compliance-system coverage only.

- **SYSTEM BEHAVIOR:** A qualified, independent firm audits the compliance system at least annually, reviewing the assurance reviews themselves and confirming their findings can be replicated. The audit cycle opens on schedule, fieldwork is performed, a report is issued, management responses are collected, and findings with corrective actions are routed to the Board. Auditor independence is attested, and audit workpaper access is write-restricted to Internal Audit, the external firm, and the Board.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Independent audit cycle opens (`audit.plan_cycle_opened`) | Engagement scope (`audit.engagement_scope`), independence attestation (`auditor.independence_attestation`) | Audit cycle opened + emitted `audit.plan_cycle_opened` | At least annually (enforced by `audit.compliance_audit_due_at`) |
  | Audit report issued (`audit.report_issued`) | Findings (`finding.description`), overall rating (`audit.overall_rating`), report id (`audit.report_id`) | Independent audit report + emitted `audit.report_issued` | Per engagement (enforced by `audit.cycle_timer`) |
  | Management responses received (`audit.management_responses_received`) | Management response (`finding.management_response`), corrective action (`audit_detail.corrective_action`), finding owner (`audit_detail.finding_owner`) | Response record + emitted `audit.management_responses_received` | Internal: 30 days (enforced by `finding.response_due_at`) |
  | Findings routed to Board (`board.audit_review_recorded`) | Finding closure evidence (`finding.closure_evidence`), remediation status (`finding.remediation_status`) | Board audit-review minute + emitted `board.audit_review_recorded` | Next board cycle (enforced by `board.notification_due_at`) |

- **ALERTS/METRICS:** Alert when `audit.compliance_audit_due_at` is breached (target zero); track audit findings open past `finding.response_due_at` and confirm every issued audit report has a corresponding `board.audit_review_recorded`.

## CP-08 — Regulatory-Change & Complaint Management  {#cp-08-regulatory-change-complaint-management}

- **WHY (Reg cite):** Directing regulatory correspondence to the CCO, analyzing and implementing required changes, and treating consumer complaints as a compliance signal are CMS expectations; complaints implicate [UDAAP — Dodd-Frank §§1031 & 1036 (12 USC 5531)](https://www.law.cornell.edu/uscode/text/12/5531), [(12 USC 5536)](https://www.law.cornell.edu/uscode/text/12/5536), and the DFPI's complaint-handling expectations under the [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=). Collection-specific complaint SLAs live in the Collections Policy.

- **SYSTEM BEHAVIOR:** Regulatory correspondence is routed to the CCO, who analyzes it with department managers, determines required changes, and implements them through updated procedures and scheduled training (or a circulated memorandum if training is unnecessary). Consumer complaints are logged, investigated, and reviewed for patterns or themes that signal a disclosure or training issue; UDAAP-flagged complaints are escalated. Correspondence analysis records and the complaint log are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Regulatory correspondence received (`regulatory.correspondence_received`) | Source document (`regulatory.source_doc`), change-required flag (`regulatory.change_required`) | Logged correspondence + emitted `regulatory.correspondence_received` | — |
  | Change analyzed and logged (`regulatory.change_analysis_logged`) | Change identified (`regulatory.change_identified`), analysis (`regulatory.analysis_due_at` driven) | Change analysis record + emitted `regulatory.change_analysis_logged` | Internal: 10 BD (enforced by `regulatory.analysis_due_at`) |
  | Required change implemented (procedure + training) (`procedure.change_set`) | Procedure diff (`form.template_diff`), affected curriculum (`training.role_curriculum`) | Updated procedures/training + emitted `procedure.change_set` | Internal: 30 days after analysis (no registered timer) |
  | Consumer complaint received and logged (`complaint.logged`) | Complaint narrative (`complaint.narrative`), category (`complaint.category`), member id (`complaint.member_id`), UDAAP flag (`complaint.udaap_flag`) | Complaint log entry + emitted `complaint.logged` | Per complaint SLA (enforced by `complaint.ack_due_at`) |
  | Complaint trend reviewed as compliance signal (`complaint.trend_reported`) | Trend summary (`complaint.trend_summary`), root-cause tag (`complaint.root_cause_tag`) | Trend review report + emitted `complaint.trend_reported` | Periodic (enforced by `complaint.trend_review_due`) |

- **ALERTS/METRICS:** Alert when `regulatory.analysis_due_at` or `complaint.ack_due_at` is breached (target zero); track count of regulatory changes flagged `regulatory.change_required` without a downstream `procedure.change_set`, and surface UDAAP-flagged complaint clusters from `complaint.trend_summary`.

## CP-09 — Review Cadence  {#cp-09-review-cadence}

- **WHY (Reg cite):** A stated cadence — Board review and re-approval of the policy and CMS at least annually and upon material regulatory change — is a basic governance expectation under federal-examination standards and the DFPI's [CCFPL (Fin. Code §90001 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=1.5.&chapter=&part=&lawCode=FIN&title=).

- **SYSTEM BEHAVIOR:** The Board reviews and re-approves this policy and the CMS at least annually and whenever a material regulatory change occurs. A board review opens on the review timer or on a flagged material change, the revised policy is submitted, the Board approves it, and the approval is published with the next review date set. Material-change flags are raised from regulatory-change analysis. Policy approval records are write-restricted to Compliance and the Board secretary.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board review opens on cadence or material change (`policy.board_review_started`) | Document id (`policy.document_id`), prior version (`policy.document_version`), material-change flag (`policy.material_change_flagged`) | Board review opened + emitted `policy.board_review_started` | At least annually (enforced by `policy.board_approval_due_at`) |
  | Board approves policy and CMS (`policy.board_approved`) | Redline summary (`policy.change_summary`), minutes reference (`policy.minutes_reference`) | Re-approved policy + emitted `policy.board_approved` | Per cycle (enforced by `policy.board_approval_due_at`) |
  | Approved revision published with next review set (`policy.version_published`) | Effective date (`policy.effective_date`), next review date (`policy.next_review_date`) | Published policy version + emitted `policy.version_published` | Internal: 5 BD after approval (enforced by `policy.review_due_at`) |

- **ALERTS/METRICS:** Alert when `policy.board_approval_due_at` lapses or `policy.review_lapsed` is set (target zero); issue a review-warning on `policy.review_due_soon` and confirm every material-change flag drives a `policy.board_review_started`.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — owns the CMS and this policy, including risk assessments, policies/procedures/internal controls, training coordination, complaint monitoring, and exam/consultant coordination.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Board oversight:** The Board (and its Audit/Risk committee) supervises the CMS via the independent reporting line described in [CP-01](#cp-01-governance-board-reporting-line); the CCO reports at least quarterly and the Board re-approves the policy at least annually per [CP-09](#cp-09-review-cadence).
- **Required participants:** Department managers (functional-area compliance, [CP-03](#cp-03-roles-responsibilities)), Human Resources (training records, [CP-05](#cp-05-training-standards)), and Internal Audit / the external firm (independent audit, [CP-07](#cp-07-independent-audit)).
- **Review cadence:** Annual and upon material regulatory change ([CP-09](#cp-09-review-cadence)).
- **Cross-references:** Substantive rules live in their owning policies — BSA Policy; Fair Lending Policy; Privacy Policy; Information Security Policy; Collections Policy; Audit Policy; Internal Controls Policy; Director Fiduciary Duties Policy; Lending Policy; Record Retention Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several event, field, and timer codes referenced in the control overlays — e.g., `compliance.role_assigned`, `compliance.role_register_updated`, `regulation.inventory_reviewed`/`inventory_updated`, `monitoring.review_completed`/`findings_reported`/`coverage_reported`, `procedure.change_set`, `governance.designation_recorded`, and `policy.board_review_started` — exist in the parsed core vocabulary as registered or composable codes, but their binding to this governance domain is the target naming scheme and will be confirmed by engineering before the next review. Provisional spellings used (e.g., `complaint.summary_id`, `policy.id`/`policy.version`, `process.owner_id`) are taken verbatim from the agreed provisional-codes list.
- **Charter type and NCUA applicability.** Pynthia is identified as a credit union; the specific NCUA part(s) and whether it is federally or state-chartered (and thus the precise DFPI vs. NCUA examination split) were not specified. WHY fields anchor to the CCFPL and the cross-cutting federal consumer-protection rules; the exact NCUA citations should be confirmed.
- **DFPI / California overlays.** The applicable-law inventory ([CP-02](#cp-02-applicable-law-inventory)) is asserted to include California overlays named in the authority hints (California Financing Law, Rosenthal FDCPA, Holden Act, Homeowner Bill of Rights, CCPA/CPRA, Unruh Civil Rights Act). The authoritative, current scope of those overlays is maintained in the live inventory, not enumerated here; confirm coverage with Legal.
- **Internal SLAs are assumed minimums.** Where the regulation states only "at least quarterly/annually" or no fixed deadline, internal SLAs (e.g., 5 BD board-report delivery, 10 BD regulatory-change analysis, 30 days procedure/training implementation, 30 days remedial training) are proposed defaults and need confirmation by the CCO.
- **HMDA reporter status.** Whether Pynthia is a HMDA reporter affects how Reg C surfaces in the inventory and monitoring scope; this is governed substantively in the Fair Lending Policy and should be confirmed there.
- **Backup-officer scope.** The policy names CFO and/or Operations Officer as CCO backup; whether both serve jointly or in a defined order of succession was not specified and should be confirmed.
- **Complaint and collections SLA boundary.** General consumer-complaint handling is treated as a compliance signal here; collection-specific complaint SLAs and conduct rules are deferred to the Collections Policy. The precise acknowledgment/response SLAs enforced by `complaint.ack_due_at` need confirmation against any applicable DFPI complaint-handling timelines.
