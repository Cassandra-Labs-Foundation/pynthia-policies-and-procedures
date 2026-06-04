---
title: Enterprise Risk Management Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Enterprise Risk Management, Risk Appetite, Risk Register, KRI, Governance]
---

# Enterprise Risk Management Policy

## General Policy Statement

Pynthia Credit Union manages risk deliberately and transparently across financial, operational, compliance, technology, model, strategic, and reputational risk types. This Framework establishes how the Credit Union expresses risk appetite, rates risks on a consistent 5×5 likelihood/impact matrix, escalates and reports appetite breaches, grants time-bounded risk acceptances, and maintains a living enterprise risk register — all operating across the three lines of defense and overseen by the Chief Compliance Officer, the Management Risk Committee, the Board Risk Committee, and the Board of Directors. This Framework does not enumerate specific risks or limits; detailed risk appetite statements, registers, and committee charters are maintained separately and must conform to it. The risk this Framework controls is the consistency and integrity of the enterprise risk process itself: appetite defined, risks scored comparably, breaches escalated on time, and the Board presented a complete and reconciled picture.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Risk appetite statement annual review | Approved appetite version reaches 12 months of age (`risk_appetite.review_due`) | 12 months from approval; system flags 30 days before next review date | Current appetite statement + structured category data | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Appetite re-review after material strategic change | Material strategic change declared (`strategy.material_change_declared`) | 90 days | Revised appetite statement | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Risk taxonomy review | Annual cycle or new product type / business line added (`taxonomy.review_due`) | At least annually | Canonical category and subcategory list | [ERM-02](#erm-02-risk-taxonomy-and-categories) |
| Scoring matrix review | Triennial cycle or major change (`risk_scale.review_due`) | Every 3 years | 5×5 matrix, numeric scores, qualitative bands | [ERM-03](#erm-03-risk-scoring-matrix-and-rating-scale) |
| High / Very High residual risk reassessment | Reassessment timer elapses (`risk.reassessment_due`) | Quarterly | Risk register entry | [ERM-04](#erm-04-risk-assessment-and-register-maintenance) |
| Moderate residual risk reassessment | Reassessment timer elapses (`risk.reassessment_due`) | Annually | Risk register entry | [ERM-04](#erm-04-risk-assessment-and-register-maintenance) |
| Low / Very Low residual risk reassessment | Reassessment timer elapses or trigger event (`risk.reassessment_due`) | Every 2 years | Risk register entry | [ERM-04](#erm-04-risk-assessment-and-register-maintenance) |
| KRI stale-data flag | No KRI observation within 1.5× expected interval (`kri.data_stale`) | 1.5× configured refresh interval | KRI definition + threshold record | [ERM-05](#erm-05-key-risk-indicators-and-thresholds) |
| Major/Critical breach triage and CRO notification | Position outside appetite detected (`risk_breach.detected`) | 1 business day | Breach record with severity | [ERM-06](#erm-06-risk-appetite-breach-escalation-and-incident-management) |
| Major/Critical breach committee presentation | Breach record opened (`risk_breach.opened`) | 30 calendar days | Breach summary + remediation plan | [ERM-06](#erm-06-risk-appetite-breach-escalation-and-incident-management) |
| Open breach status review | Monthly review timer (`risk_breach.review_due`) | Monthly until closure | Breach status update | [ERM-06](#erm-06-risk-appetite-breach-escalation-and-incident-management) |
| Risk acceptance decision | Acceptance request submitted (`risk_acceptance.requested`) | 30 calendar days | Acceptance record (approver, rationale, compensating controls, expiry) | [ERM-07](#erm-07-risk-acceptance-and-exceptions) |
| Risk acceptance expiry alerts | Expiry date approaching (`risk_acceptance.expiry_warning`) | 30 days and 7 days before expiry | Acceptance record | [ERM-07](#erm-07-risk-acceptance-and-exceptions) |
| Management risk report | Monthly reporting cycle (`risk_report.management_due`) | Monthly | Heatmaps, top risks, breach/acceptance summaries, KRI trends | [ERM-08](#erm-08-risk-reporting-and-governance-oversight) |
| Board / Board Risk Committee report | Quarterly reporting cycle (`risk_report.board_due`) | Quarterly | Board risk report with reconciliation notes | [ERM-08](#erm-08-risk-reporting-and-governance-oversight) |

## ERM-01 — Enterprise Risk Appetite Statement {#erm-01-enterprise-risk-appetite-statement}

- **WHY (Reg cite):** NCUA safety-and-soundness expectations under [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and the written risk-policy requirements of [Appendix A to 12 CFR Part 741](https://www.law.cornell.edu/cfr/text/12/appendix-A_to_part_741) require a federally insured credit union to define and govern its tolerance for risk; NCUA's Examiner's Guide treats a Board-approved enterprise risk appetite statement as the anchor of an effective ERM program.
- **SYSTEM BEHAVIOR:** The GRC system holds a single authoritative enterprise risk appetite statement: the approved document plus structured appetite data per risk category, each version carrying effective and expiry dates and a full approval history. Creating or editing appetite settings is write-restricted to authorized roles (CCO and delegated risk administrators); all other users have read-only access. The system schedules the next review 12 months out at approval and raises a flag 30 days before that date; a declared material strategic change starts a separate 90-day re-review clock. Superseded versions are retained immutably so any historical risk decision can be traced to the appetite in force at the time.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New or revised appetite statement approved by the Board (`risk_appetite.approved`) | Appetite document (`risk_appetite.document`), structured category limits (`risk_appetite.category_settings[]`), approver identities (`risk_appetite.approvers[]`), effective date (`risk_appetite.effective_date`) | Versioned authoritative appetite record with approval history (`risk_appetite.version_published`) | Effective on approval (next review scheduled at +12 months via `risk_appetite.review_due_at`) |
  | Upcoming review window opens (`risk_appetite.review_window_opened`) | Current version metadata (`risk_appetite.version`), next review date (`risk_appetite.next_review_date`) | Review-due flag to owner and CCO (`risk_appetite.review_flagged`) | 30 days before next review date (enforced by `risk_appetite.review_due_at`) |
  | Material strategic change declared by management (`strategy.material_change_declared`) | Change description (`strategy.change_summary`), affected risk categories (`risk_appetite.category_settings[]`) | Re-review task opened against the appetite statement (`risk_appetite.rereview_opened`) | 90 days to complete re-review (internal: draft to Management Risk Committee in 60 days; enforced by `risk_appetite.rereview_due_at`) |

- **ALERTS/METRICS:** Days until next appetite review (alert at ≤30); count of appetite versions effective without a recorded Board approval (target zero); count of unauthorized write attempts to appetite settings (target zero); elapsed days on any open 90-day re-review task.

## ERM-02 — Risk Taxonomy & Categories {#erm-02-risk-taxonomy-and-categories}

- **WHY (Reg cite):** Consistent risk identification and categorization underpins the identification, measurement, monitoring, and control expectations of [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) and the ERM basic-components framework in NCUA's Examiner's Guide; without a canonical taxonomy, aggregate risk reporting to the Board cannot be reconciled.
- **SYSTEM BEHAVIOR:** The GRC system maintains the canonical list of risk categories (financial, operational, compliance, technology, model, strategic, reputational) and their subcategories, and enforces selection from that list — free-text categories are rejected — for every risk, KRI, and incident record at creation and on edit. The taxonomy is reviewed at least annually and whenever a new product type or business line is added; retired categories are deactivated rather than deleted so historical records keep their classification. Taxonomy edits are write-restricted to the CCO and delegated risk administrators.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk, KRI, or incident record created or recategorized (`risk.created`, `kri.created`, `incident.created`) | Selected category and subcategory codes (`taxonomy.category_code`, `taxonomy.subcategory_code`) validated against the active list (`taxonomy.active_version`) | Record persisted with validated classification; invalid selections rejected (`taxonomy.validation_passed` / `taxonomy.validation_rejected`) | At record creation (real-time validation) |
  | Annual review cycle or new product / business line added (`taxonomy.review_due`, `product.line_added`) | Current taxonomy (`taxonomy.active_version`), proposed additions or retirements (`taxonomy.change_request`) | Updated canonical taxonomy version with change log (`taxonomy.version_published`) | Annually, or before the new product/line books its first risk record (internal: 30 days from trigger; enforced by `taxonomy.review_due_at`) |

- **ALERTS/METRICS:** Percentage of risk, KRI, and incident records carrying valid taxonomy codes (target 100%); count of rejected free-text or invalid category submissions; days since last taxonomy review (alert at >365).

## ERM-03 — Risk Scoring Matrix & Rating Scale {#erm-03-risk-scoring-matrix-and-rating-scale}

- **WHY (Reg cite):** Comparable risk measurement across the enterprise is core to the measurement-and-monitoring expectations of [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and NCUA's ERM guidance; where the scale supports model-based assessments, its governance follows the standards of [Federal Reserve SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm) as applied through the Model Risk Management Program.
- **SYSTEM BEHAVIOR:** The GRC system implements a single 5×5 likelihood-versus-impact matrix producing numeric scores 1–25 mapped to qualitative bands (Very Low, Low, Moderate, High, Very High), and enforces its use for every enterprise risk assessment. A risk may use an alternative scale only under a CRO-granted exemption recorded against the risk; absent an exemption, non-conforming scores are rejected. The scale definition (anchors, band boundaries, scoring guidance) is write-restricted to the CCO and reviewed at least every three years or upon a major change to the business or the matrix itself. Rescoring after a scale change preserves the prior score and scale version so rating trends stay interpretable.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk assessment scored or rescored (`risk.assessment_scored`) | Likelihood rating (`risk.likelihood_score`), impact rating (`risk.impact_score`), scale version (`risk_scale.version`), CRO exemption reference if applicable (`risk_scale.exemption_id`) | Composite score 1–25 and qualitative band stored on the risk (`risk.rating_recorded`) | At assessment (real-time validation against `risk_scale.version`) |
  | Triennial review cycle or major change (`risk_scale.review_due`) | Current scale definition (`risk_scale.definition`), usage statistics (`risk_scale.usage_stats`) | Reviewed or revised scale version with approval record (`risk_scale.version_published`) | Every 3 years or on major change (internal: review complete within 90 days of trigger; enforced by `risk_scale.review_due_at`) |
  | CRO exemption from the standard scale granted (`risk_scale.exemption_granted`) | Justification (`risk_scale.exemption_rationale`), alternative methodology (`risk_scale.alternative_method`), affected risks (`risk.id[]`) | Exemption record bound to the affected risks (`risk_scale.exemption_recorded`) | Before any non-standard score is accepted (—) |

- **ALERTS/METRICS:** Percentage of enterprise assessments scored on the standard 5×5 scale (target 100% excluding recorded exemptions); count of active CRO exemptions (reported to the Management Risk Committee); days since last scale review (alert at >1,095).

## ERM-04 — Risk Assessment & Register Maintenance {#erm-04-risk-assessment-and-register-maintenance}

- **WHY (Reg cite):** Maintaining a current inventory of material risks with ratings, controls, and owners operationalizes the identify-measure-monitor-control expectations of [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) and the risk-register practices NCUA's Examiner's Guide describes as a basic ERM component.
- **SYSTEM BEHAVIOR:** The GRC system maintains the centralized enterprise risk register holding all material risks with inherent and residual ratings, linked controls, named owners, and lifecycle states (draft, active, monitoring, accepted, closed). Reassessment timers are set by residual rating: High/Very High at least quarterly, Moderate at least annually, Low/Very Low every two years or on trigger events (incident, breach, material change). The system flags any risk with no assigned owner and any risk whose reassessment is overdue; flagged risks appear on the management report until cured. Register entries are editable by first-line risk owners for their own risks; rating overrides and lifecycle transitions to closed are write-restricted to the second line (Risk/Compliance).

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New material risk identified (`risk.created`) | Risk description (`risk.description`), taxonomy codes (`taxonomy.category_code`, `taxonomy.subcategory_code`), owner (`risk.owner_id`), inherent rating (`risk.inherent_rating`), linked controls (`risk.control_ids[]`) | Register entry in active state with reassessment schedule (`risk.registered`) | Internal: 10 business days from identification (—) |
  | Reassessment timer elapses for a risk (`risk.reassessment_due`) | Current residual rating (`risk.residual_rating`), control effectiveness inputs (`risk.control_ids[]`), latest KRI readings (`kri.latest_values[]`) | Updated assessment with refreshed residual rating (`risk.reassessed`) | Quarterly (High/Very High), annually (Moderate), 2 years (Low/Very Low); enforced by `risk.reassessment_due_at` |
  | Risk found with no owner or overdue review (`risk.ownership_gap_detected`, `risk.review_overdue`) | Risk identifier (`risk.id`), last assessment date (`risk.last_assessed_at`), owner field (`risk.owner_id`) | Exception flag routed to second line and shown on management report (`risk.exception_flagged`) | Flag raised same day the gap is detected; cure tracked through the next monthly report (—) |

- **ALERTS/METRICS:** Count of risks with no owner (target zero); count of overdue reassessments by rating band (target zero for High/Very High); register completeness — percentage of active risks with rating, owner, and linked controls populated (target 100%); aging distribution of reassessments.

## ERM-05 — Key Risk Indicators & Thresholds {#erm-05-key-risk-indicators-and-thresholds}

- **WHY (Reg cite):** Forward-looking monitoring against defined tolerances implements the ongoing-monitoring expectation of [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and the KRI practices in NCUA's ERM guidance, which expect indicators tied to appetite so drift is visible before limits are breached.
- **SYSTEM BEHAVIOR:** Each KRI is defined in the GRC system with a link to one or more register risks, green/amber/red thresholds aligned to the risk appetite statement, a direction of risk (whether higher or lower values are adverse), a data source, and a configured refresh frequency. The system evaluates each new observation against thresholds and records the resulting status; threshold definitions are write-restricted to the second line. When no observation arrives within 1.5× the expected refresh interval, the system flags the KRI as stale and treats stale status as an explicit reporting caveat rather than silently carrying the last value forward.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | KRI defined or thresholds revised (`kri.defined`, `kri.thresholds_updated`) | Linked risks (`kri.risk_ids[]`), green/amber/red thresholds (`kri.thresholds`), direction of risk (`kri.direction`), refresh frequency (`kri.refresh_interval`), data source (`kri.data_source`) | Active KRI definition with version history (`kri.version_published`) | Before first observation is accepted (—) |
  | New observation received at the configured frequency (`kri.observation_received`) | Observed value (`kri.value`), observation timestamp (`kri.observed_at`), thresholds (`kri.thresholds`) | Threshold status (green/amber/red) recorded; red status feeds breach detection in [ERM-06](#erm-06-risk-appetite-breach-escalation-and-incident-management) (`kri.status_evaluated`) | At configured refresh frequency per `kri.refresh_interval` |
  | No observation within 1.5× expected interval (`kri.data_stale`) | Expected interval (`kri.refresh_interval`), last observation timestamp (`kri.observed_at`) | Stale-data flag on the KRI and a caveat on dependent reports (`kri.stale_flagged`) | At 1.5× the expected interval (enforced by `kri.staleness_check_at`) |

- **ALERTS/METRICS:** Count of KRIs in red status (each must map to a breach record or documented rationale); count of stale KRIs (target zero); percentage of KRIs with appetite-aligned thresholds and a named data source (target 100%); refresh-latency distribution by KRI.

## ERM-06 — Risk Appetite Breach Escalation & Incident Management {#erm-06-risk-appetite-breach-escalation-and-incident-management}

- **WHY (Reg cite):** Timely escalation of positions outside approved tolerance is central to the monitoring-and-control expectations of [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and [Appendix A to Part 741](https://www.law.cornell.edu/cfr/text/12/appendix-A_to_part_741), and to NCUA's ERM guidance that the Board be informed of appetite breaches and their remediation on a defined cadence.
- **SYSTEM BEHAVIOR:** When a position moves outside appetite — detected from a red KRI, a register reassessment, or manual identification — the system generates a breach record with an assigned severity (Minor, Moderate, Major, Critical) and starts the escalation workflow. For Major and Critical breaches, initial triage and CRO notification complete within 1 business day and the breach is presented to the appropriate committee within 30 calendar days; Minor and Moderate breaches follow the management-report cycle. Every open breach carries a remediation plan with owner and target date and is reviewed at least monthly until closure; closure requires second-line confirmation that the position is back within appetite or that an acceptance under [ERM-07](#erm-07-risk-acceptance-and-exceptions) has been approved. Severity assignment and closure are write-restricted to the second line.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Position outside appetite detected (`risk_breach.detected`) | Source signal (`kri.status_evaluated` red, `risk.reassessed`, or manual report), affected appetite setting (`risk_appetite.category_settings[]`), magnitude of excursion (`risk_breach.excursion_size`) | Breach record opened with severity (`risk_breach.opened`) | Record created same day as detection (—) |
  | Major/Critical breach opened (`risk_breach.opened` with severity Major or Critical) | Breach record (`risk_breach.id`), severity (`risk_breach.severity`), preliminary impact assessment (`risk_breach.impact_summary`) | Triage outcome and CRO notification (`risk_breach.cro_notified`) | 1 business day (enforced by `risk_breach.triage_due_at`) |
  | Major/Critical breach awaiting committee presentation (`risk_breach.committee_presentation_due`) | Breach summary (`risk_breach.impact_summary`), remediation plan (`risk_breach.remediation_plan`) | Committee presentation record with minutes reference (`risk_breach.committee_presented`) | 30 calendar days from breach opening (enforced by `risk_breach.committee_due_at`) |
  | Monthly review timer for any open breach (`risk_breach.review_due`) | Remediation status (`risk_breach.remediation_status`), current position vs. appetite (`risk_breach.current_excursion`) | Status update on the breach record (`risk_breach.status_reviewed`); closure recorded when cured (`risk_breach.closed`) | Monthly until closure (enforced by `risk_breach.review_due_at`) |

- **ALERTS/METRICS:** Time from detection to CRO notification for Major/Critical breaches (target ≤1 business day, alert on miss); count of breaches past the 30-day committee deadline (target zero); count and aging of open breaches by severity; breaches reopened after closure (target zero).

## ERM-07 — Risk Acceptance & Exceptions {#erm-07-risk-acceptance-and-exceptions}

- **WHY (Reg cite):** A documented, time-bounded acceptance process keeps deliberate out-of-appetite positions inside the governance perimeter required by [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) safety-and-soundness expectations; it mirrors the exceptions discipline of [Federal Reserve SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm) as adopted in the Credit Union's Model Risk Management Program.
- **SYSTEM BEHAVIOR:** The GRC system provides a structured risk acceptance workflow: each request records the requesting owner, rationale, compensating controls, the approving authority, and a mandatory expiry date — the system rejects acceptances without one, so no acceptance is indefinite. Requests are decided within 30 calendar days; approval authority follows severity (CRO decision for Major/Critical-related acceptances, with Management Risk Committee ratification per its charter). The system issues expiry alerts 30 and 7 days before lapse; an acceptance that lapses without renewal automatically reverts the underlying position to breach status under [ERM-06](#erm-06-risk-appetite-breach-escalation-and-incident-management). Approval and renewal actions are write-restricted to the designated approver roles.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Acceptance request submitted (`risk_acceptance.requested`) | Linked risk or breach (`risk.id` / `risk_breach.id`), rationale (`risk_acceptance.rationale`), compensating controls (`risk_acceptance.compensating_controls[]`), proposed expiry (`risk_acceptance.expiry_date`) | Decision recorded — approved with approver identity or declined with reason (`risk_acceptance.decided`) | 30 calendar days (internal: 15 BD; enforced by `risk_acceptance.decision_due_at`) |
  | Expiry approaching (`risk_acceptance.expiry_warning`) | Acceptance record (`risk_acceptance.id`), expiry date (`risk_acceptance.expiry_date`), owner (`risk_acceptance.owner_id`) | Expiry alerts to owner and approver (`risk_acceptance.expiry_alerted`) | 30 days and 7 days before expiry (enforced by `risk_acceptance.expiry_alert_at`) |
  | Acceptance lapses without renewal (`risk_acceptance.expired`) | Acceptance record (`risk_acceptance.id`), linked risk position (`risk.id`) | Underlying position reverted to breach status (`risk_breach.opened` with origin `acceptance_lapsed`) | Immediately at expiry (enforced by `risk_acceptance.expiry_date`) |

- **ALERTS/METRICS:** Count of acceptance requests pending past 30 days (target zero); count of active acceptances without documented compensating controls (target zero); count of lapsed acceptances reverted to breach in the period; distribution of acceptance durations, flagging renewals of long-running acceptances for heightened scrutiny.

## ERM-08 — Risk Reporting & Governance Oversight {#erm-08-risk-reporting-and-governance-oversight}

- **WHY (Reg cite):** Regular, reconciled risk reporting to senior management and the Board implements the oversight expectations of [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3) and NCUA's ERM guidance, which holds the Board responsible for understanding aggregate risk against appetite and acting on a complete picture.
- **SYSTEM BEHAVIOR:** The GRC system generates standard management and Board reporting packages — heatmaps from register ratings, top-risk lists, breach and acceptance summaries, and KRI trends — with drill-down from any aggregate figure to its underlying records. Management reports are produced at least monthly for the Management Risk Committee; Board and Board Risk Committee reports at least quarterly. Before release, conflicting figures across sources are reconciled or the discrepancy is explained in the report, and any section relying on stale or incomplete data (including stale KRIs flagged under [ERM-05](#erm-05-key-risk-indicators-and-thresholds)) carries an explicit caveat. Report template definitions are write-restricted to the second line; Internal Audit receives the same packages for third-line assessment of the Framework's effectiveness.

- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly management reporting cycle (`risk_report.management_due`) | Register snapshot (`risk.register_snapshot`), KRI statuses (`kri.status_evaluated`), open breaches (`risk_breach.id[]`), active acceptances (`risk_acceptance.id[]`) | Management risk report with drill-down and caveats (`risk_report.management_issued`) | Monthly (internal: within 10 BD of month-end; enforced by `risk_report.management_due_at`) |
  | Quarterly Board reporting cycle (`risk_report.board_due`) | Reconciled aggregate figures (`risk_report.reconciliation_record`), heatmap data (`risk.register_snapshot`), breach and acceptance summaries (`risk_breach.id[]`, `risk_acceptance.id[]`), KRI trends (`kri.trend_series[]`) | Board / Board Risk Committee report with reconciliation notes (`risk_report.board_issued`) | Quarterly, ahead of the scheduled committee meeting (enforced by `risk_report.board_due_at`) |
  | Conflicting figures detected during report assembly (`risk_report.reconciliation_break_detected`) | Conflicting source values (`risk_report.source_values[]`), responsible data owners (`risk_report.data_owner_ids[]`) | Reconciliation resolved or discrepancy explanation embedded in the report (`risk_report.reconciliation_recorded`) | Before report release (—) |

- **ALERTS/METRICS:** On-time delivery rate for management and Board reports (target 100%); count of unexplained reconciliation breaks released in a report (target zero); percentage of report sections carrying required staleness caveats when source data is flagged; drill-down availability checks on published reports.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this Framework, its annual review, and the conformance of subordinate risk appetite statements, registers, and committee charters.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Board of Directors ratification of the risk appetite statement itself is required under [ERM-01](#erm-01-enterprise-risk-appetite-statement).
- **Required participants:** Management Risk Committee (first/second-line operating forum), Board Risk Committee and Board of Directors (oversight and appetite approval), Internal Audit (third-line assessment of Framework effectiveness), aligned to the three-lines-of-defense model.
- **Review cadence:** This Framework is reviewed at least annually (next review per front-matter) and within 90 days of a material strategic change, on the same trigger discipline as [ERM-01](#erm-01-enterprise-risk-appetite-statement).
- **Cross-references:** Detailed risk-type appetite statements and limits (Interest Rate Risk, Liquidity, Credit, Operational/Technology), the Model Risk Management Program, the Liquidity Policy, the Capitalization and Basel II Standardized Approach Framework Policies, the Third-Party Risk Policy, and the Internal Controls and Audit Policies are maintained separately and must conform to this Framework.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The risk-domain resources, fields, and events referenced throughout the EVENTS tables (`risk_appetite.*`, `taxonomy.*`, `risk_scale.*`, `risk.*`, `kri.*`, `risk_breach.*`, `risk_acceptance.*`, `risk_report.*`, `strategy.material_change_declared`, `product.line_added`, `incident.created`) are not registered in `vocabulary.json` — the parsed spec is banking-core only and registers zero events. All names used are the target naming scheme and will be confirmed by engineering before the next review.
- **GRC system assumed.** PATRICK_NOTES assume a GRC/risk system capable of storing the defined fields and events. No specific platform is named; control behavior is specified platform-neutrally and implementation mapping is pending system selection or confirmation.
- **CRO role vs. CCO ownership.** PATRICK_NOTES assign CRO duties (scale exemptions in ERM-03, breach notification in ERM-06, acceptance approval in ERM-07) while governance is centralized with the Chief Compliance Officer and the sole named approver is the CCO. This Framework assumes the CCO discharges or formally delegates the CRO functions until a distinct CRO role is confirmed.
- **Breach severity scale.** The four-band severity scale (Minor, Moderate, Major, Critical) in ERM-06 is inferred from the notes' reference to Major/Critical breaches; the full scale definition and severity-assignment criteria need Management Risk Committee confirmation.
- **Acceptance approval authorities.** The mapping of acceptance approvals to the CRO and Management Risk Committee by severity in ERM-07 is an inference; the precise delegation grid lives in (and must be confirmed against) the Management Risk Committee and Board Risk Committee charters.
- **Internal SLAs are proposals.** Internal targets not stated in PATRICK_NOTES (10 business days to register a new risk, 15-business-day internal acceptance-decision target, 60-day appetite re-review draft, 10 business days for the monthly management report) are minimal viable proposals pending Management Risk Committee adoption.
- **NCUA guidance is a non-binding benchmark.** The NCUA Examiner's Guide ERM sections and the NCUA Enterprise Risk Appetite Statement are supervisory expectations and structuring benchmarks rather than codified rules; the binding anchors are 12 CFR §741.3 and Appendix A to Part 741.
- **Interest-rate-risk policy linkage.** Appendix A to Part 741's specific interest-rate-risk policy/program requirements are satisfied by the separately maintained risk-type policies (out of scope here); this Framework only requires their conformance to its appetite, scoring, and escalation mechanics.
- **Lifecycle states are provisional.** The register lifecycle states in ERM-04 (draft, active, monitoring, accepted, closed) are a minimal viable set; the final state machine will be confirmed with the GRC system implementation.
