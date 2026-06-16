---
title: Enterprise Risk Management Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Enterprise Risk Management, Risk Appetite, KRI, Risk Register, Governance]
---

## General Policy Statement

Pynthia Credit Union manages risk deliberately and transparently across financial, operational, compliance, technology, model, strategic, and reputational risk types, operating through the three lines of defense and centralized under the Chief Compliance Officer. This Framework establishes how the Credit Union expresses risk appetite, scores risks on a consistent 5×5 likelihood/impact matrix, maintains a living risk register, defines key risk indicators, escalates and reports breaches on time, and reconciles a complete picture for the Board. It does not enumerate specific risks or limits — those live in separate risk appetite statements, registers, and committee charters that must conform to this Framework — and it expressly excludes model development/validation mechanics (Model Risk Management Program), liquidity/ALM limits (Liquidity Policy), capital adequacy (Capitalization/Basel Framework Policies), vendor mechanics (Third-Party Risk Policy), and internal control testing detail (Internal Controls and Audit Policies).

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Risk appetite statement review | Review window opens 30 days before next review date (`risk_appetite.review_window_opened`) | At least annually; within 90 days of material strategic change | Appetite document + per-category structured data | [ERM-01](#erm-01-enterprise-risk-appetite-statement) |
| Risk taxonomy review | Annual cycle or new product/business line added (`taxonomy.version_published`) | At least annually | Canonical category/subcategory list | [ERM-02](#erm-02-risk-taxonomy-categories) |
| Scoring scale review | Triennial cycle or major change (`risk_scale.version_published`) | At least every 3 years | 5×5 matrix definition + bands | [ERM-03](#erm-03-risk-scoring-matrix-rating-scale) |
| High/Very High residual reassessment | Reassessment due (`risk.reassessment_due_at`) | Quarterly (High/VH), annual (Moderate), 2-yr (Low/VL) | Register entry + rating | [ERM-04](#erm-04-risk-assessment-register-maintenance) |
| KRI observation refresh | Observation received or stale (`kri.observation_received`) | Configured frequency; stale at 1.5× interval | KRI value + RAG status | [ERM-05](#erm-05-key-risk-indicators-thresholds) |
| Appetite breach — Major/Critical | Position outside appetite detected (`risk_breach.detected`) | Triage + CRO notice ≤1 BD; committee ≤30 cal days | Breach record + remediation | [ERM-06](#erm-06-risk-appetite-breach-escalation-incident-management) |
| Risk acceptance request | Acceptance requested (`risk_acceptance.requested`) | Decide ≤30 cal days; alerts 30 & 7 days pre-expiry | Acceptance record + expiry | [ERM-07](#erm-07-risk-acceptance-exceptions) |
| Management & Board reporting | Reporting cycle due (`risk_report.management_due_at` / `risk_report.board_due_at`) | Management ≥ monthly; Board ≥ quarterly | Dashboards, heatmaps, summaries | [ERM-08](#erm-08-risk-reporting-governance-oversight) |

## ERM-01 — Enterprise Risk Appetite Statement  {#erm-01-enterprise-risk-appetite-statement}

- **WHY (Reg cite):** NCUA safety-and-soundness expectations require written, board-governed risk programs and a defined risk appetite ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741); [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)), supported by the NCUA ERM examiner guidance on risk appetite and risk culture.

- **SYSTEM BEHAVIOR:** The system maintains a single authoritative enterprise risk appetite statement as a versioned document plus structured per-category data, each version carrying effective and expiry dates and full approval history. A review-window timer opens 30 days before the next review date so the upcoming review surfaces in advance; review is required at least annually and within 90 days of a material strategic change, with the 90-day clock anchored to a declared strategic-change event. Appetite settings and versioning fields are write-restricted to Compliance and authorized approving roles; all other roles have read-only access.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Review window opens ahead of next review date (`risk_appetite.review_window_opened`) | Current version (`risk_appetite.version`), next review date (`risk_appetite.next_review_date`) | Open review flag (`risk_appetite.review_flagged`) | 30 days before review (enforced by `risk_appetite.review_due_at`) |
  | Material strategic change declared (`strategy.material_change_declared`) | Change summary (`strategy.change_summary`), effective date (`risk_appetite.effective_date`) | Re-review opened (`risk_appetite.rereview_opened`) | 90 days (enforced by `risk_appetite.rereview_due_at`) |
  | Appetite statement approved (`risk_appetite.approved`) | Document (`risk_appetite.document`), version (`risk_appetite.version`), effective date (`risk_appetite.effective_date`) | Published version with approval history (`risk_appetite.version_published`) | At least annually (enforced by `risk_appetite.review_due_at`) |

- **ALERTS/METRICS:** Alert when a review window is open and unresolved past the next-review date, when an active version has lapsed its expiry with no successor, or when a declared strategic change has no re-review opened within 90 days; target zero lapsed-appetite versions in production.

## ERM-02 — Risk Taxonomy & Categories  {#erm-02-risk-taxonomy-categories}

- **WHY (Reg cite):** Consistent identification, measurement, monitoring, and control of risk under NCUA safety-and-soundness expectations ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)) depends on a canonical risk classification used across all records.

- **SYSTEM BEHAVIOR:** The system maintains a versioned canonical list of risk categories and subcategories (financial, operational, compliance, technology, model, strategic, reputational) and enforces selection from the active version for every risk, KRI, and incident record; submissions citing an unregistered or retired code are rejected at validation. The taxonomy is reviewed at least annually and whenever a new product type or business line is added, the latter detected from the product line-added event. Taxonomy version and category/subcategory codes are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual taxonomy review cycle due (`taxonomy.version_published`) | Active version (`taxonomy.active_version`), proposed change (`taxonomy.change_request`) | Published taxonomy version (`taxonomy.version_published`) | At least annually (enforced by `taxonomy.review_due_at`) |
  | New product line or business line added (`product.line_added`) | Category code (`taxonomy.category_code`), subcategory code (`taxonomy.subcategory_code`) | Validation pass/reject (`taxonomy.validation_passed` / `taxonomy.validation_rejected`) | On addition (internal: 10 BD) |
  | Risk/KRI/incident category selected (`risk.category_assigned`) | Category code (`taxonomy.category_code`), risk id (`risk.id`) | Category assignment recorded (`risk.category_assigned`) | At record creation (—) |

- **ALERTS/METRICS:** Alert on any record submitted with an unmatched category code and on taxonomy reviews aging past the annual due date; target zero unmatched category codes and zero overdue taxonomy reviews.

## ERM-03 — Risk Scoring Matrix & Rating Scale  {#erm-03-risk-scoring-matrix-rating-scale}

- **WHY (Reg cite):** Comparable, defensible risk measurement supports the NCUA ERM expectation that risks be scored consistently across the enterprise ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)), and quantitative scoring methods drawn from model-based tools align to model-risk governance expectations ([SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm)).

- **SYSTEM BEHAVIOR:** The system implements a 5×5 likelihood-vs-impact matrix producing a numeric score (1–25) and a qualitative band (Very Low through Very High), and enforces its use for all enterprise risk assessments. An assessment may use an alternative method only where the CRO has granted a recorded exemption; absent an exemption the standard scale is mandatory and non-conforming scores are blocked. The scale is reviewed at least every three years or on major change. The scale definition and exemption grants are write-restricted to Compliance and the CRO.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Scoring scale review cycle due (`risk_scale.version_published`) | Scale definition (`risk_scale.definition`), version (`risk_scale.version`) | Published scale version (`risk_scale.version_published`) | At least every 3 years (enforced by `risk_scale.review_due_at`) |
  | Assessment scored on the matrix (`risk.rating_recorded`) | Likelihood (`risk.likelihood_score`), impact (`risk.impact_score`), inherent/residual rating (`risk.inherent_rating`, `risk.residual_rating`) | Rating recorded (`risk.rating_recorded`) | At assessment (—) |
  | CRO exemption granted for alternative method (`risk_scale.exemption_granted`) | Alternative method (`risk_scale.alternative_method`), rationale (`risk_scale.exemption_rationale`) | Exemption recorded (`risk_scale.exemption_recorded`) | Per request (internal: 5 BD) |

- **ALERTS/METRICS:** Alert when an assessment is scored outside the 1–25 range without a logged CRO exemption and when the scale review ages past its triennial due date; track the count of active scale exemptions and target zero overdue scale reviews.

## ERM-04 — Risk Assessment & Register Maintenance  {#erm-04-risk-assessment-register-maintenance}

- **WHY (Reg cite):** A centralized register supporting ongoing identification, measurement, monitoring, and control of all material risk is the core NCUA safety-and-soundness expectation ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741); [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

- **SYSTEM BEHAVIOR:** The system maintains a centralized enterprise risk register holding all material risks with ratings, controls, and owners, and supports lifecycle states for each entry. Reassessment cadence is enforced by rating: High and Very High residual risks at least quarterly, Moderate at least annually, and Low/Very Low every two years or on a trigger event. The system flags any risk with no assigned owner and any risk whose reassessment is overdue. Register entries, ratings, and ownership assignments are write-restricted to Compliance and assigned risk owners (1st line) under 2nd-line oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk reassessment due by rating tier (`risk.reassessment_due_at`) | Risk id (`risk.id`), residual rating (`risk.residual_rating`), last assessed (`risk.last_assessed_at`) | Reassessment completed + rating recorded (`risk.assessment_completed`) | Quarterly/annual/2-yr by tier (enforced by `risk.reassessment_due_at`) |
  | Risk registered or updated in register (`risk.created`) | Description (`risk.description`), owner (`risk.owner_id`), inherent/residual rating (`risk.inherent_rating`, `risk.residual_rating`) | Register snapshot updated (`risk.assessment_published`) | At creation/update (—) |
  | Ownership gap or overdue review detected (`risk.ownership_gap_detected`) | Risk id (`risk.id`), owner (`risk.owner_id`), review-overdue flag (`risk.review_overdue`) | Exception flagged (`risk.exception_flagged`) | On detection (internal: 5 BD to assign owner) |

- **ALERTS/METRICS:** Aging alerts on risks past their reassessment due date and on ownerless register entries; target zero ownerless material risks and zero High/Very High risks overdue for quarterly reassessment.

## ERM-05 — Key Risk Indicators & Thresholds  {#erm-05-key-risk-indicators-thresholds}

- **WHY (Reg cite):** Monitoring of risk against appetite via measurable indicators supports the NCUA ERM monitoring-and-control expectation ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The system defines KRIs linked to specific risks, each carrying green/amber/red thresholds aligned to appetite and a recorded direction of risk; observed values are evaluated against thresholds on receipt. KRIs refresh at their configured frequency, and the system flags data as stale when no update is received within 1.5× the expected refresh interval. KRI definitions and threshold sets are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | KRI defined or thresholds updated (`kri.created`) | Definition (`kri.defined`), thresholds (`kri.thresholds`), direction (`kri.direction`), refresh interval (`kri.refresh_interval`) | KRI version published (`kri.version_published`) | At definition (—) |
  | KRI observation received (`kri.observation_received`) | Value (`kri.value`), data source (`kri.data_source`), observed timestamp (`kri.observed_at`) | RAG status evaluated (`kri.thresholds_updated`) | At configured frequency (—) |
  | No update within 1.5× expected interval (`kri.stale_flagged`) | Refresh interval (`kri.refresh_interval`), staleness checkpoint (`kri.staleness_check_at`), stale flag (`kri.data_stale`) | Stale-data flag raised (`kri.stale_flagged`) | 1.5× refresh interval (enforced by `kri.staleness_check_at`) |

- **ALERTS/METRICS:** Alert on red-band KRIs, on KRIs flagged stale beyond 1.5× their interval, and on KRIs lacking thresholds or a direction; track the share of KRIs reporting on time and target zero red KRIs without a linked breach or remediation.

## ERM-06 — Risk Appetite Breach Escalation & Incident Management  {#erm-06-risk-appetite-breach-escalation-incident-management}

- **WHY (Reg cite):** Timely escalation and remediation of positions outside appetite is central to the NCUA monitoring-and-control expectation ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741); [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

- **SYSTEM BEHAVIOR:** When a position falls outside appetite the system detects the breach, generates a breach record with assigned severity, and drives it through an escalation workflow with tracked remediation. For Major and Critical breaches the system enforces initial triage and CRO notification within one business day and presentation to the appropriate committee within 30 calendar days; breach status is reviewed at least monthly until closure. Breach severity assignment and closure are write-restricted to Compliance and the CRO.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Position outside appetite detected (`risk_breach.detected`) | Excursion size (`risk_breach.excursion_size`), severity (`risk_breach.severity`), impact summary (`risk_breach.impact_summary`) | Breach record opened (`risk_breach.opened`) | Immediate (internal: same day) |
  | Major/Critical breach triaged and CRO notified (`risk_breach.cro_notified`) | Severity (`risk_breach.severity`), triage findings (`risk_breach.triage_due_at`) | Triage + CRO notification logged (`risk_breach.cro_notified`) | 1 business day (enforced by `risk_breach.triage_due_at`) |
  | Breach presented to committee (`risk_breach.committee_presented`) | Remediation plan (`risk_breach.remediation_plan`), status (`risk_breach.remediation_status`) | Committee presentation logged (`risk_breach.committee_presented`) | 30 calendar days (enforced by `risk_breach.committee_due_at`) |
  | Monthly breach status review until closure (`risk_breach.status_reviewed`) | Breach id (`risk_breach.id`), remediation status (`risk_breach.remediation_status`) | Status review recorded; closure on completion (`risk_breach.status_reviewed` / `risk_breach.closed`) | At least monthly (enforced by `risk_breach.review_due_at`) |

- **ALERTS/METRICS:** Alert on Major/Critical breaches lacking CRO notification within 1 business day, on breaches past the 30-day committee deadline, and on open breaches with no monthly review; target zero overdue Major/Critical escalations.

## ERM-07 — Risk Acceptance & Exceptions  {#erm-07-risk-acceptance-exceptions}

- **WHY (Reg cite):** Structured, time-bounded risk acceptance with documented rationale and compensating controls supports disciplined control of risk under NCUA safety-and-soundness expectations ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741)).

- **SYSTEM BEHAVIOR:** The system provides a structured risk acceptance workflow that records the approver, rationale, compensating controls, and a mandatory expiry date — indefinite acceptances are not permitted and cannot be saved without an expiry. Requests are decided within 30 calendar days, and the system issues expiry alerts 30 and 7 days before expiry; a lapsed acceptance automatically reverts the underlying position to breach status under [ERM-06](#erm-06-risk-appetite-breach-escalation-incident-management). Acceptance decisions are write-restricted to Compliance and the designated approving authority.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Risk acceptance requested (`risk_acceptance.requested`) | Owner (`risk_acceptance.owner_id`), rationale (`risk_acceptance.rationale`), expiry date (`risk_acceptance.expiry_date`) | Decision recorded (`risk_acceptance.decided`) | 30 calendar days (enforced by `risk_acceptance.decision_due_at`) |
  | Expiry approaching (`risk_acceptance.expiry_warning`) | Expiry date (`risk_acceptance.expiry_date`), alert timestamp (`risk_acceptance.expiry_alert_at`) | Expiry alert issued (`risk_acceptance.expiry_alerted`) | 30 and 7 days out (enforced by `risk_acceptance.expiry_alert_at`) |
  | Acceptance lapses without renewal (`risk_acceptance.expired`) | Acceptance id (`risk_acceptance.id`), expiry date (`risk_acceptance.expiry_date`) | Reversion to breach status (`risk_breach.opened`) | On expiry (enforced by `risk_acceptance.expiry_date`) |

- **ALERTS/METRICS:** Alert on acceptance requests undecided past 30 days, on acceptances within 7 days of expiry, and on any saved acceptance lacking an expiry; target zero indefinite acceptances and zero silently-lapsed acceptances.

## ERM-08 — Risk Reporting & Governance Oversight  {#erm-08-risk-reporting-governance-oversight}

- **WHY (Reg cite):** Regular, complete, reconciled risk reporting to management and the Board is required under NCUA ERM and board-oversight expectations ([12 CFR Part 741, Appendix A](https://www.ecfr.gov/current/title-12/part-741/appendix-Appendix%20A%20to%20Part%20741); [12 CFR §741.3](https://www.ecfr.gov/current/title-12/part-741/section-741.3)).

- **SYSTEM BEHAVIOR:** The system generates standard management and Board reports and dashboards — heatmaps, top risks, breach and acceptance summaries, and KRI trends — with drill-down to source records. Management reports are delivered at least monthly and Board/Board Risk Committee reports at least quarterly. Before issuance the system reconciles figures across sources and, where figures conflict, records a reconciliation break and either resolves it or attaches an explanation; reports drawing on incomplete data are caveated. Report content and reconciliation sign-off are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Management reporting cycle due (`risk_report.management_due_at`) | Register snapshot (`risk.register_snapshot`), KRI trends (`kri.trend`), breach/acceptance summaries (`risk_breach.id`, `risk_acceptance.id`) | Management report issued (`risk_report.management_issued`) | At least monthly (enforced by `risk_report.management_due_at`) |
  | Board / Board Risk Committee cycle due (`risk_report.board_due_at`) | Heatmap and top-risk inputs (`risk.register_snapshot`), reconciliation record (`risk_report.reconciliation_record`) | Board report issued (`risk_report.board_issued`) | At least quarterly (enforced by `risk_report.board_due_at`) |
  | Conflicting figures detected during reconciliation (`risk_report.reconciliation_break_detected`) | Source figures (`risk_report.reconciliation_record`) | Reconciliation recorded or explained (`risk_report.reconciliation_recorded`) | Before report issuance (—) |

- **ALERTS/METRICS:** Alert on management reports overdue past monthly cadence, Board reports overdue past quarterly cadence, and unresolved reconciliation breaks at issuance; target zero late Board reports and zero unexplained reconciliation breaks in issued reports.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this Framework and its controls.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants (three lines of defense):** Risk and control owners (1st line); Management Risk Committee and Compliance (2nd line); Internal Audit (3rd line). Board Risk Committee and Board of Directors provide oversight and receive reporting under [ERM-08](#erm-08-risk-reporting-governance-oversight).
- **Review cadence:** This Framework is reviewed at least annually (next review per front-matter) and on material change, consistent with the appetite-review discipline in [ERM-01](#erm-01-enterprise-risk-appetite-statement).
- **Cross-references:** Detailed appetite statements and risk-type limits, the Model Risk Management Program, Liquidity Policy, Capitalization and Basel II Standardized Approach Framework Policies, Third-Party Risk Policy, and Internal Controls and Audit Policies — each must conform to this Framework.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The ERM-side resources, fields, events, and timers referenced in the EVENTS tables throughout this document map to the registered Cassandra Banking Core vocabulary (`risk`, `risk_appetite`, `risk_scale`, `taxonomy`, `kri`, `risk_breach`, `risk_acceptance`, `risk_report`, and their registered `*_due_at` timers). Codes are the target naming scheme and will be confirmed by engineering before the next review.
- **Composed code.** `strategy.material_change_declared` is composed from the registered subject `strategy` and registered verb `declared` to express the 90-day material-strategic-change trigger in [ERM-01](#erm-01-enterprise-risk-appetite-statement); engineering to confirm registration.
- **New-product taxonomy trigger.** [ERM-02](#erm-02-risk-taxonomy-categories) uses `product.line_added` as the "new product type or business line" trigger; confirm this is the canonical signal for new business lines (as opposed to product variants) feeding taxonomy review.
- **Charter and Part 701.31 applicability.** Pynthia Credit Union's charter type and the applicability of NCUA Part 701.31 (nondiscrimination in real-estate lending) to this enterprise Framework are assumed out of scope here; confirm whether any 701.31 hooks belong in subordinate lending-risk policies rather than this Framework.
- **Severity-to-band mapping.** The mapping between the 5×5 qualitative bands ([ERM-03](#erm-03-risk-scoring-matrix-rating-scale)) and breach severities (Major/Critical) in [ERM-06](#erm-06-risk-appetite-breach-escalation-incident-management) is assumed to be defined in the subordinate risk appetite statements; confirm the canonical crosswalk.
- **Trigger events for Low/Very Low reassessment.** [ERM-04](#erm-04-risk-assessment-register-maintenance) references "trigger events" for off-cycle reassessment of Low/Very Low risks; the definitive list of qualifying triggers is assumed to live in subordinate procedures and must conform to this Framework.
- **Lapsed-acceptance reversion path.** [ERM-07](#erm-07-risk-acceptance-exceptions) assumes a lapsed acceptance reverts to a new breach record via `risk_breach.opened`; confirm whether reversion should reopen the original breach where one exists rather than create a new one.
