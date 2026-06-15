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

## General Policy Statement

Pynthia Credit Union manages risk deliberately and transparently across financial, operational, compliance, technology, model, strategic, and reputational risk types. This Framework establishes how the Credit Union expresses risk appetite, rates risks on a consistent 5x5 likelihood/impact matrix, escalates and reports breaches on time, and maintains a living risk register — all aligned to the three-lines-of-defense model and to NCUA safety-and-soundness expectations. It governs the *process* of enterprise risk management, not specific risk limits; detailed appetite statements, registers, and committee charters live in separate documents that must conform to this Framework. Specific risk-type limits (IRR, liquidity, credit, operational/technology, capital), model development/validation mechanics, and vendor oversight mechanics are out of scope and governed by their named policies.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Appetite review after material strategic change | Strategy change declared (`strategy.material_change_declared`) | 90 days | Refreshed appetite statement + version | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Appetite review reminder | 30 days before next review date (`risk_appetite.review_window_opened`) | 30 days pre-due | Review window opened | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| High/Very High residual risk reassessment | Reassessment falls due (`risk.reassessment_due_at`) | Quarterly | Updated rating + register entry | [ERM-04](#erm-04-risk-assessment-register-maintenance) |
| Major/Critical breach triage + CRO notice | Breach detected (`risk_breach.detected`) | 1 business day | Breach record + CRO notice | [ERM-06](#erm-06-risk-appetite-breach-escalation-incident-management) |
| Major/Critical breach to committee | Breach opened (`risk_breach.opened`) | 30 calendar days | Committee presentation | [ERM-06](#erm-06-risk-appetite-breach-escalation-incident-management) |
| Risk acceptance decision | Acceptance requested (`risk_acceptance.requested`) | 30 calendar days | Decision record | [ERM-07](#erm-07-risk-acceptance-exceptions) |
| Risk acceptance expiry alerts | 30 and 7 days before expiry (`risk_acceptance.expiry_alerted`) | 30 / 7 days pre-expiry | Expiry alerts | [ERM-07](#erm-07-risk-acceptance-exceptions) |
| Management risk reporting | Reporting period closes (`risk_report.management_due_at`) | Monthly | Management report + dashboards | [ERM-08](#erm-08-risk-reporting-governance-oversight) |
| Board/Board Risk Committee reporting | Quarter closes (`risk_report.board_due_at`) | Quarterly | Board report + dashboards | [ERM-08](#erm-08-risk-reporting-governance-oversight) |

## ERM-01 — Enterprise Risk Appetite Statement  {#erm-01-enterprise-risk-appetite-statement}

- **WHY (Reg cite):** NCUA safety-and-soundness expectations require written, board-approved risk policies and a managed risk program for federally insured credit unions ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)); NCUA ERM and risk-appetite guidance expect a single, authoritative articulation of how much risk the institution will accept.

- **SYSTEM BEHAVIOR:** The Credit Union maintains one authoritative enterprise risk appetite statement — a governing document plus structured per-category data — with version, effective date, expiry date, and full approval history. The system locks edits and approvals to authorized roles; appetite document and version fields are write-restricted to Compliance and approving officers. A review window opens automatically 30 days before the next review date, and any declared material strategic change opens a re-review that must complete within 90 days. The statement is reviewed at least annually regardless of strategic-change triggers.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New or revised appetite statement approved (`risk_appetite.approved`) | Appetite document (`risk_appetite.document`), effective date (`risk_appetite.effective_date`), next review date (`risk_appetite.next_review_date`), version (`risk_appetite.version`) | Published, version-stamped appetite statement (`risk_appetite.version_published`) | At adoption (internal: same day) |
  | Standard review falls due (`risk_appetite.review_window_opened`) | Current document (`risk_appetite.document`), next review date (`risk_appetite.next_review_date`) | Review window opened with reminder (`risk_appetite.review_flagged`) | Annual; reminder 30 days pre-due (enforced by `risk_appetite.review_due_at`) |
  | Material strategic change declared (`strategy.material_change_declared`) | Change summary (`strategy.change_summary`), current document (`risk_appetite.document`) | Re-review opened (`risk_appetite.rereview_opened`) | 90 days (enforced by `risk_appetite.rereview_due_at`) |

- **ALERTS/METRICS:** Alert when the appetite statement is within 30 days of review due or past due (target zero overdue); alert on any edit attempt by a non-authorized role (target zero). Track count of strategic-change-triggered re-reviews closed within 90 days.

## ERM-02 — Risk Taxonomy & Categories  {#erm-02-risk-taxonomy-categories}

- **WHY (Reg cite):** Consistent identification and classification of risk underpins the NCUA safety-and-soundness expectation that risk be identified, measured, monitored, and controlled across the institution ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The Credit Union maintains a canonical, versioned list of risk categories and subcategories (financial, operational, compliance, technology, model, strategic, reputational). Every risk, KRI, and incident record must select a category from this list; records failing validation are rejected. The active taxonomy version and category codes are write-restricted to Compliance. The taxonomy is reviewed at least annually and whenever a new product type or business line is added.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Taxonomy change proposed (`taxonomy.version_published`) | Category code (`taxonomy.category_code`), subcategory code (`taxonomy.subcategory_code`), change request (`taxonomy.change_request`) | New active taxonomy version published (`taxonomy.version_published`) | At adoption (internal: same day) |
  | Risk/KRI/incident record submitted with category (`risk.category_assigned`) | Active version (`taxonomy.active_version`), selected category (`taxonomy.category_code`) | Validation pass or rejection (`taxonomy.validation_passed` / `taxonomy.validation_rejected`) | Real-time at record save |
  | Annual or trigger review falls due (`taxonomy.validation_passed`) | Active version (`taxonomy.active_version`), new product/business-line trigger | Completed taxonomy review (`taxonomy.version_published`) | Annual or on new product/line (enforced by `taxonomy.review_due_at`) |

- **ALERTS/METRICS:** Alert on any record save rejected for an invalid or missing category (track rejection rate); alert when the taxonomy review is past due (target zero). Target: 100% of risk/KRI/incident records carry a valid taxonomy code.

## ERM-03 — Risk Scoring Matrix & Rating Scale  {#erm-03-risk-scoring-matrix-rating-scale}

- **WHY (Reg cite):** A consistent measurement method is required to monitor and control risk comparably across the institution ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)); where quantitative scoring tools inform risk decisions, model-risk governance expectations under [Federal Reserve SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm) apply as a benchmark.

- **SYSTEM BEHAVIOR:** The system implements a 5x5 likelihood-vs-impact matrix producing numeric scores from 1 to 25 and qualitative bands (Very Low through Very High). Use of the scale is enforced for all enterprise assessments unless the CRO grants a documented, recorded exemption; exempted assessments must record an alternative method. Scale definitions and exemptions are write-restricted to the CRO and Compliance. The scale is reviewed at least every three years or on major change.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New or revised scale published (`risk_scale.version_published`) | Scale definition (`risk_scale.definition`) | Published scale version (`risk_scale.version_published`) | At adoption (internal: same day) |
  | Assessment scored on the matrix (`risk.assessment_completed`) | Likelihood score (`risk.likelihood_score`), impact score (`risk.impact_score`), scale definition (`risk_scale.definition`) | Recorded rating (`risk.rating_recorded`) | Real-time at scoring |
  | CRO exemption granted (`risk_scale.exemption_granted`) | Exemption rationale (`risk_scale.exemption_rationale`), alternative method (`risk_scale.alternative_method`) | Recorded exemption (`risk_scale.exemption_recorded`) | At grant (internal: same day) |
  | Scale review falls due (`risk_scale.version_published`) | Scale definition (`risk_scale.definition`), usage stats (`risk_scale.usage_stats`) | Completed scale review (`risk_scale.version_published`) | Every 3 years or on major change (enforced by `risk_scale.review_due_at`) |

- **ALERTS/METRICS:** Alert on any enterprise assessment scored off-scale without a recorded CRO exemption (target zero); alert when the scale review is past due. Track exemption count and the share of assessments using the standard matrix (target near 100%).

## ERM-04 — Risk Assessment & Register Maintenance  {#erm-04-risk-assessment-register-maintenance}

- **WHY (Reg cite):** Maintaining a centralized inventory of material risks, ratings, controls, and owners operationalizes the NCUA expectation to identify, measure, monitor, and control risk ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The Credit Union maintains a centralized enterprise risk register holding all material risks with inherent and residual ratings, mapped controls, and named owners, and supporting lifecycle states. Reassessment cadence is driven by residual rating: High/Very High at least quarterly, Moderate at least annually, and Low/Very Low every two years or on a trigger event. The system flags any risk with no owner and any risk past its review-due date. Register entries and ratings are write-restricted to risk owners and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk created or registered (`risk.created`) | Risk description (`risk.description`), category (`risk.category_assigned`), owner (`risk.owner_id`), inherent rating (`risk.inherent_rating`) | Register entry created (`risk.catalog_entry_created`) | At identification (internal: 5 BD) |
  | Reassessment falls due by residual band (`risk.reassessment_due_at`) | Residual rating (`risk.residual_rating`), last assessed date (`risk.last_assessed_at`), controls/assessment results (`risk.assessment_results`) | Recorded reassessment (`risk.assessment_completed`) | Quarterly/Annual/2-year by band (enforced by `risk.reassessment_due_at`) |
  | Owner missing on a register entry (`risk.ownership_gap_detected`) | Risk identifier (`risk.id`), owner field (`risk.owner_id`) | Ownership-gap flag (`risk.ownership_gap_detected`) | Real-time on detection |
  | Review date passes with no reassessment (`risk.review_overdue`) | Last assessed date (`risk.last_assessed_at`), residual rating (`risk.residual_rating`) | Overdue-review flag (`risk.exception_flagged`) | Real-time on overdue (enforced by `risk.reassessment_due_at`) |

- **ALERTS/METRICS:** Aging alert on overdue reassessments by residual band (target zero overdue High/Very High); alert on any unowned risk (target zero). Track register completeness (% with owner, control, current rating).

## ERM-05 — Key Risk Indicators & Thresholds  {#erm-05-key-risk-indicators-thresholds}

- **WHY (Reg cite):** Forward-looking monitoring through indicators tied to appetite supports the NCUA expectation to monitor and control risk on an ongoing basis ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** KRIs are defined and linked to risks, each with green/amber/red thresholds aligned to appetite and a stated direction of risk. KRIs refresh at their configured frequency; the system flags data as stale when no update is received within 1.5x the expected refresh interval. KRI definitions and thresholds are write-restricted to risk owners and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | KRI defined or thresholds set (`kri.created`) | Thresholds (`kri.thresholds`), refresh interval (`kri.refresh_interval`), direction (`kri.direction`), linked data source (`kri.data_source`) | Published KRI version (`kri.version_published`) | At definition (internal: same day) |
  | KRI observation received (`kri.observation_received`) | Observed value (`kri.value`), observed timestamp (`kri.observed_at`), thresholds (`kri.thresholds`) | Status evaluation (`kri.thresholds_updated`) | At configured refresh frequency |
  | No update within 1.5x expected interval (`kri.stale_flagged`) | Refresh interval (`kri.refresh_interval`), staleness check timestamp (`kri.staleness_check_at`), data-stale flag (`kri.data_stale`) | Stale-data flag (`kri.stale_flagged`) | At 1.5x refresh interval |

- **ALERTS/METRICS:** Alert on any red-band KRI and on stale KRI data (target zero stale beyond 1.5x interval); track distribution of KRIs by band and the share of KRIs refreshing on schedule.

## ERM-06 — Risk Appetite Breach Escalation & Incident Management  {#erm-06-risk-appetite-breach-escalation-incident-management}

- **WHY (Reg cite):** Timely escalation and remediation of positions outside appetite is core to the NCUA expectation to control risk and to board oversight of significant risk ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The system detects positions outside appetite, opens a breach record with a severity, and runs an escalation workflow with remediation tracking. For Major/Critical breaches, initial triage and CRO notification complete within one business day, and the breach is presented to the appropriate committee within 30 calendar days; breach status is reviewed at least monthly until closure. Breach severity assignment and closure are write-restricted to Compliance and the CRO.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Position outside appetite detected (`risk_breach.detected`) | Excursion size (`risk_breach.excursion_size`), severity (`risk_breach.severity`), linked risk (`risk.id`) | Breach record opened (`risk_breach.opened`) | At detection (internal: same day) |
  | Major/Critical breach opened (`risk_breach.opened`) | Severity (`risk_breach.severity`), breach owner (`breach.owner`), impact summary (`risk_breach.impact_summary`) | CRO notification + triage record (`risk_breach.cro_notified`) | 1 business day (enforced by `risk_breach.triage_due_at`) |
  | Breach due for committee presentation (`risk_breach.committee_due_at`) | Breach record (`risk_breach.id`), remediation plan (`risk_breach.remediation_plan`) | Committee presentation (`risk_breach.committee_presented`) | 30 calendar days (enforced by `risk_breach.committee_due_at`) |
  | Monthly status review falls due (`risk_breach.review_due_at`) | Remediation status (`risk_breach.remediation_status`), current excursion (`risk_breach.current_excursion`) | Recorded status review (`risk_breach.status_reviewed`) | Monthly until closure (enforced by `risk_breach.review_due_at`) |

- **ALERTS/METRICS:** Aging alert on Major/Critical breaches without CRO notice inside 1 BD or committee presentation inside 30 days (target zero late); track open breaches by severity and median time to closure.

## ERM-07 — Risk Acceptance & Exceptions  {#erm-07-risk-acceptance-exceptions}

- **WHY (Reg cite):** A controlled, time-bounded exception process with documented rationale and accountability supports the NCUA expectation that residual risk be consciously accepted, monitored, and controlled ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The Credit Union provides a structured risk acceptance workflow that records approver, rationale, compensating controls, and a mandatory expiry date — no indefinite acceptances are permitted. Requests are decided within 30 calendar days. The system issues expiry alerts 30 and 7 days before the expiry date; a lapsed acceptance reverts the underlying position to breach status. Acceptance decisions and expiry dates are write-restricted to the approving authority and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Acceptance requested (`risk_acceptance.requested`) | Rationale (`risk_acceptance.rationale`), compensating controls (`exception.risk_acceptance`), expiry date (`risk_acceptance.expiry_date`), owner (`risk_acceptance.owner_id`) | Decision record (`risk_acceptance.decided`) | 30 calendar days (enforced by `risk_acceptance.decision_due_at`) |
  | Expiry approaching (`risk_acceptance.expiry_alerted`) | Expiry date (`risk_acceptance.expiry_date`), expiry alert timestamp (`risk_acceptance.expiry_alert_at`) | Expiry alerts at 30 and 7 days (`risk_acceptance.expiry_warning`) | 30 and 7 days pre-expiry (enforced by `risk_acceptance.expiry_date`) |
  | Acceptance lapses unrenewed (`risk_acceptance.expired`) | Expiry date (`risk_acceptance.expiry_date`), linked risk (`risk.id`) | Reversion to breach (`risk_breach.opened`) | At expiry (enforced by `risk_acceptance.expiry_date`) |

- **ALERTS/METRICS:** Alert on acceptance requests undecided past 30 days, on any acceptance lacking an expiry date (target zero), and on lapsed acceptances reverting to breach; track active acceptances by expiry month.

## ERM-08 — Risk Reporting & Governance Oversight  {#erm-08-risk-reporting-governance-oversight}

- **WHY (Reg cite):** Regular, reconciled reporting of significant risk to senior management and the board is a core NCUA safety-and-soundness and governance expectation ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The system generates standard management and Board/Board Risk Committee reports and dashboards — heatmaps, top risks, breach and acceptance summaries, and KRI trends — with drill-down. Management reports are delivered at least monthly and Board/Board Risk Committee reports at least quarterly. Conflicting figures are reconciled or explained, and incomplete data is caveated before release. Report generation and the reconciliation record are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Management reporting period closes (`risk_report.management_due_at`) | Register snapshot (`risk.register_snapshot`), KRI trends (`kri.value`), breach/acceptance summaries (`risk_breach.id`, `risk_acceptance.id`) | Management report + dashboards issued (`risk_report.management_issued`) | Monthly (enforced by `risk_report.management_due_at`) |
  | Quarter closes for Board reporting (`risk_report.board_due_at`) | Register snapshot (`risk.register_snapshot`), heatmap/top-risk data, breach and acceptance summaries (`risk_breach.id`, `risk_acceptance.id`) | Board/BRC report + dashboards issued (`risk_report.board_issued`) | Quarterly (enforced by `risk_report.board_due_at`) |
  | Conflicting figures detected during assembly (`risk_report.reconciliation_break_detected`) | Reconciliation record (`risk_report.reconciliation_record`), source figures | Recorded reconciliation/caveat (`risk_report.reconciliation_recorded`) | Before report release (internal: same cycle) |

- **ALERTS/METRICS:** Alert when a management or Board report is past its delivery date (target zero late) and on any unreconciled figure at release time; track on-time delivery rate and count of caveated/incomplete-data sections per cycle.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. Centralized accountability for this Framework and its controls rests with the CCO.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer. Required participants in the governance of these controls are the Management Risk Committee, Board Risk Committee, Board of Directors, and Internal Audit, aligned to the three-lines-of-defense model.
- **Three lines of defense:** First line (business/risk owners) identifies and rates risks and owns remediation; second line (Risk/Compliance) maintains the Framework, scale, taxonomy, and reporting and challenges ratings; third line (Internal Audit) independently tests the Framework's effectiveness.
- **Review cadence:** This Framework is reviewed at least annually (`governance.policy_review_due`) and on material change; the embedded appetite, scale, and taxonomy controls carry their own cadences as specified in [ERM-01](#erm-01-enterprise-risk-appetite-statement), [ERM-03](#erm-03-risk-scoring-matrix-rating-scale), and [ERM-02](#erm-02-risk-taxonomy-categories).
- **Cross-refs:** Detailed risk-type appetite/limits, the Model Risk Management Program, Liquidity Policy, Capitalization/Basel frameworks, Third-Party Risk Policy, and Internal Controls/Audit policies are out of scope here and must conform to this Framework.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several field, event, and timer codes referenced in the control overlays are drawn from the registered Cassandra Banking Core vocabulary and the agreed provisional-codes list, but some are coined by composition under the grammar (registered subject + registered verb/task type) because no exact registered code exists — notably `strategy.material_change_declared`, `taxonomy.version_published` / `taxonomy.validation_passed` / `taxonomy.validation_rejected`, `risk.category_assigned`, `risk.reassessment_due_at`, `kri.thresholds_updated` (used here as the KRI status-evaluation signal), and `risk_breach.impact_summary`. The provisional spellings used (e.g., `risk.description`, `risk.owner_id`, `risk.id`, `risk_breach.id`, `risk_breach.severity`, `risk_acceptance.id`, `risk_acceptance.owner_id`, `risk_appetite.version`, `risk_scale.version`, `taxonomy.*`, `kri.direction`, `strategy.change_summary`) follow the agreed target naming and will be confirmed by engineering before the next review.
- **Charter type and NCUA applicability.** Pynthia Credit Union is treated as a federally insured credit union, so 12 CFR Part 741 (including Appendix A) and NCUA ERM/risk-appetite guidance are the anchoring authorities. If the charter is state-chartered/privately insured, the applicable state safety-and-soundness regime must be substituted; this needs confirmation.
- **Model-risk benchmark scope.** SR 11-7 is cited in [ERM-03](#erm-03-risk-scoring-matrix-rating-scale) only as a structuring benchmark for quantitative scoring tools. Model development, validation, and governance mechanics are out of scope and live in the Model Risk Management Program; this Framework assumes that program governs any model used to generate enterprise risk scores.
- **Severity and band definitions are external.** The specific numeric-to-band mapping of the 5x5 matrix, the Major/Critical breach severity thresholds, and the residual-band reassessment cadences are assumed to be defined in the appetite statement, scale definition, and committee charters that conform to this Framework; this Framework specifies only the process and minimum cadences.
- **Reporting recipients and dashboard contents.** The exact distribution lists and dashboard panels (heatmaps, top-N risks, KRI trend windows) for management vs. Board reporting are assumed to be configured operationally and confirmed by the Management Risk Committee and Board Risk Committee.
